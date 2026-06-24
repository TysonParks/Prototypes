// Archived from ProtoLayerObjects.js CellGroup (2026-06). Not loaded by index.html — see archive/README.md.
//
// Commented / superseded CellGroup helpers — paste onto CellGroup to revive.
//
// Note: sketch.js still references nonNeighborIslands, hasOnlySingles, hasOnlyVertLines,
// and hasOnlyHorLines in live code paths — revive getters together if re-enabling outset packing
// or reDirect cut direction logic.

// ── Grid property getters ─────────────────────────────────────────────────────

// get validCardinalNeighbors() {
//   return memoize(() => {
//     return this.grid.validNeighbors({ selection: this.cells, direction: Direction.Cardinal })
//   }, `validCardinalNeighbors`).call(this)
// }

// get neighborGroups() {
//   return this.neighborIslands.map(i => i.groupID).unique().map(gID => this.grid.groupNamed(gID))
// }

// get nonNeighborIslands() {
//   const isles = this.grid.perimeterIslands.copy
//     .exclude(this.perimeterIslands, `id`)
//     .exclude(this.neighborIslands, `id`)
//   if (!isles.isEmpty) { return isles }
// }

// get hasOnlySingles() { return this.perimeterIslands.every(i => i.isSingleCell) }
// get hasOnlyCardSingles() { return this.perimeterIslands.every(i => i.isCardinalSingle) }
// get hasOnlyVertLines() { return this.perimeterIslands.every(i => i.isVertical || i.isCardinalSingle) }
// get hasOnlyHorLines() { return this.perimeterIslands.every(i => i.isHorizontal || i.isCardinalSingle) }

// ── Geometry method wrappers — migrated to Island / Grid ──────────────────────
// Live equivalents: Island.cellIsIsolated(), Island.exposedSides(), Grid.exposedCorners(), etc.

// exposedDirections(cellIndex) { return this.grid.exposedDirections({ cellIndex: cellIndex, groupID: this.id }) }
// exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, groupID: this.id }) }
// exposedCorners(cellIndex) { return this.grid.exposedCorners({ cellIndex: cellIndex, groupID: this.id }) }
// cellIsIsolated(cellIndex, direction = Direction.Cardinal) {
//   this.grid.cellIsIsolated({ cellIndex: cellIndex, groupID: this.id, direction: direction })
// }
