# Kiwi Caisse — Executive Summary

## Where the product is today

Kiwi's caisse is a **3,147-line single-file HTML mock** ([kiwi-caisse.html](kiwi-caisse.html)) — a visually credible, design-forward demo with hardcoded data, animated payment modals, and zero persistence. There is no backend, no payments rail, no offline, no authentication, no hardware integration, no test, no Android binary. Scored against Toast / Square / Lightspeed / Loyverse on 215 capability points, the product is at **7%**. This is an accurate description of a high-quality prototype, not a critique — but the production codebase has not been started yet.

## The three biggest things missing to compete with global incumbents

1. **A backend, a persistent multi-tenant data model, and an offline-tolerant event-log sync between Android client and server.** Without this, every other feature is throwaway. Square's POS runs offline for hours. Kiwi's doesn't run at all.
2. **Real payments acceptance — CMI EMV on a certified terminal, end-to-end including T+1 settlement reconciliation against the merchant's bank.** Without this, Kiwi is a menu app.
3. **The operational depth that pays for itself in the kitchen** — modifiers + courses + KDS surface + multi-station printing + shift/cash-drawer/blind close + void/refund/manager PIN + WhatsApp receipts + TVA-compliant invoicing. Each of these blocks a real café from switching from its existing till.

## The three biggest things missing to be worth $1B

1. **Embedded acquiring.** SaaS at 399/699 MAD/mo is a sub-$100M business at full Moroccan saturation. The valuation lives in taking the 0.7% take rate on every transaction that flows through Kiwi tills. The POS is the distribution channel for the payments business — not the product.
2. **A merchant data substrate that unlocks lending (Toast Capital / Square Capital).** This requires the event log to be designed correctly from day one. Get the event schema wrong and the data is unusable for underwriting at 50M rows.
3. **A vertical-AI assistant ("the cashier's second brain") delivered in-flow on the till and via daily WhatsApp briefs to owners.** The model is commodity; the data substrate and delivery surface are the moat. Cheap to ship once Lever 1 + the event log exist.

## The 12-month bet

- **Q1 2026 — Foundation that can take a card.** One merchant, one CMI terminal, one card, reconciled to IBAN T+1, fully offline-tolerant.
- **Q2 2026 — A real café actually runs on Kiwi.** Modifiers, KDS, printing, shift close, refunds, TVA, Arabic. 25 paying merchants.
- **Q3 2026 — The flywheel inputs come online.** Inventory, loyalty, pay-at-table QR, daily WhatsApp brief, merchant dashboard. 100 paying merchants.
- **Q4 2026 — Money moves in both directions.** Kiwi Capital v1 (Murabaha cash advance) pilot, online ordering + aggregator integration, BaaS partnership locked. 250 paying merchants + first non-SaaS revenue line.

## What I need from the founder in the next 14 days to unblock all of it

1. **Architecture decision: kill the "vanilla HTML in a WebView" path.** Confirm production stack is native Android (Kotlin + Compose) + Go backend on Casablanca-region hosting. The HANDOFF's "vanilla forever until backend lands" rule was right for the demo and is wrong for the product.
2. **Payments partner clarity by day 14.** Pick the Q1 partner: CMI-certified PAX A920 via vendor SDK *or* SoftPOS-vendor + a CMI member-bank IPSP relationship. The whole roadmap depends on which terminal we integrate first.
3. **First design-partner café signed in Tanger.** Founder-led, free SaaS for 6 months in exchange for early-access feedback and the right to be Kiwi's reference customer. Without a real venue, the production team is building blind.
4. **Two hires kicked off:** (a) Android-payments engineer with prior EMV / SoftPOS experience; (b) backend engineer with prior payment-settlement systems experience. Both are in Casablanca / Rabat / remote-MENA labor markets — recruitable.
5. **License posture decision** between (a) operate as IPSP under CMI through a partner bank (faster, lower control) and (b) Kiwi's own EME/PE license (slower, higher control). Both can run in parallel; the founder needs to pick which one product launches on.
6. **A 90-minute working session** to walk through [01_codebase_map.md](01_codebase_map.md), [02_feature_gap_matrix.md](02_feature_gap_matrix.md), [03_billion_dollar_levers.md](03_billion_dollar_levers.md), [04_architecture_and_roadmap.md](04_architecture_and_roadmap.md) — disagree with what's wrong and lock the rest.

## The single sentence that summarizes all of this

**Kiwi has a beautiful demo and zero product; the $1B outcome is built by shipping CMI acquiring in Q1 and treating every subsequent feature as a leverage point on top of that one fact.**
