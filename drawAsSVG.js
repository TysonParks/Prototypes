


// TODO: can these functions be generalized into Classes?
// MARK: SVG Functions

//CLASS: ProtoSVG
class ProtoSVG {
  //METH:
  static segsToSVG(
    { segments,
      refine = true,
      // cornerRadius = '16px',
      // weights = [],
      random = false,
    } = {}) {
    if (refine) {
      let verts = segmentPathToVertsPath(segments)
      segments = vertsPathToSegmentPath({ path: verts, refine: true })
      // print('segments')
      // print(segments.map(e => e.string))
    }

    return lSegmentPathToRoundedSVGPath({ segments: segments, random: random })
  }
  //METH: refineProtoSegmentPath()
  // remove colinear segments to reduce shape path to single segments connecting corners
  static refineProtoSegmentPath(path = [], parentID, minCorners = false) {
    let newPath = new OpArray
    let prevSeg = undefined
    let prevMid = undefined
    let length = 1
    let firstID = undefined
    for (let i = 0; i < path.length; i++) {
      let seg = path[i]
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
          start: prevSeg.startPoint,
          end: seg.endPoint,
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

  // NOTE: Made with GPT-4 on May 23, 2023
  //METH:
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
        const img = new Image();
        img.onload = () => {
          resolve(img);
        }
        img.src = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }));
      });
      return img;
    }

    // Encode 16-bit PNG
    function encodePNG16(data, width, height) {
      const header = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

      const buf = new Uint16Array(width * height * 4);

      for (let i = 0; i < data.length; i++) {
        const high = (data[i] >> 8) & 0xFF;
        const low = data[i] & 0xFF;
        buf[i * 2] = low;
        buf[i * 2 + 1] = high;
      }

      const png = new Uint8Array(header.length + buf.length * 2);
      png.set(header);
      png.set(buf, header.length);

      return png;
    }

    // Export PNG file  
    function downloadBlob(data, filename) {
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    const canvas = new OffscreenCanvas(width, height);
    const gl = canvas.getContext('webgl2', { pixelFormat: 'float16' });

    if (!gl) {
      throw new Error('WebGL 2 not supported');
    }

    const texture = gl.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.UNSIGNED_SHORT, null);

    const img = await loadImage(svgMarkup);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_SHORT, img);

    const data = new Uint16Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_SHORT, data);

    const png = await encodePNG16(data, width, height);

    downloadBlob(png, fileName);
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
      });
    };
  }
}

class VertPath {

}

class SegmentPath {

}

class SVGPath {

}

const bezCircleConst = 0.552
const bezCircle45DegConst = 0.265

