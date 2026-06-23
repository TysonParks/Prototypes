// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.

// Grid symmetrize() — incomplete; had reassignment bugs (FIXME in source).
  //METH: symmetrize() : null : symmetrize the grid by reflecting or rotating a selection
  //FIXME: somehow it's drawing multiple cell configs as it reassigns
  //TODO: feature: flip a single quad once only
symmetrize({
  selection = this.cellRows,
  direction, // Horizontal/Vertical = HALF, Cardinal = QUAD
  reflection, // BOOL: reflection or rotation
  useAssigned = true,
  useAvailable = true,
  groupIDs,
} = {}) {
  if (!direction.allAreCardinal && direction.vals.length % 2 !== 0) DeBug.error('only Hor, Vert, and Cardinal allowed')
  const isQuad = direction.equals(Direction.Cardinal)             // Horizontal/Vertical = HALF, Cardinal = QUAD
  DeBug.log('isQuad', isQuad)
  if (!selection.is2D) selection = this.toCellRows(selection)
  const bounds = this.cellBounds({ selection: selection })        // get cellBounds of selection
  DeBug.log('bounds', bounds)

  //ARROW: assignSym() : null : assign the transformed cells to the destination cells
  const assignSym = (transformed, destination) => {
    transformed = transformed.flat()                              // flatten half for operations
    destination = destination.flat()                              // flatten half for operations
    DeBug.log('transformed', transformed.map(e => e.id))
    DeBug.log('transformed isAvailable', transformed.map(e => e.isAvailable))
    DeBug.log('destination flattened', destination.map(e => e.id))
    DeBug.log('destination isAvailable', destination.map(e => e.isAvailable))
    if (transformed.length !== destination.length) {              // ensure halves are equal
      DeBug.error('expected selections to have same length')
    }

    destination.forEach((destCell, i) => {
      const transformCell = transformed[i]
      if (useAssigned) {                                          // useAssigned changes assigned cells' groupIDs
        if (groupIDs && !groupIDs?.some(id => id === transformCell.groupID)) {
          DeBug.log('HIT THIS HIT THIS HIT THIS HIT THIS')
        } else {
          if (transformCell.groupID !== -1) {
            DeBug.log('newGroupID', transformCell.groupID)
            destCell.groupID = transformCell.groupID
          }
        }
      }
      if (useAvailable && transformCell.isAvailable === true) {   // useAvailable changes isAvailable cells  
        const currentGroup = this.groupNamed(destCell.groupID)
        if (currentGroup) {                                       // remove cell from currentGroup
          currentGroup.cells = currentGroup.cells.filter(cell => cell.id !== destCell.id)
        }
        destCell.groupID = -1                                     // groupID to -1
        destCell.isAvailable = true                               // isAvailable to true
      }
    })
    DeBug.log('destination transformed isAvailable', destination.map(e => e.isAvailable))
    DeBug.log('destination transformed groupID', destination.map(e => e.groupID))

    if (groupIDs) {                                               //filter destination by groupIDs
      destination = destination.filter(destCell => groupIDs.some(id => destCell.groupID === id))
    } else groupIDs = this.groups.map(group => group.id)          // get all groupIDs

    DeBug.log('destination groupID filtered', destination.map(e => e.id))
    DeBug.log('groupIDs', groupIDs)

    const groupSelections = groupIDs.map(id => {                  // group destCells by groupID
      DeBug.log('process id', id)
      return destination.filter(destCell => destCell.groupID === id)
    })
    DeBug.log('groupID Selections', groupSelections)

    let emptySelections = destination
      .filter(cell => cell.isAvailable === true)                  // filter for only isAvailable cells
    DeBug.log('emptySelections 1', emptySelections)

    emptySelections = emptySelections
      .exclude(groupSelections.flat(), 'id')                      // exclude cells that will be isTaken
    DeBug.log('emptySelections 2', emptySelections.map(e => e.id))

    groupSelections.forEach((selection, i) => {
      const groupID = groupIDs[i]
      const group = this.groupNamed(groupID)
      this.assignCells(selection, groupID)
      //FIXME: need to remove old cells from group
    })
    this.setGridAvailability(emptySelections, true)
  }

  //NOTE:
  // half/quad transformation can be simplified similarly to half/quad selection
  // any quad can be reflected/rotated by reflecting/rotating a half TWICE

  // q reflection: (selected quad + next) half reflect, assign, then (selected quad + previous) half reflect, assign
  // q rotation: (selected quad + next) half rotate(90), assign, then (selected quad + next) half rotate(180), assign
  // h reflection: half reflect, assign
  // h rotation:  half rotate(180), assign

  let sourceDir = direction.random()                                // pick a random direction from available directions
  DeBug.log('sourceDir', sourceDir)
  let source, transformed, destination
  if (isQuad) {                                                     //quad
    source = bounds.half(sourceDir)                                 // get picked half
    DeBug.log('quad source', source)
    destination = bounds.half(sourceDir.opposites)                  // get other half
    if (reflection) {
      direction = sourceDir.andOpposites                            // get flip direction
      transformed = source.flipped2D(direction)                     // flip source
      sourceDir = sourceDir.toLeft                                  // set next source half to -90deg
      DeBug.log('quad direction', direction)
      direction = direction.equals(Direction.Horizontal) ? Direction.Vertical : Direction.Horizontal // rotate flip direction -90deg
      DeBug.log('after quad direction', direction)
    } else {
      transformed = source.rotated2D(90)                            // rotate source 90deg
    }
    assignSym(transformed, destination)
  }
  // half symmetrize
  source = bounds.half(sourceDir)                                   // get picked half
  DeBug.log('half bounds', bounds)
  DeBug.log('half source', source)
  DeBug.log('half source flattened', source.flat().map(e => e.id))
  destination = bounds.half(sourceDir.opposites)                    // get other half
  if (reflection) {
    DeBug.log('reflection direction', direction)
    transformed = source.flipped2D(direction)                       // flip source
  } else {
    transformed = source.rotated2D(180)                             // rotate source 180deg
  }
  assignSym(transformed, destination)
}
