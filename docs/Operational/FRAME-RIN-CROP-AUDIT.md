# Frame R-in Crop Audit

Date: 2026-06-02
Updated: 2026-06-03

Scope: hard side-edge clipping/cropping on large frame/backgrid `rIn` cuts, visible in the combo shade regions. This note records the paths already checked so we do not keep looping back over them, and documents the confirmed fix.

## Confirmed Fix

Status: fixed in `ShapeGroup.createMaskGroup()` / `ShapeGroup.createBBoxKeeper()` (`ProtoLayerObjects.js`).

The working fix is a small invisible `bboxKeeper` rect inserted under `ShapeGroup.svgElt` for backgrid R combo masks with `outsetShade`:

```js
if (outsetShade && this.grid?.isBackGrid) this.createBBoxKeeper()
```

`createBBoxKeeper()` creates a zero-opacity filled rect using the ShapeGroup's anchor/size and padding expanded by the cut depth. The keeper is parented to `this.svgElt`, as a sibling of the filtered `svgGroupElt`, immediately before the mask is applied to `this.svgElt`.

That placement matters. The cropping disappeared when `FRAME.backGrid.showShapeGroupsDebug(false)` added visible loft-debug geometry under the same `ShapeGroup.svgElt`. The crop returned when those debug groups used `display:none`, proving that the browser needed real painted geometry in that masked parent SVG's effective bounds calculation. The keeper recreates that helpful bbox/paint-bound side effect without drawing visible debug strokes.

What worked during testing:

- Visible debug loft geometry under `ShapeGroup.svgElt` made the crop disappear.
- `display:none` debug geometry did not help.
- The keeper continued to work with `fill-opacity: 0`.
- The keeper continued to work after removing stroke attributes entirely.
- Approximately 50 manual output checks looked good after the keeper was added.

What this did **not** do:

- It did not reopen `ProtoCut` filter regions.
- It did not restore broad `ShapeGroup.boundsRect` behavior.
- It did not loosen `Grid.visibleBoundsRect` or the limited SVG layout helpers.
- It did not add a generic/generous global crop workaround.

So this is still in a good position relative to the earlier bounds-tightening work. The fix is scoped to the specific browser bbox failure around masked backgrid `rIn` combo ShapeGroups. It gives the masked outer SVG a correct effective painted region without broadening filter regions or relaxing the major bounds constraints elsewhere.

## Historical Marker

- The current regression cluster is around `lastHash` entries 1498-1501, marked `New Shade Bug` in `artBlocks/tokenHash.js`.
- Those entries were added in commit `8abce4a` on 2026-05-11.
- Relevant commits in the preceding week included:
  - `c8d0182` / `0866b3f`: shade filter region configuration and margin changes.
  - `578e2a5`: shade magnitude retune (`offset / pixToUserUnits` replaced by `offset * .2` in shade factories).
  - `4acc08b`: R maskShape / ShapeGroup mask refactor.

## Already Checked / Do Not Prioritize

These areas were previously investigated and tested without reproducing the current bug source:

- `ProtoCut.shadeFilterRegion` and `shadeFilterRegionMarginFor()`.
- `ProtoFilter.js` limited SVG layout helpers: `svgLimitBounds()`, `limitedSVGLayoutRect()`, `layoutLimited()`, `viewBoxLimited()`.
- `Grid.visibleBoundsRect`.
- `ShapeGroup.boundsRect` frame/cut broadening.
- `ShapeGroup.padding` multiplier.
- Mask rect `.viewBoxLimited()` / `.layoutLimited()`.
- `ProtoFilter.blur()` fixed `userSpaceOnUse` region.
- `safariCompat.js` group-isolate `objectBoundingBox` filter region.
- `Frame.setBackGridGroup()` scalar `padWidth` / `scaled()` expansion suspicion.
- `ProtoCut.maxLayout` legacy percent path.
- `ShapeGroup.finalSize`.
- `Frame.bleed` viewBox/layout.
- Coordinate-space mismatch in `ProtoFilter.applyFilterToElement()` nested SVG/userSpace filter application.
- Shader stack construction as a primary mismatch: for true `rIn`, combo curve `r` resolves to positive `mag`, so `neuShadeSVGFactory()` treats it as an outset-style shade (`inset=false`), matching `Profile.hasOutsetShade`.

## Current R-in Frame Path

1. Frame cuts are generated in `ProtoMill.mkFrame()` (`sketch.js`), then sent through `FRAME.setBackGridGroup(0, true, frameCuts, mill.minInsetAmount)`.
2. `Frame.setBackGridGroup()` builds a backing island first, then calls `this.backGroup.cutIslands()` for each real frame cut.
3. In `CellGroup.cutIslands()`, frame cuts disable dilation (`if (isFrame) useDilation = false`).
4. For `rIn`, `Profile.hasOutsetShade` is true, so the cut's `insetScale` is based on `cutEnd`, not `cutStart`.
5. `ProtoCut` receives `useExtHighDepth: !isFrame`, so frame cuts pass `false`.
6. `ProtoCut.#createFilters()` treats `rIn` as the non-inset R branch:
   - combo: `curve='r'`, `depth`
   - high: `curve='r2'`, `extHighDepth`
   - shad: `curve='r2'`, `-depth`
7. `ShapeGroup.drawElement()` applies the filter to `svgGroupElt`, then calls `createMaskGroup()`.
8. `ShapeGroup.createMaskGroup()` creates R-only masks for combo ShapeGroups.
9. `Frame.maskFrame()` then applies a top-level frame mask to `Frame.svgElt`.

## Historical Suspects

These were the remaining suspects before the `bboxKeeper` fix landed. Keep them as historical context if the issue resurfaces.

