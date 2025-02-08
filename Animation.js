class AnimationController {
  constructor(initialFrameRate = 12) {
    this.frameRate = initialFrameRate
    this.frameDuration = 1000 / initialFrameRate
    this.batchSize = Math.ceil(S.offsetElts.length / initialFrameRate)
    this.frameStartTime = performance.now()
    this.pendingFrame = null
    this.frameRateOptions = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]
    this.maxFPS = this.getMaxFPS()
    this.lastBatchTime = 0
    this.isCalibrating = true
    this.calibrationFrames = 100
    this.frameTimes = []
  }

  getMaxFPS() {
    let maxFPS = 60 // Default fallback

    // Try to get refresh rate from screen
    if (window.screen && window.screen.refreshRate) {
      maxFPS = window.screen.refreshRate
    } else if (window.performance && window.performance.now) {
      // Measure actual refresh rate
      const start = window.performance.now()
      let frames = 0
      const loop = () => {
        frames++
        const now = window.performance.now()
        if (now - start < 1000) {
          requestAnimationFrame(loop)
        } else {
          maxFPS = frames
        }
      }
      requestAnimationFrame(loop)
    }

    // Limit to supported frame rates
    return this.frameRateOptions.reduce((prev, curr) =>
      (curr <= maxFPS ? curr : prev), this.frameRateOptions[0])
  }

  optimizeFrameRate() {
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    const singleFrameTime = 1000 / this.maxFPS
    const frameAmount = ceil(averageFrameTime / singleFrameTime)
    const targetRate = this.maxFPS / frameAmount

    // Find highest frame rate option that's <= target rate
    const optimalFrameRate = this.frameRateOptions
      .filter(rate => rate <= targetRate)
      .reduce((prev, curr) => Math.max(prev, curr))

    this.frameRate = optimalFrameRate
    this.frameDuration = 1000 / this.frameRate
    this.isCalibrating = false

    console.log(`Animation optimized - FPS: ${this.frameRate}, Batch Size: ${this.batchSize}`)
  }

  batchUpdateFilters(shadeVect) {
    const currentBatch = S.offsetElts
    const batchStartTime = performance.now()

    currentBatch.forEach(({ elt, mag }) => {
      elt.attribute('dx', shadeVect.x * mag)
      elt.attribute('dy', shadeVect.y * mag)
    })

    if (this.isCalibrating) {
      const batchTime = performance.now() - batchStartTime
      this.frameTimes.push(batchTime)

      // Dynamic batch size adjustment during calibration
      if (batchTime < this.frameDuration * 0.75) {
        this.batchSize = Math.min(this.batchSize + 1, S.offsetElts.length)
      } else if (batchTime > this.frameDuration * 0.9) {
        this.batchSize = Math.max(this.batchSize - 1, 1)
      }

      if (this.frameTimes.length >= this.calibrationFrames) {
        this.optimizeFrameRate()
      }
    }
  }



  globalAnimation() {
    if (!globalControls.animated) {
      this.frameStartTime = 0
      if (this.pendingFrame) {
        cancelAnimationFrame(this.pendingFrame)
        this.pendingFrame = null
      }
      return
    }

    const now = performance.now()
    const actualFrameTime = now - this.frameStartTime

    if (actualFrameTime >= this.frameDuration) {
      this.frameStartTime = now - (actualFrameTime % this.frameDuration)
      globalControls.shadAngle = (millis() / (1000 * ROT)) * 360 % 360
      this.shadVect = createVector(1, 0).rotate(radians(globalControls.shadAngle))
      this.batchUpdateFilters(this.shadVect)
    }

    this.pendingFrame = requestAnimationFrame(() => this.globalAnimation())
  }
}
