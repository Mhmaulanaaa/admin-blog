import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configuredDataDir = process.env.DATA_DIR?.trim()
const dataDir = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.resolve(__dirname, '../data')

fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'storyflow.db'))

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    cover TEXT NOT NULL,
    content TEXT NOT NULL,
    published_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Published', 'Draft')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@storyflow.local'
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!'
const adminName = process.env.ADMIN_NAME ?? 'Admin StoryFlow'

const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail)

if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync(adminPassword, 10)
  db.prepare('INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)').run(
    adminEmail,
    passwordHash,
    adminName,
  )
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureUniqueSlug(title, id = null) {
  const baseSlug = slugify(title) || `post-${Date.now()}`
  let slug = baseSlug
  let counter = 1

  while (true) {
    const row = id
      ? db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, id)
      : db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug)

    if (!row) {
      return slug
    }

    counter += 1
    slug = `${baseSlug}-${counter}`
  }
}

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

const postsCount = db.prepare('SELECT COUNT(*) AS count FROM posts').get().count

if (postsCount === 0) {
  const insertPost = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, category, author, cover, content, published_at, status)
    VALUES (@title, @slug, @excerpt, @category, @author, @cover, @content, @publishedAt, @status)
  `)

  for (const post of seedPosts) {
    insertPost.run({
      ...post,
      slug: ensureUniqueSlug(post.title),
    })
  }
}

export function mapPost(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
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

export { db, ensureUniqueSlug }
