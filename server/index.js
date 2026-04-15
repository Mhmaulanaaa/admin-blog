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
const port = Number(process.env.PORT ?? 3000)
const jwtSecret = process.env.JWT_SECRET ?? 'storyflow-development-secret'
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

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

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new Error('Origin tidak diizinkan oleh konfigurasi CORS.'))
      },
    }),
  )
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

  const distPath = path.resolve(__dirname, '../dist')

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  return app
}

export async function startServer(listenPort = port) {
  await initDatabase()
  const app = createApp()

  return app.listen(listenPort, () => {
    console.log(`StoryFlow server running on http://localhost:${listenPort}`)
  })
}

if (process.argv[1] === __filename) {
  startServer().catch((error) => {
    console.error('Failed to start StoryFlow server:', error)
    process.exit(1)
  })
}
