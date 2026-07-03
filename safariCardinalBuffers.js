// safariCardinalBuffers.js — WebKit rotation via pre-baked cardinal lighting bitmaps.
// All 4 cardinals rasterized at portrait 0° geometry; only lighting differs per angle.
// Vertical cardinals (0°, 180°) on top layer; horizontal (90°, 270°) on bottom.
// Both layers share one CSS rotation; top opacity fades vertical vs horizontal.

(function () {
  'use strict'

  const CARDINAL_ANGLES = [0, 90, 180, 270]
  const ROTATION_PHASE_MS = 520
  const SCALE_PHASE_MS = 260
  const BAKE_WAIT_MS = 45000

  let buffers = {}
  let baking = false
  let bakePromise = null
  let bakeToken = 0
  let overlayAnimating = false
  let overlayEl = null
  let overlayStage = null
  let overlayBottomCanvas = null
  let overlayTopCanvas = null
  let scratchImageData = null
  let scratchImageDataSize = 0
  let topCanvasKey = null
  let bottomCanvasKey = null
  let imageDisplayActive = false
  let settledAngle = 0
  let settledScale = 1
  let layoutRectCache = null

  function normalizeAngle(angle) {
    const n = Number(angle)
    if (!Number.isFinite(n)) return 0
    return ((Math.round(n / 90) * 90) % 360 + 360) % 360
  }

  function isVerticalOrientation(angle) {
    return normalizeAngle(angle) % 180 === 0
  }

  function bufferIsValid(entry) {
    return !!(entry
      && entry.lum instanceof Uint8Array
      && entry.alpha instanceof Uint8Array
      && entry.width > 0
      && entry.height > 0
      && entry.lum.length === entry.width * entry.height
      && entry.alpha.length === entry.width * entry.height)
  }

  function bufferHasVisiblePixels(buffer, minAlpha = 8) {
    if (!bufferIsValid(buffer)) return false
    const { alpha } = buffer
    const stride = Math.max(1, Math.floor(alpha.length / 4096))
    for (let i = 0; i < alpha.length; i += stride) {
      if (alpha[i] >= minAlpha) return true
    }
    return alpha[alpha.length - 1] >= minAlpha
  }

  function recoverToLiveArtwork(reason = 'manual') {
    if (typeof DeBug !== 'undefined' && DeBug.warn) {
      DeBug.warn('[CardinalBuffers] recoverToLiveArtwork', reason)
    }
    disableImageDisplay()
    return true
  }

  function releaseBuffers() {
    buffers = {}
    scratchImageData = null
    scratchImageDataSize = 0
    topCanvasKey = null
    bottomCanvasKey = null
  }

  function invalidateCardinalBuffers() {
    bakeToken++
    releaseBuffers()
    baking = false
    bakePromise = null
    disableImageDisplay()
  }

  function setLiveArtworkDisplayed(visible) {
    const viewport = document.getElementById('artwork-rotation-viewport')
    const bleed = FRAME?.bleed?.elt
    ;[viewport, bleed].forEach(el => {
      if (!el) return
      if (visible) {
        el.style.visibility = ''
        el.style.pointerEvents = ''
        el.style.opacity = ''
      } else {
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
        el.style.opacity = '0'
      }
    })
  }

  function disableImageDisplay() {
    imageDisplayActive = false
    layoutRectCache = null
    hideOverlay()
    setLiveArtworkDisplayed(true)
  }

  function getDisplayRect() {
    const viewport = document.getElementById('artwork-rotation-viewport')
    const target = viewport || FRAME?.bleed?.elt
    if (target) {
      const rect = target.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return rect
    }
    if (layoutRectCache) return layoutRectCache
    if (!frameSize) return null
    const w = frameSize.x
    const h = frameSize.y
    const left = (window.innerWidth - w) / 2
    const top = (window.innerHeight - h) / 2
    return { left, top, width: w, height: h }
  }

  function cacheLayoutRect() {
    layoutRectCache = getDisplayRect()
  }

  function showSettledAngle(angle, scale) {
    if (!isReady()) return false
    const norm = normalizeAngle(angle)
    const buffer = buffers[norm]
    if (!bufferIsValid(buffer) || !bufferHasVisiblePixels(buffer)) return false

    imageDisplayActive = true
    settledAngle = angle
    settledScale = scale
    setLiveArtworkDisplayed(false)
    ensureOverlay()
    syncStageSize()

    const vert = isVerticalOrientation(norm)
    blitGAToCanvasIfNeeded(
      buffers[norm],
      vert ? overlayTopCanvas : overlayBottomCanvas,
      vert ? 'top' : 'bottom',
    )

    overlayBottomCanvas.style.opacity = '1'
    overlayTopCanvas.style.opacity = vert ? '1' : '0'
    applyStageTransform(angle, scale)
    positionOverlay(getDisplayRect())
    overlayEl.style.display = 'block'
    return true
  }

  function enableImageDisplay(angle, scale) {
    cacheLayoutRect()
    const ok = showSettledAngle(angle, scale)
    if (!ok) {
      imageDisplayActive = false
      hideOverlay()
      setLiveArtworkDisplayed(true)
    }
    return ok
  }

  function syncDisplayLayout() {
    if (!imageDisplayActive || !isReady()) return
    cacheLayoutRect()
    showSettledAngle(settledAngle, settledScale)
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  function displayScaleFor(scale) {
    const s = Number.isFinite(scale) ? scale : 1
    const backing = Math.max(1, s)
    return s / backing
  }

  function extractGAFromImageData(data, width, height) {
    const pixelCount = width * height
    const lum = new Uint8Array(pixelCount)
    const alpha = new Uint8Array(pixelCount)
    for (let i = 0; i < pixelCount; i++) {
      const si = i * 4
      lum[i] = data[si]
      alpha[i] = data[si + 3]
    }
    return { width, height, lum, alpha }
  }

  function rasterizeToGA(svgMarkup, width, height) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(url)
          const imageData = ctx.getImageData(0, 0, width, height)
          resolve(extractGAFromImageData(imageData.data, width, height))
        } catch (err) {
          URL.revokeObjectURL(url)
          reject(err)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('SVG raster failed'))
      }
      img.src = url
    })
  }

  function getScratchImageData(width, height) {
    const size = width * height
    if (!scratchImageData || scratchImageDataSize !== size) {
      scratchImageData = new ImageData(width, height)
      scratchImageDataSize = size
    }
    return scratchImageData
  }

  function blitGAToCanvas(buffer, canvas) {
    if (!bufferIsValid(buffer) || !canvas) return
    const { width, height, lum, alpha } = buffer
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: true })
    const imageData = getScratchImageData(width, height)
    const out = imageData.data
    const pixelCount = width * height
    for (let i = 0; i < pixelCount; i++) {
      const g = lum[i]
      const oi = i * 4
      out[oi] = g
      out[oi + 1] = g
      out[oi + 2] = g
      out[oi + 3] = alpha[i]
    }
    ctx.putImageData(imageData, 0, 0)
    if (frameSize) {
      canvas.style.width = `${frameSize.x}px`
      canvas.style.height = `${frameSize.y}px`
    }
  }

  function blitGAToCanvasIfNeeded(buffer, canvas, layerKey) {
    const angleKey = buffer?.angle
    if (layerKey === 'top') {
      if (topCanvasKey === angleKey && canvas.width === buffer?.width) return
      blitGAToCanvas(buffer, canvas)
      topCanvasKey = angleKey
      return
    }
    if (bottomCanvasKey === angleKey && canvas.width === buffer?.width) return
    blitGAToCanvas(buffer, canvas)
    bottomCanvasKey = angleKey
  }

  function stripBakeStyles(clone) {
    clone.style.removeProperty('transform')
    clone.style.removeProperty('transform-origin')
    clone.style.removeProperty('transform-box')
    clone.style.removeProperty('will-change')
    clone.style.removeProperty('position')
    clone.style.removeProperty('left')
    clone.style.removeProperty('top')
    clone.style.removeProperty('max-width')
    clone.style.removeProperty('max-height')
  }

  function createPortraitBakeMarkup(svgElement, width, height) {
    const clone = svgElement.cloneNode(true)
    stripBakeStyles(clone)
    clone.setAttribute('width', `${width}`)
    clone.setAttribute('height', `${height}`)
    return Export.createSVGMarkup(clone)
  }

  //FUNC: cardinalRasterSize() : { width, height, ... } | null
  // Unified bake resolution for all four cardinal lighting passes. Portrait-
  // oriented SVG geometry is identical per buffer; pixel dimensions must cover
  // the largest on-screen footprint across vertical (scale 1) and horizontal
  // (scale = artworkRotationScaleFor(90)) orientations at devicePixelRatio.
  //
  // Sideways display applies fitScale < 1 on the stage, which supersamples the
  // same bitmap and can make vertical look softer if raster is sized only for
  // portrait width. parityBoost raises unified raster when fitScale < 1.
  function cardinalRasterSize() {
    const bleedW = parseFloat(FRAME?.bleed?.elt?.getAttribute('width'))
    const bleedH = parseFloat(FRAME?.bleed?.elt?.getAttribute('height'))
    if (!Number.isFinite(bleedW) || !Number.isFinite(bleedH) || bleedW <= 0 || bleedH <= 0) {
      return null
    }

    const dpr = window.devicePixelRatio || 1
    const cssW = frameSize?.x || bleedW
    const cssH = frameSize?.y || bleedH
    const sidewaysScale = typeof artworkRotationScaleFor === 'function'
      ? artworkRotationScaleFor(90)
      : 1

    const vertFootprintW = cssW
    const vertFootprintH = cssH
    const horizFootprintW = cssH * sidewaysScale
    const horizFootprintH = cssW * sidewaysScale

    // Portrait bitmap axes vs on-screen footprint after stage rotation.
    const reqScaleW = Math.max(
      (vertFootprintW * dpr) / bleedW,
      (horizFootprintH * dpr) / bleedW,
    )
    const reqScaleH = Math.max(
      (vertFootprintH * dpr) / bleedH,
      (horizFootprintW * dpr) / bleedH,
    )

    const parityBoost = sidewaysScale > 0 && sidewaysScale < 1
      ? 1 / sidewaysScale
      : 1

    const MAX_RASTER_SCALE = 3
    const rasterScale = Math.min(
      Math.max(reqScaleW, reqScaleH) * parityBoost,
      MAX_RASTER_SCALE,
    )

    return {
      width: Math.max(1, Math.round(bleedW * rasterScale)),
      height: Math.max(1, Math.round(bleedH * rasterScale)),
      rasterScale,
      sidewaysScale,
      parityBoost,
    }
  }

  async function bakeAngle(angle, token) {
    if (token !== bakeToken) throw new Error('bake cancelled')
    if (!FRAME?.bleed?.elt || !frameSize) throw new Error('no artwork')
    if (typeof captureArtworkRotationSnapshot !== 'function'
      || typeof restoreArtworkRotationSnapshot !== 'function') {
      throw new Error('rotation snapshot helpers missing')
    }

    const saved = captureArtworkRotationSnapshot()
    try {
      if (typeof applyArtworkRotationForCardinalBake !== 'function') {
        throw new Error('applyArtworkRotationForCardinalBake missing')
      }
      applyArtworkRotationForCardinalBake(angle)

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (token !== bakeToken) throw new Error('bake cancelled')

      const normalized = normalizeAngle(angle)
      const raster = cardinalRasterSize()
      if (!raster) throw new Error('invalid cardinal raster size')

      const svgMarkup = createPortraitBakeMarkup(
        FRAME.bleed.elt,
        raster.width,
        raster.height,
      )
      if (typeof DeBug !== 'undefined' && DeBug.log) {
        DeBug.log(`[CardinalBuffers] baking light@${normalized}°`, `${raster.width}x${raster.height}`, {
          rasterScale: raster.rasterScale,
          sidewaysScale: raster.sidewaysScale,
          parityBoost: raster.parityBoost,
        })
      }
      const ga = await rasterizeToGA(svgMarkup, raster.width, raster.height)
      if (token !== bakeToken) throw new Error('bake cancelled')
      return { ...ga, angle: normalized }
    } finally {
      restoreArtworkRotationSnapshot(saved, { syncLight: false })
    }
  }

  async function bakeCardinalBuffers() {
    if (overlayAnimating) return { ...buffers }
    if (baking && bakePromise) return bakePromise
    if (CARDINAL_ANGLES.every(a => bufferIsValid(buffers[a]))) return { ...buffers }

    const token = ++bakeToken
    const saved = typeof captureArtworkRotationSnapshot === 'function'
      ? captureArtworkRotationSnapshot()
      : null
    baking = true
    bakePromise = (async () => {
      try {
        releaseBuffers()
        for (const angle of CARDINAL_ANGLES) {
          if (token !== bakeToken || overlayAnimating) throw new Error('bake cancelled')
          buffers[angle] = await bakeAngle(angle, token)
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        return { ...buffers }
      } catch (err) {
        if (token === bakeToken) releaseBuffers()
        throw err
      } finally {
        if (token === bakeToken) baking = false
        if (saved && typeof restoreArtworkRotationSnapshot === 'function') {
          restoreArtworkRotationSnapshot(saved, { syncLight: false })
        }
        // Do not auto-switch to bitmap here — keep live SVG visible until the
        // user rotates. enableImageDisplay runs from rotateArtworkByCardinal().
      }
    })()
    return bakePromise
  }

  function getArtworkScreenRect() {
    return getDisplayRect()
  }

  function ensureOverlay() {
    if (overlayEl && overlayStage) return overlayEl

    if (overlayEl) overlayEl.remove()

    overlayEl = document.createElement('div')
    overlayEl.id = 'safari-cardinal-rotation-overlay'
    overlayEl.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:9998',
      'overflow:visible',
      'display:none',
    ].join(';')

    overlayStage = document.createElement('div')
    overlayStage.id = 'safari-cardinal-rotation-stage'
    overlayStage.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform-origin:center center',
      'transform-box:border-box',
      'will-change:transform',
    ].join(';')

    const canvasStyle = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'max-width:none',
      'max-height:none',
    ].join(';')

    overlayBottomCanvas = document.createElement('canvas')
    overlayTopCanvas = document.createElement('canvas')
    overlayBottomCanvas.id = 'safari-cardinal-layer-bottom'
    overlayTopCanvas.id = 'safari-cardinal-layer-top'
    overlayBottomCanvas.style.cssText = canvasStyle
    overlayTopCanvas.style.cssText = canvasStyle
    overlayBottomCanvas.style.opacity = '1'
    overlayTopCanvas.style.opacity = '1'

    overlayStage.appendChild(overlayBottomCanvas)
    overlayStage.appendChild(overlayTopCanvas)
    overlayEl.appendChild(overlayStage)
    document.body.appendChild(overlayEl)
    syncStageSize()
    return overlayEl
  }

  function syncStageSize() {
    if (!overlayStage || !frameSize) return
    overlayStage.style.width = `${frameSize.x}px`
    overlayStage.style.height = `${frameSize.y}px`
  }

  function applyStageTransform(angle, scale) {
    if (!overlayStage) return
    const displayScale = displayScaleFor(scale)
    overlayStage.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${displayScale})`
  }

  function positionOverlay(rect) {
    if (!overlayEl || !rect) return
    overlayEl.style.left = `${rect.left}px`
    overlayEl.style.top = `${rect.top}px`
    overlayEl.style.width = `${rect.width}px`
    overlayEl.style.height = `${rect.height}px`
  }

  function hideOverlay() {
    if (!overlayEl) return
    overlayEl.style.display = 'none'
    if (overlayTopCanvas) overlayTopCanvas.style.opacity = '1'
    if (overlayBottomCanvas) overlayBottomCanvas.style.opacity = '1'
  }

  function prepareTransitionLayers(fromNorm, toNorm, topOpacityStart) {
    const fromVert = isVerticalOrientation(fromNorm)
    const toVert = isVerticalOrientation(toNorm)

    blitGAToCanvasIfNeeded(buffers[fromNorm], fromVert ? overlayTopCanvas : overlayBottomCanvas, fromVert ? 'top' : 'bottom')
    blitGAToCanvasIfNeeded(buffers[toNorm], toVert ? overlayTopCanvas : overlayBottomCanvas, toVert ? 'top' : 'bottom')

    overlayBottomCanvas.style.opacity = '1'
    overlayTopCanvas.style.opacity = String(topOpacityStart)
  }

  function animateStagePhase({
    fromAngle,
    toAngle,
    fromScale,
    toScale,
    durationMs,
    topOpacityStart,
    topOpacityEnd,
  }) {
    return new Promise(resolve => {
      const startMs = performance.now()
      const step = now => {
        const rawT = durationMs <= 0 ? 1 : Math.min(1, (now - startMs) / durationMs)
        const t = easeInOutCubic(rawT)
        const angle = lerp(fromAngle, toAngle, t)
        const scale = lerp(fromScale, toScale, t)
        const topOpacity = lerp(topOpacityStart, topOpacityEnd, t)
        applyStageTransform(angle, scale)
        overlayTopCanvas.style.opacity = String(topOpacity)
        if (rawT < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    })
  }

  function animateCardinalRotation({
    fromAngle,
    toAngle,
    startScale,
    targetScale,
  }) {
    const fromNorm = normalizeAngle(fromAngle)
    const toNorm = normalizeAngle(toAngle)
    if (!bufferIsValid(buffers[fromNorm]) || !bufferIsValid(buffers[toNorm])) {
      return Promise.resolve(false)
    }

    const topOpacityStart = isVerticalOrientation(fromNorm) ? 1 : 0
    const topOpacityEnd = isVerticalOrientation(toNorm) ? 1 : 0
    const shrinkFirst = targetScale < startScale

    overlayAnimating = true
    setLiveArtworkDisplayed(false)
    ensureOverlay()
    syncStageSize()
    prepareTransitionLayers(fromNorm, toNorm, topOpacityStart)
    applyStageTransform(fromAngle, startScale)
    positionOverlay(getDisplayRect())
    overlayEl.style.display = 'block'
    overlayStage.style.willChange = 'transform'
    overlayTopCanvas.style.willChange = 'opacity'

    const finish = (success) => {
      overlayAnimating = false
      overlayStage.style.willChange = 'auto'
      overlayTopCanvas.style.willChange = 'auto'
      if (success) {
        showSettledAngle(toAngle, targetScale)
        return
      }
      if (imageDisplayActive) {
        if (!showSettledAngle(settledAngle, settledScale)) {
          recoverToLiveArtwork('animation failed — settled frame invalid')
        }
        return
      }
      hideOverlay()
      setLiveArtworkDisplayed(true)
    }

    return (async () => {
      try {
        if (shrinkFirst) {
          await animateStagePhase({
            fromAngle,
            toAngle: fromAngle,
            fromScale: startScale,
            toScale: targetScale,
            durationMs: SCALE_PHASE_MS,
            topOpacityStart,
            topOpacityEnd: topOpacityStart,
          })
          await animateStagePhase({
            fromAngle,
            toAngle,
            fromScale: targetScale,
            toScale: targetScale,
            durationMs: ROTATION_PHASE_MS,
            topOpacityStart,
            topOpacityEnd,
          })
        } else {
          await animateStagePhase({
            fromAngle,
            toAngle,
            fromScale: startScale,
            toScale: startScale,
            durationMs: ROTATION_PHASE_MS,
            topOpacityStart,
            topOpacityEnd,
          })
          await animateStagePhase({
            fromAngle: toAngle,
            toAngle,
            fromScale: startScale,
            toScale: targetScale,
            durationMs: SCALE_PHASE_MS,
            topOpacityStart: topOpacityEnd,
            topOpacityEnd,
          })
        }
        finish(true)
        return true
      } catch (err) {
        finish(false)
        throw err
      }
    })()
  }

  function scheduleCardinalBake() {
    if (!window.SafariCompat?.detectWebKitClass?.()) return
    if (SafariCompat.capabilities.rotation !== 'cardinal') return
    if (window.RevealAnim?.isSafariRevealComplete && !window.RevealAnim.isSafariRevealComplete()) return
    if (CARDINAL_ANGLES.every(a => bufferIsValid(buffers[a]))) return
    if (baking || overlayAnimating) return

    const run = () => {
      bakeCardinalBuffers().catch(err => {
        if (typeof DeBug !== 'undefined' && DeBug.warn) {
          DeBug.warn('[CardinalBuffers] bake failed', err)
        }
      })
    }
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 8000 })
    } else {
      setTimeout(run, 800)
    }
  }

  function isReady() {
    return CARDINAL_ANGLES.every(a => bufferIsValid(buffers[a]))
  }

  function isBaking() {
    return baking
  }

  function estimateBufferBytes() {
    return CARDINAL_ANGLES.reduce((sum, a) => {
      const b = buffers[a]
      if (!bufferIsValid(b)) return sum
      return sum + b.lum.length + b.alpha.length
    }, 0)
  }

  async function ensureReady() {
    if (isReady()) return true
    if (overlayAnimating) return false
    if (!isBaking()) scheduleCardinalBake()
    try {
      await Promise.race([
        bakeCardinalBuffers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('cardinal bake timeout')), BAKE_WAIT_MS)),
      ])
      return isReady()
    } catch (err) {
      if (typeof DeBug !== 'undefined' && DeBug.warn) {
        DeBug.warn('[CardinalBuffers] ensureReady failed', err)
      }
      return false
    }
  }

  function getDiagnosticsSnapshot() {
    return {
      baking,
      overlayAnimating,
      imageDisplayActive,
      settledAngle,
      settledScale,
      bakeToken,
      ready: isReady(),
      bufferBytes: estimateBufferBytes(),
      raster: typeof cardinalRasterSize === 'function' ? cardinalRasterSize() : null,
      angles: CARDINAL_ANGLES.map(a => ({
        angle: a,
        valid: bufferIsValid(buffers[a]),
        visible: bufferHasVisiblePixels(buffers[a]),
        width: buffers[a]?.width,
        height: buffers[a]?.height,
      })),
      liveArtworkHidden: (() => {
        const bleed = FRAME?.bleed?.elt
        return bleed ? bleed.style.visibility === 'hidden' || bleed.style.opacity === '0' : null
      })(),
      overlayDisplayed: overlayEl?.style.display === 'block',
    }
  }

  window.SafariCardinalBuffers = {
    CARDINAL_ANGLES,
    bakeCardinalBuffers,
    scheduleCardinalBake,
    invalidateCardinalBuffers,
    animateCardinalRotation,
    enableImageDisplay,
    showSettledAngle,
    syncDisplayLayout,
    disableImageDisplay,
    recoverToLiveArtwork,
    isImageDisplayActive: () => imageDisplayActive,
    ensureReady,
    isReady,
    isBaking,
    isAnimating: () => overlayAnimating,
    estimateBufferBytes,
    bufferIsValid,
    bufferHasVisiblePixels,
    isVerticalOrientation,
    cardinalRasterSize,
    getDiagnosticsSnapshot,
  }
})()
