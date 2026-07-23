// Kiwi — full-site account gate (Cloudflare Pages Function).
//
// Real, server-side protection: until the visitor is authenticated, NOTHING is
// served — no page, no CSS, no image. This runs on every request at the edge, so
// it is not bypassable via view-source the way a client-side overlay would be. It
// runs only on Cloudflare Pages (inert on the local static server and on GitHub
// Pages), and it is free on the CF Pages tier.
//
// Two ways in, checked in this order:
//   1. Account session — a merchant who signed up / logged in (email + password).
//      Handled by /auth/* (see functions/auth/*). Session = HMAC-signed cookie,
//      verified here with AUTH_SECRET.
//   2. Staff bypass — the shared passcode in SITE_PASSWORD, entered once via the
//      "Accès équipe" field. Lets the owner + partner demo without an account and
//      never get locked out. Handled here (POST /__unlock), cookie = HMAC(pass).
//
// ── Configure (Cloudflare Pages → Settings → Variables & Secrets) ─────────────
//   AUTH_SECRET   = <random 32-byte hex>   (secret; signs account sessions)
//   SITE_PASSWORD = <staff passcode>       (optional; enables the staff bypass)
//   LEADS_WEBHOOK = <Google Apps Script /exec URL>  (optional; mirrors signups)
// With NEITHER AUTH_SECRET nor SITE_PASSWORD set, the site serves openly (dev).
// Changing a variable requires a fresh deployment (not "Retry") to take effect.

import {
  readSession, readCookie, SESS_COOKIE,
  operatorToken, OP_COOKIE, verifyPassword,
} from './auth/_lib.js';

