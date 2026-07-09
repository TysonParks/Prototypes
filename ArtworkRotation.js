// Viewport rotation, PostParam Rotation, and fullscreen. Safari uses cardinal buffers;
// Chrome defaults to live SVG with optional R-key cardinal (see MVP-ROTATION-SHIPPING.md).
const artworkRotationState = {
  angle: 0,
  scale: 1,
  backingScale: 1,
  screenLightAngle: null,
  animating: false,
  cardinalBusy: false,
  pendingDirection: null,
  cardinalRotatedThisSession: false,
  prepOverlayVisible: false,
  chromeCardinalToggleBusy: false,
  controlsInstalled: false,
  hooksInstalled: false,
}

const artworkFullscreenState = {
  controlsInstalled: false,
  syncing: false,
  fallbackActive: false,
}

// MARK: Artwork Rotation
// Interactive viewport rotation (←/→/l). Cardinal when capability allows and light
// animation is off; live SVG when animated lighting is active (Chrome).
function artworkRotationMode() {
  // Chrome A/B: prefer appControls.js → chromeRotationMode when set.
  if (!isWebKitRotationLocked()) {
    const override = window.chromeRotationMode
    if (override === 'cardinal' || override === 'full' || override === 'off') return override
  }
  const mode = window.SafariCompat?.capabilities?.rotation
  return typeof mode === 'string' ? mode : 'cardinal'
}

function cardinalRotationCapability() {
  return artworkRotationMode() === 'cardinal'
}

function isLightAnimationActive() {
  return !!(typeof globalControls !== 'undefined' && globalControls?.animated)
}

function isWebKitRotationLocked() {
  return window.SafariCompat?.detectWebKitClass?.() === true
}

function isChromeCardinalOptIn() {
  return !isWebKitRotationLocked() && window.chromeRotationMode === 'cardinal'
}

function usesCardinalRotation() {
  return cardinalRotationCapability() && !isLightAnimationActive()
}

// True when cardinal mode is active (bitmap overlay may be used once buffers are ready).
// During rotation Chrome may show bitmap crossfade OR live SVG fallback while warming up.
function usesCardinalBitmapRotation() {
  return usesCardinalRotation()
}

function shouldUpdateLightDuringRotation() {
  return !usesCardinalRotation() && artworkRotationMode() !== 'off'
}

function shouldSyncRotationLight() {
  return artworkRotationMode() !== 'off'
}

function onLightAnimationStarted() {
  syncArtworkRotationToViewport()
}

function onLightAnimationStopped() {
  window.SafariCardinalBuffers?.invalidateCardinalBuffersIfLightChanged?.()
  if (artworkRotationState.screenLightAngle === null) {
    ensureCardinalScreenLightAngle()
  }
  syncArtworkRotationToViewport()
}

function installArtworkRotationHooks() {
  if (artworkRotationState.hooksInstalled || typeof ProtoBatch === 'undefined') return
  artworkRotationState.hooksInstalled = true
  const originalBuildFromHash = ProtoBatch.prototype.buildFromHash
  ProtoBatch.prototype.buildFromHash = function (hash) {
    window.SafariCardinalBuffers?.invalidateCardinalBuffers?.()
    artworkRotationState.screenLightAngle = null
    const result = originalBuildFromHash.call(this, hash)
    scheduleArtworkRotationSync()
    return result
  }
}

function scheduleArtworkRotationSync() {
  syncArtworkRotationToViewport()
  requestAnimationFrame(syncArtworkRotationToViewport)
  setTimeout(syncArtworkRotationToViewport, 0)
}

function installArtworkRotationControls() {
  if (artworkRotationState.controlsInstalled) return
  artworkRotationState.controlsInstalled = true
  document.addEventListener('keydown', handleChromeCardinalModeKey)
  document.addEventListener('keydown', handleArtworkRotationKey)
  document.addEventListener('pointerup', handleArtworkLightPointerUp, true)
}

function handleChromeCardinalModeKey(event) {
  if (isWebKitRotationLocked()) return
  const tag = event.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key !== 'r' && event.key !== 'R') return
  if (isArtworkActionBlocked('chromeCardinal')) return
  event.preventDefault()
  toggleChromeCardinalMode()
}

async function toggleChromeCardinalMode() {
  if (isWebKitRotationLocked()) return
  if (window.chromeRotationMode === 'cardinal') {
    await exitChromeCardinalMode()
  } else {
    await enterChromeCardinalMode()
  }
}

