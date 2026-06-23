// Archived from drawAsSVG.js (SegPath + VertPath) and ProtoLayerObjects.js Frame (2026-06).
// Not loaded by index.html — see archive/README.md.
//
// Unfinished experiment: convert rectilinear stair corners (alternating right-left
// min-radius segments) into diagonal lines across backGrid perimeter shapes.
// Planned revisit post-Prototypes launch.
//
// Production still uses ProtoSegment.isStair / Part.isStair* for live stair geometry;
// only the SegPath conversion pipeline was archived here.

// ── Frame.setBackGridGroup() call site ────────────────────────────────────────
// After wrap + segPaths logging, before padWidth calculation:
//
//     // const diagPaths = segPaths.map(p => p.withDiagonals())
//     // DeBug.log(`segPaths`, segPaths[0].path.map(s => [s.id, s.start.string, s.end.string]))
//     // DeBug.log(`segPaths`, segPaths[0].diagonalsPath.map(s => [s.id, s.start.string, s.end.string]))
//     // DeBug.log(`diagPaths`, diagPaths[0])
//     // DeBug.log(`diagPaths cubicVerts`, diagPaths[0].map(s => [s.start.string, s.cubicVerts.start?.string, s.cubicVerts.end?.string, s.end.string]))
//     // shapes.forEach((s, i) => s.simpleSubShapes = diagPaths)
//     // backGrid.maximizeCuddles()
//
// Also: // .map(p => p.stairs).flat() on segPaths chain

// ── SegPath field ─────────────────────────────────────────────────────────────
// diagonalsPath

// ── SegPath getters ───────────────────────────────────────────────────────────

// get stairs() {
//   if (!this.diagonalsPath) this.diagonalsPath = this.path.copy
//   return this.diagonalsPath.filter(s => s.isStair)
// }

//FIXME: still have an issue recognizing final stairs on #559
// get stairSets() {
//   DeBug.log(``)
//   let stairSets = new OpArray, firstStair, lastStair, stairSet
//   this.stairs.forEach((seg, i) => {
//     let current = seg
//     if (lastStair) {
//       //TODO: In order to get non-ordinal results in future, need to adapt minLength checks. Maybe a previousLength prop?
//       if (current.id === lastStair.endNeighbor.id && lastStair.isMinLength && current.isMinLength) {
//         if (!stairSet) stairSet = OpArray.format(lastStair)
//         stairSet.push(current)
//         if (i === this.stairs.lastIndex) stairSets.push(stairSet)
//       } else {
//         stairSets.push(stairSet)
//         stairSet = undefined
//       }
//     } else firstStair = current
//     lastStair = current
//   })
//   stairSets = stairSets.compacted
//   DeBug.log(``)
//   if (!stairSets.isEmpty) return stairSets
// }

// ── SegPath methods — paste onto SegPath class in drawAsSVG.js ────────────────

//FIXME: Finish implementation
// withDiagonals() {
//   DeBug.log(``)
//   DeBug.warn(`withDiagonals`)
//   this.stairSets?.forEach((set, i) => {
//     DeBug.error(`currentset`, set)
//     const count = set.length, firstTurn = set.first.endTurn.direction
//     let possibleMoves, preferredMove
//     if (count === 2) possibleMoves = firstTurn
//     if (count > 2) possibleMoves = Direction.Horizontal
//     if (count % 2 === 1) preferredMove = this.isCutOut ? Direction.Right : Direction.Left
//     DeBug.log(`count`, count)
//     DeBug.log(`firstTurn`, firstTurn)
//     DeBug.log(`firstTurn`, firstTurn.name)
//     DeBug.log(`possibleMoves`, possibleMoves.name)
//     DeBug.log(`preferredMove`, preferredMove?.name)
//     const availableMoves = possibleMoves.directions.map(dir => {
//       const name = dir.name,
//         segs = set.filter(s => dir.isRight ? s.cells[0]?.isAvailable : s.outsideCells[0]?.isAvailable)
//       if (segs.length > 0) return { name, segs }
//     }).compacted.sort((a, b) => b.segs.length - a.segs.length)
//     DeBug.log(`availableMoves`, availableMoves)
//     if (availableMoves.isEmpty) return
//     let finalMoves
//     if (preferredMove && availableMoves[0].segs.length === availableMoves[0].segs.length) {
//       finalMoves = availableMoves.find(move => move.name === preferredMove.name)
//     } else finalMoves = availableMoves[0]
//     DeBug.warn(`finalMoves!!!`, finalMoves)
//     const diagPath = this.convertToDiagonals(finalMoves)
//   })
//   this.path = this.diagonalsPath
//   return this.path
// }

