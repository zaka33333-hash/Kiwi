# Kiwi Merchant Phone App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the already-responsive owner dashboard (`dashboard.html`) into an installable, offline, native-feeling phone app called **Kiwi**, reusing round 1's PWA pattern and adding four native touches.

**Architecture:** One shared service worker at the repo root (`/kiwi-sw.js`, scope `/`) caches both app shells (owner "Kiwi" + "Kiwi Caisse") and serves each offline by URL — the only way two root-level app pages coexist offline on one origin. A separate manifest installs the dashboard as "Kiwi". A phone/standalone-gated native layer (`dashboard-native.{js,css}`) adds app-launch feel, pull-to-refresh + skeletons, live-sale toasts, and page transitions. This also fixes a round-1 bug: the caisse SW was scoped to `/assets/` and controlled no navigations.

**Tech Stack:** Vanilla HTML/CSS/JS (no framework, no build). Web App Manifest, Service Worker (Cache API), Web Animations / CSS. Brand tokens in `assets/tokens.css`. Validation via `node tools/check.js` + live preview.

---

## Conventions for every task

- **Injected UI is FR-only via `textContent`** (matching `assets/caisse-pwa.js`). No `data-action` and no `data-i18n` on injected PWA/native elements — `tools/check.js` then has nothing new to validate. Build nodes with `createElement` + `textContent` + `appendChild` (no raw-markup property assignment).
- **All motion respects** `prefers-reduced-motion: reduce` (a `reduce` boolean at the top of each IIFE).
- **Native behaviors gate to phone** via `matchMedia('(max-width: 860px)')` and/or `body.standalone`; desktop must stay visually identical.
- **After each task:** `node tools/check.js` must print `✓ all checks passed`. Commit with `<scope> · <what changed>` and the footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Do NOT push per-task — the supervisor pushes both remotes after the final task.
- **Supervisor (controller) live-verifies** each task in the preview between tasks; implementer steps below are what the subagent runs.

---

### Task 1: Shared root service worker + re-point the caisse

**Files:**
- Create: `kiwi-sw.js` (repo ROOT — not `assets/`, so its default scope is `/`)
- Modify: `assets/caisse-pwa.js:6`
- Delete: `assets/caisse-sw.js`

- [ ] **Step 1: Create the shared root service worker**

Create `kiwi-sw.js` at the repository root with this exact content:

```javascript
/* Kiwi — shared service worker for both installable apps (owner "Kiwi" and
 * "Kiwi Caisse"). Served from the repo root so its scope is "/", which is the
 * only way two root-level app pages both load offline: one SW owns the scope
 * and serves whichever shell the navigation asks for. Cache-first app shell,
 * versioned bust. Replaces assets/caisse-sw.js (which was scoped to /assets/
 * and therefore controlled no navigations). */
'use strict';
var CACHE = 'kiwi-app-v1';
var SHELL = [
  '/dashboard.html',
  '/kiwi-caisse.html',
  '/dashboard.webmanifest',
  '/manifest.webmanifest',
  '/assets/tokens.css',
  '/assets/theme.css',
  '/assets/polish.css',
  '/assets/simple.css',
  '/assets/ux.css',
  '/assets/pages-pro.css',
  '/assets/polish-dashboard.css',
  '/assets/hotel.css',
  '/assets/mobile.css',
  '/assets/design-2026.css',
  '/assets/design-ios27.css',
  '/assets/dashboard-native.css',
  '/assets/i18n.js',
  '/assets/interactive.js',
  '/assets/features.js',
  '/assets/venues.js',
  '/assets/demoClock.js',
  '/assets/dateRange.js',
  '/assets/mobile-nav.js',
  '/assets/liquid-lens.js',
  '/assets/pages.js',
  '/assets/oppo-cards.js',
  '/assets/dashboard-pwa.js',
  '/assets/dashboard-native.js',
  '/assets/caisse-skin.css',
  '/assets/caisse-motion.js',
  '/assets/caisse-pwa.js',
  '/assets/caisse-hardware.js',
  '/assets/pos-dispatch.js',
  '/assets/pressing-caisse.js',
  '/assets/pressing-caisse.css',
  '/assets/lucide.min.js',
  '/assets/icons/kiwi-app.svg',
  '/assets/icons/kiwi-app-192.png',
  '/assets/icons/kiwi-app-512.png',
  '/assets/icons/kiwi-app-180.png',
  '/assets/icons/kiwi-caisse.svg'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Cache each asset individually so one missing file doesn't fail install.
    return Promise.all(SHELL.map(function (u) {
      return c.add(u).catch(function () { /* skip missing */ });
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') {
          var path = new URL(req.url).pathname;
          if (path.indexOf('/kiwi-caisse') === 0) return caches.match('/kiwi-caisse.html');
          return caches.match('/dashboard.html');
        }
      });
    })
  );
});
```

