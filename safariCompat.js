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

  // FLAG: SAFARI_FORCE_ISOLATE_OVER_FILTER (Apr 28 2026 perf attack)
  // When true, applyGroupIsolateToElement() wraps masked-AND-already-filtered
  // elements in an isolation <g> instead of skipping them. Hypothesis: the
  // existing-filter early-exit was the coverage hole behind Safari's 50–100×
  // slowdown. Default OFF until measured benefit confirmed (use
  // SafariCompat.measureAcrossFlags() to compare).
  if (sessionStorage.getItem('SAFARI_FORCE_ISOLATE_OVER_FILTER') === 'true') {
    window.SAFARI_FORCE_ISOLATE_OVER_FILTER = true
  } else if (typeof window.SAFARI_FORCE_ISOLATE_OVER_FILTER === 'undefined') {
    window.SAFARI_FORCE_ISOLATE_OVER_FILTER = false
  }

  // FLAG: SAFARI_FILTER_REGION_TIGHT (Apr 28 2026 — Tier 1b)
  // When true, ProtoCut.setLayouts() emits a tight per-cut filter region
  // (union AABB of consumer shapeGroups, depth-padded, +50 only where
  // touching FRAME edge). When false, falls back to the fixed FRAME+50
  // baseline. Default OFF — toggle on via console + reload to measure.
  if (sessionStorage.getItem('SAFARI_FILTER_REGION_TIGHT') === 'true') {
    window.SAFARI_FILTER_REGION_TIGHT = true
  } else if (typeof window.SAFARI_FILTER_REGION_TIGHT === 'undefined') {
    window.SAFARI_FILTER_REGION_TIGHT = false
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
    // Coverage-hole gate (Apr 28 2026 perf investigation):
    // The original assumption was that any pre-existing `filter` already
    // forces WebKit's offscreen-composite-then-mask path. If that turns
    // out to be wrong (e.g. shade filters with feFlood/feComposite take
    // a different code path), masked+filtered groups silently retain
    // O(N) per-shape masking. The flag below lets us A/B that hypothesis.
    if (elt.hasAttribute && elt.hasAttribute('filter')) {
      if (!window.SAFARI_FORCE_ISOLATE_OVER_FILTER) return
      // Force path: wrap the element so isolation sits OUTSIDE the
      // existing filter+mask pair, guaranteeing offscreen compositing.
      wrapForIsolation(elt)
      return
    }

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

  //FUNC: wrapForIsolation(elt) : void
  // Coverage-hole experiment (SAFARI_FORCE_ISOLATE_OVER_FILTER).
  // When a masked element ALREADY has a filter, we cannot just overwrite
  // its filter attribute. Instead, wrap the element in a parent <g> that
  // owns the isolate filter — this places the offscreen composite trigger
  // OUTSIDE the existing filter+mask, which (hypothesis) is what WebKit
  // needs to take the group-mask path instead of the per-shape one.
  // Idempotent: marks the wrapper with `data-isolate-wrap` to avoid double-wrap.
  function wrapForIsolation(elt) {
    if (!elt || !elt.parentNode) return
    if (elt.parentNode.hasAttribute && elt.parentNode.hasAttribute('data-isolate-wrap')) return
    const scope = elt.ownerSVGElement || elt.closest('svg')
    if (!scope) return
    if (!scope.querySelector(`#${FILTER_ID}`)) {
      createIsolateFilter(scope, FILTER_ID)
    }
    const wrap = document.createElementNS(SVG_NS, 'g')
    wrap.setAttribute('data-isolate-wrap', '1')
    wrap.setAttribute('filter', `url(#${FILTER_ID})`)
    elt.parentNode.insertBefore(wrap, elt)
    wrap.appendChild(elt)
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

  //FUNC: measurePerf(opts) : Promise<Report>
  //
  // Apr 28 2026 perf attack — A/B Safari render time across hashes and flag
  // configurations. Times the full buildFromHash() → first paint cycle.
  //
  // Usage in browser console:
  //   await SafariCompat.measurePerf()                      // current hash, default config
  //   await SafariCompat.measurePerf({ hash: 1474 })        // single hash by index
  //   await SafariCompat.measurePerf({ hashes: [1473,1474,1462] })
  //   await SafariCompat.measurePerf({ runs: 3 })           // average of 3 runs per hash
  //
  // Each run reports:
  //   buildMs   — synchronous JS work (buildFromHash returns)
  //   paintMs   — additional time from buildFromHash return → 2nd rAF
  //   totalMs   — buildMs + paintMs
  //   nodeCount — total SVG nodes after build
  //   maskCount — masked elements (from auditMaskedGroups)
  //   isolateCount — masked elements actually carrying the isolate filter
  //   filterCount — total <filter> elements
  //   feCount   — total fe* primitives across all filters
  //
  // Hash resolution:
  //   - opts.hash is an INTEGER hashNumber index into testingControls.hashes
  //     (matches dat.gui hashNumber slider). If omitted, current hash is reused.
  //
  // Verdict heuristic printed at end:
  //   - if avg totalMs > 5000ms across runs → "SVG pipeline likely unworkable;
  //     recommend canvas-image-swap fallback for Safari"
  //   - else if isolateCount/maskCount < 0.95 → "isolate coverage hole — try
  //     SAFARI_FORCE_ISOLATE_OVER_FILTER=true and re-measure"
  //   - else → "isolation appears complete; further wins require load reduction"
  async function measurePerf(opts) {
    opts = opts || {}
    const runs = opts.runs || 1
    let hashList
    if (opts.hashes && Array.isArray(opts.hashes)) {
      hashList = opts.hashes
    } else if (typeof opts.hash !== 'undefined') {
      hashList = [opts.hash]
    } else {
      hashList = [null] // null = use current hash
    }

    function snapshotDom() {
      const root = document.querySelector('#BG') || document.body
      const allSvg = root.querySelectorAll('svg, g, path, rect, circle, ellipse, polygon, line, defs, filter, mask')
      const filters = root.querySelectorAll('filter')
      let feCount = 0
      filters.forEach(f => { feCount += f.querySelectorAll('feGaussianBlur,feOffset,feFlood,feComposite,feBlend,feColorMatrix,feMerge,feMergeNode').length })
      const masks = root.querySelectorAll('[mask]')
      let isolated = 0
      masks.forEach(m => {
        const fa = m.getAttribute('filter') || ''
        if (fa.indexOf(FILTER_ID) !== -1) isolated++
        // also count children inside data-isolate-wrap
        if (m.parentElement && m.parentElement.getAttribute && m.parentElement.getAttribute('data-isolate-wrap') === '1') isolated++
      })
      return {
        nodeCount: allSvg.length,
        filterCount: filters.length,
        feCount,
        maskCount: masks.length,
        isolateCount: isolated,
      }
    }

    function nextPaint() {
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    }

    function resolveHashFromIndex(idx) {
      // null/undefined → reuse current tokenData.hash
      if (idx === null || typeof idx === 'undefined') {
        return (typeof tokenData !== 'undefined' && tokenData) ? tokenData.hash : null
      }
      // String that looks like a real hash → pass through
      if (typeof idx === 'string' && idx.indexOf('0x') === 0) return idx
      // Otherwise treat as an index into the global `lastHash` array
      // (artBlocks/tokenHash.js — same lookup that gui.js uses).
      if (typeof lastHash !== 'undefined' && Array.isArray(lastHash) && typeof idx === 'number') {
        const h = lastHash[idx]
        if (!h) {
          console.warn(`[measurePerf] lastHash[${idx}] is undefined — array length=${lastHash.length}`)
          return null
        }
        return h
      }
      return idx
    }

    const all = []
    for (const h of hashList) {
      const targetHash = resolveHashFromIndex(h)
      const perHash = []
      for (let i = 0; i < runs; i++) {
        if (typeof protoBatch === 'undefined') {
          console.warn('[measurePerf] protoBatch not available — call after setup()')
          return null
        }
        // Teardown any existing build for a clean measurement
        try { protoBatch.teardown() } catch (e) { /* first run ok */ }
        const t0 = performance.now()
        protoBatch.buildFromHash(targetHash)
        const tBuild = performance.now()
        await nextPaint()
        const tPaint = performance.now()
        const dom = snapshotDom()
        perHash.push({
          run: i + 1,
          buildMs: +(tBuild - t0).toFixed(1),
          paintMs: +(tPaint - tBuild).toFixed(1),
          totalMs: +(tPaint - t0).toFixed(1),
          ...dom,
        })
      }
      const avg = (k) => +(perHash.reduce((s, r) => s + r[k], 0) / perHash.length).toFixed(1)
      const summary = {
        hash: targetHash,
        runs: perHash.length,
        avgBuildMs: avg('buildMs'),
        avgPaintMs: avg('paintMs'),
        avgTotalMs: avg('totalMs'),
        nodeCount: perHash[0].nodeCount,
        maskCount: perHash[0].maskCount,
        isolateCount: perHash[0].isolateCount,
        filterCount: perHash[0].filterCount,
        feCount: perHash[0].feCount,
      }
      all.push({ ...summary, runs: perHash })
      console.log(`[measurePerf] hash=${typeof targetHash === 'string' ? targetHash.slice(0, 10) + '…' : targetHash}  build=${summary.avgBuildMs}ms  paint=${summary.avgPaintMs}ms  total=${summary.avgTotalMs}ms  masks=${summary.maskCount}/${summary.isolateCount} isolated  filters=${summary.filterCount} primitives=${summary.feCount}  nodes=${summary.nodeCount}`)
    }
    const overallAvg = +(all.reduce((s, r) => s + r.avgTotalMs, 0) / all.length).toFixed(1)
    const isolateRatio = all.length
      ? all.reduce((s, r) => s + (r.maskCount ? r.isolateCount / r.maskCount : 1), 0) / all.length
      : 1
    let verdict
    if (overallAvg > 5000) {
      verdict = `SVG pipeline likely unworkable on Safari (avg ${overallAvg}ms); recommend canvas-image-swap fallback.`
    } else if (isolateRatio < 0.95) {
      verdict = `Isolate coverage hole detected (${(isolateRatio * 100).toFixed(0)}% covered). Try: window.SAFARI_FORCE_ISOLATE_OVER_FILTER = true; reload; re-measure.`
    } else {
      verdict = `Isolation appears complete (${(isolateRatio * 100).toFixed(0)}%). Further perf wins require load reduction (filter primitives, region size).`
    }
    console.log(`[measurePerf] VERDICT: ${verdict}`)
    return { results: all, overallAvg, isolateRatio, verdict }
  }

  //FUNC: measureAcrossFlags() : Promise<Report>
  // Run measurePerf with multiple flag configs to pinpoint the cost driver.
  // Configurations tested:
  //   A. baseline             — current flags
  //   B. isolate OFF          — disables group-isolate workaround entirely
  //   C. isolate FORCE        — forces isolation even on already-filtered elements
  // Each config is measured against the same hash to make deltas meaningful.
  async function measureAcrossFlags(opts) {
    opts = opts || {}
    const hashes = opts.hashes || (typeof opts.hash !== 'undefined' ? [opts.hash] : [null])
    const runs = opts.runs || 1
    const restore = {
      iso: window.SAFARI_GROUP_ISOLATE_WORKAROUND,
      force: window.SAFARI_FORCE_ISOLATE_OVER_FILTER,
    }
    const cfgs = [
      { name: 'A_baseline', iso: true, force: false },
      { name: 'B_isolateOFF', iso: false, force: false },
      { name: 'C_forceISOLATE', iso: true, force: true },
    ]
    const out = {}
    for (const cfg of cfgs) {
      window.SAFARI_GROUP_ISOLATE_WORKAROUND = cfg.iso
      window.SAFARI_FORCE_ISOLATE_OVER_FILTER = cfg.force
      console.log(`[measureAcrossFlags] running config ${cfg.name} iso=${cfg.iso} force=${cfg.force}`)
      out[cfg.name] = await measurePerf({ hashes, runs })
    }
    window.SAFARI_GROUP_ISOLATE_WORKAROUND = restore.iso
    window.SAFARI_FORCE_ISOLATE_OVER_FILTER = restore.force
    console.log('[measureAcrossFlags] DONE. Restored flags. Compare avgTotalMs across A/B/C:')
    Object.entries(out).forEach(([k, v]) => console.log(`  ${k}: ${v.overallAvg}ms`))
    return out
  }

  //FUNC: measureTightRegion() : Promise<Report>
  // Apr 28 2026 — Tier 1b A/B: compares fixed FRAME+50 baseline against
  // the per-cut tight AABB region. Measures total render time AND total
  // filter-region pixel area (sum across all filters), the two key
  // numbers for judging whether tight regions help on Safari.
  //   A. baseline_FRAME50  — current default (SAFARI_FILTER_REGION_TIGHT=false)
  //   B. tight_AABB        — Tier 1b (SAFARI_FILTER_REGION_TIGHT=true)
  async function measureTightRegion(opts) {
    opts = opts || {}
    const hashes = opts.hashes || (typeof opts.hash !== 'undefined' ? [opts.hash] : [null])
    const runs = opts.runs || 1
    const restoreTight = window.SAFARI_FILTER_REGION_TIGHT
    const cfgs = [
      { name: 'A_baseline_FRAME50', tight: false },
      { name: 'B_tight_AABB', tight: true },
    ]
    const out = {}
    for (const cfg of cfgs) {
      window.SAFARI_FILTER_REGION_TIGHT = cfg.tight
      console.log(`[measureTightRegion] running config ${cfg.name} tight=${cfg.tight}`)
      out[cfg.name] = await measurePerf({ hashes, runs })
      // Sum filter region areas to quantify how much rasterization area we saved.
      const root = document.querySelector('#BG') || document.body
      let totalArea = 0, count = 0
      root.querySelectorAll('filter').forEach(f => {
        const w = parseFloat(f.getAttribute('width') || '0')
        const h = parseFloat(f.getAttribute('height') || '0')
        if (w && h) { totalArea += w * h; count++ }
      })
      out[cfg.name].totalRegionAreaUserUnits = totalArea
      out[cfg.name].avgRegionAreaUserUnits = count ? +(totalArea / count).toFixed(0) : 0
      console.log(`[measureTightRegion] ${cfg.name} avgRegionArea=${out[cfg.name].avgRegionAreaUserUnits} u² total=${totalArea} u² across ${count} filters`)
    }
    window.SAFARI_FILTER_REGION_TIGHT = restoreTight
    console.log('[measureTightRegion] DONE. Restored flag.')
    const A = out.A_baseline_FRAME50, B = out.B_tight_AABB
    if (A && B) {
      const speedupX = A.overallAvg / B.overallAvg
      const areaReductionX = A.totalRegionAreaUserUnits / B.totalRegionAreaUserUnits
      console.log(`[measureTightRegion] A→B: time ${A.overallAvg.toFixed(0)}ms → ${B.overallAvg.toFixed(0)}ms (${speedupX.toFixed(2)}× speedup), area ${A.totalRegionAreaUserUnits.toFixed(0)} → ${B.totalRegionAreaUserUnits.toFixed(0)} u² (${areaReductionX.toFixed(2)}× reduction)`)
      if (B.overallAvg < 2000) {
        console.log(`[measureTightRegion] VERDICT: tight region is sufficient (${B.overallAvg.toFixed(0)}ms < 2s). Ship Tier 1b.`)
      } else if (speedupX > 2) {
        console.log(`[measureTightRegion] VERDICT: tight region helps but still slow (${B.overallAvg.toFixed(0)}ms). Ship Tier 1b AND prepare canvas-image-swap fallback.`)
      } else {
        console.log(`[measureTightRegion] VERDICT: tight region not enough (${speedupX.toFixed(2)}× speedup). Canvas-image-swap is the right path.`)
      }
    }
    return out
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
    measurePerf,
    measureAcrossFlags,
    measureTightRegion,
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

  console.log('[SafariCompat] WebKit group-isolate workaround loaded.',
    'window.SafariCompat available;',
    'flag =', window.SAFARI_GROUP_ISOLATE_WORKAROUND)
})()
