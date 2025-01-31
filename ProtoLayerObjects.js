// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: PROTOLAYER CLASS 
//conforms to IdentifiableStored and Debuggable
// SIZE: 326 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ProtoLayer {
  id
  _type
  protoParent   // ProtoLayer
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
    type,
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
    else { DeBug.error('protoParent is not valid') }
    if (svgParent) { this.svgParent = svgParent }
    this._type = type
    if (insetScale !== undefined) { this._insetScale = insetScale instanceof Vertex ? insetScale : vert(insetScale) }
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
  get padding() { return vert(20) }                                                                             //UNUSED:

  get testLook() { return SVGLook.test() }                                                                //UNUSED:
  get blackLook() { }                                                                                     //UNUSED:
  get protoLook() { return SVGLook.clear }                                                                //UNUSED:
  get testColor() { return protoColor(0, 230, 230, 1) }                                                   //UNUSED:

  get color() { return protoColor(230) }                                                                  //UNUSED:

  get look() {                                                                                            //UNUSED:
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

  get filterLoft() { return this._filterLoft ?? 0 }                                                       //UNUSED:
  get loft() { return this.protoParent.loft + this.filterLoft }                                           //UNUSED:
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
    // return memoize(() => {
    return vert(this.boundsRect.x, this.boundsRect.y)
    // }, `anchor`).call(this)
  }
  //MEMO: size
  get size() {                            // taken from this.boundsRect
    // return memoize(() => {
    return vert(this.boundsRect.width, this.boundsRect.height)
    // }, `size`).call(this)
  }
  //MEMO: insetSize
  get insetSize() {                       // calc from this.size and this.insetScale
    // return memoize(() => {
    return Vertex.mult(this.size, this.insetScale)
    // }, `insetSize`).call(this)
  }
  //MEMO: insetAnchor
  get insetAnchor() {                     // calc from this.insetSize and this.size
    // return memoize(() => {
    return this.anchorFor(this.insetSize)
    // }, `insetAnchor`).call(this)
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
      return new Corners([this.anchor, Vertex.add(this.anchor, this.size)])
    }, `corners`).call(this)
  }
  //MEMO: sides
  get sides() {
    return memoize(() => {
      const isCell = this.type === 'Cell'
      const simpleSides = this.corners.sides.obj

      const sidesObj = simpleSides.map((side, key) => {
        // DeBug.log(`sides side, key`, side, key)
        const midPoint = segment(side.start, side.end).mid
        const points = OpArray.format([side.start, midPoint, side.end])
        const sideDir = Sides.Directions[key]
        let cells
        if (isCell) { cells = OpArray.format(this) }
        // if(this.type==='Grid') {}
        // DeBug.log(`points`, points)
        // DeBug.log(`sideDir`, sideDir)
        return protoSegment({
          start: side.start,
          end: side.end,
          parentID: this.id,
          islandIDs: isCell ? this.islandIDs : undefined,
          id: `${this.id}-${key}Side`,
          cells: isCell ? OpArray.format(this) : undefined,
          points: isCell ? points : undefined,
          sideDir: isCell ? sideDir : undefined,
          grid: this.grid
        })
      })
      // DeBug.log(`sidesObj`, sidesObj)
      // DeBug.log(`this`, this)
      // return sidesObj
      return new Sides(sidesObj)

    }, `sides`).call(this)
  }
  //MEMO: midPoints
  get midPoints() {
    return memoize(() => {
      return this.sides.obj.map(side => side.mid)
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

  //METH: equals()
  equals(protoLayer) { return this.id === protoLayer.id }
  // MARK: Settings Methods
  // #region 
  //METH: setType()
  setType(toType) { this._type = toType }
  //METH: setInsetScale()
  setInsetScale(scale) {
    this._insetScale = scale instanceof Vertex ? scale : vert(scale)
    // DeBug.log('ProtoLayer insetScale', this.insetScale)
    this.drawElement()
  }
  //METH: setFilter()
  setFilter(filter) {
    // DeBug.log(`setting filter of ${this.id} to ${filter?.id}`)
    this._filter = filter
    // this.drawElement()
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
      // DeBug.groupCollapsed(`assignElement ${this.id}`)
      // DeBug.warn(this.cellBounds())
      if (this.drawSVG) {
        // DeBug.log(`${this.id} layout SVG: anchor: ${this.anchor.string}, size: ${this.size.string}`)
        // DeBug.log(`assignElement `, this)
        this.svgElt = createSVGElt().id(this.id)
          .parent(this.svgParent)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
          .layout(this.anchor, this.size, this.padding)
          .viewBox(this.anchor, this.size, this.padding)
      }

      if (this.drawRect) {
        // DeBug.log(`${this.id} layout rect: insetAnchor: ${this.insetAnchor.string}, insetSize: ${this.insetSize.string}`)
        this.rect = createSVGElt('rect').id(`${this.id}-frontRect`)
          .parent(this.svgElt)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
          .layout(this.insetAnchor, this.insetSize)
      }
      // DeBug.groupEnd()
    }
  }
  //METH: 
  drawElement() {
    if (this.drawSVG || this.drawRect) {
      // DeBug.groupCollapsed(`drawElement ${this.id}`)
      if (this.drawSVG) {
        // DeBug.log(`${this.id} layout SVG: anchor: ${this.anchor.string}, size: ${this.size.string}`)
        this.svgElt
        // .layout(this.anchor, this.size, this.padding)
        // .viewBox(this.anchor, this.size, this.padding)
        // .style('image-rendering', `high-quality`)
      }
      if (this.drawRect) {
        // DeBug.log(`${this.id} assignElement layout rect: insetAnchor: ${this.insetAnchor.string}, insetSize: ${this.insetSize.string}`)
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
      // DeBug.groupEnd()
    }
  }
  // #endregion
}
// MIXIN: ProtoLayer Mixin/Protocol Assignment
Object.assign(ProtoLayer.prototype, IdentifiableStored)
Object.defineProperties(ProtoLayer.prototype, Object.getOwnPropertyDescriptors(Debuggable))

//MARK: FRAME CLASS
// SIZE: 369 lines
// NOTE: drawSVG = true
// NOTE: drawRect = true
class Frame extends ProtoLayer {
  bleed             // Black Backing
  bleedRect
  sheetRect
  frameRect
  cornerRadius = 5
  grid
  backGrid
  backGroup
  mask = true

  constructor(svgParent) {
    super({
      protoParent: svgParent,
      insetScale: 1,
      drawRect: false,
      type: 'Frame',
    })
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
    return memoize(() => {
      const ctm = this.svgElt.elt.getScreenCTM()
      return ctm.a
    }, `pixToUserUnits`).call(this)
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
  //METH: setGrid()
  setGrid(grid) {
    this.grid = grid
    this.createBackGrid(grid)
    this.grid.backGrid = this.backGrid
    this.backGrid.frontGrid = grid
    BGRID = this.backGrid

    console.log(`this.grid`, this.grid)
    console.log(`this.backGrid`, this.backGrid)
    this.backGrid.backElt = this.grid.backElt
    this.backGrid.comboElt = this.grid.comboElt
    this.backGrid.highElt = this.grid.highElt
    this.backGrid.shadElt = this.grid.shadElt
    this.backGrid.shaderElts = this.grid.shaderElts
  }
  // setBackGrid(grid) {
  //   this.backGrid = grid
  // }
  //METH: createBackGrid()
  createBackGrid(grid, mode = 0) {
    this.backGrid = new Grid({
      gridType: 3,
      protoParent: this,
      gridSize: grid.gridSize,
      insetScale: grid.insetScale,
      gridStyle: grid.gridStyle,
    })
    grid.svgElt.parent(this.svgElt)                                  // re-parent grid to put layer on top of backGrid
  }
  //METH: setBackGridCells()
  setBackGridGroup(mode = 1, wrap = true, cuts) {
    const [grid, backGrid] = [this.grid, this.backGrid]

    if (mode === 0) {
      this.backGroup = backGrid.groupAvail()

      // this.backGroup = backGrid.groupFromIndices(indices)
    }

    //NOTE: assign backgroup
    if (mode === 1) {
      let indices = grid.takenCells.map(c => c.index)
      const inner = grid
        .shrunkSelection(this.cells, 1, Direction.All)
        .map(c => c.index)
      // indices = indices.union(inner)                             //
      this.backGroup = backGrid.groupFromIndices(indices)
    }

    this.backGroup.setType(`BackGroup`)
    DeBug.error(`this.backGroup`, this.backGroup)

    //NOTE: remove holes
    const oppositeNeighbored = () => {
      return backGrid.availableCells.filter(c => c.hasOppositeNeighborsTaken)
    }
    let opps = oppositeNeighbored()
    while (opps.length > 0) {
      backGrid.assignCells(opps, this.backGroup.id)
      opps = oppositeNeighbored()
    }
    // DeBug.log(`oppositeNeighbored`, opps)

    //NOTE: createPerimeters and createSimpleSubShapes
    this.backGroup.createPerimiters(Direction.All, true)
    backGrid.createSimpleSubShapes()

    //NOTE: curveMinRadiusCorners
    backGrid.curveMinRadiusCorners({ all: true })

    //NOTE: curve remaining loose corners (all non-minRadius corners)
    const looseCorners = backGrid.allSimpleSubShapesSegs
      .filter(s => s.canCurveMoreAtEnd)


    DeBug.warn(`backGrid`, backGrid)
    DeBug.warn(`flushWrap corners`, looseCorners)
    DeBug.warn(`wrappers`, looseCorners.map(s => [s.flushInWrapper, s.adjInWrapper]))
    DeBug.warn(`dists`, looseCorners.map(s => [s.flushIntersectObjs.first?.dist, s.adjIntersectObjs.first?.dist]))
    DeBug.warn(`intObjs`, looseCorners.map(s => [s.id, s.flushIntersectObjs.first, s.adjIntersectObjs.first]))
    if (wrap) {
      looseCorners.forEach(s => {
        if (s.flushInWrapper && s.adjInWrapper) {
          if (s.hasCoincidentCorner(s.flushInWrapper)
            || s.flushIntersectObjs[0].dist < s.adjIntersectObjs[0].dist
          ) {
            DeBug.log(`${s.id} hasBoth, flushWrapping!`, s.flushInWrapper)
            s.flushWrap(true, false)
          } else {
            DeBug.log(`${s.id} hasBoth, adjWrapping!`, s.adjInWrapper)
            s.adjWrap(true, false)
          }
        } else {
          if (s.flushInWrapper) {
            DeBug.log(`${s.id} has flush, flushWrapping!`, s.flushInWrapper)
            s.flushWrap(true, false)
          }
          if (s.adjInWrapper) {
            DeBug.log(`${s.id} has adj, adjWrapping!`, s.adjInWrapper)
            s.adjWrap(true, false)
          }
          if (!s.inWrapper) {
            DeBug.log(`${s.id} has no inWrapper`)
            if (!s.endNeighbor.inWrapper) {
              // DeBug.log(s.endNeighbor.inWrapper)
              // DeBug.log(`neighbor has no inWrapper, midWrapping`)
              s.setArcToMiddle()
              s.endNeighbor.setArcToMiddle()
            } else {
              // DeBug.log(`neighbor has no inWrapper, maxWrapping`)
              s.replaceEndCurveOrigin(s.maxArcOrigin)
            }
          }
        }
      })
    }

    //NOTE: process stairs
    const shapes = this.backGroup.perimeterIslands
      .map(i => i.shape).flat()

    const segPaths = shapes
      .map(s => s.simpleSegPaths).flat()
    // .map(p => p.stairs).flat()
    DeBug.log(`backGroup segPaths`, segPaths)
    DeBug.log(`backGroup segPaths parts`, segPaths[0].path.map(s => s.part))

    // const diagPaths = segPaths.map(p => p.withDiagonals())
    // DeBug.log(`segPaths`, segPaths[0].path.map(s => [s.id, s.start.string, s.end.string]))
    // DeBug.log(`segPaths`, segPaths[0].diagonalsPath.map(s => [s.id, s.start.string, s.end.string]))
    // DeBug.log(`diagPaths`, diagPaths[0])
    // DeBug.log(`diagPaths cubicVerts`, diagPaths[0].map(s => [s.start.string, s.cubicVerts.start?.string, s.cubicVerts.end?.string, s.end.string]))

    // shapes.forEach((s, i) => s.simpleSubShapes = diagPaths)


    // backGrid.maximizeCuddles()
    //NOTE: calculate padWidth
    DeBug.log(``)
    DeBug.warn(`padWidth calculation`)
    DeBug.log(`grid.insetAmount.x`, grid.insetAmount.x)
    DeBug.log(`grid.cellRadius`, grid.cellRadius)
    // const padWidth = ((grid.insetAmount.x / grid.cellRadius || grid.cellRadius)) / 2
    const padWidth = (1 + (grid.insetAmount.x / grid.cellRadius || grid.cellRadius)) / 2
    //ARROW: scaled()
    const scaled = (amount) => {
      // const padWidth = (1 + (grid.insetAmount.x / grid.cellRadius || grid.cellRadius)) / 2
      const actual = range(1 + grid.cellOutset, padWidth * 2)
      const useful = range()
      return useful.convertRange(amount, actual)
    }

    DeBug.error(`padWidth`, padWidth)
    DeBug.log(``)
    //NOTE: cut flat backing island (no cut, just fill actually)
    this.backGroup.cutIslands({
      // profile: Profile.jIn,
      isFrame: true,
      layerStart: scaled(1),
      amount: 1,
      loftScale: 1 / 1,
      addBacking: false,
    })
    //NOTE: make real cuts
    cuts.forEach(cut => {
      this.backGroup.cutIslands({
        profile: Profile[cut.profile],
        isFrame: true,
        layerStart: scaled(cut.start),
        layerEnd: scaled(cut.end),
        amount: cut.amount,
        loftScale: 1 / 1,
        // addBacking: true,
      })
    })

    DeBug.log(`backGroup`, this.backGroup)

    this.backGroup.shapeGroups.forEach(sg => {
      // DeBug.log(`svgGroupElt`, sg.svgGroupElt)
      // sg.drawFilter = false

      sg.svgGroupElt
        .attribute(`fill`, frameColor)
      // .attribute('fill', protoColor(130))
      // .attribute('fill', `green`)
      // .attribute('opacity', 1)
      // sg.drawElement()
      // .attribute('opacity', 0)
      // .attribute('stroke', 'white')
      // .attribute('stroke-width', `.0625`)

    })

    if (this.mask) { this.maskFrame() }

  }

  //METH: maskFrame()
  maskFrame() {
    let defs = createSVGElt(`defs`)
      .parent(this.svgElt)

    const maskID = `${this.id}-mask`
    const frameMask = createSVGElt(`mask`)
      .id(maskID)
      .attribute(`maskUnits`, 'userSpaceOnUse')
      .parent(defs)

    DeBug.log(`shapeGroups`, this.backGroup.shapeGroups[0].svgElt)

    const gridClone = this.backGroup.shapeGroups[0].svgGroupElt.elt.cloneNode(true)

    const paths = gridClone.querySelectorAll('path')
    DeBug.log(paths)
    paths.forEach(p => p.setAttribute(`fill`, `white`))

    frameMask.elt.appendChild(gridClone)

    this.svgElt.attribute(`mask`, `url(#${maskID})`)
  }
  // //METH: setBackGridCells()
  // setBackGridGroup(indices) {
  //   this.backGroup = this.backGrid.groupFromIndices(indices)
  //   this.backGroup.createPerimiters('maxCorners', Direction.Cardinal)
  //   this.backGrid.createSimpleSubShapes()
  //   // this.backGrid.maximizeCuddles()
  //   this.backGroup.cutIslands({
  //     profile: Profile.jIn,
  //     layerStart: 2,
  //     layerEnd: 1.5,
  //     amount: 1,
  //     loftScale: 1 / 1,
  //   })
  // }


  // MARK: Frame Setup Methods
  // #region Setup Methods
  //METH: assignElement()
  assignElement() {
    this.bleed = createSVGElt().id('bleed')
      .parent(this.svgParent)
      .viewBox(-5, -10, 110, 220)
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)

    this.bleedRect = createSVGElt('rect').id(`${this.id}-bleedRect`)
      .parent(this.bleed)
      .layout(-15, -10, 130, 220)

    super.assignElement()

    this.svgElt
      .parent(this.bleed)
      .touchEnded(shadeAnimation)
      .mouseReleased(shadeAnimation)

    if (this.drawRect) {
      this.frameRect = createSVGElt('rect').id(`${this.id}-backRect`)
        .parent(this.bleed)
        .addToClassList(this.id)
        .layout(this.anchor, this.size)
    }

  }

  //METH: drawElement()
  drawElement() {
    this.bleed
    // .attribute('fill', '#e24')
    // .attribute('width', `${frameSize.x}`)
    // .attribute('height', `${frameSize.y}`)

    this.bleedRect
    // .attribute('fill', frameColor)
    // .attribute('fill', '#e24')
    // .attribute('fill', 'black')
    // .attribute(`fill`, `white`)


    super.drawElement()

    if (this.drawRect) {
      this.frameRect
        .attribute(`pointer-events`, `none`)
        // .parent(this.bleed)
        .layout(this.anchor, this.size)
        // .attribute('rx', `${this.cornerRadius}`)
        // .attribute('ry', `${this.cornerRadius}`)
        // .attribute('fill', ProtoColor.randomHighHue().setSaturation(10))
        // .attribute(`fill`, frameColor)
        // .attribute(`fill`, 'black')
        .attribute('fill-opacity', '0')
      // .attribute('stroke', 'red')
      // .attribute('stroke-width', `.0625`)
      // .applyFilter({ filter: this.filter, size: this.size, padding: vert(20) })
    }
  }
  // #endregion
}

//MARK: SelectionBounds CLASS
// SIZE: 397 lines
// NOTE: drawSVG = false    // SelectionBounds is not a ProtoLayer subClass 
// NOTE: drawRect = false   // SelectionBounds is not a ProtoLayer subClass 
class SelectionBounds {
  selection
  grid
  groupID
  islandID
  isGroupBounds = false
  isIslandBounds = false

  constructor({ selection, grid, groupID, islandID } = {}) {
    if (selection.is2D) { selection = selection.flat() }
    this.selection = selection.sort((a, b) => a.index - b.index)
    this.grid = grid
    if (groupID) {
      this.groupID = groupID
      this.isGroupBounds = true
    }
    if (islandID) {
      this.islandID = islandID
      this.isIslandBounds = true
    }
  }


  // MARK: SelectionBounds Properties
  // #region Properties
  get selectionCount() { return this.selection.length }
  get availableCount() { return this.availableCells.length }
  get cellBoundsCount() { return this.columnCount * this.rowCount }

  get cellSize() { return this.grid.cellSize }
  get boundCellRows() { return this.grid.cellSpanRowsBetween(...this.spanCellIndices) }
  get boundCellColumns() { return this.boundCellRows.flipped2D(Direction.NegOrdinal) }
  get boundsCells() { return this.grid.cellSpanBetween(...this.spanCellIndices) }
  get availableCells() { return this.boundsCells.exclude(this.selection, ['id']) }

  // get cellRows() { return this.grid.cellRows }
  // get cellColumns() { return this.grid.cellColumns }

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

  // get xMinMax() { return vert(this.xCellMin, this.xCellMax) }                                     //UNUSED:
  // get yMinMax() { return vert(this.yCellMin, this.yCellMax) }                                     //UNUSED:
  //MEMO: cellsBoundsSeg
  get cellsBoundsSeg() {
    return memoize(() => {
      return segment(vert(this.xCellMin, this.yCellMin), vert(this.xCellMax, this.yCellMax))
    }, `cellsBoundsSeg`).call(this)
  }
  //MEMO: cellsBounds
  get cellsBounds() {
    return memoize(() => {
      return findBounds(this.cellsBoundsSeg)
    }, `cellsBounds`).call(this)
  }

  // get upRowCells() {
  //   return memoize(() => {
  //     return this.selection.filter(e => e.y === this.yCellMin).flat()
  //   }, `upRowCells`).call(this)
  // }
  // get rightColCells() {
  //   return memoize(() => {
  //     return this.selection.filter(e => e.x === this.xCellMax).flat()
  //   }, `rightColCells`).call(this)
  // }
  // get downRowCells() {
  //   return memoize(() => {
  //     return this.selection.filter(e => e.y === this.yCellMax).flat()
  //   }, `downRowCells`).call(this)
  // }
  // get leftColCells() {
  //   return memoize(() => {
  //     return this.selection.filter(e => e.x === this.xCellMin).flat()
  //   }, `leftColCells`).call(this)
  // }
  get outerCells() {
    //ARROW: calcCells()
    const calcCells = (row, min) => {
      const xy = row ? `y` : `x`
      const minMax = min ? `Min` : `Max`
      const xyMinMax = `${xy}Cell${minMax}`
      return this.selection.filter(e => e[xy] === this[xyMinMax]).flat()
    }

    return memoize(() => {
      return new Sides([
        calcCells(true, true),
        calcCells(false, false),
        calcCells(true, false),
        calcCells(false, true),
      ])
      // return new Sides([
      //   this.upRowCells,
      //   this.rightColCells,
      //   this.downRowCells,
      //   this.leftColCells,])
    }, `outerCells`).call(this)
  }

  get cornerCellVerts() {
    return new Corners([
      vert(this.xCellMin, this.yCellMin),   //  upLeft
      vert(this.xCellMax, this.yCellMin),   //  upRight 
      vert(this.xCellMax, this.yCellMax),   //  downRight 
      vert(this.xCellMin, this.yCellMax),   //  downLeft 
    ])
  }
  get cornerCells() { return this.cornerCellVerts.values.map(v => this.grid.cellAtCoords(v.x, v.y)) }
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

  get minHorCellThickness() { return this.#checkCellThickness(true, true) }
  get minVertCellThickness() { return this.#checkCellThickness(true, false) }
  get maxHorCellThickness() { return this.#checkCellThickness(false, true) }
  get maxVertCellThickness() { return this.#checkCellThickness(false, false) }

  #checkCellThickness(minimum, hor) {
    const minName = minimum ? `min` : `max`
    const horName = hor ? `Hor` : `Vert`
    // DeBug.error(`${minName}${horName}CellThickness`)
    const minMaxStart = hor ? this.columnCount : this.rowCount
    if (!this.isGroupBounds && !this.isIslandBounds) {
      if (this.isFull) {
        return minMaxStart
      } else {
        return
      }
    }
    const colRows = hor ? this.boundCellRows : this.boundCellColumns
    const isIsland = this.isIslandBounds
    const idName = isIsland ? `islandID` : `groupID`
    const id = this[idName]
    //ARROW: checkID()
    const checkID = (cell) => { return isIsland ? cell.islandIDs.has(id) : cell.groupID === id }

    //ARROW: checkSel()
    const checkSel = (cell) => { return this.selection.some(sel => sel.id === cell.id) }

    let minMax = minimum ? minMaxStart : 0
    //ARROW: checkID()
    const getMinMax = (count) => { return minimum ? min(count, minMax) : max(count, minMax) }

    colRows.forEach(row => {
      let count = 0
      row.forEach(c => {
        if (checkSel(c)) {
          count += 1
          // DeBug.log(`new count`, count)
        } else {
          // DeBug.log(`end count`, count)
          if (count > 0) {
            minMax = getMinMax(count)
            // DeBug.warn(`new minMax`, minMax)
          }
          count = 0
        }
      })
      if (!minimum || count > 0) {
        minMax = getMinMax(count)
        // DeBug.warn(`new minMax`, minMax)
      }
    })
    // DeBug.error(`final minMax`, minMax)
    // DeBug.log(``)
    return minMax
  }


  get anchor() { return Vertex.mult(this.cornerCellVerts.upLeft, this.cellSize) }
  get size() { return Vertex.mult(this.cellBoundsSize, this.cellSize) }
  get aspect() { return this.size.aspect }

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

  get corners() {
    return memoize(() => {
      const rect = this.boundsRect
      return new Corners([
        vert(rect.x, rect.y),
        vert(rect.right, rect.top),
        vert(rect.right, rect.bottom),
        vert(rect.left, rect.bottom),
      ])
    }, `corners`).call(this)
  }
  get sides() {
    return memoize(() => {
      return this.corners.sides
    }, `sides`).call(this)
  }

  get bounds() { return this.corners.bounds }

  //MEMO: cellPoints
  get cellPoints() {
    return memoize(() => {
      return this.selection
        .map(c => c.points).flat()
        .unique(`id`)
        .gridVertSorted
    }, `cellPoints`).call(this)
  }
  //MEMO: xGuidePoints
  get xGuidePoints() {
    return memoize(() => {
      return this.outerCells.up
        .map(c => c.sides.up.points).flat()
        .unique(`id`)
      // .gridVertSorted
    }, `xGuidePoints`).call(this)
  }
  //MEMO: yGuidePoints
  get yGuidePoints() {
    return memoize(() => {
      return this.outerCells.left
        .map(c => c.sides.left.points).flat()
        .unique(`id`)
        .gridVertSorted
    }, `yGuidePoints`).call(this)
  }
  //MEMO: xGuides
  get xGuides() {
    return memoize(() => {
      return this.xGuidePoints.map(c => c.x).flat()
    }, `xGuides`).call(this)
  }
  //MEMO: yGuides
  get yGuides() {
    return memoize(() => {
      return this.yGuidePoints.map(c => c.y).flat()
    }, `yGuides`).call(this)
  }

  get cellsCentroid() { return Vertex.div(this.cellBoundsSize, 2) }
  get centroid() { return Vertex.mult(this.cellsCentroid, this.cellSize) }
  //#endregion
  // MARK: SelectionBounds Methods
  // #region Methods
  //METH: cellsToEdge()
  cellsToEdge({ fromCell, direction, selection = this.selection }) {
    // DeBug.warn(`cellsToEdge`)
    let travelled = 0
    let isAvailable = true
    let cells = new OpArray
    let next
    while (isAvailable) {
      next = fromCell.validNeighbors(direction)[0]
      if (next && selection.some(s => s.equals(next))) {
        // DeBug.warn(`next exists!`)
        isAvailable = true
        travelled += 1
        cells.push(next)
        fromCell = next
      } else {
        // DeBug.error(`next does not exist!`)
        isAvailable = false
        next = fromCell
      }

    }
    // DeBug.log(`next`, next)
    // DeBug.log(`travelled`, travelled)
    return [travelled, cells]
  }

  //METH: takes a Cardinal Direction and returns a row selection of corresponding half of the cellBounds
  half(direction) {
    if (!direction.isCardinal || !direction.isSingle) { DeBug.error('direction must be single Cardinal') }
    if (this.rowCount < 2 || this.columnCount < 2) { DeBug.error('this grid is too small to get a half') }
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
    DeBug.log('')
    if (!direction.allAreOrdinal || !direction.isSingle) { DeBug.error('direction must be single Ordinal') }
    if (this.rowCount < 2 || this.columnCount < 2) { DeBug.error('this grid is too small to get a quadrant') }
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
  // innerCellIslands({ isTaken = true, stored = false, direction = Direction.Horizontal } = {}) {
  //   DeBug.log('innerCellIslands called')
  //   return this.grid.createIslands({
  //     selection: isTaken ? this.selection : this.availableCells,
  //     bounds: this,
  //     groupID: this.groupID,
  //     islandID: this.islandID,
  //     direction: direction,
  //     isTaken: isTaken,
  //     stored: stored,
  //   })
  // }

  // get horCellIslands() {
  //   return this.innerCellIslands({ isTaken: this.isMostlyAvailable, stored: false, direction: Direction.Horizontal })
  // }
  // get vertCellIslands() {
  //   return this.innerCellIslands({ isTaken: this.isMostlyAvailable, stored: false, direction: Direction.Vertical })
  // }
  // #endregion
}
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
  // cellRowsPref   
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
  // gridCellBounds
  groups = new OpArray

  constructor({ protoParent, gridSize, insetScale = 1, transform, startCoord = vert(), gridStyle = 0, gridType = 0, isInterGrid = false, cellOutset = 0 } = {}) {
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
  get testLook() { return Look.test(this.size, 'grid') }
  get testColor() { return protoColor(0, 230, 0, 90) }
  get cornerRadius() { return this.cellRadius }

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
  //MEMO: gridCellBounds
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
  //MEMO: cellSize  
  get cellSize() {
    return memoize(() => {
      return Vertex.div(this.insetSize, this.gridSize)
    }, `cellSize`).call(this)
  }
  //MEMO: cellAspect
  get cellAspect() {
    return memoize(() => {
      return this.cellSize.aspect
    }, `cellAspect`).call(this)
  }
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
  //MEMO: cellPoints
  get cellPoints() {
    return memoize(() => {
      return this.gridCellBounds.cellPoints
    }, `cellPoints`).call(this)
  }
  //MEMO: cellColumns
  get cellColumns() {
    return memoize(() => {
      return this.cellRowsFlipped()
    }, `cellColumns`).call(this)
  }

  get availableCells() { return this.cells.filter(cell => cell.isAvailable) }
  get takenCells() { return this.cells.filter(cell => cell.isTaken) }
  // get cellsInAnIsland() { return this.cells.filter(cell => cell.isInAnIsland) }                         //UNUSED:
  get isFull() { return this.availableCells.length === 0 }
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

  //MEMO: allSimpleSubShapes()
  get allSimpleSubShapes() {
    return memoize(() => {
      return this.perimeterIslands
        .map(i => i.shape.simpleSubShapes).flat()
    }, `allSimpleSubShapes`).call(this)
  }
  //MEMO: allSimpleSubShapesSegs()
  get allSimpleSubShapesSegs() {
    return memoize(() => {
      return this.allSimpleSubShapes.flat()
        .gridVertSorted
    }, `allSimpleSubShapesSegs`).call(this)
  }
  //MEMO: allSimpleSubShapesSegsCounterSorted()
  get allSimpleSubShapesSegsCounterSorted() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs
        .counterGridVertSorted
    }, `allSimpleSubShapesSegsCounterSorted`).call(this)
  }
  //MEMO: allSimpleSegPaths()
  get allSimpleSegPaths() {
    return memoize(() => {
      return this.perimeterShapes.map(sh => sh.simpleSegPaths)
    }, `allSimpleSegPaths`).call(this)
  }

  get allSingleSimpleSubShapes() {                 // subshapes that contain no internal subShapes    
    return this.perimeterShapes
      .filter(s => s.isSingleShape)                // filter shapes for singles
      .map(s => s.simpleSubShapes).flat()          // map to simpleSubShapes 
    // return this.perimeterIslands
    //   .map(i => i.shape.simpleSubShapes)           // get unflattened to test subShape count
    //   .filter(subs => subs.length === 1).flat()    // only subShapes with a single simpleSubShape
  }
  get allInternalSimpleSubShapes() {               // Internal subshapes run counter-clockwise
    return this.perimeterShapes
      .filter(s => !s.isSingleShape)               // filter shapes for not singles!
      .map(s => s.simpleSubShapes.slice(1)).flat()   // map to simpleSubShapes minus their outer shape
    // return this.perimeterIslands
    //   .filter(i => i.shape.simpleSubShapes.length > 1)    // only shapes with more than 1 simpleSubShape are internal
    //   .map(i => i.shape.simpleSubShapes.slice(1)).flat()  // remove external subShapes
  }
  // get outerSideParametricShapes() {
  //   return this.sides.obj.map((side, key) => {
  //     const cells = this.gridCellBounds.outerCells[key]
  //     const islands = cells.map()
  //     return cells
  //   })
  // }
  // get cornerMappedParametricShapes() {

  // }

  //MEMO: allSimpleOutsideCorners
  get allSimpleOutsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs.filter(s => s.isOutsideCorner)
    }, `allSimpleOutsideCorners`).call(this)
  }
  //MEMO: allSimpleInsideCorners
  get allSimpleInsideCorners() {
    return memoize(() => {
      return this.allSimpleSubShapesSegs.filter(s => !s.isOutsideCorner)
    }, `allSimpleInsideCorners`).call(this)
  }

  get allOuterTakenSides() {
    return this.allSimpleSubShapesSegs.filter(s => {
      // const match = 
    })
  }

  get availableRows() { return this.cellRows.filter(row => row.every(c => c.isAvailable)) }
  get availableColumns() { return this.cellColumns.filter(col => col.every(c => c.isAvailable)) }

  get gridCornerSegs() {
    // const validate=(seg,corner)=> {
    //   if(seg.cells.some(c=> c.id===))
    // }
    let corners = this.allSimpleSubShapesSegs.cornerElements
      .map(s => s.startNeighbor)
    return corners
  }
  // //MEMO: mostUpLeftSeg
  // get mostUpLeftSeg() {
  //   return memoize(() => {
  //     const seg = this.allSimpleSubShapesSegs.first.startNeighbor
  //     if(seg.cells.some(c=>c.id===))
  //     return seg
  //   }, `mostUpLeftSeg`).call(this)
  // }
  // //MEMO: mostUpRightSeg
  // get mostUpRightSeg() {
  //   return memoize(() => {
  //     const seg = this.allSimpleSubShapesSegsCounterSorted.first.startNeighbor
  //     if(seg.cells.some(c=>c.id===))
  //     return seg
  //   }, `mostUpRightSeg`).call(this)
  // }
  // //MEMO: mostDownRightSeg
  // get mostDownRightSeg() {
  //   return memoize(() => {
  //     const seg = this.allSimpleSubShapesSegs.last.startNeighbor
  //     if(seg.cells.some(c=>c.id===))
  //     return seg
  //   }, `mostDownRightSeg`).call(this)
  // }
  // //MEMO: mostDownLeftSeg
  // get mostDownLeftSeg() {
  //   return memoize(() => {
  //     const seg = this.allSimpleSubShapesSegsCounterSorted.last.startNeighbor
  //     if(seg.cells.some(c=>c.id===))
  //     return seg
  //   }, `mostDownLeftSeg`).call(this)
  // }


  // #endregion
  // MARK: Grid Geometry Methods
  // #region Geometry Methods
  //METH:
  // cellNamed(id) { return this.cells.find(c => c.id = id) }                                             //UNUSED:
  //METH: 
  cellAnchor(x, y) { return Vertex.mult(this.cellSize, vert(x, y)).add(this.insetAnchor) }
  //METH: 
  index(x, y) { return gridPointIndex(x, y, this.gridSize.x, this.offset) }
  //METH: 
  coords(index) { return gridCoords(index, this.gridSize.x, this.offset) }
  //METH: 
  coordsAreInBounds(x, y, bounds = this.gridCellBounds) {
    return vertIsWithinBounds(vert(x, y), bounds.cellsBounds) //TODO: verify this implementation works before deleting 
    return bounds.xCellMin <= x && x <= bounds.xCellMax && bounds.yCellMin <= y && y <= bounds.yCellMax
  }
  //METH: 
  cellAtCoords(x, y) { if (this.coordsAreInBounds(x, y)) { return this.cellAt(this.index(x, y)) } }
  //METH: 
  groupNamed(name) { return this.groups.find(e => e.id === name) || null }
  //METH: 
  islandNamed(name) { return this.allIslands.find(e => e.id === name) || null }
  //METH: 
  shapeNamed(name) {
    // DeBug.log(this.shapes)
    return this.shapes.find(e => e.id === name) || null
  }
  // #endregion
  // MARK: Grid CellIndex Methods
  // #region CellIndex Methods
  //METH: 
  cellAt(cellIndex) { return this.cells.find(e => e.index === cellIndex) }
  //METH:
  cellsWithinBounds(bounds) { return this.cells.filter(c => vertIsWithinBounds(c.center, bounds)) }
  //METH: 
  // rowContaining(cellIndex) { return this.cellRows[this.coords(cellIndex).y] }                              //UNUSED:
  //METH: 
  // columnContaining(cellIndex) { return this.cellColumns[this.coords(cellIndex).x] }                        //UNUSED:
  //METH: 
  // rowContains(rowIndex, cellIndex) { return this.coords(cellIndex).y === rowIndex }                        //UNUSED:
  //METH: 
  // columnContains(columnIndex, cellIndex) { return this.coords(cellIndex).x === columnIndex }               //UNUSED:
  //METH:
  // cellIsInAnIsland(cellIndex) {                                                                         //UNUSED: (caller)
  //   return this.allIslands.some(isle => isle.cells.some(cell => cell.index === cellIndex))
  // }
  //METH: 
  cellSegmentBetween(indexA, indexB) {
    const indices = OpArray.from([indexA, indexB]).numSorted
    // print(indices)
    const a = this.coords(indices[0])
    const b = this.coords(indices[1])
    const direction = a.biDirectionTo(b)
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
  //METH: cellSpanBetween()
  cellSpanBetween(indexA, indexB) { return this.cellSpanRowsBetween(indexA, indexB).flat() }
  //METH: cellSpanBounds()
  cellSpanBounds(indexA = this.cells.first, indexB = this.cells.last) {
    const topLeft = this.cellAt(indexA).anchor
    const botRight = this.cellAt(indexB).corners.downLeft
    return findBounds(topLeft, botRight)
  }
  //METH: directionToNeighbor()
  directionToNeighbor(cell, neighbor) {
    // if (cell.neighbors.some(n => n.id === cell.id)) {
    return cell.coords.directionTo(neighbor.coords)
    // }
  }
  //METH: neighbor() : Cell : find neighbor cell by direction
  neighbor(cellIndex, direction) {
    let coords = this.cellAt(cellIndex).neighborCoords(direction)   // get neighbor coords
    if (this.coordsAreInBounds(coords?.x, coords?.y)) {               // verify coords are inside grid
      return this.cells.find(e => e.coords.equals(coords))
    }
  }
  //METH: #neighborIs() : BOOL : if certain neighbor is available, in certain island, or in certain group
  #neighborIs({ cellIndex, direction, groupID, islandID } = {}) {
    let neighbor = this.neighbor(cellIndex, direction)        // find neighbor 
    if (neighbor) {
      if (groupID) { return neighbor.groupID === groupID }     // test group membership
      if (islandID) { return neighbor.islandIDs.has(islandID) } // test island membership
      return neighbor.isAvailable                               // test availability
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
  availableNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isAvailable) }       //UNUSED:
  //METH: takenNeighbors() : [Cell]
  takenNeighbors(cellIndex) { return this.neighbors(cellIndex).filter(cell => cell.isTaken) }               //UNUSED:
  //METH: ordinalNeghbors() : [Cell]
  ordinalNeighbors(cellIndex) {                                                                           //UNUSED:
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
  randTransformedCells(selection) {                                                                           //UNUSED:
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
    // DeBug.log(`validNeighbors selection`, selection)
    // DeBug.error(`validNeighbors selection`, selection.map(c => c.id))
    let cells = OpArray.from(new Set(selection.flatMap(c => c.validNeighborsCoords(direction, bounds))))
    // let cells = selection.flatMap(e => e.validNeighborsCoords(direction, bounds)).unique(`id`)
    // DeBug.log(`validNeighbors selection`, selection.map(c => c.id))
    // DeBug.log(`validNeighbors cells`, cells.map(c => c.id))
    cells = cells
      .unique(['x', 'y']) // unique based upon x and y values
      .gridVertSorted // sort by y then x values
      .map(c => this.cellAtCoords(c.x, c.y)) // map to cells
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
      if (isTaken) { cells = this.takenCells }
      else { cells = this.availableCells }
    }
    // if (!selection) {
    //TODO: could/should I migrate from ID to direct reference?
    if (groupID) {                            // "group" mode finds & creates islands within a group
      group = this.groupNamed(groupID)
      cells = group?.cells || new OpArray
      if (group) { protoParent = group }
    }
    //TODO: could/should I migrate from ID to direct reference?
    if (islandID) {                           // "island" mode finds & creates islands within an island
      island = this.islandNamed(islandID)
      cells = island?.cells || new OpArray
      DeBug.warn(`island found for ${islandID}?`, island)
      if (island) { protoParent = island }
    }
    if (selection) { cells = OpArray.from(selection) }
    if (cells.isEmpty) {
      DeBug.groupEnd()
      return
    }
    DeBug.log(`cells`, cells.map(c => c.id))
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
          // DeBug.warn(`current cell: ${current.id}`)
          let neighbors = this.validNeighbors({ selection: [current], bounds: bounds, direction: direction })
          // DeBug.log(`validNeighbors-neighbors`, neighbors.map(c => c.id))
          neighbors = neighbors
            .filter(e => !e.islandChecked)
          // DeBug.log(`islandChecked-neighbors`, neighbors.map(c => c.id))
          //NOTE: I can't remember why I wrote this logic to work with goupID and islandID. Else case makes sense. This might be a source of problems down the road, or an avenue for something interesting. 
          //TODO: Actually, I wonder if this might be affecting symmetrize bugs? INVESTIGATE!!!
          // if (isTaken) {
          // DeBug.log(`islandChecked-neighbors islandIDs`, neighbors.map(c => Array.from(c.islandIDs)).join(` `))

          if (selection) { // filter neighbors from selection
            neighbors = neighbors.intersect(selection, ['id'])
            // DeBug.log(`selection-neighbors`, neighbors.map(c => c.id))
          } else {
            if (groupID) {// find neighbors in group
              neighbors = neighbors.filter(e => e.groupID === groupID)
              // DeBug.log(`groupID-neighbors`, neighbors.map(c => c.id))
            }
            if (islandID) {// find neighbors in island
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
            .gridVertSorted // sort by y then x values
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
      })

      if (stored) {
        // newIsland.setFilter(filter)
        //FIXME: Need to figure out how to properly assign/add subIslands from Island.CreateSubIsland() call to createIslands
        if (group) { group.perimeterIslands.push(newIsland) }
        if (protoParent?.type === 'Island' || protoParent?.type === 'PerimeterIsland') {
          // protoParent.setFilter(filter)
          // DeBug.warn(protoParent)
          if (!protoParent.subIslands) { protoParent.subIslands = new OpArray }
          protoParent.subIslands.push(newIsland)
        }
        // if ()
      }
      tempIslands.push(newIsland)
    }
    // DeBug.log(`  $$$  `)
    DeBug.log(`tempIslands`, tempIslands.map(i => i.id))
    //TODO: need to keep this in mind in regards to find Islands new temp/non-stored use case
    if (stored) {
      this.updateCells()
      tempIslands.forEach(isle => {
        this.updateCells({ island: isle })
        if (createShape) { isle.createShape(insetScale) }
        DeBug.warn(isle.shape.svg)
      })
    }
    tempIslands.forEach(isle => {
      // this.updateCells({ island: isle })
      // isle.createShape()
      DeBug.log(`completed Island ${isle.id} cell-islandIDs`, isle.cells)
      // DeBug.log(`completed Island ${isle.id} cell-islandIDs`, isle.cells.forEach(c => Array.from(c.islandIDs)).join(` `))
    })

    DeBug.groupEnd()
    DeBug.log(``)
    return tempIslands
  }
  // #endregion
  // MARK: Grid Shape Methods
  // #region Grid Shape Methods
  //METH:
  createSimpleSubShapes() {
    // DeBug.group(`GRID.createSimpleSubShapes called!!!`)
    this.groups.forEach(g => g.createSimpleSubShapes())
    // DeBug.groupEnd()
  }
  // #region end

  //MARK: MAXIMIZE CUDDLES
  inWrapPerimeter(simpleSegs, parentSegs) {
    DeBug.log(`inWrapPerimeter`)
    let unmatched = new OpArray
    simpleSegs.forEach(simp => {
      DeBug.log(`current Seg`, simp)
      const match = parentSegs.find(prnt => simp.hasCoincidentCorner(prnt))
      DeBug.log(`match`, match)
      if (match) {
        simp.setEndCurveOrigin(match.arcOrigin)
      } else {
        unmatched.push(simp)
      }
    })
    unmatched.forEach(s => s.matchEndCorner())
  }

  get allMinRadiusCorners() {
    return this.allSimpleSubShapesSegs
      .filter(s => s.hasMinArcRadius || s.isMinCorner)
    // .gridVertSorted
    // .sort((a, b) => b.outWrappers?.length - a.outWrappers?.length)
  }

  // curveMinCorners() {}

  //METH: curveCellRadiusCorners()
  curveMinRadiusCorners({ corners = this.allMinRadiusCorners, all = false } = {}) {
    if (all) { corners = this.allSimpleSubShapesSegs }
    DeBug.log(`this.allMinRadiusCorners`, this.allMinRadiusCorners)
    DeBug.log(`corners`, corners)
    // if (!all) { DeBug.log(`allMinRadiusCorners`, corners) }
    corners.forEach(s => {
      // if (s.id.includes('cell081')                                                                   //LOGGING:
      //   // || s.id.includes('cell008')                                                               //LOGGING:
      //   // || s.id.includes('cell001')                                                               //LOGGING:
      // ) { report = true }                                                                            //LOGGING:
      // let report = false                                                                             //LOGGING:
      // if (report) {                                                                                  //LOGGING:
      //   DeBug.log(``)                                                                              //LOGGING:
      //   DeBug.log(s.id)                                                                            //LOGGING:
      //   DeBug.log(`this before`, s.cubicVerts)                                                     //LOGGING:
      // }                                                                                              //LOGGING:
      if (s.isMinCorner) {
        s.setMinEndCorner(true)
      } else {
        s.setMinEndCorner()
      }
      // if (report) { DeBug.log(`this after`, s.cubicVerts) }                                        //LOGGING:
      if (!all && !s.flushWrapper?.isMinCorner) {
        s.flushWrap()

        // if (report) {                                                                                //LOGGING:
        //   DeBug.log(`calling flushWrap:`, s.coincidentWrapper?.id)                                    //LOGGING:
        //   DeBug.log(`flushWrap:`, s.coincidentWrapper)                                                //LOGGING:
        //   DeBug.log(`cubicVerts:`, s.coincidentWrapper?.cubicVerts, s.coincidentWrapper?.endNeighbor.cubicVerts)
        // }                                                                                            //LOGGING:
      }
    })
  }

  //MARK: maximizeCuddles()

  //METH: maximizeCuddles()
  maximizeCuddles(
    defaultPool = this.allSimpleSubShapesSegs,
    nestleMode = 0,
    preserveQs = true,
    balance = true,
    respectAdjacents = true,
    interGrid = false) {
    DeBug.log(`defaultPool`, defaultPool)
    //MARK: completeEnds()
    //ARROW: completeEnds()
    const completeEnds = (testPool = defaultPool, wrap = true) => {
      testPool = testPool
        .filter(s => !s.hasCompleteEndCorner)
        .sort((a, b) => a.arcRadius - b.arcRadius)

      DeBug.warn(`allIncompleteEnds`, testPool)
      DeBug.warn(`allIncompleteEnds`, testPool.map(s => s.arcRadius))
      testPool.forEach(s => {
        s.matchEndCorner()
        if (wrap) { s.flushWrap() }
        // if (wrap && (s.isOutsideCorner || s.coinInWrapper)) { s.flushWrap() }
      })
      // testPool.forEach(s => {
      //   // s.matchEndCorner()
      //   // if (wrap) { s.flushWrap() }
      // })
    }

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

    //ARROW: wrapInterferenceCorners()
    const wrapInterferenceCorners = (testPool = allInterferenceWrapped, preserveQuads = preserveQs) => {
      DeBug.warn(`allInterferenceWrapped`, testPool)                                                        //LOGGING:
      DeBug.warn(`allInterferenceWrapped hasDoubleInterference`, testPool.map(s => s.hasDoubleInterference))//LOGGING:
      DeBug.warn(`allInterferenceWrapped outWrapper count`, testPool.map(s => s.radiantOutWrappers.length)) //LOGGING:
      DeBug.warn(`allInterferenceWrapped maxArcRadius`, testPool.map(s => s.maxArcRadius))                  //LOGGING:
      DeBug.warn(`allInterferenceWrapped viableInterferenceOrigins`, testPool.map(s => s.viableInterferenceOrigins))
      DeBug.warn(`allInterferenceWrappers`, allInterferenceWrapped.map(w => w.interferenceWrappers))   //LOGGING:
      DeBug.warn(`allInterferenceWrappers flat`, allInterferenceWrappers)                              //LOGGING:

      //ARROW: removeDuplicates()
      const removeDuplicates = () => {
        const wrappers = allInterferenceWrappers.map(w => w.innerMostRadiantWrapper)
        DeBug.log(`wrappers`, wrappers)
        const dupes = testPool.intersect(wrappers, `id`)
        DeBug.warn(`dupes`, dupes)

        if (!dupes.isEmpty) {
          let reducePool = testPool.copy
          dupes.forEach(d => {
            let dupeCount = 0
            while (reducePool.length > 0) {
              // DeBug.log(`dupeCount`, dupeCount)
              const wrap = reducePool.shift()
              const wrappers = OpArray.fromObjectValues(wrap.interferenceWrappers).compacted
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

      // return
      // testPool = testPool.slice(0, 3)

      testPool.forEach(s => {
        //ARROW: setCurve()
        const setCurve = (seg, isStart) => {
          const wrapType = isStart ? `start` : `end`
          DeBug.warn(`setCurve ${wrapType}`)
          let dir                                                               // direction of perpendicular seg
          if (s.isOutsideCorner) {
            dir = isStart ? s.direction.toLeft : s.direction
          } else {
            dir = isStart ? s.direction : s.direction.toRight
          }
          const perpEnd = Vertex.add(dir.lineVector, origin)                    // calculate end of perpendicular seg
          const perpSeg = segment(origin, perpEnd)                              // calculate perpendicular seg
          const projected = perpSeg.intersectionWith(seg.maxArcBoundsSeg, true) // calculate intersect
          DeBug.log(`seg`, seg.id)                                                                      //LOGGING:
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
          if (seg.currentViableArcOrigins.some(o => o.equals(projected, 0))) {
            DeBug.log(`curving ${wrapType}wrapper!`)                                                    //LOGGING:

            seg.setEndRadiantOutWrapsOrigin(projected)
            seg.flushWrap()                             //TODO: this improves interferenceWrapping on #516
          }
        }

        DeBug.error(`interferenceWrapped in queue:`, s)
        DeBug.error(`interferenceWrappers:`, s.interferenceWrappers)
        DeBug.log(`neighbors`, s.neighborsArray)
        // let viables
        // const neighbors = OpArray.fromObjectValues(s.interferenceWrappers)
        //   .compacted
        //   .map(i => i.neighborsArray).flat()

        // if (neighbors.every(n => !n.hasArc)) {
        //   viables = s.viableInterferenceOrigins
        // }


        const viables = s.viableInterferenceOrigins
        let origin
        if (viables) {
          // DeBug.log(`viables`, viables)
          if (preserveQuads && s.isEdgeOfQuad && viables.some(v => v.equals(s.shape?.center, 1))) {
            origin = s.shape.center
          } else {
            // origin = viables.middle
            origin = viables.last
          }
        } else {
          DeBug.log(`NO viableInterferenceOrigins found!`)
        }
        if (origin && s.outerMostRadiantWrapper.canCurveTo(origin, true)) {
          DeBug.log(`origin found!`, origin)
          s.setEndRadiantOutWrapsOrigin(origin)
          let { start, end } = s.interferenceWrappers
          if (start) { setCurve(start, true) }
          if (end) { setCurve(end, false) }
        } else {
          DeBug.log(`NO origin found!`)
        }
      })
    }

    //MARK: wrapInnerMost()
    //ARROW: wrapInnerMost()
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
          && (s.coinOutWrapper ? s.radiantOutWrappers.length > 1 : !!s) // filter out potential flushWrap only
        )
        .sort((a, b) => a.maxArcRadius - b.maxArcRadius)
        .sort((a, b) => b.radiantOutWrappers.length - a.radiantOutWrappers.length)

      DeBug.warn(`allInnerMostWrappers`, testPool)
      DeBug.warn(`allInnerMostWrappers outWrappers`, testPool.map(s => s.radiantOutWrappers.length))
      // DeBug.warn(`allInnerMostWrappers viables`, testPool.map(s => s.viableRadiantOrigins))

      // return
      // testPool = testPool.slice(0, 1)

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
          // let origin
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
            // const origin = needsMiddle(s.endNeighbor) ? viables.middle : viables.last
            const origin = viables.last
            DeBug.log(`radiant wrapping to ${origin.string}`)
            s.setEndRadiantOutWrapsOrigin(origin)
            if (s.outerMostRadiantWrapper.outWrapper) {
              DeBug.log(`outerMostRadiantWrapper`, s.outerMostRadiantWrapper)
              s.outerMostRadiantWrapper.adjWrap()
            }
            // completeEnds(s.neighborsArray)
          }

          // DeBug.groupEnd()                                                                             //LOGGING:
        }
      })
    }

    //MARK: fixBadAdjWraps()
    //ARROW: fixBadAdjWraps()
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

      // return
      // testPool = testPool.slice(0, 3)
      //FIXME: Implement this in a while loop as used in fixLoosies(), can we reuse finishing testPool code?
      testPool.forEach(s => {
        DeBug.error(`badAdjWrap in queue:`, s)                                                          //LOGGING:
        // DeBug.groupCollapsed(`badAdjWrap in queue:`, s)                                                //LOGGING:

        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          DeBug.log(`inWrapper:`, s.inWrapper)
          s.inWrapper.adjWrap(true)                             // adjWrap() should handle div/conv and equid/prox
          s.inWrapper.replaceEndRadiantOutWrapsOrigin(s.arcOrigin) // radiant outwrapping
        }
        //ARROW: wrapInFix()
        const wrapInFix = () => {
          DeBug.log(`inWrapper:`, s.inWrapper)
          if (s.inWrapper.isInWrappedToRadiants) {
            DeBug.log(`abort fix: inWrapper is wrapped to radiants`)
            return
          }
          s.adjWrap(true)                                       // adjWrap self to wrap in
          s.inWrapper.flushWrap(true)                             // only do a single flushWrap in
        }


        if (s.isOutWrappedToRadiants) {                      // bail if s is already wrapped to outer radiants
          DeBug.log(`is outWrapped to radiants`)                                                      //LOGGING:
          if ((s.inWrapper.isInWrapped || s.inWrapper.isInWrappedToRadiants)
            // && s.neighborsArray.every(n => !n.isInWrappedToRadiants)            // fixes: #453, #472
            // && s.neighborsArray.some(n => !n.isInWrappedToRadiants)            // fixes: #493
          ) {
            DeBug.log(`inWrapper is inWrapped to radiants`)                                           //LOGGING:
            // DeBug.log(`neighbors`, s.neighborsArray.map(n => n.isInWrappedToRadiants))                //LOGGING:
            const inner = s.inWrapper.innerMostRadiantWrapper
            if (s.neighborsArray.every(n => !n.isInWrappedToRadiants)) {          // fixes: #453, #472

              DeBug.log(`inner.viableRadiantOrigins`, inner.viableRadiantOrigins)
              DeBug.log(`inner`, inner)
              // s.adjWrap(true, false)                                              // fixes #645
              // inner.replaceEndCurveOrigin(inner.viableRadiantOrigins?.last)
              inner.replaceEndRadiantOutWrapsOrigin(inner.viableRadiantOrigins?.last)
              // inner.outerMostRadiantWrapper
              completeEnds(inner.andNeighborsArray)
            } else if (s.neighborsArray.some(n => !n.isInWrappedToRadiants)) {    // fixes: #493
              // inner.replaceEndCurveOrigin(inner.viableRadiantOrigins?.last)
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
        completeEnds(s.andNeighborsArray)
        // DeBug.groupEnd()                                                                              //LOGGING:
      })
    }

    //MARK: fixBadFlushWraps()
    //ARROW: fixBadFlushWraps()
    const fixBadFlushWraps = (testPool = defaultPool, canWrapIn = true) => {
      // return
      testPool = testPool
        .filter(s =>
          s.isFlushOutWrapper
          && !s.hasMinArcRadius
          && s.flushWrapIsNonEquidistant
        )
      DeBug.log(`badFlushWraps`, testPool)

      // return
      // testPool = testPool.slice(0, 0)

      testPool.forEach(s => {
        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          DeBug.log(`using wrapOutFix on:`, s.inWrapper)
          s.inWrapper.flushWrap(true)                           // adding true fixes collinear convergences #304
          s.inWrapper.replaceEndRadiantOutWrapsOrigin()
          s.replaceEndRadiantOutWrapsOrigin()
          if (s.adjWrapIsNonEquidistant) { s.adjWrap(true) }    //TODO: fixes hor aspect cell bug, remove if problematic
          // s.inWrapper.radiantOutWrappers.forEach(w => {
          //   // if (!w.startNeighbor.isInWrappedToRadiants       // avoid possible off-axis interference wrap
          //   //   && !w.endNeighbor.isInWrappedToRadiants) {     // avoid possible off-axis interference wrap
          //   w.replaceEndCurveOrigin(s.inWrapper.arcOrigin)
          //   // }
          // })
        }
        //ARROW: wrapInFix()
        const wrapInFix = () => {
          DeBug.log(`using wrapInFix`)
          s.inWrapper.replaceEndCurveOrigin(s.arcOrigin)
          if (s.inWrapper.radiantOutWrappers?.some(o => !s.isRadiantWrapped(o) && s.canRadiateTo(o))) {
            s.inWrapper.replaceEndRadiantOutWrapsOrigin()
          }
        }

        DeBug.error(`current badFlushWrap: `, s)
        DeBug.error(`inWrapper: `, s.inWrapper)
        if (s.flushWrapIsConverging) {
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
    //ARROW: fixLoosies()
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
      // return

      let processed = new OpArray

      // const conditionFunc = () => { return testPool }
      // const action = () => {

      // return
      // testPool = testPool.slice(0, 1)

      while (testPool.length > 0) {
        const s = testPool.shift()

        // testPool.forEach(s => {
        DeBug.error(`current loosie`, s)
        // return

        //ARROW: minRadFix()
        const minRadFix = () => {
          DeBug.log(`minRadFix()`)
          if (s.neighborsArray.some(n => {
            DeBug.log(`${s.id} neighbor`, n)
            return n.canCurveMoreAtEnd
              && (n.flushWrapIsNonEquidistant || n.adjWrapIsNonEquidistant)
              && n.coincidentWrapper?.canCurveMoreAtEnd           // optional fixes #504
          })) {          // check and curve neighbor fully
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
              if (s.startNeighbor.canCurveMoreAtEnd) {                      // check startNeighbor
                s.startNeighbor.replaceEndRadiantOutWrapsOrigin(s.startNeighbor.currentMaxArcOrigin)
              }
              if (s.endNeighbor.canCurveMoreAtEnd) {                        // check endNeighbor
                s.endNeighbor.replaceEndRadiantOutWrapsOrigin(s.endNeighbor.currentMaxArcOrigin)
              }

            }
            if (ignoreMinRadius) {                                        // check if this can still curve more
              s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            }

            // fixBadAdjWraps(s.segPath)
            fixBadFlushWraps(s.segPath)
          } else {
            //TODO: Might need to add constraints to this!
            if (s.canCurveMoreAtEnd) {
              s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
            }
          }
        }

        // case: s.hasNoWrappers
        if (s.hasNoWrappers && loners) {
          DeBug.log(`loners fix`)
          if (s.isOutsideCorner && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)) {
            minRadFix()
          } else {
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
          }
        }
        // if (s.flushWrapIsNonEquidistant || s.adjWrapIsNonEquidistant) {
        // case: s.isInnerMostWrapper
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
              if (s.viableRadiantOrigins?.some(v => v.equals(s.currentMaxArcOrigin, 1))) {
                s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
              }
            } else {
              if (s.outWrapper.hasMinArcRadius && s.canCurveMoreAtEnd) {        // case: tucked inside minRadius corner
                DeBug.log(`maximizing neighbor curves first`)
                minRadFix()
              }
              else if (ignoreMinRadius && s.currentMaxArcRadius > 3 * s.cellRadius) {
                // s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
                s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
              }
              else {
                minRadFix()
              }
            }
          }

          if (s.id !== s.outWrapper.inWrapper.id) {  // case: this isn't the inWrapper to this outWrapper
            DeBug.log(`this isn't the inWrapper to this outWrapper`)
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            s.flushWrap(true)
            s.radiantOutWrappers?.forEach(o => {
              if (o.canCurveMoreAtEnd) { o.replaceEndCurveOrigin(s.currentMaxArcOrigin) }
            })
          }

          //TODO: Might need to refine further, it fixes #393 and #390
          if (s.radiantOutWrappers?.every(w => w.canCurveMoreAtEnd)) {
            DeBug.log(`outWrappers fix`)
            s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
          }

          const outWrapper = s.inOutFlushWrappers[1]
          if (s.flushWrapIsEquidistant && outWrapper.radiantOutWrappers) { // case: colWrapped & has rad outWrappers
            DeBug.log(`colWrapped & has rad outWrappers`)
            DeBug.log(`outWrapper`, outWrapper)

            if (outWrapper.canCurveMoreAtEnd                            // outWrapper can STILL curve more
              && !outWrapper.isOutWrappedToRadiants                  // outWrapper is not outwrapped to radiants
              && outWrapper.radiantOutWrappers.every(ro => !ro.canCurveMoreAtEnd)) { // radiant outWrappers can't curve more
              outWrapper.replaceEndCurveOrigin(outWrapper.currentMaxArcOrigin)
              outWrapper.flushWrap(true)
            }

            if (!respectAdjacents                                         // case: only s & flushWrapper can curve more
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

        // case: s.isOuterMostWrapper
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
              // DeBug.log(`case1 currentMaxArcOrigin`, s.innerMostRadiantWrapper.currentMaxArcOrigin)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.innerMostRadiantWrapper.currentMaxArcOrigin)
            }
            else if (s.innerMostRadiantWrapper.canCurveTo(s.currentMaxArcOrigin), true) {
              DeBug.log(`case2 viables`, s.innerMostRadiantWrapper.currentViableArcOrigins)
              // DeBug.log(`case2 currentMaxArcOrigin`, s.currentMaxArcOrigin)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
            }
          } else if (s.isAdjOutWrapper) {                    // case: NO radiantInWrappers
            DeBug.log(`s.isAdjOutWrapper`)
            s.inWrapper.adjWrap()                            // fixes #499, #512
          }
        }
        // } else {
        //   DeBug.log(`wrap was equidistant`)
        // }
        // else { DeBug.log(`skipped: no cases met`) }
        testPool = testPool
          .union(s.neighborsArray, `id`)
          .exclude(processed, `id`)
        DeBug.log(`add neighbors testPool`, testPool)
        testPool = filterPool(testPool)
        DeBug.log(`filtered testPool`, testPool)
        processed.push(s)
      }
      // safeArrayWhile(conditionFunc, action)
      // fixBadAdjWraps()
      fixBadFlushWraps()
    }

    //MARK: QUAD SHAPES
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

      //ARROW: assignQuad() : assign cubic verts using radii from cornerMap
      const assignQuad = (quad, cornerMap) => {
        cornerMap.forEach((cMap, i) => quad[i].addDistancedStartCornerVerts(cMap))
      }

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
    //ARROW: maximizeOuterCorners()
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
      completeEnds()
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
    //     completeEnds()

    //     testPool = testPool
    //       .union(changed.outside, [`id`])
    //       .union(changed.inside, [`id`])
    //       .unique([`id`])
    //     testPool = this.allLooseCorners(testPool)
    //   }
    //   safeArrayWhile(conditionFunc, action)
    // }

    //MARK: fixIssues()
    //ARROW: fixIssuess()
    const fixIssues = (mode = nestleMode) => {
      // maximizeOuterCorners()
      if (mode === 0) {
        DeBug.warn(`wrapInterferenceCorners`)                                                   //LOGGING:
        wrapInterferenceCorners()
        DeBug.warn(`wrapInnerMost`)                                                             //LOGGING:
        wrapInnerMost()
      }
      // maximizeOuterCorners()
      DeBug.warn(`curveMinRadiusCorners`)                                                     //LOGGING:
      this.curveMinRadiusCorners()
      // maximizeOuterCorners()
      DeBug.warn(`completeEnds`)                                                              //LOGGING:
      completeEnds()

      // maximizeOuterCorners()

      DeBug.warn(`fixBadAdjWraps`)
      fixBadAdjWraps()
      DeBug.warn(`fixBadFlushWraps`)
      fixBadFlushWraps()
      DeBug.warn(`fixLoosies`)
      fixLoosies()

      // maximizeOuterCorners()

      DeBug.warn(`roundQuads`)                                                                //LOGGING:
      // roundQuads()

    }

    DeBug.error(`FIX Issues 1`)                                                                         //LOGGING:
    fixIssues()
    DeBug.error(``)                                                                                     //LOGGING:
    // DeBug.error(`FIX Issues 2`)                                                                         //LOGGING:
    // fixIssues()

  }


  //MARK: NESTLE SHAPES
  //METH: nestleShapes() :
  nestleShapes(quadMode = 0, diagonals = false) {
    // const cellRadius = roundToDec(this.cellRadius)
    const cellRadius = this.cellRadius

    //MARK: Nestle Main
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
          isAvailable: true,
        })
      }
      rows[j] = row
    }
    return OpArray.from(rows)
  }

  //METH: setFrameRadii()
  setFrameRadii() {
    FRAME.setCornerRadii(this.gridCellBounds.cornerCellCenters, this.padSize)
  }
  //METH:
  setInsetScale(scale) {
    // DeBug.log('Grid setInsetScale', scale)
    super.setInsetScale(scale)
    // DeBug.log('Grid insetScale', this.insetScale)
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
        // DeBug.error(`no group named ${groupID}`)
        // DeBug.log(`current groups:`, this.groups)
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
  groupAvail(markTaken = true) {
    const group = this.assignCells(this.availableCells)
    if (!markTaken) { this.setAvailability(group.cells, true) }
    return group
  }
  //METH: groupFromIndices()
  groupFromIndices(indices) {
    indices = OpArray.format(indices)
    const cells = indices.map(i => this.cellAt(i))
    return this.assignCells(cells)
  }
  //METH:
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
  //METH:
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
  //METH: comb2()
  comb2({ selection = this.availableCells, dashArray, start = 0 } = {}) {
    const reduced = selection.combReduce(dashArray)
    // DeBug.log(`comb2 reduced`, reduced)
    return this.assignCells(reduced)
  }
  //METH:
  rects(coverage, aspects) {

  }
  //METH:
  squares({ coverage, direction = Direction.DownRight, minSize = 1, uniform = false, overlapping = true, rect = false, mode = 0 } = {}) {
    // DeBug.groupCollapsed(`Squares`)
    let maxSize // allowable max square based on 'Square and Rect Generation' study
    if (mode > 0) {
      coverage *= 1.5
      minSize = minSize + 1
    }

    let reducer = 0
    const cols = this.columnCount
    if (cols > 3 && cols < 6) { reducer = R.random_choice([0, 1, 1, 2, 2, 2]) }
    if (cols > 5) { reducer = R.random_choice([0, 1, 1, 2, 2, 2, 3, 3, 3]) }
    // DeBug.log(`reducer`, reducer)
    maxSize = cols - reducer

    // randomly generate squares within size range that add up to coverage
    const maxCells = round(coverage * this.cellCount)
    maxSize = min(maxSize, floor(sqrt(maxCells))) // maxSize by gridSize or coverage amount
    // DeBug.log('maxSize', maxSize)
    let usedCells = 0
    let squares = new OpArray
    let uniformSquare = uniform ? R.random_int(minSize, maxSize) : undefined // single size if uniform
    while (usedCells < maxCells) {
      const square = uniform ? uniformSquare : R.random_int(minSize, maxSize)
      squares.push(square)
      usedCells += (square * square)
      maxSize = min(maxSize, floor(sqrt(maxCells - usedCells))) //recalc maxSize each loop to keep close to coverage
    }
    // DeBug.log('squares', squares)

    const original = this.availableCells.copy
    let selection = new OpArray
    let availables = this.availableCells
    // DeBug.log('original', original)
    // DeBug.log('selection', selection)
    // DeBug.log('availables', availables)

    squares.forEach((size, i) => {
      let inlineSelection = this.inline(original, size - 1, direction.andAdjacents)
      // DeBug.log('')
      // DeBug.log('inlineSelection', inlineSelection.map(e => e.id))
      const padding = this.tempOutlineSelection(selection)
      inlineSelection = inlineSelection.union(selection, 'id')
      if (overlapping !== 'always') {
        inlineSelection = inlineSelection.union(padding, 'id')
      }
      // DeBug.log('inlineSelection', inlineSelection.map(e => e.id))
      let shrunkSelection = availables.exclude(inlineSelection, 'id') //shrunk selection by excluding inline
      // DeBug.log('shrunkSelection', shrunkSelection.map(e => e.id))

      //ARROW: newSquare() :
      const newSquare = () => {
        // DeBug.warn(`newSquare`)
        let isValid = false
        let cell, square
        while (isValid === false && shrunkSelection.length > 1) {
          // DeBug.log('')
          // DeBug.log(`size`, size)
          cell = this.randomSelection(1 / shrunkSelection.length, shrunkSelection) //random cell within shrunk
          // DeBug.log('newSquare cell', cell.map(e => e.id))
          const outline = this.tempOutlineSelection(cell, size - 1, direction.andAdjacents) //create square outline
          square = cell.copy.union(outline, 'id') //union cell with outline to create square
          // DeBug.log(`square`, square)
          if (mode > 0) {
            // 0. none, 1. someVert, 2. allVert, 3. someHor, 4. allHor, 
            // 5. someMixed, 6. allMixed, 
            // TODO: 7.someTriangle, 8. allTriangle
            const useRect = mode % 2 === 0 ? true : R.random_bool(0.5)            // all=>true, some =>random
            if (useRect) {
              let dir                                                             // choose inline direction
              if (mode < 3) { dir = Direction.Horizontal.random() }               // vert uses hor
              if (mode > 2 && mode < 5) { dir = Direction.Vertical.random() }     // hor uses vert
              if (mode > 4 && mode < 7) { dir = Direction.Cardinal.random() }     // rand cardinal
              // if (mode > 6) { dir = Direction.Ordinal.random() }                  // triangle
              const inlineAmount = min(R.random_int(1, ceil(size - 1)), size - minSize + 1)
              const inlined = this.inline(square, inlineAmount, dir)
              // DeBug.log(`inlined`, inlined)
              // square = inlined
              square = square.exclude(inlined, `id`)
              // DeBug.log(`rect`, square)
            }

          }
          // DeBug.log('shrunk start', shrunkSelection.map(e => e.id))
          const overlaps = square.includesAny(padding, 'id')// check if square overlaps padding
          // DeBug.log('padding length', padding.length)
          // DeBug.log('square overlaps', overlaps)
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
  triangles(coverage) { }
  //METH:
  snake({
    selection = this.availableCells,
    groupID,
    islandID,
    direction = Direction.All,
    cornerStart = false,
    turns = 6,
    size = 1,
    newGroup = true,
    coverage,
  } = {}) {
    // DeBug.groupCollapsed(`new snake`)
    if (selection.isEmpty) {
      // DeBug.error(`selection is empty!`)
      // DeBug.groupEnd()
      return
    }
    const cellBounds = this.cellBounds({ selection: selection })
    // DeBug.log(`selection`, selection)
    // DeBug.log(`cellBounds`, cellBounds)
    let outer = cornerStart ? cellBounds.cornerCells.compacted : cellBounds.outerCells.all.flat().compacted
    // DeBug.log(`outer`, outer)
    outer = outer.filter(c => c.isAvailable).unique().gridVertSorted
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
      // DeBug.log(`valids`, valids?.map(v => v.name))
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
          if (R.random_bool(.5)) {
            choiceCellsToEdge = choiceCellsToEdge.first
          } else {
            choiceCellsToEdge = choiceCellsToEdge.randomElement
          }
          // DeBug.log(`choiceCellsToEdge`, choiceCellsToEdge)
          dirChoice = choiceCellsToEdge[0]
          // DeBug.log(`dirChoice`, dirChoice.name)
          let [availDist, travCells] = choiceCellsToEdge[1]
          const lastCell = travCells.last
          // DeBug.log(`lastCell`, lastCell)
          // DeBug.log(`availDist`, availDist)
          const lineNeighbors = this.tempOutlineSelection(travCells, 1, Direction.Cardinal)
          if (lineNeighbors.some(n => snake.exclude(start).some(s => s.equals(n)))) {
            // choices = choices.exclude(dirChoice)
            // if (!choices.isEmpty) {
            //   dirChoice = choices.randomElement
            // } else {
            // availDist -= 1
            withinCoverage = false
            break
            // }
          }
          let invalidDists = this.tempOutlineSelection(travCells, 2, dirChoice.perpindiculars)
            .exclude(travCells, `id`)
            .exclude(lineNeighbors, `id`)
            .filter(c => c.isTaken)
            .map(c => dirChoice.allAreVertical ? abs(c.coords.y - start.coords.y) : abs(c.coords.x - start.coords.x))
          if (!invalidDists.duplicates().isEmpty) { invalidDists = invalidDists.duplicates() }
          // DeBug.log(`invalidDists`, invalidDists)
          const rangeArray = range(min(availDist, max(size + 1, floor(availDist / 3))), availDist)
            .array()
            .exclude(invalidDists)

          // DeBug.log(`rangeArray`, rangeArray)
          if (rangeArray.isEmpty) {
            // restartSnake()
            // break
            withinCoverage = false
          }
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
          // prevChoice = dirChoice
          // DeBug.log(`snake`, snake)
          // DeBug.log(`start`, start)
        }
      }
    }
    //ARROW: restartSnake()
    const restartSnake = () => {
      if (!outer.isEmpty) {
        // DeBug.error(`restart snake!`)
        // DeBug.groupEnd()
        createSnake()

      }
    }

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
    let output = OpArray.format(snake)
    return this.assignCells(output)
  }
  // #endregion
  // MARK: Grid Grammar Modifiers
  // #region Grammar Modifiers
  //METH: iterative outliner driven by directions
  //FIXME: bug: when 'amount' is larger than available space (in grid?) outline returns nothing
  outline({
    selection,
    groupID,
    islandID,
    direction = Direction.All,
    amount = 1,
    newGroup = true
  } = {}) {
    if (amount < 1 || this.isFull) { return }
    if ((selection && groupID) || (selection && islandID) || (groupID && islandID)) {
      DeBug.error('Grid.outline can only use one selection method')
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

    while (amount > 0 && !this.isFull) {
      if (selection?.length > 0) {
        const outline = this.validNeighbors({ selection: selection, direction: direction })
          .filter(cell => cell.isAvailable)
        // DeBug.log(`${groupID} outline ${amount}:`, outline.map(c => c.isAvailable))
        // if (outline.isEmpty) { return }
        // if (newGroup === true) { group = undefined } //allow assign to create new group
        // if (typeof newGroup === 'string' && !temp) { group = this.groupNamed(newGroup) } //use existing group
        // else { this.assignCells(outline, group?.id) } //assign to group
        // if (newGroup === true && !group) { //continue adding to the new group
        //   group = this.lastGroup
        //   newGroup = false
        // }
        // selection = group.cells
        //FIXME: this solution is not quite there: it allows outline to absorb prev group or overlap?
        if (!outline.isEmpty) {
          if (newGroup === true) { group = undefined } //allow assign to create new group
          if (typeof newGroup === 'string' && !temp) { group = this.groupNamed(newGroup) } //use existing group
          else { this.assignCells(outline, group?.id) } //assign to group
          if (newGroup === true && !group) { //continue adding to the new group
            group = this.lastGroup
            newGroup = false
          }
          selection = group.cells
        } else if (amount === 1) { return }

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
        // if (!outline.isEmpty) {
        newSelection.push(...outline)
        selection = newSelection
        if (sort) { selection = selection.sort((a, b) => a.index - b.index) }

        // }
        // DeBug.log('temp selection', selection.map(e => e.id))
      }
      amount -= 1
      // DeBug.log('temp newSelection', newSelection.map(e => e.id))
      // DeBug.log('temp selection', selection.map(e => e.id))
    }
    // DeBug.log('tempOutline', amount, direction)
    return selection

  }
  //METH: grab an inline of a selection without assignment
  inline(selection, amount = 1, direction = Direction.All) {
    if (amount < 1) { return new OpArray }
    // DeBug.log('inline amount', amount)
    const bounds = this.gridCellBounds
    let inlineEdges = new OpArray //store edge rows/columns/corners that can't be outlined, to be inlined
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

    const outline = this.tempOutlineSelection(selection, 1, direction)
    const inline = this.tempOutlineSelection(outline, amount, direction.opposites)
      .union(inlinedEdges, 'id')
    // DeBug.log('outline', outline.map(e => e.id))
    // DeBug.log('inline', inline.map(e => e.id))
    // DeBug.log('inline method return')
    // DeBug.log('')
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
    if (!direction.allAreCardinal && direction.vals.length % 2 !== 0) { DeBug.error('only Hor, Vert, and Cardinal allowed') }
    const isQuad = direction.equals(Direction.Cardinal) // Horizontal/Vertical = HALF, Cardinal = QUAD
    DeBug.log('isQuad', isQuad)
    if (!selection.is2D) { selection = this.toCellRows(selection) }
    const bounds = this.cellBounds({ selection: selection }) // get cellBounds of selection
    DeBug.log('bounds', bounds)

    //METH: assignSym arrow function
    const assignSym = (transformed, destination) => {
      transformed = transformed.flat() // flatten half for operations
      destination = destination.flat() // flatten half for operations
      DeBug.log('transformed', transformed.map(e => e.id))
      DeBug.log('transformed isAvailable', transformed.map(e => e.isAvailable))
      DeBug.log('destination flattened', destination.map(e => e.id))
      DeBug.log('destination isAvailable', destination.map(e => e.isAvailable))
      if (transformed.length !== destination.length) { // ensure halves are equal
        DeBug.error('expected selections to have same length')
      }

      destination.forEach((destCell, i) => {
        const transformCell = transformed[i]
        if (useAssigned) { // useAssigned changes assigned cells' groupIDs
          if (groupIDs && !groupIDs?.some(id => id === transformCell.groupID)) {
            DeBug.log('HIT THIS HIT THIS HIT THIS HIT THIS')
          } else {
            if (transformCell.groupID !== -1) {
              DeBug.log('newGroupID', transformCell.groupID)
              destCell.groupID = transformCell.groupID
            }
          }
        }
        if (useAvailable && transformCell.isAvailable === true) { // useAvailable changes isAvailable cells  
          const currentGroup = this.groupNamed(destCell.groupID)
          if (currentGroup) { // remove cell from currentGroup
            currentGroup.cells = currentGroup.cells.filter(cell => cell.id !== destCell.id)
          }
          destCell.groupID = -1 // groupID to -1
          destCell.isAvailable = true // isAvailable to true
        }
      })
      DeBug.log('destination transformed isAvailable', destination.map(e => e.isAvailable))
      DeBug.log('destination transformed groupID', destination.map(e => e.groupID))

      if (groupIDs) { //filter destination by groupIDs
        destination = destination.filter(destCell => groupIDs.some(id => destCell.groupID === id))
      } else { // get all groupIDs
        groupIDs = this.groups.map(group => group.id)
      }
      DeBug.log('destination groupID filtered', destination.map(e => e.id))
      DeBug.log('groupIDs', groupIDs)

      const groupSelections = groupIDs.map(id => { // group destCells by groupID
        DeBug.log('process id', id)
        return destination.filter(destCell => destCell.groupID === id)
      })
      DeBug.log('groupID Selections', groupSelections)

      let emptySelections = destination
        .filter(cell => cell.isAvailable === true) // filter for only isAvailable cells
      DeBug.log('emptySelections 1', emptySelections)

      emptySelections = emptySelections
        .exclude(groupSelections.flat(), 'id') // exclude cells that will be isTaken
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

    let sourceDir = direction.random() // pick a random direction from available directions
    DeBug.log('sourceDir', sourceDir)
    let source, transformed, destination
    if (isQuad) { //quad
      source = bounds.half(sourceDir) // get picked half
      DeBug.log('quad source', source)
      destination = bounds.half(sourceDir.opposites) // get other half
      if (reflection) {
        direction = sourceDir.andOpposites // get flip direction
        transformed = source.flipped2D(direction) // flip source
        sourceDir = sourceDir.toLeft // set next source half to -90deg
        DeBug.log('quad direction', direction)
        direction = direction.equals(Direction.Horizontal) ? Direction.Vertical : Direction.Horizontal // rotate flip direction -90deg
        DeBug.log('after quad direction', direction)
      } else {
        transformed = source.rotated2D(90) // rotate source 90deg
      }
      assignSym(transformed, destination)
    }
    // half symmetrize
    source = bounds.half(sourceDir) // get picked half
    DeBug.log('half bounds', bounds)
    DeBug.log('half source', source)
    DeBug.log('half source flattened', source.flat().map(e => e.id))
    destination = bounds.half(sourceDir.opposites) // get other half
    if (reflection) {
      DeBug.log('reflection direction', direction)
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
    // DeBug.log('selection', selection)
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
    // DeBug.log(`updating Cells ${groupID}, ${islandID}`)
    if (arguments.length === 0) { this.cells.forEach(cell => cell.drawElement()) } // DEPRECATE: we dont render cells!

    let groups, islands
    if (groupID) { groups = [this.groupNamed(groupID)] }
    else { groups = this.groups }
    groups.forEach(group => this.updateGroup(group))

    if (island) {
      islands = [island]
      // DeBug.log(`all islands: `, this.islands)
      DeBug.log(`updateCells: islands found: `, islands)
    }
    else { islands = this.allIslands }
    islands.forEach(island => this.updateIsland(island))
    // DeBug.log(`islands`, islands)
  }
  //METH:
  updateGroup(group) {
    // DeBug.log(`updating Group ${group.id}`)
    group.cells.forEach(cell => {
      // DeBug.log('this Cell', cell)
      let thisCell = this.cells[cell.index]
      // DeBug.log('thisCell', thisCell.id)
      thisCell.groupID = group.id
      thisCell.isAvailable = false
      // thisCell.color = group.color
      // thisCell.drawElement()                                    // DEPRECATE: we dont render cells!
    })
    // group.updateDisplay()
  }
  //METH:
  updateIsland(island) {
    // DeBug.log(`updating Island ${island.id}`)
    island.cells.forEach(cell => {
      let thisCell = this.cells[cell.index]
      if (thisCell) {
        thisCell.islandIDs.add(island.id)
        // thisCell.color = island.color
        // thisCell.drawElement()                                   // DEPRECATE: we dont render cells!
      }
    })
    // island.updateDisplay()
  }
  //METH:
  setAvailability(selection = this.cells, isAvailable = false) {
    selection.forEach(cell => cell.isAvailable = isAvailable)
  }

  setGridAvailability(selection = this.cells, isAvailable = false) {
    if (selection.isEmpty) { return }
    selection.forEach(cell => {
      const thisCell = this.cells[cell.index]
      // DeBug.log('thisCell id', thisCell.id)
      // DeBug.log('thisCell groupID', thisCell.groupID)
      // DeBug.log('thisCell isAvailable', thisCell.isAvailable)
      const thisGroup = this.groupNamed(thisCell.groupID)
      // DeBug.log('thisGroup', thisGroup)
      if (thisGroup) { thisGroup.cells = thisGroup.cells.filter(cell => cell.id !== thisCell.id) }
      thisCell.groupID = -1
      thisCell.isAvailable = isAvailable
    })
  }
  // #endregion

  //MARK: Setup Methods
  //METH: assignElement() override
  assignElement() {
    // if (this.isFrontGrid) {
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
    // else {
    //   this.backElt = this.frontGrid.backElt
    //   this.comboElt = this.frontGrid.comboElt
    //   this.highElt = this.frontGrid.highElt
    //   this.shadElt = this.frontGrid.shadElt
    //   this.shaderElts = this.frontGrid.shaderElts
    // }
  }
  //METH: drawElement() override
  drawElement() {
    super.drawElement()

    if (this.isFrontGrid) {
      this.shaderElts?.forEach(elt => {
        elt
        // .viewBox(this.insetAnchor, this.insetSize, this.padding)
        // .layout(this.insetAnchor, this.insetSize, this.padding)
        // .attribute(`fill`, frameColor)
        // .attribute('overflow', 'visible')
        // .attribute(`filterUnits`, `userSpaceOnUse`)
        // .attribute(`primitiveUnits`, `userSpaceOnUse`)
        // .attribute(`fill`, `red`)
      })
      this.backElt
      // .attribute(`display`, `none`)

      this.comboElt
        // .attribute(`display`, `none`)
        // .style(`visibility`, `hidden`)
        .attribute(`opacity`, 1)
      // .attribute(`fill`, `red`)

      this.highElt
        // .attribute(`display`, `none`)
        // .style(`visibility`, `hidden`)
        .attribute(`opacity`, 1)
      this.shadElt
        // .attribute(`display`, `none`)
        .attribute(`opacity`, .6)
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

//MARK: CELLGROUP CLASS
// SIZE: 552 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class CellGroup extends ProtoLayer {
  maxCorners
  direction
  grid
  isBackGroup = false
  islandLevel
  cells = new OpArray
  perimeterIslands = new OpArray // Island-Shapes defining outer boundaries of all Island shapes to be allowed within
  shapeGroups = new OpArray // rendering layer storage
  cuts = new OpArray

  constructor(protoParent, svgParent, grid, cells) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      type: 'CellGroup',
      // drawSVG: false,
      // drawRect: true,
      insetScale: 1,
    })
    if (cells) { this.cells = cells }
    this.grid = grid

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
  get perimeterShapes() { return this.perimeterIslands.map(i => i.shape) }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.id }) }
  get boundsRect() { return this.cellBounds.boundsRect }
  get padding() {
    const backGroupPadding = Vertex.mult(this.grid.insetAmount, 1.25)
    const defaultPadding = vert(1)
    // const defaultPadding = Vertex.div(Vertex.div(vert(100), this.grid.gridSize), this.grid.insetScale)
    //.div(this.grid.insetScale)
    // const backGroupPadding = 2 * this.grid.insetAmount.x
    // const defaultPadding = 100 / this.grid.gridSize.x / this.grid.insetScale.x
    // return defaultPadding
    return this.isBackGroup ? backGroupPadding : defaultPadding
  }

  // get cellsByIndex() { return this.cells.copy.sort((a, b) => a.index - b.index) }
  // #endregion
  // MARK: CellGroup Grid Properties
  // #region Grid Properties
  // get availableCells() { return this.grid.availableCells }                                       //UNUSED:
  get validNeighbors() {
    return memoize(() => {
      return this.grid.validNeighbors({ selection: this.cells })
    }, `validNeighbors`).call(this)
  }
  get validCardinalNeighbors() {
    return memoize(() => {
      return this.grid.validNeighbors({ selection: this.cells, direction: Direction.Cardinal })
    }, `validCardinalNeighbors`).call(this)
  }

  get ordinalConnections() { return this.cells.filter(c => !c.ordinalOnlyNeighbors.isEmpty) }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, groupID: this.id })
  }
  get neighborIslands() {
    return this.perimeterIslands.map(i => i.neighborIslands).flat().exclude(this.perimeterIslands, `id`)
  }
  get neighborGroups() {
    return this.neighborIslands.map(i => i.groupID).unique().map(gID => this.grid.groupNamed(gID))
  }
  get nonNeighborIslands() {
    const isles = this.grid.perimeterIslands.copy
      .exclude(this.perimeterIslands, `id`)
      .exclude(this.neighborIslands, `id`)
    if (!isles.isEmpty) { return isles }
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
  //FIXME: reimplement for proper minCorners functionality that works with both omni and cardinal
  //FIXME: so "omni-min", "omni-max", "cardinal-min", "cardinal-max"
  createPerimiters(direction = Direction.Cardinal, maxCorners = true) {
    // DeBug.log(`createPerimiters this.id`, this.id)
    this.maxCorners = maxCorners
    this.direction = direction
    // switch (maxCorners) {
    //   case 'maxCorners':
    //     break
    //   case 'minCorners':
    //     break
    //   default:
    //     this.maxCorners = undefined
    //     DeBug.error(`${maxCorners} is invalid Perimeter Type`)
    // }
    const groupID = this.id
    DeBug.warn(`createPerimiters for:`, groupID)
    DeBug.groupCollapsed(`grid.createIslands`)
    this.perimeterIslands = this.grid.createIslands({
      groupID: this.id,
      direction: direction,
      maxCorners: maxCorners,
      drawFilter: false,
    })
    this.islandLevel = 0
    DeBug.groupEnd()
    DeBug.log(``)
  }
  //METH: createSimpleSubShapes() : 
  //FIXME: finish implementation to make createPerimiters work with min-corners
  createSimpleSubShapes() {
    DeBug.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.perimeterIslands.forEach(pIsles => pIsles.createSimpleSubShapes())
    DeBug.groupEnd()
  }

  //MARK: cutIslands() 
  //METH: cutIslands()
  cutIslands({
    profile,
    selection,
    direction = this.direction,
    isOutsetCut = false,    // is the single cut to outset using cellOutset, false subtracts cellOutset
    layerStart,           // layerStart should be greater than layerEnd, swapped if not!
    layerEnd,             // if unassigned, layerEnd = cutEnd
    dilationStart,        // overrides layerStart and crops into the dilationRadius
    dilationEnd,          // overrides layerEnd and stretches to the minOutsideCorner radius
    loftScale = 1,
    outsetLoft = true,
    angleOffset,
    amount = 1,
    cascadeStyle,         // TODO: implement irrational(squareRoot) & rational(harmonic) canonical series
    perimeter = false,    // setting for making channels/walls
    isFrame = false,
    addBacking = false,
    backingColor = frameColor,
    spanOp = 1 / 1,       // ratio of widths, start to end
    loftOp = 1 / 1,       // ratio of lofts, start to end
    selOps = []
  } = {}) {
    const cutObj = {
      profile: profile,
      layerStart: layerStart,
      layerEnd: layerEnd,
      dilationStart: dilationStart,
      dilationEnd: dilationEnd,
    }
    this.cuts.push(cutObj)
    const outset = this.grid.cellOutset

    DeBug.groupCollapsed(`${this.id}.cutIslands: ${profile?.description || `frameBase`}`)
    DeBug.log(`layer start/end`, layerStart, layerEnd)
    if (layerStart < layerEnd || layerStart === undefined) {            // layerStart should be larger, outside fx radius
      [layerStart, layerEnd] = [layerEnd, layerStart]                   // swap if needed
    }
    DeBug.log(`layer swap start/end`, layerStart, layerEnd)
    if (!isFrame) {                                                     // CELLOUTSET 1
      DeBug.log(`isOutsetCut`, isOutsetCut)
      DeBug.log(`outset`, outset)
      DeBug.log(`layerEnd`, layerEnd)
      layerStart = isOutsetCut ? layerStart + outset : max(layerStart - outset, 0)
      if (layerEnd !== undefined) { layerEnd = isOutsetCut ? layerEnd + outset : layerEnd - outset }
      // if (layerEnd !== undefined) { layerEnd = isOutsetCut ? layerEnd + outset : max(layerEnd - outset, 0) }
    }
    DeBug.log(`outset start/end`, layerStart, layerEnd)

    if (addBacking) {                                                   // add flat fill layer below
      //TODO: incorporate backingColor, fix insetscale usage
      const insetScale = profile?.hasOutsetShade ? 1 : max(layerStart || 0, layerEnd || 0)
      // const insetScale = 1
      // const insetScale = max(layerStart || 0, layerEnd || 0)
      const newIslands = this.createSubIslands({ direction: direction, insetScale: insetScale })
      if (!newIslands.flat().isEmpty) { this.islandsToShapeGroups(newIslands, undefined, direction) }
    }

    DeBug.log(`useDilation elements:`, layerEnd, dilationStart, dilationEnd)
    let useDilation = layerEnd === undefined || !!dilationStart || !!dilationEnd //  4 cases => useDilation
    if (isFrame) { useDilation = false }
    DeBug.log(`useDilation:`, useDilation)

    //calculate maxLofts per shape

    DeBug.log(`cutIslands perimeterShapes:`, this.perimeterShapes)
    let shapeGroups = new OpArray
    this.perimeterShapes.forEach(sh => {                                  // create shapeGroups from common shape minRads
      DeBug.error(`current shape in queue`, sh)
      // const minInset = profile?.hasOutsetShade ? layerEnd : layerStart
      // let minRad = useDilation ? sh.minOutsideCornerRadius : minInset * this.grid.cellRadius
      DeBug.log(`minOutsideCornerRadius`, sh.minOutsideCornerRadius)
      let minRad = sh.minOutsideCornerRadius
      if (amount > 1) {
        if (sh.isLeaf
          || sh.hasOffsetConnections
          || sh.isPizzaSlice
        ) { minRad = sh.minCornerRadius }
        if (!this.grid.cellAspect.isSquare) {
          if (sh.minInsideCornerRadius < sh.minOutsideCornerRadius) { minRad = sh.minInsideCornerRadius }
        }
      } else {
        if (sh.isPizzaSlice) { minRad = sh.minCornerRadius }
        if (sh.isPointedLeaf) { minRad = sh.maxCornerRadius }
        if (sh.hasOffsetConnections) {
          const start = isOutsetCut ? layerStart - outset : layerStart + outset
          minRad = start * this.grid.cellRadius
        }
      }
      if (sh.hasSingleWidth || sh.hasOrdinalConnections) {
        if (profile?.hasOutsetShade
          || (outset > 0.5 || amount > 1)
        ) {
          minRad = this.grid.cellRadius
        }
      }

      //TODO: hierarchy downgrade - use once interGrids are implemented
      // if (this.perimeterIslands.last.direction.hierarchy > direction.hierarchy) {  // hierarchy downgrade - use
      //   minRad = this.grid.cellRadius
      // }

      minRad = roundToDec(minRad, 4)
      if (minRad <= 0) { return }
      const neighbors = sh.neighborShapesCardinal
      DeBug.warn(`minRad`, minRad)
      DeBug.warn(`neighbors`, neighbors)
      let group = shapeGroups.find(g =>
        equalsRoundedDec(g.minRad, minRad, 1)
        && g.shapes.every(s => neighbors.every(n => n.id !== s.id))
      )
      if (!group) {
        const id = shapeGroups.filter(g => g.minRad === minRad).length
        group = { id: id, minRad: minRad, shapes: new OpArray }
        shapeGroups.push(group)
      }
      group.shapes.push(sh)
    })
    shapeGroups = shapeGroups.sort((a, b) => b.minRad - a.minRad)
    DeBug.log(`cutIslands shapeGroups:`, shapeGroups)


    if (loftScale < 1 / FRAME.pixToUserUnits) {                           // loftScale cant be less than 0
      DeBug.error(`cutIslands error: zero loft`)
      return                                                              // exit
    }
    if (loftScale > 1) { loftScale = 1 }                                  // loftScale cant be greater than 1

    const extHighDepth = 1 - layerStart * this.grid.cellRadius / this.grid.cellRadius * 4
    // shapeGroups = shapeGroups.slice(0, 1)
    //FIXME: FINAL ISSUE: layerStart/layerEnd need to be reset for every Cutting Loop 
    //MARK: Cutting Loop
    shapeGroups.forEach(grp => {
      DeBug.log(``)
      DeBug.warn(`current shapegroup`, grp)
      DeBug.log(`minRad`, grp.minRad)
      DeBug.log(`cellRadius`, this.grid.cellRadius)
      // DeBug.error(`layerEnd`, 1 - grp.minRad / this.grid.cellRadius)
      let [grpLayerStart, grpLayerEnd] = [layerStart, layerEnd]
      DeBug.log(`current start/end`, layerStart, layerEnd)
      DeBug.log(`current grp start/end`, grpLayerStart, grpLayerEnd)
      let maxDilationAmount = roundToDec(1 - (grp.minRad / this.grid.cellRadius), 4)
      let maxDilationRadius = 1 - maxDilationAmount

      // let dilationRange = range(maxDilationAmount, grpLayerStart)
      // maxDilationAmount = isOutsetCut ? maxDilationAmount - outset : maxDilationAmount + outset
      DeBug.log(`maxDilationAmount`, maxDilationAmount)
      DeBug.log(`maxDilationRadius`, maxDilationRadius)
      // DeBug.log(`dilationRange`, dilationRange)
      if (maxDilationAmount > 0) { maxDilationAmount = 0 }
      let dilationAmount, dilationStartRadius, dilationEndRadius
      let cut, insetScale

      if (useDilation) {                                        // extend cutRad into shape based upon grp.minRad
        DeBug.error(`using Dilation!`)
        if (!dilationStart) { dilationStart = 0 }                          // !dilationStart => dilationStart = 0
        if (!dilationEnd) { dilationEnd = 1 }                              // !dilationEnd   => dilationEnd = 1
        // dilationStartRadius = dilationStart * maxDilationRadius + maxDilationAmount
        // dilationEndRadius = dilationEnd * maxDilationRadius + maxDilationAmount
        dilationStartRadius = dilationStart * maxDilationAmount
        dilationEndRadius = dilationEnd * maxDilationAmount

        DeBug.log(`dilationStart`, dilationStart)
        DeBug.log(`dilationEnd`, dilationEnd)
        DeBug.log(`dilationStartRadius`, dilationStartRadius)
        DeBug.log(`dilationEndRadius`, dilationEndRadius)

        // grpLayerStart = 1 - dilationStart

        if (profile?.hasInsetShade) {
          DeBug.error(`this hasInsetShade`)
          grpLayerEnd = isOutsetCut ? maxDilationAmount + outset : maxDilationAmount
          grpLayerEnd = maxDilationAmount
        } else {                                                // profile?.hasOutsetShade
          DeBug.error(`this hasOutsetShade`)
          maxDilationAmount = isOutsetCut ? maxDilationAmount + outset : maxDilationAmount - outset
          DeBug.log(`maxDilationAmount`, maxDilationAmount)
          // const fullRadius = 1 - maxDilationAmount
          // grpLayerEnd = fullRadius / (amount + 1)
          grpLayerEnd = maxDilationRadius / (amount + 1) + maxDilationAmount
          if (
            // grpLayerEnd > 0 
            // &&
            2 * grpLayerEnd < grpLayerStart) { grpLayerEnd = grpLayerStart / 2 }
        }


        // if (grpLayerEnd > 0 && 2 * grpLayerEnd < grpLayerStart) { grpLayerEnd = grpLayerStart / 2 }
        DeBug.log(`current grp start/end`, grpLayerStart, grpLayerEnd)
        const dilationRange = range(grpLayerStart, grpLayerEnd)
        grpLayerStart = range().convertRange(dilationStart, dilationRange)
        grpLayerEnd = range().convertRange(dilationEnd, dilationRange)
        let newStart = range().convertRange(dilationStart, dilationRange)
        let newEnd = range().convertRange(dilationEnd, dilationRange)
        DeBug.log(`dilationRange`, dilationRange)
        DeBug.log(`newStart`, newStart)
        DeBug.log(`newEnd`, newEnd)


        // DeBug.warn(`this`, this)
        // DeBug.warn(`islands`, this.perimeterIslands)
        //TODO: Integrate with InfraGrids once they are implemented, 
        // NOTE: ideally using range conversion for start/end: ie (1,0)->(2,0) for 2x2 island --> 1x1 infraGrid
        if (
          // this.perimeterIslands.last.direction.hierarchy > direction.hierarchy
          // &&
          grpLayerStart < 0) {                                // remove layers that start below 0
          DeBug.warn(`grpLayerStart is less than zero!`)
          return
        }




      } else {
        DeBug.log(`not using Dilation`)
      }
      // DeBug.log(`maxDilationAmount`, maxDilationAmount)
      DeBug.log(`after dilation start/end`, grpLayerStart, grpLayerEnd)


      // if (profile?.hasOutsetShade) {
      //   const maxLayer = grpLayerEnd - maxDilationAmount
      //   // const maxLayer = grpLayerStart
      //   const minLayer = (grpLayerStart - grpLayerEnd)
      //   const maxStart = amount < 2 ? (amount + 1) * maxLayer : (amount + 2) * maxLayer
      //   DeBug.log(`profile`, profile)
      //   DeBug.log(`maxLayer`, maxLayer)
      //   DeBug.log(`minLayer`, minLayer)
      //   DeBug.log(`maxStart`, maxStart)
      //   if (minLayer > maxStart) { grpLayerStart = maxLayer + maxStart }
      // }
      DeBug.log(`after hasOutsetShade handling`, grpLayerStart, grpLayerEnd)

      const firstLayerEnd =
        // amount > 1 && profile?.hasOutsetShade ?
        //   (isOutsetCut ? 1 + outset : 1 - outset)
        //   :
        grpLayerEnd

      const firstLayerRange = range(grpLayerStart, firstLayerEnd)                     // create range
      const firstStepWidth = firstLayerRange.size / amount                      // equal step division

      // if(profile?.isCutIn) {}
      const subLayerRange = range(grpLayerStart, grpLayerEnd)                     // create range
      const subStepWidth = subLayerRange.size / amount                      // equal step division     
      DeBug.log(`firstLayerRange`, firstLayerRange)
      DeBug.log(`subLayerRange`, subLayerRange)

      let cutStart, cutEnd
      for (let i = 0; i < amount; i++) {                                    // if amount>1, calc cutStart/End for each step
        const layerRange = i === 0 ? firstLayerRange : subLayerRange
        const stepWidth = i === 0 ? firstStepWidth : subStepWidth
        let loft = i === 0 ? min(layerRange.size, stepWidth) : layerRange.size * loftScale / amount                     // calc loft

        if (loft === 0) { continue }
        // cutStart = profile.hasInsetShade ? grpLayerStart - i * stepWidth : grpLayerStart - i * stepWidth
        // cutEnd = profile.hasInsetShade ? cutStart - stepWidth : cutStart - stepWidth
        cutStart = grpLayerStart - i * stepWidth
        cutEnd = cutStart - stepWidth
        if (loftScale < 1) {                                              // process outSetLoft
          if (outsetLoft) {
            DeBug.log(`using outsetLoft`)
            cutEnd = cutStart - loft
          } else {
            DeBug.log(`using insetLoft`)
            cutStart = cutEnd + loft
          }
        }
        const cutRange = range(cutStart, cutEnd)
        if (profile) {
          // insetScale = grpLayerStart
          // insetScale = cutEnd
          insetScale = profile.hasInsetShade ? cutStart : cutEnd
          // insetScale = profile.isCutOut ? insetScale + loft : insetScale //FIXME: THIS FIXES jOut cuts!!! But not rIn cuts??
        } else {
          insetScale = grpLayerStart
        }


        DeBug.log(`layerRange`, layerRange)
        DeBug.log(`cutRange`, cutRange)
        DeBug.log(`insetScale`, insetScale)

        // if (loft > 2 * insetScale) { loft = 2 * insetScale }

        if (profile) {
          cut = new ProtoCut({
            profile: profile,
            depth: loft * this.grid.minCellWidth,
            start: insetScale,
            extHighDepth: extHighDepth,
            useExtHighDepth: profile.isR ? amount < 2 : true,   //FIXME: also check 'cuts' for consecutive rCuts!
            angleOffset: angleOffset,
          })
        }

        DeBug.log(`loft`, loft)
        DeBug.log(`cut`, cut)
        DeBug.log(`cut filters`, cut?.filters)

        //TODO: in order to get MAX loft, createSubIslands should be called first so that we can check for minRadius
        // FIXME: currently createSubIslands requires cut input? Need to remove this and assign cut after!
        const islands = grp.shapes.map(sh => sh.island)
        // const islands = undefined
        DeBug.groupCollapsed(`createSubIslands`)
        DeBug.log(`direction`, direction.name)
        let newIslands = this.createSubIslands({ cut: cut, islands: islands, selection: selection, direction: direction, insetScale: insetScale })
        DeBug.groupEnd()
        DeBug.groupCollapsed(`islandsToShapeGroups`)
        if (!newIslands.flat().isEmpty) { this.islandsToShapeGroups(newIslands, cut, direction, isFrame) }
        DeBug.groupEnd()
        DeBug.log(``)
      }


      // }
    })
    DeBug.groupEnd()
    // else if (layerEnd === `max`) {
    //   const squareIslands = newIslands.filter(i => i.isSquare)
    // }
  }
  //METH: createSubIslands() :
  createSubIslands({ cut, selection, islands = this.perimeterIslands, direction = this.direction, insetScale = 1 } = {}) {
    DeBug.warn(`${this.id}.createSubIslands, this.islands =`, this.islands.map(i => i.id))
    DeBug.groupCollapsed(`Island.createSubIslands`)
    const newIslands = islands.map(pIsle =>
      pIsle.createSubIslands({
        islandLevel: this.islandLevel + 1,
        selection: selection,
        direction: direction,
        cut: cut,
        insetScale: insetScale,
      }))

    DeBug.groupEnd()

    return newIslands
  }
  //METH: assignToShapeGroups()
  islandsToShapeGroups(islands, cut, direction, isFrame = false) {
    DeBug.log(`islandsToShapeGroups`)
    DeBug.log(`islands`, islands)
    DeBug.log(`cut`, cut)
    DeBug.log(`direction`, direction)
    // DeBug.log(`shapes.svg`, islands.flat(this.islandLevel + 1).compacted.map(i => i.shape.svg))
    let iterator
    if (cut) {
      iterator = cut.filters
    } else {
      iterator = [undefined]
    }
    iterator.forEach((filter, i) => {
      this.islandLevel += 1
      const shapeGroup = this.createShapeGroup({
        islands: islands.flat(this.islandLevel).compacted,
        filter: filter,
        cut: cut,
        islandLevel: this.islandLevel,
        direction: direction,
        isFrame: isFrame,
        // insetScale: insetScale,
      })
      cut?.shapeGroups.push(shapeGroup)
      DeBug.log(`new shapeGroup`, shapeGroup)
    })
  }

  //METH: createShapeGroup() :
  createShapeGroup({ islands, cut, filter, islandLevel, direction = Direction.Cardinal, insetScale = 1, isFrame = false } = {}) {
    const shapeGroup = new ShapeGroup({
      cellGroup: this,
      islands: islands,
      isFrame: isFrame,
      protoParent: this,
      svgParent: this.svgElt,
      grid: this.grid,
      cut: cut,
      filter: filter,
      insetScale: insetScale,
      direction: direction,
      islandLevel: islandLevel,
      drawSVG: true,
      // drawRect: true,
    })
    this.shapeGroups.push(shapeGroup)
    return shapeGroup
  }
  // #endregion

  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        // .attribute('fill', protoColor(0, 127))
        .attribute('fill-opacity', 0)
        .attribute('stroke', 'black')
        .attribute('stroke-width', `.125`)
        .attribute('rx', 2)
        .attribute('ry', 2)
        .attribute('stroke-dasharray', `.25 1`)
    }
    if (this.drawSVG) {
      this.svgElt
        .viewBox(this.anchor, this.size, this.padding)
        .layout(this.anchor, this.size, this.padding)
      // .attribute('overflow', 'visible')
    }

  }
}

