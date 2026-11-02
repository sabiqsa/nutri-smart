# Deploy Manual — NutriSmart

Repo udah ada di GitHub ([github.com/sabiqsa/nutri-smart](https://github.com/sabiqsa/nutri-smart)), remote udah keset. Kalau ada perubahan lokal, commit+push dulu:

```bash
git add -A
git commit -m "..."
git push origin main
```

## Opsi A — Vercel CLI langsung (paling simpel, gak perlu GitHub)

```bash
yarn global add vercel   # sekali aja
vercel login
vercel                    # deploy preview
vercel --prod             # deploy production
```

Pas ditanya env vars pertama kali (atau lewat `vercel env add`), isi:

| Key                              | Value                 |
| -------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | isi dari `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | isi dari `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY`      | isi dari `.env.local` (dipake fitur admin "Tambah User") |
| `CRON_SECRET`                     | random string bebas — dipake buat verifikasi request dari cron eksternal ke `/api/cron/meal-cutoff` |

**Jangan** tambahin `SUPABASE_DB_URL` ke Vercel — itu cuma dipake lokal buat migration script sekali jalan, bukan runtime app.

## Opsi B — Lewat GitHub + Vercel Dashboard

1. Repo udah di GitHub, tinggal: vercel.com → Add New Project → import `sabiqsa/nutri-smart`.
2. Framework kedetect otomatis (Next.js). Build command default (`yarn build`) udah bener — jangan diubah, itu sengaja pake flag `--webpack` (Turbopack, default Next 16, belum kompatibel penuh sama Serwist service worker).
3. Isi env vars sama kayak Opsi A di step "Environment Variables" pas import.
4. Deploy.

## Setelah deploy

- DB Supabase yang dipake ini SAMA kayak yang jalan sekarang di lokal (bukan project terpisah dev/prod) — data yang udah ada langsung kebawa live.
- Migration di `supabase/migrations/` harus udah semua kejalanin di project Supabase itu (cek lewat SQL Editor / Table Editor) sebelum deploy — app gak jalanin migration otomatis.
- Cek PWA install prompt + kamera scan jalan (butuh HTTPS — Vercel otomatis kasih itu).
- Custom domain (opsional): Vercel Dashboard → Project → Settings → Domains.
- **Keep-alive Supabase** — `vercel.json` nge-hit `/api/cron/meal-cutoff` sekali sehari (20:00 UTC / 03:00 WIB). Route itu baca DB, jadi project Supabase free gak dianggep nganggur dan gak ke-pause. Butuh `CRON_SECRET` di env Vercel. Ini cuma keep-alive, bukan pengganti cron cut-off di bawah. Project yang udah ke-pause tetep harus di-restore manual dari dashboard Supabase.
- **Cron cut-off** — Vercel Hobby cuma bolehin cron sekali sehari, jadi cut-off gak bisa pake Vercel Cron. Pake layanan eksternal gratis, misal [cron-job.org](https://cron-job.org): bikin job baru, URL `https://<domain>/api/cron/meal-cutoff`, method GET, header `Authorization: Bearer <CRON_SECRET>`, interval tiap 15 menit. Kalau nanti upgrade ke Vercel Pro, bisa pindah balik ke Vercel Cron (perketat schedule di `vercel.json`).
