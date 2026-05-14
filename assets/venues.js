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
      name: 'Vue fusionnée',
      location: '3 emplacements',
      fullDisplay: 'Vue fusionnée · 3 emplacements',
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
          pourboiresCumules:   { value: 852,  unit: 'MAD', delta: 30,   label: 'Pourboires cumulés' },
          tauxSuccesMoyen:     { value: 97.15, unit: '%',  delta: 1.2,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '68 / 32', unit: '%', delta: 3, label: 'Ratio card / cash' },
          clientsFideles:      { value: 23,   subValue: 90, delta: 18.7, label: 'Clients fidèles' },
        },
        hier: {
          transactionsTotales: { value: 251,  delta: -2.3, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 128,  unit: 'MAD', delta: 1.8,  label: 'Panier moyen pondéré' },
          pourboiresCumules:   { value: 780,  unit: 'MAD', delta: 12,   label: 'Pourboires cumulés' },
          tauxSuccesMoyen:     { value: 96.80, unit: '%',  delta: 0.8,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '67 / 33', unit: '%', delta: 2, label: 'Ratio card / cash' },
          clientsFideles:      { value: 19,   subValue: 90, delta: 8.2,  label: 'Clients fidèles' },
        },
        septJours: {
          transactionsTotales: { value: 1820, delta: 18.4, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 135,  unit: 'MAD', delta: 6.1,  label: 'Panier moyen pondéré' },
          pourboiresCumules:   { value: 5940, unit: 'MAD', delta: 28,   label: 'Pourboires cumulés' },
          tauxSuccesMoyen:     { value: 97.42, unit: '%',  delta: 1.5,  label: 'Taux succès moyen' },
          ratioCardCash:       { value: '69 / 31', unit: '%', delta: 4, label: 'Ratio card / cash' },
          clientsFideles:      { value: 142,  subValue: 312, delta: 22.4, label: 'Clients fidèles' },
        },
        trenteJours: {
          transactionsTotales: { value: 7820, delta: 21.2, label: 'Transactions totales' },
          panierMoyenPondere:  { value: 138,  unit: 'MAD', delta: 8.4,  label: 'Panier moyen pondéré' },
          pourboiresCumules:   { value: 24800, unit: 'MAD', delta: 32,  label: 'Pourboires cumulés' },
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
      { key: 'tips',       label: 'Pourboires',        i18n: 'dash.kpi.tips' },
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
      { key: 'tips',       label: 'Pourboires',        i18n: 'dash.kpi.tips' },
      { key: 'success',    label: 'Taux remplissage',  i18n: 'dash.kpi.fillRate' },
      { key: 'ratio',      label: 'Ratio card / cash', i18n: 'dash.kpi.ratio' },
      { key: 'regulars',   label: 'Clients fidèles',   i18n: 'dash.kpi.loyalCustomers' },
    ],
    // Fusion = portfolio-wide KPIs. Same six tiles render in the band, but
    // the values are aggregated sums (see dateRange.js · vData fusion path).
    fusion: [
      { key: 'tx',         label: 'Transactions totales', i18n: 'dash.kpi.tx' },
      { key: 'panier',     label: 'Panier moyen pondéré', i18n: 'dash.kpi.basket' },
      { key: 'tips',       label: 'Pourboires cumulés',   i18n: 'dash.kpi.tips' },
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
  };

  const HEATMAP_AI_REC = {
    cafeAtlas: {
      title: 'Lancer un combo livraison Glovo pour 15h–17h',
      obs: "Pendant cette fenêtre creuse, votre salle tourne à 22 % de capacité mais l'équipe reste disponible. Un combo Tajine kefta + thé à la menthe à 75 MAD sur Glovo capte typiquement 8–12 commandes par après-midi dans les cafés similaires de Maarif.",
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
  };

  /* Mix CMI savings · fusion sums the 3 venues' monthly savings */
  /* Bench labels · fusion override */

  /* Mix de paiement bottom callout — savings vs CMI scales with revenue */
  const MIX_CMI_SAVINGS = {
    cafeAtlas:     '~3 900 MAD ce mois',
    maisonMansour: '~1 700 MAD ce mois',
    spaBahia:     '~1 350 MAD ce mois',
    fusion:        '~6 950 MAD ce mois · 3 sites',
  };

  /* Vous vs … benchmark labels */
  const BENCH_LABELS = {
    cafeAtlas:     { title: 'Vous vs cafés similaires',     sub: '147 cafés casablancais · même gamme de ticket moyen' },
    maisonMansour: { title: 'Vous vs boutiques similaires', sub: '89 boutiques marocaines · gamme premium' },
    spaBahia:     { title: 'Vous vs spas similaires',      sub: '42 spas haut de gamme · Casa / Marrakech' },
    fusion:        { title: 'Portfolio vs marchands multi-sites', sub: '38 marchands Kiwi · 3+ emplacements actifs' },
  };

  /* ═══════════════ STATE ═══════════════ */

  const getVenue = () => currentVenue;
  const getVenueData = id => VENUES[id] || VENUES[currentVenue];
  const getCurrentVenueData = () => VENUES[currentVenue];
  const getVenueType = id => (VENUES[id] || VENUES[currentVenue])?.type;

  function setVenue(id) {
    if (!VALID.includes(id)) return;
    if (id === currentVenue) return;
    // Switching to a real venue from anywhere → ensure fusion-mode class is off.
    // (Switching INTO fusion goes through enterFusion(), not setVenue.)
    if (REAL_VENUES.includes(id)) document.body.classList.remove('fusion-mode');
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
    // Chevron rotation tied to dropdownOpen handled in toggleDropdown()
  }

  /* ═══════════════ RENDER: SIDEBAR DROPDOWN ═══════════════ */

  // Type-icon SVG used inside each dropdown row
  const TYPE_ICONS = {
    restaurant: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h2v11M11 2v20M11 11h8a3 3 0 003-3V4M19 4v17"/></svg>',
    boutique:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>',
    spa:        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z"/></svg>',
  };

  function renderDropdown() {
    const wrap = document.querySelector('[data-venue-dropdown]');
    if (!wrap) return;
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
            <div class="va-title">Revenir à la vue simple</div>
            <div class="va-sub" style="font-size:11px;color:var(--n-500);margin-top:1px;">Repasser sur un seul emplacement</div>
          </div>
        </button>
      ` : `
        <button type="button" class="venue-action fusion-cta" data-action="venue-enter-fusion">
          <div class="va-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8 8l3.5 7M16 8l-3.5 7"/></svg>
          </div>
          <div class="va-body">
            <div class="va-title">Fusionner les 3 emplacements</div>
            <div class="va-sub">Vue consolidée · données multi-sites</div>
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
    return `
      <div class="fusion-kpis">
        <div class="fk-head"><i></i>VUE PORTFOLIO</div>
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
    const el = document.querySelector('[data-demo-account]');
    if (el) el.textContent = VENUES[currentVenue].name;
  }
  function renderFooter() {
    const el = document.querySelector('[data-footer-line]');
    if (!el) return;
    const v = VENUES[currentVenue];
    const lang = window.KiwiI18n?.getLang?.() || 'fr';
    const T = window.KiwiI18n?.T?.[lang] || {};
    const sponsor = T['dash.footer.sponsor'] || 'opéré sous sponsoring Bank Al-Maghrib';
    const help = T['dash.footer.help'] || 'aide WhatsApp';
    el.innerHTML = `${v.name} · ICE ${v.ice} · ${sponsor} · Kiwi v2.38.1 · <a href="#">${help}</a>`;
  }

  /* ═══════════════ RENDER: SIDEBAR COUNTS ═══════════════ */

  function renderSidebarCounts() {
    const txCountEl = document.querySelector('a[data-nav="transactions"] .count');
    if (txCountEl) {
      // Pull the live count from the demo clock so this badge stays in lockstep
      // with the dashboard's Commandes KPI tile. If the clock isn't running yet
      // (initial paint before the simulator's first tick), fall back to the
      // venue's end-of-day target so the badge isn't empty.
      const live = window.KiwiDemoClock?.getSimState?.()?.cumTx;
      txCountEl.textContent = String(live != null ? live : VENUES[currentVenue].txCount);
    }
    const staffCountEl = document.querySelector('a[data-nav="equipe"] .count');
    if (staffCountEl) staffCountEl.textContent = String(VENUES[currentVenue].staffCount);
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

  // Build the overlay's internal markup the first time we activate. We keep
  // the orbs/sigil/particles as raw DOM so the choreography is idempotent
  // (re-trigger by toggling .active off → animation reflows on next entry).
  function buildOverlayMarkup(overlay) {
    // Particle burst — 18 dots fanned around the impact point at random radii.
    const particles = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const dist = 180 + Math.random() * 240;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const delay = 0.35 + Math.random() * 0.15;
      particles.push(
        `<div class="fo-particle" style="--px:${px.toFixed(1)}px;--py:${py.toFixed(1)}px;animation-delay:${delay.toFixed(2)}s;"></div>`
      );
    }
    overlay.innerHTML = `
      <div class="fo-stars"></div>
      <div class="fo-crt-seed"></div>
      <div class="fo-crt-line top"></div>
      <div class="fo-crt-line bot"></div>
      <div class="fo-flash"></div>
      ${particles.join('')}
      <div class="fo-label">
        FUSION ACTIVE
        <span class="fo-label-sub">3 emplacements · vue consolidée</span>
      </div>
      <div class="fo-sweep"></div>
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

    // Reset + build a fresh markup so animations replay from t=0.
    overlay.classList.remove('exiting');
    buildOverlayMarkup(overlay);
    // Force reflow before flipping .active so transitions trigger cleanly.
    overlay.offsetHeight;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    /* Choreography timeline (matches CSS keyframes):
     *   t=0.00  overlay fades in, starfield drifts
     *   t=0.05  CRT hairline ignites + extends across vertical center
     *   t=0.55  two CRT lines split — top and bottom slide apart (TV-on)
     *   t=1.25  flash + particle burst at impact (lines have cleared screen)
     *   t=1.60  mono "FUSION ACTIVE" label fades in
     *   t=1.80  Majorelle diagonal sweep + theme/data swap UNDER overlay
     *   t=2.55  overlay fades out, dashboard fully revealed
     *   t=3.15  cleanup
     */

    // Swap palette + data during the sweep, so when the overlay fades the
    // dashboard already wears Majorelle. The sweep visually paints it.
    setTimeout(() => {
      document.body.classList.add('fusion-mode');
      // Engage the existing dark theme so every modal/drawer/menu (defined
      // in theme.css) re-skins automatically. body.fusion-mode then layers
      // Majorelle brand tokens on top of the dark surface tokens.
      document.documentElement.setAttribute('data-theme', 'dark');
      currentVenue = 'fusion';
      try { localStorage.setItem(STORAGE_KEY, 'fusion'); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn('fusion'); } catch (_) {} });
    }, 1800);

    // Fade overlay back out, then clear markup.
    setTimeout(() => {
      overlay.classList.add('exiting');
      overlay.classList.remove('active');
    }, 2550);
    setTimeout(() => {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '';
      overlay.classList.remove('exiting');
      fusionAnimating = false;
    }, 3150);
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

    // Inverse CRT sequence — two lines slide in from the edges to meet at
    // center, the seed ignites and collapses to a point, then theme reverts.
    overlay.classList.remove('exiting');
    overlay.innerHTML = `
      <div class="fo-stars"></div>
      <div class="fo-crt-line top-exit"></div>
      <div class="fo-crt-line bot-exit"></div>
      <div class="fo-crt-seed exit"></div>
    `;
    overlay.offsetHeight; // reflow → animations replay
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    /* Exit choreography:
     *   t=0.00  overlay fades in dark over the fusion dashboard
     *   t=0.10  two CRT lines slide IN from top + bottom edges → meet at center
     *   t=0.85  seed ignites at center, pulses brightest at t=1.20
     *   t=1.45  seed collapses horizontally to a point + theme/data swap UNDER overlay
     *   t=1.95  overlay fades out, restored single-venue dashboard revealed
     *   t=2.55  cleanup
     */

    setTimeout(() => {
      document.body.classList.remove('fusion-mode');
      document.documentElement.removeAttribute('data-theme');
      currentVenue = nextVenue;
      try { localStorage.setItem(STORAGE_KEY, currentVenue); } catch (_) {}
      renderAll();
      subscribers.forEach(fn => { try { fn(currentVenue); } catch (_) {} });
    }, 1450);

    setTimeout(() => {
      overlay.classList.add('exiting');
      overlay.classList.remove('active');
    }, 1950);
    setTimeout(() => {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '';
      overlay.classList.remove('exiting');
      fusionAnimating = false;
    }, 2550);
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
    aujourdhui:  'vs hier',
    hier:        'vs avant-hier',
    septJours:   'vs 7 jours précédents',
    trenteJours: 'vs 30 jours précédents',
  };
  const FUSION_HERO_LABELS = {
    aujourdhui:  "ENCAISSÉ AUJOURD'HUI · PORTEFEUILLE",
    hier:        'ENCAISSÉ HIER · PORTEFEUILLE',
    septJours:   'ENCAISSÉ 7 JOURS · PORTEFEUILLE',
    trenteJours: 'ENCAISSÉ 30 JOURS · PORTEFEUILLE',
  };

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
            <path d="${pathSpa}"     fill="var(--mint)"      opacity="0.40"/>
            <path d="${pathMansour}" fill="var(--atlas-600)" opacity="0.50"/>
            <path d="${pathAtlas}"   fill="var(--atlas)"     opacity="0.60"/>
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
    if (heroLabel) heroLabel.textContent = FUSION_HERO_LABELS[range] || FUSION_HERO_LABELS.aujourdhui;
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
      const lbl = FUSION_DELTA_LABELS[range];
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
      const lbl = FUSION_DELTA_LABELS[range];
      const txVal     = isToday && live ? live.portfolio.tx          : kpis.transactionsTotales.value;
      const panierVal = isToday && live ? live.portfolio.panierMoyen : kpis.panierMoyenPondere.value;
      const tipsVal   = isToday && live ? Math.round(live.portfolio.tips) : kpis.pourboiresCumules.value;
      const cards = [
        { key: 'tx',      label: kpis.transactionsTotales.label, value: txVal,                                  unit: '',                                        delta: kpis.transactionsTotales.delta },
        { key: 'panier',  label: kpis.panierMoyenPondere.label,  value: panierVal,                              unit: kpis.panierMoyenPondere.unit || 'MAD',     delta: kpis.panierMoyenPondere.delta },
        { key: 'tips',    label: kpis.pourboiresCumules.label,   value: tipsVal,                                unit: kpis.pourboiresCumules.unit || 'MAD',      delta: kpis.pourboiresCumules.delta },
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
                  <span><i style="background:var(--atlas)"></i> Café Atlas</span>
                  <span><i style="background:var(--atlas-600)"></i> Maison Mansour</span>
                  <span><i style="background:var(--mint)"></i> Spa Bahia</span>
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
              <span><i style="background:var(--atlas)"></i> Café Atlas</span>
              <span><i style="background:var(--atlas-600)"></i> Maison Mansour</span>
              <span><i style="background:var(--mint)"></i> Spa Bahia</span>
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
            <span><i style="background:var(--atlas)"></i> Café Atlas</span>
            <span><i style="background:var(--atlas-600)"></i> Maison Mansour</span>
            <span><i style="background:var(--mint)"></i> Spa Bahia</span>
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
    currentVenue = REAL_VENUES.includes(stored) ? stored : DEFAULT_VENUE;
    // Defensive: strip any stale fusion-mode class + dark theme attribute.
    document.body.classList.remove('fusion-mode');
    document.documentElement.removeAttribute('data-theme');

    registerHandlers();
    setupDropdownClosers();
    hookI18n();
    renderAll({ skipFade: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ═══════════════ PUBLIC API ═══════════════ */

  window.KiwiVenue = {
    getVenue,
    setVenue,
    subscribe,
    getVenueData,
    getCurrentVenueData,
    getVenueType,
    getKpiSpec: type => KPI_BY_TYPE[type] || KPI_BY_TYPE.restaurant,
    getHeroAiRec: id => HERO_AI_REC[id || currentVenue] || HERO_AI_REC.cafeAtlas,
    getHeatmapAiRec: id => HEATMAP_AI_REC[id || currentVenue] || HEATMAP_AI_REC.cafeAtlas,
    getMixCmiSavings: id => MIX_CMI_SAVINGS[id || currentVenue] || MIX_CMI_SAVINGS.cafeAtlas,
    getBenchLabels: id => BENCH_LABELS[id || currentVenue] || BENCH_LABELS.cafeAtlas,
    isFusion: () => currentVenue === 'fusion',
    enterFusion,
    exitFusion,
    REAL_VENUES,
    VENUES,
    KPI_BY_TYPE,
  };
})();