//MARK: SHAPEGROUP CLASS
// SIZE: 351 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ShapeGroup extends ProtoLayer {
  cellGroup
  islands
  isFrame
  svgGroupElt
  // shadeElt
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
    cut,
    insetScale,
    direction,
    isFrame,
  }) {
    DeBug.log(`New ShapeGroup! with arguments:`, arguments[0])
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      filter: filter,
      type: `ShapeGroup-${filter?.type || `backing`}`,
      // drawSVG: false,
      // drawRect: true,
      // drawFilter: false,
    })
    this.cut = cut
    this.cellGroup = cellGroup
    this.islands = islands
    this.grid = grid
    this.direction = direction
    this.islandLevel = islandLevel
    this.isFrame = isFrame

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true
    // this.drawLofts = true

    this.finishSetup(S.ShapeGroups)
  }

  // MARK: ShapeGroup Computed Properties
  get cellBounds() { return this.cellGroup.cellBounds }
  get boundsRect() { return this.cellGroup.boundsRect }
  get padding() {
    const backGroupPadding = Vertex.mult(this.grid.insetAmount, 2)
    const defaultPadding = Vertex.mult(this.cut?.padding || backGroupPadding, 2)
    // const defaultPadding = Vertex.div(Vertex.div(vert(100), this.grid.gridSize), this.grid.insetScale)
    //.div(this.grid.insetScale)
    // const backGroupPadding = 2 * this.grid.insetAmount.x
    // const defaultPadding = 100 / this.grid.gridSize.x / this.grid.insetScale.x
    // return defaultPadding
    // console.log(`defaultPadding`, defaultPadding)
    // console.log(`backGroupPadding`, backGroupPadding)
    return this.cellGroup.isBackGroup ? backGroupPadding : defaultPadding
  }
  get maxLayout() { return this.cut?.maxLayout }
  get finalSize() {
    const insetLayout = { x: this.insetAnchor.x, y: this.insetAnchor.y, width: this.insetSize.x, height: this.insetSize.y }
    const maxLayout = this.cut?.maxLayout || 100
    return {
      x: insetLayout.x * maxLayout.x / 100,
      y: insetLayout.y * maxLayout.y / 100,
      width: insetLayout.width * maxLayout.width / 100,
      height: insetLayout.height * maxLayout.height / 100,
    }
  }

  get shapes() { return this.islands.map(i => i.shape) }

  get shadeElt() {
    switch (this.type) {
      case `ShapeGroup-backing`:
        return this.grid.backElt
      case `ShapeGroup-combo`:
        return this.grid.comboElt
      case `ShapeGroup-high`:
        return this.grid.highElt
      case `ShapeGroup-shad`:
        return this.grid.shadElt
    }
  }


  // MARK: ShapeGroup Setup Methods
  //METH: finishSetup() override :
  finishSetup(store) {
    this.storeObject(store)
    this.assignElement()
    this.createSVGGroup()
    this.assignShapes()
    // this.drawElement()
    this.showDeBug()
  }
  //METH: assignElement() override
  assignElement() {
    super.assignElement()
    this.svgElt.parent(this.shadeElt)
  }
  //METH: createSVGGroup()
  createSVGGroup() {
    this.svgGroupElt = createElementNS(SVG.xmlns, 'g')
    const isleLvl = this.islandLevel.toString().padStart(2, '0')
    this.svgGroupElt
      .id(`${this.id}-${this.protoParent.id}-lvl${isleLvl}`)
      .parent(this.svgElt)
      // .parent(this.shadeElt)
      .addToClassList(this.id)
      // .addToClassList(this.shadeElt.classList.value)
      // .attribute('fill-rule', 'evenodd')
      .viewBox(this.anchor, this.size, this.padding)
      .layout(this.anchor, this.size, this.padding)
      .attribute(`fill`, frameColor)

  }
  //METH: assignShapes()
  assignShapes() {
    let sameForms = new OpArray
    let combined
    this.shapes.forEach(s => {
      // DeBug.log(`ShapeGroup.assignShapes() current svg: ${s.svg}`)
      // const pathCopy = s.path
      // DeBug.log(`pathCopy`, pathCopy)
      // pathCopy.elt = pathCopy.elt.cloneNode()

      // const nextPath = s.svg
      // if (combined) {
      //   combined = combined + ' ' + nextPath
      // } else {
      //   combined = nextPath
      // }

      const path = createSVGElt('path')
        .attribute(`d`, s.svg)
        .addToClassList(s.id)
        // .layout(s.anchor, s.size, s.padding)
        .attribute(`shape-rendering`, `geometricPrecision`)
        // pathCopy
        .id(`${s.id}-copy`)
        .parent(this.svgGroupElt)
      // .attribute('fill-rule', 'evenodd')
      // .attribute(`pathLength`, 154)
      this.paths.push(path)
    })

    // const path = createSVGElt('path')
    //   .attribute(`d`, combined)
    //   // .addToClassList(s.id)
    //   // .layout(s.anchor, s.size, s.padding)
    //   .attribute(`shape-rendering`, `geometricPrecision`)
    //   // pathCopy
    //   .id(`${this.id}-copy`)
    //   .parent(this.svgGroupElt)
    // // .attribute('fill-rule', 'evenodd')
    // // .attribute(`pathLength`, 154)
    // this.paths.push(path)
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

    if (this.isFrame) {
      this.svgElt
        .viewBox(vert(), vert(100, 200))
        .layout(vert(), vert(100, 200))
    } else {
      this.svgElt
        .attribute('overflow', 'visible')
        // .viewBox(this.insetAnchor, this.insetSize, this.padding)
        // .layout(this.insetAnchor, this.insetSize, this.padding)
        .viewBox(this.anchor, this.size, this.padding)
        .layout(this.anchor, this.size, this.padding)
      DeBug.log(`drawElement() layout vals`, this.anchor.string, this.size.string, this.padding.string)
    }



    // const length = path.elt.getTotalLength()

    this.svgGroupElt
      .viewBox(this.anchor, this.size, this.padding)
      .layout(this.anchor, this.size, this.padding)
      .attribute(`fill`, frameColor)
      // .attribute('overflow', 'visible')
      // .attribute(`filterUnits`, `userSpaceOnUse`)
      // .attribute(`primitiveUnits`, `userSpaceOnUse`)
      // .attribute('fill', protoColor(230))
      // .attribute('fill', lchcol02)
      // .attribute('fill', achromic(0.1))
      // .attribute('fill', 'red')
      // .attribute(`pathLength`, 12)
      // .attribute('stroke', `blue`)
      // .attribute(`stroke-dasharray`, `0 1 `)
      // .attribute(`stroke-linecap`, `round`)

      .attribute('fill-opacity', 1)
    // .attribute('fill-opacity', 0)
    // .attribute('stroke-width', this.grid.cellRadius * 1.4)
    // .attribute('stroke-opacity', 1)
    // .attribute('stroke-width', this.grid.cellRadius * .125)

    // .attribute('stroke-width', this.cellGroup.isBackGroup ? 0 : this.grid.cellRadius * .25)
    // .attribute('stroke-opacity', this.cellGroup.isBackGroup ? 0 : 1)
    // .attribute('fill-opacity', this.cellGroup.isBackGroup ? 1 : 0)
    console.warn(`ShapeGroup`, this.id)
    console.warn(`this.padding`, this.padding)
    console.warn(`this.cut`, this.cut)
    console.warn(`this.drawFilter`, this.drawFilter)


    const vintage = [
      [221, 179, 101],
      [124, 82, 134],
      [237, 124, 75],
      [28, 142, 184],
      [57, 144, 159],
      [191, 45, 54],
      [73, 184, 232],
    ]
    const sunset = [
      [215, 19, 39],
      [250, 146, 49],
      [131, 203, 223],
      [30, 21, 55],
      [238, 204, 112],
      [246, 114, 43],
    ]
    const sunset2 = [
      [222, 19, 39],
      [254, 206, 88],
      [252, 154, 49],
      [235, 99, 39],
      [245, 189, 39],
    ]
    const london = [
      [242, 54, 74],
      [199, 186, 176],
      [6, 83, 182],
      [86, 202, 250]
    ]
    const blues = [
      [30, 86, 185],
      [7, 59, 144],
      // [5, 114, 212],
      // [59, 183, 250],
      [15, 30, 55],
    ]
    const vapor = [
      [32, 154, 144],
      [132, 22, 119],
      [117, 27, 99],
      [55, 120, 103],
      [32, 14, 38]
    ]
    const grays = [
      [30, 30, 34],
      [50, 59, 52],
      // [96, 101, 102],
      [59, 62, 69],
      [15, 20, 23],
    ]
    const bw = [[0, 0, 0], [255, 255, 255]]
    const randomTransit = (palette) => {
      //  const val =R.random_choice(['#f22', '#48f', '#dd0', '#0'])
      const val = R.random_choice(palette)
      return protoColor(...val)
    }
    const randomTransit2 = () => {
      return R.random_choice(['#f26', '#22e', '#ff0', '#0'])
    }

    const randomLCH = (l) => {
      const hue = R.random_num(0, 360)
      const chroma = R.random_num(.0, .01)
      return `oklch(${l} ${chroma} ${hue})`
    }
    if (this.isFrame) {

      this.svgGroupElt
      // .attribute('fill', 'white')
      // .attribute('fill', 'black')
      // .attribute('fill', R.random_choice(['white', 'black']))
      // .attribute('fill', achromic(.3))
      // .attribute('fill', randomLCH(.2))
      // .attribute('fill', randomTransit(vintage))
      // .style(`background`, `linear-gradient(45deg, blue, red)`)
      // .attribute(`overflow`, `visible`)
      // .blur(R.random_choice([0, R.random_num(1, 2)]))
    } else {
      this.svgGroupElt
      // .attribute('fill', achromic(1))
      // .attribute('fill', randomLCH(.99))
      // .attribute('fill', 'white')
      // .attribute('fill', R.random_choice(['white', 'black']))
      // .attribute('fill-opacity', .5)
      // .attribute('fill', randomTransit(sunset))
      // .blur(R.random_num(0, 1))
      // .attribute('stroke', randomTransit(bw))
      // .attribute(`stroke-dasharray`, `2 2`)
      // .attribute(`stroke-linecap`, `round`)
      // .attribute('stroke-width', R.random_num(.25, 1))
      // .style('mix-blend-mode', `difference`)
      // .blur(R.random_choice([0, R.random_num(0, 1)]))
      // .attribute(`overflow`, `visible`)
    }

    if (this.drawFilter) {
      DeBug.error(`shapeGroup.drawFilter`, this.filter)
      this.svgGroupElt
        .applyFilter({
          filter: this.filter,
          // size: this.insetSize,
          size: Vertex.mult(this.insetSize, 1),
          // padding: Vertex.mult(this.insetSize, 2)
          padding: Vertex.mult(this.padding, 1),
          // padding: this.padding,
          // padding: Vertex.mult(this.grid.cellSize, 4)
        })
      // if (R.random_bool(0.2)) {
      //   this.svgGroupElt
      //     .applyFilter({
      //       filter: this.filter,
      //       size: Vertex.mult(this.insetSize, 1),
      //       padding: Vertex.mult(this.padding, 1),
      //     })
      // }

    }

    // this.cut.filters.forEach(filter => {
    //   this.svgGroupElt
    //     .applyFilter({ filter: filter, size: this.insetSize, padding: Vertex.mult(this.grid.cellSize, 2) })
    // })
  }
}

