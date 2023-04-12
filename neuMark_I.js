// MARK: CSS Factory Functions

// TODO: after most work is complete check to see how many of these are actually used and clean where needed
// CLASS: CS
class CS {
  static inset = 'inset'
  // static space = ' '
  static comma = ', '

  static boxShadow = 'box-shadow'
  // static dropShadow = 'drop-shadow'
  static textShadow = 'text-shadow'

  static transform = 'transform'
  static border = 'border'
  static borderRadius = 'border-radius'
  static rotate = 'rotate'
  static scale = 'scale'
  static filter = 'filter'
  static padding = 'padding'
  static clipPath = 'clip-path'
  static shapeOutside = 'shape-outside'
  static fontSize = 'font-size'
  static textAlign = 'text-align'
  static vertAlign = 'vertical-align'
  static lineHeight = 'line-height'
  static margin = 'margin'
  // static width = 'width'
  static background = 'background'
  static backgroundColor = 'background-color'
  static color = 'color'
  static clear = "#0000"
  static display = 'display'
  static overflow = 'overflow'
  static flexDirection = 'flex-direction'
  static justifyContent = 'justify-content'
  static alignItems = 'align-items'
}

// MARK:CSS Look Class

// PROTOTYPE: p5.Element.prototype.look()
p5.Element.prototype.look = function (look = Look.testGrid, html) {
  if (look instanceof Array) {
    const lookOp = OpArray.from(look).compacted
    lookOp.forEach(e => this.style(e[0], e[1]))
  }
  if (html) { this.html(html) }
  return this
}



// PROTOTYPE: p5.Element.prototype.label(text, color, direction)
p5.Element.prototype.label = function (text, color, direction) {
  const labelText = createSVGElt("text");
  labelText.html(text);
  labelText.style("fill", color);

  const parentBBox = this.elt.getBBox();

  const xFactor = direction.isNone ? 0.5 : Math.cos(direction.angle);
  const yFactor = direction.isNone ? 0.5 : Math.sin(direction.angle);

  const x = parentBBox.x + (parentBBox.width * (xFactor + 1)) / 2;
  const y = parentBBox.y + (parentBBox.height * (yFactor + 1)) / 2;

  labelText.attribute("x", x);
  labelText.attribute("y", y);
  labelText.attribute("text-anchor", "middle");
  labelText.attribute("dominant-baseline", "central");

  this.child(labelText);
  return this;
}

// PROTOTYPE: p5.Element.prototype.SVGlook()
p5.Element.prototype.svgLook = function (svgLook) {
  if (svgLook instanceof Array) {
    let lookOp = OpArray.from(svgLook).compacted
    if (svgLook[0][0] instanceof Array) {
      lookOp = lookOp.reduce((acc, val) => acc.concat(val), [])
    }
    lookOp.forEach(e => this.attribute(e[0], e[1]))
  }
  return this
}


// CLASS: SVGLook
class SVGLook {
  static testStroke(color = ProtoColor.randomHighHue(), opacity = 1, radius = 5) {
    return [
      ['stroke', color],
      ['stroke-opacity', `${opacity}`],
      ['stroke-width', '.5'],
      // ['pathLength', '360'],
      ['stroke-dasharray', `0 2`],
      ['stroke-linecap', 'round'],
      ['stroke-linejoin', 'round'],
      ['rx', `${radius}`],
      ['ry', `${radius}`],
      ['fill-opacity', '0'],
    ]
  }

  static testFill(color = ProtoColor.randomHighHue(), opacity = 1) {
    return [
      ['fill', color],
      ['fill-opacity', `${opacity}`],
    ]
  }

  static test(strokeColor, fillColor, opacity = .5, radius = 5) {
    return [SVGLook.testStroke(strokeColor, 1, radius), SVGLook.testFill(fillColor, `${opacity}`)]
  }

  static neuShade({
    baseCol = protoColor(230),
    vector = globalShadowVector(),
    start = globalControls.start,
    spread = globalControls.spread,
    inset = globalControls.inset,
  } = {}) {

  }
  static blackAndWhite() { }
}


