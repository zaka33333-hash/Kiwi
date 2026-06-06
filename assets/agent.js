/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Financial assistant  (Assistant financier · المساعد المالي)
 * A hybrid agent + calculator surface, built for the owner of Café Atlas.
 * It "knows" the café — revenue, cost of goods, fixed charges, margins,
 * cash on hand — and turns plain-language questions into real numbers:
 * hiring, price changes, investments, break-even, forecasts.
 *
 * Tri-lingual: follows the dashboard language (fr / en / ar) and flips to
 * RTL for Arabic. Strings live in the T dictionary below.
 *   ⚠ AR strings are best-effort MSA — flagged for native review.
 *
 * Pure vanilla. Opens as a fullpage drawer from the topbar or ⌘K.
 * No backend: the "intelligence" is a deterministic scenario engine that
 * computes against the business profile below.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ─────────────── BUSINESS PROFILE · Café Atlas · Maarif ───────────────
   * Monthly figures (MAD), aligned with the dashboard's 30-day revenue
   * chart total (842 300 MAD) and the KPI band. The agent reasons entirely
   * off this object. opex keys are stable IDs — labels come from T.opex. */
  const ATLAS = {
    name: 'Café Atlas · Maarif',
    revenue: 842300,
    cogs: 261000,
    grossProfit: 581300,
    grossMargin: 69.0,
    opex: {
      salaries: 218000,
      rent: 56000,
      utilities: 28000,
      marketing: 19000,
      maintenance: 14500,
      insurance: 15000,
      financing: 42000,
      subscription: 699,
    },
    totalOpex: 393199,
    netProfit: 188101,
    netMargin: 22.3,
    avgBasket: 142,
    ordersPerMonth: 5931,
    ordersPerDay: 198,
    daysOpen: 30,
    cashBuffer: 465000,
    contribRatio: 0.69,
    mtdRevenue: 462000,
    mtdDays: 16,
    daysInMonth: 31,
    staffCount: 8,
  };
  ATLAS.dailyRev = ATLAS.revenue / ATLAS.daysOpen;
  ATLAS.dailyNet = ATLAS.netProfit / ATLAS.daysOpen;
  ATLAS.netPerOrder = ATLAS.netProfit / ATLAS.ordersPerMonth;
  ATLAS.breakEvenRev = ATLAS.totalOpex / ATLAS.contribRatio;
  ATLAS.breakEvenOrdersDay = ATLAS.breakEvenRev / ATLAS.avgBasket / ATLAS.daysOpen;
  ATLAS.marginOfSafety = (ATLAS.revenue - ATLAS.breakEvenRev) / ATLAS.revenue * 100;

  /* ─────────────── ACTIVE BUSINESS PROFILE ───────────────
   * The agent reasons off `B`. For Café Atlas (and the demo venues) `B` is
   * the full ATLAS model above. For a user-created venue there is no cost
   * structure yet — so `B` becomes a PARTIAL profile built only from the
   * merchant's own recorded sales (KiwiSales). Cost-dependent scenarios then
   * degrade honestly instead of quoting Café Atlas's numbers.
   * Principle (KIWI_AI_ROADMAP.md): never emit a number we don't have. */
  let B = ATLAS;

  function buildProfile() {
    const KV = window.KiwiVenue;
    if (!KV || typeof KV.isCustom !== 'function' || !KV.isCustom()) return ATLAS;
    const vd = (KV.getCurrentVenueData && KV.getCurrentVenueData()) || {};
    const vid = KV.getVenue ? KV.getVenue() : null;
    const tot = (window.KiwiSales && window.KiwiSales.totals)
      ? window.KiwiSales.totals(vid) : { revenue: 0, count: 0, basket: 0 };
    const nm = vd.fullDisplay || [vd.name, vd.location].filter(Boolean).join(' · ') || 'Votre établissement';
    return {
      partial: true,
      name: nm,
      revenue: tot.revenue,
      ordersPerMonth: tot.count,
      ordersPerDay: 0,
      avgBasket: tot.basket,
      daysOpen: 30,
      dailyRev: tot.revenue / 30,
      /* cost structure unknown until the merchant records it */
      cogs: null, grossProfit: null, grossMargin: null,
      opex: {}, totalOpex: null, netProfit: null, netMargin: null,
      cashBuffer: null, staffCount: null, contribRatio: null,
      dailyNet: null, netPerOrder: null,
      breakEvenRev: null, breakEvenOrdersDay: null, marginOfSafety: null,
      mtdRevenue: tot.revenue, mtdDays: 1, daysInMonth: 30,
    };
  }
  function syncProfile() { B = buildProfile(); return B; }

  /* ─────────────── LANGUAGE ─────────────── */
  function getLang() {
    const l = window.KiwiI18n && window.KiwiI18n.getLang && window.KiwiI18n.getLang();
    return (l === 'en' || l === 'ar') ? l : 'fr';
  }
  let L = 'fr';   // resolved at open()

  /* Language of one specific question — the assistant's free-text answer must
   * match it even when the dashboard UI runs in another language. Arabic
   * script wins outright; otherwise FR vs EN on common function words; a tie
   * falls back to the UI language. */
  function detectQLang(text) {
    const t = String(text || '');
    if (/[؀-ۿ]/.test(t)) return 'ar';
    const s = ' ' + t.toLowerCase().replace(/[^a-zà-ÿ ]/g, ' ') + ' ';
    let fr = 0, en = 0;
    ['le','la','les','une','des','du','mon','ma','mes','est','sont','quel','quels','quelle','combien','pour','avec','je','pas','ne','ca'].forEach((w) => { if (s.indexOf(' ' + w + ' ') >= 0) fr++; });
    ['the','an','my','is','are','what','how','much','many','with','does','best','worst','show','which','items','your'].forEach((w) => { if (s.indexOf(' ' + w + ' ') >= 0) en++; });
    if (en > fr) return 'en';
    if (fr > en) return 'fr';
    return getLang();
  }

  /* ─────────────── FORMATTING ─────────────── */
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
  const fmtMad = (n) => fmt(n) + ' MAD';
  const fmt1 = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escAttr = (s) => String(s).replace(/"/g, '&quot;');
  // Arabic-Indic / Persian digits → ASCII, so number parsing works in AR.
  const fixDigits = (s) => String(s)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06F0);

  /* ═══════════════ STRING DICTIONARY ═══════════════
   * Every user-facing string, in fr / en / ar. Interpolated strings are
   * functions; computed numbers are passed in already formatted-ready. */
  const T = {
    fr: {
      ui: {
        title: 'Assistant financier',
        subtitle: 'Il connaît votre café — revenus, charges, marges, trésorerie',
        placeholder: 'Posez une question — embauche, prix, investissement, prévision…',
        calc: 'Calculatrice', enterToSend: 'Entrée pour envoyer', send: 'Envoyer',
        kpError: 'Erreur', kpUse: 'Utiliser ce résultat',
        ctxEyebrow: 'Ce que je sais',
        ctxSub: '30 derniers jours · cliquez pour insérer',
        ctxNote: 'Cliquez un chiffre pour l’ajouter à votre message — l’assistant raisonnera dessus.',
        ctxTrust: 'Tout s’exécute en local. Aucune donnée ne quitte cet appareil.',
        gActivity: 'Activité', gProfit: 'Rentabilité', gFixed: 'Charges fixes', gCash: 'Trésorerie & équipe',
        perMonth: '/ mois', days: 'j', employees: (n) => `${n} employés`,
      },
      facts: {
        revenue: 'Chiffre d’affaires', revPerDay: 'CA par jour', mtdRev: 'CA du mois en cours',
        ordersMonth: 'Commandes / mois', ordersDay: 'Commandes / jour', basket: 'Panier moyen',
        grossMargin: 'Marge brute', cogs: 'Coût matière', profitPerOrder: 'Bénéfice par commande',
        breakEven: 'Seuil de rentabilité', cashAvail: 'Trésorerie disponible', headcount: 'Effectif',
        netProfit: 'Bénéfice net', netMarginLine: (m) => `marge nette ${m} %`,
      },
      opex: {
        salaries: 'Masse salariale', rent: 'Loyer', utilities: 'Eau · électricité · gaz',
        marketing: 'Marketing & divers', maintenance: 'Entretien & équipement',
        insurance: 'Assurances & taxes', financing: 'Amortissement & prêt', subscription: 'Abonnement Kiwi POS',
      },
      chips: {
        hire: 'Puis-je embaucher un serveur ?', price5: 'Et si j’augmente mes prix de 5 % ?',
        breakeven: 'Quel est mon seuil de rentabilité ?', forecast: 'Prévision de bénéfice ce mois',
        charges: 'Décompose mes charges', invest80: 'Puis-je investir 80 000 MAD ?',
        invest150: 'Puis-je investir 150 000 MAD ?',
      },
      hire: {
        text: (c) => `Une embauche à <b>${fmtMad(c)}/mois</b> en coût chargé représente <b>${fmtMad(c * 12)}/an</b>.`,
        s1l: 'Pour s’autofinancer', s1v: (o) => `${fmt1(o / 30)} cmd/jour`, s1h: (o) => `soit ${fmt(o)} commandes/mois`,
        s2l: 'CA additionnel requis', s2h: 'au panier moyen actuel',
        s3l: 'Bénéfice net après', s3h: () => `vs ${fmtMad(B.netProfit)} aujourd’hui`,
        s4l: 'Part du bénéfice', s4h: 'de votre résultat mensuel',
        vGood: (o) => `Favorable — il suffit de ${fmt1(o / 30)} commandes en plus par jour pour absorber ce poste. Votre marge le permet largement.`,
        vWarn: 'Faisable, mais ce poste pèse lourd dans le résultat. Assurez-vous que l’embauche génère bien du chiffre additionnel.',
        vBad: 'Prudence — ce coût dépasse votre marge de manœuvre actuelle. À envisager seulement avec une hausse d’activité confirmée.',
        note: 'Hypothèse : 7 200 MAD/mois en coût chargé pour un serveur (salaire net + CNSS + primes). Indiquez un montant précis pour affiner.',
      },
      price: {
        text: (p) => `Une ${p >= 0 ? 'hausse' : 'baisse'} de <b>${fmt1(Math.abs(p))} %</b> sur l’ensemble de la carte, à volume constant, ne touche pas le coût matière — l’écart tombe presque entièrement dans le résultat.`,
        s1l: 'Bénéfice net /mois', s1h: (d) => `${d >= 0 ? '+' : ''}${fmtMad(d)}`,
        s2l: 'Effet sur 12 mois', s2h: 'à activité égale',
        s3l: 'Nouvelle marge nette', s3h: () => `vs ${fmt1(B.netMargin)} % aujourd’hui`,
        s4l: 'Nouveau CA /mois', s4h: (b) => `panier moyen ${fmtMad(b)}`,
        vUp: (p, d) => `Levier puissant — ${fmt1(p)} % de prix en plus = ${fmtMad(d)} de bénéfice mensuel sans dépense supplémentaire.`,
        vDown: (need) => `Une baisse de prix ne se finance que par du volume : il faudrait +${fmt1(need)} % de commandes pour préserver le résultat.`,
        note: 'Calcul à volume constant. En pratique une hausse de prix réduit souvent la fréquentation de 2 à 4 % — surveillez le nombre de commandes les deux semaines suivantes.',
        noteAssumed: ' (Hypothèse : 5 %.)',
      },
      afford: {
        ask: 'Indiquez le montant de l’investissement et je vous dis s’il est à votre portée — par exemple : <i>« puis-je investir 80 000 MAD dans une terrasse ? »</i>',
        text: (a) => `Un investissement de <b>${fmtMad(a)}</b> se compare à votre trésorerie disponible (${fmtMad(B.cashBuffer)}) et à votre bénéfice net (${fmtMad(B.netProfit)}/mois).`,
        s1l: 'Récupéré en', s1v: (m) => `${fmt1(m)} mois`, s1h: 'avec le bénéfice net actuel',
        s2l: 'Trésorerie après', s2hOk: (p) => `${fmt1(p)} % engagés`, s2hNo: 'financement nécessaire',
        s3l: 'Équivalent', s3v: (d) => `${fmt1(d)} jours`, s3h: 'de bénéfice d’exploitation',
        s4l: 'Poids annuel', s4h: 'du bénéfice sur 12 mois',
        vGood: (m, cash) => `Abordable — payable comptant, amorti en ${fmt1(m)} mois, et il reste ${fmtMad(cash)} de trésorerie.`,
        vWarn: (m, p) => `Payable comptant, mais l’amortissement prend ${fmt1(m)} mois et mobilise ${fmt1(p)} % de votre trésorerie — gardez un coussin de sécurité.`,
        vBad: () => `Au-delà de votre trésorerie disponible (${fmtMad(B.cashBuffer)}). Un financement, ou un étalement, serait nécessaire.`,
      },
      forecast: {
        text: (run) => `Sur vos <b>${B.mtdDays} premiers jours du mois</b> (${fmtMad(B.mtdRevenue)} encaissés), le rythme est de <b>${fmtMad(run)}/jour</b>.`,
        s1l: 'CA projeté · mois', s1h: () => `${B.daysInMonth} jours`,
        s2l: 'Bénéfice projeté · mois', s2h: () => `marge nette ${fmt1(B.netMargin)} %`,
        s3l: 'CA projeté · 12 mois', s3h: 'au rythme actuel',
        s4l: 'Bénéfice · 12 mois', s4h: 'avant impôt sur les sociétés',
        vGood: (v) => `Tendance positive — le mois dépasse votre moyenne 30 jours de ${fmt1(v)} %. Si le rythme tient, c’est votre meilleur mois.`,
        vWarn: (v) => `Le mois est ${fmt1(v)} % sous votre moyenne 30 jours — un coup d’accélérateur sur les soirs de week-end remettrait la barre.`,
        note: 'Projection linéaire : un jour férié, un week-end pluvieux ou une opération spéciale peuvent faire varier le résultat réel.',
      },
      breakeven: {
        text: () => `Votre point mort — le chiffre d’affaires qui couvre exactement vos charges fixes (${fmtMad(B.totalOpex)}) avec une marge sur coûts variables de ${fmt1(B.contribRatio * 100)} %.`,
        s1l: 'Seuil · CA mensuel', s1h: () => `vs ${fmtMad(B.revenue)} réalisé`,
        s2l: 'Seuil · commandes/jour', s2h: () => `vs ${fmt(B.ordersPerDay)} aujourd’hui`,
        s3l: 'Marge de sécurité', s3h: 'chute d’activité absorbable',
        s4l: 'Seuil · CA journalier', s4h: () => `vs ${fmtMad(B.dailyRev)} réalisé`,
        vGood: () => `Position solide — vous opérez ${fmt1(B.marginOfSafety)} % au-dessus du point mort. Il faudrait perdre près d’un tiers de l’activité pour être à l’équilibre.`,
      },
      margin: {
        text: 'Vos deux marges, sur les 30 derniers jours :',
        s1l: 'Marge brute', s1h: () => `${fmtMad(B.grossProfit)} après coût matière`,
        s2l: 'Marge nette', s2h: () => `${fmtMad(B.netProfit)} après toutes charges`,
        s3l: 'Coût matière', s3h: () => fmtMad(B.cogs),
        s4l: 'Bénéfice par commande', s4h: () => `panier moyen ${fmtMad(B.avgBasket)}`,
        vGood: () => `Marge nette de ${fmt1(B.netMargin)} % — nettement au-dessus de la moyenne du secteur café-restauration (8 à 12 %). Votre coût matière est bien tenu.`,
        note: 'La marge brute mesure la rentabilité de la carte ; la marge nette, celle de toute l’exploitation.',
      },
      charges: {
        text: () => `Vos charges fixes mensuelles totalisent <b>${fmtMad(B.totalOpex)}</b>, auxquelles s’ajoute le coût matière (${fmtMad(B.cogs)}).`,
        share: (p) => `${fmt1(p)} % des charges`,
        verdict: (name, p) => `« ${name} » est votre premier poste (${fmt1(p)} % des charges) — c’est là que se trouve votre principal levier d’optimisation.`,
      },
      revenue: {
        text: 'Votre activité sur les 30 derniers jours :',
        s1l: 'Chiffre d’affaires', s1h: '30 derniers jours',
        s2l: 'CA moyen /jour', s2h: () => `${fmt(B.ordersPerDay)} commandes`,
        s3l: 'Commandes /mois', s3h: () => `panier moyen ${fmtMad(B.avgBasket)}`,
        s4l: 'Bénéfice net /mois', s4h: () => `marge nette ${fmt1(B.netMargin)} %`,
      },
      profit: {
        text: 'Votre résultat, une fois toutes les charges payées :',
        s1l: 'Bénéfice net /mois', s1h: () => `marge nette ${fmt1(B.netMargin)} %`,
        s2l: 'Bénéfice net /jour', s2h: () => `${B.daysOpen} jours d’ouverture`,
        s3l: 'Bénéfice par commande', s3h: () => `sur ${fmtMad(B.avgBasket)} de panier`,
        s4l: 'Bénéfice projeté /an', s4h: 'au rythme actuel',
        vGood: () => `Café rentable et sain : vous dégagez ${fmtMad(B.dailyNet)} de bénéfice net par jour d’ouverture.`,
      },
      help: {
        text: 'Bonjour Rachid. Je suis votre assistant financier — je connais Café Atlas : chiffre d’affaires, coût matière, charges, marges et trésorerie. Posez-moi une question chiffrée et je calcule l’impact réel sur votre résultat ; pour une question ouverte sur la gestion de votre café, je peux activer un assistant IA dans votre navigateur. Par exemple :',
      },
      calc: { title: 'Calcul', result: 'résultat' },
      llm: {
        noGpu: 'Cette question sort de mes calculs — je suis votre copilote chiffres : embauche, prix, investissement, seuil de rentabilité, prévisions, marges et charges. Demandez-moi l’un de ceux-là et la réponse arrive aussitôt. Et pour savoir quels articles de votre menu marchent — ou non — ouvrez la page Menu du tableau de bord.',
        loading: (p) => `Mon assistant IA finit de se charger (${p} %). Je réponds dès qu’il est prêt.`,
        offerLead: 'Cette question sort de mes calculs prédéfinis — mais je peux y répondre librement avec un <b>assistant IA open-source</b> qui s’exécute <b>entièrement dans votre navigateur</b> : aucune donnée ne part ailleurs.',
        offerSize: (sz) => `Premier lancement : un téléchargement unique de ${sz}, ensuite instantané.`,
        activate: 'Activer l’assistant IA',
        installing: 'Installation de l’assistant IA — modèle open-source exécuté dans votre navigateur.',
        initializing: 'Initialisation…',
        ready: 'Assistant IA prêt.',
        readyMsg: 'Mon assistant IA est prêt. Posez-moi vos questions sur la gestion, les finances, l’équipe ou le marketing de votre café — je reste concentré sur votre activité.',
        loadFail: 'Échec du chargement.',
        loadFailMsg: 'Je n’ai pas pu charger l’assistant IA (connexion, mémoire ou navigateur incompatible). Mes calculs financiers restent pleinement disponibles.',
        runErr: 'Une erreur est survenue côté assistant IA. Réessayez, ou demandez-moi un calcul précis.',
      },
      acct: {
        hub: 'Je suis aussi votre comptable, teneur de livres, fiscaliste et gestionnaire de paie — tout est réuni dans votre Comptabilité : livre, états financiers, TVA & impôts, et paie.',
        tva: (D) => `Je m'occupe de votre fiscalité. Pour ${D.period} : TVA à payer <b>${fmtMad(D.tva.aPayer)}</b>, échéance ${D.tva.echeance}. IS estimé sur l'exercice : ${fmtMad(D.is.estimeAnnuel)}. J'ouvre le module pour préparer la déclaration.`,
        paie: (D) => `Côté paie : <b>${D.payroll.headcount} salariés</b>, ${fmtMad(D.payroll.totalNet)} net à verser pour ${D.period}. La déclaration CNSS est due le ${D.payroll.echeance} — je peux générer les fiches.`,
        etats: (D) => `Vos états de ${D.period} : résultat net <b>${fmtMad(D.netProfit)}</b>, trésorerie ${fmtMad(D.cash)}, bilan équilibré. J'ouvre vos états financiers.`,
        livre: (D) => `<b>${fmt(D.entriesThisMonth)} écritures</b> ce mois — chaque vente et chaque dépense, enregistrée et catégorisée automatiquement.`,
      },
    },

    en: {
      ui: {
        title: 'Financial assistant',
        subtitle: 'It knows your café — revenue, costs, margins, cash',
        placeholder: 'Ask a question — hiring, pricing, investment, forecast…',
        calc: 'Calculator', enterToSend: 'Enter to send', send: 'Send',
        kpError: 'Error', kpUse: 'Use this result',
        ctxEyebrow: 'What I know',
        ctxSub: 'Last 30 days · click to insert',
        ctxNote: 'Click any figure to add it to your message — the assistant will reason on it.',
        ctxTrust: 'Everything runs locally. No data leaves this device.',
        gActivity: 'Activity', gProfit: 'Profitability', gFixed: 'Fixed costs', gCash: 'Cash & team',
        perMonth: '/ month', days: 'd', employees: (n) => `${n} employees`,
      },
      facts: {
        revenue: 'Revenue', revPerDay: 'Revenue per day', mtdRev: 'Month-to-date revenue',
        ordersMonth: 'Orders / month', ordersDay: 'Orders / day', basket: 'Average basket',
        grossMargin: 'Gross margin', cogs: 'Cost of goods', profitPerOrder: 'Profit per order',
        breakEven: 'Break-even point', cashAvail: 'Cash available', headcount: 'Headcount',
        netProfit: 'Net profit', netMarginLine: (m) => `net margin ${m} %`,
      },
      opex: {
        salaries: 'Payroll', rent: 'Rent', utilities: 'Water · electricity · gas',
        marketing: 'Marketing & misc.', maintenance: 'Maintenance & equipment',
        insurance: 'Insurance & taxes', financing: 'Depreciation & loan', subscription: 'Kiwi POS subscription',
      },
      chips: {
        hire: 'Can I hire a waiter?', price5: 'What if I raise prices 5%?',
        breakeven: 'What is my break-even point?', forecast: 'Profit forecast this month',
        charges: 'Break down my costs', invest80: 'Can I invest 80,000 MAD?',
        invest150: 'Can I invest 150,000 MAD?',
      },
      hire: {
        text: (c) => `A hire at <b>${fmtMad(c)}/month</b> loaded cost works out to <b>${fmtMad(c * 12)}/year</b>.`,
        s1l: 'To pay for itself', s1v: (o) => `${fmt1(o / 30)} orders/day`, s1h: (o) => `i.e. ${fmt(o)} orders/month`,
        s2l: 'Extra revenue needed', s2h: 'at the current average basket',
        s3l: 'Net profit after', s3h: () => `vs ${fmtMad(B.netProfit)} today`,
        s4l: 'Share of profit', s4h: 'of your monthly result',
        vGood: (o) => `Favourable — just ${fmt1(o / 30)} more orders a day cover this role. Your margin allows it comfortably.`,
        vWarn: 'Doable, but this role weighs heavily on the result. Make sure the hire genuinely drives extra revenue.',
        vBad: 'Caution — this cost exceeds your current room to manoeuvre. Only consider it with a confirmed rise in activity.',
        note: 'Assumption: 7,200 MAD/month loaded cost for a waiter (net pay + CNSS + bonuses). Give a precise figure to refine.',
      },
      price: {
        text: (p) => `A <b>${fmt1(Math.abs(p))}%</b> ${p >= 0 ? 'increase' : 'decrease'} across the whole menu, at constant volume, doesn't touch cost of goods — the difference falls almost entirely into your result.`,
        s1l: 'Net profit /month', s1h: (d) => `${d >= 0 ? '+' : ''}${fmtMad(d)}`,
        s2l: 'Effect over 12 months', s2h: 'at equal activity',
        s3l: 'New net margin', s3h: () => `vs ${fmt1(B.netMargin)} % today`,
        s4l: 'New revenue /month', s4h: (b) => `average basket ${fmtMad(b)}`,
        vUp: (p, d) => `Powerful lever — ${fmt1(p)}% more on price = ${fmtMad(d)} of monthly profit with no extra spend.`,
        vDown: (need) => `A price cut is only funded by volume: you'd need +${fmt1(need)}% orders to keep the result steady.`,
        note: 'Calculated at constant volume. In practice a price rise often trims footfall by 2–4% — watch order counts over the next two weeks.',
        noteAssumed: ' (Assumption: 5%.)',
      },
      afford: {
        ask: 'Tell me the investment amount and I\'ll say whether it\'s within reach — for example: <i>"can I invest 80,000 MAD in a terrace?"</i>',
        text: (a) => `An investment of <b>${fmtMad(a)}</b> compares against your available cash (${fmtMad(B.cashBuffer)}) and your net profit (${fmtMad(B.netProfit)}/month).`,
        s1l: 'Recouped in', s1v: (m) => `${fmt1(m)} months`, s1h: 'at the current net profit',
        s2l: 'Cash afterwards', s2hOk: (p) => `${fmt1(p)} % committed`, s2hNo: 'financing required',
        s3l: 'Equivalent to', s3v: (d) => `${fmt1(d)} days`, s3h: 'of operating profit',
        s4l: 'Annual weight', s4h: 'of profit over 12 months',
        vGood: (m, cash) => `Affordable — payable in cash, paid back in ${fmt1(m)} months, with ${fmtMad(cash)} of cash left.`,
        vWarn: (m, p) => `Payable in cash, but payback takes ${fmt1(m)} months and ties up ${fmt1(p)}% of your cash — keep a safety cushion.`,
        vBad: () => `Beyond your available cash (${fmtMad(B.cashBuffer)}). Financing, or spreading the cost, would be needed.`,
      },
      forecast: {
        text: (run) => `Over the <b>first ${B.mtdDays} days of the month</b> (${fmtMad(B.mtdRevenue)} taken), the pace is <b>${fmtMad(run)}/day</b>.`,
        s1l: 'Projected revenue · month', s1h: () => `${B.daysInMonth} days`,
        s2l: 'Projected profit · month', s2h: () => `net margin ${fmt1(B.netMargin)} %`,
        s3l: 'Projected revenue · 12 mo.', s3h: 'at the current pace',
        s4l: 'Profit · 12 months', s4h: 'before corporate tax',
        vGood: (v) => `Positive trend — the month is running ${fmt1(v)}% above your 30-day average. If the pace holds, it's your best month.`,
        vWarn: (v) => `The month is ${fmt1(v)}% below your 30-day average — a push on weekend evenings would bring it back up.`,
        note: 'Linear projection: a public holiday, a rainy weekend or a special event can shift the real figure.',
      },
      breakeven: {
        text: () => `Your break-even — the revenue that exactly covers your fixed costs (${fmtMad(B.totalOpex)}) at a ${fmt1(B.contribRatio * 100)}% contribution margin.`,
        s1l: 'Break-even · monthly rev.', s1h: () => `vs ${fmtMad(B.revenue)} achieved`,
        s2l: 'Break-even · orders/day', s2h: () => `vs ${fmt(B.ordersPerDay)} today`,
        s3l: 'Margin of safety', s3h: 'drop in activity you can absorb',
        s4l: 'Break-even · daily rev.', s4h: () => `vs ${fmtMad(B.dailyRev)} achieved`,
        vGood: () => `Solid position — you operate ${fmt1(B.marginOfSafety)}% above break-even. You'd have to lose nearly a third of activity to reach it.`,
      },
      margin: {
        text: 'Your two margins, over the last 30 days:',
        s1l: 'Gross margin', s1h: () => `${fmtMad(B.grossProfit)} after cost of goods`,
        s2l: 'Net margin', s2h: () => `${fmtMad(B.netProfit)} after all costs`,
        s3l: 'Cost of goods', s3h: () => fmtMad(B.cogs),
        s4l: 'Profit per order', s4h: () => `average basket ${fmtMad(B.avgBasket)}`,
        vGood: () => `Net margin of ${fmt1(B.netMargin)}% — well above the café-restaurant sector average (8 to 12%). Your cost of goods is well controlled.`,
        note: 'Gross margin measures how profitable the menu is; net margin, how profitable the whole operation is.',
      },
      charges: {
        text: () => `Your monthly fixed costs total <b>${fmtMad(B.totalOpex)}</b>, on top of which comes the cost of goods (${fmtMad(B.cogs)}).`,
        share: (p) => `${fmt1(p)} % of costs`,
        verdict: (name, p) => `"${name}" is your biggest line (${fmt1(p)}% of costs) — that's where your main optimisation lever sits.`,
      },
      revenue: {
        text: 'Your activity over the last 30 days:',
        s1l: 'Revenue', s1h: 'last 30 days',
        s2l: 'Avg. revenue /day', s2h: () => `${fmt(B.ordersPerDay)} orders`,
        s3l: 'Orders /month', s3h: () => `average basket ${fmtMad(B.avgBasket)}`,
        s4l: 'Net profit /month', s4h: () => `net margin ${fmt1(B.netMargin)} %`,
      },
      profit: {
        text: 'Your result, once every cost is paid:',
        s1l: 'Net profit /month', s1h: () => `net margin ${fmt1(B.netMargin)} %`,
        s2l: 'Net profit /day', s2h: () => `${B.daysOpen} opening days`,
        s3l: 'Profit per order', s3h: () => `on a ${fmtMad(B.avgBasket)} basket`,
        s4l: 'Projected profit /year', s4h: 'at the current pace',
        vGood: () => `A healthy, profitable café: you clear ${fmtMad(B.dailyNet)} of net profit per opening day.`,
      },
      help: {
        text: 'Hello Rachid. I\'m your financial assistant — I know Café Atlas: revenue, cost of goods, costs, margins and cash. Ask me a numbers question and I\'ll compute the real impact on your result; for an open question about running your café, I can switch on an AI assistant right in your browser. For example:',
      },
      calc: { title: 'Calculation', result: 'result' },
      llm: {
        noGpu: 'That’s outside what I calculate — I’m your numbers copilot: hiring, pricing, investment, break-even, forecasts, margins and charges. Ask me any of those and the answer comes right back. And to see which menu items are working — or not — open the Menu page in your dashboard.',
        loading: (p) => `My AI assistant is finishing loading (${p}%). I'll answer as soon as it's ready.`,
        offerLead: 'This question is beyond my preset calculations — but I can answer it freely with an <b>open-source AI assistant</b> that runs <b>entirely in your browser</b>: no data goes anywhere.',
        offerSize: (sz) => `First launch: a one-time download of ${sz}, instant after that.`,
        activate: 'Turn on the AI assistant',
        installing: 'Installing the AI assistant — open-source model running in your browser.',
        initializing: 'Initialising…',
        ready: 'AI assistant ready.',
        readyMsg: 'My AI assistant is ready. Ask me about managing, financing, staffing or marketing your café — I stay focused on your business.',
        loadFail: 'Loading failed.',
        loadFailMsg: 'I couldn\'t load the AI assistant (connection, memory, or an incompatible browser). My financial calculations remain fully available.',
        runErr: 'Something went wrong on the AI assistant side. Try again, or ask me for a precise calculation.',
      },
      acct: {
        hub: 'I\'m also your accountant, bookkeeper, tax adviser and payroll manager — it\'s all together in your Accounting: ledger, financial statements, VAT & tax, and payroll.',
        tva: (D) => `I'll handle your taxes. For ${D.period}: VAT due <b>${fmtMad(D.tva.aPayer)}</b>, deadline ${D.tva.echeance}. Estimated corporate tax for the year: ${fmtMad(D.is.estimeAnnuel)}. I'm opening the module to prepare the return.`,
        paie: (D) => `On payroll: <b>${D.payroll.headcount} employees</b>, ${fmtMad(D.payroll.totalNet)} net to pay for ${D.period}. The CNSS return is due ${D.payroll.echeance} — I can generate the payslips.`,
        etats: (D) => `Your ${D.period} statements: net result <b>${fmtMad(D.netProfit)}</b>, cash ${fmtMad(D.cash)}, balanced sheet. I'm opening your financial statements.`,
        livre: (D) => `<b>${fmt(D.entriesThisMonth)} entries</b> this month — every sale and expense, recorded and categorised automatically.`,
      },
    },

    ar: {
      /* AR: best-effort MSA — needs native review */
      ui: {
        title: 'المساعد المالي',
        subtitle: 'يعرف مقهاك — المداخيل، التكاليف، الهوامش، الخزينة',
        placeholder: 'اطرح سؤالاً — توظيف، أسعار، استثمار، توقّعات…',
        calc: 'الآلة الحاسبة', enterToSend: 'اضغط Enter للإرسال', send: 'إرسال',
        kpError: 'خطأ', kpUse: 'استعمل هذه النتيجة',
        ctxEyebrow: 'ما أعرفه',
        ctxSub: 'آخر 30 يوماً · انقر للإدراج',
        ctxNote: 'انقر على أي رقم لإضافته إلى رسالتك — وسيحلّله المساعد.',
        ctxTrust: 'كل شيء يعمل محلياً. لا تغادر أي بيانات هذا الجهاز.',
        gActivity: 'النشاط', gProfit: 'الربحية', gFixed: 'التكاليف الثابتة', gCash: 'الخزينة والفريق',
        perMonth: '/ شهر', days: 'يوم', employees: (n) => `${n} موظفين`,
      },
      facts: {
        revenue: 'رقم المعاملات', revPerDay: 'المداخيل في اليوم', mtdRev: 'مداخيل الشهر الجاري',
        ordersMonth: 'الطلبات / شهر', ordersDay: 'الطلبات / يوم', basket: 'متوسط السلة',
        grossMargin: 'الهامش الإجمالي', cogs: 'تكلفة المواد', profitPerOrder: 'الربح لكل طلب',
        breakEven: 'نقطة التعادل', cashAvail: 'الخزينة المتاحة', headcount: 'عدد الموظفين',
        netProfit: 'الربح الصافي', netMarginLine: (m) => `هامش صافٍ ${m} %`,
      },
      opex: {
        salaries: 'كتلة الأجور', rent: 'الكراء', utilities: 'الماء · الكهرباء · الغاز',
        marketing: 'التسويق ومصاريف متنوعة', maintenance: 'الصيانة والمعدات',
        insurance: 'التأمينات والضرائب', financing: 'الإهلاك والقرض', subscription: 'اشتراك Kiwi POS',
      },
      chips: {
        hire: 'هل يمكنني توظيف نادل؟', price5: 'ماذا لو رفعت أسعاري 5%؟',
        breakeven: 'ما هي نقطة التعادل لدي؟', forecast: 'توقّع الربح هذا الشهر',
        charges: 'حلّل تكاليفي', invest80: 'هل يمكنني استثمار 80 000 MAD؟',
        invest150: 'هل يمكنني استثمار 150 000 MAD؟',
      },
      hire: {
        text: (c) => `توظيف بتكلفة محمّلة قدرها <b>${fmtMad(c)}/شهر</b> يعادل <b>${fmtMad(c * 12)}/سنة</b>.`,
        s1l: 'لتمويل نفسه', s1v: (o) => `${fmt1(o / 30)} طلب/يوم`, s1h: (o) => `أي ${fmt(o)} طلب/شهر`,
        s2l: 'المداخيل الإضافية المطلوبة', s2h: 'بمتوسط السلة الحالي',
        s3l: 'الربح الصافي بعد ذلك', s3h: () => `مقابل ${fmtMad(B.netProfit)} اليوم`,
        s4l: 'حصة من الربح', s4h: 'من نتيجتك الشهرية',
        vGood: (o) => `مناسب — يكفي ${fmt1(o / 30)} طلب إضافي في اليوم لتغطية هذا المنصب. هامشك يسمح بذلك بأريحية.`,
        vWarn: 'ممكن، لكن هذا المنصب يثقل النتيجة. تأكد من أن التوظيف يولّد مداخيل إضافية فعلية.',
        vBad: 'حذار — هذه التكلفة تتجاوز هامش مناورتك الحالي. لا تأخذها بعين الاعتبار إلا مع ارتفاع مؤكد في النشاط.',
        note: 'افتراض: 7 200 MAD/شهر تكلفة محمّلة لنادل (الأجر الصافي + CNSS + المكافآت). حدّد مبلغاً دقيقاً للتحسين.',
      },
      price: {
        text: (p) => `${p >= 0 ? 'رفع' : 'خفض'} الأسعار بنسبة <b>${fmt1(Math.abs(p))} %</b> على كامل القائمة، بحجم ثابت، لا يمسّ تكلفة المواد — والفارق يذهب كله تقريباً إلى النتيجة.`,
        s1l: 'الربح الصافي / شهر', s1h: (d) => `${d >= 0 ? '+' : ''}${fmtMad(d)}`,
        s2l: 'الأثر على 12 شهراً', s2h: 'بنشاط مماثل',
        s3l: 'الهامش الصافي الجديد', s3h: () => `مقابل ${fmt1(B.netMargin)} % اليوم`,
        s4l: 'رقم المعاملات الجديد / شهر', s4h: (b) => `متوسط السلة ${fmtMad(b)}`,
        vUp: (p, d) => `رافعة قوية — ${fmt1(p)} % زيادة في السعر = ${fmtMad(d)} ربحاً شهرياً دون أي إنفاق إضافي.`,
        vDown: (need) => `خفض السعر لا يموّله إلا الحجم: ستحتاج إلى +${fmt1(need)} % من الطلبات للحفاظ على النتيجة.`,
        note: 'حساب بحجم ثابت. عملياً، رفع الأسعار يقلّص الإقبال غالباً بنسبة 2 إلى 4 % — راقب عدد الطلبات خلال الأسبوعين التاليين.',
        noteAssumed: ' (افتراض: 5 %.)',
      },
      afford: {
        ask: 'حدّد مبلغ الاستثمار وسأخبرك إن كان في متناولك — مثلاً: <i>«هل يمكنني استثمار 80 000 MAD في تيراس؟»</i>',
        text: (a) => `استثمار قدره <b>${fmtMad(a)}</b> يُقارَن بخزينتك المتاحة (${fmtMad(B.cashBuffer)}) وبربحك الصافي (${fmtMad(B.netProfit)}/شهر).`,
        s1l: 'يُسترَدّ في', s1v: (m) => `${fmt1(m)} شهراً`, s1h: 'بالربح الصافي الحالي',
        s2l: 'الخزينة بعد ذلك', s2hOk: (p) => `${fmt1(p)} % مُلتزَم بها`, s2hNo: 'يتطلب تمويلاً',
        s3l: 'ما يعادل', s3v: (d) => `${fmt1(d)} يوماً`, s3h: 'من ربح التشغيل',
        s4l: 'الوزن السنوي', s4h: 'من الربح على 12 شهراً',
        vGood: (m, cash) => `في المتناول — يُدفع نقداً، ويُسترَدّ في ${fmt1(m)} شهراً، ويبقى ${fmtMad(cash)} في الخزينة.`,
        vWarn: (m, p) => `يُدفع نقداً، لكن الاسترداد يستغرق ${fmt1(m)} شهراً ويجمّد ${fmt1(p)} % من خزينتك — احتفظ بهامش أمان.`,
        vBad: () => `يتجاوز خزينتك المتاحة (${fmtMad(B.cashBuffer)}). سيلزم تمويل أو تقسيط للتكلفة.`,
      },
      forecast: {
        text: (run) => `خلال <b>الأيام الـ${B.mtdDays} الأولى من الشهر</b> (${fmtMad(B.mtdRevenue)} محصّلة)، الوتيرة هي <b>${fmtMad(run)}/يوم</b>.`,
        s1l: 'رقم معاملات متوقّع · الشهر', s1h: () => `${B.daysInMonth} يوماً`,
        s2l: 'ربح متوقّع · الشهر', s2h: () => `هامش صافٍ ${fmt1(B.netMargin)} %`,
        s3l: 'رقم معاملات متوقّع · 12 شهراً', s3h: 'بالوتيرة الحالية',
        s4l: 'الربح · 12 شهراً', s4h: 'قبل الضريبة على الشركات',
        vGood: (v) => `اتجاه إيجابي — الشهر يتجاوز متوسط 30 يوماً بنسبة ${fmt1(v)} %. إن صمدت الوتيرة، فهو أفضل شهر لك.`,
        vWarn: (v) => `الشهر أدنى بـ${fmt1(v)} % من متوسط 30 يوماً — دفعة في أمسيات نهاية الأسبوع تعيد التوازن.`,
        note: 'توقّع خطّي: يوم عطلة أو نهاية أسبوع ممطرة أو عملية خاصة قد تغيّر النتيجة الفعلية.',
      },
      breakeven: {
        text: () => `نقطة تعادلك — رقم المعاملات الذي يغطّي تماماً تكاليفك الثابتة (${fmtMad(B.totalOpex)}) بهامش مساهمة قدره ${fmt1(B.contribRatio * 100)} %.`,
        s1l: 'العتبة · رقم معاملات شهري', s1h: () => `مقابل ${fmtMad(B.revenue)} مُحقّق`,
        s2l: 'العتبة · طلبات/يوم', s2h: () => `مقابل ${fmt(B.ordersPerDay)} اليوم`,
        s3l: 'هامش الأمان', s3h: 'تراجع في النشاط يمكن استيعابه',
        s4l: 'العتبة · رقم معاملات يومي', s4h: () => `مقابل ${fmtMad(B.dailyRev)} مُحقّق`,
        vGood: () => `وضع متين — تشتغل بنسبة ${fmt1(B.marginOfSafety)} % فوق نقطة التعادل. ستحتاج إلى خسارة ثُلث النشاط تقريباً للوصول إليها.`,
      },
      margin: {
        text: 'هامشاك، على مدى آخر 30 يوماً:',
        s1l: 'الهامش الإجمالي', s1h: () => `${fmtMad(B.grossProfit)} بعد تكلفة المواد`,
        s2l: 'الهامش الصافي', s2h: () => `${fmtMad(B.netProfit)} بعد كل التكاليف`,
        s3l: 'تكلفة المواد', s3h: () => fmtMad(B.cogs),
        s4l: 'الربح لكل طلب', s4h: () => `متوسط السلة ${fmtMad(B.avgBasket)}`,
        vGood: () => `هامش صافٍ قدره ${fmt1(B.netMargin)} % — أعلى بكثير من متوسط قطاع المقاهي والمطاعم (8 إلى 12 %). تكلفة موادك مضبوطة جيداً.`,
        note: 'الهامش الإجمالي يقيس ربحية القائمة؛ والهامش الصافي يقيس ربحية الاستغلال بأكمله.',
      },
      charges: {
        text: () => `مجموع تكاليفك الثابتة الشهرية <b>${fmtMad(B.totalOpex)}</b>، تُضاف إليها تكلفة المواد (${fmtMad(B.cogs)}).`,
        share: (p) => `${fmt1(p)} % من التكاليف`,
        verdict: (name, p) => `«${name}» هو أكبر بند لديك (${fmt1(p)} % من التكاليف) — وهنا تكمن رافعة التحسين الرئيسية.`,
      },
      revenue: {
        text: 'نشاطك على مدى آخر 30 يوماً:',
        s1l: 'رقم المعاملات', s1h: 'آخر 30 يوماً',
        s2l: 'متوسط المداخيل / يوم', s2h: () => `${fmt(B.ordersPerDay)} طلب`,
        s3l: 'الطلبات / شهر', s3h: () => `متوسط السلة ${fmtMad(B.avgBasket)}`,
        s4l: 'الربح الصافي / شهر', s4h: () => `هامش صافٍ ${fmt1(B.netMargin)} %`,
      },
      profit: {
        text: 'نتيجتك، بعد أداء كل التكاليف:',
        s1l: 'الربح الصافي / شهر', s1h: () => `هامش صافٍ ${fmt1(B.netMargin)} %`,
        s2l: 'الربح الصافي / يوم', s2h: () => `${B.daysOpen} يوم عمل`,
        s3l: 'الربح لكل طلب', s3h: () => `على سلة قدرها ${fmtMad(B.avgBasket)}`,
        s4l: 'ربح متوقّع / سنة', s4h: 'بالوتيرة الحالية',
        vGood: () => `مقهى رابح وسليم: تحقّق ${fmtMad(B.dailyNet)} ربحاً صافياً عن كل يوم عمل.`,
      },
      help: {
        text: 'مرحباً رشيد. أنا مساعدك المالي — أعرف Café Atlas: رقم المعاملات، تكلفة المواد، التكاليف، الهوامش والخزينة. اطرح سؤالاً رقمياً وأحسب الأثر الفعلي على نتيجتك؛ ولسؤال مفتوح حول تسيير مقهاك، يمكنني تشغيل مساعد ذكاء اصطناعي داخل متصفّحك. مثلاً:',
      },
      calc: { title: 'حساب', result: 'النتيجة' },
      llm: {
        noGpu: 'هذا السؤال خارج نطاق حساباتي — أنا مساعدك في الأرقام: التوظيف، الأسعار، الاستثمار، عتبة الربحية، التوقّعات، الهوامش والمصاريف. اسألني عن أيٍّ منها وتصلك الإجابة فوراً. ولمعرفة أصناف قائمتك الناجحة من غيرها، افتح صفحة القائمة في لوحة التحكم.',
        loading: (p) => `مساعد الذكاء الاصطناعي يكمل التحميل (${p}%). سأجيب فور جاهزيته.`,
        offerLead: 'هذا السؤال خارج حساباتي المُعدّة مسبقاً — لكن يمكنني الإجابة عنه بحرية عبر <b>مساعد ذكاء اصطناعي مفتوح المصدر</b> يعمل <b>كلياً داخل متصفّحك</b>: لا تغادر أي بيانات.',
        offerSize: (sz) => `الإطلاق الأول: تنزيل واحد بحجم ${sz}، ثم فوري بعد ذلك.`,
        activate: 'تشغيل مساعد الذكاء الاصطناعي',
        installing: 'تثبيت مساعد الذكاء الاصطناعي — نموذج مفتوح المصدر يعمل في متصفّحك.',
        initializing: 'جارٍ التهيئة…',
        ready: 'مساعد الذكاء الاصطناعي جاهز.',
        readyMsg: 'مساعد الذكاء الاصطناعي جاهز. اسألني عن تسيير مقهاك وتمويله وفريقه وتسويقه — أبقى مركّزاً على نشاطك.',
        loadFail: 'فشل التحميل.',
        loadFailMsg: 'تعذّر تحميل مساعد الذكاء الاصطناعي (الاتصال أو الذاكرة أو متصفّح غير متوافق). تبقى حساباتي المالية متاحة بالكامل.',
        runErr: 'حدث خطأ من جهة مساعد الذكاء الاصطناعي. أعد المحاولة، أو اطلب مني حساباً دقيقاً.',
      },
      acct: {
        hub: 'أنا أيضاً محاسبك وماسك دفاترك ومستشارك الضريبي ومدير أجورك — كل ذلك مجتمع في قسم المحاسبة: الدفتر، القوائم المالية، الضريبة والرسوم، والأجور.',
        tva: (D) => `سأتكفّل بضرائبك. لـ ${D.period}: الضريبة المستحقة <b>${fmtMad(D.tva.aPayer)}</b>، الأجل ${D.tva.echeance}. الضريبة على الشركات المقدّرة للسنة: ${fmtMad(D.is.estimeAnnuel)}. أفتح الوحدة لتحضير التصريح.`,
        paie: (D) => `بخصوص الأجور: <b>${D.payroll.headcount} موظفين</b>، ${fmtMad(D.payroll.totalNet)} صافٍ للدفع عن ${D.period}. تصريح CNSS مستحق في ${D.payroll.echeance} — يمكنني إنشاء كشوف الرواتب.`,
        etats: (D) => `قوائم ${D.period}: النتيجة الصافية <b>${fmtMad(D.netProfit)}</b>، الخزينة ${fmtMad(D.cash)}، ميزانية متوازنة. أفتح قوائمك المالية.`,
        livre: (D) => `<b>${fmt(D.entriesThisMonth)} قيد</b> هذا الشهر — كل عملية بيع ونفقة، مسجّلة ومصنّفة تلقائياً.`,
      },
    },
  };

  const tr = () => T[L] || T.fr;

  /* ─────────────── NUMBER PARSING ─────────────── */
  function parseAmount(q) {
    const m = q.match(/(\d[\d  .]*\d|\d)\s*(millions?|m\b|k\b|mille|thousand|alf|ألف)?/i);
    if (!m) return null;
    let n = parseFloat(m[1].replace(/[  .]/g, '').replace(',', '.'));
    const suf = (m[2] || '').toLowerCase();
    if (suf === 'k' || suf === 'mille' || suf === 'thousand' || suf === 'alf' || suf === 'ألف') n *= 1000;
    else if (suf[0] === 'm') n *= 1000000;
    return isFinite(n) ? n : null;
  }
  function parsePercent(q) {
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(?:%|pour\s?cent|pourcent|percent|بالمئة|بالمائة|في المئة)/i);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }

  /* ─────────────── CALCULATOR ENGINE ─────────────── */
  function evalMath(expr) {
    let e = fixDigits(String(expr)).replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/\s/g, '').replace(/,/g, '.');
    e = e.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    if (!/^[-+*/().\d]+$/.test(e) || !/\d/.test(e)) return null;
    try {
      const r = Function('"use strict";return(' + e + ')')();
      return (typeof r === 'number' && isFinite(r)) ? r : null;
    } catch (_) { return null; }
  }
  function looksLikeMath(q) {
    const s = fixDigits(q).replace(/\s/g, '');
    return /^[-+*/().,%×÷\d]+$/.test(s) && /\d/.test(s) && /[-+*/×÷]/.test(s);
  }

  /* ═══════════════ SCENARIO ENGINE ═══════════════
   * Each returns { text, stats:[{l,v,h}], verdict:{tone,text}, note, follow:[] } */

  /* ─── New-venue (partial profile) strings — fr / en / ar ─── */
  const NV = {
    fr: {
      costsNeeded: (n) => `${n} démarre sur Kiwi. Je raisonne sur vos ventes réelles enregistrées — mais je n'ai pas encore votre structure de coûts (loyer, salaires, marge, trésorerie). Je préfère ne rien simuler plutôt que d'inventer des chiffres.`,
      costsCta: 'Enregistrez vos ventes au fil des jours et renseignez vos charges dans Réglages — je débloque alors les simulations d\'embauche, de prix, de rentabilité et de prévision.',
      noSales: (n) => `${n} n'a pas encore de vente enregistrée. Dès la première vente saisie en caisse, je commence à suivre votre chiffre d'affaires, votre panier moyen et vos tendances.`,
      revIntro: 'Voici vos ventes réelles enregistrées à ce jour.',
      revLabel: 'Ventes enregistrées', ordLabel: 'Nombre de ventes', basketLabel: 'Panier moyen',
      heroGreet: 'Bonjour.',
      heroLead: (n) => `Je suis votre directeur financier. ${n} démarre sur Kiwi — je travaille à partir de vos ventes réelles. Posez une question, ou commencez ici.`,
      heroIns: 'Enregistrez vos ventes et renseignez vos charges — je débloque alors vos marges, votre seuil de rentabilité et vos simulations.',
      railEmpty: 'Vos charges, marges et trésorerie apparaîtront ici dès que vous les renseignez.',
    },
    en: {
      costsNeeded: (n) => `${n} is just starting on Kiwi. I reason from your real recorded sales — but I don't have your cost structure yet (rent, payroll, margin, cash). I'd rather simulate nothing than invent figures.`,
      costsCta: 'Record your sales day to day and add your costs in Settings — I then unlock hiring, pricing, break-even and forecast simulations.',
      noSales: (n) => `${n} has no recorded sale yet. As soon as the first sale is rung up, I start tracking your revenue, average basket and trends.`,
      revIntro: 'Here are your real recorded sales so far.',
      revLabel: 'Recorded sales', ordLabel: 'Number of sales', basketLabel: 'Average basket',
      heroGreet: 'Hello.',
      heroLead: (n) => `I'm your finance director. ${n} is starting on Kiwi — I work from your real sales. Ask a question, or start here.`,
      heroIns: 'Record your sales and add your costs — I then unlock your margins, break-even point and simulations.',
      railEmpty: 'Your costs, margins and cash will show up here once you record them.',
    },
    ar: {
      costsNeeded: (n) => `${n} بدأ للتو على Kiwi. أعتمد على مبيعاتك الحقيقية المسجّلة — لكن ليس لديّ بعد هيكل تكاليفك (الكراء، الأجور، الهامش، السيولة). أفضّل ألّا أحاكي شيئًا على أن أخترع أرقامًا.`,
      costsCta: 'سجّل مبيعاتك يومًا بيوم وأضف تكاليفك في الإعدادات — عندها أفتح محاكاة التوظيف والأسعار ونقطة التعادل والتوقعات.',
      noSales: (n) => `${n} ليس لديه بعد أي عملية بيع مسجّلة. بمجرد تسجيل أول عملية بيع، أبدأ بتتبّع رقم معاملاتك ومتوسط السلة والاتجاهات.`,
      revIntro: 'هذه مبيعاتك الحقيقية المسجّلة حتى الآن.',
      revLabel: 'المبيعات المسجّلة', ordLabel: 'عدد المبيعات', basketLabel: 'متوسط السلة',
      heroGreet: 'مرحبًا.',
      heroLead: (n) => `أنا مديرك المالي. ${n} يبدأ على Kiwi — أعمل انطلاقًا من مبيعاتك الحقيقية. اطرح سؤالاً أو ابدأ من هنا.`,
      heroIns: 'سجّل مبيعاتك وأضف تكاليفك — عندها أفتح هوامشك ونقطة التعادل والمحاكاة.',
      railEmpty: 'ستظهر تكاليفك وهوامشك وسيولتك هنا بمجرد تسجيلها.',
    },
  };
  const nv = () => NV[L] || NV.fr;

  /* Honest fallback for cost-dependent scenarios on a partial (new) venue —
   * states what real data exists, never invents a cost or margin. */
  function partialReply() {
    const t = nv();
    const r = { text: t.costsNeeded(B.name), note: t.costsCta };
    if (B.revenue > 0) {
      r.stats = [
        { l: t.revLabel, v: fmtMad(B.revenue), h: '' },
        { l: t.ordLabel, v: fmt(B.ordersPerMonth), h: '' },
        { l: t.basketLabel, v: fmtMad(B.avgBasket), h: '' },
      ];
    }
    return r;
  }

  function sHire(q) {
    if (B.partial) return partialReply();
    const t = tr().hire;
    let c = parseAmount(q), assumed = false;
    if (!c || c < 1800) { c = 7200; assumed = true; }
    const ordersMo = c / (B.avgBasket * B.contribRatio);
    const newNet = B.netProfit - c;
    const tone = c < B.netProfit * 0.4 ? 'good' : c < B.netProfit * 0.8 ? 'warn' : 'bad';
    return {
      text: t.text(c),
      stats: [
        { l: t.s1l, v: t.s1v(ordersMo), h: t.s1h(ordersMo) },
        { l: t.s2l, v: fmtMad(c / B.contribRatio), h: t.s2h },
        { l: t.s3l, v: fmtMad(newNet), h: t.s3h() },
        { l: t.s4l, v: `${fmt1(c / B.netProfit * 100)} %`, h: t.s4h },
      ],
      verdict: { tone, text: tone === 'good' ? t.vGood(ordersMo) : tone === 'warn' ? t.vWarn : t.vBad },
      note: assumed ? t.note : '',
      follow: [tr().chips.price5, tr().chips.breakeven],
    };
  }

  function sPrice(q) {
    if (B.partial) return partialReply();
    const t = tr().price;
    let p = parsePercent(q), assumed = false;
    if (p == null) { p = 5; assumed = true; }
    const down = /\b(baiss|rédui|reduir|diminu|lower|cut|reduc|decrease|خفض|تخفيض)/i.test(norm(q));
    if (down) p = -Math.abs(p);
    const deltaNet = B.revenue * p / 100;
    const newNet = B.netProfit + deltaNet;
    const newRev = B.revenue * (1 + p / 100);
    const newNetMargin = newNet / newRev * 100;
    const tone = p > 0 ? (p <= 8 ? 'good' : 'warn') : 'warn';
    return {
      text: t.text(p),
      stats: [
        { l: t.s1l, v: fmtMad(newNet), h: t.s1h(deltaNet) },
        { l: t.s2l, v: `${deltaNet >= 0 ? '+' : ''}${fmtMad(deltaNet * 12)}`, h: t.s2h },
        { l: t.s3l, v: `${fmt1(newNetMargin)} %`, h: t.s3h() },
        { l: t.s4l, v: fmtMad(newRev), h: t.s4h(B.avgBasket * (1 + p / 100)) },
      ],
      verdict: { tone, text: p > 0 ? t.vUp(p, deltaNet) : t.vDown(Math.abs(p) / B.contribRatio) },
      note: t.note + (assumed ? t.noteAssumed : ''),
      follow: [tr().chips.forecast, tr().chips.charges],
    };
  }

  function sAfford(q) {
    if (B.partial) return partialReply();
    const t = tr().afford;
    const A = parseAmount(q);
    if (!A || A < 100) {
      return { text: t.ask, follow: [tr().chips.invest80, tr().chips.invest150] };
    }
    const monthsRecoup = A / B.netProfit;
    const afterCash = B.cashBuffer - A;
    const pctCash = A / B.cashBuffer * 100;
    const tone = (A <= B.cashBuffer && monthsRecoup < 6) ? 'good'
      : (A <= B.cashBuffer ? 'warn' : 'bad');
    return {
      text: t.text(A),
      stats: [
        { l: t.s1l, v: t.s1v(monthsRecoup), h: t.s1h },
        { l: t.s2l, v: fmtMad(Math.max(afterCash, 0)), h: afterCash >= 0 ? t.s2hOk(pctCash) : t.s2hNo },
        { l: t.s3l, v: t.s3v(A / B.dailyNet), h: t.s3h },
        { l: t.s4l, v: `${fmt1(A / (B.netProfit * 12) * 100)} %`, h: t.s4h },
      ],
      verdict: {
        tone,
        text: tone === 'good' ? t.vGood(monthsRecoup, afterCash)
          : tone === 'warn' ? t.vWarn(monthsRecoup, pctCash) : t.vBad(),
      },
      follow: [tr().chips.breakeven, tr().chips.forecast],
    };
  }

  function sForecast() {
    if (B.partial) return partialReply();
    const t = tr().forecast;
    const runRate = B.mtdRevenue / B.mtdDays;
    const projRev = runRate * B.daysInMonth;
    const projNet = projRev * B.netMargin / 100;
    const vsAvg = (projRev - B.revenue) / B.revenue * 100;
    const tone = vsAvg >= 0 ? 'good' : 'warn';
    return {
      text: t.text(runRate),
      stats: [
        { l: t.s1l, v: fmtMad(projRev), h: t.s1h() },
        { l: t.s2l, v: fmtMad(projNet), h: t.s2h() },
        { l: t.s3l, v: fmtMad(projRev * 12), h: t.s3h },
        { l: t.s4l, v: fmtMad(projNet * 12), h: t.s4h },
      ],
      verdict: { tone, text: vsAvg >= 0 ? t.vGood(vsAvg) : t.vWarn(Math.abs(vsAvg)) },
      note: t.note,
      follow: [tr().chips.charges, tr().chips.price5],
    };
  }

  function sBreakEven() {
    if (B.partial) return partialReply();
    const t = tr().breakeven;
    return {
      text: t.text(),
      stats: [
        { l: t.s1l, v: fmtMad(B.breakEvenRev), h: t.s1h() },
        { l: t.s2l, v: fmt(B.breakEvenOrdersDay), h: t.s2h() },
        { l: t.s3l, v: `${fmt1(B.marginOfSafety)} %`, h: t.s3h },
        { l: t.s4l, v: fmtMad(B.breakEvenRev / B.daysOpen), h: t.s4h() },
      ],
      verdict: { tone: 'good', text: t.vGood() },
      follow: [tr().chips.hire, tr().chips.forecast],
    };
  }

  function sMargin() {
    if (B.partial) return partialReply();
    const t = tr().margin;
    return {
      text: t.text,
      stats: [
        { l: t.s1l, v: `${fmt1(B.grossMargin)} %`, h: t.s1h() },
        { l: t.s2l, v: `${fmt1(B.netMargin)} %`, h: t.s2h() },
        { l: t.s3l, v: `${fmt1(100 - B.grossMargin)} %`, h: t.s3h() },
        { l: t.s4l, v: fmtMad(B.netPerOrder), h: t.s4h() },
      ],
      verdict: { tone: 'good', text: t.vGood() },
      note: t.note,
      follow: [tr().chips.charges, tr().chips.price5],
    };
  }

  function sCharges() {
    if (B.partial) return partialReply();
    const t = tr().charges;
    const labels = tr().opex;
    const items = Object.entries(B.opex).sort((a, b) => b[1] - a[1]);
    const biggest = items[0];
    return {
      text: t.text(),
      stats: items.map(([k, v]) => ({ l: labels[k] || k, v: fmtMad(v), h: t.share(v / B.totalOpex * 100) })),
      verdict: { tone: 'warn', text: t.verdict(labels[biggest[0]] || biggest[0], biggest[1] / B.totalOpex * 100) },
      follow: [tr().chips.hire, tr().chips.breakeven],
    };
  }

  function sRevenue() {
    const t = tr().revenue;
    if (B.partial) {
      if (!(B.revenue > 0)) return { text: nv().noSales(B.name) };
      const p = nv();
      return {
        text: p.revIntro,
        stats: [
          { l: p.revLabel, v: fmtMad(B.revenue), h: '' },
          { l: p.ordLabel, v: fmt(B.ordersPerMonth), h: '' },
          { l: p.basketLabel, v: fmtMad(B.avgBasket), h: '' },
        ],
        note: p.costsCta,
      };
    }
    return {
      text: t.text,
      stats: [
        { l: t.s1l, v: fmtMad(B.revenue), h: t.s1h },
        { l: t.s2l, v: fmtMad(B.dailyRev), h: t.s2h() },
        { l: t.s3l, v: fmt(B.ordersPerMonth), h: t.s3h() },
        { l: t.s4l, v: fmtMad(B.netProfit), h: t.s4h() },
      ],
      follow: [tr().chips.forecast, tr().chips.charges],
    };
  }

  function sProfit() {
    if (B.partial) return partialReply();
    const t = tr().profit;
    return {
      text: t.text,
      stats: [
        { l: t.s1l, v: fmtMad(B.netProfit), h: t.s1h() },
        { l: t.s2l, v: fmtMad(B.dailyNet), h: t.s2h() },
        { l: t.s3l, v: fmtMad(B.netPerOrder), h: t.s3h() },
        { l: t.s4l, v: fmtMad(B.netProfit * 12), h: t.s4h },
      ],
      verdict: { tone: 'good', text: t.vGood() },
      follow: [tr().chips.invest80, tr().chips.breakeven],
    };
  }

  /* ─── Accounting agent (Comptabilité) — opens the hub / a module ─── */
  const ACCT_LBL = {
    fr: { open: 'Ouvrir ma comptabilité', tva: 'Ouvrir TVA & Impôts', paie: 'Ouvrir la Paie', etats: 'Ouvrir les états financiers', livre: 'Ouvrir le grand livre' },
    en: { open: 'Open my accounting', tva: 'Open Tax & VAT', paie: 'Open Payroll', etats: 'Open financial statements', livre: 'Open the ledger' },
    ar: { open: 'افتح محاسبتي', tva: 'الضريبة والـTVA', paie: 'الأجور', etats: 'القوائم المالية', livre: 'دفتر الأستاذ' },
  };
  const acctLabel = (k) => (ACCT_LBL[L] || ACCT_LBL.fr)[k];
  const RX_ACCT = /(comptab|grand.?livre|ecritur|\btva\b|impot|fiscal|declarat|cnss|\bpaie\b|fiche.?de.?paie|bulletin.?de.?paie|bilan|cloture|amortiss|\bdgi\b|etats financiers|account|bookkeep|ledger|\bvat\b|payroll|payslip|\btax\b|balance.?sheet|financial.?statement|محاسب|دفتر|ضريب)/;

  /* ─── Empty-state hero — the assistant's first screen ─── */
  const HERO_L = {
    fr: {
      greet: 'Bonjour Rachid.',
      lead: 'Je suis votre directeur financier — je connais Café Atlas dans le détail. Posez une question chiffrée, ou commencez ici.',
      c1t: 'Simuler une embauche', c1s: 'Coût réel sur la marge',
      c2t: 'Tester une hausse de prix', c2s: 'Effet sur le bénéfice',
      c3t: 'Ma comptabilité', c3s: 'Livre · TVA · paie · états',
      insT: 'État du jour ·',
      ins: (m, s) => `Café Atlas est solide — marge nette ${m} %, soit ${s} % au-dessus de votre seuil de rentabilité.`,
      autres: 'Autres', more: 'Voir tous les chiffres', less: 'Réduire',
    },
    en: {
      greet: 'Hello Rachid.',
      lead: 'I’m your finance director — I know Café Atlas inside out. Ask a numbers question, or start here.',
      c1t: 'Simulate a hire', c1s: 'Real cost on margin',
      c2t: 'Test a price rise', c2s: 'Effect on profit',
      c3t: 'My accounting', c3s: 'Ledger · VAT · payroll · books',
      insT: 'Today ·',
      ins: (m, s) => `Café Atlas is solid — ${m} % net margin, ${s} % above your break-even point.`,
      autres: 'Other', more: 'Show every figure', less: 'Collapse',
    },
    ar: {
      greet: 'مرحبا رشيد.',
      lead: 'أنا مديرك المالي — أعرف مقهى أطلس بالتفصيل. اطرح سؤالاً بالأرقام أو ابدأ من هنا.',
      c1t: 'محاكاة توظيف', c1s: 'التكلفة على الهامش',
      c2t: 'اختبار رفع الأسعار', c2s: 'الأثر على الربح',
      c3t: 'محاسبتي', c3s: 'الدفتر · الضريبة · الأجور',
      insT: 'اليوم ·',
      ins: (m, s) => `مقهى أطلس في وضع جيد — هامش صافٍ ${m}٪، أي ${s}٪ فوق نقطة التعادل.`,
      autres: 'أخرى', more: 'عرض كل الأرقام', less: 'إخفاء',
    },
  };
  const HL = () => HERO_L[L] || HERO_L.fr;

  function renderHero() {
    const h = HL();
    const safety = (B.revenue - B.breakEvenRev) / B.revenue * 100;
    const icHire = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.6"/><path d="M5 21v-1a6 6 0 016-6h2a6 6 0 016 6v1"/></svg>';
    const icPct  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.4"/><circle cx="17" cy="17" r="2.4"/></svg>';
    const icBook = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4a2 2 0 012-2h12v20H7a2 2 0 01-2-2z"/><path d="M9 2v20"/></svg>';
    const icIns  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.6l2.55 6.86 6.85 2.54-6.85 2.55L12 22.4l-2.55-6.85L2.6 13l6.85-2.54z"/></svg>';
    const heroH   = B.partial ? nv().heroGreet        : h.greet;
    const heroP   = B.partial ? nv().heroLead(B.name) : h.lead;
    const heroIns = B.partial ? nv().heroIns          : h.ins(fmt1(B.netMargin), fmt1(safety));
    return `<div class="fa-hero" data-fa-hero>
      <div class="fa-hero-mark">${ICON.avatar}</div>
      <div class="fa-hero-h">${heroH}</div>
      <div class="fa-hero-p">${heroP}</div>
      <div class="fa-hero-cards">
        <button class="fa-hero-card" type="button" data-fa-follow="${escAttr(tr().chips.hire)}">
          <span class="ic">${icHire}</span><span class="t">${h.c1t}</span><span class="s">${h.c1s}</span></button>
        <button class="fa-hero-card" type="button" data-fa-follow="${escAttr(tr().chips.price5)}">
          <span class="ic">${icPct}</span><span class="t">${h.c2t}</span><span class="s">${h.c2s}</span></button>
        <button class="fa-hero-card" type="button" data-fa-open="open-comptabilite">
          <span class="ic">${icBook}</span><span class="t">${h.c3t}</span><span class="s">${h.c3s}</span></button>
      </div>
      <div class="fa-hero-insight">${icIns}<div><b>${h.insT}</b> ${heroIns}</div></div>
    </div>`;
  }

  function sHelp() {
    return {
      text: tr().help.text,
      follow: [tr().chips.hire, tr().chips.price5, tr().chips.breakeven, tr().chips.forecast, tr().chips.invest80],
      open: [{ label: acctLabel('open'), handler: 'open-comptabilite' }],
    };
  }

  function sAccounting(q) {
    const D = window.KiwiComptable && window.KiwiComptable.data;
    const a = tr().acct;
    let handler = 'open-comptabilite', btn = acctLabel('open'), text;
    if (D && /\btva\b|\bvat\b|impot|\btax\b|fiscal|declarat|acompte|\bdgi\b|\bis\b/.test(q)) {
      handler = 'acct-tva'; btn = acctLabel('tva'); text = a.tva(D);
    } else if (D && /cnss|\bpaie\b|payroll|payslip|fiche|bulletin|salair|salary|wage/.test(q)) {
      handler = 'acct-paie'; btn = acctLabel('paie'); text = a.paie(D);
    } else if (D && /bilan|balance|result|\betats?\b|statement|financial|cloture|comptes/.test(q)) {
      handler = 'acct-etats'; btn = acctLabel('etats'); text = a.etats(D);
    } else if (D && /livre|ledger|ecritur|entries|journal|bookkeep|comptabilis/.test(q)) {
      handler = 'acct-livre'; btn = acctLabel('livre'); text = a.livre(D);
    } else {
      text = a.hub;
    }
    return { text, open: [{ label: btn, handler }] };
  }

  function sCalc(expr, result) {
    return {
      text: tr().calc.title,
      stats: [{
        l: expr.trim(),
        v: fmt1(Math.round(result * 100) / 100).replace(/,0$/, ''),
        h: Math.abs(result) > 999 ? tr().calc.result : '',
      }],
    };
  }

  /* ─────────────── INTENT ROUTER (fr / en / ar) ─────────────── */
  const RX = {
    greet: /(bonjour|salut|coucou|aide|que (peux|sais)|qui es|comment ca|hello|^hi$|^hey|help|who are you|what can you|مرحبا|سلام|اهلا|مساعدة|من انت|ماذا تفعل)/,
    hire: /(embauch|recrut|engag|serveur|cuisinier|barista|salarie|nouvel employe|main d.?oeuvre|une personne en plus|hire|recruit|waiter|cook|barista|staff|employee|توظيف|تشغيل|نادل|طباخ|عامل|موظف|استخدام)/,
    hireExcl: /(embauch|recrut|serveur|hire|recruit|waiter|توظيف|نادل)/,
    afford: /(puis.?je|peux.?je|ai.?je les moyens|me permettre|abordable|financ|investir|acheter|depenser|coute|can i|afford|invest|buy|purchase|spend|cost of|هل يمكن|استثمار|شراء|صرف|اشتري|اقدر|في متناول)/,
    price: /(prix|tarif|price|pricing|سعر|اسعار|ثمن|تسعير)/,
    priceVerb: /(augment|hauss|baiss|monter|raise|increase|lower|cut|reduce|رفع|خفض|زيادة|تخفيض)/,
    forecast: /(prevision|projection|prevoir|previs|fin du mois|fin d.?annee|run.?rate|tendance|combien.*(vais|gagner|ferai)|forecast|projection|predict|end of month|trend|outlook|توقع|تنبؤ|اخر الشهر|نهاية الشهر|اتجاه)/,
    breakeven: /(seuil|rentab|equilibre|break.?even|point mort|breakeven|threshold|نقطة التعادل|عتبة|التعادل)/,
    margin: /(marge|margin|هامش)/,
    charges: /(charge|depense|cout|frais|opex|cost|expense|overhead|spending|تكاليف|مصاريف|نفقات|تكلفة)/,
    revenue: /(chiffre|revenu|\bca\b|encaiss|vente|recette|revenue|sales|turnover|income|مداخيل|مبيعات|دخل|رقم المعاملات|معاملات)/,
    profit: /(benefice|profit|gagne|resultat|rentre|combien je gagne|earn|bottom line|net income|make money|ربح|ارباح|صافي|نتيجة)/,
  };
  function respond(rawIn) {
    syncProfile();   // reason off whatever venue is active right now
    const raw = fixDigits(rawIn);
    const q = norm(raw);
    if (looksLikeMath(raw)) {
      const r = evalMath(raw);
      if (r != null) return sCalc(raw, r);
    }
    if (RX.greet.test(q)) return sHelp();
    if (RX.hire.test(q)) return sHire(raw);
    if (RX.afford.test(q) && !RX.hireExcl.test(q)) return sAfford(raw);
    if (RX.price.test(q) || (parsePercent(raw) != null && RX.priceVerb.test(q))) return sPrice(raw);
    if (RX.forecast.test(q)) return sForecast();
    if (RX.breakeven.test(q)) return sBreakEven();
    if (RX.margin.test(q)) return sMargin();
    if (RX.charges.test(q)) return sCharges();
    if (RX.revenue.test(q)) return sRevenue();
    if (RX.profit.test(q)) return sProfit();
    if (RX_ACCT.test(q)) return sAccounting(q);
    const r = evalMath(raw);
    if (r != null) return sCalc(raw, r);
    return null;   // unmatched → routed to the in-browser LLM
  }

  /* ═══════════════ IN-BROWSER LLM · WebLLM ═══════════════
   * Anything the deterministic engine doesn't recognise is answered by an
   * open-source model running fully in the browser via WebGPU — no backend,
   * no API key, no data leaves the device. Opt-in download. */
  const LLM = {
    /* Qwen3-4B — best small open-source model for this assistant: stronger
     * multilingual (FR/AR/EN), tool-calling and multi-step reasoning than
     * Llama-3.2-3B, and present in WebLLM's prebuilt list. Thinking mode is
     * disabled below (see runLlm) so answers stay snappy for the merchant.
     * CDN is version-pinned so model availability/behaviour can't drift. */
    model: 'Qwen3-4B-q4f16_1-MLC',
    sizeLabel: '≈ 2,4 Go',
    cdn: 'https://esm.run/@mlc-ai/web-llm@0.2.84',
    status: 'idle',
    engine: null,
    progress: 0,
  };

  /* Qwen3 can emit <think>…</think> reasoning blocks. We run it in
   * non-thinking mode, but strip defensively so the merchant never sees a
   * stray tag — handles both a closed block and one still mid-stream. */
  function stripThink(s) {
    return String(s)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<think>[\s\S]*$/i, '')
      .replace(/^\s+/, '');
  }
  const llmHistory = [];

  const SP_DIR = {
    fr: 'IMPÉRATIF : rédige ta réponse entièrement en FRANÇAIS.',
    en: `CRITICAL: the notes below are written in French, but you MUST write your entire reply in ENGLISH — the language of the user's question. Do not reply in French.`,
    ar: 'إلزامي: الملاحظات أدناه مكتوبة بالفرنسية، لكن يجب أن تكتب ردّك بالكامل بالعربية — لغة سؤال المستخدم. لا تُجب بالفرنسية.',
  };

  /* Real menu of the active venue (via window.KiwiMenu, exposed by venues.js)
   * — so the model answers menu questions from data instead of inventing
   * dishes. Sorted best-seller first. */
  function menuContextLines() {
    const items = (window.KiwiMenu && window.KiwiMenu.items && window.KiwiMenu.items()) || [];
    if (!items.length) return null;
    return items.slice().sort((a, b) => b.units - a.units).map(
      (it) => `  · ${it.name} — ${fmt(it.units)} vendus/mois · prix ${fmt(it.price)} MAD · marge unitaire ${fmt(it.price - it.cost)} MAD`
    ).join('\n');
  }

  /* Today's live activity — same sources the dashboard's KPI tiles and live
   * feed use (KiwiDemoClock for hour-by-hour aggregates, the row cache for
   * the last few enriched orders). Lets the agent answer "what's been sold
   * today?", "who's the busiest server right now?", "which table just paid?",
   * etc. without inventing data. Returns null when there's nothing yet. */
  function liveActivityContextLines() {
    const sim = window.KiwiDemoClock && window.KiwiDemoClock.getSimState && window.KiwiDemoClock.getSimState();
    const cache = window.__kiwiFeedOrders || {};
    const orders = Object.keys(cache).sort().map(k => cache[k]).filter(Boolean);
    if (!sim || (!sim.cumTx && !orders.length)) return null;

    const lines = [];
    /* Aggregates straight from the simulator — the merchant sees these at the
     * top of the dashboard, so the agent must match them exactly. */
    lines.push(
      `  · Heure de service simulée : ~${sim.simHourLabel || '—'}`,
      `  · Commandes encaissées depuis ce matin : ${fmt(sim.cumTx || 0)}`,
      `  · CA réalisé depuis ce matin : ${fmt(sim.cumRevenue || 0)} MAD`,
      `  · Panier moyen aujourd'hui : ${fmt(sim.panierMoyen || 0)} MAD`,
      `  · Clients réguliers identifiés : ${fmt(sim.cumRegulars || 0)}`
    );

    if (orders.length) {
      /* Compact per-order line: time · customer/table · server · payment ·
       * total · 1–2 items. Keeps the prompt readable even with 10 orders. */
      const fmt2 = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const recent = orders.slice(0, 8).map(o => {
        const items = (o.items || []).slice(0, 2).map(it => `×${it.qty} ${it.name}`).join(', ');
        const more = (o.items || []).length > 2 ? ` (+${o.items.length - 2})` : '';
        const table = o.table != null ? `T${o.table}` : '—';
        const covers = o.covers ? ` · ${o.covers} couvert${o.covers > 1 ? 's' : ''}` : '';
        const server = o.server ? ` · servi par ${o.server}` : '';
        const total = (o.total || o.amt) ? `${o.total || o.amt} MAD` : '—';
        return `  · ${o.t || '—'} · ${o.customer || '—'} · ${table}${covers}${server} · ${o.primary || '—'} · ${total}${items ? ` — ${items}${more}` : ''}`;
      });
      lines.push('', `  Les ${recent.length} dernières commandes encaissées (la plus récente d'abord) :`);
      lines.push(...recent);

      /* Servers actually seen on shift today, with their ticket count — lets
       * the model answer staffing questions from observed work, not the
       * static employee list. */
      const seenServers = {};
      orders.forEach(o => { if (o.server) seenServers[o.server] = (seenServers[o.server] || 0) + 1; });
      const servers = Object.keys(seenServers).sort((a, b) => seenServers[b] - seenServers[a]);
      if (servers.length) {
        lines.push('', `  Serveurs en service maintenant : ${servers.map(s => `${s} (${seenServers[s]} ticket${seenServers[s] > 1 ? 's' : ''})`).join(', ')}.`);
      }
    }
    return lines.join('\n');
  }

  function buildSystemPrompt(lang) {
    const dir = SP_DIR[lang] || SP_DIR.fr;
    if (B.partial) {
      return [
        dir, '',
        `Tu es l'assistant financier de "${B.name}", un établissement qui vient de démarrer sur Kiwi, au Maroc.`,
        B.revenue > 0
          ? `Seules données réelles disponibles : ${fmt(B.revenue)} MAD de ventes sur ${fmt(B.ordersPerMonth)} vente(s), panier moyen ${fmt(B.avgBasket)} MAD.`
          : `Aucune vente n'a encore été enregistrée pour cet établissement.`,
        `Tu n'as PAS sa structure de coûts (loyer, salaires, coût matière, marge, trésorerie, effectif) ni le détail de sa carte.`,
        '',
        'Règles :',
        `- N'invente JAMAIS un chiffre, un plat ou une statistique. Si on te demande une marge, un bénéfice, un seuil de rentabilité, des charges, ou les articles du menu, explique que le commerçant doit d'abord renseigner ces données dans Kiwi — ne donne ni nombre ni liste inventée.`,
        `- Tu peux donner des conseils de gestion généraux et qualitatifs, sans chiffrer ce que tu ne connais pas.`,
        `- Tu n'as pas accès à Internet ni à des données en temps réel.`,
        `- Ne donne jamais de conseil d'investissement boursier. Ne réponds pas aux questions sans lien avec l'activité.`,
        '',
        dir,
      ].join('\n');
    }
    const o = B.opex;
    const menu = menuContextLines();
    const live = liveActivityContextLines();
    const lines = [
      dir, '',
      `Tu es l'assistant financier de "Café Atlas · Maarif", un café-restaurant à Casablanca, au Maroc.`,
      'Tu conseilles son propriétaire, Rachid. Voici ses chiffres réels sur les 30 derniers jours (en dirhams marocains, MAD) :',
      `- Chiffre d'affaires : ${fmt(B.revenue)} MAD`,
      `- Coût matière : ${fmt(B.cogs)} MAD (${fmt1(100 - B.grossMargin)} % du CA)`,
      `- Marge brute : ${fmt(B.grossProfit)} MAD (${fmt1(B.grossMargin)} %)`,
      `- Charges fixes : ${fmt(B.totalOpex)} MAD — dont masse salariale ${fmt(o.salaries)}, loyer ${fmt(o.rent)}, énergie ${fmt(o.utilities)}.`,
      `- Bénéfice net : ${fmt(B.netProfit)} MAD (marge nette ${fmt1(B.netMargin)} %)`,
      `- Trésorerie disponible : ${fmt(B.cashBuffer)} MAD`,
      `- Panier moyen : ${fmt(B.avgBasket)} MAD · ${fmt(B.ordersPerMonth)} ventes/mois · ${B.staffCount} employés.`,
    ];
    if (live) {
      lines.push(
        '',
        `Activité en direct — ce que la caisse a enregistré depuis l'ouverture aujourd'hui. Pour toute question sur la journée en cours, les commandes du moment, les serveurs ou les tables, appuie-toi UNIQUEMENT sur ce bloc — ce sont les seules données fraîches dont tu disposes :`,
        live
      );
    }
    if (menu) {
      lines.push(
        '',
        `Sa carte réelle — chaque article avec ses ventes du mois, son prix et sa marge unitaire. Pour TOUTE question sur le menu, les plats, les meilleures ou les moins bonnes ventes, appuie-toi UNIQUEMENT sur cette liste — n'invente jamais un plat qui n'y figure pas :`,
        menu
      );
    } else {
      lines.push('', `Tu n'as pas le détail de sa carte : pour une question sur les plats, invite-le à ouvrir la page Menu — ne cite aucun plat de mémoire.`);
    }
    lines.push(
      '',
      'Règles :',
      `- Sois concis, concret et chiffré quand c'est utile.`,
      `- Tu peux parler de tout ce qui touche la gestion du café : finances, RH, marketing, opérations, fournisseurs, stratégie, menu.`,
      `- N'invente JAMAIS un chiffre, un plat ou une statistique : appuie-toi uniquement sur les données ci-dessus. Si une information manque, dis-le simplement.`,
      `- Tu NE réponds PAS aux questions sans lien avec l'activité (sport, célébrités, actualité). Décline poliment en une phrase.`,
      `- Tu n'as pas accès à Internet ni à des données en temps réel ; ne donne jamais de conseil d'investissement boursier.`,
      '',
      dir
    );
    return lines.join('\n');
  }

  /* ═══════════════ UI ═══════════════ */

  const ICON = {
    avatar: '<img class="fa-avatar-ico" src="assets/landing/icons/merchant.png" alt="" width="17" height="17" decoding="async"/>',
    keypad: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="3"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/></svg>',
    send: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  };

  /* one-time CSS */
  function injectCss() {
    if (document.getElementById('fa-css')) return;
    const s = document.createElement('style');
    s.id = 'fa-css';
    s.textContent = `
    /* ─── Financial assistant · interface ─────────────────────────────── */
    .fa-drawer .kiwi-drawer { display:flex; flex-direction:column; }
    .fa-drawer .kiwi-drawer-body { flex:1; min-height:0; padding:0 !important; display:flex; }
    .fa-drawer .kiwi-drawer-head { background:var(--paper); }
    .fa-drawer .kiwi-drawer-head h3 { font-family:'Instrument Serif',serif; font-weight:400;
      font-size:28px; letter-spacing:0; }
    .fa-drawer .kiwi-drawer-head p { color:var(--n-500); font-size:12.5px; }

    .fa { display:flex; width:100%; height:100%; background:var(--paper);
      --fa-ease:var(--ease-glide,cubic-bezier(.16,1,.30,1)); }
    .fa-main { flex:1; display:flex; flex-direction:column; min-width:0; }

    /* thread */
    .fa-thread { flex:1; overflow-y:auto; padding:34px clamp(20px,8%,120px) 26px; }
    .fa-thread::-webkit-scrollbar { width:8px; }
    .fa-thread::-webkit-scrollbar-thumb { background:var(--n-200); border-radius:8px; }
    .fa-thread-in { max-width:730px; margin:0 auto; display:flex; flex-direction:column; gap:28px; }
    .fa-msg { display:flex; gap:14px; animation:fa-rise 560ms var(--fa-ease) both; }
    .fa-msg.user { justify-content:flex-end; }
    @keyframes fa-rise { from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:none; } }

    .fa-avatar { width:30px; height:30px; border-radius:50%; flex-shrink:0; margin-top:1px;
      display:flex; align-items:center; justify-content:center;
      background:linear-gradient(150deg,var(--atlas),var(--riad)); color:var(--mint);
      box-shadow:0 3px 10px -3px rgba(11,110,79,.55); }
    .fa-avatar-ico { width:17px; height:17px;
      filter:brightness(0) saturate(100%) invert(85%) sepia(31%) saturate(469%)
        hue-rotate(70deg) brightness(102%) contrast(91%); }

    /* agent message — text flows on paper, no box */
    .fa-msg.agent .fa-bubble { flex:1; min-width:0; max-width:632px; padding-top:3px;
      font-size:14px; line-height:1.62; color:var(--ink); }
    /* user message — soft white card */
    .fa-msg.user .fa-bubble { max-width:78%; background:#fff; border:1px solid var(--n-200);
      border-radius:18px 18px 6px 18px; padding:11px 16px; font-size:13.5px; line-height:1.55;
      color:var(--ink); box-shadow:0 4px 16px -10px rgba(10,15,13,.22); }
    [dir="rtl"] .fa-msg.user .fa-bubble { border-radius:18px 18px 18px 6px; }
    .fa-bubble b { font-weight:600; color:var(--riad); }
    .fa-bubble i { color:var(--n-500); font-style:italic; }

    /* stat cards */
    .fa-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:16px; }
    .fa-stat { background:#fff; border:1px solid var(--n-200); border-radius:14px; padding:12px 14px;
      transition:border-color 150ms; }
    .fa-stat:hover { border-color:var(--n-300); }
    .fa-stat .l { font-size:9.5px; letter-spacing:.085em; text-transform:uppercase; color:var(--n-500); font-weight:600; }
    .fa-stat .v { font-size:18.5px; font-weight:600; margin-top:5px; color:var(--ink);
      font-variant-numeric:tabular-nums; letter-spacing:-.012em; }
    .fa-stat .h { font-size:10.5px; color:var(--n-500); margin-top:3px; line-height:1.4; }

    /* verdict */
    .fa-verdict { margin-top:14px; padding:12px 14px; border-radius:13px; font-size:12.5px;
      font-weight:500; line-height:1.5; }
    .fa-verdict.good { background:rgba(11,110,79,.08); color:var(--atlas); }
    .fa-verdict.warn { background:rgba(176,124,0,.11); color:#8a6200; }
    .fa-verdict.bad  { background:rgba(193,58,48,.10); color:#b3392f; }
    .fa-note { margin-top:11px; font-size:11.5px; color:var(--n-500); font-style:italic; line-height:1.5; }

    /* suggestion chips */
    .fa-follow { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
    .fa-follow button { font-size:12px; font-weight:450; padding:8px 14px; border-radius:999px;
      border:1px solid var(--n-200); background:#fff; color:var(--ink); cursor:pointer;
      transition:transform 160ms var(--fa-ease), border-color 160ms, color 160ms, box-shadow 160ms; }
    .fa-follow button:hover { border-color:var(--atlas); color:var(--atlas); transform:translateY(-1px);
      box-shadow:0 8px 18px -12px rgba(11,110,79,.55); }

    /* typing */
    .fa-typing { display:flex; gap:4px; padding:6px 2px; }
    .fa-typing i { width:6px; height:6px; border-radius:50%; background:var(--n-400); animation:fa-bounce 1.1s infinite; }
    .fa-typing i:nth-child(2){ animation-delay:.15s; } .fa-typing i:nth-child(3){ animation-delay:.3s; }
    @keyframes fa-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-5px); opacity:1; } }

    /* dock */
    .fa-dock { border-top:1px solid var(--n-200); background:var(--paper);
      padding:15px clamp(20px,8%,120px) 19px; }
    .fa-dock-in { max-width:730px; margin:0 auto; }
    .fa-inputwrap { display:flex; align-items:flex-end; gap:8px; background:#fff;
      border:1px solid var(--n-300); border-radius:21px; padding:6px; padding-inline-start:18px;
      box-shadow:0 8px 26px -16px rgba(10,15,13,.26); transition:border-color 170ms, box-shadow 170ms; }
    .fa-inputwrap:focus-within { border-color:var(--atlas); box-shadow:0 10px 30px -16px rgba(11,110,79,.4); }
    .fa-input { flex:1; resize:none; border:none; outline:none; background:transparent; font:inherit;
      font-size:14px; line-height:1.5; padding:10px 0; max-height:144px; color:var(--ink); }
    .fa-input::placeholder { color:var(--n-400); }
    .fa-send { width:39px; height:39px; border-radius:50%; border:none; flex-shrink:0; cursor:pointer;
      background:var(--atlas); color:#fff; display:flex; align-items:center; justify-content:center;
      transition:transform 150ms var(--fa-ease), background 150ms; }
    .fa-send:hover { background:var(--riad); transform:scale(1.06); }
    .fa-send:active { transform:scale(.93); }
    [dir="rtl"] .fa-send svg { transform:scaleX(-1); }
    .fa-toolbar { display:flex; align-items:center; justify-content:space-between; margin-top:11px; padding:0 4px; }
    .fa-tool { display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:500;
      color:var(--n-600); background:#fff; border:1px solid var(--n-200); border-radius:999px;
      padding:7px 14px; cursor:pointer; transition:all 150ms var(--fa-ease); }
    .fa-tool:hover { border-color:var(--n-400); color:var(--ink); transform:translateY(-1px); }
    .fa-tool.on { background:var(--atlas); border-color:var(--atlas); color:#fff; }
    .fa-tool svg { width:14px; height:14px; }
    .fa-hint { font-size:11px; color:var(--n-400); }

    /* calculator — hidden until toggled */
    .fa-keypad { display:none; }
    .fa-keypad.open { display:block; animation:fa-kp-in 300ms var(--ease-out,cubic-bezier(.32,.72,0,1)) both; }
    @keyframes fa-kp-in { from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
    .fa-keypad-card { background:#fff; border:1px solid var(--n-200); border-radius:22px; padding:14px;
      margin-bottom:14px; box-shadow:0 18px 44px -26px rgba(10,15,13,.35); }
    .fa-kpdisplay { background:var(--ink); color:#fff; border-radius:14px; padding:16px 18px;
      text-align:right; direction:ltr;
      font-family:var(--mono); font-size:25px; letter-spacing:.02em; overflow:hidden; white-space:nowrap; }
    .fa-kpgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:11px; direction:ltr; }
    .fa-kpgrid button { padding:15px 0; border-radius:14px; border:1px solid var(--n-200);
      background:var(--paper-soft); font-size:16px; font-family:var(--mono); color:var(--ink);
      cursor:pointer; transition:transform 90ms, background 130ms; }
    .fa-kpgrid button:hover { background:var(--n-100); }
    .fa-kpgrid button:active { transform:scale(.94); }
    .fa-kpgrid button.op { color:var(--atlas); font-weight:600; }
    .fa-kpgrid button.eq { background:var(--atlas); color:#fff; border-color:var(--atlas);
      grid-column:span 2; font-weight:600; }
    .fa-kpgrid button.eq:hover { background:var(--riad); }
    .fa-kp-use { display:block; margin-top:10px; width:100%; padding:11px 12px;
      border-radius:13px; border:0; background:var(--atlas); color:#fff;
      font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;
      transition:background 130ms, transform 90ms; }
    .fa-kp-use[hidden] { display:none; }
    .fa-kp-use:hover { background:var(--riad); }
    .fa-kp-use:active { transform:scale(.97); }

    /* context rail */
    .fa-context { width:312px; flex-shrink:0; border-inline-start:1px solid var(--n-200);
      background:var(--paper); padding:28px 22px; overflow-y:auto; }
    .fa-ctx-eyebrow { font-size:10px; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--n-500); }
    .fa-ctx-biz { font-size:14.5px; font-weight:600; color:var(--ink); margin-top:5px; line-height:1.2; }
    .fa-ctx-sub { font-size:11px; color:var(--n-500); margin-top:3px; }
    .fa-ctx-group { margin-top:6px; }
    .fa-ctx-gh { display:flex; justify-content:space-between; align-items:baseline; gap:8px;
      font-size:10px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--n-500);
      margin:18px 0 5px; padding:0 10px; }
    .fa-ctx-gh .tot { color:var(--atlas); letter-spacing:.02em; }
    .fa-ctx-item { display:flex; justify-content:space-between; align-items:baseline; gap:12px; width:100%;
      padding:9px 10px; border:none; background:transparent; border-radius:10px; cursor:pointer;
      text-align:start; font:inherit; transition:background 130ms var(--fa-ease); }
    .fa-ctx-item:hover { background:var(--paper-soft); }
    .fa-ctx-item .k { font-size:12px; color:var(--n-600); }
    .fa-ctx-item .v { font-size:12.5px; font-weight:600; color:var(--ink);
      font-variant-numeric:tabular-nums; text-align:end; white-space:nowrap; }
    .fa-ctx-item.fa-flash { animation:fa-flash-kf 540ms var(--fa-ease); }
    @keyframes fa-flash-kf { 0%{ background:rgba(11,110,79,.20); } 100%{ background:transparent; } }
    .fa-ctx-net { margin-top:18px; padding:16px 17px; border-radius:17px; color:#fff; width:100%;
      text-align:start; border:none; cursor:pointer;
      background:linear-gradient(145deg,var(--atlas),var(--riad)); box-shadow:0 16px 34px -20px rgba(11,110,79,.65);
      transition:transform 160ms var(--fa-ease); }
    .fa-ctx-net:hover { transform:translateY(-2px); }
    .fa-ctx-net.fa-flash { animation:fa-flash-net 540ms ease; }
    @keyframes fa-flash-net { 0%{ filter:brightness(1.4); } 100%{ filter:brightness(1); } }
    .fa-ctx-net .k { font-size:10px; letter-spacing:.1em; text-transform:uppercase; opacity:.82; }
    .fa-ctx-net .v { font-size:23px; font-weight:600; margin-top:6px; font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
    .fa-ctx-net .s { font-size:11.5px; opacity:.82; margin-top:2px; }
    .fa-ctx-note { margin-top:20px; font-size:11.5px; color:var(--n-500); line-height:1.55; }
    .fa-ctx-trust { margin-top:13px; display:flex; gap:7px; align-items:flex-start; font-size:11px; color:var(--n-500); line-height:1.45; }
    .fa-ctx-trust svg { width:13px; height:13px; color:var(--atlas); flex-shrink:0; margin-top:1px; }
    @media (max-width:920px) { .fa-context { display:none; } }

    /* ─── empty-state hero — the first screen, before any conversation ─── */
    .fa-hero { display:flex; flex-direction:column; }
    .fa-hero-mark { width:46px; height:46px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; background:linear-gradient(150deg,var(--atlas),var(--riad)); color:var(--mint);
      box-shadow:0 8px 22px -8px rgba(11,110,79,.6); }
    .fa-hero-mark svg { width:21px; height:21px; }
    .fa-hero-h { font-family:'Instrument Serif',serif; font-size:31px; color:var(--ink); margin:17px 0 0; line-height:1.08; }
    .fa-hero-p { font-size:14px; color:var(--n-600); line-height:1.62; margin-top:9px; max-width:540px; }
    .fa-hero-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; margin-top:24px; }
    .fa-hero-card { display:flex; flex-direction:column; align-items:flex-start; text-align:start;
      background:#fff; border:1px solid var(--n-200); border-radius:16px; padding:15px 14px; cursor:pointer;
      font:inherit; transition:transform 160ms var(--fa-ease), border-color 160ms, box-shadow 160ms;
      box-shadow:0 1px 2px rgba(10,15,13,.04), 0 18px 32px -26px rgba(10,15,13,.24); }
    .fa-hero-card:hover { border-color:var(--atlas); transform:translateY(-2px);
      box-shadow:0 16px 30px -18px rgba(11,110,79,.42); }
    .fa-hero-card:active { transform:scale(.98); }
    .fa-hero-card .ic { width:32px; height:32px; border-radius:10px; display:flex; align-items:center;
      justify-content:center; background:var(--paper-soft); color:var(--atlas); margin-bottom:12px; }
    .fa-hero-card .ic svg { width:17px; height:17px; }
    .fa-hero-card .t { font-size:13px; font-weight:600; color:var(--ink); }
    .fa-hero-card .s { font-size:11.5px; color:var(--n-500); margin-top:3px; line-height:1.4; }
    .fa-hero-insight { display:flex; gap:11px; align-items:flex-start; margin-top:13px;
      padding:14px 16px; border-radius:15px; background:var(--paper-soft); border:1px solid var(--n-200);
      font-size:12.5px; color:var(--n-600); line-height:1.55; }
    .fa-hero-insight svg { width:16px; height:16px; color:var(--atlas); flex-shrink:0; margin-top:1px; }
    .fa-hero-insight b { color:var(--atlas); font-weight:600; }
    @media (max-width:560px) { .fa-hero-cards { grid-template-columns:1fr; } }

    /* ─── curated context rail — 4 KPIs, a cost split, the rest folded away ─── */
    .fa-ctx-kpis { margin-top:20px; }
    .fa-ctx-kpi { display:flex; justify-content:space-between; align-items:baseline; gap:12px; width:100%;
      border:0; background:transparent; padding:12px 8px; border-radius:11px; cursor:pointer;
      text-align:start; font:inherit; transition:background 130ms var(--fa-ease); }
    .fa-ctx-kpi + .fa-ctx-kpi { border-top:1px solid var(--n-200); }
    .fa-ctx-kpi:hover { background:var(--paper-soft); }
    .fa-ctx-kpi.fa-flash { animation:fa-flash-kf 540ms var(--fa-ease); }
    .fa-ctx-kpi .k { font-size:11.5px; color:var(--n-600); }
    .fa-ctx-kpi .v { font-size:15px; font-weight:600; color:var(--ink); white-space:nowrap; text-align:end;
      font-variant-numeric:tabular-nums; }
    .fa-ctx-kpi.hl .v { color:var(--atlas); }
    .fa-ctx-viz { margin-top:20px; padding-top:18px; border-top:1px solid var(--n-200); }
    .fa-ctx-viz-h { display:flex; justify-content:space-between; align-items:baseline;
      font-size:10px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--n-500); }
    .fa-ctx-viz-h .t { color:var(--atlas); letter-spacing:.02em; }
    .fa-ctx-bar { display:flex; height:10px; border-radius:999px; overflow:hidden; margin-top:10px; gap:2px; }
    .fa-ctx-bar span { display:block; height:100%; }
    .fa-ctx-leg { display:flex; flex-wrap:wrap; gap:8px 14px; margin-top:11px; }
    .fa-ctx-leg .li { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--n-600); }
    .fa-ctx-leg .li i { width:8px; height:8px; border-radius:3px; flex-shrink:0; }
    .fa-ctx-more { width:100%; margin-top:18px; font:inherit; font-size:12px; font-weight:500;
      color:var(--n-600); background:transparent; border:1px solid var(--n-200); border-radius:11px;
      padding:10px; cursor:pointer; transition:all 140ms; }
    .fa-ctx-more:hover { border-color:var(--n-400); color:var(--ink); }
    .fa-ctx-detail[hidden] { display:none; }

    /* in-browser LLM */
    .fa-llm-btn { font-size:13px; font-weight:600; padding:11px 19px; border-radius:999px; border:none;
      background:var(--atlas); color:#fff; cursor:pointer; transition:transform 150ms var(--fa-ease), background 150ms;
      box-shadow:0 10px 24px -12px rgba(11,110,79,.6); }
    .fa-llm-btn:hover { background:var(--riad); transform:translateY(-1px); }
    .fa-llm-prog { height:8px; border-radius:999px; background:var(--n-200); overflow:hidden; margin:13px 0 8px; }
    .fa-llm-bar { height:100%; width:0%; border-radius:999px;
      background:linear-gradient(90deg,var(--atlas),var(--mint)); transition:width 240ms ease; }
    .fa-llm-ptxt { font-size:11.5px; color:var(--n-500); }
    [data-fa-stream] { white-space:pre-wrap; }

    /* ─── Dark theme · flat, contour-free, off-white (ChatGPT-style) ──────
     * In dark mode the assistant drops every light card, border and bright
     * accent — surfaces sit on the flat --paper tones, text is off-white,
     * nothing is outlined. */
    html[data-theme="dark"] .fa-msg.user .fa-bubble {
      background:var(--paper-soft); border:none; box-shadow:none; }
    html[data-theme="dark"] .fa-bubble b { color:var(--ink); }
    html[data-theme="dark"] .fa-avatar { background:var(--paper-muted); box-shadow:none; }
    html[data-theme="dark"] .fa-avatar-ico { filter:brightness(0) invert(0.92); }
    html[data-theme="dark"] .fa-stat,
    html[data-theme="dark"] .fa-stat:hover { background:var(--paper-soft); border:none; }
    html[data-theme="dark"] .fa-follow button {
      background:var(--paper-soft); border:none; color:var(--ink); box-shadow:none; }
    html[data-theme="dark"] .fa-follow button:hover { background:var(--paper-muted); color:var(--ink); }
    html[data-theme="dark"] .fa-dock { border-top:none; }
    html[data-theme="dark"] .fa-inputwrap { background:var(--paper-soft); border:none; box-shadow:none; }
    html[data-theme="dark"] .fa-inputwrap:focus-within {
      background:var(--paper-muted); border:none; box-shadow:none; }
    html[data-theme="dark"] .fa-send { background:var(--ink); color:var(--paper); }
    html[data-theme="dark"] .fa-send:hover { background:var(--n-700); }
    html[data-theme="dark"] .fa-tool { background:var(--paper-soft); border:none; color:var(--ink); }
    html[data-theme="dark"] .fa-tool:hover,
    html[data-theme="dark"] .fa-tool.on { background:var(--paper-muted); border:none; color:var(--ink); }
    html[data-theme="dark"] .fa-keypad-card { background:var(--paper-soft); border:none; box-shadow:none; }
    html[data-theme="dark"] .fa-kpdisplay { background:var(--paper-muted); color:var(--ink); }
    html[data-theme="dark"] .fa-kpgrid button { background:var(--paper-muted); border:none; }
    html[data-theme="dark"] .fa-kpgrid button.op { color:var(--ink); }
    html[data-theme="dark"] .fa-kpgrid button.eq { background:var(--n-200); border:none; color:var(--ink); }
    html[data-theme="dark"] .fa-context { background:var(--paper-soft); border-inline-start:none; }
    html[data-theme="dark"] .fa-ctx-eyebrow { color:var(--n-500); }
    html[data-theme="dark"] .fa-ctx-gh .tot { color:var(--ink); }
    html[data-theme="dark"] .fa-ctx-item:hover { background:var(--paper-muted); }
    html[data-theme="dark"] .fa-ctx-net {
      background:var(--paper-muted); border:none; box-shadow:none; color:var(--ink); }
    html[data-theme="dark"] .fa-ctx-trust svg { color:var(--n-500); }
    html[data-theme="dark"] .fa-llm-btn {
      background:var(--paper-muted); color:var(--ink); box-shadow:none; }
    html[data-theme="dark"] .fa-llm-btn:hover { background:var(--n-200); }
    html[data-theme="dark"] .fa-drawer :focus-visible { outline-color:var(--n-500); }
    `;
    document.head.appendChild(s);
  }

  /* render an agent reply object → HTML string */
  function replyHtml(r) {
    let h = `<div>${r.text}</div>`;
    if (r.stats && r.stats.length) {
      h += '<div class="fa-stats">' + r.stats.map((s) =>
        `<div class="fa-stat"><div class="l">${s.l}</div><div class="v">${s.v}</div>${s.h ? `<div class="h">${s.h}</div>` : ''}</div>`
      ).join('') + '</div>';
    }
    if (r.verdict) h += `<div class="fa-verdict ${r.verdict.tone}">${r.verdict.text}</div>`;
    if (r.note) h += `<div class="fa-note">${r.note}</div>`;
    if (r.follow && r.follow.length) {
      h += '<div class="fa-follow">' + r.follow.map((f) =>
        `<button data-fa-follow="${escAttr(f)}">${f}</button>`).join('') + '</div>';
    }
    if (r.open && r.open.length) {
      h += '<div class="fa-follow">' + r.open.map((o) =>
        `<button class="fa-llm-btn" data-fa-open="${escAttr(o.handler)}">${o.label}</button>`).join('') + '</div>';
    }
    return h;
  }

  function open(prefill) {
    if (!window.Kiwi || !window.Kiwi.drawer) return;
    L = getLang();
    injectCss();
    syncProfile();   // build the profile for whatever venue is active
    const u = tr().ui;

    // Every fact the agent knows — grouped, each row click-to-insert.
    const ctxItem = (k, v) =>
      `<button class="fa-ctx-item" type="button" data-fa-fact="${escAttr(`${k} : ${v}`)}"><span class="k">${k}</span><span class="v">${v}</span></button>`;
    const ctxGroup = (title, items, total) =>
      `<div class="fa-ctx-group"><div class="fa-ctx-gh"><span>${title}</span>${total ? `<span class="tot">${total}</span>` : ''}</div>${items.map(([k, v]) => ctxItem(k, v)).join('')}</div>`;
    /* The context rail — full financial panel for Café Atlas, or a clean
     * "new venue" panel (real recorded sales only) for a custom venue. */
    let asideHtml;
    if (B.partial) {
      const p = nv();
      const rows = B.revenue > 0
        ? [[p.revLabel, fmtMad(B.revenue)], [p.ordLabel, fmt(B.ordersPerMonth)], [p.basketLabel, fmtMad(B.avgBasket)]]
        : [];
      asideHtml =
        `<div class="fa-ctx-eyebrow">${u.ctxEyebrow}</div>` +
        `<div class="fa-ctx-biz">${B.name}</div>` +
        `<div class="fa-ctx-sub">${u.ctxSub}</div>` +
        (rows.length
          ? `<div class="fa-ctx-kpis">${rows.map(([k, v]) =>
              `<button class="fa-ctx-kpi" type="button" data-fa-fact="${escAttr(k + ' : ' + v)}"><span class="k">${k}</span><span class="v">${v}</span></button>`).join('')}</div>`
          : '') +
        `<div class="fa-ctx-detail" style="display:block;font-size:12.5px;color:var(--n-500);line-height:1.55;">${p.railEmpty}</div>` +
        `<div class="fa-ctx-trust">${ICON.lock}<span>${u.ctxTrust}</span></div>`;
    } else {
      const f = tr().facts;
      const opexItems = Object.entries(B.opex).sort((a, b) => b[1] - a[1])
        .map(([k, v]) => [tr().opex[k] || k, fmtMad(v)]);
      const ctxRail =
        ctxGroup(u.gActivity, [
          [f.revenue, fmtMad(B.revenue)],
          [f.revPerDay, fmtMad(B.dailyRev)],
          [f.mtdRev, `${fmtMad(B.mtdRevenue)} · ${B.mtdDays} ${u.days}`],
          [f.ordersMonth, fmt(B.ordersPerMonth)],
          [f.ordersDay, fmt(B.ordersPerDay)],
          [f.basket, fmtMad(B.avgBasket)],
        ]) +
        ctxGroup(u.gProfit, [
          [f.grossMargin, `${fmtMad(B.grossProfit)} · ${fmt1(B.grossMargin)} %`],
          [f.cogs, `${fmtMad(B.cogs)} · ${fmt1(100 - B.grossMargin)} %`],
          [f.profitPerOrder, fmtMad(B.netPerOrder)],
          [f.breakEven, `${fmtMad(B.breakEvenRev)} ${u.perMonth}`],
        ]) +
        ctxGroup(u.gFixed, opexItems, `${fmtMad(B.totalOpex)} ${u.perMonth}`) +
        ctxGroup(u.gCash, [
          [f.cashAvail, fmtMad(B.cashBuffer)],
          [f.headcount, u.employees(B.staffCount)],
        ]);
      const netFact = `${f.netProfit} : ${fmtMad(B.netProfit)} · ${f.netMarginLine(fmt1(B.netMargin))}`;
      const kpiFact = (k, v) => `${k} : ${v}`;
      const coreKpis = [
        { k: f.revenue, v: fmtMad(B.revenue), fact: kpiFact(f.revenue, fmtMad(B.revenue)) },
        { k: f.grossMargin, v: fmtMad(B.grossProfit), fact: kpiFact(f.grossMargin, `${fmtMad(B.grossProfit)} · ${fmt1(B.grossMargin)} %`) },
        { k: f.netProfit, v: fmtMad(B.netProfit), fact: netFact, hl: true },
        { k: f.cashAvail, v: fmtMad(B.cashBuffer), fact: kpiFact(f.cashAvail, fmtMad(B.cashBuffer)) },
      ];
      const opexRaw = Object.entries(B.opex).sort((a, b) => b[1] - a[1]);
      const vizColors = ['var(--atlas)', '#46A878', '#7DF2B0', '#cdd6d0'];
      const vizParts = opexRaw.slice(0, 3).map(([k, v], i) => ({ k: tr().opex[k] || k, v, c: vizColors[i] }));
      vizParts.push({ k: HL().autres, v: opexRaw.slice(3).reduce((s, r) => s + r[1], 0), c: vizColors[3] });
      asideHtml =
        `<div class="fa-ctx-eyebrow">${u.ctxEyebrow}</div>` +
        `<div class="fa-ctx-biz">${B.name}</div>` +
        `<div class="fa-ctx-sub">${u.ctxSub}</div>` +
        `<div class="fa-ctx-kpis">${coreKpis.map((c) => `<button class="fa-ctx-kpi${c.hl ? ' hl' : ''}" type="button" data-fa-fact="${escAttr(c.fact)}"><span class="k">${c.k}</span><span class="v">${c.v}</span></button>`).join('')}</div>` +
        `<div class="fa-ctx-viz">` +
          `<div class="fa-ctx-viz-h"><span>${u.gFixed}</span><span class="t">${fmtMad(B.totalOpex)}</span></div>` +
          `<div class="fa-ctx-bar">${vizParts.map((p) => `<span style="width:${(p.v / B.totalOpex * 100).toFixed(1)}%;background:${p.c};"></span>`).join('')}</div>` +
          `<div class="fa-ctx-leg">${vizParts.map((p) => `<span class="li"><i style="background:${p.c};"></i>${p.k}</span>`).join('')}</div>` +
        `</div>` +
        `<button class="fa-ctx-more" type="button" data-fa-ctx-more>${HL().more}</button>` +
        `<div class="fa-ctx-detail" data-fa-detail hidden>${ctxRail}</div>` +
        `<div class="fa-ctx-trust">${ICON.lock}<span>${u.ctxTrust}</span></div>`;
    }

    const body = `
      <div class="fa">
        <div class="fa-main">
          <div class="fa-thread">
            <div class="fa-thread-in" data-fa-thread></div>
          </div>
          <div class="fa-dock">
            <div class="fa-dock-in">
              <div class="fa-keypad" data-fa-keypad>
                <div class="fa-keypad-card">
                  <div class="fa-kpdisplay" data-fa-kpd>0</div>
                  <div class="fa-kpgrid">
                    ${['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.']
                      .map((k) => `<button class="${/[÷×−+%]/.test(k) ? 'op' : ''}" data-fa-key="${k}">${k}</button>`).join('')}
                    <button class="eq" data-fa-key="=">=</button>
                  </div>
                  <button class="fa-kp-use" data-fa-kp-use type="button" hidden>${u.kpUse}</button>
                </div>
              </div>
              <div class="fa-inputwrap">
                <textarea class="fa-input" data-fa-input rows="1"
                  placeholder="${escAttr(u.placeholder)}"></textarea>
                <button class="fa-send" data-fa-send title="${escAttr(u.send)}">${ICON.send}</button>
              </div>
              <div class="fa-toolbar">
                <button class="fa-tool" data-fa-keypad-toggle type="button">${ICON.keypad}<span>${u.calc}</span></button>
                <span class="fa-hint">${u.enterToSend}</span>
              </div>
            </div>
          </div>
        </div>
        <aside class="fa-context">${asideHtml}</aside>
      </div>`;

    const res = window.Kiwi.drawer({
      title: u.title,
      subtitle: u.subtitle,
      body,
      fullpage: true,
    });
    res.el.classList.add('fa-drawer');

    const root = res.el;
    const thread = root.querySelector('[data-fa-thread]');
    const threadScroll = root.querySelector('.fa-thread');
    const input = root.querySelector('[data-fa-input]');
    const keypad = root.querySelector('[data-fa-keypad]');
    const kpd = root.querySelector('[data-fa-kpd]');

    const scrollDown = () => { threadScroll.scrollTop = threadScroll.scrollHeight; };

    function pushUser(text) {
      const m = document.createElement('div');
      m.className = 'fa-msg user';
      m.insertAdjacentHTML('beforeend', `<div class="fa-bubble"></div>`);
      m.querySelector('.fa-bubble').textContent = text;
      thread.appendChild(m);
      scrollDown();
    }
    function pushAgent(html) {
      const m = document.createElement('div');
      m.className = 'fa-msg agent';
      m.insertAdjacentHTML('beforeend',
        `<div class="fa-avatar">${ICON.avatar}</div><div class="fa-bubble">${html}</div>`);
      thread.appendChild(m);
      scrollDown();
      return m;
    }
    function pushTyping() {
      const m = document.createElement('div');
      m.className = 'fa-msg agent';
      m.insertAdjacentHTML('beforeend',
        `<div class="fa-avatar">${ICON.avatar}</div><div class="fa-bubble"><div class="fa-typing"><i></i><i></i><i></i></div></div>`);
      thread.appendChild(m);
      scrollDown();
      return m;
    }

    function ask(text) {
      const t = (text || '').trim();
      if (!t) return;
      const hero = thread.querySelector('[data-fa-hero]');
      if (hero) hero.remove();
      pushUser(t);
      const reply = respond(t);
      if (reply) {
        const typing = pushTyping();
        setTimeout(() => { typing.remove(); pushAgent(replyHtml(reply)); }, 460 + Math.random() * 300);
        return;
      }
      routeToLlm(t);
    }

    function routeToLlm(question) {
      const m = tr().llm;
      if (!('gpu' in navigator)) {
        pushAgent(replyHtml({ text: m.noGpu, follow: [tr().chips.charges, tr().chips.breakeven] }));
        return;
      }
      if (LLM.status === 'ready') { runLlm(question); return; }
      if (LLM.status === 'loading') {
        LLM.pending = question;
        pushAgent(replyHtml({ text: m.loading(Math.round(LLM.progress * 100)) }));
        return;
      }
      LLM.pending = question;
      pushAgent(
        `<div>${m.offerLead}</div>
         <div class="fa-note" style="font-style:normal;">${m.offerSize(LLM.sizeLabel)}</div>
         <div class="fa-follow"><button type="button" class="fa-llm-btn" data-fa-activate>${m.activate}</button></div>`);
    }

    async function activateLlm() {
      if (LLM.status === 'loading' || LLM.status === 'ready') return;
      const m = tr().llm;
      LLM.status = 'loading';
      const card = pushAgent(
        `<div>${m.installing}</div>
         <div class="fa-llm-prog"><div class="fa-llm-bar" data-fa-bar></div></div>
         <div class="fa-llm-ptxt" data-fa-ptxt>${m.initializing}</div>`);
      const bar = card.querySelector('[data-fa-bar]');
      const ptxt = card.querySelector('[data-fa-ptxt]');
      try {
        const webllm = await import(LLM.cdn);
        LLM.engine = await webllm.CreateMLCEngine(LLM.model, {
          initProgressCallback: (p) => {
            LLM.progress = p.progress || 0;
            if (bar) bar.style.width = Math.round(LLM.progress * 100) + '%';
            if (ptxt) ptxt.textContent = p.text || `${Math.round(LLM.progress * 100)} %`;
          },
        });
        LLM.status = 'ready';
        if (bar) bar.style.width = '100%';
        if (ptxt) ptxt.textContent = m.ready;
        pushAgent(replyHtml({ text: m.readyMsg }));
        if (LLM.pending) { const q = LLM.pending; LLM.pending = null; runLlm(q); }
      } catch (e) {
        LLM.status = 'error';
        if (ptxt) ptxt.textContent = m.loadFail;
        pushAgent(replyHtml({ text: m.loadFailMsg }));
      }
    }

    async function runLlm(question) {
      const typing = pushTyping();
      llmHistory.push({ role: 'user', content: question });
      /* `/no_think` is Qwen3's soft switch for non-thinking mode — a
       * prompt-only mechanism (no API plumbing to depend on), with
       * stripThink() as the safety net if a block slips through. */
      const sys = buildSystemPrompt(detectQLang(question)) + '\n\n/no_think';
      const messages = [{ role: 'system', content: sys }, ...llmHistory.slice(-8)];
      try {
        const stream = await LLM.engine.chat.completions.create({
          messages,
          /* Qwen3 non-thinking sampling, per the model card (temp 0.7, top_p
           * 0.8) — avoids the repetition that greedy/low-temp triggers. */
          temperature: 0.7,
          top_p: 0.8,
          stream: true,
        });
        typing.remove();
        const bubble = pushAgent('<span data-fa-stream></span>');
        const target = bubble.querySelector('[data-fa-stream]');
        let acc = '';
        for await (const chunk of stream) {
          acc += chunk.choices?.[0]?.delta?.content || '';
          if (target) target.textContent = stripThink(acc);
          scrollDown();
        }
        /* Store the clean answer — Qwen3 guidance is to keep prior thinking
         * content OUT of multi-turn history. */
        llmHistory.push({ role: 'assistant', content: stripThink(acc) });
      } catch (e) {
        typing.remove();
        pushAgent(replyHtml({ text: tr().llm.runErr }));
      }
    }

    // first screen — the empty-state hero, replaced by the conversation on first ask
    thread.insertAdjacentHTML('beforeend', renderHero());

    if (typeof prefill === 'string' && prefill.trim()) {
      setTimeout(() => ask(prefill.trim()), 360);
    }

    // ─── input wiring ───
    function send() {
      const v = input.value;
      input.value = '';
      input.style.height = 'auto';
      ask(v);
    }
    function insertFact(text, el) {
      const cur = input.value.trim();
      input.value = cur ? `${cur} · ${text}` : text;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 144) + 'px';
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
      if (el) { el.classList.remove('fa-flash'); void el.offsetWidth; el.classList.add('fa-flash'); }
    }
    root.querySelector('[data-fa-send]').addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    });

    // ─── chips + follow-ups + facts (delegated) ───
    root.addEventListener('click', (e) => {
      const follow = e.target.closest('[data-fa-follow]');
      if (follow) { ask(follow.getAttribute('data-fa-follow')); return; }
      const openBtn = e.target.closest('[data-fa-open]');
      if (openBtn) {
        const fn = window.Kiwi && window.Kiwi.handlers && window.Kiwi.handlers[openBtn.getAttribute('data-fa-open')];
        if (typeof fn === 'function') fn();
        return;
      }
      if (e.target.closest('[data-fa-activate]')) { activateLlm(); return; }
      const moreBtn = e.target.closest('[data-fa-ctx-more]');
      if (moreBtn) {
        const det = root.querySelector('[data-fa-detail]');
        if (det) {
          det.hidden = !det.hidden;
          moreBtn.textContent = det.hidden ? HL().more : HL().less;
        }
        return;
      }
      const fact = e.target.closest('[data-fa-fact]');
      if (fact) { insertFact(fact.getAttribute('data-fa-fact'), fact); return; }
    });

    // ─── keypad ───
    const toggle = root.querySelector('[data-fa-keypad-toggle]');
    toggle.addEventListener('click', () => {
      const isOpen = keypad.classList.toggle('open');
      toggle.classList.toggle('on', isOpen);
    });

    const kpUse = root.querySelector('[data-fa-kp-use]');
    let kpExpr = '', kpDone = false;
    const kpShow = () => {
      kpd.textContent = kpExpr || '0';
      if (kpUse) kpUse.hidden = !(kpDone && kpExpr);
    };
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fa-key]');
      if (!btn) return;
      const k = btn.getAttribute('data-fa-key');
      if (k === 'C') { kpExpr = ''; kpDone = false; }
      else if (k === '⌫') { kpExpr = kpExpr.slice(0, -1); }
      else if (k === '=') {
        const r = evalMath(kpExpr);
        if (r != null) {
          kpExpr = String(Math.round(r * 1e6) / 1e6);
          kpDone = true;
        } else { kpd.textContent = tr().ui.kpError; if (kpUse) kpUse.hidden = true; return; }
      } else {
        const isOp = /[÷×−+%]/.test(k);
        if (kpDone && !isOp) { kpExpr = ''; kpDone = false; }
        else if (kpDone && isOp) { kpDone = false; }
        kpExpr += k;
      }
      kpShow();
    });
    /* Calculator → conversation bridge — drop the computed result into the
     * message box so the owner can build a question around it. */
    if (kpUse) kpUse.addEventListener('click', () => {
      if (!kpExpr) return;
      insertFact(kpExpr);
      keypad.classList.remove('open');
      toggle.classList.remove('on');
    });

    setTimeout(() => input.focus(), 480);
  }

  /* ─────────────── REGISTER ─────────────── */
  function register() {
    if (!window.Kiwi || !window.Kiwi.handlers) { setTimeout(register, 80); return; }
    window.Kiwi.handlers['nav-assistant'] = open;
    window.Kiwi.handlers['open-assistant'] = open;
  }
  register();

  // Keep the active profile in lockstep with the venue switcher.
  (function subVenue() {
    if (window.KiwiVenue && window.KiwiVenue.subscribe) { window.KiwiVenue.subscribe(syncProfile); return; }
    setTimeout(subVenue, 120);
  })();

  // The dashboard hero's question box opens this assistant with the typed question.
  function wireHeroInput() {
    const form = document.querySelector('.hai-input');
    if (!form) { setTimeout(wireHeroInput, 120); return; }
    if (form.dataset.faWired === '1') return;
    form.dataset.faWired = '1';
    const field = form.querySelector('[data-hai-input]');
    const go = (e) => {
      if (e) e.preventDefault();
      const q = (field && field.value || '').trim();
      if (field) field.value = '';
      open(q);
    };
    form.addEventListener('submit', go);
    const sendBtn = form.querySelector('.hai-send');
    if (sendBtn) sendBtn.addEventListener('click', go, true);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireHeroInput);
  } else {
    wireHeroInput();
  }
})();
