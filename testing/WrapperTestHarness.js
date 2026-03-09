// CLASS: WrapperTestHarness
// Isolated test harness for ProtoSegment wrapper evaluation and memoization integrity.
// Usage: call `runWrapperTests()` from setup() or console after a grid is built.

class WrapperTestHarness {

  //MARK: Properties
  grid
  results = []
  memoKeys = [
    `adjDistanceObjs`,
    `arcCenterTangent`,
    `arcCenterVert`,
    `arcOrigin`,
    `arcOriginCorner`,
    `arcOriginToStart`,
    `arcOriginToNormal`,
    `arcOriginToEnd`,
    `arcOriginToArcCenter`,
    `arcRadius`,
    `adjWrapperObjsFinal`,
    `cornerVerts`,
    `corners`,
    `flatAmount`,
    `hasNoFlatness`,
    `hasCompleteStartCorner`,
    `hasCompleteEndCorner`,
    `hasNoWrappers`,
    `horVertSides`,
    `inOutAdjWrappers`,
    `inOutFlushWrappers`,
    `inShapeSameFacingCorners`,
    `andNeighborSameFacingCorners`,
    `inWrappers`,
    `isCutOut`,
    `isInnerMostRadiantWrapper`,
    `isInnerMostWrapper`,
    `isOutsideCorner`,
    `maxArcBounds`,
    `maxArcBoundsSeg`,
    `maxArcOrigin`,
    `maxArcRadius`,
    `maxEndCorner`,
    `maxStartCorner`,
    `middleArcOrigin`,
    `minArcBounds`,
    `minArcBoundsSeg`,
    `minArcOrigin`,
    `minArcRadius`,
    `minEndCorner`,
    `minStartCorner`,
    `normals`,
    `outsideCells`,
    `outWrappers`,
    `outWrapsOfThisShapeAndNeighbors`,
    `overlapSegs`,
    `part`,
    `radiantInWrappers`,
    `radiantOutWrappers`,
    `shapesWithinThisMaxArcBounds`,
    `turns`,
    `viableAdjWrapOrigins`,
    `viableArcOrigins`,
    `viableArcOriginsSeg`,
    `viableCoinWrapOriginBounds`,
    `viableCoinWrapOrigins`,
    `viableInWrappers`,
    `viableOutWrapOriginBounds`,
    `viableOutWrappers`,
    `viableRadiantOriginBounds`,
    `viableRadiantOrigins`,
    `viableWrappers`,
  ]

  // Keys that ARE in #resetMemoProps
  resetKeys = [
    `adjDistanceObjs`,
    `arcCenterTangent`,
    `arcCenterVert`,
    `arcOrigin`,
    `arcOriginCorner`,
    `arcOriginToStart`,
    `arcOriginToNormal`,
    `arcOriginToEnd`,
    `arcOriginToArcCenter`,
    `arcRadius`,
    `adjWrapperObjsFinal`,
    `flatAmount`,
    `hasNoFlatness`,
    `hasCompleteStartCorner`,
    `hasCompleteEndCorner`,
    `inWrappers`,
    `outWrappers`,
    `outWrapsOfThisShapeAndNeighbors`,
    `overlapSegs`,
  ]

  // Keys that depend ONLY on grid topology — safe to cache permanently.
  // These never change after shape construction, regardless of arc mutations.
  topologyStableKeys = [
    `corners`,
    `horVertSides`,
    `inShapeSameFacingCorners`,
    `andNeighborSameFacingCorners`,
    `isCutOut`,
    `isOutsideCorner`,
    `maxEndCorner`,
    `maxStartCorner`,
    `minEndCorner`,
    `minStartCorner`,
    `normals`,
    `outsideCells`,
    `part`,
    `turns`,
  ]

  // Keys that depend on arc state — MUST be invalidated when arcs change.
  // These are the keys most likely to cause stale bugs.
  arcVolatileKeys = [
    `adjDistanceObjs`,
    `adjWrapperObjsFinal`,
    `arcCenterTangent`,
    `arcCenterVert`,
    `arcOrigin`,
    `arcOriginCorner`,
    `arcOriginToArcCenter`,
    `arcOriginToEnd`,
    `arcOriginToNormal`,
    `arcOriginToStart`,
    `arcRadius`,
    `cornerVerts`,
    `flatAmount`,
    `hasCompleteEndCorner`,
    `hasCompleteStartCorner`,
    `hasNoFlatness`,
    `hasNoWrappers`,
    `inOutAdjWrappers`,
    `inOutFlushWrappers`,
    `inWrappers`,
    `isInnerMostRadiantWrapper`,
    `isInnerMostWrapper`,
    `maxArcBounds`,
    `maxArcBoundsSeg`,
    `maxArcOrigin`,
    `maxArcRadius`,
    `middleArcOrigin`,
    `minArcBounds`,
    `minArcBoundsSeg`,
    `minArcOrigin`,
    `minArcRadius`,
    `outWrappers`,
    `outWrapsOfThisShapeAndNeighbors`,
    `overlapSegs`,
    `radiantInWrappers`,
    `radiantOutWrappers`,
    `shapesWithinThisMaxArcBounds`,
    `viableAdjWrapOrigins`,
    `viableArcOrigins`,
    `viableArcOriginsSeg`,
    `viableCoinWrapOriginBounds`,
    `viableCoinWrapOrigins`,
    `viableInWrappers`,
    `viableOutWrapOriginBounds`,
    `viableOutWrappers`,
    `viableRadiantOriginBounds`,
    `viableRadiantOrigins`,
    `viableWrappers`,
  ]

  constructor(grid) {
    this.grid = grid
  }

  //MARK: Cache Inspection

  //METH: getCachedKeys(seg) : [String] : return all currently cached memoization keys for a segment
  getCachedKeys(seg) {
    const cache = memoCache.get(seg)
    if (!cache) return []
    return this.memoKeys.filter(key => Symbol.for(key) in cache)
  }

  //METH: isCached(seg, key) : Bool : check if a specific key is cached
  isCached(seg, key) {
    const cache = memoCache.get(seg)
    if (!cache) return false
    return Symbol.for(key) in cache
  }

  //METH: getCachedValue(seg, key) : any : return the cached value for a key
  getCachedValue(seg, key) {
    const cache = memoCache.get(seg)
    if (!cache) return undefined
    return cache[Symbol.for(key)]
  }

  //MARK: Snapshot & Diff

  //METH: snapshotSeg(seg) : Object : capture full cache + wrapper state for a segment
  snapshotSeg(seg) {
    const cachedKeys = this.getCachedKeys(seg)
    const snapshot = {
      id: seg.id,
      timestamp: performance.now(),
      hasArc: seg.hasArc,
      arcOrigin: seg.arcOrigin?.copy(),
      arcRadius: seg.arcRadius,
      inWrapper: seg.inWrapper?.id,
      outWrapper: seg.outWrapper?.id,
      cachedKeys: cachedKeys,
      cachedValues: {},
    }
    cachedKeys.forEach(key => {
      const val = this.getCachedValue(seg, key)
      snapshot.cachedValues[key] = this.#describeValue(val)
    })
    return snapshot
  }

  //METH: snapshotPool(pool) : [Object] : snapshot all segments in pool
  snapshotPool(pool) {
    return pool.map(s => this.snapshotSeg(s))
  }

  //METH: diffSnapshots(before, after) : Object : compare two snapshots of the same segment
  diffSnapshots(before, after) {
    if (before.id !== after.id) {
      DeBug.error(`WrapperTestHarness: diffSnapshots id mismatch`, before.id, after.id)
      return null
    }
    const diffs = []

    // Check arc origin change
    if (before.arcOrigin && after.arcOrigin) {
      if (!before.arcOrigin.equals(after.arcOrigin, 2)) {
        diffs.push({
          property: `arcOrigin`,
          before: before.arcOrigin.toString(),
          after: after.arcOrigin.toString(),
        })
      }
    } else if (before.arcOrigin !== after.arcOrigin) {
      diffs.push({
        property: `arcOrigin`,
        before: before.arcOrigin?.toString() ?? `none`,
        after: after.arcOrigin?.toString() ?? `none`,
      })
    }

    // Check arc radius change
    if (before.arcRadius !== after.arcRadius) {
      diffs.push({
        property: `arcRadius`,
        before: before.arcRadius,
        after: after.arcRadius,
      })
    }

    // Check wrapper identity change
    if (before.inWrapper !== after.inWrapper) {
      diffs.push({ property: `inWrapper`, before: before.inWrapper, after: after.inWrapper })
    }
    if (before.outWrapper !== after.outWrapper) {
      diffs.push({ property: `outWrapper`, before: before.outWrapper, after: after.outWrapper })
    }

    // Check for stale cache: keys that survived the mutation but whose source data changed
    const staleKeys = after.cachedKeys.filter(key => {
      if (!before.cachedKeys.includes(key)) return false
      return before.cachedValues[key] !== after.cachedValues[key]
        ? false
        : diffs.length > 0
    })

    return {
      id: before.id,
      mutations: diffs,
      staleKeys: staleKeys,
      survivedKeys: after.cachedKeys.filter(key => before.cachedKeys.includes(key)),
      newKeys: after.cachedKeys.filter(key => !before.cachedKeys.includes(key)),
      droppedKeys: before.cachedKeys.filter(key => !after.cachedKeys.includes(key)),
    }
  }

  //MARK: Staleness Detection

