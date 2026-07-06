# Kiwi PWA Update Nudge Implementation Plan

> **For agentic workers:** small, tightly-coupled round (6 files, one update handshake) — executed inline under supervision rather than fanned out, then live-verified in the browser. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Controlled PWA update — a new service worker waits, a branded nudge invites the user to refresh, and only a tap activates + reloads. Never interrupts a sale.

**Architecture:** Drop blind `skipWaiting`; a shared `pwa-update.js` watches the registration and drives a message→`skipWaiting`→`controllerchange`→reload handshake. Both apps opt in by handing their registration to `KiwiPWAUpdate.watch(reg)`.

**Tech Stack:** Vanilla JS, Service Worker message channel, Web App shell (cache `kiwi-app-v2`). Validation via `node tools/check.js` + live preview.

---

### Task 1: Shared update module `assets/pwa-update.js` (NEW)

Create with this content:

```javascript
/* Kiwi — shared PWA update nudge. Given a service-worker registration, watches
 * for a newly-installed worker waiting to take over and shows a branded,
 * tappable "new version" nudge. Tapping activates the waiting worker and reloads
 * once. Never auto-reloads — a sale is never interrupted. Self-contained (brand
 * hex, no CSS/token dependency) so it works on the dashboard and caisse alike.
 * FR-only text; no data-action / data-i18n. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shown = false, userAsked = false, reloading = false;

  function nudge(reg) {
    if (shown || !document.body) return;
    shown = true;
    var bar = document.createElement('button');
    bar.id = 'kiwi-update';
    bar.type = 'button';
    bar.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));' +
      'transform:translateX(-50%) translateY(' + (reduce ? '0' : '160%') + ');z-index:10000;' +
      'display:flex;align-items:center;gap:12px;padding:11px 14px 11px 18px;border:0;border-radius:14px;cursor:pointer;' +
      'background:#053B2C;color:#F7F5F0;font:600 13.5px/1 "Inter Tight",system-ui;' +
      'box-shadow:0 16px 40px -14px rgba(5,59,44,.6);transition:transform .34s cubic-bezier(0.34,1.45,0.5,1)';
    var label = document.createElement('span');
    label.textContent = 'Nouvelle version disponible';
    var action = document.createElement('span');
    action.textContent = 'Rafraîchir';
    action.style.cssText = 'padding:6px 12px;border-radius:9px;background:#7DF2B0;color:#053B2C;font-weight:700';
    bar.appendChild(label); bar.appendChild(action);
    bar.addEventListener('click', function () {
      userAsked = true;
      action.textContent = '…';
      bar.disabled = true;
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      else window.location.reload();
    });
    document.body.appendChild(bar);
    if (!reduce) requestAnimationFrame(function () { bar.style.transform = 'translateX(-50%) translateY(0)'; });
  }

  function watch(reg) {
    if (!reg) return;
    // A worker already waiting when we attach (installed on a prior load).
    if (reg.waiting && navigator.serviceWorker.controller) nudge(reg);
    // A new worker starts installing → nudge once installed, if a controller exists
    // (an update — not a first-ever install).
    reg.addEventListener('updatefound', function () {
      var sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', function () {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) nudge(reg);
      });
    });
  }

  // Reload once the waiting worker takes control — but ONLY if the user tapped
  // (the first-ever install's clients.claim() also fires controllerchange).
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!userAsked || reloading) return;
      reloading = true;
      window.location.reload();
    });
  }

  window.KiwiPWAUpdate = { watch: watch };
})();
```

- [ ] Create the file · `node tools/check.js` parses it clean.

### Task 2: `kiwi-sw.js` — wait instead of skip; message-driven activate; cache v2

- Change `var CACHE = 'kiwi-app-v1';` → `var CACHE = 'kiwi-app-v2';`
- In `install`, delete the line `  self.skipWaiting();` (keep the `caches.open(CACHE)...` block).
- Add `'/assets/pwa-update.js'` to the `SHELL` array (near the other `/assets/*.js`).
- Add this handler (after the `activate` listener):
```javascript
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
```
- [ ] Keep `clients.claim()` in `activate` untouched.

### Task 3: `assets/dashboard-pwa.js` — hand registration to the watcher

Replace:
```javascript
      navigator.serviceWorker.register('/kiwi-sw.js').catch(function () {});
```
with:
```javascript
      navigator.serviceWorker.register('/kiwi-sw.js').then(function (reg) {
        if (window.KiwiPWAUpdate) window.KiwiPWAUpdate.watch(reg);
      }).catch(function () {});
```

### Task 4: `assets/caisse-pwa.js` — same watcher wiring

Replace:
```javascript
      navigator.serviceWorker.register('/kiwi-sw.js').catch(function () {});
```
with:
```javascript
      navigator.serviceWorker.register('/kiwi-sw.js').then(function (reg) {
        if (window.KiwiPWAUpdate) window.KiwiPWAUpdate.watch(reg);
      }).catch(function () {});
```

### Task 5: HTML wiring

- `dashboard.html`: insert `<script defer src="assets/pwa-update.js"></script>` immediately before the `assets/dashboard-pwa.js` script line.
- `kiwi-caisse.html`: insert `<script defer src="assets/pwa-update.js"></script>` immediately before the `assets/caisse-pwa.js` script line.
- [ ] `node tools/check.js` green (script tags balanced).

### Task 6: Verify + deploy

- [ ] `node tools/check.js` → all checks passed.
- [ ] Live: register v2 SW on the dashboard; force `registration.update()` after editing to create a `waiting` worker; confirm the nudge appears; tap → waiting worker activates + one reload; confirm a first-ever install does NOT reload.
- [ ] Caisse regression: still registers + offline.
- [ ] Commit `pwa · controlled update-nudge across both apps (retire blind skip-waiting)`; push both remotes.

---

## Notes
- The nudge is FR-only, self-contained (brand hex), and reduced-motion safe — no dependency on either app's stylesheet.
- Bumping the cache to `v2` is what makes the new SW differ and cleans the old cache on activate.
- Honest limit: the deploy that introduces this still swaps once under the old skipWaiting SW; every deploy after is controlled.
