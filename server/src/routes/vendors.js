import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../auth.js";
import { unlockVendorContact } from "../subscription.js";
import { logApiError } from "../logger.js";
import { validateBody, validateQuery, shortText, optionalText, email as emailSchema, listQuery } from "../validate.js";

const router = Router();

const createSchema = z.object({
  name: shortText(200),
  category: shortText(100),
  city: shortText(100),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviews: z.coerce.number().int().nonnegative().optional(),
  price: optionalText(100),
  priceValue: z.coerce.number().nonnegative().optional(),
  description: optionalText(2000),
  services: z.array(shortText(100)).max(30).optional(),
  gallery: z.array(z.string().url().max(1000)).max(30).optional(),
  responseTime: optionalText(100),
  availability: optionalText(100),
  verified: z.boolean().optional(),
  image: z.string().url().max(1000).optional(),
}).strict();

const serviceOfferingSchema = z.object({
  name: shortText(150),
  description: optionalText(1000),
  price_range: shortText(100),
}).strict();

const selfServiceSchema = z.object({
  name: shortText(200),
  city: shortText(100),
  category: shortText(100),
  description: optionalText(2000).optional(),
  service_offerings: z.array(serviceOfferingSchema).max(30).default([]),
  contact: z.object({
    phone: optionalText(30),
    email: emailSchema.optional(),
    whatsapp: optionalText(30),
  }).strict().default({}),
  gallery: z.array(z.string().url().max(1000)).max(30).default([]),
  is_available: z.boolean().default(true),
}).strict();

/**
 * Maps a Prisma Vendor object to the API response shape.
 * - Preserves snake_case API field names for frontend compatibility.
 * - Converts Prisma Decimal to Number for JSON serialization.
 * - Strips contact unless includeContact = true (vendor contact gating).
 */
const formatVendor = (v, includeContact = false) => {
  if (!v) return null;

  // contact is already a JS object from Prisma (JSONB → Json type)
  const parsedContact = v.contact && typeof v.contact === "object" ? v.contact : {};

  const formatted = {
    id: v.id,
    user_id: v.userId,
    owner_user_id: v.userId,
    name: v.name,
    category: v.category,
    city: v.city,
    rating: v.rating ? Number(v.rating) : 5.0,
    reviews: v.reviews ?? 0,
    price: v.price,
    price_value: v.priceValue ? Number(v.priceValue) : 0,
    priceValue: v.priceValue ? Number(v.priceValue) : 0,
    description: v.description,
    services: Array.isArray(v.services) ? v.services : [],
    service_offerings: Array.isArray(v.serviceOfferings) ? v.serviceOfferings : [],
    gallery: Array.isArray(v.gallery) ? v.gallery : [],
    response_time: v.responseTime,
    responseTime: v.responseTime,
    availability: v.availability,
    verified: v.verified,
    is_available: v.isAvailable,
    match: v.match,
    image: v.image,
    accent: v.accent,
    review: v.review,
    blocked_dates: Array.isArray(v.blockedDates) ? v.blockedDates : [],
    commission_rate: v.commissionRate ? Number(v.commissionRate) : 8.0,
    created_at: v.createdAt,
    created_date: v.createdAt,
  };

  if (includeContact) {
    formatted.contact = parsedContact;
  }
  // When includeContact = false, contact is simply not included (never leaked)

  return formatted;
};

// Prisma orderBy field mapping (validated sort fields → Prisma field names)
const SORT_FIELD_MAP = {
  rating: "rating",
  name: "name",
  priceValue: "priceValue",
  created_date: "createdAt",
  reviews: "reviews",
};

