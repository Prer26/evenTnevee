// Structured logging for auth events, API errors, and traffic anomalies.
//
// Writes JSON lines to stdout rather than a local file — every serious free
// host (Render, Fly, Railway, etc.) captures stdout automatically and lets
// you search/alert on it, so this needs no extra infrastructure to be useful.
// If you outgrow this, pipe stdout into a real log aggregator (Better Stack,
// Axiom, etc. all have free tiers) without changing any app code.

function write(level, event, data = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

export function logAuth(event, req, extra = {}) {
  write("info", event, {
    ip: req.ip,
    email: extra.email || req.body?.email || undefined,
    ...extra,
  });
}

export function logSecurity(event, req, extra = {}) {
  write("warn", event, {
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
    ...extra,
  });
}

export function logApiError(err, req) {
  write("error", "api_error", {
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

// --- Lightweight anomaly detection --------------------------------------
// Tracks 401/403/429 responses per IP in a rolling window. Crossing the
// threshold logs a single "suspicious_traffic" warning line you can alert
// on — this is intentionally simple (in-memory, no external service) so it
// works out of the box; swap for a real WAF/SIEM if traffic grows enough
// to need one.
const WINDOW_MS = 5 * 60 * 1000;
const THRESHOLD = 20;
const hits = new Map(); // ip -> { count, windowStart, flagged }

export function trackSuspiciousResponse(req, statusCode) {
  if (![401, 403, 429].includes(statusCode)) return;

  const ip = req.ip || "unknown";
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now, flagged: false });
    return;
  }

  entry.count += 1;
  if (entry.count >= THRESHOLD && !entry.flagged) {
    entry.flagged = true;
    write("warn", "suspicious_traffic", {
      ip,
      path: req.originalUrl,
      count: entry.count,
      window_minutes: WINDOW_MS / 60000,
      note: `${entry.count} auth/permission failures from this IP in ${WINDOW_MS / 60000} minutes`,
    });
  }
}

// Periodic cleanup so the map doesn't grow forever on a long-running process
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, entry] of hits) {
    if (entry.windowStart < cutoff) hits.delete(ip);
  }
}, WINDOW_MS).unref();
