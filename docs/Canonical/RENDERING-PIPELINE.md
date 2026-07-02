# Arcluminitism Rendering Pipeline

> **Purpose:** Canonical description of the browser-native SVG shading system
> used by Prototypes — what the code actually does, where the pieces live, and
> how cut profiles differ.
>
> **Related docs:**
> [ARCHITECTURE](ARCHITECTURE.md) (§§13–14) |
> [GEOMETRY-REFERENCE](GEOMETRY-REFERENCE.md) |
> [KNOWN-ISSUES](../Operational/KNOWN-ISSUES.md) (Safari filter/mask history) |
> [TESTING](../Operational/TESTING.md) (filter debug harness)

## What This Document Is Not

- Not marketing copy — no claims about physical lighting or volumetric simulation
- Not a bug log — Safari-specific regressions and failed fixes live in
  KNOWN-ISSUES.md
- Not a roadmap — future filter-region precision work is noted in ARCHITECTURE §13.3

---

## 1. Terminology

| Term | Meaning in this codebase |
|------|--------------------------|
| **Arcluminitism** | The project name for pseudo-neumorphic SVG shading: offset alpha silhouettes, achromatic floods, and stacked filter passes |
| **Cut profile** | `Profile` instance (`iIn`, `jOut`, `rIn`, …) — controls inset vs outset shading, filter decomposition, and mask behavior |
| **Shade layer** | One authored entry in a filter stack (`dropShadeSVG` object → one loop iteration in `ProtoFilter.shade()`) |
| **Filter inset / outset** | Whether a shade pass masks to the interior (`feComposite operator="out"`) or exterior (offset alpha only) of the path silhouette |
| **Geometric inset** | `SegPath.inset()` / `insetScale` stepping — shrinks the drawn path for cascade layers; separate from filter inset |
| **Shader layer** | DOM `<g>` on the grid: `back`, `combo`, `high`, `shad` |

Avoid **illumination** and **relief** when precision matters. Prefer **directional shading**,
**bevel shading**, or **offset-and-flood shading**.

---

## 2. Mental Model

The system does **not** simulate light. Each filled SVG path is shaded in place:

1. The path’s **alpha silhouette** (`SourceAlpha`) is optionally blurred and offset along a global light vector.
2. A solid **achromatic color** (`feFlood` via `achromic()`) is masked to that silhouette (`feComposite operator="in"`).
3. Many such passes are **accumulated** (`feBlend mode="normal"`) into one filter output.
4. **Cut depth** combines filter shading with **geometric inset stepping** for cascade layers.
5. **Light direction** animates by mutating `feOffset` `dx`/`dy` on pre-registered nodes — filters are not rebuilt.

There is **no geometry duplication** for shading. One `<path>` per shape; each shade layer re-samples `SourceAlpha`.

There is **no WebGL**, **no fragment shader**, and **no `feMerge`** in the shade stack.

---

## 3. Source Files

| File | Role |
|------|------|
| [`neuMark_I.js`](../../neuMark_I.js) | `Profile`, `ProtoCut`, `Shade`, `ProtoColor` — cut recipes and shade authoring |
| [`ProtoFilter.js`](../../ProtoFilter.js) | `ProtoFilter.shade()` — SVG filter graph construction; `applyFilterToElement()` |
| [`ProtoLayerObjects.js`](../../ProtoLayerObjects.js) | `ShapeGroup` — paths, filter application, R-profile masks |
| [`Grid.js`](../../Grid.js) | Shader layer DOM (`comboElt`, `highElt`, `shadElt`, …) |
| [`Animation.js`](../../Animation.js) | `AnimationController.batchUpdateFilters()` — runtime light rotation |
| [`ProtoStore.js`](../../ProtoStore.js) | `S.Effects`, `S.offsetElts` — global offset registry |
| [`safariCompat.js`](../../safariCompat.js) | WebKit group-isolation filters for masked groups |
| [`drawAsSVG.js`](../../drawAsSVG.js) | `SegPath.inset()` — geometric inset kernel |

---

## 4. End-to-End Pipeline