// GET /api/vendors (public list — contact omitted)
router.get("/", validateQuery(listQuery(["rating", "name", "priceValue", "created_date", "reviews"])), async (req, res) => {
  try {
    const { sort, limit } = req.query;
    const limitVal = parseInt(limit, 10) || 100;

    let orderBy = { createdAt: "desc" };
    if (sort) {
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.slice(1) : sort;
      const prismaField = SORT_FIELD_MAP[field];
      if (prismaField) {
        orderBy = { [prismaField]: isDesc ? "desc" : "asc" };
      }
    }

    const vendors = await prisma.vendor.findMany({
      orderBy,
      take: limitVal,
    });

    res.json(vendors.map((v) => formatVendor(v, false)));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/me — logged-in vendor's own profile (contact included)
router.get("/me", requireAuth, async (req, res) => {
  if (req.user.accountType !== "vendor") {
    return res.status(403).json({ message: "Vendor accounts only" });
  }
  const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (!vendor) return res.status(404).json({ message: "No vendor profile yet" });
  res.json(formatVendor(vendor, true));
});

// POST /api/vendors/me
router.post("/me", requireAuth, validateBody(selfServiceSchema), async (req, res) => {
  if (req.user.accountType !== "vendor") {
    return res.status(403).json({ message: "Vendor accounts only" });
  }

  const existing = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (existing) {
    return res.status(409).json({ message: "Vendor profile already exists — use PUT to update it" });
  }

  const { service_offerings, name, city, category, description, contact, gallery, is_available } = req.body;
  const services = service_offerings.map((s) => s.name);
  const id = nanoid();

  const vendor = await prisma.vendor.create({
    data: {
      id,
      userId: req.user.id,
      name,
      city,
      category,
      description: description || "",
      services,
      serviceOfferings: service_offerings,
      contact,
      gallery,
      isAvailable: is_available ?? true,
      rating: 0,
      reviews: 0,
    },
  });

  res.status(201).json(formatVendor(vendor, true));
});

// PUT /api/vendors/me
router.put("/me", requireAuth, validateBody(selfServiceSchema), async (req, res) => {
  if (req.user.accountType !== "vendor") {
    return res.status(403).json({ message: "Vendor accounts only" });
  }

  const existing = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (!existing) {
    return res.status(404).json({ message: "No vendor profile yet — create one first" });
  }

  const { service_offerings, name, city, category, description, contact, gallery, is_available } = req.body;
  const services = service_offerings.map((s) => s.name);

  const vendor = await prisma.vendor.update({
    where: { id: existing.id },
    data: {
      name,
      city,
      category,
      description: description || "",
      services,
      serviceOfferings: service_offerings,
      contact,
      gallery,
      isAvailable: is_available ?? true,
    },
  });

  res.json(formatVendor(vendor, true));
});

// PATCH /api/vendors/me/availability
const availabilityToggleSchema = z.object({ is_available: z.boolean() }).strict();
router.patch("/me/availability", requireAuth, validateBody(availabilityToggleSchema), async (req, res) => {
  if (req.user.accountType !== "vendor") {
    return res.status(403).json({ message: "Vendor accounts only" });
  }

  const existing = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "No vendor profile yet" });

  const vendor = await prisma.vendor.update({
    where: { id: existing.id },
    data: { isAvailable: req.body.is_available },
  });

  res.json(formatVendor(vendor, true));
});

// PATCH /api/vendors/me/blocked-dates
const blockedDatesSchema = z.object({ blocked_dates: z.array(z.string()) }).strict();
router.patch("/me/blocked-dates", requireAuth, validateBody(blockedDatesSchema), async (req, res) => {
  if (req.user.accountType !== "vendor") {
    return res.status(403).json({ message: "Vendor accounts only" });
  }

  const existing = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "No vendor profile yet" });

  const vendor = await prisma.vendor.update({
    where: { id: existing.id },
    data: { blockedDates: req.body.blocked_dates },
  });

  res.json(formatVendor(vendor, true));
});

// GET /api/vendors/:id/blocked-dates — public check for vendor's blocked dates
router.get("/:id/blocked-dates", async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    select: { blockedDates: true },
  });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  const dates = Array.isArray(vendor.blockedDates) ? vendor.blockedDates : [];
  res.json({ blocked_dates: dates });
});

// GET /api/vendors/:id/contact — gated: requires auth + (admin | owner | confirmed booking | subscription unlock)
router.get("/:id/contact", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const contact = vendor.contact && typeof vendor.contact === "object" ? vendor.contact : {};

    // 1. Admin bypass: full access, no unlock/quota required
    if (req.auth.role === "admin") {
      return res.json({ contact, access_type: "admin" });
    }

    // 2. Vendor owner bypass: can always view their own contact details
    if (vendor.userId === req.auth.sub) {
      return res.json({ contact, access_type: "owner" });
    }

    // 3. Confirmed booking bypass: clients with Confirmed bookings access contact without quota
    const confirmedBooking = await prisma.booking.findFirst({
      where: {
        vendorId: id,
        status: "Confirmed",
        OR: [
          { userId: req.auth.sub },
          { clientEmail: req.auth.email },
        ],
      },
    });
    if (confirmedBooking) {
      return res.json({ contact, access_type: "confirmed_booking" });
    }

    // 4. Subscription-based contact unlock for planners/users
    try {
      const unlockResult = await unlockVendorContact(req.auth.sub, vendor.id);
      return res.json({
        contact,
        access_type: "subscription_unlock",
        unlocked: true,
        already_unlocked: !!unlockResult.alreadyUnlocked,
      });
    } catch (unlockErr) {
      return res.status(unlockErr.statusCode || 403).json({
        message: unlockErr.message || "Failed to unlock vendor contact",
        code: unlockErr.code || "subscription_required",
      });
    }
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to retrieve vendor contact" });
  }
});

// GET /api/vendors/:id — public single vendor (contact omitted)
router.get("/:id", async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(formatVendor(vendor, false));
});

// Admin-only POST /api/vendors
router.post("/", requireAuth, validateBody(createSchema), async (req, res) => {
  if (req.auth.role !== "admin") return res.status(403).json({ message: "Admin only" });
  const id = nanoid();
  const { name, category, city, rating, reviews, price, priceValue, description, services, gallery, responseTime, availability, verified, image } = req.body;

  const vendor = await prisma.vendor.create({
    data: {
      id,
      name,
      category,
      city,
      rating: rating ?? 5.0,
      reviews: reviews ?? 0,
      price: price || "",
      priceValue: priceValue ?? 0,
      description: description || "",
      services: services || [],
      gallery: gallery || [],
      responseTime: responseTime || "",
      availability: availability || "",
      verified: verified ?? false,
      image: image || "",
    },
  });

  res.status(201).json(formatVendor(vendor, false));
});

export default router;
