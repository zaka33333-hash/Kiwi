/* Kiwi Live Link — optional $0 backend bridge (Cloudflare Pages Functions + D1).
 *
 * OFF by default: the apps run their normal mocked, per-browser demo. Turn it on
 * with  localStorage.kiwiLive = '1'  (or add  ?live=1  to the URL once). When on:
 *   • the CAISSE POSTs every confirmed sale to  /api/sale
 *   • the DASHBOARD polls  /api/feed  and shows real sales in an "EN DIRECT ·
 *     CAISSE" card — so a sale rung on one device appears on the owner's
 *     dashboard on another device, for real.
 *
 * Same-origin fetch carries the passcode-gate cookie, so it works behind the
 * Cloudflare edge gate. Vanilla, no dependencies. The simulated dashboard feed is
 * left untouched — the live card is a separate surface this module fully owns, so
 * the demo still works with the flag off and nothing here can corrupt it.
 */
(function () {
  'use strict';

  var LS = 'kiwiLive';

  function urlFlag() { try { return /[?&]live=1(?:&|$)/.test(location.search); } catch (_) { return false; } }
  function on() {
    try {
      if (urlFlag()) { localStorage.setItem(LS, '1'); return true; }
      return localStorage.getItem(LS) === '1';
    } catch (_) { return urlFlag(); }
  }
  // One demo tenant for this pilot. Real multi-tenant = a merchant key + auth later.
  function merchant() {
    try { return localStorage.getItem('kiwiLiveMerchant') || 'cafe-atlas'; } catch (_) { return 'cafe-atlas'; }
  }

  var METHOD_LABEL = { cash: 'Espèces', card: 'Carte', tap: 'Kiwi Tap', qr: 'QR', wallet: 'Kiwi Wallet' };
  function fmtMAD(n) { try { return (Math.round(n) || 0).toLocaleString('fr-FR'); } catch (_) { return String(Math.round(n) || 0); } }
  function hhmm(ts) {
    var d = new Date(ts || Date.now());
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  // Tiny DOM helper — no innerHTML anywhere (safe by construction).
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ─── caisse → server ─── */
  function postSale(entry) {
    if (!on() || !entry) return;
    var amt = Math.round(entry.amount || 0);
    if (amt <= 0) return;
    var body = {
      merchant: merchant(),
      amount: amt,                                            // MAD, integer
      method: entry.method || 'cash',                         // cash|card|tap|qr|wallet
      label: entry.label || 'Vente',
      ref: entry.ref || '',
      ts: (entry.time && entry.time.getTime) ? entry.time.getTime() : Date.now(),
    };
    try {
      fetch('/api/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(function () { /* best-effort; offline queue is a later phase */ });
    } catch (_) {}
  }

  /* ─── dashboard ← server (poll) ─── */
  function watchFeed(onSales, intervalMs) {
    if (!on()) return function () {};
    var since = 0, stopped = false, timer = null;
    function tick() {
      if (stopped) return;
      fetch('/api/feed?merchant=' + encodeURIComponent(merchant()) + '&since=' + since, { headers: { Accept: 'application/json' } })
        .then(function (r) { return (r && r.ok) ? r.json() : null; })
        .then(function (data) {
          if (data && Array.isArray(data.sales) && data.sales.length) {
            since = data.cursor || since;
            try { onSales(data.sales); } catch (_) {}
          }
        })
        .catch(function () {})
        .then(function () { if (!stopped) timer = setTimeout(tick, intervalMs || 3500); });
    }
    tick();
    return function () { stopped = true; if (timer) clearTimeout(timer); };
  }

  /* ─── dashboard live card (this module owns it entirely) ─── */
  function ensureStyles() {
    if (document.getElementById('kiwi-live-style')) return;
    var s = el('style');
    s.id = 'kiwi-live-style';
    s.textContent =
      '#kiwi-live-card{background:linear-gradient(135deg,#0A4A38,#0B6E4F 55%,#05301F);color:#F7F5F0;border-radius:18px;padding:18px 20px;margin-bottom:16px;box-shadow:0 18px 40px -22px rgba(5,48,31,.7);position:relative;overflow:hidden}' +
      '#kiwi-live-card .klc-head{display:flex;align-items:center;gap:10px;font-family:var(--mono,ui-monospace,monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(247,245,240,.86)}' +
      '#kiwi-live-card .klc-dot{width:8px;height:8px;border-radius:50%;background:#7DF2B0;animation:klc-pulse 2s infinite}' +
      '@keyframes klc-pulse{0%{box-shadow:0 0 0 0 rgba(125,242,176,.5)}70%{box-shadow:0 0 0 8px rgba(125,242,176,0)}100%{box-shadow:0 0 0 0 rgba(125,242,176,0)}}' +
      '#kiwi-live-card .klc-total{margin-inline-start:auto;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:#fff}' +
      '#kiwi-live-card .klc-total b{font-size:15px}' +
      '#kiwi-live-card .klc-list{margin-top:12px;display:flex;flex-direction:column;gap:2px}' +
      '#kiwi-live-card .klc-empty{font-size:13px;color:rgba(247,245,240,.62);padding:6px 0}' +
      '#kiwi-live-card .klc-row{display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:12px;padding:9px 0;border-top:1px solid rgba(255,255,255,.08);animation:klc-in .45s cubic-bezier(.32,.72,0,1)}' +
      '@keyframes klc-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
      '#kiwi-live-card .klc-t{font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:rgba(247,245,240,.6)}' +
      '#kiwi-live-card .klc-m{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(125,242,176,.16);color:#7DF2B0;white-space:nowrap}' +
      '#kiwi-live-card .klc-l{font-size:13.5px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#kiwi-live-card .klc-a{font-family:var(--mono,ui-monospace,monospace);font-size:14px;font-weight:600;color:#fff;white-space:nowrap}' +
      '#kiwi-live-card .klc-a .cur{font-size:10px;color:rgba(247,245,240,.6);margin-inline-start:3px}';
    document.head.appendChild(s);
  }

  function buildCard() {
    var card = el('section');
    card.id = 'kiwi-live-card';
    card.setAttribute('aria-live', 'polite');

    var head = el('div', 'klc-head');
    head.appendChild(el('span', 'klc-dot'));
    head.appendChild(document.createTextNode('En direct · caisse'));
    var total = el('span', 'klc-total');
    total.appendChild(document.createTextNode('Encaissé caisse · '));
    var totalB = el('b', null, '0');
    totalB.setAttribute('data-klc-total', '');
    total.appendChild(totalB);
    total.appendChild(document.createTextNode(' MAD'));
    head.appendChild(total);
    card.appendChild(head);

    var list = el('div', 'klc-list');
    list.setAttribute('data-klc-list', '');
    list.appendChild(el('div', 'klc-empty', 'En attente d’une vente à la caisse…'));
    card.appendChild(list);
    return card;
  }

  var runningTotal = 0;

  function renderSale(listEl, totalEl, s) {
    var empty = listEl.querySelector('.klc-empty');
    if (empty) empty.remove();
    var mlabel = METHOD_LABEL[s.method] || (s.method || 'Vente');
    var row = el('div', 'klc-row');
    row.appendChild(el('span', 'klc-t', hhmm(s.ts)));
    row.appendChild(el('span', 'klc-m', mlabel));
    row.appendChild(el('span', 'klc-l', s.label || 'Vente'));
    var amt = el('span', 'klc-a', fmtMAD(s.amount));
    amt.appendChild(el('span', 'cur', 'MAD'));
    row.appendChild(amt);
    listEl.insertBefore(row, listEl.firstChild);
    while (listEl.children.length > 8) listEl.removeChild(listEl.lastChild);   // keep it tidy
    runningTotal += Math.round(s.amount) || 0;
    if (totalEl) totalEl.textContent = fmtMAD(runningTotal);
    if (window.Kiwi && typeof window.Kiwi.toast === 'function') {
      try { window.Kiwi.toast('Vente encaissée · ' + fmtMAD(s.amount) + ' MAD', { desc: mlabel + ' · caisse en direct', type: 'success' }); } catch (_) {}
    }
  }

  function initDashboard() {
    if (!on()) return;
    var host = document.querySelector('.dash-standard') || document.querySelector('main');
    if (!host || document.getElementById('kiwi-live-card')) return;
    ensureStyles();
    var card = buildCard();
    host.insertBefore(card, host.firstChild);
    var listEl = card.querySelector('[data-klc-list]');
    var totalEl = card.querySelector('[data-klc-total]');
    watchFeed(function (sales) {
      sales.forEach(function (s) { renderSale(listEl, totalEl, s); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
  else initDashboard();

  window.KiwiLive = { isOn: on, merchant: merchant, postSale: postSale, watchFeed: watchFeed };
})();
