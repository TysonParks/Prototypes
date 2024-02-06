//MARK: Useful code that went unused!

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
}

