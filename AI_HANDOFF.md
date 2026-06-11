# AI_HANDOFF.md — current-state brief for the next agent

> Read this after `CLAUDE.md` (operating rules) and `HANDOFF.md` (deep history/architecture).
> This file is the **"what's true right now and what hurts"** brief — written so a fresh
> session has the same working context as the one that just ended (June 2026).

---

## 1. What Kiwi is (in one paragraph)

Kiwi is a **Moroccan merchant operating system**, POS-first. This repo is a **pitch/demo
artifact** — vanilla HTML/CSS/JS, **no build step, no framework, no backend** (all data is
mocked client-side and persisted in `localStorage`). It's **trilingual: FR / EN / AR with
real RTL**. The flagship surface is `dashboard.html` (the merchant dashboard for a demo
café group, "Café Atlas"). The public site is `index.html`. Treat it as something that has
to **look and demo flawlessly to investors and pilot cafés** — design and polish are part
of the sale.

## 2. Business model (Phase 1 — POS SaaS, four tiers)

- **Kiwi Basic · 199 MAD/mo** — software only, on the merchant's own hardware, unlimited
  devices, **1 établissement**, integrates into the existing till, on-site training + guides.
- **Kiwi Pro · 399 MAD/mo** — everything in Basic **+ 1 free Kiwi cashier**, T+1 settlement,
  hardware maintenance. (The demo account is "on Pro".)
- **Kiwi Ultra · 1 499 MAD/mo** — unlimited établissements, multi-pays, enterprise API,
  dedicated 24/7 account manager.
- **Kiwi Ultimate · sur devis** — bespoke; scope/device-count/price agreed with the client.

Phase 2 = Kiwi Pay (payment institution), Phase 3 = Banking/Investing. **Do NOT add
Pay/Banking/Investing surfaces unless explicitly asked.** **No public financials / asks /
projections** in any external-facing material — public macro data only. The pricing lives in:
the **upgrade modal** (`interactive.js` → `upgrade-pro`), the **landing** (`index.html`:
hero KPI, the editorial pricing manifesto, JSON-LD offers, FAQ, meta, priceRange), the
**savings calculator** (`ux.js` + `i18n.js`), the **sidebar upsell** (`venues.js`), and the
**account hub** (`account.js`). All four surfaces are in sync.

## 3. Stack & conventions (the stuff that bites you)

- **Vanilla, locked.** No React/Next/bundler. Don't migrate. IIFE modules registering into
  `window.Kiwi.handlers`.
- **Global click delegation** (`interactive.js`): `[data-action="x"]` `[data-arg="y"]` →
  `handlers['x'](element, 'y')`.
- **i18n**: `data-i18n="key"` on DOM (FR captured from DOM, EN/AR in a `T` dict in
  `i18n.js`); in JS use the per-module `tr({fr,en,ar})` / `pick({fr,en,ar})` helpers.
  Switch via `KiwiI18n.{setLang,getLang,setTheme,getTheme}`. RTL is driven by `html[lang="ar"]`.
- **Overlays** (`interactive.js`): `Kiwi.modal({title,tag,desc,body,foot,width}) → {el, close}`;
  `Kiwi.drawer(...)`; `Kiwi.appPage(id,{title,subtitle,body})` for **full-page destinations**
  (every sidebar/profile destination now uses this — no more side drawers, see commit
  `fc08d02`); `Kiwi.toast(title,{type,desc,force})`. **`modal()` escapes `title` and `tag`
  (XSS-hardened) but renders `desc`/`body`/`foot` as raw HTML** — never interpolate raw
  user/data into `body`; use the module's `esc()`.