// CLASS: Look
class Look {

  static islandShape(path, color = randomColor().toString('#rrggbbaa')) {
    return [
      [CS.backgroundColor, testingControls.blackMode ? '#000' : color],
      [CS.clipPath, path],
      [CS.shapeOutside, path],
      // [CS.overflow, 'visible']
    ]
  }

  static neuShade(
    {
      baseCol = protoColor(230),
      vector = globalShadowVector(),
      start = globalControls.start,
      spread = globalControls.spread,
      inset = globalControls.inset,
    } = {}
  ) {
    return [[CS.boxShadow, Shade.neuBoxShadFactory(baseCol, vector, start, spread, inset)]]
  }

  static textAlign({ size, hor = 'center', vert = 'center' } = {}) {
    let textAlign = [CS.textAlign, hor]
    let lineHeight = [CS.lineHeight, `${size.y}px`]
    let otherHeight = [CS.lineHeight, `${(size.y + (sqrt(size.x) * 2.5))}px`]
    if (vert === 'center') { return [textAlign, lineHeight] }
    if (vert === 'top') { return [textAlign] }
    if (vert === 'below') { return [textAlign, otherHeight] }
  }

  static testText(
    sizeX,
    color,
    radius = 25,
    labels = testingControls.labels,
    borders = testingControls.borders,
  ) {
    return [
      [CS.color, (labels ? color : CS.clear)],
      // [CS.borderRadius, `${sqrt(sizeX) * 1.5}px`],
      [CS.borderRadius, `${radius}px`],
      [CS.fontSize, `${sqrt(sizeX) * 1.5}px`],
      [CS.border, `${borders ? color : CS.clear} dashed ${sqrt(sizeX) / 20}px`],
    ]
  }

  static test(size, type) {
    switch (type) {
      case 'frame':
        return [...Look.textAlign({ size: size, vert: 'top' }), ...Look.testText(size.x, '#80F8', 10)]
      case 'grid':
        return [...Look.textAlign({ size: size, vert: 'top', hor: 'start' }), ...Look.testText(size.x, '#08F8')]
      case 'group':
        // return []
        return [...Look.textAlign({ size: size, hor: 'start', vert: 'top', }), ...Look.testText(size.x, '#80F0')]
      case 'cell':
        const text = [
          ...Look.textAlign({ size: size }),
          ...Look.testText(size.x, '#8088')
        ]
        const neuShade = [...Look.neuShade()]
        if (testingControls.blackMode) { return text }
        else { return [...text, ...neuShade] }
        return [
          ...Look.textAlign({ size: size }),
          ...Look.testText(size.x, '#8088'),
          ...Look.neuShade()
        ]
      case 'island':
        return [...Look.textAlign({ size: size }), ...Look.testText(size.x, '#F08b')]
      case 'shape':
        return [...Look.textAlign({ size: size, vert: 'below' }), ...Look.testText(size.x, '#F0Fb')]
    }
  }

  static get testGrid() {
    return [
      // [CS.color, '#80F'],
      [CS.color, CS.clear],
      [CS.backgroundColor, '#00'],
      [CS.borderRadius, '10%'],
      [CS.textAlign, "center"],
      // [CS.border, '#F7F dashed 1px'],
      // [CS.display, 'none'],
    ]
  }

  static testCell(color = randomColor().toString('#rrggbbaa'), labels = testingControls.labels,) {
    // let randomColor = randomColor().toString('#rrggbbaa')
    return [
      [CS.color, (labels ? '#00F' : CS.clear)],
      [CS.backgroundColor, '#0FF6'],
      [CS.backgroundColor, color],
      [CS.borderRadius, '20%'],
      [CS.textAlign, "center"],
      // [CS.border, '#808 solid 1px'],
    ]
  }

