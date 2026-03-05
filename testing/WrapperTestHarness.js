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
    status: 'broken',
  },

  // MARK: Known Broken
  // Add hashes that currently produce incorrect output
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

//MARK: Batch Contact Sheet

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
async function captureCurrentSVG(targetSize) {
  // Find the main SVG element
  const svgElt = document.querySelector(`svg`)
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
