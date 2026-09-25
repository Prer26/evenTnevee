/**
 * Prisma Client singleton for evenTneve backend.
 *
 * A single PrismaClient instance is shared across the entire process.
 * Creating one instance per request is an anti-pattern that exhausts
 * the connection pool and causes performance degradation.
 *
 * Usage in any route/middleware file:
 *   import prisma from "../lib/prisma.js";
 *   const user = await prisma.user.findUnique({ where: { id } });
 *
 * Connection lifecycle:
 *   - The client connects lazily on first query.
 *   - process.beforeExit is used to disconnect cleanly on shutdown.
 *   - In production, Prisma manages the connection pool automatically.
 *
 * Supabase note:
 *   DATABASE_URL  → Transaction Pooler  (port 6543, for runtime queries)
 *   DIRECT_URL    → Direct connection   (port 5432, for migrations/introspection)
 *   Both are configured in prisma/schema.prisma.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Reuse the existing client if it exists (important for hot-reload in dev)
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "warn", "error"]
    : ["warn", "error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
