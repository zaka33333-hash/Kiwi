/* Kiwi — shared service worker for both installable apps (owner "Kiwi" and
 * "Kiwi Caisse"). Served from the repo root so its scope is "/", which is the
 * only way two root-level app pages both load offline: one SW owns the scope
 * and serves whichever shell the navigation asks for.
 *
 * Update strategy — STALE-WHILE-REVALIDATE for the whole shell (HTML documents,
 * CSS, JS, images, fonts, icons, manifests). Every request is answered from the
 * cache instantly — so the app opens fast and works offline / on a flaky café
 * connection — while a fresh copy is fetched in the background and stored for
 * next time. A Cloudflare deploy therefore reaches every device automatically on
 * its NEXT load, with no cache bump, no "Rafraîchir" banner and no manual
 * eviction. (Network-first was tried but made every load block on the network
 * for all JS/CSS, which is the wrong trade for a till.) The worker also
 * skipWaiting()s so a new version takes over promptly instead of waiting for
 * every tab to close; it does NOT force a reload, so a caisse sale in progress
 * is never interrupted — the fresh assets are simply served on the next load. */
'use strict';
var CACHE = 'kiwi-app-v18';
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
  '/assets/pwa-update.js',
  '/assets/caisse-skin.css',
  '/assets/caisse-motion.js',
  '/assets/caisse-pwa.js',
  '/assets/live-link.js',
  '/assets/merchant-config.js',
  '/assets/operator-access.js',
  '/assets/caisse-hardware.js',
  '/assets/barcode.js',
  '/assets/boutique-catalog.js',
  '/assets/pos-dispatch.js',
  '/assets/pressing-caisse.js',
  '/assets/pressing-caisse.css',
  '/assets/lucide.min.js',
  '/assets/icons/kiwi-app.svg',
  '/assets/icons/kiwi-app-192.png',
  '/assets/icons/kiwi-app-512.png',
  '/assets/icons/kiwi-app-180.png',
  '/assets/icons/kiwi-caisse.svg',
  '/assets/icons/kiwi-caisse-192.png',
  '/assets/icons/kiwi-caisse-180.png'
];

self.addEventListener('install', function (e) {
  // Take over as soon as installed — updates stop waiting for every tab to
  // close. Safe here because we never force a reload (see the note at top).
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

// Kept for compatibility with any lingering "Rafraîchir" nudge that still posts
// this — harmless now that install() already skipWaiting()s.
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Store a fresh copy in the cache without blocking the response. Only good,
// same-origin (non-opaque) 200s are cached — never an error page or a redirect.
function put(req, res) {
  if (res && res.status === 200 && res.type === 'basic') {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Live Link API is dynamic — never cache it, or the dashboard poll would read
  // stale sales. Let /api/* fall straight through to the network.
  if (url.pathname.indexOf('/api/') === 0) return;

  // STALE-WHILE-REVALIDATE for the whole shell (documents, JS, CSS, images,
  // fonts, icons, manifests). Answer from cache instantly — fast, and offline /
  // flaky-network safe — while a fresh copy is fetched in the background and
  // stored (see put) for next time. A deploy therefore lands on the NEXT load
  // with no cache bump and no manual refresh.
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) { return put(req, res); }).catch(function () {
        if (hit) return hit;
        // Offline with nothing cached for this exact URL → serve the matching app
        // shell for a navigation (Cloudflare clean URLs drop the .html).
        if (req.mode === 'navigate') {
          return caches.match(url.pathname.indexOf('/kiwi-caisse') === 0
            ? '/kiwi-caisse.html' : '/dashboard.html');
        }
      });
      return hit || net;
    })
  );
});
