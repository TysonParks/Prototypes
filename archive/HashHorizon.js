// ARCHIVED 2026-06 — bounded hash-space navigation experiment.
// Not loaded by index.html or submission bundle.
// See docs/Operational/HASH-HORIZON.md for conceptual intent and why it was removed.

// MARK: HashHorizon class (was Features.js)
class HashHorizon {
  static HEX = '0123456789abcdef'

  static normalizeHash(hash) {
    if (typeof hash !== 'string') return null
    let h = hash.trim().toLowerCase()
    if (h.startsWith('0x')) h = h.slice(2)
    if (h.length !== 64 || !/^[0-9a-f]+$/.test(h)) return null
    return `0x${h}`
  }

  static bodyFromHash(hash) {
    const norm = HashHorizon.normalizeHash(hash)
    return norm ? norm.slice(2) : null
  }

  static locusIndex(body) {
    const tail = parseInt(body.slice(-2), 16)
    return Math.max(0, Math.min(63, Math.round(tail / 4)))
  }

  static precomputeHashes(body, index) {
    const chars = body.split('')
    const out = []
    for (let d = 0; d < 16; d++) {
      chars[index] = HashHorizon.HEX[d]
      out.push(`0x${chars.join('')}`)
    }
    return out
  }

  constructor(originHash) {
    const body = HashHorizon.bodyFromHash(originHash)
    if (!body) {
      this.valid = false
      this.originHash = originHash
      this.currentDigit = 0
      this.locus = 0
      this.variants = []
      return
    }
    this.valid = true
    this.originHash = HashHorizon.normalizeHash(originHash)
    this.locus = HashHorizon.locusIndex(body)
    this.originDigit = parseInt(body[this.locus], 16)
    this.currentDigit = this.originDigit
    this.variants = HashHorizon.precomputeHashes(body, this.locus)
  }

  get currentHash() {
    if (!this.valid) return this.originHash
    return this.variants[this.currentDigit]
  }

  step(delta) {
    if (!this.valid || !delta) return null
    const next = this.currentDigit + delta
    if (next < 0 || next > 15) return null
    this.currentDigit = next
    return this.currentHash
  }

  reset() {
    if (!this.valid) return this.originHash
    this.currentDigit = this.originDigit
    return this.originHash
  }

  isAtOrigin() {
    return this.currentDigit === this.originDigit
  }
}

// MARK: ProtoBatch nav wiring (was ProtoBatch.js — production listener removed)
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

// animatedBuildFromHash(hash) used RevealAnim.transitionToHash(() => {
//   this.teardown(); this.buildFromHash(hash)
// })
