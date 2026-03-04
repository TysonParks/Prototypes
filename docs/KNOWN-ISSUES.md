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

**Edge cases deferred to interference audit (ROADMAP § 1 #5):**
- Opposing radiant stacks constraining each other
- `viableInterferenceOrigins` calculation
- `wrapInterferenceCorners` priority/ordering

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-03*
