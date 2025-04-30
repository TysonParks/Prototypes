
// MARK: Constants
const bezCircleConst = 0.55228
const bezCircle45DegConst = 0.265

//MARK: SVGPath CLASS
// SIZE: 73 lines
class SVGPath {
  //METH: fromProtoSegPath() : SVGPath : convert PrSeg path with cubic verts (finalSubShapes) to a valid SVG path string
  static fromProtoSegPath({ segPath, cornerMin = 0, cornerScale = 1 } = {}) {
    // DeBug.warn(`segPath`, segPath)                                           //LOGGING:
    // cornerScale = R.random_int(0, 1)
    segPath = segPath.copy
    let
      curves = [],
      start, end, cornerStart, cornerEnd,
      startRadius, startSegment, endRadius, endSegment,
      controlStart, lineStart, lineEnd, controlEnd

    segPath.forEach((seg, i) => {
      let report = false                                                                                  //LOGGING:
      // if (seg.id.includes(`cell000`)
      //   // || seg.id.includes(`cell122`)
      // ) { report = true }                                                //LOGGING:
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`svg creation, seg:`, seg)                                                            //LOGGING:
        DeBug.log(`cornerVerts`, seg.cornerVerts)
      }                                                                                                   //LOGGING:

      startRadius = seg.hasCubicStartVert ? seg.availableStartLength : cornerMin  // radius of corner arc
      lineStart = seg.distancedStartPoint(startRadius * cornerScale)              // start point of line connecting corner arcs 
      startSegment = segment(lineStart, seg.start)      // control point calculation segment, connects hard corner to mid line
      controlStart = startSegment.pointOnsegment(bezCircleConst)
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`start props:`, seg.hasCubicStartVert, seg.cubicVerts.start, seg.start, seg.availableStartLength, startRadius)  //LOGGING:
      }

      endRadius = seg.hasCubicEndVert ? seg.availableEndLength : cornerMin        // radius of corner arc
      lineEnd = seg.distancedEndPoint(endRadius * cornerScale)                    // end point of line connecting corner arcs
      endSegment = segment(lineEnd, seg.end)        // control point calculation segment, connects hard corner to middle line
      controlEnd = endSegment.pointOnsegment(bezCircleConst)
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`end props:`, seg.hasCubicEndVert, seg.cubicVerts.end, seg.end, seg.availableEndLength, endRadius)  //LOGGING:
      }                                                                                                   //LOGGING:
      curves.push([controlStart, lineStart, lineEnd, controlEnd])
      if (i === 0) {                                                      // firstLoop
        start = [controlStart, lineStart]
        cornerStart = seg.start
      }
      if (i === segPath.lastIndex) {                                      // lastLoop
        end = [lineEnd, controlEnd]
        cornerEnd = seg.end
        if (!cornerStart.equals(cornerEnd, 3)) { // verify start and end meet at same point
          DeBug.error(`ERROR: start and end are not connected!`)
          DeBug.log(`cornerStart`, cornerStart)
          DeBug.log(`cornerEnd`, cornerEnd)
        }
      }
    })

    //ARROW: simplify(curve) : convert each vert into roundedDec coord pair array
    const simplify = (curve) => curve.map(vert => vert.array.map(coord => roundToDec(coord, 4)))

    // calculate start, (middle) curves, and end
    start = simplify(start)
    curves = curves.map(curve => simplify(curve))
    end = simplify(end)

    const startSVG = `M ${end[0]} C ${end[1]}`
    //ARROW: curvesSVG() : SVGPath : convert each curve into SVG path string
    const curvesSVG = curves.map((c, i) =>
      i === curves.lastIndex ? `${c[0]} ${c[1]} L ${c[2]} ` : `${c[0]} ${c[1]} L ${c[2]} C ${c[3]} `
    )

    const svgPath = `${startSVG} ${curvesSVG} Z`
    // DeBug.log(`end`, end)                                                                           //LOGGING:
    // DeBug.log(`endSVG`, endSVG)                                                                     //LOGGING:
    // DeBug.log(`svgPath`, svgPath)                                                                   //LOGGING:
    return svgPath
  }
}

//MARK: SegPath CLASS
// SIZE: 512 lines
class SegPath {
  path
  shape
  diagonalsPath

  constructor(path, shape) {
    this.path = path
    this.shape = shape
  }

  get isComplete() {
    return memoize(() => {
      return this.path.first.start.equals(this.path.last.end, 1)
    }, `isComplete`).call(this)
  }
  get isQuad() {
    return memoize(() => {
      return this.isComplete && this.path.length === 4
    }, `isQuad`).call(this)
  }
  get hasAllMiddleArcs() {
    return memoize(() => {
      return this.path.every(s => s.isUsingMiddleOrigin)
    }, `hasAllMiddleArcs`).call(this)
  }
  get hasMinRadii() {
    return memoize(() => {
      return this.path.every(s => s.hasMinArcRadius)
    }, `hasMinRadii`).call(this)
  }
  get isOutsideQuad() {
    return memoize(() => {
      return this.isQuad && this.path.every(s => s.isUTurnOut)
    }, `isOutsideQuad`).call(this)
  }
  get perimeter() {
    return memoize(() => {
      return this.path.map(s => s.length).reduce((a, b) => a + b)
    }, `perimeter`).call(this)
  }
  get grid() {
    return memoize(() => {
      return this.shape.grid
    }, `grid`).call(this)
  }
  get bounds() {
    return memoize(() => {
      return findBounds(this.path)
    }, `bounds`).call(this)
  }
  get isCutOut() {
    return memoize(() => {
      return this.shape.cutOutSegs?.some(cut => cut.id === this.path[0].id) || false
    }, `isCutOut`).call(this)
  }
  get cells() {
    // return memoize(() => {
    return this.isCutOut ? this.grid.cellsWithinBounds(this.bounds).exclude(this.shape.cells, `id`) : this.shape.cells
    // }, `cells`).call(this)
  }

  get hasLoosies() { return this.path.some(s => s.canCurveMoreAtEnd) }

  get stairs() {
    if (!this.diagonalsPath) this.diagonalsPath = this.path.copy
    return this.diagonalsPath.filter(s => s.isStair)
  }
  //METH: isCongruent() : Bool : Congruence = same shape, same scale, same rotation, different position. Used for determining svg instancing
  isCongruent(otherPath) {
    const length = this.path.length
    if (length !== otherPath.path.length) return false

    for (let i = 0; i < length; i++) {
      const a = this.path[i], b = otherPath.path[i]
      if (equalsRoundedDec(a.length, b.length)
        || equalsRoundedDec(a.arcRadius, b.arcRadius)
        || !a.direction.equals(b.direction)
      ) return false
    }
    return true
  }

  //MARK: Quad Methods
  //METH: makeCurves() : null : convert all segments to curves
  makeCurves(equal = true, max = true, outWrap = true) {
    DeBug.log(this.path)
    const sorted = this.path

    sorted.forEach(s => {
      DeBug.log(s.id)
      if (equal && max) s.replaceEndCurveOrigin(s.middleArcOrigin)
    })

    sorted.forEach(s => {
      // DeBug.log(s.id)
      if (outWrap) {
        if (s.outWrapper?.canCurveToMiddleOrigin) {
          // DeBug.log(`CAN curve!`)
          // DeBug.log(s)
          s.replaceEndRadiantOutWrapsOrigin()
        } else {
          // DeBug.log(`can't curve!`)
        }
      } else s.flushWrap(true)
    })
  }

  //MARK: REFINE Methods
  //METH: refined() : SegPath : remove collinear segments to simplify seg path to single segments connecting corners
  refined() {
    const
      parentID = this.shape.id,
      segPath = this.path
    DeBug.log(`segPath`, segPath)
    let
      newPath = new OpArray,
      length, prevDir, dir, start, end, firstID, lastID, islandIDs, cells, points, sideDir

    segPath.forEach((seg, i) => {
      // DeBug.log(`seg in loop`, seg.id)                                                                //LOGGING:
      //ARROW: reset()
      const reset = () => {                                     // set cumulative props from current seg
        dir = seg.direction.name
        length = 1
        start = seg.start
        end = seg.end
        islandIDs = seg.islandIDs
        cells = seg.cells
        points = seg.points
        sideDir = seg.sideDir
        firstID = seg.id
      }
      //ARROW: assignSeg()
      const assignSeg = () => {                                 // create and assign seg to newPath
        const
          baseID = `${parentID}-${length}${dir}-${firstID}`,
          id = length === 1 ? baseID : `${baseID}-to-${lastID}`
        let newSeg = protoSegment({
          start: start,
          end: end,
          parentID: parentID,
          id: id,
          islandIDs: islandIDs,
          cells: cells,
          points: points,
          sideDir: sideDir,
          grid: this.grid,
          shape: this.shape,
        })
        // DeBug.log(`newSeg`, newSeg)                                                                   //LOGGING:
        newPath.push(newSeg)
      }

      if (i === 0) reset()                                      // first pass: reset

      if (prevDir) {
        if (prevDir.equals(seg.direction)) {                    // two segments are in line/flat: update cumulative props
          length += 1
          lastID = seg.id
          end = seg.end
          islandIDs = islandIDs.union(seg.islandIDs)
          cells = cells.union(seg.cells, `id`)
          points = points.union(seg.points, [`x`, `y`])
        } else {                                                // new segment: assign last seg and reset
          assignSeg()
          reset()
        }
      }

      if (i === segPath.lastIndex) assignSeg()                  // last pass: assign last seg

      prevDir = seg.direction                                   // set previous direction
    })

    newPath.forEach((seg, i) => {                               // loop through newPath to assign neighbors
      const
        loop = range(0, newPath.lastIndex),
        prev = newPath[loop.cycle(i - 1)],
        next = newPath[loop.cycle(i + 1)]
      seg.assignNeighbors({ start: prev, end: next })
    })
    DeBug.log(`newPath`, newPath)                                                                     //LOGGING:
    return new SegPath(newPath, this.shape)
  }


  //FIXME: still have an issue recognizing final stairs on #559
  get stairSets() {
    DeBug.log(``)
    let
      stairSets = new OpArray,
      firstStair, lastStair, stairSet
    this.stairs.forEach((seg, i) => {
      // DeBug.warn(`current`, i, seg.id)
      let current = seg
      if (lastStair) {
        //TODO: In order to get non-ordinal results in future, need to adapt minLength checks. Maybe a previousLength prop?
        // if (i === this.stairs.lastIndex) { DeBug.error(`this is the last index!`) }  
        if (current.id === lastStair.endNeighbor.id && lastStair.isMinLength && current.isMinLength) {
          if (!stairSet) stairSet = OpArray.format(lastStair)
          stairSet.push(current)
          if (i === this.stairs.lastIndex) stairSets.push(stairSet)
        } else {
          stairSets.push(stairSet)
          stairSet = undefined
        }
      } else firstStair = current

      lastStair = current
      // DeBug.log(`firstStair`, firstStair)
      // DeBug.log(`lastStair`, lastStair)
      // DeBug.log(`stairSet`, stairSet)
      // DeBug.log(`stairSets.last`, stairSets.last)
    })
    stairSets = stairSets.compacted
    // DeBug.log(`stairSets`, stairSets)
    DeBug.log(``)
    if (!stairSets.isEmpty) return stairSets
  }

  //FIXME: Finish implementation
  //METH: withDiagonals() : SegPath
  withDiagonals() {
    DeBug.log(``)
    DeBug.warn(`withDiagonals`)

    this.stairSets?.forEach((set, i) => {
      DeBug.error(`currentset`, set)
      // use setcount to decide which direction to "move"
      const
        count = set.length,
        firstTurn = set.first.endTurn.direction
      let possibleMoves, preferredMove
      if (count === 2) possibleMoves = firstTurn
      if (count > 2) possibleMoves = Direction.Horizontal
      // if (count % 2 === 0)  preferredMove = firstTurn.opposites 
      if (count % 2 === 1) preferredMove = this.isCutOut ? Direction.Right : Direction.Left

      DeBug.log(`count`, count)
      DeBug.log(`firstTurn`, firstTurn)
      DeBug.log(`firstTurn`, firstTurn.name)
      DeBug.log(`possibleMoves`, possibleMoves.name)
      DeBug.log(`preferredMove`, preferredMove?.name)

      // verify that cells are empty in each area considering to "move" into
      const availableMoves = possibleMoves.directions.map(dir => {
        const
          name = dir.name,
          segs = set
            .filter(s => dir.isRight ? s.cells[0]?.isAvailable : s.outsideCells[0]?.isAvailable)
        if (segs.length > 0) return { name, segs }
      }).compacted
        .sort((a, b) => b.segs.length - a.segs.length)

      DeBug.log(`availableMoves`, availableMoves)

      if (availableMoves.isEmpty) return

      let finalMoves
      if (preferredMove && availableMoves[0].segs.length === availableMoves[0].segs.length) {
        finalMoves = availableMoves.find(move => move.name === preferredMove.name)
      } else finalMoves = availableMoves[0]

      DeBug.warn(`finalMoves!!!`, finalMoves)

      // move stairSet
      // this.diagonalsPath = this.path.copy
      const diagPath = this.convertToDiagonals(finalMoves)
      // if (this.stairSets[i + 1][0].startNeighbor.id === set.last.id) {
      //   this.stairSets[i + 1][0].assignNeighbors({ start: diagPath.last })
      // }

    })
    this.path = this.diagonalsPath
    return this.path
  }