  //METH: detectStaleness(seg, mutationFn, label) : Object : run a mutation and detect stale caches
  detectStaleness(seg, mutationFn, label = `unnamed`) {
    // 1. Prime all memoized getters so the cache is full
    this.#primeCache(seg)
    const neighbors = seg.andNeighborsArray ?? [seg]
    neighbors.forEach(n => this.#primeCache(n))

    // 2. Snapshot before
    const beforeSeg = this.snapshotSeg(seg)
    const beforeNeighbors = neighbors.map(n => this.snapshotSeg(n))

    // 3. Execute mutation
    DeBug.groupCollapsed(`WTH: ${label} on ${seg.id}`)
    mutationFn()
    DeBug.groupEnd()

    // 4. Snapshot after (reads from cache where still present)
    const afterSeg = this.snapshotSeg(seg)
    const afterNeighbors = neighbors.map(n => this.snapshotSeg(n))

    // 5. Diff
    const segDiff = this.diffSnapshots(beforeSeg, afterSeg)
    const neighborDiffs = beforeNeighbors.map((bn, i) => this.diffSnapshots(bn, afterNeighbors[i]))

    const result = {
      label,
      segId: seg.id,
      segDiff,
      neighborDiffs: neighborDiffs.filter(d => d.mutations.length > 0 || d.staleKeys.length > 0),
      keysNotInResetList: this.memoKeys.filter(k => !this.resetKeys.includes(k)),
    }

    this.results.push(result)
    return result
  }

  //MARK: Targeted Mutation Tests

  //METH: testFlushWrap(seg) : Object : test flushWrap staleness
  testFlushWrap(seg) {
    if (!seg.flushWrapper) return null
    return this.detectStaleness(seg, () => seg.flushWrap(true), `flushWrap`)
  }

  //METH: testAdjWrap(seg) : Object : test adjWrap staleness
  testAdjWrap(seg) {
    if (!seg.adjacentWrapper) return null
    return this.detectStaleness(seg, () => seg.adjWrap(true), `adjWrap`)
  }

  //METH: testSetArcToMiddle(seg) : Object : test setArcToMiddle staleness
  testSetArcToMiddle(seg) {
    return this.detectStaleness(seg, () => seg.setArcToMiddle(), `setArcToMiddle`)
  }

  //METH: testReplaceEndCurveOrigin(seg) : Object : test replaceEndCurveOrigin staleness
  testReplaceEndCurveOrigin(seg) {
    if (!seg.arcOrigin) return null
    const origin = seg.arcOrigin.copy()
    return this.detectStaleness(
      seg,
      () => seg.replaceEndCurveOrigin(origin),
      `replaceEndCurveOrigin`
    )
  }

  //METH: testReplaceEndRadiantOutWrapsOrigin(seg) : Object : test replaceEndRadiantOutWrapsOrigin staleness
  testReplaceEndRadiantOutWrapsOrigin(seg) {
    if (!seg.arcOrigin) return null
    return this.detectStaleness(
      seg,
      () => seg.replaceEndRadiantOutWrapsOrigin(seg.arcOrigin),
      `replaceEndRadiantOutWrapsOrigin`
    )
  }

  //MARK: Pool-Level Tests

  //METH: testPool(pool) : [Object] : run all mutation tests on every eligible segment in pool
  testPool(pool = this.grid.allSimpleSubShapesSegs) {
    DeBug.group(`WTH: Testing pool of ${pool.length} segments`)
    const poolResults = []

    pool.forEach(seg => {
      const tests = [
        this.testSetArcToMiddle(seg),
        this.testFlushWrap(seg),
        this.testAdjWrap(seg),
      ].filter(Boolean)

      poolResults.push(...tests)
    })

    DeBug.groupEnd()
    return poolResults
  }

  //MARK: Reporting

  //METH: reportStaleResults() : null : log all results that contain stale keys
  reportStaleResults() {
    const staleResults = this.results.filter(r =>
      r.segDiff.staleKeys.length > 0
      || r.neighborDiffs.some(nd => nd.staleKeys.length > 0)
    )

    if (staleResults.length === 0) {
      DeBug.log(`WTH: ✅ No stale cache entries detected across ${this.results.length} tests`)
      return
    }

    DeBug.error(`WTH: ❌ ${staleResults.length} tests detected stale cache entries:`)
    staleResults.forEach(r => {
      DeBug.group(`${r.label} on ${r.segId}`)
      if (r.segDiff.staleKeys.length > 0) {
        DeBug.warn(`Stale on self:`, r.segDiff.staleKeys)
        DeBug.log(`Mutations:`, r.segDiff.mutations)
        DeBug.log(`Survived (not reset):`, r.segDiff.survivedKeys)
      }
      r.neighborDiffs.forEach(nd => {
        if (nd.staleKeys.length > 0) {
          DeBug.warn(`Stale on neighbor ${nd.id}:`, nd.staleKeys)
        }
      })
      DeBug.groupEnd()
    })
  }

  //METH: reportResetCoverage() : null : log which memoized keys are NOT in #resetMemoProps
  reportResetCoverage() {
    const uncovered = this.memoKeys.filter(k => !this.resetKeys.includes(k))
    const uncoveredVolatile = this.arcVolatileKeys.filter(k => !this.resetKeys.includes(k))
    const coveredStable = this.topologyStableKeys.filter(k => this.resetKeys.includes(k))
    const unclassified = uncovered.filter(k =>
      !this.topologyStableKeys.includes(k) && !this.arcVolatileKeys.includes(k)
    )

    DeBug.group(`WTH: Reset Coverage`)
    DeBug.log(`Total memoized keys: ${this.memoKeys.length}`)
    DeBug.log(`Keys in #resetMemoProps: ${this.resetKeys.length}`)
    DeBug.log(`Topology-stable keys (safe to keep cached): ${this.topologyStableKeys.length}`)
    DeBug.log(`Arc-volatile keys (must reset on mutation): ${this.arcVolatileKeys.length}`)

    if (uncoveredVolatile.length > 0) {
      DeBug.error(`⚠️ VOLATILE keys NOT in #resetMemoProps (${uncoveredVolatile.length}):`, uncoveredVolatile)
    } else {
      DeBug.log(`✅ All volatile keys are covered by #resetMemoProps`)
    }

    if (coveredStable.length > 0) {
      DeBug.warn(`🔄 Stable keys unnecessarily in reset (${coveredStable.length}):`, coveredStable)
    }

    if (unclassified.length > 0) {
      DeBug.warn(`❓ Unclassified keys — need review (${unclassified.length}):`, unclassified)
    }

    DeBug.groupEnd()
  }

  //METH: reportSurvivedKeys() : null : log keys that survived mutations without being invalidated
  reportSurvivedKeys() {
    const allSurvived = new Set()
    this.results.forEach(r => {
      r.segDiff.survivedKeys.forEach(k => allSurvived.add(k))
      r.neighborDiffs.forEach(nd => nd.survivedKeys.forEach(k => allSurvived.add(k)))
    })

    const survivedArr = [...allSurvived].sort()
    const survivedVolatile = survivedArr.filter(k => this.arcVolatileKeys.includes(k))
    const survivedStable = survivedArr.filter(k => this.topologyStableKeys.includes(k))
    const survivedUnclassified = survivedArr.filter(k =>
      !this.arcVolatileKeys.includes(k) && !this.topologyStableKeys.includes(k)
    )

    DeBug.group(`WTH: Survived Keys (cached through mutations)`)
    DeBug.log(`Total survived: ${survivedArr.length}`)

    if (survivedVolatile.length > 0) {
      DeBug.error(`⚠️ VOLATILE keys survived (${survivedVolatile.length}):`, survivedVolatile)
    } else {
      DeBug.log(`✅ No volatile keys survived mutations`)
    }

    if (survivedStable.length > 0) {
      DeBug.log(`ℹ️ Topology-stable keys survived (expected, ${survivedStable.length}):`, survivedStable)
    }

    if (survivedUnclassified.length > 0) {
      DeBug.warn(`❓ Unclassified keys survived (${survivedUnclassified.length}):`, survivedUnclassified)
    }

    DeBug.groupEnd()
  }

  //METH: reportFilterBanding() : [Object] : inspect current cut/filter stacks for quantization and offset gaps
  reportFilterBanding(cuts = S?.Cuts?.db) {
    const report = new OpArray

    cuts = OpArray.format(cuts)
      .map(cut => cut instanceof Array ? cut[1] : cut)
      .filter(Boolean)

    if (cuts.isEmpty) {
      DeBug.warn(`WTH: No cuts found for filter banding report`)
      return report
    }

    const summarizeGaps = (values) => {
      if (!values || values.length < 2) {
        return {
          count: values?.length || 0,
          gaps: new OpArray,
          minGap: 0,
          maxGap: 0,
          avgGap: 0,
          gapRatio: 0,
        }
      }

      const gaps = new OpArray
      for (let i = 1; i < values.length; i++) {
        gaps.push(roundToDec(values[i] - values[i - 1], 4))
      }

      const minGap = min(gaps)
      const maxGap = max(gaps)
      const avgGap = roundToDec(gaps.sum / gaps.length, 4)
      return {
        count: values.length,
        gaps,
        minGap,
        maxGap,
        avgGap,
        gapRatio: minGap === 0 ? 0 : roundToDec(maxGap / minGap, 4),
      }
    }

    DeBug.group(`WTH: Filter Banding Report`)
    DeBug.log(`Hash`, tokenData?.hash)
    DeBug.log(`Cut count`, cuts.length)

    cuts.forEach(cut => {
      const cutSummary = {
        breed: cut.breed,
        profile: cut.profile?.type,
        cutIn: cut.profile?.cutIn,
        depth: roundToDec(cut.depth, 4),
        useExtHighDepth: cut.useExtHighDepth,
        extHighDepth: roundToDec(cut.extHighDepth, 4),
        isFrame: cut.shapeGroups?.some?.(grp => grp?.isFrame) || false,
        filterCount: cut.filters?.length || 0,
        filters: new OpArray,
      }

      DeBug.group(`${cut.breed} depth=${roundToDec(cut.depth, 4)} filters=${cutSummary.filterCount} frame=${cutSummary.isFrame} useExtHighDepth=${cutSummary.useExtHighDepth}`)

      cut.filters.forEach((filter, index) => {
        const shades = OpArray.format(filter.shades || [])
        const signedOffsetMags = OpArray.from(filter.offsetElts.map(o => roundToDec(o.mag, 4))).numSorted
        const absOffsetMags = signedOffsetMags.map(m => roundToDec(abs(m), 4)).numSorted
        const uniqueAbsOffsetMags = absOffsetMags
          .filter((e, i, a) => i === 0 || !equalsRoundedDec(e, a[i - 1], 3))

        const blurRadii = shades.map(s => roundToDec(s.blur || 0, 4)).numSorted
        const uniqueBlurRadii = blurRadii
          .filter((e, i, a) => i === 0 || !equalsRoundedDec(e, a[i - 1], 3))

        const primitiveCount = filter.filter?.elt?.children?.length || 0
        const lightenCount = shades.filter(s => s.lighten).length
        const darkenCount = shades.filter(s => !s.lighten).length
        const duplicateCollapse = absOffsetMags.length - uniqueAbsOffsetMags.length
        const gapStats = summarizeGaps(uniqueAbsOffsetMags)
        const blurGapStats = summarizeGaps(uniqueBlurRadii)

        const summary = {
          index,
          id: filter.id,
          type: filter.type,
          primitiveCount,
          shadeCount: shades.length,
          lightenCount,
          darkenCount,
          signedOffsetMags,
          absOffsetMags,
          uniqueAbsOffsetMags,
          duplicateCollapse,
          gapStats,
          blurRadii,
          uniqueBlurRadii,
          blurGapStats,
          likelyBanding:
            uniqueAbsOffsetMags.length <= 5
            || gapStats.maxGap >= 2
            || gapStats.gapRatio >= 3
            || duplicateCollapse >= 2,
        }

        cutSummary.filters.push(summary)

        DeBug.log(
          `filter[${index}] ${filter.type} id=${filter.id}`,
          {
            primitiveCount,
            shadeCount: shades.length,
            lightenCount,
            darkenCount,
            signedOffsetMags,
            uniqueAbsOffsetMags,
            duplicateCollapse,
            gapStats,
            uniqueBlurRadii,
            blurGapStats,
            likelyBanding: summary.likelyBanding,
          }
        )
      })

      DeBug.groupEnd()
      report.push(cutSummary)
    })

    DeBug.groupEnd()
    return report
  }

  //MARK: Private Helpers

  //METH: #primeCache(seg) : null : force evaluation of all memoized getters to populate cache
  #primeCache(seg) {
    this.memoKeys.forEach(key => {
      try { seg[key] } catch (e) { /* some getters may not be applicable */ }
    })
  }

  //METH: #describeValue(val) : String : create a string description of a cached value for diffing
  #describeValue(val) {
    if (val === undefined) return `undefined`
    if (val === null) return `null`
    if (typeof val === `number`) return `${val}`
    if (typeof val === `boolean`) return `${val}`
    if (val instanceof Array || val instanceof OpArray) {
      return `[${val.length}]${val.map(v => v?.id ?? v?.toString?.() ?? `?`).join(`,`)}`
    }
    if (val?.id) return val.id
    if (val?.x !== undefined && val?.y !== undefined) return `(${roundToDec(val.x, 3)},${roundToDec(val.y, 3)})`
    if (val?.toString) return val.toString()
    return `{obj}`
  }
}

//MARK: Top-Level Runner

//FUNC: runWrapperTests(grid) : null : convenience function to run all wrapper tests and report
function runWrapperTests(grid = GRID) {
  if (!grid) {
    DeBug.error(`WTH: No grid provided or GRID not set`)
    return
  }

  const harness = new WrapperTestHarness(grid)

  DeBug.group(`🔬 Wrapper Test Harness`)

  // Report reset coverage first
  harness.reportResetCoverage()

  // Run pool tests
  harness.testPool()

  // Report findings
  harness.reportStaleResults()
  harness.reportSurvivedKeys()

  DeBug.groupEnd()

  // Store globally for console inspection
  window.WTH = harness
  DeBug.log(`WTH: Harness stored as window.WTH — inspect .results for details`)

  return harness
}