- **Dark mode** (`theme.css`, applied via `html[data-theme="dark"]`): tokens **invert** —
  `--surface` (white→#151B18), `--paper`, **`--ink`/`--paper` SWAP roles**, `--warn-soft`/
  `--warn-ink`, `--n-*`, `--atlas`, `--mint`, `--danger`/`--info`. **Hardcoded hex does NOT
  invert.** **Never use `var(--ink)` as a background** (it goes light in dark — this exact
  mistake broke the sidebar and a dozen banners). `dark-fixes.js` is a runtime safety net
  that darkens stray near-white surfaces and relights dark-on-dark text — it's a band-aid,
  prefer fixing colors at the source with tokens.
- **Scroll-lock**: a global counter `window.__kiwiScrollLocks` + `html.kiwi-locked`. To
  dismiss a modal use the helper close path (e.g. `closeTopModal()` in stock.js), **not**
  `el.remove()` — raw removal leaks the counter and freezes page scroll.
- `Date.now()`/`Math.random()` are fine in normal browser JS (only forbidden inside
  `Workflow` scripts).

## 4. Passcodes (the lock screen on every load)

`dashboard.html` shows a 4-digit PIN gate every session (`paintCells()` ~line 5622). Codes:
`0000`→onboard, `0505`→marketing tease, `0909`→manager role (restricted sidebar), `1111`→
**unlocks the Croissance growth suite** (session only; `body.growth-locked` removed), any
other 4-digit → Café Atlas owner demo. "Entrer dans la démo" = skip. **Every passcode now
also enables the Design 2026 skin** (see below).
To drive the demo in the preview: enter a PIN (e.g. `1111`) into the lock input, or remove
`.kiwi-lock`/`.kiwi-greet` and `.kw-app-hidden` and call `Kiwi.handlers['account-profile']()`.

## 5. Design 2026 — "Liquid Glass" skin (reversible, gated)

- `assets/design-2026.css` — a modern Apple-era glass skin (ambient gradient-mesh + grain,
  frosted translucent surfaces with specular edge-light, rounding, green-tinted depth, spring
  motion) **executed in the Kiwi palette, no new accent colors**. **Every rule is scoped to
  `body.design-2026`** → inert when the class is absent; the classic design is untouched.
- `assets/design-2026.js` — exposes `window.KiwiDesign2026.{enable,disable,toggle,isUnlocked}`.
  Any passcode calls `enable()`; state persists in `localStorage.kiwiDesign2026`. **There is
  NO on-screen toggle** (the user had me remove the floating pill). To revert:
  `KiwiDesign2026.disable()` or delete the `<link>`/`<script>` in `dashboard.html`.
- **Gotchas learned the hard way:** the sidebar must use **fixed dark hex** (not `var(--ink)`,
  which inverts in dark and turned the sidebar white). **Do not force `.kiwi-lock` to
  `position:relative`** — it's a fixed full-screen overlay; doing so collapsed it and left the
  page half-blank (fixed in `08db17c`).
- **The light-mode intensity push landed (`94e8b64`):** richer 4-blob ambient mesh, deeper
  card glass, specular sheen on the home hero, frosted date-range pill + AI input, glass
  feed-row hovers, brand-tinted thin scrollbars, frosted PIN cells on the lock screen
  (visual props only — positioning untouched). (The demo bar was later removed by the
  partner in `e05e298`; the old `.demo-bar` glass rule is inert.)
- **iOS-27 TIER (`eaa421a`) — EXPERIMENTAL, gated behind PIN 1111 ONLY.** Translates
  Apple's real WWDC-2026 announcements (Jun 8: transparency slider, full-edge refractive
  sidebars with colored icons, glass layered into icons — source: macrumors.com/2026/06/08/
  apple-announces-liquid-glass-improvements/) into the Kiwi palette:
  `assets/design-ios27.css` + `assets/design-ios27.js`, every rule scoped
  `body.design-2026.design-ios27` (layers ON the stable skin, never replaces it).
  Smoked-glass full-edge sidebar (mesh refracts beneath; stays dark in both themes so no
  text re-theming), mint-colored nav icons + tinted count pills, layered-glass KPI icon
  chips, display-P3 mint, and the headline: a **Liquid Glass transparency control in
  Paramètres** (Clair/Standard/Givré/Opaque, persisted `kiwiGlassLevel`, FR/EN/AR) — clear
  mode clamps modals/drawers to a legibility floor (the iOS-26 lesson). Only the 1111 PIN
  calls `KiwiDesignIOS27.enable()`; revert = `KiwiDesignIOS27.disable()` (verified clean
  round-trip) or remove the design-ios27 `<link>`/`<script>`.

## 6. The account hub — `account.js` (`Mon profil`)

