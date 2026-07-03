// Viewport rotation, PostParam Rotation, and fullscreen (Chrome). Raw DOM hooks intentional for SVG transform.
const artworkRotationState = {
  angle: 0,
  scale: 1,
  backingScale: 1,
  screenLightAngle: null,
  animating: false,
  controlsInstalled: false,
  hooksInstalled: false,
}

const artworkFullscreenState = {
  controlsInstalled: false,
  syncing: false,
  fallbackActive: false,
}

// MARK: Artwork Rotation
// Interactive viewport rotation (←/→/l). WebKit uses SafariCompat capability tiers.
function artworkRotationMode() {
  const mode = window.SafariCompat?.capabilities?.rotation
  return typeof mode === 'string' ? mode : 'full'
}

function shouldUpdateLightDuringRotation() {
  return artworkRotationMode() === 'full'
}

function shouldSyncRotationLight() {
  const mode = artworkRotationMode()
  return mode !== 'off'
}

function usesCardinalRotation() {
  return artworkRotationMode() === 'cardinal'
}

function captureArtworkRotationSnapshot() {
  return {
    angle: artworkRotationState.angle,
    scale: artworkRotationState.scale,
    backingScale: artworkRotationState.backingScale,
    screenLightAngle: artworkRotationState.screenLightAngle,
    visualAngle: artworkRotationState.visualAngle,
  }
}

function restoreArtworkRotationSnapshot(saved, { syncLight = true } = {}) {
  if (!saved) return
  artworkRotationState.angle = saved.angle
  artworkRotationState.scale = saved.scale
  artworkRotationState.backingScale = saved.backingScale
  artworkRotationState.screenLightAngle = saved.screenLightAngle
  artworkRotationState.visualAngle = saved.visualAngle
  setArtworkBackingScale(saved.scale, saved.angle, saved.scale)
  applyArtworkRotationTransform(saved.angle, saved.scale)
  if (syncLight && shouldSyncRotationLight()) updateArtworkRotationLight(saved.angle)
}

// Bake target: portrait (0°) geometry; lighting only varies per cardinal viewport angle.
function applyArtworkRotationForCardinalBake(cardinalAngle) {
  const portraitScale = artworkRotationScaleFor(0)
  artworkRotationState.angle = 0
  artworkRotationState.scale = portraitScale
  setArtworkBackingScale(portraitScale, 0, portraitScale)
  applyArtworkRotationTransform(0, portraitScale)

  if (artworkRotationState.screenLightAngle === null) {
    artworkRotationState.screenLightAngle = readScreenSpaceLightAngle()
  }
  const screenAngle = readScreenSpaceLightAngle()
  const localAngle = artworkLocalLightAngleFor(screenAngle, cardinalAngle)
  globalControls.shadAngle = localAngle
  const shadVect = Shade.shadVect(localAngle)
  if (typeof animationController !== 'undefined' && animationController?.batchUpdateFilters) {
    animationController.batchUpdateFilters(shadVect.x, shadVect.y)
    return
  }
  if (S?.offsetElts) {
    S.offsetElts.forEach(({ elt, mag }) => {
      elt.attribute('dx', shadVect.x * mag)
      elt.attribute('dy', shadVect.y * mag)
    })
  }
}
function installArtworkRotationHooks() {
  if (artworkRotationState.hooksInstalled || typeof ProtoBatch === 'undefined') return
  artworkRotationState.hooksInstalled = true
  const originalBuildFromHash = ProtoBatch.prototype.buildFromHash
  ProtoBatch.prototype.buildFromHash = function (hash) {
    window.SafariCardinalBuffers?.invalidateCardinalBuffers?.()
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
  document.addEventListener('keydown', handleArtworkRotationKey)
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
  event.preventDefault()
  rotateArtworkBy(direction)
}

function syncRevealLayoutAfterArtworkRotation() {
  if (artworkRotationState.animating) return
  window.RevealAnim?.syncRevealLayoutToArtwork?.()
}

async function rotateArtworkBy(direction) {
  if (artworkRotationState.animating || !FRAME?.bleed?.elt) return
  if (usesCardinalRotation()) return rotateArtworkByCardinal(direction)
  return rotateArtworkByLive(direction)
}

async function rotateArtworkByCardinal(direction) {
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal) return

  if (cardinal.isAnimating?.()) return

  const needsCardinalWait = !cardinal.isReady()
  const showCardinalOverlay = needsCardinalWait && window.RevealAnim?.isWebKitClass
  if (showCardinalOverlay) {
    window.RevealAnim.showSafariLoadingOverlay('cardinals')
  }

  let ready = false
  try {
    ready = await cardinal.ensureReady()
  } finally {
    if (showCardinalOverlay) {
      window.RevealAnim.hideSafariLoadingOverlay()
    }
  }
  if (!ready) return

  const startAngle = artworkRotationState.angle
  const targetAngle = startAngle + direction * 90
  const startScale = artworkRotationState.scale
  const targetScale = artworkRotationScaleFor(targetAngle)

  if (!cardinal.isImageDisplayActive?.()) {
    const activated = cardinal.enableImageDisplay(startAngle, startScale)
    if (!activated) {
      console.warn('[CardinalRotation] bitmap display unavailable — staying on live SVG')
      return
    }
  }

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
      return
    }
    artworkRotationState.angle = targetAngle
    artworkRotationState.scale = targetScale
  } finally {
    artworkRotationState.animating = false
    syncRevealLayoutAfterArtworkRotation()
  }
}

