// Archived from drawAsSVG.js SegPath + sketch.js test harness (2026-06).
// Not loaded by index.html — see archive/README.md.
//
// Incomplete experiment: more accurate mask shapes by cutting overlapping segments
// when shrinking island outlines by 1 unit (insetScale 0). Useful for InterGrids
// and related future structures.
//
// Related archives:
//   - Grid-SegPool.js — pool-level unitRefined() over flattened insetSubShapes
//   - ProtoLayer-interGrid.js, Island-unused.js, Cell-unused.js — InterGrid foundation
//   - Grid-maximizeCuddles-experiments.js — quad/cuddle pipeline that fed this work

// ── sketch.js — UnitRefined test (paste into draw() debug block) ──────────────

// DeBug.error(`UnitRefined Test`)
// DeBug.groupCollapsed(`UnitRefined Test`)
// GRID.groups.forEach((g, i) => {
//   DeBug.warn(`group`, g.id, g)
//   g.perimeterIslands.forEach((i, j) => {
//     DeBug.warn(`island`, i.id, i)
//     const zeroScaled = i.shape.copy({ insetScale: 0, protoParent: i.grid, island: i })
//     DeBug.log(`zeroScaled`, zeroScaled)
//     DeBug.log(`zeroScaled paths`, zeroScaled.insetSubShapes)
//
//     let newShapes
//     if (i.cellBounds.isFull) {
//       if (i.cellBounds.minCellThickness > 1) {
//         DeBug.warn(`NEW SHAPES! is Rect with minThickness:`, i.cellBounds.minCellThickness)
//         newShapes = zeroScaled.insetSubShapes
//         DeBug.log(``)
//       } else {
//         DeBug.error(`NO ZERO PATH! is Rect with minThickness 1`)
//         newShapes = []
//         DeBug.log(``)
//       }
//     } else {
//       newShapes = new SegPool(zeroScaled.insetSubShapes, i.shape)
//         .unitRefined()
//     }
//
//     // const newShapes = zeroScaled.simpleInsetSegPaths.map((p, i) => p.unitRefined())
//     DeBug.log(`newShapes`, newShapes)
//     // DeBug.log(`newPool`, newPool)
//   })
// })
// DeBug.groupEnd()

// ── SegPath.unitRefined() — per-path variant (SegPool pools all inset segments) ─

// Paste onto SegPath after insetPath():

//METH: unitRefined() : SegPath : take a unit inset/outset path and remove collinear and zero length segments
// unitRefined() {
//   DeBug.error(`unitRefined()`, this.path)
//   let
//     pathCopy = this.path.copy,
//     zeroSegs = pathCopy.filter(s => s.isVert),
//     newPath = new OpArray,
//     overlaps = new OpArray,
//     removed = new OpArray,
//     length = pathCopy.length
//
//   pathCopy = pathCopy.exclude(zeroSegs, `id`)                     // exclude zero segs from pathCopy
//
//   //ARROW: remove() : null : remove seg from neighbors' neighbors
//   const remove = (seg) => {
//     seg.removeBothNeighbors()
//   }
//
//   while (length > 0) {
//     DeBug.warn(`pathCopy start`, pathCopy.map(s => s.id))
//     const seg = pathCopy.shift()                                  // remove first seg
//     DeBug.log(`current seg`, seg)
//
//     if (seg.length > 0) {
//       let overlap = pathCopy.filter(s => s.isOverlappingWith({ seg: seg, includeEnds: true }))
//       DeBug.log(`overlap`, overlap)
//       if (!overlap.isEmpty) {
//         // DeBug.log(`overlap`, overlap)
//
//         if (overlap.length === 1) {                               // single overlap
//           DeBug.error(`single overlap`, overlap)
//           overlaps.push(seg)
//           const
//             singleSeg = overlap[0],                               // single overlap seg
//             intersection = seg.intersectionWith(singleSeg),       // intersection of seg and singleSeg
//             isPartialXOfThis = !intersection.equals(seg),         // intersection only partially covers this seg
//             isPartialXOfOverlap = !intersection.equals(singleSeg) // intersection only partially covers singleSeg
//
//           if (isPartialXOfThis) {
//             DeBug.error(`isPartialXOfThis`, isPartialXOfThis)
//             const newSegs = seg.exclude(intersection)             // exclude intersection seg from seg
//             DeBug.log(`newSegs`, newSegs)
//           }
//           if (isPartialXOfOverlap) {
//             DeBug.error(`isPartialXOfOverlap`, isPartialXOfOverlap)
//             const newSegs = singleSeg.exclude(intersection)       // exclude intersection seg from singleSeg
//             DeBug.log(`newSegs`, newSegs)
//           }
//           overlaps.push(singleSeg)
//           pathCopy = pathCopy.exclude(singleSeg, `id`)            // exclude overlap seg from pathCopy
//         }
//
//         if (overlap.length > 1) {                                 // multiple overlaps
//           DeBug.error(`Multiple overlaps!!!`, overlap)
//
//
//         }
//
//       } else {
//         DeBug.error(`no overlap`, seg)
//         newPath.push(seg)
//       }
//     }
//     else {
//       DeBug.error(`zero length seg`, seg)
//       removed.push(seg)
//     }
//     length = pathCopy.length
//     DeBug.warn(`pathCopy end`, pathCopy.map(s => s.id))
//   }
//   DeBug.log(`newPath`, newPath)
//   DeBug.log(`overlaps`, overlaps)
//   DeBug.log(`removed`, removed)
//   DeBug.log(`zeroSegs`, zeroSegs)
//   DeBug.log(``)
//
//   if (!newPath.isEmpty) {
//     removed.forEach(seg => remove(seg))                           // remove zero segs from neighbors
//     overlaps.forEach(seg => remove(seg))                          // remove overlaps from neighbors
//     return new SegPath(newPath, this.shape)
//   }
//   else {
//     DeBug.error(`NO ZERO PATH!, Shape ${this.shape.parentID} has max thickness of 1!!!`)
//     DeBug.log(``)
//   }
//
//
//   // this.path.forEach((seg, i) => {
//   //   // DeBug.log(`current Seg`, seg)
//   //   if (roundToDec(seg.length) > 0) {
//   //     const
//   //       pathNoSeg = this.path.exclude(seg, `id`)                     // exclude current seg
//   //     // DeBug.log(`pathNoSeg`, pathNoSeg)
//   //     const
//   //       overlaps = pathNoSeg.filter(s => s.isOverlappingWith({ seg: seg, includeEnds: false }))    // find overlaps
//   //     DeBug.log(`overlaps`, overlaps)
//   //     let removed = new OpArray, newSeg
//
//   //     if (!overlaps.isEmpty) {
//   //       overlaps.forEach(overlap => {
//   //         const remove = seg.intersectionWith(overlap)
//   //         if (remove && remove instanceof Segment) {
//   //           DeBug.log(`remove`, remove)
//   //         }
//   //       })
//   //     }
//
//   //   } else {
//   //     DeBug.error(`zero length seg`, seg)
//   //   }
//   // })
// }
