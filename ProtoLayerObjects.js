// import { Random } from './artBlocks/Random.js'
// import { Direction } from './ProtoUtility.js'

// NOTE: https://stackoverflow.com/questions/38205867/resize-child-div-element-to-fit-in-parent-div-on-window-resize
// NOTE: https://developer.mozilla.org/en-US/docs/Web/CSS/calc
// MARK: PROTOLAYER CLASS 
//conforms to IdentifiableStored and Debuggable
// SIZE: 217 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ProtoLayer {
  id
  _type
  protoParent   // ProtoLayer
  _insetScale
  _filter
  svgParent     // 'SVG' p5.Element
  svgElt        // 'SVG' p5.Element
  rect          // 'rect' p5.Element
  drawSVG
  drawRect
  allowsProtoErrors

  constructor({
    protoParent,
    svgParent,
    type,
    insetScale,
    filter,
    drawSVG = true,
    drawRect = false,
    allowsProtoErrors = false
  } = {}) {
    if (protoParent instanceof ProtoLayer) {
      this.protoParent = protoParent
      this.svgParent = protoParent.svgElt || protoParent.svgParent
    }
    else if (protoParent instanceof p5.Element) { this.svgParent = protoParent }
    else { DeBug.error('protoParent is not valid') }
    if (svgParent) { this.svgParent = svgParent }
    this._type = type
    if (insetScale !== undefined) { this._insetScale = insetScale instanceof Vertex ? insetScale : vert(insetScale) }
    this._filter = filter
    this.drawSVG = drawSVG
    this.drawRect = drawRect
    this.allowsProtoErrors = allowsProtoErrors
    this.assignUID()
  }

  // MARK: View Properties
  // #region 

  get type() { return this._type }
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

  // #endregion

  // MARK: Memoized Properties
  // #region 
  get parentID() {
    return memoize(() => {
      return this.protoParent?.id ?? this.svgParent.id()
    }, `parentID`).call(this)
  }
  get boundsRect() {                      // inherits parent's insetBoundsRect
    return memoize(() => {
      return this.protoParent?.insetBoundsRect
    }, `boundsRect`).call(this)
  }
  get anchor() {                          // taken from this.boundsRect
    // return memoize(() => {
    return vert(this.boundsRect.x, this.boundsRect.y)
    // }, `anchor`).call(this)
  }
  get size() {                            // taken from this.boundsRect
    // return memoize(() => {
    return vert(this.boundsRect.width, this.boundsRect.height)
    // }, `size`).call(this)
  }
  get insetSize() {                       // calc from this.size and this.insetScale
    // return memoize(() => {
    return Vertex.mult(this.size, this.insetScale)
    // }, `insetSize`).call(this)
  }
  get insetAnchor() {                     // calc from this.insetSize and this.size
    // return memoize(() => {
    return this.anchorFor(this.insetSize)
    // }, `insetAnchor`).call(this)
  }
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

  get center() {
    return memoize(() => {
      return Vertex.div(this.size, 2).add(this.anchor)
    }, `center`).call(this)
  }
  get corners() {
    return memoize(() => {
      return new Corners([this.anchor, Vertex.add(this.anchor, this.size)])
    }, `corners`).call(this)
  }
  get sides() {
    return memoize(() => {
      const
        isCell = this.type === 'Cell',
        simpleSides = this.corners.sides.obj,
        sidesObj = simpleSides.map((side, key) => {
          // DeBug.log(`sides side, key`, side, key)
          const
            midPoint = segment(side.start, side.end).mid,
            points = OpArray.format([side.start, midPoint, side.end]),
            sideDir = Sides.Directions[key]
          let cells
          if (isCell) { cells = OpArray.format(this) }
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
      return new Sides(sidesObj)

    }, `sides`).call(this)
  }
  get midPoints() {
    return memoize(() => {
      return this.sides.obj.map(side => side.mid)
    }, `midPoints`).call(this)
  }
  get points() {  // 9 points array: center, corners, midpoints all grid vert sorted
    return memoize(() => {
      const
        corners = Object.values(this.corners),
        mids = Object.values(this.midPoints)
      return OpArray.format([this.center, corners, mids].flat()).gridVertSorted
    }, `points`).call(this)
  }
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
  // #endregion

  //METH: equals()
  equals(protoLayer) { return this.id === protoLayer.id }
  // MARK: Settings Methods
  //METH: setType()
  setType(toType) { this._type = toType }

  // MARK: Setup Methods
  // #region 
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
        .layout(this.anchor, this.size, this.padding)
        .viewBox(this.anchor, this.size, this.padding)
    }

    if (this.drawRect) {
      this.rect = createSVGElt('rect').id(`${this.id}-frontRect`)
        .parent(this.svgElt)
        .addToClassList(this.id)
        .addToClassList(this.svgParent.elt.classList.value)
        .layout(this.insetAnchor, this.insetSize)
    }
  }
  //METH: 
  drawElement() {
    if (this.drawRect) {
      this.rect
        .attribute('rx', `${this.cornerRadius}`)
        .attribute('ry', `${this.cornerRadius}`)
        .attribute('fill', `black`)
    }
  }
  // #endregion
}
// MIXIN: ProtoLayer Mixin/Protocol Assignment
Object.assign(ProtoLayer.prototype, IdentifiableStored)
Object.defineProperties(ProtoLayer.prototype, Object.getOwnPropertyDescriptors(Debuggable))

//MARK: FRAME CLASS
// SIZE: 274 lines
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
    this.finishSetup(S.Frame)
  }

  // MARK: Frame Computed Properties
  get anchor() { return vert() }
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
  get svgMarkup() { return Export.createSVGMarkup(this.bleed.elt) }

  // MARK: Frame modifiers
  //METH: setGrid()
  setGrid(grid) {
    this.grid = grid
    this.createBackGrid(grid)
    this.grid.backGrid = this.backGrid
    this.backGrid.frontGrid = grid
    BGRID = this.backGrid

    DeBug.log(`this.grid`, this.grid)
    DeBug.log(`this.backGrid`, this.backGrid)
    this.backGrid.backElt = this.grid.backElt
    this.backGrid.comboElt = this.grid.comboElt
    this.backGrid.highElt = this.grid.highElt
    this.backGrid.shadElt = this.grid.shadElt
    this.backGrid.maskElt = this.grid.maskElt
    this.backGrid.finalMaskElt = this.grid.finalMaskElt
    this.backGrid.shaderElts = this.grid.shaderElts
  }
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
  setBackGridGroup(mode = 1, wrap = true, cuts, minInsetAmount) {
    const [grid, backGrid] = [this.grid, this.backGrid]

    if (mode === 0) this.backGroup = backGrid.groupAvail()
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
    // .filter(s => s.canCurveMoreAtEnd)

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
    DeBug.log(`backGroup segPaths`, segPaths)
    DeBug.log(`backGroup segPaths parts`, segPaths[0].path.map(s => s.part))

    //NOTE: calculate padWidth
    DeBug.log(``)
    DeBug.warn(`padWidth calculation`)
    DeBug.log(`grid.insetAmount.x`, grid.insetAmount.x)
    DeBug.log(`grid.cellRadius`, grid.cellRadius)

    const
      padWidth = ((1 + (grid.insetAmount.x / grid.cellRadius || grid.cellRadius))) / 2,
      gridWidth = 1 + (1 * grid.cellOutset) + minInsetAmount,
      actual = range(gridWidth, padWidth * 2)

    //ARROW: scaled() : scale frame cut amount from initial (0-1) to actual calculated cellRadius based amount
    const scaled = (amount) => range().convertRange(amount, actual)

    DeBug.error(`padWidth`, padWidth)
    DeBug.log(``)
    //NOTE: cut flat backing island (no cut, just fill actually)
    this.backGroup.cutIslands({
      // profile: Profile.jIn,        // no profile creates flat backing
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
      })
    })

    DeBug.log(`backGroup`, this.backGroup)

    if (this.mask) this.maskFrame()
  }

  //METH: maskFrame()
  maskFrame() {
    const defs = createSVGElt(`defs`)                     // create <defs> element
      .parent(this.svgElt),

      maskID = `${this.id}-mask`,                       // ID for mask
      frameMask = createSVGElt(`mask`)                  // create <mask> element
        .id(maskID)
        .parent(defs),

      gridClone = this.backGroup.shapeGroups[0].svgGroupElt.elt.cloneNode(true),
      paths = gridClone.querySelectorAll('path')

    DeBug.log(`shapeGroups`, this.backGroup.shapeGroups[0].svgElt)
    DeBug.log(paths)

    paths.forEach(p => p.setAttribute(`fill`, `white`))

    // const gridCloneP5 = addElement(gridClone, window)   // Wrap gridClone as a p5.Element
    // gridCloneP5.blur(1 / 16)                            // apply blur to the clone
    frameMask.elt.appendChild(gridClone)


    this.svgElt.attribute(`mask`, `url(#${maskID})`)
  }

  // MARK: Frame Setup Methods
  // #region Setup Methods
  //METH: assignElement()
  assignElement() {
    this.bleed = createSVGElt().id('bleed')
      .parent(this.svgParent)
      .viewBox(-5, -10, 110, 220)
      .attribute('width', `${frameSize.x}`)
      .attribute('height', `${frameSize.y}`)
    // .style('pointer-events', 'none')

    this.bleedRect = createSVGElt('rect').id(`${this.id}-bleedRect`)
      .parent(this.bleed)
      .layout(-15, -10, 130, 220)
    // .style('pointer-events', 'none')

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
      // .style('pointer-events', 'none')
    }

  }

  //METH: drawElement()
  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.frameRect
        .attribute(`pointer-events`, `none`)
        .layout(this.anchor, this.size)
        .attribute('fill-opacity', '0')
    }
  }
  // #endregion
}

