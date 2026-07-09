// Art Blocks single-stream sfc32 PRNG — verbatim from current AB creator docs.
// https://docs.artblocks.io/creator-onboarding/artists/1-building-your-project/
class RandomArtBlocks {
  constructor() {
    const hex = tokenData.hash.slice(2)
    const seeds = [
      parseInt(hex.slice(0, 8), 16),
      parseInt(hex.slice(8, 16), 16),
      parseInt(hex.slice(16, 24), 16),
      parseInt(hex.slice(24, 32), 16),
    ]
    this._state = seeds
  }
  _next() {
    let [a, b, c, d] = this._state
    a |= 0; b |= 0; c |= 0; d |= 0
    let t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    this._state = [a, b, c, d]
    return (t >>> 0) / 4294967296
  }
  random_dec() { return this._next() }
  random_num(a, b) { return a + this._next() * (b - a) }
  random_int(a, b) { return Math.floor(a + this._next() * (b - a + 1)) }
  random_bool(p) { return this._next() < p }
  random_choice(arr) { return arr[Math.floor(this._next() * arr.length)] }
}