//FUNC: runFilterBandingDiagnostics(hash, rebuild) : [Object] : inspect current cut/filter stack for banding suspects
function runFilterBandingDiagnostics(hash = tokenData?.hash, rebuild = false) {
  if (rebuild && hash) {
    protoBatch.buildFromHash(hash)
  }

  if (!GRID) {
    DeBug.error(`WTH: No GRID available for filter banding diagnostics`)
    return
  }

  const harness = new WrapperTestHarness(GRID)
  const report = harness.reportFilterBanding()
  window.WTHBanding = report
  DeBug.log(`WTHBanding: stored filter banding report on window.WTHBanding`)
  return report
}

//FUNC: runSVGArtifactDiagnostics(hash) : Object : run the standard artifact checks for a hash
async function runSVGArtifactDiagnostics(hash = tokenData?.hash) {
  if (!hash) {
    DeBug.error(`WTH: No hash provided for SVG artifact diagnostics`)
    return
  }

  const banding = runFilterBandingDiagnostics(hash, true)
  const variantSheet = await batchFilterVariantContactSheet({ hash })
  const report = { hash, banding, variantSheet }
  window.WTHSvgArtifact = report
  DeBug.log(`WTHSvgArtifact: stored SVG artifact report on window.WTHSvgArtifact`)
  return report
}

//MARK: Test Case Hashes
// Curated hashes that exercise specific wrapper configurations.
// Add hashes as you identify them. Status can be: 'golden', 'broken', 'untested'

const WRAPPER_TEST_CASES = {
  // MARK: Coincident Wrapper Cases
  coincident_basic: {
    hash: '0x4d477f3bbd4ed6923933ea640f395ab46fa634f0c793b200543e14e0258e1fa1',
    description: 'Two shapes meeting at a grid intersection with same-facing corners',
    wrapTypes: ['coincident'],
    status: 'golden',
  },

  // MARK: Collinear Wrapper Cases
  collinear_basic_1: {
    hash: '0x148d16d3ece96ae5b788fc03f6dcf3fb3e41a421610a5aa744c94c2058d82241',
    description: 'Two same-facing corners with one shared collinear segment',
    wrapTypes: ['collinear'],
    status: 'broken',
  },
  collinear_basic_2: {
    hash: '0xea81099bcdcba24cebee5a92f74f5904219139848a208d1001f6e1fdba6a2026',
    description: 'Two same-facing corners with one shared collinear segment',
    wrapTypes: ['collinear'],
    status: 'golden',
  },

  // MARK: Adjacent Wrapper Cases
  adjacent_basic: {
    hash: '0xcea2111e7f43afc674e88ef75e1a3ff21434c01c20007427dc80b58eec99332a',
    description: 'Nearby same-facing corners, not collinear or coincident',
    wrapTypes: ['adjacent'],
    status: 'untested',
  },

  // MARK: Radiant Wrapper Cases
  radiant_stack: {
    hash: '0xf526785ff29b4e8876379299b91b01c0ed77b10074031c462489990da4a1b56e',
    description: '3+ diagonally aligned same-facing corners sharing an arc origin',
    wrapTypes: ['radiant'],
    status: 'golden',
  },

  // MARK: Interference Cases
  interference_01: {
    hash: '0x2b784a305e9dc169458e8e8c11f3a77bc06574c89ec7bd097c7bc586ac19fc1d',
    description: 'Single-intermediate interference: 3 shapes (shp000/shp001/shp002), 1 intermediate band. Proves radiantOutWrappers.length counts wrapper layers, not shapes.',
    wrapTypes: ['radiant', 'interference'],
    status: 'golden',
  },
  interference_02: {
    hash: '0x1cee4f76739fa057af9faadece94b8ee7b77939ce6a36a0567ae455cd6215c7e',
    description: 'Multi-shape interference: opposing radiant stacks with ~4 harmonic intermediate bands. Disabling wrapInterferenceCorners causes visible wobble in 3rd band.',
    wrapTypes: ['radiant', 'interference'],
    status: 'golden',
  },

  // MARK: CW/CCW Inter-shape Cases
  intershape_1: {
    hash: '0xea81099bcdcba24cebee5a92f74f5904219139848a208d1001f6e1fdba6a2026',
    description: 'Inter-shape placed inside a larger shape',
    wrapTypes: ['coincident', 'adjacent'],
    status: 'untested',
  },
  intershape_2: {
    hash: '0xe91bbc42ec19afa2f4f6c01e6b197ce5e4dac847ec709957fdf955125273bd94',
    description: 'Inter-shape placed inside a larger shape',
    wrapTypes: ['coincident', 'adjacent'],
    status: 'untested',
  },
  intershape_3: {
    hash: '0x97f986cdf74eefc34d1a7e986c481089525588e4ac775c4aa2756f5787f57f4a',
    description: 'Inter-shape placed inside a larger shape',
    wrapTypes: ['coincident', 'adjacent'],
    status: 'untested',
  },

  // MARK: SVG Filter/Mask Cases
  cascade_frame_crop_1: {
    hash: '0xfc1214679c09114f623503e0444221e975873c9c5920a427d1bd3ffca215af4a',
    description: 'Frame cascade cuts cropped — filter layout percentages too small for stacked cascade depth (§ 9.14.1)',
    wrapTypes: [],
    issues: ['cascade-crop'],
    status: 'fixed',
  },
  r_mask_crop_1: {
    hash: '0x7e1c7d95efd660f751e839ed4b63e000c1c45f8d9b0c9b82bfa145cab08509b2',
    description: 'R-profile mask cropping — blurred mask paths clipped by default mask bounds (§ 9.14.2)',
    wrapTypes: [],
    issues: ['mask-crop'],
    status: 'fixed',
  },
  filter_banding_1: {
    hash: '0x3e8a98faacc735c66bc2f535e0d943ee2c65fdddb47a48f54857444fc4251d34',
    description: 'Visible shade banding on large pill body and inner glyph contours. Suspected discrete offset ladder / rounding / dedupe quantization in neuShadeSVGFactory().',
    wrapTypes: [],
    issues: ['filter-banding'],
    status: 'broken',
  },
  bottom_bar_1: {
    hash: '0x1c0ffe68e83b09c41e06bc44ca9eacc6e0670b96763d26e899c578fbeedfb13e',
    description: 'Bottom frame bar artifact. Re-test with same-hash SVG variant contact sheet before changing runtime layout code.',
    wrapTypes: [],
    issues: ['bottom-bar', 'svg-artifact'],
    status: 'broken',
  },
  cascade_grid_crop_1: {
    hash: '0xe2f57b77fd2aa05a6d292faf2b787a05717986b5b63d4683aae4d14401d97c91',
    description: 'Grid-layer cascade filter effects cropped at ShapeGroup viewport — boundsRect expanded to FRAME.boundsRect (§ 9.14.1). Regressed after Mar 5 rollback.',
    wrapTypes: [],
    issues: ['cascade-crop'],
    status: 'broken',
  },
  cascade_grid_crop_2: {
    hash: '0x409bcf3e22eb3b0acda546873026dd67d6020ca35d03e0a18b469af8c1ae0a72',
    description: 'Cascade cut cropping regression — grid-layer cascade shadows clipped at ShapeGroup viewport (§ 9.14.1 re-regression)',
    wrapTypes: [],
    issues: ['cascade-crop'],
    status: 'broken',
  },

  // MARK: Known Broken
  // Add hashes that currently produce incorrect output
  broken_08: {
    hash: '0x96659ca308edda09ab8a4dd403dde3b5058b54669261d9cd258bec389916aeda',
    description: 'Duplicate overlapping shapes — two shapes occupy same cells in upper-center area. Possible grouping/island duplication bug. Also hangs WrapperTestHarness testPool.',
    wrapTypes: [],
    issues: ['grouping', 'test-hang'],
    status: 'broken',
  },
  broken_01: {
    hash: '0x1410e2bed3f8683cbead76732fb0def423f94ee0d9fa3af1471f36e8bb384d53',
    description: 'grouping error, multiple groups contain same cell',
    wrapTypes: [],
    status: 'broken',
  },
  broken_02: {
    hash: '0x74ba9710dc22263597460e7899d958af8a2c14fa3c8bace495a5a77ead058da4',
    description: 'grouping error, multiple groups contain same cell',
    wrapTypes: [],
    status: 'broken',
  },
  broken_03: {
    hash: '0x9ffd10e7d83db6dd960f42912f0fd29708c01d4361a06c68e2afbab85db4e62f',
    description: 'grouping error, multiple groups contain same cell',
    wrapTypes: [],
    status: 'broken',
  },
  broken_04: {
    hash: '0x55a53f6999f4bb6bfc914285079ab9138340d170b681fbfdf90a746fbd0500b3',
    description: 'broken proximal wrap, outer wrapper is converging and intersecting inner wrapper',
    wrapTypes: ['proximal'],
    status: 'broken',
  },
  broken_05: {
    hash: '0xd687aa24d49094b2d25db0992fab8680a82b31791b80c162c1b2395e409b2c47',
    description: 'broken proximal wrap, outer wrapper is converging and almost/barely intersecting inner wrapper',
    wrapTypes: ['proximal'],
    status: 'broken',
  },
  broken_06: {
    hash: '0x008054ead8201c6888edfc591d011535247cb655099b0eea5e751a62353faf5b',
    description: 'broken proximal wrap, outer wrapper is converging and almost/barely intersecting inner wrapper',
    wrapTypes: ['proximal'],
    status: 'broken',
  },
  broken_07: {
    hash: '0xe77a297196f3b596d167669c4677d1ccd10e37537568523ba90f466ec8b7aff8',
    description: 'broken proximal wrap, outer wrapper is converging and almost/barely intersecting inner wrapper',
    wrapTypes: ['adjacent'],
    status: 'broken',
  },

  // MARK: Known Good (Golden References)
  // Add hashes that currently produce correct output
  // golden_01: {
  //   hash: '0x...',
  //   description: '',
  //   wrapTypes: [],
  //   status: 'golden',
  // },
}

//MARK: Frame Bottom-Bar Regression Sets
// Curated comparison pools for the large-depth rOut frame slab / bottom-bar bug.
// Keep these arrays short and high-signal: hashes that clearly DO show the bug,
// hashes that clearly DO NOT, and optional hashes that still need review.

const FRAME_BOTTOM_BAR_HASH_SETS = {
  broken: [
    '0x1c0ffe68e83b09c41e06bc44ca9eacc6e0670b96763d26e899c578fbeedfb13e',
    '0x213f67b6eac7b1d5a7b1628ab87705e8008070e0c58644dc1c8cbc43385271d6',
    '0x2a6587247a406c4611238e276c9ce7cc84d33d64867927c910d04d930ff8626a',
    '0x67b996591a28ff72ca37e57b05defb60d42edeb528b5bb46262760c06c5b5ca8',
    '0x22a353f93324ee8cea610673a40714199d5795fa8e88f4e6a5a94a0dd2c1508b',
    {
      hash: '0x9c352733f0eade48990298caedef1c1b501dd87fc63409806cc58f46922a4522',
      artifactClass: 'grid-banding',
      compareAs: 'outlier',
      note: 'Banding appears inside a grid shape rather than on the frame bottom bar.',
    },
    {
      hash: '0xbbc1d21e7083a4822fc64adb7b3c74197de8eb6b4064760a012f37c9a8f200c7',
      artifactClass: 'frame-bottom-bar',
      compareAs: 'primary',
      note: 'Frame rOut cut is relatively small; useful counterexample against depth-only explanations.',
    },
  ],
  golden: [
    '0x777ff940106d0431845cc85a7f42d5ebe9b64de048a72c2edaeeed098ed5d0df',
    '0xc1b36012b6882e8405ecff99e96388891731cbbdbd203f58f05419abf885f4f1',
    '0x59608df9414a7519f701bd8dda3d5e91c38ff65498b8acef1448cc926e132aad',
    '0x73d12375c139e4016eaf5978483eb59691fc4f8f44fae9c989db0f2c9df0ef1f',
    '0xe36e4733e5ee91fdde09118ef5fc995a9467fd71f01e81526b733a5d3c7992ba',
    {
      hash: '0x0484b17d0830936e4c24076957a0aefffb44ea4a1b2a970e1a826ddf3d366dda',
      artifactClass: 'frame-clean',
      compareAs: 'primary',
      note: 'Magical golden reference with no frame bottom bar.',
    },
  ],
  review: [
  ],
}

