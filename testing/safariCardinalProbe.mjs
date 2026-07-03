/**
 * Headless WebKit probe for Safari cardinal buffers.
 * Requires Playwright installed outside the repo (not vendored in-tree).
 * Usage:
 *   npx -y playwright install webkit
 *   node testing/safariCardinalProbe.mjs [hashIndex]
 */
import { webkit } from 'playwright'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const HASHES = {
  1519: '0x9dc995ab1bf1ddc93ebfacc9f627329a2b85cfb6c9e55c784ee33116c76e6bb5',
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function waitFor(page, fn, { timeoutMs = 180000, label = 'condition' } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const ok = await page.evaluate(fn)
    if (ok) return Date.now() - start
    await sleep(250)
  }
  throw new Error(`timeout: ${label}`)
}

async function main() {
  const hashIndex = Number(process.argv[2] || 1519)

  const server = await startServer()
  const { port } = server.address()
  const browser = await webkit.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 800, height: 1400 })

  const events = []
  const log = (name, extra = {}) => {
    const row = { name, t: Date.now(), ...extra }
    events.push(row)
    console.log(`[probe] ${name}`, JSON.stringify(extra))
  }

  try {
    log('goto-start')
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle', timeout: 180000 })
    await page.waitForFunction(() => typeof protoBatch !== 'undefined', { timeout: 180000 })
    log('page-ready', { ua: await page.evaluate(() => navigator.userAgent) })

    const hash = HASHES[hashIndex] || await page.evaluate((i) => {
      if (typeof lastHash === 'undefined' || !lastHash[i]) return null
      return lastHash[i]
    }, hashIndex)
    if (!hash) throw new Error(`no hash for index ${hashIndex}`)

    const webkitClass = await page.evaluate(() => window.SafariCompat?.detectWebKitClass?.())
    log('webkit-detect', { webkitClass, capabilities: await page.evaluate(() => window.SafariCompat?.capabilities) })

    log('build-start', { hashIndex })
    await page.evaluate((h) => {
      protoBatch.buildFromHash(h)
    }, hash)

    const revealMs = await waitFor(page, () => window.RevealAnim?.isSafariRevealComplete?.(), {
      timeoutMs: 180000,
      label: 'reveal complete',
    })
    log('reveal-complete', { revealMs, snapshot: await page.evaluate(() => window.SafariCardinalDiagnostics?.snapshot?.()) })

    const postRevealIdle = await page.evaluate(() => ({
      baking: window.SafariCardinalBuffers?.isBaking?.(),
      ready: window.SafariCardinalBuffers?.isReady?.(),
      bufferBytes: window.SafariCardinalBuffers?.estimateBufferBytes?.(),
    }))
    log('post-reveal-idle', postRevealIdle)
    await sleep(3000)
    const stillIdle = await page.evaluate(() => ({
      baking: window.SafariCardinalBuffers?.isBaking?.(),
      ready: window.SafariCardinalBuffers?.isReady?.(),
      bleedHidden: window.SafariCardinalDiagnostics?.snapshot?.()?.dom?.bleedHidden,
    }))
    log('post-reveal-idle+3s', stillIdle)

    // Simulate user pressing arrow before background bake finishes.
    const earlyArrow = await page.evaluate(async () => {
      const start = performance.now()
      rotateArtworkBy?.(1)
      await new Promise(r => setTimeout(r, 100))
      const during = window.SafariCardinalDiagnostics?.snapshot?.()
      return {
        ms: performance.now() - start,
        baking: window.SafariCardinalBuffers?.isBaking?.(),
        ready: window.SafariCardinalBuffers?.isReady?.(),
        bleedHiddenDuring: during?.dom?.bleedHidden,
        loadingDuring: during?.dom?.loadingOverlayBuilding,
      }
    })
    log('early-arrow', earlyArrow)

    await waitFor(page, () => {
      const snap = window.SafariCardinalDiagnostics?.snapshot?.()
      const angle = snap?.rotation?.angle ?? 0
      return !window.SafariCardinalBuffers?.isAnimating?.()
        && !(typeof artworkRotationState !== 'undefined' && artworkRotationState.cardinalBusy)
        && angle === 90
    }, {
      timeoutMs: 120000,
      label: 'early rotation to 90°',
    }).catch(err => log('early-arrow-timeout', { error: String(err) }))
    await sleep(500)
    const afterEarly = await page.evaluate(() => window.SafariCardinalDiagnostics?.snapshot?.())
    log('early-arrow-complete', {
      angle: afterEarly?.rotation?.angle,
      blackScreen: afterEarly?.dom?.bgHidden === true
        && afterEarly?.dom?.bleedHidden === true
        && afterEarly?.cardinal?.imageDisplayActive
        && (afterEarly?.cardinal?.bitmapDisplayBroken || afterEarly?.dom?.cardinalOverlayDisplay !== 'block'),
    })

    await sleep(500)

    const beforeArrow = await page.evaluate(() => window.SafariCardinalDiagnostics?.snapshot?.())
    log('arrow-start', { beforeAngle: beforeArrow?.rotation?.angle })
    await page.evaluate(() => rotateArtworkBy?.(1))

    await waitFor(page, () => {
      const snap = window.SafariCardinalDiagnostics?.snapshot?.()
      const angle = snap?.rotation?.angle ?? 0
      return !window.SafariCardinalBuffers?.isAnimating?.()
        && !(typeof artworkRotationState !== 'undefined' && artworkRotationState.cardinalBusy)
        && angle === 180
    }, {
      timeoutMs: 60000,
      label: 'rotation to 180°',
    }).catch(err => log('arrow-anim-timeout', { error: String(err) }))
    await sleep(500)

    const afterArrow = await page.evaluate(() => window.SafariCardinalDiagnostics?.snapshot?.())
    const blackScreen = afterArrow?.dom?.bgHidden === true
      && afterArrow?.dom?.bleedHidden === true
      && afterArrow?.cardinal?.imageDisplayActive
      && (afterArrow?.cardinal?.bitmapDisplayBroken || afterArrow?.dom?.cardinalOverlayDisplay !== 'block')

    log('arrow-complete', { blackScreen, before: beforeArrow?.rotation?.angle, after: afterArrow?.rotation?.angle })

    // Wait for the background bake of remaining orientations, then confirm all
    // 4 buffers are resident so further rotations need no re-render.
    await waitFor(page, () => window.SafariCardinalBuffers?.isReady?.(), {
      timeoutMs: 120000,
      label: 'all 4 cardinal buffers resident',
    }).catch(err => log('full-bake-timeout', { error: String(err) }))
    const residency = await page.evaluate(() => ({
      ready: window.SafariCardinalBuffers?.isReady?.(),
      bufferBytes: window.SafariCardinalBuffers?.estimateBufferBytes?.(),
      angles: window.SafariCardinalBuffers?.getDiagnosticsSnapshot?.()?.angles,
    }))
    log('buffer-residency', residency)

    // Third rotation should be fast: all buffers baked, transform+opacity only.
    const fastRotate = await page.evaluate(async () => {
      const start = performance.now()
      rotateArtworkBy?.(1)
      while (window.SafariCardinalBuffers?.isAnimating?.()
        || (typeof artworkRotationState !== 'undefined' && artworkRotationState.cardinalBusy)) {
        await new Promise(r => setTimeout(r, 50))
        if (performance.now() - start > 15000) break
      }
      return {
        ms: Math.round(performance.now() - start),
        angle: window.SafariCardinalDiagnostics?.snapshot?.()?.rotation?.angle,
        bakedDuring: window.SafariCardinalBuffers?.isBaking?.(),
      }
    })
    log('fast-rotate', fastRotate)

    // Export path: build the same markup saveArtworkPNG uses and rasterize it
    // in-page, sampling alpha to prove the PNG would not be blank.
    const exportCheck = await page.evaluate(async () => {
      try {
        const rotationInfo = getArtworkExportRotationInfo()
        const batch = typeof getArtworkOffsetBatch === 'function'
          ? getArtworkOffsetBatch()
          : []
        const markup = typeof buildExportSvgMarkup === 'function'
          ? buildExportSvgMarkup(rotationInfo, Math.round(5400 * 0.1), Math.round(3000 * 0.1))
          : null
        if (!markup) return { error: 'buildExportSvgMarkup unavailable' }
        const scale = 0.1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(5400 * scale)
        canvas.height = Math.round(3000 * scale)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        await new Promise((resolve, reject) => {
          const img = new Image()
          const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            URL.revokeObjectURL(url)
            resolve()
          }
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('export raster failed')) }
          img.src = url
        })
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let visible = 0
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 16) visible++
        }
        return {
          angle: rotationInfo.angle,
          offsetBatchSize: batch.length,
          visibleFraction: visible / (data.length / 4),
          blank: visible / (data.length / 4) < 0.001,
          exportCapability: window.SafariCompat?.getCapabilities?.()?.export,
          renderEngine: window.SafariCompat?.getCapabilities?.()?.renderEngine,
        }
      } catch (err) {
        return { error: String(err) }
      }
    })
    log('export-check', exportCheck)

    const result = {
      hashIndex,
      webkitClass,
      revealMs,
      blackScreen,
      final: afterArrow,
      events,
    }
    console.log('\n=== RESULT ===')
    console.log(JSON.stringify(result, null, 2))
    if (blackScreen) process.exitCode = 2
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
