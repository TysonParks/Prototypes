// Archived from ProtoLayerObjects.js Shape (2026-06). Not loaded by index.html — see archive/README.md.
//
// Commented Shape helpers — paste onto Shape class to revive.
// DeBugging.js still references segPathsCutStart/End and isPerimeterShape in dev overlays.

// ── Layout / grid delegation ──────────────────────────────────────────────────

// get insetSize() { return this.size }
// get group() { return this.grid.groupNamed(this.groupID) }
// get groupID() { return this.island.groupID }

// ── Classification ────────────────────────────────────────────────────────────

// get isPerimeterShape() { return this.type === `PerimeterShape` }
// get isLine() { return this.island.isLine }

// ── Segment / vertex probes ───────────────────────────────────────────────────

// get hasSubShapes() { return this.subShapes.length > 1 }
// get hasUTurns() { return this.allSimpleSegs.some(s => s.isUTurn) }
// get shapeCorners() { return this.allSegments.map(s => s.cornerVerts).flat().unique(['x', 'y']) }

// get assignedVerts() {
//   return this.subShapes.map(sub => sub.map(s => s.assignedVerts).flat().unique(['x', 'y']))
// }

// ── Inset corner radii ────────────────────────────────────────────────────────

// get minInsetCornerRadius() { return this.minCornerRadius + (this.insetScale.x - 1) * this.cellRadius }
// get maxInsetCornerRadius() { return this.maxCornerRadius + (this.insetScale.x - 1) * this.cellRadius }

// get minSquareCornerRadius() {
//   if (!this.isSquare) return
//   if (this.isCircle) return this.minCornerRadius
//   if (this.isLemon) return this.lemonLoftRadius
// }

// ── Cut-depth seg paths (shade offset lines) ──────────────────────────────────

// get segPathsCutStart() { return this.terminalSegPaths(true) }
// get segPathsCutEnd() { return this.terminalSegPaths(false) }

// terminalSegPaths(start) {
//   if (this.simpleSegPaths.isEmpty || !this.cut) return
//   const hasOutsetShade = this.cut?.profile?.hasOutsetShade
//   if (!this.cutDepthScale) return this.simpleInsetSegPaths
//   if (hasOutsetShade !== start) return this.simpleInsetSegPaths
//   const scale = hasOutsetShade
//     ? Vertex.add(this.insetScale, this.cutDepthScale)
//     : Vertex.sub(this.insetScale, this.cutDepthScale)
//   return this.scaledSegPaths(scale)
// }

// scaledSegPaths(insetScale) {
//   if (this.insetScale === insetScale) return this.simpleSegPaths
//   return this.simpleSegPaths.map(sub => sub.inset(insetScale))
// }

// get outerMaskSize() { return this.cutDepthScale?.x * this.cellRadius }
