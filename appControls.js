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

// Runtime controls required by Animation.js and shade filters (not for production UI).
const globalControls = {
  shadAngle: 90,
  animated: false,
}

// MARK: Chrome rotation mode (non-WebKit only)
// Default: 'full' (live SVG rotation). Press R in Chrome to toggle cardinal buffers.
// 'cardinal' — batch-baked bitmap crossfade (smoother; toggled via R key)
// 'full'     — live SVG CSS transform rotation
// Safari ignores this (always cardinal). Confirm: artworkRotationMode()
const chromeRotationMode = 'full'

window.chromeRotationMode = chromeRotationMode

// Default PRNG for new work / submission parity. Dev era nav may override via testingControls.
const prngMode = 'ab'
window.prngMode = prngMode

// Dev seed navigation defaults — must exist before artBlocks/tokenHash.js loads.
// prngMode / featureSetMode: null = derive from lastHash era on hashNumber change.
const testingControls = {
  hashNumber: 1527,
  lastHash: true,
  blackMode: false,
  prngMode: null,
  featureSetMode: null,
};
