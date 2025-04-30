//MARK: GRID CLASS
// SIZE: 3248 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class Grid extends ProtoLayer {
  gridSize
  startCoord
  offset
  cellRows
  cellOutset
  gridStyle                                                                                   //UNUSED: 
  gridType
  frontGrid
  backGrid
  infraGrid
  ultraGrid
  isInterGrid

  backElt
  comboElt
  highElt
  shadElt
  shaderElts
  groups = new OpArray

  constructor({ protoParent,
    gridSize,
    insetScale = 1,
    startCoord = vert(),
    gridStyle = 0,
    gridType = 0,
    isInterGrid = false,
    cellOutset = 0
  } = {}) {
    let type
    switch (gridType) {
      case 0:
        type = `Grid`
        break
      case 1:
        type = `InfraGrid`
        break
      case 2:
        type = `UltraGrid`
        break
      case 3:
        type = `BackGrid`
        break
    }
    super({
      protoParent: protoParent,
      insetScale: insetScale,
      type: type,
      // drawSVG: false,
      // drawRect: true,
      // drawFilter: true,
    })

    this.gridSize = gridSize
    this.startCoord = startCoord
    this.offset = isInterGrid ? 0.5 : 0
    this.cellOutset = cellOutset
    this.gridStyle = gridStyle

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Grids)
    this.cellRows = this.#createRowsArray()
  }

  // MARK: Grid Override Properties
  get gridAspect() { return this.gridSize.y / this.gridSize.x }
  get anchor() { return this.gridStyle === `Flexible` ? super.anchor : vert(0, (1 - this.gridAspect / 2) * 100) }
  get size() { return this.gridStyle === `Flexible` ? super.size : vert(100, this.gridAspect * 100) }
  get boundsRect() {
    return this.gridStyle === `Flexible` ? super.boundsRect : DOMRect.fromRect(
      {
        x: this.anchor.x,
        y: this.anchor.y,
        width: this.size.x,
        height: this.size.y,
      })
  }
  // MARK: Grid Computed Properties
  // #region Computed Properties
  get isBackGrid() { return this.type === `BackGrid` }
  get isFrontGrid() { return this.type === `Grid` }

  get gridCellBounds() {
    return memoize(() => {
      return this.cellBounds()
    }, `gridCellBounds`).call(this)
  }
  get gridBounds() { return this.gridCellBounds.bounds }
  get takenCellBounds() { return this.cellBounds({ selection: this.takenCells }) }
  get takenBounds() { return this.takenCellBounds.bounds }
  get columnCount() { return this.gridCellBounds.columnCount }
  get rowCount() { return this.gridCellBounds.rowCount }
  get cellCount() { return this.gridCellBounds.cellBoundsCount }

  get cellSize() {
    return memoize(() => {
      return Vertex.div(this.insetSize, this.gridSize)
    }, `cellSize`).call(this)
  }
  get cellAspect() {
    return memoize(() => {
      return this.cellSize.aspect
    }, `cellAspect`).call(this)
  }
  get minCellWidth() {
    return memoize(() => {
      return min(this.cellSize.x, this.cellSize.y)
    }, `minCellWidth`).call(this)
  }
  get cellRadius() {
    return memoize(() => {
      return this.minCellWidth / 2
    }, `cellRadius`).call(this)
  }
  get cells() {
    return memoize(() => {
      return this.cellRows.flat()
    }, `cells`).call(this)
  }
  get cellPoints() {
    return memoize(() => {
      return this.gridCellBounds.cellPoints
    }, `cellPoints`).call(this)
  }
  get cellColumns() {
    return memoize(() => {
      return this.cellRowsFlipped()
    }, `cellColumns`).call(this)
  }

  get availableCells() { return this.cells.filter(cell => cell.isAvailable) }
  get takenCells() { return this.cells.filter(cell => cell.isTaken) }
  // get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }                         //UNUSED:
  get isFull() { return this.availableCells.length === 0 }
  get groupCount() { return this.groups.length }
  get lastGroup() { return this.groups.last }
  // get biggestGroup() {                                                                                  //UNUSED:
  //   return this.groups.reduce((max, grp) => {
  //   if (grp.cells.length > max.cells.length) { return grp }
  //   else { return max }
  // })
  // }
  //NOTE: perimeters must be created for every group!
  get perimeterIslands() { return this.groups.map(g => g.perimeterIslands).flat() }
  get islands() { return this.groups.map(g => g.islands).flat() }
  get allIslands() { return this.islands.union(this.perimeterIslands, [`id`]).flat() }
  get shapes() { return this.allIslands.map(i => i.shape).flat() }
  get perimeterShapes() { return this.perimeterIslands.map(i => i.shape) }
  get shapeGroups() { return this.groups.map(g => g.shapeGroups).flat() }

  get allSimpleSubShapes() {
    return memoize(() => {
      return this.perimeterIslands
        .map(i => i.shape.simpleSubShapes).flat()
    }, `allSimpleSubShapes`).call(this)
  }
  get allSimpleSubShapesSegs() {
    return memoize(() => {
      return this.allSimpleSubShapes.flat()
        .gridVertSorted
    }, `allSimpleSubShapesSegs`).call(this)
  }
  get allSimpleSubShapesSegsCounterSorted() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs
        .counterGridVertSorted
    }, `allSimpleSubShapesSegsCounterSorted`).call(this)
  }
  get allSimpleSegPaths() {
    return memoize(() => {
      return this.perimeterShapes.map(sh => sh.simpleSegPaths)
    }, `allSimpleSegPaths`).call(this)
  }
  get allSingleSimpleSubShapes() {                 // subshapes that contain no internal subShapes    
    return memoize(() => {
      return this.perimeterShapes
        .filter(s => s.isSingleShape)                // filter shapes for singles
        .map(s => s.simpleSubShapes).flat()          // map to simpleSubShapes 
    }, `allSingleSimpleSubShapes`).call(this)
  }
  get allInternalSimpleSubShapes() {               // Internal subshapes run counter-clockwise
    return memoize(() => {
      return this.perimeterShapes
        .filter(s => !s.isSingleShape)               // filter shapes for not singles!
        .map(s => s.simpleSubShapes.slice(1)).flat()   // map to simpleSubShapes minus their outer shape
    }, `allInternalSimpleSubShapes`).call(this)
  }
  get allSimpleOutsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs.filter(s => s.isOutsideCorner)
    }, `allSimpleOutsideCorners`).call(this)
  }
  get allSimpleInsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs.filter(s => !s.isOutsideCorner)
    }, `allSimpleInsideCorners`).call(this)
  }

  get availableRows() { return this.cellRows.filter(row => row.every(c => c.isAvailable)) }
  get availableColumns() { return this.cellColumns.filter(col => col.every(c => c.isAvailable)) }

  get gridCornerSegs() {
    return this.allSimpleSubShapesSegs.cornerElements
      .map(s => s.startNeighbor)
  }
  // #endregion
  // MARK: Grid Geometry Methods
  // #region Geometry Methods
  //METH: 
  cellAnchor(x, y) { return Vertex.mult(this.cellSize, vert(x, y)).add(this.insetAnchor) }
  //METH: 
  index(x, y) { return gridPointIndex(x, y, this.gridSize.x, this.offset) }
  //METH: 
  coords(index) { return gridCoords(index, this.gridSize.x, this.offset) }
  //METH: 
  coordsAreInBounds(x, y, bounds = this.gridCellBounds) { return vertIsWithinBounds(vert(x, y), bounds.cellsBounds) }
  //METH: 
  cellAtCoords(x, y) { if (this.coordsAreInBounds(x, y)) { return this.cellAt(this.index(x, y)) } }
  //METH: 
  groupNamed(name) { return this.groups.find(e => e.id === name) || null }
  //METH: 
  islandNamed(name) { return this.allIslands.find(e => e.id === name) || null }
  //METH: 
  shapeNamed(name) { return this.shapes.find(e => e.id === name) || null }
  // #endregion
  // MARK: Grid CellIndex Methods
  // #region CellIndex Methods
  //METH: callAt(cellIndex) : Cell : find cell by index
  cellAt(cellIndex) { return this.cells.find(e => e.index === cellIndex) }
  //METH: cellsWithinBounds()
  cellsWithinBounds(bounds) { return this.cells.filter(c => vertIsWithinBounds(c.center, bounds)) }
  //METH: cellIsInAnIsland() : BOOL : if cell is in an island
  // cellIsInAnIsland(cellIndex) {                                                                         //UNUSED: (caller)
  //   return this.allIslands.some(isle => isle.cells.some(cell => cell.index === cellIndex))
  // }
  //METH: cellSegmentBetween()  : [Cell] : find cells between two indices
  cellSegmentBetween(indexA, indexB) {
    const
      indices = OpArray.from([indexA, indexB]).numSorted,
      a = this.coords(indices[0]),
      b = this.coords(indices[1]),
      direction = a.directionTo(b)               //FIXME: previously used biDirectionTo method, revisit if issues with cellBounds
    if (direction === -1) return -1
    if (direction.allAreCardinal) {
      let seg
      if (direction.allAreHorizontal) seg = this.cellRows[a.y]
      if (direction.allAreVertical) seg = this.cellColumns[a.x]
      const
        start = seg.findIndex(e => e.index === indices[0]),
        end = seg.findIndex(e => e.index === indices[1])
      return seg.slice(start, end + 1)
    }
    if (direction.allAreOrdinal) {
      const slope = a.slopeTo(b)
      let
        seg = new OpArray,
        next = a
      for (let i = a.x; i <= b.x; i++) {
        const cell = this.cellAtCoords(next.x, next.y)
        seg.push(cell)
        next = Vertex.add(next, vert(1, slope))
      }
      return seg
    }
  }
  //METH: cellSegmentBetween()  : [Cell] : find cells between two indices
  cellSpanRowsBetween(indexA, indexB) {
    const
      indices = OpArray.from([indexA, indexB]).numSorted,
      a = this.coords(indices[0]),
      b = this.coords(indices[1])
    let rows = new OpArray
    for (let i = a.y; i <= b.y; i++) {
      const seg = this.cellSegmentBetween(this.index(a.x, i), this.index(b.x, i))
      rows.push(seg)
    }
    return rows
  }
  //METH: cellSpanBetween() : [Cell] : find cells between two indices
  cellSpanBetween(indexA, indexB) { return this.cellSpanRowsBetween(indexA, indexB).flat() }
  //METH: cellSpanBounds()  
  cellSpanBounds(indexA = this.cells.first, indexB = this.cells.last) {
    const
      topLeft = this.cellAt(indexA).anchor,
      botRight = this.cellAt(indexB).corners.downLeft
    return findBounds(topLeft, botRight)
  }
  //METH: directionToNeighbor() : Direction : find direction to neighbor cell
  directionToNeighbor(cell, neighbor) { return cell.coords.directionTo(neighbor.coords) }
  //METH: neighbor() : Cell : find neighbor cell by direction
  neighbor(cellIndex, direction) {
    let coords = this.cellAt(cellIndex).neighborCoords(direction)   // get neighbor coords
    if (this.coordsAreInBounds(coords?.x, coords?.y)) {             // verify coords are inside grid
      return this.cells.find(e => e.coords.equals(coords))
    }
  }
  //METH: #neighborIs() : BOOL : if certain neighbor is available, in certain island, or in certain group
  #neighborIs({ cellIndex, direction, groupID, islandID } = {}) {
    let neighbor = this.neighbor(cellIndex, direction)        // find neighbor 
    if (neighbor) {
      if (groupID) return neighbor.groupID === groupID        // test group membership
      if (islandID) return neighbor.islandIDs.has(islandID)   // test island membership
      return neighbor.isAvailable                             // test availability
    }
    return false
  }
  //METH: neighborIsAvailable() : BOOL : if certain neighbor is available
  neighborIsAvailable(cellIndex, direction) {
    return this.#neighborIs({ cellIndex: cellIndex, direction: direction })
  }
  //METH: neighborIsTaken() : BOOL : if certain neighbor is taken
  neighborIsTaken(cellIndex, direction) { return !this.neighborIsAvailable(cellIndex, direction) }
  //METH: neighborIsInIsland() : BOOL : if certain neighbor is in certain Island
  neighborIsInIsland(cellIndex, direction, islandID) {
    return this.#neighborIs({ cellIndex: cellIndex, direction: direction, islandID: islandID })
  }
  //METH: neighborIsInGroup() : BOOL : if certain neighbor is in certain group
  neighborIsInGroup(cellIndex, direction, groupID) {
    return this.#neighborIs({ cellIndex: cellIndex, direction: direction, groupID: groupID })
  }
  //METH: exposedDirections() : Direction : directions with NO neighbors, i.e. where edges/corners should be drawn
  exposedDirections({ cellIndex, groupID, islandID } = {}) {
    const dirs = Direction.All.directions
    if (groupID) return dirs.filter(e => !this.neighborIsInGroup(cellIndex, e, groupID))
    if (islandID) return dirs.filter(e => !this.neighborIsInIsland(cellIndex, e, islandID))
    return dirs.filter(e => !this.neighborIsAvailable(cellIndex, e))
  }
  //METH: exposedSides() : [Side] : sides with NO neighbors, i.e. where edges should be drawn
  exposedSides({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.allAreCardinal)
      .map(f => this.cellAt(cellIndex).side(f))
  }
  //METH: exposedCorners() : [Corner] : corners with NO neighbors, i.e. where corners should be drawn 
  exposedCorners({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.allAreOrdinal)
      .map(f => this.cellAt(cellIndex).corner(f))
  }
  //METH: cellIsIsolated() : Bool : if cell does NOT have neighbors in given direction, by group, island, or taken (default)
  cellIsIsolated({ cellIndex, groupID, islandID, direction = Direction.Cardinal } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID }).includesMany(direction.directions, ['value'])
  }
  //METH: neighbors() : [Cell]  : find all neighbors of a cell
  neighbors(cellIndex) { return Direction.All.directions.map(dir => this.neighbor(cellIndex, dir)) }
  //METH: availableNeighbors() : [Cell] : find available neighbors of a cell
  availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isAvailable) }       //UNUSED:
  //METH: takenNeighbors() : [Cell] : find taken neighbors of a cell
  takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isTaken) }               //UNUSED:
  //METH: ordinalNeighbors() : [Cell] : find ordinal neighbors of a cell 
  ordinalNeighbors(cellIndex) {                                                                             //UNUSED:
    return Direction.Ordinal.directions.map(dir => this.neighbor(cellIndex, dir))
  }

  // #endregion
  // MARK: Grid Selection Methods
  // #region Selection Methods
  //METH: cellBounds() : SelectionBounds : returns a SelectionBounds object for the grid
  cellBounds({ selection = this.cells, groupID, islandID } = {}) {
    return new SelectionBounds({ selection: selection, grid: this, groupID: groupID, islandID: islandID })
  }
  //METH: shrunkSelection() : [Cell] : returns a selection of cells shrunk by a given amount in a given direction
  shrunkSelection(selection = this.cells, amount = 1, direction = Direction.Cartesian) {
    const excludeEdges = this.inline(selection, amount, direction)
    return selection.exclude(excludeEdges, 'id')
  }
  //METH: toCellRows() : [ [Cell] ] : converts 1D selection array to a 2D CellRows array
  toCellRows(selection) {
    const rows = new map()
    for (const cell of selection) {
      const y = cell.coords.y
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push(cell)
    }
    return OpArray.from(rows.values())
  }
  //METH: transformedCellRows() : [ [Cell] ] : transforms a 1D or 2D selection array into a 2D CellRows array given a start corner and direction
  transformedCellRows({ selection = this.cellRows, start = Corner.TopLeft, direction = Direction.Horizontal } = {}) {
    if (!selection.is2D) selection = this.toCellRows(selection)
    if (start instanceof Corner) start = start.value

    let isVertical

    if (direction instanceof Direction) isVertical = direction.isVertical
    if (direction instanceof String) isVertical = direction === 'vertical'
    if (Number.isFinite(direction)) isVertical = direction === 0

    switch (start) { // horizontal direction
      case 0: //upLeft -> no change
      case 1: //upRight
        selection = selection.flipped2D(Direction.Horizontal)
      case 2: //downRight
        selection = selection.rotated2D(180)
      case 3: //downLeft
        selection = selection.flipped2D(Direction.Vertical)
    }

    if (isVertical) { //vertical direction
      if (start % 2 === 0) { // upLeft &  downRight
        selection = selection.flipped2D(Direction.NegOrdinal)
      } else { //upRight &  downLeft
        selection = selection.flipped2D(Direction.PosOrdinal)
      }
    }
    return selection
  }
  //METH: validNeighbors() : [Cell] : find valid neighbors of a selection of cells
  validNeighbors({ selection = this.cells, bounds = this.gridCellBounds, direction = Direction.All } = {}) {
    let cells = OpArray.from(new Set(selection.flatMap(c => c.validNeighborsCoords(direction, bounds))))
    // DeBug.log(`validNeighbors selection`, selection.map(c => c.id))
    // DeBug.log(`validNeighbors cells`, cells.map(c => c.id))
    cells = cells
      .unique(['x', 'y']) // unique based upon x and y values
      .gridVertSorted // sort by y then x values
      .map(c => this.cellAtCoords(c.x, c.y)) // map to cells
      .exclude(selection, ['x', 'y']) // exclude objects with same x and y values
    return cells
  }
  //METH: allExposedSides() : [Side] : find all exposed sides of a selection of cells
  allExposedSides({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedSides({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .gridVertSorted
  }
  //METH: allExposedCorners() : [Corner] : find all exposed corners of a selection of cells
  allExposedCorners({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedCorners({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .gridVertSorted
  }
  // #endregion
  // MARK: Grid createIslands Method
  // #region createIslands Method
  //METH: createIslands()
  createIslands({
    selection,
    groupID,
    islandID,
    cut,
    direction = Direction.Cardinal,
    maxCorners = true,
    protoParent = this,
    bounds = this.gridCellBounds,
    isTaken = true,
    stored = true,
    insetScale = 1,
    drawFilter = true,
    createShape = true,
  } = {}) {
    DeBug.groupCollapsed(`grid.createIslands`)
    DeBug.log(`Arguments:`, arguments[0])
    DeBug.log(`stored?`, stored)
    DeBug.log(`allIslands`, this.allIslands.map(i => i.id))
    DeBug.log(`island?`, this.islandNamed(islandID))

    let cells, group, island

    if (!groupID && !islandID && !selection) {  // "taken/available" mode - currently unused, probably DEPRECATE!
      if (isTaken) cells = this.takenCells
      else cells = this.availableCells
    }
    //TODO: could/should I migrate from ID to direct reference?
    if (groupID) {                              // "group" mode finds & creates islands within a group
      group = this.groupNamed(groupID)
      cells = group?.cells || new OpArray
      if (group) protoParent = group
    }
    //TODO: could/should I migrate from ID to direct reference?
    if (islandID) {                             // "island" mode finds & creates islands within an island
      island = this.islandNamed(islandID)
      cells = island?.cells || new OpArray
      DeBug.warn(`island found for ${islandID}?`, island)
      if (island) protoParent = island
    }

    if (selection) cells = OpArray.from(selection)
    if (cells.isEmpty) {
      DeBug.groupEnd()
      return
    }

    DeBug.log(`cells`, cells.map(c => c.id))
    let tempIslands = new OpArray
    while (cells.length > 0) {
      let
        cell = cells[0],
        islanders = OpArray.from([cell]),
        fillstack = []
      //NOTE: Non-recursive flood-fill implementation from: https://codeguppy.com/blog/flood-fill/index.html

      //ARROW: findIslanders : 
      const findIslanders = () => {
        fillstack.push(cell)

        while (fillstack.length > 0) {
          let current = fillstack.pop()
          if (current.islandChecked) continue
          // DeBug.warn(`current cell: ${current.id}`)
          let neighbors = this.validNeighbors({ selection: [current], bounds: bounds, direction: direction })
            .filter(e => !e.islandChecked)
          // DeBug.log(`islandChecked-neighbors`, neighbors.map(c => c.id))
          //NOTE: I can't remember why I wrote this logic to work with goupID and islandID. Else case makes sense. This might be a source of problems down the road, or an avenue for something interesting. 
          //TODO: Actually, I wonder if this might be affecting symmetrize bugs? INVESTIGATE!!!
          // if (isTaken) {
          // DeBug.log(`islandChecked-neighbors islandIDs`, neighbors.map(c => Array.from(c.islandIDs)).join(` `))

          if (selection) {                                                  // filter neighbors from selection
            neighbors = neighbors.intersect(selection, ['id'])
            // DeBug.log(`selection-neighbors`, neighbors.map(c => c.id))
          } else {
            if (groupID) {                                                  // find neighbors in group
              neighbors = neighbors.filter(e => e.groupID === groupID)
              // DeBug.log(`groupID-neighbors`, neighbors.map(c => c.id))
            }
            if (islandID) {                                                 // find neighbors in island
              neighbors = neighbors.filter(e => e.islandIDs.has(islandID))
              // DeBug.log(`islandID-neighbors`, neighbors.map(c => c.id))
            }
            else { neighbors = neighbors.filter(e => e.isTaken) } // find neighbors that are isTaken
          }

          neighbors.forEach(e => fillstack.push(e))
          current.islandChecked = true
          islanders.push(current)
          islanders = islanders
            .unique(['id'])
            .gridVertSorted
        }
      }

      findIslanders()
      cells = cells.exclude(islanders, ['id'])
      islanders.forEach(e => e.islandChecked = false)

      DeBug.log(`islandID`, islandID)

      let newIsland = new Island({
        cells: islanders,
        protoParent: protoParent,
        svgParent: this.protoParent.svgElt,
        insetScale: insetScale,
        grid: this,
        groupID: groupID,
        parentIslandID: islandID,
        direction: direction,
        maxCorners: maxCorners,
        stored: stored,
        drawFilter: drawFilter,
        cut: cut,
      })

      if (stored) {
        if (group) group.perimeterIslands.push(newIsland)
        if (protoParent?.type === 'Island' || protoParent?.type === 'PerimeterIsland') {
          if (!protoParent.subIslands) protoParent.subIslands = new OpArray
          protoParent.subIslands.push(newIsland)
        }
      }
      tempIslands.push(newIsland)
    }
    DeBug.log(`tempIslands`, tempIslands.map(i => i.id))

    if (stored) {
      this.updateCells()
      tempIslands.forEach(isle => {
        this.updateCells({ island: isle })
        if (createShape) isle.createShape(insetScale)
        DeBug.warn(isle.shape.svg)
      })
    }

    // tempIslands.forEach(isle => {
    //   DeBug.log(`completed Island ${isle.id} cell-islandIDs`, isle.cells)
    // })

    DeBug.groupEnd()
    DeBug.log(``)
    return tempIslands
  }
  // #endregion
  // MARK: Grid Shape Methods
  // #region Grid Shape Methods
  //METH: createSimpleSubShapes() : null : create simple subshapes for all shapes in the grid
  createSimpleSubShapes() {
    // DeBug.group(`GRID.createSimpleSubShapes called!!!`)
    this.groups.forEach(g => g.createSimpleSubShapes())
    // DeBug.groupEnd()
  }
  // #region end
  //MARK: MAXIMIZE CUDDLES
  //METH: inWrapPerimeter() : null : wrap all simpleSegs within outer parentSegs
  inWrapPerimeter(simpleSegs, parentSegs) {
    // DeBug.warn(`inWrapPerimeter`)
    // DeBug.log(`simpleSegs`, simpleSegs)

    let unmatched = new OpArray
    simpleSegs.forEach(simp => {
      // DeBug.log(`current Seg`, simp)
      const match = parentSegs.find(prnt => simp.hasCoincidentCorner(prnt))
      // DeBug.log(`match`, match)
      if (match) simp.setEndCurveOrigin(match.arcOrigin)
      else unmatched.push(simp)
    })

    // DeBug.warn(`unmatched`, unmatched)
    unmatched.forEach(s => {
      // DeBug.warn(`current unmatched`, s)
      if (s.inWrapper && s.canCurveTo(s.inWrapper.arcOrigin)) s.setEndCurveOrigin(s.inWrapper.arcOrigin)
      else
        s.matchEndCorner()
    })
  }

  get allMinRadiusCorners() { return this.allSimpleSubShapesSegs.filter(s => s.hasMinArcRadius || s.isMinCorner) }

  //METH: curveCellRadiusCorners() : null : curve all corners that have min radius
  curveMinRadiusCorners({ corners = this.allMinRadiusCorners, all = false } = {}) {
    if (all) { corners = this.allSimpleSubShapesSegs }
    DeBug.log(`this.allMinRadiusCorners`, this.allMinRadiusCorners)
    DeBug.log(`corners`, corners)
    // if (!all) { DeBug.log(`allMinRadiusCorners`, corners) }

    // corners = corners.slice(0, 5)                                        //TESTING: reduce processed
    corners.forEach(s => {
      // if (s.id.includes('cell081')                                                                   //LOGGING:
      //   // || s.id.includes('cell008')                                                               //LOGGING:
      //   // || s.id.includes('cell001')                                                               //LOGGING:
      // ) { report = true }                                                                            //LOGGING:
      // let report = false                                                                             //LOGGING:
      // if (report) {                                                                                  //LOGGING:
      //   DeBug.log(``)                                                                              //LOGGING:
      // DeBug.log(s.id)                                                                            //LOGGING:
      //   DeBug.log(`this before`, s.cubicVerts)                                                     //LOGGING:
      // }                                                                                              //LOGGING:
      if (s.isMinCorner) s.setMinEndCorner(true)
      else s.setMinEndCorner()
      // if (report) { DeBug.log(`this after`, s.cubicVerts) }                                        //LOGGING:
      if (!all
        && !s.flushWrapper?.isMinCorner
        && s.flushWrapper?.isCoinOutWrapper
      )
        s.flushWrap()
      // if (report) {                                                                                //LOGGING:
      //   DeBug.log(`calling flushWrap:`, s.coincidentWrapper?.id)                                    //LOGGING:
      //   DeBug.log(`flushWrap:`, s.coincidentWrapper)                                                //LOGGING:
      //   DeBug.log(`cubicVerts:`, s.coincidentWrapper?.cubicVerts, s.coincidentWrapper?.endNeighbor.cubicVerts)
      // }                                                                                            //LOGGING:

    })
  }
  //METH: completeEnds() : null : complete all segment ends that are incomplete
  completeEnds = (testPool, wrap = true) => {
    testPool = testPool
      .filter(s => !s.hasCompleteEndCorner)
      .sort((a, b) => a.arcRadius - b.arcRadius)

    DeBug.warn(`allIncompleteEnds`, testPool)
    DeBug.warn(`allIncompleteEnds`, testPool.map(s => s.arcRadius))

    // testPool = testPool.slice(0, 16)                                       //TESTING: reduce processed
    testPool.forEach(s => {
      // DeBug.log(`current Seg`, s)
      s.matchEndCorner()
      if (wrap) s.flushWrap()
    })
  }

  //MARK: maximizeCuddles()
  //METH: maximizeCuddles() : null : maximize cuddles for all simple subshapes
  maximizeCuddles(
    defaultPool = this.allSimpleSubShapesSegs,
    nestleMode = 0,
    preserveQs = true,
    balance = true,
    respectAdjacents = true,
    interGrid = false) {
    DeBug.log(`defaultPool`, defaultPool)

    //MARK: wrapInterferenceCorners()
    const allInterferenceWrapped = defaultPool
      .filter(s => s.hasInterference && !s.isMinCorner)
      .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
      .sort((a, b) => b.radiantOutWrappers.length - a.radiantOutWrappers.length)
      .sort((a, b) => b.hasDoubleInterference - a.hasDoubleInterference)

    const allInterferenceWrappers = allInterferenceWrapped.flat()
      .map(s => Object.values(s.interferenceWrappers)).flat().compacted
    DeBug.log(`allInterferenceWrapped`, allInterferenceWrapped)
    DeBug.log(`allInterferenceWrappers`, allInterferenceWrappers)

    //ARROW: wrapInterferenceCorners() : null : wrap all interference corners (corners that have concentric wrappers && adjacently intersect)
    const wrapInterferenceCorners = (testPool = allInterferenceWrapped, preserveQuads = preserveQs) => {
      DeBug.warn(`allInterferenceWrapped`, testPool)                                                        //LOGGING:
      DeBug.warn(`allInterferenceWrapped hasDoubleInterference`, testPool.map(s => s.hasDoubleInterference))//LOGGING:
      DeBug.warn(`allInterferenceWrapped outWrapper count`, testPool.map(s => s.radiantOutWrappers.length)) //LOGGING:
      DeBug.warn(`allInterferenceWrapped maxArcRadius`, testPool.map(s => s.maxArcRadius))                  //LOGGING:
      DeBug.warn(`allInterferenceWrapped viableInterferenceOrigins`, testPool.map(s => s.viableInterferenceOrigins))
      DeBug.warn(`allInterferenceWrappers`, allInterferenceWrapped.map(w => w.interferenceWrappers))   //LOGGING:
      DeBug.warn(`allInterferenceWrappers flat`, allInterferenceWrappers)                              //LOGGING:

      //ARROW: removeDuplicates() : null : remove duplicate interference wrappers that cross-reference each other
      const removeDuplicates = () => {
        const
          wrappers = allInterferenceWrappers.map(w => w.innerMostRadiantWrapper),
          dupes = testPool.intersect(wrappers, `id`)

        DeBug.log(`wrappers`, wrappers)
        DeBug.warn(`dupes`, dupes)

        if (!dupes.isEmpty) {
          let reducePool = testPool.copy
          dupes.forEach(d => {
            let dupeCount = 0
            while (reducePool.length > 0) {
              // DeBug.log(`dupeCount`, dupeCount)
              const
                wrap = reducePool.shift(),
                wrappers = OpArray.fromObjectValues(wrap.interferenceWrappers).compacted
              // DeBug.log(`wrap`, wrap)
              // DeBug.log(`wrappers`, wrappers)
              // DeBug.log(`wrap.id`, wrap.id)
              // DeBug.log(`dupe.id`, d.id)
              if (wrap.id === d.id
                || wrappers.some(i => i.innerMostRadiantWrapper.id === d.id)
              ) {
                dupeCount += 1
                // DeBug.log(`dupeCount`, dupeCount)
                if (dupeCount > 1) {
                  testPool = testPool.filter(w => w.id !== wrap.id)
                  dupeCount -= 1
                }
              }
            }
          })
        }
        DeBug.warn(`reduced Pool`, testPool)
      }
      removeDuplicates()

      // testPool = testPool.slice(0, 1)                                        //TESTING: reduce processed
      testPool.forEach(s => {
        //ARROW: setCurve() : null : set curve for interference wrappers
        const setCurve = (seg, isStart) => {
          const wrapType = isStart ? `start` : `end`
          DeBug.warn(`setCurve ${wrapType}`)
          let dir                                                               // direction of perpendicular seg
          if (s.isOutsideCorner) dir = isStart ? s.direction.toLeft : s.direction
          else dir = isStart ? s.direction : s.direction.toRight

          const
            perpEnd = Vertex.add(dir.lineVector, origin),                       // calculate end of perpendicular seg
            perpSeg = segment(origin, perpEnd),                                 // calculate perpendicular seg
            projected = perpSeg.intersectionWith(seg.maxArcBoundsSeg, true)     // calculate intersect
          DeBug.log(`seg`, seg)                                                                         //LOGGING:
          DeBug.log(`wrapped direction`, s.direction.name)                                              //LOGGING:
          DeBug.log(`wrapper direction`, seg.direction.name)                                            //LOGGING:
          DeBug.log(`perp direction`, dir.name)                                                         //LOGGING:
          DeBug.log(`perpSeg`, perpSeg)                                                                 //LOGGING:
          DeBug.log(`projected`, projected)                                                             //LOGGING:
          DeBug.log(`viableArcOrigins`, seg.viableArcOrigins)
          if (seg.radiantInWrappers && seg.innerMostRadiantWrapper.canCurveTo(projected)) {
            seg = seg.innerMostRadiantWrapper
            DeBug.error(`changed seg`, seg.id)                                                          //LOGGING:
            DeBug.log(seg)                                                                              //LOGGING:
          }
          if (seg.currentViableArcOrigins.some(o => o.equals(projected, 0))
            && seg.inWrappers ? seg.inWrappers.every(i => i.canCurveTo(projected, true)) : true        // prevent from curving to self 
          ) {
            DeBug.log(`curving ${wrapType}wrapper!`)                                                    //LOGGING:
            seg.setEndRadiantOutWrapsOrigin(projected)
            seg.flushWrap()
          }
        }

        DeBug.error(`interferenceWrapped in queue:`, s)
        DeBug.error(`interferenceWrappers:`, s.interferenceWrappers)
        DeBug.log(`neighbors`, s.neighborsArray)

        const viables = s.viableInterferenceOrigins
        let origin
        if (viables) {
          DeBug.log(`viables`, viables)
          if (preserveQuads && s.isEdgeOfQuad
            && viables.some(v => v.equals(s.shape?.center, 1))) {
            origin = s.shape.center
          } else {
            origin = viables.last
          }
        } else DeBug.log(`NO viableInterferenceOrigins found!`)

        if (origin
          && s.outerMostRadiantWrapper.canCurveTo(origin, true)
          // && Object.values(s.interferenceWrappers).every(i => i.canCurveTo(origin, true))
        ) {
          DeBug.log(`origin found!`, origin)
          s.setEndRadiantOutWrapsOrigin(origin)
          let { start, end } = s.interferenceWrappers
          if (start) setCurve(start, true)
          if (end) setCurve(end, false)
        } else DeBug.log(`NO origin found!`)
      })
    }

    //MARK: wrapInnerMost()
    //ARROW: wrapInnerMost() : null : wrap all inner most wrappers with concentric wrappers
    const wrapInnerMost = (testPool = defaultPool, preserveQuads = preserveQs, balanced = balance) => {
      DeBug.warn(`wrapInnerMost testPool`, testPool)
      testPool = testPool
        .filter(s =>
          //FIXME: removed !s.hasInterference to fix #469    
          // !s.hasInterference                                     // interference wraps should be previously processed
          // &&
          s.isInnerMostWrapper
          && !s.isMinCorner
          &&
          s.isInnerMostRadiantWrapper                               // only wrapping innerMostWrappers
          && !s.hasArc                                              // prevent from re-wrapping
          && (s.coinOutWrapper ? s.radiantOutWrappers?.length > 1 : !!s) // filter out potential flushWrap only
        )
        .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
        .sort((a, b) => b.radiantOutWrappers.length - a.radiantOutWrappers.length)

      DeBug.warn(`allInnerMostWrappers`, testPool)
      DeBug.warn(`allInnerMostWrappers outWrappers`, testPool.map(s => s.radiantOutWrappers.length))
      // DeBug.warn(`allInnerMostWrappers viables`, testPool.map(s => s.viableRadiantOrigins))

      // testPool = testPool.slice(0, 1)                                        //TESTING: reduce processed
      testPool.forEach(s => {
        DeBug.error(`innerMost in queue`, s)                                                                //LOGGING:
        // DeBug.groupCollapsed(`innerMost in queue`, s)                                                    //LOGGING:
        const viables = s.viableRadiantOrigins
        DeBug.log(`viableArcOrigins`, s.viableArcOrigins)                                                   //LOGGING:
        DeBug.log(`currentViableArcOrigins`, s.currentViableArcOrigins)                                     //LOGGING:
        DeBug.log(`viableRadiants`, viables)                                                                //LOGGING:
        DeBug.log(`radiantOutWrappers`, s.radiantOutWrappers)                                               //LOGGING:
        DeBug.log(`radiantOutWrappers`, s.radiantOutWrappers.map(r => r.viableArcOrigins))              //LOGGING:

        if (viables) {
          const shape = s.shape
          DeBug.log(shape)
          if (preserveQuads
            && shape.isQuad
            && shape.simpleSubShapes.flat().every(c => !c.hasInterference)
            && allInterferenceWrappers.every(i => i.innerMostRadiantWrapper.id !== s.id)
            && s.radiantOutWrappers.every(r => r.viableArcOrigins?.some(o => o.equals(s.middleArcOrigin, 0)))
          ) {  // shape is quad
            DeBug.warn(`shape is quad!`, s)
            s.assignMid()                                                               // make circular/pill
            s.endNeighbor.assignMid()                                                   // make circular/pill
            s.setEndRadiantOutWrapsOrigin()
            return
          } else if (balanced                                                           // balanced
            // && !s.interference
            && (testPool.some(seg => seg.id === s.endNeighbor.id && !s.endNeighbor.hasArc)
              // || s.inWrappers?.some(inWrap => !inWrap.canRadiateTo(s))
            )
          ) {
            s.setArcToMiddle()
            s.setEndRadiantOutWrapsOrigin()
            s.endNeighbor.setArcToMiddle()
            s.endNeighbor.setEndRadiantOutWrapsOrigin()
          } else {                                                                      // not balanced
            const origin = viables.last
            DeBug.log(`radiant wrapping to ${origin.string}`)
            s.setEndRadiantOutWrapsOrigin(origin)
            if (s.outerMostRadiantWrapper.outWrapper) {
              DeBug.log(`outerMostRadiantWrapper`, s.outerMostRadiantWrapper)
              s.outerMostRadiantWrapper.adjWrap()
            }
          }
          // DeBug.groupEnd()                                                                             //LOGGING:
        }
      })
    }

    //MARK: fixBadAdjWraps()
    //ARROW: fixBadAdjWraps() : null : fix adjacent wraps that are diverging/converging
    const fixBadAdjWraps = (testPool = defaultPool, canWrapIn = true) => {
      testPool = testPool
        .filter(s =>
          s.isAdjOutWrapper
          && !s.isMinCorner
          // && s.hasDiagonalCorner(s.inWrapper)                   // 
          && (s.adjWrapIsDiverging || s.adjWrapIsConverging)
        )
        .sort((a, b) => b.arcRadius - a.arcRadius)
      DeBug.log(`badAdjWraps`, testPool)

      // testPool = testPool.slice(0, 1)                                            //TESTING: reduce processed
      //FIXME: Implement this in a while loop as used in fixLoosies(), can we reuse finishing testPool code?
      testPool.forEach(s => {
        DeBug.error(`badAdjWrap in queue:`, s)                                                          //LOGGING:
        // DeBug.groupCollapsed(`badAdjWrap in queue:`, s)                                                //LOGGING:

        //ARROW: wrapOutFix() : null : wrap out to self
        const wrapOutFix = () => {                                  // adjWrap() inWrapper to wrap Out to self
          DeBug.log(`inWrapper:`, s.inWrapper)
          s.inWrapper.adjWrap(true)                                 // adjWrap() should handle div/conv and equid/prox
          s.inWrapper.replaceEndRadiantOutWrapsOrigin(s.arcOrigin)  // radiant outwrapping
        }
        //ARROW: wrapInFix() : null : wrap in to self
        const wrapInFix = () => {
          DeBug.log(`inWrapper:`, s.inWrapper)
          if (s.inWrapper.isInWrappedToRadiants) {
            DeBug.log(`abort fix: inWrapper is wrapped to radiants`)
            return
          }
          s.adjWrap(true)                                           // adjWrap self to wrap in
          s.inWrapper.flushWrap(true)                               // only do a single flushWrap in
        }

        if (s.isOutWrappedToRadiants) {                             // bail if s is already wrapped to outer radiants
          DeBug.log(`is outWrapped to radiants`)                                                      //LOGGING:
          if ((s.inWrapper.isInWrapped || s.inWrapper.isInWrappedToRadiants)
            // && s.neighborsArray.every(n => !n.isInWrappedToRadiants)
            // && s.neighborsArray.some(n => !n.isInWrappedToRadiants)
          ) {
            DeBug.log(`inWrapper is inWrapped to radiants`)                                           //LOGGING:
            // DeBug.log(`neighbors`, s.neighborsArray.map(n => n.isInWrappedToRadiants))                //LOGGING:
            const inner = s.inWrapper.innerMostRadiantWrapper
            DeBug.log(`inner`, inner)
            if (s.neighborsArray.every(n => !n.isInWrappedToRadiants)) {          // fixes: #453, #472
              DeBug.log(`inner.viableRadiantOrigins`, inner.viableRadiantOrigins)
              inner.replaceEndRadiantOutWrapsOrigin(inner.viableRadiantOrigins?.last)
              this.completeEnds(inner.andNeighborsArray)
            } else if (s.neighborsArray.some(n => !n.isInWrappedToRadiants)) {    // fixes: #493
              // inner.replaceEndCurveOrigin(inner.viableRadiantOrigins?.last)
              // DeBug.log(`inner.viableRadiantOrigins`, inner.viableRadiantOrigins)
            }
            if (!s.inWrapper.isProximalWrapped(s)) {
              s.inWrapper.adjWrap(true)
              s.replaceEndRadiantOutWrapsOrigin()
            }
          }
          return
        }

        if (s.adjWrapIsConverging) {                            // curveOuterLess or curveInnerMore to fix
          DeBug.log(`wrap is converging`)
          if (s.canCurveLessAtEnd) {
            DeBug.log(`curve outer less with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            DeBug.log(`curve inner more with wrapInFix()`)
            wrapInFix()
          } else {
            DeBug.log(`no fix`)
          }
        } else if (s.adjWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          DeBug.log(`wrap is diverging`)
          if (s.canCurveTo(s.inWrapper.arcOrigin, true)
            && !s.outWrapper?.isMinCorner
          ) {
            DeBug.log(`curve outer more with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveTo(s.arcOrigin, true)
          ) {
            DeBug.log(`curve inner less with wrapInFix()`)
            wrapInFix()
          } else {
            DeBug.log(`no fix`)
          }
        }
        this.completeEnds(s.andNeighborsArray)
        // DeBug.groupEnd()                                                                              //LOGGING:
      })
    }

    //MARK: fixBadFlushWraps()
    //ARROW: fixBadFlushWraps() : null : fix flush wraps that are diverging/converging
    const fixBadFlushWraps = (testPool = defaultPool, canWrapIn = true) => {
      testPool = testPool
        .filter(s =>
          s.isFlushOutWrapper
          && !s.hasMinArcRadius
          && s.flushWrapIsNonEquidistant
        )
      DeBug.log(`badFlushWraps`, testPool)

      testPool = testPool.slice(0, 1)                                      //TESTING: reduce processed
      testPool.forEach(s => {
        //ARROW: checkNeighbors() : null : check neighbors for bad adjWraps
        const checkNeighbors = (neighbors) => {
          neighbors = neighbors.filter(n => n.adjWrapIsNonEquidistant)
          if (!neighbors.isEmpty) fixBadAdjWraps(neighbors)
        }

        //ARROW: wrapOutFix() : null : wrap out to self
        const wrapOutFix = () => {                                // adjWrap() inWrapper to wrap Out to self
          if (s.inWrapper) {
            DeBug.log(`using wrapOutFix on:`, s.inWrapper)
            s.inWrapper.flushWrap(true)                           // adding true fixes collinear convergences #304
            s.inWrapper.replaceEndRadiantOutWrapsOrigin()
            s.replaceEndRadiantOutWrapsOrigin()
            if (s.adjWrapIsNonEquidistant) {
              s.adjWrap(true)                                     //TODO: fixes hor aspect cell bug, remove if problematic       
            }
            checkNeighbors(s.neighborsArray)
          }
        }
        //ARROW: wrapInFix() : null : wrap in to self
        const wrapInFix = () => {
          DeBug.log(`using wrapInFix`)
          s.inWrapper.replaceEndCurveOrigin(s.arcOrigin)
          if (s.inWrapper.radiantOutWrappers?.some(o => !s.isRadiantWrapped(o) && s.canRadiateTo(o))) {
            s.inWrapper.replaceEndRadiantOutWrapsOrigin()
          }
          checkNeighbors(s.neighborsArray)
        }

        DeBug.error(`current badFlushWrap: `, s)
        DeBug.error(`inWrapper: `, s.inWrapper)

        if (s.flushWrapIsConverging) {                            // curveOuterLess or curveInnerMore to fix
          DeBug.log(`flushWrapIsConverging`)
          if (s.canCurveLessAtEnd) {
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            wrapInFix()
          }
        } else if (s.flushWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          DeBug.log(`flushWrapIsDiverging`)
          if (s.couldCurveMoreMoreAtEnd) {
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveLessAtEnd) {
            wrapInFix()
          }
        }
      })

    }

    //MARK: fixLoosies()
    //ARROW: fixLoosies() : null : fix loosies (corners that are already curved but can potentially curve more at end)
    const fixLoosies = (testPool = defaultPool, balanced = balance, loners = true, ignoreMinRadius = true) => {

      //ARROW: filterPool()
      const filterPool = (pool) => {
        return pool
          .filter(s =>
            s.canCurveMoreAtEnd                                                 // main defining property of a loosie
            && !s.isMinCorner
            // && (s.flushWrapIsNonEquidistant || s.adjWrapIsNonEquidistant)        // wrap is bad
            && !s.isEdgeOfQuad                                                  // roundQuads() handles quad corners
            && (s.hasNoWrappers || s.isInnerMostWrapper || s.isOuterMostWrapper)// 3 main categories, inbetweens not needed
            // && !s.hasInterference
            // && !s.innerMostRadiantWrapper?.hasInterference
          )
          .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
          .sort((a, b) => {
            const radiantsCount = (s) => { s.radiantOutWrappers?.length || s.radiantInWrappers?.length || 0 }
            return radiantsCount(a) - radiantsCount(b)
          })
          .sort((a, b) => b.isOutsideCorner - a.isOutsideCorner)
      }
      testPool = filterPool(testPool)

      DeBug.log(`loosies`, testPool.map(s => s.id))
      DeBug.log(`loosies`, testPool)
      DeBug.log(`loosies outWrappers`, testPool.map(s => s.outWrappers?.length))

      let processed = new OpArray

      // testPool = testPool.slice(0, 1)
      while (testPool.length > 0) {
        const s = testPool.shift()
        DeBug.error(`current loosie`, s)

        //ARROW: minRadFix()
        const minRadFix = () => {
          DeBug.log(`minRadFix()`)
          if (s.neighborsArray.some(n => {
            DeBug.log(`${s.id} neighbor`, n)
            return n.canCurveMoreAtEnd
              && (n.flushWrapIsNonEquidistant || n.adjWrapIsNonEquidistant)
              && n.coincidentWrapper?.canCurveMoreAtEnd
          })) {                                                   // check and curve neighbor fully
            if (balanced) {
              DeBug.log(`balanced fix`)
              if (s.canCurveToMiddleOrigin) {
                if (s.startNeighbor.canCurveToMiddleOrigin) {
                  s.startNeighbor.setArcToMiddle()
                  s.setArcToMiddle()
                  s.endNeighbor.replaceEndCurveOrigin(s.endNeighbor.currentMaxArcOrigin)
                } else if (s.endNeighbor.canCurveToMiddleOrigin) {
                  s.setArcToMiddle()
                  s.endNeighbor.setArcToMiddle()
                  // DeBug.log(`hasArc`, s.startNeighbor.hasArc)
                  // DeBug.log(`flatAmount`, s.startNeighbor.flatAmount)
                  // DeBug.log(`arcOrigin`, s.startNeighbor.arcOrigin)
                  // DeBug.log(`currentMaxArcOrigin`, s.startNeighbor.currentMaxArcOrigin)
                  s.startNeighbor.replaceEndCurveOrigin(s.startNeighbor.currentMaxArcOrigin)
                }
              }
            } else {
              DeBug.log(`Unbalanced fix`)
              if (s.startNeighbor.canCurveMoreAtEnd)                       // check startNeighbor
                s.startNeighbor.replaceEndRadiantOutWrapsOrigin(s.startNeighbor.currentMaxArcOrigin)
              if (s.endNeighbor.canCurveMoreAtEnd)                         // check endNeighbor
                s.endNeighbor.replaceEndRadiantOutWrapsOrigin(s.endNeighbor.currentMaxArcOrigin)
            }
            if (ignoreMinRadius) {                                        // check if this can still curve more
              s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            }
            fixBadFlushWraps(s.segPath)
          } else {
            //TODO: Might need to add constraints to this!
            if (s.canCurveMoreAtEnd) s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
          }
        }

        //NOTE: case: s.hasNoWrappers
        if (s.hasNoWrappers && loners) {
          DeBug.log(`loners fix`)
          if (s.isOutsideCorner
            && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)
            && s.neighborsArray.every(n => !n.isOutWrappedToRadiants)) {
            minRadFix()
          } else {
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
          }
        }

        //NOTE: case: s.isInnerMostWrapper
        if (s.isInnerMostWrapper) {
          DeBug.log(`s.isInnerMostWrapper`)
          if (s.isOutsideCorner && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)) {  // case:  this has minRadius 
            DeBug.log(`this has minRadius`)
            if (s.outWrapper.isMinCorner) {
              DeBug.log(`wrapped to assigned minCorner`)
              return
            }
            if (s.isOutWrappedToRadiants && !s.outWrapper.hasMinArcRadius) {
              DeBug.log(`outwrapping`)
              if (s.viableRadiantOrigins?.some(v => v.equals(s.currentMaxArcOrigin, 1)))
                s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
            } else {
              if (s.outWrapper.hasMinArcRadius && s.canCurveMoreAtEnd) {        // case: tucked inside minRadius corner
                DeBug.log(`maximizing neighbor curves first`)
                minRadFix()
              }
              else if (ignoreMinRadius && s.currentMaxArcRadius > 3 * s.cellRadius)
                s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
              else minRadFix()
            }
          }

          //NOTE: case: this isn't the inWrapper to this outWrapper
          if (s.id !== s.outWrapper.inWrapper?.id) {
            DeBug.log(`this isn't the inWrapper to this outWrapper`)
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            s.flushWrap(true)
            s.radiantOutWrappers?.forEach(o => {
              if (o.canCurveMoreAtEnd) o.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            })
          }

          if (s.radiantOutWrappers?.every(w => w.canCurveMoreAtEnd)) {
            DeBug.log(`outWrappers fix`)
            s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
          }

          const outWrapper = s.inOutFlushWrappers[1]
          //NOTE: case: colWrapped & has rad outWrappers
          if (s.flushWrapIsEquidistant && outWrapper.radiantOutWrappers) {
            DeBug.log(`colWrapped & has rad outWrappers`)
            DeBug.log(`outWrapper`, outWrapper)

            if (outWrapper.canCurveMoreAtEnd                                          // outWrapper can STILL curve more
              && !outWrapper.isOutWrappedToRadiants                                   // outWrapper is not outwrapped to radiants
              && outWrapper.radiantOutWrappers.every(ro => !ro.canCurveMoreAtEnd)) {  // radiant outWrappers can't curve more
              outWrapper.replaceEndCurveOrigin(outWrapper.currentMaxArcOrigin)
              outWrapper.flushWrap(true)
            }
            //NOTE: case: only s & flushWrapper can curve more
            if (!respectAdjacents
              && outWrapper.canCurveTo(s.currentMaxArcOrigin)
              && !outWrapper.outWrapper.canCurveTo(s.currentMaxArcOrigin)
            ) {
              const neighbor = s.endNeighbor
              if (balanced
                && neighbor.outWrapper?.canCurveTo(neighbor.currentMaxArcOrigin)
                && !neighbor.outWrapper?.outWrapper.canCurveTo(neighbor.currentMaxArcOrigin)
              ) {
                s.setArcToMiddle()
                s.flushWrap(true)
                neighbor.setArcToMiddle()
                neighbor.flushWrap(true)
              } else {
                s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
                s.flushWrap(true)
              }
            }
          }
        }

        //NOTE: case: s.isOuterMostWrapper
        if (s.isOuterMostWrapper) {
          DeBug.log(`s.isOuterMostWrapper`)
          if (s.radiantInWrappers                            // case: has radiantInWrappers
            && !s.isInWrapped                                //TODO: fixes hor aspect cell bug, remove if problematic
            // && !s.isInWrappedToRadiants
          ) {
            DeBug.log(`inWrappers fix`)
            DeBug.log(`innerMostRadiantWrapper`, s.innerMostRadiantWrapper)
            if (s.isInWrapped && s.isInWrappedToRadiants) {
              DeBug.log(`s.isInWrappedToRadiants`)
              s.inWrapper.adjWrap()
            }
            else if (s.canCurveTo(s.innerMostRadiantWrapper.currentMaxArcOrigin), true) {
              DeBug.log(`case1 viables`, s.currentViableArcOrigins)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.innerMostRadiantWrapper.currentMaxArcOrigin)
            }
            else if (s.innerMostRadiantWrapper.canCurveTo(s.currentMaxArcOrigin), true) {
              DeBug.log(`case2 viables`, s.innerMostRadiantWrapper.currentViableArcOrigins)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
            }
          } else if (s.isAdjOutWrapper) {                    // case: NO radiantInWrappers
            DeBug.log(`s.isAdjOutWrapper`)
            s.inWrapper.adjWrap()
          }
        }

        testPool = testPool
          .union(s.neighborsArray, `id`)
          .exclude(processed, `id`)
        // DeBug.log(`add neighbors testPool`, testPool)
        testPool = filterPool(testPool)
        // DeBug.log(`filtered testPool`, testPool)
        processed.push(s)
      }
      // safeArrayWhile(conditionFunc, action)
      // fixBadAdjWraps()
      fixBadFlushWraps()
    }

    //MARK: QUAD SHAPES
    //FIXME: incomplete and unused!
    //ARROW: createQuadShapes(mode) : process 4-sided (square/rect) shapes first with multiple modes
    //TODO: need to add an ABFeature to select these!!!
    const createQuadShapes = (mode, onlySingles = true) => {
      const sumSides = (sides) => sides.reduce((a, b) => a + b)

      // DeBug.log(`allSimpleSubShapes`, this.allSimpleSubShapes)
      //FIXME: need to filter out outer subShapes that wrap/outline an inner subShape
      let quads = onlySingles ? this.allSingleSimpleSubShapes : this.allSimpleSubShapes
        .filter(sub => sub.length === 4)// filter for 4-sided shapes
        .filter(sub => sub.some(seg => seg.isUTurnOut)) // filter for Outside shapes only (UTurnOut)
        .sort((a, b) => sumSides(b) - sumSides(a)) // sort smallest to largest
      // .copy
      // DeBug.log(`this.allSimpleSubShapes`, this.allSimpleSubShapes)
      // DeBug.log('quads', quads)
      // DeBug.log(`quad parts`, quads.map(quad => quad.map(seg => seg.part.value)))

      let processor
      switch (mode) {
        case 0: // Max curvature, equal radii
          processor = (quad) => {
            const radius = min(quad.map(seg => seg.length)) / 2
            return Array(4).fill(radius)
          }
          break
        case 1: // Min curvature, equal radii
          processor = (quad) => Array(4).fill(this.cellRadius)
          // processor = (quad) => [cellRadius, cellRadius, cellRadius, cellRadius]
          break

        case 2: // Horizontal Symmetry
        // quads must be horizontal rectangles! utilize Easter Egg logic but add maxLength?
        // might be worth combining symmtry into single mode, 
        case 3: // Vertical Symmetry
        // quads must be vertical rectangles! utilize Easter Egg logic but add maxLength?
        // might be worth combining symmtry into single mode, 

        case 4: // Easter Eggs / Eyeballs : max curvature with diagonal symmetry
          processor = (quad) => {
            // DeBug.error(`hi`)
            let cornerMap
            const minLength = min(quad.map(seg => seg.length)) // min side length
            if (equalsRoundedDec(minLength, this.minCellWidth, 2)) { // quad is single cell width or height
              cornerMap = Array(4).fill(this.cellRadius)
            } else {
              const maxRadius = minLength - this.cellRadius // maxRadius given cellRadius is minRadius
              // build options from cellRadius steps from 0->minLength, removing 3 steps (0, minLength/2, and minLength)
              const steps = (round(maxRadius / this.cellRadius) - 1) / 2 // totalSteps = 2 * steps + 1
              let options = range(-steps, steps)
                .array() // totalSteps array minus 1st and last (0 and minLength)
                // .filter(s => !(s === 0)) // remove middle (minLength/2) step
                .map(s => s + steps + 1) // add back steps like converting -0.5 to 0.5 range to 0-1 range
              const radius1 = minLength - (R.random_choice(options) * this.cellRadius)
              const radius2 = minLength - radius1
              cornerMap = [radius1, radius2, radius1, radius2,]
              DeBug.log(`minLength`, minLength)
              DeBug.log(`cellRadius`, this.cellRadius)
              DeBug.log(`maxRadius`, maxRadius)
              DeBug.log(`steps`, steps)
              DeBug.log(`options`, options)
            }
            return cornerMap
          }
          break

        case 5: // Single Big Radius Corner
        // use Easter Egg processor but add another mode and Random call that selects a single corner for largest radius
        // a [max, min, middle, min] radius scenario would match OG prototype shape used for 3D water renders
        case 6: // Random radii per corner
        // low priority for implementation: this might be too janky!
        case 7: // Mix : change mode for each subShape
        // this option should probably be outside of the switch?
        default:
      }

      //ARROW: assignQuad() : null : assign cubic verts using radii from cornerMap
      const assignQuad = (quad, cornerMap) => cornerMap.forEach((cMap, i) => quad[i].addDistancedStartCornerVerts(cMap))

      quads.forEach((quad, i) => {
        const cornerMap = processor(quad)
        // DeBug.log(`cornerMap`, cornerMap)
        assignQuad(quad, cornerMap)

        if (quad.every(seg =>
          roundToDec(seg.availableStartLength) <= roundToDec(this.cellRadius)
          && roundToDec(seg.availableEndLength) <= roundToDec(this.cellRadius)
        )) {
          // quad.forEach(s => s.flushWrap())
          DeBug.log(`NOT using radiant outWrap`)
          // this.outWrapOutsideCorners(quad)
          // this.recursiveOutWrapOutsideCorners(quad)
        } else {
          DeBug.log(`using radiant outWrap!!`)
          // this.outWrapOutsideCorners(quad)
          // this.recursiveOutWrapOutsideCorners(quad, true)
        }
        DeBug.log(``)
        DeBug.log(`    QUAD`, i, quad[0].parentID)
      })
      // this.recursiveOutWrapOutsideCorners(quads.flat(), true)
    }

    //MARK: roundQuads()
    //ARROW: roundQuads()
    const roundQuads = (mode = 0, preserveQuads = true, wrap = true) => {

      let testPool = this.allSingleSimpleSubShapes
        .map(p => new SegPath(p))
        .filter(p => p.isOutsideQuad                        // filter for outside Quad shapes
          && !p.hasMinRadii                          // filter out minRadius shapes
        )
        // .sort((a, b) => a.perimeter - b.perimeter)        // sort largest to smallest
        .sort((a, b) => b.perimeter - a.perimeter)        // sort smallest to largest

      DeBug.log(`quads`, testPool.map(p => p.shape.id))
      // return

      testPool.forEach(segPath => {
        DeBug.error(`current segPath start`, segPath.path[0].id)
        DeBug.log(`current segPath`, segPath.shape.id)
        // const segPath = new SegPath(p)
        // DeBug.log(`isComplete`, segPath.isComplete)
        // DeBug.log(`isQuad`, segPath.isQuad)
        // DeBug.log(`isOutsideShape`, segPath.isOutsideShape)
        // DeBug.log(`hasLoosies`, segPath.hasLoosies)
        // DeBug.log(`perimeter`, segPath.perimeter)
        if (preserveQuads && !segPath.hasAllMiddleArcs) { segPath.makeCurves() }
        else { DeBug.log(`segPath.hasAllMiddleArcs`) }

      })

      const changed = testPool.flat()
        .map(s => s.outWrappers).flat().compacted
      DeBug.warn(`changed`, changed)

      //NOTE: using only these two fixes: #431
      DeBug.warn(`roundQuads fixIssues()`)
      fixBadFlushWraps()
      fixLoosies()
    }

    //MARK: maximizeOuterCorners()
    //FIXME: incomplete and unused!
    //ARROW: maximizeOuterCorners() : null : maximize curve on outer corners that border on the frame
    const maximizeOuterCorners = (mode = 0, preserveQuads = true, wrap = true) => {
      let testPool = Object.values(this.gridCornerSegs)
      DeBug.log(`testPool`, testPool)
      testPool.forEach(corner => {

        if (corner.couldCurveMoreMoreAtEnd) {
          if (corner.radiantInWrappers) {
            DeBug.warn(`curving radiant:`, corner)
            const innerMost = corner.innerMostRadiantWrapper
            DeBug.log(`innerMost`, innerMost)
            DeBug.log(`innerMost viableRadOutWrappersOriginBounds`, innerMost.viableRadOutWrappersOriginBounds)
            DeBug.log(`innerMost viableRadiantOrigins`, innerMost.viableRadiantOrigins)
            const maxViable = innerMost.viableRadiantOrigins.last

            innerMost.startNeighbor.cubicVerts.end = undefined
            innerMost.endNeighbor.cubicVerts.start = undefined
            innerMost.replaceEndRadiantOutWrapsOrigin(maxViable)
          } else {
            DeBug.log(`curving:`, corner)
            const maxViable = corner.maxArcOrigin
            corner.startNeighbor.cubicVerts.end = undefined
            corner.endNeighbor.cubicVerts.start = undefined
            corner.replaceEndCurveOrigin(maxViable)
          }
        }
      })
      this.completeEnds(defaultPool)
    }

    //TODO: DELETE WHEN DONE: only kept as ref to safeArrayWhile() and 'changed' implementations
    //ARROW: fixLooseCorners()                                                                          //UNUSED:
    // const fixLooseCorners = (testPool = this.allLooseCorners()) => {
    //   DeBug.warn(`allLooseCorners`, testPool.map(s => s.id))

    //   const conditionFunc = () => { return testPool }
    //   const action = () => {
    //     DeBug.log(``)
    //     DeBug.log(`loosie count`, testPool.length)
    //     let loosie = testPool.pop()
    //     DeBug.log(`loosie in loop`, loosie)

    //     let changed
    //     let flat = roundToDec(loosie.flatAmount, 1)
    //     const localWrap = () => {
    //       loosie.removeEndCornerVerts()
    //       changed = this.createCubicCorners({ subShapes: [loosie], outWrap: true, radiant: true, replace: true })
    //     }
    //     if (loosie.inWrappers) {
    //       const innerMost = loosie.innerMostWrapper
    //       DeBug.log(`attempting outWrap on ${innerMost.id}`)
    //       DeBug.log(`innerMost`, innerMost)
    //       innerMost.removeEndCornerVerts()
    //       changed =
    //         this.createCubicCorners({ subShapes: [innerMost], outWrap: true, radiant: true, replace: true })
    //     } else {
    //       localWrap()
    //     }
    //     loosie.matchEndCorner()
    //     // DeBug.log(`loosie`, loosie)
    //     // DeBug.log(`flat: ${flat}, new flatAmount: ${loosie.flatAmount}`)
    //     // if (loosie.hasLooseCorner) {
    //     //   DeBug.log(`attempting localWrap()`)
    //     //   localWrap()
    //     // }

    //     DeBug.log(`changed loosies`, changed)
    //     this.completeEnds(defaultPool)

    //     testPool = testPool
    //       .union(changed.outside, [`id`])
    //       .union(changed.inside, [`id`])
    //       .unique([`id`])
    //     testPool = this.allLooseCorners(testPool)
    //   }
    //   safeArrayWhile(conditionFunc, action)
    // }

    //MARK: fixIssues()
    //ARROW: fixIssuess() : null : performs all wrapping of corners and fixes issues
    const fixIssues = (mode = nestleMode) => {
      if (mode === 0) {
        DeBug.warn(`wrapInterferenceCorners`)                                                   //LOGGING:
        wrapInterferenceCorners()
        DeBug.warn(`wrapInnerMost`)                                                             //LOGGING:
        wrapInnerMost()
      }

      DeBug.warn(`curveMinRadiusCorners`)                                                       //LOGGING:
      this.curveMinRadiusCorners()
      DeBug.warn(`completeEnds`)                                                                //LOGGING:
      this.completeEnds(defaultPool)

      DeBug.warn(`fixBadAdjWraps`)                                                              //LOGGING:
      fixBadAdjWraps()
      DeBug.warn(`fixBadFlushWraps`)                                                            //LOGGING:
      fixBadFlushWraps()
      DeBug.warn(`fixLoosies`)                                                                  //LOGGING:
      // fixLoosies()

      DeBug.warn(`roundQuads`)                                                                  //LOGGING:
      // roundQuads()
    }

    DeBug.error(`FIX Issues`)                                                                   //LOGGING:
    fixIssues()
    DeBug.error(``)                                                                             //LOGGING:
  }


  //MARK: NESTLE SHAPES
  //METH: nestleShapes() : null : nestle shapes into the grid
  nestleShapes(quadMode = 0, diagonals = false) {
    DeBug.groupCollapsed(`createSimpleSubShapes`)
    this.createSimpleSubShapes()                                        // createSimpleSubShapes 
    DeBug.groupEnd()

    // DeBug.groupCollapsed(`createQuadShapes`)
    // // createQuadShapes(quadMode)                                                 // createQuadShapes
    // DeBug.groupEnd()

    DeBug.group(`maximizeCuddles`)
    // DeBug.groupCollapsed(`maximizeCuddles`)
    this.maximizeCuddles()
    DeBug.groupEnd()
    // DeBug.groupEnd()

    DeBug.log(`  %%%% end nestleShapes %%%%`)
    DeBug.log(``)
  }
  // #endregion
  // MARK: Grid Creation Methods
  // #region Setup Methods
  //METH: cellRowsRotated() : [ [Cell] ] : rotate the cell rows by a given degree (0, 90, 180, 270)
  cellRowsRotated(degree = 90, selection = this.cellRows) { return selection.rotated2D(normalizeDegree(degree)) }
  //METH: cellRowsFlipped() : [ [Cell] ] : flip the cell rows by a given direction (posOrdinal, negOrdinal)
  cellRowsFlipped(direction = "negOrdinal", selection = this.cellRows) { return selection.flipped2D(direction) }
  //METH: createRowsArray() : [ [Cell] ] : create the rows of cells in the grid
  #createRowsArray() {
    const size = this.gridSize
    let rows = new OpArray(size.y)
    for (let j = this.startCoord.y; j < size.y; j++) {
      let row = new OpArray(size.x)
      for (let i = this.startCoord.x; i < size.x; i++) {
        let index = this.index(i, j)
        row[i] = new Cell({
          protoParent: this,
          svgParent: this.svgElt,
          grid: this,
          index: index + this.offset,
          coords: Vertex.add(vert(i, j), vert(this.offset)),
          isAvailable: true,
        })
      }
      rows[j] = row
    }
    return OpArray.from(rows)
  }
  //METH: setFrameRadii() : null : set the frame radii for the grid                                   //UNUSED:
  // setFrameRadii() { FRAME.setCornerRadii(this.gridCellBounds.cornerCellCenters, this.padSize) }
  //METH: setInsetScale() : null : set the inset scale for the grid
  // setInsetScale(scale) {
  //   // DeBug.log('Grid setInsetScale', scale)
  //   super.setInsetScale(scale)
  //   // DeBug.log('Grid insetScale', this.insetScale)
  //   // this.setFrameRadii()
  //   this.updateCells()
  // }
  //METH: insetCells() : null : set the inset scale for the cells in the grid                         //UNUSED:
  // insetCells(scale, groupID) {
  //   let cells
  //   if (groupID) {
  //     const group = this.groupNamed(groupID)
  //     if (group) {
  //       cells = group.cells
  //     } else {
  //       // DeBug.error(`no group named ${groupID}`)
  //       // DeBug.log(`current groups:`, this.groups)
  //     }
  //   } else { cells = this.cells }
  //   cells.forEach(e => e.setInsetScale(scale))
  // }
  // #endregion
  // MARK: Grid Grammar Generators
  // #region Grammar Generators
  //METH: randGroup() : Group : generate a random group of cells from the available cells
  randGroup({ selection = this.availableCells, amount } = {}) { return this.assignCells(selection.randReduce(amount)) }
  //METH: randomSelection() : [Cell] : generate a random selection of cells from the available cells
  randomSelection(amount, selection = this.availableCells) { return selection.copy.randReduce(amount) }
  //METH: groupAvail() : Group : generate a group of cells from the available cells
  groupAvail(markTaken = true) {
    const group = this.assignCells(this.availableCells)
    if (!markTaken) this.setAvailability(group.cells, true)
    return group
  }
  //METH: groupFromIndices() : Group : generate a group of cells from the given indices
  groupFromIndices(indices) {
    indices = OpArray.format(indices)
    const cells = indices.map(i => this.cellAt(i))
    return this.assignCells(cells)
  }
  //METH: randomComb() : Group : generate a CellGroup using a random comb filtering method
  randomComb({
    selection = this.availableCells,
    keepRange = range(2, 7),
    dropRange = range(2, 7),
    start = 0
  } = {}) {
    const reduced = selection.randCombReduce({ keepRange: keepRange, dropRange: dropRange, start: start, })
    // DeBug.log(`randomComb reduced`, reduced)
    return this.assignCells(reduced)
  }
  //METH: comb() : Group : generate a CellGroup using a simple comb filtering method
  comb({ selection = this.availableCells, keep = 2, drop = 1, start = 0 } = {}) {
    const reduced = this.randomComb({
      selection: selection,
      keepRange: range(keep, keep),
      dropRange: range(drop, drop),
      start: start
    })
    // DeBug.log(`comb reduced`, reduced)
    return reduced
  }
  //METH: comb2() : Group : generate a CellGroup using a complex comb filtering method
  comb2({ selection = this.availableCells, dashArray, start = 0 } = {}) {
    const reduced = selection.combReduce(dashArray)
    // DeBug.log(`comb2 reduced`, reduced)
    return this.assignCells(reduced)
  }

  //METH: squares() : Group : generate a random selection of squares from the available cells
  squares({
    coverage,
    direction = Direction.DownRight,
    minSize = 1,
    uniform = false,
    overlapping = 0,        // 0: never, 1: always, 2: sometimes     
    rectMode = 0            // 0: none, 1: someVert, 2: allVert, 3: someHor, 4: allHor, 5: someMixed, 6: allMixed
  } = {}) {
    // DeBug.groupCollapsed(`Squares`)
    if (rectMode > 0) {
      coverage *= 1.5
      minSize = minSize + 1
    }

    let
      maxSize, // allowable max square based on 'Square and Rect Generation' study
      reducer = 0
    const cols = this.columnCount

    if (cols > 3 && cols < 6) reducer = R.random_choice([0, 1, 1, 2, 2, 2])
    if (cols > 5) reducer = R.random_choice([0, 1, 1, 2, 2, 2, 3, 3, 3])
    // DeBug.log(`reducer`, reducer)
    maxSize = cols - reducer

    // randomly generate squares within size range that add up to coverage
    const maxCells = round(coverage * this.cellCount)
    maxSize = min(maxSize, floor(sqrt(maxCells))) // maxSize by gridSize or coverage amount
    // DeBug.log('maxSize', maxSize)
    let
      usedCells = 0,
      squares = new OpArray,
      uniformSquare = uniform ? R.random_int(minSize, maxSize) : undefined // single size if uniform
    while (usedCells < maxCells) {
      const square = uniform ? uniformSquare : R.random_int(minSize, maxSize)
      squares.push(square)
      usedCells += (square * square)
      maxSize = min(maxSize, floor(sqrt(maxCells - usedCells))) //recalc maxSize each loop to keep close to coverage
    }
    // DeBug.log('squares', squares)

    const original = this.availableCells.copy
    let
      selection = new OpArray,
      availables = this.availableCells
    // DeBug.log('original', original)
    // DeBug.log('selection', selection)
    // DeBug.log('availables', availables)

    squares.forEach((size, i) => {
      let inlineSelection = this.inline(original, size - 1, direction.andAdjacents)
      // DeBug.log('')
      // DeBug.log('inlineSelection', inlineSelection.map(e => e.id))
      const padding = this.tempOutlineSelection(selection)
      inlineSelection = inlineSelection.union(selection, 'id')
      if (overlapping !== 1) inlineSelection = inlineSelection.union(padding, 'id')

      // DeBug.log('inlineSelection', inlineSelection.map(e => e.id))
      let shrunkSelection = availables.exclude(inlineSelection, 'id') //shrunk selection by excluding inline
      // DeBug.log('shrunkSelection', shrunkSelection.map(e => e.id))

      //ARROW: newSquare() :  [Cell] : create a new square from the shrunk selection
      const newSquare = () => {
        // DeBug.warn(`newSquare`)
        let
          isValid = false,
          cell, square
        while (isValid === false && shrunkSelection.length > 1) {
          // DeBug.log('')
          // DeBug.log(`size`, size)
          cell = this.randomSelection(1 / shrunkSelection.length, shrunkSelection) //random cell within shrunk
          // DeBug.log('newSquare cell', cell.map(e => e.id))
          const outline = this.tempOutlineSelection(cell, size - 1, direction.andAdjacents) //create square outline
          square = cell.copy.union(outline, 'id') //union cell with outline to create square
          // DeBug.log(`square`, square)
          if (rectMode > 0) {
            // 0. none, 1. someVert, 2. allVert, 3. someHor, 4. allHor, 
            // 5. someMixed, 6. allMixed, 
            // TODO: 7.someTriangle, 8. allTriangle
            const useRect = rectMode % 2 === 0 ? true : R.random_bool(0.5)            // all=>true, some =>random
            if (useRect) {
              let dir                                                             // choose inline direction
              if (rectMode < 3) dir = Direction.Horizontal.random()                // vert uses hor
              if (rectMode > 2 && rectMode < 5) dir = Direction.Vertical.random()     // hor uses vert
              if (rectMode > 4 && rectMode < 7) dir = Direction.Cardinal.random()      // rand cardinal
              // if (rectMode > 6) { dir = Direction.Ordinal.random() }                  // triangle
              const
                inlineAmount = min(R.random_int(1, ceil(size - 1)), size - minSize + 1),
                inlined = this.inline(square, inlineAmount, dir)
              // DeBug.log(`inlined`, inlined)
              square = square.exclude(inlined, `id`)
              // DeBug.log(`rect`, square)
            }

          }
          // DeBug.log('shrunk start', shrunkSelection.map(e => e.id))
          const overlaps = square.includesAny(padding, 'id')// check if square overlaps padding
          // DeBug.log('padding length', padding.length)
          // DeBug.log('square overlaps', overlaps)
          switch (overlapping) {
            case 0:                                             // 0: never    
              isValid = !overlaps
              break
            case 1:                                             // 1: always  
              isValid = padding.length > 0 ? overlaps : true
              break
            default:                                            // 2: sometimes
              isValid = true
          }
          // DeBug.log('square is valid', isValid)
          if (!isValid) {
            square = new OpArray //make square empty
            shrunkSelection = shrunkSelection.filter(e => e.id !== cell[0].id) // remove failed cell 
          }
          // DeBug.log('shrunk end', shrunkSelection.map(e => e.id))
        }
        return square
      }

      let square = newSquare()

      selection = selection.union(square, 'index') //union squares with selection for new selection
      availables = original.exclude(selection, 'index') //remove selection from availables for new availables
      // DeBug.log('availables', availables.map(e => e.id))
    })
    // DeBug.log(`squares output cells`, selection)
    // DeBug.groupEnd()
    return this.assignCells(selection)
  }
  //METH:
  snake({
    selection = this.availableCells,
    direction = Direction.Cardinal,
    cornerStart = false,
    turns = 12,
    size = 1,
    coverage = 0.3,
    // groupID,
    // islandID,
    // newGroup = true,
  } = {}) {
    // DeBug.groupCollapsed(`new snake`)
    if (selection.isEmpty) return

    const cellBounds = this.cellBounds({ selection: selection })
    // DeBug.log(`selection`, selection)
    // DeBug.log(`cellBounds`, cellBounds)
    let outer = cornerStart ? cellBounds.cornerCells.compacted : cellBounds.outerCells.all.flat().compacted
      .filter(c => c.isAvailable)
      .unique()
      .gridVertSorted
    // DeBug.log(`outer availables:`, outer)

    let start, snake
    //ARROW: chooseStart()
    const chooseStart = () => {
      start = R.random_choice(outer)
      // DeBug.log(`start`, start)
      outer = outer.exclude([start], `id`)
      snake = OpArray.format([start])
    }

    let dirChoice, dist
    //ARROW: dirChoices()
    const dirChoices = () => {
      const valids = start?.availableMoveDirections(direction, selection)
      return valids?.exclude([dirChoice], `name`)
    }

    //ARROW: createSnake()
    const createSnake = () => {
      chooseStart()
      const moves = range(1, turns + 1).array()
      // DeBug.log(`moves`, moves)
      let withinCoverage = true
      //FIXME: convert to for loop so that I can use 'break'
      // moves.forEach((m, i) => {
      for (let i = 0; i < moves.length; i++) {
        if (withinCoverage) {
          // DeBug.warn(`snaking!`)
          let choices = dirChoices()
          // DeBug.log(`choices`, choices?.map(v => v.name))
          if (!choices || choices.isEmpty) {
            restartSnake()
            break
          }
          let choiceCellsToEdge = choices
            .map(ch => [ch, cellBounds.cellsToEdge({ fromCell: start, direction: ch, selection })])
            .sort((a, b) => b[1][0] - a[1][0])
          if (R.random_bool(.5)) choiceCellsToEdge = choiceCellsToEdge.first
          else choiceCellsToEdge = choiceCellsToEdge.randomElement

          // DeBug.log(`choiceCellsToEdge`, choiceCellsToEdge)
          dirChoice = choiceCellsToEdge[0]
          // DeBug.log(`dirChoice`, dirChoice.name)
          let [availDist, travCells] = choiceCellsToEdge[1]
          const
            lastCell = travCells.last,
            lineNeighbors = this.tempOutlineSelection(travCells, 1, Direction.Cardinal)
          // DeBug.log(`lastCell`, lastCell)
          // DeBug.log(`availDist`, availDist)
          if (lineNeighbors.some(n => snake.exclude(start).some(s => s.equals(n)))) {
            withinCoverage = false
            break
          }
          let invalidDists = this.tempOutlineSelection(travCells, 2, dirChoice.perpindiculars)
            .exclude(travCells, `id`)
            .exclude(lineNeighbors, `id`)
            .filter(c => c.isTaken)
            .map(c => dirChoice.allAreVertical ? abs(c.coords.y - start.coords.y) : abs(c.coords.x - start.coords.x))
          if (!invalidDists.duplicates().isEmpty) invalidDists = invalidDists.duplicates()
          // DeBug.log(`invalidDists`, invalidDists)
          const rangeArray = range(min(availDist, max(size + 1, floor(availDist / 3))), availDist)
            .array()
            .exclude(invalidDists)

          // DeBug.log(`rangeArray`, rangeArray)
          if (rangeArray.isEmpty) withinCoverage = false

          const viableDists = R.random_choice(rangeArray)
          // DeBug.log(`rangeArray`, rangeArray)
          dist = i === moves.lastIndex ? availDist : viableDists
          if (dirChoice) {
            const line = this.tempOutlineSelection([start], dist, dirChoice, false)
            // DeBug.log(`dirChoice`, dirChoice.name)
            // DeBug.log(`start`, start)
            // DeBug.log(`line`, line)
            snake = snake.union(line, `id`)
            if (i > 0 && snake.length / this.cells.length > coverage) {
              snake = snake.exclude(line, `id`)
              withinCoverage = false
              break
            }
          } else {
            withinCoverage = false
            break
          }

          selection = selection.exclude(snake, `id`)
          start = snake.last
          // DeBug.log(`snake`, snake)
          // DeBug.log(`start`, start)
        }
      }
    }

    //ARROW: restartSnake() : null : restart the snake if it is empty
    const restartSnake = () => { if (!outer.isEmpty) createSnake() }

    createSnake()

    if (size > 1) {                               // inflate to size
      const outline = Corners.Directions.values
        .map(dir => this.tempOutlineSelection(snake, size - 1, dir.andAdjacents, true))
        .sort((a, b) => b.length - a.length)[0]
        .exclude(this.takenCells, `id`)
      snake = snake.union(outline, `id`)
      // DeBug.log(`outline`, outline)
    }
    // DeBug.groupEnd()
    const output = OpArray.format(snake)
    return this.assignCells(output)
  }
  // #endregion
  // MARK: Grid Grammar Modifiers
  // #region Grammar Modifiers
  //METH: outline() : Group : iterative outliner driven by directions
  outline({
    selection = this.lastGroup?.cells || this.takenCells,
    groupID,
    islandID,
    direction = Direction.All,
    amount = 1,
    newGroup = true
  } = {}) {
    if (amount < 1 || this.isFull) return
    if ((selection && groupID) || (selection && islandID) || (groupID && islandID)) {
      DeBug.error('Grid.outline can only use one selection method')
      return
    }
    let group
    if (selection && newGroup === false) group = this.lastGroup
    if (groupID) {
      group = this.groupNamed(groupID)
      selection = group.cells
    }
    if (islandID) {
      const island = this.islandNamed(islandID)
      if (island) {
        group = this.groupNamed(island.groupID)
        selection = island.cells
      }
    }

    while (amount > 0 && !this.isFull) {
      if (selection?.length > 0) {
        // console.log(`outline direction`, direction)
        const outline = this.validNeighbors({ selection: selection, direction: direction })
          .filter(cell => cell.isAvailable)

        //FIXME: this solution is not quite there: it allows outline to absorb prev group or overlap?
        if (!outline.isEmpty) {
          if (newGroup === true) group = undefined                                      //allow assign to create new group
          if (typeof newGroup === 'string' && !temp) group = this.groupNamed(newGroup)  //use existing group
          else this.assignCells(outline, group?.id)                                     //assign to group
          if (newGroup === true && !group) {                                            //continue adding to the new group
            group = this.lastGroup
            newGroup = false
          }
          selection = group.cells
        } else if (amount === 1) return
      }
      amount -= 1
    }
    return group
  }
  //METH: outlineGroup() : Group : outline a group and assign
  outlineGroup({ groupID, direction = Direction.All, amount = 1, newGroup = true } = {}) {
    return this.outline({ groupID, direction, amount, newGroup })
  }
  //METH: outlineTaken() : Group : outline all taken cells and assign
  outlineTaken({ direction = Direction.All, amount = 1, newGroup = true } = {}) {
    return this.outline({ selection: this.takenCells, direction: direction, amount: amount, newGroup: newGroup })
  }
  //METH: tempOutlineSelection() : [Cell] : grab an outline of a selection without assignment
  tempOutlineSelection(selection, amount = 1, direction = Direction.All, sort = true) {
    // DeBug.log(`tempOutlineSelection selection`, selection)
    // DeBug.log(`tempOutlineSelection direction`, direction)
    // DeBug.log(`tempOutlineSelection selection`, selection.map(c => c.id))
    let newSelection = new OpArray
    while (amount > 0) {
      if (selection.length > 0) {
        // DeBug.log(`tempOutlineSelection selection`, selection)
        const outline = this.validNeighbors({ selection: selection, direction: direction })
        // DeBug.log('temp outline', outline)
        newSelection.push(...outline)
        selection = newSelection
        if (sort) selection = selection.sort((a, b) => a.index - b.index)
        // DeBug.log('temp selection', selection.map(e => e.id))
      }
      amount -= 1
      // DeBug.log('temp newSelection', newSelection.map(e => e.id))
      // DeBug.log('temp selection', selection.map(e => e.id))
    }
    // DeBug.log('tempOutline', amount, direction)
    return selection
  }
  //METH: inline() : [Cell] : grab an inline of a selection without assignment
  inline(selection, amount = 1, direction = Direction.All) {
    if (amount < 1) { return new OpArray }
    // DeBug.log('inline amount', amount)
    const bounds = this.gridCellBounds
    let inlineEdges = new OpArray                           //store edge rows/columns/corners that can't be outlined, to be inlined
    direction.directions.forEach(dir => {
      const name = dir.names[0]
      // DeBug.log('direction name', name)
      if (dir.isOrdinal) {
        inlineEdges.push(bounds.cornerCells[name])
        // DeBug.log('addedCells', bounds.cornerCells[name])
      } else {
        inlineEdges.push(bounds.outerCells[name])
        // DeBug.log('addedCells', bounds.outerCells[name])
      }
    })
    inlineEdges = inlineEdges
      .flat()
      .intersect(selection, 'id')
    // DeBug.log('inlineEdges', inlineEdges.map(e => e.id))
    let inlinedEdges = this.tempOutlineSelection(inlineEdges, amount - 1, direction.opposites)
    // DeBug.log('inlinedEdges', inlinedEdges.map(e => e.id))
    inlinedEdges = inlinedEdges.union(inlineEdges, 'id')
    // DeBug.log('inlinedEdges', inlinedEdges.map(e => e.id))

    const
      outline = this.tempOutlineSelection(selection, 1, direction),
      inline = this.tempOutlineSelection(outline, amount, direction.opposites)
        .union(inlinedEdges, 'id')
    // DeBug.log('outline', outline.map(e => e.id))
    // DeBug.log('inline', inline.map(e => e.id))
    // DeBug.log('inline method return')
    // DeBug.log('')
    return selection.intersect(inline, 'index')
  }

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
  // #endregion
  // MARK: Grid Grammar Enum Methods
  // #region Grammar Enum Methods
  //METH: randTransformedCells() : [Cell] : generate a random selection of cells from the available cells 
  randTransformedCells({ selection = this.cellRows, rotate = true, flip = true } = {}) {
    if (rotate) selection = selection.rotated2D(R.random_int(0, 3) * 90)
    if (flip) selection = selection.flipped2D(Direction.Cardinal.random(1).andOpposites)
    return selection.flat()
  }

  //METH: seed() : null : call the appropriate seed method based on the name with the given options
  seed(name, options) {
    const coverage = options?.coverage || 0.3,
      selection = options?.selection || this.availableCells

    const minSize = options?.minSize || 1,
      uniform = options?.uniform || false,
      overlapping = options?.overlapping || 0,
      taken = options?.useAllTaken ? this.takenCells : this.lastGroup?.cells

    switch (name) {
      case 'Noise':
        this.randGroup({ amount: coverage })
        break
      case 'Random Comb':
        this.randomComb({
          selection: this.randTransformedCells().intersect(selection, `id`),
          keepRange: range(2, ceil(this.rowCount * coverage)),
          dropRange: range(1, this.rowCount),
          start: R.random_int(0, this.cellCount - 1)
        })
        break
      case 'Squares':
        this.squares({
          coverage: coverage,
          minSize: minSize,
          uniform: uniform,
          overlapping: overlapping,
        })
        break
      case 'Rectangles':
        this.squares({
          coverage: coverage,
          rectMode: R.random_choice([2, 4, 6]),
          minSize: minSize,
          uniform: uniform,
          overlapping: overlapping,
        })
        break
      case 'Squares and Rectangles':
        this.squares({
          coverage: coverage,
          rectMode: R.random_choice([1, 3, 5]),
          minSize: minSize,
          uniform: uniform,
          overlapping: overlapping,
        })
        break
      case 'Simple Pattern':
        this.comb({
          selection: this.randTransformedCells().intersect(selection, `id`),
          keep: R.random_int(1, 3), drop: R.random_int(12, 16),
          start: R.random_int(0, this.cellCount - 1)
        })
        break
      case 'Complex Pattern':
        this.comb2({
          selection: this.randTransformedCells().intersect(selection, `id`),
          dashArray: OpArray.randomIntArray(R.random_int(3, 12), range(1, 9))
            .map((n, i) => i % 2 === 0 ? R.random_int(1, 3) : n)
        })
        break
      case 'Snake':
        this.snake({
          coverage: coverage,
          selection: selection,
          direction: options?.direction || Direction.Cardinal,
          cornerStart: options?.cornerStart || false,
          size: options?.size || 1,
          turns: options?.turns || this.columnCount,
        })
        break
      case 'Group Available':
        this.groupAvail()
        break
      case 'Outline':
        this.outline({ selection: taken })
        break
      case 'Outline Single Direction':
        this.outline({ selection: taken, direction: Direction.All.random(1) })
        break
      case 'Outline Some Directions':
        const count = R.random_int(2, 7)
        let dirs
        switch (count) {
          case 2:
            const dir = Direction.All.random(1)
            dirs = R.random_choice([dir.andAdjacents, dir.opposites])
            break
          case 3: dirs = Direction.All.random(1).andAdjacents
            break
          default: dirs = Direction.All.random(count)

        }
        // console.log('dirs', dirs)
        // console.log('dirs', dirs.vals)
        this.outline({ selection: taken, direction: dirs })
        break
      // case 'Outlines':

      //   break
      case 'Empty':
        break
      default: console.error(`Grid.seed: ${name} not found`)
    }
  }
  // #endregion
  // MARK: Grid Grammar Assignment Methods
  // #region Grammar Assignment Methods
  //METH: assignCells() : Group : assign a selection of cells to a group
  assignCells(selection, groupID) {
    if (selection.isEmpty) return
    let newGroup = false
    if (!groupID) newGroup = true
    let group
    if (newGroup) {
      group = new CellGroup(this, this.svgElt, this, selection)
      this.groups.push(group)
    } else {
      group = this.groupNamed(groupID)
      group.cells = group.cells.union(selection, ['id'])
    }
    this.updateCells({ groupID: group.id })
    return group
  }
  //METH: updateCells() : null : update the cells of a group or island
  updateCells({ groupID, island } = {}) {
    let groups, islands
    if (groupID) groups = [this.groupNamed(groupID)]
    else groups = this.groups
    groups.forEach(group => this.updateGroup(group))

    if (island) {
      islands = [island]
      // DeBug.log(`all islands: `, this.islands)
      DeBug.log(`updateCells: islands found: `, islands)
    }
    else islands = this.allIslands
    islands.forEach(island => this.updateIsland(island))
  }
  //METH: updateGroup() : null : update the cells of a group
  updateGroup(group) {
    group.cells.forEach(cell => {
      const thisCell = this.cells[cell.index]
      thisCell.groupID = group.id
      thisCell.isAvailable = false
    })
  }
  //METH: updateIsland() : null : update the cells of an island
  updateIsland(island) {
    island.cells.forEach(cell => {
      const thisCell = this.cells[cell.index]
      if (thisCell) thisCell.islandIDs.add(island.id)
    })
  }
  //METH: setAvailability() : null : set the availability of a selection of cells
  setAvailability(selection = this.cells, isAvailable = false) {
    selection.forEach(cell => cell.isAvailable = isAvailable)
  }
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
  // #endregion
  //MARK: Setup Overrides
  //METH: assignElement() : null : create and assign SVG elements to the grid
  assignElement() {
    super.assignElement()

    if (this.isFrontGrid) {
      this.backElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-backLayer`)
      this.comboElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-comboLayer`)
      this.highElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-highLayer`)
      this.shadElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-shadLayer`)

      this.shaderElts = OpArray.format([this.backElt, this.comboElt, this.highElt, this.shadElt])
      this.shaderElts.forEach(elt => {
        elt
          .parent(this.svgElt)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
      })
    }
  }
  //METH: drawElement() : null : draw the SVG elements of the grid
  drawElement() {
    super.drawElement()
    if (this.isFrontGrid) {
      this.shaderElts?.forEach(elt => {
        elt
        // .attribute(`fill`, frameColor)
        // .attribute('overflow', 'visible')
        // .attribute(`filterUnits`, `userSpaceOnUse`)
        // .attribute(`primitiveUnits`, `userSpaceOnUse`)
        // .attribute(`fill`, `red`)
      })
      this.backElt
      // .attribute(`display`, `none`)
      this.comboElt
        .attribute(`opacity`, 1)
      // .attribute(`display`, `none`)
      // .attribute(`fill`, `red`)
      this.highElt
        .attribute(`opacity`, 1)
      // .attribute(`display`, `none`)
      this.shadElt
        .attribute(`opacity`, .6)
      // .attribute(`display`, `none`)
      // .style(`mixBlendMode`, `luminosity`)
    }
  }

  //MARK: debug Methods
  showCellsDebug(label = true) {
    this.cells.forEach(c => {
      c.drawSVG = true
      c.drawLabel = label
      c.drawDeBugRect = true
      c.assignElement()
      c.showDeBug()
    })
  }
  showShapesDebug(label = true) {
    this.perimeterShapes.forEach(sh => {
      sh.drawSVG = true
      sh.drawLabel = label
      sh.drawDeBugRect = true
      sh.assignElement()
      sh.showDeBug()
    })
  }
  showShapeGroupsDebug(label = true) {
    DeBug.log(``)
    DeBug.groupCollapsed(`DEBUG: showShapeGroups`)
    this.shapeGroups.forEach(sh => {
      sh.drawSVG = true
      sh.drawLabel = label
      sh.drawLoft = true
      sh.assignElement()
      sh.showDeBug()
    })
    DeBug.groupEnd()
  }
}