async function enterChromeCardinalMode() {
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal) return

  window.chromeRotationMode = 'cardinal'
  artworkRotationState.chromeCardinalToggleBusy = true
  ensureCardinalScreenLightAngle()
  cardinal.cacheLayoutRect?.()

  let prepOverlayActive = false
  let wasAlreadyReady = false
  try {
    cardinal.invalidateCardinalBuffersIfLightChanged?.()

    if (cardinal.isReady?.()) {
      wasAlreadyReady = true
    } else {
      window.RevealAnim?.showCardinalPrepOverlay?.()
      artworkRotationState.prepOverlayVisible = true
      prepOverlayActive = true
      if (cardinal.waitForOverlayPaint) await cardinal.waitForOverlayPaint()
      else await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      await cardinal.bakeAllCardinalsBatch?.()
    }
  } finally {
    artworkRotationState.chromeCardinalToggleBusy = false
    if (prepOverlayActive && !cardinal.isReady?.()) {
      window.RevealAnim?.hideCardinalPrepOverlay?.({ force: true })
      artworkRotationState.prepOverlayVisible = false
      prepOverlayActive = false
    }
  }

  if (!cardinal.isReady?.()) return

  if (wasAlreadyReady) {
    await window.RevealAnim?.showChromeCardinalStatusCue?.({
      text: window.RevealAnim.cardinalEnabledTextCopy,
    })
  } else if (prepOverlayActive) {
    await window.RevealAnim?.showChromeCardinalStatusCue?.({
      text: window.RevealAnim.cardinalReadyTextCopy,
      crossfade: true,
    })
  }
  artworkRotationState.prepOverlayVisible = false

  if (typeof DeBug !== 'undefined' && DeBug.log) {
    DeBug.log('[CardinalRotation] Chrome cardinal mode ON', {
      ready: cardinal.isReady?.(),
      firstBakeMs: cardinal.getDiagnosticsSnapshot?.()?.firstBakeMs,
    })
  }
}

async function restoreChromeLiveRotation({ showStatusCue = false, forLight = false } = {}) {
  const cardinal = window.SafariCardinalBuffers
  const shouldRestore = isChromeCardinalOptIn()
    || (forLight && cardinal?.isImageDisplayActive?.())
  if (!shouldRestore) return

  window.chromeRotationMode = 'full'
  cardinal?.stopCardinalSession?.()
  if (cardinal?.isImageDisplayActive?.()) {
    cardinal.recoverToLiveArtwork?.(forLight ? 'Light animation' : 'Chrome live mode')
  }
  artworkRotationState.cardinalRotatedThisSession = false
  syncArtworkRotationToViewport()
  artworkRotationState.prepOverlayVisible = false
  if (showStatusCue) {
    await window.RevealAnim?.showChromeCardinalStatusCue?.({
      text: window.RevealAnim.liveRotationRestoredTextCopy,
    })
  }
  if (typeof DeBug !== 'undefined' && DeBug.log) {
    DeBug.log('[CardinalRotation] Chrome cardinal mode OFF (live SVG)', { showStatusCue, forLight })
  }
}

async function exitChromeCardinalMode() {
  await restoreChromeLiveRotation({ showStatusCue: true })
}

function isLiveArtworkPointerBlocked() {
  const diag = window.SafariCardinalBuffers?.getDiagnosticsSnapshot?.()
  if (diag?.liveArtworkHidden) return true
  const bleed = FRAME?.bleed?.elt
  if (bleed && (bleed.style.pointerEvents === 'none' || bleed.style.display === 'none')) return true
  const bg = typeof BG !== 'undefined' ? BG?.elt : null
  if (bg && (bg.style.pointerEvents === 'none' || bg.style.display === 'none')) return true
  return false
}

function getArtworkPointerHitRect() {
  const cardinal = window.SafariCardinalBuffers
  if (cardinal?.isImageDisplayActive?.() || isLiveArtworkPointerBlocked()) {
    const rect = cardinal?.getDisplayRect?.()
    if (rect?.width > 0 && rect?.height > 0) return rect
  }
  const viewport = document.getElementById('artwork-rotation-viewport')
  const target = viewport || FRAME?.bleed?.elt
  if (target?.getBoundingClientRect) {
    const rect = target.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return rect
  }
  return null
}

