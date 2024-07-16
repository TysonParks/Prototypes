// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: PROTOLAYER CLASS
// CLASS: ProtoLayer
// SIZE: 237 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
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

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true
  }

  // MARK: View Properties
  // #region 

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

  get cornerRadius() { return 2 }

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

  // MARK: Memoized Properties
  // #region 
  //MEMO: parentID
  get parentID() {
    return memoize(() => {
      return this.protoParent?.id ?? this.svgParent.id()
    }, `parentID`).call(this)
  }
  //MEMO: boundsRect
  get boundsRect() {                      // inherits parent's insetBoundsRect
    return memoize(() => {
      return this.protoParent?.insetBoundsRect
    }, `boundsRect`).call(this)
  }
  //MEMO: anchor
  get anchor() {                          // taken from this.boundsRect
    return memoize(() => {
      return vert(this.boundsRect.x, this.boundsRect.y)
    }, `anchor`).call(this)
  }
  //MEMO: size
  get size() {                            // taken from this.boundsRect
    return memoize(() => {
      return vert(this.boundsRect.width, this.boundsRect.height)
    }, `size`).call(this)
  }
  //MEMO: insetSize
  get insetSize() {                       // calc from this.size and this.insetScale
    return memoize(() => {
      return Vertex.mult(this.size, this.insetScale)
    }, `insetSize`).call(this)
  }
  //MEMO: insetAnchor
  get insetAnchor() {                     // calc from this.insetSize and this.size
    return memoize(() => {
      return this.anchorFor(this.insetSize)
    }, `insetAnchor`).call(this)
  }
  //MEMO: insetBoundsRect
  get insetBoundsRect() {                 // combines this.insetAnchor and this.insetSize
    return memoize(() => {
      return DOMRect.fromRect(
        {
          x: this.insetAnchor.x,
          y: this.insetAnchor.y,
          width: this.insetSize.x,
          height: this.insetSize.y,
        })
    }, `insetBoundsRect`).call(this)
  }
  //MEMO: padSize
  get padSize() {                         // calc from this.insetSize and this.size
    return memoize(() => {
      return Vertex.sub(this.size, this.insetSize).div(2)
    }, `padSize`).call(this)
  }

  //MEMO: center
  get center() {
    return memoize(() => {
      return Vertex.div(this.size, 2).add(this.anchor)
    }, `center`).call(this)
  }
  //MEMO: corners
  get corners() {
    return memoize(() => {
      return {
        upLeft: this.anchor,
        upRight: Vertex.add(this.anchor, vert(this.size.x, 0)),
        downRight: Vertex.add(this.anchor, this.size),
        downLeft: Vertex.add(this.anchor, vert(0, this.size.y)),
      }
    }, `corners`).call(this)
  }
  //MEMO: sides
  get sides() {
    return memoize(() => {
      const isCell = this.type === 'Cell'
      //ARROW: side()
      const side = (start, end, sideDir) => {
        const startPoint = this.corners[start]
        const endPoint = this.corners[end]
        const midPoint = segment(startPoint, endPoint).mid
        const points = OpArray.format([startPoint, midPoint, endPoint])
        return protoSegment({
          start: startPoint,
          end: endPoint,
          parentID: this.id,
          islandIDs: isCell ? this.islandIDs : undefined,
          id: `${this.id}-${sideDir}Side`,
          cells: isCell ? OpArray.format(this) : undefined,
          points: isCell ? points : undefined,
          sideDir: isCell ? Direction.named(sideDir.trim()) : undefined,
          grid: this.grid
        })
      }
      return {
        up: side(`upLeft`, `upRight`, `up`),
        right: side(`upRight`, `downRight`, `right`),
        down: side(`downRight`, `downLeft`, `down`),
        left: side(`downLeft`, `upLeft`, `left`)
      }
    }, `sides`).call(this)
  }
  //MEMO: midPoints
  get midPoints() {
    return memoize(() => {
      return {
        up: this.sides.up.mid,
        right: this.sides.right.mid,
        down: this.sides.down.mid,
        left: this.sides.left.mid
      }
    }, `midPoints`).call(this)
  }
  //MEMO: points
  get points() {  // 9 points array: center, corners, midpoints all grid vert sorted
    return memoize(() => {
      const corners = Object.values(this.corners)
      const mids = Object.values(this.midPoints)
      return OpArray.format([this.center, corners, mids].flat()).gridVertSorted
    }, `points`).call(this)
  }
  //MEMO: bounds
  get bounds() {
    return memoize(() => {
      return findBounds(this.anchor, this.corners.downRight)
    }, `bounds`).call(this)
  }
  // #endregion
  // MARK: Geometry Methods
  // #region 
  //METH: 
  corner(direction) { return this.corners[direction.name] }
  //METH: 
  side(direction) { return this.sides[direction.name] || "invalid" }
  //METH: 
  anchorFor(size) { return Vertex.div(size, -2).add(this.center) }
  //METH:
  insetAmountToScale(amount) {
    amount = amount instanceof Vertex ? amount : vert(amount)
    return Vertex.sub(this.size, amount).div(this.size)
  }
  // #endregion
  // MARK: Settings Methods
  // #region 
  //METH: 
  resize() { this.drawElement() }
  //METH: setInsetScale()
  setInsetScale(scale) {
    this._insetScale = scale instanceof Vertex ? scale : vert(scale)
    // console.log('ProtoLayer insetScale', this.insetScale)
    this.drawElement()
  }
  //METH: setFilter()
  setFilter(filter) {
    // console.log(`setting filter of ${this.id} to ${filter?.id}`)
    this._filter = filter
    this.drawElement()
  }
  //METH: setFilterLoft()
  setFilterLoft(loft) { this._filterLoft = loft }
  //METH: updateDisplay()
  updateDisplay() {
    this.drawElement()
    this.showDeBug()
  }
  // #endregion
  // MARK: Setup Methods
  // #region 
  //METH: 
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    this.drawElement()
    // this.showDeBug()
  }
  //METH: 
  assignElement() {
    if (this.drawSVG || this.drawRect) {
      // console.groupCollapsed(`assignElement ${this.id}`)
      // console.warn(this.cellBounds())
      if (this.drawSVG) {
        // console.log(`${this.id} layout SVG: anchor: ${this.anchor.string}, size: ${this.size.string}`)
        this.svgElt = createSVGElt()
          .id(this.id)
          .parent(this.svgParent)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
          .layout(this.anchor, this.size, this.padding)
          .viewBox(this.anchor, this.size, this.padding)
        // .label('test', 'red', Direction.Up)
      }

      if (this.drawRect) {
        // console.log(`${this.id} layout rect: insetAnchor: ${this.insetAnchor.string}, insetSize: ${this.insetSize.string}`)
        this.rect = createSVGElt('rect')
          .id(`${this.id}-frontRect`)
          .parent(this.svgElt)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
          .layout(this.insetAnchor, this.insetSize)
        // .label('test', 'red', Direction.None)
      }
      // console.groupEnd()
    }
  }
  //METH: 
  drawElement() {
    if (this.drawSVG || this.drawRect) {
      // console.groupCollapsed(`drawElement ${this.id}`)
      if (this.drawSVG) {
        // console.log(`${this.id} layout SVG: anchor: ${this.anchor.string}, size: ${this.size.string}`)
        this.svgElt
          .layout(this.anchor, this.size, this.padding)
          .viewBox(this.anchor, this.size, this.padding)
        // .style('image-rendering', `high-quality`)
      }
      if (this.drawRect) {
        // console.log(`${this.id} assignElement layout rect: insetAnchor: ${this.insetAnchor.string}, insetSize: ${this.insetSize.string}`)
        this.rect
          // .svgLook(this.look)
          .layout(this.insetAnchor, this.insetSize)
          .attribute('rx', `${this.cornerRadius}`)
          .attribute('ry', `${this.cornerRadius}`)
          // .attribute('fill', protoColor(0, 64))
          .attribute('fill', `black`)


        if (this.drawFilter) {
          if (this.filter) {
            this.rect.applyFilter({ filter: this.filter, size: this.insetSize })
          }
        }
      }
      // console.groupEnd()
    }
  }
  // #endregion
}
// CLASS: ProtoLayer Mixin/Protocol Assignment
Object.assign(ProtoLayer.prototype, IdentifiableStored)
Object.defineProperties(ProtoLayer.prototype, Object.getOwnPropertyDescriptors(Debuggable))

//MARK: FRAME CLASS
// CLASS: Frame 
// SIZE: 112 lines
// NOTE: drawSVG = true
// NOTE: drawRect = true
class Frame extends ProtoLayer {
  bleed             // Black Backing
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

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Frame)


  }

  // MARK: Frame View Properties
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

  // MARK: Frame Computed Properties
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

  // MARK: Frame Setup Methods
  // #region Setup Methods
  //METH: assignElement()
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
      .layout(this.anchor, this.size)

    // this.testElementsSetup()
  }
  //METH: drawElement()
  drawElement() {
    this.bleed
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)

    this.bleedRect
      // .attribute('fill', frameColor)
      .attribute('fill', 'black')

    super.drawElement()

    this.frameRect
      .layout(this.anchor, this.size)
      .attribute('rx', `${this.cornerRadius}`)
      .attribute('ry', `${this.cornerRadius}`)
      // .attribute('fill', ProtoColor.randomHighHue().setSaturation(10))
      .attribute(`fill`, frameColor)
      // .attribute(`fill`, 'black')
      .attribute('fill-opacity', '1')
    // .applyFilter({ filter: this.filter, size: this.size, padding: 20 })

    // this.testElementsDraw()
  }
  // #endregion
}

//MARK: SELECTION BOUNDS CLASS
// CLASS: SelectionBounds
// SIZE: 320 lines
// NOTE: drawSVG = false    // SelectionBounds is not a ProtoLayer subClass 
// NOTE: drawRect = false   // SelectionBounds is not a ProtoLayer subClass 
class SelectionBounds {
  selection
  grid
  groupID
  islandID

  constructor({ selection, grid, groupID, islandID } = {}) {
    if (selection.is2D) { selection = selection.flat() }
    this.selection = selection.sort((a, b) => a.index - b.index)
    this.grid = grid
    this.groupID = groupID
    this.islandID = islandID
  }

  // MARK: SelectionBounds Properties
  // #region Properties
  get selectionCount() { return this.selection.length }
  get availableCount() { return this.availableCells.length }
  get cellBoundsCount() { return this.columnCount * this.rowCount }

  get cellSize() { return this.grid.cellSize }
  get boundCellRows() { return this.grid.cellSpanRowsBetween(...this.spanCellIndices) }
  get boundsCells() { return this.grid.cellSpanBetween(...this.spanCellIndices) }
  get availableCells() { return this.boundsCells.exclude(this.selection, ['id']) }

  get xCellValues() { return this.selection.map(e => e.x) }
  get yCellValues() { return this.selection.map(e => e.y) }

  get xCellMin() {
    return memoize(() => {
      return min(this.xCellValues)
    }, `xCellMin`).call(this)
  }
  get xCellMax() {
    return memoize(() => {
      return max(this.xCellValues)
    }, `xCellMax`).call(this)
  }
  get yCellMin() {
    return memoize(() => {
      return min(this.yCellValues)
    }, `yCellMin`).call(this)
  }
  get yCellMax() {
    return memoize(() => {
      return max(this.yCellValues)
    }, `yCellMax`).call(this)
  }

  get xMinMax() { return vert(this.xCellMin, this.xCellMax) }
  get yMinMax() { return vert(this.yCellMin, this.yCellMax) }

  get upRowCells() {
    return memoize(() => {
      return this.selection.filter(e => e.y === this.yCellMin).flat()
    }, `upRowCells`).call(this)
  }
  get rightColCells() {
    return memoize(() => {
      return this.selection.filter(e => e.x === this.xCellMax).flat()
    }, `rightColCells`).call(this)
  }
  get downRowCells() {
    return memoize(() => {
      return this.selection.filter(e => e.y === this.yCellMax).flat()
    }, `downRowCells`).call(this)
  }
  get leftColCells() {
    return memoize(() => {
      return this.selection.filter(e => e.x === this.xCellMin).flat()
    }, `leftColCells`).call(this)
  }
  get outerCells() {
    return memoize(() => {
      return {
        up: this.upRowCells,
        right: this.rightColCells,
        down: this.downRowCells,
        left: this.leftColCells,
      }
    }, `outerCells`).call(this)
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
    const a = this.spanCellVerts.start
    const b = this.spanCellVerts.end
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
  // MARK: SelectionBounds Methods
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
  // MARK: SelectionBounds Island Methods
  // #region Island Methods
  //METH: 
  // innerCellIslands({ taken = true, stored = false, direction = Direction.Horizontal } = {}) {
  //   console.log('innerCellIslands called')
  //   return this.grid.createIslands({
  //     selection: taken ? this.selection : this.availableCells,
  //     bounds: this,
  //     groupID: this.groupID,
  //     islandID: this.islandID,
  //     direction: direction,
  //     taken: taken,
  //     stored: stored,
  //   })
  // }

  // get horCellIslands() {
  //   return this.innerCellIslands({ taken: this.isMostlyAvailable, stored: false, direction: Direction.Horizontal })
  // }
  // get vertCellIslands() {
  //   return this.innerCellIslands({ taken: this.isMostlyAvailable, stored: false, direction: Direction.Vertical })
  // }
  // #endregion
}
//MARK: GRID CLASS
// CLASS: Grid
// SIZE: 2397 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class Grid extends ProtoLayer {
  gridSize
  startCoord
  offset
  cellRows
  cellRowsPref
  interGrid
  // gridCellBounds
  groups = new OpArray

