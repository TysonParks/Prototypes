// Submission profile: AB PRNG only (no legacy, no mode switch).
class Random {
  constructor() {
    return new RandomTracked(new RandomArtBlocks(), { mode: 'ab' })
  }
}
