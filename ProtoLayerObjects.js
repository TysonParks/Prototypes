// MARK:
// MARK: INITIALIZATION
// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: ProtoLayer SuperClass

// CLASS: ProtoLayer
class ProtoLayer {
  // #uid
  // id
  // store
  // layers = []
  parent
  p5Elt
  parentP5Elt
  insetAmount = 1

  constructor(parent) {
    if (parent instanceof ProtoLayer) {
      this.parent = parent
      this.parentP5Elt = parent.p5Elt
    }
    else if (parent instanceof p5.Element) { this.parentP5Elt = parent }
    else { console.error('parent is not valid') }
    // this.#assignUID()
    this.assignUID()
  }

  // MARK: Computed Properties
  // #region Computed Properties
  // get uid() { return this.#uid }
  get parentID() { return this.parent.id }

  get testLook() { return Look.test(this.size, 'frame') }

  get boundsRect() { return this.parent.insetBoundsRect }
  // get boundsRect() { return this.parentP5Elt.elt.getBoundingClientRect() }
  get anchor() { return vert(this.boundsRect.x, this.boundsRect.y) }
  get size() { return vert(this.boundsRect.width, this.boundsRect.height) }

  get insetAnchor() { return this.anchorFor(this.insetSize).round }
  // TODO: re-implement!
  get insetSize() { return Vertex.mult(this.size, vert(this.insetAmount)).round }
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
      up: segment(this.corners.upLeft, this.corners.upRight),
      right: segment(this.corners.upRight, this.corners.downRight),
      down: segment(this.corners.downRight, this.corners.downLeft),
      left: segment(this.corners.downLeft, this.corners.upLeft),
    }
  }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  corner(direction) { return this.corners[direction.name] }
  side(direction) { return this.sides[direction.name] || "invalid" }
  anchorFor(size) {
    return Vertex.div(size, -2)
      .add(this.center)
    // .add(vert(this.padSize))  
  }
  // #endregion
  // MARK: Setup Methods
  // #region Setup Methods
  finishSetup(store) {
    // if (store) {
    //   this.store = store
    //   this.assignID()
    // }
    this.storeObject(store)
    this.assignElement()
    this.drawElement()
  }

  // assignID() { this.id = this.store.add(this) }

  assignElement() {
    // print(`id (${this.id}) is a string: ${typeof this.id === 'string'}`)
    this.p5Elt = createDiv(TestMode ? this.id : '')
      .id(this.id)
      .parent(this.parentP5Elt)
      .addToClassList(this.id)
      .addToClassList(this.parentP5Elt.elt.classList.value)
  }

  drawElement(look = this.testLook) {
    this.p5Elt
      .look(look)
      .size(this.insetSize.x, this.insetSize.y)
      .position(this.insetAnchor.x, this.insetAnchor.y)
    if (this.taken) {
      this.p5Elt
        .look(Look.testCell(testingControls.testColors ? this.color : '#0000'))
    }
    if (this.available) {
      this.p5Elt
        .look(Look.blankTestCell())
    }
    // if (this.islandID) { this.p5Elt.look(Look.testCell(this.color)) }
  }

  // #assignUID() { this.#uid = R.random_hash() }

  resize() { this.drawElement() }
  // #endregion
  // MARK: Layer Grammar Methods
  // #region LayerGrammar Methods
  inset(amount) { this.insetAmount = amount }

  assign(anchor, size, layer) {
    if (!layer) { layer = new Layer({ parent: this, anchor: anchor, size: size }) }
  }
  // #endregion
  // MARK: Static Methods
  static equal(a, b) { return a.uid === b.uid }
}

Object.assign(ProtoLayer.prototype, identifiableStored)

// CLASS: Frame
class Frame extends ProtoLayer {
  bleed

  constructor(parentP5Elt) {
    super(parentP5Elt)
    this.finishSetup(S.Frame)
  }
  get parentBoundsRect() { return this.parentP5Elt.elt.getBoundingClientRect() }
  get parentSize() { return vert(this.parentBoundsRect.width, this.parentBoundsRect.height) }

  get size() { return frameSize }
  get anchor() { return Vertex.sub(this.parentSize, this.size).div(2) }
  get boundsRect() {
    return DOMRect.fromRect(
      {
        x: this.anchor.x,
        y: this.anchor.y,
        width: this.size.x,
        height: this.size.y,
      })
  }

  get testLook() { return Look.test(this.size, 'frame') }

  // MARK: Setup Methods
  // #region Setup Methods
  assignElement() {

    this.bleed = createSVG(0, 0)
      .id('bleed')
      .parent(this.parentP5Elt)
    // .addToClassList(this.id)
    // .addToClassList(this.parentP5Elt.elt.classList.value)

    this.p5Elt = createSVGElt('rect')
      .id(this.id)
      .parent(this.bleed)
      .addToClassList(this.id)

  }

  drawElement(look = this.testLook) {
    this.bleed
      .look(look)
      .attribute(SVG.viewBox, `-5 -10 110 220`)
      .attribute('preserveAspectRatio', 'xMidyMid')
      .attribute('width', `${this.size.x}`)
      .attribute('height', `${this.size.y}`)
      .style(CS.border, '1px dashed blue')

    this.p5Elt
      // .attribute(SVG.viewBox, `0 0 100 200`)
      // .attribute('preserveAspectRatio', 'xMidyMid')
      .attribute('x', `${0}`)
      .attribute('y', `${0}`)
      .attribute('width', `${100}`)
      .attribute('height', `${200}`)

      .attribute('rx', `${20}`)
      .attribute('ry', `${20}`)
      .attribute(`fill`, ` ${protoColor(230)}`)
    // .insetDropShadow([
    //   insetShadow8,
    //   insetShadow7,
    //   insetShadow6,
    //   insetShadow5,
    //   insetShadow4,
    //   insetShadow3,
    //   insetShadow2,
    //   insetShadow1,
    //   insetShadow0,
    //   insetShadow01,
    // ])

    this.testElements()
  }

