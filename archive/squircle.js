
// TODO: keep these around and make adaptations using the curving code
// ARCHIVED 2026-06 — not loaded by index.html or submission bundle.
// Dev harness: testing/testMess.js drawSquircle() (optional manual script load).

// FUNC: squircleShape()
function squircleShape(width, height, curveWidth = 1, curveHeight = 1) {
  let path = squirclePath(width, height, curveWidth, curveHeight)
  // let path = "path('M40,160 L100,40 L160,160 Z')"
  let wrapper = createDiv()
  // .parent(parent)

  let squircleMask = createDiv()
    .size(width, height)
    .style('clip-path', path)
    .style('shape-outside', path)
    .parent(wrapper)

  return wrapper
}

// FUNC: squirclePath()
function squirclePath(width, height, curveWidth = 1, curveHeight = 1, flareMode = false) {
  let center = createVector(width / 2, height / 2)

  let leadingX = (center.x - width / 2)
  let topY = (center.y - height / 2)
  let trailingX = (center.x + width / 2)
  let bottomY = (center.y + height / 2)

  let ctrlWidth = map(curveWidth, 0, 1, 0, width)
  let ctrlHeight = map(curveHeight, 0, 1, 0, height)

  let ctrlLeading = (center.x - ctrlWidth / 2)
  let ctrlTop = (center.y - ctrlHeight / 2)
  let ctrlTrailing = (center.x + ctrlWidth / 2)
  let ctrlBottom = (center.y + ctrlHeight / 2)

  let defStart, defTop, defTrailing, defBottom, defEnd
  if (!flareMode) {
    defStart = `M ${leadingX}, ${center.y} C ${leadingX}, ${ctrlTop} `
    defTop = `${ctrlLeading}, ${topY} ${center.x}, ${topY} C ${ctrlTrailing}, ${topY} `
    defTrailing = `${trailingX}, ${ctrlTop} ${trailingX}, ${center.y} C ${trailingX}, ${ctrlBottom} `
    defBottom = `${ctrlTrailing}, ${bottomY} ${center.x}, ${bottomY} C ${ctrlLeading}, ${bottomY} `
    defEnd = `${leadingX}, ${ctrlBottom} ${leadingX}, ${center.y}`
  } else {
    defStart = ` M ${leadingX}, ${center.y} C ${ctrlLeading}, ${ctrlTop} `
    defTop = `${ctrlLeading}, ${ctrlTop} ${center.x}, ${topY} C ${ctrlTrailing}, ${ctrlTop} `
    defTrailing = `${ctrlTrailing}, ${ctrlTop} ${trailingX}, ${center.y} C ${ctrlTrailing}, ${ctrlBottom} `
    defBottom = `${ctrlTrailing}, ${ctrlBottom} ${center.x}, ${bottomY} C ${ctrlLeading}, ${ctrlBottom} `
    defEnd = `${ctrlLeading}, ${ctrlBottom} ${leadingX}, ${center.y}`
  }

  let path = `path('${defStart + defTop + defTrailing + defBottom + defEnd}')`
  // print(path)
  return path
}