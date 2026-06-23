// Archived from Grid.js (2026-06).
//
// Initial attempt to expose BackGrid outer shape metrics in user units for
// safariImageSwap.js dummy morph (width, height, per-corner radii). Superseded
// by DOM measurement of the mask path in RevealAnimation.js updateLayoutVars().
//
// Revive: paste getter onto Grid.prototype (or re-wire getCurrentFrameMetrics in
// safariImageSwap.js if model-space metrics are preferred over DOM rects).

// GETT: frameShapeMetrics : { width, height, cornerRadii: { tl, tr, br, bl } } in user units
// Exposes the visible artwork's outer shape (BackGrid's perimeter)
// for downstream consumers that need to mirror that shape outside
// the SVG — e.g. safariImageSwap.js dummy backing morph.
// Width/height come from `boundsRect` (`size`). Corner radii are
// sourced from the four `allSimpleOutsideCorners` of the BackGrid's
// perimeter, classified TL/TR/BR/BL by each segment's `.start`
// position relative to the bounds center.
// Falls back to default pill metrics (100×200, all 50uu) when
// perimeter shapes haven't been built yet (cold-load) or when this
// grid isn't a BackGrid — so callers can read the getter at any
// time without null-checks.
//
// Grid.prototype frameShapeMetrics getter:
/*
get frameShapeMetrics() {
  const defaultMetrics = {
    width: 100,
    height: 200,
    cornerRadii: { tl: 50, tr: 50, br: 50, bl: 50 },
  }
  if (!this.isBackGrid) return defaultMetrics
  const bounds = this.boundsRect
  if (!bounds) return defaultMetrics
  const corners = this.allSimpleOutsideCorners
  if (!corners || corners.length < 4) {
    return {
      width: bounds.width,
      height: bounds.height,
      cornerRadii: { tl: 50, tr: 50, br: 50, bl: 50 },
    }
  }
  // Shapes flow CLOCKWISE; arcRadius lives at each segment's END
  // (the corner connecting to the NEXT segment). For a rectangular
  // BackGrid perimeter the four sides come in this order:
  //   seg[0] = top    → end corner is top-RIGHT    → tr
  //   seg[1] = right  → end corner is bottom-RIGHT → br
  //   seg[2] = bottom → end corner is bottom-LEFT  → bl
  //   seg[3] = left   → end corner is top-LEFT     → tl
  const cornerRadii = {
    tr: corners[0].arcRadius || 0,
    br: corners[1].arcRadius || 0,
    bl: corners[2].arcRadius || 0,
    tl: corners[3].arcRadius || 0,
  }
  return {
    width: bounds.width,
    height: bounds.height,
    cornerRadii,
  }
}
*/
