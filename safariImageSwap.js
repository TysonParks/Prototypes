// safariImageSwap.js
// ---------------------------------------------------------------------------
// Reveal Animation + Safari/WebKit UX module.
//
// Filename retained from earlier canvas-image-swap experiment to avoid
// index.html churn. Module's actual role is the "reveal animation"
// system described in ROADMAP.md § "Reveal Animation Tuning":
//
//   E2 Spinner   — currently disabled; the old canvas/transform ring was
//                  more compositor-friendly than dummy border-radius motion.
//   E3 "Loading" text — WebKit-class loading copy shown during the
//                       synchronous build window.
//   E4 Dummy backing — solid color rect that morphs to mirror the
//                      current artwork's outer shape (read from
//                      Grid.frameShapeMetrics on the BackGrid).
//                      Carries ALL animated properties: width/height,
//                      per-corner border-radius, scale, blur. Default
//                      hidden state is the 100×200uu pill.
//   E1 Artwork (BG.elt) — Chrome two-phase reference path animates opacity.
//                         Chrome single-phase animates artwork scale and uses
//                         one shared wrapper blur for artwork + dummy.
//                         Safari keeps BG.elt opacity-only so WebKit never
//                         rasterizes the complex SVG at hidden scale.
//
// Chrome reference choreography (per user spec table 2026-04-30 v4):
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
// Safari ArtBlocks submission path uses only the first page load:
// persistent hidden dummy + loading overlay during WebKit's slow build,
// followed by a single reveal. Safari dynamic 'n' rebuilds are disabled.
//
// Engine detection (KNOWN-ISSUES § 9.17 FC2): UA-detects Safari + any
// iOS browser as "WebKit-class" since pre-EU-DMA iOS forces all
// browsers onto WebKit anyway.
//
// Public API (window.SafariCompatUX):
//   .isSafari            true if UA-detected WebKit-class
//   .isWebKitClass       alias of isSafari
//   .chromeTransitionVariant current Chrome reveal variant
//   .setChromeTransitionVariant('two-phase' | 'single-phase')
//   .revealNow()         force-trigger reveal (debug)
//   .hideNow()           force-trigger hide (debug; Chrome only)
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

  //SECT: Chrome reference lock
  // Last user-confirmed ideal Chrome reveal/hide state (2026-05-03).
  // Safari work must NOT mutate these values or repurpose them as a
  // shared tuning surface. If Chrome regresses, restore from this
  // object first and only then resume Safari experimentation.
  const CHROME_REFERENCE_PRESET = Object.freeze({
    blurUserUnits: 20,
    revealDurationMs: 800,
    hideDurationMs: 800,
    phaseOffset: 0.5,
    hiddenScale: 0.5,
  })

  const CHROME_TRANSITION_VARIANTS = Object.freeze({
    TWO_PHASE: 'two-phase',
    SINGLE_PHASE: 'single-phase',
  })
  const ROTATION_RELOAD_MODES = Object.freeze({
    NEUTRAL_RESET: 'neutral-reset',
    PRE_ROTATE_DUMMY: 'pre-rotate-dummy',
    HORIZONTAL_MORPH_RESET: 'horizontal-morph-reset',
  })
  const DEFAULT_CHROME_TRANSITION_VARIANT = CHROME_TRANSITION_VARIANTS.SINGLE_PHASE
  let chromeTransitionVariant = DEFAULT_CHROME_TRANSITION_VARIANT
  let rotationReloadMode = ROTATION_RELOAD_MODES.NEUTRAL_RESET

  //SECT: Chrome shared variables
  const blurUserUnits = CHROME_REFERENCE_PRESET.blurUserUnits // dummy hidden-state blur in uu
  const revealDurationMs = CHROME_REFERENCE_PRESET.revealDurationMs // forward TOTAL duration
  const hideDurationMs = CHROME_REFERENCE_PRESET.hideDurationMs // reverse TOTAL duration
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
  const phaseOffset = CHROME_REFERENCE_PRESET.phaseOffset

  //SECT: Chrome two-phase reference variables
  const hiddenScale = CHROME_REFERENCE_PRESET.hiddenScale // dummy hidden-state scale (focus-pull / DOF feel)

  //SECT: Chrome single-phase variant variables
  let chromeArtworkHiddenScale = 0.4  // smaller than dummy so artwork stays behind rounded dummy corners
  let chromeDummyPulseAmount = 0.05    // absolute scale +/- around hiddenScale while Chrome is hidden
  let chromeDummyPulseMs = 4000        // full hidden dummy pulse loop duration (ms)
  let chromeHiddenPulseHoldMs = 50     // visible pulse hold before Chrome starts a new build
  // CSS timing functions for Chrome dummy opacity only.
  // Examples: 'ease-out', 'ease-in', 'cubic-bezier(0.33, 1, 0.68, 1)'.
  let chromeDummyOpacityRevealEasing = 'linear(0,.2,.4,.5,1)'
  let chromeDummyOpacityHideEasing = 'linear(0,.5,.6,.8,1)'
  // CSS timing functions for Chrome artwork scale only.
  // Examples: 'ease-out', 'ease-in', 'cubic-bezier(0.33, 1, 0.68, 1)'.
  let chromeArtworkScaleRevealEasing = 'linear(0,.4,.6,.8,1)'
  let chromeArtworkScaleHideEasing = 'linear(0,.2,.4,.6,1)'

  //SECT: Safari-only variables
  // Safari uses its own isolated choreography. Do not route these
  // through CHROME_REFERENCE_PRESET; Chrome is locked as reference.
  const safariTransitionMs = 1000       // single-phase hide/reveal duration (ms)
  const safariBlurUserUnits = 30        // Safari hidden-state dummy blur in uu
  // Overlay values — initial values; all also exposed as CSS vars (--safari-*)
  // so they can be adjusted live in DevTools without reload.
  const safariBlurPx = 20               // legacy/API var; Rev 4 blur is --reveal-blur
  const safariDimBrightness = 0.5       // legacy/API var; no backdrop dim layer in Rev 4
  const safariDimFadeMs = 200           // legacy/API var retained for DevTools compatibility
  const safariBlurRevealMs = 800        // legacy/API var retained for DevTools compatibility
  const safariOverlayFadeMs = 1000      // fade duration for loading text (ms)
  const safariArtworkPrepaintOpacity = 0.001 // force normal-size paint before scale reveal
  let safariDummyPulseAmount = 0.05     // absolute scale +/- around hiddenScale while loading
  let safariDummyPulseMs = 2000         // hidden dummy scale pulse duration (ms)
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
    'Safari and iOS browsers may\n take significantly longer\n and render slightly differently.\n\n' +
    'Chrome desktop is the reference execution environment for Prototypes.'

  //SECT: State
  let _dummy = null
  let _chromeBlurLayer = null                     // Chrome single-phase shared blur wrapper
  let _frameElt = null                           // current BG.elt ref
  let _buildToken = 0                            // bumped on each build; cancels stale timers/transitions
  // Chrome 'n'-keypress debounce — true from the moment a build starts until
  // its reveal animation has fully completed. Safari ignores 'n' entirely;
  // it only uses this during cold-load reveal bookkeeping.
  let _rebuildInFlight = true
  let _reloadRotationSnapshot = null
  let _neutralHorizontalHiddenPill = null
  let _currentMetrics = defaultFrameMetrics      // last applied frame metrics (used as hide-stage-2 START shape)
  // Safari persistent overlay — created once at init(), NEVER destroyed.
  // Survives every ProtoBatch teardown/rebuild cycle (BG.elt does not).
  // Safari loading text uses .building; hidden pulse lives on #safari-dummy-core.
  let _safariOverlay = null                      // #safari-overlay root element
  let _safariDummy = null                        // #safari-dummy visual cover/morph layer
  let _uuToPxArt = 1                             // uu→px scale for current artwork (updated in updateLayoutVars)

  //FUNC: ensureStyles() : void
  // Inject CSS once. The dummy carries ALL visible dummy properties:
  // width/height (uu → px via JS-set CSS vars), per-corner
  // border-radius, transform (scale), filter (blur). Chrome single-phase
  // artwork state is driven inline so it can scale with the dummy; shared
  // Chrome single-phase blur lives on #chrome-reveal-blur-layer.
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
          /* Hidden-state radius. JS sets this to half the pill width so
            border-radius interpolation stays visible throughout morphs. */
          --dummy-pill-radius: 50px;

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
        --dummy-rotation: 0deg;

          /* Safari compositor-only geometry path: keep layout pinned to
            the artwork rect and tween the hidden pill via transform. */
          --dummy-safari-hidden-dx: 0px;
          --dummy-safari-hidden-dy: 0px;
          --dummy-safari-hidden-scale-x: 1;
          --dummy-safari-hidden-scale-y: 1;

        /* Safari overlay values — initial values set from JS constants above.
           All adjustable live in DevTools (change on :root) without reload. */
        --safari-blur-px: ${safariBlurPx}px;
        --safari-dim-brightness: ${safariDimBrightness};
        --safari-dim-fade-ms: ${safariDimFadeMs}ms;
        --safari-blur-reveal-ms: ${safariBlurRevealMs}ms;
        --safari-transition-ms: ${safariTransitionMs}ms;
        --safari-overlay-fade-ms: ${safariOverlayFadeMs}ms;
        --safari-dummy-pulse-ms: ${safariDummyPulseMs}ms;
        --safari-dummy-pulse-scale-min: ${(hiddenScale - safariDummyPulseAmount) / hiddenScale};
        --safari-dummy-pulse-scale-max: ${(hiddenScale + safariDummyPulseAmount) / hiddenScale};
        --chrome-dummy-pulse-ms: ${chromeDummyPulseMs}ms;
        --chrome-dummy-pulse-scale-min: ${(hiddenScale - chromeDummyPulseAmount) / hiddenScale};
        --chrome-dummy-pulse-scale-max: ${(hiddenScale + chromeDummyPulseAmount) / hiddenScale};
        --chrome-pulse-handoff-ms: ${revealDurationMs}ms;
        --chrome-dummy-opacity-easing: linear;
      }

      /* Chrome single-phase shared blur layer. This wrapper blurs the
         already-composited artwork + dummy once, avoiding stacked blur from
         two separately filtered layers. */
      #chrome-reveal-blur-layer {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        overflow: visible;
        pointer-events: none;
        filter: none;
        -webkit-filter: none;
        transition:
          filter         var(--phase-shape-duration) linear var(--phase-shape-delay),
          -webkit-filter var(--phase-shape-duration) linear var(--phase-shape-delay);
        will-change: filter;
      }
      #chrome-reveal-blur-layer #BG,
      #chrome-reveal-blur-layer #bleed {
        pointer-events: auto;
      }
      #chrome-reveal-blur-layer.chrome-blur-hidden {
        filter: blur(var(--reveal-blur));
        -webkit-filter: blur(var(--reveal-blur));
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
        background: transparent;
        border-radius: var(--dummy-pill-radius);
        opacity: 1;
        transform-origin: center center;
        transform: translateZ(0) rotate(var(--dummy-rotation)) scale(var(--hidden-scale));
        filter: blur(var(--reveal-blur));
        -webkit-filter: blur(var(--reveal-blur));
        transition:
          opacity        var(--phase-opacity-duration) var(--chrome-dummy-opacity-easing) var(--phase-opacity-delay),
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
      #reveal-dummy-core {
        position: absolute;
        inset: 0;
        background: ${dummyColor};
        border-radius: var(--dummy-pill-radius);
        transform-origin: center center;
        transform: translateZ(0) scale(1);
        transition:
          transform var(--chrome-pulse-handoff-ms) linear,
          border-radius var(--phase-shape-duration) linear var(--phase-shape-delay);
        will-change: transform;
        pointer-events: none;
      }
      #reveal-dummy.chrome-hidden-pulse:not(.revealed) #reveal-dummy-core {
        animation: chrome-dummy-scale-pulse var(--chrome-dummy-pulse-ms) linear infinite;
      }
      #reveal-dummy.revealed {
        left:   var(--dummy-art-left);
        top:    var(--dummy-art-top);
        width:  var(--dummy-art-width);
        height: var(--dummy-art-height);
        border-radius:
          var(--dummy-art-radius-tl) var(--dummy-art-radius-tr)
          var(--dummy-art-radius-br) var(--dummy-art-radius-bl);
        transform: translateZ(0) rotate(var(--dummy-rotation)) scale(1);
        opacity: 0;
        filter: blur(0);
        -webkit-filter: blur(0);
      }
      :root[data-chrome-reveal-variant="single-phase"] #reveal-dummy,
      :root[data-chrome-reveal-variant="single-phase"] #reveal-dummy.revealed {
        filter: none;
        -webkit-filter: none;
      }
      #reveal-dummy.revealed #reveal-dummy-core {
        animation: none;
        border-radius:
          var(--dummy-art-radius-tl) var(--dummy-art-radius-tr)
          var(--dummy-art-radius-br) var(--dummy-art-radius-bl);
        transform: translateZ(0) scale(1);
      }
      @keyframes chrome-dummy-scale-pulse {
        0%   { transform: translateZ(0) scale(1); }
        25%  { transform: translateZ(0) scale(var(--chrome-dummy-pulse-scale-max)); }
        75%  { transform: translateZ(0) scale(var(--chrome-dummy-pulse-scale-min)); }
        100% { transform: translateZ(0) scale(1); }
      }

      /* === SAFARI DUMMY (WebKit-only, independent of Chrome) ===
         This is intentionally NOT #reveal-dummy. Chrome owns that path.
         Safari gets a separate persistent layer so experiments cannot
         alter the reference Chrome choreography.

         Hidden/default state: blurred, scaled-down default pill at opacity 1.
         Revealed state: measured artwork shape at opacity 0, blur 0, scale 1.
         Every property animates in one phase over --safari-transition-ms. */
      #safari-dummy {
        position: fixed;
        left:   var(--dummy-pill-left);
        top:    var(--dummy-pill-top);
        width:  var(--dummy-pill-width);
        height: var(--dummy-pill-height);
        background: transparent;
        border-radius: var(--dummy-pill-radius);
        opacity: 1;
        transform-origin: center center;
        transform: translateZ(0) scale(var(--hidden-scale));
        filter: blur(var(--reveal-blur));
        -webkit-filter: blur(var(--reveal-blur));
        transition:
          opacity        var(--safari-transition-ms) linear,
          transform      var(--safari-transition-ms) linear,
          filter         var(--safari-transition-ms) linear,
          -webkit-filter var(--safari-transition-ms) linear,
          border-radius  var(--safari-transition-ms) linear,
          left           var(--safari-transition-ms) linear,
          top            var(--safari-transition-ms) linear,
          width          var(--safari-transition-ms) linear,
          height         var(--safari-transition-ms) linear;
        will-change: transform, border-radius, opacity, filter, left, top, width, height;
        z-index: 80;
        pointer-events: none;
      }
      #safari-dummy-core {
        position: absolute;
        inset: 0;
        background: ${dummyColor};
        border-radius: inherit;
        transform-origin: center center;
        transform: translateZ(0) scale(1);
        transition: border-radius var(--safari-transition-ms) linear;
        will-change: transform;
        pointer-events: none;
      }
      #safari-dummy.safari-hidden-pulse:not(.revealed) #safari-dummy-core {
        animation: safari-dummy-scale-pulse var(--safari-dummy-pulse-ms) linear infinite alternate;
      }
      #safari-dummy.revealed {
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
      #safari-dummy.revealed #safari-dummy-core {
        animation: none;
        transform: translateZ(0) scale(1);
      }
      @keyframes safari-dummy-scale-pulse {
        from { transform: translateZ(0) scale(var(--safari-dummy-pulse-scale-max)); }
        to   { transform: translateZ(0) scale(var(--safari-dummy-pulse-scale-min)); }
      }

      .reveal-no-blur #reveal-dummy,
      .reveal-no-blur #reveal-dummy.revealed,
      .reveal-no-blur #safari-dummy,
      .reveal-no-blur #safari-dummy.revealed {
        filter: none !important;
        -webkit-filter: none !important;
      }

      /* === SAFARI OVERLAY (WebKit-only) ===
         A single persistent overlay element rooted at <body>. It is NEVER
         removed — it survives every ProtoBatch teardown/rebuild cycle.
         Carries ONLY the loading text. The hide/reveal visual is handled by
         #safari-dummy plus Safari-only artwork opacity.

         Safari loading text is driven by a single class toggle:
         #safari-overlay.building.

         Loading UI is shown immediately while .building is present. Earlier
         delayed keyframe variants were unreliable on WebKit cold-load because
         the animation start could be coalesced with the sync SVG build. */

      /* Overlay root: full-screen fixed, just a coordinate container */
      #safari-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        pointer-events: none;
      }

      /* === LOADING TEXT === */
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
        opacity: 1;
        transition: none;
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

  function rotationReloadSnapshot() {
    if (_reloadRotationSnapshot) return _reloadRotationSnapshot
    if (typeof artworkRotationSnapshot !== 'function') {
      return { angle: 0, rawAngle: 0, scale: 1, isSideways: false }
    }
    return artworkRotationSnapshot()
  }

  function latchReloadRotationSnapshot() {
    _reloadRotationSnapshot = typeof artworkRotationSnapshot === 'function'
      ? artworkRotationSnapshot()
      : null
  }

  function clearReloadRotationSnapshot() {
    _reloadRotationSnapshot = null
    _neutralHorizontalHiddenPill = null
  }

  function isNeutralHorizontalReloadActive() {
    const snap = rotationReloadSnapshot()
    return !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
      && snap.isSideways
  }

  function captureNeutralHorizontalHiddenPill() {
    if (!isNeutralHorizontalReloadActive()) return
    const style = getComputedStyle(document.documentElement)
    const width = parseFloat(style.getPropertyValue('--dummy-pill-width'))
    const height = parseFloat(style.getPropertyValue('--dummy-pill-height'))
    if (!Number.isFinite(width) || !Number.isFinite(height)) return
    _neutralHorizontalHiddenPill = { width, height }
  }

  function isUpsideDownReloadRotation() {
    return normalizeReloadAngle(rotationReloadSnapshot().angle) === 180
  }

  function normalizeReloadAngle(angle) {
    const n = Number(angle)
    if (!Number.isFinite(n)) return 0
    return ((Math.round(n / 90) * 90) % 360 + 360) % 360
  }

  function isPreRotatedReloadActive() {
    const snap = rotationReloadSnapshot()
    return !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.PRE_ROTATE_DUMMY
      && snap.isSideways
  }

  function setRotationReloadMode(value) {
    const next = String(value || '').toLowerCase()
    const allowed = Object.values(ROTATION_RELOAD_MODES)
    if (!allowed.includes(next)) {
      console.warn('[RevealAnim] unknown rotation reload mode:', value,
        'expected one of:', allowed.join(', '))
      return rotationReloadMode
    }
    rotationReloadMode = next
    updateLayoutVars(_currentMetrics)
    console.log('[RevealAnim] rotation reload mode =', next)
    return rotationReloadMode
  }

  function rotatedRectBaseFromVisual(left, top, width, height) {
    const cx = left + width / 2
    const cy = top + height / 2
    return {
      left: cx - height / 2,
      top: cy - width / 2,
      width: height,
      height: width,
    }
  }

  function rotateCornerRadii(radii, angle) {
    const deg = ((Math.round(angle / 90) * 90) % 360 + 360) % 360
    if (deg === 90) {
      return { tl: radii.bl, tr: radii.tl, br: radii.tr, bl: radii.br }
    }
    if (deg === 180) {
      return { tl: radii.br, tr: radii.bl, br: radii.tl, bl: radii.tr }
    }
    if (deg === 270) {
      return { tl: radii.tr, tr: radii.br, br: radii.bl, bl: radii.tl }
    }
    return radii
  }

  function shouldResetRotationAfterHorizontalReload() {
    const snap = rotationReloadSnapshot()
    return !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.HORIZONTAL_MORPH_RESET
      && snap.isSideways
  }

  function shouldPreserveNeutralHorizontalHiddenPill() {
    return isNeutralHorizontalReloadActive()
      && _dummy
      && !_dummy.classList.contains('revealed')
  }

  function prepRotationForReloadBuild() {
    if (rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET) {
      if (isUpsideDownReloadRotation()
        && typeof resetArtworkRotationToDefault === 'function') {
        resetArtworkRotationToDefault()
        clearReloadRotationSnapshot()
        updateLayoutVarsWithoutDummyTransition(defaultFrameMetrics)
      }
      return
    }
    if (!shouldResetRotationAfterHorizontalReload()) return
    if (typeof resetArtworkRotationToDefault === 'function') resetArtworkRotationToDefault()
    clearReloadRotationSnapshot()
    updateLayoutVarsWithoutDummyTransition(defaultFrameMetrics)
  }

  function syncArtworkRotationBeforeRevealLayout() {
    const shouldSync = isPreRotatedReloadActive()
      || (!isWebKitClass
        && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
        && rotationReloadSnapshot().isSideways)
    if (!shouldSync) return
    if (typeof syncArtworkRotationToViewport === 'function') syncArtworkRotationToViewport()
  }

  function updateLayoutVarsWithoutDummyTransition(metrics = _currentMetrics) {
    if (!_dummy) return updateLayoutVars(metrics)
    const oldTransition = _dummy.style.transition
    const oldWebkitTransition = _dummy.style.webkitTransition
    _dummy.style.transition = 'none'
    _dummy.style.webkitTransition = 'none'
    updateLayoutVars(metrics)
    void _dummy.offsetWidth
    void getComputedStyle(_dummy).transform
    _dummy.style.transition = oldTransition
    _dummy.style.webkitTransition = oldWebkitTransition
  }

  function syncRevealLayoutToArtwork() {
    if (isWebKitClass) return
    _currentMetrics = getCurrentFrameMetrics()
    updateLayoutVarsWithoutDummyTransition(_currentMetrics)
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
    const rotationSnap = rotationReloadSnapshot()
    const usePreRotatedDummy = !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.PRE_ROTATE_DUMMY
      && rotationSnap.isSideways
    const useNeutralHorizontalDummy = !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.NEUTRAL_RESET
      && rotationSnap.isSideways
    const useHorizontalMorphReset = !isWebKitClass
      && rotationReloadMode === ROTATION_RELOAD_MODES.HORIZONTAL_MORPH_RESET
      && rotationSnap.isSideways

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
    let pillW = Math.min(fs.x * (9 / 11), window.innerWidth * 0.9)
    let pillH = pillW * (defaultFrameMetrics.height / defaultFrameMetrics.width)
    if (usePreRotatedDummy) {
      const visualW = Math.min(fs.y * (rotationSnap.scale || 1), window.innerWidth * 0.98)
      pillH = visualW
      pillW = visualW * (defaultFrameMetrics.width / defaultFrameMetrics.height)
    }
    if (useNeutralHorizontalDummy) {
      const visualW = Math.min(pillH, window.innerWidth * 0.98)
      pillW = visualW
      pillH = visualW * (defaultFrameMetrics.width / defaultFrameMetrics.height)
    } else if (useHorizontalMorphReset) {
      const baseW = pillW
      pillW = pillH
      pillH = baseW
    }
    let uuToPxPill = pillW / ((useNeutralHorizontalDummy || useHorizontalMorphReset)
      ? defaultFrameMetrics.height : defaultFrameMetrics.width)
    let pillLeft = (window.innerWidth - pillW) / 2
    let pillTop = (window.innerHeight - pillH) / 2
    let pillCx = pillLeft + pillW / 2
    let pillCy = pillTop + pillH / 2

    function syncPillPlacement() {
      uuToPxPill = pillW / ((useNeutralHorizontalDummy || useHorizontalMorphReset)
        ? defaultFrameMetrics.height : defaultFrameMetrics.width)
      pillLeft = (window.innerWidth - pillW) / 2
      pillTop = (window.innerHeight - pillH) / 2
      pillCx = pillLeft + pillW / 2
      pillCy = pillTop + pillH / 2
    }

    if (artW == null && typeof BG !== 'undefined' && BG && BG.elt) {
      const bgRect = BG.elt.getBoundingClientRect && BG.elt.getBoundingClientRect()
      if (bgRect && bgRect.width > 0 && bgRect.height > 0) {
        artLeft = bgRect.left
        artTop = bgRect.top
        artW = bgRect.width
        artH = bgRect.height
      }
    }

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

    if (usePreRotatedDummy && artW != null) {
      const baseRect = rotatedRectBaseFromVisual(artLeft, artTop, artW, artH)
      artLeft = baseRect.left
      artTop = baseRect.top
      artW = baseRect.width
      artH = baseRect.height
    } else if ((useNeutralHorizontalDummy || useHorizontalMorphReset) && artRadiiPx) {
      artRadiiPx = rotateCornerRadii(artRadiiPx, rotationSnap.angle)
    }

    if (useNeutralHorizontalDummy && artW != null && artW > pillW) {
      pillW = Math.min(artW, window.innerWidth * 0.98)
      pillH = pillW * (defaultFrameMetrics.width / defaultFrameMetrics.height)
      syncPillPlacement()
    }

    if (useNeutralHorizontalDummy
      && shouldPreserveNeutralHorizontalHiddenPill()
      && _neutralHorizontalHiddenPill) {
      pillW = Math.min(_neutralHorizontalHiddenPill.width, window.innerWidth * 0.98)
      pillH = _neutralHorizontalHiddenPill.height
      syncPillPlacement()
    }

    // ---- Write CSS vars ----
    root.setProperty('--dummy-rotation', `${usePreRotatedDummy ? rotationSnap.angle : 0}deg`)
    root.setProperty('--dummy-pill-left', `${pillLeft}px`)
    root.setProperty('--dummy-pill-top', `${pillTop}px`)
    root.setProperty('--dummy-pill-width', `${pillW}px`)
    root.setProperty('--dummy-pill-height', `${pillH}px`)
    root.setProperty('--dummy-pill-radius', `${Math.min(pillW, pillH) / 2}px`)

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
    const activeBlurUserUnits = isWebKitClass ? safariBlurUserUnits : blurUserUnits
    const revealBlurPx = Math.max(0, activeBlurUserUnits * uuToPxPill)
    root.setProperty('--reveal-blur', `${revealBlurPx}px`)
    document.documentElement.classList.toggle('reveal-no-blur', revealBlurPx <= 0)

    // Loading text uu \u2192 px (use pill scale: text is shown during hidden state).
    root.setProperty('--loading-text-size',
      `${loadingTextSizeUserUnits * uuToPxPill}px`)
    root.setProperty('--loading-text-shadow-y',
      `${loadingTextShadowOffsetUserUnits * uuToPxPill}px`)
    root.setProperty('--loading-text-shadow-blur',
      `${loadingTextShadowBlurUserUnits * uuToPxPill}px`)
  }

  function setChromeTransitionVariant(value) {
    const next = String(value || '').toLowerCase()
    const allowed = Object.values(CHROME_TRANSITION_VARIANTS)
    if (!allowed.includes(next)) {
      console.warn('[RevealAnim] unknown Chrome transition variant:', value,
        'expected one of:', allowed.join(', '))
      return chromeTransitionVariant
    }
    chromeTransitionVariant = next
    if (document && document.documentElement) {
      document.documentElement.setAttribute('data-chrome-reveal-variant', next)
    }
    if (next === CHROME_TRANSITION_VARIANTS.SINGLE_PHASE) {
      updateChromeDummyPulseVars()
      if (_dummy && !_dummy.classList.contains('revealed')) startChromeHiddenPulse()
    } else {
      stopChromeHiddenPulse()
    }
    console.log('[RevealAnim] Chrome transition variant =', next)
    return chromeTransitionVariant
  }

  function isChromeSinglePhase() {
    return !isWebKitClass && chromeTransitionVariant === CHROME_TRANSITION_VARIANTS.SINGLE_PHASE
  }

  //FUNC: setDirectionTiming(totalMs, isReveal) : void
  // Set per-phase duration + delay vars per CORRECTED spec table
  // 2026-04-30 v3 + phaseOffset:
  //   shapeDur   = phaseOffset * totalMs       (blur/scale/border-radius/bounds)
  //   opacityDur = (1−phaseOffset) * totalMs   (dummy opacity)
  //   REVEAL: shape phase first (delay 0),       opacity phase after (delay shapeDur)
  //   HIDE:   opacity phase first (delay 0),     shape phase after   (delay opacityDur)
  // Chrome two-phase artwork opacity is an instantaneous flip scheduled by
  // JS at the phase boundary — NOT animated through CSS transitions.
  function setDirectionTiming(totalMs, isReveal) {
    const root = document.documentElement.style
    root.setProperty('--chrome-dummy-opacity-easing',
      isReveal ? chromeDummyOpacityRevealEasing : chromeDummyOpacityHideEasing)

    if (isChromeSinglePhase()) {
      root.setProperty('--phase-shape-duration', `${totalMs}ms`)
      root.setProperty('--phase-opacity-duration', `${totalMs}ms`)
      root.setProperty('--phase-shape-delay', `0ms`)
      root.setProperty('--phase-opacity-delay', `0ms`)
      return
    }

    const shapeDur = phaseOffset * totalMs
    const opacityDur = (1 - phaseOffset) * totalMs
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

  function getChromeArtworkHiddenFilter() {
    return 'blur(var(--reveal-blur))'
  }

  function getChromeArtworkTransition(totalMs, revealed) {
    const scaleEasing = revealed
      ? chromeArtworkScaleRevealEasing
      : chromeArtworkScaleHideEasing
    if (isChromeSinglePhase()) return `transform ${totalMs}ms ${scaleEasing}`
    return `transform ${totalMs}ms ${scaleEasing}, filter ${totalMs}ms linear, -webkit-filter ${totalMs}ms linear`
  }

  function setChromeArtworkState(revealed, totalMs, withTransition) {
    if (!_frameElt) return
    const s = _frameElt.style
    s.transformOrigin = 'center center'
    s.willChange = 'transform, filter'
    s.transition = withTransition
      ? getChromeArtworkTransition(totalMs, revealed)
      : 'none'
    s.webkitTransition = s.transition
    s.opacity = '1'
    if (revealed) {
      s.transform = 'translateZ(0) scale(1)'
      s.filter = isChromeSinglePhase() ? 'none' : 'blur(0)'
      s.webkitFilter = isChromeSinglePhase() ? 'none' : 'blur(0)'
    } else {
      s.transform = `translateZ(0) scale(${chromeArtworkHiddenScale})`
      s.filter = isChromeSinglePhase() ? 'none' : getChromeArtworkHiddenFilter()
      s.webkitFilter = isChromeSinglePhase() ? 'none' : getChromeArtworkHiddenFilter()
    }
  }

  function ensureChromeBlurLayer() {
    if (isWebKitClass || !document.body) return null
    if (_chromeBlurLayer && _chromeBlurLayer.parentNode) return _chromeBlurLayer
    ensureStyles()
    if (!_chromeBlurLayer) {
      _chromeBlurLayer = document.createElement('div')
      _chromeBlurLayer.id = 'chrome-reveal-blur-layer'
    }
    document.body.appendChild(_chromeBlurLayer)
    return _chromeBlurLayer
  }

  function parentChromeRevealLayers() {
    if (!isChromeSinglePhase()) return
    const layer = ensureChromeBlurLayer()
    if (!layer) return
    if (typeof BG !== 'undefined' && BG && BG.elt && BG.elt.parentNode !== layer) {
      if (_dummy && _dummy.parentNode === layer) layer.insertBefore(BG.elt, _dummy)
      else layer.appendChild(BG.elt)
    }
    if (_dummy && _dummy.parentNode !== layer) layer.appendChild(_dummy)
  }

  function setChromeSharedBlurState(revealed, withTransition) {
    if (!isChromeSinglePhase()) return
    const layer = ensureChromeBlurLayer()
    if (!layer) return
    parentChromeRevealLayers()
    layer.style.transition = withTransition ? '' : 'none'
    if (revealed) layer.classList.remove('chrome-blur-hidden')
    else layer.classList.add('chrome-blur-hidden')
    if (!withTransition) void layer.offsetWidth
  }

  function updateChromeDummyPulseVars() {
    const base = Number(hiddenScale) > 0 ? Number(hiddenScale) : 1
    const amount = Math.max(0, Math.min(chromeDummyPulseAmount, base - 0.01))
    const root = document.documentElement.style
    root.setProperty('--chrome-dummy-pulse-ms', `${chromeDummyPulseMs}ms`)
    root.setProperty('--chrome-dummy-pulse-scale-min', `${(base - amount) / base}`)
    root.setProperty('--chrome-dummy-pulse-scale-max', `${(base + amount) / base}`)
    root.setProperty('--chrome-pulse-handoff-ms', `${revealDurationMs}ms`)
  }

  function startChromeHiddenPulse() {
    if (isWebKitClass || !isChromeSinglePhase()) return
    updateChromeDummyPulseVars()
    if (_dummy) {
      const core = _dummy.querySelector('#reveal-dummy-core')
      if (core) {
        core.style.transition = ''
        core.style.transform = 'translateZ(0) scale(1)'
        core.style.animation = ''
      }
      _dummy.classList.add('chrome-hidden-pulse')
    }
  }

  function stopChromeHiddenPulse() {
    if (_dummy) {
      _dummy.classList.remove('chrome-hidden-pulse')
      const core = _dummy.querySelector('#reveal-dummy-core')
      if (core) {
        core.style.animation = 'none'
        void core.offsetWidth
        core.style.animation = ''
      }
    }
  }

  function handoffChromePulseToReveal() {
    if (!_dummy) return
    const core = _dummy.querySelector('#reveal-dummy-core')
    if (!core) return
    const currentTransform = getComputedStyle(core).transform
    core.style.transition = 'none'
    core.style.transform = currentTransform && currentTransform !== 'none'
      ? currentTransform
      : 'translateZ(0) scale(1)'
    _dummy.classList.remove('chrome-hidden-pulse')
    core.style.animation = 'none'
    void core.offsetWidth
    core.style.animation = ''
    core.style.transition = `transform ${revealDurationMs}ms linear, border-radius var(--phase-shape-duration) linear var(--phase-shape-delay)`
    core.style.transform = 'translateZ(0) scale(1)'
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
    if (_dummy && _dummy.parentNode) {
      ensureDummyCore()
      parentChromeRevealLayers()
      return
    }
    if (!document.body) return
    ensureStyles()
    if (!_dummy) {
      _dummy = document.createElement('div')
      _dummy.id = 'reveal-dummy'
    }
    ensureDummyCore()
    const parent = isChromeSinglePhase() ? ensureChromeBlurLayer() : document.body
    parent.appendChild(_dummy)
  }

  function ensureDummyCore() {
    if (!_dummy) return
    if (_dummy.querySelector('#reveal-dummy-core')) return
    const core = document.createElement('div')
    core.id = 'reveal-dummy-core'
    _dummy.appendChild(core)
  }

  //FUNC: ensureSafariDummy() : void
  // Safari-only dummy layer. Separate from #reveal-dummy so Chrome's
  // reference implementation remains untouched. This element persists
  // across every ProtoBatch teardown/rebuild cycle.
  function ensureSafariDummyCore() {
    if (!_safariDummy) return
    if (_safariDummy.querySelector('#safari-dummy-core')) return
    const core = document.createElement('div')
    core.id = 'safari-dummy-core'
    _safariDummy.appendChild(core)
  }

  function ensureSafariDummy() {
    if (!isWebKitClass) return
    if (_safariDummy && _safariDummy.parentNode) {
      ensureSafariDummyCore()
      return
    }
    if (!document.body) return
    ensureStyles()
    // Set the hidden-state geometry before inserting the element. If the
    // dummy is appended first, Safari paints the default 100x200px values
    // at 0,0 and then visibly animates down to the centered pill.
    updateLayoutVars(_currentMetrics)
    if (!_safariDummy) {
      _safariDummy = document.createElement('div')
      _safariDummy.id = 'safari-dummy'
    }
    ensureSafariDummyCore()
    document.body.appendChild(_safariDummy)
  }

  function updateSafariDummyPulseVars() {
    const base = Number(hiddenScale) > 0 ? Number(hiddenScale) : 1
    const amount = Math.max(0, Math.min(safariDummyPulseAmount, base - 0.01))
    const root = document.documentElement.style
    root.setProperty('--safari-dummy-pulse-ms', `${safariDummyPulseMs}ms`)
    root.setProperty('--safari-dummy-pulse-scale-min', `${(base - amount) / base}`)
    root.setProperty('--safari-dummy-pulse-scale-max', `${(base + amount) / base}`)
  }

  function setSafariArtworkState(revealed, withTransition) {
    if (!isWebKitClass) return
    if (typeof BG === 'undefined' || !BG || !BG.elt) return
    _frameElt = BG.elt
    const s = _frameElt.style
    const duration = withTransition ? safariTransitionMs + 'ms' : '0ms'
    s.transformOrigin = 'center center'
    s.willChange = 'auto'
    s.transition = withTransition
      ? 'opacity ' + duration + ' linear'
      : 'none'
    s.webkitTransition = s.transition
    s.transform = 'none'
    s.filter = 'none'
    s.webkitFilter = 'none'
    if (revealed) {
      s.opacity = '1'
    } else {
      s.opacity = String(safariArtworkPrepaintOpacity)
    }
  }

  function prepSafariArtworkPrepaint() {
    if (!isWebKitClass) return
    if (typeof BG === 'undefined' || !BG || !BG.elt) return
    _frameElt = BG.elt
    const s = _frameElt.style
    s.transition = 'none'
    s.webkitTransition = 'none'
    s.transformOrigin = 'center center'
    s.transform = 'none'
    s.filter = 'none'
    s.webkitFilter = 'none'
    s.willChange = 'auto'
    s.opacity = String(safariArtworkPrepaintOpacity)
  }

  function cleanupSafariArtworkRasterState(token) {
    setTimeout(() => {
      if (token !== _buildToken) return
      if (!_frameElt) return
      const s = _frameElt.style
      s.transition = 'none'
      s.webkitTransition = 'none'
      s.transform = 'none'
      s.filter = 'none'
      s.webkitFilter = 'none'
      s.willChange = 'auto'
      s.opacity = '1'
    }, safariTransitionMs + 80)
  }

  function startSafariLoadingDelay() {
    if (!_safariOverlay) return
    _safariOverlay.classList.add('building')
    updateSafariDummyPulseVars()
    if (_safariDummy) _safariDummy.classList.add('safari-hidden-pulse')
  }

  //FUNC: prepArtwork() : void
  // Snap BG.elt to the Chrome hidden state with no transition before
  // revealNow() flips it visible. In Chrome single-phase, artwork joins
  // the dummy's scale reveal but stays opacity 1 behind the dummy. Chrome
  // single-phase blur is applied once on #chrome-reveal-blur-layer.
  // The preserved two-phase path
  // keeps the old opacity-only artwork behavior.
  //
  function prepArtwork() {
    if (typeof BG === 'undefined' || !BG || !BG.elt) return
    _frameElt = BG.elt
    if (isWebKitClass) return
    const s = _frameElt.style
    if (isChromeSinglePhase()) {
      parentChromeRevealLayers()
      setChromeSharedBlurState(false, false)
      setChromeArtworkState(false, revealDurationMs, false)
      void _frameElt.offsetWidth
      return
    }
    s.transition = 'none'
    s.webkitTransition = 'none'
    s.willChange = 'opacity'
    s.transform = 'none'
    s.filter = 'none'
    s.webkitFilter = 'none'
    s.opacity = '0'
    void _frameElt.offsetWidth
  }

  //FUNC: ensureSafariOverlay() : void
  // WebKit-only. Creates the Safari loading text DOM ONCE at
  // init, parented to <body> so it survives every ProtoBatch teardown.
  // Persistent Safari layers:
  //   #safari-dummy            separate persistent dummy morph layer
  //   #safari-overlay          root (position:fixed inset:0)
  //     #safari-loading-text   "Safari may take longer…" text
  // Text visibility is driven by toggling .building on #safari-overlay.
  function ensureSafariOverlay() {
    if (!isWebKitClass) return
    if (_safariOverlay && _safariOverlay.parentNode) return
    if (!document.body) return
    ensureStyles()

    _safariOverlay = document.createElement('div')
    _safariOverlay.id = 'safari-overlay'

    // No backdrop-filter dim layer and no canvas spinner. Safari's dummy
    // carries the visual motion; the overlay only carries text.

    const txt = document.createElement('div')
    txt.id = 'safari-loading-text'
    txt.textContent = loadingTextCopy
    _safariOverlay.appendChild(txt)

    document.body.appendChild(_safariOverlay)
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
  // Safari-only cold-load reveal choreography. ArtBlocks tokens load once,
  // so this path intentionally does not support a reverse/hide phase.
  function revealNowSafari() {
    ensureSafariDummy()
    _currentMetrics = getCurrentFrameMetrics()
    updateLayoutVars(_currentMetrics)

    // The SVG has already had a normal-size near-transparent prepaint.
    // Keep the finished SVG at natural size; the dummy carries the visible
    // scale/blur/morph motion so Safari never rasterizes BG at hidden scale.
    setSafariArtworkState(false, false)
    if (_frameElt) _frameElt.style.opacity = String(safariArtworkPrepaintOpacity)
    if (_safariDummy) {
      _safariDummy.classList.remove('revealed')
      _safariDummy.classList.remove('safari-hidden-pulse')
      const core = _safariDummy.querySelector('#safari-dummy-core')
      if (core) {
        void core.offsetWidth
        void getComputedStyle(core).transform
      }
    }
    if (_frameElt) {
      void _frameElt.offsetWidth
      void getComputedStyle(_frameElt).opacity
    }
    const myToken = _buildToken
    requestAnimationFrame(() => {
      if (myToken !== _buildToken) return
      if (_safariDummy) {
        void _safariDummy.offsetWidth
        void getComputedStyle(_safariDummy).transition
        void getComputedStyle(_safariDummy).transform
        _safariDummy.classList.add('revealed')
      }
      setSafariArtworkState(true, true)
      cleanupSafariArtworkRasterState(myToken)
      if (_safariOverlay) _safariOverlay.classList.remove('building')
      setTimeout(() => {
        if (myToken === _buildToken) _rebuildInFlight = false
      }, safariTransitionMs)
      console.log('[RevealAnim] revealNowSafari: Safari cold-load reveal started')
    })
  }

  //FUNC: revealNow() : void
  // Forward direction. Chrome has two switchable variants:
  //   single-phase: dummy morph/scale/opacity, artwork scale, and shared
  //                 wrapper blur transition together; artwork opacity stays 1.
  //   two-phase:    preserved reference path using CSS transition-delay
  //                 plus the original artwork opacity flip.
  //
  // Reads the *new* frame metrics from BGRID and writes them into
  // CSS vars before flipping the .revealed class — so the morph
  // tween targets the new shape.
  function revealNow() {
    if (isWebKitClass) return revealNowSafari()
    disarmLoadingText()
    _currentMetrics = getCurrentFrameMetrics()
    if (!isChromeSinglePhase()) updateLayoutVars(_currentMetrics)
    setDirectionTiming(revealDurationMs, true)
    // Force a style recalc on the dummy BEFORE flipping .revealed so
    // Safari has the up-to-date --phase-* transition durations cached
    // against the element. Without this, Safari sometimes processes
    // the class flip with stale (or zero) transition durations and
    // snaps directly to the .revealed end-state.
    if (_dummy) {
      handoffChromePulseToReveal()
      void _dummy.offsetWidth
      void getComputedStyle(_dummy).transition
      const core = _dummy.querySelector('#reveal-dummy-core')
      if (core) {
        void core.offsetWidth
        void getComputedStyle(core).transform
      }
    }

    if (isChromeSinglePhase()) {
      setChromeSharedBlurState(true, true)
      if (_frameElt) {
        const s = _frameElt.style
        s.willChange = 'transform, filter'
        s.transition = getChromeArtworkTransition(revealDurationMs, true)
        s.webkitTransition = s.transition
        void _frameElt.offsetWidth
        void getComputedStyle(_frameElt).transform
        void getComputedStyle(_frameElt).filter
      }
      if (_dummy) _dummy.classList.add('revealed')
      setChromeArtworkState(true, revealDurationMs, true)
      const myToken = _buildToken
      setTimeout(() => {
        if (myToken === _buildToken) {
          _rebuildInFlight = false
          clearReloadRotationSnapshot()
        }
      }, revealDurationMs)
      return
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
      if (myToken === _buildToken) {
        _rebuildInFlight = false
        clearReloadRotationSnapshot()
      }
    }, revealDurationMs)
  }

  //FUNC: hideNow() : void
  // Reverse direction. The single-phase Chrome variant keeps artwork opacity
  // at 1 while the dummy fades/morphs back to the hidden pill; the two-phase
  // variant preserves the previous staged hide choreography.
  // Chrome-only dynamic generator path. Safari ignores 'n' for the
  // ArtBlocks submission build and never enters this reverse phase.
  //
  // Captures the CURRENT (about-to-be-replaced) frame metrics so the
  // dummy's stage-2 morph starts from the shape of the artwork that
  // was just displayed (not the next one).
  function hideNow() {
    if (isWebKitClass) return
    latchReloadRotationSnapshot()
    if (typeof BG !== 'undefined' && BG && BG.elt) _frameElt = BG.elt
    _currentMetrics = getCurrentFrameMetrics()
    if (isPreRotatedReloadActive()) updateLayoutVarsWithoutDummyTransition(_currentMetrics)
    else updateLayoutVars(_currentMetrics)
    captureNeutralHorizontalHiddenPill()
    setDirectionTiming(hideDurationMs, false)
    if (_dummy) {
      void _dummy.offsetWidth
      void getComputedStyle(_dummy).transition
    }
    const myToken = _buildToken

    if (isChromeSinglePhase()) {
      setChromeSharedBlurState(false, true)
      if (_frameElt) {
        const s = _frameElt.style
        s.willChange = 'transform, filter'
        s.transition = getChromeArtworkTransition(hideDurationMs, false)
        s.webkitTransition = s.transition
        void _frameElt.offsetWidth
        void getComputedStyle(_frameElt).transform
        void getComputedStyle(_frameElt).filter
      }
      if (_dummy) _dummy.classList.remove('revealed')
      setChromeArtworkState(false, hideDurationMs, true)
      setTimeout(() => {
        if (myToken === _buildToken) startChromeHiddenPulse()
      }, hideDurationMs)
      return
    }

    if (_dummy) _dummy.classList.remove('revealed')
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
  // The .building class stays on throughout Safari cold-load build;
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
      if (!isWebKitClass) {
        if (!shouldPreserveNeutralHorizontalHiddenPill()) updateLayoutVars(defaultFrameMetrics)
        setChromeSharedBlurState(false, false)
        startChromeHiddenPulse()
      }

      const runBuild = () => {
        const result = origBuild.apply(this, arguments)

        // Stop animation on Safari — bitmap-quality matters more than
        // motion when each frame costs 10s.
        if (isWebKitClass && typeof globalControls !== 'undefined' && globalControls) {
          globalControls.animated = false
        }

        // Re-sync layout vars from the freshly-built BackGrid so the
        // dummy's revealed-state geometry matches the new artwork. This must
        // happen before Chrome single-phase hides BG.elt with transform scale,
        // otherwise DOM rect measurements read the deliberately scaled state.
        syncArtworkRotationBeforeRevealLayout()
        updateLayoutVars(getCurrentFrameMetrics())
        // Prep artwork synchronously so the live SVG never reaches the
        // screen sharp/visible on Chrome. Safari prepares its artwork
        // inside revealNowSafari() for the cold-load reveal.
        prepArtwork()

        if (isWebKitClass) {
          if (_safariDummy) _safariDummy.classList.remove('revealed')
          prepSafariArtworkPrepaint()
        }

        // Yield to compositor before triggering reveal. Safari first commits
        // the freshly-built artwork at normal size and near-zero opacity;
        // revealNowSafari() then snaps it to hidden scale and animates back.
        const myToken = _buildToken
        if (isWebKitClass) {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (myToken !== _buildToken) return
            revealNowSafari()
          }))
        } else {
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
            if (myToken !== _buildToken) return
            revealNow()
          })))
        }

        return result
      }

      if (isWebKitClass) {
        ensureSafariOverlay()
        updateLayoutVars(defaultFrameMetrics)
        ensureSafariDummy()
        startSafariLoadingDelay()
        // Let Safari paint the hidden dummy and visible overlay before
        // origBuild locks the main thread with SVG rendering.
        const scheduledToken = _buildToken
        const startBuild = () => {
          if (scheduledToken !== _buildToken) return
          runBuild()
        }
        requestAnimationFrame(() => requestAnimationFrame(startBuild))
        return undefined
      }

      if (isChromeSinglePhase()) {
        const scheduledToken = _buildToken
        const startBuild = () => {
          if (scheduledToken !== _buildToken) return
          runBuild()
        }
        requestAnimationFrame(() => requestAnimationFrame(startBuild))
        return undefined
      }

      return runBuild()
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
          if (isWebKitClass) {
            e.preventDefault()
            e.stopImmediatePropagation()
            return
          }
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

            hideNow()
            setTimeout(() => {
              if (typeof protoBatch !== 'undefined' && protoBatch) {
                prepRotationForReloadBuild()
                protoBatch.buildFromNewSeed()
              }
            }, hideDurationMs + (isChromeSinglePhase() ? chromeHiddenPulseHoldMs : 0))
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
    if (!isWebKitClass) setChromeTransitionVariant(chromeTransitionVariant)
    updateLayoutVars(defaultFrameMetrics)
    if (!isWebKitClass) {
      setChromeSharedBlurState(false, false)
      startChromeHiddenPulse()
    }
    if (isWebKitClass) {
      ensureSafariDummy()
      ensureSafariOverlay()
      startSafariLoadingDelay()
    }
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
    chromeReferencePreset: CHROME_REFERENCE_PRESET,
    chromeTransitionVariants: CHROME_TRANSITION_VARIANTS,
    rotationReloadModes: ROTATION_RELOAD_MODES,
    get chromeTransitionVariant() { return chromeTransitionVariant },
    get rotationReloadMode() { return rotationReloadMode },
    setChromeTransitionVariant,
    setRotationReloadMode,
    syncRevealLayoutToArtwork,
    revealNow,
    hideNow,
    resetForRebuild,
  }
})()
