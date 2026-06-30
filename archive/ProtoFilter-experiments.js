// Archived from ProtoFilter.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// Unused p5 / ProtoFilter experiments. Paste back onto cited prototypes when reviving.
// StrokeMaskFilter lived in archive/Unused.js — restore that class before applyStrokeMask.

// ── ProtoFilter.updateOffsets() — superseded by AnimationController.batchUpdateFilters ──

// updateOffsets(shadVect) {
//   const updates = []
//   this.offsetElts.forEach(({ elt, mag }) => {
//     const dx = shadVect.x * mag
//     const dy = shadVect.y * mag
//     updates.push({ elt, dx, dy })
//   })
//   updates.forEach(({ elt, dx, dy }) => {
//     elt.attribute(`dx`, dx)
//     elt.attribute(`dy`, dy)
//   })
// }

// ── p5 SVG text helpers (GPT-4, Jan 2024) ─────────────────────────────────────

// p5.prototype.createSVGText = function (content, x = 0, y = 0) {
//   const textElt = this.createSVGElt('text').html(content)
//     .attribute('x', x)
//     .attribute('y', y)
//   return textElt
// }

// p5.Element.prototype.setText = function (content) {
//   if (this.type === 'svg' && this.elt.tagName === 'text') this.html(content)
//   return this
// }

// ── Filter group crossfade (unused; applyFilterToElement uses instant reparent) ──

// p5.prototype.crossfadeElements = async function (fromElement, toElement, duration, onComplete) {
//   const
//     startTime = performance.now(),
//     fromElementOpacity = parseFloat(fromElement.attribute("opacity") || "1"),
//     toElementOpacity = parseFloat(toElement.attribute("opacity") || "1")
//   const step = (timestamp) => {
//     const
//       elapsed = timestamp - startTime,
//       progress = Math.min(elapsed / duration, 1)
//     fromElement.attribute("opacity", fromElementOpacity * (1 - progress))
//     toElement.attribute("opacity", toElementOpacity * progress)
//     if (progress < 1) requestAnimationFrame(step)
//     else if (onComplete) onComplete()
//   }
//   requestAnimationFrame(step)
// }

// ── Stroke mask filter (StrokeMaskFilter in archive/Unused.js) ────────────────

// p5.Element.prototype.applyStrokeMask = function (color, width) {
//   const strokeMaskFilter = new StrokeMaskFilter().strokeMask(color, width)
//   strokeMaskFilter.applyFilterToElement(this)
//   return this
// }
