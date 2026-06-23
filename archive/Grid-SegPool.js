// Archived from Grid.js (2026-06). Not loaded by index.html — see archive/README.md.

// Island inset segment pooling — never instantiated in production (sketch.js ref commented).
//MARK: SegPool CLASS
class SegPool {
  constructor(segments, shape) {
    this.segments = segments.flat(Infinity)
    this.shape = shape
  }

  //METH: unitRefined() : SegPath : take a unit inset/outset path and remove collinear and zero length segments
  unitRefined() {
    DeBug.groupCollapsed(`unitRefined`)
    DeBug.error(`unitRefined()`, this.segments)
    let
      pathCopy = this.segments.copy,
      zeroSegs = pathCopy.filter(s => s.isVert),
      newPath = new OpArray,
      overlaps = new OpArray,
      removed = new OpArray,
      length = pathCopy.length

    pathCopy = pathCopy.exclude(zeroSegs, `id`)                     // exclude zero segs from pathCopy

    //ARROW: remove() : null : remove seg from neighbors' neighbors
    const remove = (seg) => {
      seg.removeBothNeighbors()
    }

    while (length > 0) {
      DeBug.warn(`pathCopy start`, pathCopy)
      const seg = pathCopy.shift()                                  // remove first seg
      DeBug.log(`current seg`, seg)

      // if (!seg.isVert) {
      let overlap = pathCopy.filter(s =>
        s.isOverlappingWith({ seg: seg, includeEnds: true, includeEndToEnd: false, accuracy: 0 })
        && !s.isEndToEnd(seg)
      ) // find overlaps
      DeBug.log(`overlap`, overlap)
      if (!overlap.isEmpty) {
        if (overlap.length === 1) {                                         // single overlap
          DeBug.error(`single overlap`, overlap)
          overlaps.push(seg)
          const
            singleSeg = overlap[0],                                         // single overlap seg
            intersection = seg.intersectionWith(singleSeg),                 // intersection of seg and singleSeg
            isPartialXOfThis = !intersection.equals(seg, 3, true),          // intersection only partially covers this seg
            isPartialXOfOverlap = !intersection.equals(singleSeg, 3, true)  // intersection only partially covers singleSeg
          DeBug.log(`singleSeg`, singleSeg)
          DeBug.log(`intersection`, intersection)

          if (isPartialXOfThis) {
            DeBug.error(`isPartialXOfThis`, isPartialXOfThis)
            const newSegs = seg.exclude(intersection)                       // exclude intersection seg from seg
            newPath = newPath.union(newSegs, `id`)                          // add new segs to newPath
            DeBug.log(`newSegs`, newSegs)
          }
          if (isPartialXOfOverlap) {
            DeBug.error(`isPartialXOfOverlap`, isPartialXOfOverlap)
            const newSegs = singleSeg.exclude(intersection)                 // exclude intersection seg from singleSeg
            newPath = newPath.union(newSegs, `id`)                          // add new segs to newPath
            DeBug.log(`newSegs`, newSegs)
          }
          overlaps.push(singleSeg)
          pathCopy = pathCopy.exclude(singleSeg, `id`)                      // exclude overlap seg from pathCopy
        }

        if (overlap.length > 1) {                                           // multiple overlaps
          DeBug.error(`Multiple overlaps!!!`, overlap)
          //FIXME: sort overlaps by closest distance to seg end
          //FIXME: make single overlap processing above into arrowFung then handle each one at a time
          //FIXME: in each loop, push the first newSeg (closest to seg end) to newPath
          //FIXME: then replace seg with the second newSeg and restart the loop

        }

      } else {
        DeBug.error(`no overlap`, seg)
        newPath.push(seg)
      }
      // } else {
      //   DeBug.error(`zero length seg`, seg)
      //   zeroSegs.push(seg)
      // }

      length = pathCopy.length
      DeBug.warn(`pathCopy end`, pathCopy)
    }
    DeBug.log(`newPath`, newPath)
    DeBug.log(`overlaps`, overlaps)
    DeBug.log(`removed`, removed)
    DeBug.log(`zeroSegs`, zeroSegs)
    DeBug.log(``)
    DeBug.groupEnd()
    DeBug.log(``)
    if (!newPath.isEmpty) {
      removed.forEach(seg => remove(seg))                           // remove zero segs from neighbors  
      overlaps.forEach(seg => remove(seg))                          // remove overlaps from neighbors
      DeBug.warn(`Shape ${this.shape.id} has a new path1`, newPath)
      DeBug.log(``)
      return new SegPath(newPath, this.shape)
    }
    else {
      DeBug.error(`NO ZERO PATH!, Shape ${this.shape.id} has max thickness of 1!!!`)
      DeBug.log(``)
    }



    // this.path.forEach((seg, i) => {
    //   // DeBug.log(`current Seg`, seg)
    //   if (roundToDec(seg.length) > 0) {
    //     const
    //       pathNoSeg = this.path.exclude(seg, `id`)                     // exclude current seg
    //     // DeBug.log(`pathNoSeg`, pathNoSeg)
    //     const
    //       overlaps = pathNoSeg.filter(s => s.isOverlappingWith({ seg: seg, includeEnds: false }))    // find overlaps
    //     DeBug.log(`overlaps`, overlaps)
    //     let removed = new OpArray, newSeg

    //     if (!overlaps.isEmpty) {
    //       overlaps.forEach(overlap => {
    //         const remove = seg.intersectionWith(overlap)
    //         if (remove && remove instanceof Segment) {
    //           DeBug.log(`remove`, remove)
    //         }
    //       })
    //     }

    //   } else {
    //     DeBug.error(`zero length seg`, seg)
    //   }
    // })
  }

