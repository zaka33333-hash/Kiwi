/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · growth-giftcards.js
 *
 * "Cartes cadeaux" feature — issue, track, and redeem branded gift cards
 * tied to Kiwi Wallet. Mirrors the handler pattern in features.js.
 *
 * Requires: interactive.js (Kiwi.toast, Kiwi.drawer, Kiwi.handlers, Kiwi.confetti)
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (!window.Kiwi) { console.warn('growth-giftcards.js loaded before interactive.js'); return; }
  const { toast, drawer, handlers, confetti } = window.Kiwi;
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* ─── Injected styles — every class prefixed "gft-" ─── */
  const CSS = `
    .gft-issue-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
    @media (max-width: 700px) { .gft-issue-wrap { grid-template-columns: 1fr; } }

    .gft-card-visual {
      background: linear-gradient(135deg, var(--atlas) 0%, var(--riad) 100%);
      border-radius: 18px; padding: 26px 24px 22px; color: var(--paper);
      position: relative; overflow: hidden; aspect-ratio: 1.58;
      display: flex; flex-direction: column; justify-content: space-between;
      max-width: 340px;
    }
    .gft-card-visual::before {
      content: ""; position: absolute; top: -60px; right: -50px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(125,242,176,0.35), transparent 65%);
      pointer-events: none;
    }
    .gft-card-brand { font-size: 20px; font-weight: 700; letter-spacing: -0.05em; position: relative; }
    .gft-card-brand span { color: var(--mint); }
    .gft-card-venue {
      font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(247,245,240,0.65); margin-top: 3px;
      font-family: var(--mono); position: relative;
    }
    .gft-card-code { font-family: var(--mono); font-size: 15px; letter-spacing: 0.14em; position: relative; }
    .gft-card-amount {
      font-size: 32px; font-weight: 700; letter-spacing: -0.04em;
      position: relative; font-feature-settings: "tnum" 1;
    }
    .gft-card-amount .gft-cur { font-size: 14px; font-weight: 500; margin-inline-start: 4px; vertical-align: super; }

    .gft-label {
      font-size: 10.5px; letter-spacing: 0.09em; text-transform: uppercase;
      color: var(--n-500); font-family: var(--mono); margin-bottom: 8px;
    }
    .gft-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .gft-chip {
      padding: 8px 18px; border: 1px solid var(--n-200); border-radius: 999px;
      background: #fff; font-size: 13.5px; font-weight: 500; cursor: pointer;
      transition: border-color 150ms, background 150ms, color 150ms;
      color: var(--ink); font-family: var(--mono);
    }
    .gft-chip:hover { border-color: var(--atlas); }
    .gft-chip.gft-selected { border-color: var(--atlas); background: var(--atlas); color: var(--paper); }
    html[data-theme="dark"] .gft-chip { background: var(--paper-soft); border-color: var(--n-200); }
    html[data-theme="dark"] .gft-chip.gft-selected { background: var(--atlas); color: var(--paper); }

    .gft-free-input { display: none; margin-bottom: 16px; }
    .gft-free-input.gft-visible { display: block; }
    .gft-free-input input {
      width: 100%; border: 1px solid var(--n-200); border-radius: 10px;
      padding: 11px 14px; font-size: 14px; font-family: var(--mono);
      background: #fff; color: var(--ink); outline: none;
      transition: border-color 150ms; box-sizing: border-box;
    }
    .gft-free-input input:focus { border-color: var(--atlas); }
    html[data-theme="dark"] .gft-free-input input { background: var(--paper-soft); border-color: var(--n-200); }

    .gft-fields { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
    .gft-field input {
      width: 100%; border: 1px solid var(--n-200); border-radius: 10px;
      padding: 11px 14px; font-size: 14px; background: #fff; color: var(--ink);
      outline: none; transition: border-color 150ms; box-sizing: border-box;
      font-family: var(--sans);
    }
    .gft-field input:focus { border-color: var(--atlas); }
    html[data-theme="dark"] .gft-field input { background: var(--paper-soft); border-color: var(--n-200); }

    .gft-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 28px 0 24px; }
    @media (max-width: 600px) { .gft-stats { grid-template-columns: 1fr; } }
    .gft-stat { background: #fff; border: 1px solid var(--n-200); border-radius: 14px; padding: 18px; }
    html[data-theme="dark"] .gft-stat { background: var(--paper-soft); border-color: var(--n-200); }
    .gft-stat .gft-stat-l {
      font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--n-500); font-family: var(--mono);
    }
    .gft-stat .gft-stat-v {
      font-size: 26px; font-weight: 700; letter-spacing: -0.035em;
      margin-top: 6px; font-feature-settings: "tnum" 1; color: var(--ink);
    }
    .gft-stat .gft-stat-sub { font-size: 11px; color: var(--n-500); margin-top: 2px; }

    .gft-cards-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
    .gft-row {
      background: #fff; border: 1px solid var(--n-200); border-radius: 12px;
      padding: 14px 16px; display: grid;
      grid-template-columns: auto 1fr auto auto; gap: 14px; align-items: center;
    }
    html[data-theme="dark"] .gft-row { background: var(--paper-soft); border-color: var(--n-200); }
    .gft-row-code { font-family: var(--mono); font-size: 12.5px; color: var(--n-600); white-space: nowrap; }
    .gft-row-info { min-width: 0; }
    .gft-row-name { font-size: 13.5px; font-weight: 500; color: var(--ink); }
    .gft-row-meta { font-size: 12px; color: var(--n-500); margin-top: 2px; font-family: var(--mono); }
    .gft-row-expiry { font-size: 11.5px; color: var(--n-500); font-family: var(--mono); text-align: end; white-space: nowrap; }
    .gft-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 500; white-space: nowrap; }
    .gft-badge.active  { background: rgba(11,110,79,0.10); color: var(--atlas); }
    .gft-badge.used    { background: var(--n-200); color: var(--n-600); }
    .gft-badge.expired { background: rgba(200,50,50,0.10); color: #C22; }
    html[data-theme="dark"] .gft-badge.active  { background: rgba(125,242,176,0.15); color: var(--mint); }
    html[data-theme="dark"] .gft-badge.used    { background: rgba(255,255,255,0.08); color: var(--n-500); }
    html[data-theme="dark"] .gft-badge.expired { background: rgba(220,50,50,0.15); color: #f87; }

    .gft-redeem-box { background: #fff; border: 1px solid var(--n-200); border-radius: 14px; padding: 20px; margin-bottom: 28px; }
    html[data-theme="dark"] .gft-redeem-box { background: var(--paper-soft); border-color: var(--n-200); }
    .gft-redeem-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
    .gft-redeem-row input {
      flex: 1; border: 1px solid var(--n-200); border-radius: 10px;
      padding: 11px 14px; font-size: 14px; font-family: var(--mono);
      background: #fff; color: var(--ink); outline: none;
      transition: border-color 150ms; box-sizing: border-box;
    }
    .gft-redeem-row input:focus { border-color: var(--atlas); }
    html[data-theme="dark"] .gft-redeem-row input { background: var(--paper-soft); border-color: var(--n-200); }

    .gft-section-title {
      font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
      font-family: var(--mono); color: var(--n-500); margin: 28px 0 14px;
    }
    .gft-footer { padding-top: 8px; border-top: 1px solid var(--n-200); margin-top: 8px; }
    [dir="rtl"] .gft-row { direction: rtl; }
    [dir="rtl"] .gft-issue-wrap { direction: rtl; }
  `;

  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ─── Strings ─── */
  const STR = {
    fr: {
      title: 'Cartes cadeaux',
      subtitle: 'Émettez et gérez les cartes cadeaux Café Atlas · Kiwi Wallet',
      issueTitle: 'ÉMETTRE UNE CARTE CADEAU',
      amountLabel: 'MONTANT',
      chip100: '100 MAD', chip200: '200 MAD', chip500: '500 MAD', chipFree: 'Montant libre',
      freeHint: 'Montant en MAD',
      recipientLabel: 'DESTINATAIRE',
      fieldName: 'Nom du destinataire', fieldPhone: 'Téléphone (WhatsApp)',
      sendBtn: 'Envoyer par WhatsApp',
      sentTitle: 'Carte cadeau envoyée', sentDesc: 'La carte a été partagée par WhatsApp.',
      statsTitle: 'APERÇU DU MOIS',
      stat1L: 'Cartes émises', stat1V: '38', stat1Sub: 'ce mois',
      stat2L: 'Solde en circulation', stat2Sub: 'à dépenser',
      stat3L: "Taux d'utilisation", stat3V: '71 %', stat3Sub: 'des cartes actives',
      activeTitle: 'CARTES ACTIVES',
      redeemTitle: 'VÉRIFIER / ENCAISSER',
      redeemLabel: 'Code carte cadeau', redeemPlaceholder: 'Saisir un code cadeau',
      redeemBtn: 'Vérifier le solde',
      redeemToastTitle: 'Solde vérifié', redeemToastDesc: 'Solde : 200 MAD · valable jusqu\'au 31/12/2026',
      statusActive: 'Active', statusUsed: 'Utilisée', statusExpired: 'Expirée',
      expiryLabel: 'Exp.', balanceOf: '/', madUnit: 'MAD', closeBtn: 'Fermer',
    },
    en: {
      title: 'Gift cards',
      subtitle: 'Issue and manage Café Atlas gift cards · Kiwi Wallet',
      issueTitle: 'ISSUE A GIFT CARD',
      amountLabel: 'AMOUNT',
      chip100: '100 MAD', chip200: '200 MAD', chip500: '500 MAD', chipFree: 'Custom amount',
      freeHint: 'Amount in MAD',
      recipientLabel: 'RECIPIENT',
      fieldName: "Recipient's name", fieldPhone: 'Phone (WhatsApp)',
      sendBtn: 'Send via WhatsApp',
      sentTitle: 'Gift card sent', sentDesc: 'The card has been shared via WhatsApp.',
      statsTitle: 'THIS MONTH',
      stat1L: 'Cards issued', stat1V: '38', stat1Sub: 'this month',
      stat2L: 'Outstanding balance', stat2Sub: 'to spend',
      stat3L: 'Redemption rate', stat3V: '71 %', stat3Sub: 'of active cards',
      activeTitle: 'ACTIVE CARDS',
      redeemTitle: 'CHECK / REDEEM',
      redeemLabel: 'Gift card code', redeemPlaceholder: 'Enter a gift card code',
      redeemBtn: 'Check balance',
      redeemToastTitle: 'Balance verified', redeemToastDesc: 'Balance: 200 MAD · valid until 31/12/2026',
      statusActive: 'Active', statusUsed: 'Used', statusExpired: 'Expired',
      expiryLabel: 'Exp.', balanceOf: '/', madUnit: 'MAD', closeBtn: 'Close',
    },
    ar: {
      title: 'بطاقات الهدايا',
      subtitle: 'إصدار وإدارة بطاقات هدايا كافيه أطلس · محفظة كيوي',
      issueTitle: 'إصدار بطاقة هدية',
      amountLabel: 'المبلغ',
      chip100: '100 درهم', chip200: '200 درهم', chip500: '500 درهم', chipFree: 'مبلغ حر',
      freeHint: 'المبلغ بالدرهم',
      recipientLabel: 'المستلم',
      fieldName: 'اسم المستلم', fieldPhone: 'الهاتف (واتساب)',
      sendBtn: 'إرسال عبر واتساب',
      sentTitle: 'تم إرسال البطاقة', sentDesc: 'تمت مشاركة البطاقة عبر واتساب.',
      statsTitle: 'إحصاءات الشهر',
      stat1L: 'بطاقات صادرة', stat1V: '38', stat1Sub: 'هذا الشهر',
      stat2L: 'الرصيد المتداول', stat2Sub: 'للإنفاق',
      stat3L: 'معدل الاستخدام', stat3V: '71 %', stat3Sub: 'من البطاقات النشطة',
      activeTitle: 'البطاقات النشطة',
      redeemTitle: 'التحقق / الصرف',
      redeemLabel: 'رمز بطاقة الهدية', redeemPlaceholder: 'أدخل رمز البطاقة',
      redeemBtn: 'التحقق من الرصيد',
      redeemToastTitle: 'تم التحقق من الرصيد', redeemToastDesc: 'الرصيد: 200 درهم · صالح حتى 31/12/2026',
      statusActive: 'نشطة', statusUsed: 'مستخدمة', statusExpired: 'منتهية',
      expiryLabel: 'انتهاء', balanceOf: '/', madUnit: 'درهم', closeBtn: 'إغلاق',
    },
  };

  /* ─── Mock active-cards data ─── */
  const CARDS_DATA = [
    { code: 'KIWI   4821', name: 'Yasmine Benali',   bal: 120, total: 200, expiry: '31/12/2026', status: 'active'  },
    { code: 'KIWI   7203', name: 'Karim Tazi',       bal: 500, total: 500, expiry: '31/03/2027', status: 'active'  },
    { code: 'KIWI   3310', name: 'Fatima Ouhajji',   bal:   0, total: 100, expiry: '28/02/2026', status: 'used'    },
    { code: 'KIWI   9987', name: 'Mehdi Chraibi',    bal:  80, total: 200, expiry: '30/06/2026', status: 'active'  },
    { code: 'KIWI   1145', name: 'Salma Idrissi',    bal:   0, total: 500, expiry: '31/01/2026', status: 'expired' },
    { code: 'KIWI   6674', name: 'Omar El Fassi',    bal: 200, total: 200, expiry: '31/12/2026', status: 'active'  },
  ];

  /* ─── Handler ─── */
  handlers['growth-giftcards'] = () => {
    const T   = STR[trLang()] || STR.fr;
    const isAr = trLang() === 'ar';
    const madSuffix = () => (trLang() === 'ar' ? ' درهم' : '<span class="gft-cur">MAD</span>');

    /* Build active-cards rows */
    const cardRows = CARDS_DATA.map((c) => {
      const statusKey = c.status === 'active' ? T.statusActive
        : c.status === 'used' ? T.statusUsed : T.statusExpired;
      return [
        '<div class="gft-row">',
        '<span class="gft-row-code">' + c.code + '</span>',
        '<div class="gft-row-info">',
        '<div class="gft-row-name">' + c.name + '</div>',
        '<div class="gft-row-meta">' + fmt(c.bal) + ' ' + T.balanceOf + ' ' + fmt(c.total) + ' ' + T.madUnit + '</div>',
        '</div>',
        '<div class="gft-row-expiry">' + T.expiryLabel + ' ' + c.expiry + '</div>',
        '<span class="gft-badge ' + c.status + '">' + statusKey + '</span>',
        '</div>',
      ].join('');
    }).join('');

    const stat2V = fmt(7250) + ' ' + T.madUnit;

    const body = [
      '<div' + (isAr ? ' dir="rtl"' : '') + '>',

      /* 1. Issue hero */
      '<p class="gft-section-title">' + T.issueTitle + '</p>',
      '<div class="gft-issue-wrap">',

        '<div class="gft-card-visual" aria-hidden="true">',
          '<div>',
            '<div class="gft-card-brand">Kiwi<span>·</span></div>',
            '<div class="gft-card-venue">Café Atlas · Maarif, Casablanca</div>',
          '</div>',
          '<div>',
            '<div class="gft-card-code" id="gft-vis-code">KIWI   4821</div>',
            '<div class="gft-card-amount" id="gft-vis-amount">200<span class="gft-cur">MAD</span></div>',
          '</div>',
        '</div>',

        '<div>',
          '<p class="gft-label">' + T.amountLabel + '</p>',
          '<div class="gft-chips">',
            '<button class="gft-chip" data-amt="100">' + T.chip100 + '</button>',
            '<button class="gft-chip gft-selected" data-amt="200">' + T.chip200 + '</button>',
            '<button class="gft-chip" data-amt="500">' + T.chip500 + '</button>',
            '<button class="gft-chip" data-amt="free">' + T.chipFree + '</button>',
          '</div>',
          '<div class="gft-free-input" id="gft-free-wrap">',
            '<input type="number" id="gft-free-val" min="10" max="5000" placeholder="' + T.freeHint + '" />',
          '</div>',
          '<p class="gft-label">' + T.recipientLabel + '</p>',
          '<div class="gft-fields">',
            '<div class="gft-field"><input type="text" id="gft-name" placeholder="' + T.fieldName + '" autocomplete="off" /></div>',
            '<div class="gft-field"><input type="tel" id="gft-phone" placeholder="' + T.fieldPhone + '" autocomplete="off" /></div>',
          '</div>',
          '<button class="kb atlas" data-action="gft-send">' + T.sendBtn + '</button>',
        '</div>',
      '</div>',

      /* 2. Stats row */
      '<p class="gft-section-title">' + T.statsTitle + '</p>',
      '<div class="gft-stats">',
        '<div class="gft-stat"><div class="gft-stat-l">' + T.stat1L + '</div><div class="gft-stat-v">' + T.stat1V + '</div><div class="gft-stat-sub">' + T.stat1Sub + '</div></div>',
        '<div class="gft-stat"><div class="gft-stat-l">' + T.stat2L + '</div><div class="gft-stat-v">' + stat2V + '</div><div class="gft-stat-sub">' + T.stat2Sub + '</div></div>',
        '<div class="gft-stat"><div class="gft-stat-l">' + T.stat3L + '</div><div class="gft-stat-v">' + T.stat3V + '</div><div class="gft-stat-sub">' + T.stat3Sub + '</div></div>',
      '</div>',

      /* 3. Active cards list */
      '<p class="gft-section-title">' + T.activeTitle + '</p>',
      '<div class="gft-cards-list">' + cardRows + '</div>',

      /* 4. Redeem box */
      '<p class="gft-section-title">' + T.redeemTitle + '</p>',
      '<div class="gft-redeem-box">',
        '<p class="gft-label">' + T.redeemLabel + '</p>',
        '<div class="gft-redeem-row">',
          '<input type="text" id="gft-redeem-code" placeholder="' + T.redeemPlaceholder + '" autocomplete="off" />',
          '<button class="kb ghost" data-action="gft-check">' + T.redeemBtn + '</button>',
        '</div>',
      '</div>',

      /* 5. Footer */
      '<div class="gft-footer"><button class="kb ghost" data-dismiss="true">' + T.closeBtn + '</button></div>',

      '</div>',
    ].join('');

    const d = drawer({ title: T.title, subtitle: T.subtitle, fullpage: true, body });

    /* Wire free-amount input after DOM is live */
    const freeInput = d.el.querySelector('#gft-free-val');
    if (freeInput) {
      freeInput.addEventListener('input', () => {
        const v = parseInt(freeInput.value, 10);
        if (!isNaN(v) && v > 0) {
          const visAmt = d.el.querySelector('#gft-vis-amount');
          if (visAmt) { visAmt.textContent = ''; visAmt.insertAdjacentHTML('beforeend', fmt(v) + madSuffix()); }
        }
      });
    }

    d.el.addEventListener('click', (e) => {
      const target = e.target.closest('[data-amt], [data-action], [data-dismiss]');
      if (!target) return;

      /* Amount chip selection */
      if (Object.prototype.hasOwnProperty.call(target.dataset, 'amt')) {
        d.el.querySelectorAll('.gft-chip').forEach((c) => c.classList.remove('gft-selected'));
        target.classList.add('gft-selected');
        const freeWrap = d.el.querySelector('#gft-free-wrap');
        if (target.dataset.amt === 'free') {
          if (freeWrap) freeWrap.classList.add('gft-visible');
        } else {
          if (freeWrap) freeWrap.classList.remove('gft-visible');
          const amt = parseInt(target.dataset.amt, 10);
          const visAmt = d.el.querySelector('#gft-vis-amount');
          if (visAmt) { visAmt.textContent = ''; visAmt.insertAdjacentHTML('beforeend', fmt(amt) + madSuffix()); }
        }
        return;
      }

      const action = target.dataset.action;

      /* Send gift card */
      if (action === 'gft-send') {
        const T2 = STR[trLang()] || STR.fr;
        confetti();
        toast(T2.sentTitle, { desc: T2.sentDesc, type: 'success' });
        return;
      }

      /* Verify / redeem */
      if (action === 'gft-check') {
        const T2 = STR[trLang()] || STR.fr;
        toast(T2.redeemToastTitle, { desc: T2.redeemToastDesc, type: 'info' });
        return;
      }

      /* Dismiss */
      if (target.dataset.dismiss) {
        d.close();
      }
    });
  };

})();
