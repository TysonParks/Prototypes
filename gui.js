let gui

let testingControls = {
  hashNumber: 0,
  lastHash: true,
  labels: false,
  borders: true,
  testColors: false,
  shapeVerts: true,
  blackMode: false,
}

let globalControls = {
  baseColor: '#EEEEEE',
  shadAngle: 45,
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