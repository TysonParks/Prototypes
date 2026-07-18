// Shared sketch state. Load early in submission bundle so RevealAnimation / rotation
// code can safely reference FRAME and frameSize (var hoists without TDZ when concatenated).
const xmlns = 'http://www.w3.org/2000/svg'

var
  backgroundColor, frameColor,
  frameSize,
  BG, FRAME, BGRID, GRID,
  ROT, frameRate, lightClock, arcSecond,
  R, S, RuID,
  animationController,
  protoBatch

// Art Blocks generator does not ship style.css. Paint html/body black immediately so
// the page is never white before #BG exists, and stays black when cardinal/smooth
// rotation hides #BG (Safari always; Chrome when R-toggled to cardinal).
// Also defeat generator `canvas { left/right/top/bottom:0 }` which stretches the
// cardinal display canvases and shifts the rotation pivot off-center in all browsers.
;(function ensureArtworkPageBackground() {
  function paint() {
    try {
      if (document.documentElement) document.documentElement.style.backgroundColor = '#000'
      if (document.body) document.body.style.backgroundColor = '#000'
    } catch (_e) { /* ignore */ }
  }
  function injectChromeStyles() {
    if (document.getElementById('artwork-page-chrome-styles')) return
    try {
      const style = document.createElement('style')
      style.id = 'artwork-page-chrome-styles'
      style.textContent = [
        'html,body{background-color:#000!important;margin:0;padding:0;}',
        '#safari-cardinal-display-canvas,#safari-cardinal-display-canvas-b{',
        'left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;',
        'margin:0!important;}',
      ].join('')
      const parent = document.head || document.documentElement
      if (parent) parent.appendChild(style)
    } catch (_e) { /* ignore */ }
  }
  function apply() {
    paint()
    injectChromeStyles()
  }
  apply()
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', apply, { once: true })
  }
  window.ensureArtworkPageBackground = apply
})()
