# BoredUI Known Issues & Edge Cases

> **Purpose:** Track active bugs, audit findings, and unresolved edge
> cases in the wrapper system. Organized by issue number for stable
> cross-referencing from code comments.
>
> **Related docs:**
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [ARCHITECTURE](../Canonical/ARCHITECTURE.md) |
> [FEATURES-AND-DETERMINISM](FEATURES-AND-DETERMINISM.md) |
> [ROADMAP](ROADMAP.md) |
> [TESTING](TESTING.md)

---
> **Purpose:** Track active bugs, audit findings, and unresolved edge
cases in the wrapper system. Organized by issue number for stable
cross-referencing from code comments.

**Related docs:**
[GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
[ARCHITECTURE](ARCHITECTURE.md) |
[ROADMAP](ROADMAP.md) |
[TESTING](TESTING.md)

## What This Document Is Not

- Not a design specification — it records observed failures and audits
- Not guaranteed current truth; entries are historical and may be superseded
- Contains past failed fixes and experiments for traceability

---

Maintenance note:
- When editing or auditing a specific issue section, append a short timestamp line to that section header, e.g. `*Last audited: 2026-03-09 — notes or summary*` so readers can see the most recent verification date.


## Table of Contents

- [9.1 Chicken-and-Egg Risks](#91-chicken-and-egg-risks)
- [9.2 Non-Square Cell Aspect Issues](#92-non-square-cell-aspect-issues)
- [9.3 Unreachable Code](#93-unreachable-code)
- [9.4 Stray Property](#94-stray-property)
- [9.5 `roundToDec()` Precision Sensitivity](#95-roundtodec-precision-sensitivity-global)
- [9.6 Bug A — `hasCollinearCorner` False Positive (Misdiagnosed)](#96-bug-a--hascollinearcorner-false-positive-misdiagnosed)
- [9.7 Bug B — Collinear Wrappers with Opposite-Facing Corners](#97-bug-b--collinear-wrappers-with-opposite-facing-corners-unresolved)
- [9.8 Radiant Wrappers Audit](#98-radiant-wrappers-audit-session-3)
- [9.9 Cache Staleness Baseline (WTH Report)](#99-cache-staleness-baseline-wth-report)
- [9.10 Interference Wrappers Audit](#910-interference-wrappers-audit-session-4)
- [9.11 Intershape Regression](#911-intershape-regression)
- [9.12 Adjacent/Intershape Wrappers Audit](#912-adjacentintershape-wrappers-audit-session-5)
- [9.13 Group Mask Pipeline](#913-group-mask-pipeline)
- [9.14 SVG Filter Layout & Mask Cropping Issues](#914-svg-filter-layout--mask-cropping-issues)
  - [9.14.4b Cross-SVG Filter ID Resolution (Safari Risk)](#9144-issue-4-safari-vs-chrome-rendering-percentage-layout)
  - [9.14.6 User-Unit Filter Layout (Implemented)](#9146-user-unit-filter-layout-implemented)
  - [9.14.7 SVG Filter Banding / Quantization (Resolved)](#9147-svg-filter-banding--quantization)
  - [9.14.8 R-in Backgrid Edge White-Out (Resolved)](#9148-r-in-backgrid-edge-white-out-resolved)
  - [9.14.9 R-in Shade Layer Not Centered (Open)](#9149-r-in-shade-layer-not-centered-open)
  - [9.14.10 Viewport-Scale Dependent Shade Calibration (Solved for Now)](#91410-viewport-scale-dependent-shade-calibration-solved-for-now)
  - [9.14.11 Frame/Backgrid R-in Masked SVG BBox Crop (Resolved)](#91411-framebackgrid-r-in-masked-svg-bbox-crop-resolved)
  - [9.14.12 Thin Depth Outline Bug (Resolved)](#91412-thin-depth-outline-bug-resolved)
  - [9.14.13 Thin r-Out Outline Bug (Deferred)](#91413-thin-r-out-outline-bug-deferred)
- [9.15 Performance Optimization Strategy](#915-performance-optimization-strategy)
  - [9.15.1 What Was Sacrificed](#9151-what-was-sacrificed)
  - [9.15.2 Why These Sacrifices Were Necessary](#9152-why-these-sacrifices-were-necessary)
  - [9.15.3 Incremental Re-Optimization Plan](#9153-incremental-re-optimization-plan)
  - [9.15.4 Load Time Optimization](#9154-load-time-optimization-separate-from-animation)
  - [9.15.5 Measurement Baseline](#9155-measurement-baseline-to-do-before-optimizing)
  - [9.15.6 Safari Perf Investigation Apr 28 2026 (canvas-image-swap path)](#9156-safari-perf-investigation-apr-28-2026-canvas-image-swap-path)
- [9.16 ProtoBatch Teardown Completeness (Open)](#916-protobatch-teardown-completeness-open)
- [9.17 Forward-Compat Bets (Anticipated Platform Changes)](#917-forward-compat-bets-anticipated-platform-changes)
- [9.18 Feature Calculation Determinism](#918-feature-calculation-determinism)

> **Note on numbering:** Section numbers are kept as `9.x` to maintain
> compatibility with existing code comments that reference
> `KNOWN-ISSUES § 9.7`, etc. If you see `GEOMETRY-REFERENCE § 9.x` in
> older code comments, they now point here.

---

## 9.1 Chicken-and-Egg Risks

| Risk | Description | Status |
|------|-------------|--------|
| `outWrappers` ↔ `inWrappers` | If A.out = B and B.in = A, this is correct. But if the relationship flips after mutation, stale memos create a cycle. | ⚠️ Audit needed |
| `couldHaveInWrapper` symmetry | A.couldHaveInWrapper(B) should be the logical inverse of B.couldHaveInWrapper(A). Is it? | ⚠️ Audit needed |
| `radiantOutWrappers` → `inWrapper` | The filter references `wrapper.inWrapper?.canRadiateTo(wrapper)`, which triggers the inWrapper chain during outWrapper calculation. | ✅ Safe — `canRadiateTo` only reads topology-stable props (§ 9.8.4) |

---

## 9.2 Non-Square Cell Aspect Issues

The `minAdjWrapperDistanceObj` method has a FIXME noting issues with
non-square cell aspects triggering longer intersect corners.

---

## 9.3 Unreachable Code

In `viableWrappers`:
```javascript
// This line is unreachable — the previous return already exits:
return viables  // ← returned here
return viables  // ← dead code (variable name also wrong)
```

---

## 9.4 Stray Property

```javascript
get isCoinOutWrapper() { return !!this.coinInWrapper }
get isFlushOutWrapper() { return !!this.flushInWrapper }
get isAdjOutWrapper() { return !!this.adjInWrapper } flush  // ← stray 'flush' token
```

---

## 9.5 `roundToDec()` Precision Sensitivity (Global)

`roundToDec(value, decimals)` is used throughout the wrapping system for
floating-point equality checks. The `decimals` parameter is currently
hand-tuned per call site based on bug-fix experience — too few decimals
collapses distinct values into false-equals; too many preserves
floating-point noise that prevents true-equals from matching.

**Root cause:** Different cell sizes produce arc radii and distances at
different scales. A fixed decimal count that works for large cells can
fail for small ones (and vice versa). For example, `wrapState()` at
L2986–2988 uses the default (no explicit decimal arg), which may misclass
equidistant↔diverging for certain cell aspect ratios.

**Proposed fix direction:** Derive the rounding precision from cell size
rather than hard-coding it. Something like:
```
const precision = Math.max(0, Math.floor(-Math.log10(cellSize.min())) + 2)
```
This would scale rounding tolerance with the geometric scale of the grid,
avoiding both false-positive and false-negative equality across cell
configurations.

**Status:** ⚠️ Global refactor needed — every `roundToDec` call site
should be audited once a cell-size-relative strategy is chosen.

---

## 9.6 Bug A — `hasCollinearCorner` False Positive (Misdiagnosed)

**Discovered:** Session 2 (collinear wrapper audit)
**Status:** ❌ **Reverted** — the "fix" broke all collinear detection

**Original diagnosis:** Neighbor-hopping in `hasCollinearCorner` was
thought to cause false positives by attributing collinearity to the
wrong segment.

**What actually happened:** The 4-way neighbor check was correct.
A corner involves TWO segments (the segment and its `endNeighbor`).
Collinearity between two corners can exist through any of four segment
pairs:
1. `this` ∥ `seg` (both primary segments on same line)
2. `this` ∥ `seg.endNeighbor`
3. `this.endNeighbor` ∥ `seg`
4. `this.endNeighbor` ∥ `seg.endNeighbor`

Removing checks 2-4 eliminated ALL collinear wrapper detection except
the rare case where the primary segments happen to be collinear. The
debug overlay confirmed: zero collinear wrappers appeared after the
"fix."

**Resolution:** Restored the original 4-way neighbor check. The code
now matches `hasCoincidentCorner`, which always had the same pattern:
```javascript
hasCollinearCorner(seg) {
  const
    facing = this.hasSameFacingCorner(seg) || this.hasOppositeFacingCorner(seg),
    collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
      || this.endNeighbor.isCollinearWith(seg) || this.endNeighbor.isCollinearWith(seg.endNeighbor),
    sharedCorner = this.end.equals(seg.end, 0)
  return facing && collinear && !sharedCorner
}
```

**Note:** If a genuine false positive exists in collinear detection, it
would need a more surgical fix — perhaps an additional spatial guard
(e.g., requiring the collinear segments to be within `maxArcBounds`
proximity) rather than removing neighbor-hopping entirely.

---

## 9.7 Bug B — Collinear Wrappers with Opposite-Facing Corners (Unresolved)

**Discovered:** Session 2 (collinear wrapper audit)
**Status:** 🟡 In progress — mirrored corner detection implemented (see § 9.7.7)

### 9.7.1 The Bug

**Symptom:** Some geometrically valid collinear wrapper pairs are never
detected because their corners face **opposite** diagonal directions
(e.g., UpRight ↔ DownLeft, corner values 0 ↔ 2). The entire wrapper
pipeline gates on `hasSameFacingCorner` — these pairs are excluded
before any spatial analysis occurs.

**Why this matters:** Two segments can be collinear (sharing an infinite
line) with arcs that should coordinate, but face opposite directions.
Consider:

```
  Shape A                         Shape B
  ──────● (DownRight, corner 1)   ──────● (UpLeft, corner 3)
        │                               │
        │  ← segments are collinear      │
        │                               │
  ──────╯                         ╰──────
```

These corners are diagonal-opposites (1 ↔ 3). They fail
`hasSameFacingCorner` and never enter `viableOutWrappers`. The wrapper
system doesn't know they exist.

**Where the gate is:** `viableOutWrappers` filters candidates through
`hasSameFacingCorner`. Opposite-facing pairs are excluded here. They
also can't enter `viableInWrappers` (same gate). Since both viable pools
require same-facing, opposite-facing collinear pairs are invisible to
the entire wrapping pipeline.

### 9.7.2 Failed Fix Attempt (Reverted)

**Approach:** Added `Corner.opposite` getter (XOR: `value ^ 2` maps
0↔2, 1↔3), a `hasOppositeFacingCorner(seg)` method, widened
`viableOutWrappers` to include opposite-facing collinear segments via
an `oppCollinear` pool, and updated `hasCollinearCorner` to accept
both same-facing and opposite-facing corners.

**What went wrong:**
1. **Naming collision:** The new `hasCollinearCorner` was accidentally
   named `hasOppositeFacingCorner`, creating a duplicate that silently
   overwrote the real one → infinite recursion.
2. **After fixing the name:** Stack overflow persisted. The opposite-
   facing segments injected into `viableOutWrappers` flowed downstream
   into `findFlushDistanceObjs` → `closest()` → `horVertSides`, which
   assumes same-facing geometry. The `Direction` class entered infinite
   recursion (`get angle` → `directOp` → `directions` → `new Direction`
   → `get angle` → ...) when processing these geometrically incompatible
   segments.

**Lesson learned:** You cannot simply widen `viableOutWrappers` to
include opposite-facing segments — the entire downstream pipeline
(`findFlushDistanceObjs`, `intersectObj`, `horVertSides`,
`inOutWrapObjWith`) is built on the same-facing assumption. Opposite-
facing segments produce degenerate geometry in these methods.

### 9.7.3 Deeper Analysis (Session 3)

The same-facing gate isn't just in `viableOutWrappers` — it's
**everywhere**:

| Gate Location | Code | Effect |
|---------------|------|--------|
| `viableOutWrappers` | `hasSameFacingCorner(s)` filter | Blocks entry to viable pool |
| `viableInWrappers` | `hasSameFacingCorner(s)` filter | Blocks entry to viable pool |
| `adjDistanceObjs` | `hasSameFacingCorner(s)` first filter | Blocks adjacent processing |
| `findFlushDistanceObjs` | operates on `viableWrappers` | Never sees them (blocked upstream) |

This means updating `hasCollinearCorner` alone changes nothing —
opposite-facing segments are filtered out before any predicate that
uses `hasCollinearCorner` runs. The fix MUST get them past the
`hasSameFacingCorner` gate somewhere.

**Key geometric question:** What does "wrapping" mean for opposite-
facing collinear corners? Same-facing flush wrapping coordinates arcs
that curve in the SAME direction (shared origin, matching radii).
Opposite-facing arcs curve AWAY from each other. They can't share an
origin. The coordination needed is different: it's a **collision
constraint** — limiting arc radius so the two opposite-curving arcs
don't overlap in the gap between them.

### 9.7.4 Fix Attempt 2 — Failed (Reverted)

**Strategy:** Targeted `viableOutWrappers` widening with safe guards.

Used `this.grid.allSimpleSubShapesSegs` (already materialized, unlike
attempt 1's `andNeighborSimples`), guarded `horVertSides` access in
`findFlushDistanceObjs.closest()` with null checks. Added
`hasOppositeFacingCorner(seg)` as a standalone one-liner method.
Updated `hasCollinearCorner` to accept opposite-facing.

**Result:** Same stack overflow. `RangeError: Maximum call stack
size exceeded` at ProtoUtility.js:131 (Direction.directions), same
recursion path (moveCoord → directOp → directions → angle → directOp
→ ...), same trigger point (maximizeCuddles with 34 ProtoSegments).

**Analysis:** The crash occurs NOT in the `oppCollinear` filter itself
(which is just `isCollinearWith` → `isOverlappingWith({infinite:true})`
→ `isParallelTo` → vector math, no Direction involved), but LATER when
`maximizeCuddles` lazily evaluates properties on segments that now have
opposite-facing entries in their memoized `viableOutWrappers`. The
downstream pipeline (`viableWrappers` → sort by `minArcOrigin.dist()`,
`findFlushDistanceObjs` → `closest()`, `intersectObj` →
`perpendicularIntersectionWith` → `this.direction.toLeft.lineVector`)
eventually invokes Direction methods on geometry the pipeline was never
designed to handle.

**Conclusion:** Widening `viableOutWrappers` is a dead end. Two
attempts with two different pool sources and different guard strategies
produce the same crash. The flush pipeline is structurally incompatible
with opposite-facing segments.

### 9.7.5 What Survived (Still in Code)

The following changes from attempts 1-2 are **retained** because they
are independently correct and cause no harm:

| Change | Location | Status |
|--------|----------|--------|
| `Corner.opposite` getter | ProtoUtility.js L625 | ✅ Tested in testMess.js |
| `hasOppositeFacingCorner(seg)` | drawAsSVG.js L2325 | ✅ One-liner, no pipeline impact |
| `hasCollinearCorner` accepts opposite-facing | drawAsSVG.js L2337 | ✅ Harmless — opposite-facing segments never reach callers |
| `horVertSides` null guards in `closest()` | drawAsSVG.js L2435-2439 | ✅ Defensive improvement |
| `intersectObj` null guard | drawAsSVG.js L2528 | ✅ Defensive improvement |
| `flushIntersectObjs` undefined filter | drawAsSVG.js L2457 | ✅ Defensive improvement |

### 9.7.6 Next Direction: Separate Constraint System

The key insight from § 9.7.3 still holds: opposite-facing collinear
pairs aren't "wrappers" in the same geometric sense. They don't share
arc origins or coordinate curvature. They're a **collision constraint**
— two arcs curving away from each other that must not overlap.

**Proposed approach:** Don't fix Bug B through the wrapper pipeline.
Instead, create an independent collision-detection pass that:
1. Finds opposite-facing collinear pairs (using `hasOppositeFacingCorner`
   + `isCollinearWith`)
2. Computes the gap between their arc endpoints
3. If arcs would overlap, constrains the larger arc's radius

This would run as a separate step in `maximizeCuddles`, after flush/adj
wrapping is complete, as a cleanup pass. It never injects opposite-
facing segments into `viableOutWrappers`.

**Status:** 🔲 Superseded by § 9.7.7.

### 9.7.7 Fix Attempt 3 — Mirrored Corner Detection (Bypass Approach)

**Key insight:** Two opposite-facing collinear corners can be either
**mirrored** (meeting end-to-end at shared vertices, NOT wrappable) or
**wrapping** (one segment overlaps inside the other, IS wrappable).
Both cases share: `isOverlapping(includeEnds) = TRUE`, opposite
directions, and collinearity. The distinguishing factor is whether the
corner's segment pairs share start/end vertices.

```
  WRAPPED (wrappable):                NOT WRAPPED (mirrored):
  seg A overlaps inside seg B         seg A meets seg B end-to-end

  A ████████████►                     A ████████►
  B ◄████████████████████             B         ◄████████████
     ↑ A.start is INSIDE B              ↑ A.end === B.start
```

**Detection method — `isMirroredCorner(seg)`:**

A corner involves 4 segments: `this` (A1), `this.endNeighbor` (A2),
`seg` (B1), `seg.endNeighbor` (B2). Check all 4 inter-corner pairings
for collinearity. For each collinear pair, check `isEndToEnd`. If ALL
collinear pairs are end-to-end, the corners are mirrored (shared vertex
line) and NOT wrappable.

This uses only:
- `isCollinearWith` → `isOverlappingWith({infinite:true})` → vector math
- `isEndToEnd` → vertex equality
- No Direction class involvement → no recursion risk

**Precedent:** The old `findcoincidentWrapper` in Unused.js (L356-412)
handled this via `wrapDir = outWrap ? segDir.opposites : segDir` and
`!seg[oppTurn].equals(s[oppTurn], 0)` (vertex equality exclusion). That
capability was lost when the wrapper system was refactored from Grid
methods to ProtoSegment methods.

**Strategy — bypass `viableOutWrappers`:**

Attempts 1-2 (§ 9.7.2, 9.7.4) proved that injecting opposite-facing
segments into `viableOutWrappers` crashes the downstream flush pipeline
(`findFlushDistanceObjs` → `intersectObj` → `perpendicularIntersectionWith`
→ `Direction.toLeft` → stack overflow). The pipeline is structurally
incompatible with opposite-facing geometry.

Instead, `oppFacingCollinearSegs` uses `overlapSegs` (which has **no**
same-facing gate) as its pool, filters for opposite-facing + collinear
+ not mirrored, completely bypassing the flush pipeline.

**What's implemented:**

| Change | Location | Purpose |
|--------|----------|--------|
| `isMirroredCorner(seg)` | drawAsSVG.js (ProtoSegment) | Returns true if corner segment pairs are all end-to-end (not wrappable) |
| `oppFacingCollinearSegs` | drawAsSVG.js (ProtoSegment) | Finds wrappable opposite-facing collinear segments via overlapSegs |

**Status:** ✅ Detection implemented. Wrapping action not yet wired
(requires understanding what "wrapping" means for opposite-facing arcs
— see § 9.7.3 on collision constraints).

---

## 9.8 Radiant Wrappers Audit (Session 3)

**Status:** ✅ Audited — no bugs found.

### 9.8.1 Detection Pipeline

`canRadiateTo(seg)` is the foundation — requires:
1. `viableArcOriginsSeg` overlap (segments' possible arc origins share
   a range), AND
2. `hasDiagonalCorner(seg)` (same-facing + `maxArcBoundsSeg` collinear)

`radiantOutWrappers` chains outward from innerMost:
- `filterRadiants()` walks `outWrappers` in order, requiring each
  wrapper to `canRadiateTo(this)` AND the wrapper's own
  `inWrapper?.canRadiateTo(wrapper)` — chain breaks at first failure.
- Three entry branches: innerMost+radiant, not-innerMost+inCanRadiate,
  not-innerMost+outIsRadiant.

`radiantInWrappers` chains inward recursively.

### 9.8.2 Resolution Pipeline

`#setRadiantOrigin(vert)` propagates a single arc origin to all
`radiantOutWrappers` via `#setCurveOrigin`. At the chain boundary
(last radiant → non-radiant outWrapper), it calls `flushWrap(true)`
or `adjWrap(true)` to coordinate the transition.

`wrapInnerMost()` (Grid.js L815) is the opinion layer:
- Filters for `isInnerMostWrapper && isInnerMostRadiantWrapper && !hasArc`
- Sorts by `maxArcRadius` ascending (tightest first)
- Then stable-sorts by `radiantOutWrappers.length` descending
  (**most radiant potential wins**)
- Coincident-only pairs (length ≤ 1 with coinOutWrapper) are filtered
  out — handled by flushWrap instead.

### 9.8.3 Priority Example (Observed)

Test hash produced 6 shapes with 4 radiant clusters. At one location,
a 4-corner chain (2 coincident pairs across a cell) competed with a
3-corner chain (1 coincident pair + 1 adjacent diagonal). The 4-chain
won priority via the `radiantOutWrappers.length` sort, was processed
first, and its segments gained arcs (`hasArc = true`). The 3-chain's
shared segments were then filtered out, correctly blocking incomplete
radiance.

### 9.8.4 Potential Cycle Zones

`radiantOutWrappers` → `filterRadiants` accesses
`wrapper.inWrapper?.canRadiateTo(wrapper)`, triggering `inWrapper`
resolution during outWrapper calculation. This is flagged in § 9.1
as "⚠️ Audit needed". In practice, it's safe because `canRadiateTo`
only reads `viableArcOriginsSeg` (topology-stable) and
`hasDiagonalCorner` (topology-stable). No arc-volatile properties
are involved in the detection path.

**Edge cases resolved in interference audit (§ 9.10):**
- Opposing radiant stacks constraining each other → § 9.10.1
- `viableInterferenceOrigins` calculation → § 9.10.2
- `wrapInterferenceCorners` priority/ordering → § 9.10.3
- Visual analysis of both test hashes (with/without) → § 9.10.6

---

## 9.10 Interference Wrappers Audit (Session 4)

**Status:** ⚠️ Audited — multiple issues found. No code changes made.

### 9.10.1 Detection: `interferenceWrappers` (drawAsSVG.js L2916)

**Entry conditions** (all required):
1. `this.isInnerMostRadiantWrapper` — only innermost radiant wrappers detect
2. `this.radiantOutWrappers?.length > 1` — must have a real radiant stack (2+)

**Search logic:**
- Walks `this.outerMostRadiantWrapper.neighborsArray` (start+end neighbors
  of the chain's outermost segment)
- Filters for opposite-facing segments (`arcNormalDirection.opposites`)
  that are themselves radiant (innerMost, outerMost, or coin-linked)
- Maps through coin wrappers to resolve to the correct innerMost/outerMost
- Splits into `{ start, end }` based on `maxArcBoundsSeg.vertOrientation`

**Issue A — Limited detection radius:**
`neighborsArray` is only 2 elements (start+end of outerMost). Interference
detection only finds opposing stacks **directly adjacent** to the outermost
radiant wrapper. Opposing stacks separated by any gap are invisible.

**Issue B — `hasDoubleInterference` null crash risk:**
`hasDoubleInterference` accesses `this.interferenceWrappers.start` without
checking `hasInterference` first. If `interferenceWrappers` returns
`undefined`, this throws `TypeError`. In practice safe (callers filter
by `hasInterference` first) but the getter is not defensively guarded.

**Issue C — Not memoized, reads stale-risk props:**
`interferenceWrappers` has no `memoize()` call. Computed fresh each
access, but reads `radiantOutWrappers` (arc-volatile, NOT in
`#resetMemoProps` — see § 9.9.3). If `radiantOutWrappers` has stale
data, the result will be wrong.

### 9.10.2 Resolution: `viableInterferenceOrigins` (drawAsSVG.js L2945)

**Logic:** For each interference corner (start/end), copies its
`viableArcOriginsSeg.bounds` then **zeroes out half** (x-axis for
vertical segments, y-axis for horizontal), relaxing them to allow
any position along one axis. Filters viable origins against relaxed
bounds. If both start+end produce results, returns their intersection.

**Issue D — Hardcoded canvas dimensions:**
Bounds-zeroing uses `xMax: 100` and `yMax: 200` — hardcoded assumptions
about canvas size. If canvas dimensions change, these silently break.

**Issue E — Memoization commented out:**
The `memoize()` wrapper is commented out:
```javascript
// return memoize(() => {
...
// }, `viableInterferenceOrigins`).call(this)
```
No cache staleness risk here, but repeated access evaluates the full
filter chain each time.

**Issue F — Axis-relaxation coupling:**
The `isStart === this.isOutsideCorner` ternary selects which segment
(`this` vs `this.endNeighbor`) determines the vertical/horizontal axis
relaxation. This compact coupling makes the directional logic hard to
verify from code alone — needs visual testing.

### 9.10.3 Pipeline: `wrapInterferenceCorners()` (Grid.js L686-811)

**Pool construction (L687-694):**
```
defaultPool
  .filter(s => s.hasInterference && !s.isMinCorner)
  .sort(maxArcRadius ascending)
  .sort(radiantOutWrappers.length descending)
  .sort(hasDoubleInterference descending)
```
Priority: double-interference first → longest chain → tightest radius.

**Duplicate removal (`removeDuplicates`, L709-738):**
Finds cross-referenced pairs (A interferes with B, B interferes with A)
and keeps only the first occurrence.

**Issue G — `removeDuplicates` loop bug:**
The `while (reducePool.length > 0)` loop consumes `reducePool` via
`shift()` but never refills it. After the first dupe is processed,
`reducePool` is empty and `dupes.forEach` skips all subsequent dupes.
This means only the **first** cross-referenced pair is correctly
de-duplicated; additional pairs are silently ignored.

**Wrapping action (L740-811):**
- Gets `viableInterferenceOrigins` for each segment
- Prefers shape center if `preserveQuads && isEdgeOfQuad`
- Otherwise uses `viables.last` (furthest viable origin)
- Guard: `outerMostRadiantWrapper.canCurveTo(origin, true)` only
- Calls `setEndRadiantOutWrapsOrigin(origin)` to propagate through chain
- For each interference corner, `setCurve()` projects a perpendicular
  from origin onto the interference wrapper's `maxArcBoundsSeg`

**Issue H — Commented-out interference guard:**
The additional guard is commented out:
```javascript
// && Object.values(s.interferenceWrappers).every(i => i.canCurveTo(origin, true))
```
Interference wrappers are NOT checked for whether they can actually
curve to the chosen origin. Only the wrapped segment's own
`outerMostRadiantWrapper` is validated.

**Issue I — `setCurve` direction coupling:**
The `setCurve` inner function uses `s.direction` (the *wrapped*
segment's direction) not the *interference wrapper's* direction to
determine the perpendicular projection. This couples the geometry
calculation to the detecting segment's orientation.

### 9.10.4 Cache Impact

All cache invalidation within the interference pipeline flows through
`setEndRadiantOutWrapsOrigin` → `#setRadiantOrigin` → `#setCurveOrigin`
→ `#addCubicVert` → `#resetMemoProps`. The 19-key reset applies, but
the 29 uncovered volatile keys (§ 9.9.3) remain stale through
interference processing — same baseline gap.

### 9.10.5 Issue Summary

| Issue | Severity | Description |
|-------|----------|-------------|
| A | ⚠️ Design limit | Detection limited to directly adjacent opposing stacks |
| B | 🟡 Latent crash | `hasDoubleInterference` unguarded null access |
| C | 🟡 Stale risk | `interferenceWrappers` reads stale-risk `radiantOutWrappers` |
| D | 🟡 Fragile | Hardcoded canvas dimensions (100×200) in bounds |
| E | ℹ️ Perf note | `viableInterferenceOrigins` memoization commented out |
| F | ℹ️ Review | Axis-relaxation direction coupling — needs visual test |
| G | 🔴 Logic bug | `removeDuplicates` loop only processes first dupe |
| H | ⚠️ Missing guard | Interference wrappers not checked for `canCurveTo` |
| I | ℹ️ Review | `setCurve` direction derived from wrapped seg, not wrapper |

### 9.10.6 Visual Analysis

Two golden test hashes exercise the interference pipeline:

**`interference_02`** — Multi-shape interference (shp000, shp001, shp011,
plus many intermediates). Opposing radiant stacks from shp001 (left) and
shp011 (right) sandwich ~4 intermediate bands. With interference ON: all
bands sweep as harmonic parallel arcs sharing a concentric origin. With
interference OFF: root shapes retain their curvature but intermediate
bands lose coherence — the third band visibly "wobbles" because each
segment follows its own default radiant origin independently.

**`interference_01`** — Single-intermediate interference (3 shapes:
shp000, shp001, shp002 with only 1 intermediate band between opposing
stacks). Initially appeared too simple to trigger interference, but
console verification confirmed it fires:
```
GRID.allSimpleSubShapesSegs.filter(s => s.hasInterference).map(s => s.id)
// → ['shp000-3down-cel014-rightSide-to-cel022-rightSide']
```
The `radiantOutWrappers.length > 1` gate counts **wrapper layers**
(segments wrapping a corner), not intermediate shapes — shp002 provides
multiple wrapping segments around shp000's corner, satisfying the gate.
With interference OFF, shp000's right side loses harmonic alignment with
the opposing stacks from shp002 (above) and shp001 (below). The effect
is subtler than interference_02 since there's only one intermediate band
to correct, but still visibly improves output quality.

**Key insight from Issue F:** The axis-relaxation coupling
(`isStart === this.isOutsideCorner`) was validated visually — both test
cases show correct directional behavior for their respective
vertical/horizontal orientations. Issue F remains a readability concern
but is functionally correct in tested cases.

WTH report for interference_01 (20 segments, 11 stale) shows the same
29-key gap pattern as the baseline (§ 9.9), confirming no
interference-specific cache regression.

---

## 9.9 Cache Staleness Baseline (WTH Report)

**Status:** ⚠️ Documented — 29 volatile keys are not reset.
**Source:** WrapperTestHarness auto-run on hash #1428 (default
`testingControls.hashNumber`). See TESTING § 2.7 for full breakdown.

### 9.9.1 The Gap

`#resetMemoProps` clears **19** of the **48** arc-volatile keys.
The remaining **29** volatile keys survive arc mutations and can
serve stale data. The 14 topology-stable keys are correctly excluded
from reset.

| Set | Count | Status |
|-----|-------|--------|
| Total memoized keys | 62 | — |
| Arc-volatile keys | 48 | — |
| Keys in `#resetMemoProps` | 19 | ✅ Reset on mutation |
| Volatile NOT in reset | 29 | ⚠️ Stale risk |
| Topology-stable keys | 14 | ✅ Safe to keep |

### 9.9.2 What IS Reset (19 Keys)

The 19 keys in `#resetMemoProps` cover core arc geometry and
direct wrapper identity:

`adjDistanceObjs`, `adjWrapperObjsFinal`, `arcCenterTangent`,
`arcCenterVert`, `arcOrigin`, `arcOriginCorner`, `arcOriginToStart`,
`arcOriginToNormal`, `arcOriginToEnd`, `arcOriginToArcCenter`,
`arcRadius`, `flatAmount`, `hasNoFlatness`, `hasCompleteStartCorner`,
`hasCompleteEndCorner`, `inWrappers`, `outWrappers`,
`outWrapsOfThisShapeAndNeighbors`, `overlapSegs`.

### 9.9.3 What is NOT Reset (29 Keys)

Grouped by concern:

**Wrapper lists** (10):
`hasNoWrappers`, `inOutAdjWrappers`, `inOutFlushWrappers`,
`isInnerMostRadiantWrapper`, `isInnerMostWrapper`,
`radiantInWrappers`, `radiantOutWrappers`, `viableInWrappers`,
`viableOutWrappers`, `viableWrappers`

**Viable origins** (8):
`viableAdjWrapOrigins`, `viableArcOrigins`, `viableArcOriginsSeg`,
`viableCoinWrapOriginBounds`, `viableCoinWrapOrigins`,
`viableOutWrapOriginBounds`, `viableRadiantOriginBounds`,
`viableRadiantOrigins`

**Bounds / derived geometry** (7):
`cornerVerts`, `maxArcBounds`, `maxArcBoundsSeg`, `maxArcOrigin`,
`maxArcRadius`, `middleArcOrigin`, `minArcBounds`, `minArcBoundsSeg`,
`minArcOrigin`, `minArcRadius`, `shapesWithinThisMaxArcBounds`

### 9.9.4 Stale Test Results

16 of 48 segments flagged stale caches. All 16 were triggered by
`setArcToMiddle` — not by `flushWrap` or `adjWrap` (those mutations
call `resetMemoized()` internally, clearing the 19 core keys, and
the harness detects no further staleness from them).

Each failing segment showed:
- **42 stale keys on self** (the 29 uncovered volatile + 13 that
  were reset then re-cached between mutation and snapshot)
- **42–46 stale keys on neighboring segments** — neighbors sometimes
  show 4 additional arc-geometry keys (`arcCenterVert`, `arcOrigin`,
  `arcOriginToStart`, `arcOriginToArcCenter`) proving the neighbor's
  cache was NOT invalidated by the mutated segment's `setArcToMiddle`

### 9.9.5 Practical Impact

During `maximizeCuddles()`, the pipeline calls `setArcToMiddle`,
`flushWrap`, and `adjWrap` in sequence. In practice the ordering
may mask some staleness — later mutations re-trigger getters,
effectively refreshing stale values. But any pipeline reordering
or new getter access between mutations could expose the stale data.

This is the root cause motivating ARCHITECTURE § 10.2.5 and the
Unified Wrapper Funnel proposal.

---

## 9.11 Intershape Regression

**Status:** ✅ Fixed (Phase 1) — intershapes restored. Masking rebuild pending.

### 9.11.1 Background

"Intershapes" are shapes that sit inside other shapes, created when the
pipeline recalculates and splits a parent shape's cells into multiple
smaller child shapes. This is the `recalcdCells → newIslands` path in
`Island.createSubIslands()` (ProtoLayerObjects.js ~L2745).

Intershapes last worked in a pre-Sept 2025 codebase state. The exact
last-working commit is uncertain due to messy rollbacks, but commit
`e396f61` (pre-Sept 22) had a `svg` getter that always returned a
value (even empty string), preventing construction crashes. The
regression persisted through subsequent rollbacks and re-application
of changes because the `svg` getter was never fully restored.

### 9.11.2 Root Cause

Commit `974bbc5` (Nov 4, 2025) added this line to the Shape constructor
(~L2997):

```javascript
if (shptype === `PerimeterShape`) this.createSimpleSubShapes()
```

This calls `createSimpleSubShapes()` on PerimeterShapes **during
construction** — before the island/layer hierarchy is fully built.
When `cutIslands` later calls `createSubIslands → recalcdCells →
newIslands`, the parent shape already has `simpleSubShapes` populated,
and the intershape pipeline either skips creation or crashes because
the parent geometry was already finalized.

### 9.11.3 Additional Regression: `svg` Getter

The `svg` getter went through three states:

**Pre-masking (`e396f61` and earlier — working):**
```javascript
get svg() {
  let result = this.insetSubShapes.map(e => SVGPath.fromProtoSegPath({ segPath: e }))
  if (result instanceof Array) result = result.join(' ')
  return result  // always returns — empty string for empty arrays
}
```
This version bypasses `simpleInsetSegPaths` entirely, maps
`insetSubShapes` directly through `fromProtoSegPath`, and always
returns a value. An empty `insetSubShapes` produces `""` (safe for
SVG `d` attribute — renders nothing).

**Sept 22 (`3c2ae52`) and later — already fragile:**
```javascript
get svg() { if (this.simpleInsetSegPaths) return SVGPath.fromSegPaths(this.simpleInsetSegPaths) }
```
The `if` check is truthy for empty `OpArray`/`Array` objects, so
empty paths pass the gate → `fromSegPaths([])` → invalid SVG →
`createSVGElt` returns null → `.addToClassList()` crashes. This was
likely masked in Sept 22 by pipeline ordering (shapes without
`simpleSubShapes` may not have hit this path on working hashes).

**`974bbc5` (Nov 4) — explicit crash:**
```javascript
get svg() {
  const paths = this.simpleInsetSegPaths ? this.simpleInsetSegPaths : this.simpleSegPaths
  const result = SVGPath.fromSegPaths(paths)
  if (this.simpleInsetSegPaths) return result
}
```
Computes path but gates return on `simpleInsetSegPaths` — same
truthy-empty-array problem, plus PerimeterShapes compute from
`simpleSegPaths` fallback but never return the result.

### 9.11.4 BrokenFuture Branch State

BrokenFuture (`685ab58`) represents the "furthest forward" attempt at
masking. Key changes vs. Sept 22 working state:

| Area | Sept 22 (working) | BrokenFuture |
|------|-------------------|---------------|
| Shape constructor | No `createSimpleSubShapes` call | No `createSimpleSubShapes` call |
| `svg` getter | `fromSegPaths(simpleInsetSegPaths)` | Branches: PerimeterShape → `simpleSegPaths`, others → `simpleInsetSegPaths`, maps through `fromProtoSegPath` individually |
| `maskShape` | Unmemoized, returns single `SegPath` | Memoized, returns `SegPath[]` |
| `maskSVG` | `fromSegPaths(this.maskShape)` | Memoized, maps each path through `fromProtoSegPath` |
| Frame inner mask | Commented out | Uncommented — second `cutIslands` + SVG `<mask>` cloning |
| `createMaskGroup` | Exists, commented out at call sites | Exists, commented out at call sites |

Notably, BrokenFuture did NOT add `createSimpleSubShapes` to the
constructor — that was added later in `974bbc5`. The masking code in
BrokenFuture may have had other issues but did not contain the
intershape blocker.

### 9.11.5 Restoration Plan

See ROADMAP § 2 Phase C (revised) for the implementation plan.

**Phase 1 — Restore intershapes (minimal, safe):** ✅ Done
1. ✅ Removed `createSimpleSubShapes()` from Shape constructor (~L2997)
2. ✅ Fixed `svg` getter: `paths?.length` check instead of truthy test
3. ✅ Added early return in `Shape.assignElement()` when `this.svg` is
   falsy — shapes without paths yet (PerimeterShapes, intershape
   parents) skip element creation safely; paths are assigned later
   by the pipeline
4. Test: intershapes now produce again ✅

**Phase 2 — Rebuild masking (on working intershapes):**
4. Port `maskShape` from BrokenFuture (memoized, returns `SegPath[]`)
5. Port `maskSVG` from BrokenFuture (memoized, per-path mapping)
6. Port `svg` getter from BrokenFuture (PerimeterShape branching)
7. Re-enable `createMaskGroup()` at call sites
8. Uncomment Frame inner mask in `setBackGridGroup`

**Phase 3 — Validate:**
9. Test intershape-producing hashes
10. Test masking on R-profile cuts
11. Add `intershape` entry to WRAPPER_TEST_CASES

### 9.11.6 Git Archaeology

| Commit | Date | Description | Intershapes? |
|--------|------|-------------|-------------|
| `3c2ae52` | Sept 22, 2025 | Last known "working" state | ⚠️ `svg` getter already fragile (truthy empty array) |
| `685ab58` | Sept 25, 2025 | BrokenFuture tip — masking WIP | ⚠️ Unknown (masking issues, but no constructor blocker) |
| `8f88a5b` | Oct 2025 | "Regress to previous state" | ✅ Rolled back |
| `3c2ae52` (re) | Oct 2025 | "Regress to Sept 22nd state" | ✅ Rolled back |
| `fd1e59a` | Nov 2025 | SVGPath refactor | ⚠️ Possibly still working |
| `974bbc5` | Nov 4, 2025 | **Shape constructor + svg change** | 🔴 **Broken here** |
| `5ff17d8` | Nov 2025 | Main tip (testing update) | 🔴 Still broken |

### 9.11.7 Actual Fix (Phase 1)

Three changes to ProtoLayerObjects.js:

**1. Shape constructor (~L2997):** Commented out premature call.
```javascript
// if (shptype === `PerimeterShape`) this.createSimpleSubShapes()
// REMOVED: broke intershapes — see KNOWN-ISSUES § 9.11
```

**2. `svg` getter (~L3262):** Length check instead of truthy test.
```javascript
get svg() {
  const paths = this.simpleInsetSegPaths
  if (paths?.length) return SVGPath.fromSegPaths(paths)
}
```
Empty arrays no longer pass the gate. `undefined` and `[]` both
correctly return `undefined` → no SVG path → shapes skip rendering
until the pipeline populates their `simpleSubShapes`.

**3. `Shape.assignElement()` (~L3323):** Early return guard.
```javascript
assignElement() {
  super.assignElement()
  if (!this.svg) return  // no SVG path yet — intershapes get theirs later
  this.path = createSVGElt('path')
    .attribute('d', this.svg)
    ...
}
```
Prevents the `createSVGElt('path').attribute('d', undefined)` → null
→ `.addToClassList()` crash. Shapes without paths at construction
time are safe — they get paths assigned when `createSimpleSubShapes()`
is called later by the pipeline.

**Key insight for Phase 2 (masking):** The pre-masking `svg` getter
(`e396f61`) used `insetSubShapes` directly with `fromProtoSegPath`,
not `simpleInsetSegPaths` with `fromSegPaths`. BrokenFuture's approach
of branching on `isPerimeterShape` and mapping through `fromProtoSegPath`
individually is closer to the original working pattern. When rebuilding
masking, the `svg` getter should:
- Branch on `isPerimeterShape` vs regular Shape
- Use `fromProtoSegPath` per-path (not `fromSegPaths` which joins)
- Always return a value (even `""`) to avoid construction crashes
- OR keep the `assignElement` guard and accept `undefined` returns

---

## 9.12 Adjacent/Intershape Wrappers Audit (Session 5)

**Status:** 🟡 In progress — code traced, adjacent wrappers confirmed active in `intershape_3`

**Test hash:** `intershape_3` (`0x97f9...f57f4a`) — most representative

> **Visual note:** Adjacent (green) markers were initially believed absent in the overlay
> screenshot. They are present but were hidden behind the radiant (orange) lines because
> `_drawRadiantConnections` was called *after* `_drawConnections`, painting orange on top of
> green. Fixed in overlay v2: radiant is now drawn first (solid, bottommost layer) and all
> flush/adjacent connections draw above it with `1 1` equal dashes so the radiant layer shows
> through the gaps.

### 9.12.1 Adjacent Detection Pipeline

Adjacent wrapping handles corners that face the same direction but
don’t share a coincident or collinear relationship. The detection
chain lives in drawAsSVG.js:

```
adjDistanceObjs (L2567)
  │  viableWrappers = viableOutWrappers ∪ viableInWrappers
  │    .filter(sameFacing && !coincident && !collinear
  │            && canHaveCorrectBounds && canHaveCorrectSize)
  │    .map(minAdjWrapperDistanceObj).flat()
  │    .sort(dist).sort(tangDist)
  ▼
adjIntersectObjs (L2593)
  │  filter to matching tangDist+dist
  │  inOutSorted() — sort by in/out wrapper status
  │  .map(intersectObj) — perpendicular projection
  ▼
adjWrapperObjsFinal (L2635)
  │  filter to matching dist
  ▼
adjacentWrapper = adjWrappersFinal[0]
```

### 9.12.11 Recent adj/adjacent wrap regression (Mar 17, 2026)

**Status:** 🟡 Investigating — requires a focused debug session (multi-hour)

Summary of what was observed:
- An attempted quick fix that clamped `obj.dist` to `source.arcRadius` in `#wrap()` (proximal branch) was applied then reverted because it broke many valid wraps. Do not reapply this change.
- The immediate failing case was caused by misclassification upstream: `wrapState()` (proximal branch) treated very large intersection distances as `EQUIDISTANT` (return 0) instead of `DIVERGING` (return 1). Because `fixBadAdjWraps()` filters on diverging/converging states, that case was skipped.
- A candidate-filtering attempt (checking for intervening same-facing corners) was experimented with in `adjIntersectObjs()` and then moved to `adjacentWrapper()` to reduce collateral filtering. Both placements had trade-offs: early filtering removed valid candidates needed for ordering/coincident handling; late filtering created undefined `adjacentWrapper` in some cases. More nuanced rules are needed.
- The issue appears in both non-square and square aspect hashes (see failures below), so multiple interacting issues likely exist.

Repro identifiers (use these when reproducing):
- Target segment (broken-case example): `shp032-12down-cel054-rightSide-to-cel153-rightSide`
- Interacting segments: `shp025-4down-cel093-rightSide-to-cel120-rightSide`, `shp015-2left-cel122-downSide-to-cel121-downSide` (the latter calls `replaceEndRadiantOutWrapsOrigin()` in Grid.js L1007)
- Square-aspect failing hash found during testing: `0x3f81c13fd6cfd2c38d603067cb273df497c0654690fb8b1768ef416cf0163346`

Recommended next steps (conservative):
1. Reproduce the failing hash(s) in the harness and capture `WrapperDebugOverlay.adjDebug()` output for the segments above.
2. Add a small unit check that asserts `wrapState()` behaves as expected for proximal cases (explicitly test `obj.dist` <, ==, and > `outer.arcRadius`). Use strict rounding rules consistent with existing `roundToDec` usage.
3. Prefer classification/candidate-selection fixes (wrapState, adjIntersectObjs/adjacentWrapper validations) over changing `#wrap()` behaviour which is shared by flush/adj flows.
4. If classification fixes cause regressions, instrument `fixBadAdjWraps()` to trace decision branches for problematic segments; avoid sweeping changes without targeted tests.
5. Schedule a dedicated full-day audit: trace failing hash end-to-end, snapshot memo keys before/after each `fixIssues()` stage, and record failing commits.

Notes for future reference:
- Keep any experimental edits isolated and clearly labeled; document the commit/hash for each attempt. Re-enable memoization only after `arcVolatileKeys` are correctly listed in `#resetMemoProps`.


### 9.12.2 Key Methods

**`minAdjWrapperDistanceObj(seg)`** (L2523)
- Determines in/out wrappers via `couldHaveInWrapper(seg)`
- Calculates horizontal and vertical side distances
- Computes `arcCenterMidPointTangent` from inWrapper
- Finds `tangentIntersect` — where tangent crosses outWrapper
- Returns `{seg, tang, tangX, tangDist, dist, isStart}` objects
- Selection logic: if same in/out-corner parity → picks larger
  dist; if different → picks smaller dist

**`intersectObj(seg, isStart)`** (L2555)
- Projects inWrapper’s `arcOrigin` perpendicularly onto outWrapper
  (or its `endNeighbor` if isStart)
- Falls back to `minArcOrigin` if `arcOrigin` projection fails
- Returns `{seg, dist, intersect, isStart}` or `undefined`
- **FIXME in code:** `side` assignment “seems opposite?” — the
  isStart/false mapping may be inverted

**`couldHaveInWrapper(seg)`** (L2367)
- For coincident corners: compares shape bounds, or checks
  outside/inside corner status
- For non-coincident: `seg.minArcIsWithinThatMaxArc(this)`
- This determines the wrap direction (inner adopts outer’s arc)

### 9.12.3 `#wrap()` Resolution (L2660)

Both `flushWrap()` and `adjWrap()` delegate to `#wrap(flush, replace, wrapOut)`.

The method branches on:
1. **Diagonal (coincident/concentric)** corners:
   - If non-equidistant or forced: `target.replaceEndCurveOrigin(source.arcOrigin)`
   - Otherwise: `target.setEndCurveOrigin(source.arcOrigin)`
2. **Non-diagonal (collinear/proximal)** corners:
   - Gets `adjIntersectObjs[0]` or `flushIntersectObjs[0]`
   - If `obj.dist <= target.maxArcRadius`: `addDistancedEndCornerVerts(dist, true)`
   - Otherwise: `replaceEndCurveOrigin(currentMaxArcOrigin)`
3. **No arc yet:** assigns `viableAdjWrapOrigins.last` to both wrappers

### 9.12.4 `fixIssues()` Execution Order (Grid.js L1477)

```
fixIssues()
  1. wrapInterferenceCorners()     — mode 0 only
  2. wrapInnerMost()               — mode 0 only
  3. curveMinRadiusCorners()
  4. completeEnds()
  5. fixBadAdjWraps()              ← primary adj fix
  6. fixBadFlushWraps()            ← also triggers fixBadAdjWraps internally
  7. fixLoosies()                  ← can curve more, triggers flush/adj
```

**`fixBadAdjWraps`** (L888): Filters for `isAdjOutWrapper &&
(adjWrapIsDiverging || adjWrapIsConverging)`, then either:
- `wrapOutFix()` — re-adjWrap the inWrapper with replace=true
- `wrapInFix()` — adjWrap self with replace=true

Selection depends on:
- `isOutWrappedToRadiants` → special radiant-aware path
- Converging → prefer curve-outer-less or curve-inner-more
- Diverging → prefer curve-outer-more or curve-inner-less

### 9.12.5 Intershape-Specific Differences

Intershapes (created by `createSubIslands → newIslands()`) exercise
the same wrapper pipeline with key differences:

1. **`viableInWrappers` (L2402)** checks `grid.isBackGrid` — if true,
   uses `frontGrid.allSimpleSubShapesSegs` instead of `shapesWithinThisMaxArcBounds`.
   Normal shapes use their own enclosed/bounds cells.

2. **`viableOutWrappers` (L2415)** checks `grid.isFull` — if full
   grid, uses `andNeighborSameFacingCorners` (fast path); otherwise
   scans `allSimpleSubShapesSegs`.

3. **`completeEnds(simples, false)`** is called on intershape segs
   after creation (L2712), with `wrapOut=false` — this means intershape
   corners adopt the parent shape’s curvature, not vice versa.

4. **`canHaveCorrectBounds`** (L2571) — for shapes with no neighbors
   (common for intershapes), uses the looser
   `minArcIsWithinThatCornerBounds` test.

5. **`canHaveCorrectSize`** (L2576) — outside corners need
   `maxArcRadius > cellRadius`; inside corners need
   `cellRadius < seg.maxArcRadius`. This can fail for intershapes
   that are very small relative to enclosing shape.

### 9.12.6 Known FIXMEs in Adjacent Pipeline

| Location | FIXME | Risk |
|----------|-------|------|
| L2524 | “issues with non-square cell aspects triggering longer intersect corners” | 🟡 Medium — aspect-dependent geometry bugs (see § 9.2) |
| L2525 | “all wrappers should be wrapped in one object, using tangX to choose” | 🔵 Low — design note for unified funnel (ARCHITECTURE § 11) |
| L2558 | `side` assignment “seems opposite?” (isStart/endNeighbor mapping) | 🟠 Potential — may cause wrong projection for start-side intersections |
| L2559 | “test this works with flush (collinear) wraps” | 🟠 Potential — untested code path |
| L2567 | `adjDistanceObjs` memoization commented out | 🟡 Medium — recalculated every access, performance hit |
| L2635 | `adjWrapperObjsFinal` memoization commented out | 🟡 Medium — same as above |
| L2642 | `adjacentWrapper` memoization commented out | 🟡 Medium — same as above |

### 9.12.7 Memoization Gaps

Three adjacent-related getters have memoization commented out:
`adjDistanceObjs`, `adjWrapperObjsFinal`, `adjacentWrapper`. This
means every access to `adjacentWrapper` triggers the full detection
chain. These were likely disabled during debugging because:
- They depend on arc-volatile properties that change during `maximizeCuddles`
- Stale memos would produce incorrect wrapper selections

If re-enabled, they must be added to `arcVolatileKeys` for proper
invalidation (see ARCHITECTURE § 5, TESTING § 3).

### 9.12.8 `inOutAdjWrappers` Orientation Bug

```javascript
get inOutAdjWrappers() {
  return memoize(() => {
    return this.#inOutWrappers(false)
  }, `inOutAdjWrappers`).call(this)
}
#inOutWrappers(flush) {
  const wrapper = flush ? this.flushWrapper : this.adjacentWrapper
  return this.isOutsideCorner === flush ? [this, wrapper] : [wrapper, this]
}
```

For adj wrapping (`flush=false`): the expression `this.isOutsideCorner === false`
means outside corners return `[wrapper, this]` and inside corners
return `[this, wrapper]`. This inverts the in/out assignment compared
to flush wrapping — **by design**, not a bug. The adj wrapper’s
“outer” is the one with the smaller arc (the one being wrapped to),
which is the opposite convention from flush wrapping where “outer”
is the containing arc.

However, `wrapState()` uses this ordering to compute divergence/
convergence. If the ordering doesn’t match the geometric reality
for intershapes (where in/out is determined by shape nesting,
not arc size), `adjWrapIsDiverging`/`adjWrapIsConverging` could
be inverted.

**Risk:** 🟠 Needs console inspection — `wrapState()` values cannot be determined visually.
Use `WrapperDebugOverlay.seg('celXXX')` at an intershape corner and check `adjWrapState`.

### 9.12.9 Stale `inOutAdjWrappers` / `inOutFlushWrappers` Memo

*Added: 2026-03-13*

**Status:** ✅ Fixed

`inOutAdjWrappers` and `inOutFlushWrappers` were actively memoized but
**not listed in `#resetMemoProps`**. After any arc mutation (e.g.
`maximizeCuddles`, `fixBadAdjWraps`), these getters returned stale
in/out wrapper assignments, which directly feed `wrapState()`,
`adjWrapIsDiverging`, and `adjWrapIsConverging`.

**Fix:** Added both keys to `#resetMemoProps` (drawAsSVG.js L1959) and
updated `WrapperTestHarness.resetKeys` to match.

### 9.12.10 Non-Square Cell Aspect Adjacent Wrap Bug

*Added: 2026-03-13*

**Status:** 🟡 Fix applied — needs visual verification with test hashes

**Test hashes:**
- `adjacent_horiz_aspect_1`: `0xa632c039f8ebdf763e40ecebfb803c36669c5c4714d3f757499a30859e98b784`
- `adjacent_horiz_aspect_2`: `0x44ae1aab7c02cbad2ff08c0426b58f7f74220eb115a26f3296e738e769959a77`

Both have `cellAspect === "horizontal"` (wide cells) and exhibit
converging adjacent wrappers that should be equidistant or diverging.

**Root cause:** `minAdjWrapperDistanceObj` (L2526) compares raw x-axis
and y-axis gaps between wrapper sides:

```
vertDist = vertInSide.x - vertOutSide.x   // x-gap (large for wide cells)
horDist  = horInSide.y - horOutSide.y      // y-gap (small for wide cells)
```

For non-square cells these values are asymmetric — the longer axis gap
always dominates the `startDist < endDist` / `startDist > endDist`
comparison, causing the wrong `isStart` selection. This cascades:

1. Wrong `isStart` → `intersectObj(seg, isStart)` projects onto wrong side
2. Wrong projection → wrong `dist` in `adjWrapperObjsFinal`
3. Wrong `adjacentWrapper` → `fixBadAdjWraps` detects convergence but
   re-wraps using the same broken detection

**Additional aspect issues:**
- `canHaveCorrectSize` compares against `cellRadius = min(w,h)/2` —
  a single scalar. Wraps along the wider axis compare against a
  threshold that's too small.
- `arcCenterMidPointTangent` uses a fixed 90° rotation, not
  aspect-corrected. The tangent-outWrapper intersection lands at
  a different relative position on non-square cells.

**Fix applied:** Normalize `vertDist` and `horDist` by their respective
cell dimensions (`cellSize.x` and `cellSize.y`) before comparison, so
the start/end selection is axis-agnostic. Raw (unnormalized) distances
are preserved in the returned objects for downstream geometry.

**Diagnostic:** `WrapperDebugOverlay.adjDistances(grid)` logs raw vs
normalized distances for every adjacent-wrapped segment to aid
verification.

---

## 9.13 Group Mask Pipeline

**Status:** � Partially re-enabled — `createMaskGroup()` active at `drawElement()` (L2080); `finishSetup()` call site still commented out

**Purpose:** Apply SVG `<mask>` to ShapeGroup elements so loft/shade
cuts (R-profile) reveal their depth through soft-edged luminance
masks rather than hard shape boundaries.

### 9.13.1 Timeline

| Commit | Date | What happened |
|--------|------|---------------|
| `e396f61` | Sep 16 2025 | Created `createMaskGroup()`, `maskShape`, `maskSVG`, `needsMask`. Initial call site in `finishSetup()` commented out from the start. |
| `754028b` | Sep 18 2025 | Enabled `createMaskGroup()` at second call site (`drawElement()`). Fixed multiple “bulge masking bugs.” |
| `685ab58` | Oct 15 2025 | Disabled again at `drawElement()` — **same BrokenFuture commit** that broke intershapes (§ 9.11). Both call sites now commented out. |
| session 6 | Mar 5 2026  | **`maskShape` return type fix:** Changed from `new SegPath(paths, this)` (single SegPath wrapping array of OpArrays) to array of individually-wrapped `new SegPath(inset, shape)`. Verified with `showMasksDebug()` — purple overlays correct. |
| session 6 | Mar 5 2026  | **`createMaskGroup` degenerate path guard:** Changed `if (s.maskShape)` to `const svg = s.maskSVG; if (svg)` — prevents crash when `SVGPath.fromSegPaths()` returns undefined for degenerate paths (all points collinear). Also avoids double-computing `maskShape`. |
| session 6 | Mar 5 2026  | **Re-enabled** `createMaskGroup()` at `drawElement()` (L2080). Masks now apply to R-profile ShapeGroup-combo elements. |

### 9.13.2 Architecture

Two separate mask systems exist:

**A) Frame mask** (`maskFrame()`, ProtoLayerObjects L509-533):
- Clones `backGroup.shapeGroups[0].svgGroupElt`, fills all paths white
- Creates `<mask>` in `<defs>`, attaches to `Frame.svgElt`
- Gated by `this.mask` boolean (currently not set)
- Only masks the *Frame* element so inner grid shows through

**B) ShapeGroup mask** (`createMaskGroup()`, ProtoLayerObjects L1798-1901):
- Only for `ShapeGroup-combo` type with `cut.profile.isR`
- For each shape: if `shape.maskShape` exists, creates a path from `shape.maskSVG`
- Builds a `<mask>` with: white `<rect>` (reveal base) + black mask paths (cut holes)
  - For `outsetShade`: inverts — black rect, white mask paths
- Blurs mask paths by `cut.depth / 4` for soft edges
- Creates additional blur copies at `/8`, `/16`, `/32` for deeper cuts
- Attaches mask to `svgElt`, adds `.masked` class

### 9.13.3 `maskShape` Getter (Shape, L3218)

Computes the scaled path used as mask content.
**Updated in session 6** — now returns `SegPath[]` (array) instead of single `SegPath`:

```
maskShape:
  if NOT isR profile → return (no mask)
  if isFrontGrid AND NOT outsetShade AND (isMaxEqualRadiusQuad OR isTurnip OR isLemon OR hasBulges)
    → return (skip these shapes)
  depthScale = cutDepthScale = cut.depth / cellRadius / 2
  scale = outsetShade ? insetScale : (insetScale - depthScale)
  if hasOrdinalConnections + direction.isAll:
    shapes = island.copyAllToCardinal(insetScale, cut)  ← ENCAPSULATION RISK
  else:
    shapes = [this]
  paths = shapes.flatMap(shape.simpleSegPaths.map(path => {
    inset = path.insetPath(scale)
    return new SegPath(inset, shape)     ← individually wrapped (session 6 fix)
  }))
  filter out degenerate paths (length=4, all segments length≈0)
  return paths                           ← array of SegPaths
```

### 9.13.4 Known Encapsulation Issue

The user reports difficulty reasoning about nesting depth during
mask development. Key concern: the object passed to build mask shapes
was “either too nested or not nested enough.”

**Root cause candidates:**

1. **`copyAllToCardinal()` round-trip** (L2794): Creates new temporary
   islands from `grid.createIslands()`, calls `createSimpleSubShapes()`
   and `inWrapPerimeter()` on them. These temporary islands have their
   own `shape` property — but that shape has a different `protoParent`
   chain than the original. If mask code later accesses `this.grid` or
   `this.island` on the copied shape, it may resolve to an unexpected
   layer.

2. **`Shape.cut` is delegated** (L3014): `get cut() { return this.island.cut }`.
   For mask shapes built from copied islands, `this.island` may be
   a temporary island that doesn’t have `cut` set. The `copyAllToCardinal`
   method passes `cut` to `createIslands`, but it’s stored on the Island
   constructor arg — confirm it propagates.

3. **`maskShape` reads `this.grid.isFrontGrid`** (L3218): This
   determines whether to skip certain shapes. For backGrid shapes,
   `isFrontGrid` is false, so the early-return guard is skipped and
   all R-profile shapes get masks. But `createMaskGroup` previously
   had `&& !this.grid.isBackGrid` commented out (L1801) — meaning
   backGrid ShapeGroups were *intentionally* being considered at some
   point, then the filter was removed.

4. **Nesting confusion in `createMaskGroup`**: The mask group is
   parented to `mask.elt` (L1895) — not to the SVG group directly. This
   puts the entire mask subtree inside `<defs>/<mask>`, which is correct
   SVG structure. But during debugging, if mask shapes were temporarily
   parented to the visible SVG tree (as suggested by the colored fills
   in comments), the nesting would appear wrong.

### 9.13.5 Debug Mask Shapes (`showMasks()` in DeBugging.js)

The `Debuggable.showMasks()` mixin (DeBugging.js ~L240) creates
visible-fill test versions of mask shapes:
- Parents mask paths to `this.grid.maskElt` (a `<g>` in the shader stack)
- OutsetShade: fills purple-tinted at 25% opacity
- InsetShade: fills violet-tinted at 15% opacity with `fill-rule: evenodd`
- These debug shapes bypass the `<mask>/<defs>` structure entirely

The debug shapes should be correct if `maskShape`/`maskSVG` compute
correctly. They can be used to verify mask accuracy before re-enabling
the actual `<mask>` element pipeline.

### 9.13.8 Ordinal + R-in groupMask shading bug (Fixed)

**Status:** ✅ Fixed

**Symptom:** For some hashes with islands that have ordinal connections
and an R-profile *r-in* cut (outsetShade), group masks were being
recomputed into Cardinal-only geometry which produced visible shading
artifacts (thin white/flat strips or collapsed ordinal connector
bridges). The artifact only appeared when group masks were de-blurred
or inspected at high fidelity.

**Root cause:** `Shape.maskShape()` previously downgraded "All"
calculated geometry to Cardinal when islands had ordinal connections.
That recalculation path produced new temporary island shapes whose
mask geometry was larger/smaller than the original `All` shape and
therefore produced incorrect mask polarity/coverage for *outset* (r-in)
shades. In short: ordinal connectors + `r-in` → forced All→Cardinal
recalc → incorrect mask → shading artifact.

**Fix applied:** Preserve the `All`-calculated shape for islands with
ordinal connections when the active cut is an R-profile with an
outset shade (`cut.profile.hasOutsetShade`). The downgrade to
Cardinal (and the `copyAllToCardinal()` path) is still used for
`r-out` (inset) cases where interior masks are required. The change
was implemented in `Shape.maskShape()` / `maskShape` (file:
`ProtoLayerObjects.js`) so that `r-in` + ordinal connectors keep their
original mask geometry.

**Files touched:** `ProtoLayerObjects.js` — `maskShape()` (shape mask
selection logic). A small follow-up guard ensures copies preserve the
`cut` metadata when copies are required.

**Regression / test hashes:**
- 0x9a6855a35b54aac9e8cba8b54e30050c9987098230179e38963df5b36c4610eb
- 0xba68b4b09a66638ae0fe58b7105dab9ca4d890540cc4b0694d9a59ffc72b870e
- 0xad7b90463ba0bbb11edb7aa4758425448853bfa1d82a20eb731e6a91616d31ef

**Verification:** Use `showMasks()` (DeBugging) and the `WrapperTestHarness`
regression pool to confirm that ordinal connector bridges retain
soft-masked shading and that `r-out` mask recalculation behavior is
unchanged.

### 9.13.6 `p5.Element.mask()` Prototype (ProtoFilter.js L408)

A separate helper `p5.Element.prototype.mask(shape, blur, strokeWidth)`
exists in ProtoFilter.js. This is a standalone utility that:
- Clones a shape element, fills it white (or strokes it white)
- Creates a `<mask>` and applies it to `this`
- NOT used by `createMaskGroup()` — they are parallel implementations

The cut Filter pipeline (`ProtoFilter` L127-144) has `feComposite`
`insetMask` operations for inset shading. These are separate from
the SVG `<mask>` element approach.

### 9.13.7 Re-enablement Plan

1. **Verify `maskShape`/`maskSVG`** are correct: enable `showMasks()`
   via `Debuggable.drawMask = true` on a ShapeGroup with R-profile cut.
   Compare debug shapes against expected mask boundaries.

2. **Uncomment at `drawElement()`** (L2076): Re-enable
   `this.createMaskGroup()` at the second call site only (the one that
   was last working in `754028b`).

3. **Verify SVG `<mask>` structure**: Inspect DOM to confirm mask is in
   `<defs>/<mask>`, maskGroup is child of mask, and `svgElt` has
   `mask="url(#id)"` attribute.

4. **Test ordinal shapes**: Use a hash with ordinal connections to
   exercise the `copyAllToCardinal` path and verify the encapsulation
   doesn’t break.

5. **Re-enable `finishSetup()` call** (L1775): Only after step 2 works.
   This earlier call site may trigger before SVG elements are ready.

---

## 9.14 SVG Filter Layout & Mask Cropping Issues

**Status:** frontGrid combo cascade crop ✅ fixed (June 2026); `rIn` masked SVG bbox crop ✅ §9.14.11; per-shape mask region sizing deferred post-submission (§9.15)

### 9.14.1 Issue 1: Cascade SVG Cropping (Frame & Grid)

**Status:** ✅ Fixed for frontGrid combo-layer cascade/wave crop (June 2026 sprint).
Historical frame/grid cascade family and J-in repros remain documented below for
regression reference. **Deferred:** replace artwork-wide mask layouts with
precise per-ShapeGroup bounds for cascade/wave cuts (Safari perf — §9.15.3).

**June 2026 resolution (frontGrid combo cascade crop):**

The active repro pool (lastHash designators **1444, 1514, 1515, 1517, 1519,
1520** — combo layer only, `amount > 1` inside-cut cascade/wave, shad layer OK)
was fixed in `ShapeGroup.createMaskGroup()` by assigning **FRAME artwork bounds**
to two luminance-mask layout targets (never exceeding `(0,0,100,200)`):

1. **`maskRect`** — white/black luminance backdrop inside the mask group.
   Was `layoutLimited(this.anchor, this.size, this.padding)` (cell-tight).
   Now `.layout(FRAME.anchor, FRAME.size)`.
2. **Final `<mask>` element** — mask coordinate system for `maskUnits="userSpaceOnUse"`.
   Was per-ShapeGroup cell layout (broken), then interim `(-50,-50,200,300)` (over-extended).
   Now `.layout(FRAME.anchor, FRAME.size)` (equivalent to `(0,0,100,200)`).

```js
// ProtoLayerObjects.js createMaskGroup() — submission fix
maskRect.layout(FRAME.anchor, FRAME.size)
mask.layout(FRAME.anchor, FRAME.size)   // maskUnits userSpaceOnUse
```

**Why this worked:** Combo+R cuts apply a luminance mask to the nested
`svgElt`. When `maskRect` and the `<mask>` element used cell bounds, the
luminance field was clipped to the shared `cellBounds` rectangle — producing
the identical axis-aligned crop across all combo layers in a cell while the shad
layer (separate ShapeGroup, no luminance mask) rendered correctly. Expanding
only the final `<mask>` element fixed some hashes (#1444, #1515); expanding
**both** `maskRect` and the `<mask>` to FRAME bounds fixed the remainder.

**Not required for this fix:** broadening nested combo `svgElt` layout/viewBox
to FRAME (tested, commented out in `assignElement()`). Nested `svgElt` stays
cell-sized with `overflow: visible`.

**Post-submission follow-up:** compute tight mask regions from cascade/wave
ShapeGroup geometry + filter bleed instead of artwork-wide FRAME defaults.
See §9.15.3 Tier 1b and ROADMAP task 12a deferred perf pass.

**June 5 triage correction:** The reported lastHash 1444 / 1514 / 1515 /
1517 crop pool did **not** respond to restoring a 50-user-unit
`ProtoCut.setLayouts()` shade-filter margin. Treat the shared shade-filter
region as low-priority for this specific repro. Manual inspection also narrows
the active symptom:

- The crop occurs only on **frontGrid** shapes. No current crop is visible in
  frame/backGrid contexts, even though older `lastHash` cases were tagged
  `Bad Frame cascade MASKING`.
- The crop occurs only in the **combo shader layer**. The cast-shadow layer
  still appears to render correctly.
- The bug is tied to `amount > 1` inside-cut/cascade/wave generation, not to
  the old frame/backGrid cascade crop family.

**June 5 intentionally exonerated / deprioritized paths:**

1. **`layoutLimited()` / `viewBoxLimited()` are not a standing crop suspect.**
  These helpers intentionally clamp SVG layout/viewBox rectangles to the
  artwork's visible user-unit bounds. The artwork contract is fixed at
  `(0,0,100,200)`, and no valid shading should exist outside those bounds;
  `Frame.maskFrame()` later masks pixels outside the backing-plane silhouette
  (`this.backGroup.shapeGroups[0]`) including the output-specific rounded
  corners. Current and historical crop bugs being debugged here happen
  *inside* those frame limits. The limited helpers should only return to the
  suspect list if there is direct evidence that their limit source has shifted
  away from the fundamental artwork bounds or their overlap math is broken.
  Their implementation is a straightforward normalize-rect → resolve-limit →
  `boundsOverlap()` pipeline in `ProtoFilter.js`.
2. **`createBBoxKeeper()` as a generic fix did not help.** Removing the guard
  so `this.createBBoxKeeper()` ran for every `createMaskGroup()` call produced
  no visual change. The existing keeper remains valid for the separate
  frame/backGrid `rIn` masked-SVG bbox failure, but this frontGrid combo crop
  does not appear to be the same effective-painted-bounds bug.
3. **Grid SVG overflow did not help.** Enabling
  `this.svgElt.attribute('overflow', 'visible')` in `Grid.assignElement()`
  produced no visible change for the current repro.
4. **Cardinal downgrade is not the active cause.** Most failing outputs do not
  crop within shapes that can downgrade from All to Cardinal. In the one noted
  downgraded case (`#1517`), the crop appears far outside the point where the
  downgrade kicks in.
5. **`createMaskGroup()` R/combo scoping is logically appropriate.** The new
  evidence is not that R/combo masking is overbroad; rather, the crop being
  combo-only makes the combo path a useful locator for the bug.
6. **Mask-region plumbing — partial June probes inconclusive; full fix confirmed
   June 2026.** Early manual A/B on the June repro did not isolate a single
   lever (mask blur off, final mask only, maskRect only, filter target swap).
   The **submission fix** required **both** `maskRect` and final `<mask>` at
   `FRAME.anchor/size`. Do not treat the June 5 "no visual change" probes as
   exoneration of mask sizing — the correct pair of layout changes had not yet
   been landed together.

**May 11 correction:** The prior runtime fix broadened `ShapeGroup.boundsRect`
for every `ShapeGroup` with `this.cut`:

```js
if (this.isFrame || this.cut) return FRAME.boundsRect
```

That is too broad. In practice almost every shaded ShapeGroup has a cut, so
the fix makes ordinary cut groups pretend they own the entire `(0, 0, 100, 200)`
frame. This contaminates basic geometry (`anchor`, `size`, nested `<svg>`
viewBox/layout, masks, filter consumers), blocks meaningful per-cut AABB region
work, and likely distorted recent shading, animation, Safari, and cropping
diagnostics. The intended rollback is to leave frame groups frame-sized while
letting non-frame cut groups use their true cell bounds:

```js
if (this.isFrame) return FRAME.boundsRect
return this.cellBounds.boundsRect
```

Do not treat the old `this.cut` branch as an accepted final architecture. The
cascade/J-in cropping problem still needs a precise region solution in user
units after the rollback is verified.

**Symptom:** Islands with `amount > 1` and `insideCutStyle = 'Cascades'` (or
`'Waves'`) show clipped filter effects — the shadow/highlight bleeds are
cut off at SVG element boundaries. Affects both frame-layer cascades and
grid-layer cascades across all shade layers (combo, high, shad).

This broad symptom describes the historical §9.14.1 family. The June 2026
lastHash repro is narrower: frontGrid only, combo layer only, with cast shadow
still rendering correctly.

**Root cause:** Three independent clipping layers in the SVG hierarchy
were all contributing to filter crop:
1. **Filter region** — `<filter>` elements defaulted to
   `filterUnits="objectBoundingBox"` with percentage-based bounds
   computed from `maxLayout`. For small ShapeGroups with deep cuts,
   the percentage margins were too thin.
2. **ShapeGroup `<svg>` viewport** — `boundsRect` was computed from
   tight `cellBounds`, not the full frame. The viewport clipped
   filter output even when the filter region was adequate.
3. **Grid `<svg>` viewport** — Default `overflow: hidden` clipped any
   filter output extending beyond the Grid's inset bounds.

For grid cascades, outset profile shapes (r-in) physically extend
beyond cell grid boundaries, making all three clipping layers active.

**Historical fix attempt — now partially rejected:**

1. **`filterUnits="userSpaceOnUse"`** (neuMark_I `setLayouts()` L169):
   Switches filters from percentage-based to fixed user-unit bounds.
   Filter region = `FRAME.boundsRect` expanded by `ProtoCut.padding`.
   Eliminates the `maxLayout` percentage pipeline entirely.
   ```js
   f.filter
     .attribute("filterUnits", "userSpaceOnUse")
     .attribute("x", FRAME.anchor.x - pad.x)
     .attribute("y", FRAME.anchor.y - pad.y)
     .attribute("width", FRAME.size.x + pad.x * 2)
     .attribute("height", FRAME.size.y + pad.y * 2)
   ```

2. **`ShapeGroup.boundsRect` expanded** (ProtoLayerObjects `boundsRect` getter): All cut ShapeGroups use `FRAME.boundsRect` as their viewport, matching the `userSpaceOnUse` filter coordinate space. This is the bad broadening now targeted for rollback.
   ```js
   if (this.isFrame || this.cut) return FRAME.boundsRect
   ```
   It was useful as a temporary diagnostic/correctness lever, but it is not
   safe as a permanent geometry rule because `this.cut` is not cascade-specific.

3. **`overflow: visible`** on ShapeGroup SVGs:
   - ShapeGroup: `if (this.cut) this.svgElt.attribute('overflow', 'visible')`
     (ProtoLayerObjects `assignElement()` L1790)
   - Grid overflow was considered under §9.14.1 but is currently commented out
     in `Grid.assignElement()`.
   Allows filter effects to extend beyond ShapeGroup viewport bounds. The FRAME
   `<svg>` and final mask provide the final visible clip.

**Why the old conclusion no longer holds:**
- `userSpaceOnUse` alone: filter region large enough, but ShapeGroup
  viewport still clips rendered output at tight cell bounds.
- `boundsRect` alone (without `userSpaceOnUse`): caused regression —
  FRAME-sized viewport + `maxLayout` percentage pipeline = thin margins.
- `overflow: visible` alone: unfiltered backing layers rendered, but
  filter layers still clipped at their percentage-based filter regions.
- New finding: `boundsRect -> FRAME.boundsRect` for every cut solves one
  visibility family by corrupting the coordinate/layout basis for nearly all
  shade groups. Cascade coverage belongs in filter/mask/SVG region math, not in
  a global `ShapeGroup.boundsRect` override.

**Failed approaches (for reference):**
1. **`ShapeGroup.padding` override for backGroup** — `CellGroup.isBackGroup`
   is never set to `true`, so the if-branch was dead code.
2. **`this.grid.insetBoundsRect` for grid cascades** — Identical to
   `protoParent.insetBoundsRect` (the default), so a no-op.
3. **`this.cellGroup.boundsRect` for grid cascades** — All cascade
   sub-islands share the same cells → same cellBounds → no expansion.
4. **`boundsRect → FRAME.boundsRect` for ALL cuts (without userSpaceOnUse)**
   — Caused widespread regression: inflated viewport + percentage-based
   `maxLayout` = thin margins, cropping j-out and r-out cuts across
   5+ hashes. Reverted.
5. **`this.grid.boundsRect` for cuts** — Grid's outer bounds from
   `FRAME.insetBoundsRect`, no visible change.

**Dead code note under review:** `ProtoCut.maxLayout` and
`ShapeGroup.finalSize` were previously considered dead because the percentage
pipeline is bypassed by `userSpaceOnUse`. After the bounds rollback, preserve
these until the exact post-rollback filter/mask region strategy is chosen.

**Key code paths (submission fix):**
- `createMaskGroup()`: ProtoLayerObjects.js `createMaskGroup()` ← **maskRect + final `<mask>` FRAME layout**
- `ShapeGroup.assignElement()`: overflow visible on cut nested `svgElt` (cell viewport unchanged)
- `setLayouts()`: neuMark_I.js ← userSpaceOnUse shade-filter regions (exonerated for this repro)
- `ShapeGroup.boundsRect`: frame-only for `isFrame`; cell bounds for cuts (May 12 rollback — unchanged)

**Historical key code paths:**

**Test hashes:** `cascade_grid_crop_1`, `cascade_grid_crop_1514`,
`cascade_grid_crop_1515`, `cascade_grid_crop_1517`, `cascade_grid_crop_1519`,
`cascade_grid_crop_1520` in WrapperTestHarness.js (all **fixed** June 2026).
Legacy: `cascade_frame_crop_1`, `cascade_grid_crop_2`, J-in cropping repros.

**Historical suspect (June 5, superseded by mask layout fix):** recursive
inside-cut geometry before masking — retained below for archaeology only.

### 9.14.2 Issue 2: R-Profile Mask Cropping

**Status:** ✅ Fixed — mask bounds fixed; frame/backgrid `rIn` bbox crop handled separately in §9.14.11

**Symptom:** Shapes with R-profile cuts that have group masks (re-enabled
`createMaskGroup()`) show clipped mask effects — the blurred mask paths
extend beyond the `<mask>` element's default bounds, causing hard crop
lines. Particularly visible on r-in (`hasOutsetShade`) profiles where
shading extends outward, but affects all R-profile masks.

**Root cause:** The SVG `<mask>` element was created with no explicit
bounds, defaulting to `maskUnits="objectBoundingBox"` with a region of
`-10%,-10%,120%,120%` relative to the masked element. The mask paths
are blurred by `cut.depth / 4` (primary) plus additional `/8`, `/16`,
`/32` copies for deep cuts. This blur extends the visual footprint of
the mask path well beyond the default 10% margin, especially for
smaller shapes with deeper cuts.

**Fix:** Set `maskUnits="userSpaceOnUse"` on the `<mask>` element with
explicit bounds matching the ShapeGroup's viewport:
```js
mask = createSVGElt('mask')
  .attribute('maskUnits', 'userSpaceOnUse')
  .layout(this.anchor, this.size, this.padding)
```
This gives the mask the same coordinate space as the ShapeGroup's
`<svg>` viewport, so the blurred mask paths have the full padding
region to bleed into. No separate filter instances are created —
the existing shared filters are unaffected.

**Failed approaches:**
1. **Increasing `ProtoCut.padding` multiplier** (from `depth * 2` to
   `depth * 3` for outset shade) — no visual effect because the mask's
   default `objectBoundingBox` region clips independently of the
   viewport's padding. The bottleneck was the mask, not the viewport.

**Performance notes:**
- The fix adds no extra DOM elements — just attributes on the existing
  `<mask>` element.
- **Future optimization:** `ProtoCut.padding` is currently `depth * 2`
  for all profile types. Precise per-shade-type padding would be:
  - `hasInsetShade` (rOut, jIn, iIn): shade inward, minimal overflow
  - `hasOutsetShade` (rIn, jOut, iOut): shade outward by ~depth
  - `hasCastShadow` (iOut, rOut): cast shadow vector magnitude
  Reducing padding to exact requirements shrinks viewport area and
  reduces render overhead, especially for animation.

**Key code paths:**
- `createMaskGroup()`: ProtoLayerObjects L1798-1901 ← **THE FIX**
- `maskRect` sizing: L1838-1848
- Blur application: L1854 (primary), L1869-1877 (layered)
- `p5.Element.blur()`: ProtoFilter L385-405
- `ProtoCut.padding`: neuMark_I L136
- `Profile.hasOutsetShade` / `hasInsetShade` / `hasCastShadow`:
  neuMark_I L61-63

**Test hash:** `cascade_grid_crop_1` in WrapperTestHarness.js

### 9.14.2b Bug Report: Duplicate Overlapping Shapes (Grouping)

**Status:** 🔴 Open — undiagnosed

**Hash:** `0x96659ca308edda09ab8a4dd403dde3b5058b54669261d9cd258bec389916aeda`

**Symptom:** Two shapes rendered directly on top of each other in the
upper-center area (just below the snake shape running along the top).
Both shapes occupy the same cells, producing doubled/overlapping
geometry with compounded shading.

**Likely cause:** Possible grouping or island duplication bug — similar
to `broken_01`/`broken_02`/`broken_03` in WrapperTestHarness which are
all tagged "grouping error, multiple groups contain same cell."

**Additional note:** This hash also causes `WrapperTestHarness.testPool()`
to hang during `flushWrap`/`adjWrap` mutation tests, suggesting a
wrapper cycle may be related to the grouping issue.

**Test case:** `broken_08` in WrapperTestHarness.js

---

### 9.14.3 Issue 3: Waves + Ordinal Connection Mask Mismatch

**June 5 scope note:** `Cyma Recta` is currently a dead feature path because
the option is commented out in `Features.js` (`insideCutStyle`). It may be
visually worth reviving before launch, but likely requires a more substantial
shading refactor to look correct. Do not include `Cyma Recta` in the active
cascade crop search unless the feature is re-enabled.

For the current frontGrid combo-layer crop, Cardinal downgrade is deprioritized:
most failing outputs do not crop within ordinal/downgraded shapes, and the one
known downgraded case crops far outside the downgrade point. Keep this section
for the separate Waves+ordinal mismatch family, but do not conflate it with the
current combo-only crop unless new evidence connects them.

**Symptom:** When `insideCutStyle = 'Waves'` and a shape has ordinal
connections, mask shapes in the cascade stack progressively reduce to
cardinal-only geometry. The stack shows `.all` shapes transitioning to
`.cardinal` shapes as they inset smaller, creating mismatched mask
boundaries.

**Root cause:** The Cutting Loop (ProtoLayerObjects L1497-1504)
alternates `profile = profile.wave` on each cascade step for
`insideCutStyle = 'Waves'`. This flips `j`↔`r` profiles. Meanwhile,
`maskShape` (L3239-3241) checks:
```
hasOrds = island.hasOrdinalConnections && island.direction.isAll
shapes = hasOrds ? island.copyAllToCardinal(insetScale, cut) : [this]
```

The `copyAllToCardinal()` returns cardinal-only islands. As cascade steps
inset further, successive islands may lose ordinal connections (shapes
shrink away from corners), causing some steps to use `.all` geometry and
others to use `.cardinal` geometry. The masks are computed per-shape
but applied per-ShapeGroup — so a ShapeGroup containing a mix of
all-direction and cardinal-direction shapes gets inconsistent masks.

**The deeper issue:** Mask shapes should ideally be calculated
specifically per the shape they are masking, at each cascade level,
rather than relying on the top-level island's ordinal status.

**Key code paths:**
- `profile.wave` toggle: ProtoLayerObjects L1499
- `maskShape` ordinal branch: ProtoLayerObjects L3239-3245
- `copyAllToCardinal()`: ProtoLayerObjects L2797-2860
- `createSubIslands()` direction downgrade: ProtoLayerObjects L2721

### 9.14.4 Issue 4: Safari vs Chrome Rendering

**Symptom:** Filter effects render correctly in Chrome but show
cropping, misalignment, or missing effects in Safari.

**Status update:** The § 9.14.1 fix switched the shade filter pipeline
from percentage-based `objectBoundingBox` to `filterUnits="userSpaceOnUse"`
with fixed user-unit bounds. This eliminates the percentage
interpretation divergence between Chrome and Safari for shade filters.
However, `p5.Element.blur()` (ProtoFilter L385) still creates separate
inline `<filter>` elements with hardcoded percentage bounds
(`x="-50%" y="-50%" width="200%" height="200%"`) for mask blurring.
These may still exhibit cross-browser differences.

**Remaining percentage-based filters:**
- `p5.Element.blur()` (ProtoFilter L385-405): Used in `createMaskGroup()`
  for mask blurring. Creates an independent inline `<filter>` with
  `objectBoundingBox` percentage bounds — NOT modified by `setLayouts()`.
  If Safari mask blurring shows cropping, this filter would need the
  same `userSpaceOnUse` treatment.

**Known risk — cross-SVG filter ID resolution (§ 9.14.4b):**
`applyFilterToElement()` (ProtoFilter L190) uses `.child(this.defs)` to
attach the `<defs>` containing the shared `<filter>` element into the
calling ShapeGroup's `<svg>`. Because `.child()` is a DOM **move** (not
a clone), the `<defs>` is physically relocated to whichever ShapeGroup
calls `applyFilterToElement` last. All earlier ShapeGroups that reference
the same `filter="url(#id)"` now have **dangling references** — no
`<filter>` definition exists within their SVG subtree.

Chrome resolves `url(#id)` document-wide (across nested `<svg>` element
boundaries), so the filter is found regardless of where its `<defs>`
physically resides. Safari, however, may resolve `url(#id)` references
within the **nearest SVG viewport scope** or be stricter about
cross-`<svg>` ID resolution. This is a known divergence point in SVG
implementations.

**Impact:** If Safari scopes ID resolution to the containing `<svg>`,
then only the *last* ShapeGroup per shared filter will render correctly;
all others will silently fail to apply the filter (no shadow/highlight).
This would appear as missing filter effects on some but not all shapes
using the same cut profile.

**Potential approaches to fix:**

1. **Clone defs instead of moving:** Change `.child(this.defs)` to
   clone the `<defs>` node into each ShapeGroup's `<svg>`. Guarantees
   each SVG subtree has its own `<filter>` definition. Downside:
   duplicated DOM nodes (one `<filter>` per ShapeGroup instead of one
   per cut). Could use unique IDs per clone to avoid ID collisions.

2. **Hoist filter defs to a common ancestor:** Place all `<filter>`
   definitions in a single `<defs>` block at the top-level `<svg>`
   (bleed element) or in the FRAME `<svg>`. All nested ShapeGroups
   reference upward. This matches the SVG spec's intended `<defs>`
   pattern and should work in all browsers. Requires restructuring
   where `createFilter()` attaches its output.

3. **Detect Safari + clone on demand:** Keep the current move-based
   approach for Chrome (minimal DOM). On Safari, clone defs into each
   ShapeGroup's SVG. Combines best performance with compatibility.
   `const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)`

4. **Move defs to the filter wrapper `<g>`'s parent `<svg>` directly:**
   Ensure `this.defs` is always a child of the specific `<svg>` that
   contains the referencing `<g filter="url(#...)">` — i.e. the
   ShapeGroup's own `<svg>`. Currently this IS what happens for the
   last caller, but not for earlier ones. Would need one clone per
   ShapeGroup.

**Recommended:** Approach 2 (hoist to common ancestor) is cleanest and
spec-compliant. The top-level `<svg>` or FRAME `<svg>` `<defs>` block
is the natural home for shared filter definitions. This also eliminates
the accidental coupling between call order and DOM placement.

### 9.14.5 Recommended Approach

**Priority order:** Fix 1-3 first (concrete visual bugs), defer 4
(Safari) until the layout system is stable.

**Phase A — Audit (read-only)**
1. Trace a specific cascade hash through `cutIslands()` to log the
   actual `ProtoCut.breed` values, `depth` values, and resulting
   `maxLayout` percentages for each cascade step.
2. Trace a specific r-out hash to log the `<mask>` bounds vs the
   blurred mask path's actual visual extent.
3. Trace a Waves+ordinal hash to log the `direction` and
   `hasOrdinalConnections` state at each cascade level.

**Phase B — Fix cascade filter cropping (Issue 1)** Re-opened
- Previous approach: `ShapeGroup.boundsRect` returned `FRAME.boundsRect` for
  cut groups. This was overbroad because `this.cut` is not cascade-specific.
  See § 9.14.1 for the rollback and revalidation plan.

**Phase C — Fix mask cropping (Issue 2)** ✅ Fixed
- Final approach: `maskUnits="userSpaceOnUse"` with explicit bounds on the
  `<mask>` element. See § 9.14.2.

**Phase D — Fix waves+ordinal masks (Issue 3)**
- Compute `maskShape` per cascade level using each shape's actual
  direction state at that level, rather than inheriting from the
  top-level island.
- May require passing `direction` into `maskShape` as a parameter
  instead of reading `this.island.direction`.

**Phase E — Safari compatibility (Issues 4 + 4b, deferred)**
- Shade filters now use `userSpaceOnUse` (§ 9.14.6), which may resolve
  Safari percentage-interpretation issues. Needs Safari testing.
- `p5.Element.blur()` mask filters still use percentage bounds — may
  need the same `userSpaceOnUse` treatment if Safari clips mask blurs.
- If filter effects are missing on some shapes, investigate cross-SVG
  `url(#id)` resolution (§ 9.14.4b). Fix by hoisting `<defs>` to a
  common ancestor `<svg>`, or cloning per ShapeGroup.
- `const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)`

---

### 9.14.6 User-Unit Filter Layout Regression (Reverted)

**Status:** 🟡 Tested, diagnosed, then reverted from the runtime default

**Summary:** A Mar 6 experiment switched shared shade filters from the
legacy `%`-based `maxLayout` region to `filterUnits="userSpaceOnUse"`
with fixed FRAME coordinates. That change was bundled with broader cut
ShapeGroup viewports and `overflow:visible` on cut SVGs.

That bundle did address one family of cropping concerns, but it also
introduced a visible regression on the primary investigation hash. The
important finding is that the regression did **not** come from the
viewport or overflow changes. It came from the **filter region mode**.

**What the A/B sequence proved:**
1. A coarse legacy toggle reproduced the earlier vs later visual state.
2. That toggle was split into three components:
   - filter region mode
   - cut `boundsRect`
   - cut SVG `overflow`
3. Only the filter region mode reproduced the regression.
4. `boundsRect` and `overflow` alone did not change the look.

**Current runtime state:**
- `ProtoCut.setLayouts()` sets `filterUnits='userSpaceOnUse'` while retaining
  `%`-based `x`/`y`/`width`/`height` derived from `maxLayout`. Using
  `userSpaceOnUse` with `%` ensures the percent values are resolved
  against the ShapeGroup viewport (the element `<svg>` viewBox) rather
  than the individual shape bounding box — this prevents cascade-crop
  clipping without introducing the frame-coordinate banding observed
  when absolute FRAME x/y/width/height were used.
- Avoid setting absolute FRAME coordinates with `userSpaceOnUse` — that
  approach maps incorrectly into nested ShapeGroup viewBoxes and caused
  the earlier top/bottom banding regression.
- Any future re-test of alternate layouts should be done via the dev-only
  `testing/FilterDebugHarness.js` runtime patch tool.

**Design lesson:** SVG cropping bugs in this codebase are not a single
mechanism. At minimum, the following must be isolated independently:
1. filter region coordinates
2. ShapeGroup viewport / `boundsRect`
3. SVG or mask overflow behavior

Bundling those together again will make diagnosis ambiguous.

### 9.14.7 SVG Filter Banding / Quantization

**Status:** ✅ Resolved — mask blur filter region clipping (Mar 7 2026)

**Primary hash:** `0x3e8a98faacc735c66bc2f535e0d943ee2c65fdddb47a48f54857444fc4251d34`

**Visual symptom:** Large smooth bevels and embossed inner contours show
visible tonal shelves / stepped rings rather than continuous falloff.
The currently relevant artifact is on the **Frame's massive `rOut` cut**
(the outer pill body / frame bevel), not on the smaller non-frame cuts.

**Key conclusion:** The investigation now clearly contains **two
different problems**:

1. A **real filter-region regression** caused by the Mar 6
  `userSpaceOnUse` layout rewrite when it used absolute FRAME coordinates.
  That is now fixed by explicitly setting `filterUnits='userSpaceOnUse'`
  while keeping `%`-based `maxLayout` assignments so the filter region
  margins resolve against the ShapeGroup viewport.
2. A **remaining vertical/cropping-style artifact** that still persists
  after that fix and is not yet isolated.

So the current issue should no longer be approached as a pure shader
problem unless the remaining layout and clipping hypotheses are ruled
out first.

#### 9.14.7.1 Diagnosis Summary

The earlier working hypothesis was **shade-stack quantization** inside
`Shade.neuShadeSVGFactory()`. That remains plausible as a secondary
factor, but it is no longer the best primary explanation.

The stronger March 6 evidence came from image-based A/B testing against
actual before/after render states. That work showed that one major
artifact mapped directly to the filter-region layout rewrite in
`ProtoCut.setLayouts()`, not to shade-ladder math.

The correct current model is:

- one artifact was layout-driven and is fixed
- one artifact remains and still needs fresh isolation

#### 9.14.7.2 Harness Evidence

`runFilterBandingDiagnostics()` was added to
`testing/WrapperTestHarness.js` to inspect the active filter stacks for
the current hash.

Observed results for the primary hash:

| Cut | Filters | Finding |
|-----|---------|---------|
| `rOut-0.74xCellRadius` | 3 | Smaller non-frame cut; useful for family comparison but not the primary visible artifact |
| `rOut-0.9133xCellRadius` | 3 | Smaller non-frame cut; same note as above |
| `rOut-2.74xCellRadius` | 3 | Mid-depth non-frame cut; secondary evidence only |
| `rOut-18.74xCellRadius` | 3 | **Primary target** — frame-scale `rOut` stack attached to the visible outer bevel |

All 4 active cuts for the hash are `rOut`, which rules out mixed
profile interaction as the primary source. However, visual debugging
indicates the **visible banding is on the frame cut**, so the correct
first target is the deepest frame-scale `rOut` filter, not the smaller
interior `rOut` variants.

The filter-banding harness is still useful for describing the active
shade stacks, but it is **not sufficient by itself** to tell shader
artifacts apart from SVG layout artifacts. That distinction only became
clear after commit-state comparison and layout-specific A/B toggles.

#### 9.14.7.3 Most Likely Culprits

For the **remaining** artifact, the current suspects are now:

1. another viewport or clipping interaction not covered by the
  filter-region fix
2. nested SVG viewport sizing / ShapeGroup coordinate behavior
3. mask blur or mask clipping behavior separate from the shared shade
  filter
4. only after those are ruled out: shade-stack quantization inside
  `neuShadeSVGFactory()`

**2026-05-11 Grid geometry query:** If this banding family reappears,
re-check `Grid.anchor`, `Grid.size`, `Grid.boundsRect`, and
`Grid.gridAspect` before returning to shader math. `FeatureSet` currently
encodes `Magical` as square-cell, variable-ratio grids and `Flexible` as
cell-aspect-driven grids where `y` is chosen from the intended aspect.
That means the old-looking `Flexible -> super bounds, Magical ->
computed bounds` split may be intentional: full `FRAME` bounds preserve
the generated `Flexible` `Square`/`Tall`/`Wide` cell aspect, while computed
`Magical` bounds preserve square cells but can extend past the visible
`100x200` frame and then get clipped. Do not use the measured
`Grid.cellAspect` getter inside `Grid.gridAspect`; it depends on
`cellSize -> insetSize -> size -> gridAspect` and creates a recursive
layout dependency. If an explicit flexible-grid aspect correction is
needed, pass the intended feature aspect (or a derived numeric ratio)
from `FeatureSet`/`ProtoMill.mkGrid()` into `Grid` instead of reading
`Grid.cellAspect` during bounds calculation.

#### 9.14.7.4 Hypothetical Fix Sequence

Preferred workflow: **diagnose → hypothesize fix → document → debug**.
The next code changes should therefore be staged experiments, not broad
shader rewrites.

Recommended order:

**Experiment A — Layout isolation via dev harness**
- Use `testing/FilterDebugHarness.js` to toggle one layer at a time:
  filter region mode, cut bounds mode, cut overflow, and frame filter
  visibility.
- Goal: determine whether the remaining artifact is still SVG-layout or
  clipping driven.

**Experiment B — Mask-specific audit**
- Compare shade-filter behavior against mask-blur behavior explicitly.
- Goal: determine whether the remaining vertical/cropping shelves come
  from mask clipping rather than shared shade filters.

**Experiment C — Shader stack audit only if A/B are negative**
- Revisit dedupe, `keep()`, and frame `rOut` stack density only after
  layout and mask factors are ruled out.
- Goal: avoid repeating the earlier mistake of debugging shader math
  before proving the artifact is actually shader-driven.

#### 9.14.7.5 Current Practical Approach

1. Keep operational code clean; use dev-only testing tools for probing.
2. Use `WrapperTestHarness` for reporting and `FilterDebugHarness` for
   temporary runtime patches.
3. Treat SVG cropping as a family of separate mechanisms, not as one
   monolithic bug category.
4. Record each successful A/B in terms of which layer changed:
   filter region, viewport, overflow, mask, or shade stack.

#### 9.14.7.6 Mask Blur Filter Region Fix (Mar 7 2026)

**Status:** ✅ Fixed — single change in ProtoFilter.js `.blur()`

**Symptom:** Subtle vertical lines visible within large R-out frame
cuts. Appeared as partial cropping of the blur filter that gives the
frame body its volume/bevel. Only affected hashes where the `rOut`
frame cut had very large depth (e.g., `rOut-18.74xCellRadius`).

**Affected hashes:**
- `0x7c8713cb6c04c15a7f218736f964eccb227d74a7ea803253edf67055c7699e90`
- `0x3e8a98faacc735c66bc2f535e0d943ee2c65fdddb47a48f54857444fc4251d34`

**Root cause:** The `p5.Element.prototype.blur()` function
(ProtoFilter.js L385) created its SVG `<filter>` with a fixed region:
```
x="-50%"  y="-50%"  width="200%"  height="200%"
```
With default `filterUnits="objectBoundingBox"`, these percentages are
relative to the **path content bounding box**. For the R-combo
`createMaskGroup()` mask paths:
- Path BBox = `0,0 → 100×200`
- Filter x-margin = 50% of 100 = **50 user units** each side
- Blur `stdDeviation = cut.depth / 4 ≈ 72 user units` (for deep cuts)
- Gaussian kernel extends ~3σ ≈ **216 user units**
- 50 << 216 → blur hard-clipped at x≈-50 and x≈150

The y-direction margin (100 units = 50% of 200) was also insufficient
but less visually obvious due to the frame edge masking geometry.

**Fix:** Scale the blur filter region dynamically based on the actual
blur radius:
```js
const margin = max(50, Math.ceil(radius * 3 / 1) * 100)
```
This ensures the filter region extends ≥3σ in all directions, which
covers >99.7% of the Gaussian distribution. The minimum of 50%
preserves the original behavior for small blurs.

**Code location:** ProtoFilter.js `p5.Element.prototype.blur()` L385-407

**What was NOT the cause (ruled out during investigation):**
1. **Shade filter region** (`setLayouts()` %-based vs `userSpaceOnUse`):
   Switching frame cuts to `userSpaceOnUse` did not fix vertical lines
   and reintroduced horizontal bar artifacts.
2. **SVG viewport clipping** (Grid/Frame SVG `overflow:visible`):
   Grid and Frame SVGs clip at (0,0,100,200), but the ShapeGroup
   viewports are already enormous (~676×776 for combo groups) — the
   clip wasn't the bottleneck.
3. **ShapeGroup `padding` getter** (`backGroupPadding` vs
   `defaultPadding`): Changing padding had no visual effect because
   the issue was in the mask blur filter, not the viewport sizing.
4. **`createMaskGroup()` mask itself**: Disabling `createMaskGroup()`
   entirely eliminated the lines, confirming the mask pipeline was
   the source — but the fix is in the blur utility, not the mask
   construction logic.

**Diagnostic tool added:** `dumpBackgridClipChain()` in
`testing/WrapperTestHarness.js` — dumps SVG viewport chain, filter
regions, padding, and bounding boxes for all backgrid ShapeGroups.

#### 9.14.7.7 Cascade Crop Fix (Mar 9 2026)

**Status:** Historical — visual fix succeeded, bounds broadening now being rolled back  
**Date:** 2026-03-09  
**Summary:** After the group-mask blur fix was applied, the cascade
cropping regression was resolved by two targeted, low-risk changes:

- (A) Broadening `ShapeGroup.boundsRect` for cuts to return
  `FRAME.boundsRect` (ensured shape groups contributing deep cascade
  effects were laid out in full frame user-space). This is now considered the
  wrong layer for the fix because `this.cut` applies far beyond cascades.
- (C) Switching `ProtoCut.setLayouts()` to use
  `filterUnits="userSpaceOnUse"` and absolute FRAME bounds instead of
  percentage-based (`objectBoundingBox`) margins.

**Performance note:** We experimented with setting `overflow: visible`
on ShapeGroup/Grid SVGs (previously considered as part of a 3-way
approach). That change was tested but intentionally reverted due to
measurable performance concerns; it is **not** part of the retained
fix. The retained fixes (A + C) correct cascade cropping without
requiring permanent `overflow: visible`.

**Why this appeared to work:** Using absolute user-space filter bounds decouples
filter region calculation from ShapeGroup viewport sizes (the source
of percentage-based under-coverage). Broadening `boundsRect` for cut
ShapeGroups ensures padding and mask calculations include the full
frame area where deep blurs and cascades can extend.

**May 11 follow-up:** remove the `this.cut` part of `ShapeGroup.boundsRect`,
then re-test the cascade/J-in/cropping pool. If cropping returns, address it in
explicit filter regions, mask regions, or cascade-specific overflow/layout
rules rather than making every cut group frame-sized.

**Implementation:** See `ProtoLayerObjects.js` (`ShapeGroup.boundsRect`
and caller code) and `ProtoCut.setLayouts()` in `neuMark_I.js` for the
user-space filter bounds implementation.


**Previous content of this section (now superseded):** Described a
failed boundsRect/overflow fix for the earlier bottom-bar regression,
which was fully reverted to Mar 5 baseline before this fix was applied.

---

### 9.14.8 R-in Backgrid Edge White-Out (Resolved)

**Status:** ✅ Resolved  
**Date:** 2026-03-07 → 2026-03-08  
**Symptom:** When the outermost frame cut is R-in, the gap between the
cut's end and the frame border appears as flat white (background color)
instead of shaded molding. Originally misdiagnosed as an R-out→R-in mask
overlap — the actual cause was R-in not reaching the frame edge.

**Root cause:** `insetEnd()` in `mkFrame()` (sketch.js) shrinks the
outermost R-in cut's `.end` inward when `widthVal >= 2`, leaving an
unshaded gap between the cut boundary and the frame edge at 1.0.

**Fix applied:** Force outermost R-in to extend to the frame edge:
```js
// sketch.js — after cuts array is built
const lastCut = cuts.findLast(c => c !== undefined)
if (lastCut?.profile === 'rIn' && lastCut.end < 1) lastCut.end = 1
```
An alternative R-out cap approach (appending a thin R-out cut to fill
the gap) is preserved as commented-out code below the fix.

**Broken hash:**  
`0xd3413c3544b657848b860cca4facf0e29c4ea4dd59bb4f4c6ae2929f98969b3b`

**Golden hash (same R-out→R-in pattern, renders correctly):**  
`0xc71c7fad1f7da09d2b563a22a98f6277d8a4c855faf3495e7b35d87173ede188`

#### 9.14.8.1 Hypotheses

**Hypothesis 1 — R-out combo mask overlaps R-in combo (Most Likely)**  
Both combo ShapeGroups share the same `comboElt` parent `<g>`. The R-out
combo has a mask (white rect + black blurred shapes) that makes it visible
*everywhere except inside the blurred shape outlines*. If the R-out combo's
opaque `frameColor` output extends over the R-in region at the bottom,
it paints flat white over the R-in shading underneath. The ordering in
`comboElt` is inner→outer (R-in first, R-out on top) because
`cutIslands()` processes frame cuts in inner→outer order.

**Hypothesis 2 — `maskFrame()` backing shape doesn't cover bottom**  
`maskFrame()` clones `shapeGroups[0]` (the flat backing) to create a
Frame-level `<mask>`. If the backing path doesn't fully extend to the
frame bottom edge, all shading below that boundary is clipped to
transparent.

**Hypothesis 3 — `isBackGroup` is never set to `true` (latent)**  
`CellGroup.isBackGroup` is initialized to `false` (L1080) and
`setType('BackGroup')` is called (L340) but that only changes `_type`,
not the boolean flag. The `isBackGroup`-conditional code in
`ShapeGroup.padding` (L1733-1738) is therefore dead code. May affect
padding/viewport but is not the primary cause.

#### 9.14.8.2 Test Plan

Diagnostic function `dumpBackgridShadeLayers()` added to
`testing/WrapperTestHarness.js`. Callable from console on the broken
hash. Reports:

1. **Combo layer child order** — lists all ShapeGroup SVGs inside
   `comboElt` with their cut breed, mask presence, and z-index
2. **Mask coverage** — for each masked combo ShapeGroup, reports mask
   rect bounds and mask path bounding boxes
3. **Frame mask coverage** — reports `maskFrame()` backing clone bounds
   vs the Frame SVG bounds
4. **Toggle tests** — `window.toggleComboChild(index)` to set
   `display:none` on individual combo children to isolate the overlap

#### 9.14.8.3 Ruled Out

- `createMaskGroup()` suppression by profile type — both commented-out
  guards (`hasOutsetShade`, `isBackGrid`) are inactive; R-in backgrid
  ShapeGroups DO get masks normally
- `maskShape` getter bail-out — the `isFrontGrid` guard ensures backGrid
  shapes always pass through
- Missing filter creation — `#createFilters()` always creates 3 filters
  (combo, high, shad) for both R-in and R-out
- Hypotheses 1–3 (combo mask overlap, maskFrame coverage, isBackGroup
  flag) were all ruled out by diagnostics — the broken hash had only
  1 backGrid cut (R-in), no R-out at all

#### 9.14.8.4 Debug Display Fix

During investigation, `.showShapeGroupsDebug()` was found to have two
bugs in the terminal segment path rendering (ProtoLayerObjects.js):

1. `cutDepthScale` only returned values for R profiles (`profile?.isR`),
   returning `undefined` for J profiles → J-in/J-out showed no offset
   lines. Fixed by extending guard to `profile?.isR || profile?.isJ`.
2. `terminalSegPaths` drew both lines offset (one outset, one inset)
   instead of one at the exact shape. Fixed so that one line always
   traces the exact shape (`simpleInsetSegPaths`) and the other shows
   the shade depth direction:
   - R-in / J-out (`hasOutsetShade`): red = exact shape, blue = outset
   - R-out / J-in (`hasInsetShade`): red = exact shape, blue = inset

#### 9.14.8.5 Diagnostic Tools Added

- `dumpBackgridShadeLayers()` — console table of backGrid cut layers,
  combo children, mask bounds (WrapperTestHarness.js)
- `toggleComboChild(index)` — toggle `display:none` on combo children
- `toggleShadeLayer(index)` — toggle individual shade layers

---

### 9.14.9 R-in Shade Layer Not Centered (Fixed)

**Status:** ✅ Fixed — mask/construction fixes applied
**Date (fixed):** 2026-03-12

**Fix summary (short):** Root cause was mask construction order and
mask-shape handling in `Shape.maskShape()` and `ShapeGroup.createMaskGroup()`;
these were corrected so hole-shaped (R-in) masks subtract a sharp
interior shape before blurring ("subtract sharp → then blur"), and
the `outsetShade` scale workaround was removed. See details below.
**Symptom:** R-out shade layers are visually centered within their cut
depth, but R-in shade layers sit ~1/4 to 1/3 from the inside edge
instead of centered. This is noticeable on wider frame cuts.

**Root cause (identified, not yet fixed):** Two control points position
the shade asymmetrically for R-in vs R-out:

1. **`cutIslands` insetScale selection** (ProtoLayerObjects.js):
   ```js
   if (profile) insetScale = profile.hasInsetShade ? cutStart : cutEnd
   ```
   R-out (`hasInsetShade`) uses `cutStart` (outer edge); R-in uses
   `cutEnd` (inner edge). This pushes R-in shade toward the inside.

2. **`layerStart` in `cutGroups()`** (sketch.js):
   ```js
   layerStart: primeCut.hasInsetShade ? this.minInsetScale : 1
   ```
   R-out starts at `minInsetScale` (~0.65–0.75); R-in starts at `1`
   (full radius).

**Potential fix:** Use a midpoint `(cutStart + cutEnd) / 2` or bias
toward `cutStart` for the R-in case in the `cutIslands` insetScale
ternary.

**Diagnosis & Fix Strategy (2026-03-10)**

1) Goal: Confirm whether the perceived vertical displacement of the
   R-in shade is caused by different blur radii, color/tone generation,
   or true offset positioning. The earlier offset checks showed
   identical offsets — this investigation focuses on blur stdDeviation
   and color/shade luma differences.

2) Instrumentation: Add lightweight debug logging to
   `Shade.neuShadeSVGFactory()` (neuMark_I.js) to emit, per shader
   stack creation:
   - incoming args: `curve`, `cutIn`, raw `mag` (signed), `pixToUserUnits`
   - computed: `inset` flag, final `mag` (abs), `offsets[]`, `blurRadius`,
     `highBlurRad`, `shadBlurRad`, `shadowReducer`, and the `dropShade`
     objects (color + blur) produced.

3) Reproduce cases: Use the `FilterDebugHarness` / `WrapperTestHarness`
   to build only the `shad` and `combo` filter stacks for a selected
   hash that contains an R-out→R-in sequence (use the three regression
   hashes). Export the intermediate blurred layers as SVG/PNG for top
   and bottom samples and compute a mean-per-pixel difference.

4) Expected outcomes:
   - If blur radii differ (stdDeviation different) → normalize blur
     computation to be symmetric for r-in and r-out (base on abs(mag)).
   - If color luma differs (different `shadColLuma`) → adjust
     `shadowReducer` or the `shadColLuma` formula to be symmetric.
   - If neither differ but perceived darkness persists, consider the
     composite order or feBlend operator differences; ensure blend
     modes and `feBlend` inputs are equivalent for r-in vs r-out.

5) Fix candidates (conservative order):
   - Normalize blur radii: compute blur purely from `abs(mag)` and
     offsets, not from pre-abs sign or `inset` boolean.
   - Clamp/neutralize `shadowReducer` for `curve === 'r'` so small
     numeric differences don't produce darker center ticks for r-in.
   - Ensure `inset` only affects masking polarity, not blur/colour math.

6) Regression: Add pixel-compare tests into `testing/WrapperTestHarness.js`
   and the new `ordinal_rIn_groupMask` pool. Verify pre/post differences
   are below a small threshold after the fix.

**Instrumentation Results (2026-03-10)**

Debug logging was added to `neuShadeSVGFactory()` gated by
`window.DEBUG_NEUSHADES`. A console harness rebuilt the current hash
and captured all R-curve shade parameters. Key findings:

- **Blur radii and magnitudes are identical** between r-in and r-out
  for matching `shadeType` + `curve` pairs. The factory produces
  numerically identical shade stacks regardless of `cutIn`.
- The **only difference** entering the factory is the `inset` flag,
  which is derived from `mag` sign (set by `#createShader()` sign
  math: `mag * cutIn * r * r2`).
- For combo (curve `'r'`): r-out gets `inset=true`, r-in gets
  `inset=false`. For shad (curve `'r2'`): reversed.

**Root cause identified (revised):** The asymmetry is in
`createMaskGroup()` (ProtoLayerObjects.js ~L2085), not in the shade
filter stack or factory. Disabling `createMaskGroup()` produces
properly matched top/bottom shading.

The issue is the blur direction on mask shapes:
- R-out mask: interior closed shape — blur gradient radiates outward
  from shape edge, matching the outset shade direction.
- R-in mask: open shape with hole (rectangle minus interior) — the
  blur is applied to the composite hole shape, producing a gradient
  that radiates inward from the same edge. This is the wrong direction
  for an inset shade — it should radiate outward (away from the viewer
  into the recess).

The fix likely involves restructuring mask creation for r-in: subtract
the **sharp** (unblurred) shape from the rectangle first, then blur
the result, so the gradient direction is correct for the inset case.

Additional considerations identified:
- `createBlurMask()` usage within `createMaskGroup()` may need
  rethinking for the r-in hole-shape case
- When r-in is the outermost frame/backgrid cut, the mask may not be
  needed at all
- `const divs = [8, 16, 32]` may need scaling to cover deeper cuts
  where the effect is more prominent

**Ruled out:**

- **`neuShadeSVGFactory()` parameters**: Instrumented and confirmed
  identical blur radii, magnitudes, color luma, and `shadowReducer`
  values between r-in and r-out for matching `shadeType` + `curve`.
- **`ProtoFilter.shade()` blend base asymmetry**: Inset blends from
  `transparentInput`, outset blends from `SourceGraphic`. Two
  restructuring attempts (changing `insetResult` init; adding symmetric
  fringe masks) had no visible effect because the filter stack itself
  is correct — the visual asymmetry comes from the mask, not the
  filter. A future optimization could make the outset path match the
  inset path (both from transparent + fringe mask), but this adds an
  extra `feComposite` per outset layer and is not worth pursuing
  unless a performance audit identifies the filter stack as a
  bottleneck.

---

### 9.14.10 Viewport-Scale Dependent Shade Calibration (Solved for Now)

*Added: 2026-05-07*
*Current status updated: 2026-05-07*

**Status:** ✅ Solved for now — user-unit/pixel conversion removed from shade
offset/blur authoring and visually retuned

**Symptom:** R-out shading, especially the large soft frame/body bevels, only
looks naturally calibrated in the artist's usual launch context: a tall vertical
browser window stretched nearly full-height on a 4K Retina display. Pixel-
aligned screenshots show the same shadow span in CSS pixels between a tiny
launch window and the normal full-size window, even though the small artwork is
less than one third the size. When the same hash is loaded in a smaller window,
the bevels and soft shade layers therefore look too broad/graphic and less
physically dimensional. This is not primarily a resize invalidation problem;
the initial filter authoring is preserving a screen-pixel length where the
shade should scale with the artwork's SVG user units. A vertically oriented
monitor or horizontal fullscreen/export context may produce the opposite
problem: blurs/depth reading too small or too shallow relative to the intended
physical artwork size.

**Why this is likely scale-coupled:** `Shade.neuShadeSVGFactory()` accepts
`pixToUserUnits = FRAME.pixToUserUnits`, and `Frame.pixToUserUnits` is a
memoized read of `this.svgElt.elt.getScreenCTM().a`. The shade factory then
constructs a pixel-like offset ladder (`1`, `2`, `4`, `mag / 2`, `mag / 4`,
etc.) and converts offsets back into SVG user units with `offset /
pixToUserUnits`. Blur radii are derived from those converted magnitudes. This
means the generated filter stack can depend on the screen CTM at the moment the
SVG is built. Because filter primitives are not rebuilt on resize/fullscreen,
the launch window scale can become baked into the rendered shade depth.

**Primary suspects:**

1. `Frame.pixToUserUnits` memoization: the value can become stale after
  `windowResized()`, fullscreen entry/exit, or export-orientation changes.
2. `Shade.neuShadeSVGFactory()` offset ladder: it mixes fixed pixel-scale
  offsets (`1`, `2`, `4`) with depth-derived offsets (`mag / n`), then converts
  them through the current screen scale.
3. Layer-count thresholds in `keep()`: the number of shade layers is based on
  the pre-conversion `mag` value, while blur and layer spacing are later
  affected by `pixToUserUnits`.
4. Export path: `Export.exportFrames()` serializes the already-built SVG and
  rasterizes it at the requested output size. If the shade stack was built for
  the live launch viewport, high-resolution or horizontal exports may inherit
  the wrong blur calibration.

**Important clue:** The shadow span can match exactly in screen pixels across
very different SVG display sizes. That points to a mistaken user-unit/pixel
conversion at initial filter construction, not to a browser raster-resolution
artifact and not mainly to missing recomputation on resize.

**Resolution (May 7 2026):** Removed the active `pixToUserUnits` divisions from
the shade offset/blur construction paths in `Shade.neuShadeSVGFactory()` and
retuned the current constants. Results are now fairly consistent between small
and large launch windows. The remaining small-vs-large difference is believed to
come from shade-stack density decisions, especially `offsets.slice(start,
keep())`, rather than from the original constant-screen-pixel unit bug.

**Remaining follow-up:** Before release, run an objective Shade retuning pass
using visual A/B comparison across representative hashes, launch sizes, and
export targets. That pass should evaluate the `keep()` thresholds, offset ladder
shape, blur constants, and whether S-curve shading can be made viable again.

**Initial diagnosis plan:**

1. Capture `FRAME.pixToUserUnits`, `windowWidth`, `windowHeight`,
  `devicePixelRatio`, `frameSize`, and generated `feGaussianBlur`
  `stdDeviation` values for the same hash across at least three launch sizes.
2. Rebuild the same hash after resizing and compare the generated filter attrs
  against resize-without-rebuild. If rebuild changes the shade stack, the bug
  is definitely build-time scale coupling.
3. Compare live vertical, live horizontal/fullscreen, PNG export, and animation
  frame export for the same hash and target size.
4. Treat `Shade.neuShadeSVGFactory()` as the first code target, but do not tune
  visual coefficients until the intended unit model is chosen.

**Release risk:** Lowered from active correctness bug to pre-release polish /
calibration risk. Do not reintroduce screen-CTM-derived conversion into shade
offset or blur authoring unless it is explicitly isolated as a display-adaptive
mode.

### 9.14.11 Frame/Backgrid R-in Masked SVG BBox Crop (Resolved)

*Added: 2026-06-03*

**Status:** ✅ Resolved with scoped `bboxKeeper` in `ShapeGroup.createMaskGroup()`

**Symptom:** A small cluster of recent `lastHash` outputs showed hard side-edge
clipping/cropping on large frame/backgrid `rIn` cuts in the combo shade region.
The artifact looked like a vertical crop of the soft shader/mask region along
the sides while top/bottom expansion still appeared mostly correct.

**Key clue:** Calling `FRAME.backGrid.showShapeGroupsDebug(false)` made the crop
disappear. Setting the debug loft paths to `display:none` made the crop return.
That proved the debug overlay was not fixing shader math; visible/painted
geometry under the same masked parent SVG was changing the browser's effective
bbox / painted bounds.

**Root cause:** The R combo mask is applied to the outer nested
`ShapeGroup.svgElt`, while the filtered content sits inside sibling/child
structures. For these large backgrid `rIn` cases, the browser's effective bounds
for the masked outer SVG were too tight when only the real filtered content was
present. Visible debug loft geometry expanded those effective bounds, so the
masked shade stopped clipping. This was a masked-parent-SVG bbox issue, not a
generic shade filter region problem.

**Fix:** Add `ShapeGroup.createBBoxKeeper()` and call it only for backgrid R
combo masks with `outsetShade`:

```js
if (outsetShade && this.grid?.isBackGrid) this.createBBoxKeeper()
```

The keeper is a zero-opacity filled rect parented to `this.svgElt`, as a sibling
of the filtered `svgGroupElt`, immediately before the mask is applied. Its
layout uses the ShapeGroup's anchor/size with padding expanded by the cut depth.
It gives the masked outer SVG a real child participating in the browser's bounds
calculation without drawing visible geometry.

**Why this is not a broad rollback:** This fix does not reopen generic filter
regions, does not restore broad `ShapeGroup.boundsRect`, does not loosen
`Grid.visibleBoundsRect`, and does not change the limited SVG layout helpers. It
is a targeted browser-bounds shim for one masked backgrid `rIn` combo path.

**Test results:** The keeper continued to work with `fill-opacity: 0` and after
all stroke attributes were removed. Approximately 50 manual outputs looked good
after the fix.

**Related doc:** `docs/Operational/FRAME-RIN-CROP-AUDIT.md`

### 9.14.12 Thin Depth Outline Bug (Resolved)

*Added: 2026-06-17*
*Resolution updated: 2026-06-18*

**Status:** ✅ Resolved — two independent layers (Feature enum limits + shade ladder floor)

**Symptom:** Rare outputs showed cut shading as a single dark outline ring instead
of directional light/dark bands aligned to the light vector.

**Repro designators:**

| Band | Indices | Hashes |
|------|---------|--------|
| Flexible enum repros | #1494, #1518, #1521 | `0x8d31f933…`, `0x08c672bb…`, `0x86ba04c8…` |
| New deterministic band | #1543, #1547–#1549 | `0x171732f4…`, `0xa30e8166…`, `0x73ea44ab…`, `0x6bd1b2ad…` |

The first band used `gridStyle === 'Flexible'` with `cellInset === 'Min'`. The
second band surfaced after the deterministic `lastHash` extension; those outputs
still had shallow combo cuts but were not fully eliminated by Feature-side enum
trimming alone.

**Root cause:** Cut depth (`loft * minCellWidth`) fell into a sub-threshold range
where `Shade.neuShadeSVGFactory()`'s fixed offset anchors (`1`, `2`, `4`) mixed
with depth-derived offsets. When `keep()` retained too few decay layers at low
`mag`, the stack collapsed toward a single anchor — visually a dark outline rather
than directional shading (see §9.14.10 for related shade-ladder context).

**Resolution 1 — prevent thin geometry (`Features.js`):** Determinism-safe enum
trimming before the relevant `feature(r)` draws — no new PRNG calls, no reordering
of existing draws:

1. **`#calcX()` — existing + one addition:**
   - `x > 4` + Flexible: `cellOutset.removeLastOption()` and
     `frameWidth.removeOptions(['Large'])` (pre-existing)
   - `x > 3`: progressive `cellOutset.removeLastOption(...)` (pre-existing)
   - **`x > 2` + Flexible + `cellAspect === 'Wide'`:** additional
     `cellOutset.removeLastOption()`

2. **`#calcFrameProps()` — Flexible branch:**
   - After `cellOutset` is known, before `frameWidth.feature(r)`:
     - if `cellOutset > 0.7` → `frameWidth.removeLastOption()`
     - if `cellOutset > 0.8` → `frameWidth.removeLastOption()` again
   - Prevents high-outset grids from also drawing the widest frame options, which
     further compresses cell size and pushes cuts into the thin-depth range.

Fixed #1494, #1518, #1521 in practice.

**Resolution 2 — shade ladder floor (`neuMark_I.js`):** In `neuShadeSVGFactory()`,
the `keep()` helper returns the minimum number of shade layers retained when
`sqrt(mag) < 3` (i.e. `mag < 9`). Changed the floor from **`3` → `4`** (line ~372).

*Why it works:* Below the `mag >= 9` threshold, the halving ladder is short. With
only three retained layers, the pre-seeded fixed anchors (`1`, `2`, `4` in the
offsets array) dominate the visible stack — one offset magnitude reads as a uniform
outline. Keeping four layers preserves one additional decay step so depth-derived
offsets participate and directional light/dark bands remain legible.

*Scope:* Rendering-side only. Does not change cut geometry, cascade step count, or
feature rarity. Complements Resolution 1 when cuts are legitimately shallow (e.g.
cascade steps, frame bands) rather than globally cramped Flexible grids.

Fixed remaining deterministic-band repros #1543, #1547–#1549.

**Approaches tried and rejected:**

| Approach | Location | Outcome |
|----------|----------|---------|
| Proportional shade ladder when `mag < 6` | `neuMark_I.js` `neuShadeSVGFactory()` | No visible difference on early repro hashes; reverted |
| Conservative `#estimateFlexMinCellSize()` + `#trimCellOutsetForThinDepth()` | `Features.js` `#calcX()` | Too aggressive/complex; reverted in favor of Resolution 1 |

**Related (separate issue):** Cascade cut layers getting too thin — geometry-side
limiter work; not addressed by `keep()` floor. See sprint notes / future cascade
amount caps in `ProtoMill.mkFrame()` and `cutIslands()`.

**Diagnostics (optional):** `reportThinDepthShadeHealth()` in
`testing/WrapperTestHarness.js` flags shallow combo cuts whose offset stacks look
anchor-dominated (archived `DEBUG_NEUSHADES` probe in `archive/thinDepthProbe.mjs`).

**Baseline tag:** `features-calc-v1-submission` marks the commit before Feature
calc changes for this bug; post-submission wrap debugging can diff against it.

### 9.14.13 Thin r-Out Outline Bug (Deferred)

*Added: 2026-06-17*

**Status:** ♻️ Deferred post-submission — not prevalent enough to block test-bench upload

**Symptom:** Rare outputs show r-Out cut shading as a thin dark outline rather than
full directional light/dark bands (similar family to §9.14.12 thin depth, but on
r-Out profiles).

**Repro designators (v1 FeatureSet required):** #1490, #1491, #1521, #1522, #1532
(`0xd900f863…`, `0x1d3b6e65…`, `0x7b5ad1f2…`, `0x9bec1edc…`, `0x9928c9c3…`).

**Notes:** Audited in lastHash band 1480–1522 (June 2026). Fix deferred until after
Art Blocks submission; repro requires `features-calc-v1-submission` checkout — see
[LASTHASH-V1-REPRO-MANIFEST.md](LASTHASH-V1-REPRO-MANIFEST.md).

## 9.15 Performance Optimization Strategy

**Status:** 🟡 Audited — low-risk live-animation cleanup completed;
aggressive cache/video paths deferred

**Context:** The § 9.14.1 three-layer fix achieved broad visual coverage across
the historical hash pool, but one part of it is now known to be overbroad:
`ShapeGroup.boundsRect` returns FRAME for every cut. This section preserves the
performance history and defines the revalidation path after that rollback.

**Goals:**
1. Preserve visual correctness and synchronized light timing.
2. Improve real-time animation where possible without quality tiers or
  renderer-specific hacks.
3. Keep heavier cache/video paths documented for exhibition contexts rather
  than making them release blockers.

**2026-05-07 live-animation audit:** the current bottleneck is SVG filter
paint/raster work after animated `feOffset` attributes change. On the current
main hash, JavaScript offset writes were well under 1ms while effective light
updates remained around 4.5-5fps on the test machine. `AnimationController` is
therefore treated as a clock/sync controller and instrumentation point, not as a
self-calibrating performance optimizer.

### 9.15.1 What Was Sacrificed

Three optimizations were broadened for correctness. Each adds GPU/CPU
overhead to every frame of animation and to initial render:

#### Sacrifice A — ShapeGroup viewport broadened to FRAME bounds

**Before:** Each ShapeGroup's SVG viewport was sized to its tight
`cellBounds` — the exact bounding box of its constituent cells. Small
ShapeGroups had small viewports, meaning the browser only composited
a small pixel region.

**Current:** All cut ShapeGroups use `FRAME.boundsRect` `(0, 0, 100, 200)`
as their viewport. Every cut ShapeGroup is now frame-sized regardless of
how many cells it covers. This is no longer accepted as a final state.

**Performance/correctness cost:** The browser composites the **full frame area**
for every ShapeGroup, not just the area the ShapeGroup actually
occupies. For a grid with many small ShapeGroups, this is a significant
multiplier on pixel fill. It also poisons geometry-based diagnostics because
the reported bounds no longer describe the group.

**Code location:** ProtoLayerObjects `boundsRect` getter (L1732-1738)
```js
// CURRENT (overbroad; rollback pending):
if (this.isFrame || this.cut) return FRAME.boundsRect
// TARGET rollback:
if (this.isFrame) return FRAME.boundsRect
return this.cellBounds.boundsRect
```

#### Sacrifice B — `maxLayout` percentage pipeline bypassed

**Before:** `ProtoCut.maxLayout` (neuMark_I L149-164) computed tight
percentage-based filter margins per cut by iterating all ShapeGroups,
calculating `padding / insetSize * ±100` for each, and taking the max.
This gave each `<filter>` element the tightest possible percentage
bounds that still contained all filter effects for all ShapeGroups
sharing that filter.

**After:** `setLayouts()` sets `filterUnits="userSpaceOnUse"` with
fixed FRAME bounds `(0, 0, 100, 200)`. The percentage pipeline
(`maxLayout`, `finalSize`) is entirely dead code.

**Performance cost:** Every filter processes the **full frame area**
(20,000 user-unit² at 100×200) instead of a tight bounding box around
the actual filter effect extent. For small ShapeGroups with shallow
cuts, the old percentage margins might have covered 5-20% of the frame
area. Now they all process 100%.

**Dead code to preserve — `ProtoCut.maxLayout` (neuMark_I L149-164):**
```js
get maxLayout() {
  let [xMax, yMax, widthMax, heightMax] = [0, 0, 0, 0]
  this.shapeGroups.forEach(grp => {
    const
      [size, padding] = [grp.insetSize, grp.padding],
      padSize = Vertex.div(padding, size),
      anchor = Vertex.mult(padSize, -100),
      newSize = Vertex.mult(padSize, 200).add(vert(100))
    xMax = min(anchor.x, xMax)
    yMax = min(anchor.y, yMax)
    widthMax = max(newSize.x, widthMax)
    heightMax = max(newSize.y, heightMax)
  })
  return { x: xMax, y: yMax, width: widthMax, height: heightMax }
}
```

**Dead code to preserve — `ShapeGroup.finalSize` (ProtoLayerObjects L1743-1753):**
```js
get finalSize() {
  const
    insetLayout = { x: this.insetAnchor.x, y: this.insetAnchor.y,
                    width: this.insetSize.x, height: this.insetSize.y },
    maxLayout = this.cut?.maxLayout || 100
  return {
    x: insetLayout.x * maxLayout.x / 100,
    y: insetLayout.y * maxLayout.y / 100,
    width: insetLayout.width * maxLayout.width / 100,
    height: insetLayout.height * maxLayout.height / 100,
  }
}
```

#### Sacrifice C — `overflow: visible` on ShapeGroup SVGs

**Before:** Default `overflow: hidden` on ShapeGroup SVGs
allowed the browser to skip compositing any pixel output extending
beyond the viewport. This is a free GPU-level clip optimization.

**After:** `overflow: visible` on cut ShapeGroup SVGs allows filter effects
(shadows, highlights) to bleed beyond the ShapeGroup viewports. Grid-level
overflow was tested historically but is currently commented out. The FRAME SVG
and final mask provide the hard visible clip.

**Performance cost:** The browser can no longer skip compositing for
pixel data outside ShapeGroup viewport bounds. Combined with
Sacrifice A (FRAME-sized viewports), this means every ShapeGroup's
filter output is composited across the full frame.

**Code locations:**
- `ShapeGroup.assignElement()` — ProtoLayerObjects L1790:
  `if (this.cut) this.svgElt.attribute('overflow', 'visible')`
- `Grid.assignElement()` has the old overflow line commented out.

### 9.15.2 Why These Sacrifices Were Necessary

The percentage-based approach (`objectBoundingBox`) coupled ShapeGroup
viewport size to filter region size. When viewports were tight (per
cell bounds), the percentage margins needed to be proportionally larger
to contain deep filter effects. But filter definitions are **shared**
across all ShapeGroups using the same cut — a single set of percentage
margins had to work for the widest and the narrowest ShapeGroup
simultaneously. This coupling made correctness brittle:

- **Tight viewport + tight percentage margins** → filter cropping on
  larger ShapeGroups
- **Tight viewport + wide percentage margins** → correct for large
  groups, but wasteful for small ones
- **Wide viewport (FRAME) + percentage margins** → regression: FRAME-
  sized viewport made percentage margins even thinner proportionally

The `userSpaceOnUse` approach **decouples** viewport size from filter
region calculation. Filter bounds are expressed in absolute user units,
not relative to the viewport. This means filter sharing works correctly
regardless of ShapeGroup viewport differences — which is why the broad
FRAME-sized approach is both correct and compatible with filter sharing.

### 9.15.3 Incremental Re-Optimization Plan

**Principle:** Start from the correct broad state, tighten one layer at
a time, test with the full hash suite after each change. Never sacrifice
correctness.

#### Tier 1 — Low-Risk Quick Wins (no viewport changes)

These optimizations don't touch the viewport/filter-region system:

**1b. Combo cascade mask region tightening** (§ 9.14.1 June 2026 submission fix)
- Current: `maskRect` and final `<mask>` use `FRAME.anchor/size` for all
  combo+R `createMaskGroup()` calls (artwork-wide `(0,0,100,200)`).
- Optimized: union of cascade/wave ShapeGroup cell bounds + `cut.depth` bleed
  (and/or shape-path bbox), capped at FRAME — per-group mask luminance field.
- Impact: largest Safari win for hashes with many masked cascade layers in one
  cell; must not reintroduce cell-tight `layoutLimited` crop on `maskRect`.
- Blocked until: reliable per-cascade bounds helper (likely shares Tier 1b
  shape-union infrastructure).

**1c. Per-profile padding precision** (§ 9.14.2 notes this)
- Current: `ProtoCut.padding = depth * 2` for all profiles
- Optimized: vary by profile type:
  - `hasInsetShade` (rOut, jIn, iIn): `depth * 1` (shade extends inward)
  - `hasOutsetShade` (rIn, jOut, iOut): `depth * 2` (shade extends
    outward)
  - `hasCastShadow`: add `castShadowVector` magnitude
- Impact: shrinks mask region for ~50% of profiles, no effect on filter
  region (which uses FRAME bounds, not padding)

**1b. Filter region tightened to actual content bounds**
- *2026-04-28: ATTEMPTED, BLOCKED. See § 9.15.6 for measurements. The
  union of `shapeGroups[*].boundsRect` collapsed to FRAME for every
  cut due to § 9.14.1 cascade broadening, so that tier produced zero
  area reduction.*
- *2026-05-11: unblock condition changed. Re-attempt after removing the
  `this.cut` branch from `ShapeGroup.boundsRect`, then compare true cell-bound
  unions against current FRAME-wide regions. Do not wait for a full §9.11
  maskShape rebuild if the rollback itself restores meaningful bounds.*
- Current: filter region = FRAME `(0, 0, 100, 200)` for ALL cuts
- Optimized: compute per-cut AABB from all ShapeGroup cell bounds,
  expand by `padding`, clamp to FRAME bounds
- This is a `userSpaceOnUse` equivalent of what `maxLayout` did with
  percentages — but in absolute coordinates, so viewport size doesn't
  affect it
- Implementation: in `setLayouts()`, compute the union bounding box
  of `this.shapeGroups.map(g => g.cellBounds.boundsRect)`, expand by
  `this.padding`, then `clamp(result, FRAME.boundsRect)`
- Impact: for cuts with shapes in one corner of the frame, filter
  processes 25-50% of the pixel area instead of 100%

**1c. Animation hot-loop cleanup**
- 2026-05-07: completed.
- `AnimationController` now caches raw DOM `feOffset` nodes instead of resolving
  `S.offsetElts` every frame.
- The hot loop uses direct `setAttribute()` calls rather than p5 wrapper
  `.attribute()` calls.
- Debug overlay now shows real RAF FPS, actual light-update FPS, offset count,
  and recent JavaScript batch time.
- Removed legacy `getMaxFPS()`, `optimizeFrameRate()`, `isCalibrating`,
  `batchSize`, and `frameTimes`: they measured cheap JS writes, not renderer
  paint/raster throughput, and could push the controller to fight the browser.
- Do not split offset batches across visual frames for this release. It would
  make different shadow layers temporarily disagree about light direction and is
  therefore a quality/temporal-coherence tradeoff.

#### Tier 2 — Viewport Tightening (requires careful testing)

**2a. Restore tight ShapeGroup viewports WITH overflow:visible**
- This is now the immediate rollback/revalidation path, not a distant tier.
- Currently both broadened viewports AND overflow:visible are set
- With `overflow: visible`, the viewport is just a coordinate system
  origin — the browser doesn't clip at the viewport boundary
- Test: restore `this.cellBounds.boundsRect` for `boundsRect` while
  keeping `overflow: visible`
- **Risk:** The `userSpaceOnUse` filter region uses FRAME coordinates,
  and the ShapeGroup viewBox defines the local coordinate system. If
  `viewBox = cellBounds` instead of FRAME, the user-unit coordinate
  mapping changes and filter coordinates may not match shape coordinates
- **Mitigation:** This works IF the ShapeGroup's viewBox establishes
  the same coordinate system as FRAME (i.e. viewBox origin = FRAME
  origin, not cellBounds origin). Must verify that viewBox `(0, 0,
  100, 200)` vs viewBox `(cellX, cellY, cellW, cellH)` doesn't
  remap the filter's `userSpaceOnUse` coordinates

**2b. Selective overflow:visible — only on cascade ShapeGroups**
- Non-cascade cuts (regular shapes) may not need overflow:visible
  if their filter effects fit within their viewport
- Test: `overflow: visible` only when `this.isFrame ||
  this.islands.some(i => i.cascadeLevel > 0)` or equivalent
- Impact: non-cascade ShapeGroups get free GPU clipping back

**2c. Grid overflow:visible only when needed**
- Grid `overflow: visible` was added for grid-layer cascades where
  outset profiles extend beyond cell grid boundaries
- Test: `overflow: visible` only on grids that contain cascade cuts
  or r-in profiles

#### Tier 3 — Filter Region Tightening (highest impact, highest risk)

**3a. Per-ShapeGroup `userSpaceOnUse` filter regions**
- Instead of sharing one filter region across all ShapeGroups per cut,
  set `userSpaceOnUse` bounds per ShapeGroup based on its cellBounds +
  padding
- **Problem:** This breaks filter sharing — each ShapeGroup would need
  its own `<filter>` element with different x/y/width/height
- This is the most impactful optimization (filters process only needed
  pixels) but requires filter cloning
- Could be combined with the Safari fix (§ 9.14.4b) which already
  suggests cloning filters per ShapeGroup

**3b. Hybrid: group ShapeGroups by spatial proximity**
- Instead of one filter per cut (current) or one per ShapeGroup (3a),
  group ShapeGroups into spatial clusters and share filters within
  each cluster
- Filter region = cluster bounding box + padding
- Fewer filters than 3a, tighter regions than current

#### Tier 4 — Animation-Specific Optimizations

**4a. Differential offset updates**
- Current: every frame, ALL `S.offsetElts` get new `dx`/`dy` values
  via `setAttribute`
- Optimized: track previous shadow angle, skip updating elements
  whose `dx`/`dy` change is below a perceptual threshold (sub-pixel)
- Impact: reduces DOM mutations per frame, especially at slow rotation
  speeds where frame-to-frame angle change is tiny
- Status: deferred. Exact no-op skips are safe but probably too rare to matter;
  threshold skips are likely visually harmless at tiny thresholds but still
  count as intentional temporal quantization.

**4b. CSS transform animation instead of SVG attribute mutation**
- Investigate whether the shadow offset could be animated via CSS
  `transform: translate(dx, dy)` on the filter wrapper `<g>` instead
  of mutating `feOffset` `dx`/`dy` attributes
- CSS transforms can be GPU-composited without layout/paint
- Status: not recommended for current architecture. The animated values are SVG
  filter primitive offsets, and moving a wrapper with CSS does not preserve the
  same neumorphic shadow-vector semantics. CSS/WAAPI/SMIL would still leave the
  filter renderer doing paint/raster work for equivalent `feOffset` animation.

**4c. `will-change` / `contain` CSS properties**
- Add `will-change: transform` or `contain: paint` to animated
  SVG elements to hint the browser to promote them to GPU layers
- Must verify SVG element support (may only work on certain elements)
- Status: low confidence. These hints help compositor-friendly properties, but
  the measured bottleneck is SVG filter rasterization, not layer composition.

**4d. Reduce offsetElt count via filter consolidation**
- Each ProtoFilter creates one or more `feOffset` elements pushed to
  `offsetElts` (ProtoFilter L122)
- If multiple filter primitives share the same magnitude, they could
  share an offset group updated by a single parent transform
- Reduces per-frame `setAttribute` calls
- Status: deferred. Current JavaScript write time is already small; meaningful
  improvement would require changing filter topology or visual grouping.

**4e. Progressive raster frame cache**
- Possible future path: render a coarse ring of cached frames first, play those
  cheaply through canvas, then fill missing intermediate frames in the
  background.
- Example: a `20π`-second revolution needs ~754 frames for 12fps. A 248-frame
  cache is about 4fps; it does not add linearly to live SVG rendering, but can
  become smoother as more missing frames are generated.
- Practical cache shape: compressed blobs on disk (IndexedDB / Cache API / OPFS)
  plus a small decoded `ImageBitmap` ring buffer in memory.
- Grayscale art should compress well, but normal browser canvas/ImageBitmap
  playback generally expands decoded frames to RGB/RGBA surfaces.
- Full 4K decoded revolution cache is not practical: 3840×2160×4 bytes is about
  31.6 MiB per frame; ~754 decoded frames would exceed 20 GiB.
- Status: deferred. This is promising for a later playback engine, but too large
  for the current optimization phase.

**4f. Pre-rendered exhibition video**
- For contexts that require smooth synchronized playback, render clean videos
  ahead of time and coordinate sync with the gallery's playback stack.
- This is operationally more appropriate than forcing the live browser/SVG
  renderer to provide exhibition-grade animation.
- Status: recommended future exhibition path, not a release blocker.

### 9.15.4 Load Time Optimization (Separate from Animation)

Initial load involves constructing the full SVG DOM. Key costs:

**4e. Profile the setup pipeline**
- Measure time from `setup()` entry to `animationController.globalAnimation()`
- Identify which phase dominates:
  - Feature generation (`Features.js`)
  - Grid/cell construction (`Grid.js`)
  - Island detection + grouping (`ProtoLayerObjects.js`)
  - Wrapping (`maximizeCuddles` etc.)
  - SVG element creation (`assignElement`, `createSVGGroup`)
  - Filter construction (`#createFilters`, `buildFilter`)
  - `setLayouts()` (currently trivial — just attribute setting)
  - SVG rendering (browser paint after DOM construction)

**4f. Lazy filter construction**
- Filters are created for every cut during setup, even if the hash
  produces shapes with no visible filter effects (e.g. very shallow
  depth where the filter is sub-pixel)
- The commented-out guard in `#createFilters()`:
  `// if (abs(this.depth) < 0.25 / FRAME.pixToUserUnits) { return }`
  could be re-enabled to skip sub-pixel filters
- Impact: fewer DOM elements, fewer `offsetElts` to animate

**4g. Deferred SVG construction**
- Build the SVG DOM in a `DocumentFragment` or off-screen, then
  append once complete
- Prevents layout thrashing during construction

### 9.15.5 Measurement Baseline (To Do Before Optimizing)

Before implementing any optimization, establish baselines:

1. **Initial load time:** `performance.now()` at `setup()` entry vs
   `animationController.globalAnimation()` start
2. **Per-frame animation cost:** Use the debug FPS overlay and
  `AnimationController.batchTimeSamples`; do not rely on removed calibration
  fields.
3. **offsetElt count:** Already displayed in debug FPS overlay
   (`DeBugging.js L353-354`)
4. **ShapeGroup count per hash:** `S.ShapeGroups.db.length`
5. **Filter count per hash:** `S.Effects.db.length`
6. **DOM element count:** `document.querySelectorAll('*').length`

The old `AnimationController.optimizeFrameRate()` path was removed because it
measured JavaScript write time rather than browser paint/raster throughput.
Future adaptive logic, if needed, should use measured effective light FPS / RAF
health rather than local batch write cost.

---

### 9.15.6 Safari Perf Investigation Apr 28 2026 (canvas-image-swap path)

*Last audited: 2026-04-28 — Safari rasterization wall confirmed; tight-region path architecturally blocked; canvas-image-swap chosen.*

**Status:** Decision made — abandon further SVG pipeline optimization
on Safari, ship a UA-detected canvas-image-swap fallback. Most code
added during the Apr 28 investigation is **diagnostic scaffolding that
must be removed** once the swap path lands.

**What we measured (hash 1487, FOSL):**

| Config                                | Total | Build | Paint | Region area / filter | Region total |
|---------------------------------------|------:|------:|------:|---------------------:|-------------:|
| Baseline `(-50,-50,200,300)` userSpace | 11831ms | 330ms | 11501ms | 55,789 u² | 1,060,000 u² |
| Tier 1b "tight" union AABB             | 10564ms | 360ms | 10204ms | 55,789 u² | 1,060,000 u² |

Speedup: 1.12× — within noise. Filter-region area was **identical** in
both configs.

**Why Tier 1b produced zero area reduction:**

`ShapeGroup.boundsRect` (ProtoLayerObjects.js L1732, § 9.14.1 cascade
broadening) returns `FRAME.boundsRect` for any group where
`isFrame || cut`. Every ProtoCut's consumer ShapeGroups are cut groups
by definition, so the union of their `boundsRect` collapses to FRAME
for every cut. Tier 1b cannot deliver any savings until § 9.14.1
cascade broadening is unwound (i.e., until the §9.11 maskShape rebuild
allows tight per-group bounds for cuts).

**Other findings ruled out:**

- Coverage hole hypothesis (`SAFARI_FORCE_ISOLATE_OVER_FILTER`)
  refuted: 4/4 masks were already isolated at baseline; ratio = 1.0.
  Forcing isolation over already-filtered elements changed nothing.
- §9.14.7 banding regression returns immediately if filter region
  edges coincide with mask edges. The +50 margin past FRAME edges in
  the Mar 7 / Apr 28 fix is a hard constraint and must be preserved
  by any future region-tightening pass.

**Conclusion:**

WebKit's pre-LBSE software SVG filter pipeline is the cost driver.
Total cost ≈ region_area × primitive_count, both of which we cannot
reduce without architectural rework. The pragmatic path is:

1. Render the SVG once (full quality).
2. Rasterize to a bitmap (SVG → blob URL → `<img>` or canvas).
3. Swap the `<img>` in over the live SVG before animation starts.
4. Keep the SVG on Chromium / non-Safari engines.

This sidesteps the filter rasterizer entirely on Safari. Trade-off:
shadow rotation animation will be lost on Safari (or implemented as
CSS hue-rotation / pre-rendered keyframes). Acceptable.

#### 9.15.6.1 Apr 28 2026 Tear-Out Plan

The Apr 28 investigation added diagnostic code in **four** places.
Most of it is throwaway. The boundaries below are what must be kept,
removed, or kept-with-flag once canvas-image-swap is shipped.

**KEEP (long-term):**

- `neuMark_I.js` — `ProtoCut.setLayouts()` userSpaceOnUse path with
  fixed `(-50, -50, 200, 300)` region. This is the §9.14.7 banding
  fix and the only thing that made deep cuts visible on Safari before
  any swap happens. Required even with image-swap because the SVG
  must render correctly once before being rasterized.
  - Specifically: the `if (useUserSpaceFix)` branch (the one WITHOUT
    `useTight`).
  - Flag: `window.SAFARI_FILTER_REGION_USERSPACE_FIX` (default true).
    Keep flag for emergency revert.

- `safariCompat.js` — the existing group-isolate workaround
  (`SAFARI_GROUP_ISOLATE_WORKAROUND`) is unrelated to today's work
  and stays.

**REMOVE (no value retained — tear out alongside image-swap PR):**

1. **`neuMark_I.js`** — Tier 1b tight-region branch in
   `ProtoCut.setLayouts()`:
   - The entire `if (useUserSpaceFix && useTight) { … }` block.
   - The `useTight` const declaration.
   - The "Tight-region flag" line in the block comment above
     `setLayouts()`.

2. **`safariCompat.js`** — Apr 28 perf-attack scaffolding:
   - `SAFARI_FORCE_ISOLATE_OVER_FILTER` flag init (sessionStorage
     hydration block).
   - `SAFARI_FILTER_REGION_TIGHT` flag init.
   - `wrapForIsolation(elt)` function and its call inside
     `applyGroupIsolateToElement()` (the
     `if (!window.SAFARI_FORCE_ISOLATE_OVER_FILTER) return` /
     `wrapForIsolation(elt)` block).
   - `measurePerf()`, `measureAcrossFlags()`, `measureTightRegion()`
     functions.
   - `resolveHashFromIndex()` helper used only by `measurePerf`.
   - All three from the public `SafariCompat` export object.

3. **`gui.js`** — `keyPressed()` diagnostic probes:
   - "SAFARI B1 EXPERIMENT 1" block (keys `0`/`1`/`2`/`3`,
     filter/mask strip).
   - "SAFARI B1 EXPERIMENT 2" block (keys `4`/`5`, force-fill).
   - "SAFARI B1 EXPERIMENT 3" block (keys `6`/`7`/`8`,
     stdDev/offset/chain throttling).
   - "SAFARI B1 EXPERIMENT 4" block (keys `9`/`q`/`w`, global
     clamp + region override + overflow strip).
   - All four blocks are clearly delimited by their `// SAFARI B1
     EXPERIMENT N` headers and the `(Apr 28 2026, temporary — remove
     after diagnosis)` marker — grep for `B1 EXP` to find them all.

**KEEP-WITH-FLAG (defer decision until after image-swap ships):**

- None. If image-swap works, the entire Apr 28 layer is dead code.

**Verification after tear-out:**

- Hash 1487 in Chrome must still render identically (visual diff).
- Hash 1487 in Safari must render correctly (slowly) before image-swap
  takes over — confirms `SAFARI_FILTER_REGION_USERSPACE_FIX` path is
  intact.
- `SafariCompat` public API should drop `measurePerf`,
  `measureAcrossFlags`, `measureTightRegion` — verify no other code
  references them.
- `grep -rn "B1 EXP\|SAFARI_FILTER_REGION_TIGHT\|SAFARI_FORCE_ISOLATE_OVER_FILTER\|wrapForIsolation\|measurePerf\|measureAcrossFlags\|measureTightRegion"`
  should return zero hits after tear-out (in source files; doc
  references in this section are fine).

#### 9.15.6.2 Why Tier 1b Was Worth Trying Anyway

Even though it produced zero area reduction, the experiment was
cheap (~30 min) and it conclusively eliminated "filter region size"
as a tunable lever on Safari without architectural rework. Without
this measurement we would have spent more time on Tier 2/3 region
work that would have hit the same § 9.14.1 wall. The tear-out
checklist above is the receipt: we run it, we get back to a clean
baseline, no regret debt.

---

## 9.16 ProtoBatch Teardown Completeness (Open)

**Status:** Possibly mitigated (2026-06). Not reproduced in ~1 month of active
dev. Triage rule unchanged — treat as leading suspect if `n`-key degradation
returns. Low priority for ArtBlocks (full page reload per token); monitor for
public generator (long-lived sessions).

**Symptom.** After one or more `n` (new seed) keypresses, the build
occasionally lands in a degraded state:

- Some shading layers are missing from the render.
- Inset / outset behavior misfires (cells render flat or with the
  wrong direction).
- The state is not visually identifiable from a clean build until you
  notice the missing layers — there is no thrown error.

The issue is intermittent and does not reproduce on a fresh page
load of the same hash. Root cause is therefore almost certainly
**incomplete teardown** leaving stale references in module-level or
global state that the next build inherits and misuses.

**Suspected leak surfaces.**

1. **`S` (ProtoStore)** — `setupPrefs()` reassigns `S = new Store()`,
   but anything attached to the previous `S` that is referenced from
   *another* surviving global will keep a stale store alive. Audit
   every closure or registry that captures `S` directly.
2. **Filter `<defs>` accumulation** — BG-div removal in `teardown()`
   should cascade-remove all filter defs (they live inside
   `FRAME.bleed.elt`). If any module-level filter ID registry exists
   independent of the DOM, it will outlive teardown.
3. **ProtoLayer / ShapeGroup caches** — anything memoized at the
   class or module level (not the instance level) will outlive
   teardown. Memoize keys that include build-specific identifiers
   are particularly risky.
4. **Random / RuID** — `setupPrefs()` reassigns `R`, `S`, `RuID`, but
   any captured closure over the previous instance will hold its
   used-up state, potentially corrupting determinism downstream.
5. **rAF / event listeners** — `globalControls.animated = false`
   stops the rAF loop, but any explicit listener attached during
   build (e.g. `touchEnded(shadeAnimation)` on `bleed.elt` parent)
   should be cleaned up by BG removal. Verify nothing is attached
   to surviving globals.
6. **`globalControls.shadAngle`** — *resolved 2026-04-29*: teardown
   now resets `shadAngle = 90` so each rebuild starts from a known
   lighting angle.

**Triage rule.** Until this is fixed, any future bug report that
surfaces missing shading layers, broken inset/outset, or stale
filter behavior should treat incomplete teardown as a leading
suspect — particularly when the bug appears only after one or more
`n` presses and never on a fresh page load. First diagnostic step:
reload the page and re-build the same hash. If the bug disappears,
it's a teardown leak; if it persists, it's a true determinism issue.

**Roadmap.** See ROADMAP.md § "ProtoBatch Teardown Completeness"
(tasks T1–T7) for the planned audit and fix sequence.

---

## 9.17 Forward-Compat Bets (Anticipated Platform Changes)

Tracking platform changes we expect to land in the lifetime of the
ArtBlocks deployment. Each entry names the change, what we currently
do to compensate, and what should happen when the change ships.
Reviewed periodically — update entries as the landscape shifts.

| # | Anticipated change | Status (2026-04-29) | Our compensation | What should happen when it lands |
|---|---|---|---|---|
| FC1 | **WebKit LBSE filters enabled by default** in stable Safari. | LBSE shipping incrementally in WebKit nightlies and Safari Tech Preview, gated behind `Layer-based SVG Engine` flag. Filter subsystem still partial. No published timeline. | Loading overlay during render; shadow animation disabled on Safari/WebKit; persistent footer notice ("View on Chrome desktop for full experience"). | Render times drop close to Chromium-class. Overlay completes fast and barely registers. Animation can be re-enabled — but ArtBlocks code is locked, so this happens only via the platform change itself, not a code update. The Safari notice will read as a relic; that's fine. |
| FC2 | **iOS browser engine liberalization**. EU DMA opened iOS to Blink/Gecko in March 2024; UK CMA ruled WebKit mandate anticompetitive in late 2024 (rollout pending); Brazil investigating. Outside the EU, iOS browsers are still WebKit-only. | Mixed: a CriOS/FxiOS UA might be WebKit (most regions) or Blink/Gecko (EU). | UA detection treats *any* iOS browser as Safari-class. False-positive (overlay on a true-Blink CriOS) is cheap; false-negative (no overlay on a WebKit CriOS) is expensive. | When iOS is fully liberalized worldwide and CriOS reliably indicates Blink, we'd ideally narrow the detection. ArtBlocks code is locked, so this just means the overlay shows on iOS Chrome forever — minor visual cost, no functional regression. |
| FC3 | **devicePixelRatio drift on future displays.** New Apple/Samsung devices may report DPR > 3 (e.g. 4× foldables, 6K external displays). | Current detection is DPR-agnostic except where we explicitly compute pixel sizes. | Should continue working; the SVG pipeline is resolution-independent. Revisit any hard-coded pixel-size bounds. None known to be load-bearing. |
| FC4 | **Color management: Display-P3 / Rec.2020 default in browsers.** Browsers may default to wide-gamut color profiles, slightly shifting how our `oklch()` colors render. | Currently sRGB assumed in `color.js` / `oklch2rgb.js`. | If colors visibly drift, that's a platform-level change and our values were approximate anyway — collectors viewing on a wide-gamut display will see *more accurate* colors than we currently render in sRGB. Not a regression. |
| FC5 | **CSS / SVG spec evolutions.** New CSS features may render some current workarounds redundant (e.g. `filter` performance hints, native CSS containment of SVG filters). | Hand-tuned filter regions, per § 9.14.6 user-unit layout. | No action — the manual approach is correct in any era. Optimizations the platform adds for free just make us faster. |
| FC6 | **Headless render farm changes (ArtBlocks).** ArtBlocks may change its render infrastructure (Chromium version, viewport size, screenshot timing). | Token render relies on Chromium-class behavior and a single screenshot at first-paint. | If timing changes, our build is fast on Chromium so should be fine. Avoid any code that delays first-paint past the screenshot moment. |

**General rule.** When in doubt, optimize for *graceful no-op* on
future platforms, not maximum present-day performance. A loading
overlay that fades in for 50ms on a fast future browser is invisible;
a perf-tuned shortcut that breaks on a future browser is permanent.

---

## 9.18 Feature Calculation Determinism

*Last audited: 2026-06-17 — sprint sequencing and baseline tag strategy documented.*

### 9.18.1 Problem

`FeatureSet.#calcFeatures()` and all subsequent `R` draws share one PRNG stream
per hash. The saved seed corpus in `artBlocks/tokenHash.js` (`lastHash`) was
captured against a specific calculation chain. Reordering, adding, or removing
feature steps — or drawing `shapeInterpreter` while not using it — changes
outputs for **every** hash, not just trait labels.

### 9.18.2 Current Risk

Partial AB Features cleanup in `Features.js` (uncommitted) changes
`publicFeatures` keys only if calc order is unchanged — but planned work
(wiring `window.$features`, removing `shapeInterpreter` draw, internal rarity
metrics) **will** alter determinism unless deferred until after sprint bug fixes.

### 9.18.3 Mitigation

1. Tag or branch **`features-calc-v1-submission`** at the last commit matching
   current saved-seed behavior **before** further calc-chain edits.
2. Reproduce `lastHash` bugs from that tag; apply generation/rendering fixes on
   `artBlocksSprint` without touching `#calcFeatures()` during the sprint.
3. After Art Blocks test-bench upload, resume Features work on a new baseline
   (`features-calc-v2-pre-release`) and re-baseline or dual-list regression hashes.

Full workflow: [FEATURES-AND-DETERMINISM.md](FEATURES-AND-DETERMINISM.md).

### 9.18.4 Related Gaps (not geometry bugs)

- `window.$features` not populated from `publicFeatures` (only `Rotation` today).
- `likelyFailures` / `unlikelyFailures` were referenced but undefined — removed
  from `publicFeatures` in pending cleanup.
- `uniformLofts` reported but loft path in `#calcGroup` is commented out.
- Duplicate commented `FeatureSet` in `ABFeaturesScript.js` — bundle debt.

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-06-17 — §9.18 feature calc determinism*
