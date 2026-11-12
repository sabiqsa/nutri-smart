# NutriSmart

A PWA for managing hospital patient diets and meal distribution: nurses and dietitians record each patient's diet, the kitchen prints labels with QR codes, and the distribution team scans them to confirm delivery. Dashboards show live portion counts per meal period.

Every screen requires an account, and what a user can see and do depends on their role.

## Screenshots

<!-- Save screenshots to docs/screenshots/ with the file names below. Use dummy patients only, never real patient data. -->

| Login | Dashboard |
| --- | --- |
| ![Login page with email and password fields](docs/screenshots/login.png) | ![Dashboard with portion summary for the current meal period and delivery status](docs/screenshots/dashboard.png) |
| **Patient list** | **Patient form** |
| ![Patient list with room filter and delivery status per patient](docs/screenshots/patient-list.png) | ![Patient diet form with room, diet type, allergies and food form](docs/screenshots/patient-form.png) |
| **Patient detail** | **Print labels** |
| ![Patient detail with diet info and diet change history](docs/screenshots/patient-detail.png) | ![Bulk meal labels with QR codes ready to print](docs/screenshots/print-labels.png) |
| **Scan** | **Analytics** |
| ![QR scanner confirming a meal delivery](docs/screenshots/scan.png) | ![Distribution snapshots per meal period and the last 7 days](docs/screenshots/analytics.png) |
| **Admin: users** | **Admin: meal cut-off** |
| ![User list with role assignment](docs/screenshots/admin-users.png) | ![Meal cut-off settings for Pagi, Siang and Sore](docs/screenshots/admin-meal-cutoff.png) |
| **Mobile dashboard** | **Mobile scan** |
| <img src="docs/screenshots/mobile-dashboard.png" alt="Dashboard on a 390px-wide phone" width="260"> | <img src="docs/screenshots/mobile-scan.png" alt="QR scanner on a 390px-wide phone" width="260"> |

## Features

| Area | What you can do |
| --- | --- |
| **Patients** | Add and edit a patient's diet (room, diet type, allergies, food form, meal frequency); unique medical record number (No. RM); full diet change history; close (delete) a patient. |
| **Labels** | Print a meal label with a QR code for one patient or many at once (`/patients/print-labels`). |
| **Scan** | Scan a label's QR code with the camera and mark the meal as delivered or not distributed. |
| **Dashboard** | Live portion summary for the current meal period (Pagi / Siang / Sore), delivery status per patient, and a bell for urgent requests. |
| **Analytics** | Today's distribution snapshots per meal period plus the last 7 days. |
| **Admin** | Manage users and roles, edit meal cut-off times, and set how long an urgent request stays flagged. |

Shared across the app: installable PWA with an offline page, mobile-first layout, and all times in WIB (`Asia/Jakarta`), whatever timezone the server runs in.

## Roles

| Role | Access |
| --- | --- |
| Perawat | Add and edit patient diets, view diet history. No dashboard. |
| Ahli Gizi | Add and edit patient diets, view diet history and the dashboard. |
| Bagian Produksi | View the dashboard, print labels and QR codes (single or bulk). |
| Bagian Distribusi | View the dashboard, scan QR codes and confirm delivery. |
| Admin | Everything above, plus closing patients and managing users and settings. |

Permission checks are pure functions in `src/utils/roles.ts`, used by both pages and the nav. The same rules are enforced in the database with Row Level Security (`supabase/migrations/0007_rbac_roles.sql`).

## Tech stack

| Tool | Version |
| --- | --- |
| Next.js (App Router, webpack build) | 16.2 |
| React | 19.2 |
| TypeScript | 5 |
| Tailwind CSS (tokens in `src/app/globals.css` `@theme`) | 4 |
| Radix UI primitives, shadcn-style (`src/components/ui/`) | 1.6 |
| Supabase (Postgres, Auth, RLS) | `@supabase/ssr` 0.12 |
| Serwist (service worker) | 9.5 |
| `@yudiel/react-qr-scanner` / `qrcode` | 2.6 / 1.5 |
| Vitest | 5 |
| Yarn | 1.22 |

Icons are Material Symbols Outlined, self-hosted from `public/fonts/` and rendered through `src/components/Icon`.

## Getting started

**Prerequisites:** Node.js 22.12+ (required by Vitest 5), Yarn 1.22, and a Supabase project.

```bash
yarn install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | Admin "Tambah User" and the cron job. Server-only, bypasses RLS. |
| `CRON_SECRET` | Any random string | Auth for `/api/cron/meal-cutoff`. Can stay empty locally. |
| `SUPABASE_DB_URL` | Supabase → Settings → Database → Connection pooler | Running migrations locally only. Never set it in production. |

Then set up the database:

1. Run every file in `supabase/migrations/` **in numeric order**, in the Supabase SQL Editor or with `psql "$SUPABASE_DB_URL"`. The app does not run migrations itself.
2. Create the first admin: Supabase → Authentication → Users → Add User (tick Auto Confirm), then:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

   Every other account can then be created and given a role from `/admin/users`.

```bash
yarn dev
```

Open **<http://localhost:3002>**.

## Scripts

| Command | What it does |
| --- | --- |
| `yarn dev` | Dev server on port 3002 (webpack). |
| `yarn build` | Production build (webpack). |
| `yarn start` | Serves the build on port 3002. |
| `yarn lint` | ESLint. |
| `yarn test` | Runs the unit tests once (Vitest). |

## Architecture

```mermaid
flowchart LR
  Browser["Browser / PWA"] --> Proxy["src/proxy.ts<br/>session + login redirect"]
  Proxy --> Pages["Server Components<br/>src/app/(app)"]
  Pages --> Actions["Server Actions<br/>actions.ts"]
  Pages --> Supabase[(Supabase<br/>Postgres + Auth + RLS)]
  Actions --> Supabase
  Cron["Vercel Cron / cron-job.org"] --> CronRoute["/api/cron/meal-cutoff"]
  CronRoute -- "service role" --> Supabase
