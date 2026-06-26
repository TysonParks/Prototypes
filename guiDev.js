// DEV-ONLY: dat.GUI, seed navigation, export shortcuts, wrapper debug keys.

let gui

function createGUI() {
  gui = new dat.GUI()
  gui.close()

  let testingGUI = gui.addFolder('Testing')
  testingGUI.open()
  testingGUI.add(testingControls, 'hashNumber', 0, lastHash.length - 1, 1).onChange(redrawAll).listen()
  testingGUI.add(testingControls, 'mode', { lastHash: 0, HashHorizon: 1 })
  testingGUI.add(testingControls, 'lastHash').onChange(redrawAll)
  testingGUI.add(testingControls, 'blackMode').onChange(redrawAll)

  let globalGUI = gui.addFolder('Global Controls')
  globalGUI.open()
  globalGUI.add(globalControls, 'shadAngle', 0, 360, 5).onChange(drawObjects).listen()
  globalGUI.add(globalControls, 'animated').onChange(drawObjects)
}

function getArtworkExportRotationInfo() {
  const snap = typeof artworkRotationSnapshot === 'function'
    ? artworkRotationSnapshot()
    : { angle: 0 }
  const stateAngle = normalizeExportRotationAngle(snap.angle)
  const visualAngle = getLiveArtworkRotationAngle()
  const angle = visualAngle === null ? stateAngle : visualAngle
  const position = angle / 90
  const aspect = position % 2 === 0 ? 'V' : 'H'
  return {
    angle,
    position,
    aspect,
    code: `r${position}${aspect}`,
    isHorizontal: aspect === 'H',
  }
}

function getLiveArtworkRotationAngle() {
  const transform = FRAME?.bleed?.elt?.style?.transform || ''
  const match = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)
  if (!match) return null
  return normalizeExportRotationAngle(Number(match[1]))
}

function normalizeExportRotationAngle(angle) {
  const n = Number(angle)
  if (!Number.isFinite(n)) return 0
  return ((Math.round(n / 90) * 90) % 360 + 360) % 360
}

function getArtworkExportResolution(baseRez, rotationInfo, scale = 1) {
  const isHorizontal = rotationInfo.isHorizontal
    || normalizeExportRotationAngle(rotationInfo.angle) % 180 !== 0
  let width = isHorizontal ? baseRez.y : baseRez.x
  let height = isHorizontal ? baseRez.x : baseRez.y
  if (isHorizontal && height > width) [width, height] = [height, width]
  if (!isHorizontal && width > height) [width, height] = [height, width]
  return {
    width,
    height,
    rezString: `${width * scale}x${height * scale}`,
  }
}

function createRotationAwareSVGMarkup(svgElement, rotationInfo, width, height) {
  const clone = svgElement.cloneNode(true)
  clone.style.removeProperty('transform')
  clone.style.removeProperty('transform-origin')
  clone.style.removeProperty('transform-box')
  clone.style.removeProperty('will-change')
  clone.style.removeProperty('position')
  clone.style.removeProperty('left')
  clone.style.removeProperty('top')
  clone.style.removeProperty('max-width')
  clone.style.removeProperty('max-height')
  clone.setAttribute('width', `${width}`)
  clone.setAttribute('height', `${height}`)

  const viewBox = parseSVGViewBox(clone.getAttribute('viewBox'))
  if (!viewBox) return Export.createSVGMarkup(clone)

  const angle = rotationInfo.angle
  if (angle === 0) return Export.createSVGMarkup(clone)

  const cx = viewBox.x + viewBox.width / 2
  const cy = viewBox.y + viewBox.height / 2
  const rotatedViewBox = rotationInfo.isHorizontal
    ? {
      x: cx - viewBox.height / 2,
      y: cy - viewBox.width / 2,
      width: viewBox.height,
      height: viewBox.width,
    }
    : viewBox
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  wrapper.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`)
  while (clone.firstChild) wrapper.appendChild(clone.firstChild)
  clone.appendChild(wrapper)
  clone.setAttribute('viewBox', formatSVGViewBox(rotatedViewBox))
  return Export.createSVGMarkup(clone)
}

function getSVGMarkupIntrinsicSize(svgMarkup) {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
  const root = doc.documentElement
  const width = Number.parseFloat(root?.getAttribute('width'))
  const height = Number.parseFloat(root?.getAttribute('height'))
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null
  return { width, height, rezString: `${width}x${height}` }
}

function parseSVGViewBox(raw) {
  const vals = String(raw || '').trim().split(/[\s,]+/).map(Number)
  if (vals.length !== 4 || vals.some(v => !Number.isFinite(v))) return null
  return { x: vals[0], y: vals[1], width: vals[2], height: vals[3] }
}

function formatSVGViewBox({ x, y, width, height }) {
  return `${x} ${y} ${width} ${height}`
}

function keyPressed() {
  if (key === 's') {
    const scale = 1
    const rez = vert(3000, 5400)
    const rotationInfo = getArtworkExportRotationInfo()
    const exportRez = getArtworkExportResolution(rez, rotationInfo, scale)
    const date = getCurrentDateString()
    const hash = tokenData.hash
    const name = `Prototypes-${date}-${rotationInfo.code}-${hash}-${exportRez.rezString}.png`
    const svgMarkup = createRotationAwareSVGMarkup(
      FRAME.bleed.elt,
      rotationInfo,
      exportRez.width,
      exportRez.height,
    )
    const exportSize = getSVGMarkupIntrinsicSize(svgMarkup) || exportRez
    Export.exportPNG(svgMarkup, name, exportSize.width, exportSize.height, scale)
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

function getCurrentDateString() {
  const
    currentDate = new Date(),
    year = currentDate.getFullYear(),
    month = String(currentDate.getMonth() + 1).padStart(2, '0'),
    day = String(currentDate.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
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
