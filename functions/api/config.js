// GET /api/config?merchant=slug — the client apps' own config read.
//
// Returns { features, pins } for one merchant so the caisse/serveur/dashboard can
// (a) hide modules an operator toggled off and (b) resolve PINs the operator
// manages remotely. This is NOT operator-gated: any authenticated same-origin
// session reaches it (the site gate already stands in front of every request), and
// a merchant only ever reads its own slug. Absent config ⇒ empty, and every app
// falls back to its current hardcoded behavior — so this endpoint being missing
// (GitHub Pages, local static) changes nothing.

import { json } from '../auth/_lib.js';

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