  //METH: convertToDiagonals() : SegPath : convert stair segments to diagonal segments
  convertToDiagonals(moves) {
    const
      { name, segs } = moves,
      segCount = segs.length,
      hasEvenCount = segCount % 2 === 0,
      moveOut = name === `left`,
      startsStairIn = segs[0].part.isStairIn,
      startHasSmallRad = moveOut === startsStairIn,
      change = sqrt(2) - 1


    DeBug.warn(`convertToDiagonals segs`, segs)

    //ARROW: ordinalSegment() : ProtoSegment : create a diagonal segment between two cells
    const ordinalSegment = () => {
      const
        startNeighbor = segs.first.startNeighbor,
        endNeighbor = segs.last.endNeighbor,
        startRad = startNeighbor.arcRadius,
        curveStartReduce = startHasSmallRad ? (1 - change) * startRad : (1 + change) * startRad,
        diagStartVert = startNeighbor.distancedEndPoint(curveStartReduce),
        // DeBug.log(`diagStartVert`, diagStartVert)
        diagDir = startHasSmallRad ? startNeighbor.direction.next() : startNeighbor.direction.previous(),
        cellDiagLength = 2 * sqrt(2 * startRad * startRad),
        diagMag = (segCount - 1) * cellDiagLength,
        diagVect = diagDir.lineVector.setMag(diagMag),
        diagEndVert = Vertex.add(diagVect, diagStartVert),

        simpleDiagonal = segment(diagStartVert, diagEndVert),

        cellsSelect = moveOut ? `cells` : `outsideCells`,
        cells = [startNeighbor[cellsSelect].last, endNeighbor[cellsSelect].first],
        normDir = simpleDiagonal.normalDirection,
        sideDir = moveOut ? normDir : normDir.opposites,

        smallCubicDist = change * startRad,
        largeCubicDist = hasEvenCount ? smallCubicDist : cellDiagLength - smallCubicDist,
        diagCubicDists = startHasSmallRad ? [smallCubicDist, largeCubicDist] : [largeCubicDist, smallCubicDist],
        cubicStart = simpleDiagonal.distancedStartPoint(diagCubicDists[0]),
        cubicEnd = simpleDiagonal.distancedEndPoint(diagCubicDists[1]),
        cubicVerts = { start: cubicStart, end: cubicEnd },

        id = `diagonal-${sideDir.name}-${cells[0].id}-${segs.first.sideDir.name}Side-to-${cells[1].id}-${segs.last.sideDir.name}Side`

      return protoSegment({
        start: diagStartVert,
        end: diagEndVert,
        id: id,
        islandIDs: startNeighbor.islandIDs,
        cells: cells,
        sideDir: sideDir,
        cubicVerts: cubicVerts,
        // neighbors:
      })
    }

    let
      turnStart, turnEnd, diagStart, diagEnd, diagonal, current,
      diagonals = new OpArray,
      removals = segs.copy

    segs.forEach((s, i) => {
      //ARROW: idSuffix() : String : create a suffix for the segment id
      const idSuffix = (seg, isStart) => {
        const cell = isStart ? `first` : `last`
        return `${seg.cells[cell].id}-${seg.sideDir.name}Side`
      }
      //ARROW: simpleDiagonal() : Segment : create a diagonal segment between two cells
      const simpleDiagonal = (neighbor) => {
        const
          rad = neighbor.arcRadius,
          newTermLength = startHasSmallRad ? (1 - change) * rad : (1 + change) * rad,
          diagStartVert = neighbor.distancedEndPoint(newTermLength),
          // DeBug.log(`diagStartVert`, diagStartVert)
          diagDir = startHasSmallRad ? neighbor.direction.next() : neighbor.direction.previous(),
          diagMag = (segCount - 1) * 2 * sqrt(2 * rad * rad),
          diagVect = diagDir.lineVector.setMag(diagMag),
          diagEndVert = Vertex.add(diagVect, diagStartVert)
        return segment(diagStartVert, diagEndVert)
      }
      //ARROW: terminalSegs() : null : create terminal segments (turnStart/diagStart/diagEnd/turnEnd)
      const terminalSegs = (s, isStart) => {
        let prevRadius
        // const largeRadius = () => { }
        // const smallRadius = () => change * prevRadius
        // const [startRadius, endRadius] = startHasSmallRad ? [smallRadius, largeRadius] : [largeRadius, smallRadius]

        if (isStart) {
          removals.push(s.startNeighbor.copy())
          turnStart = s.startNeighbor.copy()
          prevRadius = turnStart.arcRadius

          // diagonal = simpleDiagonal(turnStart)
          diagonal = ordinalSegment()
          DeBug.log(`diagonal`, diagonal)

          turnStart.id = `turnStart-${idSuffix(turnStart, false)}`
          turnStart.end = diagonal.start
          // turnStart.addDistancedCubicEndVert(change * prevRadius, true)

          // diagStart = diagonalSegs(s, 1)
        } else {
          // diagEnd = diagonalSegs(s, 2)

          removals.push(s.endNeighbor.copy())
          turnEnd = s.endNeighbor.copy()
          prevRadius = turnEnd.arcRadius

          turnEnd.id = `turnEnd-${idSuffix(turnEnd, true)}`
          turnEnd.start = diagonal.end
        }
      }
      //ARROW: diagonalSegs()
      const diagonalSegs = (seg, mode = 0) => {
        //ARROW: intersect()
        const intersect = (isStart) => {
          const neighbor = isStart ? seg.startNeighbor : seg.endNeighbor
          return diagonal.intersectionWith(neighbor.arcOriginToNormal)
        }

        const
          cells = moveOut ? seg.cells : seg.outsideCells,
          sideDir = moveOut ? diagonal.normalDirection : diagonal.normalDirection.opposites,
          suffix = `${cells[0].id}-${sideDir.name}`
        let start, end, idName, cubicVerts
        switch (mode) {
          case 0:                                         // diagonal
            start = intersect(true)
            end = intersect(false)
            idName = `diag`
            cubicVerts = { start: start, end: end }
            break
          case 1:                                         // diagStart
            start = diagonal.start
            end = intersect(true)
            idName = `diagStart`
            cubicVerts = { start: end, end: end }
            break
          case 2:                                         // diagEnd
            start = intersect(true)
            end = diagonal.end
            idName = `diagEnd`
            cubicVerts = { start: start, end: start }
            break
        }

        return seg.copy({
          start: start,
          end: end,
          id: `${idName}-${suffix}`,
          // islandIDs: s.islandIDs,                         //TODO: consider implications
          cells: cells,
          points: null,
          sideDir: sideDir,
          // cubicVerts: null,                               // none: but maybe assign here?
          cubicVerts: cubicVerts,                         // none: but maybe assign here?
          neighbors: null,                                // none: assign after in loop
        })
      }

      if (i === 0) terminalSegs(s, true)                  // process start seg
      if (i === segs.lastIndex) terminalSegs(s, false)   // process end seg
      else if ((moveOut && i % 2 === 0) || (!moveOut && i % 2 === 1)) {
        current = diagonalSegs(s)
        diagonals.push(current)
      }
    })

    DeBug.log(`moveOut`, moveOut)
    DeBug.log(`startsStairIn`, startsStairIn)
    DeBug.log(`startHasSmallRad`, startHasSmallRad)
    DeBug.log(`diagonal`, diagonal)
    // DeBug.log(`convertToDiagonals`, turnStart, diagStart, diagonals, diagEnd, turnEnd)
    // DeBug.log(`turnStart`, turnStart)
    // DeBug.log(`diagStart`, diagStart)
    // DeBug.log(`diagonals`, diagonals)
    // DeBug.log(`diagEnd`, diagEnd)
    // DeBug.log(`turnEnd`, turnEnd)

    // const diagPath = OpArray.format([turnStart, diagStart, ...diagonals, diagEnd, turnEnd])
    const diagPath = OpArray.format([turnStart, diagonal, turnEnd])

    DeBug.warn(`diagPath`, diagPath)
    DeBug.log(`segs`, segs)
    DeBug.log(`removals`, removals)
    //FIXME: THE ISSUE IS STILL TODO WITH newPath/this.path not having the diagSegs added in previous step!!
    DeBug.warn(`path`, this.path)

    let newPath = this.diagonalsPath
    DeBug.warn(`newPath`, newPath)

    diagPath.forEach((seg, i) => {
      // DeBug.log(`lastIndex`, diagPath.lastIndex)
      DeBug.log(i, seg)
      if (i === 0) {
        const neighbor = newPath.find(s => s.id === seg.startNeighbor.id)
        neighbor.assignNeighbors({ end: seg })
      }
      if (i > 0) seg.assignNeighbors({ start: diagPath[i - 1] })
      if (i < diagPath.lastIndex) seg.assignNeighbors({ end: diagPath[i + 1] })
      if (i === diagPath.lastIndex) {
        const neighbor = newPath.find(s => s.id === seg.endNeighbor.id)
        neighbor.assignNeighbors({ start: seg })
      }
    })

    DeBug.warn(`diagPath edgeParts`, diagPath.map(d => d.part))


    newPath = newPath
      .exclude(removals, `id`)
    DeBug.warn(`newPath`, newPath)

    newPath = newPath
      .union(diagPath, `id`)
    DeBug.warn(`newPath`, newPath)

    newPath = newPath[0].segPath
    // DeBug.warn(`genPath`, genPath)
    // newPath = genPath
    this.diagonalsPath = newPath
    DeBug.log(`diagonalsPath`, this.diagonalsPath)
    DeBug.log(`diagonalsPath`, this.diagonalsPath.map(s => [s.start.string, s.cubicStart?.string, s.cubicEnd?.string, s.end.string]))
    // DeBug.log(`stairSets`, this.stairSets)

    if (this.stairSets && this.stairSets[0][0].startNeighbor.id === segs.last.id) {
      this.stairSets[0][0].assignNeighbors({ start: diagPath.last })
    }

    return diagPath
  }



}

//MARK: VertPath CLASS                                                                                       //UNUSED:
//TODO: Adapt this code for SVG points and add to debugging
// SIZE: 18 lines
class VertPath {                                                                                          //UNUSED:

  //TODO: reverse engineer and find where this belongs
  // NOTE: Made with GPT-4 on May 23, 2023
  //NOTE: Intended to help make diagonal lines possible
  //METH: arcControlPoints() :                                                                            //UNUSED:
  static arcControlPoints(a, b, c) {
    const
      ab = Vertex.sub(b, a).normalize(),
      bc = Vertex.sub(c, b).normalize(),
      theta = ab.angleBetween(Vertex.mult(bc, -1)),
      t = 4 / 3 * tan(theta / 4),
      p1 = a,
      p2 = Vertex.sub(b, Vertex.mult(ab, t)),
      p3 = Vertex.add(b, Vertex.mult(bc, t)),
      p4 = c
    return [p1, p2, p3, p4]
  }
}

//MARK: Export CLASS    
// SIZE: 61 lines
class Export {

  // MARK: File export methods
  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static createSVGMarkup(svgElement) {
    const
      serializer = new XMLSerializer(),
      svgMarkup = serializer.serializeToString(svgElement)
    return svgMarkup
  }
  //METH:
  static exportSVG(svgMarkup, fileName) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xmlcharset=utf-8' }),
      url = URL.createObjectURL(blob),
      link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.click()

    URL.revokeObjectURL(url)
  }

  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static exportPNG(svgMarkup, fileName, width, height, scale = 1) {
    // DeBug.log("Starting exportPNG() function...")

    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext("2d")
    ctx.scale(scale, scale)

    const
      img = new Image(),
      svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }),
      svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl

    img.onload = function () {
      // DeBug.log("Image loaded...")                                                           //LOGGING:
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(function (blob) {
        // DeBug.log("Blob created...")                                                         //LOGGING:
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // DeBug.log("Link clicked...")                                                         //LOGGING:

        URL.revokeObjectURL(url) // Revoke the Blob URL for the PNG
        URL.revokeObjectURL(svgUrl) // Revoke the Blob URL for the SVG
        DeBug.log(`PNG saved`)                                                                  //LOGGING:
      })
    }
  }
}

// MARK: Proto Geometry Classes

// MARK: Vertex CLASS
// SIZE: 122 lines
function vert(x = 0, y = 0) {
  if (x instanceof Array) return new Vertex(x[0], x[1])
  if (x instanceof Object || x instanceof p5.Vector) return new Vertex(x.x, x.y)
  if (arguments.length === 1) return new Vertex(x, x)
  return new Vertex(x, y)
}
class Vertex extends p5.Vector {

  constructor(x = 0, y = 0) {
    super(x, y)
  }

  get id() { return `${this.x.toFixed(1)}, ${this.y.toFixed(1)}` }

  get isZero() { return this.x === 0 && this.y === 0 }
  get string() { return `${roundToDec(this.x, 3)}, ${roundToDec(this.y, 3)}` }
  get array() { return [this.x || 0, this.y || 0] }

  get aspect() { return Aspect.fromRatio((roundToDec(this.x) / roundToDec(this.y))) }
  get quadrantDirection() {
    if (this.x > 0) {
      if (this.y > 0) return Direction.UpRight
      if (this.y < 0) return Direction.DownRight
      if (this.y === 0) return Direction.Right
    }
    if (this.x < 0) {
      if (this.y > 0) return Direction.UpLeft
      if (this.y < 0) return Direction.DownLeft
      if (this.y === 0) return Direction.Left
    }
    if (this.x === 0) {
      if (this.y > 0) return Direction.Up
      if (this.y < 0) return Direction.Down
      if (this.y === 0) return Direction.None
    }
  }

  get abs() { return vert(abs(this.x), abs(this.y)) }

  //METH: roundedMag() : Number : rounded magnitude of vector
  roundedMag(decimal = 4) { return roundToDec(this.mag(), decimal) }
  //METH: widthTo() : Number : distance to another vertex in x direction
  widthTo(vert) { return abs(this.x - vert.x) }
  //METH: heightTo() : Number : distance to another vertex in y direction
  heightTo(vert) { return abs(this.y - vert.y) }
  //METH: slopeTo() : Number : slope to another vertex
  slopeTo(vert) { return (this.y - vert.y) / (this.x - vert.x) }
  //METH: directionTo() : Direction : direction to another vertex
  directionTo(vert) { return segment(this, vert).direction }
  //METH: biDirectionTo() : Direction : direction to another vertex
  // biDirectionTo(vert) {                                                   //DEPRECATED: previously only used in Grid.cellSegmentBetween()
  //   if (this.y === vert.y) return Direction.Horizontal
  //   if (this.x === vert.x) return Direction.Vertical

  //   const slope = this.slopeTo(vert)
  //   DeBug.log('slope', slope)

  //   if (this.slopeTo(vert) === -1) return Direction.PosOrdinal
  //   if (this.slopeTo(vert) === 1) return Direction.NegOrdinal
  //   return -1 // not Cardinal or Ordinal
  // }
  //METH: roundToDec() : null : roundToDec x and y values
  roundCoordsToDec(dec = 4) {
    this.x = roundToDec(this.x, dec)
    this.y = roundToDec(this.y, dec)
  }
  //METH: equals() : Bool : check if two vertices are equal
  equals(vert, accuracy = 3, deviation) {
    let ax, ay, bx, by
    if (arguments.length === 2) {
      ax = approxToDec(this.x, accuracy, 0)
      ay = approxToDec(this.y, accuracy, 0)
      bx = approxToDec(vert.x, accuracy, 0)
      by = approxToDec(vert.y, accuracy, 0)
    } else {
      ax = this.x
      ay = this.y
      bx = vert.x
      by = vert.y
    }
    return deviation ? abs(ax - bx) < deviation && abs(ay - by) < deviation : ax === bx && ay === by
  }

  //TODO: If we run into Vertex arithemtic errors, test this
  // add(vert) { return Vertex.add(this, vert) }
  // sub(vert) { return Vertex.sub(this, vert) }
  // mult(vert) { return Vertex.mult(this, vert) }
  // div(vert) { return Vertex.div(this, vert) }
  //METH: min() : Vertex : return the minimum vertex from a set of vertices
  static min(verts) { return verts.gridVertSorted[0] }
  //METH: max() : Vertex : return the maximum vertex from a set of vertices
  static max(verts) { return verts.gridVertSorted.last }
  //METH: rotate() : Vertex : rotate a vertex by a given angle in degrees
  static rotate(v, deg) { return v.copy().rotate(radians(deg)) }
  //METH: cleanRotate() : Vertex : rotate that uses roundToDec to create a "cleaner" resulting rotation
  static cleanRotate(v, deg, decimal = 5) {
    const initial = Vertex.rotate(v, deg)
    const x = roundToDec(initial.x, decimal)
    const y = roundToDec(initial.y, decimal)
    const z = roundToDec(initial.z, decimal)
    return initial instanceof Vertex ? vert(x, y) : new p5.Vector(x, y, z)
  }
  //METH: add() : Vertex : add two vertices together
  static add(a, b) { return vert(p5.Vector.add(a, b)) }
  //METH: sub() : Vertex : subtract two vertices
  static sub(a, b) { return vert(p5.Vector.sub(a, b)) }
  //METH: mult() : Vertex : multiply two vertices
  static mult(a, b) {
    if (b instanceof Vertex) {
      if (!a || !b) {
        DeBug.error(`Vertex.mult issue:`, a, b)
        return
      }
      return vert(a.x * b.x, a.y * b.y)
    }
    if (typeof b === 'number') return vert(a.x * b, a.y * b)
  }
  //METH: div() : Vertex : divide two vertices
  static div(a, b) {
    if (b instanceof Vertex) return vert(a.x / b.x, a.y / b.y)
    if (typeof b === 'number') return vert(a.x / b, a.y / b)
  }
}

