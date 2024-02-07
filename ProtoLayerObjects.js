// MARK:
// MARK: INITIALIZATION
// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: ProtoLayer SuperClass

// CLASS: ProtoLayer
// SIZE: 237 lines
class ProtoLayer {
  protoParent   // ProtoLayer
  _type
  _insetScale
  _filter
  _filterLoft
  svgParent     // 'SVG' p5.Element
  svgElt        // 'SVG' p5.Element
  rect          // 'rect' p5.Element
  drawSVG
  drawRect
  drawFilter
  allowsProtoErrors

  constructor({
    protoParent,
    svgParent,
    insetScale,
    filter,
    drawSVG = true,
    drawRect = false,
    drawFilter = true,
    allowsProtoErrors = false
  } = {}) {
    if (protoParent instanceof ProtoLayer) {
      this.protoParent = protoParent
      this.svgParent = protoParent.svgElt
    }
    else if (protoParent instanceof p5.Element) { this.svgParent = protoParent }
    else { console.error('protoParent is not valid') }
    if (svgParent) { this.svgParent = svgParent }
    if (insetScale) { this._insetScale = insetScale instanceof Vertex ? insetScale : vert(insetScale) }
    this._filter = filter
    this.drawSVG = drawSVG
    this.drawRect = drawRect
    this.drawFilter = drawFilter
    this.allowsProtoErrors = allowsProtoErrors
    this.assignUID()
  }

  // MARK: View Properties
  // #region View Properties

  get type() { return this._type }
  get padding() { return 20 }                                               // UNUSED

  get testLook() { return SVGLook.test() }                                  // UNUSED
  get blackLook() { }                                                       // UNUSED
  get protoLook() { return SVGLook.clear }                                  // UNUSED
  get testColor() { return protoColor(0, 230, 230, 1) }                     // UNUSED

  get color() { return protoColor(230) }                                    // UNUSED

