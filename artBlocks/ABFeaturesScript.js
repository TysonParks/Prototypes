// MARK: Art Blocks feature entry point — dev profile (FeatureSet factory + legacy snapshot).
// FeatureSet + EnumFeature live in Features.js; FeatureSetLegacy in FeaturesLegacy.js (dev only).

function calculateFeatures(token = tokenData) {
  if (token?.hash) tokenData.hash = token.hash
  R = new Random()
  const FeatureCtor = resolveFeatureSetClass()
  const features = new FeatureCtor(R)
  if (typeof window !== 'undefined') {
    window.$features = { ...features.publicFeatures }
  }
  return features
}
