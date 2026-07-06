/* Kiwi Caisse service worker — cache-first app shell, versioned bust. */
'use strict';
var CACHE = 'kiwi-caisse-v1';
var SHELL = [
  '/kiwi-caisse.html',
  '/manifest.webmanifest',
  '/assets/tokens.css',
  '/assets/caisse-skin.css',
  '/assets/liquid-lens.js',
  '/assets/caisse-motion.js',
  '/assets/caisse-pwa.js',
  '/assets/caisse-hardware.js',
  '/assets/pos-dispatch.js',
  '/assets/pressing-caisse.js',
  '/assets/pressing-caisse.css',
  '/assets/lucide.min.js',
  '/assets/icons/kiwi-caisse.svg'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Cache each asset individually so one missing file doesn't fail the install.
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
        // Offline navigation → serve the shell.
        if (req.mode === 'navigate') return caches.match('/kiwi-caisse.html');
      });
    })
  );
});
