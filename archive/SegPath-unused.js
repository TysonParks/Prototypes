// Archived from drawAsSVG.js SegPath (2026-06). Not loaded by index.html — see archive/README.md.
//
// Unused quad/cuddle getters and makeCurves() — only referenced from archived
// Grid-maximizeCuddles-experiments.js (isOutsideQuad, hasMinRadii, perimeter, hasLoosies, makeCurves).

// ── SegPath getters ───────────────────────────────────────────────────────────

// get hasMinRadii() {
//   return memoize(() => {
//     return this.path.every(s => s.hasMinArcRadius)
//   }, `hasMinRadii`).call(this)
// }
// get isOutsideQuad() {
//   return memoize(() => {
//     return this.isQuad && this.path.every(s => s.isUTurnOut)
//   }, `isOutsideQuad`).call(this)
// }
// get perimeter() {
//   return memoize(() => {
//     return this.path.map(s => s.length).reduce((a, b) => a + b)
//   }, `perimeter`).call(this)
// }

// get hasLoosies() { return this.path.some(s => s.canCurveMoreAtEnd) }

// ── SegPath quad methods ──────────────────────────────────────────────────────

//METH: makeCurves() : null : convert all segments to curves
// makeCurves(equal = true, max = true, outWrap = true) {
//   DeBug.log(this.path)
//   const sorted = this.path
//
//   sorted.forEach(s => {
//     DeBug.log(s.id)
//     if (equal && max) s.replaceEndCurveOrigin(s.middleArcOrigin)
//   })
//
//   sorted.forEach(s => {
//     // DeBug.log(s.id)
//     if (outWrap) {
//       if (s.outWrapper?.canCurveToMiddleOrigin) {
//         // DeBug.log(`CAN curve!`)
//         // DeBug.log(s)
//         s.replaceEndRadiantOutWrapsOrigin()
//       } else {
//         // DeBug.log(`can't curve!`)
//       }
//     } else s.flushWrap(true)
//   })
// }
