// GET /api/me — the logged-in account's OWN identity, so a real merchant sees
// their name / business instead of the demo owner ("Rachid" · "Café Atlas").
//
// Strictly session-scoped: the account is derived from the signed session cookie
// (never a query param or body), so a caller can only ever read themselves. A
// request with no account session — the local demo, the staff-bypass gate, or an
// operator cookie — gets { authenticated:false } and the client leaves the demo
// identity in place. No DB / not configured ⇒ also { authenticated:false }, so a
// static host (GitHub Pages) simply keeps demoing. Never cached (json → no-store).

import { json, readSession, readCookie, SESS_COOKIE } from '../auth/_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_SECRET) return json({ authenticated: false });

  const sess = await readSession(readCookie(request, SESS_COOKIE), env.AUTH_SECRET);
  if (!sess || !sess.aid) return json({ authenticated: false });

  let acc = null;
  try {
    acc = await env.DB.prepare('SELECT name, business, email FROM accounts WHERE id = ?')
      .bind(sess.aid).first();
  } catch (_) { /* table missing / db error → treat as unauthenticated (demo stays) */ }
  if (!acc) return json({ authenticated: false });

  return json({
    authenticated: true,
    name: acc.name || '',
    business: acc.business || '',
    email: acc.email || '',
  });
}
