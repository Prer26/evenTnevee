import { nanoid } from "nanoid";
import prisma from "./lib/prisma.js";

/**
 * Authoritative server-side plan definitions.
 * Client requests must NEVER dictate plan pricing, quotas, or access tiers.
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    quota: 0,
    isUnlimited: false,
    durationDays: 365,
    description: "Baseline / free access",
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 4000,
    quota: 15,
    isUnlimited: false,
    durationDays: 30,
    description: "15 vendor contact unlocks",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 6500,
    quota: 35,
    isUnlimited: false,
    durationDays: 30,
    description: "35 vendor contact unlocks",
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 10000,
    quota: -1, // unlimited
    isUnlimited: true,
    durationDays: 365,
    description: "Unlimited vendor contact unlocks",
  },
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

/**
 * Retrieves the current subscription for a user, or initializes a default FREE record.
 * Automatically checks and transitions expired subscriptions to EXPIRED.
 */
export async function getOrCreateUserSubscription(userId) {
  if (!userId) return null;

  let sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    const planDef = SUBSCRIPTION_PLANS.FREE;
    sub = await prisma.subscription.create({
      data: {
        id: nanoid(),
        userId,
        plan: planDef.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        amount: planDef.price,
        quota: planDef.quota,
        usedUnlocks: 0,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + planDef.durationDays * 24 * 60 * 60 * 1000),
      },
    });
    return sub;
  }

  // Check if subscription has expired
  if (sub.status === SUBSCRIPTION_STATUS.ACTIVE && sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SUBSCRIPTION_STATUS.EXPIRED },
    });
  }

  return sub;
}

/**
 * Public API serialization of user subscription details.
 */
export function formatSubscription(sub, totalUnlockedVendors = 0) {
  if (!sub) return null;

  const planDef = SUBSCRIPTION_PLANS[sub.plan] || SUBSCRIPTION_PLANS.FREE;
  const isUnlimited = planDef.isUnlimited || sub.quota === -1;
  const isExpired = sub.expiryDate ? new Date(sub.expiryDate) < new Date() : false;
  const isActive = sub.status === SUBSCRIPTION_STATUS.ACTIVE && !isExpired;
  const remaining = isUnlimited ? -1 : Math.max(0, sub.quota - sub.usedUnlocks);

  return {
    id: sub.id,
    user_id: sub.userId,
    plan: sub.plan,
    plan_name: planDef.name,
    status: isExpired && sub.status === SUBSCRIPTION_STATUS.ACTIVE ? SUBSCRIPTION_STATUS.EXPIRED : sub.status,
    is_active: isActive,
    price: sub.amount ? Number(sub.amount) : planDef.price,
    quota: sub.quota,
    used_unlocks: sub.usedUnlocks,
    remaining_unlocks: remaining,
    is_unlimited: isUnlimited,
    start_date: sub.startDate,
    expiry_date: sub.expiryDate,
    total_unlocked_vendors: totalUnlockedVendors,
  };
}

/**
 * Performs an atomic vendor contact unlock for a user.
 *
 * Checks:
 * 1. Has the user already unlocked this vendor? If yes, returns without consuming quota.
 * 2. Does the user have an active subscription?
 * 3. Is there remaining quota (or is it an unlimited plan)?
 * 4. Atomically records the unlock and increments used_unlocks in a Prisma transaction.
 */
export async function unlockVendorContact(userId, vendorId) {
  if (!userId || !vendorId) {
    throw Object.assign(new Error("User ID and Vendor ID are required"), { statusCode: 400 });
  }

  // 1. Fast path: check existing unlock outside transaction first
  const existing = await prisma.vendorUnlock.findUnique({
    where: { userId_vendorId: { userId, vendorId } },
  });
  if (existing) {
    return { success: true, alreadyUnlocked: true };
  }

  // 2. Fetch or initialize user's subscription
  const sub = await getOrCreateUserSubscription(userId);
  const planDef = SUBSCRIPTION_PLANS[sub.plan] || SUBSCRIPTION_PLANS.FREE;
  const isUnlimited = planDef.isUnlimited || sub.quota === -1;
  const isExpired = sub.expiryDate ? new Date(sub.expiryDate) < new Date() : false;

  if (sub.status !== SUBSCRIPTION_STATUS.ACTIVE || isExpired) {
    const error = new Error(
      isExpired
        ? "Your subscription has expired. Please renew to unlock vendor contacts."
        : `Your subscription is ${sub.status.toLowerCase()}. Please activate a plan to unlock vendor contacts.`
    );
    error.statusCode = 403;
    error.code = isExpired ? "subscription_expired" : "subscription_inactive";
    throw error;
  }

  // Check quota before entering transaction
  if (!isUnlimited && sub.usedUnlocks >= sub.quota) {
    const error = new Error(
      sub.quota === 0
        ? "A paid subscription is required to unlock vendor contacts."
        : `You have reached your vendor contact unlock quota (${sub.quota} unlocks). Please upgrade your plan for more unlocks.`
    );
    error.statusCode = 403;
    error.code = sub.quota === 0 ? "subscription_required" : "quota_exhausted";
    throw error;
  }

  // 3. Atomically execute unlock & quota increment in a Prisma transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-check existing unlock within transaction (guards against concurrent double-requests)
      const concurrentUnlock = await tx.vendorUnlock.findUnique({
        where: { userId_vendorId: { userId, vendorId } },
      });
      if (concurrentUnlock) {
        return { success: true, alreadyUnlocked: true };
      }

      // Re-verify quota atomically within transaction
      if (!isUnlimited) {
        const currentSub = await tx.subscription.findUnique({
          where: { id: sub.id },
        });

        if (currentSub.usedUnlocks >= currentSub.quota) {
          const quotaErr = new Error(
            `You have reached your vendor contact unlock quota (${currentSub.quota} unlocks).`
          );
          quotaErr.statusCode = 403;
          quotaErr.code = "quota_exhausted";
          throw quotaErr;
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: { usedUnlocks: { increment: 1 } },
        });
      }

      const newUnlock = await tx.vendorUnlock.create({
        data: {
          id: nanoid(),
          userId,
          vendorId,
          subscriptionId: sub.id,
        },
      });

      return { success: true, alreadyUnlocked: false, unlockId: newUnlock.id };
    });

    return result;
  } catch (err) {
    // Handle unique constraint race condition gracefully
    if (err.code === "P2002") {
      return { success: true, alreadyUnlocked: true };
    }
    throw err;
  }
}