  constructor({ protoParent, gridSize, insetScale = 1, transform, startCoord = vert(), interGrid = false } = {}) {
    super({
      protoParent: protoParent,
      insetScale: insetScale,
      // drawSVG: false,
      // drawRect: true,
      // drawFilter: true,
    })
    this.gridSize = gridSize
    this.startCoord = startCoord
    this.offset = interGrid ? 0.5 : 0
    this._type = 'Grid'

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Grids)
    this.cellRows = this.#createRowsArray()
    this.cellRowsPref = this.transformedCellRows(transform)
    this.setFrameRadii()
  }

  // MARK: Grid Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'grid') }
  get testColor() { return protoColor(0, 230, 0, 90) }
  get cornerRadius() { return this.cellRadius }
  //MEMO: gridCellBounds
  get gridCellBounds() {
    return memoize(() => {
      return this.cellBounds()
    }, `gridCellBounds`).call(this)
  }
  get columnCount() { return this.gridCellBounds.columnCount }
  get rowCount() { return this.gridCellBounds.rowCount }
  get cellCount() { return this.gridCellBounds.cellBoundsCount }
  //MEMO: cellSize
  get cellSize() {
    return memoize(() => {
      return Vertex.div(this.insetSize, this.gridSize)
    }, `cellSize`).call(this)
  }
  get cellAspect() { return this.cellSize.aspect }
  //MEMO: minCellWidth
  get minCellWidth() {
    return memoize(() => {
      return min(this.cellSize.x, this.cellSize.y)
    }, `minCellWidth`).call(this)
  }
  //MEMO: cellRadius
  get cellRadius() {
    return memoize(() => {
      return this.minCellWidth / 2
    }, `cellRadius`).call(this)
  }
  //MEMO: cells
  get cells() {
    return memoize(() => {
      return this.cellRows.flat()
    }, `cells`).call(this)
  }

  get cellColumns() { return this.cellRowsFlipped() }
  get availableCells() { return this.cells.filter(cell => cell.available) }
  get takenCells() { return this.cells.filter(cell => cell.taken) }
  get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }                // UNUSED
  get isFull() { return this.availableCells.length === 0 }
  get lastGroup() { return this.groups.last }
  get biggestGroup() {                                                                         // UNUSED
    return this.groups.reduce((max, grp) => {
      if (grp.cells.length > max.cells.length) { return grp }
      else { return max }
    })
  }
  //NOTE: perimeters must be created for every group!
  get perimeterIslands() {                                        // currently tests faster without memoization
    // return memoize(() => {
    return this.groups.map(g => g.perimeterIslands).flat()
    // }, `perimeterIslands`).call(this)
  }
  get islands() { return this.groups.map(g => g.islands).flat() }
  get allIslands() { return this.islands.union(this.perimeterIslands, [`id`]).flat() }
  get shapes() { return this.allIslands.map(i => i.shape).flat() }
  get allSimpleSubShapes() {                                      // currently tests faster without memoization
    // return memoize(() => {
    return this.perimeterIslands
      .map(i => i.shape.simpleSubShapes).flat()
    // }, `allSimpleSubShapes`).call(this)
  }
  get allSingleSimpleSubShapes() {                 // subshapes that contain no internal subShapes          
    return this.perimeterIslands
      .map(i => i.shape.simpleSubShapes)           // get unflattened to test subShape count
      .filter(subs => subs.length === 1).flat()    // only subShapes with a single simpleSubShape
  }
  get allInternalSimpleSubShapes() {        // Internal subshapes run counter-clockwise
    return this.perimeterIslands
      .filter(i => i.shape.simpleSubShapes.length > 1)    // only shapes with more than 1 simpleSubShape are internal
      .map(i => i.shape.simpleSubShapes.slice(1)).flat()  // remove external subShapes
  }

  get allInnerMostWrappers() {
    return this.allSimpleSubShapes.flat()
      .filter(s => s.isInnerMostWrapper)
      .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
      .sort((a, b) => b.outWrappers.length - a.outWrappers.length)
  }
  //MEMO: allInterferenceWrapped
  get allInterferenceWrapped() {
    return memoize(() => {
      return this.allSimpleSubShapes.flat()
        .filter(s => s.hasInterference)
        .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
        .sort((a, b) => b.radiantOutWrappers.length - a.radiantOutWrappers.length)
        .sort((a, b) => b.hasDoubleInterference - a.hasDoubleInterference)
    }, `allInterferenceWrapped`).call(this)
  }
  //MEMO: allInterferenceWrappers
  get allInterferenceWrappers() {
    // return memoize(() => {
    return this.allInterferenceWrapped.flat()
      .map(s => Object.values(s.interferenceWrappers)).flat().compacted
    // }, `allInterferenceWrappers`).call(this)
  }
  get allInnerMostRadiantWrappers() {
    return this.allSimpleSubShapes.flat()
      .filter(s =>
        !s.hasInterference
        &&
        s.isInnerMostRadiantWrapper
        && s.radiantOutWrappers.length > 1
      )
      .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
      .sort((a, b) => b.radiantOutWrappers.length - a.radiantOutWrappers.length)
  }
  get allMinRadiusCorners() {
    return this.allSimpleSubShapes.flat()
      .filter(s => s.hasMinArcRadius)
    // .gridVertSorted
    // .sort((a, b) => b.outWrappers?.length - a.outWrappers?.length)
  }
  //MEMO: allSimpleOutsideCorners
  get allSimpleOutsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapes.flat().filter(s => s.isOutsideCorner)
    }, `allSimpleOutsideCorners`).call(this)
  }
  //MEMO: allSimpleInsideCorners
  get allSimpleInsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapes.flat().filter(s => !s.isOutsideCorner)
    }, `allSimpleInsideCorners`).call(this)
  }

  // #endregion
  // MARK: Grid Geometry Methods
  // #region Geometry Methods
  //METH:
  cellNamed(id) { return this.cells.find(c => c.id = id) }                                     // UNUSED
  //METH: 
  cellAnchor(x, y) { return Vertex.mult(this.cellSize, vert(x, y)).add(this.insetAnchor) }
  //METH: 
  index(x, y) { return gridPointIndex(x, y, this.gridSize.x, this.offset) }
  //METH: 
  coords(index) { return gridCoords(index, this.gridSize.x, this.offset) }
  //METH: 
  coordsAreInBounds(x, y, bounds = this.gridCellBounds) {
    return bounds.xCellMin <= x && x <= bounds.xCellMax && bounds.yCellMin <= y && y <= bounds.yCellMax
  }
  //METH: 
  coordsAreInGrid(x, y) { return x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y }
  //METH: 
  cellAtCoords(x, y) { if (this.coordsAreInGrid(x, y)) { return this.cellAt(this.index(x, y)) } }
  //METH: 
  groupNamed(name) { return this.groups.find(e => e.id === name) || null }
  //METH: 
  islandNamed(name) { return this.allIslands.find(e => e.id === name) || null }
  //METH: 
  shapeNamed(name) {
    // console.log(this.shapes)
    return this.shapes.find(e => e.id === name) || null
  }
  // #endregion
  // MARK: Grid CellIndex Methods
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
    return this.allIslands.some(isle => isle.cells.some(cell => cell.index === cellIndex))
  }
  //METH: 
  cellSegmentBetween(indexA, indexB) {
    const indices = OpArray.from([indexA, indexB]).numSorted
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
    const indices = OpArray.from([indexA, indexB]).numSorted
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
  // MARK: Grid Selection Methods
  // #region Selection Methods
  //METH: 
  cellBounds({ selection = this.cells, groupID, islandID } = {}) {
    return new SelectionBounds({ selection: selection, grid: this, groupID: groupID, islandID: islandID })
  }
  //METH: 
  shrunkSelection(selection = this.cells, amount = 1, direction = Direction.Cartesian) {
    const excludeEdges = this.inline(selection, amount, direction)
    // return excludeEdges
    return selection.exclude(excludeEdges, 'id')
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
  //METH: validNeighbors() : [cell]
  validNeighbors({ selection = this.cells, bounds = this.gridCellBounds, direction = Direction.All } = {}) {
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
      .gridVertSorted
    // .sort((a, b) => a.start.y - b.start.y || a.start.x - b.start.x) // sort by y, x 
  }
  //METH: 
  allExposedCorners({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedCorners({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .gridVertSorted // sort by y, x 
  }
  // #endregion
  // MARK: Grid createIslands Method
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
    // cut,
    direction = Direction.Cardinal,
    perimeterType = `maxCorners`,
    protoParent = this,
    bounds = this.gridCellBounds,
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
  // MARK: Grid Shape Methods
  // #region Grid Shape Methods
  //METH:
  createSimpleSubShapes() {
    console.group(`GRID.createSimpleSubShapes called!!!`)
    this.groups.forEach(g => g.createSimpleSubShapes())
    console.groupEnd()
  }
  // #region end


  //TODO: DELETE WRAP METHODS AFTER CONVERSION 1276-1924

  //MARK: Wrap Methods
  // #region Wrap Methods
  //METH: findCollinearWrapper() : ProtoSegment : find collinear wrapper(s) of input segment in segCollection
  findCollinearWrapper({
    seg,
    outWrap = true,           // 
    outsideCorner = true,     // 
    isNeighbor = false,       // 
    invertLineCheck = false,  // 
    skipVertOnLine = false,   // 
    includeEnds = true,       // 
  } = {}) {
    //FIXME: incorporate seg.andNeighborSimples into search reduction for massive performance gain!
    // const localSegs = seg.andNeighborSimples
    // if (localSegs) { segCollection = localSegs }
    const segDir = seg.direction
    const wrapDir = outWrap ? segDir.opposites : segDir              // expected direction of wrapper 
    const turn = isNeighbor === outWrap ? 'end' : 'start'            // which turn to check turn direction of
    const oppTurn = isNeighbor === outWrap ? 'start' : 'end'         // opposite of turn
    const turnDir = outWrap !== outsideCorner ? `isRight` : `isLeft` // expected turn direction
    const vertOnLineCheck = (s) => {                                 // verify cubicVert is on segment
      if (skipVertOnLine) {
        return !seg[oppTurn].equals(s[oppTurn], 0)         // seg.end not equal to s.end (hand drawn case)
      }
      let checkSeg = outWrap && !invertLineCheck ? s : seg                // segment to check
      // if (invertLineCheck) {
      //   checkSeg = segment(checkSeg[oppTurn], checkSeg.cubicVerts[turn])    // only use curvable part of segment 
      // }
      const cubicSeg = outWrap && !invertLineCheck ? seg : s                // segment to take cubicVert from
      const vert = !isNeighbor ? cubicSeg.finalCubicEndVert : cubicSeg.finalCubicStartVert  // cubicVert to check

      return checkSeg.vertIsOnLine(vert, false)                           // vertIsOnLine, but not at start or end points
    }
    const cornerCheck = (opposite = true) => { return isNeighbor === opposite ? 'end' : 'start' }
    // console.log(` ** findCollinear seg`, info(seg))
    // console.log(`cubicVert`, cubicVert)
    // console.log(`segCollection`, segCollection)
    // let wrapper = segCollection.flat()
    // console.log(`findCollinearWrapper overlapSegs`, seg.overlapSegs)
    let wrapper = seg.overlapSegs
      .filter(s =>
        // s.isOverlappingWith(seg, includeEnds)        // collinear wraps overlap seg
        // &&
        s.direction.equals(wrapDir)  // collinear subIsland wraps point in same direction as seg
        && s.turns[turn][turnDir]       // collinear wraps turn left
        && vertOnLineCheck(s)           // collinear wraps will contain the transferrable cubicVert
        // && !seg[oppTurn].equals(s[oppTurn], 0)
        // && s.corners.end.equals(seg.corners.end)
        // && seg[cornerCheck(false)].equals(s[cornerCheck()], 1)  
      )
      .sort((a, b) => seg[oppTurn].dist(a[turn]) - seg[oppTurn].dist(b[turn]))
    return wrapper
  }
  //METH: findCollinearWrappers()
  findCollinearWrappers({
    seg,
    outWrap = true,
    outsideCorner = true,
    invertLineCheck = false,
    skipVertOnLine = false,
    includeEnds = true,
  } = {}) {
    // const localSegs = seg.andNeighborSimples
    // if (localSegs) { segCollection = localSegs }
    const neighbor = seg.endNeighbor // runs clockwise, seg then rightTurn end neighbor
    const start = this.findCollinearWrapper({  // find start of corner wrapper
      seg: seg,
      outWrap: outWrap,
      outsideCorner: outsideCorner,
      invertLineCheck: invertLineCheck,
      skipVertOnLine: skipVertOnLine,
      includeEnds: includeEnds,
    })
    const end = this.findCollinearWrapper({    // find end of corner wrapper
      seg: neighbor,
      outWrap: outWrap,
      outsideCorner: outsideCorner,
      invertLineCheck: invertLineCheck,
      skipVertOnLine: skipVertOnLine,
      includeEnds: includeEnds,
      isNeighbor: true
    })
    return { start: start, end: end }
  }
  //METH: wrapCollinearCorner() : finds collinear wrapped corners and transfers cubic verts inwards to wrapped
  // NOTE: in Grid.nestleShapes(): use outWrapOutsideCorner (outWrap = true, outsideCorner = true)
  // NOTE: in Island.copyAllToCardinal(): inWrapInsideCorner & inWrapOutsideCorner (outWrap = true, outsideCorner = both)
  wrapCollinearCorner(seg, segCollection, outWrap = true, outsideCorner = true, radiant = true, replace = false) {
    let report = false
    // if (
    //   seg.id.includes('cell026')
    //   // || seg.id.includes('cell040')
    //   // || seg.id.includes('cell046')
    // ) {
    //   console.error(``)
    //   console.warn(`FOUND cell026!`)
    //   console.error(``)
    //   report = true
    // }
    if (report) {
      console.log(`wrapCollinearCorner seg`, seg)
      console.log(`wrapCollinearCorner segCollection`, segCollection)
    }
    // let outsideCorners = new OpArray
    // let insideCorners = new OpArray
    const isDir = outsideCorner ? `isRight` : `isLeft`
    if (!seg.turns.end[isDir]) { // must be an outside corner, so end of seg turns Right
      console.error(`INVALID: wrapCollinearCorner only works on segment corners ending in ${isDir} turns `)
      return
    }
    if (!segCollection) {                         // assign appropriate segCollection
      segCollection = outsideCorner ? this.allSimpleOutsideCorners : this.allSimpleInsideCorners
    }
    const wrappers = this.findCollinearWrappers({  // find start of corner wrapper
      seg: seg,
      outWrap: outWrap,
      outsideCorner: outsideCorner
    })

    // if (report) {
    //   console.log(`--> wrapperStart`, wrapperStart)
    //   console.log(`--> wrapperEnd`, wrapperEnd)
    //   console.log(``)
    // }

    //ARROW: transferCubicStart() : 
    const transferCubicStart = () => {
      if (outWrap) {
        wrappers.start[0].addCubicStartVert(seg.finalCubicEndVert, radiant, replace)
      } else { // inWrap
        seg.addCubicEndVert(wrappers.start[0].finalCubicEndVert, radiant, replace)
      }
    }
    //ARROW: transferCubicEnd() : 
    const transferCubicEnd = () => {
      const neighbor = seg.endNeighbor
      if (outWrap) {
        wrappers.end[0].addCubicEndVert(neighbor.finalCubicStartVert, radiant, replace)
      } else { // inWrap
        neighbor.addCubicStartVert(wrappers.end[0].finalCubicStartVert, radiant, replace)
      }
    }

    let wrapped = { start: undefined, end: undefined }
    if (wrappers.start.length === 1 && wrappers.end.length === 1) {       // fully wrapped corner
      transferCubicStart()
      transferCubicEnd()
      wrapped.start = wrappers.start[0]
      wrapped.end = wrappers.end[0]
      // return wrappers.start[0]                     // return fully wrapped corner for adjacent wrapping
    } else if (wrappers.start.length === 1) {                           // only start is wrapped
      transferCubicStart()
      wrapped.start = wrappers.start[0]
    } else if (wrappers.end.length === 1) {                             // only end is wrapped
      transferCubicEnd()
      wrapped.end = wrappers.end[0]
    }
    return wrapped
  }
  //METH: wrapCorners() : 
  wrapCorners({ segs, segCollection, outWrap = true, outsideCorners = true, radiant = true, replace = false } = {}) {
    // console.log(`wrapCorners segs`, segs)
    return segs.flat().map(seg => this.wrapCollinearCorner(seg, segCollection, outWrap, outsideCorners, radiant, replace))
  }
  //METH: outWrapOutsideCorners() : 
  outWrapOutsideCorners(segs, segCollection, radiant = true, replace = false) {
    return this.wrapCorners({ segs: segs, segCollection: segCollection, radiant: radiant, replace: replace })
  }
  //METH: inWrapOutsideCorners() : 
  inWrapOutsideCorners(segs, segCollection, radiant = true) {
    return this.wrapCorners({ segs: segs, segCollection: segCollection, outWrap: false, radiant: radiant })
  }
  //METH: inWrapInsideCorners() : 
  inWrapInsideCorners(segs, segCollection, radiant = true, replace = true) {
    return this.wrapCorners({
      segs: segs, segCollection: segCollection, outWrap: false, outsideCorners: false, radiant: radiant, replace: replace
    })
  }
  //FIXME: give replace more power within this function!
  //METH: outWrapAdjacentInsideCorner() : ProtoSegment :
  outWrapAdjacentInsideCorner(seg, radiant = true, replace = false) {
    let report = false
    // if (
    //   seg.id.includes('cell121')
    //   || seg.id.includes('cell112')
    //   // || seg.id.includes('cell046')
    // ) { report = true }
    if (report) {
      console.warn(`outWrapAdjacentInsideCorner seg`, seg.id)
    }

    // if (!seg.turns.end.isLeft) { // must be an inside corner, so end of seg turns Left
    //   console.error(`outWrapAdjacentInsideCorner only works on segment corners ending in left turns `)
    //   console.log(seg)
    //   return
    // }
    const neighbor = seg.startNeighbor // use start neighbor to run clockwise like findCollinearWrappedCorner()

    //ARROW: adjWrapper() : ProtoSegment : find adjacent wrapper(s) of input segment
    const adjWrapper = (seg, isNeighbor = false) => {
      const segDir = seg.direction
      const adjDir = segDir.opposites // adjacent wraps point opposite of segDir
      const turn = !isNeighbor ? 'end' : 'start'
      const cubicVert = isNeighbor ? seg.finalCubicEndVert : seg.finalCubicStartVert
      const normCoord = segDir.rotated(90).moveCoord // normals always point left 90deg from segment direction
      const normal = segment(
        cubicVert,
        Vertex.add(cubicVert, Vertex.mult(normCoord, seg.shape.cellBounds.size || this.gridCellBounds.size))
      )
      const name = isNeighbor ? `end` : `start`
      // console.warn(`!!!adjWrapper!!! segDir: ${segDir}, normCoord: ${normCoord}, normal:`, normal)
      // console.log(` ** findAdjacent seg`, info(seg))
      // console.log(`normal`, normal.string)

      let closestAdjacentWrapper = seg.shape.simpleSubShapes.flat()
        .filter(s =>
          s.direction.equals(adjDir)  // adjacent wraps point in opposite direction as seg
          && s.turns[turn].isRight    // adjacent wraps turn right
          // && seg.arcShouldWrapOutToArc(s)
        )
        .map(s => s.intersectionWith(normal) ? [s, s.intersectionWith(normal)] : null) // adjWraps intersect normal
        .compacted
        .filter(s => !s[0].start.equals(s[1], 1) && !s[0].end.equals(s[1], 1)) // adjWraps cant have ends on normal
        .sort((a, b) => segment(seg[name], a[1]).length - segment(seg[name], b[1]).length) // sorted shortest first
      // console.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
      // closestAdjacentWrapper = closestAdjacentWrapper
      if (replace) {
        // closestAdjacentWrapper = closestAdjacentWrapper.filter(s => s.hasLooseCorner)  // safe replacement edge case
      }
      // console.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
      closestAdjacentWrapper = closestAdjacentWrapper[0] // take shortest/closest

      return closestAdjacentWrapper
    }

    // const wrapperStart = adjWrapper(seg)
    // const wrapperEnd = adjWrapper(neighbor, true)

    //----------------------------------------------------
    console.error(`outWrapAdjacentInsideCorner seg`, seg)
    const adjWrap = seg.adjacentWrapper
    let wrapped = { start: undefined, end: undefined }
    console.log(`adjWrap`, adjWrap)

    if (adjWrap) {
      const wrapperStart = seg.adjacentWrapper
      const wrapperEnd = seg.adjacentWrapper.endNeighbor

      adjWrap.addDistancedEndCornerVerts(adjWrap.intendedArcRadius, radiant, replace)

      wrapped.start = wrapperStart
      wrapped.end = wrapperEnd
    }

    return wrapped
    //-------------------------------------------------------





    // if (report) {
    console.log(`--> wrapperStart`, wrapperStart)
    console.log(`--> wrapperEnd`, wrapperEnd)
    console.log(``)
    // }

    // let wrapped = { start: undefined, end: undefined }
    if (wrapperStart && wrapperEnd) {
      if (wrapperStart[0].endNeighbor.id !== wrapperEnd[0].id) {
        console.error(`INVALID: Wrapper segs ${wrapperStart[0].id} and ${wrapperEnd[0].id} are not a connected corner`)
        return
      }
      if (wrapperStart[0].isCollinearWith(seg) || wrapperEnd[0].isCollinearWith(neighbor)) {
        console.warn(`INVALID: Wrapper corner is collinear with segment corner`)
        return
      }

      if (report) {
        console.log(`!!! ADJACENT WRAPPED CORNER FOUND !!!`)
        console.log(seg)
        console.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
        console.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
      }

      const startGap = segment(seg.finalCubicStartVert, wrapperStart[1])  // gap between corner segs
      const endGap = segment(neighbor.finalCubicEndVert, wrapperEnd[1])   // gap between corner segs
      // console.log(`startGap`, startGap.length, startGap.string)
      // console.log(`endGap`, endGap.length, endGap.string)
      // console.log(``)
      const startGapLength = roundToDec(startGap.length)               // gap distance
      const endGapLength = roundToDec(endGap.length)                   // gap distance
      if (startGapLength === endGapLength) {                              // wrap both if equidistant
        // console.log(`wrapperStart`, JSON.parse(JSON.stringify({
        //   cub: wrapperStart[0].cubicVerts,
        //   max: wrapperStart[0].maxCubicVerts,
        //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
        // })))
        // console.log(`wrapperEnd`, JSON.parse(JSON.stringify({
        //   cub: wrapperEnd[0].cubicVerts,
        //   max: wrapperEnd[0].maxCubicVerts,
        //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
        // })))
        console.warn(`Wrapping both segments`)

        if (radiant) {
          wrapperStart[0].addCubicEndVert(wrapperStart[1], replace)
          wrapperEnd[0].addCubicStartVert(wrapperEnd[1], replace)
        } else {
          wrapperStart[0].addMaxStartVert(wrapperStart[1], replace)
          wrapperEnd[0].addMaxEndVert(wrapperEnd[1], replace)
        }
        // console.log(`wrapperStart`, JSON.parse(JSON.stringify({
        //   cub: wrapperStart[0].cubicVerts,
        //   max: wrapperStart[0].maxCubicVerts,
        //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
        // })))
        // console.log(`wrapperEnd`, JSON.parse(JSON.stringify({
        //   cub: wrapperEnd[0].cubicVerts,
        //   max: wrapperEnd[0].maxCubicVerts,
        //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
        // })))

        // console.log(``)
        wrapped.start = wrapperStart[0]
        wrapped.end = wrapperEnd[0]
        // return wrapperStart[0]                                            // only return corner when both wrapped 
      }

      else if (startGapLength < endGapLength) {                           // wrap seg with shortest distance
        console.log(`Wrapping end of start segment ${wrapperStart[0].id} with ${wrapperStart[1].string}`)
        console.log(`prev availableEndLength: ${wrapperStart[0].availableEndLength}`)
        if (radiant) {
          wrapperStart[0].addCubicEndVert(wrapperStart[1], replace)
        } else {
          wrapperStart[0].addMaxEndVert(wrapperStart[1], replace)
        }
        if (replace) {
          wrapperStart[0].endNeighbor.removeCubicStartVert()        // remove neighbor vert to prevent bad match
          wrapperStart[0].matchEndCorner()                          // match new vert on neighbor
        }
        wrapped.start = wrapperStart[0]
        console.log(`new availableEndLength: ${wrapperStart[0].availableEndLength}`)
      } else {
        console.log(`Wrapping start of end segment ${wrapperEnd[0].id} with ${wrapperEnd[1].string}`)
        console.log(`prev availableEndLength: ${wrapperStart[1].availableStartLength}`)
        if (radiant) {
          wrapperEnd[0].addCubicStartVert(wrapperEnd[1], replace)
        } else {
          wrapperEnd[0].addMaxStartVert(wrapperEnd[1], replace)
        }
        if (replace) {
          wrapperStart[0].startNeighbor.removeCubicEndVert()        // remove neighbor vert to prevent bad match
          wrapperStart[0].matchStartCorner()                        // match new vert on neighbor
        }
        wrapped.end = wrapperEnd[0]
        console.log(`new availableEndLength: ${wrapperStart[1].availableStartLength}`)
      }
      // console.log(``)
    }
    return wrapped
  }

  //METH: outWrapAdjacentInsideCorners()
  outWrapAdjacentInsideCorners({ segs, radiant = true, replace = false } = {}) {
    return segs.flat().map(seg => this.outWrapAdjacentInsideCorner(seg, radiant, replace))
  }

  //METH: recursiveOutWrapOutsideCorners() : recursive collinear/adjacent combo wrap functions for outside corners
  recursiveOutWrapOutsideCorners(segCollection, radiant = true, replace = false) {
    segCollection = OpArray.format(segCollection)
    // console.log(`recursiveOutWrapOutsideCorners input`, segCollection.map(s => s.id))
    let outsideCorners = new OpArray
    let insideCorners = new OpArray
    const collinears = this.outWrapOutsideCorners(segCollection, this.allSimpleSubShapes, radiant, replace)
      .compacted
    if (!collinears.isEmpty) {
      // console.log(`recursiveOutWrapOutsideCorners collinears`, collinears)
      let colOut = new OpArray
      collinears.forEach(col => {
        if (col.start) { insideCorners.push(col.start) }
        if (col.end) { insideCorners.push(col.end) }
        if (col.start && col.end) { colOut.push(col.start) }
      })
      const adjacents = this.outWrapAdjacentInsideCorners({ segs: colOut, radiant: radiant, replace: replace })
        .compacted
      if (!adjacents.isEmpty) {
        // console.log(`recursiveOutWrapOutsideCorners adjacents`, adjacents)
        let adjOut = new OpArray
        adjacents.forEach(adj => {
          if (adj.start) { outsideCorners.push(adj.start) }
          if (adj.end) { outsideCorners.push(adj.end) }
          if (adj.start && adj.end) { adjOut.push(adj.start) }
        })
        const combined = this.recursiveOutWrapOutsideCorners(adjOut, radiant, replace)
        if (!combined.isEmpty) {
          outsideCorners = outsideCorners.union(combined.outsideCorners)
          insideCorners = insideCorners.union(combined.insideCorners)
        }
      }
    }
    return { outside: outsideCorners, inside: insideCorners }
  }

  //METH: recursiveOutWrapAdjInsideCorners() : recursive combination of adjacent/collinear wrap functions for inside corners
  recursiveOutWrapAdjInsideCorners(segCollection, radiant = true, replace = false) {
    segCollection = OpArray.format(segCollection)
    let outsideCorners = new OpArray
    let insideCorners = new OpArray
    // console.log(`recursiveOutWrapAdjInsideCorners input`, segCollection)
    const adjacents = this.outWrapAdjacentInsideCorners({ segs: segCollection, radiant: radiant, replace: replace })
      .compacted
    if (!adjacents.isEmpty) {
      // console.log(`recursiveOutWrapAdjInsideCorners adjacents`, adjacents)
      let adjOut = new OpArray
      adjacents.forEach(adj => {
        if (adj.start) { outsideCorners.push(adj.start) }
        if (adj.end) { outsideCorners.push(adj.end) }
        if (adj.start && adj.end) { adjOut.push(adj.start) }
      })
      const collinears = this.outWrapOutsideCorners(adjOut, this.allSimpleSubShapes, radiant, replace)
        .compacted
      if (!collinears.isEmpty) {
        // console.log(`recursiveOutWrapAdjInsideCorners collinears`, collinears)
        let colOut = new OpArray
        collinears.forEach(col => {
          if (col.start) { insideCorners.push(col.start) }
          if (col.end) { insideCorners.push(col.end) }
          if (col.start && col.end) { colOut.push(col.start) }
        })
        const combined = this.recursiveOutWrapAdjInsideCorners(colOut, radiant, replace)
        if (!combined.isEmpty) {
          outsideCorners = outsideCorners.union(combined.outsideCorners)
          insideCorners = insideCorners.union(combined.insideCorners)
        }
      }
    }
    return { outside: outsideCorners, inside: insideCorners }
  }
  // #endregion

  //MARK: Nestle Methods
  // #region Nestle Methods
  //MARK: createUTurns()
  //METH: createUTurns()
  createUTurns({ subShapes = this.allSimpleSubShapes, out = true, outWrap = true, radiant = true } = {}) {
    // let curved = new OpArray                               // processed corner/seg storage
    let uTurns = subShapes.flat()
      .filter(s => out ? s.isUTurnOut : s.isUTurnIn)       // only include UTurnOut segments
      // .filter(s => s.length < s.startNeighbor.length && s.length < s.endNeighbor.length)
      // .filter(s => !s.hasSomeCubicVerts)                   // remove segments with any cubicVerts assigned
      .filter(s => !s.hasBothVerts)                   // remove segments with both cubicVerts assigned
      .sort((a, b) => b.minCubicLength - a.minCubicLength) // sort by large-small availableEndLength
    const name = out ? `out` : `in`
    console.warn(`uTurns ${name}`, uTurns.map(u => [u.id, u.availableEndLength]))
    // console.warn(`uTurns ${name}`, uTurns.map(u => u.availableEndLength))
    let outsideCorners = new OpArray
    let insideCorners = new OpArray
    while (uTurns.length > 0) {
      let seg = uTurns.last
      // seg = uTurns.pop()                          // pop gets segs with smallest minCubicLength first

      if (seg.hasNoCubicVerts) {
        const startRadius = min(seg.startNeighbor.availableEndLength, seg.availableStartLength)
        const endRadius = min(seg.availableEndLength, seg.endNeighbor.availableStartLength)

        // let curved = new OpArray

        if (approxToDec(startRadius) === approxToDec(endRadius)) { // curve both corner segs
          console.log(`curving ${seg.id} both sides with radius: ${roundToDec(startRadius / this.minCellWidth)}`)
          seg.addBothDistancedCornerVerts(startRadius)
          // curved.push(out ? seg.startNeighbor : seg)
          // curved.push(out ? seg : seg.endNeighbor)
          if (out) {
            outsideCorners.push(seg.startNeighbor)
            outsideCorners.push(seg)
          } else {
            insideCorners.push(seg)
            insideCorners.push(seg.endNeighbor)
          }

        } else if (approxToDec(startRadius) < approxToDec(endRadius)) { // curve smallest corner seg: start
          seg.addDistancedStartCornerVerts(startRadius)
          // curved.push(out ? seg.startNeighbor : seg)
          if (out) {
            outsideCorners.push(seg.startNeighbor)
          } else {
            insideCorners.push(seg)
          }

        } else {                                                      // curve smallest corner seg: end 
          seg.addDistancedEndCornerVerts(endRadius)
          // curved.push(out ? seg : seg.endNeighbor)
          if (out) {
            outsideCorners.push(seg)
          } else {
            insideCorners.push(seg.endNeighbor)
          }
        }

        console.log(`resulting seg.hasBothVerts`, seg.hasBothVerts)

        if (outWrap) {
          // console.log(`recursive processing of curved:`, curved.map(s => s.id))

          console.log(`recursive outWrap of outsideCorners:`, outsideCorners.map(s => s.id))
          console.log(`recursive outWrap of insideCorners:`, insideCorners.map(s => s.id))
          const wrapOuts = this.recursiveOutWrapOutsideCorners(outsideCorners, radiant)
          const wrapIns = this.recursiveOutWrapAdjInsideCorners(insideCorners, radiant)
          console.log(`createUTurns wrapOuts`, wrapOuts)
          console.log(`createUTurns wrapIns`, wrapIns)

          // if (out) {
          //   this.recursiveOutWrapOutsideCorners(curved, radiant)
          // } else {
          //   this.recursiveOutWrapAdjInsideCorners(curved, radiant)
          // }
        }
        uTurns = uTurns.sort((a, b) => b.minCubicLength - a.minCubicLength) // sort by large-small availableEndLength

      } else {
        seg = uTurns.pop()
        const cubicCorners = this.createCubicCorners({ subShapes: [seg], radiant: radiant })
        outsideCorners = outsideCorners.union(cubicCorners.outside, [`id`])
        insideCorners = insideCorners.union(cubicCorners.inside, [`id`])
      }
    }
    console.warn(`createUTurns outsideCorners`, outsideCorners)
    console.warn(`createUTurns insideCorners`, insideCorners)
    return { outside: outsideCorners, inside: insideCorners }
  }
  //MARK: createCubicCorners()
  //METH: createCubicCorners() :
  createCubicCorners({ subShapes = this.allSimpleSubShapes, outWrap = true, radiant = true, replace = false } = {}) {
    let corners = subShapes.flat()
      .filter(s => !s.hasBothCubicVerts)                      // remove segments with both cubicVerts assigned
      .sort((a, b) => b.minCubicLength - a.minCubicLength)    // sort large-small availableEndLength
      .sort((a, b) => b.cubicVertCount - a.cubicVertCount)    // sort large-small cubicVertCount

    let outsideCorners = new OpArray
    let insideCorners = new OpArray
    while (corners.length > 0) {
      let seg = corners.pop()

      let useStartCorner, cornerStart, cornerEnd
      if (seg.hasNoCubicVerts) {
        console.log(`createCubicCorners seg hasNoCubicVerts`)
        useStartCorner = seg.startNeighbor.availableEndLength <= seg.endNeighbor.availableStartLength ? true : false
      } else if (seg.hasSomeCubicVerts) {
        console.log(`createCubicCorners seg hasSomeCubicVerts`)
        useStartCorner = seg.hasCubicStartVert ? false : true
      }
      if (useStartCorner) {
        cornerStart = seg.startNeighbor
        cornerEnd = seg
      } else {
        cornerStart = seg
        cornerEnd = seg.endNeighbor
      }

      const radius = min(cornerStart.availableEndLength, cornerEnd.availableStartLength)
      cornerStart.addDistancedEndCornerVerts(radius)                                    // assign new endVert

      if (outWrap) {
        console.log(`I'm out wrapping yo!`)
        let wrapOuts
        let wrapIns
        if (cornerStart.turns.end.isRight) {
          console.log(`making wrapOuts`)
          wrapOuts = this.recursiveOutWrapOutsideCorners(cornerStart, radiant, replace)
          outsideCorners.push(seg)                               // push outside corners for further processing
        } else {
          console.log(`making wrapIns`)
          wrapIns = this.recursiveOutWrapAdjInsideCorners(cornerStart, radiant, replace)
          insideCorners.push(seg)                                // push inside corners for further processing
        }
        if (wrapOuts) {
          console.log(`createCubicCorners wrapOuts`, wrapOuts)
          outsideCorners = outsideCorners.union(wrapOuts.outside, [`id`])
          insideCorners = insideCorners.union(wrapOuts.inside, [`id`])
        }
        if (wrapIns) {
          console.log(`createCubicCorners wrapIns`, wrapIns)
          outsideCorners = outsideCorners.union(wrapIns.outside, [`id`])
          insideCorners = insideCorners.union(wrapIns.inside, [`id`])
        }
      }

      if (!seg.hasBothCubicVerts) {
        corners.push(seg)
      }
      corners = corners
        // .filter(s => !s.hasBothCubicVerts) // remove segments with both cubicVerts assigned
        .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
        .sort((a, b) => a.cubicVertCount - b.cubicVertCount) // sort by smallest cubicVertCount
    }
    console.error(`createCubicCorners outsideCorners`, outsideCorners)
    console.error(`createCubicCorners insideCorners`, insideCorners)
    return { outside: outsideCorners.compacted.unique([`id`]), inside: insideCorners.compacted.unique([`id`]) }
  }

  //MARK: wrapIsLoose()
  //METH: looselyWrappedCorner() 
  wrapIsLoose(seg, invertLineCheck = false) {
    if (!seg.hasWrappers || !seg.hasArc) { return }
    const wrappers = this.findCollinearWrappers({
      seg: seg,
      outsideCorner: seg.isOutsideCorner,
      skipVertOnLine: false,
      includeEnds: true,
      invertLineCheck: invertLineCheck,
    })

    const isWrapped = wrappers.start.length > 0 && wrappers.end.length > 0
    // console.error(`isWrapped 1`, isWrapped)
    if (isWrapped !== seg.hasColWrap) {
      // console.error(`isWrapped mismatch!`, seg.hasColWrap)
      // console.warn(`wrappers`, wrappers)
      // console.error(`seg.collinearWrap`, seg.collinearWrap)
    }

    const neighbor = seg.endNeighbor
    const wrapObj = { start: seg, startWrap: wrappers.start[0], end: neighbor, endWrap: wrappers.end[0] }
    const isNotQuad = seg.segPath.length > 4                          // don't cuddle quads
    let wrapIsLoose = false
    if (isWrapped) {
      const { start, startWrap, end, endWrap } = wrapObj
      const isNotBeanWrap = !start.isSmallBean && !endWrap.isSmallBean  // don't cuddle small beans  
      // console.error(`No, maybe this is where it fails?`)
      const cornerIsLoose = start.hasLooseCorner || endWrap.hasLooseCorner
      // console.error(`Seriously, maybe this is where it fails?`)

      wrapIsLoose =
        !startWrap.cubicVerts.start?.equals(start.cubicVerts.end, 0)
        || !endWrap.cubicVerts.end?.equals(end.cubicVerts.start, 0)
      if (cornerIsLoose) {
        wrapIsLoose = wrapIsLoose && isNotBeanWrap
      }
    }

    if (isNotQuad && isWrapped && wrapIsLoose) {
      // console.log(`seg`, seg)
      // console.log(`wrappers`, wrappers)
      // console.log(`isWrapped`, isWrapped)
      // console.log(`wrapped`, wrapped)
      return wrapObj
    }

  }

  //MARK: Wrap State Collections
  //TODO: DELETE Unused Wrap State Collections AFTER CONVERSION 1928-1970
  //METH: allCanCurveCorners() 
  get allCanCurveCorners() { return this.allSimpleSubShapes.flat().filter(s => s.canCurveMoreAtEnd) }
  get allIncompleteCorners() { return this.allSimpleSubShapes.flat().filter(s => !s.hasBothCompleteCorners) }

  //METH: allIncompleteEndCorners() 
  allIncompleteEndCorners(segments = this.allSimpleSubShapes) {
    return segments.flat()
      .filter(s => !s.hasCompleteEndCorner)
      .sort((a, b) => a.arcRadius - b.arcRadius)
  }
  //METH: allLooseCorners() 
  allLooseCorners(segments = this.allSimpleSubShapes) {
    return segments.flat()
      // .filter(s => s.isOutsideCorner)
      .filter(s => s.hasLooseCorner)
      .sort((a, b) => b.maxCornerRadius - a.maxCornerRadius)
  }
  //METH: allLooseWraps() 
  allLooseWraps(segments = this.allSimpleOutsideCorners) {
    return segments.flat()
      // .filter(s => s.isOutsideCorner)
      .sort((a, b) => b.arcRadius - a.arcRadius)
      .map(s => this.wrapIsLoose(s))
      .compacted
  }
  //METH: largerInnerLooseWraps() 
  largerInnerLooseWraps(segments = this.allSimpleOutsideCorners) {
    return segments.flat()
      // .filter(s => s.isOutsideCorner)
      .sort((a, b) => b.arcRadius - a.arcRadius)
      .map(s => this.wrapIsLoose(s, true))
      .compacted
      .filter(l => this.allLooseWraps().every(m => m.start.id !== l.start.id))
  }

  //MARK: maximizeCuddles()
  //METH: maximizeCuddles()
  maximizeCuddles(radiant = true) {

    //ARROW: curveCellRadiusCorners()
    const curveMinRadiusCorners = (all = false) => {
      const corners = all ? this.allSimpleSubShapes.flat() : this.allMinRadiusCorners
      if (!all) { console.log(`allMinRadiusCorners`, corners) }
      corners.forEach(s => {
        let report = false
        if (s.id.includes('cell081')
          // || s.id.includes('cell008')
          // || s.id.includes('cell001')
        ) { report = true }
        if (report) {
          console.log(``)
          console.log(s.id)
          console.log(`this before`, s.cubicVerts)
        }
        s.setMinEndCorner()
        if (report) { console.log(`this after`, s.cubicVerts) }
        if (!all) {
          if (report) { console.log(`calling colWrap:`, s.collinearWrapper?.id) }
          s.colWrap()
          if (report) {
            console.log(`colWrap:`, s.collinearWrapper)
            console.log(`cubicVerts:`, s.collinearWrapper?.cubicVerts, s.collinearWrapper?.endNeighbor.cubicVerts)
          }
        }
      }
      )
    }
    //ARROW: wrapInterferenceCorners()
    const wrapInterferenceCorners = (testPool = this.allInterferenceWrapped, preserveQuads = true) => {
      console.warn(`allInterferenceWrapped`, testPool)                                                        //LOGGING:
      console.warn(`allInterferenceWrapped hasDoubleInterference`, testPool.map(s => s.hasDoubleInterference))//LOGGING:
      console.warn(`allInterferenceWrapped outWrapper count`, testPool.map(s => s.radiantOutWrappers.length)) //LOGGING:
      console.warn(`allInterferenceWrapped maxArcRadius`, testPool.map(s => s.maxArcRadius))                  //LOGGING:
      console.warn(`allInterferenceWrapped viableInterferenceOrigins`, testPool.map(s => s.viableInterferenceOrigins))
      console.warn(`allInterferenceWrappers`, this.allInterferenceWrapped.map(w => w.interferenceWrappers))   //LOGGING:
      console.warn(`allInterferenceWrappers flat`, this.allInterferenceWrappers)                              //LOGGING:

      const wrappers = this.allInterferenceWrappers.map(w => w.innerMostRadiantWrapper)
      console.log(`wrappers`, wrappers)
      // testPool = testPool.filter(s => wrappers.every(w => w.id !== s.id))
      // console.warn(`allInterferenceWrapped refined`, testPool)

      // const wrappers = () => { return testPool.map(s => Object.values(s.interferenceWrappers)).flat().compacted }
      const dupes = testPool.intersect(wrappers, `id`)
      console.warn(`dupes`, dupes)
      // testPool = testPool.filter(wrapped => !dupes.some(d => d.id === wrapped.id))
      // console.warn(`refined testPool`, testPool)

      //FIXME: complete implementation of reducer that culls out duplicates from allWraps
      // let reducePool = testPool.reversed
      // dupes.forEach(d => {
      //   let dupeCount = 0
      //   while (reducePool.length > 0) {
      //     const wrap = reducePool.pop()
      //     if (wrap.id === d.id) {
      //       dupeCount += 1
      //       if (dupeCount > 1) {
      //         testPool = testPool.filter(w => w.id !== d.id)
      //         dupeCount -= 1
      //       }
      //     }
      //   }
      // })

      testPool.forEach(s => {
        //ARROW: setCurve()
        const setCurve = (seg, isStart) => {
          const wrapType = isStart ? `start` : `end`
          console.warn(`setCurve ${wrapType}`)
          let dir                                                               // direction of perpendicular seg
          if (s.isOutsideCorner) {
            dir = isStart ? s.direction.toLeft : s.direction
          } else {
            dir = isStart ? s.direction : s.direction.toRight
          }
          const perpEnd = Vertex.add(dir.lineVector, origin)                    // calculate end of perpendicular seg
          const perpSeg = segment(origin, perpEnd)                              // calculate perpendicular seg
          const projected = perpSeg.intersectionWith(seg.maxArcBoundsSeg, true) // calculate intersect
          console.log(`seg`, seg.id)                                                                      //LOGGING:
          console.log(`wrapped direction`, s.direction.name)                                              //LOGGING:
          console.log(`wrapper direction`, seg.direction.name)                                            //LOGGING:
          console.log(`perp direction`, dir.name)                                                         //LOGGING:
          console.log(`perpSeg`, perpSeg)                                                                 //LOGGING:
          console.log(`projected`, projected)                                                             //LOGGING:
          console.log(`viableArcOrigins`, seg.viableArcOrigins)
          if (seg.radiantInWrappers) {
            seg = seg.innerMostRadiantWrapper
            console.error(`changed seg`, seg.id)                                                          //LOGGING:
            console.log(seg)                                                                              //LOGGING:
          }
          if (seg.viableArcOrigins.some(o => o.equals(projected, 1))) {
            seg.setEndConcOutWrapsOrigin(projected)
          }
        }

        console.error(`interferenceWrapped in queue:`, s)
        console.error(`interferenceWrappers:`, s.interferenceWrappers)

        const viables = s.viableInterferenceOrigins
        let origin
        if (viables) {
          if (preserveQuads && s.isEdgeOfQuad && viables.some(v => v.equals(s.shape?.center, 1))) {
            origin = s.shape.center
            // origin = viables.middle
          } else {
            origin = viables.middle
          }
        } else {
          console.log(`NO viableInterferenceOrigins found!`)
        }
        if (origin) {
          console.log(`origin found!`, origin)
          s.setEndConcOutWrapsOrigin(origin)
          let { start, end } = s.interferenceWrappers
          if (start) { setCurve(start, true) }
          if (end) { setCurve(end, false) }
        } else {
          console.log(`NO origin found!`)
        }
      })

      // console.warn(`outerMostWrapper`, this.allInnerMostRadiantWrappers.map(s => s.outerMostRadiantWrapper))
    }

    //ARROW: wrapInnerMost()
    const wrapInnerMost = (testPool = this.allInnerMostRadiantWrappers, preserveQuads = true) => {
      console.warn(`allInnerMostWrappers`, testPool)
      console.warn(`allInnerMostWrappers outWrappers`, testPool.map(s => s.radiantOutWrappers.length))
      // console.warn(`allInnerMostWrappers viables`, testPool.map(s => s.viableRadiantOrigins))
      testPool.forEach(s => {

        //ARROW: needsMiddle()
        const needsMiddle = (seg) => {
          return !seg.hasInterference && seg.isInnerMostRadiantWrapper                  // 
        }

        console.warn(`innerMost in queue`, s)                                                  //LOGGING:
        // console.groupCollapsed(`innerMost in queue`, s)                                                  //LOGGING:
        const viables = s.viableRadiantOrigins
        console.log(`viableArcOrigins`, s.viableArcOrigins)                                           //LOGGING:
        console.log(`viables`, viables)                                                               //LOGGING:

        if (viables) {
          // let origin
          const shape = s.shape
          console.log(shape)
          if (preserveQuads
            && shape.isQuad
            && shape.simpleSubShapes.flat().every(c => !c.hasInterference)
            && this.allInterferenceWrappers.every(i => i.innerMostRadiantWrapper.id !== s.id)
          ) {  // shape is quad
            console.warn(`shape is quad!`, s)
            s.assignMid()                                                               // make circular/pill
            s.endNeighbor.assignMid()                                                   // make circular/pill
            s.setEndConcOutWrapsOrigin()
            return
          } else {
            const origin = needsMiddle(s.startNeighbor) || needsMiddle(s.endNeighbor) ? viables.middle : viables.last
            s.setEndConcOutWrapsOrigin(origin)
            if (s.outerMostRadiantWrapper.outWrapper) { s.outerMostRadiantWrapper.adjWrap() }
            // completeEnds(s.neighborsArray)
          }

          // console.groupEnd()                                                                             //LOGGING:
        }
      })
    }

    //ARROW: completeEnds()
    const completeEnds = (testPool = this.allIncompleteEndCorners()) => {
      console.warn(`incompleteEnds`, testPool)
      console.warn(`incompleteEnds`, testPool.map(s => s.arcRadius))
      testPool.forEach(s => {
        s.matchEndCorner()
        s.colWrap()
      })

      // const conditionFunc = () => { return this.allIncompleteEndCorners }
      // const action = () => {
      //   let incompletes = this.allIncompleteEndCorners
      //   // console.error(`incompletes`, incompletes)
      //   // console.log(`incompletes count`, incompletes.length)
      //   const incomplete = incompletes[0]
      //   // console.log(`incomplete in loop`, incomplete)
      //   // console.log(`availEnd:${incomplete.availableEndLength}, availStart:${incomplete.endNeighbor.availableStartLength}`)
      //   incomplete.matchEndCorner()
      // }
      // safeArrayWhile(conditionFunc, action)
    }

    //ARROW: roundQuads()
    const roundQuads = (preserveQuads = true, wrap = true) => {
      //ARROW: sumSides()
      const sumSegs = (segs) => segs.map(s => s.length).reduce((a, b) => a + b)

      let testPool = this.allSingleSimpleSubShapes
        .filter(sub => sub.length === 4                     // filter for 4-sided shapes
          && sub.some(s => s.isUTurnOut)                    // filter for Outside shapes only (UTurnOut)
          && sub.every(seg => !seg.hasMinArcRadius)         // filter out minRadius shapes
        )
        .sort((a, b) => sumSegs(b) - sumSegs(a))            // sort smallest to largest



      // .flat()
      // .filter(seg => seg.canCurveMoreAtEnd)

      // .splice(2, 2)







      console.log(`quads`, testPool)


      // let processed = new OpArray
      // testPool.forEach(s => {
      //   console.log(`current quad Corner`, s)
      //   if (preserveQuads) {

      //     if (wrap) {
      //       console.error(s.shape)
      //       if (!processed.some(p => s.id === p)) {
      //         s.segPath.forEach(seg => {
      //           if (!seg.arcOrigin.isUsingMiddleOrigin) {
      //             console.log(`seg in segPath`, seg)
      //             seg.replaceEndConcOutWrapsOrigin(s.middleArcOrigin)
      //             let badWraps = seg.radiantOutWrappers?.slice(1)
      //               .filter(o => o.colWrapIsNonEquidistant)
      //             console.log(`badWraps`, badWraps)
      //             if (!badWraps.isEmpty) {
      //               console.log(`colWrapIsNonEquidistant!`)
      //               badWraps.forEach(b => { b.colWrap(true) })
      //             }
      //           }
      //         })
      //         processed.push(s.shape.id)
      //         console.log(`processed`, processed)
      //       }



      //     } else {
      //       s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
      //       s.colWrap(true)
      //     }

      //     // completeEnds(s.andNeighborsArray)
      //   }

      // })

    }
    //ARROW: fixBadAdjWraps()
    const fixBadAdjWraps = (canWrapIn = true) => {
      let testPool = this.allSimpleSubShapes.flat()
        .filter(s =>
          s.isAdjOutWrapper
          && (s.adjWrapIsDiverging || s.adjWrapIsConverging)
        )
        .sort((a, b) => b.arcRadius - a.arcRadius)
      console.log(`badAdjWraps`, testPool)
      testPool.forEach(s => {
        console.warn(`badAdjWrap in queue:`, s)                                                //LOGGING:
        // console.groupCollapsed(`badAdjWrap in queue:`, s)                                                //LOGGING:

        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          console.log(`inWrapper:`, s.inWrapper)
          s.inWrapper.adjWrap(true)                             // adjWrap() should handle div/conv and equid/prox
          s.inWrapper.replaceEndConcOutWrapsOrigin(s.arcOrigin) // concentric outwrapping
        }
        //ARROW: wrapInFix()
        const wrapInFix = () => {
          console.log(`inWrapper:`, s.inWrapper)
          if (s.inWrapper.isInWrappedToConcentrics) {
            console.log(`abort fix: inWrapper is wrapped to concentrics`)
            return
          }
          s.adjWrap(true)                                       // adjWrap self to wrap in
          s.inWrapper.colWrap(true)                             // only do a single colWrap in
        }

        if (s.isOutWrappedToConcentrics) {                      // bail if s is already wrapped to outer concentrics
          console.log(`is outWrapped to concentrics`)                                                      //LOGGING:
          if (s.inWrapper.isInWrapped || s.inWrapper.isInWrappedToConcentrics) {
            console.log(`inWrapper is inWrapped to concentrics`)                                           //LOGGING:
            const inner = s.inWrapper.innerMostRadiantWrapper
            inner.replaceEndConcOutWrapsOrigin(inner.viableRadiantOrigins?.last)
            completeEnds(inner.andNeighborsArray)
          }
          return
        }

        if (s.adjWrapIsConverging) {                            // curveOuterLess or curveInnerMore to fix
          console.log(`wrap is converging`)
          if (s.canCurveLessAtEnd) {
            console.log(`curve outer less with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            console.log(`curve inner more with wrapInFix()`)
            wrapInFix()
          } else {
            console.log(`no fix: can't use wrapIn`)
          }
        } else if (s.adjWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          console.log(`wrap is diverging`)
          if (s.canCurveMoreAtEnd) {
            console.log(`curve outer more with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveLessAtEnd) {
            console.log(`curve inner less with wrapInFix()`)
            wrapInFix()
          } else {
            console.log(`no fix: can't use wrapIn`)
          }
        }
        completeEnds(s.andNeighborsArray)
        // console.groupEnd()                                                                              //LOGGING:
      })
    }
    //ARROW: fixBadColWraps()
    const fixBadColWraps = (canWrapIn = true) => {
      let testPool = this.allSimpleSubShapes.flat()
        .filter(s =>
          s.isColOutWrapper
          && !s.hasMinArcRadius
          && s.colWrapIsNonEquidistant
        )
      console.log(`badColWraps`, testPool)
      testPool.forEach(s => {

        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          console.log(`using wrapOutFix`)
          s.inWrapper.colWrap()
          s.inWrapper.replaceEndConcOutWrapsOrigin()
          // s.inWrapper.radiantOutWrappers.forEach(w => {
          //   // if (!w.startNeighbor.isInWrappedToConcentrics       // avoid possible off-axis interference wrap
          //   //   && !w.endNeighbor.isInWrappedToConcentrics) {     // avoid possible off-axis interference wrap
          //   w.replaceEndCurveOrigin(s.inWrapper.arcOrigin)
          //   // }
          // })
        }
        //ARROW: wrapInFix()
        const wrapInFix = () => {
          s.inWrapper.replaceEndCurveOrigin(s.arcOrigin)
        }

        if (s.colWrapIsConverging) {
          if (s.canCurveLessAtEnd) {
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            wrapInFix()
          }
        } else if (s.colWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          if (s.canCurveMoreAtEnd) {
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveLessAtEnd) {
            wrapInFix()
          }
        }
      })
    }
    //ARROW: fixLoosies()
    const fixLoosies = (balanced = true, respectAdjacents = true, loners = true, ignoreMinRadius = true) => {
      let testPool = this.allSimpleSubShapes.flat()
        .filter(s =>
          s.canCurveMoreAtEnd
          && (s.isOuterMostWrapper || s.isInnerMostWrapper
            || s.hasNoWrappers
          )
          // && !s.isOuterMostRadiantWrapper
          // && !s.hasInterference
          // && !s.innerMostRadiantWrapper?.hasInterference
        )
        .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
        .sort((a, b) => (a.radiantOutWrappers?.length || 0) - (b.radiantOutWrappers?.length || 0))
      // .sort((a, b) => !!a.radiantOutWrappers - !!b.radiantOutWrappers)

      console.log(`loosies`, testPool)
      console.log(`loosies outWrappers`, testPool.map(s => s.outWrappers?.length))
      // return

      testPool.forEach(s => {
        console.log(`current seg`, s)

        if (s.isEdgeOfQuad) {                                         // skip quads
          console.log(`skip quad`)
          return
        }

        else if (loners && s.hasNoWrappers) {                         // loners: corners without wrappers
          console.log(`loners fix`)
          s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
        }

        else if (s.isOutsideCorner && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)) {  // minRadius outWrappers
          console.log(`minRadius fix`)
          // console.log(`has outWrappers`, s.outWrappers)
          if (s.outWrappers) {
            console.log(`has outWrappers`, s.id)
            if (s.isOutWrappedToConcentrics) {
              console.log(`outwrapping`)
              s.replaceEndConcOutWrapsOrigin(s.currentMaxArcOrigin)
            } else {
              if (s.outWrapper.hasMinArcRadius && s.canCurveMoreAtEnd) {
                console.log(`maximizing neighbor curves first`)
                if (s.neighborsArray.some(n => n.canCurveMoreAtEnd)) {          // check and curve neighbor fully
                  if (s.startNeighbor.canCurveMoreAtEnd) {                      // check startNeighbor
                    // s.startNeighbor.replaceEndCurveOrigin(s.startNeighbor.currentMaxArcOrigin)
                    s.startNeighbor.replaceEndConcOutWrapsOrigin(s.startNeighbor.currentMaxArcOrigin)
                  }
                  if (s.endNeighbor.canCurveMoreAtEnd) {                        // check endNeighbor
                    // s.endNeighbor.replaceEndCurveOrigin(s.endNeighbor.currentMaxArcOrigin)
                    s.endNeighbor.replaceEndConcOutWrapsOrigin(s.endNeighbor.currentMaxArcOrigin)
                  }
                  if (ignoreMinRadius) {                                        // check if this can still curve more
                    s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
                  }
                }
                // if (s.outWrapper.canCurveMoreAtEnd) {
                //   console.log(s.outWrapper)
                //   s.replaceEndConcOutWrapsOrigin()
                // }
              }
              else if (ignoreMinRadius && s.currentMaxArcRadius > 3 * s.cellRadius) {
                // s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
                s.replaceEndConcOutWrapsOrigin(s.currentMaxArcOrigin)
              }
            }
          }

        }
        //FIXME: STILL NEED TO FIX DIVERGE IN 258
        else if (s.outWrappers) {                                               // has outWrappers
          if (s.outWrapper.id !== s.outWrapper.inWrapper.id) {
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            s.colWrap(true)
            s.radiantOutWrappers?.forEach(o => {
              if (o.canCurveMoreAtEnd) { o.replaceEndCurveOrigin(s.currentMaxArcOrigin) }
            })
            // s.replaceEndConcOutWrapsOrigin(s.currentMaxArcOrigin)
          }
          else if (s.radiantOutWrappers?.some(w => w.canCurveMoreAtEnd)) {
            console.log(`outWrappers fix`)
            s.replaceEndConcOutWrapsOrigin(s.currentMaxArcOrigin)
          }
        } else if (s.inWrappers) {
          if (s.radiantInWrappers) {
            console.log(`inWrappers fix`)
            if (!s.isInWrapped) {
              if (!s.isInWrappedToConcentrics) {
                s.innerMostRadiantWrapper.replaceEndConcOutWrapsOrigin()
              }
            }
          } else {
            s.inWrapper.adjWrap()
          }
        }

        else { console.log(`skipped: no cases met`) }
      })
    }


    //ARROW: fixLooseCorners()
    const fixLooseCorners = (testPool = this.allLooseCorners()) => {
      console.warn(`allLooseCorners`, testPool.map(s => s.id))
      // while (testPool.length > 0) {
      //   console.log(``)
      //   console.log(`loosie count`, testPool.length)
      //   let loosie = testPool.pop()
      //   console.log(`loosie in loop`, loosie)
      //   loosie.removeEndCornerVerts()
      //   const changed = this.createCubicCorners({ subShapes: [loosie], outWrap: true, radiant: true, replace: true })
      //   console.log(`changed loosies`, changed)
      //   completeEnds()
      //   testPool = testPool
      //     .union(changed.outside, [`id`])
      //     .union(changed.inside, [`id`])
      //     .unique([`id`])
      //   testPool = this.allLooseCorners(testPool)
      // }

      const conditionFunc = () => { return testPool }
      const action = () => {
        console.log(``)
        console.log(`loosie count`, testPool.length)
        let loosie = testPool.pop()
        console.log(`loosie in loop`, loosie)

        let changed
        let flat = roundToDec(loosie.flatAmount, 1)
        const localWrap = () => {
          loosie.removeEndCornerVerts()
          changed = this.createCubicCorners({ subShapes: [loosie], outWrap: true, radiant: true, replace: true })
        }
        if (loosie.inWrappers) {
          const innerMost = loosie.innerMostWrapper
          console.log(`attempting outWrap on ${innerMost.id}`)
          console.log(`innerMost`, innerMost)
          innerMost.removeEndCornerVerts()
          changed =
            this.createCubicCorners({ subShapes: [innerMost], outWrap: true, radiant: true, replace: true })
        } else {
          localWrap()
        }
        loosie.matchEndCorner()
        // console.log(`loosie`, loosie)
        // console.log(`flat: ${flat}, new flatAmount: ${loosie.flatAmount}`)
        // if (loosie.hasLooseCorner) {
        //   console.log(`attempting localWrap()`)
        //   localWrap()
        // }

        console.log(`changed loosies`, changed)
        completeEnds()


        testPool = testPool
          .union(changed.outside, [`id`])
          .union(changed.inside, [`id`])
          .unique([`id`])
        testPool = this.allLooseCorners(testPool)
      }
      safeArrayWhile(conditionFunc, action)
    }
    //ARROW: fixLooseWraps()
    const fixLooseWraps = (testPool = this.allLooseWraps()) => {
      console.warn(`allLooseWraps`, testPool.map(s => s.start.id))
      // while (testPool.length > 0) {
      //   console.log(``)
      //   console.log(`looseWraps`, testPool.map(s => s.start.id))
      //   console.log(`looseWraps count`, testPool.length)
      //   let looseWrap = testPool.pop()                                              // smallest first

      //   console.log(`looseWrap in loop`, looseWrap?.start.id)
      //   console.log(`looseWrap in loop`, looseWrap)
      //   const flat = looseWrap.endWrap.flatAmount                                   // record initial flatness
      //   const changed1 = this.recursiveOutWrapOutsideCorners(                       // outWrap and capture changed
      //     [looseWrap.start], radiant, true)
      //   console.log(`looseWrap changed1`, changed1)
      //   let changed2
      //   if (flat === looseWrap.endWrap.flatAmount) {                                // check if outWrap had an affect
      //     console.error(`recursiveOutWrapOutsideCorners failed`)                    // use manual replacement if not
      //     looseWrap.start.replaceCubicEndVert(looseWrap.startWrap.finalCubicStartVert)
      //     looseWrap.end.replaceCubicStartVert(looseWrap.endWrap.finalCubicEndVert)
      //     changed2 = this.recursiveOutWrapOutsideCorners(                           // outWrap again, capture changed
      //       [looseWrap.start], radiant, true)
      //   }
      //   // if (flat === looseWrap.endWrap.flatAmount) {
      //   //   console.error(`recursiveOutWrapOutsideCorners failed`)
      //   //   this.createCubicCorners({ subshapes: looseWrap.start })
      //   // }
      //   console.log(`looseWrap changed2`, changed2)
      //   completeEnds()

      //   let changedPool                                                             // final changed pool
      //   if (changed2) {
      //     changedPool = changed1?.outside.union(changed2?.outside, `id`)            // combine changed1 & changed2
      //   } else {
      //     changedPool = changed1?.outside                                           // only use outsideCorners
      //   }

      //   testPool = testPool.map(w => w.start)                                       // reduce testPool to starts
      //   if (!changedPool.isEmpty) { testPool = testPool.union(changedPool, `id`) }  // combine with changed
      //   testPool = this.allLooseWraps(testPool)                                     // recalc loose wraps
      //   console.log(`looseWraps after union`, testPool.map(s => s.start.id))
      // }

      const conditionFunc = () => { return testPool }
      const action = () => {
        console.log(``)
        console.log(`looseWraps`, testPool.map(s => s.start.id))
        console.log(`looseWraps count`, testPool.length)
        let looseWrap = testPool.pop()                                              // smallest first

        console.log(`looseWrap in loop`, looseWrap?.start.id)
        console.log(`looseWrap in loop`, looseWrap)
        const flat = looseWrap.endWrap.flatAmount                                   // record initial flatness
        const changed1 = this.recursiveOutWrapOutsideCorners(                       // outWrap and capture changed
          [looseWrap.start], radiant, true)
        console.log(`looseWrap changed1`, changed1)
        let changed2
        if (flat === looseWrap.endWrap.flatAmount) {                                // check if outWrap had an affect
          console.error(`recursiveOutWrapOutsideCorners failed`)                    // use manual replacement if not
          looseWrap.start.replaceCubicEndVert(looseWrap.startWrap.finalCubicStartVert)
          looseWrap.end.replaceCubicStartVert(looseWrap.endWrap.finalCubicEndVert)
          changed2 = this.recursiveOutWrapOutsideCorners(                           // outWrap again, capture changed
            [looseWrap.start], radiant, true)
        }
        // if (flat === looseWrap.endWrap.flatAmount) {
        //   console.error(`recursiveOutWrapOutsideCorners failed`)
        //   this.createCubicCorners({ subshapes: looseWrap.start })
        // }
        console.log(`looseWrap changed2`, changed2)
        completeEnds()

        let changedPool                                                             // final changed pool
        if (changed2) {
          changedPool = changed1?.outside.union(changed2?.outside, `id`)            // combine changed1 & changed2
        } else {
          changedPool = changed1?.outside                                           // only use outsideCorners
        }

        testPool = testPool.map(w => w.start)                                       // reduce testPool to starts
        if (!changedPool.isEmpty) { testPool = testPool.union(changedPool, `id`) }  // combine with changed
        testPool = this.allLooseWraps(testPool)                                     // recalc loose wraps
        console.log(`looseWraps after union`, testPool.map(s => s.start.id))
      }
      safeArrayWhile(conditionFunc, action)
    }
    //ARROW: fixLooseWraps()
    const fixTrickyLooseWraps = (testPool = this.largerInnerLooseWraps()) => {
      // console.error(`this is where it fails?`)
      console.warn(`largerInnerLooseWraps`, testPool.map(s => s.start.id))
      let changedPool
      while (testPool.length > 0) {
        console.log(``)
        console.log(`trickyWraps`, testPool.map(s => s.start.id))
        console.log(`trickyWraps count`, testPool.length)
        let trickyWrap = testPool.pop()

        console.log(`trickyWrap in loop`, trickyWrap.start.id)
        console.log(`trickyWrap in loop`, trickyWrap)
        let changed
        if (trickyWrap.endWrap.canCurveMoreAtEnd) {
          trickyWrap.endWrap.removeEndCornerVerts()
          changed = this.createCubicCorners({ subShapes: [trickyWrap.endWrap], outWrap: true, radiant: true, replace: true })
        }
        console.log(`trickyWrap changed`, changed)
        trickyWrap.start.replaceCubicEndVert(trickyWrap.startWrap.finalCubicStartVert)
        trickyWrap.end.replaceCubicStartVert(trickyWrap.endWrap.finalCubicEndVert)
        completeEnds()

        changedPool = []                                                                 // final changed pool
        if (changed) { changedPool = changed.outside }                                    // only use outsideCorners

        testPool = testPool.map(w => w.start)                                             // reduce testPool to starts
        if (!changedPool.isEmpty) { testPool = testPool.union(changedPool, `id`) }        // combine with changed
        testPool = this.largerInnerLooseWraps(testPool)                                   // recalc loose wraps
        console.log(`largerInnerLooseWraps after union`, testPool.map(s => s.start.id))
      }

      ////// console.log(`changedPool`, changedPool)
      ////// return changedPool

      // const conditionFunc = () => { return testPool }
      // const action = () => {
      //   console.log(``)
      //   console.log(`trickyWraps`, testPool.map(s => s.start.id))
      //   console.log(`trickyWraps count`, testPool.length)
      //   let trickyWrap = testPool.pop()

      //   console.log(`trickyWrap in loop`, trickyWrap.start.id)
      //   console.log(`trickyWrap in loop`, trickyWrap)
      //   let changed
      //   if (trickyWrap.endWrap.canCurveMoreAtEnd) {
      //     trickyWrap.endWrap.removeEndCornerVerts()
      //     changed = this.createCubicCorners({ subShapes: [trickyWrap.endWrap], outWrap: true, radiant: true, replace: true })
      //   }
      //   console.log(`trickyWrap changed`, changed)
      //   trickyWrap.start.replaceCubicEndVert(trickyWrap.startWrap.finalCubicStartVert)
      //   trickyWrap.end.replaceCubicStartVert(trickyWrap.endWrap.finalCubicEndVert)
      //   completeEnds()

      //   changedPool = []                                                                 // final changed pool
      //   if (changed) { changedPool = changed.outside }                                    // only use outsideCorners

      //   testPool = testPool.map(w => w.start)                                             // reduce testPool to starts
      //   if (!changedPool.isEmpty) { testPool = testPool.union(changedPool, `id`) }        // combine with changed
      //   testPool = this.largerInnerLooseWraps(testPool)                                   // recalc loose wraps
      //   console.log(`largerInnerLooseWraps after union`, testPool.map(s => s.start.id))
      // }
      // safeArrayWhile(conditionFunc, action)
    }

    //ARROW: fixIssuess()
    const fixIssues = () => {

      console.warn(`wrapInterferenceCorners`)                                                             //LOGGING:
      wrapInterferenceCorners()
      console.warn(`wrapInnerMost`)                                                                       //LOGGING:
      wrapInnerMost()
      console.warn(`curveMinRadiusCorners`)                                                               //LOGGING:
      curveMinRadiusCorners(false)
      console.warn(`completeEnds`)                                                                        //LOGGING:
      completeEnds()

      console.warn(`fixBadAdjWraps`)
      fixBadAdjWraps()
      console.warn(`fixBadColWraps`)
      fixBadColWraps()
      console.warn(`fixLoosies`)
      fixLoosies()

      console.warn(`roundQuads`)                                                                          //LOGGING:
      roundQuads()
    }

    console.error(`FIX Issues 1`)                                                                         //LOGGING:
    fixIssues()
    console.error(``)                                                                                     //LOGGING:
    console.error(`FIX Issues 2`)                                                                         //LOGGING:
    // fixIssues()

  }


  //MARK: CUSTOMIZE SHAPES
  //METH: nestleShapes() :
  nestleShapes(quadMode = 0, diagonals = false) {
    // const cellRadius = roundToDec(this.cellRadius)
    const cellRadius = this.cellRadius

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

    //MARK: QUAD SHAPES
    //ARROW: createQuadShapes(mode) : process 4-sided (square/rect) shapes first with multiple modes
    //TODO: need to add an ABFeature to select these!!!
    const createQuadShapes = (mode, onlySingles = true) => {
      const sumSides = (sides) => sides.reduce((a, b) => a + b)

      // console.log(`allSimpleSubShapes`, this.allSimpleSubShapes)
      //FIXME: need to filter out outer subShapes that wrap/outline an inner subShape
      let quads = onlySingles ? this.allSingleSimpleSubShapes : this.allSimpleSubShapes
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
            // console.error(`hi`)
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
              console.log(`minLength`, minLength)
              console.log(`cellRadius`, this.cellRadius)
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

        if (quad.every(seg =>
          roundToDec(seg.availableStartLength) <= roundToDec(this.cellRadius)
          && roundToDec(seg.availableEndLength) <= roundToDec(this.cellRadius)
        )) {
          // quad.forEach(s => s.colWrap())
          console.log(`NOT using radiant outWrap`)
          // this.outWrapOutsideCorners(quad)
          // this.recursiveOutWrapOutsideCorners(quad)
        } else {
          console.log(`using radiant outWrap!!`)
          // this.outWrapOutsideCorners(quad)
          // this.recursiveOutWrapOutsideCorners(quad, true)
        }
        console.log(``)
        console.log(`    QUAD`, i, quad[0].parentID)
      })
      // this.recursiveOutWrapOutsideCorners(quads.flat(), true)
    }

    //MARK: Nestle Main
    console.groupCollapsed(`createSimpleSubShapes`)
    this.createSimpleSubShapes()                                        // createSimpleSubShapes 
    console.groupEnd()

    console.groupCollapsed(`createQuadShapes`)
    // createQuadShapes(quadMode)                                                 // createQuadShapes
    console.groupEnd()

    console.group(`maximizeCuddles`)
    // console.groupCollapsed(`maximizeCuddles`)
    this.maximizeCuddles(true)
    console.groupEnd()

    console.log(`  %%%% end nestleShapes %%%%`)
    console.log(``)
  }
  // #endregion
  // MARK: Grid Creation Methods
  // #region Setup Methods
  //METH:
  cellRowsRotated(degree = 90, selection = this.cellRows) { return selection.rotated2D(normalizeDegree(degree)) }
  //METH:
  cellRowsFlipped(direction = "negOrdinal", selection = this.cellRows) { return selection.flipped2D(direction) }
  //METH: createRowsArray()
  #createRowsArray() {
    let size = this.gridSize
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
  // MARK: Grid Cell Grammar Ops
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
  // MARK: Grid Grammar Generators
  // #region Grammar Generators
  //METH:
  randGroup({ selection = this.availableCells, amount } = {}) {
    return this.assignCells(selection.randReduce(amount))
  }
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
  // MARK: Grid Grammar Modifiers
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
        if (outline.isEmpty) { return }
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
    const bounds = this.gridCellBounds
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
  // MARK: Grid Grammar Enum Methods
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
  // MARK: Grid Grammar Assignment Methods
  // #region Grammar Assignment Methods
  //METH:
  assignCells(selection, groupID) {
    // console.log('selection', selection)
    if (selection.isEmpty) { return }
    let newGroup = false
    if (!groupID) { newGroup = true }
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
  //METH:
  //FIXME: need to rethink this in regards to find Islands new temp/non-stored use case
  updateCells({ groupID, island } = {}) {
    // console.log(`updating Cells ${groupID}, ${islandID}`)
    if (arguments.length === 0) { this.cells.forEach(cell => cell.drawElement()) } // DEPRECATE: we dont render cells!

    let groups, islands
    if (groupID) { groups = [this.groupNamed(groupID)] }
    else { groups = this.groups }
    groups.forEach(group => this.updateGroup(group))

    if (island) {
      islands = [island]
      // console.log(`all islands: `, this.islands)
      console.log(`updateCells: islands found: `, islands)
    }
    else { islands = this.allIslands }
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
      // thisCell.drawElement()                                    // DEPRECATE: we dont render cells!
    })
    group.updateDisplay()
  }
  //METH:
  updateIsland(island) {
    // console.log(`updating Island ${island.id}`)
    island.cells.forEach(cell => {
      let thisCell = this.cells[cell.index]
      if (thisCell) {
        thisCell.islandIDs.add(island.id)
        // thisCell.color = island.color
        // thisCell.drawElement()                                   // DEPRECATE: we dont render cells!
      }
    })
    island.updateDisplay()
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
  //MARK: debug Methods
  showCellsDebug() { this.cells.forEach(c => c.showDeBug()) }
}

//MARK: CELLGROUP CLASS
// CLASS: CellGroup
// SIZE: 120 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class CellGroup extends ProtoLayer {
  perimeterType
  direction
  grid
  islandLevel
  cells = new OpArray
  perimeterIslands = new OpArray // Island-Shapes defining outer boundaries of all Island shapes to be allowed within
  shapesGroups = new OpArray // rendering layer storage

  constructor(protoParent, svgParent, grid, cells) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      // drawSVG: false,
      // drawRect: true,
      insetScale: 1,
    })
    if (cells) { this.cells = cells }
    this.grid = grid
    this._type = 'CellGroup'

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.CellGroups)
  }

  // MARK: CellGroup Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'group') }
  get testColor() { return protoColor(255, 127, 0, 1) }

  //FIXME: get this implementation of islands to work with update cells and createIslands so the createShapes will work when called by createSubIslands-->createIslands-->createShapes!!! 
  get islands() { return this.perimeterIslands.map(pIsle => pIsle.allSubIslands).flat() }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.id }) }
  get boundsRect() { return this.cellBounds.boundsRect }
  get padding() { return 100 / this.grid.gridSize.x }

  get cellsByIndex() { return this.cells.sort((a, b) => a.index - b.index) }
  // #endregion
  // MARK: CellGroup Grid Properties
  // #region Grid Properties
  get availableCells() { return this.grid.availableCells }
  get validNeighbors() { return this.grid.validNeighbors({ selection: this.cells }) }
  // get availableNeighbors() { return this.neighbors.filter(e => e.available) }
  // get takenNeighbors() { return this.neighbors.filter(e => e.taken) }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, groupID: this.id })
  }
  // #endregion
  // MARK: CellGroup Geometry Methods
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
  // MARK: CellGroup Creation Methods
  // #region Setup Methods
  //METH: createPerimiters() : 
  //FIXME: reimplement for proper minCorners functionality that wroks with both omni and cardinal
  //FIXME: so "omni-min", "omni-max", "cardinal-min", "cardinal-max"
  createPerimiters(perimeterType = `maxCorners`, direction = Direction.Cardinal) {
    // console.log(`createPerimiters this.id`, this.id)
    this.perimeterType = perimeterType
    this.direction = direction
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
    this.islandLevel = 0
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
  //METH: cutIslands()
  cutIslands({
    profile,
    layerStart,           // layerStart should be greater than layerEnd, swapped if not!
    layerEnd,             // if unassigned, layerEnd = cutEnd
    loftScale = 1,
    outsetCut = true,
    angleOffset,
    amount = 1,
    perimeter = false,    // setting for making channels/walls
    direction = this.direction,
    spanOp = 1 / 1,       // ratio of widths, start to end
    loftOp = 1 / 1,       // ratio of lofts, start to end
    selOps = []
  } = {}) {
    if (loftScale < 1 / FRAME.pixToUserUnits) {                                            // loftScale cant be less than 0
      console.error(`cutIslands error: zero loft`)
      return                                                          // exit
    }
    if (loftScale > 1) { loftScale = 1 }                              // loftScale cant be greater than 1

    let cut, insetScale
    if (typeof layerEnd === 'number') {
      if (layerStart < layerEnd) { swapVals(layerStart, layerEnd) }     // swap if needed
      const layerRange = range(layerStart, layerEnd)                    // create range
      const stepWidth = layerRange.size / amount                        // equal step division     

      let cutStart, cutEnd
      for (let i = 0; i < amount; i++) {
        let loft = layerRange.size * loftScale / amount                 // calc loft

        cutStart = layerStart - i * stepWidth
        cutEnd = cutStart - stepWidth
        if (loftScale < 1) {
          if (outsetCut) {
            console.log(`using outsetCut`)
            cutEnd = cutStart - loft
          } else {
            console.log(`using insetCut`)
            cutStart = cutEnd + loft
          }
        }
        const cutRange = range(cutStart, cutEnd)
        insetScale = profile.isInset ? cutStart : cutEnd
        console.log(`layerRange`, layerRange)
        console.log(`cutRange`, cutRange)
        console.log(`insetScale`, insetScale)

        if (loft > 2 * insetScale) { loft = 2 * insetScale }

        cut = new ProtoCut({
          profile: profile,
          depth: loft * this.grid.minCellWidth,
          angleOffset: angleOffset
        })

        console.log(`loft`, loft)
        console.log(`cut`, cut)
        console.log(`cut filters`, cut.filters)
      }

      //TODO: in order to get MAX loft, createSubIslands should be called first so that we can check for minRadius
      // FIXME: currently createSubIslands requires cut input? Need to remove this and assign cut after!
      let newIslands = this.createSubIslands({ cut: cut, direction: direction, insetScale: insetScale })

      if (!newIslands.flat().isEmpty) {
        if (layerEnd === `max`) {
          const squareIslands = newIslands.filter(i => i.isSquare)
        }



        this.islandsToShapeGroups(newIslands, cut, direction)
      }
    }
  }
  //METH: createSubIslands() :
  createSubIslands({ cut, direction = this.direction, insetScale = 1 } = {}) {
    console.warn(`${this.id}.createSubIslands, this.islands =`, this.islands.map(i => i.id))
    console.groupCollapsed(`Island.createSubIslands`)
    const newIslands = this.perimeterIslands.map(pIsle =>
      pIsle.createSubIslands({
        islandLevel: this.islandLevel + 1,
        direction: direction,
        cut: cut,
        insetScale: insetScale,
      }))

    console.groupEnd()

    return newIslands
  }
  //METH: assignToShapeGroups()
  islandsToShapeGroups(islands, cut, direction) {
    cut.filters.forEach((filter, i) => {
      this.islandLevel += 1
      const shapeGroup = this.createShapeGroup({
        islands: islands.flat(this.islandLevel).compacted,
        filter: filter,
        curve: cut.curve(i),
        islandLevel: this.islandLevel,
        direction: direction,
        // insetScale: insetScale,
      })
      console.log(`new shapeGroup`, shapeGroup)
    })
  }

  //METH: createShapeGroup() :
  createShapeGroup({ islands, curve, filter, islandLevel, direction = Direction.Cardinal, insetScale = 1 } = {}) {
    const shapeGroup = new ShapeGroup({
      cellGroup: this,
      islands: islands,
      protoParent: this,
      svgParent: this.svgElt,
      grid: this.grid,
      curve: curve,
      filter: filter,
      insetScale: insetScale,
      direction: direction,
      islandLevel: islandLevel,
      drawSVG: true,
      // drawRect: true,
    })
    this.shapesGroups.push(shapeGroup)
    return shapeGroup
  }
  // #endregion

  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        .attribute('fill', protoColor(0, 127))
        // .attribute('fill', 'black')
        .attribute('stroke', 'black')
        .attribute('stroke-width', `.0625`)
        .attribute('rx', 1)
        .attribute('ry', 1)
      // .attribute('stroke-dasharray', `4 4`)
    }

    this.svgElt
      .viewBox(this.anchor, this.size, this.padding)
      .layout(this.anchor, this.size, this.padding)


  }
}