  static blankTestCell(labels = testingControls.labels,) {
    const neuShade = [...Look.neuShade({ vector: globalShadowVector().mult(0.3), inset: !globalControls.inset, })]
    return [
      [CS.color, (labels ? '#00F' : CS.clear)],
      [CS.backgroundColor, CS.clear],
      [CS.borderRadius, '50%'],
      [CS.textAlign, "center"],
      testingControls.blackMode ? neuShade : null,
      // neuShade,
      // ...Look.neuShade({ vector: globalShadowVector().mult(0.3), inset: !globalControls.inset, })
    ]
  }

  static centeredFlex(color, direction = 'row') {
    return [
      [CS.background, color],
      [CS.margin, '0'],
      [CS.display, 'flex'],
      [CS.flexDirection, direction],
      [CS.justifyContent, 'space-evenly'],
      [CS.alignItems, 'center'],
    ]
  }

}

// TODO: can these functions be generalized into Classes? Or proto extensions on p5.Element?
// MARK:CSS Shadow Functions

// PROTOTYPE: p5.Element.prototype.boxShadow
p5.Element.prototype.boxShadow = function (value) {
  return this.style(boxShadow, value)
}

// CLASS: Shade
class Shade {

  //shadowVector: create vector from Angle + Offset
  static shadVect(angle = 45, offset = 8) { return createVector(1, 0).rotate(angle).mult(offset) }
  static maxComponent(vector = this.shadVect()) {
    return vector.y
    // return max(this.x, this.y)
  }

  //Drop-Shadow 
  static dropShadSVG(x, y, blurRad = 0, col = color(0)) {

  }

  // Box-Shadow CSS
  static boxShadCSS(x, y, blurRad = 0, spreadRad = 0, col = color(0), inset = false) {
    let color = col.toString('#rrggbb')
    if (inset === true) {
      return `inset ${x}px ${y}px ${blurRad}px ${color}`
    } else if (spreadRad === 0) {
      return `${x}px ${y}px ${blurRad}px ${color}`
    } else {
      return `${x}px ${y}px ${blurRad}px ${spreadRad}px ${color}`
    }
  }

  // Text-Shadow CSS
  static textShadCSS(x, y, blurRad = 0, col = color(0)) { return this.boxShadCSS(x, y, blurRad, col) }

  // Drop-Shadow CSS
  static dropShadCSS(x, y, blurRad = 0, col = color(0)) {
    return `drop-shadow(${this.boxShadCSS(x, y, blurRad, col)})`
  }

  //Neumorphic Box-Shadow CSS - create highlight shadow pair code for CSS
  static neuBoxShadCSS(vector = this.shadVect(), blurRad, highCol, shadCol, inset = false) {
    let highlightCSS = this.boxShadCSS(-vector.x, -vector.y, blurRad, 0, highCol, inset)
    let shadowCSS = this.boxShadCSS(vector.x, vector.y, blurRad, 0, shadCol, inset)
    return `${shadowCSS}, ${highlightCSS}`
  }

  // Neumorphic Box Shadow Factory - create a shadow and highlight stack
  static neuBoxShadFactory(baseCol = protoColor(230), vector = this.shadVect(), start = 0.5, spread = 16, inset = false) {
    let offset = vector.mag() / sqrt(2)
    // print(`offset: ${offset}`)
    let cols = baseCol.highShadSpread(spread)
    let neuShads = cleanSlices(start, offset, globalControls.shadQuality)
    // print(neuShads.map(e => e.toFixed(2))) 
    neuShads = neuShads.map(sliceOffset => this.neuBoxShadCSS(vector.setMag(sliceOffset), 2 * sliceOffset, cols[0], cols[1], inset))
    return neuShads
  }


}


//TODO: DEPRECATE
//MARK: OLD "offset" VARIANTS
// #region OLD "offset" VARIANTS
// FUNC: neuDropShadowFactory()
//Neumorphic Box-Shadow CSS - create highlight shadow pair code for CSS
function neuBxShCSS(offset, blurRad, hiCol, shCol, inset = false) {
  let hiCSS = boxShadowCSS(-offset, -offset, blurRad, 0, hiCol, inset)
  let shCSS = boxShadowCSS(offset, offset, blurRad, 0, shCol, inset)
  return join([shCSS, hiCSS], CS.comma)
}

