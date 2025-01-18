//NOTE: Made with ChatGPT Jan 17, 2025
class AnimationController {
  constructor(initialFrameRate = 12) {
    this.frameRate = initialFrameRate
    this.frameDuration = 1000 / initialFrameRate
    this.batchSize = 10
    this.offsetElts = [] // Populate dynamically
    this.lastBatchTime = 0
    this.shadVect = { x: 0, y: 0 } // Default lighting vector
  }

  // FUNC: batchUpdateFilters()
  batchUpdateFilters(shadeVect) {
    let currentBatch = 0
    const totalBatches = Math.ceil(this.offsetElts.length / this.batchSize)

    const updates = this.offsetElts.map(({ elt, mag }) => ({
      elt,
      dx: shadeVect.x * mag,
      dy: shadeVect.y * mag
    }))

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

      // Dynamically adjust batch size
      if (this.lastBatchTime < this.frameDuration * 0.75) {
        this.batchSize = Math.min(this.batchSize + 1, this.offsetElts.length)
      } else if (this.lastBatchTime > this.frameDuration * 0.9) {
        this.batchSize = Math.max(this.batchSize - 1, 1)
      }

      if (currentBatch < totalBatches) {
        requestAnimationFrame(processBatch)
      }
    }

    requestAnimationFrame(processBatch)
  }

  // FUNC: globalAnimation()
  globalAnimation() {
    globalControls.shadAngle = (millis() / (1000 * ROT)) * 360 % 360
    this.shadVect = createVector(1, 0).rotate(radians(globalControls.shadAngle))

    // Batch updates for filters
    this.batchUpdateFilters(this.shadVect)
  }
}
