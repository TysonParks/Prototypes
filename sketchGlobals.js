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
