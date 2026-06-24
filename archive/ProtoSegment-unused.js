// Archived from drawAsSVG.js ProtoSegment (2026-06). Not loaded by index.html — see archive/README.md.
//
// Unused / incomplete ProtoSegment getters and methods.
//
// Related archives:
//   - ProtoSegment-part-getters.js — fundamental part classification getters
//   - SegPath-unitRefined.js, Grid-SegPool.js — removeBothNeighbors for overlap cutting
//   - Unused.js — cubic vert / UTurn corner experiments
//   - StairsToDiagonals.js — outsideCells usage
//   - ROADMAP.md / KNOWN-ISSUES.md — oppFacingCollinearSegs deferred work

// ── Length / outline ──────────────────────────────────────────────────────────

// get isMinLength() {
//   const minLength = this.isHorizontal ? this.cellSize.x : this.cellSize.y
//   return equalsRoundedDec(this.length, minLength, 0)
// }

// get outsideCells() {
//   return memoize(() => {
//     return this.grid.tempOutlineSelection(this.cells, 1, this.direction.toLeft)
//   }, `outsideCells`).call(this)
// }

// ── Corners / cubic verts ─────────────────────────────────────────────────────

// get startCorner() { return this.corners.start }

// get hasOnlyOneCubicVert() { return (this.hasCubicStartVert || this.hasCubicEndVert) && !(this.hasBothCubicVerts) }
// get hasBothCubicVerts() { return this.hasCubicStartVert && this.hasCubicEndVert }
// get cubicVertCount() {
//   if (this.hasBothCubicVerts) return 2
//   if (this.hasOnlyOneCubicVert) return 1
//   if (!this.hasSomeCubicVerts) return 0
// }

// get minCubicLength() { return min(this.availableStartLength, this.availableEndLength) }

//METH: addBothDistancedCornerVerts() : null : add both corner verts at the same distance from the start and end points
// addBothDistancedCornerVerts(distance, replace = false) {
//   this.addDistancedStartCornerVerts(distance, replace)
//   this.addDistancedEndCornerVerts(distance, replace)
// }

// get hasCompleteStartCorner() {
//   return memoize(() => {
//     return this.startNeighbor.hasCubicEndVert && this.hasCubicStartVert
//       && equalsRoundedDec(this.startNeighbor.availableEndLength, this.availableStartLength)
//   }, `hasCompleteStartCorner`).call(this)
// }

// get hasBothCompleteCorners() { return this.hasCompleteStartCorner && this.hasCompleteEndCorner }

// get maxArcCells() {                                                                             //UNUSED:
//   return memoize(() => {
//     return this.grid.cellSpanBetween(this.cells[0].index, this.endNeighbor.cells.last.index)
//     // .intersect(this.shape.cells, `id`)
//   }, `maxArcCells`).call(this)
// }

// ── Shape/grid edge geometry ────────────────────────────────────────────────────

// get adjStartShapeBoundsEdge() {
//   if (!this.hasArc) return
//   const
//     dir = this.normals.cubic,
//     arcDir = this.startNeighbor.isOutsideCorner ? dir : dir.opposites
//   return this.shape.sides[arcDir.name]
// }
// get adjEndShapeBoundsEdge() {
//   if (!this.hasArc) return
//   const
//     dir = this.normals.cubic,
//     arcDir = this.isOutsideCorner ? dir : dir.opposites
//   return this.shape.sides[arcDir.name]
// }
// get arcStartToShapeBoundsEdgeSeg() {
//   if (!this.hasArc) return
//   const edgeIntersect = this.arcOriginToStart.intersectionWith(this.adjEndShapeBoundsEdge, true)
//   return segment(this.arcStartCorner, edgeIntersect)
// }
// get arcEndToShapeBoundsEdgeSeg() {
//   if (!this.hasArc) return
//   const edgeIntersect = this.arcOriginToEnd.intersectionWith(this.endNeighbor.adjStartShapeBoundsEdge, true)
//   return segment(this.arcEndCorner, edgeIntersect)
// }

