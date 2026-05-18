/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Multi-venue state + sidebar dropdown + dynamic vertical section
 *
 * The merchant account contains 3 venues across 3 verticals
 * (restaurant, boutique, spa). Switching the venue swaps:
 *   - the sidebar's mid section ("Restauration" → "Boutique" / "Espace bien-être")
 *   - the dashboard's data (via dateRange.js subscribing to KiwiVenue changes)
 *   - the header sub-line, demo bar account, footer ICE, sidebar counts
 *   - the KPI band keys + labels (Pourboires hidden for boutique, etc.)
 *
 * The default selected venue on first paint is `cafeAtlas`.
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const STORAGE_KEY = 'kiwiVenue';
  const DEFAULT_VENUE = 'cafeAtlas';
  // Real venues the merchant can switch between, plus the synthetic 'fusion'
  // venue that aggregates all three (multi-site view).
  const REAL_VENUES = ['cafeAtlas', 'maisonMansour', 'spaBahia'];
  const VALID = [...REAL_VENUES, 'fusion'];
  const subscribers = new Set();
  let currentVenue = DEFAULT_VENUE;
  let dropdownOpen = false;
  // Snapshot of the venue we came from before fusion was engaged, so the
  // "Revenir" affordance returns the merchant where they were.
  let preFusionVenue = DEFAULT_VENUE;
  let fusionAnimating = false;
  // Subscription plan — currently always 'ultra' for the demo account.
  // Drives the sidebar status card + Ultra identity markers (see
  // renderLocSwitch + fusionSidebarHtml below).
  const currentPlan = 'ultra';

  /* ═══════════════ VENUES REGISTRY ═══════════════ */

  const VENUES = {
    cafeAtlas: {
      id: 'cafeAtlas',
      name: 'Café Atlas',
      location: 'Maarif',
      fullDisplay: 'Café Atlas · Maarif',
      type: 'restaurant',
      typeLabel: 'Restaurant',
      siblings: '2 autres emplacements · Casa / Marrakech',
      status: 'En service',
      ice: '0025938400014',
      txCount: 182,
      staffCount: 8,
    },
    maisonMansour: {
      id: 'maisonMansour',
      name: 'Maison Mansour',
      location: 'Gueliz',
      fullDisplay: 'Maison Mansour · Gueliz',
      type: 'boutique',
      typeLabel: 'Boutique',
      siblings: '2 autres emplacements · Casa / Marrakech',
      status: 'En service',
      ice: '0028471900033',
      txCount: 42,
      staffCount: 3,
    },
    spaBahia: {
      id: 'spaBahia',
      name: 'Spa Bahia',
      location: 'Hivernage',
      fullDisplay: 'Spa Bahia · Hivernage',
      type: 'spa',
      typeLabel: 'Spa',
      siblings: '2 autres emplacements · Casa / Marrakech',
      status: 'En service',
      ice: '0029502800027',
      txCount: 20,
      staffCount: 3,
    },
    // Synthetic "fusion" venue — represents the merchant's full portfolio.
    // Numeric fields are sums; dateRange.js fans this out for every table.
    // The snapshot/venueBreakdown/kpis/intelligence/portfolioTrend/alerts
    // sub-objects below are consumed by renderFusionView() (defined later in
    // this file) to paint the dedicated <section class="dash-fusion"> layout.
    fusion: {
      id: 'fusion',
      name: 'Go Ultra',
      location: '3 emplacements',
      fullDisplay: 'Go Ultra · 3 emplacements',
      type: 'fusion',
      typeLabel: 'Multi-sites · Casa / Marrakech',
      siblings: 'Café Atlas · Maison Mansour · Spa Bahia',
      status: 'En service',
      ice: 'multi-ICE',
      txCount: 244,           // 182 + 42 + 20
      staffCount: 14,         // 8 + 3 + 3

      // ── END-OF-DAY TARGETS (clock fallback for Aujourd'hui) ────────
      // Aujourd'hui values match the sum of individual venue TARGETS in
      // demoClock.js (cafeAtlas 31500 + maisonMansour 14000 + spaBahia
      // 10500 = 56000 raw → adjusted to 48282.78 to reflect realised
      // shrinkage by 02h close). Live view always reads the clock — these
      // values are only used as fallback if the clock is inactive.
      snapshot: {
        aujourdhui: {
          totalRevenue: 48282.78,
          netAfterKiwi: 40557.13,
          totalTransactions: 273,
          topVenueToday: 'Café Atlas',
          topVenueRevenue: 27512.50,
          deltaHier: 2.5,
          deltaSemaine: 17,
          deltaMois: 10,
          objectifJour: 55000,
        },
        hier: {
          totalRevenue: 45310.00,
          netAfterKiwi: 38060.00,
          totalTransactions: 251,
          topVenueToday: 'Café Atlas',
          topVenueRevenue: 25890.00,
          deltaHier: -1.2,
          deltaSemaine: 12,
          deltaMois: 8,
          objectifJour: 55000,
        },
        septJours: {
          totalRevenue: 334100.00,
          netAfterKiwi: 280500.00,
          totalTransactions: 1820,
          topVenueToday: 'Café Atlas',
          topVenueRevenue: 198400.00,
          deltaHier: null,
          deltaSemaine: 19,
          deltaMois: 11,
          objectifJour: null,
        },
        trenteJours: {
          totalRevenue: 1470200.00,
          netAfterKiwi: 1234900.00,
          totalTransactions: 7820,
          topVenueToday: 'Café Atlas',
          topVenueRevenue: 842300.00,
          deltaHier: null,
          deltaSemaine: null,
          deltaMois: 14,
          objectifJour: null,
        },
      },

      // ── PER-VENUE BREAKDOWN ────────────────────────────────────────
      // Aujourd'hui rows hold END-OF-DAY targets — live render overrides
      // revenue/share/spark-last-point from the clock per-tick.
      venueBreakdown: {
        aujourdhui: [
          { id: 'cafeAtlas',     name: 'Café Atlas',     location: 'Maarif',    type: 'restaurant', revenue: 27512.50, portfolioShare: 57.0, deltaVsHier: 3.2,  trend: [22100,23400,25100,24800,26200,25900,27512], status: 'en-service', signal: 'objectif-atteint', signalLabel: 'Objectif dépassé · +8 %' },
          { id: 'maisonMansour', name: 'Maison Mansour', location: 'Guéliz',    type: 'boutique',   revenue: 11820.00, portfolioShare: 24.5, deltaVsHier: -2.4, trend: [10200,11100,12400,11800,12100,12300,11820], status: 'en-service', signal: 'attention',        signalLabel: '−2,4 % vs hier' },
          { id: 'spaBahia',      name: 'Spa Bahia',      location: 'Hivernage', type: 'spa',        revenue: 8950.28,  portfolioShare: 18.5, deltaVsHier: 6.8,  trend: [7200,7800,8100,8400,8200,8600,8950],       status: 'en-service', signal: 'croissance',       signalLabel: 'Meilleure journée du mois ↑' },
        ],
        hier: [
          { id: 'cafeAtlas',     name: 'Café Atlas',     location: 'Maarif',    type: 'restaurant', revenue: 25890.00, portfolioShare: 57.1, deltaVsHier: -1.1, trend: [22100,23400,25100,24800,26200,25900,25890], status: 'en-service', signal: 'stable',     signalLabel: 'Stable · ±1 %' },
          { id: 'maisonMansour', name: 'Maison Mansour', location: 'Guéliz',    type: 'boutique',   revenue: 12110.00, portfolioShare: 26.7, deltaVsHier: 1.8,  trend: [10200,11100,12400,11800,12100,12300,12110], status: 'en-service', signal: 'croissance', signalLabel: '+1,8 % vs avant-hier' },
          { id: 'spaBahia',      name: 'Spa Bahia',      location: 'Hivernage', type: 'spa',        revenue: 8380.00,  portfolioShare: 18.5, deltaVsHier: -3.1, trend: [7200,7800,8100,8400,8200,8600,8380],       status: 'en-service', signal: 'attention',  signalLabel: '−3,1 % vs avant-hier' },
        ],
        septJours: [
          { id: 'cafeAtlas',     name: 'Café Atlas',     location: 'Maarif',    type: 'restaurant', revenue: 198400.00, portfolioShare: 59.4, deltaVsHier: null, trend: [168000,172000,181000,188000,192000,196000,198400], status: 'en-service', signal: 'objectif-atteint', signalLabel: 'Top performer' },
          { id: 'maisonMansour', name: 'Maison Mansour', location: 'Guéliz',    type: 'boutique',   revenue: 84800.00,  portfolioShare: 25.4, deltaVsHier: null, trend: [72000,75000,78000,80000,82000,83000,84800],         status: 'en-service', signal: 'stable',           signalLabel: 'Croissance régulière' },
          { id: 'spaBahia',      name: 'Spa Bahia',      location: 'Hivernage', type: 'spa',        revenue: 51200.00,  portfolioShare: 15.3, deltaVsHier: null, trend: [42000,44000,46000,47000,48000,50000,51200],         status: 'en-service', signal: 'croissance',       signalLabel: '+22 % vs semaine précédente' },
        ],
        trenteJours: [
          { id: 'cafeAtlas',     name: 'Café Atlas',     location: 'Maarif',    type: 'restaurant', revenue: 842300.00, portfolioShare: 57.3, deltaVsHier: null, trend: [700000,720000,750000,780000,800000,820000,842300], status: 'en-service', signal: 'stable',     signalLabel: '57 % du portefeuille' },
          { id: 'maisonMansour', name: 'Maison Mansour', location: 'Guéliz',    type: 'boutique',   revenue: 358200.00, portfolioShare: 24.4, deltaVsHier: null, trend: [290000,305000,318000,330000,340000,350000,358200], status: 'en-service', signal: 'croissance', signalLabel: '+12 % vs mois précédent' },
          { id: 'spaBahia',      name: 'Spa Bahia',      location: 'Hivernage', type: 'spa',        revenue: 269400.00, portfolioShare: 18.3, deltaVsHier: null, trend: [210000,222000,235000,245000,255000,263000,269400], status: 'en-service', signal: 'croissance', signalLabel: 'Croissance la plus rapide · +16 %' },
        ],
      },

      // ── PORTFOLIO KPI CARDS ────────────────────────────────────────
      kpis: {
        aujourdhui: {
          transactionsTotales: { value: 273,  delta: 13.7, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 132,  unit: 'MAD', delta: 4.2,  label: 'Panier moyen pondéré' },
          margeBrute:          { value: 71.8, unit: '%',   delta: 1.6,  label: 'Marge brute moyenne' },
          tauxSuccesMoyen:     { value: 97.15, unit: '%',  delta: 1.2,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '68 / 32', unit: '%', delta: 3, label: 'Ratio card / cash' },
          clientsFideles:      { value: 23,   subValue: 90, delta: 18.7, label: 'Clients fidèles' },
        },
        hier: {
          transactionsTotales: { value: 251,  delta: -2.3, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 128,  unit: 'MAD', delta: 1.8,  label: 'Panier moyen pondéré' },
          margeBrute:          { value: 70.4, unit: '%',   delta: 0.5,  label: 'Marge brute moyenne' },
          tauxSuccesMoyen:     { value: 96.80, unit: '%',  delta: 0.8,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '67 / 33', unit: '%', delta: 2, label: 'Ratio card / cash' },
          clientsFideles:      { value: 19,   subValue: 90, delta: 8.2,  label: 'Clients fidèles' },
        },
        septJours: {
          transactionsTotales: { value: 1820, delta: 18.4, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 135,  unit: 'MAD', delta: 6.1,  label: 'Panier moyen pondéré' },
          margeBrute:          { value: 72.1, unit: '%',   delta: 2.0,  label: 'Marge brute moyenne' },
          tauxSuccesMoyen:     { value: 97.42, unit: '%',  delta: 1.5,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '69 / 31', unit: '%', delta: 4, label: 'Ratio card / cash' },
          clientsFideles:      { value: 142,  subValue: 312, delta: 22.4, label: 'Clients fidèles' },
        },
        trenteJours: {
          transactionsTotales: { value: 7820, delta: 21.2, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 138,  unit: 'MAD', delta: 8.4,  label: 'Panier moyen pondéré' },
          margeBrute:          { value: 72.6, unit: '%',   delta: 2.8,  label: 'Marge brute moyenne' },
          tauxSuccesMoyen:     { value: 97.80, unit: '%',  delta: 2.1,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '70 / 30', unit: '%', delta: 5, label: 'Ratio card / cash' },
          clientsFideles:      { value: 312,  subValue: 312, delta: 28.6, label: 'Clients fidèles' },
        },
      },

      // ── CROSS-VENUE INTELLIGENCE ───────────────────────────────────
      intelligence: {
        crossVenueCustomers: 312,
        crossVenueRevenueShare: 28.4,
        topCrossVenuePair: 'Café Atlas × Spa Bahia',
        concentrationIndex: 57.3,
        concentrationRisk: 'modéré',
        aiInsights: [
          {
            title: 'Café Atlas génère 58 % du CA · concentration à diversifier',
            body: 'Sur les 30 derniers jours, Café Atlas (58 %) tire le portefeuille, devant Maison Mansour (24 %) et Spa Bahia (18 %). Les 3 sites partagent 312 clients communs — déjà fidèles à l\'écosystème — qu\'on peut activer en cross-sell.',
            action: 'Lancer une carte fidélité unifiée Kiwi pour les 312 clients cross-site pourrait lifter le CA global de 4–7 %.',
            type: 'warning',
          },
          {
            title: '312 clients fréquentent plusieurs emplacements',
            body: 'Ces clients cross-site dépensent en moyenne 2,4× plus que les clients mono-site. Le duo Café Atlas × Spa Bahia est la paire la plus fréquentée — 184 clients communs.',
            action: 'Un forfait "Déjeuner + Soin" couplant Café Atlas et Spa Bahia pourrait convertir 60+ clients mono-site en clients cross-site.',
            type: 'opportunity',
          },
          {
            title: 'Pic simultané 12h–14h sur 2 emplacements',
            body: 'Café Atlas et Spa Bahia atteignent leur pic de fréquentation en même temps. Votre attention managériale est divisée exactement au moment critique.',
            action: 'Décaler les ouvertures du spa de 30 min ou former un manager adjoint pour Café Atlas libérerait votre présence au pic.',
            type: 'operational',
          },
        ],
      },

      // ── PORTFOLIO TREND (30-day, static; consumed by Section 4 Mode B) ──
      portfolioTrend: {
        labels: ['25/03','27/03','29/03','31/03','02/04','04/04','06/04','08/04','10/04','12/04','14/04','16/04','18/04','20/04','22/04','24/04','26/04','28/04','30/04','02/05','04/05','06/05','08/05','10/05','12/05','14/05'],
        cafeAtlas:     [24100,25200,23800,26100,25400,27200,26800,28100,27400,29200,28600,30100,29400,31200,30600,32100,31400,33200,32600,34100,33400,35200,34600,36100,35400,27512],
        maisonMansour: [9800,10200,9600,10800,10400,11200,10800,11600,11200,12000,11600,12400,11800,12600,12200,13000,12600,13400,12800,13600,13200,14000,13400,14200,13800,11820],
        spaBahia:      [6200,6600,6400,7000,6800,7400,7200,7800,7600,8200,8000,8600,8400,9000,8800,9400,9200,9800,9400,10000,9600,10200,9800,10400,10000,8950],
      },

      // ── OPERATIONAL ALERTS (Section 6, conditional) ────────────────
      alerts: [
        {
          venueId: 'maisonMansour',
          venueName: 'Maison Mansour',
          type: 'underperforming',
          message: 'CA aujourd\'hui −2,4 % vs hier · en dessous de la moyenne 7 j de 12 400 MAD',
          severity: 'medium',
        },
      ],
    },
  };

  /* ═══════════════ VERTICAL → SIDEBAR SECTION ═══════════════ */

  // Inline SVGs match the existing sidebar's rendering style (24x24 viewBox, stroke 2)
  const ICONS = {
    // restaurant
    tables: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    kds: '<path d="M5 12h14M12 5v14"/>',
    stock: '<path d="M3 6h18M6 10h12M9 14h6"/>',
    // boutique
    inventory: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/>',
    categories: '<path d="M3 6h7l2 2h9v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>',
    promos: '<circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/><path d="M5 19L19 5"/>',
    returns: '<path d="M3 12a9 9 0 119 9 9 9 0 01-6.36-2.64L3 21l.36-2.64"/><path d="M3 12h6M3 21v-6"/>',
    // spa
    appointments: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    services: '<path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z"/>',
    practitioners: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/><path d="M16 11l2 2 4-4"/>',
    clients: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 14h6M9 18h6M9 10h2"/>',
  };

  const VERTICAL_SECTIONS = {
    restaurant: {
      header: 'Restauration',
      i18nHeader: 'sidebar.section.restaurant',
      items: [
        { nav: 'tables', label: 'Tables & additions',   i18n: 'sidebar.restaurant.tables', tag: 'LIVE', icon: ICONS.tables },
        { nav: 'menu',   label: 'Menu & modificateurs', i18n: 'sidebar.restaurant.menu',                icon: ICONS.menu },
        { nav: 'kds',    label: 'Écran cuisine (KDS)',  i18n: 'sidebar.restaurant.kds',                 icon: ICONS.kds },
        { nav: 'stock',  label: 'Stock ingrédients',    i18n: 'sidebar.restaurant.stock',               icon: ICONS.stock },
      ],
    },
    boutique: {
      header: 'Boutique',
      i18nHeader: 'sidebar.section.boutique',
      items: [
        { nav: 'inventory',  label: 'Inventaire produits', i18n: 'sidebar.boutique.inventory',  tag: 'LIVE', icon: ICONS.inventory },
        { nav: 'categories', label: 'Catégories',          i18n: 'sidebar.boutique.categories',              icon: ICONS.categories },
        { nav: 'promos',     label: 'Promotions & offres', i18n: 'sidebar.boutique.promos',                  icon: ICONS.promos },
        { nav: 'returns',    label: 'Retours & échanges',  i18n: 'sidebar.boutique.returns',                 icon: ICONS.returns },
      ],
    },
    spa: {
      header: 'Espace bien-être',
      i18nHeader: 'sidebar.section.spa',
      items: [
        { nav: 'appointments',  label: 'Calendrier rendez-vous', i18n: 'sidebar.spa.appointments',  tag: 'LIVE', icon: ICONS.appointments },
        { nav: 'services',      label: 'Services & forfaits',    i18n: 'sidebar.spa.services',                   icon: ICONS.services },
        { nav: 'practitioners', label: 'Praticien·ne·s',         i18n: 'sidebar.spa.practitioners',              icon: ICONS.practitioners },
        { nav: 'clients',       label: 'Fiches clients',         i18n: 'sidebar.spa.clients',                    icon: ICONS.clients },
      ],
    },
  };

  /* ═══════════════ VERTICAL → KPI BAND SPEC ═══════════════
   * Drives renderKpiBand() in dateRange.js. Each entry lists which 6 KPI keys
   * to surface for that vertical, plus the i18n label key. Keep at 6 tiles.
   * Sparkline shape per key is owned by dateRange.js. */
  const KPI_BY_TYPE = {
    restaurant: [
      { key: 'tx',         label: 'Commandes',         i18n: 'dash.kpi.tx' },
      { key: 'panier',     label: 'Panier moyen',      i18n: 'dash.kpi.basket' },
      { key: 'marge',      label: 'Marge brute',       i18n: 'dash.kpi.margin' },
      { key: 'success',    label: 'Taux succès',       i18n: 'dash.kpi.success' },
      { key: 'ratio',      label: 'Ratio card / cash', i18n: 'dash.kpi.ratio' },
      { key: 'regulars',   label: 'Clients réguliers', i18n: 'dash.kpi.regular' },
    ],
    boutique: [
      { key: 'tx',         label: 'Commandes',         i18n: 'dash.kpi.tx' },
      { key: 'panier',     label: 'Panier moyen',      i18n: 'dash.kpi.basket' },
      { key: 'tauxRetour', label: 'Taux retour',       i18n: 'dash.kpi.returnRate' },
      { key: 'success',    label: 'Taux succès',       i18n: 'dash.kpi.success' },
      { key: 'ratio',      label: 'Ratio card / cash', i18n: 'dash.kpi.ratio' },
      { key: 'regulars',   label: 'Clients fidèles',   i18n: 'dash.kpi.loyalCustomers' },
    ],
    spa: [
      { key: 'tx',         label: 'Rendez-vous',       i18n: 'dash.kpi.appointments' },
      { key: 'panier',     label: 'Panier moyen',      i18n: 'dash.kpi.basket' },
      { key: 'marge',      label: 'Marge brute',       i18n: 'dash.kpi.margin' },
      { key: 'success',    label: 'Taux remplissage',  i18n: 'dash.kpi.fillRate' },
      { key: 'ratio',      label: 'Ratio card / cash', i18n: 'dash.kpi.ratio' },
      { key: 'regulars',   label: 'Clients fidèles',   i18n: 'dash.kpi.loyalCustomers' },
    ],
    // Fusion = portfolio-wide KPIs. Same six tiles render in the band, but
    // the values are aggregated sums (see dateRange.js · vData fusion path).
    fusion: [
      { key: 'tx',         label: 'Transactions totales', i18n: 'dash.kpi.tx' },
      { key: 'panier',     label: 'Panier moyen pondéré', i18n: 'dash.kpi.basket' },
      { key: 'marge',      label: 'Marge brute moyenne',  i18n: 'dash.kpi.margin' },
      { key: 'success',    label: 'Taux succès moyen',    i18n: 'dash.kpi.success' },
      { key: 'ratio',      label: 'Ratio card / cash',    i18n: 'dash.kpi.ratio' },
      { key: 'regulars',   label: 'Clients fidèles',      i18n: 'dash.kpi.regular' },
    ],
  };

  /* ═══════════════ HEADER + DEMO BAR + FOOTER PER VENUE ═══════════════ */

  const HEADER_SUB = {
    fr: { cafeAtlas: 'Service midi en cours', maisonMansour: 'Boutique ouverte · 10h–20h', spaBahia: 'Espace ouvert · réservations en cours', fusion: '3 emplacements actifs · vue consolidée' },
    en: { cafeAtlas: 'Lunch service in progress', maisonMansour: 'Boutique open · 10am–8pm', spaBahia: 'Spa open · bookings in progress', fusion: '3 active locations · consolidated view' },
    ar: { cafeAtlas: 'خدمة الغداء جارية', maisonMansour: 'البوتيك مفتوح · 10ص–8م', spaBahia: 'الفضاء مفتوح · الحجوزات جارية', fusion: '3 مواقع نشطة · عرض موحّد' },
  };

  const HERO_AI_REC = {
    fr: {
      cafeAtlas: {
        title: 'Votre heure creuse de 15h-17h représente un potentiel inexploité',
        obs: "Entre 15h et 17h, vous réalisez seulement 8% de votre chiffre d'affaires quotidien. Pourtant, c'est l'heure où vos clients restent le plus longtemps assis (temps moyen : 47 minutes, contre 31 minutes au déjeuner).",
        act: '→ Proposer un menu « goûter » avec thé à la menthe et msemen à prix réduit pourrait augmenter la rotation des tables de 20-30%.',
      },
      maisonMansour: {
        title: 'Vos clients touristes dépensent en moyenne +35 % par panier',
        obs: 'Les paniers réglés sur cartes étrangères (38 % des commandes) atteignent en moyenne 380 MAD, contre 282 MAD sur les cartes marocaines. Les acheteurs allemands et espagnols sont sur-représentés.',
        act: '→ Activer un catalogue PDF en anglais sur le terminal Kiwi et un onglet « Tax-free » pourrait lifter le panier moyen de 6-9 %.',
      },
      spaBahia: {
        title: 'Le créneau 14h-15h du mardi est sous-utilisé (38 % rempli)',
        obs: 'Sur les 4 dernières semaines, ce créneau affiche un taux de remplissage de 38 % seulement, contre 87 % en moyenne sur la semaine. Vos clientes fidèles n\'y sont jamais venues.',
        act: '→ Pousser un message WhatsApp aux 47 clients fidèles avec une offre « -20 % mardi 14h-15h » pourrait combler 4-6 créneaux/semaine.',
      },
      fusion: {
        title: 'Café Atlas génère 58 % du CA · concentration à diversifier',
        obs: 'Sur les 30 derniers jours, Café Atlas (58 %) tire le portefeuille, devant Maison Mansour (24 %) et Spa Bahia (18 %). Les 3 sites partagent 312 clients communs — déjà fidèles à l\'écosystème — qu\'on peut activer en cross-sell.',
        act: '→ Lancer une carte fidélité unifiée Kiwi pour les 312 clients cross-site pourrait lifter le CA global de 4-7 %.',
      },
    },
    en: {
      cafeAtlas: {
        title: 'Your 3pm-5pm lull is untapped potential',
        obs: "Between 3pm and 5pm you bring in only 8% of daily revenue. Yet it's when guests stay seated the longest (47 min average, vs 31 min at lunch).",
        act: '→ A « goûter » menu with mint tea and msemen at a reduced price could lift table turnover by 20-30%.',
      },
      maisonMansour: {
        title: 'Your tourist customers spend on average +35% per basket',
        obs: 'Baskets paid with foreign cards (38% of orders) average 380 MAD, versus 282 MAD on Moroccan cards. German and Spanish shoppers are over-represented.',
        act: '→ Enabling an English PDF catalogue on the Kiwi terminal and a « Tax-free » tab could lift the average basket by 6-9%.',
      },
      spaBahia: {
        title: 'The Tuesday 2pm-3pm slot is underused (38% filled)',
        obs: 'Over the last 4 weeks, this slot shows a fill rate of only 38%, versus 87% on average across the week. Your loyal clients have never come at that time.',
        act: '→ Sending a WhatsApp message to the 47 loyal clients with a « -20% Tuesday 2pm-3pm » offer could fill 4-6 slots/week.',
      },
      fusion: {
        title: 'Café Atlas generates 58% of revenue · concentration to diversify',
        obs: 'Over the last 30 days, Café Atlas (58%) drives the portfolio, ahead of Maison Mansour (24%) and Spa Bahia (18%). The 3 sites share 312 common customers — already loyal to the ecosystem — who can be activated through cross-sell.',
        act: '→ Launching a unified Kiwi loyalty card for the 312 cross-site customers could lift overall revenue by 4-7%.',
      },
    },
    ar: {
      cafeAtlas: {
        title: 'فترة الركود بين 15h و17h تمثّل فرصة غير مستغلّة',
        obs: 'بين الساعة 15h و17h، تحقّقون فقط 8% من رقم معاملاتكم اليومي. ومع ذلك، هذه هي الساعات التي يجلس فيها زبائنكم أطول مدة (47 دقيقة في المتوسط، مقابل 31 دقيقة وقت الغداء).',
        act: '→ اقتراح قائمة « العصرونة » بالأتاي والمسمن بسعر مخفّض قد يرفع دوران الطاولات بـ 20-30%.',
      },
      maisonMansour: {
        title: 'زبائنكم السيّاح ينفقون في المتوسّط +35٪ لكل سلّة',
        obs: 'السلال المدفوعة ببطاقات أجنبية (38٪ من الطلبات) تبلغ في المتوسّط 380 درهمًا، مقابل 282 درهمًا على البطاقات المغربية. المشترون الألمان والإسبان ممثّلون بكثرة.',
        act: '→ تفعيل كتالوج PDF بالإنجليزية على جهاز كيوي وعلامة تبويب « معفى من الضريبة » قد يرفع متوسّط السلّة بـ 6-9٪.',
      },
      spaBahia: {
        title: 'فترة الثلاثاء بين 14h و15h غير مستغلّة بما يكفي (38٪ ممتلئة)',
        obs: 'خلال الأسابيع الأربعة الأخيرة، تُظهر هذه الفترة نسبة إشغال لا تتجاوز 38٪، مقابل 87٪ في المتوسّط خلال الأسبوع. زبوناتكم الوفيات لم يأتين فيها قط.',
        act: '→ إرسال رسالة واتساب إلى الزبناء الأوفياء الـ47 بعرض « -20٪ الثلاثاء 14h-15h » قد يملأ 4-6 فترات في الأسبوع.',
      },
      fusion: {
        title: 'مقهى أطلس يحقّق 58٪ من المداخيل · تركّز يجب تنويعه',
        obs: 'خلال الـ30 يومًا الأخيرة، يقود مقهى أطلس (58٪) المحفظة، متقدّمًا على ميزون منصور (24٪) وسبا باهية (18٪). تتقاسم المواقع الثلاثة 312 زبونًا مشتركًا — أوفياء للمنظومة — يمكن تفعيلهم عبر البيع المتقاطع.',
        act: '→ إطلاق بطاقة وفاء كيوي موحّدة للزبناء الـ312 المشتركين بين المواقع قد يرفع المداخيل الإجمالية بـ 4-7٪.',
      },
    },
  };

  const HEATMAP_AI_REC = {
    fr: {
      cafeAtlas: {
        title: 'Lancer un combo livraison Glovo pour 15h–17h',
        obs: "Pendant cette fenêtre creuse, votre salle tourne à 22 % de capacité mais l'équipe reste disponible. Un combo Tajine kefta + thé à la menthe à 75 MAD sur Glovo capte typiquement 8–12 commandes par après-midi dans des cafés similaires de votre quartier.",
        cta: '→ Configurer le combo Glovo',
      },
      maisonMansour: {
        title: 'Programmer un push Instagram Shopping pour 14h–16h',
        obs: "L'après-midi (14h–16h) ne représente que 11 % de vos ventes alors que vos posts Instagram captent 64 % de leur engagement à ces heures. Lancer un carousel « Caftans · pièces uniques » avec lien d'achat direct pourrait convertir.",
        cta: '→ Programmer la campagne Instagram',
      },
      spaBahia: {
        title: 'Campagne WhatsApp pour combler les créneaux 14h–16h',
        obs: 'Sur les 4 dernières semaines, 11 créneaux/semaine restent vacants l\'après-midi (14h–16h). Vos 47 clientes fidèles ont un taux d\'ouverture WhatsApp de 92 %.',
        cta: '→ Lancer la campagne WhatsApp',
      },
      fusion: {
        title: 'Synchroniser les heures creuses inter-sites sur le même mardi',
        obs: 'Vos 3 sites partagent une même fenêtre creuse 15h–17h (22 % de capacité moyenne). Une campagne unifiée « Mardi Kiwi · -15 % cross-site » programmée sur les 3 caisses simultanément multiplie la portée par 3.',
        cta: '→ Programmer la campagne tri-site',
      },
    },
    en: {
      cafeAtlas: {
        title: 'Launch a Glovo delivery combo for 3pm–5pm',
        obs: 'During this lull, your dining room runs at 22% capacity but staff is available. A Tajine kefta + mint tea combo at 75 MAD on Glovo typically captures 8–12 orders per afternoon at similar Maarif cafés.',
        cta: '→ Set up the Glovo combo',
      },
      maisonMansour: {
        title: 'Schedule an Instagram Shopping push for 2pm–4pm',
        obs: 'The afternoon (2pm–4pm) accounts for only 11% of your sales, yet your Instagram posts capture 64% of their engagement at those hours. Launching a « Caftans · one-of-a-kind » carousel with a direct buy link could convert.',
        cta: '→ Schedule the Instagram campaign',
      },
      spaBahia: {
        title: 'WhatsApp campaign to fill the 2pm–4pm slots',
        obs: 'Over the last 4 weeks, 11 slots/week stay empty in the afternoon (2pm–4pm). Your 47 loyal clients have a 92% WhatsApp open rate.',
        cta: '→ Launch the WhatsApp campaign',
      },
      fusion: {
        title: 'Sync the cross-site lulls on the same Tuesday',
        obs: 'Your 3 sites share the same 3pm–5pm lull (22% average capacity). A unified « Kiwi Tuesday · -15% cross-site » campaign scheduled on all 3 registers at once multiplies reach by 3.',
        cta: '→ Schedule the tri-site campaign',
      },
    },
    ar: {
      cafeAtlas: {
        title: 'أطلق وجبة توصيل عبر Glovo بين 15h و17h',
        obs: 'خلال هذه الفترة الهادئة، تشتغل قاعتك بـ 22% من طاقتها بينما الفريق متاح. كومبو طاجين الكفتة + أتاي بالنعناع بـ 75 درهم على Glovo يجلب عادة 8–12 طلب في فترة الزوال لدى مقاهي معاريف المماثلة.',
        cta: '→ إعداد كومبو Glovo',
      },
      maisonMansour: {
        title: 'برمجة دفعة Instagram Shopping بين 14h و16h',
        obs: 'لا يمثّل بعد الظهر (14h–16h) سوى 11٪ من مبيعاتكم، بينما تجمع منشورات Instagram الخاصة بكم 64٪ من تفاعلها في تلك الساعات. إطلاق عرض دوّار « قفاطين · قطع فريدة » برابط شراء مباشر قد يحقّق تحويلات.',
        cta: '→ برمجة حملة Instagram',
      },
      spaBahia: {
        title: 'حملة واتساب لملء فترات 14h–16h',
        obs: 'خلال الأسابيع الأربعة الأخيرة، تبقى 11 فترة في الأسبوع شاغرة بعد الظهر (14h–16h). زبوناتكم الوفيات الـ47 لديهنّ نسبة فتح واتساب تبلغ 92٪.',
        cta: '→ إطلاق حملة واتساب',
      },
      fusion: {
        title: 'مزامنة ساعات الركود بين المواقع في نفس يوم الثلاثاء',
        obs: 'تتقاسم مواقعكم الثلاثة نفس فترة الركود بين 15h و17h (22٪ متوسّط الطاقة). حملة موحّدة « ثلاثاء كيوي · -15٪ بين المواقع » مبرمجة على الصناديق الثلاثة في آن واحد تضاعف المدى ثلاث مرّات.',
        cta: '→ برمجة الحملة ثلاثية المواقع',
      },
    },
  };

  /* Mix CMI savings · fusion sums the 3 venues' monthly savings */
  /* Bench labels · fusion override */

  /* Mix de paiement bottom callout — savings vs CMI scales with revenue */
  const MIX_CMI_SAVINGS = {
    fr: {
      cafeAtlas:     '~3 900 MAD ce mois',
      maisonMansour: '~1 700 MAD ce mois',
      spaBahia:      '~1 350 MAD ce mois',
      fusion:        '~6 950 MAD ce mois · 3 sites',
    },
    en: {
      cafeAtlas:     '~3,900 MAD this month',
      maisonMansour: '~1,700 MAD this month',
      spaBahia:      '~1,350 MAD this month',
      fusion:        '~6,950 MAD this month · 3 sites',
    },
    ar: {
      cafeAtlas:     '~3 900 درهم هذا الشهر',
      maisonMansour: '~1 700 درهم هذا الشهر',
      spaBahia:      '~1 350 درهم هذا الشهر',
      fusion:        '~6 950 درهم هذا الشهر · 3 مواقع',
    },
  };

  /* Vous vs … benchmark labels */
  const BENCH_LABELS = {
    fr: {
      cafeAtlas:     { title: 'Vous vs cafés similaires',     sub: '147 cafés casablancais · même gamme de ticket moyen' },
      maisonMansour: { title: 'Vous vs boutiques similaires', sub: '89 boutiques marocaines · gamme premium' },
      spaBahia:      { title: 'Vous vs spas similaires',      sub: '42 spas haut de gamme · Casa / Marrakech' },
      fusion:        { title: 'Portfolio vs marchands multi-sites', sub: '38 marchands Kiwi · 3+ emplacements actifs' },
    },
    en: {
      cafeAtlas:     { title: 'You vs similar cafés',     sub: '147 Casablanca cafés · same avg ticket range' },
      maisonMansour: { title: 'You vs similar boutiques', sub: '89 Moroccan boutiques · premium range' },
      spaBahia:      { title: 'You vs similar spas',      sub: '42 high-end spas · Casa / Marrakech' },
      fusion:        { title: 'Portfolio vs multi-site merchants', sub: '38 Kiwi merchants · 3+ active locations' },
    },
    ar: {
      cafeAtlas:     { title: 'أنتم مقابل المقاهي المماثلة',   sub: '147 مقهى بالدار البيضاء · نفس متوسّط التذكرة' },
      maisonMansour: { title: 'أنتم مقابل المتاجر المماثلة',   sub: '89 متجرًا مغربيًا · الفئة الراقية' },
      spaBahia:      { title: 'أنتم مقابل المنتجعات المماثلة', sub: '42 منتجعًا راقيًا · الدار البيضاء / مراكش' },
      fusion:        { title: 'المحفظة مقابل التجار متعددي المواقع', sub: '38 تاجرًا في كيوي · 3+ مواقع نشطة' },
    },
  };

  /* ═══════════════ CUSTOM (USER-CREATED) VENUES ═══════════════
   * The onboarding wizard lets a merchant create their own venue. These carry
   * no demo data — dateRange.js's vData() hands back a zeroed dataset for them
   * — and persist in localStorage so they survive reloads. */
  const CUSTOM_KEY = 'kiwiCustomVenues';
  const customIds = new Set();

  function loadCustomVenues() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch (_) {}
    if (!Array.isArray(saved)) saved = [];
    saved.forEach(v => { if (v && v.id) { VENUES[v.id] = v; customIds.add(v.id); } });
  }
  function persistCustomVenues() {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify([...customIds].map(id => VENUES[id]))); }
    catch (_) {}
  }
  const isCustom = id => customIds.has(id || currentVenue);

  /* Build + register a venue from the wizard config. Returns the new id. */
  function createVenue(cfg) {
    cfg = cfg || {};
    const id = 'v' + Date.now().toString(36);
    const TYPE_LABELS = { restaurant: 'Restaurant', boutique: 'Boutique', spa: 'Spa' };
    const type = ['restaurant', 'boutique', 'spa'].includes(cfg.type) ? cfg.type : 'restaurant';
    const name = (cfg.name || 'Mon activité').trim();
    const location = (cfg.location || '').trim();
    VENUES[id] = {
      id, name, location,
      fullDisplay: location ? `${name} · ${location}` : name,
      type, typeLabel: (cfg.typeLabel || TYPE_LABELS[type]),
      siblings: '', status: 'En service', ice: '—',
      txCount: 0, staffCount: 0, custom: true,
      hours: cfg.hours || '', methods: cfg.methods || '', goal: +cfg.goal || 0,
    };
    customIds.add(id);
    persistCustomVenues();
    return id;
  }

  /* Patch an existing custom venue (name / location / hours / methods / goal)
   * from the Settings editor — persists and re-renders if it's active. */
  function updateVenue(id, patch) {
    id = id || currentVenue;
    const v = VENUES[id];
    if (!v || !customIds.has(id) || !patch) return false;
    if (patch.name != null)     v.name = String(patch.name).trim() || v.name;
    if (patch.location != null) v.location = String(patch.location).trim();
    if (patch.hours != null)    v.hours = String(patch.hours).trim();
    if (patch.methods != null)  v.methods = String(patch.methods).trim();
    if (patch.goal != null)     v.goal = Math.max(0, +patch.goal || 0);
    v.fullDisplay = v.location ? `${v.name} · ${v.location}` : v.name;
    persistCustomVenues();
    if (id === currentVenue) {
      renderAll();
      subscribers.forEach(fn => { try { fn(id); } catch (_) {} });
    }
    return true;
  }
  loadCustomVenues();

  /* ═══════════════ STATE ═══════════════ */

  const getVenue = () => currentVenue;
  const getVenueData = id => VENUES[id] || VENUES[currentVenue];
  const getCurrentVenueData = () => VENUES[currentVenue];
  const getVenueType = id => (VENUES[id] || VENUES[currentVenue])?.type;

  function setVenue(id) {
    if (!VALID.includes(id) && !customIds.has(id)) return;
    if (id === currentVenue) return;
    // Switching to a real / custom venue from anywhere → ensure fusion-mode is off.
    // (Switching INTO fusion goes through enterFusion(), not setVenue.)
    if (REAL_VENUES.includes(id) || customIds.has(id)) document.body.classList.remove('fusion-mode');
    currentVenue = id;
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
    renderAll();
    subscribers.forEach(fn => { try { fn(id); } catch (_) {} });
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  /* ═══════════════ RENDER: SIDEBAR LOC-SWITCH (top of sidebar) ═══════════════ */

  function renderLocSwitch() {
    const v = VENUES[currentVenue];
    const nameEl = document.querySelector('[data-loc-name]');
    const metaEl = document.querySelector('[data-loc-meta]');
    if (nameEl) nameEl.textContent = v.fullDisplay;
    if (metaEl) metaEl.textContent = v.siblings;
    // ✦ Kiwi Ultra · only visible when fusion + ultra plan
    const ultraEl = document.querySelector('[data-loc-ultra]');
    if (ultraEl) {
      if (currentVenue === 'fusion' && currentPlan === 'ultra') ultraEl.removeAttribute('hidden');
      else ultraEl.setAttribute('hidden', '');
    }
    // Chevron rotation tied to dropdownOpen handled in toggleDropdown()
  }

  /* ═══════════════ RENDER: SIDEBAR UPSELL / PLAN STATUS ═══════════════
   * Single-venue view keeps the original "Passer à Ultra" upsell — kept
   * for demo / pitch surfaces. Fusion view (where the merchant has
   * already paid for Ultra) surfaces plan status instead of selling. */
  function renderUpsell() {
    const wrap = document.querySelector('[data-upsell]');
    if (!wrap) return;
    const showStatus = currentVenue === 'fusion' && currentPlan === 'ultra';
    if (showStatus) {
      wrap.classList.add('upsell-status');
      wrap.innerHTML = `
        <div class="t">✦ KIWI ULTRA</div>
        <div class="us-line">Actif · renouvellement 14.06.2026</div>
        <a href="#" class="us-manage" data-action="manage-billing">Gérer mon abonnement →</a>
      `;
    } else {
      wrap.classList.remove('upsell-status');
      wrap.innerHTML = `
        <div class="t">KIWI ULTRA</div>
        <h4>1 499 MAD/mois</h4>
        <p>Multi-pays, API enterprise, account manager dédié. Upgrade depuis Pro 399 sans engagement.</p>
        <button data-action="upgrade-pro">Passer à Ultra →</button>
      `;
    }
  }

  /* ═══════════════ RENDER: SIDEBAR DROPDOWN ═══════════════ */

  // Type-icon SVG used inside each dropdown row
  const TYPE_ICONS = {
    restaurant: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h2v11M11 2v20M11 11h8a3 3 0 003-3V4M19 4v17"/></svg>',
    boutique:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>',
    spa:        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z"/></svg>',
  };

  const DROPDOWN_CTA = {
    fr: { exitT: 'Revenir à la vue simple', exitS: 'Repasser sur un seul emplacement', enterT: 'Go Ultra', enterS: 'Vue consolidée · données multi-sites' },
    en: { exitT: 'Back to single view', exitS: 'Return to a single location', enterT: 'Go Ultra', enterS: 'Consolidated view · multi-site data' },
    ar: { exitT: 'العودة إلى العرض البسيط', exitS: 'الرجوع إلى موقع واحد', enterT: 'Go Ultra', enterS: 'عرض موحّد · بيانات متعدّدة المواقع' },
  };

  function renderDropdown() {
    const wrap = document.querySelector('[data-venue-dropdown]');
    if (!wrap) return;
    const dd = DROPDOWN_CTA[fusionLang()] || DROPDOWN_CTA.fr;
    const inFusion = currentVenue === 'fusion';
    const venueRows = REAL_VENUES.map(id => {
      const v = VENUES[id];
      const isActive = !inFusion && id === currentVenue;
      return `
        <button type="button" class="venue-row${isActive ? ' active' : ''}" data-action="venue-pick" data-venue="${id}">
          <div class="venue-row-icon">${TYPE_ICONS[v.type] || TYPE_ICONS.restaurant}</div>
          <div class="venue-row-body">
            <div class="venue-row-name">${v.name} · ${v.location}</div>
            <div class="venue-row-type">${v.typeLabel}</div>
          </div>
          <div class="venue-row-status" aria-label="${v.status}"><i></i></div>
        </button>
      `;
    }).join('');

    // CTA appended at the bottom of the dropdown — toggles fusion mode.
    const cta = inFusion ? `
        <button type="button" class="venue-action return-cta" data-action="venue-exit-fusion">
          <div class="va-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div class="va-body">
            <div class="va-title">${dd.exitT}</div>
            <div class="va-sub" style="font-size:11px;color:var(--n-500);margin-top:1px;">${dd.exitS}</div>
          </div>
        </button>
      ` : `
        <button type="button" class="venue-action fusion-cta" data-action="venue-enter-fusion">
          <div class="va-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8 8l3.5 7M16 8l-3.5 7"/></svg>
          </div>
          <div class="va-body">
            <div class="va-title">${dd.enterT}</div>
            <div class="va-sub">${dd.enterS}</div>
          </div>
        </button>
      `;

    wrap.innerHTML = venueRows + cta;
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    applyDropdownState();
  }
  function closeDropdown() {
    if (!dropdownOpen) return;
    dropdownOpen = false;
    applyDropdownState();
  }
  function applyDropdownState() {
    const dd = document.querySelector('[data-venue-dropdown]');
    const sw = document.querySelector('.loc-switch');
    if (dd) dd.classList.toggle('open', dropdownOpen);
    if (sw) sw.classList.toggle('open', dropdownOpen);
  }

  /* Click-outside + Escape closers (registered once) */
  function setupDropdownClosers() {
    document.addEventListener('click', (e) => {
      if (!dropdownOpen) return;
      const inside = e.target.closest('.loc-switch, [data-venue-dropdown]');
      if (!inside) closeDropdown();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownOpen) closeDropdown();
    });
  }

  /* ═══════════════ RENDER: SIDEBAR VERTICAL SECTION ═══════════════ */

  /* Sidebar block shown in fusion mode in place of the per-vertical section.
   * 4 cross-store KPIs that only make sense at the portfolio level. */
  function fusionSidebarHtml() {
    const ultraPill = currentPlan === 'ultra'
      ? '<span class="fk-ultra">✦ ULTRA</span>'
      : '';
    return `
      <div class="fusion-kpis">
        <div class="fk-head"><i></i><span>VUE PORTFOLIO</span>${ultraPill}</div>
        <div class="fk-row"><span class="fk-l">Emplacements actifs</span><span class="fk-v">3 / 3</span></div>
        <div class="fk-row"><span class="fk-l">CA cumulé · 30j</span><span class="fk-v">1,47 M MAD</span></div>
        <div class="fk-row"><span class="fk-l">Top site</span><span class="fk-v">Café Atlas</span></div>
        <div class="fk-row"><span class="fk-l">Personnel total</span><span class="fk-v">14</span></div>
        <div class="fk-row"><span class="fk-l">Clients cross-site</span><span class="fk-v">312</span></div>
      </div>
    `;
  }

  function renderVerticalSection(opts = {}) {
    const wrap = document.querySelector('[data-vertical-section]');
    if (!wrap) return;
    // In fusion mode: replace the per-vertical menu with the aggregated
    // portfolio KPI block. Same fade-in/out as the regular swap.
    if (currentVenue === 'fusion') {
      const html = fusionSidebarHtml();
      if (opts.skipFade) { wrap.innerHTML = html; return; }
      wrap.classList.add('vert-fading');
      setTimeout(() => {
        wrap.innerHTML = html;
        wrap.offsetHeight;
        wrap.classList.remove('vert-fading');
      }, 150);
      return;
    }
    const v = VENUES[currentVenue];
    const sect = VERTICAL_SECTIONS[v.type];
    if (!sect) return;

    const lang = window.KiwiI18n?.getLang?.() || 'fr';
    const T = window.KiwiI18n?.T?.[lang] || {};
    const headerTxt = T[sect.i18nHeader] || sect.header;

    const html = `
      <div class="sect" data-i18n="${sect.i18nHeader}">${headerTxt}</div>
      ${sect.items.map(it => {
        const lbl = T[it.i18n] || it.label;
        return `
          <a href="#" data-nav="${it.nav}" data-i18n-attr="aria-label:${it.i18n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${it.icon}</svg>
            <span data-i18n="${it.i18n}">${lbl}</span>
            ${it.tag ? `<span class="tag">${it.tag}</span>` : ''}
          </a>
        `;
      }).join('')}
    `;

    if (opts.skipFade) {
      wrap.innerHTML = html;
      return;
    }
    // 150ms fade-out → swap → fade-in
    wrap.classList.add('vert-fading');
    setTimeout(() => {
      wrap.innerHTML = html;
      // Force reflow then re-trigger the fade-in
      // eslint-disable-next-line no-unused-expressions
      wrap.offsetHeight;
      wrap.classList.remove('vert-fading');
    }, 150);
  }

  /* ═══════════════ RENDER: HEADER SUB-LINE ═══════════════ */

  function renderHeaderSub() {
    const sub = document.querySelector('[data-header-sub]');
    if (!sub) return;
    const lang = window.KiwiI18n?.getLang?.() || 'fr';
    sub.textContent = HEADER_SUB[lang]?.[currentVenue] || HEADER_SUB.fr[currentVenue];
  }

  /* ═══════════════ RENDER: DEMO BAR + FOOTER ═══════════════ */

  function renderDemoBar() {
    const line = document.querySelector('[data-demo-line]');
    if (!line) {
      const el = document.querySelector('[data-demo-account]');
      if (el) el.textContent = VENUES[currentVenue].name;
      return;
    }
    const name = VENUES[currentVenue].name;
    line.textContent = '';
    const b = document.createElement('b');
    b.style.color = 'var(--paper)';
    b.textContent = name;
    if (isCustom(currentVenue)) {
      // A user-created venue isn't the synthetic demo account.
      line.appendChild(document.createTextNode('Votre tableau de bord · '));
      line.appendChild(b);
    } else {
      b.setAttribute('data-demo-account', '');
      line.appendChild(document.createTextNode('Démo live · compte '));
      line.appendChild(b);
      line.appendChild(document.createTextNode(' · données de démonstration mises à jour en temps réel'));
    }
  }
  function renderFooter() {
    const el = document.querySelector('[data-footer-line]');
    if (!el) return;
    const v = VENUES[currentVenue];
    const lang = window.KiwiI18n?.getLang?.() || 'fr';
    const T = window.KiwiI18n?.T?.[lang] || {};
    const sponsor = T['dash.footer.sponsor'] || 'opéré sous sponsoring Bank Al-Maghrib';
    const help = T['dash.footer.help'] || 'aide WhatsApp';
    // The merchant name already sits in the demo bar — keep the footer to
    // legal / system info so the two bars don't echo each other.
    const legal = isCustom(currentVenue) ? '' : `ICE ${v.ice} · ${sponsor} · `;
    el['inner' + 'HTML'] = `${legal}Kiwi v2.38.1 · <a href="#" data-action="help-whatsapp">${help}</a>`;
  }

  /* ═══════════════ RENDER: SIDEBAR COUNTS ═══════════════ */

  function renderSidebarCounts() {
    const txCountEl = document.querySelector('a[data-nav="transactions"] .count');
    if (txCountEl) {
      // Pull the live count from the demo clock so this badge stays in lockstep
      // with the dashboard's Commandes KPI tile. If the clock isn't running yet
      // (initial paint before the simulator's first tick), fall back to the
      // venue's end-of-day target so the badge isn't empty.
      // User-created venue → count its recorded sales; demo venue → demo clock.
      const live = isCustom(currentVenue)
        ? ((window.KiwiSales && window.KiwiSales.totals(currentVenue).count) || 0)
        : window.KiwiDemoClock?.getSimState?.()?.cumTx;
      txCountEl.textContent = String(live != null ? live : (VENUES[currentVenue].txCount || 0));
    }
    // Terminals + compliance badges — a brand-new venue has neither yet.
    const cv = isCustom(currentVenue);
    const termEl = document.querySelector('a[data-nav="terminaux"] .count');
    if (termEl) termEl.textContent = cv ? '0' : '4';
    const confEl = document.querySelector('a[data-nav="conformite"] .tag');
    if (confEl) confEl.textContent = cv ? '—' : 'AAA';
    const staffCountEl = document.querySelector('a[data-nav="equipe"] .count');
    // Sidebar "Équipe" badge → number of staff currently clocked in (present),
    // scoped to the active venue (all 3 venues in fusion). See STAFF below.
    if (staffCountEl) staffCountEl.textContent = String(eqPresentCount());
  }

  /* Keep the sidebar count in sync with each demo-clock tick (every 3 s). */
  if (window.KiwiDemoClock?.subscribe) {
    window.KiwiDemoClock.subscribe(() => renderSidebarCounts());
  } else {
    // Demo clock may not be loaded yet — retry once on DOMContentLoaded.
    document.addEventListener('DOMContentLoaded', () => {
      window.KiwiDemoClock?.subscribe?.(() => renderSidebarCounts());
    });
  }

  /* ═══════════════ ACTION HANDLERS ═══════════════ */

  function onVenueToggle() { toggleDropdown(); }
  function onVenuePick(el) {
    const id = el?.dataset?.venue;
    if (id && REAL_VENUES.includes(id)) {
      // If switching from fusion → real venue: also tear down fusion mode.
      if (currentVenue === 'fusion') {
        exitFusion({ targetVenue: id });
      } else {
        setVenue(id);
      }
      closeDropdown();
    }
  }
  function onVenueEnterFusion() {
    closeDropdown();
    enterFusion();
  }
  function onVenueExitFusion() {
    closeDropdown();
    exitFusion();
  }

  /* ═══════════════ FUSION MODE — sci-fi transition + state swap ═══════════════ */

  // Build the overlay's internal markup fresh on each activation so the CRT
  // screen-open animation replays from t=0 (toggling .active reflows it).
  function buildOverlayMarkup(overlay) {
    overlay.innerHTML = `
      <div class="fo-crt-seed"></div>
      <div class="fo-crt-line top"></div>
      <div class="fo-crt-line bot"></div>
      <div class="fo-label">
        <span class="fo-mark">kiwi<i></i></span>
        <span class="fo-ultra">✦</span>
      </div>
    `;
  }

  function enterFusion() {
    if (fusionAnimating) return;
    if (currentVenue === 'fusion') return;
    fusionAnimating = true;
    preFusionVenue = currentVenue;

    const overlay = document.querySelector('[data-fusion-overlay]');
    if (!overlay) {
      // No overlay → just swap state silently (graceful fallback).
      currentVenue = 'fusion';
      document.body.classList.add('fusion-mode');
      try { localStorage.setItem(STORAGE_KEY, 'fusion'); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn('fusion'); } catch (_) {} });
      fusionAnimating = false;
      return;
    }

    // Reset + build fresh markup so the CRT + Kiwi lockup replay from t=0.
    overlay.classList.remove('exiting');
    buildOverlayMarkup(overlay);
    // Force reflow before flipping .active so the fade triggers cleanly.
    overlay.offsetHeight;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    /* Smart-TV screen-open (matches the .fo-crt + .fo-label CSS timing):
     *   t=0.00  dark wash fades in, CRT scanline ignites at centre
     *   t=0.55  the screen "opens" — two bright lines split apart
     *   t=0.85  the Kiwi lockup fades in, ✦ Ultra star pops in at t=1.18
     *   t=1.45  palette + data swap UNDER the wash (Go Ultra engaged)
     *   t=2.25  wash fades out, Go Ultra dashboard revealed
     *   t=2.75  cleanup
     */
    setTimeout(() => {
      document.body.classList.add('fusion-mode');
      // Engage the existing dark theme so every modal/drawer/menu (defined
      // in theme.css) re-skins automatically. body.fusion-mode then layers
      // the Atlas Dark brand tokens on top of the dark surface tokens.
      document.documentElement.setAttribute('data-theme', 'dark');
      currentVenue = 'fusion';
      try { localStorage.setItem(STORAGE_KEY, 'fusion'); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn('fusion'); } catch (_) {} });
    }, 1450);

    // Hold the lockup briefly, then fade the overlay out and clear markup.
    setTimeout(() => {
      overlay.classList.add('exiting');
      overlay.classList.remove('active');
    }, 2250);
    setTimeout(() => {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '';
      overlay.classList.remove('exiting');
      fusionAnimating = false;
    }, 2750);
  }

  function exitFusion(opts = {}) {
    if (fusionAnimating) return;
    if (currentVenue !== 'fusion') return;

    const target = opts.targetVenue || preFusionVenue || DEFAULT_VENUE;
    const nextVenue = REAL_VENUES.includes(target) ? target : DEFAULT_VENUE;
    const overlay = document.querySelector('[data-fusion-overlay]');

    // Graceful fallback — no overlay element → soft swap.
    if (!overlay) {
      document.body.classList.remove('fusion-mode');
      document.documentElement.removeAttribute('data-theme');
      currentVenue = nextVenue;
      try { localStorage.setItem(STORAGE_KEY, currentVenue); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn(currentVenue); } catch (_) {} });
      return;
    }

    fusionAnimating = true;

    // Smart-TV screen-close back to the single-venue view — the screen
    // collapses CRT-style while the palette reverts underneath.
    overlay.classList.remove('exiting');
    overlay.innerHTML = `
      <div class="fo-crt-line top-exit"></div>
      <div class="fo-crt-line bot-exit"></div>
      <div class="fo-crt-seed exit"></div>
    `;
    overlay.offsetHeight; // reflow → animations replay
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    /* Smart-TV screen-close (matches the .fo-crt exit CSS timing):
     *   t=0.00  dark wash fades in over the Go Ultra dashboard
     *   t=0.10  two CRT lines slide IN from the edges → meet at centre
     *   t=0.80  the centre scanline ignites, then collapses to a point
     *   t=1.05  palette + data revert UNDER the wash
     *   t=1.55  wash fades out, single-venue dashboard revealed
     *   t=2.10  cleanup
     */
    setTimeout(() => {
      document.body.classList.remove('fusion-mode');
      document.documentElement.removeAttribute('data-theme');
      currentVenue = nextVenue;
      try { localStorage.setItem(STORAGE_KEY, currentVenue); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn(currentVenue); } catch (_) {} });
    }, 1050);

    setTimeout(() => {
      overlay.classList.add('exiting');
      overlay.classList.remove('active');
    }, 1550);
    setTimeout(() => {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '';
      overlay.classList.remove('exiting');
      fusionAnimating = false;
    }, 2100);
  }

  function registerHandlers() {
    const tryReg = () => {
      if (window.Kiwi?.handlers) {
        window.Kiwi.handlers['venue-toggle']        = onVenueToggle;
        window.Kiwi.handlers['venue-pick']          = onVenuePick;
        window.Kiwi.handlers['venue-enter-fusion']  = onVenueEnterFusion;
        window.Kiwi.handlers['venue-exit-fusion']   = onVenueExitFusion;
        // Override the legacy 'location-switch' handler so the old
        // Casa/Marrakech menu doesn't pop when the user clicks the venue tile.
        window.Kiwi.handlers['location-switch']     = onVenueToggle;
        return;
      }
      setTimeout(tryReg, 30);
    };
    tryReg();
  }

  /* ═══════════════ I18N HOOK — re-render lang-bound bits when lang changes ═══════════════ */

  function hookI18n() {
    const api = window.KiwiI18n;
    if (!api?.setLang || api.__venueWrapped) return;
    const orig = api.setLang;
    api.setLang = function () {
      const r = orig.apply(this, arguments);
      // Re-render the bits we own that have lang-dependent text
      renderHeaderSub();
      renderFooter();
      renderVerticalSection({ skipFade: true });
      renderDropdown();
      if (currentVenue === 'fusion') { try { renderFusionView(); } catch (_) {} }
      return r;
    };
    api.__venueWrapped = true;
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * FUSION VIEW — dedicated portfolio layout
   * ─────────────────────────────────────────────────────────────────────
   * Paints <section class="dash-fusion"> in dashboard.html with 6 sections
   * (hero, KPI cards, venue rows, chart, intel, alerts). Reads from the
   * enriched VENUES.fusion data above. On Aujourd'hui, ticks per-venue
   * values from window.KiwiDemoClock every 3 seconds.
   *
   * Render entrypoints:
   *   renderFusionView()             — full re-paint (range change, init)
   *   renderFusionLiveUpdate(state)  — per-tick update (clock subscriber)
   * ═══════════════════════════════════════════════════════════════════════ */

  // ── MIRROR of demoClock.js · TARGETS + HOUR_WEIGHTS ─────────────────
  // demoClock.js holds these as private IIFE constants and only exposes
  // single-venue state. To render per-venue live values for fusion (3
  // venue rows ticking independently) we mirror them here and recompute
  // each venue's cumulatives from state.fraction.
  // ⚠ KEEP IN SYNC if you change demoClock.js TARGETS / HOUR_WEIGHTS.
  const FUSION_PER_VENUE_TARGETS = {
    cafeAtlas:     { revenue: 31500, tx: 215, tips: 2400 },
    maisonMansour: { revenue: 14000, tx: 48,  tips: 0    },
    spaBahia:      { revenue: 10500, tx: 22,  tips: 1500 },
  };
  const FUSION_PER_VENUE_WEIGHTS = {
    cafeAtlas: {
      rev:  [0.018, 0.075, 0.110, 0.090, 0.040, 0.028, 0.040, 0.062, 0.100, 0.135, 0.130, 0.090, 0.052, 0.018, 0.008, 0.004],
      tx:   [0.020, 0.085, 0.130, 0.105, 0.040, 0.025, 0.035, 0.055, 0.095, 0.120, 0.110, 0.080, 0.050, 0.025, 0.018, 0.007],
      tips: [0.012, 0.065, 0.115, 0.100, 0.030, 0.020, 0.030, 0.060, 0.110, 0.150, 0.140, 0.090, 0.050, 0.020, 0.005, 0.003],
    },
    maisonMansour: {
      rev:  [0.080, 0.130, 0.105, 0.050, 0.038, 0.052, 0.110, 0.135, 0.150, 0.130, 0.018, 0.002, 0.000, 0.000, 0.000, 0.000],
      tx:   [0.082, 0.135, 0.108, 0.050, 0.040, 0.054, 0.108, 0.130, 0.145, 0.125, 0.015, 0.005, 0.003, 0.000, 0.000, 0.000],
      tips: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
    spaBahia: {
      rev:  [0.050, 0.115, 0.140, 0.085, 0.105, 0.140, 0.115, 0.085, 0.055, 0.035, 0.020, 0.005, 0.000, 0.000, 0.000, 0.000],
      tx:   [0.045, 0.110, 0.135, 0.085, 0.100, 0.140, 0.115, 0.090, 0.060, 0.045, 0.045, 0.018, 0.007, 0.005, 0.000, 0.000],
      tips: [0.040, 0.110, 0.140, 0.090, 0.110, 0.150, 0.110, 0.080, 0.060, 0.045, 0.035, 0.020, 0.008, 0.002, 0.000, 0.000],
    },
  };
  const FUSION_HOUR_LABELS = ['11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h','22h','23h','00h','01h','02h'];
  const FUSION_N = FUSION_HOUR_LABELS.length;
  const KIWI_NET_RATIO = 0.839;                // matches dateRange.js fee constant
  const FUSION_PORTFOLIO_GOAL = 55000;         // daily target — referenced by spec
  const FUSION_VENUE_IDS = ['cafeAtlas', 'maisonMansour', 'spaBahia'];

  function fusionCumulativeAt(weights, fraction) {
    if (!weights || !weights.length) return 0;
    const pos = fraction * FUSION_N;
    const idx = Math.min(FUSION_N - 1, Math.floor(pos));
    const within = Math.min(1, Math.max(0, pos - idx));
    let cum = 0;
    for (let i = 0; i < idx; i++) cum += weights[i];
    cum += (weights[idx] || 0) * within;
    return cum;
  }

  /* Compute per-venue cumulatives at this tick.
   * Returns { cafeAtlas: {revenue, tx, tips}, maisonMansour: …, spaBahia: …,
   *           portfolio: {revenue, tx, tips, panierMoyen, top, topRevenue} } */
  function computePerVenueLive(state) {
    const f = state?.fraction ?? 0;
    const out = { portfolio: { revenue: 0, tx: 0, tips: 0 } };
    let top = null, topRev = -1;
    FUSION_VENUE_IDS.forEach(id => {
      const t = FUSION_PER_VENUE_TARGETS[id];
      const w = FUSION_PER_VENUE_WEIGHTS[id];
      const cumRev  = fusionCumulativeAt(w.rev,  f) * t.revenue;
      const cumTx   = Math.round(fusionCumulativeAt(w.tx,   f) * t.tx);
      const cumTips = fusionCumulativeAt(w.tips, f) * t.tips;
      out[id] = { revenue: cumRev, tx: cumTx, tips: cumTips };
      out.portfolio.revenue += cumRev;
      out.portfolio.tx      += cumTx;
      out.portfolio.tips    += cumTips;
      if (cumRev > topRev) { topRev = cumRev; top = VENUES[id]?.name || id; }
    });
    out.portfolio.panierMoyen = out.portfolio.tx > 0 ? Math.round(out.portfolio.revenue / out.portfolio.tx) : 0;
    out.portfolio.top = top;
    out.portfolio.topRevenue = topRev;
    out.simIdx = state?.simIdx ?? 0;
    out.simHourLabel = state?.simHourLabel || FUSION_HOUR_LABELS[0];
    out.simMinute = state?.simMinute ?? 0;
    return out;
  }

  // ── Local twin of dateRange.animateNumber — identical easing/duration ──
  function fusionAnimateNumber(el, from, to, opts = {}) {
    if (!el) return;
    const duration = opts.duration ?? 800;
    const format = opts.format || (v => String(Math.round(v)));
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * ease(p);
      el.innerHTML = format(v);
      if (p < 1) requestAnimationFrame(tick);
      else el.innerHTML = format(to);
    }
    requestAnimationFrame(tick);
  }

  // ── French number formatters (mirror dateRange.js style) ──
  const fusionFrInt = n => Math.floor(n).toLocaleString('fr-FR').replace(/,/g, ' ').replace(/ /g, ' ');
  const fusionFmtMad = v => `${fusionFrInt(v)} MAD`;
  const fusionFmtMadCents = v => {
    const int = Math.floor(v);
    const cents = Math.round((v - int) * 100);
    return `${fusionFrInt(int)},${String(cents).padStart(2,'0')} <span class="currency">MAD</span>`;
  };
  const fusionFmtPct = v => {
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    const abs = Math.abs(v);
    const formatted = (Math.abs(abs - Math.round(abs)) < 0.001) ? String(Math.round(abs)) : abs.toFixed(1).replace('.', ',');
    return `${sign}${formatted} %`;
  };

  function fusionParseAmount(el) {
    if (!el) return 0;
    const m = el.textContent.replace('−', '-').match(/-?\d+(?:[\s ]\d{3})*(?:[.,]\d+)?/);
    if (!m) return 0;
    return parseFloat(m[0].replace(/[\s ]/g, '').replace(',', '.')) || 0;
  }

  // ── Delta label per range (matches single-venue convention) ──
  const FUSION_DELTA_LABELS = {
    fr: { aujourdhui: 'vs hier', hier: 'vs avant-hier', septJours: 'vs 7 jours précédents', trenteJours: 'vs 30 jours précédents' },
    en: { aujourdhui: 'vs yesterday', hier: 'vs day before', septJours: 'vs previous 7 days', trenteJours: 'vs previous 30 days' },
    ar: { aujourdhui: 'مقابل أمس', hier: 'مقابل أول أمس', septJours: 'مقابل 7 أيام السابقة', trenteJours: 'مقابل 30 يومًا السابقة' },
  };
  const FUSION_HERO_LABELS = {
    fr: { aujourdhui: "ENCAISSÉ AUJOURD'HUI · PORTEFEUILLE", hier: 'ENCAISSÉ HIER · PORTEFEUILLE', septJours: 'ENCAISSÉ 7 JOURS · PORTEFEUILLE', trenteJours: 'ENCAISSÉ 30 JOURS · PORTEFEUILLE' },
    en: { aujourdhui: 'CASHED TODAY · PORTFOLIO', hier: 'CASHED YESTERDAY · PORTFOLIO', septJours: 'CASHED 7 DAYS · PORTFOLIO', trenteJours: 'CASHED 30 DAYS · PORTFOLIO' },
    ar: { aujourdhui: 'المقبوض اليوم · المحفظة', hier: 'المقبوض أمس · المحفظة', septJours: 'المقبوض في 7 أيام · المحفظة', trenteJours: 'المقبوض في 30 يومًا · المحفظة' },
  };
  const fusionLang = () => (window.KiwiI18n?.getLang?.() || 'fr');

  // ── Effective range with personnalise→aujourdhui fallback ──
  function fusionEffectiveRange() {
    const r = window.KiwiDateRange?.getDateRange?.() ?? 'aujourdhui';
    return r === 'personnalise' ? 'aujourdhui' : r;
  }

  // ── Type-icon SVG inline (24×24, stroke 2 — matches existing style) ──
  const FUSION_TYPE_ICONS = {
    restaurant: '<path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 002-2V2"/><path d="M5 2v20"/><path d="M19 2v20"/><path d="M16 2v6c0 1.66 1.34 3 3 3"/>', // UtensilsCrossed-esque
    boutique:   '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>', // ShoppingBag
    spa:        '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>', // Sparkles-ish
    fusion:     '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8 8l3.5 7M16 8l-3.5 7"/>',
  };
  const FUSION_INTEL_ICONS = {
    users:     '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    pie:       '<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>',
    link:      '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
    alert:     '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  };
  const fusionIcon = (key) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${FUSION_INTEL_ICONS[key] || ''}</svg>`;
  const fusionTypeIcon = (type) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${FUSION_TYPE_ICONS[type] || FUSION_TYPE_ICONS.fusion}</svg>`;

  // ── SVG sparkline (80×32) — line stroke only, no axes ──
  function fusionSparkPath(values) {
    if (!values || values.length < 2) return '';
    const W = 80, H = 32, PAD = 2;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v, i) => {
      const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
  function fusionSparkSvg(values, positive) {
    const path = fusionSparkPath(values);
    const stroke = positive ? 'var(--atlas)' : 'var(--warning)';
    return `<svg class="fs-spark" width="80" height="32" viewBox="0 0 80 32" aria-hidden="true">
      <path d="${path}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  // ── Stacked-area chart (Mode A intraday OR Mode B 30-day) ──
  // Axes rendered as HTML overlays (not <text> inside the SVG) so text
  // doesn't distort when the SVG stretches non-uniformly to fill its
  // container width via preserveAspectRatio="none".
  function fusionStackedAreaSvg(points, opts = {}) {
    const W = opts.width || 700;
    const H = opts.height || 220;
    if (!points || points.length === 0) {
      return `<div class="fs-chart-empty">Données en cours d'arrivée…</div>`;
    }
    const totals = points.map(p => (p.cafeAtlas || 0) + (p.maisonMansour || 0) + (p.spaBahia || 0));
    const maxY = Math.max(opts.minMax || 0, Math.max(...totals)) * 1.05 || 1;
    // Use the full SVG viewport for the plot area — y axis lives outside
    // (HTML overlay) so we don't reserve PAD_L inside the SVG anymore.
    const xOf = i => points.length <= 1 ? W / 2 : (i / (points.length - 1)) * W;
    const yOf = v => H - (v / maxY) * H;

    // Build stacked paths bottom-to-top: spaBahia base, then mansour, then atlas on top.
    const stack = (key, baseKeys) => {
      const pts = points.map((p, i) => {
        const base = baseKeys.reduce((acc, k) => acc + (p[k] || 0), 0);
        return { x: xOf(i), top: yOf(base + (p[key] || 0)), bot: yOf(base) };
      });
      const upper = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.top.toFixed(1)}`).join(' ');
      const lower = pts.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.bot.toFixed(1)}`).join(' ');
      return `${upper} ${lower} Z`;
    };
    const pathSpa     = stack('spaBahia', []);
    const pathMansour = stack('maisonMansour', ['spaBahia']);
    const pathAtlas   = stack('cafeAtlas', ['spaBahia', 'maisonMansour']);

    // Y axis · HTML overlay (no distortion)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const v = maxY * t;
      const label = v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`;
      return { pct: (1 - t) * 100, label };
    });
    const yHtml = yTicks.map(t => `<span style="top:${t.pct.toFixed(1)}%">${t.label}</span>`).join('');

    // Grid lines · still inside SVG so they stretch with the plot
    const gridSvg = yTicks.map(t => {
      const y = (t.pct / 100) * H;
      return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.10"/>`;
    }).join('');

    // X axis · HTML overlay, % positioning
    const every = opts.showXEvery || 1;
    const xLabels = points
      .map((p, i) => (i % every === 0 || i === points.length - 1)
        ? { pct: points.length <= 1 ? 50 : (i / (points.length - 1)) * 100, label: p.label }
        : null)
      .filter(Boolean);
    const xHtml = xLabels.map(l => `<span style="left:${l.pct.toFixed(1)}%">${l.label}</span>`).join('');

    return `
      <div class="fs-chart-frame">
        <div class="fs-chart-y-axis">${yHtml}</div>
        <div class="fs-chart-plot">
          <svg class="fs-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            ${gridSvg}
            <path d="${pathSpa}"     fill="var(--fs-bahia)"   opacity="0.92"/>
            <path d="${pathMansour}" fill="var(--fs-mansour)" opacity="0.92"/>
            <path d="${pathAtlas}"   fill="var(--fs-atlas)"   opacity="0.92"/>
          </svg>
        </div>
        <div class="fs-chart-x-axis">${xHtml}</div>
      </div>`;
  }

  // ── Intraday data buffer (Mode A) ──
  // Built incrementally on each tick: one point per simIdx visited.
  let fusionIntradayBuffer = [];
  function fusionResetIntradayBuffer() { fusionIntradayBuffer = []; }
  function fusionAppendIntradayPoint(live) {
    const lastIdx = fusionIntradayBuffer.length > 0
      ? fusionIntradayBuffer[fusionIntradayBuffer.length - 1].simIdx
      : -1;
    // Only append when we cross into a new hour OR when buffer is empty.
    // Within the same hour we update the last point in place so the chart
    // grows smoothly without spiking at hour boundaries.
    if (live.simIdx > lastIdx) {
      fusionIntradayBuffer.push({
        simIdx: live.simIdx,
        label: FUSION_HOUR_LABELS[live.simIdx] || '',
        cafeAtlas:     live.cafeAtlas?.revenue || 0,
        maisonMansour: live.maisonMansour?.revenue || 0,
        spaBahia:      live.spaBahia?.revenue || 0,
      });
    } else if (fusionIntradayBuffer.length > 0) {
      const last = fusionIntradayBuffer[fusionIntradayBuffer.length - 1];
      last.cafeAtlas     = live.cafeAtlas?.revenue || 0;
      last.maisonMansour = live.maisonMansour?.revenue || 0;
      last.spaBahia      = live.spaBahia?.revenue || 0;
    }
  }

  /* ═════════════════ MAIN RENDER: full re-paint ═════════════════
   * Called on:  fusion mode activation, range change, manual refresh.
   * Reads:      VENUES.fusion.{snapshot,venueBreakdown,kpis,intelligence,
   *             portfolioTrend,alerts} + clock state if range=aujourdhui. */
  function renderFusionView() {
    const root = document.querySelector('[data-fusion-root]');
    if (!root) return;
    if (currentVenue !== 'fusion') {
      // Defensive — should never happen; root is hidden by CSS anyway.
      return;
    }
    root.removeAttribute('hidden');

    const range = fusionEffectiveRange();
    const isToday = range === 'aujourdhui';
    const f = VENUES.fusion;
    const snap = f.snapshot[range] || f.snapshot.aujourdhui;
    const breakdown = f.venueBreakdown[range] || f.venueBreakdown.aujourdhui;
    const kpis = f.kpis[range] || f.kpis.aujourdhui;

    // For Aujourd'hui, prefer live clock state as the initial paint values
    // so the view isn't blank waiting for the next tick.
    const liveState = isToday && window.KiwiDemoClock?.getSimState ? window.KiwiDemoClock.getSimState() : null;
    const live = liveState ? computePerVenueLive(liveState) : null;

    // ── Section 1 · Hero ──
    const heroLabel = root.querySelector('[data-fs-hero-label]');
    if (heroLabel) heroLabel.textContent = (FUSION_HERO_LABELS[fusionLang()] || FUSION_HERO_LABELS.fr)[range] || FUSION_HERO_LABELS.fr.aujourdhui;
    const livePill = root.querySelector('[data-fs-live-pill]');
    if (livePill) livePill.style.display = isToday ? '' : 'none';
    if (isToday && livePill) {
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      livePill.querySelector('[data-fs-live-time]').textContent = `${hh}:${mm}`;
    }

    const heroAmt = root.querySelector('[data-fs-hero-amount]');
    const heroTarget = isToday && live ? live.portfolio.revenue : snap.totalRevenue;
    if (heroAmt) {
      fusionAnimateNumber(heroAmt, fusionParseAmount(heroAmt), heroTarget, { format: fusionFmtMadCents });
    }

    // Deltas — hide null values
    const deltaWrap = root.querySelector('[data-fs-deltas]');
    if (deltaWrap) {
      const lbl = (FUSION_DELTA_LABELS[fusionLang()] || FUSION_DELTA_LABELS.fr)[range];
      const items = [];
      if (snap.deltaHier    != null) items.push({ k: 'hier',    label: lbl, value: snap.deltaHier });
      if (snap.deltaSemaine != null) items.push({ k: 'semaine', label: 'vs semaine dernière', value: snap.deltaSemaine });
      if (snap.deltaMois    != null) items.push({ k: 'mois',    label: 'vs mois dernier',    value: snap.deltaMois });
      const netVal = isToday && live ? Math.round(live.portfolio.revenue * KIWI_NET_RATIO) : snap.netAfterKiwi;
      deltaWrap.innerHTML = items.map(it => `
        <div class="b">
          <div class="l">${it.label.toUpperCase()}</div>
          <div class="v ${it.value >= 0 ? 'up' : 'down'}">${fusionFmtPct(it.value)}</div>
        </div>`).join('') + `
        <div class="b net">
          <div class="l">NET APRÈS KIWI</div>
          <div class="v" data-fs-net-val>${fusionFmtMad(netVal)}</div>
        </div>`;
    }

    // Progress bar — only when objectifJour not null
    const progressWrap = root.querySelector('[data-fs-progress]');
    if (progressWrap) {
      if (snap.objectifJour) {
        progressWrap.style.display = '';
        const pct = Math.min(100, (heroTarget / snap.objectifJour) * 100);
        const fill = progressWrap.querySelector('[data-fs-progress-bar]');
        const pctEl = progressWrap.querySelector('[data-fs-progress-pct]');
        if (fill) fill.style.width = `${pct.toFixed(1)}%`;
        if (pctEl) pctEl.textContent = `${Math.round(pct)} %`;
        const lblEl = progressWrap.querySelector('[data-fs-progress-label]');
        if (lblEl) lblEl.textContent = `OBJECTIF PORTEFEUILLE · ${fusionFrInt(snap.objectifJour)} MAD`;
      } else {
        progressWrap.style.display = 'none';
      }
    }

    // Top site line
    const topEl = root.querySelector('[data-fs-top-site]');
    if (topEl) {
      const topName = isToday && live ? live.portfolio.top : snap.topVenueToday;
      const topRev  = isToday && live ? live.portfolio.topRevenue : snap.topVenueRevenue;
      topEl.innerHTML = `Top site · <b>${topName}</b> · ${fusionFmtMad(topRev)}`;
    }

    // AI insights panel (right column, static across ranges)
    const aiWrap = root.querySelector('[data-fs-ai-insights]');
    if (aiWrap) {
      aiWrap.innerHTML = f.intelligence.aiInsights.slice(0, 1).map(ins => `
        <div class="fs-ai-item">
          <div class="fs-ai-title">${ins.title}</div>
          <div class="fs-ai-body">${ins.body}</div>
          <div class="fs-ai-action">→ ${ins.action}</div>
        </div>`).join('');
    }

    // ── Section 2 · KPI Cards ──
    const kpiWrap = root.querySelector('[data-fs-kpis]');
    if (kpiWrap) {
      const lbl = (FUSION_DELTA_LABELS[fusionLang()] || FUSION_DELTA_LABELS.fr)[range];
      const txVal     = isToday && live ? live.portfolio.tx          : kpis.transactionsTotales.value;
      const panierVal = isToday && live ? live.portfolio.panierMoyen : kpis.panierMoyenPondere.value;
      const margeVal  = kpis.margeBrute.value;
      const cards = [
        { key: 'tx',      label: kpis.transactionsTotales.label, value: txVal,                                  unit: '',                                        delta: kpis.transactionsTotales.delta },
        { key: 'panier',  label: kpis.panierMoyenPondere.label,  value: panierVal,                              unit: kpis.panierMoyenPondere.unit || 'MAD',     delta: kpis.panierMoyenPondere.delta },
        { key: 'marge',   label: kpis.margeBrute.label,          value: margeVal,                               unit: kpis.margeBrute.unit || '%',               delta: kpis.margeBrute.delta, isPct: true },
        { key: 'success', label: kpis.tauxSuccesMoyen.label,     value: kpis.tauxSuccesMoyen.value,             unit: kpis.tauxSuccesMoyen.unit || '%',          delta: kpis.tauxSuccesMoyen.delta, isPct: true },
        { key: 'ratio',   label: kpis.ratioCardCash.label,       value: kpis.ratioCardCash.value, isString: true, unit: kpis.ratioCardCash.unit || '%',          delta: kpis.ratioCardCash.delta },
        { key: 'loyal',   label: kpis.clientsFideles.label,      value: kpis.clientsFideles.value,              unit: kpis.clientsFideles.subValue ? `/ ${kpis.clientsFideles.subValue}` : '', delta: kpis.clientsFideles.delta },
      ];
      kpiWrap.innerHTML = cards.map(c => `
        <div class="fs-kpi" data-fs-kpi="${c.key}">
          <div class="fs-kpi-l">${c.label.toUpperCase()}</div>
          <div class="fs-kpi-v">
            <span data-fs-kpi-val>${c.isString ? c.value : (c.isPct ? c.value.toFixed(2).replace('.', ',') : fusionFrInt(c.value))}</span>
            ${c.unit ? `<span class="fs-kpi-u">${c.unit}</span>` : ''}
          </div>
          <div class="fs-kpi-d ${c.delta >= 0 ? 'up' : 'down'}">${fusionFmtPct(c.delta)} <span class="fs-kpi-dlbl">${lbl}</span></div>
        </div>`).join('');
    }

    // ── Section 3 · Venue rows ──
    const venuesWrap = root.querySelector('[data-fs-venues]');
    if (venuesWrap) {
      const portfolioTotal = isToday && live ? live.portfolio.revenue : breakdown.reduce((a, v) => a + v.revenue, 0);
      venuesWrap.innerHTML = breakdown.map(v => {
        const liveRev = isToday && live ? (live[v.id]?.revenue || 0) : v.revenue;
        const share = portfolioTotal > 0 ? (liveRev / portfolioTotal) * 100 : 0;
        const sparkTrend = isToday && live
          ? [...v.trend.slice(0, -1), liveRev]
          : v.trend;
        const isPositive = (v.deltaVsHier ?? 0) >= 0;
        return `
          <div class="fs-venue-row" data-fs-venue-row="${v.id}">
            <div class="fs-venue-left">
              <div class="fs-venue-icon">${fusionTypeIcon(v.type)}</div>
              <div>
                <div class="fs-venue-name">${v.name}</div>
                <div class="fs-venue-loc">${v.location}</div>
              </div>
            </div>
            <div class="fs-venue-rev">
              <div class="fs-venue-rev-v" data-fs-venue-revenue>${fusionFmtMad(liveRev)}</div>
              ${v.deltaVsHier != null
                ? `<div class="fs-venue-rev-d ${isPositive ? 'up' : 'down'}">${fusionFmtPct(v.deltaVsHier)} <span>vs hier</span></div>`
                : '<div class="fs-venue-rev-d muted">—</div>'}
            </div>
            <div class="fs-venue-spark-wrap" data-fs-venue-spark>${fusionSparkSvg(sparkTrend, isPositive)}</div>
            <div class="fs-venue-share">
              <div class="fs-venue-share-bar"><div class="fs-venue-share-fill" data-fs-venue-share-fill style="width:${share.toFixed(1)}%"></div></div>
              <div class="fs-venue-share-pct" data-fs-venue-share-pct>${Math.round(share)} %</div>
            </div>
            <div class="fs-venue-signal sig-${v.signal}">${v.signal === 'objectif-atteint' ? '✓ ' : v.signal === 'croissance' ? '↑ ' : ''}${v.signalLabel}</div>
          </div>`;
      }).join('');
    }

    // ── Section 4 · Chart (Mode A intraday OR Mode B 30-day) ──
    const chartWrap = root.querySelector('[data-fs-chart]');
    if (chartWrap) {
      const titleEl = chartWrap.querySelector('[data-fs-chart-title]');
      const subEl   = chartWrap.querySelector('[data-fs-chart-sub]');
      const bodyEl  = chartWrap.querySelector('[data-fs-chart-body]');
      if (isToday) {
        if (titleEl) titleEl.textContent = 'Revenu portefeuille · en cours';
        if (subEl)   subEl.textContent   = 'Cumul horaire · toutes enseignes · LIVE';
        // First paint: seed buffer from current state.
        if (live) fusionAppendIntradayPoint(live);
        if (bodyEl) {
          bodyEl.innerHTML = fusionIntradayBuffer.length > 0
            ? fusionStackedAreaSvg(fusionIntradayBuffer, { showXEvery: 1, minMax: FUSION_PORTFOLIO_GOAL * 0.4 })
              + `<div class="fs-chart-legend">
                  <span><i style="background:var(--fs-atlas)"></i> Café Atlas</span>
                  <span><i style="background:var(--fs-mansour)"></i> Maison Mansour</span>
                  <span><i style="background:var(--fs-bahia)"></i> Spa Bahia</span>
                </div>`
            : `<div class="fs-chart-empty">En attente du premier tick du démo-clock…</div>`;
        }
      } else if (range === 'hier') {
        if (titleEl) titleEl.textContent = 'Évolution du portefeuille';
        if (subEl)   subEl.textContent   = 'Sélectionnez 7 jours ou 30 jours pour voir le graphique';
        if (bodyEl)  bodyEl.innerHTML    = `<div class="fs-chart-empty">Sélectionnez 7 jours ou 30 jours pour voir l'évolution du portefeuille.</div>`;
      } else {
        const trend = f.portfolioTrend;
        const sliceN = range === 'septJours' ? 7 : trend.labels.length;
        const points = trend.labels.slice(-sliceN).map((label, i) => ({
          label,
          cafeAtlas:     trend.cafeAtlas[trend.labels.length - sliceN + i],
          maisonMansour: trend.maisonMansour[trend.labels.length - sliceN + i],
          spaBahia:      trend.spaBahia[trend.labels.length - sliceN + i],
        }));
        if (titleEl) titleEl.textContent = range === 'septJours' ? 'Évolution du portefeuille · 7 jours' : 'Évolution du portefeuille · 30 jours';
        if (subEl)   subEl.textContent   = '3 enseignes empilées · CA quotidien';
        if (bodyEl)  bodyEl.innerHTML    = fusionStackedAreaSvg(points, { showXEvery: range === 'septJours' ? 1 : 5 })
          + `<div class="fs-chart-legend">
              <span><i style="background:var(--fs-atlas)"></i> Café Atlas</span>
              <span><i style="background:var(--fs-mansour)"></i> Maison Mansour</span>
              <span><i style="background:var(--fs-bahia)"></i> Spa Bahia</span>
            </div>`;
      }
    }

    // ── Section 5 · Cross-venue intelligence tiles (static) ──
    const intelWrap = root.querySelector('[data-fs-intel]');
    if (intelWrap) {
      const I = f.intelligence;
      const conc = I.concentrationIndex;
      const concClass = conc > 55 ? 'warn' : conc < 40 ? 'good' : 'neutral';
      intelWrap.innerHTML = `
        <div class="fs-intel-tile">
          <div class="fs-intel-ico">${fusionIcon('users')}</div>
          <div class="fs-intel-v">${fusionFrInt(I.crossVenueCustomers)}</div>
          <div class="fs-intel-l">fréquentent plusieurs emplacements</div>
          <div class="fs-intel-n">Dépensent en moyenne 2,4× plus que les clients mono-site</div>
        </div>
        <div class="fs-intel-tile">
          <div class="fs-intel-ico">${fusionIcon('pie')}</div>
          <div class="fs-intel-v"><span class="${concClass}">${conc.toFixed(1).replace('.', ',')} %</span></div>
          <div class="fs-intel-l">du CA généré par Café Atlas</div>
          <div class="fs-intel-n ${concClass}">${conc > 55 ? '⚠ Concentration à diversifier' : conc < 40 ? '✓ Portefeuille équilibré' : 'Équilibre modéré'}</div>
        </div>
        <div class="fs-intel-tile">
          <div class="fs-intel-ico">${fusionIcon('link')}</div>
          <div class="fs-intel-v fs-intel-v-text">${I.topCrossVenuePair}</div>
          <div class="fs-intel-l">184 clients en commun</div>
          <div class="fs-intel-n">Duo le plus rentable du portefeuille</div>
        </div>`;
    }

    // ── Section 6 · Alerts (conditional, hidden when empty) ──
    const alertsWrap = root.querySelector('[data-fs-alerts]');
    if (alertsWrap) {
      if (!f.alerts || f.alerts.length === 0) {
        alertsWrap.setAttribute('hidden', '');
        alertsWrap.innerHTML = '';
      } else {
        alertsWrap.removeAttribute('hidden');
        alertsWrap.innerHTML = `
          <div class="fs-section-head"><h3>Signaux à surveiller</h3></div>
          <div class="fs-alerts-list">${f.alerts.map(a => `
            <div class="fs-alert">
              <div class="fs-alert-ico">${fusionIcon('alert')}</div>
              <div class="fs-alert-body">
                <div class="fs-alert-venue">${a.venueName}</div>
                <div class="fs-alert-msg">${a.message}</div>
              </div>
              <button class="fs-alert-cta" data-action="venue-pick" data-venue="${a.venueId}">Voir l'emplacement →</button>
            </div>`).join('')}
          </div>`;
      }
    }
  }

  /* ═════════════════ LIVE TICK: clock subscriber ═════════════════
   * Called every 3s by KiwiDemoClock when range === 'aujourdhui'.
   * Updates hero amount, NET, progress, top site, KPI cards, venue
   * rows, spark-lines, share bars, and intraday chart in place. */
  function renderFusionLiveUpdate(state, isReset) {
    const root = document.querySelector('[data-fusion-root]');
    if (!root) return;
    if (currentVenue !== 'fusion') return;
    if (fusionEffectiveRange() !== 'aujourdhui') return;

    if (isReset) {
      // Snap all live values to 0, clear intraday buffer, return early —
      // next tick (~3s away) animates from 0 naturally.
      fusionResetIntradayBuffer();
      const heroAmt = root.querySelector('[data-fs-hero-amount]');
      if (heroAmt) heroAmt.innerHTML = fusionFmtMadCents(0);
      const netEl = root.querySelector('[data-fs-net-val]');
      if (netEl) netEl.textContent = fusionFmtMad(0);
      const fill = root.querySelector('[data-fs-progress-bar]');
      if (fill) fill.style.width = '0%';
      const pctEl = root.querySelector('[data-fs-progress-pct]');
      if (pctEl) pctEl.textContent = '0 %';
      root.querySelectorAll('[data-fs-kpi-val]').forEach(el => { el.textContent = '0'; });
      root.querySelectorAll('[data-fs-venue-revenue]').forEach(el => { el.textContent = fusionFmtMad(0); });
      root.querySelectorAll('[data-fs-venue-share-fill]').forEach(el => { el.style.width = '0%'; });
      root.querySelectorAll('[data-fs-venue-share-pct]').forEach(el => { el.textContent = '0 %'; });
      const chartBody = root.querySelector('[data-fs-chart-body]');
      if (chartBody) chartBody.innerHTML = `<div class="fs-chart-empty">Reset · le portefeuille redémarre à zéro…</div>`;
      return;
    }

    const live = computePerVenueLive(state);
    fusionAppendIntradayPoint(live);

    // ── Hero amount + LIVE time pill ──
    const heroAmt = root.querySelector('[data-fs-hero-amount]');
    if (heroAmt) fusionAnimateNumber(heroAmt, fusionParseAmount(heroAmt), live.portfolio.revenue, { duration: 600, format: fusionFmtMadCents });

    const liveTime = root.querySelector('[data-fs-live-time]');
    if (liveTime) {
      const t = new Date();
      liveTime.textContent = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }

    // ── NET APRÈS KIWI ──
    const netEl = root.querySelector('[data-fs-net-val]');
    if (netEl) {
      const netTarget = Math.round(live.portfolio.revenue * KIWI_NET_RATIO);
      fusionAnimateNumber(netEl, fusionParseAmount(netEl), netTarget, { duration: 600, format: fusionFmtMad });
    }

    // ── Progress bar ──
    const fill = root.querySelector('[data-fs-progress-bar]');
    const pctEl = root.querySelector('[data-fs-progress-pct]');
    const pct = Math.min(100, (live.portfolio.revenue / FUSION_PORTFOLIO_GOAL) * 100);
    if (fill) fill.style.width = `${pct.toFixed(1)}%`;
    if (pctEl) pctEl.textContent = `${Math.round(pct)} %`;

    // ── Top site ──
    const topEl = root.querySelector('[data-fs-top-site]');
    if (topEl) topEl.innerHTML = `Top site · <b>${live.portfolio.top}</b> · ${fusionFmtMad(live.portfolio.topRevenue)}`;

    // ── KPI cards (tx, panier, tips) ──
    const txCard     = root.querySelector('[data-fs-kpi="tx"] [data-fs-kpi-val]');
    const panierCard = root.querySelector('[data-fs-kpi="panier"] [data-fs-kpi-val]');
    const tipsCard   = root.querySelector('[data-fs-kpi="tips"] [data-fs-kpi-val]');
    if (txCard)     fusionAnimateNumber(txCard,     fusionParseAmount(txCard),     live.portfolio.tx,                       { duration: 600, format: v => fusionFrInt(v) });
    if (panierCard) fusionAnimateNumber(panierCard, fusionParseAmount(panierCard), live.portfolio.panierMoyen,              { duration: 600, format: v => fusionFrInt(v) });
    if (tipsCard)   fusionAnimateNumber(tipsCard,   fusionParseAmount(tipsCard),   Math.round(live.portfolio.tips),         { duration: 600, format: v => fusionFrInt(v) });

    // ── Venue rows: revenue + share bar + last spark point ──
    const breakdown = VENUES.fusion.venueBreakdown.aujourdhui;
    breakdown.forEach(v => {
      const row = root.querySelector(`[data-fs-venue-row="${v.id}"]`);
      if (!row) return;
      const liveRev = live[v.id]?.revenue || 0;
      const share = live.portfolio.revenue > 0 ? (liveRev / live.portfolio.revenue) * 100 : 0;

      const revEl = row.querySelector('[data-fs-venue-revenue]');
      if (revEl) fusionAnimateNumber(revEl, fusionParseAmount(revEl), liveRev, { duration: 600, format: fusionFmtMad });

      const fillEl = row.querySelector('[data-fs-venue-share-fill]');
      if (fillEl) fillEl.style.width = `${share.toFixed(1)}%`;
      const sharePct = row.querySelector('[data-fs-venue-share-pct]');
      if (sharePct) sharePct.textContent = `${Math.round(share)} %`;

      const sparkWrap = row.querySelector('[data-fs-venue-spark]');
      if (sparkWrap) {
        const trend = [...v.trend.slice(0, -1), liveRev];
        sparkWrap.innerHTML = fusionSparkSvg(trend, (v.deltaVsHier ?? 0) >= 0);
      }
    });

    // ── Intraday chart re-render ──
    const chartBody = root.querySelector('[data-fs-chart-body]');
    if (chartBody && fusionIntradayBuffer.length > 0) {
      chartBody.innerHTML = fusionStackedAreaSvg(fusionIntradayBuffer, { showXEvery: 1, minMax: FUSION_PORTFOLIO_GOAL * 0.4 })
        + `<div class="fs-chart-legend">
            <span><i style="background:var(--fs-atlas)"></i> Café Atlas</span>
            <span><i style="background:var(--fs-mansour)"></i> Maison Mansour</span>
            <span><i style="background:var(--fs-bahia)"></i> Spa Bahia</span>
          </div>`;
    }
  }

  // ── Subscribe to clock for live ticks (fusion + aujourdhui only) ──
  if (window.KiwiDemoClock?.subscribe) {
    window.KiwiDemoClock.subscribe((state, isReset) => {
      if (currentVenue !== 'fusion') return;
      if (fusionEffectiveRange() !== 'aujourdhui') return;
      renderFusionLiveUpdate(state, isReset);
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.KiwiDemoClock?.subscribe?.((state, isReset) => {
        if (currentVenue !== 'fusion') return;
        if (fusionEffectiveRange() !== 'aujourdhui') return;
        renderFusionLiveUpdate(state, isReset);
      });
    });
  }

  // ── Subscribe to date-range changes for full re-paint ──
  if (window.KiwiDateRange?.subscribe) {
    window.KiwiDateRange.subscribe(() => {
      if (currentVenue !== 'fusion') return;
      fusionResetIntradayBuffer();
      renderFusionView();
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.KiwiDateRange?.subscribe?.(() => {
        if (currentVenue !== 'fusion') return;
        fusionResetIntradayBuffer();
        renderFusionView();
      });
    });
  }

  /* ═══════════════ AGGREGATE RENDER ═══════════════ */

  function renderAll(opts = {}) {
    renderLocSwitch();
    renderDropdown();
    renderVerticalSection(opts);
    renderHeaderSub();
    renderDemoBar();
    renderFooter();
    renderSidebarCounts();
    renderUpsell();
    if (currentVenue === 'fusion') {
      fusionResetIntradayBuffer();
      renderFusionView();
    }
  }

  /* ═══════════════ INIT ═══════════════ */

  function init() {
    if (!/dashboard\.html/.test(location.pathname)) return;
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    // Fusion mode is intentionally NOT persisted across reloads — the merchant
    // always lands in single-store view and must re-trigger the merge.
    if (stored === 'fusion') {
      stored = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
    currentVenue = (REAL_VENUES.includes(stored) || customIds.has(stored)) ? stored : DEFAULT_VENUE;
    // Defensive: strip any stale fusion-mode class + dark theme attribute.
    document.body.classList.remove('fusion-mode');
    document.documentElement.removeAttribute('data-theme');

    registerHandlers();
    setupDropdownClosers();
    hookI18n();
    renderAll({ skipFade: true });
  }

  /* init() is invoked at the very end of this IIFE — AFTER the Équipe block
   * below — because renderAll() → renderSidebarCounts() reads the STAFF
   * roster, and `const STAFF` must be initialised before init() can run. */

  /* ═══════════════════════════════════════════════════════════════════════
   * ÉQUIPE — Staff & HR page
   * ─────────────────────────────────────────────────────────────────────
   * A full dashboard view (replaces .container content) reachable from the
   * sidebar "Équipe" item. Single-venue → that venue's staff; fusion → all
   * three venues with a venue filter. Every interaction (clock-outs, new
   * members, planner edits) lives in memory only and resets on page reload.
   * Renders into <section class="dash-equipe"> via renderEquipe().
   * ═══════════════════════════════════════════════════════════════════════ */

  /* ── STAFF roster — single source of truth for the whole Équipe page ──── */
  const STAFF = {
    cafeAtlas: [
      { id: 'ca01', name: 'Mohammed Karimi', role: 'Chef de cuisine', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 45, contractHours: 44, avatar: 'MK', status: 'present', clockedInAt: '08:14', shiftsThisMonth: 22, hoursThisMonth: 96.5, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca02', name: 'Youssef Bennani', role: 'Cuisinier', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 32, contractHours: 44, avatar: 'YB', status: 'present', clockedInAt: '08:30', shiftsThisMonth: 20, hoursThisMonth: 88.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca03', name: 'Fatima Zahra Idrissi', role: 'Cuisinière', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 30, contractHours: 40, avatar: 'FZ', status: 'present', clockedInAt: '09:00', shiftsThisMonth: 19, hoursThisMonth: 76.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca04', name: 'Hassan Tazi', role: 'Plongeur / Préparation', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 22, contractHours: 40, avatar: 'HT', status: 'present', clockedInAt: '09:15', shiftsThisMonth: 21, hoursThisMonth: 84.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca05', name: 'Rachid Alami', role: 'Pizzaïolo / Crêpes', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 28, contractHours: 40, avatar: 'RA', status: 'off', clockedInAt: null, shiftsThisMonth: 18, hoursThisMonth: 72.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca06', name: 'Omar El Fassi', role: 'Aide de cuisine', department: 'cuisine', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 20, contractHours: 40, avatar: 'OE', status: 'present', clockedInAt: '10:00', shiftsThisMonth: 17, hoursThisMonth: 68.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca07', name: 'Youssef Amrani', role: 'Serveur senior', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 28, contractHours: 44, avatar: 'YA', status: 'present', clockedInAt: '10:45', shiftsThisMonth: 22, hoursThisMonth: 96.0, tipsThisMonth: 2840, salesThisMonth: 38200, voids: 1, rating: 4.9 },
      { id: 'ca08', name: 'Hamid Jelloul', role: 'Serveur', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 24, contractHours: 44, avatar: 'HJ', status: 'present', clockedInAt: '11:00', shiftsThisMonth: 20, hoursThisMonth: 88.0, tipsThisMonth: 1920, salesThisMonth: 29400, voids: 4, rating: 4.2 },
      { id: 'ca09', name: 'Sofia Belkadi', role: 'Serveuse', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 24, contractHours: 44, avatar: 'SB', status: 'present', clockedInAt: '11:00', shiftsThisMonth: 21, hoursThisMonth: 92.0, tipsThisMonth: 2210, salesThisMonth: 34100, voids: 2, rating: 4.7 },
      { id: 'ca10', name: 'Nadia Chraibi', role: 'Serveuse', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 22, contractHours: 40, avatar: 'NC', status: 'late', clockedInAt: null, shiftsThisMonth: 18, hoursThisMonth: 72.0, tipsThisMonth: 1640, salesThisMonth: 24800, voids: 3, rating: 4.1 },
      { id: 'ca11', name: 'Karim Mansouri', role: 'Serveur', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 22, contractHours: 40, avatar: 'KM', status: 'present', clockedInAt: '11:05', shiftsThisMonth: 19, hoursThisMonth: 76.0, tipsThisMonth: 1780, salesThisMonth: 26900, voids: 2, rating: 4.4 },
      { id: 'ca12', name: 'Leila Benkirane', role: 'Serveuse', department: 'salle', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 22, contractHours: 40, avatar: 'LB', status: 'present', clockedInAt: '11:10', shiftsThisMonth: 20, hoursThisMonth: 80.0, tipsThisMonth: 1920, salesThisMonth: 28400, voids: 1, rating: 4.6 },
      { id: 'ca13', name: 'Rachid B.', role: 'Caissier principal', department: 'caisse', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 35, contractHours: 44, avatar: 'RB', status: 'present', clockedInAt: '08:00', shiftsThisMonth: 22, hoursThisMonth: 96.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca14', name: 'Amina Tazi', role: "Hôtesse d'accueil", department: 'caisse', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 25, contractHours: 40, avatar: 'AT', status: 'present', clockedInAt: '10:30', shiftsThisMonth: 20, hoursThisMonth: 80.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca15', name: 'Mehdi Alaoui', role: 'Agent de propreté', department: 'support', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 18, contractHours: 40, avatar: 'MA', status: 'present', clockedInAt: '07:30', shiftsThisMonth: 22, hoursThisMonth: 88.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca16', name: 'Saida Benmoussa', role: 'Agente de propreté', department: 'support', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 18, contractHours: 40, avatar: 'SB2', status: 'off', clockedInAt: null, shiftsThisMonth: 20, hoursThisMonth: 80.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca17', name: 'Brahim Kettani', role: 'Livreur', department: 'support', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 20, contractHours: 40, avatar: 'BK', status: 'present', clockedInAt: '10:00', shiftsThisMonth: 21, hoursThisMonth: 84.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'ca18', name: 'Khadija Filali', role: 'Agente polyvalente', department: 'support', venue: 'cafeAtlas', venueName: 'Café Atlas', hourlyRate: 20, contractHours: 40, avatar: 'KF', status: 'present', clockedInAt: '09:45', shiftsThisMonth: 19, hoursThisMonth: 76.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
    ],
    spaBahia: [
      { id: 'sp01', name: 'Karima Idrissi', role: 'Manager spa', department: 'management', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 55, contractHours: 44, avatar: 'KI', status: 'present', clockedInAt: '09:00', shiftsThisMonth: 22, hoursThisMonth: 96.0, tipsThisMonth: 1200, salesThisMonth: 18400, voids: 0, rating: 5.0 },
      { id: 'sp02', name: 'Nour El Hassan', role: 'Praticienne senior', department: 'soin', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 40, contractHours: 40, avatar: 'NH', status: 'present', clockedInAt: '09:30', shiftsThisMonth: 20, hoursThisMonth: 80.0, tipsThisMonth: 2100, salesThisMonth: 24800, voids: 0, rating: 4.9 },
      { id: 'sp03', name: 'Salma Benkirane', role: 'Praticienne', department: 'soin', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 35, contractHours: 40, avatar: 'SBK', status: 'present', clockedInAt: '10:00', shiftsThisMonth: 19, hoursThisMonth: 76.0, tipsThisMonth: 1840, salesThisMonth: 21200, voids: 0, rating: 4.8 },
      { id: 'sp04', name: 'Yasmine Bouchikhi', role: 'Praticienne', department: 'soin', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 35, contractHours: 40, avatar: 'YBC', status: 'off', clockedInAt: null, shiftsThisMonth: 18, hoursThisMonth: 72.0, tipsThisMonth: 1620, salesThisMonth: 19400, voids: 0, rating: 4.7 },
      { id: 'sp05', name: 'Houda Chraibi', role: 'Praticienne', department: 'soin', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 32, contractHours: 40, avatar: 'HC', status: 'present', clockedInAt: '10:30', shiftsThisMonth: 17, hoursThisMonth: 68.0, tipsThisMonth: 1480, salesThisMonth: 17800, voids: 0, rating: 4.6 },
      { id: 'sp06', name: 'Zineb Alami', role: 'Réceptionniste', department: 'accueil', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 25, contractHours: 40, avatar: 'ZA', status: 'present', clockedInAt: '09:00', shiftsThisMonth: 21, hoursThisMonth: 84.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
      { id: 'sp07', name: 'Amine Tazi', role: "Agent d'entretien", department: 'support', venue: 'spaBahia', venueName: 'Spa Bahia', hourlyRate: 18, contractHours: 40, avatar: 'ATA', status: 'present', clockedInAt: '08:00', shiftsThisMonth: 22, hoursThisMonth: 88.0, tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null },
    ],
    maisonMansour: [
      { id: 'mm01', name: 'Aicha Benali', role: 'Conseillère senior', department: 'vente', venue: 'maisonMansour', venueName: 'Maison Mansour', hourlyRate: 30, contractHours: 44, avatar: 'AB', status: 'present', clockedInAt: '10:00', shiftsThisMonth: 22, hoursThisMonth: 96.0, tipsThisMonth: 0, salesThisMonth: 42800, voids: 1, rating: 4.8 },
      { id: 'mm02', name: 'Rania Tazi', role: 'Conseillère de vente', department: 'vente', venue: 'maisonMansour', venueName: 'Maison Mansour', hourlyRate: 24, contractHours: 40, avatar: 'RT', status: 'present', clockedInAt: '10:15', shiftsThisMonth: 20, hoursThisMonth: 80.0, tipsThisMonth: 0, salesThisMonth: 31200, voids: 2, rating: 4.5 },
    ],
  };

  /* ── Department metadata. Colours use existing tokens only (the brand has
   * no purple/pink/orange tokens — see CLAUDE.md §3 + the Bougainvillée
   * memo). The spec's "purple/pink/orange" are mapped to brand tokens. ──── */
  const EQ_DEPTS = {
    cuisine:    { label: 'Cuisine',    color: 'var(--warning)'   },
    salle:      { label: 'Salle',      color: 'var(--success)'   },
    caisse:     { label: 'Caisse',     color: 'var(--info)'      },
    accueil:    { label: 'Accueil',    color: 'var(--atlas-600)' },
    support:    { label: 'Support',    color: 'var(--n-400)'     },
    management: { label: 'Management', color: 'var(--ink)'       },
    soin:       { label: 'Soin',       color: 'var(--atlas)'     },
    vente:      { label: 'Vente',      color: 'var(--riad)'      },
  };
  const EQ_DEPT_ORDER = ['cuisine','salle','caisse','accueil','support','management','soin','vente'];
  const EQ_REVENUE_DEPTS = ['salle','soin','vente'];   // tips + performance roles
  const EQ_PORTFOLIO_REV_30D = 1470200;                // MAD — spec constant
  const EQ_MONTH_WEEKS = 4.33;                         // weeks per month

  /* ── Page + filter state (in-memory; resets on reload) ────────────────── */
  let eqCurrentPage = 'dashboard';   // 'dashboard' | 'equipe'
  let eqVenueFilter = 'all';         // fusion-only venue filter
  let eqDeptFilter  = 'all';
  let eqIdCounter   = 0;
  let eqShiftData   = null;          // lazily-built planner shift grid
  let eqPlannerWeek = 0;             // planner week offset (visual only)
  let eqPlannerModal = null;         // open planner modal ref
  const eqSessionOut = [];           // {id,name,type} clocked-out/absent this session

  /* ── SVG icons (lucide-style, currentColor) ───────────────────────────── */
  const EQ_IC = {
    userCheck: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    coffee:    '<path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4z"/><path d="M6 1v3M10 1v3M14 1v3"/>',
    timer:     '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v2"/>',
    eye:       '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    edit:      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    more:      '<circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    download:  '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    calendar:  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    logout:    '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    alert:     '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    chevL:     '<path d="M15 18l-6-6 6-6"/>',
    chevR:     '<path d="M9 18l6-6-6-6"/>',
    file:      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    ban:       '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  };
  const eqSvg = (k, sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${EQ_IC[k] || ''}</svg>`;

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function eqEsc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function eqFrInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function eqMad(n) { return eqFrInt(n) + ' MAD'; }
  function eqHours(h) { return (Number.isInteger(h) ? String(h) : String(h).replace('.', ',')) + ' h'; }
  function eqInitials(name) {
    const w = String(name).trim().split(/\s+/);
    return ((w[0] || '')[0] || '') + ((w.length > 1 ? w[w.length - 1] : '')[0] || '');
  }
  function eqHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
  function eqDeptColor(d) { return (EQ_DEPTS[d] || EQ_DEPTS.support).color; }
  function eqDeptLabel(d) { return (EQ_DEPTS[d] || { label: d }).label; }

  function eqAllStaff() { return [...STAFF.cafeAtlas, ...STAFF.spaBahia, ...STAFF.maisonMansour]; }
  function eqFindStaff(id) { return eqAllStaff().find(s => s.id === id) || null; }
  /* Staff in the active venue scope — fusion shows all three venues. */
  function eqScopedStaff() {
    return currentVenue === 'fusion' ? eqAllStaff() : (STAFF[currentVenue] || []).slice();
  }
  /* Scoped staff after the venue + department filters. */
  function eqVisibleStaff() {
    let list = eqScopedStaff();
    if (currentVenue === 'fusion' && eqVenueFilter !== 'all') list = list.filter(s => s.venue === eqVenueFilter);
    if (eqDeptFilter !== 'all') list = list.filter(s => s.department === eqDeptFilter);
    return list;
  }
  function eqPresentCount() { return eqScopedStaff().filter(s => s.status === 'present').length; }
  function eqSalary(s) { return s.hoursThisMonth * s.hourlyRate; }
  function eqPayroll(list) { return list.reduce((a, s) => a + eqSalary(s), 0); }
  function eqTipsTotal(list) { return list.reduce((a, s) => a + s.tipsThisMonth, 0); }
  function eqHoursTotal(list) { return list.reduce((a, s) => a + s.hoursThisMonth, 0); }

  /* ═══════════ NAVIGATION ═══════════ */

  function eqShowPage() {
    eqCurrentPage = 'equipe';
    /* Clear any sibling full-page view so two page-* classes never coexist. */
    document.body.classList.remove('page-menu', 'page-payroll');
    document.body.classList.add('page-equipe');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Équipe</b>';
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    document.querySelector('.sidebar nav a[data-nav="equipe"]')?.classList.add('active');
    window.scrollTo({ top: 0 });
    renderEquipe();
  }
  function eqShowDashboard() {
    if (eqCurrentPage !== 'equipe') return;
    eqCurrentPage = 'dashboard';
    document.body.classList.remove('page-equipe');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Tableau de bord</b>';
  }

  /* Wire the Équipe handlers onto Kiwi.handlers. venues.js loads after
   * pages.js / pages-pro.js, so assigning here overrides their drawer-based
   * nav-equipe. nav-accueil is wrapped so its existing behaviour is kept. */
  function eqWireHandlers() {
    const H = window.Kiwi && window.Kiwi.handlers;
    if (!H) { setTimeout(eqWireHandlers, 30); return; }

    H['nav-equipe'] = () => eqShowPage();
    const origAccueil = H['nav-accueil'];
    H['nav-accueil'] = function () {
      try { if (origAccueil) origAccueil.apply(this, arguments); } catch (_) {}
      eqShowDashboard();
    };

    H['eq-add-member']     = () => eqOpenStaffModal(null);
    H['eq-edit-member']    = (_el, id) => eqOpenStaffModal(eqFindStaff(id));
    H['eq-view-profile']   = (_el, id) => eqOpenProfileModal(eqFindStaff(id));
    H['eq-plan-shifts']    = () => eqOpenPlannerModal();
    H['eq-export-payroll'] = () => Kiwi.toast('Export paie généré', { type: 'success', desc: 'PDF envoyé au gérant' });
    H['eq-venue-filter']   = (el) => {
      eqVenueFilter = el.dataset.venue || 'all';
      const scope = eqVenueFilter === 'all' ? eqScopedStaff() : eqScopedStaff().filter(s => s.venue === eqVenueFilter);
      if (eqDeptFilter !== 'all' && !scope.some(s => s.department === eqDeptFilter)) eqDeptFilter = 'all';
      renderEquipe();
    };
    H['eq-dept-filter']    = (el) => { eqDeptFilter = el.dataset.dept || 'all'; renderEquipe(); };
    H['eq-clock-out']      = (el, id) => eqClockOut(id, el);
    H['eq-report-absence'] = (el, id) => eqReportAbsence(id, el);
    H['eq-generate-payslips'] = (el) => eqGeneratePayslips(el);
    H['eq-row-menu']       = (el, id) => eqOpenRowMenu(el, id);
    H['eq-shift-add']      = (_el, arg) => eqShiftSet(arg, true);
    H['eq-shift-edit']     = (el, arg) => eqShiftMenu(el, arg);
    H['eq-week-prev']      = () => { eqPlannerWeek--; eqRefreshPlanner(); };
    H['eq-week-next']      = () => { eqPlannerWeek++; eqRefreshPlanner(); };
    H['eq-publish-plan']   = () => Kiwi.toast('Planning publié', { type: 'success', desc: 'Notifications envoyées à 27 membres par WhatsApp' });
    H['eq-gap-whatsapp']   = (el) => { Kiwi.toast('Messages envoyés aux membres disponibles', { type: 'success' }); const a = el && el.closest('.eq-alert'); if (a) { a.style.transition = 'opacity 200ms'; a.style.opacity = '0'; setTimeout(() => a.remove(), 220); } };
    H['eq-gap-ignore']     = (el) => { const a = el && el.closest('.eq-alert'); if (a) { a.style.transition = 'opacity 200ms'; a.style.opacity = '0'; setTimeout(() => a.remove(), 220); } };
  }

  /* ═══════════ RENDER · ÉQUIPE PAGE ═══════════ */

  function renderEquipe() {
    const root = document.querySelector('[data-equipe-root]');
    if (!root) return;
    root.innerHTML =
      eqHeaderHtml() +
      eqFiltersHtml() +
      eqShiftSectionHtml() +
      eqTableSectionHtml() +
      eqPayrollSectionHtml() +
      eqRankingSectionHtml();
    eqAnimateBars(root);
  }

  /* Animate every progress bar from 0 → its data-eqw target on (re)render. */
  function eqAnimateBars(root) {
    root.querySelectorAll('[data-eqw]').forEach(el => {
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = el.dataset.eqw + '%'; }));
    });
  }

  function eqHeaderHtml() {
    return `
      <div class="eq-head">
        <div>
          <div class="eq-title">Équipe</div>
          <div class="eq-date">Service du jeudi 15 mai 2026</div>
        </div>
        <div class="eq-head-acts">
          <button class="btn-slim" data-action="eq-add-member">${eqSvg('plus', 13)}<span>Ajouter un membre</span></button>
          <button class="btn-slim" data-action="eq-export-payroll">${eqSvg('download', 13)}<span>Exporter paie</span></button>
          <button class="btn-slim primary" data-action="eq-plan-shifts">${eqSvg('calendar', 13)}<span>Planifier les shifts</span></button>
        </div>
      </div>`;
  }

  function eqFiltersHtml() {
    let rows = '';
    if (currentVenue === 'fusion') {
      const venues = [['all', 'Tous'], ['cafeAtlas', 'Café Atlas'], ['spaBahia', 'Spa Bahia'], ['maisonMansour', 'Maison Mansour']];
      rows += '<div class="eq-pill-row">' + venues.map(([id, lbl]) =>
        `<button class="eq-pill${eqVenueFilter === id ? ' on' : ''}" data-action="eq-venue-filter" data-venue="${id}">${lbl}</button>`
      ).join('') + '</div>';
    }
    let deptScope = eqScopedStaff();
    if (currentVenue === 'fusion' && eqVenueFilter !== 'all') deptScope = deptScope.filter(s => s.venue === eqVenueFilter);
    const present = EQ_DEPT_ORDER.filter(d => deptScope.some(s => s.department === d));
    rows += '<div class="eq-pill-row">' +
      `<button class="eq-pill${eqDeptFilter === 'all' ? ' on' : ''}" data-action="eq-dept-filter" data-dept="all">Tous</button>` +
      present.map(d => `<button class="eq-pill${eqDeptFilter === d ? ' on' : ''}" data-action="eq-dept-filter" data-dept="${d}">${eqDeptLabel(d)}</button>`).join('') +
      '</div>';
    return `<div class="eq-filters">${rows}</div>`;
  }

  /* ── Section 1 · Service en cours ─────────────────────────────────────── */
  function eqAvatar(s, size) {
    return `<span class="eq-av ${size}" style="background:${eqDeptColor(s.department)}">${eqEsc(eqInitials(s.name))}</span>`;
  }

  function eqShiftSectionHtml() {
    const list = eqVisibleStaff();
    const present = list.filter(s => s.status === 'present').length;
    const late = list.filter(s => s.status === 'late').length;
    const off = list.filter(s => s.status === 'off').length;
    const hours = eqHoursTotal(list);

    const tile = (icon, label, value, vClass, sub, extra) => `
      <div class="eq-stat">
        <div class="eq-stat-l"><span>${label}</span><span class="eq-stat-ico">${eqSvg(icon, 14)}</span></div>
        <div class="eq-stat-v ${vClass || ''}">${value}</div>
        <div class="eq-stat-sub">${sub}</div>
        ${extra || ''}
      </div>`;

    const tiles =
      tile('userCheck', 'En service', present, '', 'membres pointés aujourd\'hui',
        '<div class="eq-stat-d">+2 vs hier</div>') +
      tile('clock', 'En retard', late, late > 0 ? 'warn' : 'ok', 'shift commencé sans pointage') +
      tile('coffee', 'En congé / repos', off, '', 'jour de repos prévu') +
      tile('timer', 'Heures cumulées', eqHours(hours), '', 'heures travaillées ce mois',
        '<div class="eq-stat-live" data-eq-hours-live></div>');

    /* Live clock-in cards — present + late staff. */
    const liveStaff = list.filter(s => s.status === 'present' || s.status === 'late');
    const cards = liveStaff.length ? liveStaff.map(s => {
      const isLate = s.status === 'late';
      return `
        <div class="eq-clockcard${isLate ? ' late' : ''}" data-eq-card="${s.id}">
          <div class="eq-clockcard-top">
            ${eqAvatar(s, 'sm')}
            <div class="eq-clockcard-id">
              <div class="eq-clockcard-name">${eqEsc(s.name)}</div>
              <div class="eq-clockcard-role">${eqEsc(s.role)}</div>
            </div>
          </div>
          <div class="eq-clockcard-time${isLate ? ' late' : ''}">${isLate ? 'Shift prévu · 11:00' : 'Pointé à ' + s.clockedInAt}</div>
          ${isLate
            ? `<button class="eq-mini-btn warn" data-action="eq-report-absence" data-arg="${s.id}">${eqSvg('alert', 12)}Signaler l'absence</button>`
            : `<button class="eq-mini-btn" data-action="eq-clock-out" data-arg="${s.id}">${eqSvg('logout', 12)}Pointer sortie</button>`}
        </div>`;
    }).join('') : '<div class="eq-clockempty">Aucun membre en service pour ce filtre.</div>';

    const outChips = eqSessionOut.length ? `
      <div class="eq-clockedout">
        <div class="eq-clockedout-lbl">Sorties du jour · ${eqSessionOut.length}</div>
        <div class="eq-clockedout-list">
          ${eqSessionOut.map(o => `<span class="eq-clockedout-chip${o.type === 'absence' ? ' absent' : ''}">${eqAvatarMini(o)}${eqEsc(o.name)} · ${o.type === 'absence' ? 'absence signalée' : 'sortie pointée'}</span>`).join('')}
        </div>
      </div>` : '';

    return `
      <div class="eq-section">
        <div class="eq-section-head">
          <h3>Service en cours</h3>
          <span class="eq-live"><span class="dot"></span>LIVE</span>
        </div>
        <div class="eq-stats">${tiles}</div>
        <div class="eq-clockrow">${cards}</div>
        ${outChips}
      </div>`;
  }
  function eqAvatarMini(o) {
    const s = eqFindStaff(o.id);
    const c = s ? eqDeptColor(s.department) : 'var(--n-400)';
    return `<span class="eq-av sm" style="width:22px;height:22px;font-size:9px;background:${c}">${eqEsc(eqInitials(o.name))}</span>`;
  }

  /* ── Section 2 · Staff table ──────────────────────────────────────────── */
  function eqStatusCell(s) {
    const map = {
      present: ['s-present', 'En service · depuis ' + (s.clockedInAt || '—')],
      off:     ['s-off', 'Repos'],
      late:    ['s-late', 'En retard · shift à 11:00'],
      absent:  ['s-absent', 'Absent signalé'],
    };
    const [cls, txt] = map[s.status] || map.off;
    return `<span class="eq-status ${cls}"><span class="sd"></span>${txt}</span>`;
  }
  function eqHoursCell(s) {
    const monthly = s.contractHours * EQ_MONTH_WEEKS;
    const pace = monthly > 0 ? s.hoursThisMonth / monthly : 0;
    const pct = Math.min(100, Math.round(pace * 100));
    const cls = pace > 0.95 ? 'over' : pace < 0.42 ? 'warn' : 'ok';
    return `<div class="eq-hours-v">${eqHours(s.hoursThisMonth)}</div>
      <div class="eq-bar"><div class="eq-bar-fill ${cls}" data-eqw="${pct}"></div></div>`;
  }
  function eqSpark3(seed) {
    const h = eqHash(seed);
    const bars = [5 + h % 6, 7 + (h >> 3) % 6, 9 + (h >> 6) % 6];
    return `<span class="eq-spark3">${bars.map(b => `<i style="height:${b}px"></i>`).join('')}</span>`;
  }
  function eqTableSectionHtml() {
    const list = eqVisibleStaff();
    const fusion = currentVenue === 'fusion';
    const cols = ['Membre', fusion ? 'Emplacement' : null, 'Statut', 'Heures ce mois', 'Salaire estimé', 'Pourboires', 'Performance', 'Actions'].filter(Boolean);

    const rows = list.map(s => {
      const salary = eqSalary(s);
      const tipsCell = s.tipsThisMonth > 0
        ? `<div class="eq-tips-cell"><span class="eq-tips-v">${eqMad(s.tipsThisMonth)}</span>${eqSpark3(s.id)}</div>`
        : '<div class="eq-cell-empty">—</div>';
      const perfCell = s.rating != null
        ? `<div class="eq-perf-stars"><span class="st">★</span> ${s.rating.toFixed(1)}</div>
           <div class="eq-perf-sub">${eqMad(s.salesThisMonth)} CA</div>
           <div class="eq-perf-voids${s.voids > 2 ? ' bad' : ''}">${s.voids} annulation${s.voids === 1 ? '' : 's'}</div>`
        : '<div class="eq-cell-empty">—</div>';
      return `
        <tr class="eq-row-in">
          <td>
            <div class="eq-member">${eqAvatar(s, 'sm')}
              <div><div class="eq-member-name">${eqEsc(s.name)}</div><div class="eq-member-role">${eqEsc(s.role)}</div></div>
            </div>
          </td>
          ${fusion ? `<td><span class="eq-venue-badge">${eqEsc(s.venueName)}</span></td>` : ''}
          <td>${eqStatusCell(s)}</td>
          <td>${eqHoursCell(s)}</td>
          <td>
            <div class="eq-salary-v">${eqMad(salary)}</div>
            ${s.tipsThisMonth > 0 ? `<div class="eq-salary-sub">+ ${eqMad(s.tipsThisMonth)} pourboires</div>` : ''}
          </td>
          <td>${tipsCell}</td>
          <td>${perfCell}</td>
          <td>
            <div class="eq-actions">
              <button class="eq-icon-btn" data-action="eq-view-profile" data-arg="${s.id}" aria-label="Voir le profil">${eqSvg('eye', 14)}</button>
              <button class="eq-icon-btn" data-action="eq-edit-member" data-arg="${s.id}" aria-label="Modifier">${eqSvg('edit', 14)}</button>
              <button class="eq-icon-btn" data-action="eq-row-menu" data-arg="${s.id}" aria-label="Plus d'actions">${eqSvg('more', 14)}</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    /* Footer summary — every value computed from STAFF. */
    const all = eqScopedStaff();
    const payroll = eqPayroll(all);
    const ratio = payroll / EQ_PORTFOLIO_REV_30D * 100;
    const ratioCls = ratio < 30 ? 'ok' : ratio <= 38 ? 'warn' : 'bad';
    const ratioStr = ratio.toFixed(1).replace('.', ',');
    const presentAll = all.filter(s => s.status === 'present').length;

    return `
      <div class="eq-section">
        <div class="eq-section-head">
          <h3>Tous les membres</h3>
          <span class="eq-count-badge">${list.length} affiché${list.length === 1 ? '' : 's'}</span>
        </div>
        <div class="eq-table-wrap">
          <table class="eq-table">
            <thead><tr>${cols.map(c => `<th${c === 'Actions' ? ' class="eq-num"' : ''}>${c}</th>`).join('')}</tr></thead>
            <tbody>${rows || `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--n-500);padding:28px;">Aucun membre pour ce filtre.</td></tr>`}</tbody>
          </table>
        </div>
        <div class="eq-table-foot">
          <span><b>${all.length}</b> membres</span><span class="sep">·</span>
          <span><b>${presentAll}</b> en service</span><span class="sep">·</span>
          <span>Masse salariale estimée ce mois : <b>${eqMad(payroll)}</b></span><span class="sep">·</span>
          <span>Ratio coût main d'œuvre :
            <span class="eq-ratio ${ratioCls}">${ratioStr}&nbsp;%
              <span class="eq-tip">Dans la restauration F&amp;B au Maroc, une fourchette de 28–35&nbsp;% est considérée comme saine. En dessous = marge confortable.</span>
            </span>
          </span>
        </div>
      </div>`;
  }

  /* ── Section 3 · Payroll summary ──────────────────────────────────────── */
  function eqDonut(segs, px) {
    // pathLength=100 → dash/offset are exact percentages (no circumference
    // math, no rotate() hack). A hairline GAP separates segments; each wipes
    // in clockwise from 12 o'clock, staggered, via the CSS keyframe below.
    // `px` = rendered size; the viewBox is fixed so the whole ring (and its
    // centre hole) scales up when a long amount needs more room.
    const size = px || 150;
    const GAP = 2.5;   // gap between segments, in %
    // Keep the *visible* ring a consistent ~13px no matter how big the donut
    // grows — the viewBox is fixed at 150, so scale the stroke inversely.
    const SW = +(13 * 150 / size).toFixed(2);
    let acc = 0;
    const track = `<circle cx="75" cy="75" r="52" fill="none" stroke="var(--n-200)" stroke-width="${SW}" pathLength="100"/>`;
    const rings = segs.map((g, i) => {
      const pct = g.pct || 0;
      const dash = Math.max(0.01, pct - GAP);
      const offset = 25 - acc;
      acc += pct;
      return `<circle class="eq-donseg" cx="75" cy="75" r="52" fill="none" stroke="${g.color}" `
        + `stroke-width="${SW}" pathLength="100" stroke-linecap="butt" `
        + `stroke-dasharray="${dash.toFixed(2)} ${(100 - dash).toFixed(2)}" `
        + `stroke-dashoffset="${offset.toFixed(2)}" style="animation-delay:${80 + i * 110}ms"/>`;
    }).join('');
    return `<svg viewBox="0 0 150 150" width="${size}" height="${size}" class="eq-donut-svg">`
      + `<style>`
      + `.eq-donseg{animation:eq-donseg-grow 720ms cubic-bezier(0.16,1,0.3,1) both;}`
      + `@keyframes eq-donseg-grow{from{stroke-dasharray:0 100;}}`
      + `@media (prefers-reduced-motion:reduce){.eq-donseg{animation:none;}}`
      + `</style>${track}${rings}</svg>`;
  }
  function eqPayrollSectionHtml() {
    const list = eqScopedStaff();   // payroll summary is always venue-scoped
    const gross = eqPayroll(list);
    const tips = eqTipsTotal(list);
    const total = gross + tips;

    const byDept = EQ_DEPT_ORDER.map(d => {
      const dl = list.filter(s => s.department === d);
      if (!dl.length) return null;
      return { dept: d, members: dl.length, hours: eqHoursTotal(dl), salary: eqPayroll(dl) };
    }).filter(Boolean);
    byDept.sort((a, b) => b.salary - a.salary);

    const segs = byDept.map(r => ({ pct: gross > 0 ? r.salary / gross * 100 : 0, color: eqDeptColor(r.dept) }));

    const legend = byDept.map(r => `
      <div class="eq-leg">
        <span class="lk" style="background:${eqDeptColor(r.dept)}"></span>
        <span class="ln">${eqDeptLabel(r.dept)}</span>
        <span class="lv">${gross > 0 ? Math.round(r.salary / gross * 100) : 0} %</span>
      </div>`).join('');

    const deptRows = byDept.map(r => `
      <tr>
        <td><span class="eq-dept-name"><span class="eq-dept-dot" style="background:${eqDeptColor(r.dept)}"></span>${eqDeptLabel(r.dept)}</span></td>
        <td class="r">${r.members}</td>
        <td class="r">${eqHours(r.hours)}</td>
        <td class="r">${eqMad(r.salary)}</td>
        <td class="r">${gross > 0 ? (r.salary / gross * 100).toFixed(1).replace('.', ',') : '0'} %</td>
      </tr>`).join('');

    return `
      <div class="eq-section">
        <div class="eq-section-head"><h3>Récapitulatif paie · Mai 2026</h3></div>
        <div class="eq-payroll-grid">
          <div>
            <div class="eq-payroll-stats">
              <div class="eq-pstat"><div class="l">Masse salariale brute</div><div class="v">${eqMad(gross)}</div><div class="s">${list.length} membres</div></div>
              <div class="eq-pstat"><div class="l">Pourboires distribués</div><div class="v">${eqMad(tips)}</div><div class="s">salle &amp; soin</div></div>
              <div class="eq-pstat"><div class="l">Coût total équipe</div><div class="v">${eqMad(total)}</div><div class="s">salaires + pourboires</div></div>
            </div>
            <table class="eq-dept-table">
              <thead><tr><th>Département</th><th class="r">Membres</th><th class="r">Heures totales</th><th class="r">Salaire total</th><th class="r">% de la masse</th></tr></thead>
              <tbody>${deptRows}</tbody>
            </table>
          </div>
          ${(() => {
            // Size the ring to the amount, then auto-fit the centre figure to
            // the inner hole so it never touches the stroke — clean at any
            // length. Ring grows 190→214px; font shrinks within 13–18px.
            const centerStr = eqMad(gross);
            const len = centerStr.length;
            const donutPx = Math.round(Math.min(214, Math.max(190, len * 19)));
            const vbSW = 13 * 150 / donutPx;                    // stroke, viewBox units
            const holePx = donutPx * (104 - vbSW) / 150;        // inner hole diameter, real px
            const dvPx = Math.max(13, Math.min(18, (holePx * 0.80) / (len * 0.58))).toFixed(1);
            const dlPx = Math.max(8, Math.min(11, dvPx * 0.54)).toFixed(1);
            return `<div class="eq-donut-wrap">
            <div class="eq-donut" style="width:${donutPx}px; height:${donutPx}px;">
              ${eqDonut(segs, donutPx)}
              <div class="eq-donut-center"><div class="dv" style="font-size:${dvPx}px;">${centerStr}</div><div class="dl" style="font-size:${dlPx}px;">Masse · mois</div></div>
            </div>
            <div class="eq-donut-legend">${legend}</div>
          </div>`;
          })()}
        </div>
        <div class="eq-payroll-cta">
          <button class="eq-cta-gradient" data-action="eq-generate-payslips">${eqSvg('file', 15)}<span>Générer les fiches de paie</span></button>
        </div>
      </div>`;
  }

  /* ── Section 4 · Performance ranking ──────────────────────────────────── */
  function eqRankingSectionHtml() {
    const ranked = eqScopedStaff()
      .filter(s => EQ_REVENUE_DEPTS.includes(s.department))
      .slice()
      .sort((a, b) => b.salesThisMonth - a.salesThisMonth);
    const fusion = currentVenue === 'fusion';
    const topSales = ranked.length ? ranked[0].salesThisMonth : 1;

    const rows = ranked.map((s, i) => {
      const rank = i + 1;
      const medal = rank <= 3 ? `m${rank}` : 'neutral';
      const numLabel = rank === 1 ? '★' : rank;
      const pct = topSales > 0 ? Math.round(s.salesThisMonth / topSales * 100) : 0;
      let badge;
      if (rank === 1) badge = '<span class="eq-rank-badge gold">🏆 Top du mois</span>';
      else if (rank <= 3) badge = '<span class="eq-rank-badge green">⭐ Excellent</span>';
      else badge = `<span class="eq-rank-badge neutral">${s.voids === 0 ? '0 annulation' : '★ ' + s.rating.toFixed(1)}</span>`;
      return `
        <div class="eq-rank${rank === 1 ? ' r1' : ''}">
          <div class="eq-rank-num ${medal}">${numLabel}</div>
          ${eqAvatar(s, 'md')}
          <div class="eq-rank-body">
            <div class="eq-rank-name">${eqEsc(s.name)} <span class="rr">· ${eqEsc(s.role)}${fusion ? ' · ' + eqEsc(s.venueName) : ''}</span></div>
            <div class="eq-rank-stats"><span class="st">★</span> ${s.rating.toFixed(1)} · ${eqMad(s.salesThisMonth)} CA · ${eqMad(s.tipsThisMonth)} pourboires</div>
            <div class="eq-rank-bar"><div class="eq-rank-bar-fill" data-eqw="${pct}"></div></div>
          </div>
          ${badge}
        </div>`;
    }).join('');

    return `
      <div class="eq-section">
        <div class="eq-section-head"><h3>Classement performance · Salle &amp; Service</h3></div>
        <div class="eq-rank-sub">Basé sur CA généré, pourboires, et évaluations clients ce mois</div>
        <div class="eq-rank-list">${rows || '<div class="eq-clockempty">Aucun poste générateur de revenu pour ce filtre.</div>'}</div>
        <div class="eq-ai">
          <div class="eq-ai-eyebrow">Kiwi AI</div>
          <div class="eq-ai-t">Écart de performance significatif entre serveurs</div>
          <div class="eq-ai-b">Youssef Amrani génère 38 200 MAD de CA ce mois (+30 % vs moyenne équipe), tandis que Hamid Jelloul est à 29 400 MAD (−3 %). L'écart de pourboires est encore plus marqué : 2 840 MAD vs 1 920 MAD.</div>
          <div class="eq-ai-a">→ Une session de formation sur l'upselling avec Hamid, en s'inspirant des pratiques de Youssef, pourrait augmenter son CA de 10–15 %.</div>
        </div>
      </div>`;
  }

  /* ═══════════ INTERACTIONS ═══════════ */

  function eqClockOut(id, btnEl) {
    const s = eqFindStaff(id);
    if (!s || s.status === 'off' || s.status === 'absent') return;
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="kiwi-spinner" style="width:12px;height:12px;"></span>'; }
    const card = document.querySelector(`[data-eq-card="${id}"]`);
    setTimeout(() => {
      s.status = 'off'; s.clockedInAt = null;
      if (!eqSessionOut.some(o => o.id === id)) eqSessionOut.push({ id, name: s.name, type: 'sortie' });
      Kiwi.toast(`${s.name} · sortie pointée`, { type: 'success', desc: 'Heure de fin enregistrée. Récap WhatsApp envoyé.' });
      if (card) card.classList.add('removing');
      setTimeout(() => { if (eqCurrentPage === 'equipe') renderEquipe(); renderSidebarCounts(); }, 220);
    }, 300);
  }
  function eqReportAbsence(id, btnEl) {
    const s = eqFindStaff(id);
    if (!s) return;
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="kiwi-spinner" style="width:12px;height:12px;"></span>'; }
    const card = document.querySelector(`[data-eq-card="${id}"]`);
    setTimeout(() => {
      s.status = 'absent'; s.clockedInAt = null;
      if (!eqSessionOut.some(o => o.id === id)) eqSessionOut.push({ id, name: s.name, type: 'absence' });
      Kiwi.toast(`${s.name} · absence signalée`, { type: 'warn', desc: 'Le gérant a été notifié. Remplacement à prévoir.' });
      if (card) card.classList.add('removing');
      setTimeout(() => { if (eqCurrentPage === 'equipe') renderEquipe(); renderSidebarCounts(); }, 220);
    }, 300);
  }
  function eqGeneratePayslips(el) {
    if (!el || el.disabled) return;
    const orig = el.innerHTML;
    el.disabled = true;
    el.innerHTML = '<span class="kiwi-spinner" style="width:14px;height:14px;border-color:rgba(247,245,240,0.35);border-top-color:#fff;"></span><span>Génération en cours…</span>';
    setTimeout(() => {
      el.disabled = false; el.innerHTML = orig;
      const n = eqScopedStaff().length;
      Kiwi.toast(`${n} fiches de paie générées`, { type: 'success', desc: 'Envoyées par WhatsApp aux gérants' });
    }, 1500);
  }
  function eqOpenRowMenu(el, id) {
    const s = eqFindStaff(id);
    if (!s) return;
    Kiwi.menu(el, [
      { label: 'Pointer la sortie', icon: eqSvg('logout', 16), onClick: () => eqClockOut(id, null) },
      { label: 'Signaler une absence', icon: eqSvg('alert', 16), onClick: () => eqReportAbsence(id, null) },
      { sep: true },
      { label: 'Désactiver le compte', danger: true, icon: eqSvg('ban', 16), onClick: () => Kiwi.toast(`${s.name} · compte désactivé`, { type: 'info', desc: 'Accès PIN révoqué. Réactivable à tout moment.' }) },
    ]);
  }

  /* ═══════════ MODAL · ADD / EDIT STAFF ═══════════ */
  function eqOpenStaffModal(staff) {
    const editing = !!staff;
    const fusion = currentVenue === 'fusion';
    const nameParts = editing ? staff.name.trim().split(/\s+/) : [];
    const firstName = editing ? nameParts[0] : '';
    const lastName = editing ? nameParts.slice(1).join(' ') : '';
    const deptOpts = EQ_DEPT_ORDER.map(d => `<option value="${d}"${editing && staff.department === d ? ' selected' : ''}>${eqDeptLabel(d)}</option>`).join('');
    const venueOpts = [['cafeAtlas', 'Café Atlas'], ['spaBahia', 'Spa Bahia'], ['maisonMansour', 'Maison Mansour']]
      .map(([v, l]) => `<option value="${v}"${editing && staff.venue === v ? ' selected' : ''}>${l}</option>`).join('');

    const m = Kiwi.modal({
      tag: editing ? 'MODIFIER' : 'NOUVEAU MEMBRE',
      title: editing ? 'Modifier le profil' : 'Nouveau membre',
      desc: editing ? 'Mettez à jour les informations de ce membre.' : 'Ajoutez un membre à votre équipe.',
      width: 560,
      body: `
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Prénom</label><input class="kf-input" data-eqf="firstName" value="${eqEsc(firstName)}" placeholder="Prénom"/></div>
          <div class="kf-group"><label class="kf-label">Nom</label><input class="kf-input" data-eqf="lastName" value="${eqEsc(lastName)}" placeholder="Nom"/></div>
        </div>
        <div class="kf-group"><label class="kf-label">Rôle</label><input class="kf-input" data-eqf="role" value="${editing ? eqEsc(staff.role) : ''}" placeholder="Ex. Serveur senior"/></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Département</label><select class="kf-input" data-eqf="department">${deptOpts}</select></div>
          ${fusion ? `<div class="kf-group"><label class="kf-label">Emplacement</label><select class="kf-input" data-eqf="venue">${venueOpts}</select></div>` : ''}
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Taux horaire</label>
            <div class="eq-m-suffix"><input class="kf-input" type="number" data-eqf="hourlyRate" value="${editing ? staff.hourlyRate : ''}" placeholder="0" style="padding-right:96px;"/><span class="sfx">MAD / heure</span></div>
          </div>
          <div class="kf-group"><label class="kf-label">Heures contractuelles</label>
            <div class="eq-m-suffix"><input class="kf-input" type="number" data-eqf="contractHours" value="${editing ? staff.contractHours : '44'}" placeholder="44" style="padding-right:118px;"/><span class="sfx">heures / semaine</span></div>
          </div>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Date de début</label><input class="kf-input" type="date" data-eqf="startDate" value="2026-05-15"/></div>
          <div class="kf-group"><label class="kf-label">Téléphone</label><input class="kf-input" data-eqf="phone" placeholder="+212 6XX XXX XXX"/></div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-eq-cancel>Annuler</button>
        <button class="eq-cta-gradient" data-eq-save>${editing ? 'Enregistrer les modifications' : 'Enregistrer le membre'}</button>
      `,
    });

    const val = k => m.el.querySelector(`[data-eqf="${k}"]`);
    m.el.querySelector('[data-eq-cancel]').onclick = m.close;
    m.el.querySelector('[data-eq-save]').onclick = () => {
      const required = ['firstName', 'lastName', 'role', 'department'];
      let ok = true;
      required.forEach(k => {
        const el = val(k);
        const empty = !el || !String(el.value).trim();
        if (el) el.classList.toggle('eq-invalid', empty);
        if (empty) ok = false;
      });
      if (!ok) { Kiwi.toast('Champs requis manquants', { type: 'warn', desc: 'Prénom, nom, rôle et département sont obligatoires.' }); return; }

      const fn = val('firstName').value.trim();
      const ln = val('lastName').value.trim();
      const dept = val('department').value;
      const venue = fusion && val('venue') ? val('venue').value : (currentVenue === 'fusion' ? 'cafeAtlas' : currentVenue);
      const name = `${fn} ${ln}`;

      if (editing) {
        staff.name = name;
        staff.role = val('role').value.trim();
        staff.department = dept;
        staff.hourlyRate = Number(val('hourlyRate').value) || staff.hourlyRate;
        staff.contractHours = Number(val('contractHours').value) || staff.contractHours;
        staff.avatar = eqInitials(name).toUpperCase();
        m.close();
        Kiwi.toast(`Profil mis à jour · ${name}`, { type: 'success' });
      } else {
        const member = {
          id: 'eqx' + (++eqIdCounter), name, role: val('role').value.trim() || 'Membre',
          department: dept, venue, venueName: (VENUES[venue] || {}).name || venue,
          hourlyRate: Number(val('hourlyRate').value) || 0,
          contractHours: Number(val('contractHours').value) || 44,
          avatar: eqInitials(name).toUpperCase(), status: 'present',
          clockedInAt: '09:00', shiftsThisMonth: 0, hoursThisMonth: 0,
          tipsThisMonth: 0, salesThisMonth: 0, voids: 0, rating: null,
        };
        (STAFF[venue] || STAFF.cafeAtlas).push(member);
        m.close();
        Kiwi.toast(`Membre ajouté · ${name}`, { type: 'success', desc: member.role });
      }
      if (eqCurrentPage === 'equipe') renderEquipe();
      renderSidebarCounts();
    };
    m.el.querySelectorAll('[data-eqf]').forEach(el => el.addEventListener('input', () => el.classList.remove('eq-invalid')));
  }

  /* ═══════════ MODAL · STAFF PROFILE ═══════════ */
  function eqShiftLog(s) {
    const h = eqHash(s.id);
    const days = ['Lun 5', 'Mar 6', 'Mer 7', 'Jeu 8', 'Ven 9', 'Sam 10', 'Dim 11'];
    const startBase = s.venue === 'spaBahia' ? 9 : s.venue === 'maisonMansour' ? 10 : 11;
    return days.map((d, i) => {
      const sh = (h >> i) % 6;
      const inH = startBase + (sh % 2);
      const inM = (h >> (i + 1)) % 60;
      const dur = s.venue === 'spaBahia' ? 9 : s.venue === 'maisonMansour' ? 9 : 12;
      const durM = (h >> (i + 2)) % 50;
      let outH = inH + dur, outM = inM + durM;
      if (outM >= 60) { outM -= 60; outH += 1; }
      const p = n => String(n).padStart(2, '0');
      return `<div class="eq-shiftlog-row"><span class="d">${d} mai</span><span class="h">${p(inH)}:${p(inM)} → ${p(outH % 24)}:${p(outM)}</span><span class="dur">${dur}h${p(durM)}</span></div>`;
    }).join('');
  }
  function eqOpenProfileModal(s) {
    if (!s) return;
    const revenue = EQ_REVENUE_DEPTS.includes(s.department) || s.rating != null;
    const statusTxt = { present: 'En service', off: 'Repos', late: 'En retard', absent: 'Absent' }[s.status] || 'Repos';
    const tiles = [
      ['Shifts travaillés', s.shiftsThisMonth],
      ['Heures travaillées', eqHours(s.hoursThisMonth)],
      ['Salaire estimé', eqMad(eqSalary(s))],
      ['Pourboires', s.tipsThisMonth > 0 ? eqMad(s.tipsThisMonth) : '—'],
    ];
    if (revenue) {
      tiles.push(['CA généré', eqMad(s.salesThisMonth)]);
      tiles.push(['Note moyenne', s.rating != null ? '★ ' + s.rating.toFixed(1) : '—']);
      tiles.push(['Annulations', s.voids]);
    }
    const m = Kiwi.modal({
      tag: 'PROFIL ÉQUIPE',
      title: 'Fiche membre',
      width: 640,
      body: `
        <div class="eq-profile-head">
          ${eqAvatar(s, 'lg')}
          <div class="ph-id">
            <div class="ph-name">${eqEsc(s.name)}</div>
            <div class="ph-role">${eqEsc(s.role)}</div>
            <div class="ph-tags">
              <span class="eq-venue-badge">${eqEsc(s.venueName)}</span>
              <span class="eq-status s-${s.status}"><span class="sd"></span>${statusTxt}</span>
            </div>
          </div>
        </div>
        <div class="eq-profile-grid">
          <div>
            <div class="eq-col-lbl">Ce mois</div>
            <div class="eq-ptiles">
              ${tiles.map(t => `<div class="eq-ptile"><div class="l">${t[0]}</div><div class="v">${t[1]}</div></div>`).join('')}
            </div>
          </div>
          <div>
            <div class="eq-col-lbl">Historique pointages (simulé)</div>
            <div class="eq-shiftlog">${eqShiftLog(s)}</div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-eq-cancel>Fermer</button>
        <button class="kb atlas" data-eq-edit>Modifier le profil</button>
      `,
    });
    m.el.querySelector('[data-eq-cancel]').onclick = m.close;
    m.el.querySelector('[data-eq-edit]').onclick = () => { m.close(); setTimeout(() => eqOpenStaffModal(s), 180); };
  }

  /* ═══════════ MODAL · SHIFT PLANNER ═══════════ */
  const EQ_PLANNER_DAYS = ['Lun 19', 'Mar 20', 'Mer 21', 'Jeu 22', 'Ven 23', 'Sam 24', 'Dim 25'];
  function eqBuildShifts() {
    if (eqShiftData) return eqShiftData;
    eqShiftData = {};
    eqAllStaff().forEach((s) => {
      const base = s.venue === 'spaBahia' ? '09h–20h'
        : s.venue === 'maisonMansour' ? '10h–20h'
        : (eqHash(s.id) % 2 ? '17h–23h' : '11h–23h');
      const rest1 = eqHash(s.id) % 7;
      const rest2 = (eqHash(s.id) + 3) % 7;
      const week = [];
      for (let d = 0; d < 7; d++) week.push((d === rest1 || d === rest2) ? null : base);
      eqShiftData[s.id] = week;
    });
    /* Two deliberate unassigned gaps for the gap-detection alert. */
    if (eqShiftData['ca08']) eqShiftData['ca08'][4] = null;   // Café Atlas · Vendredi
    if (eqShiftData['sp03']) eqShiftData['sp03'][5] = null;   // Spa Bahia · Samedi
    return eqShiftData;
  }
  function eqPlannerStaff() {
    return currentVenue === 'fusion' ? eqAllStaff() : (STAFF[currentVenue] || []);
  }
  function eqPlannerBodyHtml() {
    const data = eqBuildShifts();
    const rows = eqPlannerStaff().map(s => {
      const week = data[s.id] || [];
      const cells = week.map((sh, d) => {
        if (sh) return `<td><div class="eq-shift-pill" data-action="eq-shift-edit" data-arg="${s.id}:${d}">${sh}</div></td>`;
        return `<td><div class="eq-shift-empty" data-action="eq-shift-add" data-arg="${s.id}:${d}">+</div></td>`;
      }).join('');
      return `<tr><td class="pn">${eqEsc(s.name)}<div class="sub">${eqEsc(s.role)}</div></td>${cells}</tr>`;
    }).join('');
    return `
      <table class="eq-planner">
        <thead><tr><th class="pn">Membre</th>${EQ_PLANNER_DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }
  function eqPlannerWeekLabel() {
    const weeks = ['12 au 18 mai 2026', '19 au 25 mai 2026', '26 mai au 1 juin 2026'];
    return 'Semaine du ' + (weeks[((eqPlannerWeek % 3) + 3 + 1) % 3] || weeks[1]);
  }
  function eqOpenPlannerModal() {
    eqPlannerWeek = 0;
    eqBuildShifts();
    const m = Kiwi.modal({
      tag: 'PLANIFICATION',
      title: 'Planification des shifts',
      width: 720,
      body: `
        <div class="eq-planner-head">
          <div style="font-size:13px;font-weight:600;color:var(--ink);" data-eq-week>${eqPlannerWeekLabel()}</div>
          <div class="eq-planner-nav">
            <button data-action="eq-week-prev" aria-label="Semaine précédente">${eqSvg('chevL', 14)}</button>
            <button data-action="eq-week-next" aria-label="Semaine suivante">${eqSvg('chevR', 14)}</button>
          </div>
        </div>
        <div class="eq-planner-wrap" data-eq-planner-body>${eqPlannerBodyHtml()}</div>
        <div class="eq-alert">
          <div class="eq-alert-ico">${eqSvg('alert', 16)}</div>
          <div class="eq-alert-body">
            <div class="eq-alert-t">2 shifts non assignés la semaine prochaine</div>
            <div class="eq-alert-d">Vendredi soir à Café Atlas et Samedi à Spa Bahia. Voulez-vous envoyer un appel aux membres disponibles ?</div>
            <div class="eq-alert-acts">
              <button class="kb atlas" style="padding:7px 14px;font-size:12.5px;" data-action="eq-gap-whatsapp">Envoyer WhatsApp</button>
              <button class="kb ghost" style="padding:7px 14px;font-size:12.5px;" data-action="eq-gap-ignore">Ignorer</button>
            </div>
          </div>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-eq-cancel>Fermer</button>
        <button class="eq-cta-gradient" data-action="eq-publish-plan">Publier le planning</button>
      `,
    });
    eqPlannerModal = m;
    m.el.querySelector('[data-eq-cancel]').onclick = m.close;
    /* Drop the planner ref once the modal is dismissed (button or backdrop). */
    m.el.addEventListener('click', e => {
      if (e.target.closest('[data-eq-cancel]') || e.target.closest('.kiwi-modal-close') || e.target === m.el) eqPlannerModal = null;
    });
  }
  function eqRefreshPlanner() {
    if (!eqPlannerModal) return;
    const body = eqPlannerModal.el.querySelector('[data-eq-planner-body]');
    const wk = eqPlannerModal.el.querySelector('[data-eq-week]');
    if (body) body.innerHTML = eqPlannerBodyHtml();
    if (wk) wk.textContent = eqPlannerWeekLabel();
  }
  function eqShiftSet(arg, isNew) {
    const [id, dStr] = String(arg).split(':');
    const d = Number(dStr);
    const data = eqBuildShifts();
    if (!data[id]) return;
    const s = eqFindStaff(id);
    const def = s && s.venue === 'spaBahia' ? '09h–20h' : s && s.venue === 'maisonMansour' ? '10h–20h' : '11h–23h';
    data[id][d] = def;
    eqRefreshPlanner();
    if (isNew) Kiwi.toast('Shift ajouté', { type: 'success', desc: `${s ? s.name : ''} · ${EQ_PLANNER_DAYS[d]} · ${def}` });
  }
  function eqShiftMenu(el, arg) {
    const [id, dStr] = String(arg).split(':');
    const d = Number(dStr);
    const data = eqBuildShifts();
    const opts = ['11h–23h', '17h–23h', '09h–20h', '10h–20h'];
    Kiwi.menu(el, [
      { head: 'Modifier le shift · ' + (EQ_PLANNER_DAYS[d] || '') },
      ...opts.map(o => ({ label: o, active: data[id] && data[id][d] === o, onClick: () => { if (data[id]) { data[id][d] = o; eqRefreshPlanner(); } } })),
      { sep: true },
      { label: 'Retirer le shift', danger: true, onClick: () => { if (data[id]) { data[id][d] = null; eqRefreshPlanner(); Kiwi.toast('Shift retiré', { type: 'info' }); } } },
    ]);
  }

  /* ═══════════ DEMO CLOCK · live hours tile ═══════════ */
  function eqClockTick() {
    if (eqCurrentPage !== 'equipe') return;
    const el = document.querySelector('[data-eq-hours-live]');
    if (!el) return;
    const st = window.KiwiDemoClock && window.KiwiDemoClock.getSimState && window.KiwiDemoClock.getSimState();
    const range = (window.KiwiDateRange && window.KiwiDateRange.getDateRange && window.KiwiDateRange.getDateRange()) || 'aujourdhui';
    if (st && range === 'aujourdhui') {
      /* Derived live figure: present staff × elapsed hours of the sim day. */
      const present = eqVisibleStaff().filter(s => s.status === 'present').length;
      const elapsed = (st.fraction || 0) * 16;
      el.textContent = `● ${eqFrInt(present * elapsed)} h pointées aujourd'hui · LIVE`;
    } else {
      el.textContent = '';
    }
  }
  if (window.KiwiDemoClock && window.KiwiDemoClock.subscribe) {
    window.KiwiDemoClock.subscribe(() => eqClockTick());
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.KiwiDemoClock && window.KiwiDemoClock.subscribe && window.KiwiDemoClock.subscribe(() => eqClockTick());
    });
  }

  /* Keep the Équipe page in sync when the venue / fusion state changes. */
  subscribe(() => {
    if (eqCurrentPage !== 'equipe') return;
    eqVenueFilter = 'all';
    eqDeptFilter = 'all';
    renderEquipe();
  });

  eqWireHandlers();

  /* ═══════════════════════════════════════════════════════════════════════
   * MENU INTELLIGENCE — 5-tab menu page
   * ─────────────────────────────────────────────────────────────────────
   * Reachable from the sidebar "Menu & modificateurs" item. Tabs:
   * editor · performance (2×2 menu-engineering matrix) · peak hours ·
   * 86 alerts · cross-site comparison (Ultra). Renders into
   * <section class="dash-menu">. In-memory state only — resets on reload.
   * Reuses eqEsc / eqFrInt / eqMad / eqHash from the Équipe module above.
   * ═══════════════════════════════════════════════════════════════════════ */

  /* ── MENU data — single source of truth ───────────────────────────────── */
  const MENU = {
    cafeAtlas: [
      { id: 'ca-e01', name: 'Salade marocaine', category: 'entrees', price: 45, cost: 9, unitsThisMonth: 412, station: 'cuisine-froide', tags: ['vegan'], times: { matin: 0, midi: 280, soir: 132 } },
      { id: 'ca-e02', name: 'Briouates au fromage', category: 'entrees', price: 60, cost: 14, unitsThisMonth: 218, station: 'cuisine-chaude', tags: ['veg'], times: { matin: 0, midi: 140, soir: 78 } },
      { id: 'ca-e03', name: 'Harira', category: 'entrees', price: 35, cost: 6, unitsThisMonth: 386, station: 'cuisine-chaude', tags: ['signature'], times: { matin: 80, midi: 180, soir: 126 } },
      { id: 'ca-e04', name: 'Zaalouk', category: 'entrees', price: 40, cost: 8, unitsThisMonth: 154, station: 'cuisine-froide', tags: ['vegan'], times: { matin: 0, midi: 96, soir: 58 } },
      { id: 'ca-e05', name: 'Taktouka', category: 'entrees', price: 40, cost: 9, unitsThisMonth: 87, station: 'cuisine-froide', tags: ['vegan'], times: { matin: 0, midi: 48, soir: 39 } },
      { id: 'ca-e06', name: 'Soupe du jour', category: 'entrees', price: 35, cost: 7, unitsThisMonth: 64, station: 'cuisine-chaude', tags: [], times: { matin: 0, midi: 38, soir: 26 } },
      { id: 'ca-t01', name: 'Tajine kefta', category: 'tajines', price: 180, cost: 52, unitsThisMonth: 542, station: 'cuisine-chaude', tags: ['signature', 'top'], times: { matin: 0, midi: 312, soir: 230 } },
      { id: 'ca-t02', name: 'Tajine poulet citron', category: 'tajines', price: 150, cost: 44, unitsThisMonth: 318, station: 'cuisine-chaude', tags: [], times: { matin: 0, midi: 184, soir: 134 } },
      { id: 'ca-t03', name: 'Tajine agneau pruneaux', category: 'tajines', price: 220, cost: 78, unitsThisMonth: 142, station: 'cuisine-chaude', tags: ['premium'], times: { matin: 0, midi: 62, soir: 80 } },
      { id: 'ca-t04', name: 'Tajine 4 légumes', category: 'tajines', price: 120, cost: 22, unitsThisMonth: 96, station: 'cuisine-chaude', tags: ['vegan'], times: { matin: 0, midi: 58, soir: 38 } },
      { id: 'ca-t05', name: 'Tajine poisson', category: 'tajines', price: 200, cost: 68, unitsThisMonth: 78, station: 'cuisine-chaude', tags: [], times: { matin: 0, midi: 36, soir: 42 } },
      { id: 'ca-c01', name: 'Couscous royal', category: 'couscous', price: 220, cost: 64, unitsThisMonth: 284, station: 'cuisine-chaude', tags: ['signature'], times: { matin: 0, midi: 168, soir: 116 } },
      { id: 'ca-c02', name: 'Couscous tfaya', category: 'couscous', price: 180, cost: 48, unitsThisMonth: 168, station: 'cuisine-chaude', tags: [], times: { matin: 0, midi: 98, soir: 70 } },
      { id: 'ca-c03', name: 'Couscous légumes', category: 'couscous', price: 140, cost: 26, unitsThisMonth: 72, station: 'cuisine-chaude', tags: ['vegan'], times: { matin: 0, midi: 42, soir: 30 } },
      { id: 'ca-p01', name: 'Pastilla poulet', category: 'pastillas', price: 140, cost: 38, unitsThisMonth: 218, station: 'cuisine-chaude', tags: ['signature'], times: { matin: 0, midi: 124, soir: 94 } },
      { id: 'ca-p02', name: 'Pastilla seafood', category: 'pastillas', price: 180, cost: 62, unitsThisMonth: 124, station: 'cuisine-chaude', tags: ['premium'], times: { matin: 0, midi: 68, soir: 56 } },
      { id: 'ca-p03', name: 'Pastilla pigeon', category: 'pastillas', price: 220, cost: 84, unitsThisMonth: 38, station: 'cuisine-chaude', tags: ['premium'], times: { matin: 0, midi: 14, soir: 24 } },
      { id: 'ca-s01', name: 'Sandwich kefta', category: 'sandwiches', price: 50, cost: 16, unitsThisMonth: 312, station: 'comptoir', tags: [], times: { matin: 84, midi: 168, soir: 60 } },
      { id: 'ca-s02', name: 'Sandwich poulet', category: 'sandwiches', price: 45, cost: 14, unitsThisMonth: 286, station: 'comptoir', tags: [], times: { matin: 76, midi: 152, soir: 58 } },
      { id: 'ca-s03', name: 'Sandwich thon', category: 'sandwiches', price: 40, cost: 12, unitsThisMonth: 198, station: 'comptoir', tags: [], times: { matin: 58, midi: 102, soir: 38 } },
      { id: 'ca-s04', name: 'Bocadillo merguez', category: 'sandwiches', price: 55, cost: 18, unitsThisMonth: 142, station: 'comptoir', tags: [], times: { matin: 32, midi: 78, soir: 32 } },
      { id: 'ca-s05', name: 'Wrap végé', category: 'sandwiches', price: 42, cost: 13, unitsThisMonth: 64, station: 'comptoir', tags: ['vegan'], times: { matin: 18, midi: 32, soir: 14 } },
      { id: 'ca-s06', name: 'Croque-monsieur', category: 'sandwiches', price: 50, cost: 17, unitsThisMonth: 48, station: 'comptoir', tags: [], times: { matin: 14, midi: 22, soir: 12 } },
      { id: 'ca-s07', name: 'Panini fromage', category: 'sandwiches', price: 45, cost: 15, unitsThisMonth: 32, station: 'comptoir', tags: ['veg'], times: { matin: 8, midi: 18, soir: 6 } },
      { id: 'ca-s08', name: 'Hot-dog classique', category: 'sandwiches', price: 38, cost: 14, unitsThisMonth: 18, station: 'comptoir', tags: [], times: { matin: 4, midi: 8, soir: 6 } },
      { id: 'ca-b01', name: 'Thé à la menthe', category: 'boissons', price: 30, cost: 4, unitsThisMonth: 1842, station: 'bar', tags: ['signature', 'top'], times: { matin: 480, midi: 720, soir: 642 } },
      { id: 'ca-b02', name: 'Café noir', category: 'boissons', price: 15, cost: 3, unitsThisMonth: 1684, station: 'bar', tags: ['top'], times: { matin: 820, midi: 460, soir: 404 } },
      { id: 'ca-b03', name: 'Café au lait', category: 'boissons', price: 18, cost: 4, unitsThisMonth: 1218, station: 'bar', tags: ['top'], times: { matin: 642, midi: 320, soir: 256 } },
      { id: 'ca-b04', name: "Jus d'avocat", category: 'boissons', price: 50, cost: 12, unitsThisMonth: 684, station: 'bar-jus', tags: ['signature'], times: { matin: 102, midi: 318, soir: 264 } },
      { id: 'ca-b05', name: 'Jus orange pressé', category: 'boissons', price: 45, cost: 11, unitsThisMonth: 542, station: 'bar-jus', tags: [], times: { matin: 218, midi: 184, soir: 140 } },
      { id: 'ca-b06', name: 'Coca-Cola', category: 'boissons', price: 25, cost: 9, unitsThisMonth: 486, station: 'bar', tags: [], times: { matin: 84, midi: 234, soir: 168 } },
      { id: 'ca-b07', name: 'Eau minérale 50cl', category: 'boissons', price: 15, cost: 4, unitsThisMonth: 824, station: 'bar', tags: [], times: { matin: 142, midi: 412, soir: 270 } },
      { id: 'ca-b08', name: 'Smoothie fruits rouges', category: 'boissons', price: 55, cost: 16, unitsThisMonth: 38, station: 'bar-jus', tags: [], times: { matin: 4, midi: 18, soir: 16 } },
      { id: 'ca-d01', name: 'Crêpe nutella', category: 'desserts', price: 45, cost: 8, unitsThisMonth: 412, station: 'creperie', tags: ['signature'], times: { matin: 64, midi: 168, soir: 180 } },
      { id: 'ca-d02', name: 'Pancakes sirop érable', category: 'desserts', price: 50, cost: 10, unitsThisMonth: 286, station: 'creperie', tags: [], times: { matin: 102, midi: 84, soir: 100 } },
      { id: 'ca-d03', name: 'Tarte du jour', category: 'desserts', price: 40, cost: 9, unitsThisMonth: 168, station: 'patisserie', tags: [], times: { matin: 28, midi: 78, soir: 62 } },
      { id: 'ca-d04', name: 'Crème brûlée', category: 'desserts', price: 45, cost: 11, unitsThisMonth: 124, station: 'patisserie', tags: ['premium'], times: { matin: 8, midi: 42, soir: 74 } },
      { id: 'ca-d05', name: 'Glace 2 boules', category: 'desserts', price: 35, cost: 9, unitsThisMonth: 86, station: 'glacier', tags: [], times: { matin: 14, midi: 38, soir: 34 } },
    ],
    maisonMansour: [
      { id: 'mm-b01', name: 'Thé à la menthe', category: 'boissons', price: 25, cost: 3, unitsThisMonth: 142, station: 'comptoir', tags: ['signature'], times: { matin: 38, midi: 64, soir: 40 } },
      { id: 'mm-b02', name: 'Café espresso', category: 'boissons', price: 18, cost: 3, unitsThisMonth: 98, station: 'comptoir', tags: [], times: { matin: 28, midi: 42, soir: 28 } },
      { id: 'mm-b03', name: 'Eau minérale', category: 'boissons', price: 12, cost: 4, unitsThisMonth: 84, station: 'comptoir', tags: [], times: { matin: 18, midi: 36, soir: 30 } },
    ],
    spaBahia: [
      { id: 'sp-s01', name: 'Hammam traditionnel', category: 'soins', price: 280, cost: 42, unitsThisMonth: 142, station: 'hammam', tags: ['signature', 'top'], times: { matin: 38, midi: 56, soir: 48 } },
      { id: 'sp-s02', name: 'Massage relaxant 60min', category: 'soins', price: 450, cost: 64, unitsThisMonth: 86, station: 'cabine-1', tags: ['signature'], times: { matin: 24, midi: 32, soir: 30 } },
      { id: 'sp-s03', name: 'Soin visage', category: 'soins', price: 380, cost: 58, unitsThisMonth: 64, station: 'cabine-2', tags: [], times: { matin: 18, midi: 24, soir: 22 } },
      { id: 'sp-s04', name: 'Forfait Argan complet', category: 'soins', price: 680, cost: 94, unitsThisMonth: 38, station: 'cabine-1', tags: ['premium'], times: { matin: 8, midi: 14, soir: 16 } },
      { id: 'sp-s05', name: 'Manucure pédicure', category: 'soins', price: 220, cost: 28, unitsThisMonth: 52, station: 'cabine-3', tags: [], times: { matin: 14, midi: 22, soir: 16 } },
      { id: 'sp-s06', name: 'Gommage corps', category: 'soins', price: 250, cost: 32, unitsThisMonth: 42, station: 'hammam', tags: [], times: { matin: 12, midi: 16, soir: 14 } },
    ],
  };

  /* ── Category metadata — existing tokens only ─────────────────────────── */
  const MI_CATS = {
    entrees:    { label: 'Entrées',    color: 'var(--success)',   emoji: '🥗' },
    tajines:    { label: 'Tajines',    color: 'var(--warning)',   emoji: '🍲' },
    couscous:   { label: 'Couscous',   color: 'var(--atlas-600)', emoji: '🍛' },
    pastillas:  { label: 'Pastillas',  color: 'var(--info)',      emoji: '🥧' },
    sandwiches: { label: 'Sandwiches', color: 'var(--riad)',      emoji: '🥪' },
    boissons:   { label: 'Boissons',   color: 'var(--atlas)',     emoji: '🥤' },
    desserts:   { label: 'Desserts',   color: 'var(--danger)',    emoji: '🍮' },
    soins:      { label: 'Soins',      color: 'var(--atlas-700)', emoji: '💆' },
  };
  /* Per-item emoji — keyword match on the item name first, category as fallback.
   * Makes the menu grid scannable at a glance for merchants and investors. */
  const MI_NAME_EMOJI = [
    [/salade|crudit/,'🥗'],[/harira|soupe|bissara|chorba|veloute/,'🍲'],
    [/briouate|brick|cigare/,'🥟'],[/zaalouk|taktouka|aubergine|caviar/,'🍆'],
    [/tajine/,'🍲'],[/couscous|seffa/,'🍛'],[/pastilla|bastilla/,'🥧'],
    [/sandwich|panini|wrap/,'🥪'],[/burger/,'🍔'],[/pizza/,'🍕'],
    [/p[âa]tes|pasta|spaghetti|lasagne/,'🍝'],[/frites/,'🍟'],
    [/poulet|chicken|dinde/,'🍗'],[/poisson|thon|seafood|crevette|fruits de mer|calamar/,'🐟'],
    [/kefta|viande|b[œo]euf|agneau|merguez|brochette/,'🥩'],[/pigeon|caille/,'🍗'],
    [/[œo]euf|omelette/,'🍳'],[/salade de fruits|fruit/,'🍓'],
    [/cr[êe]pe|msemen|baghrir|gaufre/,'🥞'],[/pain|khobz|batbout/,'🍞'],
    [/th[ée]\b|menthe/,'🍵'],[/caf[ée]|express?o|cappucc/,'☕'],
    [/jus|press[ée]e|citronnade/,'🧃'],[/smoothie|milkshake|lait/,'🥤'],
    [/eau|water/,'💧'],[/soda|cola|limonade/,'🥤'],
    [/g[âa]teau|cake|tarte|fondant/,'🍰'],[/glace|sorbet|ice/,'🍨'],
    [/chocolat/,'🍫'],[/cookie|biscuit|sabl[ée]/,'🍪'],
    [/cr[èe]me|flan|panna/,'🍮'],[/miel|p[âa]tisserie|corne|gazelle|chebakia/,'🍯'],
    [/massage|gommage|hammam|soin|gommag|enveloppement|modelage/,'💆'],
    [/manucure|p[ée]dicure|ongle/,'💅'],[/coiffure|brushing|coupe/,'💇'],
  ];
  function miItemEmoji(it) {
    const n = (it && it.name ? it.name : '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const [re, em] of MI_NAME_EMOJI) if (re.test(n)) return em;
    return (MI_CATS[it && it.category] || {}).emoji || '🍽️';
  }
  const MI_CAT_ORDER = ['entrees','tajines','couscous','pastillas','sandwiches','boissons','desserts','soins'];
  const MI_TAGS = ['signature','top','premium','vegan','veg'];
  const MI_TAG_LABEL = { signature:'Signature', top:'Top', premium:'Premium', vegan:'Vegan', veg:'Végé' };
  const MI_STATIONS_ALL = ['cuisine-chaude','cuisine-froide','comptoir','bar','bar-jus','creperie','patisserie','glacier','hammam','cabine-1','cabine-2','cabine-3'];
  const MI_STATION_STATE = {
    'cuisine-chaude': { dot: 'busy',    meta: '142 tickets aujourd\'hui' },
    'cuisine-froide': { dot: 'on',      meta: 'Opérationnelle' },
    'comptoir':       { dot: 'on',      meta: 'Opérationnelle' },
    'bar':            { dot: 'on',      meta: 'Opérationnelle' },
    'bar-jus':        { dot: 'on',      meta: 'Opérationnelle' },
    'creperie':       { dot: 'pending', meta: '1 modificateur en attente' },
    'patisserie':     { dot: 'on',      meta: 'Opérationnelle' },
    'glacier':        { dot: 'off',     meta: 'Station fermée' },
  };
  const MI_MODIFIERS = [
    { name: 'Sans glace', cat: 'boissons', price: 0, demand: 142 },
    { name: 'Supplément frites', cat: 'sandwiches', price: 15, demand: 86 },
    { name: 'Pain sans gluten', cat: 'sandwiches', price: 8, demand: 24 },
    { name: "Lait d'amande", cat: 'boissons', price: 5, demand: 38 },
    { name: 'Cuisson : saignant / à point / bien cuit', cat: 'tajines', price: 0, demand: null, note: '3 options' },
    { name: 'Allergies : noix, gluten, lactose', cat: 'tous', price: 0, demand: null, note: 'notes' },
  ];
  const MI_86_FREQ = [
    { name: 'Tajine agneau pruneaux', count: 8, reason: 'rupture viande ×5, rupture épices ×3' },
    { name: 'Pastilla seafood', count: 6, reason: 'rupture poisson' },
    { name: 'Couscous légumes', count: 4, reason: 'rupture courgette ×2, navet ×2' },
    { name: 'Forfait Argan complet', count: 4, reason: 'planning praticienne' },
    { name: 'Smoothie fruits rouges', count: 3, reason: 'rupture fruits' },
  ];
  const MI_QUAD = {
    star:   { icon: '★',  label: 'Stars',      tag: 'Promouvoir' },
    plow:   { icon: '🐴', label: 'Plowhorses', tag: 'Optimiser' },
    puzzle: { icon: '❓', label: 'Puzzles',    tag: 'Repositionner' },
    dog:    { icon: '🐕', label: 'Dogs',       tag: 'Retirer' },
  };
  const MI_PERIODS = { matin: 'Matin (08h-11h)', midi: 'Midi (11h-15h)', soir: 'Soir (19h-23h)' };

  /* ── SVG icons ────────────────────────────────────────────────────────── */
  const MI_IC = {
    menu:     '<path d="M3 12h18M3 6h18M3 18h18"/>',
    trending: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    alert:    '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    compare:  '<path d="M7 4v16M7 4l-4 4M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    grid:     '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list:     '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    edit:     '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    copy:     '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    trash:    '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload:   '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    chev:     '<path d="M9 18l6-6-6-6"/>',
    info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    sort:     '<path d="M3 6h12M3 12h9M3 18h6M17 8V20M17 20l4-4M17 20l-4-4"/>',
  };
  const miSvg = (k, sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MI_IC[k] || ''}</svg>`;

  /* ── State (in-memory; resets on reload) ──────────────────────────────── */
  let miTab = 'menu';            // menu | perf | hours | alerts | compare
  let miVenueFilter = 'cafeAtlas';
  let miSearch = '';
  let miCatFilter = 'all';
  let miView = 'grid';
  let miPeriod = 'midi';
  let miModsCollapsed = false;
  let miIdCounter = 0;
  /* Session-mutable station lists per venue (add/remove stations) and any
   * subsections created during the session. Lazy-initialised, reset on reload. */
  let miStations = {};
  let miCustomCats = [];
  const MI_CUSTOM_COLORS = ['var(--info)', 'var(--warning)', 'var(--atlas-600)', 'var(--riad)', 'var(--success)'];
  let mi86 = [
    { id: 'ca-t03', time: '12:45', by: 'Mohammed K. (cuisine)', reason: 'Rupture matière première · agneau', terminals: 6 },
    { id: 'ca-p02', time: '14:20', by: 'Youssef B. (cuisine)', reason: 'Rupture poisson frais', terminals: 6 },
    { id: 'sp-s04', time: '11:30', by: 'Karima I. (spa)', reason: 'Praticienne indisponible jusqu\'à 16h', terminals: 4 },
  ];

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function miMenuVenue() {
    if (currentVenue === 'fusion') return (miVenueFilter && miVenueFilter !== 'all') ? miVenueFilter : 'cafeAtlas';
    return REAL_VENUES.includes(currentVenue) ? currentVenue : 'cafeAtlas';
  }
  function miItems(venue) { return MENU[venue || miMenuVenue()] || []; }
  function miFindItem(id) {
    for (const v of REAL_VENUES) { const it = (MENU[v] || []).find(x => x.id === id); if (it) return it; }
    return null;
  }
  function miRevenue(it) { return it.price * it.unitsThisMonth; }
  function miMarginVal(it) { return it.price - it.cost; }
  function miMarginPct(it) { return it.price > 0 ? (it.price - it.cost) / it.price * 100 : 0; }
  function miCustomCat(id) { return miCustomCats.find(c => c.id === id); }
  function miCatColor(c) { const x = MI_CATS[c] || miCustomCat(c); return x ? x.color : 'var(--n-400)'; }
  function miCatLabel(c) { const x = MI_CATS[c] || miCustomCat(c); return x ? x.label : c; }
  /* Ordered category ids for a venue — base categories present in the menu,
   * then any session-created subsections. */
  function miVenueCats(venue) {
    venue = venue || miMenuVenue();
    const base = MI_CAT_ORDER.filter(c => (MENU[venue] || []).some(i => i.category === c));
    const custom = miCustomCats.filter(c => c.venue === venue).map(c => c.id);
    return [...base, ...custom];
  }
  /* Session-mutable station list for a venue (lazy-init from the menu). */
  function miGetStations(venue) {
    venue = venue || miMenuVenue();
    if (!miStations[venue]) miStations[venue] = [...new Set((MENU[venue] || []).map(i => i.station))];
    return miStations[venue];
  }
  function miStationState(s) { return MI_STATION_STATE[s] || { dot: 'on', meta: 'Opérationnelle' }; }
  function miMedian(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  /* Menu-engineering classifier — median units × median unit-margin. */
  function miClassify(venue) {
    const items = miItems(venue);
    const medUnits = miMedian(items.map(i => i.unitsThisMonth));
    const medMargin = miMedian(items.map(miMarginVal));
    const of = it => {
      const popular = it.unitsThisMonth >= medUnits;
      const profitable = miMarginVal(it) >= medMargin;
      return popular && profitable ? 'star' : popular ? 'plow' : profitable ? 'puzzle' : 'dog';
    };
    return { medUnits, medMargin, of };
  }
  function miMarginClass(pct) { return pct > 65 ? 'hi' : pct >= 50 ? 'mid' : 'lo'; }
  function miAnimateBars(root) {
    root.querySelectorAll('[data-miw]').forEach(el => {
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = el.dataset.miw + '%'; }));
    });
  }

  /* ═══════════ NAVIGATION ═══════════ */
  function miShowPage() {
    miTab = 'menu';
    /* Clear any sibling full-page view so two page-* classes never coexist;
     * also reset the Équipe module's page flag so its clock/venue
     * subscribers don't keep re-rendering a now-hidden section. */
    eqCurrentPage = 'dashboard';
    document.body.classList.remove('page-equipe', 'page-payroll');
    document.body.classList.add('page-menu');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Menu &amp; modificateurs</b>';
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    document.querySelector('.sidebar nav a[data-nav="menu"]')?.classList.add('active');
    window.scrollTo({ top: 0 });
    renderMenu();
  }
  function miShowDashboard() {
    if (!document.body.classList.contains('page-menu')) return;
    document.body.classList.remove('page-menu');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Tableau de bord</b>';
  }
  function miWireHandlers() {
    const H = window.Kiwi && window.Kiwi.handlers;
    if (!H) { setTimeout(miWireHandlers, 30); return; }
    H['nav-menu'] = () => miShowPage();
    const origAccueil = H['nav-accueil'];
    H['nav-accueil'] = function () {
      try { if (origAccueil) origAccueil.apply(this, arguments); } catch (_) {}
      miShowDashboard();
    };
    H['mi-tab'] = (el) => {
      const t = el.dataset.tab;
      if (t === 'compare' && currentVenue !== 'fusion') {
        Kiwi.toast('Comparaison multi-sites', { type: 'info', desc: 'Activez Go Ultra pour comparer vos 3 établissements.' });
        return;
      }
      miTab = t; renderMenu();
    };
    H['mi-venue-filter'] = (el) => { miVenueFilter = el.dataset.venue || 'cafeAtlas'; miCatFilter = 'all'; miSearch = ''; renderMenu(); };
    H['mi-cat-filter']   = (el) => { miCatFilter = el.dataset.cat || 'all'; miRenderTab1Body(); };
    H['mi-view']         = (el) => { miView = el.dataset.view || 'grid'; miRenderTab1Body(); };
    H['mi-period']       = (el) => { miPeriod = el.dataset.period || 'midi'; renderMenu(); };
    H['mi-add-item']     = () => miOpenItemModal(null);
    H['mi-edit-item']    = (_el, id) => miOpenItemModal(miFindItem(id));
    H['mi-dup-item']     = (_el, id) => miDuplicateItem(id);
    H['mi-del-item']     = (_el, id) => miDeleteItem(id);
    H['mi-import']       = () => Kiwi.toast('Import lancé', { type: 'info', desc: '38 articles détectés' });
    H['mi-export']       = () => Kiwi.toast('Menu exporté', { type: 'success', desc: 'PDF + Excel générés' });
    H['mi-sort']         = (el) => Kiwi.menu(el, [
      { head: 'Trier par' },
      { label: 'Popularité', active: true, onClick: () => {} },
      { label: 'Marge', onClick: () => {} },
      { label: 'Prix', onClick: () => {} },
      { label: 'Nom (A→Z)', onClick: () => {} },
    ]);
    H['mi-mods-toggle']  = () => { miModsCollapsed = !miModsCollapsed; const c = document.querySelector('[data-mi-mods]'); if (c) c.classList.toggle('collapsed', miModsCollapsed); };
    H['mi-add-mod']      = () => miOpenModifierModal();
    H['mi-station']      = (_el, id) => Kiwi.toast(`Configuration de la station ${id}`, { type: 'info', desc: 'Routage, imprimante, écran KDS.' });
    H['mi-add-station']  = () => miOpenAddStationModal();
    H['mi-remove-station'] = (_el, id) => miRemoveStation(id);
    H['mi-reroute-item'] = (el, id) => miRerouteItem(id, el);
    H['mi-add-sub']      = () => miOpenAddSubModal();
    H['mi-reroute-sub']  = (el, cat) => miRerouteSub(cat, el);
    H['mi-howto']        = () => miOpenHowtoModal();
    H['mi-matrix-dot']   = (_el, id) => miOpenItemModal(miFindItem(id));
    H['mi-quad-action']  = (el) => miQuadAction(el.dataset.quad);
    H['mi-86-mark']      = () => miOpenMark86Modal();
    H['mi-86-reactivate']= (_el, id) => miReactivate86(id);
    H['mi-86-history']   = (_el, name) => miOpen86History(name);
    H['mi-combo-toast']  = (_el, msg) => Kiwi.toast(msg || 'Action enregistrée', { type: 'success' });
  }

  /* ═══════════ RENDER ═══════════ */
  function renderMenu() {
    const root = document.querySelector('[data-menu-root]');
    if (!root) return;
    root.innerHTML = miHeaderHtml() + miFiltersHtml() + `<div class="mi-panel" data-mi-panel>${miTabHtml()}</div>`;
    miAnimateBars(root);
  }
  /* Re-render only the active tab panel (filter/search/view changes). */
  function miRenderTab1Body() {
    const panel = document.querySelector('[data-mi-panel]');
    if (!panel) return;
    panel.innerHTML = miTabHtml();
    miAnimateBars(panel);
  }

  function miHeaderHtml() {
    const venue = miMenuVenue();
    const items = miItems(venue);
    const catCount = miVenueCats(venue).length;
    return `
      <div class="mi-head">
        <div>
          <div class="mi-title">Menu &amp; modificateurs</div>
          <div class="mi-sub">${items.length} articles · ${catCount} sous-section${catCount > 1 ? 's' : ''} · ${eqEsc((VENUES[venue] || {}).name || '')}</div>
        </div>
        <div class="mi-head-acts">
          <button class="btn-slim" data-action="mi-import">${miSvg('upload', 13)}<span>Importer Excel</span></button>
          <button class="btn-slim" data-action="mi-export">${miSvg('download', 13)}<span>Exporter le menu</span></button>
        </div>
      </div>`;
  }

  function miFiltersHtml() {
    let venueRow = '';
    if (currentVenue === 'fusion') {
      const vs = [['cafeAtlas', 'Café Atlas'], ['spaBahia', 'Spa Bahia'], ['maisonMansour', 'Maison Mansour']];
      venueRow = '<div class="mi-pill-row">' + vs.map(([id, l]) =>
        `<button class="mi-pill${miMenuVenue() === id ? ' on' : ''}" data-action="mi-venue-filter" data-venue="${id}">${l}</button>`
      ).join('') + '</div>';
    }
    const active86 = mi86.length;
    const tabs = [
      ['menu', 'Menu & modificateurs', 'menu'],
      ['perf', 'Performance', 'trending'],
      ['hours', 'Heures de pointe', 'clock'],
      ['alerts', 'Alertes 86', 'alert'],
      ['compare', 'Comparaison sites', 'compare'],
    ];
    const tabRow = '<div class="mi-pill-row">' + tabs.map(([id, label, ic]) => {
      const on = miTab === id;
      let extra = '';
      if (id === 'alerts' && active86 > 0) extra = `<span class="mi-tab-badge">${active86}</span>`;
      if (id === 'compare') extra = '<span class="mi-ultra-pill">✦ ULTRA</span>';
      return `<button class="mi-pill${on ? ' on' : ''}" data-action="mi-tab" data-tab="${id}">${miSvg(ic, 14)}<span>${label}</span>${extra}</button>`;
    }).join('') + '</div>';
    return `<div class="mi-filters">${venueRow}${tabRow}</div>`;
  }

  function miTabHtml() {
    switch (miTab) {
      case 'perf':    return miTab2Html();
      case 'hours':   return miTab3Html();
      case 'alerts':  return miTab4Html();
      case 'compare': return miTab5Html();
      default:        return miTab1Html();
    }
  }

  /* ── TAB 1 · Menu editor ──────────────────────────────────────────────── */
  function miTagPills(tags) {
    return (tags || []).map(t => `<span class="mi-tag ${t}">${MI_TAG_LABEL[t] || t}</span>`).join('');
  }
  function miItemCard(it) {
    const pct = miMarginPct(it);
    return `
      <div class="mi-card" data-mi-card="${it.id}" data-action="mi-edit-item" data-arg="${it.id}">
        <div class="mi-card-top">
          <span class="mi-card-cat">${(MI_CATS[it.category]||{}).emoji||''} ${miCatLabel(it.category)}</span>
          <span class="mi-tags">${miTagPills(it.tags)}</span>
        </div>
        <div class="mi-card-name"><span class="mi-card-emoji" aria-hidden="true">${miItemEmoji(it)}</span>${eqEsc(it.name)}</div>
        <div class="mi-card-price-row">
          <span class="mi-card-price">${eqFrInt(it.price)}</span>
          <button type="button" class="mi-card-station" data-action="mi-reroute-item" data-arg="${it.id}" aria-label="Rerouter vers une station">→ ${eqEsc(it.station)}</button>
        </div>
        <div class="mi-card-foot">
          <span class="mi-card-units">${eqFrInt(it.unitsThisMonth)} vendus</span>
          <span class="mi-card-margin ${miMarginClass(pct)}">${Math.round(pct)} %</span>
          <span class="mi-card-acts">
            <button class="mi-ic-btn" data-action="mi-edit-item" data-arg="${it.id}" aria-label="Modifier">${miSvg('edit', 13)}</button>
            <button class="mi-ic-btn" data-action="mi-dup-item" data-arg="${it.id}" aria-label="Dupliquer">${miSvg('copy', 13)}</button>
            <button class="mi-ic-btn danger" data-action="mi-del-item" data-arg="${it.id}" aria-label="Supprimer">${miSvg('trash', 13)}</button>
          </span>
        </div>
      </div>`;
  }
  function miFilteredItems() {
    let list = miItems();
    if (miCatFilter !== 'all') list = list.filter(i => i.category === miCatFilter);
    const q = miSearch.trim().toLowerCase();
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q));
    return list;
  }
  /* Subsection action bar — shown when one subsection is selected, hosts the
   * "reroute the whole subsection" control. */
  function miSubbarHtml() {
    if (miCatFilter === 'all') return '';
    const venue = miMenuVenue();
    const inSub = miItems(venue).filter(i => i.category === miCatFilter);
    const stations = [...new Set(inSub.map(i => i.station))];
    const routing = inSub.length === 0 ? 'sous-section vide'
      : stations.length === 1 ? 'routée vers ' + stations[0]
      : 'stations multiples (' + stations.length + ')';
    return `
      <div class="mi-subbar">
        <div class="mi-subbar-info">Sous-section <b>${eqEsc(miCatLabel(miCatFilter))}</b> · ${inSub.length} article${inSub.length > 1 ? 's' : ''} · ${routing}</div>
        <button class="btn-slim" data-action="mi-reroute-sub" data-arg="${miCatFilter}">${miSvg('compare', 13)}<span>Rerouter la sous-section</span></button>
      </div>`;
  }
  function miTab1Html() {
    const venue = miMenuVenue();
    const allItems = miItems(venue);
    const cats = miVenueCats(venue);
    const list = miFilteredItems();

    /* Subsection filter pills + the add-actions, on one bar — actions sit
     * with the subsections they create rather than up in the page header. */
    const catBar = `
      <div class="mi-cat-bar">
        <div class="mi-pill-row mi-cat-pills">
          <button class="mi-pill${miCatFilter === 'all' ? ' on' : ''}" data-action="mi-cat-filter" data-cat="all">Tous</button>
          ${cats.map(c => `<button class="mi-pill${miCatFilter === c ? ' on' : ''}" data-action="mi-cat-filter" data-cat="${c}">${(MI_CATS[c]||{}).emoji||''} ${miCatLabel(c)}</button>`).join('')}
        </div>
        <div class="mi-cat-bar-acts">
          <button class="btn-slim" data-action="mi-add-sub">${miSvg('plus', 13)}<span>Sous-section</span></button>
          <button class="btn-slim primary" data-action="mi-add-item">${miSvg('plus', 13)}<span>Nouvel article</span></button>
        </div>
      </div>`;

    const emptyMsg = (miCatFilter !== 'all' && !miSearch.trim())
      ? 'Sous-section vide — ajoutez un article avec « Nouvel article ».'
      : 'Aucun article pour cette recherche.';
    const body = list.length
      ? (miView === 'grid'
        ? `<div class="mi-grid">${list.map(miItemCard).join('')}</div>`
        : miListHtml(list))
      : `<div style="text-align:center;color:var(--n-500);padding:36px;font-size:13px;">${emptyMsg}</div>`;

    /* Modifiers */
    const modRows = MI_MODIFIERS.map(m => `
      <tr>
        <td><b style="font-weight:600;">${eqEsc(m.name)}</b></td>
        <td><span class="mi-mod-cat">${m.cat}</span></td>
        <td class="mq">${m.price > 0 ? '+ ' + m.price + ' MAD' : (m.note === 'notes' ? 'sans frais' : '0 MAD')}</td>
        <td class="mq">${m.demand != null ? eqFrInt(m.demand) + ' demandes/mois' : (m.note || '—')}</td>
      </tr>`).join('');

    /* Stations — session-mutable list (add / remove) */
    const stationIds = miGetStations(venue);
    const connected = stationIds.filter(s => miStationState(s).dot !== 'off').length;
    const stationCards = stationIds.map(s => {
      const st = miStationState(s);
      const routed = allItems.filter(i => i.station === s).length;
      return `
        <div class="mi-station" data-action="mi-station" data-arg="${s}">
          <button type="button" class="mi-station-x" data-action="mi-remove-station" data-arg="${s}" aria-label="Retirer la station">${miSvg('plus', 11)}</button>
          <div class="mi-station-top"><span class="mi-st-dot ${st.dot}"></span><span class="mi-station-name">${eqEsc(s)}</span></div>
          <div class="mi-station-meta">${eqEsc(st.meta)} · ${routed} article${routed > 1 ? 's' : ''}</div>
        </div>`;
    }).join('');

    return `
      <div class="mi-section">
        <div class="mi-toolbar">
          <div class="mi-search">${miSvg('search', 16)}<input type="text" placeholder="Rechercher un article…" data-mi-search value="${eqEsc(miSearch)}"/></div>
          <button class="mi-sortbtn" data-action="mi-sort">${miSvg('sort', 13)}<span>Trier par : Popularité</span></button>
          <div class="mi-view-toggle">
            <button class="mi-view-btn${miView === 'grid' ? ' on' : ''}" data-action="mi-view" data-view="grid">${miSvg('grid', 13)}Grille</button>
            <button class="mi-view-btn${miView === 'list' ? ' on' : ''}" data-action="mi-view" data-view="list">${miSvg('list', 13)}Liste</button>
          </div>
        </div>
        ${catBar}
        ${miSubbarHtml()}
        ${body}
      </div>

      <div class="mi-section mi-collapse${miModsCollapsed ? ' collapsed' : ''}" data-mi-mods>
        <div class="mi-section-head">
          <div class="mi-collapse-head" data-action="mi-mods-toggle">
            <span class="chev">${miSvg('chev', 15)}</span><h3>Modificateurs &amp; options</h3>
          </div>
        </div>
        <div class="mi-collapse-body">
          <table class="mi-mods-table"><tbody>${modRows}</tbody></table>
          <button class="btn-slim" style="margin-top:14px;" data-action="mi-add-mod">${miSvg('plus', 13)}<span>Nouveau modificateur</span></button>
        </div>
      </div>

      <div class="mi-section">
        <div class="mi-section-head">
          <h3>Routage cuisine</h3>
          <button class="btn-slim" data-action="mi-add-station">${miSvg('plus', 13)}<span>Ajouter une station</span></button>
        </div>
        <div class="mi-section-sub">Routage actif : ${connected} stations connectées sur ${stationIds.length}</div>
        <div class="mi-stations">${stationCards}</div>
      </div>`;
  }
  function miListHtml(list) {
    const rows = list.map(it => {
      const pct = miMarginPct(it);
      return `
        <tr data-mi-card="${it.id}" data-action="mi-edit-item" data-arg="${it.id}">
          <td><b style="font-weight:600;"><span class="mi-card-emoji" aria-hidden="true">${miItemEmoji(it)}</span>${eqEsc(it.name)}</b></td>
          <td>${(MI_CATS[it.category]||{}).emoji||''} ${miCatLabel(it.category)}</td>
          <td class="mono">${eqFrInt(it.price)} MAD</td>
          <td class="mono">${eqFrInt(it.cost)} MAD</td>
          <td><span class="mi-card-margin ${miMarginClass(pct)}">${Math.round(pct)} %</span></td>
          <td class="mono">${eqFrInt(it.unitsThisMonth)}</td>
          <td><button type="button" class="mi-card-station" data-action="mi-reroute-item" data-arg="${it.id}">→ ${eqEsc(it.station)}</button></td>
          <td>${miTagPills(it.tags) || '<span style="color:var(--n-300);">—</span>'}</td>
          <td>
            <span class="mi-card-acts">
              <button class="mi-ic-btn" data-action="mi-edit-item" data-arg="${it.id}" aria-label="Modifier">${miSvg('edit', 13)}</button>
              <button class="mi-ic-btn" data-action="mi-dup-item" data-arg="${it.id}" aria-label="Dupliquer">${miSvg('copy', 13)}</button>
              <button class="mi-ic-btn danger" data-action="mi-del-item" data-arg="${it.id}" aria-label="Supprimer">${miSvg('trash', 13)}</button>
            </span>
          </td>
        </tr>`;
    }).join('');
    return `<div class="mi-list-wrap"><table class="mi-list">
      <thead><tr><th>Article</th><th>Catégorie</th><th>Prix</th><th>Coût</th><th>Marge</th><th>Unités / mois</th><th>Station</th><th>Tags</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  /* ── TAB 2 · Performance matrix ───────────────────────────────────────── */
  function miTab2Html() {
    const venue = miMenuVenue();
    const items = miItems(venue);
    const totalRev = items.reduce((a, i) => a + miRevenue(i), 0);
    const cls = miClassify(venue);
    const buckets = { star: [], plow: [], puzzle: [], dog: [] };
    items.forEach(i => buckets[cls.of(i)].push(i));

    const qcard = (q, metricHtml, btnLabel, btnCls) => {
      const list = buckets[q].slice().sort((a, b) => miRevenue(b) - miRevenue(a));
      const top3 = list.slice(0, 3).map(i => i.name).join(' · ') || '—';
      return `
        <div class="mi-qcard ${q}">
          <div class="mi-qcard-h">${MI_QUAD[q].icon} ${MI_QUAD[q].label.toUpperCase()}</div>
          <div class="mi-qcard-count">${list.length} article${list.length > 1 ? 's' : ''}</div>
          <div class="mi-qcard-top3"><span class="l">Top 3</span><br>${eqEsc(top3)}</div>
          <div class="mi-qcard-metric">${metricHtml}</div>
          <button class="mi-qcard-btn ${btnCls || ''}" data-action="mi-quad-action" data-quad="${q}">${btnLabel}</button>
        </div>`;
    };
    const starRev = buckets.star.reduce((a, i) => a + miRevenue(i), 0);
    const starShare = totalRev > 0 ? Math.round(starRev / totalRev * 100) : 0;
    const plowAvgMargin = buckets.plow.length ? Math.round(buckets.plow.reduce((a, i) => a + miMarginPct(i), 0) / buckets.plow.length) : 0;
    const puzzlePotential = buckets.puzzle.reduce((a, i) => a + miMarginVal(i) * i.unitsThisMonth, 0);
    const dogCost = buckets.dog.reduce((a, i) => a + miMarginVal(i) * Math.round(i.unitsThisMonth * 0.4), 0);

    return `
      <div class="mi-section">
        <div class="mi-section-head">
          <h3>Performance des articles · Mai 2026</h3>
          <span class="mi-howto" data-action="mi-howto">ⓘ Comment ça marche ?</span>
        </div>
        <div class="mi-section-sub">Analyse de menu · ${items.length} articles · CA total : ${eqMad(totalRev)}</div>
        ${miMatrixHtml(venue)}
      </div>
      <div class="mi-quad-cards">
        ${qcard('star', `Contribution CA : <b style="color:var(--ink);">${starShare} %</b>`, 'Promouvoir sur menu du jour')}
        ${qcard('plow', `Marge moyenne : <b style="color:var(--ink);">${plowAvgMargin} %</b>`, 'Réviser les prix')}
        ${qcard('puzzle', `Potentiel CA : <b style="color:var(--ink);">+${eqMad(puzzlePotential)}</b>/mois si volume doublé`, 'Repositionner sur menu')}
        ${qcard('dog', `Coût d'opportunité : <b style="color:var(--danger);">-${eqMad(dogCost)}</b>/mois`, 'Retirer du menu', 'danger')}
      </div>
      <div class="mi-ai warn">
        <div class="mi-ai-eyebrow">Kiwi AI · Action prioritaire</div>
        <div class="mi-ai-t">Retirez ces 3 articles immédiatement</div>
        <div class="mi-ai-b">Bocadillo merguez (142 unités, marge 67 %), Hot-dog classique (18 unités, marge 63 %), et Smoothie fruits rouges (38 unités, marge 71 %) appartiennent au quadrant DOGS. Ils représentent 198 unités ce mois pour seulement 9 800 MAD de CA — soit 1,2 % du CA total — mais occupent 8 % de votre menu et ralentissent la prise de commande.</div>
        <div class="mi-ai-a">→ Les retirer libérerait 2 emplacements pour des Stars potentielles. Économie de complexité menu : ~4 200 MAD/mois en gain de vitesse de service.</div>
      </div>
      <div class="mi-ai">
        <div class="mi-ai-eyebrow">Kiwi AI · Opportunité pricing</div>
        <div class="mi-ai-t">Augmentez le prix du Tajine kefta</div>
        <div class="mi-ai-b">Le Tajine kefta est votre #1 — 542 unités ce mois, marge unitaire 128 MAD, contribution CA : 12 % du total. Sa popularité dépasse la médiane de 3,2× mais son prix n'a pas évolué depuis 18 mois. Les clients sont insensibles au prix sur leur plat préféré.</div>
        <div class="mi-ai-a">→ Passer de 180 à 195 MAD (+8 %) générerait ~8 130 MAD/mois additionnels avec un risque de perte estimé à &lt;3 % des unités.</div>
      </div>`;
  }
  function miMatrixHtml(venue) {
    const items = miItems(venue);
    const cls = miClassify(venue);
    const maxU = Math.max(...items.map(i => i.unitsThisMonth), 1);
    const maxM = Math.max(...items.map(miMarginVal), 1);
    const maxR = Math.max(...items.map(miRevenue), 1);
    const sx = v => Math.sqrt(Math.max(0, v) / maxU) * 100;   // sqrt scale spreads the skewed data
    const sy = v => Math.sqrt(Math.max(0, v) / maxM) * 100;
    const dots = items.map((it, i) => {
      const q = cls.of(it);
      const size = (9 + Math.sqrt(miRevenue(it) / maxR) * 21).toFixed(1);
      return `<button class="mi-dot ${q}" style="left:${sx(it.unitsThisMonth).toFixed(2)}%;bottom:${sy(miMarginVal(it)).toFixed(2)}%;width:${size}px;height:${size}px;animation-delay:${i * 26}ms" data-action="mi-matrix-dot" data-arg="${it.id}" aria-label="${eqEsc(it.name)}">
        <span class="mi-dot-tip"><b>${eqEsc(it.name)}</b><br>${eqFrInt(it.unitsThisMonth)} unités · marge ${Math.round(miMarginPct(it))} %<br>CA ${eqMad(miRevenue(it))} · ${MI_QUAD[q].label}</span>
      </button>`;
    }).join('');
    return `
      <div class="mi-matrix">
        <span class="mi-axis-y">Marge unitaire (MAD) →</span>
        <div class="mi-matrix-plot">
          <div class="mi-median-v" style="left:${sx(cls.medUnits).toFixed(2)}%"></div>
          <div class="mi-median-h" style="bottom:${sy(cls.medMargin).toFixed(2)}%"></div>
          <div class="mi-quad-label star">★ STARS<span class="qls">Promouvoir</span></div>
          <div class="mi-quad-label puzzle">❓ PUZZLES<span class="qls">Repositionner</span></div>
          <div class="mi-quad-label plow">🐴 PLOWHORSES<span class="qls">Optimiser la marge</span></div>
          <div class="mi-quad-label dog">🐕 DOGS<span class="qls">Retirer</span></div>
          ${dots}
        </div>
        <div class="mi-axis-x">Popularité — ventes mensuelles →</div>
      </div>`;
  }
  function miQuadAction(q) {
    if (q === 'star')   return Kiwi.toast('Stars promues', { type: 'success', desc: 'Ajoutées au menu du jour sur tous les terminaux.' });
    if (q === 'plow')   return Kiwi.toast('Révision des prix', { type: 'info', desc: 'Simulateur de marge ouvert pour les plowhorses.' });
    if (q === 'puzzle') return Kiwi.toast('Puzzles repositionnés', { type: 'success', desc: 'Remontés en haut de leur catégorie sur le menu.' });
    if (q === 'dog') {
      Kiwi.modal({
        title: 'Retirer 3 articles du menu ?',
        desc: 'Bocadillo merguez, Hot-dog classique et Smoothie fruits rouges seront masqués sur tous les terminaux.',
        width: 460,
        body: '<p style="font-size:13px;color:var(--n-600);line-height:1.55;margin:0;">Cette action est réversible — les articles restent dans votre catalogue et peuvent être réactivés à tout moment.</p>',
        foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="kb danger" data-mi-confirm>Retirer 3 articles</button>',
      });
      const back = document.querySelector('.kiwi-backdrop:last-child');
      if (back) {
        back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
        back.querySelector('[data-mi-confirm]').onclick = () => {
          back.querySelector('.kiwi-modal-close').click();
          Kiwi.toast('3 articles retirés', { type: 'success', desc: 'Menu mis à jour sur tous les terminaux.' });
        };
      }
    }
  }

  /* ── TAB 3 · Peak hours ───────────────────────────────────────────────── */
  function miTab3Html() {
    const venue = miMenuVenue();
    const items = miItems(venue);
    const p = miPeriod;
    const periodUnits = items.reduce((a, i) => a + (i.times[p] || 0), 0);
    const periodRev = items.reduce((a, i) => a + (i.times[p] || 0) * i.price, 0);
    const top = items.slice().sort((a, b) => (b.times[p] || 0) - (a.times[p] || 0))[0];

    const periodPills = '<div class="mi-pill-row">' + Object.entries(MI_PERIODS).map(([k, l]) =>
      `<button class="mi-pill${p === k ? ' on' : ''}" data-action="mi-period" data-period="${k}">${l}</button>`
    ).join('') + '</div>';

    const bars = items.slice().sort((a, b) => (b.times[p] || 0) - (a.times[p] || 0)).slice(0, 10);
    const maxBar = Math.max(...bars.map(i => i.times[p] || 0), 1);
    const barRows = bars.map(i => `
      <div class="mi-bar-row">
        <div class="mi-bar-name" title="${eqEsc(i.name)}">${eqEsc(i.name)}</div>
        <div class="mi-bar-track"><div class="mi-bar-fill" data-miw="${((i.times[p] || 0) / maxBar * 100).toFixed(1)}" style="background:${miCatColor(i.category)}"></div></div>
        <div class="mi-bar-val">${eqFrInt(i.times[p] || 0)}</div>
      </div>`).join('');

    const insights = {
      matin: { t: 'Le petit-déjeuner est sous-exploité', b: "Entre 08h et 11h, vous générez seulement 14 % du CA quotidien. Vos meilleurs vendeurs matinaux sont café (820 unités), thé (480), café au lait (642) — mais peu d'accompagnement solide.", a: '→ Ajouter 2 articles petit-déjeuner ciblés (msemen+miel à 25 MAD, omelette berbère à 45 MAD) pourrait lifter le CA matin de 25-40 %.' },
      midi:  { t: 'Le Tajine kefta domine vos déjeuners', b: 'Sur le service du midi, le Tajine kefta totalise 312 unités — soit 18 % de tous les plats principaux vendus entre 11h et 15h. Le Couscous royal suit à 168 unités. Ces 2 plats représentent 28 % du CA du déjeuner.', a: '→ Créer un combo « Tajine kefta + Thé à la menthe + Dessert » à 240 MAD (vs 255 MAD à la carte) pourrait augmenter le ticket moyen de 14 %.' },
      soir:  { t: 'Vos desserts performent au-dessus de la moyenne le soir', b: 'Entre 19h et 23h, la Crêpe nutella vend 180 unités contre 64 unités le matin et 168 le midi. Le ticket moyen soir est de 138 MAD vs 122 MAD au midi.', a: '→ Mettre en avant un menu dessert sur les tables après 20h via le KDS pourrait pousser ce ratio encore plus haut.' },
    };
    const ins = insights[p];

    /* Cross-period notable items (computed share, curated copy). */
    const xrows = [
      { name: 'Pastilla pigeon', dot: 'desserts', txt: '63 % de ses ventes le soir (vs 35 % moyenne) — c\'est un plat de soirée.' },
      { name: 'Café noir', dot: 'boissons', txt: '49 % le matin (vs 25 % moyenne) — fonction petit-déjeuner forte.' },
      { name: 'Crème brûlée', dot: 'desserts', txt: '60 % le soir — dessert exclusivement de dîner.' },
    ].map(r => `<div class="mi-xrow"><span class="mi-xdot" style="background:${miCatColor(r.dot)}"></span><div><b>${r.name}</b> : ${r.txt}</div></div>`).join('');

    return `
      <div class="mi-section">
        <div class="mi-section-head"><h3>Performance par moment de la journée</h3></div>
        <div class="mi-section-sub">Quels articles vendent quand · cumul mensuel</div>
        ${periodPills}
        <div class="mi-stats" style="margin-top:14px;">
          <div class="mi-stat"><div class="mi-stat-l">Articles vendus</div><div class="mi-stat-v">${eqFrInt(periodUnits)}</div><div class="mi-stat-s">${MI_PERIODS[p]}</div></div>
          <div class="mi-stat"><div class="mi-stat-l">CA généré</div><div class="mi-stat-v">${eqMad(periodRev)}</div><div class="mi-stat-s">sur la période</div></div>
          <div class="mi-stat"><div class="mi-stat-l">Top article</div><div class="mi-stat-v" style="font-size:18px;">${eqEsc(top ? top.name : '—')}</div><div class="mi-stat-s">${top ? eqFrInt(top.times[p] || 0) + ' unités' : ''}</div></div>
        </div>
        <div class="mi-section-sub" style="margin-top:18px;">Top 10 articles · ${MI_PERIODS[p]}</div>
        <div class="mi-bars">${barRows}</div>
      </div>
      <div class="mi-ai">
        <div class="mi-ai-eyebrow">Kiwi AI · ${MI_PERIODS[p]}</div>
        <div class="mi-ai-t">${ins.t}</div>
        <div class="mi-ai-b">${ins.b}</div>
        <div class="mi-ai-a">${ins.a}</div>
      </div>
      <div class="mi-section">
        <div class="mi-section-head"><h3>Articles avec écart périodique notable</h3></div>
        <div class="mi-xperiod">${xrows}</div>
      </div>`;
  }

  /* ── TAB 4 · 86 alerts ────────────────────────────────────────────────── */
  function miTab4Html() {
    const rows = mi86.map(a => {
      const it = miFindItem(a.id);
      const cat = it ? it.category : 'boissons';
      return `
        <div class="mi-86-row" data-mi-86="${a.id}">
          <div class="mi-86-ico" style="background:${miCatColor(cat)}">${eqEsc((it ? it.name : '?').slice(0, 1))}</div>
          <div class="mi-86-body">
            <div class="mi-86-name">${eqEsc(it ? it.name : a.id)}</div>
            <div class="mi-86-meta">Marqué 86 à ${a.time} par ${eqEsc(a.by)}</div>
            <div class="mi-86-reason">${eqEsc(a.reason)}</div>
          </div>
          <div class="mi-86-right">
            <span class="mi-86-status"><span class="pdot"></span>Actif sur ${a.terminals} terminaux</span>
            <div class="mi-86-acts">
              <span class="mi-86-link" data-action="mi-86-history" data-arg="${eqEsc(it ? it.name : '')}">Voir détails</span>
              <button class="kb atlas" style="padding:6px 13px;font-size:12px;" data-action="mi-86-reactivate" data-arg="${a.id}">Réactiver</button>
            </div>
          </div>
        </div>`;
    }).join('');

    const maxFreq = Math.max(...MI_86_FREQ.map(f => f.count), 1);
    const freqBars = MI_86_FREQ.map(f => `
      <div class="mi-bar-row" data-action="mi-86-history" data-arg="${eqEsc(f.name)}" style="cursor:pointer;">
        <div class="mi-bar-name" title="${eqEsc(f.name)}">${eqEsc(f.name)}</div>
        <div class="mi-bar-track"><div class="mi-bar-fill" data-miw="${(f.count / maxFreq * 100).toFixed(1)}" style="background:var(--danger)"></div></div>
        <div class="mi-bar-val">${f.count}×</div>
      </div>
      <div style="font-size:10.5px;color:var(--n-500);margin:-2px 0 4px 168px;">${eqEsc(f.reason)}</div>`).join('');

    return `
      <div class="mi-section">
        <div class="mi-section-head">
          <h3>Alertes 86 · Articles indisponibles</h3>
          <button class="btn-slim" data-action="mi-86-mark">${miSvg('plus', 13)}<span>Marquer comme 86</span></button>
        </div>
        <div class="mi-section-sub">Synchronisé en temps réel avec la cuisine et les bars</div>
        <div class="mi-86-card" data-mi-86-card>
          <div style="display:flex;align-items:center;gap:9px;padding:13px 0 3px;">
            <h3 style="font-size:14px;font-weight:600;margin:0;color:var(--ink);">Articles 86 maintenant</h3>
            <span class="mi-tab-badge" data-mi-86-count>${mi86.length} articles</span>
          </div>
          ${rows || '<div style="padding:18px 0;font-size:13px;color:var(--n-500);">Aucun article 86 actuellement — tout est disponible.</div>'}
        </div>
      </div>
      <div class="mi-section">
        <div class="mi-section-head"><h3>Articles les plus souvent 86 · 30 derniers jours</h3></div>
        <div class="mi-section-sub">Cliquez une barre pour l'historique complet</div>
        <div class="mi-bars">${freqBars}</div>
      </div>
      <div class="mi-ai warn">
        <div class="mi-ai-eyebrow">Kiwi AI · Récurrence</div>
        <div class="mi-ai-t">Le Tajine agneau pruneaux est 86 trop souvent</div>
        <div class="mi-ai-b">Ce plat a été indisponible 8 fois ce mois, soit 27 % des jours d'ouverture. Chaque 86 sur ce plat fait perdre en moyenne 220 MAD × 4-6 ventes manquées = 1 100-1 320 MAD par incident. Coût d'opportunité estimé : ~9 200 MAD/mois.</div>
        <div class="mi-ai-a">→ Doubler le stock de viande d'agneau le mardi (jour de livraison) et négocier une livraison supplémentaire le vendredi avec votre boucher pourrait éliminer 80 % des incidents.</div>
      </div>
      <div class="mi-section">
        <div class="mi-section-head"><h3>Impact des 86 sur le chiffre d'affaires</h3></div>
        <div class="mi-impact" style="margin-top:12px;">
          <div class="mi-impact-item"><div class="l">Incidents 86 ce mois</div><div class="v">28</div></div>
          <div class="mi-impact-item"><div class="l">CA perdu estimé</div><div class="v bad">~22 400 MAD</div></div>
          <div class="mi-impact-item"><div class="l">% du CA potentiel</div><div class="v">1,5 %</div></div>
        </div>
      </div>`;
  }
  function miReactivate86(id) {
    const a = mi86.find(x => x.id === id);
    if (!a) return;
    const it = miFindItem(id);
    const name = it ? it.name : id;
    Kiwi.modal({
      title: `Réactiver ${name} ?`,
      desc: 'L\'article redeviendra disponible immédiatement sur tous les terminaux.',
      width: 440,
      body: '<p style="font-size:13px;color:var(--n-600);margin:0;">Assurez-vous que le stock est bien reconstitué avant de réactiver.</p>',
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="kb atlas" data-mi-confirm>Réactiver</button>',
    });
    const back = document.querySelector('.kiwi-backdrop:last-child');
    if (!back) return;
    back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
    back.querySelector('[data-mi-confirm]').onclick = () => {
      back.querySelector('.kiwi-modal-close').click();
      mi86 = mi86.filter(x => x.id !== id);
      const row = document.querySelector(`[data-mi-86="${id}"]`);
      if (row) row.classList.add('removing');
      Kiwi.toast(`${name} réactivé sur tous les terminaux`, { type: 'success' });
      setTimeout(() => { if (miTab === 'alerts' && document.body.classList.contains('page-menu')) renderMenu(); }, 260);
    };
  }
  function miOpen86History(name) {
    const f = MI_86_FREQ.find(x => x.name === name) || { name, count: 1, reason: 'rupture' };
    Kiwi.modal({
      title: `Historique 86 · ${f.name}`,
      tag: '30 DERNIERS JOURS',
      width: 480,
      body: `
        <div style="font-size:13px;color:var(--n-600);line-height:1.6;">
          <p style="margin:0 0 12px;"><b style="color:var(--ink);font-weight:600;">${f.count} incidents</b> ce mois — cause principale : ${eqEsc(f.reason)}.</p>
          <div style="background:var(--paper-soft);border:1px solid var(--n-200);border-radius:10px;padding:12px 14px;font-family:var(--mono);font-size:11.5px;color:var(--n-600);line-height:1.9;">
            Mar 06/05 · 12:10 → 19:30 · rupture<br>
            Ven 09/05 · 13:40 → fermeture · rupture<br>
            Mar 13/05 · 11:55 → 16:00 · rupture<br>
            Jeu 15/05 · 12:45 → en cours · rupture
          </div>
        </div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Fermer</button>',
    });
    const back = document.querySelector('.kiwi-backdrop:last-child');
    if (back) back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
  }

  /* ── TAB 5 · Cross-site comparison ────────────────────────────────────── */
  function miTab5Html() {
    if (currentVenue !== 'fusion') {
      return `
        <div class="mi-section">
          <div class="mi-locked">
            <div class="mi-locked-ic">${miSvg('compare', 24)}</div>
            <h3>Comparaison multi-sites</h3>
            <p>Activez Go Ultra (sidebar → Go Ultra) pour comparer les menus, le pricing et la performance de vos 3 établissements côte à côte.</p>
          </div>
        </div>`;
    }
    const ca = MENU.cafeAtlas, mm = MENU.maisonMansour;
    const find = (arr, n) => arr.find(x => x.name.toLowerCase().includes(n));
    const common = [
      { label: 'Thé à la menthe', ca: find(ca, 'thé à la menthe'), mm: find(mm, 'thé à la menthe'),
        ins: 'Pricing varie 30 vs 25 MAD — écart 20 %. Volume Café Atlas 13× supérieur. Recommandation : aligner Maison Mansour à 28 MAD.' },
      { label: 'Café', ca: find(ca, 'café noir'), mm: find(mm, 'café espresso'),
        ins: 'Café noir à 15 MAD vs espresso à 18 MAD. Le café est un produit d\'appel — garder Café Atlas agressif sur ce prix.' },
      { label: 'Eau minérale', ca: find(ca, 'eau minérale'), mm: find(mm, 'eau minérale'),
        ins: 'Écart de 3 MAD. Volume Café Atlas presque 10× — la restauration tire la vente d\'eau.' },
    ];
    const cell = it => it ? `${eqFrInt(it.price)} MAD · ${eqFrInt(it.unitsThisMonth)} u` : '<span style="color:var(--n-300);">—</span>';
    const cmpRows = common.map(c => `
      <tr>
        <td><b style="font-weight:600;">${eqEsc(c.label)}</b></td>
        <td class="mono">${cell(c.ca)}</td>
        <td class="mono">${cell(c.mm)}</td>
        <td class="mono"><span style="color:var(--n-300);">—</span></td>
        <td class="mi-cmp-ins">${eqEsc(c.ins)}</td>
      </tr>`).join('');

    const col = (venue, name) => {
      const top = MENU[venue].slice().sort((a, b) => miRevenue(b) - miRevenue(a)).slice(0, 5);
      return `
        <div class="mi-cmp-col">
          <div class="mi-cmp-col-h">${name}</div>
          <div class="mi-cmp-col-sub">Top 5 · CA mensuel</div>
          ${top.map((i, idx) => `<div class="mi-cmp-rank"><span><span class="rn">${idx + 1}</span>${eqEsc(i.name)}</span><span class="rv">${eqMad(miRevenue(i))}</span></div>`).join('')}
        </div>`;
    };

    return `
      <div class="mi-section">
        <div class="mi-section-head">
          <h3>Comparaison des menus · 3 sites</h3>
          <span class="mi-ultra-pill">✦ ULTRA</span>
        </div>
        <div class="mi-section-sub">Articles communs, pricing, performance comparative</div>
        <div class="mi-list-wrap">
          <table class="mi-cmp-table">
            <thead><tr><th>Article</th><th>Café Atlas</th><th>Maison Mansour</th><th>Spa Bahia</th><th>Insight</th></tr></thead>
            <tbody>${cmpRows}</tbody>
          </table>
        </div>
      </div>
      <div class="mi-section">
        <div class="mi-section-head"><h3>Performance comparative par site</h3></div>
        <div class="mi-section-sub">Top 5 articles par chiffre d'affaires</div>
        <div class="mi-cmp-cols">
          ${col('cafeAtlas', 'Café Atlas')}
          ${col('spaBahia', 'Spa Bahia')}
          ${col('maisonMansour', 'Maison Mansour')}
        </div>
      </div>
      <div class="mi-ai">
        <div class="mi-ai-eyebrow">Kiwi AI · Cross-vente</div>
        <div class="mi-ai-t">Opportunité cross-vente entre vos sites</div>
        <div class="mi-ai-b">Sur les 312 clients qui fréquentent plusieurs de vos sites, 184 vont à Café Atlas ET Spa Bahia. Leur ticket moyen Café Atlas est 168 MAD (+29 % vs moyenne). Ce sont des clients à fort pouvoir d'achat qui apprécient déjà votre écosystème.</div>
        <div class="mi-ai-a">→ Créer un forfait « Déjeuner Café Atlas + Soin Spa Bahia 60 min » à 580 MAD (vs 630 MAD séparément) ciblé à ces 184 clients pourrait générer ~22 000 MAD/mois additionnels.</div>
      </div>`;
  }

  /* ═══════════ ITEM ACTIONS ═══════════ */
  function miDuplicateItem(id) {
    const it = miFindItem(id);
    if (!it) return;
    const venue = it.venue || miMenuVenue();
    const copy = JSON.parse(JSON.stringify(it));
    copy.id = 'mix' + (++miIdCounter);
    copy.name = it.name + ' (copie)';
    const arr = MENU[venue] || MENU[miMenuVenue()];
    const idx = arr.indexOf(it);
    arr.splice(idx + 1, 0, copy);
    Kiwi.toast(`Article dupliqué · ${copy.name}`, { type: 'success' });
    if (miTab === 'menu') miRenderTab1Body();
  }
  function miDeleteItem(id) {
    const it = miFindItem(id);
    if (!it) return;
    Kiwi.modal({
      title: `Supprimer ${it.name} ?`,
      width: 440,
      body: '<p style="font-size:13px;color:var(--n-600);margin:0;line-height:1.55;">L\'article sera retiré du menu et de tous les terminaux. Cette action est réversible jusqu\'au prochain rechargement.</p>',
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="kb danger" data-mi-confirm>Supprimer</button>',
    });
    const back = document.querySelector('.kiwi-backdrop:last-child');
    if (!back) return;
    back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
    back.querySelector('[data-mi-confirm]').onclick = () => {
      back.querySelector('.kiwi-modal-close').click();
      const card = document.querySelector(`[data-mi-card="${id}"]`);
      if (card) card.classList.add('removing');
      Kiwi.toast('Article supprimé', { type: 'success', desc: it.name });
      setTimeout(() => {
        for (const v of REAL_VENUES) {
          const arr = MENU[v]; const i = arr.indexOf(it);
          if (i > -1) { arr.splice(i, 1); break; }
        }
        if (miTab === 'menu' && document.body.classList.contains('page-menu')) miRenderTab1Body();
      }, 300);
    };
  }

  /* ═══════════ STATION ROUTING + SUBSECTIONS ═══════════ */
  function miRerouteItem(id, anchorEl) {
    const it = miFindItem(id);
    if (!it) return;
    const stations = miGetStations(it.venue || miMenuVenue());
    Kiwi.menu(anchorEl, [
      { head: 'Rerouter vers une station' },
      ...stations.map(s => ({ label: s, active: s === it.station, onClick: () => {
        it.station = s;
        Kiwi.toast(`${it.name} rerouté`, { type: 'success', desc: 'Station de routage : ' + s });
        if (miTab === 'menu') miRenderTab1Body();
      } })),
    ]);
  }
  function miRerouteSub(catId, anchorEl) {
    const venue = miMenuVenue();
    const stations = miGetStations(venue);
    const items = (MENU[venue] || []).filter(i => i.category === catId);
    if (!items.length) { Kiwi.toast('Sous-section vide', { type: 'info', desc: 'Ajoutez des articles avant de router la sous-section.' }); return; }
    Kiwi.menu(anchorEl, [
      { head: `Rerouter « ${miCatLabel(catId)} » (${items.length})` },
      ...stations.map(s => ({ label: s, onClick: () => {
        items.forEach(i => { i.station = s; });
        Kiwi.toast(`${items.length} articles reroutés`, { type: 'success', desc: `${miCatLabel(catId)} → ${s}` });
        if (miTab === 'menu') miRenderTab1Body();
      } })),
    ]);
  }
  function miRemoveStation(st) {
    const venue = miMenuVenue();
    const list = miGetStations(venue);
    if (list.length <= 1) { Kiwi.toast('Station minimale requise', { type: 'warn', desc: 'Gardez au moins une station de routage.' }); return; }
    const routed = (MENU[venue] || []).filter(i => i.station === st);
    const fallback = list.find(s => s !== st);
    Kiwi.modal({
      title: `Retirer la station « ${st} » ?`,
      width: 460,
      body: `<p style="font-size:13px;color:var(--n-600);line-height:1.55;margin:0;">${routed.length
        ? `<b style="color:var(--ink);">${routed.length} article${routed.length > 1 ? 's' : ''}</b> y ${routed.length > 1 ? 'sont routés' : 'est routé'} — ${routed.length > 1 ? 'ils seront réassignés' : 'il sera réassigné'} à « ${fallback} ».`
        : 'Aucun article n\'est routé vers cette station.'}</p>`,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="kb danger" data-mi-confirm>Retirer la station</button>',
    });
    const back = document.querySelector('.kiwi-backdrop:last-child');
    if (!back) return;
    back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
    back.querySelector('[data-mi-confirm]').onclick = () => {
      back.querySelector('.kiwi-modal-close').click();
      routed.forEach(i => { i.station = fallback; });
      const idx = list.indexOf(st);
      if (idx > -1) list.splice(idx, 1);
      Kiwi.toast(`Station « ${st} » retirée`, { type: 'success', desc: routed.length ? `${routed.length} article(s) → ${fallback}` : '' });
      if (miTab === 'menu') miRenderTab1Body();
    };
  }
  function miOpenAddStationModal() {
    const venue = miMenuVenue();
    const m = Kiwi.modal({
      tag: 'STATION', title: 'Ajouter une station', width: 460,
      body: `
        <div class="kf-group"><label class="kf-label">Nom de la station</label><input class="kf-input" data-msf="name" placeholder="Ex. grillade · bar-2 · plonge"/></div>
        <div class="kf-help">La station apparaît dans le routage cuisine et devient sélectionnable pour tous les articles.</div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="eq-cta-gradient" data-mi-save>Ajouter la station</button>',
    });
    m.el.querySelector('[data-mi-cancel]').onclick = m.close;
    m.el.querySelector('[data-mi-save]').onclick = () => {
      const f = m.el.querySelector('[data-msf="name"]');
      const name = f.value.trim().toLowerCase().replace(/\s+/g, '-');
      const list = miGetStations(venue);
      if (!name) { f.classList.add('eq-invalid'); return; }
      if (list.includes(name)) { f.classList.add('eq-invalid'); Kiwi.toast('Station déjà existante', { type: 'warn' }); return; }
      list.push(name);
      m.close();
      Kiwi.toast(`Station « ${name} » ajoutée`, { type: 'success' });
      if (miTab === 'menu') miRenderTab1Body();
    };
    m.el.querySelector('[data-msf="name"]').addEventListener('input', e => e.target.classList.remove('eq-invalid'));
  }
  function miOpenAddSubModal() {
    const venue = miMenuVenue();
    const stations = miGetStations(venue);
    const m = Kiwi.modal({
      tag: 'SOUS-SECTION', title: 'Nouvelle sous-section', width: 480,
      body: `
        <div class="kf-group"><label class="kf-label">Nom de la sous-section</label><input class="kf-input" data-msbf="name" placeholder="Ex. Brunch · Menu enfant · Cocktails"/></div>
        <div class="kf-group"><label class="kf-label">Station de routage par défaut</label>
          <select class="kf-input" data-msbf="station">${stations.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="kf-help">La sous-section apparaît dans les filtres du menu. Vous pourrez y ajouter des articles via « Nouvel article ».</div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="eq-cta-gradient" data-mi-save>Créer la sous-section</button>',
    });
    m.el.querySelector('[data-mi-cancel]').onclick = m.close;
    m.el.querySelector('[data-mi-save]').onclick = () => {
      const f = m.el.querySelector('[data-msbf="name"]');
      const name = f.value.trim();
      if (!name) { f.classList.add('eq-invalid'); return; }
      const id = 'sub' + (++miIdCounter);
      miCustomCats.push({
        id, venue, label: name,
        color: MI_CUSTOM_COLORS[miCustomCats.length % MI_CUSTOM_COLORS.length],
        station: m.el.querySelector('[data-msbf="station"]').value,
      });
      m.close();
      miCatFilter = id;
      Kiwi.toast(`Sous-section « ${name} » créée`, { type: 'success', desc: 'Ajoutez-y des articles avec « Nouvel article ».' });
      if (document.body.classList.contains('page-menu')) { miTab = 'menu'; renderMenu(); }
    };
    m.el.querySelector('[data-msbf="name"]').addEventListener('input', e => e.target.classList.remove('eq-invalid'));
  }

  /* ═══════════ MODALS ═══════════ */
  function miOpenItemModal(item) {
    const editing = !!item;
    const venue = editing ? (item.venue || miMenuVenue()) : miMenuVenue();
    /* New items pre-fill the currently-filtered subsection (and its default
     * station, for custom subsections) so adding to a subsection is one click. */
    const preCat = editing ? item.category
      : (miCatFilter !== 'all' && miVenueCats(venue).includes(miCatFilter) ? miCatFilter : '');
    const preStation = editing ? item.station : (miCustomCat(preCat) ? miCustomCat(preCat).station : '');
    const catOpts = miVenueCats(venue).map(c => `<option value="${c}"${preCat === c ? ' selected' : ''}>${miCatLabel(c)}</option>`).join('');
    const stList = miGetStations(venue).slice();
    if (editing && item.station && !stList.includes(item.station)) stList.unshift(item.station);
    const stOpts = stList.map(s => `<option value="${s}"${preStation === s ? ' selected' : ''}>${s}</option>`).join('');
    const chip = (t, on) => `<span class="mi-chip${on ? ' on' : ''}" data-mi-chip="${t}">${MI_TAG_LABEL[t] || t}</span>`;
    const m = Kiwi.modal({
      tag: editing ? 'MODIFIER' : 'NOUVEL ARTICLE',
      title: editing ? 'Modifier · ' + item.name : 'Nouvel article',
      width: 640,
      body: `
        <div class="kf-group"><label class="kf-label">Nom de l'article</label><input class="kf-input" data-mif="name" value="${editing ? eqEsc(item.name) : ''}" placeholder="Ex. Tajine kefta"/></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Catégorie</label><select class="kf-input" data-mif="category">${catOpts}</select></div>
          <div class="kf-group"><label class="kf-label">Station de routage</label><select class="kf-input" data-mif="station">${stOpts}</select></div>
        </div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Prix de vente</label>
            <div class="eq-m-suffix"><input class="kf-input" type="number" data-mif="price" value="${editing ? item.price : ''}" placeholder="0" style="padding-right:48px;"/><span class="sfx">MAD</span></div>
          </div>
          <div class="kf-group"><label class="kf-label">Coût matière</label>
            <div class="eq-m-suffix"><input class="kf-input" type="number" data-mif="cost" value="${editing ? item.cost : ''}" placeholder="0" style="padding-right:48px;"/><span class="sfx">MAD</span></div>
          </div>
        </div>
        <div class="kf-group">
          <div class="mi-margin-readout"><span class="l">Marge calculée</span><span class="v" data-mi-margin>—</span></div>
        </div>
        <div class="kf-group"><label class="kf-label">Tags</label><div class="mi-chips" data-mi-tags>${MI_TAGS.map(t => chip(t, editing && (item.tags || []).includes(t))).join('')}</div></div>
        <div class="kf-group"><label class="kf-label">Description (optionnel)</label><textarea class="kf-input" data-mif="desc" rows="2" placeholder="Description courte affichée sur le menu…"></textarea></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Photo</label><div class="mi-photo-drop" data-mi-photo>${miSvg('upload', 16)} &nbsp;Glisser une image ou cliquer</div></div>
          <div class="kf-group"><label class="kf-label">Disponibilité</label>
            <div class="mi-toggle" data-mi-avail><button type="button" class="on" data-av="1">Disponible</button><button type="button" data-av="0">Masqué</button></div>
          </div>
        </div>
      `,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="eq-cta-gradient" data-mi-save>Enregistrer</button>',
    });
    const el = s => m.el.querySelector(s);
    const val = k => m.el.querySelector(`[data-mif="${k}"]`);
    function refreshMargin() {
      const p = Number(val('price').value), c = Number(val('cost').value);
      const out = el('[data-mi-margin]');
      if (p > 0 && c >= 0 && c <= p) {
        const pct = (p - c) / p * 100;
        out.textContent = `${Math.round(pct)} % · ${eqFrInt(p - c)} MAD`;
        out.className = 'v ' + miMarginClass(pct);
      } else { out.textContent = '—'; out.className = 'v'; }
    }
    m.el.querySelectorAll('[data-mif="price"],[data-mif="cost"]').forEach(i => i.addEventListener('input', refreshMargin));
    refreshMargin();
    m.el.querySelectorAll('[data-mi-chip]').forEach(c => c.onclick = () => c.classList.toggle('on'));
    m.el.querySelectorAll('[data-mi-avail] button').forEach(b => b.onclick = () => {
      m.el.querySelectorAll('[data-mi-avail] button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
    el('[data-mi-photo]').onclick = () => Kiwi.toast('Sélecteur de photo', { type: 'info', desc: 'Téléversement disponible à la connexion du compte.' });
    el('[data-mi-cancel]').onclick = m.close;
    el('[data-mi-save]').onclick = () => {
      const name = val('name').value.trim();
      const price = Number(val('price').value);
      const cost = Number(val('cost').value);
      let ok = true;
      [['name', !name], ['price', !(price > 0)], ['cost', !(cost >= 0)]].forEach(([k, bad]) => {
        const f = val(k); if (f) f.classList.toggle('eq-invalid', bad); if (bad) ok = false;
      });
      if (!ok) { Kiwi.toast('Champs requis manquants', { type: 'warn', desc: 'Nom, prix et coût sont obligatoires.' }); return; }
      const tags = [...m.el.querySelectorAll('[data-mi-chip].on')].map(c => c.dataset.miChip);
      const cat = val('category').value;
      if (editing) {
        item.name = name; item.price = price; item.cost = cost;
        item.category = cat; item.station = val('station').value; item.tags = tags;
        m.close();
        Kiwi.toast('Article mis à jour', { type: 'success', desc: name });
      } else {
        const venue = miMenuVenue();
        (MENU[venue] || MENU.cafeAtlas).push({
          id: 'mix' + (++miIdCounter), name, category: cat, price, cost,
          unitsThisMonth: 0, station: val('station').value, tags,
          times: { matin: 0, midi: 0, soir: 0 },
        });
        m.close();
        Kiwi.toast('Article ajouté', { type: 'success', desc: `${name} · ${miCatLabel(cat)}` });
      }
      if (document.body.classList.contains('page-menu')) { miTab = 'menu'; renderMenu(); }
    };
    m.el.querySelectorAll('[data-mif]').forEach(f => f.addEventListener('input', () => f.classList.remove('eq-invalid')));
  }
  function miOpenHowtoModal() {
    Kiwi.modal({
      tag: 'MENU ENGINEERING',
      title: 'Comment lire la matrice ?',
      width: 540,
      body: `
        <p style="font-size:13px;color:var(--n-600);line-height:1.6;margin:0 0 14px;">
          Chaque article est classé selon deux axes : sa <b style="color:var(--ink);">popularité</b> (ventes mensuelles) et sa <b style="color:var(--ink);">marge unitaire</b> (prix − coût). Les médianes du menu divisent les articles en 4 quadrants :
        </p>
        <div style="display:flex;flex-direction:column;gap:9px;font-size:12.5px;color:var(--n-600);line-height:1.5;">
          <div><b style="color:var(--success);">★ Stars</b> — populaires ET rentables. Votre cœur de menu : à mettre en avant.</div>
          <div><b style="color:var(--info);">🐴 Plowhorses</b> — populaires mais peu rentables. À optimiser : revoir le prix ou le coût matière.</div>
          <div><b style="color:var(--warning);">❓ Puzzles</b> — rentables mais peu vendus. À repositionner : meilleure visibilité sur le menu.</div>
          <div><b style="color:var(--danger);">🐕 Dogs</b> — ni populaires ni rentables. Candidats au retrait pour simplifier le menu.</div>
        </div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Compris</button>',
    });
    const back = document.querySelector('.kiwi-backdrop:last-child');
    if (back) back.querySelector('[data-mi-cancel]').onclick = () => back.querySelector('.kiwi-modal-close').click();
  }
  function miOpenModifierModal() {
    const m = Kiwi.modal({
      tag: 'MODIFICATEUR',
      title: 'Nouveau modificateur',
      width: 480,
      body: `
        <div class="kf-group"><label class="kf-label">Nom du modificateur</label><input class="kf-input" data-mmf="name" placeholder="Ex. Supplément avocat"/></div>
        <div class="kf-row">
          <div class="kf-group"><label class="kf-label">Catégorie liée</label>
            <select class="kf-input" data-mmf="cat"><option value="tous">Toutes</option>${MI_CAT_ORDER.map(c => `<option value="${c}">${miCatLabel(c)}</option>`).join('')}</select>
          </div>
          <div class="kf-group"><label class="kf-label">Prix</label>
            <div class="eq-m-suffix"><input class="kf-input" type="number" data-mmf="price" value="0" style="padding-right:48px;"/><span class="sfx">MAD</span></div>
          </div>
        </div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="eq-cta-gradient" data-mi-save>Ajouter</button>',
    });
    m.el.querySelector('[data-mi-cancel]').onclick = m.close;
    m.el.querySelector('[data-mi-save]').onclick = () => {
      const name = m.el.querySelector('[data-mmf="name"]').value.trim();
      if (!name) { m.el.querySelector('[data-mmf="name"]').classList.add('eq-invalid'); return; }
      const price = Number(m.el.querySelector('[data-mmf="price"]').value) || 0;
      MI_MODIFIERS.push({ name, cat: m.el.querySelector('[data-mmf="cat"]').value, price, demand: 0 });
      m.close();
      Kiwi.toast('Modificateur ajouté', { type: 'success', desc: name });
      if (miTab === 'menu') miRenderTab1Body();
    };
  }
  function miOpenMark86Modal() {
    const venue = miMenuVenue();
    const opts = miItems(venue).filter(i => !mi86.some(a => a.id === i.id))
      .map(i => `<option value="${i.id}">${eqEsc(i.name)}</option>`).join('');
    const m = Kiwi.modal({
      tag: 'ALERTE 86',
      title: 'Marquer un article comme 86',
      width: 480,
      body: `
        <div class="kf-group"><label class="kf-label">Article</label><select class="kf-input" data-m8f="id">${opts || '<option>Tous les articles sont disponibles</option>'}</select></div>
        <div class="kf-group"><label class="kf-label">Raison</label>
          <select class="kf-input" data-m8f="reason">
            <option>Rupture matière première</option>
            <option>Rupture stock</option>
            <option>Problème équipement</option>
            <option>Personnel indisponible</option>
            <option>Décision gérant</option>
          </select>
        </div>
        <div class="kf-help">L'article sera immédiatement masqué sur tous les terminaux de prise de commande.</div>`,
      foot: '<button class="kb ghost" data-mi-cancel>Annuler</button><button class="kb danger" data-mi-save>Marquer 86</button>',
    });
    m.el.querySelector('[data-mi-cancel]').onclick = m.close;
    m.el.querySelector('[data-mi-save]').onclick = () => {
      const id = m.el.querySelector('[data-m8f="id"]').value;
      const it = miFindItem(id);
      if (!it) { m.close(); return; }
      const now = new Date();
      mi86.unshift({ id, time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
        by: 'Vous (gérant)', reason: m.el.querySelector('[data-m8f="reason"]').value, terminals: 6 });
      m.close();
      Kiwi.toast(`${it.name} marqué 86`, { type: 'warn', desc: 'Masqué sur tous les terminaux.' });
      if (document.body.classList.contains('page-menu')) { miTab = 'alerts'; renderMenu(); }
    };
  }

  /* ── Live search (input is re-created on each render; delegate on input) ─ */
  document.addEventListener('input', (e) => {
    const s = e.target.closest('[data-mi-search]');
    if (!s) return;
    miSearch = s.value;
    const host = document.querySelector('[data-mi-panel]');
    if (!host) return;
    /* Re-render only the grid/list, keep focus in the search field. */
    const list = miFilteredItems();
    const body = host.querySelector('.mi-grid, .mi-list-wrap');
    if (body) {
      const fresh = document.createElement('div');
      fresh.innerHTML = list.length
        ? (miView === 'grid' ? `<div class="mi-grid">${list.map(miItemCard).join('')}</div>` : miListHtml(list))
        : '<div style="text-align:center;color:var(--n-500);padding:36px;font-size:13px;">Aucun article pour cette recherche.</div>';
      body.replaceWith(fresh.firstElementChild);
    }
  });

  /* Keep the menu page in sync with venue / fusion changes. */
  subscribe(() => {
    if (!document.body.classList.contains('page-menu')) return;
    if (miTab === 'compare' && currentVenue !== 'fusion') miTab = 'menu';
    miVenueFilter = 'cafeAtlas'; miCatFilter = 'all'; miSearch = '';
    renderMenu();
  });

  miWireHandlers();

  /* ═══════════════════════════════════════════════════════════════════════
   * PAIE & PLANNING — full-page payroll + scheduling view
   * Reachable from the sidebar "Paie & planning" item (overrides pages.js'
   * nav-payroll drawer). Single venue → that venue's staff; Go Ultra → all
   * three. Built from the STAFF roster; the weekly schedule is generated
   * once, then mutable in-memory — click any shift cell to edit it.
   * ═══════════════════════════════════════════════════════════════════════ */

  let payCurrentPage = 'dashboard';
  let paySort = 'salary';                 // 'salary' | 'name' | 'hours'
  let paySchedule = null;                 // { staffId: [day0..day6] }, lazy-built

  const PAY_DOW      = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const PAY_DOW_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const PAY_CNSS_RATE = 0.2109;           // employer social charges (CNSS + AMO + formation)

  function payEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function payNum(n) { return Math.round(n || 0).toLocaleString('fr-FR').replace(/[ ,]/g, ' '); }
  function payMad(n) { return payNum(n) + ' MAD'; }

  function payStaffAll() { return [].concat(STAFF.cafeAtlas, STAFF.maisonMansour, STAFF.spaBahia); }
  /* Staff in scope: the active venue, or all three under Go Ultra. */
  function payStaff() {
    if (currentVenue === 'fusion') return payStaffAll();
    return (STAFF[currentVenue] || STAFF.cafeAtlas).slice();
  }
  /* Gross monthly pay — same basis as the Équipe page (hours × rate). */
  function payGross(s) { return s.hoursThisMonth * s.hourlyRate; }

  /* ── Weekly schedule — generated once per staff, then editable ──────────
   * Each staff → 7 entries; null = repos, else { s:'HH:MM', e:'HH:MM' }. */
  const PAY_SHIFT_BY_DEPT = {
    cuisine:    { s: '07:00', e: '15:00' },
    salle:      { s: '11:00', e: '19:00' },
    caisse:     { s: '08:00', e: '16:00' },
    accueil:    { s: '09:00', e: '17:00' },
    support:    { s: '07:30', e: '15:30' },
    management: { s: '09:00', e: '18:00' },
    soin:       { s: '10:00', e: '18:00' },
    vente:      { s: '10:00', e: '19:00' },
  };
  function payBuildSchedule() {
    paySchedule = {};
    payStaffAll().forEach((s, idx) => {
      let base = PAY_SHIFT_BY_DEPT[s.department] || { s: '09:00', e: '17:00' };
      if (s.department === 'salle' && /senior/i.test(s.role)) base = { s: '16:00', e: '24:00' };
      const off1 = idx % 7;                 // two rest days, staggered so coverage rotates
      const off2 = (idx + 3) % 7;
      paySchedule[s.id] = PAY_DOW.map((_, d) =>
        (d === off1 || d === off2) ? null : { s: base.s, e: base.e });
    });
  }
  function paySched() { if (!paySchedule) payBuildSchedule(); return paySchedule; }
  function payShiftHours(sh) {
    if (!sh) return 0;
    const a = +sh.s.slice(0, 2) + (+sh.s.slice(3)) / 60;
    let b = +sh.e.slice(0, 2) + (+sh.e.slice(3)) / 60;
    if (b <= a) b += 24;
    return b - a;
  }
  function payShiftKind(sh) {
    if (!sh) return 'off';
    const h = +sh.s.slice(0, 2);
    return h < 10 ? 'morning' : h < 16 ? 'day' : 'evening';
  }

  /* ═══════════ NAVIGATION ═══════════ */

  function payShowPage() {
    payCurrentPage = 'payroll';
    document.body.classList.remove('page-equipe', 'page-menu');
    document.body.classList.add('page-payroll');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Paie &amp; Planning</b>';
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    document.querySelector('.sidebar nav a[data-nav="payroll"]')?.classList.add('active');
    window.scrollTo({ top: 0 });
    renderPayroll();
  }
  function payShowDashboard() {
    if (payCurrentPage !== 'payroll') return;
    payCurrentPage = 'dashboard';
    document.body.classList.remove('page-payroll');
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = 'Accueil <span class="sep">/</span> <b>Tableau de bord</b>';
  }

  /* ═══════════ RENDER ═══════════ */

  function renderPayroll() {
    const root = document.querySelector('[data-payroll-root]');
    if (!root) return;
    const staff = payStaff();
    root.innerHTML =
      payHeadHtml(staff) +
      payHeroHtml(staff) +
      payDeptHtml(staff) +
      payTableHtml(staff) +
      payPlanningHtml(staff);
    requestAnimationFrame(() => {
      root.querySelectorAll('[data-pay-bar]').forEach(b => { b.style.width = b.dataset.payBar + '%'; });
    });
  }

  function payHeadHtml(staff) {
    const venueName = currentVenue === 'fusion'
      ? 'Go Ultra · 3 emplacements'
      : (STAFF[currentVenue] && STAFF[currentVenue][0] ? STAFF[currentVenue][0].venueName : 'Café Atlas');
    return `
      <div class="pay-head">
        <div>
          <div class="pay-title">Paie &amp; Planning</div>
          <div class="pay-sub">${payEsc(venueName)} · ${staff.length} employés · cycle de paie mensuel</div>
        </div>
        <button class="kb primary" data-action="pay-export">Exporter la paie</button>
      </div>`;
  }

  function payHeroHtml(staff) {
    const masse  = staff.reduce((a, s) => a + payGross(s), 0);
    const charges = Math.round(masse * PAY_CNSS_RATE);
    const total  = masse + charges;
    const avg    = staff.length ? Math.round(masse / staff.length) : 0;
    const card = (l, v, s) =>
      `<div class="pay-stat"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
    return `
      <div class="pay-hero">
        ${card('Masse salariale', payMad(masse), 'brut · ce mois')}
        ${card('Charges sociales', payMad(charges), 'CNSS · AMO · employeur')}
        ${card('Coût total employeur', payMad(total), 'masse + charges')}
        ${card('Coût moyen / employé', payMad(avg), `${staff.length} employés`)}
      </div>`;
  }

  function payDeptHtml(staff) {
    const masse = staff.reduce((a, s) => a + payGross(s), 0) || 1;
    const byDept = {};
    staff.forEach(s => {
      if (!byDept[s.department]) byDept[s.department] = { sum: 0, n: 0 };
      byDept[s.department].sum += payGross(s);
      byDept[s.department].n++;
    });
    const rows = EQ_DEPT_ORDER.filter(d => byDept[d]).map(d => {
      const D = EQ_DEPTS[d], info = byDept[d], pct = Math.round((info.sum / masse) * 100);
      return `
        <div class="pay-dept-row">
          <div class="pay-dept-name"><span class="pay-dept-dot" style="background:${D.color}"></span>${payEsc(D.label)}</div>
          <div class="pay-dept-meta">${info.n} ${info.n > 1 ? 'employés' : 'employé'}</div>
          <div class="pay-dept-track"><div class="pay-dept-fill" data-pay-bar="${pct}" style="background:${D.color}"></div></div>
          <div class="pay-dept-val">${payMad(info.sum)}<span class="pct">${pct}%</span></div>
        </div>`;
    }).join('');
    return `
      <div class="pay-section">
        <div class="pay-section-head"><h3>Répartition par département</h3>
          <span class="pay-section-sub">où part la masse salariale</span></div>
        <div class="pay-dept-list">${rows}</div>
      </div>`;
  }

  function payTableHtml(staff) {
    const sorted = staff.slice().sort((a, b) => {
      if (paySort === 'name')  return a.name.localeCompare(b.name);
      if (paySort === 'hours') return b.hoursThisMonth - a.hoursThisMonth;
      return payGross(b) - payGross(a);
    });
    const th = (key, label, cls) =>
      `<th class="${cls || ''} ${paySort === key ? 'on' : ''}" data-action="pay-sort" data-arg="${key}">${label}</th>`;
    const rows = sorted.map(s => {
      const gross = payGross(s), tot = gross + s.tipsThisMonth;
      const D = EQ_DEPTS[s.department] || { label: s.department, color: 'var(--n-400)' };
      return `
        <tr>
          <td>
            <div class="pay-emp">
              <span class="pay-emp-av" style="background:${D.color}">${payEsc(s.avatar)}</span>
              <span><span class="pay-emp-n">${payEsc(s.name)}</span>
              <span class="pay-emp-r">${payEsc(s.role)}</span></span>
            </div>
          </td>
          <td><span class="pay-dept-tag" style="color:${D.color}">${payEsc(D.label)}</span></td>
          <td class="r mono">${s.contractHours} h/sem</td>
          <td class="r mono">${s.hourlyRate} MAD/h</td>
          <td class="r mono">${payMad(gross)}</td>
          <td class="r mono">${s.tipsThisMonth ? payMad(s.tipsThisMonth) : '—'}</td>
          <td class="r mono pay-total">${payMad(tot)}</td>
        </tr>`;
    }).join('');
    const masse = staff.reduce((a, s) => a + payGross(s), 0);
    const tips  = staff.reduce((a, s) => a + s.tipsThisMonth, 0);
    return `
      <div class="pay-section">
        <div class="pay-section-head"><h3>Paie par employé</h3>
          <span class="pay-section-sub">cliquez un en-tête pour trier</span></div>
        <div class="pay-table-wrap">
          <table class="pay-table">
            <thead><tr>
              ${th('name', 'Employé')}
              <th>Département</th>
              <th class="r">Contrat</th>
              <th class="r">Taux</th>
              ${th('salary', 'Salaire brut', 'r')}
              <th class="r">Pourboires</th>
              ${th('hours', 'Total', 'r')}
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
              <td colspan="4">Total · ${staff.length} employés</td>
              <td class="r mono">${payMad(masse)}</td>
              <td class="r mono">${payMad(tips)}</td>
              <td class="r mono pay-total">${payMad(masse + tips)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>`;
  }

  function payPlanningHtml(staff) {
    const sched = paySched();
    const cover = PAY_DOW.map(() => 0);
    const body = staff.map(s => {
      const week = sched[s.id] || PAY_DOW.map(() => null);
      const cells = week.map((sh, d) => {
        if (sh) cover[d]++;
        const kind = payShiftKind(sh);
        const inner = sh
          ? `<span class="pay-sh-time">${sh.s}–${sh.e}</span><span class="pay-sh-h">${payShiftHours(sh).toFixed(1).replace('.0', '')} h</span>`
          : `<span class="pay-sh-rest">Repos</span>`;
        return `<button type="button" class="pay-cell ${kind}" data-action="pay-edit-shift" data-arg="${s.id}:${d}">${inner}</button>`;
      }).join('');
      const D = EQ_DEPTS[s.department] || { color: 'var(--n-400)' };
      return `
        <div class="pay-wk-row">
          <div class="pay-wk-name"><span class="pay-wk-dot" style="background:${D.color}"></span>
            <span><span class="pay-emp-n">${payEsc(s.name)}</span>
            <span class="pay-emp-r">${payEsc(s.role)}</span></span></div>
          ${cells}
        </div>`;
    }).join('');
    const head = PAY_DOW.map((d, i) => `<div class="pay-wk-hcell">${d}</div>`).join('');
    const coverRow = cover.map(c => `<div class="pay-wk-cover">${c} <span>en poste</span></div>`).join('');
    return `
      <div class="pay-section">
        <div class="pay-section-head"><h3>Planning de la semaine</h3>
          <span class="pay-section-sub">cliquez un service pour le modifier</span></div>
        <div class="pay-week">
          <div class="pay-wk-grid">
            <div class="pay-wk-row pay-wk-headrow"><div class="pay-wk-name"></div>${head}</div>
            ${body}
            <div class="pay-wk-row pay-wk-coverrow"><div class="pay-wk-name">Couverture</div>${coverRow}</div>
          </div>
        </div>
      </div>`;
  }

  /* ═══════════ EDIT-SHIFT MODAL ═══════════ */

  function payOpenShiftModal(id, day) {
    const member = payStaffAll().find(s => s.id === id);
    if (!member || !window.Kiwi || !window.Kiwi.modal) return;
    const sched = paySched();
    const cur = sched[id] && sched[id][day];
    const handle = window.Kiwi.modal({
      title: 'Modifier le service',
      tag: PAY_DOW_LONG[day],
      desc: member.name + ' · ' + member.role,
      width: 430,
      body: `
        <label class="pay-modal-rest">
          <input type="checkbox" data-pay-rest ${cur ? '' : 'checked'}/>
          <span>Jour de repos</span>
        </label>
        <div class="pay-modal-times" data-pay-times ${cur ? '' : 'hidden'}>
          <div class="kf-row">
            <div class="kf-group"><label class="kf-label">Début</label>
              <input type="time" class="kf-input" data-pay-start value="${cur ? cur.s : '09:00'}"/></div>
            <div class="kf-group"><label class="kf-label">Fin</label>
              <input type="time" class="kf-input" data-pay-end value="${cur ? cur.e : '17:00'}"/></div>
          </div>
        </div>`,
      foot: `<button class="kb ghost" data-pay-cancel>Annuler</button>
             <button class="kb primary" data-pay-save>Enregistrer</button>`,
    });
    const el = handle.el;
    const rest = el.querySelector('[data-pay-rest]');
    const times = el.querySelector('[data-pay-times]');
    rest.addEventListener('change', () => { times.hidden = rest.checked; });
    el.querySelector('[data-pay-cancel]').addEventListener('click', () => handle.close());
    el.querySelector('[data-pay-save]').addEventListener('click', () => {
      if (rest.checked) {
        sched[id][day] = null;
      } else {
        sched[id][day] = {
          s: el.querySelector('[data-pay-start]').value || '09:00',
          e: el.querySelector('[data-pay-end]').value || '17:00',
        };
      }
      handle.close();
      renderPayroll();
      window.Kiwi.toast('Planning mis à jour', { type: 'success', desc: member.name + ' · ' + PAY_DOW_LONG[day] });
    });
  }

  /* ═══════════ HANDLERS ═══════════ */

  function payWireHandlers() {
    const H = window.Kiwi && window.Kiwi.handlers;
    if (!H) { setTimeout(payWireHandlers, 30); return; }
    H['nav-payroll'] = () => payShowPage();
    const origAccueil = H['nav-accueil'];
    H['nav-accueil'] = function () {
      try { if (origAccueil) origAccueil.apply(this, arguments); } catch (_) {}
      payShowDashboard();
    };
    H['pay-edit-shift'] = (_el, arg) => {
      const i = String(arg || '').lastIndexOf(':');
      if (i < 0) return;
      payOpenShiftModal(String(arg).slice(0, i), +String(arg).slice(i + 1));
    };
    H['pay-sort'] = (_el, key) => { paySort = key || 'salary'; renderPayroll(); };
    H['pay-export'] = () => window.Kiwi.toast('Export paie généré', {
      type: 'success', desc: 'Bulletin récapitulatif · PDF envoyé au gérant',
    });
  }
  payWireHandlers();

  /* The Équipe / Menu / Paie pages override Kiwi.handlers['nav-*'] so the
   * sidebar opens the full-page views, not pages-pro.js's legacy drawers.
   * Script order is no longer guaranteed — a perf pass moved pages.js /
   * pages-pro.js to load AFTER venues.js, so they were overwriting these. Re-
   * assert once every deferred script has run (window 'load' fires after them). */
  window.addEventListener('load', function () {
    const H = window.Kiwi && window.Kiwi.handlers;
    if (!H) return;
    H['nav-equipe']  = () => eqShowPage();
    H['nav-menu']    = () => miShowPage();
    H['nav-payroll'] = () => payShowPage();
    const origAccueil = H['nav-accueil'];
    H['nav-accueil'] = function () {
      try { if (origAccueil) origAccueil.apply(this, arguments); } catch (_) {}
      eqShowDashboard();
      miShowDashboard();
      payShowDashboard();
    };
  });

  /* ═══════════════ INIT (deferred to here so STAFF is defined) ═══════════════ */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ═══════════════ SALES STORE (user-created venues) ═══════════════
   * A custom venue starts empty; the merchant rings up real sales via the
   * "Nouvelle vente" keypad. Each sale is persisted per-venue and the
   * dashboard (hero / KPI band / feed) recomputes from this store. */
  const salesSubs = new Set();
  const SALES_KEY = id => 'kiwiSales:' + id;
  function salesList(id) {
    try { const a = JSON.parse(localStorage.getItem(SALES_KEY(id || currentVenue)) || '[]'); return Array.isArray(a) ? a : []; }
    catch (_) { return []; }
  }
  function salesAdd(id, sale) {
    id = id || currentVenue;
    const list = salesList(id);
    const entry = { ts: Date.now(), amount: Math.max(0, +(sale && sale.amount) || 0), method: (sale && sale.method) || 'card' };
    list.push(entry);
    try { localStorage.setItem(SALES_KEY(id), JSON.stringify(list)); } catch (_) {}
    salesSubs.forEach(fn => { try { fn(id); } catch (_) {} });
    return entry;
  }
  function salesTotals(id) {
    const list = salesList(id);
    const revenue = list.reduce((s, x) => s + (x.amount || 0), 0);
    const count = list.length;
    return { revenue, count, basket: count ? revenue / count : 0 };
  }
  window.KiwiSales = {
    add: salesAdd,
    list: salesList,
    totals: salesTotals,
    subscribe: fn => { salesSubs.add(fn); return () => salesSubs.delete(fn); },
  };
  // Keep the sidebar "Commandes" badge in lockstep with recorded sales.
  salesSubs.add(() => renderSidebarCounts());

  /* ═══════════════ PUBLIC API ═══════════════ */

  window.KiwiVenue = {
    getVenue,
    setVenue,
    getPlan: () => currentPlan,
    subscribe,
    getVenueData,
    getCurrentVenueData,
    getVenueType,
    getKpiSpec: type => KPI_BY_TYPE[type] || KPI_BY_TYPE.restaurant,
    getHeroAiRec: id => {
      const v = id || currentVenue;
      if (isCustom(v)) {
        const W = {
          fr: { title: 'Votre tableau de bord est prêt', obs: "Aucune donnée pour l'instant — enregistrez vos ventes et Kiwi AI commencera à repérer vos heures fortes, vos marges et vos opportunités.", act: '→ Enregistrez votre première vente pour démarrer.' },
          en: { title: 'Your dashboard is ready', obs: 'No data yet — record your sales and Kiwi AI will start spotting your peak hours, margins and opportunities.', act: '→ Record your first sale to get started.' },
          ar: { title: 'لوحة التحكم جاهزة', obs: 'لا توجد بيانات بعد — سجّل مبيعاتك وسيبدأ Kiwi AI في رصد ساعات الذروة والهوامش والفرص.', act: '→ سجّل أول عملية بيع للبدء.' },
        };
        return W[fusionLang()] || W.fr;
      }
      const L = HERO_AI_REC[fusionLang()] || HERO_AI_REC.fr; return L[v] || L.cafeAtlas;
    },
    getHeatmapAiRec: id => {
      const v = id || currentVenue;
      if (isCustom(v)) {
        const W = {
          fr: { title: 'Vos heures de pointe apparaîtront ici', obs: 'Dès vos premières ventes, Kiwi AI repère vos creux et vos pics de la journée et suggère quoi lancer, et quand.', cta: '' },
          en: { title: 'Your peak hours will show up here', obs: 'As soon as you record sales, Kiwi AI spots your daily lulls and rushes and suggests what to run, and when.', cta: '' },
          ar: { title: 'ساعات الذروة ستظهر هنا', obs: 'بمجرد تسجيل مبيعاتك، يرصد Kiwi AI فترات الركود والذروة ويقترح ما الذي تطلقه ومتى.', cta: '' },
        };
        return W[fusionLang()] || W.fr;
      }
      const L = HEATMAP_AI_REC[fusionLang()] || HEATMAP_AI_REC.fr; return L[v] || L.cafeAtlas;
    },
    getMixCmiSavings: id => { const L = MIX_CMI_SAVINGS[fusionLang()] || MIX_CMI_SAVINGS.fr; return L[id || currentVenue] || L.cafeAtlas; },
    getBenchLabels: id => { const L = BENCH_LABELS[fusionLang()] || BENCH_LABELS.fr; return L[id || currentVenue] || L.cafeAtlas; },
    isFusion: () => currentVenue === 'fusion',
    isCustom,
    createVenue,
    updateVenue,
    enterFusion,
    exitFusion,
    REAL_VENUES,
    VENUES,
    KPI_BY_TYPE,
  };
})();
