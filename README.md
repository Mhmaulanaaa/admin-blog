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

## Full Stack di Vercel (Frontend & Serverless Backend)

Project ini dirancang agar dapat diupload dan berjalan secara otomatis di Vercel dalam mode Monorepo (Frontend & Backend dalam satu tempat yang sama). 

**Bagaimana Vercel menjalankannya?**
- **Frontend (Vite):** Vercel sangat pintar mendeteksi Vite. Ia akan menjalankan `npm run build` dan menyajikan folder `dist/` sebagai aplikasi SPA.
- **Backend (Express):** Vercel mengubah seluruh file di dalam folder `api/` menjadi **Serverless Functions**. Berkat file "Shim" `api/[...route].js`, keseluruhan aplikasi Express Anda dibungkus secara otomatis oleh Vercel. Setiap request ke `/api/*` langsung diproses ke dalam Express JS tanpa perlu server 24-jam aktif!
- **Zero CORS:** Karena frontend dan backend diproses dari 1 domain yang identik (oleh vercel), URL tujuan backend otomatis sebidang dengan Frontend. Tidak akan pernah ada masalah CORS.

Mengupload project ini sangat mudah:

1. Push project Anda ke GitHub.
2. Buka [Vercel](https://vercel.com/) dan _Import Project_ dari repositori GitHub tadi.
3. Di panel **Environment Variables** (sangat krusial), isikan variabel dari cloud provider database PostgreSQL Anda (contohnya Supabase):
   - `JWT_SECRET` = _[Masukkan String rahasia acak, wajib!]_
   - `ADMIN_EMAIL` = admin@domain.com
   - `ADMIN_PASSWORD` = _[Isi Password]_
   - `DATABASE_URL` = postgresql://postgres:password@host:5432/postgres
   - `DATABASE_SSL` = true
4. Tidak perlu mendefinisikan `VITE_API_BASE_URL` maupun `CORS_ORIGIN` ketika di-deploy dalam keadaan Full Stack di Vercel.
5. Klik **Deploy** dan catat URL produksi Vercel Anda. Seluruh UI dan API sekarang ada di ranah Cloud sepenuhnya.

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
