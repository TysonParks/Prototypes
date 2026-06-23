// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// Grid setup helpers — unused; paste onto Grid.prototype to revive.

//METH: cellRowsRotated() : [ [Cell] ] : rotate the cell rows by a given degree (0, 90, 180, 270)
cellRowsRotated(degree = 90, selection = this.cellRows) {
  return selection.rotated2D(normalizeDegree(degree))
}

//METH: setFrameRadii() : null : set the frame radii for the grid
setFrameRadii() {
  FRAME.setCornerRadii(this.gridCellBounds.cornerCellCenters, this.padSize)
}

//METH: setInsetScale() : null : set the inset scale for the grid
setInsetScale(scale) {
  super.setInsetScale(scale)
  this.updateCells()
}

//METH: insetCells() : null : set the inset scale for the cells in the grid
insetCells(scale, groupID) {
  let cells
  if (groupID) {
    const group = this.groupNamed(groupID)
    if (group) cells = group.cells
  } else {
    cells = this.cells
  }
  cells.forEach(e => e.setInsetScale(scale))
}
