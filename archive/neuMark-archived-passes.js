// ARCHIVED 2026-06 — removed from neuMark_I.js / ProtoLayerObjects.js
// Not loaded by index.html or submission bundle.

// --- ProtoCut.maxLayout (legacy filter region % pipeline) ---
// get maxLayout() {
//   let [xMax, yMax, widthMax, heightMax] = [0, 0, 0, 0]
//   this.shapeGroups.forEach(grp => {
//     const [size, padding] = [grp.insetSize, grp.padding]
//     const padSize = Vertex.div(padding, size)
//     const anchor = Vertex.mult(padSize, -100)
//     const newSize = Vertex.mult(padSize, 200).add(vert(100))
//     xMax = min(anchor.x, xMax)
//     yMax = min(anchor.y, yMax)
//     widthMax = max(newSize.x, widthMax)
//     heightMax = max(newSize.y, heightMax)
//   })
//   return { x: xMax, y: yMax, width: widthMax, height: heightMax }
// }

// Legacy setLayouts() branch (SAFARI_FILTER_REGION_USERSPACE_FIX = false):
// const layout = this.maxLayout
// this.filters.forEach(f => {
//   f.filter.elt.removeAttribute('filterUnits')
//   f.filter
//     .attribute('x', `${layout.x}%`)
//     .attribute('y', `${layout.y}%`)
//     .attribute('width', `${layout.width}%`)
//     .attribute('height', `${layout.height}%`)
//     .attribute('filterUnits', 'userSpaceOnUse')
// })

// ShapeGroup getters that depended on cut.maxLayout:
// get maxLayout() { return this.cut?.maxLayout }
// get finalSize() { ... insetLayout scaled by maxLayout % ... }

// --- ProtoCut.curve() — unused; #createShader passes curve explicitly ---
// curve(layer) {
//   if (this.profile.isR) return layer === 0 ? `r` : `r2`
//   return this.profile.type
// }

// --- ProtoCut.#createChannelShader() — unimplemented channel cut ---
// #createChannelShader() {
//   // SVG stroke mask path; similar to planned 'v' cut
// }

// --- Shade.neuShadeSVGFactory — fake iridescent experiment ---
// const randomLCH = (l) => {
//   const chroma = 1 / 8, hue = R.random_num(0, 360)
//   return `oklch(${l} ${chroma} ${hue})`
// }
// highCol = randomLCH(.98)
// shadCol = randomLCH(0.7)

// --- neuShadeSVGFactory default param comments (always frameColor / multiShade) ---
// baseCol = frameColor
// colSpread = 25
// count = 3  // multiAlpha density

// --- DEBUG_NEUSHADES console instrumentation (Apr 2026 thin-depth / Safari probe) ---
// Toggle: window.DEBUG_NEUSHADES = true
// Purpose: log neuShadeSVGFactory inputs and per-layer offset/color/blur values
// to compare r-in vs r-out shade ladders on thin-depth repro hashes (§9.14.12).
// Used by archive/thinDepthProbe.mjs (headless) and TESTING.md manual harness.
//
// if (window.DEBUG_NEUSHADES) {
//   console.groupCollapsed(`neuShadeSVGFactory debug — ${curve} ${shadeType}`)
//   console.log('inputs:', { curve, cutIn, shadeType, mag, inset, pixToUserUnits })
// }
// const __dbg_capture = (pathObj) => {
//   if (window.DEBUG_NEUSHADES) console.log('neuShadeDBG:', { cutIn, shadeType, inset, ...pathObj })
// }
// __dbg_capture({ offsets })
// __dbg_capture({ curve, stage: 'i_r2_layer', offset, mag, blurRadius, ... })
// __dbg_capture({ curve, stage: 'j_r_layer', offset, mag, blurRadius, ... })
// if (window.DEBUG_NEUSHADES) console.groupEnd()

function archivedProtoCutMaxLayout(cut) {
  let [xMax, yMax, widthMax, heightMax] = [0, 0, 0, 0]
  cut.shapeGroups.forEach(grp => {
    const [size, padding] = [grp.insetSize, grp.padding]
    const padSize = Vertex.div(padding, size)
    const anchor = Vertex.mult(padSize, -100)
    const newSize = Vertex.mult(padSize, 200).add(vert(100))
    xMax = min(anchor.x, xMax)
    yMax = min(anchor.y, yMax)
    widthMax = max(newSize.x, widthMax)
    heightMax = max(newSize.y, heightMax)
  })
  return { x: xMax, y: yMax, width: widthMax, height: heightMax }
}
