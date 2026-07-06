# Kiwi Caisse — Premium PWA Elevation (Round 1)

- **Date:** 2026-07-06
- **Status:** Design — awaiting review
- **Author:** Claude (brainstormed with the owner)
- **Part of goal:** "Kiwi as real apps — caisse on Android terminals + Windows POS, then a merchant phone app, all 10/10." This spec is **round one of three**: ① Caisse (this doc) → ② Merchant phone app → ③ polish/hardening.

## 1. Goal

Turn the existing web caisse (`kiwi-caisse.html`) into a **gorgeous, installable, responsive point-of-sale app** that runs full-screen on Android cashier terminals, Windows POS machines, and phones — at the same premium bar we just set on the merchant dashboard — without leaving the locked vanilla HTML/CSS/JS stack.

**Decisions already made (see AskUserQuestion history):**
- **Architecture:** Installable **PWA** — one vanilla-web codebase installs as an app on all three device types. No native rewrite, no framework, no backend dependency.
- **Round-1 deliverable:** *Elevate + make installable* (not a from-scratch redesign; not install-only).
- **Deep feature audit targets:** **Café/Restaurant** and **Pressing/Services**. (The premium surface + install applies to *all* verticals cheaply because it's shared chrome; only the deep feature-gap audit is scoped to these two.)
- **Hardware:** **Mock + future-ready bridge** — simulate peripherals for the pilot, expose a clean Web Serial/USB/Bluetooth seam to fill later. No certified EMV in round one.

## 2. Non-goals (explicitly out of scope for round one)

- The merchant phone app (round two) and cross-surface hardening (round three).
- Certified on-device card payment (EMV) / a payment provider / any backend.
- Real driver code for printers, drawers, scanners (only the mock + seam).
- Deep feature audits of the other ~14 verticals (they still receive the shared premium surface + installability, just not a bespoke feature-gap pass this round).
- Multi-device data sync (needs the backend horizon).

## 3. Current state (what we're building on)

- `kiwi-caisse.html` (~10.5k lines) boots a **dark PIN dispatcher** (Darija greeting, big touch keypad) that routes 4-digit codes to per-vertical registers via `assets/pos-dispatch.js`.
- Each vertical has its own module + stylesheet (`assets/pos-boulangerie.*`, `pos-boutique.*`, `pos-coiffure.*`, `pos-epicerie.*`, `pos-fastfood.*`, `pressing-caisse.*`, …). The register layout is a **landscape**: left nav sidebar · center category-tabbed item grid · right live ticket panel · Valider CTA.
- **Gap 1 — flatness:** the caisse does **not** load the shared `tokens.css`; each per-vertical stylesheet hardcodes ~30 flat `#fff` fills. It reads as an "unfinished template," the same problem just fixed on the dashboard.
- **Gap 2 — not an app:** no `manifest.webmanifest`, no service worker. It's a browser page, not a full-screen installable app; it does not work offline.
- **Gap 3 — portrait:** the landscape grid + side ticket does not reflow gracefully for a ~390px handheld cashier terminal.

## 4. Architecture

Keep the existing structure (dispatcher + per-vertical modules). Add a **shared premium layer** and a **PWA shell** around it, plus **responsive** rules. No module is rewritten; we wire in the shared material language and package the app.

```
kiwi-caisse.html
  ├─ <link> tokens.css            ← NEW: caisse now speaks the shared material language
  ├─ <link> caisse-skin.css       ← NEW: elevation/paper/motion applied to caisse chrome
  ├─ <link> manifest.webmanifest  ← NEW: installable app metadata
  ├─ assets/caisse-pwa.js         ← NEW: service-worker registration + install/offline UX
  ├─ assets/caisse-sw.js          ← NEW: service worker (app-shell cache)
  ├─ assets/caisse-hardware.js    ← NEW: peripheral bridge (mock + Web Serial/USB/BT seam)
  ├─ assets/pos-dispatch.js       ← unchanged
  └─ assets/pos-*.(js|css)        ← per-vertical: #fff swept to warm tokens; feature pass on café + pressing
```

## 5. Components (units — purpose · interface · dependencies)

### 5.1 Shared design tokens (already partly landed)
- **Purpose:** one material vocabulary (elevation, warm paper, motion curves) across dashboard *and* caisse.
- **Interface:** CSS custom properties `--elev-1/--elev-2`, `--paper-elev` (already added to `tokens.css`; dark overrides in `theme.css`). Add motion tokens if missing (`--spring` = `cubic-bezier(0.34,1.45,0.5,1)`).
- **Depends on:** nothing. Wired into the caisse by adding the `tokens.css` link.

### 5.2 Caisse premium skin (`assets/caisse-skin.css`, NEW)
- **Purpose:** apply the lit-surface recipe to the caisse's own component classes without touching per-vertical logic.
- **Interface:** targets the shared chrome — item tiles (`.item*`, `.card*`), the ticket panel, category tabs, the sidebar, the Valider CTA. Gives each a resting `--elev-1`, warm `--paper-elev` fill, green-tinted hover/press, lit icon treatment; registers the **category tabs as a liquid-lens group** so the signature motion appears on the surface the cashier touches most.
- **Depends on:** 5.1.

### 5.3 Per-vertical `#fff` sweep
- **Purpose:** kill the ~30-per-file cold `#fff` fills so every vertical reads as warm lit paper.
- **Interface:** mechanical replace of card/panel-background `#fff` → `var(--paper-elev)` across `assets/pos-*.css` + `pressing-caisse.css`, leaving genuine whites (toggle knobs, on-ink text) alone. Batchable (candidate for a cheap bulk pass).
- **Depends on:** 5.1. **Risk:** over-replacement — mitigated by reviewing each file's non-card `#fff` (knobs, dots) before sweeping.

### 5.4 Caisse motion layer (in `caisse-skin.css` + small JS hooks)
- **Purpose:** make ringing up feel alive.
- **Interface:** item-grid entrance stagger (gated, plays once per vertical load, not on every re-render); spring tap feedback on tiles (Web Animations, no CSS dep); **add-to-ticket** → the new ticket row springs in and the **total counts up**; category switch rides the liquid-lens; Valider → success choreography (confetti-scale + checkmark). Everything suppressed under `prefers-reduced-motion`.
- **Depends on:** 5.1, `liquid-lens.js` (already loaded).

### 5.5 PWA shell (`manifest.webmanifest`, `assets/caisse-sw.js`, `assets/caisse-pwa.js`, NEW)
- **Purpose:** make it a real, offline-capable, full-screen app on every device.
- **Interface:**
  - `manifest.webmanifest`: `name` "Kiwi Caisse", `short_name` "Caisse", maskable brand icons (192/512), `theme_color` `#053B2C` (--riad), `background_color` `#0A0F0D`, `display` `fullscreen` (fallback `standalone`), `orientation` `any`, `categories` `["business","productivity"]`, `start_url` `/kiwi-caisse.html`.
  - `caisse-sw.js`: cache-first **app shell** (the caisse HTML + all its CSS/JS + fonts + icons) so it opens with no network; runtime cache for same-origin assets; versioned cache bust on deploy.
  - `caisse-pwa.js`: register the SW; capture `beforeinstallprompt` and surface a branded "Installer la caisse" affordance; iOS `apple-mobile-web-app-*` meta + an install hint; request full-screen on launch where allowed; an offline/online status reflection.
- **Depends on:** all app assets being same-origin (they are). **Constraint:** requires HTTPS — satisfied by the Cloudflare/Pages hosts.

### 5.6 Responsive register
- **Purpose:** 10/10 at all three device shapes.
- **Interface:** breakpoints —
  - **Landscape ≥1100px** (Windows POS / Android tablet): current three-column grid + persistent side ticket, elevated.
  - **Mid 768–1099px:** grid narrows; ticket stays docked but slimmer.
  - **Portrait ≤767px** (Android handheld ~360–430px): item grid reflows to 2–3 big-target columns; the **ticket becomes a bottom sheet** — a peek bar showing item count + total that expands to the full ticket; primary actions (add, Valider) thumb-reachable. The PIN dispatcher and every vertical verified at both shapes.
- **Depends on:** 5.2 (so elevated surfaces reflow correctly).

### 5.7 Feature-completeness pass (Café + Pressing)
- **Purpose:** each of the two audited registers hits the full POS bar for the pilot.
- **The bar (audit each vs current; fill top gaps):**
  - **Café/Restaurant:** menu grid + modifiers (size/extras/notes) · counter & table mode · split bill (item/guest/amount) · hold/park + retrieve ticket · discount/comp/void/refund · payment card/QR/cash-with-change/link · send-to-kitchen (KDS handoff) · receipt + reprint · client/loyalty attach · offline sale queue.
  - **Pressing/Services:** per-piece grid + tags (délicat/multi-pièces/au m²) · per-piece label generation · promised-date (+ express) · client attach + phone search · claim-ticket retrieval · deposit/full payment · deposit→in-process→ready→picked-up flow · receipt + labels · offline queue.
- **Interface:** additive handlers on the existing `[data-action]` router; new state persisted in the caisse's existing localStorage model. Deliverable is "audit → fill the highest-value gaps," not "build every line item regardless of what already exists."
- **Depends on:** 5.2/5.4 for the elevated/animated surfaces the new controls live on.

### 5.8 Hardware bridge (`assets/caisse-hardware.js`, NEW)
- **Purpose:** a clean seam so peripherals are mocked now and real later without touching register code.
- **Interface:** `KiwiHardware.print(ticket)`, `.openDrawer()`, `.scan(cb)`, `.readCard(amount)` — each resolves against a **mock** (print preview modal, simulated scan input, mock card animation) with a feature-detected path to Web Serial (ESC/POS), WebUSB, and Web Bluetooth stubbed behind the same interface. Registers never call a device directly.
- **Depends on:** nothing; consumed by 5.7.

## 6. Data flow

Unchanged model: each vertical keeps its state in `localStorage`; sales persist locally (as today). The service worker adds an **offline app shell** so the register loads and operates with no network; sales recorded offline stay in local storage (multi-device sync remains the backend horizon, out of scope). No new data source is introduced.

## 7. Design language (the 10/10 bar)

Same as the dashboard elevation: warm elevated paper (`--paper-elev`), two-layer atlas-green-tinted resting shadow + inset highlight (`--elev-1/2`), lit mint→atlas icon treatment, Instrument Serif editorial accents, the liquid-lens as the one selection motion. Brand rules hold: no new accent colors, no bold display weights, no emojis in titles/CTAs, mint ≤5%.

## 8. Verification

- **Viewports:** Windows POS (1920×1080), Android tablet (1024×768 landscape), Android handheld (390×844 portrait), phone — via the live preview.
- **Install:** confirm installable + standalone/fullscreen on Chromium (Android/Windows) and the iOS add-to-home path; confirm **offline load** with the network cut.
- **Per-vertical smoke:** the PIN dispatcher + each vertical renders elevated and reflows at both shapes.
- **Deep flows:** ring-up → ticket → each payment method → receipt, for café and pressing, including hold/retrieve and (pressing) claim-ticket + status flow. First-sale celebration parity with the dashboard where a sale is real.
- Every change verified in-browser before commit; `node tools/check.js` green before each push.

## 9. Risks & mitigations

- **`#fff` over-sweep** breaks knobs/toggles → review non-card `#fff` per file before replacing.
- **Service-worker staleness** serving old assets after deploy → versioned cache name + `skipWaiting`/`clients.claim` + a "new version" refresh nudge.
- **Fullscreen/kiosk limits** vary by OS/browser → progressive: install → standalone → fullscreen where granted; never depend on fullscreen for function.
- **Scope creep in 5.7** → it's an audit-and-fill against a fixed bar for two verticals, not an open rebuild.

## 10. Sequencing within round one

1. Foundation: wire `tokens.css` + `caisse-skin.css`; elevate shared chrome; register the tab liquid-lens.
2. `#fff` sweep across all vertical stylesheets.
3. Motion layer (grid/tap/add-to-ticket/total/validate).
4. Responsive: portrait bottom-sheet ticket + breakpoints; verify all verticals both shapes.
5. PWA shell: manifest + service worker + install/offline UX; verify install + offline.
6. Hardware bridge (mock + seam).
7. Feature pass: café, then pressing.
8. Full verification sweep; deploy.
