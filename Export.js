//MARK: Export CLASS
// SIZE: 200 lines
// SVG/PNG download helpers. createSVGMarkup used by ProtoLayerObjects; production PNG save via saveArtworkPNG().
class Export {

  // MARK: File export methods
  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static createSVGMarkup(svgElement) {
    const
      serializer = new XMLSerializer(),
      svgMarkup = serializer.serializeToString(svgElement)
    return svgMarkup
  }

  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static exportPNG(svgMarkup, fileName, width, height, scale = 1) {
    // DeBug.log("Starting exportPNG() function...")

    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext("2d")
    ctx.scale(scale, scale)

    const
      img = new Image(),
      svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }),
      svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl

    img.onload = function () {
      // DeBug.log("Image loaded...")                                                           //LOGGING:
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(function (blob) {
        // DeBug.log("Blob created...")                                                         //LOGGING:
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // DeBug.log("Link clicked...")                                                         //LOGGING:

        URL.revokeObjectURL(url) // Revoke the Blob URL for the PNG
        URL.revokeObjectURL(svgUrl) // Revoke the Blob URL for the SVG
        DeBug.log(`PNG saved`)                                                                  //LOGGING:
      })
    }
  }

  // MARK: Frame Sequence Export
  //METH: exportFrames() : null : export a sequence of PNG frames rotating shadAngle 360° starting from startAngle
  static async exportFrames({
    size = vert(1000, 1800),
    totalFrames = 360,
    scale = 1,
    startAngle = 90,
    useDirectoryPicker = true,
    _dirHandle = null,        // Pre-acquired handle from ProtoBatch (bypasses picker)
    _hashPrefix = null,       // Custom prefix for batch filenames
  } = {}) {
    const degreesPerFrame = 360 / totalFrames
    const hash = tokenData.hash
    const trimmedHash = _hashPrefix || `${hash.slice(0, 4)}\u2026${hash.slice(-4)}`
    const date = getCurrentDateString()
    const padLength = String(totalFrames - 1).length
    const rezString = `${size.x * scale}x${size.y * scale}`
    const framesString = `${totalFrames}fr`

    // Pre-create a single canvas and context to reuse across all frames
    const canvas = document.createElement('canvas')
    canvas.width = size.x * scale
    canvas.height = size.y * scale
    const ctx = canvas.getContext('2d')

    // Use pre-acquired handle, or attempt to get one via picker
    let dirHandle = _dirHandle
    if (!dirHandle && useDirectoryPicker && window.showDirectoryPicker) {
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      } catch (e) {
        DeBug.warn(`Directory picker cancelled or unsupported, falling back to downloads`)
        dirHandle = null
      }
    }

    // Cache the SVG element reference
    const svgElement = FRAME.bleed.elt

    //ARROW: updateShadeAngle() : null : set shadAngle and update all filter offsets in place
    const updateShadeAngle = (angle) => {
      globalControls.shadAngle = angle % 360
      const shadVect = Shade.shadVect(globalControls.shadAngle)
      S.offsetElts.forEach(({ elt, mag }) => {
        elt.attribute('dx', shadVect.x * mag)
        elt.attribute('dy', shadVect.y * mag)
      })
    }

    //ARROW: renderFrame() : Promise<Blob> : serialize current SVG state and rasterize to a PNG blob
    const renderFrame = () => {
      return new Promise((resolve, reject) => {
        const svgMarkup = Export.createSVGMarkup(svgElement)
        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const img = new Image()

        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.save()
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, size.x, size.y)
          ctx.restore()
          URL.revokeObjectURL(svgUrl)

          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/png')
        }

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl)
          reject(new Error('Failed to load SVG image'))
        }

        img.src = svgUrl
      })
    }

    //ARROW: saveBlob() : Promise<void> : save blob either to picked directory or as browser download
    const saveBlob = async (blob, fileName) => {
      if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        URL.revokeObjectURL(url)
        // Small delay to prevent browser from choking on rapid downloads
        await new Promise(r => setTimeout(r, 100))
      }
    }

    // Main export loop
    console.log(`Exporting ${totalFrames} frames at ${size.x}x${size.y} (scale ${scale})...`)
    const startTime = performance.now()

    //ARROW: formatAngle() : string : format angle, rounded to nearest relevant decimal
    const formatAngle = (angle) => {
      const normalized = ((angle % 360) + 360) % 360
      const rounded = roundToDec(normalized, 1)
      return Number.isInteger(rounded) ? `${rounded}deg` : `${rounded}deg`
    }

    for (let i = 0; i < totalFrames; i++) {
      const angle = startAngle + (i * degreesPerFrame)
      const frameNum = String(i).padStart(padLength, '0')
      const angleStr = formatAngle(angle)
      const fileName = `Prototypes-${trimmedHash}-${date}-fr${frameNum}of${totalFrames}-${angleStr}-${rezString}.png`

      updateShadeAngle(angle)

      // Allow a microtask/paint cycle so the DOM updates before serialization
      await new Promise(r => requestAnimationFrame(r))

      const blob = await renderFrame()
      await saveBlob(blob, fileName)

      if (i % 10 === 0 || i === totalFrames - 1) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
        const pct = ((i + 1) / totalFrames * 100).toFixed(1)
        console.log(`Frame ${i + 1}/${totalFrames} (${pct}%) — ${elapsed}s elapsed`)
      }
    }

    // Restore original angle
    updateShadeAngle(startAngle)

    const totalTime = ((performance.now() - startTime) / 1000).toFixed(1)
    console.log(`Export complete: ${totalFrames} frames in ${totalTime}s`)
  }
}

