// Runtime controls required by Animation.js and shade filters (not dev dat.GUI).
const globalControls = {
  shadAngle: 90,
  animated: false,
}

// Dev seed navigation defaults — must exist before artBlocks/tokenHash.js loads.
// mode 0 = dev (lastHash corpus, 'n' random regen enabled)
// mode 1 = production (HashHorizon ↑↓/0 only; 'n' regen disabled)
const testingControls = {
  hashNumber: 1511,
  lastHash: true,
  mode: 1,
  blackMode: false,
}

function isDevHashNavMode() {
  return typeof testingControls !== 'undefined' && testingControls.mode === 0
}
