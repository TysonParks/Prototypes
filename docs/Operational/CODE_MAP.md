## What This Document Is Not

This file is a navigation guide, not a specification.
It does not define geometric rules or architecture.
Canonical system definitions live in:

- docs/Canonical/ARCHITECTURE.md
- docs/Canonical/GEOMETRY-REFERENCE.md

---

Overview: quick map to the code locations that implement the wrapper/arc system.
Files are listed with their primary classes, key methods, and short responsibilities.
Prioritizes orientation over completeness — only architectural methods and relationships.


[drawAsSVG.js](drawAsSVG.js)
- Class: `ProtoSegment`
  - Key methods / getters:
    - `arcOrigin`, `maxArcOrigin`, `minArcOrigin`, `viableArcOrigins`, `viableArcOriginsSeg`
    - `arcRadius`, `arcCenterVert`, `arcCenterMidPointTangent`
    - `finalCubicStartVert`, `finalCubicEndVert`, `flatAmount`, `hasFlatness`
    - `canCurveTo(newOrigin)`, `setArcToMiddle()`, `replaceEndCurveOrigin(vert)`, `addDistancedEndCornerVerts(distance)`
    - `#addCubicVert(...)`, `#setCurveOrigin(...)`, `#setRadiantOrigin(...)`, `#resetMemoProps()`
    - Wrapper getters referenced by pipeline: `inWrappers`, `outWrappers`, `adjacentWrapper`, `flushWrapper`, `radiantOutWrappers` (getters spread across this file)
  - Responsibilities:
    - Encapsulates per-segment arc geometry and evaluation logic (possible arc origins, radii, bounds).
    - Provides low-level mutation APIs that the wrapping pipeline calls to set cubic verts and arc origins.
    - Hosts memoized/topology vs arc-volatile getters; `#resetMemoProps()` is the canonical cache invalidation point.

  - Notes:
    - `#wrap()` / wrap helpers live here (central mutation path used by both flush/adjacent funnels).


[Grid.js](Grid.js)
- Class: `Grid`
  - Key methods / areas:
    - `maximizeCuddles()` — multi-pass corner optimizer (line ~675)
    - `createIslands()`, `createPerimiters()`, `createSimpleSubShapes()` — shape/island construction
    - `inWrapPerimeter(simpleSegs, parentSegs)` — inner→outer perimeter conformity (frame/intershape path)
    - Selection / cell utilities used to build perimeter segments (`cellSpanBetween`, `cellBounds`, etc.)
  - Responsibilities:
    - Orchestrates the wrapper pipeline at the grid scope, invoking per-segment evaluation and mutation to resolve corners.
    - `maximizeCuddles()` implements the opinion-layer pipeline (ordered fixes, flush vs adj funnels, radiant handling, interference detection).
    - Hosts frame/backGrid coordination when used by `Frame`.


[ProtoUtility.js](ProtoUtility.js)
- Class: `Direction`
  - Key properties / methods:
    - Static direction constants (`Up`, `Right`, `Down`, `Left`, `UpRight`, etc.) and aggregates (`Cardinal`, `Ordinal`, `All`)
    - Helpers: `angle`, `lineVector`, `toLeft`, `opposites`, `.directions` enumeration
  - Responsibilities:
    - Provides the directional vocabulary used by `ProtoSegment`, `Grid`, and perimeter logic for orientation normalization and neighbor queries.


