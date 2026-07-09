// Submission profile: v2 FeatureSet only (no legacy snapshot, no factory).
function calculateFeatures(token = tokenData) {
  if (token?.hash) tokenData.hash = token.hash
  R = new Random()
  const features = new FeatureSet(R)
  if (typeof window !== 'undefined') {
    window.$features = { ...features.publicFeatures }
  }
  return features
}
