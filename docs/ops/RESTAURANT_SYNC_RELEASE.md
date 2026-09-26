# Restaurant sync safeguards - release verification

## Scope and financial boundaries

Release starts from `dcd899b1`, cherry-picks `cd52549d` as `1d395437`, then
hardens the safeguards. No receipt is reconstructed from Z totals. No production
PIN, pairing code, test sale, manual data correction or manual migration is part
of verification.

- Visit, order and link-schema read failures return 503 before accepting an
  unlinked receipt. Replaying its immutable ID after recovery links/closes the
  visit. Definitively absent/mismatched visits retain the paid receipt with a warning.
- Unlinked table bills use a merchant/table/order/business-day settlement key.
  The voided holder can be replaced using the existing compare-and-swap guard.
  Different tables are not merged by the old 10-second heuristic.
- Blocked payloads are not retried just because a comparison found them missing.
  A server comparison can permit a removed visit rule to retry; both durable and
  fallback copies check the reason, status, tenant, ID and comparison ID. The
  comparison can reactivate a receipt at most once. Unchanged 400/422 and money
  conflicts require support; even a void does not authorise rewriting an
  immutable receipt under an existing conflicting ID.
- Till status opens receipt details instead of resending quarantined money.
  Dashboard and God Mode show bounded, sanitised debt metadata. Device telemetry
  carries up to 200 detailed blocked receipts per device; the full local outbox
  remains on the till. Telemetry is an observation, not proof of synchronisation.
- A selected closed day uses the explicitly labelled till Z reference; recorded
  ledger money, gap and missing receipt count remain visible. New terminal
  manifests are unioned by receipt ID, never summed twice. Mixed open/closed
  terminals are labelled partial. Multiple old reports without manifests cannot
  safely be unioned and are labelled unverifiable instead of inventing a total.
- Current open days use live server money. A provisional Z discrepancy is
  surfaced without replacing that live amount; without an available observation,
  sync status is unknown rather than a claimed zero.
- Historical days without comparisons use the exact ledger with an explicit
  cannot-verify note. Legacy `store_docs.dayreports` aggregates are not used.
- The paired till now publishes its store zone and business-day cutoff. Older
  stores without a published cutoff retain the historical 05:00 fallback.

## Ticket #96 / #77 forward safeguards (2026-09-26)

The 21 September incident was a delayed outbox delivery, not evidence that Z
totals can reconstruct receipts. The owner's read-only production observations
are recorded below; they were supplied to this task, not independently
re-queried here. D1's later count is not a contemporaneous dashboard snapshot.

| Pasta Corner business day | Till Z | Dashboard at incident | Later D1 / Z reconciliation |
| --- | ---: | ---: | ---: |
| 21 Sep | 11 / 1,507 MAD | 2 / 314 MAD | 27 / 3,571 MAD in D1 after delayed delivery |
| 24 Sep | — | — | 27 / 4,648 MAD; 0 missing, 0 blocked |
| 25 Sep | — | — | 27 / 4,824 MAD; 0 missing, 0 blocked |
| 26 Sep | — | — | 24 / 4,251 MAD; 0 missing, 0 blocked |

The later D1 figure for 21 Sep includes sales delivered after the ticket photos;
it must not be used to claim that the original Z and dashboard agreed. No
receipt-level history is invented from a Z total. The supplied read reported
no refunds or voids in D1 since 23 Sep.

- The till sends its actual 0–12 h business cutoff with the zone and with each
  Z manifest. The server uses the same boundary for `/api/sale` bill identity,
  Z comparison and dashboard day lookup. Two tills reporting different cutoffs
  for one day make the comparison explicitly ambiguous rather than matched.
- A Z manifest contains negative refund rows as well as live payment rows;
  voids are excluded. Transaction count counts positive receipts only. The
  reported, recorded and printed amount is net of refunds. The printed Z still
  distinguishes receivables (`TOTAL FACTURÉ` / `NET ENCAISSÉ`).
- The local Z report and its manifest deduplicate on the same canonical server
  sale ID and exact settlement fingerprint. Distinct split IDs remain distinct.
  A saved provisional alias is folded into the canonical ID on later close.
- A locally detected journal/manifest delta becomes an explicit `unqueued`
  amount/count in the durable comparison, never a fabricated receipt ID. An
  open-day mismatch is visible in the dashboard notification; a rejected
  receipt in heartbeat telemetry shows a scoped sync gap even before a Z
  manifest arrives. A missing refund is never retried as a positive sale.

The synthetic single-day fixture has one void, two split parts, a refund, and
one ordinary payment: 3 live transactions, 80 MAD gross, 5 MAD refunded,
75 MAD printed/recorded net. See the updated `z-reconciliation-*`,
`day-report-multi-service-test`, `day-report-print-format-test`, and
`device-timezone-test` gates. This is forward protection, not a backfill.

## Reproducible evidence

- `node --test tools/restaurant-sync-release-test.mjs`: eight scenarios;
  unmodified upstream: **1 pass, 7 fail**; patched code: **8 pass, 0 fail**.
  This includes all five requested fixes, link-schema recovery, employee order
  lookup recovery and overlapping terminal manifests. The link-schema failure
  case already passed on upstream; it protects the cherry-picked regression.
- `node tools/z-reconciliation-browser-test.mjs`: **40 assertions**, actual Chrome
  and production JS, synthetic Amira restaurant/boutique/till/God Mode fixtures.
  Tests selected-day headline, amounts, gap, missing count, blocked receipt detail,
  no resend on till status click, date switches, fetch failure and 390px layout.
  Untouched upstream fails to render the required headline.
- `node tools/live-link-outbox-browser-test.mjs`: actual Dexie/IndexedDB, failed
  POST persistence, automatic same-ID replay, pending settlement, permanent 422
  quarantine and once-per-comparison reactivation for a removed rule.
- `node tools/maison-dashboard-browser-test.mjs`: **24 assertions**, full local
  dashboard HTML and production JS, synthetic Amira merchant. Z headline is
  labelled correctly without fabricating local receipt rows.
- `node tools/operations-system-test.mjs`: **286 controls**, including bounded
  blocked receipt details without arbitrary customer payload fields.
- Full release gate: run `node tools/check.js` on the final tree before each mirror
  push. Keep command logs outside the checkout. Use `git ls-remote` on both URLs
  and compare deployed GitHub Pages asset bytes/stamps after deployment.

Screenshots and tests demonstrate local rendered behaviour, not acceptance on
the unavailable original Pasta Corner till. Missing receipt-level history is
not recoverable from aggregate Z totals alone. No missing history was fabricated.

## Owner-only physical-till acceptance

1. Reload the real restaurant till. Check the sync indicator and inspect any debt.
2. Take one card and one cash payment on a table; confirm receipt IDs and visit closure.
3. Void one of them and pay the bill again; confirm only non-voided money is counted.
4. Close the register and let the Z comparison finish.
5. Select that business day in the dashboard. Confirm labelled Z total, recorded
   total, zero gap and zero missing receipts. If blocked debt appears, keep the
   original till/journal intact and contact support; do not clear storage.
