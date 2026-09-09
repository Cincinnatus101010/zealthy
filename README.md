# Personal Wellness Tracker

A full-stack wellness dashboard I built for the Zealthy engineering exercise. Users can review sleep and step data from the Zealthy API, log their own wellness entries, and explore everything through charts, a body map, and an entry history drawer.

**Live demo:** https://zealthy-tracker.vercel.app

## Demo accounts

| Email | Password | What you'll see |
|---|---|---|
| `alice@email.net` | `password` | Best starting point — 21 days of pre-seeded water, calories, meditation, and mood entries plus Zealthy sleep/steps |
| `bob@email.net` | `password` | Zealthy sleep/steps plus seeded custom entries |
| `ming@email.net` | `password` | Zealthy sleep/steps plus seeded custom entries |

You can also sign up with any new email. Sleep and steps import automatically from the Zealthy API when data exists for that address.

## What I built

### Core tracking (exercise requirements)

- **Sleep and steps** — fetched live from the [Zealthy API](https://zealthy-personal-wellness-tracker-a.vercel.app/) and merged into the dashboard.
- **Two+ additional activities** — water and calories are first-class tracked metrics with daily cards and charts.
- **Free-form custom entry** — log anything (meditation, mood, stretching, etc.) via the **Custom** option on the + button.
- **Preset quick-log** — water, calories, sleep hours, and steps from the floating action button.

### Visualization

- **Sleep hypnogram** — overnight stage timeline built from Zealthy sleep intervals.
- **Trend charts** — Recharts area charts for overview and per-metric drill-down.
- **Interactive body map** — click a body region or metric card to link highlights and charts.
- **Wellness scores** — daily summary scores for sleep, mental, and physical sections.

### Product polish

- **Auth** — email/password login and signup via Better Auth.
- **History drawer** — browse and delete logged entries without leaving the dashboard.
- **Onboarding tour** — React Joyride walkthrough of the main features (replay via **Tour** in the nav).
- **Glass dashboard UI** — responsive layout with TroisiUI components.

## How it works

### Request flow

```
Browser → Next.js App Router → Dashboard API / Wellness API
                                      ↓
                              Prisma → Neon Postgres (user entries)
                                      ↓
                              Zealthy API (sleep + steps by email)
```

On each dashboard load, the server:

1. Reads the signed-in user's custom wellness entries from Postgres.
2. Calls the Zealthy API with the user's email for sleep and step data.
3. Merges both sources into a single `DashboardData` payload (metrics, charts, hypnogram, scores).
4. Returns JSON to the client, which hydrates via SWR for live updates after logging.

### Why the hypnogram shows the full night

Zealthy returns many sleep intervals across several days. The app groups intervals into overnight sessions (split on 3+ hour awake gaps), then picks the most recent session with at least 60 minutes asleep. That avoids showing a small evening snippet as "last night."

### Why custom entries appear immediately

Logging posts to `/api/wellness`, persists through Prisma, then triggers SWR revalidation. The dashboard refetches without a full page reload.

### Auth and routing

- `/` redirects to `/login` (or `/dashboard` if already signed in).
- `/dashboard` is protected by middleware that checks the Better Auth session cookie.
- Test accounts are created by `prisma/seed.ts` with bcrypt-hashed passwords.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Next.js 15 App Router |
| Backend | Next.js Route Handlers, Prisma ORM |
| Database | Neon Postgres |
| Auth | Better Auth (credential provider) |
| Charts | Recharts |
| Data fetching | SWR |
| UI | TroisiUI + CSS modules |
| Tests | Vitest (24 unit tests) |
| Deploy | Vercel |

## Local setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in:

   - `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — Neon Postgres connection strings
   - `BETTER_AUTH_SECRET` — random secret for session signing
   - `BETTER_AUTH_URL` — `http://localhost:3000` locally, `https://zealthy-tracker.vercel.app` in production
   - `ZEALTHY_API_URL` — defaults to the Zealthy exercise API

3. **Run migrations and seed**

   ```bash
   bun run db:deploy
   bun run db:seed
   ```

4. **Start the dev server**

   ```bash
   bun run dev
   ```

5. **Run tests**

   ```bash
   bun run test
   ```

## Project structure

```
app/
  (app)/dashboard/     Main wellness hub UI
  (app)/_components/   App shell, FAB, history drawer, log forms
  (auth)/              Login and signup
  api/                 Auth, dashboard, wellness CRUD, health
lib/
  wellness/            Dashboard composition, Zealthy integration, sleep timeline
  auth/                Session helpers, route constants
prisma/
  schema.prisma        User, wellness entries, Better Auth models
  seed.ts              Test accounts and sample data
```

## Submission notes

- **GitHub:** https://github.com/Cincinnatus101010/zealthy (private — collaborator invite sent to `sbraford`)
- **Deploy:** production at https://zealthy-tracker.vercel.app with env vars synced to Vercel and Neon.