//MARK: SHAPEGROUP CLASS
// CLASS: ShapeGroup
// SIZE: 45 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ShapeGroup extends ProtoLayer {
  cellGroup
  islands
  svgGroup
  paths = new OpArray
  islandLevel
  constructor({
    cellGroup,
    islands,
    islandLevel,
    protoParent,
    svgParent,
    grid,
    filter,
    curve,
    insetScale,
    direction
  }) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      filter: filter,
      // drawSVG: false,
      // drawRect: true,
      drawFilter: false,
    })
    this.curve = curve
    this.cellGroup = cellGroup
    this.islands = islands
    this.grid = grid
    this.direction = direction
    this.islandLevel = islandLevel
    this._type = 'ShapeGroup'

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.ShapeGroups)
  }

  // MARK: ShapeGroup Computed Properties
  get cellBounds() { return this.cellGroup.cellBounds }
  get boundsRect() { return this.cellGroup.boundsRect }

  get shapes() { return this.islands.map(i => i.shape) }


  // MARK: ShapeGroup Setup Methods
  //METH: createSVGGroup()
  createSVGGroup() {
    this.svgGroup = createElementNS(SVG.xmlns, 'g')
    const isleLvl = this.islandLevel.toString().padStart(2, '0')
    this.svgGroup
      .attribute('id', `${this.id}-${this.protoParent.id}-lvl${isleLvl}`)
      .parent(this.svgElt)
      .addToClassList(this.id)
      .addToClassList(this.svgParent.elt.classList.value)
    // .attribute('fill-rule', 'evenodd')

  }
  //METH: assignShapes()
  assignShapes() {
    this.shapes.forEach(s => {
      const pathCopy = s.path
      pathCopy.elt = pathCopy.elt.cloneNode()
      pathCopy
        .id(`${s.id}-copy`)
        .parent(this.svgGroup)
      // .attribute('fill-rule', 'evenodd')
      this.paths.push(pathCopy)
    })
  }

  //METH: finishSetup() override :
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    this.createSVGGroup()
    this.assignShapes()
    this.drawElement()
    this.showDeBug()
  }
  //METH: drawElement() override
  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        .attribute('fill', protoColor(0, 127))
        .attribute('stroke', 'black')
        .attribute('stroke-width', `.0625`)
        .attribute('rx', 1)
        .attribute('ry', 1)
      // .attribute('stroke-dasharray', `4 4`)
    }

    const luma = 50
    const chroma = 20
    const hue = 120

    const lchcol02 = ProtoColor.okLCH(luma, chroma, hue)
    const lchCol01 = color(`oklch(0.9 0.2 66deg)`)

    this.svgElt
    // .viewBox(this.anchor, this.size, this.padding)
    // .layout(this.anchor, this.size, this.padding)

    this.svgGroup
      .layout(this.anchor, this.size)
      // .attribute('fill', protoColor(230))
      // .attribute('fill', lchcol02)
      // .attribute('fill', achromic(0.1))
      .attribute('fill-opacity', 1)
      .applyFilter({ filter: this.filter, size: this.insetSize, padding: Vertex.mult(this.grid.cellSize, 2) })
    // this.cut.filters.forEach(filter => {
    //   this.svgGroup
    //     .applyFilter({ filter: filter, size: this.insetSize, padding: Vertex.mult(this.grid.cellSize, 2) })
    // })
  }
}

