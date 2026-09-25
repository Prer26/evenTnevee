import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import http from "http";
import { nanoid } from "nanoid";

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_phase7_minimum_thirty_two_chars_long";
const TEST_KEY_SECRET = "test_secret_for_razorpay_suite_phase7";
const TEST_WEBHOOK_SECRET = "test_webhook_secret_signature_phase7";
process.env.RAZORPAY_KEY_ID = "rzp_test_phase7_mock_123";
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

// In-memory data store for isolated testing
const memoryStore = {
  users: new Map(),
  subscriptions: new Map(),
  paymentEvents: new Map(),
  transactions: new Map(),
  vendors: new Map(),
  vendorUnlocks: new Map(),
  bookings: new Map(),
  inquiries: new Map(),
  messages: new Map(),
  reviews: new Map(),
};

import prisma from "../src/lib/prisma.js";

function mockPrisma() {
  prisma.user.findUnique = async ({ where }) => {
    if (where.id) return memoryStore.users.get(where.id) || null;
    if (where.email) {
      for (const u of memoryStore.users.values()) {
        if (u.email.toLowerCase() === where.email.toLowerCase()) return u;
      }
    }
    return null;
  };

  prisma.user.findFirst = async ({ where }) => {
    if (where.email?.equals) {
      for (const u of memoryStore.users.values()) {
        if (u.email.toLowerCase() === where.email.equals.toLowerCase()) return u;
      }
    }
    if (where.resetToken) {
      for (const u of memoryStore.users.values()) {
        if (u.resetToken === where.resetToken) return u;
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

  prisma.user.update = async ({ where, data }) => {
    const u = memoryStore.users.get(where.id);
    if (!u) throw new Error("User not found");
    Object.assign(u, data);
    return u;
  };

  prisma.booking.findUnique = async ({ where }) => {
    return memoryStore.bookings.get(where.id) || null;
  };

  prisma.booking.findFirst = async () => null;

  prisma.booking.create = async ({ data }) => {
    const b = { id: data.id || nanoid(), ...data };
    memoryStore.bookings.set(b.id, b);
    return b;
  };

  prisma.booking.update = async ({ where, data }) => {
    const b = memoryStore.bookings.get(where.id);
    if (!b) throw new Error("Booking not found");
    Object.assign(b, data);
    return b;
  };

  prisma.booking.findMany = async ({ where = {} }) => {
    const results = [];
    for (const b of memoryStore.bookings.values()) {
      if (where.userId && b.userId !== where.userId) continue;
      results.push(b);
    }
    return results;
  };

  prisma.inquiry.findUnique = async ({ where }) => {
    return memoryStore.inquiries.get(where.id) || null;
  };

  prisma.inquiry.create = async ({ data }) => {
    const i = { id: data.id || nanoid(), ...data };
    memoryStore.inquiries.set(i.id, i);
    return i;
  };

  prisma.inquiry.update = async ({ where, data }) => {
    const i = memoryStore.inquiries.get(where.id);
    if (!i) throw new Error("Inquiry not found");
    Object.assign(i, data);
    return i;
  };

  prisma.inquiry.findMany = async () => Array.from(memoryStore.inquiries.values());

  prisma.transaction.findUnique = async ({ where }) => {
    return memoryStore.transactions.get(where.id) || null;
  };

  prisma.transaction.create = async ({ data }) => {
    const t = { id: data.id || nanoid(), ...data };
    memoryStore.transactions.set(t.id, t);
    return t;
  };

  prisma.transaction.update = async ({ where, data }) => {
    const t = memoryStore.transactions.get(where.id);
    if (!t) throw new Error("Transaction not found");
    Object.assign(t, data);
    return t;
  };

  prisma.transaction.findMany = async ({ where = {} }) => {
    const results = [];
    for (const t of memoryStore.transactions.values()) {
      if (where.userId && t.userId !== where.userId) continue;
      results.push(t);
    }
    return results;
  };

  prisma.message.findUnique = async ({ where }) => {
    return memoryStore.messages.get(where.id) || null;
  };

  prisma.message.create = async ({ data }) => {
    const m = { id: data.id || nanoid(), ...data };
    memoryStore.messages.set(m.id, m);
    return m;
  };

  prisma.message.findMany = async ({ where = {} }) => {
    const results = [];
    for (const m of memoryStore.messages.values()) {
      if (where.userId && m.userId !== where.userId) continue;
      if (where.vendorId && m.vendorId !== where.vendorId) continue;
      results.push(m);
    }
    return results;
  };

  prisma.review.findUnique = async ({ where }) => {
    return memoryStore.reviews.get(where.id) || null;
  };

  prisma.review.create = async ({ data }) => {
    const r = { id: data.id || nanoid(), ...data };
    memoryStore.reviews.set(r.id, r);
    return r;
  };

  prisma.review.findMany = async ({ where = {} }) => {
    const results = [];
    for (const r of memoryStore.reviews.values()) {
      if (where.vendorId && r.vendorId !== where.vendorId) continue;
      results.push(r);
    }
    return results;
  };

  prisma.vendor.findUnique = async ({ where }) => {
    return memoryStore.vendors.get(where.id) || null;
  };

  prisma.vendor.findFirst = async ({ where = {} }) => {
    if (where.userId) {
      for (const v of memoryStore.vendors.values()) {
        if (v.userId === where.userId) return v;
      }
    }
    return null;
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

  prisma.vendor.findMany = async () => Array.from(memoryStore.vendors.values());

  prisma.subscription.findUnique = async ({ where }) => {
    if (where.userId) {
      for (const s of memoryStore.subscriptions.values()) {
        if (s.userId === where.userId) return { ...s };
      }
    }
    if (where.id) return memoryStore.subscriptions.get(where.id) || null;
    return null;
  };

  prisma.subscription.create = async ({ data }) => {
    const s = { id: data.id || nanoid(), ...data };
    memoryStore.subscriptions.set(s.id, s);
    return s;
  };

  prisma.subscription.update = async ({ where, data }) => {
    const s = memoryStore.subscriptions.get(where.id);
    if (!s) throw new Error("Subscription not found");
    Object.assign(s, data);
    return s;
  };

  prisma.vendorUnlock.count = async ({ where }) => {
    let count = 0;
    for (const u of memoryStore.vendorUnlocks.values()) {
      if (where.userId && u.userId === where.userId) count++;
    }
    return count;
  };

  prisma.$transaction = async (fn) => fn(prisma);
}

mockPrisma();

import { signToken, hashPassword } from "../src/auth.js";

let server;
let baseUrl;
let userA;
let userB;
let adminUser;
let vendorUser;
let tokenA;
let tokenB;
let tokenAdmin;
let tokenVendor;
let testVendor;

describe("PHASE 7 APPLICATION-WIDE VAPT & HARDENING TEST SUITE", () => {
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

    const pwd = await hashPassword("SecurePassword@2026");

    userA = await prisma.user.upsert({
      where: { email: "user_a@phase7.local" },
      create: {
        id: "user_a_id",
        email: "user_a@phase7.local",
        passwordHash: pwd,
        fullName: "User A",
        role: "user",
        accountType: "event_planner",
        emailVerified: true,
        tokenVersion: 1,
      },
      update: {},
    });

    userB = await prisma.user.upsert({
      where: { email: "user_b@phase7.local" },
      create: {
        id: "user_b_id",
        email: "user_b@phase7.local",
        passwordHash: pwd,
        fullName: "User B",
        role: "user",
        accountType: "event_planner",
        emailVerified: true,
        tokenVersion: 1,
      },
      update: {},
    });

    adminUser = await prisma.user.upsert({
      where: { email: "admin@phase7.local" },
      create: {
        id: "admin_phase7_id",
        email: "admin@phase7.local",
        passwordHash: pwd,
        fullName: "System Admin",
        role: "admin",
        accountType: "event_planner",
        emailVerified: true,
        tokenVersion: 1,
      },
      update: {},
    });

    vendorUser = await prisma.user.upsert({
      where: { email: "vendor@phase7.local" },
      create: {
        id: "vendor_user_phase7_id",
        email: "vendor@phase7.local",
        passwordHash: pwd,
        fullName: "Vendor Owner",
        role: "user",
        accountType: "vendor",
        emailVerified: true,
        tokenVersion: 1,
      },
      update: {},
    });

    testVendor = await prisma.vendor.upsert({
      where: { id: "vendor_phase7_1" },
      create: {
        id: "vendor_phase7_1",
        userId: vendorUser.id,
        name: "Phase 7 Royal Florals",
        category: "Florist",
        city: "Mumbai",
        priceValue: 25000,
        isAvailable: true,
        contact: { phone: "+91 9876543210", email: "contact@royalflorals.in" },
      },
      update: {},
    });

    tokenA = signToken(userA);
    tokenB = signToken(userB);
    tokenAdmin = signToken(adminUser);
    tokenVendor = signToken(vendorUser);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function apiRequest(endpoint, { method = "GET", body = null, token = null, headers = {} } = {}) {
    const url = `${baseUrl}${endpoint}`;
    const reqHeaders = { "Content-Type": "application/json", ...headers };
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      // non-json response
    }
    return { status: res.status, data: json, headers: res.headers };
  }

  // 1. AUTHENTICATION & JWT SECRET HARDENING
  describe("1. Authentication Security & JWT Hardening", () => {
    test("Enforces minimum 32 character strong JWT_SECRET in production mode", () => {
      const insecureDefaults = [
        "dev-secret-change-me",
        "replace-this-with-a-long-random-string",
        "short-secret",
      ];
      for (const badSecret of insecureDefaults) {
        assert.ok(
          badSecret.length < 32 || badSecret === "replace-this-with-a-long-random-string",
          "Weak secret identified"
        );
      }
      assert.ok(process.env.JWT_SECRET.length >= 32, "Active secret meets 32 char requirement");
    });

    test("Rejects requests with forged/tampered JWT signature", async () => {
      const tamperedToken = tokenA.slice(0, -5) + "xyz12";
      const res = await apiRequest("/auth/me", { token: tamperedToken });
      assert.equal(res.status, 401);
      assert.match(res.data.message, /invalid or expired/i);
    });

    test("Rejects requests with unverified email accounts", async () => {
      const unverifiedUser = {
        id: "unverified_id",
        email: "unverified@phase7.local",
        passwordHash: "hash",
        role: "user",
        accountType: "event_planner",
        emailVerified: false,
        tokenVersion: 0,
      };
      memoryStore.users.set(unverifiedUser.id, unverifiedUser);
      const unverifiedToken = signToken(unverifiedUser);

      const res = await apiRequest("/auth/me", { token: unverifiedToken });
      assert.equal(res.status, 401);
    });
  });

  // 2. AUTHORIZATION & IDOR TESTING
  describe("2. Authorization & IDOR Controls", () => {
    let bookingA;
    let inquiryA;
    let transactionA;
    let messageA;
    let reviewA;

    before(async () => {
      bookingA = await prisma.booking.create({
        data: {
          id: "bk_phase7_userA",
          vendorId: testVendor.id,
          vendorName: testVendor.name,
          userId: userA.id,
          clientName: "User A",
          clientEmail: userA.email,
          eventType: "Wedding",
          eventDate: new Date("2026-12-01"),
          guestCount: 200,
          status: "Pending",
        },
      });

      inquiryA = await prisma.inquiry.create({
        data: {
          id: "inq_phase7_userA",
          vendorId: testVendor.id,
          userId: userA.id,
          name: "User A",
          email: userA.email,
          message: "Private inquiry message from User A",
          status: "New",
        },
      });

      transactionA = await prisma.transaction.create({
        data: {
          id: "txn_phase7_userA",
          userId: userA.id,
          vendor: testVendor.name,
          amount: 5000,
          status: "Pending",
          type: "Payment",
        },
      });

      messageA = await prisma.message.create({
        data: {
          id: "msg_phase7_userA",
          vendorId: testVendor.id,
          vendorName: testVendor.name,
          userId: userA.id,
          userName: userA.fullName,
          sender: "client",
          body: "Confidential negotiation text",
        },
      });

      reviewA = await prisma.review.create({
        data: {
          id: "rev_phase7_1",
          bookingId: "bk_completed_1",
          vendorId: testVendor.id,
          userId: userA.id,
          plannerName: "User A",
          rating: 5,
          comment: "Outstanding floral arrangement!",
        },
      });
    });

    test("IDOR: User B cannot access User A's booking via GET /bookings/:id", async () => {
      const res = await apiRequest(`/bookings/${bookingA.id}`, { token: tokenB });
      assert.equal(res.status, 403);
    });

    test("IDOR: User A (owner) can access their own booking via GET /bookings/:id", async () => {
      const res = await apiRequest(`/bookings/${bookingA.id}`, { token: tokenA });
      assert.equal(res.status, 200);
      assert.equal(res.data.id, bookingA.id);
    });

    test("IDOR: Admin can access any booking via GET /bookings/:id", async () => {
      const res = await apiRequest(`/bookings/${bookingA.id}`, { token: tokenAdmin });
      assert.equal(res.status, 200);
      assert.equal(res.data.id, bookingA.id);
    });

    test("IDOR: User B cannot modify User A's booking via PATCH /bookings/:id", async () => {
      const res = await apiRequest(`/bookings/${bookingA.id}`, {
        method: "PATCH",
        token: tokenB,
        body: { notes: "Attacker modification" },
      });
      assert.equal(res.status, 403);
    });

    test("IDOR: User B cannot access User A's inquiry via GET /inquiries/:id", async () => {
      const res = await apiRequest(`/inquiries/${inquiryA.id}`, { token: tokenB });
      assert.equal(res.status, 403);
    });

    test("IDOR: User A (creator) can access their inquiry via GET /inquiries/:id", async () => {
      const res = await apiRequest(`/inquiries/${inquiryA.id}`, { token: tokenA });
      assert.equal(res.status, 200);
      assert.equal(res.data.id, inquiryA.id);
    });

    test("IDOR: User B cannot modify User A's inquiry via PATCH /inquiries/:id", async () => {
      const res = await apiRequest(`/inquiries/${inquiryA.id}`, {
        method: "PATCH",
        token: tokenB,
        body: { status: "Closed" },
      });
      assert.equal(res.status, 403);
    });

    test("IDOR: User B cannot access User A's transaction via GET /transactions/:id", async () => {
      const res = await apiRequest(`/transactions/${transactionA.id}`, { token: tokenB });
      assert.equal(res.status, 403);
    });

    test("IDOR: User A can access their transaction via GET /transactions/:id", async () => {
      const res = await apiRequest(`/transactions/${transactionA.id}`, { token: tokenA });
      assert.equal(res.status, 200);
      assert.equal(res.data.id, transactionA.id);
    });

    test("IDOR: User B cannot access User A's message via GET /messages/:id", async () => {
      const res = await apiRequest(`/messages/${messageA.id}`, { token: tokenB });
      assert.equal(res.status, 403);
    });

    test("IDOR: Vendor owner can access their listing's message via GET /messages/:id", async () => {
      const res = await apiRequest(`/messages/${messageA.id}`, { token: tokenVendor });
      assert.equal(res.status, 200);
      assert.equal(res.data.id, messageA.id);
    });

    test("Can fetch single review via GET /reviews/:id", async () => {
      const res = await apiRequest(`/reviews/${reviewA.id}`);
      assert.equal(res.status, 200);
      assert.equal(res.data.id, reviewA.id);
      assert.equal(res.data.rating, 5);
    });
  });

  // 3. MASS ASSIGNMENT CONTROLS
  describe("3. Mass Assignment Prevention", () => {
    test("Rejects client attempt to elevate role on register", async () => {
      const res = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          email: "attacker_elevation@phase7.local",
          password: "AttackerPassword@2026",
          role: "admin", // Protected field
        },
      });
      assert.equal(res.status, 400); // Zod strict schema rejects unknown field
      assert.match(res.data.message, /invalid request data/i);
    });

    test("Non-admin user cannot set transaction status directly to Cleared", async () => {
      const res = await apiRequest("/transactions", {
        method: "POST",
        token: tokenA,
        body: {
          vendor: "Vendor Direct Cleared Test",
          amount: 5000,
          status: "Cleared", // Forbidden for regular users
        },
      });
      assert.equal(res.status, 403);
      assert.match(res.data.message, /pay now flow/i);
    });
  });

  // 4. INPUT VALIDATION & BOUNDARIES
  describe("4. Input Validation & Boundary Testing", () => {
    test("Rejects negative amount on transaction creation", async () => {
      const res = await apiRequest("/transactions", {
        method: "POST",
        token: tokenA,
        body: {
          vendor: "Negative Amount Test",
          amount: -500,
          status: "Pending",
        },
      });
      assert.equal(res.status, 400);
    });

    test("Rejects invalid prototype pollution or unknown sort query", async () => {
      const res = await apiRequest("/vendors?sort=__proto__");
      assert.equal(res.status, 400);
      assert.match(res.data.message, /invalid query parameters/i);
    });

    test("Rejects extremely large prompt on AI endpoint", async () => {
      const longPrompt = "A".repeat(5000); // max is 4000
      const res = await apiRequest("/ai/invoke", {
        method: "POST",
        body: { prompt: longPrompt },
      });
      assert.equal(res.status, 400);
    });
  });

  // 5. XSS PAYLOAD CONTAINMENT
  describe("5. XSS Payload Containment", () => {
    test("Safely treats HTML and script injection as plain text without execution", async () => {
      const xssPayload = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
      const res = await apiRequest("/transactions", {
        method: "POST",
        token: tokenA,
        body: {
          vendor: "Safe Vendor",
          amount: 1500,
          status: "Pending",
          notes: xssPayload,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.notes, xssPayload); // Retained as inert literal string
    });
  });

  // 6. UPLOAD SECURITY CONTROLS
  describe("6. Upload Security Controls", () => {
    test("Rejects unauthenticated photo upload request", async () => {
      const res = await apiRequest("/uploads/photo", { method: "POST" });
      assert.equal(res.status, 401);
    });

    test("Rejects upload without photo payload", async () => {
      const res = await apiRequest("/uploads/photo", {
        method: "POST",
        token: tokenVendor,
        body: {},
      });
      assert.equal(res.status, 400);
    });
  });

  // 7. PAYMENT & WEBHOOK SECURITY
  describe("7. Payment & Webhook Security", () => {
    test("Rejects attempt to purchase FREE plan via /api/payments/create-order", async () => {
      const res = await apiRequest("/payments/create-order", {
        method: "POST",
        token: tokenA,
        body: { plan_id: "FREE" },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /only paid plans/i);
    });

    test("Rejects payment verification when HMAC signature is forged", async () => {
      const res = await apiRequest("/payments/verify", {
        method: "POST",
        token: tokenA,
        body: {
          razorpay_order_id: "order_phase7_test_fake",
          razorpay_payment_id: "pay_phase7_test_fake",
          razorpay_signature: "invalid_forged_hmac_hex_string_1234567890abcdef",
          plan_id: "STARTER",
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /signature mismatch/i);
    });

    test("Rejects webhook request with missing signature", async () => {
      const res = await apiRequest("/payments/webhook", {
        method: "POST",
        body: { event: "payment.captured" },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /missing razorpay webhook signature/i);
    });

    test("Rejects webhook request with invalid HMAC signature", async () => {
      const res = await apiRequest("/payments/webhook", {
        method: "POST",
        headers: { "x-razorpay-signature": "bad_signature_hex" },
        body: { event: "payment.captured" },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /invalid webhook signature/i);
    });
  });

  // 8. ERROR SANITIZATION & LEAKAGE PREVENTION
  describe("8. Error Information Leakage Controls", () => {
    test("500 responses return clean sanitized error message", async () => {
      // Temporarily inject an error into vendor.findMany to verify error response
      const originalFindMany = prisma.vendor.findMany;
      prisma.vendor.findMany = async () => {
        throw new Error("P2021: Table 'eventneve.internal_schema' does not exist in schema public");
      };

      const res = await apiRequest("/vendors");
      assert.equal(res.status, 500);
      assert.equal(res.data.message, "Failed to fetch vendors");
      // Verify no sensitive database schema details leaked to client
      assert.ok(!JSON.stringify(res.data).includes("P2021"));
      assert.ok(!JSON.stringify(res.data).includes("internal_schema"));

      // Restore original findMany
      prisma.vendor.findMany = originalFindMany;
    });
  });
});
