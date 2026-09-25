import { z } from "zod";

// Wraps a zod schema as Express middleware. On success, req.body/query is
// REPLACED with the parsed+coerced result — so downstream handlers only
// ever see clean, typed data, never the raw untrusted input. Unknown keys
// are rejected outright (.strict()), which is an extra layer against
// mass-assignment on top of the explicit field whitelists in each route.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }
    req.query = result.data;
    next();
  };
}

// --- Common, reusable field-level schemas --------------------------------
// Every free-text field gets an explicit max length. Without this, a client
// could store multi-megabyte strings (DoS on storage/response size) or
// oversized script-injection payloads — React auto-escapes on render, so
// this isn't an XSS hole today, but unbounded input is still bad hygiene
// and the cheapest possible abuse vector to close off.
export const email = z.string().trim().toLowerCase().email().max(254);
export const shortText = (max = 120) => z.string().trim().min(1).max(max);
export const optionalText = (max = 500) => z.string().trim().max(max).optional();
export const money = z.coerce.number().finite().nonnegative().max(100_000_000);
export const positiveInt = z.coerce.number().int().nonnegative().max(1_000_000);
export const isoDateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Must be a valid date" });

// Bounded, whitelisted pagination — prevents both weird sort-field
// injection (e.g. "__proto__") and someone requesting an enormous page to
// scrape the whole dataset in one shot.
export function listQuery(sortFields) {
  return z.object({
    sort: z
      .string()
      .optional()
      .refine((v) => !v || sortFields.includes(v.replace(/^-/, "")), { message: "Invalid sort field" }),
    limit: z.coerce.number().int().positive().max(100).optional(),
  });
}
