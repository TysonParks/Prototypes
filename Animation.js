class AnimationController {

  constructor(initialFrameRate = 12, clockOptions = {}) {
    this.frameRate = initialFrameRate
    this.frameDuration = 1000 / initialFrameRate
    this.batchSize = Math.ceil(S.offsetElts.length / initialFrameRate)
    this.frameStartTime = performance.now()
    this.pendingFrame = null
    this.syncTransition = null
    this.currentScreenAngle = this.readRenderedScreenAngle()
    this.lastAppliedScreenAngle = null
    this.frameRateOptions = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]
    this.maxFPS = this.getMaxFPS()
    this.lastBatchTime = 0
    this.isCalibrating = true
    this.calibrationFrames = 100
    this.frameTimes = []
    this.clock = this.createClockOptions(clockOptions)
  }

  createClockOptions(clockOptions = {}) {
    const arcSecondMs = clockOptions.arcSecondMs ?? Math.PI * 1000
    const arcSecondsPerRotation = clockOptions.arcSecondsPerRotation ?? 20
    const rotationDurationMs = clockOptions.rotationDurationMs
      ?? arcSecondMs * arcSecondsPerRotation
    return {
      source: clockOptions.source || 'unix-epoch',
      epochMs: clockOptions.epochMs ?? 0,
      arcSecondMs,
      arcSecondsPerRotation,
      rotationDurationMs,
      maxHoldMs: clockOptions.maxHoldMs ?? rotationDurationMs * 0.5,
      minChaseMs: clockOptions.minChaseMs ?? arcSecondMs,
      maxChaseMs: clockOptions.maxChaseMs ?? rotationDurationMs * 0.5,
      maxChaseSpeedRatio: clockOptions.maxChaseSpeedRatio ?? 2,
      catchUpCoastRatio: clockOptions.catchUpCoastRatio ?? 0.25,
      syncToleranceDeg: clockOptions.syncToleranceDeg ?? 0.15,
    }
  }

  //METH: getMaxFPS() : Number : 
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
  //METH: optimizeFrameRate() : null :
  optimizeFrameRate() {
    const
      averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length,
      singleFrameTime = 1000 / this.maxFPS,
      frameAmount = ceil(averageFrameTime / singleFrameTime),
      targetRate = this.maxFPS / frameAmount,
      // Find highest frame rate option that's <= target rate
      optimalFrameRate = this.frameRateOptions
        .filter(rate => rate <= targetRate)
        .reduce((prev, curr) => Math.max(prev, curr))

    this.frameRate = optimalFrameRate
    this.frameDuration = 1000 / this.frameRate
    this.isCalibrating = false

    DeBug.log(`Animation optimized - FPS: ${this.frameRate}, Batch Size: ${this.batchSize}`)
  }
  //METH: batchUpdateFilters() : null :
  batchUpdateFilters(shadeX, shadeY) {
    const
      currentBatch = S.offsetElts,
      batchStartTime = performance.now()

    currentBatch.forEach(({ elt, mag }) => {
      elt.attribute('dx', shadeX * mag)
      elt.attribute('dy', shadeY * mag)
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
  //METH: globalAnimation() : null : 
  globalAnimation() {
    if (!globalControls.animated) {
      this.frameStartTime = 0
      if (this.pendingFrame) {
        cancelAnimationFrame(this.pendingFrame)
        this.pendingFrame = null
      }
      return
    }

    const
      now = performance.now(),
      actualFrameTime = now - this.frameStartTime

    if (actualFrameTime >= this.frameDuration) {
      this.frameStartTime = now - (actualFrameTime % this.frameDuration)
      const screenAngle = this.syncedScreenAngle(this.clockNowMs())
      this.applyScreenLightAngle(screenAngle)
    }

    this.pendingFrame = requestAnimationFrame(() => this.globalAnimation())
  }

  stop({ resetLight = false, screenAngle = 90 } = {}) {
    globalControls.animated = false
    if (this.pendingFrame) {
      cancelAnimationFrame(this.pendingFrame)
      this.pendingFrame = null
    }
    this.frameStartTime = 0
    this.syncTransition = null
    if (resetLight) this.applyScreenLightAngle(screenAngle)
  }

  startClockSync() {
    const now = this.clockNowMs()
    this.currentScreenAngle = this.readRenderedScreenAngle()
    this.syncTransition = this.planClockSync(this.currentScreenAngle, now)
    this.applyScreenLightAngle(this.currentScreenAngle)
    this.frameStartTime = performance.now()
  }

  planClockSync(currentAngle, startMs) {
    const globalPosition = this.globalClockPosition(startMs)
    const currentPosition = this.nearestClockPosition(currentAngle, globalPosition)
    const clockSpeed = this.clockDegreesPerMs()
    const delta = currentPosition - globalPosition
    if (Math.abs(delta) <= this.clock.syncToleranceDeg) return null

    if (delta > 0) {
      const coastRatio = this.clamp(this.clock.catchUpCoastRatio, 0, 0.9)
      const coastMs = delta / (clockSpeed * (1 - coastRatio))
      if (coastMs <= this.clock.maxHoldMs) {
        const travelDeg = clockSpeed * coastMs - delta
        return {
          mode: 'coast',
          startMs,
          endMs: startMs + coastMs,
          durationMs: coastMs,
          startAngle: currentPosition,
          travelDeg,
          endVelocityDegPerMs: clockSpeed,
        }
      }
    }

    const gap = delta < 0
      ? -delta
      : 360 - this.normalizeDegree(delta)
    const speedGain = Math.max(0.1, this.clock.maxChaseSpeedRatio - 1)
    const rawDuration = gap / (clockSpeed * speedGain)
    const durationMs = this.clamp(rawDuration, this.clock.minChaseMs, this.clock.maxChaseMs)
    const endMs = startMs + durationMs
    const targetPosition = this.globalClockPosition(endMs)
    const travelDeg = delta < 0
      ? targetPosition - currentPosition
      : targetPosition + 360 - currentPosition
    if (travelDeg <= this.clock.syncToleranceDeg) {
      return {
        mode: 'hold',
        startMs,
        endMs,
        startAngle: currentAngle,
      }
    }
    return {
      mode: 'chase',
      startMs,
      endMs,
      durationMs,
      startAngle: currentPosition,
      travelDeg,
      endVelocityDegPerMs: clockSpeed,
    }
  }

  syncedScreenAngle(nowMs) {
    if (!this.syncTransition) return this.globalClockAngle(nowMs)
    if (nowMs >= this.syncTransition.endMs) {
      this.syncTransition = null
      return this.globalClockAngle(nowMs)
    }
    if (this.syncTransition.mode === 'hold') return this.syncTransition.startAngle
    return this.chaseAngleAt(nowMs, this.syncTransition)
  }

  chaseAngleAt(nowMs, transition) {
    const t = this.clamp((nowMs - transition.startMs) / transition.durationMs, 0, 1)
    const distance = this.hermiteDistance(
      t,
      transition.travelDeg,
      0,
      transition.endVelocityDegPerMs * transition.durationMs,
    )
    return this.normalizeDegree(transition.startAngle + distance)
  }

  hermiteDistance(t, totalDistance, startSlope, endSlope) {
    const t2 = t * t
    const t3 = t2 * t
    return (t3 - 2 * t2 + t) * startSlope
      + (-2 * t3 + 3 * t2) * totalDistance
      + (t3 - t2) * endSlope
  }

  applyScreenLightAngle(screenAngle) {
    const angle = this.normalizeDegree(screenAngle)
    if (this.lastAppliedScreenAngle !== null
      && this.forwardDelta(this.lastAppliedScreenAngle, angle) < 0.001) return
    this.currentScreenAngle = angle
    this.lastAppliedScreenAngle = angle
    if (typeof noteArtworkScreenLightAngle === 'function') noteArtworkScreenLightAngle(angle)
    const localAngle = typeof artworkLocalLightAngleFor === 'function'
      ? artworkLocalLightAngleFor(angle)
      : angle
    globalControls.shadAngle = localAngle
    const radians = localAngle * Math.PI / 180
    this.batchUpdateFilters(Math.cos(radians), Math.sin(radians))
  }

  readRenderedScreenAngle() {
    const localAngle = this.normalizeDegree(globalControls?.shadAngle ?? 90)
    const rotationAngle = typeof artworkRotationSnapshot === 'function'
      ? artworkRotationSnapshot().angle
      : 0
    return this.normalizeDegree(localAngle + rotationAngle)
  }

  globalClockAngle(nowMs = this.clockNowMs()) {
    return this.normalizeDegree(this.globalClockPosition(nowMs))
  }

  globalClockPosition(nowMs = this.clockNowMs()) {
    const elapsedMs = nowMs - this.clock.epochMs
    return (elapsedMs / this.clock.rotationDurationMs) * 360
  }

  nearestClockPosition(angle, globalPosition) {
    const normalizedAngle = this.normalizeDegree(angle)
    const cycleStart = Math.floor(globalPosition / 360) * 360
    const candidates = [
      cycleStart + normalizedAngle - 360,
      cycleStart + normalizedAngle,
      cycleStart + normalizedAngle + 360,
    ]
    return candidates.reduce((nearest, candidate) => {
      return Math.abs(candidate - globalPosition) < Math.abs(nearest - globalPosition)
        ? candidate
        : nearest
    }, candidates[0])
  }

  clockNowMs() {
    if (this.clock.source === 'performance-time-origin' && performance?.timeOrigin) {
      return performance.timeOrigin + performance.now()
    }
    return Date.now()
  }

  clockDegreesPerMs() {
    return 360 / this.clock.rotationDurationMs
  }

  normalizeDegree(angle) {
    const n = Number(angle)
    if (!Number.isFinite(n)) return 0
    return ((n % 360) + 360) % 360
  }

  forwardDelta(fromAngle, toAngle) {
    return this.normalizeDegree(toAngle - fromAngle)
  }

  clamp(value, minValue, maxValue) {
    return Math.min(maxValue, Math.max(minValue, value))
  }
}