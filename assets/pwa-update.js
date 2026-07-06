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
    // A new worker starts installing → nudge once installed, if a controller
    // exists (an update — not a first-ever install).
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
