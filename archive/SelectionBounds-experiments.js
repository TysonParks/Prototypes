// Archived from ProtoLayerObjects.js SelectionBounds (2026-06). Not loaded by index.html — see archive/README.md.
//
// SelectionBounds experiments — guide points, centroid, and symmetry subdivision helpers.
// Paste onto SelectionBounds class to revive.
//
// Related: archive/Grid-symmetrize.js calls bounds.half() for half/quad mirror operations.

// ── Guide points — outer-edge vertex guides (debug views / inter-grid layout?) ─

// get xGuidePoints() {
//   return memoize(() => {
//     return this.outerCells.up
//       .map(c => c.sides.up.points).flat()
//       .unique(`id`)
//     // .gridVertSorted
//   }, `xGuidePoints`).call(this)
// }
// get yGuidePoints() {
//   return memoize(() => {
//     return this.outerCells.left
//       .map(c => c.sides.left.points).flat()
//       .unique(`id`)
//       .gridVertSorted
//   }, `yGuidePoints`).call(this)
// }
// get xGuides() {
//   return memoize(() => {
//     return this.xGuidePoints.map(c => c.x).flat()
//   }, `xGuides`).call(this)
// }
// get yGuides() {
//   return memoize(() => {
//     return this.yGuidePoints.map(c => c.y).flat()
//   }, `yGuides`).call(this)
// }

// ── Centroid — balance / symmetry reference point ─────────────────────────────

// get cellsCentroid() { return Vertex.div(this.cellBoundsSize, 2) }
// get centroid() { return Vertex.mult(this.cellsCentroid, this.cellSize) }

// ── Symmetry subdivision — core helpers for abandoned symmetrize pipeline ─────
// Used by Grid.symmetrize() (see archive/Grid-symmetrize.js).

//METH: takes a Cardinal Direction and returns a row selection of corresponding half of the cellBounds
// half(direction) {
//   if (!direction.isCardinal || !direction.isSingle) { DeBug.error('direction must be single Cardinal') }
//   if (this.rowCount < 2 || this.columnCount < 2) { DeBug.error('this grid is too small to get a half') }
//
//   let start, end, length, evenMid, oddMid
//
//   if (direction.isVertical) length = this.rowCount
//   else length = this.columnCount
//   if (length % 2 === 0) evenMid = length / 2
//   else oddMid = floor(length / 2)
//
//   const [first, last] = this.spanCellIndices
//
//   switch (direction.vals[0]) {
//     case 0://up
//       start = first
//       end = this.grid.index(this.xCellMax, evenMid ? evenMid - 1 : oddMid - 1)
//       break
//     case 1://right
//       start = this.grid.index(evenMid ? evenMid : oddMid + 1, this.spanCellVerts.start.y)
//       end = last
//       break
//     case 2://down
//       start = this.grid.index(this.spanCellVerts.start.x, evenMid ? evenMid : oddMid + 1)
//       end = last
//       break
//     case 3://left
//       start = first
//       end = this.grid.index(evenMid ? evenMid - 1 : oddMid - 1, this.yCellMax)
//   }
//   return this.grid.cellSpanRowsBetween(start, end)
// }

//METH: takes an Ordinal Direction and returns a row selection of corresponding quadrant of the cellBounds
// quadrant(direction) {
//   DeBug.log('')
//   if (!direction.allAreOrdinal || !direction.isSingle) DeBug.error('direction must be single Ordinal')
//   if (this.rowCount < 2 || this.columnCount < 2) DeBug.error('this grid is too small to get a quadrant')
//   const val = direction.vals[0]
//
//   let dir = []
//   if (val < 1 || val > 3) dir[0] = Direction.Up
//   else dir[0] = Direction.Down
//   if (val < 2) dir[1] = Direction.Right
//   else dir[1] = Direction.Left
//
//   const
//     firstHalf = this.half(dir[0]).flat(),
//     bounds = this.grid.cellBounds({ selection: firstHalf })
//
//   return bounds.half(dir[1])
// }
