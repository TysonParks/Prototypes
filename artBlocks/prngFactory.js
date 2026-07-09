// PRNG mode resolution — dev profile. Submission uses Random.submission.js (hardcoded ab).
function resolvePrngMode(index) {
  if (typeof testingControls !== 'undefined' && testingControls.prngMode != null) {
    return testingControls.prngMode
  }
  if (typeof lastHashEra === 'function') {
    const era = lastHashEra(index ?? testingControls?.hashNumber ?? 0)
    if (era?.prng) return era.prng
  }
  return (typeof window !== 'undefined' && window.prngMode) || 'ab'
}

function createPrngCore(mode) {
  return mode === 'legacy' ? new RandomLegacy() : new RandomArtBlocks()
}

function createRandom() {
  const mode = resolvePrngMode()
  return new RandomTracked(createPrngCore(mode), { mode })
}
