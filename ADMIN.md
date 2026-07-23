# Kiwi Operator Console — `kiwi-admin.html`

Kiwi's own back-office. One hidden page that lets **us** (the operator, not the
merchant) see every client, their day's sales, open any client's dashboard
remotely, manage staff PINs on their behalf, and toggle which modules each client
sees. Built so a client can phone with "my numbers aren't updating" or "a waiter
quit and I can't remove his PIN" and we fix it from our base — no site visit.

Runs on the **free** Cloudflare Pages + D1 tiers. **Real when the backend is
reachable, seeded demo data otherwise** (so it always demos, even on the local
static server / GitHub Pages).

## How to get in (hidden by design)

There is **no visible button**. On the login screen, **press and hold the logo
(~1.4 s)** — a discreet operator-code prompt appears. Enter an operator code →
lands on `/kiwi-admin.html`. Clients never discover it.

- **Operator codes** live in the D1 `operators` table, hashed exactly like
  passwords (PBKDF2-SHA256). Add/delete them from the console's **Opérateurs**
  panel. We can hold as many as we like.
- **Bootstrap the first code** (no manual hashing): use the existing **staff
  bypass** — on the login screen, "Accès équipe" → the `SITE_PASSWORD` → then open
  `/kiwi-admin.html` directly and add the first operator code(s) in the Opérateurs
  panel. After that, the long-press gesture is the daily door.

## What it does

1. **Clients** — a row per merchant: établissement + contact, merchant key,
   plan, **CA du jour**, ventes, last-sale time, live dot. **"Ouvrir dashboard"**
   opens that client's real dashboard (scoped to their merchant key) so we see
   exactly what they see. **"Gérer"** opens the management panel below.
2. **PINs** (per client) — list / **add** (4-digit + name + role) / **delete**
   staff PINs. Managed remotely so an owner never has to.
3. **Fonctionnalités** (per client) — a switch per module (stock, réservations,
   KDS, tables, menu, paie, fidélité, dépenses). **Operator-only authority** — it
   maps to the pricing tier. Turning a module **off hides it in that client's real
   app** on next load (a small snack gets a clean interface, not a maze of buttons
   it will never use).
4. **Opérateurs** — add / delete operator access codes.

## Architecture

### Backend (Cloudflare Pages Functions + D1)

New D1 tables in [`schema.sql`](schema.sql): `operators`, `staff_pins`,
`merchant_config`. Bound as `DB` (same binding Live Link + auth already use).

Functions (all under the site gate; the `/admin/*` ones additionally require an
**operator or staff** cookie — a plain merchant session is not enough):

- `functions/api/admin/clients.js` — `GET` roster (accounts ⨝ today's sales ⨝ plan).
- `functions/api/admin/pins.js` — `GET`/`POST`/`DELETE` staff PINs.
- `functions/api/admin/config.js` — `GET`/`PUT` a merchant's feature flags.
- `functions/api/admin/operators.js` — `GET`/`POST`/`DELETE` operator codes.
- `functions/api/config.js` — `GET ?merchant=…` the client apps' own read of
  `{features, pins}` (any authenticated session; a merchant reads its own slug).
- `functions/_middleware.js` — operator cookie is a 3rd "way in"; `POST /__operator`
  verifies a code and sets `kiwi_op` (`HMAC(AUTH_SECRET,"kiwi-operator-v1")`).

**Merchant key = slug of the business name** (`slugMerchant` in
`functions/auth/_lib.js`): "Café Atlas" → `cafe-atlas`, which is also the Live
Link default, so an account lines up with its sales without a stored mapping.

### Client-app consumption (`assets/merchant-config.js`)

Loaded by `dashboard.html`, `kiwi-caisse.html`, `kiwi-serveur.html`. On load it
fetches `/api/config?merchant=<slug>` and:

- **Feature hiding** — for each module toggled off, hides every element tagged
  `data-feature="<key>"` and adds `body.feat-off-<key>`.
- **PINs** — exposes `window.KiwiConfig.pins` for the caisse/serveur to consult
  **additively** (managed PINs augment the hardcoded defaults; defaults never
  break). A `kiwi-config` event fires when config arrives.

**Fail-safe:** no backend / offline / endpoint missing ⇒ nothing changes. The
pitch demo and existing clients are never at risk.

## Cloudflare setup

Already mostly provisioned (D1 `kiwi-sales` bound as `DB`, `AUTH_SECRET` set). To
enable the console in production:

1. Apply the new tables: re-run [`schema.sql`](schema.sql) (all `CREATE TABLE IF
   NOT EXISTS` — safe to re-apply) in the D1 console, or
   `npx wrangler d1 execute kiwi-sales --file=schema.sql --remote`.
2. Deploy (push, or Create deployment — not "Retry").
3. First entry: staff bypass → `/kiwi-admin.html` → Opérateurs → add your codes.

No new secret is needed — the operator cookie reuses `AUTH_SECRET`.

## Local proof

`tools/live-mock-server.js` mirrors `/api/config` and `/api/admin/*` in memory and
serves the site, so the whole loop works locally:

```
node tools/live-mock-server.js         # http://localhost:4181
# /kiwi-admin.html  → console in Live mode against the mock
# /dashboard.html?live=1 with a merchant whose modules are toggled off → hidden
```

On the plain static server (`tools/static-server.js`) there is no backend, so the
console runs in **Démo** mode (seeded clients) and the client apps keep their
defaults — exactly what ships to GitHub Pages.
