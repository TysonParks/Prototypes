// safariCompat.js
// ---------------------------------------------------------------------------
// WebKit / Safari group-isolation workaround for SVG masking (Root Cause A).
//
// Background: WebKit Bug #172338 (open since 2017).
//   RenderSVGResourceMasker::applyResource() applies the mask once per child
//   shape in a masked <g>, instead of compositing the whole group to an
//   offscreen buffer first and then masking once. This causes:
//     1. Wrong visual output when masked groups contain overlapping shapes
//        (per-shape masking ≠ group masking under the SVG spec).
//     2. O(N) software pixel-mask cost — the source of multi-second to
//        multi-minute Safari render delays for complex BoredUI scenes.
//     3. Per-frame repaint cost during animation (each frame re-runs the
//        per-shape masker over every child).
//
// Documented workaround (referenced in WebKit bug thread): adding a no-op
// <filter> to a masked <g> forces WebKit to composite the group to an
// offscreen buffer BEFORE applying the mask — the same path the new LBSE
// engine uses by default. Applying any filter (identity feColorMatrix here)
// to the masked element flips it onto the correct path.
//
// This module monkey-patches `p5.Element.prototype.attribute` so that every
// time a `mask="url(#...)"` attribute is written, the element also receives
// a `filter="url(#webkit-group-isolate)"` attribute (unless it already has
// a filter — any existing filter already triggers the same compositing).
//
// Cross-browser safety: an identity feColorMatrix produces an exact pixel
// passthrough. Headless Chromium (ArtBlocks validation environment) and
// Firefox already do group-level masking; the additional filter changes
// nothing visually. The workaround is also gated by a feature flag and
// can be disabled at runtime.
//
// Reference: docs/Operational/ARTBLOCKS-SPRINT.md → "B1 — Safari
// Compatibility: Full Attack Plan".
// ---------------------------------------------------------------------------

