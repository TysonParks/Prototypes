// SafariCardinalDiagnostics.js — dev-only WebKit cardinal buffer smoke tests.
// Console: SafariCardinalDiagnostics.runSmoke({ hashIndex: 1519 })
//          SafariCardinalDiagnostics.snapshot()
//          SafariCardinalDiagnostics.simulateArrow(1)

(function () {
  'use strict'

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  function snapshot() {
    const cardinal = window.SafariCardinalBuffers
    const reveal = window.RevealAnim
    const compat = window.SafariCompat
    const bleed = typeof FRAME !== 'undefined' ? FRAME?.bleed?.elt : null
    const viewport = document.getElementById('artwork-rotation-viewport')
    const overlay = document.getElementById('safari-cardinal-rotation-overlay')
    const building = document.getElementById('safari-overlay')?.classList.contains('building')

    return {
      t: performance.now(),
      revealComplete: reveal?.isSafariRevealComplete?.() ?? null,
      capabilities: compat?.getCapabilities?.() ?? compat?.capabilities ?? null,
      renderMetrics: compat?.renderMetrics ?? null,
      rotation: typeof artworkRotationSnapshot === 'function' ? artworkRotationSnapshot() : null,
      cardinal: cardinal?.getDiagnosticsSnapshot?.() ?? null,
      dom: {
        bleedVisible: bleed ? getComputedStyle(bleed).visibility !== 'hidden' && bleed.style.opacity !== '0' : null,
        bleedOpacity: bleed?.style.opacity ?? null,
        viewportRect: viewport?.getBoundingClientRect?.() ?? null,
        cardinalOverlayDisplay: overlay?.style.display ?? null,
        loadingOverlayBuilding: building ?? null,
      },
    }
  }

  function logEvent(events, name, extra) {
    const row = { name, ms: performance.now(), ...snapshot(), ...extra }
    events.push(row)
    console.log(`[CardinalDiag] ${name}`, row)
    return row
  }

  async function waitFor(predicate, { timeoutMs = 120000, intervalMs = 250, label = 'condition' } = {}) {
    const start = performance.now()
    while (performance.now() - start < timeoutMs) {
      if (predicate()) return performance.now() - start
      await sleep(intervalMs)
    }
    throw new Error(`timeout waiting for ${label} (${timeoutMs}ms)`)
  }

  async function runSmoke({
    hashIndex = 1519,
    useLastHash = true,
    waitRevealMs = 120000,
    waitBakeMs = 120000,
    simulateArrow = false,
    arrowDirection = 1,
  } = {}) {
    if (!window.SafariCompat?.detectWebKitClass?.()) {
      console.warn('[CardinalDiag] not WebKit — smoke test is Safari-only')
    }

    const events = []
    logEvent(events, 'smoke-start', { hashIndex })

    if (useLastHash && typeof lastHash !== 'undefined' && typeof protoBatch !== 'undefined') {
      const hash = lastHash[hashIndex]
      if (!hash) throw new Error(`lastHash[${hashIndex}] missing`)
      logEvent(events, 'build-start', { hash })
      protoBatch.buildFromHash(hash)
      await waitFor(
        () => window.RevealAnim?.isSafariRevealComplete?.(),
        { timeoutMs: waitRevealMs, label: 'Safari reveal complete' },
      )
      logEvent(events, 'reveal-complete')
    } else {
      logEvent(events, 'build-skipped')
    }

    await waitFor(
      () => window.SafariCardinalBuffers?.isReady?.(),
      { timeoutMs: waitBakeMs, label: 'cardinal buffers ready' },
    ).catch(err => {
      logEvent(events, 'bake-timeout', { error: String(err) })
      throw err
    })
    logEvent(events, 'buffers-ready')

    if (simulateArrow) {
      logEvent(events, 'arrow-sim-start', { direction: arrowDirection })
      const before = snapshot()
      rotateArtworkBy?.(arrowDirection)
      await waitFor(
        () => !window.SafariCardinalBuffers?.isAnimating?.(),
        { timeoutMs: 10000, label: 'rotation animation' },
      ).catch(err => logEvent(events, 'arrow-anim-timeout', { error: String(err) }))
      await sleep(500)
      logEvent(events, 'arrow-sim-end', { before, after: snapshot() })
    }

    const final = logEvent(events, 'smoke-complete')
    const blackScreen = final.dom.bleedVisible === false
      && final.cardinal?.imageDisplayActive
      && final.dom.cardinalOverlayDisplay !== 'block'
    if (blackScreen) {
      console.error('[CardinalDiag] black-screen detected — recovering to live SVG')
      window.SafariCardinalBuffers?.recoverToLiveArtwork?.('diagnostics black-screen')
    }
    return { events, final, blackScreen }
  }

  function simulateArrow(direction = 1) {
    return rotateArtworkBy?.(direction)
  }

  window.SafariCardinalDiagnostics = {
    snapshot,
    runSmoke,
    simulateArrow,
    recover: () => window.SafariCardinalBuffers?.recoverToLiveArtwork?.('diagnostics manual'),
  }
})()
