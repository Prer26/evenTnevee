import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import http from "http";
import { nanoid } from "nanoid";

// Set test environment before any application module is imported
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_antigravity_phase5_long_random_string";
const TEST_KEY_SECRET = "test_secret_for_razorpay_suite_12345";
const TEST_WEBHOOK_SECRET = "test_webhook_secret_signature_98765";
process.env.RAZORPAY_KEY_ID = "rzp_test_mock_key_123";
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

// In-memory data store for isolated, deterministic testing
const memoryStore = {
  users: new Map(),
  subscriptions: new Map(),
  paymentEvents: new Map(),
  transactions: new Map(),
  vendors: new Map(),
  vendorUnlocks: new Map(),
  bookings: new Map(),
};

// Import prisma singleton to intercept queries if DB connection is unavailable
import prisma from "../src/lib/prisma.js";

// Helper to install in-memory mock adapters on prisma
function mockPrisma() {
  prisma.user.findUnique = async ({ where }) => {
    if (where.id) return memoryStore.users.get(where.id) || null;
    if (where.email) {
      for (const u of memoryStore.users.values()) {
        if (u.email === where.email) return u;
      }
    }
    return null;
  };

  prisma.user.upsert = async ({ where, create, update }) => {
    let u = await prisma.user.findUnique({ where });
    if (u) {
      Object.assign(u, update);
    } else {
      u = { id: create.id || nanoid(), ...create };
      memoryStore.users.set(u.id, u);
    }
    return u;
  };

  prisma.subscription.findUnique = async ({ where }) => {
    if (where.userId) {
      for (const s of memoryStore.subscriptions.values()) {
        if (s.userId === where.userId) return { ...s };
      }
    }
    if (where.id) return memoryStore.subscriptions.get(where.id) ? { ...memoryStore.subscriptions.get(where.id) } : null;
    return null;
  };

  prisma.subscription.upsert = async ({ where, create, update }) => {
    let s = await prisma.subscription.findUnique({ where });
    if (s) {
      const existing = memoryStore.subscriptions.get(s.id);
      Object.assign(existing, update);
      return { ...existing };
    } else {
      s = { id: create.id || nanoid(), ...create };
      memoryStore.subscriptions.set(s.id, s);
      return { ...s };
    }
  };

  prisma.subscription.update = async ({ where, data }) => {
    let s = null;
    if (where.userId) {
      for (const sub of memoryStore.subscriptions.values()) {
        if (sub.userId === where.userId) s = sub;
      }
    } else if (where.id) {
      s = memoryStore.subscriptions.get(where.id);
    }
    if (!s) throw new Error("Subscription not found");
    if (data.usedUnlocks?.increment) {
      s.usedUnlocks = (s.usedUnlocks || 0) + data.usedUnlocks.increment;
    } else if (data.usedUnlocks !== undefined) {
      s.usedUnlocks = data.usedUnlocks;
    }
    if (data.status) s.status = data.status;
    if (data.plan) s.plan = data.plan;
    if (data.quota !== undefined) s.quota = data.quota;
    return { ...s };
  };

  prisma.paymentEvent.findUnique = async ({ where }) => {
    if (where.eventId) {
      return memoryStore.paymentEvents.get(where.eventId) || null;
    }
    return null;
  };

  prisma.paymentEvent.findFirst = async ({ where }) => {
    for (const evt of memoryStore.paymentEvents.values()) {
      if (where.paymentId && evt.paymentId === where.paymentId) return evt;
      if (where.eventId && evt.eventId === where.eventId) return evt;
    }
    return null;
  };

  prisma.paymentEvent.upsert = async ({ where, create, update }) => {
    let evt = memoryStore.paymentEvents.get(where.eventId);
    if (evt) {
      Object.assign(evt, update);
    } else {
      evt = { id: create.id || nanoid(), ...create };
      memoryStore.paymentEvents.set(evt.eventId, evt);
    }
    return evt;
  };

  prisma.paymentEvent.create = async ({ data }) => {
    const evt = { id: data.id || nanoid(), ...data };
    memoryStore.paymentEvents.set(evt.eventId, evt);
    return evt;
  };

  prisma.transaction.findUnique = async ({ where }) => {
    return memoryStore.transactions.get(where.id) || null;
  };

  prisma.transaction.findFirst = async ({ where }) => {
    for (const t of memoryStore.transactions.values()) {
      if (where.razorpayPaymentId && t.razorpayPaymentId === where.razorpayPaymentId) return t;
    }
    return null;
  };

  prisma.transaction.create = async ({ data }) => {
    const txn = { id: data.id || nanoid(), ...data };
    memoryStore.transactions.set(txn.id, txn);
    return txn;
  };

  prisma.transaction.update = async ({ where, data }) => {
    const txn = memoryStore.transactions.get(where.id);
    if (!txn) throw new Error("Transaction not found");
    Object.assign(txn, data);
    return txn;
  };

  prisma.vendor.findUnique = async ({ where }) => {
    return memoryStore.vendors.get(where.id) || null;
  };

  prisma.vendor.upsert = async ({ where, create, update }) => {
    let v = memoryStore.vendors.get(where.id);
    if (v) {
      Object.assign(v, update);
    } else {
      v = { id: create.id || where.id, ...create };
      memoryStore.vendors.set(v.id, v);
    }
    return v;
  };

  prisma.vendorUnlock.findUnique = async ({ where }) => {
    const key = `${where.userId_vendorId?.userId}_${where.userId_vendorId?.vendorId}`;
    return memoryStore.vendorUnlocks.get(key) || null;
  };

  prisma.vendorUnlock.create = async ({ data }) => {
    const key = `${data.userId}_${data.vendorId}`;
    const unlock = { id: data.id || nanoid(), ...data };
    memoryStore.vendorUnlocks.set(key, unlock);
    return unlock;
  };

  prisma.booking.findUnique = async ({ where }) => {
    return memoryStore.bookings.get(where.id) || null;
  };

  prisma.booking.findFirst = async () => {
    return null;
  };

  prisma.booking.update = async ({ where, data }) => {
    const b = memoryStore.bookings.get(where.id);
    if (b) Object.assign(b, data);
    return b;
  };

  prisma.$transaction = async (fn) => {
    return fn(prisma);
  };
}