//MARK: CELL CLASS
// CLASS: Cell
// SIZE: 145 lines
// NOTE: drawSVG = false
// NOTE: drawRect = false
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
  interCell

  constructor({ protoParent, svgParent, grid, index, coords, available = true, color = '888' } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      // drawSVG: false,
      // drawRect: true,
      insetScale: 1,
    })
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.available = available
    // this.color = color
    this._type = 'Cell'

    this.drawLabel = true
    this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Cells)
  }

  // MARK: Cell Computed Properties
  // #region Computed Properties
  get cellBounds() { return this.grid.cellBounds({ selection: OpArray.from([this]) }) }
  get boundsRect() { this.cellBounds.boundsRect }
  get anchor() { return this.grid.cellAnchor(this.coords.x, this.coords.y) }
  get size() { return this.grid.cellSize }

  get aspect() { return this.size.aspect }
  get minRadius() { return this.grid.cornerRadius }

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
  // MARK: Cell Geometry Methods
  // #region Geometry Methods
  //METH:
  neighborCoords(direction) { return Vertex.add(this.coords, direction.moveCoord) }
  //METH:
  allNeighborsCoords(direction = Direction.All) {
    return direction.directions.map(dir => this.neighborCoords(dir)).compacted
  }
  //FIXME: check to see if this method is being used. Seems like no, because bounds was not properly assigned before!
  //METH:
  validNeighborsCoords(direction = Direction.All, bounds = this.grid.gridCellBounds,) {
    return this.allNeighborsCoords(direction).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
  }
  //METH:
  neighborSegment(direction) {
    const cell = this.grid.neighbor(this.index, direction)
    const side = cell.sides[direction.opposites.names]
    return cell.segments.filter(seg => seg.equals(side))
  }
  // #endregion
  // MARK: InterCell  Methods
  //METH: interCopy()
  createInterCopy(grid = this.grid.interGrid) {
    if (this.interCell) {
      console.error(`interCell already existed!`)
      return
    }
    if (this.grid.validNeighbors({ selection: [this], direction: Direction.DownRight }).isEmpty) {
      // console.error(`No possible interCell: out of bounds.`)
      return
    }
    const interIndex = this.index + .5
    const interCoords = Vertex.add(this.coords, vert(0.5))
    const interCell = new Cell({
      protoParent: grid,
      svgParent: grid.svgElt,
      grid: grid,
      index: interIndex,
      coords: interCoords,
    })
    this.interCell = interCell
  }

  // MARK: Cell Setup Methods
  //METH:
  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', `${this.minRadius}`)
        .attribute('ry', `${this.minRadius}`)
        .attribute('fill', protoColor(0, 64))
      // .attribute('fill-opacity', '0')


    }
  }
}

