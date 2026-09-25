import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../auth.js";
import { getOwnedVendorId } from "../vendorAccess.js";
import { logApiError } from "../logger.js";
import { validateBody, validateQuery, shortText, optionalText } from "../validate.js";

const router = Router();

const threadKey = (vendorId, userId) => `${vendorId}::${userId}`;

const sendSchema = z.object({
  vendor_id: shortText(200),
  vendor_name: optionalText(200),
  body: shortText(2000),
}).strict();

const replySchema = z.object({
  vendor_id: shortText(200),
  vendor_name: optionalText(200),
  user_id: shortText(200),
  body: shortText(2000),
}).strict();

const threadQuerySchema = z.object({
  vendor_id: shortText(200),
  user_id: shortText(200).optional(),
}).strict();

/**
 * Maps a Prisma Message to the API response shape (snake_case).
 */
const formatMessage = (m) => {
  if (!m) return null;
  return {
    id: m.id,
    vendor_id: m.vendorId,
    vendor_name: m.vendorName,
    user_id: m.userId,
    user_name: m.userName,
    sender: m.sender,
    body: m.body,
    created_at: m.createdAt,
    created_date: m.createdAt,
  };
};

// Client sends a message to a vendor
router.post("/", requireAuth, validateBody(sendSchema), async (req, res) => {
  const { vendor_id, vendor_name, body } = req.body;

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendor_id },
    select: { id: true, name: true },
  });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const id = nanoid();
  const userName = req.user?.fullName || req.user?.email || "Client";

  const message = await prisma.message.create({
    data: {
      id,
      vendorId: vendor.id,
      vendorName: vendor.name || vendor_name || "",
      userId: req.auth.sub,
      userName,
      sender: "client",
      body,
    },
  });

  res.status(201).json(formatMessage(message));
});

// Vendor or admin replies to a planner's message
router.post("/reply", requireAuth, validateBody(replySchema), async (req, res) => {
  const isAdmin = req.auth.role === "admin";
  const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
  const isVendorOwner = !!ownedVendorId && ownedVendorId === req.body.vendor_id;

  if (!isAdmin && !isVendorOwner) {
    return res.status(403).json({ message: "You can only reply to your own conversations" });
  }

  const { vendor_id, vendor_name, user_id, body } = req.body;

  // Look up the planner's display name for the thread
  const plannerUser = await prisma.user.findUnique({
    where: { id: user_id },
    select: { fullName: true, email: true },
  });
  if (!plannerUser) return res.status(404).json({ message: "User not found" });

  const id = nanoid();
  const userName = plannerUser?.fullName || plannerUser?.email || "Client";

  const message = await prisma.message.create({
    data: {
      id,
      vendorId: vendor_id,
      vendorName: vendor_name || "",
      userId: user_id,
      userName,
      sender: "vendor",
      body,
    },
  });

  res.status(201).json(formatMessage(message));
});

// GET /api/messages/threads — grouped by (vendor_id, user_id) pair
router.get("/threads", requireAuth, async (req, res) => {
  try {
    let messages = [];

    if (req.auth.role === "admin") {
      messages = await prisma.message.findMany({ orderBy: { createdAt: "asc" } });
    } else if (req.user.accountType === "vendor") {
      const ownedVendorId = await getOwnedVendorId(req.auth.sub);
      if (ownedVendorId) {
        messages = await prisma.message.findMany({
          where: { vendorId: ownedVendorId },
          orderBy: { createdAt: "asc" },
        });
      }
    } else {
      messages = await prisma.message.findMany({
        where: { userId: req.auth.sub },
        orderBy: { createdAt: "asc" },
      });
    }

    const byThread = new Map();
    for (const m of messages) {
      const fmt = formatMessage(m);
      const key = threadKey(fmt.vendor_id, fmt.user_id);
      const existing = byThread.get(key);
      if (!existing || new Date(fmt.created_date) > new Date(existing.last_message.created_date)) {
        byThread.set(key, {
          vendor_id: fmt.vendor_id,
          vendor_name: fmt.vendor_name,
          user_id: fmt.user_id,
          user_name: fmt.user_name || existing?.user_name || "Client",
          last_message: fmt,
        });
      }
    }

    const threads = [...byThread.values()].sort(
      (a, b) => new Date(b.last_message.created_date) - new Date(a.last_message.created_date)
    );
    res.json(threads);
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch message threads" });
  }
});

// GET /api/messages/thread — all messages for a specific (vendor, user) pair
router.get("/thread", requireAuth, validateQuery(threadQuerySchema), async (req, res) => {
  const { vendor_id, user_id } = req.query;
  const isAdmin = req.auth.role === "admin";
  const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
  const isVendorOwner = !!ownedVendorId && ownedVendorId === vendor_id;

  if (req.user.accountType === "vendor" && !isVendorOwner && !isAdmin) {
    return res.status(403).json({ message: "You can only view threads for your own vendor listing" });
  }

  let targetUserId;
  if (isAdmin) {
    targetUserId = user_id || req.auth.sub;
  } else if (isVendorOwner) {
    if (!user_id) return res.status(400).json({ message: "user_id is required to view this thread" });
    targetUserId = user_id;
  } else {
    targetUserId = req.auth.sub;
  }

  const messages = await prisma.message.findMany({
    where: { vendorId: vendor_id, userId: targetUserId },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages.map(formatMessage));
});

// GET /api/messages/:id — get a single message (participant, vendor owner, or admin only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const msg = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const isAdmin = req.auth.role === "admin";
    const ownedVendorId = req.user.accountType === "vendor" ? await getOwnedVendorId(req.auth.sub) : null;
    const isVendorOwner = !!ownedVendorId && msg.vendorId === ownedVendorId;
    const isUser = msg.userId === req.auth.sub;

    if (!isAdmin && !isVendorOwner && !isUser) {
      return res.status(403).json({ message: "Not authorized to view this message" });
    }

    res.json(formatMessage(msg));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch message" });
  }
});

export default router;
