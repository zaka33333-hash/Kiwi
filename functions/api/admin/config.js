// /api/admin/config — per-merchant feature flags (operator-only; maps to pricing).
//
//   GET ?merchant=slug                          → { features:{…}, plan, type }
//   PUT {merchant, features:{…}, plan?, type?}   → upsert (type omitted ⇒ kept)
//
// `features` is a JSON object of module→bool. A missing key means ON (the current
// full interface), so an absent row = everything on. Turning a module OFF here
// hides it in that merchant's real app on next load (via /api/config).

import { isOperator, json } from '../../auth/_lib.js';

async function guard(context) {
  const ok = await isOperator(context.request, context.env);
  if (!ok) return json({ error: 'forbidden' }, 403);
  if (!context.env.DB) return json({ error: 'no-db' }, 503);
  return null;
}

export async function onRequestGet(context) {
  const bad = await guard(context); if (bad) return bad;
  const url = new URL(context.request.url);
  const merchant = (url.searchParams.get('merchant') || '').trim();
  if (!merchant) return json({ error: 'merchant-required' }, 400);
  const row = await context.env.DB.prepare(
    `SELECT features, plan, type FROM merchant_config WHERE merchant = ?`
  ).bind(merchant).first();
  let features = {};
  if (row && row.features) { try { features = JSON.parse(row.features) || {}; } catch (_) { features = {}; } }
  return json({ features, plan: (row && row.plan) || '', type: (row && row.type) || '' });
}

export async function onRequestPut(context) {
  const bad = await guard(context); if (bad) return bad;
  let body;
  try { body = await context.request.json(); } catch (_) { return json({ error: 'bad-json' }, 400); }
  const merchant = (body.merchant || '').toString().trim();
  if (!merchant) return json({ error: 'merchant-required' }, 400);
  const features = (body.features && typeof body.features === 'object') ? body.features : {};
  const plan = (body.plan || '').toString().trim().slice(0, 24);
  // Keep only boolean flags — defensive against junk payloads.
  const clean = {};
  for (const k of Object.keys(features)) clean[String(k).slice(0, 40)] = !!features[k];

  // type is optional: bind NULL when the caller didn't send it, and COALESCE on
  // conflict so a features/plan-only save never clears a merchant's set type.
  const hasType = Object.prototype.hasOwnProperty.call(body, 'type');
  const type = hasType ? (body.type || '').toString().trim().slice(0, 24) : null;

  await context.env.DB.prepare(
    `INSERT INTO merchant_config (merchant, features, plan, type, updated_ts) VALUES (?,?,?,?,?)
     ON CONFLICT(merchant) DO UPDATE SET
       features = excluded.features,
       plan = excluded.plan,
       type = COALESCE(excluded.type, merchant_config.type),
       updated_ts = excluded.updated_ts`
  ).bind(merchant, JSON.stringify(clean), plan, type, Date.now()).run();
  return json({ ok: true, features: clean, plan, type: type });
}
