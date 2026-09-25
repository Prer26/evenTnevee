# Agent notes — evenTneve

This project was migrated off Base44 to a fully self-hosted stack. If
you're an AI agent working on this repo, here's the shape of it:

- Frontend: React + Vite, in `src/`. Path alias `@/*` → `src/*`
  (see `vite.config.js`).
- Backend: Express + lowdb (JSON file DB), in `server/`. Own
  `package.json`, run separately from the frontend.
- `src/api/base44Client.js`: kept this filename/export name (`base44`) so
  every page's imports didn't need to change during the migration, but it
  no longer talks to Base44 at all — it's a thin fetch wrapper around our
  own `server/` API. Don't be confused by the name; there's no Base44
  dependency here anymore.
- `src/lib/AuthContext.jsx`: JWT-based auth against `server/src/routes/auth.js`.
  No external "app platform" concept — just login/register/OTP/reset.
- Entity-style data (`base44.entities.Vendor/Booking/Inquiry/Transaction`)
  maps 1:1 to REST routes in `server/src/routes/`. Sort strings like
  `"-created_date"` are handled by `server/src/sort.js`.
- AI calls (`base44.integrations.Core.InvokeLLM`) proxy through
  `server/src/routes/ai.js` to any OpenAI-compatible endpoint (Groq by
  default, or a self-hosted Ollama instance).

When adding a new entity or feature, follow the existing pattern: add a
route in `server/src/routes/`, mount it in `server/src/index.js`, and add
a `makeEntity("resource")` line in `src/api/base44Client.js` — no other
frontend plumbing needed.
