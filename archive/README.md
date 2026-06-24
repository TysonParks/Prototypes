# Archive

Legacy experiments and removed production code — not loaded by `index.html`, excluded from Art Blocks submission.

See [SUBMISSION-MANIFEST.md](../docs/Operational/SUBMISSION-MANIFEST.md).

## Standalone experiments

| File | Notes |
|------|--------|
| [Arecibo.js](Arecibo.js) | Exploratory grid layout (not production) |
| [Unused.js](Unused.js) | Deprecated helpers and test utilities (legacy dump — prefer named files below for new archives) |

## Grid.js removals (2026-06, E2 cleanup)

| File | Removed from | Status | Intent | Revive when |
|------|--------------|--------|--------|-------------|
| [Grid-frameShapeMetrics.js](Grid-frameShapeMetrics.js) | `Grid` getter | Superseded | Early model-space metrics for reveal dummy morph | DOM measurement in `RevealAnimation.js` is canonical |
| [Grid-unused-api.js](Grid-unused-api.js) | `Grid` getters/methods | Unused | Cell/island helpers, neighbor filters, `transformedCellRows` | Re-paste onto `Grid` if needed |
| [Grid-maximizeCuddles-experiments.js](Grid-maximizeCuddles-experiments.js) | inner `maximizeCuddles()` | Incomplete | `createQuadShapes`, `roundQuads`, `maximizeOuterCorners`, `fixLooseCorners` | Quad/easter-egg modes + AB feature flag |
| [Grid-setup-unused.js](Grid-setup-unused.js) | `Grid` methods | Unused | `cellRowsRotated`, `setFrameRadii`, `setInsetScale`, `insetCells` | Grid setup experiments |
| [Grid-outline-convenience.js](Grid-outline-convenience.js) | `Grid` methods | Unused | `outlineGroup`, `outlineTaken` wrappers | Dev `testMess.js` still references these — use `outline()` directly |
| [Grid-symmetrize.js](Grid-symmetrize.js) | `Grid.symmetrize()` | Incomplete | Reflect/rotate cell selections to mirror groups | Fix reassignment bugs before revive |
| [Grid-setGridAvailability.js](Grid-setGridAvailability.js) | `Grid` method | Unused | Group-aware availability reset (vs simple `setAvailability`) | Used only by archived `symmetrize()` |
| [Grid-SegPool.js](Grid-SegPool.js) | standalone class | Incomplete | Pool-level `unitRefined()` over flattened inset segments | InterGrid / mask shapes (pairs with [SegPath-unitRefined.js](SegPath-unitRefined.js)) |

## Reveal animation removals (2026-06)

| File | Removed from | Status | Intent |
|------|--------------|--------|--------|
| [RevealAnimation-two-phase.js](RevealAnimation-two-phase.js) | `RevealAnimation.js` | Obsolete | Chrome two-phase reveal variant (opacity flip + staged dummy morph) |

Split from monolithic `safariImageSwap.js`:
- **Production:** [RevealAnimation.js](../RevealAnimation.js) — cold-load reveal, Safari loading overlay, `window.RevealAnim`
- **Dev-only:** [RevealAnimationDev.js](../RevealAnimationDev.js) — `'n'` regen, `hideNow()`, rotation-reload modes

## ProtoLayerObjects.js removals (2026-06)

| File | Removed from | Status | Intent | Revive when |
|------|--------------|--------|--------|-------------|
| [ProtoLayer-unused.js](ProtoLayer-unused.js) | `ProtoLayer` | Unused | `_filterLoft`, `filterLoft`/`loft` getters, `padSize` getter | Filter loft experiments |
| [ProtoLayer-interGrid.js](ProtoLayer-interGrid.js) | `ProtoLayer` + `Island` | Incomplete | `insetAmountToScale`, `createInterGrid` | Post-submission InterGrid work (Island getters in [Island-unused.js](Island-unused.js)) |
| [ProtoLayer-material-experiments.js](ProtoLayer-material-experiments.js) | `Frame`, `ShapeGroup`, `neuMark_I` | Experimental | FAIL/EXP fill/stroke/palette swaps for alternate material looks | Paste snippets into cited draw methods |
| [Frame-innerMask-cutout.js](Frame-innerMask-cutout.js) | `Frame.setBackGridGroup()` | Incomplete | Inner cut at `scaled(0)` + SVG mask on combo cuts (mode 0 full backing) | Complex outer frame wrapping internal grid |
| [StairsToDiagonals.js](StairsToDiagonals.js) | `SegPath` + `VertPath` + `Frame` | Incomplete | Convert rectilinear stair corners to diagonal segments | Post-Prototypes launch |
| [SelectionBounds-experiments.js](SelectionBounds-experiments.js) | `SelectionBounds` | Incomplete | Guide points, centroid, `half()` / `quadrant()`, max square/rect | Post-Prototypes symmetrize + layout work (pairs with [Grid-symmetrize.js](Grid-symmetrize.js)) |
| [CellGroup-unused.js](CellGroup-unused.js) | `CellGroup` | Unused | Commented neighbor/island getters, migrated geometry wrappers | Revive with sketch.js outset/reDirect paths if needed |
| [Cell-unused.js](Cell-unused.js) | `Cell` + `ShapeGroup.cells` | Unused | Neighbor/segment getters, `createInterCopy` InterGrid foundation | Post-submission InterGrid work (pairs with [ProtoLayer-interGrid.js](ProtoLayer-interGrid.js)) |
| [Island-unused.js](Island-unused.js) | `Island` | Unused | Classification getters, exposed wrappers, InterGrid getters | Post-submission InterGrid work (pairs with [ProtoLayer-interGrid.js](ProtoLayer-interGrid.js)) |
| [Shape-unused.js](Shape-unused.js) | `Shape` | Unused | Classification getters, cut-depth seg paths, inset corner radii | Revive with DeBugging.js cut-line overlays if needed |

## drawAsSVG.js removals (2026-06)

| File | Removed from | Status | Intent | Revive when |
|------|--------------|--------|--------|-------------|
| [StairsToDiagonals.js](StairsToDiagonals.js) | `SegPath` + `VertPath` | Incomplete | `diagonalsPath`, `stairs`, `stairSets`, `withDiagonals()`, `convertToDiagonals()` | Post-Prototypes launch (live `ProtoSegment.isStair` unchanged) |
| [SegPath-unused.js](SegPath-unused.js) | `SegPath` getters/methods | Unused | `hasMinRadii`, `isOutsideQuad`, `perimeter`, `hasLoosies`, `makeCurves()` | Revive with [Grid-maximizeCuddles-experiments.js](Grid-maximizeCuddles-experiments.js) |
| [SegPath-unitRefined.js](SegPath-unitRefined.js) | `SegPath.unitRefined()` + `sketch.js` test | Incomplete | Cut overlapping segments on 1-unit shrink for accurate mask shapes | InterGrid work (pairs with [Grid-SegPool.js](Grid-SegPool.js), [ProtoLayer-interGrid.js](ProtoLayer-interGrid.js)) |

### Symbols in `Grid-unused-api.js`

- **Getters:** `gridBounds`, `takenBounds`, `cellPoints`, `cellsInAnIsland`, `biggestGroup`, `allSimpleSubShapesSegsCounterSorted`, `allInternalSimpleSubShapes`, `allSimpleInsideCorners`, `availableRows`, `availableColumns`, `gridCornerSegs`
- **Methods:** `cellIsInAnIsland`, `cellSpanBounds`, `neighborIsTaken`, `availableNeighbors`, `takenNeighbors`, `ordinalNeighbors`, `transformedCellRows`
