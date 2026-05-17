/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Comptabilité — the accounting agent
 * One surface inside Kiwi AI that does the four jobs a Moroccan café owner
 * otherwise pays four people for:
 *   · Livre            — bookkeeping: every sale & expense, auto-categorised
 *   · États financiers — accountant: compte de résultat, bilan, trésorerie
 *   · TVA & Impôts     — tax: TVA declarations, IS, the DGI deadline calendar
 *   · Paie             — payroll: salaires, CNSS, IR, fiches de paie
 *
 * Pure vanilla, no backend. Figures are mocked but internally coherent and
 * aligned with Café Atlas's P&L (the same numbers Kiwi AI reasons on).
 * Opens as a fullpage drawer; the chat agent can deep-link to any tab.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ─────────────── DATA · Café Atlas · Maarif — Mai 2026 ─────────────── */
  const ACCT = {
    period: 'Mai 2026',
    revenue: 842300,
    cogs: 261000,
    netProfit: 188101,
    cash: 465000,
    entriesThisMonth: 1248,

    /* charges (hors coût matière) */
    opex: [
      ['Charges de personnel', 218000],
      ['Loyer', 56000],
      ['Eau · électricité · gaz', 28000],
      ['Amortissement & remboursement prêt', 42000],
      ['Marketing & divers', 19000],
      ['Assurances & taxes', 15000],
      ['Entretien & équipement', 14500],
      ['Abonnement Kiwi POS', 699],
    ],

    /* grand-livre — répartition + écritures récentes */
    ledgerCats: [
      ['Ventes encaissées', 842300, 'credit'],
      ['Achats matières premières', 261000, 'debit'],
      ['Charges de personnel', 218000, 'debit'],
      ['Charges externes', 117500, 'debit'],
      ['Impôts, taxes & social', 86500, 'debit'],
    ],
    ledger: [
      ['16 mai', 'Ventes du jour · 198 tickets', 'Ventes encaissées', 'credit', 28430],
      ['16 mai', 'Boucherie Hassan Maarif · agneau', 'Achats matières premières', 'debit', 4120],
      ['15 mai', 'Maraîcher El Jadida · légumes', 'Achats matières premières', 'debit', 2870],
      ['15 mai', 'Ventes du jour · 211 tickets', 'Ventes encaissées', 'credit', 30180],
      ['14 mai', 'Loyer du local · mai', 'Charges externes', 'debit', 56000],
      ['14 mai', 'Lydec · électricité & eau', 'Charges externes', 'debit', 9240],
      ['13 mai', 'Ventes du jour · 187 tickets', 'Ventes encaissées', 'credit', 26510],
      ['12 mai', 'Crémerie Aïcha · produits laitiers', 'Achats matières premières', 'debit', 1980],
      ['10 mai', 'Salaires · quinzaine', 'Charges de personnel', 'debit', 90000],
      ['05 mai', 'Acompte TVA · avril', 'Impôts, taxes & social', 'debit', 34880],
      ['03 mai', 'CNSS · cotisations avril', 'Impôts, taxes & social', 'debit', 50100],
      ['02 mai', 'Abonnement Kiwi POS', 'Charges externes', 'debit', 699],
    ],

    /* TVA — restauration sur place à 10 % */
    tva: {
      taux: '10 % (restauration sur place)',
      regime: 'Déclaration mensuelle · régime du débit',
      collectee: 76573,
      deductible: 38264,
      aPayer: 38309,
      echeance: '20 juin 2026',
    },

    /* Impôt sur les sociétés */
    is: {
      resultatImposable: 2257000,   // résultat annuel projeté
      taux: '20 %',
      estimeAnnuel: 451400,
      acompte: { label: '2ᵉ acompte provisionnel', date: '30 juin 2026', montant: 112850 },
    },

    /* calendrier fiscal & social — DGI / CNSS */
    calendar: [
      { date: '20 juin 2026', label: 'Déclaration & paiement TVA · mai', montant: 38309, tag: 'TVA', status: 'à faire' },
      { date: '30 juin 2026', label: 'CNSS · déclaration & paiement mai', montant: 50300, tag: 'CNSS', status: 'à venir' },
      { date: '30 juin 2026', label: '2ᵉ acompte provisionnel · IS', montant: 112850, tag: 'IS', status: 'à venir' },
      { date: '20 juil. 2026', label: 'Déclaration & paiement TVA · juin', montant: null, tag: 'TVA', status: 'à venir' },
      { date: '31 mars 2027', label: 'Déclaration annuelle des résultats · IS', montant: null, tag: 'IS', status: 'à venir' },
    ],

    /* paie — 8 salariés */
    payroll: {
      headcount: 8,
      totalBrut: 180000,
      cnssSalarie: 12132,
      ir: 28018,
      totalNet: 139850,
      cnssEmployeur: 38000,
      masseSalariale: 218000,
      echeance: '30 juin 2026',
      staff: [
        ['Mehdi Tazi', 'Chef de cuisine', 30000, 23300],
        ['Sofia Belkadi', 'Responsable de salle', 27000, 21000],
        ['Youssef Amrani', 'Barista senior', 24000, 18650],
        ['Hamid Jelloul', 'Chef de rang', 22500, 17500],
        ['Imane Fassi', 'Responsable caisse', 21000, 16350],
        ['Fatima Khalki', 'Serveuse', 20000, 15550],
        ['Nadia Srhir', 'Commis de cuisine', 18000, 14000],
        ['Karim Idrissi', 'Plonge & runner', 17500, 13500],
      ],
    },

    /* bilan simplifié — équilibré à 1 000 000 MAD */
    bilan: {
      actif: [
        ['Immobilisations (équipement, net)', 382000],
        ['Stock de matières', 96000],
        ['Créances clients & avances', 57000],
        ['Trésorerie', 465000],
      ],
      passif: [
        ['Capital social', 300000],
        ['Réserves & résultat de l’exercice', 340000],
        ['Dettes fournisseurs', 118000],
        ['Dettes fiscales & sociales', 117000],
        ['Emprunt bancaire', 125000],
      ],
    },

    /* flux de trésorerie · mai */
    flux: { initial: 412000, encaissements: 851000, decaissements: 798000, final: 465000 },
  };

  /* ─────────────── FORMATTING ─────────────── */
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
  const fmtMad = (n) => fmt(n) + ' MAD';
  const sum = (arr, i) => arr.reduce((a, r) => a + r[i], 0);

  /* ═══════════════ STYLES ═══════════════ */
  function injectCss() {
    if (document.getElementById('ac-css')) return;
    const s = document.createElement('style');
    s.id = 'ac-css';
    s.textContent = `
    .ac-drawer .kiwi-drawer { display:flex; flex-direction:column; }
    .ac-drawer .kiwi-drawer-body { flex:1; min-height:0; padding:0 !important; display:flex; flex-direction:column; }
    .ac-drawer .kiwi-drawer-head h3 { font-family:'Instrument Serif',serif; font-weight:400; font-size:28px; }
    .ac-drawer .kiwi-drawer-head p { color:var(--n-500); font-size:12.5px; }

    .ac { display:flex; flex-direction:column; width:100%; height:100%; background:var(--paper);
      --ac-ease:var(--ease-glide,cubic-bezier(.16,1,.30,1)); }

    /* tab strip */
    .ac-tabs { display:flex; gap:4px; padding:10px clamp(16px,6%,80px) 0; border-bottom:1px solid var(--n-200);
      overflow-x:auto; scrollbar-width:none; flex-shrink:0; background:var(--paper); }
    .ac-tabs::-webkit-scrollbar { display:none; }
    .ac-tab { white-space:nowrap; flex-shrink:0; font:inherit; font-size:13px; font-weight:500;
      color:var(--n-500); background:none; border:0; padding:11px 14px 13px; cursor:pointer;
      border-bottom:2px solid transparent; transition:color 140ms; }
    .ac-tab:hover { color:var(--ink); }
    .ac-tab.on { color:var(--atlas); border-bottom-color:var(--atlas); }

    .ac-body { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;
      padding:24px clamp(16px,6%,80px) 60px; }
    .ac-panel { max-width:760px; margin:0 auto; animation:ac-rise 460ms var(--ac-ease) both; }
    @keyframes ac-rise { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

    /* generic pieces */
    .ac-eyebrow { font-size:10.5px; font-weight:600; letter-spacing:.13em; text-transform:uppercase; color:var(--atlas); }
    .ac-h { font-family:'Instrument Serif',serif; font-weight:400; font-size:24px; color:var(--ink); margin:3px 0 2px; }
    .ac-sub { font-size:12.5px; color:var(--n-500); }
    .ac-card { background:#fff; border:1px solid var(--n-200); border-radius:18px; padding:18px 18px;
      box-shadow:0 1px 2px rgba(10,15,13,.04), 0 18px 34px -26px rgba(10,15,13,.2); }
    .ac-card + .ac-card { margin-top:14px; }
    .ac-card-t { font-size:13.5px; font-weight:600; color:var(--ink); display:flex; justify-content:space-between;
      align-items:baseline; gap:10px; }
    .ac-card-s { font-size:11.5px; color:var(--n-500); margin-top:2px; }

    /* status banner */
    .ac-banner { display:flex; gap:12px; align-items:flex-start; padding:15px 16px; border-radius:16px;
      background:linear-gradient(145deg,var(--atlas),var(--riad)); color:#fff; margin-bottom:18px; }
    .ac-banner svg { width:20px; height:20px; flex-shrink:0; color:var(--mint); margin-top:1px; }
    .ac-banner b { font-weight:600; }
    .ac-banner .s { font-size:12px; opacity:.85; margin-top:3px; line-height:1.45; }

    /* module grid (Aperçu) */
    .ac-mods { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .ac-mod { text-align:start; background:#fff; border:1px solid var(--n-200); border-radius:16px;
      padding:16px 15px; cursor:pointer; font:inherit; transition:transform 140ms var(--ac-ease), border-color 140ms;
      box-shadow:0 1px 2px rgba(10,15,13,.04), 0 14px 26px -22px rgba(10,15,13,.2); }
    .ac-mod:hover { border-color:var(--atlas); }
    .ac-mod:active { transform:scale(.975); }
    .ac-mod-ico { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center;
      background:var(--paper-soft); color:var(--atlas); margin-bottom:10px; }
    .ac-mod-ico svg { width:18px; height:18px; }
    .ac-mod-n { font-size:13px; font-weight:600; color:var(--ink); }
    .ac-mod-v { font-size:17px; font-weight:600; color:var(--ink); margin-top:7px; letter-spacing:-.02em;
      font-variant-numeric:tabular-nums; }
    .ac-mod-s { font-size:11px; color:var(--n-500); margin-top:3px; line-height:1.4; }

    /* rows / lines */
    .ac-row { display:flex; justify-content:space-between; align-items:baseline; gap:12px;
      padding:11px 0; border-bottom:1px solid var(--n-200); }
    .ac-row:last-child { border-bottom:0; }
    .ac-row .k { font-size:12.5px; color:var(--n-600); }
    .ac-row .k small { display:block; font-size:11px; color:var(--n-500); margin-top:2px; }
    .ac-row .v { font-size:13px; font-weight:600; color:var(--ink); font-variant-numeric:tabular-nums;
      text-align:end; white-space:nowrap; }
    .ac-row.total { border-top:2px solid var(--ink); border-bottom:0; padding-top:13px; margin-top:3px; }
    .ac-row.total .k { font-weight:600; color:var(--ink); font-size:13.5px; }
    .ac-row.total .v { font-size:17px; color:var(--atlas); }
    .ac-row.neg .v { color:var(--n-600); }

    /* big stat trio */
    .ac-trio { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:4px; }
    .ac-trio .t { background:var(--paper-soft); border-radius:12px; padding:11px 12px; }
    .ac-trio .t .l { font-size:9.5px; font-weight:600; letter-spacing:.07em; text-transform:uppercase; color:var(--n-500); }
    .ac-trio .t .n { font-size:16px; font-weight:600; margin-top:4px; color:var(--ink); font-variant-numeric:tabular-nums; }
    .ac-trio .t.hl { background:rgba(11,110,79,.09); }
    .ac-trio .t.hl .n { color:var(--atlas); }

    /* category bars */
    .ac-bar { margin-top:11px; }
    .ac-bar-h { display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px; }
    .ac-bar-h .k { color:var(--n-600); }
    .ac-bar-h .v { font-weight:600; color:var(--ink); font-variant-numeric:tabular-nums; }
    .ac-bar-t { height:7px; border-radius:999px; background:var(--n-200); overflow:hidden; }
    .ac-bar-f { height:100%; border-radius:999px; }

    /* ledger feed */
    .ac-led { display:flex; gap:12px; align-items:baseline; padding:12px 2px; border-bottom:1px solid var(--n-200); }
    .ac-led:last-child { border-bottom:0; }
    .ac-led .d { font-size:11px; color:var(--n-500); font-variant-numeric:tabular-nums; width:48px; flex-shrink:0; }
    .ac-led .m { flex:1; min-width:0; }
    .ac-led .m .lib { font-size:13px; color:var(--ink); }
    .ac-led .m .cat { font-size:11px; color:var(--n-500); margin-top:2px; display:flex; align-items:center; gap:5px; }
    .ac-led .m .cat::before { content:""; width:6px; height:6px; border-radius:50%; background:var(--atlas); }
    .ac-led .amt { font-size:13.5px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .ac-led .amt.credit { color:var(--atlas); }
    .ac-led .amt.debit { color:var(--n-700); }

    /* tax calendar */
    .ac-cal { display:flex; gap:13px; padding:13px 2px; border-bottom:1px solid var(--n-200); align-items:flex-start; }
    .ac-cal:last-child { border-bottom:0; }
    .ac-cal-tag { font-size:10px; font-weight:700; letter-spacing:.04em; padding:4px 8px; border-radius:7px;
      background:var(--paper-soft); color:var(--atlas); flex-shrink:0; min-width:46px; text-align:center; }
    .ac-cal-m { flex:1; min-width:0; }
    .ac-cal-m .l { font-size:13px; color:var(--ink); font-weight:500; }
    .ac-cal-m .d { font-size:11.5px; color:var(--n-500); margin-top:2px; }
    .ac-cal-r { text-align:end; white-space:nowrap; }
    .ac-cal-r .a { font-size:13px; font-weight:600; color:var(--ink); font-variant-numeric:tabular-nums; }
    .ac-cal-r .st { font-size:10px; font-weight:600; margin-top:3px; }
    .ac-cal-r .st.todo { color:#b07c00; }
    .ac-cal-r .st.soon { color:var(--n-500); }

    /* attention list */
    .ac-todo { display:flex; gap:11px; align-items:center; width:100%; text-align:start; font:inherit;
      background:#fff; border:1px solid var(--n-200); border-radius:13px; padding:13px 14px; cursor:pointer;
      transition:border-color 140ms; }
    .ac-todo + .ac-todo { margin-top:9px; }
    .ac-todo:hover { border-color:var(--atlas); }
    .ac-todo .dot { width:8px; height:8px; border-radius:50%; background:#d69e2e; flex-shrink:0; }
    .ac-todo .tx { flex:1; min-width:0; }
    .ac-todo .tx .l { font-size:13px; font-weight:500; color:var(--ink); }
    .ac-todo .tx .s { font-size:11.5px; color:var(--n-500); margin-top:1px; }
    .ac-todo .go { color:var(--n-400); flex-shrink:0; }

    /* staff rows */
    .ac-staff { display:flex; gap:12px; align-items:center; padding:12px 2px; border-bottom:1px solid var(--n-200); }
    .ac-staff:last-child { border-bottom:0; }
    .ac-staff .av { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center;
      justify-content:center; background:linear-gradient(135deg,var(--atlas),var(--riad)); color:#fff;
      font-size:12px; font-weight:600; }
    .ac-staff .who { flex:1; min-width:0; }
    .ac-staff .who .n { font-size:13px; font-weight:500; color:var(--ink); }
    .ac-staff .who .p { font-size:11.5px; color:var(--n-500); margin-top:1px; }
    .ac-staff .pay { text-align:end; white-space:nowrap; }
    .ac-staff .pay .net { font-size:13.5px; font-weight:600; color:var(--ink); font-variant-numeric:tabular-nums; }
    .ac-staff .pay .brut { font-size:11px; color:var(--n-500); margin-top:1px; }

    /* insight + actions */
    .ac-insight { margin-top:14px; padding:13px 15px; background:var(--atlas); color:var(--paper);
      border-radius:13px; font-size:12.5px; line-height:1.5; display:flex; gap:10px; }
    .ac-insight svg { width:16px; height:16px; color:var(--mint); flex-shrink:0; margin-top:2px; }
    .ac-acts { display:flex; flex-wrap:wrap; gap:9px; margin-top:16px; }
    .ac-btn { font-size:12.5px; font-weight:600; padding:11px 16px; border-radius:11px; cursor:pointer;
      border:1px solid var(--n-300); background:#fff; color:var(--ink); transition:all 140ms var(--ac-ease); }
    .ac-btn:hover { border-color:var(--n-400); }
    .ac-btn:active { transform:scale(.97); }
    .ac-btn.primary { background:var(--atlas); border-color:var(--atlas); color:#fff; }
    .ac-btn.primary:hover { background:var(--riad); }

    .ac-section-h { font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
      color:var(--n-500); margin:22px 0 9px; }
    .ac-section-h:first-child { margin-top:0; }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════ ICONS ═══════════════ */
  const I = {
    livre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M9 3v18M19 7H9M19 12H9"/></svg>',
    etats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="11" width="3.4" height="7"/><rect x="13" y="6" width="3.4" height="12"/></svg>',
    tva: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7h7M9 12h7M9 17h4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>',
    paie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.6l2.55 6.86 6.85 2.54-6.85 2.55L12 22.4l-2.55-6.85L2.6 13l6.85-2.54z"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>',
  };

  /* ═══════════════ TAB RENDERERS ═══════════════ */

  function renderApercu() {
    const mod = (tab, ico, name, val, sub) =>
      `<button class="ac-mod" data-ac-goto="${tab}">
        <div class="ac-mod-ico">${ico}</div>
        <div class="ac-mod-n">${name}</div>
        <div class="ac-mod-v">${val}</div>
        <div class="ac-mod-s">${sub}</div>
      </button>`;
    const todo = (tab, l, s) =>
      `<button class="ac-todo" data-ac-goto="${tab}">
        <span class="dot"></span>
        <span class="tx"><span class="l">${l}</span><span class="s">${s}</span></span>
        <span class="go">${I.chev}</span>
      </button>`;
    return `
      <div class="ac-banner">
        ${I.spark}
        <div>
          <b>Comptabilité à jour pour ${ACCT.period}.</b>
          <div class="s">Kiwi a enregistré et catégorisé ${fmt(ACCT.entriesThisMonth)} écritures ce mois. 3 actions demandent votre validation avant les échéances DGI.</div>
        </div>
      </div>
      <div class="ac-mods">
        ${mod('livre', I.livre, 'Livre comptable', fmt(ACCT.entriesThisMonth), 'écritures · 100 % catégorisées')}
        ${mod('etats', I.etats, 'États financiers', fmtMad(ACCT.netProfit), 'résultat net du mois')}
        ${mod('tva', I.tva, 'TVA & Impôts', fmtMad(ACCT.tva.aPayer), 'TVA à payer · 20 juin')}
        ${mod('paie', I.paie, 'Paie', ACCT.payroll.headcount + ' salariés', 'paie de mai prête à valider')}
      </div>
      <div class="ac-section-h">À valider avant échéance</div>
      ${todo('tva', 'Déclaration TVA · mai', `${fmtMad(ACCT.tva.aPayer)} · échéance ${ACCT.tva.echeance}`)}
      ${todo('paie', 'Fiches de paie · mai', `${ACCT.payroll.headcount} salariés · ${fmtMad(ACCT.payroll.totalNet)} net à verser`)}
      ${todo('etats', 'Clôture comptable · mai', 'Rapprochement bancaire — 2 écarts à lever')}
      <div class="ac-insight">${I.spark}<div><b style="color:var(--mint);">Kiwi AI :</b> tout est prêt. Dites-moi « prépare ma déclaration TVA » ou « génère les fiches de paie » et je m’en occupe.</div></div>
    `;
  }

  function renderLivre() {
    const catMax = Math.max(...ACCT.ledgerCats.map((c) => c[1]));
    const bars = ACCT.ledgerCats.map(([k, v, type]) => `
      <div class="ac-bar">
        <div class="ac-bar-h"><span class="k">${k}</span><span class="v">${fmtMad(v)}</span></div>
        <div class="ac-bar-t"><div class="ac-bar-f" style="width:${(v / catMax * 100).toFixed(1)}%;background:${type === 'credit' ? 'var(--atlas)' : '#9aa6a0'};"></div></div>
      </div>`).join('');
    const feed = ACCT.ledger.map(([d, lib, cat, type, amt]) => `
      <div class="ac-led">
        <span class="d">${d}</span>
        <span class="m"><span class="lib">${lib}</span><span class="cat">${cat}</span></span>
        <span class="amt ${type}">${type === 'credit' ? '+' : '−'} ${fmt(amt)}</span>
      </div>`).join('');
    return `
      <div class="ac-eyebrow">Teneur de livres</div>
      <div class="ac-h">Grand livre · ${ACCT.period}</div>
      <div class="ac-sub">Chaque vente et chaque dépense, enregistrée et classée automatiquement.</div>
      <div class="ac-card" style="margin-top:16px;">
        <div class="ac-card-t"><span>Répartition par catégorie</span><span>${fmt(ACCT.entriesThisMonth)} écritures</span></div>
        ${bars}
      </div>
      <div class="ac-card">
        <div class="ac-card-t"><span>Écritures récentes</span><span style="color:var(--atlas);">100 % auto</span></div>
        <div class="ac-card-s">Catégorisées par Kiwi — aucune saisie manuelle.</div>
        <div style="margin-top:8px;">${feed}</div>
      </div>
      <div class="ac-acts">
        <button class="ac-btn primary" data-ac-act="export-livre">Exporter le grand livre</button>
        <button class="ac-btn" data-ac-act="reconcile">Rapprochement bancaire</button>
      </div>
    `;
  }

  function renderEtats() {
    const gross = ACCT.revenue - ACCT.cogs;
    const opexLines = ACCT.opex.map(([k, v]) =>
      `<div class="ac-row neg"><span class="k">${k}</span><span class="v">− ${fmt(v)}</span></div>`).join('');
    const actif = ACCT.bilan.actif.map(([k, v]) => `<div class="ac-row"><span class="k">${k}</span><span class="v">${fmt(v)}</span></div>`).join('');
    const passif = ACCT.bilan.passif.map(([k, v]) => `<div class="ac-row"><span class="k">${k}</span><span class="v">${fmt(v)}</span></div>`).join('');
    const totActif = sum(ACCT.bilan.actif, 1), totPassif = sum(ACCT.bilan.passif, 1);
    const f = ACCT.flux;
    return `
      <div class="ac-eyebrow">Comptable</div>
      <div class="ac-h">États financiers · ${ACCT.period}</div>
      <div class="ac-sub">Compte de résultat, bilan et trésorerie — générés en continu.</div>

      <div class="ac-section-h">Compte de résultat</div>
      <div class="ac-card">
        <div class="ac-row"><span class="k">Chiffre d’affaires</span><span class="v">${fmt(ACCT.revenue)}</span></div>
        <div class="ac-row neg"><span class="k">Coût des matières</span><span class="v">− ${fmt(ACCT.cogs)}</span></div>
        <div class="ac-row"><span class="k"><b>Marge brute</b></span><span class="v">${fmt(gross)}</span></div>
        ${opexLines}
        <div class="ac-row total"><span class="k">Résultat net</span><span class="v">${fmtMad(ACCT.netProfit)}</span></div>
      </div>

      <div class="ac-section-h">Bilan</div>
      <div class="ac-card">
        <div class="ac-card-t"><span>Actif</span><span>${fmtMad(totActif)}</span></div>
        <div style="margin-top:4px;">${actif}</div>
      </div>
      <div class="ac-card">
        <div class="ac-card-t"><span>Passif</span><span>${fmtMad(totPassif)}</span></div>
        <div style="margin-top:4px;">${passif}</div>
      </div>

      <div class="ac-section-h">Trésorerie · mai</div>
      <div class="ac-card">
        <div class="ac-row"><span class="k">Solde au 1ᵉʳ mai</span><span class="v">${fmt(f.initial)}</span></div>
        <div class="ac-row"><span class="k">Encaissements</span><span class="v" style="color:var(--atlas);">+ ${fmt(f.encaissements)}</span></div>
        <div class="ac-row neg"><span class="k">Décaissements</span><span class="v">− ${fmt(f.decaissements)}</span></div>
        <div class="ac-row total"><span class="k">Trésorerie disponible</span><span class="v">${fmtMad(f.final)}</span></div>
      </div>
      <div class="ac-acts">
        <button class="ac-btn primary" data-ac-act="cloture">Clôturer le mois</button>
        <button class="ac-btn" data-ac-act="export-etats">Exporter (PDF · comptable)</button>
      </div>
    `;
  }

  function renderTva() {
    const t = ACCT.tva, is = ACCT.is;
    const cal = ACCT.calendar.map((c) => `
      <div class="ac-cal">
        <span class="ac-cal-tag">${c.tag}</span>
        <span class="ac-cal-m"><span class="l">${c.label}</span><span class="d">Échéance ${c.date}</span></span>
        <span class="ac-cal-r">
          <span class="a">${c.montant != null ? fmtMad(c.montant) : '—'}</span>
          <span class="st ${c.status === 'à faire' ? 'todo' : 'soon'}">${c.status === 'à faire' ? 'À FAIRE' : 'À VENIR'}</span>
        </span>
      </div>`).join('');
    return `
      <div class="ac-eyebrow">Fiscaliste</div>
      <div class="ac-h">TVA & Impôts · ${ACCT.period}</div>
      <div class="ac-sub">Déclarations, acomptes et échéances DGI — préparés, jamais en retard.</div>

      <div class="ac-card" style="margin-top:16px;">
        <div class="ac-card-t"><span>TVA · ${ACCT.period}</span><span style="color:#b07c00;">échéance ${t.echeance}</span></div>
        <div class="ac-card-s">${t.regime} · ${t.taux}</div>
        <div class="ac-trio">
          <div class="t"><div class="l">Collectée</div><div class="n">${fmt(t.collectee)}</div></div>
          <div class="t"><div class="l">Déductible</div><div class="n">${fmt(t.deductible)}</div></div>
          <div class="t hl"><div class="l">À payer</div><div class="n">${fmt(t.aPayer)}</div></div>
        </div>
      </div>

      <div class="ac-card">
        <div class="ac-card-t"><span>Impôt sur les sociétés</span><span>taux ${is.taux}</span></div>
        <div class="ac-row"><span class="k">Résultat imposable projeté · 2026</span><span class="v">${fmt(is.resultatImposable)}</span></div>
        <div class="ac-row"><span class="k">IS estimé · exercice</span><span class="v">${fmtMad(is.estimeAnnuel)}</span></div>
        <div class="ac-row"><span class="k">${is.acompte.label}<small>${is.acompte.date}</small></span><span class="v">${fmtMad(is.acompte.montant)}</span></div>
      </div>

      <div class="ac-section-h">Calendrier fiscal & social</div>
      <div class="ac-card">${cal}</div>

      <div class="ac-insight">${I.spark}<div><b style="color:var(--mint);">Kiwi AI :</b> votre TVA de mai est prête. Je peux pré-remplir la déclaration au format DGI/SIMPL — il ne vous reste qu’à signer.</div></div>
      <div class="ac-acts">
        <button class="ac-btn primary" data-ac-act="prep-tva">Préparer la déclaration TVA</button>
        <button class="ac-btn" data-ac-act="export-tva">Exporter pour la DGI</button>
      </div>
    `;
  }

  function renderPaie() {
    const p = ACCT.payroll;
    const staff = p.staff.map(([n, poste, brut, net]) => {
      const ini = n.split(' ').map((w) => w[0]).join('').slice(0, 2);
      return `<div class="ac-staff">
        <span class="av">${ini}</span>
        <span class="who"><span class="n">${n}</span><span class="p">${poste}</span></span>
        <span class="pay"><span class="net">${fmtMad(net)}</span><span class="brut">brut ${fmt(brut)}</span></span>
      </div>`;
    }).join('');
    return `
      <div class="ac-eyebrow">Gestionnaire de paie</div>
      <div class="ac-h">Paie · ${ACCT.period}</div>
      <div class="ac-sub">${p.headcount} salariés · masse salariale ${fmtMad(p.masseSalariale)}.</div>

      <div class="ac-card" style="margin-top:16px;">
        <div class="ac-card-t"><span>Bulletin de paie du mois</span><span style="color:#b07c00;">à valider</span></div>
        <div class="ac-card-s">CNSS & IR calculés automatiquement.</div>
        <div class="ac-row"><span class="k">Total brut</span><span class="v">${fmt(p.totalBrut)}</span></div>
        <div class="ac-row neg"><span class="k">CNSS salariés (6,74 %)</span><span class="v">− ${fmt(p.cnssSalarie)}</span></div>
        <div class="ac-row neg"><span class="k">Impôt sur le revenu (IR)</span><span class="v">− ${fmt(p.ir)}</span></div>
        <div class="ac-row total"><span class="k">Net à verser</span><span class="v">${fmtMad(p.totalNet)}</span></div>
        <div class="ac-row" style="border-top:1px solid var(--n-200);margin-top:6px;"><span class="k">CNSS employeur (21,09 %)</span><span class="v">${fmt(p.cnssEmployeur)}</span></div>
      </div>

      <div class="ac-card">
        <div class="ac-card-t"><span>Salariés</span><span>${p.headcount} personnes</span></div>
        <div style="margin-top:6px;">${staff}</div>
      </div>

      <div class="ac-insight">${I.spark}<div><b style="color:var(--mint);">Kiwi AI :</b> la déclaration CNSS de mai (${fmtMad(p.cnssEmployeur + p.cnssSalarie)}) est due le ${p.echeance}. Je peux la générer dès la validation des fiches.</div></div>
      <div class="ac-acts">
        <button class="ac-btn primary" data-ac-act="gen-paie">Générer les ${p.headcount} fiches de paie</button>
        <button class="ac-btn" data-ac-act="decl-cnss">Déclarer la CNSS</button>
      </div>
    `;
  }

  const TABS = [
    ['apercu', 'Aperçu', renderApercu],
    ['livre', 'Livre', renderLivre],
    ['etats', 'États financiers', renderEtats],
    ['tva', 'TVA & Impôts', renderTva],
    ['paie', 'Paie', renderPaie],
  ];

  const ACT_TOASTS = {
    'export-livre': ['Grand livre exporté', 'Format FEC + Excel · envoyé à votre comptable et à vous.'],
    'reconcile': ['Rapprochement bancaire lancé', '2 écarts détectés · Kiwi propose une correction pour chacun.'],
    'cloture': ['Clôture de mai initiée', 'Écritures verrouillées · états financiers figés pour la période.'],
    'export-etats': ['États financiers exportés', 'Compte de résultat + bilan en PDF, prêts pour le comptable.'],
    'prep-tva': ['Déclaration TVA préparée', 'Pré-remplie au format SIMPL · il ne reste qu’à la signer sur le portail DGI.'],
    'export-tva': ['Déclaration TVA exportée', 'Fichier conforme DGI généré pour la période de mai.'],
    'gen-paie': ['8 fiches de paie générées', 'Bulletins PDF prêts · notification WhatsApp envoyée à l’équipe.'],
    'decl-cnss': ['Déclaration CNSS préparée', 'Bordereau de mai prêt pour le portail Damancom.'],
  };

  /* ═══════════════ OPEN ═══════════════ */
  function open(tab) {
    const Kiwi = window.Kiwi;
    if (!Kiwi || !Kiwi.drawer) return;
    injectCss();

    const body = `
      <div class="ac">
        <div class="ac-tabs" data-ac-tabs>
          ${TABS.map(([id, label], i) => `<button class="ac-tab${i === 0 ? ' on' : ''}" data-ac-tab="${id}">${label}</button>`).join('')}
        </div>
        <div class="ac-body" data-ac-body>
          ${TABS.map(([id, , render], i) => `<section class="ac-panel" data-ac-panel="${id}"${i === 0 ? '' : ' hidden'}>${render()}</section>`).join('')}
        </div>
      </div>`;

    const res = Kiwi.drawer({
      title: 'Comptabilité',
      subtitle: 'Comptable · teneur de livres · fiscaliste · gestionnaire de paie — réunis',
      body,
      fullpage: true,
    });
    res.el.classList.add('ac-drawer');
    const root = res.el;
    const bodyEl = root.querySelector('[data-ac-body]');

    function activate(id) {
      root.querySelectorAll('.ac-tab').forEach((t) => t.classList.toggle('on', t.dataset.acTab === id));
      root.querySelectorAll('[data-ac-panel]').forEach((p) => { p.hidden = p.dataset.acPanel !== id; });
      const panel = root.querySelector(`[data-ac-panel="${id}"]`);
      if (panel) { panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = ''; }
      if (bodyEl) bodyEl.scrollTop = 0;
    }

    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-ac-tab]');
      if (tab) { activate(tab.dataset.acTab); return; }
      const goto = e.target.closest('[data-ac-goto]');
      if (goto) { activate(goto.dataset.acGoto); return; }
      const act = e.target.closest('[data-ac-act]');
      if (act) {
        const t = ACT_TOASTS[act.dataset.acAct];
        if (t && Kiwi.toast) Kiwi.toast(t[0], { type: 'success', desc: t[1] });
        return;
      }
    });

    if (tab && tab !== 'apercu') activate(tab);
  }

  /* ─────────────── REGISTER ─────────────── */
  function register() {
    if (!window.Kiwi || !window.Kiwi.handlers) { setTimeout(register, 80); return; }
    const h = window.Kiwi.handlers;
    h['open-comptabilite'] = () => open('apercu');
    h['acct-livre'] = () => open('livre');
    h['acct-etats'] = () => open('etats');
    h['acct-tva']  = () => open('tva');
    h['acct-paie'] = () => open('paie');
    window.KiwiComptable = { open, data: ACCT };
  }
  register();
})();
