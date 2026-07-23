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
    // demo:true until an account claims this merchant (see the accounts loop).
    // A merchant that only ever appears via demo sales / config is a demo.
    if (!r) { r = { merchant: m, business: '', email: '', name: '', plan: '', today_amount: 0, today_count: 0, last_ts: 0, demo: true }; map.set(m, r); }
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
      r.demo = false; // real email+password signup → a real client
    }
  } catch (e) {
    return json({ error: 'query-failed', detail: String(e) }, 500);
  }

  const clients = [...map.values()].sort((a, b) => (b.last_ts || 0) - (a.last_ts || 0));
  return json({ clients, dayStart, now });
}

// DELETE /api/admin/clients?merchant=slug[&email=…] — nuke an entire account so
// the operator can start it fresh. Removes, in one shot:
//   · the login row              (accounts, matched by email — the unique key)
//   · all sales                  (sales     WHERE merchant = slug)
//   · all staff PINs             (staff_pins WHERE merchant = slug)
//   · the feature/plan config    (merchant_config WHERE merchant = slug)
// merchant (the slug the roster already computed) drives the merchant-keyed
// wipes; email removes the account itself. Either alone is accepted — a demo
// with no account is cleared by merchant only; an orphan account with a renamed
// business is cleared by email only. Irreversible; operator-gated. The console's
// type-the-name confirmation is the guard against an accidental call.
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!(await isOperator(request, env))) return json({ error: 'forbidden' }, 403);
  if (!env.DB) return json({ error: 'no-db' }, 503);

  const url = new URL(request.url);
  let merchant = (url.searchParams.get('merchant') || '').trim();
  let email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!merchant && !email) {
    try {
      const b = await request.json();
      merchant = (b.merchant || '').toString().trim();
      email = (b.email || '').toString().trim().toLowerCase();
    } catch (_) { /* no body */ }
  }
  if (!merchant && !email) return json({ error: 'merchant-or-email-required' }, 400);

  const deleted = { sales: 0, pins: 0, config: 0, account: 0 };
  try {
    if (merchant) {
      const s = await env.DB.prepare(`DELETE FROM sales WHERE merchant = ?`).bind(merchant).run();
      const p = await env.DB.prepare(`DELETE FROM staff_pins WHERE merchant = ?`).bind(merchant).run();
      const c = await env.DB.prepare(`DELETE FROM merchant_config WHERE merchant = ?`).bind(merchant).run();
      deleted.sales = (s.meta && s.meta.changes) || 0;
      deleted.pins = (p.meta && p.meta.changes) || 0;
      deleted.config = (c.meta && c.meta.changes) || 0;
    }
    if (email) {
      const a = await env.DB.prepare(`DELETE FROM accounts WHERE email = ?`).bind(email).run();
      deleted.account = (a.meta && a.meta.changes) || 0;
    }
  } catch (e) {
    return json({ error: 'delete-failed', detail: String(e) }, 500);
  }
  return json({ ok: true, merchant, email, deleted });
}
