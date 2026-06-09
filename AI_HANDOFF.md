# AI_HANDOFF.md — current-state brief for the next agent

> Read this after `CLAUDE.md` (operating rules) and `HANDOFF.md` (deep history/architecture).
> This file is the **"what's true right now and what hurts"** brief — written so a fresh
> session has the same working context as the one that just ended (June 2026).

---

## 1. What Kiwi is (in one paragraph)

Kiwi is a **Moroccan merchant operating system**, POS-first. This repo is a **pitch/demo
artifact** — vanilla HTML/CSS/JS, **no build step, no framework, no backend** (all data is
mocked client-side and persisted in `localStorage`). It's **trilingual: FR / EN / AR with
real RTL**. The flagship surface is `dashboard.html` (the merchant dashboard for a demo
café group, "Café Atlas"). The public site is `index.html`. Treat it as something that has
to **look and demo flawlessly to investors and pilot cafés** — design and polish are part
of the sale.

## 2. Business model (Phase 1 — POS SaaS, four tiers)

- **Kiwi Basic · 199 MAD/mo** — software only, on the merchant's own hardware, unlimited
  devices, **1 établissement**, integrates into the existing till, on-site training + guides.
- **Kiwi Pro · 399 MAD/mo** — everything in Basic **+ 1 free Kiwi cashier**, T+1 settlement,
  hardware maintenance. (The demo account is "on Pro".)
- **Kiwi Ultra · 1 499 MAD/mo** — unlimited établissements, multi-pays, enterprise API,
  dedicated 24/7 account manager.
- **Kiwi Ultimate · sur devis** — bespoke; scope/device-count/price agreed with the client.

Phase 2 = Kiwi Pay (payment institution), Phase 3 = Banking/Investing. **Do NOT add
Pay/Banking/Investing surfaces unless explicitly asked.** **No public financials / asks /
projections** in any external-facing material — public macro data only. The pricing lives in:
the **upgrade modal** (`interactive.js` → `upgrade-pro`), the **landing** (`index.html`:
hero KPI, the editorial pricing manifesto, JSON-LD offers, FAQ, meta, priceRange), the
**savings calculator** (`ux.js` + `i18n.js`), the **sidebar upsell** (`venues.js`), and the
**account hub** (`account.js`). All four surfaces are in sync.

## 3. Stack & conventions (the stuff that bites you)

- **Vanilla, locked.** No React/Next/bundler. Don't migrate. IIFE modules registering into
  `window.Kiwi.handlers`.
- **Global click delegation** (`interactive.js`): `[data-action="x"]` `[data-arg="y"]` →
  `handlers['x'](element, 'y')`.
- **i18n**: `data-i18n="key"` on DOM (FR captured from DOM, EN/AR in a `T` dict in
  `i18n.js`); in JS use the per-module `tr({fr,en,ar})` / `pick({fr,en,ar})` helpers.
  Switch via `KiwiI18n.{setLang,getLang,setTheme,getTheme}`. RTL is driven by `html[lang="ar"]`.
- **Overlays** (`interactive.js`): `Kiwi.modal({title,tag,desc,body,foot,width}) → {el, close}`;
  `Kiwi.drawer(...)`; `Kiwi.appPage(id,{title,subtitle,body})` for **full-page destinations**
  (every sidebar/profile destination now uses this — no more side drawers, see commit
  `fc08d02`); `Kiwi.toast(title,{type,desc,force})`. **`modal()` escapes `title` and `tag`
  (XSS-hardened) but renders `desc`/`body`/`foot` as raw HTML** — never interpolate raw
  user/data into `body`; use the module's `esc()`.
