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
 * Escape hatch: localStorage.kiwiDemos = '1' forces demos ON (e.g. to demo on a
 * real domain), '0' forces them OFF (e.g. to preview the hosted experience on
 * localhost). Later this tightens to the authenticated session (a real account
 * vs a staff/demo session) once /api/me exists.
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

  var demosAllowed = (forced != null) ? forced : local;

  window.KiwiEnv = {
    local: local,
    demosAllowed: demosAllowed,
    hosted: !demosAllowed,
  };
})();
