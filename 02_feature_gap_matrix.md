# 02 — Feature Gap Matrix

Scored 0–5 against Toast / Square for Restaurants / Lightspeed Restaurant / Loyverse. 0 = absent, 5 = world-class. When a row is 0–1, the "gap" describes what world-class looks like (with a competitor reference) and a concrete remediation.

---

## A. Operational Core

| Capability | Score | Reference |
|---|---|---|
| Order entry speed (≤2 taps) | **2** | Caisse `menuItems` grid at [kiwi-caisse.html:2135](kiwi-caisse.html:2135) is one tap to add, but discovery is paginated by category pills only — no search, no favorites, no recents, no keypad, no PLU shortcut. Toast and Square both have a search bar + "favorites" tile group reachable from any screen. **Remediation:** add `/search` input, a "favorites" category per merchant, and a numeric PLU input that maps to `menuItems.id`. |
| Modifiers / combos / courses / send-hold | **0** | The data model has no `modifier_group`, `modifier`, `course`, or `send` concept. You cannot order "cheeseburger, no onion, add bacon, well-done." Lightspeed's modifier engine supports nested groups, required/optional, price deltas, and inventory linkage. **Remediation:** introduce `modifier_group(id, name, min, max, required)` and `modifier(id, group_id, name, price_delta, ingredient_id)`. Wire into order-line as `OrderLineModifier[]`. Add `course` enum on order line + a "Send course" action that triggers a KDS event. |
| Floor plan management & merge/split | **2** | Hardcoded 21-table object literal at [kiwi-caisse.html:1717](kiwi-caisse.html:1717). No editor, no zones beyond 3, no table merge/split, no transfer. Toast lets a server drag two tables together for a party of 8. **Remediation:** floor-plan editor (drag tables on a canvas, persist `position{x,y,rotation,shape}`), `merge_group_id` on table, `transfer_order(from, to)` API. |
| Bill splitting | **4** | Genuinely good. [:2803](kiwi-caisse.html:2803) covers equal / by-item / by-amount with live remaining. Missing: by-seat (requires seat model), splitting **across payment methods within one part** (Toast "even split with one Apple Pay and one cash"), and saving a partially-paid check. |
| KDS / expediter | **0** | No KDS surface exists. The 1-line `data-mode-section="kds"` in [assets/pages.js](assets/pages.js) is a dashboard tile, not a station screen. Toast's KDS routes by station (cold/hot/grill), bumps with timers, shows all-day counts, ticket aging color codes. **Remediation:** build a separate `kds.html` (or KDS Android-tablet build) that subscribes to a `kitchen_event` topic and renders tickets by station. |
| Multi-station printing | **0** | No print logic anywhere. No ESC/POS, no Star, no driver abstraction. **Remediation:** define a `Printer` interface (`receipt`, `kitchen`, `bar`, `label`), implement Android plugin using `escpos-thermal-printer` + USB OTG + Bluetooth LE. Route by `menu_item.station_id`. |
| Tabs / open checks / pre-auth | **1** | Open table = open check, OK. But no bar-tab named-check pattern (`"Open a tab on Jamal's card"` → pre-auth hold). Square Bar does this. **Remediation:** pre-auth via CMI / SoftPOS, store `auth_token` on check, capture on close. |
| Tips / pooling / tip-out | **0** | The split-modal has a "service" suggestion at [:2868](kiwi-caisse.html:2868) but it is a percentage suggestion only — not stored, not pooled, not exportable, not allocated. Toast Tips + Toast Payroll close the loop. **Remediation:** `tip` table per payment, `tip_pool(rule, beneficiaries[])`, end-of-shift allocation. |
| Offline mode + conflict-free sync | **0** | The app has no persistence, let alone offline. **This is the most dangerous gap for Morocco**, where venue Wi-Fi is unreliable. Square Register operates fully offline for hours, syncs on reconnect. **Remediation:** treat each device's local store as the source of truth, sync via an **event log per shift** with monotonic `device_id + sequence_id` keys. Use SQLite (Room on Android), not IndexedDB. Conflicts resolve at the event level, not the row level. |
| Shift management / cash drawer / blind close | **0** | No `shift` entity exists. The sidebar shows "Flous d'lyoum 27 512 MAD" as a static string. **Remediation:** `shift(id, user_id, terminal_id, opened_at, opening_float, closed_at, declared_cash, expected_cash, variance)`. Blind close = cashier declares without seeing system expected; manager reviews variance. |
| Voids / comps / discounts + manager approval | **0** | No void exists in the data model. No reason codes. No manager PIN. **Remediation:** `void(order_line_id, reason_code, manager_id, ts)`. Reason codes are merchant-configurable. Manager PIN required when role < manager. |
| Refund / partial refund + provider reconciliation | **0** | The "remboursement" button at [:1351](kiwi-caisse.html:1351) opens a toast. **Remediation:** refund engine talks to the same payment provider that captured, with idempotency keys, partial-amount support, and a `settlement_match` job to reconcile the daily CMI file. |

