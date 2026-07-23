/* Kiwi Caisse — PWA registration, install affordance, offline reflection. */
(function () {
  'use strict';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/kiwi-sw.js').then(function (reg) {
        if (window.KiwiPWAUpdate) window.KiwiPWAUpdate.watch(reg);
      }).catch(function () {});
    });
  }

  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    showInstall();
  });

  function showInstall() {
    if (document.getElementById('kiwi-install')) return;
    var b = document.createElement('button');
    b.id = 'kiwi-install';
    b.textContent = 'Installer la caisse';
    b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9998;padding:12px 18px;' +
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

  // Offline/online reflection — a small dot the cashier can trust.
  function status() {
    var d = document.getElementById('kiwi-net') || (function () {
      var s = document.createElement('div'); s.id = 'kiwi-net';
      s.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9998;width:9px;height:9px;border-radius:50%';
      document.body.appendChild(s); return s;
    })();
    d.style.background = navigator.onLine ? '#3FB67A' : '#B85245';
    d.title = navigator.onLine ? 'En ligne' : 'Hors ligne, ventes enregistrées localement';
  }
  window.addEventListener('online', status);
  window.addEventListener('offline', status);
  if (document.readyState !== 'loading') status();
  else document.addEventListener('DOMContentLoaded', status);
})();
