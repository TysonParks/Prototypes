// MARK:
// MARK: INITIALIZATION
// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: ProtoLayer SuperClass

// CLASS: ProtoLayer
class ProtoLayer {
  svgElt
  rect // 'rect' p5.Element
  protoParent // ProtoLayer
  svgParent // 'SVG' p5.Element
  _insetScale
  _filter
  _filterLoft
  drawSVG
  drawRect

  constructor({ protoParent, svgParent, insetScale, filter, drawSVG = true, drawRect = true } = {}) {
    if (protoParent instanceof ProtoLayer) {
      this.protoParent = protoParent
      this.svgParent = protoParent.svgElt
    }
    else if (protoParent instanceof p5.Element) { this.svgParent = protoParent }
    else { console.error('protoParent is not valid') }
    if (svgParent) { this.svgParent = svgParent }
    this._insetScale = insetScale
    this._filter = filter
    this.drawSVG = drawSVG
    this.drawRect = drawRect
    this.assignUID()
  }

  // MARK: View Properties
  // #region View Properties
  get padding() { return 20 }

  get testLook() { return SVGLook.test() }
  get blackLook() { }
  get protoLook() { return SVGLook.clear }
  get testColor() { return protoColor(0, 230, 230, 1) }

  get color() { return protoColor(230) }

  get look() {
    const clear = SVGLook.clear
    const stroke = testingControls.borders ? SVGLook.testStroke() : []
    const fill = testingControls.testColors ? SVGLook.testFill() : []
    const black = testingControls.blackMode ? SVGLook.blackAndWhite : []
    return [clear, stroke, fill, black]
  }

  get cornerRadius() { return 1 }

  get insetScale() {
    if (this._insetScale) { return this._insetScale }
    else { return this.protoParent.insetScale }
  }
  get insetAmount() { return Vertex.sub(this.size, this.insetSize).div(2) }

  get filter() {
    if (this._filter) { return this._filter }
    if (this.protoParent?.filter) { return this.protoParent.filter }
  }

  get filterLoft() { return this._filterLoft ?? 0 }
  get loft() { return this.protoParent.loft + this.filterLoft }
  // #endregion
  // MARK: Computed Properties
  // #region Computed Properties
  get parentID() { return this.protoParent?.id ?? this.svgParent.id() }

  get boundsRect() { return this.protoParent?.insetBoundsRect }

  get anchor() { return vert(this.boundsRect.x, this.boundsRect.y) }
  get size() { return vert(this.boundsRect.width, this.boundsRect.height) }

  get insetAnchor() { return this.anchorFor(this.insetSize) }
  get insetSize() { return Vertex.mult(this.size, vert(this.insetScale)) }

  get insetBoundsRect() {
    return DOMRect.fromRect(
      {
        x: this.insetAnchor.x,
        y: this.insetAnchor.y,
        width: this.insetSize.x,
        height: this.insetSize.y,
      })
  }

  get padSize() { return Vertex.sub(this.size, this.insetSize).div(2) }
  get center() { return Vertex.div(this.size, 2).add(this.anchor) }
  get corners() {
    return {
      upLeft: this.anchor,
      upRight: Vertex.add(this.anchor, vert(this.size.x, 0)),
      downRight: Vertex.add(this.anchor, this.size),
      downLeft: Vertex.add(this.anchor, vert(0, this.size.y)),
    }
  }
  get sides() {
    return {
      up: new ProtoSegment(this.corners.upLeft, this.corners.upRight, this.id),
      right: new ProtoSegment(this.corners.upRight, this.corners.downRight, this.id),
      down: new ProtoSegment(this.corners.downRight, this.corners.downLeft, this.id),
      left: new ProtoSegment(this.corners.downLeft, this.corners.upLeft, this.id),
    }
  }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  //METH: 
  corner(direction) { return this.corners[direction.name] }
  //METH: 
  side(direction) { return this.sides[direction.name] || "invalid" }
  //METH: 
  anchorFor(size) {
    return Vertex.div(size, -2)
      .add(this.center)
    // .add(vert(this.padSize))  
  }
  // #endregion
  // MARK: Setup Methods
  // #region Setup Methods
  //METH: 
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    this.drawElement()
  }
  //METH: 
  assignElement() {
    if (this.drawSVG) {
      this.svgElt = createSVGElt().id(this.id)
        .parent(this.svgParent)
        .addToClassList(this.id)
        .addToClassList(this.svgParent.elt.classList.value)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y, this.padding)
        .viewBox(this.anchor.x, this.anchor.y, this.size.x, this.size.y, this.padding)
      // .label('test', 'red', Direction.Up)
    }

    if (this.drawRect) {
      this.rect = createSVGElt('rect').id(`${this.id}-frontRect`)
        .parent(this.svgElt)
        .addToClassList(this.id)
        .addToClassList(this.svgParent.elt.classList.value)
        .layout(this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
      // .label('test', 'red', Direction.None)
    }
  }
  //METH: 
  drawElement() {
    if (this.drawSVG) {
      this.svgElt
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y, this.padding)
        .viewBox(this.anchor.x, this.anchor.y, this.size.x, this.size.y, this.padding)
    }
    if (this.drawRect) {
      this.rect
        // .svgLook(this.look)
        .layout(this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
        .attribute('rx', `${this.cornerRadius}`)
        .attribute('ry', `${this.cornerRadius}`)

      if (this.filter) {
        this.rect.applyFilter(this.filter, 2)
      }
    }
  }
  //METH: 
  resize() { this.drawElement() }
  // #endregion
  // MARK: Layer Grammar Methods
  // #region LayerGrammar Methods
  //METH: 
  setInsetScale(scale) {
    this._insetScale = scale
    this.drawElement()
  }
  //METH: 
  setFilter(filter) {
    this._filter = filter
    this.drawElement()
  }
  //METH: 
  setFilterLoft(loft) {
    this._filterLoft = loft
  }

  //TODO: implement this!
  drawChildElements() {

  }
  // #endregion
  // MARK: Static Methods
  //METH: 
  static equal(a, b) { return a.uid === b.uid }
}
Object.assign(ProtoLayer.prototype, identifiableStored)

// CLASS: Frame
class Frame extends ProtoLayer {
  bleed
  bleedRect
  frameRect
  cornerRadius = 5

  constructor(svgParent) {
    super({ protoParent: svgParent, insetScale: 1, drawRect: true })
    this.finishSetup(S.Frame)
  }

  get look() { return SVGLook.clear }
  get testLook() { return Look.test(this.size, 'frame') }
  get testColor() { return protoColor(200, 200, 200) }

  get loft() { return 0 }

  get bleedLook() {
    return [
      [CS.border, testingControls.borders ? '1px dashed orange' : 'none'],
      [CS.borderRadius, testingControls.borders ? '50px' : '0px']
    ]
  }

  get anchor() { return vert(0, 0) }
  get size() { return vert(100, 200) }
  get boundsRect() {
    return DOMRect.fromRect(
      {
        x: this.anchor.x,
        y: this.anchor.y,
        width: this.size.x,
        height: this.size.y,
      })
  }
  get pixToUserUnits() {
    const ctm = this.svgElt.elt.getScreenCTM()
    return ctm.a
  }
  get svgMarkup() { return ProtoSVG.createSVGMarkup(this.bleed.elt) }

  // MARK: Frame modifiers
  //METH:
  setCornerRadii(corners, padding) {
    const radius = corners.topLeft.x + padding.x
    this.cornerRadius = min(radius, 50)
    // this.cornerRadius = 50
    this.drawElement()
  }