//MARK: Segment CLASS 
// SIZE: 353 lines
function segment(start, end) {
  return new Segment(start, end)
}
class Segment {
  // start
  // end

  constructor(start, end) {
    this.start = start
    this.end = end
    // this.#assignVerts(start, end, arguments)
  }

  //MARK: computed
  get id() { return `(${this.start.id}) -> (${this.end.id})` }
  get string() { return `[(${this.start.string}), (${this.end.string})]` }

  get isVert() { return this.start.equals(this.end, 3) }
  get lineVector() { return p5.Vector.sub(this.end, this.start) }
  get opposite() { return segment(this.end, this.start) }
  get gridSorted() {
    return memoize(() => {
      return segment(this.vertsArray.gridVertSorted[0], this.vertsArray.gridVertSorted[1])
    }, `gridSorted`).call(this)
  }

  //TODO: I should be able to revert to instance properties with these
  get start() { return this._start }
  set start(vert) { this._start = vert }
  get end() { return this._end }
  set end(vert) { this._end = vert }

  get vertsArray() { return OpArray.from([this.start, this.end]) }

  get x() { return this.start.x }
  get y() { return this.start.y }

  get mid() { return this.pointOnsegment(0.5) }

  get isVertical() {
    return memoize(() => {
      return this.direction.allAreVertical
    }, `isVertical`).call(this)
  }
  get isHorizontal() {
    return memoize(() => {
      return this.direction.allAreHorizontal
    }, `isHorizontal`).call(this)
  }
  get isCardinal() {
    return memoize(() => {
      return this.direction.allAreCardinal
    }, `isCardinal`).call(this)
  }
  get isOrdinal() {
    return memoize(() => {
      return this.direction.allAreOrdinal
    }, `isOrdinal`).call(this)
  }
  get angle() {                                        // in RADIANS
    return memoize(() => {
      return this.lineVector.heading()
    }, `angle`).call(this)
  }
  get angleInDegrees() {                               // in DEGREES
    return memoize(() => {
      return degrees(this.angle)
    }, `angleInDegrees`).call(this)
  }
  get direction() {
    return memoize(() => {
      return Direction.atAngle(this.angle)
    }, `direction`).call(this)
  }
  get normalDirection() {
    return memoize(() => {
      return this.direction.toLeft
    }, `normal`).call(this)
  }
  get slope() {
    return memoize(() => {
      return this.start.slopeTo(this.end)
    }, `slope`).call(this)
  }
  get length() {
    return memoize(() => {
      return this.lineVector.mag()
    }, `length`).call(this)
  }
  get bounds() {
    return memoize(() => {
      return findBounds(this)
    }, `bounds`).call(this)
  }
  get width() {
    return memoize(() => {
      return this.start.widthTo(this.end)
    }, `width`).call(this)
  }
  get height() {
    return memoize(() => {
      return this.start.heightTo(this.end)
    }, `height`).call(this)
  }

  get xMin() { return min(this.start.x, this.end.x) }
  get xMax() { return max(this.start.x, this.end.x) }
  get yMin() { return min(this.start.y, this.end.y) }
  get yMax() { return max(this.start.y, this.end.y) }

  get boundsCorners() {
    return memoize(() => {
      return {
        upLeft: vert(this.xMin, this.yMin),
        upRight: vert(this.xMax, this.yMin),
        downRight: vert(this.xMax, this.yMax),
        downLeft: vert(this.xMin, this.yMax),
      }
    }, `boundsCorners`).call(this)
  }

  //MARK: methods
  //METH: vertIsInBounds() : Bool : check if a vertex is within the bounds of the segment
  vertIsInBounds(vert, accuracy = 4, deviation) { return vertIsWithinBounds(vert, this.bounds, true, accuracy, deviation) }
  //METH: vertIsOnLine() : Bool : check if a vertex is on the line of the segment
  //NOTE: made with ChatGPT4.0 on Jan14, 2024
  vertIsOnLine(vert, includeEnds = true, decimal = 1, deviation = 0.1) {
    let report = false
    // if (equalsRoundedDec(vert.x, 54.444)) { report = true }                                        //LOGGING:
    // if (
    //   this.id.includes('cel027')                                                                       //LOGGING:
    //   // || this.id.includes('cell185')                                                                    //LOGGING:
    //   // || this.id.includes('cell001')                                                                    //LOGGING:
    // ) { report = true }
    if (report) DeBug.log(`vertIsOnLine this`, this)
    if (!includeEnds && (vert.equals(this.start, decimal) || vert.equals(this.end, decimal))) {
      if (report) DeBug.log(`vertIsOnLine fail: vert is on terminus`, vert)
      return false                                                // point is on a terminus
    }

    if (!this.vertIsInBounds(vert, decimal)) {                    // point is outside seg's bounding box
      if (report) DeBug.error(`vertIsOnLine fail: vert is outside bounds`, vert, this.bounds)
      return false
    }
    // DeBug.log(`vertIsOnLine: vert is in bounds!`)
    // Calculate the t parameter using linear interpolation
    const t = roundToDec((this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()), 4)
    // DeBug.log(`t`, t)
    // Check if t is within the range [0, 1]
    if (t < 0 || t > 1) {
      if (report) {
        DeBug.error(`vertIsOnLine fail: t param test`, vert, t)
        DeBug.error(this.lineVector)
      }
      return false                                                // The point does not lie within the segment
    }

    // Calculate the projected point on the line
    const
      projectedPoint = Vertex.add(this.start, Vertex.mult(this.lineVector, t)),
      diff = vert.dist(projectedPoint)                            // Check vert distance to projected point 
    // DeBug.log(`vertIsInBounds projectedPoint`, projectedPoint)
    // DeBug.log(`vertIsInBounds diff`, diff)
    const result = diff < deviation
    if (report && !result) {
      DeBug.error(`vertIsOnLine fail: threshold`, vert)
      DeBug.error(projectedPoint, diff)
    }
    return result
  }
  //METH: vertOrientation() : Direction : check the orientation of a vertex relative to the segment
  vertOrientation(vert) {
    const
      vertVector = Vertex.sub(vert, this.start),                    // vert to this.start
      cross = Vertex.cross(this.opposite.lineVector, vertVector).z  // cross this opposite vector to vertVector
    // DeBug.warn(vert, this.start)
    // DeBug.warn(this.vector, vertVector)

    if (cross > 0) return Direction.Left                            // vert is to the left
    else if (cross < 0) return Direction.Right                      // vert is to the right
    return Direction.None                                           // vert is collinear
  }
  //METH: isParallelTo() : Bool : check if two segments are parallel
  isParallelTo(seg, accuracy = 1) {
    const precise = Vertex.cross(this.lineVector, seg.lineVector).z
    return abs(roundToDec(precise, accuracy)) === 0                 // MUCH FASTER!!!
  }
  //METH: isCollinearWith() : Bool : check if two segments are collinear
  isCollinearWith(seg) { return this.isOverlappingWith({ seg: seg, infinite: true }) }
  //METH: isOverlappingWith() : Bool : check if two segments are overlapping
  isOverlappingWith({ seg, includeEnds = true, decimal = 0, mode = 2, infinite = false, accuracy = 0 } = {}) {
    // DeBug.log(`seg`, seg)
    if (this.isVert || seg.isVert) {
      if (this.isVert && seg.isVert) return this.start.equals(seg.start, 3)
      if (this.isVert && !infinite) return seg.vertIsOnLine(this.start)
      if (seg.isVert && !infinite) return this.vertIsOnLine(seg.start)
    }

    if (!this.isParallelTo(seg)) {                                  // false if not parallel
      // DeBug.warn(`isOverlappingWith is not parallel`)                                            //LOGGING:
      return false
    }

    if (infinite) {
      // Check for collinearity by verifying if the vector between one point of this segment
      // and the start of the other segment is orthogonal to the direction vector of this segment
      const
        connectiveVector = Vertex.sub(seg.start, this.start),
        cross = abs(roundToDec(Vertex.cross(connectiveVector, this.lineVector).z, 1))
      // DeBug.warn(`isOverlappingWith ${seg.id}, crossProduct: ${cross}`)                          //LOGGING:
      if (accuracy > 0) return abs(cross) < accuracy
      return cross === 0
    }

    const
      sameDir = this.direction.equals(seg.direction),
      isExactOverlap = sameDir ? this.start.equals(seg.start) && this.end.equals(seg.end)
        : this.start.equals(seg.end) && this.end.equals(seg.start)
    if (isExactOverlap) return true                                 // true if exact overlap, either direction

    const isEndToEnd = sameDir ? this.start.equals(seg.end) || this.end.equals(seg.start)
      : this.start.equals(seg.start) || this.end.equals(seg.end)
    if (isEndToEnd) return includeEnds                              // false if end-to-end contact without overlap

    const
      segInsideThis = this.vertIsOnLine(seg.start, includeEnds, decimal)
        || this.vertIsOnLine(seg.end, includeEnds, decimal),
      thisInsideSeg = seg.vertIsOnLine(this.start, includeEnds, decimal)
        || seg.vertIsOnLine(this.end, includeEnds, decimal)

    switch (mode) {
      case 0:
        return segInsideThis
      case 1:
        return thisInsideSeg
      case 2:
        return segInsideThis || thisInsideSeg
    }
  }
  //METH: perpendicularIntersectionWith() : Vertex : find the perpendicular intersection of a vertex with the segment
  perpendicularIntersectionWith(vert) {
    // DeBug.log(`perpX this`, this)                                                                      //LOGGING:
    const
      perpEnd = Vertex.add(this.direction.toLeft.lineVector, vert),
      perpSeg = segment(vert, perpEnd),
      projected = this.intersectionWith(perpSeg, true),
      vertOnLine = this.vertIsOnLine(projected)

    // DeBug.log(`perpX: perpSeg`, perpSeg)                                                               //LOGGING:   
    // DeBug.log(`perpX: projected`, projected)                                                           //LOGGING: 
    // DeBug.log(`perpX: vertOnLine`, vertOnLine)                                                         //LOGGING:
    return vertOnLine ? projected : undefined
  }

  //METH: intersectionWith() : Vertex  or Segment !!!: find the intersection of two segments
  //NOTE: made with ChatGPT4.0 on Jan12, 2024
  intersectionWith(seg, infinite = false) {
    const
      p = this.start,
      q = seg.start,
      r = this.lineVector,
      s = seg.lineVector

    if (this.isParallelTo(seg)) {                                                     // check for parallelism
      // DeBug.warn(`yes isParallel`)                                                             //LOGGING:
      if (this.isOverlappingWith({ seg: seg, infinite: infinite })) {                 // check for overlapping
        // DeBug.warn(`yes isOverlapping`)                                                        //LOGGING:
        const
          starts = OpArray.format([this.gridSorted.start, seg.gridSorted.start]),     // gridSorted point same way
          ends = OpArray.format([this.gridSorted.end, seg.gridSorted.end])            // OpArrays from points
        let overlapStart, overlapEnd
        if (!infinite) {                                                              // get inner overlap
          overlapStart = Vertex.max(starts)
          overlapEnd = Vertex.min(ends)
        } else {                                                                      // get outer overlap
          overlapStart = Vertex.min(starts)
          overlapEnd = Vertex.max(ends)
        }
        if (overlapStart.equals(overlapEnd, 1)) return overlapStart                   // handle single vertex case with tolerance
        const overlapSeg = segment(overlapStart, overlapEnd)                          // create overlapSeg
        return overlapSeg.direction.equals(this.direction) ? overlapSeg : overlapSeg.opposite // align to this direction
      }
      return                                                                          // No overlap, or parallel but not collinear
    }
    const
      crossZ = Vertex.cross(r, s).z,
      t = Vertex.cross(Vertex.sub(q, p), s).z / crossZ,                               // intersection t value for this seg
      u = Vertex.cross(Vertex.sub(q, p), r).z / crossZ                                // intersection u value for other seg

    if (!infinite &&                                                                  // check if intersection points are on both segs
      (t < 0 || t > 1                                                                 // intersection point is not on the first segment
        || u < 0 || u > 1)                                                            // intersection point is not on the second segment
    ) return

    return Vertex.add(p, Vertex.mult(r, t))                                           // calculated intersection point
  }
  // //METH: roundToDec() : null : roundToDec start and end verts
  roundVertsToDec(dec = 4) {
    this.start.roundCoordsToDec(dec)
    this.end.roundCoordsToDec(dec)
  }
  //METH: equals() : Bool : check if two segments are equal
  equals(segment, accuracy = 3) {
    return this.start.equals(segment.start, accuracy) && this.end.equals(segment.end, accuracy)
  }
  //METH: pointOnsegment() : Vertex : get point on segment given lerp from start to end
  pointOnsegment(lerp) {
    let
      newVec = Vertex.mult(this.lineVector, lerp),
      startVec = createVector(this.start.x, this.start.y)
    return Vertex.add(startVec, newVec)
  }
  //METH: scaledStartPoint() : Vertex : get point on segment given lerp from mid to start
  scaledStartPoint(lerp, mid = 0.5) {
    return this.pointOnsegment(mid - lerp * mid)
  }
  //METH: scaledEndPoint() : Vertex : get point on segment given lerp from mid to end
  scaledEndPoint(lerp, mid = 0.5) {
    return this.pointOnsegment(mid + lerp * (1 - mid))
  }
  //METH: distancedStartPoint() : Vertex : get point on segment given distance from start
  distancedStartPoint(distance) { return this.pointOnsegment(distance / this.length) }
  //METH: distancedEndPoint() : Vertex : get point on segment given distance from end
  distancedEndPoint(distance) { return this.pointOnsegment(1 - distance / this.length) }

