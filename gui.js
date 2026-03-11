let
  gui,

  testingControls = {
    hashNumber: 1472,
    lastHash: true,
    blackMode: false,
  },

  globalControls = {
    shadAngle: 90,
    animated: false,
  }

//FUNC: createGUI() : void : creates the GUI using dat.GUI
function createGUI() {
  gui = new dat.GUI()
  gui.close()

  let testingGUI = gui.addFolder('Testing')
  testingGUI.open()
  testingGUI.add(testingControls, 'hashNumber', 0, 2, 1).onChange(redrawAll).listen()
  testingGUI.add(testingControls, 'lastHash').onChange(redrawAll)
  testingGUI.add(testingControls, 'blackMode').onChange(redrawAll)

  let globalGUI = gui.addFolder('Global Controls')
  globalGUI.open()
  globalGUI.add(globalControls, 'shadAngle', 0, 360, 5).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'animated').onChange(drawObjects)
}

// MARK: Keyboard UI
//NOTE: Create with GPT-4 on April 15,2023
//FUNC: keyPressed() p5js overload for PNG saving
function keyPressed() {
  if (key === 's') {
    console.log('s pressed')
    const scale = 1
    // const rez = vert(500, 900)
    // const rez = vert(569, 1024)
    // const rez = vert(1000, 1800)
    // const rez = vert(1138, 2048)
    // const rez = vert(2000, 3600)
    const rez = vert(3000, 5400)
    // const rez = vert(2276, 4096)
    // const rez = vert(4000, 7200) // MY DEFAULT
    // const rez = vert(4551, 8192)
    // const rez = vert(8000, 14400)
    // const rez = vert(9102, 16384) 
    // const rez = vert(10000, 18000) // MAX RESOLUTION
    const scaledRez = rez.mult(scale)
    const rezString = `${scaledRez.x}x${scaledRez.y}`
    const date = getCurrentDateString()
    const time = getCurrentTime()
    const hash = tokenData.hash
    // const trimmedHash = `${hash.slice(0, 4)}\u2026${hash.slice(-4)}`
    const name = `Prototypes-${hash}-${date}-${rezString}.png`

    Export.exportPNG(FRAME.svgMarkup, name, rez.x, rez.y, scale)
  }
  if (key === 'v') {
    // Export video frames — full 360° light rotation
    Export.exportFrames({
      size: vert(533, 960),       // lower rez for speed; swap to vert(4000, 7200) for final
      totalFrames: 900,             // 360 frames = 1° per frame
      scale: 1,
      startAngle: 90,
      useDirectoryPicker: true,     // will prompt for folder in Chrome/Edge; falls back to downloads
    })
  }
  if (key === 'b') {
    // Batch animation export — edit the hashes array below to queue work
    const batchHashes = [
      // '0x3d682a55c571eedddf21e1d278ad2f882798558ecc0de9220fe3213c8be96196',
      // '0x583a68366d00c17746db3da574b0660d0c8e86393ae7516f24134e6610a19dad',
      // '0x842b0ab457eb22032b51eaf8522064e4df39e0b3242c6aa327ae0bae56fb6556',
      // '0x2610fa1d45bf324e92f30706b2b2f4e4793b3cd6a2245ba574a2c0f2118f109d',
      // '0x18cc6c2b1f25cb80170eb71524493689dd5ca126b55da6fe58bd34a8a958da39',
      // '0x40eb66ccff015e7f163b55f5a894791850f9ee8a48455bd94a124e6ea3678e8d',
      // '0x1d81414ac17aa7a54ed00937fe649dce0f6b38c07c1310c09ecbeba314489534',
      // '0x5d6464f56393f303a54aaceb0d039b694df2ee33dfe720e345bf60f4b493053f',
      // '0x174d3047ec0164b6e3cb4619ebe90b09b01d4d126f8f11e01dded62865b898ac',
      // '0x6874d9d4421f93005cf371a46a8cb99bb3b92dc3fef5a9bee3b488833f0009c7',
      // '0x42129fff10e716a7b14f9f5c46016d6f86c8d84a0276bbc60bf3e86f6c605772',
      // '0x39146d6949d098e1b12a899cd6ec1faf7ccec30f071fed5723c552b3c6a954de',
      // '0x9daf92de6d3fe04c7c8ac1321cf0a10be38373bb6b24352bb478733d58d01694',
      // '0xf37745d9160c5dcce4edb2da4fa223c891920725a3dcf5338be85ef2cbcb96eb',
      // '0x66fdd2a41ae8a55948fb51cb38a71f7d2f2942d4db32805945a7a0c31f394461',
      // '0xef5c61830cc6b9c46519acb9fe067b3dbecd9bc2477d6c25f8d570af7b306dfd',
      // '0x160e74d6db644c656f4e15bb993ae34660b677763240faaee23f24590e001562',
      '0x33cf0b21d30a6538731f0521f5594ed7cfb1b7a6e4c76f5b93222f2a3f30548c',
    ]
    if (batchHashes.length === 0) {
      console.warn(`No hashes in batch list — add hashes to gui.js batchHashes array`)
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
    // Generate a new random seed and rebuild
    protoBatch.buildFromNewSeed()
  }
  if (key === 't') {
    // Generate wrapper test contact sheet
    protoBatch.testContactSheet()
  }
  if (key === 'd') {
    // Toggle wrapper debug overlay on current render
    WrapperDebugOverlay.toggle(GRID)
  }
  if (key === 'l') {
    // use for cornerScale animation
  }
  if (key === 'o') {
    // use for shade blurScale animation
  }
}

//FUNC: getCurrentDateString() : date (string) : in YYYY.MM.DD format
//NOTE: Create with GPT-4 on April 15,2023
function getCurrentDateString() {
  const
    currentDate = new Date(),
    year = currentDate.getFullYear(),
    month = String(currentDate.getMonth() + 1).padStart(2, '0'),
    day = String(currentDate.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

//FUNC: getCurrentTime24HrFormat() : time (string) : in HH.MM.SS format
//NOTE: Create with GPT-4 on April 15,2023
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