  testElements() {
    //COLORIZED
    // const shadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(0, 160, 0), inset: false };
    // const shadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(0, 255, 0), inset: false };
    // const shadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(0, 100, 100), inset: false };
    // const shadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(0, 255, 255), inset: false };
    // const shadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(140, 0, 140), inset: false };
    // const shadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 0, 250), inset: false };
    // const shadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(180, 180, 0), inset: false };
    // const shadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 0), inset: false };
    // const shadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 0, 0), inset: false };
    // const shadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 0, 0), inset: false };

    // const insetShadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(0, 160, 0), inset: true };
    // const insetShadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(0, 255, 0), inset: true };
    // const insetShadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(0, 100, 100), inset: true };
    // const insetShadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(0, 255, 255), inset: true };
    // const insetShadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(140, 0, 140), inset: true };
    // const insetShadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 0, 250), inset: true };
    // const insetShadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(180, 180, 0), inset: true };
    // const insetShadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 0), inset: true };
    // const insetShadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 0, 0), inset: true };
    // const insetShadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 0, 0), inset: true };

    // MONO
    const shadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(160, 160, 160), inset: false };
    const shadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(255, 255, 255), inset: false };
    const shadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(160, 160, 160), inset: false };
    const shadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(255, 255, 255), inset: false };
    const shadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(175, 175, 175), inset: false };
    const shadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 250, 250), inset: false };
    const shadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(190, 190, 190), inset: false };
    const shadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 245), inset: false };
    const shadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 205, 205), inset: false };
    const shadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 240, 240), inset: false };

    const insetShadow01 = { dx: 0.5, dy: 0.5, blur: 0.25, color: protoColor(160, 160, 160), inset: true };
    const insetShadow0 = { dx: -0.25, dy: -0.25, blur: 0.125, color: protoColor(255, 255, 255), inset: true };
    const insetShadow1 = { dx: 1, dy: 1, blur: 0.5, color: protoColor(160, 160, 160), inset: true };
    const insetShadow2 = { dx: -1, dy: -1, blur: 0.5, color: protoColor(255, 255, 255), inset: true };
    const insetShadow3 = { dx: 2, dy: 2, blur: 1, color: protoColor(175, 175, 175), inset: true };
    const insetShadow4 = { dx: -2, dy: -2, blur: 1, color: protoColor(250, 250, 250), inset: true };
    const insetShadow5 = { dx: 4, dy: 4, blur: 2, color: protoColor(190, 190, 190), inset: true };
    const insetShadow6 = { dx: -4, dy: -4, blur: 2, color: protoColor(245, 245, 245), inset: true };
    const insetShadow7 = { dx: 8, dy: 8, blur: 4, color: protoColor(205, 205, 205), inset: true };
    const insetShadow8 = { dx: -8, dy: -8, blur: 4, color: protoColor(240, 240, 240), inset: true };



    const testRect = createSVGElt('rect')
      .id('testRect')
      .attribute('x', `${5}`)
      .attribute('y', `${5}`)
      .attribute('width', `${90}`)
      .attribute('height', `${190}`)
      .attribute('rx', `${15}`)
      .attribute('ry', `${15}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      // .attribute('stroke', 'blue')
      .attribute('stroke-width', '1')
      .attribute('stroke-linejoin', 'round')
      .parent(this.p5Elt)
      .insetDropShadow([
        // insetShadow8,
        // insetShadow7,
        // insetShadow6,
        // insetShadow5,
        insetShadow4,
        insetShadow3,
        insetShadow2,
        insetShadow1,
        insetShadow0,
        insetShadow01,
      ])
    // .dropShadow3([
    //   // shadow8,
    //   // shadow7,
    //   // shadow6,
    //   // shadow5,
    //   shadow4,
    //   shadow3,
    //   shadow2,
    //   shadow1,
    //   shadow0,
    //   shadow01,
    // ])
    // .blur(2)
    // .attribute('filter', 'url(#blur)')
    // .dropShadow({ color: red })

    const testCircle = createSVGElt('circle')
      .id('testCircle')
      .attribute('cx', `${50}`)
      .attribute('cy', `${60}`)
      .attribute('r', `${40}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '0')
      .attribute('stroke', protoColor(230))
      .attribute('stroke-width', '2')
      .attribute('stroke-linejoin', 'round')
      .parent(this.p5Elt)
      .dropShadow3([
        // shadow8,
        // shadow7,
        // shadow6,
        // shadow5,
        shadow4,
        shadow3,
        shadow2,
        shadow1,
        shadow0,
        shadow01,
      ])

    // const testCircle3 = createSVGElt('circle')
    //   .id('testCircle')
    //   .attribute('cx', `${50}`)
    //   .attribute('cy', `${140}`)
    //   .attribute('r', `${20}`)
    //   .attribute('fill', protoColor(230))
    //   .attribute('fill-opacity', '1')
    //   .attribute('stroke', 'green')
    //   // .attribute('stroke-width', '5')
    //   // .attribute('stroke-linejoin', 'round')
    //   .parent(this.p5Elt)

    const testCircle2 = createSVGElt('circle')
      .id('testCircle')
      .attribute('cx', `${50}`)
      .attribute('cy', `${140}`)
      .attribute('r', `${20}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '.25')
      .attribute('stroke', protoColor(230))
      .attribute('stroke-width', '4')
      .attribute('pathLength', '360')
      .attribute('stroke-dashoffset', '0')
      .attribute('stroke-dasharray', `${180 / 8} `)
      .attribute('stroke-linejoin', 'round')
      .attribute('stroke-linecap', 'round')
      .parent(this.p5Elt)
      .dropShadow3([
        shadow8,
        shadow7,
        shadow6,
        shadow5,
        shadow4,
        shadow3,
        shadow2,
        shadow1,
        shadow0,
        shadow01,
      ])
    // .insetDropShadow([
    //   insetShadow8,
    //   insetShadow7,
    //   insetShadow6,
    //   insetShadow5,
    //   insetShadow4,
    //   insetShadow3,
    //   insetShadow2,
    //   insetShadow1,
    //   insetShadow0,
    //   insetShadow01,
    // ])

    const testCircle3 = createSVGElt('circle')
      .id('testCircle')
      .attribute('cx', `${50}`)
      .attribute('cy', `${140}`)
      .attribute('r', `${20}`)
      .attribute('fill', protoColor(230))
      .attribute('fill-opacity', '1')
      .attribute('stroke', 'green')
      // .attribute('stroke-width', '5')
      // .attribute('stroke-linejoin', 'round')
      .parent(this.p5Elt)





  }
  // #endregion
}

//TODO: DEPRECATE
// CLASS: Layer
class Layer extends ProtoLayer {
  #_anchor
  #_size
  constructor({ parent, anchor, size } = {}) {
    super(parent)
    this.finishSetup(S.Layers)
    this.#_anchor = anchor
    this.#_size = size
  }

  get anchor() { return this.#_anchor }
  get size() { return this.#_size }
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

  get cellAnchor() { return this.cornerCellVerts.topLeft }
  get spanCellVerts() { return segment(this.cornerCellVerts.topLeft, this.cornerCellVerts.botRight) }
  get spanCellIndices() {
    const a = this.spanCellVerts.verts.start
    const b = this.spanCellVerts.verts.end
    const e = this.grid.index(a.x, a.y)
    const f = this.grid.index(b.x, b.y)
    return [e, f]
    return
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
    if (arguments === 0) { return this.parentP5Elt.elt.getBoundingClientRect() }
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

  // TODO: try adding selection and bounds parameters and then feeding them transformed matrices
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

  // MARK: Encoder methods
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
}

// CLASS: Grid
class Grid extends ProtoLayer {
  gridSize
  cellRows
  groups = new OpArray
  islands = new OpArray

  constructor({ parent, gridSize } = {}) {
    super(parent)
    if (!(gridSize instanceof Vertex)) { gridSize = vert(gridSize) }
    this.gridSize = gridSize
    this.finishSetup(S.Grids)
    this.cellRows = this.#createRowsArray()
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'grid') }

  // get boundsRect() { return this.parent.insetBoundsRect }

  get cellSize() { return Vertex.div(this.insetSize, this.gridSize) }
  get cells() { return this.cellRows.flat() }
  get cellColumns() { return this.cellRowsFlipped() }
  get availableCells() { return this.cells.filter(e => e.available) }
  get takenCells() { return this.cells.filter(e => e.taken) }
  get isFull() { return this.availableCells.length === 0 }
  // get islands() { return this.findIslands({ selection: this.cells }) }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  cellAnchor(x, y) { return Vertex.mult(this.cellSize, vert(x, y)) }

  index(x, y) { return gridPointIndex(x, y, this.gridSize.x) }
  coords(index) { return gridCoords(index, this.gridSize.x) }
  coordsAreInBounds(x, y, bounds = this.cellBounds()) {
    return bounds.xCellMin <= x && x <= bounds.xCellMax && bounds.yCellMin <= y && y <= bounds.yCellMax
  }
  coordsAreInGrid(x, y) {
    // print('coordsAreInGrid x')
    // print(x)
    // print('coordsAreInGrid y')
    // print(y)
    let result = x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y
    // print('coordsAreInGrid result')
    // print(result)
    return result
  }
  cellAtCoords(x, y) { if (this.coordsAreInGrid(x, y)) { return this.cellAt(this.index(x, y)) } }
  groupNamed(name) { return this.groups.find(e => e.id === name) || null }
  // #endregion
  // MARK: CellIndex Methods
  // #region CellIndex Methods
  cellAt(cellIndex) { return this.cells.find(e => e.index === cellIndex) }

  rowContaining(cellIndex) { return this.cellRows[this.coords(cellIndex).y] }
  columnContaining(cellIndex) { return this.cellColumns[this.coords(cellIndex).x] }
  rowContains(rowIndex, cellIndex) { return this.coords(cellIndex).y === rowIndex }
  columnContains(columnIndex, cellIndex) { return this.coords(cellIndex).x === columnIndex }

  cellSegmentBetween(indexA, indexB) {
    const indices = [indexA, indexB].sort((a, b) => a - b)
    // print(indices)
    const a = this.coords(indices[0])
    const b = this.coords(indices[1])
    const direction = a.directionTo(b)
    if (direction === -1) { return -1 }
    if (direction.allAreCardinal) {
      // print('direction.isCardinal')
      let seg
      if (direction.allAreHorizontal) {
        // print('direction.isHorizontal')
        seg = this.cellRows[a.y]
      }
      if (direction.allAreVertical) {
        // print('direction.isVertical')
        seg = this.cellColumns[a.x]
      }
      const start = seg.findIndex(e => e.index === indices[0])
      const end = seg.findIndex(e => e.index === indices[1])
      return seg.slice(start, end + 1)
    }
    if (direction.allAreOrdinal) {
      // print('direction.isOrdinal')
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

  cellSpanRowsBetween(indexA, indexB) {
    const indices = [indexA, indexB].sort((a, b) => a - b)
    // print(indices)
    const a = this.coords(indices[0])
    const b = this.coords(indices[1])
    let rows = new OpArray
    for (let i = a.y; i <= b.y; i++) {
      const seg = this.cellSegmentBetween(this.index(a.x, i), this.index(b.x, i))
      // print(this.index(a.x, i), this.index(b.x, i))
      // print(i)
      // print(seg)
      rows.push(seg)
    }
    return rows
  }

  cellSpanBetween(indexA, indexB) { return this.cellSpanRowsBetween(indexA, indexB).flat() }

  neighbor(cellIndex, direction) {
    // print('')
    // print(cellIndex)
    // print(direction)
    let coords = this.cellAt(cellIndex).neighborCoords(direction)
    if (this.coordsAreInGrid(coords.x, coords.y)) {
      return this.cells.find(e => e.coords.equals(coords))
    } else { return }
  }

  neighborIsAvailable(cellIndex, direction) {
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.available }
    return false
  }
  neighborIsTaken(cellIndex, direction) { return !this.neighborIsAvailable(cellIndex, direction) }

  neighborIsInIsland(cellIndex, direction, islandID) {
    // print('neighborIsInIsland')
    // print(cellIndex)
    // print(direction)
    // print(islandID)
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.islandIDs.has(islandID) }
    return false
  }

  neighborIsInGroup(cellIndex, direction, groupID) {
    let neighbor = this.neighbor(cellIndex, direction)
    if (neighbor) { return neighbor.groupID === groupID }
    return false
  }

  exposedDirections({ cellIndex, groupID, islandID } = {}) {
    // print('exposedDirections')
    // print(cellIndex)
    // print(groupID)
    // print(islandID)
    if (groupID) {
      return Direction.All.directions.filter(e => !this.neighborIsInGroup(cellIndex, e, groupID))
    }
    if (islandID) {
      // print('trying islandID')
      let result = Direction.All.directions.filter(e => !this.neighborIsInIsland(cellIndex, e, islandID))
      // print(result)
      return result
    }
    return Direction.All.directions.filter(e => !this.neighborIsAvailable(cellIndex, e))
  }

  //TODO: add sort??
  exposedSides({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.isCardinal)
      .map(f => this.cellAt(cellIndex).side(f))

  }
  //TODO: add sort??
  exposedCorners({ cellIndex, groupID, islandID } = {}) {
    return this.exposedDirections({ cellIndex, groupID, islandID })
      .filter(e => e.isOrdinal)
      .map(f => this.cellAt(cellIndex).corner(f))
    // .sort((a, b) => a.y - b.y || a.x - b.x)
  }

  cellIsIsolated({ cellIndex, groupID, islandID, directions = Direction.Cardinal.directions } = {}) {
    // print('cellIsIsolated')
    // print(cellIndex)
    // print(groupID)
    // print(islandID)
    // print('directions')
    // print(directions)

    const result = this.exposedDirections({ cellIndex, groupID, islandID })
      // .map(e => e.value)
      .includesMany(directions, ['value'])
    // print('result')
    // print(result)
    return result
  }

  vertNormals({ cellIndex, groupID, islandID, directions = Direction.Ordinal.directions } = {}) {
    return directions.map(e => {
      const adj = OpArray.from(e.adjacents)
      const exposed = OpArray.from(this.exposedDirections({ cellIndex: cellIndex, groupID: groupID, islandID: islandID }))
      const exposedAdj = adj.intersect(exposed, ['value'])
      const exposedDirect = exposed.some(f => f.value === e.value)
      // print(adj)
      // print(exposed)
      // print(exposedAdj)
      // print(exposedDirect)

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

  neighbors(cellIndex) { return Direction.All.directions.map(e => this.neighbor(cellIndex, e)) }
  availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(e => e.available) }
  takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(e => e.taken) }
  // #endregion
  // MARK: Selection Methods
  // #region Selection Methods

  cellBounds({ selection = this.cells, groupID, islandID } = {}) {
    return new SelectionBounds({ selection: selection, grid: this, groupID: groupID, islandID: islandID })
  }

  validNeighbors({ selection = this.cells, bounds = this.cellBounds(), directions = Direction.All.directions } = {}) {
    // print('validNeighbors selection')
    // print(selection)
    // print('validNeighbors directions')
    // print(directions)
    let cells = OpArray.from(new Set(selection.flatMap(e => e.validNeighborsCoords(directions, bounds))))
      .unique(['x', 'y']) // unique based upon x and y values
      .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y then x values
      .map(e => this.cellAtCoords(e.x, e.y)) // map to cells
      .exclude(selection, ['x', 'y']) // exclude objects with same x and y values
    // print('validNeighbors cells')
    // print(cells)
    return cells
  }

  allExposedSides({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedSides({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .sort((a, b) => a.verts.start.y - b.verts.start.y || a.verts.start.x - b.verts.start.x) // sort by y, x 
  }

  allExposedCorners({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.exposedCorners({ cellIndex: e.index, groupID: groupID, islandID: islandID }))
      .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y, x 
  }

  allVertNormals({ selection, groupID, islandID } = {}) {
    return selection
      .flatMap(e => this.vertNormals({ cellIndex: e, groupID: groupID, islandID: islandID }))
    // .sort()
  }
  //TODO: add transform functionality
  //NOTE: Transform requires: transformed cells, transformed bounds, and transformed direction
  //NOTE: don't change selection to 2Darray, input 1D array as param from transformer 
  findIslands({ selection, bounds = this.cellBounds(), groupID, islandID, direction = Direction.All, taken = true, stored = true } = {}) {
    let cells
    if (!groupID && !islandID) {
      if (taken) { cells = this.takenCells }
      else { cells = this.availableCells }
    }
    else {
      cells = OpArray.from(selection)
    }
    let tempIslands = new OpArray
    // print('findIsland cells')
    // print(cells)
    // print('islandID')
    // print(`Island islandID: ${islandID}`)

    while (cells.length > 0) {
      let cell = cells[0]
      let islanders = OpArray.from([cell])
      let fillstack = []
      findIslanders({ cell: cell, grid: this, bounds: bounds, directions: direction.directions, groupID: groupID, islandID: islandID, taken: taken })
      cells = cells.exclude(islanders, ['id'])
      islanders.forEach(e => e.islandChecked = false)
      // print(`islanders`)
      // print(islanders)
      // print(`cells`)
      // print(cells)

      let island = new Island({
        cells: islanders,
        parent: this.parent,
        grid: this,
        groupID: groupID,
        parentIslandID: islandID,
        direction: direction,
        stored: stored,
      })
      // island.createShape()
      if (stored) {
        // print(island)
        this.islands.push(island)
      }
      // else { 
      tempIslands.push(island)
      // }

      //NOTE: Non-recursive flood-fill implementation from: https://codeguppy.com/blog/flood-fill/index.html
      function findIslanders({ cell, grid, bounds: bounds, directions, groupID, islandID, taken } = {}) {
        fillstack.push(cell)
        // print('fillstack 1st')
        // print(fillstack)

        while (fillstack.length > 0) {
          let current = fillstack.pop()
          // print('current')
          // print(current)
          // print('fillstack 2nd')
          // print(fillstack)
          if (current.islandChecked) { continue }
          let neighbors = grid.validNeighbors({ selection: [current], bounds: bounds, directions: directions })
            .filter(e => !e.islandChecked)
          // print('neighbors')
          // print(neighbors)
          // print(taken, islandID)
          if (taken) {
            if (groupID) { neighbors = neighbors.filter(e => e.groupID === groupID) }
            if (islandID) { neighbors = neighbors.filter(e => e.islandIDs.has(islandID)) }
            else { neighbors = neighbors.filter(e => e.taken) }
          } else {
            // print(`neighbor islandID: ${islandID}`)
            if (groupID) { neighbors = neighbors.filter(e => e.groupID !== groupID) }
            if (islandID) { neighbors = neighbors.filter(e => !(e.islandIDs.has(islandID))) }
            else { neighbors = neighbors.filter(e => e.available) }
          }
          // print(neighbors)

          neighbors.forEach(e => fillstack.push(e))
          current.islandChecked = true
          islanders.push(current)
          islanders = islanders
            .unique(['id'])
            .sort((a, b) => a.y - b.y || a.x - b.x) // sort by y then x values
          // print('islanders')
          // print(islanders)
        }
      }
    }
    //TODO: need to keep this in mind in regards to find Islands new temp/non-stored use case
    if (stored) { this.updateCells() }
    // else { 
    return tempIslands
    // }
  }
  // #endregion
  // TODO: deprecate
  // drawCellsAsDivs() { return this.cells.map(e => { return e.drawCellAsDiv(Look.testCell()) }) }

  // MARK: Setup Methods
  // #region Setup Methods
  cellRowsRotated(selection = this.cellRows, degree = 90) { return selection.rotated2D(normalizeDegree(degree)) }
  cellRowsFlipped(selection = this.cellRows, direction = "negOrdinal") { return selection.flipped2D(direction) }

  #createRowsArray() {
    let size = this.gridSize
    let rows = new OpArray(size.y)
    for (let j = 0; j < size.y; j++) {
      let row = new OpArray(size.x)
      for (let i = 0; i < size.x; i++) {
        let index = this.index(i, j)
        row[i] = new Cell({
          parent: this,
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

  // #endregion

  // MARK: Grid Grammar Ops
  // #region Grid Grammar Ops
  insetCells(amount, groupID) {
    let cells
    // print(this.cells.map(e => e.groupID))
    if (groupID) { cells = this.cells.filter(e => e.groupID === groupID) }
    else { cells = this.cells }
    // print(cells)
    cells.forEach(e => e.inset(amount))
  }
  randomComb({
    keepRange = range(2, 7),
    dropRange = range(2, 7),
    start = 0
  } = {}) {
    let selection = this.availableCells.randCombReduce({ keepRange: keepRange, dropRange: dropRange, start: start, })
    this.assign(selection)
  }

  comb({ keep = 2, drop = 1, start = 0 } = {}) {
    this.randomComb({ keepRange: range(keep, keep), dropRange: range(drop, drop), start: start })
  }

  randGroup(amount) {
    let selection = this.availableCells.randReduce(amount)
    this.assign(selection)
  }

  groupAvail() {
    let selection = this.availableCells
    this.assign(selection)
  }

  outlineGroup(num) {
    // let selection = this.validNeighbors(this.groups[num].cells)
    let selection = this.groups[num].validNeighbors
    this.assign(selection)
  }

  outlineTaken(direction = Direction.All) {
    let selection = this.validNeighbors({ selection: this.takenCells, directions: direction.directions })
    this.assign(selection)
  }
  // #endregion

  // MARK: General Grammar Methods
  // #region General Grammar Methods
  assign(selection, group) {
    if (!group) { group = new CellGroup(this, this) }
    group.cells = selection
    this.groups.push(group)
    this.updateCells()
  }

  // assignIsland(selection, island, group) {
  //   if (!island) { island = new Island({ parent: this.parent, grid: this, group: group }) }
  //   island.cells = selection
  //   this.islands.push(island)
  //   this.updateCells()
  // }

  //FIXME: need to rethink this in regards to find Islands new temp/non-stored use case
  //FIXME: if groupID or islandID is given, only update cells in that group or island
  updateCells({ groupID, islandID } = {}) {
    if (!groupID) {
      this.groups.forEach(group => {
        group.cells.forEach(cell => {
          let thisCell = this.cells[cell.index]
          thisCell.groupID = group.id
          thisCell.available = false
          thisCell.color = group.color
        })
      })
    }

    if (!islandID) {
      // print(this.islands)
      this.islands.forEach(island => {
        island.cells.forEach(cell => {
          let thisCell = this.cells[cell.index]
          if (thisCell) {
            thisCell.islandIDs.add(island.id)
            thisCell.color = island.color
          }
        })
      })
    }
  }
  // #endregion

  // MARK: Setup Methods
  // #region Setup Methods
  assignElement() {
    // if (this.parentIsBody) {
    this.p5Elt = createSVGElt('rect')
      .id(this.id)
      .parent(this.parentP5Elt)
      .addToClassList(this.id)
      .addToClassList(this.parentP5Elt.elt.classList.value)
    //   document.body.appendChild(this.p5Elt.elt)
    // }
  }

  drawElement(look = this.testLook) {
    this.p5Elt
      // .look(look)
      // .attribute(SVG.viewBox, `0 0 100 200`)
      // .attribute('preserveAspectRatio', 'xMidyMid')
      .attribute('x', `${20}`)
      .attribute('y', `${20}`)
      .attribute('width', `${60}`)
      .attribute('height', `${160}`)
      .attribute('fill', 'red')
      .attribute('stroke', 'blue')
    // .attribute('style', 'fill : green')
    // .style(CS.border, '1px dashed blue')

    // this.testElements()
  }

  testElements() {
    let testRect = createSVGElt('rect')
      .id('testRect')
      .attribute(SVG.viewBox, `0 0 100 200`)
      .attribute('preserveAspectRatio', 'xMidyMid')
      .attribute('width', `${90}`)
      .attribute('height', `${180}`)
      .attribute('x', `${10}`)
      .attribute('y', `${10}`)
      // .attribute('stroke', 'red')
      .attribute('style', 'fill : green')
      // .style('fill', 'orange')
      // .style('border-radius', '20px')
      // .style('stroke', 'green')
      // .style('stroke-width', '2')
      // .attribute('stroke-width', '0.25')
      // .style(CS.border, 'dashed red')
      // .style('border', 'dashed red')
      // .style(CS.border, '1px dashed blue')

      .parent(this.p5Elt)

      // .attribute('cx', `${50}`)
      // .attribute('cy', `${100}`)
      .attribute('rx', `${5}`)
      .attribute('ry', `${5}`)

    // .dropShadow({ color: red })

  }
  // #endregion
}

// CLASS: CellGroup
class CellGroup extends ProtoLayer {
  grid
  cells
  color

  constructor(parent, grid) {
    super(parent)
    this.grid = grid
    this.finishSetup(S.Groups)
    this.cells = OpArray.from(grid.cells)
    this.color = R.random_hash(3, '#')
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'group') }

  // get boundsRect() { return this.parent.boundsRect }

  get cellsByIndex() { return this.cells.sort((a, b) => a.index - b.index) }
  // #endregion
  // MARK: Grid Properties
  // #region Grid Properties
  get xValues() { return this.grid.xValues(this.cells) }
  get yValues() { return this.grid.xValues(this.cells) }

  get xMin() { return this.grid.xMin(this.cells) }
  get xMax() { return this.grid.xMax(this.cells) }
  get yMin() { return this.grid.yMin(this.cells) }
  get yMax() { return this.grid.yMax(this.cells) }

  get cellBounds() { return this.grid.cellBounds(this.cells) }
  get cellBoundsWidth() { return this.grid.cellBoundsWidth(this.cells) }
  get cellBoundsHeight() { return this.grid.cellBoundsHeight(this.cells) }

  get topRowCells() { return this.grid.topRowCells(this.cells) }
  get rightColCells() { return this.grid.rightColCells(this.cells) }
  get bottomRowCells() { return this.grid.bottomRowCells(this.cells) }
  get leftColCells() { return this.grid.leftColCells(this.cells) }
  get boundsCells() {
    return {
      top: this.topRowCells,
      right: this.rightColCells,
      bottom: this.bottomRowCells,
      left: this.leftColCells,
    }
  }

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
  exposedDirections(cellIndex) { return this.grid.exposedDirections({ cellIndex: cellIndex, groupID: this.id }) }
  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, groupID: this.id }) }
  exposedCorners(cellIndex) { return this.grid.exposedCorners({ cellIndex: cellIndex, groupID: this.id }) }
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
  // TODO: deprecate
  // drawCellsAsDivs() { return this.cells.map(e => { return e.drawCellAsDiv(Look.testCell()) }) }


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
  color

  constructor({ parent, grid, index, coords, available = true, color = '888' } = {}) {
    super(parent)
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.available = available
    this.color = color
    this.finishSetup(S.Cells)
    // print(this.id)
  }

  // MARK: Computed Properties
  // #region Computed Properties
  get anchor() { return this.grid.cellAnchor(this.coords.x, this.coords.y) }
  get size() { return this.grid.cellSize }
  // get insetSize() { return Vertex.sub(this.size, vert(this.insetAmount, this.insetAmount)) }

  get testLook() {
    // return Look.neuShade()
    return Look.test(this.size, 'cell')
  }

  get x() { return this.coords.x }
  get y() { return this.coords.y }
  get taken() { return !this.available }
  // #endregion
  // MARK: Geometry Methods
  // #region Geometry Methods
  neighborCoords(direction) {
    // print('neighborCoords direction')
    // print(direction)
    // print(this.coords)
    // print(direction.moveCoord)
    let result = Vertex.add(this.coords, direction.moveCoord)
    // print('neighborCoords result')
    // print(result)
    return result
  }
  allNeighborsCoords(directions = Direction.All.directions) {
    // print('allNeighborsCoords directions')
    // print(directions)
    let result = directions.map(e => this.neighborCoords(e))
    // print('allNeighborsCoords result')
    // print(result)
    return result
  }
  validNeighborsCoords(directions = Direction.All.directions, bounds = this.grid.cellBounds,) {
    // print('validNeighborCoords directions')
    // print(directions)
    let result = this.allNeighborsCoords(directions).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
    // print('validNeighborsCoords result')
    // print(result)
    return result
  }
  // #endregion


}

// CLASS: Island
class Island extends ProtoLayer {
  grid
  groupID
  parentIslandID
  cells
  shape
  direction
  color
  constructor({ cells, parent, grid, groupID, parentIslandID, direction = Direction.Cardinal, stored = true } = {}) {
    super(parent)
    this.cells = cells
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.parentIslandID = parentIslandID
    if (stored) { this.finishSetup(S.Islands) }
    // else { this.finishSetup() }
    // this.createShape()
    this.color = R.random_hash(3, '#')
    // print(this)

  }
  // MARK: Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'island') }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.groupID, islandID: this.id }) }
  get cellAnchor() { return this.cellBounds.cellAnchor }
  // get cellBoundsSize() { return this.grid.cellBoundsSize(this.cells) }
  // get boundsSize() { return this.grid.boundsSize(this.cells) }

  // get size() { return this.boundsSize }

  // get cellBoundsWidth() { return this.grid.cellBoundsWidth(this.cells) }
  // get cellBoundsHeight() { return this.grid.cellBoundsHeight(this.cells) }

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
  get isCardinal() {
    return !this.isSingle
      && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Ordinal.directions))
  }
  get isOrdinal() { return !this.isSingle && this.cells.every(e => this.cellIsIsolated(e.index)) }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, islandID: this.id })
  }

  get exposedCorners() {
    return this.grid.allExposedCorners({ selection: this.cells, islandID: this.id })
  }
  // #endregion


  // MARK: Methods
  // #region Methods
  // TODO: finish fixing final bugs
  createShape() {
    let segments = OpArray.format(this.exposedSegments)
    let subShapes = new OpArray
    // let thisShape = new Shape({ parent: this.parent, island: this })
    let shapeIter = 0
    let subShapeIter = 0
    // print('*** START createShape() ***')
    // print('START segments:')
    // print(segments.idMap)
    // print('thisShape')
    // print(thisShape)
    findShape(
      this.direction
      // { segments: segments, thisShape: thisShape }
    )
    let thisShape = new Shape({
      subShapes: subShapes,
      parent: this,
      island: this
    })
    this.shape = thisShape
    // thisShape.subShapes = subShapes
    // this.shape = thisShape
    // print(this)

    //FIXME: Occasional crash with unknown issue
    //FIXME: Frequent crash when using 'Ordinal' island generation
    function findShape(
      direction
      // { segments, thisShape } = {}
    ) {

      let segLength = segments.length
      // print(`segLength: ${segLength}`)

      // segments.pop()
      let subShape
      // print('segments')
      // print(segments)
      while (segments.length > 0) {
        // print('$$ START findShape() $$')
        shapeIter += 1
        // print(`$$ shape Iter = ${shapeIter}`)
        let segment = segments[0]
        subShape = new OpArray
        // print('segment')
        // print(segment)
        let fillstack = []
        findSubShape(segment, direction)
        console.error(`END SUBSHAPE ${shapeIter}`)
        // print('segments')
        // print(segments)
        segments = segments.exclude(subShape, ['id'])
        // print('segments exclude')
        // print(segments)

        subShapes.push(subShape)
        // segments.pop()
        // print(segments)

        // print(segments)
        // print('subShapes')
        // print(subShapes)
        // print('$$ END findShape() $$')
        //TODO: Complete method based on grid.findIslands


        function findSubShape(seg, direction) {

          fillstack.push(seg)

          while (
            fillstack.length > 0
            // && fillstack.length < 10
          ) {
            // print('@ START findSubShape() @')
            subShapeIter += 1
            // print(`@ subShape Iter = ${subShapeIter}`)
            let current = fillstack.pop()
            let nextSeg
            // print('pre-next endPoint')
            // print(current.endPoint)
            // print('pre-next subShape')
            // print(subShape.idMap)
            // print('pre-next segments')
            // print(segments.idMap)
            // print(segments)
            //find next segments (could be 2 if allowing ordinal island connections)
            let next = segments
              .filter(s => current.endPoint.equals(s.startPoint, 4))
              .compacted
            // print('findSubShape next:')
            // print(next)
            if (next.length === 0) {
              // print('next is empty')
              if (current.endPoint.equals(subShape[0].startPoint)) {
                // print('SUBSHAPE COMPLETE!')
                subShape.push(current)
                return
              }
              else { console.error('cannot continue segmentShape') }
            }
            if (next.length === 1) { nextSeg = next[0] }
            // else { console.error('unexpected single segment') }

            if (next.length === 2) {
              console.error('next has 2 segments')
              // let nextAngle
              let nextDirection
              if (direction.someAreOrdinal) {
                // print('negative')
                // nextAngle = current.angle - (PI / 2) % PI
                nextDirection = current.direction.previous(2)
              } else {
                // print('positive')
                // nextAngle = (current.angle + (PI / 2)) % PI
                nextDirection = current.direction.next(2)
              }
              // print(next.map(e => e.angle))
              // print(next.map(e => e.direction))
              // print(current.angle)
              // print(current.direction)
              // print(nextDirection)
              // print(current)
              // nextSeg = next.find(e => e.angle === nextAngle)
              nextSeg = next.find(e => e.direction.equals(nextDirection))
              // print(nextSeg)
              if (nextSeg === undefined) { console.error('unexpected 2nd segment') }
            }
            // print('findSubShape nextSeg:')
            // print(nextSeg)


            fillstack.push(nextSeg)
            subShape.push(current)
            // print('findSubShape subShape')
            // print(subShape.idMap)
            // print('findSubShape segments')
            // print(segments.idMap)
            segments = segments.exclude(subShape, ['id'])
            // print('findSubShape segments exclude')
            // print(segments.idMap)
            // print('fillstack:')
            // print(fillstack)
            // print('@ END findSubShape() @')
          }
        }
      }
    }
    // print(`END Shape Test`)

  }


  cellIsIsolated(cellIndex, directions = Direction.Cardinal.directions) {
    return this.grid.cellIsIsolated({ cellIndex: cellIndex, islandID: this.id, directions: directions })
  }

  exposedSides(cellIndex) { return this.grid.exposedSides({ cellIndex: cellIndex, islandID: this.id }) }

  assignNormals() {

  }
  // #endregion

  drawElement(look = this.testLook) {
    this.p5Elt
      .style(CS.overflow, 'visible')
      .look(look)
      .size(this.insetSize.x, this.insetSize.y)
      .position(this.insetAnchor.x, this.insetAnchor.y)
  }
}

// CLASS: Shape
class Shape extends ProtoLayer {
  // segments
  // outerShape
  island
  subShapes
  color
  testVerts
  testColor

  constructor({ subShapes, parent, island } = {}) {
    super(parent)
    this.subShapes = subShapes
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.finishSetup(S.Shapes)
  }

  get testLook() { return Look.test(this.size, 'shape') }

  get cellBounds() { return this.island.cellBounds }
  get boundsRect() { return this.island.boundsRect }

  // get size() { return this.cellBounds.size }

  get group() { return this.island.group }
  get grid() { return this.island.grid }

  get turns() { return this.subShapes.map(e => this.createTurns(e)) }
  get svg() { return this.subShapes.map(e => ProtoSVG.segsToSVG({ segments: e })) }
  // get svg() { return ProtoSVG.segsToSVG({ segments: this.subShapes[0] }) }
  get svgPath() { return `path('${this.svg.join(' ')}')` }
  get extractedVerts() { return extractVerts(this.svg) }

  createTurns(segments) {
    print('segments')
    print(segments)
    let segs = OpArray.from(segments)
    print('segs')
    print(segs)
    let turns = new OpArray
    let prev = segs.last()
    segs.forEach((e, i) => {
      const turn = prev.direction.turnTo(e.direction)
      turns.push(turn)
      prev = e
    })
    return turns
  }

  assignID() { this.id = this.store.add(this) }
  assignElement() {
    this.p5Elt = createSVG(this.insetSize.x, this.insetSize.y)
      .html(TestMode ? this.id : '')
      .id(this.id)
      .parent(this.parentP5Elt)
      .addToClassList(this.id)
      .addToClassList(this.parentP5Elt.elt.classList.value)
  }



  drawElement(look = this.testLook) {
    let path = createSVGElt('path')
    path
      .attribute('d', this.svg)
      .attribute('fill', '#0002')
      .attribute('stroke', 'red')
    // .attribute('stroke-width', '1')
    // .attribute('stroke-dasharray', '10 20 30 20')
    // .attribute('stroke-linecap', 'round')
    // .attribute('overflow', 'hidden')
    // .attribute('width', `${this.cellBounds.size.x}`)
    // .attribute('height', `${this.cellBounds.size.y}`)
    // .attribute('style', `position: absolute; width: 100%; height: 100%`)
    // .position(0, 0)
    // .position(0 - this.cellBounds.anchor.x, 0 - this.cellBounds.anchor.y, 'absolute')
    // .position(this.insetAnchor.x, this.insetAnchor.y)

    // let newOffset = this.parent.size.sub(this.cellBounds.size)
    // print(this.parent.size.sub(this.cellBounds.size))

    this.p5Elt
      .child(path)
      // .look(look)
      // .look(Look.islandShape(this.svgPath, this.testColor))
      // .position(this.insetAnchor.x, this.insetAnchor.y)
      .position(0 - this.cellBounds.anchor.x, 0 - this.cellBounds.anchor.y, 'absolute')
      // .attribute('style', 'position: absolute')
      // .position(this.insetAnchor.x, this.insetAnchor.y)
      // .attribute(SVG.viewBox, `-29, -13, ${this.cellBounds.size.x + 58}, ${this.cellBounds.size.y + 26}`)
      .attribute(
        SVG.viewBox,
        `${0}, ${0}, ${this.cellBounds.size.x + this.cellBounds.anchor.x}, ${this.cellBounds.size.y + this.cellBounds.anchor.y}`)
      .attribute('enable-background', 'accumulate')

    this.testDrawVerts()
    // print(this)
    // print(this.size)
    // print(this.insetSize)
  }

  testDrawVerts() {
    if (!this.testVerts) {
      this.testVerts = drawPointsAtVerts({
        path: this.svgPath,
        parent: this.parentP5Elt,
        size: (this.grid.cellSize.x / 32),
        offset: this.insetAnchor
      })
    }

    if (testingControls.shapeVerts) { this.testVerts.forEach(e => e.show()) }
    else { this.testVerts.forEach(e => e.hide()) }

  }

  //NOTE: DELETE
  // drawElement(look = this.testLook) {
  //   this.p5Elt
  //     .look(look)
  //     .size(this.insetSize.x, this.insetSize.y)
  //     .position(this.insetAnchor.x, this.insetAnchor.y)
  //   if (this.taken) {
  //     this.p5Elt
  //       .look(Look.testCell(testingControls.testColors ? this.color : '#0000'))
  //   }
  //   if (this.available) {
  //     this.p5Elt
  //       .look(Look.blankTestCell())
  //   }


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
    // if (this.p5Elt.size < protoMinSize) { return }
    // if (this.depth > protoMaxDepth) { return }
    if (this.grid.isFull) { return }

    while (this.mods.length > 1) {
      this.mods.forEach.process()
    }

    let result = this.grammar[0]
    // delete used grammar
  }

  assign(selection, group) {
    if (!group) { group = new CellGroup({ parent: this.grid, grid: this.grid }) }
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





