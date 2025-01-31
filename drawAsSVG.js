
// MARK: Constants
const bezCircleConst = 0.55228
const bezCircle45DegConst = 0.265

//MARK: SVGPath CLASS
// SIZE: 178 lines
class SVGPath {
  //METH: fromProtoSegPath() : convert PrSeg path with cubic verts (finalSubShapes) to a valid SVG path string
  static fromProtoSegPath({ segPath, cornerMin = 0, cornerScale = 1 } = {}) {
    // DeBug.warn(`segPath`, segPath)                                           //LOGGING:
    // cornerScale = R.random_int(0, 1)
    segPath = segPath.copy
    let curves = []
    let start, end, cornerStart, cornerEnd
    let startRadius, startSegment, endRadius, endSegment
    let controlStart, lineStart, lineEnd, controlEnd

    segPath.forEach((seg, i) => {
      let report = false                                                                                  //LOGGING:
      if (seg.id.includes(`cell000`)
        // || seg.id.includes(`cell122`)
      ) { report = true }                                                //LOGGING:
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`svg creation, seg:`, seg)                                                            //LOGGING:
        DeBug.log(`cornerVerts`, seg.cornerVerts)
      }                                                                                                   //LOGGING:
      // cornerMin = min(cornerMin, seg.length / 2)

      startRadius = seg.hasCubicStartVert ? seg.availableStartLength : cornerMin // radius of corner arc
      lineStart = seg.distancedStartPoint(startRadius * cornerScale) // start point of line connecting corner arcs 
      startSegment = segment(lineStart, seg.start) // control point calculation segment, connects hard corner to mid line
      controlStart = startSegment.pointOnsegment(bezCircleConst)
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`start props:`, seg.hasCubicStartVert, seg.cubicVerts.start, seg.start, seg.availableStartLength, startRadius)  //LOGGING:
      }

      endRadius = seg.hasCubicEndVert ? seg.availableEndLength : cornerMin // radius of corner arc
      lineEnd = seg.distancedEndPoint(endRadius * cornerScale) // end point of line connecting corner arcs
      endSegment = segment(lineEnd, seg.end) // control point calculation segment, connects hard corner to middle line
      controlEnd = endSegment.pointOnsegment(bezCircleConst)
      if (report) {                                                                                       //LOGGING:
        DeBug.log(`end props:`, seg.hasCubicEndVert, seg.cubicVerts.end, seg.end, seg.availableEndLength, endRadius)  //LOGGING:
      }                                                                                                   //LOGGING:
      curves.push([controlStart, lineStart, lineEnd, controlEnd])
      if (i === 0) { // firstLoop
        start = [controlStart, lineStart]
        cornerStart = seg.start
      }
      if (i === segPath.lastIndex) {  // lastLoop
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
    const simplify = (curve) => {
      return curve.map(vert =>
        vert.array.map(coord => roundToDec(coord, 4))
      )
    }

    // calculate start, (middle) curves, and end
    start = simplify(start)
    curves = curves.map(curve => simplify(curve))

    end = simplify(end)

    const startSVG = `M ${end[0]} C ${end[1]}`
    const curvesSVG = curves.map((c, i) =>
      i === curves.lastIndex ? `${c[0]} ${c[1]} L ${c[2]} ` : `${c[0]} ${c[1]} L ${c[2]} C ${c[3]} `
    )
    // const endSVG = ` Z` //use 1st coord twice because Z creates line closing path loop
    // const endSVG = `${end[0]} ${end[0]} Z` //use 1st coord twice because Z creates line closing path loop
    // const svgPath = `${startSVG} ${curvesSVG} ${endSVG}`
    const svgPath = `${startSVG} ${curvesSVG} Z`
    DeBug.log(`end`, end)                                                                           //LOGGING:
    // DeBug.log(`endSVG`, endSVG)                                                                     //LOGGING:
    DeBug.log(`svgPath`, svgPath)                                                                   //LOGGING:
    return svgPath
  }


  //METH: fromSegPath() :                                                                                  //UNUSED:
  // static fromSegPath({ segPath, refine = true, random = false, straightness = 0 } = {}) {          
  //   if (refine) {
  //     let verts = VertPath.fromSegPath(segPath)
  //     segPath = SegPath.fromVertPath({ path: verts, refine: true })
  //   }
  //   return SVGPath.segPathToCurvedSVG({ segPath: segPath, random: random, straightness: straightness })
  // }
  //METH: segPathToCurvedSVG() : create SVG path from segments with points rounded using (C) bezier curves //UNUSED:
  // static segPathToCurvedSVG(
  //   { segPath,
  //     curvature = bezCircleConst,
  //     straightness = 0,
  //     bisector = .5,
  //     circularCaps = true,
  //     random = false,
  //   } = {}) {
  //   segPath = segPath.copy
  //   let last = segPath.pop()
  //   let lineStartLoc = bisector - straightness * bisector
  //   let lineEndLoc = bisector + straightness * (1 - bisector)

  //   //ARROW: offset
  //   const offset = () => random ? R.random_num(0.1, 1.5) : curvature

  //   //ARROW: makeSegmentCircular
  //   const makeSegmentCircular = (segment, startLoc = lineStartLoc) => {
  //     control1 = segment.scaledStartPoint(bezCircleConst, startLoc)
  //     lineStart = segment.pointOnsegment(startLoc)
  //     lineEnd = segment.pointOnsegment(lineEndLoc)
  //     control2 = segment.scaledEndPoint(bezCircleConst, lineEndLoc)
  //     return [control1, lineStart, lineEnd, control2]
  //   }

  //   //ARROW: makePrevSegmentCircular
  //   const makePrevSegmentCircular = () => {
  //     if (curves.length === 0) { return }
  //     let prevCoords = curves.pop()
  //     let lineEndLoc = 1 - circleCurve / prevSeg.length
  //     let lineEnd = prevSeg.pointOnsegment(lineEndLoc)
  //     let control2 = prevSeg.scaledEndPoint(bezCircleConst, lineEndLoc)
  //     let newCoords = [prevCoords[0], prevCoords[1], lineEnd, control2]
  //     curves.push(newCoords)
  //   }

  //   let curves = new OpArray
  //   let prevSeg = last
  //   let control1, lineStart, lineEnd, control2, circleCurve


  //   // create curve coordinates
  //   segPath.forEach((seg, i) => {
  //     if (!circularCaps) {
  //       control1 = seg.scaledStartPoint(offset(), lineStartLoc)
  //       lineStart = seg.pointOnsegment(lineStartLoc)
  //       lineEnd = seg.pointOnsegment(lineEndLoc)
  //       control2 = seg.scaledEndPoint(offset(), lineEndLoc)
  //     } else {
  //       // DeBug.error(`YAAAASSSSSS`)
  //       // DeBug.log(`segment`, seg)
  //       if (seg.hasSomeCubicVerts) {
  //         // DeBug.error(`YEEEEEEESSSSSS`)
  //         circleCurve = min(seg.length, prevSeg.length) / 8
  //       } else {
  //         circleCurve = min(seg.length, prevSeg.length) / 2
  //       }
  //       if (seg.length < prevSeg.length) {
  //         // print('previous is longer!')
  //         makePrevSegmentCircular()
  //         makeSegmentCircular(seg)
  //       } else {
  //         // print('current is longer!')
  //         let lineStartLoc = circleCurve / seg.length
  //         makeSegmentCircular(seg, lineStartLoc)
  //       }
  //       prevSeg = seg
  //     }
  //     curves.push([control1, lineStart, lineEnd, control2])
  //   })

  //   // create start and end coordinates
  //   let end, start
  //   if (!circularCaps) {
  //     end = [last.scaledStartPoint(offset(), lineStartLoc), last.pointOnsegment(lineStartLoc)]
  //     start = [last.pointOnsegment(lineEndLoc), last.scaledEndPoint(offset(), lineEndLoc)]
  //   } else {
  //     circleCurve = min(last.length, prevSeg.length) / 2
  //     let lineStartLoc = circleCurve / last.length
  //     if (prevSeg.length > last.length) {
  //       makePrevSegmentCircular()
  //       makeSegmentCircular(last)
  //     } else {
  //       makeSegmentCircular(last, lineStartLoc)
  //     }
  //     end = [control1, lineStart]

  //     circleCurve = min(last.length, segPath[0].length) / 2
  //     if (last.length > segPath[0].length) {
  //       lineEndLoc = 1 - circleCurve / last.length
  //       lineEnd = last.pointOnsegment(lineEndLoc)
  //       control2 = last.scaledEndPoint(bezCircleConst, lineEndLoc)
  //     } else {
  //       makeSegmentCircular(last, lineStartLoc)
  //     }
  //     start = [lineEnd, control2]
  //   }

  //   //convert curve segment coordinates into SVG instructions
  //   let curvesSVG = curves.map(e => `${e[0].array} ${e[1].array} L ${e[2].array} C ${e[3].array} `)
  //   let endSVG = `${end[0].array} ${end[1].array} Z`
  //   let startSVG = `M ${start[0].array} C ${start[1].array}`
  //   return `${startSVG} ${curvesSVG} ${endSVG}`
  // }
  // // METH: multiplySVGCoords()
  // static multiply({ svgPath, multiplier } = {}) {
  //   let verts = VertPath.fromSVGPath(svgPath).map(e => {
  //     let pairs = VertPath.toCoord(e)
  //     return pairs.map(f => f * multiplier)
  //   })
  //   return verts
  // }
}

//MARK: SegPath CLASS
// SIZE: 117 lines
class SegPath {
  path
  shape
  diagonalsPath


  constructor(path, shape) {
    this.path = path
    this.shape = shape
  }
  //MEMO: isComplete()
  get isComplete() {
    return memoize(() => {
      return this.path.first.start.equals(this.path.last.end, 1)
    }, `isComplete`).call(this)
  }
  //MEMO: isQuad()
  get isQuad() {
    return memoize(() => {
      return this.isComplete && this.path.length === 4
    }, `isQuad`).call(this)
  }
  //MEMO: hasAllMiddleArcs()
  get hasAllMiddleArcs() {
    return memoize(() => {
      return this.path.every(s => s.isUsingMiddleOrigin)
    }, `hasAllMiddleArcs`).call(this)
  }
  //MEMO: hasMinRadii()
  get hasMinRadii() {
    return memoize(() => {
      return this.path.every(s => s.hasMinArcRadius)
    }, `hasMinRadii`).call(this)
  }
  //MEMO: isOutsideQuad()
  get isOutsideQuad() {
    return memoize(() => {
      return this.isQuad && this.path.every(s => s.isUTurnOut)
    }, `isOutsideQuad`).call(this)
  }
  //MEMO: perimeter()
  get perimeter() {
    return memoize(() => {
      return this.path.map(s => s.length).reduce((a, b) => a + b)
    }, `perimeter`).call(this)
  }
  //MEMO: grid()
  get grid() {
    return memoize(() => {
      return this.shape.grid
    }, `grid`).call(this)
  }
  //MEMO: bounds()
  get bounds() {
    return memoize(() => {
      return findBounds(this.path)
    }, `bounds`).call(this)
  }
  //MEMO: isCutOut()
  get isCutOut() {
    return memoize(() => {
      return this.shape.cutOutSegs?.some(cut => cut.id === this.path[0].id) || false
    }, `isCutOut`).call(this)
  }
  //MEMO: cells()
  get cells() {
    // return memoize(() => {
    return this.isCutOut ? this.grid.cellsWithinBounds(this.bounds).exclude(this.shape.cells, `id`) : this.shape.cells
    // }, `cells`).call(this)
  }

  get hasLoosies() { return this.path.some(s => s.canCurveMoreAtEnd) }

  get stairs() {
    if (!this.diagonalsPath) { this.diagonalsPath = this.path.copy }
    return this.diagonalsPath.filter(s => s.isStair)
  }
  //METH: hasSameForm() : Form = same shape, different position. Used for determining svg instancing.
  hasSameForm(otherPath) {
    const length = this.path.length
    if (length !== otherPath.path.length) return false

    for (let i = 0; i < length; i++) {
      const a = this.path[i], b = otherPath.path[i]
      if (equalsRoundedDec(a.length, b.length)
        || equalsRoundedDec(a.arcRadius, b.arcRadius)
        || !a.direction.equals(b.direction)) {
        return false
      }
    }
    return true
  }

  //MARK: Quad Methods
  makeCurves(equal = true, max = true, outWrap = true) {
    // let radius
    // if (equal && max) { radius = min(...this.path.map(s => s.length / 2)) }
    DeBug.log(this.path)
    // const sorted = this.path.sort((a, b) => b.arcRadius - a.arcRadius)
    const sorted = this.path
    sorted.forEach(s => {
      DeBug.log(s.id)
      if (equal && max) {
        s.replaceEndCurveOrigin(s.middleArcOrigin)
        // if (outWrap) {
        //   if (s.outWrapper?.canCurveToMiddleOrigin)) {
        //     DeBug.log(`CAN curve!`)
        //     s.replaceEndRadiantOutWrapsOrigin()
        //   } else {
        //     DeBug.log(`can't curve!`)
        //   }
        // } else {
        //   s.flushWrap(true)
        // }

      }
    })
    sorted.forEach(s => {
      // DeBug.log(s.id)
      if (outWrap) {
        if (s.outWrapper?.canCurveToMiddleOrigin) {
          // DeBug.log(`CAN curve!`)
          // s.flushWrap(true)
          // DeBug.log(s)
          s.replaceEndRadiantOutWrapsOrigin()
        } else {
          // DeBug.log(`can't curve!`)
        }
      } else {
        s.flushWrap(true)
      }
    })

  }


