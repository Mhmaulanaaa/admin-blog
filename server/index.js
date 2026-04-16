import 'dotenv/config'
import { createApp, ensureAppReady } from './app.js'

const port = Number(process.env.PORT ?? 3000)

export async function startServer(listenPort = port) {
  await ensureAppReady()
  const app = createApp({ serveFrontend: true })

  return app.listen(listenPort, () => {
    console.log(`StoryFlow server running on http://localhost:${listenPort}`)
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start StoryFlow server:', error)
    process.exit(1)
  })
}