- [ ] **Step 2: Re-point the caisse's SW registration**

In `assets/caisse-pwa.js`, change the registration path (line 6) from the old scoped SW to the shared root SW:

Replace:
```javascript
      navigator.serviceWorker.register('assets/caisse-sw.js').catch(function () {});
```
with:
```javascript
      navigator.serviceWorker.register('/kiwi-sw.js').catch(function () {});
```

- [ ] **Step 3: Delete the dead scoped service worker**

```bash
git rm assets/caisse-sw.js
```

- [ ] **Step 4: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed` (note: `kiwi-sw.js` is at root, not `assets/`, so it is not syntax-scanned; that is fine — it references SW globals `self`/`caches`).

- [ ] **Step 5: Supervisor live-verify (controller runs in preview)**

Serve the repo, open `/kiwi-caisse.html`, and in the preview console confirm the SW registered at root scope and populated the cache:
- `navigator.serviceWorker.getRegistration('/').then(r => r && r.scope)` → ends in `/` (root scope).
- `caches.open('kiwi-app-v1').then(c => c.keys()).then(k => k.length)` → > 20.
- Then load `/dashboard.html` — it opens normally (the root SW now controls it too).

- [ ] **Step 6: Commit**

```bash
git add kiwi-sw.js assets/caisse-pwa.js
git commit -m "pwa · shared root service worker for both apps + fix caisse offline scope

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Kiwi manifest + app icon + dashboard head wiring

**Files:**
- Create: `dashboard.webmanifest` (repo root)
- Create: `assets/icons/kiwi-app.svg`, `assets/icons/kiwi-app-512.png`, `assets/icons/kiwi-app-192.png`, `assets/icons/kiwi-app-180.png`
- Modify: `dashboard.html` (head only, after line 7 `<link rel="icon" …>`)

- [ ] **Step 1: Create the app icon (maskable-safe SVG)**

Create `assets/icons/kiwi-app.svg` with a full-bleed brand-green field and a centered mint leaf mark inside the maskable safe zone (art within the inner ~72%):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#053B2C"/>
  <circle cx="256" cy="256" r="168" fill="#0B6E4F"/>
  <path d="M256 150 C202 188 190 300 256 366 C322 300 310 188 256 150 Z" fill="#7DF2B0"/>
  <path d="M256 168 L256 350" stroke="#053B2C" stroke-width="10" stroke-linecap="round"/>
  <path d="M256 250 L214 214 M256 288 L298 252" stroke="#053B2C" stroke-width="10" stroke-linecap="round" fill="none"/>