const GATE_COOKIE = 'kiwi_gate';
const UNLOCK_PATH = '/__unlock';
const OPERATOR_PATH = '/__operator';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Staff cookie value = HMAC-SHA256("kiwi-gate-v1", passcode). Unforgeable without
// the passcode, so a stolen/guessed cookie cannot be constructed.
async function expectedToken(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('kiwi-gate-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const authSecret = env.AUTH_SECRET;
  const sitePassword = env.SITE_PASSWORD;

  // Nothing configured → open site (local dev / preview without secrets).
  if (!authSecret && !sitePassword) return next();

  // 1. Valid account session?
  if (authSecret) {
    const token = readCookie(request, SESS_COOKIE);
    if (token && await readSession(token, authSecret)) return next();
  }

  // 2. Valid staff bypass cookie?
  if (sitePassword) {
    const staff = await expectedToken(sitePassword);
    if (readCookie(request, GATE_COOKIE) === staff) return next();
  }

  // 3. Valid operator cookie? (Kiwi's own back-office — reaches kiwi-admin.html.)
  if (authSecret) {
    const op = await operatorToken(authSecret);
    if (readCookie(request, OP_COOKIE) === op) return next();
  }

  // Not authorized. The /auth/* endpoints must still run so the screen works.
  if (path.startsWith('/auth/')) return next();

  // Staff unlock attempt (shared passcode).
  if (sitePassword && request.method === 'POST' && path === UNLOCK_PATH) {
    const form = await request.formData();
    const tried = (form.get('passcode') || '').toString();
    if (tried === sitePassword) {
      const staff = await expectedToken(sitePassword);
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${GATE_COOKIE}=${staff}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return htmlResponse(authPage({ staffError: true, allowStaff: true }));
  }

  // Operator unlock attempt — a code from the `operators` table, revealed by the
  // hidden long-press gesture on the logo. Lands on the operator console.
  if (authSecret && request.method === 'POST' && path === OPERATOR_PATH) {
    const form = await request.formData();
    const tried = (form.get('code') || '').toString();
    let ok = false;
    if (env.DB && tried) {
      try {
        const rows = await env.DB.prepare('SELECT salt, hash FROM operators').all();
        for (const r of (rows.results || [])) {
          if (await verifyPassword(tried, r.salt, r.hash)) { ok = true; break; }
        }
      } catch (_) { /* table missing / db error → treated as no match */ }
    }
    if (ok) {
      const op = await operatorToken(authSecret);
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/kiwi-admin.html',
          'Set-Cookie': `${OP_COOKIE}=${op}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return htmlResponse(authPage({ allowStaff: !!sitePassword, operatorError: true }));
  }

  // Locked → show the account screen.
  return htmlResponse(authPage({ allowStaff: !!sitePassword }));
}

function htmlResponse(body) {
  return new Response(body, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Self-contained login / signup screen — no external assets (it must render
// while the site is locked). Brand tokens inlined; dark-mode aware. The tab pill
// uses the brand's signature spring easing. Client JS posts JSON to /auth/* and
// reloads on success; no innerHTML, no eval.
function authPage(opts) {
  const staffError = opts && opts.staffError;
  const allowStaff = opts && opts.allowStaff;
  const operatorError = opts && opts.operatorError;
  // Operator prompt — no visible affordance. Revealed only by a long-press on the
  // logo (see the script below), or shown pre-open when a code was rejected.
  const operatorBlock = `
    <form class="staff op" id="op-form" method="POST" action="${OPERATOR_PATH}"${operatorError ? '' : ' hidden'}>
      ${operatorError ? `<p class="err staff-err" role="alert">Code opérateur incorrect.</p>` : ''}
      <div class="staff-row">
        <input name="code" type="password" inputmode="numeric" autocomplete="off" placeholder="Code opérateur" aria-label="Code opérateur" />
        <button type="submit">Entrer</button>
      </div>
    </form>`;
  const staffBlock = allowStaff ? `
    <button type="button" class="staff-link" id="staff-toggle">Accès équipe</button>
    <form class="staff" id="staff-form" method="POST" action="${UNLOCK_PATH}"${staffError ? '' : ' hidden'}>
      ${staffError ? `<p class="err staff-err" role="alert">Code équipe incorrect.</p>` : ''}
      <div class="staff-row">
        <input name="passcode" type="password" inputmode="text" autocomplete="off" placeholder="Code équipe" aria-label="Code équipe" />
        <button type="submit">Entrer</button>
      </div>
    </form>` : '';

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<title>Kiwi · Votre compte</title>
<style>
  :root{
    --atlas:#0B6E4F; --riad:#053B2C; --mint:#7DF2B0;
    --paper:#F7F5F0; --ink:#0A0F0D; --line:#e7e3da; --muted:#5d6b63; --surface:#fff;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0; background:
      radial-gradient(1100px 620px at 50% -10%, rgba(125,242,176,.20), transparent 60%),
      var(--paper);
    color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Inter Tight",Inter,"Segoe UI",sans-serif;
    display:flex; align-items:center; justify-content:center; padding:24px;
  }
  .card{
    width:100%; max-width:412px; background:var(--surface);
    border:1px solid var(--line); border-radius:22px;
    padding:34px 30px 26px; text-align:center;
    box-shadow:0 24px 60px -28px rgba(5,59,44,.35), 0 2px 6px rgba(5,59,44,.06);
  }
  .mark{
    width:50px; height:50px; margin:0 auto 16px; border-radius:15px;
    background:linear-gradient(140deg,var(--atlas),var(--riad));
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 22px -10px rgba(11,110,79,.7);
    -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;
  }
  .op{margin-top:12px}
  .mark svg{width:27px;height:27px}
  h1{font-size:1.34rem; letter-spacing:-.02em; margin:0 0 4px}
  .sub{margin:0 auto 22px; max-width:32ch; font-size:.92rem; color:var(--muted)}
  .tabs{position:relative; display:grid; grid-template-columns:1fr 1fr; gap:0;
    background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:4px; margin:0 0 20px}
  .tab{position:relative; z-index:1; border:0; background:transparent; font:inherit; font-weight:600;
    padding:11px 8px; border-radius:10px; cursor:pointer; color:var(--muted); transition:color .2s}
  .tab[aria-selected="true"]{color:var(--riad)}
  .pill{position:absolute; z-index:0; top:4px; bottom:4px; left:4px; width:calc(50% - 4px);
    background:var(--surface); border-radius:10px; box-shadow:0 2px 8px rgba(5,59,44,.14);
    transition:transform .31s cubic-bezier(0.34,1.45,0.5,1)}
  .tabs[data-mode="signup"] .pill{transform:translateX(100%)}
  form.pane{display:flex; flex-direction:column; gap:12px; text-align:left; margin:0}
  form.pane.hidden{display:none}
  label{display:flex; flex-direction:column; gap:6px; font-size:.72rem; font-weight:600;
    letter-spacing:.03em; color:var(--riad); text-transform:uppercase}
  input{font:inherit; text-transform:none; letter-spacing:normal; padding:13px 15px;
    border:1.5px solid var(--line); border-radius:12px; background:var(--paper); color:var(--ink);
    transition:border-color .18s, box-shadow .18s}
  input::placeholder{color:#a7b0aa}
  input:focus{outline:none; border-color:var(--atlas); box-shadow:0 0 0 4px rgba(11,110,79,.14)}
  .hint{margin:-4px 0 0; font-size:.76rem; color:var(--muted)}
  .err{margin:2px 0 0; color:#b0402f; font-weight:560; font-size:.85rem; min-height:1.1em}
  .go{margin-top:6px; font:inherit; font-weight:640; color:#eafff4; cursor:pointer;
    padding:14px; border:0; border-radius:12px;
    background:linear-gradient(135deg,var(--atlas),var(--riad));
    box-shadow:0 10px 24px -12px rgba(11,110,79,.85); transition:transform .12s, box-shadow .2s}
  .go:hover{transform:translateY(-1px)}
  .go:disabled{opacity:.55; cursor:default; transform:none}
  .staff-link{margin:18px auto 0; display:block; background:none; border:0; color:var(--muted);
    font:inherit; font-size:.78rem; cursor:pointer; text-decoration:underline; text-underline-offset:3px}
  .staff{margin:12px 0 0}
  .staff-row{display:flex; gap:8px}
  .staff input{flex:1}
  .staff button{border:0; border-radius:10px; padding:0 16px; background:var(--riad);
    color:#eafff4; font:inherit; font-weight:600; cursor:pointer}
  .staff-err{text-align:left; margin:0 0 8px}
  .foot{margin:22px 0 0; font-size:.72rem; color:var(--muted)}
  @media (prefers-color-scheme:dark){
    :root{--paper:#0d1411; --ink:#e8efe9; --surface:#151b18; --line:#26302b; --muted:#93a89c}
    body{background:radial-gradient(1100px 620px at 50% -10%, rgba(125,242,176,.12), transparent 60%), var(--paper)}
    .tabs,input{background:#0f1613}
    .pill{background:#1c2420}
    .err,.staff-err{color:#ff9d8a}
  }
</style>
</head>
<body>
  <main class="card">
    <div class="mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3C7 5 5 9 5 13a7 7 0 0 0 14 0c0-4-2-8-7-10Z" fill="#7DF2B0"/>
        <path d="M12 6.5c-2.6 1.3-3.8 3.8-3.8 6.5" stroke="#053B2C" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h1>Bienvenue sur Kiwi</h1>
    <p class="sub">Créez votre compte ou connectez-vous pour accéder à votre espace.</p>

    <div class="tabs" data-mode="login">
      <button type="button" class="tab" id="tab-login" aria-selected="true">Se connecter</button>
      <button type="button" class="tab" id="tab-signup" aria-selected="false">Créer un compte</button>
      <span class="pill" aria-hidden="true"></span>
    </div>

    <form class="pane" id="form-login" novalidate>
      <label>E-mail
        <input id="li-email" type="email" autocomplete="email" placeholder="vous@exemple.ma" required />
      </label>
      <label>Mot de passe
        <input id="li-pass" type="password" autocomplete="current-password" placeholder="••••••••" required />
      </label>
      <p class="err" id="li-err" role="alert"></p>
      <button class="go" type="submit">Se connecter</button>
    </form>

    <form class="pane hidden" id="form-signup" novalidate>
      <label>Nom
        <input id="su-name" type="text" autocomplete="name" placeholder="Prénom Nom" required />
      </label>
      <label>Établissement
        <input id="su-biz" type="text" autocomplete="organization" placeholder="Café Atlas" />
      </label>
      <label>E-mail
        <input id="su-email" type="email" autocomplete="email" placeholder="vous@exemple.ma" required />
      </label>
      <label>Mot de passe
        <input id="su-pass" type="password" autocomplete="new-password" placeholder="8 caractères min." minlength="8" required />
      </label>
      <p class="hint">Au moins 8 caractères.</p>
      <p class="err" id="su-err" role="alert"></p>
      <button class="go" type="submit">Créer mon compte</button>
    </form>
    ${staffBlock}
    ${operatorBlock}
    <p class="foot">Kiwi · espace commerçant</p>
  </main>
<script>
(function(){
  var tabs = document.querySelector('.tabs');
  var tLogin = document.getElementById('tab-login');
  var tSignup = document.getElementById('tab-signup');
  var fLogin = document.getElementById('form-login');
  var fSignup = document.getElementById('form-signup');
  function setMode(m){
    var login = m === 'login';
    tabs.setAttribute('data-mode', m);
    fLogin.classList.toggle('hidden', !login);
    fSignup.classList.toggle('hidden', login);
    tLogin.setAttribute('aria-selected', login ? 'true' : 'false');
    tSignup.setAttribute('aria-selected', login ? 'false' : 'true');
  }
  tLogin.addEventListener('click', function(){ setMode('login'); });
  tSignup.addEventListener('click', function(){ setMode('signup'); });

  var MSG = {
    email: 'Adresse e-mail invalide.',
    name: 'Indiquez votre nom.',
    weak: 'Mot de passe : 8 caractères minimum.',
    exists: 'Cet e-mail a déjà un compte — connectez-vous.',
    'bad-creds': 'E-mail ou mot de passe incorrect.',
    'bad-json': 'Requête invalide.',
    'not-configured': 'Service momentanément indisponible.'
  };
  function fail(code){ return MSG[code] || 'Une erreur est survenue. Réessayez.'; }
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }

  function post(u, data, errEl, btn){
    errEl.textContent = '';
    btn.disabled = true;
    fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })
      .then(function(r){
        if (r.ok){ location.reload(); return; }
        return r.json().then(function(j){ errEl.textContent = fail(j && j.error); btn.disabled = false; },
                             function(){ errEl.textContent = fail(); btn.disabled = false; });
      })
      .catch(function(){ errEl.textContent = 'Erreur réseau. Réessayez.'; btn.disabled = false; });
  }

  fLogin.addEventListener('submit', function(e){
    e.preventDefault();
    post('/auth/login', { email: val('li-email'), password: val('li-pass') },
         document.getElementById('li-err'), fLogin.querySelector('.go'));
  });
  fSignup.addEventListener('submit', function(e){
    e.preventDefault();
    post('/auth/signup', { name: val('su-name'), business: val('su-biz'), email: val('su-email'), password: val('su-pass') },
         document.getElementById('su-err'), fSignup.querySelector('.go'));
  });

  var staffToggle = document.getElementById('staff-toggle');
  var staffForm = document.getElementById('staff-form');
  if (staffToggle && staffForm){
    staffToggle.addEventListener('click', function(){
      staffForm.hidden = !staffForm.hidden;
      if (!staffForm.hidden){ var i = staffForm.querySelector('input'); if (i) i.focus(); }
    });
  }

  // Hidden operator entry — long-press (~1.4s) the logo to reveal the code prompt.
  // No visible affordance; clients never stumble onto it.
  var mark = document.querySelector('.mark');
  var opForm = document.getElementById('op-form');
  if (mark && opForm){
    var hold = null;
    var reveal = function(){ opForm.hidden = false; var i = opForm.querySelector('input'); if (i) i.focus(); };
    var start = function(){ cancel(); hold = setTimeout(reveal, 1400); };
    var cancel = function(){ if (hold){ clearTimeout(hold); hold = null; } };
    mark.addEventListener('mousedown', start);
    mark.addEventListener('touchstart', start, { passive: true });
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(function(ev){ mark.addEventListener(ev, cancel); });
  }
})();
</script>
</body>
</html>`;
}
