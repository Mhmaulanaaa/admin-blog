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

**Mac/Linux:**
```bash
cp .env.example .env
```
**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

3. Setup Database (PostgreSQL):
Pastikan database PostgreSQL sudah terinstall dan aktif di lokal Anda. 

**Untuk pengguna macOS (via Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;"
createdb -U postgres storyflow
```

**Untuk pengguna Windows:**
- Unduh installer resmi dari [PostgreSQL for Windows](https://www.postgresql.org/download/windows/). Ikuti petunjuk instalasinya hingga selesai.
- Pastikan command `psql` sudah masuk ke konfigurasi System PATH Windows Anda (biasanya di `C:\Program Files\PostgreSQL\<version>\bin`).
- Buka **Command Prompt** / **PowerShell** lalu jalankan pembuatan database:
```cmd
psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;"
createdb -U postgres storyflow
```

4. Jalankan full stack:

```bash
npm run dev:full
```

Frontend akan berjalan di `http://localhost:5173` dan backend otomatis terhubung database dan berjalan di `http://localhost:3000`.

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

## Full Stack di Vercel

Project ini sudah dirancang agar dapat diupload dan berjalan penuh di Vercel secara otomatis (Frontend & Backend dalam satu tempat).

**Bagaimana Vercel menjalankannya?**
- **Frontend (Vite):** Vercel sangat pintar mendeteksi Vite. Ia akan menjalankan `npm run build` dan menyajikan foldernya. Konfigurasi `vercel.json` memaksa semua rute untuk fallback ke `index.html` (Mendukung mode SPA).
- **Backend (Express):** Vercel mengubah seluruh file di dalam folder `api/` menjadi **Serverless Functions**. Berkat file `api/[...route].js`, aplikasi Express kita dibungkus dan diakses setiap kali ada request ke `/api/*`. Anda tidak butuh server khusus!
- **Database:** Memakai Postgres eksternal (Rekomendasi: Supabase).

Untuk mode ini, frontend dan backend memakai URL domain yang sama, jadi Anda **tidak akan mengalami error CORS**.

Yang perlu dilakukan:

1. Push project ke GitHub
2. Import repo ke Vercel
3. Tambahkan environment variables berikut di project Vercel:

```bash
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=replace-with-a-strong-unique-password
ADMIN_NAME=Admin StoryFlow
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
DB_POOL_MAX=3
```

4. Deploy

Karena frontend memanggil `/api` pada origin yang sama, `VITE_API_BASE_URL` tidak perlu diisi untuk mode full Vercel.

Route SPA dan API untuk Vercel sudah disiapkan di `vercel.json`.

## Frontend di Vercel + Backend Terpisah

Kalau Anda tetap ingin frontend Vercel dan backend platform lain, Anda masih bisa memakai mode terpisah ini.

Yang perlu dilakukan:

1. Deploy backend dulu
2. Ambil URL backend, misalnya `https://storyflow-api.onrender.com/api`
3. Di Vercel, tambahkan env:

```bash
VITE_API_BASE_URL=https://storyflow-api.onrender.com/api
```

4. Deploy frontend

Referensi resmi:

- [Vercel for Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## Template Env Production

Gunakan template ini sebagai acuan, jangan commit secret asli:

- Backend Render: `.env.render.production.example`
- Backend Render + Supabase: `.env.supabase.production.example`
- Full Vercel + Supabase: `.env.vercel.production.example`

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

Jika frontend dan backend sama-sama dideploy di Vercel dari project ini, bagian CORS ini umumnya tidak diperlukan karena request API berasal dari origin yang sama.

## Clone untuk Maintenance

Bisa dilanjutkan/dikloning ke komputer lain dengan catatan perangkat tersebut sudah memiliki background servis PostgreSQL yang berjalan:

```bash
git clone <repo-url>
cd <repo-folder>
npm install

# Salin enviroment
# Mac/Linux:
cp .env.example .env
# Windows: 
# copy .env.example .env

# Buat ulang database storyflow di perangkat baru 
# (Pastikan PostgreSQL sudah aktif)
createdb -U postgres storyflow

npm run dev:full
```

Catatan:

- Source code masuk GitHub
- Data production berada di database Postgres hosting Anda, bukan di GitHub
