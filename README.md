# evenTneve

A vendor marketplace and finance tracker for event planners. This project
is fully self-hosted — no Base44 (or any other paid platform) required.

## Structure

- `/` (this folder) — the React + Vite frontend
- `/server` — a small Express API (auth, vendors, bookings, inquiries,
  transactions, AI proxy), backed by a JSON file database (`lowdb`).
  See `server/README` notes in `server/.env.example` for setup.

## Running locally

**1. Start the backend**
```
cd server
npm install
cp .env.example .env   # fill in JWT_SECRET at minimum
npm run dev
```
The API runs on `http://localhost:4000` by default.

**2. Start the frontend**
```
npm install
cp .env.example .env   # VITE_API_URL should point at the backend above
npm run dev
```
The site runs on `http://localhost:5173` by default.

## What's free here

- **Database**: a local JSON file (`lowdb`) — no hosted database bill.
- **Auth**: your own JWT + bcrypt, no third-party auth service.
- **Email** (OTP codes, password resets): optional. Without SMTP configured,
  emails just print to the server console (fine for local dev/testing).
  For real delivery at $0 cost, use a Gmail account with an
  [App Password](https://myaccount.google.com/apppasswords) — see
  `server/.env.example`.
- **AI** (Nova AI chatbot + finance insights): defaults to
  [Groq](https://console.groq.com/keys), which has a genuinely free tier
  (no credit card). You can also point it at a self-hosted
  [Ollama](https://ollama.com) instance for a fully offline, always-free
  option — see `server/.env.example`.

## Account types

Every account is either an **Event Planner** or a **Vendor**, chosen once
at signup and shown right at the start of registration — nothing else on
the form until that's picked. It's stored as `account_type` on the user
record, which is intentionally a separate concept from `role`
(`admin`/`user`, which governs backend permissions like the messages
inbox) — don't confuse the two when reading the code.

- **Event Planners** get the existing Dashboard: browse the marketplace,
  book vendors, track finances.
- **Vendors** get a dedicated Vendor Dashboard (`/vendor-dashboard`) to
  manage their own listing — business details, services with pricing,
  contact info, an availability toggle, and photos of past work. Saving it
  creates/updates a real entry in the same `vendors` collection the public
  marketplace reads from, so a vendor's listing shows up for planners
  immediately.

Uploaded vendor photos are verified by their actual file content (not just
the filename or the browser-reported type, both of which are easy to
spoof) before being written to disk — see `server/src/routes/uploads.js`.

## Deploying for free

The backend is a plain Node/Express app, so it runs on any free-tier host
that supports Node — Render, Fly.io, Railway's free tier, or your own VPS.
Just set the same env vars from `server/.env.example` there. The frontend
is a static build (`npm run build` → `dist/`) and can be hosted for free
on Vercel, Netlify, Cloudflare Pages, or GitHub Pages — just set
`VITE_API_URL` to your deployed backend's URL at build time.

## Security & secure deployment

**HTTPS**: set `FORCE_HTTPS=1` in `server/.env` once you're deployed behind
real TLS (Render/Fly/Railway/Vercel all provide this automatically, free).
This redirects any plain-HTTP request to HTTPS and enables HSTS. Also make
sure `VITE_API_URL` in your frontend's production `.env` points to an
`https://` URL, not `http://`.

**Secrets**: every credential (`JWT_SECRET`, `RAZORPAY_KEY_SECRET`,
`AI_API_KEY`, SMTP password) lives only in `server/.env`, which is
git-ignored and never sent to the frontend — confirmed by grepping the
actual production build output, not just the source. Set these as
environment variables in your hosting platform's dashboard, never commit
them, never prefix them with `VITE_` (anything with that prefix gets
bundled into the public frontend code by design — only `VITE_API_URL`
should ever use it). The server **refuses to start in production**
(`NODE_ENV=production`) without a real `JWT_SECRET` set.

**Database access**: the database is a local JSON file (`server/data/db.json`)
on the backend server's own disk — it's not a networked service, so there's
nothing for the public internet to connect to directly (unlike a hosted
Postgres/Mongo instance, which would need its own firewall/VPC rules to
avoid public exposure). It's also git-ignored so it's never pushed to your
repo. If you later migrate to a real networked database, bind it to
`localhost`/an internal network only, never expose its port publicly, and
connect to it only from the backend server.

**Rate limiting & lockout**: login, registration, OTP verification, and
password reset are all rate-limited per IP, and accounts lock for 15
minutes after 5 failed login attempts — see `server/src/rateLimiters.js`.

**Logging**: every request is access-logged (method, path, status, IP,
response time), and auth events specifically (`login_success`,
`login_failed`, `account_locked`, `password_reset_completed`, etc.) are
logged as structured JSON lines to stdout — see `server/src/logger.js`.
Any host's log viewer (Render, Fly, etc.) captures this automatically; for
real alerting, pipe stdout into a log aggregator like Better Stack or Axiom
(both have free tiers). A lightweight built-in anomaly check also flags an
IP that racks up 20+ auth/permission failures (401/403/429) within 5
minutes as `suspicious_traffic`.

**Ownership checks (IDOR prevention)**: every endpoint that reads, updates,
or deletes a specific record (bookings, transactions, message threads)
verifies the logged-in user actually owns that record first — or is an
admin — before touching it. Financial state transitions (marking a
transaction "Cleared", confirming a booking as paid) can only happen through
the signature-verified Razorpay flow in `server/src/routes/payments.js`,
never via a raw field update from the client.

**Abuse protection**: every endpoint sits behind at least a generous global
rate limit (300 req/15min per IP), with tighter limits on the endpoints
that matter most — login, registration, OTP, password reset (see
`server/src/rateLimiters.js`), and AI generation requests specifically
(20/15min per IP, on top of a per-request prompt length cap), since those
cost real quota. There's no CAPTCHA or behavioral bot-detection here —
that's a reasonable next step if abuse becomes a real problem, but rate
limiting is the practical, zero-cost first line of defense and covers the
common case (scripted scraping/brute-forcing) well.

**Input validation**: every request body and query parameter is validated
with [zod](https://zod.dev) schemas (`server/src/validate.js` +
per-route schemas) — strict types, bounded string lengths, whitelisted
enums, and rejection of any unrecognized field (extra defense against
mass-assignment on top of the explicit field whitelists already in each
route). Sort/pagination query params are restricted to a whitelisted set of
fields per entity, which also rules out odd inputs like `sort=__proto__`.
There's no SQL/NoSQL injection surface here at all since the database is a
plain JSON file with no query language — but the same discipline (typed,
bounded input) still matters for storage integrity and response-size abuse.
There are no file upload endpoints anywhere in this app currently; if you
add one later, validate file type by content (not just extension), cap file
size, and store uploads outside any directory your server serves statically.
