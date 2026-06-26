// Runtime controls required by Animation.js and shade filters (not dev dat.GUI).
const globalControls = {
  shadAngle: 90,
  animated: false,
}

// Dev seed navigation defaults — must exist before artBlocks/tokenHash.js loads.
// Submission bundle uses tokenHash.submission.js (no testingControls reference).
const testingControls = {
  hashNumber: 1511,
  lastHash: true,
  mode: 1, // 0 = lastHash corpus (dev), 1 = HashHorizon (production)
  blackMode: false,
}