(function () {
  'use strict'

  // FLAG: default ON. Toggle at runtime via SafariCompat.enable() / .disable().
  // Persisted via sessionStorage so disable() + reload() stays disabled.
  if (sessionStorage.getItem('SAFARI_GROUP_ISOLATE_WORKAROUND') === 'false') {
    window.SAFARI_GROUP_ISOLATE_WORKAROUND = false
  } else if (typeof window.SAFARI_GROUP_ISOLATE_WORKAROUND === 'undefined') {
    window.SAFARI_GROUP_ISOLATE_WORKAROUND = true
  }

  const FILTER_ID = 'webkit-group-isolate'
  const SVG_NS = 'http://www.w3.org/2000/svg'

  //FUNC: createIsolateFilter(svgScope, filterId) : void
  // Create one identity <filter> with the given ID inside svgScope's <defs>.
  function createIsolateFilter(svgScope, filterId) {
    let defs = svgScope.querySelector(':scope > defs')
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs')
      svgScope.insertBefore(defs, svgScope.firstChild)
    }

    const filter = document.createElementNS(SVG_NS, 'filter')
    filter.setAttribute('id', filterId)
    // Force sRGB color math so adding the filter never shifts colors vs. an
    // unfiltered render in any browser. Default linearRGB can drift.
    filter.setAttribute('color-interpolation-filters', 'sRGB')
    // Generous region in objectBoundingBox units (default). The SVG default
    // is only -10%/120% which clips jIn and other shapes that overflow the
    // element's declared bounds. 50% padding on all sides is sufficient for
    // any geometry overflow without a blur spread.
    filter.setAttribute('x', '-50%')
    filter.setAttribute('y', '-50%')
    filter.setAttribute('width', '200%')
    filter.setAttribute('height', '200%')

    const fcm = document.createElementNS(SVG_NS, 'feColorMatrix')
    fcm.setAttribute('type', 'matrix')
    fcm.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0')
    filter.appendChild(fcm)

    defs.appendChild(filter)
  }

  //FUNC: applyGroupIsolateToElement(elt) : void
  // Attach `filter="url(#webkit-group-isolate[...])"` to an element that just
  // received a `mask` attribute, unless it already has a filter.
  //
  // Root Cause B context: Safari may not resolve url(#id) references across
  // nested <svg> element boundaries (KNOWN-ISSUES §9.14.4b). To guarantee
  // resolution, we place the filter definition *inside the masked element
  // itself* when that element is an <svg>:
  //   - masked element is <g>   → shared filter in ownerSVGElement defs (one copy, shared ID)
  //   - masked element is <svg> → local filter in element's own defs (element-scoped ID)
  //     ID is FILTER_ID + '-' + element.id to stay globally unique.
  function applyGroupIsolateToElement(elt) {
    if (!elt || !elt.setAttribute) return
    if (elt.hasAttribute && elt.hasAttribute('filter')) return

    const tag = elt.tagName ? elt.tagName.toLowerCase() : ''

    if (tag === 'svg') {
      // Place filter locally so Safari resolves it within this SVG's own scope.
      const localId = elt.id ? `${FILTER_ID}-${elt.id}` : FILTER_ID
      if (!elt.querySelector(`#${localId}`)) {
        createIsolateFilter(elt, localId)
      }
      elt.setAttribute('filter', `url(#${localId})`)
    } else {
      // For <g> and other elements, a single shared filter in ownerSVGElement is fine.
      const scope = elt.ownerSVGElement || elt.closest('svg')
      if (!scope) return
      if (!scope.querySelector(`#${FILTER_ID}`)) {
        createIsolateFilter(scope, FILTER_ID)
      }
      elt.setAttribute('filter', `url(#${FILTER_ID})`)
    }
  }

  //SECT: monkey-patch p5.Element.prototype.attribute
  // Intercepts all `attribute('mask', 'url(#...)')` setter calls in the
  // codebase (currently 3 sites: ProtoFilter.js mask(), ProtoLayerObjects.js
  // maskFrame() and assignElement(); plus any future site).
  if (typeof p5 !== 'undefined' && p5.Element && p5.Element.prototype.attribute) {
    const originalAttribute = p5.Element.prototype.attribute

    p5.Element.prototype.attribute = function (attr, value) {
      const result = originalAttribute.apply(this, arguments)

      if (
        window.SAFARI_GROUP_ISOLATE_WORKAROUND &&
        arguments.length >= 2 &&
        attr === 'mask' &&
        typeof value === 'string' &&
        value.indexOf('url(') === 0
      ) {
        try {
          applyGroupIsolateToElement(this.elt)
        } catch (err) {
          if (!window.__safariCompatErrLogged) {
            console.warn('[SafariCompat] applyGroupIsolateToElement failed:', err)
            window.__safariCompatErrLogged = true
          }
        }
      }
      return result
    }
  } else {
    console.warn('[SafariCompat] p5.Element.prototype.attribute not available — patch skipped.')
  }

  //SECT: audit + instrumentation helpers (call from browser console)

  //FUNC: auditMaskedGroups() : Array<Report>
  // Lists every element in the document with a `mask` attribute, its child
  // shape count, whether a filter is applied, and whether our isolate filter
  // is the one applied. Use this before/after toggling the workaround to
  // confirm coverage.
  function auditMaskedGroups() {
    const masked = document.querySelectorAll('[mask]')
    const report = []
    masked.forEach(el => {
      const shapeCount = el.querySelectorAll('path,rect,circle,ellipse,polygon,line,g').length
      const filterAttr = el.getAttribute('filter') || ''
      report.push({
        tag: el.tagName,
        id: el.id || '(no id)',
        shapeCount,
        hasFilter: !!filterAttr,
        isolated: filterAttr.indexOf(FILTER_ID) !== -1,
      })
    })
    console.table(report)
    const stats = {
      totalMaskedGroups: report.length,
      totalShapesUnderMasks: report.reduce((s, r) => s + r.shapeCount, 0),
      groupsWithIsolate: report.filter(r => r.isolated).length,
      groupsWithOtherFilter: report.filter(r => r.hasFilter && !r.isolated).length,
      groupsWithoutFilter: report.filter(r => !r.hasFilter).length,
    }
    console.log('[SafariCompat] mask audit summary:', stats)
    return { report, stats }
  }

  //FUNC: measureFirstPaint(label?) : Promise<number>
  // Returns ms from call until 2 rAFs after — i.e. the browser has painted
  // at least one frame. Works on Safari where Web Inspector cannot profile
  // inside the SVG render pipeline.
  function measureFirstPaint(label) {
    label = label || 'first-paint'
    const t0 = performance.now()
    return new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const ms = performance.now() - t0
        console.log(`[SafariCompat] ${label}: ${ms.toFixed(1)}ms`)
        resolve(ms)
      }))
    })
  }

  //FUNC: stripIsolateFilters() : number
  // Removes our isolate filter attribute from all masked groups in the
  // current document. Use this to A/B compare a single live render WITHOUT
  // re-running the generator. Returns count of elements modified.
  function stripIsolateFilters() {
    let n = 0
    document.querySelectorAll(`[filter*="${FILTER_ID}"]`).forEach(el => {
      el.removeAttribute('filter')
      n++
    })
    console.log(`[SafariCompat] stripped isolate filter from ${n} elements`)
    return n
  }

  //FUNC: applyIsolateFiltersNow() : number
  // Walks the current document and applies the isolate filter to every
  // element with a mask attribute that doesn't already have a filter.
  // Useful when the workaround was disabled at render time and you want to
  // toggle it on for the existing render.
  function applyIsolateFiltersNow() {
    let n = 0
    document.querySelectorAll('[mask]').forEach(el => {
      if (!el.hasAttribute('filter')) {
        applyGroupIsolateToElement(el)
        n++
      }
    })
    console.log(`[SafariCompat] applied isolate filter to ${n} elements`)
    return n
  }

  //FUNC: auditBlurFilters() : Array<row>
  // For every <filter id="blur-..."> in the document, finds its consumer(s),
  // calls getBBox() on them, and reports stdDeviation, declared region, and
  // resolved bbox. Rows where bbox = 'n/a' indicate getBBox() threw — in
  // Safari this clusters on elements inside <mask>/<defs>, the exact root
  // cause of the depth-correlated missing-shape bug. (B1 attack plan / Q17.)
  function auditBlurFilters() {
    const rows = []
    document.querySelectorAll('filter[id^="blur-"]').forEach(f => {
      const fe = f.querySelector('feGaussianBlur')
      const std = fe ? parseFloat(fe.getAttribute('stdDeviation')) : null
      const id = f.getAttribute('id')
      const consumers = document.querySelectorAll(`[filter*="${id}"]`)
      let bboxW = 'n/a', bboxH = 'n/a'
      consumers.forEach(c => {
        try {
          const bb = c.getBBox()
          bboxW = bb.width.toFixed(2)
          bboxH = bb.height.toFixed(2)
        } catch (e) { /* leave 'n/a' */ }
      })
      rows.push({
        filterId: id,
        stdDev: std,
        x: f.getAttribute('x'),
        width: f.getAttribute('width'),
        filterUnits: f.getAttribute('filterUnits') || 'objectBoundingBox (default)',
        consumerBBoxW: bboxW,
        consumerBBoxH: bboxH,
      })
    })
    console.table(rows)
    const broken = rows.filter(r => r.consumerBBoxW === 'n/a')
    console.log(`[SafariCompat] auditBlurFilters: ${rows.length} blur filters; ${broken.length} with unresolvable bbox (Q17)`)
    return rows
  }

  //SECT: WebKit detection + performance capabilities (Phase 2)
  // Safari: cardinal rotation only. Chrome: live SVG default via appControls.js
  // chromeRotationMode; R-key toggles cardinal batch bake. Thresholds only disable
  // rotation/export on pathological loads. Adaptive probes deferred — see
  // docs/Operational/DEFERRED-ADAPTIVE-RENDER-MODES.md

  function detectWebKitClass() {
    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isDesktopSafari = /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Android/i.test(ua)
    return isDesktopSafari || isIOS
  }

  // MARK: Chrome rotation capability (A/B via appControls.js → chromeRotationMode)
  // Prefer chromeRotationMode when defined; else default to cardinal.
  // Valid: 'cardinal' | 'full' | 'off'
  function resolveChromeRotationMode() {
    const override = typeof window !== 'undefined' ? window.chromeRotationMode : null
    if (override === 'cardinal' || override === 'full' || override === 'off') return override
    return 'cardinal'
  }

  function chromeCapabilities() {
    return {
      rotation: resolveChromeRotationMode(),
      lightAnimation: true,
      export: 'full',
      renderEngine: 'LBSE',
    }
  }

  const WEBKIT_FALLBACK_CAPABILITIES = Object.freeze({
    rotation: 'cardinal',
    lightAnimation: false,
    export: 'full',
    renderEngine: 'preLBSE',
  })

  // Thresholds — tune after Safari smoke tests (ms).
  const TIER_FIRST_PAINT_MS_ROTATION_OFF = 45000
  const TIER_BUILD_MS_ROTATION_OFF = 20000
  // Scaled export probe (10% of production res); disable S export if probe exceeds this.
  const TIER_EXPORT_PROBE_MS_OFF = 12000

  let capabilities = detectWebKitClass()
    ? { ...WEBKIT_FALLBACK_CAPABILITIES }
    : chromeCapabilities()
  let renderMetrics = null
  let buildMarkStart = null
  let exportProbeComplete = false

  function detectRenderEngine() {
    // Stub: flip to 'LBSE' when a reliable WebKit LBSE detector exists.
    if (!detectWebKitClass()) return 'LBSE'
    return 'preLBSE'
  }

  function computeWebKitCapabilities({ buildMs, probeLightUpdateMs, firstPaintMs, exportRasterMs }) {
    const lightAnimation = false
    const build = Number.isFinite(buildMs) ? buildMs : Infinity
    const paint = Number.isFinite(firstPaintMs) ? firstPaintMs : null
    const exportProbe = Number.isFinite(exportRasterMs) ? exportRasterMs : null

    let rotation = 'cardinal'
    if (paint !== null && paint >= TIER_FIRST_PAINT_MS_ROTATION_OFF) rotation = 'off'
    else if (build >= TIER_BUILD_MS_ROTATION_OFF) rotation = 'off'
    // Never rotation:'full' on WebKit — live CSS rotation without light sync spins
    // a frozen-lit snapshot (see MVP-ROTATION-SHIPPING.md).

    let exportCap = 'full'
    if (exportProbe !== null && exportProbe >= TIER_EXPORT_PROBE_MS_OFF) exportCap = 'off'

    return {
      rotation,
      lightAnimation,
      export: exportCap,
      renderEngine: detectRenderEngine(),
    }
  }

  function applyExportCapabilityPolicy() {
    if (capabilities.export !== 'off') return
    if (typeof DeBug !== 'undefined' && DeBug.warn) {
      DeBug.warn('[SafariCompat] PNG export disabled — scaled probe exceeded threshold')
    }
  }

  function applyRotationCapabilityPolicy() {
    if (capabilities.rotation !== 'cardinal') {
      window.SafariCardinalBuffers?.invalidateCardinalBuffers?.()
    }
    // Cardinal buffer bake is lazy — first arrow via yielding coordinator.
  }

  function applyLightAnimationPolicy() {
    if (capabilities.lightAnimation) return
    if (typeof globalControls !== 'undefined' && globalControls) globalControls.animated = false
    if (typeof animationController !== 'undefined' && animationController?.stop) {
      animationController.stop()
    }
  }

  function recordInitialRender(metrics = {}) {
    renderMetrics = { ...metrics }
    if (!detectWebKitClass()) {
      capabilities = chromeCapabilities()
      return { ...capabilities }
    }
    capabilities = computeWebKitCapabilities({ ...renderMetrics, ...metrics })
    applyLightAnimationPolicy()
    applyRotationCapabilityPolicy()
    applyExportCapabilityPolicy()
    if (typeof DeBug !== 'undefined' && DeBug.log) {
      DeBug.log('[SafariCompat] capabilities', capabilities, renderMetrics)
    }
    return { ...capabilities }
  }

  function beginInitialRender() {
    buildMarkStart = performance.now()
  }

  function endInitialRender() {
    const buildMs = buildMarkStart != null ? performance.now() - buildMarkStart : null
    buildMarkStart = null

    let probeLightUpdateMs = null
    if (detectWebKitClass()
      && typeof animationController !== 'undefined'
      && animationController?.batchUpdateFilters) {
      const t0 = performance.now()
      const rad = ((typeof globalControls !== 'undefined' && globalControls?.shadAngle) ?? 90) * Math.PI / 180
      animationController.batchUpdateFilters(Math.cos(rad), Math.sin(rad))
      probeLightUpdateMs = performance.now() - t0
    }

    const caps = recordInitialRender({ buildMs, probeLightUpdateMs })
    if (detectWebKitClass()) {
      measureFirstPaint('post-build').then(firstPaintMs => {
        if (!renderMetrics) return
        renderMetrics.firstPaintMs = firstPaintMs
        const next = computeWebKitCapabilities({ ...renderMetrics, firstPaintMs })
        if (next.rotation !== capabilities.rotation
          || next.lightAnimation !== capabilities.lightAnimation
          || next.export !== capabilities.export
          || next.renderEngine !== capabilities.renderEngine) {
          capabilities = next
          applyLightAnimationPolicy()
          applyRotationCapabilityPolicy()
          applyExportCapabilityPolicy()
          if (typeof DeBug !== 'undefined' && DeBug.log) {
            DeBug.log('[SafariCompat] capabilities refined', capabilities, renderMetrics)
          }
        }
      })
    }
    return caps
  }

  function getCapabilities() {
    return { ...capabilities }
  }

  function setCapabilities(partial) {
    if (!partial || typeof partial !== 'object') return getCapabilities()
    capabilities = { ...capabilities, ...partial }
    applyLightAnimationPolicy()
    applyRotationCapabilityPolicy()
    applyExportCapabilityPolicy()
    return getCapabilities()
  }

  function recordExportRasterProbe(exportRasterMs) {
    if (!Number.isFinite(exportRasterMs)) return getCapabilities()
    exportProbeComplete = true
    renderMetrics = { ...(renderMetrics || {}), exportRasterMs }
    if (!detectWebKitClass()) return getCapabilities()
    const next = computeWebKitCapabilities({ ...(renderMetrics || {}), exportRasterMs })
    if (next.export !== capabilities.export || next.renderEngine !== capabilities.renderEngine) {
      capabilities = { ...capabilities, export: next.export, renderEngine: next.renderEngine }
      applyExportCapabilityPolicy()
      if (typeof DeBug !== 'undefined' && DeBug.log) {
        DeBug.log('[SafariCompat] export probe', { exportRasterMs, capabilities })
      }
    }
    return getCapabilities()
  }

  function isExportProbeComplete() {
    return exportProbeComplete
  }

  function forceEnableAll() {
    capabilities = { rotation: 'full', lightAnimation: true, export: 'full', renderEngine: 'LBSE' }
    return getCapabilities()
  }

  window.SafariCompat = {
    FILTER_ID,
    createIsolateFilter,
    applyGroupIsolateToElement,
    auditMaskedGroups,
    measureFirstPaint,
    stripIsolateFilters,
    applyIsolateFiltersNow,
    auditBlurFilters,
    detectWebKitClass,
    get capabilities() { return getCapabilities() },
    get renderMetrics() { return renderMetrics ? { ...renderMetrics } : null },
    getCapabilities,
    setCapabilities,
    forceEnableAll,
    recordExportRasterProbe,
    isExportProbeComplete,
    detectRenderEngine,
    beginInitialRender,
    endInitialRender,
    recordInitialRender,
    isEnabled: () => window.SAFARI_GROUP_ISOLATE_WORKAROUND,
    disable: () => {
      window.SAFARI_GROUP_ISOLATE_WORKAROUND = false
      sessionStorage.setItem('SAFARI_GROUP_ISOLATE_WORKAROUND', 'false')
      console.log('[SafariCompat] workaround DISABLED — persists across reload; call SafariCompat.enable() to restore')
    },
    enable: () => {
      window.SAFARI_GROUP_ISOLATE_WORKAROUND = true
      sessionStorage.removeItem('SAFARI_GROUP_ISOLATE_WORKAROUND')
      console.log('[SafariCompat] workaround ENABLED')
    },
  }

  // console.log('[SafariCompat] WebKit group-isolate workaround loaded.',
  //   'window.SafariCompat available;',
  //   'flag =', window.SAFARI_GROUP_ISOLATE_WORKAROUND)
})()
