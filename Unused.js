//MARK: Useful code that went unused!

//CLASS: UnusedSegPath
class UnusedSegPath extends SegPath {
  //METH: cutAllToCardinal()
  static cutAllToCardinal(segPath) {

    //ARROW: shared() : find segments with shared startPoint to input seg's endPoint
    const shared = (seg) => {
      const pairs = segPath.filter(s => seg.end.equals(s.start, 4)) // seg.end = s.start
      if (pairs.length === 2) { return [seg, pairs] } // ordinal connections will have two connections 
    }

    const sharedStarts = segPath.map(seg => shared(seg)).compacted // find all ordinal corner segments
    console.log(`sharedStarts`, sharedStarts)

    sharedStarts.forEach(s => { // swap segment neighbors and remove cubic verts at corners
      const [seg, [nextA, nextB]] = s
      let newNeighbor
      if (seg.neighbors.end.id === nextA.id) { newNeighbor = nextB }      // nextA was initial neighbor
      else if (seg.neighbors.end.id === nextB.id) { newNeighbor = nextA } // nextB was initial neighbor
      else { console.error(`cutAllToCardinal Error: unexpected case hit, please investigate!`) } // Error just in case
      // console.log(`${seg.hasBothCubicVerts}`)
      seg.assignNeighbors({ end: newNeighbor })   // swap seg's endNeighbor
      seg.clearCubicEndVerts()                      // clear seg's CubicEndVerts 
      newNeighbor.assignNeighbors({ start: seg }) // swap newNeighbor's startNeighbor
      newNeighbor.clearCubicStartVerts()            // clear newNeighbor's clearCubicStartVerts 
      // console.log(`${seg.hasBothCubicVerts}`)
    })

    let newPaths = new OpArray
    let oldPath = segPath.copy
    while (oldPath.length > 0) {
      const first = oldPath[0]
      const newPath = first.sortedSegPath
      // console.log(`newPath`, newPath)
      newPaths.push(newPath)
      oldPath = oldPath.exclude(newPath, ['id'])
    }
    console.log(`newPaths: ${newPaths.map(path => path.map(seg => seg.hasBothCubicVerts))}`)


    //FIXME: NEXT STEP: recalculate corners!
    //FIXME: FINAL STEP: return paths and assign them as new subshapes in new shape copy
    //FIXME: ALSO: add an early bailout if no sharedStarts are found, just return original segPath
    return newPaths
  }
}

//CLASS: UnusedGrid
class UnusedGrid extends Grid {

  // MARK: Selection Methods
  // #region Selection Methods
  //FIXME: DEPRECATE: solved the allToCardinal copy issue with SegPath.cutAllToCardinal() instead
  //METH: ordinalConnectedCells() : [Cell] : find all ordinally connected cells in a selection
  ordinalConnectedCells({ selection = this.cells, groupID, islandID } = {}) {
    //ARROW: ordinalNeighbors()  : find ordinally connected neighbors of a cell
    const ordinalNeighbors = (cell) => {
      let validOrdinals = new OpArray
      Direction.Ordinal.directions.forEach(dir => {
        // console.log(`Grid.ordinalNeighbors: ${dir.vals}, `, dir.adjacents.directions)
        const neighbor = this.neighborIsInIsland(cell.index, dir, islandID)
        const adjacents = dir.adjacents.directions.map(adjDir => this.neighborIsInIsland(cell.index, adjDir, islandID))
        // console.warn(`ordinalConnectedCells: neighbor: ${neighbor.id}, adjacents:${adjacents?.map(c => c.id)}}`)
        if (neighbor && adjacents.every(adj => !adj)) { validOrdinals.push(this.neighbor(cell.index, dir)) }
      })
      return validOrdinals
    }

    let ordinals = selection
      .map(cell => ordinalNeighbors(cell)) // get ordinalNeighbors of every cell in selection
      .flat().unique(['id']) // flatten and reduce to unique
      .intersect(selection, ['id']) // intersect with selection to find ordinal neighbors within selection
    // if (groupID) { ordinals = ordinals.filter(cell => cell.groupID === groupID) } // filter group
    // if (islandID) { ordinals = ordinals.filter(cell => cell.islandIDs.has(islandID)) } // filter island
    return ordinals
  }
  //#endregion

  // MARK: Shape Methods
  // #region Shape Methods
  // //METH: drawShapes()
  // drawShapes() { this.shapes.forEach(s => s.drawElement()) }
  // #endregion
}

