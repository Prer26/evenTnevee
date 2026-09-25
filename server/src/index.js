import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";

import companyProfileRoutes from "./routes/companyProfiles.js";
import authRoutes from "./routes/auth.js";
import vendorRoutes from "./routes/vendors.js";
import bookingRoutes from "./routes/bookings.js";
import inquiryRoutes from "./routes/inquiries.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payments.js";
import messageRoutes from "./routes/messages.js";
import reviewRoutes from "./routes/reviews.js";
import aiRoutes from "./routes/ai.js";
import uploadRoutes from "./routes/uploads.js";
import subscriptionRoutes from "./routes/subscription.js";

import {
  logApiError,
  trackSuspiciousResponse,
} from "./logger.js";

import { apiLimiter } from "./rateLimiters.js";

const app = express();

const PORT = process.env.PORT || 4000;

/* ---------------------------------------------------------
   CORS
--------------------------------------------------------- */

const rawCorsOrigin =
  process.env.CORS_ORIGIN || "http://localhost:5173";

const allowedOrigins = rawCorsOrigin
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOriginDelegate = (origin, callback) => {
  // Allow requests without Origin header
  // such as curl, server-to-server requests, health checks, etc.
  if (!origin) {
    return callback(null, true);
  }

  // Allow wildcard only during development.
  // Never use wildcard with credentials in production.
  if (allowedOrigins.includes("*")) {
    if (process.env.NODE_ENV === "production") {
      return callback(null, false);
    }

    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(null, false);
};

/* ---------------------------------------------------------
   TRUST PROXY
--------------------------------------------------------- */

const FORCE_HTTPS = process.env.FORCE_HTTPS === "1";

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

/* ---------------------------------------------------------
   CORS MUST COME BEFORE API ROUTES
--------------------------------------------------------- */

app.use(
  cors({
    origin: corsOriginDelegate,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* ---------------------------------------------------------
   HTTPS REDIRECT
--------------------------------------------------------- */

if (FORCE_HTTPS) {
  app.use((req, res, next) => {
    if (
      req.secure ||
      req.headers["x-forwarded-proto"] === "https"
    ) {
      return next();
    }

    const rawHost = req.headers.host || "";

    const safeHost = /^[a-zA-Z0-9.:-]+$/.test(rawHost)
      ? rawHost
      : "localhost";

    return res.redirect(
      301,
      `https://${safeHost}${req.originalUrl}`
    );
  });
}

/* ---------------------------------------------------------
   SECURITY HEADERS
--------------------------------------------------------- */

app.use(
  helmet({
    hsts: FORCE_HTTPS
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
        }
      : false,
  })
);

/* ---------------------------------------------------------
   BODY PARSER
--------------------------------------------------------- */

app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* ---------------------------------------------------------
   LOGGING
--------------------------------------------------------- */

app.use(morgan("combined"));

/* ---------------------------------------------------------
   SUSPICIOUS RESPONSE TRACKING
--------------------------------------------------------- */

app.use((req, res, next) => {
  res.on("finish", () => {
    trackSuspiciousResponse(req, res.statusCode);
  });

  next();
});

/* ---------------------------------------------------------
   HEALTH CHECK
--------------------------------------------------------- */

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/* ---------------------------------------------------------
   LEGACY UPLOADS
--------------------------------------------------------- */

const LEGACY_UPLOAD_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads"
);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    next();
  },
  express.static(LEGACY_UPLOAD_DIR)
);

/* ---------------------------------------------------------
   COMPANY PROFILE ROUTES
--------------------------------------------------------- */

app.use(
  "/api/company-profiles",
  companyProfileRoutes
);

/* ---------------------------------------------------------
   API RATE LIMITER
--------------------------------------------------------- */

app.use("/api", apiLimiter);

/* ---------------------------------------------------------
   API ROUTES
--------------------------------------------------------- */

app.use("/api/auth", authRoutes);

app.use("/api/vendors", vendorRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/inquiries", inquiryRoutes);

app.use("/api/transactions", transactionRoutes);

console.log("TRANSACTIONS ROUTER MOUNTED");

app.use("/api/payments", paymentRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/uploads", uploadRoutes);

app.use("/api/subscription", subscriptionRoutes);

/* ---------------------------------------------------------
   404 HANDLER
--------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

/* ---------------------------------------------------------
   GLOBAL ERROR HANDLER
--------------------------------------------------------- */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logApiError(err, req);

  res.status(500).json({
    message: "Something went wrong on the server",
  });
});

/* ---------------------------------------------------------
   START SERVER
--------------------------------------------------------- */

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (
  isDirectRun &&
  process.env.NODE_ENV !== "test"
) {
  app.listen(PORT, () => {
    console.log(
      `evenTneve API running on http://localhost:${PORT}`
    );
  });
}

export { app };

export default app;