// convertToDiagonals(moves) {
//   const { name, segs } = moves,
//     segCount = segs.length,
//     hasEvenCount = segCount % 2 === 0,
//     moveOut = name === `left`,
//     startsStairIn = segs[0].part.isStairIn,
//     startHasSmallRad = moveOut === startsStairIn,
//     change = sqrt(2) - 1
//   DeBug.warn(`convertToDiagonals segs`, segs)
//   const ordinalSegment = () => {
//     const startNeighbor = segs.first.startNeighbor, endNeighbor = segs.last.endNeighbor,
//       startRad = startNeighbor.arcRadius,
//       curveStartReduce = startHasSmallRad ? (1 - change) * startRad : (1 + change) * startRad,
//       diagStartVert = startNeighbor.distancedEndPoint(curveStartReduce),
//       diagDir = startHasSmallRad ? startNeighbor.direction.next() : startNeighbor.direction.previous(),
//       cellDiagLength = 2 * sqrt(2 * startRad * startRad),
//       diagMag = (segCount - 1) * cellDiagLength,
//       diagVect = diagDir.lineVector.setMag(diagMag),
//       diagEndVert = Vertex.add(diagVect, diagStartVert),
//       simpleDiagonal = segment(diagStartVert, diagEndVert),
//       cellsSelect = moveOut ? `cells` : `outsideCells`,
//       cells = [startNeighbor[cellsSelect].last, endNeighbor[cellsSelect].first],
//       normDir = simpleDiagonal.normalDirection,
//       sideDir = moveOut ? normDir : normDir.opposites,
//       smallCubicDist = change * startRad,
//       largeCubicDist = hasEvenCount ? smallCubicDist : cellDiagLength - smallCubicDist,
//       diagCubicDists = startHasSmallRad ? [smallCubicDist, largeCubicDist] : [largeCubicDist, smallCubicDist],
//       cubicStart = simpleDiagonal.distancedStartPoint(diagCubicDists[0]),
//       cubicEnd = simpleDiagonal.distancedEndPoint(diagCubicDists[1]),
//       cubicVerts = { start: cubicStart, end: cubicEnd },
//       id = `diagonal-${sideDir.name}-${cells[0].id}-${segs.first.sideDir.name}Side-to-${cells[1].id}-${segs.last.sideDir.name}Side`
//     return protoSegment({ start: diagStartVert, end: diagEndVert, id, islandIDs: startNeighbor.islandIDs, cells, sideDir, cubicVerts })
//   }
//   let turnStart, turnEnd, diagonal, current, diagonals = new OpArray, removals = segs.copy
//   segs.forEach((s, i) => {
//     const idSuffix = (seg, isStart) => `${seg.cells[isStart ? `first` : `last`].id}-${seg.sideDir.name}Side`
//     const terminalSegs = (s, isStart) => {
//       if (isStart) {
//         removals.push(s.startNeighbor.copy())
//         turnStart = s.startNeighbor.copy()
//         diagonal = ordinalSegment()
//         DeBug.log(`diagonal`, diagonal)
//         turnStart.id = `turnStart-${idSuffix(turnStart, false)}`
//         turnStart.end = diagonal.start
//       } else {
//         removals.push(s.endNeighbor.copy())
//         turnEnd = s.endNeighbor.copy()
//         turnEnd.id = `turnEnd-${idSuffix(turnEnd, true)}`
//         turnEnd.start = diagonal.end
//       }
//     }
//     const diagonalSegs = (seg, mode = 0) => {
//       const intersect = (isStart) => {
//         const neighbor = isStart ? seg.startNeighbor : seg.endNeighbor
//         return diagonal.intersectionWith(neighbor.arcOriginToNormal)
//       }
//       const cells = moveOut ? seg.cells : seg.outsideCells,
//         sideDir = moveOut ? diagonal.normalDirection : diagonal.normalDirection.opposites,
//         suffix = `${cells[0].id}-${sideDir.name}`
//       let start, end, idName, cubicVerts
//       switch (mode) {
//         case 0: start = intersect(true); end = intersect(false); idName = `diag`; cubicVerts = { start, end }; break
//         case 1: start = diagonal.start; end = intersect(true); idName = `diagStart`; cubicVerts = { start: end, end }; break
//         case 2: start = intersect(true); end = diagonal.end; idName = `diagEnd`; cubicVerts = { start, end: start }; break
//       }
//       return seg.copy({ start, end, id: `${idName}-${suffix}`, cells, points: null, sideDir, cubicVerts, neighbors: null })
//     }
//     if (i === 0) terminalSegs(s, true)
//     if (i === segs.lastIndex) terminalSegs(s, false)
//     else if ((moveOut && i % 2 === 0) || (!moveOut && i % 2 === 1)) {
//       current = diagonalSegs(s)
//       diagonals.push(current)
//     }
//   })
//   const diagPath = OpArray.format([turnStart, diagonal, turnEnd])
//   DeBug.warn(`diagPath`, diagPath)
//   //FIXME: THE ISSUE IS STILL TODO WITH newPath/this.path not having the diagSegs added in previous step!!
//   let newPath = this.diagonalsPath
//   diagPath.forEach((seg, i) => {
//     if (i === 0) newPath.find(s => s.id === seg.startNeighbor.id).assignNeighbors({ end: seg })
//     if (i > 0) seg.assignNeighbors({ start: diagPath[i - 1] })
//     if (i < diagPath.lastIndex) seg.assignNeighbors({ end: diagPath[i + 1] })
//     if (i === diagPath.lastIndex) newPath.find(s => s.id === seg.endNeighbor.id).assignNeighbors({ start: seg })
//   })
//   newPath = newPath.exclude(removals, `id`).union(diagPath, `id`)
//   newPath = newPath[0].segPath
//   this.diagonalsPath = newPath
//   if (this.stairSets && this.stairSets[0][0].startNeighbor.id === segs.last.id) {
//     this.stairSets[0][0].assignNeighbors({ start: diagPath.last })
//   }
//   return diagPath
// }

// ── VertPath — GPT arc control points helper for diagonal line experiments ──────

// class VertPath {
//   static arcControlPoints(a, b, c) {
//     const ab = Vertex.sub(b, a).normalize(), bc = Vertex.sub(c, b).normalize(),
//       theta = ab.angleBetween(Vertex.mult(bc, -1)), t = 4 / 3 * tan(theta / 4)
//     return [a, Vertex.sub(b, Vertex.mult(ab, t)), Vertex.add(b, Vertex.mult(bc, t)), c]
//   }
// }
