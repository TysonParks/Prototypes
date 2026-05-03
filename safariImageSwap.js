// safariImageSwap.js
// ---------------------------------------------------------------------------
// Reveal Animation + Safari/WebKit UX module.
//
// Filename retained from earlier canvas-image-swap experiment to avoid
// index.html churn. Module's actual role is the "reveal animation"
// system described in ROADMAP.md § "Reveal Animation Tuning":
//
//   E2 Spinner   — kept off-screen by default; shown only as a fallback
//                  for very slow renders (legacy WebKit pre-LBSE).
//   E3 "Loading" text — fades in 2s→3s, ONLY on WebKit-class engines,
//                       ONLY if the reveal hasn't fired by 2s.
//   E4 Dummy backing — solid color rect that morphs to mirror the
//                      current artwork's outer shape (read from
//                      Grid.frameShapeMetrics on the BackGrid).
//                      Carries ALL animated properties: width/height,
//                      per-corner border-radius, scale, blur. Default
//                      hidden state is the 100×200uu pill.
//   E1 Artwork (BG.elt) — ONLY animates opacity. No scale, no blur.
//                         This separation gives identical Chrome/
//                         Safari behavior since Safari's pathological
//                         CSS-blur-on-complex-SVG path is avoided.
//
// Two-stage choreography (per user spec table 2026-04-30 v4):
//
//   Hidden state:    dummy { opacity 1, blur blurUU, scale hiddenScale, shape pill }
//                    artwork { opacity 0 }
//   Revealed state:  dummy { opacity 0, blur 0, scale 1, shape art }
//                    artwork { opacity 1 }
//
//   REVEAL phase 1 (0→halfDur):   dummy opacity 1→0, dummy scale
//                                 hiddenScale→1, artwork opacity 0→1
//   REVEAL phase 2 (halfDur→full): dummy blur blurUU→0, dummy shape
//                                 pill→art
//   HIDE   phase 1 (0→halfDur):   dummy opacity 0→1, artwork opacity 1→0
//   HIDE   phase 2 (halfDur→full): dummy blur 0→blurUU, dummy scale
//                                 1→hiddenScale, dummy shape art→pill
//
// Per-property delays:
//   dummy opacity      — always 0 (cross-fade with artwork)
//   dummy scale        — reveal 0, hide halfDur            (`--dummy-scale-delay`)
//   dummy blur         — always halfDur                    (constant)
//   dummy border-radius— always halfDur                    (constant)
//   artwork opacity    — always 0
//
// CSS-only transitions (per AI_INDEX immutability axiom + RA3): JS
// adds/removes class names + writes CSS variables; CSS owns the
// timing. Sequence is achieved entirely through transition-delay.
//
// Engine detection (KNOWN-ISSUES § 9.17 FC2): UA-detects Safari + any
// iOS browser as "WebKit-class" since pre-EU-DMA iOS forces all
// browsers onto WebKit anyway.
//
// Public API (window.SafariCompatUX):
//   .isSafari            true if UA-detected WebKit-class
//   .isWebKitClass       alias of isSafari
//   .revealNow()         force-trigger reveal (debug)
//   .hideNow()           force-trigger hide (debug)
//   .resetForRebuild()   re-prep the dummy + artwork (called automatically)
// ---------------------------------------------------------------------------

