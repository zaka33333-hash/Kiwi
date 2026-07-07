// GET /api/feed?merchant=<id>&since=<cursor> — real sales after a cursor.
//
// The dashboard polls this every few seconds; `since` is the last rowid it saw,
// so each poll returns only new sales. SQLite's implicit rowid is a monotonic
// cursor — cheap and reliable. Behind the passcode gate like /api/sale.

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env || !env.DB) return json({ sales: [], cursor: 0 });

  const url = new URL(request.url);
  const merchant = String(url.searchParams.get('merchant') || 'default').slice(0, 64);
  const since = Number(url.searchParams.get('since')) || 0;

  let rows = [];
  try {
    const rs = await env.DB.prepare(
      'SELECT rowid AS cursor, id, amount, method, label, ref, ts ' +
      'FROM sales WHERE merchant = ? AND rowid > ? ORDER BY rowid ASC LIMIT 50'
    ).bind(merchant, since).all();
    rows = (rs && rs.results) || [];
  } catch (e) {
    return json({ sales: [], cursor: since, error: 'db', detail: String(e && e.message || e) }, 500);
  }

  const cursor = rows.length ? rows[rows.length - 1].cursor : since;
  return json({ sales: rows, cursor });
}