//MARK: SelectionBounds CLASS
// SIZE: 283 lines
// NOTE: SelectionBounds is not a ProtoLayer subClass 
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
  get cellsBoundsSeg() {
    return memoize(() => {
      return segment(vert(this.xCellMin, this.yCellMin), vert(this.xCellMax, this.yCellMax))
    }, `cellsBoundsSeg`).call(this)
  }
  get cellsBounds() {
    return memoize(() => {
      return findBounds(this.cellsBoundsSeg)
    }, `cellsBounds`).call(this)
  }
  get selectionRows() {
    return this.boundCellRows.map(r => r.filter(c => this.selection.some(s => s.id === c.id)))
  }
  get selectionColumns() {
    return this.boundCellColumns.map(c => c.filter(r => this.selection.some(s => s.id === r.id)))
  }

  get selectionRowsGrouped() {
    return memoize(() => {
      return this.#groupSelectionStrips(true)
    }, `selectionRowsGrouped`).call(this)
  }
  get selectionColumnsGrouped() {
    return memoize(() => {
      return this.#groupSelectionStrips(false)
    }, `selectionColumnsGrouped`).call(this)
  }
  //METH: groupSelectionStrips() : Object : group selection strips (rows or columns) into groups of neighboring cells
  #groupSelectionStrips(hor) {
    const maxWidth = hor ? this.rowCount : this.columnCount,
      selStrips = hor ? this.selectionRows : this.selectionColumns,
      selGroups = selStrips.map((strip, i) => {
        // DeBug.error(`strip start`, i)
        if (strip.isEmpty || strip.length === maxWidth)           // if strip is empty or full, just return strip
          return [{ i: i, groups: strip }]

        let prev, group, groups = new OpArray
        strip.forEach((cell, j) => {
          // DeBug.warn(`group start`, group)
          if (j !== 0) prev = strip[j - 1]                             // set prev to previous cell

          // DeBug.log(`cell`, cell.id)
          // DeBug.log(`prev`, prev?.id)
          // DeBug.log(`prev.neighbors`, prev?.neighbors.map(n => n.id))

          if (prev?.neighbors?.some(n => n.id === cell.id)) {           // if prev and cell are neighbors
            // DeBug.log(`Yes neighbors`)
            group.push(cell)                                            // add to group 
          } else {                                                      // if not neighbors
            // DeBug.log(`NOT neighbors`)
            groups.push(group)                                          // add group to groups
            group = [cell]                                              // reset group
          }
          if (j === strip.lastIndex) groups.push(group)                // if last cell, push group to groups
          // DeBug.log(`group end`, group)
          // DeBug.log(`groups`, groups)
        })
        return { i: i, groups: groups.compacted }                       // return index and groups
      })
    return selGroups
  }

  get outerCells() {
    //ARROW: calcCells()
    const calcCells = (row, min) => {
      const
        xy = row ? `y` : `x`,
        minMax = min ? `Min` : `Max`,
        xyMinMax = `${xy}Cell${minMax}`
      return this.selection.filter(e => e[xy] === this[xyMinMax]).flat()
    }
    return memoize(() => {
      return new Sides([
        calcCells(true, true),
        calcCells(false, false),
        calcCells(true, false),
        calcCells(false, true),
      ])
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
    const
      a = this.spanCellVerts.start,
      b = this.spanCellVerts.end,
      e = this.grid.index(a.x, a.y),
      f = this.grid.index(b.x, b.y)
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

  get minCellThickness() { return min(this.minHorCellThickness, this.minVertCellThickness) }
  get maxCellThickness() { return max(this.maxHorCellThickness, this.maxVertCellThickness) }

  #checkCellThickness(minimum, hor) {
    const minMaxStart = hor ? this.columnCount : this.rowCount

    if (!this.isGroupBounds && !this.isIslandBounds) {          //TODO: check if this is needed, not sure what case this supports
      if (this.isFull) return minMaxStart
      else return
    }

    const colRows = hor ? this.boundCellRows : this.boundCellColumns

    //ARROW: checkSel() : BOOL : check if cell is within selection
    const checkSel = (cell) => this.selection.some(sel => sel.id === cell.id)

    let minMax = minimum ? minMaxStart : 0
    //ARROW: getMinMax() : get min or max of count and previous minMax
    const getMinMax = (count) => minimum ? min(count, minMax) : max(count, minMax)

    colRows.forEach(row => {
      let count = 0                                         // count of currently neighboring cells
      row.forEach(c => {
        if (checkSel(c)) count += 1                         // if cell is within selection, increment count
        else {                                              // if not, count ends
          if (count > 0) minMax = getMinMax(count)          // if count > 0, get minMax of count
          count = 0                                         // reset count
        }
      })
      if (!minimum || count > 0) minMax = getMinMax(count)  // if at end of row checks, max or count not reset, get minMax of count
    })
    return minMax
  }

  get anchor() { return Vertex.mult(this.cornerCellVerts.upLeft, this.cellSize) }
  get size() { return Vertex.mult(this.cellBoundsSize, this.cellSize) }
  get aspect() { return this.size.aspect }

  get boundsRect() {
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

  get bounds() {
    return this.corners.bounds
  }
  get cellPoints() {
    return memoize(() => {
      return this.selection
        .map(c => c.points).flat()
        .unique(`id`)
        .gridVertSorted
    }, `cellPoints`).call(this)
  }
  //#endregion
  // MARK: SelectionBounds Methods
  // #region Methods
  //METH: cellsToEdge()
  cellsToEdge({ fromCell, direction, selection = this.selection }) {
    // DeBug.warn(`cellsToEdge`)
    let
      travelled = 0,
      isAvailable = true,
      cells = new OpArray,
      next

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

  // #endregion
}

//MARK: CELLGROUP CLASS
// SIZE: 561 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class CellGroup extends ProtoLayer {
  maxCorners
  direction
  grid
  isBackGroup = false
  islandLevel
  cells = new OpArray
  perimeterIslands = new OpArray  // Island-Shapes defining outer boundaries of all Island shapes to be allowed within
  shapeGroups = new OpArray       // rendering layer storage
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

    this.finishSetup(S.CellGroups)
  }

  // MARK: CellGroup Computed Properties
  // #region Computed Properties
  get islands() { return this.perimeterIslands.map(pIsle => pIsle.allSubIslands).flat() }
  get perimeterShapes() { return this.perimeterIslands.map(i => i.shape) }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.id }) }
  get boundsRect() { return this.cellBounds.boundsRect }
  get padding() {
    const
      backGroupPadding = Vertex.mult(this.grid.insetAmount, 1.25),
      defaultPadding = vert(1)
    return this.isBackGroup ? backGroupPadding : defaultPadding
  }
  // #endregion
  // MARK: CellGroup Grid Properties
  // #region Grid Properties
  get validNeighbors() {
    return memoize(() => {
      return this.grid.validNeighbors({ selection: this.cells })
    }, `validNeighbors`).call(this)
  }

  get ordinalConnections() { return this.cells.filter(c => !c.ordinalOnlyNeighbors.isEmpty) }
  get hasOrdinalConnections() { return !this.ordinalConnections.isEmpty }

  get exposedSegments() {
    return this.grid.allExposedSides({ selection: this.cells, groupID: this.id })
  }
  get neighborIslands() {
    return this.perimeterIslands.map(i => i.neighborIslands).flat().exclude(this.perimeterIslands, `id`)
  }
  // #endregion
  // MARK: CellGroup Creation Methods
  // #region Setup Methods
  //METH: createPerimiters() : 
  createPerimiters(direction = Direction.Cardinal, maxCorners = true) {
    // DeBug.log(`createPerimiters this.id`, this.id)
    this.maxCorners = maxCorners
    this.direction = direction

    const groupID = this.id
    DeBug.warn(`createPerimiters for:`, groupID)
    DeBug.groupCollapsed(`grid.createIslands`)
    this.perimeterIslands = this.grid.createIslands({
      groupID: this.id,
      direction: direction,
      maxCorners: maxCorners,
    })
    // this.perimeterIslands.forEach(pIsle => pIsle.createSimpleSubShapes())
    this.islandLevel = 0
    DeBug.groupEnd()
    DeBug.log(``)
  }
  //METH: createSimpleSubShapes() : 
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
    angleOffset,
    amount = 1,
    insideCutStyle,         // TODO: implement irrational(squareRoot) & rational(harmonic) canonical series
    perimeter = false,    // setting for making channels/walls
    isFrame = false,
    addBacking = false,
    backingColor = frameColor,
    spanOp = 1 / 1,       // ratio of widths, start to end
    loftOp = 1 / 1,       // ratio of lofts, start to end
    selOps = []
  } = {}) {
    const cutObj = {
      profile: layerEnd ? profile?.breed || 'Flat' : 'Backing',
      amount: amount,
      layerStart: layerStart,
      layerEnd: layerEnd,
      dilationStart: dilationStart,
      dilationEnd: dilationEnd,
    }
    this.cuts.push(cutObj)

    const
      outset = this.grid.cellOutset,
      prmIsle = this.perimeterIslands.find(pi => pi.cells.includesMany(selection, 'id')),
      parentIsle = prmIsle?.subIslands?.findLast(si => si.cells.includesMany(selection, 'id')),
      prevCut = parentIsle?.cut

    DeBug.groupCollapsed(`${this.id}.cutIslands: ${profile?.description || `frameBase`}`)
    DeBug.warn(`cuts`, this.cuts)
    DeBug.warn(`perimeterIslands`, this.perimeterIslands)
    DeBug.warn(`prmIsle`, prmIsle)
    DeBug.warn(`parentIsle`, parentIsle)
    DeBug.warn(`prevCut`, prevCut)
    DeBug.log(`layer start/end`, layerStart, layerEnd)
    DeBug.log(`dilation start/end`, dilationStart, dilationEnd)

    if (layerStart < layerEnd || layerStart === undefined) {            // layerStart should be larger, outside fx radius
      [layerStart, layerEnd] = [layerEnd, layerStart]                   // swap if needed
    }
    DeBug.log(`layer swap start/end`, layerStart, layerEnd)

    if (!isFrame) {                                                     // CELLOUTSET 1
      DeBug.log(`isOutsetCut`, isOutsetCut)
      DeBug.log(`outset`, outset)
      DeBug.log(`layerEnd`, layerEnd)
      layerStart = isOutsetCut ? layerStart + outset : max(layerStart - outset, 0)
      if (layerEnd !== undefined) layerEnd = isOutsetCut ? layerEnd + outset : layerEnd - outset
    }
    DeBug.log(`outset start/end`, layerStart, layerEnd)

    if (addBacking) {                                                   // add flat fill layer below
      //TODO: incorporate backingColor, fix insetscale usage
      const
        insetScale = profile?.hasOutsetShade ? 1 : max(layerStart || 0, layerEnd || 0),
        newIslands = this.createSubIslands({ direction: direction, insetScale: insetScale })
      if (!newIslands.flat().isEmpty) this.islandsToShapeGroups(newIslands, undefined, direction)
    }

    DeBug.log(`useDilation elements:`, layerEnd, dilationStart, dilationEnd)
    let useDilation = layerEnd === undefined || !!dilationStart || !!dilationEnd //  4 cases => useDilation
    if (isFrame) useDilation = false
    DeBug.warn(`useDilation:`, useDilation)

    DeBug.log(`cutIslands perimeterShapes:`, this.perimeterShapes)
    // DeBug.log(`Cut direction:`, direction.name, direction.hierarchy)
    // DeBug.log(`Group direction:`, this.direction.name, this.direction.hierarchy)
    const cellRadius = this.grid.cellRadius

    //MARK: Create Shape Groups
    let shapeGroups = new OpArray

    //NOTE: create shapeGroups from common shape minRads
    this.perimeterShapes.forEach(sh => {
      DeBug.error(`current shape in queue`, sh)
      DeBug.log(`minOutsideCornerRadius`, sh.minOutsideCornerRadius)

      let minRad = sh.minOutsideCornerRadius
      if (amount > 1) {
        if (sh.isLeaf
          || sh.hasOffsetConnections
          || sh.isPizzaSlice
        ) { minRad = sh.minCornerRadius }
        if (!this.grid.cellAspect.isSquare && sh.minInsideCornerRadius < sh.minOutsideCornerRadius) minRad = sh.minInsideCornerRadius
      } else {
        if (sh.isPizzaSlice) minRad = sh.minCornerRadius
        if (sh.isTurnip) minRad = sh.maxCornerRadius
        if (profile?.hasInsetShade && sh.isLemon) minRad = sh.lemonLoftRadius
        if (sh.hasOffsetConnections) {
          const start = isOutsetCut ? layerStart - outset : layerStart + outset
          minRad = start * cellRadius
        }
      }

      if (sh.hasSingleWidth || sh.hasOrdinalConnections) {
        if (profile?.hasOutsetShade || (outset > 0.5 || amount > 1)) minRad = cellRadius
      }

      if (sh.hasInsideCorners) {
        if (profile?.hasOutsetShade) minRad = cellRadius
        const wallRad = sh.cellBounds.minCellThickness * cellRadius
        if (wallRad < minRad) minRad = wallRad
      }

      if (direction.hierarchy < 2) minRad = cellRadius
      if (minRad < cellRadius) minRad = cellRadius
      if (minRad <= 0) return

      minRad = roundToDec(minRad, 4)

      //NOTE: separate shapes by minRad and cardinal neighbors
      const neighbors = sh.neighborShapesCardinal
      DeBug.warn(`minRad`, minRad)
      DeBug.warn(`cellRadius`, cellRadius)
      DeBug.warn(`neighbors`, neighbors)
      let group = shapeGroups.find(g =>
        equalsRoundedDec(g.minRad, minRad, 1)
        && g.shapes.every(s => neighbors.every(n => n.id !== s.id))
        // && profile?.hasCastShadow ? true : g.shapes.every(s => neighbors.every(n => n.id !== s.id))
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

    if (loftScale < 1 / FRAME.pixToUserUnits) {                       // loftScale cant be less than 0
      DeBug.error(`cutIslands error: zero loft`)
      return                                                          // exit
    }
    if (loftScale > 1) loftScale = 1                                  // loftScale cant be greater than 1

    let extHighDepth = 1 - layerStart * .25
    DeBug.error(`initial extHighDepth`, extHighDepth)
    // shapeGroups = shapeGroups.slice(0, 1)
    //FIXME: FINAL ISSUE: layerStart/layerEnd need to be reset for every Cutting Loop 
    //MARK: ShapeGroups Loop
    shapeGroups.forEach(grp => {
      DeBug.log(``)
      DeBug.warn(`current shapegroup`, grp)
      DeBug.log(`minRad`, grp.minRad)
      DeBug.log(`cellRadius`, cellRadius)
      // DeBug.error(`layerEnd`, 1 - grp.minRad / cellRadius)
      let
        grpLayerStart = layerStart,
        grpLayerEnd = layerEnd,
        maxDilationAmount = -roundToDec(1 - (grp.minRad / cellRadius), 4),
        maxDilationRadius = grpLayerStart + maxDilationAmount

      DeBug.log(`current start/end`, layerStart, layerEnd)
      DeBug.log(`current grp start/end`, grpLayerStart, grpLayerEnd)
      DeBug.log(`maxDilationAmount`, maxDilationAmount)
      DeBug.log(`maxDilationRadius`, maxDilationRadius)
      // DeBug.log(`dilationRange`, dilationRange)

      let
        dilationAmount, dilationStartRadius, dilationEndRadius,
        cut, insetScale

      if (useDilation) {                                                // extend cutRad into shape based upon grp.minRad
        DeBug.error(`using Dilation!`)
        if (!dilationStart) dilationStart = 1                           // !dilationStart => dilationStart = 0
        if (!dilationEnd) dilationEnd = 0                               // !dilationEnd   => dilationEnd = 1
        dilationStartRadius = dilationStart * maxDilationAmount
        dilationEndRadius = dilationEnd * maxDilationAmount

        DeBug.log(`dilationStart`, dilationStart)
        DeBug.log(`dilationEnd`, dilationEnd)
        DeBug.log(`dilationStartRadius`, dilationStartRadius)
        DeBug.log(`dilationEndRadius`, dilationEndRadius)

        if (profile?.hasInsetShade) {
          DeBug.error(`this hasInsetShade`)
          grpLayerEnd = grpLayerStart - maxDilationRadius
        } else {                                                        // profile?.hasOutsetShade
          DeBug.error(`this hasOutsetShade`)

          maxDilationAmount = isOutsetCut ? maxDilationAmount + outset : maxDilationAmount - outset
          DeBug.log(`maxDilationAmount`, maxDilationAmount)

          if (amount > 1) {
            grpLayerEnd = grpLayerStart - maxDilationRadius
            grpLayerEnd = grpLayerEnd + maxDilationRadius / (amount)
          } else {
            grpLayerEnd = grpLayerStart - maxDilationRadius / (amount + 1)
            grpLayerEnd = grpLayerStart - maxDilationRadius / 2
          }

          DeBug.log(`grpLayerEnd`, grpLayerEnd)
          DeBug.log(`grpLayerStart`, grpLayerStart)
          // DeBug.log(`hasInsideCorners`, grp.shapes.some(sh => sh.hasInsideCorners))
          if (grp.shapes.some(sh => sh.hasInsideCorners) && 2 * grpLayerEnd < grpLayerStart) {
            DeBug.warn('reducing grpLayerEnd')
            grpLayerEnd = grpLayerStart / 2
          }
        }

        DeBug.log(`current grp start/end`, grpLayerStart, grpLayerEnd)
        DeBug.log(`current dil start/end`, dilationStart, dilationEnd)
        const dilationRange = range(grpLayerStart, grpLayerEnd)

        grpLayerStart = range(1, 0).convertRange(dilationStart, dilationRange)
        grpLayerEnd = range(1, 0).convertRange(dilationEnd, dilationRange)

        DeBug.log(`dilationRange`, dilationRange)
        DeBug.log(`newStart`, grpLayerStart)
        DeBug.log(`newEnd`, grpLayerEnd)

        //TODO: Integrate with InfraGrids once they are implemented, 
        // NOTE: ideally using range conversion for start/end: ie (1,0)->(2,0) for 2x2 island --> 1x1 infraGrid
        if (
          // this.perimeterIslands.last.direction.hierarchy > direction.hierarchy
          // &&
          grpLayerStart < 0) {                                          // remove layers that start below 0
          DeBug.warn(`grpLayerStart is less than zero!`)
          return
        }
      } else {
        DeBug.log(`not using Dilation`)
      }
      DeBug.log(`after dilation start/end`, grpLayerStart, grpLayerEnd)

      const isBackingFill = !profile

      if (isBackingFill) {
        const islands = grp.shapes.map(sh => sh.island)
        const newIslands = this.createSubIslands({
          islands: islands,
          selection: selection,
          direction: direction,
          insetScale: grpLayerStart,
        })
        if (!newIslands.flat().isEmpty) this.islandsToShapeGroups(newIslands, undefined, direction, isFrame)
        return
      }

      const
        bandLoft = grpLayerEnd !== undefined ? grpLayerStart - grpLayerEnd : grpLayerStart,
        effectiveAmount = min(amount, ProtoCut.maxCascadeSteps(bandLoft, this.grid.minCellWidth)),
        firstLayerEnd = grpLayerEnd,
        firstLayerRange = range(grpLayerStart, firstLayerEnd),
        firstStepWidth = firstLayerRange.size / effectiveAmount,
        subLayerRange = range(grpLayerStart, grpLayerEnd),
        subStepWidth = subLayerRange.size / effectiveAmount

      DeBug.log(`firstLayerRange`, firstLayerRange)
      DeBug.log(`subLayerRange`, subLayerRange)
      DeBug.error(`Inset Cuts amount`, amount, `effectiveAmount`, effectiveAmount)

      if (effectiveAmount < 1 || bandLoft <= 0) return

      //MARK: Cutting Loop
      let cutStart, cutEnd
      for (let i = 0; i < effectiveAmount; i++) {
        DeBug.warn(`cutting loop ${i + 1}`)
        DeBug.groupCollapsed(`cutting loop ${i + 1}`)
        const
          isLemonTop = i === effectiveAmount - 1 && grp.shapes.every(sh => sh.isLemon),
          layerRange = i === 0 ? firstLayerRange : subLayerRange,
          stepWidth = i === 0 ? firstStepWidth : subStepWidth
        let loft = i === 0 ? min(layerRange.size, stepWidth) : layerRange.size * loftScale / effectiveAmount

        DeBug.warn(`isLemonTop`, isLemonTop)
        DeBug.warn(`lemonLoftRadius`, grp.shapes[0].lemonLoftRadius)

        if (effectiveAmount > 1
          && i === effectiveAmount - 1
          && grp.shapes.every(sh => sh.isLemon)
        ) loft = (grp.shapes[0].lemonLoftRadius - (grp.minRad * (effectiveAmount - 1) / effectiveAmount)) / cellRadius

        DeBug.log(`loft`, loft)
        DeBug.log(`stepWidth`, stepWidth)

        if (loft === 0) continue

        cutStart = grpLayerStart - i * stepWidth
        cutEnd = cutStart - stepWidth
        DeBug.log(`cut start/end`, cutStart, cutEnd)

        const cutRange = range(cutStart, cutEnd)

        if (profile) insetScale = profile.hasInsetShade ? cutStart : cutEnd
        else insetScale = grpLayerStart
        // insetScale = grpLayerStart

        DeBug.log(`layerRange`, layerRange)
        DeBug.log(`cutRange`, cutRange)
        DeBug.log(`insetScale`, insetScale)

        if (profile && !isFrame) {
          if (i > 0) {
            switch (insideCutStyle) {
              case 'Waves':
                profile = profile.wave
                break
              case 'Cyma Recta':
                profile = profile.cyma
                break
            }
            // if (insetScale < 1.4) direction = Direction.None
            // if (insetScale < .8
            //   && roundToDec(grp.minRad) <= roundToDec(cellRadius)
            // ) {
            // direction = R.random_choice([Direction.Horizontal, Direction.Vertical])
            // loft = .125 * this.grid.minCellWidth / (amount + 1)
            // }
          }
        }

        extHighDepth = loft / 8
        DeBug.error(`final extHighDepth`, extHighDepth)

        const
          depth = ProtoCut.depthFromLoft(loft, this.grid.minCellWidth),
          extHighDepthUser = ProtoCut.depthFromLoft(extHighDepth, this.grid.minCellWidth),
          useExtHighDepth = !isFrame && ProtoCut.isAllowedDepth(extHighDepthUser)

        //MARK: Cut Assignment — sub-min depth still advances islands as flat backing (no ProtoCut)
        cut = undefined
        if (ProtoCut.isAllowedDepth(depth)) {
          cut = new ProtoCut({
            profile: profile,
            depth: depth,
            start: insetScale * 1,
            extHighDepth: extHighDepth * 1,
            useExtHighDepth: useExtHighDepth,
          })
        }

        DeBug.log(`loft`, loft)
        DeBug.log(`cut`, cut)
        DeBug.log(`cut filters`, cut?.filters)

        const islands = grp.shapes.map(sh => sh.island)

        DeBug.groupCollapsed(`createSubIslands`)
        DeBug.log(`direction`, direction.name)

        let newIslands = this.createSubIslands({
          cut: cut,
          islands: islands,
          selection: selection,
          direction: direction,
          insetScale: insetScale
        })

        DeBug.groupEnd()
        DeBug.groupCollapsed(`islandsToShapeGroups`)

        if (!newIslands.flat().isEmpty) {
          //NOTE: regroup islands if they are inside/redirected cuts that cast shadows to prevent shadow cropping bugs
          if (profile?.hasCastShadow
            && direction.hierarchy < 2
            && direction.hierarchy < this.direction.hierarchy
          ) {
            let
              islandGroups = new OpArray,
              count = 0
            DeBug.log(`newIslands`, newIslands)
            newIslands = newIslands.flat(this.islandLevel).compacted
            newIslands.forEach(isles => {
              DeBug.log(`isles`, isles)
              if (!Array.isArray(isles)) isles = [isles]
              // DeBug.log(`isles`, isles?.map(i => i.id))
              // DeBug.log(`isles`, isles?.map(i => i.cells.map(c => c.islandIDs)))
              // DeBug.log(`all islands`, this.grid.allIslands.map(i => i.id))

              isles.forEach(isle => {
                DeBug.log(`island`, isle)
                const neighborCells = this.grid.tempOutlineSelection(isle.cells, 1, Direction.Cardinal),
                  neighbors = isles.filter(i => i.cells.includesAny(neighborCells, `id`))

                // DeBug.log(`neighborCells`, neighborCells)
                DeBug.log(`neighbors`, neighbors.map(i => i.id))
                let group = islandGroups.find(g => g.isles.every(isle => neighbors.every(n => n.id !== isle.id)))

                if (!group) {
                  const id = count
                  count += 1
                  group = { id: id, isles: new OpArray, cells: neighborCells }
                  islandGroups.push(group)
                }
                group.isles.push(isle)
                group.cells.push(neighborCells)
                DeBug.log(`group`, group)
              })
            })
            DeBug.log(`islandGroups`, islandGroups)
            DeBug.log(`islandGroups`, islandGroups.map(g => g.isles.map(i => i.id)))
            islandGroups.forEach(group => {
              DeBug.log(`group`, group)
              const newIsles = group.isles.map(isle => isle.createSubIslands({
                cut: cut,
                selection: selection,
                direction: direction,
                insetScale: insetScale,
              }))
              this.islandsToShapeGroups(newIsles, cut, direction, isFrame)
            })
          }
          else this.islandsToShapeGroups(newIslands, cut, direction, isFrame)
        }
        DeBug.groupEnd()
        DeBug.log(``)
        DeBug.groupEnd()
      }
    })
    DeBug.groupEnd()
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
        // insetScale: insetScale || 1,
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
    })
    this.shapeGroups.push(shapeGroup)
    return shapeGroup
  }
  // #endregion

  drawElement() {
    super.drawElement()
    if (this.drawSVG) {
      this.svgElt
        .viewBox(this.anchor, this.size, this.padding)
        .layout(this.anchor, this.size, this.padding)
      // .attribute('overflow', 'visible')
    }
  }
}

