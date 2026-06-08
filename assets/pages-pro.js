/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · pages-pro.js — sidebar handler upgrade pass
 *
 * Concatenation of 9 sub-agent outputs covering:
 *   Section 1: nav-accueil / nav-transactions / nav-terminaux / nav-reglements
 *              nav-conformite / nav-equipe / nav-payroll / nav-reservations
 *   Section 2 restaurant: nav-tables / nav-menu / nav-kds / nav-stock
 *   Section 2 boutique:   nav-inventory / nav-categories / nav-promos / nav-returns
 *   Section 2 spa:        nav-appointments / nav-services
 *                         nav-practitioners / nav-clients
 *
 * Loads after pages.js — overrides original handlers + adds 8 new ones.
 * Each agent's section is wrapped in its own IIFE to isolate scopes.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ═══ Section 1A · accueil / transactions / terminaux / reglements ═══ */
(function() {
  "use strict";
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const fullpage = Kiwi.fullpage;
  const modal = Kiwi.modal;
  const toast = Kiwi.toast;
  const menu = Kiwi.menu;
  const confetti = Kiwi.confetti;
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · sidebar pages — investor-demo polish
 * 4 handlers: nav-accueil, nav-transactions, nav-terminaux, nav-reglements
 * Drop-in replacement for assets/pages.js — assumes (toast, drawer, handlers)
 * are in scope from the surrounding IIFE.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · ACCUEIL · return to the main dashboard view
 *     Closes any open drawer/modal and scrolls back to top. No drawer.
 * ─────────────────────────────────────────────────────────────────────────── */
const NAV_ACCUEIL_STR = {
    fr: 'Accueil · tableau de bord',
    en: 'Home · Dashboard',
    ar: 'الرئيسية · لوحة التحكم'
};
handlers['nav-accueil'] = () => {
  // Dismiss any open drawer / modal so the dashboard underneath is fully visible.
  document.querySelectorAll('.kiwi-drawer-backdrop, .kiwi-backdrop').forEach(el => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 280);
  });
  // Bypass-clear the scroll-lock counter since we just removed backdrops by hand
  // (instead of going through each drawer's close()).
  window.__kiwiScrollLocks = 0;
  document.documentElement.classList.remove('kiwi-locked');
  // Glide back to top of the main view.
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(NAV_ACCUEIL_STR[trLang()] || NAV_ACCUEIL_STR.fr, { type: 'info', duration: 1200 });
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · COMMANDES · live-synced order log, deterministic across opens
 *
 * Row count + cumulative volume are pulled from KiwiDemoClock so the drawer
 * always matches the dashboard's Commandes KPI tile (which is also driven
 * by the same simulator). The drawer subscribes to clock ticks and re-renders
 * as new orders come in.
 *
 * Filters (Toutes / Cartes / Mobile / Espèces / Remboursements), the date
 * range selector (Aujourd'hui / Hier / 7 j / 30 j), the tabs (Toutes /
 * Réconciliation / Anti-fraude) and the row-click detail are all wired.
 * ─────────────────────────────────────────────────────────────────────────── */
handlers['nav-transactions'] = () => {
  const TX_STR = {
    fr: {
        title: 'Commandes',
        heroLive: "VOLUME AUJOURD'HUI · LIVE",
        heroVolume: 'VOLUME · ',
        order: 'commande',
        orders: 'commandes',
        avgBasket: 'panier moyen',
        liveSync: 'sync horloge démo · refresh 3 s',
        consolidated: 'données consolidées',
        all: 'Toutes',
        cards: 'Cartes',
        mobile: 'Mobile',
        cash: 'Espèces',
        refunds: 'Remboursements',
        reconciliation: 'Réconciliation',
        fraud: 'Anti-fraude',
        filterActive: 'Filtre actif :',
        ordersDisplayed: 'commandes affichées',
        orderDisplayed: 'commande affichée',
        on: 'sur',
        clear: 'Effacer',
        noOrders: 'Aucune commande pour ce filtre.',
        olderOrdersHidden: 'commandes plus anciennes masquées',
        olderOrderHidden: 'commande plus ancienne masquée',
        showAll: 'Tout afficher',
        settlementOf: 'Règlement du',
        reconciled: 'Rapproché',
        grossVolume: 'Volume brut',
        visaMcInterchange: 'Interchange Visa/MC',
        kiwiNetworkFees: 'Frais réseau Kiwi',
        vatOnFees: 'TVA sur frais',
        netPaidOut: 'Net versé',
        savingsVsCmi: 'Économie vs CMI :',
        today: 'ce jour',
        vs: 'vs',
        openAlerts: 'alertes ouvertes',
        model: 'Modèle',
        slidingWindow: 'fenêtre glissante',
        examine: 'Examiner',
        markLegitimate: 'Marquer légitime',
        blockCard: 'Bloquer la carte',
        paid: 'Réglé',
        pending: 'Attente',
        refunded: 'Remboursé',
        hour: 'HEURE',
        method: 'MÉTHODE',
        client: 'CLIENT',
        amount: 'MONTANT',
        tip: 'POURBOIRE',
        status: 'STATUT',
    },
    en: {
        title: 'Orders',
        heroLive: "TODAY'S VOLUME · LIVE",
        heroVolume: 'VOLUME · ',
        order: 'order',
        orders: 'orders',
        avgBasket: 'avg basket',
        liveSync: 'demo clock sync · refresh 3s',
        consolidated: 'consolidated data',
        all: 'All',
        cards: 'Cards',
        mobile: 'Mobile',
        cash: 'Cash',
        refunds: 'Refunds',
        reconciliation: 'Reconciliation',
        fraud: 'Anti-fraud',
        filterActive: 'Active filter:',
        ordersDisplayed: 'orders displayed',
        orderDisplayed: 'order displayed',
        on: 'of',
        clear: 'Clear',
        noOrders: 'No orders for this filter.',
        olderOrdersHidden: 'older orders hidden',
        olderOrderHidden: 'older order hidden',
        showAll: 'Show all',
        settlementOf: 'Settlement of',
        reconciled: 'Reconciled',
        grossVolume: 'Gross volume',
        visaMcInterchange: 'Visa/MC Interchange',
        kiwiNetworkFees: 'Kiwi network fees',
        vatOnFees: 'VAT on fees',
        netPaidOut: 'Net paid out',
        savingsVsCmi: 'Savings vs CMI:',
        today: 'today',
        vs: 'vs',
        openAlerts: 'open alerts',
        model: 'Model',
        slidingWindow: 'sliding window',
        examine: 'Examine',
        markLegitimate: 'Mark legitimate',
        blockCard: 'Block card',
        paid: 'Paid',
        pending: 'Pending',
        refunded: 'Refunded',
        hour: 'TIME',
        method: 'METHOD',
        client: 'CUSTOMER',
        amount: 'AMOUNT',
        tip: 'TIP',
        status: 'STATUS',
    },
    ar: {
        title: 'الطلبات',
        heroLive: "حجم التداول اليوم · مباشر",
        heroVolume: 'حجم التداول · ',
        order: 'طلب',
        orders: 'طلبات',
        avgBasket: 'متوسط السلة',
        liveSync: 'مزامنة مع الساعة التجريبية · تحديث كل 3 ثوانٍ',
        consolidated: 'بيانات موحدة',
        all: 'الكل',
        cards: 'البطاقات',
        mobile: 'الجوال',
        cash: 'نقدًا',
        refunds: 'المبالغ المستردة',
        reconciliation: 'التسوية',
        fraud: 'مكافحة الاحتيال',
        filterActive: 'فلتر نشط:',
        ordersDisplayed: 'طلبات معروضة',
        orderDisplayed: 'طلب معروض',
        on: 'من',
        clear: 'مسح',
        noOrders: 'لا توجد طلبات لهذا الفلتر.',
        olderOrdersHidden: 'طلبات أقدم مخفية',
        olderOrderHidden: 'طلب أقدم مخفي',
        showAll: 'عرض الكل',
        settlementOf: 'تسوية',
        reconciled: 'تمت التسوية',
        grossVolume: 'الحجم الإجمالي',
        visaMcInterchange: 'رسوم فيزا/ماستركارد',
        kiwiNetworkFees: 'رسوم شبكة كيوي',
        vatOnFees: 'الضريبة على الرسوم',
        netPaidOut: 'صافي المبلغ المدفوع',
        savingsVsCmi: 'التوفير مقابل CMI:',
        today: 'اليوم',
        vs: 'مقابل',
        openAlerts: 'تنبيهات مفتوحة',
        model: 'نموذج',
        slidingWindow: 'نافذة منزلقة',
        examine: 'فحص',
        markLegitimate: 'وضع علامة كمشروع',
        blockCard: 'حظر البطاقة',
        paid: 'مدفوع',
        pending: 'قيد الانتظار',
        refunded: 'مسترد',
        hour: 'الوقت',
        method: 'الطريقة',
        client: 'العميل',
        amount: 'المبلغ',
        tip: 'الإكرامية',
        status: 'الحالة',
    }
  };

  const RANGE_LABEL_STR = {
    fr: { aujourdhui: "Aujourd'hui", hier: 'Hier', sept: '7 derniers jours', trente: '30 derniers jours' },
    en: { aujourdhui: "Today", hier: 'Yesterday', sept: 'Last 7 days', trente: 'Last 30 days' },
    ar: { aujourdhui: "اليوم", hier: 'أمس', sept: 'آخر 7 أيام', trente: 'آخر 30 يومًا' },
  };
  const venue = (window.KiwiVenue?.getVenue?.()) || 'cafeAtlas';
  const DAILY_TARGET = ({ cafeAtlas: 215, maisonMansour: 48, spaBahia: 22 })[venue] || 215;

  const lang = trLang();
  const T = TX_STR[lang] || TX_STR.fr;

  /* Deterministic PRNG (Mulberry32 + FNV-1a seed). Keeps the day's order
   * pool stable across drawer opens — closing and reopening shows the same
   * commandes you saw before. */
  function makeRng(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => {
      h |= 0; h = (h + 0x6D2B79F5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const METHODS = {
    [T.cards]:    [{ n: 'Visa', mask: '4291' }, { n: 'Mastercard', mask: '7820' }, { n: 'Visa', mask: '0043' }, { n: 'Visa', mask: '8124' }, { n: 'Mastercard', mask: '1209' }, { n: 'Mastercard', mask: '6670' }],
    [T.mobile]:    [{ n: 'Kiwi Tap', mask: 'NFC' }, { n: 'Kiwi Wallet', mask: 'QR' }, { n: 'Apple Pay', mask: 'NFC' }, { n: 'Google Pay', mask: 'NFC' }],
    [T.cash]: [{ n: T.cash, mask: '—' }],
  };
  const CUSTOMERS = ['Karim B.', 'Sara L.', 'Youssef A.', 'Nawal K.', 'Hassan J.', 'Imane M.', 'Mehdi R.', 'Fatima Z.', 'Rachid O.', 'Lina S.', 'Ahmed T.', 'Yasmine H.', 'Omar F.', 'Naima Z.', 'Tarik B.', 'Aïcha M.', 'Walid K.', 'Soukaina A.', 'Reda H.', 'Salma F.', 'Hicham D.', 'Mariam S.', 'Brahim K.', 'Latifa O.', 'Khalid R.'];

  /* Build a chronologically sorted pool. simIdx (0..15 == 11h..02h) lets us
   * slice "the first N orders of the day" deterministically against cumTx. */
  function buildPool(salt, size) {
    const today = new Date();
    const rng = makeRng(`${venue}-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${salt}`);
    const pool = [];
    for (let i = 0; i < size; i++) {
      const r = rng();
      const cat = r < 0.66 ? T.cards : r < 0.92 ? T.mobile : T.cash;
      const opts = METHODS[cat];
      const m = opts[Math.floor(rng() * opts.length)];
      const amt = Math.round((40 + rng() * 360) * 100) / 100;
      const tip = rng() > 0.6 ? Math.round(amt * 0.1 * 100) / 100 : 0;
      const simIdx = Math.floor(rng() * 16);
      const minute = Math.floor(rng() * 60);
      const realHour = (11 + simIdx) % 24;
      pool.push({
        id: `KW-${(70000 + i + Math.floor(rng() * 9999)).toString().padStart(5, '0')}`,
        t: `${realHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        simIdx,
        n: m.n, mask: m.mask, cat,
        c: CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)],
        amt, tip,
        status: rng() > 0.95 ? 'pend' : 'ok',
      });
    }
    pool.sort((a, b) => a.simIdx - b.simIdx || a.t.localeCompare(b.t));
    return pool;
  }

  function buildRefunds(sourcePool, n) {
    const rng = makeRng(`${venue}-ref-${n}`);
    const out = [];
    for (let i = 0; i < n; i++) {
      const src = sourcePool[Math.floor(rng() * sourcePool.length)] || sourcePool[0];
      if (!src) break;
      out.push({
        id: `KW-RB-${(40000 + i).toString().padStart(5, '0')}`,
        t: src.t, n: src.n, mask: src.mask, c: src.c,
        amt: -Math.round(src.amt * (0.4 + rng() * 0.5) * 100) / 100,
        tip: 0, status: 'ref', cat: T.refunds, simIdx: src.simIdx,
      });
    }
    return out;
  }

  /* Pre-build all four range pools so opening the drawer is instant. */
  const POOL = {
    aujourdhui: buildPool('today', DAILY_TARGET + 40),
    hier:       buildPool('y1',    DAILY_TARGET),
    sept:       buildPool('w1',    DAILY_TARGET * 7),
    trente:     buildPool('m1',    DAILY_TARGET * 30),
  };

  const fmt2 = (n) => Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n) => Math.round(n).toLocaleString('fr-FR').replace(/,/g, ' ');

  /* Drawer state */
  let activeFilter = T.all;
  let activeRange  = 'aujourdhui';
  let activeTab    = 'flux';
  let expanded     = false;
  let unsub        = null;

  function getCumTx() {
    return window.KiwiDemoClock?.getSimState?.()?.cumTx ?? Math.round(DAILY_TARGET * 0.7);
  }
  function rangeRows() {
    if (activeRange === 'aujourdhui') return POOL.aujourdhui.slice(0, getCumTx());
    if (activeRange === 'hier')       return POOL.hier;
    if (activeRange === 'sept')       return POOL.sept;
    return POOL.trente;
  }
  function rangeRefunds() {
    const base = rangeRows();
    const n    = activeRange === 'aujourdhui' ? Math.max(1, Math.floor(getCumTx() / 40))
                : activeRange === 'hier'       ? 8
                : activeRange === 'sept'       ? 28
                : 115;
    return buildRefunds(base.length ? base : POOL.aujourdhui, n);
  }

  const RANGE_LABEL = RANGE_LABEL_STR[lang] || RANGE_LABEL_STR.fr;
  const FILTERS     = [T.all, T.cards, T.mobile, T.cash, T.refunds];

  let host;
  const dr = drawer({ title: T.title, subtitle: '…', width: 920, body: `<div data-tx-host></div>` });
  host = dr.el.querySelector('[data-tx-host]');

  function render() {
    const baseRows = rangeRows();
    const refunds  = rangeRefunds();
    /* ─── HERO = always the unfiltered total for the active range.
     * The hero number is what should match the dashboard's Commandes KPI tile.
     * Filters narrow only the table below, not the headline. ─── */
    const heroTotal  = baseRows.length;
    const heroSum    = baseRows.reduce((s, r) => s + r.amt, 0);
    const heroAvg    = heroTotal > 0 ? Math.round(heroSum / heroTotal) : 0;

    /* ─── TABLE = filtered subset ─── */
    const list = activeFilter === T.refunds ? refunds
               : activeFilter === T.all         ? baseRows
               : baseRows.filter(r => r.cat === activeFilter);
    const total   = list.length;
    const sumAmt  = list.reduce((s, r) => s + r.amt, 0);
    const live    = activeRange === 'aujourdhui';
    const filtered = activeFilter !== T.all;
    const sortedDesc = list.slice().sort((a, b) => b.simIdx - a.simIdx || b.t.localeCompare(a.t));
    const limit   = expanded ? 500 : 80;
    const display = sortedDesc.slice(0, limit);
    const hidden  = Math.max(0, total - display.length);

    const tabs = [['flux',T.all], ['rec',T.reconciliation], ['fra',T.fraud]];

    host.innerHTML = `
      <div class="p-hero">
        <div class="l">${live ? T.heroLive : T.heroVolume + RANGE_LABEL[activeRange].toUpperCase()}</div>
        <div class="big">${fmt0(Math.abs(heroSum))} <span style="font-size:18px; opacity:0.7;">MAD</span></div>
        <div class="sub">${heroTotal} ${heroTotal > 1 ? T.orders : T.order} · ${T.avgBasket} ${heroAvg} MAD · ${live ? T.liveSync : T.consolidated}</div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; align-items:center;">
        ${FILTERS.map(c => `
          <button class="chip ${activeFilter === c ? 'ok' : 'neutral'}" data-action="tx-filter" data-arg="${c}" style="padding:6px 12px; font-size:12px; cursor:pointer; border:0;">${c}</button>
        `).join('')}
        <span style="flex:1;"></span>
        <button class="kb ghost" data-action="tx-daterange" style="padding:6px 12px; font-size:12px; gap:6px;">${RANGE_LABEL[activeRange]} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>
      </div>

      ${filtered ? `
        <div style="background:rgba(125,242,176,0.10); border:1px solid rgba(11,110,79,0.16); padding:8px 14px; border-radius:9px; margin-bottom:12px; font-size:12.5px; color:var(--riad); display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <span>${T.filterActive} <b>${activeFilter}</b> · ${total} ${total > 1 ? T.ordersDisplayed : T.orderDisplayed}${activeFilter !== T.refunds ? ` ${T.on} ${heroTotal}` : ''} · ${fmt0(Math.abs(sumAmt))} MAD</span>
          <button class="kb ghost" data-action="tx-filter" data-arg="${T.all}" style="padding:4px 10px; font-size:11.5px;">${T.clear}</button>
        </div>
      ` : ''}

      <div style="display:flex; gap:4px; padding:4px; background:var(--paper-soft); border:1px solid var(--n-200); border-radius:11px; margin-bottom:14px;">
        ${tabs.map(([k, l]) => {
          const on = activeTab === k;
          return `<button class="tx-tab ${on ? 'on' : ''}" data-tx-tab="${k}" style="flex:1; padding:9px 12px; border:0; background:${on?'#fff':'transparent'}; color:${on?'var(--ink)':'var(--n-500)'}; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; box-shadow:${on?'0 1px 2px rgba(0,0,0,0.05)':'none'};">${l}</button>`;
        }).join('')}
      </div>

      <div data-tx-pane="flux" style="display:${activeTab === 'flux' ? '' : 'none'};">
        ${display.length === 0 ? `
          <div style="padding:40px 16px; text-align:center; color:var(--n-500); font-size:13px;">${T.noOrders}</div>
        ` : `
          <table class="p-table">
            <thead><tr><th>${T.hour.toUpperCase()}</th><th>${T.method.toUpperCase()}</th><th>${T.client.toUpperCase()}</th><th class="right">${T.amount.toUpperCase()}</th><th class="right">${T.tip.toUpperCase()}</th><th>${T.status.toUpperCase()}</th></tr></thead>
            <tbody>
              ${display.map(r => `
                <tr data-action="tx-detail" data-arg="${r.id}" style="cursor:pointer;">
                  <td class="mono">${r.t}</td>
                  <td><b>${r.n}</b> <span style="color:var(--n-500);">${r.mask}</span></td>
                  <td style="color:var(--n-600);">${r.c}</td>
                  <td class="mono right" style="${r.amt < 0 ? 'color:var(--danger);' : ''}">${r.amt < 0 ? '−' : ''}${fmt2(r.amt)}</td>
                  <td class="mono right" style="color:${r.tip > 0 ? 'var(--success)' : 'var(--n-400)'};">${r.tip > 0 ? '+' + fmt2(r.tip) : '—'}</td>
                  <td><span class="chip ${r.status === 'ok' ? 'ok' : 'pend'}">${r.status === 'ok' ? T.paid : r.status === 'ref' ? T.refunded : T.pending}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${hidden > 0 ? `
            <div style="text-align:center; padding:14px; color:var(--n-500); font-size:12px;">
              ${hidden} ${hidden > 1 ? T.olderOrdersHidden : T.olderOrderHidden} ·
              <a href="#" data-action="tx-show-all" style="color:var(--atlas); font-weight:500;">${T.showAll}</a>
            </div>
          ` : ''}
        `}
      </div>

      <div data-tx-pane="rec" style="display:${activeTab === 'rec' ? '' : 'none'};">
        <div class="p-card" style="background:#fff;">
          <div class="head"><h4>${T.settlementOf} 28 avril</h4><span class="chip ok">${T.reconciled}</span></div>
          <table class="p-table" style="margin-top:6px;">
            <tbody>
              <tr><td>${T.grossVolume} · 174 ${T.orders}</td><td class="mono right">+30 482,50 MAD</td></tr>
              <tr><td style="color:var(--n-500);">${T.visaMcInterchange} (1,18 %)</td><td class="mono right" style="color:var(--danger);">−359,69 MAD</td></tr>
              <tr><td style="color:var(--n-500);">${T.kiwiNetworkFees} (0,30 %)</td><td class="mono right" style="color:var(--danger);">−91,45 MAD</td></tr>
              <tr><td style="color:var(--n-500);">${T.vatOnFees}</td><td class="mono right" style="color:var(--danger);">−90,23 MAD</td></tr>
              <tr style="border-top:2px solid var(--ink);"><td><b>${T.netPaidOut} Bank of Africa ••3291</b></td><td class="mono right"><b style="color:var(--atlas); font-size:15px;">29 941,13 MAD</b></td></tr>
            </tbody>
          </table>
          <div style="margin-top:14px; padding:10px 14px; background:var(--mint-soft, rgba(125,242,176,0.18)); border-radius:9px; font-size:12.5px; color:var(--riad);">
            <b>${T.savingsVsCmi}</b> +247 MAD ${T.today} · 1,18 % ${T.vs} 2,0 % CMI
          </div>
        </div>
      </div>

      <div data-tx-pane="fra" style="display:${activeTab === 'fra' ? '' : 'none'};">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
          <span class="chip" style="background:#FFF4DD; color:#8A6210;">2 ${T.openAlerts}</span>
          <span style="font-size:11.5px; color:var(--n-500);">${T.model}: Kiwi Sentinel · 30 j ${T.slidingWindow}</span>
        </div>
        ${[
          { t: 'Visa •• 0043 — 3ᵉ remboursement cette semaine', d: 'Pattern récurrent · 240 MAD à chaque fois · adresse IP changeante', risk: 'Élevé' },
          { t: 'Kiwi Wallet QR — pic anormal 13:42', d: '7 commandes du même device en 4 minutes · panier moyen 38 MAD', risk: 'Moyen' },
        ].map(a => `
          <div class="p-card" style="background:#fff;">
            <div class="head">
              <div>
                <h4 style="font-size:14.5px;">${a.t}</h4>
                <div style="font-size:12px; color:var(--n-500); margin-top:4px;">${a.d}</div>
              </div>
              <span class="chip ${a.risk === 'Élevé' ? 'pend' : 'neutral'}">${a.risk}</span>
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <button class="kb ghost" data-action="fra-investigate" style="padding:6px 10px; font-size:12px;">${T.examine}</button>
              <button class="kb ghost" data-action="fra-allow" style="padding:6px 10px; font-size:12px;">${T.markLegitimate}</button>
              <button class="kb atlas" data-action="fra-block" style="padding:6px 10px; font-size:12px;">${T.blockCard}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    /* Wire tab buttons (rebound on every render since innerHTML wipes listeners). */
    host.querySelectorAll('.tx-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.txTab; render(); };
    });

    /* Live subtitle */
    const subEl = dr.el.querySelector('.kiwi-drawer-head p');
    if (subEl) subEl.textContent = `${heroTotal} ${heroTotal > 1 ? T.orders : T.order} · ${fmt0(Math.abs(heroSum))} MAD · ${RANGE_LABEL[activeRange]}`;
  }

  render();

  /* Action handlers — (element, arg) signature per interactive.js routing */
  handlers['tx-filter'] = (_el, c) => {
    if (FILTERS.indexOf(c) === -1) return;
    activeFilter = c;
    expanded = false;
    render();
  };
  handlers['tx-daterange'] = (el) => {
    if (!el) return;
    const lang = trLang();
    const T = TX_STR[lang] || TX_STR.fr;
    const RANGE_LABEL = RANGE_LABEL_STR[lang] || RANGE_LABEL_STR.fr;
    menu(el, [
      { label: RANGE_LABEL.aujourdhui,       active: activeRange === 'aujourdhui', onClick: () => { activeRange = 'aujourdhui'; activeFilter = T.all; expanded = false; render(); } },
      { label: RANGE_LABEL.hier,               active: activeRange === 'hier',       onClick: () => { activeRange = 'hier';       activeFilter = T.all; expanded = false; render(); } },
      { sep: true },
      { label: RANGE_LABEL.sept,   active: activeRange === 'sept',       onClick: () => { activeRange = 'sept';       activeFilter = T.all; expanded = false; render(); } },
      { label: RANGE_LABEL.trente,  active: activeRange === 'trente',     onClick: () => { activeRange = 'trente';     activeFilter = T.all; expanded = false; render(); } },
    ]);
  };
  handlers['tx-show-all'] = () => { expanded = true; render(); };
  handlers['tx-detail']   = (_el, id) => toast(`${T.title} · ${id || ''}`, { type: 'info', duration: 1500 });
  if (!handlers['fra-investigate']) handlers['fra-investigate'] = () => toast(T.dossierOuvert, { type: 'info', duration: 1800 });
  if (!handlers['fra-allow'])       handlers['fra-allow']       = () => toast(T.marqueLegitime, { type: 'success', duration: 1600 });
  if (!handlers['fra-block'])       handlers['fra-block']       = () => toast(T.carteBloquee, { type: 'success', duration: 1800 });

  /* Live updates from the demo clock (only when viewing today). */
  if (window.KiwiDemoClock?.subscribe) {
    unsub = window.KiwiDemoClock.subscribe(() => {
      if (!dr.el.isConnected) { unsub?.(); unsub = null; return; }
      if (activeRange !== 'aujourdhui') return;
      render();
    });
  }
  const origClose = dr.close;
  dr.close = () => { unsub?.(); unsub = null; origClose(); };
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · TERMINAUX · fleet management
 *
 * The fleet is now KiwiPad pro (comptoir), KiwiPad cashless (salle),
 * KiwiPad (terrasse), KiwiOrders pro (cuisine). Each card swaps its
 * abstract SVG block for the matching "gamification" product render so
 * the merchant sees their actual hardware at a glance.
 *
 * "Ajouter" and "Demander un terminal" both open the new catalog drawer.
 * ─────────────────────────────────────────────────────────────────────────── */
const TERMINAUX_STR = {
    fr: {
        loaned: 'Prêté · Kiwi Pro',
        purchased: 'Acheté · 03/2025',
        replacement: 'Remplacement dû',
        title: 'Parc terminaux',
        subtitle: (active, total) => `${active} / ${total} actifs · uptime 24h 94,2 % · 273 tx aujourd'hui`,
        heroTitle: 'ÉTAT DU PARC · CAFÉ ATLAS',
        online: 'en ligne',
        heroSubtitle: 'Batterie moy. 78 % · firmware à jour majoritaire · 1 mise à jour disponible',
        deployedDevices: 'Appareils déployés',
        add: 'Ajouter',
        updateAvailable: 'MAJ disponible',
        onlineStatus: 'En ligne',
        offlineStatus: 'Hors-ligne',
        txToday: 'tx aujourd\'hui',
        testTx: 'Tx test',
        diagnose: 'Diagnostiquer',
        manage: 'Gérer',
        beats: 'PULSATIONS · 30 MIN',
        battery: 'BATTERIE',
        lastTx: 'DERNIÈRE TX',
        beforeDisconnect: 'avant déconnexion',
        orderNewTerminal: 'Commander un nouveau terminal',
        orderNewTerminalDesc: 'KiwiPad pro, KiwiPad cashless ou KiwiOrders pro · livraison 48h Casablanca',
        requestTerminal: 'Demander un terminal',
        testTxSent: 'Tx test envoyée',
        diagOpen: 'Diagnostic ... · ouvert',
        comptoir: 'Comptoir',
        salle: 'Salle',
        terrasse: 'Terrasse',
        cuisine: 'Cuisine',
        wifi: 'Wi-Fi',
        fourG: '4G',
    },
    en: {
        loaned: 'Loaned · Kiwi Pro',
        purchased: 'Purchased · 03/2025',
        replacement: 'Replacement due',
        title: 'Terminal Fleet',
        subtitle: (active, total) => `${active} / ${total} active · 24h uptime 94.2% · 273 tx today`,
        heroTitle: 'FLEET STATUS · CAFÉ ATLAS',
        online: 'online',
        heroSubtitle: 'Avg. battery 78% · majority firmware up-to-date · 1 update available',
        deployedDevices: 'Deployed Devices',
        add: 'Add',
        updateAvailable: 'Update available',
        onlineStatus: 'Online',
        offlineStatus: 'Offline',
        txToday: 'tx today',
        testTx: 'Test Tx',
        diagnose: 'Diagnose',
        manage: 'Manage',
        beats: 'HEARTBEATS · 30 MIN',
        battery: 'BATTERY',
        lastTx: 'LAST TX',
        beforeDisconnect: 'before disconnect',
        orderNewTerminal: 'Order a new terminal',
        orderNewTerminalDesc: 'KiwiPad pro, KiwiPad cashless or KiwiOrders pro · 48h delivery in Casablanca',
        requestTerminal: 'Request a terminal',
        testTxSent: 'Test tx sent',
        diagOpen: 'Diagnosis ... · open',
        comptoir: 'Counter',
        salle: 'Floor',
        terrasse: 'Terrace',
        cuisine: 'Kitchen',
        wifi: 'Wi-Fi',
        fourG: '4G',
    },
    ar: {
        loaned: 'معار · كيوي برو',
        purchased: 'تم الشراء · 03/2025',
        replacement: 'يجب استبداله',
        title: 'أسطول الأجهزة',
        subtitle: (active, total) => `${active} / ${total} نشط · وقت التشغيل 24 ساعة 94.2% · 273 معاملة اليوم`,
        heroTitle: 'حالة الأسطول · مقهى أطلس',
        online: 'متصل',
        heroSubtitle: 'متوسط البطارية 78% · معظم البرامج الثابتة محدثة · 1 تحديث متوفر',
        deployedDevices: 'الأجهزة المنشورة',
        add: 'إضافة',
        updateAvailable: 'تحديث متوفر',
        onlineStatus: 'متصل',
        offlineStatus: 'غير متصل',
        txToday: 'معاملة اليوم',
        testTx: 'اختبار معاملة',
        diagnose: 'تشخيص',
        manage: 'إدارة',
        beats: 'النبضات · 30 دقيقة',
        battery: 'البطارية',
        lastTx: 'آخر معاملة',
        beforeDisconnect: 'قبل انقطاع الاتصال',
        orderNewTerminal: 'طلب جهاز جديد',
        orderNewTerminalDesc: 'KiwiPad pro, KiwiPad cashless أو KiwiOrders pro · توصيل خلال 48 ساعة في الدار البيضاء',
        requestTerminal: 'طلب جهاز',
        testTxSent: 'تم إرسال معاملة اختبار',
        diagOpen: 'تشخيص ... · مفتوح',
        comptoir: 'الكاونتر',
        salle: 'القاعة',
        terrasse: 'الشرفة',
        cuisine: 'المطبخ',
        wifi: 'Wi-Fi',
        fourG: '4G',
    },
};
handlers['nav-terminaux'] = () => {
  // sparkline helper — 30 points, 0..1 normalized
  const spark = (arr, color = 'var(--atlas)') => {
    const max = Math.max(...arr, 1);
    const w = 120, h = 28;
    const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const battCurve = (start, end) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push(start + ((end - start) * i / 12));
    return spark(pts, 'var(--atlas)');
  };
  const beat = (n) => Array.from({ length: 30 }, () => Math.max(0.4, n + (Math.random() - 0.5) * 0.5));

  /* The Café Atlas fleet — KiwiPad pro / KiwiPad cashless / KiwiPad / KiwiOrders pro.
   * `img` points to the gamification PNG; the catalog drawer uses the real photo. */
  const T = TERMINAUX_STR[trLang()] || TERMINAUX_STR.fr;
  const terms = [
    {
      id: 'KP-PRO-2831', name: 'KiwiPad pro', loc: T.comptoir,
      img: 'Hardware_pictures/Hardware_gamefication4.png',
      state: 'on', net: T.wifi, batt: 87, battStart: 96,
      fw: '4.2.1', fwUpdate: false, txDay: 87,
      life: 'loaned', lifeLabel: T.loaned,
      spark: beat(0.7),
    },
    {
      id: 'KP-CL-1208', name: 'KiwiPad cashless', loc: T.salle,
      img: 'Hardware_pictures/Hardware_gamefication2.png',
      state: 'on', net: T.fourG, batt: 63, battStart: 92,
      fw: '2.0.4', fwUpdate: true, txDay: 54,
      life: 'purchased', lifeLabel: T.purchased,
      spark: beat(0.55),
    },
    {
      id: 'KP-PRO-2832', name: 'KiwiPad pro', loc: T.terrasse,
      img: 'Hardware_pictures/Hardware_gamefication4.png',
      state: 'off', net: T.offlineStatus, batt: 64, battStart: 88,
      fw: '4.2.1', fwUpdate: false, txDay: 0,
      life: 'replacement', lifeLabel: T.replacement,
      spark: beat(0.05),
    },
    {
      id: 'KO-PRO-4501', name: 'KiwiOrders pro', loc: T.cuisine,
      img: 'Hardware_pictures/Hardware_KDSgamefication1.png',
      state: 'on', net: T.wifi, batt: 100, battStart: 100,
      fw: '3.1.0', fwUpdate: false, txDay: 132,
      life: 'loaned', lifeLabel: T.loaned,
      spark: beat(0.78),
    },
  ];
  const lifeChip = { loaned: 'ok', purchased: 'neutral', replacement: 'pend' };

  drawer({
    title: T.title,
    subtitle: T.subtitle(v_count_active(terms), terms.length),
    width: 780,
    body: `
      <div class="p-hero">
        <div class="l">${T.heroTitle}</div>
        <div class="big">${v_count_active(terms)} / ${terms.length} <span style="font-size:18px; opacity:0.7;">${T.online}</span></div>
        <div class="sub">${T.heroSubtitle}</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase;">${T.deployedDevices}</div>
        <button class="kb ghost" data-action="add-terminal" style="padding:6px 12px; font-size:12px; gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>${T.add}</button>
      </div>

      ${terms.map(t => `
        <div class="p-card" style="margin-bottom:10px; ${t.state === 'off' ? 'background:#FFF4DD;' : ''}">
          <div style="display:grid; grid-template-columns:104px 1fr auto; gap:14px; align-items:center; margin-bottom:12px;">
            <div style="width:104px; height:80px; border-radius:11px; background:#fff; border:1px solid var(--n-200); display:flex; align-items:center; justify-content:center; padding:6px; ${t.state === 'off' ? 'opacity:0.55;' : ''}">
              <img src="${t.img}" alt="${t.name}" style="max-width:100%; max-height:100%; object-fit:contain; display:block;" loading="lazy">
            </div>
            <div>
              <div style="font-weight:600; font-size:14.5px; letter-spacing:-0.005em;">${t.name} · ${t.loc}</div>
              <div style="font-family:var(--mono); font-size:11px; color:var(--n-500); margin-top:2px;">S/N ${t.id} · firmware ${t.fw}${t.fwUpdate ? ` · <span class="chip pend" style="padding:1px 7px; font-size:10px; margin-left:4px;">${T.updateAvailable}</span>` : ''}</div>
              <div style="display:flex; gap:14px; margin-top:8px; font-size:11.5px; color:var(--n-600); flex-wrap:wrap;">
                <span style="display:inline-flex; align-items:center; gap:5px;"><i style="width:6px; height:6px; border-radius:50%; background:${t.state==='on'?'var(--success)':'var(--danger)'};"></i>${t.state==='on'?`${T.onlineStatus} · ${t.net}`:`${T.offlineStatus} · 09:18`}</span>
                <span>${t.txDay} ${T.txToday}</span>
                <span class="chip ${lifeChip[t.life]}" style="padding:1px 8px; font-size:10px;">${t.lifeLabel}</span>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-end;">
              <button class="kb ghost" data-action="term-test" data-arg="${t.id}" style="padding:5px 10px; font-size:11.5px; gap:5px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>${T.testTx}</button>
              <button class="kb ${t.state==='off'?'atlas':'ghost'}" data-action="term-manage" data-arg="${t.id}" style="padding:5px 10px; font-size:11.5px;">${t.state==='off'?T.diagnose:T.manage}</button>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; padding-top:12px; border-top:1px solid var(--n-200);">
            <div>
              <div style="font-size:10px; letter-spacing:0.08em; color:var(--n-500); font-family:var(--mono); margin-bottom:4px;">${T.beats}</div>
              ${spark(t.spark, t.state === 'off' ? 'var(--danger)' : 'var(--atlas)')}
            </div>
            <div>
              <div style="font-size:10px; letter-spacing:0.08em; color:var(--n-500); font-family:var(--mono); margin-bottom:4px;">${T.battery} · ${t.batt} %</div>
              ${battCurve(t.battStart / 100, t.batt / 100)}
            </div>
            <div>
              <div style="font-size:10px; letter-spacing:0.08em; color:var(--n-500); font-family:var(--mono); margin-bottom:4px;">${T.lastTx}</div>
              <div style="font-family:var(--mono); font-weight:500; font-size:13px;">${t.state==='on'?'14:'+(28+Math.floor(Math.random()*9)):'09:18'}</div>
              <div style="font-size:11px; color:var(--n-500); margin-top:2px;">${t.state==='on'?Math.round(40+Math.random()*200)+',00 MAD':T.beforeDisconnect}</div>
            </div>
          </div>
        </div>
      `).join('')}

      <div style="padding:18px; margin-top:6px; background:var(--paper-soft); border-radius:14px; border:1px dashed var(--n-300); text-align:center;">
        <div style="font-weight:600; margin-bottom:4px; font-size:14.5px;">${T.orderNewTerminal}</div>
        <div style="font-size:12.5px; color:var(--n-500); margin-bottom:12px;">${T.orderNewTerminalDesc}</div>
        <button class="kb atlas" data-action="add-terminal" style="padding:9px 18px;">${T.requestTerminal}</button>
      </div>
    `,
  });

  if (!handlers['term-test'])   handlers['term-test']   = (_el, id) => toast(`${T.testTxSent} · ${(id||'').slice(-4)}`, { type: 'success', duration: 1800 });
  if (!handlers['term-manage']) handlers['term-manage'] = (_el, id) => toast(T.diagOpen((id||'').slice(-4)), { type: 'info', duration: 1600 });

  /* "Ajouter" + "Demander un terminal" both open the catalog drawer. */
  handlers['add-terminal'] = () => handlers['terminal-catalog']?.();

  function v_count_active(arr) { return arr.filter(x => x.state === 'on').length; }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 3b · CATALOGUE HARDWARE — opened from "Demander un terminal"
 *
 * 5 products on a 2-column grid. Each card: hero photo, name, price tag,
 * tagline, description, and a "Commander" CTA that toasts a confirmation.
 * ─────────────────────────────────────────────────────────────────────────── */
const CATALOG_STR = {
    fr: {
        kiwipadProTag: 'Comptoir modulaire · flagship 2026',
        kiwipadProDesc: 'Écran tactile sur pied réglable, imprimante de tickets, tiroir-caisse intégré, lecteur de carte sans fil. Design discret, modules détachables. Le poste de référence Kiwi.',
        kiwiordersProTag: 'KDS · cuisine + bar + stations',
        kiwiordersProDesc: 'Écran KDS sur bras articulé avec imprimante de tickets. Pour cuisine, bar, BBQ ou toute station de préparation reliée à la caisse principale.',
        kiwipadCashlessTag: '100 % cashless · tablette + lecteur',
        kiwipadCashlessDesc: 'Tablette tactile + lecteur de carte + imprimante. Pour commerces 100 % cashless sans gestion d\'espèces ni tiroir-caisse.',
        title: 'Demander un terminal',
        subtitle: 'Catalogue Kiwi · livraison 48h Casablanca · paiement échelonné disponible',
        heroTitle: 'CATALOGUE HARDWARE · KIWI 2026',
        heroModels: '3 modèles',
        heroKds: 'dont 1 KDS',
        heroSubtitle: "Le KiwiPad pro et le KiwiOrders pro sont prêtés gratuitement avec l'abonnement Kiwi Pro · les modèles additionnels et upgrades sont facturés.",
        flagship: 'FLAGSHIP 2026',
        order: 'Commander',
        proProgram: 'PROGRAMME PRO',
        proProgramTitle: '1 KiwiPad pro + 1 KiwiOrders pro offerts',
        proProgramDesc: "Inclus dans l'abonnement Kiwi Pro · les pièces additionnelles utilisent le tarif ci-dessus.",
        talkToAdvisor: 'Parler à un conseiller',
        orderSent: 'Commande envoyée',
        delivery: 'Livraison 48h à Casablanca',
        billing: 'facturation',
        onNextSettlement: 'sur votre prochain règlement',
        advisorNotified: 'Conseiller Kiwi notifié',
        advisorCallback: "Un membre de l'équipe vous rappellera dans la journée.",
    },
    en: {
        kiwipadProTag: 'Modular counter · 2026 flagship',
        kiwipadProDesc: 'Adjustable stand touchscreen, ticket printer, integrated cash drawer, wireless card reader. Discreet design, detachable modules. The Kiwi reference station.',
        kiwiordersProTag: 'KDS · kitchen + bar + stations',
        kiwiordersProDesc: 'KDS screen on an articulated arm with ticket printer. For kitchen, bar, BBQ or any preparation station connected to the main cash register.',
        kiwipadCashlessTag: '100% cashless · tablet + reader',
        kiwipadCashlessDesc: 'Touch tablet + card reader + printer. For 100% cashless businesses without cash management or cash drawer.',
        title: 'Request a terminal',
        subtitle: 'Kiwi Catalog · 48h delivery in Casablanca · installment payment available',
        heroTitle: 'HARDWARE CATALOG · KIWI 2026',
        heroModels: '3 models',
        heroKds: 'including 1 KDS',
        heroSubtitle: 'The KiwiPad pro and a KiwiOrders pro are loaned for free with the Kiwi Pro subscription · additional models and upgrades are billed.',
        flagship: 'FLAGSHIP 2026',
        order: 'Order',
        proProgram: 'PRO PROGRAM',
        proProgramTitle: '1 KiwiPad pro + 1 KiwiOrders pro offered',
        proProgramDesc: 'Included in the Kiwi Pro subscription · additional items use the price list above.',
        talkToAdvisor: 'Talk to an advisor',
        orderSent: 'Order sent',
        delivery: '48h delivery in Casablanca',
        billing: 'billing',
        onNextSettlement: 'on your next settlement',
        advisorNotified: 'Kiwi advisor notified',
        advisorCallback: 'A team member will call you back during the day.',
    },
    ar: {
        kiwipadProTag: 'كاونتر معياري · الرائد 2026',
        kiwipadProDesc: 'شاشة لمس على حامل قابل للتعديل، طابعة إيصالات، درج نقود مدمج، قارئ بطاقات لاسلكي. تصميم بسيط، وحدات قابلة للفصل. محطة كيوي المرجعية.',
        kiwiordersProTag: 'KDS · مطبخ + بار + محطات',
        kiwiordersProDesc: 'شاشة KDS على ذراع مفصلي مع طابعة إيصالات. للمطبخ، البار، الشواء أو أي محطة تحضير متصلة بالصندوق الرئيسي.',
        kiwipadCashlessTag: '100٪ غير نقدي · جهاز لوحي + قارئ',
        kiwipadCashlessDesc: 'جهاز لوحي يعمل باللمس + قارئ بطاقات + طابعة. للشركات غير النقدية 100٪ بدون إدارة نقدية أو درج نقود.',
        title: 'طلب جهاز طرفي',
        subtitle: 'كتالوج كيوي · توصيل خلال 48 ساعة في الدار البيضاء · الدفع بالتقسيط متاح',
        heroTitle: 'كتالوج الأجهزة · كيوي 2026',
        heroModels: '3 موديلات',
        heroKds: 'منها 1 KDS',
        heroSubtitle: 'يتم إعارة KiwiPad pro و KiwiOrders pro مجانًا مع اشتراك Kiwi Pro · تتم فوترة الموديلات الإضافية والترقيات.',
        flagship: 'رائد 2026',
        order: 'اطلب',
        proProgram: 'برنامج PRO',
        proProgramTitle: '1 KiwiPad pro + 1 KiwiOrders pro مجانًا',
        proProgramDesc: 'مضمن في اشتراك Kiwi Pro · تستخدم العناصر الإضافية قائمة الأسعار أعلاه.',
        talkToAdvisor: 'تحدث إلى مستشار',
        orderSent: 'تم إرسال الطلب',
        delivery: 'توصيل خلال 48 ساعة في الدار البيضاء',
        billing: 'فوترة',
        onNextSettlement: 'على تسويتك التالية',
        advisorNotified: 'تم إشعار مستشار كيوي',
        advisorCallback: 'سيتصل بك أحد أعضاء الفريق خلال اليوم.',
    },
};
handlers['terminal-catalog'] = () => {
  const T = CATALOG_STR[trLang()] || CATALOG_STR.fr;
  const CATALOG = [
    {
      sku: 'kiwipad-pro', name: 'KiwiPad pro', price: '300 €',
      img: 'Hardware_pictures/Hardware_4.png',
      tag: T.kiwipadProTag,
      desc: T.kiwipadProDesc,
      featured: true,
    },
    {
      sku: 'kiwiorders-pro', name: 'KiwiOrders pro', price: '200 €',
      img: 'Hardware_pictures/Hardware_KDS1.png',
      tag: T.kiwiordersProTag,
      desc: T.kiwiordersProDesc,
    },
    {
      sku: 'kiwipad-cashless', name: 'KiwiPad cashless', price: '100 €',
      img: 'Hardware_pictures/Hardware_2.png',
      tag: T.kiwipadCashlessTag,
      desc: T.kiwipadCashlessDesc,
    },
  ];

  drawer({
    title: T.title,
    subtitle: T.subtitle,
    width: 880,
    body: `
      <div class="p-hero">
        <div class="l">${T.heroTitle}</div>
        <div class="big" style="font-size:26px;">${T.heroModels} <span style="font-size:16px; opacity:0.75;">· ${T.heroKds}</span></div>
        <div class="sub">${T.heroSubtitle}</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        ${CATALOG.map(p => `
          <div class="p-card" style="margin:0; padding:0; overflow:hidden; background:#fff; ${p.featured ? 'grid-column:1 / -1; display:grid; grid-template-columns:1.1fr 1fr;' : ''} border:1px solid ${p.featured ? 'rgba(11,110,79,0.22)' : 'var(--n-200)'}; ${p.featured ? 'box-shadow:0 1px 0 rgba(11,110,79,0.06), 0 14px 32px -18px rgba(11,110,79,0.22);' : ''}">
            <div style="position:relative; ${p.featured ? 'aspect-ratio:auto; min-height:260px;' : 'aspect-ratio:5/3;'} background:var(--paper-soft); display:flex; align-items:center; justify-content:center; padding:${p.featured ? '20' : '14'}px; ${p.featured ? 'border-right:1px solid var(--n-200);' : 'border-bottom:1px solid var(--n-200);'}">
              <img src="${p.img}" alt="${p.name}" style="max-width:100%; max-height:100%; object-fit:contain; display:block;" loading="lazy">
              ${p.featured ? `<span class="chip" style="position:absolute; top:12px; left:12px; background:var(--ink); color:var(--mint); font-size:10px; padding:4px 10px; letter-spacing:0.08em;">${T.flagship}</span>` : ''}
              <span style="position:absolute; top:${p.featured ? '12' : '10'}px; right:${p.featured ? '12' : '10'}px; background:#fff; border:1px solid var(--n-200); border-radius:999px; padding:4px 10px; font-family:var(--mono); font-size:12px; font-weight:600; color:var(--ink);">${p.price}</span>
            </div>
            <div style="padding:${p.featured ? '20px 22px' : '14px 16px 16px'}; display:flex; flex-direction:column;">
              <h4 style="margin:0 0 4px; font-size:${p.featured ? '20' : '15.5'}px; letter-spacing:-0.015em;">${p.name}</h4>
              <div style="font-family:var(--mono); font-size:${p.featured ? '11' : '10.5'}px; color:var(--atlas); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px;">${p.tag}</div>
              <p style="margin:0 0 14px; font-size:${p.featured ? '13.5' : '12.5'}px; color:var(--n-600); line-height:1.55; flex:1;">${p.desc}</p>
              <button class="kb ${p.featured ? 'atlas' : 'ghost'}" data-action="catalog-order" data-arg="${p.sku}" style="width:100%; justify-content:center; padding:${p.featured ? '10px 16px' : '8px 12px'}; font-size:${p.featured ? '13' : '12.5'}px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18l-2 13H5L3 3z"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
                ${T.order} · ${p.price}
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="padding:16px 18px; background:var(--ink); color:var(--paper); border-radius:14px;">
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
          <div style="flex:1; min-width:240px;">
            <div style="font-family:var(--mono); font-size:10px; letter-spacing:0.12em; color:var(--mint); margin-bottom:4px;">${T.proProgram}</div>
            <div style="font-size:14px; font-weight:600;">${T.proProgramTitle}</div>
            <div style="font-size:12px; color:#a7d5b9; margin-top:3px;">${T.proProgramDesc}</div>
          </div>
          <button class="kb" data-action="contact-sales" style="background:var(--mint); color:var(--riad); padding:9px 16px; font-size:12.5px; font-weight:600;">${T.talkToAdvisor}</button>
        </div>
      </div>
    `,
  });

  if (!handlers['catalog-order']) {
    handlers['catalog-order'] = (_el, sku) => {
      const p = CATALOG.find(x => x.sku === sku);
      if (!p) return;
      toast(`${T.orderSent} · ${p.name}`, { type: 'success', duration: 2200, desc: `${T.delivery} · ${T.billing} ${p.price} ${T.onNextSettlement}.` });
    };
  }
  if (!handlers['contact-sales']) {
    handlers['contact-sales'] = () => toast(T.advisorNotified, { type: 'info', duration: 1800, desc: T.advisorCallback });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · RÈGLEMENTS · settlements ledger + 30-day cash-flow forecast
 * ─────────────────────────────────────────────────────────────────────────── */
const REGLEMENTS_STR = {
    fr: {
        settlements: 'Règlements',
        subtitle: (month, year, bank, acct, percent) => `${month} ${year} · ${bank} ••${acct} · T+1 · ${percent}% à l'heure`,
        settledThisMonth: 'RÉGLÉ CE MOIS',
        settlementsCount: (count) => `${count} versements`,
        savingsVsCmi: 'économie vs CMI',
        cashflow30d: 'Cash-flow · 30 jours',
        history14d: 'Historique 14 j · projection IA 16 j à venir',
        upcoming16d: 'à venir 16 j',
        today: 'AUJ.',
        nextT1: 'PROCHAIN T+1',
        tomorrow9am: 'Demain 9h00',
        settleNow: 'Régler maintenant',
        commissions: 'COMMISSIONS',
        blended: 'blended',
        savingsVsCmiTitle: 'ÉCONOMIE vs CMI',
        vsTpeRental: 'Vs 2,0 % + loc TPE',
        linkedBankAccounts: 'Comptes bancaires liés',
        addIban: '+ IBAN',
        mainAccount: 'Compte principal · 100 % du flux',
        backupAccount: 'Backup · 0 % flux configuré',
        reconciled: 'Rapproché',
        pending: 'En attente',
        details: 'Détails',
        settlementDetail: (date) => `Détail du règlement de demain (${date})`,
        grossVolume: 'Volume brut',
        orders: 'commandes',
        visaMcInterchange: 'Interchange Visa/MC',
        kiwiNetworkFees: 'Frais réseau Kiwi',
        vatOnFees: 'TVA sur frais',
        netPaid: 'Net versé',
        recentHistory: 'Historique récent',
        settled: 'Réglé',
        instantTransfer: 'Virement instantané · weekend',
        exportPdf: 'Export PDF',
        exportCsv: 'Export CSV',
        accountingPackage: 'Pack comptable',
        instantSettlementToast: (amount) => `Règlement instantané · ${amount} MAD viré`,
        addIbanToast: 'Ajouter un IBAN — flux KYC bientôt',
        ibanDetailsToast: 'Détails du compte',
        pdfExportToast: 'Export PDF généré · téléchargement en cours',
        csvExportToast: (lines) => `Export CSV généré · ${lines} lignes`,
        accountingPackageToast: 'Pack comptable · envoyé à votre expert-comptable',
    },
    en: {
        settlements: 'Settlements',
        subtitle: (month, year, bank, acct, percent) => `${month} ${year} · ${bank} ••${acct} · T+1 · ${percent}% on time`,
        settledThisMonth: 'SETTLED THIS MONTH',
        settlementsCount: (count) => `${count} settlements`,
        savingsVsCmi: 'savings vs CMI',
        cashflow30d: 'Cash-flow · 30 days',
        history14d: '14-day history · 16-day AI projection',
        upcoming16d: 'upcoming 16 d',
        today: 'TODAY',
        nextT1: 'NEXT T+1',
        tomorrow9am: 'Tomorrow 9:00 AM',
        settleNow: 'Settle now',
        commissions: 'COMMISSIONS',
        blended: 'blended',
        savingsVsCmiTitle: 'SAVINGS vs CMI',
        vsTpeRental: 'Vs 2.0% + POS rental',
        linkedBankAccounts: 'Linked bank accounts',
        addIban: '+ IBAN',
        mainAccount: 'Main account · 100% of flow',
        backupAccount: 'Backup · 0% flow configured',
        reconciled: 'Reconciled',
        pending: 'Pending',
        details: 'Details',
        settlementDetail: (date) => `Settlement detail for tomorrow (${date})`,
        grossVolume: 'Gross volume',
        orders: 'orders',
        visaMcInterchange: 'Visa/MC Interchange',
        kiwiNetworkFees: 'Kiwi network fees',
        vatOnFees: 'VAT on fees',
        netPaid: 'Net paid',
        recentHistory: 'Recent history',
        settled: 'Settled',
        instantTransfer: 'Instant transfer · weekend',
        exportPdf: 'Export PDF',
        exportCsv: 'Export CSV',
        accountingPackage: 'Accounting package',
        instantSettlementToast: (amount) => `Instant settlement · ${amount} MAD transferred`,
        addIbanToast: 'Add an IBAN — KYC flow coming soon',
        ibanDetailsToast: 'Account details',
        pdfExportToast: 'PDF Export generated · download in progress',
        csvExportToast: (lines) => `CSV Export generated · ${lines} lines`,
        accountingPackageToast: 'Accounting package · sent to your accountant',
    },
    ar: {
        settlements: 'التسويات',
        subtitle: (month, year, bank, acct, percent) => `${month} ${year} · ${bank} ••${acct} · T+1 · ${percent}% في الوقت المحدد`,
        settledThisMonth: 'تمت تسويته هذا الشهر',
        settlementsCount: (count) => `${count} تسويات`,
        savingsVsCmi: 'التوفير مقابل CMI',
        cashflow30d: 'التدفق النقدي · 30 يومًا',
        history14d: 'سجل 14 يومًا · توقعات الذكاء الاصطناعي لـ 16 يومًا قادمة',
        upcoming16d: 'قادم في 16 يومًا',
        today: 'اليوم',
        nextT1: 'T+1 التالي',
        tomorrow9am: 'غدًا 9:00 صباحًا',
        settleNow: 'تسوية الآن',
        commissions: 'العمولات',
        blended: 'مخلوط',
        savingsVsCmiTitle: 'التوفير مقابل CMI',
        vsTpeRental: 'مقابل 2.0٪ + إيجار TPE',
        linkedBankAccounts: 'الحسابات المصرفية المرتبطة',
        addIban: '+ IBAN',
        mainAccount: 'الحساب الرئيسي · 100٪ من التدفق',
        backupAccount: 'حساب احتياطي · 0٪ تدفق مهيأ',
        reconciled: 'تمت التسوية',
        pending: 'قيد الانتظار',
        details: 'التفاصيل',
        settlementDetail: (date) => `تفاصيل تسوية الغد (${date})`,
        grossVolume: 'الحجم الإجمالي',
        orders: 'طلبات',
        visaMcInterchange: 'رسوم فيزا/ماستركارد',
        kiwiNetworkFees: 'رسوم شبكة كيوي',
        vatOnFees: 'ضريبة القيمة المضافة على الرسوم',
        netPaid: 'صافي المبلغ المدفوع',
        recentHistory: 'السجل الحديث',
        settled: 'تمت التسوية',
        instantTransfer: 'تحويل فوري · عطلة نهاية الأسبوع',
        exportPdf: 'تصدير PDF',
        exportCsv: 'تصدير CSV',
        accountingPackage: 'حزمة المحاسبة',
        instantSettlementToast: (amount) => `تسوية فورية · ${amount} درهم محوّل`,
        addIbanToast: 'إضافة IBAN — تدفق KYC قريبًا',
        ibanDetailsToast: 'تفاصيل الحساب',
        pdfExportToast: 'تم إنشاء تصدير PDF · التنزيل قيد التقدم',
        csvExportToast: (lines) => `تم إنشاء تصدير CSV · ${lines} أسطر`,
        accountingPackageToast: 'حزمة المحاسبة · أرسلت إلى محاسبك',
    },
};
handlers['nav-reglements'] = () => {
  // 30-day forecast — historical 14 days (solid) + 16 days projected (dashed)
  const days = 30;
  const fc = [];
  let base = 18000;
  for (let i = 0; i < days; i++) {
    const dow = (i + 3) % 7; // mon=0..sun=6
    const weekendBoost = dow >= 4 ? 1.18 : 1.0;
    const drift = base + Math.sin(i / 4) * 2200 + (Math.random() - 0.5) * 1800;
    fc.push(Math.round(drift * weekendBoost));
  }
  const W = 660, H = 110, pad = 6;
  const max = Math.max(...fc), min = Math.min(...fc);
  const x = (i) => pad + (i / (days - 1)) * (W - pad * 2);
  const y = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const histPts = fc.slice(0, 14).map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const projPts = fc.slice(13).map((v, i) => `${x(i + 13)},${y(v)}`).join(' ');
  const areaPts = `${pad},${H - pad} ${histPts} ${x(13)},${H - pad}`;
  const totalProj = fc.slice(14).reduce((a, b) => a + b, 0);

  const T = REGLEMENTS_STR[trLang()] || REGLEMENTS_STR.fr;

  const settles = [
    ['28 avril', '29 941,13', `${T.settled} · Bank of Africa ••3291`, 'ok'],
    ['27 avril', '24 102,80', `${T.settled} · Bank of Africa ••3291`, 'ok'],
    ['26 avril', '22 850,40', `${T.instantTransfer}`, 'ok'],
    ['25 avril', '21 688,15', `${T.settled} · Bank of Africa ••3291`, 'ok'],
    ['24 avril', '17 290,60', `${T.settled} · Bank of Africa ••3291`, 'ok'],
    ['23 avril', '19 824,25', `${T.settled} · Bank of Africa ••3291`, 'ok'],
    ['22 avril', '23 091,50', `${T.settled} · Bank of Africa ••3291`, 'ok'],
  ];

  drawer({
    title: T.settlements,
    subtitle: T.subtitle('Avril', '2026', 'Bank of Africa', '3291', '99,2'),
    width: 760,
    body: `
      <div class="p-hero">
        <div class="l">RÉGLÉ CE MOIS</div>
        <div class="big">347 280 <span style="font-size:18px; opacity:0.7;">MAD</span></div>
        <div class="sub">22 versements · économie vs CMI : +5 240 MAD ce mois</div>
      </div>

      <div class="p-card" style="background:#fff; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:6px;">
          <div>
            <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase;">Cash-flow · 30 jours</div>
            <div style="font-size:13px; color:var(--n-600); margin-top:3px;">Historique 14 j · projection IA 16 j à venir</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--mono); font-size:18px; font-weight:600; color:var(--atlas); letter-spacing:-0.015em;">+${totalProj.toLocaleString('fr-FR').replace(/,/g, ' ')} MAD</div>
            <div style="font-size:11px; color:var(--n-500);">à venir 16 j</div>
          </div>
        </div>
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block; margin-top:8px;">
          <defs><linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--atlas)" stop-opacity="0.18"/><stop offset="1" stop-color="var(--atlas)" stop-opacity="0"/></linearGradient></defs>
          <polygon points="${areaPts}" fill="url(#cf-grad)"/>
          <polyline points="${histPts}" fill="none" stroke="var(--atlas)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="${projPts}" fill="none" stroke="var(--atlas)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" stroke-opacity="0.6"/>
          <line x1="${x(13)}" y1="${pad}" x2="${x(13)}" y2="${H-pad}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 3" opacity="0.4"/>
          <circle cx="${x(13)}" cy="${y(fc[13])}" r="3.5" fill="var(--atlas)"/>
          <text x="${x(13)+6}" y="${pad+12}" font-family="var(--mono)" font-size="9" fill="var(--n-500)" letter-spacing="0.06em">AUJ.</text>
        </svg>
      </div>

      <div style="background:var(--paper-soft); border-radius:14px; padding:16px; margin:10px 0; display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px;">
        <div>
          <div style="font-size:10.5px; color:var(--n-500); letter-spacing:0.08em; font-family:var(--mono);">PROCHAIN T+1</div>
          <div style="font-size:21px; font-weight:600; margin-top:4px; letter-spacing:-0.02em;">23 091 MAD</div>
          <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">Demain 9h00</div>
          <button class="kb atlas" data-action="settle-now" style="margin-top:10px; padding:6px 12px; font-size:12px;">Régler maintenant</button>
        </div>
        <div>
          <div style="font-size:10.5px; color:var(--n-500); letter-spacing:0.08em; font-family:var(--mono);">COMMISSIONS</div>
          <div style="font-size:21px; font-weight:600; margin-top:4px; color:var(--danger); letter-spacing:-0.02em;">−4 128 MAD</div>
          <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">1,18 % blended</div>
        </div>
        <div>
          <div style="font-size:10.5px; color:var(--n-500); letter-spacing:0.08em; font-family:var(--mono);">ÉCONOMIE vs CMI</div>
          <div style="font-size:21px; font-weight:600; margin-top:4px; color:var(--atlas); letter-spacing:-0.02em;">+5 240 MAD</div>
          <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">Vs 2,0 % + loc TPE</div>
        </div>
      </div>

      <div class="p-card" style="background:#fff; padding:16px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:13px; font-weight:600;">Comptes bancaires liés</div>
          <button class="kb ghost" data-action="add-iban" style="padding:5px 10px; font-size:11.5px;">+ IBAN</button>
        </div>
        ${[
          ['Bank of Africa', '••3291', 'Compte principal · 100 % du flux', 'ok', 'Rapproché'],
          ['Attijariwafa', '••8104', 'Backup · 0 % flux configuré', 'neutral', 'En attente'],
        ].map(([b, m, d, st, lbl]) => `
          <div style="display:grid; grid-template-columns:auto 1fr auto auto; gap:14px; padding:11px 0; border-top:1px solid var(--n-200); align-items:center;">
            <div style="width:32px; height:32px; border-radius:8px; background:var(--ink); color:var(--mint); display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:10px; font-weight:600;">${b.slice(0,2).toUpperCase()}</div>
            <div>
              <div style="font-weight:500; font-size:13.5px;">${b} <span style="color:var(--n-500); font-family:var(--mono); font-size:12px;">${m}</span></div>
              <div style="font-size:11.5px; color:var(--n-500); margin-top:2px;">${d}</div>
            </div>
            <span class="chip ${st}">${lbl}</span>
            <button class="kb ghost" data-action="iban-detail" style="padding:5px 9px; font-size:11px;">Détails</button>
          </div>
        `).join('')}
      </div>

      <div class="p-card" style="background:#fff; padding:16px; margin-bottom:10px;">
        <div style="font-size:13px; font-weight:600; margin-bottom:10px;">Détail du règlement de demain (28 avril → 29 avril)</div>
        <table class="p-table">
          <tbody>
            <tr><td>Volume brut · 142 commandes</td><td class="mono right">+23 484,80 MAD</td></tr>
            <tr><td style="color:var(--n-500);">Interchange Visa/MC (1,18 %)</td><td class="mono right" style="color:var(--danger);">−277,12 MAD</td></tr>
            <tr><td style="color:var(--n-500);">Frais réseau Kiwi (0,30 %)</td><td class="mono right" style="color:var(--danger);">−70,45 MAD</td></tr>
            <tr><td style="color:var(--n-500);">TVA sur frais</td><td class="mono right" style="color:var(--danger);">−46,23 MAD</td></tr>
            <tr style="border-top:2px solid var(--ink);"><td><b>Net versé · Bank of Africa ••3291</b></td><td class="mono right"><b style="color:var(--atlas); font-size:15px;">23 091,00 MAD</b></td></tr>
          </tbody>
        </table>
      </div>

      <div style="font-size:11px; letter-spacing:0.1em; color:var(--n-500); font-family:var(--mono); text-transform:uppercase; margin:14px 0 8px;">Historique récent</div>
      <div style="background:#fff; border:1px solid var(--n-200); border-radius:12px; padding:6px 14px;">
        ${settles.map(([d, a, s, st]) => `
          <div style="display:grid; grid-template-columns:110px 1fr 180px 90px; gap:14px; padding:11px 0; border-top:1px solid var(--n-200); align-items:center; font-size:13px;">
            <b>${d}</b>
            <span class="mono" style="font-family:var(--mono); font-weight:500;">${a} MAD</span>
            <span style="color:var(--n-500); font-size:11.5px;">${s}</span>
            <span style="text-align:right;"><span class="chip ${st}">${st === 'ok' ? 'Réglé' : 'Attente'}</span></span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; gap:8px; margin-top:14px;">
        <button class="kb ghost" data-action="export-pdf" style="flex:1; justify-content:center; padding:10px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>Export PDF</button>
        <button class="kb ghost" data-action="export-csv" style="flex:1; justify-content:center; padding:10px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export CSV</button>
        <button class="kb atlas" data-action="export-comptable" style="flex:1; justify-content:center; padding:10px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg>Pack comptable</button>
      </div>
    `,
  });

  if (!handlers['settle-now']) handlers['settle-now'] = () => toast('Règlement instantané · 23 091 MAD viré', { type: 'success', duration: 2200 });
  if (!handlers['add-iban']) handlers['add-iban'] = () => toast('Ajouter un IBAN — flux KYC bientôt', { type: 'info', duration: 1600 });
  if (!handlers['iban-detail']) handlers['iban-detail'] = () => toast('Détails du compte', { type: 'info', duration: 1400 });
  if (!handlers['export-pdf']) handlers['export-pdf'] = () => toast('Export PDF généré · téléchargement en cours', { type: 'success', duration: 1800 });
  if (!handlers['export-csv']) handlers['export-csv'] = () => toast('Export CSV généré · 22 lignes', { type: 'success', duration: 1800 });
  if (!handlers['export-comptable']) handlers['export-comptable'] = () => toast('Pack comptable · envoyé à votre expert-comptable', { type: 'success', duration: 2200 });
};
})();

/* ═══ Section 1B · conformite / equipe / payroll / reservations ═══ */
(function() {
  "use strict";
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const fullpage = Kiwi.fullpage;
  const modal = Kiwi.modal;
  const toast = Kiwi.toast;
  const menu = Kiwi.menu;
  const confetti = Kiwi.confetti;
/* ════════════════════════════════════════════════════════════════════════════
 * Kiwi · sidebar handlers · S1B polish pass
 * Investor-demo quality drawers for: nav-conformite · nav-equipe ·
 * nav-payroll · nav-reservations.
 * Drop-in replacements for the existing handlers. CTAs route through toasts;
 * markup IS the deliverable.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ═══════════════════ CONFORMITÉ ═══════════════════ */
const CONFORMITE_STR = {
    fr: {
        title: 'Conformité & sécurité',
        subtitle: (name) => `${name} · 100 % conforme · audit BAM passé`,
        scoreTitle: 'SCORE DE CONFORMITÉ',
        score: '100 / 100 · AAA',
        scoreDesc: 'Bank Al-Maghrib · PCI-DSS L1 · CNDP loi 09-08 · GAFI. Dernier audit 12 mars 2026.',
        reportPdf: 'Rapport PDF',
        kycDocs: 'Coffre KYC documentaire',
        kycDocsSub: '6 documents · synchronisés DGI / CNSS · re-upload en 1 clic',
        upload: 'Téléverser',
        doc: 'DOCUMENT',
        ref: 'RÉFÉRENCE',
        status: 'STATUT',
        expires: 'ÉCHÉANCE',
        reupload: 'Re-upload',
        amlScreening: 'Screening AML / PEP',
        amlScreeningSub: 'Dernier scan il y a 6 min · prochain scan 18:00',
        live: 'Live',
        noMatch: 'Aucun match',
        declarationsCalendar: 'Calendrier déclarations BAM & DGI',
        declarationsCalendarSub: '3 échéances dans les 30 jours',
        auditLog: "Journal d'audit · loi 09-08 / RGPD",
        auditLogSub: 'Toute action sensible enregistrée · 7 ans de rétention',
        exportSignedCsv: 'Exporter CSV signé',
        secretsRotation: 'Rotation des secrets',
        secretsRotationSub: 'Clés API · webhooks · tokens · HSM ledger',
        manualRotation: 'Rotation manuelle',
        uploadKycToast: 'Téléverser un document KYC',
        uploadKycToastDesc: 'Glissez le PDF/JPEG · OCR + vérification automatique en 30 s.',
        reuploadKycToast: 'Re-upload document',
        reuploadKycToastDesc: 'Sélectionnez le nouveau fichier · ancienne version archivée 7 ans.',
        calendarExportToast: 'Calendrier .ics exporté',
        calendarExportToastDesc: 'Importable dans Google Calendar, Outlook, Apple Calendar.',
        auditExportToast: 'Export CSV signé',
        auditExportToastDesc: 'Hash SHA-256 + signature horodatée Bank Al-Maghrib.',
        rotateSecretToast: 'Rotation manuelle initiée',
        rotateSecretToastDesc: 'Nouveau secret généré · ancien valide 24 h pour transition.',
    },
    en: {
        title: 'Compliance & Security',
        subtitle: (name) => `${name} · 100% compliant · BAM audit passed`,
        scoreTitle: 'COMPLIANCE SCORE',
        score: '100 / 100 · AAA',
        scoreDesc: 'Bank Al-Maghrib · PCI-DSS L1 · CNDP law 09-08 · FATF. Last audit March 12, 2026.',
        reportPdf: 'PDF Report',
        kycDocs: 'KYC Document Vault',
        kycDocsSub: '6 documents · DGI / CNSS synchronized · 1-click re-upload',
        upload: 'Upload',
        doc: 'DOCUMENT',
        ref: 'REFERENCE',
        status: 'STATUS',
        expires: 'EXPIRATION',
        reupload: 'Re-upload',
        amlScreening: 'AML / PEP Screening',
        amlScreeningSub: 'Last scan 6 min ago · next scan 6:00 PM',
        live: 'Live',
        noMatch: 'No match',
        declarationsCalendar: 'BAM & DGI Declarations Calendar',
        declarationsCalendarSub: '3 deadlines within 30 days',
        auditLog: 'Audit Log · Law 09-08 / GDPR',
        auditLogSub: 'All sensitive actions recorded · 7-year retention',
        exportSignedCsv: 'Export Signed CSV',
        secretsRotation: 'Secrets Rotation',
        secretsRotationSub: 'API keys · webhooks · tokens · HSM ledger',
        manualRotation: 'Manual Rotation',
        uploadKycToast: 'Upload a KYC document',
        uploadKycToastDesc: 'Drag and drop the PDF/JPEG · OCR + automatic verification in 30s.',
        reuploadKycToast: 'Re-upload document',
        reuploadKycToastDesc: 'Select the new file · old version archived for 7 years.',
        calendarExportToast: 'Calendar .ics exported',
        calendarExportToastDesc: 'Importable into Google Calendar, Outlook, Apple Calendar.',
        auditExportToast: 'Signed CSV Export',
        auditExportToastDesc: 'SHA-256 hash + Bank Al-Maghrib timestamped signature.',
        rotateSecretToast: 'Manual rotation initiated',
        rotateSecretToastDesc: 'New secret generated · old one valid for 24h for transition.',
    },
    ar: {
        title: 'الامتثال والأمان',
        subtitle: (name) => `${name} · امتثال 100٪ · تم اجتياز تدقيق بنك المغرب`,
        scoreTitle: 'درجة الامتثال',
        score: '100 / 100 · AAA',
        scoreDesc: 'بنك المغرب · PCI-DSS L1 · قانون CNDP 09-08 · GAFI. آخر تدقيق 12 مارس 2026.',
        reportPdf: 'تقرير PDF',
        kycDocs: 'خزنة مستندات اعرف عميلك',
        kycDocsSub: '6 مستندات · متزامنة مع DGI / CNSS · إعادة تحميل بنقرة واحدة',
        upload: 'تحميل',
        doc: 'المستند',
        ref: 'المرجع',
        status: 'الحالة',
        expires: 'انتهاء الصلاحية',
        reupload: 'إعادة تحميل',
        amlScreening: 'فحص مكافحة غسيل الأموال / PEP',
        amlScreeningSub: 'آخر فحص قبل 6 دقائق · الفحص التالي 6:00 مساءً',
        live: 'مباشر',
        noMatch: 'لا يوجد تطابق',
        declarationsCalendar: 'تقويم إعلانات بنك المغرب و DGI',
        declarationsCalendarSub: '3 مواعيد نهائية خلال 30 يومًا',
        auditLog: 'سجل التدقيق · قانون 09-08 / GDPR',
        auditLogSub: 'جميع الإجراءات الحساسة مسجلة · الاحتفاظ لمدة 7 سنوات',
        exportSignedCsv: 'تصدير CSV موقع',
        secretsRotation: 'تدوير الأسرار',
        secretsRotationSub: 'مفاتيح API · webhooks · الرموز · دفتر الأستاذ HSM',
        manualRotation: 'تدوير يدوي',
        uploadKycToast: 'تحميل مستند KYC',
        uploadKycToastDesc: 'اسحب وأفلت ملف PDF/JPEG · OCR + تحقق تلقائي في 30 ثانية.',
        reuploadKycToast: 'إعادة تحميل المستند',
        reuploadKycToastDesc: 'حدد الملف الجديد · يتم أرشفة الإصدار القديم لمدة 7 سنوات.',
        calendarExportToast: 'تم تصدير تقويم .ics',
        calendarExportToastDesc: 'يمكن استيراده إلى تقويم Google و Outlook و Apple Calendar.',
        auditExportToast: 'تصدير CSV موقع',
        auditExportToastDesc: 'تجزئة SHA-256 + توقيع بنك المغرب المختوم بالوقت.',
        rotateSecretToast: 'بدء التدوير اليدوي',
        rotateSecretToastDesc: 'تم إنشاء سر جديد · القديم صالح لمدة 24 ساعة للانتقال.',
    },
};
handlers['nav-conformite'] = () => {
  const v = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas', type: 'restaurant' };
  const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
  const docs = [
    ['CIN gérant', 'Rachid Benhima · BK 384721', 'Expire dans 14 mois', 'ok', '14 mars 2027'],
    ['Registre de commerce', 'RC Tanger · 3847821', 'Renouvelé · valide 12 mois', 'ok', '20 janv. 2027'],
    ['Patente professionnelle', 'Article 21 · TPE Tanger', 'Expire dans 47 jours', 'pend', '15 juin 2026'],
    ['ICE', '00284912000089 · DGI', 'Permanent · vérifié', 'ok', '—'],
    ['Attestation CNSS', 'Affiliation 9 281 037', 'À jour · payée le 12 avril', 'ok', 'Trim. suivant'],
    ['Quittance TVA · Q1 2026', 'Régime du réel · trimestriel', 'À déposer dans 6 jours', 'pend', '5 mai 2026'],
  ];
  const aml = [
    ['UN sanctions', T.noMatch, `14:02 ${T.today}`],
    ['EU consolidated', T.noMatch, `14:02 ${T.today}`],
    ['OFAC SDN', T.noMatch, `14:02 ${T.today}`],
    ['ANRF Maroc · PEP', T.noMatch, `14:02 ${T.today}`],
  ];
  const audit = [
    ['14:02', 'Screening AML automatique', 'Système · 4 listes', 'ok'],
    ['09:18', 'Export ledger anonymisé', 'badromail9@kiwi.ma', 'ok'],
    ['Hier 23:11', 'Rotation token webhook', 'Système · cron', 'ok'],
    ['Hier 18:44', 'Accès données client (RGPD art. 15)', 'Sara L. · demande satisfaite', 'ok'],
    ['22 avril', 'Audit trail exporté pour DGI', 'Comptable Hassani', 'ok'],
    ['18 avril', 'Tentative login refusée · IP RU', 'Mehdi M. · alerte WhatsApp', 'ref'],
    ['12 avril', 'Mise à jour politique de confidentialité', 'CNDP · loi 09-08', 'ok'],
  ];
  const secrets = [
    ['Clé API publique', 'pk_live_kw_••••a921', 'Rotation auto · 90 jours', '12 jours', 'ok'],
    ['Webhook signing secret', 'whsec_••••2f30', 'Rotée hier 23:11', '< 1 jour', 'ok'],
    ['Token agent mode', 'agt_••••4c81', 'Rotation manuelle requise', '84 jours', 'pend'],
    ['Clé chiffrement ledger', 'KMS · n+one Casa', 'HSM · rotation annuelle', '6 mois', 'ok'],
  ];
  drawer({
    title: T.title,
    subtitle: T.subtitle(v.name),
    width: 880,
    body: `
      <div class="comp-score">
        <div class="ring">
          <svg viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
            <circle cx="21" cy="21" r="17" fill="none" stroke="var(--mint)" stroke-width="4" stroke-dasharray="100 107" stroke-dashoffset="25" transform="rotate(-90 21 21)" stroke-linecap="round"/>
          </svg>
          <div class="c">AAA</div>
        </div>
        <div>
          <div class="t">${T.scoreTitle}</div>
          <div class="v">${T.score}</div>
          <div class="d">${T.scoreDesc}</div>
        </div>
        <button class="kb" data-action="download-kit" style="background:var(--mint); color:var(--riad); padding:9px 14px; font-size:12.5px; align-self:center;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7 7 7-7M5 21h14"/></svg>${T.reportPdf}
        </button>
      </div>

      <div class="sh-section">
        <div class="sh-section-head">
          <div><h4>${T.kycDocs}</h4><div class="sub">${T.kycDocsSub}</div></div>
          <button class="kb ghost" data-action="upload-kyc">+ ${T.upload}</button>
        </div>
        <table class="p-table">
          <thead><tr><th>${T.doc}</th><th>${T.ref}</th><th>${T.status}</th><th class="right">${T.expires}</th><th></th></tr></thead>
          <tbody>
            ${docs.map(([n, ref, s, st, exp]) => `
              <tr>
                <td><b>${n}</b></td>
                <td style="color:var(--n-500); font-size:12px;">${ref}</td>
                <td><span class="chip ${st}">${s}</span></td>
                <td class="mono right" style="font-size:12px;">${exp}</td>
                <td class="right"><button class="kb ghost" data-action="kyc-replace" style="padding:5px 9px; font-size:11px;">${T.reupload}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="sh-grid-2">
        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>${T.amlScreening}</h4><div class="sub">${T.amlScreeningSub}</div></div>
            <span class="chip ok">${T.live}</span>
          </div>
          ${aml.map(([list, res, t]) => `
            <div style="display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; padding:10px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
              <div><b>${list}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${t}</div></div>
              <span class="chip ok" style="font-size:10.5px;">${res}</span>
            </div>
          `).join('')}
          <div class="rc-foot" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--n-200); font-size:11.5px; color:var(--n-500); line-height:1.45;">
            Continu · scan toutes les 4 h sur la base clients & équipe. Alertes WhatsApp + email aux dirigeants.
          </div>
        </div>

        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>${T.declarationsCalendar}</h4><div class="sub">${T.declarationsCalendarSub}</div></div>
            <button class="kb ghost" data-action="cal-export" style="padding:6px 10px; font-size:11px;">.ics</button>
          </div>
          ${[
            ['5 mai', 'Quittance TVA Q1 2026', 'DGI · télédéclaration', 'pend'],
            ['12 mai', 'Rapport trimestriel acquéreur', 'Bank Al-Maghrib', 'pend'],
            ['25 mai', 'Bordereau CNSS · avril', 'CNSS · DAMANCOM', 'ok'],
            ['15 juin', 'Renouvellement patente', 'TPE Tanger', 'pend'],
          ].map(([d, n, src, st]) => `
            <div style="display:grid; grid-template-columns:60px 1fr auto; gap:10px; align-items:center; padding:10px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
              <div class="mono" style="font-weight:600; font-size:13px;">${d}</div>
              <div><b>${n}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${src}</div></div>
              <span class="chip ${st}">${st === 'ok' ? 'Prêt' : 'À faire'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sh-section" style="margin-bottom:12px;">
        <div class="sh-section-head" style="margin-bottom:10px;">
          <div><h4>${T.auditLog}</h4><div class="sub">${T.auditLogSub}</div></div>
          <button class="kb ghost" data-action="audit-export" style="padding:6px 10px; font-size:11px;">${T.exportSignedCsv}</button>
        </div>
        ${audit.map(([t, ev, who, st]) => `
          <div style="display:grid; grid-template-columns:90px 1fr 1fr auto; gap:12px; align-items:center; padding:9px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
            <div class="mono" style="color:var(--n-500); font-size:11px;">${t}</div>
            <div><b>${ev}</b></div>
            <div style="color:var(--n-500); font-size:11.5px;">${who}</div>
            <span class="chip ${st}">${st === 'ok' ? 'OK' : 'Bloqué'}</span>
          </div>
        `).join('')}
      </div>

      <div class="sh-section" style="margin-bottom:0;">
        <div class="sh-section-head" style="margin-bottom:10px;">
          <div><h4>${T.secretsRotation}</h4><div class="sub">${T.secretsRotationSub}</div></div>
          <button class="kb ghost" data-action="rotate-secret" style="padding:6px 10px; font-size:11px;">${T.manualRotation}</button>
        </div>
        ${secrets.map(([n, mask, pol, age, st]) => `
          <div style="display:grid; grid-template-columns:1fr 160px 130px auto; gap:12px; align-items:center; padding:10px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
            <div><b>${n}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${pol}</div></div>
            <div class="mono" style="font-size:11px; color:var(--n-500);">${mask}</div>
            <div class="mono" style="font-size:11px;">il y a ${age}</div>
            <span class="chip ${st}">${st === 'ok' ? 'OK' : 'À tourner'}</span>
          </div>
        `).join('')}
      </div>
    `,
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
 * ÉQUIPE — redesigned for Kiwi 1.0 investor demo
 *
 * What you see on open:
 *   1. Status strip   — live count: En service / En pause / Hors service
 *   2. Kiwi AI alerts — flagged pointage anomalies (recurring lateness etc.)
 *   3. Members list   — sorted by status, with timeline bar (8h-2am scale)
 *                       showing scheduled shift vs actual time worked and a
 *                       NOW marker pegged to wall-clock time
 *   4. Permissions    — 5 role cards in a 2-col grid (replaces boring table)
 *   5. Journal PIN    — kept, polished
 *
 * Add-member modal is wired end-to-end: prénom + nom, rôle, PIN (auto-gen),
 * téléphone (optional) → pushed to in-memory state → drawer re-renders. Wiped
 * on page reload (no localStorage).
 *
 * Removed: green revenue hero, Passations de service, Certifications · suivi.
 * ─────────────────────────────────────────────────────────────────────────── */
handlers['nav-equipe'] = () => {
  const v = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas' };

  /* ─── Persistent in-memory team state (resets on page reload) ─── */
  if (!window.__kiwiTeam) {
    window.__kiwiTeam = {
      members: [
        // Équipe matin (8h-16h or short variants)
        { id: 1, initials: 'FK', name: 'Fatima Khalki',  role: 'Manager',          kind: 'manager', avatar: 'a', team: 'matin', shift: [8, 16],   breakAt: null,        pin: '1234' },
        { id: 2, initials: 'SB', name: 'Sofia Belkadi',  role: 'Barista',          kind: 'server',  avatar: 'c', team: 'matin', shift: [8, 16],   breakAt: [14, 14.5],  pin: '2345' },
        { id: 3, initials: 'MM', name: 'Mehdi Mansouri', role: 'Cuisine',          kind: 'kitchen', avatar: 'a', team: 'matin', shift: [8, 14],   breakAt: null,        pin: '3456' },
        { id: 4, initials: 'LS', name: 'Lina Saidi',     role: 'Caissière',        kind: 'cashier', avatar: 'b', team: 'matin', shift: [9, 15],   breakAt: null,        pin: '4567' },
        // Équipe soir (17h-1am)
        { id: 5, initials: 'HJ', name: 'Hamid Jelloul',  role: 'Serveur · terrasse', kind: 'server',  avatar: 'b', team: 'soir',  shift: [17, 25],  breakAt: null,        pin: '5678' },
        { id: 6, initials: 'YA', name: 'Youssef Amrani', role: 'Serveur · soir',   kind: 'server',  avatar: 'd', team: 'soir',  shift: [17, 25],  breakAt: null,        pin: '6789' },
        { id: 7, initials: 'NK', name: 'Nawal Kettani',  role: 'Caissière soir',   kind: 'cashier', avatar: 'd', team: 'soir',  shift: [18, 26],  breakAt: null,        pin: '7890' },
        { id: 8, initials: 'KB', name: 'Karim Berrada',  role: 'Cuisine soir',     kind: 'kitchen', avatar: 'c', team: 'soir',  shift: [17, 25],  breakAt: null,        pin: '8901' },
      ],
      nextId: 9,
    };
  }

  const ROLE_COLOR = { manager: 'var(--atlas)', server: 'var(--riad)', kitchen: '#D99A2B', cashier: '#0B6E4F', admin: 'var(--ink)' };
  const ROLE_OPTIONS = [
    { value: 'server',  label: 'Serveur / Serveuse' },
    { value: 'manager', label: 'Manager' },
    { value: 'kitchen', label: 'Cuisine' },
    { value: 'cashier', label: 'Caissier / Caissière' },
  ];

  /* ─── Time helpers (timeline scale: 8h → 26h == 8am to 2am next day) ─── */
  const SCALE_START = 8, SCALE_END = 26, SCALE_SPAN = SCALE_END - SCALE_START;
  const nowHours = () => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  };
  const formatTimeHr = (h) => {
    const wholeH = Math.floor(h) % 24;
    const m = Math.round((h - Math.floor(h)) * 60);
    return `${String(wholeH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const formatDuration = (mins) => {
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
  };

  /* Derive a member's live status from real-time vs scheduled shift. */
  function statusOf(m) {
    const now = nowHours();
    if (now < m.shift[0]) return 'scheduled';
    if (now >= m.shift[1]) return 'clocked-out';
    if (m.breakAt && now >= m.breakAt[0] && now <= m.breakAt[1]) return 'on-break';
    return 'on-shift';
  }
  const STATUS_INFO = {
    'on-shift':     { label: 'En service',      cls: 'ok',      dot: 'var(--success)', tone: 'rgba(11,110,79,0.10)' },
    'on-break':     { label: 'En pause',        cls: 'pend',    dot: 'var(--warning)', tone: 'rgba(217,154,43,0.10)' },
    'clocked-out':  { label: 'Sorti',           cls: 'neutral', dot: 'var(--n-400)',   tone: 'transparent' },
    'scheduled':    { label: 'Pas encore',      cls: 'neutral', dot: 'var(--n-300)',   tone: 'transparent' },
    'new':          { label: 'NOUV.',           cls: 'ok',      dot: 'var(--mint)',    tone: 'rgba(125,242,176,0.14)' },
  };
  const STATUS_ORDER = { 'on-shift': 0, 'on-break': 1, 'scheduled': 2, 'clocked-out': 3 };

  /* ─── Personal shift timeline — scale = member's own shift only ─── */
  function renderTimeline(m) {
    const status = statusOf(m);
    const now = nowHours();
    const startH = m.shift[0], endH = m.shift[1];
    const span = endH - startH;
    const pctOf = (h) => Math.min(100, Math.max(0, ((h - startH) / span) * 100));

    let workedPct, dotPct;
    if (status === 'clocked-out')     { workedPct = 100; dotPct = 100; }
    else if (status === 'scheduled')  { workedPct = 0;   dotPct = 0;   }
    else                              { workedPct = pctOf(now); dotPct = workedPct; }

    const roleC = ROLE_COLOR[m.kind] || 'var(--atlas)';
    const isLive = status === 'on-shift' || status === 'on-break';
    const breakL = m.breakAt ? pctOf(m.breakAt[0]) : 0;
    const breakW = m.breakAt ? pctOf(m.breakAt[1]) - breakL : 0;

    return `
      <div style="position: relative; padding: 14px 4px 4px;">
        <!-- the rail -->
        <div style="position: relative; height: 8px; background: linear-gradient(90deg, var(--n-100), #ECEAE4 50%, var(--n-100)); border-radius: 999px; overflow: visible;">
          ${workedPct > 0 ? `
            <div style="position: absolute; top: 0; bottom: 0; left: 0; width: ${workedPct}%;
              background: linear-gradient(90deg, ${roleC}, ${roleC === 'var(--atlas)' ? '#7DF2B0' : '#0B6E4F'});
              border-radius: 999px;
              box-shadow: 0 1px 2px rgba(11,110,79,0.18);
              transition: width 600ms cubic-bezier(0.32, 0.72, 0, 1);"></div>` : ''}
          ${m.breakAt ? `
            <div style="position: absolute; top: 0; bottom: 0; left: ${breakL}%; width: ${breakW}%;
              background: repeating-linear-gradient(45deg, rgba(255,255,255,0.55), rgba(255,255,255,0.55) 3px, transparent 3px, transparent 6px);
              border-radius: 999px;"></div>` : ''}
          ${isLive ? `
            <div style="position: absolute; left: ${dotPct}%; top: 50%; transform: translate(-50%, -50%);
              width: 16px; height: 16px; border-radius: 50%;
              background: #fff; border: 3px solid ${roleC};
              box-shadow: 0 0 0 5px rgba(11,110,79,0.10), 0 2px 6px rgba(10,15,13,0.14);
              z-index: 2;">
              <span style="position: absolute; inset: -3px; border-radius: 50%; background: ${roleC}; opacity: 0.28;
                animation: kw-eq-ripple 1.8s ease-out infinite;"></span>
            </div>` : ''}
        </div>
        <!-- end labels (NO whitespace-collapsing, dedicated start + end) -->
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span class="mono" style="font-size: 10.5px; color: var(--n-500); letter-spacing: 0.04em;">${formatTimeHr(startH)}</span>
          <span class="mono" style="font-size: 10.5px; color: var(--n-500); letter-spacing: 0.04em;">${formatTimeHr(endH >= 24 ? endH - 24 : endH)}</span>
        </div>
      </div>
    `;
  }

  /* ─── Kiwi AI · pointage anomaly alerts (mocked patterns) ─── */
  const AI_ALERTS = [
    {
      kind: 'late',
      title: 'Hamid Jelloul a pointé en retard 3 jours d\'affilée',
      detail: 'Moyenne +18 min sur la prise de service du soir · pattern récurrent depuis lundi.',
      action: 'Programmer un point',
      sev: 'pend',
    },
    {
      kind: 'overtime',
      title: 'Sofia Belkadi · 3h27 d\'heures sup. non validées',
      detail: 'Cumul sur la semaine en cours · à valider avant samedi pour intégration paie.',
      action: 'Valider les heures',
      sev: 'pend',
    },
    {
      kind: 'absent',
      title: 'Youssef Amrani n\'a pas pointé hier soir',
      detail: 'Aucune notification d\'absence reçue · 1ʳᵉ occurrence ce mois-ci.',
      action: 'Contacter Youssef',
      sev: 'ref',
    },
  ];

  /* ─── Permissions matrix (5 roles × 6 capabilities) ─── */
  const CAPS = ['Encaisser', 'Remboursement', 'Annulation ticket', 'Voir rapports', 'Modifier menu', 'Gérer équipe'];
  const PERMS = [
    { role: 'Propriétaire', kind: 'admin',   perms: [1,1,1,1,1,1] },
    { role: 'Manager',      kind: 'manager', perms: [1,1,1,1,1,1] },
    { role: 'Serveur',      kind: 'server',  perms: [1,0,1,0,0,0] },
    { role: 'Cuisine',      kind: 'kitchen', perms: [0,0,0,0,0,0] },
    { role: 'Caissier',     kind: 'cashier', perms: [1,0,1,1,0,0] },
  ];

  /* ─── Journal PIN — sensitive actions audit ─── */
  const PIN_LOG = [
    ['14:02', 'Fatima Khalki',  'Annulation ticket #4128',                              'ok'],
    ['13:48', 'Sofia Belkadi',  'Tentative remboursement refusée · niveau insuffisant',  'ref'],
    ['12:30', 'Hamid Jelloul',  'Ouverture caisse',                                      'ok'],
    ['Hier 22:55', 'Youssef Amrani', 'Échec PIN ×3 · réinitialisé par manager',         'pend'],
    ['Hier 21:12', 'Karim Berrada',  'Remboursement validé · 240 MAD',                   'ok'],
  ];

  /* ─── Open the drawer with a host div, then render into it ─── */
  let host;
  const dr = drawer({
    title: 'Équipe',
    subtitle: '…',
    width: 980,
    body: `<div data-eq-host></div>`,
  });
  host = dr.el.querySelector('[data-eq-host]');

  function render() {
    const members = window.__kiwiTeam.members;
    const decorated = members.map(m => ({ ...m, _status: statusOf(m) }));
    const counts = decorated.reduce((acc, m) => {
      if (m._status === 'on-shift') acc.onShift++;
      else if (m._status === 'on-break') acc.onBreak++;
      else acc.off++;
      return acc;
    }, { onShift: 0, onBreak: 0, off: 0 });

    // Sort by status group, then by name within group
    const sorted = decorated.slice().sort((a, b) => {
      const sa = STATUS_ORDER[a._status] ?? 9, sb = STATUS_ORDER[b._status] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });

    // Subtitle live counts
    const subEl = dr.el.querySelector('.kiwi-drawer-head p');
    if (subEl) subEl.textContent = `${v.name} · ${counts.onShift} en service · ${counts.onBreak} en pause · ${counts.off} hors service`;

    host.innerHTML = `
      <!-- Status strip -->
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px;">
        ${[
          ['EN SERVICE',     counts.onShift, 'var(--success)', 'rgba(11,110,79,0.08)'],
          ['EN PAUSE',       counts.onBreak, 'var(--warning)', 'rgba(217,154,43,0.10)'],
          ['HORS SERVICE',   counts.off,     'var(--n-400)',   'var(--paper-soft)'],
        ].map(([label, n, dot, bg]) => `
          <div style="padding:14px 16px; border:1px solid var(--n-200); border-radius:12px; background:${bg};">
            <div style="display:flex; align-items:center; gap:8px; font-family:var(--mono); font-size:10.5px; letter-spacing:0.1em; color:var(--n-500);">
              <span style="width:7px; height:7px; border-radius:50%; background:${dot};"></span>${label}
            </div>
            <div style="font-size:24px; font-weight:600; letter-spacing:-0.02em; margin-top:6px;">${n}<span style="font-size:13px; color:var(--n-500); font-weight:400; margin-left:4px;">/ ${decorated.length}</span></div>
          </div>
        `).join('')}
      </div>

      <!-- Kiwi AI · pointage anomalies -->
      <div style="background:linear-gradient(135deg, var(--ink) 0%, #15201A 100%); color:var(--paper); border-radius:14px; padding:16px 18px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:24px; height:24px; border-radius:7px; background:rgba(125,242,176,0.16); display:flex; align-items:center; justify-content:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" stroke-width="2"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"/></svg>
            </div>
            <div>
              <div style="font-family:var(--mono); font-size:10px; letter-spacing:0.12em; color:var(--mint);">KIWI AI · POINTAGES</div>
              <div style="font-size:13.5px; font-weight:600; margin-top:2px;">${AI_ALERTS.length} anomalies détectées cette semaine</div>
            </div>
          </div>
          <span class="chip" style="background:rgba(125,242,176,0.16); color:var(--mint); font-size:10.5px; padding:3px 9px;">recommandations</span>
        </div>
        ${AI_ALERTS.map(a => `
          <div style="display:grid; grid-template-columns:1fr auto; gap:14px; align-items:center; padding:10px 0; border-top:1px solid rgba(255,255,255,0.07);">
            <div>
              <div style="font-size:13px; font-weight:500; color:var(--paper);">${a.title}</div>
              <div style="font-size:11.5px; color:#a7d5b9; margin-top:3px; line-height:1.5;">${a.detail}</div>
            </div>
            <button class="kb" data-action="ai-pointage" data-arg="${a.kind}" style="background:rgba(125,242,176,0.14); color:var(--mint); padding:6px 12px; font-size:11.5px; white-space:nowrap;">${a.action} →</button>
          </div>
        `).join('')}
      </div>

      <!-- Members list -->
      <div style="padding:16px 18px; background:#fff; border:1px solid var(--n-200); border-radius:14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div>
            <h4 style="margin:0; font-size:14.5px; letter-spacing:-0.01em;">Membres · ${v.name}</h4>
            <div style="font-size:11.5px; color:var(--n-500); margin-top:3px;">Pointages temps réel via Kiwi Caisse · 2 équipes (matin / soir)</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="kb ghost" data-action="broadcast-team" style="padding:7px 11px; font-size:12px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
              Message équipe
            </button>
            <button class="kb primary" data-action="add-member" style="padding:7px 12px; font-size:12.5px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter un membre
            </button>
          </div>
        </div>

        <style>
          @keyframes kw-eq-ripple {
            0%   { transform: scale(1);   opacity: 0.42; }
            70%  { transform: scale(2.4); opacity: 0;    }
            100% { transform: scale(2.4); opacity: 0;    }
          }
          @keyframes kw-eq-pulse {
            0%, 100% { opacity: 1; }
            50%      { opacity: 0.55; }
          }
          .kw-eq-row { transition: border-color 180ms, box-shadow 180ms, transform 180ms; }
          .kw-eq-row.active { background: #fff; }
          .kw-eq-row.active:hover { box-shadow: 0 1px 0 rgba(10,15,13,0.04), 0 12px 24px -14px rgba(10,15,13,0.16); transform: translateY(-1px); }
          .kw-eq-row.inactive { background: var(--paper-soft); }
          .kw-eq-iconbtn { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--n-200); background: #fff; color: var(--n-500); cursor: pointer; transition: all 120ms; }
          .kw-eq-iconbtn:hover { color: var(--ink); border-color: var(--n-300); }
          .kw-eq-detailbtn { padding: 5px 11px; font-size: 11.5px; border-radius: 7px; border: 1px solid var(--n-200); background: #fff; color: var(--ink); cursor: pointer; transition: all 120ms; }
          .kw-eq-detailbtn:hover { background: var(--paper-soft); }
        </style>
        ${sorted.map(m => {
          const info = STATUS_INFO[m._status];
          const newChip = m.isNew ? `<span class="chip" style="background:rgba(125,242,176,0.20); color:var(--riad); font-size:9.5px; padding:2px 7px; margin-left:6px; letter-spacing:0.05em;">NOUV.</span>` : '';
          const roleC = ROLE_COLOR[m.kind] || 'var(--atlas)';
          const isActive = m._status === 'on-shift' || m._status === 'on-break';
          const durationMins  = isActive ? Math.round((nowHours() - m.shift[0]) * 60) : 0;
          const remainingMins = isActive ? Math.round((m.shift[1] - nowHours()) * 60) : 0;
          const totalMins     = (m.shift[1] - m.shift[0]) * 60;
          const progressPct   = isActive ? Math.round((durationMins / totalMins) * 100) : (m._status === 'clocked-out' ? 100 : 0);
          const shiftLabel = `${formatTimeHr(m.shift[0])} → ${formatTimeHr(m.shift[1] >= 24 ? m.shift[1] - 24 : m.shift[1])}`;
          const teamLabel  = m.team === 'matin' ? 'Équipe matin' : 'Équipe soir';

          if (isActive) {
            /* RICH active card */
            return `
              <div class="kw-eq-row active" style="position: relative; padding: 16px 18px; border: 1px solid var(--n-200); border-left: 3px solid ${roleC}; border-radius: 12px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: flex-start;">
                  <div class="av ${m.avatar}" style="width: 44px; height: 44px; font-size: 13.5px; font-weight: 600;">${m.initials}</div>
                  <div style="min-width: 0; padding-top: 1px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <div style="font-weight: 600; font-size: 15px; letter-spacing: -0.01em;">${m.name}</div>
                      ${newChip}
                    </div>
                    <div style="font-size: 11.5px; color: var(--n-500); margin-top: 3px; display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-flex; align-items: center; gap: 5px; color: var(--n-600); font-weight: 500;">
                        <i style="width: 6px; height: 6px; border-radius: 2px; background: ${roleC};"></i>${m.role}
                      </span>
                      <span style="color: var(--n-300);">·</span>
                      <span>${teamLabel}</span>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                    <span class="chip ${info.cls}" style="font-size: 10.5px; padding: 3px 10px;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${info.dot}; margin-right: 6px; animation: kw-eq-pulse 1.8s ease-in-out infinite;"></span>${info.label}
                    </span>
                    <div style="display: flex; gap: 5px;">
                      <button class="kw-eq-iconbtn" data-action="member-reset-pin" data-arg="${m.id}" title="Réinitialiser le PIN">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
                      </button>
                      <button class="kw-eq-detailbtn" data-action="member-detail" data-arg="${m.name}">Détails</button>
                    </div>
                  </div>
                </div>

                <!-- Timeline + counters -->
                <div style="margin-top: 14px; padding-left: 58px;">
                  ${renderTimeline(m)}
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <div style="font-size: 11.5px; color: var(--n-500);">
                      <span class="mono" style="color: var(--ink); font-weight: 600;">${formatDuration(durationMins)}</span>
                      <span style="margin: 0 4px;">·</span>
                      <span style="color: var(--n-500);">${progressPct}% du shift</span>
                    </div>
                    <div style="font-size: 11.5px; color: var(--n-500);">
                      reste <span class="mono" style="color: var(--ink); font-weight: 600;">${formatDuration(remainingMins)}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }

          /* COMPACT inactive row — one-line summary */
          const offSubline = (() => {
            if (m._status === 'clocked-out') return `Service terminé · sorti à <span class="mono">${formatTimeHr(m.shift[1] >= 24 ? m.shift[1] - 24 : m.shift[1])}</span>`;
            if (m._status === 'scheduled')   return `Prise de service à <span class="mono">${formatTimeHr(m.shift[0])}</span>`;
            return '';
          })();
          return `
            <div class="kw-eq-row inactive" style="display: grid; grid-template-columns: 36px 1fr auto auto; gap: 12px; align-items: center; padding: 11px 16px; border: 1px solid var(--n-200); border-left: 3px solid ${roleC}; border-radius: 12px; margin-bottom: 8px; opacity: 0.72;">
              <div class="av ${m.avatar}" style="width: 36px; height: 36px; font-size: 12px;">${m.initials}</div>
              <div style="min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 600; font-size: 13.5px; letter-spacing: -0.005em;">${m.name}</span>
                  ${newChip}
                </div>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 2px;">
                  ${m.role} · ${teamLabel} · <span class="mono">${shiftLabel}</span>
                </div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; gap: 3px;">
                <span class="chip ${info.cls}" style="font-size: 10.5px; padding: 3px 9px;">
                  <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${info.dot}; margin-right: 5px;"></span>${info.label}
                </span>
                <span style="font-size: 10.5px; color: var(--n-500);">${offSubline}</span>
              </div>
              <div style="display: flex; gap: 5px;">
                <button class="kw-eq-iconbtn" data-action="member-reset-pin" data-arg="${m.id}" title="Réinitialiser le PIN">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
                </button>
                <button class="kw-eq-detailbtn" data-action="member-detail" data-arg="${m.name}">Détails</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Permissions matrix — 2-col grid of role cards -->
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;">
          <div>
            <h4 style="margin:0; font-size:14.5px; letter-spacing:-0.01em;">Matrice de permissions</h4>
            <div style="font-size:11.5px; color:var(--n-500); margin-top:3px;">5 rôles · 6 capacités · modifiable par le propriétaire</div>
          </div>
          <button class="kb ghost" data-action="edit-perms" style="padding:6px 11px; font-size:11.5px;">Modifier les rôles</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
          ${PERMS.map(r => {
            const active = r.perms.filter(Boolean).length;
            const roleC = ROLE_COLOR[r.kind] || 'var(--atlas)';
            return `
              <div style="background:#fff; border:1px solid var(--n-200); border-radius:12px; padding:14px 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <div style="display:flex; align-items:center; gap:9px;">
                    <i style="width:9px; height:9px; border-radius:50%; background:${roleC};"></i>
                    <b style="font-size:13.5px; letter-spacing:-0.005em;">${r.role}</b>
                  </div>
                  <span class="mono" style="font-size:10.5px; color:var(--n-500); background:var(--paper-soft); padding:2px 7px; border-radius:5px;">${active} / ${CAPS.length}</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 12px;">
                  ${CAPS.map((c, i) => `
                    <div style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:${r.perms[i] ? 'var(--ink)' : 'var(--n-400)'};">
                      ${r.perms[i]
                        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${roleC}" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>`
                        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18L18 6"/></svg>`
                      }
                      ${c}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Journal PIN -->
      <div style="background:#fff; border:1px solid var(--n-200); border-radius:14px; padding:16px 18px;">
        <div style="margin-bottom:10px;">
          <h4 style="margin:0; font-size:14.5px; letter-spacing:-0.01em;">Journal PIN &amp; actions sensibles</h4>
          <div style="font-size:11.5px; color:var(--n-500); margin-top:3px;">Annulations · remboursements · ouvertures de caisse · échecs de saisie</div>
        </div>
        ${PIN_LOG.map(([t, who, ev, st]) => `
          <div style="display:grid; grid-template-columns:90px 1fr auto; gap:14px; align-items:center; padding:10px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
            <div class="mono" style="font-size:11px; color:var(--n-500);">${t}</div>
            <div><b>${who}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${ev}</div></div>
            <span class="chip ${st}">${st === 'ok' ? 'OK' : st === 'pend' ? 'Réinit.' : 'Refusé'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  render();

  /* ─── ADD MEMBER MODAL — wired end-to-end ─── */
  handlers['add-member'] = () => {
    let pinAuto = String(Math.floor(1000 + Math.random() * 9000));
    const modalHandle = modal({
      title: 'Nouveau membre',
      width: 500,
      body: `
        <style>
          [data-eq-form] input,
          [data-eq-form] select {
            width: 100%;
            padding: 11px 13px;
            border: 1px solid var(--n-300);
            border-radius: 9px;
            font-family: var(--sans);
            font-size: 14px;
            outline: none;
            background: #fff;
            color: var(--ink);
            transition: border-color 140ms, box-shadow 140ms;
            box-sizing: border-box;
          }
          [data-eq-form] input:focus,
          [data-eq-form] select:focus {
            border-color: var(--atlas);
            box-shadow: 0 0 0 3px rgba(11,110,79,0.12);
          }
          [data-eq-form] input::placeholder { color: var(--n-400); }
          [data-eq-form] .eq-section-label {
            font-family: var(--mono);
            font-size: 10px;
            letter-spacing: 0.14em;
            color: var(--n-500);
            text-transform: uppercase;
          }
          [data-eq-form] .eq-help {
            font-size: 11.5px;
            color: var(--n-500);
            margin-top: 7px;
            line-height: 1.5;
          }
        </style>
        <div data-eq-form style="padding: 2px 0;">

          <p style="margin: 0 0 22px; font-size: 13px; color: var(--n-500); line-height: 1.6;">
            Ajoute un employé à <b style="color: var(--ink); font-weight: 600;">${v.name}</b>. Il recevra son PIN par SMS et un lien vers l'app <b style="color: var(--ink); font-weight: 600;">Kiwi Caisse</b>.
          </p>

          <!-- Identité (prénom + nom in 2 cols) -->
          <div style="margin-bottom: 20px;">
            <div class="eq-section-label" style="margin-bottom: 9px;">Identité</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <input type="text" data-eq-firstname placeholder="Prénom" autocomplete="given-name" autofocus />
              <input type="text" data-eq-lastname  placeholder="Nom"    autocomplete="family-name" />
            </div>
          </div>

          <!-- Rôle -->
          <div style="margin-bottom: 20px;">
            <div class="eq-section-label" style="margin-bottom: 9px;">Rôle</div>
            <div style="position: relative;">
              <select data-eq-role style="padding-right: 38px; appearance: none; -webkit-appearance: none; cursor: pointer;">
                ${ROLE_OPTIONS.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
              </select>
              <svg style="position: absolute; right: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--n-500);" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          <!-- PIN Caisse -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px;">
              <div class="eq-section-label">PIN Caisse</div>
              <button type="button" data-action="eq-regen-pin" style="background: none; border: 0; padding: 4px 8px; margin: -4px -8px; color: var(--atlas); font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-family: var(--sans); border-radius: 5px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.64A9 9 0 0020.49 15"/></svg>
                Régénérer
              </button>
            </div>
            <input type="text" data-eq-pin value="${pinAuto}" maxlength="4" inputmode="numeric" pattern="[0-9]{4}"
                   style="font-family: var(--mono); font-size: 24px; font-weight: 600; letter-spacing: 0.5em; text-align: center; padding: 16px 0 16px 0.5em; background: var(--paper-soft); border-color: var(--n-200); color: var(--ink);" />
            <div class="eq-help">Envoyé par SMS lors de l'invitation · l'employé peut le changer après sa première connexion.</div>
          </div>

          <!-- Téléphone (optionnel) -->
          <div>
            <div class="eq-section-label" style="margin-bottom: 9px;">
              Téléphone <span style="color: var(--n-400); font-weight: 400; letter-spacing: 0.02em; text-transform: none; margin-left: 6px;">— optionnel, pour l'invitation SMS</span>
            </div>
            <div style="display: grid; grid-template-columns: 92px 1fr; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: center; padding: 11px 8px; border: 1px solid var(--n-300); border-radius: 9px; background: var(--paper-soft); font-family: var(--mono); font-size: 13px; color: var(--n-600); gap: 5px; box-sizing: border-box;">
                <span style="font-size: 14px;">🇲🇦</span><span>+212</span>
              </div>
              <input type="tel" data-eq-phone placeholder="6XX XX XX XX" autocomplete="tel-national" />
            </div>
          </div>

        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Annuler</button>
        <button class="kb atlas" data-action="eq-submit-member" style="gap: 7px; padding: 9px 16px; font-weight: 600;">
          Ajouter &amp; inviter
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      `,
    });

    // Regen PIN button
    handlers['eq-regen-pin'] = () => {
      pinAuto = String(Math.floor(1000 + Math.random() * 9000));
      const pinEl = modalHandle.el.querySelector('[data-eq-pin]');
      if (pinEl) pinEl.value = pinAuto;
    };

    // Submit
    handlers['eq-submit-member'] = () => {
      const fn = (modalHandle.el.querySelector('[data-eq-firstname]')?.value || '').trim();
      const ln = (modalHandle.el.querySelector('[data-eq-lastname]')?.value  || '').trim();
      const role = modalHandle.el.querySelector('[data-eq-role]')?.value || 'server';
      const pin = (modalHandle.el.querySelector('[data-eq-pin]')?.value || pinAuto).trim();
      const phone = (modalHandle.el.querySelector('[data-eq-phone]')?.value || '').trim();

      if (!fn || !ln) {
        toast('Prénom et nom requis', { type: 'pend', duration: 1800 });
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        toast('PIN invalide · 4 chiffres requis', { type: 'pend', duration: 1800 });
        return;
      }

      const initials = (fn[0] + ln[0]).toUpperCase();
      const roleLabel = ROLE_OPTIONS.find(r => r.value === role)?.label.split(' / ')[0] || 'Serveur';
      const id = window.__kiwiTeam.nextId++;
      const newMember = {
        id, initials,
        name: `${fn} ${ln}`,
        role: roleLabel,
        kind: role,
        avatar: ['a','b','c','d'][id % 4],
        team: nowHours() < 14 ? 'soir' : 'matin', // schedule for the next shift
        shift: nowHours() < 14 ? [17, 25] : [8, 16],
        breakAt: null,
        pin,
        isNew: true,
      };
      window.__kiwiTeam.members.push(newMember);

      modalHandle.close();
      render();
      toast(`${fn} ${ln} ajouté·e à l'équipe`, {
        type: 'success',
        duration: 2400,
        desc: phone
          ? `SMS d'invitation envoyé au ${phone} · PIN ${pin} · prochaine prise de service ${newMember.shift[0]}h00.`
          : `PIN ${pin} · prochaine prise de service ${newMember.shift[0]}h00.`,
      });
    };
  };

  /* ─── Quick-action handlers (reset PIN, broadcast, AI alert) ─── */
  handlers['member-reset-pin'] = (_el, id) => {
    const m = window.__kiwiTeam.members.find(x => String(x.id) === String(id));
    if (!m) return;
    const newPin = String(Math.floor(1000 + Math.random() * 9000));
    m.pin = newPin;
    toast(`PIN réinitialisé · ${m.name}`, {
      type: 'success',
      duration: 2200,
      desc: `Nouveau PIN ${newPin} envoyé par SMS · ancien PIN désactivé immédiatement.`,
    });
  };

  handlers['broadcast-team'] = () => {
    const composer = modal({
      title: 'Message à l\'équipe',
      width: 440,
      body: `
        <div style="font-size:12.5px; color:var(--n-500); margin-bottom:12px; line-height:1.5;">
          Envoie une notification push à tous les appareils Kiwi Caisse de l'équipe.
        </div>
        <textarea data-eq-broadcast placeholder="Ex. Réservation 20h table 12 · 8 couverts · préparez la salle privée." rows="4" style="width:100%; padding:11px 13px; border:1px solid var(--n-300); border-radius:9px; font-family:var(--sans); font-size:13px; resize:vertical; outline:none;" autofocus></textarea>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Annuler</button>
        <button class="kb atlas" data-action="eq-send-broadcast">Envoyer à 8 appareils</button>
      `,
    });
    handlers['eq-send-broadcast'] = () => {
      const msg = (composer.el.querySelector('[data-eq-broadcast]')?.value || '').trim();
      if (!msg) { toast('Message vide', { type: 'pend' }); return; }
      composer.close();
      toast('Message envoyé à 8 appareils Kiwi Caisse', {
        type: 'success',
        duration: 2200,
        desc: msg.length > 70 ? msg.slice(0, 70) + '…' : msg,
      });
    };
  };

  handlers['ai-pointage'] = (_el, kind) => {
    const labels = {
      late:     ['Point programmé · Hamid Jelloul', 'Convocation 15h jeudi · note ajoutée au dossier.'],
      overtime: ['Heures validées · Sofia Belkadi', '3h27 ajoutées au prochain bulletin paie.'],
      absent:   ['Youssef contacté', 'SMS envoyé · accusé de réception en attente.'],
    };
    const [t, d] = labels[kind] || ['Action effectuée', 'Recommandation Kiwi AI appliquée.'];
    toast(t, { type: 'success', duration: 2200, desc: d });
  };

  if (!handlers['member-detail']) handlers['member-detail'] = (el) => toast(`Profil de ${el?.dataset?.arg || 'l\'employé'}`, { type: 'info', desc: 'Pointage · revenus · pourboires · historique disciplinaire.' });
  if (!handlers['edit-perms'])    handlers['edit-perms']    = () => toast('Éditeur de permissions', { type: 'info', desc: 'Cochez/décochez les capacités par rôle · changement appliqué immédiatement.' });
};

/* ═══════════════════ PAIE & PLANNING ═══════════════════ */
handlers['nav-payroll'] = () => {
  const v = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas' };
  const staff = [
    { i: 'FK', k: 'a', n: 'Fatima',  role: 'Serveuse senior', shifts: ['m','m','off','m','m','m','off'] },
    { i: 'HJ', k: 'b', n: 'Hamid',   role: 'Serveur terrasse', shifts: ['e','e','off','e','e','e','e'] },
    { i: 'SB', k: 'c', n: 'Sofia',   role: 'Barista',          shifts: ['d','d','d','off','d','d','d'] },
    { i: 'YA', k: 'd', n: 'Youssef', role: 'Serveur soir',     shifts: ['off','e','e','e','e','dbl','off'] },
    { i: 'MM', k: 'a', n: 'Mehdi',   role: 'Cuisine',          shifts: ['m','m','m','m','m','m','off'] },
  ];
  const slot = { m: ['8–17','JOUR','morning'], e: ['12–22','SOIR','evening'], d: ['9–15','COMPTOIR','day'], dbl: ['11–23','DOUBLE','evening'], off: ['off','','off'] };
  const days = ['Lun 21','Mar 22','Mer 23','Jeu 24','Ven 25','Sam 26','Dim 27'];
  const leaves = [
    ['Sofia Belkadi', '2 jours · 5–6 mai', 'Mariage cousine', 'pend'],
    ['Mehdi Mansouri', '1 jour · 1ᵉʳ mai', 'Fête du travail (férié)', 'ok'],
    ['Youssef Amrani', '3 jours · 15–17 mai', 'Voyage familial', 'pend'],
  ];
  drawer({
    title: 'Paie &amp; planning',
    subtitle: 'Pointage POS · pourboires partagés · ratio main d\'œuvre',
    width: 1040,
    body: `
      <div class="p-hero">
        <div class="l">SAMEDI 25 AVRIL · MAIN D'ŒUVRE</div>
        <div class="big">4 / 5 <span style="font-size:18px; opacity:0.7;">employés pointés</span></div>
        <div class="sub">Coût aujourd'hui <b style="color:var(--mint);">1 240 MAD</b> · ratio 16,8 % des ventes — sain</div>
      </div>

      <div class="sh-section">
        <div class="sh-section-head">
          <div><h4>Planning hebdomadaire · 21 → 27 avril</h4><div class="sub">Glissez une cellule pour modifier · WhatsApp envoyé à l'équipe</div></div>
          <button class="kb ghost" data-action="edit-shifts" style="padding:8px 12px; font-size:12.5px;">Modifier</button>
        </div>
        <div class="sh-week">
          <div></div>
          ${days.map((d, i) => `<div class="head${i === 5 ? ' today' : ''}">${d}</div>`).join('')}
          ${staff.map(s => `
            <div class="name" style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:${s.k === 'a' ? 'var(--atlas)' : s.k === 'b' ? 'var(--riad)' : s.k === 'c' ? '#D99A2B' : 'var(--atlas-700)'}; color:var(--paper); font-size:9.5px; font-weight:600; font-family:var(--mono);">${s.i}</span>
              <div style="line-height:1.2;"><div style="font-size:12px; font-weight:500;">${s.n}</div><div style="font-size:9.5px; color:var(--n-500); font-family:var(--mono);">${s.role}</div></div>
            </div>
            ${s.shifts.map(sh => {
              const [hours, label, cls] = slot[sh];
              return `<div class="cell ${cls}"><div class="h">${hours}</div>${label ? `<div class="d">${label}</div>` : ''}</div>`;
            }).join('')}
          `).join('')}
        </div>
      </div>

      <div class="sh-grid-2">
        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Pourboires partagés</h4><div class="sub">Pool 1 867 MAD aujourd'hui · à distribuer en fin de service</div></div>
          </div>
          <div class="sh-tip-cfg">
            <div><b>Pool ${v.name}</b><div class="m">60 % salle · 25 % bar · 15 % cuisine · pondéré aux heures travaillées</div></div>
            <button class="kb ghost" data-action="edit-tip-rule">Modifier</button>
          </div>
          ${[
            ['a', 'FK', 'Fatima', 'salle · 6h25', 35, 654],
            ['b', 'HJ', 'Hamid',  'salle · 5h38', 30, 560],
            ['c', 'SB', 'Sofia',  'bar · 5h08',   25, 467],
            ['d', 'MM', 'Mehdi',  'cuisine · 5h12', 10, 186],
          ].map(([k, i, n, r, pct, amt]) => `
            <div class="sh-tip-pool">
              <div class="av ${k}">${i}</div>
              <div><b>${n}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${r}</div></div>
              <div class="pct">${pct} %</div>
              <div class="amt">+${amt} MAD</div>
            </div>
          `).join('')}
          <button class="kb atlas" style="width:100%; justify-content:center; margin-top:12px;" data-action="distribute-tips">Distribuer · WhatsApp à l'équipe →</button>
        </div>

        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Heures vs cible · 7 jours</h4><div class="sub">Cible 30 % · benchmark cafés Casa 28 %</div></div>
            <span class="chip ok">SAIN · 16,8 %</span>
          </div>
          <div class="sh-lvs">
            <div class="sh-lvs-head">
              <div>
                <div class="sh-lvs-num">16,8<span class="u">%</span></div>
                <div style="font-size:11px; color:var(--n-500); margin-top:4px; font-family:var(--mono); letter-spacing:0.04em;">AUJ. · 1 240 / 7 380 MAD</div>
              </div>
            </div>
            <svg viewBox="0 0 280 120" style="width:100%; height:120px; margin-top:6px;">
              <line x1="0" y1="42" x2="280" y2="42" stroke="#A8A49A" stroke-dasharray="3 3" stroke-width="1"/>
              <text x="278" y="38" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="#6F6C65">cible 30 %</text>
              ${[['Lun',22],['Mar',19],['Mer',24],['Jeu',18],['Ven',17],['Sam',16.8],['Dim',0]].map(([day, pct], i) => {
                const x = 8 + i * 38; const h = pct === 0 ? 0 : (pct / 35) * 88; const y = 102 - h;
                const isToday = i === 5; const isFuture = pct === 0;
                const fill = isFuture ? '#E8E6E0' : isToday ? '#0B6E4F' : '#7DF2B0';
                return `<g><rect x="${x}" y="${y}" width="22" height="${h}" rx="3" fill="${fill}"/><text x="${x + 11}" y="116" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="${isToday ? '#0B6E4F' : '#6F6C65'}" font-weight="${isToday ? '600' : '400'}">${day}</text>${pct > 0 ? `<text x="${x + 11}" y="${y - 4}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#0A0F0D">${pct}%</text>` : ''}</g>`;
              }).join('')}
            </svg>
            <div class="sh-lvs-foot">
              <label><i style="background:var(--atlas);"></i>Aujourd'hui</label>
              <label><i style="background:var(--mint);"></i>Précédents</label>
              <label><i style="background:#A8A49A;"></i>Cible</label>
            </div>
          </div>
        </div>
      </div>

      <div class="sh-grid-2">
        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Aperçu bulletin · Fatima Khalki</h4><div class="sub">Avril 2026 · 162 h · serveuse senior · pré-rempli DGI</div></div>
            <button class="kb ghost" data-action="payslip-pdf" style="padding:6px 10px; font-size:11px;">PDF</button>
          </div>
          <div style="background:#fff; border:1px solid var(--n-200); border-radius:12px; padding:14px;">
            ${[
              ['Salaire brut', '5 800,00', 'var(--ink)'],
              ['CNSS salarié (4,48 %)', '−259,84', 'var(--n-600)'],
              ['AMO salarié (2,26 %)', '−131,08', 'var(--n-600)'],
              ['IGR (barème 2026)', '−412,30', 'var(--n-600)'],
              ['Avantages en nature', '+180,00', 'var(--atlas)'],
            ].map(([l, v, c]) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid var(--n-200); font-size:12.5px;">
                <span style="color:var(--n-600);">${l}</span>
                <span class="mono" style="font-weight:500; color:${c};">${v}</span>
              </div>
            `).join('')}
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:11px; margin-top:6px; border-top:2px solid var(--ink);">
              <b style="font-size:13px;">Net à payer</b>
              <b class="mono" style="font-size:18px; font-weight:600; color:var(--atlas); letter-spacing:-0.015em;">5 176,78 MAD</b>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
            <button class="kb ghost" data-action="generate-payslips" style="justify-content:center;">Générer 5 bulletins</button>
            <button class="kb atlas" data-action="export-dgi" style="justify-content:center;">Export DGI · CSV</button>
          </div>
        </div>

        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Demandes de congé en attente</h4><div class="sub">3 demandes · à valider avant vendredi</div></div>
            <button class="kb ghost" data-action="all-leaves" style="padding:6px 10px; font-size:11px;">Toutes</button>
          </div>
          ${leaves.map(([who, when, reason, st]) => `
            <div style="padding:11px 0; border-top:1px solid var(--n-200); font-size:12.5px;">
              <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1;"><b>${who}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${when} · ${reason}</div></div>
                <span class="chip ${st}">${st === 'ok' ? 'Approuvé' : 'À valider'}</span>
              </div>
              ${st === 'pend' ? `
                <div style="display:flex; gap:6px; margin-top:6px;">
                  <button class="kb ghost" data-action="leave-deny" style="padding:5px 10px; font-size:11px; flex:1; justify-content:center;">Refuser</button>
                  <button class="kb atlas" data-action="leave-approve" style="padding:5px 10px; font-size:11px; flex:1; justify-content:center;">Approuver</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Fermer</button>
      <button class="kb primary" data-action="export-payroll">Exporter la paie du mois</button>
    `,
  });
};

/* ═══════════════════ RÉSERVATIONS & RDV ═══════════════════ */
handlers['nav-reservations'] = () => {
  const v = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas' };
  const days = [
    { n: 'Mar 21', covers: 32, blocks: [['11:30','13:30',12,'lunch'],['19:00','22:00',20,'dinner']] },
    { n: 'Mer 22', covers: 28, blocks: [['12:00','14:00',10,'lunch'],['19:30','22:00',18,'dinner']] },
    { n: 'Jeu 23', covers: 41, blocks: [['11:30','14:00',16,'lunch'],['19:00','22:30',25,'dinner']] },
    { n: 'Ven 24', covers: 52, blocks: [['12:00','14:30',18,'lunch'],['19:30','23:00',34,'dinner']] },
    { n: 'Sam 25', covers: 38, blocks: [['12:00','14:30',14,'lunch'],['19:00','22:30',24,'dinner']], today: true },
    { n: 'Dim 26', covers: 22, blocks: [['12:00','15:00',22,'lunch']] },
    { n: 'Lun 27', covers: 0,  blocks: [] },
  ];
  const blockColor = (cap, type) => {
    if (cap >= 30) return 'var(--danger)';
    if (cap >= 18) return 'var(--warning)';
    return type === 'lunch' ? 'var(--atlas)' : 'var(--riad)';
  };
  const bookings = [
    ['12:30', 'Famille Bensaïd',          4, 'Terrasse · sans porc',                'low',  'ok',   '12 visites'],
    ['13:15', 'Tarik & Yasmine',          2, 'Salle · table tranquille',            'low',  'ok',   'Régulier'],
    ['13:45', 'Karim Benhima',            3, 'Anniversaire · gâteau prévu',         'low',  'ok',   'Acompte 200'],
    ['19:00', 'Société Atlas Pharma',     12,'Groupe · menu fixe',                  'med',  'pend', 'Acompte attendu'],
    ['19:00', 'Famille Lahcen',           5, 'Terrasse · 2 enfants · chaise haute', 'high', 'ok',   'Pacing alert'],
    ['19:15', 'Sophie & Yann',            2, 'Touristes · table fenêtre',           'med',  'ok',   'Anniversaire'],
    ['20:00', 'Hassan & invités',         6, 'Salle · vin frais demandé',           'low',  'ok',   '—'],
    ['21:00', 'Reservation +212 6 41 ··', 4, 'Sans préférence',                     'high', 'pend', '2 no-shows'],
  ];
  const noShowChip = { low: ['ok', 'Faible'], med: ['pend', 'Modéré'], high: ['ref', 'Élevé'] };
  drawer({
    title: 'Réservations &amp; RDV',
    subtitle: `${v.name} · 38 couverts samedi · 8 réservations confirmées · 3 en liste d'attente`,
    width: 920,
    body: `
      <div class="p-hero">
        <div class="l">SAMEDI 25 AVRIL · CAFÉ ATLAS</div>
        <div class="big">38 <span style="font-size:18px; opacity:0.7;">couverts prévus</span></div>
        <div class="sub">8 réservations confirmées · 2 acomptes attendus · 1 alerte de pacing à 19:00</div>
      </div>

      <div class="sh-section">
        <div class="sh-section-head">
          <div><h4>Calendrier 7 jours · couverts par créneau</h4><div class="sub">Hauteur = nombre de couverts · couleur = densité</div></div>
          <div class="resv-legend">
            <span><i style="background:var(--atlas);"></i>Calme</span>
            <span><i style="background:var(--warning);"></i>Soutenu</span>
            <span><i style="background:var(--danger);"></i>Saturé</span>
          </div>
        </div>
        <div class="resv-cal">
          ${days.map(d => `
            <div class="rcal-row">
              <div class="rcal-name" style="${d.today ? 'color:var(--atlas); font-weight:600;' : ''}">${d.n}${d.today ? ' · auj.' : ''}<div style="font-size:10.5px; color:var(--n-500); font-family:var(--mono); margin-top:2px;">${d.covers} couv.</div></div>
              <div class="rcal-track">
                ${d.blocks.map(([from, to, cap, type]) => {
                  const fH = parseInt(from); const tH = parseInt(to);
                  const left = ((fH - 11) / 12) * 100;
                  const width = ((tH - fH) / 12) * 100;
                  return `<div class="rcal-block" style="left:${left}%; width:${width}%; background:${blockColor(cap, type)};">${from}–${to} · ${cap}</div>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="rcal-axis"><span>11h</span><span>13h</span><span>15h</span><span>17h</span><span>19h</span><span>21h</span><span>23h</span></div>
      </div>

      <div class="sh-section">
        <div class="sh-section-head">
          <div><h4>Réservations samedi 25 · 8 entrées</h4><div class="sub">Trié par heure · cliquez pour ouvrir le détail client</div></div>
          <button class="kb primary" data-action="add-reservation" style="padding:8px 12px; font-size:12.5px;">+ Nouvelle</button>
        </div>
        <table class="p-table" style="font-size:12.5px;">
          <thead><tr><th>HEURE</th><th>CLIENT</th><th class="right">PARTY</th><th>NOTE</th><th>NO-SHOW</th><th>STATUT</th></tr></thead>
          <tbody>
            ${bookings.map(([t, n, party, note, ns, st, tag]) => {
              const [chipKind, chipLabel] = noShowChip[ns];
              return `
                <tr data-action="resv-detail" data-arg="${n}">
                  <td class="mono"><b>${t}</b></td>
                  <td><b>${n}</b><div style="font-size:11px; color:var(--n-500); margin-top:2px;">${tag}</div></td>
                  <td class="mono right"><b>${party}</b> couv.</td>
                  <td style="color:var(--n-500); font-size:12px;">${note}</td>
                  <td><span class="chip ${chipKind}" style="font-size:10.5px;">${chipLabel}</span></td>
                  <td><span class="chip ${st}">${st === 'ok' ? 'Confirmé' : 'Acompte'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="sh-grid-2">
        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Liste d'attente</h4><div class="sub">Auto-promotion dès qu'une table se libère</div></div>
            <label style="display:inline-flex; align-items:center; gap:8px; font-size:11.5px; color:var(--n-600);">
              <span style="position:relative; display:inline-block; width:32px; height:18px; background:var(--atlas); border-radius:999px;">
                <span style="position:absolute; top:2px; left:16px; width:14px; height:14px; background:var(--paper); border-radius:50%; transition:all 200ms;"></span>
              </span>
              Auto-promote ON
            </label>
          </div>
          <div class="resv-wait">
            <div><b>+212 6 22 11 09 88</b><div class="m">2 pers · prêt dans ~12 min · place T7</div></div>
            <button class="kb atlas" data-action="resv-sms">SMS prêt →</button>
          </div>
          <div class="resv-wait">
            <div><b>Mehdi R.</b><div class="m">4 pers · prêt dans ~25 min</div></div>
            <button class="kb ghost" data-action="resv-sms">SMS</button>
          </div>
          <div class="resv-wait">
            <div><b>+212 6 41 02 76 12</b><div class="m">2 pers · prêt dans ~40 min</div></div>
            <button class="kb ghost" data-action="resv-sms">SMS</button>
          </div>
          <div class="rc-foot" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--n-200); font-size:11.5px; color:var(--n-500); line-height:1.45;">
            SMS automatique « votre table est prête » dès qu'une table de la bonne taille se libère.
          </div>
        </div>

        <div class="sh-section" style="margin-bottom:12px;">
          <div class="sh-section-head" style="margin-bottom:10px;">
            <div><h4>Canaux de réservation · 30 jours</h4><div class="sub">142 réservations · 18 % no-show prévenus par acompte</div></div>
          </div>
          <div style="display:flex; gap:14px; align-items:center; margin-bottom:14px;">
            <svg viewBox="0 0 80 80" style="width:90px; height:90px; flex-shrink:0;">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--n-200)" stroke-width="11" pathLength="100"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--atlas)" stroke-width="11" pathLength="100" stroke-linecap="butt" stroke-dasharray="39.29 60.71" stroke-dashoffset="25"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#7DF2B0"      stroke-width="11" pathLength="100" stroke-linecap="butt" stroke-dasharray="27.35 72.65" stroke-dashoffset="-16.79"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#D99A2B"      stroke-width="11" pathLength="100" stroke-linecap="butt" stroke-dasharray="17.40 82.60" stroke-dashoffset="-46.64"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--riad)"  stroke-width="11" pathLength="100" stroke-linecap="butt" stroke-dasharray="5.96 94.04" stroke-dashoffset="-66.54"/>
            </svg>
            <div style="flex:1; display:flex; flex-direction:column; gap:6px; font-size:12px;">
              ${[
                ['var(--atlas)', 'Google Réserver',  60, 42],
                ['#7DF2B0',      'WhatsApp direct',  43, 30],
                ['#D99A2B',      'Walk-in',          28, 20],
                ['var(--riad)',  'Site direct',      11, 8],
              ].map(([c, l, n, pct]) => `
                <div style="display:grid; grid-template-columns:10px 1fr auto auto; gap:8px; align-items:center;">
                  <i style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${c};"></i>
                  <span>${l}</span>
                  <span class="mono" style="font-size:11px; color:var(--n-500);">${n}</span>
                  <b class="mono" style="font-size:11px;">${pct} %</b>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="rc-foot" style="padding-top:10px; border-top:1px solid var(--n-200); font-size:11.5px; color:var(--n-500); line-height:1.45;">
            Google Réserver est synchronisé en temps réel · pas de double-booking possible.
          </div>
        </div>
      </div>

      <div style="background:linear-gradient(135deg, #8A6210, #D99A2B); color:var(--paper); border-radius:14px; padding:16px 18px; display:flex; gap:14px; align-items:flex-start;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:13.5px; margin-bottom:3px;">Alerte pacing · 19:00–19:15</div>
          <div style="font-size:12.5px; line-height:1.45; opacity:0.95;">9 couverts arrivent dans la même fenêtre de 15 min. Cuisine sous tension prévue. <b>Buffer de 15 min recommandé</b> sur la prochaine réservation, ou décaler à 19:30.</div>
        </div>
        <button class="kb" data-action="resv-buffer" style="background:rgba(255,255,255,0.2); color:var(--paper); padding:7px 12px; font-size:12px;">Appliquer buffer</button>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Fermer</button>
      <button class="kb primary" data-action="add-reservation">+ Nouvelle réservation</button>
    `,
  });
};

/* Stub handlers used inside the new drawers */
handlers['upload-kyc']      = () => {
    const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
    toast(T.uploadKycToast, { type: 'info', desc: T.uploadKycToastDesc });
};
handlers['kyc-replace']     = () => {
    const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
    toast(T.reuploadKycToast, { type: 'info', desc: T.reuploadKycToastDesc });
};
handlers['cal-export']      = () => {
    const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
    toast(T.calendarExportToast, { type: 'success', desc: T.calendarExportToastDesc });
};
handlers['audit-export']    = () => {
    const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
    toast(T.auditExportToast, { type: 'success', desc: T.auditExportToastDesc });
};
handlers['rotate-secret']   = () => {
    const T = CONFORMITE_STR[trLang()] || CONFORMITE_STR.fr;
    toast(T.rotateSecretToast, { type: 'info', desc: T.rotateSecretToastDesc });
};
// add-member / member-detail / edit-perms are now registered inside
// nav-equipe's handler so they can close over the live team state.
handlers['payslip-pdf']     = () => toast('Bulletin PDF généré · Fatima Khalki', { type: 'success', desc: 'Bulletin avril 2026 envoyé par WhatsApp.' });
handlers['generate-payslips'] = () => toast('5 bulletins générés', { type: 'success', desc: 'PDF + CSV DGI prêts · envoi WhatsApp en file.' });
handlers['export-dgi']      = () => toast('Export DGI · CSV', { type: 'success', desc: 'Fichier conforme au format DGI 2026 · prêt pour télédéclaration.' });
handlers['all-leaves']      = () => toast('Toutes les demandes de congé', { type: 'info', desc: 'Filtrez par employé, statut ou période.' });
handlers['leave-approve']   = () => toast('Demande approuvée', { type: 'success', desc: 'Notification WhatsApp envoyée · planning mis à jour.' });
handlers['leave-deny']      = () => toast('Demande refusée', { type: 'info', desc: 'Notification WhatsApp envoyée · raison à compléter.' });
handlers['resv-detail']     = (el) => toast(`Réservation · ${el?.dataset?.arg || ''}`, { type: 'info', desc: 'Profil client unifié · historique · préférences · score no-show.' });
handlers['resv-buffer']     = () => toast('Buffer 15 min appliqué', { type: 'success', desc: 'Prochaine réservation décalée à 19:30 · client notifié WhatsApp.' });
})();

/* ═══ Section 2 rest A · tables / menu ═══ */
(function() {
  "use strict";
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const fullpage = Kiwi.fullpage;
  const modal = Kiwi.modal;
  const toast = Kiwi.toast;
  const menu = Kiwi.menu;
  const confetti = Kiwi.confetti;
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Section 2a — restaurant vertical handlers
 * Replaces (or supplements) the existing `nav-tables` and `nav-menu`
 * handlers in /Users/badrosonair/Documents/kiwi/assets/pages.js.
 *
 * APPLY:
 *   1. Append the contents of /tmp/kiwi-s2-rest-css.css to the CSS template
 *      literal at the top of pages.js (just before `</style>`).
 *   2. Replace the bodies of `handlers['nav-tables']` and `handlers['nav-menu']`
 *      in pages.js with the bodies below. Auxiliary handlers
 *      (`tables-merge`, `tables-split`, `tables-move`, `tables-new`,
 *      `menu-add`, `menu-86`, `menu-edit`, `menu-mass`, `menu-schedule`)
 *      can sit alongside in the same `handlers = { ... }` block.
 *
 * DEPENDENCIES (already on window.Kiwi):
 *   toast, modal, drawer, handlers, confetti
 * ─────────────────────────────────────────────────────────────────────────── */

/* ─── helper: wire `data-dismiss` buttons on a modal/drawer to close ─── */
function wireDismiss(m) {
  if (!m || !m.el) return;
  m.el.addEventListener('click', (e) => {
    if (e.target.closest('[data-dismiss]')) m.close();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 ·  TABLES & ADDITIONS  ·  width 1080
 * ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
 * 1 ·  TABLES & PLAN DE SALLE  ·  owner-focused · width 1120
 *   ─ Cashier/server surfaces (encaisser, split bill, fusion d'additions)
 *     live on the Android app for waiters & caisse — NOT on the owner's
 *     dashboard. This drawer is the operator's strategic command of the
 *     floor: layout editing, server-section assignment, performance heat,
 *     incoming reservations, AI capacity insights.
 * ═══════════════════════════════════════════════════════════════════════════ */
handlers['nav-tables'] = () => {
  const TABLES = [
    { id: 'T1',  zone: 'Salle',    state: 'occupied',    seats: 4, mins: 18, rev: 1840, turns: 3, server: 'FK', section: 'A' },
    { id: 'T2',  zone: 'Salle',    state: 'paid',        seats: 2, mins: 0,  rev: 980,  turns: 4, server: 'HJ', section: 'A' },
    { id: 'T3',  zone: 'Salle',    state: 'libre',       seats: 4, rev: 320,  turns: 1, server: 'HJ', section: 'A', flag: 'dead' },
    { id: 'T4',  zone: 'Salle',    state: 'pay-pending', seats: 4, mins: 32, rev: 1620, turns: 2, server: 'FK', section: 'A' },
    { id: 'T5',  zone: 'Salle',    state: 'occupied',    seats: 2, mins: 6,  rev: 740,  turns: 3, server: 'SB', section: 'B' },
    { id: 'T6',  zone: 'Salle',    state: 'cleaning',    seats: 4, mins: 0,  rev: 1280, turns: 3, server: 'YA', section: 'B' },
    { id: 'T7',  zone: 'Salle',    state: 'libre',       seats: 6, rev: 2640, turns: 3, server: 'MM', section: 'B', flag: 'top' },
    { id: 'T8',  zone: 'Salle',    state: 'occupied',    seats: 2, mins: 12, rev: 680,  turns: 4, server: 'HJ', section: 'A' },
    { id: 'T9',  zone: 'Salle',    state: 'occupied',    seats: 4, mins: 24, rev: 1980, turns: 2, server: 'MM', section: 'B' },
    { id: 'T10', zone: 'Salle',    state: 'libre',       seats: 2, rev: 380,  turns: 1, server: 'SB', section: 'B', flag: 'dead' },
    { id: 'T11', zone: 'Salle',    state: 'occupied',    seats: 6, mins: 41, rev: 2410, turns: 2, server: 'FK', section: 'A' },
    { id: 'T12', zone: 'Salle',    state: 'pay-pending', seats: 4, mins: 28, rev: 1540, turns: 2, server: 'SB', section: 'B' },
    { id: 'TR1', zone: 'Terrasse', state: 'occupied',    seats: 2, mins: 9,  rev: 920,  turns: 4, server: 'YA', section: 'C' },
    { id: 'TR2', zone: 'Terrasse', state: 'libre',       seats: 4, rev: 1480, turns: 2, server: 'YA', section: 'C' },
    { id: 'TR3', zone: 'Terrasse', state: 'occupied',    seats: 4, mins: 36, rev: 2120, turns: 3, server: 'MM', section: 'C' },
    { id: 'TR4', zone: 'Terrasse', state: 'libre',       seats: 2, rev: 640,  turns: 2, server: 'YA', section: 'C' },
  ];
  const STAFF = [
    { i: 'FK', cls: 'a', name: 'Fatima Khalki',  section: 'A', tables: ['T1','T4','T11'], rev: 5870 },
    { i: 'HJ', cls: 'b', name: 'Hamid Jelloul',  section: 'A', tables: ['T2','T3','T8'],  rev: 2340 },
    { i: 'SB', cls: 'c', name: 'Sofia Belkadi',  section: 'B', tables: ['T5','T10','T12'], rev: 2660 },
    { i: 'YA', cls: 'd', name: 'Youssef Amrani', section: 'C', tables: ['T6','TR1','TR2','TR4'], rev: 3040 },
    { i: 'MM', cls: 'a', name: 'Mehdi Mansouri', section: 'B', tables: ['T7','T9','TR3'], rev: 6740 },
  ];
  const SECTIONS = [
    { k: 'A', name: 'Salle A',  color: 'var(--atlas)',     server: 'FK', co: 'Fatima' },
    { k: 'B', name: 'Salle B',  color: 'var(--riad)',      server: 'MM', co: 'Mehdi' },
    { k: 'C', name: 'Terrasse', color: 'var(--warning)',   server: 'YA', co: 'Youssef' },
  ];
  const RESAS = [
    { time: '19:30', name: 'Famille El Idrissi', party: 4, table: 'T11', tag: 'habitué',     note: 'Aime T11 — proche fenêtre' },
    { time: '19:45', name: 'M. & Mme Benani',    party: 2, table: 'TR1', tag: 'anniversaire', note: '15 ans de mariage · dessert offert' },
    { time: '20:00', name: 'Groupe Bouazza',     party: 6, table: 'T7',  tag: 'VIP',         note: '3e visite cette semaine · vin rouge ouvert' },
    { time: '20:15', name: 'Walking-in prévu',   party: 2, table: '—',   tag: 'walk-in',     note: 'Sur projection · garder T5 ou T8 libre' },
    { time: '20:30', name: 'Hassan Chakir',      party: 4, table: 'T1',  tag: '1re visite',  note: 'Pas de coriandre' },
    { time: '21:00', name: 'Table Senhaji',      party: 4, table: 'T9',  tag: 'régulier',    note: 'Préfère terrasse si dispo' },
  ];
  const AI_INSIGHTS = [
    { tone: 'opp',  ic: '↗', title: 'T7 est votre meilleur 6-couverts',     desc: '6 740 MAD générés ce mois · 3,2× la moyenne. Toujours bookable, ne jamais joindre.', action: { label: 'Verrouiller T7', toast: 'T7 marquée comme table prioritaire · ne sera plus jointe par défaut.' } },
    { tone: 'warn', ic: '⊘', title: 'T3 + T10 sont des "sièges morts"',     desc: 'Rotation 1,2/jour · revenu/couvert 30 % en dessous moyenne. Fusionner en un 4-couverts récupère 1,8 m².', action: { label: 'Simuler la fusion', toast: 'Simulation : +12 % capacité utile · −1,8 m² · gain estimé 480 MAD/jour.' } },
    { tone: 'idea', ic: 'AI', title: 'Service du soir saturé à 20:00',     desc: 'Pic prévu 20:00–21:00 · 92 % d\'occupation. Décaler 2 résas vers 19:15 fluidifierait la cuisine.', action: { label: 'Appeler les clients', toast: 'Brief envoyé à l\'équipe service · 2 clients à recontacter.' } },
  ];
  const stateLabel = (s) => ({ occupied: 'occupée', libre: 'libre', 'pay-pending': 'addition', cleaning: 'nettoyage', paid: 'payée' })[s] || s;

  const occupied = TABLES.filter(t => t.state === 'occupied' || t.state === 'pay-pending').length;
  const free = TABLES.filter(t => t.state === 'libre').length;
  const cleaning = TABLES.filter(t => t.state === 'cleaning').length;
  const covers = TABLES.filter(t => t.state === 'occupied' || t.state === 'pay-pending').reduce((s, t) => s + (t.seats || 0), 0);
  const topTable = [...TABLES].sort((a,b) => (b.rev||0) - (a.rev||0))[0];
  const deadSeats = TABLES.filter(t => t.flag === 'dead');
  const revPerCover = Math.round(TABLES.reduce((s,t) => s + (t.rev||0), 0) / TABLES.reduce((s,t) => s + (t.seats||0), 0));

  /* ─── Floor: each table rendered with state + section accent ─── */
  const sectionColor = (sec) => SECTIONS.find(s => s.k === sec)?.color || 'var(--n-300)';
  const tableCard = (t, viewMode) => {
    const sec = sectionColor(t.section);
    const heat = viewMode === 'perf' ? Math.min(1, (t.rev || 0) / 2800) : 0;
    const heatBg = viewMode === 'perf'
      ? `linear-gradient(180deg, rgba(11,110,79,${0.06 + heat*0.32}) 0%, rgba(11,110,79,${0.02 + heat*0.18}) 100%)`
      : '';
    const resa = RESAS.find(r => r.table === t.id);
    const showResa = viewMode === 'resa' && resa;
    const flagBadge = t.flag === 'top' ? `<span class="tbl-flag top" title="Meilleure table">★</span>` : t.flag === 'dead' ? `<span class="tbl-flag dead" title="Siège mort">⊘</span>` : '';
    return `
      <div class="tbl owner-tbl ${t.state === 'libre' ? '' : t.state}" data-tbl="${t.id}" style="${viewMode === 'sect' ? `border-left:4px solid ${sec};` : ''}${heatBg ? `background:${heatBg};` : ''}">
        ${flagBadge}
        <div class="tbl-n">${t.id}</div>
        ${viewMode === 'perf' ? `
          <div class="tbl-state mono" style="color:var(--atlas); font-weight:600;">${(t.rev||0).toLocaleString('fr-FR')} MAD</div>
          <div class="tbl-state" style="font-size:10.5px; color:var(--n-500);">${t.turns} rotations · ${t.seats} couv.</div>
        ` : viewMode === 'sect' ? `
          <div class="tbl-state">${t.seats} couv. · section ${t.section}</div>
          <div class="tbl-state mono" style="font-size:10.5px; color:${sec}; font-weight:600;">${STAFF.find(s => s.i === t.server)?.name.split(' ')[0] || '—'}</div>
        ` : showResa ? `
          <div class="tbl-state" style="color:var(--atlas); font-weight:600;">${resa.time} · ${resa.name.split(' ')[0]}</div>
          <div class="tbl-state" style="font-size:10.5px; color:var(--n-500);">${resa.party} couv. · ${resa.tag}</div>
        ` : `
          <div class="tbl-state">${t.state === 'libre' ? `${t.seats} couv. · libre` : t.state === 'cleaning' ? 'nettoyage' : t.state === 'paid' ? 'payée' : `${t.seats} couv. · ${t.mins} min`}</div>
          ${t.state !== 'libre' && t.state !== 'cleaning' ? `<div class="tbl-state mono" style="font-size:10.5px; color:var(--n-500);">serveur ${t.server}</div>` : ''}
        `}
      </div>
    `;
  };

  /* ─── Top-of-floor view tabs ─── */
  const renderFloor = (view) => `
    <div class="floor-meta">
      <div class="floor-tabs" data-floor-tabs>
        <button class="ft ${view==='live'?'active':''}" data-fview="live">État live</button>
        <button class="ft ${view==='perf'?'active':''}" data-fview="perf">Performance</button>
        <button class="ft ${view==='sect'?'active':''}" data-fview="sect">Sections</button>
        <button class="ft ${view==='resa'?'active':''}" data-fview="resa">Réservations</button>
      </div>
      <div class="floor-legend-box">
        ${view==='live' ? `
          <span class="floor-legend">
            <span><i style="background:var(--atlas);"></i>occupée</span>
            <span><i style="background:var(--warning);"></i>addition</span>
            <span><i style="background:var(--info);"></i>nettoyage</span>
            <span><i style="background:var(--success);"></i>payée</span>
            <span><i style="background:var(--n-300);"></i>libre</span>
          </span>
        ` : view==='perf' ? `<span style="font-size:11px; color:var(--n-500);">Plus vert = plus de revenu généré · cumul 30 j</span>`
          : view==='sect' ? `<span style="font-size:11px; color:var(--n-500);">3 sections · glissez une table pour la réassigner</span>`
          : `<span style="font-size:11px; color:var(--n-500);">6 réservations ce soir · 20 couverts attendus</span>`
        }
      </div>
    </div>

    <div class="floor-zone" style="margin-top:14px;">SALLE INTÉRIEURE</div>
    <div class="floor" style="grid-template-columns:repeat(6,1fr);">
      ${TABLES.filter(t => t.zone === 'Salle').map(t => tableCard(t, view)).join('')}
    </div>

    <div class="floor-zone">TERRASSE</div>
    <div class="floor" style="grid-template-columns:repeat(4,1fr);">
      ${TABLES.filter(t => t.zone === 'Terrasse').map(t => tableCard(t, view)).join('')}
    </div>
  `;

  /* ─── Full-page body ─── */
  const dr = fullpage({
    title: 'Plan de salle & stratégie · Café Atlas',
    subtitle: `${occupied}/${TABLES.length} occupées · ${covers} couverts en service · ${free} libres · top : ${topTable.id} (${topTable.rev.toLocaleString('fr-FR')} MAD)`,
    width: 1120,
    body: `
      <style>
        .owner-tbl { cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; position:relative; }
        .owner-tbl:hover { transform:translateY(-2px); box-shadow:0 8px 22px -12px rgba(11,110,79,0.22); }
        .tbl-flag { position:absolute; top:6px; right:6px; width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:var(--mono); }
        .tbl-flag.top  { background:var(--mint); color:var(--riad); }
        .tbl-flag.dead { background:var(--n-200); color:var(--n-600); }
        .floor-tabs { display:flex; gap:4px; padding:3px; background:var(--paper-soft); border-radius:10px; }
        .floor-tabs .ft { background:transparent; border:none; padding:7px 14px; border-radius:7px; font-size:12px; font-weight:500; color:var(--n-600); cursor:pointer; transition:.18s; letter-spacing:0.01em; }
        .floor-tabs .ft:hover { color:var(--ink); }
        .floor-tabs .ft.active { background:var(--paper); color:var(--ink); box-shadow:0 1px 3px rgba(10,15,13,0.06); font-weight:600; }
        .floor-legend-box { display:flex; align-items:center; }
        .layout-presets { display:flex; gap:6px; align-items:center; }
        .layout-presets .lp { padding:7px 12px; border:1px solid var(--n-200); background:var(--paper); border-radius:8px; font-size:12px; cursor:pointer; color:var(--n-700); transition:.18s; }
        .layout-presets .lp:hover { border-color:var(--atlas); color:var(--atlas); }
        .layout-presets .lp.active { background:var(--riad); color:var(--paper); border-color:var(--riad); font-weight:600; }
        .ai-card { background:linear-gradient(180deg, rgba(125,242,176,0.10) 0%, rgba(11,110,79,0.04) 100%); border:1px solid rgba(11,110,79,0.18); border-radius:12px; padding:14px; }
        .ai-row { display:flex; gap:12px; padding:12px 0; border-top:1px dashed rgba(11,110,79,0.18); }
        .ai-row:first-child { border-top:none; padding-top:4px; }
        .ai-ic { width:30px; height:30px; border-radius:50%; background:var(--mint); color:var(--riad); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; font-family:var(--mono); flex-shrink:0; }
        .ai-row.warn .ai-ic { background:var(--warning); color:var(--paper); }
        .ai-row.opp  .ai-ic { background:var(--mint); }
        .ai-body { flex:1; }
        .ai-body h5 { font-size:13px; font-weight:600; margin:0 0 4px; color:var(--ink); }
        .ai-body p  { font-size:12px; color:var(--n-600); line-height:1.5; margin:0 0 8px; }
        .ai-body .kb { padding:5px 10px; font-size:11px; }
        .ai-brand { display:flex; align-items:center; gap:6px; font-size:10.5px; font-family:var(--mono); letter-spacing:0.1em; color:var(--atlas); margin-bottom:10px; text-transform:uppercase; }
        .ai-brand::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--mint); box-shadow:0 0 8px rgba(125,242,176,0.6); }
        .resa-row { display:grid; grid-template-columns:54px 1fr auto; gap:10px; padding:10px 0; border-top:1px solid var(--n-200); align-items:center; font-size:13px; }
        .resa-row:first-child { border-top:none; padding-top:4px; }
        .resa-time { font-family:var(--mono); font-weight:600; color:var(--ink); font-size:12.5px; }
        .resa-name { font-weight:500; }
        .resa-meta { font-size:11px; color:var(--n-500); margin-top:2px; display:flex; gap:6px; align-items:center; }
        .resa-chip { padding:2px 7px; border-radius:99px; font-size:9.5px; font-weight:600; font-family:var(--mono); letter-spacing:0.04em; text-transform:uppercase; }
        .resa-chip.habitue  { background:rgba(11,110,79,0.10); color:var(--atlas); }
        .resa-chip.anniversaire { background:rgba(255,182,77,0.16); color:#a85d00; }
        .resa-chip.vip { background:var(--riad); color:var(--mint); }
        .resa-chip.walkin { background:var(--n-200); color:var(--n-700); }
        .resa-chip.regulier { background:rgba(11,110,79,0.10); color:var(--atlas); }
        .resa-chip.first { background:rgba(125,242,176,0.30); color:var(--riad); }
        .resa-tbl { font-family:var(--mono); font-size:12px; color:var(--atlas); font-weight:600; }
        .perf-row { display:grid; grid-template-columns:36px 1fr auto; gap:10px; align-items:center; padding:8px 0; font-size:13px; }
        .perf-row + .perf-row { border-top:1px solid var(--n-200); }
        .perf-id { font-family:var(--mono); font-weight:700; color:var(--ink); font-size:12.5px; }
        .perf-bar { height:6px; background:var(--n-200); border-radius:3px; overflow:hidden; }
        .perf-bar > i { display:block; height:100%; background:linear-gradient(90deg, var(--atlas), var(--mint)); border-radius:3px; }
        .perf-amt { font-family:var(--mono); font-size:12px; color:var(--atlas); font-weight:600; }
        .sect-card { background:var(--paper); border:1px solid var(--n-200); border-radius:10px; padding:12px; }
        .sect-head { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; margin-bottom:8px; }
        .sect-dot { width:10px; height:10px; border-radius:3px; }
        .sect-meta { font-size:11px; color:var(--n-500); margin-top:6px; line-height:1.5; }
      </style>

      <div class="p-kpis">
        <div class="p-kpi"><div class="l">EN SERVICE</div><div class="v">${occupied}<span class="u">/ ${TABLES.length}</span></div><div class="d up">${covers} couverts · vélocité 42 min</div></div>
        <div class="p-kpi"><div class="l">REVENU / COUVERT</div><div class="v">${revPerCover.toLocaleString('fr-FR')}<span class="u"> MAD</span></div><div class="d up">+ 8 % vs cible mensuelle</div></div>
        <div class="p-kpi"><div class="l">MEILLEURE TABLE</div><div class="v" style="color:var(--atlas);">${topTable.id}</div><div class="d">${topTable.rev.toLocaleString('fr-FR')} MAD · ${topTable.turns} rot/jour</div></div>
        <div class="p-kpi"><div class="l">SIÈGES MORTS</div><div class="v" style="color:var(--warning);">${deadSeats.length}</div><div class="d">${deadSeats.map(t => t.id).join(', ')} · à optimiser</div></div>
      </div>

      <div class="p-toolbar">
        <div class="layout-presets">
          <span style="font-size:11px; color:var(--n-500); letter-spacing:0.06em; font-family:var(--mono); margin-right:4px;">PLAN</span>
          <button class="lp" data-action="tables-layout-midi">Service midi</button>
          <button class="lp active" data-action="tables-layout-soir">Service soir</button>
          <button class="lp" data-action="tables-layout-event">Événement</button>
        </div>
        <div style="flex:1;"></div>
        <button class="kb ghost" data-action="tables-edit-mode">✎ Modifier le plan</button>
        <button class="kb ghost" data-action="tables-rebalance">Auto-équilibrer</button>
        <button class="kb atlas" data-action="tables-new">+ Ajouter une table</button>
      </div>

      <div class="p-divider-l">Plan de salle</div>

      <div data-floor-container>
        ${renderFloor('live')}
      </div>

      <div class="p-grid-2" style="display:grid; grid-template-columns:1.05fr 1fr; gap:14px; margin-top:18px;">
        <div class="p-card">
          <div class="head">
            <h4>Sections & affectation serveurs</h4>
            <div class="meta">SHIFT SOIR · ${STAFF.length} ACTIFS</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
            ${SECTIONS.map(sec => {
              const tbls = TABLES.filter(t => t.section === sec.k);
              const totalSeats = tbls.reduce((s,t) => s + t.seats, 0);
              const staff = STAFF.find(s => s.i === sec.server);
              return `
                <div class="sect-card">
                  <div class="sect-head"><span class="sect-dot" style="background:${sec.color};"></span>${sec.name}</div>
                  <div style="font-size:11.5px; color:var(--n-700);"><b>${tbls.length} tables</b> · ${totalSeats} couverts</div>
                  <div class="sect-meta">Serveur · <b style="color:var(--ink);">${sec.co}</b><br/>Revenu shift · <span class="mono" style="color:var(--atlas);">${staff.rev.toLocaleString('fr-FR')} MAD</span></div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display:flex; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid var(--n-200); align-items:center;">
            <span style="font-size:11.5px; color:var(--n-500); flex:1;">Charge bien équilibrée · écart max 18 % entre sections.</span>
            <button class="kb ghost" style="padding:5px 10px; font-size:11px;" data-action="tables-section-edit">Reconfigurer</button>
          </div>
        </div>

        <div class="p-card ai-card" style="margin:0;">
          <div class="ai-brand">Kiwi AI · stratégie de salle</div>
          ${AI_INSIGHTS.map(ai => `
            <div class="ai-row ${ai.tone}">
              <div class="ai-ic">${ai.ic}</div>
              <div class="ai-body">
                <h5>${ai.title}</h5>
                <p>${ai.desc}</p>
                <button class="kb ghost" onclick="window.Kiwi.toast('${ai.action.label}',{type:'info',desc:${JSON.stringify(ai.action.toast)}})">${ai.action.label}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="p-grid-2" style="display:grid; grid-template-columns:1.05fr 1fr; gap:14px; margin-top:14px;">
        <div class="p-card">
          <div class="head">
            <h4>Réservations à venir · ce soir</h4>
            <div class="meta">6 RÉSAS · 20 COUVERTS</div>
          </div>
          ${RESAS.map(r => `
            <div class="resa-row">
              <div class="resa-time">${r.time}</div>
              <div>
                <div class="resa-name">${r.name} <span style="color:var(--n-500); font-weight:400;">· ${r.party} couv.</span></div>
                <div class="resa-meta">
                  <span class="resa-chip ${r.tag==='habitué'?'habitue':r.tag==='1re visite'?'first':r.tag==='walk-in'?'walkin':r.tag}">${r.tag}</span>
                  ${r.note}
                </div>
              </div>
              <div class="resa-tbl">${r.table}</div>
            </div>
          `).join('')}
        </div>

        <div class="p-card">
          <div class="head">
            <h4>Performance par table · 30 j</h4>
            <div class="meta">REVENU CUMULÉ</div>
          </div>
          ${[...TABLES].sort((a,b) => (b.rev||0)-(a.rev||0)).slice(0,8).map(t => {
            const max = topTable.rev;
            const pct = Math.round(((t.rev||0)/max)*100);
            return `
              <div class="perf-row">
                <div class="perf-id">${t.id}</div>
                <div>
                  <div style="font-size:11px; color:var(--n-500); margin-bottom:4px;">${t.seats} couv. · ${t.turns} rot/jour ${t.flag==='dead'?'· <span style="color:var(--warning);">siège mort</span>':t.flag==='top'?'· <span style="color:var(--atlas);">★ top</span>':''}</div>
                  <div class="perf-bar"><i style="width:${pct}%;"></i></div>
                </div>
                <div class="perf-amt">${(t.rev||0).toLocaleString('fr-FR')}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `,
    foot: `
      <div style="display:flex; gap:8px; justify-content:space-between; width:100%; align-items:center;">
        <span style="font-family:var(--mono); font-size:11px; color:var(--n-500); letter-spacing:0.06em;">PLAN ENREGISTRÉ · MAJ AUTO</span>
        <div style="display:flex; gap:8px;">
          <button class="kb ghost" data-action="tables-export-plan">Exporter le plan</button>
          <button class="kb ghost" data-dismiss>Fermer</button>
        </div>
      </div>
    `
  });

  wireDismiss(dr);

  /* ─── View-tab switching: re-render floor inline ─── */
  let currentView = 'live';
  const rebindTabs = () => {
    const tabs = dr.el.querySelectorAll('[data-floor-tabs] .ft');
    tabs.forEach(tb => {
      tb.onclick = () => {
        currentView = tb.getAttribute('data-fview');
        const container = dr.el.querySelector('[data-floor-container]');
        if (container) container.innerHTML = renderFloor(currentView);
        rebindTabs();
        rebindTableClicks();
      };
    });
  };

  /* ─── Click any table → open Insights modal (owner POV, NOT encaisser) ─── */
  const rebindTableClicks = () => {
    dr.el.querySelectorAll('.owner-tbl').forEach(el => {
      el.onclick = () => {
        const id = el.getAttribute('data-tbl');
        const t = TABLES.find(x => x.id === id);
        if (t) openTableInsights(t);
      };
    });
  };

  setTimeout(() => {
    rebindTabs();
    rebindTableClicks();
  }, 0);
};

/* ─── Table Insights — owner-perspective table profile ───────────────────── */
function openTableInsights(t) {
  const STAFF_NAMES = { FK: 'Fatima Khalki', HJ: 'Hamid Jelloul', SB: 'Sofia Belkadi', YA: 'Youssef Amrani', MM: 'Mehdi Mansouri' };
  const nextResa = ({
    T1: '20:30 · Hassan Chakir · 4 couverts',
    T7: '20:00 · Groupe Bouazza · 6 couverts · VIP',
    T9: '21:00 · Table Senhaji · 4 couverts',
    T11: '19:30 · Famille El Idrissi · 4 couverts · habitué',
    TR1: '19:45 · M. & Mme Benani · 2 couverts · anniversaire',
  })[t.id] || 'aucune réservation ce soir';
  const aiTip = t.flag === 'top'
    ? 'Table-vedette · à protéger des fusions et à proposer en priorité aux VIP.'
    : t.flag === 'dead'
      ? 'Sous-performe · revenu/couvert 30 % en dessous moyenne. Envisager une fusion ou un repositionnement.'
      : t.seats >= 6
        ? 'Grande table · rotation lente mais ticket élevé. Idéale pour les groupes en soirée.'
        : 'Performance moyenne · bonne rotation. Stable, peu d\'optimisation à faire.';

  wireDismiss(modal({
    tag: `TABLE ${t.id}`,
    title: `${t.id} · ${t.zone} · ${t.seats} couverts`,
    desc: `${stateLabelOwner(t.state)} · serveur assigné : ${STAFF_NAMES[t.server] || '—'}`,
    width: 560,
    body: `
      <style>
        .ti-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
        .ti-stat { background:var(--paper-soft); border-radius:10px; padding:12px 14px; }
        .ti-stat .l { font-size:10.5px; font-family:var(--mono); letter-spacing:0.1em; color:var(--n-500); text-transform:uppercase; margin-bottom:4px; }
        .ti-stat .v { font-size:20px; font-weight:600; color:var(--ink); }
        .ti-stat .v.atlas { color:var(--atlas); }
        .ti-stat .d { font-size:11px; color:var(--n-500); margin-top:2px; }
        .ti-section { padding-top:14px; margin-top:14px; border-top:1px solid var(--n-200); }
        .ti-section h5 { font-size:11px; font-family:var(--mono); letter-spacing:0.1em; color:var(--n-500); text-transform:uppercase; margin:0 0 8px; }
        .ti-row { font-size:13px; color:var(--n-700); padding:6px 0; display:flex; justify-content:space-between; }
        .ti-row b { color:var(--ink); }
        .ti-ai { background:linear-gradient(180deg, rgba(125,242,176,0.12) 0%, rgba(11,110,79,0.04) 100%); border:1px solid rgba(11,110,79,0.18); border-radius:10px; padding:12px 14px; margin-top:14px; }
        .ti-ai-brand { font-size:10px; font-family:var(--mono); letter-spacing:0.1em; color:var(--atlas); display:flex; align-items:center; gap:6px; margin-bottom:6px; }
        .ti-ai-brand::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--mint); }
        .ti-ai p { font-size:12.5px; line-height:1.5; color:var(--n-700); margin:0; }
      </style>

      <div class="ti-grid">
        <div class="ti-stat"><div class="l">REVENU 30 J</div><div class="v atlas">${(t.rev||0).toLocaleString('fr-FR')} <span style="font-size:13px; color:var(--n-500);">MAD</span></div><div class="d">cumul mensuel</div></div>
        <div class="ti-stat"><div class="l">ROTATIONS / JOUR</div><div class="v">${t.turns}</div><div class="d">${t.turns >= 3 ? 'bonne velocité' : 'rotation lente'}</div></div>
        <div class="ti-stat"><div class="l">REVENU / COUVERT</div><div class="v">${Math.round((t.rev||0)/(t.seats*30)).toLocaleString('fr-FR')}<span style="font-size:13px; color:var(--n-500);"> MAD</span></div><div class="d">par siège · jour moyen</div></div>
        <div class="ti-stat"><div class="l">ÉTAT ACTUEL</div><div class="v" style="color:${t.state==='occupied'?'var(--atlas)':t.state==='pay-pending'?'var(--warning)':t.state==='cleaning'?'var(--info)':'var(--n-500)'};">${stateLabelOwner(t.state)}</div><div class="d">${t.state === 'occupied' || t.state === 'pay-pending' ? `assise il y a ${t.mins} min` : '—'}</div></div>
      </div>

      <div class="ti-section">
        <h5>Affectation</h5>
        <div class="ti-row"><span>Section</span><b>${({A:'Salle A',B:'Salle B',C:'Terrasse'})[t.section] || '—'}</b></div>
        <div class="ti-row"><span>Serveur</span><b>${STAFF_NAMES[t.server] || '—'}</b></div>
        <div class="ti-row"><span>Prochaine réservation</span><b style="color:var(--atlas);">${nextResa}</b></div>
      </div>

      <div class="ti-ai">
        <div class="ti-ai-brand">Kiwi AI · recommandation</div>
        <p>${aiTip}</p>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Fermer</button>
      <button class="kb ghost" data-dismiss onclick="window.Kiwi.toast('Réassignation de ${t.id}',{type:'info',desc:'Choisissez un nouveau serveur dans Sections.'})">Réassigner serveur</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('${t.id} marquée comme prioritaire',{type:'success',desc:'Apparaîtra en haut des suggestions de réservation.'})">Marquer prioritaire</button>
    `
  }));
}
function stateLabelOwner(s) {
  return ({ occupied: 'En service', libre: 'Libre', 'pay-pending': 'Addition en cours', cleaning: 'En nettoyage', paid: 'Payée, en repos' })[s] || s;
}

/* ─── Auxiliary owner-level handlers ─────────────────────────────────────── */
handlers['tables-new'] = () => {
  wireDismiss(modal({
    tag: 'AJOUTER',
    title: 'Ajouter une table au plan',
    desc: 'Configurez la nouvelle table puis glissez-la sur le plan en mode édition.',
    width: 520,
    body: `
      <div class="kf-group">
        <label class="kf-label">Identifiant</label>
        <input class="kf-input" value="T13" />
      </div>
      <div class="kf-group">
        <label class="kf-label">Couverts</label>
        <div style="display:flex; gap:6px;">
          ${[1, 2, 4, 6, 8, 10].map((n, i) => `<button class="kb ${i===2?'atlas':'ghost'}" style="flex:1; justify-content:center;">${n}</button>`).join('')}
        </div>
      </div>
      <div class="kf-group">
        <label class="kf-label">Section</label>
        <div style="display:flex; gap:6px;">
          <button class="kb atlas" style="flex:1; justify-content:center;">Salle A</button>
          <button class="kb ghost" style="flex:1; justify-content:center;">Salle B</button>
          <button class="kb ghost" style="flex:1; justify-content:center;">Terrasse</button>
        </div>
      </div>
      <div class="kf-help">La table sera ajoutée au plan en cours et synchronisée sur l'app serveur.</div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Table T13 ajoutée',{type:'success',desc:'4 couverts · Salle A · à glisser sur le plan.'}); window.Kiwi.confetti();">Ajouter la table</button>
    `
  }));
};

handlers['tables-edit-mode'] = () => {
  Kiwi.toast('Mode édition activé', { type: 'info', desc: 'Glissez les tables pour repositionner · double-clic pour éditer les couverts.' });
};

handlers['tables-rebalance'] = () => {
  wireDismiss(modal({
    tag: 'AUTO-ÉQUILIBRER',
    title: 'Rééquilibrer les sections',
    desc: 'Kiwi AI propose une nouvelle répartition pour égaliser la charge des serveurs.',
    width: 520,
    body: `
      <div class="p-card" style="margin:0;">
        <div class="head"><h4>3 réassignations suggérées</h4><span class="meta">SHIFT SOIR</span></div>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="padding:10px 0; border-top:1px solid var(--n-200); font-size:13px; display:flex; justify-content:space-between;"><span>T11 · Salle A · <b>Fatima</b> → <b>Mehdi</b></span><span style="font-family:var(--mono); color:var(--success);">−18 % charge</span></li>
          <li style="padding:10px 0; border-top:1px solid var(--n-200); font-size:13px; display:flex; justify-content:space-between;"><span>TR3 · Terrasse · <b>Mehdi</b> → <b>Youssef</b></span><span style="font-family:var(--mono); color:var(--success);">−12 % charge</span></li>
          <li style="padding:10px 0; border-top:1px solid var(--n-200); font-size:13px; display:flex; justify-content:space-between;"><span>T5 · Salle B · <b>Sofia</b> → <b>Hamid</b></span><span style="font-family:var(--mono); color:var(--success);">−8 % charge</span></li>
        </ul>
      </div>
      <div style="margin-top:12px; padding:10px 12px; background:var(--paper-soft); border-radius:10px; font-size:12px; color:var(--n-600);">
        Écart de charge après équilibrage : <b style="color:var(--atlas);">7 %</b> (vs 22 % actuel).
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Garder tel quel</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Sections rééquilibrées',{type:'success',desc:'3 tables réassignées · serveurs notifiés sur leur app.'})">Appliquer</button>
    `
  }));
};

handlers['tables-section-edit'] = () => {
  Kiwi.toast('Reconfiguration des sections', { type: 'info', desc: 'Glissez les tables d\'une section à l\'autre directement sur le plan.' });
};

handlers['tables-layout-midi']  = () => Kiwi.toast('Plan midi chargé',  { type: 'success', desc: '14 tables actives · pas de terrasse étendue.' });
handlers['tables-layout-soir']  = () => Kiwi.toast('Plan soir chargé',  { type: 'success', desc: '16 tables actives · terrasse complète.' });
handlers['tables-layout-event'] = () => Kiwi.toast('Plan événement',     { type: 'info', desc: 'Configuration banquet · 1 grande tablée de 18 couverts.' });

handlers['tables-export-plan'] = () => {
  Kiwi.toast('Plan exporté en PDF', { type: 'success', desc: 'Plan-de-salle-CafeAtlas-Soir.pdf · 1 page A3.' });
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 ·  MENU & MODIFICATEURS  ·  width 980
 * ═══════════════════════════════════════════════════════════════════════════ */
handlers['nav-menu'] = () => {
  const CATS = [
    { key: 'entrees', label: 'Entrées',  count: 8 },
    { key: 'tajines', label: 'Tajines',  count: 9 },
    { key: 'couscous', label: 'Couscous', count: 5 },
    { key: 'desserts', label: 'Desserts', count: 8 },
    { key: 'boissons', label: 'Boissons', count: 18 },
  ];
  const MENU = {
    entrees: [
      ['ent-1', 'Salade marocaine',   'Tomate, concombre, oignon, huile d\'olive',     32,  'ok',  'illimité', 'sans coriandre', '', 6,  142, '+ 32 cette semaine'],
      ['ent-2', 'Briouates viande',    'Triangles croustillants, bœuf mijoté',          45,  'ok',  '32 portions', '', '', 8,  84, '+ 8 %'],
      ['ent-3', 'Harira',              'Soupe traditionnelle pois chiches & lentilles', 28,  'ok',  'illimité', 'extra dattes · sans céleri', '', 7,  98,  'pic Ramadan'],
      ['ent-4', 'Zaalouk',             'Aubergine fumée, tomate, ail',                  28,  'low', '6 portions',  'sans coriandre', 'gluten-free', 12, 56, 'top 30 %'],
      ['ent-5', 'Bissara',             'Fèves moulues, cumin, huile d\'olive',           22,  'ok',  'illimité', '', 'gluten-free', 14, 38, 'classique'],
    ],
    tajines: [
      ['taj-1', 'Tajine kefta œuf',     'Viande hachée, œuf, tomate, épices',           85,  'ok',  '+ 3 modificateurs', 'sans coriandre · pain à part · piment fort', '', 1, 312, '+ 12 % marge'],
      ['taj-2', 'Tajine agneau pruneaux','Agneau mijoté, pruneaux, amandes',            110, 'out', '0 portion · ruptu.','sans gluten', 'sans gluten', 4, 184, 'top weekend'],
      ['taj-3', 'Tajine poulet citron',  'Poulet, olives, citron confit',                95,  'ok',  '24 portions',  'sans olives', '', 3, 226, '+ 5 %'],
      ['taj-4', 'Tajine kefta classique','Boulettes, sauce tomate, œufs',                75,  'ok',  '18 portions',  '', '', 5, 168, 'régulier'],
      ['taj-5', 'Tajine boeuf prunes',   'Bœuf mijoté 4h, pruneaux d\'Agen',             125, 'low', '4 portions',   '', '', 6, 142, 'premium'],
    ],
    couscous: [
      ['cou-1', 'Couscous royal',         'Bœuf, poulet, merguez, légumes',             95,  'ok',  '+ 2 modificateurs', 'sans piment · merguez doux', '', 2, 287, 'vendredi · top'],
      ['cou-2', 'Couscous légumes',       '7 légumes, pois chiches, raisins',           68,  'ok',  'illimité',  '', 'végan', 9, 64, 'gluten · semoule'],
      ['cou-3', 'Couscous agneau',        'Agneau braisé, oignons confits',             105, 'low', '5 portions','sans piment', '', 7, 98, '+ 18 %'],
      ['cou-4', 'Pastilla au poulet',     'Feuille fine, amandes, cannelle',            120, 'low', '3 portions','sucré ou salé', '', 3, 156, 'effet wow'],
    ],
    desserts: [
      ['des-1', 'Msemen beurre & miel',   'Crêpe feuilletée, beurre, miel',             12,  'ok',  'illimité',  '', '', 6,  221, 'top breakfast'],
      ['des-2', 'Cornes de gazelle',      'Pâte d\'amande, fleur d\'oranger',           28,  'low', '12 pièces', '', 'sans gluten possible', 11, 72, 'cadeau client'],
      ['des-3', 'Sellou',                 'Graines de sésame, amandes, miel',           30,  'ok',  'artisanal', '', '', 13, 38, 'occasionnel'],
      ['des-4', 'Chebakia',               'Gâteaux de miel frit · Ramadan',             24,  'out', 'saisonnier','', '', 15, 0,  'rupture'],
    ],
    boissons: [
      ['bo-1', 'Thé à la menthe',         'Gunpowder + menthe fraîche + sucre',         12,  'ok',  'illimité',  'sucre à part · double menthe', '', 5, 412, '#1 vente'],
      ['bo-2', 'Orange pressée',          'Pressée minute · 45 oranges en stock',       18,  'ok',  '45 oranges','sans glace · double', '', 7, 198, '+ 8 %'],
      ['bo-3', 'Café noir double',        'Espresso double · grain Algeria',            14,  'ok',  '+ 4 modif. lait',  'lait amande · lait avoine · sans sucre', '', 10, 124, 'régulier'],
      ['bo-4', 'Limonade traditionnelle', 'Citron vert + eau de fleur d\'oranger',      16,  'ok',  'illimité',  'sans sucre · pétillante', '', 8, 87, 'été'],
      ['bo-5', 'Méchoui',                 'Agneau rôti, parts pour 2 · 4',              180, 'low', '2 portions', 'parts pour 4 · épices fortes', '', 16, 24, 'haut de gamme'],
    ],
  };
  let activeCat = 'tajines';
  let menu86 = new Set(['taj-2', 'des-4']);

  const tagsHtml = (allerg, free) => {
    const out = [];
    if (allerg) out.push(`<span class="tg warn">${allerg.split(' · ')[0]}</span>`);
    if (free)   out.push(`<span class="tg">${free}</span>`);
    return out.join('');
  };
  const stockChip = (st) => st === 'ok' ? '<span class="chip ok">en stock</span>' : st === 'low' ? '<span class="chip pend">stock bas</span>' : '<span class="chip ref">RUPTURE</span>';

  const renderRow = (item, idx, total) => {
    const [id, name, desc, price, st, , mod, free, rank, sold, perf] = item;
    const is86 = menu86.has(id);
    return `
      <div class="menu-row ${is86 ? 'is-86' : ''}" data-row="${id}">
        <div class="photo">${name.includes('Tajine') ? '◉' : name.includes('Couscous') ? '◓' : name.includes('Café') || name.includes('Thé') ? '☕' : name.includes('Pastilla') ? '✦' : name.includes('Salade') ? '◴' : '●'}</div>
        <div class="nm">${name}<div class="desc">${desc}</div><div class="tags">${stockChip(is86 ? 'out' : st)} ${mod ? `<span class="tg">${mod.split(' · ').length} modif.</span>` : ''} ${tagsHtml('', free)}</div></div>
        <div class="pr">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')} MAD</div>
        <div class="rk"><b>#${rank}</b><div style="font-size:10px; color:var(--n-500);">${sold} vendus</div></div>
        <div class="menu-cat-actions" style="justify-content:flex-end;">
          <button class="ord-arrow" data-row-act="up" data-id="${id}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} aria-label="Monter">▲</button>
          <button class="ord-arrow" data-row-act="dn" data-id="${id}" ${idx === total - 1 ? 'disabled style="opacity:0.3;"' : ''} aria-label="Descendre">▼</button>
          <span class="toggle-86 ${is86 ? 'on' : ''}" data-row-act="86" data-id="${id}" title="${is86 ? 'Réactiver' : '86 it (rupture)'}"></span>
        </div>
        <div class="more" data-row-act="edit" data-id="${id}">⋯</div>
      </div>
    `;
  };

  const renderItems = (catKey) => {
    const list = MENU[catKey] || [];
    return list.map((it, i) => renderRow(it, i, list.length)).join('');
  };

  const menuDr = drawer({
    title: 'Menu & modificateurs · Café Atlas',
    subtitle: '45 items actifs · 5 catégories · 12 modificateurs · 2 produits 86\'d',
    width: 980,
    body: `
      <div class="p-kpis">
        <div class="p-kpi"><div class="l">CARTE ACTIVE</div><div class="v">45<span class="u">items</span></div><div class="d up">+ 3 ce mois</div></div>
        <div class="p-kpi"><div class="l">PANIER MOYEN</div><div class="v">158<span class="u"> MAD</span></div><div class="d up">+ 4,2 % vs sem. dernière</div></div>
        <div class="p-kpi"><div class="l">MARGE BRUTE</div><div class="v">66<span class="u">%</span></div><div class="d">cible 68 %</div></div>
        <div class="p-kpi" style="background:rgba(201,74,58,0.06); border-color:rgba(201,74,58,0.25);"><div class="l">86'D</div><div class="v" style="color:var(--danger);">2</div><div class="d">tajine agneau · chebakia</div></div>
      </div>

      <div class="menu-ai">
        <div class="ic">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="currentColor"/></svg>
        </div>
        <div class="b">
          <div class="t">INSIGHT KIWI · 4H AGO</div>
          <div class="n">Promouvoir le tajine kefta œuf cette semaine.</div>
          <div class="d">+ 12 % de marge vs moyenne carte · lift +18 % attendu si placé en bannière catalogue.</div>
        </div>
        <button class="kb" style="background:var(--mint); color:var(--riad);" data-action="menu-promote">Mettre en avant</button>
      </div>

      <div class="p-toolbar">
        <div class="p-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          Rechercher un item, un modificateur, un allergène…
        </div>
        <button class="kb ghost" data-action="menu-schedule">⏱ Plages horaires</button>
        <button class="kb ghost" data-action="menu-mass">Édition groupée</button>
        <button class="kb atlas" data-action="menu-add">+ Ajouter un item</button>
      </div>

      <div class="menu-pill-cats" id="menu-cats">
        ${CATS.map(c => `<button class="menu-pill-cat ${c.key === activeCat ? 'on' : ''}" data-cat="${c.key}">${c.label}<span class="ct">${c.count}</span></button>`).join('')}
      </div>

      <div class="p-pane" id="menu-pane">
        ${renderItems(activeCat)}
      </div>

      <div class="p-card" style="margin-top:18px;">
        <div class="head">
          <h4>Modificateurs partagés</h4>
          <span class="meta">12 ACTIFS · GLOBAUX SUR LA CARTE</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; font-size:12.5px;">
          ${[
            ['Sans coriandre', '21 items', 'gratuit'],
            ['Sans piment',    '18 items', 'gratuit'],
            ['Pain à part',    '15 items', 'gratuit'],
            ['Sucre à part',   '8 items',  'gratuit'],
            ['Double menthe',  'thé · 1 item', '+ 2 MAD'],
            ['Lait amande',    'cafés · 4 items', '+ 4 MAD'],
            ['Lait avoine',    'cafés · 4 items', '+ 4 MAD'],
            ['Parts pour 4',   'méchoui · 1 item', '+ 90 MAD'],
            ['Sans gluten',    '6 items',  'gratuit'],
            ['Bien cuit',      'tajines · 5', 'gratuit'],
            ['Saignant',       'tajines · 5', 'gratuit'],
            ['Pétillante',     'limonade · 1', '+ 1 MAD'],
          ].map(([n, scope, fee]) => `
            <div style="background:#fff; border:1px solid var(--n-200); border-radius:9px; padding:9px 11px;">
              <div style="font-weight:500; letter-spacing:-0.005em;">${n}</div>
              <div style="font-size:11px; color:var(--n-500); font-family:var(--mono); margin-top:3px; display:flex; justify-content:space-between;"><span>${scope}</span><span>${fee}</span></div>
            </div>
          `).join('')}
        </div>
      </div>
    `,
    foot: `
      <div style="display:flex; gap:8px; justify-content:space-between; width:100%; align-items:center;">
        <span style="font-family:var(--mono); font-size:11px; color:var(--n-500); letter-spacing:0.06em;">SYNC POS · 100 % · DERNIÈRE MAJ 12:42</span>
        <div style="display:flex; gap:8px;">
          <button class="kb ghost" data-dismiss>Fermer</button>
          <button class="kb primary" data-action="menu-publish">Publier la carte</button>
        </div>
      </div>
    `,
  });

  wireDismiss(menuDr);

  /* — wire up tabs, 86 toggles, reorder arrows, edit row — */
  setTimeout(() => {
    const root = menuDr.el;
    if (!root) return;
    const pane = root.querySelector('#menu-pane');

    root.querySelectorAll('#menu-cats .menu-pill-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-cat');
        if (key === activeCat) return;
        activeCat = key;
        root.querySelectorAll('#menu-cats .menu-pill-cat').forEach(b => b.classList.toggle('on', b === btn));
        pane.innerHTML = renderItems(activeCat);
        wireRows();
      });
    });

    function wireRows() {
      pane.querySelectorAll('[data-row-act]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          const a = b.getAttribute('data-row-act');
          const id = b.getAttribute('data-id');
          const list = MENU[activeCat];
          const idx = list.findIndex(x => x[0] === id);
          if (a === '86') {
            if (menu86.has(id)) menu86.delete(id); else menu86.add(id);
            window.Kiwi.toast(menu86.has(id) ? `${list[idx][1]} marqué 86 (rupture)` : `${list[idx][1]} de retour à la carte`, { type: menu86.has(id) ? 'warn' : 'success', desc: menu86.has(id) ? 'Retiré du POS et de Glovo · Jumia notifié.' : 'Item disponible sur tous les canaux.' });
            pane.innerHTML = renderItems(activeCat);
            wireRows();
          }
          if (a === 'up' && idx > 0) {
            [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
            pane.innerHTML = renderItems(activeCat);
            wireRows();
            window.Kiwi.toast(`${list[idx - 1][1]} repositionné`, { type: 'info' });
          }
          if (a === 'dn' && idx < list.length - 1) {
            [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
            pane.innerHTML = renderItems(activeCat);
            wireRows();
            window.Kiwi.toast(`${list[idx + 1][1]} repositionné`, { type: 'info' });
          }
          if (a === 'edit') openItemEdit(list[idx]);
        };
      });
      pane.querySelectorAll('.menu-row').forEach(r => {
        r.addEventListener('click', (e) => {
          if (e.target.closest('[data-row-act]')) return;
          const id = r.getAttribute('data-row');
          const list = MENU[activeCat];
          const item = list.find(x => x[0] === id);
          if (item) openItemEdit(item);
        });
      });
    }
    wireRows();
  }, 0);
};

/* ─── Item edit modal ──────────────────────────────────────────────────── */
function openItemEdit(it) {
  const [, name, desc, price, , avail, mod, free, rank, sold, perf] = it;
  const editM = window.Kiwi.modal({
    tag: 'ITEM',
    title: name,
    desc: desc,
    width: 640,
    body: `
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Nom</label><input class="kf-input" value="${name}" /></div>
        <div class="kf-group"><label class="kf-label">Prix TTC</label><input class="kf-input mono" value="${price}.00" /></div>
      </div>
      <div class="kf-group">
        <label class="kf-label">Description courte</label>
        <input class="kf-input" value="${desc}" />
      </div>
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Catégorie</label>
          <select class="kf-input"><option>Entrées</option><option selected>Tajines</option><option>Couscous</option><option>Desserts</option><option>Boissons</option></select>
        </div>
        <div class="kf-group"><label class="kf-label">Temps de prep.</label>
          <select class="kf-input"><option>5 min</option><option>10 min</option><option selected>15 min</option><option>20 min</option><option>25 min</option><option>30 min</option></select>
        </div>
      </div>
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Allergènes</label>
          <input class="kf-input" value="œuf · gluten" placeholder="ex. arachides · gluten" />
        </div>
        <div class="kf-group"><label class="kf-label">Coût matière</label>
          <input class="kf-input mono" value="${Math.round(price * 0.34)}.00" />
        </div>
      </div>
      <div class="kf-group">
        <label class="kf-label">Modificateurs autorisés</label>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${['Sans coriandre', 'Sans piment', 'Pain à part', 'Bien cuit', 'Saignant', 'Sans gluten'].map((m, i) => `<span class="chip ${i<3?'ok':'neutral'}" style="cursor:pointer;">${i<3?'✓ ':''}${m}</span>`).join('')}
        </div>
      </div>
      <div class="p-card" style="margin:14px 0 0;">
        <div class="head"><h4 style="font-size:13px;">Performance · 30 derniers jours</h4><span class="meta">RANG #${rank}</span></div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; font-size:12.5px;">
          <div><div style="color:var(--n-500); font-size:11px;">Vendus</div><div class="mono" style="font-size:18px; font-weight:600;">${sold}</div></div>
          <div><div style="color:var(--n-500); font-size:11px;">CA</div><div class="mono" style="font-size:18px; font-weight:600;">${(price * sold).toLocaleString('fr-FR')} MAD</div></div>
          <div><div style="color:var(--n-500); font-size:11px;">Marge brute</div><div class="mono" style="font-size:18px; font-weight:600; color:var(--atlas);">66 %</div></div>
        </div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb danger" data-dismiss onclick="window.Kiwi.toast('${name} supprimé de la carte',{type:'warn',desc:'Item retiré · les commandes ouvertes restent valides.'})">Supprimer</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('${name} mis à jour',{type:'success',desc:'Synchronisé sur POS · Glovo · Jumia · QR menu.'})">Enregistrer</button>
    `
  });
  if (typeof wireDismiss === 'function') wireDismiss(editM);
}

handlers['menu-add'] = () => {
  wireDismiss(modal({
    tag: 'NOUVEAU',
    title: 'Ajouter un nouvel item',
    desc: 'L\'item sera publié sur le POS, le QR menu et les agrégateurs en sync.',
    width: 600,
    body: `
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Nom de l'item</label><input class="kf-input" placeholder="ex. Tajine boulettes" /></div>
        <div class="kf-group"><label class="kf-label">Prix TTC</label><input class="kf-input mono" placeholder="0,00 MAD" /></div>
      </div>
      <div class="kf-group"><label class="kf-label">Catégorie</label>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${['Entrées', 'Tajines', 'Couscous', 'Desserts', 'Boissons'].map((c, i) => `<button class="kb ${i===1?'atlas':'ghost'}" style="flex:1; min-width:90px; justify-content:center;">${c}</button>`).join('')}
        </div>
      </div>
      <div class="kf-group"><label class="kf-label">Description (visible client)</label><input class="kf-input" placeholder="Ingrédients clés et style" /></div>
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Allergènes</label><input class="kf-input" placeholder="optionnel" /></div>
        <div class="kf-group"><label class="kf-label">Temps de prep.</label>
          <select class="kf-input"><option>5</option><option>10</option><option selected>15</option><option>20</option><option>25</option><option>30</option></select>
        </div>
      </div>
      <label style="display:flex; gap:10px; align-items:center; padding:10px 12px; background:var(--paper-soft); border-radius:10px; font-size:13px; cursor:pointer; margin-bottom:6px;">
        <input type="checkbox" checked /> Publier immédiatement sur tous les canaux (POS · QR · Glovo · Jumia)
      </label>
      <label style="display:flex; gap:10px; align-items:center; padding:10px 12px; background:var(--paper-soft); border-radius:10px; font-size:13px; cursor:pointer;">
        <input type="checkbox" /> Marquer "nouveau" pendant 14 jours
      </label>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Item publié sur la carte',{type:'success',desc:'Synchronisé sur POS · QR · Glovo · Jumia en 4 sec.'}); window.Kiwi.confetti();">Créer & publier</button>
    `
  }));
};

handlers['menu-mass'] = () => {
  wireDismiss(modal({
    tag: 'ÉDITION GROUPÉE',
    title: 'Modifier toute une catégorie',
    desc: 'Affecte tous les items sélectionnés en une opération.',
    width: 540,
    body: `
      <div class="kf-group"><label class="kf-label">Catégorie</label>
        <select class="kf-input"><option>Entrées (8)</option><option selected>Tajines (9)</option><option>Couscous (5)</option><option>Desserts (8)</option><option>Boissons (18)</option></select>
      </div>
      <div class="kf-group"><label class="kf-label">Action</label>
        <select class="kf-input">
          <option>Augmenter les prix de…</option>
          <option>Diminuer les prix de…</option>
          <option>Marquer la catégorie 86 (rupture)</option>
          <option>Activer disponibilité midi uniquement</option>
          <option>Cacher de la carte client</option>
        </select>
      </div>
      <div class="kf-group"><label class="kf-label">Pourcentage</label>
        <div style="display:flex; gap:6px;">
          ${['+ 2 %', '+ 5 %', '+ 8 %', '+ 10 %', 'autre'].map((p, i) => `<button class="kb ${i===1?'atlas':'ghost'}" style="flex:1; justify-content:center;">${p}</button>`).join('')}
        </div>
      </div>
      <div class="kf-help">9 items recevront +5 % · panier moyen estimé : 165 MAD (vs 158 MAD aujourd'hui).</div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('9 tajines ré-tarifés (+5 %)',{type:'success',desc:'Sync en cours · prochaine commande à 16:42.'})">Appliquer</button>
    `
  }));
};

handlers['menu-schedule'] = () => {
  wireDismiss(modal({
    tag: 'PLAGES HORAIRES',
    title: 'Carte programmée',
    desc: 'Affiche / cache automatiquement des items selon le service ou la saison.',
    width: 600,
    body: `
      <div class="p-card" style="margin:0 0 10px;">
        <div class="head"><h4 style="font-size:14px;">Couscous royal</h4><span class="chip ok">vendredi 11h–15h</span></div>
        <div style="font-size:12.5px; color:var(--n-500);">Affiché automatiquement le vendredi · masqué les autres jours. Glovo & Jumia synchronisés.</div>
      </div>
      <div class="p-card" style="margin:0 0 10px;">
        <div class="head"><h4 style="font-size:14px;">Méchoui</h4><span class="chip pend">soir 19h–23h</span></div>
        <div style="font-size:12.5px; color:var(--n-500);">Service du soir uniquement · 24h de préavis automatique.</div>
      </div>
      <div class="p-card" style="margin:0 0 10px;">
        <div class="head"><h4 style="font-size:14px;">Carte Ramadan complète</h4><span class="chip pend">programmée</span></div>
        <div style="font-size:12.5px; color:var(--n-500);">Bascule automatique au coucher du soleil · 15 mars → 13 avril 2027. Harira, chebakia, briouates en avant-plan.</div>
      </div>
      <div class="p-card" style="margin:0;">
        <div class="head"><h4 style="font-size:14px;">Petit-déj.</h4><span class="chip neutral">8h–11h tous les jours</span></div>
        <div style="font-size:12.5px; color:var(--n-500);">Msemen, harira, café, thé. Switch automatique sur la carte midi à 11h00.</div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Fermer</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Programmation enregistrée',{type:'success',desc:'4 plages actives · sync POS et agrégateurs.'})">+ Ajouter une plage</button>
    `
  }));
};

handlers['menu-promote'] = () => {
  wireDismiss(modal({
    tag: 'PROMOUVOIR',
    title: 'Mettre en avant le tajine kefta œuf',
    desc: 'L\'item apparaîtra en bannière sur le QR menu, le POS et les pages Glovo / Jumia pendant 7 jours.',
    width: 540,
    body: `
      <div class="p-card" style="margin:0 0 10px;">
        <div class="head"><h4 style="font-size:14px;">Estimation</h4><span class="meta">7 JOURS</span></div>
        <dl style="display:grid; grid-template-columns:1fr auto; gap:5px 14px; font-size:13px; margin:0;">
          <dt style="color:var(--n-500);">Lift de ventes attendu</dt><dd class="mono" style="color:var(--success); font-weight:600;">+18 %</dd>
          <dt style="color:var(--n-500);">Marge incrémentale</dt><dd class="mono">+ 2 184 MAD</dd>
          <dt style="color:var(--n-500);">Coût</dt><dd class="mono">0 MAD</dd>
        </dl>
      </div>
      <label style="display:flex; gap:10px; align-items:center; padding:10px 12px; background:var(--paper-soft); border-radius:10px; font-size:13px; cursor:pointer;">
        <input type="checkbox" checked /> Inclure une photo générée par IA (gratuit)
      </label>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Plus tard</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Tajine kefta œuf en avant',{type:'success',desc:'Bannière live sur QR · POS · Glovo · Jumia.'}); window.Kiwi.confetti();">Lancer la promo</button>
    `
  }));
};

handlers['menu-publish'] = () => {
  wireDismiss(modal({
    tag: 'PUBLIER',
    title: 'Publier la carte ?',
    desc: 'La nouvelle version sera synchronisée sur tous les canaux en moins de 10 secondes.',
    width: 520,
    body: `
      <div class="p-card" style="margin:0;">
        <div class="head"><h4 style="font-size:14px;">12 modifications en attente</h4><span class="meta">DEPUIS 12:42</span></div>
        <ul style="list-style:none; margin:0; padding:0; font-size:13px;">
          <li style="padding:8px 0; border-top:1px solid var(--n-200);">+ Ajout : <b>Pastilla aux fruits de mer</b></li>
          <li style="padding:8px 0; border-top:1px solid var(--n-200);">~ Prix : Tajine kefta œuf 80 → <b>85 MAD</b></li>
          <li style="padding:8px 0; border-top:1px solid var(--n-200);">86 : Tajine agneau pruneaux <span class="chip ref">RUPTURE</span></li>
          <li style="padding:8px 0; border-top:1px solid var(--n-200);">~ Modificateurs : 3 nouveaux sur tajines</li>
          <li style="padding:8px 0; border-top:1px solid var(--n-200);">~ 8 réorderings de catégorie</li>
        </ul>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Garder en brouillon</button>
      <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Carte publiée sur 4 canaux',{type:'success',desc:'POS · QR menu · Glovo · Jumia synchronisés en 6 sec.'}); window.Kiwi.confetti();">Publier maintenant</button>
    `
  }));
};
})();

/* ═══ Section 2 rest B · kds / stock ═══ */
(function() {
  "use strict";
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const fullpage = Kiwi.fullpage;
  const modal = Kiwi.modal;
  const toast = Kiwi.toast;
  const menu = Kiwi.menu;
  const confetti = Kiwi.confetti;
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Section 2-B (restaurant vertical) — sidebar handlers
 *
 * Two replacement handlers for /Users/badrosonair/Documents/kiwi/assets/pages.js:
 *   1. handlers['nav-kds']    · Écran cuisine · live ticket queue (1040-wide)
 *   2. handlers['nav-stock']  · Stock ingrédients · 20-item grid (1000-wide)
 *
 * Plus auxiliary action handlers (kds-bump, kds-recall, stock-reorder…).
 * Drop the contents of this file in place of the existing nav-kds and nav-stock
 * blocks (and append the auxiliary handlers next to the other action stubs).
 *
 * Companion CSS: /tmp/kiwi-s2-rest-css.css (append additions there).
 * ─────────────────────────────────────────────────────────────────────────── */

  /* ═══════════════════ ÉCRAN CUISINE (KDS) ═══════════════════ */
  handlers['nav-kds'] = () => {
    const tickets = [
      { id: 'T-7821', table: 'T4', src: 'salle',  cook: 'MM', elapsed: 412, items: [{ q: 2, n: 'Salade marocaine', st: 'salade' }, { q: 1, n: 'Tajine kefta œuf', st: 'cuisson' }, { q: 3, n: 'Thé menthe', st: 'boissons' }] },
      { id: 'T-7822', table: 'T7', src: 'salle',  cook: 'MM', elapsed: 198, items: [{ q: 1, n: 'Couscous royal', st: 'cuisson' }, { q: 1, n: 'Pastilla poulet', st: 'cuisson' }] },
      { id: 'T-7823', table: 'T2', src: 'salle',  cook: 'AY', elapsed: 632, items: [{ q: 4, n: 'Briouates viande', st: 'cuisson' }, { q: 2, n: 'Caviar d\'aubergine', st: 'salade' }] },
      { id: 'T-7824', table: 'TR2',src: 'terrasse', cook: 'AY', elapsed: 88,  items: [{ q: 2, n: 'Tajine kefta', st: 'cuisson' }, { q: 1, n: 'Salade marocaine', st: 'salade' }, { q: 2, n: 'Orange pressée', st: 'boissons' }] },
      { id: 'G-3412', table: 'GLOVO', src: 'livraison', cook: 'MM', elapsed: 548, items: [{ q: 2, n: 'Tajine kefta œuf', st: 'cuisson' }, { q: 1, n: 'Salade marocaine', st: 'salade' }] },
      { id: 'T-7825', table: 'T9', src: 'salle',  cook: 'AY', elapsed: 944, items: [{ q: 1, n: 'Pastilla poulet', st: 'cuisson' }, { q: 1, n: 'Salade marocaine', st: 'salade' }, { q: 1, n: 'Pâtisseries assorties', st: 'desserts' }] },
      { id: 'J-8821', table: 'JUMIA', src: 'livraison', cook: 'MM', elapsed: 318, items: [{ q: 3, n: 'Tajine kefta', st: 'cuisson' }] },
      { id: 'T-7826', table: 'TR1', src: 'terrasse', cook: 'AY', elapsed: 42,  items: [{ q: 2, n: 'Briouates viande', st: 'cuisson' }, { q: 1, n: 'Caviar d\'aubergine', st: 'salade' }, { q: 4, n: 'Café double', st: 'boissons' }] },
    ];
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const cls = (s) => s < 480 ? 'ok' : s < 900 ? 'warn' : 'over';
    const stationLabel = { salade: 'Salade', cuisson: 'Cuisson', boissons: 'Boissons', desserts: 'Desserts' };

    const ticketHtml = (t) => `
      <div class="kds-tk ${cls(t.elapsed)}" data-tk="${t.id}" data-stations="${[...new Set(t.items.map(i => i.st))].join(' ')}">
        <div class="kds-tk-head">
          <div class="kds-tk-id">
            <b>${t.table}</b><span class="kds-tk-src">· ${t.src}</span>
          </div>
          <div class="kds-tk-time mono ${cls(t.elapsed)}">${fmt(t.elapsed)}</div>
        </div>
        <ul class="kds-tk-items">
          ${t.items.map(i => `<li><span class="kds-q mono">×${i.q}</span><span class="kds-it">${i.n}</span><span class="kds-st kds-st-${i.st}">${stationLabel[i.st]}</span></li>`).join('')}
        </ul>
        <div class="kds-tk-foot">
          <span class="kds-tk-cook">Affecté : <b>${t.cook === 'MM' ? 'Mehdi M.' : 'Ayoub Y.'}</b></span>
          <span class="kds-tk-acts">
            <button class="kb ghost xs" data-action="kds-recall" data-id="${t.id}">Rappeler</button>
            <button class="kb atlas xs" data-action="kds-bump" data-id="${t.id}">Bump ✓</button>
          </span>
        </div>
      </div>`;

    const r = drawer({
      title: 'Écran cuisine · KDS',
      subtitle: '8 tickets en préparation · service midi · Mehdi Mansouri (chef)',
      width: 1040,
      body: `
        <div class="p-kpis kds-stat-strip">
          <div class="p-kpi"><div class="l">TICKETS ACTIFS</div><div class="v">8</div><div class="d">3 cuisson · 2 salade · 2 livraison · 1 terrasse</div></div>
          <div class="p-kpi"><div class="l">PRÉP. MOYENNE</div><div class="v">8 min <span class="u">14 s</span></div><div class="d up">SLA 12 min · respecté à 87 %</div></div>
          <div class="p-kpi"><div class="l">STATION CHARGÉE</div><div class="v">Cuisson</div><div class="d">5 tickets en file · 14 plats</div></div>
          <div class="p-kpi"><div class="l">PLAT DU MOMENT</div><div class="v">Tajine kefta</div><div class="d">7 commandes en 30 min</div></div>
        </div>

        <div class="kds-board">
          <div class="kds-main">
            <div class="kds-toolbar">
              <div class="kds-pills" role="tablist">
                <button class="kds-pill on" data-kds-st="all">Tout <span class="mono">8</span></button>
                <button class="kds-pill" data-kds-st="salade">Salade <span class="mono">4</span></button>
                <button class="kds-pill" data-kds-st="cuisson">Cuisson <span class="mono">7</span></button>
                <button class="kds-pill" data-kds-st="boissons">Boissons <span class="mono">3</span></button>
                <button class="kds-pill" data-kds-st="desserts">Desserts <span class="mono">1</span></button>
              </div>
              <div class="kds-tools">
                <button class="kb ghost xs" data-action="kds-fullscreen">Plein écran</button>
                <button class="kb ghost xs" data-action="kds-reassign">Réaffecter cuisinier</button>
              </div>
            </div>

            <div class="kds-grid-tk">
              ${tickets.map(ticketHtml).join('')}
            </div>
          </div>

          <aside class="kds-side">
            <div class="kds-side-head">
              <h5>Notifications cuisine</h5>
              <span class="chip neutral mono">5 nouvelles</span>
            </div>
            <div class="kds-notif warn">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
              <div><b>Ticket T9 dépasse 15 min</b><div class="m">Pastilla en attente cuisson · prévenir Mehdi M.</div></div>
            </div>
            <div class="kds-notif info">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
              <div><b>2 tajines kefta encore prévus</b><div class="m">Pré-cuire les œufs · gain estimé 90 s/ticket</div></div>
            </div>
            <div class="kds-notif info">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
              <div><b>Coursier Glovo arrivé</b><div class="m">Ticket G-3412 · prêt à récupérer comptoir</div></div>
            </div>
            <div class="kds-notif warn">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
              <div><b>Stock bas · feuilles de brick</b><div class="m">3 portions restantes · 86 le plat ?</div><button class="kds-notif-cta" data-action="kds-86" data-item="Pastilla poulet">86 cet item</button></div>
            </div>
            <div class="kds-notif">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
              <div><b>Sofia (salle) demande</b><div class="m">T4 — sans coriandre sur le tajine</div></div>
            </div>

            <div class="kds-side-head" style="margin-top:18px;">
              <h5>Performance cuisinier</h5>
            </div>
            <div class="kds-cook">
              <div class="kds-cook-av">MM</div>
              <div class="kds-cook-info">
                <b>Mehdi Mansouri · chef</b>
                <div class="m">4 tickets actifs · prép. moy. <b>7 min 50 s</b></div>
              </div>
              <span class="chip ok">SLA 92 %</span>
            </div>
            <div class="kds-cook">
              <div class="kds-cook-av b">AY</div>
              <div class="kds-cook-info">
                <b>Ayoub Yacoubi · auxiliaire</b>
                <div class="m">4 tickets actifs · prép. moy. <b>9 min 12 s</b></div>
              </div>
              <span class="chip pend">SLA 79 %</span>
            </div>
          </aside>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Fermer</button>
        <button class="kb ghost" data-action="kds-print-summary">Imprimer récap service</button>
        <button class="kb atlas" data-action="kds-fullscreen">Basculer iPad mural</button>
      `,
    });
    r.el.querySelector('.kiwi-drawer').classList.add('page-xl');
    r.el.querySelector('.kiwi-drawer').style.width = '1040px';

    // Click delegation: filter pills + ticket interactions
    r.el.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-kds-st]');
      if (pill) {
        r.el.querySelectorAll('[data-kds-st]').forEach(p => p.classList.toggle('on', p === pill));
        const k = pill.dataset.kdsSt;
        r.el.querySelectorAll('.kds-tk').forEach(tk => {
          const stations = (tk.dataset.stations || '').split(' ');
          tk.style.display = (k === 'all' || stations.includes(k)) ? '' : 'none';
        });
        return;
      }
      const tk = e.target.closest('.kds-tk');
      if (tk && !e.target.closest('button')) {
        const id = tk.dataset.tk;
        toast(`Ticket ${id} agrandi`, { type: 'info', desc: 'Mode focus · police × 1,4 pour brigade éloignée.' });
      }
    });
  };

  /* Stub handlers used inside the KDS drawer */
  handlers['kds-bump'] = (el) => {
    const id = el?.dataset.id || 'ticket';
    const tk = el?.closest('.kds-tk');
    modal({
      tag: 'CUISINE',
      title: `Bump ticket ${id} ?`,
      desc: 'Le ticket disparaît de l\'écran cuisine. La salle reçoit la notification « plat prêt ».',
      width: 460,
      body: `<div style="display:flex; gap:12px; padding:12px 14px; background:var(--paper-soft); border-radius:10px; font-size:13px; color:var(--n-600); line-height:1.5;">
        <span style="color:var(--atlas);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg></span>
        <div>Sofia (salle) sera notifiée pour récupérer les plats au pass. Action irréversible — utilisez « Rappeler » si besoin.</div>
      </div>`,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb atlas" data-confirm-bump="${id}">Bump ${id} ✓</button>`,
    });
    document.querySelector('[data-confirm-bump]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      if (tk) { tk.style.transition = 'all 280ms'; tk.style.opacity = '0'; tk.style.transform = 'translateX(20px)'; setTimeout(() => tk.remove(), 280); }
      toast(`Ticket ${id} bumpé`, { type: 'success', desc: 'Notification salle envoyée à Sofia · pass · ouvert depuis 4 s.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['kds-recall'] = (el) => {
    const id = el?.dataset.id || 'ticket';
    toast(`Ticket ${id} rappelé en cuisine`, { type: 'warn', desc: 'Le ticket revient en haut de la file · cuisinier averti.' });
  };
  handlers['kds-86'] = (el) => {
    const item = el?.dataset.item || 'plat';
    modal({
      tag: 'STOCK',
      title: `Mettre « ${item} » en 86 ?`,
      desc: 'Le plat devient indisponible sur tous les canaux : POS, Glovo, Jumia, QR table.',
      width: 480,
      body: `<div style="font-size:13px; color:var(--n-600); line-height:1.5;">Le client en train de commander voit le plat barré. Vous pouvez le réactiver dès que le stock revient.</div>`,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb danger" data-confirm-86>Confirmer le 86</button>`,
    });
    document.querySelector('[data-confirm-86]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast(`${item} en 86`, { type: 'success', desc: 'Désactivé sur POS, Glovo, Jumia, QR table en 3 secondes.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['kds-fullscreen'] = () => toast('Mode iPad mural activé', { type: 'info', desc: 'Police × 1,4 · auto-refresh 3 s · interface tactile gants compatible.' });
  handlers['kds-reassign'] = () => toast('Réaffecter ticket', { type: 'info', desc: 'Glissez le ticket vers Mehdi M. ou Ayoub Y. pour transférer.' });
  handlers['kds-print-summary'] = () => toast('Récap service midi imprimé', { type: 'success', desc: '47 plats servis · prép. moy. 8 min 14 s · 3 retours cuisine.' });

  /* ═══════════════════ STOCK INGRÉDIENTS ═══════════════════ */
  handlers['nav-stock'] = () => {
    // 20 ingredients · Café Atlas
    const stock = [
      { n: 'Œufs',             u: 'pcs',  q: 48,  thr: 60,  sup: 'Coopérative El Jadida', ld: '28 avr.', dts: 2,  auto: true },
      { n: 'Tomates',          u: 'kg',   q: 2.4, thr: 11,  sup: 'Maraîcher El Jadida',   ld: '29 avr.', dts: 1,  auto: true },
      { n: 'Poulet entier',    u: 'kg',   q: 14,  thr: 12,  sup: 'Boucherie Hassan Maarif', ld: '28 avr.', dts: 4, auto: true },
      { n: 'Agneau haché',     u: 'kg',   q: 3.2, thr: 8,   sup: 'Boucherie Hassan Maarif', ld: '27 avr.', dts: 2, auto: true },
      { n: 'Menthe fraîche',   u: 'kg',   q: 3.2, thr: 5,   sup: 'Maraîcher El Jadida',   ld: '29 avr.', dts: 2,  auto: true },
      { n: 'Farine T55',       u: 'kg',   q: 22,  thr: 15,  sup: 'Atelier Beldi',         ld: '24 avr.', dts: 12, auto: false },
      { n: 'Beurre',           u: 'kg',   q: 4.8, thr: 6,   sup: 'Crémerie Aïcha',        ld: '28 avr.', dts: 5,  auto: true },
      { n: 'Huile d\'argan',    u: 'L',    q: 1.8, thr: 2.5, sup: 'Coop. Argan Essaouira', ld: '20 avr.', dts: 8,  auto: true },
      { n: 'Citrons',          u: 'kg',   q: 17,  thr: 10,  sup: 'Maraîcher El Jadida',   ld: '29 avr.', dts: 6,  auto: true },
      { n: 'Pommes de terre',  u: 'kg',   q: 28,  thr: 18,  sup: 'Maraîcher El Jadida',   ld: '28 avr.', dts: 9,  auto: false },
      { n: 'Oignons',          u: 'kg',   q: 19,  thr: 15,  sup: 'Maraîcher El Jadida',   ld: '28 avr.', dts: 7,  auto: false },
      { n: 'Coriandre',        u: 'kg',   q: 0.8, thr: 1.5, sup: 'Maraîcher El Jadida',   ld: '29 avr.', dts: 1,  auto: true },
      { n: 'Persil',           u: 'kg',   q: 1.4, thr: 1.2, sup: 'Maraîcher El Jadida',   ld: '29 avr.', dts: 3,  auto: true },
      { n: 'Cumin moulu',      u: 'g',    q: 420, thr: 300, sup: 'Atelier Beldi',         ld: '12 avr.', dts: 18, auto: false },
      { n: 'Paprika fumé',     u: 'g',    q: 180, thr: 1000,sup: 'Atelier Beldi',         ld: '04 avr.', dts: 5,  auto: true },
      { n: 'Safran',           u: 'g',    q: 12,  thr: 8,   sup: 'Atelier Beldi',         ld: '02 mar.', dts: 22, auto: false },
      { n: 'Olives noires',    u: 'kg',   q: 6.4, thr: 5,   sup: 'Atelier Beldi',         ld: '22 avr.', dts: 11, auto: true },
      { n: 'Olives vertes',    u: 'kg',   q: 4.8, thr: 5,   sup: 'Atelier Beldi',         ld: '22 avr.', dts: 7,  auto: true },
      { n: 'Yaourt nature',    u: 'kg',   q: 3.6, thr: 4,   sup: 'Crémerie Aïcha',        ld: '28 avr.', dts: 2,  auto: true },
      { n: 'Lait',             u: 'L',    q: 14,  thr: 10,  sup: 'Crémerie Aïcha',        ld: '28 avr.', dts: 4,  auto: true },
    ];
    const fmtQ = (q, u) => `${String(q).replace('.', ',')} ${u}`;
    const stateOf = (it) => it.q === 0 ? 'out' : it.q < it.thr ? 'low' : 'ok';
    const card = (it, idx) => {
      const st = stateOf(it);
      const pct = Math.min(100, Math.round((it.q / it.thr) * 100));
      return `
        <div class="stock-card stock-${st}" data-state="${st}" data-supplier="${it.sup}" data-name="${it.n.toLowerCase()}">
          <div class="stock-card-head">
            <div>
              <b class="stock-name">${it.n}</b>
              <div class="stock-sup">${it.sup}</div>
            </div>
            ${st === 'low' ? '<span class="chip ref">Stock bas</span>' : st === 'out' ? '<span class="chip ref">Rupture</span>' : '<span class="chip ok">OK</span>'}
          </div>
          <div class="stock-bar-wrap">
            <div class="stock-bar ${st}"><div style="width:${pct}%;"></div></div>
            <div class="stock-qty mono">${fmtQ(it.q, it.u)} <span class="muted">/ seuil ${fmtQ(it.thr, it.u)}</span></div>
          </div>
          <div class="stock-meta">
            <div><span class="l">DERNIÈRE LIVRAISON</span><b>${it.ld}</b></div>
            <div><span class="l">RUPTURE PRÉVUE</span><b class="${it.dts <= 2 ? 'crit' : it.dts <= 5 ? 'warn' : ''}">${it.dts === 1 ? '1 jour' : `${it.dts} jours`}</b></div>
          </div>
          <div class="stock-card-foot">
            <label class="stock-toggle">
              <input type="checkbox" data-action="stock-toggle-auto" data-idx="${idx}" data-name="${it.n}" ${it.auto ? 'checked' : ''} />
              <span class="stt-track"><span class="stt-dot"></span></span>
              <span class="stt-l">Réappro auto</span>
            </label>
            <span class="stock-card-acts">
              <button class="kb ghost xs" data-action="stock-adjust" data-name="${it.n}">Ajuster</button>
              <button class="kb atlas xs" data-action="stock-reorder" data-name="${it.n}" data-supplier="${it.sup}">Commander</button>
            </span>
          </div>
        </div>`;
    };

    const r = fullpage({
      title: 'Stock ingrédients',
      subtitle: '20 ingrédients suivis · 5 alertes · 5 fournisseurs locaux · réappro auto active sur 14',
      width: 1000,
      body: `
        <div class="p-kpis">
          <div class="p-kpi"><div class="l">EN ALERTE</div><div class="v" style="color:var(--danger);">5 <span class="u">/ 20</span></div><div class="d">Coriandre · Tomates · Œufs · Paprika · Yaourt</div></div>
          <div class="p-kpi"><div class="l">RUPTURES &lt; 48 H</div><div class="v">3</div><div class="d">Coriandre 1 j · Tomates 1 j · Œufs 2 j</div></div>
          <div class="p-kpi"><div class="l">VALEUR STOCK</div><div class="v">8 420 <span class="u">MAD</span></div><div class="d">−12 % vs semaine dernière</div></div>
          <div class="p-kpi"><div class="l">FOURNISSEURS</div><div class="v">5</div><div class="d">Maraîcher · Boucherie · Beldi · Argan · Crémerie</div></div>
        </div>

        <div class="stock-hint">
          <div class="stock-hint-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
          <div class="stock-hint-body">
            <b>Suggestion automatique · Boucherie Hassan Maarif</b>
            <div class="m">Commandez <b>12 kg d'agneau haché</b> avant <b>vendredi 14 h</b> — date butoir fournisseur. Couvre la consommation prévue jusqu'à mardi prochain.</div>
          </div>
          <button class="kb atlas xs" data-action="stock-reorder-suggested">Valider la commande</button>
        </div>

        <div class="stock-toolbar">
          <div class="kds-pills" role="tablist">
            <button class="kds-pill on" data-stk-f="all">Tout <span class="mono">20</span></button>
            <button class="kds-pill" data-stk-f="out">Ruptures <span class="mono">0</span></button>
            <button class="kds-pill" data-stk-f="low">Stock bas <span class="mono">5</span></button>
            <button class="kds-pill" data-stk-f="ok">OK <span class="mono">15</span></button>
          </div>
          <div class="stock-tools">
            <button class="kb ghost xs" data-action="stock-recipe">Calculateur de recettes</button>
            <button class="kb ghost xs" data-action="stock-waste-log">+ Saisir une perte</button>
            <button class="kb ghost xs" data-action="stock-suppliers">Annuaire fournisseurs</button>
          </div>
        </div>

        <div class="stock-grid">
          ${stock.map((it, i) => card(it, i)).join('')}
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Fermer</button>
        <button class="kb ghost" data-action="stock-history">Historique commandes</button>
        <button class="kb atlas" data-action="stock-reorder-all">Lancer commande groupée · 5 alertes</button>
      `,
    });
    // Fullpage mode owns its own layout — don't pin a fixed width.

    // Filter pills
    r.el.addEventListener('click', (e) => {
      const f = e.target.closest('[data-stk-f]');
      if (!f) return;
      r.el.querySelectorAll('[data-stk-f]').forEach(p => p.classList.toggle('on', p === f));
      const k = f.dataset.stkF;
      r.el.querySelectorAll('.stock-card').forEach(c => {
        c.style.display = (k === 'all' || c.dataset.state === k) ? '' : 'none';
      });
    });
  };

  /* Stub handlers used inside the stock drawer */
  handlers['stock-toggle-auto'] = (el) => {
    const on = el?.checked;
    const name = el?.dataset.name || 'ingrédient';
    toast(`Réappro auto · ${name} ${on ? 'activé' : 'désactivé'}`, {
      type: on ? 'success' : 'info',
      desc: on ? 'Commande déclenchée automatiquement au seuil bas.' : 'Vous gérez désormais la commande manuellement.',
    });
  };
  handlers['stock-adjust'] = (el) => {
    const name = el?.dataset.name || 'ingrédient';
    modal({
      tag: 'INVENTAIRE',
      title: `Ajuster le stock · ${name}`,
      desc: 'Saisie manuelle utilisée après inventaire physique ou casse.',
      width: 480,
      body: `
        <div class="kf-group">
          <label class="kf-label">Nouveau stock</label>
          <input class="kf-input" type="text" placeholder="Ex. 4,2" />
        </div>
        <div class="kf-group">
          <label class="kf-label">Motif</label>
          <select class="kf-input">
            <option>Inventaire physique</option>
            <option>Casse / perte</option>
            <option>Don / repas employé</option>
            <option>Erreur de saisie</option>
          </select>
        </div>
        <div class="kf-help">L'ajustement est tracé dans l'historique avec votre identifiant et l'heure.</div>
      `,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb atlas" data-confirm-adjust>Enregistrer l'ajustement</button>`,
    });
    document.querySelector('[data-confirm-adjust]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast(`${name} · stock ajusté`, { type: 'success', desc: 'Historique mis à jour. Seuil de réappro recalculé.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  const SAVED_SUPPLIERS = [
    'Omar Dajaj',
    'Hamza Lhawat',
    'Yassine Lkhadar',
    'Boucherie Hassan Maarif',
    'Maraîcher El Jadida',
    'Coopérative El Jadida',
    'Crémerie Aïcha',
    'Atelier Beldi',
  ];
  handlers['stock-reorder'] = (el) => {
    const name = el?.dataset.name || 'ingrédient';
    let sup = el?.dataset.supplier || 'fournisseur';
    if (!SAVED_SUPPLIERS.includes(sup)) SAVED_SUPPLIERS.unshift(sup);
    modal({
      tag: 'COMMANDE',
      title: `Commander ${name}`,
      desc: `Envoi WhatsApp à ${sup} · livraison estimée demain matin.`,
      width: 500,
      body: `
        <div class="kf-group">
          <label class="kf-label">Fournisseur</label>
          <select class="kf-input" data-supplier-select>
            ${SAVED_SUPPLIERS.map((s) => `<option value="${s}"${s === sup ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="kf-row">
          <div class="kf-group">
            <label class="kf-label">Quantité</label>
            <input class="kf-input" type="text" value="12" />
          </div>
          <div class="kf-group">
            <label class="kf-label">Unité</label>
            <input class="kf-input" type="text" value="kg" />
          </div>
        </div>
        <div class="kf-group">
          <label class="kf-label" data-supplier-note-label>Note pour ${sup}</label>
          <textarea class="kf-input" rows="3" placeholder="Ex. livraison avant 11h, entrée arrière">Livraison vendredi avant 11 h · Mehdi reçoit en cuisine</textarea>
        </div>
        <div style="display:flex; gap:10px; padding:10px 12px; background:var(--paper-soft); border-radius:10px; font-size:12.5px;">
          <span style="color:var(--atlas);">✓</span>
          <div><b>Total estimé · 1 245,50 MAD</b><div style="color:var(--n-500); margin-top:2px;">Acompte non requis — historique de paiement en règle.</div></div>
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb atlas" data-confirm-order>Envoyer la commande</button>`,
    });
    const supSelect = document.querySelector('[data-supplier-select]');
    supSelect?.addEventListener('change', () => {
      sup = supSelect.value;
      const noteLabel = document.querySelector('[data-supplier-note-label]');
      if (noteLabel) noteLabel.textContent = `Note pour ${sup}`;
    });
    document.querySelector('[data-confirm-order]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast(`Commande envoyée à ${sup}`, { type: 'success', desc: `${name} · WhatsApp livré · accusé de réception attendu sous 30 min.` });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['stock-reorder-suggested'] = () => {
    modal({
      tag: 'SUGGESTION',
      title: 'Valider la commande suggérée',
      desc: '12 kg d\'agneau haché · Boucherie Hassan Maarif · livraison vendredi avant 14 h.',
      width: 460,
      body: `<div style="font-size:13px; color:var(--n-600); line-height:1.5;">Calculé sur la base des ventes des 14 derniers jours et du calendrier de service. Couvre la consommation prévue jusqu'à mardi prochain.</div>`,
      foot: `<button class="kb ghost" data-dismiss-modal>Modifier</button><button class="kb atlas" data-confirm-sugg>Confirmer · 1 245,50 MAD</button>`,
    });
    document.querySelector('[data-confirm-sugg]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast('Commande envoyée · Boucherie Hassan Maarif', { type: 'success', desc: '12 kg agneau haché · livraison vendredi 11 h confirmée par WhatsApp.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['stock-reorder-all'] = () => {
    modal({
      tag: 'COMMANDE GROUPÉE',
      title: 'Lancer la commande groupée · 5 alertes',
      desc: 'Une demande WhatsApp est envoyée à chaque fournisseur concerné.',
      width: 540,
      body: `
        <ul style="list-style:none; padding:0; margin:0; font-size:13px;">
          <li style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--n-200);"><span><b>Coriandre</b> · 2 kg<br><span style="color:var(--n-500); font-size:11.5px;">Maraîcher El Jadida</span></span><b class="mono">96,00 MAD</b></li>
          <li style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--n-200);"><span><b>Tomates</b> · 18 kg<br><span style="color:var(--n-500); font-size:11.5px;">Maraîcher El Jadida</span></span><b class="mono">288,00 MAD</b></li>
          <li style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--n-200);"><span><b>Œufs</b> · 4 plateaux<br><span style="color:var(--n-500); font-size:11.5px;">Coopérative El Jadida</span></span><b class="mono">280,00 MAD</b></li>
          <li style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--n-200);"><span><b>Paprika fumé</b> · 1 kg<br><span style="color:var(--n-500); font-size:11.5px;">Atelier Beldi</span></span><b class="mono">142,00 MAD</b></li>
          <li style="display:flex; justify-content:space-between; padding:9px 0;"><span><b>Yaourt nature</b> · 6 kg<br><span style="color:var(--n-500); font-size:11.5px;">Crémerie Aïcha</span></span><b class="mono">96,00 MAD</b></li>
          <li style="display:flex; justify-content:space-between; padding:14px 0 4px; border-top:2px solid var(--ink); font-size:14px;"><b>Total</b><b class="mono" style="color:var(--atlas); font-size:18px;">902,00 MAD</b></li>
        </ul>
      `,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb atlas" data-confirm-all>Envoyer aux 4 fournisseurs</button>`,
    });
    document.querySelector('[data-confirm-all]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast('4 commandes envoyées', { type: 'success', desc: 'WhatsApp livré · accusés attendus sous 30 min · livraisons demain matin.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['stock-recipe'] = () => {
    modal({
      tag: 'RECETTES',
      title: 'Calculateur de rendement recette',
      desc: 'Combien de portions un ingrédient peut produire selon vos recettes.',
      width: 540,
      body: `
        <div class="kf-group">
          <label class="kf-label">Ingrédient</label>
          <select class="kf-input">
            <option>Agneau haché · 3,2 kg disponibles</option>
            <option>Poulet entier · 14 kg disponibles</option>
            <option>Œufs · 48 pcs disponibles</option>
          </select>
        </div>
        <div class="kf-group">
          <label class="kf-label">Recette cible</label>
          <select class="kf-input">
            <option>Tajine kefta œuf · 180 g par portion</option>
            <option>Briouates viande · 60 g par portion</option>
            <option>Couscous royal · 120 g par portion</option>
          </select>
        </div>
        <div style="margin-top:14px; padding:18px; background:var(--mint-soft); border-radius:12px; text-align:center;">
          <div style="font-size:11px; letter-spacing:0.08em; color:var(--atlas); font-family:var(--mono); text-transform:uppercase;">RENDEMENT ESTIMÉ</div>
          <div style="font-size:38px; font-weight:600; color:var(--riad); letter-spacing:-0.025em; margin-top:4px;">17 portions</div>
          <div style="font-size:12.5px; color:var(--atlas); margin-top:2px;">3,2 kg ÷ 180 g = 17,7 → arrondi 17</div>
        </div>
        <div style="margin-top:12px; padding:12px 14px; background:var(--paper-soft); border-radius:10px; font-size:12.5px; line-height:1.5; color:var(--n-600);">
          <b>Couverture estimée :</b> 17 portions = ~1,5 service complet à allure normale (12 portions / midi). Réappro recommandé d'ici 36 h.
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss-modal>Fermer</button><button class="kb atlas" data-action="stock-reorder" data-name="Agneau haché" data-supplier="Boucherie Hassan Maarif">Commander maintenant</button>`,
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['stock-waste-log'] = () => {
    modal({
      tag: 'PERTES',
      title: 'Saisir une perte',
      desc: 'Tracé pour le calcul de marge et la fiscalité.',
      width: 480,
      body: `
        <div class="kf-row">
          <div class="kf-group">
            <label class="kf-label">Ingrédient</label>
            <select class="kf-input"><option>Tomates</option><option>Coriandre</option><option>Yaourt nature</option><option>Lait</option></select>
          </div>
          <div class="kf-group">
            <label class="kf-label">Quantité</label>
            <input class="kf-input" placeholder="Ex. 1,2 kg" />
          </div>
        </div>
        <div class="kf-group">
          <label class="kf-label">Motif</label>
          <select class="kf-input">
            <option>Périmé / DLC dépassée</option>
            <option>Casse / chute</option>
            <option>Erreur cuisine</option>
            <option>Réfrigérateur en panne</option>
            <option>Don / repas employé</option>
          </select>
        </div>
        <div class="kf-group">
          <label class="kf-label">Note (optionnel)</label>
          <textarea class="kf-input" rows="2" placeholder="Détails complémentaires"></textarea>
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss-modal>Annuler</button><button class="kb danger" data-confirm-waste>Enregistrer la perte</button>`,
    });
    document.querySelector('[data-confirm-waste]')?.addEventListener('click', () => {
      document.querySelector('.kiwi-backdrop')?.remove();
      toast('Perte enregistrée', { type: 'success', desc: 'Stock ajusté · trace conservée pour la déclaration TVA.' });
    });
    document.querySelector('[data-dismiss-modal]')?.addEventListener('click', () => document.querySelector('.kiwi-backdrop')?.remove());
  };
  handlers['stock-suppliers'] = () => {
    drawer({
      title: 'Annuaire fournisseurs',
      subtitle: '5 fournisseurs locaux · paiement T+30 sur tous les comptes',
      width: 520,
      body: `
        <div class="sup-card">
          <div class="sup-head"><b>Maraîcher El Jadida</b><span class="chip ok">Actif</span></div>
          <div class="sup-meta">Légumes · herbes · agrumes · livraison quotidienne 6 h</div>
          <div class="sup-row"><span class="l">Contact</span><b class="mono">+212 6 61 22 87 41</b></div>
          <div class="sup-row"><span class="l">Délai moyen</span><b>4 h</b></div>
          <div class="sup-row"><span class="l">Volume mensuel</span><b class="mono">8 420 MAD</b></div>
          <div class="sup-acts">
            <button class="kb ghost xs" data-action="stock-supplier-call">WhatsApp</button>
            <button class="kb atlas xs" data-action="stock-supplier-order">Nouvelle commande</button>
          </div>
        </div>
        <div class="sup-card">
          <div class="sup-head"><b>Boucherie Hassan Maarif</b><span class="chip ok">Actif</span></div>
          <div class="sup-meta">Viandes halal · livraison mardi · vendredi · samedi</div>
          <div class="sup-row"><span class="l">Contact</span><b class="mono">+212 5 22 47 81 03</b></div>
          <div class="sup-row"><span class="l">Délai moyen</span><b>24 h</b></div>
          <div class="sup-row"><span class="l">Volume mensuel</span><b class="mono">14 280 MAD</b></div>
          <div class="sup-acts">
            <button class="kb ghost xs" data-action="stock-supplier-call">WhatsApp</button>
            <button class="kb atlas xs" data-action="stock-supplier-order">Nouvelle commande</button>
          </div>
        </div>
        <div class="sup-card">
          <div class="sup-head"><b>Atelier Beldi</b><span class="chip ok">Actif</span></div>
          <div class="sup-meta">Épicerie sèche · épices · olives · safran de Taliouine</div>
          <div class="sup-row"><span class="l">Contact</span><b class="mono">+212 6 78 14 02 55</b></div>
          <div class="sup-row"><span class="l">Délai moyen</span><b>48 h</b></div>
          <div class="sup-row"><span class="l">Volume mensuel</span><b class="mono">3 940 MAD</b></div>
          <div class="sup-acts">
            <button class="kb ghost xs" data-action="stock-supplier-call">WhatsApp</button>
            <button class="kb atlas xs" data-action="stock-supplier-order">Nouvelle commande</button>
          </div>
        </div>
        <div class="sup-card">
          <div class="sup-head"><b>Coopérative Argan Essaouira</b><span class="chip ok">Actif</span></div>
          <div class="sup-meta">Huile d'argan vierge · livraison mensuelle · 12 femmes coopératrices</div>
          <div class="sup-row"><span class="l">Contact</span><b class="mono">+212 5 24 78 09 21</b></div>
          <div class="sup-row"><span class="l">Délai moyen</span><b>5 jours</b></div>
          <div class="sup-row"><span class="l">Volume mensuel</span><b class="mono">1 880 MAD</b></div>
          <div class="sup-acts">
            <button class="kb ghost xs" data-action="stock-supplier-call">WhatsApp</button>
            <button class="kb atlas xs" data-action="stock-supplier-order">Nouvelle commande</button>
          </div>
        </div>
        <div class="sup-card">
          <div class="sup-head"><b>Crémerie Aïcha</b><span class="chip ok">Actif</span></div>
          <div class="sup-meta">Beurre · lait · yaourt · livraison quotidienne 7 h</div>
          <div class="sup-row"><span class="l">Contact</span><b class="mono">+212 6 12 87 33 09</b></div>
          <div class="sup-row"><span class="l">Délai moyen</span><b>4 h</b></div>
          <div class="sup-row"><span class="l">Volume mensuel</span><b class="mono">2 640 MAD</b></div>
          <div class="sup-acts">
            <button class="kb ghost xs" data-action="stock-supplier-call">WhatsApp</button>
            <button class="kb atlas xs" data-action="stock-supplier-order">Nouvelle commande</button>
          </div>
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss>Fermer</button><button class="kb atlas" data-action="stock-supplier-add">+ Ajouter un fournisseur</button>`,
    });
  };
  handlers['stock-supplier-call'] = () => toast('WhatsApp ouvert', { type: 'info', desc: 'Conversation chargée avec l\'historique des 12 derniers échanges.' });
  handlers['stock-supplier-order'] = () => toast('Nouvelle commande', { type: 'info', desc: 'Sélectionnez les produits dans le catalogue du fournisseur.' });
  handlers['stock-supplier-add'] = () => toast('Ajouter un fournisseur', { type: 'info', desc: 'Saisissez nom · contact · catégorie. Validation en 24 h.' });
  handlers['stock-history'] = () => toast('Historique commandes', { type: 'info', desc: '47 commandes sur 30 jours · valeur totale 28 420 MAD.' });
})();

/* ═══ Section 2 boutique A · inventory / categories ═══ */
(function() {
  "use strict";
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const handlers = Kiwi.handlers;
  const drawer = Kiwi.drawer;
  const fullpage = Kiwi.fullpage;
  const modal = Kiwi.modal;
  const toast = Kiwi.toast;
  const menu = Kiwi.menu;
  const confetti = Kiwi.confetti;
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · BOUTIQUE vertical · Maison Mansour, Gueliz · S2 sidebar handlers
 *  - nav-inventory     · Inventaire produits (1040 wide, dense SKU grid)
 *  - nav-categories    · Catégories (920 wide, hierarchical tree + tags + toggles)
 * Auxiliary handlers route every button: toasts, modals, nested drawers,
 * filter-pill delegation, color-tag pickers, bulk-CSV, add/edit forms, archive
 * confirmations.
 * ─────────────────────────────────────────────────────────────────────────── */


/* ─── shared inline SVG icons ─── */
const _ICN = {
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
  scan:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2M7 8v8M11 8v8M15 8v8M19 8v8"/></svg>',
  upload: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
  plus:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  edit:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  copy:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  arch:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4"/></svg>',
  up:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 15l-6-6-6 6"/></svg>',
  down:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>',
  more:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>',
  trash:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
  merge:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3l4 4 4-4M12 7v8M5 21l7-7 7 7"/></svg>',
  eye:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>',
};

/* ─── French money formatter ─── */
const _mad = (n) => n.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0}).replace(/,/g, ' ');
const _mad2 = (n) => n.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/,/g, ' ').replace(/ /g, ' ');

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. nav-inventory · Inventaire produits
 *    1040-wide drawer · 4-up KPI strip · filter pills · 16 SKU cards in 3-col grid
 * ─────────────────────────────────────────────────────────────────────────── */
handlers['nav-inventory'] = () => {
  const skus = [
    { id: 'CFB-001', name: 'Caftan brodé main',          price: 1890, stock: 8,  cat: 'vetements',    catL: 'Vêtements', sup: 'Atelier Salé',                       sold: '12 avril', grad: ['#0B6E4F', '#053B2C'] },
    { id: 'TPB-014', name: 'Tapis berbère Beni Ourain',   price: 3200, stock: 3,  cat: 'decoration',   catL: 'Décoration', sup: 'Coopérative féminine Tighmert',     sold: '24 avril', grad: ['#8A6210', '#D99A2B'] },
    { id: 'BAB-022', name: 'Babouches en cuir naturel',   price: 450,  stock: 24, cat: 'vetements',    catL: 'Vêtements', sup: 'Atelier Salé',                       sold: '28 avril', grad: ['#7A4A1F', '#C28B5A'] },
    { id: 'THA-003', name: 'Théière argentée gravée',     price: 680,  stock: 12, cat: 'decoration',   catL: 'Décoration', sup: 'Souk des bijoutiers',               sold: '26 avril', grad: ['#4F5A60', '#A0AAB0'] },
    { id: 'COU-018', name: 'Coussin tissé sabra',         price: 240,  stock: 36, cat: 'decoration',   catL: 'Décoration', sup: 'Coopérative féminine Tighmert',     sold: '27 avril', grad: ['#053B2C', '#7DF2B0'] },
    { id: 'LMP-007', name: 'Lampe artisanale cuivre',     price: 920,  stock: 6,  cat: 'decoration',   catL: 'Décoration', sup: 'Atelier Salé',                       sold: '21 avril', grad: ['#B85C2C', '#E0A569'] },
    { id: 'BRA-031', name: 'Bracelet argent berbère',     price: 380,  stock: 22, cat: 'bijoux',       catL: 'Bijoux',    sup: 'Souk des bijoutiers',               sold: '28 avril', grad: ['#8B95A0', '#D5DDE3'] },
    { id: 'FOU-012', name: 'Foulard soie peint',          price: 520,  stock: 18, cat: 'vetements',    catL: 'Vêtements', sup: 'Atelier Salé',                       sold: '25 avril', grad: ['#9F2B3E', '#D67588'] },
    { id: 'PLT-009', name: 'Plat tagine peint Fès',       price: 190,  stock: 2,  cat: 'decoration',   catL: 'Décoration', sup: 'Coopérative féminine Tighmert',     sold: '23 avril', grad: ['#0B6E4F', '#56A883'] },
    { id: 'BUR-002', name: 'Burnous laine vierge',        price: 1240, stock: 4,  cat: 'vetements',    catL: 'Vêtements', sup: 'Atelier Salé',                       sold: '18 avril', grad: ['#3A2E20', '#7A6A55'] },
    { id: 'SAC-017', name: 'Sac cuir nubuck',             price: 820,  stock: 11, cat: 'vetements',    catL: 'Vêtements', sup: 'Atelier Salé',                       sold: '27 avril', grad: ['#5A3D26', '#A87B5D'] },
    { id: 'COA-005', name: 'Coffret huile d\'argan',      price: 320,  stock: 0,  cat: 'cosmetiques',  catL: 'Cosmétiques', sup: 'Coopérative argan Essaouira',     sold: '22 avril', grad: ['#D99A2B', '#F2D49B'] },
    { id: 'THA-021', name: 'Théière arabesque ciselée',   price: 560,  stock: 9,  cat: 'decoration',   catL: 'Décoration', sup: 'Souk des bijoutiers',               sold: '20 avril', grad: ['#5C5048', '#A89784'] },
    { id: 'PLA-013', name: 'Plateau cuivre martelé',      price: 440,  stock: 14, cat: 'decoration',   catL: 'Décoration', sup: 'Atelier Salé',                       sold: '24 avril', grad: ['#B85C2C', '#D99A2B'] },
    { id: 'PEN-026', name: 'Pendentif main de Fatma',     price: 290,  stock: 28, cat: 'bijoux',       catL: 'Bijoux',    sup: 'Souk des bijoutiers',               sold: '28 avril', grad: ['#8B95A0', '#C0CAD0'] },
    { id: 'COS-011', name: 'Cosmétique henné soin',       price: 140,  stock: 1,  cat: 'cosmetiques',  catL: 'Cosmétiques', sup: 'Coopérative argan Essaouira',     sold: '19 avril', grad: ['#5A3D26', '#9C7860'] },
  ];

  const totalVal = skus.reduce((s, x) => s + x.price * x.stock, 0);
  const ruptures = skus.filter(s => s.stock === 0).length;
  const lowStock = skus.filter(s => s.stock > 0 && s.stock <= 5).length;
  const activeSkus = skus.filter(s => s.stock > 0).length;

  drawer({
    title: 'Inventaire produits',
    subtitle: `Maison Mansour · Gueliz · ${skus.length} SKUs suivis · stock vivant`,
    width: 1040,
    body: `
      <div class="kx-kpi-strip">
        <div class="kx-kpi"><div class="l">SKUs ACTIFS</div><div class="v">${activeSkus}<span class="u">/ ${skus.length}</span></div><div class="d">${ruptures} en rupture</div></div>
        <div class="kx-kpi"><div class="l">VALEUR DE STOCK</div><div class="v">${_mad(totalVal)}<span class="u">MAD</span></div><div class="d">Coût · prix de vente</div></div>
        <div class="kx-kpi ${lowStock ? 'warn' : ''}"><div class="l">STOCK BAS / RUPTURES</div><div class="v">${lowStock}<span class="u">+ ${ruptures}</span></div><div class="d">Seuil ≤ 5 unités</div></div>
        <div class="kx-kpi"><div class="l">PROCHAINE LIVRAISON</div><div class="v">5<span class="u">jours</span></div><div class="d">Atelier Salé · 12 ref</div></div>
      </div>

      <div class="p-toolbar" style="margin-top: 4px;">
        <div class="p-search">${_ICN.search}<span style="margin-left:6px;">Rechercher SKU, nom, fournisseur…</span></div>
        <button class="kb ghost" data-action="bout-scan">${_ICN.scan}Scanner</button>
        <button class="kb ghost" data-action="bout-import-csv">${_ICN.upload}Importer CSV</button>
        <button class="kb primary" data-action="bout-add-sku">${_ICN.plus}Nouveau SKU</button>
      </div>

      <div class="kx-pills" data-pill-group="bout-cat">
        <button class="kx-pill on" data-pill="all">Tous <span class="ct">${skus.length}</span></button>
        <button class="kx-pill" data-pill="vetements">Vêtements <span class="ct">${skus.filter(s=>s.cat==='vetements').length}</span></button>
        <button class="kx-pill" data-pill="decoration">Décoration <span class="ct">${skus.filter(s=>s.cat==='decoration').length}</span></button>
        <button class="kx-pill" data-pill="bijoux">Bijoux <span class="ct">${skus.filter(s=>s.cat==='bijoux').length}</span></button>
        <button class="kx-pill" data-pill="cosmetiques">Cosmétiques <span class="ct">${skus.filter(s=>s.cat==='cosmetiques').length}</span></button>
      </div>

      <div class="kx-sku-grid">
        ${skus.map(s => {
          const isOut = s.stock === 0;
          const isLow = !isOut && s.stock <= 5;
          const stockClass = isOut ? 'out' : isLow ? 'low' : '';
          const stockChip = isOut ? '<span class="chip ref">Rupture</span>' : isLow ? '<span class="chip pend">Stock bas</span>' : '';
          return `
            <div class="kx-sku" data-sku="${s.id}" data-cat="${s.cat}">
              <div class="kx-sku-img" style="background: linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]});">
                <div class="kx-sku-img-tag">${s.cat.charAt(0).toUpperCase()}</div>
              </div>
              <div class="kx-sku-body">
                <div class="kx-sku-head">
                  <div class="n">${s.name}</div>
                  <span class="chip neutral">${s.catL}</span>
                </div>
                <div class="kx-sku-sku mono">${s.id}</div>
                <div class="kx-sku-row">
                  <div class="kx-sku-price mono">${_mad(s.price)} MAD</div>
                  <div class="kx-sku-stock ${stockClass} mono">${s.stock} en stock</div>
                </div>
                <div class="kx-sku-meta">
                  <span>${s.sup}</span>
                  <span class="dot"></span>
                  <span>Vendu ${s.sold}</span>
                  ${stockChip}
                </div>
                <div class="kx-sku-actions">
                  <button class="kb ghost xs" data-action="bout-sku-edit" data-arg="${s.id}">${_ICN.edit}Modifier</button>
                  <button class="kb ghost xs" data-action="bout-sku-dup" data-arg="${s.id}">${_ICN.copy}Dupliquer</button>
                  <button class="kb ghost xs danger-text" data-action="bout-sku-archive" data-arg="${s.id}">${_ICN.arch}Archiver</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="kx-foot-hint">
        <div class="lh">Astuce</div>
        <div class="rh">Cliquez un SKU pour voir l'historique de vente, les variantes, le coût d'acquisition et le marge brute.</div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss style="margin-right:auto;">Fermer</button>
      <button class="kb ghost" data-action="bout-export-inv">${_ICN.upload}Exporter inventaire</button>
      <button class="kb atlas" data-action="bout-reorder">Bon de commande groupé</button>
    `,
  }).el.querySelector('.kiwi-drawer').classList.add('page-xl');

  /* ─── filter-pill delegation, mounted after drawer is in DOM ─── */
  setTimeout(() => {
    const root = document.querySelector('.kiwi-drawer');
    if (!root) return;
    const pills = root.querySelectorAll('.kx-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(x => x.classList.remove('on'));
        p.classList.add('on');
        const target = p.dataset.pill;
        root.querySelectorAll('.kx-sku').forEach(c => {
          c.style.display = (target === 'all' || c.dataset.cat === target) ? '' : 'none';
        });
      });
    });
    /* clicking the card itself opens the SKU detail */
    root.querySelectorAll('.kx-sku').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const sku = skus.find(s => s.id === card.dataset.sku);
        if (sku) _openSkuDetail(sku);
      });
    });
  }, 0);
};

/* ─── SKU detail nested drawer ─── */
function _openSkuDetail(s) {
  const margin = Math.round(s.price * 0.42);
  const cost   = s.price - margin;
  drawer({
    title: s.name,
    subtitle: `${s.id} · ${s.catL} · ${s.sup}`,
    width: 540,
    body: `
      <div class="kx-sku-img" style="height:120px; border-radius:14px; background: linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]}); margin-bottom:16px;"></div>
      <div class="kx-stat-3">
        <div class="stat"><div class="l">PRIX VENTE</div><div class="v">${_mad(s.price)} MAD</div><div class="sub">TVA 20 % incl.</div></div>
        <div class="stat"><div class="l">COÛT D'ACHAT</div><div class="v">${_mad(cost)} MAD</div><div class="sub">Marge ${Math.round(margin/s.price*100)} %</div></div>
        <div class="stat"><div class="l">EN STOCK</div><div class="v">${s.stock}</div><div class="sub">Seuil bas : 5</div></div>
      </div>
      <dl class="kx-kv">
        <dt>SKU interne</dt><dd>${s.id}</dd>
        <dt>Catégorie</dt><dd>${s.catL}</dd>
        <dt>Fournisseur</dt><dd>${s.sup}</dd>
        <dt>Dernière vente</dt><dd>${s.sold}</dd>
        <dt>Vendus 30 j</dt><dd>${Math.max(2, Math.round(40 / Math.max(1,s.stock)))}</dd>
        <dt>Réappro suggérée</dt><dd>${s.stock <= 5 ? 'Maintenant' : '15-21 jours'}</dd>
      </dl>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Fermer</button>
      <button class="kb ghost" data-action="bout-sku-history" data-arg="${s.id}">Historique ventes</button>
      <button class="kb atlas" data-action="bout-sku-edit" data-arg="${s.id}">${_ICN.edit}Modifier le SKU</button>
    `,
  });
}

/* ─── inventory action handlers ─── */
handlers['bout-scan'] = () => {
  toast('Scanner activé', { desc: 'Pointez un code-barres avec votre Kiwi Tap (caméra arrière). Détection auto.', type: 'info', duration: 3000 });
};

handlers['bout-import-csv'] = () => {
  modal({
    title: 'Importer un catalogue CSV',
    tag: 'BULK · 1 000 SKUs / fichier',
    desc: 'Téléchargez le modèle, remplissez vos références, glissez le fichier ici.',
    width: 560,
    body: `
      <div class="kx-csv-drop">
        ${_ICN.upload}
        <div class="t">Glissez votre fichier .csv ici</div>
        <div class="m">ou cliquez pour parcourir · max 5 MB · UTF-8</div>
      </div>
      <div class="kx-csv-cols">
        <div class="kx-csv-col"><div class="l">Colonnes attendues</div><ul><li>nom</li><li>sku_code</li><li>categorie</li><li>prix_mad</li><li>stock_initial</li><li>fournisseur</li></ul></div>
        <div class="kx-csv-col"><div class="l">Détecté automatiquement</div><ul><li>encodage UTF-8 / latin-1</li><li>séparateur , ; \\t</li><li>doublons par SKU code</li></ul></div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-action="bout-csv-template">Télécharger le modèle</button>
      <button class="kb atlas" data-action="bout-csv-confirm">Démarrer l'import</button>
    `,
  });
};

handlers['bout-csv-template'] = () => {
  toast('Modèle CSV téléchargé', { desc: 'kiwi-inventory-template.csv · 6 colonnes, 1 ligne d\'exemple.', type: 'success' });
};

handlers['bout-csv-confirm'] = () => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Import démarré', { desc: '247 lignes en cours · vous serez notifié à la fin.', type: 'info' }), 300);
};

handlers['bout-add-sku'] = () => {
  modal({
    title: 'Nouveau SKU',
    tag: 'INVENTAIRE · MAISON MANSOUR',
    desc: 'Renseignez les informations produit. Le code SKU est généré automatiquement.',
    width: 560,
    body: `
      <div class="kf-group">
        <label class="kf-label">Nom du produit</label>
        <input class="kf-input" placeholder="Caftan brodé main · taille S" />
      </div>
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Catégorie</label>
          <select class="kf-input"><option>Vêtements traditionnels</option><option>Décoration</option><option>Bijoux</option><option>Cosmétiques</option></select>
        </div>
        <div class="kf-group"><label class="kf-label">Sous-catégorie</label>
          <select class="kf-input"><option>Caftans</option><option>Djellabas</option><option>Babouches</option></select>
        </div>
      </div>
      <div class="kf-row">
        <div class="kf-group"><label class="kf-label">Prix vente (MAD)</label>
          <input class="kf-input" placeholder="1 890" /></div>
        <div class="kf-group"><label class="kf-label">Stock initial</label>
          <input class="kf-input" placeholder="8" /></div>
      </div>
      <div class="kf-group">
        <label class="kf-label">Fournisseur</label>
        <select class="kf-input"><option>Atelier Salé (Salé)</option><option>Coopérative féminine Tighmert (Guelmim)</option><option>Souk des bijoutiers (Marrakech)</option><option>Coopérative argan Essaouira</option></select>
      </div>
      <div class="kf-group">
        <label class="kf-label">Code SKU (auto)</label>
        <input class="kf-input mono" value="CFB-${Math.floor(Math.random()*900+100)}" disabled style="background: var(--paper-soft); color: var(--n-500);" />
        <div class="kf-help">Généré à partir de la catégorie. Vous pourrez le modifier après création.</div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-action="bout-add-sku-confirm">Créer le SKU</button>
    `,
  });
};

handlers['bout-add-sku-confirm'] = () => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('SKU créé', { desc: 'Le produit est en ligne. Stock initial enregistré, fournisseur lié.', type: 'success' }), 250);
};

handlers['bout-sku-edit'] = (_, arg) => {
  toast('Édition du SKU', { desc: `Ouverture du formulaire d'édition · ${arg || 'SKU'}`, type: 'info' });
};

handlers['bout-sku-dup'] = (_, arg) => {
  toast('SKU dupliqué', { desc: `Une copie de ${arg || 'ce SKU'} est créée avec un stock à 0. Modifiez avant publication.`, type: 'success' });
};

handlers['bout-sku-archive'] = (_, arg) => {
  modal({
    title: 'Archiver ce SKU ?',
    desc: `Le produit ${arg || ''} sera retiré de la boutique mais conservé pour l'historique. Vous pourrez le restaurer plus tard.`,
    width: 460,
    body: `
      <div class="kx-warn-box">
        <div class="hd">Conséquences</div>
        <ul>
          <li>Le SKU disparaît du POS et de la boutique en ligne.</li>
          <li>Les données de vente restent disponibles dans les rapports.</li>
          <li>Les variantes et photos sont conservées 12 mois.</li>
        </ul>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb danger" data-action="bout-sku-archive-confirm" data-arg="${arg || ''}">${_ICN.arch}Archiver le SKU</button>
    `,
  });
};

handlers['bout-sku-archive-confirm'] = (_, arg) => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('SKU archivé', { desc: `${arg || 'Le produit'} n'est plus visible en boutique. Restaurez-le depuis Archives.`, type: 'warn' }), 250);
};

handlers['bout-sku-history'] = (_, arg) => {
  toast('Historique des ventes', { desc: `${arg || 'SKU'} · 142 unités vendues sur 90 jours · panier moyen 1 240 MAD`, type: 'info' });
};

handlers['bout-export-inv'] = () => {
  toast('Export en cours', { desc: 'Inventaire complet · format Excel · vous recevrez un email d\'ici 2 minutes.', type: 'info' });
};

handlers['bout-reorder'] = () => {
  modal({
    title: 'Bon de commande groupé',
    tag: 'RÉAPPRO · 4 FOURNISSEURS',
    desc: 'Kiwi suggère un bon de commande basé sur les seuils de stock et la vélocité des ventes.',
    width: 560,
    body: `
      <div class="kx-reorder-row"><b>Atelier Salé</b><div class="m">12 références · livraison 5 j</div><span class="mono">14 280 MAD</span></div>
      <div class="kx-reorder-row"><b>Coopérative féminine Tighmert</b><div class="m">8 références · livraison 8 j</div><span class="mono">9 640 MAD</span></div>
      <div class="kx-reorder-row"><b>Souk des bijoutiers</b><div class="m">6 références · livraison 3 j</div><span class="mono">5 820 MAD</span></div>
      <div class="kx-reorder-row"><b>Coopérative argan Essaouira</b><div class="m">2 références · livraison 4 j</div><span class="mono">2 240 MAD</span></div>
      <div class="kx-reorder-total"><span>Total bon de commande</span><b class="mono">31 980 MAD</b></div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-action="bout-reorder-send">Envoyer aux fournisseurs</button>
    `,
  });
};

handlers['bout-reorder-send'] = () => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Bons de commande envoyés', { desc: '4 fournisseurs notifiés par email · accusé de réception sous 24h.', type: 'success' }), 250);
};


/* ═══════════════════════════════════════════════════════════════════════════
 * 2. nav-categories · Catégories
 *    920-wide drawer · hierarchical tree · color tags · iOS toggles · reorder
 * ─────────────────────────────────────────────────────────────────────────── */
handlers['nav-categories'] = () => {
  /* color palette: 6 brand-safe tags */
  const palette = [
    { id: 'atlas',  hex: '#0B6E4F', name: 'Atlas' },
    { id: 'riad',   hex: '#053B2C', name: 'Riad' },
    { id: 'mint',   hex: '#7DF2B0', name: 'Menthe' },
    { id: 'warn',   hex: '#D99A2B', name: 'Safran' },
    { id: 'danger', hex: '#9B2F22', name: 'Carmin' },
    { id: 'info',   hex: '#3D6B8C', name: 'Indigo' },
  ];

  const tree = [
    { name: 'Vêtements traditionnels', count: 42, val: 64320, tag: 'atlas',  hidden: false, kids: [
        { name: 'Caftans',                  count: 18, val: 33420, tag: 'atlas' },
        { name: 'Djellabas',                count: 14, val: 22840, tag: 'atlas' },
        { name: 'Babouches',                count: 10, val: 8060,  tag: 'mint' },
    ]},
    { name: 'Décoration',              count: 78, val: 142680, tag: 'warn', hidden: false, kids: [
        { name: 'Tapis berbères',           count: 11, val: 38400, tag: 'warn' },
        { name: 'Théières & arts de table', count: 22, val: 24680, tag: 'warn' },
        { name: 'Coussins & textiles',      count: 28, val: 12240, tag: 'mint' },
        { name: 'Lampes',                   count: 17, val: 18920, tag: 'warn' },
    ]},
    { name: 'Bijoux',                  count: 56, val: 32480, tag: 'riad', hidden: false, kids: [
        { name: 'Argent berbère',           count: 38, val: 22120, tag: 'riad' },
        { name: 'Pierres semi-précieuses',  count: 18, val: 10360, tag: 'info' },
    ]},
    { name: 'Cosmétiques',             count: 24, val: 9840, tag: 'mint', hidden: true, kids: [
        { name: 'Argan',                    count: 14, val: 6720,  tag: 'mint' },
        { name: 'Henné & savons',           count: 10, val: 3120,  tag: 'mint' },
    ]},
  ];

  const _swatches = (active) => palette.map(p => `<button class="kx-swatch ${p.id === active ? 'on' : ''}" data-action="bout-cat-tag" data-tone="${p.id}" style="background: ${p.hex};" title="${p.name}"></button>`).join('');

  const totalRoots = tree.length;
  const totalSubs = tree.reduce((s, t) => s + t.kids.length, 0);
  const totalItems = tree.reduce((s, t) => s + t.count, 0);
  const totalVal = tree.reduce((s, t) => s + t.val, 0);

  drawer({
    title: 'Catégories',
    subtitle: `${totalRoots} racines · ${totalSubs} sous-catégories · ${totalItems} produits référencés`,
    width: 920,
    body: `
      <div class="kx-kpi-strip cols-3">
        <div class="kx-kpi"><div class="l">CATÉGORIES TOTALES</div><div class="v">${totalRoots + totalSubs}</div><div class="d">${totalRoots} racines · ${totalSubs} enfants</div></div>
        <div class="kx-kpi"><div class="l">PRODUITS RÉFÉRENCÉS</div><div class="v">${totalItems}</div><div class="d">Tous SKUs catégorisés</div></div>
        <div class="kx-kpi"><div class="l">VALEUR DE STOCK</div><div class="v">${_mad(totalVal)}<span class="u">MAD</span></div><div class="d">Toutes catégories</div></div>
      </div>

      <div class="p-toolbar" style="margin-top: 4px;">
        <div class="p-search">${_ICN.search}<span style="margin-left:6px;">Filtrer une catégorie…</span></div>
        <button class="kb ghost" data-action="bout-cat-restruct">Restructurer</button>
        <button class="kb primary" data-action="bout-cat-add">${_ICN.plus}Ajouter une catégorie</button>
      </div>

      <div class="kx-tree">
        ${tree.map((root, ri) => `
          <div class="kx-tree-root" data-root="${ri}">
            <div class="kx-tree-line lv-0">
              <div class="kx-tree-handle">${_ICN.up}${_ICN.down}</div>
              <div class="kx-tree-bar" style="background: ${palette.find(p=>p.id===root.tag).hex};"></div>
              <div class="kx-tree-info">
                <div class="n">${root.name}</div>
                <div class="m">${root.count} produits · ${_mad(root.val)} MAD de stock · ${root.kids.length} sous-catégories</div>
              </div>
              <div class="kx-tree-tags">
                <div class="kx-swatches">${_swatches(root.tag)}</div>
              </div>
              <div class="kx-tree-toggle">
                <button class="kx-ios ${root.hidden ? '' : 'on'}" data-action="bout-cat-hide" data-arg="${root.name}" title="Masquer en boutique"><i></i></button>
                <span class="kx-toggle-l">${root.hidden ? 'Masqué' : 'En boutique'}</span>
              </div>
              <div class="kx-tree-actions">
                <button class="kb ghost xs" data-action="bout-cat-edit" data-arg="${root.name}">${_ICN.edit}</button>
                <button class="kb ghost xs" data-action="bout-cat-merge" data-arg="${root.name}">${_ICN.merge}</button>
                <button class="kb ghost xs danger-text" data-action="bout-cat-del" data-arg="${root.name}">${_ICN.trash}</button>
              </div>
            </div>
            ${root.kids.map((kid, ki) => `
              <div class="kx-tree-line lv-1" data-kid="${ki}">
                <div class="kx-tree-handle">${_ICN.up}${_ICN.down}</div>
                <div class="kx-tree-bar" style="background: ${palette.find(p=>p.id===kid.tag).hex};"></div>
                <div class="kx-tree-info">
                  <div class="n">${kid.name}</div>
                  <div class="m">${kid.count} produits · ${_mad(kid.val)} MAD · sous ${root.name}</div>
                </div>
                <div class="kx-tree-tags">
                  <div class="kx-swatches">${_swatches(kid.tag)}</div>
                </div>
                <div class="kx-tree-toggle">
                  <button class="kx-ios on" data-action="bout-cat-hide" data-arg="${kid.name}" title="Masquer en boutique"><i></i></button>
                  <span class="kx-toggle-l">En boutique</span>
                </div>
                <div class="kx-tree-actions">
                  <button class="kb ghost xs" data-action="bout-cat-edit" data-arg="${kid.name}">${_ICN.edit}</button>
                  <button class="kb ghost xs" data-action="bout-cat-merge" data-arg="${kid.name}">${_ICN.merge}</button>
                  <button class="kb ghost xs danger-text" data-action="bout-cat-del" data-arg="${kid.name}">${_ICN.trash}</button>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <div class="kx-foot-hint">
        <div class="lh">Conseil</div>
        <div class="rh">Utilisez les couleurs pour grouper visuellement les rayons (ex. atlas pour traditionnel, safran pour décoration). Les couleurs apparaissent au POS et sur la boutique en ligne.</div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss style="margin-right: auto;">Fermer</button>
      <button class="kb ghost" data-action="bout-cat-export">Exporter arborescence</button>
      <button class="kb atlas" data-action="bout-cat-publish">Publier les changements</button>
    `,
  }).el.querySelector('.kiwi-drawer').classList.add('page-xl');

  /* ─── interactions: swatches toggle, iOS toggle, reorder buttons ─── */
  setTimeout(() => {
    const root = document.querySelector('.kiwi-drawer');
    if (!root) return;

    /* swatch picker — toggle 'on' inside its group */
    root.querySelectorAll('.kx-swatches').forEach(group => {
      group.querySelectorAll('.kx-swatch').forEach(sw => {
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          group.querySelectorAll('.kx-swatch').forEach(x => x.classList.remove('on'));
          sw.classList.add('on');
          const bar = sw.closest('.kx-tree-line').querySelector('.kx-tree-bar');
          if (bar) bar.style.background = sw.style.background;
          toast('Couleur mise à jour', { desc: 'La nouvelle teinte sera appliquée à la prochaine publication.', type: 'success', duration: 2000 });
        });
      });
    });

    /* iOS toggle for hide/show */
    root.querySelectorAll('.kx-ios').forEach(t => {
      t.addEventListener('click', (e) => {
        e.stopPropagation();
        t.classList.toggle('on');
        const lab = t.parentElement.querySelector('.kx-toggle-l');
        if (lab) lab.textContent = t.classList.contains('on') ? 'En boutique' : 'Masqué';
      });
    });

    /* reorder up/down — visually move the row */
    root.querySelectorAll('.kx-tree-handle').forEach(h => {
      const upBtn = h.querySelectorAll('svg')[0];
      const dnBtn = h.querySelectorAll('svg')[1];
      [upBtn, dnBtn].forEach((btn, idx) => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const line = btn.closest('.kx-tree-line');
          if (!line) return;
          const sibling = idx === 0 ? line.previousElementSibling : line.nextElementSibling;
          if (sibling && sibling.classList.contains('kx-tree-line')) {
            if (idx === 0) line.parentNode.insertBefore(line, sibling);
            else line.parentNode.insertBefore(sibling, line);
            toast('Ordre mis à jour', { desc: 'Le nouvel ordre est sauvegardé pour le POS et la boutique.', type: 'success', duration: 1800 });
          }
        });
      });
    });
  }, 0);
};

/* ─── category action handlers ─── */
handlers['bout-cat-add'] = () => {
  modal({
    title: 'Ajouter une catégorie',
    tag: 'ARBORESCENCE',
    desc: 'Créez une catégorie racine ou rattachez-la à une catégorie existante.',
    width: 520,
    body: `
      <div class="kf-group">
        <label class="kf-label">Nom de la catégorie</label>
        <input class="kf-input" placeholder="Caftans de mariée" />
      </div>
      <div class="kf-group">
        <label class="kf-label">Parent (optionnel)</label>
        <select class="kf-input"><option>— Aucune (racine)</option><option>Vêtements traditionnels</option><option>Décoration</option><option>Bijoux</option><option>Cosmétiques</option></select>
      </div>
      <div class="kf-group">
        <label class="kf-label">Couleur de tag</label>
        <div class="kx-swatches">
          <button class="kx-swatch on" style="background:#0B6E4F;"></button>
          <button class="kx-swatch" style="background:#053B2C;"></button>
          <button class="kx-swatch" style="background:#7DF2B0;"></button>
          <button class="kx-swatch" style="background:#D99A2B;"></button>
          <button class="kx-swatch" style="background:#9B2F22;"></button>
          <button class="kx-swatch" style="background:#3D6B8C;"></button>
        </div>
      </div>
      <div class="kf-group">
        <label class="kf-label">Visibilité boutique en ligne</label>
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="kx-ios on" data-action="bout-cat-vis-toggle"><i></i></button>
          <span style="font-size:13px;">Visible en boutique dès la création</span>
        </div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-action="bout-cat-add-confirm">Créer la catégorie</button>
    `,
  });
};

handlers['bout-cat-vis-toggle'] = () => {
  const t = event.currentTarget;
  if (t) t.classList.toggle('on');
};

handlers['bout-cat-add-confirm'] = () => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Catégorie créée', { desc: 'Vous pouvez maintenant rattacher des SKUs depuis l\'inventaire.', type: 'success' }), 250);
};

handlers['bout-cat-edit'] = (_, arg) => {
  toast(`Édition · ${arg || 'catégorie'}`, { desc: 'Renommer, changer le parent, ajuster la couleur ou l\'icône.', type: 'info' });
};

handlers['bout-cat-merge'] = (_, arg) => {
  modal({
    title: 'Fusionner cette catégorie',
    desc: `Tous les produits de "${arg}" seront déplacés vers la catégorie cible. L'opération est réversible pendant 30 jours.`,
    width: 480,
    body: `
      <div class="kf-group">
        <label class="kf-label">Catégorie cible</label>
        <select class="kf-input"><option>Vêtements traditionnels</option><option>Décoration</option><option>Bijoux</option><option>Cosmétiques</option></select>
      </div>
      <div class="kx-warn-box info">
        <div class="hd">Aperçu de la fusion</div>
        <ul>
          <li>Les SKUs de "${arg}" recevront la couleur cible.</li>
          <li>Les pages boutique de "${arg}" redirigeront pendant 6 mois.</li>
          <li>Les rapports historiques restent disjoints.</li>
        </ul>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb atlas" data-action="bout-cat-merge-confirm" data-arg="${arg || ''}">Fusionner</button>
    `,
  });
};

handlers['bout-cat-merge-confirm'] = (_, arg) => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Catégorie fusionnée', { desc: `${arg || 'Catégorie'} déplacée. Annulez sous 30 jours depuis Archives.`, type: 'success' }), 250);
};

handlers['bout-cat-del'] = (_, arg) => {
  modal({
    title: 'Supprimer cette catégorie ?',
    desc: `"${arg}" sera supprimée définitivement. Les produits qu'elle contient devront être recatégorisés.`,
    width: 460,
    body: `
      <div class="kx-warn-box danger">
        <div class="hd">Action irréversible</div>
        <ul>
          <li>Les produits associés perdent leur catégorie (à recatégoriser).</li>
          <li>L'ordre de l'arborescence est ré-équilibré automatiquement.</li>
          <li>Les rapports historiques restent disponibles 24 mois.</li>
        </ul>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb danger" data-action="bout-cat-del-confirm" data-arg="${arg || ''}">${_ICN.trash}Supprimer définitivement</button>
    `,
  });
};

handlers['bout-cat-del-confirm'] = (_, arg) => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Catégorie supprimée', { desc: `${arg || 'Catégorie'} supprimée · ${Math.floor(Math.random()*30+5)} produits à recatégoriser.`, type: 'warn' }), 250);
};

handlers['bout-cat-hide'] = (_, arg) => {
  toast(`Visibilité mise à jour`, { desc: `${arg || 'Catégorie'} · sera publié à la prochaine synchronisation boutique.`, type: 'info', duration: 2200 });
};

handlers['bout-cat-restruct'] = () => {
  modal({
    title: 'Restructurer l\'arborescence',
    tag: 'AVANT / APRÈS',
    desc: 'Kiwi propose une arborescence optimisée selon les ventes et la saisonnalité.',
    width: 720,
    body: `
      <div class="kx-restruct-grid">
        <div class="kx-restruct-col">
          <div class="hd">Actuelle</div>
          <ul>
            <li><b>Vêtements traditionnels</b> · Caftans, Djellabas, Babouches</li>
            <li><b>Décoration</b> · Tapis, Théières, Coussins, Lampes</li>
            <li><b>Bijoux</b> · Argent berbère, Pierres</li>
            <li><b>Cosmétiques</b> · Argan, Henné</li>
          </ul>
        </div>
        <div class="kx-restruct-col atlas">
          <div class="hd">Proposée par Kiwi</div>
          <ul>
            <li><b>Tenues d'apparat</b> · Caftans (mariée / soirée), Djellabas, Burnous</li>
            <li><b>Accessoires & souks</b> · Babouches, Sacs, Foulards, Bijoux argent</li>
            <li><b>Maison Mansour</b> · Tapis, Théières, Coussins, Lampes, Plats</li>
            <li><b>Soins authentiques</b> · Argan, Henné, Savons</li>
          </ul>
        </div>
      </div>
      <div class="kx-restruct-foot">
        <div class="m">Basée sur 12 mois de données : taux de conversion, panier moyen, retours clients touristes.</div>
      </div>
    `,
    foot: `
      <button class="kb ghost" data-dismiss>Annuler</button>
      <button class="kb ghost" data-action="bout-cat-restruct-preview">Aperçu boutique</button>
      <button class="kb atlas" data-action="bout-cat-restruct-apply">Appliquer · réversible 30 j</button>
    `,
  });
};

handlers['bout-cat-restruct-preview'] = () => {
  toast('Aperçu boutique', { desc: 'Ouverture du brouillon dans un nouvel onglet · aucune modification publiée.', type: 'info' });
};

handlers['bout-cat-restruct-apply'] = () => {
  document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
  setTimeout(() => toast('Arborescence restructurée', { desc: '4 catégories réorganisées · 220 SKUs replacés · réversible pendant 30 jours.', type: 'success' }), 250);
};

handlers['bout-cat-tag'] = () => { /* handled inline by swatch click — no-op fallback */ };

handlers['bout-cat-export'] = () => {
  toast('Export arborescence', { desc: 'Format JSON + CSV plat · email envoyé sous 1 minute.', type: 'info' });
};

handlers['bout-cat-publish'] = () => {
  toast('Changements publiés', { desc: 'POS Kiwi + boutique en ligne synchronisés · cache CDN purgé.', type: 'success' });
};
})();

/* ═══ Section 2 boutique B · promos / returns ═══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Boutique vertical — sidebar handlers (set B)
 * ─────────────────────────────────────────────────────────────────────────── *
 *
 * Two production-grade sidebar handlers wired to the merchant dashboard click
 * delegation router (`Kiwi.handlers[name]`). Designed for the Maison Mansour
 * Gueliz boutique persona.
 *
 *   · `nav-promos`   · Promotions & offres (drawer width 1040)
 *   · `nav-returns`  · Retours & échanges  (drawer width  980)
 *
 * Plus a handful of auxiliary action handlers wired through `data-action`:
 *   · `promo-pause`           · `promo-end`         · `promo-edit`
 *   · `promo-segment`         · `promo-schedule`    · `promo-archive-detail`
 *   · `ret-detail`            · `ret-approve`       · `ret-refuse`
 *   · `ret-exchange`          · `ret-block`         · `ret-policy-save`
 *   · `ret-refund-original`   · `ret-refund-credit` · `ret-refund-whatsapp`
 *
 * Paired CSS lives in `/tmp/kiwi-s2-boutique-spa-css.css` (`.b-promo-*`,
 * `.b-ret-*`, `.kx-toggle`, `.p-grid-*`).
 *
 * Conventions
 *  · Brand only: var(--atlas) / --riad / --mint / --paper-soft.
 *  · French numbers ("1 245,50 MAD"), JetBrains Mono for tabular numerals.
 *  · No emojis in titles or CTAs (per CLAUDE.md §3).
 *  · No new accents — semantic states reuse --success / --warning / --danger.
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (!window.Kiwi) return;
  const { toast, modal, drawer, handlers } = window.Kiwi;

  /* ═══════════════════ Inline SVG icon set ═══════════════════ */
  const SVG = {
    discount: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    code:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    bundle:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    tax:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    bell:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    plus:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    pause:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    edit:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    stop:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
    chev:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    box:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>',
    block:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    check:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x:        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    swap:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
    wa:       '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
    coin:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9.5c0-1.5 1.5-2 3-2s3 .5 3 2-1 1.8-3 2.5-3 1-3 2.5 1.5 2 3 2 3-.5 3-2"/></svg>',
    flag:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    cal:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  };

  /* ═══════════════════ Number formatters ═══════════════════ */
  const fmtMAD = (n, dec = 2) => n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ | /g, ' ');
  const fmtInt = (n) => n.toLocaleString('fr-FR').replace(/ | /g, ' ');

  /* ═══════════════════ NAV-PROMOS ═══════════════════════════════════════════
   * Promotions & offres pour Maison Mansour Gueliz.
   * Width 1040 — wide-format drawer with active campaigns table, segment chips,
   * KPI summary, schedule wizard CTA and past campaigns archive.
   * ─────────────────────────────────────────────────────────────────────────── */
  handlers['nav-promos'] = () => {
    const active = [
      { id: 'P-2811', name: 'Soldes d\'été −30 %',           type: 'discount', kind: '−30 %',     value: '−30 %',         redem: 312, uplift: '+18,4 %', aov: '+9 %',  expiry: '12 j',   live: true },
      { id: 'P-2812', name: 'Code MAROC10',                  type: 'code',     kind: 'Code',       value: '−10 %',         redem:  87, uplift: '+11,2 %', aov: '+4 %',  expiry: '21 j',   live: true },
      { id: 'P-2813', name: 'Lot 3-pour-2 babouches',        type: 'bundle',   kind: 'Lot',        value: '3 pour 2',      redem:  46, uplift: '+22,8 %', aov: '+31 %', expiry: '6 j',    live: true },
      { id: 'P-2814', name: 'Tax-free Touristes UE',         type: 'tax',      kind: 'Segment',    value: 'TVA −20 %',     redem: 184, uplift: '+34,1 %', aov: '+24 %', expiry: 'Permanent', live: true },
      { id: 'P-2815', name: 'Black Friday avant-première',   type: 'discount', kind: '−25 %',     value: '−25 %',         redem:   0, uplift: '—', aov: '—',     expiry: 'J−18',   scheduled: true },
    ];

    const segments = [
      { id: 'all',     n: 'Tous',                count: '4 102', on: true  },
      { id: 'eu',      n: 'Touristes UE',        count: '892',   on: true  },
      { id: 'us',      n: 'Touristes US',        count: '316',   on: false },
      { id: 'dia',     n: 'Diaspora FR / ES',     count: '244',   on: false },
      { id: 'loyal',   n: 'Clients fidèles',     count: '198',   on: true  },
      { id: 'never',   n: 'Jamais venus',        count: '2 452', on: false },
    ];

    const archive = [
      { name: 'Aïd Adha −20 %',           period: 'Juin 2025',     redem: 421, uplift: '+27,6 %', revenue: '184 320 MAD', verdict: 'Réussite' },
      { name: 'Tax-free Tourists 2025',   period: 'Été 2025',      redem: 612, uplift: '+38,9 %', revenue: '298 470 MAD', verdict: 'Excellent' },
      { name: 'Pre-Ramadan Special',      period: 'Mars 2025',     redem: 188, uplift: '+8,4 %',  revenue: ' 62 940 MAD', verdict: 'Tiède' },
      { name: 'Code DIASPORA12',          period: 'Déc 2024',      redem: 109, uplift: '+14,2 %', revenue: ' 48 105 MAD', verdict: 'Réussite' },
    ];

    const totalRedem = active.reduce((a, c) => a + c.redem, 0);
    const totalUplift = 47820;

    drawer({
      title: 'Promotions & offres',
      subtitle: 'Maison Mansour · Gueliz · 4 campagnes en direct · 1 planifiée',
      width: 1040,
      body: `
        <div class="p-hero" style="background: linear-gradient(135deg, var(--riad), var(--atlas));">
          <div class="l">UPLIFT REVENUE · CAMPAGNES ACTIVES</div>
          <div class="big">+${fmtInt(totalUplift)} <span style="font-size:18px; opacity:0.7;">MAD</span></div>
          <div class="sub">${fmtInt(totalRedem)} échanges aujourd'hui · ${active.filter(a => a.live).length} promos en cours · Tax-free Touristes UE = top performer</div>
        </div>

        <div class="p-grid-3" style="margin-bottom: 18px;">
          <div class="p-card" style="margin-bottom: 0;">
            <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase;">UPLIFT TOTAL</div>
            <div style="font-size: 26px; font-weight: 600; font-family: var(--mono); font-feature-settings: 'tnum' 1; margin-top: 4px; letter-spacing: -0.02em;">+${fmtInt(totalUplift)} <span style="font-size: 13px; color: var(--n-500); font-weight: 500;">MAD</span></div>
            <div style="font-size: 12px; color: var(--n-500); margin-top: 4px;">vs panier sans promo · 30 j glissants</div>
          </div>
          <div class="p-card" style="margin-bottom: 0;">
            <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase;">ÉCHANGES AUJOURD'HUI</div>
            <div style="font-size: 26px; font-weight: 600; font-family: var(--mono); font-feature-settings: 'tnum' 1; margin-top: 4px; letter-spacing: -0.02em;">${fmtInt(totalRedem)}</div>
            <div style="font-size: 12px; color: var(--n-500); margin-top: 4px;">+${fmtInt(48)} vs hier · 14,8 % du trafic</div>
          </div>
          <div class="p-card" style="margin-bottom: 0;">
            <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase;">MEILLEURE CAMPAGNE</div>
            <div style="font-size: 17px; font-weight: 600; margin-top: 4px; letter-spacing: -0.015em;">Tax-free Touristes UE</div>
            <div style="font-size: 12px; color: var(--atlas); margin-top: 4px; font-weight: 500;">+34,1 % uplift · 184 redem.</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 11px; color: var(--n-500); letter-spacing: 0.1em; font-family: var(--mono); text-transform: uppercase;">CAMPAGNES ACTIVES</div>
            <div style="font-size: 12px; color: var(--n-500); margin-top: 4px;">Cliquez une ligne pour modifier · les chiffres se mettent à jour toutes les 60 s.</div>
          </div>
          <button class="kb atlas" data-action="promo-schedule">${SVG.plus}<span>Planifier une promo</span></button>
        </div>

        <table class="p-table" style="margin-bottom: 22px;">
          <thead>
            <tr>
              <th>NOM</th>
              <th>TYPE</th>
              <th class="right">VALEUR</th>
              <th class="right">REDEMPTIONS</th>
              <th class="right">UPLIFT</th>
              <th class="right">AOV</th>
              <th>EXPIRE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${active.map(p => `
              <tr data-action="promo-edit" data-arg="${p.id}">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 28px; height: 28px; border-radius: 8px; background: ${p.scheduled ? 'rgba(217,154,43,0.16)' : 'var(--mint-soft)'}; color: ${p.scheduled ? '#8A6210' : 'var(--atlas)'}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${SVG[p.type]}</span>
                    <b style="font-weight: 600;">${p.name}</b>
                  </div>
                </td>
                <td><span class="chip ${p.scheduled ? 'pend' : 'ok'}" style="font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.04em;">${p.kind.toUpperCase()}</span></td>
                <td class="mono right">${p.value}</td>
                <td class="mono right">${p.redem === 0 ? '—' : fmtInt(p.redem)}</td>
                <td class="mono right" style="color: ${p.uplift.startsWith('+') ? 'var(--atlas)' : 'var(--n-500)'}; font-weight: 600;">${p.uplift}</td>
                <td class="mono right" style="color: var(--n-500);">${p.aov}</td>
                <td><span class="chip ${p.expiry === 'Permanent' ? 'neutral' : p.scheduled ? 'pend' : 'ok'}" style="font-family: var(--mono); font-size: 10.5px;">${p.expiry}</span></td>
                <td style="text-align: right;">
                  <button class="kb ghost" style="padding: 5px 10px; font-size: 11.5px;" data-action="${p.scheduled ? 'promo-edit' : 'promo-pause'}" data-arg="${p.id}" data-bubble="stop">
                    ${p.scheduled ? SVG.edit : SVG.pause}
                    ${p.scheduled ? 'Modifier' : 'Pauser'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="p-card" style="margin-bottom: 18px;">
          <div class="head">
            <h4>Cibler par segment client</h4>
            <span class="meta">${segments.filter(s => s.on).length} / ${segments.length} ACTIFS</span>
          </div>
          <div style="font-size: 12.5px; color: var(--n-500); margin: 0 0 12px; line-height: 1.45;">Les promos s'affichent uniquement aux segments cochés. Cliquez pour activer ou désactiver.</div>
          <div class="b-promo-segments">
            ${segments.map(s => `
              <button class="b-promo-seg ${s.on ? 'on' : ''}" data-action="promo-segment" data-arg="${s.id}">
                ${s.on ? SVG.check : ''}
                <span>${s.n}</span>
                <span style="opacity: 0.6; font-family: var(--mono); font-size: 10.5px;">${s.count}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div style="font-size: 11px; color: var(--n-500); letter-spacing: 0.1em; font-family: var(--mono); text-transform: uppercase; margin-bottom: 10px;">ARCHIVE · 12 DERNIERS MOIS</div>
        <table class="p-table" style="margin-bottom: 6px;">
          <thead>
            <tr>
              <th>CAMPAGNE</th>
              <th>PÉRIODE</th>
              <th class="right">REDEMPTIONS</th>
              <th class="right">UPLIFT</th>
              <th class="right">REVENUE</th>
              <th>VERDICT</th>
            </tr>
          </thead>
          <tbody>
            ${archive.map(a => `
              <tr data-action="promo-archive-detail" data-arg="${a.name}">
                <td><b style="font-weight: 600;">${a.name}</b></td>
                <td style="color: var(--n-500); font-size: 12.5px;">${a.period}</td>
                <td class="mono right">${fmtInt(a.redem)}</td>
                <td class="mono right" style="color: var(--atlas); font-weight: 600;">${a.uplift}</td>
                <td class="mono right">${a.revenue}</td>
                <td><span class="chip ${a.verdict === 'Excellent' ? 'ok' : a.verdict === 'Tiède' ? 'neutral' : 'ok'}" style="font-size: 10.5px;">${a.verdict}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `,
    });
  };

  /* ═══════════════════ AUX · promo handlers ═══════════════════════════════ */
  handlers['promo-schedule'] = () => {
    let step = 1;
    const state = { type: '', value: '', audience: 'all', start: '01/05/2026', end: '15/05/2026' };

    const render = () => {
      const stepDots = `<div class="wiz-steps">${[1,2,3,4].map(i => `<div class="wiz-step ${i < step ? 'done' : i === step ? 'active' : ''}"></div>`).join('')}</div>`;
      let body, foot;
      if (step === 1) {
        body = `
          ${stepDots}
          <div style="margin-bottom: 8px; font-size: 14px; font-weight: 500;">Quel type de promotion ?</div>
          <div style="display: grid; gap: 10px;">
            ${[
              ['discount', 'Réduction directe', 'Pourcentage ou montant fixe sur tout le panier ou une catégorie.'],
              ['code',     'Code promo', 'Le client saisit un code à la caisse pour activer la remise.'],
              ['bundle',   'Lot / 3-pour-2', 'Achetez X, payez Y. Idéal pour vider du stock saisonnier.'],
              ['tax',      'Tax-free segment', 'TVA détaxée pour touristes UE/US/CH avec passeport.'],
            ].map(([id, t, d]) => `
              <div class="wiz-choice ${state.type === id ? 'selected' : ''}" data-pick="${id}">
                <div class="wc-ic">${SVG[id]}</div>
                <div><div class="wc-t">${t}</div><div class="wc-d">${d}</div></div>
              </div>
            `).join('')}
          </div>
        `;
        foot = `<button class="kb ghost" data-cancel>Annuler</button><button class="kb atlas" data-next>Suivant ${SVG.chev}</button>`;
      } else if (step === 2) {
        body = `
          ${stepDots}
          <div style="margin-bottom: 14px; font-size: 14px; font-weight: 500;">Quelle valeur ?</div>
          <div class="kf-group">
            <label class="kf-label">Valeur de la remise</label>
            <input class="kf-input" id="promoVal" placeholder="ex. 25 % ou 200 MAD" value="${state.value}"/>
            <div class="kf-help">Saisissez un pourcentage ("25 %") ou un montant fixe ("200 MAD").</div>
          </div>
          <div class="kf-row">
            <div class="kf-group">
              <label class="kf-label">Plancher panier</label>
              <input class="kf-input" placeholder="500 MAD"/>
            </div>
            <div class="kf-group">
              <label class="kf-label">Plafond remise</label>
              <input class="kf-input" placeholder="Aucun"/>
            </div>
          </div>
        `;
        foot = `<button class="kb ghost" data-back>Retour</button><button class="kb atlas" data-next>Suivant ${SVG.chev}</button>`;
      } else if (step === 3) {
        body = `
          ${stepDots}
          <div style="margin-bottom: 14px; font-size: 14px; font-weight: 500;">À qui s'adresse la promo ?</div>
          <div style="display: grid; gap: 8px;">
            ${[
              ['all',   'Tous les clients',     'Visible pour chaque visiteur de la boutique.'],
              ['eu',    'Touristes UE',         'Détectés par carte d\'origine. ~892 visiteurs / mois.'],
              ['us',    'Touristes US',         'Détectés par carte d\'origine. ~316 visiteurs / mois.'],
              ['dia',   'Diaspora FR / ES',      'Clients récurrents avec adresse hors Maroc.'],
              ['loyal', 'Clients fidèles',      '198 clients · 5+ achats sur 12 mois.'],
              ['never', 'Jamais venus',         'Anciens clients sans achat depuis 12+ mois.'],
            ].map(([id, t, d]) => `
              <div class="wiz-choice ${state.audience === id ? 'selected' : ''}" data-aud="${id}">
                <div class="wc-ic">${SVG.bell}</div>
                <div><div class="wc-t">${t}</div><div class="wc-d">${d}</div></div>
              </div>
            `).join('')}
          </div>
        `;
        foot = `<button class="kb ghost" data-back>Retour</button><button class="kb atlas" data-next>Suivant ${SVG.chev}</button>`;
      } else {
        const audLabel = { all: 'Tous les clients', eu: 'Touristes UE', us: 'Touristes US', dia: 'Diaspora FR/ES', loyal: 'Clients fidèles', never: 'Jamais venus' }[state.audience];
        const typLabel = { discount: 'Réduction directe', code: 'Code promo', bundle: 'Lot 3-pour-2', tax: 'Tax-free segment' }[state.type];
        body = `
          ${stepDots}
          <div style="margin-bottom: 14px; font-size: 14px; font-weight: 500;">Période et aperçu</div>
          <div class="kf-row">
            <div class="kf-group"><label class="kf-label">Date de début</label><input class="kf-input" value="${state.start}"/></div>
            <div class="kf-group"><label class="kf-label">Date de fin</label><input class="kf-input" value="${state.end}"/></div>
          </div>
          <div style="background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 14px; padding: 18px; margin-top: 10px;">
            <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin-bottom: 8px;">APERÇU CAMPAGNE</div>
            <dl class="tx-detail-grid" style="margin: 0;">
              <dt>Type</dt><dd>${typLabel || '—'}</dd>
              <dt>Valeur</dt><dd>${state.value || '—'}</dd>
              <dt>Audience</dt><dd>${audLabel}</dd>
              <dt>Période</dt><dd>${state.start} → ${state.end}</dd>
              <dt>Estim. uplift</dt><dd style="color: var(--atlas);">+12 à +28 % AOV</dd>
            </dl>
          </div>
        `;
        foot = `<button class="kb ghost" data-back>Retour</button><button class="kb atlas" data-go>${SVG.check} Planifier la promo</button>`;
      }
      return { body, foot };
    };

    const open = () => {
      const { body, foot } = render();
      const m = modal({ title: 'Planifier une promotion', desc: 'Boutique Maison Mansour · Gueliz', body, foot, width: 580 });

      m.el.querySelectorAll('[data-pick]').forEach(el => {
        el.onclick = () => { state.type = el.dataset.pick; m.close(); step = 1; setTimeout(open, 220); };
      });
      m.el.querySelectorAll('[data-aud]').forEach(el => {
        el.onclick = () => { state.audience = el.dataset.aud; m.el.querySelectorAll('[data-aud]').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); };
      });
      m.el.querySelector('[data-next]')?.addEventListener('click', () => {
        if (step === 1 && !state.type) { toast('Choisissez d\'abord un type', { type: 'warn', duration: 2200 }); return; }
        if (step === 2) { state.value = m.el.querySelector('#promoVal')?.value || ''; if (!state.value) { toast('Saisissez une valeur', { type: 'warn', duration: 2200 }); return; } }
        step++;
        m.close();
        setTimeout(open, 220);
      });
      m.el.querySelector('[data-back]')?.addEventListener('click', () => { step--; m.close(); setTimeout(open, 220); });
      m.el.querySelector('[data-cancel]')?.addEventListener('click', m.close);
      m.el.querySelector('[data-go]')?.addEventListener('click', () => {
        m.close();
        toast('Promo planifiée · démarre le ' + state.start, { type: 'success', desc: 'Notification envoyée à l\'équipe POS Maison Mansour.', duration: 4000 });
      });
    };
    open();
  };

  handlers['promo-pause'] = (el, id) => {
    modal({
      tag: 'CONFIRMATION',
      title: 'Mettre en pause cette promo ?',
      desc: `Aucun client ne pourra plus l'utiliser tant qu'elle n'est pas réactivée. ID interne : ${id || '—'}.`,
      width: 460,
      foot: `<button class="kb ghost" data-cancel>Annuler</button><button class="kb danger" data-confirm>${SVG.pause} Pauser la promo</button>`,
    }).el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cancel]')) e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
      if (e.target.closest('[data-confirm]')) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        toast('Promo mise en pause', { type: 'warn', desc: 'Vous pouvez la réactiver à tout moment depuis la liste.', duration: 3500 });
      }
    });
  };

  handlers['promo-end'] = () => toast('Promo clôturée définitivement', { type: 'info', duration: 2800 });

  handlers['promo-edit'] = (_el, id) => toast('Édition · ' + (id || 'campagne'), { type: 'info', desc: 'Les modifications s\'appliquent immédiatement aux prochains paniers.', duration: 2600 });

  handlers['promo-segment'] = (id) => {
    const btn = document.querySelector(`[data-action="promo-segment"][data-arg="${id}"]`);
    if (!btn) return;
    btn.classList.toggle('on');
    const isOn = btn.classList.contains('on');
    const name = btn.querySelector('span')?.textContent || id;
    toast(`Segment "${name}" ${isOn ? 'activé' : 'désactivé'}`, { type: isOn ? 'success' : 'info', duration: 1800 });
  };

  handlers['promo-archive-detail'] = (name) => {
    modal({
      tag: 'ARCHIVE',
      title: name,
      desc: 'Récapitulatif de campagne · ouvert depuis l\'archive.',
      width: 560,
      body: `
        <div class="kx-stat-3">
          <div class="stat"><div class="l">REDEMPTIONS</div><div class="v">421</div><div class="sub">+38 % vs prévu</div></div>
          <div class="stat"><div class="l">UPLIFT</div><div class="v">+27,6 %</div><div class="sub">vs panier baseline</div></div>
          <div class="stat"><div class="l">REVENUE</div><div class="v">184 320</div><div class="sub">MAD bruts</div></div>
        </div>
        <div style="font-size: 13px; color: var(--n-600); line-height: 1.6;">
          La campagne a sur-performé sur les Touristes UE (+34 % AOV) et a sous-performé sur la Diaspora.
          Recommandation : la dupliquer pour Aïd 2026 en ciblant uniquement Touristes UE + Clients fidèles.
        </div>
      `,
      foot: `<button class="kb ghost" data-cancel>Fermer</button><button class="kb atlas" data-go>${SVG.plus} Dupliquer la campagne</button>`,
    }).el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cancel]')) e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
      if (e.target.closest('[data-go]')) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        toast('Campagne dupliquée · brouillon créé', { type: 'success', duration: 2800 });
      }
    });
  };

  /* ═══════════════════ NAV-RETURNS ═══════════════════════════════════════════
   * Retours & échanges. Width 980. Pending list, return-policy editor, fraud
   * watch, refund issuance row.
   * ─────────────────────────────────────────────────────────────────────────── */
  handlers['nav-returns'] = () => {
    const pending = [
      { id: 'R-7821', d: '24/04', name: 'Caftan brodé taille S',         amt: 2450,  reason: 'Taille',                client: 'Anna M. (DE)',     status: 'pend',  emoji: 'C' },
      { id: 'R-7822', d: '23/04', name: 'Babouches cuir caramel',         amt: 380,   reason: 'Défaut · couture',      client: 'Sophie L. (FR)',   status: 'pend',  emoji: 'B' },
      { id: 'R-7823', d: '23/04', name: 'Tapis berbère 1,2 × 1,8 m',     amt: 4200,  reason: 'Cadeau non désiré',     client: 'Karen B. (US)',    status: 'pend',  emoji: 'T' },
      { id: 'R-7824', d: '22/04', name: 'Théière argentée gravée',       amt: 950,   reason: 'N\'a pas plu',          client: 'Carmen R. (ES)',   status: 'ok',    emoji: 'TH' },
      { id: 'R-7825', d: '22/04', name: 'Coussin tissé Kilim',            amt: 290,   reason: 'Défaut · tache',        client: 'Hassan J. (MA)',   status: 'pend',  emoji: 'CO' },
      { id: 'R-7826', d: '21/04', name: 'Bracelet argent berbère',       amt: 1200,  reason: 'Taille',                client: 'Karima O. (MA)',   status: 'neutral', emoji: 'BR' },
    ];

    const flagged = [
      { name: 'Diana K. (US)',  reason: '4 retours en 28 j · 2 sur articles soldés', amt: '4 280 MAD', risk: 'Élevé' },
      { name: 'Sofia A. (FR)',  reason: '3 retours en 30 j · pattern post-Instagram', amt: '2 940 MAD', risk: 'Modéré' },
    ];

    drawer({
      title: 'Retours & échanges',
      subtitle: 'Maison Mansour · Gueliz · 5 demandes en attente · 2 clients flaggés',
      width: 980,
      body: `
        <div class="p-hero" style="background: linear-gradient(135deg, var(--atlas), var(--riad));">
          <div class="l">FENÊTRE DE RETOUR · 14 JOURS</div>
          <div class="big">${pending.filter(p => p.status === 'pend').length} <span style="font-size:18px; opacity:0.7;">en attente</span></div>
          <div class="sub">Taux de retour 30 j : 4,8 % · taux d'échange 30 j : 12,1 % · politique modifiable plus bas</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 11px; color: var(--n-500); letter-spacing: 0.1em; font-family: var(--mono); text-transform: uppercase;">DEMANDES EN ATTENTE</div>
            <div style="font-size: 12px; color: var(--n-500); margin-top: 4px;">Approuvez, refusez ou échangez. Cliquez "Détail" pour voir l'historique client complet.</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="kb ghost" data-action="ret-export"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7 7 7-7M5 21h14"/></svg>Exporter</button>
            <button class="kb ghost" data-action="ret-policy-jump">${SVG.edit} Politique</button>
          </div>
        </div>

        <div class="p-card" style="padding: 8px 18px 12px;">
          ${pending.map(r => `
            <div class="b-ret-row" data-action="ret-detail" data-arg="${r.id}">
              <div class="b-ret-id">${r.id}<br><span style="opacity:0.7; font-size: 10px;">${r.d}</span></div>
              <div class="b-ret-thumb">${SVG.box}</div>
              <div class="b-ret-body">
                <div class="n">${r.name}</div>
                <div class="reason">Raison : ${r.reason}</div>
                <div class="who">${r.client}</div>
              </div>
              <div class="b-ret-amt">${fmtMAD(r.amt, 0)} MAD</div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="chip ${r.status}" style="font-size: 10.5px;">${r.status === 'pend' ? 'En attente' : r.status === 'ok' ? 'Approuvé' : r.status === 'ref' ? 'Refusé' : 'Échangé'}</span>
                ${r.status === 'pend' ? `
                  <button class="kb ghost" style="padding: 5px 10px; font-size: 11px;" data-action="ret-approve" data-arg="${r.id}" data-bubble="stop" title="Approuver">${SVG.check}</button>
                  <button class="kb ghost" style="padding: 5px 10px; font-size: 11px; color: var(--danger);" data-action="ret-refuse" data-arg="${r.id}" data-bubble="stop" title="Refuser">${SVG.x}</button>
                  <button class="kb ghost" style="padding: 5px 10px; font-size: 11px;" data-action="ret-exchange" data-arg="${r.id}" data-bubble="stop" title="Échanger">${SVG.swap}</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-grid-2" style="margin-top: 18px;">
          <div class="p-card" style="margin-bottom: 0;">
            <div class="head">
              <h4>Politique de retour</h4>
              <span class="meta">MODIFIABLE</span>
            </div>
            <div style="font-size: 12.5px; color: var(--n-500); margin-bottom: 12px; line-height: 1.45;">Affichée sur le ticket et la fiche produit. Toute modification s'applique aux nouvelles ventes uniquement.</div>
            <div class="b-ret-policy" id="retPolicy">
              <div class="field">
                <div class="lbl">FENÊTRE DE RETOUR</div>
                <input type="number" value="14" min="0" max="90" step="1"/>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 4px;">jours après l'achat</div>
              </div>
              <div class="field">
                <div class="lbl">FRAIS DE RESTOCKING</div>
                <input type="number" value="0" min="0" max="50" step="1"/>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 4px;">pourcentage retenu</div>
              </div>
            </div>
            <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin: 14px 0 8px;">RÈGLES DE CONDITION</div>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px; color: var(--n-700); line-height: 1.7;">
              ${[
                'Article non porté, non lavé, étiquette d\'origine présente',
                'Emballage et coffret-cadeau intacts',
                'Articles soldés > 30 % : crédit boutique uniquement',
                'Articles personnalisés (broderie, gravure) : non-retournables',
                'Bijoux : sceau anti-fraude non rompu',
              ].map(rule => `<li style="display: flex; align-items: flex-start; gap: 9px; padding: 4px 0;"><span style="color: var(--atlas); flex-shrink: 0; margin-top: 4px;">${SVG.check}</span><span>${rule}</span></li>`).join('')}
            </ul>
            <button class="kb atlas" style="width: 100%; justify-content: center; margin-top: 12px;" data-action="ret-policy-save">Enregistrer la politique</button>
          </div>

          <div class="p-card" style="margin-bottom: 0;">
            <div class="head">
              <h4>Veille fraude</h4>
              <span class="meta" style="color: var(--danger);">${flagged.length} CLIENTS FLAGGÉS</span>
            </div>
            <div style="font-size: 12.5px; color: var(--n-500); margin-bottom: 12px; line-height: 1.45;">3 retours ou plus sur 30 jours glissants. Vous pouvez bloquer leurs futures demandes de retour.</div>
            ${flagged.map((f, i) => `
              <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-top: 1px solid var(--n-200);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(201,74,58,0.12); color: var(--danger); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${SVG.flag}</div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 13.5px;">${f.name}</div>
                  <div style="font-size: 12px; color: var(--n-500); margin-top: 2px; line-height: 1.4;">${f.reason}</div>
                  <div style="font-size: 11.5px; color: var(--n-500); margin-top: 6px; font-family: var(--mono);">Volume retours : ${f.amt} · Risque ${f.risk}</div>
                </div>
                <label class="kx-toggle">
                  <input type="checkbox" data-action="ret-block" data-arg="${f.name}"/>
                  <span class="track"></span>
                </label>
              </div>
            `).join('')}
            <div style="margin-top: 12px; padding: 10px 12px; background: rgba(217,154,43,0.08); border: 1px solid rgba(217,154,43,0.22); border-radius: 10px; font-size: 11.5px; color: #8A6210; line-height: 1.5;">
              <b>Astuce.</b> Bloquer un client n'empêche pas l'achat — uniquement les retours. Notification email envoyée automatiquement.
            </div>
          </div>
        </div>

        <div class="p-card" style="margin-top: 18px;">
          <div class="head">
            <h4>Émission rapide d'un remboursement</h4>
            <span class="meta">3 OPTIONS</span>
          </div>
          <div style="font-size: 12.5px; color: var(--n-500); margin-bottom: 12px; line-height: 1.45;">Choisissez le canal — la commande d'origine sera automatiquement liée pour la conformité.</div>
          <div class="p-grid-3">
            <button class="kb ghost" style="padding: 14px; flex-direction: column; gap: 8px; min-height: 76px; align-items: center; justify-content: center;" data-action="ret-refund-original">
              ${SVG.coin}
              <div style="text-align: center;">
                <div style="font-weight: 600; font-size: 13px;">Carte d'origine</div>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 2px;">Visa / Mastercard · 1-3 jours</div>
              </div>
            </button>
            <button class="kb ghost" style="padding: 14px; flex-direction: column; gap: 8px; min-height: 76px; align-items: center; justify-content: center;" data-action="ret-refund-credit">
              ${SVG.code}
              <div style="text-align: center;">
                <div style="font-weight: 600; font-size: 13px;">Crédit boutique</div>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 2px;">Bon valable 12 mois</div>
              </div>
            </button>
            <button class="kb ghost" style="padding: 14px; flex-direction: column; gap: 8px; min-height: 76px; align-items: center; justify-content: center;" data-action="ret-refund-whatsapp">
              ${SVG.wa}
              <div style="text-align: center;">
                <div style="font-weight: 600; font-size: 13px;">Notifier WhatsApp</div>
                <div style="font-size: 11px; color: var(--n-500); margin-top: 2px;">Lien de remboursement</div>
              </div>
            </button>
          </div>
        </div>
      `,
    });
  };

  /* ═══════════════════ AUX · returns handlers ═══════════════════════════════ */

  handlers['ret-detail'] = (id) => {
    const samplePhotos = ['mint-soft', 'rgba(217,154,43,0.16)', 'var(--paper-soft)', 'rgba(11,110,79,0.10)'];
    modal({
      tag: 'DEMANDE DE RETOUR · ' + (id || '—'),
      title: 'Caftan brodé taille S',
      desc: 'Anna M. (DE) · achat le 17/04/2026 · ticket #T-21847',
      width: 640,
      body: `
        <div class="kx-stat-3">
          <div class="stat"><div class="l">MONTANT</div><div class="v">2 450</div><div class="sub">MAD payés</div></div>
          <div class="stat"><div class="l">JOURS</div><div class="v">7 / 14</div><div class="sub">restants</div></div>
          <div class="stat"><div class="l">CLIENT</div><div class="v">3</div><div class="sub">achats antérieurs</div></div>
        </div>

        <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin: 14px 0 8px;">MOTIF DÉTAILLÉ</div>
        <div style="font-size: 13px; color: var(--n-700); line-height: 1.55; padding: 12px; background: var(--paper-soft); border-radius: 10px;">
          « La taille S est trop serrée à l'épaule pour ma morphologie. Je souhaite échanger contre une taille M ou être remboursée. L'article n'a pas été porté, l'étiquette est encore présente. »
        </div>

        <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin: 16px 0 8px;">PHOTOS FOURNIES</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${samplePhotos.map((c, i) => `
            <div style="aspect-ratio: 1; background: ${c}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--n-500); font-size: 11px; font-family: var(--mono); border: 1px solid var(--n-200);">PHOTO ${i+1}</div>
          `).join('')}
        </div>

        <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin: 16px 0 8px;">HISTORIQUE CLIENTE · 3 ACHATS</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${[
            ['17/04/2026', 'Caftan brodé taille S',     '2 450 MAD', 'achat actuel'],
            ['08/02/2026', 'Foulard soie écru',         '720 MAD',   'aucun retour'],
            ['12/12/2025', 'Coffret huile argan',       '380 MAD',   'aucun retour'],
          ].map(([d, item, amt, st]) => `
            <div style="display: grid; grid-template-columns: 90px 1fr 110px auto; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--n-200); font-size: 12.5px; align-items: center;">
              <div class="mono" style="color: var(--n-500);">${d}</div>
              <div>${item}</div>
              <div class="mono" style="text-align: right;">${amt}</div>
              <div style="font-size: 11px; color: var(--n-500); font-family: var(--mono); letter-spacing: 0.04em;">${st}</div>
            </div>
          `).join('')}
        </div>
      `,
      foot: `
        <button class="kb ghost" data-action="ret-refuse" data-arg="${id || ''}" data-bubble="stop" style="color: var(--danger);">${SVG.x} Refuser</button>
        <button class="kb ghost" data-action="ret-refund-credit" data-bubble="stop">${SVG.code} Crédit boutique</button>
        <button class="kb ghost" data-action="ret-exchange" data-arg="${id || ''}" data-bubble="stop">${SVG.swap} Échanger</button>
        <button class="kb atlas" data-action="ret-approve" data-arg="${id || ''}" data-bubble="stop">${SVG.check} Approuver remboursement</button>
      `,
    });
  };

  handlers['ret-approve'] = (id) => {
    modal({
      tag: 'CHOISIR LE CANAL',
      title: 'Comment rembourser ?',
      desc: `Demande ${id || '—'} · 2 450 MAD · Anna M. (DE)`,
      width: 540,
      body: `
        <div style="display: grid; gap: 10px;">
          <div class="wiz-choice" data-channel="card">
            <div class="wc-ic">${SVG.coin}</div>
            <div><div class="wc-t">Carte d'origine · Visa ••4291</div><div class="wc-d">Crédité en 1 à 3 jours ouvrés. Aucun frais.</div></div>
          </div>
          <div class="wiz-choice" data-channel="credit">
            <div class="wc-ic">${SVG.code}</div>
            <div><div class="wc-t">Crédit boutique</div><div class="wc-d">Bon valable 12 mois sur tous les articles. +10 % offerts en bonus.</div></div>
          </div>
          <div class="wiz-choice" data-channel="cash">
            <div class="wc-ic">${SVG.coin}</div>
            <div><div class="wc-t">Espèces / virement</div><div class="wc-d">Disponible immédiatement à la caisse ou sous 48 h par virement.</div></div>
          </div>
        </div>
      `,
      foot: `<button class="kb ghost" data-cancel>Annuler</button>`,
    }).el.addEventListener('click', (e) => {
      const ch = e.target.closest('[data-channel]');
      if (ch) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        const labels = { card: 'sur la carte d\'origine', credit: 'en crédit boutique +10 %', cash: 'en espèces à la caisse' };
        toast('Remboursement approuvé', { type: 'success', desc: `${id || 'Demande'} remboursée ${labels[ch.dataset.channel]}.`, duration: 3500 });
      }
      if (e.target.closest('[data-cancel]')) e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
    });
  };

  handlers['ret-refuse'] = (id) => {
    modal({
      tag: 'CONFIRMATION',
      title: 'Refuser la demande de retour ?',
      desc: `Le client recevra une notification expliquant le motif. Cette action est définitive pour ${id || 'cette demande'}.`,
      width: 480,
      body: `
        <div class="kf-group">
          <label class="kf-label">Motif du refus (visible par le client)</label>
          <select class="kf-input">
            <option>Article hors fenêtre de retour</option>
            <option>Étiquette d'origine manquante</option>
            <option>Article porté ou lavé</option>
            <option>Article personnalisé non retournable</option>
            <option>Sceau anti-fraude rompu</option>
          </select>
        </div>
      `,
      foot: `<button class="kb ghost" data-cancel>Annuler</button><button class="kb danger" data-confirm>${SVG.x} Refuser définitivement</button>`,
    }).el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cancel]')) e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
      if (e.target.closest('[data-confirm]')) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        toast('Demande refusée', { type: 'danger', desc: 'Notification SMS envoyée au client.', duration: 3200 });
      }
    });
  };

  handlers['ret-exchange'] = (id) => {
    const items = [
      ['Caftan brodé taille M',     '2 450 MAD', 'En stock · 4'],
      ['Caftan brodé taille L',     '2 450 MAD', 'En stock · 2'],
      ['Caftan brodé taille XL',    '2 600 MAD', 'En stock · 1'],
      ['Caftan brodé col V · M',    '2 700 MAD', 'En stock · 3'],
      ['Caftan brodé Riad · M',     '3 200 MAD', '+ 750 MAD'],
    ];
    modal({
      tag: 'ÉCHANGE · ' + (id || '—'),
      title: 'Choisir un article de remplacement',
      desc: 'Article retourné : Caftan brodé taille S · 2 450 MAD',
      width: 580,
      body: `
        <div class="kf-group">
          <label class="kf-label">Rechercher dans le catalogue</label>
          <input class="kf-input" placeholder="Caftan brodé, babouches…" value="caftan brodé"/>
        </div>
        <div style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--n-500); text-transform: uppercase; margin: 14px 0 8px;">5 RÉSULTATS</div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto;">
          ${items.map(([n, p, st], idx) => `
            <div class="wiz-choice" data-pick="${idx}" style="padding: 12px 14px;">
              <div class="wc-ic">${SVG.box}</div>
              <div style="flex: 1;">
                <div class="wc-t">${n}</div>
                <div class="wc-d">${st}</div>
              </div>
              <div style="font-family: var(--mono); font-weight: 600; font-size: 13px;">${p}</div>
            </div>
          `).join('')}
        </div>
      `,
      foot: `<button class="kb ghost" data-cancel>Annuler</button>`,
    }).el.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const idx = +pick.dataset.pick;
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        toast('Échange enregistré', { type: 'success', desc: `Nouveau ticket : ${items[idx][0]}. Étiquette d'expédition envoyée par WhatsApp.`, duration: 3600 });
      }
      if (e.target.closest('[data-cancel]')) e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
    });
  };

  handlers['ret-block'] = (name) => {
    const cb = document.querySelector(`input[type="checkbox"][data-action="ret-block"][data-arg="${name}"]`);
    if (!cb) return;
    if (!cb.checked) {
      toast(`${name} déblocké`, { type: 'info', duration: 2200 });
      return;
    }
    cb.checked = false;
    modal({
      tag: 'CONFIRMATION',
      title: `Bloquer ${name} des retours ?`,
      desc: 'Les futures demandes seront automatiquement refusées. Le client peut continuer d\'acheter normalement.',
      width: 460,
      foot: `<button class="kb ghost" data-cancel>Annuler</button><button class="kb danger" data-confirm>${SVG.block} Bloquer</button>`,
    }).el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cancel]')) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
      }
      if (e.target.closest('[data-confirm]')) {
        e.target.closest('.kiwi-backdrop').querySelector('.kiwi-modal-close').click();
        cb.checked = true;
        toast(`${name} bloqué·e des retours`, { type: 'warn', desc: 'Email automatique envoyé.', duration: 3200 });
      }
    });
  };

  handlers['ret-policy-save'] = () => {
    const root = document.getElementById('retPolicy');
    const inputs = root ? root.querySelectorAll('input[type="number"]') : [];
    const win = inputs[0]?.value || '14';
    const fee = inputs[1]?.value || '0';
    toast('Politique de retour enregistrée', { type: 'success', desc: `Fenêtre ${win} j · restocking ${fee} %. Appliquée aux nouvelles ventes.`, duration: 3200 });
  };

  handlers['ret-policy-jump'] = () => {
    const el = document.getElementById('retPolicy');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Politique de retour', { type: 'info', desc: 'Modifiez la fenêtre ou les frais de restocking ci-dessous.', duration: 2400 });
  };

  handlers['ret-export'] = () => toast('Export retours · CSV en cours', { type: 'info', desc: '6 demandes · ouvert dans Excel ou Numbers.', duration: 2600 });

  handlers['ret-refund-original'] = () => toast('Remboursement carte d\'origine', { type: 'success', desc: 'Crédité en 1-3 jours ouvrés. Confirmation par SMS au client.', duration: 3000 });
  handlers['ret-refund-credit'] = () => toast('Crédit boutique émis', { type: 'success', desc: 'Bon valable 12 mois · +10 % offerts en bonus de fidélité.', duration: 3000 });
  handlers['ret-refund-whatsapp'] = () => toast('Lien WhatsApp envoyé', { type: 'success', desc: 'Le client recevra un lien sécurisé pour confirmer son IBAN.', duration: 3000 });

})();

/* ═══ Section 2 spa A · appointments / services ═══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Spa Bahia — sidebar handlers (vertical : SPA)
 * ─────────────────────────────────────────────────────────────────────────
 * Two production-grade drawers for the Spa Bahia mode (Hivernage, Marrakech) :
 *   1. nav-appointments  → calendrier 7 jours × 3 praticiennes (Booksy-tier)
 *   2. nav-services      → catalogue services & forfaits (5 catégories)
 *
 * Lives on top of pages.js (.p-hero / .p-card / .p-table / .kb / .chip / .mono)
 * + the spa-only CSS appended to /tmp/kiwi-s2-boutique-spa-css.css.
 *
 * No IIFE, no framework — vanilla. Patches `window.Kiwi.handlers` directly.
 * ─────────────────────────────────────────────────────────────────────── */
'use strict';

(() => {
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const { handlers, drawer, modal, toast, confetti } = window.Kiwi;

  /* ─── Shared spa data ─── */
  const PRACT = [
    { id: 'NH', name: 'Nour El Hassan',   role: 'Sénior · 8 ans',                     skill: 'sénior',   color: 'var(--atlas)' },
    { id: 'SB', name: 'Salma Benkirane',  role: 'Certifiée CIDESCO · massage thérap.', skill: 'certifié', color: 'var(--riad)'  },
    { id: 'YB', name: 'Yasmine Bouchikhi', role: 'Junior · spécialisée hammam',        skill: 'junior',   color: '#D99A2B'      },
  ];
  const SERVICES = [
    // category : massage | facial | hammam | day | cure
    { cat: 'massage', name: 'Massage relaxant 60 min',  abbr: 'MR60',  dur: 60, price: 550,  room: 'Salon 1',     skill: 'sénior',   sales: 1, contras: ['Grossesse 1ᵉʳ trim.'], notes: 'Huile d’argan tiède' },
    { cat: 'massage', name: 'Massage californien',      abbr: 'MCA',   dur: 60, price: 650,  room: 'Salon 2',     skill: 'sénior',   sales: 4, contras: [], notes: 'Pressions enveloppantes' },
    { cat: 'massage', name: 'Massage couple 60 min',    abbr: 'COUPL', dur: 60, price: 1100, room: 'Salon 1+2',   skill: 'sénior',   sales: 6, contras: [], notes: 'Cabine duo, deux praticiennes' },
    { cat: 'massage', name: 'Modelage pieds',           abbr: 'PIEDS', dur: 30, price: 280,  room: 'Salon 3',     skill: 'junior',   sales: 9, contras: ['Plaies ouvertes'], notes: 'Réflexologie douce' },
    { cat: 'massage', name: 'Réflexologie',             abbr: 'REFLE', dur: 45, price: 380,  room: 'Salon 3',     skill: 'certifié', sales: 7, contras: ['Phlébite'], notes: 'Points pieds + mains' },
    { cat: 'facial',  name: 'Soin du visage',           abbr: 'SVIS',  dur: 60, price: 650,  room: 'Salon 3',     skill: 'sénior',   sales: 3, contras: ['Allergie miel'], notes: 'Argan + miel d’oranger' },
    { cat: 'facial',  name: 'Soin anti-âge',            abbr: 'AAGE',  dur: 75, price: 780,  room: 'Salon 3',     skill: 'certifié', sales: 5, contras: ['Acide hyaluron.'], notes: 'Sérum + LED' },
    { cat: 'hammam',  name: 'Hammam traditionnel',      abbr: 'HAMTR', dur: 75, price: 350,  room: 'Hammam',      skill: 'junior',   sales: 2, contras: ['Hypertension sévère'], notes: 'Savon noir beldi' },
    { cat: 'hammam',  name: 'Gommage corps',            abbr: 'GOM',   dur: 45, price: 400,  room: 'Hammam',      skill: 'junior',   sales: 8, contras: ['Peau lésée'], notes: 'Kessa + savon noir' },
    { cat: 'hammam',  name: 'Gommage rhassoul',         abbr: 'RHAS',  dur: 30, price: 320,  room: 'Hammam',      skill: 'junior',   sales: 11, contras: [], notes: 'Argile de l’Atlas' },
    { cat: 'hammam',  name: 'Enveloppement boue',       abbr: 'BOUE',  dur: 60, price: 620,  room: 'Cabine humide', skill: 'certifié', sales: 10, contras: ['Claustro.'], notes: 'Ghassoul chaud + huiles ess.' },
    { cat: 'day',     name: 'Forfait Argan',            abbr: 'ARGAN', dur: 90, price: 850,  room: 'Salon 1+Hammam', skill: 'sénior', sales: 0, contras: [], notes: 'Hammam + gommage + massage 30 min' },
  ];
  const CLIENTS = [
    { i: 'LP', n: 'Lisa P.',     tag: 'US · VIP',           color: '#0B6E4F' },
    { i: 'AM', n: 'Anna M.',     tag: 'DE · 3 visites',     color: '#053B2C' },
    { i: 'SL', n: 'Sophie L.',   tag: 'FR · 7 visites',     color: '#0B6E4F' },
    { i: 'CR', n: 'Camille R.',  tag: 'FR · 2 visites',     color: '#D99A2B' },
    { i: 'IS', n: 'Imane S.',    tag: 'MA · fidèle (12)',   color: '#053B2C' },
    { i: 'YT', n: 'Yasmine T.',  tag: 'MA · VIP',           color: '#0B6E4F' },
    { i: 'KL', n: 'Karim L.',    tag: 'MA · 4 visites',     color: '#D99A2B' },
    { i: 'LM', n: 'Lucia M.',    tag: 'ES · 1ʳᵉ visite',    color: '#053B2C' },
  ];

  /* ─── Helpers ─── */
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/,/g, ' ');
  const SVG = (p, sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICN = {
    plus:    SVG('<path d="M12 5v14M5 12h14"/>'),
    cal:     SVG('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    user:    SVG('<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>'),
    clock:   SVG('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    sparkle: SVG('<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>'),
    pkg:     SVG('<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>'),
    edit:    SVG('<path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>'),
    trash:   SVG('<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>'),
    bell:    SVG('<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>'),
  };
  const chip = (txt, cls = 'ok') => `<span class="chip ${cls}">${txt}</span>`;
  const riskChip = (r) => r === 'low' ? chip('Faible', 'ok') : r === 'mid' ? chip('Modéré', 'pend') : chip('Élevé', 'ref');

  /* ═══════════════════════════════════════════════════════════════════════
   * 1. nav-appointments — Calendrier rendez-vous (Spa Bahia)
   * ═════════════════════════════════════════════════════════════════════ */
  handlers['nav-appointments'] = () => {
    /* ─ Booking dataset (3 practitioners × 7 days × multiple slots) ─ */
    const DAYS = ['Lun 27', 'Mar 28', 'Mer 29', 'Jeu 30', 'Ven 1ᵉʳ', 'Sam 2', 'Dim 3'];
    const TODAY_IDX = 2; // mercredi — aujourd'hui
    const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    // Bookings: [day, practitioner, startHour (decimal), durationHours, clientIdx, serviceIdx, risk, status, notes]
    const BOOK = [
      [0,'NH', 9.0, 1.5, 4, 11, 'low', 'ok',   'Cliente fidèle, prefère huile chaude'],
      [0,'NH',11.0, 1.0, 0,  1, 'low', 'ok',   'VIP — accueil thé à la menthe servi'],
      [0,'SB',10.0, 1.0, 1,  6, 'mid', 'ok',   'Allergie parabènes notée au dossier'],
      [0,'YB',14.0, 1.25, 7, 7, 'low', 'ok',   'Première visite, expliquer le rituel'],
      [1,'NH', 8.5, 1.0, 2,  0, 'low', 'ok',   ''],
      [1,'NH',14.0, 1.5, 5, 11, 'low', 'ok',   'Soin avant gala vendredi soir'],
      [1,'SB',10.0, 1.25, 3, 5, 'low', 'ok',   ''],
      [1,'YB',11.0, 0.75, 6, 9, 'high','pend', 'No-show 2× sur 6 mois — acompte demandé'],
      [1,'YB',16.0, 1.0, 1,  8, 'low', 'ok',   ''],
      // Today (Wednesday)
      [2,'NH', 9.0, 1.0, 4,  0, 'low', 'ok',   'Soins pieds en supplément'],
      [2,'NH',10.5, 1.5, 5, 11, 'low', 'ok',   'Forfait avec hammam puis massage'],
      [2,'NH',14.0, 1.0, 0,  1, 'low', 'ok',   'VIP — table de massage chauffée'],
      [2,'NH',16.0, 1.25, 2, 6, 'mid', 'pend', 'Confirmation WhatsApp en attente'],
      [2,'SB', 9.5, 1.0, 7,  4, 'low', 'ok',   ''],
      [2,'SB',11.5, 1.25, 3, 5, 'low', 'ok',   'Préfère cabine 3 (vue patio)'],
      [2,'SB',15.0, 1.0, 1,  6, 'low', 'ok',   ''],
      [2,'SB',17.0, 1.0, 6,  2, 'high','pend', 'Anniversaire du couple'],
      [2,'YB', 9.0, 1.25, 4, 7, 'low', 'ok',   ''],
      [2,'YB',12.0, 0.5, 5,  9, 'low', 'ok',   ''],
      [2,'YB',14.5, 1.0, 7,  8, 'mid', 'ok',   ''],
      [2,'YB',16.5, 1.25, 6,10, 'low', 'ok',   'Demande huile sans parfum'],
      // Thu / Fri / Sat / Sun forward bookings
      [3,'NH',10.0, 1.5, 0, 11, 'low', 'ok',   ''],
      [3,'SB',14.0, 1.25, 5, 6, 'low', 'ok',   ''],
      [3,'YB',16.0, 1.0, 1,  8, 'low', 'ok',   ''],
      [4,'NH', 9.0, 1.0, 4,  1, 'low', 'ok',   ''],
      [4,'NH',11.0, 1.5, 5, 11, 'low', 'ok',   ''],
      [4,'NH',15.0, 1.0, 2,  0, 'low', 'ok',   ''],
      [4,'SB',10.0, 1.25, 3, 5, 'low', 'ok',   ''],
      [4,'SB',13.0, 1.0, 6,  6, 'mid', 'ok',   ''],
      [4,'YB',14.0, 1.25, 7,10, 'low', 'ok',   ''],
      [4,'YB',17.0, 1.0, 1,  8, 'low', 'ok',   ''],
      [5,'NH',10.0, 1.0, 0,  0, 'low', 'ok',   'Samedi chargé — buffer 15 min'],
      [5,'NH',12.0, 1.0, 4, 11, 'low', 'ok',   ''],
      [5,'NH',15.0, 1.5, 2,  2, 'low', 'ok',   'Couple — anniversaire mariage'],
      [5,'SB',11.0, 1.25, 3, 5, 'low', 'ok',   ''],
      [5,'SB',14.0, 1.0, 5,  6, 'low', 'ok',   ''],
      [5,'YB',13.0, 1.25, 6, 7, 'low', 'ok',   ''],
      [5,'YB',16.0, 1.0, 7,  9, 'low', 'ok',   ''],
      [6,'SB',11.0, 1.0, 1,  4, 'low', 'ok',   'Dimanche — équipe réduite'],
      [6,'YB',14.0, 1.25, 5, 10,'low', 'ok',   ''],
    ];

    const todaysCount = BOOK.filter(b => b[0] === TODAY_IDX).length;
    const fillRate = Math.round((BOOK.length / (3 * 7 * 12 / 2)) * 100); // booked vs available 30-min slots
    const noShowCount = BOOK.filter(b => b[6] === 'high' || b[6] === 'mid').length;

    /* ─ Calendar block geometry: 8h–20h = 12h tall (each hour ≈ 26 px) ─ */
    const HSTART = 8, HEND = 20;
    const renderBlock = (b, idx) => {
      const [day, pid, h, dur, clIdx, svIdx, risk] = b;
      const top = ((h - HSTART) / (HEND - HSTART)) * 100;
      const height = (dur / (HEND - HSTART)) * 100;
      const cl = CLIENTS[clIdx];
      const sv = SERVICES[svIdx];
      const riskBadge = risk === 'low' ? '' : `<span class="s-cal-risk ${risk}"></span>`;
      return `<div class="s-cal-block" data-action="appt-detail" data-arg="${idx}" style="top:${top}%; height:${height}%; --pcol:${PRACT.find(p => p.id === pid).color};">
        <div class="s-cal-name">${cl.i} · ${sv.abbr}</div>
        <div class="s-cal-time">${String(Math.floor(h)).padStart(2,'0')}:${(h%1?'30':'00')} · ${sv.dur} min</div>
        ${riskBadge}
      </div>`;
    };

    const renderCol = (dayIdx, pid) => {
      const blocks = BOOK
        .map((b, i) => [b, i])
        .filter(([b]) => b[0] === dayIdx && b[1] === pid)
        .map(([b, i]) => renderBlock(b, i))
        .join('');
      return `<div class="s-cal-col" data-day="${dayIdx}" data-pract="${pid}">
        ${HOURS.map((h, i) => i === 0 ? '' : `<div class="s-cal-hline" style="top:${(i / (HOURS.length - 1)) * 100}%"></div>`).join('')}
        ${blocks}
      </div>`;
    };

    /* ─ Heatmap : utilisation horaire moyenne sur 7 jours ─ */
    const heatRow = HOURS.map((h, i) => {
      const slot = HSTART + i;
      const booked = BOOK.filter(b => slot >= b[2] && slot < b[2] + b[3]).length;
      const pct = Math.min(100, Math.round((booked / (3 * 7)) * 220));
      return `<div class="s-heat-cell" style="background: rgba(11,110,79, ${0.08 + pct / 140});" title="${h} · ${booked} RDV cumulés">
        <div class="s-heat-h">${h.split(':')[0]}h</div>
      </div>`;
    }).join('');

    /* ─ Waitlist (auto-promote when slot frees) ─ */
    const WAIT = [
      { c: CLIENTS[0], svc: 'Forfait Argan',     pref: 'Mer 14h–17h', auto: true,  ctx: 'Annulation Imane S. → push' },
      { c: CLIENTS[3], svc: 'Massage relaxant',   pref: 'Jeu 16h+',    auto: true,  ctx: 'Première visite — 2 places dispos' },
      { c: CLIENTS[6], svc: 'Hammam traditionnel', pref: 'Sam matin',  auto: false, ctx: 'Préférence Yasmine B.' },
      { c: CLIENTS[2], svc: 'Soin anti-âge',      pref: 'Ven soir',    auto: true,  ctx: 'Avant gala — urgent' },
    ];

    const r = drawer({
      title: 'Calendrier rendez-vous',
      subtitle: 'Spa Bahia · Hivernage · 3 praticiennes',
      width: 1080,
      body: `
        <div class="p-hero" style="background: linear-gradient(135deg, var(--atlas), var(--riad));">
          <div class="l">SEMAINE DU 27 AVRIL · MERCREDI EN COURS</div>
          <div class="big">${todaysCount} <span style="font-size:18px; opacity:0.7;">RDV aujourd'hui</span></div>
          <div class="sub">3 praticiennes · 12 heures d'ouverture · liste d'attente : ${WAIT.length} clientes</div>
        </div>

        <!-- KPI strip 4-up -->
        <div class="s-kpi-strip">
          <div class="s-kpi"><div class="l">TAUX REMPLISSAGE</div><div class="v">${fillRate} <span class="u">%</span></div><div class="sub">vs 64 % la sem. dernière</div></div>
          <div class="s-kpi"><div class="l">RDV AUJOURD'HUI</div><div class="v">${todaysCount}</div><div class="sub">17 confirmés · ${todaysCount - 17 > 0 ? todaysCount - 17 : 0} acomptes attente</div></div>
          <div class="s-kpi"><div class="l">RISQUE NO-SHOW</div><div class="v">${noShowCount}</div><div class="sub">3 modérés · 2 élevés (acompte)</div></div>
          <div class="s-kpi"><div class="l">LISTE D'ATTENTE</div><div class="v">${WAIT.length}</div><div class="sub">${WAIT.filter(w => w.auto).length} en auto-promotion</div></div>
        </div>

        <!-- Toolbar -->
        <div class="p-toolbar" style="margin: 4px 0 14px;">
          <div class="p-search">${SVG('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>')}Rechercher cliente ou téléphone…</div>
          <button class="kb ghost" data-action="appt-filter">${SVG('<path d="M4 6h16M7 12h10M10 18h4"/>',13)}Filtrer</button>
          <button class="kb ghost" data-action="appt-export">${SVG('<path d="M12 3v12M5 10l7 7 7-7M5 21h14"/>',13)}Exporter</button>
          <button class="kb atlas" data-action="appt-new">${ICN.plus}Nouveau RDV</button>
        </div>

        <!-- Practitioner legend -->
        <div class="s-legend">
          ${PRACT.map(p => `<span class="s-legend-it"><i style="background:${p.color};"></i><b>${p.id}</b> ${p.name} <span class="m">· ${p.role}</span></span>`).join('')}
        </div>

        <!-- Calendar grid: hours rail + 7 day columns × 3 practitioner sub-cols -->
        <div class="s-cal-shell">
          <div class="s-cal-rail">
            ${HOURS.map(h => `<div class="s-cal-rail-h">${h}</div>`).join('')}
          </div>
          <div class="s-cal-grid">
            ${DAYS.map((d, di) => `
              <div class="s-cal-day ${di === TODAY_IDX ? 'today' : ''}">
                <div class="s-cal-day-head">${d}${di === TODAY_IDX ? '<span class="s-now">●</span>' : ''}</div>
                <div class="s-cal-day-body">
                  ${PRACT.map(p => renderCol(di, p.id)).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Heatmap row -->
        <div class="s-heat-shell">
          <div class="s-heat-head"><b>Disponibilité moyenne · 7 jours</b><span class="m">Plus c'est sombre, plus le créneau est demandé</span></div>
          <div class="s-heat-row">${heatRow}</div>
        </div>

        <!-- Bottom dual cards: waitlist + channel breakdown -->
        <div class="p-grid-2 s-bottom-grid">
          <div class="p-card">
            <div class="head">
              <h4>Liste d'attente</h4>
              <button class="kb ghost" data-action="appt-wait-add" style="padding:6px 12px; font-size:12px;">+ Ajouter</button>
            </div>
            <div class="s-auto-toggle">
              <label class="s-switch"><input type="checkbox" data-action="appt-auto-toggle" checked><span class="s-slider"></span></label>
              <div><b>Auto-promotion</b><div class="m">Notifie la prochaine cliente dès qu'un créneau se libère</div></div>
            </div>
            ${WAIT.map((w, i) => `
              <div class="s-wait" data-action="appt-wait-detail" data-arg="${i}">
                <div class="s-wait-av" style="background:${w.c.color};">${w.c.i}</div>
                <div class="s-wait-info">
                  <b>${w.c.n}</b>
                  <div class="m">${w.svc} · ${w.pref}</div>
                  <div class="m s-wait-ctx">${w.ctx}</div>
                </div>
                <div class="s-wait-actions">
                  ${w.auto ? chip('Auto', 'ok') : chip('Manuel', 'neutral')}
                  <button class="kb ghost" style="padding:5px 9px; font-size:11px;" data-action="appt-wait-promote" data-arg="${i}">Promouvoir →</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="p-card">
            <div class="head"><h4>Origine des réservations</h4><span class="meta">7 DERNIERS JOURS</span></div>
            ${[
              ['Direct (téléphone, walk-in)', 38, 'var(--atlas)'],
              ['WhatsApp', 27, 'var(--riad)'],
              ['Booking.com Spa', 18, '#D99A2B'],
              ['Treatwell-like (Spa Atlas)', 12, '#7DF2B0'],
              ['Concierge hôtel partenaire', 5, 'var(--n-400)'],
            ].map(([n, p, c]) => `
              <div class="s-chan">
                <div class="s-chan-info"><b>${n}</b><span class="s-chan-pct">${p} %</span></div>
                <div class="s-chan-bar"><div style="width:${p * 2.5}%; background:${c};"></div></div>
              </div>
            `).join('')}
            <div class="rc-foot" style="margin-top:12px;">Booking.com prélève 15 % de commission. Direct + WhatsApp restent vos canaux les plus marges.</div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Fermer</button>
        <button class="kb atlas" data-action="appt-new">${ICN.plus}Nouveau rendez-vous</button>
      `,
    });
    r.el.querySelector('.kiwi-drawer').classList.add('page-xl');

    /* ─ Slot click → nested drawer with full booking details ─ */
    setTimeout(() => {
      r.el.addEventListener('click', (e) => {
        const dismiss = e.target.closest('[data-dismiss]');
        if (dismiss) { r.close(); return; }
        const block = e.target.closest('[data-action="appt-detail"]');
        if (block) {
          e.stopPropagation();
          const idx = +block.dataset.arg;
          openBookingDetail(BOOK[idx]);
        }
        const promote = e.target.closest('[data-action="appt-wait-promote"]');
        if (promote) {
          e.stopPropagation();
          const i = +promote.dataset.arg;
          const w = WAIT[i];
          toast('Cliente promue', { type: 'success', desc: `${w.c.n} reçoit un SMS « créneau dispo » à l'instant.` });
        }
      }, true);
    }, 60);

    /* ─ Booking detail (nested drawer) ─ */
    function openBookingDetail(b) {
      const [day, pid, h, dur, clIdx, svIdx, risk, status, notes] = b;
      const cl = CLIENTS[clIdx];
      const sv = SERVICES[svIdx];
      const pr = PRACT.find(p => p.id === pid);
      const sd = drawer({
        title: `RDV · ${cl.n}`,
        subtitle: `${DAYS[day]} · ${String(Math.floor(h)).padStart(2,'0')}:${h%1?'30':'00'} · ${sv.dur} min`,
        width: 460,
        body: `
          <div class="s-detail-hero" style="background: linear-gradient(135deg, ${pr.color}, var(--ink));">
            <div class="l">${DAYS[day].toUpperCase()} · ${String(Math.floor(h)).padStart(2,'0')}:${h%1?'30':'00'}</div>
            <div class="big">${sv.name}</div>
            <div class="sub">${pr.name} · ${sv.room}</div>
          </div>

          <div class="s-detail-grid">
            <div><div class="l">CLIENTE</div><div class="v">${cl.n}</div><div class="sub">${cl.tag}</div></div>
            <div><div class="l">SERVICE</div><div class="v">${sv.dur} min · ${fmt(sv.price)} MAD</div><div class="sub">${sv.notes}</div></div>
            <div><div class="l">PRATICIENNE</div><div class="v">${pr.name}</div><div class="sub">${pr.role}</div></div>
            <div><div class="l">SALLE</div><div class="v">${sv.room}</div><div class="sub">Niveau requis : ${sv.skill}</div></div>
          </div>

          <div class="s-detail-meta">
            <div class="s-meta-row"><span>Risque no-show</span>${riskChip(risk)}</div>
            <div class="s-meta-row"><span>Statut paiement</span>${status === 'ok' ? chip('Acompte reçu', 'ok') : chip('Acompte attente', 'pend')}</div>
            <div class="s-meta-row"><span>Rappel WhatsApp J-1</span>${chip('Programmé 18h', 'neutral')}</div>
          </div>

          ${notes ? `<div class="s-detail-notes"><b>Notes praticienne</b><p>${notes}</p></div>` : ''}

          ${sv.contras.length ? `<div class="s-detail-contras">
            <b>Contre-indications</b>
            <div class="s-contra-row">${sv.contras.map(c => chip(c, 'pend')).join(' ')}</div>
          </div>` : ''}
        `,
        foot: `
          <div class="s-foot-row">
            <button class="kb ghost" data-action="appt-cancel">${ICN.trash}Annuler</button>
            <button class="kb ghost" data-action="appt-reschedule">${ICN.cal}Reprogrammer</button>
            <button class="kb atlas" data-action="appt-confirm-final">${ICN.bell}Confirmer</button>
          </div>
        `,
      });
      // Wire up footer
      setTimeout(() => {
        sd.el.addEventListener('click', (ev) => {
          if (ev.target.closest('[data-action="appt-cancel"]')) {
            modal({
              title: 'Annuler ce rendez-vous ?',
              desc: `${cl.n} sera notifiée par WhatsApp. Si un acompte a été versé, il est conservé en avoir.`,
              body: '',
              foot: `<button class="kb ghost" data-dismiss>Garder</button><button class="kb danger" data-action="appt-cancel-confirm">Annuler le RDV</button>`,
            });
          }
          if (ev.target.closest('[data-action="appt-reschedule"]')) {
            toast('Lien de reprogrammation envoyé', { type: 'info', desc: `${cl.n} pourra choisir un nouveau créneau via WhatsApp.` });
          }
          if (ev.target.closest('[data-action="appt-confirm-final"]')) {
            sd.close();
            confetti();
            toast('RDV confirmé', { type: 'success', desc: `${cl.n} · ${sv.name} · ${pr.name}` });
          }
        });
      }, 60);
    }
  };

  /* ─── Aux handlers used inside the appointments drawer ─── */
  handlers['appt-filter']      = () => toast('Filtres', { type: 'info', desc: 'Praticienne, service, statut, risque no-show — choix multi.' });
  handlers['appt-export']      = () => toast('Planning exporté', { type: 'success', desc: '7 jours en PDF + iCal · envoyé à l\'équipe.' });
  handlers['appt-wait-add']    = () => toast('Ajout liste d\'attente', { type: 'info', desc: 'Saisissez la cliente et la préférence de créneau.' });
  handlers['appt-auto-toggle'] = () => toast('Auto-promotion mise à jour', { type: 'info', desc: 'Les annulations envoient désormais un SMS instantané.' });
  handlers['appt-wait-detail'] = () => toast('Détail liste d\'attente', { type: 'info', desc: 'Historique de visites · pref. praticienne · canal de rappel.' });
  handlers['appt-cancel-confirm'] = () => {
    document.querySelectorAll('.kiwi-backdrop').forEach(b => b.querySelector('.kiwi-modal-close')?.click());
    toast('RDV annulé', { type: 'warn', desc: 'WhatsApp envoyé · acompte converti en avoir 90 jours.' });
  };

  /* ─── Wizard: nouvelle réservation ─── */
  handlers['appt-new'] = () => {
    let step = 1, picked = { service: null, pract: null, date: null, time: null, client: null };

    const wizBody = () => {
      const stepsBar = `<div class="wiz-steps">
        ${[1,2,3,4,5,6].map(s => `<div class="wiz-step ${s < step ? 'done' : s === step ? 'active' : ''}"></div>`).join('')}
      </div>`;
      let content = '';
      if (step === 1) {
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">1. Choisir un service</h4>
          <div class="s-wiz-grid">
            ${SERVICES.slice(0, 8).map((s, i) => `
              <div class="wiz-choice ${picked.service === i ? 'selected' : ''}" data-pick-svc="${i}">
                <div class="wc-ic">${ICN.sparkle}</div>
                <div><div class="wc-t">${s.name}</div><div class="wc-d">${s.dur} min · ${fmt(s.price)} MAD · ${s.room}</div></div>
              </div>
            `).join('')}
          </div>`;
      } else if (step === 2) {
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">2. Choisir une praticienne</h4>
          <div class="s-wiz-grid">
            ${PRACT.map((p, i) => `
              <div class="wiz-choice ${picked.pract === i ? 'selected' : ''}" data-pick-pract="${i}">
                <div class="wc-ic" style="background:${p.color}; color:var(--paper);">${p.id}</div>
                <div><div class="wc-t">${p.name}</div><div class="wc-d">${p.role} · niveau ${p.skill}</div></div>
              </div>
            `).join('')}
          </div>`;
      } else if (step === 3) {
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">3. Choisir un jour</h4>
          <div class="s-wiz-days">
            ${['Lun 27','Mar 28','Mer 29','Jeu 30','Ven 1','Sam 2','Dim 3'].map((d, i) => `
              <button class="s-wiz-day ${picked.date === i ? 'on' : ''}" data-pick-date="${i}">
                <span class="d">${d.split(' ')[0]}</span>
                <span class="n">${d.split(' ')[1]}</span>
              </button>
            `).join('')}
          </div>`;
      } else if (step === 4) {
        const slots = ['09:00','09:30','10:30','11:00','12:00','14:00','14:30','15:00','16:00','17:00','17:30','18:30'];
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">4. Choisir un créneau</h4>
          <div class="s-wiz-times">
            ${slots.map((t, i) => `
              <button class="s-wiz-time ${picked.time === i ? 'on' : ''}" data-pick-time="${i}">${t}</button>
            `).join('')}
          </div>
          <div class="kf-help" style="margin-top:14px;">Les créneaux grisés sont déjà occupés par un autre RDV.</div>`;
      } else if (step === 5) {
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">5. Cliente</h4>
          <div class="kf-group"><label class="kf-label">Nom complet</label><input class="kf-input" placeholder="ex. Sophie Lambert" id="wiz-cl-n" value="${picked.client?.n || ''}"></div>
          <div class="kf-row">
            <div class="kf-group"><label class="kf-label">Téléphone</label><input class="kf-input" placeholder="+212 6 ..." id="wiz-cl-p" value="${picked.client?.p || ''}"></div>
            <div class="kf-group"><label class="kf-label">Email (optionnel)</label><input class="kf-input" placeholder="cliente@email.com" id="wiz-cl-e" value="${picked.client?.e || ''}"></div>
          </div>
          <div class="kf-group"><label class="kf-label">Notes (allergies, préférences)</label><textarea class="kf-input" rows="2" placeholder="ex. allergie parabènes" id="wiz-cl-nt">${picked.client?.nt || ''}</textarea></div>`;
      } else if (step === 6) {
        const sv = SERVICES[picked.service ?? 0];
        const pr = PRACT[picked.pract ?? 0];
        const dy = ['Lun 27','Mar 28','Mer 29','Jeu 30','Ven 1','Sam 2','Dim 3'][picked.date ?? 0];
        const tm = ['09:00','09:30','10:30','11:00','12:00','14:00','14:30','15:00','16:00','17:00','17:30','18:30'][picked.time ?? 0];
        content = `
          <h4 style="margin:0 0 12px; font-size:15px;">6. Récapitulatif</h4>
          <div class="s-wiz-recap">
            <div class="s-rec-line"><span>Service</span><b>${sv.name}</b></div>
            <div class="s-rec-line"><span>Praticienne</span><b>${pr.name}</b></div>
            <div class="s-rec-line"><span>Date · heure</span><b>${dy} · ${tm}</b></div>
            <div class="s-rec-line"><span>Salle</span><b>${sv.room}</b></div>
            <div class="s-rec-line"><span>Cliente</span><b>${picked.client?.n || '—'}</b></div>
            <div class="s-rec-line"><span>Téléphone</span><b>${picked.client?.p || '—'}</b></div>
            <div class="s-rec-total"><span>Total</span><b>${fmt(sv.price)} MAD</b></div>
          </div>
          <label class="s-rec-check"><input type="checkbox" id="wiz-deposit"><span>Demander un acompte de 30 %</span></label>
          <label class="s-rec-check"><input type="checkbox" id="wiz-wa" checked><span>Confirmation WhatsApp automatique</span></label>`;
      }
      return stepsBar + content;
    };

    const m = modal({
      title: 'Nouveau rendez-vous',
      tag: 'SPA BAHIA',
      desc: 'Service → praticienne → date → heure → cliente → confirmation',
      body: wizBody(),
      foot: `
        <button class="kb ghost" data-action="wiz-back">Retour</button>
        <button class="kb atlas" data-action="wiz-next">Suivant →</button>
      `,
      width: 580,
    });

    const refresh = () => { m.el.querySelector('.kiwi-modal-body').innerHTML = wizBody(); };

    setTimeout(() => {
      m.el.addEventListener('click', (e) => {
        const svc = e.target.closest('[data-pick-svc]'); if (svc) { picked.service = +svc.dataset.pickSvc; refresh(); }
        const pr  = e.target.closest('[data-pick-pract]'); if (pr) { picked.pract   = +pr.dataset.pickPract; refresh(); }
        const dt  = e.target.closest('[data-pick-date]'); if (dt) { picked.date    = +dt.dataset.pickDate; refresh(); }
        const tm  = e.target.closest('[data-pick-time]'); if (tm) { picked.time    = +tm.dataset.pickTime; refresh(); }
        if (e.target.closest('[data-action="wiz-back"]')) { if (step > 1) { step--; refresh(); } else { m.close(); } }
        if (e.target.closest('[data-action="wiz-next"]')) {
          if (step === 5) {
            picked.client = {
              n:  m.el.querySelector('#wiz-cl-n')?.value || 'Cliente',
              p:  m.el.querySelector('#wiz-cl-p')?.value || '',
              e:  m.el.querySelector('#wiz-cl-e')?.value || '',
              nt: m.el.querySelector('#wiz-cl-nt')?.value || '',
            };
          }
          if (step === 6) {
            m.close();
            confetti();
            const sv = SERVICES[picked.service ?? 0];
            toast('Rendez-vous confirmé', { type: 'success', desc: `${picked.client?.n || 'Cliente'} · ${sv.name} · WhatsApp envoyé.` });
            return;
          }
          if (step < 6) { step++; refresh(); }
          if (step === 6) m.el.querySelector('[data-action="wiz-next"]').textContent = 'Confirmer · envoyer WhatsApp';
        }
      });
    }, 60);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   * 2. nav-services — Catalogue services & forfaits (Spa Bahia)
   * ═════════════════════════════════════════════════════════════════════ */
  handlers['nav-services'] = () => {
    const TABS = [
      { k: 'massage', n: 'Massages',          c: 5 },
      { k: 'facial',  n: 'Soins du visage',   c: 2 },
      { k: 'hammam',  n: 'Hammam & gommages', c: 4 },
      { k: 'day',     n: 'Forfaits journée',  c: 3 },
      { k: 'cure',    n: 'Cures multi-séances', c: 3 },
    ];
    const PACKAGES = [
      { n: 'Forfait Argan',          dur: '90 min',  p: 850,  desc: 'Hammam traditionnel + gommage + massage relaxant 30 min',         tag: 'Best-seller', sales: 38 },
      { n: 'Cure 4 séances',         dur: '4 × 60',  p: 2400, desc: 'Massage relaxant ou californien · valable 90 jours',              tag: 'Cure',        sales: 22 },
      { n: 'Soirée détente couple',  dur: '2 h',     p: 1980, desc: 'Hammam privatif + massage couple 60 min + thé à la menthe',       tag: 'Couple',      sales: 14 },
      { n: 'Mariée du jour',         dur: '4 h',     p: 4200, desc: 'Hammam + gommage rhassoul + soin visage + massage + manucure',    tag: 'Premium',     sales: 6  },
    ];
    const CURES = [
      { n: 'Cure Anti-âge · 5 séances', dur: '5 × 75', p: 3600, desc: 'Soin anti-âge LED · 1 séance / semaine pendant 5 sem.',         sales: 9 },
      { n: 'Cure Hammam mensuelle',     dur: 'illim.', p: 900,  desc: 'Accès illimité hammam + 2 gommages / mois · récurrent',         sales: 28 },
      { n: 'Cure Sportif récup.',       dur: '6 × 60', p: 2700, desc: 'Massage thérapeutique + réflexologie alternés',                 sales: 4 },
    ];

    const renderTabBody = (k) => {
      if (k === 'day') {
        return PACKAGES.map((p, i) => `
          <div class="s-pkg-card" data-action="svc-pkg-edit" data-arg="${i}">
            <div class="s-pkg-tag">${p.tag.toUpperCase()}</div>
            <h5>${p.n}</h5>
            <div class="s-pkg-meta">${p.dur} · ${fmt(p.p)} MAD</div>
            <p class="s-pkg-desc">${p.desc}</p>
            <div class="s-pkg-foot">
              <span class="meta">${p.sales} ventes / 30 j</span>
              <button class="kb ghost" style="padding:5px 10px; font-size:11.5px;" data-action="svc-pkg-edit" data-arg="${i}">${ICN.edit}Modifier</button>
            </div>
          </div>
        `).join('');
      }
      if (k === 'cure') {
        return CURES.map((c, i) => `
          <div class="s-pkg-card" data-action="svc-cure-edit" data-arg="${i}">
            <div class="s-pkg-tag" style="background: var(--ink); color: var(--mint);">CURE MULTI-SÉANCES</div>
            <h5>${c.n}</h5>
            <div class="s-pkg-meta">${c.dur} · ${fmt(c.p)} MAD</div>
            <p class="s-pkg-desc">${c.desc}</p>
            <div class="s-pkg-foot">
              <span class="meta">${c.sales} cures actives</span>
              <button class="kb ghost" style="padding:5px 10px; font-size:11.5px;">${ICN.edit}Modifier</button>
            </div>
          </div>
        `).join('');
      }
      const items = SERVICES.filter(s => s.cat === k).sort((a, b) => a.sales - b.sales);
      return `
        <table class="p-table s-svc-table">
          <thead><tr>
            <th>SERVICE</th><th class="right">DURÉE</th><th class="right">PRIX</th>
            <th>SALLE</th><th>NIVEAU</th><th>CONTRE-INDICATIONS</th><th class="right">RANG 30J</th><th></th>
          </tr></thead>
          <tbody>
            ${items.map((s, i) => `
              <tr data-action="svc-edit" data-arg="${SERVICES.indexOf(s)}">
                <td><b>${s.name}</b><div class="s-svc-notes">${s.notes || ''}</div></td>
                <td class="mono right">${s.dur} min</td>
                <td class="mono right">${fmt(s.price)} MAD</td>
                <td><span class="s-room-pill">${s.room}</span></td>
                <td><span class="s-skill ${s.skill}">${s.skill}</span></td>
                <td>${s.contras.length ? s.contras.map(c => `<span class="chip pend" style="margin-right:4px;">${c}</span>`).join('') : '<span style="color:var(--n-400);">—</span>'}</td>
                <td class="mono right"><b>#${s.sales + 1}</b></td>
                <td><button class="kb ghost" style="padding:4px 8px; font-size:11px;" data-action="svc-edit" data-arg="${SERVICES.indexOf(s)}">${ICN.edit}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    const r = drawer({
      title: 'Services & forfaits',
      subtitle: 'Spa Bahia · catalogue complet · 17 prestations',
      width: 980,
      body: `
        <div class="p-hero" style="background: linear-gradient(135deg, var(--atlas), var(--riad));">
          <div class="l">CATALOGUE COMPLET</div>
          <div class="big">${SERVICES.length + PACKAGES.length + CURES.length} <span style="font-size:18px; opacity:0.7;">prestations actives</span></div>
          <div class="sub">12 services à la carte · 4 forfaits journée · 3 cures · ticket moyen 612 MAD</div>
        </div>

        <!-- AI insight banner -->
        <div class="s-ai-banner">
          <div class="s-ai-ic">${ICN.sparkle}</div>
          <div>
            <div class="s-ai-title">Forfait Argan en hausse de 24 % MoM</div>
            <div class="s-ai-desc">Vos clientes touristes le préfèrent à la carte 2× sur 3. Considérez un upsell « Argan Deluxe » à +250 MAD avec massage 60 min.</div>
          </div>
          <button class="kb ghost" style="padding:7px 12px; font-size:12px;" data-action="svc-ai-action">Créer Argan Deluxe</button>
        </div>

        <!-- Toolbar -->
        <div class="p-toolbar" style="margin: 4px 0 14px;">
          <div class="p-search">${SVG('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>')}Rechercher un service…</div>
          <button class="kb ghost" data-action="svc-season">${ICN.cal}Programmation saisonnière</button>
          <button class="kb ghost" data-action="svc-export">${SVG('<path d="M12 3v12M5 10l7 7 7-7M5 21h14"/>',13)}Exporter</button>
          <button class="kb atlas" data-action="svc-new">${ICN.plus}Nouveau service</button>
        </div>

        <!-- Tabs -->
        <div class="resv-tabs s-tabs" role="tablist">
          ${TABS.map((t, i) => `
            <button class="resv-tab ${i === 0 ? 'on' : ''}" data-svc-tab="${t.k}">
              ${t.n} <span class="s-tab-count">${t.c}</span>
            </button>
          `).join('')}
        </div>

        ${TABS.map((t, i) => `
          <div class="resv-pane s-svc-pane" data-svc-pane="${t.k}" ${i === 0 ? '' : 'hidden'}>
            ${renderTabBody(t.k)}
          </div>
        `).join('')}

        <!-- Combo / Forfait packages quick editor -->
        <div class="p-card" style="margin-top:18px;">
          <div class="head">
            <h4>Combos & forfaits · vue rapide</h4>
            <span class="meta">4 PACKAGES · 80 VENTES / 30 J</span>
          </div>
          <div class="s-combo-grid">
            ${PACKAGES.map((p, i) => `
              <div class="s-combo" data-action="svc-pkg-edit" data-arg="${i}">
                <div class="s-combo-tag">${p.tag}</div>
                <b>${p.n}</b>
                <div class="m">${p.dur} · ${fmt(p.p)} MAD</div>
                <div class="s-combo-sales">${p.sales} ventes / 30 j</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Seasonal scheduler -->
        <div class="p-card s-season-card">
          <div class="head">
            <h4>Programmation saisonnière</h4>
            <span class="meta">2 PROGRAMMES ACTIFS</span>
          </div>
          <div class="s-season-grid">
            <div class="s-season">
              <div class="s-season-h"><b>Menu Ramadan</b><span class="chip ok">Actif jusqu'au 9 mai</span></div>
              <p class="s-season-d">Soins plus calmes après ftour · gommage rhassoul + massage 30 min en duo · horaires 21h–01h.</p>
              <button class="kb ghost" style="padding:6px 12px; font-size:12px;" data-action="svc-season-edit">${ICN.edit}Modifier</button>
            </div>
            <div class="s-season">
              <div class="s-season-h"><b>Menu Été · gommage corps boost</b><span class="chip neutral">Programmé · 1 juin</span></div>
              <p class="s-season-d">Promotion gommage corps + enveloppement boue · −15 % avant 12h · push WhatsApp à 9h.</p>
              <button class="kb ghost" style="padding:6px 12px; font-size:12px;" data-action="svc-season-edit">${ICN.edit}Modifier</button>
            </div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Fermer</button>
        <button class="kb atlas" data-action="svc-new">${ICN.plus}Ajouter un service</button>
      `,
    });
    r.el.querySelector('.kiwi-drawer').classList.add('page-xl');

    /* ─ Tab switcher ─ */
    setTimeout(() => {
      r.el.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-svc-tab]');
        if (tab) {
          const k = tab.dataset.svcTab;
          r.el.querySelectorAll('[data-svc-tab]').forEach(t => t.classList.toggle('on', t.dataset.svcTab === k));
          r.el.querySelectorAll('[data-svc-pane]').forEach(p => { p.hidden = (p.dataset.svcPane !== k); });
        }
        if (e.target.closest('[data-dismiss]')) r.close();
        const editRow = e.target.closest('[data-action="svc-edit"]');
        if (editRow) {
          e.stopPropagation();
          openServiceModal(SERVICES[+editRow.dataset.arg], +editRow.dataset.arg);
        }
        const pkgEdit = e.target.closest('[data-action="svc-pkg-edit"]');
        if (pkgEdit) {
          e.stopPropagation();
          openPackageModal(PACKAGES[+pkgEdit.dataset.arg]);
        }
      });
    }, 60);

    /* ─ Service add / edit modal ─ */
    function openServiceModal(svc, idx) {
      const isEdit = !!svc;
      const data = svc || { name: '', cat: 'massage', dur: 60, price: 500, room: 'Salon 1', skill: 'sénior', contras: [], notes: '' };
      const m = modal({
        title: isEdit ? `Modifier · ${data.name}` : 'Nouveau service',
        tag: 'SPA BAHIA',
        desc: 'Tous les champs sont sauvegardés en local. Publication immédiate sur les canaux actifs.',
        body: `
          <div class="kf-group"><label class="kf-label">Nom du service</label><input class="kf-input" id="sv-n" value="${data.name}" placeholder="ex. Massage californien"></div>
          <div class="kf-row">
            <div class="kf-group"><label class="kf-label">Catégorie</label>
              <select class="kf-input" id="sv-c">
                ${TABS.filter(t => t.k !== 'day' && t.k !== 'cure').map(t => `<option value="${t.k}" ${data.cat === t.k ? 'selected' : ''}>${t.n}</option>`).join('')}
              </select>
            </div>
            <div class="kf-group"><label class="kf-label">Durée (min)</label>
              <select class="kf-input" id="sv-d">
                ${[30,45,60,75,90,120].map(d => `<option ${data.dur === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="kf-row">
            <div class="kf-group"><label class="kf-label">Prix (MAD)</label><input class="kf-input" id="sv-p" type="number" value="${data.price}"></div>
            <div class="kf-group"><label class="kf-label">Salle</label>
              <select class="kf-input" id="sv-r">
                ${['Salon 1','Salon 2','Salon 3','Hammam','Cabine humide','Salon 1+2'].map(rm => `<option ${data.room === rm ? 'selected' : ''}>${rm}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="kf-group"><label class="kf-label">Niveau praticienne</label>
            <div class="s-pick-row">
              ${['junior','sénior','certifié'].map(sk => `<button class="s-pick ${data.skill === sk ? 'on' : ''}" data-pick-skill="${sk}">${sk}</button>`).join('')}
            </div>
          </div>
          <div class="kf-group"><label class="kf-label">Contre-indications (séparées par virgule)</label>
            <input class="kf-input" id="sv-ct" value="${data.contras.join(', ')}" placeholder="ex. Grossesse 1ᵉʳ trim., Hypertension">
          </div>
          <div class="kf-group"><label class="kf-label">Notes praticienne</label>
            <textarea class="kf-input" rows="2" id="sv-nt">${data.notes || ''}</textarea>
          </div>
        `,
        foot: `
          ${isEdit ? '<button class="kb danger" data-action="sv-delete">Supprimer</button>' : ''}
          <button class="kb ghost" data-dismiss>Annuler</button>
          <button class="kb atlas" data-action="sv-save">${isEdit ? 'Enregistrer' : 'Publier le service'}</button>
        `,
        width: 600,
      });
      setTimeout(() => {
        let pickedSkill = data.skill;
        m.el.addEventListener('click', (ev) => {
          const sk = ev.target.closest('[data-pick-skill]');
          if (sk) {
            pickedSkill = sk.dataset.pickSkill;
            m.el.querySelectorAll('[data-pick-skill]').forEach(b => b.classList.toggle('on', b.dataset.pickSkill === pickedSkill));
          }
          if (ev.target.closest('[data-action="sv-save"]')) {
            const name = m.el.querySelector('#sv-n').value || 'Sans titre';
            m.close();
            if (!isEdit) confetti();
            toast(isEdit ? 'Service mis à jour' : 'Service publié', {
              type: 'success',
              desc: `${name} · synchronisé sur tablette · WhatsApp · Booking.com.`,
            });
          }
          if (ev.target.closest('[data-action="sv-delete"]')) {
            modal({
              title: 'Supprimer ce service ?',
              desc: 'Les RDV déjà confirmés sont conservés. Le service sera retiré du catalogue public.',
              foot: `<button class="kb ghost" data-dismiss>Garder</button><button class="kb danger" data-action="sv-delete-confirm">Supprimer</button>`,
              width: 460,
            });
          }
          if (ev.target.closest('[data-action="sv-delete-confirm"]')) {
            document.querySelectorAll('.kiwi-backdrop').forEach(b => b.querySelector('.kiwi-modal-close')?.click());
            toast('Service supprimé', { type: 'warn', desc: 'Retiré du catalogue · 0 RDV impactés.' });
          }
          if (ev.target.closest('[data-dismiss]')) m.close();
        });
      }, 60);
    }

    /* ─ Package edit modal ─ */
    function openPackageModal(pkg) {
      modal({
        title: `Forfait · ${pkg.n}`,
        tag: 'COMBO',
        desc: pkg.desc,
        body: `
          <div class="s-rec-line"><span>Durée totale</span><b>${pkg.dur}</b></div>
          <div class="s-rec-line"><span>Prix forfait</span><b>${fmt(pkg.p)} MAD</b></div>
          <div class="s-rec-line"><span>Économie cliente</span><b style="color:var(--atlas);">−180 MAD vs à la carte</b></div>
          <div class="s-rec-line"><span>Ventes 30 j</span><b>${pkg.sales}</b></div>
          <div class="s-rec-line"><span>Annulation</span><b>72h avant · sans frais</b></div>
        `,
        foot: `<button class="kb ghost" data-dismiss>Fermer</button><button class="kb atlas" data-action="pkg-edit-go">${ICN.edit}Modifier le contenu</button>`,
        width: 540,
      });
    }
  };

  /* ─── Aux handlers used inside the services drawer ─── */
  handlers['svc-export']      = () => toast('Catalogue exporté', { type: 'success', desc: 'PDF tarifaire prêt à imprimer + flux Booking.com mis à jour.' });
  handlers['svc-season']      = () => toast('Programmation saisonnière', { type: 'info', desc: 'Définissez Ramadan, été, fêtes — Kiwi switch automatiquement.' });
  handlers['svc-season-edit'] = () => toast('Édition programme', { type: 'info', desc: 'Ajustez horaires, services actifs, promotions.' });
  handlers['svc-ai-action']   = () => {
    confetti();
    toast('Argan Deluxe créé', { type: 'success', desc: 'Brouillon ajouté · prêt à publier après validation prix.' });
  };
  handlers['pkg-edit-go']     = () => toast('Édition forfait', { type: 'info', desc: 'Composition modifiable séance par séance.' });

})();

/* ═══ Section 2 spa · practitioners ═══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Spa Bahia · Praticien·ne·s handler (sidebar)
 * Mindbody / Booksy-tier polish — staff cards, commission calc, certs.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const Kiwi = window.Kiwi || {};
  const handlers = Kiwi.handlers;
  if (!handlers) return;
  const { toast, modal, drawer } = Kiwi;

  /* ─── Inject scoped styles (idempotent) ─── */
  if (!document.getElementById('kiwi-spa-prac-css')) {
    const style = document.createElement('style');
    style.id = 'kiwi-spa-prac-css';
    style.textContent = `
    .pr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 820px) { .pr-grid { grid-template-columns: 1fr; } }
    .pr-card { background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 16px; padding: 18px; transition: border-color 160ms; }
    html[data-theme="dark"] .pr-card { background: var(--paper-muted); }
    .pr-card:hover { border-color: var(--atlas); }
    .pr-card .top { display: grid; grid-template-columns: 80px 1fr auto; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
    .pr-blob { width: 80px; height: 80px; border-radius: 22px; display: flex; align-items: center; justify-content: center; color: var(--paper); font-weight: 600; font-size: 26px; letter-spacing: -0.04em; position: relative; overflow: hidden; }
    .pr-blob::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 28% 20%, rgba(255,255,255,0.28), transparent 55%); border-radius: 22px; }
    .pr-blob.a { background: linear-gradient(135deg, var(--atlas), var(--riad)); }
    .pr-blob.b { background: linear-gradient(135deg, #D99A2B, #8A6210); }
    .pr-blob.c { background: linear-gradient(135deg, var(--atlas-700, #054C36), var(--atlas)); }
    .pr-card .nm { font-weight: 600; font-size: 16px; letter-spacing: -0.015em; }
    .pr-card .rl { font-size: 12px; color: var(--n-500); margin-top: 3px; line-height: 1.4; }
    .pr-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 10.5px; font-family: var(--mono); letter-spacing: 0.06em; font-weight: 600; }
    .pr-badge.sr { background: var(--mint-soft); color: var(--riad); }
    .pr-badge.cf { background: rgba(217,154,43,0.16); color: #8A6210; }
    .pr-badge.jr { background: rgba(11,110,79,0.1); color: var(--atlas); }
    .pr-bio { font-size: 12.5px; color: var(--n-600); line-height: 1.5; margin: 4px 0 12px; }
    .pr-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }
    .pr-chip { font-size: 11px; padding: 3px 9px; border-radius: 999px; background: #fff; border: 1px solid var(--n-200); color: var(--n-700); font-weight: 500; }
    html[data-theme="dark"] .pr-chip { background: var(--paper); }
    .pr-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px 0; border-top: 1px solid var(--n-200); border-bottom: 1px solid var(--n-200); margin-bottom: 12px; }
    .pr-kpis .k { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--n-500); font-family: var(--mono); }
    .pr-kpis .v { font-family: var(--mono); font-weight: 600; font-size: 14px; margin-top: 3px; letter-spacing: -0.01em; font-feature-settings: "tnum" 1; }
    .pr-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 12px; }
    .pr-day { aspect-ratio: 1; border-radius: 6px; background: var(--n-100); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--mono); font-size: 9px; color: var(--n-500); }
    .pr-day.busy { background: var(--mint-soft); color: var(--riad); }
    .pr-day.full { background: var(--atlas); color: var(--mint); }
    .pr-day.off { background: transparent; border: 1px dashed var(--n-200); }
    .pr-day .d { font-weight: 600; font-size: 10px; }
    .pr-day .h { font-size: 8.5px; opacity: 0.85; margin-top: 1px; }
    .pr-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .pr-actions .kb { padding: 8px 10px; font-size: 11.5px; justify-content: center; }
    .pr-cert { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--n-200); font-size: 12.5px; }
    .pr-cert:last-child { border-bottom: 0; }
    .pr-cert .n { font-weight: 500; }
    .pr-cert .m { font-size: 11px; color: var(--n-500); margin-top: 2px; font-family: var(--mono); letter-spacing: 0.04em; }
    .pr-cert-stat { font-size: 10.5px; padding: 3px 9px; border-radius: 999px; font-family: var(--mono); font-weight: 600; letter-spacing: 0.04em; }
    .pr-cert-stat.ok { background: #E3F7EC; color: var(--atlas-700, #054C36); }
    .pr-cert-stat.warn { background: #FFF4DD; color: #8A6210; }
    .pr-cert-stat.exp { background: #FDE8E4; color: #9B2F22; }
    .pr-calc-out { background: linear-gradient(135deg, var(--atlas), var(--riad)); color: var(--paper); border-radius: 14px; padding: 18px; margin-top: 14px; }
    .pr-calc-out .l { font-size: 10.5px; font-family: var(--mono); letter-spacing: 0.1em; color: var(--mint); text-transform: uppercase; }
    .pr-calc-out .v { font-size: 32px; font-weight: 600; letter-spacing: -0.025em; margin-top: 4px; font-feature-settings: "tnum" 1; }
    .pr-calc-out .br { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(125,242,176,0.18); font-size: 12px; }
    .pr-calc-out .br span { color: #c6ead4; font-family: var(--mono); }
    .pr-calc-out .br b { color: var(--paper); font-family: var(--mono); font-weight: 600; }
    `;
    document.head.appendChild(style);
  }

  /* ─── Practitioner data (Spa Bahia, Hivernage) ─── */
  const PRACS = [
    {
      id: 'NH', cls: 'a', name: 'Nour El Hassan', role: 'Esthéticienne sénior · 8 ans',
      badge: ['sr', 'sénior'],
      bio: 'Référente visage anti-âge et soins thérapeutiques. Formatrice interne pour les nouvelles arrivantes.',
      specialties: ['Visage anti-âge', 'Massages thérapeutiques', 'Drainage lymphatique', 'Soins haute technologie'],
      certs: [
        { n: 'CIDESCO Suisse · diplôme international', d: 'Renouvelée 2024', s: 'ok', sl: 'À jour' },
        { n: 'École de massage thérapeutique · Marrakech', d: 'Obtenue 2018', s: 'ok', sl: 'À jour' },
        { n: 'RNCP niveau 5 · esthétique avancée', d: 'Renouv. déc. 2026', s: 'warn', sl: 'Bientôt' },
      ],
      commission: 25, rdv: 84, revenue: 38600, nps: 92, retention: 78,
      week: ['busy', 'full', 'busy', 'full', 'full', 'off', 'off'],
      hours: ['10', '8', '9', '8', '8', '—', '—'],
    },
    {
      id: 'SB', cls: 'b', name: 'Salma Benkirane', role: 'Esthéticienne certifiée · 5 ans',
      badge: ['cf', 'certifiée'],
      bio: 'Spécialisée en soins de relaxation et rituels corps. Très demandée sur les forfaits couples.',
      specialties: ['Massages relaxants', 'Gommages corps', 'Rituel marocain', 'Massage pierres chaudes'],
      certs: [
        { n: 'CIDESCO Suisse · diplôme international', d: 'Obtenue 2021', s: 'ok', sl: 'À jour' },
        { n: 'Certification massage californien · Casablanca', d: 'Obtenue 2022', s: 'ok', sl: 'À jour' },
        { n: 'Recyclage hygiène & protocoles HACCP', d: 'Renouv. juin 2026', s: 'warn', sl: 'Bientôt' },
      ],
      commission: 22, rdv: 72, revenue: 28200, nps: 88, retention: 71,
      week: ['busy', 'busy', 'full', 'busy', 'busy', 'full', 'off'],
      hours: ['7', '7', '9', '8', '7', '9', '—'],
    },
    {
      id: 'YB', cls: 'c', name: 'Yasmine Bouchikhi', role: 'Praticienne junior · 2 ans',
      badge: ['jr', 'junior'],
      bio: 'Hammam traditionnel et modelages détente. En cours de certification CIDESCO pour passage certifiée.',
      specialties: ['Hammam traditionnel', 'Modelages pieds', 'Gommage savon noir', 'Réflexologie plantaire'],
      certs: [
        { n: 'École hammam Marrakech · diplôme', d: 'Obtenue 2023', s: 'ok', sl: 'À jour' },
        { n: 'CIDESCO niveau 1 · en formation', d: 'Examen oct. 2026', s: 'warn', sl: 'En cours' },
        { n: 'Recyclage premiers secours SST', d: 'Expirée fév. 2026', s: 'exp', sl: 'Renouveler' },
      ],
      commission: 18, rdv: 56, revenue: 18400, nps: 84, retention: 62,
      week: ['off', 'busy', 'busy', 'full', 'busy', 'full', 'busy'],
      hours: ['—', '7', '7', '8', '7', '8', '6'],
    },
  ];

  const fmt = (n) => n.toLocaleString('fr-FR').replace(/,/g, ' ');
  const dows = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  function renderCard(p) {
    const [bcls, blbl] = p.badge;
    return `
      <div class="pr-card" data-prac="${p.id}">
        <div class="top">
          <div class="pr-blob ${p.cls}">${p.id}</div>
          <div>
            <div class="nm">${p.name}</div>
            <div class="rl">${p.role}</div>
            <div class="pr-bio">${p.bio}</div>
          </div>
          <div class="pr-badge ${bcls}">${blbl}</div>
        </div>

        <div class="pr-chips">
          ${p.specialties.map(s => `<span class="pr-chip">${s}</span>`).join('')}
        </div>

        <div class="pr-kpis">
          <div><div class="k">RDV mois</div><div class="v">${p.rdv}</div></div>
          <div><div class="k">Revenu</div><div class="v">${fmt(p.revenue)}</div></div>
          <div><div class="k">NPS</div><div class="v">${p.nps}</div></div>
          <div><div class="k">Rétention</div><div class="v">${p.retention} %</div></div>
        </div>

        <div class="pr-week">
          ${p.week.map((s, i) => `
            <div class="pr-day ${s}"><div class="d">${dows[i]}</div><div class="h">${p.hours[i] === '—' ? 'off' : p.hours[i] + 'h'}</div></div>
          `).join('')}
        </div>

        <div class="pr-actions">
          <button class="kb ghost" data-action="prac-agenda" data-prac="${p.id}">Agenda</button>
          <button class="kb ghost" data-action="prac-edit" data-prac="${p.id}">Modifier</button>
          <button class="kb atlas" data-action="prac-commission" data-prac="${p.id}">Commission</button>
        </div>
      </div>
    `;
  }

  /* ─── Main drawer ─── */
  handlers['nav-practitioners'] = () => {
    const totalRdv = PRACS.reduce((s, p) => s + p.rdv, 0);
    const totalRev = PRACS.reduce((s, p) => s + p.revenue, 0);
    const avgNps = Math.round(PRACS.reduce((s, p) => s + p.nps, 0) / PRACS.length);
    const totalCerts = PRACS.reduce((s, p) => s + p.certs.length, 0);
    const expiring = PRACS.reduce((s, p) => s + p.certs.filter(c => c.s !== 'ok').length, 0);

    drawer({
      title: 'Praticien·ne·s · Spa Bahia',
      subtitle: '3 actives · Hivernage, Marrakech · planning T+1',
      width: 920,
      body: `
        <div class="p-hero">
          <div class="l">PERFORMANCE ÉQUIPE · AVRIL</div>
          <div class="big">${fmt(totalRev)} <span style="font-size:18px; opacity:0.7;">MAD</span></div>
          <div class="sub">${totalRdv} RDV cumulés · NPS moyen ${avgNps} · panier moyen ${fmt(Math.round(totalRev / totalRdv))} MAD · 3 praticiennes en service</div>
        </div>

        <div class="p-toolbar">
          <div class="p-search">Rechercher par nom, certification, spécialité…</div>
          <button class="kb ghost" data-action="prac-tracker">Certifications (${expiring}/${totalCerts} à suivre)</button>
          <button class="kb primary" data-action="prac-add">Ajouter une praticienne</button>
        </div>

        <div class="pr-grid">
          ${PRACS.map(renderCard).join('')}
          <div class="pr-card" style="display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px; border-style:dashed; cursor:pointer; min-height:300px;" data-action="prac-add">
            <div class="pr-blob" style="background: var(--paper); border: 1.5px dashed var(--n-300); color: var(--n-500);">+</div>
            <div style="font-weight:600; font-size:14px; letter-spacing:-0.01em;">Recruter une nouvelle praticienne</div>
            <div style="font-size:11.5px; color:var(--n-500); text-align:center; max-width:220px; line-height:1.45;">Wizard guidé · profil, certifications, planning et commission en 4 étapes.</div>
          </div>
        </div>
      `,
    });

    // Wire card-level actions inside this drawer
    const root = document.querySelector('.kiwi-drawer-backdrop:last-of-type');
    if (!root) return;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const a = btn.dataset.action;
      const id = btn.dataset.prac;
      if (a === 'prac-agenda') openAgenda(id);
      else if (a === 'prac-edit') openEdit(id);
      else if (a === 'prac-commission') openCommission(id);
      else if (a === 'prac-tracker') openTracker();
      else if (a === 'prac-add') openAddWizard();
      else if (a === 'prac-remove') confirmRemove(id);
    });
  };

  /* ─── Helpers ─── */
  const getPrac = (id) => PRACS.find(p => p.id === id) || PRACS[0];

  function openAgenda(id) {
    const p = getPrac(id);
    drawer({
      title: `Agenda · ${p.name}`,
      subtitle: `${p.rdv} RDV ce mois · ${fmt(p.revenue)} MAD`,
      width: 520,
      body: `
        <div class="p-card">
          <div class="head"><h4>Aujourd'hui</h4><span class="meta">29 AVR · 8 RDV</span></div>
          ${[
            ['09:30', 'Soin visage anti-âge · Mme. Tazi', '60 min · 750 MAD'],
            ['11:00', 'Massage thérapeutique · M. Chraibi', '90 min · 950 MAD'],
            ['13:00', 'Pause déjeuner', '60 min'],
            ['14:30', 'Drainage lymphatique · Mme. Bennani', '60 min · 700 MAD'],
            ['16:00', 'Rituel hammam premium · couple Idrissi', '120 min · 1 800 MAD'],
            ['18:30', 'Soin éclat express · Mme. Fassi', '45 min · 550 MAD'],
          ].map(([t, n, m]) => `
            <div class="resv-line"><div class="t">${t}</div><div class="info"><div class="n">${n}</div><div class="m">${m}</div></div><div><span class="chip ok">confirmé</span></div></div>
          `).join('')}
        </div>
        <button class="kb ghost" style="width:100%; justify-content:center; margin-top:10px;" onclick="window.Kiwi.toast('Export ICS envoyé', { desc: 'Agenda 7 jours synchronisé sur Google Calendar.', type: 'success' })">Exporter en .ics</button>
      `,
    });
  }

  function openEdit(id) {
    const p = getPrac(id);
    modal({
      tag: 'PROFIL PRATICIEN·NE',
      title: `Modifier · ${p.name}`,
      desc: 'Mise à jour des spécialités, taux de commission et planning de référence.',
      width: 560,
      body: `
        <div class="kf-group"><label class="kf-label">Nom complet</label><input class="kf-input" value="${p.name}"/></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Rôle</label><input class="kf-input" value="${p.role}"/></div>
          <div class="kf-group"><label class="kf-label">Commission (%)</label><input class="kf-input" type="number" value="${p.commission}"/></div>
        </div>
        <div class="kf-group"><label class="kf-label">Spécialités (séparées par virgules)</label><input class="kf-input" value="${p.specialties.join(', ')}"/></div>
        <div class="kf-group"><label class="kf-label">Bio courte</label><textarea class="kf-input" rows="3">${p.bio}</textarea></div>
        <div class="kf-help">Les changements de commission s'appliquent au prochain cycle de paie (T+1 du mois).</div>
      `,
      foot: `
        <button class="kb ghost" data-action="prac-remove" data-prac="${p.id}">Désactiver le profil</button>
        <div style="flex:1;"></div>
        <button class="kb ghost" onclick="this.closest('.kiwi-backdrop').classList.remove('in'); setTimeout(()=>this.closest('.kiwi-backdrop')?.remove(), 280)">Annuler</button>
        <button class="kb primary" onclick="window.Kiwi.toast('Profil mis à jour', { desc: '${p.name} · changements actifs sur le planning T+1.', type: 'success' }); this.closest('.kiwi-backdrop').classList.remove('in'); setTimeout(()=>this.closest('.kiwi-backdrop')?.remove(), 280)">Enregistrer</button>
      `,
    });
  }

  function confirmRemove(id) {
    const p = getPrac(id);
    modal({
      tag: 'CONFIRMATION',
      title: `Désactiver ${p.name} ?`,
      desc: 'Le profil sera retiré du planning public mais conservé pour l\'historique paie et CNSS. Les RDV à venir seront réassignés.',
      width: 460,
      body: `
        <div style="background: #FDE8E4; color: #9B2F22; padding: 12px 14px; border-radius: 10px; font-size: 12.5px; line-height: 1.5;">
          ${p.rdv > 0 ? `<b>${p.rdv} RDV ce mois</b> et 12 RDV à venir devront être réattribués manuellement.` : 'Aucun RDV en cours.'}
        </div>
      `,
      foot: `
        <button class="kb ghost" onclick="this.closest('.kiwi-backdrop').classList.remove('in'); setTimeout(()=>this.closest('.kiwi-backdrop')?.remove(), 280)">Annuler</button>
        <button class="kb danger" onclick="window.Kiwi.toast('Profil désactivé', { desc: '${p.name} · 12 RDV en attente de réassignation.', type: 'warn' }); document.querySelectorAll('.kiwi-backdrop').forEach(b=>{b.classList.remove('in'); setTimeout(()=>b.remove(), 280)})">Désactiver</button>
      `,
    });
  }

  /* ─── Commission calculator ─── */
  function openCommission(presetId) {
    const opts = PRACS.map(p => `<option value="${p.id}" ${p.id === presetId ? 'selected' : ''}>${p.name} · ${p.commission}%</option>`).join('');
    modal({
      tag: 'CALCUL DE COMMISSION',
      title: 'Commission praticien·ne',
      desc: 'Saisissez le nombre de prestations et le panier moyen pour visualiser la commission nette CNSS.',
      width: 540,
      body: `
        <div class="kf-group"><label class="kf-label">Praticienne</label>
          <select class="kf-input" id="pr-calc-who">${opts}</select>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Nombre de prestations</label><input class="kf-input" id="pr-calc-n" type="number" value="60"/></div>
          <div class="kf-group"><label class="kf-label">Panier moyen (MAD)</label><input class="kf-input" id="pr-calc-avg" type="number" value="450"/></div>
        </div>
        <div class="pr-calc-out" id="pr-calc-out">
          <div class="l">COMMISSION NETTE · APRÈS CNSS</div>
          <div class="v" id="pr-calc-v">— MAD</div>
          <div class="br">
            <div><span>CA brut généré</span><br><b id="pr-calc-gross">— MAD</b></div>
            <div><span>Commission brute</span><br><b id="pr-calc-com">— MAD</b></div>
            <div><span>CNSS (4,48%)</span><br><b id="pr-calc-cnss">— MAD</b></div>
            <div><span>Taux appliqué</span><br><b id="pr-calc-rate">—%</b></div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" onclick="this.closest('.kiwi-backdrop').classList.remove('in'); setTimeout(()=>this.closest('.kiwi-backdrop')?.remove(), 280)">Fermer</button>
        <button class="kb primary" id="pr-calc-export">Exporter fiche paie</button>
      `,
    });

    const recompute = () => {
      const id = document.getElementById('pr-calc-who').value;
      const p = getPrac(id);
      const n = +document.getElementById('pr-calc-n').value || 0;
      const avg = +document.getElementById('pr-calc-avg').value || 0;
      const gross = n * avg;
      const com = Math.round(gross * (p.commission / 100));
      const cnss = Math.round(com * 0.0448);
      const net = com - cnss;
      document.getElementById('pr-calc-v').textContent = fmt(net) + ' MAD';
      document.getElementById('pr-calc-gross').textContent = fmt(gross) + ' MAD';
      document.getElementById('pr-calc-com').textContent = fmt(com) + ' MAD';
      document.getElementById('pr-calc-cnss').textContent = '− ' + fmt(cnss) + ' MAD';
      document.getElementById('pr-calc-rate').textContent = p.commission + '%';
    };
    setTimeout(() => {
      ['pr-calc-who', 'pr-calc-n', 'pr-calc-avg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', recompute);
      });
      recompute();
      const exp = document.getElementById('pr-calc-export');
      if (exp) exp.onclick = () => {
        toast('Fiche paie générée', { desc: 'PDF prêt pour validation comptable · synchronisée avec le module CNSS.', type: 'success' });
      };
    }, 50);
  }

  /* ─── Certification tracker ─── */
  function openTracker() {
    drawer({
      title: 'Certifications & formations',
      subtitle: 'Suivi renouvellement par praticienne · alerte 90 jours',
      width: 560,
      body: `
        ${PRACS.map(p => `
          <div class="p-card">
            <div class="head">
              <h4>${p.name}</h4>
              <span class="meta">${p.certs.length} CERTIFICATIONS</span>
            </div>
            ${p.certs.map(c => `
              <div class="pr-cert">
                <div><div class="n">${c.n}</div><div class="m">${c.d}</div></div>
                <span class="pr-cert-stat ${c.s}">${c.sl}</span>
                <button class="kb ghost" style="padding:6px 10px; font-size:11px;" onclick="window.Kiwi.toast('Rappel programmé', { desc: 'Notification envoyée 30 jours avant expiration.', type: 'info' })">Rappel</button>
              </div>
            `).join('')}
          </div>
        `).join('')}
        <button class="kb atlas" style="width:100%; justify-content:center; margin-top:10px;" onclick="window.Kiwi.toast('Synthèse RH générée', { desc: 'Export Excel envoyé sur themoubadir@gmail.com', type: 'success' })">Exporter le tableau de bord RH</button>
      `,
    });
  }

  /* ─── Add practitioner wizard ─── */
  function openAddWizard(step = 1) {
    const total = 4;
    const steps = ['Identité', 'Spécialités', 'Certifications', 'Commission & planning'];
    const bodies = {
      1: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Prénom</label><input class="kf-input" placeholder="Imane"/></div>
          <div class="kf-group"><label class="kf-label">Nom</label><input class="kf-input" placeholder="Alaoui"/></div>
        </div>
        <div class="kf-group"><label class="kf-label">Email pro</label><input class="kf-input" type="email" placeholder="praticien@spabahia.ma"/></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">CIN</label><input class="kf-input" placeholder="BE123456"/></div>
          <div class="kf-group"><label class="kf-label">CNSS</label><input class="kf-input" placeholder="999 999 999"/></div>
        </div>
      `,
      2: `
        <div class="kf-help" style="margin-bottom:10px;">Cochez les spécialités. Affecte le routage automatique des RDV en ligne.</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          ${['Visage anti-âge', 'Massage suédois', 'Massage californien', 'Drainage lymphatique', 'Hammam traditionnel', 'Gommage savon noir', 'Réflexologie', 'Soins haute technologie', 'Modelages corps', 'Rituel marocain'].map(s => `
            <label style="display:flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid var(--n-200); border-radius:10px; font-size:13px; cursor:pointer;"><input type="checkbox"/> ${s}</label>
          `).join('')}
        </div>
      `,
      3: `
        <div class="kf-help" style="margin-bottom:10px;">Ajoutez les certifications principales. Le tracker enverra une alerte 90 jours avant expiration.</div>
        <div class="kf-group"><label class="kf-label">Certification principale</label>
          <select class="kf-input"><option>CIDESCO Suisse</option><option>RNCP niveau 5 esthétique</option><option>École hammam Marrakech</option><option>Certification massage thérapeutique</option><option>Autre</option></select>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Date d'obtention</label><input class="kf-input" type="date"/></div>
          <div class="kf-group"><label class="kf-label">Date de renouvellement</label><input class="kf-input" type="date"/></div>
        </div>
        <button class="kb ghost" style="font-size:12px; padding:8px 14px;">+ Ajouter une certification</button>
      `,
      4: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Taux de commission (%)</label><input class="kf-input" type="number" value="20"/></div>
          <div class="kf-group"><label class="kf-label">Date d'embauche</label><input class="kf-input" type="date"/></div>
        </div>
        <div class="kf-group"><label class="kf-label">Planning de référence</label>
          <div style="display:grid; grid-template-columns: repeat(7,1fr); gap:6px;">
            ${dows.map(d => `<label style="text-align:center; padding:8px 4px; border:1px solid var(--n-200); border-radius:8px; font-size:11px; font-family:var(--mono); cursor:pointer;"><div style="font-weight:600;">${d}</div><input type="checkbox" style="margin-top:4px;"/></label>`).join('')}
          </div>
        </div>
        <div class="kf-help">La praticienne recevra ses identifiants par email pour accéder à son agenda mobile.</div>
      `,
    };
    modal({
      tag: `ÉTAPE ${step} / ${total} · ${steps[step - 1].toUpperCase()}`,
      title: 'Ajouter une praticienne',
      desc: 'Configuration complète en 4 étapes · profil actif sous 2 minutes.',
      width: 560,
      body: `
        <div class="wiz-steps">
          ${[1, 2, 3, 4].map(i => `<div class="wiz-step ${i < step ? 'done' : i === step ? 'active' : ''}"></div>`).join('')}
        </div>
        ${bodies[step]}
      `,
      foot: `
        ${step > 1 ? `<button class="kb ghost" id="wiz-back">Retour</button>` : `<button class="kb ghost" onclick="this.closest('.kiwi-backdrop').classList.remove('in'); setTimeout(()=>this.closest('.kiwi-backdrop')?.remove(), 280)">Annuler</button>`}
        <div style="flex:1;"></div>
        <button class="kb primary" id="wiz-next">${step === total ? 'Activer le profil' : 'Continuer'}</button>
      `,
    });
    setTimeout(() => {
      const next = document.getElementById('wiz-next');
      const back = document.getElementById('wiz-back');
      if (next) next.onclick = () => {
        document.querySelectorAll('.kiwi-backdrop').forEach(b => { b.classList.remove('in'); setTimeout(() => b.remove(), 280); });
        if (step === total) {
          toast('Praticienne ajoutée', { desc: 'Profil actif · email d\'invitation envoyé. Premier RDV planifiable dès demain.', type: 'success' });
          if (Kiwi.confetti) Kiwi.confetti();
        } else {
          setTimeout(() => openAddWizard(step + 1), 120);
        }
      };
      if (back) back.onclick = () => {
        document.querySelectorAll('.kiwi-backdrop').forEach(b => { b.classList.remove('in'); setTimeout(() => b.remove(), 280); });
        setTimeout(() => openAddWizard(step - 1), 120);
      };
    }, 50);
  }

  /* ─── Auxiliary handlers (callable via [data-action] elsewhere) ─── */
  handlers['practitioner-edit'] = () => openEdit('NH');
  handlers['practitioner-commission'] = () => openCommission('NH');
  handlers['practitioner-tracker'] = () => openTracker();
  handlers['practitioner-add'] = () => openAddWizard(1);
})();

/* ═══ Section 2 spa · clients ═══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Spa Bahia · sidebar handler · nav-clients
 * Mindbody / Booksy / Vagaro CRM-tier client list with profile drawer.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const Kiwi = window.Kiwi || {};
  const handlers = Kiwi.handlers;
  if (!handlers) return;
  const { toast, modal, drawer, confetti } = Kiwi;

  /* ─── Inject local CSS once ─── */
  if (!document.getElementById('spa-clients-css')) {
    const s = document.createElement('style');
    s.id = 'spa-clients-css';
    s.textContent = `
    .sc-pills { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 14px; padding: 4px; background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 12px; }
    html[data-theme="dark"] .sc-pills { background: var(--paper-muted); }
    .sc-pill { flex: 0 0 auto; padding: 8px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 500; color: var(--n-500); cursor: pointer; transition: background 150ms, color 150ms; display: inline-flex; align-items: center; gap: 7px; border: 0; background: none; font-family: var(--sans); }
    .sc-pill:hover { color: var(--ink); }
    .sc-pill.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    html[data-theme="dark"] .sc-pill.on { background: var(--ink-soft); color: var(--paper); }
    .sc-pill .ct { font-family: var(--mono); font-size: 10.5px; color: var(--n-500); background: var(--n-100); padding: 1px 7px; border-radius: 999px; letter-spacing: 0.04em; }
    .sc-pill.on .ct { background: var(--mint-soft); color: var(--atlas); }

    .sc-flag { display: inline-block; width: 12px; height: 8px; border-radius: 2px; vertical-align: middle; margin-right: 7px; box-shadow: inset 0 0 0 1px rgba(10,15,13,0.08); }
    .sc-flag.ma { background: linear-gradient(180deg, #C1272D 50%, #C1272D 50%); }
    .sc-flag.fr { background: linear-gradient(90deg, #002395 33%, #fff 33% 66%, #ED2939 66%); }
    .sc-flag.es { background: linear-gradient(180deg, #AA151B 25%, #F1BF00 25% 75%, #AA151B 75%); }
    .sc-flag.us { background: linear-gradient(180deg, #B22234 50%, #fff 50%); }
    .sc-flag.de { background: linear-gradient(180deg, #000 33%, #DD0000 33% 66%, #FFCE00 66%); }

    .sc-tier { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 600; font-family: var(--mono); letter-spacing: 0.06em; text-transform: uppercase; }
    .sc-tier.bronze { background: rgba(217,154,43,0.16); color: #8A6210; }
    .sc-tier.argent { background: var(--n-100); color: var(--n-600); }
    .sc-tier.or { background: var(--mint-soft); color: var(--atlas); }
    .sc-tier.platine { background: var(--riad); color: var(--mint); }
    html[data-theme="dark"] .sc-tier.argent { background: rgba(255,255,255,0.06); color: var(--paper); }

    .sc-bday { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; background: rgba(217,154,43,0.18); color: #8A6210; font-size: 10.5px; font-weight: 500; font-family: var(--mono); letter-spacing: 0.04em; margin-left: 6px; }
    html[data-theme="dark"] .sc-bday { background: rgba(217,154,43,0.22); color: #E5B764; }

    .sc-bday-panel { background: linear-gradient(135deg, rgba(217,154,43,0.14), rgba(217,154,43,0.04)); border: 1px solid rgba(217,154,43,0.32); border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .sc-bday-panel .ic { width: 40px; height: 40px; border-radius: 10px; background: rgba(217,154,43,0.22); color: #8A6210; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-bday-panel .body { flex: 1; min-width: 220px; }
    .sc-bday-panel .body .t { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
    .sc-bday-panel .body .d { font-size: 12px; color: var(--n-600); margin-top: 3px; line-height: 1.45; }

    .sc-empty { padding: 40px 20px; text-align: center; color: var(--n-500); font-size: 13px; }

    .sc-prof-head { display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center; padding: 4px 0 14px; border-bottom: 1px solid var(--n-200); margin-bottom: 14px; }
    .sc-prof-av { width: 56px; height: 56px; border-radius: 50%; background: var(--atlas); color: var(--paper); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 20px; letter-spacing: -0.02em; }
    .sc-prof-av.platine { background: var(--riad); color: var(--mint); }
    .sc-prof-av.or { background: var(--atlas); }
    .sc-prof-av.argent { background: var(--n-500); }
    .sc-prof-av.bronze { background: #D99A2B; }
    .sc-prof-meta { font-family: var(--mono); font-size: 11px; color: var(--n-500); margin-top: 4px; letter-spacing: 0.04em; }

    .sc-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; font-size: 13px; margin-top: 4px; }
    .sc-info-grid dt { color: var(--n-500); padding: 6px 0; border-bottom: 1px solid var(--n-200); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; font-family: var(--mono); }
    .sc-info-grid dd { margin: 0; padding: 6px 0; border-bottom: 1px solid var(--n-200); text-align: right; font-weight: 500; }

    .sc-allergy { background: rgba(195,49,33,0.08); border: 1px solid rgba(195,49,33,0.2); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; display: flex; gap: 10px; align-items: flex-start; }
    .sc-allergy .ic { width: 28px; height: 28px; border-radius: 8px; background: rgba(195,49,33,0.16); color: #9B2F22; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-allergy .b { flex: 1; }
    .sc-allergy .b .t { font-size: 13px; font-weight: 600; color: #9B2F22; letter-spacing: -0.01em; }
    .sc-allergy .b .d { font-size: 12px; color: var(--n-600); margin-top: 3px; line-height: 1.45; }

    .sc-history-row { display: grid; grid-template-columns: 80px 1fr 110px 70px; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--n-200); font-size: 12.5px; }
    .sc-history-row:first-of-type { border-top: 0; }
    .sc-history-row .dt { font-family: var(--mono); font-size: 11px; color: var(--n-500); letter-spacing: 0.04em; }
    .sc-history-row .svc { font-weight: 500; font-size: 13px; }
    .sc-history-row .pr { font-family: var(--mono); font-weight: 600; text-align: right; font-feature-settings: "tnum" 1; }
    .sc-history-row .pra { font-size: 11.5px; color: var(--n-500); }

    .sc-gift { background: linear-gradient(135deg, var(--ink), var(--ink-soft)); color: var(--paper); border-radius: 14px; padding: 18px; margin-bottom: 12px; position: relative; overflow: hidden; }
    .sc-gift::after { content: ""; position: absolute; right: -50px; top: -50px; width: 160px; height: 160px; background: radial-gradient(circle, var(--mint), transparent 60%); opacity: 0.18; pointer-events: none; }
    .sc-gift .l { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em; color: var(--mint); }
    .sc-gift .v { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin-top: 4px; font-feature-settings: "tnum" 1; }
    .sc-gift .s { font-size: 12px; color: #c6ead4; margin-top: 4px; }
    .sc-gift .ac { display: flex; gap: 8px; margin-top: 12px; position: relative; z-index: 1; }

    .sc-amounts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
    .sc-amount { padding: 12px 8px; background: #fff; border: 1px solid var(--n-200); border-radius: 10px; text-align: center; cursor: pointer; transition: all 150ms; font-family: var(--mono); font-size: 13px; font-weight: 500; }
    html[data-theme="dark"] .sc-amount { background: var(--paper-soft); }
    .sc-amount:hover { border-color: var(--atlas); }
    .sc-amount.on { background: var(--atlas); color: var(--paper); border-color: var(--atlas); }

    .sc-wa-preview { background: #ECE5DD; border-radius: 14px; padding: 14px; margin: 12px 0; }
    html[data-theme="dark"] .sc-wa-preview { background: var(--paper-muted); }
    .sc-wa-bubble { background: #DCF8C6; border-radius: 8px 8px 8px 2px; padding: 10px 12px; max-width: 90%; font-size: 13px; color: #0A0F0D; line-height: 1.5; }
    html[data-theme="dark"] .sc-wa-bubble { background: rgba(125,242,176,0.18); color: var(--paper); }
    .sc-wa-time { font-size: 10px; color: var(--n-500); margin-top: 4px; text-align: right; font-family: var(--mono); }

    .sc-table tbody tr.sc-hide { display: none; }
    `;
    document.head.appendChild(s);
  }

  /* ─── Data ─── */
  const PRACTITIONERS = ['Nour', 'Salma', 'Yasmine', 'Imane'];
  const SERVICES = [
    'Hammam Royal',
    'Massage Argan 60min',
    'Massage Pierres Chaudes',
    'Soin Visage Hydratant',
    'Gommage Beldi',
    'Manucure Spa',
    'Pédicure Marrakchia',
    'Rituel Kessa',
    'Massage Californien',
    'Soin Anti-Âge',
  ];
  const CLIENTS = [
    { id: 1, fn: 'Lisa', ln: 'P.', flag: 'us', ltv: 38000, fav: 'Nour', last: "Aujourd'hui", tier: 'platine', bday: true, allergies: ['Allergie aux huiles essentielles d\'agrumes'], iban: 'US •• 8412' },
    { id: 2, fn: 'Anna', ln: 'M.', flag: 'de', ltv: 18200, fav: 'Nour', last: 'Hier', tier: 'or', bday: false, allergies: [] },
    { id: 3, fn: 'Sophie', ln: 'L.', flag: 'fr', ltv: 8400, fav: 'Salma', last: 'Il y a 3j', tier: 'argent', bday: true, allergies: [] },
    { id: 4, fn: 'Yasmine', ln: 'T.', flag: 'ma', ltv: 22100, fav: 'Yasmine', last: 'Il y a 1 sem', tier: 'or', bday: false, allergies: ['Peau sensible — éviter cire chaude'] },
    { id: 5, fn: 'Imane', ln: 'S.', flag: 'ma', ltv: 16800, fav: 'Nour', last: "Aujourd'hui", tier: 'or', bday: false, allergies: [] },
    { id: 6, fn: 'Karim', ln: 'L.', flag: 'ma', ltv: 6800, fav: 'Yasmine', last: 'Il y a 2 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 7, fn: 'Camille', ln: 'R.', flag: 'fr', ltv: 9200, fav: 'Salma', last: 'Hier', tier: 'argent', bday: false, allergies: [] },
    { id: 8, fn: 'Lucia', ln: 'M.', flag: 'es', ltv: 7100, fav: 'Salma', last: 'Il y a 3j', tier: 'argent', bday: false, allergies: [] },
    { id: 9, fn: 'Diana', ln: 'K.', flag: 'us', ltv: 3200, fav: 'Yasmine', last: 'Il y a 1 mois', tier: 'bronze', bday: false, allergies: [] },
    { id: 10, fn: 'Karen', ln: 'B.', flag: 'us', ltv: 4200, fav: 'Salma', last: 'Il y a 2 sem', tier: 'bronze', bday: false, allergies: [] },
    { id: 11, fn: 'Manon', ln: 'B.', flag: 'fr', ltv: 5400, fav: 'Imane', last: 'Il y a 1 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 12, fn: 'Hicham', ln: 'R.', flag: 'ma', ltv: 2800, fav: 'Yasmine', last: 'Il y a 3 mois', tier: 'bronze', bday: false, allergies: [] },
    { id: 13, fn: 'Salma', ln: 'O.', flag: 'ma', ltv: 19400, fav: 'Nour', last: 'Hier', tier: 'or', bday: false, allergies: [] },
    { id: 14, fn: 'Marion', ln: 'K.', flag: 'fr', ltv: 31600, fav: 'Salma', last: "Aujourd'hui", tier: 'platine', bday: true, allergies: ['Cicatrice récente — éviter zone lombaire'], iban: 'FR •• 2207' },
    { id: 15, fn: 'Aïcha', ln: 'B.', flag: 'ma', ltv: 8100, fav: 'Imane', last: 'Il y a 1 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 16, fn: 'Mehdi', ln: 'C.', flag: 'ma', ltv: 1400, fav: 'Yasmine', last: 'Il y a 3 mois', tier: 'bronze', bday: false, allergies: [] },
    { id: 17, fn: 'Emma', ln: 'D.', flag: 'fr', ltv: 12700, fav: 'Nour', last: 'Hier', tier: 'argent', bday: false, allergies: [] },
    { id: 18, fn: 'Mariana', ln: 'V.', flag: 'es', ltv: 14800, fav: 'Salma', last: 'Il y a 3j', tier: 'argent', bday: false, allergies: [] },
    { id: 19, fn: 'Fatima', ln: 'Z.', flag: 'ma', ltv: 24600, fav: 'Nour', last: "Aujourd'hui", tier: 'or', bday: false, allergies: ['Hypertension — pression douce uniquement'] },
    { id: 20, fn: 'Léa', ln: 'G.', flag: 'fr', ltv: 6200, fav: 'Imane', last: 'Il y a 2 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 21, fn: 'Helga', ln: 'W.', flag: 'de', ltv: 11400, fav: 'Salma', last: 'Il y a 1 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 22, fn: 'Jessica', ln: 'H.', flag: 'us', ltv: 9800, fav: 'Yasmine', last: 'Il y a 3j', tier: 'argent', bday: false, allergies: [] },
    { id: 23, fn: 'Carolina', ln: 'F.', flag: 'es', ltv: 3700, fav: 'Imane', last: 'Il y a 1 mois', tier: 'bronze', bday: false, allergies: [] },
    { id: 24, fn: 'Nawal', ln: 'A.', flag: 'ma', ltv: 28400, fav: 'Nour', last: 'Hier', tier: 'or', bday: false, allergies: [] },
    { id: 25, fn: 'Olivier', ln: 'P.', flag: 'fr', ltv: 4900, fav: 'Yasmine', last: 'Il y a 2 sem', tier: 'bronze', bday: false, allergies: [] },
    { id: 26, fn: 'Rachel', ln: 'S.', flag: 'us', ltv: 17200, fav: 'Nour', last: "Aujourd'hui", tier: 'or', bday: false, allergies: ['Asthme — éviter huiles fortes'] },
    { id: 27, fn: 'Klaus', ln: 'B.', flag: 'de', ltv: 5600, fav: 'Salma', last: 'Il y a 1 sem', tier: 'argent', bday: false, allergies: [] },
    { id: 28, fn: 'Inès', ln: 'M.', flag: 'fr', ltv: 35200, fav: 'Nour', last: 'Hier', tier: 'platine', bday: false, allergies: [], iban: 'FR •• 7180' },
    { id: 29, fn: 'Soukaina', ln: 'E.', flag: 'ma', ltv: 13900, fav: 'Imane', last: 'Il y a 3j', tier: 'argent', bday: false, allergies: [] },
    { id: 30, fn: 'Pablo', ln: 'C.', flag: 'es', ltv: 2300, fav: 'Yasmine', last: 'Il y a 1 mois', tier: 'bronze', bday: false, allergies: [] },
  ];

  const fmtMAD = (n) => n.toLocaleString('fr-FR').replace(/ /g, ' ');
  const tierLabel = { bronze: 'Bronze', argent: 'Argent', or: 'Or', platine: 'Platine' };
  const isNew = (c) => c.last === "Aujourd'hui" || c.last === 'Hier';
  const isFidele = (c) => c.ltv >= 5000 && c.ltv < 30000;
  const isVIP = (c) => c.tier === 'or' || c.tier === 'platine';

  /* ─── History generator ─── */
  function buildHistory(c) {
    const out = [];
    const dates = ["Aujourd'hui", 'Il y a 5j', 'Il y a 12j', 'Il y a 3 sem', 'Il y a 1 mois', 'Il y a 2 mois', 'Il y a 3 mois', 'Il y a 5 mois'];
    let seed = c.id;
    for (let i = 0; i < 8; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const sv = SERVICES[Math.floor((seed / 233280) * SERVICES.length)];
      seed = (seed * 9301 + 49297) % 233280;
      const pr = 350 + Math.floor((seed / 233280) * 9) * 150;
      seed = (seed * 9301 + 49297) % 233280;
      const pra = PRACTITIONERS[Math.floor((seed / 233280) * PRACTITIONERS.length)];
      out.push({ d: dates[i], s: sv, pra, p: pr });
    }
    return out;
  }

  /* ─── Row renderer ─── */
  function rowHTML(c) {
    const bdayChip = c.bday ? `<span class="sc-bday">Anniv. avril</span>` : '';
    return `
      <tr data-spa-row data-spa-id="${c.id}" data-spa-tier="${c.tier}" data-spa-new="${isNew(c) ? 1 : 0}" data-spa-fid="${isFidele(c) ? 1 : 0}" data-spa-vip="${isVIP(c) ? 1 : 0}" data-spa-bday="${c.bday ? 1 : 0}">
        <td><span class="sc-flag ${c.flag}"></span><b>${c.fn} ${c.ln}</b>${bdayChip}</td>
        <td style="color:var(--n-600);">${c.last}</td>
        <td class="mono right">${fmtMAD(c.ltv)} <span style="color:var(--n-400); font-size:11px;">MAD</span></td>
        <td>${c.fav}</td>
        <td><span class="sc-tier ${c.tier}">${tierLabel[c.tier]}</span></td>
      </tr>
    `;
  }

  /* ─── Profile drawer ─── */
  function openProfile(id) {
    const c = CLIENTS.find((x) => x.id === id);
    if (!c) return;
    const history = buildHistory(c);
    const giftBalance = c.tier === 'platine' ? 1500 : c.tier === 'or' ? 800 : c.tier === 'argent' ? 250 : 0;
    const initials = (c.fn[0] + c.ln[0]).toUpperCase();
    const allergiesHTML = c.allergies.length
      ? c.allergies.map((a) => `
        <div class="sc-allergy">
          <div class="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
          <div class="b"><div class="t">Contre-indication</div><div class="d">${a}</div></div>
        </div>
      `).join('')
      : `<div style="font-size:12.5px; color:var(--n-500); padding:8px 0;">Aucune allergie ou contre-indication signalée.</div>`;
    drawer({
      title: `${c.fn} ${c.ln}`,
      subtitle: `Membre ${tierLabel[c.tier]} · ${fmtMAD(c.ltv)} MAD à vie`,
      width: 560,
      body: `
        <div class="sc-prof-head">
          <div class="sc-prof-av ${c.tier}">${initials}</div>
          <div>
            <div style="font-size:15px; font-weight:600; letter-spacing:-0.01em;"><span class="sc-flag ${c.flag}"></span>${c.fn} ${c.ln} <span class="sc-tier ${c.tier}" style="margin-left:6px;">${tierLabel[c.tier]}</span></div>
            <div class="sc-prof-meta">CL-${String(c.id).padStart(4, '0')} · Praticienne fav. ${c.fav}${c.bday ? ' · Anniv. ce mois' : ''}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="kb ghost" data-action="spa-cli-block" data-arg="${c.id}" style="padding:7px 12px; font-size:12px;">Bloquer</button>
          </div>
        </div>

        <div class="p-card">
          <div class="head"><h4>Coordonnées</h4></div>
          <dl class="sc-info-grid">
            <dt>Téléphone</dt><dd class="mono">+212 6 ${20 + (c.id % 80)} ${10 + (c.id * 3) % 90} ${c.id * 7 % 100} ${c.id * 11 % 100}</dd>
            <dt>Email</dt><dd>${c.fn.toLowerCase()}.${c.ln[0].toLowerCase()}@mail.com</dd>
            <dt>Langue</dt><dd>${c.flag === 'fr' ? 'Français' : c.flag === 'ma' ? 'العربية / Français' : c.flag === 'es' ? 'Español' : c.flag === 'de' ? 'Deutsch' : 'English'}</dd>
            <dt>Source</dt><dd>${c.tier === 'platine' ? 'Concierge hôtel' : c.tier === 'or' ? 'Recommandation' : 'Walk-in'}</dd>
            ${c.iban ? `<dt>IBAN VIP</dt><dd class="mono">${c.iban}</dd>` : ''}
          </dl>
          <div style="display:flex; gap:8px; margin-top:14px;">
            <button class="kb atlas" data-action="spa-cli-wa" data-arg="${c.id}" style="flex:1; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-9 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.2A8.38 8.38 0 013 11.5a8.5 8.5 0 0118 0z"/></svg>Rappel WhatsApp</button>
            ${c.bday ? `<button class="kb ghost" data-action="spa-cli-bday" data-arg="${c.id}" style="flex:1; justify-content:center;">Vœux + 15%</button>` : ''}
          </div>
        </div>

        ${c.allergies.length ? `<div class="p-card" style="background:rgba(195,49,33,0.04); border-color:rgba(195,49,33,0.2);"><div class="head"><h4 style="color:#9B2F22;">Allergies & contre-indications</h4></div>${allergiesHTML}</div>` : ''}

        <div class="p-card">
          <div class="head"><h4>Historique des soins</h4><span class="meta">${history.length} dernières séances</span></div>
          ${history.map((h) => `
            <div class="sc-history-row">
              <div class="dt">${h.d}</div>
              <div><div class="svc">${h.s}</div><div class="pra">avec ${h.pra}</div></div>
              <div class="pr">${fmtMAD(h.p)} MAD</div>
              <div style="text-align:right;"><span class="chip ok">Réglé</span></div>
            </div>
          `).join('')}
        </div>

        <div class="sc-gift">
          <div class="l">CARTE CADEAU</div>
          <div class="v">${fmtMAD(giftBalance)} <span style="font-size:14px; opacity:0.7;">MAD</span></div>
          <div class="s">${giftBalance > 0 ? 'Solde disponible · expire dans 11 mois' : 'Aucune carte active'}</div>
          <div class="ac">
            <button class="kb" style="background:var(--mint); color:var(--riad); padding:8px 14px; font-size:12.5px;" data-action="spa-cli-gift" data-arg="${c.id}">+ Émettre une carte</button>
          </div>
        </div>

        <div class="p-card">
          <div class="head"><h4>Recommandations à domicile</h4><button class="kb ghost" data-action="spa-cli-note" data-arg="${c.id}" style="padding:5px 10px; font-size:11.5px;">Modifier</button></div>
          <div style="font-size:13px; color:var(--n-700); line-height:1.55; padding:8px 0;">
            ${c.tier === 'platine' || c.tier === 'or' ? 'Application matin : sérum hyaluronique. Soir : crème argan + 3 gouttes huile de figue de Barbarie. Hammam maison 2× / semaine.' : 'Hydratation quotidienne, exfoliation hebdomadaire au gommage Beldi. Suivi dans 4 semaines.'}
          </div>
        </div>
      `,
      foot: `
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="kb ghost" data-action="dismiss-drawer">Fermer</button>
          <button class="kb primary" data-action="spa-cli-book" data-arg="${c.id}">Réserver une séance</button>
        </div>
      `,
    });
  }

  /* ─── Auxiliary handlers ─── */
  handlers['spa-cli-search'] = () => toast('Recherche client', { desc: 'Recherche en temps réel par nom, téléphone, email.', type: 'info' });
  handlers['spa-cli-add'] = () => {
    modal({
      title: 'Nouveau client',
      tag: 'CRM SPA BAHIA',
      desc: 'Fiche client minimale — détails complétés à la première visite.',
      width: 560,
      body: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Prénom</label><input class="kf-input" value="Camélia" /></div>
          <div class="kf-group"><label class="kf-label">Nom</label><input class="kf-input" value="Bensaid" /></div>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Téléphone</label><input class="kf-input" value="+212 6 12 34 56 78" /></div>
          <div class="kf-group"><label class="kf-label">Email</label><input class="kf-input" value="camelia.b@mail.com" /></div>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Langue préférée</label><select class="kf-input"><option>Français</option><option>العربية</option><option>English</option><option>Español</option><option>Deutsch</option></select></div>
          <div class="kf-group"><label class="kf-label">Source</label><select class="kf-input"><option>Walk-in</option><option>Concierge hôtel</option><option>Recommandation</option><option>Instagram</option></select></div>
        </div>
        <div class="kf-group"><label class="kf-label">Allergies / contre-indications</label><textarea class="kf-input" rows="3" placeholder="Ex : peau sensible, hypertension, allergie aux huiles d'agrumes…"></textarea></div>
      `,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb primary" data-action="spa-cli-add-confirm">Créer la fiche</button>`,
    });
  };
  handlers['spa-cli-add-confirm'] = () => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    confetti();
    toast('Fiche client créée', { desc: 'Camélia Bensaid · ajoutée au CRM Spa Bahia.', type: 'success' });
  };
  handlers['spa-cli-row'] = (el) => openProfile(+el.dataset.arg);
  handlers['spa-cli-wa'] = (el) => {
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    modal({
      title: 'Rappel WhatsApp',
      tag: 'BAHIA SPA',
      desc: `Aperçu du message envoyé à ${c.fn} ${c.ln}.`,
      width: 480,
      body: `
        <div class="sc-wa-preview">
          <div class="sc-wa-bubble">
            Bonjour ${c.fn}, c'est Bahia Spa Hivernage. Votre praticienne ${c.fav} a un créneau libre demain à 15h pour votre soin habituel. Souhaitez-vous confirmer ?
            <div class="sc-wa-time">14:32 ✓✓</div>
          </div>
        </div>
        <textarea class="kf-input" rows="3">Bonjour ${c.fn}, c'est Bahia Spa Hivernage. Votre praticienne ${c.fav} a un créneau libre demain à 15h pour votre soin habituel.</textarea>
      `,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb atlas" data-action="spa-cli-wa-send" data-arg="${c.id}">Envoyer via WhatsApp Business</button>`,
    });
  };
  handlers['spa-cli-wa-send'] = (el) => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    toast('Message envoyé', { desc: `WhatsApp livré à ${c.fn} ${c.ln}. Lecture dans ~3 min en moyenne.`, type: 'success' });
  };
  handlers['spa-cli-bday'] = (el) => {
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    modal({
      title: 'Vœux d\'anniversaire',
      tag: 'CADEAU FIDÉLITÉ',
      desc: `Code -15% valable 30 jours · joint au message pour ${c.fn}.`,
      width: 480,
      body: `
        <div class="sc-wa-preview">
          <div class="sc-wa-bubble">
            Joyeux anniversaire ${c.fn} ! Toute l'équipe Bahia Spa vous offre <b>15% de réduction</b> sur votre prochaine séance — code BAHIA-${c.fn.toUpperCase().slice(0, 3)}15, valable 30 jours.
            <div class="sc-wa-time">15:08 ✓✓</div>
          </div>
        </div>
      `,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb atlas" data-action="spa-cli-bday-send" data-arg="${c.id}">Envoyer les vœux</button>`,
    });
  };
  handlers['spa-cli-bday-send'] = (el) => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    confetti();
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    toast('Vœux envoyés', { desc: `Code -15% remis à ${c.fn}. Notification de réception dans 30s.`, type: 'success' });
  };
  handlers['spa-cli-bday-batch'] = () => {
    const list = CLIENTS.filter((c) => c.bday);
    modal({
      title: 'Vœux groupés · 3 clientes',
      tag: 'CAMPAGNE AVRIL',
      desc: 'Aperçu unique · personnalisé automatiquement par client.',
      width: 540,
      body: `
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
          ${list.map((c) => `<div style="display:flex; gap:10px; align-items:center; padding:10px 12px; background:var(--paper-soft); border-radius:10px;"><div class="sc-prof-av ${c.tier}" style="width:36px; height:36px; font-size:13px;">${(c.fn[0] + c.ln[0]).toUpperCase()}</div><div style="flex:1;"><div style="font-weight:500; font-size:13.5px;">${c.fn} ${c.ln}</div><div style="font-size:11.5px; color:var(--n-500);">${tierLabel[c.tier]} · ${fmtMAD(c.ltv)} MAD à vie</div></div><span class="chip ok">Prêt</span></div>`).join('')}
        </div>
        <div class="sc-wa-preview">
          <div class="sc-wa-bubble">Joyeux anniversaire {Prénom} ! L'équipe Bahia Spa vous offre <b>15% de réduction</b> sur votre prochaine séance — code BAHIA-{XXX}15.<div class="sc-wa-time">15:08 ✓✓</div></div>
        </div>
      `,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb atlas" data-action="spa-cli-bday-batch-send">Envoyer aux 3 clientes</button>`,
    });
  };
  handlers['spa-cli-bday-batch-send'] = () => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    confetti();
    toast('Campagne envoyée', { desc: '3 messages WhatsApp livrés · taux de lecture estimé 92%.', type: 'success' });
  };
  handlers['spa-cli-gift'] = (el) => {
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    modal({
      title: 'Émettre une carte cadeau',
      tag: c.fn.toUpperCase() + ' ' + c.ln.toUpperCase(),
      desc: 'Carte numérique livrée par WhatsApp + email avec QR de validation.',
      width: 480,
      body: `
        <label class="kf-label">Montant</label>
        <div class="sc-amounts">
          <div class="sc-amount">300</div>
          <div class="sc-amount on">500</div>
          <div class="sc-amount">1 000</div>
          <div class="sc-amount">2 500</div>
        </div>
        <div class="kf-help">MAD · valable 12 mois · transferable une fois</div>
        <div class="kf-group" style="margin-top:14px;"><label class="kf-label">Message personnalisé</label><textarea class="kf-input" rows="2" placeholder="De la part de…">Pour ta journée détente — l'équipe Bahia.</textarea></div>
      `,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb primary" data-action="spa-cli-gift-confirm" data-arg="${c.id}">Émettre · 500 MAD</button>`,
    });
    setTimeout(() => {
      document.querySelectorAll('.sc-amount').forEach((a) => {
        a.onclick = () => { document.querySelectorAll('.sc-amount').forEach((x) => x.classList.remove('on')); a.classList.add('on'); };
      });
    }, 0);
  };
  handlers['spa-cli-gift-confirm'] = () => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    confetti();
    toast('Carte cadeau émise', { desc: 'QR + email livrés · solde 500 MAD activé.', type: 'success' });
  };
  handlers['spa-cli-block'] = (el) => {
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    modal({
      title: 'Bloquer ce client ?',
      desc: `${c.fn} ${c.ln} ne pourra plus réserver en ligne ni recevoir de campagnes. Action réversible.`,
      width: 440,
      body: `<div class="kf-group"><label class="kf-label">Motif (interne)</label><textarea class="kf-input" rows="3" placeholder="Comportement inapproprié, no-show répété…"></textarea></div>`,
      foot: `<button class="kb ghost" data-action="dismiss-modal">Annuler</button><button class="kb danger" data-action="spa-cli-block-confirm" data-arg="${c.id}">Confirmer le blocage</button>`,
    });
  };
  handlers['spa-cli-block-confirm'] = (el) => {
    document.querySelector('.kiwi-backdrop')?.querySelector('.kiwi-modal-close')?.click();
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    toast('Client bloqué', { desc: `${c.fn} ${c.ln} retiré des campagnes et de la réservation en ligne.`, type: 'warn' });
  };
  handlers['spa-cli-note'] = () => toast('Édition activée', { desc: 'Recommandations modifiables · auto-save 2s.', type: 'info' });
  handlers['spa-cli-book'] = (el) => {
    const c = CLIENTS.find((x) => x.id === +el.dataset.arg);
    toast('Calendrier ouvert', { desc: `Réservation pour ${c.fn} ${c.ln} · créneaux ${c.fav} affichés.`, type: 'info' });
  };
  handlers['spa-cli-filter'] = (el) => {
    const k = el.dataset.arg;
    const root = el.closest('.kiwi-drawer-body') || document;
    root.querySelectorAll('[data-spa-pill]').forEach((p) => p.classList.toggle('on', p.dataset.spaPill === k));
    root.querySelectorAll('[data-spa-row]').forEach((r) => {
      const ok =
        k === 'all' ||
        (k === 'new' && r.dataset.spaNew === '1') ||
        (k === 'fid' && r.dataset.spaFid === '1') ||
        (k === 'vip' && r.dataset.spaVip === '1') ||
        (k === 'bday' && r.dataset.spaBday === '1');
      r.classList.toggle('sc-hide', !ok);
    });
  };

  /* ─── Main handler ─── */
  handlers['nav-clients'] = () => {
    const totalLTV = CLIENTS.reduce((s, c) => s + c.ltv, 0);
    const bdayList = CLIENTS.filter((c) => c.bday);
    const counts = {
      all: CLIENTS.length,
      new: CLIENTS.filter(isNew).length,
      fid: CLIENTS.filter(isFidele).length,
      vip: CLIENTS.filter(isVIP).length,
      bday: bdayList.length,
    };
    const d = drawer({
      title: 'Fiches clients',
      subtitle: `${CLIENTS.length} clients · ${fmtMAD(totalLTV)} MAD à vie · Spa Bahia Hivernage`,
      width: 1040,
      body: `
        <div class="p-hero">
          <div class="l">CRM SPA BAHIA</div>
          <div class="big">${fmtMAD(totalLTV)} <span style="font-size:18px; opacity:0.7;">MAD à vie</span></div>
          <div class="sub">${CLIENTS.length} clients actifs · ${counts.vip} VIP · panier moyen ${fmtMAD(Math.round(totalLTV / CLIENTS.length))} MAD</div>
        </div>

        <div class="sc-bday-panel">
          <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 19v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3M12 5v6M9 8h6"/><circle cx="12" cy="3" r="1.5"/></svg></div>
          <div class="body">
            <div class="t">${bdayList.length} anniversaires ce mois</div>
            <div class="d">${bdayList.map((c) => `${c.fn} ${c.ln}`).join(' · ')} — campagne WhatsApp + 15% prête à partir.</div>
          </div>
          <button class="kb atlas" data-action="spa-cli-bday-batch">Envoyer les vœux groupés</button>
        </div>

        <div class="p-toolbar">
          <div class="p-search" data-action="spa-cli-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            Rechercher par nom, téléphone, email…
          </div>
          <button class="kb primary" data-action="spa-cli-add"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Nouveau client</button>
        </div>

        <div class="sc-pills">
          <button class="sc-pill on" data-spa-pill="all" data-action="spa-cli-filter" data-arg="all">Tous <span class="ct">${counts.all}</span></button>
          <button class="sc-pill" data-spa-pill="new" data-action="spa-cli-filter" data-arg="new">Nouveaux <span class="ct">${counts.new}</span></button>
          <button class="sc-pill" data-spa-pill="fid" data-action="spa-cli-filter" data-arg="fid">Fidèles <span class="ct">${counts.fid}</span></button>
          <button class="sc-pill" data-spa-pill="vip" data-action="spa-cli-filter" data-arg="vip">VIP <span class="ct">${counts.vip}</span></button>
          <button class="sc-pill" data-spa-pill="bday" data-action="spa-cli-filter" data-arg="bday">Anniv. ce mois <span class="ct">${counts.bday}</span></button>
        </div>

        <table class="p-table sc-table">
          <thead><tr><th>CLIENT</th><th>DERNIÈRE VISITE</th><th class="right">VALEUR À VIE</th><th>PRATICIENNE</th><th>NIVEAU</th></tr></thead>
          <tbody>
            ${CLIENTS.map(rowHTML).join('')}
          </tbody>
        </table>
      `,
    });
    d.el.querySelector('.kiwi-drawer').classList.add('page-xl');
    setTimeout(() => {
      d.el.querySelectorAll('[data-spa-row]').forEach((r) => {
        r.addEventListener('click', () => openProfile(+r.dataset.spaId));
      });
    }, 0);
  };
})();

/* ═══ STATION ROUTING OVERRIDE · rebuilds nav-menu + nav-kds with multi-station model ═══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Section 2-S · STATION ROUTING
 * Adds the missing "stations de préparation" feature to the restaurant
 * vertical: every menu item routes to 1+ prep stations and the KDS lets
 * the brigade switch between station views.
 *
 *   · handlers['nav-menu']  · rebuilt with station-chip rows + edit modal
 *                             station picker + "Gérer les stations" CTA
 *   · handlers['nav-kds']   · rebuilt with top station-pill switcher and
 *                             per-station ticket filtering
 *
 * Appended to pages-pro.js at load time so it overrides the previous
 * implementations.  Vanilla JS · no build · no framework.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const { handlers, drawer, fullpage, modal, toast, confetti } = Kiwi;

  /* ───────────── data · STATIONS registry (mutable, in-memory) ───────────── */
  const STATIONS = [
    { id: 'cuisson',  name: 'Cuisson chaude',  color: 'var(--atlas)',   raw: '#0B6E4F', kind: 'kitchen' },
    { id: 'salade',   name: 'Salade froide',   color: 'var(--success)', raw: '#1FB574', kind: 'kitchen' },
    { id: 'pastry',   name: 'Pâtisserie',      color: 'var(--warning)', raw: '#D99A2B', kind: 'kitchen' },
    { id: 'boissons', name: 'Boissons',        color: 'var(--info)',    raw: '#3677A6', kind: 'bar'     },
    { id: 'bar',      name: 'Bar cocktails',   color: 'var(--riad)',    raw: '#053B2C', kind: 'bar'     },
    { id: 'bbq',      name: 'Barbecue',        color: '#C24A2E',        raw: '#C24A2E', kind: 'kitchen', custom: true },
    { id: 'crepes',   name: 'Crêpes bar',      color: '#C97A4A',        raw: '#C97A4A', kind: 'kitchen', custom: true },
  ];
  const findStation = (id) => STATIONS.find((s) => s.id === id);

  /* ───────────── data · MENU items (id, name, desc, price, stations[]) ─── */
  const CATS = [
    { key: 'entrees',  label: 'Entrées',  count: 5 },
    { key: 'tajines',  label: 'Tajines',  count: 5 },
    { key: 'couscous', label: 'Couscous', count: 4 },
    { key: 'desserts', label: 'Desserts', count: 4 },
    { key: 'boissons', label: 'Boissons', count: 5 },
  ];
  const MENU = {
    entrees: [
      { id: 'ent-1', n: 'Salade marocaine',     d: 'Tomate, concombre, oignon, huile d\'olive',     p: 32,  st: 'ok',  stations: ['salade'],            sold: 142, rank: 6  },
      { id: 'ent-2', n: 'Caviar d\'aubergine',  d: 'Aubergine fumée, ail, cumin',                   p: 28,  st: 'ok',  stations: ['salade'],            sold: 96,  rank: 11 },
      { id: 'ent-3', n: 'Briouates viande',     d: 'Triangles croustillants, bœuf mijoté',          p: 45,  st: 'ok',  stations: ['cuisson'],           sold: 84,  rank: 8  },
      { id: 'ent-4', n: 'Harira',               'd': 'Soupe pois chiches & lentilles',              p: 28,  st: 'ok',  stations: ['cuisson'],           sold: 98,  rank: 7  },
      { id: 'ent-5', n: 'Zaalouk',              d: 'Aubergine fumée, tomate, ail',                  p: 28,  st: 'low', stations: ['salade'],            sold: 56,  rank: 12 },
    ],
    tajines: [
      { id: 'taj-1', n: 'Tajine kefta œuf',     d: 'Viande hachée, œuf, tomate, épices',           p: 85,  st: 'ok',  stations: ['cuisson'],           sold: 312, rank: 1  },
      { id: 'taj-2', n: 'Tajine agneau pruneaux', d: 'Agneau mijoté, pruneaux, amandes',           p: 110, st: 'out', stations: ['cuisson'],           sold: 184, rank: 4  },
      { id: 'taj-3', n: 'Tajine poulet citron', d: 'Poulet, olives, citron confit',                p: 95,  st: 'ok',  stations: ['cuisson'],           sold: 226, rank: 3  },
      { id: 'taj-4', n: 'Méchoui',              d: 'Agneau rôti à la braise, parts pour 2 · 4',    p: 180, st: 'low', stations: ['bbq'],               sold: 24,  rank: 16 },
      { id: 'taj-5', n: 'Pastilla poulet',      d: 'Feuille fine, amandes, cannelle, sucre glace', p: 120, st: 'low', stations: ['cuisson', 'pastry'], sold: 156, rank: 5  },
    ],
    couscous: [
      { id: 'cou-1', n: 'Couscous royal',       d: 'Bœuf, poulet, merguez, légumes',               p: 95,  st: 'ok',  stations: ['cuisson'],           sold: 287, rank: 2  },
      { id: 'cou-2', n: 'Couscous légumes',     d: '7 légumes, pois chiches, raisins',             p: 68,  st: 'ok',  stations: ['cuisson'],           sold: 64,  rank: 9  },
      { id: 'cou-3', n: 'Couscous agneau',      d: 'Agneau braisé, oignons confits',               p: 105, st: 'low', stations: ['cuisson'],           sold: 98,  rank: 7  },
      { id: 'cou-4', n: 'Couscous tfaya',       d: 'Poulet, oignons caramélisés, raisins',         p: 88,  st: 'ok',  stations: ['cuisson'],           sold: 72,  rank: 10 },
    ],
    desserts: [
      { id: 'des-1', n: 'Msemen beurre & miel', d: 'Crêpe feuilletée, beurre, miel d\'eucalyptus', p: 12,  st: 'ok',  stations: ['pastry'],            sold: 221, rank: 6  },
      { id: 'des-2', n: 'Crêpe complète',       d: 'Œuf, jambon de dinde, fromage, beurre',        p: 38,  st: 'ok',  stations: ['crepes'],            sold: 64,  rank: 11 },
      { id: 'des-3', n: 'Cornes de gazelle',    d: 'Pâte d\'amande, fleur d\'oranger',             p: 28,  st: 'low', stations: ['pastry'],            sold: 72,  rank: 11 },
      { id: 'des-4', n: 'Sellou',               d: 'Graines de sésame, amandes, miel',             p: 30,  st: 'ok',  stations: ['pastry'],            sold: 38,  rank: 13 },
    ],
    boissons: [
      { id: 'bo-1',  n: 'Thé à la menthe',       d: 'Gunpowder, menthe fraîche, sucre',            p: 12,  st: 'ok',  stations: ['boissons'],          sold: 412, rank: 5  },
      { id: 'bo-2',  n: 'Orange pressée',        d: 'Pressée minute · oranges Souss',              p: 18,  st: 'ok',  stations: ['boissons'],          sold: 198, rank: 7  },
      { id: 'bo-3',  n: 'Café noir double',      d: 'Espresso double · grain Algeria',             p: 14,  st: 'ok',  stations: ['boissons'],          sold: 124, rank: 10 },
      { id: 'bo-4',  n: 'Cocktail mocktail',     d: 'Citron vert, menthe, fleur d\'oranger',       p: 32,  st: 'ok',  stations: ['bar'],               sold: 87,  rank: 8  },
      { id: 'bo-5',  n: 'Limonade traditionnelle', d: 'Citron, eau de fleur d\'oranger, gazeuse', p: 16,  st: 'ok',  stations: ['boissons'],          sold: 54,  rank: 14 },
    ],
  };
  const allItems = () => Object.values(MENU).flat();
  const itemsForStation = (sid) => allItems().filter((it) => it.stations.includes(sid));
  const stationStats = (sid) => {
    const items = itemsForStation(sid);
    return { items: items.length, sold: items.reduce((acc, it) => acc + it.sold, 0) };
  };

  /* ───────────── injected styles · station chips + extras ───────────── */
  if (!document.querySelector('#kiwi-stations-css')) {
    const css = document.createElement('style');
    css.id = 'kiwi-stations-css';
    css.textContent = `
      .kiwi-st-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; font-family: var(--mono); letter-spacing: 0.04em; padding: 3px 7px 3px 6px; border-radius: 7px; background: var(--paper-soft); border: 1px solid var(--n-200); color: var(--n-600); white-space: nowrap; line-height: 1.2; }
      html[data-theme="dark"] .kiwi-st-chip { background: var(--paper-muted); }
      .kiwi-st-chip i { display: inline-block; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .kiwi-st-chip.solid { background: var(--ink); color: var(--paper); border-color: transparent; }
      .kiwi-st-chips { display: inline-flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; }
      .menu-row .kiwi-st-chips { margin-top: 5px; }

      .kiwi-st-pick { display: flex; gap: 7px; flex-wrap: wrap; padding: 4px 0 2px; }
      .kiwi-st-opt { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--n-200); background: var(--paper-soft); color: var(--n-600); font-size: 12.5px; cursor: pointer; transition: all 140ms; user-select: none; }
      html[data-theme="dark"] .kiwi-st-opt { background: var(--paper-muted); }
      .kiwi-st-opt:hover { border-color: var(--ink); color: var(--ink); }
      .kiwi-st-opt.on { background: var(--atlas); color: var(--paper); border-color: var(--atlas); }
      .kiwi-st-opt.on i { background: var(--mint) !important; }
      .kiwi-st-opt i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
      .kiwi-st-opt .kind { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.08em; opacity: 0.66; text-transform: uppercase; }

      .kiwi-st-mgr { display: grid; grid-template-columns: 28px 1fr auto auto; gap: 14px; align-items: center; padding: 13px 4px; border-bottom: 1px solid var(--n-200); }
      .kiwi-st-mgr:last-child { border-bottom: 0; }
      .kiwi-st-mgr .sw { width: 22px; height: 22px; border-radius: 7px; }
      .kiwi-st-mgr .nm { font-weight: 500; font-size: 14px; letter-spacing: -0.005em; }
      .kiwi-st-mgr .nm .m { font-size: 11.5px; color: var(--n-500); margin-top: 2px; font-family: var(--mono); letter-spacing: 0.04em; text-transform: uppercase; }
      .kiwi-st-mgr .ct { font-family: var(--mono); font-size: 12px; color: var(--ink); background: var(--paper-soft); padding: 4px 9px; border-radius: 999px; font-weight: 500; }

      .kiwi-st-swatch { display: inline-block; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: transform 120ms; }
      .kiwi-st-swatch:hover { transform: scale(1.08); }
      .kiwi-st-swatch.on { border-color: var(--ink); transform: scale(1.08); box-shadow: 0 0 0 2px var(--paper); }

      .kds-st-tabs { display: flex; gap: 6px; overflow-x: auto; padding: 4px 0 8px; margin: 2px 0 14px; border-bottom: 1px solid var(--n-200); }
      .kds-st-tab { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 10px 10px 0 0; border: 1px solid transparent; background: transparent; color: var(--n-500); font-size: 13px; font-weight: 500; letter-spacing: -0.005em; cursor: pointer; transition: color 140ms, background 140ms; white-space: nowrap; flex-shrink: 0; margin-bottom: -1px; }
      .kds-st-tab:hover { color: var(--ink); background: var(--paper-soft); }
      .kds-st-tab.on { color: var(--ink); background: var(--paper); border-color: var(--n-200); border-bottom-color: var(--paper); }
      html[data-theme="dark"] .kds-st-tab.on { background: var(--paper-muted); border-bottom-color: var(--paper-muted); }
      .kds-st-tab i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .kds-st-tab .ct { font-family: var(--mono); font-size: 10.5px; color: var(--n-500); padding: 1px 6px; background: var(--paper-soft); border-radius: 999px; }
      html[data-theme="dark"] .kds-st-tab .ct { background: var(--paper-muted); }
      .kds-st-tab.on .ct { color: var(--atlas); background: var(--mint-soft); }

      .kds-tk-st-line { display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 13px; line-height: 1.3; }
      .kds-tk-st-line .q { font-family: var(--mono); font-weight: 600; min-width: 24px; color: var(--n-600); }
      .kds-tk-st-line .nm { flex: 1; }
      .kds-tk-st-line .stations { display: inline-flex; gap: 4px; }
      .kds-tk-st-line.muted { opacity: 0.32; }
      .kds-tk-st-line.muted .nm { text-decoration: line-through; }
    `;
    document.head.appendChild(css);
  }

  /* ───────────── helpers · station chip rendering ───────────── */
  const stationChip = (sid, opts = {}) => {
    const s = findStation(sid);
    if (!s) return '';
    const cls = opts.solid ? 'kiwi-st-chip solid' : 'kiwi-st-chip';
    const bg = opts.solid ? `style="background:${s.raw}; color:var(--paper);"` : '';
    return `<span class="${cls}" ${bg} title="${s.name} · ${s.kind === 'bar' ? 'bar' : 'cuisine'}"><i style="background:${s.raw};"></i>${s.name}</span>`;
  };
  const stationKindLabel = (k) => (k === 'bar' ? 'BAR' : 'CUISINE');
  const stationSummaryHtml = () => STATIONS.map((s) => {
    const stats = stationStats(s.id);
    return `<div style="display:grid; grid-template-columns:14px 1fr auto; gap:10px; align-items:center; background:#fff; border:1px solid var(--n-200); border-radius:10px; padding:10px 12px;"><span style="width:10px; height:10px; border-radius:50%; background:${s.raw};"></span><div><div style="font-weight:500;">${s.name}</div><div style="font-size:10.5px; color:var(--n-500); font-family:var(--mono); letter-spacing:0.06em; text-transform:uppercase;">${stationKindLabel(s.kind)}${s.custom ? ' · custom' : ''}</div></div><span class="mono" style="font-size:11px; color:var(--n-500);">${stats.items} items · ${stats.sold} vendus</span></div>`;
  }).join('');

  /* ───────────── helper: dismiss buttons ───────────── */
  const wireDismiss = (m) => {
    if (!m || !m.el) return;
    m.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-dismiss]')) m.close();
    });
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *   handlers['nav-menu']  ·  Menu & stations
   * ═════════════════════════════════════════════════════════════════════════ */
  /* ─── Options data · sample modifier groups (Glovo-style) ─────────────── */
  const OPTION_GROUPS = [
    { id: 'opt-cuisson',  name: 'Cuisson',            kind: 'radio',  applies: 6,  vals: [
      { n: 'Bleu' }, { n: 'Saignant' }, { n: 'À point' }, { n: 'Bien cuit' }
    ]},
    { id: 'opt-supp',     name: 'Suppléments fromage', kind: 'multi', applies: 12, vals: [
      { n: 'Cheddar', p: 8 }, { n: 'Comté', p: 12 }, { n: 'Bleu', p: 10 }, { n: 'Mozzarella', p: 8 }
    ]},
    { id: 'opt-sauces',   name: 'Sauces',              kind: 'multi', applies: 18, vals: [
      { n: 'BBQ' }, { n: 'Mayo' }, { n: 'Andalouse' }, { n: 'Algérienne' }, { n: 'Samouraï' }, { n: 'Harissa' }
    ]},
    { id: 'opt-pain',     name: 'Pain à part',         kind: 'toggle', applies: 8, vals: [ { n: 'Oui' } ]},
    { id: 'opt-cor',      name: 'Sans coriandre',      kind: 'toggle', applies: 22, vals: [ { n: 'Oui' } ]},
    { id: 'opt-piment',   name: 'Sans piment',         kind: 'toggle', applies: 14, vals: [ { n: 'Oui' } ]},
    { id: 'opt-boisson',  name: 'Boisson menu',        kind: 'radio',  applies: 5,  vals: [
      { n: 'Coca' }, { n: 'Coca Zero' }, { n: 'Sprite' }, { n: 'Thé menthe' }, { n: 'Eau' }
    ]},
    { id: 'opt-acc',      name: 'Accompagnement',      kind: 'radio',  applies: 9,  vals: [
      { n: 'Frites maison' }, { n: 'Salade verte' }, { n: 'Riz safrané' }, { n: 'Légumes vapeur' }
    ]},
  ];
  const optionKindLabel = (k) => k === 'radio' ? 'CHOIX UNIQUE' : k === 'multi' ? 'CHOIX MULTIPLE' : 'INTERRUPTEUR';

  /* ─── thumbnail glyph picker ───────────────────────────────────────────── */
  const itemGlyph = (n) =>
    /tajine/i.test(n)   ? '◉' :
    /couscous/i.test(n) ? '◓' :
    /pastilla/i.test(n) ? '✦' :
    /salade/i.test(n)   ? '◴' :
    /briouate|harira/i.test(n) ? '◔' :
    /msemen|crêpe|cornes|sellou/i.test(n) ? '✺' :
    /thé|café|coffee/i.test(n) ? '☕' :
    /orange|limonade|cocktail|jus/i.test(n) ? '◍' :
    /méchoui|bbq/i.test(n) ? '◈' :
    /zaalouk|aubergine|caviar/i.test(n) ? '◐' :
                          '●';

  /* ═══════════════════════════════════════════════════════════════════════
   *   handlers['nav-menu']  ·  Menu (Glovo-inspired) — Produits | Options | Stations
   *   Two-column layout (category rail + items pane) with three top-level tabs.
   * ═════════════════════════════════════════════════════════════════════════ */
  handlers['nav-menu'] = () => {
    let activeTab = 'products';       // products | options | stations
    let activeCat = 'tajines';
    let searchTerm = '';
    const menu86 = new Set(['taj-2']);

    const stockChip = (st) =>
      st === 'ok'  ? '' :
      st === 'low' ? '<span class="chip pend" style="font-size:9.5px;">stock bas</span>' :
                     '<span class="chip ref" style="font-size:9.5px;">RUPTURE</span>';

    /* ── helpers ─────────────────────────────────────────────────────────── */
    const catItems = (key) => MENU[key] || [];
    const catAlerts = (key) => catItems(key).filter((it) => menu86.has(it.id) || it.st === 'out').length;
    const catActive = (key) => catItems(key).filter((it) => !menu86.has(it.id)).length;

    const matchSearch = (it) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return it.n.toLowerCase().includes(q)
        || it.d.toLowerCase().includes(q)
        || it.stations.some((sid) => (findStation(sid)?.name || '').toLowerCase().includes(q));
    };

    /* ── rail · category cards ───────────────────────────────────────────── */
    const renderRail = () => `
      <button class="kw-cat-add" data-action="menu-cat-add">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
        Ajouter une catégorie
      </button>
      ${CATS.map((c) => {
        const alerts = catAlerts(c.key);
        const total = catItems(c.key).length;
        return `
          <button class="kw-cat-card ${c.key === activeCat ? 'on' : ''}" data-cat="${c.key}">
            <div class="body">
              <div class="nm">${c.label}</div>
              <div class="ct">${total} produit${total > 1 ? 's' : ''}</div>
            </div>
            <div class="meta">
              ${alerts > 0 ? `<span class="badge alert" title="${alerts} en rupture / 86'd">${alerts}</span>` : ''}
              <span class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></span>
            </div>
          </button>`;
      }).join('')}
    `;

    /* ── items pane · single category ───────────────────────────────────── */
    const renderItem = (it) => {
      const is86 = menu86.has(it.id);
      const stationChips = it.stations.map(stationChip).join('');
      return `
        <div class="kw-item ${is86 ? 'is-86' : ''}" data-row="${it.id}">
          <div class="thumb">${itemGlyph(it.n)}</div>
          <div class="body">
            <div class="nm">${it.n} ${stockChip(is86 ? 'out' : it.st)}</div>
            <div class="desc">${it.d}</div>
            <button class="view-opt" data-row-act="edit" data-id="${it.id}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 8v4l3 2"/></svg>
              Voir les options
            </button>
            <div class="st-chips" data-st-row="${it.id}">${stationChips}</div>
          </div>
          <div class="price">${it.p.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')} MAD<span class="rk">#${it.rank} · ${it.sold} vendus</span></div>
          <span class="sw ${is86 ? '' : 'on'}" data-row-act="86" data-id="${it.id}" title="${is86 ? '86 (rupture)' : 'En stock — cliquer pour 86'}" role="switch" aria-checked="${!is86}"></span>
        </div>`;
    };

    const renderItemsPane = () => {
      const cat = CATS.find((c) => c.key === activeCat);
      const list = catItems(activeCat).filter(matchSearch);
      const body = list.length
        ? list.map(renderItem).join('')
        : `<div class="kw-items-empty">Aucun produit ne correspond${searchTerm ? ` à « ${searchTerm} »` : ''}.</div>`;
      return `
        <div class="kw-items-pane">
          <div class="kw-items-head">
            <h3>
              ${cat ? cat.label.toUpperCase() : '—'}
              <span class="edit-cat" data-action="menu-cat-edit" title="Renommer · supprimer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z"/></svg>
              </span>
            </h3>
            <button class="add-prod" data-action="menu-add">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter un produit
            </button>
          </div>
          ${body}
        </div>`;
    };

    const renderProductsTab = () => `
      <div class="kw-menu-grid">
        <div class="kw-cat-rail" id="kw-cat-rail">${renderRail()}</div>
        <div id="kw-items-pane">${renderItemsPane()}</div>
      </div>
    `;

    /* ── Options tab pane ───────────────────────────────────────────────── */
    const kindPill = (k) => `<span class="kind-pill">${optionKindLabel(k)}</span>`;
    const renderOptionGroup = (g) => `
      <div class="kw-opt-group" data-opt="${g.id}">
        <div class="h">
          <div>
            <div class="nm">${g.name} ${kindPill(g.kind)}</div>
            <div class="meta">Appliqué à ${g.applies} produit${g.applies > 1 ? 's' : ''} · ${g.vals.length} option${g.vals.length > 1 ? 's' : ''}</div>
          </div>
          <button class="kw-menu-action icon" title="Éditer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z"/></svg>
          </button>
        </div>
        <div class="vals">
          ${g.vals.map((v) => `<span class="v ${v.p ? 'priced' : ''}">${v.n}${v.p ? `<span class="pr">+${v.p} MAD</span>` : ''}</span>`).join('')}
        </div>
      </div>
    `;
    const renderOptionsTab = () => `
      <div class="kw-opt-pane">
        <div class="head">
          <div>
            <h3>Groupes d'options</h3>
            <div class="sub">${OPTION_GROUPS.length} groupes · attachez-les à un produit depuis l'éditeur d'item.</div>
          </div>
          <button class="kw-menu-action" data-action="menu-opt-add" style="background:var(--ink); color:var(--paper); border-color:var(--ink);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Créer un groupe
          </button>
        </div>
        ${OPTION_GROUPS.map(renderOptionGroup).join('')}
      </div>
    `;

    /* ── Stations tab pane ──────────────────────────────────────────────── */
    const renderStationCard = (s) => {
      const stats = stationStats(s.id);
      return `
        <div class="kw-st-card" data-st="${s.id}">
          <span class="sw" style="background:${s.raw};"></span>
          <div class="body">
            <div class="nm">${s.name}</div>
            <div class="kind">${stationKindLabel(s.kind)}${s.custom ? ' · personnalisée' : ''}</div>
            <div class="stats">
              <div><b>${stats.items}</b>item${stats.items > 1 ? 's' : ''} routé${stats.items > 1 ? 's' : ''}</div>
              <div><b>${stats.sold.toLocaleString('fr-FR')}</b>vendus / 30 j</div>
            </div>
            <div class="row-actions">
              ${s.custom
                ? `<button class="kw-menu-action" data-st-delete-id="${s.id}" style="padding:6px 12px; font-size:11.5px;">Supprimer</button>`
                : `<span class="badge-sys">SYSTÈME</span>`}
              ${s.custom ? `<span class="badge-cust">CUSTOM</span>` : ''}
            </div>
          </div>
        </div>`;
    };
    const renderStationsTab = () => `
      <div class="kw-st-pane">
        <div class="head">
          <div>
            <h3>Stations de préparation</h3>
            <div class="sub">${STATIONS.length} stations actives · chaque produit est routé vers 1+ station${STATIONS.length > 1 ? 's' : ''}. Les tickets KDS apparaissent simultanément.</div>
          </div>
          <button class="kw-menu-action" data-action="menu-station-create" style="background:var(--atlas); color:var(--paper); border-color:var(--atlas);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Créer une station
          </button>
        </div>
        <div class="kw-st-grid">${STATIONS.map(renderStationCard).join('')}</div>
        <div style="margin-top:14px; padding:14px 16px; background:var(--paper-soft); border-radius:10px; font-size:12.5px; color:var(--n-600); line-height:1.5; display:flex; gap:10px; align-items:flex-start;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--atlas); flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/></svg>
          <div><b>Astuce :</b> ajoutez une station "Pizza four" ou "Bar à jus" si votre établissement a une zone dédiée. Le KDS basculera automatiquement vers la nouvelle station dans les 5 secondes.</div>
        </div>
      </div>
    `;

    /* ── full body ──────────────────────────────────────────────────────── */
    const tabCounts = {
      products: allItems().length,
      options:  OPTION_GROUPS.length,
      stations: STATIONS.length,
    };

    const renderTabBody = () =>
      activeTab === 'products' ? renderProductsTab() :
      activeTab === 'options'  ? renderOptionsTab()  :
                                 renderStationsTab();

    const menuDr = fullpage({
      title: 'Menu · Café Atlas',
      subtitle: `${allItems().length} produits · ${CATS.length} catégories · ${STATIONS.length} stations · ${menu86.size} en rupture`,
      width: 1080,
      body: `
        <div class="p-kpis">
          <div class="p-kpi"><div class="l">CARTE ACTIVE</div><div class="v">${allItems().length}<span class="u"> produits</span></div><div class="d up">+ 3 ce mois</div></div>
          <div class="p-kpi"><div class="l">PANIER MOYEN</div><div class="v">158<span class="u"> MAD</span></div><div class="d up">+ 4,2 % vs sem. dernière</div></div>
          <div class="p-kpi"><div class="l">STATIONS</div><div class="v">${STATIONS.length}</div><div class="d">${STATIONS.filter((s) => s.kind === 'kitchen').length} cuisine · ${STATIONS.filter((s) => s.kind === 'bar').length} bar</div></div>
          <div class="p-kpi" style="background:rgba(201,74,58,0.06); border-color:rgba(201,74,58,0.25);"><div class="l">EN RUPTURE</div><div class="v" style="color:var(--danger);">${menu86.size}</div><div class="d">tajine agneau · etc.</div></div>
        </div>

        <div class="menu-ai">
          <div class="ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="currentColor"/></svg>
          </div>
          <div class="b">
            <div class="t">INSIGHT KIWI · STATIONS</div>
            <div class="n">La station Cuisson chaude porte 64 % du chiffre · pensez à équilibrer.</div>
            <div class="d">Le tajine kefta œuf et le couscous royal saturent la cuisson aux pics. Le bar et la pâtisserie sont sous-utilisés à midi.</div>
          </div>
          <button class="kb" style="background:var(--mint); color:var(--riad);" data-action="menu-promote">Voir suggestions</button>
        </div>

        <div class="kw-menu-tabs" id="kw-menu-tabs">
          <button class="kw-menu-tab ${activeTab === 'products' ? 'on' : ''}" data-tab="products">
            Produits <span class="ct">${tabCounts.products}</span>
          </button>
          <button class="kw-menu-tab ${activeTab === 'options' ? 'on' : ''}" data-tab="options">
            Options <span class="ct">${tabCounts.options}</span>
          </button>
          <button class="kw-menu-tab ${activeTab === 'stations' ? 'on' : ''}" data-tab="stations">
            Stations <span class="ct">${tabCounts.stations}</span>
          </button>
        </div>

        <div class="kw-menu-toolbar">
          <label class="kw-menu-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input id="kw-menu-search-input" type="text" placeholder="Rechercher un produit, une station, un allergène…" />
          </label>
          <button class="kw-menu-action" data-action="menu-schedule" title="Plages horaires">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            Filtres
          </button>
          <button class="kw-menu-action icon" title="Plus" data-action="menu-publish">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
          </button>
        </div>

        <div id="kw-menu-tab-body">${renderTabBody()}</div>
      `,
      foot: `
        <div style="display:flex; gap:8px; justify-content:space-between; width:100%; align-items:center;">
          <span style="font-family:var(--mono); font-size:11px; color:var(--n-500); letter-spacing:0.06em;">SYNC POS · 100 % · ROUTAGE STATIONS LIVE</span>
          <div style="display:flex; gap:8px;">
            <button class="kb ghost" data-dismiss>Fermer</button>
            <button class="kb primary" data-action="menu-publish">Publier la carte</button>
          </div>
        </div>
      `,
    });
    wireDismiss(menuDr);

    /* ── wire: tabs + rail + items ─────────────────────────────────────── */
    setTimeout(() => {
      const root = menuDr.el;
      if (!root) return;

      const body = root.querySelector('#kw-menu-tab-body');
      const tabs = root.querySelector('#kw-menu-tabs');
      const searchInput = root.querySelector('#kw-menu-search-input');

      const refreshTabBody = () => {
        body.innerHTML = renderTabBody();
        wireBody();
      };

      const refreshRail = () => {
        const rail = root.querySelector('#kw-cat-rail');
        if (rail) rail.innerHTML = renderRail();
        wireRail();
      };

      const refreshItems = () => {
        const pane = root.querySelector('#kw-items-pane');
        if (pane) pane.innerHTML = renderItemsPane();
        wireItems();
      };

      const refreshSubtitle = () => {
        const sub = root.querySelector('.kiwi-drawer-head p');
        if (sub) sub.textContent = `${allItems().length} produits · ${CATS.length} catégories · ${STATIONS.length} stations · ${menu86.size} en rupture`;
      };

      const wireRail = () => {
        body.querySelectorAll('.kw-cat-card').forEach((btn) => {
          btn.onclick = () => {
            const key = btn.getAttribute('data-cat');
            if (key === activeCat) return;
            activeCat = key;
            refreshRail();
            refreshItems();
          };
        });
      };

      const wireItems = () => {
        const pane = body.querySelector('#kw-items-pane');
        if (!pane) return;
        pane.querySelectorAll('[data-row-act]').forEach((b) => {
          b.onclick = (e) => {
            e.stopPropagation();
            const a = b.getAttribute('data-row-act');
            const id = b.getAttribute('data-id');
            const it = allItems().find((x) => x.id === id);
            if (!it) return;
            if (a === '86') {
              if (menu86.has(id)) menu86.delete(id);
              else menu86.add(id);
              toast(menu86.has(id) ? `${it.n} marqué en rupture` : `${it.n} de retour à la carte`, {
                type: menu86.has(id) ? 'warn' : 'success',
                desc: menu86.has(id) ? 'Retiré du POS et de Glovo · Jumia notifié.' : 'Produit disponible sur tous les canaux.',
              });
              refreshItems();
              refreshRail();
              refreshSubtitle();
            }
            if (a === 'edit') openItemEdit(it, () => { refreshItems(); refreshRail(); });
          };
        });
        pane.querySelectorAll('.kw-item').forEach((r) => {
          r.addEventListener('click', (e) => {
            if (e.target.closest('[data-row-act]')) return;
            const id = r.getAttribute('data-row');
            const it = allItems().find((x) => x.id === id);
            if (it) openItemEdit(it, () => { refreshItems(); refreshRail(); });
          });
        });
      };

      const wireStations = () => {
        body.querySelectorAll('.kw-st-card').forEach((card) => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('[data-st-delete-id]')) return;
            const sid = card.getAttribute('data-st');
            const s = findStation(sid);
            if (s) toast(`Station "${s.name}"`, { type: 'info', desc: `${stationStats(sid).items} produits routés · ${stationKindLabel(s.kind)}.` });
          });
        });
        body.querySelectorAll('[data-st-delete-id]').forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const sid = btn.getAttribute('data-st-delete-id');
            const s = findStation(sid);
            if (!s) return;
            const stats = stationStats(sid);
            if (stats.items > 0) {
              toast(`Impossible · ${stats.items} produit${stats.items > 1 ? 's' : ''} routé${stats.items > 1 ? 's' : ''}`, {
                type: 'warn',
                desc: `Réaffectez les produits de la station "${s.name}" avant de la supprimer.`,
              });
              return;
            }
            const idx = STATIONS.findIndex((x) => x.id === sid);
            if (idx >= 0) STATIONS.splice(idx, 1);
            refreshTabBody();
            refreshSubtitle();
            toast(`Station "${s.name}" supprimée`, { type: 'success' });
          };
        });
      };

      const wireOptions = () => {
        body.querySelectorAll('.kw-opt-group').forEach((g) => {
          g.addEventListener('click', () => {
            const id = g.getAttribute('data-opt');
            const grp = OPTION_GROUPS.find((x) => x.id === id);
            if (grp) toast(`Groupe "${grp.name}"`, { type: 'info', desc: `${optionKindLabel(grp.kind)} · ${grp.vals.length} options · attaché à ${grp.applies} produits.` });
          });
        });
      };

      const wireBody = () => {
        if (activeTab === 'products') { wireRail(); wireItems(); }
        if (activeTab === 'options')  { wireOptions(); }
        if (activeTab === 'stations') { wireStations(); }
      };

      // Tabs
      tabs.querySelectorAll('.kw-menu-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          const t = btn.getAttribute('data-tab');
          if (t === activeTab) return;
          activeTab = t;
          tabs.querySelectorAll('.kw-menu-tab').forEach((b) => b.classList.toggle('on', b === btn));
          refreshTabBody();
        });
      });

      // Search
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          searchTerm = searchInput.value.trim();
          if (activeTab === 'products') refreshItems();
        });
      }

      // Expose hooks for external handlers (station create modal etc.)
      root.__kiwiMenu = {
        refreshAllRowChips: refreshItems,
        refreshSummary: refreshTabBody,
        refreshTabBody,
      };

      wireBody();
    }, 0);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *   Item edit modal (with station picker)
   * ═════════════════════════════════════════════════════════════════════════ */
  const openItemEdit = (it, onSave) => {
    const draftStations = new Set(it.stations);

    const renderStationPicker = () => STATIONS.map((s) => `
      <button type="button" class="kiwi-st-opt ${draftStations.has(s.id) ? 'on' : ''}" data-st-toggle="${s.id}">
        <i style="background:${s.raw};"></i>${s.name}
        <span class="kind">· ${s.kind === 'bar' ? 'bar' : 'cuisine'}</span>
      </button>`).join('');

    const editM = modal({
      tag: 'ITEM',
      title: it.n,
      desc: it.d,
      width: 640,
      body: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Nom</label><input class="kf-input" value="${it.n}" /></div>
          <div class="kf-group"><label class="kf-label">Prix TTC</label><input class="kf-input mono" value="${it.p}.00" /></div>
        </div>
        <div class="kf-group">
          <label class="kf-label">Description courte</label>
          <input class="kf-input" value="${it.d}" />
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Catégorie</label>
            <select class="kf-input">
              ${CATS.map((c) => `<option ${MENU[c.key].some((x) => x.id === it.id) ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="kf-group"><label class="kf-label">Temps de prep.</label>
            <select class="kf-input"><option>5 min</option><option>10 min</option><option selected>15 min</option><option>20 min</option><option>25 min</option><option>30 min</option></select>
          </div>
        </div>

        <div class="kf-group" style="margin-top:8px;">
          <label class="kf-label" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Stations de préparation</span>
            <span class="meta" style="font-family:var(--mono); font-size:10.5px; color:var(--n-500); letter-spacing:0.06em;">SÉLECTIONNEZ 1 OU PLUSIEURS</span>
          </label>
          <div class="kiwi-st-pick" id="kiwi-st-pick">${renderStationPicker()}</div>
          <div class="kf-help">Le ticket KDS apparaîtra simultanément sur chaque station sélectionnée. Idéal pour les plats croisés (ex. pastilla = cuisson + pâtisserie).</div>
        </div>

        <div class="kf-group">
          <label class="kf-label">Modificateurs autorisés</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${['Sans coriandre', 'Sans piment', 'Pain à part', 'Bien cuit', 'Saignant', 'Sans gluten'].map((m, i) => `<span class="chip ${i < 3 ? 'ok' : 'neutral'}" style="cursor:pointer;">${i < 3 ? '✓ ' : ''}${m}</span>`).join('')}
          </div>
        </div>

        <div class="p-card" style="margin:14px 0 0;">
          <div class="head"><h4 style="font-size:13px;">Performance · 30 derniers jours</h4><span class="meta">RANG #${it.rank}</span></div>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; font-size:12.5px;">
            <div><div style="color:var(--n-500); font-size:11px;">Vendus</div><div class="mono" style="font-size:18px; font-weight:600;">${it.sold}</div></div>
            <div><div style="color:var(--n-500); font-size:11px;">CA</div><div class="mono" style="font-size:18px; font-weight:600;">${(it.p * it.sold).toLocaleString('fr-FR')} MAD</div></div>
            <div><div style="color:var(--n-500); font-size:11px;">Marge brute</div><div class="mono" style="font-size:18px; font-weight:600; color:var(--atlas);">66 %</div></div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Annuler</button>
        <button class="kb danger" data-st-delete>Supprimer</button>
        <button class="kb atlas" data-st-save>Enregistrer</button>
      `,
    });
    wireDismiss(editM);

    setTimeout(() => {
      const root = editM.el;
      if (!root) return;
      const pick = root.querySelector('#kiwi-st-pick');
      pick.addEventListener('click', (e) => {
        const t = e.target.closest('[data-st-toggle]');
        if (!t) return;
        const sid = t.getAttribute('data-st-toggle');
        if (draftStations.has(sid)) {
          if (draftStations.size === 1) {
            toast('Au moins 1 station requise', { type: 'warn', desc: 'Le ticket doit pouvoir être routé quelque part.' });
            return;
          }
          draftStations.delete(sid);
        } else {
          draftStations.add(sid);
        }
        t.classList.toggle('on', draftStations.has(sid));
      });

      root.querySelector('[data-st-save]').addEventListener('click', () => {
        it.stations = Array.from(draftStations);
        const stationNames = it.stations.map((sid) => findStation(sid).name).join(' · ');
        editM.close();
        toast(`${it.n} mis à jour`, { type: 'success', desc: `Routé sur ${it.stations.length} station${it.stations.length > 1 ? 's' : ''} · ${stationNames}` });
        onSave?.();
      });
      root.querySelector('[data-st-delete]').addEventListener('click', () => {
        editM.close();
        toast(`${it.n} supprimé de la carte`, { type: 'warn', desc: 'Item retiré · les commandes ouvertes restent valides.' });
      });
    }, 0);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *   handlers · gestion des stations
   * ═════════════════════════════════════════════════════════════════════════ */
  const refreshMenuDrawer = () => {
    const m = document.querySelector('.kiwi-drawer-backdrop .kiwi-drawer');
    if (m && m.parentElement && m.parentElement.__kiwiMenu) {
      m.parentElement.__kiwiMenu.refreshAllRowChips();
      m.parentElement.__kiwiMenu.refreshSummary();
    }
  };

  handlers['menu-stations-manage'] = () => {
    const renderList = () => STATIONS.map((s) => {
      const stats = stationStats(s.id);
      return `
        <div class="kiwi-st-mgr" data-st-mgr="${s.id}">
          <span class="sw" style="background:${s.raw};"></span>
          <div class="nm">${s.name}<div class="m">${stationKindLabel(s.kind)}${s.custom ? ' · personnalisée' : ''}</div></div>
          <span class="ct">${stats.items} item${stats.items > 1 ? 's' : ''} · ${stats.sold} vendus</span>
          ${s.custom
            ? `<button class="kb ghost xs" data-st-delete-id="${s.id}">Supprimer</button>`
            : `<span class="chip neutral mono" style="font-size:9.5px; padding:3px 8px;">SYSTÈME</span>`}
        </div>`;
    }).join('');

    const m = modal({
      tag: 'STATIONS',
      title: 'Gérer les stations de préparation',
      desc: 'Chaque item de la carte est routé vers 1 ou plusieurs stations. Les stations système ne peuvent pas être supprimées.',
      width: 620,
      body: `
        <button class="kb atlas" style="width:100%; justify-content:center; margin-bottom:14px;" data-st-create>+ Créer une station personnalisée</button>
        <div id="st-mgr-list" style="background:#fff; border:1px solid var(--n-200); border-radius:12px; padding:4px 16px;">${renderList()}</div>
        <div style="margin-top:12px; padding:12px 14px; background:var(--paper-soft); border-radius:10px; font-size:12.5px; color:var(--n-600); line-height:1.5;">
          <b>Astuce :</b> ajoutez une station "Pizza four" ou "Bar à jus" si votre établissement a une zone dédiée. Le KDS basculera automatiquement vers la nouvelle station.
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss>Fermer</button>`,
    });
    wireDismiss(m);

    setTimeout(() => {
      const root = m.el;
      if (!root) return;
      const list = root.querySelector('#st-mgr-list');

      const refresh = () => { list.innerHTML = renderList(); };

      root.querySelector('[data-st-create]').addEventListener('click', () => openStationCreate(refresh));

      list.addEventListener('click', (e) => {
        const del = e.target.closest('[data-st-delete-id]');
        if (!del) return;
        const sid = del.getAttribute('data-st-delete-id');
        const s = findStation(sid);
        if (!s) return;
        const stats = stationStats(sid);
        if (stats.items > 0) {
          toast(`Impossible · ${stats.items} item${stats.items > 1 ? 's' : ''} routé${stats.items > 1 ? 's' : ''}`, {
            type: 'warn',
            desc: `Réaffectez les items de la station "${s.name}" avant de la supprimer.`,
          });
          return;
        }
        const idx = STATIONS.findIndex((x) => x.id === sid);
        if (idx >= 0) STATIONS.splice(idx, 1);
        refresh();
        refreshMenuDrawer();
        toast(`Station "${s.name}" supprimée`, { type: 'success' });
      });
    }, 0);
  };

  const openStationCreate = (afterCreate) => {
    const SWATCHES = [
      ['var(--atlas)', '#0B6E4F'], ['var(--riad)', '#053B2C'], ['var(--success)', '#1FB574'],
      ['var(--warning)', '#D99A2B'], ['var(--info)', '#3677A6'], ['var(--danger)', '#C24A2E'],
      ['#C97A4A', '#C97A4A'], ['#8B5CF6', '#8B5CF6'], ['#0EA5E9', '#0EA5E9'],
      ['#EC4899', '#EC4899'], ['#F97316', '#F97316'], ['#14B8A6', '#14B8A6'],
    ];
    let chosenColor = SWATCHES[0];
    let chosenKind = 'kitchen';

    const m = modal({
      tag: 'NOUVELLE STATION',
      title: 'Créer une station personnalisée',
      desc: 'Une nouvelle station apparaîtra immédiatement dans le sélecteur d\'item et sur le KDS.',
      width: 540,
      body: `
        <div class="kf-group">
          <label class="kf-label">Nom de la station</label>
          <input class="kf-input" id="st-new-name" placeholder="ex. Pizza four · Bar à jus · Sushi" />
        </div>
        <div class="kf-group">
          <label class="kf-label">Couleur</label>
          <div id="st-new-swatches" style="display:flex; gap:8px; flex-wrap:wrap;">
            ${SWATCHES.map((c, i) => `<span class="kiwi-st-swatch ${i === 0 ? 'on' : ''}" data-sw="${i}" style="background:${c[1]};"></span>`).join('')}
          </div>
        </div>
        <div class="kf-group">
          <label class="kf-label">Type</label>
          <div style="display:flex; gap:8px;" id="st-new-kind">
            <button type="button" class="kb atlas" data-kind="kitchen" style="flex:1; justify-content:center;">Cuisine</button>
            <button type="button" class="kb ghost" data-kind="bar" style="flex:1; justify-content:center;">Bar</button>
          </div>
        </div>
        <div style="padding:12px 14px; background:var(--paper-soft); border-radius:10px; font-size:12.5px; color:var(--n-600); line-height:1.5;">
          La station sera disponible sur tous les iPad cuisine et terminaux POS dans les 5 secondes après création.
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Annuler</button>
        <button class="kb atlas" data-st-create-go>Créer la station</button>
      `,
    });
    wireDismiss(m);

    setTimeout(() => {
      const root = m.el;
      if (!root) return;
      root.querySelector('#st-new-swatches').addEventListener('click', (e) => {
        const sw = e.target.closest('[data-sw]');
        if (!sw) return;
        chosenColor = SWATCHES[+sw.getAttribute('data-sw')];
        root.querySelectorAll('[data-sw]').forEach((x) => x.classList.toggle('on', x === sw));
      });
      root.querySelector('#st-new-kind').addEventListener('click', (e) => {
        const k = e.target.closest('[data-kind]');
        if (!k) return;
        chosenKind = k.getAttribute('data-kind');
        root.querySelectorAll('[data-kind]').forEach((x) => {
          x.classList.toggle('atlas', x === k);
          x.classList.toggle('ghost', x !== k);
        });
      });

      root.querySelector('[data-st-create-go]').addEventListener('click', () => {
        const nameInput = root.querySelector('#st-new-name');
        const name = (nameInput.value || '').trim();
        if (!name) {
          nameInput.focus();
          toast('Donnez un nom à la station', { type: 'warn' });
          return;
        }
        const id = `st-${Date.now().toString(36)}`;
        STATIONS.push({ id, name, color: chosenColor[0], raw: chosenColor[1], kind: chosenKind, custom: true });
        m.close();
        toast(`Station "${name}" créée`, { type: 'success', desc: 'Disponible sur tous les iPad cuisine et le KDS.' });
        confetti();
        afterCreate?.();
        refreshMenuDrawer();
      });
    }, 0);
  };

  handlers['menu-station-create'] = () => openStationCreate(() => {});

  /* ─── new Glovo-redesign actions (category + option group create/edit) ─── */
  handlers['menu-cat-add'] = () => {
    toast('Nouvelle catégorie', {
      type: 'info',
      desc: 'Saisissez le nom, l\'icône et les plages horaires de visibilité. Mock.',
    });
  };
  handlers['menu-cat-edit'] = () => {
    toast('Catégorie · édition', {
      type: 'info',
      desc: 'Renommer · réordonner · supprimer · plages horaires. Mock.',
    });
  };
  handlers['menu-opt-add'] = () => {
    toast('Nouveau groupe d\'options', {
      type: 'info',
      desc: 'Choix unique · multiple · interrupteur · avec ou sans surcoût. Mock.',
    });
  };

  handlers['menu-promote'] = () => {
    const m = modal({
      tag: 'INSIGHT',
      title: 'Suggestions par station',
      desc: 'Optimisations détectées par Kiwi sur les 30 derniers jours.',
      width: 520,
      body: `
        <div class="p-card" style="margin:0 0 10px;"><div class="head"><h4 style="font-size:14px;">Cuisson chaude · saturée</h4><span class="chip ref">+18 % temps de prép.</span></div><div style="font-size:12.5px; color:var(--n-500);">Pré-portionner les keftas · gain estimé 90 s/ticket.</div></div>
        <div class="p-card" style="margin:0 0 10px;"><div class="head"><h4 style="font-size:14px;">Bar cocktails · sous-utilisé midi</h4><span class="chip ok">+ marge potentielle</span></div><div style="font-size:12.5px; color:var(--n-500);">Promouvoir le mocktail · upsell +12 % panier.</div></div>
        <div class="p-card" style="margin:0;"><div class="head"><h4 style="font-size:14px;">Pâtisserie · pic petit-déjeuner</h4><span class="chip pend">files 8h–10h</span></div><div style="font-size:12.5px; color:var(--n-500);">Lancer le msemen 30 min plus tôt.</div></div>
      `,
      foot: `<button class="kb ghost" data-dismiss>Fermer</button><button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Suggestions appliquées',{type:'success'}); window.Kiwi.confetti();">Appliquer le plan</button>`,
    });
    wireDismiss(m);
  };

  handlers['menu-add'] = () => {
    const m = modal({
      tag: 'NOUVEAU',
      title: 'Ajouter un nouvel item',
      desc: 'Sera publié sur le POS, le QR menu et les agrégateurs en sync.',
      width: 600,
      body: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Nom de l'item</label><input class="kf-input" placeholder="ex. Tajine boulettes" /></div>
          <div class="kf-group"><label class="kf-label">Prix TTC</label><input class="kf-input mono" placeholder="0,00 MAD" /></div>
        </div>
        <div class="kf-group"><label class="kf-label">Catégorie</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${CATS.map((c, i) => `<button class="kb ${i === 1 ? 'atlas' : 'ghost'}" style="flex:1; min-width:90px; justify-content:center;">${c.label}</button>`).join('')}
          </div>
        </div>
        <div class="kf-group"><label class="kf-label">Stations de préparation</label>
          <div class="kiwi-st-pick">
            ${STATIONS.map((s, i) => `<span class="kiwi-st-opt ${i === 0 ? 'on' : ''}" data-st-new="${s.id}"><i style="background:${s.raw};"></i>${s.name}</span>`).join('')}
          </div>
        </div>
        <div class="kf-group"><label class="kf-label">Description (visible client)</label><input class="kf-input" placeholder="Ingrédients clés et style" /></div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Annuler</button>
        <button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Item publié sur la carte',{type:'success',desc:'Synchronisé sur POS · QR · Glovo · Jumia en 4 sec.'}); window.Kiwi.confetti();">Créer & publier</button>
      `,
    });
    wireDismiss(m);
    setTimeout(() => {
      m.el.querySelector('.kiwi-st-pick').addEventListener('click', (e) => {
        const t = e.target.closest('[data-st-new]');
        if (!t) return;
        t.classList.toggle('on');
      });
    }, 0);
  };

  handlers['menu-schedule'] = () => {
    const m = modal({
      tag: 'PLAGES HORAIRES',
      title: 'Carte programmée',
      desc: 'Affiche / cache automatiquement des items selon le service ou la saison.',
      width: 600,
      body: `
        <div class="p-card" style="margin:0 0 10px;"><div class="head"><h4 style="font-size:14px;">Couscous royal</h4><span class="chip ok">vendredi 11h–15h</span></div><div style="font-size:12.5px; color:var(--n-500);">Affiché automatiquement le vendredi.</div></div>
        <div class="p-card" style="margin:0 0 10px;"><div class="head"><h4 style="font-size:14px;">Méchoui</h4><span class="chip pend">soir 19h–23h</span></div><div style="font-size:12.5px; color:var(--n-500);">Service du soir uniquement.</div></div>
        <div class="p-card" style="margin:0;"><div class="head"><h4 style="font-size:14px;">Petit-déj.</h4><span class="chip neutral">8h–11h tous les jours</span></div><div style="font-size:12.5px; color:var(--n-500);">Msemen, harira, café, thé.</div></div>
      `,
      foot: `<button class="kb ghost" data-dismiss>Fermer</button><button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Programmation enregistrée',{type:'success'})">+ Ajouter une plage</button>`,
    });
    wireDismiss(m);
  };

  handlers['menu-publish'] = () => {
    const m = modal({
      tag: 'PUBLIER',
      title: 'Publier la carte ?',
      desc: 'La nouvelle version sera synchronisée sur tous les canaux en moins de 10 secondes.',
      width: 520,
      body: `
        <div class="p-card" style="margin:0;">
          <div class="head"><h4 style="font-size:14px;">Modifications en attente</h4><span class="meta">DEPUIS 12:42</span></div>
          <ul style="list-style:none; margin:0; padding:0; font-size:13px;">
            <li style="padding:8px 0; border-top:1px solid var(--n-200);">~ Routage stations mis à jour sur 4 items</li>
            <li style="padding:8px 0; border-top:1px solid var(--n-200);">+ Station "Barbecue" créée · 1 item routé</li>
            <li style="padding:8px 0; border-top:1px solid var(--n-200);">+ Station "Crêpes bar" créée · 1 item routé</li>
            <li style="padding:8px 0; border-top:1px solid var(--n-200);">86 : Tajine agneau pruneaux <span class="chip ref">RUPTURE</span></li>
          </ul>
        </div>
      `,
      foot: `<button class="kb ghost" data-dismiss>Garder en brouillon</button><button class="kb atlas" data-dismiss onclick="window.Kiwi.toast('Carte publiée sur 4 canaux',{type:'success',desc:'POS · QR menu · Glovo · Jumia synchronisés en 6 sec.'}); window.Kiwi.confetti();">Publier maintenant</button>`,
    });
    wireDismiss(m);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *   handlers['nav-kds']  ·  Écran cuisine avec switcher de stations
   * ═════════════════════════════════════════════════════════════════════════ */
  handlers['nav-kds'] = () => {
    const tickets = [
      { id: 'T-7821', table: 'T4',  src: 'salle',     cook: 'MM', elapsed: 412, items: [
        { q: 2, n: 'Salade marocaine',     stations: ['salade'] },
        { q: 1, n: 'Tajine kefta œuf',     stations: ['cuisson'] },
        { q: 3, n: 'Thé à la menthe',      stations: ['boissons'] },
      ] },
      { id: 'T-7822', table: 'T7',  src: 'salle',     cook: 'MM', elapsed: 198, items: [
        { q: 1, n: 'Couscous royal',       stations: ['cuisson'] },
        { q: 1, n: 'Pastilla poulet',      stations: ['cuisson', 'pastry'] },
      ] },
      { id: 'T-7823', table: 'T2',  src: 'salle',     cook: 'AY', elapsed: 632, items: [
        { q: 4, n: 'Briouates viande',     stations: ['cuisson'] },
        { q: 2, n: 'Caviar d\'aubergine',  stations: ['salade'] },
      ] },
      { id: 'T-7824', table: 'TR2', src: 'terrasse',  cook: 'AY', elapsed: 88,  items: [
        { q: 2, n: 'Méchoui',              stations: ['bbq'] },
        { q: 1, n: 'Salade marocaine',     stations: ['salade'] },
        { q: 2, n: 'Orange pressée',       stations: ['boissons'] },
      ] },
      { id: 'G-3412', table: 'GLOVO', src: 'livraison', cook: 'MM', elapsed: 548, items: [
        { q: 2, n: 'Tajine kefta œuf',     stations: ['cuisson'] },
        { q: 1, n: 'Cocktail mocktail',    stations: ['bar'] },
      ] },
      { id: 'T-7825', table: 'T9',  src: 'salle',     cook: 'AY', elapsed: 944, items: [
        { q: 1, n: 'Pastilla poulet',      stations: ['cuisson', 'pastry'] },
        { q: 1, n: 'Salade marocaine',     stations: ['salade'] },
        { q: 2, n: 'Crêpe complète',       stations: ['crepes'] },
      ] },
      { id: 'J-8821', table: 'JUMIA', src: 'livraison', cook: 'MM', elapsed: 318, items: [
        { q: 3, n: 'Tajine kefta œuf',     stations: ['cuisson'] },
        { q: 2, n: 'Msemen beurre & miel', stations: ['pastry'] },
      ] },
      { id: 'T-7826', table: 'TR1', src: 'terrasse',  cook: 'AY', elapsed: 42,  items: [
        { q: 1, n: 'Méchoui',              stations: ['bbq'] },
        { q: 4, n: 'Café noir double',     stations: ['boissons'] },
        { q: 2, n: 'Cocktail mocktail',    stations: ['bar'] },
      ] },
      { id: 'T-7827', table: 'T1',  src: 'salle',     cook: 'MM', elapsed: 154, items: [
        { q: 2, n: 'Crêpe complète',       stations: ['crepes'] },
        { q: 1, n: 'Msemen beurre & miel', stations: ['pastry'] },
        { q: 2, n: 'Thé à la menthe',      stations: ['boissons'] },
      ] },
    ];

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const cls = (s) => (s < 480 ? 'ok' : s < 900 ? 'warn' : 'over');

    let activeStation = 'all';

    const ticketStationIds = (t) => Array.from(new Set(t.items.flatMap((i) => i.stations)));
    const itemsForCurrent = (t) => activeStation === 'all' ? t.items : t.items.filter((i) => i.stations.includes(activeStation));
    const ticketsForCurrent = () => activeStation === 'all' ? tickets : tickets.filter((t) => t.items.some((i) => i.stations.includes(activeStation)));

    const ticketHtml = (t) => {
      const visible = activeStation === 'all' ? t.items : t.items;
      return `
        <div class="kds-tk ${cls(t.elapsed)}" data-tk="${t.id}" data-stations="${ticketStationIds(t).join(' ')}">
          <div class="kds-tk-head">
            <div class="kds-tk-id"><b>${t.table}</b><span class="kds-tk-src">· ${t.src}</span></div>
            <div class="kds-tk-time mono ${cls(t.elapsed)}">${fmt(t.elapsed)}</div>
          </div>
          <ul class="kds-tk-items" style="list-style:none; padding:0; margin:0;">
            ${visible.map((i) => {
              const inScope = activeStation === 'all' || i.stations.includes(activeStation);
              return `
                <li class="kds-tk-st-line ${inScope ? '' : 'muted'}">
                  <span class="q mono">×${i.q}</span>
                  <span class="nm">${i.n}</span>
                  <span class="stations">${i.stations.map(stationChip).join('')}</span>
                </li>`;
            }).join('')}
          </ul>
          <div class="kds-tk-foot">
            <span class="kds-tk-cook">Affecté : <b>${t.cook === 'MM' ? 'Mehdi M.' : 'Ayoub Y.'}</b></span>
            <span class="kds-tk-acts">
              <button class="kb ghost xs" data-action="kds-recall" data-id="${t.id}">Rappeler</button>
              <button class="kb atlas xs" data-action="kds-bump" data-id="${t.id}">Bump ✓</button>
            </span>
          </div>
        </div>`;
    };

    const stationTabsHtml = () => {
      const allCount = tickets.length;
      const allDishes = tickets.reduce((acc, t) => acc + t.items.reduce((a, i) => a + i.q, 0), 0);
      const tabs = [
        `<button class="kds-st-tab ${activeStation === 'all' ? 'on' : ''}" data-kds-st="all"><i style="background:var(--ink);"></i>Tout <span class="ct">${allCount} tk · ${allDishes}</span></button>`
      ];
      STATIONS.forEach((s) => {
        const tk = tickets.filter((t) => t.items.some((i) => i.stations.includes(s.id)));
        const dishes = tk.reduce((acc, t) => acc + t.items.filter((i) => i.stations.includes(s.id)).reduce((a, i) => a + i.q, 0), 0);
        tabs.push(`<button class="kds-st-tab ${activeStation === s.id ? 'on' : ''}" data-kds-st="${s.id}"><i style="background:${s.raw};"></i>${s.name} <span class="ct">${tk.length} tk · ${dishes}</span></button>`);
      });
      return tabs.join('');
    };

    const stationKpiHtml = () => {
      if (activeStation === 'all') {
        const dishes = tickets.reduce((acc, t) => acc + t.items.reduce((a, i) => a + i.q, 0), 0);
        return `<div class="l">STATION ACTIVE</div><div class="v">Tout</div><div class="d">${tickets.length} tickets · ${dishes} plats en file</div>`;
      }
      const s = findStation(activeStation);
      const tk = tickets.filter((t) => t.items.some((i) => i.stations.includes(activeStation)));
      const dishes = tk.reduce((acc, t) => acc + t.items.filter((i) => i.stations.includes(activeStation)).reduce((a, i) => a + i.q, 0), 0);
      return `<div class="l">STATION ACTIVE</div><div class="v" style="font-size:18px;">${s.name}</div><div class="d"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${s.raw}; margin-right:5px;"></span>${tk.length} tickets · ${dishes} plats</div>`;
    };

    const r = fullpage({
      title: 'Écran cuisine · KDS',
      subtitle: `${tickets.length} tickets en préparation · service midi · ${STATIONS.length} stations actives`,
      width: 1040,
      body: `
        <div class="kds-st-tabs" id="kds-st-tabs">
          ${stationTabsHtml()}
        </div>

        <div class="p-kpis kds-stat-strip">
          <div class="p-kpi"><div class="l">TICKETS ACTIFS</div><div class="v">${tickets.length}</div><div class="d">3 cuisson · 2 salade · 2 livraison · 1 terrasse</div></div>
          <div class="p-kpi"><div class="l">PRÉP. MOYENNE</div><div class="v">8 min <span class="u">14 s</span></div><div class="d up">SLA 12 min · respecté à 87 %</div></div>
          <div class="p-kpi" id="kds-station-kpi">${stationKpiHtml()}</div>
          <div class="p-kpi"><div class="l">PLAT DU MOMENT</div><div class="v" style="font-size:18px;">Tajine kefta</div><div class="d">7 commandes en 30 min</div></div>
        </div>

        <div class="kds-board">
          <div class="kds-main">
            <div class="kds-toolbar">
              <div style="font-family:var(--mono); font-size:11px; color:var(--n-500); letter-spacing:0.06em;">FILE D'ATTENTE · MISE À JOUR LIVE 3 S</div>
              <div class="kds-tools">
                <button class="kb ghost xs" data-action="kds-fullscreen">Plein écran</button>
                <button class="kb ghost xs" data-action="kds-reassign">Réaffecter cuisinier</button>
              </div>
            </div>

            <div class="kds-grid-tk" id="kds-grid">
              ${tickets.map(ticketHtml).join('')}
            </div>
          </div>

          <aside class="kds-side">
            <div class="kds-side-head">
              <h5>Notifications cuisine</h5>
              <span class="chip neutral mono">5 nouvelles</span>
            </div>
            <div class="kds-notif warn">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
              <div><b>Ticket T9 dépasse 15 min</b><div class="m">Pastilla en attente cuisson · prévenir Mehdi M.</div></div>
            </div>
            <div class="kds-notif info">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
              <div><b>Pastilla = 2 stations</b><div class="m">Cuisson + Pâtisserie · le ticket apparaît sur les deux écrans, bumper sur chacun.</div></div>
            </div>
            <div class="kds-notif info">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
              <div><b>Coursier Glovo arrivé</b><div class="m">Ticket G-3412 · prêt comptoir</div></div>
            </div>
            <div class="kds-notif warn">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
              <div><b>Stock bas · feuilles de brick</b><div class="m">3 portions restantes · 86 le plat ?</div><button class="kds-notif-cta" data-action="kds-86" data-item="Pastilla poulet">86 cet item</button></div>
            </div>
            <div class="kds-notif">
              <div class="kds-notif-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
              <div><b>Sofia (salle) demande</b><div class="m">T4 — sans coriandre sur le tajine</div></div>
            </div>

            <div class="kds-side-head" style="margin-top:18px;">
              <h5>Performance cuisinier</h5>
            </div>
            <div class="kds-cook">
              <div class="kds-cook-av">MM</div>
              <div class="kds-cook-info">
                <b>Mehdi Mansouri · chef</b>
                <div class="m">4 tickets actifs · prép. moy. <b>7 min 50 s</b></div>
              </div>
              <span class="chip ok">SLA 92 %</span>
            </div>
            <div class="kds-cook">
              <div class="kds-cook-av b">AY</div>
              <div class="kds-cook-info">
                <b>Ayoub Yacoubi · auxiliaire</b>
                <div class="m">5 tickets actifs · prép. moy. <b>9 min 12 s</b></div>
              </div>
              <span class="chip pend">SLA 79 %</span>
            </div>
          </aside>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>Fermer</button>
        <button class="kb ghost" data-action="kds-print-summary">Imprimer récap service</button>
        <button class="kb atlas" data-action="kds-fullscreen">Plein écran station active</button>
      `,
    });
    // Fullpage mode owns its own layout — don't pin a fixed width.
    wireDismiss(r);

    setTimeout(() => {
      const grid = r.el.querySelector('#kds-grid');
      const tabsRoot = r.el.querySelector('#kds-st-tabs');
      const kpi = r.el.querySelector('#kds-station-kpi');

      const renderGrid = () => {
        const visible = ticketsForCurrent();
        if (visible.length === 0) {
          grid.innerHTML = `<div style="grid-column:1/-1; padding:40px 20px; text-align:center; color:var(--n-500); font-size:13px; background:var(--paper-soft); border-radius:12px;">Aucun ticket pour la station <b>${activeStation === 'all' ? 'Tout' : findStation(activeStation).name}</b> en ce moment.</div>`;
        } else {
          if (activeStation === 'all') {
            grid.innerHTML = tickets.map(ticketHtml).join('');
          } else {
            grid.innerHTML = visible.map(ticketHtml).join('');
          }
        }
        tabsRoot.innerHTML = stationTabsHtml();
        kpi.innerHTML = stationKpiHtml();
      };

      r.el.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-kds-st]');
        if (tab) {
          const newSt = tab.getAttribute('data-kds-st');
          if (newSt === activeStation) return;
          activeStation = newSt;
          renderGrid();
          const lbl = activeStation === 'all' ? 'Tout' : findStation(activeStation).name;
          toast(`Vue station · ${lbl}`, { type: 'info', desc: activeStation === 'all' ? 'Tous les tickets actifs.' : 'Seuls les items routés ici sont visibles.' });
          return;
        }
        const tk = e.target.closest('.kds-tk');
        if (tk && !e.target.closest('button')) {
          const id = tk.dataset.tk;
          toast(`Ticket ${id} agrandi`, { type: 'info', desc: 'Mode focus · police × 1,4.' });
        }
      });
    }, 0);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *   KDS auxiliary handlers
   * ═════════════════════════════════════════════════════════════════════════ */
  handlers['kds-bump'] = (el) => {
    const id = el?.dataset.id || 'ticket';
    const tk = el?.closest('.kds-tk');
    const m = modal({
      tag: 'CUISINE',
      title: `Bump ticket ${id} ?`,
      desc: 'Le ticket disparaît de l\'écran cuisine. La salle reçoit la notification « plat prêt ».',
      width: 460,
      body: `<div style="display:flex; gap:12px; padding:12px 14px; background:var(--paper-soft); border-radius:10px; font-size:13px; color:var(--n-600); line-height:1.5;">
        <span style="color:var(--atlas);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg></span>
        <div>Sofia (salle) sera notifiée pour récupérer les plats au pass. Action irréversible — utilisez « Rappeler » si besoin.</div>
      </div>`,
      foot: `<button class="kb ghost" data-dismiss>Annuler</button><button class="kb atlas" data-confirm-bump>Bump ${id} ✓</button>`,
    });
    wireDismiss(m);
    setTimeout(() => {
      m.el.querySelector('[data-confirm-bump]').addEventListener('click', () => {
        m.close();
        if (tk) { tk.style.transition = 'all 280ms'; tk.style.opacity = '0'; tk.style.transform = 'translateX(20px)'; setTimeout(() => tk.remove(), 280); }
        toast(`Ticket ${id} bumpé`, { type: 'success', desc: 'Notification salle envoyée à Sofia · pass · ouvert depuis 4 s.' });
      });
    }, 0);
  };

  handlers['kds-recall'] = (el) => {
    const id = el?.dataset.id || 'ticket';
    toast(`Ticket ${id} rappelé en cuisine`, { type: 'warn', desc: 'Le ticket revient en haut de la file · cuisinier averti.' });
  };

  handlers['kds-86'] = (el) => {
    const item = el?.dataset.item || 'plat';
    const m = modal({
      tag: 'STOCK',
      title: `Mettre « ${item} » en 86 ?`,
      desc: 'Le plat devient indisponible sur tous les canaux : POS, Glovo, Jumia, QR table.',
      width: 480,
      body: `<div style="font-size:13px; color:var(--n-600); line-height:1.5;">Le client en train de commander voit le plat barré. Vous pouvez le réactiver dès que le stock revient.</div>`,
      foot: `<button class="kb ghost" data-dismiss>Annuler</button><button class="kb danger" data-confirm-86>Confirmer le 86</button>`,
    });
    wireDismiss(m);
    setTimeout(() => {
      m.el.querySelector('[data-confirm-86]').addEventListener('click', () => {
        m.close();
        toast(`${item} en 86`, { type: 'success', desc: 'Désactivé sur POS, Glovo, Jumia, QR table en 3 secondes.' });
      });
    }, 0);
  };

  handlers['kds-fullscreen'] = () => {
    toast('Plein écran station active', { type: 'info', desc: 'iPad mural connecté · police × 1,4 · auto-refresh 3 s · interface tactile gants compatible.' });
  };
  handlers['kds-reassign'] = () => {
    toast('Réaffecter ticket', { type: 'info', desc: 'Glissez le ticket vers Mehdi M. ou Ayoub Y. pour transférer.' });
  };
  handlers['kds-print-summary'] = () => {
    toast('Récap service midi imprimé', { type: 'success', desc: '47 plats servis · prép. moy. 8 min 14 s · 3 retours cuisine.' });
  };
})();
