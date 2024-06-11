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

class OldestCode {
  //MARK: oldFunctionsNeedToLiveInAMethod!!!

  layout() {
    //NOTE: this was layout.js, created July 5, 2022

    // MARK: CONSTANTS
    const nonAdjRows = [[3, 4], [7, 8], [11, 12], [15, 16], [19, 20], [23, 24], [27, 28]]
    const nonAdjColumns = [[28, 1], [29, 2], [30, 3]]


    const originalMap = [
      0, 1, 2, 3,
      4, 5, 6, 7,
      8, 9, 10, 11,
      12, 13, 14, 15,
      16, 17, 18, 19,
      20, 21, 22, 23,
      24, 25, 26, 27,
      28, 29, 30, 31
    ]
    const columnSort = [
      0, 4, 8, 12, 16, 18, 24, 28,
      1, 5, 9, 13, 17, 21, 25, 29,
      2, 6, 10, 14, 18, 22, 26, 30,
      3, 7, 11, 15, 19, 23, 27, 31
    ]

    // const columnRemap = [
    //   0, 8, 16, 24,
    //   1, 9, 17, 25,
    //   2, 10, 18, 26,
    //   3, 11, 19, 27,
    //   4, 12, 20, 28,
    //   5, 13, 21, 29,
    //   6, 14, 22, 30,
    //   7, 15, 23, 31,
    // ]

    const testInput = [
      60, 16, 24,
      30, 31, 37,
      45, 63, 30
    ]

    const testLayoutX = 3
    const testLayoutY = 3
    const testIndices = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

    // TODO: integrate with Grid and GridGroup Classes

    // MARK: Newer Grid Layout Functions

    // create ordered index slices for each row in a grid layout
    function gridRowIndices(x, y) {
      let rows = [...Array(y).keys()]
      let baseRow = [...Array(x).keys()]
      return rows.map(e => {
        return baseRow.map(f => f + (e * x))
      })
    }
    // create ordered index slices for each column in a grid layout
    function gridColumnIndices(x, y) {
      let columns = [...Array(x).keys()]
      let baseColumn = [...Array(y).keys()].map(e => e * x)
      return columns.map(e => {
        return baseColumn.map(f => e + f)
      })
    }
    // map an array to an array of sliced indices
    function inputToIndices(input = testInput, indices = testIndices) {
      return indices.map(e => { return e.map(f => input[f]) })
    }

    function inputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let indices = gridRowIndices(gridX, gridY)
      return inputToIndices(input, indices)
    }

