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
