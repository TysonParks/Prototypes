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
| [Grid-SegPool.js](Grid-SegPool.js) | standalone class | Unused | Segment overlap refinement for island inset paths | Island cut experiments (`sketch.js` ref commented) |

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
| [ProtoLayer-interGrid.js](ProtoLayer-interGrid.js) | `ProtoLayer` + `Island` | Incomplete | `insetAmountToScale`, `createInterGrid` | Post-submission InterGrid work (`interCells` / `canHaveInterGrid` remain in production) |

### Symbols in `Grid-unused-api.js`

- **Getters:** `gridBounds`, `takenBounds`, `cellPoints`, `cellsInAnIsland`, `biggestGroup`, `allSimpleSubShapesSegsCounterSorted`, `allInternalSimpleSubShapes`, `allSimpleInsideCorners`, `availableRows`, `availableColumns`, `gridCornerSegs`
- **Methods:** `cellIsInAnIsland`, `cellSpanBounds`, `neighborIsTaken`, `availableNeighbors`, `takenNeighbors`, `ordinalNeighbors`, `transformedCellRows`
