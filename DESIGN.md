# Design Brief

## Direction

Nexus Swarm Control — a dark agent-swarm command dashboard where autonomous agents learn from peers, trade real tokens, and coordinate in networks, rendered with a finance-ledger soul: dense, data-forward, and alive.

## Tone

Deep dark command center with luminous money/knowledge/network accents — density over decoration, every number a precise live ledger entry, an empowering sense of a growing, evolving, connected swarm.

## Differentiation

The signature is the "living ledger": every agent's money, knowledge, adopted lineage, trades, and network pool render in Geist Mono tabular numerals beneath a luminous status dot, so the swarm reads as a precise, glowing, evolving balance sheet at a glance.

## Color Palette

| Token        | OKLCH          | Role                              |
| ------------ | -------------- | --------------------------------- |
| background   | 0.13 0.02 155  | deep green-black command canvas   |
| foreground   | 0.93 0.01 150  | soft mint-white text              |
| card         | 0.17 0.022 155 | elevated dark surface             |
| primary      | 0.7 0.17 160   | emerald — money/growth, CTAs      |
| accent       | 0.78 0.12 210  | cyan — knowledge/evolution        |
| muted        | 0.22 0.025 155 | secondary surfaces                |
| success      | 0.68 0.17 150  | positive balances                 |
| warning      | 0.76 0.14 80   | dormant / near-limit flags        |
| destructive  | 0.62 0.2 25    | extinct / alerts                  |
| state.alive  | 0.68 0.17 150  | emerald status dot                |
| state.evolving | 0.78 0.12 210 | cyan status dot                 |
| state.dormant | 0.76 0.14 80  | gold status dot                   |
| state.extinct | 0.62 0.2 25   | red status dot                    |
| state.learn  | 0.7 0.16 300   | violet — learning lineage         |
| state.network| 0.74 0.13 185  | teal — network membership         |
| trade.buy    | 0.68 0.17 150  | emerald — buy / inflow            |
| trade.sell   | 0.62 0.2 25    | red — sell / outflow              |

## Typography

- Display: Space Grotesk — headings, hero, agent names, section titles
- Body: DM Sans — paragraphs, UI labels, table text
- Mono: Geist Mono — all monetary figures, token amounts, prices, block indices, knowledge levels (font-numeric)
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm`

## Elevation & Depth

Layered dark cards on the deep green-black background with hairline borders and a two-tier shadow (subtle resting, elevated hover); luminous status glows provide depth and life, never full-page gradients.

## Structural Zones

| Zone    | Background     | Border     | Notes                              |
| ------- | -------------- | ---------- | ---------------------------------- |
| Header  | bg-card        | border-b   | sticky, elevated, persistent nav   |
| Content | bg-background  | —          | cards on muted/30 alternate rows   |
| Footer  | bg-muted/40    | border-t   | muted utility links                |

## Spacing & Rhythm

Compact 4px-based grid; generous 24px gaps between stat cards, tighter 12px inside cards; consistent 16px page padding on mobile scaling to 32px on desktop for a dense-but-breatheable ledger feel.

## Component Patterns

- Buttons: rounded-md, emerald primary for CTAs, cyan accent for knowledge actions, muted secondary; hover lifts with shadow-elevated
- Cards: rounded-lg, bg-card, border-border, shadow-subtle; hover shadow-elevated
- Badges: rounded-full pills — emerald alive, cyan evolving, gold dormant, red extinct, violet learn, teal network, with glow
- Trade rows: emerald `text-trade-buy` for buys, red `text-trade-sell` for sells; token/amount/price/block in Geist Mono tabular
- Lineage graph: violet glowing nodes with dashed `lineage-flow` animated edges

## Motion

- Entrance: fade-in 0.3s + slide-up 0.4s on page/card mount
- Hover: shadow-elevated + border tint over 0.3s transition-smooth
- Decorative: tick-pulse 2s infinite on the live-simulation indicator; lineage-flow 1.2s on adopted-strategy edges; trade-flash 1.6s on new-trade rows

## Constraints

- Density over decoration; no user-authored strategies or cross-network leaderboards (out of scope)
- All monetary, token, price, and knowledge values in Geist Mono tabular-nums for column alignment
- Token-only styling — no raw color literals or arbitrary Tailwind colors
- 3–5 core hues + capability accents: emerald, gold, cyan, violet, teal, red, neutral only

## Signature Detail

Every agent's money, knowledge, adopted lineage, trades, and network pool render in Geist Mono tabular numerals beneath a luminous status dot, so the swarm reads as a precise, glowing, evolving, connected balance sheet at a glance.
