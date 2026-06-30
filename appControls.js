// CNC / mint floor — user units (ProtoCut.depth). Tune before digital mint.
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
  hashNumber: 1528,
  lastHash: true,
  blackMode: false,
}
