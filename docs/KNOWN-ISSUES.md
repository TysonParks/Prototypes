# BoredUI Known Issues & Edge Cases

> **Purpose:** Track active bugs, audit findings, and unresolved edge
> cases in the wrapper system. Organized by issue number for stable
> cross-referencing from code comments.
>
> **Related docs:**
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [ARCHITECTURE](ARCHITECTURE.md) |
> [ROADMAP](ROADMAP.md) |
> [TESTING](TESTING.md)

---

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

**Status:** � Active — cascade and mask cropping fixed; waves+ordinal remains

### 9.14.1 Issue 1: Cascade SVG Cropping (Frame & Grid)

**Status:** ✅ Fixed (both frame-layer and grid-layer cascades)

**Symptom:** Islands with `amount > 1` and `insideCutStyle = 'Cascades'` (or
`'Waves'`) show clipped filter effects — the shadow/highlight bleeds are
cut off at SVG element boundaries. Affects both frame-layer cascades and
grid-layer cascades across all shade layers (combo, high, shad).

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

**Fix — three coordinated changes:**

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

2. **`ShapeGroup.boundsRect` expanded** (ProtoLayerObjects L1732):
   All cut ShapeGroups use `FRAME.boundsRect` as their viewport,
   matching the `userSpaceOnUse` filter coordinate space.
   ```js
   if (this.isFrame || this.cut) return FRAME.boundsRect
   ```
   Safe because `maxLayout` percentage pipeline is bypassed — the
   previous regression (thin percentage margins from large viewports)
   no longer applies.

3. **`overflow: visible`** on ShapeGroup + Grid SVGs:
   - ShapeGroup: `if (this.cut) this.svgElt.attribute('overflow', 'visible')`
     (ProtoLayerObjects `assignElement()` L1790)
   - Grid: `this.svgElt.attribute('overflow', 'visible')`
     (Grid.js `assignElement()` L2327)
   Allows filter effects to extend beyond viewport bounds. The FRAME
   `<svg>` (viewBox `0 0 100 200`) provides final clip.

**Why all three changes were needed:**
- `userSpaceOnUse` alone: filter region large enough, but ShapeGroup
  viewport still clips rendered output at tight cell bounds.
- `boundsRect` alone (without `userSpaceOnUse`): caused regression —
  FRAME-sized viewport + `maxLayout` percentage pipeline = thin margins.
- `overflow: visible` alone: unfiltered backing layers rendered, but
  filter layers still clipped at their percentage-based filter regions.

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

**Dead code note:** `ProtoCut.maxLayout` (neuMark_I L149) and
`ShapeGroup.finalSize` (ProtoLayerObjects L1743) are now dead code —
the percentage pipeline is fully bypassed by `userSpaceOnUse`.

**Key code paths:**
- `setLayouts()`: neuMark_I L169-180 ← **userSpaceOnUse filter bounds**
- `ShapeGroup.boundsRect`: ProtoLayerObjects L1732 ← **viewport expansion**
- `ShapeGroup.assignElement()`: ProtoLayerObjects L1790 ← **overflow:visible**
- `Grid.assignElement()`: Grid.js L2327 ← **overflow:visible**
- `ProtoCut.padding`: neuMark_I L136 (`depth * 2`)
- `applyFilterToElement()`: ProtoFilter L190 (filter wrapper `<g>`)
- `S.Cuts.db...setLayouts()`: sketch.js L765

**Test hashes:** `cascade_frame_crop_1`, `cascade_grid_crop_1` in
WrapperTestHarness.js

### 9.14.2 Issue 2: R-Profile Mask Cropping

**Status:** ✅ Fixed

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

**Phase B — Fix cascade filter cropping (Issue 1)** ✅ Fixed
- Final approach: `ShapeGroup.boundsRect` returns `FRAME.boundsRect` for
  all cascade layers (frame + grid). Single-line fix, filter sharing
  preserved. See § 9.14.1.

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

### 9.14.6 User-Unit Filter Layout (Implemented)

**Status:** ✅ Implemented as part of § 9.14.1 fix

**Summary:** All shade filters now use `filterUnits="userSpaceOnUse"`
with fixed user-unit bounds. The `maxLayout` percentage pipeline is
bypassed.

**Implemented pipeline:**
1. `setLayouts()` (neuMark_I L169) sets `filterUnits="userSpaceOnUse"`
   on each shared `<filter>` element
2. Filter region = `FRAME.boundsRect` expanded by `ProtoCut.padding`:
   `x = -pad.x`, `y = -pad.y`, `width = 100 + pad.x*2`,
   `height = 200 + pad.y*2`
3. `ProtoCut.maxLayout` and `ShapeGroup.finalSize` are now dead code
4. Filter sharing preserved — same coordinate space, same filter def

**Why filter sharing works:** All cut ShapeGroups now have viewports
based on `FRAME.boundsRect` (0, 0, 100, 200), so they share the same
user-unit coordinate system. Since `userSpaceOnUse` filter coordinates
are interpreted in the referencing element's coordinate system, and
the viewBox-to-layout mapping is 1:1 (identity), FRAME coordinates
work identically for all ShapeGroups regardless of position.

**Still remaining — future optimization opportunity:**
- **Per-shade-type precise padding:** `ProtoCut.padding` is currently
  `depth * 2` for all profiles. Precise values:
  - `hasInsetShade` (rOut, jIn, iIn): shade inward, `depth * 1` may
    suffice
  - `hasOutsetShade` (rIn, jOut, iOut): shade outward, `depth * 2`
    needed
  - `hasCastShadow` (iOut, rOut): cast shadow vector magnitude added
  - Reducing padding shrinks filter region & render overhead
- **Dead code cleanup:** Remove `ProtoCut.maxLayout` getter and
  `ShapeGroup.finalSize` getter once the system is stable
- **Safari compatibility testing** (§ 9.14.4) — `userSpaceOnUse` may
  resolve Safari filter cropping too

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-05 — § 9.14.1 complete fix documented (userSpaceOnUse + boundsRect + overflow:visible)*
