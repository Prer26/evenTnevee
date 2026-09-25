import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { hashPassword, comparePassword, signToken, requireAuth } from "../auth.js";
import { sendMail } from "../mailer.js";
import {
  loginLimiter, registerLimiter, otpLimiter, resendOtpLimiter, passwordResetLimiter,
} from "../rateLimiters.js";
import { logAuth, logSecurity } from "../logger.js";
import { validateBody, email as emailSchema, shortText } from "../validate.js";

const router = Router();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Password must include a letter and a number",
  });

const accountTypeSchema = z.enum(["event_planner", "vendor"]);

const registerSchema = z.object({
  email: emailSchema,
  password: strongPassword,
  full_name: shortText(100).optional(),
  account_type: accountTypeSchema.default("event_planner"),
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
}).strict();

const otpSchema = z.object({
  email: emailSchema,
  otpCode: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
}).strict();

const emailOnlySchema = z.object({ email: emailSchema }).strict();

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10).max(200),
  newPassword: strongPassword,
}).strict();

// Cryptographically secure 6-digit OTP generation using Node's crypto module
const genOtp = () => String(crypto.randomInt(100000, 1000000));

// Maps a Prisma User object to the public API response shape (snake_case
// for frontend compatibility — keeps API contract unchanged).
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.fullName || "",
  role: u.role || "user",
  account_type: u.accountType || "event_planner",
  email_verified: !!u.emailVerified,
  created_at: u.createdAt,
});

// --- Register ---------------------------------------------------------
router.post("/register", registerLimiter, validateBody(registerSchema), async (req, res) => {
  const { email, password, full_name, account_type } = req.body || {};
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  // Case-insensitive email lookup
  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existing && existing.emailVerified) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  const otp = genOtp();
  const passwordHash = await hashPassword(password);
  // Store OTP expiry as BigInt (milliseconds epoch) — matches DB column type BIGINT
  const otpExpires = BigInt(Date.now() + OTP_TTL_MS);

  if (existing) {
    // Re-registering before verifying — refresh their record
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        fullName: full_name || existing.fullName || "",
        accountType: account_type,
        otp,
        otpExpires,
        otpAttempts: 0,
      },
    });
  } else {
    const count = await prisma.user.count();
    const role = count === 0 ? "admin" : "user";
    const id = nanoid();

    await prisma.user.create({
      data: {
        id,
        email: normalizedEmail,
        fullName: full_name || "",
        passwordHash,
        role,
        accountType: account_type,
        emailVerified: false,
        otp,
        otpExpires,
        otpAttempts: 0,
        failedLoginAttempts: 0,
        lockoutUntil: BigInt(0),
        tokenVersion: 0,
      },
    });
  }

  await sendMail({
    to: email,
    subject: "Your evenTneve verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
  });

  logAuth("register_requested", req, { email });
  res.json({ message: "Verification code sent" });
});

// --- Verify OTP ---------------------------------------------------------
router.post("/verify-otp", otpLimiter, validateBody(otpSchema), async (req, res) => {
  const { email, otpCode } = req.body || {};
  const targetEmail = email ? email.trim().toLowerCase() : "";
  const user = await prisma.user.findFirst({
    where: { email: targetEmail },
  });
  
  if (!user || !user.otp) return res.status(400).json({ message: "No pending verification for this email" });
  if (Date.now() > Number(user.otpExpires)) return res.status(400).json({ message: "Code expired. Please request a new one." });

  const isMatch =
    typeof user.otp === "string" &&
    typeof otpCode === "string" &&
    user.otp.length === otpCode.length &&
    crypto.timingSafeEqual(Buffer.from(user.otp), Buffer.from(otpCode));

  if (!isMatch) {
    const attempts = (user.otpAttempts || 0) + 1;
    if (attempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpires: null, otpAttempts: attempts },
      });
      logSecurity("otp_burned_too_many_attempts", req, { email });
      return res.status(400).json({ message: "Too many incorrect attempts. Please request a new code." });
    }
    await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: attempts } });
    logAuth("otp_incorrect", req, { email, attempt: attempts });
    return res.status(400).json({ message: "Incorrect code" });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, otp: null, otpExpires: null, otpAttempts: 0 },
  });

  logAuth("email_verified", req, { email, user_id: updatedUser.id });
  const access_token = signToken(updatedUser);
  res.json({ access_token, user: publicUser(updatedUser) });
});

