import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../auth.js";
import { getOwnedVendorId } from "../vendorAccess.js";
import { logApiError } from "../logger.js";
import { validateBody, validateQuery, email, shortText, optionalText, money, positiveInt, isoDateString, listQuery } from "../validate.js";

const router = Router();

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Anniversary", "Funeral", "Baby Shower", "Other"];

const createSchema = z.object({
  vendor_id: shortText(200),
  vendor_name: shortText(200),
  category: optionalText(100),
  city: optionalText(100),
  event_type: z.enum(EVENT_TYPES),
  event_date: isoDateString,
  guest_count: positiveInt.optional(),
  client_name: shortText(200),
  client_email: email,
  client_phone: optionalText(30),
  budget: money.optional(),
  notes: optionalText(1000),
}).strict();

const patchSchema = z.object({
  notes: optionalText(1000),
  guest_count: positiveInt.optional(),
  event_date: isoDateString.optional(),
  status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]).optional(),
  paid_amount: money.optional(),
  vendor_id: shortText(200).optional(),
  vendor_name: shortText(200).optional(),
}).strict();

/**
 * Maps a Prisma Booking object to the API response shape (snake_case for
 * frontend compatibility). Prisma Decimal fields converted to Number.
 */
const formatBooking = (b) => {
  if (!b) return null;
  return {
    id: b.id,
    vendor_id: b.vendorId,
    vendor_name: b.vendorName,
    category: b.category,
    city: b.city,
    user_id: b.userId,
    client_name: b.clientName,
    client_email: b.clientEmail,
    client_phone: b.clientPhone,
    planner_name: b.plannerName,
    planner_email: b.plannerEmail,
    planner_phone: b.plannerPhone,
    event_type: b.eventType,
    event_date: b.eventDate,
    guest_count: b.guestCount ?? 0,
    budget: b.budget,
    status: b.status,
    paid_amount: b.paidAmount ? Number(b.paidAmount) : 0,
    commission_amount: b.commissionAmount ? Number(b.commissionAmount) : 0,
    commission_status: b.commissionStatus || "none",
    notes: b.notes,
    created_at: b.createdAt,
    created_date: b.createdAt,
  };
};

// Prisma orderBy field map for bookings
const SORT_FIELD_MAP = {
  event_date: "eventDate",
  created_date: "createdAt",
  status: "status",
};

// Anyone can submit a booking request (optionalAuth allows anonymous)
router.post("/", optionalAuth, validateBody(createSchema), async (req, res) => {
  const id = nanoid();
  const { vendor_id, vendor_name, category, city, event_type, event_date, guest_count, client_name, client_email, client_phone, budget, notes } = req.body;

  // Validate that target vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendor_id },
    select: { id: true, name: true, category: true, city: true, isAvailable: true, blockedDates: true },
  });
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (!vendor.isAvailable) {
    return res.status(400).json({ message: "This vendor is currently not accepting new bookings" });
  }

  if (event_date && Array.isArray(vendor.blockedDates) && vendor.blockedDates.includes(event_date)) {
    return res.status(400).json({ message: "This vendor is unavailable on the selected date" });
  }

  // Prevent email/identity spoofing if authenticated
  const finalClientEmail = req.auth ? req.auth.email : client_email;
  const finalClientName = req.auth ? (req.user?.fullName || client_name) : client_name;
  const userId = req.auth?.sub || null;

  const booking = await prisma.booking.create({
    data: {
      id,
      vendorId: vendor.id,
      vendorName: vendor.name || vendor_name,
      category: category || vendor.category || "",
      city: city || vendor.city || "",
      userId,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      clientPhone: client_phone || "",
      // planner fields mirror client fields on creation
      plannerName: finalClientName,
      plannerEmail: finalClientEmail,
      plannerPhone: client_phone || "",
      eventType: event_type,
      eventDate: event_date ? new Date(event_date) : null,
      guestCount: guest_count || 0,
      budget: budget ? String(budget) : "",
      status: "Pending",
      paidAmount: 0,
      notes: notes || "",
    },
  });

  res.status(201).json(formatBooking(booking));
});

