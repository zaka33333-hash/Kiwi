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

  /* ───────────────────────── catalogue (base partagée) ─────────────────────────
     Le catalogue est désormais la BASE PARTAGÉE (window.KiwiBoutiqueCatalog) —
     la même que le dashboard lit/écrit. compat() reconstruit la forme
     { RAYONS, P, BY_EAN } que ce module rend déjà : la grille de vente, la fiche
     variante et la douchette parlent tous l’inventaire en direct. La baisse de
     stock à la vente reste en mémoire (démo) ; la saisie de stock et la création
     de produits se font dans la vue Inventaire et persistent dans la base. */
  let RAYONS = [], P = {}, BY_EAN = {};
  function rebuildCatalog() {
    if (!window.KiwiBoutiqueCatalog) { RAYONS = []; P = {}; BY_EAN = {}; return; }
    const c = window.KiwiBoutiqueCatalog.compat();
    RAYONS = c.RAYONS; P = c.P; BY_EAN = c.BY_EAN;
  }
  rebuildCatalog();

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
          <button class="bq-nav-it" data-bq-view="inventaire"><i data-lucide="package"></i><span>Inventaire</span><b class="bq-nav-badge" id="bq-badge-inv"></b></button>
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
        <section class="bq-view" data-bq-panel="inventaire"></section>
        <section class="bq-view" data-bq-panel="echanges"></section>
        <section class="bq-view" data-bq-panel="clientes"></section>
      </main>
      <div class="modal-veil" id="bq-sheet-veil"><div class="modal bq-sheet bq-rel" id="bq-sheetm"></div></div>
      <div class="modal-veil" id="bq-approve-veil"><div class="modal bq-approve bq-rel" id="bq-approvem"></div></div>
      <div class="modal-veil" id="bq-client-veil"><div class="modal bq-client bq-rel" id="bq-clientm"></div></div>
      <div class="modal-veil" id="bq-fiche-veil"><div class="modal bq-fiche bq-rel" id="bq-fichem"></div></div>
      <div class="modal-veil" id="bq-exch-veil"><div class="modal bq-exch bq-rel" id="bq-exchm"></div></div>
      <div class="modal-veil" id="bq-pay-veil"><div class="modal bq-pay bq-rel" id="bq-paym"></div></div>
      <div class="modal-veil" id="bq-inv-veil"><div class="modal bq-invm bq-rel" id="bq-invmm"></div></div>
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

    /* live catalogue → the sale grid, the sheet and the douchette track the DB.
       When the dashboard (or another caisse tab) edits the inventory, rebuild. */
    rebuildCatalog();
    injectInvCss();
    if (window.KiwiBoutiqueCatalog && !mount._subbed) {
      mount._subbed = true;
      window.KiwiBoutiqueCatalog.subscribe(() => {
        rebuildCatalog();
        if (root) { pruneTicket(); refreshAfterCatalog(); }
      });
    }
    installWedgeScanner();

    /* mi-journée : une vente est déjà en cours au comptoir */
    freshTicket();
    state.ticket.client = 'c1';
    seedDemoTicket();

    renderAll();
  }

  /* Pick the first two in-stock articles from the live catalogue for the
     mid-day demo ticket (ids are the DB's, not the old hard-coded literals). */
  function seedDemoTicket() {
    const picks = [];
    for (const r of RAYONS) {
      for (const it of r.items) {
        const size = firstFree(it);
        if (size) { picks.push({ pid: it.id, size, color: it.colors[0], qty: 1, remise: 0 }); }
        if (picks.length >= 2) break;
      }
      if (picks.length >= 2) break;
    }
    state.ticket.lines = picks;
    picks.forEach((ln) => stockAdd(ln.pid, ln.size, -ln.qty));
  }
  /* Drop ticket lines whose product vanished from the catalogue. */
  function pruneTicket() { if (state.ticket) state.ticket.lines = state.ticket.lines.filter((ln) => P[ln.pid]); }
  function refreshAfterCatalog() {
    if (!root) return;
    try { renderCats(); renderView(state.view); renderBadges(); icons(); } catch (e) {}
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
    if (view === 'inventaire') renderInventaire();
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
    const invBadge = $('#bq-badge-inv', root);
    if (invBadge) { const st = window.KiwiBoutiqueCatalog ? window.KiwiBoutiqueCatalog.stats() : null; const n = st ? st.ruptures + st.low : 0; invBadge.textContent = n || ''; invBadge.style.display = n ? '' : 'none'; }
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
        <span class="bq-sheet-title"><h3>${esc(p.name)}</h3><span class="sub">${esc((RAYONS.find((r) => r.id === p.rayon) || { label: 'Divers' }).label)}${p.flag ? ` · ${esc(p.flag)}` : ''}${p.ean ? ` · ${esc(p.ean)}` : ''}</span></span>
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
          ${p.colors.map((cid) => { const cc = COLOR[cid] || { hex: '#ccc', label: cid }; return `<button class="bq-color ${cid === sheet.color ? 'on' : ''}" data-bq-color="${cid}" data-c="${cid}" style="background:${cc.hex}" title="${esc(cc.label)}" aria-label="${esc(cc.label)}"></button>`; }).join('')}
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
  /* Demo « douchette » cycle — a handful of real, in-stock articles from the
     live catalogue (each carries a scannable primary barcode). */
  function scanCycle() {
    const out = [];
    for (const r of RAYONS) for (const it of r.items) if (firstFree(it) && it.ean) out.push(it.id);
    return out.length ? out : Object.keys(P);
  }

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
            <input id="bq-ean" placeholder="Scannez ou tapez un code-barres…" autocomplete="off" />
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

  /* A code from the douchette. Resolves the EXACT variant (colour + size) from
     the shared catalogue — EAN-13 or any old/alphanumeric code registered on an
     article. Unknown → offer to register it on a product (no reprint). */
  function commitEan(raw) {
    const code = String(raw || '').trim();
    if (!code) return;
    const hit = window.KiwiBoutiqueCatalog ? window.KiwiBoutiqueCatalog.resolveScan(code) : null;
    const pid = hit ? hit.pid : BY_EAN[code];
    if (!pid || !P[pid]) {
      state.scanLog.unshift({ at: new Date(), ok: false, label: 'Code inconnu — non référencé', ean: code, pid: null, size: '' });
      toast(`Code ${code} inconnu — enregistrez-le sur un article`);
      if (state.view === 'scan') renderScan();
      renderBadges();
      offerRegister(code);
      return;
    }
    const p = P[pid];
    const c = ticketClient();
    let size = (hit && hit.size && (p.sizes[hit.size] || 0) > 0) ? hit.size
             : (c && p.kind === 'taille' && (p.sizes[c.taille] || 0) > 0) ? c.taille
             : firstFree(p);
    if (!size) {
      state.scanLog.unshift({ at: new Date(), ok: false, label: `${p.name} — épuisé, rien à vendre`, ean: code, pid: null, size: '' });
      toast(`${p.name} — épuisé dans toutes les tailles`);
      if (state.view === 'scan') renderScan();
      renderBadges();
      return;
    }
    const color = (hit && hit.colorId && p.colors.includes(hit.colorId)) ? hit.colorId : p.colors[0];
    addToTicket(pid, { size, color, qty: 1, remise: 0 }, { quiet: true });
    state.scanLog.unshift({ at: new Date(), ok: true, label: `${p.name} · ${size} — ajouté au ticket`, ean: code, pid, size });
    toast(`Bip — ${p.name} · ${size} sur le ticket (${fmtMAD(p.price)})`);
    if (state.view === 'scan') renderScan();
    if (state.view === 'vente') renderTicket();
    renderBadges();
  }

  function mockScan() {
    if (state.scanBusy) return;
    const cycle = scanCycle();
    if (!cycle.length) return;
    state.scanBusy = true;
    const pid = cycle[state.scanIdx % cycle.length];
    state.scanIdx++;
    const code = P[pid] ? P[pid].ean : '';
    const stage = $('#bq-scan-stage', root);
    const lbl = $('#bq-scan-stage-ean', root);
    if (stage) { stage.classList.add('is-on'); if (lbl) lbl.textContent = code; }
    setTimeout(() => {
      state.scanBusy = false;
      commitEan(code);
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
  /* ═══════════════════════════════════════════════════════════════════════════
   * INVENTAIRE — the caisse is where products are CREATED and stock is INPUT.
   * The physical douchette (barcode scanner) and the label printer are wired to
   * this terminal, so this view owns: create product · colour×size variants ·
   * generate + PRINT an EAN-13 label · register an EXISTING old-POS code verbatim
   * (no reprint) · input/adjust stock. Everything persists to the shared
   * KiwiBoutiqueCatalog → the dashboard sees it live, and vice-versa.
   * ─────────────────────────────────────────────────────────────────────────── */
  const catDB = () => window.KiwiBoutiqueCatalog;
  const fmtNum = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

  function injectInvCss() {
    if (document.getElementById('bqi-css')) return;
    const st = document.createElement('style');
    st.id = 'bqi-css';
    st.textContent = `
      .bqi { height: 100%; overflow-y: auto; padding-bottom: 40px; }
      .bqi-tools { display: flex; gap: 12px; align-items: center; padding: 14px 22px 6px; }
      .bqi-scan { flex: 1; display: flex; align-items: center; gap: 10px; background: var(--paper); border: 1.5px solid var(--atlas); border-radius: 14px; padding: 12px 16px; }
      .bqi-scan svg { width: 20px; height: 20px; color: var(--atlas); }
      .bqi-scan input { flex: 1; border: none; background: transparent; outline: none; font: inherit; font-size: 15px; color: var(--ink); }
      .bqi-pills { display: flex; gap: 8px; flex-wrap: wrap; padding: 6px 22px; }
      .bqi-pill { border: 1px solid rgba(10,15,13,.14); background: var(--paper); border-radius: 999px; padding: 6px 13px; font-size: 12.5px; cursor: pointer; color: var(--ink); }
      .bqi-pill.on { background: var(--atlas); color: #fff; border-color: var(--atlas); }
      .bqi-kpis { display: flex; gap: 10px; padding: 6px 22px 10px; }
      .bqi-kpi { flex: 1; background: var(--paper); border: 1px solid rgba(10,15,13,.08); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; }
      .bqi-kpi .l { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: #77807b; }
      .bqi-kpi .v { font-size: 18px; font-weight: 600; font-family: var(--mono); }
      .bqi-kpi.warn { border-color: #E7B24D; background: #FBF3E2; }
      .bqi-list { padding: 4px 22px; display: flex; flex-direction: column; gap: 8px; }
      .bqi-row { display: flex; align-items: center; gap: 14px; background: var(--paper); border: 1px solid rgba(10,15,13,.08); border-radius: 14px; padding: 12px 16px; cursor: pointer; transition: border-color .15s; }
      .bqi-row:hover { border-color: var(--atlas); }
      .bqi-art { width: 40px; height: 40px; flex: 0 0 40px; color: var(--riad); }
      .bqi-art svg { width: 40px; height: 40px; }
      .bqi-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .bqi-info b { font-size: 14.5px; }
      .bqi-info span { font-size: 12px; color: #77807b; }
      .bqi-stock { font-family: var(--mono); font-size: 15px; font-weight: 600; min-width: 34px; text-align: right; }
      .bqi-stock.bas { color: #B8860B; } .bqi-stock.rupture { color: #9B2F22; }
      .bqi-price { font-family: var(--mono); font-size: 14px; min-width: 90px; text-align: right; }
      .bqi-mini { width: 34px; height: 34px; border-radius: 9px; border: 1px solid rgba(10,15,13,.14); background: var(--paper); cursor: pointer; color: var(--ink); display: inline-flex; align-items: center; justify-content: center; }
      .bqi-mini:hover { background: #f0eee7; } .bqi-mini svg { width: 16px; height: 16px; }
      .bqi-mini.danger { color: #9B2F22; }
      .bq-invm { width: min(720px, 94vw); max-height: 88vh; overflow-y: auto; padding: 0; }
      .bqi-modh { display: flex; align-items: center; gap: 14px; padding: 22px 24px 14px; border-bottom: 1px solid rgba(10,15,13,.08); }
      .bqi-modh h3 { margin: 0; font-size: 18px; } .bqi-modh > div { flex: 1; } .bqi-modh > div span { font-size: 12.5px; color: #77807b; }
      .bqi-vtable-wrap { padding: 8px 24px; }
      .bqi-vtable { width: 100%; border-collapse: collapse; font-size: 13px; }
      .bqi-vtable th { text-align: left; font-size: 10px; letter-spacing: .05em; text-transform: uppercase; color: #77807b; padding: 8px 6px; }
      .bqi-vtable td { padding: 9px 6px; border-top: 1px solid rgba(10,15,13,.07); vertical-align: middle; }
      .bqi-dot { display: inline-block; width: 13px; height: 13px; border-radius: 50%; border: 1px solid rgba(0,0,0,.18); vertical-align: -1px; margin-right: 6px; }
      .bqi-stk { display: inline-flex; align-items: center; gap: 5px; }
      .bqi-stk input { width: 46px; text-align: center; font-family: var(--mono); font-size: 14px; padding: 5px; border: 1px solid rgba(10,15,13,.16); border-radius: 8px; background: var(--paper); color: var(--ink); }
      .bqi-stk button { width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(10,15,13,.16); background: var(--paper); cursor: pointer; font-size: 17px; line-height: 1; color: var(--ink); }
      .bqi-bc { display: flex; align-items: center; gap: 8px; }
      .bqi-code { font-family: var(--mono); font-size: 11px; color: #555; display: flex; flex-direction: column; }
      .bqi-code em { font-style: normal; font-size: 8.5px; letter-spacing: .04em; text-transform: uppercase; font-weight: 700; }
      .bqi-code em.gen { color: #0B6E4F; } .bqi-code em.imp { color: #8A6210; }
      .bqi-nocode { color: #99a; font-style: italic; font-size: 12px; }
      .bqi-vact { display: flex; gap: 5px; justify-content: flex-end; }
      .bqi-modfoot { display: flex; gap: 8px; padding: 14px 24px 22px; flex-wrap: wrap; }
      .bqi-modfoot .bq-btn.danger { color: #9B2F22; }
      .bqi-form { padding: 20px 24px 8px; }
      .bqi-fg { margin-bottom: 14px; } .bqi-fg label { display: block; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: #77807b; margin-bottom: 6px; }
      .bqi-fg input, .bqi-fg select { width: 100%; padding: 11px 13px; border: 1px solid rgba(10,15,13,.16); border-radius: 10px; font: inherit; font-size: 14px; background: var(--paper); color: var(--ink); }
      .bqi-frow { display: flex; gap: 12px; } .bqi-frow .bqi-fg { flex: 1; }
      .bqi-swrow { display: flex; gap: 7px; flex-wrap: wrap; }
      .bqi-sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
      .bqi-sw.on { border-color: var(--ink); }
      .bqi-help { font-size: 12px; color: #77807b; margin-top: -6px; margin-bottom: 12px; }
    `;
    document.head.appendChild(st);
  }

  /* ─── global keyboard-wedge : a USB scanner types fast + Enter, from anywhere ─── */
  function installWedgeScanner() {
    if (installWedgeScanner._done) return;
    installWedgeScanner._done = true;
    let buf = '', last = 0;
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('is-pos-boutique')) return;
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
      const now = Date.now();
      if (now - last > 120) buf = '';
      last = now;
      if (e.key === 'Enter') {
        const code = buf; buf = '';
        if (code.length >= 4 && !typing) { e.preventDefault(); handleWedge(code); }
        return;
      }
      if (e.key && e.key.length === 1) buf += e.key;
    }, true);
  }
  function handleWedge(code) {
    if (state.view === 'inventaire') { invScanHandle(code); return; }
    commitEan(code);
  }
  function invScanHandle(code) {
    const cat = catDB(); if (!cat) return;
    const hit = cat.findByBarcode(code);
    if (hit) { toast(`${hit.product.name} · ${hit.variant.colorLabel} ${hit.variant.size}`); openInvProduct(hit.product.id); }
    else { toast(`Code ${code} inconnu — à enregistrer`); offerRegister(code); }
  }

  /* ─── the inventory panel ─── */
  function renderInventaire() {
    const cat = catDB();
    const panel = $('[data-bq-panel="inventaire"]', root);
    if (!cat) { panel.innerHTML = '<div class="bq-empty" style="margin:40px;">Base d\'inventaire indisponible.</div>'; return; }
    const st = cat.stats();
    const cats = cat.listCategories();
    const filter = state.invFilter || 'all';
    const products = cat.listProducts({ categoryId: filter, q: state.invQuery || '' });
    panel.innerHTML = `
      <div class="bqi">
        <header class="bq-head" style="padding:22px 22px 0;">
          <div><h1>Inventaire</h1><div class="bq-head-sub">Douchette + imprimante étiquettes · ${st.products} produits · ${st.variants} variantes — base partagée avec le dashboard</div></div>
        </header>
        <div class="bqi-tools">
          <div class="bqi-scan"><i data-lucide="scan-line"></i><input id="bqi-scan" placeholder="Scannez un article, ou tapez un code…" autocomplete="off" /></div>
          <button class="bq-btn" id="bqi-new"><i data-lucide="plus"></i>Nouvel article</button>
        </div>
        <div class="bqi-pills" id="bqi-pills">
          <button class="bqi-pill ${filter === 'all' ? 'on' : ''}" data-f="all">Tous · ${st.products}</button>
          ${cats.map((c) => `<button class="bqi-pill ${filter === c.id ? 'on' : ''}" data-f="${c.id}">${esc(c.name)} · ${cat.categoryCount(c.id)}</button>`).join('')}
        </div>
        <div class="bqi-kpis">
          <div class="bqi-kpi"><span class="l">Valeur de stock</span><span class="v">${fmtNum(st.stockValue)} MAD</span></div>
          <div class="bqi-kpi"><span class="l">Pièces en stock</span><span class="v">${st.totalStock}</span></div>
          <div class="bqi-kpi ${st.low || st.ruptures ? 'warn' : ''}"><span class="l">Stock bas / rupture</span><span class="v">${st.low} + ${st.ruptures}</span></div>
        </div>
        <div class="bqi-list">
          ${products.length ? products.map((p) => invRow(p)).join('') : '<div class="bq-empty" style="padding:26px;text-align:center;color:#99a;">Aucun produit. Touchez « Nouvel article » ou scannez un code.</div>'}
        </div>
      </div>`;
    const scan = $('#bqi-scan', panel);
    if (scan) scan.onkeydown = (e) => { if (e.key === 'Enter') { const v = scan.value.trim(); scan.value = ''; if (v) invScanHandle(v); } };
    const nb = $('#bqi-new', panel); if (nb) nb.onclick = () => openNewProduct();
    const pills = $('#bqi-pills', panel);
    if (pills) pills.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { state.invFilter = b.dataset.f; renderInventaire(); } });
    panel.querySelectorAll('[data-inv-open]').forEach((el) => el.addEventListener('click', () => openInvProduct(el.getAttribute('data-inv-open'))));
    panel.querySelectorAll('[data-inv-print]').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); printProductLabels(el.getAttribute('data-inv-print')); }));
    icons();
  }

  function invRow(p) {
    const cat = catDB();
    const d = cat.getProduct(p.id);
    const nBc = d.variants.reduce((s, v) => s + ((v.barcodes && v.barcodes.length) ? 1 : 0), 0);
    const cls = d.stock === 0 ? 'rupture' : (d.stock <= 5 ? 'bas' : '');
    return `<div class="bqi-row" data-inv-open="${p.id}">
      <span class="bqi-art">${ART[p.art] || '<svg viewBox="0 0 64 64"></svg>'}</span>
      <span class="bqi-info"><b>${esc(p.name)}</b><span>${d.category ? esc(d.category.name) : 'Divers'} · ${d.colors.length} coul. · ${d.sizes.length} taille${d.sizes.length > 1 ? 's' : ''} · ${nBc}/${d.variants.length} codes-barres</span></span>
      <span class="bqi-stock ${cls}">${d.stock}</span>
      <span class="bqi-price">${fmtMAD(p.priceMAD)}</span>
      <button class="bqi-mini" data-inv-print="${p.id}" title="Imprimer toutes les étiquettes"><i data-lucide="printer"></i></button>
    </div>`;
  }

  /* ─── single-veil modal host (content-swapping keeps it simple) ─── */
  function invSetModal(html, wire) {
    const el = $('#bq-invmm', root);
    if (!el) return;
    el.innerHTML = html;
    if (!$('#bq-inv-veil', root).classList.contains('is-open')) openVeil('#bq-inv-veil');
    el.querySelectorAll('[data-inv-x]').forEach((b) => b.addEventListener('click', () => closeVeil('#bq-inv-veil')));
    if (wire) wire(el);
    icons();
  }

  function openInvProduct(pid) {
    const cat = catDB(); const d = cat.getProduct(pid); if (!d) return;
    const p = d.product;
    const rows = d.variants.length
      ? d.variants.map((v) => invVarRow(v)).join('')
      : '<tr><td colspan="4" style="text-align:center;padding:18px;color:#99a;">Aucune variante — ajoutez une couleur × taille.</td></tr>';
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh">
        <span class="bqi-art">${ART[p.art] || '<svg viewBox="0 0 64 64"></svg>'}</span>
        <div><h3>${esc(p.name)}</h3><span>${d.category ? esc(d.category.name) : 'Divers'} · ${fmtMAD(p.priceMAD)} · ${d.stock} en stock</span></div>
        <button class="bqi-mini" data-inv-edit title="Modifier le produit"><i data-lucide="pencil"></i></button>
      </div>
      <div class="bqi-vtable-wrap"><table class="bqi-vtable">
        <thead><tr><th>Couleur · Taille</th><th>Stock</th><th>Code-barres</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div class="bqi-modfoot">
        <button class="bq-btn secondary" data-inv-addvar><i data-lucide="plus"></i>Ajouter une variante</button>
        <button class="bq-btn secondary" data-inv-printall><i data-lucide="printer"></i>Imprimer les étiquettes</button>
        <button class="bq-btn secondary danger" data-inv-del><i data-lucide="trash-2"></i>Supprimer</button>
      </div>`;
    invSetModal(html, (el) => {
      const cat2 = catDB();
      $('[data-inv-edit]', el).addEventListener('click', () => openEditProduct(pid));
      $('[data-inv-addvar]', el).addEventListener('click', () => openAddVariant(pid));
      $('[data-inv-printall]', el).addEventListener('click', () => printProductLabels(pid));
      $('[data-inv-del]', el).addEventListener('click', () => confirmDeleteProduct(pid));
      el.querySelectorAll('[data-vinc]').forEach((b) => b.addEventListener('click', () => { cat2.adjustStock(b.dataset.vinc, 1); openInvProduct(pid); }));
      el.querySelectorAll('[data-vdec]').forEach((b) => b.addEventListener('click', () => { cat2.adjustStock(b.dataset.vdec, -1); openInvProduct(pid); }));
      el.querySelectorAll('[data-vstock]').forEach((inp) => inp.addEventListener('change', () => { cat2.setStock(inp.dataset.vstock, parseInt(inp.value, 10) || 0); openInvProduct(pid); }));
      el.querySelectorAll('[data-vgen]').forEach((b) => b.addEventListener('click', () => { const code = cat2.generateBarcode(b.dataset.vgen); if (code) toast(`EAN-13 ${code} généré`); openInvProduct(pid); }));
      el.querySelectorAll('[data-vprint]').forEach((b) => b.addEventListener('click', () => printVariantLabel(b.dataset.vprint)));
      el.querySelectorAll('[data-vreg]').forEach((b) => b.addEventListener('click', () => openRegisterOnVariant(b.dataset.vreg, pid)));
      el.querySelectorAll('[data-vdel]').forEach((b) => b.addEventListener('click', () => { cat2.deleteVariant(b.dataset.vdel); openInvProduct(pid); }));
    });
  }

  function invVarRow(v) {
    const primary = (v.barcodes || []).find((b) => b.primary) || (v.barcodes || [])[0];
    const bc = primary
      ? `<div class="bqi-bc">${window.KiwiBarcode.svg(primary.code, { height: 26, module: 1.1, showText: false })}<span class="bqi-code">${esc(primary.code)}<em class="${primary.type === 'imported' ? 'imp' : 'gen'}">${primary.type === 'imported' ? 'importé' : 'généré'}</em></span></div>`
      : '<span class="bqi-nocode">aucun code</span>';
    const genOrPrint = primary
      ? `<button class="bqi-mini" data-vprint="${v.id}" title="Imprimer l'étiquette"><i data-lucide="printer"></i></button>`
      : `<button class="bqi-mini" data-vgen="${v.id}" title="Générer un EAN-13"><i data-lucide="scan-line"></i></button>`;
    return `<tr>
      <td><span class="bqi-dot" style="background:${v.colorHex}"></span>${esc(v.colorLabel)} · <b>${esc(v.size)}</b></td>
      <td><span class="bqi-stk"><button data-vdec="${v.id}" aria-label="−1">−</button><input data-vstock="${v.id}" type="number" min="0" value="${v.stock}"/><button data-vinc="${v.id}" aria-label="+1">+</button></span></td>
      <td>${bc}</td>
      <td class="bqi-vact">${genOrPrint}<button class="bqi-mini" data-vreg="${v.id}" title="Enregistrer un code existant"><i data-lucide="link"></i></button><button class="bqi-mini danger" data-vdel="${v.id}" title="Supprimer la variante"><i data-lucide="trash-2"></i></button></td>
    </tr>`;
  }

  /* ─── new product ─── */
  function catSelectOptions(sel) {
    const cats = catDB().listCategories();
    return `<option value="">— Sans catégorie</option>` + cats.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  }
  function kindSelectOptions(sel) {
    return [['taille', 'Vêtement (S–XL)'], ['pointure', 'Chaussure (pointures)'], ['tu', 'Taille unique']]
      .map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${l}</option>`).join('');
  }
  function openNewProduct() {
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Nouvel article</h3><span>Créez le produit, puis ajoutez ses variantes couleur × taille</span></div></div>
      <div class="bqi-form">
        <div class="bqi-fg"><label>Nom du produit</label><input id="bqi-n-name" placeholder="Ex. Caftan brodé main" /></div>
        <div class="bqi-frow">
          <div class="bqi-fg"><label>Catégorie</label><select id="bqi-n-cat">${catSelectOptions(state.invFilter && state.invFilter !== 'all' ? state.invFilter : '')}</select></div>
          <div class="bqi-fg"><label>Type</label><select id="bqi-n-kind">${kindSelectOptions('taille')}</select></div>
        </div>
        <div class="bqi-fg"><label>Ou nouvelle catégorie (optionnel)</label><input id="bqi-n-newcat" placeholder="Laisser vide pour utiliser la catégorie ci-dessus" /></div>
        <div class="bqi-frow">
          <div class="bqi-fg"><label>Prix de vente (MAD)</label><input id="bqi-n-price" type="number" min="0" placeholder="1890" /></div>
          <div class="bqi-fg"><label>Coût d'achat (MAD)</label><input id="bqi-n-cost" type="number" min="0" placeholder="optionnel" /></div>
        </div>
      </div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" data-inv-x>Annuler</button><button class="bq-btn" id="bqi-n-save">Créer et ajouter des variantes</button></div>`;
    invSetModal(html, (el) => {
      $('#bqi-n-save', el).addEventListener('click', () => {
        const cat = catDB();
        const name = $('#bqi-n-name', el).value.trim();
        if (!name) { toast('Nom requis'); return; }
        let catId = $('#bqi-n-cat', el).value || null;
        const newCat = $('#bqi-n-newcat', el).value.trim();
        if (newCat) catId = cat.addCategory(newCat).id;
        const p = cat.addProduct({ name, categoryId: catId, kind: $('#bqi-n-kind', el).value, priceMAD: parseInt($('#bqi-n-price', el).value, 10) || 0, cost: parseInt($('#bqi-n-cost', el).value, 10) || 0 });
        toast(`${name} créé — ajoutez ses variantes`);
        openInvProduct(p.id);
      });
      setTimeout(() => { const i = $('#bqi-n-name', el); if (i) i.focus(); }, 40);
    });
  }

  function openEditProduct(pid) {
    const cat = catDB(); const d = cat.getProduct(pid); if (!d) return; const p = d.product;
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Modifier le produit</h3><span>${esc(p.name)}</span></div></div>
      <div class="bqi-form">
        <div class="bqi-fg"><label>Nom</label><input id="bqi-e-name" value="${esc(p.name)}" /></div>
        <div class="bqi-frow">
          <div class="bqi-fg"><label>Catégorie</label><select id="bqi-e-cat">${catSelectOptions(p.categoryId)}</select></div>
          <div class="bqi-fg"><label>Type</label><select id="bqi-e-kind">${kindSelectOptions(p.kind)}</select></div>
        </div>
        <div class="bqi-frow">
          <div class="bqi-fg"><label>Prix de vente (MAD)</label><input id="bqi-e-price" type="number" min="0" value="${p.priceMAD}" /></div>
          <div class="bqi-fg"><label>Coût d'achat (MAD)</label><input id="bqi-e-cost" type="number" min="0" value="${p.cost || 0}" /></div>
        </div>
      </div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" data-inv-back>Retour</button><button class="bq-btn" id="bqi-e-save">Enregistrer</button></div>`;
    invSetModal(html, (el) => {
      $('[data-inv-back]', el).addEventListener('click', () => openInvProduct(pid));
      $('#bqi-e-save', el).addEventListener('click', () => {
        cat.updateProduct(pid, { name: $('#bqi-e-name', el).value.trim() || undefined, categoryId: $('#bqi-e-cat', el).value || null, kind: $('#bqi-e-kind', el).value, priceMAD: parseInt($('#bqi-e-price', el).value, 10) || 0, cost: parseInt($('#bqi-e-cost', el).value, 10) || 0 });
        toast('Produit mis à jour');
        openInvProduct(pid);
      });
    });
  }

  function confirmDeleteProduct(pid) {
    const cat = catDB(); const d = cat.getProduct(pid); if (!d) return;
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Supprimer « ${esc(d.product.name)} » ?</h3><span>${d.variants.length} variantes et leurs codes-barres seront supprimés.</span></div></div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" data-inv-back>Annuler</button><button class="bq-btn danger" id="bqi-del-ok"><i data-lucide="trash-2"></i>Supprimer définitivement</button></div>`;
    invSetModal(html, (el) => {
      $('[data-inv-back]', el).addEventListener('click', () => openInvProduct(pid));
      $('#bqi-del-ok', el).addEventListener('click', () => { cat.deleteProduct(pid); toast('Produit supprimé'); closeVeil('#bq-inv-veil'); renderInventaire(); });
    });
  }

  /* ─── add variant (colour × size × stock + optional EAN-13) ─── */
  function colorSwatches(id) {
    return catDB().colors().map((c, i) => `<button type="button" class="bqi-sw ${i === 0 ? 'on' : ''}" style="background:${c.hex}" title="${esc(c.label)}" data-cid="${c.id}"></button>`).join('');
  }
  function openAddVariant(pid) {
    const cat = catDB(); const d = cat.getProduct(pid); if (!d) return;
    const presets = cat.sizePresets(d.product.kind);
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Ajouter une variante</h3><span>${esc(d.product.name)} — couleur × taille</span></div></div>
      <div class="bqi-form">
        <div class="bqi-fg"><label>Couleur</label><div class="bqi-swrow" id="bqi-av-sw">${colorSwatches()}</div></div>
        <div class="bqi-frow">
          <div class="bqi-fg"><label>Taille</label><input id="bqi-av-size" list="bqi-av-sizes" value="${esc(presets[0] || 'TU')}" /><datalist id="bqi-av-sizes">${presets.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></div>
          <div class="bqi-fg"><label>Stock initial</label><input id="bqi-av-stock" type="number" min="0" value="0" /></div>
        </div>
        <div class="bqi-fg"><label>Code-barres</label><select id="bqi-av-bc"><option value="gen">Générer un EAN-13 (imprimable)</option><option value="none">Aucun pour l'instant</option></select></div>
      </div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" data-inv-back>Retour</button><button class="bq-btn" id="bqi-av-save">Ajouter la variante</button></div>`;
    invSetModal(html, (el) => {
      let colorId = cat.colors()[0].id;
      el.querySelectorAll('#bqi-av-sw .bqi-sw').forEach((b) => b.addEventListener('click', () => { el.querySelectorAll('#bqi-av-sw .bqi-sw').forEach((x) => x.classList.remove('on')); b.classList.add('on'); colorId = b.dataset.cid; }));
      $('[data-inv-back]', el).addEventListener('click', () => openInvProduct(pid));
      $('#bqi-av-save', el).addEventListener('click', () => {
        const size = $('#bqi-av-size', el).value.trim() || 'TU';
        const stock = parseInt($('#bqi-av-stock', el).value, 10) || 0;
        const v = cat.addVariant({ productId: pid, colorId, size, stock });
        if (v && $('#bqi-av-bc', el).value === 'gen') cat.generateBarcode(v.id);
        toast('Variante ajoutée');
        openInvProduct(pid);
      });
    });
  }

  /* ─── register an EXISTING barcode on a variant (old POS code, no reprint) ─── */
  function openRegisterOnVariant(vid, pid) {
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Enregistrer un code existant</h3><span>Scannez ou tapez le code déjà présent sur l'article — conservé tel quel.</span></div></div>
      <div class="bqi-form">
        <div class="bqi-fg"><label>Code-barres</label><input id="bqi-reg-code" placeholder="Scannez ou tapez le code…" autocomplete="off" /></div>
        <div class="bqi-help">EAN-13, UPC ou tout code de l'ancien système. Aucune réimpression — le code est rattaché à cette variante.</div>
      </div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" data-inv-back>Retour</button><button class="bq-btn" id="bqi-reg-save">Enregistrer le code</button></div>`;
    invSetModal(html, (el) => {
      $('[data-inv-back]', el).addEventListener('click', () => openInvProduct(pid));
      const inp = $('#bqi-reg-code', el);
      const save = () => {
        const raw = inp.value.trim(); if (!raw) { toast('Code vide'); return; }
        const res = catDB().attachBarcode(vid, raw);
        if (res.ok) { toast(res.already ? 'Code déjà rattaché' : `Code ${raw} enregistré`); openInvProduct(pid); }
        else if (res.reason === 'doublon') toast(`Déjà utilisé par ${res.owner.product.name} (${res.owner.variant.colorLabel} ${res.owner.variant.size})`);
        else toast('Enregistrement impossible');
      };
      inp.onkeydown = (e) => { if (e.key === 'Enter') save(); };
      $('#bqi-reg-save', el).addEventListener('click', save);
      setTimeout(() => inp.focus(), 40);
    });
  }

  /* ─── register an unknown scanned code onto a product (pick / create) ─── */
  function offerRegister(code) {
    const cat = catDB(); if (!cat) return;
    if (state.view !== 'inventaire') switchView('inventaire');
    const products = cat.listProducts({});
    const varOptions = (pid) => cat.listVariants(pid).map((v) => `<option value="${v.id}">${esc(v.colorLabel)} · ${esc(v.size)}</option>`).join('');
    const html = `
      <button class="bq-modal-x" data-inv-x aria-label="Fermer"><i data-lucide="x"></i></button>
      <div class="bqi-modh"><div><h3>Code existant à enregistrer</h3><span>Code scanné : <b>${esc(code)}</b> — rattachez-le à un article (sans réimprimer).</span></div></div>
      <div class="bqi-form">
        <div class="bqi-fg"><label>Article</label><select id="bqi-or-prod">${products.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
        <div class="bqi-fg"><label>Variante (couleur · taille)</label><select id="bqi-or-var">${products.length ? varOptions(products[0].id) : ''}</select></div>
      </div>
      <div class="bqi-modfoot"><button class="bq-btn secondary" id="bqi-or-new">Nouvel article…</button><button class="bq-btn" id="bqi-or-save">Rattacher le code</button></div>`;
    invSetModal(html, (el) => {
      const prodSel = $('#bqi-or-prod', el), varSel = $('#bqi-or-var', el);
      if (prodSel) prodSel.addEventListener('change', () => { varSel.innerHTML = varOptions(prodSel.value); });
      $('#bqi-or-new', el).addEventListener('click', () => openNewProduct());
      $('#bqi-or-save', el).addEventListener('click', () => {
        const vid = varSel && varSel.value;
        if (!vid) { toast('Choisissez une variante (ajoutez-en une d\'abord)'); return; }
        const res = cat.attachBarcode(vid, code);
        if (res.ok) { toast(`Code ${code} enregistré`); openInvProduct(prodSel.value); }
        else if (res.reason === 'doublon') toast(`Déjà utilisé par ${res.owner.product.name}`);
        else toast('Enregistrement impossible');
      });
    });
  }

  /* ─── label printing (printer wired to the caisse) ─── */
  function labelForVariant(pid, v) {
    const cat = catDB(); const p = cat.getProduct(pid).product;
    const code = cat.primaryBarcode(v);
    if (!code) return null;
    return { title: p.name, sub: `${v.colorLabel} · ${v.size}`, price: fmtNum(p.priceMAD), code, format: window.KiwiBarcode.isValidEan13(code) ? 'ean13' : 'code128' };
  }
  function printVariantLabel(vid) {
    const cat = catDB();
    let pid = null, v = null;
    for (const p of cat.listProducts({ includeArchived: true })) { const found = cat.listVariants(p.id).find((x) => x.id === vid); if (found) { pid = p.id; v = found; break; } }
    if (!v) return;
    const label = labelForVariant(pid, v);
    if (!label) { toast('Générez d\'abord un EAN-13'); return; }
    window.KiwiBarcode.printLabels([label], { copies: 1 });
    toast('Étiquette envoyée à l\'imprimante');
  }
  function printProductLabels(pid) {
    const cat = catDB(); const d = cat.getProduct(pid); if (!d) return;
    const labels = d.variants.map((v) => labelForVariant(pid, v)).filter(Boolean);
    if (!labels.length) { toast('Aucun code à imprimer — générez au moins un EAN-13'); return; }
    window.KiwiBarcode.printLabels(labels, { copies: 1 });
    toast(`${labels.length} étiquette(s) envoyée(s) à l'imprimante`);
  }

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