  // MARK: Setup Methods
  // #region Setup Methods
  //METH: 
  assignElement() {
    this.bleed = createSVGElt().id('bleed')
      .parent(this.svgParent)
      .viewBox(-5, -10, 110, 220)
      .attribute('preserveAspectRatio', 'xMidyMid')
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)
      .look([
        [CS.border, testingControls.borders ? '1px dashed orange' : 'none'],
        [CS.borderRadius, testingControls.borders ? '50px' : '0px']
      ])

    this.bleedRect = createSVGElt('rect').id(`${this.id}-bleedRect`)
      .parent(this.bleed)
      .layout(-15, -10, 130, 220)


    super.assignElement()

    this.svgElt
      .parent(this.bleed)

    this.frameRect = createSVGElt('rect').id(`${this.id}-backRect`)
      .parent(this.svgElt)
      .addToClassList(this.id)
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)

    // this.testElementsSetup()
  }
  //METH: 
  drawElement() {
    this.bleed
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)

    this.bleedRect
      // .layout(-10, -10, 120, 220)
      .attribute('fill', 'black')

    super.drawElement()

    this.frameRect
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)
      .attribute('rx', `${this.cornerRadius}`)
      .attribute('ry', `${this.cornerRadius}`)
      // .attribute('fill', ProtoColor.randomHighHue().setSaturation(10))
      .attribute(`fill`, frameColor)
      .attribute('fill-opacity', '1')
    // .applyFilter(this.filter, 2)

    // this.testElementsDraw()
  }
  // #endregion
}

// CLASS: SelectionBounds
class SelectionBounds {
  selection
  grid
  groupID
  islandID

  constructor({ selection, grid, groupID, islandID } = {}) {
    this.selection = selection
    this.grid = grid
    this.groupID = groupID
    this.islandID = islandID
  }

  // MARK: Properties
  // #region Properties
  get selectionCount() { return this.selection.length }
  get availableCount() { return this.availableCells.length }
  get cellBoundsCount() { return this.cellBoundsWidth * this.cellBoundsHeight }

  get cellSize() { return this.grid.cellSize }
  get boundCellRows() { return this.grid.cellSpanRowsBetween(...this.spanCellIndices) }
  get boundsCells() { return this.grid.cellSpanBetween(...this.spanCellIndices) }
  get availableCells() { return this.boundsCells.exclude(this.selection, ['index']) }

  get xCellValues() { return this.selection.map(e => e.x) }
  get yCellValues() { return this.selection.map(e => e.y) }

  get xCellMin() { return min(this.xCellValues) }
  get xCellMax() { return max(this.xCellValues) }
  get yCellMin() { return min(this.yCellValues) }
  get yCellMax() { return max(this.yCellValues) }

  get xMinMax() { return vert(this.xCellMin, this.xCellMax) }
  get yMinMax() { return vert(this.yCellMin, this.yCellMax) }

  get topRowCells() { return this.selection.filter(e => e.y === this.yCellMin).flat() }
  get rightColCells() { return this.selection.filter(e => e.x === this.xCellMax).flat() }
  get bottomRowCells() { return this.selection.filter(e => e.y === this.yCellMax).flat() }
  get leftColCells() { return this.selection.filter(e => e.x === this.xCellMin).flat() }
  get outerCells() {
    return {
      top: this.topRowCells,
      right: this.rightColCells,
      bottom: this.bottomRowCells,
      left: this.leftColCells,
    }
  }

  get cornerCellVerts() {
    return {
      topLeft: vert(this.xCellMin, this.yCellMin),
      topRight: vert(this.xCellMax, this.yCellMin),
      botRight: vert(this.xCellMax, this.yCellMax),
      botLeft: vert(this.xCellMin, this.yCellMax),
    }
  }
  get cornerCells() { return this.cornerCellVerts.map(v => this.grid.cellAtCoords(v.x, v.y)) }
  get cornerCellCenters() { return this.cornerCells.map(v => v.center) }

  get cellAnchor() { return this.cornerCellVerts.topLeft }
  get spanCellVerts() { return segment(this.cornerCellVerts.topLeft, this.cornerCellVerts.botRight) }
  get spanCellIndices() {
    const a = this.spanCellVerts.verts.start
    const b = this.spanCellVerts.verts.end
    const e = this.grid.index(a.x, a.y)
    const f = this.grid.index(b.x, b.y)
    return [e, f]
  }

  get cellBoundsWidth() { return this.xCellMax - this.xCellMin + 1 }
  get cellBoundsHeight() { return this.yCellMax - this.yCellMin + 1 }
  get cellBoundsSize() { return vert(this.cellBoundsWidth, this.cellBoundsHeight) }


  get takenWeight() { return this.selectionCount / this.cellBoundsCount }
  get isMostlyTaken() { return this.takenWeight >= 0.5 }
  get isMostlyAvailable() { return !this.isMostlyTaken }
  get isFull() { return this.takenWeight === 1 }

  get anchor() { return Vertex.mult(this.cornerCellVerts.topLeft, this.cellSize) }
  get size() { return Vertex.mult(this.cellBoundsSize, this.cellSize) }
  get aspect() { return this.cellBoundsSize.aspect }

  get boundsRect() {
    // if (arguments === 0) { return this.svgParent.elt.getBoundingClientRect() }
    // const size = this.size(selection)
    const offset = this.anchor
    return DOMRect.fromRect(
      {
        x: this.grid.insetBoundsRect.x + offset.x,
        y: this.grid.insetBoundsRect.y + offset.y,
        width: this.size.x,
        height: this.size.y,
      })
  }

  get cellsCentroid() { return Vertex.div(this.cellBoundsSize, 2) }
  get centroid() { return Vertex.mult(this.cellsCentroid, this.cellSize) }
  //#endregion
  // MARK: Methods
  // #region Methods
  transformedGrid(type) { }
  // #endregion
  // TODO: try adding selection and bounds parameters and then feeding them transformed matrices
  // MARK: Island Methods
  // #region Island Methods
  //METH: 
  innerCellIslands({ taken = true, stored = false, direction = Direction.Horizontal } = {}) {
    return this.grid.findIslands({
      selection: taken ? this.selection : this.availableCells,
      bounds: this,
      groupID: this.groupID,
      islandID: this.islandID,
      direction: direction,
      taken: taken,
      stored: stored,
    })
  }

  get horCellIslands() {
    return this.innerCellIslands({ taken: this.isMostlyAvailable, stored: false, direction: Direction.Horizontal })
  }
  get vertCellIslands() {
    return this.innerCellIslands({ taken: this.isMostlyAvailable, stored: false, direction: Direction.Vertical })
  }
  // #endregion
  // MARK: Encoder properties 
  // #region Encoder methods
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

// CLASS: Grid
class Grid extends ProtoLayer {
  gridSize
  cellRows
  cellRowsPref
  groups = new OpArray
  islands = new OpArray

  constructor(protoParent, gridSize, insetScale, transform) {
    super({ protoParent: protoParent, insetScale: insetScale, drawRect: false, drawSVG: true })
    if (!(gridSize instanceof Vertex)) { gridSize = vert(gridSize) }
    this.gridSize = gridSize
    this.finishSetup(S.Grids)
    this.cellRows = this.#createRowsArray()
    this.cellRowsPref = this.transformedCellRows(transform)
    this.setFrameRadii()
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'grid') }
  get testColor() { return protoColor(0, 230, 0, 90) }
  get cornerRadius() { return this.minCellWidth / 2 }

