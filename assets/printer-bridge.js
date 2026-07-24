/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · PRINTER BRIDGE CLIENT — window.KiwiPrinter
 * ---------------------------------------------------------------------------
 * The web half of real thermal printing. Detects the Kiwi Printer Bridge running
 * on the counter machine (bridge/server.js), lets the owner pair a printer
 * (IP · port · model · paper width · test slip), and relays ESC/POS jobs built by
 * assets/escpos.js to it. If the bridge isn't running, every print call returns
 * { ok:false, reason:'bridge-*' } so callers fail soft (KiwiHardware falls back
 * to its on-screen preview) — the exact pattern the caisse pairing uses.
 *
 * Config (localStorage `kiwiPrinterCfg`): { ip, port, model, paper }.
 * Bridge URL: http://127.0.0.1:9110 (loopback; a secure context, so an HTTPS page
 * may call it). Vanilla, no deps, no innerHTML for dynamic values.
 *
 * API
 *   KiwiPrinter.getConfig() / setConfig(cfg)
 *   KiwiPrinter.isConfigured()               → has an IP
 *   KiwiPrinter.ping()                        → Promise<{ok,version}|null>
 *   KiwiPrinter.printReceipt(o) / printKitchen(o) / printLabels(labels)
 *                                             → Promise<{ok, reason?}>
 *   KiwiPrinter.openSetup()                   → the pairing modal
 *   [data-action="printer-connect"]           → opens the modal (delegated)
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BRIDGE_URL = 'http://127.0.0.1:9110';
  var BRIDGE_DOWNLOAD = 'https://github.com/badro99/Kiwi/releases/latest';
  var CFG_KEY = 'kiwiPrinterCfg';
  var MODELS = [
    { id: 'escpos', label: 'Générique (ESC/POS)' },
    { id: 'epson', label: 'Epson' },
    { id: 'star', label: 'Star' },
  ];

  function ls(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function getConfig() {
    var d = { ip: '', port: 9100, model: 'escpos', paper: '80' };
    try { var o = JSON.parse(ls(CFG_KEY) || '{}') || {}; return Object.assign(d, o); } catch (_) { return d; }
  }
  function setConfig(cfg) { set(CFG_KEY, JSON.stringify(Object.assign(getConfig(), cfg || {}))); }
  function isConfigured() { return !!getConfig().ip; }

  // ── bridge transport ───────────────────────────────────────────────────────
  function withTimeout(promise, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, ms);
    return { signal: ctrl.signal, done: function () { clearTimeout(t); } };
  }

  function ping() {
    var to = withTimeout(null, 1400);
    return fetch(BRIDGE_URL + '/kiwi/ping', { signal: to.signal, cache: 'no-store' })
      .then(function (r) { to.done(); return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? j : null; })
      .catch(function () { to.done(); return null; });
  }

  // Send raw ESC/POS bytes (Uint8Array) to the configured printer via the bridge.
  function printBytes(bytes) {
    var cfg = getConfig();
    if (!cfg.ip) return Promise.resolve({ ok: false, reason: 'not-configured' });
    if (!window.KiwiEscPos) return Promise.resolve({ ok: false, reason: 'no-encoder' });
    var to = withTimeout(null, 9000);
    return fetch(BRIDGE_URL + '/kiwi/print', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: to.signal,
      body: JSON.stringify({ printerIp: cfg.ip, port: Number(cfg.port) || 9100, dataB64: window.KiwiEscPos.toB64(bytes) }),
    }).then(function (r) {
      to.done();
      return r.json().then(function (j) { return (r.ok && j && j.ok) ? { ok: true, bytes: j.bytes } : { ok: false, reason: (j && j.error) || 'print-failed' }; },
        function () { return { ok: false, reason: 'bad-response' }; });
    }).catch(function () { to.done(); return { ok: false, reason: 'bridge-unreachable' }; });
  }

  function printReceipt(o) { return window.KiwiEscPos ? printBytes(window.KiwiEscPos.receipt(withPaper(o))) : Promise.resolve({ ok: false, reason: 'no-encoder' }); }
  function printKitchen(o) { return window.KiwiEscPos ? printBytes(window.KiwiEscPos.kitchenTicket(withPaper(o))) : Promise.resolve({ ok: false, reason: 'no-encoder' }); }
  function printLabels(labels) {
    if (!window.KiwiEscPos) return Promise.resolve({ ok: false, reason: 'no-encoder' });
    var list = (Array.isArray(labels) ? labels : [labels]).filter(Boolean);
    var paper = getConfig().paper;
    // Concatenate each label's bytes into one job.
    var chunks = list.map(function (l) { return window.KiwiEscPos.label(Object.assign({ paper: paper }, l)); });
    var total = chunks.reduce(function (n, c) { return n + c.length; }, 0);
    var all = new Uint8Array(total); var off = 0;
    chunks.forEach(function (c) { all.set(c, off); off += c.length; });
    return printBytes(all);
  }
  function withPaper(o) { o = o || {}; if (!o.paper) o.paper = getConfig().paper; return o; }

  // ── the pairing modal ───────────────────────────────────────────────────────
  function injectCss() {
    if (document.getElementById('kpr-style')) return;
    var s = document.createElement('style'); s.id = 'kpr-style';
    s.textContent =
      '#kpr-ov{position:fixed;inset:0;z-index:9998;display:grid;place-items:center;background:rgba(10,15,13,.5);padding:20px;}' +
      '#kpr-card{background:var(--paper,#F7F5F0);color:var(--ink,#0A0F0D);width:460px;max-width:94vw;max-height:92vh;overflow:auto;border-radius:18px;padding:24px;box-shadow:0 30px 70px -24px rgba(5,59,44,.5);}' +
      '#kpr-card h2{font-size:1.16rem;letter-spacing:-.01em;margin:0 0 4px;display:flex;align-items:center;gap:8px;}' +
      '.kpr-sub{margin:0 0 16px;color:var(--ink,#0A0F0D);opacity:.65;font-size:.9rem;line-height:1.5;}' +
      '.kpr-status{display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:12px;margin:0 0 18px;font-size:.88rem;line-height:1.45;}' +
      '.kpr-status .kpr-d{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px;}' +
      '.kpr-status.off{background:#fbeceb;border:1px solid #f2cdc8;color:#8f2c1e;}' +
      '.kpr-status.off .kpr-d{background:#c0392b;box-shadow:0 0 0 4px rgba(192,57,43,.14);}' +
      '.kpr-status.on{background:#e7f6ee;border:1px solid #bfe6cf;color:#0B6E4F;}' +
      '.kpr-status.on .kpr-d{background:var(--atlas,#0B6E4F);box-shadow:0 0 0 4px rgba(11,110,79,.16);}' +
      '.kpr-status a{color:inherit;font-weight:700;text-underline-offset:3px;}' +
      '.kpr-status button.kpr-recheck{background:none;border:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:0;margin-left:2px;}' +
      '.kpr-field{margin:0 0 13px;}' +
      '.kpr-field label{display:block;font-size:.72rem;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--riad,#053B2C);margin:0 0 6px;}' +
      '.kpr-field input,.kpr-field select{width:100%;font:inherit;padding:11px 13px;border:1.5px solid rgba(0,0,0,.12);border-radius:11px;background:#fff;color:var(--ink,#0A0F0D);}' +
      '.kpr-field input:focus,.kpr-field select:focus{outline:none;border-color:var(--atlas,#0B6E4F);box-shadow:0 0 0 4px rgba(11,110,79,.13);}' +
      '.kpr-two{display:flex;gap:12px;}.kpr-two>*{flex:1;}' +
      '.kpr-actions{display:flex;gap:10px;margin-top:20px;}' +
      '.kpr-btn{flex:1;font:inherit;font-weight:700;padding:13px;border-radius:12px;cursor:pointer;border:0;}' +
      '.kpr-test{background:#fff;border:1.5px solid var(--atlas,#0B6E4F);color:var(--atlas,#0B6E4F);}' +
      '.kpr-test:disabled{opacity:.45;cursor:default;}' +
      '.kpr-save{background:var(--atlas,#0B6E4F);color:#fff;}' +
      '.kpr-save:hover{filter:brightness(1.06);}' +
      '.kpr-x{float:right;background:none;border:0;font-size:1.3rem;line-height:1;cursor:pointer;color:var(--ink,#0A0F0D);opacity:.5;}' +
      '.kpr-note{margin:14px 0 0;font-size:.78rem;opacity:.6;line-height:1.5;}';
    document.head.appendChild(s);
  }

  function openSetup() {
    injectCss();
    var cfg = getConfig();
    var ov = document.createElement('div'); ov.id = 'kpr-ov';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Connecter une imprimante');
    var opts = MODELS.map(function (m) { return '<option value="' + m.id + '"' + (m.id === cfg.model ? ' selected' : '') + '>' + esc(m.label) + '</option>'; }).join('');
    ov.innerHTML =
      '<div id="kpr-card">' +
        '<button class="kpr-x" type="button" id="kpr-close" aria-label="Fermer">×</button>' +
        '<h2>Connecter une imprimante thermique</h2>' +
        '<p class="kpr-sub">Imprimez reçus, tickets cuisine et étiquettes code-barres sur votre imprimante réseau, via le Kiwi Printer Bridge.</p>' +
        '<div class="kpr-status off" id="kpr-status"><span class="kpr-d"></span><span id="kpr-status-t">Vérification du pont…</span></div>' +
        '<div class="kpr-field"><label for="kpr-ip">Adresse IP de l’imprimante</label><input id="kpr-ip" type="text" inputmode="decimal" placeholder="192.168.1.50" value="' + esc(cfg.ip) + '"></div>' +
        '<div class="kpr-two">' +
          '<div class="kpr-field"><label for="kpr-port">Port</label><input id="kpr-port" type="text" inputmode="numeric" value="' + esc(cfg.port) + '"></div>' +
          '<div class="kpr-field"><label for="kpr-paper">Largeur papier</label><select id="kpr-paper"><option value="80"' + (cfg.paper === '80' ? ' selected' : '') + '>80 mm (standard)</option><option value="58"' + (cfg.paper === '58' ? ' selected' : '') + '>58 mm</option></select></div>' +
        '</div>' +
        '<div class="kpr-field"><label for="kpr-model">Modèle</label><select id="kpr-model">' + opts + '</select></div>' +
        '<div class="kpr-actions">' +
          '<button class="kpr-btn kpr-test" type="button" id="kpr-test" disabled>Imprimer un ticket test</button>' +
          '<button class="kpr-btn kpr-save" type="button" id="kpr-save">Enregistrer</button>' +
        '</div>' +
        '<p class="kpr-note">Le pont tourne sur l’ordinateur de la caisse et ne communique qu’avec votre imprimante locale.</p>' +
      '</div>';
    document.body.appendChild(ov);

    var $ = function (id) { return ov.querySelector(id); };
    function readForm() {
      return { ip: $('#kpr-ip').value.trim(), port: $('#kpr-port').value.trim() || '9100', model: $('#kpr-model').value, paper: $('#kpr-paper').value };
    }
    function close() { ov.remove(); }
    function toast(msg) { try { if (window.Kiwi && Kiwi.toast) Kiwi.toast(msg); } catch (_) {} }

    var bridgeUp = false;
    function refreshStatus() {
      var st = $('#kpr-status'), t = $('#kpr-status-t'), test = $('#kpr-test');
      t.textContent = 'Vérification du pont…'; st.className = 'kpr-status off';
      return ping().then(function (j) {
        bridgeUp = !!j;
        if (j) {
          st.className = 'kpr-status on';
          t.textContent = 'Pont connecté · v' + (j.version || '?');
          test.disabled = false;
        } else {
          st.className = 'kpr-status off';
          // Rebuild with download + re-check affordances.
          t.innerHTML = 'Kiwi Printer Bridge non détecté. <a href="' + esc(BRIDGE_DOWNLOAD) + '" target="_blank" rel="noopener">Télécharger le pont</a> · <button type="button" class="kpr-recheck" id="kpr-recheck">Revérifier</button>';
          var rc = $('#kpr-recheck'); if (rc) rc.addEventListener('click', refreshStatus);
          test.disabled = true;
        }
      });
    }

    $('#kpr-close').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    $('#kpr-save').addEventListener('click', function () { setConfig(readForm()); toast('Imprimante enregistrée'); close(); });
    $('#kpr-test').addEventListener('click', function () {
      setConfig(readForm());
      var cfg2 = getConfig();
      var btn = $('#kpr-test'); btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Impression…';
      printBytes(window.KiwiEscPos.testSlip({ ip: cfg2.ip, paper: cfg2.paper })).then(function (res) {
        btn.textContent = orig; btn.disabled = !bridgeUp;
        toast(res.ok ? 'Ticket test envoyé' : ('Échec : ' + (res.reason || 'inconnu')));
      });
    });

    refreshStatus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-action="printer-connect"]');
    if (t) { e.preventDefault(); openSetup(); }
  });

  window.KiwiPrinter = {
    getConfig: getConfig, setConfig: setConfig, isConfigured: isConfigured,
    ping: ping, printBytes: printBytes,
    printReceipt: printReceipt, printKitchen: printKitchen, printLabels: printLabels,
    openSetup: openSetup, BRIDGE_URL: BRIDGE_URL,
  };
})();
