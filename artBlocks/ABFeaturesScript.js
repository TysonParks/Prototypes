// MARK: Art Blocks feature entry point
// FeatureSet + EnumFeature live in Features.js for dev; inline at bundle export time (E2).

function calculateFeatures(token = tokenData) {
  if (token?.hash) tokenData.hash = token.hash
  R = new Random()
  const features = new FeatureSet(R)
  if (typeof window !== 'undefined') {
    window.$features = { ...features.publicFeatures }
  }
  return features
}