function isPointerOverArtwork(event) {
  const rect = getArtworkPointerHitRect()
  if (!rect) return false
  const { clientX: x, clientY: y } = event
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function shouldCaptureLightTap() {
  if (isWebKitRotationLocked()) return false
  return isChromeCardinalOptIn() || isLiveArtworkPointerBlocked()
}

async function activateLightAnimation() {
  if (!isArtworkInteractionReady()) return
  if (window.SafariCompat?.capabilities?.lightAnimation === false) return

  const starting = !globalControls?.animated
  const exitingCardinal = starting && (
    isChromeCardinalOptIn()
    || window.SafariCardinalBuffers?.isImageDisplayActive?.()
  )
  if (exitingCardinal) {
    window.RevealAnim?.cancelChromeCardinalStatusSequence?.()
    window.RevealAnim?.hideCardinalPrepOverlay?.({ force: true })
    await restoreChromeLiveRotation({ showStatusCue: false, forLight: true })
  }

  if (isArtworkActionBlocked('light')) return

  if (globalControls.animated) {
    if (typeof stopAnimationLoop === 'function') stopAnimationLoop()
  } else if (typeof startAnimationLoop === 'function') {
    startAnimationLoop({ userInitiated: true })
  }
}

function handleArtworkLightPointerUp(event) {
  if (event.button !== 0) return
  if (!shouldCaptureLightTap()) return
  if (!isPointerOverArtwork(event)) return
  if (!isArtworkInteractionReady()) return

  event.preventDefault()
  event.stopImmediatePropagation()
  void activateLightAnimation()
}

function installArtworkFullscreenControls() {
  if (artworkFullscreenState.controlsInstalled) return
  artworkFullscreenState.controlsInstalled = true
  document.addEventListener('keydown', handleArtworkFullscreenKey, true)
  document.addEventListener('fullscreenchange', handleArtworkFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleArtworkFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleArtworkFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleArtworkFullscreenChange)
  syncArtworkFullscreenClass()
}

function handleArtworkFullscreenKey(event) {
  const tag = event.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const lowerKey = typeof event.key === 'string' ? event.key.toLowerCase() : event.key
  const isToggle = lowerKey === 'f'
  const isExit = event.key === 'Escape' && isArtworkFullscreenActive()
  if (!isToggle && !isExit) return
  if (isToggle && isArtworkActionBlocked('fullscreen')) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (isToggle) toggleArtworkFullscreen()
  else exitArtworkFullscreen()
}

function handleArtworkFullscreenChange() {
  artworkFullscreenState.fallbackActive = false
  syncArtworkFullscreenClass()
  scheduleArtworkFullscreenLayoutSync()
}

async function toggleArtworkFullscreen() {
  if (isArtworkFullscreenActive()) return exitArtworkFullscreen()
  return enterArtworkFullscreen()
}

async function enterArtworkFullscreen() {
  const root = document.documentElement
  try {
    const request = root.requestFullscreen
      || root.webkitRequestFullscreen
      || root.mozRequestFullScreen
      || root.msRequestFullscreen
    if (request) await waitForFullscreenRequest(request.call(root))
    if (!isNativeArtworkFullscreenActive()) artworkFullscreenState.fallbackActive = true
  } catch (err) {
    console.warn('[Fullscreen] request failed', err)
    artworkFullscreenState.fallbackActive = true
  } finally {
    syncArtworkFullscreenClass()
    scheduleArtworkFullscreenLayoutSync()
  }
}

function waitForFullscreenRequest(requestResult) {
  if (!requestResult || typeof requestResult.then !== 'function') return Promise.resolve()
  const guarded = requestResult.catch(err => { throw err })
  guarded.catch(() => { })
  return Promise.race([
    guarded,
    new Promise(resolve => setTimeout(resolve, 500)),
  ])
}

async function exitArtworkFullscreen() {
  try {
    const exit = document.exitFullscreen
      || document.webkitExitFullscreen
      || document.mozCancelFullScreen
      || document.msExitFullscreen
    if (isNativeArtworkFullscreenActive() && exit) await exit.call(document)
  } catch (err) {
    console.warn('[Fullscreen] exit failed', err)
  } finally {
    artworkFullscreenState.fallbackActive = false
    syncArtworkFullscreenClass()
    scheduleArtworkFullscreenLayoutSync()
  }
}

function isNativeArtworkFullscreenActive() {
  return !!(document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement)
}

function isArtworkFullscreenActive() {
  return isNativeArtworkFullscreenActive() || artworkFullscreenState.fallbackActive
}

function syncArtworkFullscreenClass() {
  document.body?.classList.toggle('artwork-fullscreen-active', isArtworkFullscreenActive())
}

function scheduleArtworkFullscreenLayoutSync() {
  if (artworkFullscreenState.syncing) return
  artworkFullscreenState.syncing = true
  const sync = () => {
    artworkFullscreenState.syncing = false
    sizeFrame()
    if (BG?.elt) BG.size(windowWidth, windowHeight)
    syncArtworkRotationToViewport()
    if (typeof positionRegenBtn === 'function') positionRegenBtn()
  }
  requestAnimationFrame(() => requestAnimationFrame(sync))
}

function handleArtworkRotationKey(event) {
  const tag = event.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'Escape' && usesCardinalRotation() && window.SafariCardinalBuffers?.isImageDisplayActive?.()) {
    event.preventDefault()
    window.SafariCardinalBuffers.recoverToLiveArtwork?.('Escape')
    return
  }
  const key = event.key
  const lowerKey = typeof key === 'string' ? key.toLowerCase() : key
  const direction = key === 'ArrowRight' ? 1
    : (key === 'ArrowLeft' || lowerKey === 'l') ? -1
      : 0
  if (!direction || artworkRotationMode() === 'off') return
  if (isArtworkActionBlocked('rotate')) return
  event.preventDefault()
  if (usesCardinalRotation()) {
    maybeShowCardinalPrepForRotation(direction)
    requestAnimationFrame(() => {
      if (window.artworkRotationState?.prepOverlayVisible) {
        window.RevealAnim?.showCardinalPrepOverlay?.()
      }
    })
  }
  rotateArtworkBy(direction)
}

