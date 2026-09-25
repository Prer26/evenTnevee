import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const DEV_FALLBACK_SECRET = "dev-secret-change-me";
const BCRYPT_ROUNDS = 12;

// Fail loudly rather than silently signing tokens with a guessable secret.
// A hardcoded fallback in open-source code is not a secret once it's on GitHub.
const INSECURE_SECRETS = new Set([
  DEV_FALLBACK_SECRET,
  "replace-this-with-a-long-random-string",
  "secret",
  "changeme",
]);

if (process.env.NODE_ENV === "production") {
  if (!JWT_SECRET || INSECURE_SECRETS.has(JWT_SECRET) || JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET is not set or is too weak for production. Refusing to start without a secure secret (minimum 32 characters) — " +
        "generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }
} else if (!JWT_SECRET || INSECURE_SECRETS.has(JWT_SECRET)) {
  console.warn(
    "\n⚠️  JWT_SECRET is not set or is using an insecure default — using a development-only fallback.\n" +
      "   Set JWT_SECRET in server/.env before deploying anywhere real.\n"
  );
}
const EFFECTIVE_SECRET = JWT_SECRET || DEV_FALLBACK_SECRET;

// Used to make login response time independent of whether the account exists,
// so timing can't be used to enumerate registered emails.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Uy0Xw0uL0m0mZs5ZI9K1B1RQ3ONZK";

export function signToken(user) {
  return jwt.sign(
    // tokenVersion comes from Prisma as Int (not BigInt) so no conversion needed
    { sub: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 },
    EFFECTIVE_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, EFFECTIVE_SECRET);
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash || DUMMY_HASH);
}

// Runs a real bcrypt compare even when there's no matching user, so a login
// attempt against a nonexistent email takes the same time as a wrong password
// against a real one.
export async function timingSafeAccountCheck(user, password) {
  const valid = await comparePassword(password || "", user?.passwordHash);
  return !!user && valid;
}

// Express middleware — requires a valid, non-revoked Bearer token.
// Also re-checks the token's session version against the user's current
// one on every request, so a password reset (which bumps token_version)
// immediately kills every previously-issued token — real session expiry,
// not just time-based expiry.
//
// Migrated from raw SQL (pgQuery) to Prisma for consistency.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = verifyToken(token);

    // Re-fetch user on every request to check tokenVersion.
    // This is the real session-revocation mechanism: password reset / logout-everywhere
    // bumps tokenVersion in DB, immediately invalidating all prior tokens.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.emailVerified || (user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }

    // Ensure req.auth reflects the authoritative role and email from the database
    req.auth = { ...payload, role: user.role, email: user.email };
    req.user = user; // Prisma User object (camelCase fields)
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Doesn't fail the request if there's no/invalid token — just attaches req.auth if present
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.auth = verifyToken(token);
    } catch {
      // ignore invalid token, treat as anonymous
    }
  }
  next();
}
