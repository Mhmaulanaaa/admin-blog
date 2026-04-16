import { createApp, ensureAppReady } from '../server/app.js'

const app = createApp()

export default async function handler(req, res) {
  await ensureAppReady()
  
  // Perbaiki isu req.url mangled pada Vercel
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url)
  }

  // Hindari express.json() macet (hanging) karena Vercel sudah nge-parse body duluan
  if (req.body && typeof req.body === 'object') {
    req._body = true
  }

  return app(req, res)
}