  //MARK: REFINE Methods
  //METH: refine() : remove collinear segments to simplify seg path to single segments connecting corners
  refined() {
    const parentID = this.shape.id
    const segPath = this.path
    DeBug.log(`segPath`, segPath)
    let newPath = new OpArray
    let length, prevDir, dir, start, end, firstID, lastID, islandIDs, cells, points, sideDir

    // for (let i = 0; i < segPath.length; i++) {
    //   const seg = segPath.at(i)
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
        const baseID = `${parentID}-${length}${dir}-${firstID}`
        const id = length === 1 ? baseID : `${baseID}-to-${lastID}`
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

      if (i === 0) { reset() }                                  // first pass: reset

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

      if (i === segPath.lastIndex) { assignSeg() }              // last pass: assign last seg

      prevDir = seg.direction                                   // set previous direction
    })

    newPath.forEach((seg, i) => {                               // loop through newPath to assign neighbors
      const loop = range(0, newPath.lastIndex)
      const prev = newPath[loop.cycle(i - 1)]
      const next = newPath[loop.cycle(i + 1)]
      seg.assignNeighbors({ start: prev, end: next })
    })
    DeBug.log(`newPath`, newPath)                                                                     //LOGGING:
    return new SegPath(newPath, this.shape)
  }

  //FIXME: still have an issue recognizing final stairs on #559
  get stairSets() {
    DeBug.log(``)
    let firstStair, lastStair, stairSet
    let stairSets = new OpArray
    this.stairs.forEach((seg, i) => {
      // DeBug.warn(`current`, i, seg.id)
      let current = seg
      if (lastStair) {
        //TODO: In order to get non-ordinal results in future, need to adapt minLength checks. Maybe a previousLength prop?
        // if (i === this.stairs.lastIndex) { DeBug.error(`this is the last index!`) }  
        if (current.id === lastStair.endNeighbor.id && lastStair.isMinLength && current.isMinLength) {
          if (!stairSet) { stairSet = OpArray.format(lastStair) }
          stairSet.push(current)
          if (i === this.stairs.lastIndex) { stairSets.push(stairSet) }
        } else {
          stairSets.push(stairSet)
          stairSet = undefined
        }

      } else {
        firstStair = current
      }
      lastStair = current

      // DeBug.log(`firstStair`, firstStair)
      // DeBug.log(`lastStair`, lastStair)
      // DeBug.log(`stairSet`, stairSet)
      // DeBug.log(`stairSets.last`, stairSets.last)
    })
    stairSets = stairSets.compacted
    // DeBug.log(`stairSets`, stairSets)
    DeBug.log(``)
    if (!stairSets.isEmpty) { return stairSets }
  }

  //FIXME: Finish implementation
  //METH: withDiagonals() 
  withDiagonals() {
    DeBug.log(``)
    DeBug.warn(`withDiagonals`)


    this.stairSets?.forEach((set, i) => {
      DeBug.error(`currentset`, set)
      // use setcount to decide which direction to "move"
      const count = set.length
      const firstTurn = set.first.endTurn.direction
      let possibleMoves, preferredMove
      if (count === 2) { possibleMoves = firstTurn }
      if (count > 2) { possibleMoves = Direction.Horizontal }
      // if (count % 2 === 0) { preferredMove = firstTurn.opposites }
      if (count % 2 === 1) { preferredMove = this.isCutOut ? Direction.Right : Direction.Left }

      DeBug.log(`count`, count)
      DeBug.log(`firstTurn`, firstTurn)
      DeBug.log(`firstTurn`, firstTurn.name)
      DeBug.log(`possibleMoves`, possibleMoves.name)
      DeBug.log(`preferredMove`, preferredMove?.name)

      // verify that cells are empty in each area considering to "move" into
      const availableMoves = possibleMoves.directions.map(dir => {
        const name = dir.name
        const segs = set
          .filter(s => dir.isRight ? s.cells[0]?.isAvailable : s.outsideCells[0]?.isAvailable)
        if (segs.length > 0) { return { name, segs } }
      }).compacted
        .sort((a, b) => b.segs.length - a.segs.length)
      DeBug.log(`availableMoves`, availableMoves)

      if (availableMoves.isEmpty) { return }

      let finalMoves
      if (preferredMove && availableMoves[0].segs.length === availableMoves[0].segs.length) {
        finalMoves = availableMoves.find(move => move.name === preferredMove.name)
      } else {
        finalMoves = availableMoves[0]
      }
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

  //METH: convertToDiagonals()
  convertToDiagonals(moves) {

    const { name, segs } = moves
    const segCount = segs.length
    const hasEvenCount = segCount % 2 === 0
    const moveOut = name === `left`
    const startsStairIn = segs[0].part.isStairIn
    const startHasSmallRad = moveOut === startsStairIn
    const change = sqrt(2) - 1


    DeBug.warn(`convertToDiagonals segs`, segs)

    //ARROW: ordinalSegment()
    const ordinalSegment = () => {
      const startNeighbor = segs.first.startNeighbor
      const endNeighbor = segs.last.endNeighbor
      const startRad = startNeighbor.arcRadius
      const curveStartReduce = startHasSmallRad ? (1 - change) * startRad : (1 + change) * startRad
      const diagStartVert = startNeighbor.distancedEndPoint(curveStartReduce)
      // DeBug.log(`diagStartVert`, diagStartVert)
      const diagDir = startHasSmallRad ? startNeighbor.direction.next() : startNeighbor.direction.previous()
      const cellDiagLength = 2 * sqrt(2 * startRad * startRad)
      const diagMag = (segCount - 1) * cellDiagLength
      const diagVect = diagDir.lineVector.setMag(diagMag)
      const diagEndVert = Vertex.add(diagVect, diagStartVert)

      const simpleDiagonal = segment(diagStartVert, diagEndVert)

      const cellsSelect = moveOut ? `cells` : `outsideCells`
      const cells = [startNeighbor[cellsSelect].last, endNeighbor[cellsSelect].first]
      const normDir = simpleDiagonal.normalDirection
      const sideDir = moveOut ? normDir : normDir.opposites

      const smallCubicDist = change * startRad
      const largeCubicDist = hasEvenCount ? smallCubicDist : cellDiagLength - smallCubicDist
      const diagCubicDists = startHasSmallRad ? [smallCubicDist, largeCubicDist] : [largeCubicDist, smallCubicDist]
      const cubicStart = simpleDiagonal.distancedStartPoint(diagCubicDists[0])
      const cubicEnd = simpleDiagonal.distancedEndPoint(diagCubicDists[1])
      const cubicVerts = { start: cubicStart, end: cubicEnd }

      const id = `diagonal-${sideDir.name}-${cells[0].id}-${segs.first.sideDir.name}Side-to-${cells[1].id}-${segs.last.sideDir.name}Side`

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



    let turnStart, turnEnd, diagStart, diagEnd, diagonal, current
    let diagonals = new OpArray
    let removals = segs.copy
    segs.forEach((s, i) => {
      //ARROW: idSuffix()
      const idSuffix = (seg, isStart) => {
        const cell = isStart ? `first` : `last`
        return `${seg.cells[cell].id}-${seg.sideDir.name}Side`
      }

      //ARROW: simpleDiagonal()
      const simpleDiagonal = (neighbor) => {
        const rad = neighbor.arcRadius
        const newTermLength = startHasSmallRad ? (1 - change) * rad : (1 + change) * rad
        const diagStartVert = neighbor.distancedEndPoint(newTermLength)
        // DeBug.log(`diagStartVert`, diagStartVert)
        const diagDir = startHasSmallRad ? neighbor.direction.next() : neighbor.direction.previous()
        const diagMag = (segCount - 1) * 2 * sqrt(2 * rad * rad)
        const diagVect = diagDir.lineVector.setMag(diagMag)
        const diagEndVert = Vertex.add(diagVect, diagStartVert)
        return segment(diagStartVert, diagEndVert)
      }
      //ARROW: terminalSegs()
      const terminalSegs = (s, isStart) => {                // create terminal segs (turnStart/diagStart/diagEnd/turnEnd)
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

        const cells = moveOut ? seg.cells : seg.outsideCells
        const sideDir = moveOut ? diagonal.normalDirection : diagonal.normalDirection.opposites
        const suffix = `${cells[0].id}-${sideDir.name}`
        let start, end, idName, cubicVerts
        switch (mode) {
          case 0:                               // diagonal
            start = intersect(true)
            end = intersect(false)
            idName = `diag`
            cubicVerts = { start: start, end: end }
            break
          case 1:                               // diagStart
            start = diagonal.start
            end = intersect(true)
            idName = `diagStart`
            cubicVerts = { start: end, end: end }
            break
          case 2:                               // diagEnd
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
          // islandIDs: s.islandIDs,                      //TODO: consider implications
          cells: cells,
          points: null,
          sideDir: sideDir,
          // cubicVerts: null,             // none: but maybe assign here?
          cubicVerts: cubicVerts,             // none: but maybe assign here?
          neighbors: null,              // none: assign after in loop
        })
      }

      if (i === 0) { terminalSegs(s, true) }                 // process start seg
      if (i === segs.lastIndex) { terminalSegs(s, false) }   // process end seg
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
      if (i > 0) { seg.assignNeighbors({ start: diagPath[i - 1] }) }
      if (i < diagPath.lastIndex) { seg.assignNeighbors({ end: diagPath[i + 1] }) }
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


  // METH: fromVertPath() : convert array of verts to a shape path made of Segments                         //UNUSED:
  // static fromVertPath({ vertPath, refine = true, parentID } = {}) {
  //   // DeBug.log('vertPath', vertPath)                                                            //LOGGING:
  //   let vertCount = vertPath.length
  //   if (vertCount < 3) { return }
  //   vertPath = SegPath.loopPath(vertPath)
  //   // DeBug.log('loopedpath', vertPath)                                                          //LOGGING:
  //   let segmentPath = new OpArray
  //   let previousSeg = undefined
  //   for (let i = 0; i < vertCount; i++) {
  //     let seg = protoSegment({ start: vert(vertPath[i]), end: vert(vertPath[i + 1]), parentID: parentID })
  //     if (refine === true && !!previousSeg && seg.angle === previousSeg.angle) {
  //       seg = protoSegment({ start: previousSeg.start, end: seg.end, parentID: parentID })
  //       segmentPath.pop()
  //     } // combine segments with same angle
  //     segmentPath.push(seg)
  //     previousSeg = seg
  //   }
  //   return segmentPath
  // }

  //METH: loopPath() : loopPath closes a shape path loop made of either segments or vertices              //UNUSED:
  // static loopPath(verts = simpleSquare) {
  //   let origin = verts[0]
  //   let last = verts[verts.length - 1]
  //   if (origin !== last) {
  //     let closer
  //     if (origin instanceof Segment) {
  //       // closer = segment({ start: last, end: origin })
  //       closer = new Segment({ start: last, end: origin })
  //     } else if (typeof origin[0] === 'number') {
  //       // print('has number')
  //       closer = origin
  //     }
  //     verts.push(closer)
  //   }
  //   return verts
  // }
}

//MARK: VertPath CLASS                                                                                       //UNUSED:
//TODO: Adapt this code for SVG points and add to debugging
// SIZE: 80 lines
class VertPath {                                                                                          //UNUSED:
  //METH: fromSegPath()                                                                                   //UNUSED:
  // static fromSegPath(segPath) {
  //   return segPath.map(seg => [seg.start.x, seg.start.y])
  // }
  //METH: fromSVGPath() : extract comma separated vert coordinates from an SVG path to array              //UNUSED:
  // static fromSVGPath(path = '') {
  //   let reg = /-?\d+(?:\.\d+)*[,]-?\d+(?:\.\d+)*/
  //   let result = matchAll(path, reg)
  //   return result
  // }
  //TODO: rewrite to work with svgElements instead of htmlElements
  // METH: drawPoints() : draw index labeled points at verts                                              //UNUSED:
  // static drawPoints({ verts, parent, size = 5, offset = vert(0), color = '#F80', indices = true } = {}) {
  //   let centerOffset = size / 2
  //   let divs = []
  //   verts.forEach((e, i) => {
  //     if (!indices) { i = '' }
  //     let div = createDiv(i)
  //     let coord = VertPath.toCoord(e)
  //     // print(coord)
  //     div
  //       .attribute('index', i)
  //       .attribute('x', coord[0].toFixed())
  //       .attribute('y', coord[1].toFixed())
  //       .position(coord[0] - centerOffset + offset.x, coord[1] - centerOffset + offset.y)
  //       .size(size, size)
  //       .style(CS.backgroundColor, color)
  //       .style(CS.borderRadius, '50%')
  //       .style(CS.textAlign, 'center')
  //       .style(CS.fontSize, `${(size * 1.5)}pt`)
  //       .style(CS.lineHeight, `${size * 4}px`)
  //       .parent(parent)
  //       .mouseOver(showCoords)
  //       .mouseOut(showIndex)
  //     divs.push(div)
  //     // print(i, e)
  //   })
  //   return divs

  //   function showCoords() {
  //     // print('scrolled over')
  //     const i = this.attribute('index')
  //     const x = this.attribute('x')
  //     const y = this.attribute('y')
  //     let text = `${i}\n(${x},${y})`
  //     this.html(text)
  //     redrawAll()
  //   }
  //   function showIndex() {
  //     this.html(this.attribute('index'))
  //     redrawAll()
  //   }
  // }
  // METH: toCoordinate() : extract x and y from single comma separated vert string                       //UNUSED:
  // static toCoord(vertPairString) {
  //   let reg = /-?\d+(?:\.\d+)*/
  //   let result = matchAll(vertPairString, reg)
  //     .flatMap(e => Number(e))
  //   // print('extractCoord()')
  //   // print(result)
  //   return result
  // }

  //TODO: reverse engineer and find where this belongs
  // NOTE: Made with GPT-4 on May 23, 2023
  //NOTE: Intended to help make diagonal lines possible
  //METH: arcControlPoints() :                                                                            //UNUSED:
  static arcControlPoints(a, b, c) {
    const ab = Vertex.sub(b, a).normalize()
    const bc = Vertex.sub(c, b).normalize()
    const theta = ab.angleBetween(Vertex.mult(bc, -1))
    const t = 4 / 3 * tan(theta / 4)
    const p1 = a
    const p2 = Vertex.sub(b, Vertex.mult(ab, t))
    const p3 = Vertex.add(b, Vertex.mult(bc, t))
    const p4 = c
    return [p1, p2, p3, p4]
  }
}

//MARK: ProtoSVG CLASS    
// SIZE: 123 lines
class ProtoSVG {

  // MARK: File export methods
  // NOTE: Made with GPT-4 on April 14, 2023
  //METH:
  static createSVGMarkup(svgElement) {
    const serializer = new XMLSerializer()
    const svgMarkup = serializer.serializeToString(svgElement)
    return svgMarkup
  }
  //METH:
  static exportSVG(svgMarkup, fileName) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xmlcharset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()

    URL.revokeObjectURL(url)
  }
  // NOTE: Made with ClaudeAI on Oct 5, 2023
  //METH:
  static async exportPNG16(svgMarkup, fileName, width, height) {
    // Load SVG image
    async function loadImage(svgMarkup) {
      const img = await new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          resolve(img)
        }
        img.src = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }))
      })
      return img
    }

    // Encode 16-bit PNG
    function encodePNG16(data, width, height) {
      const header = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

      const buf = new Uint16Array(width * height * 4)

      for (let i = 0; i < data.length; i++) {
        const high = (data[i] >> 8) & 0xFF
        const low = data[i] & 0xFF
        buf[i * 2] = low
        buf[i * 2 + 1] = high
      }

      const png = new Uint8Array(header.length + buf.length * 2)
      png.set(header)
      png.set(buf, header.length)

      return png
    }

    // Export PNG file  
    function downloadBlob(data, filename) {
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    const canvas = new OffscreenCanvas(width, height)
    // canvas.style('image-rendering', `high-quality`)
    const gl = canvas.getContext('webgl2', { pixelFormat: 'float16' })

    if (!gl) {
      throw new Error('WebGL 2 not supported')
    }

    const texture = gl.createTexture()
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.UNSIGNED_SHORT, null)

    const img = await loadImage(svgMarkup)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_SHORT, img)

    const data = new Uint16Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_SHORT, data)

    const png = await encodePNG16(data, width, height)

    downloadBlob(png, fileName)
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

    const img = new Image()
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)
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
// SIZE: 109 lines
function vert(x = 0, y = 0) {
  if (x instanceof Array) { return new Vertex(x[0], x[1]) }
  if (x instanceof Object || x instanceof p5.Vector) { return new Vertex(x.x, x.y) }
  if (arguments.length === 1) { return new Vertex(x, x) }
  return new Vertex(x, y)
}
class Vertex extends p5.Vector {
  // normal

  constructor(x = 0, y = 0) {
    super(x, y)
  }

  get id() { return `${this.x.toFixed(1)}, ${this.y.toFixed(1)}` }

  get isZero() { return this.x === 0 && this.y === 0 }
  get string() { return `${roundToDec(this.x, 3)}, ${roundToDec(this.y, 3)}` }
  get array() { return [this.x || 0, this.y || 0] }
  // get round() { return vert(round(this.x), round(this.y)) }
  // get floor() { return vert(floor(this.x), floor(this.y)) }
  // get evenFloor() { return vert((2 * floor(this.x / 2)), (2 * floor(this.y / 2))) }
  // get direction() {
  //TODO: not sure when I started this implementation. Do I need this?
  // }

  get aspect() { return Aspect.fromRatio((roundToDec(this.x) / roundToDec(this.y))) }
  get quadrantDirection() {
    if (this.x > 0) {
      if (this.y > 0) { return Direction.UpRight }
      if (this.y < 0) { return Direction.DownRight }
      if (this.y === 0) { return Direction.Right }
    }
    if (this.x < 0) {
      if (this.y > 0) { return Direction.UpLeft }
      if (this.y < 0) { return Direction.DownLeft }
      if (this.y === 0) { return Direction.Left }
    }
    if (this.x === 0) {
      if (this.y > 0) { return Direction.Up }
      if (this.y < 0) { return Direction.Down }
      if (this.y === 0) { return Direction.None }
    }

  }

  roundedMag(decimal = 4) { return roundToDec(this.mag(), decimal) }

  widthTo(vert) { return abs(this.x - vert.x) }
  heightTo(vert) { return abs(this.y - vert.y) }
  slopeTo(vert) { return (this.y - vert.y) / (this.x - vert.x) }
  directionTo(vert) { return segment(this, vert).direction }
  biDirectionTo(vert) {
    // const indices = [this, vert].sort((a, b) => a.y - b.y || a.x - b.x)
    // const a = indices[0]
    // const a = indices[0]
    if (this.y === vert.y) { return Direction.Horizontal }
    if (this.x === vert.x) { return Direction.Vertical }
    const slope = this.slopeTo(vert)
    print('slope')
    print(slope)
    if (this.slopeTo(vert) === -1) { return Direction.PosOrdinal }
    if (this.slopeTo(vert) === 1) { return Direction.NegOrdinal }
    return -1 // not Cardinal or Ordinal
  }
  //METH: roundToDec() : roundToDec x and y values
  roundCoordsToDec(dec = 4) {
    this.x = roundToDec(this.x, dec)
    this.y = roundToDec(this.y, dec)
  }

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
  static min(verts) { return verts.gridVertSorted[0] }
  static max(verts) { return verts.gridVertSorted.last }



  static rotate(v, deg) { return v.copy().rotate(radians(deg)) }
  //METH: cleanRotate() : version of rotate that uses roundToDec to create a "cleaner" resulting rotation
  static cleanRotate(v, deg, decimal = 5) {
    const initial = Vertex.rotate(v, deg)
    const x = roundToDec(initial.x, decimal)
    const y = roundToDec(initial.y, decimal)
    const z = roundToDec(initial.z, decimal)
    return initial instanceof Vertex ? vert(x, y) : new p5.Vector(x, y, z)
  }

  static add(a, b) { return vert(p5.Vector.add(a, b)) }
  static sub(a, b) { return vert(p5.Vector.sub(a, b)) }
  static mult(a, b) {
    if (b instanceof Vertex) {
      if (!a || !b) {
        DeBug.error(`Vertex.mult issue:`, a, b)
        return
      }
      return vert(a.x * b.x, a.y * b.y)
    }
    if (typeof b === 'number') {
      return vert(a.x * b, a.y * b)
    }
  }
  static div(a, b) {
    if (b instanceof Vertex) {
      return vert(a.x / b.x, a.y / b.y)
    }
    if (typeof b === 'number') {
      return vert(a.x / b, a.y / b)
    }
  }
}

