// MARK:
// MARK: INITIALIZATION
// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: ProtoLayer SuperClass

// CLASS: ProtoLayer
class ProtoLayer {
  protoParent // ProtoLayer
  _type
  _insetScale
  _filter
  _filterLoft
  svgParent // 'SVG' p5.Element
  svgElt
  rect // 'rect' p5.Element
  drawSVG
  drawRect
  drawFilter

  constructor({
    protoParent,
    svgParent,
    insetScale,
    filter,
    drawSVG = true,
    drawRect = false,
    drawFilter = true,
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
    this.assignUID()
  }

  // MARK: View Properties
  // #region View Properties

  get type() { return this._type }
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
    console.log('ProtoLayer insetScale', this.insetScale)
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
    const radius = corners.upLeft.x + padding.x
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
    if (!direction.isOrdinal || !direction.isSingle) { console.error('direction must be single Ordinal') }
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
  // TODO: DEPRECATE old implementation
  // quadrant(direction) {
  //   console.log('')
  //   if (!direction.isOrdinal || !direction.isSingle) { console.error('direction must be single Ordinal') }
  //   if (this.rowCount < 2 || this.columnCount < 2) { console.error('this grid is too small to get a quadrant') }
  //   let start, end
  //   let evenMid = {}
  //   let oddMid = {}
  //   const vect = this.cellBoundsSize
  //   //TODO: FINISH this implementation!
  //   if (vect.x % 2 === 0) { evenMid.x = vect.x / 2 }
  //   else { oddMid.x = floor(vect.x / 2) }
  //   if (vect.y % 2 === 0) { evenMid.y = vect.y / 2 }
  //   else { oddMid.y = floor(vect.y / 2) }
  //   const [first, last] = this.spanCellIndices

  //   switch (direction.vals[0]) {
  //     case 0.5://upRight
  //       start = this.grid.index(evenMid.x ? evenMid.x : oddMid.x + 1, 0)
  //       end = this.grid.index(this.xCellMax, evenMid.y ? evenMid.y - 1 : oddMid.y - 1)
  //       break
  //     case 1.5://downRight
  //       start = this.grid.index(evenMid.x ? evenMid.x : oddMid.x + 1, evenMid.y ? evenMid.y : oddMid.y + 1)
  //       end = last
  //       break
  //     case 2.5://downLeft
  //       start = this.grid.index(0, evenMid.y ? evenMid.y : oddMid.y + 1)
  //       end = this.grid.index(evenMid.x ? evenMid.x - 1 : oddMid.x - 1, this.yCellMax)
  //       break
  //     case 3.5://upLeft
  //       start = first
  //       end = this.grid.index(evenMid.x ? evenMid.x - 1 : oddMid.x - 1, evenMid.y ? evenMid.y - 1 : oddMid.y - 1)
  //   }
  //   return this.grid.cellSpanRowsBetween(start, end)
  // }
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

// CLASS: Grid
class Grid extends ProtoLayer {
  gridSize
  cellRows
  cellRowsPref
  groups = new OpArray
  islands = new OpArray

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
  get minCellWidth() { return min(this.cellSize.x, this.cellSize.y) }
  get cells() { return this.cellRows.flat() }
  get cellColumns() { return this.cellRowsFlipped() }
  get availableCells() { return this.cells.filter(cell => cell.available) }
  get takenCells() { return this.cells.filter(cell => cell.taken) }
  get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }
  get isFull() { return this.availableCells.length === 0 }
  get biggestGroup() {
    return this.groups.reduce((max, grp) => {
      if (grp.cells.length > max.cells.length) { return grp }
      else { return max }
    })
  }
  // get islands() { return this.groups.map(g => g.islands).flat() }
  get lastGroup() { return this.groups.last() }
  // FIXME: need to reconfigure the formation of perimeters before this will work properly
  // NOTE: because currently D.None/Hor/Vert makes many islands instead of 1
  get allSimpleSubShapes() {
    return this.groups
      .map(g => g.perimeterIslands).flat()
    // .map(s => s.simpleSubShapes).flat()
  }
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
  cellIsInAnIsland(cellIndex) {
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
      const adj = OpArray.from(e.adjacents.directions)
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
  //FIXME: this method doesn't work, fix or deprecate if unnecessary
  //METH: ensure a selection is 2D array
  ensure2D(selection) {
    if (selection.is2d) {
      return selection
    } else {
      return this.toCellRows(selection)
    }
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
  findIslands({
    selection,
    bounds = this.cellBounds(),
    groupID,
    islandID,
    filter,
    direction = Direction.Cardinal,
    perimeterType = `maxCorners`,
    taken = true,
    stored = true,
    insetScale = 1,
    drawFilter = true,
  } = {}) {
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
        // console.log(`2nd if: group ${groupID} should have filter set to filter ${filter.id}`)
        group?.setFilter(filter)
      }
      if (islandID) {
        island = this.islandNamed(islandID)
        cells = island?.cells || OpArray.empty
        island?.setFilter(filter)
        group?.setFilter(filter)
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
        perimeterType: perimeterType,
        stored: stored,
        drawFilter: drawFilter,
      })
      if (stored) {
        island.setFilter(filter)
        // this.islands.push(island)
        if (group) { group.islands.push(island) }
      }
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
    //FIXME: filter Islands the isPerimeter === false, only creating shapes for non-perimeters
    tempIslands.forEach(e => e.createShape())
    return tempIslands
    // }
  }
  // #endregion
  // MARK: Shape Methods
  // #region Shape Methods
  //METH:
  createSimpleSubShapes() { this.islands.forEach(i => i.createSimpleSubShapes()) }
  //METH:
  customizeShapes(diagonals = false) {
    // let shapes = this.islands
    //   .sort((a, b) => a.cells.length - b.cells.length)
    //   .map(isle => isle.shape)

    // shapes.forEach(shape => {
    //   const isle = shape.island

    //   shape.assignCornerVerts()
    //   if (isle.isRectangle) {
    //     shape.assignRectangleVerts()
    //     console.log('Neighbor Segs', shape.cells.map(cell => cell.neighborSegments))
    //     return
    //   }
    //   shape.assignUTurnVerts()
    //   shape.assignSingleStepVerts()
    // })
    // console.log('shape sizes', shapes.map(e => e.cells.length))
    // console.log('shapes', shapes)
    // console.log('shapes verts', shapes.map(e => e.assignedVerts).flat()) 
    // console.log('shapes parts', shapes.map(e => e.parts).flat())




    // SEGMENT LENGTH BASED //
    // assign EdgeParts in every island
    // sort allSegments into groups: (uTurns, stairs, flatsAndCorners)
    // Simplify all segments in 'flatsAndCorners' to corners only/straight segments

    const shapeCells = this.cellsInAnIsland
    console.log(`shapeCells`, shapeCells)

    let allSegments = shapeCells.map(cell => cell.segments).flat()
    console.log(`allSegments`, allSegments.map(s => s.id))
    let uTurnSegs = allSegments.filter(seg => seg.isUTurn)
    // console.log(`uTurnSegs`, uTurnSegs.map(c => c.id))
    let stepSegs = allSegments.filter(seg => seg.isStep)
    // console.log(`stepSegs`, stepSegs.map(c => c.id))


    let cornerSegs = allSegments.filter(seg => seg.isCorner)
    // console.log(`cornerSegs`, cornerSegs.map(c => c.id))
    let flatSegs = allSegments.filter(seg => seg.isFlat)
    // console.log(`flatSegs`, flatSegs.map(c => c.id))

    let madeSegs = new OpArray
    const saveSegs = (segs) => { madeSegs = madeSegs.union(segs, ['id']) }

    const remove = (segs) => {
      allSegments = allSegments.exclude(segs, 'id')
    }

    //FIXME: implement neighbors use, minCorners should set 'shared' segments but not 'neighbor' segments
    const assignMids = (segs, edgeType, assignNeighbors = true) => {
      segs.forEach(seg => {
        seg.assignMid()
        let startNeighbor
        let endNeighbor
        if (assignNeighbors) {
          startNeighbor = allSegments.find(s => s.end.equals(seg.start) && s.islandIDs.equals(seg.islandIDs))
          if (startNeighbor) { startNeighbor.assignMid() }
          endNeighbor = allSegments.find(s => s.start.equals(seg.end) && s.islandIDs.equals(seg.islandIDs))
          if (endNeighbor) { endNeighbor.assignMid() }
        }
        const shared = allSegments.find(s => s.equals(seg.opposite))
        if (shared?.hasInsideTurn) {
          // console.log(`000000 ${seg.id} shared ${shared.id}`, shared)
          // console.log(`000000 shared has inside turn`, seg.id, shared.id)
          shared.assignMid()
        }
        // remove(OpArray.from([seg, startNeighbor, endNeighbor, shared]).compacted)
        saveSegs(OpArray.from([seg, startNeighbor, endNeighbor, shared]).compacted)
        segs = allSegments.filter(seg => seg.part.isBaseType(edgeType))
        console.log(`allSegments`, allSegments.length)
      })
    }

    assignMids(uTurnSegs, 'UTurn')
    assignMids(stepSegs, 'Step')

    if (this.groups.some(g => g.perimeterType === 'minCorners')) {
      // console.log(`there is a minCorners Group`)
      let minCornerSegs = this.groups
        .filter(g => g.perimeterType === 'minCorners')
        .map(g => g.perimeterIslands).flat()
        .map(isl => isl.cells).flat()
        .map(cell => cell.segments).flat()
        .filter(seg => seg.isCorner)
        // console.log(`minCornerSegs`, minCornerSegs.map(c => c.id))
        // minCornerSegs = minCornerSegs.exclude(madeSegs, ['id'])
        .exclude(madeSegs, ['id'])
      // console.log(`madeSegs`, madeSegs.map(c => c.id))
      // console.log(`minCornerSegs`, minCornerSegs.map(c => c.id)
      assignMids(minCornerSegs, 'Corner', false)
    }
    // else { console.log(`there is NOT a minCorners Group`) }

    this.createSimpleSubShapes()



    console.log(`allSegments`, allSegments)

    // LOOP:
    // filter simpleSegments to incomplete(computed) only 
    // sort allSegments by availableLength(computed), shortest to longest
    // for each segment:
    // // find sharedSegment
    // // find neighborSegments
    // // for each unassigned controlVertex: 
    // // if uTurn, follow uTurn rules
    // // if stair, follow stair rules
    // // else:
    // // // on segment: assign lineStart/lineEnd vertex at availableLength from vertex
    // // // // on sharedSegment: assign lineStart/lineEnd vertex at availableLength from vertex
    // // // on neighborSegment: assign lineStart/lineEnd vertex at availableLength from vertex
    // // // // on sharedSegment: assign lineStart/lineEnd vertex at availableLength from vertex
    // 
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
    console.log('Grid setInsetScale', scale)
    super.setInsetScale(scale)
    console.log('Grid insetScale', this.insetScale)
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
  randGroup(amount) { this.assignCells(this.availableCells.randReduce(amount)) }
  //METH:
  randomSelection(amount, selection = this.availableCells) { return selection.copy.randReduce(amount) }
  //METH:
  groupAvail() { this.assignCells(this.availableCells) }

  //METH:
  randomComb({
    selection = this.availableCells,
    keepRange = range(2, 7),
    dropRange = range(2, 7),
    start = 0
  } = {}) {
    const reduced = selection.randCombReduce({ keepRange: keepRange, dropRange: dropRange, start: start, })
    this.assignCells(reduced)
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
  rects(coverage, aspects) {

  }
  //METH:
  squares({ coverage, direction = Direction.DownRight, minSize = 1, uniform = false, overlapping = true } = {}) {
    // console.log('columnCount', this.columnCount)
    let maxSize // allowable max square based on 'Square and Rect Generation' study
    switch (this.columnCount) {
      case 5:
      case 6:
        maxSize = 3
        break
      case 7:
        maxSize = 4
        break
      case 8:
      case 9:
        maxSize = 5
        break
      case 10:
        maxSize = 6
        break
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

    this.assignCells(selection)

    //create new group and assign collected squares to it
    // const group = new CellGroup(this, this.svgElt, this)
    // this.assignCells(selection, group)
    // }
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
    newGroup = true } = {}) {
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
        const outline = this.validNeighbors({ selection: selection, directions: direction.directions })
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
        const outline = this.validNeighbors({ selection: selection, directions: direction.directions })
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
    const directions = direction.directions
    let inlineEdges = new OpArray //store edge rows/columns/corners that can't be outlined, to be inlined
    directions.forEach(dir => {
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
    if (!direction.isCardinal && direction.vals.length % 2 !== 0) { console.error('only Hor, Vert, and Cardinal allowed') }
    const isQuad = direction.equals(Direction.Cardinal) // Horizontal/Vertical = HALF, Cardinal = QUAD
    console.log('isQuad', isQuad)
    if (!selection.is2D) { selection = this.toCellRows(selection) }
    // selection = this.ensure2D(selection) // ensure selection is 2D
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
  assignGroupPerimeter(groupID, perimeterType) {
    const group = this.groupNamed(groupID)
    if (!group) { console.error(`groupID ${groupID} is invalid`) }
    group.findPerimiters(perimeterType)
  }
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
  //METH:
  setAvailability(selection = this.cells, available = false) {
    selection.forEach(cell => cell.available = available)
  }

  setGridAvailability(selection = this.cells, available = false) {
    if (selection.isEmpty) { return }
    selection.forEach(cell => {
      const thisCell = this.cells[cell.index]
      console.log('thisCell id', thisCell.id)
      console.log('thisCell groupID', thisCell.groupID)
      console.log('thisCell available', thisCell.available)
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
class CellGroup extends ProtoLayer {
  perimeterType
  direction
  grid
  cells = new OpArray
  perimeterIslands // Island-Shapes defining outer boundaries of all Island shapes to be allowed within
  islands = new OpArray

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
  //METH:
  //FIXME: finish implementation to make findPerimiters work with min-corners
  createSimpleSubShapes(minCorners = false) { }
  //METH:
  findIslands({ direction, filter, insetScale = 1, drawFilter } = {}) {
    return this.grid.findIslands({
      groupID: this.id,
      direction: direction,
      filter: filter,
      insetScale: insetScale,
      drawFilter: drawFilter,
    })
  }
  //METH:
  //FIXME: reimplement for proper minCorners functionality that wroks with both omni and cardinal
  //FIXME: so "omni-min", "omni-max", "cardinal-min", "cardinal-max"
  findPerimiters(perimeterType = `maxCorners`, direction = Direction.Cardinal) {
    console.log(`findPerimiters this.id`, this.id)
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
    console.log(`findPerimiters groupID`, groupID)
    this.perimeterIslands = this.findIslands({
      direction: direction,
      perimeterType: perimeterType,
      drawFilter: false,
    })
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
    if (isHorizontal(direction) && this.columnCount - distance < 1) {
      return
    }
    if (!isHorizontal(direction) && this.rowCount - distance < 1) {
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
  get isInAnIsland() { return this.grid.cellIsInAnIsland(this.index) }
  get hasAUTurn() { return this.segments.some(seg => seg.isUTurn) }
  get hasAStep() { return this.segments.some(seg => seg.isStep) }
  get hasACorner() { return this.segments.some(seg => seg.isCorner) }
  get hasAFlat() { return this.segments.some(seg => seg.isFlat) }

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
  shapes = new OpArray
  direction
  perimeterType

  constructor({
    cells,
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
  } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      drawRect: false,
      drawFilter: drawFilter,
    })
    this.cells = cells
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.perimeterType = perimeterType
    this.parentIslandID = parentIslandID
    this._type = 'Island'
    if (stored) { this.finishSetup(S.Islands) }
    // console.log('new Island', cells.map(e => e.id))
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
    // console.log('createShape insetScale', insetScale)
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
    // this.shape = thisShape
    this.shapes.push(thisShape)

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

        // console.error(`END SUBSHAPE ${shapeIter}`)
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
  createSimpleSubShapes(minCorners = false) { this.shapes.forEach(s => s.createSimpleSubShapes(minCorners)) }
  //METH:
  cellIsIsolated(cellIndex, directions = Direction.Cardinal.directions) {
    return this.grid.cellIsIsolated({ cellIndex: cellIndex, islandID: this.id, directions: directions })
  }
  //METH:
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }
  // #endregion
  // MARK: TODO Methods
  // #region TODO Methods
  //TODO: Finish Intergrids after submission
  interGridClosure = (cell) => { this.grid.validNeighbors([cell], this.cellBounds, Direction.Cartesian).length === 3 }
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
  simpleSubShapes
  finalSubShapes

  testVerts
  testColor

  constructor({
    subShapes,
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
    this.subShapes = subShapes
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.createParts(subShapes)
    this.assignSegments()
    this._type = 'Shape'
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
  createParts(subShapes) {
    let turns = new OpArray
    let parts = new OpArray
    subShapes.forEach(shape => {
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
  createSimpleSubShapes(minCorners = false) {
    this.simpleSubShapes = this.subShapes.map(
      subShape => ProtoSVG.refineProtoSegmentPath(subShape, this.id, minCorners)
    )
    console.log(`${this.id} simpleSubShapes`, this.simpleSubShapes)
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
  // TODO: DEPRECATE
  // #region Vert Assignment Methods
  //METH:
  assignCornerVerts() { this.allSegments.forEach(seg => seg.assignCornerVerts()) }
  //METH:
  // assignUTurnVerts() {
  //   console.log("assignUTurnVerts called")
  //   this.subShapes.forEach(sub => sub.forEach((seg, i) => {
  //     const loop = range(0, sub.lastIndex)
  //     const prev = sub[loop.cycle(i - 1)]
  //     const next = sub[loop.cycle(i + 1)]
  //     if (seg.isUTurn) {
  //       prev.assignVert('mid')
  //       seg.assignVert('mid')
  //       next.assignVert('mid')
  //     }
  //   }))
  // }
  //METH:
  // assignSingleStepVerts() {
  //   console.log("assignSingleStepVerts called")
  //   this.subShapes.forEach(sub => sub.forEach((seg, i) => {
  //     // console.log('try assignSingleStep')
  //     const loop = range(0, sub.lastIndex)
  //     const prev = sub[loop.cycle(i - 1)]
  //     const next = sub[loop.cycle(i + 1)]
  //     // console.log([prev, seg, next].map(e => e.part.value))
  //     // case covers 1 or 2 consequetive steps
  //     if (seg.isStep && !next.isStep) {
  //       // console.log('found single step')
  //       prev.assignVert('mid')
  //       seg.assignVert('mid')
  //       next.assignVert('mid')
  //     }
  //   }))
  // }
  //METH:
  // assignRectangleVerts() {
  //   console.log("assignRectangleVerts called")
  //   const bounds = this.cellBounds
  //   const aspect = bounds.aspect
  //   const width = bounds.columnCount
  //   const height = bounds.rowCount
  //   let offsetLength, length, offset
  //   let prevLength = 0

  //   if (aspect.value === 2) { offsetLength = height } // landscape
  //   else { offsetLength = width } // square/portrait

  //   for (let i = 0; i < 4; i++) {
  //     if (i % 2 === 0) { length = width } // top/bottom 
  //     else { length = height } // left/right

  //     if (offsetLength % 2 === 0) { // even number of cells
  //       offset = offsetLength / 2 - 1
  //       this.subShapes[0][prevLength + offset].assignVert('end')
  //       this.subShapes[0][prevLength + length - offset - 1].assignVert('start')
  //     } else { // odd number of cells
  //       offset = (offsetLength - 1) / 2
  //       this.subShapes[0][prevLength + offset].assignVert('mid')
  //       this.subShapes[0][prevLength + length - offset - 1].assignVert('mid')
  //     }
  //     prevLength += length
  //   }
  // }
  //METH:
  // assignSquareVerts() {
  //   const width = this.cellBounds.columnCount
  //   // console.log(`square width = ${width}`)
  //   if (width % 2 === 0) {
  //     const offset = width / 2 - 1
  //     for (let i = 0; i < 4; i++) {
  //       this.subShapes[0][width * i + offset].assignVert('end')
  //       this.subShapes[0][width * (i + 1) - offset - 1].assignVert('start')
  //     }
  //   }
  //   if (width % 2 === 1) {
  //     const offset = (width - 1) / 2
  //     for (let i = 0; i < 4; i++) {
  //       this.subShapes[0][width * i + offset].assignVert('mid')
  //     }
  //   }
  // }
  // #endregion
  // MARK: Setup Methods
  // #region Setup Methods
  //METH: 
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    // this.createSimpleSubShapes()
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
    const path = createSVGElt('path')
    // console.log(this.filter.id)
    if (this.drawFilter) {
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
          // .attribute('stroke', protoColor(230))
          // .attribute('stroke-opacity', 1)
          // .attribute('stroke-width', '7')
          .attribute('fill', protoColor(255))
          .applyStrokeMask(posInset ? 'black' : 'white', strokeMaskWidth)
          // .applyStrokeMask(protoColor(128), strokeMaskWidth)
          // .applyFilter(S.Effects.db[0][1], 3)
          .applyFilter(this.filter, 2)
      }
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


