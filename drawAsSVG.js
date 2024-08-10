
// MARK: Constants
const bezCircleConst = 0.55228
const bezCircle45DegConst = 0.265

//MARK: SVGPath CLASS
// SIZE: 178 lines
class SVGPath {
  //METH: fromProtoSegPath() : convert PrSeg path with cubic verts (finalSubShapes) to a valid SVG path string
  static fromProtoSegPath({ segPath, cornerMin = 0, cornerScale = 1 } = {}) {
    // console.warn(`segPath`, segPath)                                           //LOGGING:
    segPath = segPath.copy
    let curves = []
    let start, end, cornerStart, cornerEnd
    let startRadius, startSegment, endRadius, endSegment
    let controlStart, lineStart, lineEnd, controlEnd

    segPath.forEach((seg, i) => {
      let report = false                                                                                  //LOGGING:
      // if (seg.id.includes(`cell011`)) { report = true }                                                //LOGGING:
      if (report) {                                                                                       //LOGGING:
        console.log(`svg creation, seg:`, seg)                                                            //LOGGING:
      }                                                                                                   //LOGGING:
      // cornerMin = min(cornerMin, seg.length / 2)

      startRadius = seg.hasCubicStartVert ? seg.availableStartLength : cornerMin // radius of corner arc
      lineStart = seg.distancedStartPoint(startRadius * cornerScale) // start point of line connecting corner arcs 
      startSegment = segment(lineStart, seg.start) // control point calculation segment, connects hard corner to mid line
      controlStart = startSegment.pointOnsegment(bezCircleConst)

      endRadius = seg.hasCubicEndVert ? seg.availableEndLength : cornerMin // radius of corner arc
      lineEnd = seg.distancedEndPoint(endRadius * cornerScale) // end point of line connecting corner arcs
      endSegment = segment(lineEnd, seg.end) // control point calculation segment, connects hard corner to middle line
      controlEnd = endSegment.pointOnsegment(bezCircleConst)
      if (report) {                                                                                       //LOGGING:
        console.log(seg.hasCubicEndVert, seg.cubicVerts.end, seg.end, seg.availableEndLength, endRadius)  //LOGGING:
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
          console.error(`ERROR: start and end are not connected!`)
          console.log(`cornerStart`, cornerStart)
          console.log(`cornerEnd`, cornerEnd)
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
    const curvesSVG = curves.map(c => `${c[0]} ${c[1]} L ${c[2]} C ${c[3]} `)
    const endSVG = `${end[0]} ${end[0]} Z` //use 1st coord twice because Z creates line closing path loop
    const svgPath = `${startSVG} ${curvesSVG} ${endSVG}`
    console.log(`end`, end)                                                                           //LOGGING:
    console.log(`endSVG`, endSVG)                                                                     //LOGGING:
    console.log(`svgPath`, svgPath)                                                                   //LOGGING:
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
  //       // console.error(`YAAAASSSSSS`)
  //       // console.log(`segment`, seg)
  //       if (seg.hasSomeCubicVerts) {
  //         // console.error(`YEEEEEEESSSSSS`)
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
  constructor(path) {
    this.path = path
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
  //MEMO: isOutsideShape()
  get isOutsideShape() {
    return memoize(() => {
      return this.path.some(s => s.isUTurnOut)
    }, `isOutsideShape`).call(this)
  }
  //MEMO: perimeter()
  get perimeter() {
    return memoize(() => {
      return this.path.map(s => s.length).reduce((a, b) => a + b)
    }, `perimeter`).call(this)
  }
  //MEMO: shape()
  get shape() {
    return memoize(() => {
      return this.path[0].shape
    }, `shape`).call(this)
  }


  get hasLoosies() { return this.path.some(s => s.canCurveMoreAtEnd) }

  //MARK: Quad Methods
  makeCurves(equal = true, max = true, outWrap = true) {
    // let radius
    // if (equal && max) { radius = min(...this.path.map(s => s.length / 2)) }
    console.log(this.path)
    // const sorted = this.path.sort((a, b) => b.arcRadius - a.arcRadius)
    const sorted = this.path
    sorted.forEach(s => {
      console.log(s.id)
      if (equal && max) {
        s.replaceEndCurveOrigin(s.middleArcOrigin)
        // if (outWrap) {
        //   if (s.outWrapper?.canCurveToMiddleOrigin)) {
        //     console.log(`CAN curve!`)
        //     s.replaceEndRadiantOutWrapsOrigin()
        //   } else {
        //     console.log(`can't curve!`)
        //   }
        // } else {
        //   s.tightWrap(true)
        // }

      }
    })
    sorted.forEach(s => {
      // console.log(s.id)
      if (outWrap) {
        if (s.outWrapper?.canCurveToMiddleOrigin) {
          // console.log(`CAN curve!`)
          // s.tightWrap(true)
          // console.log(s)
          s.replaceEndRadiantOutWrapsOrigin()
        } else {
          // console.log(`can't curve!`)
        }
      } else {
        s.tightWrap(true)
      }
    })

  }


  //MARK: REFINE Methods
  //METH: refine() : remove collinear segments to simplify seg path to single segments connecting corners
  refined(parentID, minCorners = false, grid) {
    let report = true // DEBUG

    let segPath = this.path

    let newPath = new OpArray
    let length = 1
    let prevSeg, prevMid, firstID, cells, points, sideDir
    for (let i = 0; i < segPath.length; i++) {
      let seg = segPath.at(i).copy
      sideDir = seg.sideDir
      // cells = seg.cells
      // console.log(`cells here`, cells)                                                            //LOGGING:
      if (report) {
        console.log(``)
        console.log(`seg`, seg)
        console.log(`prevSeg`, prevSeg?.id)
        // if (seg.id.includes(`cell097`)) {                                                         //LOGGING:
        //   console.error(`seg.hasCubicStartVert`, seg.hasCubicStartVert)                           //LOGGING:
        //   console.error(`seg.hasCubicEndVert`, seg.hasCubicEndVert)                               //LOGGING:
        // }                                                                                         //LOGGING:
        // if (prevSeg?.id.includes(`cell097`)) {                                                    //LOGGING:
        //   console.error(`prevSeg.hasCubicStartVert`, prevSeg.hasCubicStartVert)                                                                           //LOGGING:
        //   console.error(`prevSeg.hasCubicEndVert`, prevSeg.hasCubicEndVert)                       //LOGGING:
        // }                                                                                         //LOGGING:
      }
      //FIXME: RECONFIGURE LOOP TO RUN INIT DIRECTION EQUALITY CHECK ON FINAL SEG. 
      //FIXME: Current bug prevents last->first connection of collinear segments
      //FIXME: This might also be fixed by repairing the bug that starts interior shapes with left-most segment
      //FIXME: FIX BOTH!!! As both will create separate edgecases
      if (!!prevSeg && seg.direction.equals(prevSeg.direction)) { // if two segments are in line/flat
        if (report) {                                                                                //LOGGING:
          console.log(`seg in loop`, seg.id)                                                         //LOGGING:
          console.log(`prevSeg in loop`, prevSeg.id)                                                 //LOGGING:
          console.log(`cells`, cells)                                                                //LOGGING:
        }                                                                                            //LOGGING:

        if (length === 1) {
          cells = prevSeg.cells
          points = prevSeg.points
          sideDir = seg.sideDir
          firstID = prevSeg.id
          if (minCorners) { prevSeg.assignMid() }
        }
        length += 1
        if (minCorners) { prevMid = seg.mid }
        const prevIDs = OpArray.from(prevSeg.islandIDs)
        const segIDs = OpArray.from(seg.islandIDs)
        const idArray = prevIDs.union(segIDs)
        const islandIDs = new Set(idArray)
        const id = `${parentID}-${length}${seg.direction.name}-${firstID}-to-${seg.id}`
        console.log(`cells`, cells)                                                                  //LOGGING:
        cells = cells.union(seg.cells, `id`)
        points = points.union(seg.points, [`x`, `y`])
        //FIXME: move protoSegment to end (else) section and only create one final segment. currently creating 1 every loop!
        let newSeg = protoSegment({
          start: prevSeg.start,
          end: seg.end,
          parentID: parentID,
          id: id,
          islandIDs: islandIDs,
          cells: cells,
          points: points,
          sideDir: sideDir,
          grid: grid
        })
        // add cubicVerts from prevSeg and seg to newSeg
        if (prevSeg.hasSomeCubicVerts) {
          newSeg.addCubicStartVert(prevSeg.cubicVerts.start)
          newSeg.addCubicEndVert(prevSeg.cubicVerts.end)
        }
        if (seg.hasSomeCubicVerts) {
          newSeg.addCubicStartVert(seg.cubicVerts.start)
          newSeg.addCubicEndVert(seg.cubicVerts.end)
        }
        // console.log(`0000000 newSeg ${newSeg.id}`, newSeg.cubicVerts.length)
        newPath.pop()
        seg = newSeg
      } else {

        seg.parentID = parentID
        length = 1
        sideDir = undefined
        cells = undefined
        points = undefined
        firstID = undefined
        if (minCorners) {
          prevSeg.addCubicEndVert(prevMid)
        }
      }

      newPath.push(seg)
      prevSeg = seg
    }
    //assign neighbors
    newPath.forEach((seg, i) => {
      const loop = range(0, newPath.lastIndex)
      const prev = newPath[loop.cycle(i - 1)]
      const next = newPath[loop.cycle(i + 1)]
      seg.assignNeighbors({ start: prev, end: next })
    })
    console.log(`newPath`, newPath)                                                                     //LOGGING:
    return new SegPath(newPath)
  }

  // METH: fromVertPath() : convert array of verts to a shape path made of Segments                         //UNUSED:
  // static fromVertPath({ vertPath, refine = true, parentID } = {}) {
  //   // console.log('vertPath', vertPath)                                                            //LOGGING:
  //   let vertCount = vertPath.length
  //   if (vertCount < 3) { return }
  //   vertPath = SegPath.loopPath(vertPath)
  //   // console.log('loopedpath', vertPath)                                                          //LOGGING:
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
    // console.log("Starting exportPNG() function...")

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
      // console.log("Image loaded...")                                                           //LOGGING:
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(function (blob) {
        // console.log("Blob created...")                                                         //LOGGING:
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // console.log("Link clicked...")                                                         //LOGGING:

        URL.revokeObjectURL(url) // Revoke the Blob URL for the PNG
        URL.revokeObjectURL(svgUrl) // Revoke the Blob URL for the SVG
        console.log(`PNG saved`)                                                                  //LOGGING:
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

  get aspect() { return Aspect.fromRatio((this.x / this.y)) }
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
  directionTo(vert) {
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

  equals(vert, accuracy = 3) {
    let ax, ay, bx, by
    if (arguments.length === 2) {
      ax = roundToDec(this.x, accuracy)
      ay = roundToDec(this.y, accuracy)
      bx = roundToDec(vert.x, accuracy)
      by = roundToDec(vert.y, accuracy)
    } else {
      ax = this.x
      ay = this.y
      bx = vert.x
      by = vert.y
    }
    return ax === bx && ay === by
  }

  //TODO: If we run into Vertex arithemtic errors, test this
  // add(vert) { return Vertex.add(this, vert) }
  // sub(vert) { return Vertex.sub(this, vert) }
  // mult(vert) { return Vertex.mult(this, vert) }
  // div(vert) { return Vertex.div(this, vert) }
  static min(verts) { return verts.gridVertSorted[0] }
  static max(verts) { return verts.gridVertSorted.last }

  static rotate(v, deg) { return v.copy().rotate(deg) }
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
        console.error(`Vertex.mult issue:`, a, b)
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
  vertIsInBounds(vert, accuracy = 4) { return vertIsInsideBounds(vert, this.bounds, true, accuracy) }
  //METH: vertIsOnLine()
  //NOTE: made with ChatGPT4.0 on Jan14, 2024
  vertIsOnLine(vert, includeEnds = true, decimal = 0) {
    let report = false
    // if (equalsRoundedDec(vert.x, 54.444)) { report = true }                                        //LOGGING:
    if (report) { console.log(`vertIsOnLine this`, this) }
    if (!includeEnds && (vert.equals(this.start, decimal) || vert.equals(this.end, decimal))) {
      if (report) { console.log(`vertIsOnLine fail: vert is on terminus`, vert) }
      return false                                                // point is on a terminus
    }

    if (!this.vertIsInBounds(vert, 0)) {                           // point is outside seg's bounding box
      if (report) { console.log(`vertIsOnLine fail: vert is outside bounds`, vert) }
      return false
    }
    // Calculate the t parameter using linear interpolation
    // const t = this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()
    const t = roundToDec((this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()), 4)
    // console.log(`t`, t)
    // Check if t is within the range [0, 1]
    if (t < 0 || t > 1) {
      if (report) {
        console.error(`vertIsOnLine fail: t param test`, vert, t)
        console.error(this.lineVector)
      }
      return false // The point does not lie within the segment
    }

    // Calculate the projected point on the line
    const projectedPoint = Vertex.add(this.start, Vertex.mult(this.lineVector, t))
    // Check if the vert is close enough to the projected point (considering a small threshold for precision issues)
    const threshold = 0.1 // Adjust this threshold based on your precision needs
    // console.log(`vertIsInBounds projectedPoint`, projectedPoint)
    const diff = vert.dist(projectedPoint)
    // console.log(`vertIsInBounds diff`, diff)
    const result = diff < threshold
    if (report && !result) {
      console.error(`vertIsOnLine fail: threshold`, vert)
      console.error(projectedPoint, diff)
    }
    return result
  }
  //METH: vertOrientation()
  vertOrientation(vert) {
    // console.warn(vert, this.start)
    const vertVector = Vertex.sub(vert, this.start)       // vert to this.start
    // console.warn(this.vector, vertVector)
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
    // console.log(`this.lineVector`, this.lineVector)                                                //LOGGING:
    // console.log(`seg`, seg)                                                                        //LOGGING:
    // console.log(`seg.lineVector`, seg.lineVector)                                                  //LOGGING:
    const precise = Vertex.cross(this.lineVector, seg.lineVector).z
    // console.log(`isParallelTo precise`, precise)                                                   //LOGGING:
    return abs(roundToDec(precise, accuracy)) === 0    // MUCH FASTER!!!
  }
  //METH: isCollinearWith()
  isCollinearWith(seg) { return this.isOverlappingWith({ seg: seg, infinite: true }) }
  //METH: isOverlappingWith()
  isOverlappingWith({ seg, includeEnds = true, decimal = 0, mode = 2, infinite = false, accuracy = 0 } = {}) {
    if (!this.isParallelTo(seg)) {
      // console.warn(`isOverlappingWith is not parallel`)                                            //LOGGING:
      return false
    }                         // false if not parallel

    if (infinite) {
      // Check for collinearity by verifying if the vector between one point of this segment
      // and the start of the other segment is orthogonal to the direction vector of this segment
      const connectiveVector = Vertex.sub(seg.start, this.start)
      const cross = abs(roundToDec(Vertex.cross(connectiveVector, this.lineVector).z, 1))
      // console.warn(`isOverlappingWith ${seg.id}, crossProduct: ${cross}`)                          //LOGGING:
      if (accuracy > 0) { return cross < accuracy && cross > -accuracy }
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
    // console.log(`perpX this`, this)                                                                      //LOGGING:
    const perpEnd = Vertex.add(this.direction.toLeft.lineVector, vert)
    const perpSeg = segment(vert, perpEnd)
    // console.log(`perpX: perpSeg`, perpSeg)                                                               //LOGGING:
    const projected = this.intersectionWith(perpSeg, true)
    // console.log(`perpX: projected`, projected)                                                           //LOGGING:
    const vertOnLine = this.vertIsOnLine(projected)
    // console.log(`perpX: vertOnLine`, vertOnLine)                                                         //LOGGING:
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
      // console.warn(`yes isParallel`)                                                             //LOGGING:
      if (this.isOverlappingWith({ seg: seg, infinite: infinite })) {                 // check for overlapping
        // console.warn(`yes isOverlapping`)                                                        //LOGGING:
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
function protoSegment({ start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, maxCubicVerts, insetScale } = {}) {
  return new ProtoSegment(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid, maxCubicVerts, insetScale)
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

  cubicVerts = { start: undefined, end: undefined }
  maxCubicVerts = { start: undefined, end: undefined }
  neighbors = { start: undefined, end: undefined }

  constructor(start, end, parentID, id, islandIDs, cells, points, sideDir, cubicVerts, neighbors, grid = GRID, maxCubicVerts, insetScale = 1) {
    super(start, end)
    this.parentID = parentID
    this.islandIDs = islandIDs
    this.id = id
    this.cells = cells
    this.points = points
    this.sideDir = sideDir
    this.grid = grid
    this.insetScale = insetScale
    if (maxCubicVerts) {
      this.maxCubicVerts = maxCubicVerts
    }
    // else if (grid) { this.#setupMaxCubicVerts() }
    if (cubicVerts) { this.cubicVerts = cubicVerts }
    if (neighbors) { this.neighbors = neighbors }
    if (!this.direction.allAreCardinal) {
      console.error(`this segment is not Cardinal!`)
      console.log(this)
    }
  }
  //MARK: computed 
  get cellRadius() { return this.grid.cellRadius }
  get shape() { return this.grid.shapeNamed(this.parentID) }
  get isEdgeOfQuad() { return this.segPath.length === 4 }
  //MEMO: turns
  get turns() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        console.error(`segment ${this.id} without neighbors has no turns`)
        return
      }
      const start = this.startNeighbor.direction.turnTo(this.direction)
      const end = this.direction.turnTo(this.endNeighbor.direction)

      if (!start) { console.error(`segment ${this.id} failed to calculate start turn`) }
      if (!end) { console.error(`segment ${this.id} failed to calculate end turn`) }

      return {
        start: start,
        end: end
      }
    }, `turns`).call(this)
  }
  //MEMO: normals
  get normals() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        console.error(`segment ${this.id} without neighbors has no normals`)
        return
      }
      // if (this.angle === undefined) {
      //   console.error(`segment ${this.id} has no angle!`, this)
      //   console.log(`this.angle = ${this.angle}`)
      // }

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
  //MEMO: cornerVerts
  get cornerVerts() {
    return memoize(() => {
      if (!this.hasBothNeighbors) {
        console.error(`segment ${this.id} without neighbors has no cornerVerts`)
        return
      }
      if (!this.turns.start || !this.turns.end) {
        console.error(`segment ${this.id} without turns has no cornerVerts`)
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
      console.warn(`cannot calculate available length without cornerVerts`)
      return
    }
    if (this.hasNoCubicVerts) { return this.length / 2 }            // assume half of entire length available
    // if (this.hasNoCubicVerts) { return this.length }             // assume entire length available
    else {
      let startLength, endLength
      if (this.hasCubicStartVert) {
        startLength = max ? this.maxCubicStartLength : this.start.dist(this.cubicVerts.start)
        // console.log(`availableLength: startLength: ${startLength}, maxStartLength: ${this.maxCubicStartLength} `)
        // if (roundToDec(this.maxCubicStartLength) < roundToDec(startLength)) {
        //   startLength = this.maxCubicStartLength
        // }
      }
      if (this.hasCubicEndVert) {
        endLength = max ? this.maxCubicEndLength : this.end.dist(this.cubicVerts.end)
        // console.log(`availableLength: endLength: ${endLength}, maxEndLength: ${this.maxCubicEndLength} `)
        // if (roundToDec(this.maxCubicEndLength) < roundToDec(endLength)) {
        //   endLength = this.maxCubicEndLength
        // }
      }
      // console.warn(`this seg`, this)                                                               //LOGGING:
      // console.log(`startLength`, startLength)                                                      //LOGGING:
      // console.log(`endLength`, endLength)                                                          //LOGGING:
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
    // console.log(newOrigin)
    const canCurve = viables.some(v => v.equals(newOrigin, 1))
    if (!canCurve) {
      console.log(`newOrigin`, newOrigin)
      console.log(`viables`, viables)
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
  setMinEndCorner() { this.addDistancedEndCornerVerts(this.cellRadius) }
  // setMinStartCorner() { this.addDistancedStartCornerVerts(this.cellRadius) }                          //UNUSED:
  // setMinCorners() { this.addBothDistancedCornerVerts(this.cellRadius) }                               //UNUSED:

  setEndCurveOrigin(vert) { return this.#setCurveOrigin(vert) }
  replaceEndCurveOrigin(vert) { return this.#setCurveOrigin(vert, true) }

  setEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert) }
  replaceEndRadiantOutWrapsOrigin(vert) { this.#setRadiantOrigin(vert, true) }

  #setRadiantOrigin(vert, replace = false, start = false, out = true) {
    if (vert) { this.#setCurveOrigin(vert, replace, start) }
    const wrappers = out ? this.radiantOutWrappers : this.radiantInWrappers
    wrappers?.forEach(w => w.#setCurveOrigin(this.arcOrigin, replace, start))
  }

  #setCurveOrigin(toVert, replace = false, start = false) {
    const seg = start ? this.startNeighbor : this             // seg/corner to reference
    let report = false                                                                                  //LOGGING:
    // if (this.id.includes('cell013')                                                                     //LOGGING:
    //   // || s.id.includes('cell008')                                                                       //LOGGING:
    //   // || s.id.includes('cell001')                                                                       //LOGGING:
    // ) { report = true }                                                                                 //LOGGING:
    if (report) {                                                                                       //LOGGING:
      console.error(`setCurveOrigin this`, this.id)                                                     //LOGGING:
      console.log(`setCurveOrigin seg`, seg)                                                          //LOGGING:
      console.log(`currentRadius`, seg.arcRadius)                                                       //LOGGING:
      console.log(`seg.viableArcOrigins`, seg.viableArcOrigins)                                         //LOGGING:
      console.log(`toVert`, toVert)                                                                     //LOGGING:
    }
    if (seg.viableArcOrigins.some(v => toVert.equals(v, 1))) {
      const intersect = seg.perpendicularIntersectionWith(toVert)
      if (report) {                                                                                     //LOGGING:
        console.log(`intersect`, intersect)                                                             //LOGGING:
        // console.log(`newRadius`, newRadius)                                                             //LOGGING:
      }
      const newRadius = toVert.dist(intersect)
      if (report) {                                                                                     //LOGGING:
        // console.log(`intersect`, intersect)                                                             //LOGGING:
        console.log(`newRadius`, newRadius)                                                             //LOGGING:
      }
      seg.addDistancedEndCornerVerts(newRadius, replace)
    }
  }
  //METH: #addCubicVert()
  #addCubicVert(vert, replace = false, start = false) {
    let report = false
    const mode = start ? 'Start' : `End`
    // if (
    //   this.id.includes('cell002')                                                                       //LOGGING:
    //   // || this.id.includes('cell008')                                                                    //LOGGING:
    //   // || this.id.includes('cell001')                                                                    //LOGGING:
    // ) { report = true }                                                                                 //LOGGING:
    if (report) {                                                                                       //LOGGING:
      console.warn(`addCubic${mode}Vert: ${vert?.string}`, this)                                        //LOGGING:
      console.log(`hasCubicStartVert: ${this.hasCubicStartVert}`)                                       //LOGGING:
      if (this.availableStartLength) { console.log(`availableStartLength: ${this.availableStartLength}`) }  //LOGGING:
      console.log(`hasCubicEndVert: ${this.hasCubicEndVert}`)                                           //LOGGING:
      if (this.availableEndLength) { console.log(`availableEndLength: ${this.availableEndLength}`) }    //LOGGING:
    }

    const cubicVert = start ? this.cubicVerts.start : this.cubicVerts.end

    if (vert instanceof Vertex) {
      if (!this.vertIsOnLine(vert)) {
        console.error(`trying to assign a cubicVert that is not on this segment`)
        console.log(`off-line vert`, vert)
        console.log(`this.segment`, this)
        return
      }
      if (cubicVert && !replace) {
        return
        if (report) { console.error(`hit this!`) }
        const terminus = start ? this.start : this.end
        if (vert.dist(terminus) >= cubicVert.dist(terminus)) { return }
      }

      if (start) {
        this.cubicVerts.start = vert
      } else {
        this.cubicVerts.end = vert
      }

      this.#resetMemoProps()
      if (report) {
        console.log(`this.cubicStartVert: ${this.cubicVerts.start?.string}`)
        console.log(`this.cubicEndVert: ${this.cubicVerts.end?.string}`)
        console.log(`new available${mode}Length:`, start ? this.availableStartLength : this.availableEndLength)
      }
    }
  }
  //METH: #removeCubicVert()
  // #removeCubicVert(start = true, max = false) {
  //   if (max === false) {
  //     if (start) { this.cubicVerts.start = undefined } else { this.cubicVerts.end = undefined }
  //   } else {
  //     if (start) { this.maxCubicVerts.start = undefined } else { this.maxCubicVerts.end = undefined }
  //   }
  //   this.#resetMemoProps()
  // }
  //METH: #replaceCubicVert()
  // #replaceCubicVert(vert, start) {                                                                             //UNUSED:
  //   this.#addCubicVert(vert, true, start)
  // }
  //METH: #resetMemoProps()
  #resetMemoProps(andNeighbors = true) {
    const segs = andNeighbors ? this.andNeighborsArray : [this]
    segs.forEach(s => {
      resetMemoized(s,
        `adjacentDistanceObjs`,
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
        // `corners`,
        // `cornerVerts`,
        `finalAdjWrapperObjs`,
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
  get hasMaxStartVert() { return !!this.maxCubicVerts.start }
  get hasMaxEndVert() { return !!this.maxCubicVerts.end }
  get hasSomeMaxVerts() { return this.hasMaxStartVert || this.hasMaxEndVert }
  get hasNoMaxVerts() { return !this.hasSomeMaxVerts }
  get hasOnlyOneMaxVert() {
    return (this.hasMaxStartVert || this.hasMaxEndVert) && !(this.hasBothMaxVerts)
  }
  get hasBothMaxVerts() { return this.hasMaxStartVert && this.hasMaxEndVert }

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

  get finalMaxStartVert() {
    const length = min(this.maxCubicStartLength, this.startNeighbor.maxCubicEndLength)
    return this.distancedStartPoint(length)
  }
  get finalMaxEndVert() {
    const length = min(this.maxCubicEndLength, this.endNeighbor.maxCubicStartLength)
    return this.distancedEndPoint(length)
  }

  // #setupMaxCubicVerts() {
  //   const max = this.length - this.cellRadius
  //   console.warn(` setupMaxCubicVerts this.length: ${this.length}, this.cellRadius: ${this.cellRadius},`)
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
  get startVert() { return this.cubicVerts.start || this.maxCubicVerts.start }
  get endVert() { return this.cubicVerts.end || this.maxCubicVerts.end }
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
      // if (this.hasBothCompleteCorners) { 
      return this.finalCubicStartVert.dist(this.finalCubicEndVert)
      //  }
    }, `flatAmount`).call(this)
  }
  //MEMO: hasNoFlatness
  get hasNoFlatness() {
    // return memoize(() => {
    return roundToDec(this.flatAmount, 1) === 0
    // }, `hasNoFlatness`).call(this)

  }
  get hasFlatness() {
    // if (this.hasBothCompleteCorners) { 
    return !this.hasNoFlatness
    //  }
  }

  // get hasNotFlatNeighbor() { return this.startNeighbor.hasNoFlatness || this.endNeighbor.hasNoFlatness }
  get hasFlatStartNeighbor() { return this.startNeighbor.hasFlatness }
  get hasFlatEndNeighbor() { return this.endNeighbor.hasFlatness }
  get hasFlatNeighbor() { return this.hasFlatStartNeighbor || this.hasFlatEndNeighbor }

  get canCurveMore() { return this.hasFlatness && this.hasFlatNeighbor }
  get canCurveMoreAtEnd() { return this.hasFlatness && this.hasFlatEndNeighbor }
  get canCurveLessAtEnd() { return roundToDec(this.availableEndLength, 1) > roundToDec(this.cellRadius, 1) }
  get isLooseCorner() { return this.isOutsideCorner && this.canCurveMoreAtEnd }
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
    return Vertex.add(origin, originToStart.lineVector.rotate(radians(deg)))
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

  //MEMO: arcCenterTangent
  // get arcCenterTangent() {
  //   return memoize(() => {
  //     const dist = this.arcRadius / 2
  //     const vect = this.arcNormalDirection.toRight.vector.setMag(dist)
  //     const start = this.arcCenterVert
  //     const end = Vertex.add(vect, start)
  //     return segment(start, end)
  //   }, `arcCenterTangent`).call(this)
  // }
  //MEMO: arcCenterMidPointTangent
  get arcCenterMidPointTangent() {
    // console.warn(`arcCenterMidPointTangent`, this.hasArc)
    // return memoize(() => {
    return this.#calcArcCenterMidTangent()
    // }, `arcCenterMidPointTangent`).call(this)
  }
  //MEMO: maxArcCenterMidTangent
  get maxArcCenterMidTangent() {
    // console.warn(`maxArcCenterMidTangent`, this.hasArc)
    return memoize(() => {
      return this.#calcArcCenterMidTangent(false)
    }, `maxArcCenterMidTangent`).call(this)
  }
  //MEMO: minArcCenterMidTangent
  get minArcCenterMidTangent() {
    // console.warn(`minArcCenterMidTangent`, this.hasArc)
    return memoize(() => {
      return this.#calcArcCenterMidTangent(false, false)
    }, `minArcCenterMidTangent`).call(this)
  }

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

  // arcIsWithinArc(thisArc, thatArc) {
  //   return boundsIsWithinTestBounds(thisBounds, segBounds)
  // }
  //METH: arcIsWithinThisArc()
  // arcIsWithinThisArc(arcSeg) {                                                                            //UNUSED:
  //   const thisBounds = this.minArcBoundsSeg
  //   const segBounds = arcSeg instanceof ProtoSegment ? arcSeg.maxArcBoundsSeg : arcSeg
  //   // console.log(`arcIsWithinThisArc`, this)                                                              //LOGGING:
  //   // console.log(`arcIsWithinThisArc`, arcSeg)                                                            //LOGGING:
  //   // console.log(`arcIsWithinThisArc thisBounds`, thisBounds)                                             //LOGGING:
  //   // console.log(`arcIsWithinThisArc thisBounds`, thisBounds)                                             //LOGGING:
  //   const result = boundsIsWithinTestBounds(thisBounds, segBounds)
  //   // console.log(`arcIsWithinThisArc result`, result)                                                     //LOGGING:
  //   return result
  // }
  //METH: arcWrappedWithinThisArc()
  // arcShouldWrapOutToArc(arcSeg) {                                                                         //UNUSED:
  //   return this.arcIsWithinThisArc(arcSeg) && this.hasSameFacingCorner(arcSeg)
  // }


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
      // console.log(``)                                                                                //LOGGING:
      // console.log(`viableArcOrigins()`, this)                                                        //LOGGING:
      // console.log(`viableArcOrigins() horAspect`, horAspect)                                         //LOGGING:
      // console.log(`refPoints`, refPoints)                                                            //LOGGING:
      // console.log(`this.viableArcOriginsSeg`, this.viableArcOriginsSeg)                              //LOGGING:
      let projectedPoints = refPoints.map(p => {
        const projEnd = Vertex.add(refSeg.direction.toLeft.lineVector, p)
        const projSeg = segment(p, projEnd)
        return this.viableArcOriginsSeg.intersectionWith(projSeg, true)
      })
      // console.log(`viableArcOrigins projectedPoints`, projectedPoints)                               //LOGGING:
      const viables = projectedPoints
        .filter(p => this.viableArcOriginsSeg.vertIsOnLine(p))
        .gridVertSorted
        .filter((p, i, a) => !p.equals(a.at(i - 1), 1))
      // console.log(`filtered viables`, viables)                                                       //LOGGING:
      return viables
    }, `viableArcOrigins`).call(this)
  }

  get currentViableArcOrigins() {
    // console.error(`currentViableArcOrigins`, this)                                                      //LOGGING:
    // console.log(`currentViableArcOrigins viableArcOrigins`, this.viableArcOrigins)                      //LOGGING:
    if (this.viableArcOrigins.length === 1) { return this.viableArcOrigins }
    //FIXME: startBounds and endBounds should stretch to edges
    const startBounds = this.isVertical ? this.startNeighbor.arcBoundsHorizontal : this.startNeighbor.arcBoundsVertical
    const endBounds = this.endNeighbor.isVertical ? this.endNeighbor.arcBoundsHorizontal : this.endNeighbor.arcBoundsVertical
    console.log(`currentViableArcOrigins startBounds`, startBounds)                                     //LOGGING:
    console.log(`currentViableArcOrigins endBounds`, endBounds)                                         //LOGGING:
    const viables = this.viableArcOrigins.filter(v =>
      !vertIsInsideBounds(v, startBounds, false, 0)
      && !vertIsInsideBounds(v, endBounds, false, 0))
    console.log(`currentViableArcOrigins viables`, viables)                                             //LOGGING:
    return viables
  }

  get currentViableArcOriginsSeg() {
    const viables = this.currentViableArcOrigins
    return segment(viables.first, viables.last)
  }

  //MARK: Edges
  get adjFrameEdge() {
    const dir = this.normals.cubic
    const arcDir = this.isOutsideCorner ? dir : dir.opposites
    return FRAME.sides[arcDir.name]
  }
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
    // console.log(this)
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
      if (!this.shape) { console.log(this) }
      return this.shape.simpleSubShapes.flat().exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `inShapeSameFacingCorners`).call(this)
  }
  //MEMO: neighborSameFacingCorners
  get neighborSameFacingCorners() {
    return memoize(() => {
      return this.shape.andNeighborSimples.exclude(this, 'id')
        .filter(s => this.hasSameFacingCorner(s))
    }, `neighborSameFacingCorners`).call(this)
  }
  //MEMO: inShapeDiagonalCorners
  get inShapeDiagonalCorners() {
    return memoize(() => {
      return this.shape.simpleSubShapes.flat().exclude(this, 'id')
        .filter(s => this.hasDiagonalCorner(s))
    }, `inShapeDiagonalCorners`).call(this)
  }
  //MEMO: neighborDiagonalCorners
  get neighborDiagonalCorners() {
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
    // console.warn(this, seg)
    const facing = this.hasSameFacingCorner(seg)
    const colBoundsSeg = this.maxArcBoundsSeg.isCollinearWith(seg.maxArcBoundsSeg)
    // console.log(`hasDiagonalCorner`, facing, colBoundsSeg)                                                //LOGGING:
    // console.log(`segs:`, this.viableArcOriginsSeg, seg.viableArcOriginsSeg)                               //LOGGING:
    return facing && colBoundsSeg
    return this.hasSameFacingCorner(seg) && this.maxArcBoundsSeg.isCollinearWith(seg.maxArcBoundsSeg)
  }
  //METH: hasCollinearCorner()
  hasCollinearCorner(seg) {
    const diagonal = this.hasDiagonalCorner(seg)
    const collinear = this.isCollinearWith(seg) || this.isCollinearWith(seg.endNeighbor)
    const sharedCorner = this.end.equals(seg.end, 0)
    return diagonal && collinear && !sharedCorner
  }
  //METH: hasCoincidentCorner()
  hasCoincidentCorner(seg) {
    const diagonal = this.hasDiagonalCorner(seg)
    const sharedCorner = this.end.equals(seg.end, 0)
    return diagonal && sharedCorner
  }

  //MARK: FLUSH WRAPPING
  //MEMO: flushWrappers
  get flushWrappers() {
    return memoize(() => {
      //ARROW: closest()
      const closest = (segs, start = false) => {
        const name = start !== this.isOutsideCorner ? `arcStartCorner` : `arcEndCorner` // choose arcCorner that's collinear 
        return segs
          .filter(s => this.hasSameFacingCorner(s))                     // overlap wraps share corner direction
          .map(s => {
            return { seg: s, dist: roundToDec(this.end.dist(s[name]), 1) }  // map to obj with dist to corner calculated
          })
          .sort((a, b) => a.dist - b.dist)[0]                               // sort and take closest
      }
      // if (!this.isOutsideCorner) {
      const startWrap = closest(this.overlapSegs.map(s => s.startNeighbor))   // calculate closest obj on corner start
      const endWrap = closest(this.endNeighbor.overlapSegs, true)             // calculate closest obj on corner end
      return { start: startWrap, end: endWrap }                               // return both as obj
      // }
    }, `flushWrappers`).call(this)
  }

  //MEMO: coincidentWrapper
  get coincidentWrapper() {
    return memoize(() => {
      const { start, end } = this.flushWrappers
      if (start?.seg.equals(end?.seg)                  // one unique flushWrapper (both start & end were found AND they are the same seg/corner)
        && start.seg.end.equals(this.end, 0)           // this corner vert coincides with wrapper corner vert 
      ) { return start.seg }
    }, `coincidentWrapper`).call(this)
  }
  //MEMO: collinearWrapper
  get collinearWrapper() {
    return memoize(() => {
      const { start, end } = this.flushWrappers
      if (start && end) {
        // if (start.dist === end.dist) { return { start: start.seg, end: end.seg } }
        if (!start.seg.equals(end.seg)) {
          if (start.dist <= end.dist) {
            return start.seg
          } else {
            return end.seg
          }
        }
      }
      if (start) { return start.seg }
      if (end) { return end.seg }
    }, `collinearWrapper`).call(this)
  }

  get coinOutWrapper() { if (this.isOutsideCorner) { return this.coincidentWrapper } }
  get coinInWrapper() { if (!this.isOutsideCorner) { return this.coincidentWrapper } }
  get colOutWrapper() { if (this.isOutsideCorner) { return this.collinearWrapper } }
  get colInWrapper() { if (!this.isOutsideCorner) { return this.collinearWrapper } }

  //MARK: ADJACENT WRAPPING
  //METH: minAdjWrapperDistanceObj()
  minAdjWrapperDistanceObj(seg) {
    const [inWrap, outWrap] = this.isOutsideCorner ? [seg, this] : [this, seg]
    const tangent = inWrap.arcCenterMidPointTangent

    const tangentIntersect = tangent.intersectionWith(outWrap, true)
    const tangDist = roundToDec(tangentIntersect.dist(outWrap.end), 2)

    let startDist = inWrap.direction.allAreVertical ?
      inWrap.start.x - outWrap.endNeighbor.start.x
      : inWrap.start.y - outWrap.endNeighbor.start.y
    startDist = abs(roundToDec(startDist), 1)
    let endDist = inWrap.endNeighbor.direction.allAreVertical ?
      inWrap.endNeighbor.start.x - outWrap.start.x
      : inWrap.endNeighbor.start.y - outWrap.start.y
    endDist = abs(roundToDec(endDist), 1)

    const startObj = {
      seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: startDist, isStart: true
    }
    const endObj = {
      seg: seg, tang: tangent, tangX: tangentIntersect, tangDist: tangDist, dist: endDist, isStart: false
    }

    if (startDist === endDist) { return [startObj, endObj] }
    if (startDist < endDist) {
      return startObj
    } else {
      return endObj
    }
  }
  //METH: adjWrapperIntersectObj()
  adjWrapperIntersectObj(wrapDistObj) {
    const { seg, dist, isStart } = wrapDistObj
    const [inWrap, outWrap] = this.isOutsideCorner ? [seg, this] : [this, seg]
    // console.warn(`adjWrapperIntersectObj`)
    // console.log(`seg`, seg)
    // console.log(`dist`, dist)
    // console.log(`isStart`, isStart)
    // console.log(`outWrap`, outWrap)
    // console.log(`inWrap`, inWrap)
    const intersect = isStart ?
      inWrap.arcStartToShapeBoundsEdgeSeg.intersectionWith(outWrap.endNeighbor, true)
      : inWrap.arcEndToShapeBoundsEdgeSeg.intersectionWith(outWrap, true)
    const distToCorner = roundToDec(intersect.dist(outWrap.arcNormalCorner))

    // console.log(`intersect`, intersect)
    // console.log(`distToCorner`, distToCorner)
    return { seg: seg, dist: distToCorner, intersect: intersect, isStart: isStart }
  }
  //MEMO: adjacentDistanceObjs
  get adjacentDistanceObjs() {
    // if (this.id.includes('cell019')) {
    //   console.warn(`processing cell199`)
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

    let adjWraps = this.inShapeSameFacingCorners
      .filter(s =>
        s.isOutsideCorner === outside                                       // is opposite?
        && canHaveCorrectBounds(s)
        && canHaveCorrectSize(s)                                            // canHaveCorrectSize? 
      )
      .map(s => this.minAdjWrapperDistanceObj(s)).flat()
      .sort((a, b) => a.dist - b.dist)
      .sort((a, b) => a.tangDist - b.tangDist)
    // console.log(`adjWraps`, adjWraps)
    return adjWraps
    // }, `adjacentDistanceObjs`).call(this)
  }

  get adjacentIntersectObjs() {
    const adjWraps = this.adjacentDistanceObjs
    return adjWraps
      .filter(obj =>
        obj.tangDist === adjWraps[0].tangDist
        && obj.dist === adjWraps[0].dist
        // && (equalsRoundedDec(obj.seg.maxArcRadius, obj.dist, 1) || obj.seg.maxArcRadius > obj.dist)
      )
      .map(obj => this.adjWrapperIntersectObj(obj))
      .sort((a, b) => a.dist - b.dist)
  }

  get finalAdjWrapperObjs() {
    // return memoize(() => {
    const intersectWraps = this.adjacentIntersectObjs
    return intersectWraps
      .filter(obj => obj.dist === intersectWraps[0].dist)
      .sort((a, b) => b.isStart - a.isStart)
    // }, `finalAdjWrapperObjs`).call(this)
  }
  get finalAdjWrappers() { return this.finalAdjWrapperObjs.map(obj => obj.seg) }
  get intendedArcRadius() {
    if (this.isOutsideCorner && this.adjInWrapper) { return this.adjInWrapper.finalAdjWrapperObjs.map(obj => obj.dist)[0] }
  }
  //MEMO: adjacentWrapper
  get adjacentWrapper() {
    // return memoize(() => {
    return this.finalAdjWrappers[0]
    // }, `adjacentWrapper`).call(this)
  }

  get radiantWrapper() { }
  get proximalWrapper() { }

  get adjOutWrapper() { if (!this.isOutsideCorner) { return this.adjacentWrapper } }
  get adjInWrapper() { if (this.isOutsideCorner) { return this.adjacentWrapper } }

  //MARK: IN/OUT WRAPPING
  //METH: tightWrap() :
  tightWrap(replace = false) {
    return this.#wrap(true, replace)
  }

  //METH: adjWrap() :
  adjWrap(replace = false) {
    return this.#wrap(false, replace)
  }

  //METH: #wrap() :
  #wrap(tight, replace = false) {
    let wrapper = tight ? this.coincidentWrapper : this.adjacentWrapper
    const wrapType = tight ? `tightWrap()` : `adjWrap()`                                        //LOGGING:
    let report = false                                                                            //LOGGING:
    // if (this.id.includes('cell119')                                                               //LOGGING:
    //   // || this.id.includes('cell022')                                                              //LOGGING:
    // ) {                                                                                           //LOGGING:
    //   report = true                                                                               //LOGGING:
    //   console.error(`${wrapType} called on:`, this)                                               //LOGGING:
    //   console.log(`wrapper:`, wrapper)                                                            //LOGGING:
    // }

    if (wrapper
      // && viables
    ) {                                                    // has a tight wrapper
      if (report) { console.log(`wrapper:`, wrapper.id) }                                         //LOGGING:
      const [inWrapper, outWrapper] = tight ? this.inOutCoinWrappers : this.inOutAdjWrappers
      const viables = tight ? this.viableCoinWrapOrigins : this.viableAdjWrapOrigins

      if (this.hasArc) {                                                         // this has arc
        if (report) { console.log(`this hasArc`) }                                                //LOGGING:

        if (wrapper.hasArc                                                       // both have arcs!
          && wrapper.arcOrigin.equals(this.arcOrigin, 2)) {               // already tightly wrapped!
          if (report) { console.log(`already tightly wrapped!`) }
          return
        }

        // if (viables?.some(v => this.arcOrigin.equals(v, 2))) {                    // arcs are diagonal & can wrap
        if (this.hasDiagonalCorner(wrapper)) {                    // arcs are diagonal & can wrap
          if (report) {                                                                           //LOGGING:
            console.log(`this.arcOrigin`, this.arcOrigin)                                         //LOGGING:
            console.log(`${wrapType} cubicVerts before`, wrapper.cubicVerts)                      //LOGGING:
          }                                                                                       //LOGGING:
          if (replace                                                            // forced replacement
            || (tight ? this.coinWrapIsNonEquidistant                          // nonEquidistant wrappers!
              : this.adjWrapIsNonEquidistant)) {                                    // nonEquidistant wrappers!
            // console.log(`replacing end curve origin`)                                           //LOGGING:
            wrapper.replaceEndCurveOrigin(this.arcOrigin)                        // replace matching wrapper curve
          } else {
            // console.log(`setting end curve origin`)                                           //LOGGING:
            wrapper.setEndCurveOrigin(this.arcOrigin)                            // set matching wrapper curve
          }
          if (report) {                                                                           //LOGGING:
            console.log(`wrapper.setEndCurve`)                                                    //LOGGING:
            console.log(`${wrapType} cubicVerts after`, wrapper.cubicVerts)                                      //LOGGING:
          }                                                                                       //LOGGING:
          // }
        } else {                                                                 // adj arcs are not diagonal
          const obj = wrapper.adjacentIntersectObjs[0]
          if (report) {                                                                           //LOGGING:
            console.log(`adj arcs are not diagonal`)                                              //LOGGING:
            // console.log(`wrapper`, wrapper)                                                       //LOGGING:
            // console.log(`wrapper int obj`, wrapper.adjacentIntersectObjs[0])                              //LOGGING:
            console.log(`intersectObject`, obj)                                                   //LOGGING:
          }
          if (obj) {
            if (obj.dist < wrapper.maxArcRadius) {
              wrapper.addDistancedEndCornerVerts(obj.dist, true, true)
            } else {
              wrapper.replaceEndCurveOrigin(wrapper.currentMaxArcOrigin)
            }
            // wrapper.addDistancedEndCornerVerts(obj.dist, true, true) 

          }
          // if (obj?.dist < wrapper.maxArcRadius) { wrapper.addDistancedEndCornerVerts(obj.dist, true, true) }
        }


      } else {                                                                   // has NO arc
        if (report) { console.log(`this DOES NOT hasArc`) }                                       //LOGGING:

        this.replaceEndCurveOrigin(viables.last)                                 // replace with largest viable
        wrapper.replaceEndCurveOrigin(viables.last)                              // replace with largest viable
      }
    }
  }

  get outWrapper() { return this.isOutsideCorner ? this.coinOutWrapper : this.adjOutWrapper }
  get inWrapper() { return this.isOutsideCorner ? this.adjInWrapper : this.coinInWrapper }
  //MEMO: outWrappers
  get outWrappers() {
    return memoize(() => {
      // console.log(`this`, this)                                                                     //LOGGING:
      // console.log(`outWrapper`, this.outWrapper)                                                    //LOGGING:
      // console.log(this.outWrapper.outWrappers)                                                      //LOGGING:
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
      // console.log(`radiantOutWrappers for`, this)
      if (this.outWrappers) {
        let wrappers
        if (this.isInnerMostWrapper) {
          if (this.outWrapperIsRadiant) {
            wrappers = this.outWrappers
              .filter(s => this.canRadiateTo(s))
          }
        } else {                                  //this is NOT innerMostWrapper
          if (!this.inWrapper.outWrapperIsRadiant && this.outWrapperIsRadiant) {
            wrappers = this.outWrappers
              .filter(s => this.canRadiateTo(s))
          } else {
            wrappers = this.innerMostRadiantWrapper.radiantOutWrappers?.intersect(this.outWrappers, `id`)
          }
        }
        if (!wrappers || !wrappers.isEmpty) { return wrappers }
      }
    }, `radiantOutWrappers`).call(this)
  }
  //MEMO: inWrappers
  get inWrappers() {
    return memoize(() => {
      // console.log(`this.inWrapper`, this.inWrapper)
      if (this.inWrapper) { return OpArray.format(this.inWrapper).union(this.inWrapper.inWrappers, `id`) }
    }, `inWrappers`).call(this)
  }
  //MEMO: radiantInWrappers
  get radiantInWrappers() {
    return memoize(() => {
      if (this.inWrapperIsRadiant) {
        return OpArray.format(this.inWrapper).union(this.inWrapper.radiantInWrappers, `id`)
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

    // console.log(`innerMostRadiantWrapper`, this)
    // if (!!this.inWrappers) {
    //   // console.log(`this.inWrappers`, this.inWrappers)
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
          .filter(v => vertIsInsideBounds(v, this.viableCoinWrapOriginBounds, true, 0))
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
          .filter(v => vertIsInsideBounds(v, this.viableAdjWrapOriginBounds, true, 0))
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
      // console.log(`viableRadOutWrappersOriginBounds radiantOutWrappers`, this.radiantOutWrappers)
      let viables = this.radiantOutWrappers
        .map(s => s.currentViableArcOriginsSeg)
      // console.log(`viableRadOutWrappersOriginBounds viables`, viables)                                  //LOGGING:
      const result = boundsOverlap({ geo: [viables], accuracy: 0 })
      // console.log(`result`, result)                                                              //LOGGING:
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
  //MEMO: viableRadiantOrigins
  get viableRadiantOrigins() {
    // console.error(`can has viableRadiantOrigins?`)
    // return memoize(() => {
    if (this.viableRadiantOriginBounds) {
      // console.warn(`yes! viableRadiantOrigins`)
      // console.error(`viableArcOrigins`, this.viableArcOrigins.map(v => v.string))
      // console.error(`viableRadiantOriginBounds`, this.viableRadiantOriginBounds)
      const viableBounds = this.viableRadOutWrappersOriginBounds
      // console.log(`viableRadOutWrappersOriginBounds`, viableBounds)
      const origins = this.currentViableArcOrigins
        .filter(v => vertIsInsideBounds(v, viableBounds, true, 0))
        .sort((a, b) => Vertex.dist(a, this.end) - Vertex.dist(b, this.end))
      if (!origins.isEmpty) { return origins }

    }
    // }, `viableRadiantOrigins`).call(this)
  }
  //MARK: INTERFERENCE WRAPPING
  get interferenceWrappers() {
    if (
      // !this.hasMinArcRadius
      // &&
      this.isInnerMostRadiantWrapper && this.radiantOutWrappers.length > 1) {
      const segs = this.outerMostRadiantWrapper.neighborsArray.flat()
        // const segs = this.radiantOutWrappers
        //   .map(s => s.neighborsArray).flat()
        //   // .map(s => {
        //   return !s.isOutsideCorner && s.coinInWrapper ? s.inWrapper : s
        // })
        .filter(s =>
          //NOTE: removing !s.hasMinArcRadius fixes #405
          // !s.hasMinArcRadius
          // &&
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
    // console.log(`viableInterferenceOrigins()`)
    if (!this.hasInterference) { return }
    //ARROW: 
    const viables = (corner, isStart = true) => {
      if (!corner) { return }
      // console.log(`cornerOrigins`, corner.viableArcOriginsSeg.string)
      // console.log(`corner viables`, corner.viableArcOrigins)
      let bounds = { ...corner.viableArcOriginsSeg.bounds }                 // copy minMax bounds
      // console.log(`bounds`, bounds)
      const side = isStart === this.isOutsideCorner ? this : this.endNeighbor    // seg to reference direction
      if (side.isVertical) {
        bounds.xMin = 0
        bounds.xMax = 100
      } else {
        bounds.yMin = 0
        bounds.yMax = 200
      }
      // console.log(`isStart`, isStart)
      // console.log(`side`, side)
      // console.log(`bounds`, bounds)
      const origins = this.viableArcOrigins.filter(v => vertIsInsideBounds(v, bounds, true, 0))
      // console.log(`origins`, origins)
      if (!origins.isEmpty) return origins
    }

    const starts = viables(this.interferenceWrappers.start)
    const ends = viables(this.interferenceWrappers.end, false)

    // console.log(`starts`, starts)
    // console.log(`ends`, ends)
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
  get hasCompleteTightWrap() { return this.hasArc && this.coincidentWrapper?.hasArc }
  get hasCompleteAdjWrap() { return this.hasArc && this.adjacentWrapper?.hasArc }

  //MEMO: inOutCoinWrappers
  get inOutCoinWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(true)
    }, `inOutCoinWrappers`).call(this)
  }
  //MEMO: inOutAdjWrappers
  get inOutAdjWrappers() {
    return memoize(() => {
      return this.#inOutWrappers(false)
    }, `inOutAdjWrappers`).call(this)
  }

  get isCoinInWrapper() { return !!this.coinOutWrapper }
  get isAdjInWrapper() { return !!this.adjOutWrapper }
  get isCoinOutWrapper() { return !!this.coinInWrapper }
  get isAdjOutWrapper() { return !!this.adjInWrapper }

  //METH: #inOutWrappers()
  #inOutWrappers(tight) {
    // if (tight ? this.hasCompleteTightWrap : this.hasCompleteAdjWrap) {
    const wrapper = tight ? this.coincidentWrapper : this.adjacentWrapper
    return this.isOutsideCorner === tight ? [this, wrapper] : [wrapper, this]
    // }
  }

  //METH: #wrapState()
  wrapState(tight) {
    if (tight) {
      if (this.hasCompleteTightWrap) {
        const [inRadius, outRadius] = this.inOutCoinWrappers.map(w => roundToDec(w.arcRadius, 2))  // arcRadius of in and out wrappers
        if (inRadius === outRadius) { return 0 }                              // EQUIDISTANT: radii are equal
        if (inRadius < outRadius) { return 1 }                                // DIVERGING: inRadius < outRadius
        if (inRadius > outRadius) { return 2 }                                // CONVERGING: inRadius > outRadius
      }
    } else {
      if (this.hasCompleteAdjWrap) {
        const inOuts = this.inOutAdjWrappers
        const outCorner = inOuts[1].end
        const [inDist, outDist] = inOuts.map(w => roundToDec(w.arcOrigin.dist(outCorner), 2))

        if (inDist === outDist) { return 0 }                                  // EQUIDISTANT: dists to corner are equal
        if (inDist > outDist) { return 1 }                                    // DIVERGING: inDist > outDist
        if (inDist < outDist) { return 2 }                                    // CONVERGING: inDist < outDist
      }
    }
  }

  get coinWrapIsEquidistant() { return this.wrapState(true) === 0 }
  get coinWrapIsDiverging() { return this.wrapState(true) === 1 }
  get coinWrapIsConverging() { return this.wrapState(true) === 2 }
  get coinWrapIsNonEquidistant() { return this.coinWrapIsDiverging || this.coinWrapIsConverging }
  get adjWrapisEquidistant() { return this.wrapState(false) === 0 }
  get adjWrapIsDiverging() { return this.wrapState(false) === 1 }
  get adjWrapIsConverging() { return this.wrapState(false) === 2 }
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

  get hasNoWrappers() {
    return !this.inWrapper && !this.outWrapper

  }


  // //MEMO: sharedOrigins
  // get sharedOrigins() {
  //   return memoize(() => {
  //     return this.grid.allSimpleSubShapes.flat().exclude(this, 'id')
  //       .filter(s => this.arcOriginCorner.equals(s.arcOriginCorner, 2))
  //       .sort((a, b) => a.arcRadius - b.arcRadius)    // sorted small to large
  //   }, `sharedOrigins`).call(this)
  // }


  // //MEMO: outWrapCount
  // get outWrapCount() { return this.outWrappers.length }
  // get hasOutWraps() { return this.outWrapCount > 0 }

  // get inWrapCount() { return this.inWrappers.length }
  // get hasInWraps() { return this.inWrapCount > 0 }

  // #endregion
  //MARK: Copy Methods
  // #region Copy Methods
  //METH: copy
  get copy() {
    // const copyNumber = this.id.includes(`copy`) ? `copy` + String(+this.id.slice(-2) + 1).padStart(1, '0') : `copy0`
    return memoize(() => {
      return protoSegment({
        start: this.start,
        end: this.end,
        parentID: this.parentID,
        // id: `${this.id}-${copyNumber}`,
        id: `${this.id}`,
        islandIDs: this.islandIDs,
        cubicVerts: this.cubicVerts,
        neighbors: this.neighbors,
        cells: this.cells,
        points: this.points,
        sideDir: this.sideDir,
      })
    }, `copy`).call(this)
  }
  //METH: insetCopy
  insetCopy(insetScale, minCellWidth) {
    // if (insetScale <= 0) { return }
    // if (insetScale > 2) { insetScale = 2 }

    const scaleToOffset = Vertex.sub(insetScale, vert(1))  // create scaleToOffset 
    const offset = Vertex.mult(scaleToOffset, minCellWidth / 2)
    const startMove = Vertex.mult(this.normals.start.moveCoord, offset) // startMove vector
    const insetStart = Vertex.add(this.start, startMove) // new inset segment start
    const endMove = Vertex.mult(this.normals.end.moveCoord, offset) // endMove vector
    const insetEnd = Vertex.add(this.end, endMove) // new inset segment end
    if (insetEnd.x < 0 || insetEnd.y < 0) { console.warn(`created insetEnd with negative values`) }

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

    let insetMaxVerts = { start: undefined, end: undefined }
    if (this.maxCubicVerts.start && this.maxCubicVerts.end) {
      const insetMaxStart = Vertex.add(this.finalMaxStartVert, cubicMove)
      const insetMaxEnd = Vertex.add(this.finalMaxEndVert, cubicMove)
      insetMaxVerts = { start: insetMaxStart, end: insetMaxEnd } // assign new inset cubicVerts
    }

    let insetPoints
    if (this.points) {
      const insetSeg = segment(insetStart, insetEnd)
      insetPoints = this.points
        .map(p => Vertex.add(p, cubicMove))
        .filter(p => insetSeg.vertIsOnLine(p, 3))
    }


    const insetCopy = protoSegment({ // new inset segment 
      start: insetStart,
      end: insetEnd,
      parentID: this.id,
      id: `${this.id}-inset(${roundToDec(insetScale.x, 2)})`,
      islandIDs: this.islandIDs,
      cubicVerts: insetCubicVerts,
      maxCubicVerts: insetMaxVerts,
      insetScale: insetScale,
      cells: this.cells,
      points: insetPoints,
      sideDir: this.sideDir,
    })

    return insetCopy
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
    // console.log(`this.shape.andNeighborSimples`, this.shape.andNeighborSimples)
    return memoize(() => {
      return this.shape.andNeighborSimples
        .exclude(this, `id`)
        .filter(s => this.isOverlappingWith({ seg: s }))
    }, `overlapSegs`).call(this)
  }
  get overlapInsideSegs() {
    return memoize(() => {
      return this.shape.andNeighborSimples
        .exclude(this, `id`)
        .filter(s => this.isOverlappingWith({ seg: s, includeEnds: false, mode: 0 }))
    }, `overlapInsideSegs`).call(this)
  }
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
      console.error(`Error: segment is missing neighbors, segPath cannot be calculated!`)
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
        console.error(`assigned a disconnected start neighbor!`, this.start, start.end)
      }
      this.neighbors.start = start
    }
    if (end) {
      if (!this.end.equals(end.start, 1)) {
        console.error(`assigned a disconnected end neighbor!`, this.end, end.start)
      }
      this.neighbors.end = end
    }
  }
  // #endregion
}
