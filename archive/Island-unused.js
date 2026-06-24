// Archived from ProtoLayerObjects.js Island (2026-06). Not loaded by index.html — see archive/README.md.
//
// Commented Island helpers — paste onto Island class to revive.
// InterGrid getters pair with archive/ProtoLayer-interGrid.js and archive/Cell-unused.js.

// ── Shape delegation ──────────────────────────────────────────────────────────

// get minCornerRadius() { return this.shape.minCornerRadius }

// ── Shape classification ────────────────────────────────────────────────────

// get isPill() { return this.cellCount === 2 && this.isCardinal }
// get isOrdinalCapsule() { return this.cellCount === 2 && this.isOrdinal }

// ── Offset connections (live: offsetConnectionCells, hasOffsetConnections) ────

// get offsetConnections() { return this.cells.filter(c => c.hasOffsetConnection) }

// ── Exposed geometry wrappers (live: exposedSegments; Grid has exposedCorners) ─

// get exposedCorners() {
//   return this.grid.allExposedCorners({ selection: this.cells, islandID: this.id })
// }

// exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }

// ── InterGrid foundation (TODO: finish after submission) ────────────────────
// Related: archive/ProtoLayer-interGrid.js (createInterGrid, insetAmountToScale)

// get interCells() { return this.grid.shrunkSelection(this.cells) }
// interGridClosure = (cell) => { this.grid.validNeighbors({ selection: [cell], bounds: this.cellBounds, direction: Direction.Cartesian }).length === 3 }
// get canHaveInterGrid() { return this.grid.shrunkSelection(this.cells).length > 0 }
