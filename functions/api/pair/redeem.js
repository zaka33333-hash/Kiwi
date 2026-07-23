// POST /api/pair/redeem — the CAISSE half of pairing. No account session (the
// caisse has no login); it only needs to have passed the passcode gate, which
// the same-origin fetch carries via kiwi_gate (see functions/_middleware.js).
//
// Body: { code }. Atomic single-use redemption — one UPDATE claims the code and
// returns the store it binds to, so two devices can never redeem the same code:
//   UPDATE ... SET used_ts=? WHERE code=? AND used_ts IS NULL AND expires_ts>? RETURNING ...
//
// Response contract with assets/caisse-pairing.js (do NOT change the client):
//   · valid   → 200 { ok:true, merchant, type, subtype, name }.  The `ok:true` is
//     REQUIRED: redeem() only calls applyPairing when j.ok is truthy.
//   · invalid or expired → 422 { error:'invalid_or_expired' }. This is a REAL
//     rejection ("code invalide") — the client shows an error and does NOT fall
//     back to localStorage.
//   · NEVER 404/405 — the client reads those as "backend absent" and falls back
//     to the same-browser localStorage map, which would mask a genuine bad code.
//
// No DB ⇒ 503 (a static host has no pairings table; the client's 404-style
// fallback isn't reached here, but 503 still keeps it away from the 422 path).

import { json } from '../../auth/_lib.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'not-configured' }, 503);

  let body = {};
  try { body = (await request.json()) || {}; } catch (_) { body = {}; }
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) return json({ error: 'invalid_or_expired' }, 422);

  const now = Date.now();
  let row = null;
  try {
    row = await env.DB.prepare(
      `UPDATE pairings SET used_ts = ?
        WHERE code = ? AND used_ts IS NULL AND expires_ts > ?
        RETURNING merchant, type, subtype, name`
    ).bind(now, code, now).first();
  } catch (_) {
    // Table missing / db error → treat as a bad code, never 404 (which would
    // wrongly trip the client's "backend absent" localStorage fallback).
    return json({ error: 'invalid_or_expired' }, 422);
  }

  if (!row) return json({ error: 'invalid_or_expired' }, 422);
  return json({
    ok: true,
    merchant: row.merchant,
    type: row.type || '',
    subtype: row.subtype || '',
    name: row.name || '',
  });
}
