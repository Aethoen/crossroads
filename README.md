# Crossroads

AI-powered social coordination. Friends connect Google Calendar and optionally share location; Claude analyzes availability overlaps, proximity, and activity preferences to generate meetup suggestions.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Shadcn/ui** + Tailwind CSS
- **NextAuth v4** — Google OAuth with `calendar.readonly` scope
- **Prisma 7** + PostgreSQL (`@prisma/adapter-pg`)
- **Claude API** (`claude-sonnet-4-6`) via `@anthropic-ai/sdk`
- **Google Calendar API** (readonly, last 14 days)

## Setup

### 1. Environment

Copy and fill in `.env.local`:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...
```

Google Cloud setup:
- Enable **Calendar API** and **People API**
- Add `https://www.googleapis.com/auth/calendar.readonly` to consent screen
- Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### 2. Database

```bash
npx prisma db push
npm run db:seed   # optional demo data
```

### 3. Run

```bash
npm run dev
```

## How it works

1. Sign in with Google → tokens stored in DB
2. Settings → sync calendar → availability blocks computed
3. Settings → share location → proximity enabled
4. Settings → set activity preferences
5. Add friends, accept their requests
6. Dashboard → AI pipeline runs:
   - Loads availability blocks for user + friends (next 48h)
   - Computes pairwise overlapping free windows
   - Scores clusters by proximity × activity overlap
   - Sends top 10 clusters to Claude as structured context
   - Claude returns JSON array of suggestions
   - Suggestions persisted (cached 4h)
7. Confirm a suggestion → creates a Meetup record

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing / auth gate
│   ├── dashboard/page.tsx    # Suggestion feed + upcoming meetups
│   ├── friends/page.tsx      # Friend management
│   ├── groups/page.tsx       # Group management
│   ├── settings/page.tsx     # Calendar, location, preferences
│   └── api/                  # All API routes
├── components/               # UI components by domain
├── lib/
│   ├── matching.ts           # Algorithmic candidate clustering
│   ├── claude.ts             # Claude prompt + response parsing
│   ├── availability.ts       # Free-block computation
│   └── google-calendar.ts    # Calendar API + token refresh
└── types/index.ts
```
