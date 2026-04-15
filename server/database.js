import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@storyflow.local'
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!'
const adminName = process.env.ADMIN_NAME ?? 'Admin StoryFlow'
const databaseUrl = process.env.DATABASE_URL?.trim()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const sslMode = process.env.DATABASE_SSL ?? (nodeEnv === 'production' ? 'true' : 'false')
const maxConnections = Number(process.env.DB_POOL_MAX ?? 5)

if (!databaseUrl) {
  throw new Error('DATABASE_URL belum diisi. Arahkan ke database Postgres Anda.')
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number.isNaN(maxConnections) ? 5 : maxConnections,
  ssl: sslMode === 'true' ? { rejectUnauthorized: false } : false,
})

const seedPosts = [
  {
    title: 'Membangun Brand Story yang Lebih Hidup',
    excerpt:
      'Cara menyusun artikel, visual, dan call to action supaya landing page terasa lebih hangat dan meyakinkan.',
    category: 'Branding',
    author: 'Admin Studio',
    cover:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    content:
      'Landing page yang efektif tidak hanya menjual produk, tetapi juga menyampaikan cerita yang membuat pengunjung merasa dekat.\n\nMulailah dengan headline yang kuat, lanjutkan dengan visual yang konsisten, lalu arahkan pembaca ke tindakan berikutnya secara halus.\n\nSaat semua bagian saling mendukung, brand Anda akan terasa lebih meyakinkan dan mudah diingat.',
    publishedAt: '2026-04-12',
    status: 'Published',
  },
  {
    title: 'Panduan Menulis Update Produk Mingguan',
    excerpt:
      'Template sederhana untuk membagikan progres, fitur baru, dan insight tim secara rutin.',
    category: 'Product',
    author: 'Content Manager',
    cover:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    content:
      'Update mingguan sebaiknya ringkas namun tetap terasa personal.\n\nJelaskan apa yang berubah, siapa yang terbantu, dan apa langkah berikutnya.\n\nFormat seperti ini cocok untuk membangun kebiasaan komunikasi yang sehat dengan audiens.',
    publishedAt: '2026-04-10',
    status: 'Published',
  },
]

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function query(text, params = []) {
  return pool.query(text, params)
}

export function mapPost(row) {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    cover: row.cover,
    content: row.content,
    publishedAt: row.published_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function ensureUniqueSlug(title, id = null) {
  const baseSlug = slugify(title) || `post-${Date.now()}`
  let slug = baseSlug
  let counter = 1

  while (true) {
    const sql = id
      ? 'SELECT id FROM posts WHERE slug = $1 AND id != $2 LIMIT 1'
      : 'SELECT id FROM posts WHERE slug = $1 LIMIT 1'
    const params = id ? [slug, id] : [slug]
    const { rows } = await query(sql, params)

    if (rows.length === 0) {
      return slug
    }

    counter += 1
    slug = `${baseSlug}-${counter}`
  }
}

async function seedAdmin() {
  const { rows } = await query('SELECT id FROM admins WHERE email = $1 LIMIT 1', [adminEmail])

  if (rows.length > 0) {
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  await query('INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)', [
    adminEmail,
    passwordHash,
    adminName,
  ])
}

async function seedInitialPosts() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM posts')

  if (rows[0].count > 0) {
    return
  }

  for (const post of seedPosts) {
    const slug = await ensureUniqueSlug(post.title)

    await query(
      `INSERT INTO posts (title, slug, excerpt, category, author, cover, content, published_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        post.title,
        slug,
        post.excerpt,
        post.category,
        post.author,
        post.cover,
        post.content,
        post.publishedAt,
        post.status,
      ],
    )
  }
}

export async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT NOT NULL,
      cover TEXT NOT NULL,
      content TEXT NOT NULL,
      published_at DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Published', 'Draft')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await seedAdmin()
  await seedInitialPosts()
}

export async function closeDatabase() {
  await pool.end()
}
