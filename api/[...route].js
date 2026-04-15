import { createApp, ensureAppReady } from '../server/app.js'

const app = createApp()

export default async function handler(req, res) {
  await ensureAppReady()
  return app(req, res)
}