  //   //METH: assembleShapes() : [SegPath] : assemble the segments into connected shape paths
  //   assembleShapes() {
  //     let
  //       segments = OpArray.format(this.segments),
  //       subShapes = new OpArray,
  //       shapeIter = 0,
  //       subShapeIter = 0

  //     DeBug.log(`createShape for ${this.id}, insetScale`, insetScale)
  //     DeBug.log(`createShape`, this)
  //     DeBug.log(`segments`, segments)

  //     //ARROW: findShape(seg) : find each shape within an island
  //     const findShape = () => {
  //       let subShape
  //       while (segments.length > 0) {
  //         shapeIter += 1
  //         let
  //           segment = segments[0],
  //           fillstack = []
  //         subShape = new OpArray

  //         //ARROW: findSubShape(seg) : find each subShape within a shape
  //         const findSubShape = (seg) => {
  //           fillstack.push(seg)

  //           while (fillstack.length > 0) {
  //             subShapeIter += 1
  //             //find next segments (could be 2 if allowing ordinal island connections)
  //             let
  //               thisSeg = fillstack.pop(), nextSeg,
  //               next = segments
  //                 .filter(s => thisSeg.end.equals(s.start, 4))
  //                 .compacted

  //             if (next.length === 0) {
  //               if (thisSeg.end.equals(subShape[0].start, 4)) {
  //                 thisSeg.assignNeighbors({ end: subShape[0] })
  //                 subShape[0].assignNeighbors({ start: thisSeg })
  //                 subShape.push(thisSeg)
  //                 return
  //               } else {
  //                 DeBug.log('thisSeg.end', thisSeg.end)
  //                 DeBug.log('subShape[0].start', subShape[0].start)
  //                 DeBug.error('cannot continue segmentShape')
  //               }
  //             }
  //             if (next.length === 1) nextSeg = next[0]
  //             if (next.length === 2) {
  //               DeBug.error('next has 2 segments')
  //               let nextDirection

  //               if (this.direction.someAreOrdinal) nextDirection = thisSeg.direction.previous(2)
  //               else nextDirection = thisSeg.direction.next(2)

  //               nextSeg = next.find(e => e.direction.equals(nextDirection))
  //               // DeBug.log(`thisSeg here`, thisSeg)
  //               // DeBug.log(`nextSeg here`, nextSeg)
  //               if (!nextSeg) DeBug.error('unexpected 2nd segment')
  //             }
  //             // DeBug.log(``)
  //             // DeBug.log(this.grid.groups)
  //             // DeBug.log(this.id)
  //             // DeBug.group(`testgroup`)
  //             // DeBug.log(`subShape ${this.id} iter ${subShapeIter}`, segments)
  //             // DeBug.log(`thisSeg`, thisSeg)
  //             // DeBug.log(`nextSeg`, nextSeg)
  //             // DeBug.groupEnd()
  //             thisSeg.assignNeighbors({ end: nextSeg })
  //             nextSeg.assignNeighbors({ start: thisSeg })
  //             fillstack.push(nextSeg)
  //             subShape.push(thisSeg)
  //             segments = segments.exclude(subShape, ['id'])
  //           }
  //         }

  //         findSubShape(segment)
  //         segments = segments.exclude(subShape, ['id'])
  //         subShapes.push(subShape)
  //         if (subShapes.length === 1) {                 // re-sort inner subshapes for counter-clockwise processing
  //           segments = segments.counterGridVertSorted
  //         }
  //       }
  //     }

  //     findShape(this.direction)

  //   }

}