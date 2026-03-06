# BoredUI Testing Tools

> **Purpose:** Document the dev-only testing and debugging tools.
> These files live in `testing/` and must NOT ship to production,
> minification, or Art Blocks deployment.
>
> **Related docs:**
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [KNOWN-ISSUES](KNOWN-ISSUES.md) |
> [ARCHITECTURE](ARCHITECTURE.md) |
> [ROADMAP](ROADMAP.md)

---

## Table of Contents

1. [Deployment Exclusion](#1-deployment-exclusion)
2. [WrapperTestHarness](#2-wrappertestharness)
3. [FilterDebugHarness](#3-filterdebugharness)
4. [WrapperDebugOverlay](#4-wrapperdebugoverlay)
5. [Other Testing Files](#5-other-testing-files)

---

## 1. Deployment Exclusion

The `testing/` folder and `docs/` folder are **development-only**.
When building for production (Art Blocks or minified standalone),
exclude:

```
testing/              ← all files
docs/                 ← all files
```

In `index.html`, testing scripts are loaded inside a `<!-- DEV-ONLY -->`
comment block. The future `build.sh` (ROADMAP Task 16) must strip these
`<script>` tags from the production build.

Current dev-only scripts:

```text
testing/WrapperTestHarness.js
testing/FilterDebugHarness.js
testing/WrapperDebugOverlay.js
testing/testMess.js
```

---

## 2. WrapperTestHarness

**File:** `testing/WrapperTestHarness.js` (897 lines)
**Loaded in:** `index.html` (dev-only)
**Console access:** `window.WTH` (after running `runWrapperTests()`)

### 2.1 Purpose

Tests the integrity of ProtoSegment's memoization system. The wrapper
pipeline in `drawAsSVG.js` memoizes 60+ property getters via
`memoize()` in `ProtoUtility.js`. When `maximizeCuddles()` mutates
arc geometry, some cached values become stale. The harness detects:

- **Stale caches:** Memoized values that survive a mutation but should
  have been invalidated
- **Reset coverage gaps:** Volatile keys not listed in `#resetMemoProps`
- **Unnecessary resets:** Topology-stable keys that are being reset
  when they don't need to be

### 2.2 MemoKey Classifications

The harness catalogs every memoized property key and classifies them:

| Category | Count | Description | Safe to Keep Cached? |
|----------|-------|-------------|---------------------|
| `topologyStableKeys` | ~16 | Grid topology never changes after setup: `corners`, `turns`, `normals`, `isOutsideCorner`, `endCorner`, `hasSameFacingCorner`, etc. | **Yes** — permanent cache |
| `arcVolatileKeys` | ~40 | Depend on cubic vert positions which mutate during `maximizeCuddles()`: `adjDistanceObjs`, `arcOrigin`, `outWrappers`, `radiantOutWrappers`, `viableOutWrappers`, etc. | **No** — must invalidate |
| `resetKeys` | ~16 | Keys currently listed in `#resetMemoProps` | These ARE being reset |

**Key diagnostic:** If `arcVolatileKeys` minus `resetKeys` is non-empty,
those volatile keys survive mutations and produce stale data. This is
the root cause of many wrapping bugs (see ARCHITECTURE § 10.2.5).

### 2.3 Key Methods

#### Cache Inspection

| Method | Returns | Use |
|--------|---------|-----|
| `getCachedKeys(seg)` | `[String]` | List all currently cached memoization keys for a segment |
| `isCached(seg, key)` | `Bool` | Check if a specific key is cached |
| `getCachedValue(seg, key)` | `any` | Return the cached value for a key |

#### Snapshot & Diff

| Method | Returns | Use |
|--------|---------|-----|
| `snapshotSeg(seg)` | `Object` | Capture full cache state + wrapper identity for one segment |
| `snapshotPool(pool)` | `[Object]` | Snapshot all segments in a pool |
| `diffSnapshots(before, after)` | `Object` | Compare two snapshots — reports mutations, stale keys, survived keys, new/dropped keys |

#### Staleness Detection

| Method | Returns | Use |
|--------|---------|-----|
| `detectStaleness(seg, mutationFn, label)` | `Object` | Prime cache → snapshot → run mutation → snapshot → diff. Detects stale caches on the segment AND its neighbors. |

#### Targeted Mutation Tests

| Method | Tests | Notes |
|--------|-------|-------|
| `testFlushWrap(seg)` | `flushWrap(true)` staleness | Requires `seg.flushWrapper` |
| `testAdjWrap(seg)` | `adjWrap(true)` staleness | Requires `seg.adjacentWrapper` |
| `testSetArcToMiddle(seg)` | `setArcToMiddle()` staleness | Always applicable |
| `testReplaceEndCurveOrigin(seg)` | `replaceEndCurveOrigin()` staleness | Requires `seg.arcOrigin` |
| `testReplaceEndRadiantOutWrapsOrigin(seg)` | Radiant origin propagation staleness | Requires `seg.arcOrigin` |

#### Pool & Reporting

| Method | Use |
|--------|-----|
| `testPool(pool)` | Run all mutation tests on every eligible segment in a pool |
| `reportStaleResults()` | Log all results with stale cache entries |
| `reportResetCoverage()` | Log which volatile keys are NOT in `#resetMemoProps` |
| `reportSurvivedKeys()` | Log keys that survived mutations without invalidation |
| `reportFilterBanding()` | Inspect active cuts/filters for sparse offset stacks, duplicate collapse, and shell gap statistics |

### 2.4 How to Run

From the browser console after a grid is rendered:

```javascript
// Run all tests and store harness globally
runWrapperTests()

// Inspect results
WTH.reportStaleResults()
WTH.reportResetCoverage()
WTH.reportSurvivedKeys()

// Inspect a specific segment's cache
WTH.getCachedKeys(GRID.allSimpleSubShapesSegs[0])
WTH.getCachedValue(GRID.allSimpleSubShapesSegs[0], 'outWrappers')

// Snapshot before/after a manual mutation
const seg = GRID.allSimpleSubShapesSegs[5]
const before = WTH.snapshotSeg(seg)
seg.setArcToMiddle()
const after = WTH.snapshotSeg(seg)
WTH.diffSnapshots(before, after)

// Shader/filter banding diagnostics for the current hash
runFilterBandingDiagnostics()
```

`runFilterBandingDiagnostics()` is intended for shader/filter debugging,
not wrapper memoization. It inspects the currently active cuts from
`S.Cuts.db`, summarizes the actual filter stacks created in
`ProtoFilter`, and flags sparse or irregular offset ladders that are
likely to produce visible banding. See KNOWN-ISSUES § 9.14.7.

Important limitation: `reportFilterBanding()` describes the stacks that
were built, but it does **not** prove that a visible artifact is
shader-driven. The Mar 6 investigation showed that a major render
regression was actually caused by filter-region layout. Use
`FilterDebugHarness` when you need to separate layout/cropping artifacts
from shader artifacts.

## 3. FilterDebugHarness

**File:** `testing/FilterDebugHarness.js`
**Loaded in:** `index.html` (dev-only)
**Console access:** `window.FilterDebugHarness`, `window.FDH`

### 3.1 Purpose

`FilterDebugHarness` exists to keep experimental SVG filter and cropping
probes out of operational files. It monkeypatches selected runtime
methods temporarily, rebuilds the current hash, and lets you A/B layout
hypotheses without turning `gui.js`, `ProtoLayerObjects.js`,
`ProtoFilter.js`, or `neuMark_I.js` into a permanent debug-control
surface.

### 3.2 Current Patch Targets

| Target | What it tests |
|--------|---------------|
| `ProtoCut.setLayouts()` | `%`-based filter region vs `userSpaceOnUse` filter region |
| `ShapeGroup.boundsRect` | cut viewport sizing |
| `ShapeGroup.assignElement()` | cut SVG overflow behavior |
| `ShapeGroup.createSVGGroup()` + `ProtoFilter.applyFilterToElement()` | temporary frame filter visibility isolation |

### 3.3 How to Run

```javascript
// Restore the legacy percent-based filter region
FDH.usePercentFilterRegion()

// Reproduce the userSpaceOnUse experiment
FDH.useUserSpaceFilterRegion()

// Try alternate cut viewport behavior
FDH.rebuild({ cutBoundsMode: 'cellBounds' })

// Try explicit cut SVG overflow behavior
FDH.rebuild({ cutOverflow: 'hidden' })

// Temporarily disable one frame filter layer
FDH.setFrameFilterVisibility({ combo: false, high: true, shad: true })

// Remove all patches and rebuild cleanly
FDH.uninstall({ rebuild: true })
```

### 3.4 Why This Matters

The current SVG cropping work spans multiple independent mechanisms:

1. filter region coordinates
2. nested SVG viewport sizing
3. overflow behavior
4. masks and mask blurs

`FilterDebugHarness` lets those be tested in isolation without polluting
runtime code.

## 4. WrapperDebugOverlay

`WrapperDebugOverlay` remains the visual geometry tool for wrapper and
segment relationships. It is useful for corner/wrapper debugging, but it
is not the primary tool for SVG cropping investigations.

Use it when the question is geometric adjacency or wrapper resolution.
Use `FilterDebugHarness` when the question is viewport, filter, mask, or
cropping behavior.

## 5. Other Testing Files

### 5.1 Test Case Hashes

Curated `tokenData.hash` values that exercise specific wrapper
configurations. Stored in `WRAPPER_TEST_CASES` at the bottom of the
harness file.

| Key | Wrapper Types | Status | Description |
|-----|--------------|--------|-------------|
| `coincident_basic` | coincident | golden | Two shapes meeting at grid intersection |
| `collinear_basic_1` | collinear | broken | Two same-facing corners with shared collinear segment |
| `collinear_basic_2` | collinear | golden | Two same-facing corners with shared collinear segment |
| `adjacent_basic` | adjacent | untested | Nearby same-facing corners |
| `radiant_stack` | radiant | golden | 3+ diagonally aligned corners sharing arc origin |
| `interference_01` | radiant, interference | golden | Single-intermediate interference — 3 shapes, 1 band, proves wrapper-layer gate |
| `interference_02` | radiant, interference | golden | Multi-shape interference — ~4 harmonic bands, wobble visible when disabled |
| `intershape_1` | coincident, adjacent | untested | Intershape placed inside larger shape |
| `intershape_2` | coincident, adjacent | untested | Intershape placed inside larger shape |
| `intershape_3` | coincident, adjacent | untested | Intershape placed inside larger shape (most representative) |
| `filter_banding_1` | — | broken | Visible stepped banding on `rOut` shade stacks; primary shader quantization diagnosis case |
| `broken_01` – `broken_03` | — | broken | Grouping errors (multiple groups contain same cell) |
| `broken_04` – `broken_06` | proximal | broken | Outer wrapper converging/intersecting inner wrapper |
| `broken_07` | adjacent | broken | Outer wrapper converging/barely intersecting inner wrapper |

**Adding new cases:** Edit `WRAPPER_TEST_CASES` in
`testing/WrapperTestHarness.js`. Set `status` to `golden` (known good),
`broken` (known bad), or `untested` (needs verification).

### 5.2 Batch Tools

| Function | Use |
|----------|-----|
| `batchContactSheet({hashes, cols, cellSize})` | Render all test hashes as a grid image, download as PNG. Color-codes borders by status. |
| `batchSnapshotExport({hashes, size})` | Render each hash individually, save as separate PNGs. Supports File System Access API for directory picking. |

These run in the browser and use `ProtoBatch.buildFromHash()` to
load each hash sequentially.

### 2.7 Baseline Results (Hash #1428)

The harness runs automatically on every `buildFromHash()` call
(see `ProtoBatch.js` L33–37). Below are the baseline findings from
the default hash (`testingControls.hashNumber: 1428`).

#### Reset Coverage

```
Total memoized keys:                          62
Keys in #resetMemoProps:                      19
Topology-stable keys (safe to keep cached):   14
Arc-volatile keys (must reset on mutation):   48
⚠️ VOLATILE keys NOT in #resetMemoProps:      29
```

The 29 uncovered volatile keys are documented in KNOWN-ISSUES § 9.9.3.

#### Stale Cache Detection

- **16 of 48 segments** detected stale cache entries
- All 16 failures triggered by `setArcToMiddle` mutations
- `flushWrap` and `adjWrap` tests produced **no** stale results
  (those mutations call `resetMemoized()` internally)
- Each failure shows 42 stale keys on self + 42–46 on neighbors

#### Survived Keys

- **56 total** keys survived across all mutations
- 42 were arc-volatile (should have been invalidated) — ⚠️
- 14 were topology-stable (expected — safe permanent cache) — ✅

See KNOWN-ISSUES § 9.9 for full analysis and impact assessment.

---

## 3. WrapperDebugOverlay

**File:** `testing/WrapperDebugOverlay.js` (519 lines)
**Loaded in:** `index.html` (dev-only)
**Toggle:** Press `d` key while viewing a rendered output

### 3.1 Purpose

Draws colored lines and labels over the rendered SVG showing wrapper
relationships between segments. Essential for visual verification
during wrapper audits.

### 3.2 Usage

```javascript
// Toggle from console
WrapperDebugOverlay.toggle(GRID)

// Or press 'd' (if keyboard handler is wired up)
```

### 3.3 Color Key

| Color | Wrapper Type | What It Shows |
|-------|-------------|---------------|
| Red | Coincident | Segments sharing exact corner vertex + diagonal relationship |
| Blue | Collinear | Segments on same line, different vertex |
| Green | Adjacent | Same-facing, not coincident/collinear |
| Orange | Radiant | Diagonal chain sharing arc origin |
| Purple | `inWrapper` | Arrow from segment to its inWrapper |
| Coral | `outWrapper` | Arrow from segment to its outWrapper |
| Cyan | `arcOrigin` | Arc origin point marker |
| Yellow | Segment dot | Corner vertex marker |
| White | Segment label | Segment ID text |

### 3.4 Audit Usage

During wrapper audits (ROADMAP § 12.1), load a specific hash via
`tokenData.hash = '0x...'`, reload, then press `d` to see which
wrapper types are active. Compare against expected behavior and
document findings in KNOWN-ISSUES.

---

## 4. Other Testing Files

### testMess.js (1671 lines)

Ad-hoc function tests called from `functionTestPrint()` in the app's
setup flow. Contains miscellaneous test snippets for:
- Range operations, vector math, modulo behavior
- `Corner.opposite` tests (Bug B verification — see KNOWN-ISSUES § 9.7)
- Prime divisor tests, direction arithmetic
- Various commented-out experiments

Most tests are commented out. Uncomment the relevant block and reload
to run.

### fileSizeTester.js (43 lines)

Scaffolding for testing minified file sizes. Contains duplicate
placeholder functions used to estimate compression ratios. Not
actively used.

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-03*