//MARK: SHAPEGROUP CLASS
// SIZE: 304 lines
// NOTE: drawSVG = true
// NOTE: drawRect = false
class ShapeGroup extends ProtoLayer {
  cellGroup
  islands
  isFrame
  svgGroupElt
  maskGroupElt
  finalMaskElt
  finalMaskGroupElt
  finalMaskID

  paths = new OpArray
  masks = new OpArray
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
    })
    this.cut = cut
    this.cellGroup = cellGroup
    this.islands = islands
    this.grid = grid
    this.direction = direction
    this.islandLevel = islandLevel
    this.isFrame = isFrame

    this.finishSetup(S.ShapeGroups)
  }

  // MARK: ShapeGroup Computed Properties
  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.id }) }
  get boundsRect() {
    // if (this.isFrame || this.cut) return FRAME.boundsRect   // § 9.14.1 — broadened for cascade filter coverage
    if (this.isFrame)
      return FRAME.boundsRect  // frames should always use the full grid bounds to allow for filter bleed and prevent cropping bugs
    return this.cellBounds.boundsRect
  }
  get padding() {
    const
      backGroupPadding = Vertex.mult(this.grid.insetAmount, 1),
      defaultPadding = Vertex.mult(this.cut?.padding || backGroupPadding, 1)
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
    // this.createMaskGroup()
    // this.drawElement()
    this.showDeBug()
  }
  //METH: assignElement() override
  assignElement() {
    super.assignElement()
    if (this.cut) {
      this.svgElt.attribute('overflow', 'visible')   // § 9.14.1 — allow filter bleed beyond viewport
      // if (this.type === 'ShapeGroup-combo' && this.cut?.profile.isR) {
      //   this.svgElt
      //     .layout(FRAME.anchor, FRAME.size)
      //     .viewBox(FRAME.anchor, FRAME.size)
      // }
    }
    this.svgElt.parent(this.shadeElt)
  }
  //METH: createSVGGroup()
  createSVGGroup() {
    this.svgGroupElt = createElementNS(xmlns, 'g')
    const isleLvl = this.islandLevel.toString().padStart(2, '0')
    this.svgGroupElt
      .id(`${this.id}-${this.protoParent.id}-lvl${isleLvl}`)
      .parent(this.svgElt)
      .addToClassList(this.id)
      // .attribute('fill-rule', 'evenodd')
      .viewBox(this.anchor, this.size, this.padding)
      .layout(this.anchor, this.size, this.padding)
  }
  //METH: createBBoxKeeper()
  createBBoxKeeper() {
    this.bboxKeeperElt?.remove()
    const bboxPadding = Vertex.add(this.padding, vert(this.cut?.depth || 0))
    this.bboxKeeperElt = createSVGElt('rect')
      .id(`${this.id}-bboxKeeper`)
      .layout(this.anchor, this.size, bboxPadding)
      .attribute('fill', 'black')
      .attribute('fill-opacity', '0')
      .attribute('pointer-events', 'none')
      .parent(this.svgElt)
  }
  //METH: createMaskGroup()
  createMaskGroup() {
    if (this.type === 'ShapeGroup-combo'
      && this.cut?.profile.isR
      // && !this.cut?.profile.hasOutsetShade
      // && !this.grid.isBackGrid
    ) {                              // if this is an R cut, create a mask group

      this.shapes.forEach(s => {                              // find maskShapes in shapes
        const svg = s.maskSVG                                 // get maskSVG once (avoids double-computing maskShape)
        // const svg = if ()s.maskSVG
        if (svg) {
          const path = createSVGElt('path')                   // create a path for the maskShape
            .attribute(`d`, svg)
            .addToClassList(s.id)
            .id(`${s.id}-Mask-copy`)
          this.masks.push(path)                               // add maskShapes to masks array
        }
      })

      if (!this.masks.isEmpty) {                              // if there are masks, create a mask group
        const outsetShade = this.cut.profile.hasOutsetShade   //  outsetShade determines mask fill style

        this.maskGroupElt = createElementNS(xmlns, 'g')
          .id(`${this.id}-maskGroup`)
          .parent(this.svgGroupElt)
          .addToClassList(this.id)
        // .attribute('maskUnits', 'userSpaceOnUse')
        // .viewBox(this.anchor, this.size, this.padding)
        // .layout(this.anchor, this.size, this.padding)
        // .attribute('fill-rule', `evenodd`)
        // .attribute('overflow', 'visible')


        const
          maskRectFill = outsetShade ? 'black' : 'white',
          maskPathFill = outsetShade ? 'white' : 'black',
          maskBlur = this.cut.depth / 16,
          blurDivs = [
            // 4,
            // 8,
            // 16,
            32,
            64
          ]

        const maskRect = createSVGElt('rect')
          .id(`${this.id}-maskRect`)

          // .viewBox(this.anchor, this.size, this.padding)
          // .layout(this.anchor, this.size, this.padding)
          .layout(FRAME.anchor, FRAME.size)
          .attribute('fill', maskRectFill)
          .parent(this.maskGroupElt)
        // .attribute('maskUnits', 'userSpaceOnUse')

        //------------------------------------------------------------  
        this.maskGroupElt.attribute('fill-rule', `evenodd`)

        this.masks.forEach(m => {
          m
            .attribute('fill', maskPathFill)
            .attribute('stroke', 'none')
            .attribute('fill-rule', `evenodd`)
            .parent(this.maskGroupElt)

          const createBlurMask = (div) => {           // create additional blurred masks for deeper cuts
            const
              blurred = m.elt.cloneNode(true),
              blurredP5 = addElement(blurred, window)
            blurred.setAttribute('id', `${m.elt.id}-blur-${div}`)
            blurredP5
              .parent(this.maskGroupElt)
              .blur(this.cut.depth / div)
          }
          // blurDivs.forEach(d => { if (this.cut.depth > d) createBlurMask(d) }) // create additional masks as needed
        })

        this.maskGroupElt.blur(maskBlur)

        let defs = createSVGElt(`defs`)
          // .parent(this.svgElt)
          .parent(this.svgGroupElt)

        const
          maskID = `${this.id}-mask`,
          mask = createSVGElt(`mask`)
            .id(maskID)
            .attribute('mask-type', 'luminance')
            .attribute('maskUnits', 'userSpaceOnUse')
            // .layout(this.anchor, this.size, this.padding)
            .layout(FRAME.anchor, FRAME.size)
            // .layout(-50, -50, 200, 300)
            // .layout(0, 0, 100, 200)
            .parent(defs)

        this.finalMaskID = maskID
        this.finalMaskElt = mask
        this.finalMaskGroupElt = this.maskGroupElt

        // this.maskGroupElt.parent(this.svgGroupElt)   // append the maskGroupElt to the groupElt
        this.maskGroupElt.parent(mask.elt)   // append the maskGroupElt to the groupElt

        if (outsetShade && this.grid?.isBackGrid) this.createBBoxKeeper()

        this.svgElt
          .attribute(`mask`, `url(#${maskID})`) // set the mask attribute on the svgElt
          .addToClassList(`masked`)
        // .attribute('maskUnits', 'userSpaceOnUse')
      }
    }
  }
  //METH: assignShapes()
  assignShapes() {
    let
      sameForms = new OpArray,
      combined

    this.shapes.forEach(s => {
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
      // .viewBox(vert(), vert(100, 200))
      // .layout(vert(), vert(100, 200))
    } else {
      this.svgElt
      // .attribute('overflow', 'visible')
      // .viewBox(this.insetAnchor, this.insetSize, this.padding)
      // .layout(this.insetAnchor, this.insetSize, this.padding)
      // .viewBox(this.anchor, this.size, this.padding)
      // .layout(this.anchor, this.size, this.padding)
      // DeBug.log(`drawElement() layout vals`, this.anchor.string, this.size.string, this.padding.string)
    }

    this.svgGroupElt
      .attribute(`fill`, frameColor)
      .applyFilter(this.filter)
    this.createMaskGroup()                       // § 9.13.7 Step 2: re-enabled
  }
}

