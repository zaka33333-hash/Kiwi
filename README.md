# Kiwi

**A Moroccan fintech super-app for merchants — point-of-sale first.**

Kiwi gives Morocco's cafés, restaurants, and shops the tools Square, Toast, and
Stripe reserved for developed markets: a server mobile app, a restaurant
register, and an owner dashboard — in French, Darija, and Arabic.

> ### ⚠️ This repository is a fidelity prototype, not production software.
> Every surface runs on **client-side mock data**. There is no backend: the
> "live transaction feed", KPIs, and balances are synthetic and generated in
> the browser. Confirming an order currently fires a local notification — it
> does **not** yet propagate between surfaces (see `SYNC_MODEL.md` for the
> intended architecture and the planned in-demo sync layer).
>
> It is built this way on purpose — to demo the product and the team with high
> visual fidelity before the backend and the Bank Al-Maghrib payment-processing
> licence exist. Read it as a high-resolution pitch artifact.

## The three surfaces

| File | Surface | Audience |
|---|---|---|
| `dashboard.html` | Owner dashboard — revenue, KPIs, stock, team | Merchant owner |
| `kiwi-caisse.html` | Restaurant register / checkout (caisse) | Cashier |
| `kiwi-serveur.html` | Server mobile app — tables, orders | Floor staff |
| `index.html` | Marketing landing page | Prospects |
| `pitch.html` | Investor deck | Investors |

## Stack

Vanilla HTML / CSS / JavaScript — no framework, no build step. Open any `.html`
file directly in a browser. Design tokens live in `assets/tokens.css`;
translations in `assets/i18n.js` (FR is the default source text, `en`/`ar`
dictionaries hold the rest).

## Key documents

- **`SYNC_MODEL.md`** — how the three surfaces are meant to stay in sync (the
  answer to the top technical-investor question), plus a backend-free demo
  version we can wire in now.
- **`PITCH_PRIORITIES.md`** — the 16-item roadmap cut down to the 3 things that
  move the next raise, with the rest deferred and justified.
- **`KIWI_2.0_ROADMAP.md`** — processing-dependent features intentionally
  withheld until the Bank Al-Maghrib licence lands.
- **`HANDOFF.md`** — full status, what's done, what's pending.

## Status at a glance

- ✅ Three high-fidelity surfaces, PIN entry, Simple/Pro modes
- ✅ FR / EN / AR with RTL — RTL viewport-overflow bugs fixed
- 🟡 Dashboard i18n coverage being completed
- ⬜ Cross-surface sync (architecture defined in `SYNC_MODEL.md`)
- ⬜ Real backend, accounts, payment processing — post-funding