function normalizeFrameBottomBarEntry(entry, pool, index) {
  if (typeof entry === `string`) {
    return {
      hash: entry,
      name: `frame_bar_${pool}_${index}`,
      status: pool === `review` ? `untested` : pool,
      issue: `frame-bottom-bar`,
      pool,
      artifactClass: pool === `golden` ? `frame-clean` : `frame-bottom-bar`,
      compareAs: `primary`,
      note: ``,
    }
  }

  return {
    hash: entry.hash,
    name: entry.name || `frame_bar_${pool}_${index}`,
    status: entry.status || (pool === `review` ? `untested` : pool),
    issue: entry.issue || `frame-bottom-bar`,
    pool,
    artifactClass: entry.artifactClass || (pool === `golden` ? `frame-clean` : `frame-bottom-bar`),
    compareAs: entry.compareAs || `primary`,
    note: entry.note || ``,
  }
}

function getFrameBottomBarHashEntries(include = `all`, { compareAs = `all` } = {}) {
  const requested = include === `all`
    ? [`broken`, `golden`, `review`]
    : OpArray.format(include)

  return requested
    .filter(key => FRAME_BOTTOM_BAR_HASH_SETS[key])
    .map(key => FRAME_BOTTOM_BAR_HASH_SETS[key].map((entry, index) => normalizeFrameBottomBarEntry(entry, key, index)))
    .flat()
    .filter(entry => compareAs === `all` || entry.compareAs === compareAs)
}

//FUNC: reportFrameBottomBarHashSets() : Object : summarize broken/golden/review pools for the frame bottom-bar bug
function reportFrameBottomBarHashSets() {
  const entries = getFrameBottomBarHashEntries()
  const summary = {
    broken: FRAME_BOTTOM_BAR_HASH_SETS.broken.length,
    golden: FRAME_BOTTOM_BAR_HASH_SETS.golden.length,
    review: FRAME_BOTTOM_BAR_HASH_SETS.review.length,
    primary: entries.filter(entry => entry.compareAs === `primary`).length,
    outliers: entries.filter(entry => entry.compareAs === `outlier`).length,
    entries,
  }
  window.WTHFrameBottomBarSets = summary
  console.log(summary)
  return summary
}

//FUNC: batchFrameBottomBarRegressionSheet({include, cols, cellSize, label}) : Object|null
// Renders the curated broken/golden/review pools for the frame bottom-bar bug.
async function batchFrameBottomBarRegressionSheet({
  include = `all`,
  compareAs = `all`,
  debugHarness = null,
  cols = 4,
  cellSize = { x: 320, y: 576 },
  padding = 20,
  label = `frame-bottom-bar-regression-sheet`,
} = {}) {
  const hashes = getFrameBottomBarHashEntries(include, { compareAs })
  if (hashes.length === 0) {
    console.warn(`batchFrameBottomBarRegressionSheet: no hashes in requested pools`)
    return null
  }

  const count = hashes.length
  const rows = Math.ceil(count / cols)
  const effectiveLabelH = 24
  const totalW = cols * (cellSize.x + padding) + padding
  const totalH = rows * (cellSize.y + padding + effectiveLabelH) + padding

  const canvas = document.createElement(`canvas`)
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext(`2d`)

  ctx.fillStyle = `#1a1a1a`
  ctx.fillRect(0, 0, totalW, totalH)

  for (let i = 0; i < count; i++) {
    const { hash, name, status, compareAs: entryCompareAs } = hashes[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (cellSize.x + padding)
    const y = padding + row * (cellSize.y + padding + effectiveLabelH)

    if (protoBatch?.teardown) protoBatch.teardown()
    if (debugHarness) FDH.install(debugHarness)
    else FDH.uninstall()
    protoBatch.buildFromHash(hash)

    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 100))

    const svgImage = await captureCurrentSVG(cellSize)
    if (svgImage) {
      ctx.drawImage(svgImage, x, y + effectiveLabelH, cellSize.x, cellSize.y)
    } else {
      ctx.fillStyle = `#333`
      ctx.fillRect(x, y + effectiveLabelH, cellSize.x, cellSize.y)
      ctx.fillStyle = `#f66`
      ctx.font = `14px monospace`
      ctx.fillText(`RENDER FAILED`, x + 10, y + effectiveLabelH + cellSize.y / 2)
    }

    ctx.fillStyle = status === `broken` ? `#f66`
      : status === `golden` ? `#6f6`
        : `#aaa`
    ctx.font = `bold 11px monospace`
    ctx.fillText(`${name}`, x + 4, y + 14)
    ctx.fillStyle = `#666`
    ctx.font = `10px monospace`
    ctx.fillText(`${hash.slice(0, 6)}…${hash.slice(-4)} | ${entryCompareAs}`, x + 4, y + 14 + 12)

    ctx.strokeStyle = status === `broken` ? `#f66`
      : status === `golden` ? `#6f6`
        : `#555`
    ctx.lineWidth = status === `untested` ? 1 : 2
    ctx.strokeRect(x, y + effectiveLabelH, cellSize.x, cellSize.y)
  }

  FDH.uninstall()
  if (protoBatch?.teardown) protoBatch.teardown()

  const link = document.createElement(`a`)
  const modeLabel = debugHarness ? `-patched` : ``
  link.download = `${label}${modeLabel}-${new Date().toISOString().slice(0, 10)}.png`
  link.href = canvas.toDataURL(`image/png`)
  link.click()

  const report = { include, compareAs, debugHarness, count: hashes.length, hashes, filename: link.download }
  window.WTHFrameBottomBarRegressionSheet = report
  return report
}

//FUNC: saveFrameBottomBarSheets() : null : convenience runner to save both broken and golden contact sheets
async function saveFrameBottomBarSheets({ cols = 4, cellSize = { x: 320, y: 576 }, padding = 20 } = {}) {
  DeBug.group(`Save Frame Bottom-Bar Sheets`)
  DeBug.log(`Generating BROKEN set`)
  await batchFrameBottomBarRegressionSheet({ include: 'broken', cols, cellSize, padding, label: `frame-bottom-bar-broken` })
  await new Promise(r => setTimeout(r, 250))
  DeBug.log(`Generating GOLDEN set`)
  await batchFrameBottomBarRegressionSheet({ include: 'golden', cols, cellSize, padding, label: `frame-bottom-bar-golden` })
  DeBug.log(`Saved both sheets to downloads`)
  DeBug.groupEnd()
  return true
}

window.saveFrameBottomBarSheets = saveFrameBottomBarSheets

function summarizeFrameGroup(group, index) {
  return {
    index,
    type: group.type,
    breed: group.cut?.breed,
    filterType: group.filter?.type,
    id: group.id,
    shadeCount: group.filter?.shades?.length,
    offsetMagnitudes: group.filter?.offsetElts?.map(({ mag }) => mag) || [],
  }
}

function summarizeSvgBBox(element) {
  if (!element?.elt) return undefined

  const frameElt = FRAME?.svgElt?.elt || FRAME?.bleed?.elt
  if (!frameElt?.getScreenCTM) return undefined

  const frameMatrix = frameElt.getScreenCTM()
  if (!frameMatrix?.inverse) return undefined

  const frameInverse = frameMatrix.inverse()

  const nodes = [
    ...element.elt.querySelectorAll(`path, rect, circle, ellipse, line, polyline, polygon, use`),
  ].filter(node => typeof node.getBBox === `function` && typeof node.getScreenCTM === `function`)

  if (!nodes.length) return undefined

  const rects = nodes
    .map(node => {
      const bbox = node.getBBox()
      const matrix = node.getScreenCTM()
      if (!bbox || !matrix || (!bbox.width && !bbox.height)) return null

      const corners = [
        new DOMPoint(bbox.x, bbox.y),
        new DOMPoint(bbox.x + bbox.width, bbox.y),
        new DOMPoint(bbox.x, bbox.y + bbox.height),
        new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height),
      ]
        .map(point => point.matrixTransform(matrix))
        .map(point => point.matrixTransform(frameInverse))

      return corners.reduce((union, point) => ({
        left: min(union.left, point.x),
        top: min(union.top, point.y),
        right: max(union.right, point.x),
        bottom: max(union.bottom, point.y),
      }), {
        left: corners[0].x,
        top: corners[0].y,
        right: corners[0].x,
        bottom: corners[0].y,
      })
    })
    .filter(Boolean)

  if (!rects.length) return undefined

  const rect = rects.reduce((union, next) => ({
    left: min(union.left, next.left),
    top: min(union.top, next.top),
    right: max(union.right, next.right),
    bottom: max(union.bottom, next.bottom),
  }), {
    left: rects[0].left,
    top: rects[0].top,
    right: rects[0].right,
    bottom: rects[0].bottom,
  })

  const frameWidth = FRAME?.size?.x
  const frameHeight = FRAME?.size?.y
  if (!frameWidth || !frameHeight) return undefined

  const bbox = {
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  }
  const verticalSlack = max(0, frameHeight - bbox.height)
  return {
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    aspect: bbox.width > 0 ? bbox.height / bbox.width : undefined,
    widthRatio: frameWidth ? bbox.width / frameWidth : undefined,
    heightRatio: frameHeight ? bbox.height / frameHeight : undefined,
    areaRatio: frameWidth && frameHeight
      ? (bbox.width * bbox.height) / (frameWidth * frameHeight)
      : undefined,
    verticalSlack,
    topBottomSlackEach: verticalSlack !== undefined ? verticalSlack / 2 : undefined,
  }
}

function summarizeCurrentFrameForBottomBarHash(entry, pool = `unknown`) {
  const normalized = typeof entry === `string`
    ? normalizeFrameBottomBarEntry(entry, pool, 0)
    : entry
  const frameGroups = FRAME?.backGroup?.shapeGroups || []
  const groupSummaries = frameGroups.map((group, index) => summarizeFrameGroup(group, index))
  const comboGroups = groupSummaries.filter(group => group.filterType === `combo`)
  const rOutCombo = comboGroups.find(group => group.breed?.startsWith(`rOut`))
  const backingGroup = FRAME?.backGroup?.shapeGroups?.[0]
  const rOutComboGroup = FRAME?.backGroup?.shapeGroups?.find(group => group.filter?.type === `combo` && group.cut?.breed?.startsWith(`rOut`))
  const backingBBox = summarizeSvgBBox(backingGroup?.svgGroupElt)
  const rOutComboBBox = summarizeSvgBBox(rOutComboGroup?.svgGroupElt)

  return {
    hash: normalized.hash,
    pool: normalized.pool || pool,
    artifactClass: normalized.artifactClass,
    compareAs: normalized.compareAs,
    note: normalized.note,
    gridStyle: GRID?.gridStyle,
    gridColumns: GRID?.gridSize?.x,
    gridRows: GRID?.gridSize?.y,
    gridAspect: GRID?.gridAspect,
    cellAspect: GRID?.cellAspect,
    frameGroupCount: groupSummaries.length,
    comboGroupCount: comboGroups.length,
    rOutComboBreed: rOutCombo?.breed,
    rOutComboShadeCount: rOutCombo?.shadeCount,
    rOutComboMaxAbsOffset: rOutCombo?.offsetMagnitudes?.length
      ? max(rOutCombo.offsetMagnitudes.map(mag => Math.abs(mag)))
      : undefined,
    rOutComboMinAbsOffset: rOutCombo?.offsetMagnitudes?.length
      ? min(rOutCombo.offsetMagnitudes.map(mag => Math.abs(mag)))
      : undefined,
    backingHeightOccupancy: backingBBox?.heightRatio,
    backingNearFullHeight: backingBBox?.heightRatio ? backingBBox.heightRatio >= 0.99 : undefined,
    backingTopBottomSlackEach: backingBBox?.topBottomSlackEach,
    comboHeightOccupancy: rOutComboBBox?.heightRatio,
    comboNearFullHeight: rOutComboBBox?.heightRatio ? rOutComboBBox.heightRatio >= 0.99 : undefined,
    comboTopBottomSlackEach: rOutComboBBox?.topBottomSlackEach,
    zeroVerticalSlack: backingBBox?.topBottomSlackEach === 0 && rOutComboBBox?.topBottomSlackEach === 0,
    magicalFullHeightCandidate: GRID?.gridStyle === `Magical`
      && backingBBox?.topBottomSlackEach === 0
      && rOutComboBBox?.topBottomSlackEach === 0,
    backingBBox,
    rOutComboBBox,
    groups: groupSummaries,
  }
}