//MARK: Segment CLASS 
// SIZE: 199 lines
function segment(start, end) {
  return new Segment(start, end)
}
class Segment {
  // verts
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

  //MEMO: isVertical 
  get isVertical() {
    return memoize(() => {
      return this.direction.allAreVertical
    }, `isVertical`).call(this)
  }
  //MEMO: isHorizontal 
  get isHorizontal() {
    return memoize(() => {
      return this.direction.allAreHorizontal
    }, `isHorizontal`).call(this)
  }
  //MEMO: isCardinal 
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
  //MEMO: angle : 
  get angle() {                                         // in RADIANS
    return memoize(() => {
      return this.lineVector.heading()
    }, `angle`).call(this)
  }
  //MEMO: angle
  get angleInDegrees() {                               // in DEGREES
    return memoize(() => {
      return degrees(this.angle)
    }, `angleInDegrees`).call(this)
  }
  //MEMO: direction
  get direction() {
    return memoize(() => {
      return Direction.atAngle(this.angle)
    }, `direction`).call(this)
  }
  //MEMO: normal
  get normalDirection() {
    return memoize(() => {
      return this.direction.toLeft
    }, `normal`).call(this)
  }

  get slope() { return this.start.slopeTo(this.end) }
  //MEMO: length
  get length() {
    return memoize(() => {
      return this.lineVector.mag()
    }, `length`).call(this)
  }
  //MEMO: bounds
  get bounds() {
    return memoize(() => {
      return findBounds(this)
    }, `bounds`).call(this)
  }
  get width() { return this.start.widthTo(this.end) }
  get height() { return this.start.heightTo(this.end) }

  get xMin() { return min(this.start.x, this.end.x) }
  get xMax() { return max(this.start.x, this.end.x) }
  get yMin() { return min(this.start.y, this.end.y) }
  get yMax() { return max(this.start.y, this.end.y) }

  get boundsCorners() {
    return {
      upLeft: vert(this.xMin, this.yMin),
      upRight: vert(this.xMax, this.yMin),
      downRight: vert(this.xMax, this.yMax),
      downLeft: vert(this.xMin, this.yMax),
    }
  }

