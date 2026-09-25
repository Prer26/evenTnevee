import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { nanoid } from "nanoid";
import prisma from "./lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, "..", "data", "vendors-seed.json");

export async function seedPostgresVendors() {
  try {
    const count = await prisma.vendor.count();

    if (count > 0) {
      console.log(`PostgreSQL vendors table already contains ${count} records. Skipping seed.`);
      return;
    }

    const raw = JSON.parse(readFileSync(SEED_FILE, "utf-8"));
    console.log(`Seeding ${raw.length} vendors into PostgreSQL database via Prisma...`);

    for (const v of raw) {
      const id = nanoid();
      await prisma.vendor.create({
        data: {
          id,
          name: v.name || "",
          category: v.category || "",
          city: v.city || "",
          rating: v.rating ?? 5.0,
          reviews: v.reviews ?? 0,
          price: v.price || "",
          priceValue: v.priceValue ?? 0,
          description: v.description || "",
          services: v.services || [],
          gallery: v.gallery || [],
          responseTime: v.responseTime || "",
          availability: v.availability || "",
          verified: v.verified ?? false,
          isAvailable: true,
          match: v.match ?? 90,
          image: v.image || "",
          accent: v.accent || "",
          review: v.review || "",
        },
      });
    }

    console.log("Successfully seeded vendors into PostgreSQL via Prisma.");
  } catch (err) {
    console.error("PostgreSQL seeding error:", err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedPostgresVendors().then(() => process.exit(0));
}
