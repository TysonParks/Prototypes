// Archived from ProtoLayerObjects.js Cell (+ one ShapeGroup getter) (2026-06).
// Not loaded by index.html — see archive/README.md.
//
// Commented Cell helpers — paste onto Cell class to revive.
// createInterCopy pairs with archive/ProtoLayer-interGrid.js (InterGrid foundation).

// ── ShapeGroup (same archival batch — line was in ShapeGroup, not Cell) ───────

// get cells() { return this.islands.map(i => i.cells).flat().gridVertSorted }

// ── Cell bounds ─────────────────────────────────────────────────────────────

// get cellBounds() {
//   return memoize(() => {
//     return this.grid.cellBounds({ selection: OpArray.from([this]) })
//   }, `cellBounds`).call(this)
// }
// get boundsRect() {
//   return memoize(() => {
//     this.cellBounds.boundsRect
//   }, `boundsRect`).call(this)
// }

// ── Segment-type probes ───────────────────────────────────────────────────────

// get hasAUTurn() { return this.segments.some(seg => seg.isUTurn) }
// get hasAStair() { return this.segments.some(seg => seg.isStair) }
// get hasACorner() { return this.segments.some(seg => seg.isCorner) }
// get hasAFlat() { return this.segments.some(seg => seg.isFlat) }

// ── Neighbor helpers ──────────────────────────────────────────────────────────

// get neighborSegments() {
//   const cell = this.grid.neighbor(this.index, Direction.Right)
//   return cell?.segments
// }

// get availableCardinalNeighbors() { return this.cardinalNeighbors.filter(c => c.isAvailable) }
// get takenCardinalNeighbors() { return this.cardinalNeighbors.filter(c => !c.isAvailable) }
// get hasTwoCardinalNeighbors() { return this.takenCardinalNeighbors.length === 2 }

// get groupNeighbors() { return this.neighbors.filter(c => c.groupID === this.groupID) }

// get ordinalGroupNeighbors() { return this.ordinalNeighbors.filter(c => c?.groupID === this.groupID) }

// get neighborDirections() {
//   const dirsMap = Directions.Direction.values.map(dir => {
//     let bool = false
//     const cell = this.grid.neighbor(this.index, dir)
//     if (cell) bool = true
//     return [bool, dir]
//   })
//   return new Directions(dirsMap)
// }

// neighborSegment(direction) {
//   const cell = this.grid.neighbor(this.index, direction)
//   const side = cell.sides[direction.opposites.names]
//   return cell.segments.filter(seg => seg.equals(side))
// }

// ── InterGrid foundation — createInterCopy() ────────────────────────────────
// Related: archive/ProtoLayer-interGrid.js, Island.canHaveInterGrid / interCells

// createInterCopy(grid = this.grid.interGrid) {
//   if (this.interCell) {
//     DeBug.error(`interCell already existed!`)
//     return
//   }
//   if (this.grid.validNeighbors({ selection: [this], direction: Direction.DownRight }).isEmpty) {
//     DeBug.error(`No possible interCell: out of bounds.`)
//     return
//   }
//   const
//     interIndex = this.index + .5,
//     interCoords = Vertex.add(this.coords, vert(0.5)),
//     interCell = new Cell({
//       protoParent: grid,
//       svgParent: grid.svgElt,
//       grid: grid,
//       index: interIndex,
//       coords: interCoords,
//     })
//   this.interCell = interCell
// }
