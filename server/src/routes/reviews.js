import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../auth.js";
import { getOwnedVendorId } from "../vendorAccess.js";
import { logApiError } from "../logger.js";
import { validateBody, shortText } from "../validate.js";

const router = Router();

const createReviewSchema = z.object({
  booking_id: shortText(200),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
}).strict();

/**
 * Maps a Prisma Review to the API response shape (snake_case).
 */
const formatReview = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    booking_id: r.bookingId,
    vendor_id: r.vendorId,
    user_id: r.userId,
    planner_name: r.plannerName,
    rating: r.rating ? Number(r.rating) : 0,
    comment: r.comment,
    created_at: r.createdAt,
    created_date: r.createdAt,
  };
};

// POST /api/reviews — planner submits a review for a completed booking
router.post("/", requireAuth, validateBody(createReviewSchema), async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: booking_id } });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isOwner = booking.userId === req.auth.sub || booking.clientEmail === req.auth.email;
    const isAdmin = req.auth.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can only review your own bookings" });
    }

    const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
    if (ownedVendorId && ownedVendorId === booking.vendorId) {
      return res.status(403).json({ message: "Vendors cannot review their own services" });
    }

    if (booking.status !== "Completed") {
      return res.status(400).json({ message: "Reviews can only be submitted after a booking's status is Completed" });
    }

    // Enforce one review per booking (bookingId is UNIQUE in DB + Prisma schema)
    const existingReview = await prisma.review.findUnique({ where: { bookingId: booking_id } });
    if (existingReview) {
      return res.status(409).json({ message: "A review has already been submitted for this completed booking" });
    }

    const id = nanoid();
    const plannerName = booking.clientName || booking.plannerName || req.user.fullName || req.user.email;

    // Use Prisma transaction to atomically insert review + update vendor aggregates
    const [review] = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          id,
          bookingId: booking_id,
          vendorId: booking.vendorId,
          userId: req.auth.sub,
          plannerName,
          rating,
          comment: comment || "",
        },
      });

      // Recalculate vendor's aggregate rating
      const allReviews = await tx.review.findMany({
        where: { vendorId: booking.vendorId },
        select: { rating: true },
      });

      const totalReviews = allReviews.length;
      const avgRating = totalReviews > 0
        ? allReviews.reduce((acc, r) => acc + Number(r.rating), 0) / totalReviews
        : rating;

      await tx.vendor.update({
        where: { id: booking.vendorId },
        data: {
          rating: Number(avgRating.toFixed(2)),
          reviews: totalReviews,
        },
      });

      return [newReview];
    });

    res.status(201).json(formatReview(review));
  } catch (err) {
    // Handle unique constraint violation gracefully (race condition)
    if (err.code === "P2002") {
      return res.status(409).json({ message: "A review has already been submitted for this completed booking" });
    }
    logApiError(err, req);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

// GET /api/reviews/:id — fetch single review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(formatReview(review));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch review" });
  }
});

// GET /api/reviews/vendor/:id — public reviews listing for a vendor
router.get("/vendor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
    });

    const formatted = reviews.map(formatReview);
    const totalReviews = formatted.length;
    const avgRating = totalReviews > 0
      ? formatted.reduce((acc, r) => acc + Number(r.rating), 0) / totalReviews
      : 5.0;

    res.json({
      reviews: formatted,
      average_rating: Number(avgRating.toFixed(2)),
      total_reviews: totalReviews,
    });
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

export default router;