//FUNC: reportFrameBottomBarSetComparison({include, dedupe}) : [Object]
// Rebuild each curated bottom-bar hash and summarize its frame ShapeGroups.
async function reportFrameBottomBarSetComparison({
  include = [`broken`, `golden`],
  dedupe = true,
  debugHarness = null,
  compareAs = `all`,
} = {}) {
  const entries = getFrameBottomBarHashEntries(include, { compareAs })
  const seen = new Set()
  const duplicates = new OpArray
  const summaries = new OpArray

  for (const entry of entries) {
    if (dedupe && seen.has(entry.hash)) {
      duplicates.push(entry)
      continue
    }
    seen.add(entry.hash)

    if (protoBatch?.teardown) protoBatch.teardown()
    if (debugHarness) FDH.install(debugHarness)
    else FDH.uninstall()
    protoBatch.buildFromHash(entry.hash)

    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 50))

    summaries.push(summarizeCurrentFrameForBottomBarHash(entry, entry.pool))
  }

  const table = summaries.map(summary => ({
    pool: summary.pool,
    hash: `${summary.hash.slice(0, 10)}...${summary.hash.slice(-6)}`,
    artifactClass: summary.artifactClass,
    compareAs: summary.compareAs,
    gridStyle: summary.gridStyle,
    gridColumns: summary.gridColumns,
    gridRows: summary.gridRows,
    gridAspect: summary.gridAspect,
    cellAspect: summary.cellAspect,
    frameGroupCount: summary.frameGroupCount,
    comboGroupCount: summary.comboGroupCount,
    rOutComboBreed: summary.rOutComboBreed,
    rOutComboShadeCount: summary.rOutComboShadeCount,
    rOutComboMinAbsOffset: summary.rOutComboMinAbsOffset,
    rOutComboMaxAbsOffset: summary.rOutComboMaxAbsOffset,
    backingHeightOccupancy: summary.backingHeightOccupancy,
    backingNearFullHeight: summary.backingNearFullHeight,
    backingTopBottomSlackEach: summary.backingTopBottomSlackEach,
    comboHeightOccupancy: summary.comboHeightOccupancy,
    comboNearFullHeight: summary.comboNearFullHeight,
    comboTopBottomSlackEach: summary.comboTopBottomSlackEach,
    zeroVerticalSlack: summary.zeroVerticalSlack,
    magicalFullHeightCandidate: summary.magicalFullHeightCandidate,
    backingAspect: summary.backingBBox?.aspect,
    backingWidthRatio: summary.backingBBox?.widthRatio,
    backingHeightRatio: summary.backingBBox?.heightRatio,
    comboAspect: summary.rOutComboBBox?.aspect,
    comboWidthRatio: summary.rOutComboBBox?.widthRatio,
    comboHeightRatio: summary.rOutComboBBox?.heightRatio,
  }))

  const aggregates = {
    broken: {
      count: summaries.filter(summary => summary.pool === `broken`).length,
      magical: summaries.filter(summary => summary.pool === `broken` && summary.gridStyle === `Magical`).length,
      zeroSlack: summaries.filter(summary => summary.pool === `broken` && summary.zeroVerticalSlack).length,
      candidate: summaries.filter(summary => summary.pool === `broken` && summary.magicalFullHeightCandidate).length,
    },
    golden: {
      count: summaries.filter(summary => summary.pool === `golden`).length,
      magical: summaries.filter(summary => summary.pool === `golden` && summary.gridStyle === `Magical`).length,
      zeroSlack: summaries.filter(summary => summary.pool === `golden` && summary.zeroVerticalSlack).length,
      candidate: summaries.filter(summary => summary.pool === `golden` && summary.magicalFullHeightCandidate).length,
    },
    primaryOnly: {
      broken: summaries.filter(summary => summary.pool === `broken` && summary.compareAs === `primary`).length,
      brokenCandidate: summaries.filter(summary => summary.pool === `broken` && summary.compareAs === `primary` && summary.magicalFullHeightCandidate).length,
      golden: summaries.filter(summary => summary.pool === `golden` && summary.compareAs === `primary`).length,
      goldenCandidate: summaries.filter(summary => summary.pool === `golden` && summary.compareAs === `primary` && summary.magicalFullHeightCandidate).length,
    },
    outliers: {
      broken: summaries.filter(summary => summary.pool === `broken` && summary.compareAs === `outlier`).length,
      brokenCandidate: summaries.filter(summary => summary.pool === `broken` && summary.compareAs === `outlier` && summary.magicalFullHeightCandidate).length,
      golden: summaries.filter(summary => summary.pool === `golden` && summary.compareAs === `outlier`).length,
      goldenCandidate: summaries.filter(summary => summary.pool === `golden` && summary.compareAs === `outlier` && summary.magicalFullHeightCandidate).length,
    },
  }

  const report = {
    include: OpArray.format(include),
    compareAs,
    dedupe,
    debugHarness,
    duplicates,
    summaries,
    table,
    aggregates,
  }

  window.WTHFrameBottomBarComparison = report
  console.table(table)
  console.log(`Frame bottom-bar aggregates`, aggregates)
  if (!duplicates.isEmpty) console.warn(`Duplicate hashes skipped:`, duplicates)
  return report
}

//FUNC: compareFrameBottomBarModes({include, compareAs, patchedHarness}) : Object
// Runs the frame-bottom-bar comparison twice and summarizes the per-hash delta.
async function compareFrameBottomBarModes({
  include = [`broken`, `golden`],
  compareAs = `primary`,
  patchedHarness = { gridBoundsMode: `magicalFitFrame` },
} = {}) {
  const runtime = await reportFrameBottomBarSetComparison({ include, compareAs })
  const patched = await reportFrameBottomBarSetComparison({ include, compareAs, debugHarness: patchedHarness })

  const patchedByHash = new Map(patched.summaries.map(summary => [summary.hash, summary]))
  const deltaTable = runtime.summaries.map(summary => {
    const next = patchedByHash.get(summary.hash)
    return {
      pool: summary.pool,
      hash: `${summary.hash.slice(0, 10)}...${summary.hash.slice(-6)}`,
      artifactClass: summary.artifactClass,
      compareAs: summary.compareAs,
      runtimeZeroSlack: summary.zeroVerticalSlack,
      patchedZeroSlack: next?.zeroVerticalSlack,
      runtimeCandidate: summary.magicalFullHeightCandidate,
      patchedCandidate: next?.magicalFullHeightCandidate,
      runtimeBackingOccupancy: summary.backingHeightOccupancy,
      patchedBackingOccupancy: next?.backingHeightOccupancy,
      runtimeComboOccupancy: summary.comboHeightOccupancy,
      patchedComboOccupancy: next?.comboHeightOccupancy,
      runtimeComboBreed: summary.rOutComboBreed,
      patchedComboBreed: next?.rOutComboBreed,
    }
  })

  const report = {
    include: OpArray.format(include),
    compareAs,
    patchedHarness,
    runtime,
    patched,
    deltaTable,
  }

  window.WTHFrameBottomBarModeDelta = report
  console.table(deltaTable)
  return report
}

//MARK: Batch Contact Sheet

function describeVariantPatch(patch = null) {
  if (!patch) return `runtime`

  const parts = []
  if (patch.filterRegionMode) parts.push(`region:${patch.filterRegionMode}`)
  if (patch.cutBoundsMode) parts.push(`bounds:${patch.cutBoundsMode}`)
  if (patch.cutOverflow) parts.push(`overflow:${patch.cutOverflow}`)
  if (patch.frameMaskEnabled !== undefined && patch.frameMaskEnabled !== null) {
    parts.push(`frameMask:${patch.frameMaskEnabled ? `on` : `off`}`)
  }
  if (patch.frameFilterVisibility) {
    const vis = patch.frameFilterVisibility
    parts.push(`frameFx:c${vis.combo ? 1 : 0}h${vis.high ? 1 : 0}s${vis.shad ? 1 : 0}`)
  }

  return parts.length ? parts.join(` | `) : `runtime`
}

function describeVariant(variant) {
  return variant.details || describeVariantPatch(variant.patch)
}

//FUNC: batchFilterVariantContactSheet({hash, variants, cols, cellSize, padding, label}) : Object|null
// Renders the same hash under a small matrix of SVG-layout variants.
// Use this for visible cropping / bottom-bar / shadow artifacts where a
// side-by-side A/B sheet is more useful than a console report.
async function batchFilterVariantContactSheet({
  hash = tokenData?.hash,
  variants = null,
  cols = 2,
  cellSize = { x: 400, y: 720 },
  padding = 20,
  label = `svg-variant-sheet`,
  showLabels = true,
  labelHeight = 40,
} = {}) {
  if (!hash) {
    console.warn(`batchFilterVariantContactSheet: no hash provided`)
    return null
  }

  if (!window.FDH) {
    console.warn(`batchFilterVariantContactSheet: FilterDebugHarness is not loaded`)
    return null
  }

  const testVariants = variants ?? [
    { name: `runtime`, patch: null },
    { name: `userSpace region`, patch: { filterRegionMode: `userSpace` } },
    { name: `cell bounds`, patch: { cutBoundsMode: `cellBounds` } },
    { name: `overflow hidden`, patch: { cutOverflow: `hidden` } },
  ]

  const count = testVariants.length
  const rows = Math.ceil(count / cols)
  const effectiveLabelH = showLabels ? labelHeight : 0
  const totalW = cols * (cellSize.x + padding) + padding
  const totalH = rows * (cellSize.y + padding + effectiveLabelH) + padding

  console.log(`\n=== SVG VARIANT SHEET: ${hash.slice(0, 10)}…${hash.slice(-6)} (${count} variants) ===\n`)

  const canvas = document.createElement(`canvas`)
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext(`2d`)

  ctx.fillStyle = `#1a1a1a`
  ctx.fillRect(0, 0, totalW, totalH)

  const captures = []

  for (let i = 0; i < count; i++) {
    const variant = testVariants[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (cellSize.x + padding)
    const y = padding + row * (cellSize.y + padding + effectiveLabelH)

    if (protoBatch?.teardown) protoBatch.teardown()
    FDH.uninstall()
    if (variant.patch) FDH.install(variant.patch)
    protoBatch.buildFromHash(hash)

    if (typeof variant.afterBuild === `function`) {
      variant.afterBuild({ FRAME, GRID, BGRID, protoBatch, variant, index: i })
    }

    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 100))

    const svgImage = await captureCurrentSVG(cellSize)
    if (svgImage) {
      ctx.drawImage(svgImage, x, y + effectiveLabelH, cellSize.x, cellSize.y)
    } else {
      ctx.fillStyle = `#333`
      ctx.fillRect(x, y + effectiveLabelH, cellSize.x, cellSize.y)
      ctx.fillStyle = `#f66`
      ctx.font = `14px monospace`
      ctx.fillText(`RENDER FAILED`, x + 10, y + effectiveLabelH + cellSize.y / 2)
    }

    if (showLabels) {
      ctx.fillStyle = `#ddd`
      ctx.font = `bold 14px monospace`
      ctx.fillText(variant.name, x, y + 15)
      ctx.fillStyle = `#9aa0a6`
      ctx.font = `12px monospace`
      ctx.fillText(describeVariant(variant), x, y + 31)
    }

    captures.push({
      name: variant.name,
      patch: variant.patch,
      patchLabel: describeVariantPatch(variant.patch),
      details: variant.details,
    })
  }

  FDH.uninstall()
  if (protoBatch?.teardown) protoBatch.teardown()
  protoBatch.buildFromHash(hash)

  const link = document.createElement(`a`)
  const trimmed = `${hash.slice(0, 10)}_${hash.slice(-6)}`
  link.download = `${label}_${trimmed}.png`
  link.href = canvas.toDataURL(`image/png`)
  link.click()

  const report = { hash, variants: captures, filename: link.download }
  window.WTHVariantSheet = report
  console.log(`\n=== SVG VARIANT SHEET SAVED: ${link.download} ===\n`)
  return report
}