### 1. R-in combo mask polarity and target

File: `ProtoLayerObjects.js`, `ShapeGroup.createMaskGroup()`.

For `rIn`, `outsetShade` is true, so the mask is:

- black mask rect
- white mask paths
- `fill-rule="evenodd"`
- `mask-type="luminance"`
- `maskUnits="userSpaceOnUse"`
- mask applied to `this.svgElt`, not directly to `this.svgGroupElt`

This was the highest-value suspect because a too-narrow effective mask/parent region would clip combo shades exactly along the sides. The confirmed fix did not change mask polarity; it added a sibling bbox keeper under the masked `ShapeGroup.svgElt`.

### 2. R-in `Shape.maskShape()` scale

File: `ProtoLayerObjects.js`, `Shape.maskShape()`.

For R profiles, backgrids always compute mask shapes. For `rIn`, the scale is currently:

```js
Vertex.add(this.insetScale, depthScale.mult(.8))
```

and then:

```js
path.insetPath(scale)
```

This was worth checking for the user's "expanded by scaling rather than equal width/height growth" theory. Follow-up inspection showed `insetPath(scale)` converts `scale - 1` into x/y offsets using `cellRadius`; it is not a CSS-style proportional transform scale. The final fix did not change this path math.

Note: `depthScale.mult(.8)` mutates only the fresh local `Vertex` returned by `cutDepthScale`, so it is not a persistent shared-state bug. The `.8` coverage choice itself is still suspect.

### 3. Top-level `Frame.maskFrame()`

File: `ProtoLayerObjects.js`, `Frame.maskFrame()`.

`maskFrame()` clones `this.backGroup.shapeGroups[0].svgGroupElt`, turns all cloned paths white, and applies that mask to `this.svgElt`.

This mask has no explicit `maskUnits`, `maskContentUnits`, layout, or viewBox. It also assumes `shapeGroups[0]` is the correct full backing shape. This was not changed by the confirmed fix.

### 4. `useExtHighDepth: !isFrame` does not affect the `rIn` branch

Files: `ProtoLayerObjects.js` and `neuMark_I.js`.

Frame cuts pass `useExtHighDepth: false`, but `ProtoCut.#createFilters()` only checks `useExtHighDepth` in the inset R branch (`rOut`). The `rIn` branch always uses `extHighDepth` for the high `r2` shader.

This may not directly explain combo side clipping, but it is a frame-specific R asymmetry and should be kept on the list if companion high/shad layer behavior resurfaces.

### 5. Actual frame `rIn` start/end values

Files: `sketch.js` and `ProtoLayerObjects.js`.

`mkFrame()` can force the outermost `rIn` `end` to `1`. Then `setBackGridGroup()` maps `cut.start`/`cut.end` through `scaled()`, and `cutIslands()` uses `cutEnd` as `insetScale` for outset shades.

For future regressions, log the final `cutStart`, `cutEnd`, `insetScale`, `loft`, and `depth` inside the cutting loop. The confirmed fix did not require changing these values.

### 6. Shared front/back shade layers

Files: `ProtoLayerObjects.js` and `Grid.js`.

`Frame.setGrid()` points `backGrid.comboElt`, `highElt`, and `shadElt` at the front grid's shared layer groups. Backgrid frame combo shapes are not isolated in their own top-level layer.

This is lower probability for true hard clipping, but still worth remembering if an artifact changes when front-grid groups are hidden or reordered.

## Fast Manual Checks

- Temporarily disable only `ShapeGroup.createMaskGroup()` for `ShapeGroup-combo` + `rIn` + backgrid. If side clipping disappears, the issue is the R combo mask, not the filter region.
- Keep `createMaskGroup()` enabled but invert `maskRectFill` / `maskPathFill` for `rIn` only. If the artifact flips from side clipping to outside/inside leakage, mask polarity or winding is the culprit.
- Draw `s.maskSVG` paths for failing hashes over the rendered frame. Compare their side extents against the visible combo shade edge.
- Temporarily replace `Vertex.add(this.insetScale, depthScale.mult(.8))` with `this.insetScale` and then with `Vertex.add(this.insetScale, depthScale)` for `rIn` only. This isolates whether the mask inset scale is under-covering the side shade.
- Temporarily bypass `Frame.maskFrame()` while leaving per-R masks intact. If clipping disappears across all frame shader layers, the top-level frame mask is the active crop.

## Debug Clue That Led To Fix

Calling `FRAME.backGrid.showShapeGroupsDebug(false)` makes the side cropping disappear.

That method sets `drawLoft = true` on every ShapeGroup and calls `showDeBug()`. The relevant side effect is `Debuggable.showLofts()`: it appends two visible debug groups (`debugStart` and `debugEnd`) directly under `ShapeGroup.svgElt`. Those debug groups are siblings of the filtered `svgGroupElt`, not children of the filtered group.

This means the debugger was not fixing shader math. It was changing the masked parent SVG's painted bounds / bbox behavior by adding stroked child geometry outside the filtered content. That pointed back toward the region around `ShapeGroup.svgElt`, where `createMaskGroup()` applies `mask="url(...)"` to the outer nested SVG.

Isolation checks and outcomes:

- `display:none` debug paths made the crop return, confirming that visible/painted geometry was expanding the effective bounds.
- A single bbox keeper rect under `ShapeGroup.svgElt` fixed the crop without calling `showLofts()`.
- The keeper still worked with zero fill opacity and no stroke, so the important part is the child element participating in the masked SVG's bounds, not visible stroke thickness.
- The fix only needs to sit as a sibling under `svgElt`; it does not need to alter the filtered `svgGroupElt`, filter region, or mask path geometry.
