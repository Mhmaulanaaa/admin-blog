# StoryFlow

Dashboard manager blog berbasis Vue, Tailwind, Express, dan PostgreSQL.

## Stack

- Frontend: Vue 3 + Vite + Tailwind CSS
- Backend: Express
- Database: PostgreSQL (`pg`)
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
5. Isi `DATABASE_URL` dari layanan Postgres gratis Anda, misalnya Neon atau Supabase
6. Deploy

Render config yang sudah disiapkan:

- build: `npm install && npm run build`
- start: `npm run start`
- health check: `/api/health`
- database Postgres eksternal melalui `DATABASE_URL`

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
- Backend Render + Supabase: `.env.supabase.production.example`
- Frontend Vercel: `.env.vercel.production.example`

Khusus `JWT_SECRET`, gunakan string acak panjang minimal 32 karakter.

Untuk database gratis, opsi yang paling praktis biasanya:

- Neon
- Supabase

Yang Anda perlukan dari provider tersebut adalah connection string Postgres untuk diisi ke `DATABASE_URL`.

## Konfigurasi Supabase

Jika Anda memakai Supabase untuk backend yang jalan terus di Render, gunakan connection string dari **Supabase pooler session mode** agar tetap cocok untuk koneksi aplikasi backend biasa dan jaringan IPv4. Referensi resmi Supabase menyarankan:

- direct connection untuk server persisten jika environment mendukung IPv6
- **pooler session mode** untuk klien persisten yang butuh IPv4
- pooler transaction mode untuk serverless/edge

Lihat: [Supabase connection strings](https://supabase.com/docs/reference/postgres/connection-strings)

Langkah singkat:

1. Buka project Supabase Anda
2. Klik `Connect`
3. Pilih `ORMs / Clients`
4. Salin connection string **Session mode / pooler**
5. Isi ke `DATABASE_URL` di Render

Contoh format:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
DB_POOL_MAX=5
```

## Deploy Backend Agar Tidak Kena CORS

Jika frontend ada di Vercel dan backend ada di Render, CORS harus diizinkan di backend.

Isi environment variable backend Render seperti ini:

```env
CORS_ORIGIN=https://nama-project-anda.vercel.app
```

Kalau Anda punya domain custom juga:

```env
CORS_ORIGIN=https://nama-project-anda.vercel.app,https://www.domainanda.com
```

Lalu di Vercel, isi frontend:

```env
VITE_API_BASE_URL=https://nama-backend-anda.onrender.com/api
```

Artinya:

- `CORS_ORIGIN` selalu berisi domain frontend
- `VITE_API_BASE_URL` selalu berisi domain backend

Jangan dibalik. Kalau dibalik, request frontend akan tetap gagal.

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
- Data production berada di database Postgres hosting Anda, bukan di GitHub