  get gridCellBounds() { return this.cellBounds() }
  get columnCount() { return this.gridCellBounds.cellBoundsWidth }
  get rowCount() { return this.gridCellBounds.cellBoundsHeight }
  get cellCount() { return this.gridCellBounds.cellBoundsCount }
  get cellSize() { return Vertex.div(this.insetSize, this.gridSize) }
  get minCellWidth() { return min(this.cellSize.x, this.cellSize.y) }
  get cells() { return this.cellRows.flat() }
  get cellColumns() { return this.cellRowsFlipped() }
  get availableCells() { return this.cells.filter(e => e.available) }
  get takenCells() { return this.cells.filter(e => e.taken) }
  get isFull() { return this.availableCells.length === 0 }
  get biggestGroup() {
    return this.groups.reduce((max, grp) => {
      if (grp.cells.length > max.cells.length) { return grp }
      else { return max }
    })
  }
  get lastGroup() { return this.groups.last() }
  // get islands() { return this.findIslands({ selection: this.cells }) }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  //METH: 
  cellAnchor(x, y) { return Vertex.mult(this.cellSize, vert(x, y)).add(this.insetAnchor) }
  //METH: 
  index(x, y) { return gridPointIndex(x, y, this.gridSize.x) }
  //METH: 
  coords(index) { return gridCoords(index, this.gridSize.x) }
  //METH: 
  coordsAreInBounds(x, y, bounds = this.cellBounds()) {
    return bounds.xCellMin <= x && x <= bounds.xCellMax && bounds.yCellMin <= y && y <= bounds.yCellMax
  }
  //METH: 
  coordsAreInGrid(x, y) { return x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y }
  //METH: 
  cellAtCoords(x, y) { if (this.coordsAreInGrid(x, y)) { return this.cellAt(this.index(x, y)) } }
  //METH: 
  groupNamed(name) { return this.groups.find(e => e.id === name) || null }
  //METH: 
  islandNamed(name) { return this.islands.find(e => e.id === name) || null }
  // #endregion
  // MARK: CellIndex Methods
  // #region CellIndex Methods
  //METH: 
  cellAt(cellIndex) { return this.cells.find(e => e.index === cellIndex) }
  //METH: 
  rowContaining(cellIndex) { return this.cellRows[this.coords(cellIndex).y] }
  //METH: 
  columnContaining(cellIndex) { return this.cellColumns[this.coords(cellIndex).x] }
  //METH: 
  rowContains(rowIndex, cellIndex) { return this.coords(cellIndex).y === rowIndex }
  //METH: 
  columnContains(columnIndex, cellIndex) { return this.coords(cellIndex).x === columnIndex }
  //METH: 
  cellSegmentBetween(indexA, indexB) {
    const indices = [indexA, indexB].sort((a, b) => a - b)
    // print(indices)
    const a = this.coords(indices[0])
    const b = this.coords(indices[1])
    const direction = a.directionTo(b)
    if (direction === -1) { return -1 }
    if (direction.allAreCardinal) {
      let seg
      if (direction.allAreHorizontal) { seg = this.cellRows[a.y] }
      if (direction.allAreVertical) { seg = this.cellColumns[a.x] }
      const start = seg.findIndex(e => e.index === indices[0])
      const end = seg.findIndex(e => e.index === indices[1])
      return seg.slice(start, end + 1)
    }
    if (direction.allAreOrdinal) {
      const slope = a.slopeTo(b)
      let seg = new OpArray
      let next = a
      for (let i = a.x; i <= b.x; i++) {
        const cell = this.cellAtCoords(next.x, next.y)
        seg.push(cell)
        next = Vertex.add(next, vert(1, slope))
      }
      return seg
    }
  }
  //METH: 
  cellSpanRowsBetween(indexA, indexB) {
    const indices = [indexA, indexB].sort((a, b) => a - b)
    // print(indices)
    const a = this.coords(indices[0])
    const b = this.coords(indices[1])
    let rows = new OpArray
    for (let i = a.y; i <= b.y; i++) {
      const seg = this.cellSegmentBetween(this.index(a.x, i), this.index(b.x, i))
      rows.push(seg)
    }
    return rows
  }
  //METH: 
  cellSpanBetween(indexA, indexB) { return this.cellSpanRowsBetween(indexA, indexB).flat() }
  //METH: 
  neighbor(cellIndex, direction) {
    let coords = this.cellAt(cellIndex).neighborCoords(direction)
    if (this.coordsAreInGrid(coords.x, coords.y)) {
      return this.cells.find(e => e.coords.equals(coords))
    } else { return }
  }
  //METH: 
  neighborIsAvailable(cellIndex, direction) {
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.available }
    return false
  }
  //METH: 
  neighborIsTaken(cellIndex, direction) { return !this.neighborIsAvailable(cellIndex, direction) }
  //METH: 
  neighborIsInIsland(cellIndex, direction, islandID) {
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.islandIDs.has(islandID) }
    return false
  }
  //METH: 
  neighborIsInGroup(cellIndex, direction, groupID) {
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.groupID === groupID }
    return false
  }
  //METH: 
  exposedDirections({ cellIndex, groupID, islandID } = {}) {
    if (groupID) {
      return Direction.All.directions.filter(e => !this.neighborIsInGroup(cellIndex, e, groupID))
    }
    if (islandID) {
      return Direction.All.directions.filter(e => !this.neighborIsInIsland(cellIndex, e, islandID))
    }
    return Direction.All.directions.filter(e => !this.neighborIsAvailable(cellIndex, e))
  }
  //METH: 
  //TODO: add sort??
  exposedSides({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.isCardinal)
      .map(f => this.cellAt(cellIndex).side(f))

  }
  //METH: 
  //TODO: add sort??
  exposedCorners({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.isOrdinal)
      .map(f => this.cellAt(cellIndex).corner(f))
    // .sort((a, b) => a.y - b.y || a.x - b.x)
  }
  //METH: 
  cellIsIsolated({ cellIndex, groupID, islandID, directions = Direction.Cardinal.directions } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID }).includesMany(directions, ['value'])
  }
  //METH: 
  vertNormals({ cellIndex, groupID, islandID, directions = Direction.Ordinal.directions } = {}) {
    return directions.map(e => {
      const adj = OpArray.from(e.adjacents)
      const exposed = OpArray.from(this.exposedDirections({ cellIndex: cellIndex, groupID: groupID, islandID: islandID }))
      const exposedAdj = adj.intersect(exposed, ['value'])
      const exposedDirect = exposed.some(f => f.value === e.value)

      if (exposedDirect) {
        if (exposedAdj.length === 1) { return exposedAdj[0] }
      } else {
        if (exposedAdj.length === 1) {
          if (exposedAdj[0].value === adj[0].value) {
            return adj[0].previous()
          } else { return adj[1].next() }
        }
      }
      return e
    })
  }
  //METH: 
  neighbors(cellIndex) { return Direction.All.directions.map(e => this.neighbor(cellIndex, e)) }
  //METH: 
  availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(e => e.available) }
  //METH: 
  takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(e => e.taken) }
  // #endregion
  // MARK: Selection Methods
  // #region Selection Methods
  //METH: 
  cellBounds({ selection = this.cells, groupID, islandID } = {}) {
    return new SelectionBounds({ selection: selection, grid: this, groupID: groupID, islandID: islandID })
  }
  //METH: converts 1D selection array to a 2D CellRows array
  toCellRows(selection) {
    const rows = new map()
    for (const cell of selection) {
      const y = cell.coords.y
      if (!rows.has(y)) { rows.set(y, []) }
      rows.get(y).push(cell)
    }
    return OpArray.from(rows.values())
  }
  //METH: randomly transforms a 1D or 2D selection array into a 2D CellRows array
  randTransformedCells(selection) {
    return this.transformedCellRows({
      selection: selection,
      start: R.random_int(0, 3),
      direction: R.random_int(0, 1)
    }).flat()
  }
  //METH: transforms a 1D or 2D selection array into a 2D CellRows array given a start corner and direction
  transformedCellRows({ selection = this.cellRows, start = Corner.TopLeft, direction = Direction.Horizontal } = {}) {
    if (!selection.is2D) { selection = this.toCellRows(selection) }
    if (start instanceof Corner) { start = start.value }
    let isVertical
    if (direction instanceof Direction) { isVertical = direction.isVertical }
    if (direction instanceof String) { isVertical = direction === 'vertical' }
    if (Number.isFinite(direction)) { isVertical = direction === 0 }

    switch (start) { // horizontal direction
      case 0: //topLeft -> no change
      case 1: //topRight
        selection = selection.flipped2D(Direction.Horizontal)
      case 2: //botRight
        selection = selection.rotated2D(180)
      case 3: //botLeft
        selection = selection.flipped2D(Direction.Vertical)
    }

    if (isVertical) { //vertical direction
      if (start % 2 === 0) { // topLeft &  botRight
        selection = selection.flipped2D(Direction.NegOrdinal)
      } else { //topRight &  botLeft
        selection = selection.flipped2D(Direction.PosOrdinal)
      }
    }
    return selection
  }
  //METH: 
  validNeighbors({ selection = this.cells, bounds = this.cellBounds(), directions = Direction.All.directions } = {}) {
    let cells = OpArray.from(new Set(selection.flatMap(e => e.validNeighborsCoords(directions, bounds))))
      .unique(['x', 'y']) // unique based upon x and y values
      .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y then x values
      .map(e => this.cellAtCoords(e.x, e.y)) // map to cells
      .exclude(selection, ['x', 'y']) // exclude objects with same x and y values
    return cells
  }
  //METH: 
  allExposedSides({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedSides({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .sort((a, b) => a.verts.start.y - b.verts.start.y || a.verts.start.x - b.verts.start.x) // sort by y, x 
  }
  //METH: 
  allExposedCorners({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedCorners({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y, x 
  }
  //METH: 
  allVertNormals({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.vertNormals({ cellIndex: e, groupID: groupID, islandID: islandID }))
    // .sort()
  }
  // #endregion
  // MARK: findIslands Method
  // #region findIslands Method
  //TODO: add transform functionality
  //NOTE: Transform requires: transformed cells, transformed bounds, and transformed direction
  //NOTE: don't change selection to 2Darray, input 1D array as param from transformer 
  //METH: findIslands()
  findIslands({ selection, bounds = this.cellBounds(), groupID, islandID, filter, direction = Direction.Cardinal, taken = true, stored = true, insetScale = 1 } = {}) {
    let cells, group, island
    if (!groupID && !islandID && !selection) {
      if (taken) { cells = this.takenCells }
      else { cells = this.availableCells }
      if (filter) { this.setFilter(filter) }
    }
    if (!selection) {
      if (groupID) {
        group = this.groupNamed(groupID)
        cells = group?.cells || OpArray.empty
        group?.setFilter(filter)
      }
      if (islandID) {
        island = this.islandNamed(islandID)
        cells = island?.cells || OpArray.empty
        island?.setFilter(filter)
      }
    } else {
      cells = OpArray.from(selection)
    }
    if (cells.isEmpty) { return }
    let tempIslands = new OpArray
    // console.log('cells', cells.map(e => e.id))

    while (cells.length > 0) {
      let cell = cells[0]
      let islanders = OpArray.from([cell])
      let fillstack = []
      findIslanders({ cell: cell, grid: this, bounds: bounds, directions: direction.directions, groupID: groupID, islandID: islandID, taken: taken })
      cells = cells.exclude(islanders, ['id'])
      islanders.forEach(e => e.islandChecked = false)

      let island = new Island({
        cells: islanders,
        protoParent: groupID ? this.groupNamed(groupID) : this,
        svgParent: this.protoParent.svgElt,
        insetScale: insetScale,
        grid: this,
        groupID: groupID,
        parentIslandID: islandID,
        direction: direction,
        stored: stored,
      })
      if (stored) { this.islands.push(island) }
      // else { 
      tempIslands.push(island)
      // }

      //TODO: re-implement as an arrow function in order to remove extra parameter passthroughs
      //NOTE: Non-recursive flood-fill implementation from: https://codeguppy.com/blog/flood-fill/index.html
      function findIslanders({ cell, grid, bounds: bounds, directions, groupID, islandID, taken } = {}) {
        fillstack.push(cell)

        while (fillstack.length > 0) {
          let current = fillstack.pop()
          if (current.islandChecked) { continue }
          let neighbors = grid.validNeighbors({ selection: [current], bounds: bounds, directions: directions })
            .filter(e => !e.islandChecked)
          if (taken) {
            if (groupID) { neighbors = neighbors.filter(e => e.groupID === groupID) }
            if (islandID) { neighbors = neighbors.filter(e => e.islandIDs.has(islandID)) }
            else { neighbors = neighbors.filter(e => e.taken) }
          } else {
            if (groupID) { neighbors = neighbors.filter(e => e.groupID !== groupID) }
            if (islandID) { neighbors = neighbors.filter(e => !(e.islandIDs.has(islandID))) }
            else { neighbors = neighbors.filter(e => e.available) }
          }

          neighbors.forEach(e => fillstack.push(e))
          current.islandChecked = true
          islanders.push(current)
          islanders = islanders
            .unique(['id'])
            .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y then x values
        }
      }
    }
    //TODO: need to keep this in mind in regards to find Islands new temp/non-stored use case
    if (stored) { this.updateCells() }
    // else { 

    tempIslands.forEach(e => e.createShape())
    return tempIslands
    // }
  }
  // #endregion
  // MARK: Shape Methods
  // #region Shape Methods
  //METH:
  customizeShapes() {
    let shapes = this.islands
      .sort((a, b) => a.cells.length - b.cells.length)
      .map(isle => isle.shape)

    shapes.forEach(shape => {
      const isle = shape.island

      shape.assignCornerVerts()
      if (isle.isRectangle) {
        shape.assignRectangleVerts()
        console.log('Neighbor Segs', shape.cells.map(cell => cell.neighborSegments))
        return
      }
      shape.assignUTurnVerts()
      shape.assignSingleStepVerts()
    })
    // console.log('shape sizes', shapes.map(e => e.cells.length))
    // console.log('shapes', shapes)
    // console.log('shapes verts', shapes.map(e => e.assignedVerts).flat())
    // console.log('shapes parts', shapes.map(e => e.parts).flat())
  }
  // #endregion
  // MARK: Setup Methods
  // #region Setup Methods
  //METH:
  cellRowsRotated(degree = 90, selection = this.cellRows) { return selection.rotated2D(normalizeDegree(degree)) }
  //METH:
  cellRowsFlipped(direction = "negOrdinal", selection = this.cellRows) { return selection.flipped2D(direction) }
  //METH:
  #createRowsArray() {
    let size = this.gridSize
    let rows = new OpArray(size.y)
    for (let j = 0; j < size.y; j++) {
      let row = new OpArray(size.x)
      for (let i = 0; i < size.x; i++) {
        let index = this.index(i, j)
        row[i] = new Cell({
          protoParent: this,
          svgParent: this.svgParent,
          grid: this,
          index: index,
          coords: vert(i, j),
          available: true,
        })
      }
      rows[j] = row
    }
    return OpArray.from(rows)
  }
  //METH:
  setFrameRadii() { FRAME.setCornerRadii(this.gridCellBounds.cornerCellCenters, this.padSize) }
  //METH:
  setInsetScale(scale) {
    super.setInsetScale(scale)
    this.setFrameRadii()
    this.updateCells()
  }
  // #endregion
  // MARK: Cell Grammar Ops
  // #region Cell Grammar Ops
  //METH:
  insetCells(scale, groupID) {
    let cells
    if (groupID) {
      const group = this.groupNamed(groupID)
      if (group) {
        cells = group.cells
      } else {
        // console.error(`no group named ${groupID}`)
        // console.log(`current groups:`, this.groups)
      }
    } else { cells = this.cells }
    cells.forEach(e => e.setInsetScale(scale))
  }
  // #endregion
  // MARK: Grammar Generators
  // #region Grammar Generators
  //METH:
  randGroup(amount) { this.assign(this.availableCells.randReduce(amount)) }
  //METH:
  groupAvail() { this.assign(this.availableCells) }

  //METH:
  randomComb({
    selection = this.availableCells,
    keepRange = range(2, 7),
    dropRange = range(2, 7),
    start = 0
  } = {}) {
    const reduced = selection.randCombReduce({ keepRange: keepRange, dropRange: dropRange, start: start, })
    this.assign(reduced)
  }
  //METH:
  comb({ selection = this.availableCells, keep = 2, drop = 1, start = 0 } = {}) {
    this.randomComb({
      selection: selection,
      keepRange: range(keep, keep),
      dropRange: range(drop, drop),
      start: start
    })
  }
  //METH:
  rects(coverage, aspects) { }
  //METH:
  squares(coverage) { }
  //METH:
  snake() { }
  // #endregion
  // MARK: Grammar Modifiers
  // #region Grammar Modifiers
  //METH:
  outline({ selection, groupID, islandID, direction = Direction.All, newGroup = true } = {}) {
    if ((selection && groupID) || (selection && islandID) || (groupID && islandID)) {
      console.error('Grid.outline can only use one selection method')
      return
    }
    let group
    if (selection && newGroup === false) { group = this.biggestGroup }
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
    if (selection.length > 0) {
      const outline = this.validNeighbors({ selection: selection, directions: direction.directions })
        .filter(cell => cell.available)
      if (newGroup === true) { group = undefined }
      if (typeof newGroup === 'string') { group = this.groupNamed(newGroup) }
      this.assign(outline, group)
    }
  }
  //METH:
  outlineGroup(groupID, direction = Direction.All, newGroup = true) {
    return this.outline({ groupID, direction, newGroup })
  }
  //METH:
  outlineTaken(direction = Direction.All, newGroup = true) {
    return this.outline({ selection: this.takenCells, direction, newGroup })
  }
  //METH:
  symmetrize({ selection, groupID, islandID, style, direction, start, use } = {}) { }
  // #endregion
  // MARK: Grammar Enum Methods
  // #region Grammar Enum Methods
  //METH:
  useSeed(named, coverage, selection = this.availableCells) {
    const target = round(coverage * this.cellCount)
    const fillsColumn = target >= this.rowCount
    const fillsRow = target >= this.rowcount
    const range = vert(round(target * 0.5), round(target * 1.5))
    const divisors = primeDivisors(this.cellCount)

    switch (named) {
      case 'Noise':
        this.randGroup(coverage)
        break
      case 'Thick Random Comb':

        break
      case 'Thin Random Comb':

        break
      case 'Rectangles':

        break
      case 'Squares':

        break
      case 'Vertical Pattern':
        const keep = R.random_num(1, this.columnCount)
        const dropBase = this.columnCount - keep

        this.comb({
          keep: keep,
          drop: dropBase,
          start: R.random_num(0, this.cellCount / 2 - 1)
        })
        break
      case 'Horizontal Pattern':

        break
      case 'Ordinal Pattern':

        break
      case 'Snake':

    }
  }
  // #endregion
  // MARK: Grammar Assignment Methods
  // #region Grammar AssignmentMethods
  //METH:
  assign(selection, group) {
    if (selection.isEmpty) { return }
    if (!group) { group = new CellGroup(this, this.svgElt, this) }
    // console.log('selection', selection)
    // console.log('group cells', group.cells)
    group.cells = group.cells.union(selection, ['id'])
    // console.log('group cells union', group.cells)
    // group.cells = selection
    // console.log('group cells selection', group.cells)
    // console.log('groupID', group.id)
    this.groups.push(group)
    this.updateCells({ groupID: group.id })
    return this
  }
  //METH:
  //FIXME: need to rethink this in regards to find Islands new temp/non-stored use case
  updateCells({ groupID, islandID } = {}) {
    if (arguments.length === 0) {
      this.cells.forEach(cell => cell.drawElement())
    }
    let groups, islands

    if (groupID) { groups = [this.groupNamed(groupID)] }
    else { groups = this.groups }
    groups.forEach(group => this.updateGroup(group))

    if (islandID) { islands = [this.islandNamed(groupID)] }
    else { islands = this.islands }
    islands.forEach(island => this.updateIsland(island))
  }
  //METH:
  updateGroup(group) {
    // console.log('group', group)
    group.cells.forEach(cell => {
      // console.log('this Cell', cell)
      let thisCell = this.cells[cell.index]
      // console.log('thisCell', thisCell.id)
      thisCell.groupID = group.id
      thisCell.available = false
      // thisCell.color = group.color
      thisCell.drawElement()
    })
  }
  //METH:
  updateIsland(island) {
    island.cells.forEach(cell => {
      let thisCell = this.cells[cell.index]
      if (thisCell) {
        thisCell.islandIDs.add(island.id)
        // thisCell.color = island.color
        thisCell.drawElement()
      }
    })
  }
  // #endregion
}

// CLASS: CellGroup
class CellGroup extends ProtoLayer {
  grid
  cells = new OpArray
  // color

  constructor(protoParent, svgParent, grid) {
    super({ protoParent: protoParent, svgParent: svgParent, drawSVG: false, drawRect: false })
    this.grid = grid
    this.finishSetup(S.Groups)
    // this.color = R.random_hash(3, '#')
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'group') }
  get testColor() { return protoColor(255, 127, 0, 1) }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.id }) }
  get boundsRect() { return this.cellBounds.boundsRect }

  get cellsByIndex() { return this.cells.sort((a, b) => a.index - b.index) }
  // #endregion
  // MARK: Grid Properties
  // #region Grid Properties

  get availableCells() { return this.grid.availableCells }
  get validNeighbors() { return this.grid.validNeighbors({ selection: this.cells }) }
  // get availableNeighbors() { return this.neighbors.filter(e => e.available) }
  // get takenNeighbors() { return this.neighbors.filter(e => e.taken) }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, groupID: this.id })
  }

  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  //TODO: migrate these methods to cell, grid, or maybe even ProtoLayer???
  //METH:
  exposedDirections(cellIndex) { return this.grid.exposedDirections({ cellIndex: cellIndex, groupID: this.id }) }
  //METH:
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, groupID: this.id }) }
  //METH:
  exposedCorners(cellIndex) { return this.grid.exposedCorners({ cellIndex: cellIndex, groupID: this.id }) }
  //METH:
  cellIsIsolated(cellIndex, directions = Direction.Cardinal.directions) {
    this.grid.cellIsIsolated({ cellIndex: cellIndex, groupID: this.id, directions: directions })
  }
  // #endregion
  // MARK: Grammar Methods
  // TODO: Review these methods... probably most need migrated!
  // #region Grammar Methods  
  walk(direction = 2, distance = 1) {
    for (let i = 1; i <= distance; i++) {
      if (this.grid.neighborIsAvailable(direction)) {
        this.add(this.grid.neighbor(direction))
      } else {
        this.expansionStopped
      }
    }
  }

  // TODO: test this code one cell visualization is improved
  randomWalk({ maxStraight = 1, start = undefined, end = undefined } = {}) {
    let borderCells = this.borderCells.flat()
    let borderCount = borderCells.length
    if (start === undefined) {
      start = borderCells[R.random_num(0, borderCount)]
    }
    // if (end === undefined) {
    //   start = borderCells[R.random_num(0, borderCount)]
    // }

  }

  // TODO: migrate these methods to grid as well
  fullContractShape(distance = 1) {
    this.contractShapeHor(distance)
    this.contractShapeVert(distance)
  }

  contractShapeHor(distance = 1) {
    this.contractShape(1, distance)
    this.contractShape(3, distance)
  }

  contractShapeVert(distance = 1) {
    this.contractShape(0, distance)
    this.contractShape(2, distance)
  }

  contractShape(direction = 2, distance = 1) {
    if (isHorizontal(direction) && this.cellBoundsWidth - distance < 1) {
      return
    }
    if (!isHorizontal(direction) && this.cellBoundsHeight - distance < 1) {
      return
    }
    for (let i = 1; i <= distance; i++) {
      let borderCells = this.borderCells(direction)
      let newCells = cells.map(e => !borderCells.includes(e))
      this.cells = newCells
    }
  }

  borderCells(direction = 0) { return this.boundsCells[direction] }
  // #endregion
}

