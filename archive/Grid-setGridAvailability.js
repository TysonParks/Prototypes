// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.

// Heavier availability reset than setAvailability() — only used by symmetrize().
  //METH: setGridAvailability() : null : set the availability of a selection of cells
setGridAvailability(selection = this.cells, isAvailable = false) {
  if (selection.isEmpty) { return }
  selection.forEach(cell => {
    const
      thisCell = this.cells[cell.index],
      thisGroup = this.groupNamed(thisCell.groupID)
    // DeBug.log('thisCell id', thisCell.id)
    // DeBug.log('thisCell groupID', thisCell.groupID)
    // DeBug.log('thisCell isAvailable', thisCell.isAvailable)
    // DeBug.log('thisGroup', thisGroup)
    if (thisGroup) thisGroup.cells = thisGroup.cells.filter(cell => cell.id !== thisCell.id)
    thisCell.groupID = -1
    thisCell.isAvailable = isAvailable
  })
}
