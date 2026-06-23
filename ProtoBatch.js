// CLASS: ProtoBatch
// Orchestrates single and batch builds for different hashes.
// Manages teardown → rebuild cycle.

class ProtoBatch {
  currentHash = null
  _lastHashNavInstalled = false

  constructor() {
    if (typeof installProtoBatchDevNav === 'function') installProtoBatchDevNav(this)
  }

  buildFromHash(hash) {
    tokenData.hash = hash
    this.currentHash = hash

    setupPrefs()
    setupColors()
    setupBackground()

    DeBug.groupCollapsed(`setupFeatures`)
    const features = setupFeatures()
    DeBug.groupEnd()
    DeBug.warn('Features', features)
    DeBug.warn('Features R useage', R.useage)

    gridTests2(features)

    DeBug.log('random R useage', R.useage)
    DeBug.log('random RuID useage', RuID.useage)

    if (typeof positionRegenBtn === 'function') positionRegenBtn()
  }

  teardown() {
    if (typeof stopAnimationLoopAndResetLight === 'function') {
      stopAnimationLoopAndResetLight()
    } else {
      globalControls.animated = false
      globalControls.shadAngle = 90
    }

    globalControls.shadAngle = 90

    if (BG && BG.elt && BG.elt.parentNode) {
      BG.elt.parentNode.removeChild(BG.elt)
    }

    BG = null
    FRAME = null
    BGRID = null
    GRID = null
    R = null
    S = null
    RuID = null
    animationController = null
  }

  rebuild() {
    const hash = this.currentHash
    this.teardown()
    this.buildFromHash(hash)
  }

  buildFromNewSeed() {
    const newHash = random_hash()
    console.log(`New seed: ${newHash}`)
    this.teardown()
    this.buildFromHash(newHash)
  }
}