//MARK: CELL CLASS
// SIZE: 207 lines
// NOTE: drawSVG = false
// NOTE: drawRect = false
class Cell extends ProtoLayer {
  grid
  index
  coords
  isAvailable
  groupID = -1
  islandIDs = new Set()
  islandChecked = false
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

    this.finishSetup(S.Cells)
  }

  // MARK: Cell Computed Properties
  // #region Computed Properties
  get anchor() {
    return memoize(() => {
      return this.grid.cellAnchor(this.coords.x, this.coords.y)
    }, `anchor`).call(this)
  }
  get size() {
    return memoize(() => {
      return this.grid.cellSize
    }, `size`).call(this)
  }
  get aspect() {
    return memoize(() => {
      return this.size.aspect
    }, `aspect`).call(this)
  }
  get minRadius() {
    return memoize(() => {
      return this.grid.cellRadius
    }, `minRadius`).call(this)
  }

  get arcOrigins() { // origins for arcs when rect is given max rounded corners, cell center for square cells, two points for rects
    let start, end
    if (this.aspect.isSquare) {
      start = this.center
      end = this.center
    }
    if (this.aspect.isPortrait) {
      const
        x = this.center.x,
        yStart = this.anchor.y + this.minRadius,
        yEnd = this.anchor.y + this.size.y - this.minRadius
      start = vert(x, yStart)
      end = vert(x, yEnd)
    }
    if (this.aspect.isLandscape) {
      const
        y = this.center.y,
        xStart = this.anchor.x + this.minRadius,
        xEnd = this.anchor.x + this.size.x - this.minRadius
      start = vert(xStart, y)
      end = vert(xEnd, y)
    }
    return { start: start, end: end }
  }

  get x() { return this.coords.x }
  get y() { return this.coords.y }
  get isTaken() { return !this.isAvailable }

  get cardinalNeighborCoords() { return this.allNeighborsCoords(Direction.Cardinal) }
  get ordinalNeighborCoords() { return this.allNeighborsCoords(Direction.Ordinal) }

  get sideNeighbors() { return new Sides(this.cardinalNeighborCoords.map(co => this.grid.cellAtCoords(co.x, co.y))) }
  get cornerNeighbors() { return new Corners(this.ordinalNeighborCoords.map(co => this.grid.cellAtCoords(co.x, co.y))) }

  get neighbors() {
    return memoize(() => {
      return this.validNeighbors()
    }, `neighbors`).call(this)
  }
  get cardinalNeighbors() {
    return memoize(() => {
      return this.validNeighbors(Direction.Cardinal)
    }, `cardinalNeighbors`).call(this)
  }
  get ordinalNeighbors() {
    return memoize(() => {
      return this.validNeighbors(Direction.Ordinal)
    }, `ordinalNeighbors`).call(this)
  }

  get hasOppositeNeighborsTaken() {
    const n = this.sideNeighbors
    return (n.horizontals.every(c => c?.isTaken) || n.verticals.every(c => c?.isTaken))
  }

  get cardinalGroupNeighbors() { return this.cardinalNeighbors.filter(c => c?.groupID === this.groupID) }

  get groupNeighborsDirection() {
    const vals = this.validNeighborsDirections(Direction.All)
      .filter(dir => this.grid.neighbor(this.index, dir).groupID === this.groupID)
      .map(dir => dir.vals)
      .flat(2).unique().numSorted
    return new Direction(vals)
  }

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
      const
        dir = thisCell.grid.directionToNeighbor(this, neighbor),
        adjDirs = dir?.adjacents,
        adjNeighbors = thisCell.validNeighbors(adjDirs)
      return adjNeighbors.every(n => thisCell.groupID !== n.groupID)
    }

    let ordinals = this.ordinalNeighbors
    ordinals = ordinals.filter(c =>
      c.groupID === this.groupID
      && isOnlyOrdinalTo(this, c)
    )
    return ordinals
  }

  get needsMask() {
    return memoize(() => {
      // DeBug.log(`cell.needsMask`, this.id)
      const dir = this.groupNeighborsDirection
      if (!this.aspect.isSquare) return dir.needsMask || dir.cardinalsDirection.hasTwoPerpindiculars  // if not square, check if there are two perpendiculars in cardinal directions
      return dir.needsMask
    }, `needsMask`).call(this)
  }
  get canInset() {
    return memoize(() => {
      // DeBug.log(`cell.canInset`, this.id)
      // DeBug.groupCollapsed(`cell.canInset`, this.id)
      const result = this.groupNeighborsDirection.canInset
      DeBug.groupEnd()
      return result
    }, `canInset`).call(this)
  }

  // #endregion
  // MARK: Cell Geometry Methods
  // #region Geometry Methods
  //METH: neighborCoords()
  neighborCoords(direction) { return Vertex.add(this.coords, direction.moveCoord) }
  //METH: allNeighborsCoords()
  allNeighborsCoords(direction = Direction.All) { return direction.directions.map(dir => this.neighborCoords(dir)).compacted }
  //METH: validNeighborsCoords()
  //FIXME: check to see if this method is being used. Seems like no, because bounds was not properly assigned before!
  validNeighborsCoords(direction = Direction.All, bounds = this.grid.gridCellBounds,) {
    // DeBug.log(`cell.validNeighborsCoords direction`, direction.vals)
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
      .filter(val => selection.some(sel => val.id === sel.id))
      .map(v => Direction.fromMoveCoord(Vertex.sub(v.coords, this.coords)))
  }
  // #endregion
  // MARK: Cell Setup Methods
  //METH:
  drawElement() {
    super.drawElement()
    if (this.drawRect) {
      this.rect
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', `${this.minRadius / 1}`)
        .attribute('ry', `${this.minRadius / 1}`)
        .attribute('fill', protoColor(0, 64))
      // .attribute('fill-opacity', '0')
    }
  }
}

