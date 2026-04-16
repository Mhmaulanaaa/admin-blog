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

## Deploy Frontend di Vercel & Backend di Railway (Monorepo)

Project ini bersifat Monorepo (Frontend & Backend digabung). Sangat dimungkinkan untuk memecahnya ke hosting berbeda dari satu repositori yang sama: Vercel untuk Frontend (Vue) dan Railway untuk Backend (Express). Kami telah menyiapkan folder dan `railway.toml` yang mendukung spesifikasi ini.

### Langkah 1: Deploy Backend ke Railway

Railway akan otomatis mendeteksi konfigurasi `railway.toml` dan `package.json` yang sudah diubah untuk hanya mempedulikan backend (`npm start`).

1. Buat project baru di [Railway](https://railway.app/) -> `Deploy from GitHub repo`, dan pilih repositori Anda.
2. Tambahkan database: Di project yang sama, klik `New` -> `Database` -> `Add PostgreSQL`.
3. Buka pengaturan instance/aplikasi Node.js (Backend) Anda, masuk ke tab **Variables** dan tambahkan:
   - `DATABASE_URL` = Salin dari URL database PostgreSQL yang baru dibuat (biasanya bisa direferensikan variabel `${{ Postgres.DATABASE_URL }}`).
   - `JWT_SECRET` = String acak sangat rahasia untuk Token.
   - `ADMIN_EMAIL` = Email login dashboard Anda.
   - `ADMIN_PASSWORD` = Password login Anda.
   - `CORS_ORIGIN` = Isi dengan domain Frontend Vercel (karena Anda belum mendeploy Vercel di tahap ini, abaikan sementara URL-nya atau isi bebas).
4. Masuk ke tab **Settings** -> `Networking` -> Klik `Generate Domain` untuk mendapatkan URL publik API Anda (contoh: `https://backend-web.up.railway.app`).

### Langkah 2: Deploy Frontend ke Vercel

Vercel akan mengeksekusi `npm run build` dan memyajikan folder Frontend statis. Node server / folder `api` sudah kita buang untuk mengefisiensikan tugasnya.

1. Buka [Vercel](https://vercel.com/) dan buat project baru dari repositori GitHub yang sama persis.
2. Saat layar _Configure Project_, biarkan Build Command default. 
3. Di bagian **Environment Variables**, sangat krusial untuk mengisikan ini:
   - `VITE_API_BASE_URL` = Masukkan URL domain Railway Anda yang didapat di Langkah 1 (contoh: `https://backend-web.up.railway.app/api`). Pastikan diakhiri `/api`.
4. Klik **Deploy** dan catat URL Frontend Anda (contoh: `https://frontend.vercel.app`).

### Langkah 3: Bebas CORS

Agar login bisa berfungsi dengan baik, pastikan Backend Anda mengizinkan trafik (CORS) dari Vercel Anda. 
- Hubungkan/Ubah kembali variabel `CORS_ORIGIN` di menu Variables Railway dengan Link Frontend Vercel Anda secera utuh (tanpa garis miring di akhir url), contoh: `CORS_ORIGIN=https://frontend.vercel.app`.

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