```
Hash → ProtoMill → CellGroup.cutIslands()
  → ProtoCut (memoized by breed) → #createFilters()
    → Shade.neuShadeSVGFactory() → shade stack
    → ProtoFilter.shade() → <filter> DOM
  → CellGroup.islandsToShapeGroups() — one ShapeGroup per filter
    → ShapeGroup.assignShapes() — <path d="…"> from shape SVG
    → ShapeGroup.drawElement()
      → svgGroupElt.applyFilter(filter)
      → createMaskGroup() (R combo only)
  → Grid shader layers composite in DOM (back → combo → high → shad)
  → AnimationController mutates feOffset when animated
```

**Build-time:** imperative SVG DOM construction; no p5 `draw()` loop.

**Runtime (animation):** `batchUpdateFilters(shadeX, shadeY)` sets `dx`/`dy` on every
registered `feOffset` using stored signed magnitudes (`ProtoFilter.offsetElts` → `S.offsetElts`).

---

## 5. Cut Profiles

Defined in `Profile` (`neuMark_I.js`). Each profile sets inset/outset semantics and
how many filters a `ProtoCut` creates.

### 5.1 Inset vs outset (filter semantics)

```javascript
get hasInsetShade() { return this.isIIn || this.isJIn || this.isROut }
get hasOutsetShade() { return this.isIOut || this.isJOut || this.isRIn }
get hasCastShadow() { return this.isIOut || this.isROut }
```

In `Shade.neuShadeSVGFactory()`, filter inset is derived from the **signed** magnitude
before `mag = 2 * abs(mag)`: negative → inset shade pass; positive → outset.

### 5.2 Filter decomposition per profile

| Profile family | Filters created | ShapeGroups per cut | Notes |
|----------------|-----------------|---------------------|-------|
| **`i`** (flat) | `high` + `shad` | 2 | Separate highlight and shadow filter passes |
| **`j`** (curve) | `combo` | 1 | Highlight + shadow in one filter |
| **`r`** (reverse curve) | `combo` + `high` + `shad` | 3 | Dual curve: `r` on combo, `r2` on high/shad; `r2` often rotated 180° |

`ProtoCut.#createFilters()` implements this branching. `ProtoCut` instances are
**memoized** by breed string in `S.Cuts`; identical cuts share filter definitions.

### 5.3 Profile comparison at the pipeline level

All profiles share the same **filter primitive vocabulary** (`feGaussianBlur`,
`feFlood`, `feOffset`, `feComposite`, `feBlend`). They differ in:

- Number of filters and DOM layers
- Offset magnitude ladders and color luma curves (`neuShadeSVGFactory` branches for `i`, `j`, `r`, `r2`)
- Whether R-combo groups receive a luminance mask (`ShapeGroup.createMaskGroup()`)
- Sign flips and rotation in `#createShader()` (`cutIn`, `r`, `r2`, `angleOffset`)

---

## 6. Shade Authoring (`Shade.neuShadeSVGFactory`)

Location: `neuMark_I.js`.

### 6.1 Offset magnitude ladder

For each filter, the factory builds a sorted list of offset magnitudes (user units),
typically including:

- Fixed anchors (`1`, `2`, `4`) for crisp edges at high resolution
- Fractions of cut depth (`mag`, `mag/2`, `mag/4`, … halving series)
- Layer count trimmed by `keep()` (4–14 layers depending on √mag)

Each magnitude maps to one or two shade objects via `neuShadeSVG()`:

- **`shadeType === 'high'`** — highlight only
- **`shadeType === 'shad'`** — shadow only
- **`shadeType === 'combo'`** — both highlight and shadow

### 6.2 Colors and blur

- Colors are **achromatic** (`ProtoColor.achromic(luma)`), not lit from surface normals.
- Blur radii scale with offset magnitude and curve type (`i`, `j`, `r`, `r2`).
- Luma spreads use circular/exponential easing helpers (`easeInCircNormalized`, etc.)
  tuned for perceptual depth — not physical falloff.

### 6.3 `dropShadeSVG` object shape

Each shade entry passed to `ProtoFilter.shade()`:

```javascript
{ lighten, invert, vector, mag, blur, color, inset }
```