  get look() {                                                              // UNUSED
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

  get filterLoft() { return this._filterLoft ?? 0 }                         // UNUSED
  get loft() { return this.protoParent.loft + this.filterLoft }             // UNUSED
  // #endregion
  // MARK: Computed Properties
  // #region Computed Properties
  get parentID() { return this.protoParent?.id ?? this.svgParent.id() }

  get boundsRect() { return this.protoParent?.insetBoundsRect }
  get anchor() { return vert(this.boundsRect.x, this.boundsRect.y) }
  get size() { return vert(this.boundsRect.width, this.boundsRect.height) }
  get insetAnchor() { return this.anchorFor(this.insetSize) }
  get insetSize() { return Vertex.mult(this.size, this.insetScale) }
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
      up: protoSegment({
        start: this.corners.upLeft,
        end: this.corners.upRight,
        parentID: this.id,
        islandIDs: (this.type === 'Cell') ? this.islandIDs : undefined,
        id: `${this.id}-upSide`
      }),
      right: protoSegment({
        start: this.corners.upRight,
        end: this.corners.downRight,
        parentID: this.id,
        islandIDs: (this.type === 'Cell') ? this.islandIDs : undefined,
        id: `${this.id}-rightSide`
      }),
      down: protoSegment({
        start: this.corners.downRight,
        end: this.corners.downLeft,
        parentID: this.id,
        islandIDs: (this.type === 'Cell') ? this.islandIDs : undefined,
        id: `${this.id}-downSide`
      }),
      left: protoSegment({
        start: this.corners.downLeft,
        end: this.corners.upLeft,
        parentID: this.id,
        islandIDs: (this.type === 'Cell') ? this.islandIDs : undefined,
        id: `${this.id}-leftSide`
      }),
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
  insetAmountToScale(amount) {
    amount = amount instanceof Vertex ? amount : vert(amount)
    return Vertex.sub(this.size, amount).div(this.size)
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

      if (this.drawFilter) {
        if (this.filter) {
          this.rect.applyFilter(this.filter, 2)
        }
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
    this._insetScale = scale instanceof Vertex ? scale : vert(scale)
    // console.log('ProtoLayer insetScale', this.insetScale)
    this.drawElement()
  }
  //METH: 
  setFilter(filter) {
    // console.log(`setting filter of ${this.id} to ${filter?.id}`)
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
// SIZE: 112 lines
class Frame extends ProtoLayer {
  bleed
  bleedRect
  frameRect
  cornerRadius = 5

  constructor(svgParent) {
    super({
      protoParent: svgParent,
      insetScale: 1,
      drawRect: true,
    })
    this._type = 'Frame'
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
    const radius = corners.upLeft.x + 1.4 * padding.x
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
      // TODO: investigate 'xMidyMid' usage, commented out because it was throwing an error and swithing it off doesn't have a visual effect so far
      // .attribute('preserveAspectRatio', 'xMidyMid')
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
// SIZE: 320 lines
class SelectionBounds {
  selection
  grid
  groupID
  islandID

  constructor({ selection, grid, groupID, islandID } = {}) {
    if (selection.is2D) { selection = selection.flat() }
    this.selection = selection
    this.grid = grid
    this.groupID = groupID
    this.islandID = islandID
  }

  // MARK: Properties
  // #region Properties
  get selectionCount() { return this.selection.length }
  get availableCount() { return this.availableCells.length }
  get cellBoundsCount() { return this.columnCount * this.rowCount }

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

  get upRowCells() { return this.selection.filter(e => e.y === this.yCellMin).flat() }
  get rightColCells() { return this.selection.filter(e => e.x === this.xCellMax).flat() }
  get downRowCells() { return this.selection.filter(e => e.y === this.yCellMax).flat() }
  get leftColCells() { return this.selection.filter(e => e.x === this.xCellMin).flat() }
  get outerCells() {
    return {
      up: this.upRowCells,
      right: this.rightColCells,
      down: this.downRowCells,
      left: this.leftColCells,
    }
  }

  get cornerCellVerts() {
    return {
      upLeft: vert(this.xCellMin, this.yCellMin),
      upRight: vert(this.xCellMax, this.yCellMin),
      downRight: vert(this.xCellMax, this.yCellMax),
      downLeft: vert(this.xCellMin, this.yCellMax),
    }
  }
  get cornerCells() { return this.cornerCellVerts.map(v => this.grid.cellAtCoords(v.x, v.y)) }
  get cornerCellCenters() { return this.cornerCells.map(v => v.center) }

  get cellAnchor() { return this.cornerCellVerts.upLeft }
  get spanCellVerts() { return segment(this.cornerCellVerts.upLeft, this.cornerCellVerts.downRight) }
  get spanCellIndices() {
    const a = this.spanCellVerts.verts.start
    const b = this.spanCellVerts.verts.end
    const e = this.grid.index(a.x, a.y)
    const f = this.grid.index(b.x, b.y)
    return [e, f]
  }

  get columnCount() { return this.xCellMax - this.xCellMin + 1 }
  get rowCount() { return this.yCellMax - this.yCellMin + 1 }
  get cellBoundsSize() { return vert(this.columnCount, this.rowCount) }

  get takenWeight() { return this.selectionCount / this.cellBoundsCount }
  get isMostlyTaken() { return this.takenWeight >= 0.5 }
  get isMostlyAvailable() { return !this.isMostlyTaken }
  get isFull() { return this.takenWeight === 1 }

  get anchor() { return Vertex.mult(this.cornerCellVerts.upLeft, this.cellSize) }
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
  //METH: takes a Cardinal Direction and returns a row selection of corresponding half of the cellBounds
  half(direction) {
    if (!direction.isCardinal || !direction.isSingle) { console.error('direction must be single Cardinal') }
    if (this.rowCount < 2 || this.columnCount < 2) { console.error('this grid is too small to get a half') }
    let start, end, length, evenMid, oddMid
    if (direction.isVertical) { length = this.rowCount }
    else { length = this.columnCount }
    if (length % 2 === 0) { evenMid = length / 2 }
    else { oddMid = floor(length / 2) }
    const [first, last] = this.spanCellIndices

    switch (direction.vals[0]) {
      case 0://up
        start = first
        end = this.grid.index(this.xCellMax, evenMid ? evenMid - 1 : oddMid - 1)
        break
      case 1://right
        start = this.grid.index(evenMid ? evenMid : oddMid + 1, this.spanCellVerts.start.y)
        end = last
        break
      case 2://down
        start = this.grid.index(this.spanCellVerts.start.x, evenMid ? evenMid : oddMid + 1)
        end = last
        break
      case 3://left
        start = first
        end = this.grid.index(evenMid ? evenMid - 1 : oddMid - 1, this.yCellMax)
    }

    return this.grid.cellSpanRowsBetween(start, end)
  }
  //METH: takes an Ordinal Direction and returns a row selection of corresponding quadrant of the cellBounds
  quadrant(direction) {
    console.log('')
    if (!direction.allAreOrdinal || !direction.isSingle) { console.error('direction must be single Ordinal') }
    if (this.rowCount < 2 || this.columnCount < 2) { console.error('this grid is too small to get a quadrant') }
    const val = direction.vals[0]

    let dir = []
    if (val < 1 || val > 3) { dir[0] = Direction.Up }
    else { dir[0] = Direction.Down }
    if (val < 2) { dir[1] = Direction.Right }
    else { dir[1] = Direction.Left }

    const firstHalf = this.half(dir[0]).flat() // select first half 
    const bounds = this.grid.cellBounds({ selection: firstHalf }) // get bounds from first half
    return bounds.half(dir[1]) // select half of first half to get second half
  }

  //METH:
  transformedGrid(type) { }

  //METH:
  overlaps(cellBounds) {

  }
  // #endregion
  // TODO: try adding selection and bounds parameters and then feeding them transformed matrices
  // MARK: Island Methods
  // #region Island Methods
  //METH: 
  innerCellIslands({ taken = true, stored = false, direction = Direction.Horizontal } = {}) {
    console.log('innerCellIslands called')
    return this.grid.createIslands({
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
}

// CLASS: Grid
// SIZE: 1542 lines
class Grid extends ProtoLayer {
  gridSize
  cellRows
  cellRowsPref
  groups = new OpArray

  constructor(protoParent, gridSize, insetScale, transform) {
    super({
      protoParent: protoParent,
      insetScale: insetScale,
      drawSVG: true
    })
    if (!(gridSize instanceof Vertex)) { gridSize = vert(gridSize) }
    this.gridSize = gridSize
    this._type = 'Grid'
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
  get columnCount() { return this.gridCellBounds.columnCount }
  get rowCount() { return this.gridCellBounds.rowCount }
  get cellCount() { return this.gridCellBounds.cellBoundsCount }
  get cellSize() { return Vertex.div(this.insetSize, this.gridSize) }
  get cellAspect() { return this.cellSize.aspect }
  get minCellWidth() { return min(this.cellSize.x, this.cellSize.y) }
  get cells() { return this.cellRows.flat() }
  get cellColumns() { return this.cellRowsFlipped() }
  get availableCells() { return this.cells.filter(cell => cell.available) }
  get takenCells() { return this.cells.filter(cell => cell.taken) }
  get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }                // UNUSED
  get isFull() { return this.availableCells.length === 0 }
  get lastGroup() { return this.groups.last() }
  get biggestGroup() {                                                                         // UNUSED
    return this.groups.reduce((max, grp) => {
      if (grp.cells.length > max.cells.length) { return grp }
      else { return max }
    })
  }
  //NOTE: perimeters must be created for every group!
  get perimeterIslands() { return this.groups.map(g => g.perimeterIslands).flat() }
  get islands() { return this.groups.map(g => g.islands.union(g.perimeterIslands, [`id`])).flat() }
  get shapes() { return this.islands.map(i => i.shapes).flat() }
  get allSimpleSubShapes() {
    let simpShapes = this.perimeterIslands
      // .compacted // should not have to compact because perimeters must be created for every group!
      .map(i => i.shapes).flat()
      .map(s => s.simpleSubShapes).flat()

    return simpShapes
  }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  //METH:
  cellNamed(id) { return this.cells.find(c => c.id = id) }                                     // UNUSED
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
  //METH: 
  shapeNamed(name) { return this.shapes.find(e => e.id === name) || null }
  // #endregion
  // MARK: CellIndex Methods
  // #region CellIndex Methods
  //METH: 
  cellAt(cellIndex) { return this.cells.find(e => e.index === cellIndex) }
  //METH: 
  rowContaining(cellIndex) { return this.cellRows[this.coords(cellIndex).y] }                 // UNUSED
  //METH: 
  columnContaining(cellIndex) { return this.cellColumns[this.coords(cellIndex).x] }           // UNUSED
  //METH: 
  rowContains(rowIndex, cellIndex) { return this.coords(cellIndex).y === rowIndex }           // UNUSED
  //METH: 
  columnContains(columnIndex, cellIndex) { return this.coords(cellIndex).x === columnIndex }  // UNUSED
  //METH:
  cellIsInAnIsland(cellIndex) {                                                               // UNUSED (caller)
    return this.islands.some(isle => isle.cells.some(cell => cell.index === cellIndex))
  }
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
  //METH: neighbor() : Cell : find neighbor cell by direction
  neighbor(cellIndex, direction) {
    let coords = this.cellAt(cellIndex).neighborCoords(direction)   // get neighbor coords
    if (this.coordsAreInGrid(coords?.x, coords?.y)) {               // verify coords are inside grid
      return this.cells.find(e => e.coords.equals(coords))
    }
  }
  //METH: #neighborIs() : BOOL : if certain neighbor is available, in certain island, or in certain group
  #neighborIs({ cellIndex, direction, groupID, islandID } = {}) {
    let neighbor = this.neighbor(cellIndex, direction)        // find neighbor 
    if (neighbor) {
      if (groupID) { return neighbor.groupID === groupID }     // test group membership
      if (islandID) { return neighbor.islandIDs.has(islandID) } // test island membership
      return neighbor.available                               // test availability
    }
    return false
  }
  //METH: neighborIsAvailable() : BOOL : if certain neighbor is available
  neighborIsAvailable(cellIndex, direction) {
    return this.#neighborIs({ cellIndex: cellIndex, direction: direction })
  }
  //METH: neighborIsTaken() : BOOL : if certain neighbor is taken
  neighborIsTaken(cellIndex, direction) {
    return !this.neighborIsAvailable(cellIndex, direction)
  }
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
    if (groupID) {
      return dirs.filter(e => !this.neighborIsInGroup(cellIndex, e, groupID))
    }
    if (islandID) {
      return dirs.filter(e => !this.neighborIsInIsland(cellIndex, e, islandID))
    }
    return dirs.filter(e => !this.neighborIsAvailable(cellIndex, e))
  }
  //METH: 
  //TODO: add sort??
  exposedSides({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.allAreCardinal)
      .map(f => this.cellAt(cellIndex).side(f))

  }
  //METH: 
  //TODO: add sort??
  exposedCorners({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.allAreOrdinal)
      .map(f => this.cellAt(cellIndex).corner(f))
    // .gridVertSorted
  }
  //METH: cellIsIsolated() : if cell does NOT have neighbors in given direction, by group, island, or taken (default)
  cellIsIsolated({ cellIndex, groupID, islandID, direction = Direction.Cardinal } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID }).includesMany(direction.directions, ['value'])
  }
  //METH: neighbors() : [Cell]
  neighbors(cellIndex) { return Direction.All.directions.map(dir => this.neighbor(cellIndex, dir)) }
  //METH: availableNeighbors() : [Cell]
  availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.available) }       // UNUSED
  //METH: takenNeighbors() : [Cell]
  takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.taken) }               // UNUSED
  //METH: ordinalNeghbors() : [Cell]
  ordinalNeighbors(cellIndex) {                                                                           // UNUSED
    return Direction.Ordinal.directions.map(dir => this.neighbor(cellIndex, dir))
  }

  // #endregion
  // MARK: Selection Methods
  // #region Selection Methods
  //METH: 
  cellBounds({ selection = this.cells, groupID, islandID } = {}) {
    return new SelectionBounds({ selection: selection, grid: this, groupID: groupID, islandID: islandID })
  }
  //METH: 
  shrunkSelection(selection = this.cells, amount = 1, direction = Direction.Cartesian) {
    const excludeEdges = this.grid.inline(selection, amount, direction)
    return this.boundsCells.exclude(excludeEdges, 'id')
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
  randTransformedCells(selection) {                                                                 // UNUSED
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
  //METH: 
  validNeighbors({ selection = this.cells, bounds = this.cellBounds(), direction = Direction.All } = {}) {
    let cells = OpArray.from(new Set(selection.flatMap(e => e.validNeighborsCoords(direction, bounds))))
    // console.log(`validNeighbors selection`, selection.map(c => c.id))
    // console.log(`validNeighbors cells`, cells.map(c => c.id))
    cells = cells
      .unique(['x', 'y']) // unique based upon x and y values
      .gridVertSorted // sort by y then x values
      .map(e => this.cellAtCoords(e.x, e.y)) // map to cells
      .exclude(selection, ['x', 'y']) // exclude objects with same x and y values
    return cells
  }
  //METH: 
  allExposedSides({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedSides({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .sort((a, b) => a.start.y - b.start.y || a.start.x - b.start.x) // sort by y, x 
  }
  //METH: 
  allExposedCorners({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedCorners({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .gridVertSorted // sort by y, x 
  }
  // #endregion
  // MARK: createIslands Method
  // #region createIslands Method
  //TODO: add transform functionality
  //NOTE: Transform requires: transformed cells, transformed bounds, and transformed direction
  //NOTE: don't change selection to 2Darray, input 1D array as param from transformer 
  //METH: createIslands()
  createIslands({
    selection,
    groupID,
    islandID,
    filter,
    direction = Direction.Cardinal,
    perimeterType = `maxCorners`,
    protoParent = this,
    bounds = this.cellBounds(),
    taken = true,
    stored = true,
    insetScale = 1,
    drawFilter = true,
    createShape = true,
  } = {}) {
    console.groupCollapsed(`grid.createIslands`)
    console.log(`Arguments:`, arguments[0])
    let cells, group, island
    if (!groupID && !islandID && !selection) {  // "taken/available" mode - currently unused, probably DEPRECATE!
      if (taken) { cells = this.takenCells }
      else { cells = this.availableCells }
      // if (filter) { this.setFilter(filter) }
    }
    // if (!selection) {
    //TODO: could/should I migrate from ID to direct reference?
    if (groupID) {                            // "group" mode finds & creates islands within a group
      group = this.groupNamed(groupID)
      cells = group?.cells || OpArray.empty
      // group?.setFilter(filter)
      if (group) { protoParent = group }
    }
    //TODO: could/should I migrate from ID to direct reference?
    if (islandID) {                           // "island" mode finds & creates islands within an island
      island = this.islandNamed(islandID)
      cells = island?.cells || OpArray.empty
      console.warn(`island found for ${islandID}?`, island)
      // island?.setFilter(filter)
      if (island) { protoParent = island }
    }
    if (selection) { cells = OpArray.from(selection) }
    if (cells.isEmpty) {
      console.groupEnd()
      return
    }
    console.log(`cells`, cells.map(c => c.id))
    let tempIslands = new OpArray
    while (cells.length > 0) {
      let cell = cells[0]
      let islanders = OpArray.from([cell])
      let fillstack = []
      //NOTE: Non-recursive flood-fill implementation from: https://codeguppy.com/blog/flood-fill/index.html
      //ARROW: findIslanders : 
      const findIslanders = () => {
        fillstack.push(cell)

        while (fillstack.length > 0) {
          let current = fillstack.pop()
          if (current.islandChecked) { continue }
          // console.warn(`current cell: ${current.id}`)
          let neighbors = this.validNeighbors({ selection: [current], bounds: bounds, direction: direction })
          // console.log(`validNeighbors-neighbors`, neighbors.map(c => c.id))
          neighbors = neighbors
            .filter(e => !e.islandChecked)
          // console.log(`islandChecked-neighbors`, neighbors.map(c => c.id))
          //NOTE: I can't remember why I wrote this logic to work with goupID and islandID. Else case makes sense. This might be a source of problems down the road, or an avenue for something interesting. 
          //TODO: Actually, I wonder if this might be affecting symmetrize bugs? INVESTIGATE!!!
          // if (taken) {
          // console.log(`islandChecked-neighbors islandIDs`, neighbors.map(c => Array.from(c.islandIDs)).join(` `))

          if (selection) { // filter neighbors from selection
            neighbors = neighbors.intersect(selection, ['id'])
            // console.log(`selection-neighbors`, neighbors.map(c => c.id))
          } else {
            if (groupID) {// find neighbors in group
              neighbors = neighbors.filter(e => e.groupID === groupID)
              // console.log(`groupID-neighbors`, neighbors.map(c => c.id))
            }
            if (islandID) {// find neighbors in island
              neighbors = neighbors.filter(e => e.islandIDs.has(islandID))
              // console.log(`islandID-neighbors`, neighbors.map(c => c.id))
            }
            else { neighbors = neighbors.filter(e => e.taken) } // find neighbors that are taken
          }

          neighbors.forEach(e => fillstack.push(e))
          current.islandChecked = true
          islanders.push(current)
          islanders = islanders
            .unique(['id'])
            .gridVertSorted // sort by y then x values
        }
      }

      findIslanders()
      cells = cells.exclude(islanders, ['id'])
      islanders.forEach(e => e.islandChecked = false)
      console.log(`islandID`, islandID)

      let newIsland = new Island({
        cells: islanders,
        protoParent: protoParent,
        svgParent: this.protoParent.svgElt,
        insetScale: insetScale,
        grid: this,
        groupID: groupID,
        parentIslandID: islandID,
        direction: direction,
        perimeterType: perimeterType,
        stored: stored,
        drawFilter: drawFilter,
      })

      if (stored) {
        newIsland.setFilter(filter)
        //FIXME: Need to figure out how to properly assign/add subIslands from Island.CreateSubIsland() call to createIslands
        if (group) { group.perimeterIslands.push(newIsland) }
        if (protoParent?.type === 'Island' || protoParent?.type === 'PerimeterIsland') {
          // protoParent.setFilter(filter)
          // console.warn(protoParent)
          if (!protoParent.subIslands) { protoParent.subIslands = new OpArray }
          protoParent.subIslands.push(newIsland)
        }
        // if ()
      }
      tempIslands.push(newIsland)
    }
    // console.log(`  $$$  `)
    console.log(`tempIslands`, tempIslands.map(i => i.id))
    //TODO: need to keep this in mind in regards to find Islands new temp/non-stored use case
    if (stored) {
      this.updateCells()
      tempIslands.forEach(isle => {
        this.updateCells({ island: isle })
        if (createShape) { isle.createShape() }
      })
    }
    tempIslands.forEach(isle => {
      // this.updateCells({ island: isle })
      // isle.createShape()
      console.log(`completed Island ${isle.id} cell-islandIDs`, isle.cells)
      // console.log(`completed Island ${isle.id} cell-islandIDs`, isle.cells.forEach(c => Array.from(c.islandIDs)).join(` `))
    })

    console.groupEnd()
    console.log(``)
    return tempIslands
  }
  // #endregion
  // MARK: Shape Methods
  // #region Shape Methods
  //METH:
  createSimpleSubShapes() {
    console.group(`GRID.createSimpleSubShapes called!!!`)
    this.groups.forEach(g => g.createSimpleSubShapes())
    console.groupEnd()
  }

  //METH: inWrapColinearCorners() : finds colinear wrapped corners and transfers cubic verts inwards to wrapped
  inWrapColinearCorners(seg, segCollection, outside = true) {
    console.log(`inWrapColinearCorners seg`, seg)
    console.log(`inWrapColinearCorners segCollection`, segCollection)
    const isDir = outside ? `isRight` : `isLeft`
    if (!seg.turns.end[isDir]) { // must be an outside corner, so end of seg turns Right
      console.error(`inWrapColinearCorners only works on segment corners ending in ${isDir} turns `)
      return
    }
    const neighbor = seg.neighbors.end // runs clockwise, seg then rightTurn end neighbor

    //ARROW: colWrapper() : ProtoSegment : find colinear wrapper(s) of input segment
    const colWrapper = (seg, isNeighbor = false) => {
      const segDir = seg.direction
      // const wrapDir =  segDir // wrapper will point opposite of segDir
      const turn = !isNeighbor ? 'end' : 'start'
      // const cubicVert = !isNeighbor ? seg.finalCubicEndVert : seg.finalCubicStartVert

      const cubicVert = (s) => !isNeighbor ? s.finalCubicEndVert : s.finalCubicStartVert
      const name = isNeighbor ? `end` : `start`
      // console.log(` ** findColinear seg`, info(seg))
      console.log(`cubicVert`, cubicVert)

      let overlappers = segCollection.flat().filter(s => s.isOverlappingWith(seg)) // colinear wraps overlap seg
      console.log(`${name} overFilter overlappers`, overlappers.map(o => info(o)))
      overlappers = overlappers
        .filter(s => s.direction.equals(segDir)) // colinear subIsland wraps point in same direction as seg
      console.log(`${name} overFilter opposites`, overlappers.map(o => info(o)))
      overlappers = overlappers
        .filter(s => s.turns[turn][isDir]) // colinear wraps turn left
      console.log(`${name} overFilter turn`, overlappers.map(o => info(o)))
      overlappers = overlappers
        .filter(s => seg.vertIsOnLine(cubicVert(s))) // colinear wraps will contain the transferrable cubicVert
      console.log(`${name} overFilter vertOnLine`, overlappers.map(o => info(o)))
      overlappers = overlappers
        .filter(s => !seg.start.equals(cubicVert(s), 2) && !seg.end.equals(cubicVert(s), 2))// colWraps ends !== cubicVert
      console.log(`${name} overFilter vertOnLine`, overlappers.map(o => info(o)))
      console.log(``)
      return overlappers
    }

    const wrapperStart = colWrapper(seg)
    const wrapperEnd = colWrapper(neighbor, true)

    console.log(`--> wrapperStart`, wrapperStart)
    console.log(`--> wrapperEnd`, wrapperEnd)
    console.log(``)

    if (wrapperStart.length === 1 && wrapperEnd.length === 1) { // only valid when both contain single segment
      // console.log(`!!! COLINEAR WRAPPED CORNER FOUND !!!`)
      // console.log(seg)
      // console.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
      // console.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
      // console.log(``)
      // if (normalMode) {
      //   wrapperStart[0].addCubicStartVert(seg.finalCubicEndVert)    // transfer seg.endVert to wrapperStart
      //   wrapperEnd[0].addCubicEndVert(neighbor.finalCubicStartVert) // transfer neghbor.startVert to wrapperEnd
      // } else {
      seg.replaceCubicEndVerts(wrapperStart[0].finalCubicEndVert)
      neighbor.replaceCubicStartVerts(wrapperEnd[0].finalCubicStartVert)
      // }
      return wrapperStart[0] // return wrapperStart only for adjacent wrapping
    }
  }

  //METH: inWrapCorners() : 
  inWrapCorners(insideSegs, outsideSegs, outside = true) {
    // console.log(`inWrapCorners called`)
    insideSegs.forEach(seg => this.inWrapColinearCorners(seg, outsideSegs, outside))
  }

  //METH: createCubicCorners() :
  createCubicCorners(subShapes) {
    //ARROW: sortCorners()
    const sortCorners = (subShapes) => {
      return subShapes
        .flat()
        .filter(s => !s.hasBothCubicVerts) // remove segments with both cubicVerts assigned
        .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
        .sort((a, b) => a.cubicVertCount - b.cubicVertCount) // sort by smallest cubicVertCount
    }

    let corners = sortCorners(subShapes)
    console.log(`sorted Corners`, corners)
    let outsideCorners = new OpArray
    while (corners.length > 0) {
      let seg = corners[0]
      seg = seg.hasCubicStartVert ? seg : seg.neighbors.start
      const radius = min(seg.availableEndLength, seg.neighbors.end.availableStartLength)
      seg.addDistancedEndCornerVerts(radius)
      if (seg.turns.end.isRight) { outsideCorners.push(seg) }
      corners = sortCorners(subShapes)
    }
    return outsideCorners
  }


  //MARK: CUSTOMIZE SHAPES
  //METH: nestleShapes() :
  nestleShapes(diagonals = false) {
    const cellRadius = roundToDec(this.minCellWidth / 2)

    //TODO: can minCorners be handled elsewhere?
    // handle 'minCorners' perimeter types
    if (this.groups.some(g => g.perimeterType === 'minCorners')) {
      // console.log(`there is a minCorners Group`)
      let minCornerSegs = this.groups
        .filter(g => g.perimeterType === 'minCorners') // groups with 'minCorners' perimeterType
        .map(g => g.perimeterIslands).flat() // perimeterIslands in thse groups
        .map(isl => isl.cells).flat() // cells within those perimiterIslands
        .map(cell => cell.segments).flat() // segments within those cells
        .filter(seg => seg.isCorner) // corner segments within those segments
        .exclude(madeSegs, ['id']) // exclude segments already made in previous stairs
      // console.log(`minCornerSegs`, minCornerSegs.map(c => c.id))
      assignMids(minCornerSegs, 'Corner', false) // assign midpoints to these segs + shared segs with inside turns
    }
    // else { console.log(`there is NOT a minCorners Group`) }

    this.createSimpleSubShapes() // calls createSimpleSubShapes via groups->islands->shapes

    //ARROW: overlapSegs(seg) : finds all segments that are overlap input segment
    const overlapSegs = (seg, segCollection = this.allSimpleSubShapes) => {
      return segCollection.flat().filter(s => s.isOverlappingWith(seg))
    }
    //ARROW: info ; temp logging helper for wrappedCorner methods
    const info = (seg) => {
      return {
        dir: seg.direction.name,
        shape: seg.parentID,
        id: seg.id,
        midPoint: seg.mid.string,
      }
    }
    //FIXME: move out of nestleShapes
    //ARROW: findColinearWrappedCorner() : finds overlap-based wrapped corners and transfers cubic verts to wrappers
    const findColinearWrappedCorner = (seg) => {
      if (!seg.turns.end.isRight) { // must be an outside corner, so end of seg turns Right
        console.error(`findColinearWrappedCorner only works on segment corners ending in right turns `)
        return
      }
      // console.log(` ** findColinear seg`, seg)
      const neighbor = seg.neighbors.end // runs clockwise, seg then rightTurn end neighbor

      const colWrapper = (seg, isNeighbor = false) => {
        const segDir = seg.direction
        const wrapDir = segDir.opposites // wrapper will point opposite of segDir
        const turn = isNeighbor ? 'end' : 'start'
        const cubicVert = !isNeighbor ? seg.finalCubicEndVert : seg.finalCubicStartVert
        const name = isNeighbor ? `end` : `start`
        // console.log(` ** findColinear seg`, info(seg))

        // console.log(`cubicVert`, cubicVert)

        let overlappers = overlapSegs(seg) // colinear wraps overlap seg
          .filter(s =>
            s.direction.equals(wrapDir)
            && s.turns[turn].isLeft
            && s.vertIsOnLine(cubicVert, true)
          )
        // console.log(`${name} overFilter overlappers`, overlappers.map(o => info(o)))
        // overlappers = overlappers
        // .filter(s => s.direction.equals(wrapDir)) // colinear wraps point in opposite direction as seg
        // console.log(`${name} overFilter opposites`, overlappers.map(o => info(o)))
        // overlappers = overlappers
        // .filter(s => s.turns[turn].isLeft) // colinear wraps turn left
        // console.log(`${name} overFilter turn`, overlappers.map(o => info(o)))
        // overlappers = overlappers
        // .filter(s => s.vertIsOnLine(cubicVert, true)) // colinear wraps will contain the transferrable cubicVert
        // console.log(`${name} overFilter vertOnLine`, overlappers.map(o => info(o)))
        // overlappers = overlappers
        // .filter(s => !s.start.equals(cubicVert, 2) && !s.end.equals(cubicVert, 2))// colWraps ends !== cubicVert
        // console.log(`${name} overFilter vertOnLine`, overlappers.map(o => info(o)))
        // console.log(``)
        return overlappers
      }

      const wrapperStart = colWrapper(seg)
      const wrapperEnd = colWrapper(neighbor, true)

      // console.log(`--> wrapperStart`, wrapperStart)
      // console.log(`--> wrapperEnd`, wrapperEnd)
      // console.log(``)

      if (wrapperStart.length === 1 && wrapperEnd.length === 1) { // only valid when both contain single segment
        // console.log(`!!! COLINEAR WRAPPED CORNER FOUND !!!`)
        // console.log(seg)
        // console.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
        // console.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
        // console.log(``)

        wrapperStart[0].addCubicStartVert(seg.finalCubicEndVert)    // transfer seg.endVert to wrapperStart
        wrapperEnd[0].addCubicEndVert(neighbor.finalCubicStartVert) // transfer neghbor.startVert to wrapperEnd

        return wrapperStart[0] // return wrapperStart only for adjacent wrapping
      }
    }
    //FIXME: move out of nestleShapes
    //ARROW: findPartialWrappedCorner() : finds overlap-based wrapped corners and transfers cubic verts to out wrap
    const findAdjacentWrappedCorner = (seg) => {
      if (!seg.turns.start.isLeft) {
        console.error(`findAdjacentWrappedCorner only works on segment corners starting in left turns `)
        return
      } // must be an inside corner, so end of seg turns Left
      const neighbor = seg.neighbors.start // use start neighbor to run clockwise like findColinearWrappedCorner()

      // console.log(` %$#** FindAdjacent Seg`, info(seg))
      // with current implementation, all adjacent sides will be with current shape. Intergrids might change this?
      const shape = this.shapeNamed(seg.parentID)
      const subShapes = shape.simpleSubShapes.flat()

      const adjWrapper = (seg, isNeighbor = false) => {
        const segDir = seg.direction
        const adjDir = segDir.opposites // adjacent wraps point opposite of segDir
        const turn = !isNeighbor ? 'end' : 'start'
        const cubicVert = isNeighbor ? seg.finalCubicEndVert : seg.finalCubicStartVert
        const normCoord = segDir.rotated(90).moveCoord // normals always point left 90deg from segment direction
        const normal = segment(cubicVert, Vertex.add(cubicVert, Vertex.mult(normCoord, shape.cellBounds.size)))
        const name = isNeighbor ? `end` : `start`
        // console.log(` ** findAdjacent seg`, info(seg))
        // console.log(`normal`, normal.string)

        let adjs = subShapes
          .filter(s =>
            s.direction.equals(adjDir)
            && s.turns[turn].isRight
          )
          // console.log(`${name} adj subshapes `, adjs.map(s => info(s)))
          // adjs = adjs
          // .filter(s => s.direction.equals(adjDir)) // adjacent wraps point in opposite direction as seg
          // console.log(`${name} adj opposites `, adjs.map(s => info(s)))
          // adjs = adjs
          // .filter(s => s.turns[turn].isRight) // adjacent wraps turn right
          // console.log(`${name} adj rightTurns `, adjs.map(s => info(s)))
          // adjs = adjs
          .map(s => s.intersectionWith(normal) ? [s, s.intersectionWith(normal)] : null) // adjWraps intersect normal
          .compacted
          // console.log(`${name} adj intersections `, adjs.map(s => [info(s[0]), s[1]]))
          // adjs = adjs
          .filter(s => !s[0].start.equals(s[1], 1) && !s[0].end.equals(s[1], 1)) // adjWraps cant have ends on normal
          // console.log(`${name} adj intersections colinear`, adjs)
          // adjs = adjs
          .sort((a, b) => segment(seg[name], a[1]).length - segment(seg[name], b[1]).length)
        // console.log(`${name} adj intersections sorted`, adjs.map(s => info(s[0])))
        // console.log(`${name} adj intersections sorted`, adjs.map(s => s[0].length))
        adjs = adjs[0]
        // console.log(`${name} adjs final`, adjs ? info(adjs[0]) : undefined)
        // console.log(`${name} adjs final`, adjs[0].map(s => info(s)))
        // console.log(``)

        return adjs
      }

      const wrapperStart = adjWrapper(seg)
      const wrapperEnd = adjWrapper(neighbor, true)

      // console.log(`--> wrapperStart`, wrapperStart)
      // console.log(`--> wrapperEnd`, wrapperEnd)
      // console.log(``)

      if (wrapperStart && wrapperEnd) {
        if (wrapperStart[0].neighbors.end.id !== wrapperEnd[0].id) {
          // console.error(`INVALID: Wrappers are not connected`)
          return
        }
        //FIXME: test to see if this is working AND solving a bug!
        if (wrapperStart[0].isColinearWith(seg) || wrapperEnd[0].isColinearWith(neighbor)) {
          console.warn(`INVALID: Wrapper corner is colinear with segment corner`)
          return
        }

        // console.log(`!!! ADJACENT WRAPPED CORNER FOUND !!!`)
        // console.log(seg)
        // console.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
        // console.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
        const startGap = segment(seg.finalCubicStartVert, wrapperStart[1])
        const endGap = segment(neighbor.finalCubicEndVert, wrapperEnd[1])
        // console.log(`startGap`, startGap.length, startGap.string)
        // console.log(`endGap`, endGap.length, endGap.string)
        // console.log(``)
        const startGapLength = roundToDec(startGap.length, 3)
        const endGapLength = roundToDec(endGap.length, 3)
        if (startGapLength === endGapLength) {
          // console.warn(`Wrapped both segments`)
          wrapperStart[0].addCubicEndVert(wrapperStart[1])
          wrapperEnd[0].addCubicStartVert(wrapperEnd[1])
          // console.log(``)
          return wrapperStart[0]
        }

        else if (startGapLength < endGapLength) {
          // console.log(`Wrapped end of start segment ${wrapperStart[0].id} with ${wrapperStart[1].string}`)
          wrapperStart[0].addCubicEndVert(wrapperStart[1])
        } else {
          // console.log(`Wrapped start of end segment ${wrapperEnd[0].id} with ${wrapperEnd[1].string}`)
          wrapperEnd[0].addCubicStartVert(wrapperEnd[1])
        }
        // console.log(``)

      }
    }
    //FIXME: move out of nestleShapes
    //ARROW: outWrapOutsideCorners() : recursive combination of colinear/adjacent wrap functions for outside corners
    const outWrapOutsideCorners = (segCollection) => {
      segCollection = OpArray.format(segCollection)
      const colinears = segCollection.map(seg => findColinearWrappedCorner(seg)).compacted
      if (!colinears.isEmpty) {
        const adjacents = colinears.map(seg => findAdjacentWrappedCorner(seg)).compacted
        if (!adjacents.isEmpty) {
          outWrapOutsideCorners(adjacents)
        }
      }
    }
    //FIXME: move out of nestleShapes
    //ARROW: outWrapAdjInsideCorners() : recursive combination of adjacent/colinear wrap functions for inside corners
    const outWrapAdjInsideCorners = (segCollection) => {
      segCollection = OpArray.format(segCollection)
      const adjacents = segCollection.map(seg => findAdjacentWrappedCorner(seg)).compacted
      if (!adjacents.isEmpty) {
        const colinears = adjacents.map(seg => findColinearWrappedCorner(seg)).compacted
        if (!colinears.isEmpty) {
          outWrapAdjInsideCorners(colinears)
        }
      }
    }


    //MARK: QUAD SHAPES
    //ARROW: createQuadShapes(mode) : process 4-sided (square/rect) shapes first with multiple modes
    //TODO: need to add an ABFeature to select these!!!
    const createQuadShapes = (mode) => {
      const sumSides = (sides) => sides.reduce((a, b) => a + b)

      // console.log(`allSimpleSubShapes`, this.allSimpleSubShapes)
      //FIXME: need to filter out outer subShapes that wrap/outline an inner subShape
      const quads = this.allSimpleSubShapes
        .filter(sub => sub.length === 4)// filter for 4-sided shapes
        .filter(sub => sub.some(seg => seg.isUTurnOut)) // filter for Outside shapes only (UTurnOut)
        .sort((a, b) => sumSides(b) - sumSides(a)) // sort smallest to largest
      // .copy
      // console.log(`this.allSimpleSubShapes`, this.allSimpleSubShapes)
      // console.log('quads', quads)
      // console.log(`quad parts`, quads.map(quad => quad.map(seg => seg.part.value)))

      let processor
      switch (mode) {
        case 0: // Max curvature, equal radii
          processor = (quad) => {
            const radius = min(quad.map(seg => seg.length)) / 2
            return [radius, radius, radius, radius]
          }
          break
        case 1: // Min curvature, equal radii
          processor = (quad) => [cellRadius, cellRadius, cellRadius, cellRadius]
          break

        case 2: // Horizontal Symmetry
        // quads must be horizontal rectangles! utilize Easter Egg logic but add maxLength?
        // might be worth combining symmtry into single mode, 
        case 3: // Vertical Symmetry
        // quads must be vertical rectangles! utilize Easter Egg logic but add maxLength?
        // might be worth combining symmtry into single mode, 

        case 4: // Easter Eggs / Eyeballs : max curvature with diagonal symmetry
          processor = (quad) => {
            // console.error(`hi`)
            let cornerMap
            const minLength = min(quad.map(seg => seg.length)) // min side length
            if (equalsRoundedDec(minLength, this.minCellWidth, 4)) { // quad is single cell width or height
              cornerMap = [cellRadius, cellRadius, cellRadius, cellRadius,]
            } else {
              const maxRadius = minLength - cellRadius // maxRadius given cellRadius is minRadius
              // build options from cellRadius steps from 0->minLength, removing 3 steps (0, minLength/2, and minLength)
              const steps = (round(maxRadius / cellRadius) - 1) / 2 // totalSteps = 2 * steps + 1
              let options = range(-steps, steps)
                .array() // totalSteps array minus 1st and last (0 and minLength)
                // .filter(s => !(s === 0)) // remove middle (minLength/2) step
                .map(s => s + steps + 1) // add back steps like converting -0.5 to 0.5 range to 0-1 range
              const radius1 = minLength - (R.random_choice(options) * cellRadius)
              const radius2 = minLength - radius1
              cornerMap = [radius1, radius2, radius1, radius2,]
              console.log(`minLength`, minLength)
              console.log(`cellRadius`, cellRadius)
              console.log(`maxRadius`, maxRadius)
              console.log(`steps`, steps)
              console.log(`options`, options)
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

      //ARROW: assignQuad() : assign cubic verts using radii from cornerMap
      const assignQuad = (quad, cornerMap) => {
        cornerMap.forEach((cMap, i) => quad[i].addDistancedStartCornerVerts(cMap))
      }

      quads.forEach((quad, i) => {
        const cornerMap = processor(quad)
        // console.log(`cornerMap`, cornerMap)
        assignQuad(quad, cornerMap)
        console.log(``)
        console.log(`    QUAD`, i, quad[0].parentID)
      })
      outWrapOutsideCorners(quads.flat())
    }


    //ARROW: createUTurnOuts()
    const createUTurnOuts = (out = true) => {

      //ARROW: sortUTurnOuts() : sorting for createUTurnOuts()
      const sortUTurns = (out = true) => {
        return this.allSimpleSubShapes
          .flat()
          .filter(s => out ? s.isUTurnOut : s.isUTurnIn) // only include UTurnOut segments
          .filter(s => !s.hasSomeCubicVerts) // remove segments with any cubicVerts assigned
          .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
      }

      let curved = new OpArray
      let uTOs = sortUTurns(out)
      while (uTOs.length > 0) {
        const seg = uTOs[0]
        const startNeighbor = seg.neighbors.start
        const endNeighbor = seg.neighbors.end
        const startRadius = min(startNeighbor.availableEndLength, seg.availableStartLength)
        const endRadius = min(seg.availableEndLength, endNeighbor.availableStartLength)

        if (approxToDec(startRadius) === approxToDec(endRadius)) {
          seg.addBothDistancedCornerVerts(startRadius)
          curved.push(startNeighbor)
          curved.push(seg)
          // outWrapOutsideCorners(startNeighbor)
          // outWrapOutsideCorners(seg)
        }
        else if (startRadius < endRadius) {
          seg.addDistancedStartCornerVerts(startRadius)
          curved.push(startNeighbor)
          // outWrapOutsideCorners(startNeighbor)
        } else {
          seg.addDistancedEndCornerVerts(endRadius)
          curved.push(seg)
          // outWrapOutsideCorners(seg)
        }
        uTOs = uTOs
          .filter(s => !s.hasSomeCubicVerts) // remove segments with any cubicVerts assigned
          .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
      }
      outWrapOutsideCorners(curved)
    }

    //ARROW: sortStairs() : sorting for createStairs()
    const sortStairs = () => {
      return this.allSimpleSubShapes
        .flat()
        .filter(s => s.isStair) // only include UTurnOut segments
        .filter(s => !s.hasSomeCubicVerts) // remove segments with any cubicVerts assigned
        // .filter(s => !s.hasBothCubicVerts) // remove segments with both cubicVerts assigned
        .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
      // .sort((a, b) => a.cubicVertCount - b.cubicVertCount) // sort by smallest cubicVertCount
      // return utoSimples
    }
    //TODO: Finish implementation for creating diagonal lines
    //ARROW: createStairs()
    const createStairs = () => {
      let curved = new OpArray
      let stairs = sortStairs(this.allSimpleSubShapes)
      while (stairs.length > 0) {
        const seg = stairs[0]
        const startNeighbor = seg.neighbors.start
        const endNeighbor = seg.neighbors.end
      }
    }



    //ARROW: createCorners()
    const createCorners = (subShapes) => {
      // //ARROW: sortCorners()
      // const sortCorners = (subShapes) => {
      //   return subShapes
      //     .flat()
      //     .filter(s => !s.hasBothCubicVerts) // remove segments with both cubicVerts assigned
      //     .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
      //     .sort((a, b) => a.cubicVertCount - b.cubicVertCount) // sort by smallest cubicVertCount
      // }

      // let corners = sortCorners(subShapes)
      // // console.log(`finalCorners: `, corners.map(s => [s.minCubicLength, s.part.value, s.parentID, s.cubicVertCount, s.id]))
      // while (corners.length > 0) {
      //   let seg = corners[0]
      //   seg = seg.hasCubicStartVert ? seg : seg.neighbors.start
      //   const radius = min(seg.availableEndLength, seg.neighbors.end.availableStartLength)
      //   seg.addDistancedEndCornerVerts(radius)
      const oustideCorners = this.createCubicCorners(subShapes)
      console.log(`outsideCorners`, oustideCorners)
      oustideCorners.forEach(seg => outWrapOutsideCorners(seg))
      // if (seg.turns.end.isRight) { outWrapOutsideCorners(seg) }
      //   corners = sortCorners(subShapes)
      // }
    }

    //ARROW: finish()
    const finish = () => {
      this.allSimpleSubShapes.flat().forEach(s => {
        s.matchStartCorner()
        if (s.turns.end.isRight) { outWrapOutsideCorners(s) }
        // outWrapOutsideCorners(s)
      })
    }


    createQuadShapes(0)
    createUTurnOuts()
    // createStairs()
    createCorners(this.allSimpleSubShapes)
    finish()

    // console.log(`currentSimples`, sortedSimples().map(s => s.id))
    // console.log(`currentSimples turns`, sortedSimples().map(s => [s.minCubicLength, s.part.value, s.parentID, s.cubicVertCount, s.id]))

    console.log(`  %%%% end nestleShapes %%%%`)
    console.log(``)
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
    // console.log('Grid setInsetScale', scale)
    super.setInsetScale(scale)
    // console.log('Grid insetScale', this.insetScale)
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
  randGroup({ selection = this.availableCells, amount } = {}) { return this.assignCells(selection.randReduce(amount)) }
  //METH:
  randomSelection(amount, selection = this.availableCells) { return selection.copy.randReduce(amount) }
  //METH:
  groupAvail() { return this.assignCells(this.availableCells) }

  //METH:
  randomComb({
    selection = this.availableCells,
    keepRange = range(2, 7),
    dropRange = range(2, 7),
    start = 0
  } = {}) {
    const reduced = selection.randCombReduce({ keepRange: keepRange, dropRange: dropRange, start: start, })
    return this.assignCells(reduced)
  }
  //METH:
  comb({ selection = this.availableCells, keep = 2, drop = 1, start = 0 } = {}) {
    return this.randomComb({
      selection: selection,
      keepRange: range(keep, keep),
      dropRange: range(drop, drop),
      start: start
    })
  }
  //METH:
  rects(coverage, aspects) {

  }
  //METH:
  squares({ coverage, direction = Direction.DownRight, minSize = 1, uniform = false, overlapping = true } = {}) {
    // console.log('columnCount', this.columnCount)
    let maxSize // allowable max square based on 'Square and Rect Generation' study
    let newCount = this.columnCount

    if (this.columnCount > 3) {
      switch ((this.columnCount + 1) % 3) {
        case 0:
          newCount = newCount + 1
        // console.log(`using case 0`)
        case 1:
          // console.log(`using case 1`)
          maxSize = newCount - (newCount / 3 + 1)
          break
        case 2:
          // console.log(`using case 2`)
          maxSize = this.columnCount - ((this.columnCount - 1) / 3 + 1)
          break
      }
    }

    // randomly generate squares within size range that add up to coverage
    const maxCells = round(coverage * this.cellCount)
    maxSize = min(maxSize, floor(sqrt(maxCells))) // maxSize by gridSize or coverage amount
    // console.log('maxSize', maxSize)
    let usedCells = 0
    let squares = new OpArray
    let uniformSquare = uniform ? R.random_int(minSize, maxSize) : undefined // single size if uniform
    while (usedCells < maxCells) {
      const square = uniform ? uniformSquare : R.random_int(minSize, maxSize)
      squares.push(square)
      usedCells += (square * square)
      maxSize = min(maxSize, floor(sqrt(maxCells - usedCells))) //recalc maxSize each loop to keep close to coverage
    }
    // console.log('squares', squares)

    const original = this.availableCells.copy
    let selection = new OpArray
    let available = this.availableCells

    squares.forEach((size, i) => {
      let inlineSelection = this.inline(original, size - 1, direction.andAdjacents)
      // console.log('')
      // console.log('inlineSelection', inlineSelection.map(e => e.id))
      const padding = this.tempOutlineSelection(selection)
      inlineSelection = inlineSelection.union(selection, 'id')
      if (overlapping !== 'always') {
        inlineSelection = inlineSelection.union(padding, 'id')
      }
      // console.log('inlineSelection', inlineSelection.map(e => e.id))
      let shrunkSelection = available.exclude(inlineSelection, 'id') //shrunk selection by excluding inline
      // console.log('shrunkSelection', shrunkSelection.map(e => e.id))

      //ARROW: newSquare() :
      const newSquare = () => {
        let isValid = false
        let cell, square
        while (isValid === false && shrunkSelection.length > 1) {
          // console.log('')
          cell = this.randomSelection(1 / shrunkSelection.length, shrunkSelection) //random cell within shrunk
          // console.log('cell', cell.map(e => e.id))
          const outline = this.tempOutlineSelection(cell, size - 1, direction.andAdjacents) //create square outline
          square = cell.copy.union(outline, 'id') //union cell with outline to create square
          // console.log('shrunk start', shrunkSelection.map(e => e.id))
          const overlaps = square.includesAny(padding, 'id')// check if square overlaps padding
          // console.log('padding length', padding.length)
          // console.log('square overlaps', overlaps)
          switch (overlapping) {
            case 'always':
              isValid = padding.length > 0 ? overlaps : true
              break
            case 'never':
              isValid = !overlaps
              break
            default:
              isValid = true
          }
          // console.log('square is valid', isValid)
          if (!isValid) {
            square = new OpArray //make square empty
            shrunkSelection = shrunkSelection.filter(e => e.id !== cell[0].id) // remove failed cell 
          }
          // console.log('shrunk end', shrunkSelection.map(e => e.id))
        }
        return square
      }

      let square = newSquare()

      selection = selection.union(square, 'index') //union squares with selection for new selection
      available = original.exclude(selection, 'index') //remove selection from available for new available
      // console.log('available', available.map(e => e.id))
    })

    return this.assignCells(selection)
  }
  //METH:
  triangles(coverage) { }
  //METH:
  snake() { }
  // #endregion
  // MARK: Grammar Modifiers
  // #region Grammar Modifiers
  //METH: iterative outliner driven by directions
  outline({
    selection,
    groupID,
    islandID,
    direction = Direction.All,
    amount = 1,
    newGroup = true
  } = {}) {
    // if (amount < 1) { return }
    if ((selection && groupID) || (selection && islandID) || (groupID && islandID)) {
      console.error('Grid.outline can only use one selection method')
      return
    }
    let group
    if (selection && newGroup === false) { group = this.lastGroup }
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
    while (amount > 0) {
      if (selection.length > 0) {
        const outline = this.validNeighbors({ selection: selection, direction: direction })
          .filter(cell => cell.available)
        if (newGroup === true) { group = undefined } //allow assign to create new group
        if (typeof newGroup === 'string' && !temp) { group = this.groupNamed(newGroup) } //use existing group
        else { this.assignCells(outline, group?.id) } //assign to group
        if (newGroup === true && !group) { //continue adding to the new group
          group = this.lastGroup
          newGroup = false
        }
        selection = group.cells
      }
      amount -= 1
    }
    return group
  }
  //METH: outline a group and assign
  outlineGroup({ groupID, direction = Direction.All, amount = 1, newGroup = true } = {}) {
    return this.outline({ groupID, direction, amount, newGroup })
  }
  //METH: outline all taken cells and assign
  outlineTaken({ direction = Direction.All, amount = 1, newGroup = true } = {}) {
    return this.outline({ selection: this.takenCells, direction: direction, amount: amount, newGroup: newGroup })
  }
  //METH: grab an outline of a selection without assignment
  tempOutlineSelection(selection, amount = 1, direction = Direction.All) {
    let newSelection = new OpArray
    while (amount > 0) {
      if (selection.length > 0) {
        const outline = this.validNeighbors({ selection: selection, direction: direction })
        // console.log('temp outline', outline)
        newSelection.push(...outline)
        selection = newSelection.sort((a, b) => a.index - b.index)
        // console.log('temp selection', selection.map(e => e.id))
      }
      amount -= 1
      // console.log('temp newSelection', newSelection.map(e => e.id))
      // console.log('temp selection', selection.map(e => e.id))
    }
    // console.log('tempOutline', amount, direction)
    return selection

  }
  //METH: grab an inline of a selection without assignment
  inline(selection, amount = 1, direction = Direction.All) {
    if (amount < 1) { return new OpArray }
    // console.log('inline amount', amount)
    const bounds = this.cellBounds()
    let inlineEdges = new OpArray //store edge rows/columns/corners that can't be outlined, to be inlined
    direction.directions.forEach(dir => {
      const name = dir.names[0]
      // console.log('direction name', name)
      if (dir.isOrdinal) {
        inlineEdges.push(bounds.cornerCells[name])
        // console.log('addedCells', bounds.cornerCells[name])
      } else {
        inlineEdges.push(bounds.outerCells[name])
        // console.log('addedCells', bounds.outerCells[name])
      }

    })
    inlineEdges = inlineEdges
      .flat()
      .intersect(selection, 'id')
    // console.log('inlineEdges', inlineEdges.map(e => e.id))
    let inlinedEdges = this.tempOutlineSelection(inlineEdges, amount - 1, direction.opposites)
    // console.log('inlinedEdges', inlinedEdges.map(e => e.id))
    inlinedEdges = inlinedEdges.union(inlineEdges, 'id')
    // console.log('inlinedEdges', inlinedEdges.map(e => e.id))

    const outline = this.tempOutlineSelection(selection, 1, direction)
    const inline = this.tempOutlineSelection(outline, amount, direction.opposites)
      .union(inlinedEdges, 'id')
    // console.log('outline', outline.map(e => e.id))
    // console.log('inline', inline.map(e => e.id))
    // console.log('inline method return')
    // console.log('')
    return selection.intersect(inline, 'index')
  }
  //FIXME: somehow it's drawing multiple cell configs as it reassigns
  //TODO: feature: flip a single quad once only
  //METH:
  symmetrize({
    selection = this.cellRows,
    direction, // Horizontal/Vertical = HALF, Cardinal = QUAD
    reflection, // BOOL: reflection or rotation
    useAssigned = true,
    useAvailable = true,
    groupIDs,
  } = {}) {
    if (!direction.allAreCardinal && direction.vals.length % 2 !== 0) { console.error('only Hor, Vert, and Cardinal allowed') }
    const isQuad = direction.equals(Direction.Cardinal) // Horizontal/Vertical = HALF, Cardinal = QUAD
    console.log('isQuad', isQuad)
    if (!selection.is2D) { selection = this.toCellRows(selection) }
    const bounds = this.cellBounds({ selection: selection }) // get cellBounds of selection
    console.log('bounds', bounds)

    //METH: assignSym arrow function
    const assignSym = (transformed, destination) => {
      transformed = transformed.flat() // flatten half for operations
      destination = destination.flat() // flatten half for operations
      console.log('transformed', transformed.map(e => e.id))
      console.log('transformed available', transformed.map(e => e.available))
      console.log('destination flattened', destination.map(e => e.id))
      console.log('destination available', destination.map(e => e.available))
      if (transformed.length !== destination.length) { // ensure halves are equal
        console.error('expected selections to have same length')
      }

      destination.forEach((destCell, i) => {
        const transformCell = transformed[i]
        if (useAssigned) { // useAssigned changes assigned cells' groupIDs
          if (groupIDs && !groupIDs?.some(id => id === transformCell.groupID)) {
            console.log('HIT THIS HIT THIS HIT THIS HIT THIS')
          } else {
            if (transformCell.groupID !== -1) {
              console.log('newGroupID', transformCell.groupID)
              destCell.groupID = transformCell.groupID
            }
          }
        }
        if (useAvailable && transformCell.available === true) { // useAvailable changes available cells  
          const currentGroup = this.groupNamed(destCell.groupID)
          if (currentGroup) { // remove cell from currentGroup
            currentGroup.cells = currentGroup.cells.filter(cell => cell.id !== destCell.id)
          }
          destCell.groupID = -1 // groupID to -1
          destCell.available = true // available to true
        }
      })
      console.log('destination transformed available', destination.map(e => e.available))
      console.log('destination transformed groupID', destination.map(e => e.groupID))

      if (groupIDs) { //filter destination by groupIDs
        destination = destination.filter(destCell => groupIDs.some(id => destCell.groupID === id))
      } else { // get all groupIDs
        groupIDs = this.groups.map(group => group.id)
      }
      console.log('destination groupID filtered', destination.map(e => e.id))
      console.log('groupIDs', groupIDs)

      const groupSelections = groupIDs.map(id => { // group destCells by groupID
        console.log('process id', id)
        return destination.filter(destCell => destCell.groupID === id)
      })
      console.log('groupID Selections', groupSelections)

      let emptySelections = destination
        .filter(cell => cell.available === true) // filter for only available cells
      console.log('emptySelections 1', emptySelections)

      emptySelections = emptySelections
        .exclude(groupSelections.flat(), 'id') // exclude cells that will be taken
      console.log('emptySelections 2', emptySelections.map(e => e.id))

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

    let sourceDir = direction.random() // pick a random direction from available directions
    console.log('sourceDir', sourceDir)
    let source, transformed, destination
    if (isQuad) { //quad
      source = bounds.half(sourceDir) // get picked half
      console.log('quad source', source)
      destination = bounds.half(sourceDir.opposites) // get other half
      if (reflection) {
        direction = sourceDir.andOpposites // get flip direction
        transformed = source.flipped2D(direction) // flip source
        sourceDir = sourceDir.toLeft // set next source half to -90deg
        console.log('quad direction', direction)
        direction = direction.equals(Direction.Horizontal) ? Direction.Vertical : Direction.Horizontal // rotate flip direction -90deg
        console.log('after quad direction', direction)
      } else {
        transformed = source.rotated2D(90) // rotate source 90deg
      }
      assignSym(transformed, destination)
    }
    // half symmetrize
    source = bounds.half(sourceDir) // get picked half
    console.log('half bounds', bounds)
    console.log('half source', source)
    console.log('half source flattened', source.flat().map(e => e.id))
    destination = bounds.half(sourceDir.opposites) // get other half
    if (reflection) {
      console.log('reflection direction', direction)
      transformed = source.flipped2D(direction) // flip source
    } else {
      transformed = source.rotated2D(180) // rotate source 180deg
    }
    assignSym(transformed, destination)
  }
  // #endregion
  // MARK: Grammar Enum Methods
  // #region Grammar Enum Methods
  //METH:
  useSeed(named, coverage, selection = this.availableCells) {
    const target = round(coverage * this.cellCount)
    const fillsColumn = target >= this.rowCount
    const fillsRow = target >= this.rowCount
    const range = vert(round(target * 0.5), round(target * 1.5))
    const divisors = primeDivisors(this.cellCount)
    const maxWidth = this.columnCount - 1

    switch (named) {
      case 'Noise':
        this.randGroup(coverage)
        break
      case 'Thick Random Comb':
        this.randomComb({
          selection: this.randTransCells(),
          keepRange: range(2, ceil(this.rowCount * coverage)),
          dropRange: range(1, this.rowCount),
          start: R.random_int(0, this.cellCount - 1)
        })
        break
      case 'Thin Random Comb':
        this.randomComb({
          selection: this.randTransCells(),
          keepRange: range(1, floor(this.columnCount)),
          dropRange: range(2, this.columnCount / coverage),
          start: R.random_int(0, this.cellCount - 1)
        })
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
  assignCells(selection, groupID) {
    // console.log('selection', selection)
    if (selection.isEmpty) { return }
    let newGroup = false
    if (!groupID) { newGroup = true }
    let group
    if (newGroup) {
      group = new CellGroup(this, this.svgElt, this)
    } else {
      group = this.groupNamed(groupID)
    }
    // console.log('selection', selection)
    // console.log('group cells', group.cells)
    group.cells = group.cells.union(selection, ['id'])
    // console.log('group cells union', group.cells)
    // group.cells = selection
    // console.log('group cells selection', group.cells)
    // console.log('groupID', group.id)
    if (newGroup) {
      this.groups.push(group)
    } else {

    }
    this.updateCells({ groupID: group.id })
    return group
    // return this
  }
  //METH:
  //FIXME: need to rethink this in regards to find Islands new temp/non-stored use case
  updateCells({ groupID, island } = {}) {
    // console.log(`updating Cells ${groupID}, ${islandID}`)
    if (arguments.length === 0) {
      this.cells.forEach(cell => cell.drawElement())
    }

    let groups, islands
    if (groupID) { groups = [this.groupNamed(groupID)] }
    else { groups = this.groups }
    groups.forEach(group => this.updateGroup(group))

    if (island) {
      islands = [island]
      // console.log(`all islands: `, this.islands)
      console.log(`updateCells: islands found: `, islands)
    }
    else { islands = this.islands }
    islands.forEach(island => this.updateIsland(island))
    // console.log(`islands`, islands)
  }
  //METH:
  updateGroup(group) {
    // console.log(`updating Group ${group.id}`)
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
    // console.log(`updating Island ${island.id}`)
    island.cells.forEach(cell => {
      let thisCell = this.cells[cell.index]
      if (thisCell) {
        thisCell.islandIDs.add(island.id)
        // thisCell.color = island.color
        thisCell.drawElement()
      }
    })
  }
  //METH:
  setAvailability(selection = this.cells, available = false) {
    selection.forEach(cell => cell.available = available)
  }

  setGridAvailability(selection = this.cells, available = false) {
    if (selection.isEmpty) { return }
    selection.forEach(cell => {
      const thisCell = this.cells[cell.index]
      // console.log('thisCell id', thisCell.id)
      // console.log('thisCell groupID', thisCell.groupID)
      // console.log('thisCell available', thisCell.available)
      const thisGroup = this.groupNamed(thisCell.groupID)
      // console.log('thisGroup', thisGroup)
      if (thisGroup) { thisGroup.cells = thisGroup.cells.filter(cell => cell.id !== thisCell.id) }
      thisCell.groupID = -1
      thisCell.available = available
    })
  }
  // #endregion


}

// CLASS: CellGroup
// SIZE: 109 lines
class CellGroup extends ProtoLayer {
  perimeterType
  direction
  grid
  cells = new OpArray
  perimeterIslands = new OpArray // Island-Shapes defining outer boundaries of all Island shapes to be allowed within
  // islands = new OpArray

  constructor(protoParent, svgParent, grid) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      drawSVG: false,
    })
    this.grid = grid
    this._type = 'Group'
    this.finishSetup(S.Groups)
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'group') }
  get testColor() { return protoColor(255, 127, 0, 1) }

  //FIXME: get this implementation of islands to work with update cells and createIslands so the createShapes will work when called by createSubIslands-->createIslands-->createShapes!!! 
  get islands() { return this.perimeterIslands.map(pIsle => pIsle.allSubIslands).flat() }

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
  // MARK: Setup Methods
  // #region Setup Methods
  //METH: createPerimiters() : 
  //FIXME: reimplement for proper minCorners functionality that wroks with both omni and cardinal
  //FIXME: so "omni-min", "omni-max", "cardinal-min", "cardinal-max"
  createPerimiters(perimeterType = `maxCorners`, direction = Direction.Cardinal) {
    // console.log(`createPerimiters this.id`, this.id)
    this.perimeterType = perimeterType
    switch (perimeterType) {
      case 'maxCorners':
        break
      case 'minCorners':
        break
      default:
        this.perimeterType = undefined
        console.error(`${perimeterType} is invalid Perimeter Type`)
    }
    const groupID = this.id
    console.warn(`createPerimiters for:`, groupID)
    console.groupCollapsed(`grid.createIslands`)
    this.perimeterIslands = this.grid.createIslands({
      groupID: this.id,
      direction: direction,
      perimeterType: perimeterType,
      drawFilter: false,
    })

    console.groupEnd()
    console.log(``)
  }
  //METH: createSimpleSubShapes() : 
  //FIXME: finish implementation to make createPerimiters work with min-corners
  createSimpleSubShapes() {
    console.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.perimeterIslands.forEach(pIsles => pIsles.createSimpleSubShapes())
    console.groupEnd()
  }
  //METH: createSubIslands() :
  createSubIslands({ filter, direction = Direction.Cardinal, insetScale = 1 } = {}) {
    console.warn(`${this.id}.createSubIslands, this.islands =`, this.islands.map(i => i.id))
    console.groupCollapsed(`Island.createSubIslands`)
    this.perimeterIslands.forEach(i =>
      i.createSubIslands({
        direction: direction,
        filter: filter,
        insetScale: insetScale,
        // drawFilter: drawFilter,
      }))
    console.groupEnd()
    console.log(``)
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
  cellIsIsolated(cellIndex, direction = Direction.Cardinal) {
    this.grid.cellIsIsolated({ cellIndex: cellIndex, groupID: this.id, direction: direction })
  }
  // #endregion
}

// CLASS: Cell
// SIZE: 145 lines
class Cell extends ProtoLayer {
  grid
  index
  coords
  available
  //TODO: in order to populate inside/over, need to make groupIDs a Set/Array. Need to fix symmetrize first though
  groupID = -1
  islandIDs = new Set()
  islandChecked = false
  // color
  segments

  constructor({ protoParent, svgParent, grid, index, coords, available = true, color = '888' } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      drawSVG: false,
    })
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.available = available
    // this.color = color
    this._type = 'Cell'
    this.finishSetup(S.Cells)
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get boundsRect() { }
  get anchor() { return this.grid.cellAnchor(this.coords.x, this.coords.y) }
  get size() { return this.grid.cellSize }
  get aspect() { return this.size.aspect }
  get minRadius() { return min(this.size.x, this.size.y) / 2 }

  get arcOrigins() { // origins for arcs when rect is given max rounded corners
    let start, end
    if (this.aspect.isSquare) {
      start = this.center
      end = this.center
    }
    if (this.aspect.isPortrait) {
      const x = this.center.x
      const yStart = this.anchor.y + this.minRadius
      const yEnd = this.anchor.y + this.size.y - this.minRadius
      start = vert(x, yStart)
      end = vert(x, yEnd)
    }
    if (this.aspect.isLandscape) {
      const y = this.center.y
      const xStart = this.anchor.x + this.minRadius
      const xEnd = this.anchor.x + this.size.x - this.minRadius
      start = vert(xStart, y)
      end = vert(xEnd, y)
    }
    return { start: start, end: end }
  }

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
  get isInAnIsland() { return this.grid.cellIsInAnIsland(this.index) }                          // UNUSED
  get hasAUTurn() { return this.segments.some(seg => seg.isUTurn) }
  get hasAStair() { return this.segments.some(seg => seg.isStair) }
  get hasACorner() { return this.segments.some(seg => seg.isCorner) }
  get hasAFlat() { return this.segments.some(seg => seg.isFlat) }

  get cardinalNeighbors() { return this.allNeighborsCoords(Direction.Cardinal) }
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
  allNeighborsCoords(direction = Direction.All) {
    return direction.directions.map(dir => this.neighborCoords(dir)).compacted
  }
  //METH:
  validNeighborsCoords(direction = Direction.All, bounds = this.grid.cellBounds,) {
    return this.allNeighborsCoords(direction).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
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
// SIZE: 519 lines
class Island extends ProtoLayer {
  grid
  groupID
  parentIslandID
  cells
  subIslands
  islandLevel
  shapes = new OpArray
  direction
  perimeterType

  constructor({
    cells,
    filter,
    protoParent,
    svgParent,
    grid,
    groupID,
    parentIslandID,
    direction = Direction.Cardinal,
    perimeterType = `maxCorners`,
    stored = true,
    insetScale = 1,
    drawFilter = true,
    allowsProtoErrors = false,
  } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      drawRect: false,
      drawFilter: drawFilter,
      allowsProtoErrors: allowsProtoErrors,
    })
    console.log(`New Island! with arguments:`, arguments[0])
    this.cells = cells
    this._filter = filter
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.perimeterType = perimeterType
    this.parentIslandID = parentIslandID
    this.islandLevel = parentIslandID ? protoParent.islandLevel + 1 : 0 // perimeterIslands should be 0, the rest above
    this._type = parentIslandID ? 'Island' : 'PerimeterIsland'
    if (stored) { this.finishSetup(S.Islands) }
    console.log(`new (${this.type})-type Island completed:`, this)
    console.log(``)
    // this.color = R.random_hash(3, '#')
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'island') }
  get testColor() { return protoColor(255, 230, 0, 1) }

  get allSubIslands() {
    let allSubs = new OpArray

    const collectSubIslands = (island) => {
      if (island.subIslands) {
        island.subIslands.forEach(sub => {
          allSubs.push(sub)
          collectSubIslands(sub)
        })
      }
    }
    collectSubIslands(this)
    return allSubs
  }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.groupID, islandID: this.id }) }
  get cellAnchor() { return this.cellBounds.cellAnchor }
  //TODO: Once inset transitions from filter to geometry will need to refactor
  get insetAnchor() { return this.anchor }
  get insetSize() { return this.size }

  get boundsRect() { return this.cellBounds.boundsRect }

  get cellCount() { return this.cells.length }

  get isSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index, Direction.All))
  }
  get isCardinalSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index))
  }
  get isPill() { return this.cellCount === 2 && this.isCardinal }
  get isOrdinalCapsule() { return this.cellCount === 2 && this.isOrdinal }

  get isHorizontal() {
    return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Vertical))
  }
  get isVertical() {
    return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Horizontal))
  }
  get isLine() { return this.isSingle || this.isHorizontal || this.isVertical }
  get isCardinal() {
    return !this.isSingle
      && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Ordinal))
  }
  get isOrdinal() { return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index)) }

  get isRectangle() { return !this.isLine && this.cellBounds.isFull }
  get isSquare() { return this.isRectangle && this.cellBounds.aspect.name === 'square' }

  get directionHierarchy() { return this.hierarchyFrom(this.direction) }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, islandID: this.id })
  }
  get exposedCorners() {
    return this.grid.allExposedCorners({ selection: this.cells, islandID: this.id })
  }
  //TODO: DEPRECATED
  // get ordinalConnectedCells() {
  //   return this.grid.ordinalConnectedCells({ selection: this.cells, islandID: this.id })
  // }
  // #endregion
  // MARK: Methods
  // #region Methods
  //METH:
  createSubIslands({ filter, direction = Direction.Cardinal, insetScale = 1, drawFilter = true } = {}) {
    console.groupCollapsed(`${this.id} Island.createSubIslands`)
    if (this.subIslands) {
      // recursive dive to create subIslands on the bottom-most (visually top-most) subIslands
      console.error(`Divers go down! This.subIslands = `, this.subIslands.map(i => i.id))
      this.subIslands.forEach(isle =>
        isle.createSubIslands({
          direction: direction,
          filter: filter,
          insetScale: insetScale,
          drawFilter: drawFilter
        })
      )
      console.groupEnd()
      return
    }

    let subIslands
    //FIXME: This appears to not be working at all!
    // create unprotected Island stacks with potential visual errors!!!
    if (this.allowsProtoErrors) {
      subIslands = this.grid.createIslands({
        islandID: this.id,
        direction: direction,
        filter: filter,
        insetScale: insetScale,
        drawFilter: drawFilter,
      })
    } else {
      //MARK: Change new direction
      // protect Island stacking from visual overlapping errors
      if (this.hierarchyFrom(direction) > this.directionHierarchy) { // new direction cannot be greater than current
        console.error(`trying to create SubIslands out of hierarchy. changing direction to "${this.direction.name}"`)
        direction = this.direction // downgrade newDirection to same as current Island
      }
      // ordinal corner connecters visually collapse with inset < 0.75
      if (direction.isAll && insetScale < 0.75) {
        console.error(`trying to create SubIslands with All and inset < 0.75. changing direction to Cardinal`)
        direction = Direction.Cardinal // downgrade newDirection to Cardinal to avoid collapse/overlap 
      }

      //MARK: Process new direction
      // same direction: safest/fastest to copy Island and apply new inset
      if (direction.equals(this.direction)) {
        console.log(`copying island ${this.id}`)
        // copy this island but change inset, set filter, set drawFilter
        const subIsland = this.copy({ insetScale: insetScale, filter: filter, drawFilter: drawFilter })
        // console.log(`created subIsland: `, subIsland)
        subIslands = OpArray.from([subIsland])
      }
      // different direction: requires new island and/or shape creation
      if (this.hierarchyFrom(direction) < this.directionHierarchy) {
        console.warn(`creating ${this.id} subIslands with direction: ${direction.name}`)
        // parent direction is All and new direction is Cardinal: careful reconstruction of current SimpleSubShapes
        if (this.direction.isAll && direction.isCardinal) { //
          console.log(`using copyAllToCardinal()`)
          subIslands = this.copyAllToCardinal(filter, insetScale, drawFilter)
        }
        // parent direction is All/Cardinal: recalculate island cells based on parent shape, then create new islands
        else if (this.directionHierarchy >= 2 && this.hierarchyFrom(direction) < 2) {
          console.log(`  triggering a recalcdCells on ${this.id}`)
          const newCells = this.recalcdCells({ newInsetScale: insetScale })
          subIslands = this.grid.createIslands({ // create new Islands with new direction
            selection: newCells,
            islandID: this.id,
            direction: direction,
            filter: filter,
            insetScale: insetScale,
            drawFilter: drawFilter,
          })
          subIslands?.forEach(i => {
            i.createSimpleSubShapes()            // must create SimpleSubShapes for new Islands
            i.shapes.forEach(shape => {
              console.log(shape.simpleSubShapes)
              this.grid.createCubicCorners(shape.simpleSubShapes)
              shape.drawElement()
            })
          })
        }
      }
    }
    this.subIslands = subIslands
    // this.subIslands.forEach(i => i.drawShapes())
    console.log(`new subIslands: `, subIslands)
    console.groupEnd()
    // console.log(`new subShapes`, subIslands.map(isle => isle.shapes.map(shape => shape)))
  }
  //METH: copy(insetScale) : create copy 
  copy({
    insetScale,
    filter = this.filter,
    drawFilter = this.drawFilter,
    protoParent = this, // do I need this or will all 'copies' produced by this island be children of this island?
    cells = this.cells,
    shapes,
    direction = this.direction,
  } = {}) {
    // console.log(`copying island`, this.id)
    const newIsland = new Island({
      cells: cells,
      filter: filter,
      protoParent: protoParent,
      svgParent: protoParent.svgElt, // Test this!!!
      insetScale: insetScale,
      grid: this.grid,
      groupID: this.groupID,
      parentIslandID: this.id,
      direction: direction,
      perimeterType: this.perimeterType,
      stored: this.stored,
      drawFilter: drawFilter
    })

    if (shapes) {
      newIsland.shapes = shapes
    } else {
      newIsland.shapes = this.shapes.map(s => s.copy({
        insetScale: insetScale,
        protoParent: newIsland,
        island: newIsland,
      }))
    }

    this.grid.updateCells({ island: newIsland })
    // console.log(`newIsland`, newIsland)
    return newIsland
  }
  //METH:
  copyAllToCardinal(filter, insetScale, drawFilter = true) {
    // let newShapeSubShapes = this.shapes
    //   .map(shape => {
    //     const newSubShapes = shape.simpleSubShapes.map(sub => SegPath.cutAllToCardinal(sub))
    //       .flat()
    //     console.log(`newSubShapes: ${newSubShapes.map(sub => sub.map(seg => seg.hasBothCubicVerts))}`)
    //     this.grid.createCubicCorners(newSubShapes)
    //     return newSubShapes
    //   })
    // console.log(`newShapeSubShapes`, newShapeSubShapes)
    //FIXME: might need to scrap this and start over from new Cardinal Islands that are then fitted to their surroundings
    //FIXME: I think the current issue is that new islands have all the old cells and are re-building themselves
    //FIXME: Solution would be to figure out how to find split cells, which is essentially to create new Cardinal Islands
    //FIXME: Feels like creating a reverse wrapper/snuggler might be less complicated
    //FIXME: Actually just pulling cells from new Cardinal Islands, might be the easiest.
    //FIXME: Set stored = false on new Island. Maybe look at grammar/modifier code, like 'outline' for ideas.
    const cellIslands = this.grid.createIslands({
      filter: filter,
      insetScale: insetScale,
      drawFilter: drawFilter,
      selection: this.cells,
      islandID: this.id,
      direction: Direction.Cardinal,
      stored: true,
      createShape: true, // this might NOT be impacting my debug situation - if not please remove on createIslands()
    })
    console.log(`cellIslands`, cellIslands.map(is => is.cells.map(c => c.id)))
    //NOTE: just added this for testing. Should try dropping in newSubShapes from above?
    const parentSimpleSubShapes = this.shapes.map(shape => shape.simpleSubShapes)
    cellIslands?.forEach((isle, i) => isle.shapes.forEach(shape => {
      isle.createSimpleSubShapes()
      // shape.simpleSubShapes = OpArray.from([newShapeSubShapes[0][i]])

      this.grid.inWrapCorners(shape.simpleSubShapes.flat(), parentSimpleSubShapes.flat())
      this.grid.inWrapCorners(shape.simpleSubShapes.flat(), parentSimpleSubShapes.flat(), false)
      this.grid.createCubicCorners(shape.simpleSubShapes)


      console.log(`shape`, shape)
      shape.drawElement()
    }))

    // const newIslands = newShapeSubShapes.map((shapeSubs, i) => {
    //   const newIsland = this.copy({
    //     insetScale: insetScale,
    //     filter: filter,
    //     drawFilter: drawFilter,
    //     cells: cellIslands[i].cells,
    //     direction: Direction.Cardinal,
    //   })
    //   newIsland.shapes = this.shapes.map(s => s.copy({
    //     insetScale: insetScale,
    //     protoParent: newIsland,
    //     island: newIsland,
    //     simpleSubShapes: shapeSubs,
    //   }))
    //   return newIsland
    // })
    // console.warn(`newIslands`, newIslands)
    return cellIslands
  }

  //METH: recalcdCells(shapes, newInsetScale) : 
  //FIXME: need to incorporate loft!!
  //FIXME: absolute should activate previous mode (sub simpleSubShapes for insetSubShapes & no newInsetScale usage)
  //FIXME: maybe also a threshold?
  //FIXME: fix arcRadius calculation to make this work with non-square grid cells
  recalcdCells({
    newInsetScale,
    loft,
    shapes = this.shapes,
    absolute = false,
    padding = 0.2
  } = {}) {
    if (this.perimeterType === 'minCorners' || this.directionHierarchy < 2) { return this.cells }
    if (shapes.every(s => s.simpleSubShapes.isEmpty)) {
      console.error(`cannot recalcdCells because shape has no simpleSubShapes`)
      return this.cells
    }
    console.groupCollapsed(`recalcdCells shapes`, shapes)
    const cellRadius = this.grid.minCellWidth / 2
    // let newCells = this.cells
    let shapeCorners = shapes.flat().map(s => {
      // console.log(`s.simpleSubShapes`, s.simpleSubShapes)
      const corners = s.insetSubShapes.map(sub => {
        console.log(`sub`, sub)
        return sub
          .filter(seg => // filter corners with minimum curvature
            seg.neighbors.start.availableEndLength > cellRadius || seg.availableStartLength > cellRadius
          )
      })
      return corners
    }).flat(2)
    console.log(`shapeCorners`, shapeCorners)
    if (shapeCorners.isEmpty) {
      console.error(`recalcdCells: Cells remain the same!`)
      console.groupEnd()
      return this.cells
    } else {
      let removeCells = new OpArray // cells to remove
      let addCells = new OpArray // cells to add
      shapeCorners.forEach(seg => {
        //FIXME: it appears that arcRadius is not correct
        const isOutsideCorner = seg.turns.start.isRight // isOutsideCorner
        const cornerPos = seg.corners.start // position of normalCorner
        const neighbor = seg.neighbors.start
        //NOTE: arcRadius: only correct if corner is circular arc and cell aspect is square
        //FIXME: try to fix bug when trying to create hierarchy 0/1 subIslands on non-square celled grids 
        //FIXME: issue may be in usage of cell.center as this assumes cells to be square
        const arcRadius = min(seg.availableStartLength, neighbor.availableEndLength)
        const startCorner = neighbor.finalCubicEndVert// startCorner of arc
        const normalCorner = seg.start // normal pointer of arc
        const endCorner = seg.finalCubicStartVert // endCorner of arc
        const origin = Vertex.add(startCorner, segment(normalCorner, endCorner).lineVector)// origin of arc
        const squareVerts = OpArray.from([startCorner, normalCorner, endCorner, origin]).gridVertSorted
        console.log(`squareVerts`, squareVerts)

        const cellOrigin = (cell, remove = true) => {
          // console.warn(`arcOrigins`, cell.arcOrigins)
          if (cell.aspect.isPortrait) {   // isPortrait
            if (remove) {
              return cornerPos.isUp ? cell.arcOrigins.start : cell.arcOrigins.end
            } else {
              return cornerPos.isDown ? cell.arcOrigins.start : cell.arcOrigins.end
            }
          }
          if (cell.aspect.isLandscape) {  // isLandscape
            if (remove) {
              return cornerPos.isLeft ? cell.arcOrigins.start : cell.arcOrigins.end
            } else {
              return cornerPos.isRight ? cell.arcOrigins.start : cell.arcOrigins.end
            }
          }
          return cell.center              // isSquare
        }


        let cornerCells = this.grid.cells.filter(cell => {// find cells within arc square
          const origin = cell.center
          // const origin = cellOrigin(cell)
          // console.log(`${cell.id}: cellCenter: ${cell.center.string}, origin: ${origin.string}, squareVerts: `, [squareVerts[0].string, squareVerts[2].string])
          return origin.x > squareVerts[0].x
            && origin.y > squareVerts[0].y
            && origin.x < squareVerts[3].x
            && origin.y < squareVerts[3].y
        })
        console.log(`cornerCells`, cornerCells.map(c => c.id))



        if (isOutsideCorner) {
          cornerCells.forEach(cell => {
            const length = segment(origin, cellOrigin(cell)).length + cellRadius * (newInsetScale + padding)
            console.log(`rem ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
            if (length > arcRadius) { removeCells.push(cell) }
          })
        } else {
          cornerCells.forEach(cell => {
            const length = segment(origin, cellOrigin(cell, false)).length - cellRadius * (newInsetScale + padding)
            console.log(`add ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
            if (length > arcRadius) { addCells.push(cell) }
          })
        }

      })
      addCells = addCells.unique([`id`]).gridVertSorted
      removeCells = removeCells.unique([`id`]).gridVertSorted
      let newCells = this.cells
        .union(addCells, 'id')
        .exclude(removeCells, 'id')
        .gridVertSorted
      console.log(`this.cells`, this.cells.map(c => c.id))
      console.log(`addCells`, addCells.map(c => c.id))
      console.log(`removeCells`, removeCells.map(c => c.id))
      console.log(`newCells`, newCells.map(c => c.id))
      console.groupEnd()
      return newCells
    }

  }
  //METH: drawShapes()
  drawShapes() {
    this.shapes.forEach(s => s.drawElement())
  }
  //METH: createShape()
  createShape(insetScale) {
    console.log(`createShape for ${this.id}, insetScale`, insetScale)
    let segments = OpArray.format(this.exposedSegments)
    console.log(`segments`, segments)
    let subShapes = new OpArray
    let shapeIter = 0
    let subShapeIter = 0

    //ARROW: findShape(seg) : find each shape within an island
    const findShape = () => {
      let subShape
      while (segments.length > 0) {
        shapeIter += 1
        let segment = segments[0]
        subShape = new OpArray
        let fillstack = []

        //ARROW: findSubShape(seg) : find each subShape within a shape
        const findSubShape = (seg) => {
          fillstack.push(seg)

          while (fillstack.length > 0) {
            subShapeIter += 1
            let thisSeg = fillstack.pop()
            let nextSeg
            //find next segments (could be 2 if allowing ordinal island connections)
            let next = segments
              .filter(s => thisSeg.end.equals(s.start, 4))
              .compacted
            if (next.length === 0) {
              if (thisSeg.end.equals(subShape[0].start, 4)) {
                thisSeg.assignNeighbors({ end: subShape[0] })
                subShape[0].assignNeighbors({ start: thisSeg })
                subShape.push(thisSeg)
                return
              } else {
                console.log('thisSeg.end', thisSeg.end)
                console.log('subShape[0].start', subShape[0].start)
                console.error('cannot continue segmentShape')
              }
            }

            if (next.length === 1) { nextSeg = next[0] }
            if (next.length === 2) {
              console.error('next has 2 segments')
              let nextDirection
              if (this.direction.someAreOrdinal) {
                // console.log(`this.direction.someAreOrdinal`)
                nextDirection = thisSeg.direction.previous(2)
              } else {
                // console.log(`!this.direction.someAreOrdinal`)
                nextDirection = thisSeg.direction.next(2)
              }
              nextSeg = next.find(e => e.direction.equals(nextDirection))
              // console.log(`thisSeg here`, thisSeg)
              // console.log(`nextSeg here`, nextSeg)
              if (nextSeg === undefined) { console.error('unexpected 2nd segment') }
            }
            // console.log(``)
            // console.log(this.grid.groups)
            // console.log(this.id)
            // console.group(`testgroup`)
            // console.log(`subShape ${this.id} iter ${subShapeIter}`, segments)
            // console.log(`thisSeg`, thisSeg)
            // console.log(`nextSeg`, nextSeg)
            // console.groupEnd()
            thisSeg.assignNeighbors({ end: nextSeg })
            nextSeg.assignNeighbors({ start: thisSeg })
            fillstack.push(nextSeg)
            subShape.push(thisSeg)
            segments = segments.exclude(subShape, ['id'])
          }
        }

        findSubShape(segment)
        segments = segments.exclude(subShape, ['id'])
        subShapes.push(subShape)
        if (subShapes.length === 1) { // re-sort inner subshapes for counter-clockwise processing
          segments = segments
            //FIXME: test .counterGridVertSorted now that Segments have x and y, then remove custom sort below
            // .counterGridVertSorted
            .sort((a, b) => a.start.y - b.start.y || b.start.x - a.start.x) // sort by y, -x 
        }

      }
    }

    findShape(this.direction)
    let thisShape = new Shape({
      subShapes: subShapes,
      protoParent: this,
      svgParent: this.svgParent,
      island: this,
      insetScale: insetScale
    })
    // this.shape = thisShape
    this.shapes.push(thisShape)
    // this.drawElement()
    // print(`END Shape Test`)
  }
  //METH: hierarchyFrom(direction) : hierarchy weight used to prevent overlaps in island stacks
  hierarchyFrom(direction) {
    if (direction.isAll) { return 3 }
    if (direction.isCardinal) { return 2 }
    if (direction.isTwoOpposites) { return 1 }
    if (direction.isNone) { return 0 }
    console.error('Undefined directionHierachy')
  }
  //METH: createSimpleSubShapes(minCorners) : direct all shapes to createSimpleSubShapes 
  createSimpleSubShapes() {
    console.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.shapes.forEach(s => s.createSimpleSubShapes())
    console.groupEnd()
  }
  //METH:
  cellIsIsolated(cellIndex, direction = Direction.Cardinal) {
    return this.grid.cellIsIsolated({ cellIndex: cellIndex, islandID: this.id, direction: direction })
  }
  //METH:
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }
  // #endregion

  // MARK: TODO Methods
  // #region TODO Methods
  //TODO: Finish Intergrids after submission
  interGridClosure = (cell) => { this.grid.validNeighbors({ selection: [cell], bounds: this.cellBounds, direction: Direction.Cartesian }).length === 3 }
  get canHaveInterGrid() {
    return this.grid.shrunkSelection(this.cells).length > 0
    // let cells = this.grid.shrunkSelection(this.cells)
    // return cells.some(cell => interGridClosure(cell))
  }

  //METH:
  createInterGrid() {
    if (!this.canHaveInterGrid) { return }
    const shrunk = this.grid.shrunkSelection(this.cells) // create shrunk selection
    const cellBounds = this.grid.cellBounds({ shrunk: shrunk }) // get cellBounds of shrunk
    const insetScale = this.insetAmountToScale(this.grid.cellSize) // new insetScale based upon 1 less row and column
    const interGrid = new Grid(this.island, { x: cellBounds.columnCount, y: cellBounds.rowCount }, insetScale)
    interGrid.setAvailability() // sets all cells to 'taken'
    //FIXME: cell mapping needs to take offset into account!
    const interCells = shrunk //map shrunk selection to selection of cells within new interGrid 
      .map(cell => cell.coords) // get shrunk coords
      // apply anchor/offset here???
      .map(coords => interGrid.cellAtCoords(coords))
    interGrid.setAvailability(interCells, true)
    // FIXME: interGrid should get assigned to a new 'this.interGrid' property. This should probably be on be on ProtoLayer???
  }
  // #endregion
}

