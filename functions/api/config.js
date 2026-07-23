// GET /api/config?merchant=slug — the client apps' own config read.
//
// Returns { features, pins } for one merchant so the caisse/serveur/dashboard can
// (a) hide modules an operator toggled off and (b) resolve PINs the operator
// manages remotely. This is NOT operator-gated: any authenticated same-origin
// session reaches it (the site gate already stands in front of every request), and
// a merchant only ever reads its own slug. Absent config ⇒ empty, and every app
// falls back to its current hardcoded behavior — so this endpoint being missing
// (GitHub Pages, local static) changes nothing.

import { json, readSession, readCookie, SESS_COOKIE, slugMerchant } from '../auth/_lib.js';

const VALID_PIN = /^\d{4}$/;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const merchant = (url.searchParams.get('merchant') || '').trim();
  if (!merchant) return json({ error: 'merchant-required' }, 400);
  if (!env.DB) return json({ features: {}, pins: [] }); // no backend → neutral

  let features = {};
  let pins = [];
  try {
    const cfg = await env.DB.prepare(
      `SELECT features FROM merchant_config WHERE merchant = ?`
    ).bind(merchant).first();
    if (cfg && cfg.features) { try { features = JSON.parse(cfg.features) || {}; } catch (_) {} }

    const rows = await env.DB.prepare(
      `SELECT pin, name, role FROM staff_pins WHERE merchant = ? ORDER BY created_ts`
    ).bind(merchant).all();
    pins = rows.results || [];
  } catch (_) { /* table missing / db error → neutral config */ }

  return json({ features, pins });
}

// POST /api/config — a merchant syncs ITS OWN staff PINs up to the server so the
// operator console (God mode) can see and manage them. The merchant is derived
// from the authenticated session, NEVER from the request body — a client can only
// ever write its own slug. Body JSON: { pins: [{ code|pin, name, role }] }.
//
// Semantics: a full replace of this merchant's staff_pins with the submitted set
// (the client always sends its complete, current list). Invalid/duplicate codes
// are dropped. No session / no DB ⇒ neutral no-op so static hosts are unaffected.
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_SECRET) return json({ error: 'not-configured' }, 503);

  const sess = await readSession(readCookie(request, SESS_COOKIE), env.AUTH_SECRET);
  if (!sess || !sess.aid) return json({ error: 'unauthorized' }, 401);

  const acc = await env.DB.prepare('SELECT business FROM accounts WHERE id = ?').bind(sess.aid).first();
  if (!acc) return json({ error: 'unauthorized' }, 401);
  const merchant = slugMerchant(acc.business);

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'bad-json' }, 400); }
  const input = Array.isArray(body && body.pins) ? body.pins : [];

  // Normalise, validate (4-digit), de-dupe by code, cap the list.
  const seen = new Set();
  const clean = [];
  for (const p of input) {
    if (!p) continue;
    const code = String(p.code || p.pin || '').trim();
    if (!VALID_PIN.test(code) || seen.has(code)) continue;
    seen.add(code);
    clean.push({
      code,
      name: String(p.name || '').trim().slice(0, 60),
      role: String(p.role || '').trim().slice(0, 24) || 'staff',
    });
    if (clean.length >= 20) break;
  }

  // Atomic replace of this merchant's rows. created_ts is offset per index so the
  // GET's `ORDER BY created_ts` preserves the submitted order.
  const base = Date.now();
  const stmts = [context.env.DB.prepare('DELETE FROM staff_pins WHERE merchant = ?').bind(merchant)];
  clean.forEach((p, i) => {
    stmts.push(context.env.DB.prepare(
      'INSERT INTO staff_pins (id, merchant, pin, name, role, created_ts) VALUES (?,?,?,?,?,?)'
    ).bind('pin-' + crypto.randomUUID(), merchant, p.code, p.name, p.role, base + i));
  });
  try { await context.env.DB.batch(stmts); }
  catch (_) { return json({ error: 'write-failed' }, 500); }

  return json({ ok: true, merchant, count: clean.length });
}
