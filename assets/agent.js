/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Assistant financier
 * A hybrid agent + calculator surface, built for the owner of Café Atlas.
 * It "knows" the café — revenue, cost of goods, fixed charges, margins,
 * cash on hand — and turns plain-French questions into real numbers:
 * hiring, price changes, investments, break-even, forecasts.
 *
 * Pure vanilla. Opens as a fullpage drawer from the sidebar or ⌘K.
 * No backend: the "intelligence" is a deterministic scenario engine that
 * computes against the business profile below.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ─────────────── BUSINESS PROFILE · Café Atlas · Maarif ───────────────
   * Monthly figures (MAD), aligned with the dashboard's 30-day revenue
   * chart total (842 300 MAD) and the KPI band (panier 142 MAD,
   * marge brute 69 %). The agent reasons entirely off this object. */
  const B = {
    name: 'Café Atlas · Maarif',
    revenue: 842300,          // CA · 30 derniers jours
    cogs: 261000,             // coût matière (≈ 31 % du CA)
    grossProfit: 581300,
    grossMargin: 69.0,        // %
    // Charges fixes mensuelles (hors coût matière)
    opex: {
      'Masse salariale': 218000,
      'Loyer': 56000,
      'Eau · électricité · gaz': 28000,
      'Marketing & divers': 19000,
      'Entretien & équipement': 14500,
      'Assurances & taxes': 15000,
      'Amortissement & prêt': 42000,
      'Abonnement Kiwi POS': 699,
    },
    totalOpex: 393199,
    netProfit: 188101,        // bénéfice net mensuel
    netMargin: 22.3,          // %
    avgBasket: 142,
    ordersPerMonth: 5931,
    ordersPerDay: 198,
    daysOpen: 30,
    cashBuffer: 465000,       // trésorerie disponible
    contribRatio: 0.69,       // marge sur coûts variables
    // Mois en cours (mai) — pour les projections
    mtdRevenue: 462000,
    mtdDays: 16,
    daysInMonth: 31,
    staffCount: 8,
  };
  B.dailyRev = B.revenue / B.daysOpen;
  B.dailyNet = B.netProfit / B.daysOpen;
  B.netPerOrder = B.netProfit / B.ordersPerMonth;
  B.breakEvenRev = B.totalOpex / B.contribRatio;
  B.breakEvenOrdersDay = B.breakEvenRev / B.avgBasket / B.daysOpen;
  B.marginOfSafety = (B.revenue - B.breakEvenRev) / B.revenue * 100;

  /* ─────────────── FORMATTING ─────────────── */
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
  const fmtMad = (n) => fmt(n) + ' MAD';
  const fmt1 = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escAttr = (s) => String(s).replace(/"/g, '&quot;');

  /* ─────────────── NUMBER PARSING ─────────────── */
  function parseAmount(q) {
    const m = q.match(/(\d[\d  .]*\d|\d)\s*(millions?|m\b|k\b|mille)?/i);
    if (!m) return null;
    let n = parseFloat(m[1].replace(/[  .]/g, '').replace(',', '.'));
    const suf = (m[2] || '').toLowerCase();
    if (suf === 'k' || suf === 'mille') n *= 1000;
    else if (suf[0] === 'm') n *= 1000000;
    return isFinite(n) ? n : null;
  }
  function parsePercent(q) {
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(?:%|pour\s?cent|pourcent)/i);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }

  /* ─────────────── CALCULATOR ENGINE ─────────────── */
  function evalMath(expr) {
    let e = String(expr).replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/\s/g, '').replace(/,/g, '.');
    e = e.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    if (!/^[-+*/().\d]+$/.test(e) || !/\d/.test(e)) return null;
    try {
      const r = Function('"use strict";return(' + e + ')')();
      return (typeof r === 'number' && isFinite(r)) ? r : null;
    } catch (_) { return null; }
  }
  function looksLikeMath(q) {
    const s = q.replace(/\s/g, '');
    return /^[-+*/().,%×÷\d]+$/.test(s) && /\d/.test(s) && /[-+*/×÷]/.test(s);
  }

  /* ═══════════════ SCENARIO ENGINE ═══════════════
   * Each returns { text, stats:[{l,v,h}], verdict:{tone,text}, note, follow:[] } */

  function sHire(q) {
    let c = parseAmount(q), assumed = false;
    if (!c || c < 1800) { c = 7200; assumed = true; }
    const ordersMo = c / (B.avgBasket * B.contribRatio);
    const newNet = B.netProfit - c;
    const tone = c < B.netProfit * 0.4 ? 'good' : c < B.netProfit * 0.8 ? 'warn' : 'bad';
    return {
      text: `Une embauche à <b>${fmtMad(c)}/mois</b> en coût chargé représente <b>${fmtMad(c * 12)}/an</b>.`,
      stats: [
        { l: 'Pour s’autofinancer', v: `${fmt1(ordersMo / 30)} cmd/jour`, h: `soit ${fmt(ordersMo)} commandes/mois` },
        { l: 'CA additionnel requis', v: fmtMad(c / B.contribRatio), h: 'au panier moyen actuel' },
        { l: 'Bénéfice net après', v: `${fmtMad(newNet)}`, h: `vs ${fmtMad(B.netProfit)} aujourd’hui` },
        { l: 'Part du bénéfice', v: `${fmt1(c / B.netProfit * 100)} %`, h: 'de votre résultat mensuel' },
      ],
      verdict: {
        tone,
        text: tone === 'good'
          ? `Favorable — il suffit de ${fmt1(ordersMo / 30)} commandes en plus par jour pour absorber ce poste. Votre marge le permet largement.`
          : tone === 'warn'
            ? `Faisable, mais ce poste pèse lourd dans le résultat. Assurez-vous que l’embauche génère bien du chiffre additionnel.`
            : `Prudence — ce coût dépasse votre marge de manœuvre actuelle. À envisager seulement avec une hausse d’activité confirmée.`,
      },
      note: assumed ? 'Hypothèse : 7 200 MAD/mois en coût chargé pour un serveur (salaire net + CNSS + primes). Indiquez un montant précis pour affiner.' : '',
      follow: ['Et si j’augmente mes prix de 5 % ?', 'Quel est mon seuil de rentabilité ?'],
    };
  }

  function sPrice(q) {
    let p = parsePercent(q), assumed = false;
    if (p == null) { p = 5; assumed = true; }
    const down = /\b(baiss|rédui|reduir|diminu)/i.test(norm(q));
    if (down) p = -Math.abs(p);
    const deltaNet = B.revenue * p / 100;
    const newNet = B.netProfit + deltaNet;
    const newRev = B.revenue * (1 + p / 100);
    const newNetMargin = newNet / newRev * 100;
    const tone = p > 0 ? (p <= 8 ? 'good' : 'warn') : 'warn';
    return {
      text: `Une ${p >= 0 ? 'hausse' : 'baisse'} de <b>${fmt1(Math.abs(p))} %</b> sur l’ensemble de la carte, à volume constant, ne touche pas le coût matière — l’écart tombe presque entièrement dans le résultat.`,
      stats: [
        { l: 'Bénéfice net /mois', v: fmtMad(newNet), h: `${deltaNet >= 0 ? '+' : ''}${fmtMad(deltaNet)}` },
        { l: 'Effet sur 12 mois', v: `${deltaNet >= 0 ? '+' : ''}${fmtMad(deltaNet * 12)}`, h: 'à activité égale' },
        { l: 'Nouvelle marge nette', v: `${fmt1(newNetMargin)} %`, h: `vs ${fmt1(B.netMargin)} % aujourd’hui` },
        { l: 'Nouveau CA /mois', v: fmtMad(newRev), h: `panier moyen ${fmtMad(B.avgBasket * (1 + p / 100))}` },
      ],
      verdict: {
        tone,
        text: p > 0
          ? `Levier puissant — ${fmt1(p)} % de prix en plus = ${fmtMad(deltaNet)} de bénéfice mensuel sans dépense supplémentaire.`
          : `Une baisse de prix ne se finance que par du volume : il faudrait +${fmt1(Math.abs(p) / B.contribRatio)} % de commandes pour préserver le résultat.`,
      },
      note: 'Calcul à volume constant. En pratique une hausse de prix réduit souvent la fréquentation de 2 à 4 % — surveillez le nombre de commandes les deux semaines suivantes.' + (assumed ? ' (Hypothèse : 5 %.)' : ''),
      follow: ['Prévision de bénéfice ce mois', 'Décompose mes charges'],
    };
  }

  function sAfford(q) {
    const A = parseAmount(q);
    if (!A || A < 100) {
      return {
        text: 'Indiquez le montant de l’investissement et je vous dis s’il est à votre portée — par exemple : <i>« puis-je investir 80 000 MAD dans une terrasse ? »</i>',
        follow: ['Puis-je investir 80 000 MAD ?', 'Puis-je investir 150 000 MAD ?'],
      };
    }
    const monthsRecoup = A / B.netProfit;
    const afterCash = B.cashBuffer - A;
    const pctCash = A / B.cashBuffer * 100;
    const tone = (A <= B.cashBuffer && monthsRecoup < 6) ? 'good'
      : (A <= B.cashBuffer ? 'warn' : 'bad');
    return {
      text: `Un investissement de <b>${fmtMad(A)}</b> se compare à votre trésorerie disponible (${fmtMad(B.cashBuffer)}) et à votre bénéfice net (${fmtMad(B.netProfit)}/mois).`,
      stats: [
        { l: 'Récupéré en', v: `${fmt1(monthsRecoup)} mois`, h: 'avec le bénéfice net actuel' },
        { l: 'Trésorerie après', v: fmtMad(Math.max(afterCash, 0)), h: afterCash >= 0 ? `${fmt1(pctCash)} % engagés` : 'financement nécessaire' },
        { l: 'Équivalent', v: `${fmt1(A / B.dailyNet)} jours`, h: 'de bénéfice d’exploitation' },
        { l: 'Poids annuel', v: `${fmt1(A / (B.netProfit * 12) * 100)} %`, h: 'du bénéfice sur 12 mois' },
      ],
      verdict: {
        tone,
        text: tone === 'good'
          ? `Abordable — payable comptant, amorti en ${fmt1(monthsRecoup)} mois, et il reste ${fmtMad(afterCash)} de trésorerie.`
          : tone === 'warn'
            ? `Payable comptant, mais l’amortissement prend ${fmt1(monthsRecoup)} mois et mobilise ${fmt1(pctCash)} % de votre trésorerie — gardez un coussin de sécurité.`
            : `Au-delà de votre trésorerie disponible (${fmtMad(B.cashBuffer)}). Un financement, ou un étalement, serait nécessaire.`,
      },
      follow: ['Quel est mon seuil de rentabilité ?', 'Prévision de bénéfice ce mois'],
    };
  }

  function sForecast() {
    const runRate = B.mtdRevenue / B.mtdDays;
    const projRev = runRate * B.daysInMonth;
    const projNet = projRev * B.netMargin / 100;
    const vsAvg = (projRev - B.revenue) / B.revenue * 100;
    const tone = vsAvg >= 0 ? 'good' : 'warn';
    return {
      text: `Sur vos <b>${B.mtdDays} premiers jours de mai</b> (${fmtMad(B.mtdRevenue)} encaissés), le rythme est de <b>${fmtMad(runRate)}/jour</b>.`,
      stats: [
        { l: 'CA projeté · mai', v: fmtMad(projRev), h: `${B.daysInMonth} jours` },
        { l: 'Bénéfice projeté · mai', v: fmtMad(projNet), h: `marge nette ${fmt1(B.netMargin)} %` },
        { l: 'CA projeté · 12 mois', v: fmtMad(projRev * 12), h: 'au rythme actuel' },
        { l: 'Bénéfice · 12 mois', v: fmtMad(projNet * 12), h: 'avant impôt sur les sociétés' },
      ],
      verdict: {
        tone,
        text: vsAvg >= 0
          ? `Tendance positive — mai dépasse votre moyenne 30 jours de ${fmt1(vsAvg)} %. Si le rythme tient, c’est votre meilleur mois.`
          : `Mai est ${fmt1(Math.abs(vsAvg))} % sous votre moyenne 30 jours — un coup d’accélérateur sur les soirs de week-end remettrait la barre.`,
      },
      note: 'Projection linéaire : un jour férié, un week-end pluvieux ou une opération spéciale peuvent faire varier le résultat réel.',
      follow: ['Décompose mes charges', 'Et si j’augmente mes prix de 5 % ?'],
    };
  }

  function sBreakEven() {
    return {
      text: `Votre point mort — le chiffre d’affaires qui couvre exactement vos charges fixes (${fmtMad(B.totalOpex)}) avec une marge sur coûts variables de ${fmt1(B.contribRatio * 100)} %.`,
      stats: [
        { l: 'Seuil · CA mensuel', v: fmtMad(B.breakEvenRev), h: `vs ${fmtMad(B.revenue)} réalisé` },
        { l: 'Seuil · commandes/jour', v: fmt(B.breakEvenOrdersDay), h: `vs ${fmt(B.ordersPerDay)} aujourd’hui` },
        { l: 'Marge de sécurité', v: `${fmt1(B.marginOfSafety)} %`, h: 'chute d’activité absorbable' },
        { l: 'Seuil · CA journalier', v: fmtMad(B.breakEvenRev / B.daysOpen), h: `vs ${fmtMad(B.dailyRev)} réalisé` },
      ],
      verdict: {
        tone: 'good',
        text: `Position solide — vous opérez ${fmt1(B.marginOfSafety)} % au-dessus du point mort. Il faudrait perdre près d’un tiers de l’activité pour être à l’équilibre.`,
      },
      follow: ['Puis-je embaucher un serveur ?', 'Prévision de bénéfice ce mois'],
    };
  }

  function sMargin() {
    return {
      text: `Vos deux marges, sur les 30 derniers jours :`,
      stats: [
        { l: 'Marge brute', v: `${fmt1(B.grossMargin)} %`, h: `${fmtMad(B.grossProfit)} après coût matière` },
        { l: 'Marge nette', v: `${fmt1(B.netMargin)} %`, h: `${fmtMad(B.netProfit)} après toutes charges` },
        { l: 'Coût matière', v: `${fmt1(100 - B.grossMargin)} %`, h: fmtMad(B.cogs) },
        { l: 'Bénéfice par commande', v: fmtMad(B.netPerOrder), h: `panier moyen ${fmtMad(B.avgBasket)}` },
      ],
      verdict: {
        tone: 'good',
        text: `Marge nette de ${fmt1(B.netMargin)} % — nettement au-dessus de la moyenne du secteur café-restauration (8 à 12 %). Votre coût matière est bien tenu.`,
      },
      note: 'La marge brute mesure la rentabilité de la carte ; la marge nette, celle de toute l’exploitation.',
      follow: ['Décompose mes charges', 'Et si j’augmente mes prix de 5 % ?'],
    };
  }

  function sCharges() {
    const items = Object.entries(B.opex).sort((a, b) => b[1] - a[1]);
    const biggest = items[0];
    return {
      text: `Vos charges fixes mensuelles totalisent <b>${fmtMad(B.totalOpex)}</b>, auxquelles s’ajoute le coût matière (${fmtMad(B.cogs)}).`,
      stats: items.map(([k, v]) => ({ l: k, v: fmtMad(v), h: `${fmt1(v / B.totalOpex * 100)} % des charges` })),
      verdict: {
        tone: 'warn',
        text: `« ${biggest[0]} » est votre premier poste (${fmt1(biggest[1] / B.totalOpex * 100)} % des charges) — c’est là que se trouve votre principal levier d’optimisation.`,
      },
      follow: ['Puis-je embaucher un serveur ?', 'Quel est mon seuil de rentabilité ?'],
    };
  }

  function sRevenue() {
    return {
      text: `Votre activité sur les 30 derniers jours :`,
      stats: [
        { l: 'Chiffre d’affaires', v: fmtMad(B.revenue), h: '30 derniers jours' },
        { l: 'CA moyen /jour', v: fmtMad(B.dailyRev), h: `${fmt(B.ordersPerDay)} commandes` },
        { l: 'Commandes /mois', v: fmt(B.ordersPerMonth), h: `panier moyen ${fmtMad(B.avgBasket)}` },
        { l: 'Bénéfice net /mois', v: fmtMad(B.netProfit), h: `marge nette ${fmt1(B.netMargin)} %` },
      ],
      follow: ['Prévision de bénéfice ce mois', 'Décompose mes charges'],
    };
  }

  function sProfit() {
    return {
      text: `Votre résultat, une fois toutes les charges payées :`,
      stats: [
        { l: 'Bénéfice net /mois', v: fmtMad(B.netProfit), h: `marge nette ${fmt1(B.netMargin)} %` },
        { l: 'Bénéfice net /jour', v: fmtMad(B.dailyNet), h: `${B.daysOpen} jours d’ouverture` },
        { l: 'Bénéfice par commande', v: fmtMad(B.netPerOrder), h: `sur ${fmtMad(B.avgBasket)} de panier` },
        { l: 'Bénéfice projeté /an', v: fmtMad(B.netProfit * 12), h: 'au rythme actuel' },
      ],
      verdict: {
        tone: 'good',
        text: `Café rentable et sain : vous dégagez ${fmtMad(B.dailyNet)} de bénéfice net par jour d’ouverture.`,
      },
      follow: ['Puis-je investir 80 000 MAD ?', 'Quel est mon seuil de rentabilité ?'],
    };
  }

  function sHelp() {
    return {
      text: `Bonjour Rachid. Je suis votre assistant financier — je connais Café Atlas : chiffre d’affaires, coût matière, charges, marges et trésorerie. Posez-moi une question chiffrée et je calcule l’impact réel sur votre résultat ; pour une question ouverte sur la gestion de votre café, je peux activer un assistant IA dans votre navigateur. Par exemple :`,
      follow: [
        'Puis-je embaucher un serveur ?',
        'Et si j’augmente mes prix de 5 % ?',
        'Quel est mon seuil de rentabilité ?',
        'Prévision de bénéfice ce mois',
        'Puis-je investir 80 000 MAD ?',
      ],
    };
  }

  function sCalc(expr, result) {
    return {
      text: `Calcul`,
      stats: [{ l: expr.trim(), v: fmt1(Math.round(result * 100) / 100).replace(/,0$/, ''), h: Math.abs(result) > 999 ? 'résultat' : '' }],
    };
  }

  /* ─────────────── INTENT ROUTER ─────────────── */
  function respond(raw) {
    const q = norm(raw);
    if (looksLikeMath(raw)) {
      const r = evalMath(raw);
      if (r != null) return sCalc(raw, r);
    }
    if (/(bonjour|salut|hello|coucou|aide|que (peux|sais)|qui es|comment ca|^aide)/.test(q)) return sHelp();
    if (/(embauch|recrut|engag|serveur|cuisinier|barista|salarie|nouvel employe|main d.?oeuvre|une personne en plus)/.test(q)) return sHire(raw);
    if (/(puis.?je|peux.?je|ai.?je les moyens|me permettre|abordable|financ|investir|acheter|depenser|coute)/.test(q)
        && !/(embauch|recrut|serveur)/.test(q)) return sAfford(raw);
    if (/prix|tarif/.test(q) || (parsePercent(raw) != null && /(augment|hauss|baiss|monter)/.test(q))) return sPrice(raw);
    if (/(prevision|projection|prevoir|previs|fin du mois|fin d.?annee|run.?rate|tendance|combien.*(vais|gagner|ferai))/.test(q)) return sForecast();
    if (/(seuil|rentab|equilibre|break.?even|point mort)/.test(q)) return sBreakEven();
    if (/marge/.test(q)) return sMargin();
    if (/(charge|depense|cout|frais|opex)/.test(q)) return sCharges();
    if (/(chiffre|revenu|\bca\b|encaiss|vente|recette)/.test(q)) return sRevenue();
    if (/(benefice|profit|gagne|resultat|rentre|combien je gagne)/.test(q)) return sProfit();
    const r = evalMath(raw);
    if (r != null) return sCalc(raw, r);
    return null;   // unmatched → routed to the in-browser LLM
  }

  /* ═══════════════ IN-BROWSER LLM · WebLLM ═══════════════
   * Anything the deterministic scenario engine doesn't recognise is
   * answered by an open-source model running fully in the browser via
   * WebGPU — no backend, no API key, no data leaves the device.
   * The model is downloaded once (cached by the browser) and only after
   * the owner explicitly opts in. */
  const LLM = {
    model: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',  // open-source · ~2 Go · swap freely
    sizeLabel: '≈ 2 Go',
    cdn: 'https://esm.run/@mlc-ai/web-llm',
    status: 'idle',   // idle · loading · ready · error
    engine: null,
    progress: 0,
  };
  const llmHistory = [];   // {role,content} — conversation memory for follow-ups

  function buildSystemPrompt() {
    const o = B.opex;
    return [
      'Tu es l\'assistant financier de "Café Atlas · Maarif", un café-restaurant à Casablanca, au Maroc.',
      'Tu conseilles son propriétaire, Rachid. Voici ses chiffres réels sur les 30 derniers jours (en dirhams marocains, MAD) :',
      `- Chiffre d'affaires : ${fmt(B.revenue)} MAD`,
      `- Coût matière : ${fmt(B.cogs)} MAD (${fmt1(100 - B.grossMargin)} % du CA)`,
      `- Marge brute : ${fmt(B.grossProfit)} MAD (${fmt1(B.grossMargin)} %)`,
      `- Charges fixes : ${fmt(B.totalOpex)} MAD — dont masse salariale ${fmt(o['Masse salariale'])}, loyer ${fmt(o['Loyer'])}, énergie ${fmt(o['Eau · électricité · gaz'])}.`,
      `- Bénéfice net : ${fmt(B.netProfit)} MAD (marge nette ${fmt1(B.netMargin)} %)`,
      `- Trésorerie disponible : ${fmt(B.cashBuffer)} MAD`,
      `- Panier moyen : ${fmt(B.avgBasket)} MAD · ${fmt(B.ordersPerMonth)} ventes/mois · ${B.staffCount} employés.`,
      '',
      'Règles :',
      '- Réponds toujours en français, de façon concise, concrète et chiffrée quand c\'est utile.',
      '- Tu peux discuter de tout ce qui touche la gestion du café : finances, RH, marketing, opérations, fournisseurs, stratégie, motivation.',
      '- Tu NE réponds PAS aux questions sans lien avec l\'activité (sport, célébrités, actualité générale, culture générale). Dans ce cas, décline poliment en une phrase et propose de revenir au café.',
      '- Tu n\'as pas accès à Internet ni à des données en temps réel : dis-le clairement si on te demande un fait récent (score, météo, cours).',
      '- Ne donne jamais de conseil d\'investissement boursier.',
      '- N\'invente pas de chiffres : appuie-toi sur les données ci-dessus.',
    ].join('\n');
  }

  /* ═══════════════ UI ═══════════════ */

  const ICON = {
    avatar: 'K',
    keypad: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h4"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  };

  const CHIPS = [
    'Puis-je embaucher un serveur ?',
    'Et si j’augmente mes prix de 5 % ?',
    'Quel est mon seuil de rentabilité ?',
    'Prévision de bénéfice ce mois',
    'Décompose mes charges',
    'Puis-je investir 80 000 MAD ?',
  ];

  /* one-time CSS */
  function injectCss() {
    if (document.getElementById('fa-css')) return;
    const s = document.createElement('style');
    s.id = 'fa-css';
    s.textContent = `
    .fa-drawer .kiwi-drawer { display:flex; flex-direction:column; }
    .fa-drawer .kiwi-drawer-body { flex:1; min-height:0; padding:0 !important; display:flex; }
    .fa { display:flex; width:100%; height:100%; }
    .fa-main { flex:1; display:flex; flex-direction:column; min-width:0; }
    .fa-thread { flex:1; overflow-y:auto; padding:26px clamp(20px,7%,90px); display:flex; flex-direction:column; gap:18px; }
    .fa-msg { display:flex; gap:11px; max-width:100%; }
    .fa-msg.user { justify-content:flex-end; }
    .fa-avatar { width:31px; height:31px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg,var(--atlas),var(--riad)); color:#fff; font-weight:700; font-size:13px; }
    .fa-bubble { max-width:600px; padding:13px 16px; border-radius:15px; font-size:13.5px; line-height:1.55; }
    .fa-msg.agent .fa-bubble { background:#fff; border:1px solid var(--n-200); border-bottom-left-radius:5px; }
    .fa-msg.user .fa-bubble { background:var(--atlas); color:#fff; border-bottom-right-radius:5px; }
    .fa-bubble b { font-weight:600; }
    .fa-stats { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
    .fa-stat { background:var(--paper-soft); border-radius:10px; padding:9px 11px; }
    .fa-stat .l { font-size:9.5px; letter-spacing:.07em; text-transform:uppercase; color:var(--n-500); }
    .fa-stat .v { font-size:16px; font-weight:600; margin-top:3px; color:var(--ink); font-variant-numeric:tabular-nums; }
    .fa-stat .h { font-size:10.5px; color:var(--n-500); margin-top:2px; }
    .fa-verdict { margin-top:11px; padding:9px 12px; border-radius:10px; font-size:12.5px; font-weight:500; line-height:1.45; }
    .fa-verdict.good { background:rgba(11,110,79,.10); color:var(--atlas); }
    .fa-verdict.warn { background:rgba(176,124,0,.13); color:#8a6200; }
    .fa-verdict.bad  { background:rgba(193,58,48,.11); color:#b3392f; }
    .fa-note { margin-top:9px; font-size:11.5px; color:var(--n-500); font-style:italic; line-height:1.45; }
    .fa-follow { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }
    .fa-follow button { font-size:11.5px; padding:6px 11px; border-radius:999px; border:1px solid var(--n-200);
      background:var(--paper-soft); color:var(--ink); cursor:pointer; transition:background 120ms; }
    .fa-follow button:hover { background:var(--n-100); }
    .fa-typing { display:flex; gap:4px; padding:3px 2px; }
    .fa-typing i { width:6px; height:6px; border-radius:50%; background:var(--n-400); animation:fa-bounce 1.1s infinite; }
    .fa-typing i:nth-child(2){ animation-delay:.15s; } .fa-typing i:nth-child(3){ animation-delay:.3s; }
    @keyframes fa-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-5px); opacity:1; } }
    .fa-dock { border-top:1px solid var(--n-200); background:#fff; padding:11px clamp(20px,7%,90px) 15px; }
    .fa-chips { display:flex; gap:8px; overflow-x:auto; padding-bottom:11px; scrollbar-width:thin; }
    .fa-chip { white-space:nowrap; font-size:12px; padding:7px 13px; border-radius:999px; border:1px solid var(--n-200);
      background:var(--paper-soft); color:var(--ink); cursor:pointer; flex-shrink:0; transition:background 120ms; }
    .fa-chip:hover { background:var(--n-100); }
    .fa-keypad { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:12px; }
    .fa-kpdisplay { grid-column:span 4; text-align:right; padding:12px 14px; background:var(--ink); color:#fff;
      border-radius:11px; font-family:var(--mono); font-size:21px; letter-spacing:.02em; overflow:hidden; }
    .fa-keypad button { padding:14px 0; border-radius:10px; border:1px solid var(--n-200); background:var(--paper-soft);
      font-size:15px; font-family:var(--mono); cursor:pointer; transition:background 110ms; }
    .fa-keypad button:hover { background:var(--n-100); }
    .fa-keypad button.op { color:var(--atlas); font-weight:600; }
    .fa-keypad button.eq { background:var(--atlas); color:#fff; border-color:var(--atlas); grid-column:span 2; font-weight:600; }
    .fa-inputrow { display:flex; gap:9px; align-items:flex-end; }
    .fa-input { flex:1; resize:none; border:1px solid var(--n-300); border-radius:13px; padding:12px 14px;
      font:inherit; font-size:13.5px; line-height:1.4; max-height:130px; background:#fff; }
    .fa-input:focus { outline:none; border-color:var(--atlas); }
    .fa-iconbtn { width:44px; height:44px; border-radius:13px; border:1px solid var(--n-300); background:#fff;
      color:var(--n-600); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 120ms; }
    .fa-iconbtn:hover { color:var(--ink); border-color:var(--n-400); }
    .fa-iconbtn.on { background:var(--atlas); border-color:var(--atlas); color:#fff; }
    .fa-iconbtn.fa-send { background:var(--atlas); border-color:var(--atlas); color:#fff; }
    .fa-iconbtn.fa-send:hover { background:var(--riad); }
    .fa-context { width:312px; flex-shrink:0; border-inline-start:1px solid var(--n-200);
      background:var(--paper-soft); padding:24px 22px; overflow-y:auto; }
    .fa-ctx-biz { font-size:14.5px; font-weight:600; color:var(--ink); }
    .fa-ctx-sub { font-size:11px; color:var(--n-500); margin-top:2px; text-transform:uppercase; letter-spacing:.06em; }
    .fa-ctx-list { margin-top:18px; display:flex; flex-direction:column; }
    .fa-ctx-row { display:flex; justify-content:space-between; align-items:baseline; gap:10px;
      padding:11px 0; border-bottom:1px solid var(--n-200); }
    .fa-ctx-row:last-child { border-bottom:none; }
    .fa-ctx-row .k { font-size:12px; color:var(--n-600); }
    .fa-ctx-row .v { font-size:13px; font-weight:600; color:var(--ink); font-variant-numeric:tabular-nums; text-align:end; }
    .fa-ctx-row.hl { background:rgba(11,110,79,.06); margin:6px -12px 0; padding:11px 12px; border-radius:10px; border-bottom:none; }
    .fa-ctx-row.hl .v { color:var(--atlas); font-size:15px; }
    .fa-ctx-note { margin-top:18px; font-size:11.5px; color:var(--n-500); line-height:1.5; }
    @media (max-width:920px) { .fa-context { display:none; } }
    .fa-llm-btn { font-size:12.5px; font-weight:600; padding:9px 16px; border-radius:999px;
      border:1px solid var(--atlas); background:var(--atlas); color:#fff; cursor:pointer; transition:background 130ms; }
    .fa-llm-btn:hover { background:var(--riad); }
    .fa-llm-prog { height:7px; border-radius:999px; background:var(--n-200); overflow:hidden; margin:11px 0 7px; }
    .fa-llm-bar { height:100%; width:0%; border-radius:999px; background:var(--atlas); transition:width 220ms var(--ease-out,ease); }
    .fa-llm-ptxt { font-size:11.5px; color:var(--n-500); }
    [data-fa-stream] { white-space:pre-wrap; }
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
    return h;
  }

  function open() {
    if (!window.Kiwi || !window.Kiwi.drawer) return;
    injectCss();

    const ctxRows = [
      ['Chiffre d’affaires', fmtMad(B.revenue)],
      ['Coût matière', `${fmtMad(B.cogs)} · ${fmt1(100 - B.grossMargin)} %`],
      ['Marge brute', `${fmtMad(B.grossProfit)} · ${fmt1(B.grossMargin)} %`],
      ['Charges fixes', fmtMad(B.totalOpex)],
      ['Trésorerie dispo.', fmtMad(B.cashBuffer)],
    ];

    const body = `
      <div class="fa">
        <div class="fa-main">
          <div class="fa-thread" data-fa-thread></div>
          <div class="fa-dock">
            <div class="fa-chips" data-fa-chips>
              ${CHIPS.map((c) => `<button class="fa-chip" data-fa-chip="${escAttr(c)}">${c}</button>`).join('')}
            </div>
            <div class="fa-keypad" data-fa-keypad hidden>
              <div class="fa-kpdisplay" data-fa-kpd>0</div>
              ${['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.']
                .map((k) => `<button class="${/[÷×−+%]/.test(k) ? 'op' : ''}" data-fa-key="${k}">${k}</button>`).join('')}
              <button class="eq" data-fa-key="=">=</button>
            </div>
            <div class="fa-inputrow">
              <button class="fa-iconbtn" data-fa-keypad-toggle title="Calculatrice">${ICON.keypad}</button>
              <textarea class="fa-input" data-fa-input rows="1"
                placeholder="Posez une question — embauche, prix, investissement, prévision…"></textarea>
              <button class="fa-iconbtn fa-send" data-fa-send title="Envoyer">${ICON.send}</button>
            </div>
          </div>
        </div>
        <aside class="fa-context">
          <div class="fa-ctx-biz">${B.name}</div>
          <div class="fa-ctx-sub">Ce que je sais · 30 jours</div>
          <div class="fa-ctx-list">
            ${ctxRows.map(([k, v]) => `<div class="fa-ctx-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
            <div class="fa-ctx-row hl"><span class="k">Bénéfice net</span><span class="v">${fmtMad(B.netProfit)} · ${fmt1(B.netMargin)} %</span></div>
          </div>
          <div class="fa-ctx-note">Chaque réponse est calculée sur ces données. Posez une question chiffrée ou utilisez la calculatrice.</div>
        </aside>
      </div>`;

    const res = window.Kiwi.drawer({
      title: 'Assistant financier',
      subtitle: 'Il connaît votre café — revenus, charges, marges, trésorerie',
      body,
      fullpage: true,
    });
    res.el.classList.add('fa-drawer');

    const root = res.el;
    const thread = root.querySelector('[data-fa-thread]');
    const input = root.querySelector('[data-fa-input]');
    const keypad = root.querySelector('[data-fa-keypad]');
    const kpd = root.querySelector('[data-fa-kpd]');

    const scrollDown = () => { thread.scrollTop = thread.scrollHeight; };

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
      if (!('gpu' in navigator)) {
        pushAgent(replyHtml({
          text: 'Cette question sort de mes calculs prédéfinis. Pour y répondre librement j’utilise un assistant IA dans le navigateur, mais le vôtre ne prend pas en charge WebGPU — essayez Chrome ou Edge à jour sur ordinateur. Je reste disponible pour tout calcul : embauche, prix, investissement, seuil, prévisions.',
          follow: ['Décompose mes charges', 'Quel est mon seuil de rentabilité ?'],
        }));
        return;
      }
      if (LLM.status === 'ready') { runLlm(question); return; }
      if (LLM.status === 'loading') {
        LLM.pending = question;
        pushAgent(replyHtml({ text: `Mon assistant IA finit de se charger (${Math.round(LLM.progress * 100)} %). Je réponds dès qu’il est prêt.` }));
        return;
      }
      // idle or error → opt-in activation card
      LLM.pending = question;
      pushAgent(
        `<div>Cette question sort de mes calculs prédéfinis — mais je peux y répondre librement avec un <b>assistant IA open-source</b> qui s’exécute <b>entièrement dans votre navigateur</b> : aucune donnée ne part ailleurs.</div>
         <div class="fa-note" style="font-style:normal;">Premier lancement : un téléchargement unique de ${LLM.sizeLabel}, ensuite instantané.</div>
         <div class="fa-follow"><button type="button" class="fa-llm-btn" data-fa-activate>Activer l’assistant IA</button></div>`);
    }

    async function activateLlm() {
      if (LLM.status === 'loading' || LLM.status === 'ready') return;
      LLM.status = 'loading';
      const card = pushAgent(
        `<div>Installation de l’assistant IA — modèle open-source exécuté dans votre navigateur.</div>
         <div class="fa-llm-prog"><div class="fa-llm-bar" data-fa-bar></div></div>
         <div class="fa-llm-ptxt" data-fa-ptxt>Initialisation…</div>`);
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
        if (ptxt) ptxt.textContent = 'Assistant IA prêt.';
        pushAgent(replyHtml({ text: 'Mon assistant IA est prêt. Posez-moi vos questions sur la gestion, les finances, l’équipe ou le marketing de votre café — je reste concentré sur votre activité.' }));
        if (LLM.pending) { const q = LLM.pending; LLM.pending = null; runLlm(q); }
      } catch (e) {
        LLM.status = 'error';
        if (ptxt) ptxt.textContent = 'Échec du chargement.';
        pushAgent(replyHtml({ text: 'Je n’ai pas pu charger l’assistant IA (connexion, mémoire ou navigateur incompatible). Mes calculs financiers restent pleinement disponibles.' }));
      }
    }

    async function runLlm(question) {
      const typing = pushTyping();
      llmHistory.push({ role: 'user', content: question });
      const messages = [{ role: 'system', content: buildSystemPrompt() }, ...llmHistory.slice(-8)];
      try {
        const stream = await LLM.engine.chat.completions.create({ messages, temperature: 0.5, stream: true });
        typing.remove();
        const bubble = pushAgent('<span data-fa-stream></span>');
        const target = bubble.querySelector('[data-fa-stream]');
        let acc = '';
        for await (const chunk of stream) {
          acc += chunk.choices?.[0]?.delta?.content || '';
          if (target) target.textContent = acc;
          scrollDown();
        }
        llmHistory.push({ role: 'assistant', content: acc });
      } catch (e) {
        typing.remove();
        pushAgent(replyHtml({ text: 'Une erreur est survenue côté assistant IA. Réessayez, ou demandez-moi un calcul précis.' }));
      }
    }

    // greeting
    pushAgent(replyHtml(sHelp()));

    // ─── input wiring ───
    function send() {
      const v = input.value;
      input.value = '';
      input.style.height = 'auto';
      ask(v);
    }
    root.querySelector('[data-fa-send]').addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    });

    // ─── chips + follow-ups (delegated) ───
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-fa-chip]');
      if (chip) { ask(chip.getAttribute('data-fa-chip')); return; }
      const follow = e.target.closest('[data-fa-follow]');
      if (follow) { ask(follow.getAttribute('data-fa-follow')); return; }
      if (e.target.closest('[data-fa-activate]')) { activateLlm(); return; }
    });

    // ─── keypad ───
    const toggle = root.querySelector('[data-fa-keypad-toggle]');
    toggle.addEventListener('click', () => {
      const hidden = keypad.hasAttribute('hidden');
      if (hidden) { keypad.removeAttribute('hidden'); toggle.classList.add('on'); }
      else { keypad.setAttribute('hidden', ''); toggle.classList.remove('on'); }
    });

    let kpExpr = '', kpDone = false;
    const kpShow = () => { kpd.textContent = kpExpr || '0'; };
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
        } else { kpd.textContent = 'Erreur'; return; }
      } else {
        const isOp = /[÷×−+%]/.test(k);
        if (kpDone && !isOp) { kpExpr = ''; kpDone = false; }
        else if (kpDone && isOp) { kpDone = false; }
        kpExpr += k;
      }
      kpShow();
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
})();
