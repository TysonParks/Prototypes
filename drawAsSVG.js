
// MARK: Constants
const bezCircleConst = 0.55228
const bezCircle45DegConst = 0.265

//TODO: REMOVE THIS DEBUG CODE WHEN DONE!
const info = (seg) => {
  return {
    hasGoneBad: seg.end.x < 0 || seg.end.y < 0,
    dir: seg.direction.name,
    start: seg.start.string,
    end: seg.end.string,
    cubicStart: seg.cubicVerts.start,
    cubicEnd: seg.cubicVerts.end,
  }
}

//CLASS: SVGPath
// SIZE: 178 lines
class SVGPath {
  //METH: fromProtoSegPath() : convert PrSeg path with cubic verts (finalSubShapes) to a valid SVG path string
  static fromProtoSegPath({ segPath, cornerMin = 0, cornerScale = 1 } = {}) {
    segPath = segPath.copy
    let curves = []
    let start, end, cornerStart, cornerEnd
    let startRadius, startSegment, endRadius, endSegment
    let controlStart, lineStart, lineEnd, controlEnd

    segPath.forEach((seg, i) => {
      // let report = false
      // if (seg.availableStartLength < GRID.cellRadius) { report = true }
      // if (report) {
      //   console.log(seg)
      // }
      cornerMin = min(cornerMin, seg.length / 2)

      startRadius = seg.hasCubicStartVert ? seg.availableStartLength : cornerMin // radius of corner arc
      lineStart = seg.distancedStartPoint(startRadius * cornerScale) // start point of line connecting corner arcs 
      startSegment = segment(lineStart, seg.start) // control point calculation segment, connects hard corner to mid line
      controlStart = startSegment.pointOnsegment(bezCircleConst)

      endRadius = seg.hasCubicEndVert ? seg.availableEndLength : cornerMin // radius of corner arc
      lineEnd = seg.distancedEndPoint(endRadius * cornerScale) // end point of line connecting corner arcs
      endSegment = segment(lineEnd, seg.end) // control point calculation segment, connects hard corner to middle line
      controlEnd = endSegment.pointOnsegment(bezCircleConst)

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
    console.log(`end`, end)
    console.log(`endSVG`, endSVG)
    console.log(`svgPath`, svgPath)
    return svgPath
  }

  //METH: fromSegPath() : 
  static fromSegPath({ segPath, refine = true, random = false, straightness = 0 } = {}) {
    if (refine) {
      let verts = VertPath.fromSegPath(segPath)
      segPath = SegPath.fromVertPath({ path: verts, refine: true })
    }
    return SVGPath.segPathToCurvedSVG({ segPath: segPath, random: random, straightness: straightness })
  }
  //METH: segPathToCurvedSVG() : create SVG path from segments with points rounded using (C) bezier curves
  static segPathToCurvedSVG(
    { segPath,
      curvature = bezCircleConst,
      straightness = 0,
      bisector = .5,
      circularCaps = true,
      random = false,
    } = {}) {
    segPath = segPath.copy
    let last = segPath.pop()
    let lineStartLoc = bisector - straightness * bisector
    let lineEndLoc = bisector + straightness * (1 - bisector)

    //ARROW: offset
    const offset = () => random ? R.random_num(0.1, 1.5) : curvature

    //ARROW: makeSegmentCircular
    const makeSegmentCircular = (segment, startLoc = lineStartLoc) => {
      control1 = segment.scaledStartPoint(bezCircleConst, startLoc)
      lineStart = segment.pointOnsegment(startLoc)
      lineEnd = segment.pointOnsegment(lineEndLoc)
      control2 = segment.scaledEndPoint(bezCircleConst, lineEndLoc)
      return [control1, lineStart, lineEnd, control2]
    }

    //ARROW: makePrevSegmentCircular
    const makePrevSegmentCircular = () => {
      if (curves.length === 0) { return }
      let prevCoords = curves.pop()
      let lineEndLoc = 1 - circleCurve / prevSeg.length
      let lineEnd = prevSeg.pointOnsegment(lineEndLoc)
      let control2 = prevSeg.scaledEndPoint(bezCircleConst, lineEndLoc)
      let newCoords = [prevCoords[0], prevCoords[1], lineEnd, control2]
      curves.push(newCoords)
    }

    let curves = new OpArray
    let prevSeg = last
    let control1, lineStart, lineEnd, control2, circleCurve


    // create curve coordinates
    segPath.forEach((seg, i) => {
      if (!circularCaps) {
        control1 = seg.scaledStartPoint(offset(), lineStartLoc)
        lineStart = seg.pointOnsegment(lineStartLoc)
        lineEnd = seg.pointOnsegment(lineEndLoc)
        control2 = seg.scaledEndPoint(offset(), lineEndLoc)
      } else {
        // console.error(`YAAAASSSSSS`)
        // console.log(`segment`, seg)
        if (seg.hasSomeCubicVerts) {
          // console.error(`YEEEEEEESSSSSS`)
          circleCurve = min(seg.length, prevSeg.length) / 8
        } else {
          circleCurve = min(seg.length, prevSeg.length) / 2
        }
        if (seg.length < prevSeg.length) {
          // print('previous is longer!')
          makePrevSegmentCircular()
          makeSegmentCircular(seg)
        } else {
          // print('current is longer!')
          let lineStartLoc = circleCurve / seg.length
          makeSegmentCircular(seg, lineStartLoc)
        }
        prevSeg = seg
      }
      curves.push([control1, lineStart, lineEnd, control2])
    })

    // create start and end coordinates
    let end, start
    if (!circularCaps) {
      end = [last.scaledStartPoint(offset(), lineStartLoc), last.pointOnsegment(lineStartLoc)]
      start = [last.pointOnsegment(lineEndLoc), last.scaledEndPoint(offset(), lineEndLoc)]
    } else {
      circleCurve = min(last.length, prevSeg.length) / 2
      let lineStartLoc = circleCurve / last.length
      if (prevSeg.length > last.length) {
        makePrevSegmentCircular()
        makeSegmentCircular(last)
      } else {
        makeSegmentCircular(last, lineStartLoc)
      }
      end = [control1, lineStart]

      circleCurve = min(last.length, segPath[0].length) / 2
      if (last.length > segPath[0].length) {
        lineEndLoc = 1 - circleCurve / last.length
        lineEnd = last.pointOnsegment(lineEndLoc)
        control2 = last.scaledEndPoint(bezCircleConst, lineEndLoc)
      } else {
        makeSegmentCircular(last, lineStartLoc)
      }
      start = [lineEnd, control2]
    }

    //convert curve segment coordinates into SVG instructions
    let curvesSVG = curves.map(e => `${e[0].array} ${e[1].array} L ${e[2].array} C ${e[3].array} `)
    let endSVG = `${end[0].array} ${end[1].array} Z`
    let startSVG = `M ${start[0].array} C ${start[1].array}`
    return `${startSVG} ${curvesSVG} ${endSVG}`
  }
  // METH: multiplySVGCoords()
  static multiply({ svgPath, multiplier } = {}) {
    let verts = VertPath.fromSVGPath(svgPath).map(e => {
      let pairs = VertPath.toCoord(e)
      return pairs.map(f => f * multiplier)
    })
    return verts
  }
}

//CLASS: SegPath
// SIZE: 117 lines
class SegPath {
  // METH: fromVertPath() : convert array of verts to a shape path made of Segments
  static fromVertPath({ vertPath, refine = true, parentID } = {}) {
    // console.log('vertPath', vertPath)
    let vertCount = vertPath.length
    if (vertCount < 3) { return }
    vertPath = SegPath.loopPath(vertPath)
    // console.log('loopedpath', vertPath)
    let segmentPath = new OpArray
    let previousSeg = undefined
    for (let i = 0; i < vertCount; i++) {
      let seg = protoSegment({ start: vert(vertPath[i]), end: vert(vertPath[i + 1]), parentID: parentID })
      if (refine === true && !!previousSeg && seg.angle === previousSeg.angle) {
        seg = protoSegment({ start: previousSeg.start, end: seg.end, parentID: parentID })
        segmentPath.pop()
      } // combine segments with same angle
      segmentPath.push(seg)
      previousSeg = seg
    }
    return segmentPath
  }
  //METH: refine() : remove colinear segments to simplify seg path to single segments connecting corners
  static refine(segPath, parentID, minCorners = false, grid) {
    let report = false // DEBUG

    let newPath = new OpArray
    let prevSeg = undefined
    let prevMid = undefined
    let length = 1
    let firstID = undefined
    for (let i = 0; i < segPath.length; i++) {
      let seg = segPath[i].copy
      if (report) {
        console.log(`seg`, seg.id)
        console.log(`prevSeg`, prevSeg?.id)
        if (seg.id.includes(`cell097`)) {
          console.error(`seg.hasCubicStartVert`, seg.hasCubicStartVert)
          console.error(`seg.hasCubicEndVert`, seg.hasCubicEndVert)
        }
        if (prevSeg?.id.includes(`cell097`)) {
          console.error(`prevSeg.hasCubicStartVert`, prevSeg.hasCubicStartVert)
          console.error(`prevSeg.hasCubicEndVert`, prevSeg.hasCubicEndVert)
        }
      }
      //FIXME: RECONFIGURE LOOP TO RUN INIT DIRECTION EQUALITY CHECK ON FINAL SEG. 
      //FIXME: Current bug prevents last->first connection of colinear segments
      //FIXME: This might also be fixed by repairing the bug that starts interior shapes with left-most segment
      //FIXME: FIX BOTH!!! As both will create separate edgecases
      if (!!prevSeg && seg.direction.equals(prevSeg.direction)) { // if two segments are in line/flat
        if (report) {
          console.log(`seg`, seg.id)
          console.log(`prevSeg`, prevSeg.id)
        }

        if (length === 1) {
          // startNeighbor = 
          firstID = prevSeg.id
          if (minCorners) { prevSeg.assignMid() }
        }
        length += 1
        if (minCorners) { prevMid = seg.mid }
        const prevIDs = OpArray.from(prevSeg.islandIDs)
        const segIDs = OpArray.from(seg.islandIDs)
        // console.log(`prevIDs`, prevIDs)
        // console.log(`segIDs`, segIDs)
        const idArray = prevIDs.union(segIDs)
        // console.log(`idArray`, idArray)
        const islandIDs = new Set(idArray)
        const id = `${parentID}-${length}${seg.direction.name}-${firstID}-to-${seg.id}`
        let newSeg = protoSegment({
          start: prevSeg.start,
          end: seg.end,
          parentID: parentID,
          id: id,
          islandIDs: islandIDs,
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

    return newPath
  }

  //METH: loopPath() : loopPath closes a shape path loop made of either segments or vertices
  static loopPath(verts = simpleSquare) {
    let origin = verts[0]
    let last = verts[verts.length - 1]
    if (origin !== last) {
      let closer
      if (origin instanceof Segment) {
        // closer = segment({ start: last, end: origin })
        closer = new Segment({ start: last, end: origin })
      } else if (typeof origin[0] === 'number') {
        // print('has number')
        closer = origin
      }
      verts.push(closer)
    }
    return verts
  }
}

//CLASS: VertPath
// SIZE: 80 lines
class VertPath {
  //METH: fromSegPath()
  static fromSegPath(segPath) {
    return segPath.map(seg => [seg.start.x, seg.start.y])
  }
  //METH: fromSVGPath() : extract comma separated vert coordinates from an SVG path to array
  static fromSVGPath(path = '') {
    let reg = /-?\d+(?:\.\d+)*[,]-?\d+(?:\.\d+)*/
    let result = matchAll(path, reg)
    // print(result)
    return result
  }
  //TODO: rewrite to work with svgElements instead of htmlElements
  // METH: drawPoints() : draw index labeled points at verts 
  static drawPoints({ verts, parent, size = 5, offset = vert(0), color = '#F80', indices = true } = {}) {
    let centerOffset = size / 2
    let divs = []
    verts.forEach((e, i) => {
      if (!indices) { i = '' }
      let div = createDiv(i)
      let coord = VertPath.toCoord(e)
      // print(coord)
      div
        .attribute('index', i)
        .attribute('x', coord[0].toFixed())
        .attribute('y', coord[1].toFixed())
        .position(coord[0] - centerOffset + offset.x, coord[1] - centerOffset + offset.y)
        .size(size, size)
        .style(CS.backgroundColor, color)
        .style(CS.borderRadius, '50%')
        .style(CS.textAlign, 'center')
        .style(CS.fontSize, `${(size * 1.5)}pt`)
        .style(CS.lineHeight, `${size * 4}px`)
        .parent(parent)
        .mouseOver(showCoords)
        .mouseOut(showIndex)
      divs.push(div)
      // print(i, e)
    })
    // print(divs)
    return divs

    function showCoords() {
      // print('scrolled over')
      const i = this.attribute('index')
      const x = this.attribute('x')
      const y = this.attribute('y')
      let text = `${i}\n(${x},${y})`
      this.html(text)
      redrawAll()
    }
    function showIndex() {
      this.html(this.attribute('index'))
      redrawAll()
    }
  }
  // METH: toCoordinate() : extract x and y from single comma separated vert string
  static toCoord(vertPairString) {
    let reg = /-?\d+(?:\.\d+)*/
    let result = matchAll(vertPairString, reg)
      .flatMap(e => Number(e))
    // print('extractCoord()')
    // print(result)
    return result
  }
  //TODO: reverse engineer and find where this belongs
  // NOTE: Made with GPT-4 on May 23, 2023
  //NOTE: Intended to help make diagonal lines possible
  //METH: arcControlPoints() : 
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

//CLASS: ProtoSVG
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
      // console.log("Image loaded...")
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(function (blob) {
        // console.log("Blob created...")
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // console.log("Link clicked...")

        URL.revokeObjectURL(url) // Revoke the Blob URL for the PNG
        URL.revokeObjectURL(svgUrl) // Revoke the Blob URL for the SVG
        console.log(`PNG saved`)
      })
    }
  }
}

// MARK: Proto Geometry Classes
// CLASS: Vertex
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

//MARK: CLASS Segment 
// CLASS: Segment 
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

  get lineVector() { return p5.Vector.sub(this.end, this.start) }
  get opposite() { return segment(this.end, this.start) }
  get gridSorted() { return segment(this.vertsArray.gridVertSorted[0], this.vertsArray.gridVertSorted[1]) }

  //TODO: I should be able to revert to instance properties with these
  get start() { return this._start }
  set start(vert) { this._start = vert }
  get end() { return this._end }
  set end(vert) { this._end = vert }

  get vertsArray() { return OpArray.from([this.start, this.end]) }

  get x() { return this.start.x }
  get y() { return this.start.y }

  get mid() { return this.pointOnsegment(0.5) }

  //MEMO: angle
  get angle() {
    return memoize(() => {
      return this.lineVector.heading()
    }, `angle`).call(this)
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
  vertIsInBounds(vert, accuracy = 4) {
    const x = roundToDec(vert.x, accuracy)
    const y = roundToDec(vert.y, accuracy)
    return x >= roundToDec(this.xMin, accuracy)
      && x <= roundToDec(this.xMax, accuracy)
      && y >= roundToDec(this.yMin, accuracy)
      && y <= roundToDec(this.yMax, accuracy)
  }
  //METH: vertIsOnLine()
  //NOTE: made with ChatGPT4.0 on Jan14, 2024
  vertIsOnLine(vert, includeEnds = true, decimal = 0) {
    if (!includeEnds) {
      if (vert.equals(this.start, decimal) || vert.equals(this.end, decimal)) {
        return false
      }
    }

    // Check if vert is within the bounding box of the segment
    if (!this.vertIsInBounds(vert)) {
      // console.log(`vertIsOnLine vert is not in bounds`)
      // console.log(`seg`, this)
      // console.log(`vert`, vert)
      return false // The point is outside the segment's bounding box
    }

    // Calculate the t parameter using linear interpolation
    const t = this.lineVector.dot(Vertex.sub(vert, this.start)) / this.lineVector.magSq()
    // Check if t is within the range [0, 1]
    if (t < 0 || t > 1) {
      // console.log(`vertIsOnLine failed t param test`)
      return false // The point does not lie within the segment
    }
    // return true

    // Calculate the projected point on the line
    const projectedPoint = Vertex.add(this.start, Vertex.mult(this.lineVector, t))
    // Check if the vert is close enough to the projected point (considering a small threshold for precision issues)
    const threshold = 0.01 // Adjust this threshold based on your precision needs
    return vert.dist(projectedPoint) < threshold
  }
  //METH: isParallelTo()
  // isParallelTo(seg) { return this.direction.andOpposites.equals(seg.direction.andOpposites) }
  isParallelTo(seg, accuracy = 4) {
    // console.log(`this.lineVector`, this.lineVector)
    // console.log(`seg`, seg)
    // console.log(`seg.lineVector`, seg.lineVector)
    const precise = Vertex.cross(this.lineVector, seg.lineVector).z
    // console.log(`precise`, precise)
    return abs(roundToDec(precise, accuracy)) === 0    // MUCH FASTER!!!
  }
  //METH: isColinearWith()
  isColinearWith(seg) { return this.isOverlappingWith({ seg: seg, infinite: true }) }
  //METH: isOverlappingWith()
  isOverlappingWith({ seg, includeEnds = true, decimal = 0, mode = 2, infinite = false } = {}) {
    if (!this.isParallelTo(seg)) {
      // console.warn(`isOverlappingWith is not parallel`)
      return false
    }                         // false if not parallel

    if (infinite) {
      // Check for collinearity by verifying if the vector between one point of this segment
      // and the start of the other segment is orthogonal to the direction vector of this segment
      const connectiveVector = Vertex.sub(seg.start, this.start)
      const cross = abs(roundToDec(Vertex.cross(connectiveVector, this.lineVector).z, 4))
      // console.warn(`isOverlappingWith ${seg.id}, crossProduct: ${cross}`)
      return cross === 0
    }

    const sameDir = this.direction.equals(seg.direction)
    const isExactOverlap = sameDir ? this.start.equals(seg.start, 0) && this.end.equals(seg.end, 0)
      : this.start.equals(seg.end, 0) && this.end.equals(seg.start, 0)
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

  //METH: intersectionWith()
  //NOTE: made with ChatGPT4.0 on Jan12, 2024
  intersectionWith(seg, infinite = false) {
    const p = this.start
    const q = seg.start
    const r = this.lineVector
    const s = seg.lineVector

    if (this.isParallelTo(seg)) {                                                   // check for parallelism
      // console.warn(`yes isParallel`)
      if (this.isOverlappingWith({ seg: seg, infinite: infinite })) {                                            // check for overlapping
        // console.warn(`yes isOverlapping`)
        const starts = OpArray.format([this.gridSorted.start, seg.gridSorted.start])  // gridSorted point same way
        const ends = OpArray.format([this.gridSorted.end, seg.gridSorted.end])        // OpArrays from points
        let overlapStart, overlapEnd
        if (!infinite) {                                                            // get inner overlap
          overlapStart = Vertex.max(starts)
          overlapEnd = Vertex.min(ends)
        } else {                                                                    // get outer overlap
          overlapStart = Vertex.min(starts)
          overlapEnd = Vertex.max(ends)
        }
        if (overlapStart.equals(overlapEnd, 1)) { return overlapStart }
        const overlapSeg = segment(overlapStart, overlapEnd)                        // create overlapSeg
        return overlapSeg.direction.equals(this.direction) ? overlapSeg : overlapSeg.opposite // align to this direction
      }
      return                                                              // No overlap, or parallel but not collinear
    }
    const crossZ = Vertex.cross(r, s).z
    const t = Vertex.cross(Vertex.sub(q, p), s).z / crossZ  // intersection t value for this seg
    const u = Vertex.cross(Vertex.sub(q, p), r).z / crossZ  // intersection u value for other seg

    if (!infinite &&                                          // check if intersection points are on both segs
      (t < 0 || t > 1                                         // intersection point is not on the first segment
        || u < 0 || u > 1)                                    // intersection point is not on the second segment
    ) { return }

    const intersect = Vertex.add(p, Vertex.mult(r, t))                    // calculated intersection point
    intersect.roundCoordsToDec()
    return intersect
    // return segment(vert(roundToDec()))
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

//MARK: CLASS ProtoSegment
// CLASS: ProtoSegment
// SIZE: 356 lines
function protoSegment({ start, end, parentID, id, islandIDs, cubicVerts, neighbors, grid, maxCubicVerts } = {}) {
  return new ProtoSegment(start, end, parentID, id, islandIDs, cubicVerts, neighbors, grid, maxCubicVerts)
}

class ProtoSegment extends Segment {
  id
  parentID
  islandIDs
  taken = false
  grid

  cubicVerts = { start: undefined, end: undefined }
  maxCubicVerts = { start: undefined, end: undefined }
  neighbors = { start: undefined, end: undefined }

  constructor(start, end, parentID, id, islandIDs, cubicVerts, neighbors, grid = GRID, maxCubicVerts) {
    super(start, end)
    this.parentID = parentID
    this.islandIDs = islandIDs
    this.id = id
    this.grid = grid
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

  // get cornerRadii() {
  //   let radii = { start: undefined, end: undefined }
  //   if (this.hasNoCubicVerts && this.hasNoMaxVerts) { return radii }
  //   if (this.hasCompleteStartCorner) { radii.start = this.availableStartLength }
  //   if (this.hasCompleteEndCorner) { radii.end = this.availableEndLength }
  //   return radii
  // }
  // get startCornerRadius() { return this.cornerRadii.start }
  // get endCornerRadius() { return this.cornerRadii.end }

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

  get hasCubicStartCorner() {
    return this.startNeighbor.hasCubicEndVert && this.hasCubicStartVert
      && roundToDec(this.startNeighbor.availableEndLength) === roundToDec(this.availableStartLength)
  }
  get hasCubicEndCorner() {
    return this.hasCubicEndVert && this.endNeighbor.hasCubicStartVert
      && roundToDec(this.availableEndLength) === roundToDec(this.endNeighbor.availableStartLength)
  }
  get hasBothCubicCorners() { return this.hasCubicStartCorner && this.hasCubicEndCorner }

  get finalCubicStartVert() {
    // if (!this._finalCubicStartVert) {
    //   const finalLength = min(this.availableStartLength, this.startNeighbor.availableEndLength)
    //   this._finalCubicStartVert = this.distancedStartPoint(finalLength)
    // }
    // return this._finalCubicStartVert
    const finalLength = min(this.availableStartLength, this.startNeighbor.availableEndLength)
    return this.distancedStartPoint(finalLength)
  }
  get finalCubicEndVert() {
    // if (!this._finalCubicEndVert) {
    //   const finalLength = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    //   this._finalCubicEndVert = this.distancedStartPoint(finalLength)
    // }
    // return this._finalCubicEndVert
    const finalLength = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    return this.distancedEndPoint(finalLength)
  }

  #availableLength(start = true) {
    if (!this.cornerVerts?.start || !this.cornerVerts?.end) {// needs to have cornerVerts to calculate
      console.warn(`cannot calculate available length without cornerVerts`)
      return
    }
    if (this.hasNoCubicVerts) { return this.length / 2 } // assume half of entire length available
    // if (this.hasNoCubicVerts) { return this.length } // assume entire length available
    else {
      let startLength, endLength
      if (this.hasCubicStartVert) {
        startLength = this.start.dist(this.cubicVerts.start)
        // console.log(`availableLength: startLength: ${startLength}, maxStartLength: ${this.maxCubicStartLength} `)
        if (roundToDec(this.maxCubicStartLength) < roundToDec(startLength)) {
          startLength = this.maxCubicStartLength
        }
        // if (roundToDec(startLength, 1) < roundToDec(this.cellRadius, 1)) {
        //   console.warn(`startLength is less than cellRadius!!!`)
        // }
      }
      if (this.hasCubicEndVert) {
        endLength = this.end.dist(this.cubicVerts.end)
        // console.log(`availableLength: endLength: ${endLength}, maxEndLength: ${this.maxCubicEndLength} `)
        if (roundToDec(this.maxCubicEndLength) < roundToDec(endLength)) {
          endLength = this.maxCubicEndLength
        }
        // if (roundToDec(endLength, 1) < roundToDec(this.cellRadius, 1)) {
        //   console.warn(`endLength is less than cellRadius!!!`)
        // }
      }
      if (startLength && endLength) { // this.hasBothCubicVerts
        if (approxToDec(startLength, 2, 1) + approxToDec(endLength, 2, 1) > approxToDec(this.length, 2, 2)) {
          // usually only occurs in a stair segment wrapped from both sides
          if (this.isStair) { // always reduce the outside corner (turn === R)
            if (this.isStairIn) { // isStairIn (turns === RL)
              startLength = this.length - endLength // reduce start corner
            } else { // isStairOut (turns === LR)
              endLength = this.length - startLength // reduce end corner
            }
          } else { // segment is UTurn
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
      } else { // segment only has one cubicVert
        if (startLength) { // only has cubicStartVert
          endLength = this.length - startLength
        } else { // only has cubicEndVert
          startLength = this.length - endLength
        }
      }
      if (start) {
        return startLength
      } else {
        return endLength
      }
    }
  }

  get availableStartLength() {
    // if (this._availableStartLength === undefined) {
    //   this._availableStartLength = this.#availableLength()
    // }
    // return this._availableStartLength
    return this.#availableLength()
  }
  get availableEndLength() {
    // if (this._availableEndLength === undefined) {
    //   this._availableEndLength = this.#availableLength(false)
    // }
    // return this._availableEndLength
    return this.#availableLength(false)
  }
  get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

  //MARK: Cubic Vert methods
  assignMid() {
    this.addCubicStartVert(this.mid)
    this.addCubicEndVert(this.mid)
  }

  addCubicStartVert(vert, radiant = true, replace = false) { this.#addCubicVert(vert, true, !radiant, replace) }
  addCubicEndVert(vert, radiant = true, replace = false) { this.#addCubicVert(vert, false, !radiant, replace) }

  // addBothCubicVerts(vert) {
  //   this.addCubicStartVert(vert)
  //   this.addCubicEndVert(vert)
  // }
  addDistancedCubicStartVert(distance, radiant = true, replace = false) {
    this.addCubicStartVert(this.distancedStartPoint(distance), radiant, replace)
  }
  addDistancedCubicEndVert(distance, radiant = true, replace = false) {
    this.addCubicEndVert(this.distancedEndPoint(distance), radiant, replace)
  }

  addDistancedStartCornerVerts(distance, radiant = true, replace = false) {
    this.neighbors.start.addDistancedCubicEndVert(distance, radiant, replace)
    this.addDistancedCubicStartVert(distance, radiant, replace)
  }
  addDistancedEndCornerVerts(distance, radiant = true, replace = false) {
    this.addDistancedCubicEndVert(distance, radiant, replace)
    this.neighbors.end.addDistancedCubicStartVert(distance, radiant, replace)
  }
  addBothDistancedCornerVerts(distance, radiant = true, replace = false) {
    this.addDistancedStartCornerVerts(distance, radiant, replace)
    this.addDistancedEndCornerVerts(distance, radiant, replace)
  }

  removeCubicStartVert() { this.#removeCubicVert() }
  removeCubicEndVert() { this.#removeCubicVert(false) }

  removeStartCornerVerts() {
    this.removeCubicStartVert()
    this.neighbors.start.removeCubicEndVert()
  }
  removeEndCornerVerts() {
    this.removeCubicEndVert()
    this.neighbors.end.removeCubicStartVert()
  }

  replaceCubicStartVert(vert) { this.#replaceCubicVert(vert) }
  replaceCubicEndVert(vert) { this.#replaceCubicVert(vert, false) }

  matchStartCorner() {
    const startMin = min(this.availableStartLength, this.startNeighbor.availableEndLength)
    this.addDistancedStartCornerVerts(startMin)
  }
  matchEndCorner() {
    const endMin = min(this.availableEndLength, this.endNeighbor.availableStartLength)
    this.addDistancedEndCornerVerts(endMin)
  }
  matchCorners() {
    this.matchStartCorner()
    this.matchEndCorner()
  }
  //METH: #addCubicVert()
  #addCubicVert(vert, start, max = false, replace = false) {
    // let report = false
    const mode = start ? 'Start' : `End`
    // if (
    //   this.id.includes('cell097')
    //   || this.id.includes('cell090')
    //   || this.id.includes('cell096')
    // ) { report = true }
    // if (report) {
    //   console.warn(`addCubic${mode}Vert: ${vert?.string}`, this)
    //   console.log(`hasCubicStartVert: ${this.hasCubicStartVert}`)
    //   if (this.availableStartLength) { console.log(`availableStartLength: ${this.availableStartLength}`) }
    //   console.log(`hasCubicEndVert: ${this.hasCubicEndVert}`)
    //   if (this.availableEndLength) { console.log(`availableEndLength: ${this.availableEndLength}`) }
    // }
    let cubicVert
    if (!max) {
      cubicVert = start ? this.cubicVerts.start : this.cubicVerts.end
    } else {
      cubicVert = start ? this.maxCubicVerts.start : this.maxCubicVerts.end
    }
    if (vert instanceof Vertex) {
      if (!this.vertIsOnLine(vert)) {
        console.error(`trying to assign a cubicVert that is not on this segment`)
        console.log(`off-line vert`, vert)
        console.log(`this.segment`, info(this))
        return
      }
      if (cubicVert && !replace) {
        const terminus = start ? this.start : this.end
        if (vert.dist(terminus) >= cubicVert.dist(terminus)) { return }
      }
      if (!max) {
        if (start) {
          this.cubicVerts.start = vert
        } else {
          this.cubicVerts.end = vert
        }
      } else {
        if (start) {
          this.maxCubicVerts.start = vert
        } else {
          this.maxCubicVerts.end = vert
        }
      }
      this.#resetMemoProps()
      // if (report) {
      //   console.log(`this.cubicStartVert: ${this.cubicVerts.start?.string}`)
      //   console.log(`this.cubicEndVert: ${this.cubicVerts.end?.string}`)
      //   console.log(`new available${mode}Length:`, start ? this.availableStartLength : this.availableEndLength)
      // }
    }
  }
  //METH: #removeCubicVert()
  #removeCubicVert(start = true, max = false) {
    if (max === false) {
      if (start) { this.cubicVerts.start = undefined } else { this.cubicVerts.end = undefined }
    } else {
      if (start) { this.maxCubicVerts.start = undefined } else { this.maxCubicVerts.end = undefined }
    }
    this.#resetMemoProps()
  }
  //METH: #replaceCubicVert()
  #replaceCubicVert(vert, start = true, max = false) {
    this.#addCubicVert(vert, start, max, true)
  }
  //METH: #resetMemoProps()
  #resetMemoProps(andNeighbors = true) {
    const segs = andNeighbors ? this.andNeighborsArray : [this]
    segs.forEach(s => {
      resetMemoized(s,
        `adjacentWrapperObjs`,
        `arcCenterTangent`,
        `arcCenterMidPointTangent`,
        `arcCenterVert`,
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
    const length = this.hasMaxStartVert ? this.start.dist(this.maxCubicVerts.start) : this.maxCubicLength
    return length
  }
  get maxCubicEndLength() {
    const length = this.hasMaxEndVert ? this.end.dist(this.maxCubicVerts.end) : this.maxCubicLength
    return length
  }

  get maxCubicLength() { return this.length - this.cellRadius }

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
  addMaxStartVert(vert, replace = false) { this.#addCubicVert(vert, true, true, replace) }
  addMaxEndVert(vert, replace = false) { this.#addCubicVert(vert, false, true, replace) }
  // #endregion
  //MARK: Combined Cubic Verts
  // #region Combined Cubic Verts
  get hasAStartVert() { return this.hasMaxStartVert || this.hasCubicStartVert }
  get hasAnEndVert() { return this.hasMaxEndVert || this.hasCubicEndVert }
  get hasArc() { return this.hasAStartVert && this.hasAnEndVert }
  get startVert() { return this.cubicVerts.start || this.maxCubicVerts.start }
  get endVert() { return this.cubicVerts.end || this.maxCubicVerts.end }
  //MEMO: hasCompleteStartCorner
  get hasCompleteStartCorner() {
    return memoize(() => {
      return this.startNeighbor.hasAnEndVert && this.hasAStartVert
        && roundToDec(this.startNeighbor.availableEndLength) === roundToDec(this.availableStartLength)
    }, `hasCompleteStartCorner`).call(this)
  }
  //MEMO: hasCompleteEndCorner
  get hasCompleteEndCorner() {
    return memoize(() => {
      return this.hasAnEndVert && this.endNeighbor.hasAStartVert
        && roundToDec(this.availableEndLength) === roundToDec(this.endNeighbor.availableStartLength)
    }, `hasCompleteEndCorner`).call(this)
  }
  get hasBothCompleteCorners() { return this.hasCompleteStartCorner && this.hasCompleteEndCorner }

  // #endregion
  //MARK: Flatness
  // #region Flatness
  //MEMO: flatAmount
  get flatAmount() {
    return memoize(() => {
      if (this.hasBothCompleteCorners) { return this.startVert.dist(this.endVert) }
    }, `flatAmount`).call(this)
  }
  //MEMO: hasNoFlatness
  get hasNoFlatness() {
    return memoize(() => {
      return roundToDec(this.flatAmount, 1) === 0
    }, `hasNoFlatness`).call(this)

  }
  get hasFlatness() {
    if (this.hasBothCompleteCorners) { return !this.hasNoFlatness }
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
  pointOnArcRotFromStart(deg) {
    return Vertex.add(this.arcOrigin, this.arcOriginToStart.lineVector.rotate(deg))
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
      return Vertex.add(this.arcStartCorner, segment(this.arcNormalCorner, this.arcEndCorner).lineVector)
    }, `arcOrigin`).call(this)
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
    return memoize(() => {
      const vect = this.arcNormalDirection.toRight.vector.setMag(this.arcRadius)
      const start = this.arcOriginToArcCenter.mid
      const end = Vertex.add(vect, start)
      const seg = segment(start, end)
      // console.warn(`arcCenterMidPointTangent result`, seg)
      return seg
    }, `arcCenterMidPointTangent`).call(this)
  }

  get hasMinArcRadius() { return roundToDec(this.maxArcRadius, 0) === roundToDec(this.cellRadius, 0) }

  // arcIsWithinArc(thisArc, thatArc) {
  //   return boundsIsWithinTestBounds(thisBounds, segBounds)
  // }
  //METH: arcIsWithinThisArc()
  arcIsWithinThisArc(arcSeg) {
    const thisBounds = this.minArcBoundsSeg
    const segBounds = arcSeg instanceof ProtoSegment ? arcSeg.maxArcBoundsSeg : arcSeg
    // console.log(`arcIsWithinThisArc`, this)
    // console.log(`arcIsWithinThisArc`, arcSeg)
    // console.log(`arcIsWithinThisArc thisBounds`, thisBounds)
    // console.log(`arcIsWithinThisArc thisBounds`, thisBounds)
    const result = boundsIsWithinTestBounds(thisBounds, segBounds)
    // console.log(`arcIsWithinThisArc result`, result)
    return result
  }
  //METH: arcWrappedWithinThisArc()
  arcShouldWrapOutToArc(arcSeg) {
    return this.arcIsWithinThisArc(arcSeg) && this.hasSameFacingCorner(arcSeg)
  }
  // arcIsRadiantToArc(arcSeg) {
  //   return this.arcShouldWrapOutToArc(arcSeg) && this.arcOrigin.equals(arcSeg.arcOriginCorner, 1)
  // }

  //MARK: Max and Min Possible Arcs 
  //MEMO: maxArcRadius
  get maxArcRadius() {
    return memoize(() => {
      return approxToDec(min(this.maxCubicEndLength, this.endNeighbor.maxCubicEndLength), 4, 2)
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

  // get maxArcOriginToCenter() { return segment(this.maxArcOrigin, )}
  //MEMO: maxArcBoundsSeg
  get maxArcBoundsSeg() {
    return memoize(() => {
      return segment(this.maxArcOrigin, this.arcNormalCorner)
    }, `maxArcBoundsSeg`).call(this)
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
  //MEMO: minToMaxArcOriginSeg
  get minToMaxArcOriginSeg() {
    return memoize(() => {
      return segment(this.minArcOrigin, this.maxArcOrigin)
    }, `minToMaxArcOriginSeg`).call(this)
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

  //METH: hasSameFacingCorner()
  hasSameFacingCorner(seg) { return this.endCorner.equals(seg.endCorner) }
  //METH: isDiagonalCorner()
  hasDiagonalCorner(seg) {
    return this.hasSameFacingCorner(seg) && this.maxArcBoundsSeg.isColinearWith(seg.maxArcBoundsSeg)
  }

  //MARK: COLINEAR WRAPPING
  //MEMO: closeWrappers
  get closeWrappers() {
    return memoize(() => {
      const closest = (segs, start = false) => {
        const name = start !== this.isOutsideCorner ? `arcStartCorner` : `arcEndCorner`              // choose arcCorner that's colinear 
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
    }, `closeWrappers`).call(this)
  }
  get closestWrappper() {
    // if (!this.isOutsideCorner) {
    const { start, end } = this.closeWrappers
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
    // }
  }
  //MEMO: colinearWrapper
  get colinearWrapper() {
    return memoize(() => {
      // const start = this.closeWrappers.start?.seg
      // const end = this.closeWrappers.end?.seg
      const { start, end } = this.closeWrappers
      if (start && end) {
        if (start.seg.equals(end.seg) && start.seg.end.equals(this.end, 0)) {
          return start.seg
        }
        // if (start.dist <= end.dist) {
        //   return start.seg
        // } else {
        //   return end.seg
        // }
      } else if (start) {
        // return start.seg
      } else if (end) {
        // return end.seg
      }
    }, `colinearWrapper`).call(this)
  }
  // get colinearWrapper() {
  //   return memoize(() => {
  //     // const turnDir = this.isOutsideCorner ? `isLeft` : `isRight`        // overlap wraps run opposite, UNUSED
  //     const startWraps = this.overlapSegs                                   // start with segs overlapping this seg
  //       .filter(s =>
  //         s.start.equals(this.end, 0)                                       // overlap wraps share a corner point
  //         // && s.turns.start[turnDir]                                      // UNUSED, below is simplified equivalent
  //         && this.hasSameFacingCorner(s.startNeighbor)                  // overlap wraps share corner direction
  //         && this.endNeighbor.isOverlappingWith({seg:s.startNeighbor})            // neighbors must also overlap
  //       )
  //     if (startWraps.length === 1) { return startWraps[0].startNeighbor }   // startWrap.startNeighbor is the corner seg
  //   }, `colinearWrapper`).call(this)
  // }

  get colOutWrapper() { if (this.isOutsideCorner) { return this.colinearWrapper || this.closestWrappper } }
  get colInWrapper() { if (!this.isOutsideCorner) { return this.colinearWrapper || this.closestWrappper } }




  //MARK: ADJACENT WRAPPING
  //METH: minAdjWrapperDistanceObj()
  minAdjWrapperDistanceObj(seg) {
    const out = this.isOutsideCorner
    const outWrap = out ? this : seg
    const inWrap = !out ? this : seg

    const tangentIntersect = inWrap.arcCenterMidPointTangent.intersectionWith(outWrap, true)
    const tangDist = tangentIntersect.dist(outWrap.end)

    let startDist = inWrap.direction.allAreVertical ?
      inWrap.start.x - outWrap.endNeighbor.start.x
      : inWrap.start.y - outWrap.endNeighbor.start.y
    startDist = abs(roundToDec(startDist), 1)
    let endDist = inWrap.endNeighbor.direction.allAreVertical ?
      inWrap.endNeighbor.start.x - outWrap.start.x
      : inWrap.endNeighbor.start.y - outWrap.start.y
    endDist = abs(roundToDec(endDist), 1)

    const startObj = { seg: seg, tangDist: tangDist, dist: startDist, isStart: true }
    const endObj = { seg: seg, tangDist: tangDist, dist: endDist, isStart: false }
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
    const isOutWrap = this.isOutsideCorner
    const outWrapper = isOutWrap ? this : seg
    const inWrapper = !isOutWrap ? this : seg
    // console.warn(`adjWrapperIntersectObj`)
    // console.log(`seg`, seg)
    // console.log(`dist`, dist)
    // console.log(`isStart`, isStart)
    // console.log(`outWrapper`, outWrapper)
    // console.log(`inWrapper`, inWrapper)
    const intersect = isStart ?
      inWrapper.arcStartToShapeBoundsEdgeSeg.intersectionWith(outWrapper.endNeighbor, true)
      : inWrapper.arcEndToShapeBoundsEdgeSeg.intersectionWith(outWrapper, true)
    const distToCorner = roundToDec(intersect.dist(outWrapper.arcNormalCorner))

    // console.log(`intersect`, intersect)
    // console.log(`distToCorner`, distToCorner)
    return { seg: seg, dist: distToCorner, intersect: intersect, isStart: isStart }
  }
  //MEMO: adjacentWrapperObjs
  //TODO: remove adjDistanceWraps creation once stable
  get adjacentWrapperObjs() {
    // if (this.id.includes('cell019')) {
    //   console.warn(`processing cell199`)
    // }
    return memoize(() => {
      const outside = !this.isOutsideCorner             // opposite isOutsideCorner value of this
      const canHaveCorrectSize = (seg) => {                  // this radius should be either larger or smaller than adjWrap
        // if (this.arcRadius && seg.arcRadius) {
        // console.warn(`adjacentWrapperObjs isOutsideCorner`, this.isOutsideCorner)
        // console.warn(`adjacentWrapperObjs: ${this.id}, ${seg.id}`)
        // console.warn(`adjacentWrapperObjs current radii: ${this.arcRadius}, ${seg.arcRadius}`)
        // console.warn(`adjacentWrapperObjs max radii: ${this.maxArcRadius}, ${seg.maxArcRadius}`)
        return this.isOutsideCorner ?
          this.maxArcRadius > this.cellRadius   // bigger when this is OutsideCorner
          : this.cellRadius < seg.maxArcRadius  // smaller when this is InsideCorner
        // }
        // return true
      }
      let adjWraps = this.inShapeSameFacingCorners
        .filter(s =>
          s.isOutsideCorner === outside                 // is opposite?
          && (this.arcIsWithinThisArc(s) || s.arcIsWithinThisArc(this))
          && canHaveCorrectSize(s)                           // canHaveCorrectSize? 
        )
        .map(s => this.minAdjWrapperDistanceObj(s)).flat()
        .sort((a, b) => a.dist - b.dist)
        .sort((a, b) => a.tangDist - b.tangDist)
      // console.log(`adjWraps before`, adjWraps)
      this.adjDistanceWrappers = adjWraps

      adjWraps = adjWraps
        .filter(obj => obj.tangDist === adjWraps[0].tangDist)
        .filter(obj => obj.dist === adjWraps[0].dist)
        .map(obj => this.adjWrapperIntersectObj(obj))
        .sort((a, b) => a.dist - b.dist)
      // console.log(`adjWraps`, adjWraps)
      return adjWraps
    }, `adjacentWrapperObjs`).call(this)
  }
  // get allAdjWrappers() { return this.adjacentWrapperObjs.map(obj => obj.seg) }
  get finalAdjWrapperObjs() {
    // return memoize(() => {
    return this.adjacentWrapperObjs
      .filter(obj => obj.dist === this.adjacentWrapperObjs[0].dist)
      .sort((a, b) => b.isStart - a.isStart)
    // }, `finalAdjWrapperObjs`).call(this)
  }
  get finalAdjWrappers() { return this.finalAdjWrapperObjs.map(obj => obj.seg) }
  get intendedArcRadius() {
    if (this.isOutsideCorner && this.adjInWrapper) { return this.adjInWrapper.finalAdjWrapperObjs.map(obj => obj.dist)[0] }
  }
  //MEMO: adjacentWrapper
  get adjacentWrapper() {
    return memoize(() => {
      return this.finalAdjWrappers[0]
    }, `adjacentWrapper`).call(this)
  }

  get adjOutWrapper() { if (!this.isOutsideCorner) { return this.adjacentWrapper } }
  get adjInWrapper() { if (this.isOutsideCorner) { return this.adjacentWrapper } }

  //MARK: IN/OUT WRAPPING
  get canWrapOut() { return this.canWrap() }
  get canWrapIn() { return this.canWrap(false) }
  //METH: canWrap() : (end)corner can transfer it's cubicVerts to colWrapper to tighten wrap
  canWrap(out = true) {
    let wrapper
    if (this.colinearWrapper) {
      wrapper = out ? this.colOutWrapper : this.colInWrapper
      if (wrapper) {
        return wrapper.endNeighbor.vertIsOnLine(this.finalCubicEndVert, false)
          && wrapper.vertIsOnLine(this.endNeighbor.finalCubicStartVert, false)
      }
    }
    if (this.adjacentWrapper) {
      wrapper = out ? this.adjOutWrapper : this.adjInWrapper
      if (wrapper) {
        const [startVert, endVert] = this.finalAdjWrapperObjs.map(obj => obj.intersect)
        // return wrapper.endNeighbor.vertIsOnLine(startVert, false) ||

        // const objs = this.finalAdjWrapperObjs

        return true
      }
    }
    return false
  }

  //METH: colWrap() :
  colWrap(out = true, radiant = true, replace = true) {
    if (this.canWrap(out)) {
      this.colOutWrapper.addCubicEndVert(this.endNeighbor.finalCubicStartVert, radiant, replace)
      this.colOutWrapper.endNeighbor.addCubicStartVert(this.finalCubicEndVert, radiant, replace)
    }
  }

  get outWrapper() { return this.isOutsideCorner ? this.colOutWrapper : this.adjOutWrapper }
  get inWrapper() { return this.isOutsideCorner ? this.adjInWrapper : this.colInWrapper }
  //MEMO: outWrappers
  get outWrappers() {
    return memoize(() => {
      if (this.outWrapper) { return OpArray.format(this.outWrapper).union(this.outWrapper.outWrappers, `id`) }
    }, `outWrappers`).call(this)
  }
  //MEMO: radiantOutWrappers
  get radiantOutWrappers() {
    return memoize(() => {
      if (this.outWrappers) {
        if (this.isInnerMostWrapper) {
          return this.outWrappers
            .filter(s => boundsIsWithinTestBounds(this.minArcBoundsSeg, s.maxArcBoundsSeg))
        } else {
          return this.innerMostWrapper.radiantOutWrappers.intersect(this.outWrappers, `id`)
        }
      }
    }, `radiantOutWrappers`).call(this)
  }
  //MEMO: inWrappers
  get inWrappers() {
    // console.log(`MEMOIZED inWrappers `, this.id)
    // if (this.inwrapper) { console.log(this.inWrapper) }
    return memoize(() => {
      // console.error(`MEMOIZING inWrappers `, this.id)
      if (this.inWrapper) {
        // if (this.inWrapper.inWrappers?.some(seg => seg.id === this.inWrapper.id)) {
        //   return this.inWrappers
        // }
        return OpArray.format(this.inWrapper).union(this.inWrapper.inWrappers, `id`)
        // console.log(`WRAPS`, wraps)
        // return wraps
      }
    }, `inWrappers`).call(this)
  }
  //MEMO: radiantInWrappers
  get radiantInWrappers() {
    return memoize(() => {
      if (this.inWrappers) {
        if (this.isOuterMostWrapper) {
          return this.inWrappers
            .filter(s => boundsIsWithinTestBounds(s.minArcBoundsSeg, this.maxArcBoundsSeg))
        } else {
          return this.outerMostWrapper.radiantInWrappers.intersect(this.inWrappers, `id`)
        }
      }
    }, `radiantInWrappers`).call(this)
  }


  get hasWrappers() { return !!this.inWrappers || !!this.outWrappers }
  get isInnerMostWrapper() { return !!this.outWrappers && !this.inWrappers }
  get isInnerMostRadiantWrapper() { return !!this.radiantOutWrappers && !this.radiantInWrappers }

  get innerMostWrapper() { if (this.inWrappers) { return this.inWrappers.filter(s => s.isInnerMostWrapper)[0] } }
  get innerMostRadiantWrapper() {
    if (this.inWrappers) {
      if (this.innerMostWrapper.radiantOutWrappers.some(s => s.id === this.id)) {
        return this.innerMostWrapper
      } else {
        return this.inWrappers
          .exclude(this.innerMostWrapper.radiantOutWrappers, `id`)
          .filter(s => boundsIsWithinTestBounds(s.minArcBoundsSeg, this.maxArcBoundsSeg))[0]
      }
    }
  }

  get isOuterMostWrapper() { return !!this.inWrappers && !this.outWrappers }
  get isOuterMostRadiantWrapper() { return !!this.radiantInWrappers && !this.radiantOutWrappers }
  get outerMostWrapper() { if (this.outWrappers) { return this.outWrappers.filter(s => s.isOuterMostWrapper)[0] } }
  get outerMostRadiantWrapper() {
    if (this.outWrappers) {
      if (this.outerMostRadiantWrapper.radiantInWrappers.some(s => s.id === this.id)) {
        return this.outerMostWrapper
      } else {
        return this.outWrappers
          .exclude(this.outerMostWrapper.radiantInWrappers, `id`)
          .filter(s => boundsIsWithinTestBounds(this.minArcBoundsSeg, s.maxArcBoundsSeg))[0]
      }
    }
  }


  get hasLooseCorner() {
    if (this.canCurveMoreAtEnd) {
      return this.hasWrappers ? this.hasLooseWrapper : true
    }
    return false
  }

  get hasLooseAdjWrapper() {
    if (this.intendedArcRadius && this.arcRadius) {
      return roundToDec(this.intendedArcRadius, 0) !== roundToDec(this.arcRadius, 0)
    }
    return false
  }
  get hasLooseColWrapper() {
    if (this.closestWrappper) {
      return !this.arcStartCorner.equals(this.closestWrappper.arcEndCorner, 0)
        && !this.arcEndCorner.equals(this.closestWrappper.arcStartCorner, 0)
    }
    if (this.colinearWrapper) {
      return roundToDec(this.colinearWrapper.arcRadius, 0) !== roundToDec(this.arcRadius, 0)
    }
    // return false
    return this.isOutsideCorner ? false : this.canCurveMoreAtEnd
  }
  get hasLooseWrapper() { return this.hasLooseColWrapper || this.hasLooseAdjWrapper }

  get hasIntersectingWrapper() {
    if (this.isOutsideCorner && this.hasLooseAdjWrapper) {
      return roundToDec(this.intendedArcRadius, 0) < roundToDec(this.arcRadius, 0)
    } else {
      // if (this.outWrapper) { return this.outWrapper.hasIntersectingWrapper }
    }
    return false
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
    return protoSegment({
      start: this.start,
      end: this.end,
      parentID: this.parentID,
      // id: `${this.id}-${copyNumber}`,
      id: `${this.id}`,
      islandIDs: this.islandIDs,
      cubicVerts: this.cubicVerts,
      neighbors: this.neighbors,
    })
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
    // const insetEnd = endMove.add(this.end) // new inset segment end
    const insetEnd = Vertex.add(this.end, endMove) // new inset segment end
    if (insetEnd.x < 0 || insetEnd.y < 0) { console.warn(`created insetEnd with negative values`) }

    const cubicMove = Vertex.mult(this.normals.cubic.moveCoord, offset) // cubicMove vector
    const insetCubicStart = Vertex.add(this.finalCubicStartVert, cubicMove)
    const insetCubicEnd = Vertex.add(this.finalCubicEndVert, cubicMove)
    const insetCubicVerts = { start: insetCubicStart, end: insetCubicEnd } // assign new inset cubicVerts

    let insetMaxVerts
    // if (this.maxCubicVerts.start && this.maxCubicVerts.end) {
    const insetMaxStart = Vertex.add(this.finalMaxStartVert, cubicMove)
    const insetMaxEnd = Vertex.add(this.finalMaxEndVert, cubicMove)
    insetMaxVerts = { start: insetMaxStart, end: insetMaxEnd } // assign new inset cubicVerts
    // }


    const insetCopy = protoSegment({ // new inset segment 
      start: insetStart,
      end: insetEnd,
      parentID: this.id,
      id: `${this.id}-inset(${roundToDec(insetScale.x, 2)})`,
      islandIDs: this.islandIDs,
      cubicVerts: insetCubicVerts,
      maxCubicVerts: insetMaxVerts,
    })

    return insetCopy
  }
  // #endregion
  //MARK: Neighbors 
  // #region Neighbors
  get startNeighbor() { return this.neighbors.start }
  get endNeighbor() { return this.neighbors.end }
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




//TODO: MIGRATE TO TESTMESS
// MARK: Test Shapes
const testPath = `
M 100 100 
L 500 100 
L 500 300 
L 400 400 
L 300 200 
L 300 400 
L 100 300 
L 200 200 
Z
`

const testShapeVerts = [
  [100, 100],
  [500, 100],
  [500, 300],
  [400, 400],
  [300, 200],
  [300, 400],
  [100, 300],
  [200, 200],
  // [100, 100]
]

const testShape2 = [
  [100, 0],
  [350, 0],
  [350, 250],
  [500, 250],
  [500, 500],
  [400, 500],
  [400, 300],
  [325, 300],
  [325, 400],
  [250, 400],
  // [250, 450],
  [100, 250]
]

const testShape2a = [
  // [100, 0],
  [350, 0],
  [350, 250],
  [500, 250],
  [500, 0],
  // [400, 500],
  // [400, 300],
  // [325, 300],
  // [325, 450],
  // [250, 450],
  // [250, 450],
  // [100, 200]
]

const testShape2b = [
  // [100, 0],
  // [350, 0],
  // [350, 250],
  // [500, 250],
  // [500, 500],
  [400, 500],
  [400, 300],
  [325, 300],
  [325, 400],
  [325, 500],
  // [250, 450],
  // [250, 450],
  // [100, 200] 
]

const testShape2c = [
  // [100, 0],
  // [350, 0],
  // [350, 250],
  // [500, 250],
  // [500, 500],
  // [400, 500],
  // [400, 300],
  // [325, 300],
  [325, 400],
  [250, 400],
  [100, 250],
  [100, 500],
  [325, 500],
]

const testShape5 = [
  [100, 0],
  [500, 0],
  [300, 100],
  [400, 300],
  [300, 300],
  [500, 500],
  [200, 400],
  [100, 500],
  [200, 200],
  [100, 300],
  // [100, 100]
]

const testShape5a = [
  // [100, 0],
  [500, 0],
  [300, 100],
  [400, 300],
  [300, 300],
  [500, 500],
  // [200, 400],
  // [100, 500],
  // [200, 200],
  // [100, 300],
  // [100, 100]
]

const testShape5b = [
  // [100, 0],
  // [500, 0],
  // [300, 100],
  // [400, 300],
  // [300, 300],
  [500, 500],
  [200, 400],
  [100, 500],
  // [200, 200],
  // [100, 300],
  // [100, 100]
]

const testShape5c = [
  // [100, 0],
  // [500, 0],
  // [300, 100],
  // [400, 300],
  // [300, 300],
  // [500, 500],
  // [200, 400],
  [100, 500],
  [200, 200],
  [100, 300],
  // [100, 100]
]

const testShape3 = [
  [100, 0],
  [500, 0],
  [500, 500],
  [400, 500],
  [400, 100],
  [100, 100],
  // [200, 400],
  // [100, 500],
  // [200, 200],
  // [100, 300],
  // [100, 100]
]

const testShape4 = [
  // [100, 0],
  [500, 0],
  [500, 500],
  [400, 500],
  [400, 100],
  [100, 100],
  [100, 0],
  // [200, 400],
  // [100, 500],
  // [200, 200],
  // [100, 300],
  // [100, 100]
]

const testSquare = [
  [100, 100],
  [200, 100],
  [300, 100],
  [400, 100],
  [500, 100],
  [500, 300],
  [500, 500],
  [100, 500],
]

const simpleSquare = [
  [100, 100],
  [500, 100],
  [500, 500],
  [100, 500],
]

const simpleSquarePath = `
M 100 100 
L 500 100 
L 500 500 
L 100 500
Z`