// CLASS: Cell
class Cell extends ProtoLayer {
  grid
  index
  coords
  available
  groupID = -1
  islandIDs = new Set()
  islandChecked = false
  // color
  segments

  constructor({ protoParent, svgParent, grid, index, coords, available = true, color = '888' } = {}) {
    super({ protoParent: protoParent, svgParent: svgParent, drawSVG: false, drawRect: false })
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.available = available
    // this.color = color
    this.finishSetup(S.Cells)
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get boundsRect() { }
  get anchor() { return this.grid.cellAnchor(this.coords.x, this.coords.y) }
  get size() { return this.grid.cellSize }

  get look() {
    const clear = SVGLook.clear
    const stroke = testingControls.borders ? SVGLook.testStroke() : []
    const fill = testingControls.testColors ? SVGLook.testFill() : []
    const black = testingControls.blackMode ? SVGLook.blackAndWhite : []

    return [clear, stroke, fill, black]
  }

  get testLook() {
    // return Look.neuShade()
    return Look.test(this.size, 'cell')
  }
  get testColor() { return protoColor(0, 230, 230) }

  get x() { return this.coords.x }
  get y() { return this.coords.y }
  get taken() { return !this.available }

  get cardinalNeighbors() { return this.allNeighborsCoords(Direction.Cardinal.directions) }
  get neighborSegments() {
    const cell = this.grid.neighbor(this.index, Direction.Right)
    return cell?.segments
  }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  //METH:
  neighborCoords(direction) { return Vertex.add(this.coords, direction.moveCoord) }
  //METH:
  allNeighborsCoords(directions = Direction.All.directions) {
    return directions.map(e => this.neighborCoords(e))
  }
  //METH:
  validNeighborsCoords(directions = Direction.All.directions, bounds = this.grid.cellBounds,) {
    return this.allNeighborsCoords(directions).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
  }
  //METH:
  neighborSegment(direction) {
    const cell = this.grid.neighbor(this.index, direction)
    const side = cell.sides[direction.opposites.names]
    return cell.segments.filter(seg => seg.equals(side))
  }
  // #endregion
  // MARK: Setup Methods
  //METH:
  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        .attribute('rx', `${10}`)
        .attribute('ry', `${10}`)


      // super(this.drawElement(look))
      if (this.taken) {
        // this.insetScale = 0.9
        let maxWidthDivisor = 8
        // if (this.island.isSingle || this.island.isVertical || this.island.isHorizontal) { maxWidthDivisor = 1.1 }
        let strokeMaskWidth = R.random_num(4, this.grid.cellSize.x / maxWidthDivisor)
        this.rect
          // .attribute('fill', 'purple')
          .attribute('fill-opacity', '0')
          .attribute('fill', protoColor(230))
        // .applyStrokeMask('black', 20)
        // .applyFilter(S.Effects.db[1][1], 2 / this.insetScale)
      }
      if (this.available) {
        // this.insetScale = 0.5
        this.rect
          // .attribute('fill', 'orange')
          .attribute('fill-opacity', '0')
          .attribute('fill', protoColor(230))
        // .applyStrokeMask('black', 10)
        // .applyFilter(S.Effects.db[1][1], 2 / this.insetScale)
      }

      this.rect
      // .svgLook(this.look)
    }
  }
}

