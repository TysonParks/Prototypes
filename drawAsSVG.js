
// MARK: Constants
const bezCircleConst = 0.552
const bezCircle45DegConst = 0.265

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

// let watchSeg

//CLASS: SVGPath
class SVGPath {
  //METH: fromProtoSegPath() : convert PrSeg path with cubic verts (finalSubShapes) to a valid SVG path string
  static fromProtoSegPath({ segPath, cornerMin = 0, cornerScale = 1 } = {}) {
    segPath = segPath.copy
    let curves = []
    let start, end, cornerStart, cornerEnd
    let startRadius, startSegment, endRadius, endSegment
    let controlStart, lineStart, lineEnd, controlEnd

    segPath.forEach((seg, i) => {

      if (seg.id.includes(`shp004-4down-cell019-rightSide`)) {
        console.warn(`1 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)
        // console.warn(`current seg`, seg.end.string, seg)
        // watchSeg = seg
        // console.error(`problem segment in fromProtoSegPath`)
        // console.log(`current state`, info(seg))
        // console.warn(`next seg startNeighbor`, info(segPath[i + 1].neighbors.start))
        // console.log(`next seg startNeighbor`, segPath[i + 1].neighbors.start.end, segPath[i + 1].neighbors.start.verts)
        // console.warn(`next seg startNeighbor`, info(segPath[i + 1].neighbors.start))
        // console.warn(`seg.availableEndLength`, seg.availableEndLength)
        // debugger
      }
      if (seg.id.includes(`shp004-4left-cell031-downSide-4down-cell019-rightSide`)) {
        console.error(`Neighbor of problem segment in fromProtoSegPath`)
        console.log(`current state`, info(seg))
      }
      cornerMin = min(cornerMin, seg.length / 2)
      // console.log(`hasCubicStartVert`, seg.hasCubicStartVert)
      // console.log(`availableStartLength`, seg.availableStartLength)
      // console.warn(`2 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)

      startRadius = seg.hasCubicStartVert ? seg.availableStartLength : cornerMin // radius of corner arc
      // console.warn(`3 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)
      // console.log(`availableStartLength`, seg.availableStartLength, seg.length, seg.id)
      lineStart = seg.distancedStartPoint(startRadius * cornerScale) // start point of line connecting corner arcs 
      startSegment = segment(lineStart, seg.start) // control point calculation segment, connects hard corner to mid line
      controlStart = startSegment.pointOnsegment(bezCircleConst)
      // console.warn(`4 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)
      // console.log(`seg.hasCubicEndVert`, seg.hasCubicEndVert)
      endRadius = seg.hasCubicEndVert ? seg.availableEndLength : cornerMin // radius of corner arc
      console.warn(`5 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)
      lineEnd = seg.distancedEndPoint(endRadius * cornerScale) // end point of line connecting corner arcs
      endSegment = segment(lineEnd, seg.end) // control point calculation segment, connects hard corner to middle line
      controlEnd = endSegment.pointOnsegment(bezCircleConst)
      console.warn(`6 current seg - length: ${seg.length}, start: ${seg.start.string}, end:${seg.end.string}`)
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
    // console.log(`start`, start)
    // console.log(`curves`, curves)
    // console.log(`end`, end)

    //FUNC: simplify(curve) : convert each vert into roundedDec coord pair array
    const simplify = (curve) => {
      return curve.map(vert =>
        vert.array.map(coord => roundToDec(coord, 4))
      )
    }

    start = simplify(start)
    curves = curves.map(curve => simplify(curve))
    end = simplify(end)
    // console.log(`  simplified: `)
    // console.log(`start`, start)
    // console.log(`curves`, curves)
    // console.log(`end`, end)

    const startSVG = `M ${end[0]} C ${end[1]}`
    const curvesSVG = curves.map(c => `${c[0]} ${c[1]} L ${c[2]} C ${c[3]} `)
    const endSVG = `${end[0]} ${end[1]} Z`
    const svgPath = `${startSVG} ${curvesSVG} ${endSVG}`
    // console.log(`FINAL svgPath`, svgPath)
    console.warn(`fromProtoSegPath end`)
    return svgPath
  }

  //METH: fromSegPath() : 
  static fromSegPath({ segPath, refine = true, random = false, straightness = 0 } = {}) {
    if (refine) {
      let verts = VertPath.fromSegPath(segPath)
      segPath = SegPath.fromVertPath({ path: verts, refine: true })
    }
    return SVGPath.segPathToRoundSVG({ segPath: segPath, random: random, straightness: straightness })
  }
  //METH: segPathToRoundSVG() : create SVG path from segments with points rounded using (C) bezier curves
  static segPathToRoundSVG(
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

    //FUNC: offset
    const offset = () => random ? R.random_num(0.1, 1.5) : curvature

    //FUNC: makeSegmentCircular
    const makeSegmentCircular = (segment, startLoc = lineStartLoc) => {
      control1 = segment.scaledStartPoint(bezCircleConst, startLoc)
      lineStart = segment.pointOnsegment(startLoc)
      lineEnd = segment.pointOnsegment(lineEndLoc)
      control2 = segment.scaledEndPoint(bezCircleConst, lineEndLoc)
      return [control1, lineStart, lineEnd, control2]
    }

    //FUNC: makePrevSegmentCircular
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
class SegPath {
  // METH: fromVertPath() : convert array of verts to a shape path made of Segments
  static fromVertPath({ path = new OpArray, refine = true, parentID } = {}) {
    // console.log('path', path)
    let vertCount = path.length
    if (vertCount < 3) { return }
    path = SegPath.loopPath(path)
    // console.log('loopedpath', path)
    let segmentPath = new OpArray
    let previousSeg = undefined
    for (let i = 0; i < vertCount; i++) {
      let seg = protoSegment({ start: vert(path[i]), end: vert(path[i + 1]), parentID: parentID })
      if (refine === true && previousSeg !== undefined && seg.angle === previousSeg.angle) {
        seg = protoSegment({ start: previousSeg.start, end: seg.end, parentID: parentID })
        segmentPath.pop()
      } // combine segments with same angle
      segmentPath.push(seg)
      previousSeg = seg
    }
    return segmentPath
  }
  //METH: refine() : remove colinear segments to simplify seg path to single segments connecting corners
  static refine(path = new OpArray, parentID, minCorners = false) {
    let newPath = new OpArray
    let prevSeg = undefined
    let prevMid = undefined
    let length = 1
    let firstID = undefined
    for (let i = 0; i < path.length; i++) {
      let seg = path[i].copy
      if (prevSeg !== undefined && seg.angle === prevSeg.angle) { // if two segments are in line/flat
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
          islandIDs: islandIDs
        })
        // add cubicVerts from prevSeg and seg to newSeg
        newSeg.addCubicStartVert(prevSeg.cubicVerts.start)
        newSeg.addCubicEndVert(prevSeg.cubicVerts.end)
        newSeg.addCubicStartVert(seg.cubicVerts.start)
        newSeg.addCubicEndVert(seg.cubicVerts.end)

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
    // if (x < -1 || y < -1) { console.warn(`x vert with negative value assigned`, this) }
  }

  get id() { return `${this.x.toFixed(1)}, ${this.y.toFixed(1)}` }

  get isZero() { return this.x === 0 && this.y === 0 }
  get string() { return `${roundToDec(this.x, 3)}, ${roundToDec(this.y, 3)}` }
  get array() { return [this.x || 0, this.y || 0] }
  get round() { return vert(round(this.x), round(this.y)) }
  get floor() { return vert(floor(this.x), floor(this.y)) }
  get evenFloor() { return vert((2 * floor(this.x / 2)), (2 * floor(this.y / 2))) }
  get direction() {
    // if 
  }

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

// CLASS: Segment 
function segment(start, end) {
  return new Segment(start, end)
}

class Segment {
  // verts
  // normal
  // start
  // end

  constructor(start, end) {
    this.start = start
    this.end = end
    // this.#assignVerts(start, end, arguments)
  }

  get id() { return `(${this.start.id}) -> (${this.end.id})` }
  get string() { return `[(${this.start.string}), (${this.end.string})]` }

  get lineVector() { return p5.Vector.sub(this.end, this.start) }
  get opposite() { return segment(this.end, this.start) }

  get start() { return this._start }
  set start(vert) { this._start = vert }
  get end() { return this._end }
  set end(vert) { this._end = vert }

  get mid() { return this.pointOnsegment(0.5) }


  get angle() { return this.lineVector.heading() }
  get direction() { return Direction.atAngle(this.angle) }
  get slope() { return this.start.slopeTo(this.end) }
  get length() { return roundToDec(this.lineVector.mag(), 4) }
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

  vertIsInBounds(vert, accuracy = 4) {
    const x = roundToDec(vert.x, accuracy)
    const y = roundToDec(vert.y, accuracy)
    // console.log(`vertIsInBounds vert:`, x, y)
    return x >= roundToDec(this.xMin, accuracy)
      || x <= roundToDec(this.xMax, accuracy)
      || y >= roundToDec(this.yMin, accuracy)
      || y <= roundToDec(this.yMax, accuracy)
  }

  //NOTE: made with ChatGPT4.0 on Jan14, 2024
  vertIsOnLine(vert) {
    // Check if vert is within the bounding box of the segment
    // let minX = min(this.start.x, this.end.x)
    // let maxX = max(this.start.x, this.end.x)
    // let minY = min(this.start.y, this.end.y)
    // let maxY = max(this.start.y, this.end.y)

    if (!this.vertIsInBounds(vert)) {
      console.log(`vertIsOnLine vert is not in bounds`)
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
    return p5.Vector.dist(vert, projectedPoint) < threshold
  }

  //TODO: Finish Implementation
  // isColinearWith(seg) {

  //   if (this.direction.andOpposites.equals(seg.direction.andOpposites)) {

  //   }
  //   return false
  // }

  isOverlappingWith(seg) { return this.vertIsOnLine(seg.start) || this.vertIsOnLine(seg.end) }

  //NOTE: made with ChatGPT4.0 on Jan12, 2024
  intersectionWith(seg) {
    // Direction vectors
    const p = this.start
    const q = seg.start
    const r = this.lineVector
    const s = seg.lineVector

    // Check if the segments are parallel (cross product is zero)
    if (p5.Vector.cross(r, s).z === 0) {
      return null // No intersection (parallel or collinear)
    }

    // Compute the intersection t value
    const t = p5.Vector.cross(p5.Vector.sub(q, p), s).z / p5.Vector.cross(r, s).z

    // Check if the intersection point is on the first segment
    if (t < 0 || t > 1) {
      return null // No intersection
    }

    // Compute the intersection u value for the other segment
    const u = p5.Vector.cross(p5.Vector.sub(q, p), r).z / p5.Vector.cross(r, s).z

    // Check if the intersection point is on the second segment
    if (u < 0 || u > 1) {
      return null // No intersection
    }

    // Calculate the intersection point
    const intersection = p5.Vector.add(p, p5.Vector.mult(r, t))

    return new Vertex(intersection.x, intersection.y)
  }

  equals(segment, accuracy = 3) {
    return this.start.equals(segment.start, accuracy) && this.end.equals(segment.end, accuracy)
  }

  // lerp along segment 0-1, 0 = start, 1 = end
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

// CLASS: ProtoSegment
function protoSegment({ start, end, parentID, id, islandIDs } = {}) {
  return new ProtoSegment(start, end, parentID, id, islandIDs)
}

class ProtoSegment extends Segment {
  id
  parentID
  islandIDs
  taken = false

  cubicVerts = { start: new OpArray, end: new OpArray }
  neighbors = { start: undefined, end: undefined }

  constructor(start, end, parentID, id, islandIDs) {
    super(start, end)
    this.parentID = parentID
    this.islandIDs = islandIDs
    this.id = id
    if (!this.direction.allAreCardinal) {
      console.error(`this segment is not Cardinal!`)
      console.log(this)
    }
  }

  get start() {
    if (this._lastStart) {
      if (this._lastStart !== this._start) { console.warn(`!^!^!^! START value has changed`) }
    }
    this._lastStart = this._start
    return this._start
  }
  set start(vert) {
    if (vert.x < 0 || vert.y < 0) { console.warn(`trying to assign a negative start vert`) }
    const prev = this._start
    if (prev) {
      console.warn(`previous value ${prev.string} will be replaced by ${vert.string}`)
    }
    // console.log(`new start vert assigned`, vert)
    this._start = vert
  }

  get end() {
    if (this._lastEnd) {
      if (this._lastEnd !== this._end) { console.warn(`!^!^!^! END value has changed`) }
    }
    this._lastEnd = this._end
    return this._end
  }
  set end(vert) {
    if (vert.x < 0 || vert.y < 0) { console.warn(`trying to assign a negative end vert`) }
    const prev = this._end
    if (prev) {
      console.warn(`previous value ${prev.string} will be replaced by ${vert.string}`)
    }
    // console.log(`new end vert assigned`, vert)
    this._end = vert
  }


  get turns() {
    if (!this.neighbors.start || !this.neighbors.end) {
      console.error(`segment ${this.id} without neighbors has no turns`)
      console.log(this.neighbors)
      return
    }
    const start = this.neighbors.start.direction.turnTo(this.direction)
    const end = this.direction.turnTo(this.neighbors.end.direction)
    if (!start) {
      console.error(`segment ${this.id} failed to calculate start turn`)
      console.log(`start neighbor: `, info(this.neighbors.start))
    }
    if (!end) {
      console.error(`segment ${this.id} failed to calculate end turn`)
      console.log(`end neighbor: `, this.neighbors.end)
    }
    return {
      start: start,
      end: end
    }
  }

  get normals() {
    if (!this.neighbors.start || !this.neighbors.end) {
      console.error(`segment ${this.id} without neighbors has no normals`)
      return
    }
    if (this.angle === undefined) { console.error(`segment ${this.id} has no angle!`, this) }
    const normals =
    {
      start: this.neighbors.start.angle - this.turns.start.normalRotAngle,
      end: this.angle - this.turns.end.normalRotAngle,
      cubic: this.angle - PI / 2
    }
    return normals.map(a => Direction.atAngle(a))
  }

  get part() { return EdgePart.from([this.turns.start, this.turns.end]) }

  get isUTurn() { return this.part?.isUTurn }
  get isUTurnIn() { return this.part?.isUTurnIn }
  get isUTurnOut() { return this.part?.isUTurnOut }

  get isStair() { return this.part?.isStair }
  get isStairIn() { return this.part?.isStairIn }
  get isStairOut() { return this.part?.isStairOut }

  get isFlat() { return this.part?.isFlat }
  get isCorner() { return this.part?.isCorner }

  get hasInsideTurn() { return this.turns?.start.name === 'Left' || this.turns?.end.name === 'Left' }

  get cornerVerts() {
    if (!this.neighbors.start || !this.neighbors.end) {
      console.error(`segment ${this.id} without neighbors has no cornerVerts`)
      console.log(this)
      return
    }
    if (!this.turns.start || !this.turns.end) {
      console.error(`segment ${this.id} without turns has no cornerVerts`)
      console.log(`this seg`, this)
      console.log(`start neighbor: `, info(this.neighbors.start))
      return
    }
    return {
      start: (this.turns?.start.value !== 0) ? this.start : undefined,
      end: (this.turns?.end.value !== 0) ? this.end : undefined,
    }
  }

  get hasCubicStartVert() { return this.cubicVerts.start.length > 0 }
  get hasCubicEndVert() { return this.cubicVerts.end.length > 0 }
  get hasSomeCubicVerts() { return this.hasCubicStartVert || this.hasCubicEndVert }
  get hasNoCubicVerts() { return !this.hasSomeCubicVerts }
  get hasOnlyOneCubicVert() { return (this.hasCubicStartVert || this.hasCubicEndVert) && !(this.hasBothCubicVerts) }
  get hasBothCubicVerts() { return this.hasCubicStartVert && this.hasCubicEndVert }
  get cubicVertCount() {
    if (this.hasBothCubicVerts) { return 2 }
    if (this.hasOnlyOneCubicVert) { return 1 }
    if (!this.hasSomeCubicVerts) { return 0 }
  }

  get cubicVertsToStartLengths() {
    return this.cubicVerts.start.map(vert => Vertex.sub(this.start, vert).roundedMag()).numsorted
    return this.cubicVerts.start.map(vert => this.start.sub(vert).roundedMag()).numsorted
  }
  get cubicVertsToEndLengths() {
    return this.cubicVerts.end.map(vert => Vertex.sub(this.end, vert).roundedMag()).numsorted
    return this.cubicVerts.end.map(vert => this.end.sub(vert).roundedMag()).numsorted
  }
  get closestCubicStartVert() {
    return this.cubicVerts.start.sort((a, b) => Vertex.sub(this.start, a).roundedMag() - Vertex.sub(this.start, b).roundedMag())[0]
  }
  get closestCubicEndVert() {
    return this.cubicVerts.end.sort((a, b) => Vertex.sub(this.end, a).roundedMag() - Vertex.sub(this.end, b).roundedMag())[0]
  }

  get availableStartLength() {
    // console.log(`$$$$ availableStartLength`)
    if (!this.cornerVerts.start) {
      console.warn(`cannot calculate available length without cornerVerts`)
      return
    } // needs to have cornerVerts to calculate
    let availablelength
    if (this.hasNoCubicVerts) { // assume entire length available
      console.log(`availableLength calculated from length/2 (no cubicVerts)`)
      availablelength = this.length / 2
    }
    else if (this.hasCubicStartVert) {
      console.log(`availableLength calculated by cubicStartVert`)
      availablelength = Vertex.sub(this.closestCubicStartVert, this.start).roundedMag()
    }
    else if (this.hasCubicEndVert) {
      console.log(`availableLength calculated by `)
      length = this.length - this.availableEndLength
    }
    if (availablelength > this.length) {
      console.warn(`Invalid availableStartLength is longer than segment length!`)
      console.log(`this.availableEndLength`, this.availableEndLength)
      console.log(`this.length`, this.length)
    }
    return availablelength
  }

  get availableEndLength() {
    console.log(`$$$$ availableEndLength current seg - id: ${this.id}`)
    // console.warn(`1 $$$$ availableEndLength current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
    if (!this.cornerVerts.end) {
      console.warn(`cannot calculate available length without cornerVerts`)
      return
    } // needs to have cornerVerts to calculate

    let availablelength
    if (this.hasNoCubicVerts) { // assume entire length available
      console.log(`availableLength calculated from length/2 (no cubicVerts)`)
      availablelength = this.length / 2
    }
    else {
      // console.warn(`2 $$$$ availableEndLength current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
      if (this.hasCubicEndVert) {
        // console.warn(`3 $$$$ availableEndLength current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
        //NOTE: THIS IS THE BAD CALCULATION!
        console.log(`availableLength calculated by cubicEndVert`)
        console.log(`closestCubicEndVert`, this.closestCubicEndVert)
        console.log(`closestCubicEndVert`, this.closestCubicEndVert)
        // console.log(`length`, this.length)
        // console.log(`end ${this.end.string}`)
        // console.log(`end`, this.end)

        availablelength = Vertex.sub(this.closestCubicEndVert, this.end).roundedMag()
      } else {
        console.warn(`4 $$$$ availableEndLength current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
        if (this.hasCubicStartVert) {
          console.log(`availableLength calculated by hasCubicStartVert`)
          availablelength = this.length - this.availableStartLength
        }
      }
    }
    // console.warn(`4 $$$$ availableEndLength current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
    if (availablelength > this.length) {
      console.warn(`Invalid availableEndLength is longer than segment length!`)
      console.warn(`current seg - length: ${this.length}, start: ${this.start.string}, end:${this.end.string}`)
      console.log(`this.availablelength`, this.availablelength)
      console.log(`this.length`, this.length)
      console.warn(`this.availableStartLength`, this.availableStartLength)

    }
    return availablelength
  }
  get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

  //METH: copy
  get copy() {
    const copyNumber = this.id.includes(`copy`) ? `copy` + String(+this.id.slice(-2) + 1).padStart(2, '0') : `copy00`
    return protoSegment({
      start: this.start,
      end: this.end,
      parentID: this.parentID,
      id: `${this.id}-${copyNumber}`,
      islandIDs: this.islandIDs
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

    const insetCopy = protoSegment({ // new inset segment 
      start: insetStart,
      end: insetEnd,
      parentID: this.id,
      id: `${this.id}-inset(${roundToDec(insetScale.x, 2)})`,
      islandIDs: this.islandIDs
    })



    if (this.id.includes(`shp004-4down-cell019`)) {
      console.error(`insetCopy made here!`)
      console.log(`arguments`, insetScale, minCellWidth)
      console.log(`normals`, this.normals.map(n => n.name))
      console.log(`this.normals.end.moveCoord`, this.normals.end.moveCoord)
      console.log(`this.end`, this.end)
      console.log(`endMove`, endMove)
      console.log(`insetEnd`, insetEnd)
      console.log(`insetEnd: ${insetEnd.string}`)
      console.log(`original`, this)
      console.log(`pree insetCopy`, info(insetCopy))
      console.log(`pree insetCopy`, insetCopy)
    }


    const cubicMove = Vertex.mult(this.normals.cubic.moveCoord, offset) // cubicMove vector
    const insetCubicStarts = this.cubicVerts.start.map(v => Vertex.add(v, cubicMove))
    const insetCubicEnds = this.cubicVerts.end.map(v => Vertex.add(v, cubicMove))
    insetCopy.cubicVerts = { start: insetCubicStarts, end: insetCubicEnds } // assign new inset cubicVerts
    if (this.id.includes(`shp004-4down-cell019`)) {
      console.log(`post insetCopy`, info(insetCopy))
    }
    return insetCopy
  }

  //METH: assignNeighbors()
  //NOTE: be sure to assign neighbors by reference instead of value to avoid infinite tree
  assignNeighbors({ start, end } = {}) {

    if (start) {
      if (start.id.includes(`shp004-4down-cell019-rightSide`)) {
        console.error(`problem segment getting assigned as start neighbor`)
        console.log(`current state`, start)
        console.log(`current state`, info(start))
        console.log(`current state ${start.string}`)
      }
      if (!this.start.equals(start.end, 3)) {
        console.error(`assigned a disconnected start neighbor!`, this)
      }
      this.neighbors.start = start
    }
    if (end) {
      if (!this.end.equals(end.start, 3)) {
        console.error(`assigned a disconnected end neighbor!`, this)
      }
      this.neighbors.end = end
    }

  }

  //TODO: do I actually want/need this?
  assignMid() {
    this.addCubicStartVert(this.mid)
    this.addCubicEndVert(this.mid)
  }

  addCubicStartVert(vert) { this.#addCubicVert(vert, true) }
  addCubicEndVert(vert) { this.#addCubicVert(vert, false) }
  addBothCubicVerts(vert) {
    this.addCubicStartVert(vert)
    this.addCubicEndVert(vert)
  }
  addDistancedCubicStartVert(distance) { this.addCubicStartVert(this.distancedStartPoint(distance)) }
  addDistancedCubicEndVert(distance) { this.addCubicEndVert(this.distancedEndPoint(distance)) }

  //TODO: CLEANUP ALL SILENCED CODE
  #addCubicVert(vert, start) {
    let cubicVerts = start ? this.cubicVerts.start : this.cubicVerts.end
    // if (typeof vert === 'string') {
    //   console.warn(`assign cubicVert via String`)
    //   vert = this.#vertNames[vert]
    // }
    if (vert instanceof Vertex) {
      // console.log(`already assigned ${cubicVerts}`, cubicVerts.length)
      if (!this.vertIsOnLine(vert)) {
        console.error(`trying to assign a cubicVert that is not on this segment`)
        console.log(`off-line vert`, vert)
        console.lof(`this.segment`, info(this))
      }
      cubicVerts.push(vert)
      cubicVerts = cubicVerts.unique('x', 'y')
      // console.log(`just assigned ${vert}`)
      // console.log(`now assigned ${cubicVerts}`, cubicVerts.length)
    }
    // if (vert instanceof Set) { vert = Array.from(vert) }
    // if (vert instanceof Array && vert.length > 0) {
    //   console.log(`!!vert from array`, vert)
    //   // if (typeof vert[0] === 'string') { vert = vert.map(v => this.#vertNames[v]) }
    //   // console.log(`vert converted`, vert)
    //   if (vert[0] instanceof Vertex) {
    //     // console.error(`addCubicVert vert is a Vertex`)
    //     cubicVerts = cubicVerts.union(vert, ['x', 'y'])
    //   }
    // }
  }

  // #vertNames = {
  //   'start': this.start,
  //   'mid': this.mid,
  //   'end': this.end,
  //   'two': ['start', 'end'],
  //   'three': ['start', 'mid', 'end'],
  // }
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