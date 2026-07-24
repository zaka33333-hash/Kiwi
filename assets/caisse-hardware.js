/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi Caisse — hardware bridge. Registers never talk to a device directly;
 * they call KiwiHardware.*. Each method resolves against a MOCK today, with a
 * feature-detected path to Web Serial (ESC/POS) / WebUSB / Web Bluetooth
 * stubbed behind the same interface for later.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var hasSerial = 'serial' in navigator;
  var hasUSB = 'usb' in navigator;
  var hasBT = 'bluetooth' in navigator;

  function el(tag, css, text) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text != null) n.textContent = text;   // textContent — never innerHTML
    return n;
  }

  function mockPrint(ticket) {
    return new Promise(function (resolve) {
      function done() { overlay.remove(); resolve({ ok: true, mock: true }); }
      var overlay = el('div', 'position:fixed;inset:0;z-index:9997;display:grid;place-items:center;background:rgba(10,15,13,.55)');
      overlay.setAttribute('role', 'dialog');
      var card = el('div', "background:#FFFDFA;width:300px;max-width:86vw;padding:22px;border-radius:14px;font:13px/1.5 'JetBrains Mono',monospace;box-shadow:0 24px 60px -20px rgba(0,0,0,.5)");
      card.appendChild(el('div', 'text-align:center;font-weight:700;margin-bottom:10px', (ticket && ticket.title) || 'Reçu Kiwi'));
      (ticket && ticket.lines ? ticket.lines : []).forEach(function (l) {
        var row = el('div', 'display:flex;justify-content:space-between');
        row.appendChild(el('span', '', (l.qty ? l.qty + '× ' : '') + (l.name || '')));
        row.appendChild(el('span', '', l.price || ''));
        card.appendChild(row);
      });
      card.appendChild(el('hr', 'border:0;border-top:1px dashed #ccc;margin:10px 0'));
      var tot = el('div', 'display:flex;justify-content:space-between;font-weight:700');
      tot.appendChild(el('span', '', 'Total'));
      tot.appendChild(el('span', '', (ticket && ticket.total) || ''));
      card.appendChild(tot);
      var close = el('button', 'margin-top:16px;width:100%;padding:10px;border:0;border-radius:9px;background:#0B6E4F;color:#F7F5F0;font-weight:600;cursor:pointer', 'Fermer');
      close.addEventListener('click', done);
      card.appendChild(close);
      overlay.appendChild(card);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) done(); });
      document.body.appendChild(overlay);
    });
  }

  window.KiwiHardware = {
    capabilities: { serial: hasSerial, usb: hasUSB, bluetooth: hasBT },
    // Print a receipt. REAL path: when a thermal printer is paired (KiwiPrinter +
    // the Kiwi Printer Bridge), the receipt is encoded to ESC/POS and printed for
    // real. Fail-soft: if no printer is configured, or the bridge is down / errors,
    // fall back to the on-screen preview so the caisse never blocks on hardware.
    print: function (ticket) {
      if (window.KiwiPrinter && KiwiPrinter.isConfigured()) {
        var o = {
          shop: ticket && ticket.title, lines: (ticket && ticket.lines) || [],
          total: ticket && ticket.total, method: ticket && ticket.method,
        };
        return KiwiPrinter.printReceipt(o).then(function (res) {
          return (res && res.ok) ? { ok: true, printed: true } : mockPrint(ticket);
        });
      }
      return mockPrint(ticket);
    },
    // Open the cash drawer (ESC/POS kick). Real via the bridge when configured; the
    // mock resolves immediately otherwise.
    openDrawer: function () {
      if (window.KiwiPrinter && KiwiPrinter.isConfigured() && window.KiwiEscPos) {
        return KiwiPrinter.printBytes(window.KiwiEscPos.builder().init().drawer().bytes())
          .then(function (res) { return (res && res.ok) ? { ok: true } : { ok: true, mock: true }; });
      }
      return Promise.resolve({ ok: true, mock: true });
    },
    // Barcode scan. Mock resolves a simulated code after a tick.
    scan: function (cb) { setTimeout(function () { cb && cb({ code: '000000000000', mock: true }); }, 250); return Promise.resolve(); },
    // Card read. Mock resolves approved; NO certified EMV in round one.
    readCard: function (amount) { return Promise.resolve({ approved: true, amount: amount, mock: true }); }
  };
})();