//MARK: ISLAND CLASS
// SIZE: 560 lines
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
    cut,
    protoParent,
    svgParent,
    grid,
    groupID,
    parentIslandID,
    direction = Direction.Cardinal,
    maxCorners = true,
    stored = true,
    insetScale = 1,
    allowsProtoErrors = false,
  } = {}) {
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      type: parentIslandID ? 'Island' : 'PerimeterIsland',
      insetScale: insetScale,
      drawSVG: false,
      drawRect: false,
      allowsProtoErrors: allowsProtoErrors,
    })

    DeBug.log(`New Island! with arguments:`, arguments[0])
    this.cells = cells
    this.cut = cut
    this.grid = grid
    this.groupID = groupID
    this.direction = direction
    this.maxCorners = maxCorners
    this.parentIslandID = parentIslandID
    this.islandLevel = parentIslandID ? protoParent.islandLevel + 1 : 0 // perimeterIslands should be 0, the rest above

    if (stored) { this.finishSetup(S.Islands) }
    // DeBug.log(`new (${this.type})-type Island completed:`, this)
    // DeBug.log(``)
  }

  // MARK: Island Computed Properties
  // #region Computed Properties
  get allSubIslands() {
    //FIXME: using resetMemoized() when islands are added, memoize should be reinstated here
    // return memoize(() => {
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
    // }, `allSubIslands`).call(this)
  }

  get cellBounds() { return this.grid.cellBounds({ selection: this.cells, groupID: this.groupID, islandID: this.id }) }
  get cellAnchor() { return this.cellBounds.cellAnchor }
  // get insetAnchor() { return this.anchor }
  // get insetSize() { return this.size }

  get boundsRect() { return this.cellBounds.boundsRect }

  get cellCount() { return this.cells.length }

  get ordinalConnections() { return this.cells.filter(c => !c.ordinalOnlyNeighbors.isEmpty) }
  get hasOrdinalConnections() { return !this.ordinalConnections.isEmpty }

  get isSingleCell() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index, Direction.All))
  }
  get isCardinalSingle() {
    return this.cellCount === 1 && this.cells.every(e => this.cellIsIsolated(e.index))
  }

  get isHorizontal() {
    return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Vertical))
  }
  get isVertical() {
    return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Horizontal))
  }
  get isLine() { return this.isSingleCell || this.isHorizontal || this.isVertical }

  get isCardinal() {
    return !this.isSingleCell
      // && this.cells.every(e => this.cellIsIsolated(e.index, Direction.Ordinal))
      && this.cells.every(c => c.groupNeighborsDirection.allAreCardinal)
  }
  get isOrdinal() { return !this.isSingleCell && this.cells.every(e => this.cellIsIsolated(e.index)) }

  get isRectangle() { return !this.isLine && this.cellBounds.isFull }
  get isSquare() { return this.isRectangle && this.cellBounds.aspect.isSquare }

  get offsetConnectionCells() { return this.cells.filter(c => c.hasOffsetConnection) }
  get hasOffsetConnections() { return !this.offsetConnectionCells.isEmpty }             // squares connected with a common row/column, bad stair creation

  get directionHierarchy() { return this.direction.hierarchy }

  get needsMask() {
    if (this.isLine || this.isRectangle) return false                                   // lines and rectangles do not need masks
    return this.cells.some(c => c.needsMask)                                            // if any cell needs a mask, the island needs a mask
  }
  get canInset() {
    return this.cells.some(c => c.canInset)
  }

  get exposedSegments() {
    return memoize(() => {
      return this.grid.allExposedSides({ selection: this.cells, islandID: this.id })
    }, `exposedSegments`).call(this)
  }

  get neighborIslands() {
    return memoize(() => {
      return this.findNeighborIslands(Direction.All)
    }, `neighborIslands`).call(this)
  }
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
  } = {}) {
    if (!this.maxCorners || this.directionHierarchy < 2) return this.cells
    if (shape.simpleSubShapes.isEmpty) {
      DeBug.error(`cannot recalcdCells because shape has no simpleSubShapes`)
      return this.cells
    }
    DeBug.groupCollapsed(`recalcdCells shape`, shape)
    const cellRadius = this.grid.cellRadius

    let shapeCorners = shape.insetSubShapes.map(sub => {
      DeBug.log(`sub`, sub)
      return sub
      // .filter(seg =>                                  // filter corners with minimum curvature
      //   roundToDec(seg.startNeighbor.availableEndLength, 1) > roundToDec(cellRadius, 1)
      //   || roundToDec(seg.availableStartLength, 1) > roundToDec(cellRadius, 1)
      // )
    }).flat(1)

    DeBug.log(`shapeCorners`, shapeCorners)

    if (shapeCorners.isEmpty) {
      DeBug.error(`recalcdCells: Cells remain the same!`)
      DeBug.groupEnd()
      return this.cells
    } else {
      let
        removeCells = new OpArray,                      // cells to remove
        addCells = new OpArray                          // cells to add
      shapeCorners.forEach(seg => {
        //FIXME: it appears that arcRadius is not correct
        //NOTE: arcRadius: only correct if corner is circular arc and cell aspect is square
        //FIXME: try to fix bug when trying to create hierarchy 0/1 subIslands on non-square celled grids 
        //FIXME: issue may be in usage of cell.center as this assumes cells to be square

        const
          isOutsideCorner = seg.turns.start.isRight,    // isOutsideCorner (opposite for inside shapes)
          cornerPos = seg.corners.start,                // position of normalCorner
          neighbor = seg.startNeighbor,
          arcRadius = min(seg.availableStartLength, neighbor.availableEndLength),
          startCorner = neighbor.finalCubicEndVert,     // startCorner of arc
          normalCorner = seg.start,                     // normal pointer of arc
          endCorner = seg.finalCubicStartVert,          // endCorner of arc
          origin = Vertex.add(startCorner, segment(normalCorner, endCorner).lineVector),  // origin of arc
          squareVerts = OpArray.from([startCorner, normalCorner, endCorner, origin]).gridVertSorted

        DeBug.log(`squareVerts`, squareVerts)
        //ARROW: cellOrigin()
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

        let cornerCells = this.cells.filter(cell => {// find cells within arc square
          const origin = cell.center
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
  createSubIslands({ cut, selection, direction = Direction.Cardinal, insetScale = 1 } = {}) {
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
        })
      )
    }
    DeBug.warn(`createSubIslands direction`, direction.name)
    let subIslands

    //NOTE: Create InterGrid
    // if (insetScale <= 0) {
    // const
    //   bounds = this.grid.cellBounds({ selection: this.cells, islandID: this.id }),
    //   gridSize = bounds.cellBoundsSize,
    //   startCoord = bounds.cornerCellVerts.upLeft

    // let interGrid = new Grid({
    //   protoParent: this,
    //   gridSize: gridSize,
    //   startCoord: startCoord,
    //   isInterGrid: true,
    // })
    // }

    //ARROW: copyIsland()
    const copyIsland = () => {
      DeBug.log(`copying island ${this.id}`)
      // copy this island but change inset, set filter
      const subIsland = this.copy({ insetScale: insetScale, cut: cut })
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
        cut: cut,
      })
      newIsles?.forEach(i => {
        i.createSimpleSubShapes()            // must create SimpleSubShapes for new Islands
        DeBug.warn(`newIslands simples`, i.shape.simpleSubShapes)
        const simples = i.shape.allSimpleSegs
        DeBug.log(`simples`, simples)
        this.grid.completeEnds(simples, false)
      })
      return newIsles
    }

    //NOTE: Change new direction
    // protect Island stacking from visual overlapping errors
    if (direction.hierarchy > this.directionHierarchy) { // new direction cannot be greater than current
      DeBug.error(`trying to create SubIslands out of hierarchy. changing direction to "${this.direction.name}"`)
      direction = this.direction // downgrade newDirection to same as current Island
    }
    // ordinal corner connecters visually collapse with inset < 0.75 (I think sqrt(2)/2 = 0.707 is actually the limit)
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
      if (direction.equals(this.direction)) copyIsland()

      // different direction: requires new island and/or shape creation
      if (direction.hierarchy < this.directionHierarchy) {
        DeBug.warn(`creating ${this.id} subIslands with direction: ${direction.name}`)
        // parent direction is All and new direction is Cardinal: careful reconstruction of current SimpleSubShapes
        if (this.direction.isAll && direction.isCardinal) { //
          if (!this.ordinalConnections.isEmpty) {
            DeBug.log(`using copyAllToCardinal()`)
            subIslands = this.copyAllToCardinal(insetScale, cut)
            DeBug.log(`copyAllToCardinal() subIslands:`, subIslands)
          }
          else copyIsland()
        }
        // parent direction is All/Cardinal: recalculate island cells based on parent shape, then create new islands
        else if (this.directionHierarchy >= 2 && direction.hierarchy < 2) {
          DeBug.log(`  triggering a recalcdCells on ${this.id}`)
          const newCells = this.recalcdCells({ newInsetScale: insetScale, loft: cut?.depth || 0 })
          subIslands = newIslands(newCells)
        }
      }
    }
    this.subIslands = subIslands

    DeBug.log(`new subIslands: `, subIslands)
    DeBug.groupEnd()

    return subIslands
  }
  //METH: copy() : create a copy of this Island
  copy({
    insetScale,
    protoParent = this, // do I need this or will all 'copies' produced by this island be children of this island?
    cells = this.cells,
    shape,
    direction = this.direction,
    cut = this.cut,
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
      cut: cut,
    })

    if (shape) newIsland.shape = shape
    else newIsland.shape = this.shape.copy({
      insetScale: insetScale,
      protoParent: newIsland,
      island: newIsland,
    })

    this.grid.updateCells({ island: newIsland })
    // DeBug.log(`newIsland`, newIsland)
    return newIsland
  }
  //METH: copyAllToCardinal() :
  copyAllToCardinal(insetScale, cut = this.cut) {
    DeBug.log(`copyAllToCardinal`)
    DeBug.log(`insetScale`, insetScale)
    const
      dir = Direction.Cardinal,
      cellIslands = this.grid.createIslands({
        insetScale: insetScale,
        selection: this.cells,
        islandID: this.id,
        direction: dir,
        cut: cut,
      })

    DeBug.log(`cellIslands`, cellIslands.map(is => is.cells.map(c => c.id)))

    //NOTE: just added this for testing. Should try dropping in newSubShapes from above?
    const parentSimpleSubShapes = this.shape.simpleSubShapes
    cellIslands?.forEach((isle, i) => {
      const shape = isle.shape
      isle.createSimpleSubShapes()
      DeBug.log(`isle`, isle)
      DeBug.log(`shape`, shape)
      const simpleSubShapes = isle.shape.simpleSubShapes
      this.grid.inWrapPerimeter(simpleSubShapes.flat(), parentSimpleSubShapes.flat()) // wrap inner perimeter to match outer parent segements

      DeBug.log(`this group`, this.grid.groupNamed(this.groupID))
      DeBug.log(`shape`, shape)
      // DeBug.log(`shape.svg`, shape.svg)
    })
    return cellIslands
  }
  //METH: createShape() :
  createShape(insetScale) {
    let
      segments = OpArray.format(this.exposedSegments),
      subShapes = new OpArray,
      shapeIter = 0,
      subShapeIter = 0

    DeBug.log(`createShape for ${this.id}, insetScale`, insetScale)
    DeBug.log(`createShape`, this)
    DeBug.log(`segments`, segments)

    //ARROW: findShape(seg) : find each shape within an island
    const findShape = () => {
      let subShape
      while (segments.length > 0) {
        shapeIter += 1
        let
          segment = segments[0],
          fillstack = []
        subShape = new OpArray

        //ARROW: findSubShape(seg) : find each subShape within a shape
        const findSubShape = (seg) => {
          fillstack.push(seg)

          while (fillstack.length > 0) {
            subShapeIter += 1
            //find next segments (could be 2 if allowing ordinal island connections)
            let
              thisSeg = fillstack.pop(), nextSeg,
              next = segments
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

              if (this.direction.someAreOrdinal) nextDirection = thisSeg.direction.previous(2)
              else nextDirection = thisSeg.direction.next(2)

              nextSeg = next.find(e => e.direction.equals(nextDirection))
              // DeBug.log(`thisSeg here`, thisSeg)
              // DeBug.log(`nextSeg here`, nextSeg)
              if (!nextSeg) DeBug.error('unexpected 2nd segment')
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
        if (subShapes.length === 1) {                 // re-sort inner subshapes for counter-clockwise processing
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
  }
  //METH: createSimpleSubShapes() : direct all shape to createSimpleSubShapes 
  createSimpleSubShapes() {
    DeBug.group(`${this.id}.createSimpleSubShapes called!!!`)
    this.shape.createSimpleSubShapes()
    DeBug.groupEnd()
  }
  // #endregion
}

//MARK: SHAPE CLASS
// SIZE: 349 lines
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
    insetScale,
    type
  } = {}) {
    const shptype = type ? type : (protoParent.type === `Island` ? 'Shape' : `PerimeterShape`)
    super({
      protoParent: protoParent,
      svgParent: svgParent,
      type: shptype,
      insetScale: insetScale,
      drawSVG: false,
      drawRect: false,
    })

    this.maxCorners = maxCorners
    this.subShapes = subShapes ? subShapes : new OpArray
    this.simpleSubShapes = simpleSubShapes ? simpleSubShapes : new OpArray
    this.island = island
    this.testColor = `${R.random_hash(3, '#')}8`
    this.assignSegments()

    // if (shptype === `PerimeterShape`) this.createSimpleSubShapes() // REMOVED: broke intershapes — see KNOWN-ISSUES § 9.11

    this.finishSetup(S.Shapes)
  }

  // MARK: Shape Computed Properties
  get cellRadius() { return this.grid.cellRadius }
  get cellBounds() { return this.island.cellBounds }
  get boundsRect() { return this.cellBounds.boundsRect }
  // get insetAnchor() { return this.anchor }
  get padding() { return vert(this.cellRadius) }

  get grid() { return this.island.grid }

  get cut() { return this.island.cut }
  get simpleSegPaths() { return this.simpleSubShapes.map(sub => new SegPath(sub, this)) }
  get simpleInsetSegPaths() { return this.insetSubShapes.map(sub => new SegPath(sub, this)) }
  get cells() { return this.island.cells }

  get cutOutCells() {
    return memoize(() => {
      if (!this.isSingleShape) { return this.simpleSegPaths.slice(1).map(sp => sp.cells).flat() }
    }, `cutOutCells`).call(this)
  }
  get enclosedCells() {
    return memoize(() => {
      return this.isSingleShape ? this.cells : this.cells.union(this.cutOutCells, `id`).gridVertSorted
    }, `enclosedCells`).call(this)
  }
  get cutOutSegs() {
    return memoize(() => {
      if (!this.isSingleShape) { return this.simpleSubShapes.slice(1).flat() }
    }, `cutOutSegs`).call(this)
  }

  get neighborShapes() {
    return memoize(() => {
      return this.island.neighborIslands.map(i => i.shape)
    }, `neighborShapes`).call(this)
  }
  get neighborShapesCardinal() {
    return memoize(() => {
      return this.island.neighborIslandsCardinal.map(i => i.shape)
    }, `neighborShapesCardinal`).call(this)
  }
  get neighborSimples() {
    return memoize(() => {
      return this.neighborShapes.map(s => s.simpleSubShapes).flat()
    }, `neighborSimples`).call(this)
  }
  get andNeighborSimples() {
    return memoize(() => {
      return this.simpleSubShapes.flat().union(this.neighborSimples.flat(), ['id'])
    }, `andNeighborSimples`).call(this)
  }

  get isSingleShape() { return this.simpleSubShapes.length === 1 }

  get isQuad() { return this.island.isRectangle }
  get isSquare() { return this.island.isSquare }
  get isRoundedSquare() {
    if (!this.isSquare) { return false }
    return this.allCornerRadii.every(r => roundToDec(r, 1) === roundToDec(this.allCornerRadii[0], 1))
  }
  get isMaxEqualRadiusQuad() {
    if (!this.isQuad) { return false }
    return this.allCornerRadii.every(r => equalsRoundedDec(r, this.maxCornerRadius, 1))
  }

  get isCircle() {
    return this.isRoundedSquare
      && equalsRoundedDec(this.minCornerRadius, this.insetSize.x / 2)
  }
  get isLeaf() {                                          // leaf is rect based shape with equal radii on diagonal corners, if square then it's also a lemon
    const rads = this.allCornerRadii
    return this.island.isRectangle
      && !this.isCircle
      && (equalsRoundedDec(rads[0], rads[2], 1) && equalsRoundedDec(rads[1], rads[3], 1))
      && (!equalsRoundedDec(rads[0], rads[1], 1) || !equalsRoundedDec(rads[2], rads[3], 1))
  }
  get isLemon() { return this.isLeaf && this.isSquare }   // lemon is shape like a football or vesica piscis (3 small equal radii + 1 larger radius)
  get isTurnip() {                                        // turnip is shape 
    return this.isSquare
      && this.allCornerRadii.filter(r => equalsRoundedDec(r, this.maxCornerRadius)).length === 3
  }
  get isPizzaSlice() {                                    // pizza slice is shape with 3 small equal corner radii and 1 larger radius
    return this.isSquare
      && this.allCornerRadii.filter(r => equalsRoundedDec(r, this.minCornerRadius)).length === 3
  }

  get allSegments() { return this.subShapes.flat() }
  get allSimpleSegs() { return this.simpleSubShapes.flat() }
  get allInsideCorners() { return this.allSimpleSegs.filter(s => !s.isOutsideCorner) }
  get allOutsideCorners() { return this.allSimpleSegs.filter(s => s.isOutsideCorner) }
  get allCornerRadii() { return this.allSimpleSegs.map(s => s.arcRadius) }

  get hasSingleWidth() { return this.cells.some(c => c.hasOppositeCardinalGroupNeighbors) }
  get hasOrdinalConnections() { return this.island.hasOrdinalConnections }
  get hasOffsetConnections() { return this.island.hasOffsetConnections }
  get hasInsideCorners() { return this.allInsideCorners.length > 0 }

  get hasBulges() {
    if (!this.cut?.profile?.isR) return false                                       // bulges only happen with R profiles
    let minCellThickness
    const
      aspect = this.grid.cellAspect,                                                // cell aspect
      bounds = this.cellBounds                                                      // cell bounds

    if (aspect.isSquare) {
      minCellThickness = bounds.minCellThickness                                    // square cells: use min cell thickness
    } else {                                                                        // non-square cells: mult smaller side thickness by ratio
      const
        hor = bounds.minHorCellThickness,                                           // (fixes #1370 edge case)
        vert = bounds.minVertCellThickness
      minCellThickness = aspect.isPortrait ? min(hor, vert * aspect.ratio) : min(hor * aspect.ratio, vert)
    }
    const
      minWallRad = roundToDec(minCellThickness * this.cellRadius),
      minOuterRad = roundToDec(this.minOutsideCornerRadius),
      larger = minWallRad < minOuterRad,
      ordinal = this.island.isOrdinal,
      thinWall = minWallRad < productionLimits.minCutDepth
    return larger || ordinal || thinWall
  }

  get minCornerRadius() { return min(this.allCornerRadii) }
  get maxCornerRadius() { return max(this.allCornerRadii) }
  get minInsideCornerRadius() {
    const corners = this.allInsideCorners
    if (corners.isEmpty) return
    if (this.isSingleShape) return min(corners.map(s => s.arcRadius))
  }
  get minOutsideCornerRadius() {
    if (this.isLemon) return this.lemonLoftRadius
    if (this.isSingleShape) return min(this.allOutsideCorners.map(s => s.arcRadius))
    else {
      const grid = this.grid,
        cellSize = grid.cellSize,
        minHorThick = this.cellBounds.minHorCellThickness,
        minVertThick = this.cellBounds.minVertCellThickness,
        horRadius = minHorThick * cellSize.x / 2,
        vertRadius = minVertThick * cellSize.y / 2

      DeBug.log(`minHorThick`, minHorThick)
      DeBug.log(`minVertThick`, minVertThick)
      DeBug.log(`horRadius`, horRadius)
      DeBug.log(`vertRadius`, vertRadius)
      return min([horRadius, vertRadius, ...this.allOutsideCorners.map(s => s.arcRadius)])
    }
  }
  get lemonLoftRadius() {
    if (this.isLemon) {
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
  get insetSubShapes() {
    if (this.insetScale <= 0) {
      // TODO: future use with interGrids
    }
    return this.simpleSegPaths?.map(sub => sub.insetPath(this.insetScale))
  }

  get cutDepthScale() {
    const profile = this.cut?.profile
    if (profile?.isR || profile?.isJ) {
      return vert(this.cut.depth / this.cellRadius / 2) // convert cut depth to cell scale
    }
  }

  get maskShape() {
    const
      profile = this.cut?.profile,
      outsetShade = profile.hasOutsetShade                                          // hasOutsetShade
    if (!profile?.isR) return                                                       // maskShape is only for R profiles
    if (
      this.grid.isFrontGrid                                                       // backGrids always have maskShapes
      &&
      !outsetShade                                                               // for insetShades, no maskShapes for: 
      // && this.hasBulges
      && (this.isMaxEqualRadiusQuad                                                 // quads with max equal radius (circles, pills)  
        || this.isTurnip || this.isLemon                                            // turnips and lemons             
        || this.hasBulges                                                           // has bulges
      )
    ) return

    const
      depthScale = this.cutDepthScale,                                              // cut depthScale
      scale = outsetShade ?
        // this.insetScale
        Vertex.add(this.insetScale, depthScale.mult(.8))
        // Vertex.add(this.insetScale, depthScale)                                     // outsetShade scale is insetScale + depthScale
        : Vertex.sub(this.insetScale, depthScale),                                  // insetShade scale is insetScale - depthScale
      // : this.insetScale,                                                          // insetShade scale is insetScale - depthScale
      hasOrds = this.island.hasOrdinalConnections
        && this.island.direction.isAll
        && !outsetShade,                                                           // maskShapes only for shapes with ordinal connections and outsetShade (for insetShades, maskShapes create weird overlaps and aren't as necessary since the shade is inset) 
      shapes = hasOrds ?
        this.island.copyAllToCardinal(this.insetScale, this.cut)   // get cardinal islands
          .map(isle => isle.shape)                                                  // map to shapes
        : [this]                                                                    // otherwise just use this shape        

    const paths = shapes.map(shape => {                                             // map shapes to inset paths
      return shape.simpleSegPaths?.map((path, i) => {
        // const inset = outsetShade ? path.insetPath(depthScale.div(2).add(scale))       // outsetShade paths used with stroking
        //   : path.insetPath(scale)                                                     // insetShade paths used as-is with fill
        const inset = path.insetPath(scale)
        return new SegPath(inset, shape)                                               // wrap each inset path as a SegPath
      })
    }).flat()                                                                       // flatten to array of SegPaths
      .filter(sp => !(sp.path.length === 4 && sp.path.every(seg => equalsRoundedDec(seg.length, 0, 3)))) // filter out quads with 0 length segments

    DeBug.log(`maskShape paths`, paths)
    if (!paths.isEmpty)
      return paths                                                                  // return array of SegPaths
    // return paths
  }

  //MARK: SVG Paths
  get svg() {
    const paths = this.simpleInsetSegPaths
    if (paths?.length) return SVGPath.fromSegPaths(paths)
  }
  get maskSVG() { if (this.maskShape) { return SVGPath.fromSegPaths(this.maskShape) } }  // maskShape returns array of SegPaths

  // MARK: methods
  // #region methods
  //METH: isCongruent() : Bool : Congruence = same shape, same scale, same rotation, different position. Used for determining svg instancing
  isCongruent(otherShape) {
    const length = this.simpleSegPaths.length
    if (length !== otherShape.simpleSegPaths.length) return false

    for (let i = 0; i < length; i++) {
      const a = this.simpleSegPaths[i], b = otherPath.simpleSegPaths[i]
      if (!a.isCongruent(b)) return false
    }
    return true
  }
  //METH: createSimpleSubShapes() : create initial SimpleSubShapes with minCorners to be refined by nestleShapes
  createSimpleSubShapes() {
    DeBug.warn(`${this.id}.createSimpleSubShapes called!!!`)
    this.simpleSubShapes = this.subShapes.map((sub, i) => {
      let newPath = new SegPath(sub, this)
        .refined()
        .path
      return newPath
    })
  }
  //METH: assignSegments() : assign segments to cells
  assignSegments() {
    this.cells.forEach(cell => {
      const segs = this.allSegments.filter(s => s.parentID === cell.id)
      cell.segments = segs
    })
  }
  //METH: copy() : create a copy of this Shape
  copy({
    insetScale,
    protoParent,
    island,
    simpleSubShapes = this.simpleSubShapes,
    type
  } = {}) {
    const newShape = new Shape({
      // subShapes: this.subShapes.map(sub => sub.map(seg => seg.copy())),
      simpleSubShapes: simpleSubShapes,
      protoParent: protoParent,
      svgParent: protoParent.svgParent,
      island: island,
      insetScale: insetScale,
      type: type
    })
    return newShape
  }
  // #endregion

  //MARK: Setup Overrides
  // #region Setup Methods
  //METH: assignElement()
  assignElement() {
    super.assignElement()
    if (!this.svg) return  // no SVG path yet — intershapes get theirs later
    this.path = createSVGElt('path')
      .attribute('d', this.svg)
      // .parent(this.svgElt)
      .addToClassList(this.id)
      // .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor, this.size, this.padding)
      .attribute(`shape-rendering`, `geometricPrecision`)
  }

  //METH: drawElement()
  drawElement() {
    // DeBug.group()
    // DeBug.error('drawElement: ', this.id, this)
    // DeBug.warn(`Shape.drawElement() this.svg`, this.svg)

    if (this.drawSVG) {
      this.svgElt
        .layout(this.anchor, this.size, 20)
        .viewBox(this.anchor, this.size, 20)
    }
    // DeBug.groupEnd()
  }
  // #endregion
}
