/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · ÉQUIPE — team & profile management page (sidebar destination)
 *
 * Replaces the prior shift-timeline focused Équipe drawer. The page is now
 * scoped exclusively to:
 *
 *   1. PROFILS    — add / view / edit / delete team members. Every employee
 *                   attribute lives here (identity, contact, password, role,
 *                   contract, base salary, hourly rate, languages, ID, address,
 *                   emergency contact, notes).
 *   2. HEURES     — period-bound hours-worked data entry (this/quinzaine/
 *                   month/custom). Feeds Paie & Planning. Quick-entry modal,
 *                   period validation, CSV export.
 *   3. RÔLES      — venue-type-aware function & department catalogue. A
 *                   restaurant owner never sees "Masseur"; a pharmacy never
 *                   sees "Serveur". Reactive — switching the venue refreshes
 *                   all dropdowns; selections kept when still valid.
 *
 * Shift PLANNING (week grid, double / morning / evening tags, gap alerts,
 * tip distribution, payslips) lives on Paie & Planning — this page never
 * duplicates that.
 *
 * State is in-memory (window.__kiwiTeamV2) and wipes on page reload, per
 * brief. All buttons route through Kiwi.handlers (delegated via interactive.js).
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (!window.Kiwi || !window.Kiwi.handlers) return;
  const Kiwi = window.Kiwi;
  const { handlers, drawer, modal, toast } = Kiwi;

  /* ═══════════════ i18n — local pack ═══════════════ */
  const trLang = () => (window.KiwiI18n?.getLang?.() || 'fr');
  const STR = {
    fr: {
      title: 'Équipe & profils',
      sub: (name, n) => `${name} · ${n} membres · gestion centrale des comptes employés`,
      // Tabs
      tabProfiles: 'Profils',
      tabHours:    'Heures travaillées',
      // Profiles header
      countTotal: 'membres',
      addMember: 'Ajouter un membre',
      searchPh:  'Rechercher un nom, un poste, un département…',
      filterAll: 'Tous',
      filterDept: 'Département',
      filterContract: 'Type de contrat',
      filterLang: 'Langue',
      noMatch: 'Aucun membre ne correspond aux filtres.',
      // Member card
      viewProfile: 'Voir le profil',
      // Profile drawer
      profileSub: (role, dept) => `${role} · ${dept}`,
      editBtn:   'Modifier',
      deleteBtn: 'Supprimer',
      // Sections
      secIdentity:    'Identité',
      secContact:     'Contact',
      secAccess:      'Accès Kiwi Caisse',
      secRole:        'Rôle & affectation',
      secContract:    'Contrat',
      secComp:        'Rémunération',
      secSkills:      'Compétences',
      secEmergency:   "Contact d'urgence",
      secNotes:       'Notes',
      // Field labels
      firstName: 'Prénom',
      lastName:  'Nom',
      email:     'Email',
      phone:     'Téléphone',
      password:  'Mot de passe',
      generate:  'Générer',
      copy:      'Copier',
      function:  'Fonction',
      department:'Département',
      contractType: 'Type de contrat',
      startDate: 'Date de début',
      endDate:   'Date de fin',
      baseSalary:'Salaire de base · MAD / mois',
      hourlyRate:'Taux horaire · MAD / heure',
      languages: 'Langues parlées',
      address:   'Adresse',
      cin:       "CIN (carte d'identité nationale)",
      emergencyName:  "Nom du contact",
      emergencyPhone: 'Téléphone du contact',
      notes:     'Notes libres',
      // Contract types
      ctCdi: 'CDI', ctCdd: 'CDD', ctStage: 'Stage', ctFreelance: 'Freelance', ctInterim: 'Intérim',
      // Languages
      langFr: 'Français', langAr: 'Arabe', langEn: 'Anglais', langEs: 'Espagnol', langTz: 'Tamazight', langDr: 'Darija',
      // Add / edit modal
      addTitle:  'Nouveau membre',
      editTitle: 'Modifier le membre',
      photoLabel:'Photo',
      uploadPhoto:'Téléverser une photo',
      placeholder: { firstName: 'Sara', lastName: 'Belkadi', email: 'sara@kiwi.ma', phone: '6XX XX XX XX', address: 'Rue 12, Maarif, Casablanca', cin: 'BK 384721', emergencyName: 'Karim Belkadi', emergencyPhone: '6XX XX XX XX', notes: 'Allergie crustacés · disponibilité étendue le week-end' },
      // Validation
      vRequired: 'Prénom, nom et fonction requis',
      vInvalidEmail: 'Email invalide',
      vEndAfterStart: "La date de fin doit être après la date de début",
      // Submit / actions
      submitAdd:  'Ajouter le membre',
      submitEdit: 'Enregistrer les modifications',
      cancel: 'Annuler',
      // Confirmation deletes
      delTitle: 'Supprimer ce membre ?',
      delDesc:  'Action irréversible. Le compte Kiwi Caisse sera désactivé immédiatement.',
      delConfirm: 'Supprimer',
      // Toasts
      tAdded:    (n) => `${n} ajouté·e à l'équipe`,
      tAddedDesc:(p) => `Identifiants envoyés · mot de passe ${p}`,
      tUpdated:  (n) => `${n} · profil mis à jour`,
      tDeleted:  (n) => `${n} a été retiré·e de l'équipe`,
      tPwdCopied:'Mot de passe copié',
      tPwdGen:   'Nouveau mot de passe généré',
      // Hours tab
      hPeriodWeek: 'Cette semaine',
      hPeriodFort: 'Quinzaine',
      hPeriodMonth:'Ce mois',
      hPeriodCustom:'Personnalisé',
      hQuickEntry:'Saisie rapide',
      hExport:    'Exporter CSV',
      hImport:    'Importer CSV',
      hValidate:  'Valider la période',
      hMember:    'Membre',
      hTotal:     'Total heures',
      hPay:       'Salaire calculé',
      hLocked:    'Période verrouillée',
      hPeriodLabel: (start, end) => `Du ${start} au ${end}`,
      hSelfSum:   (h, mad) => `${h} h · ${mad} MAD`,
      hFooterLabel: 'Total période',
      // Quick-entry modal
      qeTitle: 'Saisie rapide · heures',
      qeMember:'Membre',
      qeDate:  'Date',
      qeHours: 'Heures travaillées',
      qeNote:  'Note (optionnel)',
      qeSave:  'Enregistrer',
      // Toasts hours
      tHourSaved: (n, h, d) => `${h} h enregistrées · ${n} · ${d}`,
      tExport:    'Export CSV généré',
      tExportDesc:'Fichier prêt à être envoyé à votre comptable.',
      tImport:    'Import CSV',
      tImportDesc:'Glissez votre fichier · vérification automatique des en-têtes.',
      tValidated: (start, end) => `Période verrouillée · du ${start} au ${end}`,
      tValidatedDesc: 'Heures envoyées à Paie & Planning · masse salariale recalculée.',
      // Empty member name fallback
      placeholderPwd: '••••••••',
    },
    en: {
      title: 'Team & profiles',
      sub: (name, n) => `${name} · ${n} members · central staff account management`,
      tabProfiles: 'Profiles',
      tabHours:    'Hours worked',
      countTotal: 'members',
      addMember: 'Add a member',
      searchPh:  'Search by name, role, department…',
      filterAll: 'All',
      filterDept: 'Department',
      filterContract: 'Contract type',
      filterLang: 'Language',
      noMatch: 'No member matches the filters.',
      viewProfile: 'View profile',
      profileSub: (role, dept) => `${role} · ${dept}`,
      editBtn:   'Edit',
      deleteBtn: 'Remove',
      secIdentity:    'Identity',
      secContact:     'Contact',
      secAccess:      'Kiwi Caisse access',
      secRole:        'Role & assignment',
      secContract:    'Contract',
      secComp:        'Compensation',
      secSkills:      'Skills',
      secEmergency:   'Emergency contact',
      secNotes:       'Notes',
      firstName: 'First name',
      lastName:  'Last name',
      email:     'Email',
      phone:     'Phone',
      password:  'Password',
      generate:  'Generate',
      copy:      'Copy',
      function:  'Function',
      department:'Department',
      contractType: 'Contract type',
      startDate: 'Start date',
      endDate:   'End date',
      baseSalary:'Base salary · MAD / month',
      hourlyRate:'Hourly rate · MAD / hour',
      languages: 'Spoken languages',
      address:   'Address',
      cin:       'National ID (CIN)',
      emergencyName:  'Contact name',
      emergencyPhone: 'Contact phone',
      notes:     'Free notes',
      ctCdi: 'Permanent', ctCdd: 'Fixed-term', ctStage: 'Internship', ctFreelance: 'Freelance', ctInterim: 'Temp',
      langFr: 'French', langAr: 'Arabic', langEn: 'English', langEs: 'Spanish', langTz: 'Tamazight', langDr: 'Darija',
      addTitle:  'New member',
      editTitle: 'Edit member',
      photoLabel:'Photo',
      uploadPhoto:'Upload a photo',
      placeholder: { firstName: 'Sara', lastName: 'Belkadi', email: 'sara@kiwi.ma', phone: '6XX XX XX XX', address: '12 Rue, Maarif, Casablanca', cin: 'BK 384721', emergencyName: 'Karim Belkadi', emergencyPhone: '6XX XX XX XX', notes: 'Shellfish allergy · extended weekend availability' },
      vRequired: 'First name, last name and function are required',
      vInvalidEmail: 'Invalid email',
      vEndAfterStart: 'End date must be after the start date',
      submitAdd:  'Add member',
      submitEdit: 'Save changes',
      cancel: 'Cancel',
      delTitle: 'Remove this member?',
      delDesc:  'Permanent. The Kiwi Caisse account will be disabled immediately.',
      delConfirm: 'Remove',
      tAdded:    (n) => `${n} added to the team`,
      tAddedDesc:(p) => `Credentials sent · password ${p}`,
      tUpdated:  (n) => `${n} · profile updated`,
      tDeleted:  (n) => `${n} has been removed from the team`,
      tPwdCopied:'Password copied',
      tPwdGen:   'New password generated',
      hPeriodWeek: 'This week',
      hPeriodFort: 'Fortnight',
      hPeriodMonth:'This month',
      hPeriodCustom:'Custom',
      hQuickEntry:'Quick entry',
      hExport:    'Export CSV',
      hImport:    'Import CSV',
      hValidate:  'Validate period',
      hMember:    'Member',
      hTotal:     'Total hours',
      hPay:       'Computed pay',
      hLocked:    'Period locked',
      hPeriodLabel: (start, end) => `From ${start} to ${end}`,
      hSelfSum:   (h, mad) => `${h} h · ${mad} MAD`,
      hFooterLabel: 'Period total',
      qeTitle: 'Quick entry · hours',
      qeMember:'Member',
      qeDate:  'Date',
      qeHours: 'Hours worked',
      qeNote:  'Note (optional)',
      qeSave:  'Save',
      tHourSaved: (n, h, d) => `${h} h logged · ${n} · ${d}`,
      tExport:    'CSV export generated',
      tExportDesc:'File ready to send to your accountant.',
      tImport:    'CSV import',
      tImportDesc:'Drop your file · headers checked automatically.',
      tValidated: (start, end) => `Period locked · from ${start} to ${end}`,
      tValidatedDesc: 'Hours sent to Payroll & Planning · wage cost recomputed.',
      placeholderPwd: '••••••••',
    },
    ar: {
      title: 'الفريق والملفات',
      sub: (name, n) => `${name} · ${n} أعضاء · إدارة مركزية لحسابات الموظفين`,
      tabProfiles: 'الملفات',
      tabHours:    'ساعات العمل',
      countTotal: 'أعضاء',
      addMember: 'إضافة عضو',
      searchPh:  'بحث بالاسم، المنصب، القسم…',
      filterAll: 'الكل',
      filterDept: 'القسم',
      filterContract: 'نوع العقد',
      filterLang: 'اللغة',
      noMatch: 'لا يوجد عضو يطابق الفلاتر.',
      viewProfile: 'عرض الملف',
      profileSub: (role, dept) => `${role} · ${dept}`,
      editBtn:   'تعديل',
      deleteBtn: 'حذف',
      secIdentity:    'الهوية',
      secContact:     'الاتصال',
      secAccess:      'الوصول لـ Kiwi Caisse',
      secRole:        'المنصب والتكليف',
      secContract:    'العقد',
      secComp:        'الراتب',
      secSkills:      'المهارات',
      secEmergency:   'جهة الاتصال للطوارئ',
      secNotes:       'ملاحظات',
      firstName: 'الاسم الأول',
      lastName:  'النسب',
      email:     'البريد الإلكتروني',
      phone:     'الهاتف',
      password:  'كلمة السر',
      generate:  'إنشاء',
      copy:      'نسخ',
      function:  'الوظيفة',
      department:'القسم',
      contractType: 'نوع العقد',
      startDate: 'تاريخ البدء',
      endDate:   'تاريخ الانتهاء',
      baseSalary:'الراتب الأساسي · درهم / شهر',
      hourlyRate:'الأجر بالساعة · درهم / ساعة',
      languages: 'اللغات المتحدث بها',
      address:   'العنوان',
      cin:       'البطاقة الوطنية',
      emergencyName:  'اسم جهة الاتصال',
      emergencyPhone: 'هاتف جهة الاتصال',
      notes:     'ملاحظات حرة',
      ctCdi: 'عقد دائم', ctCdd: 'عقد محدد', ctStage: 'تدريب', ctFreelance: 'مستقل', ctInterim: 'مؤقت',
      langFr: 'الفرنسية', langAr: 'العربية', langEn: 'الإنجليزية', langEs: 'الإسبانية', langTz: 'الأمازيغية', langDr: 'الدارجة',
      addTitle:  'عضو جديد',
      editTitle: 'تعديل العضو',
      photoLabel:'الصورة',
      uploadPhoto:'تحميل صورة',
      placeholder: { firstName: 'سارة', lastName: 'بلقاضي', email: 'sara@kiwi.ma', phone: '6XX XX XX XX', address: 'شارع 12، المعاريف، الدار البيضاء', cin: 'BK 384721', emergencyName: 'كريم بلقاضي', emergencyPhone: '6XX XX XX XX', notes: 'حساسية من القشريات · توفر موسع نهاية الأسبوع' },
      vRequired: 'الاسم الأول والنسب والوظيفة مطلوبة',
      vInvalidEmail: 'بريد إلكتروني غير صالح',
      vEndAfterStart: 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء',
      submitAdd:  'إضافة العضو',
      submitEdit: 'حفظ التعديلات',
      cancel: 'إلغاء',
      delTitle: 'إزالة هذا العضو؟',
      delDesc:  'إجراء نهائي. سيتم تعطيل حساب Kiwi Caisse فورًا.',
      delConfirm: 'إزالة',
      tAdded:    (n) => `تمت إضافة ${n} إلى الفريق`,
      tAddedDesc:(p) => `تم إرسال بيانات الاعتماد · كلمة السر ${p}`,
      tUpdated:  (n) => `${n} · تم تحديث الملف`,
      tDeleted:  (n) => `تمت إزالة ${n} من الفريق`,
      tPwdCopied:'تم نسخ كلمة السر',
      tPwdGen:   'تم إنشاء كلمة سر جديدة',
      hPeriodWeek: 'هذا الأسبوع',
      hPeriodFort: 'نصف شهر',
      hPeriodMonth:'هذا الشهر',
      hPeriodCustom:'مخصص',
      hQuickEntry:'إدخال سريع',
      hExport:    'تصدير CSV',
      hImport:    'استيراد CSV',
      hValidate:  'تأكيد الفترة',
      hMember:    'العضو',
      hTotal:     'إجمالي الساعات',
      hPay:       'الأجر المحتسب',
      hLocked:    'الفترة مقفلة',
      hPeriodLabel: (start, end) => `من ${start} إلى ${end}`,
      hSelfSum:   (h, mad) => `${h} ساعة · ${mad} درهم`,
      hFooterLabel: 'إجمالي الفترة',
      qeTitle: 'إدخال سريع · ساعات',
      qeMember:'العضو',
      qeDate:  'التاريخ',
      qeHours: 'ساعات العمل',
      qeNote:  'ملاحظة (اختياري)',
      qeSave:  'حفظ',
      tHourSaved: (n, h, d) => `${h} ساعات مسجلة · ${n} · ${d}`,
      tExport:    'تم إنشاء تصدير CSV',
      tExportDesc:'الملف جاهز للإرسال إلى محاسبك.',
      tImport:    'استيراد CSV',
      tImportDesc:'أفلت ملفك · يتم التحقق من الرؤوس تلقائيًا.',
      tValidated: (start, end) => `الفترة مقفلة · من ${start} إلى ${end}`,
      tValidatedDesc: 'تم إرسال الساعات إلى الرواتب والتخطيط · أعيد حساب كتلة الأجور.',
      placeholderPwd: '••••••••',
    },
  };
  const t = () => STR[trLang()] || STR.fr;

  /* ═══════════════ VENUE-AWARE ROLE CATALOGUE ═══════════════
   * Maps every supported venue.type to its allowed list of
   * { departments, functions }. The map is exhaustive — a
   * restaurant owner literally cannot see "Masseur"; a pharmacy
   * never sees "Serveur". Custom venues + the synthetic "fusion"
   * type fall back to the union (every option), so multi-site
   * mode is forgiving.
   * ───────────────────────────────────────────────────────────── */
  const CATALOG = {
    restaurant: {
      departments: ['Cuisine', 'Salle', 'Bar', 'Caisse', 'Plonge', 'Pâtisserie', 'Management'],
      functions:   ['Chef de cuisine', 'Sous-chef', 'Cuisinier', 'Commis', 'Chef de rang', 'Serveur', "Maître d'hôtel", 'Sommelier', 'Barman', 'Caissier', 'Plongeur', 'Pâtissier', 'Manager', "Hôte d'accueil"],
    },
    cafe: {
      departments: ['Comptoir', 'Salle', 'Pâtisserie', 'Caisse', 'Management'],
      functions:   ['Barista', 'Serveur', 'Caissier', 'Pâtissier', 'Aide-pâtissier', 'Manager', "Hôte d'accueil"],
    },
    pharmacie: {
      departments: ['Comptoir', 'Préparation', 'Caisse', 'Stock', 'Management'],
      functions:   ['Pharmacien titulaire', 'Pharmacien assistant', 'Préparateur en pharmacie', 'Vendeur conseil', 'Caissier', 'Magasinier', 'Manager'],
    },
    spa: {
      departments: ['Coiffure', 'Esthétique', 'Manucure', 'Massage', 'Accueil', 'Caisse', 'Management'],
      functions:   ['Coiffeur', 'Coiffeuse', 'Coloriste', 'Esthéticienne', 'Maquilleuse', 'Manucure', 'Masseur', 'Masseuse', 'Réceptionniste', 'Caissier', 'Manager'],
    },
    boulangerie: {
      departments: ['Fournil', 'Pâtisserie', 'Vente', 'Caisse', 'Management'],
      functions:   ['Boulanger', 'Pâtissier', 'Vendeur', 'Caissier', 'Manager'],
    },
    epicerie: {
      departments: ['Rayons', 'Caisse', 'Stock', 'Management'],
      functions:   ['Vendeur', 'Caissier', 'Magasinier', 'Réassortisseur', 'Manager'],
    },
    // Existing real venues use these types — map them in.
    boutique: {
      departments: ['Vente', 'Vitrine', 'Caisse', 'Stock', 'Management'],
      functions:   ['Vendeur conseil', 'Caissier', 'Magasinier', 'Visual merchandiser', 'Manager'],
    },
  };
  // Synthetic types (fusion, custom) — take the union so nothing is locked.
  function unionCatalog() {
    const allDept = new Set(), allFn = new Set();
    Object.values(CATALOG).forEach(c => {
      c.departments.forEach(d => allDept.add(d));
      c.functions.forEach(f => allFn.add(f));
    });
    return { departments: [...allDept].sort((a, b) => a.localeCompare(b, 'fr')),
             functions:   [...allFn].sort((a, b)   => a.localeCompare(b, 'fr')) };
  }
  function catalogFor(venueType) {
    return CATALOG[venueType] || unionCatalog();
  }

  /* ═══════════════ MOCK SEED PER VENUE TYPE ═══════════════
   * On first open we hydrate a venue-appropriate roster so the
   * page looks alive. Members carry the venueType they were
   * seeded for so subsequent venue-switching can re-seed
   * the right set on demand.
   * ─────────────────────────────────────────────────────────── */
  const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'];
  const LANGS = ['Français', 'Arabe', 'Anglais', 'Espagnol', 'Tamazight', 'Darija'];
  const AVATAR_TONES = ['a', 'b', 'c', 'd'];

  function makePwd(len = 12) {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', a = 'abcdefghijkmnopqrstuvwxyz', n = '23456789', s = '@!#$%&*';
    const pick = (alpha) => alpha[Math.floor(Math.random() * alpha.length)];
    let p = pick(A) + pick(a) + pick(n) + pick(s);
    while (p.length < len) p += pick(A + a + n);
    return p.split('').sort(() => Math.random() - 0.5).join('');
  }

  function initials(first, last) {
    const a = (first || '').trim().charAt(0).toUpperCase() || '?';
    const b = (last || '').trim().charAt(0).toUpperCase() || '';
    return a + b;
  }

  function seedFor(venueType) {
    const cat = catalogFor(venueType);
    const pickDept = (i) => cat.departments[i % cat.departments.length];
    const pickFn   = (i) => cat.functions[i % cat.functions.length];
    const SEEDS = {
      restaurant: [
        ['Fatima',  'Khalki',    'Management',  'Manager',           'CDI',      8400, 95, ['Français','Arabe','Anglais']],
        ['Mehdi',   'Mansouri',  'Cuisine',     'Chef de cuisine',   'CDI',      9200, 100,['Français','Arabe']],
        ['Sofia',   'Belkadi',   'Bar',         'Barman',            'CDI',      4800, 55, ['Français','Arabe','Anglais','Espagnol']],
        ['Hamid',   'Jelloul',   'Salle',       'Chef de rang',      'CDI',      4600, 52, ['Français','Arabe','Darija']],
        ['Lina',    'Saidi',     'Caisse',      'Caissier',          'CDD',      4200, 48, ['Français','Arabe','Darija']],
        ['Youssef', 'Amrani',    'Salle',       'Serveur',           'Intérim',  3800, 45, ['Arabe','Darija']],
        ['Karim',   'Berrada',   'Cuisine',     'Cuisinier',         'CDI',      5400, 60, ['Français','Arabe']],
        ['Nawal',   'Kettani',   'Pâtisserie',  'Pâtissier',         'CDI',      5200, 58, ['Français','Arabe','Anglais']],
      ],
      cafe: [
        ['Fatima',  'Khalki',    'Management',  'Manager',           'CDI',      7200, 80, ['Français','Arabe','Anglais']],
        ['Sofia',   'Belkadi',   'Comptoir',    'Barista',           'CDI',      4400, 50, ['Français','Arabe','Anglais','Espagnol']],
        ['Hamid',   'Jelloul',   'Salle',       'Serveur',           'CDI',      4000, 46, ['Français','Arabe','Darija']],
        ['Lina',    'Saidi',     'Caisse',      'Caissier',          'CDD',      3800, 44, ['Français','Arabe','Darija']],
        ['Mehdi',   'Mansouri',  'Pâtisserie',  'Pâtissier',         'CDI',      4600, 52, ['Français','Arabe']],
        ['Yassine', 'Errami',    'Comptoir',    'Aide-pâtissier',    'Stage',    2400, 28, ['Arabe','Darija']],
      ],
      pharmacie: [
        ['Dr. Amina','Benhima',  'Management',   'Manager',                  'CDI',     14000, 160,['Français','Arabe','Anglais']],
        ['Karim',   'Benyahya',  'Comptoir',     'Pharmacien titulaire',     'CDI',     12000, 140,['Français','Arabe','Anglais']],
        ['Nadia',   'Lhassani',  'Comptoir',     'Pharmacien assistant',     'CDI',     7800, 88, ['Français','Arabe']],
        ['Soumia',  'El Fakir',  'Préparation',  'Préparateur en pharmacie', 'CDI',     5400, 60, ['Français','Arabe','Darija']],
        ['Hicham',  'Ouazzani',  'Comptoir',     'Vendeur conseil',          'CDD',     4200, 48, ['Arabe','Darija']],
        ['Imane',   'Tazi',      'Caisse',       'Caissier',                 'CDD',     4000, 46, ['Français','Arabe','Darija']],
      ],
      spa: [
        ['Salma',   'Mansouri',  'Management',  'Manager',          'CDI',      8200, 92, ['Français','Arabe','Anglais']],
        ['Ines',    'Cherkaoui', 'Coiffure',    'Coiffeuse',        'CDI',      5400, 60, ['Français','Arabe','Darija']],
        ['Karim',   'Idrissi',   'Coiffure',    'Coloriste',        'CDI',      5600, 62, ['Français','Arabe']],
        ['Lamia',   'Bennani',   'Esthétique',  'Esthéticienne',    'CDI',      4800, 54, ['Français','Arabe','Anglais']],
        ['Hicham',  'El Amri',   'Massage',     'Masseur',          'Freelance',5200, 75, ['Français','Arabe']],
        ['Nadia',   'Lazrak',    'Manucure',    'Manucure',         'CDD',      4000, 46, ['Français','Arabe','Darija']],
        ['Sara',    'Tazi',      'Accueil',     'Réceptionniste',   'CDD',      3800, 44, ['Français','Arabe','Anglais','Darija']],
      ],
      boutique: [
        ['Sara',    'El Idrissi','Management',  'Manager',                'CDI',     7800, 88, ['Français','Arabe','Anglais']],
        ['Yassmine','Ouali',     'Vente',       'Vendeur conseil',        'CDI',     5200, 58, ['Français','Arabe','Anglais']],
        ['Karim',   'Mokri',     'Vente',       'Vendeur conseil',        'CDI',     4800, 54, ['Français','Arabe','Espagnol']],
        ['Mehdi',   'Tahiri',    'Vitrine',     'Visual merchandiser',    'CDD',     4600, 52, ['Français','Arabe']],
        ['Hanae',   'Bensaid',   'Caisse',      'Caissier',               'CDD',     3800, 44, ['Français','Arabe','Darija']],
        ['Reda',    'Bouanani',  'Stock',       'Magasinier',             'Intérim', 3600, 42, ['Arabe','Darija']],
      ],
      boulangerie: [
        ['Driss',   'Lahcen',    'Fournil',     'Boulanger',         'CDI',      4800, 54, ['Arabe','Darija']],
        ['Imane',   'Khattabi',  'Pâtisserie',  'Pâtissier',         'CDI',      5000, 56, ['Français','Arabe']],
        ['Karim',   'Bahaa',     'Vente',       'Vendeur',           'CDD',      3600, 42, ['Arabe','Darija']],
        ['Lamia',   'Saoudi',    'Caisse',      'Caissier',          'CDI',      3800, 44, ['Français','Arabe','Darija']],
        ['Mohamed', 'Rifai',     'Management',  'Manager',           'CDI',      6800, 76, ['Français','Arabe']],
      ],
      epicerie: [
        ['Hassan',  'Bouhdid',   'Rayons',      'Réassortisseur',    'CDD',      3600, 40, ['Arabe','Darija']],
        ['Sofia',   'Naciri',    'Caisse',      'Caissier',          'CDI',      3800, 44, ['Français','Arabe','Darija']],
        ['Karim',   'Lhajji',    'Stock',       'Magasinier',        'CDI',      4000, 46, ['Arabe','Darija']],
        ['Aïcha',   'Mahfoud',   'Rayons',      'Vendeur',           'CDD',      3600, 42, ['Arabe','Darija']],
        ['Mehdi',   'Rachid',    'Management',  'Manager',           'CDI',      6400, 72, ['Français','Arabe','Darija']],
      ],
    };
    const list = SEEDS[venueType] || SEEDS.restaurant;
    return list.map((row, i) => {
      const [first, last, dept, fn, contract, salary, rate, langs] = row;
      const startDate = new Date(); startDate.setDate(1); startDate.setMonth(startDate.getMonth() - (3 + i));
      return {
        id: 'mem-' + Math.random().toString(36).slice(2, 9),
        firstName: first,
        lastName: last,
        email: (first + '.' + last).toLowerCase().replace(/[^a-z.]/g, '') + '@kiwi.ma',
        phone: '+212 6 ' + (10 + i) + ' ' + (40 + i * 3) + ' ' + (10 + i * 2) + ' ' + (20 + i),
        password: makePwd(),
        function: fn,
        department: dept,
        contract,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: (contract === 'CDD' || contract === 'Stage')
          ? new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10)
          : '',
        baseSalary: salary,
        hourlyRate: rate,
        languages: langs,
        address: ['Rue 12, Maarif, Casablanca', 'Bd Mohammed V, Rabat', 'Rue Lalla Yacout, Casablanca', 'Av. Hassan II, Marrakech', 'Rue Ibn Khaldoun, Tanger'][i % 5],
        cin: ['BK', 'AB', 'JC', 'TK', 'MR'][i % 5] + ' ' + (300000 + i * 4317),
        emergencyName: ['Karim Belkadi','Sofia Mansouri','Hassan Berrada','Nadia Tazi','Hicham Lhassani'][i % 5],
        emergencyPhone: '+212 6 22 ' + (30 + i * 2) + ' ' + (10 + i * 3) + ' ' + (40 + i),
        notes: ['Disponible week-end','Demande horaires aménagés mardi','Allergies alimentaires connues','Permis B','—'][i % 5],
        avatarTone: AVATAR_TONES[i % AVATAR_TONES.length],
        venueType,
        createdAt: Date.now() - i * 1000 * 60 * 60 * 24,
      };
    });
  }

  /* ═══════════════ HOURS STATE (per-venue) ═══════════════ */
  function seedHours(members, periodDays) {
    const map = {};
    members.forEach(m => {
      map[m.id] = {};
      for (let d = 0; d < periodDays.length; d++) {
        const date = periodDays[d];
        // realistic-ish hours: 4-9h on most days, 0 on one off-day
        const isOff = (Math.floor(Math.random() * 7) === 0);
        map[m.id][date] = isOff ? 0 : (4 + Math.floor(Math.random() * 5)) + (Math.random() < 0.3 ? 0.5 : 0);
      }
    });
    return map;
  }

  /* ═══════════════ ROOT STATE ═══════════════ */
  if (!window.__kiwiTeamV2) window.__kiwiTeamV2 = { byVenue: {}, hoursByVenue: {}, periodKind: 'week', periodLocked: false };
  function ensureVenueData(venueType) {
    const root = window.__kiwiTeamV2;
    if (!root.byVenue[venueType]) root.byVenue[venueType] = seedFor(venueType);
    if (!root.hoursByVenue[venueType]) root.hoursByVenue[venueType] = seedHours(root.byVenue[venueType], buildPeriod(root.periodKind).days);
    return root;
  }
  function getMembers(venueType) { return window.__kiwiTeamV2.byVenue[venueType] || []; }
  function getHours(venueType) { return window.__kiwiTeamV2.hoursByVenue[venueType] || {}; }

  /* ═══════════════ PERIOD UTILS ═══════════════ */
  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtFr(d) { return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; }
  function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function buildPeriod(kind, customStart, customEnd) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let start, end;
    if (kind === 'fortnight') {
      const day = today.getDay();
      // Monday-anchored fortnight
      start = new Date(today); start.setDate(today.getDate() - ((day + 6) % 7) - 7);
      end = new Date(start); end.setDate(start.getDate() + 13);
    } else if (kind === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (kind === 'custom') {
      start = customStart ? new Date(customStart) : new Date(today);
      end = customEnd ? new Date(customEnd) : new Date(today);
    } else {
      // week (Mon–Sun)
      const day = today.getDay();
      start = new Date(today); start.setDate(today.getDate() - ((day + 6) % 7));
      end = new Date(start); end.setDate(start.getDate() + 6);
    }
    const days = [];
    const cur = new Date(start);
    while (cur <= end) { days.push(toISO(cur)); cur.setDate(cur.getDate() + 1); }
    return { start: toISO(start), end: toISO(end), startFr: fmtFr(start), endFr: fmtFr(end), days };
  }

  /* ═══════════════ TAB STATE ═══════════════ */
  let activeTab = 'profiles';            // 'profiles' | 'hours'
  let activeFilters = { search: '', dept: '', contract: '', lang: '' };
  let currentDrawer = null;              // {el, close}
  let unsubscribeVenue = null;           // venue-change subscription

  /* ═══════════════ HELPERS — rendering primitives ═══════════════ */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function svgPlus() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'; }
  function svgSearch() { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'; }
  function svgEdit() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>'; }
  function svgTrash() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>'; }
  function svgCopy() { return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'; }
  function svgRefresh() { return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.64A9 9 0 0020.49 15"/></svg>'; }
  function svgDownload() { return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7 7 7-7M5 21h14"/></svg>'; }
  function svgUpload() { return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21V9M5 14l7-7 7 7M5 3h14"/></svg>'; }
  function svgCheck() { return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg>'; }
  function svgLock() { return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>'; }
  function svgEye() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'; }

  function memberFullName(m) { return `${m.firstName || ''} ${m.lastName || ''}`.trim() || '—'; }

  function memberMatchesFilters(m, T) {
    const { search, dept, contract, lang } = activeFilters;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${memberFullName(m)} ${m.function} ${m.department} ${m.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (dept && m.department !== dept) return false;
    if (contract && m.contract !== contract) return false;
    if (lang && !(m.languages || []).includes(lang)) return false;
    return true;
  }

  /* ═══════════════ ENTRY POINT — open drawer ═══════════════
   * Both venues.js and pages-pro.js install their own nav-equipe handler;
   * venues.js even re-asserts its handler on the window 'load' event after
   * every other deferred script has executed. To win, we install ours twice:
   * once at IIFE eval (so it wins over the IIFE-time assignments in
   * pages.js / pages-pro.js) and once on 'load' AFTER venues.js's load
   * listener (listeners fire in registration order, and team.js loads after
   * venues.js).
   * ─────────────────────────────────────────────────────────── */
  function installNavEquipe() {
    if (!window.Kiwi || !window.Kiwi.handlers) return;
    window.Kiwi.handlers['nav-equipe'] = openTeamDrawer;
  }
  window.addEventListener('load', () => {
    // Slight delay so any other `load` listener has finished re-asserting.
    setTimeout(installNavEquipe, 0);
  });
  // Also install immediately so handlers triggered before 'load' still work.
  installNavEquipe();

  function openTeamDrawer() {
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas', type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    ensureVenueData(venueType);

    const T = t();
    const dr = drawer({
      title: T.title,
      subtitle: '…',
      width: 1080,
      body: `<div data-team-root></div>`,
    });
    currentDrawer = dr;
    activeTab = 'profiles';
    activeFilters = { search: '', dept: '', contract: '', lang: '' };
    window.__kiwiTeamV2.periodKind = 'week';
    window.__kiwiTeamV2.periodLocked = false;

    /* Subscribe to venue switches so the page re-paints automatically. */
    if (unsubscribeVenue) { try { unsubscribeVenue(); } catch (_) {} unsubscribeVenue = null; }
    if (window.KiwiVenue?.subscribe) {
      unsubscribeVenue = window.KiwiVenue.subscribe(() => {
        if (!currentDrawer || !currentDrawer.el || !document.body.contains(currentDrawer.el)) {
          if (unsubscribeVenue) { unsubscribeVenue(); unsubscribeVenue = null; }
          return;
        }
        const v2 = window.KiwiVenue.getCurrentVenueData();
        const t2 = v2?.type || 'restaurant';
        ensureVenueData(t2);
        renderRoot();
      });
    }

    /* Wipe subscription when the drawer is closed (avoids ghost subscribers). */
    const origClose = dr.close;
    dr.close = function () {
      if (unsubscribeVenue) { try { unsubscribeVenue(); } catch (_) {} unsubscribeVenue = null; }
      currentDrawer = null;
      origClose.apply(this, arguments);
    };
    // also re-bind close button (was already wired by drawer() impl, but the
    // close fn ref we own now is the wrapped one — re-bind to keep parity).
    const xBtn = dr.el.querySelector('.kiwi-drawer-close');
    if (xBtn) xBtn.onclick = dr.close;
    dr.el.__kiwiClose = dr.close;

    renderRoot();
  };

  /* ═══════════════ TOP-LEVEL RENDER ═══════════════ */
  function renderRoot() {
    if (!currentDrawer || !currentDrawer.el) return;
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { name: 'Café Atlas', type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    const members = getMembers(venueType);

    /* subtitle */
    const subEl = currentDrawer.el.querySelector('.kiwi-drawer-head p');
    if (subEl) subEl.textContent = T.sub(venue.name, members.length);

    const root = currentDrawer.el.querySelector('[data-team-root]');
    if (!root) return;
    root.innerHTML = `
      <style>${TEAM_CSS}</style>
      ${renderTabs(T)}
      <div data-team-pane>${activeTab === 'profiles' ? renderProfilesPane(T, venue, venueType, members) : renderHoursPane(T, venue, venueType, members)}</div>
    `;
  }

  function renderTabs(T) {
    return `
      <div class="kt-tabs">
        <button class="kt-tab${activeTab === 'profiles' ? ' on' : ''}" data-action="kt-tab" data-arg="profiles">${T.tabProfiles}</button>
        <button class="kt-tab${activeTab === 'hours'    ? ' on' : ''}" data-action="kt-tab" data-arg="hours">${T.tabHours}</button>
      </div>
    `;
  }

  /* ═══════════════ PROFILES PANE ═══════════════ */
  function renderProfilesPane(T, venue, venueType, members) {
    const cat = catalogFor(venueType);
    const visible = members.filter(m => memberMatchesFilters(m, T));
    const deptOpts = ['<option value="">' + esc(T.filterDept + ' · ' + T.filterAll) + '</option>',
      ...cat.departments.map(d => `<option value="${esc(d)}"${activeFilters.dept === d ? ' selected' : ''}>${esc(d)}</option>`)].join('');
    const ctOpts = ['<option value="">' + esc(T.filterContract + ' · ' + T.filterAll) + '</option>',
      ...CONTRACT_TYPES.map(c => `<option value="${esc(c)}"${activeFilters.contract === c ? ' selected' : ''}>${esc(c)}</option>`)].join('');
    const langOpts = ['<option value="">' + esc(T.filterLang + ' · ' + T.filterAll) + '</option>',
      ...LANGS.map(l => `<option value="${esc(l)}"${activeFilters.lang === l ? ' selected' : ''}>${esc(l)}</option>`)].join('');

    return `
      <!-- Header row: count + CTA -->
      <div class="kt-pheader">
        <div class="kt-count">
          <div class="num">${members.length}</div>
          <div class="lbl">${esc(T.countTotal)} · ${esc(venue.name)}</div>
        </div>
        <button class="kb primary" data-action="kt-add-member">${svgPlus()}${esc(T.addMember)}</button>
      </div>

      <!-- Search & filters -->
      <div class="kt-filterbar">
        <div class="kt-search">
          <span class="ic">${svgSearch()}</span>
          <input type="text" placeholder="${esc(T.searchPh)}" value="${esc(activeFilters.search)}" data-kt-search />
        </div>
        <select data-kt-filter="dept">${deptOpts}</select>
        <select data-kt-filter="contract">${ctOpts}</select>
        <select data-kt-filter="lang">${langOpts}</select>
      </div>

      ${visible.length === 0
        ? `<div class="kt-empty">${esc(T.noMatch)}</div>`
        : `<div class="kt-grid">${visible.map(m => renderMemberCard(T, m)).join('')}</div>`}
    `;
  }

  function renderMemberCard(T, m) {
    const ini = initials(m.firstName, m.lastName);
    const contractTone = m.contract === 'CDI' ? 'ok' : (m.contract === 'CDD' || m.contract === 'Stage') ? 'pend' : 'neutral';
    return `
      <div class="kt-card" data-action="kt-view-profile" data-arg="${esc(m.id)}" tabindex="0">
        <div class="kt-card-head">
          <div class="kt-av ${esc(m.avatarTone || 'a')}">${esc(ini)}</div>
          <div class="kt-card-id">
            <div class="kt-card-name">${esc(memberFullName(m))}</div>
            <div class="kt-card-sub">${esc(m.function)} · ${esc(m.department)}</div>
          </div>
          <span class="chip ${contractTone}" style="font-size:10.5px; align-self:flex-start;">${esc(m.contract || '—')}</span>
        </div>
        <div class="kt-card-meta">
          <div class="kt-meta">
            <div class="kt-meta-l">SALAIRE</div>
            <div class="kt-meta-v mono">${(m.baseSalary || 0).toLocaleString('fr-FR')} MAD</div>
          </div>
          <div class="kt-meta">
            <div class="kt-meta-l">TAUX/H</div>
            <div class="kt-meta-v mono">${(m.hourlyRate || 0).toLocaleString('fr-FR')} MAD</div>
          </div>
          <div class="kt-meta">
            <div class="kt-meta-l">LANGUES</div>
            <div class="kt-meta-v">${(m.languages || []).slice(0, 3).map(l => `<span class="kt-langchip">${esc(l)}</span>`).join('') || '—'}</div>
          </div>
        </div>
        <div class="kt-card-foot">
          <button class="kt-btn-ghost" data-action="kt-view-profile" data-arg="${esc(m.id)}">${svgEye()} ${esc(T.viewProfile)}</button>
          <button class="kt-btn-ghost" data-action="kt-edit-member" data-arg="${esc(m.id)}">${svgEdit()} ${esc(T.editBtn)}</button>
        </div>
      </div>
    `;
  }

  /* ═══════════════ HOURS PANE ═══════════════ */
  function renderHoursPane(T, venue, venueType, members) {
    const root = window.__kiwiTeamV2;
    const periodKind = root.periodKind || 'week';
    const period = buildPeriod(periodKind);
    const hours = getHours(venueType);
    /* Ensure rows exist for every member (when seed cycles) */
    members.forEach(m => {
      if (!hours[m.id]) hours[m.id] = {};
      period.days.forEach(d => { if (hours[m.id][d] == null) hours[m.id][d] = 0; });
    });
    /* Reverse: trim cells outside period for memory cleanliness */

    const locked = root.periodLocked;
    let grandHours = 0, grandPay = 0;

    const headDays = period.days.map(d => {
      const dt = new Date(d);
      return `<th class="kt-day-head"><span class="d">${pad(dt.getDate())}</span><span class="m">${dt.toLocaleDateString('fr-FR', { weekday: 'short' })}</span></th>`;
    }).join('');

    const rows = members.map(m => {
      const row = hours[m.id] || {};
      let total = 0;
      const cells = period.days.map(d => {
        const v = +(row[d] || 0);
        total += v;
        const isToday = (d === toISO(new Date()));
        return `<td class="kt-day-cell${isToday ? ' today' : ''}${locked ? ' locked' : ''}">
          <input type="number" step="0.25" min="0" max="24" value="${v}" data-kt-hour data-mid="${esc(m.id)}" data-day="${esc(d)}" ${locked ? 'disabled' : ''} />
        </td>`;
      }).join('');
      const pay = total * (m.hourlyRate || 0);
      grandHours += total;
      grandPay += pay;
      return `
        <tr>
          <td class="kt-h-member">
            <div class="kt-av ${esc(m.avatarTone || 'a')}" style="width:30px; height:30px; font-size:11.5px;">${esc(initials(m.firstName, m.lastName))}</div>
            <div>
              <div class="n">${esc(memberFullName(m))}</div>
              <div class="r">${esc(m.function)}</div>
            </div>
          </td>
          ${cells}
          <td class="kt-h-total mono"><b>${total.toFixed(2).replace('.', ',')}</b><span>h</span></td>
          <td class="kt-h-pay mono"><b>${pay.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</b><span>MAD</span></td>
        </tr>
      `;
    }).join('');

    const periodButtons = [
      ['week',      T.hPeriodWeek],
      ['fortnight', T.hPeriodFort],
      ['month',     T.hPeriodMonth],
      ['custom',    T.hPeriodCustom],
    ].map(([k, label]) => `<button class="kt-pbtn${periodKind === k ? ' on' : ''}" data-action="kt-period" data-arg="${k}">${esc(label)}</button>`).join('');

    return `
      <!-- Top: period picker + actions -->
      <div class="kt-hbar">
        <div class="kt-pset">${periodButtons}</div>
        <div class="kt-hbar-right">
          <button class="kb ghost" data-action="kt-quick-entry">${svgPlus()}${esc(T.hQuickEntry)}</button>
          <button class="kb ghost" data-action="kt-export-csv">${svgDownload()}${esc(T.hExport)}</button>
          <button class="kb ghost" data-action="kt-import-csv">${svgUpload()}${esc(T.hImport)}</button>
          <button class="kb ${locked ? 'ghost' : 'atlas'}" data-action="kt-validate-period" ${locked ? 'disabled' : ''}>
            ${locked ? svgLock() : svgCheck()}${esc(locked ? T.hLocked : T.hValidate)}
          </button>
        </div>
      </div>

      <div class="kt-h-periodlabel">${esc(T.hPeriodLabel(period.startFr, period.endFr))}${locked ? ' · <span style="color:var(--warning); font-weight:600;">' + esc(T.hLocked) + '</span>' : ''}</div>

      <div class="kt-h-tablewrap">
        <table class="kt-h-table">
          <thead>
            <tr>
              <th class="kt-h-memberhead">${esc(T.hMember)}</th>
              ${headDays}
              <th class="kt-h-totalhead">${esc(T.hTotal)}</th>
              <th class="kt-h-totalhead">${esc(T.hPay)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td class="kt-h-foot-label">${esc(T.hFooterLabel)}</td>
              <td colspan="${period.days.length}"></td>
              <td class="kt-h-foot-tot mono"><b>${grandHours.toFixed(2).replace('.', ',')}</b><span>h</span></td>
              <td class="kt-h-foot-tot mono"><b>${grandPay.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</b><span>MAD</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  /* ═══════════════ DELEGATED HANDLERS ═══════════════ */
  handlers['kt-tab'] = (_el, kind) => {
    if (kind === 'profiles' || kind === 'hours') {
      activeTab = kind;
      renderRoot();
    }
  };

  // Filter / search wiring lives outside [data-action] because they are inputs
  // — bind via delegated input listener on the drawer root.
  document.addEventListener('input', (e) => {
    if (!currentDrawer || !currentDrawer.el || !currentDrawer.el.contains(e.target)) return;
    const t2 = e.target;
    if (t2.matches('[data-kt-search]')) {
      activeFilters.search = t2.value;
      // Only re-render the grid for snappier typing — but full re-render is fine here.
      // Debounce minimally
      clearTimeout(window.__kiwiTeamSearchTimer);
      window.__kiwiTeamSearchTimer = setTimeout(renderRoot, 120);
    }
    if (t2.matches('[data-kt-filter]')) {
      const kind = t2.getAttribute('data-kt-filter');
      activeFilters[kind] = t2.value;
      renderRoot();
    }
    if (t2.matches('[data-kt-hour]')) {
      if (window.__kiwiTeamV2.periodLocked) return;
      const mid = t2.getAttribute('data-mid');
      const day = t2.getAttribute('data-day');
      const venue = window.KiwiVenue?.getCurrentVenueData?.();
      const vt = venue?.type || 'restaurant';
      const hours = window.__kiwiTeamV2.hoursByVenue[vt] || (window.__kiwiTeamV2.hoursByVenue[vt] = {});
      if (!hours[mid]) hours[mid] = {};
      const val = Math.max(0, Math.min(24, parseFloat(t2.value) || 0));
      hours[mid][day] = val;
      // Re-render totals row but keep input focus by rerendering just totals
      updateHourTotals();
    }
  });

  // Recompute totals + period footer without losing input focus.
  function updateHourTotals() {
    if (!currentDrawer || !currentDrawer.el) return;
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const vt = venue.type || 'restaurant';
    const members = getMembers(vt);
    const hours = getHours(vt);
    let grandH = 0, grandP = 0;
    members.forEach(m => {
      const row = hours[m.id] || {};
      const tot = Object.values(row).reduce((a, b) => a + (+b || 0), 0);
      const pay = tot * (m.hourlyRate || 0);
      grandH += tot; grandP += pay;
      // Locate row cells
      const tr = currentDrawer.el.querySelectorAll('table.kt-h-table tbody tr')[members.indexOf(m)];
      if (tr) {
        const totalCell = tr.querySelector('.kt-h-total b');
        const payCell   = tr.querySelector('.kt-h-pay b');
        if (totalCell) totalCell.textContent = tot.toFixed(2).replace('.', ',');
        if (payCell)   payCell.textContent   = pay.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
      }
    });
    const footTot = currentDrawer.el.querySelectorAll('table.kt-h-table tfoot .kt-h-foot-tot b');
    if (footTot[0]) footTot[0].textContent = grandH.toFixed(2).replace('.', ',');
    if (footTot[1]) footTot[1].textContent = grandP.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }

  /* ═══════════════ ADD / EDIT MEMBER MODAL ═══════════════ */
  function openMemberModal(memberId) {
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant', name: 'Café Atlas' };
    const venueType = venue.type || 'restaurant';
    const cat = catalogFor(venueType);
    const editing = !!memberId;
    const existing = editing
      ? (getMembers(venueType).find(m => m.id === memberId) || null)
      : null;
    if (editing && !existing) return;
    const m = existing || {
      id: 'mem-' + Math.random().toString(36).slice(2, 9),
      firstName: '', lastName: '', email: '', phone: '',
      password: makePwd(),
      function: cat.functions[0] || '',
      department: cat.departments[0] || '',
      contract: 'CDI',
      startDate: toISO(new Date()),
      endDate: '',
      baseSalary: 4500,
      hourlyRate: 50,
      languages: ['Français', 'Arabe'],
      address: '',
      cin: '',
      emergencyName: '',
      emergencyPhone: '',
      notes: '',
      avatarTone: AVATAR_TONES[Math.floor(Math.random() * AVATAR_TONES.length)],
      venueType,
      createdAt: Date.now(),
    };
    const isCddOrStage = (c) => c === 'CDD' || c === 'Stage';

    const fnOpts = cat.functions.map(f => `<option value="${esc(f)}"${m.function === f ? ' selected' : ''}>${esc(f)}</option>`).join('');
    const deptOpts = cat.departments.map(d => `<option value="${esc(d)}"${m.department === d ? ' selected' : ''}>${esc(d)}</option>`).join('');
    const ctOpts = CONTRACT_TYPES.map(c => `<option value="${esc(c)}"${m.contract === c ? ' selected' : ''}>${esc(c)}</option>`).join('');

    const langChips = LANGS.map(l => {
      const on = (m.languages || []).includes(l);
      return `<button type="button" class="kt-lang-chip${on ? ' on' : ''}" data-action="kt-lang-toggle" data-arg="${esc(l)}">${esc(l)}</button>`;
    }).join('');

    const mdl = modal({
      title: editing ? T.editTitle : T.addTitle,
      width: 620,
      body: `
        <style>${MODAL_CSS}</style>
        <form data-kt-form data-mid="${esc(m.id)}" data-editing="${editing ? '1' : '0'}">
          <!-- Identity -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secIdentity)}</div>
            <div class="kt-frow">
              <div class="kt-photo">
                <div class="av-disp ${esc(m.avatarTone || 'a')}" data-kt-avdisp>${esc(initials(m.firstName, m.lastName)) || '?'}</div>
                <button type="button" class="kt-photo-btn" data-action="kt-upload-photo">${esc(T.uploadPhoto)}</button>
              </div>
              <div class="kt-fgrow">
                <div class="kt-fgrid-2">
                  <label><span class="l">${esc(T.firstName)}</span><input type="text" name="firstName" value="${esc(m.firstName)}" placeholder="${esc(T.placeholder.firstName)}" required /></label>
                  <label><span class="l">${esc(T.lastName)}</span><input type="text" name="lastName" value="${esc(m.lastName)}" placeholder="${esc(T.placeholder.lastName)}" required /></label>
                </div>
                <label><span class="l">${esc(T.cin)}</span><input type="text" name="cin" value="${esc(m.cin)}" placeholder="${esc(T.placeholder.cin)}" /></label>
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secContact)}</div>
            <div class="kt-fgrid-2">
              <label><span class="l">${esc(T.email)}</span><input type="email" name="email" value="${esc(m.email)}" placeholder="${esc(T.placeholder.email)}" /></label>
              <label><span class="l">${esc(T.phone)}</span><input type="tel" name="phone" value="${esc(m.phone)}" placeholder="${esc(T.placeholder.phone)}" /></label>
            </div>
            <label><span class="l">${esc(T.address)}</span><input type="text" name="address" value="${esc(m.address)}" placeholder="${esc(T.placeholder.address)}" /></label>
          </div>

          <!-- Access -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secAccess)}</div>
            <label class="kt-pwd-label">
              <span class="l">${esc(T.password)}</span>
              <div class="kt-pwd-row">
                <input type="text" name="password" value="${esc(m.password)}" data-kt-pwd />
                <button type="button" class="kt-fbtn-ghost" data-action="kt-pwd-gen">${svgRefresh()} ${esc(T.generate)}</button>
                <button type="button" class="kt-fbtn-ghost" data-action="kt-pwd-copy">${svgCopy()} ${esc(T.copy)}</button>
              </div>
            </label>
          </div>

          <!-- Role -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secRole)}</div>
            <div class="kt-fgrid-2">
              <label><span class="l">${esc(T.function)}</span>
                <select name="function" required>${fnOpts}</select>
              </label>
              <label><span class="l">${esc(T.department)}</span>
                <select name="department" required>${deptOpts}</select>
              </label>
            </div>
          </div>

          <!-- Contract -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secContract)}</div>
            <div class="kt-fgrid-3">
              <label><span class="l">${esc(T.contractType)}</span>
                <select name="contract" data-kt-contract>${ctOpts}</select>
              </label>
              <label><span class="l">${esc(T.startDate)}</span><input type="date" name="startDate" value="${esc(m.startDate)}" /></label>
              <label data-kt-end-wrap${isCddOrStage(m.contract) ? '' : ' hidden'}><span class="l">${esc(T.endDate)}</span><input type="date" name="endDate" value="${esc(m.endDate)}" /></label>
            </div>
          </div>

          <!-- Compensation -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secComp)}</div>
            <div class="kt-fgrid-2">
              <label><span class="l">${esc(T.baseSalary)}</span><input type="number" name="baseSalary" min="0" step="50" value="${esc(m.baseSalary)}" /></label>
              <label><span class="l">${esc(T.hourlyRate)}</span><input type="number" name="hourlyRate" min="0" step="0.5" value="${esc(m.hourlyRate)}" /></label>
            </div>
          </div>

          <!-- Skills / languages -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.languages)}</div>
            <div class="kt-langwrap" data-kt-langs>${langChips}</div>
          </div>

          <!-- Emergency contact -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secEmergency)}</div>
            <div class="kt-fgrid-2">
              <label><span class="l">${esc(T.emergencyName)}</span><input type="text" name="emergencyName" value="${esc(m.emergencyName)}" placeholder="${esc(T.placeholder.emergencyName)}" /></label>
              <label><span class="l">${esc(T.emergencyPhone)}</span><input type="tel" name="emergencyPhone" value="${esc(m.emergencyPhone)}" placeholder="${esc(T.placeholder.emergencyPhone)}" /></label>
            </div>
          </div>

          <!-- Notes -->
          <div class="kt-fsec">
            <div class="kt-fseclabel">${esc(T.secNotes)}</div>
            <label><textarea name="notes" rows="3" placeholder="${esc(T.placeholder.notes)}">${esc(m.notes)}</textarea></label>
          </div>
        </form>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>${esc(T.cancel)}</button>
        <button class="kb atlas" data-action="kt-submit-member">${svgCheck()}${esc(editing ? T.submitEdit : T.submitAdd)}</button>
      `,
    });

    // wire dismiss buttons to close
    mdl.el.addEventListener('click', (e) => { if (e.target.closest('[data-dismiss]')) mdl.close(); });

    // Stash pending state on the modal element for the submit/cancel handlers
    mdl.el.__ktState = {
      editing,
      memberId: m.id,
      languages: (m.languages || []).slice(),
      avatarTone: m.avatarTone,
      venueType,
      origCreatedAt: m.createdAt,
    };
    window.__kiwiTeamModal = mdl;
  }

  handlers['kt-add-member'] = () => openMemberModal(null);
  handlers['kt-edit-member'] = (_el, id) => {
    // close any open profile drawer first
    if (window.__kiwiTeamProfileDrawer) {
      try { window.__kiwiTeamProfileDrawer.close(); } catch (_) {}
      window.__kiwiTeamProfileDrawer = null;
    }
    openMemberModal(id);
  };

  handlers['kt-upload-photo'] = () => {
    // Mocked — show a toast. We could open a file picker, but the brief
    // says "mocked, accept any file or just show colored initials".
    const T = t();
    Kiwi.toast(T.uploadPhoto, { type: 'info', desc: trLang() === 'ar' ? 'محاكاة · يتم استخدام الأحرف الأولى الملونة بدلاً من ذلك.' : trLang() === 'en' ? 'Mocked · colored initials are used instead.' : 'Mocké · les initiales colorées sont utilisées à la place.' });
  };

  handlers['kt-pwd-gen'] = () => {
    const mdl = window.__kiwiTeamModal; if (!mdl || !mdl.el) return;
    const input = mdl.el.querySelector('[data-kt-pwd]');
    if (input) input.value = makePwd();
    Kiwi.toast(t().tPwdGen, { type: 'success' });
  };

  handlers['kt-pwd-copy'] = () => {
    const mdl = window.__kiwiTeamModal; if (!mdl || !mdl.el) return;
    const input = mdl.el.querySelector('[data-kt-pwd]');
    if (!input) return;
    const v = input.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).catch(() => {});
    } else {
      try {
        input.select(); document.execCommand('copy');
      } catch (_) {}
    }
    Kiwi.toast(t().tPwdCopied, { type: 'success' });
  };

  handlers['kt-lang-toggle'] = (el, lang) => {
    const mdl = window.__kiwiTeamModal; if (!mdl || !mdl.el) return;
    const st = mdl.el.__ktState; if (!st) return;
    const idx = st.languages.indexOf(lang);
    if (idx === -1) st.languages.push(lang); else st.languages.splice(idx, 1);
    if (el) el.classList.toggle('on');
  };

  // contract type → toggle end date visibility
  document.addEventListener('change', (e) => {
    const mdl = window.__kiwiTeamModal;
    if (mdl && mdl.el && mdl.el.contains(e.target) && e.target.matches('[data-kt-contract]')) {
      const wrap = mdl.el.querySelector('[data-kt-end-wrap]');
      if (wrap) {
        if (e.target.value === 'CDD' || e.target.value === 'Stage') wrap.removeAttribute('hidden');
        else wrap.setAttribute('hidden', '');
      }
    }
    // live avatar initials
    if (mdl && mdl.el && mdl.el.contains(e.target) && (e.target.name === 'firstName' || e.target.name === 'lastName')) {
      const form = mdl.el.querySelector('[data-kt-form]');
      if (form) {
        const f = form.querySelector('[name="firstName"]').value;
        const l = form.querySelector('[name="lastName"]').value;
        const av = mdl.el.querySelector('[data-kt-avdisp]');
        if (av) av.textContent = initials(f, l) || '?';
      }
    }
  });
  // also keep initials live during typing
  document.addEventListener('input', (e) => {
    const mdl = window.__kiwiTeamModal;
    if (mdl && mdl.el && mdl.el.contains(e.target) && (e.target.name === 'firstName' || e.target.name === 'lastName')) {
      const form = mdl.el.querySelector('[data-kt-form]');
      if (form) {
        const f = form.querySelector('[name="firstName"]').value;
        const l = form.querySelector('[name="lastName"]').value;
        const av = mdl.el.querySelector('[data-kt-avdisp]');
        if (av) av.textContent = initials(f, l) || '?';
      }
    }
  });

  handlers['kt-submit-member'] = () => {
    const T = t();
    const mdl = window.__kiwiTeamModal; if (!mdl || !mdl.el) return;
    const st = mdl.el.__ktState; if (!st) return;
    const form = mdl.el.querySelector('[data-kt-form]'); if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());

    // validation
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.function?.trim()) {
      Kiwi.toast(T.vRequired, { type: 'pend' });
      return;
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      Kiwi.toast(T.vInvalidEmail, { type: 'pend' });
      return;
    }
    if ((data.contract === 'CDD' || data.contract === 'Stage') && data.endDate && data.startDate && data.endDate < data.startDate) {
      Kiwi.toast(T.vEndAfterStart, { type: 'pend' });
      return;
    }

    const venueType = st.venueType;
    const members = getMembers(venueType);
    const member = {
      id: st.memberId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: (data.email || '').trim(),
      phone: (data.phone || '').trim(),
      password: (data.password || '').trim() || makePwd(),
      function: data.function,
      department: data.department,
      contract: data.contract,
      startDate: data.startDate || '',
      endDate: (data.contract === 'CDD' || data.contract === 'Stage') ? (data.endDate || '') : '',
      baseSalary: parseFloat(data.baseSalary) || 0,
      hourlyRate: parseFloat(data.hourlyRate) || 0,
      languages: st.languages.slice(),
      address: (data.address || '').trim(),
      cin: (data.cin || '').trim(),
      emergencyName: (data.emergencyName || '').trim(),
      emergencyPhone: (data.emergencyPhone || '').trim(),
      notes: (data.notes || '').trim(),
      avatarTone: st.avatarTone || AVATAR_TONES[Math.floor(Math.random() * AVATAR_TONES.length)],
      venueType,
      createdAt: st.origCreatedAt || Date.now(),
    };

    if (st.editing) {
      const idx = members.findIndex(x => x.id === st.memberId);
      if (idx >= 0) members[idx] = member; else members.push(member);
      Kiwi.toast(T.tUpdated(memberFullName(member)), { type: 'success' });
    } else {
      members.unshift(member);
      // ensure hours map row exists
      const h = window.__kiwiTeamV2.hoursByVenue[venueType] || (window.__kiwiTeamV2.hoursByVenue[venueType] = {});
      h[member.id] = {};
      Kiwi.toast(T.tAdded(memberFullName(member)), { type: 'success', desc: T.tAddedDesc(member.password) });
    }
    mdl.close();
    window.__kiwiTeamModal = null;
    renderRoot();
  };

  /* ═══════════════ VIEW PROFILE MODAL ═══════════════
   * Uses a modal (not a drawer) so it stacks on top of the Équipe drawer
   * without closing it (the drawer() impl auto-dismisses any open drawer).
   * ─────────────────────────────────────────────────────────── */
  handlers['kt-view-profile'] = (_el, id) => {
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    const m = getMembers(venueType).find(x => x.id === id);
    if (!m) return;

    const subtitle = T.profileSub(m.function, m.department);
    const profileDrawer = modal({
      title: memberFullName(m),
      desc: subtitle,
      width: 620,
      body: `
        <style>${MODAL_CSS}</style>
        <div class="kt-profile">
          <div class="kt-profile-head">
            <div class="kt-av ${esc(m.avatarTone || 'a')}" style="width:62px; height:62px; font-size:21px;">${esc(initials(m.firstName, m.lastName))}</div>
            <div class="kt-profile-meta">
              <div class="kt-profile-name">${esc(memberFullName(m))}</div>
              <div class="kt-profile-role">${esc(m.function)} · ${esc(m.department)}</div>
              <div class="kt-profile-tags">
                <span class="chip ${m.contract === 'CDI' ? 'ok' : (m.contract === 'CDD' || m.contract === 'Stage') ? 'pend' : 'neutral'}">${esc(m.contract)}</span>
                ${(m.languages || []).slice(0, 4).map(l => `<span class="chip neutral" style="font-size:10.5px;">${esc(l)}</span>`).join('')}
              </div>
            </div>
          </div>

          ${profileSection(T.secContact, [
            [T.email, m.email],
            [T.phone, m.phone],
            [T.address, m.address],
          ])}

          ${profileSection(T.secAccess, [
            [T.password, `<span class="mono">${esc(m.password || T.placeholderPwd)}</span>`],
          ], true)}

          ${profileSection(T.secContract, [
            [T.contractType, m.contract],
            [T.startDate, m.startDate || '—'],
            ...(m.contract === 'CDD' || m.contract === 'Stage' ? [[T.endDate, m.endDate || '—']] : []),
          ])}

          ${profileSection(T.secComp, [
            [T.baseSalary, `<span class="mono">${(m.baseSalary || 0).toLocaleString('fr-FR')} MAD</span>`],
            [T.hourlyRate, `<span class="mono">${(m.hourlyRate || 0).toLocaleString('fr-FR')} MAD</span>`],
          ], true)}

          ${profileSection(T.cin, [['', m.cin || '—']], true)}

          ${profileSection(T.secEmergency, [
            [T.emergencyName, m.emergencyName || '—'],
            [T.emergencyPhone, m.emergencyPhone || '—'],
          ])}

          ${m.notes ? profileSection(T.secNotes, [['', m.notes]]) : ''}
        </div>
      `,
      foot: `
        <button class="kb ghost" data-action="kt-delete-member" data-arg="${esc(m.id)}" style="color:var(--danger); border-color:rgba(176, 30, 30, 0.22);">${svgTrash()}${esc(T.deleteBtn)}</button>
        <button class="kb primary" data-action="kt-edit-member" data-arg="${esc(m.id)}">${svgEdit()}${esc(T.editBtn)}</button>
      `,
    });
    window.__kiwiTeamProfileDrawer = profileDrawer;
  };

  function profileSection(title, rows, prehtml) {
    const inner = rows.map(([l, v]) => {
      const lbl = l ? `<div class="kt-pf-l">${esc(l)}</div>` : '';
      const val = prehtml ? `<div class="kt-pf-v">${v}</div>` : `<div class="kt-pf-v">${esc(v || '—')}</div>`;
      return `<div class="kt-pf-row">${lbl}${val}</div>`;
    }).join('');
    return `
      <div class="kt-pf-sec">
        <div class="kt-pf-title">${esc(title)}</div>
        ${inner}
      </div>
    `;
  }

  handlers['kt-delete-member'] = (_el, id) => {
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    const members = getMembers(venueType);
    const m = members.find(x => x.id === id); if (!m) return;
    const confirmM = modal({
      title: T.delTitle,
      width: 440,
      body: `<p style="margin:0; color:var(--n-600); font-size:13px; line-height:1.55;">${esc(T.delDesc)}</p>
        <div style="margin-top:14px; padding:12px 14px; background:var(--paper-soft); border:1px solid var(--n-200); border-radius:10px; display:flex; gap:11px; align-items:center;">
          <div class="kt-av ${esc(m.avatarTone || 'a')}" style="width:36px; height:36px; font-size:13px;">${esc(initials(m.firstName, m.lastName))}</div>
          <div>
            <div style="font-weight:600;">${esc(memberFullName(m))}</div>
            <div style="font-size:11.5px; color:var(--n-500);">${esc(m.function)} · ${esc(m.department)}</div>
          </div>
        </div>`,
      foot: `
        <button class="kb ghost" data-dismiss>${esc(T.cancel)}</button>
        <button class="kb" data-action="kt-confirm-delete" data-arg="${esc(id)}" style="background:var(--danger); color:#fff;">${svgTrash()}${esc(T.delConfirm)}</button>
      `,
    });
    confirmM.el.addEventListener('click', (e) => { if (e.target.closest('[data-dismiss]')) confirmM.close(); });
    window.__kiwiTeamConfirmModal = confirmM;
  };

  handlers['kt-confirm-delete'] = (_el, id) => {
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    const members = getMembers(venueType);
    const idx = members.findIndex(x => x.id === id);
    if (idx < 0) return;
    const removed = members.splice(idx, 1)[0];
    // also remove their hours
    const h = window.__kiwiTeamV2.hoursByVenue[venueType] || {};
    delete h[id];
    if (window.__kiwiTeamConfirmModal) { try { window.__kiwiTeamConfirmModal.close(); } catch (_) {} window.__kiwiTeamConfirmModal = null; }
    if (window.__kiwiTeamProfileDrawer) { try { window.__kiwiTeamProfileDrawer.close(); } catch (_) {} window.__kiwiTeamProfileDrawer = null; }
    Kiwi.toast(T.tDeleted(memberFullName(removed)), { type: 'success' });
    renderRoot();
  };

  /* ═══════════════ HOURS HANDLERS ═══════════════ */
  handlers['kt-period'] = (_el, kind) => {
    if (!['week', 'fortnight', 'month', 'custom'].includes(kind)) return;
    const root = window.__kiwiTeamV2;
    root.periodKind = kind;
    root.periodLocked = false;
    // Re-seed hours for the selected period across all members (only days that don't yet exist).
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const vt = venue.type || 'restaurant';
    const period = buildPeriod(kind);
    const members = getMembers(vt);
    const hours = window.__kiwiTeamV2.hoursByVenue[vt] || (window.__kiwiTeamV2.hoursByVenue[vt] = {});
    members.forEach(m => {
      if (!hours[m.id]) hours[m.id] = {};
      period.days.forEach(d => {
        if (hours[m.id][d] == null) {
          // mild realistic seed
          const isOff = (Math.floor(Math.random() * 7) === 0);
          hours[m.id][d] = isOff ? 0 : (4 + Math.floor(Math.random() * 5)) + (Math.random() < 0.3 ? 0.5 : 0);
        }
      });
    });
    renderRoot();
  };

  handlers['kt-quick-entry'] = () => {
    const T = t();
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const venueType = venue.type || 'restaurant';
    const members = getMembers(venueType);
    if (!members.length) { Kiwi.toast('—', { type: 'info' }); return; }
    const today = toISO(new Date());
    const qe = modal({
      title: T.qeTitle,
      width: 440,
      body: `
        <style>${MODAL_CSS}</style>
        <div class="kt-qe-form">
          <label><span class="l">${esc(T.qeMember)}</span>
            <select name="member" data-kt-qe-member>${members.map(m => `<option value="${esc(m.id)}">${esc(memberFullName(m))} · ${esc(m.function)}</option>`).join('')}</select>
          </label>
          <div class="kt-fgrid-2">
            <label><span class="l">${esc(T.qeDate)}</span><input type="date" data-kt-qe-date value="${esc(today)}" /></label>
            <label><span class="l">${esc(T.qeHours)}</span><input type="number" data-kt-qe-hours min="0" max="24" step="0.25" value="8" /></label>
          </div>
          <label><span class="l">${esc(T.qeNote)}</span><input type="text" data-kt-qe-note placeholder="—" /></label>
        </div>
      `,
      foot: `
        <button class="kb ghost" data-dismiss>${esc(T.cancel)}</button>
        <button class="kb atlas" data-action="kt-qe-save">${svgCheck()}${esc(T.qeSave)}</button>
      `,
    });
    qe.el.addEventListener('click', (e) => { if (e.target.closest('[data-dismiss]')) qe.close(); });
    window.__kiwiTeamQuickEntry = qe;
  };

  handlers['kt-qe-save'] = () => {
    const T = t();
    const qe = window.__kiwiTeamQuickEntry; if (!qe || !qe.el) return;
    const venue = window.KiwiVenue?.getCurrentVenueData?.() || { type: 'restaurant' };
    const vt = venue.type || 'restaurant';
    const mid = qe.el.querySelector('[data-kt-qe-member]')?.value;
    const date = qe.el.querySelector('[data-kt-qe-date]')?.value;
    const hVal = parseFloat(qe.el.querySelector('[data-kt-qe-hours]')?.value) || 0;
    if (!mid || !date) { Kiwi.toast('—', { type: 'pend' }); return; }
    const hours = window.__kiwiTeamV2.hoursByVenue[vt] || (window.__kiwiTeamV2.hoursByVenue[vt] = {});
    if (!hours[mid]) hours[mid] = {};
    hours[mid][date] = hVal;
    const m = getMembers(vt).find(x => x.id === mid);
    qe.close();
    window.__kiwiTeamQuickEntry = null;
    renderRoot();
    Kiwi.toast(T.tHourSaved(memberFullName(m || {}), hVal, date), { type: 'success' });
  };

  handlers['kt-export-csv'] = () => {
    const T = t();
    Kiwi.toast(T.tExport, { type: 'success', desc: T.tExportDesc });
  };

  handlers['kt-import-csv'] = () => {
    const T = t();
    Kiwi.toast(T.tImport, { type: 'info', desc: T.tImportDesc });
  };

  handlers['kt-validate-period'] = () => {
    const T = t();
    const root = window.__kiwiTeamV2;
    if (root.periodLocked) return;
    root.periodLocked = true;
    const period = buildPeriod(root.periodKind);
    renderRoot();
    Kiwi.toast(T.tValidated(period.startFr, period.endFr), { type: 'success', desc: T.tValidatedDesc });
  };

  /* ═══════════════ STYLES ═══════════════
   * Scoped via a unique kt- prefix so they don't bleed into other
   * drawers. Injected directly into the drawer body / modal body so
   * we don't need to touch dashboard.html.
   * ─────────────────────────────────────────────────────────── */
  const TEAM_CSS = `
    .kt-tabs { display: inline-flex; gap: 2px; background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 10px; padding: 3px; margin-bottom: 14px; }
    .kt-tab { padding: 8px 16px; border: 0; background: transparent; cursor: pointer; font-size: 12.5px; font-weight: 500; color: var(--n-600); border-radius: 8px; font-family: var(--sans); transition: all 140ms; }
    .kt-tab:hover { color: var(--ink); }
    .kt-tab.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(10,15,13,0.08); }
    .kt-pheader { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; gap: 16px; }
    .kt-count .num { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; color: var(--ink); }
    .kt-count .lbl { font-size: 11.5px; color: var(--n-500); margin-top: 5px; }
    .kt-filterbar { display: grid; grid-template-columns: 1fr 180px 160px 140px; gap: 8px; margin-bottom: 14px; }
    .kt-search { position: relative; }
    .kt-search .ic { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--n-400); pointer-events: none; }
    .kt-search input { width: 100%; padding: 10px 12px 10px 34px; border: 1px solid var(--n-300); border-radius: 9px; font-family: var(--sans); font-size: 13px; background: #fff; color: var(--ink); outline: none; transition: border-color 140ms, box-shadow 140ms; box-sizing: border-box; }
    .kt-search input:focus { border-color: var(--atlas); box-shadow: 0 0 0 3px rgba(11,110,79,0.10); }
    .kt-filterbar select { padding: 10px 30px 10px 12px; border: 1px solid var(--n-300); border-radius: 9px; font-family: var(--sans); font-size: 12.5px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6c65' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; -webkit-appearance: none; color: var(--ink); outline: none; cursor: pointer; transition: border-color 140ms, box-shadow 140ms; }
    .kt-filterbar select:focus { border-color: var(--atlas); box-shadow: 0 0 0 3px rgba(11,110,79,0.10); }

    .kt-empty { padding: 36px 14px; text-align: center; color: var(--n-500); font-size: 13px; background: var(--paper-soft); border: 1px dashed var(--n-300); border-radius: 12px; }

    .kt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .kt-card { background: #fff; border: 1px solid var(--n-200); border-radius: 12px; padding: 14px 14px 12px; cursor: pointer; transition: border-color 160ms, box-shadow 160ms, transform 160ms; display: flex; flex-direction: column; gap: 12px; }
    .kt-card:hover { border-color: var(--atlas); box-shadow: 0 1px 0 rgba(10,15,13,0.04), 0 12px 24px -14px rgba(10,15,13,0.18); transform: translateY(-1px); }
    .kt-card:focus-visible { outline: 2px solid var(--atlas); outline-offset: 2px; }
    .kt-card-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .kt-av { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; font-family: var(--mono); font-weight: 600; color: var(--paper); }
    .kt-av.a { background: var(--atlas); }
    .kt-av.b { background: var(--riad); }
    .kt-av.c { background: #B26B0F; }
    .kt-av.d { background: #2B5C68; }
    .kt-card-id .kt-card-name { font-weight: 600; font-size: 14px; letter-spacing: -0.005em; color: var(--ink); }
    .kt-card-id .kt-card-sub { font-size: 11.5px; color: var(--n-500); margin-top: 3px; }
    .kt-card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; padding-top: 4px; border-top: 1px dashed var(--n-200); padding-bottom: 0; }
    .kt-card-meta .kt-meta { padding-top: 8px; }
    .kt-meta-l { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.10em; color: var(--n-500); margin-bottom: 3px; }
    .kt-meta-v { font-size: 12px; color: var(--ink); display: flex; flex-wrap: wrap; gap: 4px; }
    .kt-meta-v.mono { font-family: var(--mono); font-weight: 600; font-size: 12.5px; }
    .kt-langchip { background: var(--paper-soft); border: 1px solid var(--n-200); padding: 1.5px 6px; border-radius: 5px; font-size: 10px; color: var(--n-700); }
    .kt-card-foot { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding-top: 4px; }
    .kt-btn-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--n-200); background: #fff; color: var(--n-700); font-size: 12px; cursor: pointer; transition: all 140ms; font-family: var(--sans); }
    .kt-btn-ghost:hover { color: var(--ink); border-color: var(--n-300); background: var(--paper-soft); }

    /* HOURS PANE */
    .kt-hbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .kt-pset { display: inline-flex; gap: 2px; background: var(--paper-soft); border: 1px solid var(--n-200); border-radius: 10px; padding: 3px; }
    .kt-pbtn { padding: 7px 13px; border: 0; background: transparent; cursor: pointer; font-size: 12px; color: var(--n-600); border-radius: 8px; font-family: var(--sans); transition: all 140ms; }
    .kt-pbtn:hover { color: var(--ink); }
    .kt-pbtn.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(10,15,13,0.06); font-weight: 500; }
    .kt-hbar-right { display: inline-flex; gap: 6px; flex-wrap: wrap; }
    .kt-h-periodlabel { font-size: 11.5px; color: var(--n-500); margin-bottom: 10px; font-family: var(--mono); letter-spacing: 0.02em; }
    .kt-h-tablewrap { border: 1px solid var(--n-200); border-radius: 12px; overflow-x: auto; background: #fff; }
    .kt-h-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .kt-h-table thead th { background: var(--paper-soft); padding: 10px 8px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.10em; color: var(--n-500); font-weight: 500; text-align: left; text-transform: uppercase; border-bottom: 1px solid var(--n-200); position: sticky; top: 0; }
    .kt-h-table .kt-day-head { text-align: center; min-width: 52px; }
    .kt-h-table .kt-day-head .d { display: block; font-size: 12.5px; color: var(--ink); font-weight: 600; }
    .kt-h-table .kt-day-head .m { display: block; font-size: 9.5px; color: var(--n-500); text-transform: lowercase; letter-spacing: 0.04em; margin-top: 2px; }
    .kt-h-table tbody td { border-top: 1px solid var(--n-200); padding: 9px 8px; vertical-align: middle; }
    .kt-h-table .kt-h-member { display: flex; align-items: center; gap: 9px; min-width: 180px; }
    .kt-h-table .kt-h-member .n { font-weight: 600; font-size: 12.5px; }
    .kt-h-table .kt-h-member .r { font-size: 10.5px; color: var(--n-500); }
    .kt-h-table .kt-day-cell { text-align: center; padding: 7px 4px; }
    .kt-h-table .kt-day-cell input { width: 48px; padding: 5px 4px; border: 1px solid var(--n-200); border-radius: 6px; font-family: var(--mono); font-size: 12px; background: #fff; color: var(--ink); text-align: center; outline: none; -moz-appearance: textfield; }
    .kt-h-table .kt-day-cell input::-webkit-outer-spin-button, .kt-h-table .kt-day-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .kt-h-table .kt-day-cell input:focus { border-color: var(--atlas); box-shadow: 0 0 0 2px rgba(11,110,79,0.12); }
    .kt-h-table .kt-day-cell.today { background: rgba(125, 242, 176, 0.10); }
    .kt-h-table .kt-day-cell.locked input { background: var(--paper-soft); color: var(--n-500); cursor: not-allowed; }
    .kt-h-table .kt-h-total, .kt-h-table .kt-h-pay { text-align: right; min-width: 80px; padding-right: 14px; }
    .kt-h-table .kt-h-total b, .kt-h-table .kt-h-pay b { font-size: 13px; color: var(--ink); }
    .kt-h-table .kt-h-total span, .kt-h-table .kt-h-pay span { color: var(--n-500); font-size: 10px; margin-left: 3px; font-weight: 400; }
    .kt-h-table tfoot td { padding: 11px 8px; background: var(--paper-soft); border-top: 2px solid var(--ink); font-size: 12.5px; }
    .kt-h-table .kt-h-foot-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.10em; color: var(--n-700); text-transform: uppercase; padding-left: 16px; }
    .kt-h-table .kt-h-foot-tot b { font-size: 14px; color: var(--ink); }
    .kt-h-table .kt-h-foot-tot span { color: var(--n-500); font-size: 10px; margin-left: 3px; font-weight: 400; }
  `;

  const MODAL_CSS = `
    [data-kt-form] .kt-fsec, .kt-profile .kt-pf-sec, .kt-qe-form, .kt-profile-head { margin-bottom: 18px; }
    [data-kt-form] .kt-fseclabel { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--n-500); text-transform: uppercase; margin-bottom: 9px; }
    [data-kt-form] label { display: block; margin-bottom: 10px; }
    [data-kt-form] label .l, .kt-qe-form label .l { display: block; font-size: 11px; color: var(--n-600); margin-bottom: 5px; font-weight: 500; }
    [data-kt-form] input[type=text],
    [data-kt-form] input[type=email],
    [data-kt-form] input[type=tel],
    [data-kt-form] input[type=number],
    [data-kt-form] input[type=date],
    [data-kt-form] select,
    [data-kt-form] textarea,
    .kt-qe-form input,
    .kt-qe-form select {
      width: 100%; padding: 9px 11px; border: 1px solid var(--n-300); border-radius: 8px; font-family: var(--sans); font-size: 13px; background: #fff; color: var(--ink); outline: none; box-sizing: border-box; transition: border-color 140ms, box-shadow 140ms;
    }
    [data-kt-form] input:focus, [data-kt-form] select:focus, [data-kt-form] textarea:focus, .kt-qe-form input:focus, .kt-qe-form select:focus { border-color: var(--atlas); box-shadow: 0 0 0 3px rgba(11,110,79,0.10); }
    [data-kt-form] textarea { resize: vertical; min-height: 70px; font-family: var(--sans); }
    [data-kt-form] select { appearance: none; -webkit-appearance: none; padding-right: 30px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6c65' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center; cursor: pointer; }
    [data-kt-form] .kt-frow { display: grid; grid-template-columns: 110px 1fr; gap: 16px; align-items: flex-start; }
    [data-kt-form] .kt-fgrid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    [data-kt-form] .kt-fgrid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    [data-kt-form] .kt-photo { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    [data-kt-form] .kt-photo .av-disp { width: 96px; height: 96px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 600; font-size: 32px; color: var(--paper); }
    [data-kt-form] .kt-photo .av-disp.a { background: var(--atlas); }
    [data-kt-form] .kt-photo .av-disp.b { background: var(--riad); }
    [data-kt-form] .kt-photo .av-disp.c { background: #B26B0F; }
    [data-kt-form] .kt-photo .av-disp.d { background: #2B5C68; }
    [data-kt-form] .kt-photo-btn { background: var(--paper-soft); border: 1px dashed var(--n-300); padding: 6px 10px; border-radius: 7px; font-size: 11px; color: var(--n-600); cursor: pointer; font-family: var(--sans); }
    [data-kt-form] .kt-photo-btn:hover { border-color: var(--atlas); color: var(--atlas); }
    [data-kt-form] .kt-pwd-label .kt-pwd-row { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; }
    [data-kt-form] .kt-fbtn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 7px 10px; border: 1px solid var(--n-200); background: #fff; color: var(--n-700); border-radius: 7px; cursor: pointer; font-size: 11.5px; font-family: var(--sans); transition: all 140ms; }
    [data-kt-form] .kt-fbtn-ghost:hover { border-color: var(--atlas); color: var(--atlas); background: var(--paper-soft); }
    [data-kt-form] .kt-langwrap { display: flex; flex-wrap: wrap; gap: 6px; }
    [data-kt-form] .kt-lang-chip { background: #fff; border: 1px solid var(--n-300); padding: 6px 11px; border-radius: 999px; font-size: 11.5px; cursor: pointer; transition: all 140ms; color: var(--n-700); font-family: var(--sans); }
    [data-kt-form] .kt-lang-chip:hover { border-color: var(--atlas); color: var(--atlas); }
    [data-kt-form] .kt-lang-chip.on { background: var(--atlas); color: var(--paper); border-color: var(--atlas); }
    [data-kt-form] [data-kt-end-wrap][hidden] { display: none; }
    .kt-qe-form .kt-fgrid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .kt-qe-form label { display: block; margin-bottom: 10px; }

    /* PROFILE DRAWER */
    .kt-profile-head { display: grid; grid-template-columns: 62px 1fr; gap: 16px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--n-200); margin-bottom: 18px; }
    .kt-profile-name { font-size: 19px; font-weight: 600; letter-spacing: -0.015em; color: var(--ink); }
    .kt-profile-role { font-size: 12.5px; color: var(--n-500); margin-top: 3px; }
    .kt-profile-tags { display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap; }
    .kt-pf-sec { padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--n-200); }
    .kt-pf-sec:last-of-type { border-bottom: 0; }
    .kt-pf-title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--n-500); text-transform: uppercase; margin-bottom: 8px; }
    .kt-pf-row { display: grid; grid-template-columns: 160px 1fr; gap: 12px; align-items: baseline; padding: 4px 0; }
    .kt-pf-l { font-size: 12px; color: var(--n-500); }
    .kt-pf-v { font-size: 13px; color: var(--ink); word-break: break-word; }
  `;
})();
