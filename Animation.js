class AnimationController {
  constructor(initialFrameRate = 12) {
    this.frameRate = initialFrameRate
    this.frameDuration = 1000 / initialFrameRate
    this.batchSize = 20
    this.lastBatchTime = 0
    this.shadVect = { x: 0, y: 0 } // Default lighting vector
    this.frameTimes = [] // Array to store frame times
    this.frameRateOptions = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60] // Limited by monitor refresh
    this.maxFPS = this.getMaxFPS()
    this.calibrationFrames = 100  // Number of frames to collect for calibration
    this.isCalibrating = true     // Flag to track calibration state
    this.totalElements = 0
    this.frameStartTime = performance.now()
    this.actualFrameTimes = [] // Store actual visual frame times
  }

  getMaxFPS() {
    let maxFPS = 60
    if (window.screen && window.screen.refreshRate) {
      maxFPS = window.screen.refreshRate
    } else if (window.performance && window.performance.now) {
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
    return this.frameRateOptions.reduce((prev, curr) => (curr <= maxFPS ? curr : prev), this.frameRateOptions[0])
  }

  // METH: optimizeFrameRate()
  optimizeFrameRate() {
    if (!this.isCalibrating || this.frameTimes.length < this.calibrationFrames) return

    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    const optimalFrameRate = averageFrameTime < (1000 / this.maxFPS)
      ? this.maxFPS
      : this.frameRateOptions.find(rate => (1000 / rate) >= averageFrameTime) || 1

    this.frameRate = optimalFrameRate
    this.frameDuration = 1000 / this.frameRate
    this.batchSize = Math.ceil(S.offsetElts.length / optimalFrameRate)
    this.isCalibrating = false

    console.log(`Animation optimized - FPS: ${this.frameRate}, Batch: ${this.batchSize}`)
  }

  // METH: batchUpdateFilters()
  batchUpdateFilters(shadeVect) {
    const offsetElts = S.offsetElts // Access the computed property
    this.totalElements = offsetElts.length
    let currentBatch = 0
    const totalBatches = Math.ceil(offsetElts.length / this.batchSize)

    const updates = offsetElts.map(({ elt, mag }) => ({
      elt,
      dx: shadeVect.x * mag,
      dy: shadeVect.y * mag
    }))

    // ARROW: processBatch()
    const processBatch = () => {
      const batchStartTime = performance.now()

      const start = currentBatch * this.batchSize
      const end = Math.min(start + this.batchSize, updates.length)

      for (let i = start; i < end; i++) {
        const { elt, dx, dy } = updates[i]
        elt.attribute('dx', dx)
        elt.attribute('dy', dy)
      }

      currentBatch++

      const batchEndTime = performance.now()
      this.lastBatchTime = batchEndTime - batchStartTime

      if (this.isCalibrating) {
        this.frameTimes.push(this.lastBatchTime)

        // Dynamically adjust batch size during calibration
        if (this.lastBatchTime < this.frameDuration * 0.75) {
          this.batchSize = Math.min(this.batchSize + 1, offsetElts.length)
        } else if (this.lastBatchTime > this.frameDuration * 0.9) {
          this.batchSize = Math.max(this.batchSize - 1, 1)
        }
      }

      if (currentBatch < totalBatches) {
        requestAnimationFrame(processBatch)
      } else if (this.isCalibrating) {
        this.optimizeFrameRate()
      }
    }

    requestAnimationFrame(processBatch)
  }

  // METH: globalAnimation()
  globalAnimation() {
    const now = performance.now()
    const actualFrameTime = now - this.frameStartTime

    if (this.isCalibrating) {
      this.actualFrameTimes.push(actualFrameTime)
    }

    if (actualFrameTime >= this.frameDuration) {
      this.frameStartTime = now - (actualFrameTime % this.frameDuration)
      globalControls.shadAngle = (millis() / (1000 * ROT)) * 360 % 360
      this.shadVect = createVector(1, 0).rotate(radians(globalControls.shadAngle))

      // Batch updates for filters
      this.batchUpdateFilters(this.shadVect)
    }

    requestAnimationFrame(() => this.globalAnimation())
  }
}