function maybeShowCardinalPrepForRotation(direction) {
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal) return
  if (isChromeCardinalOptIn()) {
    if (cardinal.isReady?.()) return
    window.RevealAnim?.showCardinalPrepOverlay?.()
    artworkRotationState.prepOverlayVisible = true
    return
  }
  if (!cardinal.shouldShowPrepForDirection?.(direction)) return
  window.RevealAnim?.showCardinalPrepOverlay?.()
  artworkRotationState.prepOverlayVisible = true
}

function isArtworkInteractionReady() {
  if (!FRAME?.bleed?.elt || !frameSize?.x || !frameSize?.y) return false
  if (window.RevealAnim?.isSafariRevealComplete
    && !window.RevealAnim.isSafariRevealComplete()) return false
  return true
}

function isNavInFlight() {
  return !!(window.RevealAnim?.isNavInFlight?.())
}

function isExportInFlight() {
  return !!(typeof window.isArtworkExportInFlight === 'function' && window.isArtworkExportInFlight())
}

function isCardinalBakeActive() {
  const cardinal = window.SafariCardinalBuffers
  return !!(cardinal?.isBaking?.() || cardinal?.isChromeBatchBaking?.())
}

function isRotationCrossfadeActive() {
  const cardinal = window.SafariCardinalBuffers
  return !!(artworkRotationState.animating
    || artworkRotationState.cardinalBusy
    || cardinal?.isAnimating?.())
}

// Batch bake / R-toggle only — status popups are display-only and must not gate input.
function isChromeCardinalWorkActive() {
  return !!artworkRotationState.chromeCardinalToggleBusy
}

function isHeavyArtworkWorkActive() {
  return isExportInFlight()
    || isCardinalBakeActive()
    || isRotationCrossfadeActive()
    || isChromeCardinalWorkActive()
    || isNavInFlight()
}

// Actions: 'rotate' | 'export' | 'fullscreen' | 'chromeCardinal' | 'light'
// Light running is not heavy — do not block F/S/R/arrows solely because light is on.
function isArtworkActionBlocked(action) {
  if (!isArtworkInteractionReady()) return true
  if (isNavInFlight()) return true

  switch (action) {
    case 'rotate':
      if (isExportInFlight()) return true
      if (isRotationCrossfadeActive()) return true
      if (isChromeCardinalWorkActive()) return true
      // Cardinal bake wait: allow — registerPendingRotation updates direction only.
      return false
    case 'export':
    case 'fullscreen':
    case 'chromeCardinal':
    case 'light':
      return isHeavyArtworkWorkActive()
    default:
      return isHeavyArtworkWorkActive()
  }
}

function syncRevealLayoutAfterArtworkRotation() {
  if (artworkRotationState.animating) return
  if (!isArtworkInteractionReady()) return
  window.RevealAnim?.syncRevealLayoutToArtwork?.()
}

async function rotateArtworkBy(direction) {
  if (!isArtworkInteractionReady()) return
  if (isArtworkActionBlocked('rotate')) return
  if (!FRAME?.bleed?.elt) return
  if (usesCardinalRotation()) return rotateArtworkByCardinal(direction)
  if (isWebKitRotationLocked()) {
    console.warn('[CardinalRotation] WebKit cannot use live SVG rotation — cardinal required')
    return
  }
  return rotateArtworkByLive(direction)
}

async function runCardinalRotationAnimation(cardinal, direction, startAngle, targetAngle) {
  window.RevealAnim?.hideCardinalPrepOverlay?.()
  artworkRotationState.prepOverlayVisible = false

  const startScale = artworkRotationState.scale
  const targetScale = artworkRotationScaleFor(targetAngle)

  artworkRotationState.animating = true
  try {
    const animated = await cardinal.animateCardinalRotation({
      fromAngle: startAngle,
      toAngle: targetAngle,
      startScale,
      targetScale,
    })
    if (!animated) {
      cardinal.recoverToLiveArtwork?.('animateCardinalRotation returned false')
      console.warn('[CardinalRotation] bitmap animation failed — rotation aborted')
      return false
    }
    artworkRotationState.angle = targetAngle
    artworkRotationState.scale = targetScale
    return true
  } finally {
    artworkRotationState.animating = false
  }
}

function showCardinalPrepOverlayForWait() {
  window.RevealAnim?.showCardinalPrepOverlay?.()
  artworkRotationState.prepOverlayVisible = true
}

