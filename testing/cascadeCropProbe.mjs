/**
 * Headless probe for cascade combo mask bounds.
 * Usage: node testing/cascadeCropProbe.mjs
 */
import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const HASHES = {
  1444: '0xe2f57b77fd2aa05a6d292faf2b787a05717986b5b63d4683aae4d14401d97c91',
  1514: '0x508b062cb1b54f90c9a3ba1fcae9de76d67a2bd507fb5bdbb18a795456172e65',
  1515: '0x2d4b2b637069b8f0fd9210fbd309c75bbbfcb7cfcf15374d119e867f376c9f21',
  1517: '0xf601062047508e6c3ccfa0cdda83180c1d7248c7c429debbbc47c1c7313c234b',
  1519: '0x9dc995ab1bf1ddc93ebfacc9f627329a2b85cfb6c9e55c784ee33116c76e6bb5',
  1520: '0xa6efe5a2ebefcff2df942e3a7ccb491bff95a650647b1eed7852d55f535eeefd',
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

async function probeHash(page, label, hash) {
  await page.evaluate(async (h) => {
    if (typeof protoBatch?.teardown === 'function') protoBatch.teardown()
    await new Promise((r) => setTimeout(r, 50))
    protoBatch.buildFromHash(h)
    await new Promise((r) => setTimeout(r, 500))
  }, hash)

  return page.evaluate(() => {
    const artwork = { x: '0', y: '0', width: '100', height: '200' }
    const maskRects = [...document.querySelectorAll('[id$="-maskRect"]')].map((el) => ({
      id: el.id,
      x: el.getAttribute('x'),
      y: el.getAttribute('y'),
      width: el.getAttribute('width'),
      height: el.getAttribute('height'),
    }))
    const finalMasks = [...document.querySelectorAll('mask[id$="-mask"]')].map((el) => ({
      id: el.id,
      x: el.getAttribute('x'),
      y: el.getAttribute('y'),
      width: el.getAttribute('width'),
      height: el.getAttribute('height'),
    }))
    const comboSvgs = [...document.querySelectorAll('[class*="ShapeGroup-combo"]')].map((el) => {
      const svg = el.closest('svg') || el
      return {
        id: svg.id,
        viewBox: svg.getAttribute('viewBox'),
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
      }
    })
    const cellTightMaskRects = maskRects.filter((r) =>
      !(r.x === artwork.x && r.y === artwork.y && r.width === artwork.width && r.height === artwork.height)
    )
    return { maskRects, finalMasks, comboSvgs, cellTightMaskRects, maskRectCount: maskRects.length }
  })
}

async function main() {
  const server = await startServer()
  const { port } = server.address()
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 1400 })
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0', timeout: 120000 })

  await page.waitForFunction(() => typeof protoBatch !== 'undefined' && typeof GRID !== 'undefined', { timeout: 120000 })

  const results = {}
  for (const [label, hash] of Object.entries(HASHES)) {
    try {
      results[label] = await probeHash(page, label, hash)
      results[label].ok = results[label].cellTightMaskRects.length === 0
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
