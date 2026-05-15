/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · dashboard-extra.js — three owner screens flagged missing in the audit
 *
 *   1 · view-suppliers     Fournisseurs & commandes  (supplier + PO history)
 *   2 · view-margins       Marges & rentabilité      (per-product COGS/margin)
 *   3 · add-integration    Intégrations              (connect / configure)
 *
 * Loads after pages-pro.js. Reuses the shared drawer factory (Kiwi.drawer) and
 * the shared CSS vocabulary injected by pages.js (.p-hero, .p-table, .p-card,
 * .chip, .kb). FR-only content, matching the existing pro drawers.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const toast = Kiwi.toast;

  /* Close any drawer already open before opening a new one. The legacy nav
   * handlers don't do this (see DASHBOARD_AUDIT.md); these screens do, so
   * switching into them from another drawer always works in one click. */
  function closeOpenDrawers() {
    document.querySelectorAll('.kiwi-drawer-backdrop').forEach((el) => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 280);
    });
    window.__kiwiScrollLocks = 0;
    document.documentElement.classList.remove('kiwi-locked');
  }

  const money = (n) => n.toLocaleString('fr-FR') + ' MAD';

  /* ═══════════════════════════════════════════════════════════════════════
   * 1 · FOURNISSEURS & COMMANDES
   *   Supplier directory + purchase-order history. Expands the lone
   *   "Commander en 1 clic" CTA on the dashboard into a real purchasing view.
   * ═══════════════════════════════════════════════════════════════════════ */
  const SUPPLIERS = [
    { name: 'Cuisine Centrale',    cat: 'Plats préparés · surgelés', lead: '24 h', last: '2 mai',  reliab: 98, openPo: 1 },
    { name: 'Bidaoui',             cat: 'Thé · épicerie sèche',      lead: '48 h', last: '28 avr.', reliab: 95, openPo: 1 },
    { name: 'Maison Lait',         cat: 'Produits laitiers',         lead: '24 h', last: '6 mai',  reliab: 91, openPo: 0 },
    { name: 'Métro Cash & Carry',  cat: 'Gros · multi-catégories',   lead: 'Retrait', last: '4 mai', reliab: 99, openPo: 0 },
    { name: 'Marché Central',      cat: 'Fruits & légumes frais',    lead: 'Quotidien', last: '15 mai', reliab: 88, openPo: 1 },
  ];
  const PURCHASE_ORDERS = [
    { id: 'BC-2026-0142', sup: 'Marché Central',   date: '15 mai',  amount: 1240, status: 'draft'   },
    { id: 'BC-2026-0141', sup: 'Cuisine Centrale', date: '14 mai',  amount: 3680, status: 'transit' },
    { id: 'BC-2026-0140', sup: 'Bidaoui',          date: '13 mai',  amount: 1200, status: 'transit' },
    { id: 'BC-2026-0138', sup: 'Maison Lait',      date: '6 mai',   amount: 840,  status: 'received' },
    { id: 'BC-2026-0137', sup: 'Métro Cash & Carry', date: '4 mai', amount: 5210, status: 'received' },
    { id: 'BC-2026-0135', sup: 'Cuisine Centrale', date: '2 mai',   amount: 4070, status: 'received' },
  ];
  const PO_STATUS = {
    draft:    { cls: 'pend',    label: 'Brouillon' },
    transit:  { cls: 'info-soft', label: 'En transit' },
    received: { cls: 'ok',      label: 'Reçu' },
  };

  handlers['view-suppliers'] = () => {
    closeOpenDrawers();
    const openPo = PURCHASE_ORDERS.filter((p) => p.status !== 'received').length;
    const monthSpend = PURCHASE_ORDERS.reduce((s, p) => s + p.amount, 0);

    drawer({
      title: 'Fournisseurs & commandes',
      subtitle: `${SUPPLIERS.length} fournisseurs · ${openPo} commandes en cours · ${money(monthSpend)} ce mois`,
      width: 840,
      body: `
        <div class="p-hero">
          <div class="l">Approvisionnement · Café Atlas</div>
          <div class="big">${money(monthSpend)}</div>
          <div class="sub">${PURCHASE_ORDERS.length} bons de commande ce mois · ${openPo} en attente de réception</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin:4px 0 10px;">
          <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase;">Fournisseurs</div>
          <button class="kb atlas xs" data-action="supplier-new-po">+ Nouveau bon de commande</button>
        </div>

        ${SUPPLIERS.map((s) => `
          <div class="p-card" style="margin-bottom:8px;">
            <div style="display:grid; grid-template-columns:1fr auto; gap:14px; align-items:center;">
              <div>
                <div style="font-weight:600; font-size:14.5px;">${s.name}${s.openPo ? ` <span class="chip info-soft" style="font-size:10px; padding:1px 7px;">${s.openPo} en cours</span>` : ''}</div>
                <div style="font-size:11.5px; color:var(--n-500); margin-top:3px;">${s.cat} · délai ${s.lead} · dernière commande ${s.last}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--mono); font-size:13px; font-weight:600; color:${s.reliab >= 95 ? 'var(--success)' : 'var(--warning)'};">${s.reliab}%</div>
                <div style="font-family:var(--mono); font-size:10px; color:var(--n-500);">fiabilité</div>
              </div>
            </div>
          </div>
        `).join('')}

        <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase; margin:18px 0 8px;">Historique des bons de commande</div>
        <table class="p-table">
          <thead><tr><th>Réf.</th><th>Fournisseur</th><th>Date</th><th class="right">Montant</th><th>Statut</th></tr></thead>
          <tbody>
            ${PURCHASE_ORDERS.map((p) => `
              <tr data-action="supplier-po-detail" data-arg="${p.id}">
                <td class="mono">${p.id}</td>
                <td>${p.sup}</td>
                <td>${p.date}</td>
                <td class="mono right">${money(p.amount)}</td>
                <td><span class="chip ${PO_STATUS[p.status].cls}">${PO_STATUS[p.status].label}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `,
    });
  };

  handlers['supplier-new-po'] = () =>
    toast('Nouveau bon de commande', { type: 'info', desc: 'Sélection du fournisseur et des articles' });
  handlers['supplier-po-detail'] = (_el, arg) =>
    toast(`Bon de commande ${arg || ''}`.trim(), { type: 'info', desc: 'Détail des articles et suivi de livraison' });

  /* ═══════════════════════════════════════════════════════════════════════
   * 2 · MARGES & RENTABILITÉ
   *   Per-product COGS and contribution margin — the profitability view the
   *   dashboard's revenue tiles never break down.
   * ═══════════════════════════════════════════════════════════════════════ */
  const PRODUCTS = [
    { name: 'Café espresso',      price: 18, cost: 4.2,  sold: 96 },
    { name: 'Thé à la menthe',    price: 15, cost: 3.1,  sold: 78 },
    { name: 'Msemen',             price: 12, cost: 3.5,  sold: 54 },
    { name: 'Jus d\'orange',      price: 22, cost: 9.0,  sold: 41 },
    { name: 'Salade marocaine',   price: 35, cost: 11.0, sold: 33 },
    { name: 'Pastilla au poulet', price: 65, cost: 28.0, sold: 24 },
    { name: 'Tajine kefta',       price: 75, cost: 34.0, sold: 19 },
    { name: 'Couscous vendredi',  price: 90, cost: 47.0, sold: 12 },
  ];

  handlers['view-margins'] = () => {
    closeOpenDrawers();
    const rows = PRODUCTS.map((p) => {
      const marginMad = p.price - p.cost;
      const marginPct = Math.round((marginMad / p.price) * 100);
      const contribution = marginMad * p.sold;
      return { ...p, marginMad, marginPct, contribution };
    }).sort((a, b) => b.contribution - a.contribution);

    const grossProfit = rows.reduce((s, r) => s + r.contribution, 0);
    const revenue = rows.reduce((s, r) => s + r.price * r.sold, 0);
    const avgMargin = Math.round((grossProfit / revenue) * 100);
    const best = rows[0];
    const worst = [...rows].sort((a, b) => a.marginPct - b.marginPct)[0];

    drawer({
      title: 'Marges & rentabilité',
      subtitle: `Marge moyenne ${avgMargin}% · profit brut ${money(grossProfit)} aujourd'hui`,
      width: 860,
      body: `
        <div class="p-hero">
          <div class="l">Profit brut · aujourd'hui</div>
          <div class="big">${money(grossProfit)}</div>
          <div class="sub">Sur ${money(revenue)} de ventes · marge moyenne pondérée ${avgMargin}%</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
          <div class="p-card" style="margin:0;">
            <div style="font-size:11px; color:var(--n-500); font-family:var(--mono); letter-spacing:0.06em;">MEILLEUR CONTRIBUTEUR</div>
            <div style="font-weight:600; font-size:15px; margin-top:6px;">${best.name}</div>
            <div style="font-size:12px; color:var(--success); margin-top:2px;">${money(Math.round(best.contribution))} · marge ${best.marginPct}%</div>
          </div>
          <div class="p-card" style="margin:0;">
            <div style="font-size:11px; color:var(--n-500); font-family:var(--mono); letter-spacing:0.06em;">MARGE LA PLUS FAIBLE</div>
            <div style="font-weight:600; font-size:15px; margin-top:6px;">${worst.name}</div>
            <div style="font-size:12px; color:var(--warning); margin-top:2px;">marge ${worst.marginPct}% · à revoir le prix ou le coût</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase;">Détail par produit</div>
          <button class="kb ghost xs" data-action="margin-export">Exporter en CSV</button>
        </div>
        <table class="p-table">
          <thead><tr>
            <th>Produit</th><th class="right">Prix</th><th class="right">Coût</th>
            <th class="right">Marge</th><th class="right">Marge %</th>
            <th class="right">Vendus</th><th class="right">Contribution</th>
          </tr></thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td>${r.name}</td>
                <td class="mono right">${r.price.toFixed(2)}</td>
                <td class="mono right">${r.cost.toFixed(2)}</td>
                <td class="mono right">${r.marginMad.toFixed(2)}</td>
                <td class="right"><span class="chip ${r.marginPct >= 65 ? 'ok' : 'pend'}">${r.marginPct}%</span></td>
                <td class="mono right">${r.sold}</td>
                <td class="mono right">${money(Math.round(r.contribution))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="font-size:11.5px; color:var(--n-500); margin-top:12px;">
          Coût des marchandises (CMV) estimé à partir des fiches recette et des derniers prix fournisseurs. Mettez à jour les coûts depuis l'écran Fournisseurs.
        </div>
      `,
    });
  };

  handlers['margin-export'] = () => {
    const header = 'Produit,Prix,Cout,Marge,Marge%,Vendus\n';
    const lines = PRODUCTS.map((p) => {
      const m = (p.price - p.cost).toFixed(2);
      const pct = Math.round(((p.price - p.cost) / p.price) * 100);
      return `${p.name},${p.price},${p.cost},${m},${pct},${p.sold}`;
    }).join('\n');
    const blob = new Blob([header + lines], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kiwi-marges.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Export CSV téléchargé', { type: 'success' });
  };

  /* ═══════════════════════════════════════════════════════════════════════
   * 3 · INTÉGRATIONS
   *   Manage connected tools + connect new ones. Wires the previously-dead
   *   "+ Ajouter une intégration" link (data-action="add-integration").
   * ═══════════════════════════════════════════════════════════════════════ */
  const INTEGRATIONS_ON = [
    { name: 'Glovo',         color: '#F29137', tag: 'G', desc: 'Commandes & payouts livraison', sync: 'il y a 4 min' },
    { name: 'Jumia Food',    color: '#E7611A', tag: 'J', desc: 'Commandes livraison',            sync: 'il y a 9 min' },
    { name: 'Comptabilité',  color: '#1D3F6B', tag: 'A', desc: 'Export quotidien OCP-compliant', sync: 'hier 23:00' },
    { name: 'BMCE · Banque', color: '#00613E', tag: 'B', desc: 'Rapprochement IBAN ···3291',     sync: 'il y a 1 h' },
  ];
  const INTEGRATIONS_OFF = [
    { name: 'Kaalix',          color: '#7A3FF2', tag: 'K', desc: 'Livraison · régions Casa & Rabat' },
    { name: 'WhatsApp Business', color: '#1FB574', tag: 'W', desc: 'Reçus & liens de paiement clients' },
    { name: 'Export CSV / Excel', color: '#3A6FB8', tag: 'X', desc: 'Sortie comptable sur mesure' },
  ];

  handlers['add-integration'] = () => {
    closeOpenDrawers();
    drawer({
      title: 'Intégrations',
      subtitle: `${INTEGRATIONS_ON.length} connectées · ${INTEGRATIONS_OFF.length} disponibles`,
      width: 720,
      body: `
        <div class="p-hero">
          <div class="l">Connecteurs · Café Atlas</div>
          <div class="big">${INTEGRATIONS_ON.length} actives</div>
          <div class="sub">Kiwi synchronise commandes, payouts et comptabilité automatiquement</div>
        </div>

        <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase; margin:4px 0 8px;">Connectées</div>
        ${INTEGRATIONS_ON.map((i) => `
          <div class="p-card" style="margin-bottom:8px;">
            <div style="display:grid; grid-template-columns:38px 1fr auto; gap:12px; align-items:center;">
              <div style="width:38px; height:38px; border-radius:9px; background:${i.color}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px;">${i.tag}</div>
              <div>
                <div style="font-weight:600; font-size:14px;">${i.name}</div>
                <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">${i.desc} · sync ${i.sync}</div>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="chip ok">Connecté</span>
                <button class="kb ghost xs" data-action="integration-configure" data-arg="${i.name}">Configurer</button>
              </div>
            </div>
          </div>
        `).join('')}

        <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase; margin:18px 0 8px;">Disponibles</div>
        ${INTEGRATIONS_OFF.map((i) => `
          <div class="p-card" style="margin-bottom:8px;">
            <div style="display:grid; grid-template-columns:38px 1fr auto; gap:12px; align-items:center;">
              <div style="width:38px; height:38px; border-radius:9px; background:${i.color}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; opacity:0.85;">${i.tag}</div>
              <div>
                <div style="font-weight:600; font-size:14px;">${i.name}</div>
                <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">${i.desc}</div>
              </div>
              <button class="kb atlas xs" data-action="integration-connect" data-arg="${i.name}">Connecter</button>
            </div>
          </div>
        `).join('')}
      `,
    });
  };

  handlers['integration-configure'] = (_el, arg) =>
    toast(`Configuration · ${arg || 'intégration'}`, { type: 'info', desc: 'Champs de synchronisation et fréquence' });
  handlers['integration-connect'] = (_el, arg) => {
    toast(`${arg || 'Intégration'} connectée`, { type: 'success', desc: 'Synchronisation initiale en cours' });
    Kiwi.confetti?.();
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · "PERSONNALISÉ" DATE-RANGE DROPDOWN
 *   Clicking the Personnalisé pill opens an anchored dropdown: quick presets
 *   (this week / month / quarter / year) + a Du–Au custom date picker.
 *   Picking an option drives the real KiwiDateRange data and keeps the
 *   Personnalisé pill selected with its own label.
 *
 *   Built entirely with DOM methods (createElement / createElementNS) — no
 *   innerHTML — so there is no markup-injection surface.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  if (!window.Kiwi) return;
  const toast = window.Kiwi.toast;

  /* ── styles (injected once) ── */
  if (!document.getElementById('kdr-styles')) {
    const st = document.createElement('style');
    st.id = 'kdr-styles';
    st.textContent = `
    .kdr-pop{position:fixed;z-index:9970;width:308px;background:var(--paper);border:1px solid var(--n-200);
      border-radius:16px;box-shadow:0 24px 60px -16px rgba(5,59,44,.34),0 4px 14px -6px rgba(5,59,44,.2);
      padding:8px;opacity:0;transform:translateY(-8px) scale(.97);transform-origin:top right;
      transition:opacity 160ms ease,transform 200ms cubic-bezier(.2,.8,.2,1);font-family:var(--sans);}
    .kdr-pop.in{opacity:1;transform:translateY(0) scale(1);}
    html[dir="rtl"] .kdr-pop{transform-origin:top left;}
    .kdr-hd{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
      color:var(--n-500);padding:8px 10px 6px;}
    .kdr-opt{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:10px;cursor:pointer;
      transition:background 120ms;}
    .kdr-opt:hover{background:var(--paper-soft);}
    .kdr-opt.sel{background:var(--mint-soft);}
    .kdr-opt .ic{width:30px;height:30px;border-radius:8px;background:var(--mint-soft);color:var(--atlas);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .kdr-opt.sel .ic{background:var(--atlas);color:var(--paper);}
    .kdr-opt .tx{flex:1;min-width:0;}
    .kdr-opt .tx .n{font-size:13.5px;font-weight:500;color:var(--ink);}
    .kdr-opt .tx .s{font-size:11px;color:var(--n-500);font-family:var(--mono);margin-top:1px;}
    .kdr-opt .ck{color:var(--atlas);opacity:0;flex-shrink:0;}
    .kdr-opt.sel .ck{opacity:1;}
    .kdr-sep{height:1px;background:var(--n-200);margin:6px 4px;}
    .kdr-custom{padding:4px 10px 8px;}
    .kdr-custom .lbl{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
      color:var(--n-500);margin-bottom:8px;}
    .kdr-dates{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
    .kdr-field label{display:block;font-size:10.5px;color:var(--n-500);margin-bottom:3px;}
    .kdr-date{width:100%;box-sizing:border-box;border:1px solid var(--n-200);border-radius:9px;
      padding:8px 9px;font-size:12.5px;font-family:var(--sans);color:var(--ink);background:var(--paper-soft);}
    .kdr-date:focus{outline:none;border-color:var(--atlas);}
    .kdr-apply{width:100%;background:var(--atlas);color:var(--paper);border:0;border-radius:10px;
      padding:10px;font-size:13px;font-weight:500;font-family:var(--sans);cursor:pointer;transition:background 150ms;}
    .kdr-apply:hover{background:var(--riad);}`;
    document.head.appendChild(st);
  }

  /* ── tiny DOM builders ── */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function svg(size, sw, shapes) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', size); s.setAttribute('height', size);
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', sw);
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    shapes.forEach((sh) => {
      const node = document.createElementNS(SVGNS, sh.t);
      Object.keys(sh).forEach((k) => { if (k !== 't') node.setAttribute(k, sh[k]); });
      s.appendChild(node);
    });
    return s;
  }
  const calIcon = () => svg(15, 2, [
    { t: 'rect', x: 3, y: 4, width: 18, height: 18, rx: 2 },
    { t: 'path', d: 'M16 2v4M8 2v4M3 10h18' },
  ]);
  const checkIcon = () => {
    const s = svg(16, 2.4, [{ t: 'path', d: 'M20 6L9 17l-5-5' }]);
    s.setAttribute('class', 'ck');
    return s;
  };

  /* ── date helpers ── */
  const pad = (n) => String(n).padStart(2, '0');
  const dmy = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const dm = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function presetSubs() {
    const t = new Date();
    const yest = new Date(t); yest.setDate(t.getDate() - 1);
    const sevenAgo = new Date(t); sevenAgo.setDate(t.getDate() - 6);
    const thirtyAgo = new Date(t); thirtyAgo.setDate(t.getDate() - 29);
    const lastMonth = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const quarterStart = new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1);
    const capMonth = (d) => MONTHS[d.getMonth()].replace(/^./, (c) => c.toUpperCase());
    return {
      hier: dmy(yest),
      sept: `${dm(sevenAgo)} – ${dm(t)}`,
      mois: `${dm(thirtyAgo)} – ${dm(t)}`,
      moisDernier: `${capMonth(lastMonth)} ${lastMonth.getFullYear()}`,
      trimestre: `${quarterStart.getDate()} ${capMonth(quarterStart).slice(0, 3)} – ${t.getDate()} ${capMonth(t).slice(0, 3)} ${t.getFullYear()}`,
      annee: `${t.getFullYear()}`,
    };
  }

  /* preset id → underlying KiwiDateRange range. Each preset maps to a
   * DISTINCT dataset the demo actually has, so every choice visibly changes
   * the whole dashboard — no two options ever show identical numbers. */
  const PRESETS = [
    { id: 'hier', n: 'Hier',              range: 'hier' },
    { id: 'sept', n: '7 derniers jours',  range: 'septJours' },
    { id: 'mois', n: '30 derniers jours', range: 'trenteJours' },
    { id: 'moisDernier', n: 'Mois dernier', range: 'moisDernier' },
    { id: 'trimestre',   n: 'Ce trimestre', range: 'trimestre' },
    { id: 'annee',       n: 'Cette année',  range: 'annee' },
  ];

  let pop = null;          // open dropdown element
  let selectedId = null;   // currently-applied preset/custom id
  let selfApply = false;   // true while WE drive setDateRange (vs. a native pill)

  function closePop() {
    if (!pop) return;
    const p = pop; pop = null;
    p.classList.remove('in');
    setTimeout(() => p.remove(), 200);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('click', onOutside, true);
    window.removeEventListener('resize', closePop);
    window.removeEventListener('scroll', closePop);
  }
  const onKey = (e) => { if (e.key === 'Escape') closePop(); };
  const onOutside = (e) => {
    if (pop && !pop.contains(e.target) && !e.target.closest('[data-range="personnalise"]')) closePop();
  };

  /* Apply a chosen range: drive the real data, keep "Personnalisé" selected. */
  function applyRange(mapped, label, sub, id) {
    selectedId = id;
    const api = window.KiwiDateRange;
    if (api && api.setDateRange) {
      selfApply = true;
      api.setDateRange(mapped);
      selfApply = false;
    }
    // setDateRange highlights the mapped pill — re-pin the highlight to Personnalisé
    document.querySelectorAll('.dr-pill').forEach((p) =>
      p.classList.toggle('on', p.dataset.range === 'personnalise'));
    const L = document.querySelector('[data-dr-label]');
    const S = document.querySelector('[data-dr-sub]');
    if (L) L.textContent = label;
    if (S) S.textContent = sub;
    if (toast) toast(`${label} · ${sub}`, { type: 'success', duration: 1800 });
    closePop();
  }

  function buildOption(p, subs) {
    const row = el('div', 'kdr-opt' + (selectedId === p.id ? ' sel' : ''));
    row.dataset.preset = p.id;
    const ic = el('div', 'ic'); ic.appendChild(calIcon());
    const tx = el('div', 'tx');
    tx.appendChild(el('div', 'n', p.n));
    tx.appendChild(el('div', 's', subs[p.id]));
    row.append(ic, tx, checkIcon());
    row.addEventListener('click', () => applyRange(p.range, p.n, presetSubs()[p.id], p.id));
    return row;
  }

  function buildCustom() {
    const today = new Date();
    const start = new Date(); start.setDate(today.getDate() - 6);
    const wrap = el('div', 'kdr-custom');
    wrap.appendChild(el('div', 'lbl', 'Plage de dates'));

    const dates = el('div', 'kdr-dates');
    const mkField = (labelTxt, mark, val) => {
      const f = el('div', 'kdr-field');
      f.appendChild(el('label', null, labelTxt));
      const inp = el('input', 'kdr-date');
      inp.type = 'date'; inp.value = val; inp.max = iso(today);
      inp.dataset[mark] = '1';
      f.appendChild(inp);
      return f;
    };
    dates.append(mkField('Du', 'kdrFrom', iso(start)), mkField('Au', 'kdrTo', iso(today)));
    wrap.appendChild(dates);

    const apply = el('button', 'kdr-apply', 'Appliquer la plage');
    apply.addEventListener('click', () => {
      const from = wrap.querySelector('[data-kdr-from]').value;
      const to = wrap.querySelector('[data-kdr-to]').value;
      if (!from || !to) { if (toast) toast('Choisis une date de début et de fin', { type: 'warning' }); return; }
      const df = new Date(from), dt = new Date(to);
      if (df > dt) { if (toast) toast('La date de début doit précéder la date de fin', { type: 'warning' }); return; }
      // Map the chosen span onto the closest dataset the demo has, so the
      // dashboard genuinely reflects a short vs. long custom range.
      const spanDays = Math.round((dt - df) / 86400000) + 1;
      const mapped = spanDays <= 2 ? 'hier' : spanDays <= 10 ? 'septJours' : 'trenteJours';
      applyRange(mapped, 'Période personnalisée', `${dmy(df)} – ${dmy(dt)}`, 'custom');
    });
    wrap.appendChild(apply);
    return wrap;
  }

  function openPop(anchor) {
    closePop();
    const subs = presetSubs();
    pop = el('div', 'kdr-pop');
    pop.appendChild(el('div', 'kdr-hd', 'Choisir une période'));
    PRESETS.forEach((p) => pop.appendChild(buildOption(p, subs)));
    pop.appendChild(el('div', 'kdr-sep'));
    pop.appendChild(buildCustom());
    document.body.appendChild(pop);

    /* position under the anchor, right-aligned, clamped to viewport */
    const r = anchor.getBoundingClientRect();
    const w = 308;
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    let left = r.right - w;
    if (vw && left + w > vw - 8) left = vw - 8 - w; // keep inside the right edge
    if (left < 8) left = 8;                          // never past the left edge
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + 8}px`;
    setTimeout(() => { if (pop) pop.classList.add('in'); }, 10);

    document.addEventListener('keydown', onKey, true);
    setTimeout(() => document.addEventListener('click', onOutside, true), 0);
    window.addEventListener('resize', closePop);
    // The dropdown is position:fixed and anchored to the pill — once the page
    // scrolls it would detach and "float", so close it on scroll.
    window.addEventListener('scroll', closePop, { passive: true });
  }

  /* Keep the checkmark honest: if the range changes through anything other
   * than this dropdown (a native pill), drop the remembered selection so the
   * dropdown never shows a tick for a period that isn't actually active. */
  (function syncSelection() {
    const api = window.KiwiDateRange;
    if (api && api.subscribe) {
      api.subscribe(() => { if (!selfApply) selectedId = null; });
    } else {
      setTimeout(syncSelection, 200);
    }
  })();

  /* Intercept the Personnalisé pill in the capture phase, before the default
   * date-range handler runs, so it opens the dropdown instead of selecting. */
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-action="date-range"][data-range="personnalise"]');
    if (!pill) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (pop) { closePop(); return; }
    openPop(pill);
  }, true);
})();