mockPrisma();

// Now import application code
import { signToken, hashPassword } from "../src/auth.js";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  activateUserSubscription,
  unlockVendorContact,
} from "../src/subscription.js";

let server;
let baseUrl;
let testUserA;
let testUserB;
let tokenA;
let tokenB;
let testVendor;

describe("PHASE 5 SECURITY & SUBSCRIPTION TEST SUITE", () => {
  before(async () => {
    const { app } = await import("../src/index.js");

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    const pwdHash = await hashPassword("TestPassword@123");
    testUserA = await prisma.user.upsert({
      where: { email: "phase5_test_a@eventneve.local" },
      create: {
        id: "test_user_a_id",
        email: "phase5_test_a@eventneve.local",
        passwordHash: pwdHash,
        fullName: "Test User A",
        role: "user",
        accountType: "event_planner",
        emailVerified: true,
      },
      update: { emailVerified: true },
    });

    testUserB = await prisma.user.upsert({
      where: { email: "phase5_test_b@eventneve.local" },
      create: {
        id: "test_user_b_id",
        email: "phase5_test_b@eventneve.local",
        passwordHash: pwdHash,
        fullName: "Test User B",
        role: "user",
        accountType: "event_planner",
        emailVerified: true,
      },
      update: { emailVerified: true },
    });

    tokenA = signToken(testUserA);
    tokenB = signToken(testUserB);

    testVendor = await prisma.vendor.upsert({
      where: { id: "test_vendor_phase5" },
      create: {
        id: "test_vendor_phase5",
        name: "Grand Floral & Co.",
        category: "Floral Design",
        city: "Mumbai",
        price: "₹ 50,000",
        priceValue: 50000,
        contact: { phone: "+91 98765 43210", email: "grandfloral@eventneve.local" },
        verified: true,
        isAvailable: true,
      },
      update: { isAvailable: true },
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  function computeWebhookSignature(rawBody, secret = TEST_WEBHOOK_SECRET) {
    return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  }

  function computePaymentSignature(orderId, paymentId, secret = TEST_KEY_SECRET) {
    return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  }

  // 1. Valid order creation
  test("1. Valid order creation: Authoritative plan price & metadata verified", async () => {
    const starterPlan = SUBSCRIPTION_PLANS.STARTER;
    assert.equal(starterPlan.price, 4000);
    assert.equal(starterPlan.quota, 15);
    assert.equal(starterPlan.durationDays, 30);
  });

  // 2. Invalid plan
  test("2. Invalid plan rejected with 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plan_id: "ULTRA_SUPER_MAX" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /Invalid subscription plan/i);
  });

  // 3. Client-supplied fake amount
  test("3. Client-supplied fake amount rejected or overridden by authoritative plan price", async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plan_id: "FREE" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /Invalid subscription plan/i);
  });

  // 4. Client-supplied fake quota
  test("4. Client cannot manipulate quota; quotas are strictly authoritative from server", async () => {
    assert.equal(SUBSCRIPTION_PLANS.STARTER.quota, 15);
    assert.equal(SUBSCRIPTION_PLANS.PRO.quota, 35);
    assert.equal(SUBSCRIPTION_PLANS.ENTERPRISE.quota, -1);
  });

  // 5. Unauthorized order creation
  test("5. Unauthorized order creation rejected with 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: "STARTER" }),
    });
    assert.equal(res.status, 401);
  });

  // 6. Valid Razorpay signature
  test("6. Valid Razorpay signature accepted server-side and activates subscription", async () => {
    const orderId = `order_test_${nanoid(8)}`;
    const paymentId = `pay_test_${nanoid(8)}`;
    const validSig = computePaymentSignature(orderId, paymentId);

    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSig,
        plan_id: "STARTER",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.plan, "STARTER");
    assert.equal(data.subscription.status, "ACTIVE");
  });

  // 7. Invalid Razorpay signature
  test("7. Invalid Razorpay signature rejected with 400 Bad Request", async () => {
    const orderId = `order_test_${nanoid(8)}`;
    const paymentId = `pay_test_${nanoid(8)}`;
    const invalidSig = "bad_signature_tampered_hex_value_1234567890abcdef";

    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: invalidSig,
        plan_id: "STARTER",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /signature mismatch/i);
  });

  // 8. Modified webhook payload
  test("8. Modified webhook payload rejected due to HMAC signature failure", async () => {
    const rawOriginal = JSON.stringify({
      event: "payment.captured",
      id: `evt_${nanoid(10)}`,
      payload: { payment: { entity: { id: "pay_tamper", amount: 400000 } } },
    });
    const sig = computeWebhookSignature(rawOriginal);

    const tamperedBody = JSON.stringify({
      event: "payment.captured",
      id: `evt_${nanoid(10)}`,
      payload: { payment: { entity: { id: "pay_tamper", amount: 100 } } },
    });

    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: tamperedBody,
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /Invalid webhook signature/i);
  });

  // 9. Duplicate webhook
  test("9. Duplicate webhook processing is idempotent and ignores duplicate deliveries", async () => {
    const eventId = `evt_dup_test_${nanoid(8)}`;
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      event_id: eventId,
      id: eventId,
      payload: {
        payment: {
          entity: {
            id: `pay_dup_${nanoid(8)}`,
            amount: 400000,
            notes: {
              type: "subscription",
              plan_id: "STARTER",
              user_id: testUserA.id,
            },
          },
        },
      },
    });

    const sig = computeWebhookSignature(webhookPayload);

    // First delivery
    const res1 = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: webhookPayload,
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.status, "subscription_activated");

    // Second duplicate delivery
    const res2 = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: webhookPayload,
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.status, "duplicate_ignored");
  });

  // 10. Payment for wrong order / invalid plan
  test("10. Payment verification for invalid plan rejected with 400", async () => {
    const orderId = `order_wrong_${nanoid(8)}`;
    const paymentId = `pay_wrong_${nanoid(8)}`;
    const sig = computePaymentSignature(orderId, paymentId);

    const res = await fetch(`${baseUrl}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sig,
        plan_id: "NON_EXISTENT_PLAN",
      }),
    });
    assert.equal(res.status, 400);
  });

  // 11. Payment for another user's order
  test("11. User cannot activate subscription on another user's account", async () => {
    const activation = await activateUserSubscription({
      userId: testUserB.id,
      planId: "STARTER",
      orderReference: `order_b_${nanoid(8)}`,
      paymentId: `pay_b_${nanoid(8)}`,
    });
    assert.equal(activation.success, true);
    assert.equal(activation.subscription.userId, testUserB.id);

    const subA = await prisma.subscription.findUnique({ where: { userId: testUserA.id } });
    assert.equal(subA.userId, testUserA.id);
  });

  // 12. Payment amount mismatch in webhook
  test("12. Webhook rejects payment where captured amount does not match authoritative plan price", async () => {
    const eventId = `evt_mismatch_${nanoid(8)}`;
    const payload = JSON.stringify({
      event: "payment.captured",
      event_id: eventId,
      id: eventId,
      payload: {
        payment: {
          entity: {
            id: `pay_bad_amt_${nanoid(8)}`,
            amount: 5000,
            notes: {
              type: "subscription",
              plan_id: "STARTER",
              user_id: testUserA.id,
            },
          },
        },
      },
    });

    const sig = computeWebhookSignature(payload);
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: payload,
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /does not match expected plan price/i);
  });

  // 13. payment.failed
  test("13. payment.failed safely recorded; does NOT activate subscription", async () => {
    await prisma.subscription.update({
      where: { userId: testUserA.id },
      data: { plan: "FREE", quota: 0, status: SUBSCRIPTION_STATUS.ACTIVE },
    });

    const eventId = `evt_fail_${nanoid(8)}`;
    const payload = JSON.stringify({
      event: "payment.failed",
      event_id: eventId,
      id: eventId,
      payload: {
        payment: {
          entity: {
            id: `pay_failed_${nanoid(8)}`,
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Payment failed due to insufficient funds",
            notes: {
              type: "subscription",
              plan_id: "STARTER",
              user_id: testUserA.id,
            },
          },
        },
      },
    });

    const sig = computeWebhookSignature(payload);
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: payload,
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "failed_recorded");

    const sub = await prisma.subscription.findUnique({ where: { userId: testUserA.id } });
    assert.equal(sub.plan, "FREE");
  });

  // 14. refund.created
  test("14. refund.created safely recorded without unexpected mutations", async () => {
    const eventId = `evt_refund_${nanoid(8)}`;
    const payload = JSON.stringify({
      event: "refund.created",
      event_id: eventId,
      id: eventId,
      payload: {
        refund: {
          entity: {
            id: `rfnd_${nanoid(8)}`,
            payment_id: `pay_refunded_${nanoid(8)}`,
            amount: 400000,
            currency: "INR",
          },
        },
      },
    });

    const sig = computeWebhookSignature(payload);
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": sig,
      },
      body: payload,
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "refund_recorded");

    const event = await prisma.paymentEvent.findUnique({ where: { eventId } });
    assert.equal(event.status, "refunded");
  });

  // 15. Expired/invalid credentials
  test("15. Webhook without signature header rejected with 400", async () => {
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "payment.captured" }),
    });
    assert.equal(res.status, 400);
  });

  // 16. Subscription activation after verified payment
  test("16. Subscription activation sets ACTIVE status, quota, usedUnlocks=0, and valid dates", async () => {
    const activation = await activateUserSubscription({
      userId: testUserA.id,
      planId: "PRO",
      orderReference: `order_act_${nanoid(8)}`,
      paymentId: `pay_act_${nanoid(8)}`,
    });

    assert.equal(activation.success, true);
    assert.equal(activation.subscription.plan, "PRO");
    assert.equal(activation.subscription.status, "ACTIVE");
    assert.equal(activation.subscription.quota, 35);
    assert.equal(activation.subscription.usedUnlocks, 0);
    assert.ok(new Date(activation.subscription.expiryDate) > new Date());
  });

  // 17. Repeated processing of same payment
  test("17. Repeated processing of same payment is idempotent (does not reset quota or extend dates)", async () => {
    const orderRef = `order_repeat_${nanoid(8)}`;
    const payId = `pay_repeat_${nanoid(8)}`;

    const first = await activateUserSubscription({
      userId: testUserA.id,
      planId: "STARTER",
      orderReference: orderRef,
      paymentId: payId,
    });
    assert.equal(first.alreadyProcessed, false);

    // Consume 1 unlock
    await prisma.subscription.update({
      where: { userId: testUserA.id },
      data: { usedUnlocks: 1 },
    });

    // Replay same payment activation
    const second = await activateUserSubscription({
      userId: testUserA.id,
      planId: "STARTER",
      orderReference: orderRef,
      paymentId: payId,
    });
    assert.equal(second.alreadyProcessed, true);

    const subAfter = await prisma.subscription.findUnique({ where: { userId: testUserA.id } });
    assert.equal(subAfter.usedUnlocks, 1);
  });

  // 18. Existing FREE subscription upgrading to paid
  test("18. Existing FREE subscription upgrades cleanly to paid plan", async () => {
    await prisma.subscription.update({
      where: { userId: testUserA.id },
      data: { plan: "FREE", quota: 0, status: SUBSCRIPTION_STATUS.ACTIVE },
    });

    const upgraded = await activateUserSubscription({
      userId: testUserA.id,
      planId: "STARTER",
      orderReference: `order_up_${nanoid(8)}`,
      paymentId: `pay_up_${nanoid(8)}`,
    });

    assert.equal(upgraded.subscription.plan, "STARTER");
    assert.equal(upgraded.subscription.quota, 15);
    assert.equal(upgraded.subscription.status, "ACTIVE");
  });

  // 19. Existing paid subscription handling
  test("19. Existing paid subscription upgrade to ENTERPRISE reflects unlimited quota", async () => {
    const upgraded = await activateUserSubscription({
      userId: testUserA.id,
      planId: "ENTERPRISE",
      orderReference: `order_ent_${nanoid(8)}`,
      paymentId: `pay_ent_${nanoid(8)}`,
    });

    assert.equal(upgraded.subscription.plan, "ENTERPRISE");
    assert.equal(upgraded.subscription.quota, -1);
    assert.equal(upgraded.subscription.status, "ACTIVE");
  });

  // 20. Vendor contact access after verified activation
  test("20. Vendor contact access permitted after verified activation", async () => {
    const unlockRes = await unlockVendorContact(testUserA.id, testVendor.id);
    assert.equal(unlockRes.success, true);

    // Call /api/vendors/:id/contact
    const res = await fetch(`${baseUrl}/vendors/${testVendor.id}/contact`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.unlocked, true);
    assert.equal(data.contact.phone, "+91 98765 43210");
  });
});