// CLASS: Island
class Island extends ProtoLayer {
  grid
  groupID
  parentIslandID
  cells
  shape
  direction
  // color
  constructor({ cells, protoParent, svgParent, grid, groupID, parentIslandID, direction = Direction.Cardinal, stored = true, insetScale = 1 } = {}) {
    super({ protoParent: protoParent, svgParent: svgParent, insetScale: insetScale, drawRect: false, drawSVG: false })
    this.cells = cells
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.parentIslandID = parentIslandID
    if (stored) { this.finishSetup(S.Islands) }
    // else { this.finishSetup() }
    // this.color = R.random_hash(3, '#')
    // this.createShape()
  }
  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'island') }
  get testColor() { return protoColor(255, 230, 0, 1) }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.groupID, islandID: this.id }) }
  get cellAnchor() { return this.cellBounds.cellAnchor }
  //TODO: Once inset transitions from filter to geometry will need to refactor
  get insetAnchor() { return this.anchor }
  get insetSize() { return this.size }

  get boundsRect() { return this.cellBounds.boundsRect }

  get cellCount() { return this.cells.length }

  get isSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index, Direction.All.directions))
  }
  get isCardinalSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index))
  }
  get isPill() { return this.cellCount === 2 && this.isCardinal }
  get isOrdinalCapsule() { return this.cellCount === 2 && this.isOrdinal }

  get isHorizontal() {
    return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Vertical.directions))
  }
  get isVertical() {
    return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Horizontal.directions))
  }
  get isLine() { return this.isSingle || this.isHorizontal || this.isVertical }
  get isCardinal() {
    return !this.isSingle
      && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Ordinal.directions))
  }
  get isOrdinal() { return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index)) }

  get isRectangle() { return !this.isLine && this.cellBounds.isFull }
  get isSquare() { return this.isRectangle && this.cellBounds.aspect.name === 'square' }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, islandID: this.id })
  }
  get exposedCorners() {
    return this.grid.allExposedCorners({ selection: this.cells, islandID: this.id })
  }
  // #endregion
  // MARK: Methods
  // #region Methods
  //METH:
  createShape(insetScale) {
    let segments = OpArray.format(this.exposedSegments)
    let subShapes = new OpArray
    let shapeIter = 0
    let subShapeIter = 0

    findShape(this.direction)
    let thisShape = new Shape({
      subShapes: subShapes,
      protoParent: this,
      svgParent: this.svgParent,
      island: this,
      insetScale: insetScale
    })
    this.shape = thisShape

    //TODO: re-implement as an arrow function in order to remove extra parameter passthroughs
    function findShape(direction) {
      let segLength = segments.length
      let subShape
      while (segments.length > 0) {
        shapeIter += 1
        let segment = segments[0]
        subShape = new OpArray
        let fillstack = []

        findSubShape(segment, direction)

        console.error(`END SUBSHAPE ${shapeIter}`)
        segments = segments.exclude(subShape, ['id'])
        subShapes.push(subShape)
        //TODO: re-implement as an arrow function in order to remove extra parameter passthroughs
        function findSubShape(seg, direction) {
          fillstack.push(seg)

          while (fillstack.length > 0) {
            subShapeIter += 1
            let current = fillstack.pop()
            let nextSeg
            //find next segments (could be 2 if allowing ordinal island connections)
            let next = segments
              .filter(s => current.endPoint.equals(s.startPoint, 4))
              .compacted
            if (next.length === 0) {
              if (current.endPoint.equals(subShape[0].startPoint, 4)) {
                subShape.push(current)
                return
              } else {
                console.log('current.endPoint', current.endPoint)
                console.log('subShape[0].startPoint', subShape[0].startPoint)
                console.error('cannot continue segmentShape')
              }
            }

            if (next.length === 1) { nextSeg = next[0] }
            if (next.length === 2) {
              console.error('next has 2 segments')
              let nextDirection
              if (direction.someAreOrdinal) {
                nextDirection = current.direction.previous(2)
              } else {
                nextDirection = current.direction.next(2)
              }
              nextSeg = next.find(e => e.direction.equals(nextDirection))
              if (nextSeg === undefined) { console.error('unexpected 2nd segment') }
            }

            fillstack.push(nextSeg)
            subShape.push(current)
            segments = segments.exclude(subShape, ['id'])
          }
        }
      }
    }
    // print(`END Shape Test`)
  }
  //METH:
  cellIsIsolated(cellIndex, directions = Direction.Cardinal.directions) {
    return this.grid.cellIsIsolated({ cellIndex: cellIndex, islandID: this.id, directions: directions })
  }
  //METH:
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }
  //METH:
  assignNormals() {

  }
  // #endregion
  //METH:
  // drawElement(look = this.testLook) {
  //   this.svgElt
  //     .style(CS.overflow, 'visible')
  //     .look(look)
  //     .size(this.insetSize.x, this.insetSize.y)
  //     .position(this.insetAnchor.x, this.insetAnchor.y)
  // }
}

