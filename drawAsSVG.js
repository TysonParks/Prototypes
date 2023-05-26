


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
  //METH:
  static exportPNG(svgMarkup, fileName, width, height, scale = 2) {
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
    bisector = 0.5,
    circularCaps = true,
    random = false
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
  // print('curves')
  // print(curves.map(e => e.map(f => f.string)))
  // print('previousSegment')
  // print(previousSegment)



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
      // print('seg.last > seg.first')
      lineEndLoc = 1 - circleCurve / last.length
      lineEnd = last.pointOnsegment(lineEndLoc)
      control2 = last.scaledEndPoint(bezCircleConst, lineEndLoc)
    } else {
      // print('seg.first > seg.last')
      makeSegmentCircular(last, lineStartLoc)
    }
    start = [lineEnd, control2]
  }
  // print('start')
  // print(start.map(e => e.string))
  // print('end')
  // print(end.map(e => e.string))

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
  return segmentPath.map(e => [e.startPoint.x, e.startPoint.y])
}

// FUNC: vertsPathToSegmentPath()
// convert array of verts to a shape path made of Segments
function vertsPathToSegmentPath({ path = [], refine = true } = {}) {
  let vertCount = path.length
  if (vertCount < 3) { return }
  path = loopPath(path)
  let segmentPath = []
  let previousSeg = undefined
  for (let i = 0; i < vertCount; i++) {
    // let verts = [vert(path[i]), vert(path[i + 1])]
    // let segment = new Segment({ start: verts[0], end: verts[1] })
    let seg = segment(vert(path[i]), vert(path[i + 1]))
    // print('previousSeg')
    // print(previousSeg)
    // print('seg')
    // print(seg)
    if (refine === true && previousSeg !== undefined && seg.angle === previousSeg.angle) {

      // verts = [previousSeg.verts[0], verts[1]]
      seg = segment(previousSeg.startPoint, seg.endPoint)
      segmentPath.pop()
    }                                      // combine segments with same angle
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
  normal

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

  equals(vert, accuracy) {
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
  normal

  constructor(start, end) {
    this.#assignVerts(start, end, arguments)
  }

  get id() { return `(${this.verts.start.id}) -> (${this.verts.end.id})` }
  get string() { return `[(${this.startPoint.string}), (${this.endPoint.string})]` }

  get lineVector() { return p5.Vector.sub(this.endPoint, this.startPoint) }

  get startPoint() { return this.verts.start }
  get midPoint() { return this.pointOnsegment(0.5) }
  get endPoint() { return this.verts.end }
  get angle() { return this.lineVector.heading() }
  get direction() { return Direction.atAngle(this.angle) }
  get length() { return this.lineVector.mag() }
  get width() { return this.startPoint.widthTo(this.endPoint) }
  get height() { return this.startPoint.heightTo(this.endPoint) }

  // get normal() {
  //   let copy = this.lineVector.copy().rotate(-PI / 4)
  //   copy.rotate(-PI / 4)
  //   let end = this.midPoint.add(copy)
  //   return segment(this.midPoint, end)
  // }

  equals(segment) {
    return this.startPoint.equals(segment.startPoint) && this.endPoint.equals(segment.endPoint)
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
class ProtoSegment extends Segment {
  parentID
  taken = false
  turns
  part
  assignedVerts = new OpArray

  constructor(start, end, parentID) {
    super(start, end)
    this.parentID = parentID
  }

  get isUTurn() { return this.part.isUTurn }
  get isStep() { return this.part.isStep }
  get isFlat() { return this.part.isFlat }
  get isCorner() { return this.part.isCorner }

  get cornerVerts() {
    let verts = new OpArray
    // console.log(this.turns)
    if (this.turns.start.value !== 0) { verts.push(this.startPoint) }
    if (this.turns.end.value !== 0) { verts.push(this.endPoint) }
    return verts
  }

  assignCornerVerts() {
    if (this.turns.start.value !== 0) { this.assign(this.startPoint) }
    if (this.turns.end.value !== 0) { this.assign(this.endPoint) }
  }

  // assignUTurnVerts() {
  //   if (this.part.isUTurn) { this}
  // }

  assign(vert) {
    if (typeof vert === 'string') {
      // console.log(`assign ${vert}`)
      vert = this.#vertNames[vert]
    }
    if (vert instanceof Vertex) {
      this.assignedVerts.push(vert)
      // console.log(`assigned ${vert}`)
    }
    // if (vert instanceof Array && typeof vert[0] === 'string') {
    //   vert.forEach(v => this.assignedVerts.push(this.#vertNames[v]))
    // }
  }

  #vertNames = {
    'start': this.startPoint,
    'mid': this.midPoint,
    'end': this.endPoint,
    // 'three': ['start', 'mid', 'end'],
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