/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · Growth CRM — Clients & Marketing
 *
 * Adds handler: growth-crm
 * Requires interactive.js (Kiwi.toast, Kiwi.drawer, Kiwi.handlers, Kiwi.confetti).
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (!window.Kiwi) { console.warn('growth-crm.js loaded before interactive.js'); return; }
  const { toast, drawer, handlers, confetti } = window.Kiwi;
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR');

  /* ─── Injected styles ─── */
  const CSS = `
  .crm-wrap { display: flex; flex-direction: column; gap: 28px; }

  /* Section label */
  .crm-section-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--n-500); margin-bottom: 10px; }

  /* Segment grid */
  .crm-segments { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  @media (max-width: 900px) { .crm-segments { grid-template-columns: repeat(2, 1fr); } }
  .crm-seg-card { background: #fff; border: 1.5px solid var(--n-200); border-radius: 14px; padding: 18px; cursor: pointer; transition: border-color 150ms, box-shadow 150ms; position: relative; }
  .crm-seg-card:hover { border-color: var(--atlas); }
  .crm-seg-card.crm-selected { border-color: var(--atlas); box-shadow: 0 0 0 3px rgba(11,110,79,0.12); }
  .crm-seg-card .crm-seg-count { font-size: 28px; font-weight: 600; letter-spacing: -0.03em; font-feature-settings: "tnum" 1; color: var(--ink); }
  .crm-seg-card .crm-seg-label { font-size: 13px; font-weight: 500; color: var(--ink); margin-top: 4px; }
  .crm-seg-card .crm-seg-sub { font-size: 11.5px; color: var(--n-500); margin-top: 2px; font-feature-settings: "tnum" 1; }
  .crm-seg-card .crm-seg-dot { width: 8px; height: 8px; border-radius: 50%; position: absolute; top: 14px; right: 14px; }
  .crm-seg-dot.crm-dot-green { background: var(--atlas); }
  .crm-seg-dot.crm-dot-gold { background: #D4A017; }
  .crm-seg-dot.crm-dot-blue { background: #3B82F6; }
  .crm-seg-dot.crm-dot-red { background: #EF4444; }
  html[data-theme="dark"] .crm-seg-card { background: var(--paper-soft); }

  /* Guest table */
  .crm-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid var(--n-200); }
  .crm-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .crm-table thead tr { background: var(--paper-soft); }
  .crm-table th { padding: 11px 16px; text-align: start; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--n-500); font-weight: 500; white-space: nowrap; }
  .crm-table td { padding: 12px 16px; border-top: 1px solid var(--n-200); color: var(--ink); vertical-align: middle; }
  .crm-table tbody tr:hover td { background: var(--paper-soft); }
  .crm-table .crm-name { font-weight: 500; }
  .crm-table .crm-mono { font-family: var(--mono); font-feature-settings: "tnum" 1; }
  .crm-table .crm-muted { color: var(--n-500); }
  .crm-table .crm-tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .crm-tag-reg { background: rgba(11,110,79,0.10); color: var(--atlas); }
  .crm-tag-vip { background: rgba(212,160,23,0.12); color: #A07010; }
  .crm-tag-new { background: rgba(59,130,246,0.10); color: #2563EB; }
  .crm-tag-lost { background: rgba(239,68,68,0.10); color: #DC2626; }
  html[data-theme="dark"] .crm-tag-reg { background: rgba(11,110,79,0.22); color: var(--mint); }
  html[data-theme="dark"] .crm-tag-vip { background: rgba(212,160,23,0.22); color: #F0C040; }
  html[data-theme="dark"] .crm-tag-new { background: rgba(59,130,246,0.22); color: #93C5FD; }
  html[data-theme="dark"] .crm-tag-lost { background: rgba(239,68,68,0.22); color: #FCA5A5; }

  /* Composer */
  .crm-composer { background: #fff; border: 1px solid var(--n-200); border-radius: 14px; padding: 20px; }
  html[data-theme="dark"] .crm-composer { background: var(--paper-soft); }
  .crm-channel-chips { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .crm-chip { padding: 7px 16px; border-radius: 20px; border: 1.5px solid var(--n-200); background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 150ms; color: var(--ink); }
  .crm-chip:hover { border-color: var(--atlas); }
  .crm-chip.crm-chip-active { border-color: var(--atlas); background: var(--atlas); color: #fff; }
  html[data-theme="dark"] .crm-chip { background: var(--paper-soft); }
  .crm-template-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .crm-template-row label { font-size: 12.5px; color: var(--n-600); white-space: nowrap; }
  .crm-template-row select { flex: 1; padding: 9px 12px; border: 1px solid var(--n-200); border-radius: 10px; background: #fff; font-family: var(--sans); font-size: 13.5px; color: var(--ink); outline: none; cursor: pointer; }
  .crm-template-row select:focus { border-color: var(--atlas); }
  html[data-theme="dark"] .crm-template-row select { background: var(--paper-soft); border-color: var(--n-200); }
  .crm-preview-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--n-500); margin-bottom: 8px; }
  .crm-bubble-wrap { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .crm-bubble { max-width: 78%; background: var(--atlas); color: #fff; border-radius: 18px 18px 4px 18px; padding: 12px 16px; font-size: 14px; line-height: 1.55; }
  .crm-bubble .crm-bubble-time { font-size: 10.5px; opacity: 0.65; margin-top: 6px; text-align: end; font-family: var(--mono); }
  .crm-stats-row { display: flex; gap: 10px; margin-bottom: 18px; }
  .crm-stat-pill { flex: 1; background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 10px; padding: 11px 14px; }
  .crm-stat-pill .crm-pill-l { font-size: 10.5px; font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--n-500); }
  .crm-stat-pill .crm-pill-v { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin-top: 3px; font-feature-settings: "tnum" 1; color: var(--ink); }
  .crm-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; padding-top: 20px; border-top: 1px solid var(--n-200); }

  /* RTL */
  [dir="rtl"] .crm-table th, [dir="rtl"] .crm-table td { text-align: right; }
  [dir="rtl"] .crm-bubble { border-radius: 18px 18px 18px 4px; }
  [dir="rtl"] .crm-bubble .crm-bubble-time { text-align: start; }
  [dir="rtl"] .crm-footer { justify-content: flex-start; }

  /* Dark overrides */
  html[data-theme="dark"] .crm-table thead tr { background: rgba(255,255,255,0.04); }
  html[data-theme="dark"] .crm-table tbody tr:hover td { background: rgba(255,255,255,0.04); }
  `;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ─── Strings ─── */
  const STR = {
    fr: {
      title: 'Clients & Marketing',
      subtitle: 'Fidélisation · Segmentation · Campagnes',
      secSegments: 'SEGMENTS',
      secGuests: 'CLIENTS RÉGULIERS',
      secComposer: 'COMPOSER UN MESSAGE',
      segReg: 'Réguliers', segRegSub: 'Panier moy. 142 MAD',
      segVip: 'VIP', segVipSub: 'Panier moy. 380 MAD',
      segNew: 'Nouveaux ce mois', segNewSub: 'Acquis en juin',
      segLost: 'À reconquérir', segLostSub: 'Non revenus depuis 30 j',
      colName: 'Client', colVisits: 'Visites', colSpend: 'Total dépensé', colLast: 'Dernière visite', colSeg: 'Segment',
      tagReg: 'Régulier', tagVip: 'VIP', tagNew: 'Nouveau', tagLost: 'À reconquérir',
      chWa: 'WhatsApp', chSms: 'SMS', chEmail: 'Email',
      tplLabel: 'Modèle',
      tplWelcome: 'Mot de bienvenue',
      tplBirthday: 'Anniversaire',
      tplNew: 'Nouveauté à la carte',
      tplOffer: 'Offre -15 %',
      previewLabel: 'APERÇU DU MESSAGE',
      pillAudience: 'AUDIENCE', pillRevenue: 'UPLIFT ESTIMÉ',
      sendBtn: 'Programmer le message',
      closeBtn: 'Fermer',
      toastTitle: 'Message programmé',
      toastDesc: 'Votre campagne sera envoyée dans les 24 h.',
      msgWelcome: 'Bonjour {prénom}, merci de faire partie de la famille Café Atlas. Un café offert à votre prochaine visite, c\'est notre façon de vous dire merci.',
      msgBirthday: 'Joyeux anniversaire {prénom} ! Chez Café Atlas, ce jour est spécial pour nous aussi. Un dessert maison vous attend — à bientôt !',
      msgNew: 'Bonne nouvelle {prénom}, notre carte s\'enrichit ! Nouveaux plats, nouvelles saveurs. On vous attend pour les découvrir en avant-première.',
      msgOffer: 'Offre exclusive pour vous, {prénom} : -15 % sur votre prochaine commande chez Café Atlas. Valable 7 jours — à bientôt !',
    },
    en: {
      title: 'Customers & Marketing',
      subtitle: 'Retention · Segmentation · Campaigns',
      secSegments: 'SEGMENTS',
      secGuests: 'REGULAR GUESTS',
      secComposer: 'COMPOSE A MESSAGE',
      segReg: 'Regulars', segRegSub: 'Avg basket 142 MAD',
      segVip: 'VIP', segVipSub: 'Avg basket 380 MAD',
      segNew: 'New this month', segNewSub: 'Acquired in June',
      segLost: 'To win back', segLostSub: 'Not seen in 30 days',
      colName: 'Guest', colVisits: 'Visits', colSpend: 'Total spent', colLast: 'Last visit', colSeg: 'Segment',
      tagReg: 'Regular', tagVip: 'VIP', tagNew: 'New', tagLost: 'Lapsed',
      chWa: 'WhatsApp', chSms: 'SMS', chEmail: 'Email',
      tplLabel: 'Template',
      tplWelcome: 'Welcome note',
      tplBirthday: 'Birthday',
      tplNew: 'New menu item',
      tplOffer: '-15% offer',
      previewLabel: 'MESSAGE PREVIEW',
      pillAudience: 'AUDIENCE', pillRevenue: 'EST. UPLIFT',
      sendBtn: 'Schedule message',
      closeBtn: 'Close',
      toastTitle: 'Message scheduled',
      toastDesc: 'Your campaign will be sent within 24 hours.',
      msgWelcome: 'Hi {prénom}, thank you for being part of the Café Atlas family. We\'re offering you a complimentary coffee on your next visit — our way of saying thank you.',
      msgBirthday: 'Happy birthday {prénom}! At Café Atlas, today is special for us too. A homemade dessert is waiting for you — see you soon!',
      msgNew: 'Great news {prénom} — our menu just got an upgrade! New dishes, new flavours. Come discover them first.',
      msgOffer: 'Exclusive deal for you, {prénom}: -15% on your next order at Café Atlas. Valid for 7 days — see you soon!',
    },
    ar: {
      title: 'العملاء والتسويق',
      subtitle: 'الولاء · التصنيف · الحملات',
      secSegments: 'الشرائح',
      secGuests: 'الزبائن المنتظمون',
      secComposer: 'إنشاء رسالة',
      segReg: 'منتظمون', segRegSub: 'متوسط السلة 142 درهم',
      segVip: 'VIP', segVipSub: 'متوسط السلة 380 درهم',
      segNew: 'جدد هذا الشهر', segNewSub: 'انضموا في يونيو',
      segLost: 'استعادتهم', segLostSub: 'لم يزوروا منذ 30 يومًا',
      colName: 'الزبون', colVisits: 'الزيارات', colSpend: 'المجموع المنفق', colLast: 'آخر زيارة', colSeg: 'الشريحة',
      tagReg: 'منتظم', tagVip: 'VIP', tagNew: 'جديد', tagLost: 'متوقف',
      chWa: 'واتساب', chSms: 'SMS', chEmail: 'البريد',
      tplLabel: 'النموذج',
      tplWelcome: 'رسالة ترحيب',
      tplBirthday: 'عيد ميلاد',
      tplNew: 'جديد في القائمة',
      tplOffer: 'عرض -15 %',
      previewLabel: 'معاينة الرسالة',
      pillAudience: 'الجمهور', pillRevenue: 'التوقعات',
      sendBtn: 'جدولة الرسالة',
      closeBtn: 'إغلاق',
      toastTitle: 'تمت جدولة الرسالة',
      toastDesc: 'ستُرسل حملتك خلال 24 ساعة.',
      msgWelcome: 'مرحبًا {prénom}، شكرًا لانضمامك إلى عائلة كافيه أطلس. قهوة مجانية تنتظرك في زيارتك القادمة — هذه طريقتنا في قول شكرًا.',
      msgBirthday: 'عيد ميلاد سعيد {prénom}! في كافيه أطلس، هذا اليوم مميز لنا أيضًا. حلوى منزلية تنتظرك — إلى اللقاء!',
      msgNew: 'أخبار رائعة {prénom}، قائمتنا تجددت! أطباق جديدة ونكهات مبتكرة تنتظرك.',
      msgOffer: 'عرض حصري لك {prénom}: خصم 15% على طلبك القادم في كافيه أطلس. صالح لمدة 7 أيام.',
    }
  };

  /* ─── Guest data ─── */
  const GUESTS = [
    { name: 'Nawal K.',   visits: 24, spend: 3408, last: 'il y a 3 j',  seg: 'reg' },
    { name: 'Karim B.',   visits: 19, spend: 2698, last: 'il y a 5 j',  seg: 'reg' },
    { name: 'Salma F.',   visits: 31, spend: 11780, last: 'il y a 2 j', seg: 'vip' },
    { name: 'Mehdi C.',   visits: 8,  spend: 1136, last: 'il y a 12 j', seg: 'new' },
    { name: 'Imane S.',   visits: 22, spend: 3124, last: 'il y a 7 j',  seg: 'reg' },
    { name: 'Youssef A.', visits: 12, spend: 4560, last: 'il y a 41 j', seg: 'lost' },
    { name: 'Hind M.',    visits: 5,  spend: 710,  last: 'il y a 38 j', seg: 'lost' },
    { name: 'Walid F.',   visits: 28, spend: 10640, last: 'il y a 1 j', seg: 'vip' },
  ];

  /* Segment config */
  const SEGS = [
    { id: 'reg',  count: 218, dotCls: 'crm-dot-green', audience: 218, uplift: 4360 },
    { id: 'vip',  count: 34,  dotCls: 'crm-dot-gold',  audience: 34,  uplift: 6800 },
    { id: 'new',  count: 96,  dotCls: 'crm-dot-blue',  audience: 96,  uplift: 2880 },
    { id: 'lost', count: 142, dotCls: 'crm-dot-red',   audience: 142, uplift: 6800 },
  ];

  const TEMPLATES = ['welcome', 'birthday', 'new', 'offer'];

  handlers['growth-crm'] = () => {
    const T = STR[trLang()] || STR.fr;
    const isAr = trLang() === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';

    /* helpers */
    const segLabel = (s) => ({ reg: T.tagReg, vip: T.tagVip, new: T.tagNew, lost: T.tagLost }[s] || s);
    const segTagCls = (s) => ({ reg: 'crm-tag-reg', vip: 'crm-tag-vip', new: 'crm-tag-new', lost: 'crm-tag-lost' }[s] || 'crm-tag-reg');

    const segName = (id) => ({ reg: T.segReg, vip: T.segVip, new: T.segNew, lost: T.segLost }[id]);
    const segSub  = (id) => ({ reg: T.segRegSub, vip: T.segVipSub, new: T.segNewSub, lost: T.segLostSub }[id]);
    const tplMsg  = (k) => ({ welcome: T.msgWelcome, birthday: T.msgBirthday, new: T.msgNew, offer: T.msgOffer }[k] || T.msgWelcome);
    const tplName = (k) => ({ welcome: T.tplWelcome, birthday: T.tplBirthday, new: T.tplNew, offer: T.tplOffer }[k]);

    /* track state */
    let activeSeg = 'lost';
    let activeCh  = 'wa';
    let activeTpl = 'offer';

    /* ── Segment cards ── */
    const segCards = SEGS.map(s => `
      <div class="crm-seg-card${s.id === activeSeg ? ' crm-selected' : ''}" data-crm-seg="${s.id}">
        <span class="crm-seg-dot ${s.dotCls}"></span>
        <div class="crm-seg-count">${fmt(s.count)}</div>
        <div class="crm-seg-label">${segName(s.id)}</div>
        <div class="crm-seg-sub">${segSub(s.id)}</div>
      </div>`).join('');

    /* ── Guest rows ── */
    const guestRows = GUESTS.map(g => `
      <tr>
        <td class="crm-name">${g.name}</td>
        <td class="crm-mono">${g.visits}</td>
        <td class="crm-mono">${fmt(g.spend)} MAD</td>
        <td class="crm-muted">${g.last}</td>
        <td><span class="crm-tag ${segTagCls(g.seg)}">${segLabel(g.seg)}</span></td>
      </tr>`).join('');

    /* ── Channel chips ── */
    const chipsHtml = () => ['wa', 'sms', 'email'].map(ch => `
      <button class="crm-chip${activeCh === ch ? ' crm-chip-active' : ''}" data-crm-ch="${ch}">
        ${ch === 'wa' ? T.chWa : ch === 'sms' ? T.chSms : T.chEmail}
      </button>`).join('');

    /* ── Template select ── */
    const tplOpts = () => TEMPLATES.map(k => `<option value="${k}"${k === activeTpl ? ' selected' : ''}>${tplName(k)}</option>`).join('');

    /* ── Audience & uplift for active segment ── */
    const segData = () => SEGS.find(s => s.id === activeSeg) || SEGS[3];

    /* ── Message bubble ── */
    const bubbleMsg = () => tplMsg(activeTpl).replace('{prénom}', isAr ? 'سمية' : 'Samia');

    /* ── Composer block (re-rendered on interaction) ── */
    const composerInner = () => {
      const sd = segData();
      return `
        <div class="crm-channel-chips">${chipsHtml()}</div>
        <div class="crm-template-row">
          <label for="crm-tpl-sel">${T.tplLabel}</label>
          <select id="crm-tpl-sel" data-crm-tpl-select>
            ${tplOpts()}
          </select>
        </div>
        <div class="crm-preview-label">${T.previewLabel}</div>
        <div class="crm-bubble-wrap">
          <div class="crm-bubble">
            <span id="crm-bubble-text">${bubbleMsg()}</span>
            <div class="crm-bubble-time">14:22</div>
          </div>
        </div>
        <div class="crm-stats-row">
          <div class="crm-stat-pill">
            <div class="crm-pill-l">${T.pillAudience}</div>
            <div class="crm-pill-v" id="crm-audience">${fmt(sd.audience)} clients</div>
          </div>
          <div class="crm-stat-pill">
            <div class="crm-pill-l">${T.pillRevenue}</div>
            <div class="crm-pill-v" id="crm-uplift">≈ ${fmt(sd.uplift)} MAD</div>
          </div>
        </div>
        <button class="kb atlas" data-crm-send>${T.sendBtn}</button>`;
    };

    /* ── Full drawer body ── */
    const body = `
      <div class="crm-wrap" dir="${dir}">

        <!-- 1. Segments -->
        <section>
          <div class="crm-section-label">${T.secSegments}</div>
          <div class="crm-segments" id="crm-seg-grid">${segCards}</div>
        </section>

        <!-- 2. Guest list -->
        <section>
          <div class="crm-section-label">${T.secGuests}</div>
          <div class="crm-table-wrap">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>${T.colName}</th>
                  <th>${T.colVisits}</th>
                  <th>${T.colSpend}</th>
                  <th>${T.colLast}</th>
                  <th>${T.colSeg}</th>
                </tr>
              </thead>
              <tbody>${guestRows}</tbody>
            </table>
          </div>
        </section>

        <!-- 3. Composer -->
        <section>
          <div class="crm-section-label">${T.secComposer}</div>
          <div class="crm-composer" id="crm-composer">${composerInner()}</div>
        </section>

        <!-- Footer -->
        <div class="crm-footer">
          <button class="kb ghost" data-dismiss>${T.closeBtn}</button>
        </div>

      </div>`;

    const d = drawer({ title: T.title, subtitle: T.subtitle, fullpage: true, body });

    /* ── Event delegation ── */
    d.el.addEventListener('click', (e) => {
      /* close */
      if (e.target.closest('[data-dismiss]')) { d.close(); return; }

      /* segment card */
      const segCard = e.target.closest('[data-crm-seg]');
      if (segCard) {
        activeSeg = segCard.dataset.crmSeg;
        d.el.querySelectorAll('.crm-seg-card').forEach(c => {
          c.classList.toggle('crm-selected', c.dataset.crmSeg === activeSeg);
        });
        const comp = d.el.querySelector('#crm-composer');
        if (comp) comp.innerHTML = composerInner();
        attachSelectListener(d.el);
        return;
      }

      /* channel chip */
      const chip = e.target.closest('[data-crm-ch]');
      if (chip) {
        activeCh = chip.dataset.crmCh;
        d.el.querySelectorAll('.crm-chip').forEach(c => {
          c.classList.toggle('crm-chip-active', c.dataset.crmCh === activeCh);
        });
        return;
      }

      /* send */
      if (e.target.closest('[data-crm-send]')) {
        confetti && confetti();
        toast(T.toastTitle, { desc: T.toastDesc, type: 'success' });
        return;
      }
    });

    /* template select change */
    const attachSelectListener = (root) => {
      const sel = root.querySelector('[data-crm-tpl-select]');
      if (!sel) return;
      sel.addEventListener('change', () => {
        activeTpl = sel.value;
        const bt = root.querySelector('#crm-bubble-text');
        if (bt) bt.textContent = bubbleMsg();
      });
    };
    attachSelectListener(d.el);
  };

})();