function getCurrentDateString() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function normalizeExportRotationAngle(angle) {
  const n = Number(angle)
  if (!Number.isFinite(n)) return 0
  return ((Math.round(n / 90) * 90) % 360 + 360) % 360
}

function getLiveArtworkRotationAngle() {
  const transform = FRAME?.bleed?.elt?.style?.transform || ''
  const match = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)
  if (!match) return null
  return normalizeExportRotationAngle(Number(match[1]))
}

function getArtworkExportRotationInfo() {
  const snap = typeof artworkRotationSnapshot === 'function'
    ? artworkRotationSnapshot()
    : { angle: 0 }
  const stateAngle = normalizeExportRotationAngle(snap.angle)
  // In cardinal bitmap mode the live SVG transform is stale (hidden at its
  // pre-bitmap orientation) — the rotation state is the source of truth.
  const bitmapActive = window.SafariCardinalBuffers?.isImageDisplayActive?.()
  const visualAngle = bitmapActive ? null : getLiveArtworkRotationAngle()
  const angle = visualAngle === null ? stateAngle : visualAngle
  const position = angle / 90
  const aspect = position % 2 === 0 ? 'V' : 'H'
  return {
    angle,
    position,
    aspect,
    code: `r${position}${aspect}`,
    isHorizontal: aspect === 'H',
  }
}

function getArtworkExportResolution(baseRez, rotationInfo, scale = 1) {
  const isHorizontal = rotationInfo.isHorizontal
    || normalizeExportRotationAngle(rotationInfo.angle) % 180 !== 0
  let width = isHorizontal ? baseRez.y : baseRez.x
  let height = isHorizontal ? baseRez.x : baseRez.y
  if (isHorizontal && height > width) [width, height] = [height, width]
  if (!isHorizontal && width > height) [width, height] = [height, width]
  return {
    width,
    height,
    rezString: `${width * scale}x${height * scale}`,
  }
}

function parseSVGViewBox(raw) {
  const vals = String(raw || '').trim().split(/[\s,]+/).map(Number)
  if (vals.length !== 4 || vals.some(v => !Number.isFinite(v))) return null
  return { x: vals[0], y: vals[1], width: vals[2], height: vals[3] }
}

function formatSVGViewBox({ x, y, width, height }) {
  return `${x} ${y} ${width} ${height}`
}

function stripArtworkCloneStyles(clone) {
  if (!clone?.style) return
  clone.style.removeProperty('transform')
  clone.style.removeProperty('transform-origin')
  clone.style.removeProperty('transform-box')
  clone.style.removeProperty('will-change')
  clone.style.removeProperty('position')
  clone.style.removeProperty('left')
  clone.style.removeProperty('top')
  clone.style.removeProperty('max-width')
  clone.style.removeProperty('max-height')
  // While cardinal bitmap mode is active the live bleed carries inline
  // display:none/visibility:hidden/opacity:0 — a clone keeping those
  // rasterizes as a blank PNG.
  clone.style.removeProperty('display')
  clone.style.removeProperty('visibility')
  clone.style.removeProperty('opacity')
}

