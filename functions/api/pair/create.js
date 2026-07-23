// POST /api/pair/create — the DASHBOARD half of caisse pairing.
//
// A signed-in merchant asks for a live 6-digit code that binds a till to THIS
// store. The merchant is derived from the session ONLY (never the body): the
// session carries just { aid }, so we look the account up and slugify its
// business (or email) exactly like /api/me and /api/config → one key across the
// dashboard, the caisse (kiwiLiveMerchant) and the D1 roster, with no stored map.
//
// The store's trade (type/subtype/name) rides along on the code so the caisse can
// boot the matching vertical on redeem with no second lookup.
//
// Fail-soft contract with assets/caisse-link.js:
//   · 401 with no valid session (the client keeps its localStorage code → the
//     same-browser loop still works; cross-device just doesn't light up).
//   · On success returns { ok:true, code, expires_ts }. The `ok:true` is REQUIRED:
//     backendCreate() only adopts the server code when j.ok && j.code are truthy.
//
// Runs behind the passcode gate (functions/_middleware.js). No DB / no secret ⇒
// 503 so a static host (GitHub Pages, local) is unaffected.

import { json, readSession, readCookie, SESS_COOKIE, slugMerchant } from '../../auth/_lib.js';

const TTL = 15 * 60 * 1000; // a code is live for 15 minutes

function code6() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(100000 + (a[0] % 900000)); // always 6 digits, no leading zero
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_SECRET) return json({ error: 'not-configured' }, 503);

  const sess = await readSession(readCookie(request, SESS_COOKIE), env.AUTH_SECRET);
  if (!sess || !sess.aid) return json({ error: 'unauthorized' }, 401);

  const acc = await env.DB.prepare('SELECT business, email FROM accounts WHERE id = ?')
    .bind(sess.aid).first();
  if (!acc) return json({ error: 'unauthorized' }, 401);
  const merchant = slugMerchant(acc.business || acc.email);

  let body = {};
  try { body = (await request.json()) || {}; } catch (_) { body = {}; }
  const type = String(body.type || '').trim().slice(0, 24) || null;
  const subtype = String(body.subtype || '').trim().slice(0, 40) || null;
  const name = String(body.name || acc.business || '').trim().slice(0, 120) || null;

  const now = Date.now();
  const expires = now + TTL;

  // Revoke this merchant's prior live codes so only the newest one redeems.
  try {
    await env.DB.prepare('UPDATE pairings SET used_ts = ? WHERE merchant = ? AND used_ts IS NULL')
      .bind(now, merchant).run();
  } catch (_) { return json({ error: 'write-failed' }, 500); }

  // Insert a fresh code, retrying on the (rare) partial-unique-index collision
  // between two simultaneously-live codes.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = code6();
    try {
      await env.DB.prepare(
        `INSERT INTO pairings (code, merchant, type, subtype, name, account_id, created_ts, expires_ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(code, merchant, type, subtype, name, sess.aid, now, expires).run();
      return json({ ok: true, code, expires_ts: expires });
    } catch (_) { /* unique collision (or transient) → try another code */ }
  }
  return json({ error: 'code-generation-failed' }, 500);
}
