#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/z-reconciliation.js', import.meta.url), 'utf8');
const rows = new Map();
const storage = new Map();
const O = {
  available: () => true,
  enqueue(_channel, _tenant, payload, opts) { rows.set(opts.id, { id: opts.id, payload, state: 'pending' }); return Promise.resolve(); },
  claim() { const row = [...rows.values()].find(r => r.state === 'pending'); if (row) { row.state = 'sending'; row.leaseToken = 'lease'; } return Promise.resolve(row || null); },
  acknowledge(id) { rows.delete(id); return Promise.resolve(true); },
  reject(id) { rows.get(id).state = 'pending'; return Promise.resolve(true); },
};
let serverHasSale = false, requests = 0, requeues = 0, reactivations = 0, alias = '';
function instance(online) {
  const Live = {
    merchant: () => 'restaurant-fixture', saleIdFor: entry => entry.id,
    canonicalSaleId: (_slug, id) => id === 'receipt-1' ? (alias || id)
      : id === 'bill-replay' ? 'bill-original' : id,
    retrySale: async () => { reactivations++; return true; },
    postSale: () => { requeues++; serverHasSale = true; alias = 'canonical-receipt-1'; return { ok: true }; },
    flush: () => Promise.resolve(),
  };
  const window = { KiwiOffline: O, KiwiLive: Live,
    KiwiDayReport: { dayBounds: () => ({ from: 0, to: 2000000000000 }),
      normSale: entry => ({ ...entry, ts: new Date(entry.time).getTime() }),
      settlementKey: entry => /-split-/.test(entry.id) ? '' : entry.ref
        ? [entry.ref, entry.ts, entry.amount, JSON.stringify(entry.lines || [])].join('#') : '' }, addEventListener() {} };
  const ctx = vm.createContext({ window, KiwiLive: Live, navigator: { onLine: online },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: { readyState: 'complete', getElementById: () => null, querySelector: () => null, addEventListener() {} },
    location: { pathname: '/kiwi-caisse.html' }, setInterval() {}, Promise, Date, Set, console,
    fetch: async (_url, opts) => {
      requests++;
      const body = JSON.parse(opts.body);
      assert.deepEqual(body.sales.map(row => row.id), requests === 1
        ? ['receipt-1'] : requests === 2 ? ['canonical-receipt-1'] : ['canonical-receipt-1', 'receipt-2']);
      return { ok: true, json: async () => ({ ok: true,
        missing: requests === 1 ? ['receipt-1'] : requests === 2 ? [] : ['receipt-2'] }) };
    },
  });
  vm.runInContext(source, ctx);
  return window.KiwiZReconciliation;
}
const first = instance(false);
const report = { day: '2026-02-14', terminalId: 'till-a', store: { slug: 'restaurant-fixture' }, txns: 1, gross: 57 };
const receipt = { id: 'receipt-1', time: new Date('2026-02-14T20:00:00Z'), amount: 57, method: 'cash' };
assert.equal((await first.queueClose(report, [receipt])).ok, true);
assert.equal(rows.size, 1, 'Z job survives before send');
assert.equal(requests, 0, 'offline means no POST');
const after = instance(true);
const deadline = Date.now() + 5000;
while ((!requeues || [...rows.values()][0]?.state !== 'pending') && Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 10));
}
await new Promise(resolve => setImmediate(resolve));
assert.equal(requeues, 1, 'missing local receipt requeued through normal sale transport');
assert.equal(reactivations, 1, 'blocked original command is reactivated before replay');
assert.equal(rows.size, 1, 'Z obligation kept until server verifies repair');
await after.flush();
assert.equal(rows.size, 0, 'matched comparison acknowledges durable Z job');
assert.equal(requests, 2);
const nextShift = instance(false);
const second = { id: 'receipt-2', time: new Date('2026-02-14T22:00:00Z'), amount: 23, method: 'card' };
assert.equal((await nextShift.queueClose({ ...report, txns: 2, gross: 80 }, [second])).ok, true);
assert.equal([...rows.values()][0].payload.entries.length, 2, 'a second shift on the same day keeps the first Z manifest');
// A missing receipt with no local payload is not "repaired" by deleting the Z
// obligation. It must remain visible until a genuine receipt is recovered.
const debt = [...rows.values()][0];
debt.payload.entries.forEach(row => { row.local = null; });
const offlineSource = instance(true);
await offlineSource.flush();
assert.equal(rows.size, 1, 'missing historical receipt without payload remains durable');
console.log('✓ closed Z survives reload, repairs missing sales, waits for server proof and carries a second shift');