// FUNC: lSegmentPathToRoundedSVGPath()
// create SVG path from segments with points rounded using (C) bezier curves
function lSegmentPathToRoundedSVGPath(
  { segments,
    curvature = bezCircleConst,
    straightness = 0,
    bisector = .5,
    circularCaps = true,
    random = false,
  } = {}) {
  segments = OpArray.from(segments)
  let last = segments.pop()
  let lineStartLoc = bisector - straightness * bisector
  let lineEndLoc = bisector + straightness * (1 - bisector)
  function offset() { return random ? R.random_num(0.1, 1.5) : curvature }

  let curves = []
  let previousSegment = last
  let control1, lineStart, lineEnd, control2, circleCurve

  // create curve coordinates
  segments.forEach((e, i) => {
    // print('lengths')
    // print([previousSegment.length, e.length])
    if (!circularCaps) {
      control1 = e.scaledStartPoint(offset(), lineStartLoc)
      lineStart = e.pointOnsegment(lineStartLoc)
      lineEnd = e.pointOnsegment(lineEndLoc)
      control2 = e.scaledEndPoint(offset(), lineEndLoc)
    } else {
      circleCurve = min(e.length, previousSegment.length) / 2
      if (e.length < previousSegment.length) {
        // print('previous is longer!')
        makePrevSegmentCircular()
        makeSegmentCircular(e)
      } else {
        // print('current is longer!')
        let lineStartLoc = circleCurve / e.length
        makeSegmentCircular(e, lineStartLoc)
      }
      previousSegment = e
    }
    curves.push([control1, lineStart, lineEnd, control2])
  })

  // create start and end coordinates
  let end, start
  if (!circularCaps) {
    end = [last.scaledStartPoint(offset(), lineStartLoc), last.pointOnsegment(lineStartLoc)]
    start = [last.pointOnsegment(lineEndLoc), last.scaledEndPoint(offset(), lineEndLoc)]
  } else {
    circleCurve = min(last.length, previousSegment.length) / 2
    let lineStartLoc = circleCurve / last.length
    if (previousSegment.length > last.length) {
      makePrevSegmentCircular()
      makeSegmentCircular(last)
    } else {
      makeSegmentCircular(last, lineStartLoc)
    }
    end = [control1, lineStart]

    circleCurve = min(last.length, segments[0].length) / 2
    if (last.length > segments[0].length) {
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


  // methods
  function makeSegmentCircular(segment, startLoc = lineStartLoc) {
    control1 = segment.scaledStartPoint(bezCircleConst, startLoc)
    lineStart = segment.pointOnsegment(startLoc)
    lineEnd = segment.pointOnsegment(lineEndLoc)
    control2 = segment.scaledEndPoint(bezCircleConst, lineEndLoc)
    return [control1, lineStart, lineEnd, control2]
  }

  function makePrevSegmentCircular() {
    if (curves.length === 0) { return }
    let prevCoords = curves.pop()
    let lineEndLoc = 1 - circleCurve / previousSegment.length
    let lineEnd = previousSegment.pointOnsegment(lineEndLoc)
    let control2 = previousSegment.scaledEndPoint(bezCircleConst, lineEndLoc)
    let newCoords = [prevCoords[0], prevCoords[1], lineEnd, control2]
    curves.push(newCoords)
  }
}

// FUNC: roundedCornerShape()
function roundedCornerShape({ shape = testShape2a, cornerRadius = '16px', weights = [], random = false } = {}) {
  let segmentShape = vertsPathToSegmentPath({ path: shape, refine: false })
  // print('segmentShape')
  // print(segmentShape)
  let curvedPath = lSegmentPathToRoundedSVGPath({ segments: segmentShape })

  let newVerts = segmentPathToVertsPath(segmentShape)

  let path = lVertsToSVGPath(newVerts)


  // print(`finalPath: ${curvedPath}`)
  // print(extractVerts(curvedPath))
  // print(`verts: ${extractVerts(curvedPath)}`)

  // return `path('${curvedPath}')`
  return curvedPath
  // convert each point to Q control point
  // add Q point before Qcontrol and slide it -radius pixels/percent along segment slope
  // max/min the slide based upon length of segment (1/2 maybe?)
}

// FUNC: segmentPathToVertsPath()
function segmentPathToVertsPath(segmentPath) {
  return segmentPath.map(seg => [seg.startPoint.x, seg.startPoint.y])
}

// FUNC: vertsPathToSegmentPath()
// convert array of verts to a shape path made of Segments
function vertsPathToSegmentPath({ path = [], refine = true, parentID } = {}) {
  // console.log('path', path)
  let vertCount = path.length
  if (vertCount < 3) { return }
  path = loopPath(path)
  // console.log('loopedpath', path)
  let segmentPath = []
  let previousSeg = undefined
  for (let i = 0; i < vertCount; i++) {
    let seg = protoSegment({ start: vert(path[i]), end: vert(path[i + 1]), parentID: parentID })
    if (refine === true && previousSeg !== undefined && seg.angle === previousSeg.angle) {
      seg = protoSegment({ start: previousSeg.startPoint, end: seg.endPoint, parentID: parentID })
      segmentPath.pop()
    } // combine segments with same angle
    segmentPath.push(seg)
    previousSeg = seg
  }
  return segmentPath
}

// FUNC: lVertsToSVGPath()
function lVertsToSVGPath(verts = simpleSquare) {
  let shape = verts
    .map((e, i,) => {
      if (i === 0) { return `M ${e}` }
      return `L ${e}`
    })
  // return `${shape.join(" ")}`
  return `path('${shape.join(" ")}')`
}



// FUNC: loopPath()
// loopPath closes a shape path loop made of either segments or vertices
function loopPath(verts = simpleSquare) {
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

// FUNC: drawPointsAtVerts()
// draw index labeled points at (comma separated) verts extracted from SVG path description
function drawPointsAtVerts({ path, parent, size = 5, offset = vert(0), color = '#F80', indices = true } = {}) {
  let verts = extractVerts(path)
  let centerOffset = size / 2
  let divs = []
  verts.forEach((e, i) => {
    if (!indices) { i = '' }
    let div = createDiv(i)
    let coord = extractCoord(e)
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

// FUNC: extractVerts()
// extract comma separated vert coordinates from an SVG path to array
function extractVerts(path = '') {
  let reg = /-?\d+(?:\.\d+)*[,]-?\d+(?:\.\d+)*/
  let result = matchAll(path, reg)
  // print(result)
  return result
}

// FUNC: extractCoord()
// extract x and y from single comma separated vert string
function extractCoord(vertString) {
  let reg = /-?\d+(?:\.\d+)*/
  let result = matchAll(vertString, reg)
    .flatMap(e => Number(e))
  // print('extractCoord()')
  // print(result)
  return result
}

// FUNC: multiplySVGCoords()
function multiplySVGCoords({ path, multiplier } = {}) {
  let verts = extractVerts(path).map(e => {
    let pairs = extractCoord(e)
    return pairs.map(f => f * multiplier)
  })
  return verts
}


// MARK: Pseudo Drawing Classes

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
  }

  get id() { return `${this.x.toFixed(1)}, ${this.y.toFixed(1)}` }

  get isZero() { return this.x === 0 && this.y === 0 }
  get string() { return `${this.x}, ${this.y}` }
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
      ax = this.x.toFixed(accuracy)
      ay = this.y.toFixed(accuracy)
      bx = vert.x.toFixed(accuracy)
      by = vert.y.toFixed(accuracy)
    } else {
      ax = this.x
      ay = this.y
      bx = vert.x
      by = vert.y
    }
    return ax === bx && ay === by
  }

  add(vert) { return Vertex.add(this, vert) }
  sub(vert) { return Vertex.sub(this, vert) }
  mult(vert) { return Vertex.mult(this, vert) }
  div(vert) { return Vertex.div(this, vert) }

  static add(a, b) { return vert(p5.Vector.add(a, b)) }
  static sub(a, b) { return vert(p5.Vector.sub(a, b)) }
  static mult(a, b) {
    if (b instanceof Vertex) {
      // print(`${b} is vertex`)
      return vert(a.x * b.x, a.y * b.y)
    }
    if (typeof b === 'number') {
      // print(`${b} is Number`)
      return vert(a.x * b, a.y * b)
    }
  }
  static div(a, b) {
    if (b instanceof Vertex) {
      // print(`${b} is vertex`)
      return vert(a.x / b.x, a.y / b.y)
    }
    if (typeof b === 'number') {
      // print(`${b} is Number`)
      return vert(a.x / b, a.y / b)
    }
  }
}

// CLASS: Segment 
function segment(start, end) {
  return new Segment(start, end)
}

class Segment {
  verts
  // normal

  constructor(start, end) {
    this.#assignVerts(start, end, arguments)
  }

  get id() { return `(${this.verts.start.id}) -> (${this.verts.end.id})` }
  get string() { return `[(${this.startPoint.string}), (${this.endPoint.string})]` }

  get lineVector() { return p5.Vector.sub(this.endPoint, this.startPoint) }
  get opposite() { return segment(this.end, this.start) }

  get start() { return this.verts.start }
  get end() { return this.verts.end }

  get startPoint() { return this.verts.start } // DEPRECATE usage of -point???
  get midPoint() { return this.pointOnsegment(0.5) } // DEPRECATE usage of -point???
  get endPoint() { return this.verts.end } // DEPRECATE usage of -point???
  get angle() { return this.lineVector.heading() }
  get direction() { return Direction.atAngle(this.angle) }
  get length() { return roundToDec(this.lineVector.mag(), 4) }
  get width() { return this.startPoint.widthTo(this.endPoint) }
  get height() { return this.startPoint.heightTo(this.endPoint) }

  // get normal() {
  //   let copy = this.lineVector.copy().rotate(-PI / 4)
  //   copy.rotate(-PI / 4)
  //   let end = this.midPoint.add(copy)
  //   return segment(this.midPoint, end)
  // }

  //NOTE: made with ChatGPT4.0 on May26, 2023
  // check to see if Vertex point is on Segment line
  vertIsOnLine(vert) {
    // Calculate the t parameter using linear interpolation
    const t = this.lineVector.dot(p5.Vector.sub(vert, this.startPoint)) / this.lineVector.magSq()
    // Check if t is within the range [0, 1]
    return t >= 0 && t <= 1
  }

  equals(segment, accuracy = 3) {
    return this.startPoint.equals(segment.startPoint, accuracy) && this.endPoint.equals(segment.endPoint, accuracy)
  }

  // lerp along segment 0-1, 0 = startPoint, 1 = endPoint
  pointOnsegment(lerp) {
    let newVec = p5.Vector.mult(this.lineVector, lerp)
    let startVec = createVector(this.startPoint.x, this.startPoint.y)
    let result = p5.Vector.add(startVec, newVec)
    // return [result.x, result.y]
    return new Vertex(result.x, result.y)
  }

  // lerp 0-1 from midPoint to startPoint/endpoint
  scaledStartPoint(lerp, midPoint = 0.5) {
    return this.pointOnsegment(midPoint - lerp * midPoint)
  }
  scaledEndPoint(lerp, midPoint = 0.5) {
    return this.pointOnsegment(midPoint + lerp * (1 - midPoint))
  }

  #assignVerts(start, end, args) {
    if (args.length === 1) {
      if (start instanceof Array) {
        if (start[0] instanceof Vertex) {
          this.verts = { start: start[0], end: start[1] }
        }
        else if (start[0] instanceof Object || start[0] instanceof Array) {
          this.verts = { start: vert(start[0]), end: vert(start[1]) }
        }
      }
      else if (start instanceof Object) {
        if (start.start instanceof Vertex) {
          this.verts = { start: start.start, end: start.end }
        }
        else if (start.start instanceof Object || start[0] instanceof Array) {
          this.verts = { start: vert(start.start), end: vert(start.end) }
        }
      }
    }
    else if (start instanceof Vertex) {
      this.verts = { start: start, end: end }
    }
    else if (start instanceof Object) {
      this.verts = { start: vert(start), end: vert(end) }
    }
  }
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
  }

  get turns() {
    return {
      start: this.neighbors.start.direction.turnTo(this.direction),
      end: this.direction.turnTo(this.neighbors.end.direction)
    }
  }

  get part() { return EdgePart.from([this.turns.start, this.turns.end]) }

  get isUTurn() { return this.part?.isUTurn }
  get isUTurnIn() { return this.part?.isUTurnIn }
  get isUTurnOut() { return this.part?.isUTurnOut }
  get isStep() { return this.part?.isStep }
  get isFlat() { return this.part?.isFlat }
  get isCorner() { return this.part?.isCorner }

  get hasInsideTurn() { return this.turns?.start.name === 'Left' || this.turns?.end.name === 'Left' }

  get cornerVerts() {
    return {
      start: (this.turns?.start.value !== 0) ? this.start : undefined,
      end: (this.turns?.end.value !== 0) ? this.end : undefined,
    }
  }

  get hasBothCubicVerts() { return this.cubicVerts.start.length > 1 && this.cubicVerts.end.length > 1 }
  get cubicVertsToStartLengths() { return this.cubicVerts.start.map(vert => this.start.sub(vert).mag()) }
  get cubicVertsToEndLengths() { return this.cubicVerts.end.map(vert => this.end.sub(vert).mag()) }
  get closestCubicStartVert() {
    return this.cubicVerts.start.sort((a, b) => this.start.sub(a).mag() - this.start.sub(b).mag())[0]
  }
  get closestCubicEndVert() {
    return this.cubicVerts.end.sort((a, b) => this.end.sub(a).mag() - this.end.sub(b).mag())[0]
  }
  get availableStartLength() {
    if (!this.cornerVerts.start) { return } // needs to have cornerVerts to calculate
    if (this.cubicVerts.start.length === 0) { return this.length / 2 } // assume entire length available
    return this.closestCubicStartVert.sub(this.start).mag()
  }
  get availableEndLength() {
    if (!this.cornerVerts.end) { return } // needs to have cornerVerts to calculate
    if (this.cubicVerts.end.length === 0) { return this.length / 2 } // assume entire length available
    return this.closestCubicEndVert.sub(this.end).mag()
  }
  get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

  //METH: assignNeighbors()
  //NOTE: be sure to assign neighbors by reference instead of value to avoid infinite tree
  assignNeighbors({ start, end } = {}) {
    if (start) { this.neighbors.start = start }
    if (end) { this.neighbors.end = end }
  }

  //TODO: do I actually want/need this?
  assignMid() {
    this.addCubicStartVert('mid')
    this.addCubicEndVert('mid')
  }

  addCubicStartVert(vert) { this.#addCubicVert(vert, true) }
  addCubicEndVert(vert) { this.#addCubicVert(vert, false) }
  addBothCubicVerts(vert) {
    this.addCubicStartVert(vert)
    this.addCubicEndVert(vert)
  }

  #addCubicVert(vert, start) {
    let cubicVerts = start ? this.cubicVerts.start : this.cubicVerts.end
    if (typeof vert === 'string') {
      // console.log(`assign ${vert}`)
      vert = this.#vertNames[vert]
    }
    if (vert instanceof Vertex) {
      // console.log(`already assigned ${cubicVerts}`, cubicVerts.length)
      cubicVerts.push(vert)
      cubicVerts = cubicVerts.unique('x', 'y')
      // console.log(`just assigned ${vert}`)
      // console.log(`now assigned ${cubicVerts}`, cubicVerts.length)
    }
    if (vert instanceof Set) { vert = Array.from(vert) }
    if (vert instanceof Array && vert.length > 0) {
      // console.log(`!!vert from array`, vert)
      if (typeof vert[0] === 'string') { vert = vert.map(v => this.#vertNames[v]) }
      // console.log(`vert converted`, vert)
      if (vert[0] instanceof Vertex) {
        // console.error(`addCubicVert vert is a Vertex`)
        cubicVerts = cubicVerts.union(vert, ['x', 'y'])
      }
    }
  }

  #vertNames = {
    'start': this.startPoint,
    'mid': this.midPoint,
    'end': this.endPoint,
    'two': ['start', 'end'],
    'three': ['start', 'mid', 'end'],
  }
}





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