async function executeCardinalRotation(cardinal, direction, startAngle, targetAngle) {
  if (cardinal.isImageDisplayActive?.() && cardinal.isBitmapDisplayBroken?.()) {
    cardinal.recoverToLiveArtwork('broken bitmap before rotate')
  }

  artworkRotationState.cardinalBusy = true
  try {
    const rotated = await runCardinalRotationAnimation(cardinal, direction, startAngle, targetAngle)
    if (rotated) {
      artworkRotationState.cardinalRotatedThisSession = true
      if (!isChromeCardinalOptIn()) {
        cardinal.enqueueRemainingCardinals?.(startAngle)
      }
    }
  } finally {
    artworkRotationState.cardinalBusy = false
    if (cardinal.isBitmapDisplayBroken?.()) {
      cardinal.recoverToLiveArtwork('broken bitmap after rotate')
    }
    syncRevealLayoutAfterArtworkRotation()
  }
}

async function fulfillPendingCardinalRotation(direction) {
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal) return

  window.RevealAnim?.hideCardinalPrepOverlay?.()
  artworkRotationState.prepOverlayVisible = false

  const startAngle = artworkRotationState.angle
  const targetAngle = startAngle + direction * 90
  await executeCardinalRotation(cardinal, direction, startAngle, targetAngle)
}

async function rotateArtworkByCardinal(direction) {
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal) return

  if (isRotationCrossfadeActive()) return

  const startAngle = artworkRotationState.angle
  const targetAngle = startAngle + direction * 90
  ensureCardinalScreenLightAngle()
  cardinal.cacheLayoutRect?.()

  if (isChromeCardinalOptIn()) {
    if (!cardinal.isReady?.()) return
    const needed = [startAngle, targetAngle]
    if (!cardinal.isReadyForAngles?.(needed)) return
    return executeCardinalRotation(cardinal, direction, startAngle, targetAngle)
  }

  if (cardinal.rotationAnglesReadyForRequest?.(startAngle, targetAngle)) {
    return executeCardinalRotation(cardinal, direction, startAngle, targetAngle)
  }

  // Pending rotation: registerPendingRotation updates direction when session is
  // already running; it only starts a session when none is active.
  cardinal.registerPendingRotation?.(direction)
  showCardinalPrepOverlayForWait()
}

async function rotateArtworkByLive(direction) {
  if (isWebKitRotationLocked()) {
    console.warn('[CardinalRotation] blocked live SVG rotation on WebKit')
    return
  }
  if (!isArtworkInteractionReady()) return
  if (artworkRotationState.animating || !FRAME?.bleed?.elt) return
  if (!isWebKitRotationLocked() && window.SafariCardinalBuffers?.isImageDisplayActive?.()) {
    window.SafariCardinalBuffers.recoverToLiveArtwork('chrome live rotation')
  }
  if (artworkRotationState.screenLightAngle === null) {
    artworkRotationState.screenLightAngle = readScreenSpaceLightAngle()
  }

  const startAngle = artworkRotationState.angle
  const targetAngle = startAngle + direction * 90
  const startScale = artworkRotationState.scale
  const targetScale = artworkRotationScaleFor(targetAngle)
  const shrinkFirst = targetScale < startScale
  const deferLight = !shouldUpdateLightDuringRotation()
  const pauseLight = deferLight && globalControls?.animated

  artworkRotationState.animating = true
  if (pauseLight && typeof stopAnimationLoop === 'function') stopAnimationLoop()
  try {
    if (shrinkFirst) {
      await animateArtworkRotationPhase(startAngle, startAngle, startScale, targetScale, 260)
      setArtworkBackingScale(targetScale, startAngle, targetScale)
      await waitForStaticArtworkFrame(startAngle, targetScale)
      await animateArtworkRotationPhase(startAngle, targetAngle, targetScale, targetScale, 520)
    } else {
      await animateArtworkRotationPhase(startAngle, targetAngle, startScale, startScale, 520)
      await animateArtworkRotationPhase(targetAngle, targetAngle, startScale, targetScale, 260)
      setArtworkBackingScale(targetScale, targetAngle, targetScale)
      await waitForStaticArtworkFrame(targetAngle, targetScale)
    }
    artworkRotationState.angle = targetAngle
    artworkRotationState.scale = targetScale
    applyArtworkRotationTransform(targetAngle, targetScale)
    if (shouldSyncRotationLight()) updateArtworkRotationLight(targetAngle)
  } finally {
    artworkRotationState.animating = false
    applyArtworkRotationTransform(artworkRotationState.angle, artworkRotationState.scale)
    syncRevealLayoutAfterArtworkRotation()
  }
}

function syncArtworkRotationToViewport() {
  if (!FRAME?.bleed?.elt) return
  if (usesCardinalRotation()) ensureCardinalScreenLightAngle()
  const targetScale = artworkRotationScaleFor(artworkRotationState.angle)
  artworkRotationState.scale = targetScale
  if (window.SafariCardinalBuffers?.isImageDisplayActive?.()) {
    window.SafariCardinalBuffers.syncDisplayLayout()
    syncRevealLayoutAfterArtworkRotation()
    return
  }
  setArtworkBackingScale(targetScale, artworkRotationState.angle, targetScale)
  applyArtworkRotationTransform(artworkRotationState.angle, targetScale)
  if (shouldSyncRotationLight() && artworkRotationState.screenLightAngle !== null) {
    updateArtworkRotationLight(artworkRotationState.angle)
  }
  syncRevealLayoutAfterArtworkRotation()
}

