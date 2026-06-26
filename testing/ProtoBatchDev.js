// DEV-ONLY: ProtoBatch extensions — batch export, wrapper test batches.
// Hash navigation lives in ProtoBatch.js (installHashNav).
// Load after ProtoBatch.js; excluded from Art Blocks submission bundle.

Object.assign(ProtoBatch.prototype, {
  async batchAnimationExport({
    hashes = [],
    size = vert(1066, 1920),
    totalFrames = 180,
    scale = 1,
    startAngle = 90,
  } = {}) {
    if (hashes.length === 0) {
      console.warn(`ProtoBatch: no hashes provided`)
      return
    }

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

      this.teardown()
      this.buildFromHash(hash)
      await new Promise(r => requestAnimationFrame(r))

      await Export.exportFrames({
        size,
        totalFrames,
        scale,
        startAngle,
        useDirectoryPicker: false,
        _dirHandle: dirHandle,
        _hashPrefix: trimmedHash,
      })
    }

    const shadVect = Shade.shadVect(startAngle)
    S.offsetElts.forEach(({ elt, mag }) => {
      elt.attribute('dx', shadVect.x * mag)
      elt.attribute('dy', shadVect.y * mag)
    })

    const totalTime = ((performance.now() - batchStart) / 1000).toFixed(1)
    console.log(`\n=== BATCH COMPLETE: ${hashes.length} hashes in ${totalTime}s ===\n`)
  },

  async batchSeedCapture({ count = 100 } = {}) {
    console.log(`batchSeedCapture is a stub — not yet implemented`)
  },

  async testContactSheet({ cols = 4, cellSize = { x: 400, y: 720 } } = {}) {
    await batchContactSheet({ cols, cellSize, label: `wrapper-test-contact-sheet` })
  },

  async testSnapshots({ size = { x: 800, y: 1440 } } = {}) {
    await batchSnapshotExport({ size })
  },

  async quickContactSheet(hashes, cols = 4) {
    await batchContactSheet({
      hashes: hashes.map((h, i) => ({ hash: h, name: `#${i}`, status: `untested` })),
      cols,
      label: `quick-contact-sheet`,
    })
  },
})