//MARK: ISLAND CLASS
// CLASS: Island
// SIZE: 523 lines
// NOTE: drawSVG = false
// NOTE: drawRect = false
class Island extends ProtoLayer {
  grid
  groupID
  parentIslandID
  cells
  subIslands
  islandLevel
  shape
  direction
  perimeterType

  constructor({
    cells,
    // cut,
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
      // drawSVG: false,
      drawRect: false,
      drawFilter: drawFilter,
      allowsProtoErrors: allowsProtoErrors,
    })
    console.log(`New Island! with arguments:`, arguments[0])
    this.cells = cells
    // this.cut = cut
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.perimeterType = perimeterType
    this.parentIslandID = parentIslandID
    this.islandLevel = parentIslandID ? protoParent.islandLevel + 1 : 0 // perimeterIslands should be 0, the rest above
    this._type = parentIslandID ? 'Island' : 'PerimeterIsland'

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    if (stored) { this.finishSetup(S.Islands) }
    console.log(`new (${this.type})-type Island completed:`, this)
    console.log(``)
    // this.color = R.random_hash(3, '#')
  }

  // MARK: Island Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'island') }
  get testColor() { return protoColor(255, 230, 0, 1) }
  //MEMO: allSubIslands
  get allSubIslands() {
    return memoize(() => {
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
    }, `allSubIslands`).call(this)
  }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.groupID, islandID: this.id }) }
  get cellAnchor() { return this.cellBounds.cellAnchor }
  get insetAnchor() { return this.anchor }
  get insetSize() { return this.size }

  get boundsRect() { return this.cellBounds.boundsRect }

  get cellCount() { return this.cells.length }
  get minCornerRadius() { return this.shape.minCornerRadius }

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
  get isSquare() { return this.isRectangle && this.cellBounds.aspect.isSquare }

  get directionHierarchy() { return this.hierarchyFrom(this.direction) }
  //MEMO: exposedSegments
  get exposedSegments() {
    return memoize(() => {
      return this.grid.allExposedSides({ selection: this.cells, islandID: this.id })
    }, `exposedSegments`).call(this)
  }
  get exposedCorners() {
    return this.grid.allExposedCorners({ selection: this.cells, islandID: this.id })
  }
  //MEMO: neighborIslands
  get neighborIslands() {
    return memoize(() => {
      let neighbors = this.grid.tempOutlineSelection(this.cells)
        .map(c => c.islandIDs.values().next().value)
        .compacted
        .unique()
        .map(id => this.grid.islandNamed(id))
        .compacted
      // console.log(neighbors)
      return neighbors
    }, `neighborIslands`).call(this)
  }
  //TODO: DEPRECATED
  // get ordinalConnectedCells() {
  //   return this.grid.ordinalConnectedCells({ selection: this.cells, islandID: this.id })
  // }
  // #endregion
  // MARK: Island CellIndex Methods
  // #region Island CellIndex Methods
  //METH: cellIsIsolated()
  cellIsIsolated(cellIndex, direction = Direction.Cardinal) {
    return this.grid.cellIsIsolated({ cellIndex: cellIndex, islandID: this.id, direction: direction })
  }
  //METH: exposedSides()
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }
  // #endregion
  // MARK: Island Special Methods
  // #region Island Special Methods
  //METH: hierarchyFrom() : hierarchy weight used to prevent overlaps in island stacks
  hierarchyFrom(direction) {
    if (direction.isAll) { return 3 }
    if (direction.isCardinal) { return 2 }
    if (direction.isTwoOpposites) { return 1 }
    if (direction.isNone) { return 0 }
    console.error('Undefined directionHierachy')
  }
  //METH: recalcdCells() : cells recalculated to fit within this shape
  //FIXME: need to incorporate loft!!
  //FIXME: absolute should activate previous mode (sub simpleSubShapes for insetSubShapes & no newInsetScale usage)
  //FIXME: maybe also a threshold?
  //FIXME: fix arcRadius calculation to make this work with non-square grid cells
  recalcdCells({
    newInsetScale,
    loft = 0,
    shape = this.shape,
    absolute = false,
  } = {}) {
    if (this.perimeterType === 'minCorners' || this.directionHierarchy < 2) { return this.cells }
    if (shape.simpleSubShapes.isEmpty) {
      console.error(`cannot recalcdCells because shape has no simpleSubShapes`)
      return this.cells
    }
    console.groupCollapsed(`recalcdCells shape`, shape)
    const cellRadius = this.grid.cellRadius
    // let newCells = this.cells
    let shapeCorners = shape.insetSubShapes.map(sub => {
      console.log(`sub`, sub)
      return sub
        .filter(seg =>                                  // filter corners with minimum curvature
          roundToDec(seg.startNeighbor.availableEndLength, 1) > roundToDec(cellRadius, 1)
          || roundToDec(seg.availableStartLength, 1) > roundToDec(cellRadius, 1)
        )
    }).flat(1)
    console.log(`shapeCorners`, shapeCorners)
    if (shapeCorners.isEmpty) {
      console.error(`recalcdCells: Cells remain the same!`)
      console.groupEnd()
      return this.cells
    } else {
      let removeCells = new OpArray                     // cells to remove
      let addCells = new OpArray                        // cells to add
      shapeCorners.forEach(seg => {
        //FIXME: it appears that arcRadius is not correct
        const isOutsideCorner = seg.turns.start.isRight // isOutsideCorner
        const cornerPos = seg.corners.start             // position of normalCorner
        const neighbor = seg.startNeighbor
        //NOTE: arcRadius: only correct if corner is circular arc and cell aspect is square
        //FIXME: try to fix bug when trying to create hierarchy 0/1 subIslands on non-square celled grids 
        //FIXME: issue may be in usage of cell.center as this assumes cells to be square
        const arcRadius = min(seg.availableStartLength, neighbor.availableEndLength)
        const startCorner = neighbor.finalCubicEndVert  // startCorner of arc
        const normalCorner = seg.start                  // normal pointer of arc
        const endCorner = seg.finalCubicStartVert       // endCorner of arc
        const origin = Vertex.add(startCorner, segment(normalCorner, endCorner).lineVector)// origin of arc
        const squareVerts = OpArray.from([startCorner, normalCorner, endCorner, origin]).gridVertSorted
        console.log(`squareVerts`, squareVerts)

        const cellOrigin = (cell, remove = true) => {
          // console.warn(`arcOrigins`, cell.arcOrigins)
          if (cell.aspect.isPortrait) {                 // isPortrait
            if (remove) {
              return cornerPos.isUp ? cell.arcOrigins.start : cell.arcOrigins.end
            } else {
              return cornerPos.isDown ? cell.arcOrigins.start : cell.arcOrigins.end
            }
          }
          if (cell.aspect.isLandscape) {                // isLandscape
            if (remove) {
              return cornerPos.isLeft ? cell.arcOrigins.start : cell.arcOrigins.end
            } else {
              return cornerPos.isRight ? cell.arcOrigins.start : cell.arcOrigins.end
            }
          }
          return cell.center                            // isSquare
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
            const length = segment(origin, cellOrigin(cell)).length + cellRadius * (newInsetScale + loft)
            console.log(`rem ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
            if (length >= arcRadius) { removeCells.push(cell) }
          })
        } else {
          cornerCells.forEach(cell => {
            const length = segment(origin, cellOrigin(cell, false)).length - cellRadius * (newInsetScale + loft)
            console.log(`add ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
            if (length >= arcRadius) { addCells.push(cell) }
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
  // #endregion
  // MARK: Island Creation Methods
  // #region Island Creation Methods
  //METH: createSubIslands() :
  createSubIslands({ cut, direction = Direction.Cardinal, insetScale = 1, drawFilter = true } = {}) {
    console.groupCollapsed(`${this.id} Island.createSubIslands`)
    if (this.subIslands) {
      // recursive dive to create subIslands on the bottom-most (visually top-most) subIslands
      console.error(`Divers go down! This.subIslands = `, this.subIslands.map(i => i.id))
      console.groupEnd()
      return this.subIslands.map(isle =>
        isle.createSubIslands({
          direction: direction,
          cut: cut,
          insetScale: insetScale,
          drawFilter: drawFilter
        })
      )
    }

    let subIslands

    if (this.allowsProtoErrors) {
      //FIXME: This appears to not be working at all!
      // create unprotected Island stacks with potential visual errors!!!
      subIslands = this.grid.createIslands({
        islandID: this.id,
        direction: direction,
        insetScale: insetScale,
        drawFilter: drawFilter,
      })
    } else {
      //NOTE: Create InterGrid
      if (insetScale <= 0) {
        const bounds = this.grid.cellBounds({ selection: this.cells, islandID: this.id })
        const gridSize = bounds.cellBoundsSize
        const startCoord = bounds.cornerCellVerts.upLeft

        let interGrid = new Grid({
          protoParent: this,
          gridSize: gridSize,
          startCoord: startCoord,
          interGrid: true,
        })


      }

      //NOTE: Change new direction
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

      //NOTE: Process new direction
      // same direction: safest/fastest to copy Island and apply new inset
      if (direction.equals(this.direction)) {
        console.log(`copying island ${this.id}`)
        // copy this island but change inset, set filter, set drawFilter
        const subIsland = this.copy({ insetScale: insetScale, drawFilter: drawFilter })
        // console.log(`created subIsland: `, subIsland)
        subIslands = OpArray.from([subIsland])
      }
      // different direction: requires new island and/or shape creation
      if (this.hierarchyFrom(direction) < this.directionHierarchy) {
        console.warn(`creating ${this.id} subIslands with direction: ${direction.name}`)
        // parent direction is All and new direction is Cardinal: careful reconstruction of current SimpleSubShapes
        if (this.direction.isAll && direction.isCardinal) { //
          console.log(`using copyAllToCardinal()`)
          subIslands = this.copyAllToCardinal(insetScale, drawFilter)
        }
        // parent direction is All/Cardinal: recalculate island cells based on parent shape, then create new islands
        else if (this.directionHierarchy >= 2 && this.hierarchyFrom(direction) < 2) {
          console.log(`  triggering a recalcdCells on ${this.id}`)
          const newCells = this.recalcdCells({ newInsetScale: insetScale, loft: cut.depth })
          subIslands = this.grid.createIslands({ // create new Islands with new direction
            selection: newCells,
            islandID: this.id,
            direction: direction,
            insetScale: insetScale,
            drawFilter: drawFilter,
          })
          subIslands?.forEach(i => {
            i.createSimpleSubShapes()            // must create SimpleSubShapes for new Islands
            console.log(i.shape.simpleSubShapes)
            this.grid.createCubicCorners({ subShapes: i.shape.simpleSubShapes, outWrap: false })
            i.shape.assignElement()
            i.shape.drawElement()
          })
        }
      }
    }
    this.subIslands = subIslands
    // this.subIslands.forEach(i => i.drawShapes())
    console.log(`new subIslands: `, subIslands)
    console.groupEnd()
    return subIslands
    // console.log(`new subShapes`, subIslands.map(isle => isle.shape))
  }
  //METH: copy() : create a copy of this Island
  copy({
    insetScale,
    drawFilter = this.drawFilter,
    protoParent = this, // do I need this or will all 'copies' produced by this island be children of this island?
    cells = this.cells,
    shape,
    direction = this.direction,
  } = {}) {
    // console.log(`copying island`, this.id)
    const newIsland = new Island({
      cells: cells,
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

    if (shape) {
      newIsland.shape = shape
    } else {
      newIsland.shape = this.shape.copy({
        insetScale: insetScale,
        protoParent: newIsland,
        island: newIsland,
      })
    }
    // newIsland.shape.assignElement()

    this.grid.updateCells({ island: newIsland })
    // console.log(`newIsland`, newIsland)
    return newIsland
  }
  //METH: copyAllToCardinal() :
  copyAllToCardinal(insetScale, drawFilter = true) {
    const cellIslands = this.grid.createIslands({
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
    const parentSimpleSubShapes = this.shape.simpleSubShapes
    cellIslands?.forEach((isle, i) => {
      isle.createSimpleSubShapes()
      const shape = isle.shape
      const simpleSubShapes = isle.shape.simpleSubShapes

      this.grid.createUTurns({ subShapes: simpleSubShapes, out: false, radiant: false })
      this.grid.inWrapOutsideCorners(simpleSubShapes, parentSimpleSubShapes)  //
      this.grid.inWrapInsideCorners(simpleSubShapes, parentSimpleSubShapes)   //
      this.grid.createUTurns({ subShapes: simpleSubShapes, radiant: false })
      this.grid.createCubicCorners({ subShapes: simpleSubShapes, radiant: false })   //finish remaining corners, required for Cardinal inset < 0.75

      console.log(`shape`, shape)
      shape.assignElement()       // assignElement in order to assign path to Shape.path for use in ShapeGroup
      shape.drawElement()         // DEPRECATE: Now, only shapeGroup element is drawn, using shape's path
    })
    return cellIslands
  }
  //METH: createShape() :
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
              if (!nextSeg) { console.error('unexpected 2nd segment') }
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
          segments = segments.counterGridVertSorted
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
    this.shape = thisShape
    // this.drawElement()
    // print(`END Shape Test`)
  }
  //METH: createSimpleSubShapes() : direct all shape to createSimpleSubShapes 
  createSimpleSubShapes() {
    console.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.shape.createSimpleSubShapes()
    console.groupEnd()
  }
  // #endregion

  // MARK: Island TODO Methods
  // #region TODO Methods
  get interCells() { return this.grid.shrunkSelection(this.cells) }

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

//MARK: SHAPE CLASS
// CLASS: Shape
// SIZE: 315 lines
// NOTE: drawSVG = false    // the SVG path gets passed back up to ShapeGroup for rendering
// NOTE: drawRect = false
class Shape extends ProtoLayer {
  island
  subShapes
  simpleSubShapes
  testVerts
  testColor
  path

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
      drawSVG: false,
      // drawRect: true,
      drawFilter: false,
      // drawFilter: protoParent.drawFilter,
    })
    this.subShapes = subShapes ? subShapes : new OpArray
    this.simpleSubShapes = simpleSubShapes ? simpleSubShapes : new OpArray
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.assignSegments()
    // this.drawPerimeter = true
    this._type = protoParent.type === `Island` ? 'Shape' : `PerimeterShape`

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Shapes)
  }

  get testLook() { return Look.test(this.size, 'shape') }

  get cellBounds() { return this.island.cellBounds }
  get boundsRect() { return this.cellBounds.boundsRect }
  get insetAnchor() { return this.anchor }
  get insetSize() { return this.size }

  get group() { return this.island.group }
  get grid() { return this.island.grid }
  get cells() { return this.island.cells }
  get cellRadius() { return this.grid.cellRadius }
  //MEMO: neighborShapes
  get neighborShapes() {
    return memoize(() => {
      // console.error(`ISSUE neighborShapes HERE!!!`, this.island.neighborIslands)
      return this.island.neighborIslands.map(i => i.shape)
    }, `neighborShapes`).call(this)
  }
  //MEMO: neighborSimples
  get neighborSimples() {
    return memoize(() => {
      return this.neighborShapes.map(s => s.simpleSubShapes).flat()
    }, `neighborSimples`).call(this)
  }
  //MEMO: andNeighborSimples
  get andNeighborSimples() {
    return memoize(() => {
      return this.simpleSubShapes.flat().union(this.neighborSimples.flat(), ['id'])
    }, `andNeighborSimples`).call(this)
  }

  get isPerimeterShape() { return this.type === `PerimeterShape` }

  get isLine() { return this.island.isLine }
  get isQuad() { return this.island.isRectangle }
  get isRoundedSquare() {
    if (this.isPerimeterShape || !this.island.isSquare) { return false }
    return this.allCornerRadii.every(min => roundToDec(min, 1) === roundToDec(this.allCornerRadii[0], 1))
  }
  get isCircle() {
    return this.isRoundedSquare && roundToDec(this.minCornerRadius, 1) === roundToDec(this.insetSize.x / 2, 1)
  }
  get isLeaf() {
    return this.island.isRectangle
      && !this.isCircle
      && roundToDec(this.allCornerRadii[0], 1) === roundToDec(this.allCornerRadii[2], 1)
      && roundToDec(this.allCornerRadii[1], 1) === roundToDec(this.allCornerRadii[3], 1)
  }
  get isSquareLeaf() { return this.isLeaf && this.island.isSquare }

  get hasSubShapes() { return this.subShapes.length > 1 }
  get hasUTurns() { return this.allSimpleSegs.some(s => s.isUTurn) }
  get shapeCorners() { return this.allSegments.map(s => s.cornerVerts).flat().unique(['x', 'y']) }
  get allSegments() { return this.subShapes.flat() }
  get allSimpleSegs() { return this.simpleSubShapes.flat() }
  get allCornerRadii() { return this.allSimpleSegs.map(s => s.startCornerRadius) }
  get assignedVerts() {
    return this.subShapes.map(sub => sub.map(s => s.assignedVerts).flat().unique(['x', 'y']))
    // .flat()
  }

  // get hasFlatness() { return this.allSimpleSegs.some(s => s.hasFlatness) }              // UNUSED
  // get canCurveMore() { return this.allSimpleSegs.some(s => s.canCurveMore) }            // UNUSED
  // get segsThatCanCurveMore() { return this.allSimpleSegs.filter(s => s.canCurveMore) }  // UNUSED

  get minCornerRadius() { return min(this.allSimpleSegs.map(s => s.startCornerRadius)) }
  get maxCornerRadius() { return max(this.allSimpleSegs.map(s => seg.startCornerRadius)) }
  get minInsetCornerRadius() { return this.minCornerRadius + (this.insetScale.x - 1) * this.cellRadius }
  get maxInsetCornerRadius() { return this.maxCornerRadius + (this.insetScale.x - 1) * this.cellRadius }

  get minSquareCornerRadius() {
    if (!this.island.isSquare) { return }
    if (this.isCircle) { return this.minCornerRadius }
    if (this.isSquareLeaf) { return this.maxSquareLeafLoftRadius }
  }
  get maxSquareLeafLoftRadius() {                   // max loft radius to create easily producible 3d leaf shape
    if (!this.isSquareLeaf) { return }              // only valid for square leaf shapes
    const min = sqrt(2 * this.minInsetCornerRadius ** 2) / 2       // length from sym center to small corner endpoint
    const max = this.maxInsetCornerRadius - sqrt(2 * this.maxInsetCornerRadius ** 2) / 2 // length from small end to large midPoint
    return min + max
  }

  //MARK: SubShape Transforms
  //NOTE: the order of transforms: subShapes-->simpleSubshapes-->insetSubShapes can be rearranged
  //NOTE: simple first: inset transform is expensive, so better to call at end as allSimpleSubShapes is called a lot!
  //NOTE: inset first: 1. possibility of knowing that opposite-walled cells will disappear at insetScale === 0
  //NOTE: inset first: 2. might be some hierarchical or derivative scaling advantage to successive inset knowledge
  //NOTE: ultimately both have advantages. could make inset transform a method with two inset compProps: sub & simpleSub
  //MEMO: insetSubShapes
  get insetSubShapes() {
    return memoize(() => {
      const subs = this.simpleSubShapes
      if (this.insetScale <= 0) {
        // TODO: future use with interGrids
      }

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
    }, `insetSubShapes`).call(this)
  }

  //MARK: SVG Paths
  //MEMO: insetSubShapes
  get svg() {
    return memoize(() => {
      let result = this.insetSubShapes.map(e => SVGPath.fromProtoSegPath({
        segPath: e,
        // cornerMin: min(this.insetSize.x / 2, this.insetSize.y / 2)
      }))
      if (result instanceof Array) {
        result = result.join(' ')
      }
      return result
    }, `svg`).call(this)
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

  get extractedVerts() { return extractVerts(this.svg) }

  // MARK: methods
  // #region methods
  //METH: : create initial SimpleSubShapes with minCorners to be refined by nestleShapes
  createSimpleSubShapes() {
    console.warn(`${this.id}.createSimpleSubShapes called!!!`)
    this.simpleSubShapes = this.subShapes.map(sub =>
      SegPath.refine(sub, this.id, this.island.perimeterType === 'minCorners', this.grid)
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
  // finishSetup(store) {
  //   this.storeObject(store)
  //   this.assignElement()
  //   // console.log(`created new shape`, this.id)
  //   // this.createSimpleSubShapes()
  //   console.warn(`${this.id}.drawElement`)
  //   this.drawElement()
  //   this.showDeBug()
  // }
  //METH:
  assignElement() {
    super.assignElement()
    // this.svgElt = createSVGElt().id(this.id)
    //   .parent(this.svgParent)
    //   .addToClassList(this.id)
    //   .addToClassList(this.svgParent.elt.classList.value)
    //   .layout(this.anchor, this.size, 20)
    //   .viewBox(this.anchor, this.size, 20)
    console.warn(`Shape.assignElement() this.svg?`, this.svg)
    this.path = createSVGElt('path')
      .attribute('d', this.svg)
      // .parent(this.svgElt)
      .addToClassList(this.id)
      // .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor, this.size)
      .attribute(`shape-rendering`, `geometricPrecision`)
  }

  //METH:
  drawElement() {
    console.group()
    console.error('drawElement: ', this.id, this)
    console.warn(`Shape.drawElement() this.svg?`, this.svg)

    if (this.drawSVG) {
      this.svgElt
        .layout(this.anchor, this.size, 20)
        .viewBox(this.anchor, this.size, 20)
    }

    this.drawAnything = true
    if (this.drawAnything) {
      if (this.drawFilter) {
        this.path
          // .attribute('d', this.svg)
          .parent(this.svgElt)
          .layout(this.anchor, this.size)

        this.path
        // .attribute('fill', protoColor(230))
        // .attribute('fill', protoColor(0, 0))
        // .attribute('fill-opacity', 1)
        // .applyFilter({ filter: this.filter, size: this.insetSize, padding: this.grid.cellSize })
      }

      // .svgLook(SVGLook.trendyCactus(path))
      // .attribute('enable-background', 'accumulate')
    }
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


