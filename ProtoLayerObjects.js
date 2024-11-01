// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: PROTOLAYER CLASS 
//conforms to IdentifiableStored and Debuggable
// SIZE: 322 lines
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
        // console.log(`sides side, key`, side, key)
        const midPoint = segment(side.start, side.end).mid
        const points = OpArray.format([side.start, midPoint, side.end])
        const sideDir = Sides.Directions[key]
        let cells
        if (isCell) { cells = OpArray.format(this) }
        // if(this.type==='Grid') {}
        // console.log(`points`, points)
        // console.log(`sideDir`, sideDir)
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
      console.log(`sidesObj`, sidesObj)
      console.log(`this`, this)
      // return sidesObj
      return new Sides(sidesObj)

      // //ARROW: side()
      // const side = (start, end, sideDir) => {
      //   const startPoint = this.corners[start]
      //   const endPoint = this.corners[end]
      //   const midPoint = segment(startPoint, endPoint).mid
      //   const points = OpArray.format([startPoint, midPoint, endPoint])
      //   return protoSegment({
      //     start: startPoint,
      //     end: endPoint,
      //     parentID: this.id,
      //     islandIDs: isCell ? this.islandIDs : undefined,
      //     id: `${this.id}-${sideDir}Side`,
      //     cells: isCell ? OpArray.format(this) : undefined,
      //     points: isCell ? points : undefined,
      //     sideDir: isCell ? Direction.named(sideDir.trim()) : undefined,
      //     grid: this.grid
      //   })
      // }
      // return {
      //   up: side(`upLeft`, `upRight`, `up`),
      //   right: side(`upRight`, `downRight`, `right`),
      //   down: side(`downRight`, `downLeft`, `down`),
      //   left: side(`downLeft`, `upLeft`, `left`)
      // }
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
        // console.log(`assignElement `, this)
        this.svgElt = createSVGElt().id(this.id)
          .parent(this.svgParent)
          .addToClassList(this.id)
          .addToClassList(this.svgParent.elt.classList.value)
          .layout(this.anchor, this.size, this.padding)
          .viewBox(this.anchor, this.size, this.padding)
        // .label('test', 'red', Direction.Up)
      }

      if (this.drawRect) {
        // console.log(`${this.id} layout rect: insetAnchor: ${this.insetAnchor.string}, insetSize: ${this.insetSize.string}`)
        this.rect = createSVGElt('rect').id(`${this.id}-frontRect`)
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
// MIXIN: ProtoLayer Mixin/Protocol Assignment
Object.assign(ProtoLayer.prototype, IdentifiableStored)
Object.defineProperties(ProtoLayer.prototype, Object.getOwnPropertyDescriptors(Debuggable))

//MARK: FRAME CLASS
// SIZE: 123 lines
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
  //METH: setGrid()
  setGrid(grid) {
    this.grid = grid
    this.createBackGrid(grid)
    this.grid.backGrid = this.backGrid
    this.backGrid.frontGrid = grid
    BGRID = this.backGrid
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
    })
    grid.svgElt.parent(this.svgElt)                                  // re-parent grid to put layer on top of backGrid
  }
  //METH: setBackGridCells()
  setBackGridGroup(mode = 1, wrap = true) {
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

    this.backGroup.isBackGroup = true
    console.error(`this.backGroup`, this.backGroup)

    //NOTE: remove holes
    const oppositeNeighbored = () => {
      return backGrid.availableCells.filter(c => c.hasOppositeNeighborsTaken)
    }
    let opps = oppositeNeighbored()
    while (opps.length > 0) {
      backGrid.assignCells(opps, this.backGroup.id)
      opps = oppositeNeighbored()
    }
    // console.log(`oppositeNeighbored`, opps)

    //NOTE: createPerimeters and createSimpleSubShapes
    this.backGroup.createPerimiters(Direction.All, true)
    backGrid.createSimpleSubShapes()

    //NOTE: curveMinRadiusCorners
    backGrid.curveMinRadiusCorners({ all: true })

    //NOTE: curve remaining loose corners (all non-minRadius corners)
    const looseCorners = backGrid.allSimpleSubShapesSegs
      .filter(s => s.canCurveMoreAtEnd)


    console.warn(`backGrid`, backGrid)
    console.warn(`flushWrap corners`, looseCorners)
    console.warn(`wrappers`, looseCorners.map(s => [s.flushInWrapper, s.adjInWrapper]))
    console.warn(`dists`, looseCorners.map(s => [s.flushIntersectObjs.first?.dist, s.adjIntersectObjs.first?.dist]))
    console.warn(`intObjs`, looseCorners.map(s => [s.id, s.flushIntersectObjs.first, s.adjIntersectObjs.first]))
    if (wrap) {
      looseCorners.forEach(s => {
        if (s.flushInWrapper && s.adjInWrapper) {
          if (s.hasCoincidentCorner(s.flushInWrapper)
            || s.flushIntersectObjs[0].dist < s.adjIntersectObjs[0].dist
          ) {
            console.log(`${s.id} hasBoth, flushWrapping!`, s.flushInWrapper)
            s.flushWrap(true, false)
          } else {
            console.log(`${s.id} hasBoth, adjWrapping!`, s.adjInWrapper)
            s.adjWrap(true, false)
          }
        } else {
          if (s.flushInWrapper) {
            console.log(`${s.id} has flush, flushWrapping!`, s.flushInWrapper)
            s.flushWrap(true, false)
          }
          if (s.adjInWrapper) {
            console.log(`${s.id} has adj, adjWrapping!`, s.adjInWrapper)
            s.adjWrap(true, false)
          }
          if (!s.inWrapper) {
            console.log(`${s.id} has no inWrapper`)
            if (!s.endNeighbor.inWrapper) {
              // console.log(s.endNeighbor.inWrapper)
              // console.log(`neighbor has no inWrapper, midWrapping`)
              s.setArcToMiddle()
              s.endNeighbor.setArcToMiddle()
            } else {
              // console.log(`neighbor has no inWrapper, maxWrapping`)
              s.replaceEndCurveOrigin(s.maxArcOrigin)
            }
          }
        }
      })
    }




    // looseCorners.forEach(bSeg => {
    //   const match = grid.allSimpleSubShapesSegs
    //     .find(gSeg =>
    //       gSeg.end.equals(bSeg.end, 0)
    //       && gSeg.isOverlappingWith({ seg: bSeg })
    //     )
    //   if (match) {
    //     console.warn(`setBackGridGroup match!`, match)
    //     if (bSeg.canCurveTo(match.arcOrigin)) {
    //       bSeg.replaceEndCurveOrigin(match.arcOrigin)
    //     } else {
    //       bSeg.replaceEndCurveOrigin(bSeg.currentMaxArcOrigin)
    //     }

    //   } else {
    //     bSeg.replaceEndCurveOrigin(bSeg.currentMaxArcOrigin)
    //   }
    // })

    //NOTE: process stairs
    const shapes = this.backGroup.perimeterIslands
      .map(i => i.shape).flat()

    const segPaths = shapes
      .map(s => s.simpleSegPaths).flat()
    // .map(p => p.stairs).flat()
    console.log(`backGroup segPaths`, segPaths)
    console.log(`backGroup segPaths parts`, segPaths[0].path.map(s => s.part))

    // const diagPaths = segPaths.map(p => p.withDiagonals())
    // console.log(`segPaths`, segPaths[0].path.map(s => [s.id, s.start.string, s.end.string]))
    // console.log(`segPaths`, segPaths[0].diagonalsPath.map(s => [s.id, s.start.string, s.end.string]))
    // console.log(`diagPaths`, diagPaths[0])
    // console.log(`diagPaths cubicVerts`, diagPaths[0].map(s => [s.start.string, s.cubicVerts.start?.string, s.cubicVerts.end?.string, s.end.string]))

    // shapes.forEach((s, i) => s.simpleSubShapes = diagPaths)


    // backGrid.maximizeCuddles()
    //NOTE: calculate padWidth
    const padWidth = (1 + (grid.insetAmount.x / grid.cellRadius || grid.cellRadius)) / 2

    //NOTE: cut flat backing island (no cut, just fill actually)
    this.backGroup.cutIslands({
      // profile: Profile.jIn,
      isFrame: true,
      layerStart: 2 * padWidth,
      // layerEnd: 1.5 * padWidth,
      amount: 1,
      loftScale: 1 / 1,
      backing: false,
    })
    //NOTE: make real cuts
    // this.backGroup.cutIslands({
    //   profile: Profile.jOut,
    //   isFrame: true,
    //   layerStart: 1.5 * padWidth,
    //   layerEnd: 1.25 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.rOut,
    //   isFrame: true,
    //   layerStart: 2 * padWidth,
    //   layerEnd: 1.75 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.iOut,
    //   isFrame: true,
    //   layerStart: .5 * padWidth,
    //   layerEnd: 0 * padWidth,
    //   // outsetLoft: false,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.jIn,
    //   isFrame: true,
    //   layerStart: 1.75 * padWidth,
    //   layerEnd: 1.5 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.rIn,
    //   isFrame: true,
    //   layerStart: 1. * padWidth,
    //   layerEnd: .75 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.jOut,
    //   isFrame: true,
    //   layerStart: 38 / 32 * padWidth,
    //   layerEnd: 36 / 32 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.jIn,
    //   isFrame: true,
    //   layerStart: 1. * padWidth,
    //   layerEnd: .5 * padWidth,
    //   amount: 3,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.iOut,
    //   isFrame: true,
    //   layerStart: .5 * padWidth,
    //   layerEnd: 0.25 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })
    // this.backGroup.cutIslands({
    //   profile: Profile.jIn,
    //   isFrame: true,
    //   layerStart: 1.5 * padWidth,
    //   layerEnd: 1 * padWidth,
    //   amount: 1,
    //   loftScale: 1 / 1,
    // })

    console.log(`backGroup`, this.backGroup)

    this.backGroup.shapesGroups.forEach(sg => {
      console.log(`svgGroupElt`, sg.svgGroupElt)
      sg.drawFilter = false

      sg.svgGroupElt
        .attribute(`fill`, frameColor)
        // .attribute('fill', protoColor(130))
        // .attribute('fill', `green`)
        .attribute('opacity', 1)
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

    console.log(`shapeGroups`, this.backGroup.shapesGroups[0].svgElt)

    const gridClone = this.backGroup.shapesGroups[0].svgGroupElt.elt.cloneNode(true)

    const paths = gridClone.querySelectorAll('path')
    console.log(paths)
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
      // .viewBox(-35, -10, 170, 220)
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
    // .layout(-35, -10, 170, 220)

    super.assignElement()

    this.svgElt
      .parent(this.bleed)

    this.frameRect = createSVGElt('rect').id(`${this.id}-backRect`)
      .parent(this.bleed)
      .addToClassList(this.id)
      .layout(this.anchor, this.size)
  }

  //METH: drawElement()
  drawElement() {
    this.bleed
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)

    this.bleedRect
      .attribute('fill', frameColor)
      .attribute('fill', 'black')
    // .attribute(`fill`, `red`)

    super.drawElement()

    this.frameRect
      .attribute(`pointer-events`, `none`)
      // .parent(this.bleed)
      .layout(this.anchor, this.size)
      .attribute('rx', `${this.cornerRadius}`)
      .attribute('ry', `${this.cornerRadius}`)
      // .attribute('fill', ProtoColor.randomHighHue().setSaturation(10))
      .attribute(`fill`, frameColor)
      // .attribute(`fill`, 'black')
      .attribute('fill-opacity', '0')
    // .attribute('stroke', 'red')
    // .attribute('stroke-width', `.0625`)
    // .applyFilter({ filter: this.filter, size: this.size, padding: vert(20) })

    // this.testElementsDraw()
    this.svgElt
      .touchEnded(shadeAnimation)
      .mouseReleased(shadeAnimation)
  }
  // #endregion
}

