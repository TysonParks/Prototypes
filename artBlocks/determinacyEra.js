// FeatureSet / PRNG era resolution — dev profile (submission uses v2 + AB only).
function resolveFeatureSetMode(index) {
  if (typeof testingControls !== 'undefined' && testingControls.featureSetMode != null) {
    return testingControls.featureSetMode
  }
  if (typeof lastHashEra === 'function') {
    const era = lastHashEra(index ?? testingControls?.hashNumber ?? 0)
    if (era?.featureSet) return era.featureSet
  }
  return 'v2'
}

function resolveFeatureSetClass() {
  if (typeof FeatureSetLegacy !== 'undefined' && resolveFeatureSetMode() === 'v1') {
    return FeatureSetLegacy
  }
  return FeatureSet
}

function resolveEffectivePrngMode(index) {
  if (typeof resolvePrngMode === 'function') return resolvePrngMode(index)
  return 'ab'
}

function warnEraMismatch(index) {
  if (typeof lastHashEra !== 'function' || typeof testingControls === 'undefined') return
  const era = lastHashEra(index)
  if (!era) return
  const overrides = []
  if (testingControls.prngMode != null && testingControls.prngMode !== era.prng) {
    overrides.push(`prng=${testingControls.prngMode} (era expects ${era.prng})`)
  }
  if (testingControls.featureSetMode != null && testingControls.featureSetMode !== era.featureSet) {
    overrides.push(`featureSet=${testingControls.featureSetMode} (era expects ${era.featureSet})`)
  }
  if (overrides.length) {
    console.warn(`[lastHash #${index}] ${era.id} override active: ${overrides.join('; ')}`)
  }
}

function applyEraDefaults(index) {
  if (typeof lastHashEra !== 'function') return
  const era = lastHashEra(index)
  if (!era) return
  const effectiveFeatureSet = resolveFeatureSetMode(index)
  const effectivePrng = resolveEffectivePrngMode(index)
  console.info(
    `[lastHash #${index}] ${era.id} → featureSet=${effectiveFeatureSet}, prng=${effectivePrng}`
    + (testingControls?.prngMode == null && testingControls?.featureSetMode == null ? ' (auto)' : '')
  )
  warnEraMismatch(index)
}
