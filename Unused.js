//MARK: Useful code that went unused!

//CLASS: UnusedSegPath
class UnusedSegPath extends SegPath {
  //METH: cutAllToCardinal()
  static cutAllToCardinal(segPath) {
    //ARROW: shared() : find segments with shared startPoint to input seg's endPoint
    const shared = (seg) => {
      const pairs = segPath.filter(s => seg.end.equals(s.start, 4)) // seg.end = s.start
      if (pairs.length === 2) { return [seg, pairs] } // ordinal connections will have two connections 
    }

    const sharedStarts = segPath.map(seg => shared(seg)).compacted // find all ordinal corner segments
    console.log(`sharedStarts`, sharedStarts)

    sharedStarts.forEach(s => { // swap segment neighbors and remove cubic verts at corners
      const [seg, [nextA, nextB]] = s
      let newNeighbor
      if (seg.neighbors.end.id === nextA.id) { newNeighbor = nextB }      // nextA was initial neighbor
      else if (seg.neighbors.end.id === nextB.id) { newNeighbor = nextA } // nextB was initial neighbor
      else { console.error(`cutAllToCardinal Error: unexpected case hit, please investigate!`) } // Error just in case
      // console.log(`${seg.hasBothCubicVerts}`)
      seg.assignNeighbors({ end: newNeighbor })   // swap seg's endNeighbor
      seg.clearCubicEndVerts()                      // clear seg's CubicEndVerts 
      newNeighbor.assignNeighbors({ start: seg }) // swap newNeighbor's startNeighbor
      newNeighbor.clearCubicStartVerts()            // clear newNeighbor's clearCubicStartVerts 
      // console.log(`${seg.hasBothCubicVerts}`)
    })

    let newPaths = new OpArray
    let oldPath = segPath.copy
    while (oldPath.length > 0) {
      const first = oldPath[0]
      const newPath = first.sortedSegPath
      // console.log(`newPath`, newPath)
      newPaths.push(newPath)
      oldPath = oldPath.exclude(newPath, ['id'])
    }
    console.log(`newPaths: ${newPaths.map(path => path.map(seg => seg.hasBothCubicVerts))}`)


    //FIXME: NEXT STEP: recalculate corners!
    //FIXME: FINAL STEP: return paths and assign them as new subshapes in new shape copy
    //FIXME: ALSO: add an early bailout if no sharedStarts are found, just return original segPath
    return newPaths
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

//CLASS: UnusedSVGPath
class UnusedSVGPath {
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

//CLASS: UnusedVertPath
class UnusedVertPath {
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
}

//CLASS: UnusedExport
class UnusedExport {
  // NOTE: Made with ClaudeAI on Oct 5, 2023
  //METH:
  // static async exportPNG16(svgMarkup, fileName, width, height) {
  //   // Load SVG image
  //   async function loadImage(svgMarkup) {
  //     const img = await new Promise(resolve => {
  //       const img = new Image()
  //       img.onload = () => {
  //         resolve(img)
  //       }
  //       img.src = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }))
  //     })
  //     return img
  //   }

  //   // Encode 16-bit PNG
  //   function encodePNG16(data, width, height) {
  //     const header = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  //     const buf = new Uint16Array(width * height * 4)

  //     for (let i = 0; i < data.length; i++) {
  //       const high = (data[i] >> 8) & 0xFF
  //       const low = data[i] & 0xFF
  //       buf[i * 2] = low
  //       buf[i * 2 + 1] = high
  //     }

  //     const png = new Uint8Array(header.length + buf.length * 2)
  //     png.set(header)
  //     png.set(buf, header.length)

  //     return png
  //   }

  //   // Export PNG file  
  //   function downloadBlob(data, filename) {
  //     const url = URL.createObjectURL(new Blob([data]))
  //     const a = document.createElement('a')
  //     a.href = url
  //     a.download = filename
  //     a.click()
  //     URL.revokeObjectURL(url)
  //   }

  //   const canvas = new OffscreenCanvas(width, height)
  //   // canvas.style('image-rendering', `high-quality`)
  //   const gl = canvas.getContext('webgl2', { pixelFormat: 'float16' })

  //   if (!gl) {
  //     throw new Error('WebGL 2 not supported')
  //   }

  //   const texture = gl.createTexture()
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.UNSIGNED_SHORT, null)

  //   const img = await loadImage(svgMarkup)
  //   gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_SHORT, img)

  //   const data = new Uint16Array(width * height * 4)
  //   gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_SHORT, data)

  //   const png = await encodePNG16(data, width, height)

  //   downloadBlob(png, fileName)
  // }
}

//CLASS: UnusedGrid
class UnusedGrid extends Grid {

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
  //   // DeBug.log(` ** findCollinear seg`, info(seg))
  //   // DeBug.log(`cubicVert`, cubicVert)
  //   // DeBug.log(`segCollection`, segCollection)
  //   // let wrapper = segCollection.flat()
  //   // DeBug.log(`findcoincidentWrapper overlapSegs`, seg.overlapSegs)
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
  //   //   DeBug.error(``)
  //   //   DeBug.warn(`FOUND cell026!`)
  //   //   DeBug.error(``)
  //   //   report = true
  //   // }
  //   if (report) {
  //     DeBug.log(`wrapCollinearCorner seg`, seg)
  //     DeBug.log(`wrapCollinearCorner segCollection`, segCollection)
  //   }
  //   // let outsideCorners = new OpArray
  //   // let insideCorners = new OpArray
  //   const isDir = outsideCorner ? `isRight` : `isLeft`
  //   if (!seg.turns.end[isDir]) { // must be an outside corner, so end of seg turns Right
  //     DeBug.error(`INVALID: wrapCollinearCorner only works on segment corners ending in ${isDir} turns `)
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
  //   //   DeBug.log(`--> wrapperStart`, wrapperStart)
  //   //   DeBug.log(`--> wrapperEnd`, wrapperEnd)
  //   //   DeBug.log(``)
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
  //   // DeBug.log(`wrapCorners segs`, segs)
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
  //     DeBug.warn(`outWrapAdjacentInsideCorner seg`, seg.id)
  //   }

  //   // if (!seg.turns.end.isLeft) { // must be an inside corner, so end of seg turns Left
  //   //   DeBug.error(`outWrapAdjacentInsideCorner only works on segment corners ending in left turns `)
  //   //   DeBug.log(seg)
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
  //     // DeBug.warn(`!!!adjWrapper!!! segDir: ${segDir}, normCoord: ${normCoord}, normal:`, normal)
  //     // DeBug.log(` ** findAdjacent seg`, info(seg))
  //     // DeBug.log(`normal`, normal.string)

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
  //     // DeBug.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
  //     // closestAdjacentWrapper = closestAdjacentWrapper
  //     if (replace) {
  //       // closestAdjacentWrapper = closestAdjacentWrapper.filter(s => s.hasLooseCorner)  // safe replacement edge case
  //     }
  //     // DeBug.log(`closestAdjacentWrapper`, closestAdjacentWrapper)
  //     closestAdjacentWrapper = closestAdjacentWrapper[0] // take shortest/closest

  //     return closestAdjacentWrapper
  //   }

  //   // const wrapperStart = adjWrapper(seg)
  //   // const wrapperEnd = adjWrapper(neighbor, true)

  //   //----------------------------------------------------
  //   DeBug.error(`outWrapAdjacentInsideCorner seg`, seg)
  //   const adjWrap = seg.adjacentWrapper
  //   let wrapped = { start: undefined, end: undefined }
  //   DeBug.log(`adjWrap`, adjWrap)

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
  //   DeBug.log(`--> wrapperStart`, wrapperStart)
  //   DeBug.log(`--> wrapperEnd`, wrapperEnd)
  //   DeBug.log(``)
  //   // }

  //   // let wrapped = { start: undefined, end: undefined }
  //   if (wrapperStart && wrapperEnd) {
  //     if (wrapperStart[0].endNeighbor.id !== wrapperEnd[0].id) {
  //       DeBug.error(`INVALID: Wrapper segs ${wrapperStart[0].id} and ${wrapperEnd[0].id} are not a connected corner`)
  //       return
  //     }
  //     if (wrapperStart[0].isCollinearWith(seg) || wrapperEnd[0].isCollinearWith(neighbor)) {
  //       DeBug.warn(`INVALID: Wrapper corner is collinear with segment corner`)
  //       return
  //     }

  //     if (report) {
  //       DeBug.log(`!!! ADJACENT WRAPPED CORNER FOUND !!!`)
  //       DeBug.log(seg)
  //       DeBug.log(`** ${seg.id} is wrapped by --> ${wrapperStart[0].id}`)
  //       DeBug.log(`** ${neighbor.id} is wrapped by --> ${wrapperEnd[0].id}`)
  //     }

  //     const startGap = segment(seg.finalCubicStartVert, wrapperStart[1])  // gap between corner segs
  //     const endGap = segment(neighbor.finalCubicEndVert, wrapperEnd[1])   // gap between corner segs
  //     // DeBug.log(`startGap`, startGap.length, startGap.string)
  //     // DeBug.log(`endGap`, endGap.length, endGap.string)
  //     // DeBug.log(``)
  //     const startGapLength = roundToDec(startGap.length)               // gap distance
  //     const endGapLength = roundToDec(endGap.length)                   // gap distance
  //     if (startGapLength === endGapLength) {                              // wrap both if equidistant
  //       // DeBug.log(`wrapperStart`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperStart[0].cubicVerts,
  //       //   max: wrapperStart[0].maxCubicVerts,
  //       //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
  //       // })))
  //       // DeBug.log(`wrapperEnd`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperEnd[0].cubicVerts,
  //       //   max: wrapperEnd[0].maxCubicVerts,
  //       //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
  //       // })))
  //       DeBug.warn(`Wrapping both segments`)

  //       if (radiant) {
  //         wrapperStart[0].addCubicEndVert(wrapperStart[1], replace)
  //         wrapperEnd[0].addCubicStartVert(wrapperEnd[1], replace)
  //       } else {
  //         wrapperStart[0].addMaxStartVert(wrapperStart[1], replace)
  //         wrapperEnd[0].addMaxEndVert(wrapperEnd[1], replace)
  //       }
  //       // DeBug.log(`wrapperStart`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperStart[0].cubicVerts,
  //       //   max: wrapperStart[0].maxCubicVerts,
  //       //   seg: { start: wrapperStart[0].start, end: wrapperStart[0].end }
  //       // })))
  //       // DeBug.log(`wrapperEnd`, JSON.parse(JSON.stringify({
  //       //   cub: wrapperEnd[0].cubicVerts,
  //       //   max: wrapperEnd[0].maxCubicVerts,
  //       //   seg: { start: wrapperEnd[0].start, end: wrapperEnd[0].end }
  //       // })))

  //       // DeBug.log(``)
  //       wrapped.start = wrapperStart[0]
  //       wrapped.end = wrapperEnd[0]
  //       // return wrapperStart[0]                                            // only return corner when both wrapped 
  //     }

  //     else if (startGapLength < endGapLength) {                           // wrap seg with shortest distance
  //       DeBug.log(`Wrapping end of start segment ${wrapperStart[0].id} with ${wrapperStart[1].string}`)
  //       DeBug.log(`prev availableEndLength: ${wrapperStart[0].availableEndLength}`)
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
  //       DeBug.log(`new availableEndLength: ${wrapperStart[0].availableEndLength}`)
  //     } else {
  //       DeBug.log(`Wrapping start of end segment ${wrapperEnd[0].id} with ${wrapperEnd[1].string}`)
  //       DeBug.log(`prev availableEndLength: ${wrapperStart[1].availableStartLength}`)
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
  //       DeBug.log(`new availableEndLength: ${wrapperStart[1].availableStartLength}`)
  //     }
  //     // DeBug.log(``)
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
  //   // DeBug.log(`recursiveOutWrapOutsideCorners input`, segCollection.map(s => s.id))
  //   let outsideCorners = new OpArray
  //   let insideCorners = new OpArray
  //   const collinears = this.outWrapOutsideCorners(segCollection, this.allSimpleSubShapes, radiant, replace)
  //     .compacted
  //   if (!collinears.isEmpty) {
  //     // DeBug.log(`recursiveOutWrapOutsideCorners collinears`, collinears)
  //     let colOut = new OpArray
  //     collinears.forEach(col => {
  //       if (col.start) { insideCorners.push(col.start) }
  //       if (col.end) { insideCorners.push(col.end) }
  //       if (col.start && col.end) { colOut.push(col.start) }
  //     })
  //     const adjacents = this.outWrapAdjacentInsideCorners({ segs: colOut, radiant: radiant, replace: replace })
  //       .compacted
  //     if (!adjacents.isEmpty) {
  //       // DeBug.log(`recursiveOutWrapOutsideCorners adjacents`, adjacents)
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
  //   // DeBug.log(`recursiveOutWrapAdjInsideCorners input`, segCollection)
  //   const adjacents = this.outWrapAdjacentInsideCorners({ segs: segCollection, radiant: radiant, replace: replace })
  //     .compacted
  //   if (!adjacents.isEmpty) {
  //     // DeBug.log(`recursiveOutWrapAdjInsideCorners adjacents`, adjacents)
  //     let adjOut = new OpArray
  //     adjacents.forEach(adj => {
  //       if (adj.start) { outsideCorners.push(adj.start) }
  //       if (adj.end) { outsideCorners.push(adj.end) }
  //       if (adj.start && adj.end) { adjOut.push(adj.start) }
  //     })
  //     const collinears = this.outWrapOutsideCorners(adjOut, this.allSimpleSubShapes, radiant, replace)
  //       .compacted
  //     if (!collinears.isEmpty) {
  //       // DeBug.log(`recursiveOutWrapAdjInsideCorners collinears`, collinears)
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
  //   DeBug.warn(`uTurns ${name}`, uTurns.map(u => [u.id, u.availableEndLength]))
  //   // DeBug.warn(`uTurns ${name}`, uTurns.map(u => u.availableEndLength))
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
  //         DeBug.log(`curving ${seg.id} both sides with radius: ${roundToDec(startRadius / this.minCellWidth)}`)
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

  //       DeBug.log(`resulting seg.hasBothVerts`, seg.hasBothVerts)

  //       if (outWrap) {
  //         // DeBug.log(`recursive processing of curved:`, curved.map(s => s.id))

  //         DeBug.log(`recursive outWrap of outsideCorners:`, outsideCorners.map(s => s.id))
  //         DeBug.log(`recursive outWrap of insideCorners:`, insideCorners.map(s => s.id))
  //         const wrapOuts = this.recursiveOutWrapOutsideCorners(outsideCorners, radiant)
  //         const wrapIns = this.recursiveOutWrapAdjInsideCorners(insideCorners, radiant)
  //         DeBug.log(`createUTurns wrapOuts`, wrapOuts)
  //         DeBug.log(`createUTurns wrapIns`, wrapIns)

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
  //   DeBug.warn(`createUTurns outsideCorners`, outsideCorners)
  //   DeBug.warn(`createUTurns insideCorners`, insideCorners)
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
  //       DeBug.log(`createCubicCorners seg hasNoCubicVerts`)
  //       useStartCorner = seg.startNeighbor.availableEndLength <= seg.endNeighbor.availableStartLength ? true : false
  //     } else if (seg.hasSomeCubicVerts) {
  //       DeBug.log(`createCubicCorners seg hasSomeCubicVerts`)
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
  //       DeBug.log(`I'm out wrapping yo!`)
  //       let wrapOuts
  //       let wrapIns
  //       if (cornerStart.turns.end.isRight) {
  //         DeBug.log(`making wrapOuts`)
  //         wrapOuts = this.recursiveOutWrapOutsideCorners(cornerStart, radiant, replace)
  //         outsideCorners.push(seg)                               // push outside corners for further processing
  //       } else {
  //         DeBug.log(`making wrapIns`)
  //         wrapIns = this.recursiveOutWrapAdjInsideCorners(cornerStart, radiant, replace)
  //         insideCorners.push(seg)                                // push inside corners for further processing
  //       }
  //       if (wrapOuts) {
  //         DeBug.log(`createCubicCorners wrapOuts`, wrapOuts)
  //         outsideCorners = outsideCorners.union(wrapOuts.outside, [`id`])
  //         insideCorners = insideCorners.union(wrapOuts.inside, [`id`])
  //       }
  //       if (wrapIns) {
  //         DeBug.log(`createCubicCorners wrapIns`, wrapIns)
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
  //   DeBug.error(`createCubicCorners outsideCorners`, outsideCorners)
  //   DeBug.error(`createCubicCorners insideCorners`, insideCorners)
  //   return { outside: outsideCorners.compacted.unique([`id`]), inside: insideCorners.compacted.unique([`id`]) }
  // }

  // MARK: Selection Methods
  // #region Selection Methods
  //FIXME: DEPRECATE: solved the allToCardinal copy issue with SegPath.cutAllToCardinal() instead
  //METH: ordinalConnectedCells() : [Cell] : find all ordinally connected cells in a selection
  ordinalConnectedCells({ selection = this.cells, groupID, islandID } = {}) {
    //ARROW: ordinalNeighbors()  : find ordinally connected neighbors of a cell
    const ordinalNeighbors = (cell) => {
      let validOrdinals = new OpArray
      Direction.Ordinal.directions.forEach(dir => {
        // console.log(`Grid.ordinalNeighbors: ${dir.vals}, `, dir.adjacents.directions)
        const neighbor = this.neighborIsInIsland(cell.index, dir, islandID)
        const adjacents = dir.adjacents.directions.map(adjDir => this.neighborIsInIsland(cell.index, adjDir, islandID))
        // console.warn(`ordinalConnectedCells: neighbor: ${neighbor.id}, adjacents:${adjacents?.map(c => c.id)}}`)
        if (neighbor && adjacents.every(adj => !adj)) { validOrdinals.push(this.neighbor(cell.index, dir)) }
      })
      return validOrdinals
    }

    let ordinals = selection
      .map(cell => ordinalNeighbors(cell)) // get ordinalNeighbors of every cell in selection
      .flat().unique(['id']) // flatten and reduce to unique
      .intersect(selection, ['id']) // intersect with selection to find ordinal neighbors within selection
    // if (groupID) { ordinals = ordinals.filter(cell => cell.groupID === groupID) } // filter group
    // if (islandID) { ordinals = ordinals.filter(cell => cell.islandIDs.has(islandID)) } // filter island
    return ordinals
  }
  //#endregion

  // MARK: Shape Methods
  // #region Shape Methods
  // //METH: drawShapes()
  // drawShapes() { this.shapes.forEach(s => s.drawElement()) }
  // #endregion
}

//CLASS: UnusedSelectionBounds
class UnusedSelectionBounds extends SelectionBounds {
  // MARK: Encoder properties 
  // #region Encoder properties
  //NOTE:https://pressbooks.library.upei.ca/statics/chapter/centre-of-mass-composite-shapes/
  get centerOfMass() {
    if (this.takenWeight === 1) { return vert(0, 0) }
    // print(this.cellAnchor)
    // print(this.cellsCentroid)
    const xWeight = this.xCellValues
      .map(x => x - this.cellsCentroid.x - this.cellAnchor.x + 0.5).numSorted
    const YWeight = this.yCellValues
      .map(y => y - this.cellsCentroid.y - this.cellAnchor.y + 0.5)
    // print(xWeight)
    // print(YWeight)
    return vert(xWeight.sum / this.selectionCount, -YWeight.sum / this.selectionCount)
  }

  get encoderRotation() {
    const com = this.centerOfMass
    // const dir = this.centerOfMass.quadrantDirection
    // print(dir)
    // print(`com.isZero: ${com.isZero}`)
    switch (this.aspect.value) {
      case 0: // square
        // print('square')
        if (com.isZero) { return 0 }        // (0,0)
        if (abs(com.x) === abs(com.y)) {    // x.mag = y.mag
          const angle = com.angleBetween(vert(1, -1))
          return (4 - round(angle * 2 / PI)) % 4
        }
        if (abs(com.x) > abs(com.y)) {      // x.mag > y.mag
          return (com.x > 0) ? 1 : 3        // x > 0
        } else {                            // x.mag <= y.mag
          return (com.y > 0) ? 2 : 0        // y > 0
        }
      case 1: // portrait
        // print('portrait')
        if (com.isZero) { return 0 }        // (0,0)
        if (com.y === 0) {                  // y = 0
          // print('vert is balanced, use hor weight')
          return (com.x > 0) ? 0 : 2        // x > 0
        }
        return (com.y > 0) ? 2 : 0          // y > 0
      case 2: // landscape
        // print('landscape')
        if (com.isZero) { return 1 }        // (0,0)
        if (com.x === 0) {                  // x = 0
          // print('hor (rotated vert) is balanced, use vert weight')
          return (com.y > 0) ? 1 : 3        // y > 0
        }
        return (com.x > 0) ? 1 : 3          // x > 0
    }
  }

  get encoderRotDegrees() { return this.encoderRotation * 90 }

  get encoderCells() { return this.grid.cellRowsRotated(this.boundCellRows, this.encoderRotDegrees) }

  get encodingCosts() {
    return vert(
      this.encodingCellCount - this.encodingWeight('horizontal'),
      this.encodingCellCount - this.encodingWeight('vertical')
    )
  }

  get encodingEfficiency() {
    return min(this.encodingCosts.x, this.encodingCosts.y) / (this.cellBoundsCount * 2)
  }

  get encodingCellCount() { return this.isMostlyTaken ? this.availableCount : this.selectionCount }

  //TODO: complete implementation
  get encodedShape() {
    let cells
    if (this.isMostlyTaken) { cells = this.availableCells }
    else { cells = this.selection }

    // const horCellLines = this.innerCellIslands()
    const horCellLines = this.horCellIslands
    // print(horCellLines)
    const vertCellLines = this.vertCellIslands
    // print(vertCellLines)
  }
  // #endregion
  // MARK: Encoder methods 
  // #region Encoder methods 
  //METH: 
  encodingWeight(direction) {
    if (this.isFull) { return 0 }
    let name
    if (direction instanceof Direction) { name = direction.name }
    else { name = direction }
    let minMax, islands, rowColVals
    switch (name) {
      case 'horizontal':
        minMax = this.yMinMax
        islands = this.horCellIslands
        rowColVals = islands.map(e => e.cellAnchor.y - minMax.x).numSorted.unique()
        break
      case 'vertical':
        minMax = this.xMinMax
        islands = this.vertCellIslands
        rowColVals = islands.map(e => e.cellAnchor.x - minMax.x).numSorted.unique()
        break
      default:
        throw new Error('Invalid Direction: Only horizontal and vertical accepted')
    }
    // print(`${name} islands`)
    // print(islands)
    const islandSavings = islands.filter(e => e.cellCount > 2)
      .map(e => e.cellCount - 2)
      .sum

    // print(`${name} rowColVals: ${rowColVals}`)
    // print(`skippingloop:`)

    let skipping = false
    let skips = 0
    for (let i = 0; i <= (minMax.y - minMax.x); i++) {
      // print(`index: ${i}`)
      if (rowColVals.some(e => e === i)) {
        // print(`index: ${i} is not skipping`)
        if (skipping) {
          skips++
          skipping = false
        }
      } else {
        // print(`index: ${i} is skipping`)
        if (!skipping) { skipping = true }
      }
    }
    // print(`${name} islandSavings: ${islandSavings}`)
    print(`${name} skips: ${skips}`)
    // print(`${name} Total: ${islandSavings - skips}`)
    // print(``)
    return islandSavings - skips
  }
  // #endregion
}

class OldestCode {
  //MARK: oldFunctionsNeedToLiveInAMethod!!!

  layout() {
    //NOTE: this was layout.js, created July 5, 2022

    // MARK: CONSTANTS
    const nonAdjRows = [[3, 4], [7, 8], [11, 12], [15, 16], [19, 20], [23, 24], [27, 28]]
    const nonAdjColumns = [[28, 1], [29, 2], [30, 3]]


    const originalMap = [
      0, 1, 2, 3,
      4, 5, 6, 7,
      8, 9, 10, 11,
      12, 13, 14, 15,
      16, 17, 18, 19,
      20, 21, 22, 23,
      24, 25, 26, 27,
      28, 29, 30, 31
    ]
    const columnSort = [
      0, 4, 8, 12, 16, 18, 24, 28,
      1, 5, 9, 13, 17, 21, 25, 29,
      2, 6, 10, 14, 18, 22, 26, 30,
      3, 7, 11, 15, 19, 23, 27, 31
    ]

    // const columnRemap = [
    //   0, 8, 16, 24,
    //   1, 9, 17, 25,
    //   2, 10, 18, 26,
    //   3, 11, 19, 27,
    //   4, 12, 20, 28,
    //   5, 13, 21, 29,
    //   6, 14, 22, 30,
    //   7, 15, 23, 31,
    // ]

    const testInput = [
      60, 16, 24,
      30, 31, 37,
      45, 63, 30
    ]

    const testLayoutX = 3
    const testLayoutY = 3
    const testIndices = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

    // TODO: integrate with Grid and GridGroup Classes

    // MARK: Newer Grid Layout Functions

    // create ordered index slices for each row in a grid layout
    function gridRowIndices(x, y) {
      let rows = [...Array(y).keys()]
      let baseRow = [...Array(x).keys()]
      return rows.map(e => {
        return baseRow.map(f => f + (e * x))
      })
    }
    // create ordered index slices for each column in a grid layout
    function gridColumnIndices(x, y) {
      let columns = [...Array(x).keys()]
      let baseColumn = [...Array(y).keys()].map(e => e * x)
      return columns.map(e => {
        return baseColumn.map(f => e + f)
      })
    }
    // map an array to an array of sliced indices
    function inputToIndices(input = testInput, indices = testIndices) {
      return indices.map(e => { return e.map(f => input[f]) })
    }

    function inputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let indices = gridRowIndices(gridX, gridY)
      return inputToIndices(input, indices)
    }

    function printInputToGridRows(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let rows = inputToGridRows(input, gridX, gridY)
      rows.forEach((e, i) => {
        // print('hi')
        // print(`row ${i}`)
        print(e ? e : 'empty')
      })
    }

    function inputToGridColumns(input = testInput, gridX = testLayoutX, gridY = testLayoutY) {
      let indices = gridColumnIndices(gridX, gridY)
      return inputToIndices(input, indices)
    }

    // find index pairs of similar neighbors in an array
    function similarNeighborsIndices(threshold, input = testIndices) {
      let pairs = []
      for (let i = 0; i < (input.length - 1); i++) {
        if (abs(input[i] - input[i + 1]) <= threshold) {
          pairs.push([i, i + 1])
        }
      }
      return pairs
    }
    // find similar neighbor index pairs in multiple slices
    function similarSlicedNeighborsIndices(threshhold, input = testInput, indices = testIndices) {
      let slices = inputToIndices(input, indices)
      let neighbors = slices.map((e, i) => {
        let localNeighbors = similarNeighborsIndices(threshhold, e)
        // print(`localNeighbors[${i}]:${localNeighbors}`)
        let reindexedNeighbors = localNeighbors.map(f => {
          return f.map(g => indices[i][g])
        })
        // print(`reindexedNeighbors:${reindexedNeighbors}`)
        return reindexedNeighbors
      })
      // print(neighbors.flat())
      return neighbors.flat()
    }
    // find all similar neighbor index pairs in a grid
    function similarGridNeighbors(threshold, gridX = testLayoutX, gridY = testLayoutY, input = testInput) {
      let rowsIndex = gridRowIndices(gridX, gridY)
      let columnsIndex = gridColumnIndices(gridX, gridY)
      let rowNeighbors = similarSlicedNeighborsIndices(threshold, input, rowsIndex)
      let columnNeighbors = similarSlicedNeighborsIndices(threshold, input, columnsIndex)
      // print(`rowNeighbors: ${rowNeighbors}`)
      // print(`columnNeighbors: ${columnNeighbors}`)
      // print([[...rowNeighbors], [...columnNeighbors]].flat())
      return [[...rowNeighbors], [...columnNeighbors]].flat()
    }

    // TODO: DEPRECATE
    // MARK: OG LAYOUT FUNCTIONS
    function createBaseDivs(array = [1, 2, 3, 4]) {
      divs = []
      // create square divs using rns
      if (array.length == 32) {
        divs = array.forEach((e, i) => createSquareBase(e, i))
      }

      // create rect divs using rns64
      if (array.length == 64) {
        divs = array.forEach(
          (e, i) => {
            if (!(i % 2)) {
              createRectBase(e, array[i + 1], (i / 2))
            }
          }
        )
      }
      return divs
    }

    function createCnctDivs(array = [1, 2, 3, 4]) {
      divs = []
    }

    function createSquareBase(e, i) {
      let randomSize = map(e, 0, 255, 4, 30) + "%";
      let iHex5 = hex5[i]
      let name = iHex5 + '\n' + e

      let div = createDiv(name);
      div.style("color", "#ffffff");
      div.style("background-color", "#666666");
      // div.style("transform", "rotate(" + random(-90, 90) + "deg)");
      div.style("padding", randomSize);
      div.style("text-align", "center");
      div.style("border-radius", "20%");
      div.id("div" + i);
      div.parent(b4);
      return div
    }


    function createRectBase(x, y, i) {
      let iHex5 = hex5[i]
      let xMap = floor(map(x, 0, 15, 0, 100))
      let yMap = floor(map(y, 0, 15, 0, 100))
      let xSize = xMap + "px";
      let ySize = yMap + "px";
      let randomSize = xSize + " " + ySize;
      // let baseName = 
      let radius = min(xMap, yMap) / 1 + "px"

      let div = createDiv();
      div.id("div:" + iHex5);
      div.parent(b4);

      if (min(x, y) > 1) {
        div.style("color", "#ffffff")
        div.style("background-color", "#666666");
        // div.style("transform", "rotate(" + random(-180, 180) + "deg)");
        div.style("width", xSize)
        div.style("height", ySize)
        // div.style("padding", randomSize);
        // div.style("display", "flex");
        div.style("line-height", ySize)
        div.style("text-align", "center");
        div.style("justify-items", "center");
        div.style("align-items", "center");
        div.style("border-radius", radius);

        // createDiv(iHex5 + ':' + x + 'x' + y)
        //  .parent(div);
      }
      return div
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

    // TODO:DEPRECATE - DOES NOT WORK! I think I've already replaced all of this somewhere
    // MARK: HASH SEED FUNCTIONS
    // function allConnects(threshold, input = [1, 2, 3, 4], remap = []) {
    //   let rowConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjRows));
    //   let columnConnects = pointsToHex5s(adjacentPairs(threshold, input, nonAdjColumns, remap));
    //   rowConnects.push(...columnConnects);
    //   return rowConnects
    // }

    // function adjacentPairs(threshold, input = [1, 2, 3, 4], exclude = [], remap = []) {
    //   let previous = -300
    //   let pairs = []
    //   let array = remapByIndex(input, remap)
    //   for (let i = 0; i < array.length; i++) {
    //     let e = array[i]
    //     if (abs(e - previous) <= threshold) {
    //       let match = [i - 1, i]
    //       if (exclude.includes(match) == false) {
    //         pairs.push(match)
    //       }
    //     }
    //     previous = e
    //   }
    //   // pairs
    //   return pairs
    // }
  }
}