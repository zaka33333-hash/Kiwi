# 03 — The $1B Layer

SaaS at 399/699 MAD/month is a sub-$100M business in Morocco even at 100% market share (~50–80k F&B venues × ~600 MAD/mo × 0.5 capture = ~24M MAD/mo ≈ $30M ARR). To get to a $1B outcome the POS must be the **distribution channel for higher-margin financial and data products**. The eight levers below are ranked by realistic 5-year contribution to enterprise value, not by hype.

For each: (a) is the current architecture compatible, (b) minimum technical work to enable, (c) revenue model, (d) moat.

---

## Lever 1 — Embedded Acquiring (THE lever)

**Status:** Architecturally compatible — there is no architecture. Strategically pre-decided: HANDOFF Phase 2 = "Kiwi Pay" under own PE license at 1.40% domestic / 2.20% international. The POS is the *only* place this distribution gets won; standalone PSPs in Morocco (PayZone, CMI Direct, YouCanPay) cannot match a bundled POS+acquiring play.

**Min. work to enable:**
1. **Acquirer-agnostic payment abstraction** in the POS. `Tender` interface with `authorize`, `capture`, `void`, `refund`, idempotent. Plug CMI v1 in; later swap to "Kiwi Pay" once the PE license lands without rewriting the POS.
2. **Merchant onboarding flow** that captures KYB (RC, ICE, ID, bank IBAN, beneficial owner) — eIDAS-grade scans + face match. Today: nothing. Build with `Onfido`/`Veriff` + manual review queue.
3. **Settlement engine.** Daily T+1 sweep, fee calculation per-transaction, payout instruction to merchant IBAN, exception ledger. This is a real backend service.
4. **Risk engine, even a v0.** Velocity rules + chargeback/dispute ledger. CMI's dispute window for domestic is brutal — get this right or get destroyed by fraud losses.

**Revenue model:** Take 0.5–0.9% of GMV (i.e., 50–90% of the 1.40% domestic rate after interbank). At 5,000 venues × 200k MAD/mo GMV × 0.7% net = ~7M MAD/mo ≈ $8.5M ARR. Globalizes by adding more rails.

**Moat:** A merchant who has switched their till to Kiwi will not re-train staff to switch acquirers for 20 bps. Switching cost = the till, not the rail.

**90-day enablement:** Build the abstraction (2 wks). Integrate one CMI-certified terminal end-to-end (4 wks). Stand up settlement reconciliation against CMI's T+1 file (4 wks). Onboard 10 design-partner merchants. License application runs in parallel; the *acquired-as-IPSP-of-CMI* path can ship product before the PE is granted.

---

## Lever 2 — Embedded Lending / Merchant Cash Advance

**Status:** Not possible today (no daily revenue ground truth). **Becomes possible the moment Lever 1 ships**, because then Kiwi has settled-volume ground truth per merchant. Toast Capital, Square Capital each contribute 10–15% of revenue at 60%+ gross margin.

**Min. work to enable:**
1. **Daily merchant revenue feed** → feature store.
2. **Risk model v0** — even a logistic regression on (months-active, monthly-GMV-CV, refund-rate, late-settlement-flags) beats nothing. Get to a Gini > 0.4 before lending.
3. **Murabaha-compliant product structure.** Morocco's halal-finance rules and the founders' (Tanger) market position mean Murabaha advance > interest loan. AMMC and BAM both have published frameworks.
4. **Repayment via daily split of card settlements** — 5–15% of daily collections automatically diverted. This *only* works if Kiwi is the acquirer (Lever 1).

**Revenue model:** 8–14% effective margin (Murabaha markup) on 4–9-month advances. Float economics + repeat usage are where the real money is.

**Moat:** Capital-as-a-service compounds. Toast underwrites better than any bank could because they see the till. Kiwi gets the same edge in Morocco where SME credit is structurally underserved.

**90-day enablement:** Build the feature store + scoring stub (4 wks). Pick lending vehicle — a partnership with an existing licensed `société de financement` is faster than getting a license (Wafa Salaf, Sofac, or a fintech-friendly bank like Bank of Africa). Pilot 50 advances at 10k MAD avg. (4 wks). Wire daily split repayment (4 wks).

---

## Lever 3 — Embedded Payroll

**Status:** Not possible today. Becomes a wedge once Lever 1 is live: pay staff weekly/daily out of the till, with optional early-wage-access (employee pulls 50% of accrued wages before payday). Toast Payroll is on a $400M ARR trajectory.

**Min. work to enable:**
1. Time-clock / shift surface (already needed for shift management — Pass 2 row A11).
2. CNSS / DGI declarations for Morocco (the painful part — every Moroccan SME hates payroll filing, this is *the* purchase trigger).
3. Mass-payout rail (IBAN → IBAN domestic; partnership with a bank or PSP for instant payout to staff IBANs/wallets).

**Revenue model:** Fixed per-employee fee (15–30 MAD/employee/month) + take rate on early-wage-access (1–2% per draw).

**Moat:** Once payroll runs through Kiwi, the merchant's whole back-office gravity is on Kiwi. Replacing the POS now means replacing payroll. Switching cost goes from "weeks" to "months."

**90-day enablement:** Out of scope for the first 90 days. Quarter 3 of the roadmap.

---

## Lever 4 — Marketplace Flywheel (consumer side)

**Status:** Not built. The `wallet.html` consumer mock at [wallet.html](wallet.html) is positioned as fintech, not as a marketplace. **This is the most contested lever** because every POS company has tried it and most failed (Toast killed Toast Local for a reason — diners go to venues, not POS-branded directories).

