# Kiwi Caisse — "Feels Like a Till" Redesign

- **Date:** 2026-07-07
- **Status:** Design — approved (user picked all four slices via AskUserQuestion)
- **Author:** Claude, grounded in a competitor study (Square, Loyverse, Toast, SumUp, Shopify) + a hands-on audit of the current café register.

## 1. Goal

Make the café register in `kiwi-caisse.html` **feel like a real point-of-sale**, not an elegant menu browser — fast, cashier-first, tactile — by aligning with what the leading tills do.

## 2. Competitor DNA (what makes a till feel like a till)

From the research: (1) land straight on a **dense, color-coded item grid**, tap-anywhere-to-add with a quantity badge; (2) a **big charge button anchored at the bottom of the cart showing the running total** ("Charge 47.50") is the single most prominent element; (3) **grid + numeric keypad both available** (Square toggles them); (4) cash tender = **quick-cash presets + a huge "Change Due"** (Loyverse/Square signature); (5) minimize taps (cash sale ≈ 4–5 taps); (6) a **confirmation ritual** (full-screen check + change); (7) touch targets ≥48px; (8) with color tiles, **turn images off**.

## 3. Key finding — most tender infrastructure already exists

The `#cash-modal` ([kiwi-caisse.html:4741](../../kiwi-caisse.html)) already has: a "Flous reçu" input, quick-cash presets (+50/+100/+200/+500), a live **Rendu (change)** display, and a **"Khlass! Espèces confirmées"** success step showing the change. The `#card-modal` handles card/tip, and a split flow exists. So this redesign is mostly **elevate + surface + densify**, not build-from-scratch (the round-1 lesson).

## 4. The four slices (all approved)

### Slice C — Denser, color-coded item grid  *(biggest visual win)*
- **Now:** `.menu-item` tiles (CSS at ~834–952) are large and sparse, ~3 columns, each dominated by a per-item line-art icon (`MENU_ART`). Reads like a menu.
- **Change:** tighten to **4–5 columns**; **category color accent** per tile (a left bar / tinted header keyed to the 7 cats: entrees, tajines, couscous, pastillas, sandwiches, boissons, desserts); **price forward** (bigger, mono); **whole tile is the tap target** to add; **quantity badge** on the tile when in cart; shrink the line-art to a small corner mark (research: with color tiles, de-emphasize images). Keep `MENU_ART` (don't delete) but make it secondary. Touch targets ≥48px, ≥10px gaps.
- **Files:** the tile render (builds `.menu-item` HTML from `menuItems` + `MENU_ART`) + `.menu-*` CSS + a `catColor(cat)` map.

### Slice A — Charge-first ticket + surfaced cash/change  *(highest impact)*
- **Now:** `.rp-pay` ([:4511](../../kiwi-caisse.html)) — in new-order mode `#rp-pay-order` shows **"Envoyer en cuisine"** as the big primary; pay is three small icons in `#rp-pay-normal`.
- **Change:** add a **big full-width primary "Encaisser · {total}"** anchored at the bottom of the ticket (competitor "Charge $X"). It opens the tender choice (cash / card / QR) — routing into the **existing** `#cash-modal` (with its Rendu flow) and `#card-modal`. Demote **"Envoyer en cuisine"** to a secondary button (still available for dine-in fire). Improve the cash presets from additive (+50) to **suggested-amount** buttons (Exact · 50 · 100 · 200 — tap sets "Flous reçu" to that note) with the live Rendu (keep the existing Rendu + success). Keep split + réduction.
- **Files:** `.rp-pay` footer markup + the pay-mode show/hide logic + the cash-modal preset buttons/handler + `.pay-*` CSS.

### Slice B — Numeric keypad / quick-sale  *(the missing iconic element)*
- **Now:** no on-screen numeric keypad; no open-price item.
- **Change:** add a **keypad toggle** on the register (a "Montant libre" / keypad mode next to the category grid) — a big numeric pad that rings an **open-price line** ("Article libre · {amount}") into the cart, and doubles for quick quantity. SumUp-style quick sale. Additive; brand-styled; ≥48px keys.
- **Files:** a new keypad panel + a toggle in the grid header + a `addOpenLine(amount)` into `cart`.

### Slice D — Land on the register
- **Now:** café unlock → **Plan de salle** (floor plan). Ringing is 3 taps deep.
- **Change:** counter café **lands on the item grid** (À emporter → Nouvelle commande equivalent) OR the unlock adds a prominent **"Vente rapide"** that opens the grid in one tap. Floor plan stays one tap away (Salle). Least-risk: default the café view to the grid and keep Salle/À emporter/Attente switching.
- **Files:** the café view-init / default-tab logic.

## 5. Sequencing

1. **C** — grid density + color (most visible).
2. **A** — Encaisser anchor + surfaced cash/change + suggested amounts.
3. **B** — keypad / quick-sale.
4. **D** — land on the register.

Each slice: implement → verify live in the preview (screenshot + interaction) → `node tools/check.js` green → commit → (supervisor pushes both remotes at the end, or per slice).

## 6. Non-goals / honest scope

- Not touching pressing or the pos-* verticals (café only this round).
- Not adding item photos (brand is line-art + color tiles).
- Modifiers (size/extras) and open-tabs remain as-is unless trivially in reach.
- The hardware bridge stays mock (no certified EMV).

## 7. Verification

- Live in the preview at the register: dense grid renders, tiles color-coded, tap adds + badge; "Encaisser · {total}" opens cash → suggested amount → Rendu → Khlass success; keypad rings an open line; café lands on the grid.
- `node tools/check.js` green (no new unwired `data-action`, scripts balanced).
- Deploy to both remotes; bump the SW cache (`kiwi-app-v3`→`v4`) since `kiwi-caisse.html` is a shelled asset.
