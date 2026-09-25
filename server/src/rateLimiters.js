import rateLimit from "express-rate-limit";

// Applies per-IP. In production behind a reverse proxy, set TRUST_PROXY=1
// (see server/.env.example) so the real client IP is used instead of the
// proxy's, or these limits will effectively apply to everyone at once.

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in a few minutes." },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many signup attempts from this connection. Please try again later." },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please request a new code and try again shortly." },
});

export const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Please wait a few minutes before requesting another." },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts. Please try again later." },
});

// Baseline anti-bot/anti-scraping limiter applied to EVERY /api request.
// Generous enough not to bother a real user clicking around the site, but
// it caps how fast a script can hammer any endpoint (including public reads
// like the vendor list, which have no other rate limit of their own).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this connection. Please slow down." },
});

// AI calls have a real per-request cost (your Groq quota, or your own
// Ollama server's compute) and are the easiest thing on this app for a
// script to abuse, so they get their own tighter limit on top of the
// global one above.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests from this connection. Please wait a few minutes and try again." },
});

// Photo uploads consume memory, CPU (magic-byte validation), and persistent
// storage bandwidth/storage quotas.
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload requests from this connection. Please wait a few minutes." },
});

// Razorpay order creation calls external payment gateways and should be
// protected against rapid order creation spam.
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment order requests. Please wait a few minutes and try again." },
});

