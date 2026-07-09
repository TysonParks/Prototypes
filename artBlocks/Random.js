// DEV-ONLY factory: returns RandomTracked wrapping legacy or AB core per prngMode / era.
class Random {
  constructor() {
    return createRandom()
  }
}
