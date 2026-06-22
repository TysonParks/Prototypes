/**
 * Headless probe for thin-depth shade ladder values (diagnostic only).
 * Fix for §9.14.12 is Feature-side enum limits, not neuMark ladder changes.
 * Usage: node testing/thinDepthProbe.mjs
 */
import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const HASHES = {
  1494: '0x8d31f933ba75bbfa9ee9be8e76c7d29c0b7fc87b9f93085ce01d24ef0d565444',
  1518: '0x08c672bb15be0069282123b4573985dded9718a95a5bce7639d005cdd247f5f8',
  1521: '0x86ba04c820c09eda6009893cc63638b19b6f638e349572e82bf0f40a4ab90833',
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
      const filePath = join(root, decodeURIComponent(urlPath))
      try {
        const data = readFileSync(filePath)
        const ext = extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(404)
        res.end('not found')
      }
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function probeHash(page, hash) {
  return page.evaluate(async (h) => {
    window.DEBUG_NEUSHADES = true
    window.__thinDepthLogs = []
    const origLog = console.log
    console.log = (...args) => {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      if (msg.includes('neuShadeDBG') || msg.includes('inputs:')) {
        window.__thinDepthLogs.push(msg)
      }
      origLog.apply(console, args)
    }

    if (typeof protoBatch?.teardown === 'function') protoBatch.teardown()
    await new Promise((r) => setTimeout(r, 50))
    protoBatch.buildFromHash(h)
    await new Promise((r) => setTimeout(r, 3000))

    const cuts = typeof S !== 'undefined' && S.Cuts?.db
      ? S.Cuts.db.map((c) => ({
          depth: c.depth,
          profile: c.profile?.type,
          filterCount: c.filters?.length ?? 0,
        }))
      : []

    return {
      minCellWidth: typeof GRID !== 'undefined' ? GRID.minCellWidth : null,
      features: typeof FEATURES !== 'undefined' ? {
        gridStyle: FEATURES.gridStyle,
        x: FEATURES.x,
        y: FEATURES.y,
        cellOutset: FEATURES.cellOutset,
        cellInset: FEATURES.cellInset,
        frameWidth: FEATURES.frameWidth,
        minCellSize: FEATURES.minCellSize,
      } : null,
      cuts: cuts.filter((c) => c.depth > 0 && c.depth < 5),
      thinDepthLogs: window.__thinDepthLogs.slice(0, 30),
      effectCount: typeof S !== 'undefined' ? S.Effects?.db?.length : null,
    }
  }, hash)
}

async function main() {
  const server = await startServer()
  const { port } = server.address()
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  page.on('console', (msg) => {
    const t = msg.text()
    if (t.includes('neuShadeDBG') || t.includes('offsets')) {
      // eslint-disable-next-line no-console
      console.log('[page]', t.slice(0, 200))
    }
  })
  await page.setViewport({ width: 800, height: 1400 })
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0', timeout: 120000 })
  await page.waitForFunction(() => typeof protoBatch !== 'undefined', { timeout: 120000 })

  const results = {}
  for (const [label, hash] of Object.entries(HASHES)) {
    try {
      results[label] = await probeHash(page, hash)
    } catch (err) {
      results[label] = { error: String(err) }
    }
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
  server.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
