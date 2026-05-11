# Kiwi 2.0 — Payment-Processing Feature Roadmap

This document tracks features that have been **removed or hidden from Kiwi 1.0** because they only make sense once Kiwi holds a Bank Al-Maghrib payment-processing license. Each entry notes:

- What the feature is
- When/why it was removed from 1.0
- Where the code still lives (so it can be re-enabled cleanly for 2.0)
- Any data sources / dependencies that need to come online with the license

When the payment-processing license lands and we move to **Kiwi 2.0**, walk through this list in order and re-enable each block.

---

## 1. Règlements (Settlements)

**Status in 1.0:** **Removed from sidebar.** Code preserved.

**What it does:** End-of-day T+1 settlements ledger, 30-day cash-flow forecast, IBAN management (BMCE / Attijariwafa), interchange + Kiwi fee breakdown, "Régler maintenant" instant-settle CTA, économie vs CMI calculator.

**Why removed for 1.0:** Without our own payment processing, we don't settle anything — the merchant's existing acquirer (CMI / Maroc Telecommerce / etc.) handles money movement. Talking about T+1 settlements that we don't actually perform would be dishonest in front of an investor.

**Where the code lives:**
- `assets/pages-pro.js` → `handlers['nav-reglements']` (line ~572 — full drawer with cash-flow forecast SVG, IBAN cards, settlement detail table)
- `assets/pages.js`    → `handlers['nav-reglements']` (line ~468 — older variant, overridden by pages-pro.js)
- `dashboard.html`     → sidebar `<a data-nav="reglements">` block — **REMOVED in 1.0**
- `assets/interactive.js` → command-palette entry for "Règlements" — **REMOVED in 1.0**

**To re-enable for 2.0:**
1. Re-insert the `<a data-nav="reglements">` block in `dashboard.html` between `data-nav="terminaux"` and `data-nav="conformite"`.
2. Restore the command-palette entry in `interactive.js`.
3. Wire the cash-flow forecast to real Kiwi settlement data (currently hardcoded synthetic series).
4. Wire IBAN management to the merchant onboarding KYC.

---

## 2. Commandes drawer — Réconciliation tab

**Status in 1.0:** **Tab still visible but content is dormant.** *(Left in place because removing a tab mid-drawer would visually scar the layout — consider removing for Kiwi 2.0 launch polish.)*

**What it does:** Per-day settlement breakdown showing volume brut, interchange (1.18 %), Kiwi network fees (0.30 %), TVA on fees, net amount paid to merchant's bank account.

**Why dormant for 1.0:** All the percentages and the "net versé BMCE ••3291" amount imply we're the processor.

**Where the code lives:** `assets/pages-pro.js` → inside `handlers['nav-transactions']`, the `data-tx-pane="rec"` block.

**To re-enable for 2.0:** Just wire the percentages to real settlement data per merchant.

---

## 3. Commandes drawer — Anti-fraude tab

**Status in 1.0:** **Tab still visible but content is dormant.**

**What it does:** Surfaces "Kiwi Sentinel" risk-model alerts (recurring refunds, anomalous QR spikes), with Examiner / Marquer légitime / Bloquer la carte actions.

**Why dormant for 1.0:** Card-blocking is only meaningful if we hold the relationship with the card issuer through processing.

**Where the code lives:** `assets/pages-pro.js` → inside `handlers['nav-transactions']`, the `data-tx-pane="fra"` block.

**To re-enable for 2.0:** Wire alerts to a real Kiwi Sentinel risk-scoring service.

---

## 4. Health-score widget — "Taux succès commandes"

**Status in 1.0:** **Still visible in the dashboard health-score widget.** *(Originally "Taux succès transactions" — renamed in commit 883a7c2 to match the Commandes vocabulary, but the underlying metric is still card-transaction success rate.)*

**Where:** `dashboard.html` around the `.health-check` block.

**To consider for Kiwi 2.0 launch:** Either replace with a Phase-1-honest metric (e.g. "Commandes complétées" / order completion rate from the POS) or remove until we actually have the processing-side data.

---

## 5. Other payment-processing-adjacent surfaces (left in place for now)

These weren't asked to be removed, but flagging for the Kiwi 2.0 walkthrough since they share the same "implies we process payments" problem:

- **Hero card "Net après Kiwi" line** — implies we deduct fees from gross
- **"Économie vs CMI" mentions** throughout the dashboard
- **Mix de paiement widget** (Visa/MC/Wallet/Cash breakdown — informational but coupled to processing)
- **Sidebar "Banque commerçant" section**: Kiwi Compte · IBAN, Avance trésorerie (Capital), Liens de paiement, Factures & TVA
- **Marketing site stat** `stats.2.l` in `assets/i18n.js`: "Card transaction success rate" — currently orphaned (no DOM consumer found in dashboard, but may surface elsewhere)

Review each one against the "what can the POS-only product honestly claim?" rule before the investor demo. The principle: if it only works because we hold an acquirer relationship, it doesn't belong in 1.0.

---

## Removal log

| Date       | Commit  | Feature                              | Reason                       |
| ---------- | ------- | ------------------------------------ | ---------------------------- |
| 2026-05-11 | (this)  | Règlements (sidebar item + cmd palette) | Phase 1 has no processing license |
