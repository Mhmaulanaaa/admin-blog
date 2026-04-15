# StoryFlow

Dashboard manager blog berbasis Vue, Tailwind, Express, dan SQLite.

## Stack

- Frontend: Vue 3 + Vite + Tailwind CSS
- Backend: Express
- Database: SQLite (`better-sqlite3`)
- Auth: JWT login admin

## Jalankan Lokal

1. Install dependency:

```bash
npm install
```

2. Salin env:

```bash
cp .env.example .env
```

3. Jalankan full stack:

```bash
npm run dev:full
```

Frontend akan berjalan di `http://localhost:5173` dan backend di `http://localhost:3000`.

## Login Admin Default

- Email: `admin@storyflow.local`
- Password: `Admin123!`

Sebaiknya ganti password ini sebelum production.

## Deploy ke Render

Project ini sudah siap untuk deploy full-stack ke Render memakai `render.yaml`.

Langkah singkat:

1. Push project ke GitHub
2. Import repo ke Render
3. Pilih `Blueprint`
4. Isi `ADMIN_PASSWORD`
5. Deploy

Render config yang sudah disiapkan:

- build: `npm install && npm run build`
- start: `npm run start`
- health check: `/api/health`
- persistent disk untuk SQLite

Referensi resmi:

- [Render Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Render Deploys](https://render.com/docs/deploys)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
- [Render Default Environment Variables](https://render.com/docs/environment-variables)

## Frontend di Vercel + Backend Terpisah

Project ini juga sudah disiapkan agar frontend bisa dipasang di Vercel dan backend tetap di Render atau Railway.

Yang perlu dilakukan:

1. Deploy backend dulu
2. Ambil URL backend, misalnya `https://storyflow-api.onrender.com/api`
3. Di Vercel, tambahkan env:

```bash
VITE_API_BASE_URL=https://storyflow-api.onrender.com/api
```

4. Deploy frontend

Route SPA untuk Vercel sudah disiapkan di `vercel.json`.

Referensi resmi:

- [Vercel for Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## Template Env Production

Gunakan template ini sebagai acuan, jangan commit secret asli:

- Backend Render: `.env.render.production.example`
- Frontend Vercel: `.env.vercel.production.example`

Khusus `JWT_SECRET`, gunakan string acak panjang minimal 32 karakter.

## Clone untuk Maintenance

Tetap bisa dipakai di komputer lain:

```bash
git clone <repo-url>
cd <repo-folder>
npm install
cp .env.example .env
npm run dev:full
```

Catatan:

- Source code masuk GitHub
- File database `data/storyflow.db` tidak ikut Git
- Data production tetap berada di server hosting
# admin-blog
