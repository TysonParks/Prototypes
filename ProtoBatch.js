// CLASS: ProtoBatch
// Orchestrates single and batch builds for different hashes.
// Manages teardown → rebuild cycle and batch animation export.

class ProtoBatch {
  // Track the current hash driving the live artwork
  currentHash = null

  // ──────────────────────────────────────────────
  // MARK: Build Pipeline
  // ──────────────────────────────────────────────

  //METH: buildFromHash(hash) — full deterministic build from a given hash
  buildFromHash(hash) {
    // 1. Seed tokenData so Random picks it up
    tokenData.hash = hash
    this.currentHash = hash

    // 2. Run the same sequence as setup(), minus sizeFrame/noCanvas (already done)
    setupPrefs()        // R, S, RuID, animationController re-created from new hash
    setupColors()
    setupBackground()

    DeBug.groupCollapsed(`setupFeatures`)
    const features = setupFeatures()
    DeBug.groupEnd()
    DeBug.warn('Features', features)
    DeBug.warn('Features R useage', R.useage)

    gridTests2(features)

    // Wrapper memoization integrity test
    runWrapperTests(GRID)

    DeBug.log('random R useage', R.useage)
    DeBug.log('random RuID useage', RuID.useage)
  }

  // ──────────────────────────────────────────────
  // MARK: Teardown
  // ──────────────────────────────────────────────

  //METH: teardown() — remove SVG DOM and null globals so a fresh build can run
  teardown() {
    // Stop any running animation
    globalControls.animated = false

    // Remove the BG div (contains FRAME and all SVG content)
    if (BG && BG.elt && BG.elt.parentNode) {
      BG.elt.parentNode.removeChild(BG.elt)
    }

    // Null out globals so nothing references stale objects
    BG = null
    FRAME = null
    BGRID = null
    GRID = null
    R = null
    S = null
    RuID = null
    animationController = null
  }

  // ──────────────────────────────────────────────
  // MARK: Rebuild / New Seed
  // ──────────────────────────────────────────────

  //METH: rebuild() — teardown + rebuild with the same hash
  rebuild() {
    const hash = this.currentHash
    this.teardown()
    this.buildFromHash(hash)
  }

  //METH: buildFromNewSeed() — generate a random hash, teardown, and rebuild
  buildFromNewSeed() {
    const newHash = random_hash()       // from tokenHash.js
    console.log(`New seed: ${newHash}`)
    this.teardown()
    this.buildFromHash(newHash)
  }

  // ──────────────────────────────────────────────
  // MARK: Batch Animation Export
  // ──────────────────────────────────────────────

  //METH: batchAnimationExport({hashes, animationSettings})
  // Renders a full animation sequence for every hash in the array.
  // A single directory picker prompt covers all hashes.
  async batchAnimationExport({
    hashes = batchHashes01,
    size = vert(1066, 1920),
    totalFrames = 180,
    //  totalFrames = 1885,
    scale = 1,
    startAngle = 90,
  } = {}) {
    if (hashes.length === 0) {
      console.warn(`ProtoBatch: no hashes provided`)
      return
    }

    // One directory picker for the entire batch
    let dirHandle = null
    if (window.showDirectoryPicker) {
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      } catch (e) {
        console.warn(`Directory picker cancelled — aborting batch export`)
        return
      }
    }

    const batchStart = performance.now()
    console.log(`\n=== BATCH EXPORT: ${hashes.length} hashes × ${totalFrames} frames ===\n`)

    for (let h = 0; h < hashes.length; h++) {
      const hash = hashes[h]
      const trimmedHash = `${hash.slice(0, 6)}…${hash.slice(-4)}`
      console.log(`\n--- [${h + 1}/${hashes.length}] ${trimmedHash} ---`)

      // Teardown previous artwork and rebuild from this hash
      this.teardown()
      this.buildFromHash(hash)

      // Let the browser paint the new artwork once before exporting
      await new Promise(r => requestAnimationFrame(r))

      // Export frames for this hash, passing the shared dirHandle
      await Export.exportFrames({
        size,
        totalFrames,
        scale,
        startAngle,
        useDirectoryPicker: false,    // we manage the handle ourselves
        _dirHandle: dirHandle,        // pass the shared handle
        _hashPrefix: trimmedHash,     // prefix for filename grouping
      })
    }

    // Restore the last hash's artwork at rest
    const shadVect = Shade.shadVect(startAngle)
    S.offsetElts.forEach(({ elt, mag }) => {
      elt.attribute('dx', shadVect.x * mag)
      elt.attribute('dy', shadVect.y * mag)
    })

    const totalTime = ((performance.now() - batchStart) / 1000).toFixed(1)
    console.log(`\n=== BATCH COMPLETE: ${hashes.length} hashes in ${totalTime}s ===\n`)
  }

  // ──────────────────────────────────────────────
  // MARK: Batch Seed Capture (stub for future use)
  // ──────────────────────────────────────────────

  //METH: batchSeedCapture() — placeholder for rendering single frames from many random seeds
  async batchSeedCapture({ count = 100 } = {}) {
    console.log(`batchSeedCapture is a stub — not yet implemented`)
    // Future: generate N random hashes, build each, export a single PNG
  }
}