- **Dark mode** (`theme.css`, applied via `html[data-theme="dark"]`): tokens **invert** —
  `--surface` (white→#151B18), `--paper`, **`--ink`/`--paper` SWAP roles**, `--warn-soft`/
  `--warn-ink`, `--n-*`, `--atlas`, `--mint`, `--danger`/`--info`. **Hardcoded hex does NOT
  invert.** **Never use `var(--ink)` as a background** (it goes light in dark — this exact
  mistake broke the sidebar and a dozen banners). `dark-fixes.js` is a runtime safety net
  that darkens stray near-white surfaces and relights dark-on-dark text — it's a band-aid,
  prefer fixing colors at the source with tokens.
- **Scroll-lock**: a global counter `window.__kiwiScrollLocks` + `html.kiwi-locked`. To
  dismiss a modal use the helper close path (e.g. `closeTopModal()` in stock.js), **not**
  `el.remove()` — raw removal leaks the counter and freezes page scroll.
- `Date.now()`/`Math.random()` are fine in normal browser JS (only forbidden inside
  `Workflow` scripts).

## 4. Passcodes (the lock screen on every load)

`dashboard.html` shows a 4-digit PIN gate every session (`paintCells()` ~line 5622). Codes:
`0000`→onboard, `0505`→marketing tease, `0909`→manager role (restricted sidebar), `1111`→
**unlocks the Croissance growth suite** (session only; `body.growth-locked` removed), any
other 4-digit → Café Atlas owner demo. "Entrer dans la démo" = skip. **Every passcode now
also enables the Design 2026 skin** (see below).
To drive the demo in the preview: enter a PIN (e.g. `1111`) into the lock input, or remove
`.kiwi-lock`/`.kiwi-greet` and `.kw-app-hidden` and call `Kiwi.handlers['account-profile']()`.

## 5. Design 2026 — "Liquid Glass" skin (reversible, gated)

- `assets/design-2026.css` — a modern Apple-era glass skin (ambient gradient-mesh + grain,
  frosted translucent surfaces with specular edge-light, rounding, green-tinted depth, spring
  motion) **executed in the Kiwi palette, no new accent colors**. **Every rule is scoped to
  `body.design-2026`** → inert when the class is absent; the classic design is untouched.
- `assets/design-2026.js` — exposes `window.KiwiDesign2026.{enable,disable,toggle,isUnlocked}`.
  Any passcode calls `enable()`; state persists in `localStorage.kiwiDesign2026`. **There is
  NO on-screen toggle** (the user had me remove the floating pill). To revert:
  `KiwiDesign2026.disable()` or delete the `<link>`/`<script>` in `dashboard.html`.
- **Gotchas learned the hard way:** the sidebar must use **fixed dark hex** (not `var(--ink)`,
  which inverts in dark and turned the sidebar white). **Do not force `.kiwi-lock` to
  `position:relative`** — it's a fixed full-screen overlay; doing so collapsed it and left the
  page half-blank (fixed in `08db17c`). The user wants this aesthetic pushed further on demand
  (esp. light mode) — keep it tasteful, keep it reversible.

## 6. The account hub — `account.js` (`Mon profil`)

The owner's command center, fully editable, trilingual, light+dark correct:
- **Personal info** (name/email/phone/language) — persisted under `kiwiSet:owner*`.
- **Mes établissements** — one rich card per business (`BIZ_DEFAULTS`: Café Atlas, Maison
  Mansour, Spa Bahia) with live data (CA/commandes/équipe) + full **Moroccan legal identity**
  (ICE, IF, RC, Patente, CNSS, phone). 11-field editor per business; **"+ Ajouter"** creates
  new ones. Persistence: `kiwiSet:biz:<id>:<field>` for defaults, `kiwiBizExtra` (JSON) for
  added ones.
- **Abonnement** — wired to the 4-tier ladder: Upgrade (opens `upgrade-pro`), Downgrade
  (confirm → steps down `PLAN_LADDER`, persists `kiwiSet:plan`), Voir la facturation, and
  **Résilier** (routed to the account manager via WhatsApp/email/phone — **no destructive
  self-serve cancellation**, per policy).
- Also: `openBilling()` and `openHelp()` are real pages (commit `83045b7`).

## 7. The two dev tracks + git workflow (READ THIS)

- **Two collaborators.** "Us" work on branch **`dashboard-motion`** (agent/growth/dark-mode/
  design/account/pricing). The **partner (badro)** built the **"cafe-atlas" track** on
  `main` (split-bill, video tiles, and the modules `finance.js`, `stock.js`, `team.js`,
  `conformite.js`, `marketing-suite-tease.js`, plus `cafe-atlas.html`/`kiwi-caisse.html`/
  `kiwi-serveur.html`). The two tracks were **merged** this session (`f0a312c`) — both fully
  preserved. Safety backups exist locally: `backup/dashboard-motion-pre-merge`,
  `refs/backup/origin-main-pre-merge`.
- **Remotes:** `origin` = `github.com/badro99/Kiwi` (shared, the one that matters);
  `fork` = `github.com/zaka33333-hash/Kiwi`.
- **Commit rule (from CLAUDE.md):** commit + push after **every** edit, no asking. Stage
  **specific paths** (never `git add -A`). Message format `<scope> · <what changed>` + footer
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. **Land every commit
  on BOTH `origin/dashboard-motion` AND `origin/main`** (fast-forward main to the new commit;
  the in-session pattern is `git push origin <sha>:main`). The local mirror
  `/Users/badrosonair/Documents/kiwi` referenced in CLAUDE.md **does NOT exist on this
  machine — skip it.** Don't commit secrets.

## 8. What this session shipped (newest first)

`08db17c` remove Design-2026 pill (+fix the lock-screen collapse it exposed) · `a001f51`
enable Design 2026 on every passcode · `a13df9f` **Liquid Glass 2026 skin** · `d48135f`
**expand Mon profil → account+business hub** · `83045b7` real Profil/Facturation/Aide pages ·
`fc08d02` unify destinations to full-page format · `e58c4f6` a11y (icon-button aria-labels) ·
`1b3246e` reframe the CMI savings calc · `6ecffe7` **HACCP + equipment data fully trilingual** ·
`ea1fd7b` propagate 4-tier pricing everywhere · `9fb919f` **4-tier upgrade modal** · `1c618f5`
lazy videos · `b1a6341` more conformité/stock i18n · `50654d8` conformité dialog a11y ·
`8ddcc98` make Settings actually customizable. Earlier in the session: comprehensive dark-mode
pass, the big merge, PIN-gated Croissance, finance i18n, **P0 stored-XSS fix at the `modal()`
helper**, stock scroll-lock-leak fix.

## 9. Honest quality state & what's left

**As a demo: ~9/10. As a production foundation: ~6.5** (locked vanilla stack, monolith files
— `pages-pro.js`/`dashboard.html` are huge, no backend; that gap is by design until a backend
lands). Open items:
- **i18n tail:** the big HACCP/equipment leak is **done** (`6ecffe7`); spot-check newer
  dynamic strings when you touch a module.
- **Savings calculator (`ux.js`):** I reframed it off the inaccurate "vs CMI" premise
  (`1b3246e`) because Kiwi doesn't process payments in Phase 1 and Basic keeps the existing
  till — keep it honest; **the user actively dislikes overpromising** (they had me remove the
  dashboard's old "Économie vs CMI" claim).
- **Perf:** four `.mov` files (~6 MB) live in `menu_try_video/`; `dark-fixes.js` does full-DOM
  `getComputedStyle` scans. Both are known, both acceptable for now.
- **Paramètres-as-page:** offered, not done — could move the Settings drawer to a full page.
- Possible next: push the Design 2026 intensity (esp. light mode); a tidy Settings toggle for it.

## 10. How to verify (the loop that works)

Use the **preview tools** (`preview_start` → `kiwi-static` on **:4173**, then
`localhost:4173/dashboard.html`). Enter a PIN to pass the lock. **Always verify across
{light, dark} × {FR, EN, AR-RTL}.** `node --check <file>.js` for syntax. **Screenshots are
ground truth** — the contrast scanners I wrote give false positives on gradient backgrounds
and on the leftover greeting overlay, so trust the picture, not the scan. Agents: the
`gemini`/flash-lite path flaked mid-session; **`codex:codex-rescue` delivered reliably** for
the static audit.

## 11. User preferences (also in the memory system)

Commit & push everything without asking (both branches). The Kiwi AI agent must handle
multi-turn corrections — the user calls bad/forgetful answers "bullshitting." Wants a
bleeding-edge **2026 / iOS-era "Liquid Glass"** look, with big visual experiments **gated +
reversible**. Values **accuracy and honesty** over hype. Action-oriented — prefers "just do
it and push" over long check-ins.