// CLASS: Shape
class Shape extends ProtoLayer {
  island
  subShapes
  turns
  parts
  // color
  testVerts
  testColor

  constructor({ subShapes, protoParent, svgParent, island, insetScale } = {}) {
    super({ protoParent: protoParent, svgParent: svgParent, insetScale: insetScale })
    this.subShapes = subShapes
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.createParts()
    this.assignSegments()
    // console.log('allSegments', this.allSegments)
    this.finishSetup(S.Shapes)
  }

  get testLook() { return Look.test(this.size, 'shape') }

  get cellBounds() { return this.island.cellBounds }

  get group() { return this.island.group }
  get grid() { return this.island.grid }
  get cells() { return this.island.cells }

  get isLine() { return this.island.isLine }
  get hasSubShapes() { return this.subShapes.length > 1 }
  get hasUTurns() { return this.parts.flat().some(p => p.isUTurn) }
  get shapeCorners() { return this.allSegments.map(s => s.cornerVerts).flat().unique(['x', 'y']) }

  get allSegments() { return this.subShapes.flat() }
  get assignedVerts() {
    return this.subShapes.map(sub => sub.map(seg => seg.assignedVerts).flat().unique(['x', 'y']))
    // .flat()
  }

  get svg() {
    let result = this.subShapes.map(e => ProtoSVG.segsToSVG({ segments: e }))
    if (result instanceof Array) {
      result = result.join(' ')
    }
    return result
  }
  // get svg() { return ProtoSVG.segsToSVG({ segments: this.subShapes[0] }) }
  get svgPath() { return `path('${this.svg}')` }
  get extractedVerts() { return extractVerts(this.svg) }

