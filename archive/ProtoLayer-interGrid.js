// Archived from ProtoLayerObjects.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// InterGrid tooling — incomplete; planned post-submission. Paste onto ProtoLayer / Island to revive.
//
// Island getters (interCells, canHaveInterGrid, interGridClosure): archive/Island-unused.js

// ProtoLayer — insetAmountToScale
insetAmountToScale(amount) {
  amount = amount instanceof Vertex ? amount : vert(amount)
  return Vertex.sub(this.size, amount).div(this.size)
}

// Island — createInterGrid
createInterGrid() {
  if (!this.canHaveInterGrid) return
  const
    shrunk = this.grid.shrunkSelection(this.cells),
    cellBounds = this.grid.cellBounds({ shrunk: shrunk }),
    insetScale = this.insetAmountToScale(this.grid.cellSize),
    interGrid = new Grid(this.island, { x: cellBounds.columnCount, y: cellBounds.rowCount }, insetScale)
  interGrid.setAvailability()
  // FIXME: cell mapping needs to take offset into account!
  const interCells = shrunk
    .map(cell => cell.coords)
    .map(coords => interGrid.cellAtCoords(coords))
  interGrid.setAvailability(interCells, true)
  // FIXME: interGrid should get assigned to a new 'this.interGrid' property (ProtoLayer?)
}
