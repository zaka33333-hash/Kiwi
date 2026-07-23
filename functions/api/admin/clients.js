// GET /api/admin/clients — operator roster.
//
// One row per merchant: today's sales total + count + last-sale time (from the
// `sales` table), the account contact (from `accounts`, matched by slugified
// business name), and the plan (from `merchant_config`). Merchants are the union
// of everything that appears in sales, config, or accounts — so a brand-new
// account with no sales still shows, and a merchant selling without an account
// still shows. Operator-gated.

import { isOperator, slugMerchant, json } from '../../auth/_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await isOperator(request, env))) return json({ error: 'forbidden' }, 403);
  if (!env.DB) return json({ error: 'no-db' }, 503);

  // Start of "today" in the server's clock (UTC on Workers). Good enough for a
  // pilot; the console shows the day's running tally, not an accounting close.
  const now = Date.now();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayStart = startOfDay.getTime();

  const map = new Map(); // merchant slug → row
  function row(m) {
    let r = map.get(m);
    if (!r) { r = { merchant: m, business: '', email: '', name: '', plan: '', today_amount: 0, today_count: 0, last_ts: 0 }; map.set(m, r); }
    return r;
  }

  try {
    // Sales aggregate per merchant.
    const sales = await env.DB.prepare(
      `SELECT merchant,
              COALESCE(SUM(CASE WHEN ts >= ? THEN amount ELSE 0 END), 0) AS today_amount,
              COALESCE(SUM(CASE WHEN ts >= ? THEN 1 ELSE 0 END), 0)      AS today_count,
              MAX(ts) AS last_ts
       FROM sales GROUP BY merchant`
    ).bind(dayStart, dayStart).all();
    for (const s of (sales.results || [])) {
      const r = row(s.merchant);
      r.today_amount = s.today_amount || 0;
      r.today_count = s.today_count || 0;
      r.last_ts = s.last_ts || 0;
    }

    // Plans / config.
    const cfg = await env.DB.prepare(`SELECT merchant, plan FROM merchant_config`).all();
    for (const c of (cfg.results || [])) { row(c.merchant).plan = c.plan || ''; }

    // Accounts → contact + ensure a row exists even with zero sales.
    const accts = await env.DB.prepare(`SELECT email, name, business FROM accounts`).all();
    for (const a of (accts.results || [])) {
      const m = slugMerchant(a.business || a.email);
      const r = row(m);
      r.business = a.business || r.business;
      r.email = a.email || r.email;
      r.name = a.name || r.name;
    }
  } catch (e) {
    return json({ error: 'query-failed', detail: String(e) }, 500);
  }

  const clients = [...map.values()].sort((a, b) => (b.last_ts || 0) - (a.last_ts || 0));
  return json({ clients, dayStart, now });
}
