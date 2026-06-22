# BoredUI Testing Tools

> **Purpose:** Document the dev-only testing and debugging tools.
> These files live in `testing/` and must NOT ship to production,
> minification, or Art Blocks deployment.
>
**Related docs:**
[GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
[KNOWN-ISSUES](KNOWN-ISSUES.md) |
[ARCHITECTURE](ARCHITECTURE.md) |
[ROADMAP](ROADMAP.md)

## What This Document Is Not

- A production-system behaviour spec — tools are dev-only
- Not a guarantee of runtime/production behavior

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

### Adjacent Wrappers — Regression Cases

If you are returning to the adjacent-wrapper audit, use the following quick-repro steps.

1. Rebuild the hash in the dev runner (browser console) so `testing/` tools are available.
2. Run the wrapper harness:

```javascript
// run the wrapper test harness
runWrapperTests()

// inspect the harness reports
WTH.reportStaleResults()
WTH.reportResetCoverage()
```

3. Use the debug overlay for deep inspection on a single segment (example ids from the current audit):

```javascript
// open the debug overlay and inspect the adj pipeline for one segment
// replace the id string with the target segment id
WrapperDebugOverlay.adjDebug('shp032-12down-cel054-rightSide-to-cel153-rightSide')
```

4. Failing hash found during session:

```
0x3f81c13fd6cfd2c38d603067cb273df497c0654690fb8b1768ef416cf0163346
```

Notes: Prefer capturing snapshots before/after `fixIssues()` and use `WTH.diffSnapshots(before, after)` to find stale memo keys that survived mutation.
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
| `reportThinDepthShadeHealth()` | Optional diagnostic: flag shallow combo cuts with anchor-dominated offset stacks (§9.14.12 suspected rendering mode; fix is Feature-side) |

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

// Optional: inspect suspected thin-depth rendering mode (§9.14.12; fix is Feature-side enum limits)
reportThinDepthShadeHealth('0x8d31f933ba75bbfa9ee9be8e76c7d29c0b7fc87b9f93085ce01d24ef0d565444', true)

// Same hash under common SVG layout variants, exported as one contact sheet
await batchFilterVariantContactSheet()

// Run both of the above as one SVG-artifact pass
await runSVGArtifactDiagnostics()

// If the artifact survives all SVG layout variants, isolate frame filters
await runBottomBarDiagnostics()
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

For visible SVG artifacts such as a bottom bar, cropped shadow slab, or
unexpected frame strip, prefer `batchFilterVariantContactSheet()` over
manual toggle-by-toggle inspection. It renders the **same hash** under a
small matrix of layout variants and saves a single side-by-side PNG so
the visual delta is explicit.

If the artifact is unchanged across that entire matrix, move to
`batchFrameFilterIsolationSheet()` / `runBottomBarDiagnostics()`. That
second pass selectively disables frame `combo`, `high`, and `shad`
filters to determine whether the visible strip belongs to frame filter
composition rather than filter-region layout.

If the strip still survives with all frame filters disabled, move to
`batchFrameMaskIsolationSheet()`. That pass disables the frame mask
itself, and then disables both the mask and frame filters together. If
the artifact still survives there, the cause is likely underlying frame
or backing geometry rather than SVG filter/mask post-processing.

If the artifact is confirmed to live in frame FX, use
`batchFrameShapeGroupIsolationSheet()`. That pass hides one entry from
`FRAME.backGroup.shapeGroups` at a time, which is the fastest way to
locate the exact frame layer responsible for a persistent slab, band, or
strip.

If one frame `ShapeGroup` is identified as the source, use
`batchComboOffsetSignSheet()` to split that group's filter stack by
offset sign and rough magnitude. This helps determine whether the slab
is being created by one directional half of the combo filter or only by
the widest outer offsets.

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
| `ShapeGroup.assignElement()` | cut SVG overflow behavior (dev-only; avoid enabling permanently — performance risk) |
| `Grid.anchor` / `Grid.size` / `Grid.boundsRect` | whether `Magical` grids should be fit inside the `100x200` frame instead of extending beyond it |
| `ShapeGroup.createSVGGroup()` + `ProtoFilter.applyFilterToElement()` | temporary frame filter visibility isolation |

### 3.3 How to Run

```javascript
// Restore the legacy percent-based filter region
FDH.usePercentFilterRegion()

// Reproduce the userSpaceOnUse experiment
FDH.useUserSpaceFilterRegion()

// Try alternate cut viewport behavior
FDH.rebuild({ cutBoundsMode: 'cellBounds' })

// Reproduce the historical overbroad §9.14.1 behavior
FDH.rebuild({ cutBoundsMode: 'frameBounds' })

// Try explicit cut SVG overflow behavior
FDH.rebuild({ cutOverflow: 'hidden' })

// Fit Magical grids inside the 100x200 frame for A/B testing
FDH.useMagicalFitFrameGridBounds()

// Force any grid to full frame height while preserving aspect
FDH.useFullFrameHeightGridBounds()

// Stretch the built frame shape-group stack itself to full frame height
FDH.stretchFrameGroupsToFullHeight()

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
4. `Magical` grid bounds that currently may extend beyond the frame and then get clipped back to `100x200`

2026-05-11 rollback note: use `FDH.rebuild({ cutBoundsMode: 'cellBounds' })`
as the A/B preview for removing `this.cut` from `ShapeGroup.boundsRect`. Compare
against `cutBoundsMode: 'frameBounds'` on cascade and J-in cropping hashes before
retuning shade constants or drawing Safari/performance conclusions.

For the current Mar 6 bottom-bar investigation, the newest high-value probe is:

```javascript
await reportFrameBottomBarSetComparison({
  debugHarness: { gridBoundsMode: 'magicalFitFrame' }
})
```

That rebuilds the full broken/golden pool under a dev-only patch that fits
`Magical` grids inside the frame before the frame `rOut combo` stack is
generated. If the broken pool stops clustering around `zeroVerticalSlack`,
the root cause is geometric overflow-to-clip rather than the combo filter
offset ladder itself.

Once that condition is confirmed, use these follow-ups:

```javascript
await compareFrameBottomBarModes()
```

That runs the primary broken/golden pool twice, once at runtime and once with
`gridBoundsMode: 'magicalFitFrame'`, then prints a per-hash delta table.

```javascript
await batchFrameBottomBarRegressionSheet({
  compareAs: 'primary',
  debugHarness: { gridBoundsMode: 'magicalFitFrame' },
  label: 'frame-bottom-bar-regression-sheet-fit-frame'
})
```

Quickly save both the broken and golden contact sheets (downloads two PNGs):

```javascript
// Runs the broken set then the golden set and triggers downloads
await saveFrameBottomBarSheets()
```

That exports a visual multi-hash contact sheet under the same dev-only patch,
so geometry metrics and visible outcome can be checked together.

For the converse stress test, grow the golden pool to full frame height:

```javascript
await compareFrameBottomBarModes({
  include: ['golden'],
  compareAs: 'primary',
  patchedHarness: { gridBoundsMode: 'forceFullFrameHeight' }
})
```

If those hashes start producing the same frame-bottom-bar family under forced
full-height geometry, the occupancy condition is much closer to causal than
correlative.

If forcing only the grid container is too weak, use the stronger content-level probe:

```javascript
await compareFrameBottomBarModes({
  include: ['golden'],
  compareAs: 'primary',
  patchedHarness: { frameGroupStretchMode: 'fillFrameHeightFromBacking' }
})
```

That stretches the built frame shape-group stack itself from the backing bbox,
so the visible frame content is driven to full frame height. This is more
aggressive and more visually distorted than the grid-bounds probe, but it is a
better converse test of whether full-height occupancy alone can induce the
frame-bottom-bar artifact family.
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

### 4.1 Adjacent Distance Diagnostic

*Added: 2026-03-13 (§ 9.12.10)*

```javascript
WrapperDebugOverlay.adjDistances()       // uses current GRID
WrapperDebugOverlay.adjDistances(BGRID)  // inspect frame grid
```

Logs a table comparing raw (pixel) vs normalized (cell-unit) start/end
distances for every adjacent-wrapped segment. Highlights with ⚠️ any
segments where normalization changes which side is selected. Useful for
verifying the § 9.12.10 fix on non-square aspect grids.

Columns: `seg`, `wrapper`, `inIsVert`, `rawStart`, `rawEnd`,
`normStart`, `normEnd`, `rawPick`, `normPick`, `changed`, `adjState`.

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
| `adjacent_horiz_aspect_1` | adjacent | broken | Converging adj wraps on horizontal cellAspect — aspect-dependent distance bug (§ 9.12.10) |
| `adjacent_horiz_aspect_2` | adjacent | broken | Converging adj wraps on horizontal cellAspect — dense grid, same class as above |
| `radiant_stack` | radiant | golden | 3+ diagonally aligned corners sharing arc origin |
| `interference_01` | radiant, interference | golden | Single-intermediate interference — 3 shapes, 1 band, proves wrapper-layer gate |
| `interference_02` | radiant, interference | golden | Multi-shape interference — ~4 harmonic bands, wobble visible when disabled |
| `intershape_1` | coincident, adjacent | untested | Intershape placed inside larger shape |
| `intershape_2` | coincident, adjacent | untested | Intershape placed inside larger shape |
| `intershape_3` | coincident, adjacent | untested | Intershape placed inside larger shape (most representative) |
| `filter_banding_1` | — | broken | Visible stepped banding on `rOut` shade stacks; primary shader quantization diagnosis case |
| `bottom_bar_1` | — | broken | Bottom frame bar artifact; use same-hash SVG variant sheet before changing runtime layout code |
| `cascade_grid_crop_1` | cascade-crop | fixed | lastHash #1444 — frontGrid combo cascade (§ 9.14.1) |
| `cascade_grid_crop_1514` – `1520` | cascade-crop | fixed | lastHash cascade/wave combo crop pool (§ 9.14.1, June 2026) |
| `cascade_grid_crop_2` | cascade-crop | broken | Legacy grid cascade repro — not in June 2026 fix pool |
| `broken_01` – `broken_03` | — | broken | Grouping errors (multiple groups contain same cell) |
| `broken_04` – `broken_06` | proximal | broken | Outer wrapper converging/intersecting inner wrapper |
| `broken_07` | adjacent | broken | Outer wrapper converging/barely intersecting inner wrapper |

**Adding new cases:** Edit `WRAPPER_TEST_CASES` in
`testing/WrapperTestHarness.js`. Set `status` to `golden` (known good),
`broken` (known bad), or `untested` (needs verification).

For the newer large-depth `rOut` frame bottom-bar bug, use the dedicated
registry `FRAME_BOTTOM_BAR_HASH_SETS` in `testing/WrapperTestHarness.js`.
It has three arrays:

```javascript
FRAME_BOTTOM_BAR_HASH_SETS.broken
FRAME_BOTTOM_BAR_HASH_SETS.golden
FRAME_BOTTOM_BAR_HASH_SETS.review
```

Recommended use:
1. put hashes with a clear visible slab/bar into `broken`
2. put hashes with comparable large-depth `rOut` frames but no slab into `golden`
3. put uncertain examples into `review`

Useful commands:

```javascript
reportFrameBottomBarHashSets()
await batchFrameBottomBarRegressionSheet()
await batchFrameBottomBarRegressionSheet({ include: ['broken', 'golden'] })
await reportFrameBottomBarSetComparison()
```

For the June 2026 **frontGrid combo cascade/wave crop** (§9.14.1), see
`cascade_grid_crop_*` cases in `WRAPPER_TEST_CASES`. Fix: `maskRect` and final
`<mask>` at `FRAME.anchor/size` in `ShapeGroup.createMaskGroup()`. Optional
headless screenshots: `python3 testing/cascadeCropProbe.py` (use fresh page load
per hash; allow ≥3s after `buildFromHash` before capture so blur filters resolve).

For the June 2026 frame/backgrid `rIn` side-crop bug, see
`docs/Operational/FRAME-RIN-CROP-AUDIT.md` and KNOWN-ISSUES §9.14.11. The
confirmed fix is the scoped `ShapeGroup.createBBoxKeeper()` rect under
`ShapeGroup.svgElt` for backgrid R combo masks with `outsetShade`.

Regression clue to preserve: `FRAME.backGrid.showShapeGroupsDebug(false)` made
the crop disappear because visible loft-debug geometry expanded the masked
parent SVG's effective painted bounds. Setting those debug paths to
`display:none` made the crop return. If this artifact resurfaces, first verify
that the `bboxKeeper` is present as a sibling under `ShapeGroup.svgElt`; do not
start by widening global filter regions or restoring broad `ShapeGroup.boundsRect`
behavior.

### 5.2 Batch Tools

| Function | Use |
|----------|-----|
| `batchContactSheet({hashes, cols, cellSize})` | Render all test hashes as a grid image, download as PNG. Color-codes borders by status. |
| `batchSnapshotExport({hashes, size})` | Render each hash individually, save as separate PNGs. Supports File System Access API for directory picking. |

These run in the browser and use `ProtoBatch.buildFromHash()` to
load each hash sequentially.

### 5.3 R-in vs R-out Shade Symmetry Test (2026-03-10)

Console-pasteable harness to verify shade parameters are symmetric
between r-in and r-out cuts. Uses the `DEBUG_NEUSHADES` instrumentation
in `neuShadeSVGFactory()`:

```javascript
(function testShadeSymmetry() {
  const captures = [];
  const origLog = console.log;
  console.log = function(...args) {
    if (args[0] === 'neuShadeDBG:') captures.push(args[1]);
    origLog.apply(console, args);
  };
  window.DEBUG_NEUSHADES = true;
  protoBatch.teardown();
  protoBatch.buildFromHash(tokenData.hash);
  window.DEBUG_NEUSHADES = false;
  console.log = origLog;
  const rows = captures
    .filter(c => c.curve === 'r' || c.curve === 'r2')
    .map(c => ({
      cutIn: c.cutIn ? 'IN' : 'OUT',
      inset: c.inset,
      shadeType: c.shadeType,
      curve: c.curve,
      stage: c.stage,
      offset: c.offset?.toFixed?.(4) ?? c.offset,
      mag: c.mag?.toFixed?.(6) ?? c.mag,
      blurRadius: c.blurRadius?.toFixed?.(6) ?? c.blurRadius,
      highBlurRad: c.highBlurRad?.toFixed?.(6) ?? c.highBlurRad,
    }));
  console.log('%c R-curve shade captures', 'font-weight:bold; font-size:14px');
  console.table(rows);
  return captures;
})()
```

**What to look for:** Compare rows with the same `shadeType` + `curve`
between `cutIn=IN` and `cutIn=OUT`. The `mag`, `blurRadius`, and
`highBlurRad` values should be identical. The only expected difference
is the `inset` flag (flipped between IN and OUT).

**Issue 9.14.9 finding:** Factory values were confirmed identical.
The visual asymmetry was traced to `ProtoFilter.shade()` where inset
and outset paths used different blend bases (`transparentInput` vs
`SourceGraphic`). Fix: change `insetResult` init to `SourceGraphic`.

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
