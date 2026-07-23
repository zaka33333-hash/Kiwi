# Kiwi Operator Console — design spec

**Date:** 2026-07-23
**Author:** AI session (Opus 4.8) + owner
**Status:** approved design, pre-implementation

## Problem

Kiwi has no back-office for **us** (the operator — you, not the merchants). When a
client phones ("my numbers aren't updating", "my agent is broken", "a waiter quit
and I can't remove his PIN"), we have no way to see their state or act on their
account without physically going to them. We also can't tailor which modules a
client sees, which an investor flagged as important for pricing (a small snack
shouldn't wade through stock + reservations it will never use).

## Goal

One hidden, utilitarian internal page — `kiwi-admin.html` — that lets the operator:

1. **See every client + their daily sales** at a glance, and open any client's
   real dashboard remotely (debug without travelling).
2. **Manage staff PINs** for any client (add when a hire starts, delete when a
   waiter quits) — done from our base, not theirs.
3. **Toggle features per client** (stock, reservations, KDS, tables, payroll, …).
   Off = genuinely hidden in that client's real app. **Operator-only authority**
   (clients can't self-upgrade; it maps to pricing tiers).

Deliberately plain — a dense table + plain toggles, not brand-polished. "Nothing
complicated."

## Non-goals (v1)

- No editing of sales/financial records (read-only view of sales).
- No billing/invoicing surface.
- No per-PIN granular permissions beyond the existing role model (serveur /
  plongeur / etc.). PIN = 4-digit + role, as the apps already use.
- No realtime push — the roster reads on load + manual refresh (polling optional).

## Data mode

**Real when the backend is reachable, seeded mock fallback otherwise.** On
Cloudflare (Functions + D1) the page uses real `/api/admin/*`. On the local static
server or GitHub Pages (no Functions) it falls back to seeded demo clients with
mock PINs/toggles persisted in `localStorage`, so it always demos and is never
empty.

## Access & security

- **Entry:** no visible button. The login screen (`functions/_middleware.js`) gets
  a silent **long-press (~1.5 s) on the logo dot** → reveals an operator-code
  prompt. Clients never discover it.
- **Operator codes:** new D1 table `operators` — codes hashed with the same
  PBKDF2-SHA256 scheme as merchant passwords (`functions/auth/_lib.js`). Plaintext
  never stored. Add/delete from within the console.
- **Operator session cookie:** `kiwi_op` = `HMAC(AUTH_SECRET, "kiwi-operator-v1")`
  — a constant signed token proving "operator-authenticated", verifiable by both
  the middleware (to serve pages) and `/api/admin/*` (to authorize). HttpOnly,
  Secure, SameSite=Lax, 30 days. Deleting a code does not kill live sessions
  (acceptable for a 2-person operator team; codes gate entry, not per-session
  revocation).
- **Bootstrap (no manual hashing):** the existing **staff bypass** (`SITE_PASSWORD`,
  "Accès équipe" — the owner/partner) is trusted as operator-equivalent. Staff
  enter as today, open `/kiwi-admin.html`, and add the first operator codes via the
  UI (hashed server-side). Thereafter the hidden gesture is the daily entry.
- **Admin API authorization:** `/api/admin/*` accepts the **operator cookie OR the
  staff-gate cookie**. A plain merchant session does NOT get operator powers.
- **Client-app config read:** a separate `/api/config?merchant=X` returns that
  merchant's enabled features + PIN list. Readable by any authenticated same-origin
  session (the merchant reads their own). PINs are low-security role selectors, not
  secrets — acceptable exposure for this pilot.

## Backend additions (Cloudflare D1 + Functions)

### New D1 tables (`schema.sql`)

```sql
-- Operator codes (Kiwi's own back-office access). PBKDF2 like accounts.
CREATE TABLE IF NOT EXISTS operators (
  id         TEXT PRIMARY KEY,   -- "op-<uuid>"
  label      TEXT,               -- human name for the code ("Badr", "Partner")
  salt       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  created_ts INTEGER NOT NULL
);

-- Staff PINs per merchant. role = serveur | plongeur | caisse | manager | ...
CREATE TABLE IF NOT EXISTS staff_pins (
  id         TEXT PRIMARY KEY,   -- "pin-<uuid>"
  merchant   TEXT NOT NULL,
  pin        TEXT NOT NULL,      -- 4-digit, unique per merchant
  name       TEXT,               -- staff member name
  role       TEXT NOT NULL,
  created_ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pins_merchant ON staff_pins (merchant);

-- Per-merchant feature flags. Absent row/key => module ON (current behavior).
CREATE TABLE IF NOT EXISTS merchant_config (
  merchant   TEXT PRIMARY KEY,
  features   TEXT NOT NULL,      -- JSON: {"stock":false,"reservations":false,...}
  plan       TEXT,               -- basic | pro | ultra | ultimate (optional hint)
  updated_ts INTEGER NOT NULL
);
```

### New Functions

- `functions/api/admin/_lib.js` — operator/staff cookie verification helper.
- `functions/api/admin/clients.js` — `GET`: roster (join `accounts` +
  today's sales aggregate from `sales` + `merchant_config.plan`). Operator-gated.
- `functions/api/admin/pins.js` — `GET`/`POST`(add)/`DELETE` staff PINs for a
  merchant. Operator-gated. Rejects duplicate PIN per merchant.
- `functions/api/admin/config.js` — `GET`/`PUT` a merchant's feature flags.
  Operator-gated.
- `functions/api/admin/operators.js` — `GET`(list labels only)/`POST`(add
  code)/`DELETE` operator codes. Operator-or-staff-gated. Never returns hashes.
- `functions/api/config.js` — `GET ?merchant=X`: public-to-authenticated read of
  `{features, pins:[{pin,role,name}]}` for the client apps. (Merchant-session or
  any gate cookie.)
- `functions/_middleware.js` — add operator cookie as a 3rd "way in"; add
  `POST /__operator` to verify a code against `operators` and set `kiwi_op`.

## Frontend

### `kiwi-admin.html` (new, self-contained, utilitarian)

Single page, vanilla, no framework. Sections:

1. **Clients** — dense table: business · email · plan · today total (MAD) · today
   count · last-sale time · online dot. Row action **"Ouvrir le dashboard"** opens
   `/dashboard.html` for that merchant (sets `localStorage.kiwiLiveMerchant`
   + `?merchant=` so the dashboard scopes to them). Manual **Rafraîchir**.
2. **PINs** (per selected client) — list PIN · name · role, **delete** each, **add**
   (pin + name + role). Writes `/api/admin/pins`.
3. **Fonctionnalités** (per selected client) — a row of toggles per module. Writes
   `/api/admin/config`. Shows the plan and lets a tier preset a default set, always
   manually overridable.
4. **Opérateurs** — list operator labels, **add** (label + code), **delete**.
   Writes `/api/admin/operators`.

Data layer: a thin `store` module that hits `/api/admin/*` when reachable, else
seeded mock data + `localStorage`. Same page, both modes.

### Login screen — `functions/_middleware.js`

- Long-press on `.mark` (logo dot) reveals a hidden operator prompt (a small form,
  `hidden` by default, no visible affordance). Submits `POST /__operator`.
- On success the server sets `kiwi_op` and 303-redirects to `/kiwi-admin.html`.

### Client-app consumption (the safe-degrading half)

Each app reads its config once on load and degrades to current hardcoded behavior
if the fetch fails / returns nothing:

- **`kiwi-caisse.html` + `kiwi-serveur.html`** — fetch `/api/config`; if it returns
  `pins`, use them for PIN→role resolution instead of the hardcoded map. If it
  returns `features`, hide toggled-off module entry points.
- **`dashboard.html`** — fetch `/api/config`; hide nav/cards for toggled-off
  modules.
- Guard everything: no config / offline / non-Cloudflare ⇒ **exactly today's
  behavior**. The live demo and existing clients are never at risk.

## Rollout / verification

- Local static server: admin page verified in **mock mode** (seeded clients,
  localStorage toggles/PINs). Client apps verified to still behave normally when
  `/api/config` 404s.
- Cloudflare: real mode verified after deploy (apply `schema.sql` additions first;
  `DB` already bound). Seed first operator code via staff-bypass → Opérateurs panel.
- Both remotes updated per repo convention. New `ADMIN.md` documents the console,
  the hidden gesture, bootstrap, and the D1 additions (mirrors `AUTH.md` /
  `LIVE_LINK.md`).

## Risk notes

- Touches live apps (caisse/serveur/dashboard) for config consumption — mitigated
  by strict fail-safe degradation to current behavior.
- `schema.sql` additions are `CREATE TABLE IF NOT EXISTS` — safe to re-apply.
- Operator cookie shares `AUTH_SECRET`; no new secret required.