(function () {
  'use strict'

  //SECT: Engine detection
  // We treat as "Safari-class" anything likely to use the legacy WebKit
  // SVG renderer — i.e. anywhere we expect ~10s render times. This covers:
  //   • Desktop Safari (macOS).
  //   • Any iOS browser (Safari, Chrome/CriOS, Firefox/FxiOS, Edge/EdgiOS,
  //     in-app WKWebViews) — historically ALL forced to WebKit by App
  //     Store rule § 2.5.6, even if they appear "Chromium" by branding.
  //
  // EU DMA (March 2024) opened iOS to alternate engines (Blink/Gecko),
  // but adoption has been slow. Outside the EU, iOS is still WebKit-only
  // (UK CMA ruling pending rollout; Brazil investigating). False-positive
  // here (showing the loading overlay on a true-Blink iOS browser) is
  // cheap — just a polished loading screen. False-negative (treating
  // CriOS as Chromium) is expensive — 10s render with no UI feedback.
  // So we err on the side of inclusion.
  //
  // Excluded: Android (always Blink/Gecko), desktop Chromium/Firefox,
  // headless Chromium (ArtBlocks render farm).
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    // iPadOS 13+ reports as Mac with touch points — sniff for that.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isDesktopSafari = /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Android/i.test(ua)
  const isWebKitClass = isDesktopSafari || isIOS
  const isSafari = isWebKitClass // back-compat alias

  //SECT: Tunable constants (RA6 will iterate on these)
  // All initial values per user spec 2026-04-29 / 2026-04-30.
  const blurUserUnits = 30           // dummy hidden-state blur in uu
  const revealDurationMs = 2000      // forward TOTAL duration
  const hideDurationMs = 2000        // reverse TOTAL duration
  // phaseOffset ∈ [0, 1]: fraction of total duration spent on the
  // blur/scale/shape phase. Opacity phase gets (1 − phaseOffset).
  //   REVEAL: phase 1 = blur/scale/shape (duration phaseOffset*t),
  //           phase 2 = opacity         (duration (1−phaseOffset)*t)
  //   HIDE:   phase 1 = opacity         (duration (1−phaseOffset)*t),
  //           phase 2 = blur/scale/shape (duration phaseOffset*t)
  // Instantaneous artwork-opacity flip lands at the phase boundary:
  //   reveal: phaseOffset*revealDurationMs
  //   hide:   (1−phaseOffset)*hideDurationMs
  // 0.5 → even split. Higher → more blur/scale time, less opacity time.
  const phaseOffset = 0.5
  const hiddenScale = 0.5            // dummy hidden-state scale (focus-pull / DOF feel)

  //SECT: Safari-only tunables
  // Safari uses a stripped-down UX: artwork dim + spinner + loading
  // text only. No dummy morphing, no scale, no blur transitions.
  const safariBuildSettleMs = 300       // wall-clock after origBuild before reveal
  // Overlay tunables — initial values; all also exposed as CSS vars (--safari-*)
  // so they can be adjusted live in DevTools without reload.
  const safariBlurPx = 20               // backdrop-filter blur radius in px
  const safariDimBrightness = 0.5       // brightness() in backdrop-filter (0.5 = half)
  const safariDimFadeMs = 200           // how fast dim+blur appear on keypress (ms)
  const safariBlurRevealMs = 800        // how long blur+dim clear on reveal (ms)
  const safariOverlayDelayMs = 2000     // delay before spinner + text fade in (ms)
  const safariOverlayFadeMs = 1000      // fade duration for spinner + text (ms)
  const safariSpinnerDiameterUu = 85    // spinner diameter in user units
  const safariSpinnerStrokeUu = 5       // spinner stroke width in user units
  const safariSpinnerStrokeAlpha = 0.2  // rgba white stroke alpha
  const safariSpinnerArcFraction = 0.75 // fraction of circle drawn (0.75 = 270°)
  const safariSpinnerBlurUu = 5         // blur pre-rendered into canvas (user units)
  const safariSpinnerRevolutionMs = 30000 // ms per full rotation
  const dummyColor = '#e6e6e6'          // matches achromic(0.9) ≈ rgb(230,230,230)

  // Default frame metrics used cold-load (before any artwork has been
  // built) and as the dummy hidden-state geometry. 100×200uu region,
  // all four corners 50uu → a perfect pill at hidden state.
  const defaultFrameMetrics = {
    width: 100,
    height: 200,
    cornerRadii: { tl: 50, tr: 50, br: 50, bl: 50 },
  }

  // Loading-text styling — all spatial values in FRAME user units so they
  // render identically across resolutions / window sizes (1uu = 1% of
  // inner art width).
  const loadingTextSizeUserUnits = 3.1          // font size in uu
  const loadingTextShadowOffsetUserUnits = 0.4  // drop-shadow Y offset (down) in uu
  const loadingTextShadowBlurUserUnits = 0.8    // drop-shadow blur radius in uu
  // Two sentences, blank line between them — rendered via
  // `white-space: pre-line` so we can use \n\n in textContent.
  const loadingTextCopy =
    'Safari may take significantlylonger and render slightly differently.\n\n' +
    'Chrome is the reference execution.'

  //SECT: State
  let _dummy = null
  let _frameElt = null                           // BG.elt ref — used by Chrome path only
  let _buildToken = 0                            // bumped on each build; cancels stale timers/transitions
  // 'n'-keypress debounce — true from the moment a build starts until
  // its reveal animation has fully completed. Cleared inside revealNow()
  // via a revealDurationMs setTimeout. Starts true so the cold-load
  // reveal also blocks 'n' presses until it finishes.
  let _rebuildInFlight = true
  let _currentMetrics = defaultFrameMetrics      // last applied frame metrics (used as hide-stage-2 START shape)
  // Safari persistent overlay — created once at init(), NEVER destroyed.
  // Survives every ProtoBatch teardown/rebuild cycle (BG.elt does not).
  // All Safari animations are driven by toggling .building on _safariOverlay.
  let _safariOverlay = null                      // #safari-overlay root element
  let _safariSpinnerWrapper = null               // #safari-spinner-wrapper inside overlay
  let _uuToPxArt = 1                             // uu→px scale for current artwork (updated in updateLayoutVars)

  //FUNC: ensureStyles() : void
  // Inject CSS once. The dummy carries ALL animated properties:
  // width/height (uu → px via JS-set CSS vars), per-corner
  // border-radius, transform (scale), filter (blur). Artwork only
  // animates opacity (driven inline so we can set per-direction
  // delays without class churn).
  //
  // Sequence is achieved with transition-delay alone:
  //   --dummy-delay = 0ms (reveal: dummy morphs first) or halfDur
  //                   (hide:  dummy morphs after artwork fades)
  //   artwork inline transition uses opposite delay.
  function ensureStyles() {
    if (document.getElementById('reveal-anim-styles')) return
    const style = document.createElement('style')
    style.id = 'reveal-anim-styles'
    style.textContent = `
      :root {
        --hidden-scale: ${hiddenScale};
        /* Per-phase durations + delays (set by setDirectionTiming).
           Two phases per spec table 2026-04-30 v3:
             SHAPE phase — dummy blur, scale, border-radius, bounds.
               REVEAL: duration phaseOffset*t,        delay 0
               HIDE:   duration phaseOffset*t,        delay (1−phaseOffset)*t
             OPACITY phase — dummy opacity (artwork opacity is an
               instantaneous flip handled by JS, not transitioned).
               REVEAL: duration (1−phaseOffset)*t,    delay phaseOffset*t
               HIDE:   duration (1−phaseOffset)*t,    delay 0
           Total wall-clock = t regardless of phaseOffset. */
        --phase-shape-duration: 750ms;
        --phase-shape-delay: 0ms;
        --phase-opacity-duration: 750ms;
        --phase-opacity-delay: 750ms;
        --reveal-blur: 0px;

        /* DEFAULT PILL bounds — centered in viewport, frameSize-based.
           Used as the dummy's hidden-state geometry. JS keeps these in
           sync on init/resize. */
        --dummy-pill-left:   0px;
        --dummy-pill-top:    0px;
        --dummy-pill-width:  100px;
        --dummy-pill-height: 200px;
        /* Hidden-state radius — large value so corners fully round
           into a pill regardless of width/height. */
        --dummy-pill-radius: 9999px;

        /* MEASURED ARTWORK bounds — pixel-perfect overlay of the
           rendered FRAME.backGroup.shapeGroups[0] outer-mask path. JS
           updates these whenever a new artwork is built. */
        --dummy-art-left:   0px;
        --dummy-art-top:    0px;
        --dummy-art-width:  100px;
        --dummy-art-height: 200px;
        --dummy-art-radius-tl: 50px;
        --dummy-art-radius-tr: 50px;
        --dummy-art-radius-br: 50px;
        --dummy-art-radius-bl: 50px;

          /* Safari compositor-only geometry path: keep layout pinned to
            the artwork rect and tween the hidden pill via transform. */
          --dummy-safari-hidden-dx: 0px;
          --dummy-safari-hidden-dy: 0px;
          --dummy-safari-hidden-scale-x: 1;
          --dummy-safari-hidden-scale-y: 1;

        /* Safari overlay tunables — initial values set from JS constants above.
           All adjustable live in DevTools (change on :root) without reload. */
        --safari-blur-px: ${safariBlurPx}px;
        --safari-dim-brightness: ${safariDimBrightness};
        --safari-dim-fade-ms: ${safariDimFadeMs}ms;
        --safari-blur-reveal-ms: ${safariBlurRevealMs}ms;
        --safari-overlay-delay-ms: ${safariOverlayDelayMs}ms;
        --safari-overlay-fade-ms: ${safariOverlayFadeMs}ms;
        --safari-spinner-rev-ms: ${safariSpinnerRevolutionMs}ms;
      }

      /* === DUMMY ===
         Default (hidden) state: centered pill at frameSize-based
         bounds. The .revealed class swaps in the measured artwork
         bounds + per-corner radii. transform-origin center keeps
         scale tied to the dummy's own center.

         left/top/width/height ARE animated (with --reveal-shape-delay)
         so the dummy morphs both its rectangle AND its corners between
         pill and artwork — matching the user's "shape" choreography
         row. Without this the rect would jump instantly between builds. */
      #reveal-dummy {
        position: fixed;
        left:   var(--dummy-pill-left);
        top:    var(--dummy-pill-top);
        width:  var(--dummy-pill-width);
        height: var(--dummy-pill-height);
        background: ${dummyColor};
        border-radius: var(--dummy-pill-radius);
        opacity: 1;
        transform-origin: center center;
        transform: translateZ(0) scale(var(--hidden-scale));
        filter: blur(var(--reveal-blur));
        -webkit-filter: blur(var(--reveal-blur));
        transition:
          opacity        var(--phase-opacity-duration) linear var(--phase-opacity-delay),
          transform      var(--phase-shape-duration)   linear var(--phase-shape-delay),
          filter         var(--phase-shape-duration)   linear var(--phase-shape-delay),
          -webkit-filter var(--phase-shape-duration)   linear var(--phase-shape-delay),
          border-radius  var(--phase-shape-duration)   linear var(--phase-shape-delay),
          left           var(--phase-shape-duration)   linear var(--phase-shape-delay),
          top            var(--phase-shape-duration)   linear var(--phase-shape-delay),
          width          var(--phase-shape-duration)   linear var(--phase-shape-delay),
          height         var(--phase-shape-duration)   linear var(--phase-shape-delay);
        will-change: transform, border-radius, opacity, filter, left, top, width, height;
        z-index: 10;
        pointer-events: none;
      }
      #reveal-dummy.revealed {
        left:   var(--dummy-art-left);
        top:    var(--dummy-art-top);
        width:  var(--dummy-art-width);
        height: var(--dummy-art-height);
        border-radius:
          var(--dummy-art-radius-tl) var(--dummy-art-radius-tr)
          var(--dummy-art-radius-br) var(--dummy-art-radius-bl);
        transform: translateZ(0) scale(1);
        opacity: 0;
        filter: blur(0);
        -webkit-filter: blur(0);
      }

      /* === SAFARI MODE — deprecated (rev 3, 2026-05-01) ===
         The #reveal-dummy on Safari now uses the same animation pipeline
         as Chrome (opacity + transform + filter:blur + border-radius +
         bounds, all single-phase). The .safari-mode class is no longer
         applied to the dummy; these rules are dead code retained
         temporarily until any external test harness is updated. */
      #reveal-dummy.safari-mode {
        left:   var(--dummy-art-left);
        top:    var(--dummy-art-top);
        width:  var(--dummy-art-width);
        height: var(--dummy-art-height);
        transform: translateZ(0) translate(
          var(--dummy-safari-hidden-dx),
          var(--dummy-safari-hidden-dy)
        ) scale(
          var(--dummy-safari-hidden-scale-x),
          var(--dummy-safari-hidden-scale-y)
        );
        filter: none !important;
        -webkit-filter: none !important;
        transition:
          opacity        var(--phase-opacity-duration) linear var(--phase-opacity-delay),
          transform      var(--phase-shape-duration)   linear var(--phase-shape-delay),
          border-radius  var(--phase-shape-duration)   linear var(--phase-shape-delay);
        will-change: transform, border-radius, opacity;
      }
      #reveal-dummy.safari-mode.revealed {
        left:   var(--dummy-art-left);
        top:    var(--dummy-art-top);
        width:  var(--dummy-art-width);
        height: var(--dummy-art-height);
        transform: translateZ(0) translate(0px, 0px) scale(1, 1);
      }

      /* === SAFARI OVERLAY (WebKit-only) ===
         A single persistent overlay element rooted at <body>. It is NEVER
         removed — it survives every ProtoBatch teardown/rebuild cycle.
         Carries ONLY the spinner + loading text. The dim/blur visual is
         provided by #reveal-dummy (which is also persistent post rev 3).

         All Safari loading UX (spinner, text) is driven by a single
         class toggle: #safari-overlay.building.

         @keyframes with animation-delay handle spinner+text timing on the
         compositor's own clock, immune to the ~10s JS main-thread lock.
         (JS setTimeout callbacks queue up during the lock and burst-fire
         all at once on unlock — animation-delay does not have this problem.) */

      /* Overlay root: full-screen fixed, just a coordinate container */
      #safari-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        pointer-events: none;
      }

      /* === SPINNER ===
         animation-delay fires on the compositor's animation clock, NOT the
         JS event queue. The 2s delay counts down correctly during the build
         lock. JS setTimeout(2000) queued during a 10s lock fires at t=10s
         (lock releases) + 2s = 12s after keypress. animation-delay fires
         at exactly t=2s regardless of main-thread activity.
         transition on the base rule handles fade-OUT when .building removed. */
      #safari-spinner-wrapper {
        position: fixed;
        transform: translate(-50%, -50%);
        opacity: 0;
        pointer-events: none;
        z-index: 110;
        will-change: opacity;
        transition: opacity var(--safari-overlay-fade-ms) linear;
      }
      #safari-overlay.building #safari-spinner-wrapper {
        animation: safari-overlay-fadein var(--safari-overlay-fade-ms) linear
                   var(--safari-overlay-delay-ms) forwards;
      }
      #safari-spinner-canvas {
        display: block;
        animation: safari-spinner-spin var(--safari-spinner-rev-ms) linear infinite;
        animation-play-state: paused;
      }
      #safari-overlay.building #safari-spinner-canvas {
        animation-play-state: running;
      }

      /* === LOADING TEXT ===
         Same animation-delay/transition-fade-out pattern as spinner. */
      #safari-loading-text {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate3d(-50%, -50%, 0);
        z-index: 110;
        max-width: 80vw;
        text-align: center;
        white-space: pre-line;
        color: #ffffff;
        font-family: ui-rounded, "SF Pro Rounded", system-ui,
          -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
        font-weight: 500;
        font-size: var(--loading-text-size);
        line-height: 1.35;
        letter-spacing: 0.01em;
        text-shadow: 0 var(--loading-text-shadow-y) var(--loading-text-shadow-blur) rgba(0, 0, 0, 0.85);
        opacity: 0;
        pointer-events: none;
        user-select: none;
        will-change: opacity;
        transition: opacity var(--safari-overlay-fade-ms) linear;
      }
      #safari-overlay.building #safari-loading-text {
        animation: safari-overlay-fadein var(--safari-overlay-fade-ms) linear
                   var(--safari-overlay-delay-ms) forwards;
      }

      @keyframes safari-overlay-fadein {
        from { opacity: 0 }
        to   { opacity: 1 }
      }
      @keyframes safari-spinner-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  //FUNC: computeFrameSize() : { x, y }
  // Mirrors sizeFrame() in sketch.js. Used for sizing the dummy before
  // p5 has run.
  function computeFrameSize() {
    const w = Math.min(window.innerWidth, window.innerHeight / 2) * 1.1
    const h = w * 1.8
    return { x: w, y: h }
  }

  //FUNC: getMaskShapeElts() : { groupElt, pathElt } | null
  // Returns the rendered DOM nodes for the artwork's outer mask
  // shape \u2014 i.e. the FIRST <path> child of
  // FRAME.backGroup.shapeGroups[0].svgGroupElt.elt. That path is the
  // outer perimeter used by Frame.maskFrame() to clip the artwork;
  // any subsequent paths in the same group are interior cuts. The
  // outer perimeter is the path with the largest bounding box — we
  // pick that explicitly. Returns null if the structure isn't ready
  // yet (cold-load).
  function getMaskShapeElts() {
    const sg = (typeof FRAME !== 'undefined' && FRAME &&
      FRAME.backGroup && FRAME.backGroup.shapeGroups &&
      FRAME.backGroup.shapeGroups[0]) || null
    const groupElt = sg && sg.svgGroupElt && sg.svgGroupElt.elt
    if (!groupElt) return null
    const paths = groupElt.querySelectorAll && groupElt.querySelectorAll('path')
    if (!paths || paths.length === 0) return null
    let best = null, bestArea = -1
    for (let i = 0; i < paths.length; i++) {
      const pp = paths[i]
      let bb
      try { bb = pp.getBBox() } catch (_e) { continue }
      if (!bb) continue
      const area = bb.width * bb.height
      if (area > bestArea) { bestArea = area; best = pp }
    }
    if (!best) return null
    return { groupElt, pathElt: best }
  }

  //FUNC: getMaskShapeRect() : DOMRect | null
  // Screen-space bounding rect of the OUTER mask path. Using the
  // path itself (not the parent group) keeps the rect tight to the
  // visible perimeter even when interior cut-paths exist in the
  // same group.
  function getMaskShapeRect() {
    const elts = getMaskShapeElts()
    if (!elts) return null
    const r = elts.pathElt.getBoundingClientRect()
    if (!r || r.width <= 0 || r.height <= 0) return null
    return r
  }

  //FUNC: measureCornerRadiiUu(pathElt) : { tl, tr, br, bl } | null
  // Measure the four corner radii of a closed SVG path by probing
  // along the inward diagonal from each corner of its bbox using
  // SVGGeometryElement.isPointInFill().
  //
  // Geometry: for a rounded rect with corner radius r, points along
  // the diagonal from the bbox corner inward at distance d are
  // INSIDE the fill iff d ≥ r·(1 − 1/√2) ≈ 0.293·r.
  // Binary-search for the smallest d where the point becomes filled
  // and back out r = d / (1 − 1/√2) ≈ 3.4142·d.
  //
  // Returns radii in SVG user units (relative to path's getBBox).
  function measureCornerRadiiUu(pathElt) {
    if (!pathElt || typeof pathElt.isPointInFill !== 'function') return null
    let bbox
    try { bbox = pathElt.getBBox() } catch (_e) { return null }
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) return null
    const ownerSvg = pathElt.ownerSVGElement
    if (!ownerSvg || typeof ownerSvg.createSVGPoint !== 'function') return null
    const pt = ownerSvg.createSVGPoint()
    const maxD = Math.min(bbox.width, bbox.height) / 2
    const tolerance = Math.max(0.05, maxD * 0.001)
    const cornerInsetFactor = 1 - 1 / Math.SQRT2

    function isFilled(x, y) {
      pt.x = x; pt.y = y
      try { return pathElt.isPointInFill(pt) } catch (_e) { return false }
    }
    function probe(cornerX, cornerY, signX, signY) {
      if (!isFilled(
        cornerX + signX * maxD * 0.99,
        cornerY + signY * maxD * 0.99
      )) return 0
      if (isFilled(cornerX + signX * tolerance, cornerY + signY * tolerance)) return 0
      let lo = 0, hi = maxD
      while (hi - lo > tolerance) {
        const mid = (lo + hi) / 2
        if (isFilled(cornerX + signX * mid, cornerY + signY * mid)) hi = mid
        else lo = mid
      }
      return hi / cornerInsetFactor
    }

    const x0 = bbox.x, y0 = bbox.y
    const x1 = bbox.x + bbox.width, y1 = bbox.y + bbox.height
    return {
      tl: probe(x0, y0, +1, +1),
      tr: probe(x1, y0, -1, +1),
      br: probe(x1, y1, -1, -1),
      bl: probe(x0, y1, +1, -1),
    }
  }

  //FUNC: updateLayoutVars(metrics) : void
  // Source of truth: the rendered DOM of the OUTER mask path inside
  // FRAME.backGroup.shapeGroups[0].svgGroupElt.elt. We position the
  // dummy at the path's screen-space rect and measure the four
  // corner radii directly from the path geometry via isPointInFill
  // probing \u2014 bypassing model-class assumptions about which segment
  // owns which corner.
  //
  // Cold-load fallback (before the mask path exists): center a pill
  // in the viewport sized from frameSize; the next build will
  // overwrite this with measured values. The `metrics` arg is only
  // consulted in fallback mode (for default proportions).
  function updateLayoutVars(metrics = _currentMetrics) {
    const root = document.documentElement.style

    // ---- ARTWORK bounds + radii (measured DOM, when available) ----
    let artLeft, artTop, artW, artH
    let artRadiiPx = null
    let uuToPxArt
    const elts = getMaskShapeElts()
    if (elts) {
      const rect = elts.pathElt.getBoundingClientRect()
      if (rect && rect.width > 0 && rect.height > 0) {
        artLeft = rect.left
        artTop = rect.top
        artW = rect.width
        artH = rect.height
        const radiiUu = measureCornerRadiiUu(elts.pathElt)
        if (radiiUu) {
          let bbox
          try { bbox = elts.pathElt.getBBox() } catch (_e) { bbox = null }
          if (bbox && bbox.width > 0) {
            const k = artW / bbox.width
            artRadiiPx = {
              tl: radiiUu.tl * k,
              tr: radiiUu.tr * k,
              br: radiiUu.br * k,
              bl: radiiUu.bl * k,
            }
          }
        }
      }
    }

    // ---- DEFAULT-PILL bounds (centered viewport, frameSize-based) ----
    // Always computed from defaultFrameMetrics (100\u00d7200uu) \u2014 NOT from
    // the passed-in `metrics`, which carries the current artwork's
    // aspect ratio. The dummy's hidden state must always be a 1:2
    // pill regardless of which artwork preceded it.
    const fs = (typeof frameSize !== 'undefined' && frameSize)
      ? frameSize : computeFrameSize()
    const pillW = Math.min(fs.x * (9 / 11), window.innerWidth * 0.9)
    const pillH = pillW * (defaultFrameMetrics.height / defaultFrameMetrics.width)
    const pillLeft = (window.innerWidth - pillW) / 2
    const pillTop = (window.innerHeight - pillH) / 2
    const uuToPxPill = pillW / defaultFrameMetrics.width
    const pillCx = pillLeft + pillW / 2
    const pillCy = pillTop + pillH / 2

    // Fallback artwork values to pill when DOM measurement isn't ready.
    if (artW == null) {
      artLeft = pillLeft; artTop = pillTop; artW = pillW; artH = pillH
      uuToPxArt = uuToPxPill
    } else {
      uuToPxArt = artW / metrics.width
      _uuToPxArt = uuToPxArt
    }
    if (!artRadiiPx) {
      const r = metrics.cornerRadii
      artRadiiPx = {
        tl: r.tl * uuToPxArt, tr: r.tr * uuToPxArt,
        br: r.br * uuToPxArt, bl: r.bl * uuToPxArt,
      }
    }

    // ---- Write CSS vars ----
    root.setProperty('--dummy-pill-left', `${pillLeft}px`)
    root.setProperty('--dummy-pill-top', `${pillTop}px`)
    root.setProperty('--dummy-pill-width', `${pillW}px`)
    root.setProperty('--dummy-pill-height', `${pillH}px`)

    root.setProperty('--dummy-art-left', `${artLeft}px`)
    root.setProperty('--dummy-art-top', `${artTop}px`)
    root.setProperty('--dummy-art-width', `${artW}px`)
    root.setProperty('--dummy-art-height', `${artH}px`)

    root.setProperty('--dummy-art-radius-tl', `${artRadiiPx.tl}px`)
    root.setProperty('--dummy-art-radius-tr', `${artRadiiPx.tr}px`)
    root.setProperty('--dummy-art-radius-br', `${artRadiiPx.br}px`)
    root.setProperty('--dummy-art-radius-bl', `${artRadiiPx.bl}px`)

    const artCx = artLeft + artW / 2
    const artCy = artTop + artH / 2
    const safariHiddenDx = pillCx - artCx
    const safariHiddenDy = pillCy - artCy
    const safariHiddenScaleX = artW > 0 ? (pillW / artW) * hiddenScale : hiddenScale
    const safariHiddenScaleY = artH > 0 ? (pillH / artH) * hiddenScale : hiddenScale
    root.setProperty('--dummy-safari-hidden-dx', `${safariHiddenDx}px`)
    root.setProperty('--dummy-safari-hidden-dy', `${safariHiddenDy}px`)
    root.setProperty('--dummy-safari-hidden-scale-x', `${safariHiddenScaleX}`)
    root.setProperty('--dummy-safari-hidden-scale-y', `${safariHiddenScaleY}`)

    // Blur is sized off the PILL (hidden-state) geometry — that's the
    // state the blur is applied in. Using artwork uuToPx would scale
    // the blur by the artwork's relative size, which isn't what we want.
    root.setProperty('--reveal-blur', `${blurUserUnits * uuToPxPill}px`)

    // Loading text uu \u2192 px (use pill scale: text is shown during hidden state).
    root.setProperty('--loading-text-size',
      `${loadingTextSizeUserUnits * uuToPxPill}px`)
    root.setProperty('--loading-text-shadow-y',
      `${loadingTextShadowOffsetUserUnits * uuToPxPill}px`)
    root.setProperty('--loading-text-shadow-blur',
      `${loadingTextShadowBlurUserUnits * uuToPxPill}px`)
  }

  //FUNC: setDirectionTiming(totalMs, isReveal) : void
  // Set per-phase duration + delay vars per CORRECTED spec table
  // 2026-04-30 v3 + phaseOffset:
  //   shapeDur   = phaseOffset * totalMs       (blur/scale/border-radius/bounds)
  //   opacityDur = (1−phaseOffset) * totalMs   (dummy opacity)
  //   REVEAL: shape phase first (delay 0),       opacity phase after (delay shapeDur)
  //   HIDE:   opacity phase first (delay 0),     shape phase after   (delay opacityDur)
  // Artwork opacity is an instantaneous flip scheduled by JS at the
  // phase boundary — NOT animated through CSS transitions.
  function setDirectionTiming(totalMs, isReveal) {
    const shapeDur = phaseOffset * totalMs
    const opacityDur = (1 - phaseOffset) * totalMs
    const root = document.documentElement.style
    root.setProperty('--phase-shape-duration', `${shapeDur}ms`)
    root.setProperty('--phase-opacity-duration', `${opacityDur}ms`)
    if (isReveal) {
      root.setProperty('--phase-shape-delay', `0ms`)
      root.setProperty('--phase-opacity-delay', `${shapeDur}ms`)
    } else {
      root.setProperty('--phase-opacity-delay', `0ms`)
      root.setProperty('--phase-shape-delay', `${opacityDur}ms`)
    }
  }

  //FUNC: getCurrentFrameMetrics() : { width, height, cornerRadii }
  // Read the current BackGrid's outer-shape metrics in user units.
  // Falls back to defaults during cold-load / between builds when no
  // BackGrid exists yet.
  function getCurrentFrameMetrics() {
    if (typeof BGRID !== 'undefined' && BGRID && BGRID.frameShapeMetrics) {
      return BGRID.frameShapeMetrics
    }
    return defaultFrameMetrics
  }

  //FUNC: ensureDummy() : void
  // Create + insert the dummy. Idempotent. Standalone fixed element
  // — not parented to anything else. Sizing is handled entirely
  // by CSS vars (`--dummy-pill-width/height` for hidden state,
  // `--dummy-art-width/height` for revealed). Visible from cold-load
  // against the body backdrop.
  //
  function ensureDummy() {
    if (isWebKitClass) return  // Safari path remains isolated for now
    if (_dummy && _dummy.parentNode) return
    if (!document.body) return
    ensureStyles()
    if (!_dummy) {
      _dummy = document.createElement('div')
      _dummy.id = 'reveal-dummy'
      if (isWebKitClass) _dummy.classList.add('safari-mode')
    }
    document.body.appendChild(_dummy)
  }

  //FUNC: prepArtwork() : void
  // Snap BG.elt to opacity 0 with NO transition, then arm an opacity
  // transition for the upcoming revealNow flip. ARTWORK ONLY ANIMATES
  // OPACITY — no scale, no blur (those live on the dummy). Inline-
  // style approach (vs class) sidesteps the CSS-spec edge case where
  // a freshly-applied class providing both the transition rule AND
  // the transitioning property has the transition suppressed.
  //
  function prepArtwork() {
    if (typeof BG === 'undefined' || !BG || !BG.elt) return
    _frameElt = BG.elt
    if (isWebKitClass) return
    const s = _frameElt.style
    s.transition = 'none'
    s.webkitTransition = 'none'
    s.willChange = 'opacity'
    s.opacity = '0'
    void _frameElt.offsetWidth
  }

  //FUNC: ensureSafariOverlay() : void
  // WebKit-only. Creates the entire Safari overlay DOM structure ONCE at
  // init, parented to <body> so it survives every ProtoBatch teardown.
  // Structure:
  //   #safari-overlay          root (position:fixed inset:0)
  //     #safari-dim            backdrop-filter dim+blur over artwork rect
  //     #safari-spinner-wrapper  spinner canvas (JS-positioned)
  //       #safari-spinner-canvas  pre-rendered blurred arc
  //     #safari-loading-text   "Safari may take longer…" text
  // All animations driven by toggling .building on #safari-overlay.
  function ensureSafariOverlay() {
    if (!isWebKitClass) return
    if (_safariOverlay && _safariOverlay.parentNode) return
    if (!document.body) return
    ensureStyles()

    _safariOverlay = document.createElement('div')
    _safariOverlay.id = 'safari-overlay'

    // No #safari-dim element — the persistent #reveal-dummy provides
    // the dim/blur visual (it's an opaque pill on a black body, blurred
    // via cheap filter:blur on flat color). The overlay only carries
    // the loading text + spinner.

    _safariSpinnerWrapper = document.createElement('div')
    _safariSpinnerWrapper.id = 'safari-spinner-wrapper'
    _safariOverlay.appendChild(_safariSpinnerWrapper)

    const txt = document.createElement('div')
    txt.id = 'safari-loading-text'
    txt.textContent = loadingTextCopy
    _safariOverlay.appendChild(txt)

    document.body.appendChild(_safariOverlay)

    // Build spinner canvas at cold-load scale (1px/uu); rebuilt after
    // each buildFromHash with the accurate artwork scale.
    _rebuildSafariSpinnerCanvas()
  }

  //FUNC: buildSafariSpinnerCanvas() : HTMLCanvasElement
  // Pre-renders the blurred arc into a canvas so CSS rotation is
  // compositor-only (no per-frame rasterization during animation).
  // Blur is applied via ctx.filter at draw time and baked into the
  // raster — the canvas element itself carries no CSS filter.
  function buildSafariSpinnerCanvas() {
    const uuToPx = _uuToPxArt || 1
    const diameterPx = safariSpinnerDiameterUu * uuToPx
    const strokePx = safariSpinnerStrokeUu * uuToPx
    const blurPx = safariSpinnerBlurUu * uuToPx
    // Padding: 3.5σ ensures the Gaussian tail doesn't clip at canvas edges.
    const padding = Math.ceil(blurPx * 3.5)
    const size = Math.ceil(diameterPx + strokePx + padding * 2)
    const dpr = Math.ceil(window.devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.id = 'safari-spinner-canvas'
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.filter = 'blur(' + blurPx + 'px)'
    ctx.strokeStyle = 'rgba(255,255,255,' + safariSpinnerStrokeAlpha + ')'
    ctx.lineWidth = strokePx
    ctx.lineCap = 'round'
    const cx = size / 2
    const cy = size / 2
    const radius = diameterPx / 2
    const startAngle = -Math.PI / 2 // 12 o'clock
    const endAngle = startAngle + 2 * Math.PI * safariSpinnerArcFraction
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.stroke()
    return canvas
  }

  //FUNC: _rebuildSafariSpinnerCanvas() : void
  // Rebuilds the pre-rendered spinner canvas at the current _uuToPxArt
  // scale. Called at init (scale = 1) and after each buildFromHash
  // completes (scale = actual artwork px/uu ratio).
  function _rebuildSafariSpinnerCanvas() {
    if (!_safariSpinnerWrapper) return
    _safariSpinnerWrapper.innerHTML = ''
    const canvas = buildSafariSpinnerCanvas()
    _safariSpinnerWrapper.appendChild(canvas)
    _safariSpinnerWrapper.style.width = canvas.style.width
    _safariSpinnerWrapper.style.height = canvas.style.height
    // Position centered on artwork rect (CSS vars updated by updateLayoutVars).
    const cs = getComputedStyle(document.documentElement)
    const artLeft = parseFloat(cs.getPropertyValue('--dummy-art-left')) || 0
    const artTop = parseFloat(cs.getPropertyValue('--dummy-art-top')) || 0
    const artW = parseFloat(cs.getPropertyValue('--dummy-art-width')) || 0
    const artH = parseFloat(cs.getPropertyValue('--dummy-art-height')) || 0
    _safariSpinnerWrapper.style.left = (artLeft + artW / 2) + 'px'
    _safariSpinnerWrapper.style.top = (artTop + artH / 2) + 'px'
  }

  //FUNC: armLoadingText() : void
  // No-op in new arch — overlay timing is CSS-driven via .building class.
  // Kept for API compatibility (called from legacy code paths during transition).
  function armLoadingText() { }

  //FUNC: disarmLoadingText() : void
  // No-op for Safari. Still called from the Chrome revealNow() path;
  // must remain safe to call on both engines.
  function disarmLoadingText() { }

  //FUNC: revealNowSafari() : void
  // Safari-specific reveal hook called from revealNow(). Removes .building
  // from the overlay so spinner+text fade out via their base transition
  // rules. The dummy reveal animation itself is handled by revealNow()
  // (unified path with Chrome).
  function revealNowSafari() {
    if (_safariOverlay) _safariOverlay.classList.remove('building')
    console.log('[RevealAnim] revealNowSafari: overlay .building removed')
  }

  //FUNC: hideNowSafari() : void
  // Safari-specific hide hook called from hideNow(). Adds .building to
  // the overlay so spinner+text fade in (after 2s animation-delay).
  // The dummy hide animation itself is handled by hideNow().
  function hideNowSafari() {
    if (_safariOverlay) _safariOverlay.classList.add('building')
    console.log('[RevealAnim] hideNowSafari: overlay .building added')
  }

  //FUNC: revealNow() : void
  // Forward direction (2-stage):
  //   stage 1 (0→halfDur):     dummy morphs pill→newArtShape, scale
  //                            0.5→1, blur blurUU→0
  //   stage 2 (halfDur→full):  artwork opacity 0→1
  // Sequence enforced by transition-delay alone (--dummy-delay = 0,
  // artwork inline transition delay = halfDur). Cancels any pending
  // loading text.
  //
  // Reads the *new* frame metrics from BGRID and writes them into
  // CSS vars before flipping the .revealed class — so the morph
  // tween targets the new shape.
  function revealNow() {
    if (isWebKitClass) return revealNowSafari()
    disarmLoadingText()
    _currentMetrics = getCurrentFrameMetrics()
    updateLayoutVars(_currentMetrics)
    setDirectionTiming(revealDurationMs, true)
    // Force a style recalc on the dummy BEFORE flipping .revealed so
    // Safari has the up-to-date --phase-* transition durations cached
    // against the element. Without this, Safari sometimes processes
    // the class flip with stale (or zero) transition durations and
    // snaps directly to the .revealed end-state.
    if (_dummy) {
      void _dummy.offsetWidth
      void getComputedStyle(_dummy).transition
    }
    if (_dummy) _dummy.classList.add('revealed')
    if (_dummy) {
      const cs = getComputedStyle(document.documentElement)
      const dcs = getComputedStyle(_dummy)
      console.log('[RevealAnim] revealNow phase vars',
        'shape-dur=', cs.getPropertyValue('--phase-shape-duration').trim(),
        'shape-delay=', cs.getPropertyValue('--phase-shape-delay').trim(),
        'opacity-dur=', cs.getPropertyValue('--phase-opacity-duration').trim(),
        'opacity-delay=', cs.getPropertyValue('--phase-opacity-delay').trim(),
        'transition=', dcs.transition,
      )
    }
    const myToken = _buildToken
    const flipAt = phaseOffset * revealDurationMs
    setTimeout(() => {
      if (myToken !== _buildToken) return
      if (!_frameElt) return
      const s = _frameElt.style
      s.transition = 'none'
      s.webkitTransition = 'none'
      s.opacity = '1'
    }, flipAt)
    setTimeout(() => {
      if (myToken === _buildToken) _rebuildInFlight = false
    }, revealDurationMs)
  }

  //FUNC: hideNow() : void
  // Reverse direction (2-stage):
  //   stage 1 (0→halfDur):     artwork opacity 1→0
  //   stage 2 (halfDur→full):  dummy morphs currentArtShape→pill,
  //                            scale 1→0.5, blur 0→blurUU
  // Triggered the instant 'n' is pressed — BEFORE buildFromNewSeed
  // runs — so Safari's ~10s synchronous SVG paint happens behind a
  // fully-faded dummy.
  //
  // Captures the CURRENT (about-to-be-replaced) frame metrics so the
  // dummy's stage-2 morph starts from the shape of the artwork that
  // was just displayed (not the next one).
  function hideNow() {
    if (isWebKitClass) return hideNowSafari()
    _currentMetrics = getCurrentFrameMetrics()
    updateLayoutVars(_currentMetrics)
    setDirectionTiming(hideDurationMs, false)
    if (_dummy) {
      void _dummy.offsetWidth
      void getComputedStyle(_dummy).transition
    }
    if (_dummy) _dummy.classList.remove('revealed')
    const myToken = _buildToken
    const flipAt = (1 - phaseOffset) * hideDurationMs
    setTimeout(() => {
      if (myToken !== _buildToken) return
      if (!_frameElt) return
      const s = _frameElt.style
      s.transition = 'none'
      s.webkitTransition = 'none'
      s.opacity = '0'
    }, flipAt)
  }

  //FUNC: resetForRebuild() : void
  // Bumps the build token. Called from the patched teardown() hook.
  // The .building class stays on throughout teardown+build; only
  // revealNowSafari() removes it after the build settles.
  function resetForRebuild() {
    _buildToken++
    _frameElt = null
  }

  //SECT: Hook ProtoBatch + p5 lifecycle
  function installHooks() {
    if (typeof ProtoBatch === 'undefined') return false

    const origBuild = ProtoBatch.prototype.buildFromHash
    const origTeardown = ProtoBatch.prototype.teardown

    ProtoBatch.prototype.buildFromHash = function (hash) {
      _buildToken++
      ensureDummy()
      // Chrome only: reset dummy to pill geometry before build.
      // Safari keeps its own path isolated for now.
      if (!isWebKitClass) updateLayoutVars(defaultFrameMetrics)

      const result = origBuild.apply(this, arguments)

      // Stop animation on Safari — bitmap-quality matters more than
      // motion when each frame costs 10s.
      if (isWebKitClass && typeof globalControls !== 'undefined' && globalControls) {
        globalControls.animated = false
      }

      // Prep artwork synchronously so the live SVG never reaches the
      // screen sharp/visible.
      prepArtwork()
      // Re-sync layout vars from the freshly-built BackGrid so the
      // dummy's revealed-state geometry matches the new artwork.
      updateLayoutVars(getCurrentFrameMetrics())

      // Safari: rebuild spinner canvas at accurate artwork scale now that
      // _uuToPxArt has been updated by updateLayoutVars above.
      if (isWebKitClass) _rebuildSafariSpinnerCanvas()

      // Yield to compositor before triggering reveal. Chrome uses
      // 3× rAF (post-build paint commits within ~50ms). Safari needs
      // a wall-clock settle (rAF can stall during post-rasterization
      // compositing on a freshly-built complex SVG).
      const myToken = _buildToken
      if (isWebKitClass) {
        setTimeout(() => {
          if (myToken !== _buildToken) return
          revealNow()
        }, safariBuildSettleMs)
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
          if (myToken !== _buildToken) return
          revealNow()
        })))
      }

      return result
    }

    ProtoBatch.prototype.teardown = function () {
      resetForRebuild()
      return origTeardown.apply(this, arguments)
    }

    console.log(
      '[RevealAnim] hooks installed; isWebKitClass =', isWebKitClass,
    )

    // Backup keydown handler at the window level. p5's keyPressed() can
    // miss keys on Safari when focus drifts during a long synchronous
    // SVG paint or when key events queue up during the ~10s rasterization.
    // Listening on window directly bypasses focus quirks entirely.
    //
    // Uses CAPTURE phase so this handler runs BEFORE p5's document-level
    // keydown listener — we can stopImmediatePropagation() to prevent
    // double-firing through gui.js's keyPressed().
    if (!window._revealKeyHookInstalled) {
      window._revealKeyHookInstalled = true
      window.addEventListener('keydown', (e) => {
        const t = e.target
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        if (e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key === 'n' || e.key === 'N') {
          if (typeof protoBatch !== 'undefined' && protoBatch) {
            // Debounce check FIRST — before blocking any other handlers.
            // The original bug was calling stopImmediatePropagation() before
            // this check: when stuck true, it silently ate every 'n' press.
            if (_rebuildInFlight) {
              e.preventDefault()
              e.stopImmediatePropagation()
              return
            }
            _rebuildInFlight = true
            e.preventDefault()
            e.stopImmediatePropagation()

            if (isWebKitClass) return

            hideNow()
            setTimeout(() => {
              if (typeof protoBatch !== 'undefined' && protoBatch) {
                protoBatch.buildFromNewSeed()
              }
            }, hideDurationMs)
          }
        }
      }, true)
    }

    return true
  }

  //SECT: Initialization
  function init() {
    ensureStyles()
    ensureDummy()
    if (isWebKitClass) ensureSafariOverlay()
    updateLayoutVars(defaultFrameMetrics)
    window.addEventListener('resize', () => {
      updateLayoutVars(_currentMetrics)
    })
    if (!installHooks()) {
      // ProtoBatch not yet defined — defer.
      const retry = () => { if (installHooks()) document.removeEventListener('DOMContentLoaded', retry) }
      document.addEventListener('DOMContentLoaded', retry)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  //SECT: Public API
  window.SafariCompatUX = {
    isSafari,
    isWebKitClass,
    revealNow,
    hideNow,
    resetForRebuild,
    // Expose tunables for live RA6 iteration from the console.
    tunables: {
      get revealDurationMs() { return revealDurationMs },
      get hideDurationMs() { return hideDurationMs },
      get phaseOffset() { return phaseOffset },
      get hiddenScale() { return hiddenScale },
      get safariOverlayDelayMs() { return safariOverlayDelayMs },
      get safariOverlayFadeMs() { return safariOverlayFadeMs },
      get safariBlurPx() { return safariBlurPx },
      get safariDimBrightness() { return safariDimBrightness },
      get safariDimFadeMs() { return safariDimFadeMs },
      get safariBlurRevealMs() { return safariBlurRevealMs },
      get safariSpinnerDiameterUu() { return safariSpinnerDiameterUu },
      get safariSpinnerStrokeUu() { return safariSpinnerStrokeUu },
      get safariSpinnerStrokeAlpha() { return safariSpinnerStrokeAlpha },
      get safariSpinnerArcFraction() { return safariSpinnerArcFraction },
      get safariSpinnerBlurUu() { return safariSpinnerBlurUu },
      get safariSpinnerRevolutionMs() { return safariSpinnerRevolutionMs },
      get loadingTextSizeUserUnits() { return loadingTextSizeUserUnits },
      get loadingTextShadowOffsetUserUnits() { return loadingTextShadowOffsetUserUnits },
      get loadingTextShadowBlurUserUnits() { return loadingTextShadowBlurUserUnits },
    },
  }
})()