//CLASS: UnusedSelectionBounds
class UnusedSelectionBounds extends SelectionBounds {
  // MARK: Encoder properties 
  // #region Encoder properties
  //NOTE:https://pressbooks.library.upei.ca/statics/chapter/centre-of-mass-composite-shapes/
  get centerOfMass() {
    if (this.takenWeight === 1) { return vert(0, 0) }
    // print(this.cellAnchor)
    // print(this.cellsCentroid)
    const xWeight = this.xCellValues
      .map(x => x - this.cellsCentroid.x - this.cellAnchor.x + 0.5).numSorted
    const YWeight = this.yCellValues
      .map(y => y - this.cellsCentroid.y - this.cellAnchor.y + 0.5)
    // print(xWeight)
    // print(YWeight)
    return vert(xWeight.sum / this.selectionCount, -YWeight.sum / this.selectionCount)
  }

  get encoderRotation() {
    const com = this.centerOfMass
    // const dir = this.centerOfMass.quadrantDirection
    // print(dir)
    // print(`com.isZero: ${com.isZero}`)
    switch (this.aspect.value) {
      case 0: // square
        // print('square')
        if (com.isZero) { return 0 }        // (0,0)
        if (abs(com.x) === abs(com.y)) {    // x.mag = y.mag
          const angle = com.angleBetween(vert(1, -1))
          return (4 - round(angle * 2 / PI)) % 4
        }
        if (abs(com.x) > abs(com.y)) {      // x.mag > y.mag
          return (com.x > 0) ? 1 : 3        // x > 0
        } else {                            // x.mag <= y.mag
          return (com.y > 0) ? 2 : 0        // y > 0
        }
      case 1: // portrait
        // print('portrait')
        if (com.isZero) { return 0 }        // (0,0)
        if (com.y === 0) {                  // y = 0
          // print('vert is balanced, use hor weight')
          return (com.x > 0) ? 0 : 2        // x > 0
        }
        return (com.y > 0) ? 2 : 0          // y > 0
      case 2: // landscape
        // print('landscape')
        if (com.isZero) { return 1 }        // (0,0)
        if (com.x === 0) {                  // x = 0
          // print('hor (rotated vert) is balanced, use vert weight')
          return (com.y > 0) ? 1 : 3        // y > 0
        }
        return (com.x > 0) ? 1 : 3          // x > 0
    }
  }

  get encoderRotDegrees() { return this.encoderRotation * 90 }

  get encoderCells() { return this.grid.cellRowsRotated(this.boundCellRows, this.encoderRotDegrees) }

  get encodingCosts() {
    return vert(
      this.encodingCellCount - this.encodingWeight('horizontal'),
      this.encodingCellCount - this.encodingWeight('vertical')
    )
  }

  get encodingEfficiency() {
    return min(this.encodingCosts.x, this.encodingCosts.y) / (this.cellBoundsCount * 2)
  }

  get encodingCellCount() { return this.isMostlyTaken ? this.availableCount : this.selectionCount }

  //TODO: complete implementation
  get encodedShape() {
    let cells
    if (this.isMostlyTaken) { cells = this.availableCells }
    else { cells = this.selection }

    // const horCellLines = this.innerCellIslands()
    const horCellLines = this.horCellIslands
    // print(horCellLines)
    const vertCellLines = this.vertCellIslands
    // print(vertCellLines)
  }
  // #endregion
  // MARK: Encoder methods 
  // #region Encoder methods 
  //METH: 
  encodingWeight(direction) {
    if (this.isFull) { return 0 }
    let name
    if (direction instanceof Direction) { name = direction.name }
    else { name = direction }
    let minMax, islands, rowColVals
    switch (name) {
      case 'horizontal':
        minMax = this.yMinMax
        islands = this.horCellIslands
        rowColVals = islands.map(e => e.cellAnchor.y - minMax.x).numSorted.unique()
        break
      case 'vertical':
        minMax = this.xMinMax
        islands = this.vertCellIslands
        rowColVals = islands.map(e => e.cellAnchor.x - minMax.x).numSorted.unique()
        break
      default:
        throw new Error('Invalid Direction: Only horizontal and vertical accepted')
    }
    // print(`${name} islands`)
    // print(islands)
    const islandSavings = islands.filter(e => e.cellCount > 2)
      .map(e => e.cellCount - 2)
      .sum

    // print(`${name} rowColVals: ${rowColVals}`)
    // print(`skippingloop:`)

    let skipping = false
    let skips = 0
    for (let i = 0; i <= (minMax.y - minMax.x); i++) {
      // print(`index: ${i}`)
      if (rowColVals.some(e => e === i)) {
        // print(`index: ${i} is not skipping`)
        if (skipping) {
          skips++
          skipping = false
        }
      } else {
        // print(`index: ${i} is skipping`)
        if (!skipping) { skipping = true }
      }
    }
    // print(`${name} islandSavings: ${islandSavings}`)
    print(`${name} skips: ${skips}`)
    // print(`${name} Total: ${islandSavings - skips}`)
    // print(``)
    return islandSavings - skips
  }
  // #endregion
}