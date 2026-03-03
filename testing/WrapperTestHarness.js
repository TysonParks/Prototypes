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
    DeBug.group(`WTH: Reset Coverage`)
    DeBug.log(`Total memoized keys: ${this.memoKeys.length}`)
    DeBug.log(`Keys in #resetMemoProps: ${this.resetKeys.length}`)
    DeBug.warn(`Keys NOT in #resetMemoProps (${uncovered.length}):`, uncovered)
    DeBug.groupEnd()
  }

  //METH: reportSurvivedKeys() : null : log keys that survived mutations without being invalidated
  reportSurvivedKeys() {
    const allSurvived = new Set()
    this.results.forEach(r => {
      r.segDiff.survivedKeys.forEach(k => allSurvived.add(k))
      r.neighborDiffs.forEach(nd => nd.survivedKeys.forEach(k => allSurvived.add(k)))
    })

    DeBug.group(`WTH: Survived Keys (cached through mutations)`)
    DeBug.log(`Keys that survived at least one mutation:`, [...allSurvived].sort())
    DeBug.log(`Of these, not in reset list:`,
      [...allSurvived].filter(k => !this.resetKeys.includes(k)).sort())
    DeBug.groupEnd()
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
