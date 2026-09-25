import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../auth.js";
import { getOwnedVendorId } from "../vendorAccess.js";
import { logApiError } from "../logger.js";
import { validateBody, validateQuery, email, shortText, optionalText, listQuery } from "../validate.js";

const router = Router();

const createSchema = z.object({
  vendor_id: shortText(200).optional(),
  name: shortText(200),
  email,
  phone: optionalText(30),
  message: shortText(2000),
  event_type: optionalText(50),
  status: optionalText(50),
}).strict();

const patchSchema = z.object({
  status: z.enum(["New", "In Review", "Replied", "Closed", "Archived"]),
}).strict();

/**
 * Maps a Prisma Inquiry to the API response shape (snake_case).
 */
const formatInquiry = (i) => {
  if (!i) return null;
  return {
    id: i.id,
    vendor_id: i.vendorId,
    user_id: i.userId,
    name: i.name,
    email: i.email,
    phone: i.phone,
    message: i.message,
    event_type: i.eventType,
    status: i.status,
    created_at: i.createdAt,
    created_date: i.createdAt,
  };
};

// Prisma orderBy field map for inquiries
const SORT_FIELD_MAP = {
  created_date: "createdAt",
  created_at: "createdAt",
  status: "status",
};

// Submit inquiry — supports optional auth to bind verified identity
router.post("/", optionalAuth, validateBody(createSchema), async (req, res) => {
  const id = nanoid();
  const { vendor_id, name, email: emailAddr, phone, message, event_type } = req.body;

  let validatedVendorId = null;
  if (vendor_id) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendor_id },
      select: { id: true },
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    validatedVendorId = vendor.id;
  }

  // Prevent identity spoofing if authenticated
  const finalEmail = req.auth ? req.auth.email : emailAddr;
  const finalName = req.auth ? (req.user?.fullName || name) : name;
  const userId = req.auth?.sub || null;

  const inquiry = await prisma.inquiry.create({
    data: {
      id,
      vendorId: validatedVendorId,
      userId,
      name: finalName,
      email: finalEmail,
      phone: phone || "",
      message,
      eventType: event_type || "",
      status: "New",
    },
  });

  res.status(201).json(formatInquiry(inquiry));
});

// Role-aware inquiry listing
router.get("/", requireAuth, validateQuery(listQuery(["created_date", "status"])), async (req, res) => {
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

    let inquiries = [];
    if (req.auth.role === "admin") {
      inquiries = await prisma.inquiry.findMany({ orderBy, take: limitVal });
    } else if (req.user.accountType === "vendor") {
      const ownedVendorId = await getOwnedVendorId(req.auth.sub);
      if (ownedVendorId) {
        inquiries = await prisma.inquiry.findMany({
          where: { vendorId: ownedVendorId },
          orderBy,
          take: limitVal,
        });
      }
    } else {
      inquiries = await prisma.inquiry.findMany({
        where: {
          OR: [
            { userId: req.auth.sub },
            { email: req.auth.email },
          ],
        },
        orderBy,
        take: limitVal,
      });
    }

    res.json(inquiries.map(formatInquiry));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch inquiries" });
  }
});

// GET /api/inquiries/:id — get a single inquiry (creator, vendor owner, or admin only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    const isAdmin = req.auth.role === "admin";
    const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
    const isVendorOwner = !!ownedVendorId && inquiry.vendorId === ownedVendorId;
    const isCreator = inquiry.userId === req.auth.sub || inquiry.email === req.auth.email;

    if (!isAdmin && !isVendorOwner && !isCreator) {
      return res.status(403).json({ message: "Not authorized to view this inquiry" });
    }

    res.json(formatInquiry(inquiry));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch inquiry" });
  }
});

// PATCH /api/inquiries/:id — update inquiry status
router.patch("/:id", requireAuth, validateBody(patchSchema), async (req, res) => {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

  const isAdmin = req.auth.role === "admin";
  const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
  const isVendorOwner = !!ownedVendorId && inquiry.vendorId === ownedVendorId;
  const isCreator = inquiry.userId === req.auth.sub || inquiry.email === req.auth.email;

  if (!isAdmin && !isVendorOwner && !isCreator) {
    return res.status(403).json({ message: "Not authorized to update this inquiry" });
  }

  const updated = await prisma.inquiry.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });

  res.json(formatInquiry(updated));
});

export default router;
