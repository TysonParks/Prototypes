# BoredUI Geometry Reference
## Rounded Corner Wrapping System

> **Purpose:** Define the geometric vocabulary, relationships, and resolution 
> logic for coordinating rounded corners between neighboring shapes on a grid.
>
> **Audience:** The author (Tyson), collaborating AI, future contributors.
>
> **Living Document:** This evolves with the code. Each section links to 
> the implementing properties/methods in `drawAsSVG.js`.

---

## Table of Contents

1. [Primitives](#1-primitives)
2. [Corner Anatomy](#2-corner-anatomy)
3. [Corner Orientation](#3-corner-orientation)
4. [Arc Geometry](#4-arc-geometry)
5. [Wrapper Taxonomy](#5-wrapper-taxonomy)
6. [Wrapper Resolution Logic](#6-wrapper-resolution-logic)
7. [Wrap States](#7-wrap-states)
8. [Dependency Graph](#8-dependency-graph)
9. [Known Issues & Edge Cases](#9-known-issues--edge-cases)

---

## 1. Primitives

### ProtoSegment

A directed edge of a shape's perimeter. Always axis-aligned (cardinal).

| Property | Type | Description |
|----------|------|-------------|
| `start` | Vertex | Starting point (connects to previous segment's `end`) |
| `end` | Vertex | Ending point (connects to next segment's `start`) |
| `direction` | Direction | Cardinal direction of travel: N, E, S, W |
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

The directional change at a corner.

| Turn | Value | Visual | Meaning |
|------|-------|--------|---------|
| Right | `R` / `1` | `╮` | Path turns right → **outside corner** (convex) |
| Left | `L` / `-1` | `╭` | Path turns left → **inside corner** (concave) |
| Straight | `S` / `0` | `─` | No turn → flat segment continuation |

**Code:** `this.turns.end` → the turn at THIS segment's corner.

---

## 2. Corner Anatomy

A corner consists of two half-edges meeting at a vertex, with an arc 
connecting them.

```
         cubicEndVert          cubicStartVert
              ●                     ●
              |    ╲    arc    ╱    |
              |       ╲     ╱      |
  this seg    |         ● ←── arcCenterVert
  ────────────┤       corner       ├──────────
              |      vertex        |   endNeighbor
              |                    |
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

Each outside corner faces one of four diagonal directions, named by the 
`Corner` class:

```
        NW  ╮  NE
            │
        SW  ╰  SE
```

**Code:** `this.endCorner` → `Corner` instance (NE, NW, SE, SW)

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
  │   arcBounds  │
  │      ╱╲      │
  │    ╱    ╲    │
  │  ● origin  ● │ ← corner vertex
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

### 5.2 Wrapper Types

#### Flush Wrapper

A wrapper between **coincident** or **collinear** corners. The arcs are 
directly adjacent — no gap between them on a shared edge.

Detection: `flushDistanceObjs` → `flushIntersectObjs` → `flushWrapperObjsFinal`

**Code:** `this.flushWrapper`, `this.flushOutWrapper`, `this.flushInWrapper`

#### Adjacent Wrapper

A wrapper between corners that are same-facing but NOT coincident/collinear. 
The arcs don't share an edge — they're nearby and need tangent-based 
intersection to coordinate.

Detection: `adjDistanceObjs` → `adjIntersectObjs` → `adjWrapperObjsFinal`

**Code:** `this.adjacentWrapper`, `this.adjOutWrapper`, `this.adjInWrapper`

#### Radiant Wrapper

A special case of **diagonal** wrapping where 3+ corners can ALL share a 
single arc origin. Their arcs are concentric circles.

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

<!-- STATUS: AUDIT NEEDED — Does the current code maintain this principle? -->

### 6.1 Resolution Steps

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

<!-- STATUS: Does maximizeCuddles() follow this order? -->

### 6.2 The `#wrap()` Method

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

After wrapping, the relationship between two wrapped arcs is classified:

| State | Value | Description | Visual |
|-------|-------|-------------|--------|
| Equidistant | `0` | Arcs share origin (radiant) or are tangent (proximal) | `)(` |
| Diverging | `1` | Inner arc's origin is FURTHER from corner than outer's | `) (` |
| Converging | `2` | Inner arc's origin is CLOSER to corner than outer's | `)(` overlapping |

**Code:** `this.wrapState(flush)` → `0`, `1`, or `2`

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

## 9. Known Issues & Edge Cases

### 9.1 Chicken-and-Egg Risks

| Risk | Description | Status |
|------|-------------|--------|
| `outWrappers` ↔ `inWrappers` | If A.out = B and B.in = A, this is correct. But if the relationship flips after mutation, stale memos create a cycle. | ⚠️ Audit needed |
| `couldHaveInWrapper` symmetry | A.couldHaveInWrapper(B) should be the logical inverse of B.couldHaveInWrapper(A). Is it? | ⚠️ Audit needed |
| `radiantOutWrappers` → `inWrapper` | The filter references `wrapper.inWrapper?.canRadiateTo(wrapper)`, which triggers the inWrapper chain during outWrapper calculation. | ⚠️ Audit needed |

### 9.2 Non-Square Cell Aspect Issues

The `minAdjWrapperDistanceObj` method has a FIXME noting issues with 
non-square cell aspects triggering longer intersect corners.

### 9.3 Unreachable Code

In `viableWrappers`:
```javascript
// This line is unreachable — the previous return already exits:
return viables  // ← returned here
return viables  // ← dead code (variable name also wrong)
```

### 9.4 Stray Property

```javascript
get isCoinOutWrapper() { return !!this.coinInWrapper }
get isFlushOutWrapper() { return !!this.flushInWrapper }
get isAdjOutWrapper() { return !!this.adjInWrapper } flush  // ← stray 'flush' token
```

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

*Last updated: 2026-02-18*
*Companion interactive explorer: `geometry-reference.html` (planned)*