`mag` and `blur` are combined with light vector direction in `buildFilter()` to
produce final `feOffset` `dx`/`dy` and optional `feGaussianBlur stdDeviation`.

---

## 7. Filter Graph (`ProtoFilter.shade`)

Location: `ProtoFilter.js`.

### 7.1 Initial setup

```javascript
feFlood flood-opacity="0" → transparentInput   // base for inset accumulation
insetResult  = transparentInput
outsetResult = SourceGraphic
```

Inset and outset stacks use **asymmetric blend bases** (see KNOWN-ISSUES §9.14.9 for
mask interaction on R cuts).

### 7.2 Per shade layer (in DOM order)

| Step | Primitive | Key attributes | Role |
|------|-----------|----------------|------|
| 1 (optional) | `feGaussianBlur` | `in: SourceAlpha`, `stdDeviation: blur` → `blurred` | Softens alpha silhouette |
| 2 | `feFlood` | `flood-color`, `flood-opacity: 1` → `colored` | Solid highlight/shadow color |
| 3 | `feOffset` | `in: blurred` or `SourceAlpha`, `dx`/`dy` → `offset-blurred` | Directional alpha displacement |
| 4 (inset only) | `feComposite` | `operator: out`, `in: SourceGraphic`, `in2: offset-blurred` → `insetMask` | Interior band mask |
| 5 | `feComposite` | `operator: in`, `in: colored`, `in2: insetMask` or `offset-blurred` → `composite` | Color within alpha |
| 6 | `feBlend` | `mode: normal`, accumulates onto `insetResult` or `outsetResult` | Layer stacking |

**Note:** `blendMode()` contains alternate modes (`multiply`, `screen`, …) but
**returns `'normal'` immediately** — production stacking is normal blend only.

Each `feOffset` registers `{ elt, mag: fullMag }` in `offsetElts` for animation.

### 7.3 Build order and final composite

1. **Inset shades** — `buildFilter(insetShadows, filter, true)` if any
2. **Outset shades** — `buildFilter(outsetShadows, filter, false)` if any
3. **Terminal merge** (when outset shades exist):

```javascript
feComposite operator="out"   // when clearInset === true (default)
  in  = outsetResult
  in2 = insetResult
  → finalResult
```

`operator="out"` punches the inset accumulation out of the outset accumulation.

### 7.4 Filter application (`applyFilterToElement`)

- Inserts `<defs>` containing the filter at **`parentSVG.firstChild`** (Safari requires
  filter defs in ancestor scope, not inside the consuming subtree).
- Wraps the element in `<g filter="url(#id)">`.
- **Filter sharing:** if a group with the same filter URL already exists, new elements
  are reparented into it (`querySelector` on `g[filter="…"]`).

---

## 8. DOM Layer Compositing

Each front grid owns shader layer groups (`Grid.assignElement()`):

| Layer | Element | Typical opacity | Filter type |
|-------|---------|-----------------|---------------|
| Backing | `backElt` | — | none (flat fill) |
| Combo | `comboElt` | 1 | `combo` |
| Highlight | `highElt` | 1 | `high` |
| Shadow | `shadElt` | 0.6 | `shad` |

`CellGroup.islandsToShapeGroups()` iterates `cut.filters` and creates one
`ShapeGroup` per filter, parented to the matching shader layer via `ShapeGroup.shadeElt`.

Each `ShapeGroup`:

1. Creates nested `<svg>` + inner `<g>` (`createSVGGroup()`)
2. Adds `<path>` elements from shape geometry (`assignShapes()`)
3. Sets `fill` to `frameColor` and applies the cut filter (`drawElement()`)

---

## 9. Geometric Inset vs Filter Inset

These are **two separate mechanisms** that combine for cascade depth:

| Mechanism | Location | Effect |
|-----------|----------|--------|
| **Geometric inset** | `Island.createSubIslands()`, `SegPath.inset()`, `Shape.simpleInsetSegPaths` | Shrinks the drawn path per cascade step |
| **Filter inset** | `ProtoFilter.shade()` inset branch | Masks shaded color to interior of alpha silhouette |

