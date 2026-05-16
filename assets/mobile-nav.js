/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · mobile navigation
 * Builds the phone-only chrome: a bottom tab bar and a hamburger that turns
 * the desktop sidebar into an off-canvas menu drawer. Everything is injected
 * once and stays display:none until the phone breakpoint (see mobile.css), so
 * the desktop layout is never touched.
 *
 * The sidebar itself is reused as-is — its nav uses event delegation on
 * `.sidebar nav a`, so sliding it on-screen keeps every handler working.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* Icons — stroked, 24-grid */
  const I = {
    home:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.7V21h14V9.7"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
    team:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M3.5 20a5.6 5.6 0 0 1 11 0"/><path d="M16.2 5.3a3.4 3.4 0 0 1 0 5.4M17 20a5.6 5.6 0 0 0-3.2-5"/></svg>',
    menu:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  };
  const MERCHANT = 'assets/landing/icons/merchant.png';

  function runHandler(name) {
    const h = window.Kiwi && window.Kiwi.handlers && window.Kiwi.handlers[name];
    if (typeof h === 'function') { h(); return true; }
    return false;
  }

  ready(function () {
    /* Idempotent — never inject the mobile chrome twice. */
    if (document.querySelector('.kw-tabbar')) return;
    const topbarInner = document.querySelector('.topbar > .topbar-inner');
    if (!topbarInner) return;

    const sidebar = document.querySelector('.sidebar');
    const app = document.querySelector('.app');
    if (sidebar && !sidebar.id) sidebar.id = 'kw-sidebar';
    if (sidebar) {
      sidebar.setAttribute('aria-label', 'Menu principal');
      sidebar.setAttribute('aria-hidden', 'true');
    }

    /* ── Re-home the sidebar so position:fixed actually anchors ──
     * .app carries a transform (reveal/lock animation) → it is a containing
     * block, which would trap a fixed-position sidebar in its coordinate
     * space. On phones the sidebar lives directly under <body>; on desktop
     * it returns to .app as the first grid column. */
    const phoneMq = window.matchMedia('(max-width: 860px)');
    function placeSidebar() {
      if (!sidebar || !app) return;
      if (phoneMq.matches) {
        if (sidebar.parentElement !== document.body) document.body.appendChild(sidebar);
      } else if (sidebar.parentElement !== app) {
        app.insertBefore(sidebar, app.firstElementChild);
      }
    }
    placeSidebar();
    phoneMq.addEventListener('change', placeSidebar);

    /* ── Hamburger + centred wordmark into the topbar ── */
    topbarInner.insertAdjacentHTML('afterbegin',
      `<button class="kw-hamburger" type="button" aria-label="Ouvrir le menu"
               aria-controls="kw-sidebar" aria-expanded="false">${I.menu}</button>
       <button class="kw-topbar-brand" type="button" aria-label="Revenir en haut du tableau de bord">kiwi<i></i></button>`);
    const hamburger = topbarInner.querySelector('.kw-hamburger');
    /* Tapping the centred wordmark scrolls back to the top of the dashboard. */
    topbarInner.querySelector('.kw-topbar-brand').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ── Backdrop for the off-canvas menu ── */
    const backdrop = document.createElement('div');
    backdrop.className = 'kw-menu-backdrop';
    document.body.appendChild(backdrop);

    /* ── Menu open / close — centralised so aria + focus stay correct ── */
    let lastFocus = null;
    function isMenuOpen() { return document.body.classList.contains('kw-menu-open'); }
    function openMenu() {
      if (isMenuOpen()) return;
      lastFocus = document.activeElement;
      document.body.classList.add('kw-menu-open');
      hamburger.setAttribute('aria-expanded', 'true');
      if (sidebar) {
        sidebar.setAttribute('aria-hidden', 'false');
        const first = sidebar.querySelector('nav a, [role="button"]');
        if (first) setTimeout(() => first.focus(), 340);
      }
    }
    function closeMenu() {
      if (!isMenuOpen()) return;
      document.body.classList.remove('kw-menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
      if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    }
    function toggleMenu() { isMenuOpen() ? closeMenu() : openMenu(); }

    hamburger.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', closeMenu);

    /* Close every open drawer / modal / palette cleanly — calling each
     * surface's real close path so the page scroll-lock stays balanced. */
    function closeOverlays() {
      document.querySelectorAll('.kiwi-drawer-backdrop').forEach((b) => {
        if (typeof b.__kiwiClose === 'function') b.__kiwiClose();
        else b.remove();
      });
      document.querySelectorAll('.kiwi-backdrop').forEach((b) => {
        const btn = b.querySelector('.kiwi-modal-close');
        if (btn) btn.click();   // runs close() → unlockPageScroll()
        else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
    }

    /* ── Bottom tab bar ── */
    const tabbar = document.createElement('nav');
    tabbar.className = 'kw-tabbar';
    tabbar.setAttribute('aria-label', 'Navigation');
    tabbar.insertAdjacentHTML('beforeend', `
      <button class="kw-tab on" data-kw-tab="accueil" type="button">
        ${I.home}<span class="kw-tab-l">Accueil</span>
      </button>
      <button class="kw-tab" data-kw-tab="commandes" type="button">
        ${I.orders}<span class="kw-tab-l">Commandes</span>
      </button>
      <button class="kw-tab kw-tab-ai" data-kw-tab="ai" type="button" aria-label="Kiwi AI">
        <span class="kw-tab-ico"><img src="${MERCHANT}" alt="" width="20" height="20" decoding="async"/></span>
        <span class="kw-tab-l">Kiwi AI</span>
      </button>
      <button class="kw-tab" data-kw-tab="equipe" type="button">
        ${I.team}<span class="kw-tab-l">Équipe</span>
      </button>
      <button class="kw-tab" data-kw-tab="menu" type="button"
              aria-controls="kw-sidebar" aria-expanded="false">
        ${I.menu}<span class="kw-tab-l">Menu</span>
      </button>
    `);
    document.body.appendChild(tabbar);

    const tabs = [...tabbar.querySelectorAll('.kw-tab')];
    const menuTab = tabbar.querySelector('[data-kw-tab="menu"]');
    function setActive(key) {
      tabs.forEach((t) => t.classList.toggle('on', t.dataset.kwTab === key));
    }
    /* Keep the menu tab's aria in sync whenever the menu state changes. */
    function syncMenuAria() {
      menuTab.setAttribute('aria-expanded', String(isMenuOpen()));
    }

    tabbar.addEventListener('click', (e) => {
      const tab = e.target.closest('.kw-tab');
      if (!tab) return;
      const key = tab.dataset.kwTab;

      if (key === 'menu') { toggleMenu(); syncMenuAria(); return; }
      closeMenu(); syncMenuAria();

      if (key === 'accueil') {
        closeOverlays();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const home = document.querySelector('.sidebar nav a[data-nav="accueil"]');
        if (home) {
          home.parentElement.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
          home.classList.add('active');
        }
        setActive('accueil');
      } else if (key === 'commandes') {
        runHandler('nav-transactions'); setActive('commandes');
      } else if (key === 'equipe') {
        runHandler('nav-equipe'); setActive('equipe');
      } else if (key === 'ai') {
        runHandler('open-assistant'); setActive('ai');
      }
    });

    /* Tapping a destination inside the menu closes the menu. */
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        if (e.target.closest('nav a[data-nav]') || e.target.closest('.merchant')) {
          setTimeout(() => { closeMenu(); syncMenuAria(); }, 60);
        }
      });
    }

    /* Esc closes the menu. */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen()) { closeMenu(); syncMenuAria(); }
    });

    /* Re-sync the active tab: once every drawer/overlay is gone the merchant
     * is back on the home view, so the highlight returns to Accueil. */
    const resync = new MutationObserver(() => {
      const anyOverlay = document.querySelector('.kiwi-drawer-backdrop, .kiwi-backdrop');
      if (!anyOverlay && !tabs[0].classList.contains('on')) setActive('accueil');
    });
    resync.observe(document.body, { childList: true });
  });
})();