//FUNC: batchFrameFilterIsolationSheet({hash, variants, cols, cellSize, padding, label}) : Object|null
// Renders the same hash while selectively disabling frame filter layers.
// Use this when an artifact survives region / viewport variants and may be
// caused by frame-level combo/high/shad composition.
async function batchFrameFilterIsolationSheet({
  hash = tokenData?.hash,
  variants = null,
  cols = 3,
  cellSize = { x: 320, y: 576 },
  padding = 20,
  label = `frame-filter-sheet`,
  showLabels = true,
  labelHeight = 40,
} = {}) {
  const testVariants = variants ?? [
    { name: `runtime`, patch: null },
    { name: `frame combo off`, patch: { frameFilterVisibility: { combo: false, high: true, shad: true } } },
    { name: `frame high off`, patch: { frameFilterVisibility: { combo: true, high: false, shad: true } } },
    { name: `frame shad off`, patch: { frameFilterVisibility: { combo: true, high: true, shad: false } } },
    { name: `frame all off`, patch: { frameFilterVisibility: { combo: false, high: false, shad: false } } },
  ]

  return batchFilterVariantContactSheet({
    hash,
    variants: testVariants,
    cols,
    cellSize,
    padding,
    label,
    showLabels,
    labelHeight,
  })
}

//FUNC: batchFrameMaskIsolationSheet({hash, variants, cols, cellSize, padding, label}) : Object|null
// Renders the same hash while disabling the frame mask and related frame FX combinations.
async function batchFrameMaskIsolationSheet({
  hash = tokenData?.hash,
  variants = null,
  cols = 2,
  cellSize = { x: 360, y: 648 },
  padding = 20,
  label = `frame-mask-sheet`,
  showLabels = true,
  labelHeight = 40,
} = {}) {
  const testVariants = variants ?? [
    { name: `runtime`, patch: null },
    { name: `frame mask off`, patch: { frameMaskEnabled: false } },
    {
      name: `mask off + filters off`,
      patch: {
        frameMaskEnabled: false,
        frameFilterVisibility: { combo: false, high: false, shad: false },
      },
    },
  ]

  return batchFilterVariantContactSheet({
    hash,
    variants: testVariants,
    cols,
    cellSize,
    padding,
    label,
    showLabels,
    labelHeight,
  })
}

function describeFrameShapeGroup(group, index) {
  const parts = [
    `#${index}`,
    group.type?.replace(`ShapeGroup-`, ``) || `unknown`,
  ]
  if (group.cut?.breed) parts.push(group.cut.breed)
  return parts.join(` | `)
}

//FUNC: batchFrameShapeGroupIsolationSheet({hash, cols, cellSize, padding, label}) : Object|null
// Builds the hash once, enumerates FRAME.backGroup.shapeGroups, then re-renders
// while hiding one frame ShapeGroup at a time.
async function batchFrameShapeGroupIsolationSheet({
  hash = tokenData?.hash,
  cols = 3,
  cellSize = { x: 320, y: 576 },
  padding = 20,
  label = `frame-shapegroup-sheet`,
  showLabels = true,
  labelHeight = 52,
} = {}) {
  if (!hash) {
    console.warn(`batchFrameShapeGroupIsolationSheet: no hash provided`)
    return null
  }

  if (protoBatch?.teardown) protoBatch.teardown()
  FDH.uninstall()
  protoBatch.buildFromHash(hash)

  const frameGroups = FRAME?.backGroup?.shapeGroups || []
  if (!frameGroups.length) {
    console.warn(`batchFrameShapeGroupIsolationSheet: no FRAME.backGroup.shapeGroups found`)
    return null
  }

  const variants = [
    { name: `runtime`, patch: null, details: `all frame groups visible` },
    ...frameGroups.map((group, index) => ({
      name: `hide frame group ${index}`,
      patch: null,
      details: describeFrameShapeGroup(group, index),
      afterBuild() {
        const target = FRAME?.backGroup?.shapeGroups?.[index]
        target?.svgElt?.attribute(`display`, `none`)
      },
    })),
  ]

  const report = await batchFilterVariantContactSheet({
    hash,
    variants,
    cols,
    cellSize,
    padding,
    label,
    showLabels,
    labelHeight,
  })

  if (report) report.frameGroups = frameGroups.map((group, index) => ({
    index,
    type: group.type,
    breed: group.cut?.breed,
    filterType: group.filter?.type,
    id: group.id,
  }))

  window.WTHFrameShapeGroups = report
  return report
}

//FUNC: reportCurrentFrameShapeGroups() : [Object] : summarize the current FRAME.backGroup.shapeGroups
function reportCurrentFrameShapeGroups() {
  const frameGroups = FRAME?.backGroup?.shapeGroups || []
  const summary = frameGroups.map((group, index) => ({
    index,
    type: group.type,
    breed: group.cut?.breed,
    filterType: group.filter?.type,
    id: group.id,
  }))
  window.WTHFrameShapeGroupSummary = summary
  console.table(summary)
  return summary
}

//FUNC: batchOnlyFrameShapeGroupSheet({hash, cols, cellSize, padding, label}) : Object|null
// Renders runtime plus one tile per frame ShapeGroup with only that group visible.
async function batchOnlyFrameShapeGroupSheet({
  hash = tokenData?.hash,
  cols = 3,
  cellSize = { x: 320, y: 576 },
  padding = 20,
  label = `frame-shapegroup-only-sheet`,
  showLabels = true,
  labelHeight = 52,
} = {}) {
  if (!hash) {
    console.warn(`batchOnlyFrameShapeGroupSheet: no hash provided`)
    return null
  }

  if (protoBatch?.teardown) protoBatch.teardown()
  FDH.uninstall()
  protoBatch.buildFromHash(hash)

  const frameGroups = FRAME?.backGroup?.shapeGroups || []
  if (!frameGroups.length) {
    console.warn(`batchOnlyFrameShapeGroupSheet: no FRAME.backGroup.shapeGroups found`)
    return null
  }

  const variants = [
    { name: `runtime`, patch: null, details: `all frame groups visible` },
    ...frameGroups.map((group, index) => ({
      name: `only frame group ${index}`,
      patch: null,
      details: describeFrameShapeGroup(group, index),
      afterBuild() {
        const groups = FRAME?.backGroup?.shapeGroups || []
        groups.forEach((entry, entryIndex) => {
          entry?.svgElt?.attribute(`display`, entryIndex === index ? `inline` : `none`)
        })
      },
    })),
  ]

  const report = await batchFilterVariantContactSheet({
    hash,
    variants,
    cols,
    cellSize,
    padding,
    label,
    showLabels,
    labelHeight,
  })

  if (report) report.frameGroups = frameGroups.map((group, index) => ({
    index,
    type: group.type,
    breed: group.cut?.breed,
    filterType: group.filter?.type,
    id: group.id,
  }))

  window.WTHOnlyFrameShapeGroups = report
  return report
}

//FUNC: reportFrameShapeGroupDetails(index) : Object|null : summarize one current frame ShapeGroup and its filter stack
function reportFrameShapeGroupDetails(index = 0) {
  const group = FRAME?.backGroup?.shapeGroups?.[index]
  if (!group) {
    console.warn(`reportFrameShapeGroupDetails: no frame shape group at index ${index}`)
    return null
  }

  const filter = group.filter
  const details = {
    index,
    id: group.id,
    type: group.type,
    breed: group.cut?.breed,
    filterType: filter?.type,
    filterId: filter?.id,
    shadeCount: filter?.shades?.length,
    shades: filter?.shades?.map((shade, shadeIndex) => ({
      shadeIndex,
      lighten: shade.lighten,
      invert: shade.invert,
      mag: shade.mag,
      blur: shade.blur,
      inset: shade.inset,
      color: shade.color,
    })) || [],
    offsetMagnitudes: filter?.offsetElts?.map(({ mag }) => mag) || [],
  }

  window.WTHFrameShapeGroupDetails = details
  console.log(details)
  return details
}

function hideFrameGroupsExcept(index) {
  const groups = FRAME?.backGroup?.shapeGroups || []
  groups.forEach((entry, entryIndex) => {
    entry?.svgElt?.attribute(`display`, entryIndex === index ? `inline` : `none`)
  })
}

function applyOffsetFilter(offsetEntries = [], predicate = () => true) {
  const shadVect = Shade.shadVect()
  offsetEntries.forEach(({ elt, mag }) => {
    const keep = predicate(mag)
    const appliedMag = keep ? mag : 0
    elt.attribute(`dx`, shadVect.x * appliedMag)
    elt.attribute(`dy`, shadVect.y * appliedMag)
  })
}

//FUNC: batchComboOffsetSignSheet({hash, groupIndex, cols, cellSize, padding, label}) : Object|null
// Isolates one frame ShapeGroup and splits its offset stack by sign/magnitude.
async function batchComboOffsetSignSheet({
  hash = tokenData?.hash,
  groupIndex = 1,
  cols = 3,
  cellSize = { x: 320, y: 576 },
  padding = 20,
  label = `combo-offset-sign-sheet`,
  showLabels = true,
  labelHeight = 52,
} = {}) {
  const variants = [
    {
      name: `runtime`,
      patch: null,
      details: `all frame groups visible`,
    },
    {
      name: `only combo runtime`,
      patch: null,
      details: `group ${groupIndex} only`,
      afterBuild() {
        hideFrameGroupsExcept(groupIndex)
      },
    },
    {
      name: `combo positive only`,
      patch: null,
      details: `group ${groupIndex} | mag > 0`,
      afterBuild() {
        hideFrameGroupsExcept(groupIndex)
        const group = FRAME?.backGroup?.shapeGroups?.[groupIndex]
        applyOffsetFilter(group?.filter?.offsetElts || [], mag => mag > 0)
      },
    },
    {
      name: `combo negative only`,
      patch: null,
      details: `group ${groupIndex} | mag < 0`,
      afterBuild() {
        hideFrameGroupsExcept(groupIndex)
        const group = FRAME?.backGroup?.shapeGroups?.[groupIndex]
        applyOffsetFilter(group?.filter?.offsetElts || [], mag => mag < 0)
      },
    },
    {
      name: `combo inner offsets`,
      patch: null,
      details: `group ${groupIndex} | |mag| <= 1`,
      afterBuild() {
        hideFrameGroupsExcept(groupIndex)
        const group = FRAME?.backGroup?.shapeGroups?.[groupIndex]
        applyOffsetFilter(group?.filter?.offsetElts || [], mag => Math.abs(mag) <= 1)
      },
    },
    {
      name: `combo outer offsets`,
      patch: null,
      details: `group ${groupIndex} | |mag| > 1`,
      afterBuild() {
        hideFrameGroupsExcept(groupIndex)
        const group = FRAME?.backGroup?.shapeGroups?.[groupIndex]
        applyOffsetFilter(group?.filter?.offsetElts || [], mag => Math.abs(mag) > 1)
      },
    },
  ]

  const report = await batchFilterVariantContactSheet({
    hash,
    variants,
    cols,
    cellSize,
    padding,
    label,
    showLabels,
    labelHeight,
  })

  window.WTHComboOffsetSign = report
  return report
}

