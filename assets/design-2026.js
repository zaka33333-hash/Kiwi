/* ═══════════════════════════════════════════════════════════════════════════
 * KIWI · DESIGN 2026 — activation + reversible toggle
 *
 * The "Liquid Glass" skin (design-2026.css) is gated behind the 1111 passcode.
 * Entering 1111 calls KiwiDesign2026.enable(); from then on a floating pill lets
 * the owner flip the preview on/off at will. State persists in localStorage, so
 * reverting is one click — and removing the <link>/<script> reverts entirely.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var KEY = 'kiwiDesign2026';
  function isOn() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function unlocked() { try { return localStorage.getItem(KEY) != null; } catch (e) { return false; } }

  function label(fr, en, ar) {
    var l = (window.KiwiI18n && window.KiwiI18n.getLang && window.KiwiI18n.getLang()) || 'fr';
    return l === 'en' ? en : (l === 'ar' ? ar : fr);
  }

  var pill = null;
  function render() {
    if (!unlocked()) { if (pill) { pill.remove(); pill = null; } return; }
    var on = document.body.classList.contains('design-2026');
    if (!pill) {
      pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'kiwi-design-toggle';
      pill.addEventListener('click', function () { apply(!document.body.classList.contains('design-2026')); });
      document.body.appendChild(pill);
    }
    var lbl = on
      ? label('Design 2026 · activé', 'Design 2026 · on', 'تصميم 2026 · مُفعّل')
      : label('Activer Design 2026', 'Enable Design 2026', 'تفعيل تصميم 2026');
    pill.textContent = '';
    var dot = document.createElement('span'); dot.className = 'dot'; pill.appendChild(dot);
    var txt = document.createElement('span'); txt.textContent = lbl; pill.appendChild(txt);
    if (on) { var x = document.createElement('span'); x.className = 'x'; x.textContent = '×'; pill.appendChild(x); }
    pill.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function apply(on) {
    document.body.classList.toggle('design-2026', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    render();
  }

  function init() {
    if (isOn()) document.body.classList.add('design-2026');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-label the pill when the UI language changes.
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-action="lang-switch"], [data-lang]')) setTimeout(render, 60);
  }, true);

  window.KiwiDesign2026 = {
    enable: function () { apply(true); },
    disable: function () { apply(false); },
    toggle: function () { apply(!document.body.classList.contains('design-2026')); },
    isUnlocked: unlocked,
  };
})();
