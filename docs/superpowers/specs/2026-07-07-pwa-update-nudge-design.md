# Kiwi — PWA Update Nudge (Round 3)

- **Date:** 2026-07-07
- **Status:** Design — approved (user gave blanket approval to finish round 3)
- **Author:** Claude (brainstormed with the owner)
- **Part of goal:** "Kiwi as real apps — caisse + Windows POS, then a merchant phone app, all 10/10." Round **three of three**: ① Caisse (shipped) → ② Merchant phone app (shipped) → ③ polish/hardening (this doc).

## 1. Goal

Give both installed apps (owner "Kiwi" + "Kiwi Caisse") a **safe, controlled update path**: when a new version is deployed, the app shows a branded, tappable "new version" nudge instead of silently swapping assets. Tapping refreshes onto the fresh version; nothing auto-reloads, so a cashier's sale is never interrupted.

**Scope decision (this session, via AskUserQuestion):** round 3 = **PWA update-nudge only.** The other hardening candidates (phone cold-start performance, iOS launch splash, a11y/motion audit) were considered and deliberately deferred.

## 2. Non-goals

- Performance / lazy-load pass, iOS splash images, a11y audit (deferred hardening candidates).
- Background/push update notifications (needs a backend; the nudge only shows while the app is open).
- Auto-reload on update (explicitly rejected — a POS must never reload mid-sale).
- Vertical phone-responsiveness, café feature gaps (feature work, not this round).

## 3. Current state (the problem)

- `kiwi-sw.js` calls `self.skipWaiting()` on `install`, so a newly-deployed service worker **activates immediately** and can swap cached assets under a session that is mid-render (or mid-sale on the caisse).
- Neither `assets/dashboard-pwa.js` nor `assets/caisse-pwa.js` does anything with SW updates — no "new version" signal exists. Confirmed: no `updatefound` / `controllerchange` / update UX anywhere.
- Net risk: a deploy can strand a merchant on a stale (or half-swapped) cached app with no way to know.

## 4. Architecture

Move from **blind auto-update** to **controlled update**: the new SW installs and *waits*; the page detects the waiting worker and shows a nudge; the user taps; only then does the SW activate and the page reload — exactly once. The nudge lives in one shared, self-contained module used by both apps.

```
kiwi-sw.js               ← EDIT: drop blind skipWaiting; add message→skipWaiting; cache v1→v2
assets/pwa-update.js     ← NEW: KiwiPWAUpdate.watch(reg) — detect waiting worker, show nudge, reload once
assets/dashboard-pwa.js  ← EDIT: hand its registration to KiwiPWAUpdate.watch(reg)
assets/caisse-pwa.js     ← EDIT: same
dashboard.html           ← EDIT: load pwa-update.js before dashboard-pwa.js
kiwi-caisse.html         ← EDIT: load pwa-update.js before caisse-pwa.js
```

## 5. Components

### 5.1 Shared update module (`assets/pwa-update.js`, NEW)
- **Purpose:** one place that owns the update-nudge UX for both apps.
- **Interface:** `window.KiwiPWAUpdate = { watch(registration) }`.
  - `watch(reg)`: if a worker is already `reg.waiting` and a controller exists, nudge now; on `updatefound`, watch `reg.installing` and nudge when it reaches `installed` **while a controller exists** (an update, not a first install).
  - The nudge is a branded FR pill — "Nouvelle version disponible · Rafraîchir" — built with `createElement`/`textContent`, styled with **hardcoded brand hex** (no dependency on either app's CSS/tokens), fixed bottom-center, above safe-area. Reduced-motion: appears without the slide.
  - On tap: set an intent flag, `reg.waiting.postMessage({ type: 'SKIP_WAITING' })` (or reload directly if the waiting worker is already gone).
  - A single `controllerchange` listener reloads **once, only if the user tapped** (guards against reloading on a first-visit `clients.claim()`).
- **Depends on:** nothing; consumed by 5.3 / 5.4.

### 5.2 Service worker (`kiwi-sw.js`, EDIT)
- Remove `self.skipWaiting()` from the `install` handler (the new worker now waits).
- Add a `message` handler: on `{ type: 'SKIP_WAITING' }`, call `self.skipWaiting()`.
- Keep `clients.claim()` in `activate` so once it does activate it controls immediately.
- Bump `CACHE` `kiwi-app-v1` → `kiwi-app-v2`; add `/assets/pwa-update.js` to `SHELL`.

### 5.3 / 5.4 App runtimes (`dashboard-pwa.js`, `caisse-pwa.js`, EDIT)
- Change each `register('/kiwi-sw.js')` to capture the resolved registration and call `window.KiwiPWAUpdate.watch(reg)` (guarded by existence).

### 5.5 HTML wiring (`dashboard.html`, `kiwi-caisse.html`, EDIT)
- Load `<script defer src="assets/pwa-update.js"></script>` before each app's `-pwa.js`. (Both `defer`; the registration runs in a `load` handler, after all defer scripts, so `KiwiPWAUpdate` is defined by then.)

## 6. Data flow

Browser fetches a changed `kiwi-sw.js` → new worker installs and **waits** → page (via `watch`) sees `installed` + existing controller → nudge shown → user taps → `SKIP_WAITING` message → SW `skipWaiting` + activate + `clients.claim` → `controllerchange` → one reload → fresh version. No sale is ever interrupted.

## 7. Verification

- `node tools/check.js` green (new JS parses; no new `data-action`/`data-i18n`; scripts balanced).
- Live: on the dashboard, register the v2 SW, force an update so a worker enters `waiting`, confirm the nudge appears; tap → the waiting worker activates and the page reloads once; confirm no reload on a first-ever install (controllerchange from initial claim is ignored).
- Regression: caisse still registers + loads; both apps still work offline (shell cached under `kiwi-app-v2`).
- Deploy to both remotes.

## 8. Risks & honest limits

- **First-deploy transition:** the deploy that *introduces* this code still activates under the old (skipWaiting) SW once; the controlled flow governs every deploy after. Self-heals within a normal open/close cycle.
- The nudge only appears while the app is open (no background push — backend horizon).
- `controllerchange` reload is guarded to fire only after an explicit tap, never on the initial `clients.claim()`.