//FUNC: runBottomBarDiagnostics(hash) : Object : focused second-pass diagnostics for persistent bottom-bar artifacts
async function runBottomBarDiagnostics(hash = tokenData?.hash) {
  if (!hash) {
    DeBug.error(`WTH: No hash provided for bottom-bar diagnostics`)
    return
  }

  const frameFilterSheet = await batchFrameFilterIsolationSheet({ hash })
  const frameMaskSheet = await batchFrameMaskIsolationSheet({ hash })
  const report = { hash, frameFilterSheet, frameMaskSheet }
  window.WTHBottomBar = report
  DeBug.log(`WTHBottomBar: stored bottom-bar report on window.WTHBottomBar`)
  return report
}

//FUNC: batchContactSheet({hashes, cols, cellSize, padding, label}) : null
// Renders every hash at small resolution, composites into a single grid image,
// and triggers a download of the contact sheet.
async function batchContactSheet({
  hashes = null,
  cols = 4,
  cellSize = { x: 400, y: 720 },
  padding = 20,
  label = `contact-sheet`,
  showLabels = true,
  labelHeight = 24,
} = {}) {

  // Default to WRAPPER_TEST_CASES hashes if none provided
  if (!hashes) {
    const cases = Object.entries(WRAPPER_TEST_CASES).filter(([, c]) => c.hash)
    if (cases.length === 0) {
      console.warn(`batchContactSheet: No hashes provided and no test cases have hashes assigned.`)
      console.log(`Add hashes to WRAPPER_TEST_CASES in testing/WrapperTestHarness.js`)
      return
    }
    hashes = cases.map(([name, c]) => ({ hash: c.hash, name, status: c.status }))
  }

  // Normalize to [{hash, name, status}] if plain strings passed
  if (typeof hashes[0] === `string`) {
    hashes = hashes.map((h, i) => ({ hash: h, name: `#${i}`, status: `untested` }))
  }

  const count = hashes.length
  const rows = Math.ceil(count / cols)
  const effectiveLabelH = showLabels ? labelHeight : 0
  const totalW = cols * (cellSize.x + padding) + padding
  const totalH = rows * (cellSize.y + padding + effectiveLabelH) + padding

  console.log(`\n=== CONTACT SHEET: ${count} hashes, ${cols}×${rows} grid, ${totalW}×${totalH}px ===\n`)

  // Create offscreen canvas for the contact sheet
  const canvas = document.createElement(`canvas`)
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext(`2d`)

  // Background
  ctx.fillStyle = `#1a1a1a`
  ctx.fillRect(0, 0, totalW, totalH)

  const protoBatch = new ProtoBatch()

  for (let i = 0; i < count; i++) {
    const { hash, name, status } = hashes[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (cellSize.x + padding)
    const y = padding + row * (cellSize.y + padding + effectiveLabelH)

    const trimmed = `${hash.slice(0, 6)}…${hash.slice(-4)}`
    console.log(`  [${i + 1}/${count}] ${name} (${trimmed})`)

    // Build from hash
    protoBatch.teardown()
    protoBatch.buildFromHash(hash)

    // Wait for render
    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 100))

    // Capture the SVG as an image
    const svgImage = await captureCurrentSVG(cellSize)

    if (svgImage) {
      ctx.drawImage(svgImage, x, y + effectiveLabelH, cellSize.x, cellSize.y)
    } else {
      // Fallback: draw a placeholder
      ctx.fillStyle = `#333`
      ctx.fillRect(x, y + effectiveLabelH, cellSize.x, cellSize.y)
      ctx.fillStyle = `#f66`
      ctx.font = `14px monospace`
      ctx.fillText(`RENDER FAILED`, x + 10, y + effectiveLabelH + cellSize.y / 2)
    }

    // Draw label
    if (showLabels) {
      ctx.fillStyle = status === `broken` ? `#f66`
        : status === `golden` ? `#6f6`
          : `#aaa`
      ctx.font = `bold 11px monospace`
      ctx.fillText(`${name}`, x + 4, y + 14)
      ctx.fillStyle = `#666`
      ctx.font = `10px monospace`
      ctx.fillText(`${trimmed}`, x + 4 + ctx.measureText(name).width + 8, y + 14)
    }

    // Draw border
    ctx.strokeStyle = status === `broken` ? `#f66`
      : status === `golden` ? `#6f6`
        : `#555`
    ctx.lineWidth = status === `untested` ? 1 : 2
    ctx.strokeRect(x, y + effectiveLabelH, cellSize.x, cellSize.y)
  }

  // Download the contact sheet
  const link = document.createElement(`a`)
  link.download = `${label}-${new Date().toISOString().slice(0, 10)}.png`
  link.href = canvas.toDataURL(`image/png`)
  link.click()

  console.log(`\n=== CONTACT SHEET SAVED: ${link.download} ===\n`)
}

//MARK: SVG Capture Helper

//FUNC: captureCurrentSVG(targetSize) : HTMLImageElement|null
// Serializes the current SVG DOM, renders to a canvas, returns as an Image.
async function captureCurrentSVG(targetSize, sourceSvgElt = null) {
  // Prefer the live bleed SVG from the current FRAME build.
  const svgElt = sourceSvgElt
    || FRAME?.bleed?.elt
    || FRAME?.svgElt?.elt
    || document.querySelector(`#bleed`)
    || document.querySelector(`svg:last-of-type`)
    || document.querySelector(`svg`)
  if (!svgElt) {
    console.warn(`captureCurrentSVG: no <svg> element found`)
    return null
  }

  return new Promise((resolve) => {
    try {
      // Clone and serialize
      const clone = svgElt.cloneNode(true)
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(clone)

      // Create a blob URL
      const blob = new Blob([svgString], { type: `image/svg+xml;charset=utf-8` })
      const url = URL.createObjectURL(blob)

      // Draw to a temp canvas via Image
      const img = new Image()
      img.onload = () => {
        const tempCanvas = document.createElement(`canvas`)
        tempCanvas.width = targetSize.x
        tempCanvas.height = targetSize.y
        const tempCtx = tempCanvas.getContext(`2d`)

        // Scale SVG to fit cell
        const svgW = parseFloat(svgElt.getAttribute(`width`) || svgElt.viewBox?.baseVal?.width || 400)
        const svgH = parseFloat(svgElt.getAttribute(`height`) || svgElt.viewBox?.baseVal?.height || 720)
        const scale = Math.min(targetSize.x / svgW, targetSize.y / svgH)
        const drawW = svgW * scale
        const drawH = svgH * scale
        const offsetX = (targetSize.x - drawW) / 2
        const offsetY = (targetSize.y - drawH) / 2

        tempCtx.drawImage(img, offsetX, offsetY, drawW, drawH)
        URL.revokeObjectURL(url)

        // Convert temp canvas to Image for compositing
        const resultImg = new Image()
        resultImg.onload = () => resolve(resultImg)
        resultImg.onerror = () => resolve(null)
        resultImg.src = tempCanvas.toDataURL()
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    } catch (e) {
      console.error(`captureCurrentSVG error:`, e)
      resolve(null)
    }
  })
}

//MARK: Quick Batch Export

//FUNC: batchSnapshotExport({hashes, size}) : null
// Renders one frame per hash and downloads each as a separate PNG.
async function batchSnapshotExport({
  hashes = null,
  size = { x: 800, y: 1440 },
} = {}) {

  // Default to WRAPPER_TEST_CASES hashes if none provided
  if (!hashes) {
    const cases = Object.entries(WRAPPER_TEST_CASES).filter(([, c]) => c.hash)
    if (cases.length === 0) {
      console.warn(`batchSnapshotExport: No hashes assigned to test cases.`)
      return
    }
    hashes = cases.map(([, c]) => c.hash)
  }

  // Normalize to array of strings
  if (typeof hashes[0] === `object`) hashes = hashes.map(h => h.hash)

  let dirHandle = null
  if (window.showDirectoryPicker) {
    try {
      dirHandle = await window.showDirectoryPicker({ mode: `readwrite` })
    } catch (e) {
      console.warn(`Directory picker cancelled — aborting`)
      return
    }
  }

  const protoBatch = new ProtoBatch()
  console.log(`\n=== BATCH SNAPSHOT: ${hashes.length} hashes ===\n`)

  for (let i = 0; i < hashes.length; i++) {
    const hash = hashes[i]
    const trimmed = `${hash.slice(0, 6)}_${hash.slice(-4)}`
    console.log(`  [${i + 1}/${hashes.length}] ${trimmed}`)

    protoBatch.teardown()
    protoBatch.buildFromHash(hash)

    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 100))

    const svgImage = await captureCurrentSVG(size)
    if (!svgImage) {
      console.warn(`  Failed to capture ${trimmed}`)
      continue
    }

    // Draw to a canvas for PNG export
    const canvas = document.createElement(`canvas`)
    canvas.width = size.x
    canvas.height = size.y
    const ctx = canvas.getContext(`2d`)
    ctx.drawImage(svgImage, 0, 0, size.x, size.y)

    if (dirHandle) {
      // Save to picked directory
      const filename = `snapshot_${trimmed}.png`
      try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
        const writable = await fileHandle.createWritable()
        const blob = await new Promise(r => canvas.toBlob(r, `image/png`))
        await writable.write(blob)
        await writable.close()
      } catch (e) {
        console.error(`  Failed to save ${filename}:`, e)
      }
    } else {
      // Fallback: download link
      const link = document.createElement(`a`)
      link.download = `snapshot_${trimmed}.png`
      link.href = canvas.toDataURL(`image/png`)
      link.click()
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`\n=== BATCH SNAPSHOT COMPLETE ===\n`)
}