  //MARK: methods
  //METH: vertIsInBounds()
  vertIsInBounds(vert, accuracy = 4, deviation) { return vertIsWithinBounds(vert, this.bounds, true, accuracy, deviation) }
  //METH: vertIsOnLine()
  //NOTE: made with ChatGPT4.0 on Jan14, 2024
  vertIsOnLine(vert, includeEnds = true, decimal = 1, deviation = 0.1) {
    let report = false
    // if (equalsRoundedDec(vert.x, 54.444)) { report = true }                                        //LOGGING:
    // if (
    //   this.id.includes('cell180')                                                                       //LOGGING:
    //   // || this.id.includes('cell185')                                                                    //LOGGING:
    //   // || this.id.includes('cell001')                                                                    //LOGGING:
    // ) { report = true }
    if (report) { DeBug.log(`vertIsOnLine this`, this) }
    if (!includeEnds && (vert.equals(this.start, decimal) || vert.equals(this.end, decimal))) {
      if (report) { DeBug.log(`vertIsOnLine fail: vert is on terminus`, vert) }
      return false                                                // point is on a terminus
    }

    if (!this.vertIsInBounds(vert, decimal)) {                           // point is outside seg's bounding box
      if (report) { DeBug.error(`vertIsOnLine fail: vert is outside bounds`, vert, this.bounds) }
      return false
    }
    // DeBug.log(`vertIsOnLine: vert is in bounds!`)
    // Calculate the t parameter using linear interpolation
    // const t = this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()
    const t = roundToDec((this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()), 4)
    // DeBug.log(`t`, t)
    // Check if t is within the range [0, 1]
    if (t < 0 || t > 1) {
      if (report) {
        DeBug.error(`vertIsOnLine fail: t param test`, vert, t)
        DeBug.error(this.lineVector)
      }
      return false // The point does not lie within the segment
    }

    // Calculate the projected point on the line
    const projectedPoint = Vertex.add(this.start, Vertex.mult(this.lineVector, t))
    // Check if the vert is close enough to the projected point (considering a small threshold for precision issues)
    // const threshold = 0.1 // Adjust this threshold based on your precision needs
    // DeBug.log(`vertIsInBounds projectedPoint`, projectedPoint)
    const diff = vert.dist(projectedPoint)
    // DeBug.log(`vertIsInBounds diff`, diff)
    const result = diff < deviation
    if (report && !result) {
      DeBug.error(`vertIsOnLine fail: threshold`, vert)
      DeBug.error(projectedPoint, diff)
    }
    return result
  }
  //METH: vertOrientation()
  vertOrientation(vert) {
    // DeBug.warn(vert, this.start)
    const vertVector = Vertex.sub(vert, this.start)       // vert to this.start
    // DeBug.warn(this.vector, vertVector)
    const cross = Vertex.cross(this.opposite.lineVector, vertVector).z // cross this opposite vector to vertVector
    if (cross > 0) {                                      // vert is to the left
      return Direction.Left
    } else if (cross < 0) {                               // vert is to the right
      return Direction.Right
    }
    return Direction.None                                 // vert is collinear
  }
  //METH: isParallelTo()
  // isParallelTo(seg) { return this.direction.andOpposites.equals(seg.direction.andOpposites) }
  isParallelTo(seg, accuracy = 1) {
    // DeBug.log(`this.lineVector`, this.lineVector)                                                //LOGGING:
    // DeBug.log(`seg`, seg)                                                                        //LOGGING:
    // DeBug.log(`seg.lineVector`, seg.lineVector)                                                  //LOGGING:
    const precise = Vertex.cross(this.lineVector, seg.lineVector).z
    // DeBug.log(`isParallelTo precise`, precise)                                                   //LOGGING:
    return abs(roundToDec(precise, accuracy)) === 0    // MUCH FASTER!!!
  }
  //METH: isCollinearWith()
  isCollinearWith(seg) { return this.isOverlappingWith({ seg: seg, infinite: true }) }
  //METH: isOverlappingWith()
  isOverlappingWith({ seg, includeEnds = true, decimal = 0, mode = 2, infinite = false, accuracy = 0 } = {}) {
    // DeBug.log(`seg`, seg)
    if (this.isVert || seg.isVert) {
      if (this.isVert && seg.isVert) { return this.start.equals(seg.start, 3) }
      if (this.isVert && !infinite) { return seg.vertIsOnLine(this.start) }
      if (seg.isVert && !infinite) { return this.vertIsOnLine(seg.start) }
    }

    if (!this.isParallelTo(seg)) {
      // DeBug.warn(`isOverlappingWith is not parallel`)                                            //LOGGING:
      return false
    }                         // false if not parallel

    if (infinite) {
      // Check for collinearity by verifying if the vector between one point of this segment
      // and the start of the other segment is orthogonal to the direction vector of this segment
      const connectiveVector = Vertex.sub(seg.start, this.start)
      const cross = abs(roundToDec(Vertex.cross(connectiveVector, this.lineVector).z, 1))
      // DeBug.warn(`isOverlappingWith ${seg.id}, crossProduct: ${cross}`)                          //LOGGING:
      if (accuracy > 0) { return abs(cross) < accuracy }
      return cross === 0
    }

    const sameDir = this.direction.equals(seg.direction)
    const isExactOverlap = sameDir ? this.start.equals(seg.start) && this.end.equals(seg.end)
      : this.start.equals(seg.end) && this.end.equals(seg.start)
    if (isExactOverlap) { return true }                                   // true if exact overlap, either direction
    const isEndToEnd = sameDir ? this.start.equals(seg.end) || this.end.equals(seg.start)
      : this.start.equals(seg.start) || this.end.equals(seg.end)
    if (isEndToEnd) { return includeEnds }                                // false if end-to-end contact without overlap
    const segInsideThis = this.vertIsOnLine(seg.start, includeEnds, decimal)
      || this.vertIsOnLine(seg.end, includeEnds, decimal)
    const thisInsideSeg = seg.vertIsOnLine(this.start, includeEnds, decimal)
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
  //METH: perpendicularIntersectionWith()
  perpendicularIntersectionWith(vert) {
    // DeBug.log(`perpX this`, this)                                                                      //LOGGING:
    const perpEnd = Vertex.add(this.direction.toLeft.lineVector, vert)
    const perpSeg = segment(vert, perpEnd)
    // DeBug.log(`perpX: perpSeg`, perpSeg)                                                               //LOGGING:
    const projected = this.intersectionWith(perpSeg, true)
    // DeBug.log(`perpX: projected`, projected)                                                           //LOGGING:
    const vertOnLine = this.vertIsOnLine(projected)
    // DeBug.log(`perpX: vertOnLine`, vertOnLine)                                                         //LOGGING:
    return vertOnLine ? projected : undefined
  }

  //METH: intersectionWith()
  //NOTE: made with ChatGPT4.0 on Jan12, 2024
  intersectionWith(seg, infinite = false) {
    const p = this.start
    const q = seg.start
    const r = this.lineVector
    const s = seg.lineVector

    if (this.isParallelTo(seg)) {                                                     // check for parallelism
      // DeBug.warn(`yes isParallel`)                                                             //LOGGING:
      if (this.isOverlappingWith({ seg: seg, infinite: infinite })) {                 // check for overlapping
        // DeBug.warn(`yes isOverlapping`)                                                        //LOGGING:
        const starts = OpArray.format([this.gridSorted.start, seg.gridSorted.start])  // gridSorted point same way
        const ends = OpArray.format([this.gridSorted.end, seg.gridSorted.end])        // OpArrays from points
        let overlapStart, overlapEnd
        if (!infinite) {                                                              // get inner overlap
          overlapStart = Vertex.max(starts)
          overlapEnd = Vertex.min(ends)
        } else {                                                                      // get outer overlap
          overlapStart = Vertex.min(starts)
          overlapEnd = Vertex.max(ends)
        }
        if (overlapStart.equals(overlapEnd, 1)) { return overlapStart }               // handle single vertex case with tolerance
        const overlapSeg = segment(overlapStart, overlapEnd)                          // create overlapSeg
        return overlapSeg.direction.equals(this.direction) ? overlapSeg : overlapSeg.opposite // align to this direction
      }
      return                                                                          // No overlap, or parallel but not collinear
    }
    const crossZ = Vertex.cross(r, s).z
    const t = Vertex.cross(Vertex.sub(q, p), s).z / crossZ  // intersection t value for this seg
    const u = Vertex.cross(Vertex.sub(q, p), r).z / crossZ  // intersection u value for other seg

    if (!infinite &&                                                                  // check if intersection points are on both segs
      (t < 0 || t > 1                                                                 // intersection point is not on the first segment
        || u < 0 || u > 1)                                                            // intersection point is not on the second segment
    ) { return }

    return Vertex.add(p, Vertex.mult(r, t))                                           // calculated intersection point
  }
  // //METH: roundToDec()
  roundVertsToDec(dec = 4) {
    this.start.roundCoordsToDec(dec)
    this.end.roundCoordsToDec(dec)
  }
  //METH: equals()
  equals(segment, accuracy = 3) {
    return this.start.equals(segment.start, accuracy) && this.end.equals(segment.end, accuracy)
  }

  //METH: pointOnsegment() : lerp along segment 0-1, 0 = start, 1 = end
  pointOnsegment(lerp) {
    let newVec = Vertex.mult(this.lineVector, lerp)
    let startVec = createVector(this.start.x, this.start.y)
    return Vertex.add(startVec, newVec)
  }

  // lerp 0-1 from mid to start/endpoint
  scaledStartPoint(lerp, mid = 0.5) {
    return this.pointOnsegment(mid - lerp * mid)
  }
  scaledEndPoint(lerp, mid = 0.5) {
    return this.pointOnsegment(mid + lerp * (1 - mid))
  }
  //METH: distancedStartPoint() : get point on segment given distance from start
  distancedStartPoint(distance) { return this.pointOnsegment(distance / this.length) }
  //METH: distancedEndPoint() : get point on segment given distance from end
  distancedEndPoint(distance) { return this.pointOnsegment(1 - distance / this.length) }

  //TODO: I might be able to revert to this
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
// SIZE: 356 lines
function protoSegment({ start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, maxCubicVerts, insetScale, shape, _direction } = {}) {
  return new ProtoSegment(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, maxCubicVerts, insetScale, shape, _direction)
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
  // maxCubicVerts = { start: undefined, end: undefined }
  neighbors = { start: undefined, end: undefined }

  constructor(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, maxCubicVerts, insetScale = 1, shape, _direction) {
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
    // if (maxCubicVerts) {
    //   this.maxCubicVerts = maxCubicVerts
    // }
    // else if (grid) { this.#setupMaxCubicVerts() }
    if (cubicVerts) { this.cubicVerts = cubicVerts }
    if (neighbors) { this.neighbors = neighbors }
    if (!this.direction.allAreCardinal) {
      DeBug.error(`this segment is not Cardinal!`, this)
    }
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
    if (!this.isVert) {
      return super.direction
    } else {
      return this._direction || super.direction
    }
  }
  //MEMO: outsideCells
  get outsideCells() {
    return memoize(() => {
      return this.grid.tempOutlineSelection(this.cells, 1, this.direction.toLeft)
    }, `outsideCells`).call(this)
  }

  //MEMO: turns
  get turns() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        DeBug.error(`segment ${this.id} without neighbors has no turns`)
        return
      }
      const start = this.startNeighbor.direction.turnTo(this.direction)
      const end = this.direction.turnTo(this.endNeighbor.direction)

      if (!start) { DeBug.error(`segment ${this.id} failed to calculate start turn`) }
      if (!end) { DeBug.error(`segment ${this.id} failed to calculate end turn`) }

      return {
        start: start,
        end: end
      }
    }, `turns`).call(this)
  }
  get endTurn() { return this.turns.end }
  //MEMO: normals
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

  //MEMO: part
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

  // get hasInsideTurn() { return this.turns?.start.name === 'Left' || this.turns?.end.name === 'Left' }
  //MEMO: isOutsideCorner
  get isOutsideCorner() {
    return memoize(() => {
      return this.turns?.end.isRight
    }, `isOutsideCorner`).call(this)
  }
  //MEMO: isCutOut()
  get isCutOut() {
    return memoize(() => {
      return this.shape.cutOutSegs?.some(cut => cut.id === this.id) || false
    }, `isCutOut`).call(this)
  }
  //MEMO: cornerVerts
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
  //MEMO: corners
  get corners() {
    return memoize(() => {
      const startDir = this.startNeighbor.direction
      const endDir = this.direction
      const startTurn = this.turns?.start
      const endTurn = this.turns?.end
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
  get hasOnlyOneCubicVert() {
    return (this.hasCubicStartVert || this.hasCubicEndVert) && !(this.hasBothCubicVerts)
  }
  get hasBothCubicVerts() { return this.hasCubicStartVert && this.hasCubicEndVert }
  get cubicVertCount() {
    if (this.hasBothCubicVerts) { return 2 }
    if (this.hasOnlyOneCubicVert) { return 1 }
    if (!this.hasSomeCubicVerts) { return 0 }
  }

  get finalCubicStartVert() {
    const finalLength = min(this.availableStartLength, this.startNeighbor.availableEndLength)
    return this.distancedStartPoint(finalLength)
  }
  get finalCubicEndVert() {
    const finalLength = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    return this.distancedEndPoint(finalLength)
  }

  #availableLength(start = true, max = false) {
    if (!this.cornerVerts?.start || !this.cornerVerts?.end) {       // needs to have cornerVerts to calculate
      DeBug.warn(`cannot calculate available length without cornerVerts`)
      DeBug.log(this)
      return
    }
    if (this.hasNoCubicVerts) { return this.length / 2 }            // assume half of entire length available
    // if (this.hasNoCubicVerts) { return this.length }             // assume entire length available
    else {
      let startLength, endLength
      if (this.hasCubicStartVert) {
        startLength = max ? this.maxCubicStartLength : this.start.dist(this.cubicVerts.start)
        // DeBug.log(`availableLength: startLength: ${startLength}, maxStartLength: ${this.maxCubicStartLength} `)
        // if (roundToDec(this.maxCubicStartLength) < roundToDec(startLength)) {
        //   startLength = this.maxCubicStartLength
        // }
      }
      if (this.hasCubicEndVert) {
        endLength = max ? this.maxCubicEndLength : this.end.dist(this.cubicVerts.end)
        // DeBug.log(`availableLength: endLength: ${endLength}, maxEndLength: ${this.maxCubicEndLength} `)
        // if (roundToDec(this.maxCubicEndLength) < roundToDec(endLength)) {
        //   endLength = this.maxCubicEndLength
        // }
      }
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
                startLength = this.length / 2
                endLength = startLength
              } else if (approxToDec(startLength, 2, 1) > approxToDec(endLength, 2, 1)) {
                startLength = this.length - endLength
              } else {
                endLength = this.length - startLength
              }
            }
          }
        } else {                                                      // segment only has one cubicVert
          if (startLength) {                                          // only has cubicStartVert
            endLength = this.length - startLength
          } else {                                                    // only has cubicEndVert
            startLength = this.length - endLength
          }
        }
      }


      if (start) {
        return startLength
      } else {
        return endLength
      }
    }
  }

  get availableStartLength() { return this.#availableLength() }
  get availableEndLength() { return this.#availableLength(false) }
  get maxAvailableStartLength() { return this.#availableLength(true, true) }
  get maxAvailableEndLength() { return this.#availableLength(false, true) }
  get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

  //MARK: Cubic Vert methods
  //METH: canCurveTo()
  canCurveTo(newOrigin, current = false) {
    const viables = current ? this.currentViableArcOrigins : this.viableArcOrigins
    // DeBug.log(newOrigin)
    const canCurve = viables.some(v => v.equals(newOrigin, 1))
    if (!canCurve) {
      DeBug.log(`newOrigin`, newOrigin)
      DeBug.log(`viables`, viables)
    }
    return canCurve
  }
  //METH: assignMid()
  assignMid() {
    this.addCubicStartVert(this.mid)
    this.addCubicEndVert(this.mid)
  }

  addCubicStartVert(vert, replace = false) { this.#addCubicVert(vert, replace, true) }
  addCubicEndVert(vert, replace = false) { this.#addCubicVert(vert, replace, false) }

  addDistancedCubicStartVert(distance, replace = false) {
    this.addCubicStartVert(this.distancedStartPoint(distance), replace)
  }
  addDistancedCubicEndVert(distance, replace = false) {
    this.addCubicEndVert(this.distancedEndPoint(distance), replace)
  }

  addDistancedStartCornerVerts(distance, replace = false) {
    this.neighbors.start.addDistancedCubicEndVert(distance, replace)
    this.addDistancedCubicStartVert(distance, replace)
  }
  addDistancedEndCornerVerts(distance, replace = false) {
    this.addDistancedCubicEndVert(distance, replace)
    this.neighbors.end.addDistancedCubicStartVert(distance, replace)
  }
  addBothDistancedCornerVerts(distance, replace = false) {
    this.addDistancedStartCornerVerts(distance, replace)
    this.addDistancedEndCornerVerts(distance, replace)
  }

  // removeCubicStartVert() { this.#removeCubicVert() }                                                          //UNUSED:
  // removeCubicEndVert() { this.#removeCubicVert(false) }                                                       //UNUSED:

  // removeStartCornerVerts() {                                                                                  //UNUSED:
  //   this.removeCubicStartVert()
  //   this.neighbors.start.removeCubicEndVert()
  // }
  // removeEndCornerVerts() {                                                                                    //UNUSED:
  //   this.removeCubicEndVert()
  //   this.neighbors.end.removeCubicStartVert()
  // }

  // replaceCubicStartVert(vert) { this.#replaceCubicVert(vert, true) }                                          //UNUSED:
  // replaceCubicEndVert(vert) { this.#replaceCubicVert(vert, false) }                                           //UNUSED:

  // matchStartCorner() {                                                                                        //UNUSED:
  //   // const start = this.startNeighbor
  //   // const neighborEnd = start.hasNoCubicVerts ? start.maxCubicStartLength : start.availableStartLength
  //   const startMin = min(this.availableStartLength, this.startNeighbor.availableStartLength)
  //   this.addDistancedStartCornerVerts(startMin, true)
  // }
  matchEndCorner() {
    // this.setEndCurveOrigin(this.middleArcOrigin)
    // const end = this.endNeighbor
    // const neighborStart = end.hasNoCubicVerts ? end.maxCubicStartLength : end.availableStartLength
    const endMin = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    this.addDistancedEndCornerVerts(endMin, true)
  }
  setArcToMiddle(replace = true) {
    const mid = this.middleArcOrigin
    if (replace) {
      this.replaceEndCurveOrigin(mid)
    } else {
      this.setEndCurveOrigin(mid)
    }

  }

  // matchCorners() {                                                                                    //UNUSED:
  //   this.matchStartCorner()
  //   this.setArcToMiddle()
  // }
  // matchNeighborCorners() {                                                                            //UNUSED:
  //   this.matchStartCorner()
  //   this.endNeighbor.setArcToMiddle()
  // }
  setMinEndCorner(replace = false) { this.addDistancedEndCornerVerts(this.cellRadius, replace) }
  // setMinStartCorner() { this.addDistancedStartCornerVerts(this.cellRadius) }                          //UNUSED:
  // setMinCorners() { this.addBothDistancedCornerVerts(this.cellRadius) }                               //UNUSED:

  setEndCurveOrigin(vert) { return this.#setCurveOrigin(vert) }
  replaceEndCurveOrigin(vert) { return this.#setCurveOrigin(vert, true) }

  setEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert) }
  replaceEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert, true) }

  #setRadiantOrigin(vert, replace = false, start = false, out = true) {
    if (vert) { this.#setCurveOrigin(vert, replace, start) }
    const radWrappers = out ? this.radiantOutWrappers : this.radiantInWrappers
    const allWrappers = out ? this.outWrappers : this.inWrappers
    radWrappers?.forEach(w => w.#setCurveOrigin(this.arcOrigin, replace, start))
    if (allWrappers?.length > radWrappers?.length) {
      const last = radWrappers.last
      if (last.flushOutWrapper) {
        last.flushWrap(true)
      } else {
        last.adjWrap(true)
      }
      last.outWrapper.replaceEndRadiantOutWrapsOrigin()
    }
  }

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
      const intersect = seg.perpendicularIntersectionWith(toVert)
      if (report) {                                                                                     //LOGGING:
        DeBug.log(`intersect`, intersect)                                                             //LOGGING:
        // DeBug.log(`newRadius`, newRadius)                                                             //LOGGING:
      }
      const newRadius = toVert.dist(intersect)
      if (report) {                                                                                     //LOGGING:
        // DeBug.log(`intersect`, intersect)                                                             //LOGGING:
        DeBug.log(`newRadius`, newRadius)                                                             //LOGGING:
      }
      seg.addDistancedEndCornerVerts(newRadius, replace)
    }
  }
  //METH: #addCubicVert()
  #addCubicVert(vert, replace = false, start = false, usePoints = false) {
    let report = false
    const mode = start ? 'Start' : `End`
    if (
      this.id.includes('cell1446')                                                                       //LOGGING:
      // || this.id.includes('cell185')                                                                    //LOGGING:
      // || this.id.includes('cell001')                                                                    //LOGGING:
    ) { report = true }                                                                                 //LOGGING:
    if (report) {                                                                                       //LOGGING:
      DeBug.warn(`addCubic${mode}Vert: ${vert?.string}`, this)                                        //LOGGING:
      DeBug.log(`hasCubicStartVert: ${this.hasCubicStartVert}`)                                       //LOGGING:
      if (this.availableStartLength) { DeBug.log(`availableStartLength: ${this.availableStartLength}`) }  //LOGGING:
      DeBug.log(`hasCubicEndVert: ${this.hasCubicEndVert}`)                                           //LOGGING:
      if (this.availableEndLength) { DeBug.log(`availableEndLength: ${this.availableEndLength}`) }    //LOGGING:
    }

    const cubicVert = start ? this.cubicVerts.start : this.cubicVerts.end
    if (cubicVert && !replace) { return }

    if (vert instanceof Vertex) {
      if (!this.vertIsOnLine(vert)) {
        DeBug.error(`trying to assign a cubicVert that is not on this segment`)
        DeBug.log(`off-line vert`, vert)
        DeBug.log(`this.segment`, this)
        return
      }

      const matchingPoint = this.points.find(p => p.equals(vert, 1))
      if (!matchingPoint) {
        if (usePoints) {
          DeBug.error(`trying to assign a cubicVert that is not a functional point on this segment`)
          DeBug.log(`bad vert`, vert)
          DeBug.log(`this.points`, this.points)
          return
        }
      }
      if (start) {
        this.cubicVerts.start = usePoints ? matchingPoint : vert
      } else {
        this.cubicVerts.end = usePoints ? matchingPoint : vert
      }

      this.#resetMemoProps()
      if (report) {
        DeBug.log(`this.cubicStartVert: ${this.cubicVerts.start?.string}`)
        DeBug.log(`this.cubicEndVert: ${this.cubicVerts.end?.string}`)
        DeBug.log(`new available${mode}Length:`, start ? this.availableStartLength : this.availableEndLength)
      }
    }
  }
  //METH: #removeCubicVert()
  // #removeCubicVert(start = true, max = false) {                                                          //UNUSED:
  //   if (max === false) {
  //     if (start) { this.cubicVerts.start = undefined } else { this.cubicVerts.end = undefined }
  //   } else {
  //     if (start) { this.maxCubicVerts.start = undefined } else { this.maxCubicVerts.end = undefined }
  //   }
  //   this.#resetMemoProps()
  // }
  //METH: #replaceCubicVert()
  // #replaceCubicVert(vert, start) {                                                                       //UNUSED:
  //   this.#addCubicVert(vert, true, start)
  // }
  //METH: #resetMemoProps()
  #resetMemoProps(andNeighbors = true) {
    const segs = andNeighbors ? this.andNeighborsArray : [this]
    segs.forEach(s => {
      resetMemoized(s,
        `adjDistanceObjs`,
        `arcCenterTangent`,
        `arcCenterMidPointTangent`,
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
  //MARK: Max Verts
  // #region Max Verts
  // get hasMaxStartVert() { return !!this.maxCubicVerts.start }                                           //UNUSED:
  // get hasMaxEndVert() { return !!this.maxCubicVerts.end }                                               //UNUSED:
  // get hasSomeMaxVerts() { return this.hasMaxStartVert || this.hasMaxEndVert }                           //UNUSED:
  // get hasNoMaxVerts() { return !this.hasSomeMaxVerts }                                                  //UNUSED:
  // get hasOnlyOneMaxVert() {                                                                             //UNUSED:
  //   return (this.hasMaxStartVert || this.hasMaxEndVert) && !(this.hasBothMaxVerts)
  // }
  // get hasBothMaxVerts() { return this.hasMaxStartVert && this.hasMaxEndVert }                           //UNUSED:

  get maxCubicStartLength() {
    // if (this.hasCubicEndVert) { return this.start.dist(this.cubicVerts.end) }
    const length = this.hasMaxStartVert ? this.start.dist(this.maxCubicVerts.start) : this.maxCubicLength
    return length
  }

  get maxCubicEndLength() {
    // if (this.hasCubicStartVert) { return this.end.dist(this.cubicVerts.start) }
    const length = this.hasMaxEndVert ? this.end.dist(this.maxCubicVerts.end) : this.maxCubicLength
    return length
  }

  get maxCubicLength() { return this.length - this.cellRadius * this.insetScale }

  // get finalMaxStartVert() {                                                                             //UNUSED:
  //   const length = min(this.maxCubicStartLength, this.startNeighbor.maxCubicEndLength)
  //   return this.distancedStartPoint(length)
  // }
  // get finalMaxEndVert() {                                                                               //UNUSED:
  //   const length = min(this.maxCubicEndLength, this.endNeighbor.maxCubicStartLength)
  //   return this.distancedEndPoint(length)
  // }

  // #setupMaxCubicVerts() {                                                                               //UNUSED:
  //   const max = this.length - this.cellRadius
  //   DeBug.warn(` setupMaxCubicVerts this.length: ${this.length}, this.cellRadius: ${this.cellRadius},`)
  //   this.maxCubicVerts = { start: this.distancedStartPoint(max), end: this.distancedEndPoint(max) }
  // }
  // addMaxStartVert(vert, replace = false) { this.#addCubicVert(vert, replace, true, false) }             //UNUSED:
  // addMaxEndVert(vert, replace = false) { this.#addCubicVert(vert, replace, false, false) }              //UNUSED:
  // #endregion
  //MARK: Combined Cubic Verts
  // #region Combined Cubic Verts
  get hasAStartVert() { return this.hasMaxStartVert || this.hasCubicStartVert }
  get hasAnEndVert() { return this.hasMaxEndVert || this.hasCubicEndVert }
  get hasArc() { return this.hasAnEndVert && this.endNeighbor.hasAStartVert }
  // get startVert() { return this.cubicVerts.start || this.maxCubicVerts.start }                           //UNUSED:
  // get endVert() { return this.cubicVerts.end || this.maxCubicVerts.end }                                 //UNUSED:
  //MEMO: hasCompleteStartCorner
  get hasCompleteStartCorner() {
    return memoize(() => {
      return this.startNeighbor.hasAnEndVert && this.hasAStartVert
        && equalsRoundedDec(this.startNeighbor.availableEndLength, this.availableStartLength)
    }, `hasCompleteStartCorner`).call(this)
  }
  //MEMO: hasCompleteEndCorner
  get hasCompleteEndCorner() {
    return memoize(() => {
      return this.hasAnEndVert && this.endNeighbor.hasAStartVert
        && equalsRoundedDec(this.availableEndLength, this.endNeighbor.availableStartLength)
    }, `hasCompleteEndCorner`).call(this)
  }
  get hasBothCompleteCorners() { return this.hasCompleteStartCorner && this.hasCompleteEndCorner }

  // #endregion
  //MARK: Flatness
  // #region Flatness
  //MEMO: flatAmount
  get flatAmount() {
    return memoize(() => {
      return this.finalCubicStartVert.dist(this.finalCubicEndVert)
    }, `flatAmount`).call(this)
  }
  //MEMO: hasNoFlatness
  get hasNoFlatness() {
    return memoize(() => {
      return roundToDec(this.flatAmount, 1) === 0
    }, `hasNoFlatness`).call(this)
  }
  get hasFlatness() { return !this.hasNoFlatness }

  get hasFlatStartNeighbor() { return this.startNeighbor.hasFlatness }
  get hasFlatEndNeighbor() { return this.endNeighbor.hasFlatness }
  get hasFlatNeighbor() { return this.hasFlatStartNeighbor || this.hasFlatEndNeighbor }

  // get canCurveMore() { return this.hasFlatness && this.hasFlatNeighbor }                                      //UNUSED:
  get canCurveMoreAtEnd() { return this.hasFlatness && this.hasFlatEndNeighbor }
  get canCurveLessAtEnd() { return roundToDec(this.availableEndLength, 1) > roundToDec(this.cellRadius, 1) }

  get couldCurveMoreMoreAtEnd() { return this.arcRadius < this.maxArcRadius }
  // get isLooseCorner() { return this.isOutsideCorner && this.canCurveMoreAtEnd }                               //UNUSED:
  // #endregion
  //MARK: Corner Arc
  // #region Corner Arc
  // get hasArc() { return this.hasBothVerts }
  //MEMO: arcRadius
  get arcRadius() {
    return memoize(() => {
      return min(this.availableEndLength, this.endNeighbor.availableStartLength)
    }, `arcRadius`).call(this)
  }
  //METH: pointOnArcRotFromStart()
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
  //METH: pointOnArcRotFromEnd()
  pointOnArcRotFromEnd(deg) { return this.pointOnArcRotFromStart(90 - deg) }

  get arcCenterVert() {
    return memoize(() => {
      return this.pointOnArcRotFromStart(45)
    }, `arcCenterVert`).call(this)
  }

  get arcStartCorner() { return this.finalCubicEndVert }
  get arcNormalCorner() { return this.end }
  get arcEndCorner() { return this.endNeighbor.finalCubicStartVert }
  //MEMO: arcOrigin
  get arcOrigin() {
    return memoize(() => {
      if (!this.hasArc) { return this.maxArcOrigin }
      // if (!this.hasArc) return
      return Vertex.add(this.arcStartCorner, segment(this.arcNormalCorner, this.arcEndCorner).lineVector)
    }, `arcOrigin`).call(this)
  }

  //MEMO: middleArcOrigin
  get middleArcOrigin() {
    return memoize(() => {
      const radius = min(this.length, this.endNeighbor.length) / 2
      const arcStartCorner = this.distancedEndPoint(radius)
      const arcEndCorner = this.endNeighbor.distancedStartPoint(radius)
      return Vertex.add(arcStartCorner, segment(this.arcNormalCorner, arcEndCorner).lineVector)
    }, `middleArcOrigin`).call(this)
  }
  //MEMO: arcOriginToStart
  get arcOriginToStart() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcStartCorner)
    }, `arcOriginToStart`).call(this)
  }
  //MEMO: arcOriginToNormal
  get arcOriginToNormal() {
    return memoize(() => {
      return segment(this.arcOrigin, this.arcNormalCorner)
    }, `arcOriginToNormal`).call(this)
  }
  //MEMO: arcOriginToEnd
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
  get arcBounds() { if (this.hasArc) { return this.arcOriginToNormal.bounds } }
  get arcBoundsHorizontal() {
    if (this.arcBounds) { return { xMin: 0, xMax: 100, yMin: this.arcBounds.yMin, yMax: this.arcBounds.yMax } }
  }
  get arcBoundsVertical() {
    if (this.arcBounds) { return { xMin: this.arcBounds.xMin, xMax: this.arcBounds.xMax, yMin: 0, yMax: 200 } }
  }

  //MEMO: arcCenterMidPointTangent
  get arcCenterMidPointTangent() {
    // DeBug.warn(`arcCenterMidPointTangent`, this.hasArc)
    // return memoize(() => {
    return this.#calcArcCenterMidTangent()
    // }, `arcCenterMidPointTangent`).call(this)
  }
  //MEMO: maxArcCenterMidTangent
  // get maxArcCenterMidTangent() {                                                                        //UNUSED:
  //   // DeBug.warn(`maxArcCenterMidTangent`, this.hasArc)
  //   return memoize(() => {
  //     return this.#calcArcCenterMidTangent(false)
  //   }, `maxArcCenterMidTangent`).call(this)
  // }
  //MEMO: minArcCenterMidTangent
  // get minArcCenterMidTangent() {                                                                        //UNUSED:
  //   // DeBug.warn(`minArcCenterMidTangent`, this.hasArc)
  //   return memoize(() => {
  //     return this.#calcArcCenterMidTangent(false, false)
  //   }, `minArcCenterMidTangent`).call(this)
  // }

  #calcArcCenterMidTangent(current = true, max = true) {
    let radius, start
    if (current) {
      start = this.arcOriginToArcCenter.mid
      radius = this.arcRadius * 2.8
    } else {
      //       start = max ? segment(this.maxArcOrigin, this.).mid
      // radius = max ? this.maxArcRadius : this.minArcRadius
    }
    const vect = this.arcNormalDirection.toLeft.lineVector.setMag(radius)
    const end = Vertex.add(vect, start)
    return segment(start, end)
  }

  get hasMinArcRadius() { return equalsRoundedDec(this.maxArcRadius, this.cellRadius, 0) }

  //MARK: Max and Min Possible Arcs 
  get currentMaxArcRadius() {
    return min(this.maxAvailableEndLength, this.endNeighbor.maxAvailableStartLength)
  }
  get currentMaxStartCorner() { return this.distancedEndPoint(this.currentMaxArcRadius) }
  get currentMaxEndCorner() { return this.endNeighbor.distancedStartPoint(this.currentMaxArcRadius) }
  get currentMaxArcOrigin() {
    if (this.hasNoFlatness) { return this.arcOrigin }
    if (this.hasArc) {
      return Vertex.add(this.currentMaxStartCorner, segment(this.arcNormalCorner, this.currentMaxEndCorner).lineVector)
    } else {
      return this.maxArcOrigin
    }

  }
  get isUsingMiddleOrigin() { return this.arcOrigin.equals(this.middleArcOrigin, 1) }
  get canCurveToMiddleOrigin() { return this.canCurveTo(this.middleArcOrigin) }

  //MEMO: maxArcRadius
  get maxArcRadius() {
    return memoize(() => {
      return approxToDec(min(this.maxCubicEndLength, this.endNeighbor.maxCubicStartLength), 4, 2)
    }, `maxArcRadius`).call(this)
  }
  //MEMO: maxStartCorner
  get maxStartCorner() {
    return memoize(() => {
      return this.distancedEndPoint(this.maxArcRadius)
    }, `maxStartCorner`).call(this)
  }
  //MEMO: maxEndCorner
  get maxEndCorner() {
    return memoize(() => {
      return this.endNeighbor.distancedStartPoint(this.maxArcRadius)
    }, `maxEndCorner`).call(this)
  }
  //MEMO: maxArcOrigin
  get maxArcOrigin() {
    return memoize(() => {
      return Vertex.add(this.maxStartCorner, segment(this.arcNormalCorner, this.maxEndCorner).lineVector)
    }, `maxArcOrigin`).call(this)
  }

  //MEMO: maxArcBoundsSeg
  get maxArcBoundsSeg() {
    return memoize(() => {
      return segment(this.maxArcOrigin, this.arcNormalCorner)
    }, `maxArcBoundsSeg`).call(this)
  }
  //MEMO: maxArcBounds
  get maxArcBounds() {
    return memoize(() => {
      return this.maxArcBoundsSeg.bounds
    }, `maxArcBounds`).call(this)
  }
  //MEMO: maxArcCells
  get maxArcCells() {
    return memoize(() => {
      return this.grid.cellSpanBetween(this.cells[0].index, this.endNeighbor.cells.last.index)
      // .intersect(this.shape.cells, `id`)
    }, `maxArcCells`).call(this)
  }
  //MEMO: minArcRadius
  get minArcRadius() {
    return memoize(() => {
      return approxToDec(min(this.cellRadius), 4, 1)
    }, `minArcRadius`).call(this)
  }
  //MEMO: minStartCorner
  get minStartCorner() {
    return memoize(() => {
      return this.distancedEndPoint(this.minArcRadius)
    }, `minStartCorner`).call(this)
  }
  //MEMO: minEndCorner
  get minEndCorner() {
    return memoize(() => {
      return this.endNeighbor.distancedStartPoint(this.minArcRadius)
    }, `minEndCorner`).call(this)
  }
  //MEMO: minArcOrigin
  get minArcOrigin() {
    return memoize(() => {
      return Vertex.add(this.minStartCorner, segment(this.arcNormalCorner, this.minEndCorner).lineVector)
    }, `minArcOrigin`).call(this)
  }
  //MEMO: minArcBoundsSeg
  get minArcBoundsSeg() {
    return memoize(() => {
      return segment(this.minArcOrigin, this.arcNormalCorner)
    }, `minArcBoundsSeg`).call(this)
  }
  //MEMO: minArcBounds
  get minArcBounds() {
    return memoize(() => {
      return this.minArcBoundsSeg.bounds
    }, `minArcBounds`).call(this)
  }
  //MEMO: viableArcOriginsSeg
  get viableArcOriginsSeg() {
    return memoize(() => {
      return segment(this.minArcOrigin, this.maxArcOrigin)
    }, `viableArcOriginsSeg`).call(this)
  }
  //MEMO: viableArcOrigins
  get viableArcOrigins() {
    return memoize(() => {
      if (this.hasMinArcRadius) { return OpArray.format(this.maxArcOrigin) }  // minArcRadius corners have single origin

      const horAspect = this.grid.cellAspect.isLandscape                      // need aspect to know minCellWidth axis
      const refSeg = horAspect === this.isVertical ? this : this.endNeighbor  // seg to reference points from
      const refPoints = refSeg.points
        .slice(1, -1)                            // remove first & last, cant be arcOrigins
      // DeBug.log(``)                                                                                //LOGGING:
      // DeBug.log(`viableArcOrigins()`, this)                                                        //LOGGING:
      // DeBug.log(`viableArcOrigins() horAspect`, horAspect)                                         //LOGGING:
      // DeBug.log(`refPoints`, refPoints)                                                            //LOGGING:
      // DeBug.log(`this.viableArcOriginsSeg`, this.viableArcOriginsSeg)                              //LOGGING:
      let projectedPoints = refPoints.map(p => {
        const projEnd = Vertex.add(refSeg.direction.toLeft.lineVector, p)
        const projSeg = segment(p, projEnd)
        return this.viableArcOriginsSeg.intersectionWith(projSeg, true)
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
    // DeBug.error(`currentViableArcOrigins`, this)                                                      //LOGGING:
    // DeBug.log(`currentViableArcOrigins viableArcOrigins`, this.viableArcOrigins)                      //LOGGING:
    if (this.viableArcOrigins.length === 1) { return this.viableArcOrigins }
    //FIXME: startBounds and endBounds should stretch to edges
    const startBounds = this.isVertical ?
      this.startNeighbor.arcBoundsHorizontal : this.startNeighbor.arcBoundsVertical
    const endBounds = this.endNeighbor.isVertical ?
      this.endNeighbor.arcBoundsHorizontal : this.endNeighbor.arcBoundsVertical
    // DeBug.log(`currentViableArcOrigins startBounds`, startBounds)                                     //LOGGING:
    // DeBug.log(`currentViableArcOrigins endBounds`, endBounds)                                         //LOGGING:
    const viables = this.viableArcOrigins.filter(v =>
      !vertIsWithinBounds(v, startBounds, false, 2)
      && !vertIsWithinBounds(v, endBounds, false, 2))
    // DeBug.log(`currentViableArcOrigins viables`, viables)                                             //LOGGING:
    return viables
  }

  get currentViableArcOriginsSeg() {
    const viables = this.currentViableArcOrigins
    return segment(viables.first, viables.last)
  }

  //MARK: Edges
  // get adjFrameEdge() {                                                                                    //UNUSED:
  //   const dir = this.normals.cubic
  //   const arcDir = this.isOutsideCorner ? dir : dir.opposites
  //   return FRAME.sides[arcDir.name]
  // }
  get adjStartShapeBoundsEdge() {
    const dir = this.normals.cubic
    const arcDir = this.startNeighbor.isOutsideCorner ? dir : dir.opposites
    return this.shape.sides[arcDir.name]
  }
  get adjEndShapeBoundsEdge() {
    const dir = this.normals.cubic
    const arcDir = this.isOutsideCorner ? dir : dir.opposites
    return this.shape.sides[arcDir.name]
  }

  // get arcStartToFrameEdgeSeg() {
  //   const edgeIntersect = this.arcOriginToStart.intersectionWith(this.adjFrameEdge, true)
  //   return segment(this.arcStartCorner, edgeIntersect)
  // }
  // get arcEndToFrameEdgeSeg() {
  //   const edgeIntersect = this.arcOriginToEnd.intersectionWith(this.endNeighbor.adjFrameEdge, true)
  //   return segment(this.arcEndCorner, edgeIntersect)
  // }

  get arcStartToShapeBoundsEdgeSeg() {
    // DeBug.log(this)
    const edgeIntersect = this.arcOriginToStart.intersectionWith(this.adjEndShapeBoundsEdge, true)
    return segment(this.arcStartCorner, edgeIntersect)
  }
  get arcEndToShapeBoundsEdgeSeg() {
    const edgeIntersect = this.arcOriginToEnd.intersectionWith(this.endNeighbor.adjStartShapeBoundsEdge, true)
    return segment(this.arcEndCorner, edgeIntersect)
  }

  //MARK: Corner Orientations
  //MEMO: inShapeSameFacingCorners
  get inShapeSameFacingCorners() {
    return memoize(() => {
      if (!this.shape) { DeBug.log(this) }
      return this.shape.simpleSubShapes.flat().exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `inShapeSameFacingCorners`).call(this)
  }
  //MEMO: andNeighborSameFacingCorners
  get andNeighborSameFacingCorners() {
    return memoize(() => {
      return this.shape.andNeighborSimples.exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `andNeighborSameFacingCorners`).call(this)
  }

  //MEMO: inShapeDiagonalCorners
  get diagonalCornersInShape() {                                                                        //UNUSED:
    return memoize(() => {
      return this.shape.simpleSubShapes.flat().exclude(this, 'id')
        .filter(s => this.hasDiagonalCorner(s))
    }, `inShapeDiagonalCorners`).call(this)
  }
  //MEMO: neighborDiagonalCorners
  get diagonalCornersInNeighborShapes() {                                                                        //UNUSED:
    return memoize(() => {
      return this.shape.andNeighborSimples.exclude(this, 'id')
        .filter(s => this.hasDiagonalCorner(s))
    }, `neighborDiagonalCorners`).call(this)
  }

  //METH: minArcIsWithinThatMaxArc()
  minArcIsWithinThatMaxArc(thatSeg) {
    return boundsIsWithinTestBounds(this.minArcBounds, thatSeg.maxArcBounds)
  }
  //METH: hasSameFacingCorner()
  hasSameFacingCorner(seg) { return this.endCorner.equals(seg.endCorner) }
  //METH: isDiagonalCorner()
  hasDiagonalCorner(seg) {
    // DeBug.warn(`hasDiagonalCorner`, this, seg)
    const facing = this.hasSameFacingCorner(seg)
    const colBoundsSeg = this.maxArcBoundsSeg.isCollinearWith(seg.maxArcBoundsSeg)
    // DeBug.log(`hasDiagonalCorner`, facing, colBoundsSeg)                                                //LOGGING:
    // DeBug.log(`segs:`, this.viableArcOriginsSeg, seg.viableArcOriginsSeg)                               //LOGGING:
    return facing && colBoundsSeg
    return this.hasSameFacingCorner(seg) && this.maxArcBoundsSeg.isCollinearWith(seg.maxArcBoundsSeg)
  }
  //METH: hasCollinearCorner()
  hasCollinearCorner(seg) {
    const facing = this.hasSameFacingCorner(seg)
    const collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
      || this.endNeighbor.isCollinearWith(seg) || this.endNeighbor.isCollinearWith(seg.endNeighbor)
    const sharedCorner = this.end.equals(seg.end, 0)
    // const isThirdWheel = () => {
    //   if (this.isOutsideCorner && seg.viableInWrappers.length > 1) {    // some shapes have shapes stacked inside
    //     if (seg.viableInWrappers.first.id !== this.id) {                // test that this === this.outWrapper.inWrapper 
    //       // if (seg.viableInWrappers[1].id === this.id) {                 // case: collinear wrappers could be equidistant from corner


    //       //   // return true
    //       // } else { 
    //       return false
    //       // }
    //     }
    //   } else { return false }                                           // only valid for outsideCorners 
    // }

    return facing && collinear && !sharedCorner
    // && !isThirdWheel()
  }
  //METH: hasCoincidentCorner()
  hasCoincidentCorner(seg) {
    const diagonal = this.hasDiagonalCorner(seg)
    const collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
      || this.endNeighbor.isCollinearWith(seg) || this.endNeighbor.isCollinearWith(seg.endNeighbor)
    const sharedCorner = this.end.equals(seg.end, 1, 0.1)
    return diagonal && collinear && sharedCorner
  }
  //METH: couldHaveInWrapper(seg) : BOOL : does not check orientation
  couldHaveInWrapper(seg) {
    // DeBug.log(this, seg)
    if (this.hasCoincidentCorner(seg)) {
      if (seg.isOutsideCorner === this.isOutsideCorner) {
        return boundsIsWithinTestBounds(seg.shape.bounds, this.shape.bounds)
      } else {
        return seg.isOutsideCorner                            // this is insideCorner and seg is outsideCorner
      }
      const inSameShape = this.shape.id === seg.shape.id
      return inSameShape === this.isOutsideCorner
    } else {
      return seg.minArcIsWithinThatMaxArc(this)
    }
  }
  //METH: inOutWrapObjWith(seg)
  inOutWrapObjWith(seg) {
    const inOut = this.couldHaveInWrapper(seg) ? [seg, this] : [this, seg]
    return { inWrapper: inOut[0], outWrapper: inOut[1] }
  }
  //METH: horVertInOutsSideObjWith(seg)
  horVertInOutsSideObjWith(seg) {
    const { inWrapper, outWrapper } = this.inOutWrapObjWith(seg)
    const [[horInSide, vertInSide], [horOutSide, vertOutSide]] = [inWrapper.horVertSides, outWrapper.horVertSides]
    return { horInSide: horInSide, vertInSide: vertInSide, horOutSide: horOutSide, vertOutSide: vertOutSide }
  }

  //MEMO: shapesWithinThisMaxArcBounds : [Shape] : array of Shapes within this.maxArcBounds, including this.shape
  get shapesWithinThisMaxArcBounds() {
    // DeBug.log(`shapesWithinThisMaxArcBounds`, this)
    return memoize(() => {
      return this.grid.perimeterShapes.filter(shp => {
        if (shp.id === this.shape.id) { return true }                   // always true for this.shape
        const cells = this.isOutsideCorner ?                            // cells to check intersect with
          this.shape.enclosedCells                                      // outside: enclosedCells to capture inner shapes
          : this.grid.cellsWithinBounds(this.maxArcBounds)              // inside: check cells within maxArcBounds

        if (boundsOverlap({ geo: [this.maxArcBounds, shp.bounds] })) {  // 1. test bounds overlap
          // DeBug.log(`cells`, cells.map(c => c.id))                                                //LOGGING:
          return !cells.intersect(shp.cells, `id`).isEmpty              // 2. test cells intersection
        }
      })
    }, `shapesWithinThisMaxArcBounds`).call(this)
  }

  //MEMO: viableInWrappers :          sameFacingCornersWithinThisMaxArcBounds
  get viableInWrappers() {         // sameFacingCornersWithinThisMaxArcBounds
    return memoize(() => {

      // const frontSegs = this.grid.frontGrid? this.grid.frontGrid.allSimpleSubShapesSegs: new OpArray
      // const 
      // const segs = this.shapesWithinThisMaxArcBounds.map(sh => sh.simpleSubShapes).flat(2)
      const segs = this.grid.isBackGrid ?
        this.grid.frontGrid.allSimpleSubShapesSegs : this.shapesWithinThisMaxArcBounds.map(sh => sh.simpleSubShapes).flat(2)
      return segs
        .filter(s => s.id !== this.id
          && this.hasSameFacingCorner(s)
          && s.minArcIsWithinThatMaxArc(this)
        )
        .sort((a, b) => a.minArcOrigin.dist(this.end) - b.minArcOrigin.dist(this.end))
    }, `viableInWrappers`).call(this)
  }

  //MEMO: viableOutWrappers :                            arcsContainingThisArc
  get viableOutWrappers() {                           // arcsContainingThisArc
    return memoize(() => {
      return this.andNeighborSameFacingCorners.filter(s => {
        if (
          this.minArcIsWithinThatMaxArc(s)
          // boundsOverlap({ geo: [this.maxArcBounds, s.maxArcBounds] })
        ) {  // 1. test bounds overlap
          return true
        }
      })
    }, `viableOutWrappers`).call(this)
  }

  //MEMO: viableWrappers :                           all possible wrappers
  get viableWrappers() {
    return memoize(() => {
      return this.viableOutWrappers.union(this.viableInWrappers, `id`)
        .sort((a, b) => a.minArcOrigin.dist(this.end) - b.minArcOrigin.dist(this.end))
      return viables
    }, `viableWrappers`).call(this)
  }

  //MARK: FLUSH WRAPPING
  //METH: findFlushDistanceObjs
  findFlushDistanceObjs(viables = this.viableWrappers) {
    // return memoize(() => {
    // DeBug.log(`findFlushDistanceObjs: `, this)
    // DeBug.log(`this.viableWrappers`, this.viableWrappers)
    if (viables.isEmpty) { return viables }

    //ARROW: closest()
    const closest = (segs, start) => {
      const testSeg = start ? this : this.endNeighbor
      const name = start !== this.isOutsideCorner ? `arcStartCorner` : `arcEndCorner` // choose arcCorner that's collinear 
      return segs
        .filter(s => {
          const testVertsSeg = testSeg.isHorizontal ? s.horVertSides[0] : s.horVertSides[1]
          // if (this.id.includes('cell180')) { DeBug.warn(`flushDistanceObjs current testVertsSeg`, testVertsSeg) }
          // DeBug.log(`testSeg`, testSeg)
          // DeBug.log(`testVertsSeg`, testVertsSeg)
          // const test1 = testSeg.vertIsOnLine(testVertsSeg.start)
          // const test2 = testSeg.vertIsOnLine(testVertsSeg.end)
          // const test3 = testVertsSeg.vertIsOnLine(testSeg.start)
          // const test4 = testVertsSeg.vertIsOnLine(testSeg.end)
          // const test5 = this.hasCollinearCorner(s) || this.hasCoincidentCorner(s)
          // DeBug.log(`test1`, test1)
          // DeBug.log(`test2`, test2)
          // DeBug.log(`test3`, test3)
          // DeBug.log(`test4`, test4)
          // DeBug.log(`test5`, test5)
          // return test1 || test2 || test3 || test4 && test3
          return testSeg.vertIsOnLine(testVertsSeg.start) || testSeg.vertIsOnLine(testVertsSeg.end)
            || testVertsSeg.vertIsOnLine(testSeg.start) || testVertsSeg.vertIsOnLine(testSeg.end)
            // return testSeg.isOverlappingWith(s) || testSeg.isOverlappingWith(s.endNeighbor)
            &&
            (this.hasCollinearCorner(s) || this.hasCoincidentCorner(s))
        })
        .map(s => {
          return { id: s.id, seg: s, dist: roundToDec(this.end.dist(s[name]), 4), isStart: !start }  // map to obj with dist to corner calculated
        })
        .sort((a, b) => a.dist - b.dist)                                  // sort 
    }
    const startWraps = closest(viables, true)                             // calculate closest obj on corner start
    const endWraps = closest(viables, false)                              // calculate closest obj on corner end
    // DeBug.log(`startWraps`, startWraps)
    // DeBug.log(`endWraps`, endWraps)
    if (!startWraps.isEmpty && !endWraps.isEmpty) {
      return startWraps.union(endWraps, `id`)
    } else if (!startWraps.isEmpty) {
      return startWraps
    } else if (!endWraps.isEmpty) {
      return endWraps
    } else {
      return new OpArray
    }
  }

  get flushDistanceObjs() {
    if (this.viableWrappers.isEmpty) { return this.viableWrappers }
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

  //MEMO: coincidentWrapper
  get coincidentWrapper() {
    // return memoize(() => {
    if (this.flushWrapper?.hasCoincidentCorner(this)) { return this.flushWrapper }
    // }, `coincidentWrapper`).call(this)
  }
  //MEMO: collinearWrapper
  get collinearWrapper() {
    // return memoize(() => {
    if (this.flushWrapper?.hasCollinearCorner(this)) { return this.flushWrapper }
    // }, `collinearWrapper`).call(this)
  }

  get flushIsInWrapper() { if (this.flushWrapper) { return this.couldHaveInWrapper(this.flushWrapper) } }
  get flushOutWrapper() { if (!this.flushIsInWrapper) { return this.flushWrapper } }
  get flushInWrapper() { if (this.flushIsInWrapper) { return this.flushWrapper } }

  get coinOutWrapper() { if (this.isOutsideCorner) { return this.coincidentWrapper } }
  get coinInWrapper() { if (!this.isOutsideCorner) { return this.coincidentWrapper } }
  get colOutWrapper() { if (this.isOutsideCorner) { return this.collinearWrapper } }
  get colInWrapper() { if (!this.isOutsideCorner) { return this.collinearWrapper } }

  //MARK: ADJACENT WRAPPING
  //METH: minAdjWrapperDistanceObj()
  //FIXME: there are issues, especially with non-square cell aspects triggering the longer intersect corners
  //FIXME: ultimately all wrappers (flush+adj) should be wrapped in one object, using tangX to choose wrapper
  minAdjWrapperDistanceObj(seg) {
    const { inWrapper, outWrapper } = this.inOutWrapObjWith(seg)                   // calc inOutWraps
    const { horInSide, vertInSide, horOutSide, vertOutSide } = this.horVertInOutsSideObjWith(seg) // horVertInOuts
    const vertDist = vertInSide.x - vertOutSide.x                                  // calc dist between vertSides
    const horDist = horInSide.y - horOutSide.y                                     // calc dist between horSides
    let dists = inWrapper.isVertical ? [vertDist, horDist] : [horDist, vertDist]   // organize into [start,end]
    const [startDist, endDist] = dists.map(d => abs(roundToDec(d), 1))             // simplify for later comparison

    const tangent = inWrapper.arcCenterMidPointTangent                             // calc arcCenterMidPointTangent
    const tangentIntersect = tangent.intersectionWith(outWrapper, true)            // calc intersection
    const tangDist = roundToDec(tangentIntersect.dist(outWrapper.end), 2)          // calc dist from intersect to corner

    const [startObj, endObj] = dists.map(d => abs(roundToDec(d), 1))               // map to objects
      .map((d, i) => {
        return { seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: d, isStart: i === 0 }
      })

    //NOTE: original, just in case this breaks!
    // let startDist = inWrapper.isVertical ?
    //   inWrapper.x - outWrapper.endNeighbor.x : inWrapper.y - outWrapper.endNeighbor.y
    // startDist = abs(roundToDec(startDist), 1)

    // let endDist = inWrapper.endNeighbor.isVertical ?
    //   inWrapper.endNeighbor.x - outWrapper.x : inWrapper.endNeighbor.y - outWrapper.y
    // endDist = abs(roundToDec(endDist), 1)

    // const startObj = {
    //   seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: startDist, isStart: true
    // }
    // const endObj = {
    //   seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: endDist, isStart: false
    // }

    // DeBug.error(`minAdjWrapperDistanceObj startObj`, startObj)
    // DeBug.error(`minAdjWrapperDistanceObj endObj`, endObj)
    // return [startObj, endObj]
    if (startDist === endDist) { return [startObj, endObj] }                        // return closest object(s) 
    //FIXME: Determine correct sign below, should be less than, right?
    else if (
      (inWrapper.isOutsideCorner !== outWrapper.isOutsideCorner
        &&
        startDist < endDist)
      ||
      (inWrapper.isOutsideCorner === outWrapper.isOutsideCorner
        &&
        startDist > endDist)
    ) {
      return startObj
    } else {
      return endObj
    }
  }
  //METH: intersectObj()
  intersectObj(seg, isStart) {
    const { inWrapper, outWrapper } = this.inOutWrapObjWith(seg)                    // calc inOutWraps
    const side = isStart ? outWrapper.endNeighbor : outWrapper  //FIXME: seems opposite? // calc side     
    //FIXME: test this works with flush (collinear) wraps   
    // DeBug.log(``)
    // DeBug.log(`intersectObj inOut`, [inWrapper.id, outWrapper.id])
    // DeBug.log(`intersectObj this`, this)
    // DeBug.log(`intersectObj seg`, seg) warn
    // DeBug.log(`intersectObj side`, side)
    // DeBug.log(`intersectObj inWrapper.arcOrigin`, inWrapper.arcOrigin)
    // const origin = inWrapper.hasArc ? inWrapper.arcOrigin : inWrapper.minArcOrigin
    const intersect =
      side.perpendicularIntersectionWith(inWrapper.arcOrigin)
      ||
      side.perpendicularIntersectionWith(inWrapper.minArcOrigin)             // calc intersection

    // const intersect = isStart ?
    //   inWrapper.arcStartToShapeBoundsEdgeSeg.intersectionWith(outWrapper.endNeighbor, true)
    //   : inWrapper.arcEndToShapeBoundsEdgeSeg.intersectionWith(outWrapper, true)
    const distToCorner = roundToDec(intersect.dist(outWrapper.end))                 // calc distance
    return { seg: seg, dist: distToCorner, intersect: intersect, isStart: isStart }
  }

  //MEMO : adjDistanceObjs
  get adjDistanceObjs() {
    // if (this.id.includes('cell019')) {
    //   DeBug.warn(`processing cell199`)
    // }
    // return memoize(() => {
    const outside = !this.isOutsideCorner             // opposite isOutsideCorner value of this
    //ARROW: canHaveCorrectBounds()
    const canHaveCorrectBounds = (seg) => {
      return this.isOutsideCorner ? seg.minArcIsWithinThatMaxArc(this) : this.minArcIsWithinThatMaxArc(seg)
    }
    //ARROW: canHaveCorrectSize()
    const canHaveCorrectSize = (seg) => {             // this radius should be either larger or smaller than adjWrap
      return this.isOutsideCorner ?
        roundToDec(this.maxArcRadius, 2) > roundToDec(this.cellRadius, 2)   // bigger when this is OutsideCorner
        : roundToDec(this.cellRadius, 2) < roundToDec(seg.maxArcRadius, 2)  // smaller when this is InsideCorner
    }

    // let adjWraps = this.inShapeSameFacingCorners
    // DeBug.log(`adjDistanceObjs`, this)
    // DeBug.log(`viableInWrappers`, this.viableWrappers)
    let adjWraps = this.viableWrappers
      .filter(s =>
        this.hasSameFacingCorner(s)
        // &&
        // s.isOutsideCorner === outside                                       // is opposite?
        && !this.hasCoincidentCorner(s)
        && !this.hasCollinearCorner(s)
        && canHaveCorrectBounds(s)
        && canHaveCorrectSize(s)                                            // canHaveCorrectSize? 
      )
      .map(s => this.minAdjWrapperDistanceObj(s)).flat()
      .sort((a, b) => a.dist - b.dist)
      .sort((a, b) => a.tangDist - b.tangDist)
    // .sort((a, b) => a.seg.couldHaveInWrapper(b.seg) - b.seg.couldHaveInWrapper(a.seg))
    // .sort((a, b) => b.seg.couldHaveInWrapper(a.seg) - a.seg.couldHaveInWrapper(b.seg))
    // DeBug.log(`adjWraps`, adjWraps)
    return adjWraps
    // }, `adjDistanceObjs`).call(this)
  }

  get adjIntersectObjs() {
    //ARROW: inOutSorted()
    const inOutSorted = (objs) => {
      if (objs.length > 1) {                            // there are two or more wrappers that are coincident pair
        // DeBug.log(`objs pre`, objs)
        if (objs.length > 2) {                          // wrappers are diagonal so start/end for each seg
          let newObjs = new OpArray
          objs.forEach(obj => {                         // filter out repeat seg objs
            if (newObjs.isEmpty || !newObjs.some(newObj => newObj?.seg.id === obj.seg.id)) { newObjs.push(obj) }
          })
          objs = newObjs
        }
        // DeBug.log(`objs post`, objs)
        if (this.couldHaveInWrapper(objs[0].seg)) {     // objs are inWrappers
          // return objs.sort((a, b) => a.seg.couldHaveInWrapper(b.seg) - b.seg.couldHaveInWrapper(a.seg))
          return objs.sort((a, b) => b.seg.couldHaveInWrapper(a.seg) - a.seg.couldHaveInWrapper(b.seg))
        } else {                                        // objs are outWrappers
          return objs.sort((a, b) => a.seg.couldHaveInWrapper(b.seg) - b.seg.couldHaveInWrapper(a.seg))
          // return objs.sort((a, b) => b.seg.couldHaveInWrapper(a.seg) - a.seg.couldHaveInWrapper(b.seg))
        }
      } else {                                          // only single wrapper
        return objs
      }
    }

    const adjWraps = this.adjDistanceObjs
    const wrapsAreCoincident = adjWraps[1]?.seg.hasCoincidentCorner(adjWraps[0].seg)
    let finalWraps
    if (wrapsAreCoincident) {
      finalWraps = adjWraps
    } else {
      finalWraps = adjWraps
        .filter(obj =>
          obj.tangDist === adjWraps[0].tangDist
          && obj.dist === adjWraps[0].dist
        )
    }
    finalWraps = inOutSorted(finalWraps)
      .map(obj => this.intersectObj(obj.seg, obj.isStart))
    if (!wrapsAreCoincident) {
      finalWraps = finalWraps.sort((a, b) => a.dist - b.dist)
    }

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
  // get intendedArcRadius() {                                                                            //UNUSED:
  //   if (this.isOutsideCorner && this.adjInWrapper) { return this.adjInWrapper.adjWrapperObjsFinal.map(obj => obj.dist)[0] }
  // }
  //MEMO: adjacentWrapper
  get adjacentWrapper() {
    // return memoize(() => {
    return this.adjWrappersFinal[0]
    // }, `adjacentWrapper`).call(this)
  }

  get radiantWrapper() { }
  get proximalWrapper() { }

  get adjOutWrapper() { if (!this.isOutsideCorner) { return this.adjacentWrapper } }
  get adjInWrapper() { if (this.isOutsideCorner) { return this.adjacentWrapper } }

  //MARK: IN/OUT WRAPPING
  //FIXME: after wrapper calculation is combined (flush+adj) flushWrap and adjWrap should be removed, leaving single wrap method
  //METH: flushWrap() :
  flushWrap(replace = false, wrapOut = true) { return this.#wrap(true, replace, wrapOut) }
  //METH: adjWrap() :
  adjWrap(replace = false, wrapOut = true) { return this.#wrap(false, replace, wrapOut) }
  //METH: #wrap() :
  #wrap(flush, replace = false, wrapOut = true) {
    let wrapper = flush ? this.flushWrapper : this.adjacentWrapper
    const wrapType = flush ? `flushWrap()` : `adjWrap()`                                        //LOGGING:
    let report = false                                                                            //LOGGING:
    if (this.id.includes('cel210')                                                               //LOGGING:
      || this.id.includes('cel027')                                                              //LOGGING:
    ) {                                                                                           //LOGGING:
      report = true                                                                               //LOGGING:
      DeBug.error(`${wrapType} called on:`, this)                                               //LOGGING:
      DeBug.log(`wrapper:`, wrapper)                                                            //LOGGING:
    }

    if (wrapper
      // && viables
    ) {                                                    // has a flush wrapper
      if (report) { DeBug.log(`wrapper:`, wrapper.id) }                                         //LOGGING:
      const [inWrapper, outWrapper] = flush ? this.inOutFlushWrappers : this.inOutAdjWrappers
      const viables = flush ? this.viableCoinWrapOrigins : this.viableAdjWrapOrigins
      if (report) { DeBug.log(`viables:`, viables) }                                         //LOGGING:

      if (this.hasArc) {                                                         // this has arc
        if (report) { DeBug.log(`this hasArc`) }                                                //LOGGING:

        if (wrapper.hasArc                                                       // both have arcs!
          && wrapper.arcOrigin.equals(this.arcOrigin, 2)) {               // already flushly wrapped!
          if (report) { DeBug.log(`already flushly wrapped!`) }
          return
        }

        const target = wrapOut ? wrapper : this
        const source = wrapOut ? this : wrapper
        // if (viables?.some(v => this.arcOrigin.equals(v, 2))) {                    // arcs are diagonal & can wrap
        if (this.hasDiagonalCorner(wrapper)) {                  // wraps are diagonal (COINCIDENT or RADIANT)
          if (report) {                                                                           //LOGGING:
            DeBug.log(`this.arcOrigin`, this.arcOrigin)                                         //LOGGING:
            DeBug.log(`${wrapType} cubicVerts before`, wrapper.cubicVerts)                      //LOGGING:
          }                                                                                       //LOGGING:
          if (replace                                                            // forced replacement
            || (flush ? this.flushWrapIsNonEquidistant                          // nonEquidistant wrappers!
              : this.adjWrapIsNonEquidistant)) {                                    // nonEquidistant wrappers!
            if (report) { DeBug.log(`replacing end curve origin`) }                                       //LOGGING:
            target.replaceEndCurveOrigin(source.arcOrigin)                        // replace matching wrapper curve
          } else {
            // DeBug.log(`setting end curve origin`)                                            //LOGGING:
            target.setEndCurveOrigin(source.arcOrigin)                            // set matching wrapper curve
          }
          if (report) {                                                                           //LOGGING:
            DeBug.log(`wrapper.setEndCurve`)                                                    //LOGGING:
            DeBug.log(`${wrapType} cubicVerts after`, wrapper.cubicVerts)                       //LOGGING:
          }                                                                                       //LOGGING:
          // }

        } else {                                                // wraps are NOT diagonal (COLLINEAR or PROXIMAL)
          // const target = wrapOut ? wrapper : this

          if (flush) {                                          // wraps are COLLINEAR 
            const obj = target.flushIntersectObjs[0]
            if (report) {
              DeBug.log(`wraps are COLLINEAR`)                                                  //LOGGING: 
              DeBug.log(`target`, target)                                                     //LOGGING:
              DeBug.log(`flushDistanceObjs:`, obj)                                              //LOGGING:
            }                                                                                     //LOGGING:
            if (obj) {
              if (report) {
                DeBug.log(`obj.dist`, obj.dist)
                DeBug.log(`target.maxArcRadius`, target.maxArcRadius)
              }
              if (obj.dist < target.maxArcRadius) {
                if (report) { DeBug.log(`addDistancedEndCornerVerts`) }
                target.addDistancedEndCornerVerts(obj.dist, true)
              } else {
                if (report) { DeBug.log(`replaceEndCurveOrigin`) }
                target.replaceEndCurveOrigin(target.currentMaxArcOrigin)
              }
              // const start = inWrapper.id === obj.start.seg.id        // part of outWrapper flush to inWrapper
              // const dist = start ? obj.start.dist : obj.end.dist
              // DeBug.log(`start`, start)
              // outWrapper.addDistancedEndCornerVerts(dist)
            }


          } else {                                              // wraps are PROXIMAL 
            const obj = target.adjIntersectObjs[0]
            if (report) {                                                                         //LOGGING:
              DeBug.log(`wraps are PROXIMAL `)                                                  //LOGGING:
              // DeBug.log(`target`, target)                                                  //LOGGING:
              // DeBug.log(`target int obj`, target.adjIntersectObjs[0])                 //LOGGING:
              DeBug.log(`intersectObject`, obj)                                                 //LOGGING:
            }
            if (obj) {
              if (obj.dist <= target.maxArcRadius) {
                DeBug.log(`addDistancedEndCornerVerts`)
                target.addDistancedEndCornerVerts(obj.dist, true)
                // target.replaceEndCurveOrigin(target.currentMaxArcOrigin)
              } else {
                DeBug.log(`replaceEndCurveOrigin`)
                target.replaceEndCurveOrigin(target.currentMaxArcOrigin)
              }
              // if (this.isAdjOutWrapper) {
              //   if (obj.dist >= wrapper.maxArcRadius) {
              //     wrapper.replaceEndCurveOrigin(wrapper.currentMaxArcOrigin)
              //   } else {
              //     wrapper.addDistancedEndCornerVerts(obj.dist, true, true)
              //   }
              // } else {
              //   if (obj.dist < wrapper.maxArcRadius) {
              //     wrapper.addDistancedEndCornerVerts(obj.dist, true, true)
              //   } else {
              //     wrapper.replaceEndCurveOrigin(wrapper.currentMaxArcOrigin)
              //   }
              // }


              // const wrapToMax = this.isAdjOutWrapper === obj.dist < wrapper.maxArcRadius
              // if (wrapToMax) {
              //   wrapper.addDistancedEndCornerVerts(obj.dist, true, true)
              // } else {
              //   wrapper.replaceEndCurveOrigin(wrapper.currentMaxArcOrigin)
              // }


              // wrapper.addDistancedEndCornerVerts(obj.dist, true, true)

            }
            // if (obj?.dist < wrapper.maxArcRadius) { wrapper.addDistancedEndCornerVerts(obj.dist, true, true) }
          }

        }


      } else {                                                                   // has NO arc
        if (report) { DeBug.log(`this DOES NOT hasArc`) }                                       //LOGGING:
        if (viables) {
          this.replaceEndCurveOrigin(viables.last)                                 // replace with largest viable
          wrapper.replaceEndCurveOrigin(viables.last)                              // replace with largest viable
        }

      }
    }
  }

  get outWrapper() {
    // const wraps = [this.flushOutWrapper, this.adjOutWrapper]
    // if (wraps.every(s => !!s)) {

    // } else {
    //   if (wraps[0]) { return wraps[0] }
    //   if (wraps[1]) { return wraps[1] }
    // }

    return this.flushOutWrapper || this.adjOutWrapper
  }
  get inWrapper() {
    // const wraps = [this.flushInWrapper, this.adjInWrapper]
    // if (wraps.every(s => !!s)) {

    // } else {
    //   if (wraps[0]) { return wraps[0] }
    //   if (wraps[1]) { return wraps[1] }
    // }

    return this.flushInWrapper || this.adjInWrapper
  }
  //MEMO: outWrappers
  get outWrappers() {
    // DeBug.log(`outWrappers.this`, this)                                                                     //LOGGING:
    return memoize(() => {
      // DeBug.log(`this`, this)                                                                     //LOGGING:
      // DeBug.log(`outWrapper`, this.outWrapper)                                                    //LOGGING:
      // DeBug.log(this.outWrapper?.outWrappers)                                                      //LOGGING:
      if (this.outWrapper) { return OpArray.format(this.outWrapper).union(this.outWrapper.outWrappers, `id`) }
    }, `outWrappers`).call(this)
  }
  //MEMO: radiantOutWrappers
  get radiantOutWrappers() {
    return memoize(() => {
      // if (this.outWrapperIsRadiant
      //   // && boundsIsWithinTestBounds(this.innerMostRadiantWrapper.minArcBoundsSeg, this.outWrapper.maxArcBoundsSeg)
      // ) {
      //   return OpArray.format(this.outWrapper)
      //     .union(this.outWrapper.radiantOutWrappers, `id`)
      //   // .filter(s => boundsIsWithinTestBounds(this.innerMostRadiantWrapper.minArcBoundsSeg, s.maxArcBoundsSeg))
      // }
      // DeBug.warn(`radiantOutWrappers for`, this)
      // DeBug.log(`outWrappers`, this.outWrappers?.map(o => o.id))
      //ARROW: filterRadiants()
      const filterRadiants = (outWrappers) => {
        // DeBug.log(`radiantOutWrappers this`, this)
        // DeBug.log(`radiantOutWrappers filterRadiants`)
        let radiants = new OpArray
        while (outWrappers.length > 0) {
          const wrapper = outWrappers.shift()
          // DeBug.log(`wrapper`, wrapper)
          // DeBug.log(`wrapper.inWrapper`, wrapper.inWrapper)
          if (wrapper.canRadiateTo(this)
            && wrapper.inWrapper?.canRadiateTo(wrapper)
            && this.hasDiagonalCorner(wrapper)
            && wrapper.inWrapper.id === radiants.last) {
            // DeBug.error(`It's Good!`)
            radiants.push(wrapper)
          } else {
            // DeBug.error(`It's Bad!`)
            outWrappers = []
          }
        }
        return radiants
      }

      if (this.outWrappers) {
        let wrappers
        if (this.isInnerMostWrapper && this.outWrapperIsRadiant) {
          wrappers = filterRadiants(this.outWrappers)
          // .filter(s => this.canRadiateTo(s))
          // DeBug.log(`wrappers`, wrappers)
        } else {                                  //this is NOT innerMostWrapper
          if (this.inWrapper?.canRadiateTo(this)) {
            // DeBug.error(`hitting this`)
            wrappers = this.innerMostRadiantWrapper.radiantOutWrappers?.intersect(this.outWrappers, `id`)
          } else if (this.outWrapperIsRadiant) {
            // DeBug.warn(`hitting that`)
            wrappers = filterRadiants(this.outWrappers)
            // .filter(s => this.canRadiateTo(s))
          }
        }
        if (!wrappers || !wrappers.isEmpty) { return wrappers }
      }
    }, `radiantOutWrappers`).call(this)
  }
  //MEMO: inWrappers
  get inWrappers() {
    return memoize(() => {
      // DeBug.log(`this.inWrapper`, this.inWrapper)
      if (this.inWrapper) { return OpArray.format(this.inWrapper).union(this.inWrapper.inWrappers, `id`) }
    }, `inWrappers`).call(this)
  }
  //MEMO: radiantInWrappers
  get radiantInWrappers() {
    return memoize(() => {
      if (this.inWrapperIsRadiant) {
        // if (this.outWrapper && this.inWrapper.canRadiateTo(this.outWrapper)) {
        return OpArray.format(this.inWrapper).union(this.inWrapper.radiantInWrappers, `id`)
        // } else {
        //   OpArray.format(this.inWrapper)
        // }

      }
      // if (this.inWrappers && this.inWrapperIsRadiant) {
      //   let wrappers
      //   if (this.isOuterMostWrapper) {
      //     wrappers = this.inWrappers
      //       .filter(s =>
      //         boundsIsWithinTestBounds(s.minArcBoundsSeg, this.maxArcBoundsSeg)
      //         && this.hasDiagonalCorner(s)
      //       )
      //   } else {
      //     wrappers = this.outerMostWrapper.radiantInWrappers?.intersect(this.inWrappers, `id`)
      //   }
      //   if (wrappers && !wrappers.isEmpty) { return wrappers }
      // }
    }, `radiantInWrappers`).call(this)
  }

  get inWrapperIsRadiant() { if (this.inWrapper) { return this.canRadiateTo(this.inWrapper) } }
  get outWrapperIsRadiant() { if (this.outWrapper) { return this.canRadiateTo(this.outWrapper) } }



  get hasWrappers() { return !!this.inWrappers || !!this.outWrappers }
  //MEMO: isInnerMostWrapper
  get isInnerMostWrapper() {
    return memoize(() => {
      return !!this.outWrappers && !this.inWrappers
    }, `isInnerMostWrapper`).call(this)
  }
  //MEMO: isInnerMostRadiantWrapper
  get isInnerMostRadiantWrapper() {
    return memoize(() => {
      return !!this.radiantOutWrappers && !this.radiantInWrappers
    }, `isInnerMostRadiantWrapper`).call(this)
  }

  get innerMostWrapper() { if (this.inWrappers) { return this.inWrappers.filter(s => s.isInnerMostWrapper)[0] } }
  get innerMostRadiantWrapper() {
    if (this.radiantInWrappers) { return this.radiantInWrappers.last }
    else if (this.radiantOutWrappers) { return this }

    // DeBug.log(`innerMostRadiantWrapper`, this)
    // if (!!this.inWrappers) {
    //   // DeBug.log(`this.inWrappers`, this.inWrappers)
    //   if (this.innerMostWrapper.radiantOutWrappers.some(s => s.id === this.id)) {
    //     return this.innerMostWrapper
    //   } else {
    //     return this.inWrappers
    //       .exclude(this.innerMostWrapper.radiantOutWrappers, `id`)
    //       .filter(s => boundsIsWithinTestBounds(s.minArcBoundsSeg, this.maxArcBoundsSeg))[0]
    //   }
    // } else {
    //   return this
    // }
  }

  get isOuterMostWrapper() { return !!this.inWrappers && !this.outWrappers }
  get isOuterMostRadiantWrapper() { return !!this.radiantInWrappers && !this.radiantOutWrappers }
  get outerMostWrapper() { if (this.outWrappers) { return this.outWrappers.filter(s => s.isOuterMostWrapper)[0] } }
  get outerMostRadiantWrapper() {
    if (this.radiantOutWrappers) { return this.radiantOutWrappers.last }
    else if (this.radiantInWrappers) { return this }

    // if (this.outWrappers) {
    //   if (this.outerMostWrapper.radiantInWrappers?.some(s => s.id === this.id)) {
    //     return this.outerMostWrapper
    //   } else {
    //     return this.outWrappers
    //       .exclude(this.outerMostWrapper.radiantInWrappers, `id`)
    //       .filter(s => boundsIsWithinTestBounds(this.minArcBoundsSeg, s.maxArcBoundsSeg))[0]
    //   }
    // }
  }
  //MEMO: viableOutWrapOriginBounds
  get viableOutWrapOriginBounds() {
    return memoize(() => {
      if (this.outWrapper) { return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.outWrapper.viableArcOriginsSeg] }) }
    }, `viableOutWrapOriginBounds`).call(this)
  }

  //MEMO: viableCoinWrapOriginBounds
  get viableCoinWrapOriginBounds() {
    return memoize(() => {
      if (this.coincidentWrapper) {
        return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.coincidentWrapper.viableArcOriginsSeg] })
      }
    }, `viableCoinWrapOriginBounds`).call(this)
  }
  //MEMO: viableCoinWrapOrigins
  get viableCoinWrapOrigins() {
    return memoize(() => {
      if (this.viableCoinWrapOriginBounds) {
        const origins = this.viableArcOrigins
          .filter(v => vertIsWithinBounds(v, this.viableCoinWrapOriginBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
        if (!origins.isEmpty) { return origins }
      }
    }, `viableCoinWrapOrigins`).call(this)
  }

  //MEMO: viableAdjWrapOriginBounds
  get viableAdjWrapOriginBounds() {
    // return memoize(() => {
    if (this.adjacentWrapper) {
      return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.adjacentWrapper.viableArcOriginsSeg] })
    }
    // }, `viableAdjWrapOriginBounds`).call(this)
  }
  //MEMO: viableAdjWrapOrigins
  get viableAdjWrapOrigins() {
    return memoize(() => {
      if (this.viableAdjWrapOriginBounds) {
        const origins = this.viableArcOrigins
          .filter(v => vertIsWithinBounds(v, this.viableAdjWrapOriginBounds, true, 0))
          .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
        if (!origins.isEmpty) { return origins }
      }
    }, `viableAdjWrapOrigins`).call(this)
  }

  //MARK: RADIANT WRAPPING
  //MEMO: viableRadOutWrappersOriginBounds
  get viableRadOutWrappersOriginBounds() {
    // return memoize(() => {
    if (this.isInnerMostRadiantWrapper) {
      DeBug.log(`viableRadOutWrappersOriginBounds radiantOutWrappers`, this.radiantOutWrappers)
      // DeBug.log(`viableRadOutWrappersOriginBounds radiantOutWrappers`, this.radiantOutWrappers.map(s => [s.start.string, s.end.string]))
      DeBug.log(`viableRadOutWrappersOriginBounds radiantOutWrappers`, this.radiantOutWrappers.map(s => s.currentViableArcOriginsSeg))
      let viables = this.radiantOutWrappers
        .map(s => s.currentViableArcOriginsSeg)
      DeBug.log(`viableRadOutWrappersOriginBounds viables`, viables)                                  //LOGGING:
      const result = boundsOverlap({ geo: [viables], accuracy: 0 })
      // DeBug.log(`result`, result)                                                              //LOGGING:
      return result
    }
    // }, `viableRadOutWrappersOriginBounds`).call(this)
  }

  //MEMO: viableRadiantOriginBounds
  get viableRadiantOriginBounds() {
    return memoize(() => {
      if (this.isInnerMostRadiantWrapper && this.outerMostRadiantWrapper) {
        return boundsOverlap({
          geo: [this.viableArcOriginsSeg, this.outerMostRadiantWrapper.viableArcOriginsSeg], accuracy: 0
        })
      }
    }, `viableRadiantOriginBounds`).call(this)
  }

  get viableRadiantOrigins() {
    // DeBug.error(`can has viableRadiantOrigins?`)

    if (this.viableRadiantOriginBounds) {
      // DeBug.warn(`yes! viableRadiantOrigins`)
      // DeBug.error(`viableArcOrigins`, this.viableArcOrigins.map(v => v.string))
      // DeBug.error(`viableRadiantOriginBounds`, this.viableRadiantOriginBounds)
      const viableBounds = this.viableRadOutWrappersOriginBounds
      DeBug.log(`viableRadOutWrappersOriginBounds`, viableBounds)
      const origins = this.viableArcOrigins
        .filter(v => vertIsWithinBounds(v, viableBounds, true, 0))
        .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
      if (!origins.isEmpty) { return origins } else {
        return this.viableArcOrigins
      }

    }

  }

  get currentViableRadiantOrigins() {
    if (this.viableRadiantOriginBounds) {
      // DeBug.warn(`yes! viableRadiantOrigins`)
      // DeBug.error(`viableArcOrigins`, this.viableArcOrigins.map(v => v.string))
      // DeBug.error(`viableRadiantOriginBounds`, this.viableRadiantOriginBounds)
      const viableBounds = this.viableRadOutWrappersOriginBounds
      // DeBug.log(`viableRadOutWrappersOriginBounds`, viableBounds)
      const origins = this.currentViableArcOrigins
        .filter(v => vertIsWithinBounds(v, viableBounds, true, 0))
        .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
      if (!origins.isEmpty) { return origins }

    }
  }
  //MARK: INTERFERENCE WRAPPING
  get interferenceWrappers() {
    if (this.isInnerMostRadiantWrapper && this.radiantOutWrappers.length > 1) {
      const segs = this.outerMostRadiantWrapper.neighborsArray.flat()
        .filter(s =>
          s.arcNormalDirection.equals(this.arcNormalDirection.opposites)
          && (
            s.isInnerMostRadiantWrapper
            || s.coinInWrapper?.isInnerMostRadiantWrapper
            || s.isOuterMostRadiantWrapper
            || s.coinOutWrapper?.isOuterMostRadiantWrapper
          )
          //NOTE: using this fixes #323
          // && (
          //   s.isInnerMostRadiantWrapper
          //   || s.innerMostRadiantWrapper
          //   || s.isOuterMostRadiantWrapper
          //   || s.outerMostRadiantWrapper
          // )
        )
        .map(s => {
          if (s.coinInWrapper?.isInnerMostRadiantWrapper) {
            return s.coinInWrapper
          } else if (s.coinOutWrapper?.isOuterMostRadiantWrapper) {
            return s.coinOutWrapper
          } else {
            return s
          }
          //NOTE: using this fixes #323
          // if (s.innerMostRadiantWrapper) {
          //   return s.innerMostRadiantWrapper
          // } else if (s.outerMostRadiantWrapper) {
          //   return s.outerMostRadiantWrapper
          // } else {
          //   return s
          // }
        })
        // .filter(s => s.radiantOutWrappers.length > 1)
        .compacted
      if (!segs.isEmpty) {
        const start = segs.filter(s => this.maxArcBoundsSeg.vertOrientation(s.end).isLeft)[0]
        const end = segs.filter(s => this.maxArcBoundsSeg.vertOrientation(s.end).isRight)[0]
        return { start: start, end: end }
      }
    }
  }
  get hasInterference() { return !!this.interferenceWrappers }
  get hasDoubleInterference() { return !!this.interferenceWrappers.start && !!this.interferenceWrappers.end }
  //MEMO: viableInterferenceOrigins
  get viableInterferenceOrigins() {
    // return memoize(() => {
    // DeBug.log(`viableInterferenceOrigins()`)
    if (!this.hasInterference) { return }
    //ARROW: 
    const viables = (corner, isStart = true) => {
      if (!corner) { return }
      // DeBug.log(`cornerOrigins`, corner.viableArcOriginsSeg.string)
      // DeBug.log(`corner viables`, corner.viableArcOrigins)
      let bounds = { ...corner.viableArcOriginsSeg.bounds }                 // copy minMax bounds
      // let bounds = { ...corner.viableRadiantOriginBounds }      //TODO: this fixes #472
      // DeBug.log(`bounds`, bounds)
      const side = isStart === this.isOutsideCorner ? this : this.endNeighbor    // seg to reference direction
      if (side.isVertical) {
        bounds.xMin = 0
        bounds.xMax = 100
      } else {
        bounds.yMin = 0
        bounds.yMax = 200
      }
      // DeBug.log(`isStart`, isStart)
      // DeBug.log(`side`, side)
      // DeBug.log(`bounds`, bounds)
      const viables = this.currentViableRadiantOrigins || this.viableArcOrigins
      // const origins = this.viableArcOrigins.filter(v => vertIsWithinBounds(v, bounds, true, 0))
      const origins = viables.filter(v => vertIsWithinBounds(v, bounds, true, 0))
      // DeBug.log(`origins`, origins)
      if (!origins.isEmpty) return origins
    }

    const starts = viables(this.interferenceWrappers.start)
    const ends = viables(this.interferenceWrappers.end, false)

    // DeBug.log(`starts`, starts)
    // DeBug.log(`ends`, ends)
    if (starts && ends) {
      return starts.intersect(ends, [`x`, `y`])
    }
    if (starts) { return starts }
    if (ends) { return ends }
    // }, `viableInterferenceOrigins`).call(this)
  }
  //MARK: OLD LOOSE PROPS
  // get hasLooseCorner() {
  //   if (this.canCurveMoreAtEnd) {
  //     return this.hasWrappers ? this.hasLooseWrapper : true
  //   }
  //   return false
  // }

  // get hasLooseAdjWrapper() {
  //   if (this.intendedArcRadius && this.arcRadius) {
  //     return !equalsRoundedDec(this.intendedArcRadius, this.arcRadius, 0)
  //     // return roundToDec(this.intendedArcRadius, 0) !== roundToDec(this.arcRadius, 0)
  //   }
  //   return false
  // }
  // get hasLooseColWrapper() {
  //   if (this.closestWrappper) {
  //     return !this.arcStartCorner.equals(this.closestWrappper.arcEndCorner, 0)
  //       && !this.arcEndCorner.equals(this.closestWrappper.arcStartCorner, 0)
  //   }
  //   if (this.coincidentWrapper) {
  //     return !equalsRoundedDec(this.coincidentWrapper.arcRadius, this.arcRadius, 0)
  //     // return roundToDec(this.coincidentWrapper.arcRadius, 0) !== roundToDec(this.arcRadius, 0)
  //   }
  //   // return false
  //   return this.isOutsideCorner ? false : this.canCurveMoreAtEnd
  // }
  // get hasLooseWrapper() { return this.hasLooseColWrapper || this.hasLooseAdjWrapper }

  // get hasIntersectingWrapper() {
  //   if (this.isOutsideCorner && this.hasLooseAdjWrapper) {
  //     return roundToDec(this.intendedArcRadius, 0) < roundToDec(this.arcRadius, 0)
  //   } else {
  //     // if (this.outWrapper) { return this.outWrapper.hasIntersectingWrapper }
  //   }
  //   return false
  // }

  //MARK: WRAP STATES
  get hasCompleteFlushWrap() { return this.hasArc && this.flushWrapper?.hasArc }
  get hasCompleteAdjWrap() { return this.hasArc && this.adjacentWrapper?.hasArc }

  //MEMO: horVertSides
  get horVertSides() {
    return memoize(() => {
      const end = this.endNeighbor
      if (this.isHorizontal !== end.isHorizontal) {
        return this.isHorizontal ? [this, end] : [end, this]
      }
    }, `horVertSides`).call(this)
  }

  //MEMO: inOutFlushWrappers
  get inOutFlushWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(true)
    }, `inOutFlushWrappers`).call(this)
  }
  //MEMO: inOutAdjWrappers
  get inOutAdjWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(false)
    }, `inOutAdjWrappers`).call(this)
  }

  //METH: #inOutWrappers()
  #inOutWrappers(flush) {
    // if (flush ? this.hasCompleteFlushWrap : this.hasCompleteAdjWrap) {
    const wrapper = flush ? this.flushWrapper : this.adjacentWrapper
    return this.isOutsideCorner === flush ? [this, wrapper] : [wrapper, this]
    // }
  }

  get isCoinInWrapper() { return !!this.coinOutWrapper }
  get isFlushInWrapper() { return !!this.flushOutWrapper }
  get isAdjInWrapper() { return !!this.adjOutWrapper } flush
  get isCoinOutWrapper() { return !!this.coinInWrapper }
  get isFlushOutWrapper() { return !!this.flushInWrapper }
  get isAdjOutWrapper() { return !!this.adjInWrapper }

  //METH: wrapState()
  wrapState(flush) {
    const inOuts = flush ? this.inOutFlushWrappers : this.inOutAdjWrappers
    const hasCompleteWrap = flush ? this.hasCompleteFlushWrap : this.hasCompleteAdjWrap
    if (hasCompleteWrap) {
      const [inner, outer] = inOuts
      if (inner.hasDiagonalCorner(outer)) {                           // wrappers are radiant
        const outCorner = outer.end                                       // cornerpoint of outer wrap
        const [inDist, outDist] = inOuts.map(w => roundToDec(w.arcOrigin.dist(outCorner), 2))

        if (inDist === outDist) { return 0 }                                  // EQUIDISTANT: dists to corner are equal
        if (inDist > outDist) { return 1 }                                    // DIVERGING: inDist > outDist
        if (inDist < outDist) { return 2 }                                    // CONVERGING: inDist < outDist

      } else {                                                                // wrappers are proximal
        const obj = flush ? inner.flushIntersectObjs[0] : inner.adjIntersectObjs[0]
        if (roundToDec(obj?.dist) >= roundToDec(outer.arcRadius)) {
          return 0
        } else {
          return 2
        }

        // const distObj = outer.minAdjWrapperDistanceObj(inner)
        // // const [startObj, endObj] = [true, false].map(isStart => outer.intersectObj(inner, isStart))

        // const startIsLess = startObj.dist < endObj.dist
        // const [startOverlap,endOverlap] = [
        //   inner.arcOriginToStart.isCollinearWith(outer.arcOriginToEnd),
        //   inner.arcOriginToEnd.isCollinearWith(outer.arcOriginToStart)
        // ]

        // if(startIsLess===)

        // if (inner.arcOriginToStart.vertIsOnLine(outer.arcEndCorner)
        //   || inner.arcOriginToEnd.vertIsOnLine(outer.arcStartCorner)
        // ) {
        //   // return 0
        // }





        // const
        // if(startObj.dist <)

      }

    }




    // if (flush) {
    //   if (this.hasCompleteFlushWrap) {
    //     const inOuts = this.inOutFlushWrappers
    //     const outCorner = inOuts[1].end
    //     const [inRadius, outRadius] = this.inOutFlushWrappers.map(w => roundToDec(w.arcRadius, 2))  // arcRadius of in and out wrappers
    //     if (inRadius === outRadius) { return 0 }                              // EQUIDISTANT: radii are equal
    //     if (inRadius < outRadius) { return 1 }                                // DIVERGING: inRadius < outRadius
    //     if (inRadius > outRadius) { return 2 }                                // CONVERGING: inRadius > outRadius
    //   }
    // } else {
    //   if (this.hasCompleteAdjWrap) {
    //     const inOuts = this.inOutAdjWrappers
    //     const outCorner = inOuts[1].end
    //     const [inDist, outDist] = inOuts.map(w => roundToDec(w.arcOrigin.dist(outCorner), 2))

    //     if (inDist === outDist) { return 0 }                                  // EQUIDISTANT: dists to corner are equal
    //     if (inDist > outDist) { return 1 }                                    // DIVERGING: inDist > outDist
    //     if (inDist < outDist) { return 2 }                                    // CONVERGING: inDist < outDist
    //   }
    // }
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


  canRadiateTo(seg) {
    return this.viableArcOriginsSeg.isOverlappingWith({ seg: seg.viableArcOriginsSeg })
      && this.hasDiagonalCorner(seg)
  }
  //METH: isRadiantWrapped() : two corners currently have an equidistant radiant wrap
  isRadiantWrapped(seg, decimal = 2) {
    return this.arcOrigin.equals(seg.arcOrigin, decimal) && this.hasDiagonalCorner(seg)
  }
  //METH: isProximalWrapped() : two corners currently have an aligned proximal wrap
  isProximalWrapped(seg) {
    if (!this.hasSameFacingCorner(seg)) { return false }
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

  #isWrapped(out, decimal = 2) {
    const wrapper = out ? this.outWrapper : this.inWrapper
    return wrapper?.isRadiantWrapped(this, decimal) || wrapper?.isProximalWrapped(this)
  }
  //MEMO: hasNoWrappers
  get hasNoWrappers() {
    return memoize(() => {
      return !this.inWrapper && !this.outWrapper
    }, `hasNoWrappers`).call(this)
  }


  // #endregion
  //MARK: Copy Methods
  // #region Copy Methods
  //METH: copy
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
    // return memoize(() => {
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
    // }, `copy`).call(this)
  }
  //METH: this.normals
  insetCopy(insetScale) {
    // if (insetScale <= 0) { return }
    // if (insetScale > 2) { insetScale = 2 }
    // DeBug.log(`insetCopy`, this)
    // DeBug.log(`normals`, this.normals)

    const scaleToOffset = Vertex.sub(insetScale, vert(1))  // create scaleToOffset 
    const offset = Vertex.mult(scaleToOffset, this.cellRadius)
    const startMove = Vertex.mult(this.normals.start.moveCoord, offset) // startMove vector
    const insetStart = Vertex.add(this.start, startMove) // new inset segment start
    const endMove = Vertex.mult(this.normals.end.moveCoord, offset) // endMove vector
    const insetEnd = Vertex.add(this.end, endMove) // new inset segment end
    if (insetEnd.x < 0 || insetEnd.y < 0) { DeBug.warn(`created insetEnd with negative values`) }

    const cubicMove = Vertex.mult(this.normals.cubic.moveCoord, offset) // cubicMove vector

    let insetCubicVerts = { start: undefined, end: undefined }
    if (this.cubicVerts.start) {

      const insetCubicStart = Vertex.add(this.finalCubicStartVert, cubicMove)
      insetCubicVerts.start = insetCubicStart
      // const insetCubicEnd = Vertex.add(this.finalCubicEndVert, cubicMove)
      // insetCubicVerts = { start: insetCubicStart, end: insetCubicEnd } // assign new inset cubicVerts
    }
    if (this.cubicVerts.end) {
      const insetCubicEnd = Vertex.add(this.finalCubicEndVert, cubicMove)
      insetCubicVerts.end = insetCubicEnd
    }

    // let insetMaxVerts = { start: undefined, end: undefined }
    // if (this.maxCubicVerts.start && this.maxCubicVerts.end) {
    //   const insetMaxStart = Vertex.add(this.finalMaxStartVert, cubicMove)
    //   const insetMaxEnd = Vertex.add(this.finalMaxEndVert, cubicMove)
    //   insetMaxVerts = { start: insetMaxStart, end: insetMaxEnd } // assign new inset cubicVerts
    // }

    let insetPoints
    if (this.points) {
      const insetSeg = segment(insetStart, insetEnd)
      insetPoints = this.points
        .map(p => Vertex.add(p, cubicMove))
        .filter(p => insetSeg.vertIsOnLine(p, 3))
    }

    return protoSegment({ // new inset segment 
      start: insetStart,
      end: insetEnd,
      parentID: this.id,
      id: `${this.id}-inset(${roundToDec(insetScale.x, 2)})`,
      islandIDs: this.islandIDs,
      cubicVerts: insetCubicVerts,
      // maxCubicVerts: insetMaxVerts,
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
  //MEMO: overlapSegs
  get overlapSegs() {
    // DeBug.log(`this.shape.andNeighborSimples`, this.shape.andNeighborSimples)
    // DeBug.log(`overlapSegs seg`, this)
    // DeBug.log(`this.shape`, this.shape)
    return memoize(() => {
      return this.shape.andNeighborSimples
        .exclude(this, `id`)
        .filter(s =>
          this.isOverlappingWith({ seg: s })
          // && !this.start.equals(s.end, 0)
          // && !this.end.equals(s.start, 0)
          //NOTE: below fixes (allInterferenceWrapped bug): #511, 506, 503, 502,  
          // this.isOverlappingWith({ seg: s, includeEnds: false })

        )
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
  //MEMO: isSmallBean
  get isSmallBean() {
    return memoize(() => {
      const min = 5 * this.cellRadius
      const path = this.segPath
      if (path.length === 6) { return path.every(s => s.length < min) }
      return false
    }, `isSmallBean`).call(this)
  }
  get segPath() {
    if (!this.hasBothNeighbors) {
      DeBug.error(`Error: segment is missing neighbors, segPath cannot be calculated!`)
      return
    }
    let path = new OpArray
    let open = true
    let seg
    while (open) {
      if (!seg) { seg = this }
      path.push(seg)
      seg = seg.endNeighbor
      if (seg.id === this.id) { open = false }
    }
    return path
  }
  //TODO: find and test implementations!
  // get sortedSegPath() {
  //   const path = this.segPath
  //   const firstSeg = path.gridVertSorted[0]
  //   const shiftIndex = path.findIndex(s => s.id === firstSeg.id)
  //   return path.shifted(shiftIndex)
  // }
  //TODO: find and test implementations!
  // get counterSortedSegPath() {
  //   const path = this.segPath
  //   const firstSeg = path.counterGridVertSorted[0]
  //   const reversedPath = path.reversed
  //   const shiftIndex = reversedPath.findIndex(s => s.id === firstSeg.id)
  //   return reversedPath.shifted(shiftIndex)
  // }

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
