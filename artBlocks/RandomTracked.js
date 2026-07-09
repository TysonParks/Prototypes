// Usage-tracking wrapper around any PRNG core (legacy or AB).
// Keeps useage diagnostics external to Art Blocks' Random class.
class RandomTracked {
  constructor(core, meta = {}) {
    this._core = core
    this.useage = 0
    this.afterFeatures = null
    this.prngMode = meta.mode || 'ab'
  }
  random_dec() {
    this.useage += 1
    return this._core.random_dec()
  }
  random_num(a, b) {
    return a + (b - a) * this.random_dec()
  }
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1))
  }
  random_bool(p) {
    return this.random_dec() < p
  }
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)]
  }
  markFeaturesEnd() {
    this.afterFeatures = this.useage
    return this.afterFeatures
  }
  get geometryUseage() {
    return this.afterFeatures == null ? null : this.useage - this.afterFeatures
  }
}
Object.assign(RandomTracked.prototype, RandomExtended)
