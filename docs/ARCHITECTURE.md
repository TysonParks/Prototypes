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

---

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

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-04*