  // MARK: methods
  // #region methods
  //METH:
  #createTurns(segments) {
    let segs = OpArray.from(segments)
    // let segs = this.allSegments
    let turns = new OpArray
    let prev = segs.last()
    segs.forEach((e, i) => {
      const turn = prev.direction.turnTo(e.direction)
      turns.push(turn)
      prev = e
    })
    return turns
  }
  //METH:
  createParts() {
    let turns = new OpArray
    let parts = new OpArray
    this.subShapes.forEach(shape => {
      let subTurns = this.#createTurns(shape)
      subTurns.push(subTurns[0])
      let prevTurn
      let subParts = new OpArray

      subTurns.forEach((turn, i) => {
        if (prevTurn) {
          const part = EdgePart.from([prevTurn, turn])
          const seg = shape[i - 1]
          seg.taken = true
          seg.part = part
          seg.turns = { start: prevTurn, end: turn }
          subParts.push(part)
        }
        prevTurn = turn
      })
      subTurns.pop()
      turns.push(subTurns)
      parts.push(subParts)
    })
    this.turns = turns
    this.parts = parts
  }
  //METH:
  assignSegments() {
    this.cells.forEach(cell => {
      const cellID = cell.id
      const segs = this.allSegments.filter(s => s.parentID === cellID)
      cell.segments = segs
    })
  }
  // #endregion
  // MARK: Vert Assignment Methods
  // #region Vert Assignment Methods
  //METH:
  assignCornerVerts() { this.allSegments.forEach(seg => seg.assignCornerVerts()) }
  //METH:
  assignUTurnVerts() {
    this.subShapes.forEach(sub => sub.forEach((seg, i) => {
      const loop = range(0, sub.lastIndex)
      const prev = sub[loop.cycle(i - 1)]
      const next = sub[loop.cycle(i + 1)]
      if (seg.isUTurn) {
        prev.assign('mid')
        seg.assign('mid')
        next.assign('mid')
      }
    }))
  }
  //METH:
  assignSingleStepVerts() {
    this.subShapes.forEach(sub => sub.forEach((seg, i) => {
      // console.log('try assignSingleStep')
      const loop = range(0, sub.lastIndex)
      const prev = sub[loop.cycle(i - 1)]
      const next = sub[loop.cycle(i + 1)]
      // console.log([prev, seg, next].map(e => e.part.value))
      // case covers 1 or 2 consequetive steps
      if (seg.isStep && !next.isStep) {
        // console.log('found single step')
        prev.assign('mid')
        seg.assign('mid')
        next.assign('mid')
      }
    }))
  }
  //METH:
  assignRectangleVerts() {
    const bounds = this.cellBounds
    const aspect = bounds.aspect
    const width = bounds.cellBoundsWidth
    const height = bounds.cellBoundsHeight
    let offsetLength, length, offset
    let prevLength = 0

    if (aspect.value === 2) { offsetLength = height } // landscape
    else { offsetLength = width } // square/portrait

    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) { length = width } // top/bottom 
      else { length = height } // left/right

      if (offsetLength % 2 === 0) { // even number of cells
        offset = offsetLength / 2 - 1
        this.subShapes[0][prevLength + offset].assign('end')
        this.subShapes[0][prevLength + length - offset - 1].assign('start')
      } else { // odd number of cells
        offset = (offsetLength - 1) / 2
        this.subShapes[0][prevLength + offset].assign('mid')
        this.subShapes[0][prevLength + length - offset - 1].assign('mid')
      }
      prevLength += length
    }
  }
  //METH:
  // assignSquareVerts() {
  //   const width = this.cellBounds.cellBoundsWidth
  //   // console.log(`square width = ${width}`)
  //   if (width % 2 === 0) {
  //     const offset = width / 2 - 1
  //     for (let i = 0; i < 4; i++) {
  //       this.subShapes[0][width * i + offset].assign('end')
  //       this.subShapes[0][width * (i + 1) - offset - 1].assign('start')
  //     }
  //   }
  //   if (width % 2 === 1) {
  //     const offset = (width - 1) / 2
  //     for (let i = 0; i < 4; i++) {
  //       this.subShapes[0][width * i + offset].assign('mid')
  //     }
  //   }
  // }
  // #endregion
  // MARK: Setup Methods
  // #region Setup Methods
  //METH:
  assignElement() {
    this.svgElt = createSVGElt().id(this.id)
      .parent(this.svgParent)
      .addToClassList(this.id)
      .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y, 20)
      .viewBox(this.anchor.x, this.anchor.y, this.size.x, this.size.y, 20)
  }

  //METH:
  drawElement() {
    const path = createSVGElt('path')
    // console.log(this.filter.id)
    path
      .attribute('d', this.svg)
      .parent(this.svgElt)
      .addToClassList(this.id)
      .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)

    if (S.Effects.db[0][1]) {
      let maxWidthDivisor = 20
      // if (this.island.isSingle || this.island.isVertical || this.island.isHorizontal) { maxWidthDivisor = 1.25 }
      let strokeMaskWidth = R.random_num(0, this.grid.cellSize.x / maxWidthDivisor)
      strokeMaskWidth = this.grid.cellSize.x / maxWidthDivisor

      const posInset = this.insetScale >= 0
      strokeMaskWidth = 1 * (posInset ? 1 - this.insetScale : this.insetScale) * this.grid.cellSize.x
      // strokeMaskWidth = -.6 * this.grid.cellSize.x
      // console.log('insetScale', this.insetScale)
      // console.log('strokeMaskWidth', strokeMaskWidth)
      // console.log('cellSize', this.grid.cellSize.x)
      // const posStrokeMask = strokeMaskWidth >= 0

      path
        .attribute('fill', protoColor(230))
        .attribute('fill-opacity', 1)
        // .attribute('stroke', protoColor(230))
        // .attribute('stroke-opacity', 1)
        // .attribute('stroke-width', '7')
        .attribute('fill', protoColor(255))
        .applyStrokeMask(posInset ? 'black' : 'white', strokeMaskWidth)
        // .applyStrokeMask(protoColor(128), strokeMaskWidth)
        // .applyFilter(S.Effects.db[0][1], 3)
        .applyFilter(this.filter, 2)
    }
    // .svgLook(SVGLook.trendyCactus(path))

    this.svgElt
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y, 20)
      .viewBox(this.anchor.x, this.anchor.y, this.size.x, this.size.y, 20)
    // .attribute('enable-background', 'accumulate')

    // this.testDrawVerts()
    // print(this)
    // print(this.size)
    // print(this.insetSize)
  }
  //METH:
  testDrawVerts() {
    if (!this.testVerts) {
      this.testVerts = drawPointsAtVerts({
        path: this.svgPath,
        protoParent: this.svgParent,
        size: (this.grid.cellSize.x / 32),
        offset: this.insetAnchor
      })
    }

    if (testingControls.shapeVerts) { this.testVerts.forEach(e => e.show()) }
    else { this.testVerts.forEach(e => e.hide()) }
  }
  // #endregion
}