function ensureCloneViewBox(clone, sourceElement) {
  if (clone.getAttribute('viewBox')) return
  const srcW = Number.parseFloat(sourceElement?.getAttribute('width'))
  const srcH = Number.parseFloat(sourceElement?.getAttribute('height'))
  if (Number.isFinite(srcW) && Number.isFinite(srcH) && srcW > 0 && srcH > 0) {
    clone.setAttribute('viewBox', `0 0 ${srcW} ${srcH}`)
  }
}

function createRotationAwareSVGMarkupFromClone(clone, rotationInfo, width, height) {
  stripArtworkCloneStyles(clone)
  clone.setAttribute('width', `${width}`)
  clone.setAttribute('height', `${height}`)

  const viewBox = parseSVGViewBox(clone.getAttribute('viewBox'))
  if (!viewBox) return Export.createSVGMarkup(clone)

  const angle = rotationInfo.angle
  if (angle === 0) return Export.createSVGMarkup(clone)

  const cx = viewBox.x + viewBox.width / 2
  const cy = viewBox.y + viewBox.height / 2
  const rotatedViewBox = rotationInfo.isHorizontal
    ? {
      x: cx - viewBox.height / 2,
      y: cy - viewBox.width / 2,
      width: viewBox.height,
      height: viewBox.width,
    }
    : viewBox
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  wrapper.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`)
  while (clone.firstChild) wrapper.appendChild(clone.firstChild)
  clone.appendChild(wrapper)
  clone.setAttribute('viewBox', formatSVGViewBox(rotatedViewBox))
  return Export.createSVGMarkup(clone)
}

function createRotationAwareSVGMarkup(svgElement, rotationInfo, width, height) {
  const clone = svgElement.cloneNode(true)
  return createRotationAwareSVGMarkupFromClone(clone, rotationInfo, width, height)
}

function getSVGMarkupIntrinsicSize(svgMarkup) {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
  const root = doc.documentElement
  const width = Number.parseFloat(root?.getAttribute('width'))
  const height = Number.parseFloat(root?.getAttribute('height'))
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null
  return { width, height, rezString: `${width}x${height}` }
}

function ensureSvgDocumentNamespaces(svgMarkup) {
  if (!svgMarkup || svgMarkup.includes('xmlns=')) return svgMarkup
  return svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
}

function canvasHasExportPixels(canvas, minAlpha = 12, minFraction = 0.001) {
  if (!canvas || canvas.width < 1 || canvas.height < 1) return false
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  const { width, height } = canvas
  const stride = Math.max(1, Math.floor((width * height) / 4096))
  let visible = 0
  let samples = 0
  for (let i = 0; i < width * height; i += stride) {
    samples++
    const x = i % width
    const y = Math.floor(i / width)
    if (ctx.getImageData(x, y, 1, 1).data[3] >= minAlpha) visible++
  }
  return samples > 0 && (visible / samples) >= minFraction
}

function downloadCanvasPng(canvas, fileName) {
  return new Promise((resolve, reject) => {
    const watchdog = setTimeout(() => reject(new Error('PNG blob timeout')), 90000)
    canvas.toBlob(blob => {
      clearTimeout(watchdog)
      if (!blob) {
        reject(new Error('PNG blob creation failed'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

async function exportArtworkPngFromMarkup(svgMarkup, fileName, width, height) {
  const canvas = await rasterizeExportMarkup(svgMarkup, width, height)
  if (!canvasHasExportPixels(canvas)) {
    throw new Error('export raster empty')
  }
  await yieldExportToMain(32)
  await downloadCanvasPng(canvas, fileName)
  if (typeof DeBug !== 'undefined' && DeBug.log) {
    DeBug.log('PNG saved', fileName)
  }
}

async function waitForExportPaintFrames(frames = 2) {
  for (let i = 0; i < frames; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
}

function buildExportSvgMarkup(rotationInfo, width, height) {
  const liveRoot = FRAME.bleed.elt
  const clone = liveRoot.cloneNode(true)
  ensureCloneViewBox(clone, liveRoot)
  if (typeof applyCompensatedLightToSVGElement === 'function') {
    applyCompensatedLightToSVGElement(clone, rotationInfo.angle, liveRoot)
  }
  return createRotationAwareSVGMarkupFromClone(clone, rotationInfo, width, height)
}

async function restoreDisplayAfterExport(wasBitmapActive, angle, scale) {
  if (!wasBitmapActive) return
  const cardinal = window.SafariCardinalBuffers
  cardinal?.cacheLayoutRect?.()
  if (!cardinal?.showSettledAngle?.(angle, scale)) {
    cardinal?.enableImageDisplay?.(angle, scale)
  }
  await waitForExportPaintFrames(1)
  cardinal?.syncDisplayLayout?.()
}

function parseMarkupViewBox(svgMarkup) {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
  return parseSVGViewBox(doc.documentElement?.getAttribute('viewBox'))
}

function buildTiledExportMarkup(fullMarkup, fullWidth, fullHeight, viewBox, srcY, tileHeight) {
  const doc = new DOMParser().parseFromString(fullMarkup, 'image/svg+xml')
  const svg = doc.documentElement
  if (!svg || !viewBox) return fullMarkup
  const sliceViewBox = {
    x: viewBox.x,
    y: viewBox.y + (srcY / fullHeight) * viewBox.height,
    width: viewBox.width,
    height: (tileHeight / fullHeight) * viewBox.height,
  }
  svg.setAttribute('viewBox', formatSVGViewBox(sliceViewBox))
  svg.setAttribute('width', `${fullWidth}`)
  svg.setAttribute('height', `${tileHeight}`)
  return ensureSvgDocumentNamespaces(new XMLSerializer().serializeToString(svg))
}

function yieldExportToMain(ms = 16) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Match cardinal per-buffer budget — Safari chokes on single 16MP filter raster.
const WEBKIT_MAX_TILE_PIXELS = 4 * 1024 * 1024
const WEBKIT_TILED_EXPORT_THRESHOLD = 6 * 1024 * 1024

function rasterizeSvgBlobToCanvasInternal(svgMarkup, width, height) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    let settled = false
    const finish = (err, canvas) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      if (err) reject(err)
      else resolve(canvas)
    }
    const watchdog = setTimeout(() => finish(new Error('export raster timeout')), 120000)
    img.onload = () => {
      clearTimeout(watchdog)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        if (canvas.width !== width || canvas.height !== height) {
          finish(new Error('export canvas allocation failed'))
          return
        }
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        finish(null, canvas)
      } catch (err) {
        finish(err)
      }
    }
    img.onerror = () => {
      clearTimeout(watchdog)
      finish(new Error('export SVG image load failed'))
    }
    img.src = url
  })
}

async function rasterizeSvgBlobToCanvas(svgMarkup, width, height) {
  let host = null
  let markup = ensureSvgDocumentNamespaces(svgMarkup)
  if (window.SafariCompat?.detectWebKitClass?.()) {
    host = document.createElement('div')
    host.id = 'safari-export-raster-host'
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = [
      'position:fixed',
      'left:-20000px',
      'top:0',
      'overflow:hidden',
      'visibility:hidden',
      'pointer-events:none',
    ].join(';')
    document.body.appendChild(host)
    host.innerHTML = markup
    const svg = host.querySelector('svg')
    if (svg) {
      svg.setAttribute('width', `${width}`)
      svg.setAttribute('height', `${height}`)
      markup = ensureSvgDocumentNamespaces(new XMLSerializer().serializeToString(svg))
    }
    await waitForExportPaintFrames(1)
  }
  try {
    return await rasterizeSvgBlobToCanvasInternal(markup, width, height)
  } finally {
    host?.remove()
  }
}

async function rasterizeSvgMarkupTiled(fullMarkup, width, height, maxTilePixels) {
  const viewBox = parseMarkupViewBox(fullMarkup)
  const tileHeight = Math.max(1, Math.floor(maxTilePixels / width))
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = width
  finalCanvas.height = height
  if (finalCanvas.width !== width || finalCanvas.height !== height) {
    throw new Error('export final canvas allocation failed')
  }
  const finalCtx = finalCanvas.getContext('2d')
  const markup = ensureSvgDocumentNamespaces(fullMarkup)

  for (let srcY = 0; srcY < height; srcY += tileHeight) {
    const sliceH = Math.min(tileHeight, height - srcY)
    const tileMarkup = viewBox
      ? buildTiledExportMarkup(markup, width, height, viewBox, srcY, sliceH)
      : markup
    if (typeof DeBug !== 'undefined' && DeBug.log) {
      DeBug.log('[Export] raster tile', { y: srcY, h: sliceH, w: width })
    }
    const tileCanvas = await rasterizeSvgBlobToCanvas(tileMarkup, width, sliceH)
    if (!canvasHasExportPixels(tileCanvas)) {
      throw new Error(`export tile empty at y=${srcY}`)
    }
    finalCtx.drawImage(tileCanvas, 0, srcY)
    tileCanvas.width = 1
    tileCanvas.height = 1
    await yieldExportToMain()
  }
  return finalCanvas
}

async function rasterizeExportMarkup(svgMarkup, width, height) {
  const pixels = width * height
  const useTiles = window.SafariCompat?.detectWebKitClass?.()
    && pixels > WEBKIT_TILED_EXPORT_THRESHOLD
  if (useTiles) {
    return rasterizeSvgMarkupTiled(svgMarkup, width, height, WEBKIT_MAX_TILE_PIXELS)
  }
  return rasterizeSvgBlobToCanvas(svgMarkup, width, height)
}

const EXPORT_PROBE_SCALE = 0.1

async function probeExportRasterIfNeeded() {
  if (!window.SafariCompat?.detectWebKitClass?.()) return true
  if (window.SafariCompat.isExportProbeComplete?.()) {
    return window.SafariCompat.getCapabilities?.().export !== 'off'
  }
  if (!FRAME?.bleed?.elt) return false
  const rotationInfo = getArtworkExportRotationInfo()
  const rez = vert(3000, 5400)
  const exportRez = getArtworkExportResolution(rez, rotationInfo, 1)
  const probeW = Math.max(1, Math.round(exportRez.width * EXPORT_PROBE_SCALE))
  const probeH = Math.max(1, Math.round(exportRez.height * EXPORT_PROBE_SCALE))
  const markup = buildExportSvgMarkup(rotationInfo, probeW, probeH)
  const t0 = performance.now()
  const probeCanvas = await rasterizeExportMarkup(markup, probeW, probeH)
  const ms = performance.now() - t0
  if (!canvasHasExportPixels(probeCanvas)) {
    window.SafariCompat.recordExportRasterProbe?.(ms)
    console.warn('[Export] Safari export probe raster empty')
    return false
  }
  window.SafariCompat.recordExportRasterProbe?.(ms)
  return window.SafariCompat.getCapabilities?.().export !== 'off'
}

async function saveArtworkPNG() {
  if (!FRAME?.bleed?.elt) return
  if (window.SafariCompat?.getCapabilities?.().export === 'off') {
    console.warn('[Export] PNG export unavailable in Safari — use Chrome desktop for full-resolution export')
    return
  }

  const exportAngle = typeof artworkRotationState !== 'undefined'
    ? (artworkRotationState.angle ?? 0)
    : 0
  const exportScale = typeof artworkRotationState !== 'undefined'
    ? (artworkRotationState.scale ?? 1)
    : 1
  const wasBitmapActive = window.SafariCardinalBuffers?.isImageDisplayActive?.() ?? false

  try {
    const probeOk = await probeExportRasterIfNeeded()
    if (!probeOk) {
      console.warn('[Export] PNG export unavailable in Safari — scaled probe exceeded time threshold')
      return
    }

    const scale = 1
    const rez = vert(3000, 5400)
    const rotationInfo = getArtworkExportRotationInfo()
    const exportRez = getArtworkExportResolution(rez, rotationInfo, scale)
    const date = getCurrentDateString()
    const hash = tokenData.hash
    const name = `Prototypes-${date}-${rotationInfo.code}-${hash}-${exportRez.rezString}.png`

    const svgMarkup = buildExportSvgMarkup(rotationInfo, exportRez.width, exportRez.height)
    const exportSize = getSVGMarkupIntrinsicSize(svgMarkup) || exportRez
    await exportArtworkPngFromMarkup(
      svgMarkup,
      name,
      exportSize.width,
      exportSize.height,
    )
  } catch (err) {
    console.warn('[Export] save failed', err)
  } finally {
    await restoreDisplayAfterExport(wasBitmapActive, exportAngle, exportScale)
  }
}

function handleArtworkSaveKey(event) {
  if (event.key !== 's' && event.key !== 'S') return
  const tag = event.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  event.preventDefault()
  saveArtworkPNG()
}

function installArtworkSaveControls() {
  if (window._artworkSaveInstalled) return
  window._artworkSaveInstalled = true
  document.addEventListener('keydown', handleArtworkSaveKey)
}
