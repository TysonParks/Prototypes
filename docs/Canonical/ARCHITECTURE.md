# BoredUI Architecture

> **Purpose:** Analyze the code structure of the wrapper system —
> where the evaluation/opinion boundary holds, where it breaks, and
> the design for a future Unified Wrapper Funnel.
>
> **Related docs:**
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [KNOWN-ISSUES](KNOWN-ISSUES.md) |
> [ROADMAP](ROADMAP.md) |
> [TESTING](TESTING.md)

## What This Document Is Not

- Not geometric definitions (see GEOMETRY-REFERENCE.md)
- Not a bug history or replacement for KNOWN-ISSUES.md
- Not a project roadmap or sequencing guide

## Table of Contents

- [10. Architecture: Evaluation vs. Opinion](#10-architecture-evaluation-vs-opinion)
  - [10.1 The Two-Layer Model](#101-the-two-layer-model)
  - [10.2 Where the Boundary Breaks Down](#102-where-the-boundary-breaks-down)
  - [10.3 Assessment](#103-assessment)
- [11. Toward a Unified Wrapper Funnel](#11-toward-a-unified-wrapper-funnel)
  - [11.1 Current Two-Funnel Architecture](#111-current-two-funnel-architecture)
  - [11.2 The 8-State Collinearity Model](#112-the-8-state-collinearity-model)
  - [11.3 Why Unification Is Geometrically Sound](#113-why-unification-is-geometrically-sound)
  - [11.4 CW/CCW Orientation Normalization](#114-cwccw-orientation-normalization)
  - [11.5 What Unification Would Simplify](#115-what-unification-would-simplify)
- [12. Frame Wrapping](#12-frame-wrapping)
  - [12.1 Frame Architecture](#121-frame-architecture)
  - [12.2 Frame Wrapping Pipeline](#122-frame-wrapping-pipeline)
  - [12.3 `inWrapPerimeter` — Inner→Outer Wrapping](#123-inwrapperimeter--innerouter-wrapping)
  - [12.4 Intershape Wrapping Context](#124-intershape-wrapping-context)
  - [12.5 Future: Second Frame Wrapping Mode](#125-future-second-frame-wrapping-mode)
- [13. ProtoLayer SVG Realization and Inset Propagation](#13-protolayer-svg-realization-and-inset-propagation)
  - [13.1 Which Layers Produce SVG](#131-which-layers-produce-svg)
  - [13.2 Inset and Bounds Propagation](#132-inset-and-bounds-propagation)
  - [13.3 Filter Region Implications](#133-filter-region-implications)

> **Note on numbering:** Section numbers 10–11 preserved from the
> original GEOMETRY-REFERENCE.md for consistency with any existing
> cross-references.

---

## 10. Architecture: Evaluation vs. Opinion

The wrapper system follows a two-layer separation of concerns. This section
documents the intended architecture, where the boundary holds, and where it
breaks down.

### 10.1 The Two-Layer Model

| Layer | Location | Role |
|-------|----------|------|
| **Evaluation** | `ProtoSegment` (drawAsSVG.js) | Spatial analysis: "what are my neighbors, what wrapping relationships exist, what origins are geometrically valid?" |
| **Opinion** | `maximizeCuddles()` arrow functions, ordered by `fixIssues()` (Grid.js) | Aesthetic strategy: "given what's possible, what should we actually do, and in what order?" |

`fixIssues()` controls the order in which `maximizeCuddles()`'s arrow
functions are called. Each reordering or omission of any arrow function
slightly alters how the final composition relaxes its corners. This is
the **opinion** — the aesthetic judgment about how most outputs should
resolve. The intent was to keep this separate from the geometric
evaluation in `ProtoSegment`, with `ProtoSegment` providing
*possibilities* and `maximizeCuddles()` providing *decisions*.

### 10.2 Where the Boundary Breaks Down

Strict separation is neither fully achievable nor necessary. The domain
has an inherent property: **evaluation results change after opinion acts**.
When `wrapInnerMost()` calls `s.setArcToMiddle()`, every neighboring
segment's spatial relationships change. This is intrinsic to iterative
constraint relaxation — the same pattern as physics engines and layout
solvers.

However, there are five specific categories where the boundary blurs
beyond what the domain requires:

#### 10.2.1 Filtering Logic in Evaluation Getters

`viableOutWrappers` branches on `this.grid.isFull` to narrow the search
scope. This is an **opinion** (grid density determines candidate pool)
embedded in the evaluation layer. The opinion layer in `maximizeCuddles()`
operates on pre-filtered data without knowing what was excluded.

**Code:** `viableOutWrappers` — the `grid.isFull ?` branch.

#### 10.2.2 Single-Answer Selection in Getters

`flushWrapper` returns `flushWrappersFinal[0]` — a tie-breaking decision
when multiple equidistant wrappers exist. Similarly `adjacentWrapper`
returns `adjWrappersFinal[0]`. These are **opinion-level selections**
made inside the evaluation layer. The opinion layer never sees the
alternatives.

**Code:** `flushWrapper`, `adjacentWrapper` — both pick `[0]`.

#### 10.2.3 `#wrap()` Contains Both Mutation and Re-Evaluation

`#wrap()` queries the wrapper (evaluation), checks conditions and
branches (decision), then modifies cubic verts (mutation) — all three
concerns in one method. When `maximizeCuddles()` calls `s.flushWrap()`,
it expects a simple action, but the action internally re-evaluates and
makes decisions that the opinion layer can't control.

**Code:** `#wrap(flush, replace, wrapOut)` — evaluates, decides, mutates.

#### 10.2.4 Hybrid Predicates

`canCurveTo()` and `canCurveMoreAtEnd` serve **both** as evaluators
(in `viableArcOrigins` filtering) **and** as opinion guards (in
`maximizeCuddles()` conditional branches). This dual use is inherent
to the domain and not necessarily a problem — the predicate genuinely
serves both roles.

#### 10.2.5 Stale Memoization = Separation Failure

`#resetMemoProps()` only invalidates ~12 of 30+ memoized keys. After
the opinion layer mutates arc origins, the evaluation layer returns
**outdated spatial relationships**. The opinion then acts on stale data.
The commented-out `memoize()` calls on `adjDistanceObjs`,
`adjacentWrapper`, `adjWrapperObjsFinal`, etc. are evidence of
repeated encounters with this issue.

### 10.3 Assessment

| Question | Answer |
|----------|--------|
| Is strict separation possible? | No — iterative constraint relaxation inherently couples evaluation and mutation |
| Is strict separation necessary? | No — the real need is **predictable mutation boundaries** |
| Where does the model actually fail? | Stale memoization (incomplete `#resetMemoProps`), wrapper getters that make final selections (`[0]`), and `viableOutWrappers` pre-filtering by grid density |
| What's the minimum fix? | Replace selective key-based reset with full cache invalidation (generation counter or `memoCache.delete(instance)`) |
| What's the design takeaway? | The evaluation/opinion separation is ~80% clean. The 20% bleed-through is inherent to the domain. Document which getters are topology-stable vs. arc-volatile, and fix the invalidation boundary. |

**Stable vs. Volatile Getters:**

| Category | Examples | Safe to Memoize? |
|----------|----------|------------------|
| Topology-stable | `viableInWrappers`, `viableOutWrappers`, `hasSameFacingCorner`, `hasDiagonalCorner` | Yes — grid topology never changes after setup |
| Arc-volatile | `adjDistanceObjs`, `adjacentWrapper`, `flushWrapper`, `arcOrigin`, `arcRadius` | No — depend on current cubic vert positions which mutate during `maximizeCuddles()` |

The full memoKey classification (60+ keys) is maintained in
`testing/WrapperTestHarness.js` — see [TESTING § 2.2](TESTING.md#22-memokey-classifications).

---

## 11. Toward a Unified Wrapper Funnel

> **FIXME in code:** `//FIXME: ultimately all wrappers (flush+adj) should`
> `be wrapped in one object, using tangX to choose wrapper`
> — drawAsSVG.js, line 2485

### 11.1 Current Two-Funnel Architecture

Flush and adjacent wrapping follow structurally identical pipelines that
both terminate at the same `#wrap()` method:

```
FLUSH FUNNEL                          ADJACENT FUNNEL
─────────────                         ────────────────
viableWrappers                        viableWrappers
  ↓                                     ↓
findFlushDistanceObjs()               adjDistanceObjs
  ↓                                     ↓
flushIntersectObjs                    adjIntersectObjs
  ↓                                     ↓
flushWrapperObjsFinal                 adjWrapperObjsFinal
  ↓                                     ↓
flushWrapper                          adjacentWrapper
  ↓                                     ↓
flushOutWrapper / flushInWrapper      adjOutWrapper / adjInWrapper
  ↓                                     ↓
flushWrap() → #wrap(true)            adjWrap() → #wrap(false)
              ↘                        ↙
               ─── #wrap(flush) ───
```

The only structural differences:

| Aspect | Flush | Adjacent |
|--------|-------|----------|
| Distance calculation | `findFlushDistanceObjs()` — tests `horVertSides` collinearity | `minAdjWrapperDistanceObj()` — uses `arcCenterMidPointTangent` intersection |
| Candidate filtering | Requires `hasCollinearCorner \|\| hasCoincidentCorner` | Explicitly excludes those |
| In/out assignment | `flushIsInWrapper` → `couldHaveInWrapper()` | `isOutsideCorner` directly |

Both produce the same output shape: `{ seg, dist, intersect, isStart }`.
Both feed into the same `#wrap()` which either matches arc origins
(diagonal case) or sets distanced corner verts (non-diagonal case).

### 11.2 The 8-State Collinearity Model

Instead of asking "is this flush or adjacent?" first, a unified model
would classify the **collinearity relationships between the four segments**
involved in any two same-facing corners:

```
Corner A: [segA, segA.endNeighbor]
Corner B: [segB, segB.endNeighbor]
```

| State | Collinearity | Current Classification |
|-------|-------------|------------------------|
| 1 | segA ∥ segB | Flush (collinear) |
| 2 | segA ∥ segB.endN | Flush (collinear) |
| 3 | segA.endN ∥ segB | Flush (collinear) |
| 4 | segA.endN ∥ segB.endN | Flush (collinear) |
| 5 | segA ∥ segB AND segA.endN ∥ segB.endN | Flush (coincident) |
| 6 | None collinear, but diagonal (arc origin paths collinear) | Radiant |
| 7 | None collinear, non-diagonal | Adjacent / Proximal |
| 8 | One pair collinear + diagonal | Mixed (currently unhandled) |

Combined with the viable arc origin overlap, this gives a single
classification that subsumes flush/adjacent/coincident/collinear/radiant/
proximal. The `tangX` (tangent intersection) from the FIXME comment
would be the **universal distance metric** — a perpendicular intersection
is just a degenerate tangent intersection.

### 11.3 Why Unification Is Geometrically Sound

`intersectObj()` is already funnel-agnostic. It doesn't care if the
wrapper is flush or adjacent:

```javascript
intersectObj(seg, isStart) {
  const { inWrapper, outWrapper } = this.inOutWrapObjWith(seg)
  const side = isStart ? outWrapper.endNeighbor : outWrapper
  const intersect = side.perpendicularIntersectionWith(inWrapper.arcOrigin)
    || side.perpendicularIntersectionWith(inWrapper.minArcOrigin)
  const distToCorner = roundToDec(intersect.dist(outWrapper.end))
  return { seg, dist: distToCorner, intersect, isStart }
}
```

The `dist` it produces is meaningful regardless of wrapper type. The only
reason two funnels exist is because **candidate filtering** diverges —
flush checks `horVertSides` collinearity while adjacent checks
`arcCenterMidPointTangent`. Using `tangX` as the universal first-pass
metric would allow filtering and sorting all candidates in one pass,
then classifying them afterward.

### 11.4 CW/CCW Orientation Normalization

One complexity that drove separate funnels: inner shapes can run
**counter-clockwise** (cutouts/holes via `isCutOut`) while outer shapes
run **clockwise** (normal perimeters and inter-shapes). This flips the
meaning of `isOutsideCorner`:

| Winding | Right Turn | Left Turn |
|---------|------------|----------|
| Clockwise (normal) | Outside corner (convex) | Inside corner (concave) |
| Counter-clockwise (cutout) | Inside corner (concavity of hole) | Outside corner (hole's convex boundary) |

The current code handles this via `isOutsideCorner` checks scattered
across both funnels. In a unified model, this would become a single
normalization step at the top of the pipeline: "given two corners,
normalize their in/out orientation relative to each other" — which is
essentially what `couldHaveInWrapper()` already does, but it's called
differently in flush vs. adjacent contexts.

### 11.5 What Unification Would Simplify

**1. `outWrapper` / `inWrapper` getters** — currently branch on
`flushOutWrapper && adjOutWrapper` to pick closest. Would become
a single lookup into the unified wrapper list.

**2. `#wrap()` method** — currently branches on `flush` boolean.
The classification (diagonal vs. non-diagonal) would be embedded in
the wrapper object itself:

```javascript
// Hypothetical unified #wrap()
#wrap(wrapperObj, replace = false) {
  const { seg: wrapper, isDiagonal, dist } = wrapperObj
  if (isDiagonal) {
    target.replaceEndCurveOrigin(source.arcOrigin)
  } else {
    target.addDistancedEndCornerVerts(dist, true)
  }
}
```

**3. `maximizeCuddles()` pipeline** — `fixBadFlushWraps()` and
`fixBadAdjWraps()` would merge into a single `fixBadWraps()`.

**4. Duplicate property chains** — ~200 lines of near-parallel
flush/adj property getters would collapse to ~80.

**5. `flushWrap()` / `adjWrap()` + `wrapState(flush)` +
`#inOutWrappers(flush)`** — all boolean-threaded methods
would become unnecessary.

**Estimated reduction:** ~200 lines of ProtoSegment, ~50 lines
of Grid.js `maximizeCuddles()` pipeline.

**Risk:** Every edge case currently handled separately by the two
funnels must be re-verified — particularly the CW/CCW orientation
flips and non-square cell aspect issues. The audit sessions
(coincident → collinear → adjacent → radiant) should be completed
first to catalog which edge cases differ between funnels.
See [ROADMAP § 1](ROADMAP.md#1-wrapper-audit-checklist) for audit status.

---

## 12. Frame Wrapping

### 12.1 Frame Architecture

The Frame class (ProtoLayerObjects.js L250–482) manages the
outer border around the entire artwork. It operates on a
**dual-grid** system:

- **`this.grid`** — the main (front) grid containing shapes
- **`this.backGrid`** — a separate Grid instance (`gridType: 3`)
  that fills the space behind/around the main shapes

These are linked bidirectionally:
```
grid.backGrid = backGrid
backGrid.frontGrid = grid
```

The backGrid’s shapes must wrap **toward** the frontGrid’s
perimeter curves — this is inner→outer wrapping.

### 12.2 Frame Wrapping Pipeline

`setBackGridGroup()` (L327–482) runs its own wrapping pipeline,
independent of `maximizeCuddles()`:

1. **Group creation** — builds `backGroup` from taken cell indices
2. **Hole removal** — fills cells with opposite neighbors taken
   (`hasOppositeNeighborsTaken`)
3. **Perimeter creation** — `createPerimiters(Direction.All, true)`
4. **createSimpleSubShapes** — builds initial corner geometry
5. **curveMinRadiusCorners** — `{ all: true }` flag
6. **Custom wrapping loop** — for each loose corner:
   - If has both flush+adj wrappers: pick closer one (coincident
     check or distance comparison)
   - If has only flush: `flushWrap(true, false)`
   - If has only adj: `adjWrap(true, false)`
   - If has no wrapper: `setArcToMiddle()` or `maxArcOrigin` fallback
7. **padWidth calculation** — scaled frame dimensions
8. **Flat backing cut** — `cutIslands` with no profile
9. **Real cuts** — iterates `cuts` array for frame molding profiles

**Key difference from `maximizeCuddles()`:** Frame wrapping calls
`flushWrap` and `adjWrap` directly with `(true, false)` arguments
(force=true, resetMemo=false), bypassing the priority negotiation
and radiant/interference pipeline entirely. This is simpler but
means Frame corners never get radiant or interference treatment.

### 12.3 `inWrapPerimeter` — Inner→Outer Wrapping

`Grid.inWrapPerimeter(simpleSegs, parentSegs)` (Grid.js L595–617)
is the core method for making inner shapes adopt outer shapes’
curvature:

```
For each inner segment:
  1. Find a parent segment with a coincident corner
  2. If found: adopt parent’s arcOrigin → setEndCurveOrigin(match.arcOrigin)
  3. If not found: add to unmatched pool

For each unmatched:
  1. If has inWrapper and canCurveTo: adopt inWrapper’s arcOrigin
  2. Otherwise: matchEndCorner() (geometric fallback)
```

This is **unidirectional**: inner shapes conform to outer shapes,
not vice versa. The outer shapes’ curves are already established.

Used in:
- `copyAllToCardinal()` (L2813) — when All→Cardinal direction
  conversion splits shapes, inner perimeters wrap to parent
- Intershape creation via `newIslands()` (L2699) calls
  `completeEnds(simples, false)` — related but different path

### 12.4 Intershape Wrapping Context

Intershapes are shapes created inside other shapes via
`recalcdCells → newIslands` in `Island.createSubIslands()`.
They exercise the same wrapper types (coincident, adjacent,
collinear, radiant) but with a critical direction difference:

| Aspect | Normal wrapping | Intershape/Frame wrapping |
|--------|----------------|---------------------------|
| Direction | Mutual — peers negotiate | Inner adopts outer’s curves |
| Target | Same-shape neighbor corners | Parent shape’s perimeter |
| Method | `maximizeCuddles()` pipeline | `inWrapPerimeter()` or custom loop |
| Radiant/interference | Full pipeline | Not applied |

The `viableOutWrappers` / `viableInWrappers` distinction matters
here: `viableOutWrappers` are segments whose arc **contains** this
segment’s arc (larger envelope), while `viableInWrappers` are
segments whose arc **fits inside** this segment’s arc.

### 12.5 Future: Second Frame Wrapping Mode

**Status:** ⭐ Future feature

The current Frame wrapping in `setBackGridGroup()` uses a simplified
custom loop that bypasses `maximizeCuddles()`. A second mode could:

- Apply the full `maximizeCuddles()` pipeline to backGrid shapes,
  including radiant chains and interference detection
- Enable more intricate frame molding profiles that respond to
  the geometry of adjacent shapes (rather than just flushing/adj
  to the nearest corner)
- Potentially use `inWrapPerimeter` to first establish outer
  conformity, then run `maximizeCuddles()` refinement on top

The inner mask code (currently commented out in `setBackGridGroup`
L456–470) was an early step toward this — creating an SVG `<mask>`
from the backGroup’s second shapeGroup to clip the frame interior.
See KNOWN-ISSUES § 9.11.4 for the BrokenFuture state of this code.

---

## 13. ProtoLayer SVG Realization and Inset Propagation

This map captures the current layer/bounds architecture as of 2026-05-15,
with emphasis on why precise shade-filter regions are hard to compute in
`ProtoCut.setLayouts()`. It separates three different things that often look
similar while debugging:

- **Geometry/data layers**: objects that calculate cells, islands, paths, and
  bounds but normally do not create persistent visible SVG.
- **Structural SVG layers**: SVG elements used as nested coordinate systems,
  filter consumers, masks, or grouping containers. They may be invisible but
  still affect filter region cost and clipping.
- **Visual SVG layers**: elements that paint rects or paths into the artwork.

### 13.1 Which Layers Produce SVG

| Class / helper | Default role | SVG realization | Notes |
|----------------|--------------|-----------------|-------|
| `ProtoLayer` | Base layout contract | Creates a nested `<svg>` when `drawSVG` is true; creates a debug/front `<rect>` when `drawRect` is true | `assignElement()` is the shared place where `layout(anchor, size, padding)` and `viewBox(anchor, size, padding)` are applied. Subclasses can become structural or visual depending on constructor flags. |
| `Frame` | Artwork root and backing frame | Visual + structural | Creates `bleed` `<svg>`, `bleedRect`, the main frame `<svg>` via `super.assignElement()`, optional frame debug rect, and frame masks. Its `boundsRect` is the canonical `(0,0,100,200)` frame. |
| `Grid` / `BackGrid` | Grid coordinate system and shader layer owner | Structural by default | `Grid` creates its own `<svg>` via `ProtoLayer`. The front grid also creates persistent shader `<g>` layers: `backElt`, `comboElt`, `highElt`, `shadElt`, and `maskElt`. The back grid shares those shader layers after `Frame.setGrid()`. |
| `SelectionBounds` | Cell selection measurement helper | Data only | Not a `ProtoLayer`; computes cell selection bounds and related cell metrics. No DOM. |
| `CellGroup` | Group of selected cells and island factory | Structural SVG | Defaults to `drawSVG: true`, so it creates a nested `<svg>` container, but it normally paints no paths itself. It owns `perimeterIslands`, `shapeGroups`, and `cuts`. |
| `ShapeGroup` | Render layer for one cut/filter/backing pass | Visual + structural | Creates an outer nested `<svg>`, an inner `svgGroupElt` `<g>`, path copies for each shape, optional `<defs>/<mask>` structures, and applies the shade filter to `svgGroupElt`. This is the main filter consumer. |
| `Cell` | Grid cell data | Data only by default | `drawSVG: false`. Debug methods can temporarily enable drawing and call `assignElement()`, but normal rendering uses cells only as geometry/state. |
| `Island` / `PerimeterIsland` | Connected cell island and shape source | Data only | `drawSVG: false`. Stores cells, cut, direction, inset scale, and creates/copies `Shape` objects. |
| `Shape` / `PerimeterShape` | Path geometry source | Data only by default | `drawSVG: false`. Computes SVG path strings and mask path strings. Actual `<path>` elements are created later by `ShapeGroup.assignShapes()`. |

The important filter-layout consequence is that the visible path can be much
tighter than its structural SVG envelope. `Shape` may know the inset geometry,
but the filter is applied to the `ShapeGroup`'s `svgGroupElt`, whose current
layout is based on the ShapeGroup's cell selection bounds plus padding.

### 13.2 Inset and Bounds Propagation

All `ProtoLayer` subclasses inherit the same computed geometry unless they
override it:

```
insetScale       = explicit _insetScale, else protoParent.insetScale
boundsRect       = protoParent.insetBoundsRect
anchor / size    = boundsRect x/y/width/height
insetSize        = size * insetScale
insetAmount      = (size - insetSize) / 2
insetAnchor      = centered anchor for insetSize
insetBoundsRect  = insetAnchor + insetSize
```

Current propagation chain:

| Step | Inset/bounds behavior | Where the value continues |
|------|-----------------------|---------------------------|
| `Frame` | Hard-codes `insetScale: 1`, `anchor = (0,0)`, `size = (100,200)`, and `boundsRect = FRAME`. | Parent region for front grid and back grid. |
| `ProtoMill.mkGrid()` -> `new Grid(...)` | Passes feature-selected `gridInsetScale` into `Grid`. | Grid `insetSize` drives `cellSize`, so cell dimensions already include the grid inset. |
| `Grid` | Flexible grids inherit parent inset bounds; fixed/magical style grids override `anchor`, `size`, and `boundsRect` from `gridAspect`. | `cellSize = grid.insetSize / gridSize`; `visibleBoundsRect` is a separate visible constraint region, not the intrinsic grid bounds. |
| `Cell` | Constructor sets `insetScale: 1`; `size` is `grid.cellSize`. | Cell bounds are already grid-inset-aware through `grid.cellSize`, but each Cell's own `insetSize` equals its cell size. |
| `CellGroup` | Constructor sets `insetScale: 1`; `boundsRect` comes from `grid.cellBounds(selection)`. | This intentionally resets group layout to selected cell bounds. It does not inherit a smaller child/shape inset. |
| `CellGroup.cutIslands()` | Computes cut-specific `insetScale` from `layerStart`, `layerEnd`, profile, dilation, and cut loop state. | Passed into `createSubIslands(...)`. |
| `Grid.createIslands()` / `Island.createSubIslands()` | Creates `Island` objects with the current `insetScale`. Copy/recalc paths preserve that scale. | Passed into `Island.createShape(insetScale)`. |
| `Island.createShape()` / `Shape` | Creates `Shape` with the same `insetScale`; Shape inherits the base `insetSize = size * insetScale`. | This is where the tight inset geometry exists for paths and masks. |
| `CellGroup.islandsToShapeGroups()` | Iterates `cut.filters` and creates one `ShapeGroup` per filter/backing pass. The current call does not pass the cut/island `insetScale`; the old `insetScale` argument is commented out. | ShapeGroup falls back to `insetScale: 1`. This is the main propagation stop for render-region sizing. |
| `ShapeGroup` | `boundsRect` is frame bounds only for `isFrame`; otherwise it uses `cellBounds.boundsRect`. `padding` comes from `cut.padding` or grid inset padding. | Outer `<svg>`, inner `<g>`, masks, and filter consumer layout are based on ShapeGroup cell bounds, not actual Shape path bounds. |
| `ProtoCut.maxLayout` | Legacy percent path computes a shared percent region from `shapeGroups[*].insetSize` and padding. | Because ShapeGroups normally have `insetScale: 1`, this is a cell-bounds calculation, not a true inset/path-region calculation. |
| `ProtoCut.setLayouts()` | Current user-space path uses `FRAME.boundsRect` plus margin for every filter. | Correctness-biased but overbroad; it bypasses the incomplete propagation chain entirely. |

This split appears intentional up to the point where geometry objects remain
data-only and render objects aggregate many shapes into one filter pass. The
incomplete part is that no separate, explicit render/filter bounds contract is
carried across that boundary. `ShapeGroup` currently has to choose between
coarse cell bounds and global frame bounds, even though tighter inset/path
geometry exists one level down on the Shapes.

### 13.3 Filter Region Implications

`ProtoCut` owns shared filters, and each cut creates one ShapeGroup per filter
type. Without cloning filters per ShapeGroup, the tightest practical
`userSpaceOnUse` region is a per-cut/per-filter union of all consuming
ShapeGroups, expanded by the needed blur/offset margin. A per-ShapeGroup filter
region would require unique filter instances or another isolation layer.

Recommended replacement direction for the current `FRAME.boundsRect` branch:

1. Keep the legacy percent `maxLayout` branch for A/B and historical reference.
2. Add an explicit ShapeGroup render/filter bounds getter instead of overloading
  `boundsRect`. Candidate inputs, from coarse to tight, are: `cellBounds`,
  `insetBoundsRect`, union of `shapes[*].insetBoundsRect`, or path-derived
  bounds from actual SVG geometry.
3. Preserve the cut/island inset intent at the render boundary. This could be a
  passed `sourceInsetScale`, a stored `sourceInsetBoundsRect`, or a dedicated
  `filterBoundsRect` computed from the group's Shapes. It does not necessarily
  mean the ShapeGroup's structural SVG viewport should shrink immediately.
4. In `ProtoCut.setLayouts()`, compute `region = union(shapeGroup.filterBoundsRect
  for shapeGroups using this filter)`, expand it by the filter's required
  blur/offset/padding margin, then set the filter element with `filterUnits =
  userSpaceOnUse` and absolute user-unit `x/y/width/height`.
5. Use `layout()` for the final filter element attributes if the region is a
  normal `{ x, y, width, height }` rect. Use `layoutLimited()` only when the
  desired behavior is to clamp the expanded filter region to an explicit visible
  limit; it should not be the default while debugging filter bleed because it
  can hide genuine blur/offset requirements.

`layout()` works on `<filter>` elements because filters use the same `x`, `y`,
`width`, and `height` attributes as SVG viewport elements. It does not set
`filterUnits`, so `setLayouts()` still needs to assign `filterUnits` explicitly.
`viewBox()` is not relevant to `<filter>`.

2026-05-25 test note: the first implementation of this path used a
`ShapeGroup.filterBoundsRect` based on the union of `shapes[*].insetBoundsRect`
and switched shared filters to the per-filter union. It introduced cropping and
was reverted. Revisit after the current J-in masking work, with dedicated
hashes and visual A/B coverage.

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-05-15*
