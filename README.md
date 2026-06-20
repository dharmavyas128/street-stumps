# Street Stumps 🏏

A mobile-first **local cricket scoring & team management** web app with a premium
evening-stadium aesthetic. Built with **React (Vite)**, **Tailwind CSS**, and
**Lucide React**.

## Design system — "Cyber-Field"

- **Theme:** default dark, deep midnight (`#0B0F19`) with soft ambient glows.
- **Surfaces:** glassmorphism — `bg-white/[0.04]`, `backdrop-blur(16px)`, hairline
  `border-white/10`, soft glow shadows (no harsh black).
- **Type:** Space Grotesk (geometric UI) + JetBrains Mono (digital scoreboard numerals).
- **Accents:** Neon Electric Green `#00E676` (primary / boundaries), Vivid Amber
  `#FFA726` (wides, no-balls, warnings), Crimson `#FF1744` (wickets).
- **Micro-interactions:** every scoring button uses `active:scale-95 transition-all
  duration-100` for a tactile, haptic-like press.

## Architecture

| Layer | File | Responsibility |
| --- | --- | --- |
| **State engine** | `src/engine/matchEngine.js` | Pure reducer + all cricket rules, strike rotation, innings/result logic, selectors. Never mutates input. |
| **Narrative** | `src/engine/narrative.js` | Punchy "Match Context" line derived from live state. |
| **History stack** | `src/hooks/useMatchEngine.js` | Wraps the reducer; pushes a **deep snapshot** before each delivery for an instant, unlimited **Undo**. |
| **UI** | `src/components/*` | `MatchSetup`, `ScoreDisplay`, `ScoringControls`, `WicketModal`, `MatchSummary`. |

### Rule Bender (configurable)
Total overs · players per side · wide/no-ball penalty (1 or 2) · Last Man Standing ·
auto-retire threshold (30 / 50 / 100) · which side bats first.

### Scoring model
- **Runs** `0 1 2 3 4 6` — credited to the striker; odd runs rotate strike; strike
  swaps at the end of every (6-legal-ball) over.
- **Wide / No-ball** — penalty runs to Extras, ball **not** counted, strike unchanged.
- **Bye / Leg-bye** — 1 run to Extras, legal ball, strike rotates.
- **Wicket** — modal picks the dismissal; new batter walks in (or solo, under Last
  Man Standing).
- **Auto strike rotation** on odd runs and at over end.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

> Requires Node 18+ (Node 20 LTS recommended). `npm run build` produces a static
> bundle in `dist/`.
