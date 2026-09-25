import { Router } from "express";
import { requireAuth } from "../auth.js";
import prisma from "../lib/prisma.js";
import { logApiError } from "../logger.js";
import {
  SUBSCRIPTION_PLANS,
  getOrCreateUserSubscription,
  formatSubscription,
} from "../subscription.js";

const router = Router();

// GET /api/subscription/plans — public listing of server-authoritative plans
router.get("/plans", (_req, res) => {
  const plans = Object.values(SUBSCRIPTION_PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quota: p.quota,
    is_unlimited: p.isUnlimited,
    duration_days: p.durationDays,
    description: p.description,
  }));
  res.json({ plans });
});

// GET /api/subscription/me — current user's subscription details & remaining unlock quota
router.get("/me", requireAuth, async (req, res) => {
  try {
    const sub = await getOrCreateUserSubscription(req.auth.sub);
    const unlockedCount = await prisma.vendorUnlock.count({
      where: { userId: req.auth.sub },
    });

    res.json(formatSubscription(sub, unlockedCount));
  } catch (err) {
    logApiError(err, req);
    res.status(500).json({ message: "Failed to fetch subscription details" });
  }
});

export default router;
