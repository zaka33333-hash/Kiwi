/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · BARCODE ENGINE — window.KiwiBarcode
 * ---------------------------------------------------------------------------
 * Dependency-free, offline. Renders REAL, scannable barcodes to inline SVG.
 * Used by the boutique catalog (assets/boutique-catalog.js) on both surfaces:
 *   · the caisse boutique (PIN 0002 · assets/pos-boutique.js) — generate + print
 *   · the dashboard boutique (assets/pages-pro.js) — view + reprint
 *
 * Supported symbologies
 *   · EAN-13   — the retail default. Full L/G/R encoding, first-digit parity
 *                pattern, mod-10 check digit. Store-generated codes live in the
 *                GS1 "restricted circulation within a company" range (prefix
 *                20–29) so they can NEVER collide with a real manufacturer GTIN.
 *   · Code 128 — Code Set B (ASCII 32–127), mod-103 checksum. Opt-in, for
 *                human-readable SKU strings (e.g. CFB-001-EMERAUDE-M).
 *
 * API (all pure unless noted)
 *   KiwiBarcode.ean13CheckDigit(d12)   → check digit (number) for 12 digits
 *   KiwiBarcode.isValidEan13(str)      → true if 13 digits + valid check
 *   KiwiBarcode.ean13(digits)          → { modules:'1010…', text:'…' }  (bit string)
 *   KiwiBarcode.code128(data)          → { modules:'1010…', text:'…' }
 *   KiwiBarcode.detect(raw)            → 'ean13'|'ean8'|'upca'|'code128'|'unknown'
 *   KiwiBarcode.nextInStoreEan()       → fresh valid in-store EAN-13 string (STATEFUL — bumps a localStorage counter)
 *   KiwiBarcode.peekNextSeq()          → the counter value that nextInStoreEan() would use next
 *   KiwiBarcode.svg(value, opts)       → '<svg…>' render (auto-detects format unless opts.format given)
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────── EAN-13 ─────────────────────────── */

  // 7-module encodings, indexed by digit 0-9.
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']; // odd parity (left)
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111']; // even parity (left)
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']; // right
  // Which of the 6 left digits use L vs G, keyed by the first digit.
  const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

  function ean13CheckDigit(d12) {
    const s = String(d12).replace(/\D/g, '').slice(0, 12).padStart(12, '0');
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      // 1-indexed positions: odd → ×1, even → ×3.
      sum += (+s[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  }

  function isValidEan13(str) {
    const s = String(str || '').replace(/\D/g, '');
    if (s.length !== 13) return false;
    return ean13CheckDigit(s.slice(0, 12)) === +s[12];
  }

  // Accepts 12 digits (check appended) or 13 (validated/normalised). Returns bit modules.
  function ean13(digits) {
    let s = String(digits || '').replace(/\D/g, '');
    if (s.length === 12) s += String(ean13CheckDigit(s));
    if (s.length !== 13) throw new Error('EAN-13 needs 12 or 13 digits, got ' + s.length);
    const first = +s[0];
    const parity = PARITY[first];
    let bits = '101'; // start guard
    for (let i = 1; i <= 6; i++) {
      const d = +s[i];
      bits += (parity[i - 1] === 'L' ? L : G)[d];
    }
    bits += '01010'; // centre guard
    for (let i = 7; i <= 12; i++) bits += R[+s[i]];
    bits += '101'; // end guard
    return { modules: bits, text: s, format: 'ean13' };
  }

  /* ─────────────────────────── Code 128 (Set B) ─────────────────────────── */

  // 107 symbol patterns (values 0-106). Each is a 6-run width string; runs
  // alternate bar/space starting with a bar. Value 106 (stop) carries a 7th run.
  const C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
  const START_B = 104, STOP = 106;

  function runsToBits(runs) {
    // runs = string of widths; alternate bar(1)/space(0) starting with bar.
    let bits = '', bar = true;
    for (const ch of runs) {
      const w = +ch;
      bits += (bar ? '1' : '0').repeat(w);
      bar = !bar;
    }
    return bits;
  }

  function code128(data) {
    const str = String(data == null ? '' : data);
    const vals = [START_B];
    for (const ch of str) {
      const code = ch.charCodeAt(0);
      if (code < 32 || code > 126) throw new Error('Code 128-B: unsupported char "' + ch + '"');
      vals.push(code - 32); // Set B value = ascii - 32
    }
    // Checksum: (start + Σ i·value_i) mod 103, i from 1 for the first data symbol.
    let sum = START_B;
    for (let i = 1; i < vals.length; i++) sum += vals[i] * i;
    vals.push(sum % 103);
    vals.push(STOP);
    let bits = '';
    for (const v of vals) bits += runsToBits(C128[v]);
    return { modules: bits, text: str, format: 'code128' };
  }

  /* ─────────────────────────── generation / detection ─────────────────────────── */

  const SEQ_KEY = 'kiwiBarcodeSeq:maisonMansour';
  function readSeq() { const n = parseInt(localStorage.getItem(SEQ_KEY) || '0', 10); return isNaN(n) ? 0 : n; }
  function peekNextSeq() { return readSeq() + 1; }

  // Fresh in-store EAN-13. Prefix "20" (GS1 restricted-circulation range 20-29)
  // + 10-digit zero-padded counter → 12 data digits, + mod-10 check = 13.
  function nextInStoreEan() {
    const seq = readSeq() + 1;
    localStorage.setItem(SEQ_KEY, String(seq));
    const body = '20' + String(seq).padStart(10, '0'); // 12 digits
    return body + String(ean13CheckDigit(body));
  }

  function detect(raw) {
    const s = String(raw || '').trim();
    const digits = s.replace(/\D/g, '');
    if (/^\d+$/.test(s)) {
      if (s.length === 13) return 'ean13';
      if (s.length === 12) return 'upca';
      if (s.length === 8)  return 'ean8';
    }
    if (s.length && digits.length === s.length && s.length <= 18) return 'numeric';
    return s.length ? 'code128' : 'unknown';
  }

  /* ─────────────────────────── SVG render ─────────────────────────── */

  function encode(value, format) {
    const s = String(value == null ? '' : value);
    const fmt = format || (isValidEan13(s) ? 'ean13' : (/^\d{12}$/.test(s.replace(/\D/g, '')) ? 'ean13' : 'code128'));
    if (fmt === 'ean13') return ean13(s);
    return code128(s);
  }

  // opts: { format, height=44, module=2, showText=true, quiet=10, color='#0A0F0D', bg='transparent', textSize }
  function svg(value, opts) {
    opts = opts || {};
    let enc;
    try { enc = encode(value, opts.format); }
    catch (e) { return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="4" y="24" font-size="10" fill="#9B2F22">code invalide</text></svg>`; }
    const mod    = opts.module != null ? opts.module : 2;
    const height = opts.height != null ? opts.height : 44;
    const quiet  = opts.quiet  != null ? opts.quiet  : 10;
    const showText = opts.showText !== false;
    const color = opts.color || '#0A0F0D';
    const textH = showText ? (opts.textSize || 11) + 5 : 0;
    const bits = enc.modules;
    const totalMod = bits.length + quiet * 2;
    const w = totalMod * mod;
    const h = height + textH;
    let rects = '';
    let x = quiet, run = 0;
    for (let i = 0; i <= bits.length; i++) {
      if (bits[i] === '1') { run++; }
      else {
        if (run > 0) { rects += `<rect x="${(x) * mod}" y="0" width="${run * mod}" height="${height}" fill="${color}"/>`; x += run; run = 0; }
        x++;
      }
    }
    let txt = '';
    if (showText) {
      const label = enc.format === 'ean13'
        ? enc.text.replace(/^(\d)(\d{6})(\d{6})$/, '$1 $2 $3')
        : enc.text;
      txt = `<text x="${w / 2}" y="${height + textH - 3}" text-anchor="middle" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="${opts.textSize || 11}" letter-spacing="1" fill="${color}">${escapeXml(label)}</text>`;
    }
    const bgRect = opts.bg && opts.bg !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${opts.bg}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="code-barres ${escapeXml(enc.text)}">${bgRect}${rects}${txt}</svg>`;
  }

  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ─────────────────────────── printable labels ───────────────────────────
   * Shared by the caisse (label printer wired to the till) and the dashboard.
   * A print root is appended in-page and shown ONLY at print time (@media print)
   * so it works without popups. Each label carries name · size · colour · price
   * and the scannable barcode + its human-readable number. */
  function ensurePrintCss() {
    if (document.getElementById('kbl-print-css')) return;
    const st = document.createElement('style');
    st.id = 'kbl-print-css';
    st.textContent = `
      #kbl-print-root { display: none; }
      @media print {
        html, body { background: #fff !important; }
        body > *:not(#kbl-print-root) { display: none !important; }
        #kbl-print-root { display: block !important; position: static; }
        .kbl-sheet { display: flex; flex-wrap: wrap; gap: 4mm; align-content: flex-start; }
        .kbl {
          width: 48mm; min-height: 28mm; box-sizing: border-box;
          border: 0.2mm solid #ddd; border-radius: 1.5mm; padding: 2mm 2.5mm;
          display: flex; flex-direction: column; justify-content: space-between;
          page-break-inside: avoid; font-family: 'Inter Tight', system-ui, sans-serif; color: #0A0F0D;
        }
        .kbl-t { font-size: 8.5pt; font-weight: 600; line-height: 1.1; }
        .kbl-m { font-size: 7pt; color: #444; margin-top: 0.5mm; }
        .kbl-m b { color: #0A0F0D; font-size: 8pt; }
        .kbl-bc { margin-top: 1mm; text-align: center; }
        .kbl-bc svg { max-width: 100%; height: auto; }
        @page { size: auto; margin: 8mm; }
      }`;
    document.head.appendChild(st);
  }

  function labelHTML(l) {
    l = l || {};
    const svg = api.svg(l.code, { format: l.format, height: 40, module: 1.5, showText: true, textSize: 9 });
    const priceStr = (l.price != null && l.price !== '') ? ` · <b>${escapeXml(String(l.price))} MAD</b>` : '';
    return `<div class="kbl"><div class="kbl-t">${escapeXml(l.title || '')}</div>` +
           `<div class="kbl-m">${escapeXml(l.sub || '')}${priceStr}</div>` +
           `<div class="kbl-bc">${svg}</div></div>`;
  }

  // Browser fallback: paint a hidden print root and open the OS print sheet.
  // Only reached when no thermal printer is paired, or a paired bridge is down.
  function browserPrint(flat) {
    let root = document.getElementById('kbl-print-root');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'kbl-print-root';
    root.innerHTML = `<div class="kbl-sheet">${flat.map(labelHTML).join('')}</div>`;
    document.body.appendChild(root);
    ensurePrintCss();
    setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(() => root.remove(), 600); }, 60);
  }

  // labels: [{ title, sub, price, code, format }]. opts: { copies }
  // REAL path: when a thermal printer is paired (KiwiPrinter + KiwiEscPos), relay
  // the ESC/POS label bytes to the Kiwi Printer Bridge — the same routing receipts
  // use in assets/caisse-hardware.js. If that bridge is unreachable, fall soft to
  // the browser print sheet so a label still comes out. When NO printer is paired,
  // open the connect-a-printer modal instead of dumping the owner into the OS
  // Save-as-PDF dialog (a 48 mm label on a Letter page reads as an empty sheet).
  function printLabels(labels, opts) {
    opts = opts || {};
    const copies = Math.max(1, opts.copies || 1);
    const list = (Array.isArray(labels) ? labels : [labels]).filter(Boolean);
    const flat = [];
    list.forEach((l) => { for (let i = 0; i < copies; i++) flat.push(l); });
    if (!flat.length) return Promise.resolve({ ok: false, reason: 'no-labels' });

    const KP = window.KiwiPrinter;
    if (KP && KP.isConfigured() && window.KiwiEscPos) {
      return KP.printLabels(flat).then((res) => {
        if (res && res.ok) return res;
        browserPrint(flat);                       // bridge down → fail soft
        return res || { ok: false };
      }, () => { browserPrint(flat); return { ok: false }; });
    }
    // No printer paired: guide the owner to connect one (real product flow), but
    // keep a browser/PDF escape inside the modal so a label still comes out for a
    // merchant who prints label sheets on an ordinary printer.
    if (KP && typeof KP.openSetup === 'function') {
      KP.openSetup({ onBrowserPrint: () => browserPrint(flat) });
      return Promise.resolve({ ok: false, reason: 'not-configured' });
    }
    browserPrint(flat);
    return Promise.resolve({ ok: true, browser: true });
  }

  const api = {
    ean13CheckDigit,
    isValidEan13,
    ean13,
    code128,
    detect,
    nextInStoreEan,
    peekNextSeq,
    encode,
    svg,
    labelHTML,
    printLabels,
  };
  window.KiwiBarcode = api;
})();
