// Cardinal orientation buffers — default rotation path on all browsers (submission MVP).
// WebKit motivated the implementation; not browser-exclusive. See MVP-ROTATION-SHIPPING.md.
// All 4 cardinals rasterized at identical portrait (0°) geometry; only the baked
// lighting compensation differs per angle (local = screenRef - objRot).
// Display: two aligned canvas layers on a shared stage. Settled state shows one
// layer; rotation animates stage rotate+scale (Chrome-matched phase order) while
// the incoming orientation crossfades in over the outgoing one — never a swap.
// Buffers are monochrome (lum+alpha) and all 4 are retained once baked so
// subsequent rotations are transform + opacity only.

(function () {
  'use strict'

  const CARDINAL_ANGLES = [0, 90, 180, 270]
  // Must match Chrome's live rotation phases in ArtworkRotation.js (do not change).
  const ROTATION_PHASE_MS = 520
  const SCALE_PHASE_MS = 260
  const ROTATION_WATCHDOG_MS = 10000
  const BUFFER_VISIBLE_MIN_FRACTION = 0.001
  const CANVAS_VISIBLE_MIN_HITS = 8
  // All 4 angles stay resident (monochrome lum+alpha = 2 bytes/px), so the
  // per-buffer pixel cap is derived from a total GA budget rather than sized
  // for a single angle. 32MB total → ~4M px per buffer, comfortably above the
  // on-screen footprint at DPR 2 while keeping Safari clear of memory reloads.
  const MAX_TOTAL_GA_BYTES = 32 * 1024 * 1024
  const GA_BYTES_PER_PIXEL = 2
  const MAX_PIXELS_PER_BUFFER = Math.floor(MAX_TOTAL_GA_BYTES / CARDINAL_ANGLES.length / GA_BYTES_PER_PIXEL)
  const MAX_BAKE_DPR = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3)
  const BAKE_YIELD_MS = 120
  const BAKE_FAST_MS = 500
  const BAKE_MODERATE_MS = 2000
  const OVERLAY_PAINT_FRAMES = 2

  let buffers = {}
  let baking = false
  let bakeToken = 0
  let overlayAnimating = false
  let overlayEl = null
  let overlayStage = null
  let layerCanvasA = null
  let layerCanvasB = null
  let baseLayer = null
  let scratchImageData = null
  let scratchImageDataSize = 0
  let imageDisplayActive = false
  let settledAngle = 0
  let settledScale = 1
  let layoutRectCache = null
  let lastFrameLayoutKey = null
  let activeRasterAbort = null
  let liveArtworkStyleSnapshot = null
  let sessionToken = 0
  let sessionRunning = false
  let sessionPromise = null
  let bakeQueue = []
  let rotationRequested = false
  let sessionStartPending = false
  let sessionBakeMode = 'idle' // 'pending' | 'background' | 'idle'
  let firstBakeMs = null
  let backgroundBakePolicy = null // 'all' | 'adjacent' | 'none'
  let overlayPaintWaited = false
  let pendingRetentionAngles = []
  let buffersScreenLightAngle = null
  let lastRequestedDirection = null

  function oneLikelyAdjacentForDirection(currentAngle, direction) {
    const c = normalizeAngle(currentAngle)
    if (direction === 1 || direction === -1) {
      const forward = normalizeAngle(c + direction * 90)
      if (!bufferIsDisplayable(buffers[forward])) return forward
      const backward = normalizeAngle(c - direction * 90)
      if (!bufferIsDisplayable(buffers[backward])) return backward
    }
    return oneAdjacentMissingAngle(c)
  }

  function isFastFirstRotationDeferAll() {
    const st = window.artworkRotationState
    return backgroundBakePolicy === 'all'
      && firstBakeMs !== null
      && !st?.cardinalRotatedThisSession
      && (st?.pendingDirection != null || rotationRequested)
  }

  function rotationAnglesReadyForRequest(fromAngle, toAngle) {
    const st = window.artworkRotationState
    const first = !st?.cardinalRotatedThisSession
    if (first && backgroundBakePolicy === 'all' && firstBakeMs !== null) {
      return isReadyForAngles(CARDINAL_ANGLES)
    }
    const needed = anglesRequiredForRotation(fromAngle, toAngle, first)
    return isReadyForAngles(needed)
  }

  function pendingRotationReadyToFulfill() {
    const st = window.artworkRotationState
    if (!st?.pendingDirection) return false
    const from = getCurrentArtworkAngle()
    const to = normalizeAngle(from + st.pendingDirection * 90)
    return rotationAnglesReadyForRequest(from, to)
  }

  function shouldShowPrepForDirection(direction) {
    const from = getCurrentArtworkAngle()
    const to = normalizeAngle(from + direction * 90)
    if (isFastFirstRotationDeferAll()) return !isReadyForAngles(CARDINAL_ANGLES)
    return !rotationAnglesReadyForRequest(from, to)
  }

  function ensurePrepOverlayForPendingBake() {
    if (!window.SafariCompat?.detectWebKitClass?.()) {
      if (!shouldShowPrepOverlayForPendingBake()) return
      window.RevealAnim?.showCardinalPrepOverlay?.()
      if (window.artworkRotationState) artworkRotationState.prepOverlayVisible = true
      return
    }
    const st = window.artworkRotationState
    if (!st?.pendingDirection && !rotationRequested) return
    if (pendingRotationReadyToFulfill()) return
    window.RevealAnim?.showCardinalPrepOverlay?.()
    st.prepOverlayVisible = true
  }

  function shouldShowPrepOverlayForPendingBake() {
    if (!window.SafariCompat?.detectWebKitClass?.()) return false
    const st = window.artworkRotationState
    if (!st?.pendingDirection && !rotationRequested) return false
    return !pendingRotationReadyToFulfill()
  }

  function expandBakeQueueAfterClassification() {
    if (backgroundBakePolicy === 'none') return
    const current = getCurrentArtworkAngle()
    if (backgroundBakePolicy === 'all') {
      sessionBakeMode = 'background'
      const missing = sortAnglesByBakePriority(missingAngles(CARDINAL_ANGLES), current)
      for (const a of missing) {
        if (!bakeQueue.includes(a)) bakeQueue.push(a)
      }
      return
    }
    if (backgroundBakePolicy === 'adjacent') {
      sessionBakeMode = 'background'
      const direction = window.artworkRotationState?.pendingDirection ?? lastRequestedDirection
      const adj = oneLikelyAdjacentForDirection(current, direction)
      if (adj !== null && !bakeQueue.includes(adj)) bakeQueue.push(adj)
    }
  }

  function maybeQueueOpportunisticAdjacentBake() {
    if (backgroundBakePolicy !== 'adjacent') return
    if (sessionBakeMode !== 'background') return
    if (rotationRequested || window.artworkRotationState?.pendingDirection) return
    const adj = oneLikelyAdjacentForDirection(getCurrentArtworkAngle(), lastRequestedDirection)
    if (adj !== null && !bakeQueue.includes(adj)) bakeQueue.push(adj)
  }

  function onFirstBakeClassified() {
    expandBakeQueueAfterClassification()
    if (!shouldShowPrepOverlayForPendingBake()) return
    if (backgroundBakePolicy === 'all') {
      window.RevealAnim?.refreshCardinalPrepOverlayText?.({ crossfade: true })
    }
    ensurePrepOverlayForPendingBake()
  }

  function noteBuffersLightReference() {
    if (typeof readCardinalBakeScreenLightAngle === 'function') {
      buffersScreenLightAngle = normalizeDegree(readCardinalBakeScreenLightAngle())
    }
  }

  function maybeNoteBuffersLightReferenceWhenReady() {
    if (isReadyForAngles(CARDINAL_ANGLES)) noteBuffersLightReference()
  }

  function buffersStaleDueToLightChange() {
    if (buffersScreenLightAngle === null) return false
    if (!isReadyForAngles(CARDINAL_ANGLES)) return false
    const current = typeof readEffectiveScreenLightAngle === 'function'
      ? readEffectiveScreenLightAngle()
      : (typeof readCardinalBakeScreenLightAngle === 'function'
        ? readCardinalBakeScreenLightAngle()
        : null)
    if (current == null) return false
    return normalizeDegree(current) !== normalizeDegree(buffersScreenLightAngle)
  }

  function invalidateCardinalBuffersIfLightChanged() {
    if (!buffersStaleDueToLightChange()) return false
    invalidateCardinalBuffers()
    return true
  }

  function getLiveArtworkTargets() {
    const bg = typeof BG !== 'undefined' ? BG?.elt : null
    const viewport = document.getElementById('artwork-rotation-viewport')
    const bleed = FRAME?.bleed?.elt
    const seen = new Set()
    return [bg, viewport, bleed].filter(el => {
      if (!el || seen.has(el)) return false
      seen.add(el)
      return true
    })
  }

  function snapshotLiveArtworkStyles() {
    return getLiveArtworkTargets().map(el => ({
      el,
      visibility: el.style.visibility,
      pointerEvents: el.style.pointerEvents,
      opacity: el.style.opacity,
      display: el.style.display,
    }))
  }

  function restoreLiveArtworkStyles() {
    if (!liveArtworkStyleSnapshot) return
    liveArtworkStyleSnapshot.forEach(({ el, visibility, pointerEvents, opacity, display }) => {
      el.style.visibility = visibility
      el.style.pointerEvents = pointerEvents
      el.style.opacity = opacity
      el.style.display = display
    })
    liveArtworkStyleSnapshot = null
  }

  function isCardinalBitmapClient() {
    if (window.SafariCompat?.detectWebKitClass?.()) {
      return window.SafariCompat?.capabilities?.rotation === 'cardinal'
    }
    const mode = window.chromeRotationMode ?? window.SafariCompat?.capabilities?.rotation
    return mode === 'cardinal'
  }

  function isRotationInteractionActive() {
    return typeof artworkRotationState !== 'undefined' && !!artworkRotationState.animating
  }

  function detachRasterImage(img) {
    if (!img) return
    img.onload = null
    img.onerror = null
    // Never assign img.src = '' — Chrome resolves it to the document URL and loads
    // favicon.ico, which can re-fire onload and rasterize a tiny corrupt buffer.
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }

  function cancelActiveRaster() {
    if (activeRasterAbort) {
      activeRasterAbort.aborted = true
      detachRasterImage(activeRasterAbort.img)
      activeRasterAbort = null
    }
  }

  function yieldToMain(ms = BAKE_YIELD_MS) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function waitForOverlayPaint(frames = OVERLAY_PAINT_FRAMES) {
    return new Promise(resolve => {
      let count = 0
      const tick = () => {
        count++
        if (count >= frames) resolve()
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }

  function recordFirstBakeMs(ms) {
    if (firstBakeMs !== null) return
    firstBakeMs = ms
    if (ms < BAKE_FAST_MS) backgroundBakePolicy = 'all'
    else if (ms < BAKE_MODERATE_MS) backgroundBakePolicy = 'adjacent'
    else backgroundBakePolicy = 'none'
    if (typeof DeBug !== 'undefined' && DeBug.log) {
      DeBug.log('[CardinalBuffers] first bake', `${Math.round(ms)}ms`, 'policy', backgroundBakePolicy)
    }
    onFirstBakeClassified()
  }

  function resetBakeClassifier() {
    firstBakeMs = null
    backgroundBakePolicy = null
    sessionBakeMode = 'idle'
    overlayPaintWaited = false
    pendingRetentionAngles = []
    lastRequestedDirection = null
  }

  function getCurrentArtworkAngle() {
    if (typeof artworkRotationState !== 'undefined' && Number.isFinite(artworkRotationState.angle)) {
      return normalizeAngle(artworkRotationState.angle)
    }
    return 0
  }

  function cardinalBakePriority(currentAngle) {
    const base = normalizeAngle(currentAngle)
    return [
      base,
      normalizeAngle(base + 90),
      normalizeAngle(base - 90),
      normalizeAngle(base + 180),
    ]
  }

  function sortAnglesByBakePriority(angles, currentAngle) {
    const priority = cardinalBakePriority(currentAngle)
    const rank = (a) => {
      const i = priority.indexOf(normalizeAngle(a))
      return i === -1 ? priority.length : i
    }
    return [...new Set((angles || []).map(normalizeAngle))].sort((a, b) => rank(a) - rank(b))
  }

  function otherLayer() {
    if (!layerCanvasA || !layerCanvasB) return null
    return baseLayer === layerCanvasA ? layerCanvasB : layerCanvasA
  }

  function getDisplayCanvas() {
    ensureOverlay()
    return baseLayer
  }

  function clearLayerCanvases() {
    for (const canvas of [layerCanvasA, layerCanvasB]) {
      if (!canvas) continue
      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvas._gaKey = null
    }
  }

  function isReadyForAngles(angles) {
    purgeInvalidBuffers()
    const list = (angles?.length ? angles : CARDINAL_ANGLES).map(normalizeAngle)
    return list.every(a => bufferIsDisplayable(buffers[a]))
  }

  function missingAngles(angles) {
    return (angles?.length ? angles : CARDINAL_ANGLES)
      .map(normalizeAngle)
      .filter(a => !bufferIsDisplayable(buffers[a]))
  }

  function anglesRequiredForRotation(fromAngle, toAngle, firstRotation) {
    const from = normalizeAngle(fromAngle)
    const to = normalizeAngle(toAngle)
    // Chrome opt-in: all four cardinals batch-baked; crossfade always needs both.
    if (!window.SafariCompat?.detectWebKitClass?.() && window.chromeRotationMode === 'cardinal') {
      return [from, to]
    }
    if (firstRotation && !bufferIsDisplayable(buffers[from])) return [to]
    if (!bufferIsDisplayable(buffers[from])) return [from, to]
    return [to]
  }

  function normalizeAngle(angle) {
    const n = Number(angle)
    if (!Number.isFinite(n)) return 0
    return ((Math.round(n / 90) * 90) % 360 + 360) % 360
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

  function bufferCoversArtworkExtent(buffer, minSpanFraction = 0.12) {
    if (!bufferIsValid(buffer)) return false
    const { width, height, alpha } = buffer
    const minAlpha = 16
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    const stride = Math.max(1, Math.floor(Math.max(width, height) / 64))
    for (let y = 0; y < height; y += stride) {
      for (let x = 0; x < width; x += stride) {
        if (alpha[y * width + x] >= minAlpha) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < minX || maxY < minY) return false
    const spanW = (maxX - minX + stride) / width
    const spanH = (maxY - minY + stride) / height
    return spanW >= minSpanFraction && spanH >= minSpanFraction
  }

  function bufferIsDisplayable(buffer) {
    return bufferIsValid(buffer)
      && bufferHasSubstantialPixels(buffer)
      && bufferCoversArtworkExtent(buffer)
  }

  function bufferHasSubstantialPixels(buffer, minAlpha = 16) {
    if (!bufferIsValid(buffer)) return false
    const { alpha } = buffer
    const stride = Math.max(1, Math.floor(alpha.length / 8192))
    let visible = 0
    let samples = 0
    for (let i = 0; i < alpha.length; i += stride) {
      samples++
      if (alpha[i] >= minAlpha) visible++
    }
    return samples > 0 && (visible / samples) >= BUFFER_VISIBLE_MIN_FRACTION
  }

  function canvasHasVisiblePixels(canvas, minAlpha = 12, minHits = CANVAS_VISIBLE_MIN_HITS) {
    if (!canvas || canvas.width < 1 || canvas.height < 1) return false
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false
    const { width, height } = canvas
    const cx = width * 0.5
    const cy = height * 0.5
    let hits = 0
    const samples = []
    // Pill artwork sits near center — bias samples inward, not uniform grid.
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2
      const r = Math.min(width, height) * (0.04 + (i % 10) * 0.035)
      samples.push([
        Math.max(0, Math.min(width - 1, Math.floor(cx + Math.cos(t) * r))),
        Math.max(0, Math.min(height - 1, Math.floor(cy + Math.sin(t) * r))),
      ])
    }
    for (let i = 0; i < 24; i++) {
      samples.push([
        Math.floor((i * 17 + 3) % width),
        Math.floor((i * 31 + 7) % height),
      ])
    }
    for (const [x, y] of samples) {
      if (ctx.getImageData(x, y, 1, 1).data[3] >= minAlpha) hits++
    }
    return hits >= minHits
  }

  function isLiveArtworkHidden() {
    const bg = typeof BG !== 'undefined' ? BG?.elt : null
    const bleed = FRAME?.bleed?.elt
    const targets = [bg, bleed].filter(Boolean)
    if (targets.length === 0) return false
    return targets.every(el => el.style.display === 'none'
      || el.style.visibility === 'hidden'
      || el.style.opacity === '0')
  }

  function isBitmapDisplayBroken() {
    if (!imageDisplayActive || !isLiveArtworkHidden()) return false
    if (!overlayEl || overlayEl.style.display !== 'block') return true
    return !canvasHasVisiblePixels(getDisplayCanvas())
  }

  function recoverToLiveArtwork(reason = 'manual') {
    if (typeof DeBug !== 'undefined' && DeBug.warn) {
      DeBug.warn('[CardinalBuffers] recoverToLiveArtwork', reason)
    }
    disableImageDisplay()
    return true
  }

  function releaseBuffers() {
    for (const angle of Object.keys(buffers)) {
      const entry = buffers[angle]
      if (!entry) continue
      entry.lum = null
      entry.alpha = null
    }
    buffers = {}
    scratchImageData = null
    scratchImageDataSize = 0
    clearLayerCanvases()
  }

  function invalidateCardinalBuffers() {
    stopCardinalSession()
    resetCardinalSessionUserState()
    cancelActiveRaster()
    releaseBuffers()
    disableImageDisplay()
    buffersScreenLightAngle = null
  }

  function resetCardinalSessionUserState() {
    rotationRequested = false
    bakeQueue = []
    resetBakeClassifier()
    if (window.artworkRotationState) {
      artworkRotationState.pendingDirection = null
      artworkRotationState.cardinalRotatedThisSession = false
      artworkRotationState.prepOverlayVisible = false
    }
    window.RevealAnim?.hideCardinalPrepOverlay?.()
  }

  function rebuildPendingBakeQueue(seedDirection) {
    const current = getCurrentArtworkAngle()
    const st = window.artworkRotationState
    const pending = seedDirection ?? st?.pendingDirection ?? null
    if (!pending) {
      bakeQueue = []
      return
    }
    const target = normalizeAngle(current + pending * 90)
    bakeQueue = bufferIsDisplayable(buffers[target]) ? [] : [target]
  }

  function oneAdjacentMissingAngle(currentAngle) {
    const c = normalizeAngle(currentAngle)
    for (const delta of [90, -90]) {
      const a = normalizeAngle(c + delta)
      if (!bufferIsDisplayable(buffers[a])) return a
    }
    return null
  }

  function rebuildBackgroundBakeQueue({ retentionAngles = pendingRetentionAngles } = {}) {
    const current = getCurrentArtworkAngle()
    const priority = []
    const retention = (retentionAngles || []).map(normalizeAngle)
    pendingRetentionAngles = retention.filter(a => !bufferIsDisplayable(buffers[a]))
    for (const a of pendingRetentionAngles) {
      if (!priority.includes(a)) priority.push(a)
    }
    if (firstBakeMs !== null && backgroundBakePolicy === 'all') {
      for (const a of cardinalBakePriority(current)) {
        if (!bufferIsDisplayable(buffers[a]) && !priority.includes(a)) priority.push(a)
      }
    } else if (firstBakeMs !== null && backgroundBakePolicy === 'adjacent') {
      const direction = window.artworkRotationState?.pendingDirection ?? lastRequestedDirection
      const adj = oneLikelyAdjacentForDirection(current, direction)
      if (adj !== null && !priority.includes(adj)) priority.push(adj)
    }
    bakeQueue = priority
  }

  function prioritizeAngles(angles) {
    sessionBakeMode = 'pending'
    bakeQueue = (angles || []).map(normalizeAngle).filter(a => !bufferIsDisplayable(buffers[a]))
  }

  function popNextBakeAngle() {
    while (bakeQueue.length > 0) {
      const next = bakeQueue.shift()
      if (!bufferIsDisplayable(buffers[next])) return next
    }
    return null
  }

  function canFulfillPendingRotation() {
    const st = window.artworkRotationState
    if (!st?.pendingDirection) return false
    if (st.animating || st.cardinalBusy || overlayAnimating) return false
    return pendingRotationReadyToFulfill()
  }

  async function tryFulfillPendingRotation() {
    if (!canFulfillPendingRotation()) return false
    const st = window.artworkRotationState
    const direction = st.pendingDirection
    st.pendingDirection = null
    rotationRequested = false
    // Do not clear bakeQueue here — fulfill → enqueueRemainingCardinals may
    // immediately queue retention of the angle we are leaving.
    if (typeof window.fulfillPendingCardinalRotation === 'function') {
      await window.fulfillPendingCardinalRotation(direction)
    }
    return true
  }

  async function runCardinalSession(token) {
    sessionRunning = true
    try {
      while (token === sessionToken) {
        if (!isCardinalBitmapClient()) break
        if (typeof window.isLightAnimationActive === 'function' && window.isLightAnimationActive()) break

        try {
          await waitForRotationIdle(token)
        } catch (_err) {
          break
        }
        if (token !== sessionToken) break

        if (rotationRequested && !overlayPaintWaited) {
          overlayPaintWaited = true
          await waitForOverlayPaint()
        }
        if (token !== sessionToken) break

        const next = popNextBakeAngle()
        if (next === null) {
          if (await tryFulfillPendingRotation()) continue
          await new Promise(resolve => setTimeout(resolve, 150))
          continue
        }

        ensurePrepOverlayForPendingBake()
        if (token !== sessionToken) break

        const bakeGen = ++bakeToken
        baking = true
        if (!imageDisplayActive) setLiveArtworkDisplayed(true)
        let inProgress = next
        const bakeStartMs = performance.now()
        try {
          if (token !== sessionToken || bakeGen !== bakeToken) throw new Error('bake cancelled')
          buffers[next] = await bakeAngle(next, bakeGen)
          inProgress = null
          recordFirstBakeMs(performance.now() - bakeStartMs)
          maybeNoteBuffersLightReferenceWhenReady()
        } catch (err) {
          if (bakeGen === bakeToken && inProgress !== null) {
            delete buffers[inProgress]
          }
          if (typeof DeBug !== 'undefined' && DeBug.warn) {
            DeBug.warn('[CardinalBuffers] session bake failed', err)
          }
        } finally {
          if (bakeGen === bakeToken) baking = false
        }

        if (token !== sessionToken) break
        await yieldToMain()
        const fulfilled = await tryFulfillPendingRotation()
        if (!fulfilled) maybeQueueOpportunisticAdjacentBake()
      }
    } finally {
      sessionRunning = false
      sessionPromise = null
    }
  }

  function startCardinalSession({ seedDirection, mode, retentionAngles } = {}) {
    // Lazy kickoff: registerPendingRotation (first arrow) or enqueueRemainingCardinals.
    if (!isCardinalBitmapClient()) return
    if (typeof window.isLightAnimationActive === 'function' && window.isLightAnimationActive()) return

    if (mode) sessionBakeMode = mode
    if (retentionAngles) {
      pendingRetentionAngles = retentionAngles.map(normalizeAngle)
        .filter(a => !bufferIsDisplayable(buffers[a]))
    }

    if (sessionRunning) {
      if (sessionBakeMode === 'pending') rebuildPendingBakeQueue(seedDirection)
      else if (sessionBakeMode === 'background') {
        rebuildBackgroundBakeQueue({ retentionAngles: pendingRetentionAngles })
      }
      return
    }
    if (sessionStartPending) return

    sessionStartPending = true
    const token = sessionToken
    const seed = seedDirection
    const retentionSnapshot = [...pendingRetentionAngles]

    requestAnimationFrame(() => {
      sessionStartPending = false
      if (token !== sessionToken) return
      if (typeof window.isLightAnimationActive === 'function' && window.isLightAnimationActive()) return

      if (sessionBakeMode === 'pending') rebuildPendingBakeQueue(seed)
      else if (sessionBakeMode === 'background') {
        rebuildBackgroundBakeQueue({ retentionAngles: retentionSnapshot })
      }

      if (!sessionRunning && bakeQueue.length > 0) {
        sessionPromise = runCardinalSession(token)
      }
    })
  }

  function stopCardinalSession() {
    sessionToken++
    bakeToken++
    cancelActiveRaster()
    baking = false
    sessionStartPending = false
    bakeQueue = []
    rotationRequested = false
    overlayPaintWaited = false
  }

  function registerPendingRotation(direction) {
    if (!window.artworkRotationState) return
    lastRequestedDirection = direction
    artworkRotationState.pendingDirection = direction
    rotationRequested = true
    sessionBakeMode = 'pending'
    overlayPaintWaited = false
    const from = getCurrentArtworkAngle()
    const to = normalizeAngle(from + direction * 90)
    const needed = anglesRequiredForRotation(from, to, !artworkRotationState.cardinalRotatedThisSession)
    prioritizeAngles(needed)
    ensurePrepOverlayForPendingBake()
    if (!sessionRunning && !sessionStartPending) {
      startCardinalSession({ seedDirection: direction, mode: 'pending' })
    } else {
      rebuildPendingBakeQueue(direction)
      ensurePrepOverlayForPendingBake()
    }
  }

  function enqueueRemainingCardinals(fromAngle) {
    sessionBakeMode = 'background'
    const retention = fromAngle != null ? [normalizeAngle(fromAngle)] : []
    pendingRetentionAngles = retention.filter(a => !bufferIsDisplayable(buffers[a]))
    rebuildBackgroundBakeQueue({ retentionAngles: pendingRetentionAngles })
    if (bakeQueue.length === 0) return
    startCardinalSession({ mode: 'background', retentionAngles: pendingRetentionAngles })
  }

  function isRotationRequested() {
    return rotationRequested
  }

  function setLiveArtworkDisplayed(visible) {
    if (visible) {
      restoreLiveArtworkStyles()
      return
    }
    if (!liveArtworkStyleSnapshot) {
      liveArtworkStyleSnapshot = snapshotLiveArtworkStyles()
    }
    getLiveArtworkTargets().forEach(el => {
      el.style.visibility = 'hidden'
      el.style.pointerEvents = 'none'
      el.style.opacity = '0'
      // Hide the entire #BG subtree — WebKit can still composite filtered SVG
      // from display:none descendants when the parent #BG remains opacity:1.
      el.style.display = 'none'
    })
  }

  function disableImageDisplay() {
    const wasActive = imageDisplayActive
    imageDisplayActive = false
    layoutRectCache = null
    hideOverlay()
    setLiveArtworkDisplayed(true)
    // Live SVG may still carry a stale orientation/lighting from before bitmap
    // mode — resync so Escape recovery shows the current rotation state.
    if (wasActive && typeof window.syncArtworkRotationToViewport === 'function') {
      window.syncArtworkRotationToViewport()
    }
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

  function setLayerVisibility(visibleCanvas, hiddenCanvas) {
    if (visibleCanvas) {
      visibleCanvas.style.opacity = '1'
      visibleCanvas.style.zIndex = '2'
    }
    if (hiddenCanvas) {
      hiddenCanvas.style.opacity = '0'
      hiddenCanvas.style.zIndex = '1'
    }
  }

  function showSettledAngle(angle, scale) {
    if (!isCardinalBitmapClient()) return false
    const norm = normalizeAngle(angle)
    const buffer = buffers[norm]
    if (!bufferIsDisplayable(buffer)) return false

    ensureOverlay()
    syncStageSize()
    if (!layoutRectCache) cacheLayoutRect()
    // Reuse whichever layer already holds this orientation to skip the blit.
    const alt = otherLayer()
    if (alt && alt._gaKey === norm && baseLayer._gaKey !== norm) baseLayer = alt
    blitGAToCanvasIfNeeded(buffer, baseLayer)
    setLayerVisibility(baseLayer, otherLayer())
    applyStageTransform(angle, scale)
    positionOverlay(layoutRectCache || getDisplayRect())
    overlayEl.style.display = 'block'

    imageDisplayActive = true
    settledAngle = angle
    settledScale = scale
    setLiveArtworkDisplayed(false)
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
    if (!imageDisplayActive) return
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
    const backing = typeof artworkRotationState !== 'undefined'
      ? (artworkRotationState.backingScale || 1)
      : Math.max(1, s)
    return s / (backing > 0 ? backing : 1)
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

  async function rasterizeToGA(svgMarkup, width, height, token) {
    if (token !== bakeToken) throw new Error('bake cancelled')

    let markup = svgMarkup
    let host = null
    if (window.SafariCompat?.detectWebKitClass?.()) {
      host = document.createElement('div')
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
        markup = new XMLSerializer().serializeToString(svg)
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (token !== bakeToken) throw new Error('bake cancelled')
    }

    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    let settled = false

    try {
      const imageData = await new Promise((resolve, reject) => {
        const img = new Image()
        const finish = (err, data) => {
          if (settled) return
          settled = true
          img.onload = null
          img.onerror = null
          if (err) reject(err)
          else resolve(data)
        }
        img.onload = () => {
          if (token !== bakeToken) {
            finish(new Error('bake cancelled'))
            return
          }
          try {
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            ctx.drawImage(img, 0, 0, width, height)
            const data = ctx.getImageData(0, 0, width, height)
            canvas.width = 1
            canvas.height = 1
            finish(null, data)
          } catch (err) {
            finish(err)
          }
        }
        img.onerror = () => finish(new Error('SVG raster failed'))
        img.src = url
      })
      return extractGAFromImageData(imageData.data, width, height)
    } finally {
      settled = true
      URL.revokeObjectURL(url)
      host?.remove()
    }
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
    // All buffers share portrait geometry — the stage transform handles rotation.
    if (frameSize) {
      canvas.style.width = `${frameSize.x}px`
      canvas.style.height = `${frameSize.y}px`
    }
    canvas._gaKey = normalizeAngle(buffer.angle ?? 0)
  }

  function blitGAToCanvasIfNeeded(buffer, canvas) {
    if (!bufferIsValid(buffer) || !canvas) return
    const key = normalizeAngle(buffer.angle ?? 0)
    if (canvas._gaKey === key
      && canvas.width === buffer.width
      && canvas.height === buffer.height) return
    blitGAToCanvas(buffer, canvas)
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
    // The live SVG carries display:none/visibility:hidden/opacity:0 inline while
    // bitmap mode is active — a clone with those styles rasterizes empty.
    clone.style.removeProperty('display')
    clone.style.removeProperty('visibility')
    clone.style.removeProperty('opacity')
  }

  function applyCloneCardinalLight(clone, cardinalAngle, liveRoot) {
    if (typeof applyCompensatedLightToSVGElement === 'function') {
      applyCompensatedLightToSVGElement(clone, cardinalAngle, liveRoot)
    }
  }

  // Portrait geometry for every cardinal; only the baked lighting differs.
  // The CSS stage rotate supplies the visual orientation, and the compensated
  // light (screenRef - objRot) cancels it so screen-space light stays constant.
  function createCardinalBakeMarkup(svgElement, width, height, cardinalAngle) {
    const clone = svgElement.cloneNode(true)
    stripBakeStyles(clone)
    applyCloneCardinalLight(clone, cardinalAngle, svgElement)

    const srcW = parseFloat(svgElement.getAttribute('width'))
    const srcH = parseFloat(svgElement.getAttribute('height'))
    if (!clone.getAttribute('viewBox') && Number.isFinite(srcW) && Number.isFinite(srcH) && srcW > 0 && srcH > 0) {
      clone.setAttribute('viewBox', `0 0 ${srcW} ${srcH}`)
    }

    clone.setAttribute('width', `${width}`)
    clone.setAttribute('height', `${height}`)
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    return Export.createSVGMarkup(clone)
  }

  //FUNC: cardinalRasterSize() : { width, height, ... } | null
  // Portrait base (frameSize × backingScale × DPR), capped per-buffer.
  function cardinalRasterSize() {
    const cssW = frameSize?.x
    const cssH = frameSize?.y
    if (!cssW || !cssH || cssW <= 0 || cssH <= 0) return null

    const dpr = MAX_BAKE_DPR
    const backingScale = typeof artworkRotationState !== 'undefined'
      ? (artworkRotationState.backingScale || 1)
      : 1

    let width = Math.max(1, Math.round(cssW * backingScale * dpr))
    let height = Math.max(1, Math.round(cssH * backingScale * dpr))

    if (width * height > MAX_PIXELS_PER_BUFFER) {
      const scale = Math.sqrt(MAX_PIXELS_PER_BUFFER / (width * height))
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))
    }

    return {
      width,
      height,
      pixels: width * height,
      maxPixelsPerBuffer: MAX_PIXELS_PER_BUFFER,
      cappedDpr: dpr,
      backingScale,
    }
  }

  async function bakeAngle(angle, token) {
    if (token !== bakeToken) throw new Error('bake cancelled')
    if (!FRAME?.bleed?.elt || !frameSize) throw new Error('no artwork')

    const normalized = normalizeAngle(angle)
    const raster = cardinalRasterSize()
    if (!raster) throw new Error('invalid cardinal raster size')

    // Lighting is applied on the cloned SVG only — never mutate live filters during
    // background bake (avoids visible 0°→90°→180°→270° jumps on screen).
    const svgMarkup = createCardinalBakeMarkup(
      FRAME.bleed.elt,
      raster.width,
      raster.height,
      normalized,
    )
    if (token !== bakeToken) throw new Error('bake cancelled')
    if (typeof DeBug !== 'undefined' && DeBug.log) {
      DeBug.log(`[CardinalBuffers] baking light@${normalized}°`, `${raster.width}x${raster.height}`, {
        pixels: raster.pixels,
        maxPixelsPerBuffer: raster.maxPixelsPerBuffer,
        cappedDpr: raster.cappedDpr,
        backingScale: raster.backingScale,
      })
    }
    const ga = await rasterizeToGA(svgMarkup, raster.width, raster.height, token)
    if (token !== bakeToken) throw new Error('bake cancelled')
    if (!bufferHasSubstantialPixels(ga) || !bufferCoversArtworkExtent(ga)) {
      throw new Error(`cardinal raster empty at ${normalized}°`)
    }
    return { ...ga, angle: normalized }
  }

  // Background bake must never read the live SVG mid-rotation (the element's
  // width/height attributes and transform are being mutated). Wait for idle.
  function waitForRotationIdle(token, { useSessionToken = true } = {}) {
    return new Promise((resolve, reject) => {
      const check = () => {
        const cancelled = useSessionToken ? token !== sessionToken : token !== bakeToken
        if (cancelled) {
          reject(new Error(useSessionToken ? 'session cancelled' : 'bake cancelled'))
          return
        }
        const st = window.artworkRotationState
        const busy = st && (st.animating || st.cardinalBusy)
        if (!busy && !overlayAnimating) {
          resolve()
          return
        }
        requestAnimationFrame(check)
      }
      check()
    })
  }

  function getArtworkScreenRect() {
    return getDisplayRect()
  }

  function ensureOverlay() {
    const stale = document.getElementById('safari-cardinal-rotation-overlay')
    if (overlayEl && overlayStage && layerCanvasA && layerCanvasB) {
      if (!stale || stale === overlayEl) return overlayEl
    }
    if (stale) stale.remove()
    overlayEl = null
    overlayStage = null
    layerCanvasA = null
    layerCanvasB = null
    baseLayer = null

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

    layerCanvasA = document.createElement('canvas')
    layerCanvasA.id = 'safari-cardinal-display-canvas'
    layerCanvasA.style.cssText = `${canvasStyle};opacity:1;z-index:2`

    layerCanvasB = document.createElement('canvas')
    layerCanvasB.id = 'safari-cardinal-display-canvas-b'
    layerCanvasB.style.cssText = `${canvasStyle};opacity:0;z-index:1`

    baseLayer = layerCanvasA
    overlayStage.appendChild(layerCanvasA)
    overlayStage.appendChild(layerCanvasB)
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
    clearLayerCanvases()
  }

  function animateStagePhase({
    fromAngle,
    toAngle,
    fromScale,
    toScale,
    durationMs,
    fadeInCanvas = null,
  }) {
    return new Promise(resolve => {
      const startMs = performance.now()
      const step = now => {
        const rawT = durationMs <= 0 ? 1 : Math.min(1, (now - startMs) / durationMs)
        const t = easeInOutCubic(rawT)
        const angle = lerp(fromAngle, toAngle, t)
        const scale = lerp(fromScale, toScale, t)
        applyStageTransform(angle, scale)
        if (fadeInCanvas) fadeInCanvas.style.opacity = `${t}`
        if (rawT < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    })
  }

  // Two aligned layers on a shared stage: the outgoing orientation stays under
  // the incoming one, which crossfades in during the rotate phase. Phase order
  // and durations match Chrome's rotateArtworkByLive (shrinkFirst logic).
  function animateCardinalRotation({
    fromAngle,
    toAngle,
    startScale,
    targetScale,
  }) {
    if (!isCardinalBitmapClient()) return Promise.resolve(false)
    const fromNorm = normalizeAngle(fromAngle)
    const toNorm = normalizeAngle(toAngle)
    const fromBuffer = buffers[fromNorm]
    const toBuffer = buffers[toNorm]
    const fromReady = bufferIsDisplayable(fromBuffer)
    const toReady = bufferIsDisplayable(toBuffer)
    if (!toReady) return Promise.resolve(false)

    const st = window.artworkRotationState
    const liveOutgoing = !fromReady && !imageDisplayActive
      && st && !st.cardinalRotatedThisSession
    if (!fromReady && !liveOutgoing) return Promise.resolve(false)

    const shrinkFirst = targetScale < startScale

    overlayAnimating = true
    ensureOverlay()
    syncStageSize()

    // First rotation: only target buffer exists. Hide live SVG first, then
    // stage-rotate the portrait-baked target from fromAngle→toAngle. Never
    // fade a black-backed canvas over the still-visible live artwork.
    if (liveOutgoing) {
      const incoming = baseLayer || otherLayer()
      blitGAToCanvasIfNeeded(toBuffer, incoming)
      incoming.style.opacity = '1'
      incoming.style.zIndex = '2'
      baseLayer = incoming
      const alt = otherLayer()
      if (alt) {
        alt.style.opacity = '0'
        alt.style.zIndex = '1'
      }

      setLiveArtworkDisplayed(false)
      imageDisplayActive = true
      applyStageTransform(fromAngle, startScale)
      positionOverlay(layoutRectCache || getDisplayRect())
      overlayEl.style.display = 'block'
      overlayStage.style.willChange = 'transform'

      let watchdogId = null
      const finishLive = (success) => {
        if (watchdogId != null) clearTimeout(watchdogId)
        overlayAnimating = false
        overlayStage.style.willChange = 'auto'
        if (success) {
          baseLayer = incoming
          if (!showSettledAngle(toAngle, targetScale)) {
            recoverToLiveArtwork('live-first rotation — settled frame invalid')
          }
          return
        }
        hideOverlay()
        setLiveArtworkDisplayed(true)
      }

      watchdogId = setTimeout(() => {
        if (!overlayAnimating) return
        finishLive(false)
        recoverToLiveArtwork('live-first rotation watchdog')
      }, ROTATION_WATCHDOG_MS)

      return (async () => {
        try {
          if (shrinkFirst) {
            await animateStagePhase({
              fromAngle,
              toAngle: fromAngle,
              fromScale: startScale,
              toScale: targetScale,
              durationMs: SCALE_PHASE_MS,
            })
            await animateStagePhase({
              fromAngle,
              toAngle,
              fromScale: targetScale,
              toScale: targetScale,
              durationMs: ROTATION_PHASE_MS,
            })
          } else {
            await animateStagePhase({
              fromAngle,
              toAngle,
              fromScale: startScale,
              toScale: startScale,
              durationMs: ROTATION_PHASE_MS,
            })
            await animateStagePhase({
              fromAngle: toAngle,
              toAngle,
              fromScale: startScale,
              toScale: targetScale,
              durationMs: SCALE_PHASE_MS,
            })
          }
          finishLive(true)
          return true
        } catch (err) {
          finishLive(false)
          throw err
        }
      })()
    }

    let outgoing = baseLayer
    let incoming = otherLayer()
    if (incoming._gaKey === fromNorm && outgoing._gaKey !== fromNorm) {
      const tmp = outgoing
      outgoing = incoming
      incoming = tmp
    }
    blitGAToCanvasIfNeeded(fromBuffer, outgoing)
    blitGAToCanvasIfNeeded(toBuffer, incoming)
    outgoing.style.opacity = '1'
    outgoing.style.zIndex = '1'
    incoming.style.opacity = '0'
    incoming.style.zIndex = '2'
    baseLayer = outgoing

    applyStageTransform(fromAngle, startScale)
    positionOverlay(layoutRectCache || getDisplayRect())
    overlayEl.style.display = 'block'
    setLiveArtworkDisplayed(false)
    imageDisplayActive = true
    overlayStage.style.willChange = 'transform'

    let watchdogId = null
    const finish = (success) => {
      if (watchdogId != null) clearTimeout(watchdogId)
      overlayAnimating = false
      overlayStage.style.willChange = 'auto'
      if (success) {
        baseLayer = incoming
        if (!showSettledAngle(toAngle, targetScale)) {
          recoverToLiveArtwork('animation complete — settled frame invalid')
        }
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

    watchdogId = setTimeout(() => {
      if (!overlayAnimating) return
      if (typeof DeBug !== 'undefined' && DeBug.warn) {
        DeBug.warn('[CardinalBuffers] rotation watchdog')
      }
      finish(false)
      recoverToLiveArtwork('rotation watchdog')
    }, ROTATION_WATCHDOG_MS)

    return (async () => {
      try {
        if (shrinkFirst) {
          await animateStagePhase({
            fromAngle,
            toAngle: fromAngle,
            fromScale: startScale,
            toScale: targetScale,
            durationMs: SCALE_PHASE_MS,
          })
          await animateStagePhase({
            fromAngle,
            toAngle,
            fromScale: targetScale,
            toScale: targetScale,
            durationMs: ROTATION_PHASE_MS,
            fadeInCanvas: incoming,
          })
        } else {
          await animateStagePhase({
            fromAngle,
            toAngle,
            fromScale: startScale,
            toScale: startScale,
            durationMs: ROTATION_PHASE_MS,
            fadeInCanvas: incoming,
          })
          await animateStagePhase({
            fromAngle: toAngle,
            toAngle,
            fromScale: startScale,
            toScale: targetScale,
            durationMs: SCALE_PHASE_MS,
          })
        }
        incoming.style.opacity = '1'
        finish(true)
        return true
      } catch (err) {
        finish(false)
        throw err
      }
    })()
  }

  function purgeInvalidBuffers() {
    for (const angle of Object.keys(buffers)) {
      if (!bufferIsDisplayable(buffers[angle])) {
        const entry = buffers[angle]
        if (entry) {
          entry.lum = null
          entry.alpha = null
        }
        delete buffers[angle]
      }
    }
  }

  let chromeBatchBakePromise = null

  async function bakeAllCardinalsBatch() {
    if (!isCardinalBitmapClient()) return false
    if (isReady()) return true
    if (chromeBatchBakePromise) return chromeBatchBakePromise

    stopCardinalSession()
    ensureCardinalScreenLightAngleForBake()

    chromeBatchBakePromise = (async () => {
      const angles = sortAnglesByBakePriority(
        missingAngles(CARDINAL_ANGLES),
        getCurrentArtworkAngle(),
      )
      if (angles.length === 0) return isReady()

      const token = ++bakeToken
      baking = true
      if (!imageDisplayActive) setLiveArtworkDisplayed(true)
      try {
        for (const angle of angles) {
          if (token !== bakeToken) throw new Error('batch bake cancelled')
          await waitForRotationIdle(token, { useSessionToken: false })
          buffers[angle] = await bakeAngle(angle, token)
          await yieldToMain()
        }
        maybeNoteBuffersLightReferenceWhenReady()
        return isReady()
      } catch (err) {
        if (typeof DeBug !== 'undefined' && DeBug.warn) {
          DeBug.warn('[CardinalBuffers] batch bake failed', err)
        }
        return false
      } finally {
        if (token === bakeToken) baking = false
        chromeBatchBakePromise = null
      }
    })()

    return chromeBatchBakePromise
  }

  function ensureCardinalScreenLightAngleForBake() {
    if (typeof window.ensureCardinalScreenLightAngle === 'function') {
      window.ensureCardinalScreenLightAngle()
    }
  }

  function isChromeBatchBaking() {
    return !!chromeBatchBakePromise || baking
  }

  function noteFrameLayoutChange() {
    const raster = cardinalRasterSize()
    const key = raster ? `${raster.width}x${raster.height}` : null
    if (key && lastFrameLayoutKey && lastFrameLayoutKey !== key) {
      invalidateCardinalBuffers()
    }
    lastFrameLayoutKey = key
  }

  function installCardinalLifecycleHooks() {
    if (window._cardinalLifecycleInstalled) return
    window._cardinalLifecycleInstalled = true

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') return
      if (overlayAnimating || imageDisplayActive) return
      if (!baking) return
      bakeToken++
      cancelActiveRaster()
      baking = false
      releaseBuffers()
    })

    window.addEventListener('pagehide', () => {
      bakeToken++
      cancelActiveRaster()
      releaseBuffers()
      baking = false
      imageDisplayActive = false
    })
  }

  function isReady() {
    return isReadyForAngles(CARDINAL_ANGLES)
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

  function getDiagnosticsSnapshot() {
    const bg = typeof BG !== 'undefined' ? BG?.elt : null
    const bleed = FRAME?.bleed?.elt
    return {
      baking,
      overlayAnimating,
      imageDisplayActive,
      settledAngle,
      settledScale,
      bakeToken,
      firstBakeMs,
      backgroundBakePolicy,
      sessionBakeMode,
      ready: isReady(),
      busy: typeof artworkRotationState !== 'undefined'
        ? !!artworkRotationState.cardinalBusy
        : null,
      screenLightAngle: typeof readCardinalBakeScreenLightAngle === 'function'
        ? readCardinalBakeScreenLightAngle()
        : null,
      bufferBytes: estimateBufferBytes(),
      raster: typeof cardinalRasterSize === 'function' ? cardinalRasterSize() : null,
      layers: overlayStage
        ? {
          base: baseLayer?._gaKey ?? null,
          baseOpacity: baseLayer?.style.opacity ?? null,
          other: otherLayer()?._gaKey ?? null,
          otherOpacity: otherLayer()?.style.opacity ?? null,
        }
        : null,
      angles: CARDINAL_ANGLES.map(a => ({
        angle: a,
        valid: bufferIsValid(buffers[a]),
        visible: bufferHasSubstantialPixels(buffers[a]),
        sparseVisible: bufferHasVisiblePixels(buffers[a]),
        width: buffers[a]?.width,
        height: buffers[a]?.height,
      })),
      liveArtworkHidden: isLiveArtworkHidden(),
      bgDisplay: bg?.style?.display ?? null,
      bleedDisplay: bleed?.style?.display ?? null,
      overlayDisplayed: overlayEl?.style.display === 'block',
      bitmapDisplayBroken: isBitmapDisplayBroken(),
    }
  }

  installCardinalLifecycleHooks()

  window.SafariCardinalBuffers = {
    CARDINAL_ANGLES,
    bakeAllCardinalsBatch,
    isChromeBatchBaking,
    waitForOverlayPaint,
    startCardinalSession,
    stopCardinalSession,
    registerPendingRotation,
    canFulfillPendingRotation,
    shouldShowPrepOverlayForPendingBake,
    ensurePrepOverlayForPendingBake,
    shouldShowPrepForDirection,
    rotationAnglesReadyForRequest,
    pendingRotationReadyToFulfill,
    isFastFirstRotationDeferAll,
    enqueueRemainingCardinals,
    isRotationRequested,
    bufferIsDisplayable,
    bufferCoversArtworkExtent,
    invalidateCardinalBuffers,
    invalidateCardinalBuffersIfLightChanged,
    buffersStaleDueToLightChange,
    noteBuffersLightReference,
    noteFrameLayoutChange,
    cancelActiveRaster,
    animateCardinalRotation,
    enableImageDisplay,
    showSettledAngle,
    syncDisplayLayout,
    disableImageDisplay,
    recoverToLiveArtwork,
    isImageDisplayActive: () => imageDisplayActive,
    isBitmapDisplayBroken,
    cacheLayoutRect,
    isReady,
    isReadyForAngles,
    anglesRequiredForRotation,
    cardinalBakePriority,
    sortAnglesByBakePriority,
    getCurrentArtworkAngle,
    isBaking,
    isAnimating: () => overlayAnimating,
    estimateBufferBytes,
    bufferIsValid,
    bufferHasVisiblePixels,
    bufferHasSubstantialPixels,
    canvasHasVisiblePixels,
    cardinalRasterSize,
    getDiagnosticsSnapshot,
  }
})()
