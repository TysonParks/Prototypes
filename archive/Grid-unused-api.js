// Archived from Grid.js (2026-06).
// Unused getters/methods removed from production Grid class during E2 cleanup.
// Paste onto Grid.prototype / Grid class body to revive.

// --- Computed properties ---

// get gridBounds() { return this.gridCellBounds.bounds }

// get takenBounds() { return this.takenCellBounds.bounds }

// get cellPoints() {
//   return memoize(() => {
//     return this.gridCellBounds.cellPoints
//   }, `cellPoints`).call(this)
// }

// get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }

// get biggestGroup() {
//   return this.groups.reduce((max, grp) => {
//     if (grp.cells.length > max.cells.length) { return grp }
//     else { return max }
//   })
// }

// get allSimpleSubShapesSegsCounterSorted() {
//   return memoize(() => {
//     return this.allSimpleSubShapesSegs
//       .counterGridVertSorted
//   }, `allSimpleSubShapesSegsCounterSorted`).call(this)
// }

// get allInternalSimpleSubShapes() {               // Internal subshapes run counter-clockwise
//   return memoize(() => {
//     return this.perimeterShapes
//       .filter(s => !s.isSingleShape)               // filter shapes for not singles!
//       .map(s => s.simpleSubShapes.slice(1)).flat()   // map to simpleSubShapes minus their outer shape
//   }, `allInternalSimpleSubShapes`).call(this)
// }

// get allSimpleInsideCorners() {
//   return memoize(() => {
//     return this.allSimpleSubShapesSegs.filter(s => !s.isOutsideCorner)
//   }, `allSimpleInsideCorners`).call(this)
// }

// get availableRows() { return this.cellRows.filter(row => row.every(c => c.isAvailable)) }

// get availableColumns() { return this.cellColumns.filter(col => col.every(c => c.isAvailable)) }

// get gridCornerSegs() {
//   return this.allSimpleSubShapesSegs.cornerElements
//     .map(s => s.startNeighbor)
// }

// --- Cell / neighbor methods ---

// cellIsInAnIsland(cellIndex) {
//   return this.allIslands.some(isle => isle.cells.some(cell => cell.index === cellIndex))
// }

// cellSpanBounds(indexA = this.cells.first, indexB = this.cells.last) {
//   const
//     topLeft = this.cellAt(indexA).anchor,
//     botRight = this.cellAt(indexB).corners.downLeft
//   return findBounds(topLeft, botRight)
// }

// neighborIsTaken(cellIndex, direction) { return !this.neighborIsAvailable(cellIndex, direction) }

// availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isAvailable) }

// takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isTaken) }

// ordinalNeighbors(cellIndex) {
//   return Direction.Ordinal.directions.map(dir => this.neighbor(cellIndex, dir))
// }

// --- Selection methods ---

// transformedCellRows({ selection = this.cellRows, start = Corner.TopLeft, direction = Direction.Horizontal } = {}) {
//   if (!selection.is2D) selection = this.toCellRows(selection)
//   if (start instanceof Corner) start = start.value
//
//   let isVertical
//
//   if (direction instanceof Direction) isVertical = direction.isVertical
//   if (direction instanceof String) isVertical = direction === 'vertical'
//   if (Number.isFinite(direction)) isVertical = direction === 0
//
//   switch (start) { // horizontal direction
//     case 0: //upLeft -> no change
//     case 1: //upRight
//       selection = selection.flipped2D(Direction.Horizontal)
//     case 2: //downRight
//       selection = selection.rotated2D(180)
//     case 3: //downLeft
//       selection = selection.flipped2D(Direction.Vertical)
//   }
//
//   if (isVertical) { //vertical direction
//     if (start % 2 === 0) { // upLeft &  downRight
//       selection = selection.flipped2D(Direction.NegOrdinal)
//     } else { //upRight &  downLeft
//       selection = selection.flipped2D(Direction.PosOrdinal)
//     }
//   }
//   return selection
// }