function resetArtworkRotationToDefault() {
  artworkRotationState.angle = 0
  artworkRotationState.scale = artworkRotationScaleFor(0)
  artworkRotationState.screenLightAngle = 90
  setArtworkBackingScale(artworkRotationState.scale, 0, artworkRotationState.scale)
  applyArtworkRotationTransform(0, artworkRotationState.scale)
  updateArtworkRotationLight(0)
}

function animateArtworkRotationPhase(fromAngle, toAngle, fromScale, toScale, durationMs) {
  return new Promise(resolve => {
    const startMs = performance.now()
    const step = now => {
      const rawT = durationMs <= 0 ? 1 : Math.min(1, (now - startMs) / durationMs)
      const t = easeInOutCubic(rawT)
      const angle = lerp(fromAngle, toAngle, t)
      const scale = lerp(fromScale, toScale, t)
      applyArtworkRotationTransform(angle, scale)
      if (shouldUpdateLightDuringRotation()) updateArtworkRotationLight(angle)
      if (rawT < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

function waitForStaticArtworkFrame(visualAngle, visualScale) {
  // Settle will-change without flipping artworkRotationState.animating — that
  // flag guards concurrent background-bake logic, and toggling it mid-animation
  // opened a race window where a bake finally-restore could stomp live state.
  applyArtworkRotationTransform(visualAngle, visualScale, { settled: true })
  return new Promise(resolve => requestAnimationFrame(resolve))
}

function applyArtworkRotationTransform(angle, scale, { settled = false } = {}) {
  const elt = FRAME?.bleed?.elt
  if (!elt) return
  ensureArtworkRotationViewport()
  const backingScale = artworkRotationState.backingScale || 1
  const displayScale = scale / backingScale
  artworkRotationState.visualAngle = angle
  elt.style.transformOrigin = 'center center'
  elt.style.transformBox = 'fill-box'
  elt.style.willChange = (artworkRotationState.animating && !settled) ? 'transform' : 'auto'
  elt.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${displayScale})`
}

function ensureArtworkRotationViewport() {
  const elt = FRAME?.bleed?.elt
  if (!elt || !frameSize) return null
  let viewport = document.getElementById('artwork-rotation-viewport')
  if (!viewport || viewport.parentNode !== BG?.elt) {
    viewport = document.createElement('div')
    viewport.id = 'artwork-rotation-viewport'
    if (elt.parentNode) elt.parentNode.insertBefore(viewport, elt)
  }
  if (elt.parentNode !== viewport) viewport.appendChild(elt)
  Array.from(viewport.children).forEach(child => {
    if (child !== elt) child.remove()
  })
  viewport.style.position = 'relative'
  viewport.style.width = `${frameSize.x}px`
  viewport.style.height = `${frameSize.y}px`
  viewport.style.flex = '0 0 auto'
  viewport.style.overflow = 'visible'
  viewport.style.pointerEvents = 'auto'

  elt.style.position = 'absolute'
  elt.style.left = '50%'
  elt.style.top = '50%'
  elt.style.maxWidth = 'none'
  elt.style.maxHeight = 'none'
  return viewport
}

function setArtworkBackingScale(
  requiredScale = 1,
  visualAngle = artworkRotationState.angle,
  visualScale = artworkRotationState.scale,
) {
  const elt = FRAME?.bleed?.elt
  if (!elt || !frameSize) return
  ensureArtworkRotationViewport()
  const nextScale = Math.max(1, Number.isFinite(requiredScale) ? requiredScale : 1)
  const targetWidth = frameSize.x * nextScale
  const targetHeight = frameSize.y * nextScale
  const currentWidth = parseFloat(elt.getAttribute('width'))
  const currentHeight = parseFloat(elt.getAttribute('height'))
  const backingScaleMatches = Math.abs((artworkRotationState.backingScale || 1) - nextScale) < 0.0001
  const svgSizeMatches = Math.abs(currentWidth - targetWidth) < 0.01
    && Math.abs(currentHeight - targetHeight) < 0.01
  if (backingScaleMatches && svgSizeMatches) return
  artworkRotationState.backingScale = nextScale
  elt.setAttribute('width', `${targetWidth}`)
  elt.setAttribute('height', `${targetHeight}`)
  applyArtworkRotationTransform(visualAngle, visualScale)
}

function resolveArtworkVisualAngle(visualAngle) {
  if (Number.isFinite(visualAngle)) return visualAngle
  if (Number.isFinite(artworkRotationState.visualAngle)) return artworkRotationState.visualAngle
  return artworkRotationState.angle ?? 0
}

function ensureCardinalScreenLightAngle() {
  if (artworkRotationState.screenLightAngle !== null) return
  // Screen-space reference captured at objRot=0. Cardinal path never syncs
  // shadAngle to object rotation, so shadAngle still equals the objRot=0 value.
  noteArtworkScreenLightAngle(normalizeDegree(globalControls?.shadAngle ?? 90))
}

function readCardinalBakeScreenLightAngle() {
  ensureCardinalScreenLightAngle()
  return normalizeDegree(artworkRotationState.screenLightAngle)
}

function artworkLocalLightAngleFor(screenAngle, visualAngle) {
  // Screen-space light held constant: local = screenRef - objRot (objRot×-1 added to ref)
  return normalizeDegree(normalizeDegree(screenAngle) - resolveArtworkVisualAngle(visualAngle))
}

/** Filter shadAngle for a cardinal object rotation (uses locked screen reference). */
function artworkCompensatedLightAngle(objectRotationDeg) {
  return artworkLocalLightAngleFor(readCardinalBakeScreenLightAngle(), objectRotationDeg)
}

function getArtworkOffsetBatch() {
  if (typeof animationController !== 'undefined' && animationController?.getOffsetBatch) {
    return animationController.getOffsetBatch()
  }
  if (typeof S !== 'undefined' && S?.offsetElts) {
    return S.offsetElts.map(({ elt, mag }) => ({
      node: elt?.elt || elt,
      mag,
    })).filter(({ node }) => node && typeof node.setAttribute === 'function')
  }
  return []
}

function findFeOffsetIndexInFilter(offsetNode, filterEl) {
  if (!offsetNode || !filterEl) return -1
  const siblings = filterEl.querySelectorAll('feOffset')
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i] === offsetNode) return i
  }
  return -1
}

function findCloneFeOffsetByLiveIndex(cloneRoot, filterId, offsetIndex) {
  if (!cloneRoot || !filterId || offsetIndex < 0) return null
  const cloneFilter = cloneRoot.querySelector(`#${CSS.escape(filterId)}`)
  if (!cloneFilter) return null
  const cloneOffsets = cloneFilter.querySelectorAll('feOffset')
  return offsetIndex < cloneOffsets.length ? cloneOffsets[offsetIndex] : null
}

/** Apply compensated light to a clone — same hook as live batchUpdateFilters. */
function applyCompensatedLightToSVGElement(cloneRoot, objectRotationDeg, liveRoot = FRAME?.bleed?.elt) {
  if (!cloneRoot || typeof Shade === 'undefined') return false
  const localAngle = artworkCompensatedLightAngle(objectRotationDeg)
  const shadVect = Shade.shadVect(localAngle)
  const batch = getArtworkOffsetBatch()
  if (batch.length === 0) return false

  let matched = 0
  for (const { node, mag } of batch) {
    const filterEl = typeof node.closest === 'function'
      ? node.closest('filter')
      : node.parentElement
    const filterId = filterEl?.getAttribute?.('id')
    if (!filterId) continue
    const offsetIndex = findFeOffsetIndexInFilter(node, filterEl)
    const cloneOffset = findCloneFeOffsetByLiveIndex(cloneRoot, filterId, offsetIndex)
    if (!cloneOffset) continue
    cloneOffset.setAttribute('dx', shadVect.x * mag)
    cloneOffset.setAttribute('dy', shadVect.y * mag)
    matched++
  }

  if (matched !== batch.length && typeof DeBug !== 'undefined' && DeBug.warn) {
    DeBug.warn('[ArtworkRotation] clone feOffset match incomplete', {
      batch: batch.length,
      matched,
      objectRotationDeg,
    })
  }
  return matched > 0
}

function readScreenSpaceLightAngle() {
  if (artworkRotationState.screenLightAngle !== null) {
    return normalizeDegree(artworkRotationState.screenLightAngle)
  }
  return readEffectiveScreenLightAngle()
}

function readEffectiveScreenLightAngle() {
  const localAngle = normalizeDegree(globalControls?.shadAngle ?? 90)
  const rotationAngle = normalizeDegree(artworkRotationState.angle ?? 0)
  return normalizeDegree(localAngle + rotationAngle)
}

function updateArtworkRotationLight(visualAngle) {
  if (!globalControls || !S?.offsetElts || typeof Shade === 'undefined') return
  const screenAngle = readScreenSpaceLightAngle()
  const compensatedAngle = artworkLocalLightAngleFor(screenAngle, visualAngle)
  globalControls.shadAngle = compensatedAngle
  const shadVect = Shade.shadVect(compensatedAngle)
  if (typeof animationController !== 'undefined' && animationController?.batchUpdateFilters) {
    animationController.batchUpdateFilters(shadVect.x, shadVect.y)
    return
  }
  S.offsetElts.forEach(({ elt, mag }) => {
    elt.attribute('dx', shadVect.x * mag)
    elt.attribute('dy', shadVect.y * mag)
  })
}

function noteArtworkScreenLightAngle(screenAngle) {
  artworkRotationState.screenLightAngle = normalizeDegree(screenAngle)
}

// Parse a PostParam rotation value into degrees (snaps to nearest 90°).
function parseRotationParam(raw) {
  if (raw === undefined || raw === null) return 0
  const s = String(raw).trim().toLowerCase()
  if (!s) return 0
  if (s === 'up' || s === '0' || s === '0deg' || s === '0°') return 0
  if (s === 'right' || s === '90' || s === '90deg' || s === '90°') return 90
  if (s === 'down' || s === '180' || s === '180deg' || s === '180°') return 180
  if (s === 'left' || s === '270' || s === '270deg' || s === '270°') return 270
  const n = Number.parseFloat(s)
  if (Number.isFinite(n)) {
    const snapped = Math.round(n / 90) * 90
    return ((snapped % 360) + 360) % 360
  }
  return 0
}

// Apply PostParams rotation if present on tokenData.
// AB production path: tokenData.externalAssetDependencies[0].data.Rotation
// Local dev path: tokenData.postParams.data.Rotation — defaults to Up (0°).
function applyPostParamRotation(tokenData) {
  const postParams = tokenData?.externalAssetDependencies?.[0] ?? tokenData?.postParams ?? null
  const raw = postParams?.data?.['Rotation'] ?? postParams?.data?.['rotation'] ?? postParams?.data?.['RotationDirection'] ?? postParams?.data?.['rotationDirection'] ?? null
  const angle = parseRotationParam(raw)
  artworkRotationState.angle = angle
  artworkRotationState.scale = artworkRotationScaleFor(angle)
  // Expose feature for marketplace indexing
  if (typeof window !== 'undefined') {
    window.$features = window.$features || {}
    window.$features.Rotation = raw ?? 'Up'
  }
}

function artworkRotationSnapshot() {
  return {
    angle: normalizeDegree(artworkRotationState.angle),
    rawAngle: artworkRotationState.angle,
    scale: artworkRotationState.scale,
    isSideways: normalizeDegree(artworkRotationState.angle) % 180 !== 0,
  }
}

function artworkRotationScaleFor(angle) {
  const size = artworkRotationBaseSize()
  if (!size) return artworkRotationState.scale || 1
  const isSideways = normalizeDegree(angle) % 180 !== 0
  if (!isSideways) return 1
  const visualWidth = size.y
  const visualHeight = size.x
  const fitScale = Math.min(windowWidth / visualWidth, windowHeight / visualHeight)
  return Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1
}

function artworkRotationBaseSize() {
  const width = frameSize?.x
  const height = frameSize?.y
  if (!width || !height) return
  return { x: width, y: height }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

window.artworkRotationState = artworkRotationState
window.artworkRotationSnapshot = artworkRotationSnapshot
window.resolveArtworkVisualAngle = resolveArtworkVisualAngle
window.readScreenSpaceLightAngle = readScreenSpaceLightAngle
window.updateArtworkRotationLight = updateArtworkRotationLight
window.syncArtworkRotationToViewport = syncArtworkRotationToViewport
window.artworkLocalLightAngleFor = artworkLocalLightAngleFor
window.artworkCompensatedLightAngle = artworkCompensatedLightAngle
window.applyCompensatedLightToSVGElement = applyCompensatedLightToSVGElement
window.getArtworkOffsetBatch = getArtworkOffsetBatch
window.ensureCardinalScreenLightAngle = ensureCardinalScreenLightAngle
window.readCardinalBakeScreenLightAngle = readCardinalBakeScreenLightAngle
window.noteArtworkScreenLightAngle = noteArtworkScreenLightAngle
window.isArtworkInteractionReady = isArtworkInteractionReady
window.isArtworkActionBlocked = isArtworkActionBlocked
window.isHeavyArtworkWorkActive = isHeavyArtworkWorkActive
window.fulfillPendingCardinalRotation = fulfillPendingCardinalRotation
window.isLightAnimationActive = isLightAnimationActive
window.readEffectiveScreenLightAngle = readEffectiveScreenLightAngle
window.onLightAnimationStarted = onLightAnimationStarted
window.onLightAnimationStopped = onLightAnimationStopped
window.toggleChromeCardinalMode = toggleChromeCardinalMode
window.restoreChromeLiveRotation = restoreChromeLiveRotation
window.activateLightAnimation = activateLightAnimation
window.isChromeCardinalOptIn = isChromeCardinalOptIn
window.usesCardinalRotation = usesCardinalRotation
window.usesCardinalBitmapRotation = usesCardinalBitmapRotation
window.resetArtworkRotationToDefault = resetArtworkRotationToDefault
window.toggleArtworkFullscreen = toggleArtworkFullscreen
window.exitArtworkFullscreen = exitArtworkFullscreen
window.rotateArtworkBy = rotateArtworkBy;
