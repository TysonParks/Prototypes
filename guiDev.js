// DEV-ONLY: dat.GUI, seed navigation, export shortcuts, wrapper debug keys.

let gui

function createGUI() {
  gui = new dat.GUI()
  gui.close()

  let testingGUI = gui.addFolder('Testing')
  testingGUI.open()
  testingGUI.add(testingControls, 'hashNumber', 0, lastHash.length - 1, 1).onChange(redrawAll).listen()
  testingGUI.add(testingControls, 'lastHash').onChange(redrawAll)
  testingGUI.add(testingControls, 'blackMode').onChange(redrawAll)

  let globalGUI = gui.addFolder('Global Controls')
  globalGUI.open()
  globalGUI.add(globalControls, 'shadAngle', 0, 360, 5).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'animated').onChange(drawObjects)
}

function keyPressed() {
  if (key === 's') {
    saveArtworkPNG()
  }
  if (key === 'v') {
    Export.exportFrames({
      size: vert(533, 960),
      totalFrames: 900,
      scale: 1,
      startAngle: 90,
      useDirectoryPicker: true,
    })
  }
  if (key === 'b') {
    const batchHashes = [
      '0x33cf0b21d30a6538731f0521f5594ed7cfb1b7a6e4c76f5b93222f2a3f30548c',
    ]
    if (batchHashes.length === 0) {
      console.warn(`No hashes in batch list — add hashes to guiDev.js batchHashes array`)
    } else {
      protoBatch.batchAnimationExport({
        hashes: batchHashes,
        size: vert(1600, 2880),
        totalFrames: 1885,
        scale: 1,
        startAngle: 90,
      })
    }
  }
  if (key === 'n') {
    // Chrome regen is owned by RevealAnimationDev.js (hide → build). Calling
    // buildFromNewSeed() here skips the hide animation and resets rotation layout.
    if (typeof RevealAnim !== 'undefined' && RevealAnim && !RevealAnim.isWebKitClass) return
    if (typeof protoBatch !== 'undefined' && protoBatch) {
      protoBatch.buildFromNewSeed()
    }
  }
  if (key === 't') {
    protoBatch.testContactSheet()
  }
  if (key === 'd') {
    WrapperDebugOverlay.toggle(GRID)
  }
}

function getCurrentTime(format24Hr = false) {
  const
    now = new Date(),
    minutes = String(now.getMinutes()).padStart(2, '0'),
    seconds = String(now.getSeconds()).padStart(2, '0')
  let
    hours = now.getHours(),
    amPm = ''
  if (!format24Hr) {
    amPm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
  }
  hours = String(hours).padStart(2, '0')
  return `${hours}.${minutes}.${seconds}${amPm ? '' + amPm : ''}`
}