**A. Subtotal: 11 / 60 (18%)**

---

## B. Payments

| Capability | Score | Notes |
|---|---|---|
| CMI EMV chip + contactless + PIN + fallback | **0** | No integration. CMI's POS spec (cert via CMI's lab) requires EMV L1/L2 kernel, PIN bypass rules, fallback magstripe. **Remediation:** start with a CMI-certified PAX A920 (already declared in HANDOFF) talking over USB-serial / Bluetooth via vendor SDK. Long-term: SoftPOS (Android tap-to-phone) under CMI's PCI MPoC scheme. |
| QR payments (CMI QR, wallet QR, national QR) | **0** | The national interoperable QR is moving; Moroccan ACPSSI / BAM signaling suggests rollout 2026–27. Need to be ready day-one. **Remediation:** abstract `tender_type` to include `qr_static`, `qr_dynamic`, `wallet_*`, parse the standard payload format (EMVCo MPM/CPM). |
| Cash / split tender / FX | **2** | Cash modal exists at [:2482](kiwi-caisse.html:2482) and computes rendu. But no FX (tourists pay in EUR routinely in Tanger / Marrakech), no multi-tender on one check, no rounding rules. |
| Pay-at-table via QR / handheld | **0** | This is the **single highest-LTV PoS feature in Morocco** (tourist heavy, tip-prone, language gap). Square Order&Pay does this. **Remediation:** every printed bill includes a QR → web-pay page hosted by Kiwi → Kiwi acquires the payment → server gets a push notification. |
| Tokenization / PCI scope | **0** | Not yet relevant (no card data anywhere), but the design decision is now: **never let card PAN touch the Kiwi backend**. Use the PSP's hosted SDK / SoftPOS kernel and store only network tokens / transaction refs. |
| Receipts: paper / email / SMS / WhatsApp | **0** | WhatsApp receipts in Morocco are a category-defining feature. WhatsApp Business API + a template receipt is a 2-week build. Toast doesn't have this. **Remediation:** WhatsApp Cloud API, message templates pre-approved, customer phone collected at checkout (one-tap). |
| Reconciliation + settlement reporting | **0** | Required day-one with CMI: T+1 file ingestion, match `transaction_id` → `settlement_line` → merchant ledger, exception queue for unmatched. Toast/Square have entire teams on this. |

**B. Subtotal: 2 / 35 (6%)**

---

## C. Hardware

| Capability | Score | Notes |
|---|---|---|
| Receipt / kitchen printer (ESC/POS, Star) | **0** | No driver. |
| Cash drawer kick | **0** | Trivial via ESC/POS pulse, but no driver exists. |
| Barcode / QR scanner (camera + external) | **0** | Camera scan is one Capacitor plugin (`@capacitor-mlkit/barcode-scanning`); external USB HID just types into focused input. Neither is wired. |
| Card reader pairing (SoftPOS v1) | **0** | Strategy not yet chosen between (a) attached PAX A920 (HANDOFF preference), (b) Kiwi Tap SoftPOS on the merchant's Android, (c) detached BLE reader (SumUp Air style). |
| Customer-facing display | **0** | No second-screen view. Even a 4-line LCD over USB would be a differentiator vs. Loyverse on cheap Android tablets. |
| Scale (deli / butcher) | **0** | Not relevant for F&B v1. Skip. |

**C. Subtotal: 0 / 30 (0%)**

---

## D. Back-office / Merchant Brain

| Capability | Score | Notes |
|---|---|---|
| Menu engineering | **1** | Static `menuItems` array. No CRUD, no availability windows, no 86-list, no modifier groups, no images. |
| Recipe-level inventory + COGS | **0** | Lightspeed and Toast both link `menu_item → recipe → ingredient → stock_movement`. Margin analytics flow from this. **Remediation:** required for Pro tier; ingredient depletion fires on `order.completed` event. |
| Suppliers / GRN / waste | **0** | Not built. Phase 2 unlock for B2B marketplace lever (see Pass 3). |
| Real-time P&L per location | **1** | Dashboard shows revenue mock. No cost side, no labor cost, no P&L. |
| Labor scheduling / clock-in / payroll export | **0** | Mentioned in dashboard nav, but no functional surface. Toast Payroll is a multi-hundred-million revenue line. |
| Multi-location / franchise / RBAC | **0** | No tenant model. Every demo is single-location. Morocco has emerging chains (Kool Food, Burger Daddy, Café Boutique, Paul franchisees) — multi-location is a wedge into the chains segment. |
| Audit log | **0** | No event log of any kind. |

**D. Subtotal: 2 / 35 (6%)**

---

## E. Growth Surface