  //TODO: I might be able to revert to this
  //METH: assignVerts() : null : assign start and end verts
  // #assignVerts(start, end, args) {
  //   if (args.length === 1) {
  //     if (start instanceof Array) {
  //       if (start[0] instanceof Vertex) {
  //         this.verts = { start: start[0], end: start[1] }
  //       }
  //       else if (start[0] instanceof Object || start[0] instanceof Array) {
  //         this.verts = { start: vert(start[0]), end: vert(start[1]) }
  //       }
  //     }
  //     else if (start instanceof Object) {
  //       if (start.start instanceof Vertex) {
  //         this.verts = { start: start.start, end: start.end }
  //       }
  //       else if (start.start instanceof Object || start[0] instanceof Array) {
  //         this.verts = { start: vert(start.start), end: vert(start.end) }
  //       }
  //     }
  //   }
  //   else if (start instanceof Vertex) {
  //     this.verts = { start: start, end: end }
  //   }
  //   else if (start instanceof Object) {
  //     this.verts = { start: vert(start), end: vert(end) }
  //   }
  // }
}

//MARK: ProtoSegment CLASS
// SIZE: 1623 lines
function protoSegment({ start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, insetScale, shape, _direction } = {}) {
  return new ProtoSegment(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, insetScale, shape, _direction)
}
class ProtoSegment extends Segment {
  id
  parentID
  islandIDs
  cells
  points
  sideDir
  taken = false
  grid
  insetScale
  shape
  _direction

  cubicVerts = { start: undefined, end: undefined }
  neighbors = { start: undefined, end: undefined }

  constructor(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, insetScale = 1, shape, _direction) {
    super(start, end)
    this.parentID = parentID
    this.islandIDs = islandIDs
    this.id = id
    this.cells = cells
    this.points = points
    this.sideDir = sideDir
    this.grid = grid
    this.insetScale = insetScale
    this.shape = shape
    this._direction = _direction

    if (cubicVerts) this.cubicVerts = cubicVerts
    if (neighbors) this.neighbors = neighbors
    if (!this.direction.allAreCardinal) DeBug.error(`this segment is not Cardinal!`, this)
  }

  //MARK: computed 
  get cellRadius() { return this.grid.cellRadius }
  get cellSize() { return this.grid.cellSize }
  get isMinCorner() { return !this.shape.maxCorners }
  get isMinLength() {
    const minLength = this.isHorizontal ? this.cellSize.x : this.cellSize.y
    return equalsRoundedDec(this.length, minLength, 0)
  }
  get isEdgeOfQuad() { return this.segPath.length === 4 }

  get direction() {
    if (!this.isVert) return super.direction
    else return this._direction || super.direction
  }
  get outsideCells() {
    return memoize(() => {
      return this.grid.tempOutlineSelection(this.cells, 1, this.direction.toLeft)
    }, `outsideCells`).call(this)
  }

