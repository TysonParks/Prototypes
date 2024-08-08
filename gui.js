let gui

let testingControls = {
  hashNumber: 469,
  lastHash: true,
  labels: true,
  borders: false,
  testColors: false,
  shapeVerts: true,
  blackMode: false,
}

let globalControls = {
  baseColor: '#EEEEEE',
  shadAngle: 90,
  shadMag: 64,
  shadQuality: 0.25,
  start: 0.5,
  spread: 16,
  inset: false,
  same: false,
  animated: false,
}

let testShapeControls = {
  topLeadRadius: 30,
  toptTrailRadius: 30,
  botTrailRadius: 30,
  botLeadRadius: 30,
  topLeadPercent: false,
  toptTrailPercent: false,
  botTrailPercent: false,
  botLeadPercent: false,
  cloneScale: 0.5,
  xSkew: 0,
  ySkew: 0,
}

let testSquircleControls = {
  width: 200,
  height: 200,
  curveWidth: 1,
  curveHeight: 1,
  flareMode: false,
}

let testCurveShapeControls = {
  drawPoints: true,
}

// GUI using dat.GUI
function createGUI() {
  gui = new dat.GUI()
  gui.close()

  let testingGUI = gui.addFolder('Testing')
  testingGUI.open()
  testingGUI.add(testingControls, 'hashNumber', 0, 2, 1).onChange(redrawAll).listen()
  testingGUI.add(testingControls, 'lastHash').onChange(redrawAll)
  testingGUI.add(testingControls, 'labels').onChange(redrawAll)
  testingGUI.add(testingControls, 'borders').onChange(redrawAll)
  testingGUI.add(testingControls, 'testColors').onChange(redrawAll)
  testingGUI.add(testingControls, 'shapeVerts').onChange(redrawAll)
  testingGUI.add(testingControls, 'blackMode').onChange(redrawAll)

  let globalGUI = gui.addFolder('Global Controls')
  globalGUI.open()
  globalGUI.addColor(globalControls, 'baseColor').onChange(drawObjects)
  globalGUI.add(globalControls, 'shadAngle', 0, 360, 5).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'shadMag', -64, 64, 1).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'shadQuality', 0, 0.9, 0.01).onChange(drawObjects)
  globalGUI.add(globalControls, 'start', 0.5, 16, 0.5).onChange(drawObjects)
  globalGUI.add(globalControls, 'spread', 0, 16, 1).onChange(drawObjects)
  globalGUI.add(globalControls, 'inset').onChange(drawObjects)
  globalGUI.add(globalControls, 'same').onChange(drawObjects)
  globalGUI.add(globalControls, 'animated').onChange(drawObjects)

  let shapeGUI = gui.addFolder('Test Shape')
  // shapeGUI.open()
  shapeGUI.add(testShapeControls, 'topLeadRadius', 0, 200, 1).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'toptTrailRadius', 0, 200, 1).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'botTrailRadius', 0, 200, 1).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'botLeadRadius', 0, 200, 1).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'topLeadPercent').onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'toptTrailPercent').onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'botTrailPercent').onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'botLeadPercent').onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'cloneScale', 0, 2, 0.001).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'xSkew', -30, 30, 1).onChange(drawObjects)
  shapeGUI.add(testShapeControls, 'ySkew', -30, 30, 1).onChange(drawObjects)

  let squircleGUI = gui.addFolder('Test Squircle')
  // squircleGUI.open()
  squircleGUI.add(testSquircleControls, 'width', 0, 400, 1).onChange(drawObjects)
  squircleGUI.add(testSquircleControls, 'height', 0, 400, 1).onChange(drawObjects)
  squircleGUI.add(testSquircleControls, 'curveWidth', 0, 1, 0.01).onChange(drawObjects)
  squircleGUI.add(testSquircleControls, 'curveHeight', 0, 1, 0.01).onChange(drawObjects)
  squircleGUI.add(testSquircleControls, 'flareMode').onChange(drawObjects)

  let curveShapeGUI = gui.addFolder('Curve Shape')
  // curveShapeGUI.open()
  curveShapeGUI.add(testCurveShapeControls, 'drawPoints').onChange(drawObjects)
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
