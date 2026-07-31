# Deploy Manual — NutriSmart

Belum ada commit git sama sekali (dari sesi 1 sengaja di-skip). Commit dulu sebelum deploy pake cara manapun:

```bash
git add -A
git commit -m "feat: NutriSmart sesi 1-8"
```

## Opsi A — Vercel CLI langsung (paling simpel, gak perlu GitHub)

```bash
npm install -g vercel   # sekali aja
vercel login
vercel                  # deploy preview
vercel --prod           # deploy production
```

Pas ditanya env vars pertama kali (atau lewat `vercel env add`), isi:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | isi dari `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | isi dari `.env.local` |

**Jangan** tambahin `SUPABASE_DB_URL` ke Vercel — itu cuma dipake lokal buat migration script sekali jalan, bukan runtime app.

## Opsi B — Lewat GitHub + Vercel Dashboard

1. Bikin repo GitHub baru, push:
   ```bash
   git remote add origin <url-repo-lu>
   git push -u origin main
   ```
2. vercel.com → Add New Project → import repo itu.
3. Framework kedetect otomatis (Next.js). Build command default (`npm run build`) udah bener — jangan diubah, itu sengaja pake flag `--webpack` (liat catatan sesi 1: Turbopack belum kompatibel sama Serwist).
4. Isi env vars sama kayak Opsi A di step "Environment Variables" pas import.
5. Deploy.

## Setelah deploy

- DB Supabase yang dipake ini SAMA kayak yang udah jalan dari sesi 2 (bukan project terpisah dev/prod) — data yang udah ada (kalau ada) langsung kebawa live.
- Cek PWA install prompt + kamera scan jalan (butuh HTTPS — Vercel udah otomatis kasih itu).
- Custom domain (opsional): Vercel Dashboard → Project → Settings → Domains.
