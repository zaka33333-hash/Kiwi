/* Kiwi — merchant config consumer (client side of the operator console).
 *
 * Reads the per-merchant config an operator set in kiwi-admin.html:
 *   • features — modules toggled OFF (pricing/tier control) are hidden here.
 *   • pins     — staff PINs the operator manages remotely.
 *
 * Fail-safe by design: if /api/config is missing (GitHub Pages, local static
 * server) or the request errors, NOTHING changes — every app keeps its current
 * hardcoded behavior. So this can ship to all surfaces without touching the demo.
 *
 * A module is hidden by tagging its entry point  data-feature="<key>"  in the
 * app; when the operator sets features[key] === false, every matching node is
 * hidden and  body.feat-off-<key>  is added (for CSS that needs it). Apps that
 * build nav dynamically can call  window.KiwiConfig.apply()  after rendering, or
 * listen for the  kiwi-config  event. PINs are exposed on window.KiwiConfig.pins
 * for the caisse/serveur to consult additively (never replacing their defaults).
 * Vanilla, no deps, no innerHTML.
 */
(function () {
  'use strict';

  function merchant() {
    try { return localStorage.getItem('kiwiLiveMerchant') || 'cafe-atlas'; }
    catch (_) { return 'cafe-atlas'; }
  }

  var cfg = { features: {}, pins: [], loaded: false, apply: applyFeatures };
  window.KiwiConfig = cfg;

  function applyFeatures() {
    var features = cfg.features || {};
    if (!document.body) return;
    Object.keys(features).forEach(function (key) {
      if (features[key] === false) {
        document.body.classList.add('feat-off-' + key);
        var nodes = document.querySelectorAll('[data-feature="' + key + '"]');
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].setAttribute('hidden', '');
          nodes[i].style.display = 'none';
        }
      }
    });
  }

  function fetchConfig() {
    fetch('/api/config?merchant=' + encodeURIComponent(merchant()), { headers: { Accept: 'application/json' } })
      .then(function (r) { return (r && r.ok) ? r.json() : null; })
      .then(function (data) {
        if (!data) return;                     // no backend → keep defaults
        cfg.features = data.features || {};
        cfg.pins = Array.isArray(data.pins) ? data.pins : [];
        cfg.loaded = true;
        applyFeatures();
        // Re-apply shortly after, in case the app built its nav asynchronously.
        setTimeout(applyFeatures, 400);
        try { document.dispatchEvent(new CustomEvent('kiwi-config', { detail: cfg })); } catch (_) {}
      })
      .catch(function () { /* offline / missing endpoint → app keeps its defaults */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchConfig);
  else fetchConfig();
})();
