let gui

let testingControls = {
  hashNumber: 807,
  lastHash: false,
  blackMode: false,
}

let globalControls = {
  shadAngle: 90,
  animated: false,
}

// GUI using dat.GUI
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
    // console.log('s pressed')
    const scale = 1
    // const rez = vert(500, 900)
    // const rez = vert(569, 1024)
    // const rez = vert(1000, 1800)
    // const rez = vert(1138, 2048)
    // const rez = vert(2000, 3600)
    // const rez = vert(2276, 4096)
    const rez = vert(4000, 7200)
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

    ProtoSVG.exportPNG(FRAME.svgMarkup, name, rez.x, rez.y, scale)
  }
  if (key === 'l') {
    // use for cornerScale animation
  }
  if (key === 'o') {
    // use for shade blurScale animation
  }
}
//NOTE: Create with GPT-4 on April 15,2023
//FUNC: getCurrentDateString()
function getCurrentDateString() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
//NOTE: Create with GPT-4 on April 15,2023
//FUNC: getCurrentTime24HrFormat()
function getCurrentTime(format24Hr = false) {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  let amPm = '';

  if (!format24Hr) {
    amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }

  hours = String(hours).padStart(2, '0');

  return `${hours}.${minutes}.${seconds}${amPm ? '' + amPm : ''}`;
}