The owner's command center, fully editable, trilingual, light+dark correct:
- **Personal info** (name/email/phone/language) — persisted under `kiwiSet:owner*`.
- **Mes établissements** — one rich card per business (`BIZ_DEFAULTS`: Café Atlas, Maison
  Mansour, Spa Bahia) with live data (CA/commandes/équipe) + full **Moroccan legal identity**
  (ICE, IF, RC, Patente, CNSS, phone). 11-field editor per business; **"+ Ajouter"** creates
  new ones. Persistence: `kiwiSet:biz:<id>:<field>` for defaults, `kiwiBizExtra` (JSON) for
  added ones.
- **Abonnement** — wired to the 4-tier ladder: Upgrade (opens `upgrade-pro`), Downgrade
  (confirm → steps down `PLAN_LADDER`, persists `kiwiSet:plan`), Voir la facturation, and
  **Résilier** (routed to the account manager via WhatsApp/email/phone — **no destructive
  self-serve cancellation**, per policy).
- Also: `openBilling()` and `openHelp()` are real pages (commit `83045b7`).

## 7. The two dev tracks + git workflow (READ THIS)

- **Two collaborators.** "Us" work on branch **`dashboard-motion`** (agent/growth/dark-mode/
  design/account/pricing). The **partner (badro)** built the **"cafe-atlas" track** on
  `main` (split-bill, video tiles, and the modules `finance.js`, `stock.js`, `team.js`,
  `conformite.js`, `marketing-suite-tease.js`, plus `cafe-atlas.html`/`kiwi-caisse.html`/
  `kiwi-serveur.html`). The two tracks were **merged** this session (`f0a312c`) — both fully
  preserved. Safety backups exist locally: `backup/dashboard-motion-pre-merge`,
  `refs/backup/origin-main-pre-merge`.
- **Remotes:** `origin` = `github.com/badro99/Kiwi` (shared, the one that matters);
  `fork` = `github.com/zaka33333-hash/Kiwi`.
- **Commit rule (from CLAUDE.md):** commit + push after **every** edit, no asking. Stage
  **specific paths** (never `git add -A`). Message format `<scope> · <what changed>` + footer
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. **Land every commit
  on BOTH `origin/dashboard-motion` AND `origin/main`** (fast-forward main to the new commit;
  the in-session pattern is `git push origin <sha>:main`). The local mirror
  `/Users/badrosonair/Documents/kiwi` referenced in CLAUDE.md **does NOT exist on this
  machine — skip it.** Don't commit secrets.

## 8. What this session shipped (newest first)

**Jun 11 (night):** `50bdbce`+`57b181b` **PIN 0000 turns kiwi-caisse into a pressing** —
the Tangier-prospect demo: one terminal, two métiers. His restaurant = any 4-digit code
(caisse untouched), his pressing = **0000**; the KDS station moved to **0001** (pin-foot
hint updated). New `assets/pressing-caisse.{js,css}` (~2 700 lines) inject a full laundry
counter scoped to `body.is-pressing` — the only shared surface is the 3-way PIN branch +
`window.__kiwiPinReset()` (extracted from lockoutKitchen). The **headline differentiator
is the VISUAL intake grid** (24 hand-drawn SVG garments, 6 catégories, prix MAD par
garment×service — text-list incumbents don't have this). Intake flow: tap garment →
config sheet (service segmenté à la **lentille liquide** — liquid-lens.js now loads in
the caisse, its selectors match nothing restaurant-side; costume 2/3 pièces, tapis S/M/L,
couleur, notes usuelles, **photo état** mock) → ticket courant → client **PHONE-FIRST**
(reco fidèle + préférences, B2B –15 %, fiche rapide, passage) → date promise suggérée
(dimanche sauté) → **reçu thermique + 1 étiquette code-barres PAR PIÈCE** (costume 3p =
3 étiquettes) → encaissement (maintenant / acompte / **au retrait = habituel** / sur
compte B2B; espèces avec rendu, carte = montant envoyé au lecteur partenaire, V1 sans
encaissement Kiwi). Ops: tableau 4 statuts **par pièce** avec recherche téléphone,
détail à steppers, tout-prêt auto-déclenche le **WhatsApp « c'est prêt »** (+ photo du
vêtement fini), retrait par téléphone/scan (cintre en GROS, solde verrouille la remise),
rangement rails A/B/C × 12, hors-ligne simulé (file + sync). Demo data: **Pressing
Marshan** (Tanger), 7 clients dont **Hôtel Bab El Bahr** (compte B2B · facture mensuelle),
12 commandes seedées, 1 en retard. Gotchas: the caisse `.modal-veil`s are z-100 over
`.px-screen` z-90 but DOM ORDER decides between veils (close detail before opening
tags/pay); the offline banner needed `[hidden]{display:none}` (its `display:flex` was
winning); preview verification needs a **resize jiggle 1366×900↔901 to force repaint**
(hidden-tab compositor serves stale frames) and `preview_resize` must be re-applied
after every reload. Dashboard deliberately untouched (owner: "caisse only for now") —
the venue-switcher half of the pressing brief is still open.

