/* Kiwi — shared service worker for both installable apps (owner "Kiwi" and
 * "Kiwi Caisse"). Served from the repo root so its scope is "/", which is the
 * only way two root-level app pages both load offline: one SW owns the scope
 * and serves whichever shell the navigation asks for. Cache-first app shell,
 * versioned bust. Replaces assets/caisse-sw.js (which was scoped to /assets/
 * and therefore controlled no navigations). */
'use strict';
var CACHE = 'kiwi-app-v12';
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
  // No blind skipWaiting — the new worker waits until the page asks it to take
  // over (see the 'message' handler), so a deploy never swaps assets mid-session.
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

// Activate on demand — the page posts this after the user taps "Rafraîchir".
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Live Link API is dynamic — never cache it, or the dashboard poll would read
  // stale sales. Let /api/* fall straight through to the network.
  if (new URL(req.url).pathname.indexOf('/api/') === 0) return;
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
