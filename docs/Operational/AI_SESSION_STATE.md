# AI Session State

## What This Document Is Not

This file is temporary working memory for the current debugging/development
session. It is not canonical documentation and may become outdated between
sessions.

Permanent knowledge belongs in:

- `docs/Canonical/*`
- `docs/Operational/KNOWN-ISSUES.md`
- `docs/Operational/ROADMAP.md`
- `docs/Operational/ARTBLOCKS-SPRINT.md`
- `docs/Operational/REVEAL-ANIMATION-STATUS.md`

---

## Session Snapshot

Session timestamp: 2026-06-03

### Current Focus

- Frame/backgrid `rIn` side-crop bug is fixed.
- Remaining small shading issues are rare/subtle and can be deferred unless a
  high-incidence repro appears.
- Remaining geometry, curve, and wrapping bugs are also rare and deferred for
  the ArtBlocks submission path.
- Next implementation focus: Rotation via ArtBlocks PostParams, overlapping
  with ABFeatures cleanup.
- New TODO: local rarity planning is not yet fully designed or implemented.

### Completed Outcomes

- Added `ShapeGroup.createBBoxKeeper()` in `ProtoLayerObjects.js`.
- `bboxKeeper` is scoped to backgrid R combo masks with `outsetShade`.
- It sits under `ShapeGroup.svgElt` as a sibling of the filtered
  `svgGroupElt`, immediately before the mask is applied to `this.svgElt`.
- It fixed the crop without reopening generic/generous filter bounds.
- Manual validation: roughly 50 outputs looked good after the fix.
- Documentation updated:
  - `docs/Operational/FRAME-RIN-CROP-AUDIT.md`
  - `docs/Operational/KNOWN-ISSUES.md` §9.14.11
  - `docs/Operational/ROADMAP.md`
  - `docs/Operational/ARTBLOCKS-SPRINT.md`
  - `docs/Operational/TESTING.md`

### Key Technical Notes

- `FRAME.backGrid.showShapeGroupsDebug(false)` made the crop disappear because
  visible loft-debug geometry expanded the masked parent SVG's effective painted
  bounds.
- Setting those debug paths to `display:none` made the crop return.
- The keeper still worked with `fill-opacity: 0` and no stroke.
- This was a masked outer-SVG bbox issue, not a shader-stack or global filter
  region issue.
- Do not restart this investigation by broadening `ProtoCut` filter regions,
  restoring broad `ShapeGroup.boundsRect`, loosening `Grid.visibleBoundsRect`,
  or changing limited SVG layout helpers.

### Next Session Steps

1. Implement/finalize `Rotation` PostParam handling for ArtBlocks.
2. Clean up ABFeatures / `window.$features` output around PostParams.
3. Define the local rarity plan:
   - final ArtBlocks-facing trait list,
   - sample size,
   - report format,
   - treatment of mutable PostParams such as `Rotation`,
   - connection between local rarity output and ABFeatures cleanup.
4. Keep rare shading and geometry/wrapping bugs deferred unless a targeted fix
   becomes obvious.
