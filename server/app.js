import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureUniqueSlug, initDatabase, mapPost, query } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const jwtSecret = process.env.JWT_SECRET ?? 'storyflow-development-secret'
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

let initPromise

function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token login tidak ditemukan.' })
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, jwtSecret)
    return next()
  } catch {
    return res.status(401).json({ message: 'Sesi login tidak valid atau sudah berakhir.' })
  }
}

function normalizePostInput(payload) {
  return {
    title: payload.title?.trim(),
    excerpt: payload.excerpt?.trim(),
    category: payload.category?.trim(),
    author: payload.author?.trim(),
    cover: payload.cover?.trim(),
    content: payload.content?.trim(),
    publishedAt: payload.publishedAt?.trim(),
    status: payload.status === 'Draft' ? 'Draft' : 'Published',
  }
}

function validatePostInput(payload) {
  const requiredFields = ['title', 'excerpt', 'category', 'author', 'cover', 'content', 'publishedAt']

  for (const field of requiredFields) {
    if (!payload[field]) {
      return `${field} wajib diisi.`
    }
  }

  return null
}

export async function ensureAppReady() {
  if (!initPromise) {
    initPromise = initDatabase()
  }

  await initPromise
}

export function createApp({ serveFrontend = false } = {}) {
  const app = express()

  if (allowedOrigins.length > 0) {
    app.use(
      cors({
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true)
            return
          }

          callback(new Error('Origin tidak diizinkan oleh konfigurasi CORS.'))
        },
      }),
    )
  }

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.post('/api/auth/login', async (req, res) => {
    const email = req.body.email?.trim()
    const password = req.body.password ?? ''
    const { rows } = await query('SELECT * FROM admins WHERE email = $1 LIMIT 1', [email])
    const admin = rows[0]

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ message: 'Email atau password salah.' })
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      jwtSecret,
      { expiresIn: '7d' },
    )

    return res.json({
      token,
      user: {
        id: Number(admin.id),
        email: admin.email,
        name: admin.name,
      },
    })
  })

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({
      user: {
        id: Number(req.user.id),
        email: req.user.email,
        name: req.user.name,
      },
    })
  })

  app.get('/api/posts', async (_req, res) => {
    const { rows } = await query(
      "SELECT * FROM posts WHERE status = 'Published' ORDER BY published_at DESC, id DESC",
    )

    res.json({ posts: rows.map(mapPost) })
  })

  app.get('/api/posts/:slug', async (req, res) => {
    const { rows } = await query(
      "SELECT * FROM posts WHERE slug = $1 AND status = 'Published' LIMIT 1",
      [req.params.slug],
    )
    const row = rows[0]

    if (!row) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
    }

    return res.json({ post: mapPost(row) })
  })

  app.get('/api/admin/posts', authMiddleware, async (_req, res) => {
    const { rows } = await query('SELECT * FROM posts ORDER BY published_at DESC, id DESC')
    res.json({ posts: rows.map(mapPost) })
  })

  app.post('/api/admin/posts', authMiddleware, async (req, res) => {
    const payload = normalizePostInput(req.body)
    const validationError = validatePostInput(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const slug = await ensureUniqueSlug(payload.title)
    const { rows } = await query(
      `INSERT INTO posts (
         title, slug, excerpt, category, author, cover, content, published_at, status, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        payload.title,
        slug,
        payload.excerpt,
        payload.category,
        payload.author,
        payload.cover,
        payload.content,
        payload.publishedAt,
        payload.status,
      ],
    )

    return res.status(201).json({ post: mapPost(rows[0]) })
  })

  app.post('/api/admin/generate', authMiddleware, async (req, res) => {
    const topic = req.body.topic?.trim()
    if (!topic) {
      return res.status(400).json({ message: 'Topik harus diisi.' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        message: 'Kunci GEMINI_API_KEY belum dikonfigurasi di file .env server Anda.',
      })
    }

    try {
      const prompt = `Anda adalah penulis artikel SEO profesional. Tulislah artikel blog menarik tentang topik: "${topic}". 
      Format respons wajib dalam format JSON murni TANPA markdown block (\`\`\`json) dengan struktur berikut:
      {
        "title": "Judul Artikel Menarik",
        "excerpt": "Ringkasan sangat singkat 1-2 kalimat (max 150 karakter) yang menggugah penasaran.",
        "category": "Technology/Business/dll",
        "content": "Isi artikel lengkap minimal 4 paragraf. Setiap paragraf dipisahkan oleh karakter newline (\\n) murni, bukan HTML tags."
      }`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Gagal berkomunikasi dengan server AI Gemini.')
      }

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const result = JSON.parse(text)

      // Cari cover dari source unsplash secara random berdasarkan kategori
      const coverUrl = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000` // Hard fallback if dynamic source goes wrong
      const sourceUrl = \`https://source.unsplash.com/800x600/?\${encodeURIComponent(result.category)}\`
      
      return res.json({
        title: result.title,
        excerpt: result.excerpt,
        category: result.category,
        content: result.content,
        cover: sourceUrl || coverUrl, // (Note: source.unsplash is deprecated, it redirects, but still works as a placeholder)
      })
    } catch (err) {
      console.error('AI Gen Error:', err)
      return res.status(500).json({ message: 'Terjadi kesalahan saat memproses data AI.' })
    }
  })

  app.put('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const { rows: existingRows } = await query('SELECT * FROM posts WHERE id = $1 LIMIT 1', [
      req.params.id,
    ])

    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Posting tidak ditemukan.' })
    }

    const payload = normalizePostInput(req.body)
    const validationError = validatePostInput(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const slug = await ensureUniqueSlug(payload.title, Number(req.params.id))
    const { rows } = await query(
      `UPDATE posts
       SET title = $1,
           slug = $2,
           excerpt = $3,
           category = $4,
           author = $5,
           cover = $6,
           content = $7,
           published_at = $8,
           status = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        payload.title,
        slug,
        payload.excerpt,
        payload.category,
        payload.author,
        payload.cover,
        payload.content,
        payload.publishedAt,
        payload.status,
        Number(req.params.id),
      ],
    )

    return res.json({ post: mapPost(rows[0]) })
  })

  app.delete('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const { rowCount } = await query('DELETE FROM posts WHERE id = $1', [req.params.id])

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Posting tidak ditemukan.' })
    }

    return res.json({ success: true })
  })

  if (serveFrontend) {
    const distPath = path.resolve(__dirname, '../dist')

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))
      app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'))
      })
    }
  }

  return app
}