// GET /api/bookings — role-aware listing
router.get("/", requireAuth, validateQuery(listQuery(["event_date", "created_date", "status"])), async (req, res) => {
  try {
    const { sort, limit } = req.query;
    const limitVal = parseInt(limit, 10) || 100;

    let orderBy = { createdAt: "desc" };
    if (sort) {
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.slice(1) : sort;
      const prismaField = SORT_FIELD_MAP[field];
      if (prismaField) orderBy = { [prismaField]: isDesc ? "desc" : "asc" };
    }

    let bookings = [];

    if (req.auth.role === "admin") {
      bookings = await prisma.booking.findMany({ orderBy, take: limitVal });
    } else if (req.user.accountType === "vendor") {
      const ownedVendorId = await getOwnedVendorId(req.auth.sub);
      if (ownedVendorId) {
        bookings = await prisma.booking.findMany({
          where: { vendorId: ownedVendorId },
          orderBy,
          take: limitVal,
        });
      }
    } else {
      // event_planner — own bookings by user_id OR client_email
      bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { userId: req.auth.sub },
            { clientEmail: req.auth.email },
          ],
        },
        orderBy,
        take: limitVal,
      });
    }

    res.json(bookings.map(formatBooking));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/:id — get a single booking (owner, vendor owner, or admin only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isAdmin = req.auth.role === "admin";
    const isPlannerOwner = booking.userId === req.auth.sub || booking.clientEmail === req.auth.email;
    const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
    const isVendorOwner = !!ownedVendorId && booking.vendorId === ownedVendorId;

    if (!isAdmin && !isPlannerOwner && !isVendorOwner) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(formatBooking(booking));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});

const PLANNER_EDITABLE_FIELDS = ["notes", "guest_count", "event_date"];

router.patch("/:id", requireAuth, validateBody(patchSchema), async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const isAdmin = req.auth.role === "admin";
  const isPlannerOwner = booking.userId === req.auth.sub || booking.clientEmail === req.auth.email;
  const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
  const isVendorOwner = !!ownedVendorId && booking.vendorId === ownedVendorId;

  if (!isAdmin && !isPlannerOwner && !isVendorOwner) return res.status(403).json({ message: "Not allowed" });

  if (!isAdmin && req.body?.status) {
    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Cancelled bookings cannot be modified" });
    }
    if (booking.status === "Completed") {
      return res.status(400).json({ message: "Completed bookings cannot be modified" });
    }
    if (isPlannerOwner && req.body.status !== "Cancelled") {
      return res.status(403).json({ message: "You can only cancel your own booking directly" });
    }
    if (isVendorOwner && !["Confirmed", "Cancelled"].includes(req.body.status)) {
      return res.status(403).json({ message: "You can only confirm or decline a request" });
    }
  }

  // Build the Prisma update data object using only allowed fields
  const allowed = isAdmin
    ? ["notes", "guest_count", "event_date", "status", "paid_amount", "vendor_id", "vendor_name"]
    : isVendorOwner
    ? ["status"]
    : PLANNER_EDITABLE_FIELDS.concat(isPlannerOwner ? ["status"] : []);

  // Map incoming snake_case fields to Prisma camelCase field names
  const FIELD_MAP = {
    notes: "notes",
    guest_count: "guestCount",
    event_date: "eventDate",
    status: "status",
    paid_amount: "paidAmount",
    vendor_id: "vendorId",
    vendor_name: "vendorName",
  };

  const updateData = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      const prismaField = FIELD_MAP[field];
      if (prismaField) {
        let value = req.body[field];
        // Convert event_date string to Date object
        if (field === "event_date" && value) value = new Date(value);
        updateData[prismaField] = value;
      }
    }
  }

  // Commission calculation: auto-apply when status changes to Confirmed
  if (req.body.status === "Confirmed" && booking.status !== "Confirmed") {
    const rawBudget = booking.budget || req.body.budget || "0";
    const numericBudget = parseFloat(String(rawBudget).replace(/[^0-9.]/g, "")) || 0;

    const vendor = await prisma.vendor.findUnique({
      where: { id: booking.vendorId },
      select: { commissionRate: true },
    });
    const rate = vendor?.commissionRate ? Number(vendor.commissionRate) : 8.0;
    const commAmount = (numericBudget * rate) / 100;

    updateData.commissionAmount = commAmount;
    updateData.commissionStatus = "pending";
  }

  if (Object.keys(updateData).length === 0) {
    return res.json(formatBooking(booking));
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(formatBooking(updated));
});

export default router;