```

```text
src/
  app/(app)/        screens behind login: dashboard, patients, scan, analytics, admin
  app/login/        login page
  app/api/cron/     meal cut-off job endpoint
  app/sw.ts         Serwist service worker
  components/       feature components, one folder each; ui/ holds the Radix primitives
  config/           meal cut-off defaults, meal period labels, app timezone
  constants/        master data (rooms, diets, allergies, delivery statuses), not hardcoded in forms
  libs/supabase/    browser/server/admin clients, session refresh, current profile
  libs/meal-cutoff/ the scheduled cut-off job
  utils/            pure helpers: roles, meal period, patient QR payload
  types/            shared types
  proxy.ts          request proxy (Next 16's replacement for middleware)
supabase/migrations/  schema, numbered and append-only
```

### Meal periods and cut-offs

The day has three meal periods: **Pagi**, **Siang** and **Sore**. Each one has a data cut-off, a distribution window and an evaluation cut-off, stored in `meal_cutoffs` and editable at `/admin/meal-cutoff`.

`src/libs/meal-cutoff/run-cutoff-job.ts` runs on a schedule and, for each period:

1. **Locks the summary** once the data cut-off passes (a row in `meal_period_locks`). Patient data stays editable; later edits just count toward the next period.
2. **Takes a distribution snapshot** once the evaluation cut-off passes (a row in `distribution_snapshots`), which the Analytics page reads.

Every write first checks whether today's row already exists, so the job can run more often than the cut-offs without double-locking. It still fires up to 20 minutes late (`CUTOFF_GRACE_MINUTES`) if a run is missed.

## Key decisions

- **Every screen requires login.** The earlier guest access was removed when roles were added. `src/proxy.ts` redirects anyone without a session to `/login`, except `/api/cron/*`, which checks `CRON_SECRET` itself.
- **Roles are checked twice.** Pages and the nav use `src/utils/roles.ts`; the database repeats the rules with RLS, so a direct API call can't get around the UI.
- **The service role key stays on the server.** Only `src/libs/supabase/admin.ts` uses it, for creating users and for the cron job. It never gets a `NEXT_PUBLIC_` prefix.
- **Webpack instead of Turbopack.** Serwist doesn't fully support Turbopack (the Next 16 default) yet, so `dev` and `build` pass `--webpack`. Don't remove that flag from the build command on Vercel.
- **Master data lives in `src/constants/`.** Rooms, diet types, allergies and delivery statuses come from one place, and the database mirrors the same options with `CHECK` constraints (`0006_patient_master_data.sql`).
- **Migrations are append-only.** Never edit a migration that has already run; add a new numbered file instead.

## Deployment

The app runs on Vercel, with the same Supabase project used locally (there's no separate dev database). Set these env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`. Don't add `SUPABASE_DB_URL`.

- **Run all migrations before deploying.** The app does not apply them.
- **Keep-alive:** `vercel.json` calls `/api/cron/meal-cutoff` once a day (20:00 UTC / 03:00 WIB). It reads the database, so the free Supabase project isn't paused for inactivity. A project that is already paused still has to be restored from the Supabase dashboard.
- **Cut-off schedule:** Vercel Hobby allows only one cron run per day, which isn't enough for the cut-offs. Use an external scheduler such as [cron-job.org](https://cron-job.org) to send `GET https://<domain>/api/cron/meal-cutoff` with the header `Authorization: Bearer <CRON_SECRET>` every 15 minutes.
- **HTTPS is required** for the PWA install prompt and the camera scanner. Vercel provides it.

Step-by-step instructions (Vercel CLI or GitHub import) are in [DEPLOY.md](DEPLOY.md).

## Testing

```bash
yarn test
```

12 tests in 1 file, all passing. They cover the pure meal-period logic (`src/utils/meal-period.test.ts`), such as which period a timestamp belongs to in WIB.

## Known limitations

- **Free-tier scheduling.** The cut-off job relies on an external scheduler; if it stops, summaries aren't locked and snapshots aren't taken.
- **Closing a patient is a hard delete.** It's admin-only, and the data can't be recovered.
- **Small test suite.** Only the meal-period helpers have tests; roles, the cut-off job and the forms don't yet.

## Future improvements

- Unit tests for `src/utils/roles.ts` and `run-cutoff-job.ts`.
- End-to-end tests (e.g. Playwright) for patient input → label printing → scanning.
- Move the cut-off schedule to Vercel Cron if the project upgrades to Pro.
