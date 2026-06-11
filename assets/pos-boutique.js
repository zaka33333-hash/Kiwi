/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · BOUTIQUE MODE — Maison Mansour (PIN 0002), mode & artisanat.
 * ---------------------------------------------------------------------------
 * Loaded lazily by assets/pos-dispatch.js, which owns the PIN choreography
 * and provides the root <div class="vx-screen" id="pos-boutique">. This file
 * builds the whole app inside it and self-registers on window.KiwiPosDispatch.
 *
 * The boutique story: caftans, takchitas et babouches vendus au toucher —
 * une grille visuelle par rayon, la taille avec le stock par taille sous le
 * doigt, la remise sous accord gérante. Le différenciateur métier :
 * ÉCHANGES & AVOIRS — on retrouve la vente par n° de ticket ou téléphone,
 * on échange la pièce ou on émet un avoir code-barres qui revient en caisse
 * comme moyen de paiement. V1 = couche opérationnelle : la carte part au
 * lecteur partenaire, Kiwi n'encaisse pas.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────── helpers ───────────────────────── */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtMAD = (n) => new Intl.NumberFormat('fr-FR', { useGrouping: true }).format(Math.round(n)) + ' MAD';
  const icons  = () => { if (window.lucide) try { window.lucide.createIcons(); } catch (e) {} };
  const lens   = () => { if (window.KiwiLens) try { window.KiwiLens.rescan(); } catch (e) {} };
  const DAYS   = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const pad2   = (n) => String(n).padStart(2, '0');
  const fmtDT  = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const fmtDay = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtHM  = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const MIN = 60 * 1000;

  function toast(msg, ms) {
    const stack = $('#toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => el.classList.add('fade'), ms || 2200);
    setTimeout(() => el.remove(), (ms || 2200) + 280);
  }

  /* Deterministic pseudo-barcode (Code-39 lookalike) from any id. */
  function barcode(seed, h) {
    h = h || 30;
    let bars = '', x = 0, s = 7;
    const len = Math.max(seed.length * 4, 26);
    for (let i = 0; i < len; i++) {
      s = (s * 31 + seed.charCodeAt(i % seed.length) + i * 11) % 97;
      const w = 1 + (s % 3);
      bars += `<rect x="${x}" y="0" width="${w}" height="${h}"></rect>`;
      x += w + 1 + ((s >> 3) % 2);
    }
    return `<svg viewBox="0 0 ${x} ${h}" preserveAspectRatio="none" style="height:${h}px" fill="currentColor" aria-hidden="true">${bars}</svg>`;
  }

  /* ───────────────────────── line-art ─────────────────────────
     Same visual voice as the pressing ART dict: forest strokes, mint-tint
     fills, 64×64 grid. These ARE the rayons — the grid sells by silhouette. */
  const art = (inner) => `<svg class="bq-art" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
  const ART = {
    caftan: art(`<path class="fill" d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9c-1.6 2.4-10.4 2.4-12 0z"/><path d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9"/><path d="M26 9c1.6 2.4 10.4 2.4 12 0"/><path d="M32 13v41"/><circle class="thin" cx="29.5" cy="20" r=".9"/><circle class="thin" cx="29.5" cy="26" r=".9"/><circle class="thin" cx="29.5" cy="32" r=".9"/><circle class="thin" cx="29.5" cy="38" r=".9"/><path class="thin" d="M20 48h24"/>`),
    caftan_perle: art(`<path class="fill" d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9c-1.6 2.4-10.4 2.4-12 0z"/><path d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9"/><path d="M26 9c1.6 2.4 10.4 2.4 12 0"/><path d="M32 13v41"/><circle class="thin" cx="26" cy="30" r=".8"/><circle class="thin" cx="38" cy="27" r=".8"/><circle class="thin" cx="27" cy="42" r=".8"/><circle class="thin" cx="37" cy="36" r=".8"/><circle class="thin" cx="35" cy="46" r=".8"/><circle class="thin" cx="29" cy="22" r=".8"/>`),
    caftan_jawhara: art(`<path class="fill" d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9c-1.6 2.4-10.4 2.4-12 0z"/><path d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9"/><path d="M26 9c1.6 2.4 10.4 2.4 12 0"/><path d="M32 13v18M32 36v18"/><rect class="fill" x="23" y="30" width="18" height="5.5" rx="2.5"/><rect x="23" y="30" width="18" height="5.5" rx="2.5"/><circle cx="32" cy="32.8" r="1.8"/><circle class="thin" cx="32" cy="16.5" r="1"/><path class="thin" d="M21 48h22"/>`),
    caftan_ete: art(`<path class="fill" d="M26 9 17 14l2 8 4-2-3 33h24l-3-33 4 2 2-8-9-5c-1.6 2.4-10.4 2.4-12 0z"/><path d="M26 9 17 14l2 8 4-2-3 33h24l-3-33 4 2 2-8-9-5"/><path d="M28 10l4 6 4-6"/><path class="thin" d="M32 16v9"/><path class="thin" d="M22 46c7 3 13 3 20 0"/>`),
    caftan_velours: art(`<path class="fill" d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9c-1.6 2.4-10.4 2.4-12 0z"/><path d="M26 9 15 15l3 7 4-2-4 34h28l-4-34 4 2 3-7L38 9"/><path d="M26 9c1.6 2.4 10.4 2.4 12 0"/><path d="M32 13v41"/><path class="soft" d="M25 24l-2.5 26M39 24l2.5 26"/><path class="thin" d="M28.5 22 27 52M35.5 22 37 52"/>`),
    takchita: art(`<path class="fill" d="M27 9 16 15l3 7 4-2-4 34h26l-4-34 4 2 3-7L37 9c-1.4 2.2-8.6 2.2-10 0z"/><path d="M27 9 16 15l3 7 4-2-4 34h26l-4-34 4 2 3-7L37 9"/><path d="M27 9c1.4 2.2 8.6 2.2 10 0"/><path d="M27 12l-3 42M37 12l3 42"/><rect x="25" y="30" width="14" height="4.5" rx="2"/><circle class="thin" cx="32" cy="32.2" r="1.2"/><path class="thin" d="M32 14v14"/>`),
    takchita_mariage: art(`<path class="fill" d="M27 9 16 15l3 7 4-2-4 34h26l-4-34 4 2 3-7L37 9c-1.4 2.2-8.6 2.2-10 0z"/><path d="M27 9 16 15l3 7 4-2-4 34h26l-4-34 4 2 3-7L37 9"/><path d="M27 9c1.4 2.2 8.6 2.2 10 0"/><path d="M27 12l-3 42M37 12l3 42"/><rect x="25" y="29" width="14" height="4.5" rx="2"/><path class="thin" d="M21 48h22"/><circle class="thin" cx="29" cy="41" r=".8"/><circle class="thin" cx="35" cy="44" r=".8"/><circle class="thin" cx="32" cy="22" r=".8"/><circle class="thin" cx="33" cy="49" r=".8"/>`),
    mdamma: art(`<rect class="fill" x="6" y="28" width="52" height="9" rx="4.5"/><rect x="6" y="28" width="52" height="9" rx="4.5"/><circle class="fill" cx="32" cy="32.5" r="7.5"/><circle cx="32" cy="32.5" r="7.5"/><circle class="thin" cx="32" cy="32.5" r="3.6"/><path class="thin" d="M13 32.5h8M43 32.5h8"/><circle class="thin" cx="18" cy="32.5" r="1"/><circle class="thin" cx="46" cy="32.5" r="1"/>`),
    foulard: art(`<path d="M10 14h44"/><path class="fill" d="M21 14v25c0 6 4 9 7 5l3-4V14z"/><path d="M21 14v25c0 6 4 9 7 5l3-4V14z"/><path class="fill" d="M35 14v17c0 5 3.5 7 6.5 3.5l1.5-2V14z"/><path d="M35 14v17c0 5 3.5 7 6.5 3.5l1.5-2V14z"/><path class="thin" d="M24 45v5M27 47v5M30 43v5"/><path class="thin" d="M38 36v4M41 35v4"/>`),
    chale: art(`<path class="fill" d="M10 18h44L32 50z"/><path d="M10 18h44L32 50z"/><path class="thin" d="M22 18l10 20M42 18 32 38"/><path class="thin" d="M15 25l-3 2M21 33l-3 2M27 41l-3 2M49 25l3 2M43 33l3 2M37 41l3 2"/>`),
    broche: art(`<circle class="fill" cx="32" cy="29" r="13"/><circle cx="32" cy="29" r="13"/><circle class="thin" cx="32" cy="29" r="6.5"/><circle class="thin" cx="32" cy="18.5" r="1.4"/><circle class="thin" cx="42.5" cy="29" r="1.4"/><circle class="thin" cx="32" cy="39.5" r="1.4"/><circle class="thin" cx="21.5" cy="29" r="1.4"/><path d="M27 46h10"/><path class="thin" d="M37 46l4 5"/>`),
    babouche: art(`<path class="fill" d="M8 43c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M8 43c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M9 46.5c15 2.5 31 2.5 46-1.5"/><path class="thin" d="M21 38c4 1.6 6.5 3.6 7.5 6.6"/>`),
    babouche_brodee: art(`<path class="fill" d="M8 43c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M8 43c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M9 46.5c15 2.5 31 2.5 46-1.5"/><path class="thin" d="M28 39.5l2-2 2 2-2 2zM37 37.5l2-2 2 2-2 2z"/><path class="thin" d="M20 39c3.5 1.4 5.8 3.2 6.8 5.8"/>`),
    cherbil: art(`<path class="fill" d="M8 41c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M8 41c0-2.4 2.4-4 6-4.4l20-2.6c9-1.2 15-5 17-11 2.6 7-1 15-9 17.8-3 1-6 1.6-10 1.6H12c-2.7 0-4-1-4-1.4z"/><path d="M13 42.6v5.4h8v-4.6"/><path class="thin" d="M30 38.5l1.5-1.5 1.5 1.5-1.5 1.5z"/><circle class="thin" cx="38" cy="36.5" r=".9"/><circle class="thin" cx="42" cy="35" r=".9"/>`),
    babouche_enfant: art(`<path class="fill" d="M21 16l-5.5 13c0 8 2.2 17 5.5 17s5.5-9 5.5-17z"/><path d="M21 16l-5.5 13c0 8 2.2 17 5.5 17s5.5-9 5.5-17z"/><path class="fill" d="M43 16l-5.5 13c0 8 2.2 17 5.5 17s5.5-9 5.5-17z"/><path d="M43 16l-5.5 13c0 8 2.2 17 5.5 17s5.5-9 5.5-17z"/><path class="thin" d="M17 31c2.5 2 5.5 2 8 0M39 31c2.5 2 5.5 2 8 0"/>`),
    sac: art(`<path d="M24 21c0-9 16-9 16 0"/><path class="fill" d="M15 21h34l-4 29H19z"/><path d="M15 21h34l-4 29H19z"/><path class="thin" d="M19.5 28h25M18.5 35h27M18 42h26"/><path class="thin" d="M24 22l-2 27M32 22v27M40 22l2 27"/>`),
    cabas: art(`<path d="M23 21c0-7 5.5-7 5.5 0M35.5 21c0-7 5.5-7 5.5 0"/><rect class="fill" x="14" y="21" width="36" height="29" rx="2.5"/><rect x="14" y="21" width="36" height="29" rx="2.5"/><path class="thin" d="M14 31l6-4.5 6 4.5 6-4.5 6 4.5 6-4.5 6 4.5"/><path class="thin" d="M14 41l6-4.5 6 4.5 6-4.5 6 4.5 6-4.5 6 4.5"/>`),
    pochette: art(`<rect class="fill" x="13" y="23" width="38" height="23" rx="5"/><rect x="13" y="23" width="38" height="23" rx="5"/><path d="M13 31h38"/><circle cx="32" cy="35.5" r="2"/><path class="thin" d="M47 23c5-3.5 7-8 3.5-11"/><circle class="thin" cx="20" cy="40" r=".8"/><circle class="thin" cx="26" cy="38" r=".8"/><circle class="thin" cx="40" cy="40" r=".8"/><circle class="thin" cx="44" cy="37" r=".8"/>`),
  };

  /* ───────────────────────── couleurs ───────────────────────── */
  const COLORS = [
    { id: 'ivoire',     label: 'Ivoire',      hex: '#EFE7D6' },
    { id: 'blanc',      label: 'Blanc',       hex: '#FFFFFF' },
    { id: 'noir',       label: 'Noir',        hex: '#1F2421' },
    { id: 'dore',       label: 'Doré',        hex: '#C9A227' },
    { id: 'argent',     label: 'Argenté',     hex: '#C8CCD0' },
    { id: 'bordeaux',   label: 'Bordeaux',    hex: '#6E1F2E' },
    { id: 'nuit',       label: 'Bleu nuit',   hex: '#1F3A5C' },
    { id: 'emeraude',   label: 'Émeraude',    hex: '#2E6B4F' },
    { id: 'safran',     label: 'Safran',      hex: '#D99A2B' },
    { id: 'terracotta', label: 'Terracotta',  hex: '#B0613F' },
    { id: 'rose',       label: 'Rose poudré', hex: '#D8A8A0' },
    { id: 'camel',      label: 'Camel',       hex: '#B68B5C' },
    { id: 'gris',       label: 'Gris perle',  hex: '#9AA09D' },
  ];
  const COLOR = Object.fromEntries(COLORS.map((c) => [c.id, c]));

  /* ───────────────────────── catalogue (rayons) ─────────────────────────
     Stock is PER SIZE — the whole point of the variant sheet. MAD, Maarif. */
  const RAYONS = [
    { id: 'caftans', label: 'Caftans', items: [
      { id: 'caftan_fassi',     name: 'Caftan Fassi',           price: 2400, art: 'caftan',          kind: 'taille',   flag: 'brodé main',
        ean: '6111120034017', sizes: { S: 2, M: 3, L: 2, XL: 1 }, colors: ['emeraude', 'bordeaux', 'nuit', 'ivoire'] },
      { id: 'caftan_signature', name: 'Caftan Signature Mansour', price: 3500, art: 'caftan_jawhara', kind: 'taille',   flag: 'pièce signature',
        ean: '6111120034024', sizes: { S: 1, M: 0, L: 2, XL: 1 }, colors: ['ivoire', 'dore', 'bordeaux'] },
      { id: 'caftan_velours',   name: 'Caftan Velours',          price: 1850, art: 'caftan_velours', kind: 'taille',
        ean: '6111120034031', sizes: { S: 2, M: 2, L: 3, XL: 2 }, colors: ['bordeaux', 'nuit', 'emeraude'] },
      { id: 'caftan_ete',       name: 'Caftan Coton Été',        price: 1200, art: 'caftan_ete',     kind: 'taille',
        ean: '6111120034048', sizes: { S: 4, M: 5, L: 3, XL: 2 }, colors: ['ivoire', 'safran', 'terracotta', 'blanc'] },
      { id: 'caftan_perle',     name: 'Caftan Soirée Perlé',     price: 2900, art: 'caftan_perle',   kind: 'taille',   flag: 'délicat',
        ean: '6111120034055', sizes: { S: 1, M: 2, L: 1, XL: 0 }, colors: ['nuit', 'argent', 'bordeaux'] },
    ] },
    { id: 'takchitas', label: 'Takchitas', items: [
      { id: 'takchita_sultane', name: 'Takchita Sultane',  price: 3200, art: 'takchita',         kind: 'taille',
        ean: '6111120034062', sizes: { S: 1, M: 2, L: 2, XL: 1 }, colors: ['bordeaux', 'dore', 'emeraude'] },
      { id: 'takchita_zellige', name: 'Takchita Zellige',  price: 2800, art: 'takchita',         kind: 'taille',
        ean: '6111120034079', sizes: { S: 2, M: 3, L: 1, XL: 1 }, colors: ['emeraude', 'nuit', 'ivoire'] },
      { id: 'takchita_mariage', name: 'Takchita Mariage',  price: 4500, art: 'takchita_mariage', kind: 'taille',   flag: 'cérémonie',
        ean: '6111120034086', sizes: { S: 0, M: 1, L: 1, XL: 0 }, colors: ['ivoire', 'dore', 'blanc'] },
      { id: 'takchita_amira',   name: 'Takchita Amira',    price: 2200, art: 'takchita',         kind: 'taille',
        ean: '6111120034093', sizes: { S: 3, M: 3, L: 2, XL: 2 }, colors: ['rose', 'terracotta', 'nuit'] },
    ] },
    { id: 'accessoires', label: 'Accessoires', items: [
      { id: 'mdamma_doree',  name: 'Mdamma dorée',  price: 650, art: 'mdamma',  kind: 'tu', flag: 'artisanat',
        ean: '6111120034109', sizes: { TU: 4 },  colors: ['dore', 'argent'] },
      { id: 'foulard_soie',  name: 'Foulard soie',  price: 240, art: 'foulard', kind: 'tu',
        ean: '6111120034116', sizes: { TU: 12 }, colors: ['safran', 'rose', 'nuit', 'ivoire'] },
      { id: 'chale_laine',   name: 'Châle laine',   price: 320, art: 'chale',   kind: 'tu',
        ean: '6111120034123', sizes: { TU: 7 },  colors: ['bordeaux', 'camel', 'gris'] },
      { id: 'broche_perles', name: 'Broche perles', price: 180, art: 'broche',  kind: 'tu',
        ean: '6111120034130', sizes: { TU: 9 },  colors: ['argent', 'dore'] },
    ] },
    { id: 'babouches', label: 'Babouches', items: [
      { id: 'babouche_homme',  name: 'Babouche cuir homme',   price: 280, art: 'babouche',        kind: 'pointure',
        ean: '6111120034147', sizes: { 40: 2, 41: 3, 42: 4, 43: 2, 44: 1 }, colors: ['camel', 'noir', 'bordeaux'] },
      { id: 'babouche_brodee', name: 'Babouche brodée femme', price: 350, art: 'babouche_brodee', kind: 'pointure',
        ean: '6111120034154', sizes: { 36: 1, 37: 2, 38: 0, 39: 3, 40: 2 }, colors: ['rose', 'ivoire', 'safran'] },
      { id: 'cherbil_perle',   name: 'Cherbil perlé',         price: 450, art: 'cherbil',         kind: 'pointure', flag: 'fait main',
        ean: '6111120034161', sizes: { 36: 1, 37: 1, 38: 2, 39: 1, 40: 0 }, colors: ['argent', 'rose', 'dore'] },
      { id: 'babouche_enfant', name: 'Babouche enfant',       price: 180, art: 'babouche_enfant', kind: 'pointure',
        ean: '6111120034178', sizes: { 24: 2, 26: 3, 28: 2, 30: 1 }, colors: ['safran', 'rose', 'camel'] },
    ] },
    { id: 'sacs', label: 'Sacs', items: [
      { id: 'sac_tresse',       name: 'Sac cuir tressé',  price: 780, art: 'sac',      kind: 'tu',
        ean: '6111120034185', sizes: { TU: 3 }, colors: ['camel', 'noir'] },
      { id: 'cabas_berbere',    name: 'Cabas berbère',    price: 420, art: 'cabas',    kind: 'tu', flag: 'artisanat',
        ean: '6111120034192', sizes: { TU: 6 }, colors: ['terracotta', 'ivoire'] },
      { id: 'pochette_sequins', name: 'Pochette sequins', price: 350, art: 'pochette', kind: 'tu',
        ean: '6111120034208', sizes: { TU: 5 }, colors: ['dore', 'argent', 'noir'] },
    ] },
  ];
  const P = {};
  const BY_EAN = {};
  RAYONS.forEach((r) => r.items.forEach((it) => { it.rayon = r.id; P[it.id] = it; BY_EAN[it.ean] = it.id; }));

  const sizesOf   = (p) => Object.keys(p.sizes);
  const stockOf   = (p) => sizesOf(p).reduce((s, k) => s + p.sizes[k], 0);
  const stockAdd  = (pid, size, d) => { P[pid].sizes[size] = Math.max(0, (P[pid].sizes[size] || 0) + d); };
  const sizeWord  = (p) => p.kind === 'pointure' ? 'Pointure' : p.kind === 'tu' ? 'Taille unique' : 'Taille';
  const firstFree = (p) => sizesOf(p).find((k) => p.sizes[k] > 0) || null;

  /* ───────────────────────── équipe & clientes (Casa · Maarif) ───────────── */
  const STAFF = {
    gerante:   { name: 'Aicha Benali', role: 'Gérante boutique' },
    conseil:   { name: 'Rania Tazi',   role: 'Conseillère de vente' },
    caissiere: { name: 'Salma',        role: 'Caisse' },
  };

  const CLIENTES = [
    { id: 'c1', name: 'Lalla Khadija El Fassi', phone: '0661 42 18 30', points: 1240, taille: 'M',  achats: 9,  spent: 18400, vip: true,
      prefs: ['Caftans brodés main — jamais de machine', 'Retouches chez Maalem Hassan'],
      history: [{ when: '24 mai', what: 'Caftan Velours · M · bordeaux', amt: 1850 }, { when: '12 avr.', what: 'Takchita Zellige · M · émeraude', amt: 2800 }, { when: '2 mars', what: 'Mdamma dorée', amt: 650 }] },
    { id: 'c2', name: 'Salma Bennis', phone: '0664 77 02 19', points: 480, taille: 'S', achats: 4, spent: 3160,
      prefs: ['Pointure 39 — le 38 taille petit'],
      history: [{ when: '10 juin', what: 'Cherbil perlé · 37 · argent (retour avoir)', amt: 450 }, { when: '18 mai', what: 'Caftan Coton Été · S · safran', amt: 1200 }] },
    { id: 'c3', name: 'Yasmina Alaoui', phone: '0667 31 55 08', points: 2130, taille: 'L', achats: 14, spent: 31200, vip: true,
      prefs: ['Takchitas de cérémonie — appeler dès les nouveautés'],
      history: [{ when: '28 mai', what: 'Takchita Mariage · L · ivoire', amt: 4500 }, { when: '6 mai', what: 'Caftan Signature Mansour · L · doré', amt: 3500 }] },
    { id: 'c4', name: 'Imane Cherkaoui', phone: '0650 09 64 12', points: 310, taille: 'S', achats: 3, spent: 2240,
      prefs: [],
      history: [{ when: '30 mai', what: 'Foulard soie · safran', amt: 240 }] },
    { id: 'c5', name: 'Nadia Berrechid', phone: '0668 23 90 41', points: 95, taille: 'XL', achats: 1, spent: 950,
      prefs: ['Première visite via Instagram'],
      history: [{ when: '3 juin', what: 'Cabas berbère · terracotta', amt: 420 }] },
    { id: 'c6', name: 'Houda Mekouar', phone: '0652 84 17 66', points: 720, taille: 'M', achats: 6, spent: 7050,
      prefs: ['Préfère ivoire et doré', 'Emballage cadeau systématique'],
      history: [{ when: '21 mai', what: 'Caftan Fassi · M · ivoire', amt: 2400 }, { when: '2 mai', what: 'Pochette sequins · dorée', amt: 350 }] },
  ];
  const CL = Object.fromEntries(CLIENTES.map((c) => [c.id, c]));
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const firstName = (name) => name.replace(/^Lalla\s+|^Mme\s+/i, '').split(/\s+/)[0];

  /* ───────────────────────── ventes du jour (seed, mi-journée) ──────────── */
  const NOW = Date.now();
  const mkLine = (pid, size, color, qty, remise) => {
    const p = P[pid];
    const rem = remise || 0;
    return { pid, size, color, qty, remise: rem, unit: Math.round(p.price * (100 - rem) / 100), returned: false, note: '' };
  };
  const SALES = [
    { id: 'MM-1207', at: new Date(NOW - 24 * MIN),  clientId: 'c4', by: 'Rania', kind: 'vente', methods: 'espèces',
      lines: [mkLine('caftan_ete', 'S', 'ivoire', 1), mkLine('broche_perles', 'TU', 'argent', 1)] },
    { id: 'MM-1206', at: new Date(NOW - 57 * MIN),  clientId: 'c3', by: 'Aicha', kind: 'vente', methods: 'carte',
      lines: [mkLine('takchita_sultane', 'M', 'dore', 1, 10)] },
    { id: 'MM-1205', at: new Date(NOW - 96 * MIN),  clientId: null, by: 'Aicha', kind: 'vente', methods: 'espèces',
      lines: [mkLine('cabas_berbere', 'TU', 'terracotta', 1)] },
    { id: 'MM-1204', at: new Date(NOW - 135 * MIN), clientId: 'c2', by: 'Salma', kind: 'vente', methods: 'carte',
      lines: [mkLine('babouche_brodee', '38', 'rose', 1), mkLine('foulard_soie', 'TU', 'safran', 1)] },
    { id: 'MM-1203', at: new Date(NOW - 170 * MIN), clientId: null, by: 'Rania', kind: 'vente', methods: 'espèces',
      lines: [mkLine('babouche_homme', '42', 'camel', 1)] },
  ];
  SALES.forEach((s) => { s.total = s.lines.reduce((t, l) => t + l.unit * l.qty, 0); });
  const findSale = (id) => SALES.find((s) => s.id === id);
  const saleClient = (s) => (s.clientId ? CL[s.clientId] : null);

  /* avoirs actifs — store credit. AV-2031 vient du retour cherbil d'hier. */
  const AVOIRS = [
    { code: 'AV-2031', amount: 350, balance: 350, holderId: 'c2', holderName: 'Salma Bennis',
      motif: 'Retour cherbil perlé · 37', at: new Date(NOW - 26 * 3600 * 1000), until: new Date(NOW + 182 * 24 * 3600 * 1000), from: 'MM-1188' },
  ];
  let avSeq = 2032;
  const activeAvoirs = () => AVOIRS.filter((a) => a.balance > 0);

  /* ───────────────────────── state ───────────────────────── */
  let saleSeq = 1208;            /* MM-1203…1207 vendues — MM-1208 = ticket en cours */
  const state = {
    view: 'vente',
    rayon: 'tous',
    ticket: null,                /* { num, lines:[], client:id|'passage'|null, remiseAuth } */
    exchange: null,              /* { saleId, idx } pendant le choix du remplacement */
    ret: null,                   /* { saleId, picks:Set, motif } sur la vue échanges */
    retQuery: '',
    clQuery: '',
    scanLog: [],
    scanIdx: 0,
    scanBusy: false,
    offline: false, queued: 0,
  };
  function freshTicket() {
    state.ticket = { num: `MM-${saleSeq}`, lines: [], client: null, remiseAuth: false };
  }
  function ticketClient() {
    const t = state.ticket;
    return t.client && t.client !== 'passage' ? CL[t.client] : null;
  }
  const lineUnit  = (ln) => Math.round(P[ln.pid].price * (100 - ln.remise) / 100);
  const lineTotal = (ln) => lineUnit(ln) * ln.qty;
  function ticketTotals(t) {
    const sub = t.lines.reduce((s, ln) => s + P[ln.pid].price * ln.qty, 0);
    const total = t.lines.reduce((s, ln) => s + lineTotal(ln), 0);
    return { sub, remise: sub - total, total };
  }
  const ticketCount = (t) => t.lines.reduce((s, ln) => s + ln.qty, 0);
  const caToday = () => SALES.reduce((s, x) => s + x.total, 0);
  function queueIfOffline(label) {
    if (!state.offline) return false;
    state.queued++;
    renderNet();
    toast(`${label} — enregistré hors-ligne (${state.queued} en attente)`);
    return true;
  }

  /* ═══════════════════════ MOUNT ═══════════════════════ */
  let root = null;

  function mount(rootEl) {
    root = rootEl;
    root.innerHTML = `
      <aside class="bq-rail">
        <div class="bq-brand">kiwi<i></i></div>
        <div class="bq-venue">
          <div class="bq-venue-name">Maison Mansour</div>
          <div class="bq-venue-sub">Casablanca · Maarif<br>Le même Kiwi — <b>un seul compte</b>.</div>
        </div>
        <nav class="bq-nav" id="bq-nav">
          <button class="bq-nav-it on" data-bq-view="vente"><i data-lucide="shopping-bag"></i><span>Vente</span><b class="bq-nav-badge" id="bq-badge-vente"></b></button>
          <button class="bq-nav-it" data-bq-view="scan"><i data-lucide="scan-line"></i><span>Scan</span><b class="bq-nav-badge" id="bq-badge-scan"></b></button>
          <button class="bq-nav-it" data-bq-view="echanges"><i data-lucide="arrow-left-right"></i><span>Échanges &amp; avoirs</span><b class="bq-nav-badge" id="bq-badge-ret"></b></button>
          <button class="bq-nav-it" data-bq-view="clientes"><i data-lucide="users"></i><span>Clientes</span><b class="bq-nav-badge" id="bq-badge-cl"></b></button>
        </nav>
        <div class="bq-rail-foot">
          <button class="bq-net" id="bq-net" title="Simuler une coupure réseau">
            <i class="bq-net-dot"></i><span class="bq-net-label">En ligne</span>
          </button>
          <button class="bq-lock" id="bq-lock"><i data-lucide="lock"></i><span>Verrouiller</span></button>
        </div>
      </aside>
      <main class="bq-main">
        <div class="bq-offline-note" id="bq-offline-note" hidden>
          Hors-ligne — les ventes sont enregistrées sur la tablette et synchronisées au retour du réseau.
          <b id="bq-queue-count"></b>
        </div>
        <section class="bq-view is-on" data-bq-panel="vente">
          <div class="bq-sell">
            <header class="bq-head">
              <div><h1>Vente</h1><div class="bq-head-sub" id="bq-today"></div></div>
              <div class="bq-head-hint">Touchez un article — taille, couleur et remise ensuite</div>
            </header>
            <div id="bq-exch-slot"></div>
            <div class="bq-cats" id="bq-cats"></div>
            <div class="bq-grid-scroll" id="bq-gridwrap"></div>
          </div>
          <aside class="bq-ticket" id="bq-ticket"></aside>
        </section>
        <section class="bq-view" data-bq-panel="scan"></section>
        <section class="bq-view" data-bq-panel="echanges"></section>
        <section class="bq-view" data-bq-panel="clientes"></section>
      </main>
      <div class="modal-veil" id="bq-sheet-veil"><div class="modal bq-sheet bq-rel" id="bq-sheetm"></div></div>
      <div class="modal-veil" id="bq-approve-veil"><div class="modal bq-approve bq-rel" id="bq-approvem"></div></div>
      <div class="modal-veil" id="bq-client-veil"><div class="modal bq-client bq-rel" id="bq-clientm"></div></div>
      <div class="modal-veil" id="bq-fiche-veil"><div class="modal bq-fiche bq-rel" id="bq-fichem"></div></div>
      <div class="modal-veil" id="bq-exch-veil"><div class="modal bq-exch bq-rel" id="bq-exchm"></div></div>
      <div class="modal-veil" id="bq-pay-veil"><div class="modal bq-pay bq-rel" id="bq-paym"></div></div>
      <div class="modal-veil" id="bq-avoir-veil"><div class="modal bq-avoirm bq-rel" id="bq-avoirmm"></div></div>`;

    $('#bq-nav', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-bq-view]');
      if (b) switchView(b.dataset.bqView);
    });
    $('#bq-lock', root).addEventListener('click', () => window.KiwiPosDispatch.lock());
    $('#bq-net', root).addEventListener('click', toggleOffline);
    $$('.modal-veil', root).forEach((v) => {
      v.addEventListener('click', (e) => { if (e.target === v) closeVeil(v); });
    });

    /* mi-journée : une vente est déjà en cours au comptoir */
    freshTicket();
    state.ticket.client = 'c1';
    state.ticket.lines = [
      { pid: 'caftan_fassi', size: 'M', color: 'emeraude', qty: 1, remise: 0 },
      { pid: 'foulard_soie', size: 'TU', color: 'safran', qty: 1, remise: 0 },
    ];
    state.ticket.lines.forEach((ln) => stockAdd(ln.pid, ln.size, -ln.qty));

    renderAll();
  }

  function onShow() {
    if (!root) return;
    const today = $('#bq-today', root);
    if (today) today.textContent = headSubVente();
    renderBadges();
    renderView(state.view);
    icons();
  }

  function openVeil(id) { const v = $(id, root); v.classList.add('is-open'); return v; }
  function closeVeil(v) { (typeof v === 'string' ? $(v, root) : v).classList.remove('is-open'); }

  /* ═══════════════════════ NAV / SHELL ═══════════════════════ */
  function switchView(view) {
    state.view = view;
    $$('.bq-nav-it', root).forEach((b) => b.classList.toggle('on', b.dataset.bqView === view));
    $$('.bq-view', root).forEach((p) => p.classList.toggle('is-on', p.dataset.bqPanel === view));
    renderView(view);
    icons();
  }
  function renderView(view) {
    if (view === 'vente') { renderTicket(); renderGrid(); renderExchNote(); }
    if (view === 'scan') renderScan();
    if (view === 'echanges') renderEchanges();
    if (view === 'clientes') renderClientes();
  }
  function renderBadges() {
    const items = state.ticket ? ticketCount(state.ticket) : 0;
    const avs = activeAvoirs().length;
    const set = (id, n) => {
      const el = $(id, root);
      el.textContent = n || '';
      el.style.display = n ? '' : 'none';
    };
    set('#bq-badge-vente', items);
    set('#bq-badge-scan', state.scanLog.length);
    set('#bq-badge-ret', avs);
    set('#bq-badge-cl', CLIENTES.length);
  }
  function headSubVente() {
    return `${fmtDT(new Date())} · ${SALES.length} vente${SALES.length > 1 ? 's' : ''} · ${fmtMAD(caToday())} aujourd'hui`;
  }
  function renderAll() {
    $('#bq-today', root).textContent = headSubVente();
    renderCats();
    renderGrid();
    renderTicket();
    renderExchNote();
    renderBadges();
    renderNet();
    icons();
  }
  function refreshOps() {
    renderBadges();
    renderView(state.view);
    icons();
  }

  /* ═══════════════════════ VENTE — grille par rayon ═══════════════════════ */
  function renderCats() {
    const all = RAYONS.reduce((s, r) => s + r.items.length, 0);
    $('#bq-cats', root).innerHTML =
      `<button class="bq-cat ${state.rayon === 'tous' ? 'on' : ''}" data-bq-cat="tous">Tous <span class="bq-cat-ct">${all}</span></button>` +
      RAYONS.map((r) =>
        `<button class="bq-cat ${state.rayon === r.id ? 'on' : ''}" data-bq-cat="${r.id}">${esc(r.label)} <span class="bq-cat-ct">${r.items.length}</span></button>`
      ).join('');
    $('#bq-cats', root).onclick = (e) => {
      const b = e.target.closest('[data-bq-cat]');
      if (!b) return;
      state.rayon = b.dataset.bqCat;
      renderCats(); renderGrid(); icons();
    };
  }

  function cardFlag(p) {
    const st = stockOf(p);
    if (st === 0) return '<span class="bq-card-flag out">épuisé</span>';
    if (st <= 2) return '<span class="bq-card-flag low">stock bas</span>';
    if (p.flag) return `<span class="bq-card-flag">${esc(p.flag)}</span>`;
    return '';
  }

  function renderGrid() {
    const rayons = state.rayon === 'tous' ? RAYONS : RAYONS.filter((r) => r.id === state.rayon);
    let i = 0;
    $('#bq-gridwrap', root).innerHTML = rayons.map((r) => `
      <div class="bq-cat-head">${esc(r.label)}</div>
      <div class="bq-grid">${r.items.map((p) => `
        <button class="bq-card ${stockOf(p) === 0 ? 'is-out' : ''}" data-bq-item="${p.id}" style="--i:${i++}">
          <span class="bq-card-art">${ART[p.art] || ''}</span>
          <span class="bq-card-name">${esc(p.name)}</span>
          <span class="bq-card-price">${fmtMAD(p.price)}</span>
          ${cardFlag(p)}
        </button>`).join('')}
      </div>`).join('');
    $('#bq-gridwrap', root).onclick = (e) => {
      const b = e.target.closest('[data-bq-item]');
      if (b) openSheet(b.dataset.bqItem, state.exchange ? { exchange: true } : null);
    };
  }

  function renderExchNote() {
    const slot = $('#bq-exch-slot', root);
    if (!state.exchange) { slot.innerHTML = ''; return; }
    const sale = findSale(state.exchange.saleId);
    const ln = sale.lines[state.exchange.idx];
    slot.innerHTML = `
      <div class="bq-exch-note">
        <i data-lucide="arrow-left-right"></i>
        <span class="l">Échange <b>${sale.id}</b> — retour <b>${esc(P[ln.pid].name)} · ${esc(ln.size)}</b> (${fmtMAD(ln.unit)}).
        Touchez l'article de remplacement dans la grille.</span>
        <button class="bq-exch-cancel" id="bq-exch-cancel">Annuler l'échange</button>
      </div>`;
    $('#bq-exch-cancel', slot).onclick = () => {
      state.exchange = null;
      renderExchNote();
      toast('Échange annulé — rien n\'a bougé');
      icons();
    };
    icons();
  }

  /* ═══════════════════════ TICKET ═══════════════════════ */
  function clientRow(t) {
    if (!t.client) {
      return `<button class="bq-tk-row" id="bq-tk-client"><i data-lucide="user-plus"></i>
        <span class="l"><b>Attacher une cliente</b><span>Téléphone d'abord — points et taille suivent</span></span>
        <span class="edit">Chercher</span></button>`;
    }
    if (t.client === 'passage') {
      return `<button class="bq-tk-row is-set" id="bq-tk-client"><i data-lucide="user"></i>
        <span class="l"><b>Cliente de passage</b><span>Sans fiche — retrouvable par n° de ticket</span></span>
        <span class="edit">Changer</span></button>`;
    }
    const c = CL[t.client];
    return `<button class="bq-tk-row is-set" id="bq-tk-client"><i data-lucide="user-check"></i>
      <span class="l"><b>${esc(c.name)}</b><span>${esc(c.phone)} · ${c.points} pts · taille ${esc(c.taille)}</span></span>
      ${c.vip ? '<span class="bq-vip-chip">VIP</span>' : ''}
      <span class="edit">Changer</span></button>`;
  }

  function renderTicket() {
    const t = state.ticket;
    const { remise, total } = ticketTotals(t);
    const count = ticketCount(t);
    const el = $('#bq-ticket', root);
    el.innerHTML = `
      <div class="bq-tk-head">
        <div><span class="bq-tk-title">Ticket</span> <span class="bq-tk-num">· ${t.num} · par Salma</span></div>
        ${t.lines.length ? '<button class="bq-tk-reset" id="bq-tk-reset">Vider</button>' : ''}
      </div>
      <div class="bq-tk-meta">${clientRow(t)}</div>
      <div class="bq-tk-lines" id="bq-tk-lines">
        ${t.lines.length ? t.lines.map((ln, i) => lineRow(ln, i)).join('') : `
          <div class="bq-tk-empty">
            <i data-lucide="shopping-bag"></i>
            <div>Le ticket est vide.<br>Touchez un article dans la grille, ou scannez son code-barres.</div>
          </div>`}
      </div>
      <div class="bq-tk-foot">
        <div class="bq-tk-tot">
          <span class="pcs"><i data-lucide="tag"></i> ${count} article${count > 1 ? 's' : ''}</span>
          ${remise ? `<span class="rem">Remise · −${fmtMAD(remise)}</span>` : ''}
        </div>
        <div class="bq-tk-total"><span class="lbl">Total</span><span class="val">${fmtMAD(total)}</span></div>
        <button class="bq-validate" id="bq-validate" ${t.lines.length ? '' : 'disabled'}>
          <i data-lucide="banknote"></i> Encaisser · ${fmtMAD(total)}
        </button>
      </div>`;
    const reset = $('#bq-tk-reset', el);
    if (reset) reset.onclick = () => {
      t.lines.forEach((ln) => stockAdd(ln.pid, ln.size, ln.qty));
      freshTicket();
      state.ticket.client = t.client;     /* la cliente reste au comptoir */
      renderTicket(); renderGrid(); renderBadges(); icons();
      toast('Ticket vidé — articles remis en stock');
    };
    $('#bq-tk-client', el).onclick = openClientModal;
    $('#bq-validate', el).onclick = checkout;
    $('#bq-tk-lines', el).onclick = (e) => {
      const minus = e.target.closest('[data-bq-minus]');
      const plus = e.target.closest('[data-bq-plus]');
      const idx = minus ? +minus.dataset.bqMinus : plus ? +plus.dataset.bqPlus : -1;
      if (idx < 0) return;
      const ln = t.lines[idx];
      if (plus) {
        if ((P[ln.pid].sizes[ln.size] || 0) <= 0) {
          toast(`${P[ln.pid].name} · ${ln.size} — plus de stock, dernière pièce déjà sur le ticket`);
          return;
        }
        stockAdd(ln.pid, ln.size, -1);
        ln.qty++;
      } else {
        stockAdd(ln.pid, ln.size, 1);
        ln.qty--;
        if (ln.qty <= 0) t.lines.splice(idx, 1);
      }
      renderTicket(); renderGrid(); renderBadges(); icons();
    };
    icons();
  }

  function lineRow(ln, i) {
    const p = P[ln.pid];
    const u = lineUnit(ln);
    return `<div class="bq-line">
      <span class="bq-line-art">${ART[p.art] || ''}</span>
      <span class="bq-line-mid">
        <span class="bq-line-name">${esc(p.name)}</span>
        <span class="bq-line-sub">
          <i class="dot" style="background:${COLOR[ln.color] ? COLOR[ln.color].hex : '#ccc'}"></i>
          <span class="sz">${esc(ln.size)}</span> ${esc(COLOR[ln.color] ? COLOR[ln.color].label : ln.color)}
          ${ln.remise ? `<span class="bq-line-rem">−${ln.remise} %</span>` : ''}
        </span>
      </span>
      <span class="bq-line-right">
        <span class="bq-line-price">${ln.remise ? `<span class="was">${fmtMAD(p.price * ln.qty)}</span>` : ''}${fmtMAD(u * ln.qty)}</span>
        <span class="bq-line-qty">
          <button data-bq-minus="${i}" aria-label="Retirer">−</button><b>${ln.qty}</b><button data-bq-plus="${i}" aria-label="Ajouter">+</button>
        </span>
      </span>
    </div>`;
  }

  /* central add — stock-aware, merges identical lines */
  function addToTicket(pid, cfg, opts) {
    const p = P[pid];
    if ((p.sizes[cfg.size] || 0) < cfg.qty) {
      toast(`${p.name} · ${cfg.size} — stock insuffisant`);
      return false;
    }
    stockAdd(pid, cfg.size, -cfg.qty);
    const same = state.ticket.lines.find((l) => l.pid === pid && l.size === cfg.size && l.color === cfg.color && l.remise === cfg.remise);
    if (same) same.qty += cfg.qty;
    else state.ticket.lines.push({ pid, size: cfg.size, color: cfg.color, qty: cfg.qty, remise: cfg.remise });
    renderTicket(); renderGrid(); renderBadges(); icons();
    if (!opts || !opts.quiet) toast(`${p.name} · ${cfg.size} — sur le ticket`);
    return true;
  }

  /* ═══════════════════════ VARIANT SHEET ═══════════════════════ */
  const sheet = { pid: null, size: null, color: null, qty: 1, remise: 0, exchange: false };

  function defaultSize(p) {
    const c = ticketClient();
    if (!sheet.exchange && c && p.kind === 'taille' && (p.sizes[c.taille] || 0) > 0) return c.taille;
    return firstFree(p) || sizesOf(p)[0];
  }

  function openSheet(pid, opts) {
    const p = P[pid];
    Object.assign(sheet, {
      pid,
      size: null, color: p.colors[0], qty: 1, remise: 0,
      exchange: !!(opts && opts.exchange),
    });
    sheet.size = defaultSize(p);
    renderSheet();
    openVeil('#bq-sheet-veil');
    icons();
    lens();
  }

  function renderSheet() {
    const p = P[sheet.pid];
    const c = ticketClient();
    const unit = Math.round(p.price * (100 - sheet.remise) / 100);
    const canAdd = (p.sizes[sheet.size] || 0) > 0;
    const el = $('#bq-sheetm', root);
    el.innerHTML = `
      <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bq-sheet-head">
        <span class="bq-sheet-art">${ART[p.art] || ''}</span>
        <span class="bq-sheet-title"><h3>${esc(p.name)}</h3><span class="sub">${esc(RAYONS.find((r) => r.id === p.rayon).label)}${p.flag ? ` · ${esc(p.flag)}` : ''} · EAN ${p.ean}</span></span>
        <span class="bq-sheet-price">
          <span class="val" id="bq-sheet-total">${fmtMAD(unit * sheet.qty)}</span>
          <span class="per ${sheet.remise ? 'rem' : ''}" id="bq-sheet-per">${sheet.remise ? `−${sheet.remise} % · accord gérante` : `${unit} MAD × ${sheet.qty}`}</span>
        </span>
      </div>

      <div class="bq-f">
        <div class="bq-f-lbl">${sizeWord(p)} <span class="opt">· stock par taille en direct</span></div>
        <div class="bq-seg" data-lens-demo id="bq-size-seg">
          ${sizesOf(p).map((s) => {
            const st = p.sizes[s];
            const usual = !sheet.exchange && c && p.kind === 'taille' && s === c.taille;
            return `<button class="bq-seg-it ${s === sheet.size ? 'on' : ''}" data-lens-item data-bq-size="${esc(s)}" ${st === 0 ? 'disabled' : ''}>
              ${usual ? '<span class="bq-seg-usual">habituelle</span>' : ''}${esc(s)}<small>${st === 0 ? 'épuisé' : `${st} en stock`}</small></button>`;
          }).join('')}
        </div>
      </div>

      <div class="bq-f">
        <div class="bq-f-lbl">Couleur</div>
        <div class="bq-colors" id="bq-colors">
          ${p.colors.map((cid) => `<button class="bq-color ${cid === sheet.color ? 'on' : ''}" data-bq-color="${cid}" data-c="${cid}" style="background:${COLOR[cid].hex}" title="${esc(COLOR[cid].label)}" aria-label="${esc(COLOR[cid].label)}"></button>`).join('')}
        </div>
      </div>

      ${sheet.exchange ? '' : `
      <div class="bq-row-2">
        <div class="bq-f">
          <div class="bq-f-lbl">Quantité</div>
          <div class="bq-stepper">
            <button id="bq-qty-minus" aria-label="Moins">−</button>
            <b id="bq-qty-val">${sheet.qty}</b>
            <button id="bq-qty-plus" aria-label="Plus">+</button>
          </div>
        </div>
        <div class="bq-f">
          <div class="bq-f-lbl">Remise <span class="opt">· accord gérante</span></div>
          <div class="bq-chips" id="bq-remise">
            ${[0, 5, 10, 15, 20].map((r) => `<button class="bq-chip ${sheet.remise === r ? 'on' : ''}" data-bq-rem="${r}">${r === 0 ? 'Sans' : `−${r} %`}${r > 0 && !state.ticket.remiseAuth ? ' <i data-lucide="lock"></i>' : ''}</button>`).join('')}
          </div>
        </div>
      </div>`}

      <div class="bq-sheet-foot">
        <button class="bq-btn secondary" data-bq-close>Annuler</button>
        ${sheet.exchange
          ? `<button class="bq-btn primary" id="bq-sheet-add" ${canAdd ? '' : 'disabled'}><i data-lucide="arrow-left-right"></i>Choisir cet article · ${fmtMAD(p.price)}</button>`
          : `<button class="bq-btn primary" id="bq-sheet-add" ${canAdd ? '' : 'disabled'}><i data-lucide="plus"></i>Ajouter au ticket · <span id="bq-sheet-cta">${fmtMAD(unit * sheet.qty)}</span></button>`}
      </div>`;

    const refreshPrice = () => {
      const u = Math.round(p.price * (100 - sheet.remise) / 100);
      $('#bq-sheet-total', el).textContent = fmtMAD(u * sheet.qty);
      $('#bq-sheet-per', el).textContent = sheet.remise ? `−${sheet.remise} % · accord gérante` : `${u} MAD × ${sheet.qty}`;
      $('#bq-sheet-per', el).classList.toggle('rem', !!sheet.remise);
      const cta = $('#bq-sheet-cta', el);
      if (cta) cta.textContent = fmtMAD(u * sheet.qty);
      const qv = $('#bq-qty-val', el);
      if (qv) qv.textContent = sheet.qty;
    };

    $('#bq-size-seg', el).onclick = (e) => {
      const b = e.target.closest('[data-bq-size]');
      if (!b || b.disabled) return;
      sheet.size = b.dataset.bqSize;
      if (sheet.qty > (p.sizes[sheet.size] || 0)) sheet.qty = Math.max(1, p.sizes[sheet.size]);
      $$('[data-bq-size]', el).forEach((x) => x.classList.toggle('on', x === b));
      refreshPrice();
    };
    $('#bq-colors', el).onclick = (e) => {
      const b = e.target.closest('[data-bq-color]');
      if (!b) return;
      sheet.color = b.dataset.bqColor;
      $$('[data-bq-color]', el).forEach((x) => x.classList.toggle('on', x === b));
    };
    const qMinus = $('#bq-qty-minus', el);
    if (qMinus) qMinus.onclick = () => { if (sheet.qty > 1) { sheet.qty--; refreshPrice(); } };
    const qPlus = $('#bq-qty-plus', el);
    if (qPlus) qPlus.onclick = () => {
      if (sheet.qty >= (p.sizes[sheet.size] || 0)) { toast(`${p.name} · ${sheet.size} — ${p.sizes[sheet.size]} en stock, pas plus`); return; }
      sheet.qty++; refreshPrice();
    };
    const remRow = $('#bq-remise', el);
    if (remRow) remRow.onclick = (e) => {
      const b = e.target.closest('[data-bq-rem]');
      if (!b) return;
      const r = +b.dataset.bqRem;
      if (r > 0 && !state.ticket.remiseAuth) { openApprove(r, () => { sheet.remise = r; renderSheet(); icons(); lens(); }); return; }
      sheet.remise = r;
      $$('[data-bq-rem]', el).forEach((x) => x.classList.toggle('on', +x.dataset.bqRem === r));
      refreshPrice();
    };
    $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-sheet-veil'); });
    const add = $('#bq-sheet-add', el);
    if (add) add.onclick = () => {
      if (sheet.exchange) {
        closeVeil('#bq-sheet-veil');
        openExchSummary(sheet.pid, sheet.size, sheet.color);
        return;
      }
      if (addToTicket(sheet.pid, { size: sheet.size, color: sheet.color, qty: sheet.qty, remise: sheet.remise })) {
        closeVeil('#bq-sheet-veil');
      }
    };
    icons();
  }

  /* ---------- approbation gérante (remise) ---------- */
  function openApprove(pct, onOk) {
    const el = $('#bq-approvem', root);
    el.innerHTML = `
      <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
      <h3 class="modal-title">Remise −${pct} %</h3>
      <p class="modal-subtle">Une remise s'applique avec l'accord de la gérante — qui valide ?</p>
      <button class="bq-staff-row" id="bq-app-ok">
        <span class="bq-staff-ava">${initials(STAFF.gerante.name)}</span>
        <span class="l"><b>${esc(STAFF.gerante.name)}</b><span>${esc(STAFF.gerante.role)} — peut approuver</span></span>
        <span class="ok">Approuver</span>
      </button>
      <button class="bq-staff-row is-no" id="bq-app-no">
        <span class="bq-staff-ava">${initials(STAFF.conseil.name)}</span>
        <span class="l"><b>${esc(STAFF.conseil.name)}</b><span>${esc(STAFF.conseil.role)}</span></span>
        <span class="ok">Non habilitée</span>
      </button>
      <div class="bq-foot-note">L'accord vaut pour tout le ticket ${state.ticket.num} — tracé dans le journal.</div>`;
    openVeil('#bq-approve-veil');
    icons();
    $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-approve-veil'); });
    $('#bq-app-ok', el).onclick = () => {
      state.ticket.remiseAuth = true;
      closeVeil('#bq-approve-veil');
      toast(`Remise −${pct} % — accord ${STAFF.gerante.name}`);
      onOk();
    };
    $('#bq-app-no', el).onclick = () => toast(`${STAFF.conseil.name} n'est pas habilitée — seule la gérante approuve une remise`);
  }

  /* ═══════════════════════ CLIENTE — phone-first (modal du ticket) ═══════ */
  function clienteHits(q) {
    const digits = (q || '').replace(/\D/g, '');
    const ql = (q || '').toLowerCase();
    return !q ? CLIENTES : CLIENTES.filter((c) =>
      (digits && c.phone.replace(/\D/g, '').includes(digits)) ||
      (!digits && c.name.toLowerCase().includes(ql)));
  }
  function clAvoirOf(c) {
    return activeAvoirs().find((a) => a.holderId === c.id) || null;
  }

  function openClientModal() {
    const el = $('#bq-clientm', root);
    let mode = 'search';
    const render = (q) => {
      const hits = clienteHits(q);
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">Cliente</h3>
        <p class="modal-subtle">En boutique on cherche par téléphone — la fiche porte les points et la taille.</p>
        <div class="bq-phone-in"><i data-lucide="phone"></i>
          <input id="bq-cl-q" inputmode="tel" placeholder="06… ou nom de la cliente" value="${esc(q || '')}" autocomplete="off" />
        </div>
        ${mode === 'search' ? `
          <div class="bq-cl-results">
            ${hits.map((c) => {
              const av = clAvoirOf(c);
              return `<button class="bq-cl-row" data-bq-cl="${c.id}">
                <span class="bq-cl-ava">${esc(initials(c.name))}</span>
                <span class="bq-cl-mid">
                  <span class="bq-cl-name">${esc(c.name)} ${c.vip ? '<span class="bq-vip-chip">VIP</span>' : ''}</span>
                  <span class="bq-cl-sub">${esc(c.phone)} · taille ${esc(c.taille)}</span>
                </span>
                <span class="bq-cl-right"><b>${c.points} pts</b>${av ? `<span class="av">avoir ${fmtMAD(av.balance)}</span>` : `${c.achats} achats`}</span>
              </button>`;
            }).join('') || `<div class="bq-empty">Aucune fiche pour « ${esc(q)} »</div>`}
          </div>
          <button class="bq-cl-new" id="bq-cl-new"><i data-lucide="user-plus"></i>Nouvelle cliente${q && !hits.length ? ` · « ${esc(q)} »` : ''}</button>
          <div class="bq-sheet-foot" style="margin-top:10px;">
            <button class="bq-btn ghost" id="bq-cl-guest">Cliente de passage — sans fiche</button>
          </div>` : `
          <div class="bq-cl-form">
            <input class="bq-in" id="bq-cl-name" placeholder="Nom et prénom" value="${esc(/^[\d\s.+-]*$/.test(q || '') ? '' : (q || ''))}" />
            <input class="bq-in" id="bq-cl-tel" inputmode="tel" placeholder="Téléphone (optionnel)" value="${esc(/^[\d\s.+-]+$/.test(q || '') ? q : '')}" />
            <div class="bq-sheet-foot" style="margin-top:4px;">
              <button class="bq-btn secondary" id="bq-cl-back">Retour</button>
              <button class="bq-btn primary" id="bq-cl-create"><i data-lucide="check"></i>Créer la fiche</button>
            </div>
          </div>`}`;
      $('#bq-cl-q', el).oninput = (e) => { render(e.target.value); icons(); const i = $('#bq-cl-q', el); i.focus(); moveCaretEnd(i); };
      $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-client-veil'); });
      $$('[data-bq-cl]', el).forEach((b) => {
        b.onclick = () => {
          const c = CL[b.dataset.bqCl];
          state.ticket.client = c.id;
          closeVeil('#bq-client-veil');
          toast(`${c.name} — taille ${c.taille}, ${c.points} pts${clAvoirOf(c) ? ', un avoir actif' : ''}`);
          renderTicket(); icons();
        };
      });
      const newBtn = $('#bq-cl-new', el);
      if (newBtn) newBtn.onclick = () => { mode = 'create'; render(q); icons(); };
      const guest = $('#bq-cl-guest', el);
      if (guest) guest.onclick = () => {
        state.ticket.client = 'passage';
        closeVeil('#bq-client-veil');
        renderTicket(); icons();
      };
      const back = $('#bq-cl-back', el);
      if (back) back.onclick = () => { mode = 'search'; render(q); icons(); };
      const create = $('#bq-cl-create', el);
      if (create) create.onclick = () => {
        const name = $('#bq-cl-name', el).value.trim();
        const tel = $('#bq-cl-tel', el).value.trim();
        if (!name) { toast('Le nom est requis pour la fiche'); return; }
        const id = 'cx' + Date.now().toString(36);
        const c = { id, name, phone: tel, points: 0, taille: 'M', achats: 0, spent: 0, prefs: [], history: [] };
        CLIENTES.unshift(c); CL[id] = c;
        state.ticket.client = id;
        closeVeil('#bq-client-veil');
        queueIfOffline('Fiche cliente');
        toast(`Fiche créée — ${name}`);
        renderTicket(); renderBadges(); icons();
      };
    };
    render('');
    openVeil('#bq-client-veil');
    icons();
    setTimeout(() => { const i = $('#bq-cl-q', el); if (i) i.focus(); }, 60);
  }
  function moveCaretEnd(input) { const v = input.value; input.value = ''; input.value = v; }

  /* ═══════════════════════ VUE CLIENTES ═══════════════════════ */
  function renderClientes() {
    const panel = $('[data-bq-panel="clientes"]', root);
    const q = state.clQuery;
    const hits = clienteHits(q);
    panel.innerHTML = `
      <div class="bq-clients">
        <header class="bq-head">
          <div><h1>Clientes</h1><div class="bq-head-sub">Le téléphone d'abord — la fiche suit la cliente, pas le ticket</div></div>
          <div class="bq-search"><i data-lucide="search"></i>
            <input id="bq-clv-q" inputmode="tel" placeholder="06… ou nom" value="${esc(q)}" /></div>
        </header>
        <div class="bq-cl-scroll">
          <div class="bq-cl-grid">
            ${hits.map((c) => {
              const av = clAvoirOf(c);
              return `<button class="bq-clcard" data-bq-fiche="${c.id}">
                <span class="bq-clcard-top">
                  <span class="bq-cl-ava">${esc(initials(c.name))}</span>
                  <span class="l">
                    <span class="bq-cl-name">${esc(c.name)} ${c.vip ? '<span class="bq-vip-chip">VIP</span>' : ''}</span>
                    <span class="bq-cl-sub">${esc(c.phone)}</span>
                  </span>
                </span>
                <span class="bq-clcard-stats">
                  <span class="bq-mini ok"><i data-lucide="star"></i>${c.points} pts</span>
                  <span class="bq-mini"><i data-lucide="ruler"></i>taille ${esc(c.taille)}</span>
                  <span class="bq-mini"><i data-lucide="receipt"></i>${c.achats} achats</span>
                  ${av ? `<span class="bq-mini warn"><i data-lucide="ticket"></i>avoir ${fmtMAD(av.balance)}</span>` : ''}
                </span>
              </button>`;
            }).join('') || `<div class="bq-empty" style="grid-column:1/-1;">Aucune fiche pour « ${esc(q)} »</div>`}
          </div>
        </div>
      </div>`;
    $('#bq-clv-q', panel).oninput = (e) => {
      state.clQuery = e.target.value;
      renderClientes(); icons();
      const i = $('#bq-clv-q', panel); i.focus(); moveCaretEnd(i);
    };
    panel.onclick = (e) => {
      const b = e.target.closest('[data-bq-fiche]');
      if (b) openFiche(b.dataset.bqFiche);
    };
    icons();
  }

  function openFiche(cid) {
    const c = CL[cid];
    if (!c) return;
    const el = $('#bq-fichem', root);
    const av = clAvoirOf(c);
    const todays = SALES.filter((s) => s.clientId === cid).map((s) => ({
      when: `auj. ${fmtHM(s.at)}`,
      what: s.lines.map((l) => `${P[l.pid].name} · ${l.size}`).join(' + '),
      amt: s.total,
    }));
    const hist = todays.concat(c.history || []);
    const spent = (c.spent || 0) + todays.reduce((s, h) => s + h.amt, 0);
    el.innerHTML = `
      <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bq-fiche-head">
        <span class="bq-fiche-ava">${esc(initials(c.name))}</span>
        <div>
          <h3>${esc(c.name)} ${c.vip ? '<span class="bq-vip-chip">VIP</span>' : ''}</h3>
          <div class="tel">${esc(c.phone || 'sans téléphone')}</div>
        </div>
      </div>
      <div class="bq-fstats">
        <div class="bq-fstat"><b>${c.points}</b><span>points fidélité</span></div>
        <div class="bq-fstat"><b>${esc(c.taille)}</b><span>taille habituelle</span></div>
        <div class="bq-fstat"><b>${fmtMAD(spent)}</b><span>dépensé</span></div>
      </div>
      ${(c.prefs || []).length ? `<div class="bq-fnotes">${c.prefs.map((p) => `<div class="bq-fnote"><i data-lucide="heart"></i>${esc(p)}</div>`).join('')}</div>` : ''}
      ${av ? `<button class="bq-favoir" id="bq-fiche-av"><i data-lucide="ticket"></i>Avoir actif <b>${av.code}</b> · ${fmtMAD(av.balance)} — utilisable en caisse<span class="see">Voir</span></button>` : ''}
      <div class="bq-f-lbl" style="margin-bottom:6px;">Historique</div>
      <div class="bq-fhist">
        ${hist.length ? hist.map((h) => `<div class="bq-fhist-row"><span class="when">${esc(h.when)}</span><span class="what">${esc(h.what)}</span><span class="amt">${fmtMAD(h.amt)}</span></div>`).join('') : '<div class="bq-empty">Aucun achat enregistré.</div>'}
      </div>
      <div class="bq-sheet-foot">
        <button class="bq-btn secondary" data-bq-close>Fermer</button>
        <button class="bq-btn primary" id="bq-fiche-sell"><i data-lucide="shopping-bag"></i>Nouvelle vente pour elle</button>
      </div>`;
    openVeil('#bq-fiche-veil');
    icons();
    $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-fiche-veil'); });
    const avB = $('#bq-fiche-av', el);
    if (avB) avB.onclick = () => { closeVeil('#bq-fiche-veil'); openVoucher(av, { mode: 'view' }); };
    $('#bq-fiche-sell', el).onclick = () => {
      state.ticket.client = c.id;
      closeVeil('#bq-fiche-veil');
      switchView('vente');
      toast(`${firstName(c.name)} au comptoir — taille ${c.taille} pré-sélectionnée`);
    };
  }

  /* ═══════════════════════ SCAN ═══════════════════════ */
  const SCAN_CYCLE = ['foulard_soie', 'babouche_homme', 'caftan_ete', 'pochette_sequins', 'broche_perles', 'cabas_berbere', 'chale_laine', 'babouche_enfant'];

  function renderScan() {
    const panel = $('[data-bq-panel="scan"]', root);
    const last = state.scanLog.find((l) => l.ok);
    panel.innerHTML = `
      <div class="bq-scan">
        <div class="bq-scan-inner">
          <header class="bq-head" style="padding:22px 0 0;">
            <div><h1>Scan douchette</h1><div class="bq-head-sub">Le champ écoute la douchette en continu — Entrée valide, l'article file sur le ticket</div></div>
          </header>
          <div class="bq-ean-in"><i data-lucide="scan-line"></i>
            <input id="bq-ean" inputmode="numeric" placeholder="EAN-13 — ex. ${P.foulard_soie.ean}" autocomplete="off" />
          </div>
          <div class="bq-scan-or">ou</div>
          <button class="bq-scan-mock" id="bq-scan-mock"><i data-lucide="scan-line"></i>Scanner un article (douchette démo)</button>
          <div class="bq-scan-stage" id="bq-scan-stage"><span id="bq-scan-stage-ean"></span><div class="bq-scan-laser"></div></div>
          ${last ? `
          <div class="bq-scan-last">
            <span class="bq-line-art">${ART[P[last.pid].art] || ''}</span>
            <span class="l"><b>${esc(P[last.pid].name)} · ${esc(last.size)}</b><span>EAN ${last.ean} · ${fmtHM(last.at)}</span></span>
            <span class="amt">${fmtMAD(P[last.pid].price)}</span>
          </div>` : ''}
          ${state.scanLog.length ? `
          <div class="bq-scan-log">
            ${state.scanLog.slice(0, 6).map((l) => `
              <div class="bq-scan-log-row ${l.ok ? '' : 'is-err'}">
                <i data-lucide="${l.ok ? 'check-circle-2' : 'x'}"></i>
                <span class="when">${fmtHM(l.at)}</span>
                <span>${esc(l.label)}</span>
                <span class="ean">${esc(l.ean)}</span>
              </div>`).join('')}
          </div>` : `<div class="bq-empty">Aucun scan pour l'instant — la douchette USB tape ici toute seule.</div>`}
          ${ticketCount(state.ticket) ? `
          <div class="bq-sheet-foot">
            <button class="bq-btn secondary" id="bq-scan-goticket" style="flex:1;"><i data-lucide="shopping-bag"></i>Voir le ticket · ${ticketCount(state.ticket)} article${ticketCount(state.ticket) > 1 ? 's' : ''}</button>
          </div>` : ''}
        </div>
      </div>`;
    const input = $('#bq-ean', panel);
    input.onkeydown = (e) => { if (e.key === 'Enter') commitEan(input.value); };
    input.oninput = () => { if (input.value.replace(/\D/g, '').length >= 13) commitEan(input.value); };
    input.onblur = () => {
      setTimeout(() => {
        if (state.view !== 'scan') return;
        if ($$('.modal-veil.is-open', root).length) return;
        const i = $('#bq-ean', root);
        if (i) i.focus();
      }, 120);
    };
    $('#bq-scan-mock', panel).onclick = mockScan;
    const goT = $('#bq-scan-goticket', panel);
    if (goT) goT.onclick = () => switchView('vente');
    icons();
    setTimeout(() => { const i = $('#bq-ean', panel); if (i) i.focus(); }, 60);
  }

  function commitEan(raw) {
    const ean = String(raw || '').replace(/\D/g, '');
    if (!ean) return;
    const pid = BY_EAN[ean];
    if (!pid) {
      state.scanLog.unshift({ at: new Date(), ok: false, label: 'EAN inconnu — article non référencé', ean, pid: null, size: '' });
      toast(`EAN ${ean} inconnu — article non référencé`);
      renderScan(); renderBadges();
      return;
    }
    const p = P[pid];
    const c = ticketClient();
    let size = (c && p.kind === 'taille' && (p.sizes[c.taille] || 0) > 0) ? c.taille : firstFree(p);
    if (!size) {
      state.scanLog.unshift({ at: new Date(), ok: false, label: `${p.name} — épuisé, rien à vendre`, ean, pid: null, size: '' });
      toast(`${p.name} — épuisé dans toutes les tailles`);
      renderScan(); renderBadges();
      return;
    }
    addToTicket(pid, { size, color: p.colors[0], qty: 1, remise: 0 }, { quiet: true });
    state.scanLog.unshift({ at: new Date(), ok: true, label: `${p.name} · ${size} — ajouté au ticket`, ean, pid, size });
    toast(`Bip — ${p.name} · ${size} sur le ticket (${fmtMAD(p.price)})`);
    renderScan(); renderBadges();
  }

  function mockScan() {
    if (state.scanBusy) return;
    state.scanBusy = true;
    const pid = SCAN_CYCLE[state.scanIdx % SCAN_CYCLE.length];
    state.scanIdx++;
    const stage = $('#bq-scan-stage', root);
    const lbl = $('#bq-scan-stage-ean', root);
    if (stage) { stage.classList.add('is-on'); if (lbl) lbl.textContent = P[pid].ean; }
    setTimeout(() => {
      state.scanBusy = false;
      commitEan(P[pid].ean);
    }, 620);
  }

  /* ═══════════════════════ ÉCHANGES & AVOIRS (signature) ═══════════════════ */
  function saleMatches(s, q) {
    if (!q) return true;
    const ql = q.toLowerCase();
    const digits = q.replace(/\D/g, '');
    const c = saleClient(s);
    return s.id.toLowerCase().includes(ql) ||
      (c && c.name.toLowerCase().includes(ql)) ||
      (c && digits.length >= 2 && c.phone.replace(/\D/g, '').includes(digits));
  }

  function renderEchanges() {
    const panel = $('[data-bq-panel="echanges"]', root);
    const q = state.retQuery;
    const hits = SALES.filter((s) => saleMatches(s, q));
    const ret = state.ret;
    panel.innerHTML = `
      <div class="bq-ret">
        <header class="bq-head">
          <div><h1>Échanges &amp; avoirs</h1><div class="bq-head-sub">Retour sous 7 jours avec ticket — échange ou avoir, jamais de remboursement espèces</div></div>
          <div class="bq-search"><i data-lucide="search"></i>
            <input id="bq-ret-q" placeholder="N° de ticket ou téléphone…" value="${esc(q)}" /></div>
        </header>
        <div class="bq-ret-scroll"><div class="bq-ret-inner">
          ${activeAvoirs().length ? `
            <div class="bq-ret-bar" style="margin-top:14px;">
              <div class="bq-ret-bar-lbl">Avoirs actifs · ${activeAvoirs().length}</div>
              ${activeAvoirs().map((a) => `
                <button class="bq-favoir" data-bq-av="${a.code}" style="margin-bottom:6px;">
                  <i data-lucide="ticket"></i><b>${a.code}</b> · ${fmtMAD(a.balance)} — ${esc(a.holderName)}<span class="see">Voir</span>
                </button>`).join('')}
            </div>` : ''}
          ${hits.map((s) => saleCard(s, ret)).join('') || `<div class="bq-empty">Rien pour « ${esc(q)} » — vérifiez le n° de ticket ou le téléphone.</div>`}
        </div></div>
      </div>`;
    $('#bq-ret-q', panel).oninput = (e) => {
      state.retQuery = e.target.value;
      renderEchanges(); icons();
      const i = $('#bq-ret-q', panel); i.focus(); moveCaretEnd(i);
    };
    panel.onclick = (e) => {
      const avB = e.target.closest('[data-bq-av]');
      if (avB) { openVoucher(AVOIRS.find((a) => a.code === avB.dataset.bqAv), { mode: 'view' }); return; }
      const lnB = e.target.closest('[data-bq-pick]');
      if (lnB) { togglePick(lnB.dataset.bqPick); return; }
      const lockB = e.target.closest('[data-bq-locked]');
      if (lockB) { toast('Pièce déjà retournée — rien à reprendre dessus'); return; }
      const motif = e.target.closest('[data-bq-motif]');
      if (motif && state.ret) { state.ret.motif = motif.dataset.bqMotif; renderEchanges(); icons(); return; }
      const exch = e.target.closest('[data-bq-do-exch]');
      if (exch) { doExchange(); return; }
      const avoir = e.target.closest('[data-bq-do-avoir]');
      if (avoir) { doAvoir(); return; }
    };
    icons();
  }

  const MOTIFS = ['Taille', 'Couleur', 'Défaut', 'Changement d\'avis'];

  function saleCard(s, ret) {
    const c = saleClient(s);
    const sel = ret && ret.saleId === s.id ? ret.picks : new Set();
    const selVal = s.lines.reduce((t, l, i) => t + (sel.has(i) ? l.unit * l.qty : 0), 0);
    const hasRet = s.lines.some((l) => l.returned);
    return `<div class="bq-sale">
      <div class="bq-sale-top">
        <span class="bq-sale-num">${s.id}</span>
        <span class="bq-sale-when">${fmtHM(s.at)} · par ${esc(s.by)}</span>
        <span class="bq-pill ${s.kind === 'echange' ? 'warn' : 'ok'}">${s.kind === 'echange' ? 'échange' : esc(s.methods)}</span>
        ${hasRet ? '<span class="bq-pill warn">retour</span>' : ''}
        <span class="bq-sale-who"><i data-lucide="${c ? 'user' : 'users'}"></i>${c ? esc(c.name) : 'Cliente de passage'} · ${fmtMAD(s.total)}</span>
      </div>
      <div class="bq-sale-lines">
        ${s.lines.map((l, i) => {
          const p = P[l.pid];
          if (l.returned) {
            return `<button class="bq-sline is-locked" data-bq-locked="1">
              <span class="tick"></span>
              <span class="bq-line-art">${ART[p.art] || ''}</span>
              <span class="mid"><span class="bq-line-name">${esc(p.name)}</span>
                <span class="bq-line-sub"><span class="sz">${esc(l.size)}</span> ${esc(l.note || 'retournée')}</span></span>
              <span class="bq-pill warn">retournée</span>
            </button>`;
          }
          return `<button class="bq-sline ${sel.has(i) ? 'on' : ''}" data-bq-pick="${s.id}:${i}">
            <span class="tick"><i data-lucide="check"></i></span>
            <span class="bq-line-art">${ART[p.art] || ''}</span>
            <span class="mid"><span class="bq-line-name">${esc(p.name)}</span>
              <span class="bq-line-sub">
                <i class="dot" style="background:${COLOR[l.color] ? COLOR[l.color].hex : '#ccc'}"></i>
                <span class="sz">${esc(l.size)}</span> ${l.qty > 1 ? `× ${l.qty}` : ''} ${l.remise ? `· remise −${l.remise} %` : ''}
              </span></span>
            <span class="amt">${fmtMAD(l.unit * l.qty)}</span>
          </button>`;
        }).join('')}
      </div>
      ${sel.size ? `
      <div class="bq-ret-bar">
        <div class="bq-ret-bar-lbl">Motif du retour</div>
        <div class="bq-chips">
          ${MOTIFS.map((m) => `<button class="bq-chip ${ret.motif === m ? 'on' : ''}" data-bq-motif="${esc(m)}">${esc(m)}</button>`).join('')}
        </div>
        <div class="bq-ret-actions">
          <button class="bq-btn secondary" data-bq-do-exch><i data-lucide="arrow-left-right"></i>Échanger la pièce</button>
          <button class="bq-btn primary" data-bq-do-avoir><i data-lucide="ticket"></i>Émettre un avoir · ${fmtMAD(selVal)}</button>
        </div>
      </div>` : ''}
    </div>`;
  }

  function togglePick(key) {
    const [saleId, idxS] = key.split(':');
    const idx = +idxS;
    if (!state.ret || state.ret.saleId !== saleId) state.ret = { saleId, picks: new Set(), motif: 'Taille' };
    const picks = state.ret.picks;
    if (picks.has(idx)) picks.delete(idx); else picks.add(idx);
    if (!picks.size) state.ret = null;
    renderEchanges(); icons();
  }

  function doExchange() {
    const ret = state.ret;
    if (!ret) return;
    if (ret.picks.size !== 1) { toast('L\'échange se fait pièce par pièce — gardez une seule ligne cochée'); return; }
    const idx = ret.picks.values().next().value;
    const sale = findSale(ret.saleId);
    const ln = sale.lines[idx];
    if (ln.qty > 1) { toast('Ligne multiple — passez par un avoir, ou retournez pièce par pièce'); return; }
    state.exchange = { saleId: ret.saleId, idx };
    state.ret = null;
    switchView('vente');
    toast(`Échange ${sale.id} — choisissez l'article de remplacement dans la grille`);
  }

  function doAvoir() {
    const ret = state.ret;
    if (!ret) return;
    const sale = findSale(ret.saleId);
    const idxs = Array.from(ret.picks);
    const amount = idxs.reduce((t, i) => t + sale.lines[i].unit * sale.lines[i].qty, 0);
    if (!amount) return;
    restoreLines(sale, idxs, `avoir (${ret.motif.toLowerCase()})`);
    const c = saleClient(sale);
    const av = issueAvoir(amount, c, `${ret.motif} — retour ${sale.id}`, sale.id);
    state.ret = null;
    refreshOps();
    openVoucher(av, { mode: 'fresh' });
  }

  function restoreLines(sale, idxs, note) {
    idxs.forEach((i) => {
      const ln = sale.lines[i];
      ln.returned = true;
      ln.note = note;
      stockAdd(ln.pid, ln.size, ln.qty);
    });
  }

  function issueAvoir(amount, cliente, motif, fromSaleId) {
    const av = {
      code: `AV-${avSeq++}`,
      amount, balance: amount,
      holderId: cliente ? cliente.id : null,
      holderName: cliente ? cliente.name : 'Porteur du bon',
      motif, at: new Date(),
      until: new Date(Date.now() + 182 * 24 * 3600 * 1000),
      from: fromSaleId || null,
    };
    AVOIRS.unshift(av);
    queueIfOffline(`Avoir ${av.code}`);
    toast(`${av.code} émis — ${fmtMAD(amount)}, pièces remises en stock`);
    renderBadges();
    return av;
  }

  /* ---------- voucher print preview (modeled on the pressing tags) ------- */
  function voucherHTML(av) {
    return `<div class="bq-avoir">
      <div class="c b lg">MAISON MANSOUR</div>
      <div class="c mut">12 rue Aïn Harrouda, Maarif — Casablanca<br>05 22 25 XX XX · propulsé par Kiwi</div>
      <hr>
      <div class="c b">BON D'AVOIR</div>
      <div class="bq-avoir-amt">${fmtMAD(av.balance)}</div>
      ${av.balance !== av.amount ? `<div class="c mut">émis pour ${fmtMAD(av.amount)} — solde restant</div>` : ''}
      <hr>
      <div class="row"><span>Code</span><span class="b">${av.code}</span></div>
      <div class="row"><span>Cliente</span><span>${esc(av.holderName)}</span></div>
      <div class="row"><span>Motif</span><span>${esc(av.motif)}</span></div>
      ${av.from ? `<div class="row"><span>Vente d'origine</span><span>${esc(av.from)}</span></div>` : ''}
      <div class="row"><span>Émis le</span><span>${fmtDay(av.at)}</span></div>
      <div class="row b"><span>VALABLE JUSQU'AU</span><span>${fmtDay(av.until)}</span></div>
      <hr>
      <div class="c">${barcode(av.code + '-MM', 26)}</div>
      <div class="bq-avoir-code">${av.code} · MAISON MANSOUR</div>
      <div class="c mut" style="margin-top:6px;">Utilisable en caisse, en une ou plusieurs fois.<br>Ni repris, ni remboursé en espèces.</div>
    </div>`;
  }

  function openVoucher(av, ctx) {
    if (!av) return;
    const fresh = ctx && ctx.mode === 'fresh';
    const el = $('#bq-avoirmm', root);
    el.innerHTML = `
      <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
      <h3 class="modal-title">${fresh ? `Avoir émis — ${av.code}` : `Avoir ${av.code}`}</h3>
      <p class="modal-subtle">${esc(av.holderName)} · ${fmtMAD(av.balance)} ${av.balance > 0 ? 'disponibles' : '— consommé'}</p>
      ${voucherHTML(av)}
      <div class="bq-avoir-note"><i data-lucide="shield-check"></i>Le code-barres revient en caisse comme moyen de paiement — il se déduit tout seul à l'encaissement.</div>
      <div class="bq-sheet-foot">
        <button class="bq-btn secondary" id="bq-av-print"><i data-lucide="printer"></i>Imprimer l'avoir</button>
        <button class="bq-btn primary" data-bq-close><i data-lucide="check"></i>${fresh ? 'Terminer' : 'Fermer'}</button>
      </div>`;
    openVeil('#bq-avoir-veil');
    icons();
    $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-avoir-veil'); });
    $('#bq-av-print', el).onclick = () => toast(`${av.code} envoyé — imprimante 80 mm`);
  }

  /* ---------- exchange summary ---------- */
  function openExchSummary(newPid, newSize, newColor) {
    const ex = state.exchange;
    if (!ex) return;
    const sale = findSale(ex.saleId);
    const ln = sale.lines[ex.idx];
    const oldP = P[ln.pid];
    const newP = P[newPid];
    const diff = newP.price - ln.unit;
    const c = saleClient(sale);
    const el = $('#bq-exchm', root);
    el.innerHTML = `
      <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
      <h3 class="modal-title">Échange — ${sale.id}</h3>
      <p class="modal-subtle">${c ? esc(c.name) : 'Cliente de passage'} · la pièce rendue repart en stock</p>
      <div class="bq-exch-row is-ret">
        <span class="bq-line-art">${ART[oldP.art] || ''}</span>
        <span class="mid"><b>${esc(oldP.name)}</b><span>retour · ${esc(ln.size)} · ${esc(COLOR[ln.color] ? COLOR[ln.color].label : ln.color)}${ln.remise ? ` · payé avec −${ln.remise} %` : ''}</span></span>
        <span class="amt">−${fmtMAD(ln.unit)}</span>
      </div>
      <div class="bq-exch-row is-new">
        <span class="bq-line-art">${ART[newP.art] || ''}</span>
        <span class="mid"><b>${esc(newP.name)}</b><span>remplacement · ${esc(newSize)} · ${esc(COLOR[newColor] ? COLOR[newColor].label : newColor)}</span></span>
        <span class="amt">+${fmtMAD(newP.price)}</span>
      </div>
      <div class="bq-exch-diff ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'zero'}">
        <span>${diff > 0 ? 'Différence à encaisser' : diff < 0 ? 'Différence en faveur de la cliente — part en avoir' : 'Aucun écart — échange direct'}</span>
        <span class="amt">${diff === 0 ? '0 MAD' : fmtMAD(Math.abs(diff))}</span>
      </div>
      <div class="bq-sheet-foot">
        <button class="bq-btn secondary" data-bq-close>Retour</button>
        ${diff > 0
          ? `<button class="bq-btn primary" id="bq-exch-go"><i data-lucide="banknote"></i>Encaisser ${fmtMAD(diff)}</button>`
          : diff < 0
            ? `<button class="bq-btn primary" id="bq-exch-go"><i data-lucide="ticket"></i>Échanger + avoir ${fmtMAD(-diff)}</button>`
            : `<button class="bq-btn primary" id="bq-exch-go"><i data-lucide="check"></i>Confirmer l'échange</button>`}
      </div>`;
    openVeil('#bq-exch-veil');
    icons();
    $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-exch-veil'); });

    const apply = () => {
      stockAdd(ln.pid, ln.size, 1);
      stockAdd(newPid, newSize, -1);
      ln.returned = true;
      ln.note = `échangée → ${newP.name} · ${newSize}`;
      state.exchange = null;
      queueIfOffline(`Échange ${sale.id}`);
      renderExchNote(); renderGrid(); renderBadges();
    };

    $('#bq-exch-go', el).onclick = () => {
      closeVeil('#bq-exch-veil');
      if (diff > 0) {
        openPay({
          amount: diff,
          title: 'Différence échange',
          subtitle: `${sale.id} · ${esc(oldP.name)} → ${esc(newP.name)}`,
          doneLabel: 'Terminer',
          waName: c ? firstName(c.name) : null, waPhone: c ? c.phone : null,
          onPaid: (parts) => {
            apply();
            const rec = {
              id: `MM-${saleSeq++}`, at: new Date(), clientId: sale.clientId, by: 'Salma', kind: 'echange',
              methods: parts.map((x) => x.m).join(' + '),
              lines: [{ pid: newPid, size: newSize, color: newColor, qty: 1, remise: 0, unit: diff, returned: false, note: `différence échange ${sale.id}` }],
              total: diff,
            };
            SALES.unshift(rec);
            $('#bq-today', root).textContent = headSubVente();
            refreshOps();
            return { ref: rec.id, line: `Échange ${sale.id} réglé — différence ${fmtMAD(diff)}` };
          },
        });
      } else if (diff < 0) {
        apply();
        const av = issueAvoir(-diff, c, `Différence échange ${sale.id}`, sale.id);
        refreshOps();
        openVoucher(av, { mode: 'fresh' });
      } else {
        apply();
        refreshOps();
        toast(`Échange ${sale.id} — ${oldP.name} ${ln.size} contre ${newP.name} ${newSize}, khlass`);
      }
    };
  }

  /* ═══════════════════════ ENCAISSEMENT ═══════════════════════
     Réutilise le kit caisse : .modal-amount, .cash-grid, .reader-stage.
     L'avoir est un moyen de paiement à part entière — il se déduit. */
  function checkout() {
    const t = state.ticket;
    if (!t.lines.length) return;
    const { total } = ticketTotals(t);
    const c = ticketClient();
    openPay({
      amount: total,
      title: 'Encaissement',
      subtitle: `${t.num} · ${c ? esc(c.name) : 'Cliente de passage'}`,
      waName: c ? firstName(c.name) : null, waPhone: c ? c.phone : null,
      onPaid: (parts) => {
        const sale = {
          id: t.num, at: new Date(), clientId: c ? c.id : null, by: 'Salma', kind: 'vente',
          methods: parts.map((x) => x.m).join(' + '),
          lines: t.lines.map((ln) => ({ pid: ln.pid, size: ln.size, color: ln.color, qty: ln.qty, remise: ln.remise, unit: lineUnit(ln), returned: false, note: '' })),
          total,
        };
        SALES.unshift(sale);
        saleSeq++;
        let ptsLine = '';
        if (c) {
          const pts = Math.round(total / 10);
          c.points += pts;
          c.achats += 1;
          ptsLine = ` · +${pts} pts pour ${firstName(c.name)}`;
        }
        queueIfOffline(`Vente ${sale.id}`);
        freshTicket();
        $('#bq-today', root).textContent = headSubVente();
        renderTicket(); renderGrid(); renderBadges(); icons();
        return { ref: sale.id, line: `Vente ${sale.id} encaissée — ${fmtMAD(total)}${ptsLine}` };
      },
    });
  }

  function openPay(opts) {
    const el = $('#bq-paym', root);
    let avoirPart = null;                    /* { m:'avoir', amount, code } */
    const due = () => opts.amount - (avoirPart ? avoirPart.amount : 0);
    const closeBtns = () => $$('[data-bq-close]', el).forEach((b) => { b.onclick = () => closeVeil('#bq-pay-veil'); });

    const appliedBanner = () => avoirPart ? `
      <div class="bq-pay-applied"><i data-lucide="ticket"></i>
        Avoir <b>${avoirPart.code}</b> appliqué — −${fmtMAD(avoirPart.amount)}
      </div>` : '';

    const stepMethods = () => {
      const avs = activeAvoirs();
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">${esc(opts.title)}</h3>
        <p class="modal-subtle">${opts.subtitle}</p>
        <div class="modal-amount size-md">${fmtMAD(due())}</div>
        ${appliedBanner()}
        <div class="bq-pay-opts">
          <button class="bq-pay-opt" data-bq-m="especes">
            <span class="ic"><i data-lucide="banknote"></i></span>
            <span class="l"><b>Espèces</b><span>Rendu calculé — flous comptés une fois</span></span>
            <span class="amt">${fmtMAD(due())}</span>
          </button>
          <button class="bq-pay-opt" data-bq-m="carte">
            <span class="ic"><i data-lucide="credit-card"></i></span>
            <span class="l"><b>Carte</b><span>Lecteur partenaire — V1 sans encaissement Kiwi</span></span>
            <span class="amt">${fmtMAD(due())}</span>
          </button>
          ${avoirPart ? '' : avs.length ? `
          <button class="bq-pay-opt" data-bq-m="avoir">
            <span class="ic"><i data-lucide="ticket"></i></span>
            <span class="l"><b>Avoir</b><span>${avs.length === 1 ? `${avs[0].code} · ${fmtMAD(avs[0].balance)} — ${esc(avs[0].holderName)}` : `${avs.length} avoirs actifs — scanner ou choisir`}</span></span>
            <span class="amt">−${fmtMAD(Math.min(avs[0].balance, due()))}</span>
          </button>` : `
          <button class="bq-pay-opt is-mute" data-bq-m="avoir-none">
            <span class="ic"><i data-lucide="ticket"></i></span>
            <span class="l"><b>Avoir</b><span>Aucun avoir actif en caisse</span></span>
          </button>`}
        </div>`;
      icons(); closeBtns();
      $$('[data-bq-m]', el).forEach((b) => {
        b.onclick = () => {
          const m = b.dataset.bqM;
          if (m === 'especes') stepCash();
          else if (m === 'carte') stepCard();
          else if (m === 'avoir') stepAvoir();
          else toast('Aucun avoir actif — émettez-en un depuis Échanges & avoirs');
        };
      });
    };

    const stepAvoir = () => {
      const avs = activeAvoirs();
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">Avoir en paiement</h3>
        <p class="modal-subtle">Scannez le bon, ou choisissez-le — il se déduit du total</p>
        <div class="bq-pay-opts">
          ${avs.map((a) => `
            <button class="bq-pay-opt" data-bq-av-use="${a.code}">
              <span class="ic"><i data-lucide="scan-line"></i></span>
              <span class="l"><b>${a.code} · ${fmtMAD(a.balance)}</b><span>${esc(a.holderName)} · ${esc(a.motif)} · valable jusqu'au ${fmtDay(a.until)}</span></span>
              <span class="amt">−${fmtMAD(Math.min(a.balance, due()))}</span>
            </button>`).join('')}
        </div>
        <div class="bq-sheet-foot"><button class="bq-btn secondary" id="bq-av-back" style="flex:1;">Retour</button></div>`;
      icons(); closeBtns();
      $('#bq-av-back', el).onclick = stepMethods;
      $$('[data-bq-av-use]', el).forEach((b) => {
        b.onclick = () => {
          const av = AVOIRS.find((a) => a.code === b.dataset.bqAvUse);
          const applied = Math.min(av.balance, due());
          avoirPart = { m: 'avoir', amount: applied, code: av.code };
          if (due() <= 0) commit([avoirPart]);
          else { toast(`${av.code} appliqué — reste ${fmtMAD(due())} à payer`); stepMethods(); }
        };
      });
    };

    const stepCash = () => {
      const amount = due();
      let received = amount;
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">Espèces · ${fmtMAD(amount)}</h3>
        <p class="modal-subtle">${opts.subtitle}</p>
        ${appliedBanner()}
        <div class="cash-grid">
          <div class="cash-input-row">
            <label class="cash-input-label" for="bq-cash-in">Flous reçu</label>
            <input class="cash-input mono" id="bq-cash-in" type="number" inputmode="numeric" min="0" step="1" value="${amount}" />
          </div>
          <div class="cash-presets" aria-label="Ajout rapide">
            <button class="cash-preset" data-add="20">+20</button>
            <button class="cash-preset" data-add="50">+50</button>
            <button class="cash-preset" data-add="100">+100</button>
            <button class="cash-preset" data-add="200">+200</button>
          </div>
          <div class="cash-rendu"><span class="lbl">Rendu</span><span class="val mono" id="bq-cash-rendu">0 MAD</span></div>
          <button class="cash-confirm" id="bq-cash-ok">Confirmer</button>
        </div>`;
      icons(); closeBtns();
      const refresh = () => {
        $('#bq-cash-rendu', el).textContent = fmtMAD(Math.max(0, received - amount));
        $('#bq-cash-ok', el).disabled = received < amount;
      };
      $('#bq-cash-in', el).oninput = (e) => { received = +e.target.value || 0; refresh(); };
      $$('[data-add]', el).forEach((b) => {
        b.onclick = () => { received += +b.dataset.add; $('#bq-cash-in', el).value = received; refresh(); };
      });
      refresh();
      $('#bq-cash-ok', el).onclick = () => {
        const parts = [];
        if (avoirPart) parts.push(avoirPart);
        parts.push({ m: 'espèces', amount, rendu: Math.max(0, received - amount) });
        commit(parts);
      };
    };

    const stepCard = () => {
      const amount = due();
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">Carte · ${fmtMAD(amount)}</h3>
        <p class="modal-subtle">${opts.subtitle} · Kiwi affiche, le lecteur encaisse</p>
        <div class="reader-stage">
          <div class="reader-disc is-pulsing" id="bq-reader-disc"><i data-lucide="credit-card"></i></div>
          <div class="reader-status" id="bq-reader-status">Montant envoyé au lecteur<span class="ellipsis"></span></div>
          <div class="reader-method">Lecteur partenaire — V1 sans encaissement Kiwi</div>
        </div>`;
      icons(); closeBtns();
      setTimeout(() => {
        const disc = $('#bq-reader-disc', el);
        if (!disc || !el.closest('.modal-veil').classList.contains('is-open')) return;
        disc.classList.remove('is-pulsing');
        disc.classList.add('is-success');
        disc.innerHTML = '<i data-lucide="check"></i>';
        $('#bq-reader-status', el).textContent = 'Khlass! Paiement confirmé sur le lecteur';
        $('#bq-reader-status', el).classList.add('is-success');
        icons();
        setTimeout(() => {
          const parts = [];
          if (avoirPart) parts.push(avoirPart);
          parts.push({ m: 'carte', amount });
          commit(parts);
        }, 900);
      }, 1900);
    };

    const commit = (parts) => {
      const avp = parts.find((x) => x.m === 'avoir');
      if (avp) {
        const av = AVOIRS.find((a) => a.code === avp.code);
        av.balance -= avp.amount;
        toast(av.balance > 0 ? `${av.code} — reste ${fmtMAD(av.balance)} dessus` : `${av.code} consommé en totalité`);
      }
      const res = opts.onPaid(parts) || {};
      stepSuccess(parts, res);
    };

    const stepSuccess = (parts, res) => {
      const cash = parts.find((x) => x.m === 'espèces');
      el.innerHTML = `
        <button class="bq-modal-x" data-bq-close aria-label="Fermer"><i data-lucide="x"></i></button>
        <h3 class="modal-title">C'est encaissé</h3>
        <p class="modal-subtle">${res.line ? esc(res.line) : esc(opts.title)}</p>
        ${cash && cash.rendu > 0 ? `
          <div class="cash-success-rendu">${fmtMAD(cash.rendu)}</div>
          <div class="cash-success-label">rendu à la cliente</div>` : `
          <div class="modal-amount size-md">${fmtMAD(opts.amount)}</div>`}
        <div class="bq-pay-break">
          ${parts.map((x) => `<div class="row"><span>${x.m === 'avoir' ? `Avoir ${x.code}` : x.m === 'carte' ? 'Carte — lecteur partenaire' : 'Espèces'}</span><b>${fmtMAD(x.amount)}</b></div>`).join('')}
        </div>
        <div class="modal-actions is-visible">
          <button class="ma-btn secondary" id="bq-pay-print"><i data-lucide="printer"></i>Reçu 80 mm</button>
          <button class="ma-btn secondary" id="bq-pay-wa"><i data-lucide="message-circle"></i>Reçu WhatsApp</button>
        </div>
        <div class="modal-actions is-visible" style="margin-top:10px;">
          <button class="ma-btn primary" id="bq-pay-done"><i data-lucide="check"></i>${esc(opts.doneLabel || 'Nouvelle vente')}</button>
        </div>`;
      icons(); closeBtns();
      $('#bq-pay-print', el).onclick = () => toast('Envoyé — reçu 80 mm sur l\'imprimante caisse');
      $('#bq-pay-wa', el).onclick = () => toast(opts.waPhone
        ? `Reçu envoyé sur WhatsApp à ${opts.waName} (${opts.waPhone})`
        : 'Cliente de passage — pas de numéro WhatsApp sur le ticket');
      $('#bq-pay-done', el).onclick = () => closeVeil('#bq-pay-veil');
    };

    stepMethods();
    openVeil('#bq-pay-veil');
  }

  /* ═══════════════════════ OFFLINE (file simulée) ═══════════════════════ */
  function toggleOffline() {
    state.offline = !state.offline;
    if (!state.offline && state.queued) {
      toast(`Réseau de retour — ${state.queued} action${state.queued > 1 ? 's' : ''} synchronisée${state.queued > 1 ? 's' : ''}`);
      state.queued = 0;
    } else if (state.offline) {
      toast('Mode hors-ligne — la boutique continue, tout est mis en file');
    }
    renderNet();
  }
  function renderNet() {
    const net = $('#bq-net', root);
    net.classList.toggle('is-off', state.offline);
    $('.bq-net-label', net).textContent = state.offline ? 'Hors-ligne' : 'En ligne';
    let q = $('.bq-net-queue', net);
    if (state.offline && state.queued) {
      if (!q) { q = document.createElement('b'); q.className = 'bq-net-queue'; net.appendChild(q); }
      q.textContent = state.queued;
    } else if (q) q.remove();
    const note = $('#bq-offline-note', root);
    note.hidden = !state.offline;
    $('#bq-queue-count', root).textContent = state.queued ? `${state.queued} en attente` : '';
  }

  /* ═══════════════════════ register ═══════════════════════ */
  window.KiwiPosDispatch.register({
    id: 'boutique',
    greet: {
      line1: 'Sba7 lkhir Salma,',
      em: 'marhba.',
      sub: 'Maison Mansour <em>·</em> boutique ouverte 10h–20h',
    },
    mount,
    onShow,
  });
})();