//MARK: SelectionBounds CLASS
// SIZE: 216 lines
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

  get minHorCellThickness() { return this.#checkCellThickness(true, true) }
  get minVertCellThickness() { return this.#checkCellThickness(true, false) }
  get maxHorCellThickness() { return this.#checkCellThickness(false, true) }
  get maxVertCellThickness() { return this.#checkCellThickness(false, false) }

  #checkCellThickness(minimum, hor) {
    const minName = minimum ? `min` : `max`
    const horName = hor ? `Hor` : `Vert`
    console.error(`${minName}${horName}CellThickness`)
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
          console.log(`new count`, count)
        } else {
          console.log(`end count`, count)
          if (count > 0) {
            minMax = getMinMax(count)
            console.warn(`new minMax`, minMax)
          }
          count = 0
        }
      })
      if (!minimum || count > 0) {
        minMax = getMinMax(count)
        console.warn(`new minMax`, minMax)
      }
    })
    console.error(`final minMax`, minMax)
    console.log(``)
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
  // innerCellIslands({ isTaken = true, stored = false, direction = Direction.Horizontal } = {}) {
  //   console.log('innerCellIslands called')
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
// SIZE: 2454 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class Grid extends ProtoLayer {
  gridSize
  startCoord
  offset
  cellRows
  // cellRowsPref                                                                                      //UNUSED: 
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

  constructor({ protoParent, gridSize, insetScale = 1, transform, startCoord = vert(), gridType = 0, isInterGrid = false } = {}) {
    super({
      protoParent: protoParent,
      insetScale: insetScale,
      // drawSVG: false,
      // drawRect: true,
      // drawFilter: true,
    })
    this.gridSize = gridSize
    this.startCoord = startCoord
    this.offset = isInterGrid ? 0.5 : 0
    // this._type = 'Grid'
    switch (gridType) {
      case 0:
        this._type = `Grid`
        break
      case 1:
        this._type = `InfraGrid`
        break
      case 2:
        this._type = `UltraGrid`
        break
      case 3:
        this._type = `BackGrid`
        break
    }

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

    this.finishSetup(S.Grids)
    this.cellRows = this.#createRowsArray()
    // this.cellRowsPref = this.transformedCellRows(transform)                                         //UNUSED:
    // this.setFrameRadii()
  }

  // MARK: Grid Override Properties
  get testLook() { return Look.test(this.size, 'grid') }
  get testColor() { return protoColor(0, 230, 0, 90) }
  get cornerRadius() { return this.cellRadius }
  // get padding() { return vert(50) }

  get gridAspect() { return this.gridSize.y / this.gridSize.x }
  // get anchor() { return vert(0, (1 - this.gridAspect / 2) * 100) }
  // get size() { return vert(100, this.gridAspect * 100) }
  // get boundsRect() {
  //   return DOMRect.fromRect(
  //     {
  //       x: this.anchor.x,
  //       y: this.anchor.y,
  //       width: this.size.x,
  //       height: this.size.y,
  //     })
  // }

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
    // console.log(this.shapes)
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
    // console.log(`validNeighbors selection`, selection)
    // console.error(`validNeighbors selection`, selection.map(c => c.id))
    let cells = OpArray.from(new Set(selection.flatMap(c => c.validNeighborsCoords(direction, bounds))))
    // let cells = selection.flatMap(e => e.validNeighborsCoords(direction, bounds)).unique(`id`)
    // console.log(`validNeighbors selection`, selection.map(c => c.id))
    // console.log(`validNeighbors cells`, cells.map(c => c.id))
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
    console.groupCollapsed(`grid.createIslands`)
    console.log(`Arguments:`, arguments[0])
    console.log(`stored?`, stored)
    console.log(`allIslands`, this.allIslands.map(i => i.id))
    console.log(`island?`, this.islandNamed(islandID))
    let cells, group, island
    if (!groupID && !islandID && !selection) {  // "taken/available" mode - currently unused, probably DEPRECATE!
      if (isTaken) { cells = this.takenCells }
      else { cells = this.availableCells }
      // if (filter) { this.setFilter(filter) }
    }
    // if (!selection) {
    //TODO: could/should I migrate from ID to direct reference?
    if (groupID) {                            // "group" mode finds & creates islands within a group
      group = this.groupNamed(groupID)
      cells = group?.cells || new OpArray
      // group?.setFilter(filter)
      if (group) { protoParent = group }
    }
    //TODO: could/should I migrate from ID to direct reference?
    if (islandID) {                           // "island" mode finds & creates islands within an island
      island = this.islandNamed(islandID)
      cells = island?.cells || new OpArray
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
          // if (isTaken) {
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
        maxCorners: maxCorners,
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
        if (createShape) { isle.createShape(insetScale) }
        console.warn(isle.shape.svg)
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
    // console.group(`GRID.createSimpleSubShapes called!!!`)
    this.groups.forEach(g => g.createSimpleSubShapes())
    // console.groupEnd()
  }
  // #region end


  //TODO: DELETE WRAP METHODS AFTER CONVERSION 1276-1715
  //MARK: Wrap Methods
  // #region Wrap Methods
  //METH: findcoincidentWrapper() : ProtoSegment :                                                          //UNUSED:
  //find collinear wrapper(s) of input segment in segCollection
  // findcoincidentWrapper({
  //   seg,
  //   outWrap = true,           // 
  //   outsideCorner = true,     // 
  //   isNeighbor = false,       // 
  //   invertLineCheck = false,  // 
  //   skipVertOnLine = false,   // 
  //   includeEnds = true,       // 
  // } = {}) {
  //   //FIXME: incorporate seg.andNeighborSimples into search reduction for massive performance gain!
  //   // const localSegs = seg.andNeighborSimples
  //   // if (localSegs) { segCollection = localSegs }
  //   const segDir = seg.direction
  //   const wrapDir = outWrap ? segDir.opposites : segDir              // expected direction of wrapper 
  //   const turn = isNeighbor === outWrap ? 'end' : 'start'            // which turn to check turn direction of
  //   const oppTurn = isNeighbor === outWrap ? 'start' : 'end'         // opposite of turn
  //   const turnDir = outWrap !== outsideCorner ? `isRight` : `isLeft` // expected turn direction
  //   const vertOnLineCheck = (s) => {                                 // verify cubicVert is on segment
  //     if (skipVertOnLine) {
  //       return !seg[oppTurn].equals(s[oppTurn], 0)         // seg.end not equal to s.end (hand drawn case)
  //     }
  //     let checkSeg = outWrap && !invertLineCheck ? s : seg                // segment to check
  //     // if (invertLineCheck) {
  //     //   checkSeg = segment(checkSeg[oppTurn], checkSeg.cubicVerts[turn])    // only use curvable part of segment 
  //     // }
  //     const cubicSeg = outWrap && !invertLineCheck ? seg : s                // segment to take cubicVert from
  //     const vert = !isNeighbor ? cubicSeg.finalCubicEndVert : cubicSeg.finalCubicStartVert  // cubicVert to check

  //     return checkSeg.vertIsOnLine(vert, false)                           // vertIsOnLine, but not at start or end points
  //   }
  //   const cornerCheck = (opposite = true) => { return isNeighbor === opposite ? 'end' : 'start' }
  //   // console.log(` ** findCollinear seg`, info(seg))
  //   // console.log(`cubicVert`, cubicVert)
  //   // console.log(`segCollection`, segCollection)
  //   // let wrapper = segCollection.flat()
  //   // console.log(`findcoincidentWrapper overlapSegs`, seg.overlapSegs)
  //   let wrapper = seg.overlapSegs
  //     .filter(s =>
  //       // s.isOverlappingWith(seg, includeEnds)        // collinear wraps overlap seg
  //       // &&
  //       s.direction.equals(wrapDir)  // collinear subIsland wraps point in same direction as seg
  //       && s.turns[turn][turnDir]       // collinear wraps turn left
  //       && vertOnLineCheck(s)           // collinear wraps will contain the transferrable cubicVert
  //       // && !seg[oppTurn].equals(s[oppTurn], 0)
  //       // && s.corners.end.equals(seg.corners.end)
  //       // && seg[cornerCheck(false)].equals(s[cornerCheck()], 1)  
  //     )
  //     .sort((a, b) => seg[oppTurn].dist(a[turn]) - seg[oppTurn].dist(b[turn]))
  //   return wrapper
  // }
  //METH: findcoincidentWrappers()                                                                        //UNUSED:
  // findcoincidentWrappers({
  //   seg,
  //   outWrap = true,
  //   outsideCorner = true,
  //   invertLineCheck = false,
  //   skipVertOnLine = false,
  //   includeEnds = true,
  // } = {}) {
  //   // const localSegs = seg.andNeighborSimples
  //   // if (localSegs) { segCollection = localSegs }
  //   const neighbor = seg.endNeighbor // runs clockwise, seg then rightTurn end neighbor
  //   const start = this.findcoincidentWrapper({  // find start of corner wrapper
  //     seg: seg,
  //     outWrap: outWrap,
  //     outsideCorner: outsideCorner,
  //     invertLineCheck: invertLineCheck,
  //     skipVertOnLine: skipVertOnLine,
  //     includeEnds: includeEnds,
  //   })
  //   const end = this.findcoincidentWrapper({    // find end of corner wrapper
  //     seg: neighbor,
  //     outWrap: outWrap,
  //     outsideCorner: outsideCorner,
  //     invertLineCheck: invertLineCheck,
  //     skipVertOnLine: skipVertOnLine,
  //     includeEnds: includeEnds,
  //     isNeighbor: true
  //   })
  //   return { start: start, end: end }
  // }
  //METH: wrapCollinearCorner() :                                                                         //UNUSED:
  //finds collinear wrapped corners and transfers cubic verts inwards to wrapped
  // NOTE: in Grid.nestleShapes(): use outWrapOutsideCorner (outWrap = true, outsideCorner = true)
  // NOTE: in Island.copyAllToCardinal(): inWrapInsideCorner & inWrapOutsideCorner (outWrap = true, outsideCorner = both)
  // wrapCollinearCorner(seg, segCollection, outWrap = true, outsideCorner = true, radiant = true, replace = false) {
  //   let report = false
  //   // if (
  //   //   seg.id.includes('cell026')
  //   //   // || seg.id.includes('cell040')
  //   //   // || seg.id.includes('cell046')
  //   // ) {
  //   //   console.error(``)
  //   //   console.warn(`FOUND cell026!`)
  //   //   console.error(``)
  //   //   report = true
  //   // }
  //   if (report) {
  //     console.log(`wrapCollinearCorner seg`, seg)
  //     console.log(`wrapCollinearCorner segCollection`, segCollection)
  //   }
  //   // let outsideCorners = new OpArray
  //   // let insideCorners = new OpArray
  //   const isDir = outsideCorner ? `isRight` : `isLeft`
  //   if (!seg.turns.end[isDir]) { // must be an outside corner, so end of seg turns Right
  //     console.error(`INVALID: wrapCollinearCorner only works on segment corners ending in ${isDir} turns `)
  //     return
  //   }
  //   if (!segCollection) {                         // assign appropriate segCollection
  //     segCollection = outsideCorner ? this.allSimpleOutsideCorners : this.allSimpleInsideCorners
  //   }
  //   const wrappers = this.findcoincidentWrappers({  // find start of corner wrapper
  //     seg: seg,
  //     outWrap: outWrap,
  //     outsideCorner: outsideCorner
  //   })

  //   // if (report) {
  //   //   console.log(`--> wrapperStart`, wrapperStart)
  //   //   console.log(`--> wrapperEnd`, wrapperEnd)
  //   //   console.log(``)
  //   // }

  //   //ARROW: transferCubicStart() : 
  //   const transferCubicStart = () => {
  //     if (outWrap) {
  //       wrappers.start[0].addCubicStartVert(seg.finalCubicEndVert, replace, radiant)
  //     } else { // inWrap
  //       seg.addCubicEndVert(wrappers.start[0].finalCubicEndVert, replace, radiant)
  //     }
  //   }
  //   //ARROW: transferCubicEnd() : 
  //   const transferCubicEnd = () => {
  //     const neighbor = seg.endNeighbor
  //     if (outWrap) {
  //       wrappers.end[0].addCubicEndVert(neighbor.finalCubicStartVert, replace, radiant)
  //     } else { // inWrap
  //       neighbor.addCubicStartVert(wrappers.end[0].finalCubicStartVert, replace, radiant)
  //     }
  //   }

  //   let wrapped = { start: undefined, end: undefined }
  //   if (wrappers.start.length === 1 && wrappers.end.length === 1) {       // fully wrapped corner
  //     transferCubicStart()
  //     transferCubicEnd()
  //     wrapped.start = wrappers.start[0]
  //     wrapped.end = wrappers.end[0]
  //     // return wrappers.start[0]                     // return fully wrapped corner for adjacent wrapping
  //   } else if (wrappers.start.length === 1) {                           // only start is wrapped
  //     transferCubicStart()
  //     wrapped.start = wrappers.start[0]
  //   } else if (wrappers.end.length === 1) {                             // only end is wrapped
  //     transferCubicEnd()
  //     wrapped.end = wrappers.end[0]
  //   }
  //   return wrapped
  // }
  //METH: wrapCorners() :                                                                                 //UNUSED:
  // wrapCorners({ segs, segCollection, outWrap = true, outsideCorners = true, radiant = true, replace = false } = {}) {
  //   // console.log(`wrapCorners segs`, segs)
  //   return segs.flat().map(seg => this.wrapCollinearCorner(seg, segCollection, outWrap, outsideCorners, radiant, replace))
  // }
  //METH: outWrapOutsideCorners() :                                                                       //UNUSED:
  // outWrapOutsideCorners(segs, segCollection, radiant = true, replace = false) {
  //   return this.wrapCorners({ segs: segs, segCollection: segCollection, radiant: radiant, replace: replace })
  // }
  //METH: inWrapOutsideCorners() :                                                                        //UNUSED:
  // inWrapOutsideCorners(segs, segCollection, radiant = true) {
  //   return this.wrapCorners({ segs: segs, segCollection: segCollection, outWrap: false, radiant: radiant })
  // }
  //METH: inWrapInsideCorners() :                                                                         //UNUSED:
  // inWrapInsideCorners(segs, segCollection, radiant = true, replace = true) {
  //   return this.wrapCorners({
  //     segs: segs, segCollection: segCollection, outWrap: false, outsideCorners: false, radiant: radiant, replace: replace
  //   })
  // }

  //METH: outWrapAdjacentInsideCorner() : ProtoSegment :                                                  //UNUSED:
  // outWrapAdjacentInsideCorner(seg, radiant = true, replace = false) {
  //   let report = false
  //   // if (
  //   //   seg.id.includes('cell121')
  //   //   || seg.id.includes('cell112')
  //   //   // || seg.id.includes('cell046')
  //   // ) { report = true }
  //   if (report) {
  //     console.warn(`outWrapAdjacentInsideCorner seg`, seg.id)
  //   }

  //   // if (!seg.turns.end.isLeft) { // must be an inside corner, so end of seg turns Left
  //   //   console.error(`outWrapAdjacentInsideCorner only works on segment corners ending in left turns `)
  //   //   console.log(seg)
  //   //   return
  //   // }
  //   const neighbor = seg.startNeighbor // use start neighbor to run clockwise like findCollinearWrappedCorner()

  //ARROW: adjWrapper() : ProtoSegment :                                                            
  //find adjacent wrapper(s) of input segment
  //   const adjWrapper = (seg, isNeighbor = false) => {
  //     const segDir = seg.direction
  //     const adjDir = segDir.opposites // adjacent wraps point opposite of segDir
  //     const turn = !isNeighbor ? 'end' : 'start'
  //     const cubicVert = isNeighbor ? seg.finalCubicEndVert : seg.finalCubicStartVert
  //     const normCoord = segDir.rotated(90).moveCoord // normals always point left 90deg from segment direction
  //     const normal = segment(
  //       cubicVert,
  //       Vertex.add(cubicVert, Vertex.mult(normCoord, seg.shape.cellBounds.size || this.gridCellBounds.size))
  //     )
  //     const name = isNeighbor ? `end` : `start`
  //     // console.warn(`!!!adjWrapper!!! segDir: ${segDir}, normCoord: ${normCoord}, normal:`, normal)
  //     // console.log(` ** findAdjacent seg`, info(seg))
  //     // console.log(`normal`, normal.string)

  //     let closestAdjacentWrapper = seg.shape.simpleSubShapes.flat()
  //       .filter(s =>
  //         s.direction.equals(adjDir)  // adjacent wraps point in opposite direction as seg
  //         && s.turns[turn].isRight    // adjacent wraps turn right
  //         // && seg.arcShouldWrapOutToArc(s)
  //       )
  //       .map(s => s.intersectionWith(normal) ? [s, s.intersectionWith(normal)] : null) // adjWraps intersect normal
  //       .compacted
  //       .filter(s => !s[0].start.equals(s[1], 1) && !s[0].end.equals(s[1], 1)) // adjWraps cant have ends on normal
  //       .sort((a, b) => segment(seg[name], a[1]).length - segment(seg[name], b[1]).length) // sorted shortest first
  //     // console.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
  //     // closestAdjacentWrapper = closestAdjacentWrapper
  //     if (replace) {
  //       // closestAdjacentWrapper = closestAdjacentWrapper.filter(s => s.hasLooseCorner)  // safe replacement edge case
  //     }
  //     // console.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
  //     closestAdjacentWrapper = closestAdjacentWrapper[0] // take shortest/closest

  //     return closestAdjacentWrapper
  //   }

  //   // const wrapperStart = adjWrapper(seg)
  //   // const wrapperEnd = adjWrapper(neighbor, true)

  //   //----------------------------------------------------
  //   console.error(`outWrapAdjacentInsideCorner seg`, seg)
  //   const adjWrap = seg.adjacentWrapper
  //   let wrapped = { start: undefined, end: undefined }
  //   console.log(`adjWrap`, adjWrap)

  //   if (adjWrap) {
  //     const wrapperStart = seg.adjacentWrapper
  //     const wrapperEnd = seg.adjacentWrapper.endNeighbor

  //     adjWrap.addDistancedEndCornerVerts(adjWrap.intendedArcRadius, replace, radiant)

  //     wrapped.start = wrapperStart
  //     wrapped.end = wrapperEnd
  //   }

  //   return wrapped
  //   //-------------------------------------------------------





  //   // if (report) {
  //   console.log(`--> wrapperStart`, wrapperStart)
  //   console.log(`--> wrapperEnd`, wrapperEnd)
  //   console.log(``)
  //   // }

  //   // let wrapped = { start: undefined, end: undefined }
  //   if (wrapperStart && wrapperEnd) {
  //     if (wrapperStart[0].endNeighbor.id !== wrapperEnd[0].id) {
  //       console.error(`INVALID: Wrapper segs ${wrapperStart[0].id} and ${wrapperEnd[0].id} are not a connected corner`)
  //       return
  //     }
  //     if (wrapperStart[0].isCollinearWith(seg) || wrapperEnd[0].isCollinearWith(neighbor)) {
  //       console.warn(`INVALID: Wrapper corner is collinear with segment corner`)
  //       return
  //     }

  //     if (report) {
  //       console.log(`!!! ADJACENT WRAPPED CORNER FOUND !!!`)
  //       console.log(seg)
  //       console.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
  //       console.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
  //     }

  //     const startGap = segment(seg.finalCubicStartVert, wrapperStart[1])  // gap between corner segs
  //     const endGap = segment(neighbor.finalCubicEndVert, wrapperEnd[1])   // gap between corner segs
  //     // console.log(`startGap`, startGap.length, startGap.string)
  //     // console.log(`endGap`, endGap.length, endGap.string)
  //     // console.log(``)
  //     const startGapLength = roundToDec(startGap.length)               // gap distance
  //     const endGapLength = roundToDec(endGap.length)                   // gap distance
  //     if (startGapLength === endGapLength) {                              // wrap both if equidistant
  //       // console.log(`wrapperStart`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperStart[0].cubicVerts,
  //       //   max: wrapperStart[0].maxCubicVerts,
  //       //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
  //       // })))
  //       // console.log(`wrapperEnd`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperEnd[0].cubicVerts,
  //       //   max: wrapperEnd[0].maxCubicVerts,
  //       //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
  //       // })))
  //       console.warn(`Wrapping both segments`)

  //       if (radiant) {
  //         wrapperStart[0].addCubicEndVert(wrapperStart[1], replace)
  //         wrapperEnd[0].addCubicStartVert(wrapperEnd[1], replace)
  //       } else {
  //         wrapperStart[0].addMaxStartVert(wrapperStart[1], replace)
  //         wrapperEnd[0].addMaxEndVert(wrapperEnd[1], replace)
  //       }
  //       // console.log(`wrapperStart`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperStart[0].cubicVerts,
  //       //   max: wrapperStart[0].maxCubicVerts,
  //       //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
  //       // })))
  //       // console.log(`wrapperEnd`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperEnd[0].cubicVerts,
  //       //   max: wrapperEnd[0].maxCubicVerts,
  //       //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
  //       // })))

  //       // console.log(``)
  //       wrapped.start = wrapperStart[0]
  //       wrapped.end = wrapperEnd[0]
  //       // return wrapperStart[0]                                            // only return corner when both wrapped 
  //     }

  //     else if (startGapLength < endGapLength) {                           // wrap seg with shortest distance
  //       console.log(`Wrapping end of start segment ${wrapperStart[0].id} with ${wrapperStart[1].string}`)
  //       console.log(`prev availableEndLength: ${wrapperStart[0].availableEndLength}`)
  //       if (radiant) {
  //         wrapperStart[0].addCubicEndVert(wrapperStart[1], replace)
  //       } else {
  //         wrapperStart[0].addMaxEndVert(wrapperStart[1], replace)
  //       }
  //       if (replace) {
  //         wrapperStart[0].endNeighbor.removeCubicStartVert()        // remove neighbor vert to prevent bad match
  //         wrapperStart[0].matchEndCorner()                          // match new vert on neighbor
  //       }
  //       wrapped.start = wrapperStart[0]
  //       console.log(`new availableEndLength: ${wrapperStart[0].availableEndLength}`)
  //     } else {
  //       console.log(`Wrapping start of end segment ${wrapperEnd[0].id} with ${wrapperEnd[1].string}`)
  //       console.log(`prev availableEndLength: ${wrapperStart[1].availableStartLength}`)
  //       if (radiant) {
  //         wrapperEnd[0].addCubicStartVert(wrapperEnd[1], replace)
  //       } else {
  //         wrapperEnd[0].addMaxStartVert(wrapperEnd[1], replace)
  //       }
  //       if (replace) {
  //         wrapperStart[0].startNeighbor.removeCubicEndVert()        // remove neighbor vert to prevent bad match
  //         wrapperStart[0].matchStartCorner()                        // match new vert on neighbor
  //       }
  //       wrapped.end = wrapperEnd[0]
  //       console.log(`new availableEndLength: ${wrapperStart[1].availableStartLength}`)
  //     }
  //     // console.log(``)
  //   }
  //   return wrapped
  // }

  //METH: outWrapAdjacentInsideCorners()                                                                   //UNUSED:
  // outWrapAdjacentInsideCorners({ segs, radiant = true, replace = false } = {}) {
  //   return segs.flat().map(seg => this.outWrapAdjacentInsideCorner(seg, radiant, replace))
  // }

  //METH: recursiveOutWrapOutsideCorners() :                                                               //UNUSED:
  //recursive collinear/adjacent combo wrap functions for outside corners
  // recursiveOutWrapOutsideCorners(segCollection, radiant = true, replace = false) {
  //   segCollection = OpArray.format(segCollection)
  //   // console.log(`recursiveOutWrapOutsideCorners input`, segCollection.map(s => s.id))
  //   let outsideCorners = new OpArray
  //   let insideCorners = new OpArray
  //   const collinears = this.outWrapOutsideCorners(segCollection, this.allSimpleSubShapes, radiant, replace)
  //     .compacted
  //   if (!collinears.isEmpty) {
  //     // console.log(`recursiveOutWrapOutsideCorners collinears`, collinears)
  //     let colOut = new OpArray
  //     collinears.forEach(col => {
  //       if (col.start) { insideCorners.push(col.start) }
  //       if (col.end) { insideCorners.push(col.end) }
  //       if (col.start && col.end) { colOut.push(col.start) }
  //     })
  //     const adjacents = this.outWrapAdjacentInsideCorners({ segs: colOut, radiant: radiant, replace: replace })
  //       .compacted
  //     if (!adjacents.isEmpty) {
  //       // console.log(`recursiveOutWrapOutsideCorners adjacents`, adjacents)
  //       let adjOut = new OpArray
  //       adjacents.forEach(adj => {
  //         if (adj.start) { outsideCorners.push(adj.start) }
  //         if (adj.end) { outsideCorners.push(adj.end) }
  //         if (adj.start && adj.end) { adjOut.push(adj.start) }
  //       })
  //       const combined = this.recursiveOutWrapOutsideCorners(adjOut, radiant, replace)
  //       if (!combined.isEmpty) {
  //         outsideCorners = outsideCorners.union(combined.outsideCorners)
  //         insideCorners = insideCorners.union(combined.insideCorners)
  //       }
  //     }
  //   }
  //   return { outside: outsideCorners, inside: insideCorners }
  // }

  //METH: recursiveOutWrapAdjInsideCorners() :                                                             //UNUSED:
  //recursive combination of adjacent/collinear wrap functions for inside corners
  // recursiveOutWrapAdjInsideCorners(segCollection, radiant = true, replace = false) {
  //   segCollection = OpArray.format(segCollection)
  //   let outsideCorners = new OpArray
  //   let insideCorners = new OpArray
  //   // console.log(`recursiveOutWrapAdjInsideCorners input`, segCollection)
  //   const adjacents = this.outWrapAdjacentInsideCorners({ segs: segCollection, radiant: radiant, replace: replace })
  //     .compacted
  //   if (!adjacents.isEmpty) {
  //     // console.log(`recursiveOutWrapAdjInsideCorners adjacents`, adjacents)
  //     let adjOut = new OpArray
  //     adjacents.forEach(adj => {
  //       if (adj.start) { outsideCorners.push(adj.start) }
  //       if (adj.end) { outsideCorners.push(adj.end) }
  //       if (adj.start && adj.end) { adjOut.push(adj.start) }
  //     })
  //     const collinears = this.outWrapOutsideCorners(adjOut, this.allSimpleSubShapes, radiant, replace)
  //       .compacted
  //     if (!collinears.isEmpty) {
  //       // console.log(`recursiveOutWrapAdjInsideCorners collinears`, collinears)
  //       let colOut = new OpArray
  //       collinears.forEach(col => {
  //         if (col.start) { insideCorners.push(col.start) }
  //         if (col.end) { insideCorners.push(col.end) }
  //         if (col.start && col.end) { colOut.push(col.start) }
  //       })
  //       const combined = this.recursiveOutWrapAdjInsideCorners(colOut, radiant, replace)
  //       if (!combined.isEmpty) {
  //         outsideCorners = outsideCorners.union(combined.outsideCorners)
  //         insideCorners = insideCorners.union(combined.insideCorners)
  //       }
  //     }
  //   }
  //   return { outside: outsideCorners, inside: insideCorners }
  // }
  // #endregion

  //MARK: Nestle Methods
  // #region Nestle Methods
  //MARK: createUTurns()
  //METH: createUTurns()                                                                  //UNUSED:
  // createUTurns({ subShapes = this.allSimpleSubShapes, out = true, outWrap = true, radiant = true } = {}) {
  //   // let curved = new OpArray                               // processed corner/seg storage
  //   let uTurns = subShapes.flat()
  //     .filter(s => out ? s.isUTurnOut : s.isUTurnIn)       // only include UTurnOut segments
  //     // .filter(s => s.length < s.startNeighbor.length && s.length < s.endNeighbor.length)
  //     // .filter(s => !s.hasSomeCubicVerts)                   // remove segments with any cubicVerts assigned
  //     .filter(s => !s.hasBothVerts)                   // remove segments with both cubicVerts assigned
  //     .sort((a, b) => b.minCubicLength - a.minCubicLength) // sort by large-small availableEndLength
  //   const name = out ? `out` : `in`
  //   console.warn(`uTurns ${name}`, uTurns.map(u => [u.id, u.availableEndLength]))
  //   // console.warn(`uTurns ${name}`, uTurns.map(u => u.availableEndLength))
  //   let outsideCorners = new OpArray
  //   let insideCorners = new OpArray
  //   while (uTurns.length > 0) {
  //     let seg = uTurns.last
  //     // seg = uTurns.pop()                          // pop gets segs with smallest minCubicLength first

  //     if (seg.hasNoCubicVerts) {
  //       const startRadius = min(seg.startNeighbor.availableEndLength, seg.availableStartLength)
  //       const endRadius = min(seg.availableEndLength, seg.endNeighbor.availableStartLength)

  //       // let curved = new OpArray

  //       if (approxToDec(startRadius) === approxToDec(endRadius)) { // curve both corner segs
  //         console.log(`curving ${seg.id} both sides with radius: ${roundToDec(startRadius / this.minCellWidth)}`)
  //         seg.addBothDistancedCornerVerts(startRadius)
  //         // curved.push(out ? seg.startNeighbor : seg)
  //         // curved.push(out ? seg : seg.endNeighbor)
  //         if (out) {
  //           outsideCorners.push(seg.startNeighbor)
  //           outsideCorners.push(seg)
  //         } else {
  //           insideCorners.push(seg)
  //           insideCorners.push(seg.endNeighbor)
  //         }

  //       } else if (approxToDec(startRadius) < approxToDec(endRadius)) { // curve smallest corner seg: start
  //         seg.addDistancedStartCornerVerts(startRadius)
  //         // curved.push(out ? seg.startNeighbor : seg)
  //         if (out) {
  //           outsideCorners.push(seg.startNeighbor)
  //         } else {
  //           insideCorners.push(seg)
  //         }

  //       } else {                                                      // curve smallest corner seg: end 
  //         seg.addDistancedEndCornerVerts(endRadius)
  //         // curved.push(out ? seg : seg.endNeighbor)
  //         if (out) {
  //           outsideCorners.push(seg)
  //         } else {
  //           insideCorners.push(seg.endNeighbor)
  //         }
  //       }

  //       console.log(`resulting seg.hasBothVerts`, seg.hasBothVerts)

  //       if (outWrap) {
  //         // console.log(`recursive processing of curved:`, curved.map(s => s.id))

  //         console.log(`recursive outWrap of outsideCorners:`, outsideCorners.map(s => s.id))
  //         console.log(`recursive outWrap of insideCorners:`, insideCorners.map(s => s.id))
  //         const wrapOuts = this.recursiveOutWrapOutsideCorners(outsideCorners, radiant)
  //         const wrapIns = this.recursiveOutWrapAdjInsideCorners(insideCorners, radiant)
  //         console.log(`createUTurns wrapOuts`, wrapOuts)
  //         console.log(`createUTurns wrapIns`, wrapIns)

  //         // if (out) {
  //         //   this.recursiveOutWrapOutsideCorners(curved, radiant)
  //         // } else {
  //         //   this.recursiveOutWrapAdjInsideCorners(curved, radiant)
  //         // }
  //       }
  //       uTurns = uTurns.sort((a, b) => b.minCubicLength - a.minCubicLength) // sort by large-small availableEndLength

  //     } else {
  //       seg = uTurns.pop()
  //       const cubicCorners = this.createCubicCorners({ subShapes: [seg], radiant: radiant })
  //       outsideCorners = outsideCorners.union(cubicCorners.outside, [`id`])
  //       insideCorners = insideCorners.union(cubicCorners.inside, [`id`])
  //     }
  //   }
  //   console.warn(`createUTurns outsideCorners`, outsideCorners)
  //   console.warn(`createUTurns insideCorners`, insideCorners)
  //   return { outside: outsideCorners, inside: insideCorners }
  // }
  //MARK: createCubicCorners()
  //METH: createCubicCorners() :                                                                      //UNUSED:
  // createCubicCorners({ subShapes = this.allSimpleSubShapes, outWrap = true, radiant = true, replace = false } = {}) {
  //   let corners = subShapes.flat()
  //     .filter(s => !s.hasBothCubicVerts)                      // remove segments with both cubicVerts assigned
  //     .sort((a, b) => b.minCubicLength - a.minCubicLength)    // sort large-small availableEndLength
  //     .sort((a, b) => b.cubicVertCount - a.cubicVertCount)    // sort large-small cubicVertCount

  //   let outsideCorners = new OpArray
  //   let insideCorners = new OpArray
  //   while (corners.length > 0) {
  //     let seg = corners.pop()

  //     let useStartCorner, cornerStart, cornerEnd
  //     if (seg.hasNoCubicVerts) {
  //       console.log(`createCubicCorners seg hasNoCubicVerts`)
  //       useStartCorner = seg.startNeighbor.availableEndLength <= seg.endNeighbor.availableStartLength ? true : false
  //     } else if (seg.hasSomeCubicVerts) {
  //       console.log(`createCubicCorners seg hasSomeCubicVerts`)
  //       useStartCorner = seg.hasCubicStartVert ? false : true
  //     }
  //     if (useStartCorner) {
  //       cornerStart = seg.startNeighbor
  //       cornerEnd = seg
  //     } else {
  //       cornerStart = seg
  //       cornerEnd = seg.endNeighbor
  //     }

  //     const radius = min(cornerStart.availableEndLength, cornerEnd.availableStartLength)
  //     cornerStart.addDistancedEndCornerVerts(radius)                                    // assign new endVert

  //     if (outWrap) {
  //       console.log(`I'm out wrapping yo!`)
  //       let wrapOuts
  //       let wrapIns
  //       if (cornerStart.turns.end.isRight) {
  //         console.log(`making wrapOuts`)
  //         wrapOuts = this.recursiveOutWrapOutsideCorners(cornerStart, radiant, replace)
  //         outsideCorners.push(seg)                               // push outside corners for further processing
  //       } else {
  //         console.log(`making wrapIns`)
  //         wrapIns = this.recursiveOutWrapAdjInsideCorners(cornerStart, radiant, replace)
  //         insideCorners.push(seg)                                // push inside corners for further processing
  //       }
  //       if (wrapOuts) {
  //         console.log(`createCubicCorners wrapOuts`, wrapOuts)
  //         outsideCorners = outsideCorners.union(wrapOuts.outside, [`id`])
  //         insideCorners = insideCorners.union(wrapOuts.inside, [`id`])
  //       }
  //       if (wrapIns) {
  //         console.log(`createCubicCorners wrapIns`, wrapIns)
  //         outsideCorners = outsideCorners.union(wrapIns.outside, [`id`])
  //         insideCorners = insideCorners.union(wrapIns.inside, [`id`])
  //       }
  //     }

  //     if (!seg.hasBothCubicVerts) {
  //       corners.push(seg)
  //     }
  //     corners = corners
  //       // .filter(s => !s.hasBothCubicVerts) // remove segments with both cubicVerts assigned
  //       .sort((a, b) => a.minCubicLength - b.minCubicLength) // sort by smallest availableEndLength
  //       .sort((a, b) => a.cubicVertCount - b.cubicVertCount) // sort by smallest cubicVertCount
  //   }
  //   console.error(`createCubicCorners outsideCorners`, outsideCorners)
  //   console.error(`createCubicCorners insideCorners`, insideCorners)
  //   return { outside: outsideCorners.compacted.unique([`id`]), inside: insideCorners.compacted.unique([`id`]) }
  // }

  //MARK: MAXIMIZE CUDDLES
  inWrapPerimeter(simpleSegs, parentSegs) {
    console.log(`inWrapPerimeter`)
    let unmatched = new OpArray
    simpleSegs.forEach(simp => {
      console.log(`current Seg`, simp)
      const match = parentSegs.find(prnt => simp.hasCoincidentCorner(prnt))
      console.log(`match`, match)
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
    console.log(`this.allMinRadiusCorners`, this.allMinRadiusCorners)
    console.log(`corners`, corners)
    // if (!all) { console.log(`allMinRadiusCorners`, corners) }
    corners.forEach(s => {
      // if (s.id.includes('cell081')                                                                   //LOGGING:
      //   // || s.id.includes('cell008')                                                               //LOGGING:
      //   // || s.id.includes('cell001')                                                               //LOGGING:
      // ) { report = true }                                                                            //LOGGING:
      // let report = false                                                                             //LOGGING:
      // if (report) {                                                                                  //LOGGING:
      //   console.log(``)                                                                              //LOGGING:
      //   console.log(s.id)                                                                            //LOGGING:
      //   console.log(`this before`, s.cubicVerts)                                                     //LOGGING:
      // }                                                                                              //LOGGING:
      if (s.isMinCorner) {
        s.setMinEndCorner(true)
      } else {
        s.setMinEndCorner()
      }
      // if (report) { console.log(`this after`, s.cubicVerts) }                                        //LOGGING:
      if (!all && !s.flushWrapper?.isMinCorner) {
        s.flushWrap()

        // if (report) {                                                                                //LOGGING:
        //   console.log(`calling flushWrap:`, s.coincidentWrapper?.id)                                    //LOGGING:
        //   console.log(`flushWrap:`, s.coincidentWrapper)                                                //LOGGING:
        //   console.log(`cubicVerts:`, s.coincidentWrapper?.cubicVerts, s.coincidentWrapper?.endNeighbor.cubicVerts)
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
    console.log(`defaultPool`, defaultPool)
    //MARK: completeEnds()
    //ARROW: completeEnds()
    const completeEnds = (testPool = defaultPool, wrap = true) => {
      testPool = testPool
        .filter(s => !s.hasCompleteEndCorner)
        .sort((a, b) => a.arcRadius - b.arcRadius)

      console.warn(`allIncompleteEnds`, testPool)
      console.warn(`allIncompleteEnds`, testPool.map(s => s.arcRadius))
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
    console.log(`allInterferenceWrapped`, allInterferenceWrapped)
    console.log(`allInterferenceWrappers`, allInterferenceWrappers)

    //ARROW: wrapInterferenceCorners()
    const wrapInterferenceCorners = (testPool = allInterferenceWrapped, preserveQuads = preserveQs) => {
      console.warn(`allInterferenceWrapped`, testPool)                                                        //LOGGING:
      console.warn(`allInterferenceWrapped hasDoubleInterference`, testPool.map(s => s.hasDoubleInterference))//LOGGING:
      console.warn(`allInterferenceWrapped outWrapper count`, testPool.map(s => s.radiantOutWrappers.length)) //LOGGING:
      console.warn(`allInterferenceWrapped maxArcRadius`, testPool.map(s => s.maxArcRadius))                  //LOGGING:
      console.warn(`allInterferenceWrapped viableInterferenceOrigins`, testPool.map(s => s.viableInterferenceOrigins))
      console.warn(`allInterferenceWrappers`, allInterferenceWrapped.map(w => w.interferenceWrappers))   //LOGGING:
      console.warn(`allInterferenceWrappers flat`, allInterferenceWrappers)                              //LOGGING:

      //ARROW: removeDuplicates()
      const removeDuplicates = () => {
        const wrappers = allInterferenceWrappers.map(w => w.innerMostRadiantWrapper)
        console.log(`wrappers`, wrappers)
        const dupes = testPool.intersect(wrappers, `id`)
        console.warn(`dupes`, dupes)

        if (!dupes.isEmpty) {
          let reducePool = testPool.copy
          dupes.forEach(d => {
            let dupeCount = 0
            while (reducePool.length > 0) {
              // console.log(`dupeCount`, dupeCount)
              const wrap = reducePool.shift()
              const wrappers = OpArray.fromObjectValues(wrap.interferenceWrappers).compacted
              // console.log(`wrap`, wrap)
              // console.log(`wrappers`, wrappers)
              // console.log(`wrap.id`, wrap.id)
              // console.log(`dupe.id`, d.id)
              if (wrap.id === d.id
                || wrappers.some(i => i.innerMostRadiantWrapper.id === d.id)
              ) {
                dupeCount += 1
                // console.log(`dupeCount`, dupeCount)
                if (dupeCount > 1) {
                  testPool = testPool.filter(w => w.id !== wrap.id)
                  dupeCount -= 1
                }
              }
            }
          })
        }
        console.warn(`reduced Pool`, testPool)
      }

      removeDuplicates()

      // return
      // testPool = testPool.slice(0, 3)

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
          if (seg.radiantInWrappers && seg.innerMostRadiantWrapper.canCurveTo(projected)) {
            seg = seg.innerMostRadiantWrapper
            console.error(`changed seg`, seg.id)                                                          //LOGGING:
            console.log(seg)                                                                              //LOGGING:
          }
          if (seg.currentViableArcOrigins.some(o => o.equals(projected, 0))) {
            console.log(`curving ${wrapType}wrapper!`)                                                    //LOGGING:

            seg.setEndRadiantOutWrapsOrigin(projected)
            seg.flushWrap()                             //TODO: this improves interferenceWrapping on #516
          }
        }

        console.error(`interferenceWrapped in queue:`, s)
        console.error(`interferenceWrappers:`, s.interferenceWrappers)
        console.log(`neighbors`, s.neighborsArray)
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
          // console.log(`viables`, viables)
          if (preserveQuads && s.isEdgeOfQuad && viables.some(v => v.equals(s.shape?.center, 1))) {
            origin = s.shape.center
          } else {
            // origin = viables.middle
            origin = viables.last
          }
        } else {
          console.log(`NO viableInterferenceOrigins found!`)
        }
        if (origin && s.outerMostRadiantWrapper.canCurveTo(origin, true)) {
          console.log(`origin found!`, origin)
          s.setEndRadiantOutWrapsOrigin(origin)
          let { start, end } = s.interferenceWrappers
          if (start) { setCurve(start, true) }
          if (end) { setCurve(end, false) }
        } else {
          console.log(`NO origin found!`)
        }
      })
    }

    //MARK: wrapInnerMost()
    //ARROW: wrapInnerMost()
    const wrapInnerMost = (testPool = defaultPool, preserveQuads = preserveQs, balanced = balance) => {
      console.warn(`wrapInnerMost testPool`, testPool)
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

      console.warn(`allInnerMostWrappers`, testPool)
      console.warn(`allInnerMostWrappers outWrappers`, testPool.map(s => s.radiantOutWrappers.length))
      // console.warn(`allInnerMostWrappers viables`, testPool.map(s => s.viableRadiantOrigins))

      // return
      // testPool = testPool.slice(0, 1)

      testPool.forEach(s => {
        console.error(`innerMost in queue`, s)                                                                //LOGGING:
        // console.groupCollapsed(`innerMost in queue`, s)                                                    //LOGGING:
        const viables = s.viableRadiantOrigins
        console.log(`viableArcOrigins`, s.viableArcOrigins)                                                   //LOGGING:
        console.log(`currentViableArcOrigins`, s.currentViableArcOrigins)                                     //LOGGING:
        console.log(`viableRadiants`, viables)                                                                //LOGGING:
        console.log(`radiantOutWrappers`, s.radiantOutWrappers)                                               //LOGGING:
        console.log(`radiantOutWrappers`, s.radiantOutWrappers.map(r => r.viableArcOrigins))              //LOGGING:

        if (viables) {
          // let origin
          const shape = s.shape
          console.log(shape)
          if (preserveQuads
            && shape.isQuad
            && shape.simpleSubShapes.flat().every(c => !c.hasInterference)
            && allInterferenceWrappers.every(i => i.innerMostRadiantWrapper.id !== s.id)
            && s.radiantOutWrappers.every(r => r.viableArcOrigins?.some(o => o.equals(s.middleArcOrigin, 0)))
          ) {  // shape is quad
            console.warn(`shape is quad!`, s)
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
            console.log(`radiant wrapping to ${origin.string}`)
            s.setEndRadiantOutWrapsOrigin(origin)
            if (s.outerMostRadiantWrapper.outWrapper) {
              console.log(`outerMostRadiantWrapper`, s.outerMostRadiantWrapper)
              s.outerMostRadiantWrapper.adjWrap()
            }
            // completeEnds(s.neighborsArray)
          }

          // console.groupEnd()                                                                             //LOGGING:
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
      console.log(`badAdjWraps`, testPool)

      // return
      testPool = testPool.slice(0, 3)
      //FIXME: Implement this in a while loop as used in fixLoosies(), can we reuse finishing testPool code?
      testPool.forEach(s => {
        console.error(`badAdjWrap in queue:`, s)                                                          //LOGGING:
        // console.groupCollapsed(`badAdjWrap in queue:`, s)                                                //LOGGING:

        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          console.log(`inWrapper:`, s.inWrapper)
          s.inWrapper.adjWrap(true)                             // adjWrap() should handle div/conv and equid/prox
          s.inWrapper.replaceEndRadiantOutWrapsOrigin(s.arcOrigin) // radiant outwrapping
        }
        //ARROW: wrapInFix()
        const wrapInFix = () => {
          console.log(`inWrapper:`, s.inWrapper)
          if (s.inWrapper.isInWrappedToRadiants) {
            console.log(`abort fix: inWrapper is wrapped to radiants`)
            return
          }
          s.adjWrap(true)                                       // adjWrap self to wrap in
          s.inWrapper.flushWrap(true)                             // only do a single flushWrap in
        }


        if (s.isOutWrappedToRadiants) {                      // bail if s is already wrapped to outer radiants
          console.log(`is outWrapped to radiants`)                                                      //LOGGING:
          if ((s.inWrapper.isInWrapped || s.inWrapper.isInWrappedToRadiants)
            // && s.neighborsArray.every(n => !n.isInWrappedToRadiants)            // fixes: #453, #472
            // && s.neighborsArray.some(n => !n.isInWrappedToRadiants)            // fixes: #493
          ) {
            console.log(`inWrapper is inWrapped to radiants`)                                           //LOGGING:
            // console.log(`neighbors`, s.neighborsArray.map(n => n.isInWrappedToRadiants))                //LOGGING:
            const inner = s.inWrapper.innerMostRadiantWrapper
            if (s.neighborsArray.every(n => !n.isInWrappedToRadiants)) {          // fixes: #453, #472

              console.log(`inner.viableRadiantOrigins`, inner.viableRadiantOrigins)
              console.log(`inner`, inner)
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
          console.log(`wrap is converging`)
          if (s.canCurveLessAtEnd) {
            console.log(`curve outer less with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            console.log(`curve inner more with wrapInFix()`)
            wrapInFix()
          } else {
            console.log(`no fix`)
          }
        } else if (s.adjWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          console.log(`wrap is diverging`)
          if (s.canCurveTo(s.inWrapper.arcOrigin, true)
            && !s.outWrapper?.isMinCorner
          ) {
            console.log(`curve outer more with wrapOutFix()`)
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveTo(s.arcOrigin, true)
          ) {
            console.log(`curve inner less with wrapInFix()`)
            wrapInFix()
          } else {
            console.log(`no fix`)
          }
        }
        completeEnds(s.andNeighborsArray)
        // console.groupEnd()                                                                              //LOGGING:
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
      console.log(`badFlushWraps`, testPool)

      // return
      // testPool = testPool.slice(0, 0)

      testPool.forEach(s => {
        //ARROW: wrapOutFix()
        const wrapOutFix = () => {                              // adjWrap() inWrapper to wrap Out to self
          console.log(`using wrapOutFix on:`, s.inWrapper)
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
          console.log(`using wrapInFix`)
          s.inWrapper.replaceEndCurveOrigin(s.arcOrigin)
          if (s.inWrapper.radiantOutWrappers?.some(o => !s.isRadiantWrapped(o) && s.canRadiateTo(o))) {
            s.inWrapper.replaceEndRadiantOutWrapsOrigin()
          }
        }

        console.error(`current badFlushWrap: `, s)
        console.error(`inWrapper: `, s.inWrapper)
        if (s.flushWrapIsConverging) {
          console.log(`flushWrapIsConverging`)
          if (s.canCurveLessAtEnd) {
            wrapOutFix()
          } else if (canWrapIn && s.inWrapper.canCurveMoreAtEnd) {
            wrapInFix()
          }
        } else if (s.flushWrapIsDiverging) {                      // curveOuterMore or curveInnerLess to fix
          console.log(`flushWrapIsDiverging`)
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

      console.log(`loosies`, testPool.map(s => s.id))
      console.log(`loosies`, testPool)
      console.log(`loosies outWrappers`, testPool.map(s => s.outWrappers?.length))
      // return

      let processed = new OpArray

      // const conditionFunc = () => { return testPool }
      // const action = () => {

      // return
      // testPool = testPool.slice(0, 1)

      while (testPool.length > 0) {
        const s = testPool.shift()

        // testPool.forEach(s => {
        console.error(`current loosie`, s)
        // return

        //ARROW: minRadFix()
        const minRadFix = () => {
          console.log(`minRadFix()`)
          if (s.neighborsArray.some(n => {
            console.log(`${s.id} neighbor`, n)
            return n.canCurveMoreAtEnd
              && (n.flushWrapIsNonEquidistant || n.adjWrapIsNonEquidistant)
              && n.coincidentWrapper?.canCurveMoreAtEnd           // optional fixes #504
          })) {          // check and curve neighbor fully
            if (balanced) {
              console.log(`balanced fix`)
              if (s.canCurveToMiddleOrigin) {
                if (s.startNeighbor.canCurveToMiddleOrigin) {
                  s.startNeighbor.setArcToMiddle()
                  s.setArcToMiddle()
                  s.endNeighbor.replaceEndCurveOrigin(s.endNeighbor.currentMaxArcOrigin)
                } else if (s.endNeighbor.canCurveToMiddleOrigin) {
                  s.setArcToMiddle()
                  s.endNeighbor.setArcToMiddle()
                  // console.log(`hasArc`, s.startNeighbor.hasArc)
                  // console.log(`flatAmount`, s.startNeighbor.flatAmount)
                  // console.log(`arcOrigin`, s.startNeighbor.arcOrigin)
                  // console.log(`currentMaxArcOrigin`, s.startNeighbor.currentMaxArcOrigin)
                  s.startNeighbor.replaceEndCurveOrigin(s.startNeighbor.currentMaxArcOrigin)
                }
              }
            } else {
              console.log(`Unbalanced fix`)
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
          console.log(`loners fix`)
          if (s.isOutsideCorner && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)) {
            minRadFix()
          } else {
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
          }
        }
        // if (s.flushWrapIsNonEquidistant || s.adjWrapIsNonEquidistant) {
        // case: s.isInnerMostWrapper
        if (s.isInnerMostWrapper) {
          console.log(`s.isInnerMostWrapper`)

          if (s.isOutsideCorner && equalsRoundedDec(s.arcRadius, s.cellRadius, 1)) {  // case:  this has minRadius 
            console.log(`this has minRadius`)
            if (s.outWrapper.isMinCorner) {
              console.log(`wrapped to assigned minCorner`)
              return
            }
            if (s.isOutWrappedToRadiants && !s.outWrapper.hasMinArcRadius) {
              console.log(`outwrapping`)
              if (s.viableRadiantOrigins?.some(v => v.equals(s.currentMaxArcOrigin, 1))) {
                s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
              }
            } else {
              if (s.outWrapper.hasMinArcRadius && s.canCurveMoreAtEnd) {        // case: tucked inside minRadius corner
                console.log(`maximizing neighbor curves first`)
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
            console.log(`this isn't the inWrapper to this outWrapper`)
            s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
            s.flushWrap(true)
            s.radiantOutWrappers?.forEach(o => {
              if (o.canCurveMoreAtEnd) { o.replaceEndCurveOrigin(s.currentMaxArcOrigin) }
            })
          }

          //TODO: Might need to refine further, it fixes #393 and #390
          if (s.radiantOutWrappers?.every(w => w.canCurveMoreAtEnd)) {
            console.log(`outWrappers fix`)
            s.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
          }

          const outWrapper = s.inOutFlushWrappers[1]
          if (s.flushWrapIsEquidistant && outWrapper.radiantOutWrappers) { // case: colWrapped & has rad outWrappers
            console.log(`colWrapped & has rad outWrappers`)
            console.log(`outWrapper`, outWrapper)

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
          console.log(`s.isOuterMostWrapper`)
          if (s.radiantInWrappers                            // case: has radiantInWrappers
            && !s.isInWrapped                                //TODO: fixes hor aspect cell bug, remove if problematic
            // && !s.isInWrappedToRadiants
          ) {
            console.log(`inWrappers fix`)
            console.log(`innerMostRadiantWrapper`, s.innerMostRadiantWrapper)
            if (s.isInWrapped && s.isInWrappedToRadiants) {
              console.log(`s.isInWrappedToRadiants`)
              s.inWrapper.adjWrap()
            }
            else if (s.canCurveTo(s.innerMostRadiantWrapper.currentMaxArcOrigin), true) {
              console.log(`case1 viables`, s.currentViableArcOrigins)
              // console.log(`case1 currentMaxArcOrigin`, s.innerMostRadiantWrapper.currentMaxArcOrigin)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.innerMostRadiantWrapper.currentMaxArcOrigin)
            }
            else if (s.innerMostRadiantWrapper.canCurveTo(s.currentMaxArcOrigin), true) {
              console.log(`case2 viables`, s.innerMostRadiantWrapper.currentViableArcOrigins)
              // console.log(`case2 currentMaxArcOrigin`, s.currentMaxArcOrigin)
              s.innerMostRadiantWrapper.replaceEndRadiantOutWrapsOrigin(s.currentMaxArcOrigin)
            }
          } else if (s.isAdjOutWrapper) {                    // case: NO radiantInWrappers
            console.log(`s.isAdjOutWrapper`)
            s.inWrapper.adjWrap()                            // fixes #499, #512
          }
        }
        // } else {
        //   console.log(`wrap was equidistant`)
        // }
        // else { console.log(`skipped: no cases met`) }
        testPool = testPool
          .union(s.neighborsArray, `id`)
          .exclude(processed, `id`)
        console.log(`add neighbors testPool`, testPool)
        testPool = filterPool(testPool)
        console.log(`filtered testPool`, testPool)
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
          // quad.forEach(s => s.flushWrap())
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

      console.log(`quads`, testPool.map(p => p.shape.id))
      // return

      testPool.forEach(segPath => {
        console.error(`current segPath start`, segPath.path[0].id)
        console.log(`current segPath`, segPath.shape.id)
        // const segPath = new SegPath(p)
        // console.log(`isComplete`, segPath.isComplete)
        // console.log(`isQuad`, segPath.isQuad)
        // console.log(`isOutsideShape`, segPath.isOutsideShape)
        // console.log(`hasLoosies`, segPath.hasLoosies)
        // console.log(`perimeter`, segPath.perimeter)
        if (preserveQuads && !segPath.hasAllMiddleArcs) { segPath.makeCurves() }
        else { console.log(`segPath.hasAllMiddleArcs`) }

      })

      const changed = testPool.flat()
        .map(s => s.outWrappers).flat().compacted
      console.warn(`changed`, changed)

      // fixBadAdjWraps(changed, false)
      // fixBadFlushWraps(changed)
      // fixLoosies(changed)

      // fixBadAdjWraps(testPool.flat(), false)
      // fixBadFlushWraps(testPool.flat())
      // fixBadAdjWraps(defaultPool, false)

      //NOTE: using only these two fixes: #431
      console.warn(`roundQuads fixIssues()`)
      fixBadFlushWraps()
      fixLoosies()


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
      //             seg.replaceEndRadiantOutWrapsOrigin(s.middleArcOrigin)
      //             let badWraps = seg.radiantOutWrappers?.slice(1)
      //               .filter(o => o.flushWrapIsNonEquidistant)
      //             console.log(`badWraps`, badWraps)
      //             if (!badWraps.isEmpty) {
      //               console.log(`flushWrapIsNonEquidistant!`)
      //               badWraps.forEach(b => { b.flushWrap(true) })
      //             }
      //           }
      //         })
      //         processed.push(s.shape.id)
      //         console.log(`processed`, processed)
      //       }



      //     } else {
      //       s.replaceEndCurveOrigin(s.currentMaxArcOrigin)
      //       s.flushWrap(true)
      //     }

      //     // completeEnds(s.andNeighborsArray)
      //   }

      // })

    }


    //TODO: DELETE WHEN DONE: only kept as ref to safeArrayWhile() and 'changed' implementations
    //ARROW: fixLooseCorners()                                                                          //UNUSED:
    // const fixLooseCorners = (testPool = this.allLooseCorners()) => {
    //   console.warn(`allLooseCorners`, testPool.map(s => s.id))

    //   const conditionFunc = () => { return testPool }
    //   const action = () => {
    //     console.log(``)
    //     console.log(`loosie count`, testPool.length)
    //     let loosie = testPool.pop()
    //     console.log(`loosie in loop`, loosie)

    //     let changed
    //     let flat = roundToDec(loosie.flatAmount, 1)
    //     const localWrap = () => {
    //       loosie.removeEndCornerVerts()
    //       changed = this.createCubicCorners({ subShapes: [loosie], outWrap: true, radiant: true, replace: true })
    //     }
    //     if (loosie.inWrappers) {
    //       const innerMost = loosie.innerMostWrapper
    //       console.log(`attempting outWrap on ${innerMost.id}`)
    //       console.log(`innerMost`, innerMost)
    //       innerMost.removeEndCornerVerts()
    //       changed =
    //         this.createCubicCorners({ subShapes: [innerMost], outWrap: true, radiant: true, replace: true })
    //     } else {
    //       localWrap()
    //     }
    //     loosie.matchEndCorner()
    //     // console.log(`loosie`, loosie)
    //     // console.log(`flat: ${flat}, new flatAmount: ${loosie.flatAmount}`)
    //     // if (loosie.hasLooseCorner) {
    //     //   console.log(`attempting localWrap()`)
    //     //   localWrap()
    //     // }

    //     console.log(`changed loosies`, changed)
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
      if (mode === 0) {
        console.warn(`wrapInterferenceCorners`)                                                   //LOGGING:
        wrapInterferenceCorners()
        console.warn(`wrapInnerMost`)                                                             //LOGGING:
        wrapInnerMost()
      }
      console.warn(`curveMinRadiusCorners`)                                                     //LOGGING:
      this.curveMinRadiusCorners()
      console.warn(`completeEnds`)                                                              //LOGGING:
      completeEnds()

      console.warn(`fixBadAdjWraps`)
      fixBadAdjWraps()
      console.warn(`fixBadFlushWraps`)
      fixBadFlushWraps()
      console.warn(`fixLoosies`)
      fixLoosies()

      console.warn(`roundQuads`)                                                                //LOGGING:
      // roundQuads()

    }

    console.error(`FIX Issues 1`)                                                                         //LOGGING:
    fixIssues()
    console.error(``)                                                                                     //LOGGING:
    // console.error(`FIX Issues 2`)                                                                         //LOGGING:
    // fixIssues()

  }


  //MARK: NESTLE SHAPES
  //METH: nestleShapes() :
  nestleShapes(quadMode = 0, diagonals = false) {
    // const cellRadius = roundToDec(this.cellRadius)
    const cellRadius = this.cellRadius

    //TODO: can minCorners be handled elsewhere?
    // handle 'minCorners' perimeter types
    // if (this.groups.some(g => g.maxCorners === 'minCorners')) {
    //   // console.log(`there is a minCorners Group`)
    //   let minCornerSegs = this.groups
    //     .filter(g => g.maxCorners === 'minCorners') // groups with 'minCorners' maxCorners
    //     .map(g => g.perimeterIslands).flat() // perimeterIslands in thse groups
    //     .map(isl => isl.cells).flat() // cells within those perimiterIslands
    //     .map(cell => cell.segments).flat() // segments within those cells
    //     .filter(seg => seg.isCorner) // corner segments within those segments
    //     .exclude(madeSegs, ['id']) // exclude segments already made in previous stairs
    //   // console.log(`minCornerSegs`, minCornerSegs.map(c => c.id))
    //   assignMids(minCornerSegs, 'Corner', false) // assign midpoints to these segs + shared segs with inside turns
    // }
    // else { console.log(`there is NOT a minCorners Group`) }



    //MARK: Nestle Main
    console.groupCollapsed(`createSimpleSubShapes`)
    this.createSimpleSubShapes()                                        // createSimpleSubShapes 
    console.groupEnd()

    // console.groupCollapsed(`createQuadShapes`)
    // // createQuadShapes(quadMode)                                                 // createQuadShapes
    // console.groupEnd()

    console.group(`maximizeCuddles`)
    // console.groupCollapsed(`maximizeCuddles`)
    this.maximizeCuddles()
    console.groupEnd()
    // console.groupEnd()

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
    // console.log(`randomComb reduced`, reduced)
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
    // console.log(`comb reduced`, reduced)
    return reduced
  }
  //METH: comb2()
  comb2({ selection = this.availableCells, dashArray, start = 0 } = {}) {
    const reduced = selection.combReduce(dashArray)
    // console.log(`comb2 reduced`, reduced)
    return this.assignCells(reduced)
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
    let availables = this.availableCells

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
      let shrunkSelection = availables.exclude(inlineSelection, 'id') //shrunk selection by excluding inline
      // console.log('shrunkSelection', shrunkSelection.map(e => e.id))

      //ARROW: newSquare() :
      const newSquare = () => {
        let isValid = false
        let cell, square
        while (isValid === false && shrunkSelection.length > 1) {
          // console.log('')
          cell = this.randomSelection(1 / shrunkSelection.length, shrunkSelection) //random cell within shrunk
          console.log('newSquare cell', cell.map(e => e.id))
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
      availables = original.exclude(selection, 'index') //remove selection from availables for new availables
      // console.log('availables', availables.map(e => e.id))
    })
    // console.log(`squares output cells`, selection)
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

    while (amount > 0 && !this.isFull) {
      if (selection.length > 0) {
        const outline = this.validNeighbors({ selection: selection, direction: direction })
          .filter(cell => cell.isAvailable)
        // console.log(`${groupID} outline ${amount}:`, outline.map(c => c.isAvailable))
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
  tempOutlineSelection(selection, amount = 1, direction = Direction.All) {
    // console.log(`tempOutlineSelection selection`, selection)
    // console.log(`tempOutlineSelection direction`, direction)
    // console.log(`tempOutlineSelection selection`, selection.map(c => c.id))
    let newSelection = new OpArray
    while (amount > 0) {
      if (selection.length > 0) {
        // console.log(`tempOutlineSelection selection`, selection)
        const outline = this.validNeighbors({ selection: selection, direction: direction })
        // console.log('temp outline', outline)
        // if (!outline.isEmpty) {
        newSelection.push(...outline)
        selection = newSelection.sort((a, b) => a.index - b.index)
        // }
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
      console.log('transformed isAvailable', transformed.map(e => e.isAvailable))
      console.log('destination flattened', destination.map(e => e.id))
      console.log('destination isAvailable', destination.map(e => e.isAvailable))
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
        if (useAvailable && transformCell.isAvailable === true) { // useAvailable changes isAvailable cells  
          const currentGroup = this.groupNamed(destCell.groupID)
          if (currentGroup) { // remove cell from currentGroup
            currentGroup.cells = currentGroup.cells.filter(cell => cell.id !== destCell.id)
          }
          destCell.groupID = -1 // groupID to -1
          destCell.isAvailable = true // isAvailable to true
        }
      })
      console.log('destination transformed isAvailable', destination.map(e => e.isAvailable))
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
        .filter(cell => cell.isAvailable === true) // filter for only isAvailable cells
      console.log('emptySelections 1', emptySelections)

      emptySelections = emptySelections
        .exclude(groupSelections.flat(), 'id') // exclude cells that will be isTaken
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
      thisCell.isAvailable = false
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
  setAvailability(selection = this.cells, isAvailable = false) {
    selection.forEach(cell => cell.isAvailable = isAvailable)
  }

  setGridAvailability(selection = this.cells, isAvailable = false) {
    if (selection.isEmpty) { return }
    selection.forEach(cell => {
      const thisCell = this.cells[cell.index]
      // console.log('thisCell id', thisCell.id)
      // console.log('thisCell groupID', thisCell.groupID)
      // console.log('thisCell isAvailable', thisCell.isAvailable)
      const thisGroup = this.groupNamed(thisCell.groupID)
      // console.log('thisGroup', thisGroup)
      if (thisGroup) { thisGroup.cells = thisGroup.cells.filter(cell => cell.id !== thisCell.id) }
      thisCell.groupID = -1
      thisCell.isAvailable = isAvailable
    })
  }
  // #endregion

  //MARK: Setup Methods
  //METH: assignElement() override
  assignElement() {
    super.assignElement()

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
  //METH: drawElement() override
  drawElement() {
    super.drawElement()

    this.shaderElts.forEach(elt => {
      elt
      // .viewBox(this.insetAnchor, this.insetSize, this.padding)
      // .layout(this.insetAnchor, this.insetSize, this.padding)
      // .attribute(`fill`, frameColor)
      // .attribute('overflow', 'visible')
    })

    this.comboElt
    // .attribute(`display`, `none`)
    // .style(`visibility`, `hidden`)

    this.highElt
    // .attribute(`display`, `none`)
    // .style(`visibility`, `hidden`)
    this.shadElt
      // .attribute(`display`, `none`)
      .attribute(`opacity`, .6)
    // .style(`mixBlendMode`, `luminosity`)

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
}

//MARK: CELLGROUP CLASS
// SIZE: 254 lines
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
  shapesGroups = new OpArray // rendering layer storage
  cuts = new OpArray

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
    // console.log(`createPerimiters this.id`, this.id)
    this.maxCorners = maxCorners
    this.direction = direction
    // switch (maxCorners) {
    //   case 'maxCorners':
    //     break
    //   case 'minCorners':
    //     break
    //   default:
    //     this.maxCorners = undefined
    //     console.error(`${maxCorners} is invalid Perimeter Type`)
    // }
    const groupID = this.id
    console.warn(`createPerimiters for:`, groupID)
    console.groupCollapsed(`grid.createIslands`)
    this.perimeterIslands = this.grid.createIslands({
      groupID: this.id,
      direction: direction,
      maxCorners: maxCorners,
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
    selection,
    direction = this.direction,
    isOutsetCut = false,    // is the single cut to outset using globalOutset, false subtracts globalOutset
    layerStart,           // layerStart should be greater than layerEnd, swapped if not!
    layerEnd,             // if unassigned, layerEnd = cutEnd
    dilationStart,        // overrides layerStart and crops into the dilationRadius
    dilationEnd,          // overrides layerEnd and stretches to the minOutsideCorner radius
    loftScale = 1,
    outsetLoft = true,
    angleOffset,
    amount = 1,
    fixedStair,
    perimeter = false,    // setting for making channels/walls
    isFrame = false,
    backing = false,
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

    console.groupCollapsed(`${this.id}.cutIslands`)
    console.log(`layer start/end`, layerStart, layerEnd)
    if (layerStart < layerEnd || layerStart === undefined) {            // layerStart should be larger, outside fx radius
      [layerStart, layerEnd] = [layerEnd, layerStart]                   // swap if needed
    }
    console.log(`layer swap start/end`, layerStart, layerEnd)
    if (!isFrame) {
      layerStart = isOutsetCut ? layerStart + globalOutset : max(layerStart - globalOutset, 0)
      if (layerEnd) { layerEnd = isOutsetCut ? layerEnd + globalOutset : max(layerEnd - globalOutset, 0) }
    }

    if (backing) {
      const insetScale = profile?.hasOutsetShade ? 1 : max(layerStart || 0, layerEnd || 0)
      // const insetScale = 1
      const newIslands = this.createSubIslands({ direction: direction, insetScale: insetScale })
      if (!newIslands.flat().isEmpty) { this.islandsToShapeGroups(newIslands, undefined, direction) }
    }

    console.log(`useDilation elements:`, layerEnd, dilationStart, dilationEnd)
    const useDilation = layerEnd === undefined || !!dilationStart || !!dilationEnd //  4 cases => useDilation
    console.log(`useDilation:`, useDilation)

    //calculate maxLofts per shape

    console.log(`cutIslands perimeterShapes:`, this.perimeterShapes)
    let shapeGroups = new OpArray
    this.perimeterShapes.forEach(sh => {                                  // create shapeGroups from common shape minRads
      console.error(`current shape in queue`, sh)
      let minRad = useDilation ? sh.minOutsideCornerRadius : (layerStart - layerEnd) * this.grid.minCellWidth
      minRad = roundToDec(minRad, 4)
      const neighbors = sh.neighborShapesCardinal
      console.warn(`minRad`, minRad)
      console.warn(`neighbors`, neighbors)
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
    console.log(`cutIslands shapeGroups:`, shapeGroups)


    if (loftScale < 1 / FRAME.pixToUserUnits) {                           // loftScale cant be less than 0
      console.error(`cutIslands error: zero loft`)
      return                                                              // exit
    }
    if (loftScale > 1) { loftScale = 1 }                                  // loftScale cant be greater than 1

    const extHighDepth = 1 - layerStart * this.grid.cellRadius / this.grid.cellRadius * 4
    // shapeGroups = shapeGroups.slice(0, 1)
    shapeGroups.forEach(grp => {
      console.log(``)
      console.error(`current shapegroup`, grp)
      console.error(`layerEnd`, 1 - grp.minRad / this.grid.cellRadius)
      const maxDilationRadius = roundToDec(1 - (grp.minRad / this.grid.cellRadius), 4)
      let dilationAmount, dilationStartRadius, dilationEndRadius
      let cut, insetScale

      if (useDilation) {                                        // extend cutRad into shape based upon grp.minRad
        console.warn(`using Dilation!`)
        if (!dilationStart) { dilationStart = 0 }                          // !dilationStart => dilationStart = 0
        if (!dilationEnd) { dilationEnd = 1 }                              // !dilationEnd   => dilationEnd = 1
        dilationStartRadius = dilationStart * maxDilationRadius
        dilationEndRadius = dilationEnd * maxDilationRadius

        if (profile?.hasInsetShade) {
          console.error(`this hasInsetShade`)
          // maxDilationRadius = 1 - (grp.minRad / this.grid.cellRadius)
          // dilationAmount = dilationStart - dilationEnd
          // if (layerStart * amount > maxDilationRadius) {
          //   console.warn(`setting dilation radii!`)
          //   dilationStartRadius = dilationStart * maxDilationRadius
          //   dilationEndRadius = dilationEnd * maxDilationRadius
          // } else {

          // }
          // layerStart = dilationStartRadius                               // set max layer end from grp.minRad
          layerEnd = dilationEndRadius                                      // set max layer end from grp.minRad
        } else {                                                // profile?.hasOutsetShade
          console.error(`this hasOutsetShade`)
          layerEnd = amount > 1 ? dilationEndRadius : 1

          if (!isFrame) {
            layerEnd = isOutsetCut ?
              layerEnd + globalOutset
              : layerEnd - globalOutset
            // : max(layerEnd - globalOutset, maxDilationRadius)
          }

        }


        console.log(`dilationStartRadius`, dilationStartRadius)
        console.log(`dilationEndRadius`, dilationEndRadius)
      }
      console.log(`maxDilationRadius`, maxDilationRadius)
      console.log(`after dilation`, layerStart, layerEnd)


      if (profile?.hasOutsetShade) {
        const maxLayer = layerStart - maxDilationRadius
        // const maxLayer = layerStart
        const minLayer = layerEnd - layerStart
        const maxStart = amount < 2 ? (amount + 1) * maxLayer : (amount + 2) * maxLayer
        console.log(`profile`, profile)
        console.log(`maxLayer`, maxLayer)
        console.log(`minLayer`, minLayer)
        console.log(`maxStart`, maxStart)
        if (minLayer > maxStart) { layerEnd = maxStart }
      }
      console.log(`after hasOutsetShade handling`, layerStart, layerEnd)

      const firstLayerEnd = amount > 1 && profile?.hasOutsetShade ?
        (isOutsetCut ? 1 + globalOutset : 1 - globalOutset)
        : layerEnd

      const firstLayerRange = range(layerStart, firstLayerEnd)                     // create range
      const firstStepWidth = firstLayerRange.size / amount                      // equal step division

      // if(profile?.isCutIn) {}
      const subLayerRange = range(layerStart, layerEnd)                     // create range
      const subStepWidth = subLayerRange.size / amount                      // equal step division     
      console.log(`firstLayerRange`, firstLayerRange)
      console.log(`subLayerRange`, subLayerRange)

      let cutStart, cutEnd
      for (let i = 0; i < amount; i++) {                                    // if amount>1, calc cutStart/End for each step
        const layerRange = i === 0 ? firstLayerRange : subLayerRange
        const stepWidth = i === 0 ? firstStepWidth : subStepWidth
        let loft = i === 0 ? min(layerRange.size, stepWidth) : layerRange.size * loftScale / amount                     // calc loft

        if (loft === 0) { continue }
        // cutStart = profile.hasInsetShade ? layerStart - i * stepWidth : layerStart - i * stepWidth
        // cutEnd = profile.hasInsetShade ? cutStart - stepWidth : cutStart - stepWidth
        cutStart = layerStart - i * stepWidth
        cutEnd = cutStart - stepWidth
        if (loftScale < 1) {
          if (outsetLoft) {
            console.log(`using outsetLoft`)
            cutEnd = cutStart - loft
          } else {
            console.log(`using insetLoft`)
            cutStart = cutEnd + loft
          }
        }
        const cutRange = range(cutStart, cutEnd)
        if (profile) {
          // insetScale = layerStart
          insetScale = profile.isInset ? cutStart : cutEnd
          insetScale = profile.isCutOut ? insetScale + loft : insetScale
        } else {
          insetScale = layerStart
        }


        console.log(`layerRange`, layerRange)
        console.log(`cutRange`, cutRange)
        console.log(`insetScale`, insetScale)

        // if (loft > 2 * insetScale) { loft = 2 * insetScale }

        if (profile) {
          cut = new ProtoCut({
            profile: profile,
            depth: loft * this.grid.minCellWidth,
            start: insetScale,
            extHighDepth: extHighDepth,
            angleOffset: angleOffset,
          })
        }

        console.log(`loft`, loft)
        console.log(`cut`, cut)
        console.log(`cut filters`, cut?.filters)

        //TODO: in order to get MAX loft, createSubIslands should be called first so that we can check for minRadius
        // FIXME: currently createSubIslands requires cut input? Need to remove this and assign cut after!
        const islands = grp.shapes.map(sh => sh.island)
        // const islands = undefined
        console.groupCollapsed(`createSubIslands`)
        console.log(`direction`, direction.name)
        let newIslands = this.createSubIslands({ cut: cut, islands: islands, selection: selection, direction: direction, insetScale: insetScale })
        console.groupEnd()
        console.groupCollapsed(`islandsToShapeGroups`)
        if (!newIslands.flat().isEmpty) { this.islandsToShapeGroups(newIslands, cut, direction) }
        console.groupEnd()
        console.log(``)
      }


      // }
    })
    console.groupEnd()
    // else if (layerEnd === `max`) {
    //   const squareIslands = newIslands.filter(i => i.isSquare)
    // }
  }
  //METH: createSubIslands() :
  createSubIslands({ cut, selection, islands = this.perimeterIslands, direction = this.direction, insetScale = 1 } = {}) {
    console.warn(`${this.id}.createSubIslands, this.islands =`, this.islands.map(i => i.id))
    console.groupCollapsed(`Island.createSubIslands`)
    const newIslands = islands.map(pIsle =>
      pIsle.createSubIslands({
        islandLevel: this.islandLevel + 1,
        selection: selection,
        direction: direction,
        cut: cut,
        insetScale: insetScale,
      }))

    console.groupEnd()

    return newIslands
  }
  //METH: assignToShapeGroups()
  islandsToShapeGroups(islands, cut, direction) {
    console.log(`islandsToShapeGroups`)
    console.log(`islands`, islands)
    console.log(`cut`, cut)
    console.log(`direction`, direction)
    // console.log(`shapes.svg`, islands.flat(this.islandLevel + 1).compacted.map(i => i.shape.svg))
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
        // insetScale: insetScale,
      })
      console.log(`new shapeGroup`, shapeGroup)
    })
  }

  //METH: createShapeGroup() :
  createShapeGroup({ islands, cut, filter, islandLevel, direction = Direction.Cardinal, insetScale = 1 } = {}) {
    const shapeGroup = new ShapeGroup({
      cellGroup: this,
      islands: islands,
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
    this.shapesGroups.push(shapeGroup)
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
        .attribute('overflow', 'visible')
    }

  }
}

//MARK: SHAPEGROUP CLASS
// SIZE: 121 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ShapeGroup extends ProtoLayer {
  cellGroup
  islands
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
    direction
  }) {
    console.log(`New ShapeGroup! with arguments:`, arguments[0])
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      insetScale: insetScale,
      filter: filter,
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
    this._type = `ShapeGroup-${filter?.type || `backing`}`

    // this.drawLabel = true
    // this.drawDeBugRect = true
    // this.drawPerimeter = true
    // this.drawInset = true

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
    return this.cellGroup.isBackGroup ? backGroupPadding : defaultPadding
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
    this.drawElement()
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

  }
  //METH: assignShapes()
  assignShapes() {
    this.shapes.forEach(s => {
      // console.log(`ShapeGroup.assignShapes() current svg: ${s.svg}`)
      // const pathCopy = s.path
      // console.log(`pathCopy`, pathCopy)
      // pathCopy.elt = pathCopy.elt.cloneNode()

      const path = createSVGElt('path')
        .attribute(`d`, s.svg)
        .addToClassList(s.id)
        .layout(s.anchor, s.size, s.padding)
        .attribute(`shape-rendering`, `geometricPrecision`)
        // pathCopy
        .id(`${s.id}-copy`)
        .parent(this.svgGroupElt)
      // .attribute('fill-rule', 'evenodd')
      // .attribute(`pathLength`, 154)
      this.paths.push(path)
    })
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
    console.log(`drawElement() layout vals`, this.anchor.string, this.size.string, this.padding.string)

    // const length = path.elt.getTotalLength()

    this.svgGroupElt
      .viewBox(this.anchor, this.size, this.padding)
      .layout(this.anchor, this.size, this.padding)
      .attribute(`fill`, frameColor)
      .attribute('overflow', 'visible')
      // .attribute('fill', protoColor(230))
      // .attribute('fill', lchcol02)
      // .attribute('fill', achromic(0.1))
      // .attribute('fill', 'blue')
      // .attribute(`pathLength`, 12)
      // .attribute('stroke', frameColor)
      // .attribute(`stroke-dasharray`, `0 6 `)
      // .attribute(`stroke-linecap`, `round`)

      .attribute('fill-opacity', 1)
    // .attribute('fill-opacity', 0)
    // .attribute('stroke-width', this.grid.cellRadius * 1.4)
    // .attribute('stroke-opacity', 1)

    // .attribute('stroke-width', this.cellGroup.isBackGroup ? 0 : this.grid.cellRadius * .25)
    // .attribute('stroke-opacity', this.cellGroup.isBackGroup ? 0 : 1)
    // .attribute('fill-opacity', this.cellGroup.isBackGroup ? 1 : 0)

    if (this.drawFilter) {
      console.error(`shapeGroup.drawFilter`, this.filter)
      this.svgGroupElt
        .applyFilter({
          filter: this.filter,
          // size: this.insetSize,
          size: Vertex.mult(this.insetSize, 1),
          // padding: Vertex.mult(this.insetSize, 2)
          padding: Vertex.mult(this.padding, 2),
          // padding: this.padding,
          // padding: Vertex.mult(this.grid.cellSize, 4)
        })

    }

    // this.cut.filters.forEach(filter => {
    //   this.svgGroupElt
    //     .applyFilter({ filter: filter, size: this.insetSize, padding: Vertex.mult(this.grid.cellSize, 2) })
    // })
  }
}

//MARK: CELL CLASS
// SIZE: 158 lines
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
      drawSVG: false,
      // drawRect: true,
      insetScale: 1,
    })
    if (!(coords instanceof Vertex)) { coords = vert(coords) }
    this.grid = grid
    this.index = index
    this.coords = coords
    this.isAvailable = isAvailable
    // this.color = color
    this._type = 'Cell'

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

  get neighborSegments() {
    const cell = this.grid.neighbor(this.index, Direction.Right)
    return cell?.segments
  }

  get sideNeighbors() { return new Sides(this.cardinalNeighborCoords.map(co => this.grid.cellAtCoords(co.x, co.y))) }
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
    const neighbs = this.sideNeighbors
    return (neighbs.horizontals.every(c => c?.isTaken) || neighbs.verticals.every(c => c?.isTaken))
    // && !neighbs.all.every(c => c?.isTaken)
    // && this.takenCardinalNeighbors.length !== 3
  }
  get ordinalOnlyNeighbors() {
    //ARROW: isOnlyOrdinalTo()
    const isOnlyOrdinalTo = (thisCell, neighbor) => {
      const dir = thisCell.grid.directionToNeighbor(this, neighbor)
      const adjDirs = dir?.adjacents
      const adjNeighbors = thisCell.validNeighbors(adjDirs)

      // console.error(`${thisCell.id} isOnlyOrdinalTo to ${neighbor.id}?`)
      // console.warn(`dir`, dir)
      // console.warn(`adjDirs`, adjDirs)
      // console.warn(`adjNeighbors`, adjNeighbors)
      return adjNeighbors.every(n => thisCell.groupID !== n.groupID)
    }

    // console.log(``)
    let ordinals = this.ordinalNeighbors
    // console.warn(`ordinalOnlyNeighbors for:`, this)
    // console.log(`first ordinals`, ordinals)
    ordinals = ordinals
      .filter(c =>
        c.groupID === this.groupID
        && isOnlyOrdinalTo(this, c)
      )
    // console.log(`filtered ordinals`, ordinals)
    return ordinals
  }

  // #endregion
  // MARK: Cell Geometry Methods
  // #region Geometry Methods
  //METH:
  neighborCoords(direction) {
    // console.log(`neighborCoords direction`, direction)
    // console.log(`neighborCoords moveCoord`, direction.moveCoord)
    return Vertex.add(this.coords, direction.moveCoord)
  }
  //METH:
  allNeighborsCoords(direction = Direction.All) {
    // console.log(`allNeighborsCoords`, direction.vals)
    const result = direction.directions.map(dir => this.neighborCoords(dir)).compacted
    // console.log(`allNeighborsCoords result`, result)
    return result
  }
  //FIXME: check to see if this method is being used. Seems like no, because bounds was not properly assigned before!
  //METH:
  validNeighborsCoords(direction = Direction.All, bounds = this.grid.gridCellBounds,) {
    return this.allNeighborsCoords(direction).filter(e => this.grid.coordsAreInBounds(e.x, e.y, bounds))
  }
  //METH: validNeighbors()
  validNeighbors(direction) { return this.grid.validNeighbors({ selection: [this], direction: direction }) }
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
// SIZE: 579 lines
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
      insetScale: insetScale,
      drawSVG: false,
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
    this.maxCorners = maxCorners
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
    // console.log(neighbors)
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
    if (!this.maxCorners || this.directionHierarchy < 2) { return this.cells }
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
  createSubIslands({ cut, selection, direction = Direction.Cardinal, insetScale = 1, drawFilter = true } = {}) {
    console.groupCollapsed(`${this.id} Island.createSubIslands`)
    if (this.subIslands && !selection) {
      //NOTE: recursive dive to create subIslands on the bottom-most (visually top/inner-most) subIslands
      console.error(`Divers go down! This.subIslands = `, this.subIslands.map(i => i.id))
      console.groupEnd()
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
    console.warn(`createSubIslands direction`, direction.name)
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
        console.log(`copying island ${this.id}`)
        // copy this island but change inset, set filter, set drawFilter
        const subIsland = this.copy({ insetScale: insetScale, drawFilter: drawFilter })
        // console.log(`created subIsland: `, subIsland)
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
          console.log(i.shape.simpleSubShapes)
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
      if (selection) {
        console.error(`subIslands selection`, selection.map(c => c.id))
        const newCells = selection.intersect(this.cells, 'id')
        console.warn(`subIslands this.cells`, this.cells.map(c => c.id))
        console.warn(`subIslands newCells`, newCells.map(c => c.id))
        subIslands = newIslands(newCells)
      } else {
        if (direction.equals(this.direction)) { copyIsland() }

        // different direction: requires new island and/or shape creation
        if (this.hierarchyFrom(direction) < this.directionHierarchy) {
          console.warn(`creating ${this.id} subIslands with direction: ${direction.name}`)
          // parent direction is All and new direction is Cardinal: careful reconstruction of current SimpleSubShapes
          if (this.direction.isAll && direction.isCardinal) { //
            if (!this.ordinalConnections.isEmpty) {
              console.log(`using copyAllToCardinal()`)
              subIslands = this.copyAllToCardinal(insetScale, drawFilter)
              console.log(`copyAllToCardinal() subIslands:`, subIslands)
            } else {
              copyIsland()
            }
          }
          // parent direction is All/Cardinal: recalculate island cells based on parent shape, then create new islands
          else if (this.directionHierarchy >= 2 && this.hierarchyFrom(direction) < 2) {
            console.log(`  triggering a recalcdCells on ${this.id}`)
            const newCells = this.recalcdCells({ newInsetScale: insetScale, loft: cut?.depth || 0 })
            subIslands = newIslands(newCells)
          }
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
    // console.log(`newIsland`, newIsland)
    return newIsland
  }
  //METH: copyAllToCardinal() :
  copyAllToCardinal(insetScale, drawFilter = true) {
    console.log(`copyAllToCardinal`)
    console.log(`insetScale`, insetScale)
    const cellIslands = this.grid.createIslands({
      insetScale: insetScale,
      drawFilter: drawFilter,
      selection: this.cells,
      islandID: this.id,
      direction: Direction.Cardinal,
      // stored: true,
      // createShape: true, // this might NOT be impacting my debug situation - if not please remove on createIslands()
    })
    console.log(`cellIslands`, cellIslands.map(is => is.cells.map(c => c.id)))
    //NOTE: just added this for testing. Should try dropping in newSubShapes from above?
    const parentSimpleSubShapes = this.shape.simpleSubShapes
    cellIslands?.forEach((isle, i) => {
      const shape = isle.shape
      // shape.setInsetScale(insetScale)
      isle.createSimpleSubShapes()

      // isle.createSimpleSubShapes()
      const simpleSubShapes = isle.shape.simpleSubShapes

      this.grid.inWrapPerimeter(simpleSubShapes.flat(), parentSimpleSubShapes.flat())
      // this.grid.maximizeCuddles(simpleSubShapes, 1)
      // this.grid.nestleShapes()
      // this.grid.curveMinRadiusCorners({ corners: simpleSubShapes })

      // this.grid.createUTurns({ subShapes: simpleSubShapes, out: false, radiant: false })
      // this.grid.inWrapOutsideCorners(simpleSubShapes, parentSimpleSubShapes)  //
      // this.grid.inWrapInsideCorners(simpleSubShapes, parentSimpleSubShapes)   //
      // this.grid.createUTurns({ subShapes: simpleSubShapes, radiant: false })
      // this.grid.createCubicCorners({ subShapes: simpleSubShapes, radiant: false })   //finish remaining corners, required for Cardinal inset < 0.75

      console.log(`shape`, shape)
      console.log(`shape.svg`, shape.svg)
      // shape.assignElement()       // assignElement in order to assign path to Shape.path for use in ShapeGroup
      // shape.drawElement()         // DEPRECATE: Now, only shapeGroup element is drawn, using shape's path
    })
    return cellIslands
  }
  //METH: createShape() :
  createShape(insetScale) {
    console.log(`createShape for ${this.id}, insetScale`, insetScale)
    console.log(`createShape`, this)
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
// SIZE: 309 lines
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
  get padding() { return vert(this.grid.cellRadius) }

  get group() { return this.island.group }
  get grid() { return this.island.grid }
  get simpleSegPaths() { return this.simpleSubShapes.map((sub, i) => new SegPath(sub, this)) }
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
      // console.error(`ISSUE neighborShapes HERE!!!`, this.island.neighborIslands)
      return this.island.neighborIslands.map(i => i.shape)
    }, `neighborShapes`).call(this)
  }
  //MEMO: neighborShapesCardinal
  get neighborShapesCardinal() {
    return memoize(() => {
      // console.error(`ISSUE neighborShapesCardinal HERE!!!`, this.island.neighborIslands)
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
    if (this.isPerimeterShape || !this.isSquare) { return false }
    return this.allCornerRadii.every(min => roundToDec(min, 1) === roundToDec(this.allCornerRadii[0], 1))
  }
  get isCircle() {
    return this.isRoundedSquare && roundToDec(this.minCornerRadius, 1) === roundToDec(this.insetSize.x / 2, 1)
  }
  get isLeaf() {
    const rads = this.allCornerRadii
    return this.island.isRectangle
      && !this.isCircle
      && (equalsRoundedDec(rads[0], rads[2], 1) || equalsRoundedDec(rads[1], rads[3], 1))
    // && roundToDec(this.allCornerRadii[0], 1) === roundToDec(this.allCornerRadii[2], 1)
    // && roundToDec(this.allCornerRadii[1], 1) === roundToDec(this.allCornerRadii[3], 1)
  }
  get isSquareLeaf() { return this.isLeaf && this.isSquare }

  get hasSubShapes() { return this.subShapes.length > 1 }
  get hasUTurns() { return this.allSimpleSegs.some(s => s.isUTurn) }
  get shapeCorners() { return this.allSegments.map(s => s.cornerVerts).flat().unique(['x', 'y']) }
  get allSegments() { return this.subShapes.flat() }
  get allSimpleSegs() { return this.simpleSubShapes.flat() }
  get allOutsideCorners() { return this.allSimpleSegs.filter(s => s.isOutsideCorner) }
  get allCornerRadii() { return this.allSimpleSegs.map(s => s.arcRadius) }
  get assignedVerts() {
    return this.subShapes.map(sub => sub.map(s => s.assignedVerts).flat().unique(['x', 'y']))
    // .flat()
  }

  // get hasFlatness() { return this.allSimpleSegs.some(s => s.hasFlatness) }                               //UNUSED:
  // get canCurveMore() { return this.allSimpleSegs.some(s => s.canCurveMore) }                             //UNUSED:
  // get segsThatCanCurveMore() { return this.allSimpleSegs.filter(s => s.canCurveMore) }                   //UNUSED:

  get minCornerRadius() { return min(this.allSimpleSegs.map(s => s.arcRadius)) }
  get maxCornerRadius() { return max(this.allSimpleSegs.map(s => s.arcRadius)) }
  get minOutsideCornerRadius() {
    if (this.isSquareLeaf) { return this.squareLeafLoftRadius }
    if (this.isSingleShape) {
      return min(this.allOutsideCorners.map(s => s.arcRadius))
    } else {
      const grid = this.grid
      const cellSize = grid.cellSize
      const minHorThick = this.cellBounds.minHorCellThickness
      const minVertThick = this.cellBounds.minVertCellThickness
      let mult, size
      if (!grid.cellAspect.isLandscape) {
        mult = minHorThick
        size = cellSize.x / 2
      } else {
        mult = minVertThick
        size = cellSize.y / 2
      }
      return mult * size
      return this.grid.cellRadius * 2
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

    console.log(`subs`, subs)
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
    console.groupCollapsed(`svg creation`)
    let result = this.insetSubShapes.map(e => SVGPath.fromProtoSegPath({
      segPath: e,
      // cornerMin: min(this.insetSize.x / 2, this.insetSize.y / 2)
    }))
    if (result instanceof Array) {
      result = result.join(' ')
    }
    console.groupEnd()
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
  //METH: : create initial SimpleSubShapes with minCorners to be refined by nestleShapes
  createSimpleSubShapes() {
    console.warn(`${this.id}.createSimpleSubShapes called!!!`)
    this.simpleSubShapes = this.subShapes.map((sub, i) => {
      let newPath = new SegPath(sub, this)
      newPath = newPath
        .refined()
        .path
      return newPath
    })
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
      .layout(this.anchor, this.size, this.padding)
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
