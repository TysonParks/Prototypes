// CLASS: ProtoBatch
// Orchestrates single and batch builds for different hashes.
// Manages teardown → rebuild cycle.

function hashNavMode() {
  if (typeof testingControls !== 'undefined' && testingControls.mode === 0) return 0
  return 1
}

function installHashNav(batch) {
  if (batch._hashNavInstalled) return
  batch._hashNavInstalled = true

  window.addEventListener('keydown', (e) => {
    if (window.RevealAnim?.isWebKitClass) return
    const t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    const mode = hashNavMode()

    if (e.key === '0') {
      if (mode !== 1 || typeof hashHorizon === 'undefined' || !hashHorizon?.valid) return
      e.preventDefault()
      e.stopPropagation()
      const hash = hashHorizon.reset()
      if (hash && hash !== batch.currentHash) batch.animatedBuildFromHash(hash)
      return
    }

    let delta = 0
    if (e.key === 'ArrowUp') delta = 1
    else if (e.key === 'ArrowDown') delta = -1
    else return

    e.preventDefault()
    e.stopPropagation()

    if (mode === 0) {
      if (typeof testingControls !== 'undefined' && !testingControls.lastHash) return
      batch.stepLastHash(delta)
      return
    }

    if (typeof hashHorizon === 'undefined' || !hashHorizon?.valid) return
    const hash = hashHorizon.step(delta)
    if (hash) batch.animatedBuildFromHash(hash)
  }, true)
}

class ProtoBatch {
  currentHash = null
  _hashNavInstalled = false

  constructor() {
    installHashNav(this)
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

  animatedBuildFromHash(hash) {
    if (window.RevealAnim?.transitionToHash) {
      const started = window.RevealAnim.transitionToHash(() => {
        this.teardown()
        this.buildFromHash(hash)
      })
      if (started) return true
    }
    this.teardown()
    this.buildFromHash(hash)
    return true
  }

  stepLastHash(delta = 0) {
    if (typeof lastHash === 'undefined') return false

    const max = lastHash.length - 1
    const idx = typeof testingControls !== 'undefined' ? testingControls.hashNumber : 0
    const next = Math.max(0, Math.min(max, idx + delta))
    if (next === idx) return false

    if (typeof testingControls !== 'undefined') testingControls.hashNumber = next
    const hash = lastHash[next]
    console.log(`lastHash #${next}: ${hash}`)
    this.animatedBuildFromHash(hash)
    return true
  }

  buildFromNewSeed() {
    const newHash = random_hash()
    console.log(`New seed: ${newHash}`)
    this.teardown()
    this.buildFromHash(newHash)
  }
}