[ProtoLayerObjects.js](ProtoLayerObjects.js)
- Class: `ProtoLayer` (base)
  - Responsibilities: base drawing/layout/ID/storage behaviors used by `Grid`, `CellGroup`, `Frame`, etc.
  - Architecture map: see [ARCHITECTURE § 13](../Canonical/ARCHITECTURE.md#13-protolayer-svg-realization-and-inset-propagation) for which subclasses are data-only vs. structural/visual SVG, and where `insetScale` propagation stops before ShapeGroup filter layout.

- Class: `Frame`
  - Key methods: `setGrid()`, `createBackGrid()`, `setBackGridGroup()`
  - Responsibilities:
    - Manages outer frame/backGrid and runs a simplified wrapping loop (calls `flushWrap` / `adjWrap` directly, bypassing full `maximizeCuddles()`).
    - Prepares backGrid perimeter and padding; used for frame-specific wrapping workflows.

- Other: `CellGroup`, `SelectionBounds` — helpers for grouping/island management used by perimeter creation.

- Class: `ShapeGroup`
  - Key methods: `createSVGGroup()`, `createMaskGroup()`, `createBBoxKeeper()`, `assignShapes()`, `drawElement()`
  - Responsibilities:
    - Owns the nested SVG/group structure used for backing/combo/high/shad layers.
    - Applies cut filters and R-profile combo masks.
    - `createBBoxKeeper()` is the scoped frame/backgrid `rIn` crop fix: an invisible child rect under `ShapeGroup.svgElt` that stabilizes the masked SVG's effective painted bounds without reopening global filter/layout regions.


[testing/WrapperDebugOverlay.js](testing/WrapperDebugOverlay.js)
- Utility class: `WrapperDebugOverlay`
  - Responsibilities: visualizes wrapper relationships (coincident, collinear, adjacent, radiant) — useful when tracing pipeline behavior in rendered output.


Key Architectural Concepts (mapping to code)
- Evaluation vs Opinion
  - Evaluation: heavy-lifting getters that compute geometric possibilities live on `ProtoSegment` (e.g., `viableArcOrigins`, `viableOutWrappers`, `maxArcBoundsSeg`).
  - Opinion: `Grid.maximizeCuddles()` orders aesthetic decisions (`fixIssues()` ordering) and calls per-segment mutation APIs (e.g., `setArcToMiddle`, `addDistancedEndCornerVerts`).

- Wrapping funnel (high-level)
  1. Candidate discovery — segment-level getters compute `flushDistanceObjs` / `adjDistanceObjs` / `radiantOutWrappers`.
  2. Intersection & distance calculation — per-candidate intersect objects (e.g., `arcCenterMidPointTangent`) computed by `ProtoSegment` getters.
  3. Candidate filtering/classification — flush vs adjacent vs collinear vs coincident vs radiant (a mix of `ProtoSegment` and pipeline filters).
  4. Selection & mutation — pipeline chooses wrapper object and calls `#wrap()`/`flushWrap()`/`adjWrap()` → `#setCurveOrigin` / `addDistancedEndCornerVerts`.
  5. Memo invalidation — `#addCubicVert()` and other mutators call `#resetMemoProps()` to invalidate arc-volatile memo keys.

- Arc geometry responsibilities
  - `ProtoSegment` stores and computes arc metrics: `arcOrigin`, `arcRadius`, `maxArcOrigin`, `minArcOrigin`, `viableArcOriginsSeg` and discrete `viableArcOrigins`.
  - `arcCenterMidPointTangent` and related helpers are used for tangent-based adjacent distance heuristics.


Focused pointers (where to look first)
- `ProtoSegment` (class start): [drawAsSVG.js — ProtoSegment](drawAsSVG.js#L1555)
  - `setArcToMiddle()` : [drawAsSVG.js#L1845]
  - `#addCubicVert()` (mutator) : [drawAsSVG.js#L1949]
  - `#resetMemoProps()` (cache invalidation) : [drawAsSVG.js#L1959]
  - `arcOrigin` getter : [drawAsSVG.js#L2058]
- Wrapper pipeline orchestration: `maximizeCuddles()` — [Grid.js#L677]
- Direction system (orientation helpers): `Direction` class — [ProtoUtility.js#L1](ProtoUtility.js#L1)
- Frame-specific wrapping: `Frame.setBackGridGroup()` / `inWrapPerimeter` — [ProtoLayerObjects.js#L250](ProtoLayerObjects.js#L250) (Frame class area)
- Visual debugging: `WrapperDebugOverlay` — [testing/WrapperDebugOverlay.js#L1]


[PublicGenerator.js](PublicGenerator.js)
- No class — top-level functions only
  - `DOMContentLoaded` listener: dynamically creates `<button id="regenBtn">` and attaches `protoBatch.buildFromNewSeed()` onclick
  - `positionRegenBtn()`: sizes and positions the regen button below the frame after each build and on window resize
  - Called by guarded checks in `ProtoBatch.buildFromHash()` and `sketch.js windowResized()`
  - **Only loaded on the `PublicGenerator-v0.1` branch** — on dev branches the guards are no-ops


Quick notes / tips
- When tracing bugs, start with `ProtoSegment.#resetMemoProps()` (cache invalidation) and `Grid.maximizeCuddles()` (ordering). These are the two places where evaluation/opinion interaction most commonly manifest.
- `Frame.setBackGridGroup()` intentionally bypasses `maximizeCuddles()`; frame wrapping logic is simpler but may miss radiant/interference steps.
- **Branch workflow:** Dev work happens on `agent-testing`. Public deployment branch is `PublicGenerator-v0.1` (GitHub Pages). Merge `agent-testing → PublicGenerator-v0.1` to deploy. The public branch diverges only in `index.html` (no testing scripts, no dat.gui, adds `PublicGenerator.js`, browser detection) and carries its own `#regenBtn` CSS styles.

---
