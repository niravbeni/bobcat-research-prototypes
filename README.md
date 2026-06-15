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

All three read from one shared list of priorities (`src/lib/priorities.ts`
holds the built-in defaults). The wording can also be customised at runtime via
the admin page, which persists edits to a database — see below.

## Admin / editing content

Visit **`/admin`** and enter the password to edit the title, short label, and
question for every priority. Changes apply instantly across all three
prototypes.

- Default password is `bobcat2026`. Override it in production by setting the
  `ADMIN_PASSWORD` environment variable.
- Category (Need / Want) and the icon for each priority stay fixed in code.

### Persistence (database)

Edits are stored in a single Redis document via
[`@upstash/redis`](https://github.com/upstash/redis-js). The store auto-detects
its backend:

- **Production (Vercel):** add a Redis store from the Vercel Marketplace
  (**Storage → Create → Upstash for Redis**) and connect it to the project.
  Vercel injects the credentials automatically — the code reads either
  `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or the legacy
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Redeploy after connecting.
- **Local dev:** with no Redis env vars set, edits fall back to a local
  `.data/content.json` file (gitignored) so you can test the admin flow without
  a database.

The admin page shows a badge indicating which backend is active
("Database connected" vs "Local file (dev)"). Without a Redis store connected,
saving on the deployed site will fail with a helpful message.

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

Import the repo on Vercel and deploy. The prototype pages render on demand so
admin edits show up immediately. To let edits persist on the live site, connect
a Redis store (see [Persistence](#persistence-database) above); optionally set
`ADMIN_PASSWORD`.

## Notes

- Desktop-first but responsive down to mobile, with pointer + touch support for
  all swipe / hold / drag gestures.
- Respects `prefers-reduced-motion`.
- Participant interactions are not persisted — only the admin-edited content is
  stored.
