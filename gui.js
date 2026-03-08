let
  gui,

  testingControls = {
    hashNumber: 1465,
    lastHash: false,
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
// Production: all keyboard shortcuts disabled
function keyPressed() {
  // no-op for production
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