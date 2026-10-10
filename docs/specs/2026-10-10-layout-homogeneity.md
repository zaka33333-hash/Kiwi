# One layout for every Kiwi page · 2026-10-10

Owner's brief: most pages leave empty space on the right. Make every surface
read as one product, with the restraint of an Apple app.

## How this was investigated

`tools/ui-audit/shoot.mjs` is a headless harness. It enters the demo, switches
venue and theme, and screenshots every sidebar page. For each card it also
measures how much of the card's width its content covers.

Agents covered the following:

| Agent | Scope |
| --- | --- |
| Haiku | Boutique at 1440 and 1920 px |
| Haiku | Café at 1440 and 1920 px |
| Haiku | Spa and multi-venue |
| Haiku | Dark mode, and tablet width (1024 px) |
| Sonnet | Every width rule traced to its file and line |
| Sonnet | Survey of the other surfaces: till, waiter app, landing, admin, legal, booking |

## Root cause of the empty right side

The shell is fluid, but each page capped its own body and aligned it left. The
page header (and its hairline) stayed full width. There were six width regimes
in use:

| Regime | Width rule | Pages |
| --- | --- | --- |
| A | Body capped at 1080 px, left-aligned | 7 pages |
| B | Body capped at 1440 px, left-aligned | 3 pages |
| C | Fluid | 4 pages |
| D | 1400 px centred, plus a 24 px inset | 2 pages |
| E | Full-page overlay | — |
| F | Dead caps, never reached | — |

The result at 1920 px: a strip of up to 550 px of blank paper on the right,
with the header line running over it.

## The system

| Element | Rule |
| --- | --- |
| Frame | `--page-max: 1600px` on the page host (`genpage.css`). Header, body and foot share one pair of edges. Fluid up to 1600 px, then centred. No page sets its own outer width. |
| Content | Tables, grids and catalogues fill the frame. Readable text limits itself (about 78ch) and single-column forms to about 720 px. The page never does. |
| Repeating cards | `repeat(auto-fit, minmax(300px, 1fr))` for small fixed sets (templates, recommendations), so three cards fill a row instead of leaving empty tracks. Use `auto-fill` only for open-ended collections such as product grids. |
| Charts inside cards | Fill their cell: width 100%, non-scaling stroke. |
| Tabs and filters | One segmented control (`.kx-tabs` / `.kx-tab`, liquid lens). On a page it sizes to its labels; in drawers and on phones it spans the full width. |
| Labels | 11 px floor everywhere on the dashboard. |

## Shipped in this pass

- **Single frame.** Removed: the 1080 px body and foot caps, the three 1440 px
  overrides (Inventaire, Retours, Promotions), the centred 1400 px Conformité
  and Marges pages, and the dead `.kr-shell` and `.tw-shell` caps.
- **Promotions.** The template cards now fill their row.
- **Marges & budget.** The price recommendations now fill their row.
- **Terminaux.** Sparklines span their columns. The fleet hero names the
  current venue; it was hard-coded to "Café Atlas" on every venue.
- **Commandes.** Uses the shared segmented control. Segmented controls on pages
  now size to their labels.

## Next stages (not yet done)

Ordered by how visible each one is.

1. **One KPI pattern.** Two coexist: the segmented strip with hairlines
   (Inventaire, Catégories, Vendus, Retours) and separate gapped tiles (Équipe,
   Planning, Rapport, Réservations). Keep the strip.
2. **One page header.** Today there are four variants: eyebrow plus title,
   title plus rule, title alone, and title plus pills. Use title, subtitle and
   an optional right-aligned action. Keep the hairline everywhere or nowhere.
3. **One card recipe.**
   - Paper-tinted surface, 20 px radius, 1 px hairline, one soft shadow.
   - Drop the mint glow border on dashboard KPI cards; the survey found it the
     least Apple-like recipe.
   - The dashboard body computes to pure `#fff`. Move it to `--paper`.
4. **Hero cards with one number** (Commandes, Terminaux). A large number on the
   left with an empty gradient on the right. Either put the secondary figures
   on the right or shrink the card to its content.
5. **Tablet width (1024 px).**
   - Tables clip their last column (Équipe, Inventaire, Retours).
   - Accueil and Conformité labels overflow their cards.
   - The Menu tab strip is clipped.
6. **Multi-venue and spa.**
   - Dark-palette leaks on the multi-venue Équipe and Planning pages need a
     check in a real session.
   - Conformité's "Caisse du jour" card stretches to match its neighbour and
     leaves its lower half empty.
7. **The other surfaces.**
   - Take `kiwi-admin.html` as the app reference: paper, one rail, a calm
     32/500 title, hairline cards. Take `status.html` as the public-page
     reference.
   - Unify the navigation chrome. Dashboard, till and admin each use a
     different rail width and colour.
   - One title scale: about 32/500 for apps, 56/500 for marketing.
   - One primary button: fully rounded, 44 px tall.
   - Fix the brand breaches:
     - `agent-access.html` uses Inter and pure white cards;
     - `404.html` is unstyled;
     - bold 700 titles on the booking, printer and agent pages;
     - italics on the landing page.
   - Make `kiwi-serveur.html` fluid instead of a phone mockup centred in the
     window.
   - Stop the booking gradient from ending in a hard edge.

Every stage is CSS-first and keeps the existing markup. Each one is verified
with `tools/ui-audit/shoot.mjs` (before and after) and `tools/ui-audit/sweep.js`
(errors, overflow, clipping) on the café, boutique, spa and multi-venue demos,
at 1024, 1440 and 1920 px, in light and dark.
