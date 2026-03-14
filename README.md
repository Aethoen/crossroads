# Crossroads

Crossroads is a hackathon MVP for AI-powered social coordination. It helps small friend groups coordinate gym sessions, study blocks, coffee runs, meals, and hangouts by combining:

- calendar availability
- optional live or manual location sharing
- activity preferences and group membership
- Claude-powered ranking over deterministic meetup candidates

The current implementation is demo-first and runs without any secrets. When API keys are missing, it uses seeded social graph data and a deterministic fallback matcher so the product still works end to end.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4 with shadcn-style primitives
- Better Auth + Google OAuth
- Drizzle schema for Postgres in `src/db`
- Demo-backed service layer fallback in `src/lib`
- Claude integration via `@ai-sdk/anthropic`
- Google Calendar + browser geolocation integration

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Without auth env vars the app stays in seeded demo mode. With auth env vars it uses Better Auth, onboarding, Calendar connect, and live location heartbeats.

## Environment

Copy `.env.example` to `.env.local` and fill only what you need.

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
DATABASE_URL=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google/calendar/callback
```

Behavior by configuration:

- No env vars: full seeded demo mode, deterministic suggestion fallback.
- `ANTHROPIC_API_KEY`: Claude generates structured suggestion picks from candidate clusters.
- `DATABASE_URL`: Better Auth sessions, Calendar connections, locations, and synced events persist in Postgres.
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`: enables Google sign-in and step-up Calendar OAuth.
- `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`: required for Better Auth in local dev and production.

Google OAuth redirect URIs to register:

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/google/calendar/callback`
- `https://<your-production-domain>/api/auth/callback/google`
- `https://<your-production-domain>/api/google/calendar/callback`

For Vercel production, set `BETTER_AUTH_URL` to the exact production origin. Preview deployments are not guaranteed for Google OAuth unless you register a fixed preview auth domain.

## Important Paths

- `src/app/(workspace)/*`: routed dashboard, friends, groups, and settings pages
- `src/app/api/auth/[...all]/route.ts`: Better Auth route handler
- `src/app/api/google/calendar/*`: Calendar connect, callback, and sync endpoints
- `src/app/api/location/*`: live heartbeat and manual check-in endpoints
- `src/app/api/onboarding/complete/route.ts`: onboarding persistence
- `src/components/dashboard/dashboard-view.tsx`: suggestion feed and confirm/invite/skip interactions
- `src/components/onboarding/onboarding-view.tsx`: sign-in follow-up, Calendar consent, activity preferences, and location choice
- `src/lib/demo-data.ts`: seeded users, friendships, groups, events, routines, locations, venues, memories
- `src/lib/matching.ts`: overlap detection, candidate clustering, scoring, confirm/skip mutations
- `src/lib/claude.ts`: structured Claude suggestion generation with fallback-safe contract
- `src/db/schema.ts`: Drizzle schema for Better Auth tables and app persistence

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If `.next/lock` is stale locally, you can verify with an alternate dist dir:

```bash
$env:NEXT_DIST_DIR=".next-verify"
pnpm build
```

## Current MVP Behavior

- Google sign-in gates the protected workspace when env vars are configured.
- Onboarding collects activity preferences, Calendar consent, and live/manual location mode.
- Google Calendar read sync imports recent and upcoming events into Postgres.
- Foreground location tracking sends live heartbeats while the app is open.
- Dashboard shows AI-ranked meetup suggestions.
- Confirm turns a suggestion into a meetup record in the demo store.
- Skip removes a suggestion from the active shortlist.
- Refresh regenerates the shortlist from the matching pipeline.
- Friends, groups, and settings pages explain and visualize the social graph and privacy model.

## Next Production Steps

- Replace the in-memory demo store with Postgres repositories.
- Persist confirmed meetups, skips, and memory cards in the database.
- Add Places-backed venue lookup and real location pings.