</svg>
```

- [ ] **Step 2: Rasterize the icon to PNGs**

macOS ships `qlmanage` (SVG→PNG thumbnail) and `sips` (resize). Run from the repo root:

```bash
qlmanage -t -s 512 -o assets/icons assets/icons/kiwi-app.svg >/dev/null 2>&1
mv assets/icons/kiwi-app.svg.png assets/icons/kiwi-app-512.png
sips -z 192 192 assets/icons/kiwi-app-512.png --out assets/icons/kiwi-app-192.png >/dev/null
sips -z 180 180 assets/icons/kiwi-app-512.png --out assets/icons/kiwi-app-180.png >/dev/null
ls -la assets/icons/kiwi-app-*.png
```
Expected: three non-zero PNGs (512/192/180). If `qlmanage` produces a blank/low-quality raster on this machine, the supervisor will regenerate the 512 PNG by drawing the SVG onto a canvas in the preview and exporting it; then re-run the two `sips` lines.

- [ ] **Step 3: Create the Kiwi manifest**

Create `dashboard.webmanifest` at the repo root:

```json
{
  "name": "Kiwi",
  "short_name": "Kiwi",
  "description": "Le tableau de bord commerçant Kiwi — pilotez votre activité depuis votre poche.",
  "start_url": "/dashboard.html",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0A0F0D",
  "theme_color": "#053B2C",
  "categories": ["business", "productivity"],
  "lang": "fr",
  "dir": "auto",
  "icons": [
    { "src": "assets/icons/kiwi-app.svg", "type": "image/svg+xml", "sizes": "any", "purpose": "any maskable" },
    { "src": "assets/icons/kiwi-app-192.png", "type": "image/png", "sizes": "192x192", "purpose": "any maskable" },
    { "src": "assets/icons/kiwi-app-512.png", "type": "image/png", "sizes": "512x512", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 4: Wire the head of `dashboard.html`**

Immediately after `dashboard.html:7` (`<link rel="icon" href="assets/favicon-dark.svg" />`), insert:

```html
<link rel="manifest" href="dashboard.webmanifest" />
<meta name="theme-color" content="#053B2C" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Kiwi" />
<link rel="apple-touch-icon" href="assets/icons/kiwi-app-180.png" />
```

- [ ] **Step 5: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed` (script-tag balance unchanged; no new `data-i18n`/`data-action`).

- [ ] **Step 6: Supervisor live-verify**

In the preview, load `/dashboard.html` and confirm:
- `document.querySelector('link[rel=manifest]').href` resolves to `/dashboard.webmanifest`, and fetching it parses as JSON.
- The three icon PNGs load (non-404) and the SVG renders as a green icon with a mint leaf.
- DevTools → Application → Manifest shows name "Kiwi", installable (no manifest errors).

- [ ] **Step 7: Commit**

```bash
git add dashboard.webmanifest dashboard.html assets/icons/kiwi-app.svg assets/icons/kiwi-app-512.png assets/icons/kiwi-app-192.png assets/icons/kiwi-app-180.png
git commit -m "pwa · Kiwi app manifest + maskable icon + dashboard head wiring

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Kiwi PWA runtime (register SW, install affordance, offline banner, standalone class)

**Files:**
- Create: `assets/dashboard-pwa.js`
- Modify: `dashboard.html` (add one script tag near the other `<script src="assets/…">` includes)

- [ ] **Step 1: Create `assets/dashboard-pwa.js`**

```javascript
/* Kiwi (owner app) — PWA registration, install affordance, offline banner,
 * standalone detection. Registers the shared root service worker (/kiwi-sw.js).
 * FR-only injected UI (matches caisse-pwa.js); no data-action / data-i18n. */
(function () {
  'use strict';

  // Standalone (installed) detection → body.standalone gates the native layer.
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }
  function markStandalone() { if (isStandalone() && document.body) document.body.classList.add('standalone'); }
  if (document.readyState !== 'loading') markStandalone();
  else document.addEventListener('DOMContentLoaded', markStandalone);

  // Register the shared root service worker.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/kiwi-sw.js').catch(function () {});
    });
  }

  // Install affordance — a branded button surfaced when the browser offers install.
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; showInstall();
  });
  function showInstall() {
    if (document.getElementById('kiwi-install') || !document.body) return;
    var b = document.createElement('button');
    b.id = 'kiwi-install';
    b.type = 'button';
    b.textContent = 'Installer Kiwi';
    b.style.cssText = 'position:fixed;right:16px;bottom:96px;z-index:9998;padding:12px 18px;' +
      'border:0;border-radius:12px;background:#0B6E4F;color:#F7F5F0;font:600 14px/1 "Inter Tight",system-ui;' +
      'box-shadow:0 8px 24px -8px rgba(11,110,79,.5);cursor:pointer';
    b.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; b.remove(); });
    });
    document.body.appendChild(b);
  }
  window.addEventListener('appinstalled', function () {
    var b = document.getElementById('kiwi-install'); if (b) b.remove();
  });

  // Offline banner — honest "showing last-cached data" reflection (styled in
  // dashboard-native.css as #kiwi-offline).
  function banner() {
    var el = document.getElementById('kiwi-offline');
    if (navigator.onLine) { if (el) el.remove(); return; }
    if (el || !document.body) return;
    el = document.createElement('div');
    el.id = 'kiwi-offline';
    el.setAttribute('role', 'status');
    el.textContent = 'Hors ligne — données de la dernière synchronisation';
    document.body.appendChild(el);
  }
  window.addEventListener('online', banner);
  window.addEventListener('offline', banner);
  if (document.readyState !== 'loading') banner();
  else document.addEventListener('DOMContentLoaded', banner);
})();
```

- [ ] **Step 2: Load it from `dashboard.html`**

Add this script tag alongside the other `assets/…` includes (e.g. immediately after `<script src="assets/mobile-nav.js"...>`):

```html
<script defer src="assets/dashboard-pwa.js"></script>
```

- [ ] **Step 3: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed` (new file parses; `<script>` tags stay balanced).

- [ ] **Step 4: Supervisor live-verify**

In the preview on `/dashboard.html`:
- `navigator.serviceWorker.getRegistration('/').then(r => r && r.active && r.active.scriptURL)` → ends `/kiwi-sw.js`.
- Emulate a notched standalone launch (`matchMedia('(display-mode: standalone)')` true, e.g. DevTools → app mode) and confirm `document.body.classList.contains('standalone')`.
- Toggle DevTools offline → a `#kiwi-offline` pill appears reading "Hors ligne …"; toggle online → it disappears.
- Desktop layout at ≥861px is visually unchanged.

- [ ] **Step 5: Commit**

```bash
git add assets/dashboard-pwa.js dashboard.html
git commit -m "pwa · Kiwi runtime — SW register, install button, offline banner, standalone flag

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Native layer — stylesheet + app-launch feel + page transitions + press

**Files:**
- Create: `assets/dashboard-native.css`
- Create: `assets/dashboard-native.js`
- Modify: `dashboard.html` (add the stylesheet link in `<head>` and the script tag near the other includes)

- [ ] **Step 1: Create `assets/dashboard-native.css`**

```css
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · native-app polish layer (phone / installed). Loaded after mobile.css.
 * Everything here is gated to the phone breakpoint and/or body.standalone and
 * stands down under prefers-reduced-motion. Desktop is never touched.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ── Offline banner (injected by dashboard-pwa.js) ── */
#kiwi-offline {
  position: fixed; top: 0; left: 50%; transform: translateX(-50%);
  z-index: 9997; margin-top: calc(8px + env(safe-area-inset-top, 0px));
  padding: 8px 16px; border-radius: 999px;
  background: #053B2C; color: #F7F5F0;
  font: 600 12.5px/1 "Inter Tight", system-ui;
  box-shadow: 0 8px 24px -10px rgba(5, 59, 44, .6);
}

/* ── App-launch feel: safe-area insets, only when installed (standalone) ── */
body.standalone .topbar,
body.standalone .kw-topbar { padding-top: env(safe-area-inset-top, 0px); }
body.standalone .container { padding-bottom: calc(124px + env(safe-area-inset-bottom, 0px)); }
body.standalone .kw-tabbar { bottom: calc(0px + env(safe-area-inset-bottom, 0px)); }

/* ── Live-sale toast (injected by dashboard-native.js) ── */
.kw-toast {
  position: fixed; top: 0; left: 50%; transform: translate(-50%, -140%);
  z-index: 9996; width: min(360px, calc(100vw - 24px));
  margin-top: calc(10px + env(safe-area-inset-top, 0px));
  display: flex; flex-direction: column; gap: 2px; text-align: start;
  padding: 12px 16px; border: 0; border-radius: 16px; cursor: pointer;
  background: var(--paper-elev, #FBFAF6); color: var(--ink, #0A0F0D);
  box-shadow: 0 18px 40px -16px rgba(5, 59, 44, .5), inset 0 0 0 1px rgba(11, 110, 79, .08);
  font-family: "Inter Tight", system-ui;
  transition: transform .34s cubic-bezier(0.34, 1.45, 0.5, 1), opacity .34s ease;
}
.kw-toast strong { font-size: 13.5px; font-weight: 700; color: var(--atlas, #0B6E4F); }
.kw-toast span { font-size: 13px; opacity: .8; }
.kw-toast.in { transform: translate(-50%, 0); }

/* ── Pull-to-refresh spinner (injected by dashboard-native.js) ── */
.kw-ptr {
  position: fixed; top: 0; left: 50%; transform: translateX(-50%) translateY(-8px);
  z-index: 9995; width: 30px; height: 30px; border-radius: 50%;
  margin-top: env(safe-area-inset-top, 0px);
  background: var(--paper-elev, #FBFAF6); opacity: 0;
  box-shadow: 0 6px 16px -6px rgba(5, 59, 44, .4);
  display: grid; place-items: center;
  transition: opacity .2s ease, transform .2s ease;
}
.kw-ptr i {
  width: 16px; height: 16px; border-radius: 50%; display: block;
  border: 2px solid rgba(11, 110, 79, .25); border-top-color: var(--atlas, #0B6E4F);
}
.kw-ptr.ready i { transform: scale(1.1); }
.kw-ptr.spin i { animation: kw-spin .7s linear infinite; }
@keyframes kw-spin { to { transform: rotate(360deg); } }

/* ── Refresh shimmer: one sweeping sheen over the content while refreshing ── */
@media (max-width: 860px) {
  .container { position: relative; }
  body.kw-refreshing .container::after {
    content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
    border-radius: 16px;
    background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, .45) 50%, transparent 70%);
    background-size: 200% 100%; animation: kw-shimmer 1s linear infinite;
  }
}
@keyframes kw-shimmer { 0% { background-position: 180% 0; } 100% { background-position: -180% 0; } }

/* ── Page-enter transition + tactile press (phone only) ── */
@media (max-width: 860px) {
  .kw-enter { animation: kw-enter .34s cubic-bezier(0.34, 1.45, 0.5, 1) both; }
  .kpi, .card, .oppo-card, .list-row, .stat-card { transition: transform .12s ease; }
  .kpi:active, .card:active, .oppo-card:active, .list-row:active, .stat-card:active { transform: scale(.985); }
}
@keyframes kw-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* ── Reduced motion: kill every animation/transition in this layer ── */
@media (prefers-reduced-motion: reduce) {
  .kw-toast { transition: none; }
  .kw-ptr, .kw-ptr.spin i { animation: none; transition: none; }
  body.kw-refreshing .container::after { animation: none; }
  .kw-enter { animation: none; }
}
```

- [ ] **Step 2: Create `assets/dashboard-native.js` with the app-launch/transition/press behaviors**

This is the scaffold for the native layer plus behaviors ③(page transitions) and ④(press). Pull-to-refresh (Task 5) and toasts (Task 6) are appended later inside the same IIFE.

```javascript
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · native-app polish layer. Self-contained, defer-loaded. Every behavior
 * is gated to the phone breakpoint and/or standalone, and no-ops under
 * prefers-reduced-motion. FR-only injected UI; no data-action / data-i18n.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function phone() { return window.matchMedia && window.matchMedia('(max-width: 860px)').matches; }

  /* ── Page-enter transition: cosmetic slide/fade on nav intent. Decoupled
   *    from pages.js routing — it only animates the .main container when a
   *    sidebar link or a bottom tab is tapped. ── */
  function animateMain() {
    if (reduce) return;
    var main = document.querySelector('.main') || document.querySelector('.container');
    if (!main) return;
    main.classList.remove('kw-enter');
    void main.offsetWidth; // reflow so the animation restarts
    main.classList.add('kw-enter');
    main.addEventListener('animationend', function h() {
      main.classList.remove('kw-enter');
      main.removeEventListener('animationend', h);
    });
  }
  document.addEventListener('click', function (e) {
    if (!phone()) return;
    var nav = e.target.closest('.sidebar nav a[data-nav]') || e.target.closest('.kw-tab');
    if (nav) animateMain();
  }, true);

  // (Task 5 appends pull-to-refresh here.)
  // (Task 6 appends live-sale toasts here.)
})();
```

- [ ] **Step 3: Wire both files into `dashboard.html`**

In `<head>`, add the stylesheet after the mobile stylesheet link (`<link rel="stylesheet" href="assets/mobile.css" />`):
```html
<link rel="stylesheet" href="assets/dashboard-native.css" />
```
Add the script tag next to `dashboard-pwa.js`:
```html
<script defer src="assets/dashboard-native.js"></script>
```

- [ ] **Step 4: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed`. Also confirm no `background:var(--ink)` was introduced (the forbidden-pattern check must not gain a new count).

- [ ] **Step 5: Supervisor live-verify**

Preview `/dashboard.html` at 390px width:
- Tapping a bottom tab / sidebar destination plays a short fade-up on the content; it does not break navigation.
- Pressing a KPI/opportunity card shows a subtle scale-down.
- With `body.standalone` on a notched profile, the topbar/tab bar/container respect safe-area insets.
- Desktop ≥861px unchanged; `prefers-reduced-motion` → no enter animation.

- [ ] **Step 6: Commit**

```bash
git add assets/dashboard-native.css assets/dashboard-native.js dashboard.html
git commit -m "native · launch-feel styles + page-enter transition + tactile press (phone)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Pull-to-refresh + skeleton shimmer

**Files:**
- Modify: `assets/dashboard-native.js` (append inside the IIFE, at the `// (Task 5 appends …)` marker)

- [ ] **Step 1: Append the pull-to-refresh + refresh logic**

Replace the line `  // (Task 5 appends pull-to-refresh here.)` with:

```javascript
  /* ── Refresh: re-emit the current date range so every subscriber re-renders,
   *    with a brief shimmer for the "fetching" feel. Uses the real public API
   *    window.KiwiDateRange.setDateRange(getDateRange()). ── */
  function refresh() {
    document.body.classList.add('kw-refreshing');
    function done() {
      try {
        if (window.KiwiDateRange) window.KiwiDateRange.setDateRange(window.KiwiDateRange.getDateRange());
      } catch (_) {}
      document.body.classList.remove('kw-refreshing');
    }
    if (reduce) { done(); return Promise.resolve(); }
    return new Promise(function (res) { setTimeout(function () { done(); res(); }, 620); });
  }

  /* ── Pull-to-refresh: engages ONLY at scroll-top; passive listeners never
   *    call preventDefault, so native scrolling is never hijacked. The pull is
   *    a cosmetic spinner; releasing past the threshold triggers refresh(). ── */
  (function ptr() {
    var startY = 0, pulling = false, dist = 0, spinner = null;
    var THRESH = 72;
    function atTop() { return (window.scrollY || document.documentElement.scrollTop || 0) <= 0; }
    function ensure() {
      if (spinner) return spinner;
      spinner = document.createElement('div');
      spinner.className = 'kw-ptr';
      spinner.appendChild(document.createElement('i'));
      document.body.appendChild(spinner);
      return spinner;
    }
    function hide() {
      if (!spinner) return;
      spinner.classList.remove('ready', 'spin');
      spinner.style.opacity = '0';
      spinner.style.transform = 'translateX(-50%) translateY(-8px)';
    }
    window.addEventListener('touchstart', function (e) {
      if (!phone() || !atTop() || e.touches.length !== 1) { pulling = false; return; }
      startY = e.touches[0].clientY; pulling = true; dist = 0;
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (!pulling) return;
      dist = e.touches[0].clientY - startY;
      if (dist <= 0) { pulling = false; hide(); return; }
      var pull = Math.min(dist * 0.5, 96);
      var s = ensure();
      s.style.transform = 'translateX(-50%) translateY(' + (pull - 8) + 'px)';
      s.style.opacity = String(Math.min(pull / THRESH, 1));
      s.classList.toggle('ready', pull >= THRESH);
    }, { passive: true });
    window.addEventListener('touchend', function () {
      if (!pulling) return;
      pulling = false;
      if (spinner && (dist * 0.5) >= THRESH) {
        spinner.classList.add('spin');
        refresh().then(hide);
      } else { hide(); }
    });
  })();
```

- [ ] **Step 2: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed` (file still parses clean).

- [ ] **Step 3: Supervisor live-verify**

Preview `/dashboard.html` at 390px (touch emulation):
- At scroll-top, dragging down reveals the spinner; releasing past ~72px pull spins it, the content shimmers briefly, and the KPI/hero numbers re-render (observe a value re-animate).
- Dragging down while scrolled below top does NOT show the spinner and does not affect scrolling.
- Normal vertical scrolling anywhere is unaffected.
- `prefers-reduced-motion` → refresh is instant (no shimmer), numbers still re-render.

- [ ] **Step 4: Commit**

```bash
git add assets/dashboard-native.js
git commit -m "native · pull-to-refresh + shimmer — re-emits current range to re-render

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Live-sale toasts

**Files:**
- Modify: `assets/dashboard-native.js` (append inside the IIFE, at the `// (Task 6 appends …)` marker)

- [ ] **Step 1: Append the live-sale toast behavior**

Replace the line `  // (Task 6 appends live-sale toasts here.)` with:

```javascript
  /* ── Live-sale toasts: a native-style "Nouvelle vente" notification slides
   *    in at intervals while the app is foregrounded, on phones. SIMULATED
   *    (self-contained demo data) — real push notifications need the backend
   *    horizon. Tapping routes to the Transactions destination. ── */
  (function toasts() {
    var ITEMS = ['Café noir', 'Cappuccino', 'Thé à la menthe', 'Jus d\'orange',
                 'Msemen', 'Sandwich', 'Pizza Margherita', 'Salade', 'Formule déj', 'Croissant'];
    var timer = null;
    function amount() { return (Math.floor(Math.random() * 180) + 12) + ',00 MAD'; }
    function show() {
      if (!phone()) { schedule(); return; }
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'kw-toast';
      var strong = document.createElement('strong'); strong.textContent = 'Nouvelle vente';
      var span = document.createElement('span');
      span.textContent = ITEMS[Math.floor(Math.random() * ITEMS.length)] + ' · ' + amount();
      t.appendChild(strong); t.appendChild(span);
      t.addEventListener('click', function () {
        t.remove();
        var link = document.querySelector('.sidebar nav a[data-nav="transactions"]');
        if (link) link.click();
      });
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('in'); });
      setTimeout(function () {
        t.classList.remove('in');
        setTimeout(function () { t.remove(); }, 360);
      }, 4200);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (document.hidden) return;
      timer = setTimeout(show, 18000 + Math.floor(Math.random() * 22000)); // 18–40 s
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer); else schedule();
    });
    schedule();
  })();
```

- [ ] **Step 2: Verify checks pass**

Run: `node tools/check.js`
Expected: `✓ all checks passed`.

- [ ] **Step 3: Supervisor live-verify**

Preview `/dashboard.html` at 390px. To avoid waiting 18–40 s, the supervisor temporarily calls the toast path (or shortens the delay) in the console to confirm:
- A "Nouvelle vente" notification slides down from the top with an item + MAD amount, then auto-dismisses after ~4 s.
- Tapping it navigates to Transactions.
- On desktop (≥861px) no toast appears (phone-gated).
- Backgrounding the tab (`visibilitychange`) stops scheduling.

- [ ] **Step 4: Commit**

```bash
git add assets/dashboard-native.js
git commit -m "native · live-sale toasts — simulated foreground new-sale notifications

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Full verification sweep + deploy

**Files:** none created; verification + deploy only.

- [ ] **Step 1: Static checks**

Run: `node tools/check.js`
Expected: `✓ all checks passed`.

- [ ] **Step 2: Supervisor full live-verify (controller runs in preview)**

Confirm, on a served copy of the repo:
1. **Install:** `/dashboard.html` on Chromium shows an installable "Kiwi" manifest (no errors); the "Installer Kiwi" affordance appears when the browser offers `beforeinstallprompt`.
2. **Offline — the real test:** with the network cut, cold-load `/dashboard.html` from the installed app → it opens (root SW controls the navigation).
3. **Caisse regression:** with the network cut, cold-load `/kiwi-caisse.html` → it still opens (shared SW serves the caisse shell).
4. **Native touches at 390px:** page-enter transition on nav; tactile press; pull-to-refresh spinner + shimmer + re-render; a live-sale toast slides in and routes on tap; `body.standalone` safe-area insets correct.
5. **No regressions:** desktop ≥861px visually identical; no horizontal scroll at 390/860px; `prefers-reduced-motion` stands every animation down.

- [ ] **Step 3: Deploy to both remotes**

```bash
git push origin HEAD:main
git push upstream HEAD:main
```
Expected: both push cleanly (origin = zaka33333-hash / Cloudflare, upstream = badro99 / Pages+partner).

- [ ] **Step 4: Confirm**

```bash
git log --oneline -8
```
Expected: the seven round-2 commits land atop the round-2 plan/spec commits; report the GitHub URLs and that both remotes are current.

---

## Notes for the implementer

- **Do not** rebuild `assets/mobile.css` or `assets/mobile-nav.js` — they own the phone reflow already and are correct.
- **Do not** add real push, offline sync, or a native binary — out of scope (see the spec's non-goals). The toast is explicitly simulated.
- **`kiwi-sw.js` lives at the repo root**, not in `assets/`. That root location is what gives it scope `/`; moving it under `assets/` re-introduces the exact bug this plan fixes.
- If the browser serves a stale SW after an edit, bump `CACHE` in `kiwi-sw.js` (`kiwi-app-v1` → `-v2`); `skipWaiting` + `clients.claim` + the activate cleanup handle the swap.