async function rotateArtworkByLive(direction) {
  if (artworkRotationState.animating || !FRAME?.bleed?.elt) return
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
  const targetScale = artworkRotationScaleFor(artworkRotationState.angle)
  artworkRotationState.scale = targetScale
  if (usesCardinalRotation() && window.SafariCardinalBuffers?.isImageDisplayActive?.()) {
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
  const wasAnimating = artworkRotationState.animating
  artworkRotationState.animating = false
  applyArtworkRotationTransform(visualAngle, visualScale)
  artworkRotationState.animating = wasAnimating
  return new Promise(resolve => requestAnimationFrame(resolve))
}

function applyArtworkRotationTransform(angle, scale) {
  const elt = FRAME?.bleed?.elt
  if (!elt) return
  ensureArtworkRotationViewport()
  const backingScale = artworkRotationState.backingScale || 1
  const displayScale = scale / backingScale
  artworkRotationState.visualAngle = angle
  elt.style.transformOrigin = 'center center'
  elt.style.transformBox = 'fill-box'
  elt.style.willChange = artworkRotationState.animating ? 'transform' : 'auto'
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

function readScreenSpaceLightAngle() {
  if (artworkRotationState.screenLightAngle !== null) {
    return normalizeDegree(artworkRotationState.screenLightAngle)
  }
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

function artworkLocalLightAngleFor(screenAngle, visualAngle) {
  return normalizeDegree(screenAngle - resolveArtworkVisualAngle(visualAngle))
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

window.captureArtworkRotationSnapshot = captureArtworkRotationSnapshot
window.restoreArtworkRotationSnapshot = restoreArtworkRotationSnapshot
window.applyArtworkRotationForCardinalBake = applyArtworkRotationForCardinalBake
window.artworkRotationSnapshot = artworkRotationSnapshot
window.resolveArtworkVisualAngle = resolveArtworkVisualAngle
window.readScreenSpaceLightAngle = readScreenSpaceLightAngle
window.updateArtworkRotationLight = updateArtworkRotationLight
window.syncArtworkRotationToViewport = syncArtworkRotationToViewport
window.artworkLocalLightAngleFor = artworkLocalLightAngleFor
window.noteArtworkScreenLightAngle = noteArtworkScreenLightAngle
window.resetArtworkRotationToDefault = resetArtworkRotationToDefault
window.toggleArtworkFullscreen = toggleArtworkFullscreen
window.exitArtworkFullscreen = exitArtworkFullscreen
window.rotateArtworkBy = rotateArtworkBy