// get outsideAdjGridEdge() { return this.grid.sides[this.sideDir.name] }
// get insideBoundsEdgeSeg() {
//   const
//     startNormal = segment(this.start, Vertex.add(this.start, this.sideDir.lineVector)),
//     startIntersect = startNormal.intersectionWith(this.insideAdjGridEdge, true)
//   return segment(this.end, startIntersect)
// }

// ── Corner orientation filters ────────────────────────────────────────────────

// get inShapeSameFacingCorners() {
//   return memoize(() => {
//     if (!this.shape) { DeBug.log(this) }
//     return this.shape.simpleSubShapes.flat().exclude(this, 'id')
//       .filter(s => this.hasSameFacingCorner(s))
//   }, `inShapeSameFacingCorners`).call(this)
// }

// get diagonalCornersInShape() {                                                                        //UNUSED:
//   return memoize(() => {
//     return this.shape.simpleSubShapes.flat().exclude(this, 'id')
//       .filter(s => this.hasDiagonalCorner(s))
//   }, `inShapeDiagonalCorners`).call(this)
// }
// get diagonalCornersInNeighborShapes() {                                                                        //UNUSED:
//   return memoize(() => {
//     return this.shape.andNeighborSimples.exclude(this, 'id')
//       .filter(s => this.hasDiagonalCorner(s))
//   }, `neighborDiagonalCorners`).call(this)
// }

// ── Wrapping experiments ──────────────────────────────────────────────────────

// get oppFacingCollinearSegs() {
//   return memoize(() => {
//     return this.overlapSegs
//       .filter(s =>
//         this.hasOppositeFacingCorner(s)
//         && this.hasCollinearCorner(s)
//         && !this.isMirroredCorner(s)
//       )
//   }, `oppFacingCollinearSegs`).call(this)
// }

// get colOutWrapper() { if (this.isOutsideCorner) return this.collinearWrapper }
// get colInWrapper() { if (!this.isOutsideCorner) return this.collinearWrapper }

// get radiantWrapper() { }        //TODO: complete impltmentation         //UNUSED:
// get proximalWrapper() { }       //TODO: complete impltmentation         //UNUSED:

// get hasWrappers() { return !!this.inWrappers || !!this.outWrappers }

// get viableOutWrapOriginBounds() {
//   return memoize(() => {
//     if (this.outWrapper) return boundsOverlap({ geo: [this.viableArcOriginsSeg, this.outWrapper.viableArcOriginsSeg] })
//   }, `viableOutWrapOriginBounds`).call(this)
// }

// get isFlushInWrapper() { return !!this.flushOutWrapper }
// get isAdjInWrapper() { return !!this.adjOutWrapper } flush

// get adjWrapisEquidistant() { return this.adjWrapState === 0 }

// get isOutWrapped() { return this.#isWrapped(true) }

// ── Path / overlap ──────────────────────────────────────────────────────────────

// get overlapInsideSegs() {                                                                       //UNUSED:
//   return memoize(() => {
//     return this.shape.andNeighborSimples
//       .exclude(this, `id`)
//       .filter(s => this.isOverlappingWith({ seg: s, includeEnds: false, mode: 0 }))
//   }, `overlapInsideSegs`).call(this)
// }

// get hasCompletePath() { return !!this.segPath }

// get isSmallBean() {
//   return memoize(() => {
//     const
//       min = 5 * this.cellRadius,
//       path = this.segPath
//     if (path.length === 6) return path.every(s => s.length < min)
//     return false
//   }, `isSmallBean`).call(this)
// }

// ── Neighbor removal (SegPath-unitRefined / Grid-SegPool) ─────────────────────

//METH: removeStartNeighbor() : null : remove the start neighbor
// removeStartNeighbor() {
//   if (this.startNeighbor) {
//     this.startNeighbor.neighbors.end = undefined
//     this.neighbors.start = undefined
//   }
// }
// //METH: removeEndNeighbor() : null : remove the end neighbor
// removeEndNeighbor() {
//   if (this.endNeighbor) {
//     this.endNeighbor.neighbors.start = undefined
//     this.neighbors.end = undefined
//   }
// }
// //METH: removeBothNeighbors() : null : remove both neighbors
// removeBothNeighbors() {
//   this.removeStartNeighbor()
//   this.removeEndNeighbor()
// }
