# NutriSmart

PWA buat manajemen diet & distribusi makanan pasien rumah sakit — dari input diet pasien, cetak label+QR, sampe scan verifikasi pengantaran, plus dashboard rekap porsi real-time.

## Stack

- **Next.js 16** (App Router, Turbopack di-nonaktifkan — pake `--webpack`, lihat catatan di bawah) + React 19 + TypeScript
- **Tailwind CSS v4** (CSS-first, token di `src/app/globals.css` `@theme`) + CSS Modules + `classnames`
- **Supabase** — Postgres + Auth + RLS
- **Serwist** — service worker / PWA
- **@yudiel/react-qr-scanner** — scan QR kamera
- Icon: **Material Symbols Outlined** (Google Fonts), bukan SVG custom

## Role & Akses

5 role, semua wajib login (gak ada guest access):

| Role               | Bisa                                                      |
| ------------------ | --------------------------------------------------------- |
| Perawat            | Input/update data diet pasien, lihat riwayat diet (read-only) |
| Ahli Gizi          | Full edit diet pasien, riwayat diet, lihat dashboard rekap |
| Bagian Produksi    | Lihat dashboard rekap, cetak label & QR (single/massal)    |
| Bagian Distribusi  | Lihat dashboard rekap, scan QR + konfirmasi pengantaran    |
| Admin              | Semua akses + kelola user (assign role)                   |

Role di-assign manual lewat `/admin/users` (butuh 1 akun admin pertama — lihat [Setup](#setup)).

## Setup

1. Install dependency (pake **yarn**, bukan npm):

   ```bash
   yarn
   ```

2. Copy `.env.example` ke `.env.local`, isi dari Supabase Dashboard → Settings → API:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → `service_role` secret) dipake fitur admin "Tambah User" (server-only, bypass RLS) — **harus** ikut ditaro di env Vercel juga, bukan cuma lokal.

   `SUPABASE_DB_URL` (connection string, dari Settings → Database → Connection pooler) cuma dipake lokal buat jalanin migration, jangan taro di env production/Vercel.

3. Jalanin migration SQL di `supabase/migrations/` **urut sesuai nomor** lewat Supabase SQL Editor (atau `psql`/script pake `SUPABASE_DB_URL`).

4. Bikin akun admin pertama manual: Supabase Dashboard → Authentication → Users → Add User (centang Auto Confirm), terus:

   ```sql
   update public.profiles set role = 'admin' where email = 'email@kamu';
   ```

5. Jalanin dev server:

   ```bash
   yarn dev
   ```

   Buka [http://localhost:3002](http://localhost:3002).

## Scripts

| Command | Fungsi |
|---|---|
| `yarn dev` | Dev server (port 3002) |
| `yarn build` | Production build |
| `yarn start` | Jalanin hasil build (port 3002) |
| `yarn lint` | ESLint |
| `yarn test` | Unit test (Vitest) — util murni kayak `getMealPeriodForTimestamp` |

Build/dev sengaja pake `--webpack` — Serwist (service worker) belum kompatibel penuh sama Turbopack (default Next 16).

## Struktur Penting

```text
src/
  app/(app)/       # halaman yang butuh login (dashboard, patients, scan, analytics, admin)
  app/login/       # halaman login
  components/      # UI components
  constants/       # master data (ruangan, diet, alergi, dst — bukan hardcode di form)
  libs/supabase/   # client/server Supabase helper + role-check
  utils/roles.ts   # pure role-permission functions
supabase/migrations/  # schema, urut & append-only — jangan edit migration lama
```

## Deploy

Lihat [DEPLOY.md](DEPLOY.md).
