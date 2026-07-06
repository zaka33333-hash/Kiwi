# Kiwi — Merchant Phone App (Round 2)

- **Date:** 2026-07-06
- **Status:** Design — approved (awaiting spec review)
- **Author:** Claude (brainstormed with the owner)
- **Part of goal:** "Kiwi as real apps — caisse on Android terminals + Windows POS, then a merchant phone app, all 10/10." This is **round two of three**: ① Caisse (shipped) → ② Merchant phone app (this doc) → ③ polish/hardening.

## 1. Goal

Turn the existing owner dashboard (`dashboard.html`) into a **gorgeous, installable, offline, native-feeling phone app** called **Kiwi** — the merchant's pocket surface for watching and steering the business — at the same premium bar as the caisse, without leaving the locked vanilla HTML/CSS/JS stack.

**Decisions already made (this session, via AskUserQuestion):**
- **Scope:** *Package + native polish.* The dashboard already reflows to a phone; round 2 makes it an installable, offline PWA and adds native-feel touches. It does **not** rebuild the phone layout and does **not** build a new "pocket home" surface.
- **App identity:** installs as **"Kiwi"** (the flagship owner app). The till remains the separate "Kiwi Caisse". Distinct name + icon so both are unambiguous on the home screen.
- **Native touches (all four):** app launch feel · pull-to-refresh + skeletons · live-sale toasts · page transitions + press.
- **Offline:** app-shell only (loads offline, shows last-cached numbers). No offline data sync; offline sale *capture* stays the caisse's job.

## 2. Non-goals (explicitly out of scope for round two)