**Jun 10 evening (6):** `c98e317` **every card is alive** — staggered card entrance
(.dash-col .block nth-child delays), hover lift (+shadow; rule is `html body .block` to
outrank theme.css's `html .block` color-only transition — merge color transitions in or
theme switching judders), Top produits mini-bars + bench bars draw in from 0 via
`growBars()` (dateRange.js: double-rAF + 450ms timer fallback for hidden tabs), rows
cascade via `--i` stagger, bench rank counts up (animateNumber). Health ring / mix donut /
rev chart were already animated. The 3s live tick only re-renders hero/KPI/chart/feed, so
nothing replays on its own; reduced-motion disables all of it.

**Jun 10 evening (5):** `74e56e8` **the 0000 session stops leaking the demo** — from a
merchant-created venue, the switcher still offered the 3 demo venues + « Go Ultra »
(fusion = demo aggregation), and « Marges → » opened Café Atlas's product margins. Now:
`renderDropdown` lists only the merchant's own venues in the 0000 session
(`window.__kiwiOnboard`, set at PIN entry) with an « Ajouter un établissement » CTA
(action `onboard`); dropdown rows escape merchant-typed name/location; `view-margins`
(dashboard-extra.js) gets a trilingual starter drawer for custom venues. Demo sessions
unchanged. NOTE: other [data-action] drawers reachable from custom venues may still show
demo data — guard them with the same isCustom pattern as they surface.

**Jun 10 evening (4):** `86d695d` **« Pour vous » opportunity cards** — Shopify-style
suggestion band under the KPI strip, Kiwi-native (`assets/oppo-cards.js`, self-contained:
injects its own CSS). 5-card pool × 3 slots, each card = one real feature (payment-link,
loyalty, agent-mode, capital, zakat) + a brand-token SVG illustration + one text CTA wired
to the feature's existing handler + a dismiss ✕ persisted in `kiwiOppoDismissed`; band
self-removes when the pool is dry. Staggered entrance, hover lift + art parallax,
reduced-motion + RTL safe, trilingual w/ langchange re-render. To add a card: append to
POOL + ART in oppo-cards.js (no other wiring).