//FUNC: dumpBackgridClipChain() : void
// Dumps the full SVG clipping chain for every backgrid ShapeGroup,
// including ancestor SVG viewports, filter regions, and bounding boxes.
// Use to diagnose vertical/horizontal line artifacts from filter clipping.
function dumpBackgridClipChain() {
  const frame = FRAME
  if (!frame) { console.error(`dumpBackgridClipChain: no FRAME`); return }

  const bgrid = frame.backGrid
  if (!bgrid) { console.error(`dumpBackgridClipChain: no backGrid`); return }

  const groups = frame.backGroup?.shapeGroups || []
  if (!groups.length) { console.warn(`dumpBackgridClipChain: no backGroup shapeGroups`); return }

  // Helper: extract SVG viewport attrs from an element
  const svgAttrs = (elt) => {
    if (!elt) return null
    const node = elt.elt || elt
    const tag = node.tagName
    if (tag !== `svg`) return { tag, id: node.id || `(none)` }
    return {
      tag,
      id: node.id || `(none)`,
      viewBox: node.getAttribute(`viewBox`),
      x: node.getAttribute(`x`),
      y: node.getAttribute(`y`),
      width: node.getAttribute(`width`),
      height: node.getAttribute(`height`),
      overflow: node.getAttribute(`overflow`) || `hidden (default)`,
    }
  }

  // Helper: extract filter region attrs
  const filterAttrs = (filter) => {
    if (!filter?.filter) return null
    const f = filter.filter.elt || filter.filter
    return {
      id: f.id || f.getAttribute?.(`id`),
      filterUnits: f.getAttribute?.(`filterUnits`) || `objectBoundingBox (default)`,
      x: f.getAttribute?.(`x`),
      y: f.getAttribute?.(`y`),
      width: f.getAttribute?.(`width`),
      height: f.getAttribute?.(`height`),
    }
  }

  // Walk ancestor SVGs
  const ancestorSVGs = (node) => {
    const chain = []
    let current = node.elt || node
    while (current) {
      if (current.tagName === `svg`) chain.push(svgAttrs(current))
      current = current.parentElement
    }
    return chain
  }

  // Compute getBBox in frame coordinates
  const frameBBox = (node) => {
    const el = node.elt || node
    if (!el.getBBox) return null
    try {
      const bbox = el.getBBox()
      return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height }
    } catch { return null }
  }

  console.group(`%c[BackgridClipChain] ${groups.length} ShapeGroups`, `color: orange; font-weight: bold`)

  // Frame-level chain
  console.group(`Frame SVG chain`)
  console.table(ancestorSVGs(frame.svgElt))
  console.groupEnd()

  // Grid-level
  console.group(`Grid SVG`)
  const gridNode = bgrid.frontGrid?.svgElt || bgrid.svgElt
  if (gridNode) console.log(svgAttrs(gridNode))
  console.groupEnd()

  // Per-ShapeGroup
  const table = []
  groups.forEach((sg, i) => {
    const sgElt = sg.svgElt
    const grpElt = sg.svgGroupElt
    const cut = sg.cut

    // ShapeGroup SVG viewport
    const sgSvg = svgAttrs(sgElt)

    // svgGroupElt viewBox/layout (set on the <g>)
    const grpNode = grpElt?.elt || grpElt
    const grpLayout = grpNode ? {
      viewBox: grpNode.getAttribute?.(`viewBox`),
      x: grpNode.getAttribute?.(`x`),
      y: grpNode.getAttribute?.(`y`),
      width: grpNode.getAttribute?.(`width`),
      height: grpNode.getAttribute?.(`height`),
    } : null

    // Filter regions
    const filters = cut?.filters?.map(filterAttrs) || []

    // BBox
    const pathBBox = frameBBox(grpElt)

    // Computed padding
    const padding = sg.padding

    const row = {
      index: i,
      type: sg.type,
      breed: cut?.breed || `backing`,
      isFrame: sg.isFrame,
      sgViewBox: sgSvg?.viewBox,
      sgOverflow: sgSvg?.overflow,
      grpViewBox: grpLayout?.viewBox,
      pathBBox: pathBBox ? `${pathBBox.x.toFixed(1)},${pathBBox.y.toFixed(1)} ${pathBBox.width.toFixed(1)}x${pathBBox.height.toFixed(1)}` : null,
      pad: padding ? `${padding.x.toFixed(2)},${padding.y.toFixed(2)}` : null,
    }
    table.push(row)

    console.group(`[${i}] ${sg.type} — ${cut?.breed || `backing`}`)
    console.log(`ShapeGroup SVG:`, sgSvg)
    console.log(`Group layout:`, grpLayout)
    console.log(`Path getBBox:`, pathBBox)
    console.log(`Padding:`, padding)
    console.log(`Ancestor SVG chain:`, ancestorSVGs(sgElt))
    if (filters.length) console.log(`Filters:`, filters)
    console.groupEnd()
  })

  console.table(table)
  console.groupEnd()

  return { groups: table }
}

window.dumpBackgridClipChain = dumpBackgridClipChain

// § 9.14.8 — R-out→R-in Backgrid Shading White-Out Diagnostics
//FUNC: dumpBackgridShadeLayers() : Object : dump shade layer structure for backgrid combo overlap investigation
function dumpBackgridShadeLayers() {
  const grid = BGRID || FRAME?.backGrid
  if (!grid) { console.error(`No backGrid found`); return }

  const backGroup = FRAME.backGroup
  if (!backGroup) { console.error(`No backGroup found`); return }

  const sgs = backGroup.shapeGroups
  const comboElt = grid.comboElt
  const highElt = grid.highElt
  const shadElt = grid.shadElt

  console.group(`§ 9.14.8 — Backgrid Shade Layer Dump`)

  // ── 1. Frame cuts summary ──
  console.group(`Frame Cuts`)
  backGroup.cuts.forEach((cut, i) => {
    console.log(`Cut ${i}:`, cut.profile, `start=${cut.layerStart?.toFixed?.(3) ?? cut.layerStart}`, `end=${cut.layerEnd?.toFixed?.(3) ?? cut.layerEnd}`)
  })
  console.groupEnd()

  // ── 2. All ShapeGroups with their shade layer and cut info ──
  const sgTable = []
  sgs.forEach((sg, i) => {
    const cut = sg.cut
    const hasMask = !!sg.svgElt?.elt?.getAttribute?.(`mask`)
    const maskRef = sg.svgElt?.elt?.getAttribute?.(`mask`) || `none`
    const filterAttr = sg.svgGroupElt?.elt?.querySelector?.(`[filter]`)?.getAttribute?.(`filter`) || `none`
    const pathCount = sg.paths?.length || 0
    const maskCount = sg.masks?.length || 0

    sgTable.push({
      index: i,
      type: sg.type,
      breed: cut?.breed || `backing`,
      profile: cut?.profile?.description || `-`,
      hasMask,
      maskRef,
      pathCount,
      maskCount,
      isFrame: sg.isFrame,
    })
  })
  console.table(sgTable)

  // ── 3. comboElt children in DOM order (z-order) ──
  console.group(`comboElt DOM Children (z-order, bottom→top)`)
  const comboChildren = comboElt ? Array.from(comboElt.elt.children) : []
  const comboTable = []
  comboChildren.forEach((child, i) => {
    const id = child.id || child.getAttribute?.(`class`) || `(anon)`
    const maskAttr = child.getAttribute?.(`mask`) || `none`
    const display = child.style?.display || getComputedStyle(child).display
    const bbox = child.getBBox?.() || null
    const filterEl = child.querySelector?.(`[filter]`)
    const filterAttr = filterEl?.getAttribute?.(`filter`) || `none`

    // find matching ShapeGroup — search both backGroup and front grid
    const matchSG = sgs.find(sg => sg.svgElt?.elt === child)
      || GRID?.shapeGroups?.find?.(sg => sg.svgElt?.elt === child)
      || S?.ShapeGroups?.db?.map?.(e => e[1])?.find?.(sg => sg.svgElt?.elt === child)
    const cut = matchSG?.cut
    const grid = matchSG?.grid === BGRID ? `back` : `front`

    comboTable.push({
      zIndex: i,
      id: id.slice(0, 50),
      grid,
      breed: cut?.breed || `?`,
      profile: cut?.profile?.description || `?`,
      mask: maskAttr !== `none` ? `YES` : `-`,
      filter: filterAttr !== `none` ? `YES` : `-`,
      display,
      bbox: bbox ? `${bbox.x.toFixed(1)},${bbox.y.toFixed(1)} ${bbox.width.toFixed(1)}×${bbox.height.toFixed(1)}` : `n/a`,
    })

    // dump mask details if present
    if (maskAttr !== `none`) {
      const maskId = maskAttr.match(/url\(#(.+?)\)/)?.[1]
      if (maskId) {
        const maskEl = document.getElementById(maskId)
        if (maskEl) {
          const maskChildren = Array.from(maskEl.querySelectorAll(`*`))
          console.group(`  Mask "${maskId}" internals (${maskChildren.length} elements)`)
          maskChildren.forEach(mc => {
            const tag = mc.tagName
            const fill = mc.getAttribute?.(`fill`) || ``
            const mcBBox = mc.getBBox?.() || null
            console.log(`  ${tag}`, fill ? `fill=${fill}` : ``, mcBBox ? `bbox=${mcBBox.x.toFixed(1)},${mcBBox.y.toFixed(1)} ${mcBBox.width.toFixed(1)}×${mcBBox.height.toFixed(1)}` : ``)
          })
          console.groupEnd()
        }
      }
    }
  })
  console.table(comboTable)
  console.groupEnd()

  // ── 4. highElt / shadElt children ──
  const dumpLayerChildren = (name, elt) => {
    if (!elt) return
    const children = Array.from(elt.elt.children)
    console.group(`${name} DOM Children (${children.length})`)
    children.forEach((child, i) => {
      const id = child.id || `(anon)`
      const bbox = child.getBBox?.() || null
      console.log(`[${i}] ${id}`, bbox ? `bbox=${bbox.x.toFixed(1)},${bbox.y.toFixed(1)} ${bbox.width.toFixed(1)}×${bbox.height.toFixed(1)}` : ``)
    })
    console.groupEnd()
  }
  dumpLayerChildren(`highElt`, highElt)
  dumpLayerChildren(`shadElt`, shadElt)

  // ── 5. Frame mask (maskFrame) coverage ──
  console.group(`Frame Mask`)
  const frameMaskAttr = FRAME.svgElt?.elt?.getAttribute?.(`mask`)
  if (frameMaskAttr) {
    const frameMaskId = frameMaskAttr.match(/url\(#(.+?)\)/)?.[1]
    const frameMaskEl = frameMaskId ? document.getElementById(frameMaskId) : null
    if (frameMaskEl) {
      const paths = frameMaskEl.querySelectorAll(`path`)
      console.log(`Frame mask id: ${frameMaskId}, paths: ${paths.length}`)
      paths.forEach((p, i) => {
        const bbox = p.getBBox?.()
        const fill = p.getAttribute(`fill`)
        console.log(`  path[${i}] fill=${fill} bbox=${bbox?.x.toFixed(1)},${bbox?.y.toFixed(1)} ${bbox?.width.toFixed(1)}×${bbox?.height.toFixed(1)}`)
      })
      // compare with Frame bounds
      const frameBounds = FRAME.boundsRect
      console.log(`Frame bounds: ${frameBounds.x},${frameBounds.y} ${frameBounds.width}×${frameBounds.height}`)
    } else {
      console.log(`Frame mask element not found: ${frameMaskId}`)
    }
  } else {
    console.log(`No frame mask applied`)
  }
  console.groupEnd()

  console.groupEnd()

  // ── 6. Store toggles for interactive testing ──
  window._comboChildren = comboChildren
  window._shadeSGs = sgs

  return {
    shapeGroups: sgTable,
    comboChildren: comboTable,
    comboChildCount: comboChildren.length,
  }
}

//FUNC: toggleComboChild(index) : toggle display:none on a specific combo layer child for isolation testing
function toggleComboChild(index) {
  const children = window._comboChildren
  if (!children || index >= children.length) {
    console.error(`No combo children stored. Run dumpBackgridShadeLayers() first.`)
    return
  }
  const child = children[index]
  const current = child.style.display
  child.style.display = current === `none` ? `` : `none`
  console.log(`comboElt child [${index}] display: ${current || `visible`} → ${child.style.display || `visible`}`)
}

//FUNC: toggleShadeLayer(layer) : toggle display:none on an entire shade layer (combo/high/shad)
function toggleShadeLayer(layer) {
  const grid = BGRID || FRAME?.backGrid
  if (!grid) { console.error(`No backGrid found`); return }
  const elt = layer === `combo` ? grid.comboElt
    : layer === `high` ? grid.highElt
      : layer === `shad` ? grid.shadElt
        : layer === `back` ? grid.backElt
          : null
  if (!elt) { console.error(`Unknown layer: ${layer}. Use combo/high/shad/back`); return }
  const current = elt.elt.style.display
  elt.elt.style.display = current === `none` ? `` : `none`
  console.log(`${layer}Elt display: ${current || `visible`} → ${elt.elt.style.display || `visible`}`)
}

window.dumpBackgridShadeLayers = dumpBackgridShadeLayers
window.toggleComboChild = toggleComboChild
window.toggleShadeLayer = toggleShadeLayer