- Cross-surface hardening (round three).
- A new phone-first "pocket home" glance surface (considered and declined this round).
- Real push notifications (needs a backend + push service). The live-sale alert is an **in-app simulated** toast, consistent with the rest of the mocked app.
- Offline data sync / multi-device consistency (backend horizon).
- A native app-store binary. This is a PWA; it installs via the browser's add-to-home / install prompt.
- Rebuilding the phone layout — `assets/mobile.css` + `assets/mobile-nav.js` already deliver the reflow and are kept as-is except where a native touch must extend them.
- Deep feature work on any vertical (that was round 1's caisse audit; this round is packaging + polish of the owner surface).

## 3. Current state (what we're building on)

- `dashboard.html` (~6.2k lines) is the merchant/owner dashboard: premium ambient-blob background, elevated cards, full destination navigation via `assets/pages.js`, date-range engine via `assets/dateRange.js`.
- `assets/mobile.css` (~500 lines, gated `@media (max-width: 860px)`) is a serious phone rebuild: off-canvas drawer sidebar, compact flush topbar, a floating **Liquid-Glass bottom tab bar** (Accueil · Vente · Kiwi AI · Menu), native bottom-sheet drawers, 2-line list rows, finger-sized targets, press feedback.
- `assets/mobile-nav.js` (~340 lines) injects the tab bar (liquid-lens pill, badge counts, i18n labels) and the hamburger.
- **Gap — not an app:** `dashboard.html` has **no manifest, no service worker, no install affordance**. It is a very good responsive *page*, not an installable offline *app*.
- **Round-1 offline bug (discovered while designing this):** `assets/caisse-pwa.js` registers its SW as `register('assets/caisse-sw.js')`, giving it scope `/assets/`. The caisse page is at `/kiwi-caisse.html` (root), **outside** that scope, so the SW controls no navigations and its offline navigation fallback (`caisse-sw.js`) can never fire. Round 1's "offline" was the browser HTTP cache, not the SW. Round 2 fixes this.

## 4. Architecture

Keep the existing structure. Add a **PWA shell** and a **native-polish layer** around the dashboard, and consolidate service-worker ownership across both apps.

### 4.1 The service-worker scope constraint (why there is one shared SW)

A browser rule: **only one service worker owns a given scope.** Both installable pages live at origin root — `/dashboard.html` and `/kiwi-caisse.html` — and both need scope `/` to be served offline (their navigations are root-level). Two separate root-scoped SWs would *thrash*: registering a second SW at scope `/` replaces the first, so whichever page loads last unregisters the other's SW and breaks its offline.

Therefore there is exactly **one service worker at the repo root, `/kiwi-sw.js`, scope `/`**, that caches *both* app shells and serves each offline by URL. Two separate manifests still make them install as two distinct apps. This also fixes the round-1 caisse offline bug: the caisse's registration repoints to the same root SW.

```
Repo root
  ├─ dashboard.html            ← EDIT (head only): manifest link, meta, PWA + native scripts
  ├─ kiwi-caisse.html          ← unchanged (its SW registration lives in caisse-pwa.js)
  ├─ kiwi-sw.js                ← NEW: single root service worker (scope /), both shells
  ├─ dashboard.webmanifest     ← NEW: the "Kiwi" owner app metadata
  ├─ manifest.webmanifest      ← unchanged (caisse)
  └─ assets/
      ├─ dashboard-pwa.js      ← NEW: register /kiwi-sw.js, install UX, offline reflection, standalone class
      ├─ dashboard-native.js   ← NEW: the four native behaviors (phone/standalone-gated)
      ├─ dashboard-native.css  ← NEW: shimmer, PTR spinner, toast, transitions, safe-area insets
      ├─ caisse-pwa.js         ← EDIT (1 line): register('assets/caisse-sw.js') → register('/kiwi-sw.js')
      ├─ caisse-sw.js          ← DELETE: dead (wrong scope); shell list folds into /kiwi-sw.js
      ├─ mobile.css            ← unchanged unless a native touch must extend it
      ├─ mobile-nav.js         ← unchanged
      └─ icons/kiwi-app.{svg,192,512,180}  ← NEW: distinct "Kiwi" home-screen icon
```

## 5. Components (units — purpose · interface · dependencies)

### 5.1 Shared root service worker (`kiwi-sw.js`, NEW, repo root)
- **Purpose:** one SW at scope `/` that makes *both* apps load offline for real.
- **Interface:** on `install`, `skipWaiting()` + cache-open a versioned cache (`kiwi-app-v1`) and `add()` each shell asset individually (one missing file must not fail the install — same resilience pattern as round 1). The shell list is the **union** of the dashboard shell (`/dashboard.html`, its CSS/JS, fonts-referenced icons, `/dashboard.webmanifest`, native + pwa scripts) and the caisse shell (the assets currently in `caisse-sw.js`, plus `/kiwi-caisse.html`, `/manifest.webmanifest`). On `activate`, delete stale caches + `clients.claim()`. On `fetch` (GET, same-origin only): cache-first with runtime `put`; on a failed `navigate`, serve the **matching** shell — path starting `/kiwi-caisse` → `/kiwi-caisse.html`, otherwise `/dashboard.html`.
- **Depends on:** all shell assets being same-origin (they are). **Constraint:** file must be served from root so its default scope is `/` (no special header needed). HTTPS satisfied by Cloudflare/Pages; localhost is a secure context for preview.

### 5.2 Kiwi app manifest (`dashboard.webmanifest`, NEW)
- **Purpose:** make the owner dashboard installable as "Kiwi".
- **Interface:** `name` "Kiwi", `short_name` "Kiwi", `description` (owner pilotage app), `start_url` `/dashboard.html`, `scope` `/`, `display` `standalone` (browsers fall back gracefully), `orientation` `any`, `theme_color` `#053B2C` (--riad), `background_color` `#0A0F0D`, `categories` `["business","productivity"]`, maskable `icons` at 192 + 512 pointing at `assets/icons/kiwi-app-*.png` (+ the SVG as `any`).
- **Depends on:** 5.5 (icons).

### 5.3 Kiwi PWA runtime (`assets/dashboard-pwa.js`, NEW)
- **Purpose:** register the SW and own the install/offline UX for the owner app.
- **Interface:**
  - Register `/kiwi-sw.js` on `load` (guarded by `'serviceWorker' in navigator`).
  - Capture `beforeinstallprompt`; surface a branded **"Installer Kiwi"** affordance; on `appinstalled`, remove it.
  - Online/offline reflection: an **offline banner** (not just a dot — the owner needs the honest "showing last-cached data" message) that appears on `offline` and clears on `online`.
  - Add `body.standalone` when launched installed (`matchMedia('(display-mode: standalone)')` or iOS `navigator.standalone`), so the native layer and safe-area rules activate only in app mode.
- **Depends on:** 5.1.

### 5.4 Native-polish layer (`assets/dashboard-native.js` + `assets/dashboard-native.css`, NEW)
- **Purpose:** the four native touches that take the installed app to 10/10. Everything gated to the phone breakpoint (≤860px) and/or `body.standalone`; every animation suppressed under `prefers-reduced-motion`. Desktop and the responsive web view are untouched.
- **Interface — four behaviors:**
  1. **App launch feel:** manifest generates the Android splash. `dashboard-native.css` applies `env(safe-area-inset-*)` padding to the topbar, tab bar, and container **only** under `body.standalone`, so the shell sits correctly under the notch/home-bar; status-bar theming via `theme-color` + apple meta; the offline banner (5.3) is styled here.
  2. **Pull-to-refresh + skeletons:** `pointer`/`touch` handlers on the main scroll container fire **only** when scrolled to top; pull past a threshold shows a spring spinner; release triggers a refresh that re-renders the current date range through the existing `dateRange.js` subscriber path (no new data source). During the refresh window, KPI / chart / list regions swap to shimmer skeleton placeholders (reusing the existing card shells) and restore on completion.
  3. **Live-sale toasts:** while the app is foregrounded (`visibilitychange`), a native-style "Nouvelle vente" notification slides in from the top at randomized intervals, populated from the existing mock sale data; tap routes to Transactions; auto-dismiss + manual dismiss. **Simulated** — labeled as such in the spec; real push is a backend-horizon item.
  4. **Page transitions + press:** a slide/fade enter transition on destination open, driven by a CSS class toggled around the existing `pages.js` destination swap (routing is **not** rewired); deeper tactile press states on interactive rows/buttons extending what `mobile.css` already does.
- **Depends on:** 5.3 (`body.standalone`), `dateRange.js` (refresh hook), `pages.js` (destination open), existing mock sale data.

### 5.5 Kiwi app icon (`assets/icons/kiwi-app.{svg,192,512,180}`, NEW)
- **Purpose:** a home-screen mark distinct from Kiwi Caisse.
- **Interface:** the Kiwi wordmark/leaf mark on brand green (`--atlas`/`--riad`), maskable-safe (art within the safe zone). SVG master + PNGs at 192, 512 (manifest) and 180 (apple-touch-icon). Generated the same way as round 1's caisse PNG (preview canvas export).
- **Depends on:** brand tokens.

### 5.6 Caisse SW re-point (`assets/caisse-pwa.js` EDIT · `assets/caisse-sw.js` DELETE)
- **Purpose:** move the caisse onto the shared root SW so it actually loads offline, and remove the dead scoped SW.
- **Interface:** change the one registration line to `register('/kiwi-sw.js')`; delete `assets/caisse-sw.js`. The caisse's shell assets are already included in `/kiwi-sw.js` (5.1). No `kiwi-caisse.html` change required (registration lives in `caisse-pwa.js`).
- **Depends on:** 5.1. **Risk:** regressing the caisse — mitigated by re-verifying caisse install + offline after the change.

## 6. Data flow

Unchanged model: the dashboard keeps its state and mock data as today (`localStorage`, `dateRange.js`). The service worker adds an **offline app shell** so the app loads and shows last-cached numbers with no network. Pull-to-refresh re-runs the existing render path; live-sale toasts read existing mock data. No new data source. Multi-device sync remains the backend horizon.

## 7. Design language (the 10/10 bar)

Same material vocabulary as the dashboard and caisse: warm elevated paper (`--paper-elev`), atlas-green-tinted `--elev-1/2` shadows, the Liquid-Glass bottom tab bar already in place, the liquid-lens as the one selection motion, Instrument Serif editorial accents. Brand rules hold: no new accent colors, no bold display weights, no emojis in titles/CTAs, mint ≤5%. The native touches must feel like Kiwi, not like a generic PWA — the toast, spinner, and transitions use brand tokens and the spring curve (`cubic-bezier(0.34, 1.45, 0.5, 1)`).

## 8. Verification

- **Viewports:** phone (390×844) and the 860px boundary via live preview; confirm desktop is visually unchanged.
- **Install:** installable + standalone on Chromium; the iOS add-to-home path; "Installer Kiwi" affordance appears and clears on install.
- **Offline (the real test):** with the network cut, **cold-load** `/dashboard.html` from the installed app — it must open (root SW now controls the navigation). **Regression:** cold-load `/kiwi-caisse.html` offline too — it must still open after the SW consolidation.
- **Native touches:** `body.standalone` + safe-area insets correct on a notched profile; pull-to-refresh triggers only at scroll-top and refreshes; skeletons appear then restore; a live-sale toast slides in and routes on tap; destination transitions play; all stand down under `prefers-reduced-motion`.
- **Gate hygiene:** none of the native behaviors activate above 860px or outside standalone where specified; no horizontal scroll introduced.
- `node tools/check.js` green before each push; deploy to both remotes.

## 9. Risks & mitigations

- **SW scope / coexistence** — the whole reason for one root SW; mitigated by the shared-shell design and by regression-testing the caisse offline after the change.
- **Service-worker staleness** after deploy → versioned cache name + `skipWaiting`/`clients.claim`; bump the version on shell changes.
- **Pull-to-refresh vs. native scroll** — a badly-scoped PTR hijacks normal scrolling; mitigated by activating only at scroll-top past a threshold and never binding above 860px.
- **Passcode gate (Cloudflare Function)** could intercept the SW file → the SW is a static asset fetched from the authenticated page context (carries the cookie); verify it registers behind the gate.
- **i18n** — new strings (install button, offline banner, toast) must follow the captured-FR + `T` dict pattern so `tools/check.js` i18n check passes.
- **Icon confusion** with Kiwi Caisse → distinct mark + name (5.5).

## 10. Sequencing within round two

1. Shared root SW (`/kiwi-sw.js`) with both shells; re-point caisse registration; delete `caisse-sw.js`; verify **both** apps cold-load offline.
2. Kiwi manifest + icons + `dashboard.html` head wiring; verify installable as "Kiwi".
3. `dashboard-pwa.js`: SW registration, install affordance, offline banner, `body.standalone`.
4. Native layer — app launch feel (safe-area + standalone), then pull-to-refresh + skeletons, then live-sale toasts, then page transitions + press.
5. Full verification sweep (install, offline both apps, native touches, desktop-unchanged, reduced-motion); deploy to both remotes.
