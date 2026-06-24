// Archived from drawAsSVG.js Vertex + Segment (2026-06). Not loaded by index.html — see archive/README.md.
//
// Unused vertex helpers and deprecated direction/rounding APIs.
//
// Related archives:
//   - SelectionBounds-experiments.js — quadrant() subdivision (pairs with quadrantDirection)
//   - Unused.js — UnusedSelectionBounds used com.isZero + quadrantDirection for symmetrize
//   - Grid-symmetrize.js — symmetry experiments
//
// Live production still uses Vertex.directionTo() and static Vertex.add/sub/mult/div.
// Grid.cellSegmentBetween() switched to directionTo (see Grid.js FIXME ~L212).

// ── Vertex getters ────────────────────────────────────────────────────────────

// get isZero() { return this.x === 0 && this.y === 0 }

// get quadrantDirection() {
//   if (this.x > 0) {
//     if (this.y > 0) return Direction.UpRight
//     if (this.y < 0) return Direction.DownRight
//     if (this.y === 0) return Direction.Right
//   }
//   if (this.x < 0) {
//     if (this.y > 0) return Direction.UpLeft
//     if (this.y < 0) return Direction.DownLeft
//     if (this.y === 0) return Direction.Left
//   }
//   if (this.x === 0) {
//     if (this.y > 0) return Direction.Up
//     if (this.y < 0) return Direction.Down
//     if (this.y === 0) return Direction.None
//   }
// }

// ── Vertex methods ──────────────────────────────────────────────────────────────

//METH: roundedMag() : Number : rounded magnitude of vector
// roundedMag(decimal = 4) { return roundToDec(this.mag(), decimal) }

//METH: biDirectionTo() : Direction : direction to another vertex
// biDirectionTo(vert) {                                                   //DEPRECATED: previously only used in Grid.cellSegmentBetween()
//   if (this.y === vert.y) return Direction.Horizontal
//   if (this.x === vert.x) return Direction.Vertical
//
//   const slope = this.slopeTo(vert)
//   DeBug.log('slope', slope)
//
//   if (this.slopeTo(vert) === -1) return Direction.PosOrdinal
//   if (this.slopeTo(vert) === 1) return Direction.NegOrdinal
//   return -1 // not Cardinal or Ordinal
// }

//METH: roundToDec() : null : roundToDec x and y values
// roundCoordsToDec(dec = 4) {
//   this.x = roundToDec(this.x, dec)
//   this.y = roundToDec(this.y, dec)
// }

//TODO: If we run into Vertex arithemtic errors, test this
// add(vert) { return Vertex.add(this, vert) }
// sub(vert) { return Vertex.sub(this, vert) }
// mult(vert) { return Vertex.mult(this, vert) }
// div(vert) { return Vertex.div(this, vert) }

// ── Segment methods (coord rounding) ──────────────────────────────────────────

// //METH: roundToDec() : null : roundToDec start and end verts
// roundVertsToDec(dec = 4) {
//   this.start.roundCoordsToDec(dec)
//   this.end.roundCoordsToDec(dec)
// }