**The Moroccan-specific opening that doesn't exist elsewhere:** a *payment* marketplace, not a *discovery* marketplace. Tourists in Marrakech/Tanger/Fès pay in cash today because their cards get declined at 30% of venues. A Kiwi wallet that (a) loads in EUR/USD and pays MAD at any Kiwi venue with zero FX surprise, (b) hands the merchant zero interchange (because Kiwi is the acquirer), (c) hands the diner a 5% cashback funded by the interchange savings — that is a real wedge.

**Min. work to enable:**
- Lever 1 (acquirer) live.
- Consumer wallet app — Capacitor app over a React/Compose codebase.
- KYC-lite under Morocco's "compte de paiement allégé" rules (5k MAD/mo cap).
- Network effects start once 200+ merchants in one city are live.

**Revenue model:** Interchange savings sharing + FX spread on EUR/USD load + lead-gen take rate (paid placement of venues in the in-app map).

**Moat:** Two-sided. The hard part is starting; once 500 Casablanca venues are live with 50k active wallets, copying it requires both sides of the network.

**90-day enablement:** Don't start in 90 days. This is Year 2.

---

## Lever 5 — B2B Supplier Marketplace

**Status:** Not built. Each merchant's `purchase_order` and `supplier` data is a future asset; right now nothing captures it.

**The play:** Aggregate wholesale purchasing across hundreds of cafés (Cosumar sugar, Lesieur oil, Centrale Danone dairy, Lesaffre yeast, Délice Bakery flour, fresh produce from Marché de Gros Casablanca). Negotiate group discounts. Take a clip.

**Min. work to enable:** Inventory + supplier module (Pass 2 row D3). Bolt a procurement layer on top once 1,000+ merchants are using inventory.

**Revenue model:** 1–3% on aggregated PO volume + rebate from suppliers.

**Moat:** Mid-strength. Copyable but requires the merchant base.

**90-day enablement:** Not in scope for 90 days. Year 2.

---

## Lever 6 — Data Products

**Status:** Impossible today (no data). Becomes possible at ~1,000 merchants.

**The plays:**
- **Benchmarks** ("your evening covers are in the 32nd percentile vs. cafés in Marshan, Tanger") — drives engagement and retention.
- **Demand forecasting** for inventory ordering, paired with the supplier marketplace.
- **Dynamic pricing** (rare in Moroccan F&B, but happy-hour automation is a v0).
- **Anonymized macro panels** sold to FMCG (Coca-Cola, Cosumar, Centrale Danone). This is a real revenue line — Toast sells industry reports, Square publishes pulse data.

**Revenue model:** Cross-sell uplift on retention; modest direct revenue from FMCG panels.

**Moat:** Data compounds — and Moroccan F&B data has no incumbent owner.

**90-day enablement:** Build the event log right now so the data exists later. The cost of getting events wrong is enormous when you've got 50M rows.

---

## Lever 7 — BaaS for Merchants (Kiwi Compte)

**Status:** HANDOFF declares it Phase 2 "Kiwi Banking / Kiwi Compte IBAN + debit card + Murabaha." Regulatory bar is high — full PSP/EME license under BAM. Realistic timeline: 18–30 months from filing.

**Min. work to enable:**
1. Decide vehicle. Three credible paths in Morocco: (a) own EME license, (b) partner with CIH Bank or Bank of Africa as agent, (c) acquire a small licensed entity.
2. Virtual IBAN issuance — possible via partnership with an issuing bank.
3. Instant settlement — Kiwi credits merchant's Kiwi Compte intraday from card settlement float.
4. Spending card on the Kiwi Compte (CMI-issued or international scheme — Visa/Mastercard cobrand, ~12-month path).

**Revenue model:** Interchange on card spend (~1.5% gross) + float on balances + FX spread on diaspora corridor.

**Moat:** Brutal. Once merchant payroll, settlement, and spending all live in Kiwi Compte, you own the relationship.

**90-day enablement:** Strategic-only. Begin license conversations now; product work later.

---

## Lever 8 — Vertical AI ("the assistant cashier")

**Status:** No surface for it. But cheap to ship a first version once the order event log exists.

**The plays (in order of "won't make it" risk):**
- **Upsell prompts at order entry** — "Customer ordered Tajine kefta and Thé — Crème brûlée is the most-attached dessert at this time, suggest it." Increase average ticket 4–8% in tests.
- **Table-aging alerts** — "Table 5 has been at dessert for 22 min; offer the bill" (Toast has this).
- **86-list predictor** — "You are about to run out of tagine kefta given current pace." Inventory-aware.
- **Daily brief in WhatsApp** — every morning, owner gets a 90-second voice brief: "Yesterday: 188 covers, AOV 142, top item tajine kefta, you 86'd avocado juice at 21:14, you're trending −12% vs last Tuesday."

**Revenue model:** Bundle into Kiwi Pro; uplifts conversion from Basic → Pro from ~15% to ~40% in our pricing model. Direct ARR boost.

**Moat:** Weak on the *model* (anyone can call an LLM). Strong on the *data substrate* (you have ground truth they don't) and the *delivery surface* (in-flow on the till, not a separate dashboard).

**90-day enablement:** Once event log is live, the WhatsApp daily brief is a 1-engineer / 2-week build. Ship it Q2.

---

## Compounding picture

The eight levers compound. Lever 1 unlocks 2, 3, 4, 7. Lever 2 unlocks 7. Lever 6 unlocks 5 and feeds 8. The single highest-leverage decision in 2026 is **how fast Lever 1 (acquiring) goes live**, because nothing else stacks until then.

If Kiwi takes 18 months to ship Lever 1, the company is a Moroccan Loverse — a few million in SaaS ARR. If Kiwi ships Lever 1 in 6 months, every subsequent product launch is on a base that grows itself.