**Jun 10 evening (3):** `bd45e69` **custom venues stop leaking demo data** — a fresh venue
opening « Catégories » landed on Maison Mansour's caftans (200 demo products, 249 320 MAD).
No page module had isCustom guards. New starter-page layer (end of pages-pro.js): 19
destinations render an honest « Encore rien ici — et c'est normal » starter for custom
venues — trade-titled via subtype profile (pharmacie → Familles & ordonnances), venue-named
subtitle, three what-will-appear bullets, `.gp-starter` CSS. CRITICAL gotcha discovered:
team.js / stock.js / conformite.js / finance.js re-install their nav handlers at
`load + setTimeout(0)` to win override wars — any naive load-time wrap gets clobbered.
The starter wrap is idempotent (`__kiwiStarter` flag), re-asserted at load+150ms AND on
every venue switch. Pass-through branch clears `page-genpage` (direct handler invocations
bypass the sidebar router's cleanup and would mask body-class pages like Équipe).

**Jun 10 evening (2):** `9b757a8` **every sidebar destination is a full page** — the last 8
drawer-based destinations (boutique: inventory/catégories/promos/retours · spa: calendrier
RDV/services/praticiennes/fiches clients) converted to `Kiwi.appPage()` full views, same as
transactions/terminaux/réservations. Root cause of the "raw text" look the user screenshotted:
the spa family's CSS (~80 classes: `.s-*` `.pr-*` `.sc-*`) had NEVER been written — now in
pages-pro.css (+260 lines, tokens only): positioned week-calendar grid, KPI strips, heat row,
waitlist, iOS toggle, package cards, practitioner cards, client CRM. appPage() now returns a
drawer-compatible `close()` (goes home) and rebuilds a fresh `.dash-genpage` host per render
(destinations attach listeners to the host — reuse stacked duplicates). Nested detail
drawers/wizards stay drawers on top of pages. Gotcha for future conversions: root lookups
must point at `.dash-genpage`, not `.kiwi-drawer`; drop `data-dismiss` foot buttons.

**Jun 10 evening:** `2368b21` **all 15 trades get full home-card vocabulary** — the vocab
layer extended from gym-only to every onboarding activity type. Each trade now has its own
feed badge ("FOUR ALLUMÉ", "EN TOURNÉE", "FOURNIL OUVERT"…), products card (Top boissons /
combos / fournées / pizzas / menus / titres / compositions…), manage link, staff card
(Performance vendeurs / praticiens / coiffeurs / coachs), evening card (précommandes gâteaux,
prochain événement, prochain emplacement, GARDE pharmacie, livraisons fleuriste), nav label
and ask-bar placeholder — all FR/EN/AR in `SUBTYPE_PROFILES[*].vocab` + `BASE_VOCAB`
(venues.js). Field-level merge: a subtype overrides only what differs from its base
vertical. All 15 probed live; AR pass on boulangerie; Café Atlas restores stock copy.

**Jun 10 early evening:** `9d805fa` **home cards speak the trade's language** — follow-up
to the subtype profiles: the user opened their gym and the home cards still said
« Première commande à venir », « ingrédients », « Gérer menu », « votre restaurant ».
New vocab layer: `BASE_VOCAB` (boutique/spa) + `SUBTYPE_PROFILES[*].vocab`
(sport/coiffure/pharmacie) in venues.js, resolved by `KiwiVenue.getVocab(section)`;
dateRange.js `tradeStr()` merges it over the default empty-state dicts (feed badge,
stock card, evening card, Top produits, Performance équipe, ask-bar placeholder, sidebar
« Commandes » → Passages/Ventes/Encaissements). Products/staff card titles + the manage
link moved from `data-i18n` to JS-owned text so the per-venue relabel can win — restores
mirror the former i18n values exactly. Also fixed the « NaN % » Rétention tile (0-division
in the retention derive on a fresh venue's zeroed data).

**Jun 10 end of afternoon:** `e5adccb` **each trade gets its own features** — the 15
onboarding activity types stop inheriting restaurant/boutique/spa wholesale.
`SUBTYPE_PROFILES` in venues.js: 12 full trilingual profiles (café, fast-food,
boulangerie, pizzeria, traiteur, food truck, épicerie, pharmacie, librairie, fleuriste,
coiffure, salle de sport), each with its own sidebar nav labels (mapped onto the base
vertical's nav targets, so pages still work), its own KPI band spec (keys from the valid
data-key set; labels in the trade's vocabulary — "Patients réguliers", "Retours labo",
"Passages", "Rétention"), and 3 **optional** step-2 onboarding questions. The wizard is
now two steps: type+name → trade questions with « Passer pour l'instant » skip; answers
persist as `profileInfo` on the custom venue (skip ⇒ null). KPI band wiring: profile
labels win over the generic KPI_CATALOG and tiles skip `data-i18n` (i18n.js would
overwrite them); the band re-renders on `kiwi:langchange` so AR/EN re-pick. Gotcha fixed
on the way: `vData()` zero-cloned **cafeAtlas** for every custom venue, so
vertical-specific tiles (tauxRetour, retention…) silently dropped — it now clones the
base type's demo sibling (maisonMansour / spaBahia). Verified live both paths:
Pharmacie (full answers, FR+AR) and Salle de sport (skip path).

**Jun 10 late afternoon:** `32b6b59` **Exclusif Ultra band** — the fusion/portfolio view
(the Ultra experience) gains Section 5b living the 1 499 pillars: actionable cross-site
AI rec (+3 800 MAD/sem staff transfer, real roster names), account manager card (Yasmine
Kabbaj, median 11 min), enterprise API panel (key/webhooks/SFTP/SLA), ROI header line
(≈0,1 % du CA portefeuille — matches the 1,47 M sidebar figure). Trilingual FS_ULTRA_STR
in venues.js; CTAs = honest toasts; upgrade modal Ultra tier now lists portfolio view +
ROI. NOTE: dashboard2.html (partner's hotel fork) has its own copies — not synced. ·
`6eeb0ac` **main column + side rail** (.dash-cols two independent stacks; cards pack at
exactly 14px; <1100px dissolves via display:contents + priority order).

**Jun 10 afternoon:** `993e60c` **the 10/10 polish sweep** — a 6-agent Workflow audit (71
graded findings, full output preserved in the commit message) → ~50 fixes in 23 files:
every flat-slab row hover → eased brand tint w/ rounded end cells; press states across the
overlay kit/landing/wallet; dark-mode root causes (venue dropdown, heatmap ramp via
color-mix, KDS invalid nested @keyframes strobe, .on-state specificity traps in growth
modules, sparkline token, ~40 leftover #fff); the ux.css duplicate focus rule that
RESHAPED buttons on keyboard focus; the dead Export button (cross-IIFE ReferenceError);
RTL mirrors for the 2026 row leans; brand.html 'Deux paliers' → 'Quatre formules. Deux
expressions.' Earlier same day: `cfbf1e6` lens-wash row hover (the user's canonical hated
slab), `9761527` conscious cards (.row align-items:start — cards end at their data) + the
analyses disclosure as a glass capsule w/ live count chip + animated unfold, `9309a98`
darker iOS-27 sidebar on desktop light, `b4a7a0c` night-crash fix (chart RangeError after
23h sim), `224919c` **la lentille liquide** brand motion + module. Deferred wave-2 (see
spawn-task chip / audit output): traveling lens for command palette + accounting tabs,
six-toggle standardization, .kit-empty empty-state rollout, premium.css deletion, .kb
radius unification.

**Past-midnight Jun 9→10:** `224919c` **LA LENTILLE LIQUIDE** — the capsule bar's sliding
highlight is now THE brand selection motion (`assets/liquid-lens.js`: spring
cubic-bezier(0.34,1.45,0.5,1)·310ms, 115ms stretch-then-settle). Auto-attached to the
dashboard date-range pills, resv/KDS tab rows, the landing audience switch, plus a live
demo + spec in brand.html 07·MOTION; CLAUDE.md §3 makes it a rule (new segmented controls
register in the lens module — never invent another active style). The module only watches
class/aria-selected mutations — existing handlers untouched. · `b4a7a0c` **night-crash
fix**: renderRevChart's live padding went negative after ~23h sim time (RangeError killed
the render+setLang chain for night viewers) — clip to 16 before padding.

**Late-night Jun 9:** `2f6bfad` **mobile capsule bar** — the dashboard's phone bottom nav
is now the serveur app's floating Liquid Glass capsule (same glass recipe + rubber-band
sliding lens, ported to `mobile-nav.js` `movePill()` / `mobile.css`), icon-first with
sr-only i18n labels, live Commandes badge mirroring the sidebar count; phone polish:
LIVE-chip nowrap, date-pill edge fades, 2 dark-mode `#fff` fixes, RTL bidi-isolate on
hero-breakdown values. Verified 375×812 light/dark × FR/AR.

**Push-to-10 polish session (evening Jun 9):** `0aa162e`+`59a8b68` **P0 hotfix — partner's
Safari-fallback commit ate the role-gate's `</script>`, which swallowed the i18n.js include
(blank/FR-only dashboard on main for ~30 min; both of us fixed it in parallel, merged
clean)** · `78dc7af` i18n: live-feed payment strings translated at render time, sidebar
upsell FR/EN/AR + langchange re-render, `sidebar.restaurant.finance` key, RTL bidi-isolate
on hero money figures · `56e3ef6` **tools/check.js smoke suite** (syntax, data-action↔handler
coverage, i18n EN/AR parity, balanced `<script>` tags, forbidden patterns) + tools/push-both.sh;
its first run found two dead spa-services buttons (svc-new, svc-cure-edit — wired) and the
missing role-badge key · `4f5467f` Settings drawer fully FR/EN/AR + **stored-XSS fix**
(custom-venue name/hours/methods were interpolated unescaped) · `94e8b64` Liquid Glass
light-mode push · `831fe88` pages-pro.css 36 white surfaces → `var(--surface)` ·
`4ac23da` **reservations page rebuilt honest**: real dates (Intl per lang), derived counts,
full FR/EN/AR incl. booking notes · `da144fa` a11y batch: menu keyboard nav (roles/arrows/
Escape/focus return), toast live region, appPage focus-to-h1, skip-to-content link, drawer
title escaping, 13 injected-CSS white surfaces → tokens, dark-fixes observer scoped to
added subtrees (it was watching `.app` children while appPage mounts into `.container` —
near-dead before).

**Earlier session:** `08db17c` remove Design-2026 pill (+fix the lock-screen collapse it exposed) · `a001f51`
enable Design 2026 on every passcode · `a13df9f` **Liquid Glass 2026 skin** · `d48135f`
**expand Mon profil → account+business hub** · `83045b7` real Profil/Facturation/Aide pages ·
`fc08d02` unify destinations to full-page format · `e58c4f6` a11y (icon-button aria-labels) ·
`1b3246e` reframe the CMI savings calc · `6ecffe7` **HACCP + equipment data fully trilingual** ·
`ea1fd7b` propagate 4-tier pricing everywhere · `9fb919f` **4-tier upgrade modal** · `1c618f5`
lazy videos · `b1a6341` more conformité/stock i18n · `50654d8` conformité dialog a11y ·
`8ddcc98` make Settings actually customizable. Earlier in the session: comprehensive dark-mode
pass, the big merge, PIN-gated Croissance, finance i18n, **P0 stored-XSS fix at the `modal()`
helper**, stock scroll-lock-leak fix.

## 9. Honest quality state & what's left

**As a demo: ~9.5/10. As a production foundation: ~7** after the push-to-10 session
(locked vanilla stack and monolith files remain by design until a backend lands — that's
the ceiling, not negligence). Scorecard (Jun 9 night): design 10, feature breadth 9.5,
honesty 10, docs 10, i18n 9.5, dark mode 9.5, a11y 9, security 8.5, git hygiene 9.5
(tools/push-both.sh), architecture 7 (first safety net exists now), perf 7.5, production
readiness 3.5 (no backend — deliberate). Open items, all small:
- **EN home-page accent scan returns zero leaks.** Standalone partner pages (cafe-atlas,
  kiwi-caisse, kiwi-serveur) have their own inline dicts — out of i18n.js scope by design.
- **`background:var(--ink)` debt:** ~55 instances inventoried by tools/check.js as a
  warning (runtime-patched today by theme.css overrides + dark-fixes). Don't add more.
- **Savings calculator (`ux.js`):** stays honest, reframed off the "vs CMI" premise —
  **the user actively dislikes overpromising**.
- **Perf:** ~3.5 MB `.mov` in `menu_try_video/` (lazy, metadata-only preload) — fine.
  dark-fixes now rescans only added subtrees, never the full app.
- **Paramètres-as-page:** still offered, still not done (drawer is now fully trilingual).

## 10. How to verify (the loop that works)

**Run `node tools/check.js` before every push** — syntax, data-action↔handler coverage,
i18n EN/AR parity, balanced `<script>` tags, forbidden patterns. Exit 0 or don't ship.
Use the **preview tools** (`preview_start` → `kiwi-static` on **:4173**, then
`localhost:4173/dashboard.html`). Enter a PIN to pass the lock (or click the skip button).
**Always verify across {light, dark} × {FR, EN, AR-RTL}.** **Screenshots are ground truth**
— the contrast scanners give false positives on gradients, trust the picture. Note: the
preview tab is hidden, so `requestAnimationFrame` doesn't fire between evals — take a
screenshot to pump frames before asserting on rAF-gated UI (toasts).
**The partner pushes to main while you work.** Twice in one evening: a feature commit and
a parallel hotfix. If `git push origin HEAD:main` is rejected: `git fetch origin`, inspect
`git log HEAD..origin/main`, merge (never force), re-run `tools/check.js`, push both. Their
Safari-fallback commit shipped with a missing `</script>` that silently killed i18n — the
balanced-tags check exists because of it; run it on THEIR commits after every merge.
`tools/push-both.sh` does the two-branch push with the right failure message.

## 11. User preferences (also in the memory system)

Commit & push everything without asking (both branches). The Kiwi AI agent must handle
multi-turn corrections — the user calls bad/forgetful answers "bullshitting." Wants a
bleeding-edge **2026 / iOS-era "Liquid Glass"** look, with big visual experiments **gated +
reversible**. Values **accuracy and honesty** over hype. Action-oriented — prefers "just do
it and push" over long check-ins.
