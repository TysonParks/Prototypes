// CNC / mint floor — user units (ProtoCut.depth). Tune before digital mint.
//
// PRE-LAUNCH TUNE: minCutDepth currently applies to BOTH machined cut depth AND
// inset/packing spacing (maxCellOutset, minInsetAmount, wall minRad). Consider
// splitting before mint:
//   productionLimits.minCutDepth     — CNC / ProtoCut.depth floor
//   productionLimits.minInsetSpacing — grid packing / outset floor
// Visual QA on lastHash band (#1528, #1543, #1547–#1549) before final constant.
const productionLimits = {
  minCutDepth: 1,
}

// Runtime controls required by Animation.js and shade filters (not dev dat.GUI).
const globalControls = {
  shadAngle: 90,
  animated: false,
}

// Dev seed navigation defaults — must exist before artBlocks/tokenHash.js loads.
const testingControls = {
  hashNumber: 1529,
  lastHash: true,
  blackMode: false,
}