// CLASS: Shape
// SIZE: 314 lines
class Shape extends ProtoLayer {
  island
  subShapes
  simpleSubShapes
  testVerts
  testColor

  constructor({
    subShapes,
    simpleSubShapes,
    protoParent,
    svgParent,
    island,
    insetScale
  } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      drawFilter: protoParent.drawFilter,
    })
    this.subShapes = subShapes ? subShapes : new OpArray
    this.simpleSubShapes = simpleSubShapes ? simpleSubShapes : new OpArray
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.assignSegments()
    this._type = protoParent.type === `Island` ? 'Shape' : `PerimeterShape`
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

  //MARK: SubShape Transforms
  //NOTE: the order of transforms: subShapes-->simpleSubshapes-->insetSubShapes can be rearranged
  //NOTE: simple first: inset transform is expensive, so better to call at end as allSimpleSubShapes is called a lot!
  //NOTE: inset first: 1. possibility of knowing that opposite-walled cells will disappear at insetScale === 0
  //NOTE: inset first: 2. might be some hierarchical or derivative scaling advantage to successive inset knowledge
  //NOTE: ultimately both have advantages. could make inset transform a method with two inset compProps: sub & simpleSub
  // get simpleSubShapes() {
  //   return this.subShapes?.map(sub =>
  //     SegPath.refine(sub, this.id, this.island.perimeterType === 'minCorners')
  //   )
  // }

  get insetSubShapes() {
    const subs = this.simpleSubShapes
    console.log(`subs`, subs)
    let insetSubShapes = subs?.map(sub => {
      let insetSubShape = new OpArray
      let prevInsetSeg

      sub.forEach((seg, i) => {
        let newInsetSeg = seg.insetCopy(this.insetScale, this.grid.minCellWidth) //create inset segment

        if (prevInsetSeg) { // only assignNeighbors once there are two inset segments
          prevInsetSeg.assignNeighbors({ end: newInsetSeg })
          newInsetSeg.assignNeighbors({ start: prevInsetSeg })
        }
        if (i === sub.lastIndex) { // last inset segment is neghbors with first inset segment
          newInsetSeg.assignNeighbors({ end: insetSubShape[0] })
          insetSubShape[0].assignNeighbors({ start: newInsetSeg })
        }
        insetSubShape.push(newInsetSeg)
        prevInsetSeg = newInsetSeg
      })
      return insetSubShape
    })
    return insetSubShapes
  }

  //MARK: SVG Paths
  get svg() {
    let result = this.insetSubShapes.map(e => SVGPath.fromProtoSegPath({
      segPath: e,
      cornerMin: min(this.insetSize.x / 2, this.insetSize.y / 2)
    }))
    if (result instanceof Array) {
      result = result.join(' ')
    }
    return result
  }

  get svgPath() { return `path('${this.svg}')` }

  get perimeter() {
    let result = this.subShapes.map(e =>
      SVGPath.fromSegPath({ segPath: e, refine: false, straightness: 1 })
    )
    if (result instanceof Array) {
      result = result.join(' ')
    }
    return result
  }
  get perimeterPath() { return `path('${this.perimeter}')` }

  get insetSVG() {
    let result = this.insetSubShapes.map(e =>
      SVGPath.fromSegPath({ segPath: e, refine: false, straightness: 0 })
    )
    if (result instanceof Array) {
      result = result.join(' ')
    }
    return result
  }
  get insetSVGPath() { return `path('${this.insetSVG}')` }

  get finalSVG() {
    let result = this.simpleSubShapes.map(e =>
      SVGPath.fromSegPath({ segPath: e, refine: false, straightness: 0 })
    )
    if (result instanceof Array) {
      result = result.join(' ')
    }
    return result
  }

  get extractedVerts() { return extractVerts(this.svg) }

  // MARK: methods
  // #region methods
  //METH: : create initial SimpleSubShapes with minCorners to be refined by nestleShapes
  createSimpleSubShapes() {
    console.warn(`${this.id}.createSimpleSubShapes called!!!`)
    this.simpleSubShapes = this.subShapes.map(sub =>
      SegPath.refine(sub, this.id, this.island.perimeterType === 'minCorners')
    )
    // this.drawElement()
    // console.log(`${this.id} simpleSubShapes`, this.simpleSubShapes)
  }
  //METH:
  assignSegments() {
    this.cells.forEach(cell => {
      const cellID = cell.id
      const segs = this.allSegments.filter(s => s.parentID === cellID)
      cell.segments = segs
    })
  }
  //METH:
  copy({
    insetScale,
    protoParent,
    island,
    simpleSubShapes = this.simpleSubShapes,
  } = {}) {
    const newShape = new Shape({
      // subShapes: this.subShapes.map(sub => sub.map(seg => seg.copy)),
      // finalSubShapes: this.finalSubShapes,
      simpleSubShapes: simpleSubShapes,
      protoParent: protoParent,
      svgParent: protoParent.svgParent,
      island: island,
      insetScale: insetScale,
    })
    return newShape
  }
  // #endregion

  // MARK: Setup Methods
  // #region Setup Methods
  //METH: 
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    // console.log(`created new shape`, this.id)
    // this.createSimpleSubShapes()
    console.warn(`${this.id}.drawElement`)
    this.drawElement()
  }
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
    console.group()
    console.error('drawElement: ', this.id, this)
    // console.log(`simpleSubShapes`, this.simpleSubShapes[0])
    // console.log(`simpleSubShape hasCubicVerts?`, this.simpleSubShapes[0]?.map(seg => seg.hasBothCubicVerts))
    // console.log(this.simpleSubShapes[0]?.map(seg => seg.string))
    // console.log(`cubicStart`, this.simpleSubShapes[0]?.map(seg => seg.closestCubicStartVert?.string))
    // console.log(`cubicEnd`, this.simpleSubShapes[0]?.map(seg => seg.closestCubicEndVert?.string))

    const path = createSVGElt('path')
    // console.log(this.filter.id)

    path
      .attribute('d', this.svg)
      .parent(this.svgElt)
      .addToClassList(this.id)
      .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)

    if (this.drawFilter) {
      if (S.Effects.db[0][1]) {
        let maxWidthDivisor = 20
        // if (this.island.isSingle || this.island.isVertical || this.island.isHorizontal) { maxWidthDivisor = 1.25 }
        let strokeMaskWidth = R.random_num(0, this.grid.cellSize.x / maxWidthDivisor)
        strokeMaskWidth = this.grid.cellSize.x / maxWidthDivisor

        // console.log('shape insetScale', this.insetScale)
        const insetScaleX = this.insetScale.x
        const posInset = insetScaleX >= 0
        strokeMaskWidth = 1 * (posInset ? 1 - insetScaleX : insetScaleX) * this.grid.cellSize.x
        // strokeMaskWidth = -.6 * this.grid.cellSize.x
        // console.log('insetScaleX', insetScaleX)
        // console.log('strokeMaskWidth', strokeMaskWidth)
        // console.log('cellSize', this.grid.cellSize.x)
        // const posStrokeMask = strokeMaskWidth >= 0

        path
          .attribute('fill', protoColor(230))
          .attribute('fill-opacity', 1)
          // .attribute('fill', protoColor(255))
          // .applyStrokeMask(posInset ? 'black' : 'white', strokeMaskWidth)
          .applyFilter(this.filter, 2)
      }
    } else {
      this.drawPerimeterDeBug = false
      if (this.drawPerimeterDeBug) {
        const randHue = ProtoColor.randomShadHue()
        const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
        path
          .attribute('d', this.perimeter)
          .attribute('fill', protoColor(0, 0))
          .attribute('stroke', randHue)
          .attribute('stroke-width', `.125`)
          .attribute('stroke-dasharray', `4 1`)
      } else {
        path
          .attribute('d', this.perimeter)
          .attribute('fill', protoColor(0, 0))
      }
    }
    this.drawInsetDeBug = false
    if (this.drawInsetDeBug && this.drawFilter) {
      const insetPath = createSVGElt('path')
      insetPath
        .parent(this.svgElt)
        .addToClassList(this.id)
        .addToClassList(this.svgParent.elt.classList.value)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)

      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 256)
      insetPath
        .attribute('d', this.insetSVG)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.25`)
        .attribute('stroke-dasharray', `1 1`)
    }
    this.drawShapeLabelDeBug = false
    if (this.drawShapeLabelDeBug) {
      const label = createSVGText(this.id, 0, 0)
      const isShape = this.type !== `Shape`
      const offset = isShape ? vert(1, 4) : vert(1, 8)
      const font = isShape ? `bold 3px sans-serif` : `3px sans-serif`
      label
        .parent(this.svgElt)
        .addToClassList(this.id)
        .addToClassList(this.svgParent.elt.classList.value)
        .layout(this.anchor.x + offset.x, this.anchor.y + offset.y, this.size.x, this.size.y)
        .style(`font`, font)
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
    console.groupEnd()
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


