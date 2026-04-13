// Minimal production server for Render / any Node host.
// - Proxies `/yf/*` to Yahoo Finance (same path rewrite as the Vite dev
//   proxy) so the browser can reach the chart API without CORS issues.
// - Serves the Vite build output in `dist/` with gzip + SPA fallback.

import express from 'express'
import compression from 'compression'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(compression())

app.use(
  '/yf',
  createProxyMiddleware({
    target: 'https://query1.finance.yahoo.com',
    changeOrigin: true,
    pathRewrite: { '^/yf': '' },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  }),
)

const distDir = path.join(__dirname, 'dist')
app.use(express.static(distDir, { maxAge: '1h', index: false }))

// SPA fallback — anything that isn't a static asset goes back to index.html.
// Express 5 / path-to-regexp v8 no longer accepts bare '*' in paths, so use
// a catch-all middleware instead.
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🦆 Hidden Trader listening on http://0.0.0.0:${PORT}`)
})
