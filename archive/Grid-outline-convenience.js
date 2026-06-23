// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.

// Convenience wrappers for Grid.outline() — used only in testMess.js dev tests.
  //METH: outlineGroup() : Group : outline a group and assign
outlineGroup({ groupID, direction = Direction.All, amount = 1, newGroup = true } = {}) {
  return this.outline({ groupID, direction, amount, newGroup })
}
  //METH: outlineTaken() : Group : outline all taken cells and assign
outlineTaken({ direction = Direction.All, amount = 1, newGroup = true } = {}) {
  return this.outline({ selection: this.takenCells, direction: direction, amount: amount, newGroup: newGroup })
}