// MARK: DEPRECATE
// #region DEPRECATE

// CLASS: GOpt : grammar options
class GOpt {
  constructor() {
    // Start: Frame
    this.frame = new Option(['frame',
      ['inset', 0.9,],
      ['None', 0.1,],
    ])

    // Start: Layer
    this.layer = new Option(['layer',
      [
        ['grid', 0.4,],
        ['nest', 0.3,],
        ['array', 0.2,],
        ['asymNest', 0.05,],
        ['asymSubdivide', 0.05,],
      ]])

    // Start: Empty Grid
    this.grid = new Option(['grid',
      [
        ['snake', 0.2],
        ['comb', 0.2],
        ['randComb', 0.2],
        ['randShape', 0.2],
        ['openNest', 0.2], // "Wi-fi"
      ]])

    // Start: Partial Grid
    this.cellgroup = new Option(['grid',
      [
        ['seperateIsles', 0.2,],
        ['deleteIslesBy', 0.2,],
        ['randDeleteIsles', 0.2,],
        ['expandCellGroup', 0.2,],
        ['contractCellGroup', 0.2,],
        ['symmetrize', 0.2,],
        ['subGrid', 0.2,],
        ['snakeExtend', 0.2,],
        ['bulbExtend', 0.2,],
        ['randAbsorbNeighbors', 0.2,],
        ['connectOrdinals', 0.2,],
        ['randTRS', 0.1,],
      ]])

    // Start: CellGroup/Island
    this.island = new Option(['grid',
      [
        ['curveShape', 0.2,],
        ['weightedCurves', 0.2,],
        ['expandShape', 0.2,],
        ['contractShape', 0.2,],
        ['nestShape', 0.2,],
        ['maskedCornerShape', 0.2,],
      ]])
  }


}

// CLASS: GMod
class GMod {
  randomComb() {
    let selection = this.grid.availableCells.randCombReduce({
      keepRange: new Range(2, 7),
      // dropRange: new Range(2, 5),
      start: 0,
    })
    this.assign(selection)
  }

  subGrid() { }



  snake(turns, start, end) { }

  createGraphPuzzle(x, y, pieces = 5) {
    // choose start point on edge
    // choose end point on edge
  }

  createShapeOnGraph(grid, turns, start, end) {

  }

  createBisectionPuzzle(grid, pieces = 4, bisections = 10, harmonics = 2) {

  }

  createRandomPointsPuzzle(grid, pieces = 4, points = 20) {

  }

}

// CLASS: Grammar
class Grammar {
  grid
  depth
  mods = []
  // FIXME: Implement idStore init of id instead of using grid.id
  constructor({ grid, mods, depth = 0 } = {}) {
    this.grid = grid
    if (mods instanceof Array) { this.mods = mods }
    else { this.mods[0] = mods }
    this.depth = depth
  }

  process() {
    // if (this.svgElt.size < protoMinSize) { return }
    // if (this.depth > protoMaxDepth) { return }
    if (this.grid.isFull) { return }

    while (this.mods.length > 1) {
      this.mods.forEach.process()
    }

    let result = this.grammar[0]
    // delete used grammar
  }

  assign(selection, group) {
    if (!group) { group = new CellGroup({ protoParent: this.grid, grid: this.grid }) }
    group.cells = selection
    this.grid.groups.push(group)
    this.group.forEach(e => {
      let cell = this.grid.cells[e.index]
      cell.groupID = group.id
      cell.available = false
    })
  }
}
// #endregion





