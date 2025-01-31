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