const corrected = instance(false);
assert.equal((await corrected.queueSnapshot({ ...report, txns: 1, gross: 57 }, [{ ...second, voided: true }])).ok, true);
assert.equal([...rows.values()][0].payload.entries.length, 1, 'voided receipt removed from saved manifest, not counted at next close');
assert.equal([...rows.values()][0].payload.entries[0].id, 'canonical-receipt-1');
// A test shift can finish with every receipt voided. The close must replace a
// prior non-empty manifest with an explicit zero, not stay open forever.
const fullyVoided = instance(false);
assert.equal((await fullyVoided.queueClose({ ...report, txns: 0, gross: 0 },
  [{ ...receipt, voided: true }, { ...second, voided: true }])).ok, true);
assert.equal([...rows.values()][0].payload.entries.length, 0,
  'fully voided day closes with an empty durable Z manifest');

// The till report and Z manifest must use the same fingerprint; legitimate
// split parts remain separate even when they share the same bill and instant.
rows.clear();
const splitDay = '2026-02-19', instant = new Date('2026-02-19T20:00:00Z');
const shared = { time: instant, ref: 'T-17', lines: [{ name: 'Pasta', qty: 1, total: 50 }] };
const base = { ...shared, id: 'bill-original', amount: 50, method: 'cash' };
const replay = { ...base, id: 'bill-replay', time: new Date(instant.getTime() + 2000) };
const part1 = { ...shared, id: 'bill-split-a', amount: 15, method: 'card' };
const part2 = { ...shared, id: 'bill-split-b', amount: 15, method: 'card' };
const splitReport = { ...report, day: splitDay, cutoff: 7, txns: 3, gross: 80, net: 80 };
const splitClient = instance(false);
assert.equal((await splitClient.queueSnapshot(splitReport, [base, replay, part1, part2])).ok, true);
let splitJob = [...rows.values()][0].payload;
assert.deepEqual(Array.from(splitJob.entries, r => r.id), ['bill-original', 'bill-split-a', 'bill-split-b']);
assert.equal(splitJob.unqueuedCount, 0);
assert.equal(splitJob.cutoff, 7);

// A refund reduces the printed net without creating a fourth transaction.
const refund = { id: 'refund-1', time: instant, kind: 'refund', amount: -5, method: 'cash' };
assert.equal((await splitClient.queueSnapshot({ ...splitReport, net: 75 },
  [base, replay, part1, part2, refund])).ok, true);
splitJob = [...rows.values()][0].payload;
assert.equal(splitJob.entries.find(r => r.id === 'refund-1').amountCents, -500);
assert.equal(splitJob.unqueuedCents, 0);

// An unqueued paid receipt is a published discrepancy, never a silent failed
// snapshot or a fabricated receipt ID.
assert.equal((await splitClient.queueSnapshot({ ...splitReport, txns: 4, gross: 87, net: 82 },
  [base, replay, part1, part2, refund])).ok, true);
splitJob = [...rows.values()][0].payload;
assert.equal(splitJob.unqueuedCount, 1);
assert.equal(splitJob.unqueuedCents, 700);

// An earlier provisional manifest can contain the retry ID before /api/sale
// returns duplicateOf. Canonicalising that saved manifest must merge its alias
// rather than permanently reject every later Z close.
rows.clear();
const aliasDay = '2026-02-20';
storage.set('kiwi:z-manifest:restaurant-fixture:till-a:' + aliasDay, JSON.stringify([
  { id: 'bill-original', amountCents: 5000, method: 'cash' },
  { id: 'bill-replay', amountCents: 5000, method: 'cash' },
]));
const aliasResult = await splitClient.queueClose({ ...report, day: aliasDay, txns: 1, gross: 50, net: 50 }, [base, replay]);
assert.equal(aliasResult.ok, true, 'previous provisional alias collapses to the canonical receipt');
assert.deepEqual(Array.from([...rows.values()][0].payload.entries, row => row.id), ['bill-original']);

// A later shift may encounter the same exact settlement before the alias is
// known. The saved manifest and current journal share the report fingerprint;
// they must not become two server receipts or strand the Z job.
rows.clear();
const fingerprintDay = '2026-02-21';
assert.equal((await splitClient.queueSnapshot({ ...report, day: fingerprintDay, txns: 1, gross: 50, net: 50 }, [base])).ok, true);
const fingerprintReplay = { ...base, id: 'bill-fingerprint' };
assert.equal((await splitClient.queueClose({ ...report, day: fingerprintDay, txns: 1, gross: 50, net: 50 },
  [fingerprintReplay])).ok, true, 'saved and current fingerprint collapse to one payment');
assert.deepEqual(Array.from([...rows.values()][0].payload.entries, row => row.id), ['bill-original']);
