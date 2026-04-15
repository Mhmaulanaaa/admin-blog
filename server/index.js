import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, ensureUniqueSlug, mapPost } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET ?? "storyflow-development-secret";
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token login tidak ditemukan." });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res
      .status(401)
      .json({ message: "Sesi login tidak valid atau sudah berakhir." });
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
    status: payload.status === "Draft" ? "Draft" : "Published",
  };
}

function validatePostInput(payload) {
  const requiredFields = [
    "title",
    "excerpt",
    "category",
    "author",
    "cover",
    "content",
    "publishedAt",
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      return `${field} wajib diisi.`;
    }
  }

  return null;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin tidak diizinkan oleh konfigurasi CORS."));
      },
    }),
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/login", (req, res) => {
    const email = req.body.email?.trim();
    const password = req.body.password ?? "";
    const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
    });
  });

  app.get("/api/posts", (_req, res) => {
    const rows = db
      .prepare(
        "SELECT * FROM posts WHERE status = 'Published' ORDER BY date(published_at) DESC, id DESC",
      )
      .all();

    res.json({ posts: rows.map(mapPost) });
  });

  app.get("/api/posts/:slug", (req, res) => {
    const row = db
      .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'Published'")
      .get(req.params.slug);

    if (!row) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }

    return res.json({ post: mapPost(row) });
  });

  app.get("/api/admin/posts", authMiddleware, (_req, res) => {
    const rows = db
      .prepare("SELECT * FROM posts ORDER BY date(published_at) DESC, id DESC")
      .all();
    res.json({ posts: rows.map(mapPost) });
  });

  app.post("/api/admin/posts", authMiddleware, (req, res) => {
    const payload = normalizePostInput(req.body);
    const validationError = validatePostInput(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const slug = ensureUniqueSlug(payload.title);
    const result = db
      .prepare(
        `
        INSERT INTO posts (title, slug, excerpt, category, author, cover, content, published_at, status, updated_at)
        VALUES (@title, @slug, @excerpt, @category, @author, @cover, @content, @publishedAt, @status, CURRENT_TIMESTAMP)
      `,
      )
      .run({
        ...payload,
        slug,
      });

    const row = db
      .prepare("SELECT * FROM posts WHERE id = ?")
      .get(result.lastInsertRowid);
    return res.status(201).json({ post: mapPost(row) });
  });

  app.put("/api/admin/posts/:id", authMiddleware, (req, res) => {
    const existing = db
      .prepare("SELECT * FROM posts WHERE id = ?")
      .get(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Posting tidak ditemukan." });
    }

    const payload = normalizePostInput(req.body);
    const validationError = validatePostInput(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const slug = ensureUniqueSlug(payload.title, Number(req.params.id));

    db.prepare(
      `
        UPDATE posts
        SET title = @title,
            slug = @slug,
            excerpt = @excerpt,
            category = @category,
            author = @author,
            cover = @cover,
            content = @content,
            published_at = @publishedAt,
            status = @status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `,
    ).run({
      ...payload,
      slug,
      id: Number(req.params.id),
    });

    const row = db
      .prepare("SELECT * FROM posts WHERE id = ?")
      .get(req.params.id);
    return res.json({ post: mapPost(row) });
  });

  app.delete("/api/admin/posts/:id", authMiddleware, (req, res) => {
    const result = db
      .prepare("DELETE FROM posts WHERE id = ?")
      .run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Posting tidak ditemukan." });
    }

    return res.json({ success: true });
  });

  const distPath = path.resolve(__dirname, "../dist");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

export function startServer(listenPort = port) {
  const app = createApp();
  return app.listen(listenPort, () => {
    console.log(`StoryFlow server running on http://localhost:${listenPort}`);
  });
}

if (process.argv[1] === __filename) {
  startServer();
}
