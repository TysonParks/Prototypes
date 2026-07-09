// Archived 2026-07-09 — superseded cardinal rotation paths (not in submission manifest).
//
// Removed from production because:
// - bakeCardinalBuffers / ensureReady / scheduleCardinalBake: replaced by yielding
//   session coordinator (startCardinalSession / runCardinalSession) in safariCardinalBuffers.js
// - scheduleChromeCardinalWarmup: deprecated alias; Chrome R-toggle uses bakeAllCardinalsBatch
// - releaseChromeCardinalStandbyAfterRotation: dead under Chrome live-default + R-toggle model
// - capture/restoreArtworkRotationSnapshot: only caller was bakeCardinalBuffers

// --- safariCardinalBuffers.js (excerpt) ---

function wouldNeedPrepOverlayForRotation(direction) {
  return shouldShowPrepForDirection(direction)
}

function anglesNeededForRotation(fromAngle, toAngle) {
  const st = window.artworkRotationState
  const first = st ? !st.cardinalRotatedThisSession : true
  return anglesRequiredForRotation(fromAngle, toAngle, first)
}

function isVerticalOrientation(angle) {
  return normalizeAngle(angle) % 180 === 0
}

async function bakeCardinalBuffers({ angles: requestedAngles } = {}) {
  if (!isCardinalBitmapClient()) return { ...buffers }
  if (isRotationInteractionActive()) return { ...buffers }
  let toBake = missingAngles(requestedAngles)
  toBake = sortAnglesByBakePriority(toBake, getCurrentArtworkAngle())
  if (toBake.length === 0) return { ...buffers }
  if (overlayAnimating) return { ...buffers }
  if (baking && bakePromise) {
    await bakePromise
    const stillNeeded = missingAngles(requestedAngles)
    if (stillNeeded.length === 0) return { ...buffers }
    return bakeCardinalBuffers({ angles: stillNeeded })
  }

  const token = ++bakeToken
  const saved = typeof captureArtworkRotationSnapshot === 'function'
    ? captureArtworkRotationSnapshot()
    : null
  baking = true
  if (!imageDisplayActive) setLiveArtworkDisplayed(true)
  bakePromise = (async () => {
    let inProgress = null
    try {
      for (const angle of toBake) {
        if (token !== bakeToken || overlayAnimating) throw new Error('bake cancelled')
        await waitForRotationIdle(token, { useSessionToken: false })
        if (token !== bakeToken || overlayAnimating) throw new Error('bake cancelled')
        inProgress = angle
        buffers[angle] = await bakeAngle(angle, token)
        inProgress = null
        await yieldToMain()
      }
      return { ...buffers }
    } catch (err) {
      if (token === bakeToken && inProgress !== null) {
        const entry = buffers[inProgress]
        if (entry) {
          entry.lum = null
          entry.alpha = null
          delete buffers[inProgress]
        }
      }
      throw err
    } finally {
      baking = false
      const rotationBusy = isRotationInteractionActive()
      const mayRestore = token === bakeToken
        && saved
        && !imageDisplayActive
        && !overlayAnimating
        && !rotationBusy
      if (mayRestore && typeof restoreArtworkRotationSnapshot === 'function') {
        restoreArtworkRotationSnapshot(saved, { syncLight: false })
      }
    }
  })()
  return bakePromise
}

function cancelBakeForLiveInteraction() {
  bakeToken++
  cancelActiveRaster()
  baking = false
  bakePromise = null
  purgeInvalidBuffers()
}

function scheduleChromeCardinalWarmup() {
  bakeAllCardinalsBatch()
}

function isChromeWarmupComplete() {
  return isReadyForAngles(CARDINAL_ANGLES)
}

function scheduleCardinalBake(angles) {
  if (!isCardinalBitmapClient()) return
  if (window.SafariCompat?.capabilities?.rotation !== 'cardinal') return
  if (window.RevealAnim?.isSafariRevealComplete && !window.RevealAnim.isSafariRevealComplete()) return
  prioritizeAngles(angles)
  if (!sessionRunning && !sessionStartPending) {
    startCardinalSession({ mode: 'pending' })
  }
}

async function ensureReady(neededAngles) {
  const angles = (neededAngles?.length ? neededAngles : CARDINAL_ANGLES).map(normalizeAngle)
  if (isReadyForAngles(angles)) return true
  if (overlayAnimating) return false
  prioritizeAngles(angles)
  if (!sessionRunning && !sessionStartPending) startCardinalSession({ mode: 'pending' })
  const deadline = Date.now() + BAKE_WAIT_MS
  while (Date.now() < deadline) {
    if (isReadyForAngles(angles)) return true
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  return isReadyForAngles(angles)
}

// --- ArtworkRotation.js (excerpt) ---

function releaseChromeCardinalStandbyAfterRotation() {
  if (isChromeCardinalOptIn()) return
  if (isWebKitRotationLocked()) return
  if (!cardinalRotationCapability()) return
  const cardinal = window.SafariCardinalBuffers
  if (!cardinal?.isImageDisplayActive?.()) return
  cardinal.recoverToLiveArtwork('chrome standby after rotation')
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

// --- RevealAnimation.js (excerpt) ---

function showCardinalPrepOverlayIfNeeded() {
  if (!window.SafariCardinalBuffers?.isRotationRequested?.()) return
  showCardinalPrepOverlay()
}
