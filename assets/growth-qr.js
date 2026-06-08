/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · growth-qr.js — "Commander à table" / Order & Pay at the table
 *
 * Guest scans a table QR, browses the menu, orders and pays from their phone.
 * Requires interactive.js (Kiwi.toast, Kiwi.drawer, Kiwi.handlers, Kiwi.confetti).
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (!window.Kiwi) { console.warn('growth-qr.js loaded before interactive.js'); return; }
  const { toast, drawer, handlers, confetti } = window.Kiwi;
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* ─── Styles ─── */
  const CSS = `
  .qro-wrap { display: flex; flex-direction: column; gap: 28px; }

  /* Intro band */
  .qro-intro { background: linear-gradient(135deg, var(--atlas), var(--riad)); color: var(--paper); border-radius: 14px; padding: 20px 22px; }
  .qro-intro p { font-size: 13.5px; line-height: 1.5; opacity: 0.92; margin: 0 0 16px; }
  .qro-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .qro-chip { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 5px 13px; font-size: 12px; font-family: var(--mono); letter-spacing: 0.02em; }

  /* Section labels */
  .qro-section-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--n-500); margin-bottom: 12px; }

  /* Tables grid */
  .qro-tables { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .qro-table-card { background: #fff; border: 1px solid var(--n-200); border-radius: 14px; padding: 14px 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  html[data-theme="dark"] .qro-table-card { background: var(--paper-soft); border-color: var(--n-200); }
  .qro-table-num { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
  .qro-qr { width: 54px; height: 54px; border: 2px solid var(--ink); border-radius: 6px; background-color: #fff; background-image: repeating-linear-gradient(0deg, var(--ink) 0 5px, transparent 5px 10px), repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 10px); background-size: 10px 10px; flex-shrink: 0; }
  .qro-status { font-size: 11px; font-family: var(--mono); border-radius: 20px; padding: 3px 9px; border: 1px solid transparent; }
  .qro-status.libre { color: var(--atlas); border-color: var(--atlas); background: rgba(11,110,79,0.07); }
  .qro-status.occupee { color: #b45309; border-color: #f59e0b; background: rgba(245,158,11,0.08); }
  .qro-status.commande { color: var(--atlas); border-color: var(--mint); background: rgba(125,242,176,0.15); }

  /* Print row */
  .qro-print-row { display: flex; justify-content: flex-end; margin-top: 6px; }

  /* Phone mockup */
  .qro-phone-wrap { display: flex; justify-content: center; }
  .qro-phone { width: 276px; background: #f3f4f6; border: 6px solid #1a1a1a; border-radius: 36px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); overflow: hidden; position: relative; }
  .qro-phone-notch { background: #1a1a1a; height: 26px; display: flex; align-items: center; justify-content: center; }
  .qro-phone-notch-pill { width: 70px; height: 8px; background: #333; border-radius: 6px; }
  .qro-phone-header { background: var(--atlas); color: var(--paper); padding: 14px 16px 12px; text-align: center; }
  .qro-phone-header .venue { font-weight: 700; font-size: 15px; letter-spacing: -0.02em; }
  .qro-phone-header .sub { font-size: 11px; opacity: 0.75; margin-top: 2px; }
  .qro-phone-body { background: #fff; padding: 0 0 60px; }
  .qro-phone-cat { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--mono); color: #6b7280; padding: 12px 14px 6px; }
  .qro-phone-item { display: flex; align-items: center; padding: 9px 14px; border-bottom: 1px solid #f1f1f1; gap: 10px; }
  .qro-phone-item .iname { flex: 1; font-size: 13px; font-weight: 500; color: #111; }
  .qro-phone-item .iprice { font-size: 12.5px; color: #374151; font-family: var(--mono); margin-inline-end: 8px; }
  .qro-phone-item .iadd { width: 26px; height: 26px; background: var(--atlas); color: #fff; border: 0; border-radius: 50%; font-size: 18px; line-height: 1; cursor: default; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 50%; }
  .qro-phone-cart { position: absolute; bottom: 0; left: 0; right: 0; background: var(--atlas); color: #fff; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .qro-phone-cart .cart-info { font-size: 12.5px; opacity: 0.9; }
  .qro-phone-cart .pay-btn { background: var(--mint); color: var(--riad); font-weight: 700; font-size: 12.5px; padding: 7px 16px; border-radius: 20px; border: 0; cursor: default; }

  /* Footer actions */
  .qro-footer { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }

  /* RTL adjustments */
  html[dir="rtl"] .qro-chips { direction: rtl; }
  html[dir="rtl"] .qro-phone-header, html[dir="rtl"] .qro-phone-body { direction: rtl; }

  /* Dark mode */
  html[data-theme="dark"] .qro-intro { background: linear-gradient(135deg, var(--atlas), #032e22); }
  html[data-theme="dark"] .qro-phone { border-color: #2a2a2a; background: #1c1c1e; }
  html[data-theme="dark"] .qro-phone-body { background: #1c1c1e; }
  html[data-theme="dark"] .qro-phone-item { border-bottom-color: #2c2c2e; }
  html[data-theme="dark"] .qro-phone-item .iname { color: #f1f1f1; }
  html[data-theme="dark"] .qro-phone-item .iprice { color: #9ca3af; }
  html[data-theme="dark"] .qro-phone-cat { color: #6b7280; }
  `;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ─── Strings ─── */
  const STR = {
    fr: {
      title: 'Commander à table',
      subtitle: 'Le client scanne, commande et paie depuis son téléphone. Sans attendre.',
      introProp: 'Offrez à vos clients une expérience self-service : ils scannent le QR code de leur table, parcourent votre carte, commandent et paient en quelques secondes — sans intervention du personnel.',
      chip1: '32 % des tables via QR',
      chip2: 'panier QR +18 %',
      chip3: 'service −7 min',
      sectionTables: 'TABLES — QR CODES',
      sectionPreview: 'APERÇU CLIENT',
      previewSub: 'Expérience sur téléphone du client',
      libre: 'Libre',
      occupee: 'Occupée',
      commande: 'Commande en cours',
      printQr: 'Imprimer les QR',
      printToast: 'Impression lancée',
      printToastDesc: 'Les QR codes de vos 12 tables sont envoyés à l\'imprimante.',
      cat1: 'ENTRÉES',
      cat2: 'BOISSONS',
      cartInfo: '2 articles · 95 MAD',
      payBtn: 'Payer',
      activate: 'Activer la commande à table',
      activateToast: 'Fonctionnalité activée',
      activateToastDesc: 'La commande à table est maintenant disponible pour vos clients.',
      close: 'Fermer',
    },
    en: {
      title: 'Order & Pay at the table',
      subtitle: 'Guests scan, order and pay from their phone — no waiter needed.',
      introProp: 'Give your guests a seamless self-service experience: they scan the QR code on their table, browse your menu, order and pay in seconds — no staff required.',
      chip1: '32% of tables via QR',
      chip2: 'QR basket +18%',
      chip3: 'service −7 min',
      sectionTables: 'TABLES — QR CODES',
      sectionPreview: 'GUEST PREVIEW',
      previewSub: 'Guest phone experience',
      libre: 'Available',
      occupee: 'Occupied',
      commande: 'Order in progress',
      printQr: 'Print QR codes',
      printToast: 'Print job started',
      printToastDesc: 'QR codes for your 12 tables have been sent to the printer.',
      cat1: 'STARTERS',
      cat2: 'DRINKS',
      cartInfo: '2 items · 95 MAD',
      payBtn: 'Pay',
      activate: 'Activate table ordering',
      activateToast: 'Feature activated',
      activateToastDesc: 'Table ordering is now live for your guests.',
      close: 'Close',
    },
    ar: {
      title: 'الطلب من الطاولة',
      subtitle: 'يمسح الضيف الرمز ويطلب ويدفع من هاتفه — دون انتظار النادل.',
      introProp: 'امنح ضيوفك تجربة خدمة ذاتية سلسة: يمسحون رمز QR على طاولتهم، يتصفحون قائمة الطعام، يطلبون ويدفعون في ثوانٍ — دون الحاجة لأي موظف.',
      chip1: '32% من الطاولات عبر QR',
      chip2: 'سلة QR أعلى بـ 18%',
      chip3: 'الخدمة أسرع بـ 7 د',
      sectionTables: 'الطاولات — رموز QR',
      sectionPreview: 'معاينة تجربة الضيف',
      previewSub: 'تجربة الضيف على الهاتف',
      libre: 'متاحة',
      occupee: 'مشغولة',
      commande: 'طلب قيد التنفيذ',
      printQr: 'طباعة رموز QR',
      printToast: 'بدأت الطباعة',
      printToastDesc: 'تم إرسال رموز QR لـ 12 طاولة إلى الطابعة.',
      cat1: 'المقبلات',
      cat2: 'المشروبات',
      cartInfo: 'مقالتان · 95 MAD',
      payBtn: 'الدفع',
      activate: 'تفعيل الطلب من الطاولة',
      activateToast: 'تم تفعيل الميزة',
      activateToastDesc: 'أصبح الطلب من الطاولة متاحاً لضيوفك الآن.',
      close: 'إغلاق',
    },
  };

  /* ─── Table status distribution (deterministic) ─── */
  const TABLE_STATUS = [
    'libre','occupee','commande','libre','occupee','libre',
    'commande','libre','occupee','libre','libre','commande',
  ];

  /* ─── Handler ─── */
  handlers['growth-qr'] = () => {
    const T = STR[trLang()] || STR.fr;
    const lang = trLang();

    /* Menu items from venue or safe fallback */
    const allItems = (window.KiwiVenue?.getMenuItems?.() || [
      { id: 1, name: 'Salade marocaine',  category: 'entrees',  price: 45  },
      { id: 2, name: 'Harira',            category: 'entrees',  price: 35  },
      { id: 3, name: 'Briouates',         category: 'entrees',  price: 38  },
      { id: 4, name: 'Café au lait',      category: 'boissons', price: 18  },
      { id: 5, name: 'Jus d\'avocat',     category: 'boissons', price: 50  },
      { id: 6, name: 'Thé à la menthe',   category: 'boissons', price: 15  },
    ]);

    const entrees  = allItems.filter(i => i.category === 'entrees'  || i.category === 'starters').slice(0, 3);
    const boissons = allItems.filter(i => i.category === 'boissons' || i.category === 'drinks').slice(0, 3);

    /* Fall back gracefully if categories missing */
    const preview1 = entrees.length  ? entrees  : allItems.slice(0, 3);
    const preview2 = boissons.length ? boissons : allItems.slice(3, 6);

    const renderItem = (item) => `
      <div class="qro-phone-item">
        <span class="iname">${item.name}</span>
        <span class="iprice">${fmt(item.price)} MAD</span>
        <button class="iadd" tabindex="-1" aria-hidden="true">+</button>
      </div>`;

    /* Tables grid */
    const tablesHtml = Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const st = TABLE_STATUS[i];
      const label = T[st];
      return `
        <div class="qro-table-card">
          <span class="qro-table-num">T${num}</span>
          <div class="qro-qr" role="img" aria-label="QR table ${num}"></div>
          <span class="qro-status ${st}">${label}</span>
        </div>`;
    }).join('');

    const body = `
      <div class="qro-wrap">

        <!-- 1. Intro -->
        <div class="qro-intro">
          <p>${T.introProp}</p>
          <div class="qro-chips">
            <span class="qro-chip">${T.chip1}</span>
            <span class="qro-chip">${T.chip2}</span>
            <span class="qro-chip">${T.chip3}</span>
          </div>
        </div>

        <!-- 2. Tables -->
        <div>
          <div class="qro-section-label">${T.sectionTables}</div>
          <div class="qro-tables">${tablesHtml}</div>
          <div class="qro-print-row" style="margin-top:12px">
            <button class="kb ghost" data-action="qro-print">${T.printQr}</button>
          </div>
        </div>

        <!-- 3. Guest preview -->
        <div>
          <div class="qro-section-label">${T.sectionPreview}</div>
          <p style="font-size:12.5px;color:var(--n-500);margin:0 0 14px;line-height:1.5">${T.previewSub}</p>
          <div class="qro-phone-wrap">
            <div class="qro-phone" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
              <div class="qro-phone-notch"><div class="qro-phone-notch-pill"></div></div>
              <div class="qro-phone-header">
                <div class="venue">Café Atlas · Maarif</div>
                <div class="sub">T4 &mdash; ${lang === 'ar' ? 'قائمة الطعام' : lang === 'en' ? 'Menu' : 'Carte'}</div>
              </div>
              <div class="qro-phone-body">
                <div class="qro-phone-cat">${T.cat1}</div>
                ${preview1.map(renderItem).join('')}
                <div class="qro-phone-cat">${T.cat2}</div>
                ${preview2.map(renderItem).join('')}
              </div>
              <div class="qro-phone-cart">
                <span class="cart-info">${T.cartInfo}</span>
                <button class="pay-btn">${T.payBtn}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Footer -->
        <div class="qro-footer">
          <button class="kb atlas" data-action="qro-activate">${T.activate}</button>
          <button class="kb ghost" data-dismiss="drawer">${T.close}</button>
        </div>

      </div>`;

    const d = drawer({ title: T.title, subtitle: T.subtitle, fullpage: true, body });

    d.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const TT = STR[trLang()] || STR.fr;

      if (action === 'qro-print') {
        toast(TT.printToast, { desc: TT.printToastDesc, type: 'success' });
      } else if (action === 'qro-activate') {
        confetti && confetti();
        toast(TT.activateToast, { desc: TT.activateToastDesc, type: 'success' });
      }
    });
  };

})();
