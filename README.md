# Bobcat Sorting Prototypes

Three interaction prototypes for collecting and ranking the same set of US
retirement priorities, built for user research on different interaction modes.
Styled to match the Bobcat "cone" design language (purple palette, paper cards,
soft shadows, Inter).

## Prototypes

| Route | Name | Interaction |
| --- | --- | --- |
| `/sorting-deck` | **The Sorting Deck** | Tinder-style card swipe with a 3-way sort (must have / nice to have / don't optimise). Swipe, click, or use ← ↑ → keys. |
| `/coins-on-the-table` | **Coins on the Table** | Spend a limited pool of tokens across priorities, with coin-drop animations and a depleting wallet. |
| `/the-weighting-game` | **The Weighting Game** | Press-and-hold to grow bubbles (or use −/+), drag them between Needs and Wants. A live rank number reflects each bubble's relative weight. |

All three read from one shared list of priorities in `src/lib/priorities.ts`, so
the interaction modes can be compared head-to-head. Edit that file to change the
priorities everywhere.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4
- `motion` (Framer Motion) for the swipe deck; CSS transitions / pointer events
  elsewhere for robustness
- `lucide-react` icons

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build / type check
```

## Deploying

Zero-config on Vercel: import the repo and deploy. All pages are static.

## Notes

- Desktop-first but responsive down to mobile, with pointer + touch support for
  all swipe / hold / drag gestures.
- Respects `prefers-reduced-motion`.
- No backend. All state is in-memory per session (no results are persisted).