    function printInputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let rows = inputToGridRows(input, gridX, gridY)
      rows.forEach((e, i) => {
        // print('hi')
        // print(`row ${i}`)
        print(e ? e : 'empty')
      })
    }

    function inputToGridColumns(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let indices = gridColumnIndices(gridX, gridY)
      return inputToIndices(input, indices)
    }

    // find index pairs of similar neighbors in an array
    function similarNeighborsIndices(threshold, input = testIndices) {
      let pairs = []
      for (let i = 0; i < (input.length - 1); i++) {
        if (abs(input[i] - input[i + 1]) <= threshold) {
          pairs.push([i, i + 1])
        }
      }
      return pairs
    }
    // find similar neighbor index pairs in multiple slices
    function similarSlicedNeighborsIndices(threshhold, input = testInput, indices = testIndices) {
      let slices = inputToIndices(input, indices)
      let neighbors = slices.map((e, i) => {
        let localNeighbors = similarNeighborsIndices(threshhold, e)
        // print(`localNeighbors[${i}]:${localNeighbors}`)
        let reindexedNeighbors = localNeighbors.map(f => {
          return f.map(g => indices[i][g])
        })
        // print(`reindexedNeighbors:${reindexedNeighbors}`)
        return reindexedNeighbors
      })
      // print(neighbors.flat())
      return neighbors.flat()
    }
    // find all similar neighbor index pairs in a grid
    function similarGridNeighbors(threshold, gridX = testLayoutX, gridY = testLayoutY, input = testInput) {
      let rowsIndex = gridRowIndices(gridX, gridY)
      let columnsIndex = gridColumnIndices(gridX, gridY)
      let rowNeighbors = similarSlicedNeighborsIndices(threshold, input, rowsIndex)
      let columnNeighbors = similarSlicedNeighborsIndices(threshold, input, columnsIndex)
      // print(`rowNeighbors: ${rowNeighbors}`)
      // print(`columnNeighbors: ${columnNeighbors}`)
      // print([[...rowNeighbors], [...columnNeighbors]].flat())
      return [[...rowNeighbors], [...columnNeighbors]].flat()
    }

    // TODO: DEPRECATE
    // MARK: OG LAYOUT FUNCTIONS
    function createBaseDivs(array = [1, 2, 3, 4]) {
      divs = []
      // create square divs using rns
      if (array.length == 32) {
        divs = array.forEach((e, i) => createSquareBase(e, i))
      }

      // create rect divs using rns64
      if (array.length == 64) {
        divs = array.forEach(
          (e, i) => {
            if (!(i % 2)) {
              createRectBase(e, array[i + 1], (i / 2))
            }
          }
        )
      }
      return divs
    }

    function createCnctDivs(array = [1, 2, 3, 4]) {
      divs = []
    }

    function createSquareBase(e, i) {
      let randomSize = map(e, 0, 255, 4, 30) + "%";
      let iHex5 = hex5[i]
      let name = iHex5 + '\n' + e

      let div = createDiv(name);
      div.style("color", "#ffffff");
      div.style("background-color", "#666666");
      // div.style("transform", "rotate(" + random(-90, 90) + "deg)");
      div.style("padding", randomSize);
      div.style("text-align", "center");
      div.style("border-radius", "20%");
      div.id("div" + i);
      div.parent(b4);
      return div
    }


    function createRectBase(x, y, i) {
      let iHex5 = hex5[i]
      let xMap = floor(map(x, 0, 15, 0, 100))
      let yMap = floor(map(y, 0, 15, 0, 100))
      let xSize = xMap + "px";
      let ySize = yMap + "px";
      let randomSize = xSize + " " + ySize;
      // let baseName = 
      let radius = min(xMap, yMap) / 1 + "px"

      let div = createDiv();
      div.id("div:" + iHex5);
      div.parent(b4);

      if (min(x, y) > 1) {
        div.style("color", "#ffffff")
        div.style("background-color", "#666666");
        // div.style("transform", "rotate(" + random(-180, 180) + "deg)");
        div.style("width", xSize)
        div.style("height", ySize)
        // div.style("padding", randomSize);
        // div.style("display", "flex");
        div.style("line-height", ySize)
        div.style("text-align", "center");
        div.style("justify-items", "center");
        div.style("align-items", "center");
        div.style("border-radius", radius);

        // createDiv(iHex5 + ':' + x + 'x' + y)
        //  .parent(div);
      }
      return div
    }

    // MARK: Test Shapes
    const testPath = `
M 100 100 
L 500 100 
L 500 300 
L 400 400 
L 300 200 
L 300 400 
L 100 300 
L 200 200 
Z
`

    const testShapeVerts = [
      [100, 100],
      [500, 100],
      [500, 300],
      [400, 400],
      [300, 200],
      [300, 400],
      [100, 300],
      [200, 200],
      // [100, 100]
    ]

    const testShape2 = [
      [100, 0],
      [350, 0],
      [350, 250],
      [500, 250],
      [500, 500],
      [400, 500],
      [400, 300],
      [325, 300],
      [325, 400],
      [250, 400],
      // [250, 450],
      [100, 250]
    ]

    const testShape2a = [
      // [100, 0],
      [350, 0],
      [350, 250],
      [500, 250],
      [500, 0],
      // [400, 500],
      // [400, 300],
      // [325, 300],
      // [325, 450],
      // [250, 450],
      // [250, 450],
      // [100, 200]
    ]

    const testShape2b = [
      // [100, 0],
      // [350, 0],
      // [350, 250],
      // [500, 250],
      // [500, 500],
      [400, 500],
      [400, 300],
      [325, 300],
      [325, 400],
      [325, 500],
      // [250, 450],
      // [250, 450],
      // [100, 200] 
    ]

    const testShape2c = [
      // [100, 0],
      // [350, 0],
      // [350, 250],
      // [500, 250],
      // [500, 500],
      // [400, 500],
      // [400, 300],
      // [325, 300],
      [325, 400],
      [250, 400],
      [100, 250],
      [100, 500],
      [325, 500],
    ]

    const testShape5 = [
      [100, 0],
      [500, 0],
      [300, 100],
      [400, 300],
      [300, 300],
      [500, 500],
      [200, 400],
      [100, 500],
      [200, 200],
      [100, 300],
      // [100, 100]
    ]

    const testShape5a = [
      // [100, 0],
      [500, 0],
      [300, 100],
      [400, 300],
      [300, 300],
      [500, 500],
      // [200, 400],
      // [100, 500],
      // [200, 200],
      // [100, 300],
      // [100, 100]
    ]

    const testShape5b = [
      // [100, 0],
      // [500, 0],
      // [300, 100],
      // [400, 300],
      // [300, 300],
      [500, 500],
      [200, 400],
      [100, 500],
      // [200, 200],
      // [100, 300],
      // [100, 100]
    ]

    const testShape5c = [
      // [100, 0],
      // [500, 0],
      // [300, 100],
      // [400, 300],
      // [300, 300],
      // [500, 500],
      // [200, 400],
      [100, 500],
      [200, 200],
      [100, 300],
      // [100, 100]
    ]

    const testShape3 = [
      [100, 0],
      [500, 0],
      [500, 500],
      [400, 500],
      [400, 100],
      [100, 100],
      // [200, 400],
      // [100, 500],
      // [200, 200],
      // [100, 300],
      // [100, 100]
    ]

    const testShape4 = [
      // [100, 0],
      [500, 0],
      [500, 500],
      [400, 500],
      [400, 100],
      [100, 100],
      [100, 0],
      // [200, 400],
      // [100, 500],
      // [200, 200],
      // [100, 300],
      // [100, 100]
    ]

    const testSquare = [
      [100, 100],
      [200, 100],
      [300, 100],
      [400, 100],
      [500, 100],
      [500, 300],
      [500, 500],
      [100, 500],
    ]

    const simpleSquare = [
      [100, 100],
      [500, 100],
      [500, 500],
      [100, 500],
    ]

    const simpleSquarePath = `
M 100 100 
L 500 100 
L 500 500 
L 100 500
Z`

    // TODO:DEPRECATE - DOES NOT WORK! I think I've already replaced all of this somewhere
    // MARK: HASH SEED FUNCTIONS
    // function allConnects(threshold, input = [1, 2, 3, 4], remap = []) {
    //   let rowConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjRows));
    //   let columnConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjColumns, remap));
    //   rowConnects.push(...columnConnects);
    //   return rowConnects
    // }

    // function adjacentPairs(threshold, input = [1, 2, 3, 4], exclude = [], remap = []) {
    //   let previous = -300
    //   let pairs = []
    //   let array = remapByIndex(input, remap)
    //   for (let i = 0; i < array.length; i++) {
    //     let e = array[i]
    //     if (abs(e - previous) <= threshold) {
    //       let match = [i - 1, i]
    //       if (exclude.includes(match) == false) {
    //         pairs.push(match)
    //       }
    //     }
    //     previous = e
    //   }
    //   // pairs
    //   return pairs
    // }
  }
}