/**
 * Authoritative, atomic server-side subscription activation.
 * Enforces server-defined pricing, quotas, and expiry periods from SUBSCRIPTION_PLANS.
 * Idempotently prevents duplicate activations, quota resets, and duplicate records.
 */
export async function activateUserSubscription({
  userId,
  planId,
  orderReference,
  paymentId,
  eventId,
  tx = null,
}) {
  if (!userId) {
    throw Object.assign(new Error("User ID is required"), { statusCode: 400 });
  }

  const planDef = SUBSCRIPTION_PLANS[planId];
  if (!planDef || planId === "FREE") {
    throw Object.assign(new Error(`Invalid or non-payable plan: ${planId}`), { statusCode: 400 });
  }

  const executeActivation = async (client) => {
    // 1. Verify user exists
    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error("User not found for subscription activation"), { statusCode: 404 });
    }

    // 2. Idempotency check A: check if eventId already processed
    if (eventId) {
      const existingEvent = await client.paymentEvent.findUnique({
        where: { eventId },
      });
      if (existingEvent && existingEvent.status === "processed") {
        const currentSub = await client.subscription.findUnique({ where: { userId } });
        return { success: true, alreadyProcessed: true, subscription: currentSub };
      }
    }

    // 3. Idempotency check B: check if paymentId already processed in payment_events
    if (paymentId) {
      const existingPayment = await client.paymentEvent.findFirst({
        where: { paymentId, status: "processed" },
      });
      if (existingPayment) {
        const currentSub = await client.subscription.findUnique({ where: { userId } });
        return { success: true, alreadyProcessed: true, subscription: currentSub };
      }
    }

    // 4. Idempotency check C: check if subscription already active with this orderReference
    if (orderReference) {
      const currentSub = await client.subscription.findUnique({ where: { userId } });
      if (
        currentSub &&
        currentSub.orderReference === orderReference &&
        currentSub.status === SUBSCRIPTION_STATUS.ACTIVE &&
        currentSub.plan === planDef.id
      ) {
        return { success: true, alreadyProcessed: true, subscription: currentSub };
      }
    }

    // 5. Server-authoritative dates
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + planDef.durationDays * 24 * 60 * 60 * 1000);

    // 6. Upsert subscription with authoritative plan details
    const subscription = await client.subscription.upsert({
      where: { userId },
      create: {
        id: nanoid(),
        userId,
        plan: planDef.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        amount: planDef.price,
        quota: planDef.quota,
        usedUnlocks: 0,
        startDate,
        expiryDate,
        orderReference: orderReference || null,
      },
      update: {
        plan: planDef.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        amount: planDef.price,
        quota: planDef.quota,
        usedUnlocks: 0,
        startDate,
        expiryDate,
        orderReference: orderReference || null,
      },
    });

    // 7. Record payment event for idempotency & audit trail
    if (eventId || paymentId || orderReference) {
      const refEventId = eventId || (paymentId ? `pay_${paymentId}` : `order_${orderReference}`);
      await client.paymentEvent.upsert({
        where: { eventId: refEventId },
        create: {
          id: nanoid(),
          eventId: refEventId,
          eventType: "subscription.activated",
          orderId: orderReference || null,
          paymentId: paymentId || null,
          userId,
          status: "processed",
          payload: { plan: planDef.id, amount: planDef.price },
        },
        update: {
          status: "processed",
        },
      });
    }

    // 8. Create financial transaction record for user history
    await client.transaction.create({
      data: {
        id: nanoid(),
        userId,
        vendor: `evenTneve ${planDef.name} Subscription`,
        amount: planDef.price,
        type: "Payment",
        category: "Subscription",
        description: `${planDef.name} Plan - ${planDef.quota === -1 ? "Unlimited" : planDef.quota} unlocks (${planDef.durationDays} days)`,
        status: "Cleared",
        razorpayOrderId: orderReference || null,
        razorpayPaymentId: paymentId || null,
      },
    });

    return { success: true, alreadyProcessed: false, subscription };
  };

  if (tx) {
    return executeActivation(tx);
  } else {
    return prisma.$transaction(executeActivation);
  }
}

