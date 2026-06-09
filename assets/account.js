/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · ACCOUNT — the profile-menu destinations as real full .app pages.
 *
 * "Mon profil", "Facturation" and "Centre d'aide" used to be toast stubs. They
 * now open as full pages via Kiwi.appPage() (same format as every sidebar
 * destination), each with genuinely useful, data-driven content. Trilingual.
 * ─────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const Kiwi = window.Kiwi;
  if (!Kiwi) return;
  const handlers = Kiwi.handlers;
  const lang = () => (window.KiwiI18n && window.KiwiI18n.getLang && window.KiwiI18n.getLang()) || 'fr';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pick = (o) => (o && (o[lang()] != null ? o[lang()] : o.fr)) || '';

  /* Account owner (demo). A real build would hydrate these from the session. */
  const OWNER = { name: 'Rachid Benhima', initials: 'RB', email: 'rachid@cafeatlas.ma', phone: '+212 6 61 24 88 03' };
  const PLAN = { name: 'Kiwi Pro', price: '399 MAD', cycle: pick({ fr: '/mois', en: '/mo', ar: '/شهر' }) };

  /* ── one-time styles (token-based → light/dark correct) ─────────────────── */
  (function injectCss() {
    const css = `
      .acc-hero { display:flex; align-items:center; gap:16px; padding:20px; border-radius:16px; background:linear-gradient(150deg,#0c4a35,#08311f); color:#fff; margin-bottom:18px; }
      .acc-avatar { width:60px; height:60px; border-radius:50%; background:var(--mint); color:#06371f; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; flex-shrink:0; }
      .acc-hero-name { font-size:20px; font-weight:600; letter-spacing:-0.02em; }
      .acc-hero-role { font-size:12.5px; color:rgba(255,255,255,0.72); margin-top:3px; }
      .acc-hero .acc-cta { margin-inline-start:auto; }
      .acc-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
      @media (max-width:820px){ .acc-grid { grid-template-columns:1fr; } }
      .acc-card { border:1px solid var(--n-200); border-radius:14px; padding:16px 18px; background:var(--surface); }
      .acc-card.span2 { grid-column:1 / -1; }
      .acc-eyebrow { font-family:var(--mono); font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--n-500); margin-bottom:12px; }
      .acc-row { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:8px 0; border-bottom:1px solid var(--n-100); font-size:13.5px; }
      .acc-row:last-child { border-bottom:0; }
      .acc-row > span { color:var(--n-500); }
      .acc-row > b { font-weight:600; color:var(--ink); }
      .acc-row .ok { color:var(--success); }
      .acc-row a { color:var(--atlas); font-weight:600; cursor:pointer; }
      .acc-chips { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }
      .acc-chip { font-size:11px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--mint-soft); color:var(--atlas); }
      .acc-venue { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--n-100); font-size:13.5px; }
      .acc-venue:last-child { border-bottom:0; }
      .acc-venue b { font-weight:600; } .acc-venue span { color:var(--n-500); font-size:12px; }
      .acc-cta { background:var(--atlas); color:#fff; border:0; border-radius:9px; padding:9px 16px; font-size:12.5px; font-weight:600; font-family:var(--sans); cursor:pointer; }
      .acc-cta.ghost { background:transparent; color:var(--ink); border:1px solid var(--n-300); }
      .acc-cta.light { background:#fff; color:#08311f; }
      .acc-cta:hover { filter:brightness(1.06); }
      .acc-plan { display:flex; align-items:center; gap:18px; padding:22px; border-radius:16px; background:linear-gradient(150deg,#0c4a35,#08311f); color:#fff; margin-bottom:16px; flex-wrap:wrap; }
      .acc-plan-price { font-size:30px; font-weight:600; letter-spacing:-0.02em; }
      .acc-plan-price small { font-size:14px; font-weight:400; opacity:0.7; }
      .acc-plan-name { font-family:var(--mono); font-size:11px; letter-spacing:0.1em; color:rgba(255,255,255,0.7); }
      .acc-plan-meta { font-size:12.5px; color:rgba(255,255,255,0.8); margin-top:4px; }
      .acc-plan-acts { margin-inline-start:auto; display:flex; gap:10px; flex-wrap:wrap; }
      .acc-tbl { width:100%; border-collapse:collapse; font-size:13px; }
      .acc-tbl th { text-align:start; font-family:var(--mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--n-500); padding:8px 6px; border-bottom:1px solid var(--n-200); font-weight:500; }
      .acc-tbl td { padding:11px 6px; border-bottom:1px solid var(--n-100); }
      .acc-tbl tr:last-child td { border-bottom:0; }
      .acc-paid { font-size:11px; font-weight:600; color:var(--success); }
      .acc-dl { color:var(--atlas); font-weight:600; cursor:pointer; }
      .acc-search { width:100%; padding:13px 16px; border:1px solid var(--n-200); border-radius:12px; background:var(--surface); color:var(--ink); font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; margin-bottom:18px; }
      .acc-search:focus { border-color:var(--atlas); }
      .acc-contact { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
      @media (max-width:820px){ .acc-contact { grid-template-columns:1fr; } }
      .acc-contact-card { border:1px solid var(--n-200); border-radius:14px; padding:16px; background:var(--surface); cursor:pointer; transition:border-color 130ms; }
      .acc-contact-card:hover { border-color:var(--atlas); }
      .acc-contact-card .t { font-weight:600; font-size:14px; margin-bottom:3px; }
      .acc-contact-card .d { font-size:12px; color:var(--n-500); }
      .acc-topics { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
      @media (max-width:820px){ .acc-topics { grid-template-columns:1fr; } }
      .acc-topic { display:flex; justify-content:space-between; align-items:center; border:1px solid var(--n-200); border-radius:12px; padding:14px 16px; background:var(--surface); cursor:pointer; transition:border-color 130ms; }
      .acc-topic:hover { border-color:var(--atlas); }
      .acc-topic b { font-weight:600; font-size:13.5px; } .acc-topic span { color:var(--n-500); font-size:12px; }
      .acc-status { display:flex; align-items:center; gap:9px; margin-top:18px; padding:13px 16px; border-radius:12px; background:var(--mint-soft); font-size:13px; color:var(--ink); }
      .acc-status .dot { width:8px; height:8px; border-radius:50%; background:var(--success); flex-shrink:0; }
      .acc-sec-title { font-size:14px; font-weight:600; margin:22px 0 12px; }`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  })();

  const getSet = (k, def) => { try { return localStorage.getItem('kiwiSet:' + k) || def; } catch (_) { return def; } };
  const ownerName = () => getSet('ownerName', OWNER.name);
  const ownerEmail = () => getSet('ownerEmail', OWNER.email);
  const ownerPhone = () => getSet('ownerPhone', OWNER.phone);

  /* ════════════════════════════ MON PROFIL ════════════════════════════ */
  function openProfile() {
    const T = {
      title: pick({ fr: 'Mon profil', en: 'My profile', ar: 'ملفي الشخصي' }),
      sub: pick({ fr: 'Compte propriétaire · Café Atlas', en: 'Owner account · Café Atlas', ar: 'حساب المالك · مقهى أطلس' }),
      role: pick({ fr: 'Propriétaire · admin · membre depuis mars 2025', en: 'Owner · admin · member since March 2025', ar: 'مالك · مشرف · عضو منذ مارس 2025' }),
      edit: pick({ fr: 'Modifier', en: 'Edit', ar: 'تعديل' }),
      contact: pick({ fr: 'Coordonnées', en: 'Contact', ar: 'بيانات الاتصال' }),
      email: pick({ fr: 'Email', en: 'Email', ar: 'البريد الإلكتروني' }),
      phone: pick({ fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' }),
      language: pick({ fr: 'Langue', en: 'Language', ar: 'اللغة' }),
      langVal: pick({ fr: 'Français', en: 'English', ar: 'العربية' }),
      security: pick({ fr: 'Sécurité', en: 'Security', ar: 'الأمان' }),
      twofa: pick({ fr: 'Authentification 2FA', en: 'Two-factor auth', ar: 'المصادقة الثنائية' }),
      smsOn: pick({ fr: 'SMS activé', en: 'SMS enabled', ar: 'الرسائل مُفعّلة' }),
      lastLogin: pick({ fr: 'Dernière connexion', en: 'Last sign-in', ar: 'آخر تسجيل دخول' }),
      today: pick({ fr: "Aujourd'hui · 08:12", en: 'Today · 08:12', ar: 'اليوم · 08:12' }),
      password: pick({ fr: 'Mot de passe', en: 'Password', ar: 'كلمة المرور' }),
      change: pick({ fr: 'Modifier', en: 'Change', ar: 'تغيير' }),
      roleAccess: pick({ fr: 'Rôle & accès', en: 'Role & access', ar: 'الدور والصلاحيات' }),
      roleDesc: pick({ fr: 'Propriétaire — accès complet à toutes les fonctionnalités du compte.', en: 'Owner — full access to every feature on the account.', ar: 'مالك — وصول كامل إلى جميع ميزات الحساب.' }),
      venues: pick({ fr: 'Établissements', en: 'Venues', ar: 'المؤسسات' }),
      principal: pick({ fr: 'Principal', en: 'Primary', ar: 'الرئيسي' }),
      pwToast: pick({ fr: 'Un lien de changement de mot de passe a été envoyé par SMS.', en: 'A password-change link was sent by SMS.', ar: 'تم إرسال رابط تغيير كلمة المرور عبر الرسائل القصيرة.' }),
    };
    const perms = pick({
      fr: ['Caisse', 'Finances', 'Équipe', 'Stock', 'Conformité', 'Paramètres', 'Facturation'],
      en: ['Register', 'Finances', 'Team', 'Stock', 'Compliance', 'Settings', 'Billing'],
      ar: ['الصندوق', 'المالية', 'الفريق', 'المخزون', 'المطابقة', 'الإعدادات', 'الفواتير'],
    });
    const row = (k, v) => `<div class="acc-row"><span>${esc(k)}</span><b>${v}</b></div>`;
    Kiwi.appPage('account-profile', {
      title: T.title, subtitle: T.sub,
      body: `
        <div class="acc-hero">
          <div class="acc-avatar">${esc(OWNER.initials)}</div>
          <div><div class="acc-hero-name">${esc(ownerName())}</div><div class="acc-hero-role">${esc(T.role)}</div></div>
          <button class="acc-cta light" data-action="account-edit-profile">${esc(T.edit)}</button>
        </div>
        <div class="acc-grid">
          <div class="acc-card">
            <div class="acc-eyebrow">${esc(T.contact)}</div>
            ${row(T.email, esc(ownerEmail()))}
            ${row(T.phone, esc(ownerPhone()))}
            ${row(T.language, esc(T.langVal))}
          </div>
          <div class="acc-card">
            <div class="acc-eyebrow">${esc(T.security)}</div>
            <div class="acc-row"><span>${esc(T.twofa)}</span><b class="ok">${esc(T.smsOn)}</b></div>
            ${row(T.lastLogin, esc(T.today))}
            <div class="acc-row"><span>${esc(T.password)}</span><a data-action="account-change-pw">${esc(T.change)}</a></div>
          </div>
          <div class="acc-card span2">
            <div class="acc-eyebrow">${esc(T.roleAccess)}</div>
            <p style="font-size:13.5px; color:var(--n-600); margin:0;">${esc(T.roleDesc)}</p>
            <div class="acc-chips">${perms.map((p) => `<span class="acc-chip">${esc(p)}</span>`).join('')}</div>
          </div>
          <div class="acc-card span2">
            <div class="acc-eyebrow">${esc(T.venues)}</div>
            <div class="acc-venue"><b>Café Atlas · Maarif</b><span>${esc(T.principal)} · Casablanca</span></div>
            <div class="acc-venue"><b>Maison Mansour</b><span>Casablanca</span></div>
            <div class="acc-venue"><b>Spa Bahia</b><span>Marrakech</span></div>
          </div>
        </div>`,
    });
    handlers['account-change-pw'] = () => Kiwi.toast(T.pwToast, { type: 'success', force: true });
  }

  /* ════════════════════════════ FACTURATION ════════════════════════════ */
  function openBilling() {
    const T = {
      title: pick({ fr: 'Facturation', en: 'Billing', ar: 'الفواتير' }),
      sub: pick({ fr: 'Abonnement & factures · Café Atlas', en: 'Subscription & invoices · Café Atlas', ar: 'الاشتراك والفواتير · مقهى أطلس' }),
      current: pick({ fr: 'VOTRE FORMULE', en: 'YOUR PLAN', ar: 'باقتك' }),
      nextDue: pick({ fr: 'Prochaine échéance : 1 juillet 2026', en: 'Next charge: 1 July 2026', ar: 'الاستحقاق القادم: 1 يوليو 2026' }),
      changePlan: pick({ fr: 'Changer de plan', en: 'Change plan', ar: 'تغيير الباقة' }),
      goUltra: pick({ fr: 'Passer à Ultra →', en: 'Upgrade to Ultra →', ar: 'الترقية إلى Ultra ←' }),
      payMethod: pick({ fr: 'Méthode de paiement', en: 'Payment method', ar: 'طريقة الدفع' }),
      card: pick({ fr: 'Visa •• 4291 · prélèvement le 1er du mois', en: 'Visa •• 4291 · charged on the 1st', ar: 'فيزا •• 4291 · الخصم يوم 1' }),
      update: pick({ fr: 'Mettre à jour', en: 'Update', ar: 'تحديث' }),
      usage: pick({ fr: 'Utilisation', en: 'Usage', ar: 'الاستخدام' }),
      terminals: pick({ fr: 'Terminaux', en: 'Terminals', ar: 'الطرفيات' }),
      venues: pick({ fr: 'Établissements', en: 'Venues', ar: 'المؤسسات' }),
      team: pick({ fr: "Membres d'équipe", en: 'Team members', ar: 'أعضاء الفريق' }),
      included: pick({ fr: 'Inclus dans Kiwi Pro', en: 'Included in Kiwi Pro', ar: 'مشمول في Kiwi Pro' }),
      history: pick({ fr: 'Historique des factures', en: 'Invoice history', ar: 'سجل الفواتير' }),
      period: pick({ fr: 'Période', en: 'Period', ar: 'الفترة' }),
      amount: pick({ fr: 'Montant', en: 'Amount', ar: 'المبلغ' }),
      status: pick({ fr: 'Statut', en: 'Status', ar: 'الحالة' }),
      invoice: pick({ fr: 'Facture', en: 'Invoice', ar: 'الفاتورة' }),
      paid: pick({ fr: 'Payée', en: 'Paid', ar: 'مدفوعة' }),
      pdf: pick({ fr: 'PDF', en: 'PDF', ar: 'PDF' }),
      dlToast: pick({ fr: 'Facture téléchargée (PDF)', en: 'Invoice downloaded (PDF)', ar: 'تم تنزيل الفاتورة (PDF)' }),
      payToast: pick({ fr: 'Pour des raisons de sécurité, mettez à jour votre carte depuis l\'app bancaire.', en: 'For security, update your card from your banking app.', ar: 'لأسباب أمنية، حدّث بطاقتك من تطبيق البنك.' }),
    };
    const incl = pick({
      fr: ['Caisse complète multi-vertical', '1 caisse Kiwi offerte', 'Règlement T+1 garanti', "Jusqu'à 8 membres d'équipe", 'Maintenance & remplacement matériel', 'Support WhatsApp 7j/7'],
      en: ['Full multi-vertical register', '1 free Kiwi cashier', 'Guaranteed T+1 settlement', 'Up to 8 team members', 'Hardware maintenance & replacement', '7-day WhatsApp support'],
      ar: ['صندوق كامل متعدد الأنشطة', 'صندوق كيوي مجاني', 'تسوية T+1 مضمونة', 'حتى 8 أعضاء فريق', 'صيانة واستبدال العتاد', 'دعم واتساب 7/7'],
    });
    const months = pick({
      fr: ['Mai 2026', 'Avril 2026', 'Mars 2026', 'Février 2026', 'Janvier 2026', 'Décembre 2025'],
      en: ['May 2026', 'April 2026', 'March 2026', 'February 2026', 'January 2026', 'December 2025'],
      ar: ['ماي 2026', 'أبريل 2026', 'مارس 2026', 'فبراير 2026', 'يناير 2026', 'دجنبر 2025'],
    });
    Kiwi.appPage('account-billing', {
      title: T.title, subtitle: T.sub,
      body: `
        <div class="acc-plan">
          <div>
            <div class="acc-plan-name">${esc(T.current)}</div>
            <div class="acc-plan-price">${esc(PLAN.name)} · 399 MAD<small>${esc(PLAN.cycle)}</small></div>
            <div class="acc-plan-meta">${esc(T.nextDue)}</div>
          </div>
          <div class="acc-plan-acts">
            <button class="acc-cta light" data-action="upgrade-pro">${esc(T.changePlan)}</button>
            <button class="acc-cta ghost" style="color:#fff;border-color:rgba(255,255,255,0.4);" data-action="upgrade-pro">${esc(T.goUltra)}</button>
          </div>
        </div>
        <div class="acc-grid">
          <div class="acc-card">
            <div class="acc-eyebrow">${esc(T.payMethod)}</div>
            <p style="font-size:13.5px; margin:0 0 12px;">${esc(T.card)}</p>
            <button class="acc-cta ghost" data-action="account-update-card">${esc(T.update)}</button>
          </div>
          <div class="acc-card">
            <div class="acc-eyebrow">${esc(T.usage)}</div>
            <div class="acc-row"><span>${esc(T.terminals)}</span><b>4</b></div>
            <div class="acc-row"><span>${esc(T.venues)}</span><b>3</b></div>
            <div class="acc-row"><span>${esc(T.team)}</span><b>15</b></div>
          </div>
        </div>
        <div class="acc-sec-title">${esc(T.included)}</div>
        <div class="acc-card span2"><div class="acc-chips">${incl.map((i) => `<span class="acc-chip">${esc(i)}</span>`).join('')}</div></div>
        <div class="acc-sec-title">${esc(T.history)}</div>
        <div class="acc-card span2">
          <table class="acc-tbl">
            <thead><tr><th>${esc(T.period)}</th><th>${esc(T.amount)}</th><th>${esc(T.status)}</th><th>${esc(T.invoice)}</th></tr></thead>
            <tbody>${months.map((m) => `<tr><td>${esc(m)}</td><td>399 MAD</td><td><span class="acc-paid">✓ ${esc(T.paid)}</span></td><td><a class="acc-dl" data-action="account-dl-invoice">${esc(T.pdf)}</a></td></tr>`).join('')}</tbody>
          </table>
        </div>`,
    });
    handlers['account-dl-invoice'] = () => Kiwi.toast(T.dlToast, { type: 'success', force: true });
    handlers['account-update-card'] = () => Kiwi.toast(T.payToast, { type: 'info', force: true });
  }

  /* ════════════════════════════ CENTRE D'AIDE ════════════════════════════ */
  function openHelp() {
    const T = {
      title: pick({ fr: "Centre d'aide", en: 'Help centre', ar: 'مركز المساعدة' }),
      sub: pick({ fr: 'Support · guides · état du système', en: 'Support · guides · system status', ar: 'الدعم · الأدلة · حالة النظام' }),
      search: pick({ fr: 'Rechercher dans l\'aide…', en: 'Search help…', ar: 'ابحث في المساعدة…' }),
      waT: pick({ fr: 'WhatsApp', en: 'WhatsApp', ar: 'واتساب' }),
      waD: pick({ fr: 'Réponse < 5 min · 7j/7', en: 'Reply < 5 min · 7 days', ar: 'رد خلال 5 دقائق · 7/7' }),
      mailT: pick({ fr: 'Email', en: 'Email', ar: 'البريد' }),
      mailD: 'support@kiwi.ma',
      phoneT: pick({ fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' }),
      phoneD: '+212 5 39 00 12 00',
      topics: pick({ fr: 'Sujets populaires', en: 'Popular topics', ar: 'مواضيع شائعة' }),
      guides: pick({ fr: 'Guides récents', en: 'Recent guides', ar: 'أدلة حديثة' }),
      statusT: pick({ fr: 'Kiwi Status · 99,99 % opérationnel · aucun incident', en: 'Kiwi Status · 99.99% operational · no incident', ar: 'حالة كيوي · 99.99٪ تعمل · لا أعطال' }),
      open: pick({ fr: 'Ouvrir le chat WhatsApp', en: 'Open WhatsApp chat', ar: 'فتح محادثة واتساب' }),
    };
    const topics = pick({
      fr: [['Démarrer avec Kiwi', '6 articles'], ['Caisse & encaissement', '9 articles'], ['Matériel & terminaux', '5 articles'], ['Équipe & accès', '4 articles'], ['Stock & fournisseurs', '7 articles'], ['Facturation & abonnement', '3 articles']],
      en: [['Getting started', '6 articles'], ['Register & payments', '9 articles'], ['Hardware & terminals', '5 articles'], ['Team & access', '4 articles'], ['Stock & suppliers', '7 articles'], ['Billing & subscription', '3 articles']],
      ar: [['البدء مع كيوي', '6 مقالات'], ['الصندوق والتحصيل', '9 مقالات'], ['العتاد والطرفيات', '5 مقالات'], ['الفريق والصلاحيات', '4 مقالات'], ['المخزون والموردون', '7 مقالات'], ['الفواتير والاشتراك', '3 مقالات']],
    });
    const guides = pick({
      fr: ['Configurer le plan de salle en 5 minutes', 'Router les commandes vers le bon écran cuisine', 'Clôturer la caisse et générer le rapport Z'],
      en: ['Set up your floor plan in 5 minutes', 'Route orders to the right kitchen screen', 'Close the register and generate the Z report'],
      ar: ['إعداد مخطط القاعة في 5 دقائق', 'توجيه الطلبات إلى شاشة المطبخ الصحيحة', 'إغلاق الصندوق وإنشاء تقرير Z'],
    });
    Kiwi.appPage('account-help', {
      title: T.title, subtitle: T.sub,
      body: `
        <input class="acc-search" type="search" placeholder="${esc(T.search)}" data-action="" aria-label="${esc(T.search)}"/>
        <div class="acc-contact">
          <div class="acc-contact-card" data-action="help-whatsapp"><div class="t">${esc(T.waT)}</div><div class="d">${esc(T.waD)}</div></div>
          <div class="acc-contact-card" data-action="account-help-mail"><div class="t">${esc(T.mailT)}</div><div class="d">${esc(T.mailD)}</div></div>
          <div class="acc-contact-card" data-action="account-help-phone"><div class="t">${esc(T.phoneT)}</div><div class="d">${esc(T.phoneD)}</div></div>
        </div>
        <div class="acc-sec-title">${esc(T.topics)}</div>
        <div class="acc-topics">
          ${topics.map(([t, n]) => `<div class="acc-topic" data-action="account-help-topic"><b>${esc(t)}</b><span>${esc(n)} →</span></div>`).join('')}
        </div>
        <div class="acc-sec-title">${esc(T.guides)}</div>
        <div class="acc-card span2">
          ${guides.map((g) => `<div class="acc-venue" style="cursor:pointer;" data-action="account-help-topic"><b>${esc(g)}</b><span>→</span></div>`).join('')}
        </div>
        <div class="acc-status"><span class="dot"></span>${esc(T.statusT)}</div>`,
    });
    handlers['account-help-mail'] = () => Kiwi.toast(T.mailD, { type: 'info', force: true });
    handlers['account-help-phone'] = () => Kiwi.toast(T.phoneD, { type: 'info', force: true });
    handlers['account-help-topic'] = () => Kiwi.toast(pick({ fr: 'Article ouvert · help.kiwi.ma', en: 'Article opened · help.kiwi.ma', ar: 'تم فتح المقال · help.kiwi.ma' }), { type: 'info', force: true });
  }

  /* ── Edit-profile modal (persists to kiwiSet:* like the Settings editors) ── */
  function editProfile() {
    const fld = 'width:100%;padding:11px 13px;border:1px solid var(--n-200);border-radius:10px;font-family:var(--sans);font-size:14px;color:var(--ink);background:var(--surface);outline:none;box-sizing:border-box;';
    const lbl = 'display:block;font-size:12px;font-weight:500;color:var(--n-600);margin:16px 0 6px;';
    const L = (k) => pick(k);
    const fields = [
      { k: 'ownerName', label: L({ fr: 'Nom complet', en: 'Full name', ar: 'الاسم الكامل' }), cur: ownerName() },
      { k: 'ownerEmail', label: L({ fr: 'Email', en: 'Email', ar: 'البريد الإلكتروني' }), cur: ownerEmail() },
      { k: 'ownerPhone', label: L({ fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' }), cur: ownerPhone() },
    ];
    const m = Kiwi.modal({
      tag: pick({ fr: 'PROFIL', en: 'PROFILE', ar: 'الملف' }),
      title: L({ fr: 'Modifier mon profil', en: 'Edit my profile', ar: 'تعديل ملفي' }),
      width: 460,
      body: '<style>.acc-f:focus{border-color:var(--atlas)!important;}</style>' + fields.map((f, i) =>
        `<label style="${lbl}${i === 0 ? 'margin-top:2px;' : ''}">${esc(f.label)}</label><input class="acc-f" data-f="${f.k}" maxlength="60" style="${fld}"/>`).join(''),
      foot: `<button class="kb atlas" data-save type="button" style="width:100%;justify-content:center;padding:12px;font-size:15px;">${esc(L({ fr: 'Enregistrer', en: 'Save', ar: 'حفظ' }))}</button>`,
    });
    fields.forEach((f) => { m.el.querySelector(`[data-f="${f.k}"]`).value = f.cur; });
    setTimeout(() => { const a = m.el.querySelector('.acc-f'); if (a) a.focus(); }, 320);
    m.el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-save]')) return;
      fields.forEach((f) => { const v = (m.el.querySelector(`[data-f="${f.k}"]`).value || '').trim(); if (v) { try { localStorage.setItem('kiwiSet:' + f.k, v); } catch (_) {} } });
      m.close();
      setTimeout(() => openProfile(), 80);
      Kiwi.toast(pick({ fr: 'Profil mis à jour', en: 'Profile updated', ar: 'تم تحديث الملف' }), { type: 'success', force: true });
    });
  }

  handlers['account-profile'] = openProfile;
  handlers['account-billing'] = openBilling;
  handlers['account-help'] = openHelp;
  handlers['account-edit-profile'] = editProfile;
})();
