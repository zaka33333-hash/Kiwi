/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · IDENTITY — replace the demo owner/business with the REAL logged-in one.
 * ---------------------------------------------------------------------------
 * The dashboard ships with a hardcoded demo identity ("Rachid Benhima" · "Café
 * Atlas") for pitching. A real merchant who signs up and logs in must never see
 * it. This fetches /api/me (session-scoped) and, when a real account answers,
 * (a) writes the name/business/email into the localStorage keys the rest of the
 * app already reads (so the Account drawer, greeting, etc. all follow) and
 * (b) patches the visible identity in place: greeting, business subtext,
 * location label, and the sidebar profile chip + avatar initials.
 *
 * No account session (the local demo, the staff-bypass gate, or an operator
 * cookie) → /api/me returns { authenticated:false } and this does NOTHING, so the
 * demo identity is left exactly as it was. Fail-safe: no endpoint / offline →
 * silent no-op. Vanilla, self-contained.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function ls(k, v) { try { if (v) localStorage.setItem(k, v); } catch (_) {} }
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
  function initialsOf(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '';
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }
  function setText(el, s) {
    if (!el || s == null || s === '') return;
    el.textContent = s;
    if (el.removeAttribute) el.removeAttribute('data-i18n');  // don't let langchange revert it
  }

  function apply(id) {
    var first = firstName(id.name);

    // Greeting — "Bonjour Rachid," (dashboard hero + lock copy, two elements).
    if (first) {
      var greets = document.querySelectorAll('[data-i18n="dash.hello"], .greet-text');
      for (var i = 0; i < greets.length; i++) setText(greets[i], 'Bonjour ' + first + ',');
      try { if (window.__kiwiLock && window.__kiwiLock.setGreetName) window.__kiwiLock.setGreetName(first); } catch (_) {}
    }

    // Business — greeting subtext + any location label.
    if (id.business) {
      var sub = document.querySelector('[data-kiwi-greet-sub]');
      if (sub) sub.textContent = id.business + ' · service ouvert';
      var locs = document.querySelectorAll('[data-loc-name]');
      for (var j = 0; j < locs.length; j++) locs[j].textContent = id.business;
    }

    // Sidebar profile chip — the name the owner sees they're "connected as", + avatar.
    if (id.name) {
      setText(document.querySelector('.merchant .n'), id.name);
      var av = document.querySelector('.merchant .avatar');
      if (av) av.textContent = initialsOf(id.name);
    }
  }

  function run(id) {
    var go = function () { apply(id); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
    // Re-apply once after the venue engine finishes its async render (it rewrites
    // the location label / chip), so our real identity wins the last word.
    setTimeout(go, 700);
  }

  fetch('/api/me', { headers: { Accept: 'application/json' } })
    .then(function (r) { return (r && r.ok) ? r.json() : null; })
    .then(function (me) {
      if (!me || !me.authenticated) return;   // demo / staff / operator → leave demo identity
      var id = {
        name: (me.name || '').trim(),
        business: (me.business || '').trim(),
        email: (me.email || '').trim(),
      };
      // Feed the keys the rest of the app already reads (account.js reads
      // kiwiSet:*, onboarding/personalize read kiwiOwnerName/kiwiBizName).
      if (id.name) { ls('kiwiOwnerName', id.name); ls('kiwiSet:ownerName', id.name); }
      if (id.business) { ls('kiwiBizName', id.business); }
      if (id.email) { ls('kiwiSet:ownerEmail', id.email); ls('kiwiOwnerEmail', id.email); }
      window.KiwiMe = id;
      run(id);
    })
    .catch(function () { /* offline / missing endpoint → keep whatever is shown */ });
})();
