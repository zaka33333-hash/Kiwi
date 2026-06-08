/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Commande en ligne (Online Ordering)
 *
 * Kiwi's answer to Toast Online Ordering and the anti-Glovo / anti-Jumia wedge:
 * a merchant-branded ordering storefront (kiwi.shop/cafe-atlas) with 0 %
 * commission, channel connectors, and a live online-order inbox.
 *
 * Single fullpage drawer, handler key 'growth-ordering'.
 * Requires interactive.js (Kiwi.toast / drawer / handlers / confetti) and,
 * optionally, KiwiVenue.getMenuItems() for real menu names in the inbox.
 * Mirrors the architecture of assets/features.js. Every class is "ord-" scoped.
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (!window.Kiwi) { console.warn('growth-ordering.js loaded before interactive.js'); return; }
  const { toast, modal, drawer, handlers, confetti } = window.Kiwi;
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* ─── Injected styles — every selector prefixed "ord-" ─── */
  const CSS = `
  .ord-grid { display: grid; gap: 16px; }
  @media (min-width: 880px) { .ord-grid.ord-2 { grid-template-columns: 1.1fr 0.9fr; align-items: start; } }
  .ord-card { background: #fff; border: 1px solid var(--n-200); border-radius: 14px; padding: 18px; }
  .ord-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--n-500); }
  .ord-sectionhead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 26px 2px 12px; }
  .ord-sectionhead .ord-h { font-size: 16px; font-weight: 600; letter-spacing: -0.015em; }
  .ord-sectionhead .ord-meta { font-size: 12px; color: var(--n-500); }

  /* 1 · Storefront hero */
  .ord-hero { background: linear-gradient(135deg, var(--atlas), var(--riad-deep)); color: var(--paper); border-radius: 16px; padding: 22px; position: relative; overflow: hidden; }
  .ord-hero::before { content: ""; position: absolute; top: -90px; inset-inline-end: -70px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(125,242,176,0.34), transparent 62%); pointer-events: none; }
  .ord-hero .ord-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; color: #c6ead4; }
  .ord-hero .ord-storename { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-top: 8px; }
  .ord-hero .ord-storesub { font-size: 13px; color: #c6ead4; margin-top: 4px; line-height: 1.45; }
  .ord-hero-body { position: relative; display: flex; gap: 18px; align-items: center; margin-top: 18px; flex-wrap: wrap; }
  .ord-hero-left { flex: 1; min-width: 220px; }
  .ord-urlbar { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; padding: 10px 12px; font-family: var(--mono); font-size: 13px; }
  .ord-urlbar .ord-url { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ord-urlbar .ord-copy { margin-inline-start: auto; color: var(--mint); font-weight: 500; cursor: pointer; font-family: var(--sans); font-size: 12.5px; white-space: nowrap; }
  .ord-hero-actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .ord-qr { width: 108px; height: 108px; flex-shrink: 0; background: #fff; padding: 9px; border-radius: 12px; background-image: repeating-linear-gradient(0deg, var(--ink) 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, var(--ink) 0 6px, transparent 6px 12px); background-clip: content-box; }
  .ord-toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 13px; }
  .ord-switch { position: relative; width: 46px; height: 27px; flex-shrink: 0; border-radius: 14px; background: var(--n-300); transition: background 200ms; }
  .ord-switch::after { content: ""; position: absolute; top: 3px; inset-inline-start: 3px; width: 21px; height: 21px; border-radius: 50%; background: #fff; transition: inset-inline-start 200ms; box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
  .ord-toggle.on .ord-switch { background: var(--mint); }
  .ord-toggle.on .ord-switch::after { inset-inline-start: 22px; }
  .ord-hero .ord-toggle.on .ord-switch { background: var(--mint); }
  .ord-statusline { display: flex; align-items: center; gap: 7px; margin-top: 14px; font-size: 12.5px; color: #c6ead4; }
  .ord-statusdot { width: 8px; height: 8px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 0 4px rgba(125,242,176,0.22); }
  .ord-statusline.ord-off .ord-statusdot { background: var(--n-400); box-shadow: none; }

  /* 2 · Commission savings */
  .ord-save { background: var(--mint-soft); border: 1px solid transparent; border-radius: 16px; padding: 22px; }
  .ord-save .ord-savetop { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .ord-save .ord-savevol { font-family: var(--mono); font-size: 12px; color: var(--riad); }
  .ord-save .ord-savehead { font-size: 15px; font-weight: 600; color: var(--riad); letter-spacing: -0.01em; }
  .ord-save .ord-savebig { font-size: 38px; font-weight: 600; letter-spacing: -0.03em; color: var(--atlas); margin-top: 6px; font-feature-settings: "tnum" 1; }
  .ord-save .ord-savebig .ord-u { font-size: 16px; color: var(--riad); margin-inline-start: 4px; }
  .ord-save .ord-savesub { font-size: 13px; color: var(--riad); margin-top: 4px; line-height: 1.45; }
  .ord-bars { display: grid; gap: 10px; margin-top: 18px; }
  .ord-bar { display: grid; grid-template-columns: 116px 1fr auto; align-items: center; gap: 12px; }
  .ord-bar .ord-barname { font-size: 13px; font-weight: 500; color: var(--riad); }
  .ord-bar .ord-bartrack { height: 26px; border-radius: 7px; background: rgba(5,59,44,0.1); overflow: hidden; }
  .ord-bar .ord-barfill { height: 100%; width: 0; border-radius: 7px; transition: width 800ms cubic-bezier(0.32,0.72,0,1); }
  .ord-bar .ord-barfill.ord-kiwi { background: var(--atlas); }
  .ord-bar .ord-barfill.ord-rival { background: var(--n-400); }
  .ord-bar .ord-barval { font-family: var(--mono); font-size: 12.5px; font-weight: 500; color: var(--riad); white-space: nowrap; text-align: end; min-width: 92px; }
  .ord-bar .ord-barval .ord-net { color: var(--atlas); }
  .ord-bar .ord-barval .ord-fee { color: var(--danger); }

  /* 3 · Channels */
  .ord-channels { display: grid; gap: 10px; }
  @media (min-width: 620px) { .ord-channels { grid-template-columns: 1fr 1fr; } }
  .ord-channel { display: flex; align-items: center; gap: 13px; padding: 14px; border: 1px solid var(--n-200); border-radius: 12px; background: #fff; }
  .ord-channel .ord-chico { width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 600; font-size: 14px; background: var(--paper-soft); color: var(--n-600); }
  .ord-channel .ord-chico.ord-kiwi { background: var(--atlas); color: var(--paper); }
  .ord-channel .ord-chbody { flex: 1; min-width: 0; }
  .ord-channel .ord-chname { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
  .ord-channel .ord-chmeta { font-size: 12px; color: var(--n-500); margin-top: 2px; }

  /* 4 · Order inbox */
  .ord-inbox { border: 1px solid var(--n-200); border-radius: 14px; overflow: hidden; background: #fff; }
  .ord-order { display: grid; grid-template-columns: 58px 1fr auto; gap: 14px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--n-200); cursor: pointer; transition: background 150ms; }
  .ord-order:last-child { border-bottom: 0; }
  .ord-order:hover { background: var(--paper-soft); }
  .ord-order .ord-time { font-family: var(--mono); font-size: 12px; color: var(--n-500); }
  .ord-order .ord-cust { font-size: 14px; font-weight: 500; letter-spacing: -0.01em; }
  .ord-order .ord-items { font-size: 12.5px; color: var(--n-500); margin-top: 2px; line-height: 1.4; }
  .ord-order .ord-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .ord-order .ord-amt { font-family: var(--mono); font-size: 14px; font-weight: 500; white-space: nowrap; }
  .ord-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .ord-chip.ord-kiwi { background: var(--mint-soft); color: var(--riad); }
  .ord-chip.ord-glovo { background: #FFE9C7; color: #8A5A00; }
  .ord-chip.ord-jumia { background: #FBD9D2; color: #9A2C1A; }
  .ord-chip.ord-new { background: var(--atlas); color: var(--paper); }
  .ord-chip.ord-prep { background: #FFF0D0; color: #8A5A00; }
  .ord-chip.ord-ready { background: var(--mint-soft); color: var(--riad); }
  .ord-foot-note { font-size: 12px; color: var(--n-500); text-align: center; margin-top: 14px; }

  /* Dark-mode overrides for the custom-background surfaces */
  html[data-theme="dark"] .ord-card,
  html[data-theme="dark"] .ord-channel,
  html[data-theme="dark"] .ord-inbox { background: var(--paper-soft); border-color: var(--n-200); }
  html[data-theme="dark"] .ord-order:hover { background: var(--paper-muted); }
  html[data-theme="dark"] .ord-channel .ord-chico { background: var(--paper-muted); }
  html[data-theme="dark"] .ord-save { background: rgba(125,242,176,0.1); }
  html[data-theme="dark"] .ord-save .ord-savehead,
  html[data-theme="dark"] .ord-save .ord-savesub,
  html[data-theme="dark"] .ord-save .ord-savevol,
  html[data-theme="dark"] .ord-save .ord-savebig .ord-u,
  html[data-theme="dark"] .ord-bar .ord-barname,
  html[data-theme="dark"] .ord-bar .ord-barval { color: var(--mint); }
  html[data-theme="dark"] .ord-save .ord-savebig { color: var(--mint); }
  html[data-theme="dark"] .ord-bar .ord-bartrack { background: rgba(125,242,176,0.14); }
  html[data-theme="dark"] .ord-chip.ord-glovo { background: rgba(217,154,43,0.18); color: #E7B860; }
  html[data-theme="dark"] .ord-chip.ord-jumia { background: rgba(201,74,58,0.2); color: #E89384; }
  html[data-theme="dark"] .ord-chip.ord-prep { background: rgba(217,154,43,0.18); color: #E7B860; }
  `;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ─── Economics (mocked monthly online volume) ─── */
  const MONTHLY = 48200;            // MAD/month of online orders
  const GLOVO_RATE = 0.30;          // ~30 %
  const JUMIA_RATE = 0.28;          // ~28 %
  const glovoFee = MONTHLY * GLOVO_RATE;   // 14 460
  const jumiaFee = MONTHLY * JUMIA_RATE;   // 13 496
  const URL = 'kiwi.shop/cafe-atlas';

  /* ─── Trilingual strings ─── */
  const STR = {
    fr: {
      title: 'Commande en ligne',
      subtitle: 'Votre boutique de commande à 0 % de commission · le wedge anti-Glovo',
      // hero
      heroEyebrow: 'VOTRE BOUTIQUE KIWI',
      storeName: 'Café Atlas · Maarif',
      storeSub: 'Commande et paiement en ligne, livraison ou retrait — sans intermédiaire.',
      copy: 'Copier',
      copied: 'Lien de la boutique copié',
      preview: 'Aperçu de la boutique',
      previewToast: 'Aperçu de la boutique ouvert',
      previewDesc: `${URL} · vue client`,
      storefrontOn: 'Boutique en ligne',
      live: 'En ligne · accessible aux clients',
      paused: 'En pause · masquée aux clients',
      toggledOn: 'Boutique en ligne activée',
      toggledOnDesc: 'Vos clients peuvent commander dès maintenant.',
      toggledOff: 'Boutique mise en pause',
      toggledOffDesc: 'La page ne prend plus de commandes.',
      // savings
      saveLabel: 'CE QUE VOUS GARDEZ',
      saveVol: (v) => `Sur ${v} MAD/mois de commandes en ligne`,
      saveHead: 'Commission par canal',
      saveBig: (v) => `Vous gardez ${v} MAD/mois de plus qu'avec Glovo.`,
      saveSub: 'Kiwi Direct ne prélève aucune commission. Les agrégateurs en gardent près du tiers.',
      kiwiDirect: 'Kiwi Direct',
      glovo: 'Glovo',
      jumia: 'Jumia Food',
      netKept: (v) => `${v} net`,
      feeLost: (v) => `−${v}`,
      pct0: '0 %',
      pctGlovo: '~30 %',
      pctJumia: '~28 %',
      // channels
      channelsLabel: 'Canaux de vente',
      channelsMeta: 'Connectez vos points de vente en ligne',
      chKiwiName: 'Kiwi Direct',
      chKiwiMeta: '0 % commission · paiement Kiwi',
      chGlovoMeta: 'Agrégateur · ~30 %',
      chJumiaMeta: 'Agrégateur · ~28 %',
      chCollectName: 'Click & Collect',
      chCollectMeta: 'Retrait en boutique',
      chDeliveryName: 'Livraison Kiwi',
      chDeliveryMeta: 'Flotte Kiwi · tarif fixe',
      stActivated: 'Activé',
      stConnected: 'Connecté',
      stConnect: 'Connecter',
      chToastOn: (n) => `${n} activé`,
      chToastOff: (n) => `${n} désactivé`,
      chToastConn: (n) => `${n} connecté`,
      chToastConnDesc: 'Les commandes arriveront dans votre boîte de réception.',
      // inbox
      inboxLabel: 'Commandes en ligne',
      inboxMeta: (n) => `${n} commandes aujourd'hui`,
      stNew: 'Nouveau',
      stPrep: 'En préparation',
      stReady: 'Prêt',
      sentToKitchen: 'Commande envoyée en cuisine',
      sentDesc: (c) => `${c} · ticket imprimé au passe`,
      footNote: 'Mis à jour en temps réel · règlement T+1 sur votre Kiwi Compte.',
      // footer
      activate: 'Activer la boutique en ligne',
      close: 'Fermer',
      activatedTitle: 'Boutique en ligne activée',
      activatedDesc: `${URL} est en ligne · partagez le lien à vos clients.`,
    },
    en: {
      title: 'Online ordering',
      subtitle: 'Your 0%-commission ordering storefront · the anti-Glovo wedge',
      heroEyebrow: 'YOUR KIWI STOREFRONT',
      storeName: 'Café Atlas · Maarif',
      storeSub: 'Order and pay online, delivery or pickup — with no middleman.',
      copy: 'Copy',
      copied: 'Storefront link copied',
      preview: 'Preview storefront',
      previewToast: 'Storefront preview opened',
      previewDesc: `${URL} · customer view`,
      storefrontOn: 'Online storefront',
      live: 'Live · open to customers',
      paused: 'Paused · hidden from customers',
      toggledOn: 'Online storefront enabled',
      toggledOnDesc: 'Your customers can order right now.',
      toggledOff: 'Storefront paused',
      toggledOffDesc: 'The page is no longer taking orders.',
      saveLabel: 'WHAT YOU KEEP',
      saveVol: (v) => `On ${v} MAD/month of online orders`,
      saveHead: 'Commission per channel',
      saveBig: (v) => `You keep ${v} MAD/month more than with Glovo.`,
      saveSub: 'Kiwi Direct takes zero commission. Aggregators keep almost a third.',
      kiwiDirect: 'Kiwi Direct',
      glovo: 'Glovo',
      jumia: 'Jumia Food',
      netKept: (v) => `${v} net`,
      feeLost: (v) => `−${v}`,
      pct0: '0%',
      pctGlovo: '~30%',
      pctJumia: '~28%',
      channelsLabel: 'Sales channels',
      channelsMeta: 'Connect your online points of sale',
      chKiwiName: 'Kiwi Direct',
      chKiwiMeta: '0% commission · Kiwi payment',
      chGlovoMeta: 'Aggregator · ~30%',
      chJumiaMeta: 'Aggregator · ~28%',
      chCollectName: 'Click & Collect',
      chCollectMeta: 'In-store pickup',
      chDeliveryName: 'Kiwi Delivery',
      chDeliveryMeta: 'Kiwi fleet · flat rate',
      stActivated: 'Activated',
      stConnected: 'Connected',
      stConnect: 'Connect',
      chToastOn: (n) => `${n} activated`,
      chToastOff: (n) => `${n} disabled`,
      chToastConn: (n) => `${n} connected`,
      chToastConnDesc: 'Orders will land in your inbox.',
      inboxLabel: 'Online orders',
      inboxMeta: (n) => `${n} orders today`,
      stNew: 'New',
      stPrep: 'Preparing',
      stReady: 'Ready',
      sentToKitchen: 'Order sent to the kitchen',
      sentDesc: (c) => `${c} · ticket printed at the pass`,
      footNote: 'Updated in real time · T+1 settlement to your Kiwi Account.',
      activate: 'Enable online storefront',
      close: 'Close',
      activatedTitle: 'Online storefront enabled',
      activatedDesc: `${URL} is live · share the link with your customers.`,
    },
    ar: {
      title: 'الطلب عبر الإنترنت',
      subtitle: 'متجر الطلب الخاص بك بعمولة 0٪ · الميزة في وجه غلوفو',
      heroEyebrow: 'متجر كيوي الخاص بك',
      storeName: 'مقهى أطلس · المعاريف',
      storeSub: 'اطلب وادفع عبر الإنترنت، توصيل أو استلام — بدون وسيط.',
      copy: 'نسخ',
      copied: 'تم نسخ رابط المتجر',
      preview: 'معاينة المتجر',
      previewToast: 'تم فتح معاينة المتجر',
      previewDesc: `${URL} · عرض العميل`,
      storefrontOn: 'المتجر الإلكتروني',
      live: 'مباشر · متاح للعملاء',
      paused: 'متوقف مؤقتًا · مخفي عن العملاء',
      toggledOn: 'تم تفعيل المتجر الإلكتروني',
      toggledOnDesc: 'يمكن لعملائك الطلب الآن.',
      toggledOff: 'تم إيقاف المتجر مؤقتًا',
      toggledOffDesc: 'لم تعد الصفحة تستقبل الطلبات.',
      saveLabel: 'ما الذي تحتفظ به',
      saveVol: (v) => `على ${v} درهم/شهر من الطلبات عبر الإنترنت`,
      saveHead: 'العمولة حسب القناة',
      saveBig: (v) => `تحتفظ بـ ${v} درهم/شهر أكثر من غلوفو.`,
      saveSub: 'كيوي دايركت لا تأخذ أي عمولة. أما المنصات الوسيطة فتحتفظ بثلث المبلغ تقريبًا.',
      kiwiDirect: 'كيوي دايركت',
      glovo: 'غلوفو',
      jumia: 'جوميا فود',
      netKept: (v) => `${v} صافٍ`,
      feeLost: (v) => `−${v}`,
      pct0: '0٪',
      pctGlovo: '~30٪',
      pctJumia: '~28٪',
      channelsLabel: 'قنوات البيع',
      channelsMeta: 'اربط نقاط البيع عبر الإنترنت',
      chKiwiName: 'كيوي دايركت',
      chKiwiMeta: '0٪ عمولة · دفع كيوي',
      chGlovoMeta: 'منصة وسيطة · ~30٪',
      chJumiaMeta: 'منصة وسيطة · ~28٪',
      chCollectName: 'الطلب والاستلام',
      chCollectMeta: 'الاستلام من المتجر',
      chDeliveryName: 'توصيل كيوي',
      chDeliveryMeta: 'أسطول كيوي · سعر ثابت',
      stActivated: 'مفعّل',
      stConnected: 'متصل',
      stConnect: 'ربط',
      chToastOn: (n) => `تم تفعيل ${n}`,
      chToastOff: (n) => `تم تعطيل ${n}`,
      chToastConn: (n) => `تم ربط ${n}`,
      chToastConnDesc: 'ستصل الطلبات إلى صندوق الوارد.',
      inboxLabel: 'الطلبات عبر الإنترنت',
      inboxMeta: (n) => `${n} طلبات اليوم`,
      stNew: 'جديد',
      stPrep: 'قيد التحضير',
      stReady: 'جاهز',
      sentToKitchen: 'تم إرسال الطلب إلى المطبخ',
      sentDesc: (c) => `${c} · تمت طباعة التذكرة عند الممر`,
      footNote: 'يتم التحديث في الوقت الفعلي · تسوية في اليوم الموالي على حساب كيوي.',
      activate: 'تفعيل المتجر الإلكتروني',
      close: 'إغلاق',
      activatedTitle: 'تم تفعيل المتجر الإلكتروني',
      activatedDesc: `${URL} مباشر الآن · شارك الرابط مع عملائك.`,
    },
  };

  /* ─── Resolve real menu names from KiwiVenue, with safe fallbacks ─── */
  function menuName(id, fallback) {
    const items = (window.KiwiVenue?.getMenuItems?.() || []);
    const hit = items.find((i) => i.id === id);
    return hit ? hit.name : fallback;
  }

  /* ═══════════════════ ONLINE ORDERING ═══════════════════ */
  handlers['growth-ordering'] = () => {
    const T = STR[trLang()] || STR.fr;
    let storeOn = true;

    // Real menu names (live from the venue's menu engine; fallbacks if absent).
    const salade = menuName('ca-e01', 'Salade marocaine');
    const harira = menuName('ca-e03', 'Harira');
    const kefta  = menuName('ca-t01', 'Tajine kefta');
    const lait   = menuName('ca-b03', 'Café au lait');
    const jus    = menuName('ca-b05', 'Jus orange pressé');
    const the    = menuName('ca-b01', 'Thé à la menthe');
    const couscous = menuName('ca-c01', 'Couscous royal');

    const channels = [
      { key: 'kiwi',     name: T.chKiwiName,     meta: T.chKiwiMeta,     state: 'on',      icon: 'kiwi', glyph: 'K' },
      { key: 'glovo',    name: 'Glovo',          meta: T.chGlovoMeta,    state: 'conn',    icon: '',     glyph: 'G' },
      { key: 'jumia',    name: 'Jumia Food',     meta: T.chJumiaMeta,    state: 'connect', icon: '',     glyph: 'J' },
      { key: 'collect',  name: T.chCollectName,  meta: T.chCollectMeta,  state: 'on',      icon: '',     glyph: 'C&C' },
      { key: 'delivery', name: T.chDeliveryName, meta: T.chDeliveryMeta, state: 'connect', icon: '',     glyph: 'KD' },
    ];

    const orders = [
      { time: '12:48', ch: 'kiwi',  chLabel: T.kiwiDirect, cust: 'Nawal K.',   items: [kefta, the],      amt: 210, status: 'new' },
      { time: '12:41', ch: 'glovo', chLabel: 'Glovo',      cust: 'Karim B.',   items: [couscous],        amt: 220, status: 'prep' },
      { time: '12:33', ch: 'kiwi',  chLabel: T.kiwiDirect, cust: 'Salma F.',   items: [salade, jus],     amt: 95,  status: 'prep' },
      { time: '12:25', ch: 'jumia', chLabel: 'Jumia',      cust: 'Mehdi C.',   items: [harira, lait],    amt: 53,  status: 'ready' },
      { time: '12:18', ch: 'kiwi',  chLabel: T.kiwiDirect, cust: 'Imane S.',   items: [kefta, salade],   amt: 225, status: 'ready' },
      { time: '12:06', ch: 'glovo', chLabel: 'Glovo',      cust: 'Youssef A.', items: [couscous, the],   amt: 250, status: 'ready' },
    ];

    const chState = (s) =>
      s === 'on' ? `<span class="ord-chip ord-ready" data-chstate>${T.stActivated}</span>`
      : s === 'conn' ? `<span class="ord-chip ord-ready" data-chstate>${T.stConnected}</span>`
      : `<button class="kb ghost" data-connect style="padding:7px 14px;">${T.stConnect}</button>`;

    const chToggle = (c) => c.state === 'connect' ? '' :
      `<label class="ord-toggle on" data-chtoggle="${c.key}" data-chname="${c.name}">
         <span class="ord-switch"></span>
       </label>`;

    const statusChip = (s) =>
      s === 'new'  ? `<span class="ord-chip ord-new">${T.stNew}</span>`
      : s === 'prep' ? `<span class="ord-chip ord-prep">${T.stPrep}</span>`
      : `<span class="ord-chip ord-ready">${T.stReady}</span>`;

    const orderRow = (o, i) => `
      <div class="ord-order" data-order="${i}" data-cust="${o.cust}">
        <div class="ord-time">${o.time}</div>
        <div>
          <div class="ord-cust">${o.cust}</div>
          <div class="ord-items">${o.items.join(' · ')}</div>
        </div>
        <div class="ord-right">
          <div class="ord-amt">${fmt(o.amt)} MAD</div>
          <span class="ord-chip ord-${o.ch}">${o.chLabel}</span>
          ${statusChip(o.status)}
        </div>
      </div>`;

    const body = `
      <div class="ord-grid ord-2">
        <!-- 1 · Storefront hero -->
        <div class="ord-hero">
          <div class="ord-eyebrow">${T.heroEyebrow}</div>
          <div class="ord-storename">${T.storeName}</div>
          <div class="ord-storesub">${T.storeSub}</div>
          <div class="ord-hero-body">
            <div class="ord-hero-left">
              <div class="ord-urlbar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" stroke-width="2"><path d="M10 14a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 10a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <span class="ord-url">${URL}</span>
                <span class="ord-copy" data-copy="${URL}">${T.copy}</span>
              </div>
              <div class="ord-hero-actions">
                <button class="kb ghost" data-preview style="border-color:rgba(255,255,255,0.25); color:var(--paper);">${T.preview}</button>
                <label class="ord-toggle on" data-store-toggle>
                  <span class="ord-switch"></span>
                  <span data-store-label>${T.storefrontOn}</span>
                </label>
              </div>
              <div class="ord-statusline" data-store-status>
                <span class="ord-statusdot"></span><span data-store-statustext>${T.live}</span>
              </div>
            </div>
            <div class="ord-qr" aria-hidden="true"></div>
          </div>
        </div>

        <!-- 2 · Commission savings -->
        <div class="ord-save">
          <div class="ord-savetop">
            <div>
              <div class="ord-label" style="color:var(--riad);">${T.saveLabel}</div>
              <div class="ord-savehead" style="margin-top:6px;">${T.saveHead}</div>
            </div>
            <div class="ord-savevol">${T.saveVol(fmt(MONTHLY))}</div>
          </div>
          <div class="ord-savebig">+${fmt(glovoFee)}<span class="ord-u">MAD/mois</span></div>
          <div class="ord-savesub">${T.saveBig(`<b>${fmt(glovoFee)}</b>`)} ${T.saveSub}</div>
          <div class="ord-bars">
            <div class="ord-bar">
              <div class="ord-barname">${T.kiwiDirect} <span style="font-family:var(--mono);font-weight:400;">${T.pct0}</span></div>
              <div class="ord-bartrack"><span class="ord-barfill ord-kiwi" data-fill="2"></span></div>
              <div class="ord-barval"><span class="ord-net">${T.netKept(fmt(MONTHLY))}</span></div>
            </div>
            <div class="ord-bar">
              <div class="ord-barname">${T.glovo} <span style="font-family:var(--mono);font-weight:400;">${T.pctGlovo}</span></div>
              <div class="ord-bartrack"><span class="ord-barfill ord-rival" data-fill="30"></span></div>
              <div class="ord-barval"><span class="ord-fee">${T.feeLost(fmt(glovoFee))}</span></div>
            </div>
            <div class="ord-bar">
              <div class="ord-barname">${T.jumia} <span style="font-family:var(--mono);font-weight:400;">${T.pctJumia}</span></div>
              <div class="ord-bartrack"><span class="ord-barfill ord-rival" data-fill="28"></span></div>
              <div class="ord-barval"><span class="ord-fee">${T.feeLost(fmt(jumiaFee))}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3 · Channels -->
      <div class="ord-sectionhead">
        <div class="ord-h">${T.channelsLabel}</div>
        <div class="ord-meta">${T.channelsMeta}</div>
      </div>
      <div class="ord-channels">
        ${channels.map((c) => `
          <div class="ord-channel">
            <div class="ord-chico ${c.icon === 'kiwi' ? 'ord-kiwi' : ''}">${c.glyph}</div>
            <div class="ord-chbody">
              <div class="ord-chname">${c.name}</div>
              <div class="ord-chmeta">${c.meta}</div>
            </div>
            ${c.state === 'connect' ? chState(c.state) : `<div style="display:flex;align-items:center;gap:10px;">${chState(c.state)}${chToggle(c)}</div>`}
          </div>`).join('')}
      </div>

      <!-- 4 · Order inbox -->
      <div class="ord-sectionhead">
        <div class="ord-h">${T.inboxLabel}</div>
        <div class="ord-meta">${T.inboxMeta(orders.length)}</div>
      </div>
      <div class="ord-inbox">
        ${orders.map(orderRow).join('')}
      </div>
      <div class="ord-foot-note">${T.footNote}</div>
    `;

    const foot = `
      <button class="kb ghost" data-dismiss style="flex:1; justify-content:center;">${T.close}</button>
      <button class="kb atlas" data-activate style="flex:2; justify-content:center;">${T.activate}</button>`;

    const d = drawer({ title: T.title, subtitle: T.subtitle, fullpage: true, body, foot });

    // Animate the commission bars once mounted.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      d.el.querySelectorAll('[data-fill]').forEach((el) => { el.style.width = el.dataset.fill + '%'; });
    }));

    d.el.addEventListener('click', (e) => {
      // Copy storefront URL
      const copy = e.target.closest('[data-copy]');
      if (copy) {
        navigator.clipboard?.writeText('https://' + copy.dataset.copy);
        toast(T.copied, { type: 'success', desc: copy.dataset.copy });
        return;
      }
      // Preview storefront
      if (e.target.closest('[data-preview]')) {
        toast(T.previewToast, { type: 'info', desc: T.previewDesc });
        return;
      }
      // Storefront ON/OFF master toggle
      const storeT = e.target.closest('[data-store-toggle]');
      if (storeT) {
        e.preventDefault();
        storeOn = !storeOn;
        storeT.classList.toggle('on', storeOn);
        const statusEl = d.el.querySelector('[data-store-status]');
        statusEl?.classList.toggle('ord-off', !storeOn);
        const txt = d.el.querySelector('[data-store-statustext]');
        if (txt) txt.textContent = storeOn ? T.live : T.paused;
        toast(storeOn ? T.toggledOn : T.toggledOff, {
          type: storeOn ? 'success' : 'info',
          desc: storeOn ? T.toggledOnDesc : T.toggledOffDesc,
        });
        return;
      }
      // Channel connect button
      const conn = e.target.closest('[data-connect]');
      if (conn) {
        const name = conn.closest('.ord-channel')?.querySelector('.ord-chname')?.textContent || '';
        conn.outerHTML = `<span class="ord-chip ord-ready">${T.stConnected}</span>`;
        toast(T.chToastConn(name), { type: 'success', desc: T.chToastConnDesc });
        return;
      }
      // Channel on/off toggle
      const chT = e.target.closest('[data-chtoggle]');
      if (chT) {
        e.preventDefault();
        const isOn = chT.classList.toggle('on');
        const name = chT.dataset.chname || '';
        toast(isOn ? T.chToastOn(name) : T.chToastOff(name), { type: isOn ? 'success' : 'info' });
        return;
      }
      // Order row → send to kitchen
      const row = e.target.closest('[data-order]');
      if (row) {
        toast(T.sentToKitchen, { type: 'success', desc: T.sentDesc(row.dataset.cust) });
        return;
      }
      // Footer CTA → confetti + success
      if (e.target.closest('[data-activate]')) {
        confetti();
        toast(T.activatedTitle, { type: 'success', desc: T.activatedDesc });
        return;
      }
      // [data-dismiss] (Fermer) is handled by the drawer backdrop listener.
    });
  };

  /* Expose for command palette / programmatic launch, mirroring KiwiFeatures. */
  window.KiwiGrowthOrdering = { open: () => handlers['growth-ordering']() };
})();