| Capability | Score | Notes |
|---|---|---|
| CRM (phone-number identity) | **0** | Not built. In Morocco the universal customer ID is the phone number. Build the customer entity around `+212…` from day one, not email. |
| Loyalty (points/stamps/tiers, WhatsApp) | **0** | Tap-to-stamp via WhatsApp deep link is a category-defining MENA growth feature. **Remediation:** stamp card → WhatsApp message with one-time-code link → server records visit → reward fires at N. Square Loyalty does the in-store half but skips WhatsApp. |
| Online ordering + aggregators (Glovo, Jahez, Talabat, inDrive Food) | **0** | The lock-in feature in F&B SaaS. Toast acquired its way in (Toast Online Ordering, Toast Local). **Remediation:** own-branded ordering page (route per merchant, e.g. `order.kiwi.ma/<slug>`); aggregator inbound via menu-sync API + tablet-less injection into KDS. |
| Reservation / waitlist | **0** | A wedge against TheFork (now Tripadvisor's, weak in Morocco). |
| QR-at-table self-ordering (AR/FR/EN) | **0** | High-leverage in Tanger/Marrakech tourist venues. ~3 weeks of work once payments rail is in place. |
| Marketing automation (SMS/WhatsApp campaigns) | **0** | Not built. Birthday + winback are the two campaigns that pay for themselves. |
| Reviews aggregation + response | **0** | Out of scope v1. Skip. |

**E. Subtotal: 0 / 35 (0%)**

---

## F. Compliance & Local Fit

| Capability | Score | Notes |
|---|---|---|
| Moroccan TVA + invoice numbering + fiscal export | **0** | Required for any merchant > VAT threshold. TVA 10% (restaurant on-premise), 20% (most retail), 7% (water/some goods), 14% (transport). Sequential invoice numbering with no gaps is a legal requirement (DGI). **Remediation:** `tax_rule(jurisdiction, category, rate, code)`, `invoice_sequence(merchant_id, year, last_number)` with a strict no-gap monotonic counter. |
| Arabic-first UX + RTL + Arabic numerals + hijri | **1** | `assets/i18n.js` exists but caisse does not consume it. Arabic numerals and hijri are differentiators during Ramadan in particular. |
| Bilingual receipts | **0** | Receipt rendering itself does not exist. |
| Data residency / BAM alignment | **0** | If Kiwi acquires under its own PE license (HANDOFF Phase 2), cardholder-adjacent data residency in Morocco becomes a hard constraint. Choose hosting now (OVH Casa, AWS Bahrain w/ Moroccan affiliate, or own DC) — picking the wrong region will be a 6-month migration. |

**F. Subtotal: 1 / 20 (5%)**

---

## Aggregate

| Section | Score | % |
|---|---|---|
| A. Operational core | 11 / 60 | 18% |
| B. Payments | 2 / 35 | 6% |
| C. Hardware | 0 / 30 | 0% |
| D. Back-office | 2 / 35 | 6% |
| E. Growth surface | 0 / 35 | 0% |
| F. Compliance | 1 / 20 | 5% |
| **Total** | **16 / 215** | **7%** |

**Conclusion.** The product is at ~7% of world-class POS surface area. That is not a critique — it is an accurate description of a prototype. The actionable question is **prioritization**: which 30 points do you ship first to (a) take the first 100 paying merchants and (b) unlock the $1B levers in Pass 3.

## Prioritized 6-month remediation list (the "first 30 points")

The order is deliberate: each row unblocks the next.

1. **Backend, identity, multi-tenant schema** (merchant, location, user, terminal, shift). Without this, every row below is throwaway. *+2 pts foundational.*
2. **Persistent order + cart, with SQLite-on-Android + an event-log sync protocol.** This is the offline foundation. *+5 pts (A: offline, persistence).*
3. **Menu engineering + modifiers + 86-list.** Merchants self-onboard their menu; nothing else matters if they can't. *+4 pts (A: modifiers; D: menu).*
4. **CMI integration on PAX A920** (vendor SDK, EMV, fallback). One terminal, one merchant, end-to-end. *+5 pts (B: CMI, reconciliation).*
5. **Receipts: paper (ESC/POS over BT) + WhatsApp.** WhatsApp receipt is the marketing wedge. *+4 pts (B: receipts; C: printer).*
6. **Shift + cash drawer + blind close.** Required before any merchant trusts you with the till. *+3 pts (A: shift, voids, RBAC light).*
7. **KDS on a second Android tablet** subscribing to the same event log. *+3 pts (A: KDS, multi-station).*
8. **Refund + void + manager PIN.** With reason codes. *+2 pts (A: voids/refunds).*
9. **TVA engine + invoice numbering + DGI-style export.** *+2 pts (F: compliance).*
10. **Arabic + RTL pass on caisse.** *+1 pt (F: locale).*

That delivers ~31 points and a system you can put in front of 100 paying restaurants in Tanger / Casablanca by Q3 2026. The $1B levers (Pass 3) layer on top of this base.