// --- Resend OTP ---------------------------------------------------------
router.post("/resend-otp", resendOtpLimiter, validateBody(emailOnlySchema), async (req, res) => {
  const { email } = req.body || {};
  const targetEmail = email ? email.trim().toLowerCase() : "";
  const user = await prisma.user.findFirst({
    where: { email: targetEmail },
  });

  if (!user || user.emailVerified) return res.json({ message: "If an account exists, a new code has been sent" });

  const otp = genOtp();
  const otpExpires = BigInt(Date.now() + OTP_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otpExpires, otpAttempts: 0 },
  });

  await sendMail({
    to: email,
    subject: "Your evenTneve verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
  });

  res.json({ message: "If an account exists, a new code has been sent" });
});

// --- Login ---------------------------------------------------------
router.post("/login", loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body || {};
  const targetEmail = email ? email.trim().toLowerCase() : "";

  const user = await prisma.user.findFirst({
    where: { email: targetEmail },
  });

  if (user && Number(user.lockoutUntil) > Date.now()) {
    const minutesLeft = Math.ceil((Number(user.lockoutUntil) - Date.now()) / 60000);
    logSecurity("login_blocked_lockout", req, { email, user_id: user.id });
    return res.status(423).json({ message: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
  }

  // Timing-safe: compare against DUMMY_HASH if user not found
  const valid = await comparePassword(password || "", user?.passwordHash);

  if (!user || !valid) {
    if (user) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUntil = user.lockoutUntil;
      let resetAttempts = attempts;
      if (attempts >= MAX_FAILED_LOGINS) {
        lockoutUntil = BigInt(Date.now() + LOCKOUT_MS);
        resetAttempts = 0;
        logSecurity("account_locked", req, { email, user_id: user.id });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: resetAttempts, lockoutUntil },
      });
    }
    logAuth("login_failed", req, { email, reason: user ? "wrong_password" : "unknown_email" });
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.emailVerified) {
    logAuth("login_blocked_unverified", req, { email, user_id: user.id });
    return res.status(403).json({ message: "Please verify your email first", code: "email_not_verified" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockoutUntil: BigInt(0) },
  });

  logAuth("login_success", req, { email, user_id: user.id });
  const access_token = signToken(user);
  res.json({ access_token, user: publicUser(user) });
});

// --- Current user ---------------------------------------------------------
router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// --- Log out everywhere ---------------------------------------------------
router.post("/logout-everywhere", requireAuth, async (req, res) => {
  const newTv = (req.user.tokenVersion || 0) + 1;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { tokenVersion: newTv },
  });
  res.json({ message: "Logged out of all sessions" });
});

// --- Password reset request -----------------------------------------------
router.post("/reset-password-request", passwordResetLimiter, validateBody(emailOnlySchema), async (req, res) => {
  const { email } = req.body || {};
  const targetEmail = email ? email.trim().toLowerCase() : "";

  const user = await prisma.user.findFirst({
    where: { email: targetEmail },
  });

  if (user) {
    const resetToken = nanoid(32);
    const resetTokenExpires = BigInt(Date.now() + RESET_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    const resetUrl = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    await sendMail({
      to: email,
      subject: "Reset your evenTneve password",
      text: `Reset your password here: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    });
    logAuth("password_reset_requested", req, { email, user_id: user.id });
  }

  res.json({ message: "If an account exists, a reset link has been sent" });
});

// --- Password reset ---------------------------------------------------------
router.post("/reset-password", passwordResetLimiter, validateBody(resetPasswordSchema), async (req, res) => {
  const { resetToken, newPassword } = req.body || {};

  const user = await prisma.user.findFirst({ where: { resetToken } });

  if (!user || Date.now() > Number(user.resetTokenExpires || 0)) {
    return res.status(400).json({ message: "Reset link is invalid or expired" });
  }

  const passwordHash = await hashPassword(newPassword);
  const newTv = (user.tokenVersion || 0) + 1;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      failedLoginAttempts: 0,
      lockoutUntil: BigInt(0),
      tokenVersion: newTv,
    },
  });

  logAuth("password_reset_completed", req, { email: user.email, user_id: user.id });
  res.json({ message: "Password updated" });
});

export default router;
