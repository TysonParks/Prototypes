# BoredUI Geometry Reference
## Rounded Corner Wrapping System

> **Purpose:** Define the geometric vocabulary, relationships, and resolution 
> logic for coordinating rounded corners between neighboring shapes on a grid.
>
> **Audience:** The author (Tyson), collaborating AI, future contributors.
>
> **Living Document:** This evolves with the code. Each section links to 
> the implementing properties/methods in `drawAsSVG.js`.
>
> **Related docs:**
> [KNOWN-ISSUES](KNOWN-ISSUES.md) |
> [ARCHITECTURE](ARCHITECTURE.md) |
> [ROADMAP](ROADMAP.md) |
> [TESTING](TESTING.md)

---

## Table of Contents

1. [Primitives](#1-primitives)
2. [Corner Anatomy](#2-corner-anatomy)
3. [Corner Orientation](#3-corner-orientation)
4. [Arc Geometry](#4-arc-geometry)
5. [Wrapper Taxonomy](#5-wrapper-taxonomy)
   - 5.1 [Spatial Relationships](#51-spatial-relationships)
   - 5.2 [Wrapper Types — Full Taxonomy](#52-wrapper-types--full-taxonomy)
   - 5.3 [In/Out Determination](#53-inout-determination)
   - 5.4 [Tight vs. Loose](#54-tight-vs-loose)
   - 5.5 [Resolution Strategies — ext/recalc/int](#55-resolution-strategies--external--recalculate--internal)
6. [Wrapper Resolution Logic](#6-wrapper-resolution-logic)
   - 6.0 [The Anchor Principle](#60-the-anchor-principle)
   - 6.1 [Resolution Steps (Conceptual)](#61-resolution-steps-conceptual)
   - 6.2 [`maximizeCuddles()` Pipeline](#62-maximizecuddles--the-actual-pipeline)
   - 6.3 [Anchor Violation Points](#63-anchor-violation-points)
   - 6.4 [The `#wrap()` Method](#64-the-wrap-method)
7. [Wrap States](#7-wrap-states)
   - 7.1 [Code States](#71-code-states-current-implementation)
   - 7.2 [Sketch States (Extended Model)](#72-sketch-states-extended-model)
   - 7.3 [State Observation](#73-state-observation)
8. [Dependency Graph](#8-dependency-graph)
- [See Also](#see-also) — links to extracted documents
- [Appendix A: Method Index](#appendix-a-method-index)
- [Appendix B: Direction System Quick Reference](#appendix-b-direction-system-quick-reference)
- [Appendix C: Sketch Reference](#appendix-c-sketch-reference)

---

## 1. Primitives

### ProtoSegment

A directed edge of a shape's perimeter. Always axis-aligned (cardinal).

| Property | Type | Description |
|----------|------|-------------|
| `start` | Vertex | Starting point (connects to previous segment's `end`) |
| `end` | Vertex | Ending point (connects to next segment's `start`) |
| `direction` | Direction | Numerical rotation: Up(0), Right(1), Down(2), Left(3). Compounds: UpRight(0.5), DownRight(1.5), DownLeft(2.5), UpLeft(3.5) |
| `sideDir` | Direction | The outward-facing normal of this edge |
| `cells` | [Cell] | Grid cells this segment spans |
| `points` | [Vertex] | Vertices along this segment at cell boundaries |
| `shape` | Shape | The parent shape this segment belongs to |

### Corner

The junction between two consecutive ProtoSegments. Not a separate object — 
it's defined by the relationship between a segment and its `endNeighbor`.

**The corner "belongs to" the first segment.** When we say "this segment's corner," 
we mean the corner at `this.end` / `this.endNeighbor.start`.

```
  this segment          endNeighbor
  ─────────────●─────────────→
               ↑
          corner vertex
          (this.end)
```

### Turn

The directional change at a corner. Full-turns and half-turns ("shy" turns).

| Turn | Value | Visual | Meaning |
|------|-------|--------|--------|
| Right | `R` / `1` | `╮` | Full right turn → **outside corner** (convex) |
| Slight Right | `SR` / `0.5` | `⌐` | Half right turn → shallow outside bend |
| Straight | `S` / `0` | `─` | No turn → flat segment continuation |
| Slight Left | `SL` / `-0.5` | `¬` | Half left turn → shallow inside bend |
| Left | `L` / `-1` | `╭` | Full left turn → **inside corner** (concave) |

Half-turns (`SL`, `SR`) occur when segments meet at 45° — i.e., when one
segment is cardinal and the neighbor is a compound direction.

**Code:** `this.turns.end` → the turn at THIS segment's corner.

### EdgePart

A segment's **part** is classified by the turn-pair at its start and end.
The start turn is the turn entering this segment; the end turn is the turn
leaving it.

| EdgePart | Start → End | Turns | Meaning |
|----------|-------------|-------|---------|
| `F` | S → S | Flat → Flat | Straight run, no corners |
| `CSI` | S → L | Flat → Inside | Corner-start inside |
| `CSO` | S → R | Flat → Outside | Corner-start outside |
| `CEI` | L → S | Inside → Flat | Corner-end inside |
| `CEO` | R → S | Outside → Flat | Corner-end outside |
| `StI` | R → L | Outside → Inside | Straddling inside |
| `StO` | L → R | Inside → Outside | Straddling outside |
| `UI` | L → L | Inside → Inside | U-turn inside |
| `UO` | R → R | Outside → Outside | U-turn outside |

**Code:** `this.part` → `EdgePart` instance. `this.part.value` → string key.
`this.isUTurnOut` → true when part is `UO`.

---

## 2. Corner Anatomy

A corner consists of two half-edges meeting at a vertex, with an arc 
connecting them.

```
         cubicEndVert          cubicStartVert
              ●                     ●
              |       ╲ arc ╱       |
              |        ╲   ╱        |
  this seg    |          ● ←── arcCerVert
  ────────────┤          corner     ├──────────
              |          vertex     |   endNeighbor
              |                     |
              ●                    
         arcOrigin ← center of the arc circle
```

### Key Vertices

| Vertex | Code | Description |
|--------|------|-------------|
| Corner Vertex | `this.end` | The sharp corner point before rounding |
| Arc Start | `this.finalCubicEndVert` | Where the arc begins (on this segment) |
| Arc End | `this.endNeighbor.finalCubicStartVert` | Where the arc ends (on endNeighbor) |
| Arc Center | `this.arcCenterVert` | Midpoint of the arc curve (at 45°) |
| Arc Origin | `this.arcOrigin` | Center of the circle that defines the arc |

### Key Measurements

| Measurement | Code | Description |
|-------------|------|-------------|
| Arc Radius | `this.arcRadius` | Distance from arcOrigin to arcStart (or arcEnd) |
| Available Start Length | `this.availableStartLength` | How far the arc can extend toward this segment's start |
| Available End Length | `this.availableEndLength` | How far the arc can extend toward this segment's end |
| Max Arc Radius | `this.maxArcRadius` | Largest possible arc radius for this corner |
| Min Arc Radius | `this.minArcRadius` | Smallest possible arc (= `cellRadius`) |
| Flat Amount | `this.flatAmount` | Straight-line distance between cubicStartVert and cubicEndVert (0 = fully curved) |

---

## 3. Corner Orientation

Each outside corner faces one of four diagonal directions, identified by the
`Corner` class using numerical values:

```
     UpLeft(3)  ╮  UpRight(0)
                │
  DownLeft(2)   ╰  DownRight(1)
```

Corner values relate to Direction: `corner.direction` = `Direction` at
`corner.value - 0.5`. For example, `UpRight(0).direction` = `Direction(3.5)` = `UpLeft`.

| Corner | Value | `.direction` | Direction Value |
|--------|-------|--------------|-----------------|
| UpLeft | 3 | DownLeft | 2.5 |
| UpRight | 0 | UpLeft | 3.5 |
| DownRight | 1 | UpRight | 0.5 |
| DownLeft | 2 | DownRight | 1.5 |

**Code:** `this.endCorner` → `Corner` instance (`UpRight`, `UpLeft`, `DownRight`, `DownLeft`)

**Same-Facing:** Two corners are "same-facing" when their `endCorner` values
are equal. This is the **prerequisite** for any wrapper relationship.

**Code:** `this.hasSameFacingCorner(seg)` → `this.endCorner.equals(seg.endCorner)`

---

## 4. Arc Geometry

### Arc Origin Path

For any corner, the arc origin can slide along a diagonal line between 
the **min** and **max** positions:

```
            minArcOrigin
                 ●
                ╱
               ╱  ← viableArcOriginsSeg
              ╱
             ●
        maxArcOrigin
```

- `minArcOrigin`: Origin when radius = `cellRadius` (tightest curve)
- `maxArcOrigin`: Origin when radius = `maxArcRadius` (widest curve)
- `viableArcOriginsSeg`: The line segment between them
- `viableArcOrigins`: Discrete points on that line, snapped to cell boundaries

### Arc Bounds

The bounding box of the arc, from `arcOrigin` to the corner vertex.

```
  ┌─────────────┐
  │  arcBounds  │
  │      ╱╲     │
  │    ╱    ╲   │
  │  ●origin  ● │ ← corner vertex
  └─────────────┘
```

**Code:** `this.arcBounds`, `this.maxArcBounds`, `this.minArcBounds`

---

## 5. Wrapper Taxonomy

When two same-facing corners are spatially close, their arcs must be 
**coordinated** so they don't overlap or create visual artifacts. The outer 
arc "wraps" the inner arc.

### 5.1 Spatial Relationships

#### Coincident
<!-- STATUS: needs verification -->

Two corners that share the **exact same corner vertex** AND whose 
`maxArcBoundsSeg`s are collinear (diagonal relationship).

```
  Shape A        Shape B
  ──────●──────  ──────●──────
        │ same          │
        │ vertex        │
  ──────●──────  ──────●──────
        ↑                ↑
     corner A = corner B (same point)
```

Typically occurs when two shapes meet at a grid intersection.

**Code:** `this.hasCoincidentCorner(seg)` → diagonal + collinear + shared vertex

#### Collinear

Two same-facing corners where the segments (or their neighbors) are 
collinear, but the corners do NOT share a vertex.

```
  Shape A              Shape B
  ──────●              ──────●
        │                    │
        │  ← same line       │
        │                    │
  ──────●              ──────●
  corner A            corner B
  (different vertex, but segments share a line)
```

**Code:** `this.hasCollinearCorner(seg)` → same-facing + collinear segments + different vertex

> **Known limitation:** This definition requires same-facing corners, but
> geometrically valid collinear pairs can also have opposite-facing corners 
> (e.g., corner 0 ↔ 2). See § 9.7 (Bug B) for details.

#### Diagonal

Two same-facing corners whose `maxArcBoundsSeg`s are collinear. This means 
their arc origin paths are aligned — they COULD share a single arc origin.

```
           ●  corner A
          ╱
         ╱  ← arc origin paths are collinear
        ╱
       ●  corner B
```

**Code:** `this.hasDiagonalCorner(seg)` → same-facing + collinear `maxArcBoundsSeg`

> **Note:** Coincident ⊂ Diagonal. All coincident corners are diagonal, 
> but not all diagonal corners are coincident.

### 5.2 Wrapper Types — Full Taxonomy

The wrapper system forms a hierarchy. The two primary categories are 
**Flush** and **Adjacent**, each with sub-types:

```
Wrapper
├── Flush (shared edge / no gap)
│   ├── Coincident (same vertex, diagonal relationship)
│   └── Collinear (same line, different vertex)
├── Adjacent (nearby, gap between arcs)
│   ├── Proximal (close, tangent-based intersection)
│   └── Radiant / Concentric (diagonal, shared origin possible)
```

#### Flush Wrapper

A wrapper between **coincident** or **collinear** corners. The arcs are 
directly adjacent — no gap between them on a shared edge.

Detection: `flushDistanceObjs` → `flushIntersectObjs` → `flushWrapperObjsFinal`

**Code:** `this.flushWrapper`, `this.flushOutWrapper`, `this.flushInWrapper`

#### Adjacent Wrapper

A wrapper between corners that are same-facing but NOT coincident/collinear. 
The arcs don't share an edge — they're nearby and need intersection logic 
to coordinate.

Detection: `adjDistanceObjs` → `adjIntersectObjs` → `adjWrapperObjsFinal`

**Code:** `this.adjacentWrapper`, `this.adjOutWrapper`, `this.adjInWrapper`

#### Proximal Wrapper

A subtype of Adjacent where the corners are close but NOT on the same 
diagonal. Resolution uses tangent-based intersection distance rather than 
shared-origin alignment.

**Code:** Referenced in `#wrap()` — non-diagonal branch uses `addDistancedEndCornerVerts(obj.dist)`.

#### Radiant / Concentric Wrapper

A special case of **diagonal** wrapping where 3+ corners share a single arc 
origin. Their arcs are concentric circles with increasing radii.

```
         ● corner A (smallest arc)
        ╱│╲
       ╱ │ ╲
      ╱  ●  ╲ corner B (medium arc)
     ╱  ╱│╲  ╲
    ╱  ╱ │ ╲  ╲
   ╱  ╱  ●  ╲  ╲ corner C (largest arc)
      shared origin
```

**Code:** `this.radiantOutWrappers`, `this.radiantInWrappers`, 
`this.isInnerMostRadiantWrapper`, `this.outerMostRadiantWrapper`

### 5.3 In/Out Determination

For any pair of same-facing corners, one is the **inWrapper** (inner/smaller) 
and the other is the **outWrapper** (outer/larger).

**Current Logic (`couldHaveInWrapper`):**

| Condition | inWrapper is... | Reasoning |
|-----------|-----------------|-----------|
| Coincident + same orientation (both outside or both inside) | The one whose shape's bounds are contained by the other's | Smaller shape = inner |
| Coincident + different orientation | The outside corner | Outside corner is geometrically interior in this case |
| Non-coincident | `seg` if `seg.minArcIsWithinThatMaxArc(this)` | Whose minimum arc fits inside the other's maximum |

<!-- TODO: Verify this logic handles all edge cases correctly -->
<!-- QUESTION: Is the anchor always the inWrapper? Should outWrapper NEVER 
     reference inWrapper during initial calculation? -->

### 5.4 Tight vs. Loose

After wrapping, a corner's arc is either **tight** (minimum radius, fully 
curved) or **loose** (larger radius, with flatness remaining).

| Term | Code Property | Meaning |
|------|---------------|---------|
| Tight | `hasMinArcRadius` / `isMinCorner` | Arc radius equals `cellRadius` — maximally curved, no room to tighten |
| Loose | `canCurveMoreAtEnd` / `hasFlatness` | Arc has `flatAmount > 0` — straight-line gap remains between cubicStartVert and cubicEndVert |

The wrapping pipeline (`maximizeCuddles()`) aims to make corners as tight as 
possible. A "loose" corner indicates either insufficient room (blocked by a 
wrapper) or a deferred resolution awaiting later passes.

### 5.5 Resolution Strategies — External / Recalculate / Internal

When a wrapper pair needs fixing, three strategies determine which 
segment(s) to adjust:

| Strategy | Abbreviation | Code Arrow | Which Segment Changes? |
|----------|-------------|------------|----------------------|
| External | ext | `wrapOutFix` | Adjust the **outWrapper** (the wrapping segment). InWrapper stays anchored. |
| Recalculate | recalc | `balanced` | Adjust **both** segments to a shared middle. Sets both to `setArcToMiddle()`. |
| Internal | int | `wrapInFix` | Adjust the **inWrapper** (the wrapped segment). ⚠️ **Violates anchor principle.** |

**External** is the safe default — it respects the anchor principle.  
**Recalculate** is a compromise used in `wrapInnerMost()`.  
**Internal** is a last-resort fix used in `fixBadAdjWraps()` and 
`fixBadFlushWraps()` — it modifies the anchor, which can cascade bugs.

---

## 6. Wrapper Resolution Logic

### 6.0 The Anchor Principle

> **RULE: The inWrapper is the anchor.**
> 
> InWrapper geometry is calculated FIRST, independently.
> OutWrapper geometry is then adjusted to coordinate with the inWrapper.
> 
> An inWrapper should NEVER depend on its outWrapper's arc geometry 
> during initial resolution.

⚠️ **Known Violations:** `fixBadAdjWraps()` and `fixBadFlushWraps()` both 
contain `wrapInFix` branches that modify the inWrapper based on outWrapper 
state. `fixLoosies()` also modifies `inWrapper.adjWrap()` on outermost 
wrappers. See §6.3.

### 6.1 Resolution Steps (Conceptual)

```
1. Calculate all corners independently (min radius)
2. Identify wrapper pairs (same-facing + spatial proximity)
3. Classify each pair (coincident/collinear/diagonal/adjacent)
4. Determine in/out roles
5. Resolve inWrappers first (independent geometry)
6. Resolve outWrappers by adjusting to match inWrappers
7. Handle radiant stacks (shared origin propagation)
8. Handle interference (opposing radiant stacks constraining each other)
```

### 6.2 `maximizeCuddles()` — The Actual Pipeline

`maximizeCuddles()` is the multi-pass corner optimizer in `Grid.js` (line 675).
It runs these sub-arrows in sequence:

```
maximizeCuddles()
│
├── 1. wrapInterferenceCorners()         Grid.js:699
│   Resolves opposing radiant stacks that constrain each other.
│   Uses viableInterferenceOrigins to find valid shared origins.
│
├── 2. wrapInnerMost()                   Grid.js:815
│   For innermost radiant wrappers: sets arc to MIDDLE position
│   (balanced strategy). Both segment and its endNeighbor get
│   setArcToMiddle() + flushWrap(true).
│
├── 3. curveMinRadiusCorners()           (not fully traced)
│   Ensures minimum-radius corners are properly curved.
│
├── 4. completeEnds()                    (not fully traced)
│   Finalizes segment end geometry.
│
├── 5. fixBadAdjWraps()                  Grid.js:887
│   Iterates corner-turn segments. For each with a bad adjacent wrap:
│   ├── wrapOutFix: adjusts inWrapper.adjWrap() [EXTERNAL — safe]
│   └── wrapInFix: adjusts s.adjWrap() + inWrapper.flushWrap()
│       ⚠️ ANCHOR VIOLATION — modifies inner based on outer state
│
├── 6. fixBadFlushWraps()                Grid.js:974
│   Same structure as fixBadAdjWraps but for flush wrappers:
│   ├── wrapOutFix: adjusts inner wrapper [EXTERNAL — safe]
│   └── wrapInFix: adjusts the segment itself
│       ⚠️ ANCHOR VIOLATION
│
└── 7. fixLoosies()                      Grid.js:1050
    BFS walk from loosest corners outward. For each loose segment:
    ├── hasNoWrappers: replaceEndCurveOrigin(currentMaxArcOrigin)
    ├── isInnerMostWrapper:
    │   ├── minRadFix: if canCurveMore, set to middle + flushWrap
    │   ├── loners: segments with no wrapping neighbors
    │   └── isInnerMostWrapper recalc: resetMemoized + recheck
    └── isOuterMostWrapper:
        ├── has radiantInWrappers: adj/radiant fixes
        │   ⚠️ modifies inWrapper.adjWrap() — ANCHOR VIOLATION
        └── isAdjOutWrapper: inWrapper.adjWrap()
    
    After processing, calls fixBadFlushWraps() again.
```

### 6.3 Anchor Violation Points

These are the specific locations where the inWrapper is modified based on 
outWrapper state, violating the anchor principle:

| Location | Line | What Happens |
|----------|------|-------------|
| `fixBadAdjWraps` → `wrapInFix` | ~Grid.js:920 | `s.adjWrap()` + `inWrapper.flushWrap()` — reassigns inner geometry |
| `fixBadFlushWraps` → `wrapInFix` | ~Grid.js:1000 | Modifies segment flush wrap based on its wrapper's state |
| `fixLoosies` → `isOuterMostWrapper` | ~Grid.js:1220 | `s.inWrapper.adjWrap()` — directly mutates inner from outer context |
| `fixLoosies` → `radiantInWrappers` | ~Grid.js:1230 | `s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin()` |

These violations may be necessary bandaids, but they risk creating cascading 
stale-cache bugs because `resetMemoized` isn't called on all affected 
properties after the mutation.

### 6.4 The `#wrap()` Method

Both `flushWrap()` and `adjWrap()` delegate to `#wrap()`. The resolution 
logic differs based on whether the wrappers are diagonal or not:

**Diagonal (coincident/concentric):**
- Match arc origins: `target.replaceEndCurveOrigin(source.arcOrigin)`
- Target is determined by `wrapOut` parameter

**Non-diagonal (collinear/proximal):**
- Calculate intersection distance
- Set end corner verts at that distance: `target.addDistancedEndCornerVerts(obj.dist)`

---

## 7. Wrap States

After wrapping, the relationship between two wrapped arcs is classified.

### 7.1 Code States (Current Implementation)

| State | Value | Description | Visual |
|-------|-------|-------------|--------|
| Equidistant | `0` | Arcs share origin (radiant) or are tangent (proximal) | `)(` |
| Diverging | `1` | Inner arc's origin is FURTHER from corner than outer's | `) (` |
| Converging | `2` | Inner arc's origin is CLOSER to corner than outer's | `)(` overlapping |

**Code:** `this.wrapState(flush)` → `0`, `1`, or `2`

### 7.2 Sketch States (Extended Model)

The hand-drawn reference sketches identify **5** wrap states, extending 
the code's 3-state model along a tight↔loose spectrum:

```
Tight ◄────────────────────────────────────────────► Loose

  1. Tight-Tight         Both arcs at minRadius. Equidistant.
  2. Tight-Converging    Inner tight, outer converging toward it.
  3. Equidistant         Shared origin / tangent. Code state 0.
  4. Diverging           Origins pulling apart. Code state 1.
  5. Loose-Loose         Both arcs loose, flatAmount > 0 on both.
```

The code collapses states 1-2 into "Converging" (2) and state 5 into 
"Diverging" (1). The sketch model captures finer distinctions that affect 
which resolution strategy (ext/recalc/int) is appropriate:

| Sketch State | Code State | Best Strategy |
|-------------|------------|---------------|
| Tight-Tight | Equidistant (0) | None needed — already resolved |
| Tight-Converging | Converging (2) | External (adjust outer) |
| Equidistant | Equidistant (0) | None needed |
| Diverging | Diverging (1) | External or Recalculate |
| Loose-Loose | Diverging (1) | Recalculate (both to middle) |

### 7.3 State Observation

These helper properties expose the current state:

| Property | Meaning |
|----------|---------|
| `hasMinArcRadius` | This corner is tight (at cellRadius) |
| `canCurveMoreAtEnd` | This corner is loose (could tighten further) |
| `hasFlatness` | `flatAmount > 0` — straight gap remains |
| `isMinCorner` | Alias for minimum-radius check |
| `flatAmount` | Distance between cubicStartVert and cubicEndVert (0 = fully curved) |

---

## 8. Dependency Graph

### Properties That Should Be Independent (No Wrapper References)

```
direction, turns, normals, part, cornerVerts, corners,
maxArcRadius, minArcRadius, maxArcOrigin, minArcOrigin,
viableArcOriginsSeg, viableArcOrigins, maxArcBounds, minArcBounds
```

### Properties That Reference Wrappers

```
┌─────────────────────────────────────────────────────────┐
│ viableWrappers                                          │
│  ├── viableInWrappers (spatial query, no arc state)     │
│  └── viableOutWrappers (spatial query, no arc state)    │
│                                                         │
│ flushDistanceObjs ← viableWrappers                      │
│  └── flushIntersectObjs                                 │
│       └── flushWrapperObjsFinal                         │
│            └── flushWrapper                              │
│                 ├── coincidentWrapper                    │
│                 ├── collinearWrapper                     │
│                 ├── flushOutWrapper ← couldHaveInWrapper │
│                 └── flushInWrapper  ← couldHaveInWrapper │
│                                                         │
│ adjDistanceObjs ← viableWrappers                        │
│  └── adjIntersectObjs                                   │
│       └── adjWrapperObjsFinal                           │
│            └── adjacentWrapper                           │
│                 ├── adjOutWrapper                        │
│                 └── adjInWrapper                         │
│                                                         │
│ outWrapper ← flushOutWrapper || adjOutWrapper            │
│  └── outWrappers (RECURSIVE: outWrapper.outWrappers)    │
│       └── radiantOutWrappers                            │
│                                                         │
│ inWrapper ← flushInWrapper || adjInWrapper               │
│  └── inWrappers (RECURSIVE: inWrapper.inWrappers)       │
│       └── radiantInWrappers                             │
│                                                         │
│ interferenceWrappers ← outerMostRadiantWrapper           │
│  └── viableInterferenceOrigins                          │
└─────────────────────────────────────────────────────────┘
```

### ⚠️ Potential Cycle Zones

```
outWrappers → outWrapper.outWrappers  (safe if DAG, breaks if A→B→A)
inWrappers → inWrapper.inWrappers    (safe if DAG, breaks if A→B→A)
radiantOutWrappers → references inWrapper.canRadiateTo 
                   → which may trigger inWrapper chain
```

<!-- STATUS: AUDIT EACH OF THESE FOR CYCLES -->

---

## See Also

The following content was extracted from this document into separate
files for separation of concerns:

| Document | Content | Was |
|----------|---------|-----|
| [KNOWN-ISSUES.md](KNOWN-ISSUES.md) | Bugs, audit findings, edge cases | §§ 9.1–9.8 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Evaluation vs. opinion analysis, Unified Wrapper Funnel design | §§ 10–11 |
| [ROADMAP.md](ROADMAP.md) | Wrapper audit checklist, 17-task refactor plan | § 12 |
| [TESTING.md](TESTING.md) | WrapperTestHarness, WrapperDebugOverlay, test hashes | New |

Code comments referencing `GEOMETRY-REFERENCE § 9.x` now point to
`docs/KNOWN-ISSUES.md § 9.x` (section numbers preserved).

---


## Appendix A: Method Index

| Method | Category | Pure/Mutating | Depends On Wrappers? |
|--------|----------|---------------|----------------------|
| `turns` | Corner Anatomy | Pure | No |
| `normals` | Corner Anatomy | Pure | No |
| `cornerVerts` | Corner Anatomy | Pure | No |
| `corners` | Corner Anatomy | Pure | No |
| `arcRadius` | Arc Geometry | Pure | No (uses cubicVerts) |
| `arcOrigin` | Arc Geometry | Pure | No (uses cubicVerts) |
| `maxArcRadius` | Arc Geometry | Pure | No |
| `viableArcOrigins` | Arc Geometry | Pure | No |
| `hasSameFacingCorner` | Orientation | Pure | No |
| `hasDiagonalCorner` | Orientation | Pure | No |
| `hasCollinearCorner` | Orientation | Pure | No |
| `hasCoincidentCorner` | Orientation | Pure | No |
| `couldHaveInWrapper` | Wrapper Role | Pure | No (uses corner geometry only) |
| `viableInWrappers` | Wrapper Discovery | Pure | No (spatial query) |
| `viableOutWrappers` | Wrapper Discovery | Pure | No (spatial query) |
| `flushWrapper` | Wrapper Resolution | Pure | ⚠️ Indirect |
| `adjacentWrapper` | Wrapper Resolution | Pure | ⚠️ Indirect |
| `outWrappers` | Wrapper Chain | Pure | ⚠️ RECURSIVE |
| `inWrappers` | Wrapper Chain | Pure | ⚠️ RECURSIVE |
| `#wrap()` | Wrapper Mutation | **MUTATING** | Yes |
| `addCubicStartVert` | Mutation | **MUTATING** | No |
| `addCubicEndVert` | Mutation | **MUTATING** | No |
| `#resetMemoProps` | Cache | **MUTATING** | Resets wrapper-dependent caches |

---

## Appendix B: Direction System Quick Reference

The `Direction` class uses a numerical rotation system (0–3.5), NOT compass 
points. Arithmetic on direction values rotates clockwise.

### Cardinal Directions (axis-aligned)

| Name | Value | Axis | Groups |
|------|-------|------|--------|
| Up | 0 | Y− | Vertical, Cardinal |
| Right | 1 | X+ | Horizontal, Cardinal, Cartesian |
| Down | 2 | Y+ | Vertical, Cardinal, Cartesian |
| Left | 3 | X− | Horizontal, Cardinal |

### Compound Directions (diagonal, 45°)

| Name | Value | Quadrant |
|------|-------|----------|
| UpRight | 0.5 | ↗ |
| DownRight | 1.5 | ↘ (Cartesian) |
| DownLeft | 2.5 | ↙ |
| UpLeft | 3.5 | ↖ |

### Direction Arithmetic

- `dir.rotate(Turn.R)` → clockwise 90° (value + 1, mod 4)
- `dir.rotate(Turn.L)` → counter-clockwise 90° (value − 1, mod 4)
- `dir.rotate(Turn.SR)` → clockwise 45° (value + 0.5)
- `dir.opposite` → 180° (value + 2, mod 4)
- `dir.isCardinal` → value is integer
- `dir.isCompound` → value has .5 fractional part

### -Omino Detection

Direction includes methods for detecting polyomino shape patterns:

| Method | Pattern |
|--------|---------|
| `isTetOmino(d2, d3)` | 3-direction sequence forming an L/T/S/Z tetromino |
| `isPentOmino(d2, d3, d4)` | 4-direction sequence forming pentomino shapes |
| `triSequence(d2)` | 2-direction pair classification |

---

## Appendix C: Sketch Reference

> Hand-drawn reference sketches by Tyson Parks documenting the wrap system.
> Place exported SVGs or photographed sketches in `docs/images/`.

### Sketches Analyzed

1. **Wrap System Overview** — Full taxonomy tree with ext/recalc/int 
   resolution strategies per wrapper type. Shows 5 wrap states along 
   tight↔loose spectrum.

2. **Flush Wrapping Detail** — Coincident and collinear sub-types with 
   shared-edge geometry. Shows how corner vertex sharing determines 
   coincident vs collinear.

3. **Adjacent/Radiant Wrapping** — Concentric arc stacks with shared 
   origin propagation. Shows radiant chains of 3+ corners.

4. **Tight/Loose Matrix** — How each wrap state maps to resolution 
   strategy selection (ext/recalc/int).

### Key Sketch Vocabulary → Code Mapping

| Sketch Term | Code Equivalent |
|-------------|-----------------|
| ext | `wrapOutFix` — external strategy, adjust outWrapper |
| recalc | `balanced` / `setArcToMiddle()` — recalculate both |
| int | `wrapInFix` — internal strategy, adjust inWrapper |
| tight | `hasMinArcRadius` / `isMinCorner` |
| loose | `canCurveMoreAtEnd` / `hasFlatness` |
| concentric | radiant wrapper (shared origin) |
| proximal | adjacent wrapper (tangent intersection) |

---

*Part of the BoredUI documentation suite. See [docs/](./) for all documents.*
*Last updated: 2026-03-03*