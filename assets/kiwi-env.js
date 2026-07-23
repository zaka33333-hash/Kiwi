/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · ENV — window.KiwiEnv  (must load FIRST, before venues.js / app code)
 * ---------------------------------------------------------------------------
 * One runtime signal that separates the owner's LOCAL demo copy from the HOSTED
 * app real merchants use. The same repo serves both, so the switch is by
 * hostname:
 *   · local desktop  (file://, localhost, 127.0.0.1, *.local)  → demos ALLOWED
 *   · hosted (Cloudflare / GitHub Pages, any real domain)      → demos OFF
 *
 * On hosted, the demo venues (Café Atlas / Maison Mansour / Spa Bahia) and the
 * caisse demo verticals are hidden — a real signed-up merchant only ever sees
 * their own store. Locally, everything demos exactly as before.
 *
 * Airtight rule: a HOSTED domain can NEVER show a demo — not even with a forced
 * flag. Demos are a localhost-only affordance for pitching. The only override
 * that works is localStorage.kiwiDemos = '0', which forces demos OFF even on
 * localhost (to preview the real hosted experience locally). kiwiDemos = '1' is
 * honoured only when already local; it can never turn a real domain into a demo.
 * Later this tightens to the authenticated session once /api/me exists.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var h = '';
  try { h = (location.hostname || '').toLowerCase(); } catch (_) {}
  var local =
    (typeof location !== 'undefined' && location.protocol === 'file:') ||
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0' ||
    h === '' || /\.local$/.test(h);

  var forced = null;
  try {
    var f = localStorage.getItem('kiwiDemos');
    if (f === '1') forced = true;
    else if (f === '0') forced = false;
  } catch (_) {}

  /* Hosted is never a demo, whatever the flag says. Local is a demo by default,
   * and only an explicit kiwiDemos='0' can turn it off. */
  var demosAllowed = local && (forced !== false);

  window.KiwiEnv = {
    local: local,
    demosAllowed: demosAllowed,
    hosted: !demosAllowed,
    /* THE gate for demo-data leaks. True whenever the app must show REAL data,
     * never the built-in demo (Rachid / Café Atlas / fabricated legal IDs):
     *   · any hosted domain (demos are a localhost-only affordance), OR
     *   · a real signed-in merchant / operator-scoped client — both set
     *     window.KiwiMe (see assets/identity.js), which may be populated AFTER
     *     this file loads, so this is evaluated lazily at call time.
     * Every surface that renders identity/legal/named demo data should gate on
     * window.KiwiEnv.isReal() so the demo is preserved locally and never leaks. */
    isReal: function () {
      try { return !demosAllowed || !!window.KiwiMe; } catch (_) { return !demosAllowed; }
    },
  };
})();
