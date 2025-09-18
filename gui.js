let
  gui,

  testingControls = {
    hashNumber: 1371,
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
    // const rez = vert(2276, 4096)
    const rez = vert(4000, 7200) // MY DEFAULT
    // const rez = vert(4551, 8192)
    // const rez = vert(8000, 14400)
    // const rez = vert(9102, 16384) 
    // const rez = vert(10000, 18000) // MAX RESOLUTION
    const scaledRez = rez.mult(scale)
    const rezString = `${scaledRez.x}x${scaledRez.y}`
    const date = getCurrentDateString()
    const time = getCurrentTime()
    const hash = tokenData.hash
    const name = `Prototype-${date}-${rezString}-${hash}.png`

    Export.exportPNG(FRAME.svgMarkup, name, rez.x, rez.y, scale)
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