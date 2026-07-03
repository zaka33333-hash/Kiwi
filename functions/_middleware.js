// Kiwi — full-site passcode gate (Cloudflare Pages Function).
//
// Real, server-side protection: until the visitor enters the shared passcode,
// NOTHING is served — no page, no CSS, no image. This runs on every request at
// the edge, so it is not bypassable via view-source the way a client-side JS
// overlay would be. It runs only on Cloudflare Pages (it is inert on the local
// static server and on GitHub Pages), and it is free on the CF Pages tier.
//
// ── Turn it ON ──────────────────────────────────────────────────────────────
// In the Cloudflare Pages dashboard → Settings → Environment variables, add:
//     SITE_PASSWORD = <the passcode you hand the client>
// Leave SITE_PASSWORD unset to disable the gate (the site then serves openly).
// The passcode is stored ONLY in Cloudflare — never in this repo.
//
// To change or revoke access, edit SITE_PASSWORD in Cloudflare and redeploy;
// old cookies stop validating immediately because they are derived from it.

const COOKIE = 'kiwi_gate';
const UNLOCK_PATH = '/__unlock';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Cookie value = HMAC-SHA256("kiwi-gate-v1", passcode). An attacker who does not
// know the passcode cannot forge it, so a stolen/guessed cookie is not possible.
async function expectedToken(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('kiwi-gate-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.SITE_PASSWORD;

  // Gate disabled when no passcode is configured — the site serves openly.
  if (!password) return next();

  const token = await expectedToken(password);

  // Already unlocked → serve the real site.
  if (readCookie(request, COOKIE) === token) return next();

  const url = new URL(request.url);

  // Unlock attempt.
  if (request.method === 'POST' && url.pathname === UNLOCK_PATH) {
    const form = await request.formData();
    const tried = (form.get('passcode') || '').toString();
    if (tried === password) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return new Response(gatePage(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  // Locked → show the branded passcode screen for any path.
  return new Response(gatePage(false), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Self-contained (no external assets — it must render while the site is locked).
function gatePage(error) {
  const err = error
    ? `<p class="err" role="alert">Code incorrect. Réessayez.</p>`
    : `<p class="sub">Cet espace est réservé. Entrez votre code d'accès pour continuer.</p>`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<title>Kiwi · Accès privé</title>
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
    width:100%; max-width:400px; background:var(--surface);
    border:1px solid var(--line); border-radius:22px;
    padding:38px 32px 30px; text-align:center;
    box-shadow:0 24px 60px -28px rgba(5,59,44,.35), 0 2px 6px rgba(5,59,44,.06);
  }
  .mark{
    width:52px; height:52px; margin:0 auto 20px; border-radius:15px;
    background:linear-gradient(140deg,var(--atlas),var(--riad));
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 22px -10px rgba(11,110,79,.7);
  }
  .mark svg{width:28px;height:28px}
  h1{font-size:1.42rem; letter-spacing:-.02em; margin:0 0 6px}
  .sub,.err{margin:0 auto 22px; max-width:31ch; font-size:.95rem}
  .sub{color:var(--muted)}
  .err{color:#b0402f; font-weight:560}
  form{display:flex; flex-direction:column; gap:12px; text-align:left}
  label{font-size:.78rem; font-weight:600; letter-spacing:.02em; color:var(--riad); text-transform:uppercase}
  input{
    font:inherit; padding:14px 16px; border:1.5px solid var(--line);
    border-radius:13px; background:var(--paper); color:var(--ink);
    letter-spacing:.14em; transition:border-color .18s, box-shadow .18s;
  }
  input::placeholder{letter-spacing:normal; color:#a7b0aa}
  input:focus{outline:none; border-color:var(--atlas); box-shadow:0 0 0 4px rgba(11,110,79,.14)}
  button{
    margin-top:4px; font:inherit; font-weight:640; color:#eafff4; cursor:pointer;
    padding:14px 16px; border:0; border-radius:13px;
    background:linear-gradient(135deg,var(--atlas),var(--riad));
    transition:transform .12s ease, box-shadow .2s ease;
    box-shadow:0 10px 24px -12px rgba(11,110,79,.85);
  }
  button:hover{transform:translateY(-1px)}
  button:active{transform:translateY(0)}
  .foot{margin:22px 0 0; font-size:.74rem; color:var(--muted); letter-spacing:.02em}
  @media (prefers-color-scheme:dark){
    :root{--paper:#0d1411; --ink:#e8efe9; --surface:#151b18; --line:#26302b; --muted:#93a89c}
    body{background:radial-gradient(1100px 620px at 50% -10%, rgba(125,242,176,.12), transparent 60%), var(--paper)}
    input{background:#0f1613}
    .err{color:#ff9d8a}
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
    <h1>Accès privé</h1>
    ${err}
    <form method="POST" action="${UNLOCK_PATH}">
      <label for="passcode">Code d'accès</label>
      <input id="passcode" name="passcode" type="password" inputmode="text"
             autocomplete="off" autofocus placeholder="••••••••" aria-label="Code d'accès" />
      <button type="submit">Entrer</button>
    </form>
    <p class="foot">Kiwi · démonstration réservée</p>
  </main>
</body>
</html>`;
}
