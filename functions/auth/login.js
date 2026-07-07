// POST /auth/login — verify credentials, start a session.
// Body JSON: { email, password }.
import { verifyPassword, makeSession, sessionCookie, json, normEmail } from './_lib.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = env.AUTH_SECRET;
  if (!env.DB || !secret) return json({ error: 'not-configured' }, 503);

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'bad-json' }, 400); }

  const email = normEmail(body.email);
  const password = String(body.password || '');

  const row = await env.DB.prepare('SELECT id, salt, hash FROM accounts WHERE email = ?').bind(email).first();
  // Verify even when the row is missing to avoid leaking which emails exist.
  const ok = row
    ? await verifyPassword(password, row.salt, row.hash)
    : await verifyPassword(password, '00', '00');
  if (!row || !ok) return json({ error: 'bad-creds' }, 401);

  const token = await makeSession(row.id, secret);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': sessionCookie(token),
    },
  });
}