// FUNC: neuBxShFX()
// Neumorphic Box Shadow Factory - create a shadow and highlight stack
function neuBxShFX(baseCol, offset, start = 0.5, spread = 10, inset = false) {
  let cols = hiShSpreadfromCol(spread, baseCol);
  let neuShads = sliceExpSeries(start, offset)
    .map(offset => neuBxShCSS(offset, offset * 2, cols[0], cols[1]))
  // print(neuShads)
  return neuShads
}
//#endregion
//#endregion

// TODO: can these functions be generalized into Classes? Or extensions on a Color class?
// MARK: ProtoColor 

function protoColor() {
  if (arguments[0] instanceof p5.Color || arguments[0] instanceof ProtoColor) {
    return arguments[0]; // Do nothing if argument is already a color object.
  }

  const args = arguments[0] instanceof Array ? arguments[0] : arguments
  return new ProtoColor(this, args)
}

// CLASS: ProtoColor
class ProtoColor extends p5.Color {
  constructor(pInt, args) {
    super(pInt, args)
  }

  get color() { return color(this.red, this.green, this.blue, this.alpha) }

  get red() { return this._getRed() }
  get green() { return this._getGreen() }
  get blue() { return this._getBlue() }
  get alpha() { return this._getAlpha() }

  get hue() { return this._getHue() }
  get saturation() { return this._getSaturation() }
  get brightness() { return this._getBrightness() }
  get lightness() { return this._getLightness() }

  get complement() {
    return protoColor(`hsba(${this.complementHue}, ${this.saturation}%, ${this.brightness}%, ${this.alpha})`)
  }

  get complementHue() { return (this.hue + 180 % 360) }

  highShadComplementSpread(spread = 16) {
    const h = this.hue
    const s = this.saturation
    const b = this.brightness

    const high = [h, s, constrain(b + spread, 0, 100)]
    const shad = [this.complementHue, s, constrain(b - 2 * spread, 0, 100)]

    let cols = [high, shad]
      .map(hsb => `hsb(${hsb[0]}, ${hsb[1]}%, ${hsb[2]}%)`)
      .map(dscrpt => color(dscrpt))
    return cols
  }

  highShadSpread(spread = 16) {
    let b = this.brightness
    let bPair = [round(b + spread), round(b - 2 * spread)]
    let cols = bPair
      .map(b => `hsb(${this.hue}, ${this.saturation}%, ${b}%)`)
      .map(dscrpt => color(dscrpt))
    return cols
  }

  static randomHighHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 100%)`)
  }

  static randomShadHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 50%)`)
  }

}

// FUNC: sliceExpSeries()
function sliceExpSeries(min, max) {
  let startIndex = expSeries.findIndex(e => e >= min)
  let endIndex = expSeries.findIndex(e => e > max) + 1
  let maxInterval = expSeries.slice(endIndex - 2, endIndex)
  let scalar = convertRange(max, maxInterval, [0, 1])
  let scaledLastValue = maxInterval[1] * scalar
  let series = expSeries.slice(startIndex, endIndex)
    .map(e => e * scalar)
  // print(`min: ${min}, max: ${max}`)
  // print(`start: ${startIndex}, end: ${endIndex}`)
  // print(`scalar: ${scalar}, maxInterval: ${maxInterval}`)
  // print(expSeries.slice(startIndex, endIndex))
  // print(`series: ${series}`)
  return series
}

// FUNC: createSlices()
function createSlices(min, max, factor = 0.5) {
  if (max < min) {
    return [min]
  } else {
    const slice = createSlices(min, max * factor, factor)
    slice.push(max)
    // print(slice)
    return OpArray.from(slice)
  }
}

// FUNC: cleanSlices()
function cleanSlices(min, max, factor = 0.5) {
  return createSlices(min, max, factor)
    .map(e => round(e))
    .unique()
}

// TODO: Probably DEPRECATE??
// String Formatting FUNCS
function cuddle(a, b) {
  return join([a, b], "")
}

function px(number) { return `${number}px` }
function percent(number) { return `${number}%` }