//MARK: CELL CLASS
// SIZE: 282 lines
// NOTE: drawSVG = false
// NOTE: drawRect = false
class Cell extends ProtoLayer {
  grid
  index
  coords
  isAvailable
  //TODO: in order to populate inside/over, need to make groupIDs a Set/Array. Need to fix symmetrize first though
  groupID = -1
  islandIDs = new Set()
  islandChecked = false
  // color
  segments
  interCell

  constructor({ protoParent, svgParent, grid, index, coords, isAvailable = true, color = '888' } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      type: 'Cell',
      drawSVG: false,
      // drawRect: true,
      insetScale: 1,
    })
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.isAvailable = isAvailable

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Cells)
  }

  // MARK: Cell Computed Properties
  // #region Computed Properties
  //MEMO: cellBounds
  get cellBounds() {
    return memoize(() => {
      return this.grid.cellBounds({ selection: OpArray.from([this]) })
    }, `cellBounds`).call(this)
  }
  //MEMO: boundsRect
  get boundsRect() {
    return memoize(() => {
      this.cellBounds.boundsRect
    }, `boundsRect`).call(this)
  }
  //MEMO: anchor
  get anchor() {
    return memoize(() => {
      return this.grid.cellAnchor(this.coords.x, this.coords.y)
    }, `anchor`).call(this)
  }
  //MEMO: size
  get size() {
    return memoize(() => {
      return this.grid.cellSize
    }, `size`).call(this)
  }
  //MEMO: aspect
  get aspect() {
    return memoize(() => {
      return this.size.aspect
    }, `aspect`).call(this)
  }
  //MEMO: minRadius
  get minRadius() {
    return memoize(() => {
      return this.grid.cornerRadius
    }, `minRadius`).call(this)
  }

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
  get isTaken() { return !this.isAvailable }
  // get isInAnIsland() { return this.grid.cellIsInAnIsland(this.index) }                                    //UNUSED:
  get hasAUTurn() { return this.segments.some(seg => seg.isUTurn) }
  get hasAStair() { return this.segments.some(seg => seg.isStair) }
  get hasACorner() { return this.segments.some(seg => seg.isCorner) }
  get hasAFlat() { return this.segments.some(seg => seg.isFlat) }

  get cardinalNeighborCoords() { return this.allNeighborsCoords(Direction.Cardinal) }
  get ordinalNeighborCoords() { return this.allNeighborsCoords(Direction.Ordinal) }

  get neighborSegments() {
    const cell = this.grid.neighbor(this.index, Direction.Right)
    return cell?.segments
  }

  get sideNeighbors() { return new Sides(this.cardinalNeighborCoords.map(co => this.grid.cellAtCoords(co.x, co.y))) }
  get cornerNeighbors() { return new Corners(this.ordinalNeighborCoords.map(co => this.grid.cellAtCoords(co.x, co.y))) }
  //MEMO: neighbors()
  get neighbors() {
    return memoize(() => {
      return this.validNeighbors()
    }, `neighbors`).call(this)
  }
  //MEMO:cardinalNeighbors() 
  get cardinalNeighbors() {
    return memoize(() => {
      return this.validNeighbors(Direction.Cardinal)
    }, `cardinalNeighbors`).call(this)
  }
  //MEMO:ordinalNeighbors() 
  get ordinalNeighbors() {
    return memoize(() => {
      return this.validNeighbors(Direction.Ordinal)
    }, `ordinalNeighbors`).call(this)
  }
  get availableCardinalNeighbors() { return this.cardinalNeighbors.filter(c => c.isAvailable) }
  get takenCardinalNeighbors() { return this.cardinalNeighbors.filter(c => !c.isAvailable) }
  get hasTwoCardinalNeighbors() { return this.takenCardinalNeighbors.length === 2 }
  get hasOppositeNeighborsTaken() {
    const n = this.sideNeighbors
    return (n.horizontals.every(c => c?.isTaken) || n.verticals.every(c => c?.isTaken))
  }

  get cardinalGroupNeighbors() { return this.cardinalNeighbors.filter(c => c?.groupID === this.groupID) }
  get ordinalGroupNeighbors() { return this.ordinalNeighbors.filter(c => c?.groupID === this.groupID) }
  get hasOppositeCardinalGroupNeighbors() {
    const n = this.sideNeighbors
    return (n.horizontals.every(c => c?.groupID === this.groupID) && n.verticals.every(c => c?.groupID !== this.groupID))
      || (n.horizontals.every(c => c?.groupID !== this.groupID) && n.verticals.every(c => c?.groupID === this.groupID))
  }
  get hasOppositeOrdinalGroupNeighbors() {
    const n = this.cornerNeighbors
    return (n.posOrdinals.every(c => c?.groupID === this.groupID) && n.negOrdinals.every(c => c?.groupID !== this.groupID))
      || (n.posOrdinals.every(c => c?.groupID !== this.groupID) && n.negOrdinals.every(c => c?.groupID === this.groupID))
  }

  get hasThreeCardinalGroupNeighbors() { return this.cardinalGroupNeighbors.length === 3 }
  get hasOffsetConnection() { return this.hasThreeCardinalGroupNeighbors && this.hasOppositeOrdinalGroupNeighbors }

  get ordinalOnlyNeighbors() {
    //ARROW: isOnlyOrdinalTo()
    const isOnlyOrdinalTo = (thisCell, neighbor) => {
      const dir = thisCell.grid.directionToNeighbor(this, neighbor)
      const adjDirs = dir?.adjacents
      const adjNeighbors = thisCell.validNeighbors(adjDirs)

      // DeBug.error(`${thisCell.id} isOnlyOrdinalTo to ${neighbor.id}?`)
      // DeBug.warn(`dir`, dir)
      // DeBug.warn(`adjDirs`, adjDirs)
      // DeBug.warn(`adjNeighbors`, adjNeighbors)
      return adjNeighbors.every(n => thisCell.groupID !== n.groupID)
    }

    // DeBug.log(``)
    let ordinals = this.ordinalNeighbors
    // DeBug.warn(`ordinalOnlyNeighbors for:`, this)
    // DeBug.log(`first ordinals`, ordinals)
    ordinals = ordinals
      .filter(c =>
        c.groupID === this.groupID
        && isOnlyOrdinalTo(this, c)
      )
    // DeBug.log(`filtered ordinals`, ordinals)
    return ordinals
  }

  // #endregion
  // MARK: Cell Geometry Methods
  // #region Geometry Methods
  //METH:
  neighborCoords(direction) {
    // DeBug.log(`neighborCoords direction`, direction)
    // DeBug.log(`neighborCoords moveCoord`, direction.moveCoord)
    return Vertex.add(this.coords, direction.moveCoord)
  }
  //METH:
  allNeighborsCoords(direction = Direction.All) {
    // DeBug.log(`allNeighborsCoords`, direction.vals)
    const result = direction.directions.map(dir => this.neighborCoords(dir)).compacted
    // DeBug.log(`allNeighborsCoords result`, result)
    return result
  }
  //FIXME: check to see if this method is being used. Seems like no, because bounds was not properly assigned before!
  //METH:
  validNeighborsCoords(direction = Direction.All, bounds = this.grid.gridCellBounds,) {
    return this.allNeighborsCoords(direction).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
  }
  //METH: validNeighbors()
  validNeighbors(direction) { return this.grid.validNeighbors({ selection: [this], direction: direction }) }
  //METH: validNeighborsDirections()
  validNeighborsDirections(direction) { return this.validNeighbors(direction).map(v => Direction.fromMoveCoord(Vertex.sub(v.coords, this.coords))) }
  //METH: availableMoveDirections()
  availableMoveDirections(direction, selection = this.grid.availableCells) {
    // DeBug.log(`availableMoveDirections validNeighbors`, this.validNeighbors(direction))
    return this.validNeighbors(direction)
      .filter(val => selection.some(sel => {
        // DeBug.log(`val-sel`, val.id, sel.id, val.id === sel.id)
        return val.id === sel.id
        return val.equals(sel)
      }))
      .map(v => Direction.fromMoveCoord(Vertex.sub(v.coords, this.coords)))
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
      DeBug.error(`interCell already existed!`)
      return
    }
    if (this.grid.validNeighbors({ selection: [this], direction: Direction.DownRight }).isEmpty) {
      // DeBug.error(`No possible interCell: out of bounds.`)
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
// SIZE: 613 lines
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
  maxCorners

  constructor({
    cells,
    // cut,
    protoParent,
    svgParent,
    grid,
    groupID,
    parentIslandID,
    direction = Direction.Cardinal,
    maxCorners = true,
    stored = true,
    insetScale = 1,
    drawFilter = true,
    allowsProtoErrors = false,
  } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      type: parentIslandID ? 'Island' : 'PerimeterIsland',
      insetScale: insetScale,
      drawSVG: false,
      drawRect: false,
      drawFilter: drawFilter,
      allowsProtoErrors: allowsProtoErrors,
    })
    DeBug.log(`New Island! with arguments:`, arguments[0])
    this.cells = cells
    // this.cut = cut
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.maxCorners = maxCorners
    this.parentIslandID = parentIslandID
    this.islandLevel = parentIslandID ? protoParent.islandLevel + 1 : 0 // perimeterIslands should be 0, the rest above

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    if (stored) { this.finishSetup(S.Islands) }
    DeBug.log(`new (${this.type})-type Island completed:`, this)
    DeBug.log(``)
    // this.color = R.random_hash(3, '#')
  }

  // MARK: Island Computed Properties
  // #region Computed Properties
  get testLook() { return Look.test(this.size, 'island') }
  get testColor() { return protoColor(255, 230, 0, 1) }
  //MEMO: allSubIslands
  get allSubIslands() {
    //FIXME: using resetMemoized() when islands are added, memoize should be reinstated here
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

  get ordinalConnections() { return this.cells.filter(c => !c.ordinalOnlyNeighbors.isEmpty) }
  get hasOrdinalConnections() { return !this.ordinalConnections.isEmpty }

  get isSingleCell() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index, Direction.All))
  }
  get isCardinalSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index))
  }
  get isPill() { return this.cellCount === 2 && this.isCardinal }
  get isOrdinalCapsule() { return this.cellCount === 2 && this.isOrdinal }

  get isHorizontal() {
    return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Vertical))
  }
  get isVertical() {
    return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Horizontal))
  }
  get isLine() { return this.isSingleCell || this.isHorizontal || this.isVertical }
  get isCardinal() {
    return !this.isSingleCell
      && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Ordinal))
  }
  get isOrdinal() { return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index)) }

  get isRectangle() { return !this.isLine && this.cellBounds.isFull }
  get isSquare() { return this.isRectangle && this.cellBounds.aspect.isSquare }

  get offsetConnectionCells() { return this.cells.filter(c => c.hasOffsetConnection) }
  get hasOffsetConnections() { return !this.offsetConnectionCells.isEmpty }             // squares connected with a common row/column, bad stair creation
  get offsetConnections() { return this.cells.filter(c => c.hasOffsetConnection) }

  get directionHierarchy() { return this.direction.hierarchy }
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
      return this.findNeighborIslands(Direction.All)
    }, `neighborIslands`).call(this)
  }
  //MEMO: neighborIslandsCardinal
  get neighborIslandsCardinal() {
    return memoize(() => {
      return this.findNeighborIslands(Direction.Cardinal)
    }, `neighborIslandsCardinal`).call(this)
  }

  findNeighborIslands(direction) {
    let neighbors = this.grid.tempOutlineSelection(this.cells, 1, direction)
      .map(c => c.islandIDs.values().next().value)
      .compacted
      .unique()
      .map(id => this.grid.islandNamed(id))
      .compacted
    // DeBug.log(neighbors)
    return neighbors
  }


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
    if (!this.maxCorners || this.directionHierarchy < 2) { return this.cells }
    if (shape.simpleSubShapes.isEmpty) {
      DeBug.error(`cannot recalcdCells because shape has no simpleSubShapes`)
      return this.cells
    }
    DeBug.groupCollapsed(`recalcdCells shape`, shape)
    const cellRadius = this.grid.cellRadius
    // let newCells = this.cells
    let shapeCorners = shape.insetSubShapes.map(sub => {
      DeBug.log(`sub`, sub)
      return sub
        .filter(seg =>                                  // filter corners with minimum curvature
          roundToDec(seg.startNeighbor.availableEndLength, 1) > roundToDec(cellRadius, 1)
          || roundToDec(seg.availableStartLength, 1) > roundToDec(cellRadius, 1)
        )
    }).flat(1)
    DeBug.log(`shapeCorners`, shapeCorners)
    if (shapeCorners.isEmpty) {
      DeBug.error(`recalcdCells: Cells remain the same!`)
      DeBug.groupEnd()
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
        DeBug.log(`squareVerts`, squareVerts)

        const cellOrigin = (cell, remove = true) => {
          // DeBug.warn(`arcOrigins`, cell.arcOrigins)
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
          // DeBug.log(`${cell.id}: cellCenter: ${cell.center.string}, origin: ${origin.string}, squareVerts: `, [squareVerts[0].string, squareVerts[2].string])
          return origin.x > squareVerts[0].x
            && origin.y > squareVerts[0].y
            && origin.x < squareVerts[3].x
            && origin.y < squareVerts[3].y
        })
        DeBug.log(`cornerCells`, cornerCells.map(c => c.id))

        if (isOutsideCorner) {
          cornerCells.forEach(cell => {
            const length = segment(origin, cellOrigin(cell)).length + cellRadius * (newInsetScale + loft)
            DeBug.log(`rem ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
            if (length >= arcRadius) { removeCells.push(cell) }
          })
        } else {
          cornerCells.forEach(cell => {
            const length = segment(origin, cellOrigin(cell, false)).length - cellRadius * (newInsetScale + loft)
            DeBug.log(`add ${cell.id}: length: ${length}, arcRadius: ${arcRadius}`)
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
      DeBug.log(`this.cells`, this.cells.map(c => c.id))
      DeBug.log(`addCells`, addCells.map(c => c.id))
      DeBug.log(`removeCells`, removeCells.map(c => c.id))
      DeBug.log(`newCells`, newCells.map(c => c.id))
      DeBug.groupEnd()
      return newCells
    }

  }
  // #endregion
  // MARK: Island Creation Methods
  // #region Island Creation Methods
  //METH: createSubIslands() :
  createSubIslands({ cut, selection, direction = Direction.Cardinal, insetScale = 1, drawFilter = true } = {}) {
    DeBug.groupCollapsed(`${this.id} Island.createSubIslands`)
    if (this.subIslands && !selection) {
      //NOTE: recursive dive to create subIslands on the bottom-most (visually top/inner-most) subIslands
      DeBug.error(`Divers go down! This.subIslands = `, this.subIslands.map(i => i.id))
      DeBug.groupEnd()
      return this.subIslands.map(isle =>
        isle.createSubIslands({
          selection: selection,
          direction: direction,
          cut: cut,
          insetScale: insetScale,
          drawFilter: drawFilter
        })
      )
    }
    DeBug.warn(`createSubIslands direction`, direction.name)
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

        // let interGrid = new Grid({
        //   protoParent: this,
        //   gridSize: gridSize,
        //   startCoord: startCoord,
        //   isInterGrid: true,
        // })
      }

      //ARROW: copyIsland()
      const copyIsland = () => {
        DeBug.log(`copying island ${this.id}`)
        // copy this island but change inset, set filter, set drawFilter
        const subIsland = this.copy({ insetScale: insetScale, drawFilter: drawFilter })
        // DeBug.log(`created subIsland: `, subIsland)
        subIslands = OpArray.from([subIsland])
      }
      //ARROW: newIslands()
      const newIslands = (newCells) => {
        const newIsles = this.grid.createIslands({ // create new Islands with new direction
          selection: newCells,
          islandID: this.id,
          direction: direction,
          insetScale: insetScale,
          drawFilter: drawFilter,
        })
        newIsles?.forEach(i => {
          i.createSimpleSubShapes()            // must create SimpleSubShapes for new Islands
          DeBug.log(i.shape.simpleSubShapes)
          const simples = i.shape.allSimpleSegs
          this.grid.curveMinRadiusCorners({ corners: simples })
          // this.grid.createCubicCorners({ subShapes: i.shape.simpleSubShapes, outWrap: false })
          // i.shape.assignElement()
          // i.shape.drawElement()
        })
        return newIsles
      }

      //NOTE: Change new direction
      // protect Island stacking from visual overlapping errors
      if (direction.hierarchy > this.directionHierarchy) { // new direction cannot be greater than current
        DeBug.error(`trying to create SubIslands out of hierarchy. changing direction to "${this.direction.name}"`)
        direction = this.direction // downgrade newDirection to same as current Island
      }
      // ordinal corner connecters visually collapse with inset < 0.75
      if (direction.isAll && insetScale < 0.75) {
        DeBug.error(`trying to create SubIslands with All and inset < 0.75. changing direction to Cardinal`)
        direction = Direction.Cardinal // downgrade newDirection to Cardinal to avoid collapse/overlap 
      }

      //NOTE: Process new direction
      // same direction: safest/fastest to copy Island and apply new inset
      if (selection) {
        DeBug.error(`subIslands selection`, selection.map(c => c.id))
        const newCells = selection.intersect(this.cells, 'id')
        DeBug.warn(`subIslands this.cells`, this.cells.map(c => c.id))
        DeBug.warn(`subIslands newCells`, newCells.map(c => c.id))
        subIslands = newIslands(newCells)
      } else {
        if (direction.equals(this.direction)) { copyIsland() }

        // different direction: requires new island and/or shape creation
        if (direction.hierarchy < this.directionHierarchy) {
          DeBug.warn(`creating ${this.id} subIslands with direction: ${direction.name}`)
          // parent direction is All and new direction is Cardinal: careful reconstruction of current SimpleSubShapes
          if (this.direction.isAll && direction.isCardinal) { //
            if (!this.ordinalConnections.isEmpty) {
              DeBug.log(`using copyAllToCardinal()`)
              subIslands = this.copyAllToCardinal(insetScale, drawFilter)
              DeBug.log(`copyAllToCardinal() subIslands:`, subIslands)
            } else {
              copyIsland()
            }
          }
          // parent direction is All/Cardinal: recalculate island cells based on parent shape, then create new islands
          else if (this.directionHierarchy >= 2 && direction.hierarchy < 2) {
            DeBug.log(`  triggering a recalcdCells on ${this.id}`)
            const newCells = this.recalcdCells({ newInsetScale: insetScale, loft: cut?.depth || 0 })
            subIslands = newIslands(newCells)
          }
        }
      }
    }
    this.subIslands = subIslands
    // this.subIslands.forEach(i => i.drawShapes())
    DeBug.log(`new subIslands: `, subIslands)
    DeBug.groupEnd()
    return subIslands
    // DeBug.log(`new subShapes`, subIslands.map(isle => isle.shape))
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
    // DeBug.log(`copying island`, this.id)
    const newIsland = new Island({
      cells: cells,
      protoParent: protoParent,
      svgParent: protoParent.svgElt, // Test this!!!
      insetScale: insetScale,
      grid: this.grid,
      groupID: this.groupID,
      parentIslandID: this.id,
      direction: direction,
      maxCorners: this.maxCorners,
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
    // DeBug.log(`newIsland`, newIsland)
    return newIsland
  }
  //METH: copyAllToCardinal() :
  copyAllToCardinal(insetScale, drawFilter = true) {
    DeBug.log(`copyAllToCardinal`)
    DeBug.log(`insetScale`, insetScale)
    const cellIslands = this.grid.createIslands({
      insetScale: insetScale,
      drawFilter: drawFilter,
      selection: this.cells,
      islandID: this.id,
      direction: Direction.Cardinal,
      // stored: true,
      // createShape: true, // this might NOT be impacting my debug situation - if not please remove on createIslands()
    })
    DeBug.log(`cellIslands`, cellIslands.map(is => is.cells.map(c => c.id)))
    //NOTE: just added this for testing. Should try dropping in newSubShapes from above?
    const parentSimpleSubShapes = this.shape.simpleSubShapes
    cellIslands?.forEach((isle, i) => {
      const shape = isle.shape
      isle.createSimpleSubShapes()

      const simpleSubShapes = isle.shape.simpleSubShapes

      this.grid.inWrapPerimeter(simpleSubShapes.flat(), parentSimpleSubShapes.flat())
      // this.grid.maximizeCuddles(simpleSubShapes, 1)
      // this.grid.nestleShapes()

      DeBug.log(`shape`, shape)
      DeBug.log(`shape.svg`, shape.svg)
    })
    return cellIslands
  }
  //METH: createShape() :
  createShape(insetScale) {
    DeBug.log(`createShape for ${this.id}, insetScale`, insetScale)
    DeBug.log(`createShape`, this)
    let segments = OpArray.format(this.exposedSegments)
    DeBug.log(`segments`, segments)
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
                DeBug.log('thisSeg.end', thisSeg.end)
                DeBug.log('subShape[0].start', subShape[0].start)
                DeBug.error('cannot continue segmentShape')
              }
            }

            if (next.length === 1) { nextSeg = next[0] }
            if (next.length === 2) {
              DeBug.error('next has 2 segments')
              let nextDirection
              if (this.direction.someAreOrdinal) {
                // DeBug.log(`this.direction.someAreOrdinal`)
                nextDirection = thisSeg.direction.previous(2)
              } else {
                // DeBug.log(`!this.direction.someAreOrdinal`)
                nextDirection = thisSeg.direction.next(2)
              }
              nextSeg = next.find(e => e.direction.equals(nextDirection))
              // DeBug.log(`thisSeg here`, thisSeg)
              // DeBug.log(`nextSeg here`, nextSeg)
              if (!nextSeg) { DeBug.error('unexpected 2nd segment') }
            }
            // DeBug.log(``)
            // DeBug.log(this.grid.groups)
            // DeBug.log(this.id)
            // DeBug.group(`testgroup`)
            // DeBug.log(`subShape ${this.id} iter ${subShapeIter}`, segments)
            // DeBug.log(`thisSeg`, thisSeg)
            // DeBug.log(`nextSeg`, nextSeg)
            // DeBug.groupEnd()
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
      maxCorners: this.maxCorners,
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
    DeBug.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.shape.createSimpleSubShapes()
    DeBug.groupEnd()
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
    interGrid.setAvailability() // sets all cells to 'isTaken'
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
// SIZE: 407 lines
// NOTE: drawSVG = false    // the SVG path gets passed back up to ShapeGroup for rendering
// NOTE: drawRect = false
class Shape extends ProtoLayer {
  island
  maxCorners
  subShapes
  simpleSubShapes
  testVerts
  testColor
  path

  constructor({
    maxCorners = true,
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
      type: protoParent.type === `Island` ? 'Shape' : `PerimeterShape`,
      insetScale: insetScale,
      drawSVG: false,
      drawRect: false,
      drawFilter: false,
      // drawFilter: protoParent.drawFilter,
    })
    this.maxCorners = maxCorners
    this.subShapes = subShapes ? subShapes : new OpArray
    this.simpleSubShapes = simpleSubShapes ? simpleSubShapes : new OpArray
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.assignSegments()

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
  get padding() { return vert(this.grid.cellRadius) }

  get group() { return this.grid.groupNamed(this.groupID) }
  get groupID() { return this.island.groupID }
  get grid() { return this.island.grid }
  get simpleSegPaths() { return this.simpleSubShapes.map(sub => new SegPath(sub, this)) }
  get cells() { return this.island.cells }
  //MEMO: cutOutCells
  get cutOutCells() {
    return memoize(() => {
      if (!this.isSingleShape) { return this.simpleSegPaths.slice(1).map(sp => sp.cells).flat() }
    }, `cutOutCells`).call(this)
  }
  //MEMO: enclosedCells
  get enclosedCells() {
    return memoize(() => {
      return this.isSingleShape ? this.cells : this.cells.union(this.cutOutCells, `id`).gridVertSorted
    }, `enclosedCells`).call(this)
  }
  //MEMO: cutOutSegs
  get cutOutSegs() {
    return memoize(() => {
      if (!this.isSingleShape) { return this.simpleSubShapes.slice(1).flat() }
    }, `cutOutSegs`).call(this)
  }
  get cellRadius() { return this.grid.cellRadius }
  //MEMO: neighborShapes
  get neighborShapes() {
    return memoize(() => {
      // DeBug.error(`ISSUE neighborShapes HERE!!!`, this.island.neighborIslands)
      return this.island.neighborIslands.map(i => i.shape)
    }, `neighborShapes`).call(this)
  }
  //MEMO: neighborShapesCardinal
  get neighborShapesCardinal() {
    return memoize(() => {
      // DeBug.error(`ISSUE neighborShapesCardinal HERE!!!`, this.island.neighborIslands)
      return this.island.neighborIslandsCardinal.map(i => i.shape)
    }, `neighborShapesCardinal`).call(this)
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
  get isSingleShape() { return this.subShapes.length === 1 }

  get isLine() { return this.island.isLine }
  get isQuad() { return this.island.isRectangle }
  get isSquare() { return this.island.isSquare }
  get isRoundedSquare() {
    if (!this.isSquare) { return false }
    return this.allCornerRadii.every(min => roundToDec(min, 1) === roundToDec(this.allCornerRadii[0], 1))
  }
  get isCircle() {
    // return this.isRoundedSquare && this.allSimpleSegs.every(s => s.hasNoFlatness)
    return this.isRoundedSquare
      && equalsRoundedDec(this.minCornerRadius, this.insetSize.x / 2)
    // && roundToDec(this.minCornerRadius, 1) === roundToDec(this.insetSize.x / 2, 1)
  }
  get isLeaf() {
    const rads = this.allCornerRadii
    return this.island.isRectangle
      && !this.isCircle
      && (equalsRoundedDec(rads[0], rads[2], 1) && equalsRoundedDec(rads[1], rads[3], 1))
      && (!equalsRoundedDec(rads[0], rads[1], 1) || !equalsRoundedDec(rads[2], rads[3], 1))
    // && roundToDec(this.allCornerRadii[0], 1) === roundToDec(this.allCornerRadii[2], 1)
    // && roundToDec(this.allCornerRadii[1], 1) === roundToDec(this.allCornerRadii[3], 1)
  }
  get isSquareLeaf() { return this.isLeaf && this.isSquare }
  get isPointedLeaf() {
    const rads = this.allCornerRadii
    return this.isSquare
      && !this.isPizzaSlice
      && (equalsRoundedDec(rads[0], rads[2], 1) || equalsRoundedDec(rads[1], rads[3], 1))
      && (equalsRoundedDec(rads[0], rads[1], 1) || equalsRoundedDec(rads[2], rads[3], 1))
  }
  get isPizzaSlice() {
    const rads = this.allCornerRadii
    const minRad = min(rads)
    return this.isSquare
      && rads.filter(r => equalsRoundedDec(r, minRad)).length === 3
  }

  get hasSubShapes() { return this.subShapes.length > 1 }
  get hasUTurns() { return this.allSimpleSegs.some(s => s.isUTurn) }
  get shapeCorners() { return this.allSegments.map(s => s.cornerVerts).flat().unique(['x', 'y']) }
  get allSegments() { return this.subShapes.flat() }
  get allSimpleSegs() { return this.simpleSubShapes.flat() }
  get allInsideCorners() { return this.allSimpleSegs.filter(s => !s.isOutsideCorner) }
  get allOutsideCorners() { return this.allSimpleSegs.filter(s => s.isOutsideCorner) }
  get allCornerRadii() { return this.allSimpleSegs.map(s => s.arcRadius) }
  get assignedVerts() {
    return this.subShapes.map(sub => sub.map(s => s.assignedVerts).flat().unique(['x', 'y']))
    // .flat()
  }

  // get hasFlatness() { return this.allSimpleSegs.some(s => s.hasFlatness) }                               //UNUSED:
  // get canCurveMore() { return this.allSimpleSegs.some(s => s.canCurveMore) }                             //UNUSED:
  // get segsThatCanCurveMore() { return this.allSimpleSegs.filter(s => s.canCurveMore) }                   //UNUSED:
  get hasSingleWidth() { return this.cells.some(c => c.hasOppositeCardinalGroupNeighbors) }
  get hasOrdinalConnections() { return !this.island.ordinalConnections.isEmpty }
  get hasOffsetConnections() { return this.island.hasOffsetConnections }

  get minCornerRadius() { return min(this.allSimpleSegs.map(s => s.arcRadius)) }
  get maxCornerRadius() { return max(this.allSimpleSegs.map(s => s.arcRadius)) }
  get minInsideCornerRadius() {
    const corners = this.allInsideCorners
    if (corners.isEmpty) { return }
    if (this.isSingleShape) {
      return min(corners.map(s => s.arcRadius))
    }
  }
  get minOutsideCornerRadius() {
    if (this.isSquareLeaf) { return this.squareLeafLoftRadius }
    if (this.isSingleShape) {
      return min(this.allOutsideCorners.map(s => s.arcRadius))
    } else {
      const grid = this.grid
      const cellSize = grid.cellSize
      const minHorThick = this.cellBounds.minHorCellThickness
      const minVertThick = this.cellBounds.minVertCellThickness
      DeBug.log(`minHorThick`, minHorThick)
      DeBug.log(`minVertThick`, minVertThick)
      const horRadius = minHorThick * cellSize.x / 2
      const vertRadius = minVertThick * cellSize.y / 2
      DeBug.log(`horRadius`, horRadius)
      DeBug.log(`vertRadius`, vertRadius)
      return min(horRadius, vertRadius)
    }
  }
  get minInsetCornerRadius() { return this.minCornerRadius + (this.insetScale.x - 1) * this.cellRadius }
  get maxInsetCornerRadius() { return this.maxCornerRadius + (this.insetScale.x - 1) * this.cellRadius }

  get minSquareCornerRadius() {
    if (!this.isSquare) { return }
    if (this.isCircle) { return this.minCornerRadius }
    if (this.isSquareLeaf) { return this.squareLeafLoftRadius }
  }
  get squareLeafLoftRadius() {
    if (this.isSquareLeaf) {
      const arcCenter = this.allSimpleSegs.find(s => s.arcRadius === this.maxCornerRadius).arcCenterVert
      return this.center.dist(arcCenter)
    }
  }


  //MARK: SubShape Transforms
  //NOTE: the order of transforms: subShapes-->simpleSubshapes-->insetSubShapes can be rearranged
  //NOTE: simple first: inset transform is expensive, so better to call at end as allSimpleSubShapes is called a lot!
  //NOTE: inset first: 1. possibility of knowing that opposite-walled cells will disappear at insetScale === 0
  //NOTE: inset first: 2. might be some hierarchical or derivative scaling advantage to successive inset knowledge
  //NOTE: ultimately both have advantages. could make inset transform a method with two inset compProps: sub & simpleSub
  //MEMO: insetSubShapes
  get insetSubShapes() {
    // return memoize(() => {
    const subs = this.simpleSubShapes
    if (this.insetScale <= 0) {
      // TODO: future use with interGrids
    }

    DeBug.log(`subs`, subs)
    let insetSubShapes = subs?.map(sub => {
      let insetSubShape = new OpArray
      let prevInsetSeg

      sub.forEach((seg, i) => {
        let newInsetSeg = seg.insetCopy(this.insetScale) //create inset segment

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
    // }, `insetSubShapes`).call(this)
  }

  //MARK: SVG Paths
  //MEMO: insetSubShapes
  get svg() {
    // return memoize(() => {
    DeBug.groupCollapsed(`svg creation`)
    let result = this.insetSubShapes.map(e => SVGPath.fromProtoSegPath({
      segPath: e,
      // cornerMin: min(this.insetSize.x / 2, this.insetSize.y / 2)
    }))
    if (result instanceof Array) {
      result = result.join(' ')
    }
    DeBug.groupEnd()
    return result

    // }, `svg`).call(this)
  }

  // get svgPath() { return `path('${this.svg}')` }                                                         //UNUSED:

  // get perimeter() {                                                                                      //UNUSED:
  //   let result = this.subShapes.map(e =>
  //     SVGPath.fromSegPath({ segPath: e, refine: false, straightness: 1 })
  //   )
  //   if (result instanceof Array) {
  //     result = result.join(' ')
  //   }
  //   return result
  // }
  // get perimeterPath() { return `path('${this.perimeter}')` }

  // get extractedVerts() { return extractVerts(this.svg) }                                                 //UNUSED:

  // MARK: methods
  // #region methods
  //METH: hasSameForm() : Form = same shape, different position. Used for determining svg instancing
  hasSameForm(otherShape) {
    const length = this.simpleSegPaths.length
    if (length !== otherShape.simpleSegPaths.length) return false

    for (let i = 0; i < length; i++) {
      const a = this.simpleSegPaths[i], b = otherPath.simpleSegPaths[i]
      if (!a.hasSameForm(b)) return false
    }
    return true
  }
  //METH: createSimpleSubShapes() : create initial SimpleSubShapes with minCorners to be refined by nestleShapes
  createSimpleSubShapes() {
    DeBug.warn(`${this.id}.createSimpleSubShapes called!!!`)
    this.simpleSubShapes = this.subShapes.map((sub, i) => {
      let newPath = new SegPath(sub, this)
      newPath = newPath
        .refined()
        .path
      return newPath
    })
    // DeBug.log(`${this.id} simpleSubShapes`, this.simpleSubShapes)
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
      // subShapes: this.subShapes.map(sub => sub.map(seg => seg.copy())),
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
  //   // DeBug.log(`created new shape`, this.id)
  //   // this.createSimpleSubShapes()
  //   DeBug.warn(`${this.id}.drawElement`)
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
    // DeBug.warn(`Shape.assignElement() this.svg?`, this.svg)
    this.path = createSVGElt('path')
      .attribute('d', this.svg)
      // .parent(this.svgElt)
      .addToClassList(this.id)
      // .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor, this.size, this.padding)
      .attribute(`shape-rendering`, `geometricPrecision`)
  }

  //METH:
  drawElement() {
    DeBug.group()
    DeBug.error('drawElement: ', this.id, this)
    DeBug.warn(`Shape.drawElement() this.svg`, this.svg)

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


    }
    DeBug.groupEnd()
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