  get turns() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        DeBug.error(`segment ${this.id} without neighbors has no turns`)
        return
      }
      const
        start = this.startNeighbor.direction.turnTo(this.direction),
        end = this.direction.turnTo(this.endNeighbor.direction)

      if (!start) DeBug.error(`segment ${this.id} failed to calculate start turn`)
      if (!end) DeBug.error(`segment ${this.id} failed to calculate end turn`)

      return { start: start, end: end }
    }, `turns`).call(this)
  }
  get endTurn() { return this.turns.end }

  get normals() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        DeBug.error(`segment ${this.id} without neighbors has no normals`)
        return
      }
      if (this.angle === undefined) {
        DeBug.error(`segment ${this.id} has no angle!`, this)
        DeBug.log(`this.angle = ${this.angle}`)
      }

      const normals =
      {
        start: this.startNeighbor.angle - this.turns.start.normalRotAngle,
        end: this.angle - this.turns.end.normalRotAngle,
        cubic: this.angle - PI / 2
      }
      return normals.map(a => Direction.atAngle(a))
    }, `normals`).call(this)
  }
  get part() {
    return memoize(() => {
      return EdgePart.from([this.turns.start, this.turns.end])
    }, `part`).call(this)
  }

  get isUTurn() { return this.part?.isUTurn }
  get isUTurnIn() { return this.part?.isUTurnIn }   // LL
  get isUTurnOut() { return this.part?.isUTurnOut } // RR

  get isStair() { return this.part?.isStair }
  get isStairIn() { return this.part?.isStairIn }   // RL
  get isStairOut() { return this.part?.isStairOut } // LR

  get isFlat() { return this.part?.isFlat }
  get isCorner() { return this.part?.isCorner }

  get isOutsideCorner() {
    return memoize(() => {
      return this.turns?.end.isRight
    }, `isOutsideCorner`).call(this)
  }
  get isCutOut() {
    return memoize(() => {
      return this.shape.cutOutSegs?.some(cut => cut.id === this.id) || false
    }, `isCutOut`).call(this)
  }

  get cornerVerts() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        DeBug.error(`segment ${this.id} without neighbors has no cornerVerts`)
        return
      }
      if (!this.turns.start || !this.turns.end) {
        DeBug.error(`segment ${this.id} without turns has no cornerVerts`)
        return
      }
      return {
        start: (this.turns?.start.value !== 0) ? this.start : undefined,
        end: (this.turns?.end.value !== 0) ? this.end : undefined,
      }
    }, `cornerVerts`).call(this)
  }
  get corners() {
    return memoize(() => {
      const
        startDir = this.startNeighbor.direction,
        endDir = this.direction,
        startTurn = this.turns?.start,
        endTurn = this.turns?.end

      //ARROW: corner() : Corner : create a corner from a direction and a turn
      const corner = (dir, turn) => {
        const turnAdd = turn.value === 1 ? 0 : 1
        return new Corner((dir.value + turnAdd) % 4)
      }

      return {
        start: (startTurn !== 0) ? corner(startDir, startTurn) : undefined,
        end: (endTurn !== 0) ? corner(endDir, endTurn) : undefined,
      }
    }, `corners`).call(this)
  }
  get startCorner() { return this.corners.start }
  get endCorner() { return this.corners.end }

  //MARK: Cubic Verts
  // #region Cubic Verts
  get hasCubicStartVert() { return !!this.cubicVerts.start }
  get hasCubicEndVert() { return !!this.cubicVerts.end }
  get hasSomeCubicVerts() { return this.hasCubicStartVert || this.hasCubicEndVert }
  get hasNoCubicVerts() { return !this.hasSomeCubicVerts }
  get hasOnlyOneCubicVert() { return (this.hasCubicStartVert || this.hasCubicEndVert) && !(this.hasBothCubicVerts) }
  get hasBothCubicVerts() { return this.hasCubicStartVert && this.hasCubicEndVert }
  get cubicVertCount() {
    if (this.hasBothCubicVerts) return 2
    if (this.hasOnlyOneCubicVert) return 1
    if (!this.hasSomeCubicVerts) return 0
  }

  get finalCubicStartVert() {
    const finalLength = min(this.availableStartLength, this.startNeighbor.availableEndLength)
    return this.distancedStartPoint(finalLength)
  }
  get finalCubicEndVert() {
    const finalLength = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    return this.distancedEndPoint(finalLength)
  }

  //METH: availableLength() : Number : calculate available length for cubic verts
  #availableLength(start = true, max = false) {
    if (!this.cornerVerts?.start || !this.cornerVerts?.end) {       // needs to have cornerVerts to calculate
      DeBug.warn(`cannot calculate available length without cornerVerts`)
      DeBug.log(this)
      return
    }
    if (this.hasNoCubicVerts) return this.length / 2             // assume half of entire length available
    // if (this.hasNoCubicVerts)  return this.length              // assume entire length available
    else {
      let startLength, endLength
      if (this.hasCubicStartVert) startLength = max ? this.maxCubicLength : this.start.dist(this.cubicVerts.start)
      if (this.hasCubicEndVert) endLength = max ? this.maxCubicLength : this.end.dist(this.cubicVerts.end)
      // DeBug.warn(`this seg`, this)                                                               //LOGGING:
      // DeBug.log(`startLength`, startLength)                                                      //LOGGING:
      // DeBug.log(`endLength`, endLength)                                                          //LOGGING:
      if (!max) {
        if (startLength && endLength) {                               // this.hasBothCubicVerts
          if (approxToDec(startLength, 2, 1) + approxToDec(endLength, 2, 1) > approxToDec(this.length, 2, 2)) {
            // usually only occurs in a stair segment wrapped from both sides
            if (this.isStair) {                                       // always reduce the outside corner (turn === R)
              if (this.isStairIn) {                                   // isStairIn (turns === RL)
                startLength = this.length - endLength                 // reduce start corner
              } else {                                                // isStairOut (turns === LR)
                endLength = this.length - startLength                 // reduce end corner
              }
            } else {                                                  // segment is UTurn
              if (approxToDec(startLength, 2, 1) === approxToDec(endLength, 2, 1)) {
                startLength = this.length / 2                         // reduce both corners equally
                endLength = startLength
              } else if (approxToDec(startLength, 2, 1) > approxToDec(endLength, 2, 1)) {
                startLength = this.length - endLength                 // reduce start corner
              } else {
                endLength = this.length - startLength                 // reduce end corner
              }
            }
          }
        } else {                                                      // segment only has one cubicVert
          if (startLength) {                                          // only has cubicStartVert
            endLength = this.length - startLength                     // reduce end corner
          } else {                                                    // only has cubicEndVert
            startLength = this.length - endLength                     // reduce start corner
          }
        }
      }

      if (start) return startLength
      else return endLength
    }
  }

  get availableStartLength() { return this.#availableLength() }
  get availableEndLength() { return this.#availableLength(false) }
  get maxAvailableStartLength() { return this.#availableLength(true, true) }
  get maxAvailableEndLength() { return this.#availableLength(false, true) }
  get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

  //MARK: Cubic Vert methods
  //METH: canCurveTo() : Bool : check if a cubic vert can curve to a new origin
  canCurveTo(newOrigin, current = false) {
    const
      viables = current ? this.currentViableArcOrigins : this.viableArcOrigins,
      canCurve = viables.some(v => v.equals(newOrigin, 1))
    // DeBug.log(newOrigin)

    if (!canCurve) {
      DeBug.log(`newOrigin`, newOrigin)
      DeBug.log(`viables`, viables)
    }
    return canCurve
  }
  //METH: assignMid() : null : assign mid point to cubic verts
  assignMid() {
    this.addCubicStartVert(this.mid)
    this.addCubicEndVert(this.mid)
  }
  //METH: assignCubicStart() : null : assign start point to cubic verts
  addCubicStartVert(vert, replace = false) { this.#addCubicVert(vert, replace, true) }
  //METH: assignCubicEnd() : null : assign end point to cubic verts
  addCubicEndVert(vert, replace = false) { this.#addCubicVert(vert, replace, false) }
  //METH: addDistancedCubicStartVert() : null : add a cubic start vert at a distance from the start point
  addDistancedCubicStartVert(distance, replace = false) {
    this.addCubicStartVert(this.distancedStartPoint(distance), replace)
  }
  //METH: addDistancedCubicEndVert() : null : add a cubic end vert at a distance from the end point
  addDistancedCubicEndVert(distance, replace = false) {
    this.addCubicEndVert(this.distancedEndPoint(distance), replace)
  }
  //METH: addDistancedStartCornerVerts() : null : add start corner verts at a distance from the start point
  addDistancedStartCornerVerts(distance, replace = false) {
    this.neighbors.start.addDistancedCubicEndVert(distance, replace)
    this.addDistancedCubicStartVert(distance, replace)
  }
  //METH: addDistancedEndCornerVerts() : null : add end corner verts at a distance from the end point
  addDistancedEndCornerVerts(distance, replace = false) {
    this.addDistancedCubicEndVert(distance, replace)
    this.neighbors.end.addDistancedCubicStartVert(distance, replace)
  }
  //METH: addBothDistancedCornerVerts() : null : add both corner verts at the same distance from the start and end points
  addBothDistancedCornerVerts(distance, replace = false) {
    this.addDistancedStartCornerVerts(distance, replace)
    this.addDistancedEndCornerVerts(distance, replace)
  }
  //METH: matchEndCorner() : null : match the end corner to the end neighbor's start
  matchEndCorner() {
    const endMin = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    this.addDistancedEndCornerVerts(endMin, true)
  }
  //METH: setArcToMiddle() : null : set the arc to the middle of the segment
  setArcToMiddle(replace = true) {
    const mid = this.middleArcOrigin
    if (replace) this.replaceEndCurveOrigin(mid)
    else this.setEndCurveOrigin(mid)
  }
  //METH: setMinEndCorner() : null : set the end corner to the minimum distance from the end point
  setMinEndCorner(replace = false) { this.addDistancedEndCornerVerts(this.cellRadius, replace) }
  //METH: setEndCurveOrigin() : null : set the end curve origin to a vertex
  setEndCurveOrigin(vert) { return this.#setCurveOrigin(vert) }
  //METH: replaceEndCurveOrigin() : null : replace the end curve origin with a vertex
  replaceEndCurveOrigin(vert) { return this.#setCurveOrigin(vert, true) }
  //METH: setEndRadiantOutWrapsOrigin() : null : set the end radiant outwraps origin to a vertex
  setEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert) }
  //METH: replaceEndRadiantOutWrapsOrigin() : null : replace the end radiant outwraps origin with a vertex
  replaceEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert, true) }
  //METH: setRadiantOrigin() : null : set the radiant origin to a vertex
  #setRadiantOrigin(vert, replace = false, start = false, out = true) {
    if (vert) this.#setCurveOrigin(vert, replace, start)
    const
      radWrappers = out ? this.radiantOutWrappers : this.radiantInWrappers,
      allWrappers = out ? this.outWrappers : this.inWrappers
    radWrappers?.forEach(w => w.#setCurveOrigin(this.arcOrigin, replace, start))
    if (allWrappers?.length > radWrappers?.length && replace) {
      const last = radWrappers.last
      DeBug.log(`setRadiantOrigin last`, last)
      if (last.flushOutWrapper) last.flushWrap(true)
      else last.adjWrap(true)
      last.outWrapper.replaceEndRadiantOutWrapsOrigin()
    }
  }
  //METH: setCurveOrigin() : null : set the curve origin to a vertex
  #setCurveOrigin(toVert, replace = false, start = false) {
    const seg = start ? this.startNeighbor : this             // seg/corner to reference
    let report = false                                                                                  //LOGGING:
    if (this.id.includes('cel000')                                                                     //LOGGING:
      // || this.id.includes('cell185')                                                                       //LOGGING:
      // || s.id.includes('cell001')                                                                       //LOGGING:
    ) { report = true }                                                                                 //LOGGING:
    if (report) {                                                                                       //LOGGING:
      DeBug.error(`setCurveOrigin this`, this.id)                                                     //LOGGING:
      DeBug.log(`setCurveOrigin seg`, seg)                                                          //LOGGING:
      DeBug.log(`currentRadius`, seg.arcRadius)
      DeBug.log(`currentOrigin`, seg.arcOrigin)                                                       //LOGGING:
      DeBug.log(`seg.viableArcOrigins`, seg.viableArcOrigins)                                         //LOGGING:
      DeBug.log(`toVert`, toVert)                                                                     //LOGGING:
    }
    if (seg.viableArcOrigins.some(v => toVert.equals(v, 1, 0.1))) {
      const
        intersect = seg.perpendicularIntersectionWith(toVert),
        newRadius = toVert.dist(intersect)
      if (report) {                                                                                     //LOGGING:
        // DeBug.log(`intersect`, intersect)                                                             //LOGGING:
        DeBug.log(`newRadius`, newRadius)                                                             //LOGGING:
      }
      seg.addDistancedEndCornerVerts(newRadius, replace)
    }
  }
  //METH: #addCubicVert() : null : add a cubic vert to the segment
  #addCubicVert(
    vert,                                                   // Vertex : the vertex to add                 
    replace = false,                                        // Bool : replace the existing cubic vert
    start = false,                                          // Bool : add to the start or end of the segment
    usePoints = false                                       // Bool : use the points array to find the vertex
  ) {
    // DeBug.error("CUBIC VERT CREATED!", start ? "start" : "end");
    // DeBug.trace(); // This will show the call stack
    const mode = start ? 'Start' : `End`
    let report = false
    // if (
    // this.id.includes('cel008')                                                                        //LOGGING:
    // || this.id.includes('cell185')                                                                    //LOGGING:
    // || this.id.includes('cell001')                                                                    //LOGGING:
    // ) report = true                                                                                     //LOGGING:
    if (report) {                                                                                       //LOGGING:
      DeBug.warn(`addCubic${mode}Vert: ${vert?.string}`, this)                                          //LOGGING:
      DeBug.log(`hasCubicStartVert: ${this.hasCubicStartVert}`)                                         //LOGGING:
      if (this.availableStartLength) DeBug.log(`availableStartLength: ${this.availableStartLength}`)    //LOGGING:
      DeBug.log(`hasCubicEndVert: ${this.hasCubicEndVert}`)                                             //LOGGING:
      if (this.availableEndLength) DeBug.log(`availableEndLength: ${this.availableEndLength}`)          //LOGGING:
    }

    const cubicVert = start ? this.cubicVerts.start : this.cubicVerts.end
    if (cubicVert && !replace) return                        // if cubicVert already exists, don't replace it

    if (vert instanceof Vertex) {                            // vert is valid Vertex
      if (!this.vertIsOnLine(vert)) {                        // vert is not on the segment, bail out
        DeBug.error(`trying to assign a cubicVert that is not on this segment`)
        DeBug.log(`off-line vert`, vert)
        DeBug.log(`this.segment`, this)
        return
      }

      const matchingPoint = this.points.find(p => p.equals(vert, 1)) // find matching point in points array

      if (!matchingPoint && usePoints) {                     // if usePoints but no matching point, bail out
        DeBug.error(`trying to assign a cubicVert that is not a functional point on this segment`)
        DeBug.log(`bad vert`, vert)
        DeBug.log(`this.points`, this.points)
        return
      }

      if (start) this.cubicVerts.start = usePoints ? matchingPoint : vert   // set/replace start cubic vert
      else this.cubicVerts.end = usePoints ? matchingPoint : vert           // set/replace end cubic vert

      this.#resetMemoProps()                                 // reset memoized properties
      if (report) {
        DeBug.log(`this.cubicStartVert: ${this.cubicVerts.start?.string}`)
        DeBug.log(`this.cubicEndVert: ${this.cubicVerts.end?.string}`)
        DeBug.log(`new available${mode}Length:`, start ? this.availableStartLength : this.availableEndLength)
      }
    }
  }

  //METH: #resetMemoProps() : null : reset memoized properties
  #resetMemoProps(andNeighbors = true) {
    const segs = andNeighbors ? this.andNeighborsArray : [this]
    segs.forEach(s => {
      resetMemoized(s,
        `adjDistanceObjs`,
        `arcCenterTangent`,
        `arcCenterVert`,
        `arcOrigin`,
        `arcOriginCorner`,
        `arcOriginToStart`,
        `arcOriginToNormal`,
        `arcOriginToEnd`,
        `arcOriginToArcCenter`,
        `arcRadius`,
        `adjWrapperObjsFinal`,
        `flatAmount`,
        `hasNoFlatness`,
        `hasCompleteStartCorner`,
        `hasCompleteEndCorner`,
        `inWrappers`,
        `outWrappers`,
        `outWrapsOfThisShapeAndNeighbors`,
        `overlapSegs`,
      )
    })
  }
  // #endregion  
  // //MARK: Combined Cubic Verts
  // #region Combined Cubic Verts
  get maxCubicLength() { return this.length - this.cellRadius * this.insetScale }
  get hasArc() { return this.hasCubicEndVert && this.endNeighbor.hasCubicStartVert }

  get hasCompleteStartCorner() {
    return memoize(() => {
      return this.startNeighbor.hasCubicEndVert && this.hasCubicStartVert
        && equalsRoundedDec(this.startNeighbor.availableEndLength, this.availableStartLength)
    }, `hasCompleteStartCorner`).call(this)
  }
  get hasCompleteEndCorner() {
    return memoize(() => {
      return this.hasCubicEndVert && this.endNeighbor.hasCubicStartVert
        && equalsRoundedDec(this.availableEndLength, this.endNeighbor.availableStartLength)
        && roundToDec(this.availableEndLength, 1) >= roundToDec(this.cellRadius, 1)
    }, `hasCompleteEndCorner`).call(this)
  }
  get hasBothCompleteCorners() { return this.hasCompleteStartCorner && this.hasCompleteEndCorner }

  // #endregion
  //MARK: Flatness
  // #region Flatness
  get flatAmount() {
    return memoize(() => {
      return this.finalCubicStartVert.dist(this.finalCubicEndVert)
    }, `flatAmount`).call(this)
  }
  get hasNoFlatness() {
    return memoize(() => {
      return roundToDec(this.flatAmount, 1) === 0
    }, `hasNoFlatness`).call(this)
  }
  get hasFlatness() { return !this.hasNoFlatness }
  get hasFlatEndNeighbor() { return this.endNeighbor.hasFlatness }

  get canCurveMoreAtEnd() { return this.hasFlatness && this.hasFlatEndNeighbor }
  get canCurveLessAtEnd() { return roundToDec(this.availableEndLength, 1) > roundToDec(this.cellRadius, 1) }

  get couldCurveMoreMoreAtEnd() { return this.arcRadius < this.maxArcRadius }
  // #endregion
  //MARK: Corner Arc
  // #region Corner Arc
  get arcRadius() {
    return memoize(() => {
      return min(this.availableEndLength, this.endNeighbor.availableStartLength)
    }, `arcRadius`).call(this)
  }

  //METH: pointOnArcRotFromStart() : Vertex : get point on arc given rotation from start to end
  pointOnArcRotFromStart(deg, current = true, max = true) {
    deg = this.isOutsideCorner ? deg : -deg
    let origin, originToStart
    if (current) {
      origin = this.arcOrigin
      originToStart = this.arcOriginToStart
    } else {
      origin = max ? this.maxArcOrigin : this.minArcOrigin
      originToStart = max ? segment(origin, this.maxStartCorner) : segment(origin, this.minStartCorner)
    }
    return Vertex.add(origin, originToStart.lineVector.rotate(deg))
  }

  get arcCenterVert() {
    return memoize(() => {
      return this.pointOnArcRotFromStart(45)
    }, `arcCenterVert`).call(this)
  }
  get arcStartCorner() { return this.finalCubicEndVert }
  get arcNormalCorner() { return this.end }
  get arcEndCorner() { return this.endNeighbor.finalCubicStartVert }

  get arcOrigin() {
    return memoize(() => {
      if (!this.hasArc) return this.maxArcOrigin
      return Vertex.add(this.arcStartCorner, segment(this.arcNormalCorner, this.arcEndCorner).lineVector)
    }, `arcOrigin`).call(this)
  }
  get middleArcOrigin() {
    return memoize(() => {
      const
        radius = min(this.length, this.endNeighbor.length) / 2,
        arcStartCorner = this.distancedEndPoint(radius),
        arcEndCorner = this.endNeighbor.distancedStartPoint(radius)
      return Vertex.add(arcStartCorner, segment(this.arcNormalCorner, arcEndCorner).lineVector)
    }, `middleArcOrigin`).call(this)
  }
  get arcOriginToStart() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcStartCorner)
    }, `arcOriginToStart`).call(this)
  }
  get arcOriginToNormal() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcNormalCorner)
    }, `arcOriginToNormal`).call(this)
  }
  get arcOriginToEnd() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcEndCorner)
    }, `arcOriginToEnd`).call(this)
  }
  get arcOriginToArcCenter() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcCenterVert)
    }, `arcOriginToArcCenter`).call(this)
  }

  get arcNormalDirection() {
    return this.isOutsideCorner ? this.normals.end : this.normals.end.opposites
  }
  get arcBounds() { if (this.hasArc) return this.arcOriginToNormal.bounds }
  get arcBoundsHorizontal() {
    if (this.arcBounds) return { xMin: 0, xMax: 100, yMin: this.arcBounds.yMin, yMax: this.arcBounds.yMax }
  }
  get arcBoundsVertical() {
    if (this.arcBounds) return { xMin: this.arcBounds.xMin, xMax: this.arcBounds.xMax, yMin: 0, yMax: 200 }
  }
  get arcCenterMidPointTangent() {
    const
      start = this.arcOriginToArcCenter.mid,
      radius = this.arcRadius * 2.8,
      vect = this.arcNormalDirection.toLeft.lineVector.setMag(radius),
      end = Vertex.add(vect, start)
    return segment(start, end)
  }
  get hasMinArcRadius() { return equalsRoundedDec(this.maxArcRadius, this.cellRadius, 0) }

  //MARK: Max and Min Possible Arcs 
  get currentMaxArcRadius() { return min(this.maxAvailableEndLength, this.endNeighbor.maxAvailableStartLength) }
  get currentMaxStartCorner() { return this.distancedEndPoint(this.currentMaxArcRadius) }
  get currentMaxEndCorner() { return this.endNeighbor.distancedStartPoint(this.currentMaxArcRadius) }
  get currentMaxArcOrigin() {
    if (this.hasNoFlatness) return this.arcOrigin
    if (this.hasArc)
      return Vertex.add(this.currentMaxStartCorner, segment(this.arcNormalCorner, this.currentMaxEndCorner).lineVector)
    else return this.maxArcOrigin
  }
  get isUsingMiddleOrigin() { return this.arcOrigin.equals(this.middleArcOrigin, 1) }
  get canCurveToMiddleOrigin() { return this.canCurveTo(this.middleArcOrigin) }

  get maxCornerBounds() { return segment(this.start, this.endNeighbor.end).bounds }
  get maxArcRadius() {
    return memoize(() => {
      return approxToDec(min(this.maxCubicLength, this.endNeighbor.maxCubicLength), 4, 2)
    }, `maxArcRadius`).call(this)
  }
  get maxStartCorner() {
    return memoize(() => {
      return this.distancedEndPoint(this.maxArcRadius)
    }, `maxStartCorner`).call(this)
  }
  get maxEndCorner() {
    return memoize(() => {
      return this.endNeighbor.distancedStartPoint(this.maxArcRadius)
    }, `maxEndCorner`).call(this)
  }
  get maxArcOrigin() {
    return memoize(() => {
      return Vertex.add(this.maxStartCorner, segment(this.arcNormalCorner, this.maxEndCorner).lineVector)
    }, `maxArcOrigin`).call(this)
  }
  get maxArcBoundsSeg() {
    return memoize(() => {
      return segment(this.maxArcOrigin, this.arcNormalCorner)
    }, `maxArcBoundsSeg`).call(this)
  }
  get maxArcBounds() {
    return memoize(() => {
      return this.maxArcBoundsSeg.bounds
    }, `maxArcBounds`).call(this)
  }
  get maxArcCells() {                                                                             //UNUSED:
    return memoize(() => {
      return this.grid.cellSpanBetween(this.cells[0].index, this.endNeighbor.cells.last.index)
      // .intersect(this.shape.cells, `id`)
    }, `maxArcCells`).call(this)
  }
  get minArcRadius() {
    return memoize(() => {
      return approxToDec(min(this.cellRadius), 4, 1)
    }, `minArcRadius`).call(this)
  }
  get minStartCorner() {
    return memoize(() => {
      return this.distancedEndPoint(this.minArcRadius)
    }, `minStartCorner`).call(this)
  }
  get minEndCorner() {
    return memoize(() => {
      return this.endNeighbor.distancedStartPoint(this.minArcRadius)
    }, `minEndCorner`).call(this)
  }
  get minArcOrigin() {
    return memoize(() => {
      return Vertex.add(this.minStartCorner, segment(this.arcNormalCorner, this.minEndCorner).lineVector)
    }, `minArcOrigin`).call(this)
  }
  get minArcBoundsSeg() {
    return memoize(() => {
      return segment(this.minArcOrigin, this.arcNormalCorner)
    }, `minArcBoundsSeg`).call(this)
  }
  get minArcBounds() {
    return memoize(() => {
      return this.minArcBoundsSeg.bounds
    }, `minArcBounds`).call(this)
  }
  get viableArcOriginsSeg() {
    return memoize(() => {
      return segment(this.minArcOrigin, this.maxArcOrigin)
    }, `viableArcOriginsSeg`).call(this)
  }
  get viableArcOrigins() {
    return memoize(() => {
      if (this.hasMinArcRadius) return OpArray.format(this.maxArcOrigin)      // minArcRadius corners have single origin

      const
        horAspect = this.grid.cellAspect.isLandscape,                         // need aspect to know minCellWidth axis
        refSeg = horAspect === this.isVertical ? this : this.endNeighbor,     // seg to reference points from
        refPoints = refSeg.points.slice(1, -1)                                // remove first & last, cant be arcOrigins
      // DeBug.log(``)                                                                                //LOGGING:
      // DeBug.log(`viableArcOrigins()`, this)                                                        //LOGGING:
      // DeBug.log(`viableArcOrigins() horAspect`, horAspect)                                         //LOGGING:
      // DeBug.log(`refPoints`, refPoints)                                                            //LOGGING:
      // DeBug.log(`this.viableArcOriginsSeg`, this.viableArcOriginsSeg)                              //LOGGING:
      let projectedPoints = refPoints.map(p => {
        const
          projEnd = Vertex.add(refSeg.direction.toLeft.lineVector, p),
          projSeg = segment(p, projEnd),
          points = this.viableArcOriginsSeg.intersectionWith(projSeg, true)
        // DeBug.log(`projEnd`, projEnd)                                                              //LOGGING:
        // DeBug.log(`projSeg`, projSeg)                                                              //LOGGING:
        // DeBug.log(`points`, points)                                                                //LOGGING:
        if (points instanceof Vertex) return points
        if (points instanceof Segment) return points.start
      })
      // DeBug.log(`viableArcOrigins projectedPoints`, projectedPoints)                               //LOGGING:
      const viables = projectedPoints
        .filter(p => this.viableArcOriginsSeg.vertIsOnLine(p))
        .gridVertSorted
        .filter((p, i, a) => !p.equals(a.at(i - 1), 1))
      // DeBug.log(`filtered viables`, viables)                                                       //LOGGING:
      return !viables.isEmpty ? viables : OpArray.format([this.viableArcOriginsSeg.start])
    }, `viableArcOrigins`).call(this)
  }
  get currentViableArcOrigins() {
    // DeBug.error(`currentViableArcOrigins`, this)                                                   //LOGGING:
    // DeBug.log(`currentViableArcOrigins viableArcOrigins`, this.viableArcOrigins)                   //LOGGING:
    if (this.viableArcOrigins.length === 1) return this.viableArcOrigins
    //FIXME: startBounds and endBounds should stretch to edges
    const
      startBounds = this.isVertical ?
        this.startNeighbor.arcBoundsHorizontal : this.startNeighbor.arcBoundsVertical,
      endBounds = this.endNeighbor.isVertical ?
        this.endNeighbor.arcBoundsHorizontal : this.endNeighbor.arcBoundsVertical,
      viables = this.viableArcOrigins.filter(v =>
        !vertIsWithinBounds(v, startBounds, false, 2)
        && !vertIsWithinBounds(v, endBounds, false, 2))
    // DeBug.log(`currentViableArcOrigins startBounds`, startBounds)                                  //LOGGING:
    // DeBug.log(`currentViableArcOrigins endBounds`, endBounds)                                      //LOGGING:
    // DeBug.log(`currentViableArcOrigins viables`, viables)                                          //LOGGING:
    return viables
  }
  get currentViableArcOriginsSeg() {
    const viables = this.currentViableArcOrigins
    // DeBug.log(`currentViableArcOriginsSeg`, viables)
    if (!viables.isEmpty) return segment(viables.first, viables.last)
  }

  //MARK: Edges
  get adjStartShapeBoundsEdge() {
    const
      dir = this.normals.cubic,
      arcDir = this.startNeighbor.isOutsideCorner ? dir : dir.opposites
    return this.shape.sides[arcDir.name]
  }
  get adjEndShapeBoundsEdge() {
    const
      dir = this.normals.cubic,
      arcDir = this.isOutsideCorner ? dir : dir.opposites
    return this.shape.sides[arcDir.name]
  }
  get arcStartToShapeBoundsEdgeSeg() {
    const edgeIntersect = this.arcOriginToStart.intersectionWith(this.adjEndShapeBoundsEdge, true)
    return segment(this.arcStartCorner, edgeIntersect)
  }
  get arcEndToShapeBoundsEdgeSeg() {
    const edgeIntersect = this.arcOriginToEnd.intersectionWith(this.endNeighbor.adjStartShapeBoundsEdge, true)
    return segment(this.arcEndCorner, edgeIntersect)
  }

  //MARK: Corner Orientations
  get inShapeSameFacingCorners() {
    return memoize(() => {
      if (!this.shape) { DeBug.log(this) }
      return this.shape.simpleSubShapes.flat().exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `inShapeSameFacingCorners`).call(this)
  }
  get andNeighborSameFacingCorners() {
    return memoize(() => {
      return this.shape.andNeighborSimples.exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `andNeighborSameFacingCorners`).call(this)
  }

  // get diagonalCornersInShape() {                                                                        //UNUSED:
  //   return memoize(() => {
  //     return this.shape.simpleSubShapes.flat().exclude(this, 'id')
  //       .filter(s => this.hasDiagonalCorner(s))
  //   }, `inShapeDiagonalCorners`).call(this)
  // }
  // get diagonalCornersInNeighborShapes() {                                                                        //UNUSED:
  //   return memoize(() => {
  //     return this.shape.andNeighborSimples.exclude(this, 'id')
  //       .filter(s => this.hasDiagonalCorner(s))
  //   }, `neighborDiagonalCorners`).call(this)
  // }

  //METH: minArcIsWithinThatMaxArc() : BOOL : test if this minArcBounds is within that maxArcBounds
  minArcIsWithinThatMaxArc(thatSeg) { return boundsIsWithinTestBounds(this.minArcBounds, thatSeg.maxArcBounds) }
  //METH: minArcIsWithinThatCornerBounds() : BOOL : test if this minArcBounds is within that maxCornerBounds
  minArcIsWithinThatCornerBounds(thatSeg) { return boundsIsWithinTestBounds(this.minArcBounds, thatSeg.maxCornerBounds) }
  //METH: hasSameFacingCorner() : BOOL : test if this endCorner is the same as that seg's endCorner
  hasSameFacingCorner(seg) { return this.endCorner.equals(seg.endCorner) }
  //METH: isDiagonalCorner() : BOOL : test if this endCorner is the same as that seg's endCorner
  hasDiagonalCorner(seg) {
    const
      facing = this.hasSameFacingCorner(seg),
      colBoundsSeg = this.maxArcBoundsSeg.isCollinearWith(seg.maxArcBoundsSeg)
    return facing && colBoundsSeg
  }
  //METH: hasCollinearCorner() : BOOL : test if this endCorner is collinear with that seg's endCorner
  hasCollinearCorner(seg) {
    const
      facing = this.hasSameFacingCorner(seg),
      collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
        || this.endNeighbor.isCollinearWith(seg) || this.endNeighbor.isCollinearWith(seg.endNeighbor),
      sharedCorner = this.end.equals(seg.end, 0)
    return facing && collinear && !sharedCorner
  }
  //METH: hasCoincidentCorner() : BOOL : test if this endCorner is coincident with that seg's endCorner
  hasCoincidentCorner(seg) {
    const
      diagonal = this.hasDiagonalCorner(seg),
      collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
        || this.endNeighbor.isCollinearWith(seg) || this.endNeighbor.isCollinearWith(seg.endNeighbor),
      sharedCorner = this.end.equals(seg.end, 1, 0.1)
    return diagonal && collinear && sharedCorner
  }
  //METH: couldHaveInWrapper(seg) : BOOL : test if this seg could have an inWrapper with that seg (does not check orientation)
  couldHaveInWrapper(seg) {
    if (this.hasCoincidentCorner(seg)) {
      if (seg.isOutsideCorner === this.isOutsideCorner)
        return boundsIsWithinTestBounds(seg.shape.bounds, this.shape.bounds)
      else return seg.isOutsideCorner                            // this is insideCorner and seg is outsideCorner
      // const inSameShape = this.shape.id === seg.shape.id
      // return inSameShape === this.isOutsideCorner
    }
    else return seg.minArcIsWithinThatMaxArc(this)
  }
  //METH: inOutWrapObjWith(seg) : {inWrapper, outWrapper} : determine which segs are in and out wrappers
  inOutWrapObjWith(seg) {
    const inOut = this.couldHaveInWrapper(seg) ? [seg, this] : [this, seg]
    return { inWrapper: inOut[0], outWrapper: inOut[1] }
  }
  //METH: horVertInOutsSideObjWith(seg) : Object : determine relational positions of corner segs
  horVertInOutsSideObjWith(seg) {
    const
      { inWrapper, outWrapper } = this.inOutWrapObjWith(seg),
      [[horInSide, vertInSide], [horOutSide, vertOutSide]] = [inWrapper.horVertSides, outWrapper.horVertSides]
    return { horInSide: horInSide, vertInSide: vertInSide, horOutSide: horOutSide, vertOutSide: vertOutSide }
  }

  get shapesWithinThisMaxArcBounds() {
    return memoize(() => {
      return this.grid.perimeterShapes.filter(shp => {
        if (shp.id === this.shape.id) return true                       // always true for this.shape
        const cells = this.isOutsideCorner ?                            // cells to check intersect with
          this.shape.enclosedCells                                      // outside: enclosedCells to capture inner shapes
          : this.grid.cellsWithinBounds(this.maxArcBounds)              // inside: check cells within maxArcBounds
        if (boundsOverlap({ geo: [this.maxArcBounds, shp.bounds] }))    // test bounds overlap
          return !cells.intersect(shp.cells, `id`).isEmpty
      })
    }, `shapesWithinThisMaxArcBounds`).call(this)
  }
  get viableInWrappers() {         // same facing corners within this max arc bounds
    return memoize(() => {
      const segs = this.grid.isBackGrid ?                               // handle backGrid differently
        this.grid.frontGrid.allSimpleSubShapesSegs : this.shapesWithinThisMaxArcBounds.map(sh => sh.simpleSubShapes).flat(2)
      return segs
        .filter(s => s.id !== this.id
          && this.hasSameFacingCorner(s)
          && s.minArcIsWithinThatMaxArc(this)
        )
        .sort((a, b) => a.minArcOrigin.dist(this.end) - b.minArcOrigin.dist(this.end))
    }, `viableInWrappers`).call(this)
  }
  get viableOutWrappers() {         // arcs containing this arc
    return memoize(() => {
      const segs = this.grid.isFull ?
        this.andNeighborSameFacingCorners :
        this.grid.allSimpleSubShapesSegs
          .exclude(this, 'id')
          .filter(s => this.hasSameFacingCorner(s))
      return segs.filter(s => this.minArcIsWithinThatMaxArc(s) || this.minArcIsWithinThatCornerBounds(s))
    }, `viableOutWrappers`).call(this)
  }
  get viableWrappers() {            // all possible wrappers
    return memoize(() => {
      return this.viableOutWrappers.union(this.viableInWrappers, `id`)
        .sort((a, b) => a.minArcOrigin.dist(this.end) - b.minArcOrigin.dist(this.end))
      return viables
    }, `viableWrappers`).call(this)
  }

  //MARK: FLUSH WRAPPING
  //METH: findFlushDistanceObjs : [Object] : find the closest flush wrappers to the start and end corners
  findFlushDistanceObjs(viables = this.viableWrappers) {
    if (viables.isEmpty) return viables                       // if no viable wrappers, return empty array

    //ARROW: closest() :   
    const closest = (segs, start) => {
      const
        testSeg = start ? this : this.endNeighbor,            // seg to test against
        name = start !== this.isOutsideCorner ? `arcStartCorner` : `arcEndCorner` // choose arcCorner that's collinear 
      return segs
        .filter(s => {
          const testVertsSeg = testSeg.isHorizontal ? s.horVertSides[0] : s.horVertSides[1]
          return testSeg.vertIsOnLine(testVertsSeg.start) || testSeg.vertIsOnLine(testVertsSeg.end)
            || testVertsSeg.vertIsOnLine(testSeg.start) || testVertsSeg.vertIsOnLine(testSeg.end)
            && (this.hasCollinearCorner(s) || this.hasCoincidentCorner(s))
        })
        .map(s => {                                           // map to obj with dist to corner calculated
          return { id: s.id, seg: s, dist: roundToDec(this.end.dist(s[name]), 4), isStart: !start }
        })
        .sort((a, b) => a.dist - b.dist)                      // sort by closest to furthest
    }
    const
      startWraps = closest(viables, true),                    // calculate closest obj on corner start
      endWraps = closest(viables, false)                      // calculate closest obj on corner end
    if (!startWraps.isEmpty && !endWraps.isEmpty)             // if both start and end wraps exist, union them
      return startWraps.union(endWraps, `id`)
    else if (!startWraps.isEmpty) return startWraps           // if only start wraps exist, return them
    else if (!endWraps.isEmpty) return endWraps               // if only end wraps exist, return them
    else return new OpArray                                   // if neither exist, return empty array
  }
  get flushDistanceObjs() {
    if (this.viableWrappers.isEmpty) return this.viableWrappers
    return this.findFlushDistanceObjs()
  }
  get flushIntersectObjs() {
    const flushWraps = this.flushDistanceObjs
    return flushWraps
      .map(obj => this.intersectObj(obj.seg, obj.isStart))
      .sort((a, b) => a.dist - b.dist)
  }
  get flushWrapperObjsFinal() {
    const intersectWraps = this.flushIntersectObjs
    return intersectWraps
      .filter(obj => obj.dist === intersectWraps[0].dist)
      .sort((a, b) => b.isStart - a.isStart)
  }
  get flushWrappersFinal() { return this.flushWrapperObjsFinal.map(obj => obj.seg) }
  get flushWrapper() { return this.flushWrappersFinal[0] }

  get coincidentWrapper() {
    // return memoize(() => {
    if (this.flushWrapper?.hasCoincidentCorner(this)) return this.flushWrapper
    // }, `coincidentWrapper`).call(this)
  }
  get collinearWrapper() {
    // return memoize(() => {
    if (this.flushWrapper?.hasCollinearCorner(this)) return this.flushWrapper
    // }, `collinearWrapper`).call(this)
  }

  get flushIsInWrapper() { if (this.flushWrapper) return this.couldHaveInWrapper(this.flushWrapper) }
  get flushOutWrapper() { if (!this.flushIsInWrapper) return this.flushWrapper }
  get flushInWrapper() { if (this.flushIsInWrapper) return this.flushWrapper }

  get coinOutWrapper() { if (this.isOutsideCorner) return this.coincidentWrapper }
  get coinInWrapper() { if (!this.isOutsideCorner) return this.coincidentWrapper }
  get colOutWrapper() { if (this.isOutsideCorner) return this.collinearWrapper }
  get colInWrapper() { if (!this.isOutsideCorner) return this.collinearWrapper }

  //MARK: ADJACENT WRAPPING
  //METH: minAdjWrapperDistanceObj() : [Object] : find the closest adjacent wrappers to the start and end corners
  //FIXME: there are issues, especially with non-square cell aspects triggering the longer intersect corners
  //FIXME: ultimately all wrappers (flush+adj) should be wrapped in one object, using tangX to choose wrapper
  minAdjWrapperDistanceObj(seg) {
    const
      { inWrapper, outWrapper } = this.inOutWrapObjWith(seg),                     // calc inOutWraps
      { horInSide, vertInSide, horOutSide, vertOutSide } = this.horVertInOutsSideObjWith(seg), // horVertInOuts
      vertDist = vertInSide.x - vertOutSide.x,                                    // calc dist between vertSides
      horDist = horInSide.y - horOutSide.y,                                       // calc dist between horSides
      dists = inWrapper.isVertical ? [vertDist, horDist] : [horDist, vertDist],   // organize into [start,end]
      [startDist, endDist] = dists.map(d => abs(roundToDec(d), 1)),               // simplify for later comparison

      tangent = inWrapper.arcCenterMidPointTangent,                               // calc arcCenterMidPointTangent
      tangentIntersect = tangent.intersectionWith(outWrapper, true),              // calc intersection
      tangDist = roundToDec(tangentIntersect.dist(outWrapper.end), 2),            // calc dist from intersect to corner

      [startObj, endObj] = dists.map(d => abs(roundToDec(d), 1))                  // map to objects
        .map((d, i) => {
          return { seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: d, isStart: i === 0 }
        })

    if (startDist === endDist) return [startObj, endObj]                          // return closest object(s) 
    else if (                                 // if start and end distances are not equal, return the one that is closer
      (inWrapper.isOutsideCorner !== outWrapper.isOutsideCorner
        && startDist < endDist)
      || (inWrapper.isOutsideCorner === outWrapper.isOutsideCorner
        && startDist > endDist)
    ) return startObj
    else return endObj
  }
  //METH: intersectObj() : [Object] : find the closest intersection between this and the seg
  intersectObj(seg, isStart) {
    const
      { inWrapper, outWrapper } = this.inOutWrapObjWith(seg),                    // calc inOutWraps
      side = isStart ? outWrapper.endNeighbor : outWrapper, //FIXME: seems opposite? // calc side     
      //FIXME: test this works with flush (collinear) wraps   
      intersect =
        side.perpendicularIntersectionWith(inWrapper.arcOrigin)
        || side.perpendicularIntersectionWith(inWrapper.minArcOrigin),          // calc intersection
      distToCorner = roundToDec(intersect.dist(outWrapper.end))                 // calc distance
    return { seg: seg, dist: distToCorner, intersect: intersect, isStart: isStart }
  }

  get adjDistanceObjs() {
    // return memoize(() => {
    //ARROW: canHaveCorrectBounds() : Bool : 
    const canHaveCorrectBounds = (seg) => {
      if (this.shape.neighborShapes.isEmpty) return seg.minArcIsWithinThatCornerBounds(this) || this.minArcIsWithinThatCornerBounds(seg)
      else return this.isOutsideCorner ? seg.minArcIsWithinThatCornerBounds(this) : this.minArcIsWithinThatCornerBounds(seg)
    }
    //ARROW: canHaveCorrectSize() : Bool : 
    const canHaveCorrectSize = (seg) => {             // this radius should be either larger or smaller than adjWrap
      return this.isOutsideCorner ?
        roundToDec(this.maxArcRadius, 2) > roundToDec(this.cellRadius, 2)   // bigger when this is OutsideCorner
        : roundToDec(this.cellRadius, 2) < roundToDec(seg.maxArcRadius, 2)  // smaller when this is InsideCorner
    }
    let adjWraps = this.viableWrappers
      .filter(s =>
        this.hasSameFacingCorner(s)                                         // same facing corners
        && !this.hasCoincidentCorner(s)                                     // coincident corners would mean flush
        && !this.hasCollinearCorner(s)                                      // collinear corners would mean flush
        && canHaveCorrectBounds(s)                                          // canHaveCorrectBounds? 
        && canHaveCorrectSize(s)                                            // canHaveCorrectSize? 
      )
      .map(s => this.minAdjWrapperDistanceObj(s)).flat()
      .sort((a, b) => a.dist - b.dist)
      .sort((a, b) => a.tangDist - b.tangDist)
    return adjWraps
    // }, `adjDistanceObjs`).call(this)
  }
  get adjIntersectObjs() {
    //ARROW: inOutSorted()  : [Object] : sort the objects based on their in/out wrapper status
    const inOutSorted = (objs) => {
      if (objs.length > 1) {                                              // there are two or more wrappers that are coincident pair
        if (objs.length > 2) {                                            // wrappers are diagonal so start/end for each seg
          let newObjs = new OpArray
          objs.forEach(obj => {                                           // filter out repeat seg objs
            if (newObjs.isEmpty                                           // first obj
              || !newObjs.some(newObj => newObj?.seg.id === obj.seg.id))  // if not already in newObjs
              newObjs.push(obj)
          })
          objs = newObjs
        }

        if (this.couldHaveInWrapper(objs[0].seg))                         // objs are inWrappers
          return objs.sort((a, b) => b.seg.couldHaveInWrapper(a.seg) - a.seg.couldHaveInWrapper(b.seg))
        else                                                              // objs are outWrappers
          return objs.sort((a, b) => a.seg.couldHaveInWrapper(b.seg) - b.seg.couldHaveInWrapper(a.seg))
      } else return objs                                                  // only single wrapper
    }

    const
      adjWraps = this.adjDistanceObjs,
      wrapsAreCoincident = adjWraps[1]?.seg.hasCoincidentCorner(adjWraps[0].seg)
    let finalWraps

    if (wrapsAreCoincident) finalWraps = adjWraps                         // adjWraps are coincident
    else finalWraps = adjWraps                                            // adjWraps are not coincident    
      .filter(obj =>
        obj.tangDist === adjWraps[0].tangDist
        && obj.dist === adjWraps[0].dist
      )

    finalWraps = inOutSorted(finalWraps)                                  // sort the objects by in/out wrapper status
      .map(obj => this.intersectObj(obj.seg, obj.isStart))                // map to intersection object
    if (!wrapsAreCoincident) finalWraps = finalWraps.sort((a, b) => a.dist - b.dist)

    return finalWraps
  }
  get adjWrapperObjsFinal() {
    // return memoize(() => {
    const intersectWraps = this.adjIntersectObjs
    return intersectWraps
      .filter(obj => obj.dist === intersectWraps[0].dist)
    // .sort((a, b) => b.isStart - a.isStart)
    // }, `adjWrapperObjsFinal`).call(this)
  }
  get adjWrappersFinal() { return this.adjWrapperObjsFinal.map(obj => obj.seg) }
  get adjacentWrapper() {
    // return memoize(() => {
    return this.adjWrappersFinal[0]
    // }, `adjacentWrapper`).call(this)
  }

  get radiantWrapper() { }        //TODO: complete impltmentation         //UNUSED:
  get proximalWrapper() { }       //TODO: complete impltmentation         //UNUSED:

  get adjOutWrapper() { if (!this.isOutsideCorner) return this.adjacentWrapper }
  get adjInWrapper() { if (this.isOutsideCorner) return this.adjacentWrapper }

  //MARK: IN/OUT WRAPPING
  //FIXME: after wrapper calculation is combined (flush+adj) flushWrap and adjWrap should be removed, leaving single wrap method
  //METH: flushWrap() : null : perform flush wrapping
  flushWrap(replace = false, wrapOut = true) { return this.#wrap(true, replace, wrapOut) }
  //METH: adjWrap() : null : perform adjacent wrapping
  adjWrap(replace = false, wrapOut = true) { return this.#wrap(false, replace, wrapOut) }
  //METH: #wrap() : null : perform wrapping (adjust neighboring corner's arc to align with this corner)
  #wrap(flush, replace = false, wrapOut = true) {
    // DeBug.log(`wrap called`, this.id, flush, replace, wrapOut)                               //LOGGING:
    let wrapper = flush ? this.flushWrapper : this.adjacentWrapper
    const wrapType = flush ? `flushWrap()` : `adjWrap()`                                        //LOGGING:

    let report = false                                                                            //LOGGING:
    if (this.id.includes('cel00')                                                               //LOGGING:
      // || this.id.includes('cel027')                                                              //LOGGING:
    ) {                                                                                           //LOGGING:
      report = true                                                                               //LOGGING:
      DeBug.error(`${wrapType} called on:`, this)                                               //LOGGING:
      DeBug.log(`wrapper:`, wrapper)                                                            //LOGGING:
    }

    if (wrapper) {                                                                // has a flush wrapper
      // const [inWrapper, outWrapper] = flush ? this.inOutFlushWrappers : this.inOutAdjWrappers
      const viables = flush ? this.viableCoinWrapOrigins : this.viableAdjWrapOrigins
      if (report) {
        DeBug.log(`wrapper:`, wrapper.id)                                                       //LOGGING:
        DeBug.log(`viables:`, viables)                                                          //LOGGING:
      }

      if (this.hasArc) {                                                          // this has arc
        if (report) { DeBug.log(`this hasArc`) }                                                //LOGGING:

        if (wrapper.hasArc                                                        // both have arcs!
          && wrapper.arcOrigin.equals(this.arcOrigin, 2)) {                       // already flushly wrapped!
          if (report) DeBug.log(`already flushly wrapped!`)
          return
        }

        const
          target = wrapOut ? wrapper : this,
          source = wrapOut ? this : wrapper

        if (this.hasDiagonalCorner(wrapper)) {              // wraps are diagonal (COINCIDENT or CONCENTRIC)
          // if (report) {
          //   DeBug.log(`this.arcOrigin`, this.arcOrigin)                                           //LOGGING:
          //   DeBug.log(`${wrapType} cubicVerts before`, wrapper.cubicVerts)                        //LOGGING:
          // }
          if (replace                                                             // forced replacement
            || (flush ? this.flushWrapIsNonEquidistant : this.adjWrapIsNonEquidistant))  // nonEquidistant wrappers!
            target.replaceEndCurveOrigin(source.arcOrigin)                        // replace matching wrapper curve
          else target.setEndCurveOrigin(source.arcOrigin)                         // set matching wrapper curve
          // if (report) {                                                                           
          //   DeBug.log(`wrapper.setEndCurve`)                                                      //LOGGING:
          //   DeBug.log(`${wrapType} cubicVerts after`, wrapper.cubicVerts)                         //LOGGING:
          // }                                                                                      
        } else {                                            // wraps are NOT diagonal (instead are COLLINEAR or PROXIMAL)
          const obj = flush ? this.flushIntersectObjs[0] : this.adjIntersectObjs[0] // COLLINEAR or PROXIMAL
          if (obj) {
            if (report) {
              DeBug.log(`obj`, obj)                                                              //LOGGING:
              DeBug.log(`obj.dist`, obj.dist)                                                  //LOGGING:
              DeBug.log(`target.maxArcRadius`, target.maxArcRadius)                            //LOGGING:
            }
            if (roundToDec(obj.dist) <= roundToDec(target.maxArcRadius))            // previously COLL/PROX used (<)/(<=)
              target.addDistancedEndCornerVerts(obj.dist, true)
            else target.replaceEndCurveOrigin(target.currentMaxArcOrigin)
          }
        }
      } else {                                                                      // has NO arc
        if (report) DeBug.log(`this DOES NOT hasArc`)                                        //LOGGING:
        if (viables) {
          this.replaceEndCurveOrigin(viables.last)                                  // replace with largest viable
          wrapper.replaceEndCurveOrigin(viables.last)                               // replace with largest viable
        }
      }
    }
  }
  get outWrapper() {
    if (this.flushOutWrapper && this.adjOutWrapper) {           // has both flush and adj wrappers
      const
        flushDist = this.end.dist(this.flushOutWrapper?.end),
        adjDist = this.end.dist(this.adjOutWrapper?.end)
      if (flushDist < adjDist) return this.flushOutWrapper      // return closest
      else return this.adjOutWrapper
    }
    return this.flushOutWrapper || this.adjOutWrapper           // return whichever exists
  }
  get inWrapper() {
    if (this.flushInWrapper && this.adjInWrapper) {             // has both flush and adj wrappers
      const
        flushDist = this.end.dist(this.flushInWrapper?.end),
        adjDist = this.end.dist(this.adjInWrapper?.end)
      if (flushDist < adjDist) return this.flushInWrapper       // return closest
      else return this.adjInWrapper
    }
    return this.flushInWrapper || this.adjInWrapper             // return whichever exists
  }
  get outWrappers() {
    return memoize(() => {
      // DeBug.log(`this`, this)                                                                     //LOGGING:
      // DeBug.log(`outWrapper`, this.outWrapper)                                                    //LOGGING:
      // DeBug.log(this.outWrapper?.outWrappers)                                                      //LOGGING:
      if (this.outWrapper) return OpArray.format(this.outWrapper).union(this.outWrapper.outWrappers, `id`)
    }, `outWrappers`).call(this)
  }
  //MEMO: radiantOutWrappers
  get radiantOutWrappers() {
    return memoize(() => {
      //ARROW: filterRadiants() : [Object] : filter outWrappers for radiants
      const filterRadiants = (outWrappers) => {
        let radiants = new OpArray
        while (outWrappers.length > 0) {
          const wrapper = outWrappers.shift()
          if (wrapper.canRadiateTo(this)
            && wrapper.inWrapper?.canRadiateTo(wrapper)
            && this.hasDiagonalCorner(wrapper)
            && (wrapper.inWrapper.id === radiants.last?.id || radiants.isEmpty)
          ) radiants.push(wrapper)
          else outWrappers = []
        }
        return radiants
      }

      if (this.outWrappers) {                                       // this has outWrappers
        let wrappers
        if (this.isInnerMostWrapper && this.outWrapperIsRadiant) {  // this is innerMostWrapper and outWrapper is radiant
          wrappers = filterRadiants(this.outWrappers)
        } else {                                                    // this is NOT innerMostWrapper
          if (this.inWrapper?.canRadiateTo(this)) {                 // this inWrapper can radiate to this
            wrappers = this.innerMostRadiantWrapper.radiantOutWrappers?.intersect(this.outWrappers, `id`)
          } else if (this.outWrapperIsRadiant) {                    // this inWrapper can't radiate, but outWrapper is radiant
            wrappers = filterRadiants(this.outWrappers)
          }
        }
        if (!wrappers || !wrappers.isEmpty) return wrappers         // return wrappers or null
      }
    }, `radiantOutWrappers`).call(this)
  }
  get inWrappers() {
    return memoize(() => {
      if (this.inWrapper) return OpArray.format(this.inWrapper).union(this.inWrapper.inWrappers, `id`)
    }, `inWrappers`).call(this)
  }
  get radiantInWrappers() {
    return memoize(() => {
      if (this.inWrapperIsRadiant)
        return OpArray.format(this.inWrapper).union(this.inWrapper.radiantInWrappers, `id`)
    }, `radiantInWrappers`).call(this)
  }

  get inWrapperIsRadiant() { if (this.inWrapper) return this.canRadiateTo(this.inWrapper) }
  get outWrapperIsRadiant() { if (this.outWrapper) return this.canRadiateTo(this.outWrapper) }

  get hasWrappers() { return !!this.inWrappers || !!this.outWrappers }
  get isInnerMostWrapper() {
    return memoize(() => {
      return !!this.outWrappers && !this.inWrappers
    }, `isInnerMostWrapper`).call(this)
  }
  get isInnerMostRadiantWrapper() {
    return memoize(() => {
      return !!this.radiantOutWrappers && !this.radiantInWrappers
    }, `isInnerMostRadiantWrapper`).call(this)
  }
  get innerMostWrapper() { if (this.inWrappers) return this.inWrappers.filter(s => s.isInnerMostWrapper)[0] }
  get innerMostRadiantWrapper() {
    if (this.radiantInWrappers) return this.radiantInWrappers.last
    else if (this.radiantOutWrappers) return this
  }

  get isOuterMostWrapper() { return !!this.inWrappers && !this.outWrappers }
  get isOuterMostRadiantWrapper() { return !!this.radiantInWrappers && !this.radiantOutWrappers }
  get outerMostWrapper() { if (this.outWrappers) return this.outWrappers.filter(s => s.isOuterMostWrapper)[0] }
  get outerMostRadiantWrapper() {
    if (this.radiantOutWrappers) return this.radiantOutWrappers.last
    else if (this.radiantInWrappers) return this
  }

  get viableOutWrapOriginBounds() {
    return memoize(() => {
      if (this.outWrapper) return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.outWrapper.viableArcOriginsSeg] })
    }, `viableOutWrapOriginBounds`).call(this)
  }

  get viableCoinWrapOriginBounds() {
    return memoize(() => {
      if (this.coincidentWrapper) {
        return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.coincidentWrapper.viableArcOriginsSeg] })
      }
    }, `viableCoinWrapOriginBounds`).call(this)
  }
  get viableCoinWrapOrigins() {
    return memoize(() => {
      if (this.viableCoinWrapOriginBounds) {
        const origins = this.viableArcOrigins
          .filter(v => vertIsWithinBounds(v, this.viableCoinWrapOriginBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
        if (!origins.isEmpty) return origins
      }
    }, `viableCoinWrapOrigins`).call(this)
  }

  get viableAdjWrapOriginBounds() {
    // return memoize(() => {
    if (this.adjacentWrapper) {
      return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.adjacentWrapper.viableArcOriginsSeg] })
    }
    // }, `viableAdjWrapOriginBounds`).call(this)
  }
  get viableAdjWrapOrigins() {
    return memoize(() => {
      if (this.viableAdjWrapOriginBounds) {
        const origins = this.viableArcOrigins
          .filter(v => vertIsWithinBounds(v, this.viableAdjWrapOriginBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
        if (!origins.isEmpty) return origins
      }
    }, `viableAdjWrapOrigins`).call(this)
  }

  //MARK: RADIANT WRAPPING
  get viableRadOutWrappersOriginBounds() {
    // return memoize(() => {
    if (this.isInnerMostRadiantWrapper) {
      const viables = this.radiantOutWrappers
        .map(s => s.currentViableArcOriginsSeg)
      return boundsOverlap({ geo: [viables], accuracy: 0 })
    }
    // }, `viableRadOutWrappersOriginBounds`).call(this)
  }
  get viableRadiantOriginBounds() {
    return memoize(() => {
      if (this.isInnerMostRadiantWrapper && this.outerMostRadiantWrapper)
        return boundsOverlap({
          geo: [this.viableArcOriginsSeg, this.outerMostRadiantWrapper.viableArcOriginsSeg], accuracy: 0
        })
    }, `viableRadiantOriginBounds`).call(this)
  }
  get viableRadiantOrigins() {
    if (this.viableRadiantOriginBounds) {
      const
        viableBounds = this.viableRadOutWrappersOriginBounds,
        origins = this.viableArcOrigins
          .filter(v => vertIsWithinBounds(v, viableBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
      if (!origins.isEmpty) return origins
      else return this.viableArcOrigins
    }

  }
  get currentViableRadiantOrigins() {
    if (this.viableRadiantOriginBounds) {
      const
        viableBounds = this.viableRadOutWrappersOriginBounds,
        origins = this.currentViableArcOrigins
          .filter(v => vertIsWithinBounds(v, viableBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
      if (!origins.isEmpty) return origins
    }
  }

  //MARK: INTERFERENCE WRAPPING
  get interferenceWrappers() {
    if (this.isInnerMostRadiantWrapper && this.radiantOutWrappers?.length > 1) {
      const segs = this.outerMostRadiantWrapper.neighborsArray.flat()
        .filter(s =>
          s.arcNormalDirection.equals(this.arcNormalDirection.opposites)
          && (
            s.isInnerMostRadiantWrapper
            || s.coinInWrapper?.isInnerMostRadiantWrapper
            || s.isOuterMostRadiantWrapper
            || s.coinOutWrapper?.isOuterMostRadiantWrapper
          )
        )
        .map(s => {
          if (s.coinInWrapper?.isInnerMostRadiantWrapper) return s.coinInWrapper
          else if (s.coinOutWrapper?.isOuterMostRadiantWrapper) return s.coinOutWrapper
          else return s
        })
        .compacted

      if (!segs.isEmpty) {
        const
          start = segs.filter(s => this.maxArcBoundsSeg.vertOrientation(s.end).isLeft)[0],
          end = segs.filter(s => this.maxArcBoundsSeg.vertOrientation(s.end).isRight)[0]
        return { start: start, end: end }
      }
    }
  }
  get hasInterference() { return !!this.interferenceWrappers }
  get hasDoubleInterference() { return !!this.interferenceWrappers.start && !!this.interferenceWrappers.end }
  get viableInterferenceOrigins() {
    // return memoize(() => {
    if (!this.hasInterference) return

    //ARROW: viables() : [Object] : find the viable origins for the interference wrappers 
    const viables = (corner, isStart = true) => {
      if (!corner) return                                                         // if no corner, return empty array
      let bounds = { ...corner.viableArcOriginsSeg.bounds }                       // copy minMax bounds
      const side = isStart === this.isOutsideCorner ? this : this.endNeighbor     // seg to reference direction

      if (side.isVertical) {
        bounds.xMin = 0
        bounds.xMax = 100
      } else {
        bounds.yMin = 0
        bounds.yMax = 200
      }

      const
        viables = this.currentViableRadiantOrigins || this.viableArcOrigins,
        origins = viables.filter(v => vertIsWithinBounds(v, bounds, true, 0))
      if (!origins.isEmpty) return origins
    }

    const
      starts = viables(this.interferenceWrappers.start),
      ends = viables(this.interferenceWrappers.end, false)

    if (starts && ends) return starts.intersect(ends, [`x`, `y`])
    if (starts) return starts
    if (ends) return ends
    // }, `viableInterferenceOrigins`).call(this)
  }

  //MARK: WRAP STATES
  get hasCompleteFlushWrap() { return this.hasArc && this.flushWrapper?.hasArc }
  get hasCompleteAdjWrap() { return this.hasArc && this.adjacentWrapper?.hasArc }

  get horVertSides() {
    return memoize(() => {
      const end = this.endNeighbor
      if (this.isHorizontal !== end.isHorizontal) return this.isHorizontal ? [this, end] : [end, this]
    }, `horVertSides`).call(this)
  }

  get inOutFlushWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(true)
    }, `inOutFlushWrappers`).call(this)
  }
  get inOutAdjWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(false)
    }, `inOutAdjWrappers`).call(this)
  }

  //METH: #inOutWrappers() : [Object] : find the in/out wrappers for this corner
  #inOutWrappers(flush) {
    const wrapper = flush ? this.flushWrapper : this.adjacentWrapper
    return this.isOutsideCorner === flush ? [this, wrapper] : [wrapper, this]
  }

  get isCoinInWrapper() { return !!this.coinOutWrapper }
  get isFlushInWrapper() { return !!this.flushOutWrapper }
  get isAdjInWrapper() { return !!this.adjOutWrapper } flush
  get isCoinOutWrapper() { return !!this.coinInWrapper }
  get isFlushOutWrapper() { return !!this.flushInWrapper }
  get isAdjOutWrapper() { return !!this.adjInWrapper }

  //METH: wrapState() : [0,1,2] : find the state of the wrapping
  wrapState(flush) {
    const inOuts = flush ? this.inOutFlushWrappers : this.inOutAdjWrappers
    const hasCompleteWrap = flush ? this.hasCompleteFlushWrap : this.hasCompleteAdjWrap
    if (hasCompleteWrap) {
      const [inner, outer] = inOuts
      if (inner.hasDiagonalCorner(outer)) {                     // wrappers are radiant
        const
          outCorner = outer.end,                                // cornerpoint of outer wrap
          [inDist, outDist] = inOuts.map(w => roundToDec(w.arcOrigin.dist(outCorner), 2))

        if (inDist === outDist) return 0                        // EQUIDISTANT: dists to corner are equal
        if (inDist > outDist) return 1                          // DIVERGING: inDist > outDist
        if (inDist < outDist) return 2                          // CONVERGING: inDist < outDist

      } else {                                                  // wrappers are proximal
        const obj = flush ? inner.flushIntersectObjs[0] : inner.adjIntersectObjs[0]
        if (roundToDec(obj?.dist) >= roundToDec(outer.arcRadius))
          return 0                                              // EQUIDISTANT: dist to corner is equal to arcRadius
        else return 2                                           // CONVERGING: dist to corner is less than arcRadius
      }
    }
  }

  get flushWrapState() { return this.wrapState(true) }
  get adjWrapState() { return this.wrapState(false) }

  get flushWrapIsEquidistant() { return this.flushWrapState === 0 }
  get flushWrapIsDiverging() { return this.flushWrapState === 1 }
  get flushWrapIsConverging() { return this.flushWrapState === 2 }
  get flushWrapIsNonEquidistant() { return this.flushWrapIsDiverging || this.flushWrapIsConverging }
  get adjWrapisEquidistant() { return this.adjWrapState === 0 }
  get adjWrapIsDiverging() { return this.adjWrapState === 1 }
  get adjWrapIsConverging() { return this.adjWrapState === 2 }
  get adjWrapIsNonEquidistant() { return this.adjWrapIsDiverging || this.adjWrapIsConverging }

  //METH: canRadiateTo() : Bool : check if this corner can radiate to the seg
  canRadiateTo(seg) {
    return this.viableArcOriginsSeg.isOverlappingWith({ seg: seg.viableArcOriginsSeg })
      && this.hasDiagonalCorner(seg)
  }
  //METH: isRadiantWrapped() : Bool : two corners currently have an equidistant radiant wrap
  isRadiantWrapped(seg, decimal = 2) {
    return this.arcOrigin.equals(seg.arcOrigin, decimal) && this.hasDiagonalCorner(seg)
  }
  //METH: isProximalWrapped() : Bool : two corners currently have an aligned proximal wrap
  isProximalWrapped(seg) {
    if (!this.hasSameFacingCorner(seg)) return false
    return segment(this.start, seg.start).isCardinal || segment(this.end, seg.end).isCardinal
  }

  get isOutWrappedToRadiants() {
    const min = this.isCoinInWrapper ? 1 : 0
    return this.radiantOutWrappers?.filter(w => this.isRadiantWrapped(w)).length > min
  }
  get isInWrappedToRadiants() {
    const min = this.isCoinInWrapper ? 0 : 1
    return this.radiantInWrappers?.filter(w => this.isRadiantWrapped(w)).length > min
  }

  get isOutWrapped() { return this.#isWrapped(true) }
  get isInWrapped() { return this.#isWrapped(false) }

  //METH: #isWrapped() : Bool : check if this corner is wrapped
  #isWrapped(out, decimal = 2) {
    const wrapper = out ? this.outWrapper : this.inWrapper
    return wrapper?.isRadiantWrapped(this, decimal) || wrapper?.isProximalWrapped(this)
  }

  get hasNoWrappers() {
    return memoize(() => {
      return !this.inWrapper && !this.outWrapper
    }, `hasNoWrappers`).call(this)
  }
  // #endregion
  //MARK: Copy Methods
  // #region Copy Methods
  //METH: copy() : ProtoSegment : copy the segment
  copy({
    start = this.start,
    end = this.end,
    parentID = this.parentID,
    id = this.id,
    islandIDs = this.islandIDs,
    cubicVerts = this.cubicVerts,
    neighbors = this.neighbors,
    cells = this.cells,
    points = this.points,
    sideDir = this.sideDir,
    shape = this.shape,
  } = {}) {
    // const copyNumber = this.id.includes(`cop`) ? `cop` + String(+this.id.slice(-2) + 1).padStart(1, '0') : `cop0`
    return protoSegment({
      start: start,
      end: end,
      parentID: parentID,
      // id: `${id}-${copyNumber}`,
      id: id,
      islandIDs: islandIDs,
      cubicVerts: cubicVerts,
      neighbors: neighbors,
      cells: cells,
      points: points,
      sideDir: sideDir,
      shape: shape,
    })
  }
  //METH: insetCopy() : ProtoSegment : create an inset copy of the segment
  insetCopy(insetScale) {
    const
      scaleToOffset = Vertex.sub(insetScale, vert(1)),                  // create scaleToOffset 
      offset = Vertex.mult(scaleToOffset, this.cellRadius),             // create offset vector
      startMove = Vertex.mult(this.normals.start.moveCoord, offset),    // startMove vector
      insetStart = Vertex.add(this.start, startMove),                   // new inset segment start
      endMove = Vertex.mult(this.normals.end.moveCoord, offset),        // endMove vector
      insetEnd = Vertex.add(this.end, endMove)                          // new inset segment end

    if (insetEnd.x < 0 || insetEnd.y < 0) DeBug.warn(`created insetEnd with negative values`)     //LOGGING:

    const cubicMove = Vertex.mult(this.normals.cubic.moveCoord, offset) // cubicMove vector
    let insetPoints, insetCubicVerts = { start: undefined, end: undefined }

    if (this.cubicVerts.start) insetCubicVerts.start = Vertex.add(this.finalCubicStartVert, cubicMove)
    if (this.cubicVerts.end) insetCubicVerts.end = Vertex.add(this.finalCubicEndVert, cubicMove)

    if (this.points) {                                                  // use points to create inset points
      const insetSeg = segment(insetStart, insetEnd)
      insetPoints = this.points
        .map(p => Vertex.add(p, cubicMove))
        .filter(p => insetSeg.vertIsOnLine(p, 3))
    }

    return protoSegment({                                               // new inset segment 
      start: insetStart,
      end: insetEnd,
      parentID: this.id,
      id: `${this.id}-inset(${roundToDec(insetScale.x, 2)})`,
      islandIDs: this.islandIDs,
      cubicVerts: insetCubicVerts,
      insetScale: insetScale,
      cells: this.cells,
      points: insetPoints,
      sideDir: this.sideDir,
      shape: this.shape,
      _direction: this.direction,
    })
  }
  // #endregion
  //MARK: Neighbors 
  // #region Neighbors
  get startNeighbor() { return this.neighbors.start }
  get endNeighbor() { return this.neighbors.end }
  get neighborsArray() { return OpArray.from([this.startNeighbor, this.endNeighbor]) }
  get andNeighborsArray() { return OpArray.from([this.startNeighbor, this, this.endNeighbor]) }
  get hasBothNeighbors() { return !!this.startNeighbor && !!this.endNeighbor }

  get overlapSegs() {
    return memoize(() => {
      return this.shape.andNeighborSimples
        .exclude(this, `id`)
        .filter(s => this.isOverlappingWith({ seg: s }))
    }, `overlapSegs`).call(this)
  }
  // get overlapInsideSegs() {                                                                       //UNUSED:
  //   return memoize(() => {
  //     return this.shape.andNeighborSimples
  //       .exclude(this, `id`)
  //       .filter(s => this.isOverlappingWith({ seg: s, includeEnds: false, mode: 0 }))
  //   }, `overlapInsideSegs`).call(this)
  // }
  get hasCompletePath() { return !!this.segPath }
  get isSmallBean() {
    return memoize(() => {
      const
        min = 5 * this.cellRadius,
        path = this.segPath
      if (path.length === 6) return path.every(s => s.length < min)
      return false
    }, `isSmallBean`).call(this)
  }
  get segPath() {
    if (!this.hasBothNeighbors) {
      DeBug.error(`Error: segment is missing neighbors, segPath cannot be calculated!`)
      return
    }
    let
      path = new OpArray,
      open = true,
      seg
    while (open) {
      if (!seg) seg = this
      path.push(seg)
      seg = seg.endNeighbor
      if (seg.id === this.id) open = false
    }
    return path
  }

  //METH: assignNeighbors()
  //NOTE: be sure to assign neighbors by reference instead of value to avoid infinite tree
  assignNeighbors({ start, end } = {}) {
    if (start) {
      if (!this.start.equals(start.end, 1)) {
        DeBug.error(`assigned a disconnected start neighbor!`, this.start, start.end)
      }
      this.neighbors.start = start
    }
    if (end) {
      if (!this.end.equals(end.start, 1)) {
        DeBug.error(`assigned a disconnected end neighbor!`, this.end, end.start)
      }
      this.neighbors.end = end
    }
  }
  // #endregion
}
