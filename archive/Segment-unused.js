// Archived from drawAsSVG.js Segment (2026-06). Not loaded by index.html — see archive/README.md.
//
// Unused Segment getters and lerp helpers.
//
// Related archives:
//   - Unused.js — scaledStartPoint / scaledEndPoint in commented SVGPath bez experiments
//   - StairsToDiagonals.js — normalDirection on diagonals

// ── Segment constructor call site ─────────────────────────────────────────────
// Paste into Segment constructor if reviving flexible arg parsing:
//     // this.#assignVerts(start, end, arguments)

// ── Segment getters ───────────────────────────────────────────────────────────

// get isOrdinal() {
//   return memoize(() => {
//     return this.direction.allAreOrdinal
//   }, `isOrdinal`).call(this)
// }

// get angleInDegrees() {                               // in DEGREES
//   return memoize(() => {
//     return degrees(this.angle)
//   }, `angleInDegrees`).call(this)
// }

// get normalDirection() {
//   return memoize(() => {
//     return this.direction.toLeft
//   }, `normal`).call(this)
// }

// get width() {
//   return memoize(() => {
//     return this.start.widthTo(this.end)
//   }, `width`).call(this)
// }
// get height() {
//   return memoize(() => {
//     return this.start.heightTo(this.end)
//   }, `height`).call(this)
// }

// get boundsCorners() {
//   return memoize(() => {
//     return {
//       upLeft: vert(this.xMin, this.yMin),
//       upRight: vert(this.xMax, this.yMin),
//       downRight: vert(this.xMax, this.yMax),
//       downLeft: vert(this.xMin, this.yMax),
//     }
//   }, `boundsCorners`).call(this)
// }

// ── Segment methods ───────────────────────────────────────────────────────────

//METH: scaledStartPoint() : Vertex : get point on segment given lerp from mid to start
// scaledStartPoint(lerp, mid = 0.5) {
//   return this.pointOnsegment(mid - lerp * mid)
// }

//METH: scaledEndPoint() : Vertex : get point on segment given lerp from mid to end
// scaledEndPoint(lerp, mid = 0.5) {
//   return this.pointOnsegment(mid + lerp * (1 - mid))
// }

//TODO: I might be able to revert to this
//METH: assignVerts() : null : assign start and end verts
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