`CellGroup.cutIslands()` computes `insetScale` from layer ranges and profile;
geometry propagation stops at `ShapeGroup` (which uses cell bounds for layout —
see ARCHITECTURE §13.2).

---

## 10. R-Profile Luminance Masks

For `ShapeGroup-combo` with R cuts, `createMaskGroup()` (`ProtoLayerObjects.js`):

1. Builds mask paths from `Shape.maskSVG` (inset geometry derived from `maskShape`)
2. Composes a luminance `<mask>` over `FRAME` bounds
3. Fill polarity depends on `profile.hasOutsetShade` (black/white rect vs path)
4. Applies `mask="url(#…)"` on the nested `<svg>`
5. Optionally adds `bboxKeeper` rect for backgrid `rIn` crop stability

This is **geometry-driven compositing outside the filter stack** and materially
affects R-cut appearance. Auxiliary blur uses `p5.Element.blur()` (separate one-primitive
filter on `SourceGraphic`), not the shade stack.

---

## 11. Filter Regions and Safari

`ProtoCut.setLayouts()` sets `filterUnits="userSpaceOnUse"` and absolute `x/y/width/height`
from `FRAME.boundsRect` plus margin:

- Fixed margin for `high` / `shad` filters
- Depth-scaled margin for `combo` filters (`shadeFilterRegionMarginFor`)

This is a **correctness-biased** bounded region (see comments in `neuMark_I.js`).
Tighter per-ShapeGroup regions are deferred — ARCHITECTURE §13.3.

Other Safari-sensitive paths:

- Filter defs placement (`applyFilterToElement`)
- Blur filter bounds (`p5.Element.blur()` — `userSpaceOnUse` when `SAFARI_BLUR_USERSPACE_FIX`)
- Mask + group isolation (`safariCompat.js`)

Full history: KNOWN-ISSUES §§9.13–9.15, ARTBLOCKS-SPRINT Q16–Q19.

---

## 12. Light Animation

1. `globalControls.shadAngle` defines light direction (default 90°).
2. `Shade.shadVect(angle)` → unit vector rotated from +X.
3. At build time, each shade’s offset magnitude is stored on its `feOffset` node.
4. `AnimationController.batchUpdateFilters(shadeX, shadeY)` sets:
   `dx = shadeX * mag`, `dy = shadeY * mag` for all nodes in `S.offsetElts`.

Filters are **not** rebuilt when light rotates. Export and artwork rotation use the
same offset registry (`Export.js`, `ArtworkRotation.js`).

---

## 13. Store and Identity

| Store key | Contents |
|-----------|----------|
| `S.Cuts` | Memoized `ProtoCut` instances |
| `S.Effects` | `ProtoFilter` instances (each filter is an Effect) |
| `S.offsetElts` | Flattened `{ elt, mag }` from all Effects — animation target |
| `S.ShapeGroups` | Render groups consuming filters |

---

## 14. Debugging

- **Filter offset audit:** `testing/WrapperTestHarness.js` — per-cut filter primitive counts and offset ladders
- **Filter region experiments:** `testing/FilterDebugHarness.js` — patches `ProtoCut.setLayouts()`
- **Safari compat console API:** `safariCompat.js` — isolate filter audit, blur filter audit

See TESTING.md for harness entry points and regression hashes.

---

## 15. Accurate One-Paragraph Summary

Arcluminitism is a browser-native SVG shading system. Each filled path is filtered
in place: the path’s alpha silhouette is optionally blurred, offset along a global
light vector, filled with achromatic colors, masked via `feComposite`, and accumulated
through stacked `feBlend` passes. Cut profiles (`i`, `j`, `r`) vary in filter
decomposition (one to three filter passes per cut), offset ladders, color curves,
and—for R cuts—luminance masks derived from inset geometry. Cascade depth combines
filter-based bevel shading with geometric `SegPath.inset()` stepping. Light direction
animates by updating pre-registered `feOffset` nodes without rebuilding filters.

---

*Part of the BoredUI documentation suite. See [docs/](../) for all documents.*
*Last updated: 2026-07-02*
