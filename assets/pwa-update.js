/* Kiwi — PWA update handling.
 *
 * The "Nouvelle version disponible · Rafraîchir" nudge was RETIRED: the service
 * worker is now network-first for HTML/CSS/JS and skipWaiting()s on install, so
 * a deploy is picked up automatically on the next refresh — there is nothing for
 * the user to tap. This module is kept only so callers can still call
 * KiwiPWAUpdate.watch(reg) without breaking; it is intentionally a no-op.
 *
 * We deliberately do NOT auto-reload on controllerchange — a caisse sale must
 * never be yanked out from under the cashier. The freshly-activated worker just
 * serves the latest assets on the next navigation. */
(function () {
  'use strict';
  window.KiwiPWAUpdate = { watch: function () { /* no-op — updates are automatic */ } };
})();
