// Archived from safariImageSwap.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// Obsolete Chrome two-phase reveal variant (opacity flip + staged dummy morph).
// Production uses single-phase only (RevealAnimation.js). Preserved for rollback reference.

/*
  CHROME_TRANSITION_VARIANTS = { TWO_PHASE: 'two-phase', SINGLE_PHASE: 'single-phase' }

  setChromeTransitionVariant(value) — toggled data-chrome-reveal-variant on :root

  setDirectionTiming (two-phase branch):
    shapeDur = phaseOffset * totalMs
    opacityDur = (1 - phaseOffset) * totalMs
    REVEAL: shape delay 0, opacity delay shapeDur
    HIDE: opacity delay 0, shape delay opacityDur

  prepArtwork (two-phase): opacity 0 on BG.elt, no scale/blur layer

  revealNow (two-phase):
    updateLayoutVars before reveal
    dummy.classList.add('revealed')
    setTimeout at phaseOffset * revealDurationMs → artwork opacity 1

  hideNow (two-phase):
    dummy.classList.remove('revealed')
    setTimeout at (1 - phaseOffset) * hideDurationMs → artwork opacity 0

  setChromeArtworkState (two-phase): filter blur on artwork, not shared layer

  CSS: #reveal-dummy kept per-corner filter on two-phase; single-phase moved blur to #chrome-reveal-blur-layer

  Public API (removed):
    RevealAnim.setChromeTransitionVariant('two-phase' | 'single-phase')
    RevealAnim.chromeTransitionVariants
    RevealAnim.chromeTransitionVariant getter

  CHROME_REFERENCE_PRESET.phaseOffset (0.5) drove the two-phase split.
*/
