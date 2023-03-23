//FUNC: p5 extension createElementNS(namespaceURI, qualifiedName)
p5.prototype.createElementNS = function (namespaceURI, qualifiedName) {
  let elt = document.createElementNS(namespaceURI, qualifiedName)
  return addElement(elt, this)
}

//FUNC: p5 extension createSVGElt(qualifiedName)
p5.prototype.createSVGElt = function (qualifiedName = SVG.svg) {
  let elt = document.createElementNS(SVG.xmlns, qualifiedName)
  return addElement(elt, this)
}

//FUNC: p5 extension createSVG(width, height)
p5.prototype.createSVG = function (width, height) {
  return svg = createSVGElt()
    .attribute(SVG.width, `${width}`)
    .attribute(SVG.height, `${height}`)
}

//FUNC: p5.Element extension attributeNS(nameSpaceURI, attr, value)
p5.Element.prototype.addToClassList = function (newClass) {
  // print(`addToClassList():`)
  // print(newClass)
  let newClasses
  if (newClass instanceof Array) {
    // print('newClass is a Array')
    newClasses = OpArray.from(newClass)
  }
  if (typeof newClass === 'string') {
    // print('newClass is a String')
    newClasses = OpArray.from(newClass.split(' '))
  } else {
    // print('newClass is undefined')
    return this
  }
  if (this.elt.classList.length > 0) {
    const oldClasses = OpArray.from(this.elt.classList.value.split(' '))
    this.elt.classList.value = oldClasses.union(newClasses).join(' ')
  } else {
    this.elt.classList.value = newClasses.join('')
  }
  return this
}

// MARK: p5.Element extension 'type' property
Object.defineProperty(p5.Element.prototype, 'type', {
  get: function () {
    if (this.elt instanceof HTMLElement) {
      return 'html'
    } else if (this.elt instanceof SVGElement) {
      return 'svg'
    } else {
      return 'unknown'
    }
  }
})


//FUNC: p5.Element extension attributeNS(nameSpaceURI, attr, value)
p5.Element.prototype.attributeNS = function (nameSpaceURI, attr, value) {
  //handling for checkboxes and radios to ensure options get
  //attributes not divs
  if (
    this.elt.firstChild != null &&
    (this.elt.firstChild.type === 'checkbox' ||
      this.elt.firstChild.type === 'radio')
  ) {
    if (typeof value === 'undefined') {
      return this.elt.firstChild.getAttributeNS(nameSpaceURI, attr)
    } else {
      for (let i = 0; i < this.elt.childNodes.length; i++) {
        this.elt.childNodes[i].setAttributeNS(nameSpaceURI, attr, value)
      }
    }
  } else if (typeof value === 'undefined') {
    return this.elt.getAttributeNS(nameSpaceURI, attr)
  } else {
    this.elt.setAttributeNS(nameSpaceURI, attr, value)
    return this;
  }
}


// ENUM: SVG
class SVG {
  static svg = `svg`
  static style = `style`

  static rect = `rect`
  static circle = `circle`
  static ellipse = `ellipse`
  static line = `line`
  static polyline = `polyline`
  static polygon = `polygon`
  static path = `path`
  static namespaceURI = `namespaceURI`
  static xmlns = `http://www.w3.org/2000/svg`

  static stroke = `stroke`
  static strokeWidth = `stroke-width`
  static fill = `fill`
  static d = `d`
  static clipPath = `clip-path`
  static opacity = `opacity`
  static transform = `transform`
  static viewBox = `viewBox`
  static preserveAspectRatio = `preserveAspectRatio`

  static defs = `defs`
  static filter = `filter`

  //MARK: FE Effects
  static feOffset = `feOffset`
  static feGaussianBlur = `feGaussianBlur`
  static feFlood = `feFlood`
  static feComposite = `feComposite`

}



// make .attr() prototype extension that gets and sets attributes similar to p5's .style() 
// make neuShadow equivalents for inset shadows in SVG
// make stage for comparing shadows and see if svg shadows are deal-breaker for neumorphism
// optimize rendering by creating methods to aggregate some groups of shapes to the same svg 'layer' 



function addElement(elt, pInst, media) {
  const node = pInst._userNode ? pInst._userNode : document.body;
  // print(`node:`)
  // print(node)
  node.appendChild(elt);
  const c = media
    ? new p5.MediaElement(elt, pInst)
    : new p5.Element(elt, pInst);
  // print(`c:`)
  // print(c)
  // print(`pInst._elements:`)
  // print(pInst._elements)
  pInst._elements.push(c);
  return c;
}


// NOTE: Created with GPT-4 on Tues Mar 21, 2023
//FUNC: p5.Element extension dropShadow(dx, dy, blurRadius, spreadRadius, opacity, color, inset = false)
// Create a dropShadow function to extend p5.Element prototype
p5.Element.prototype.dropShadow = function ({ dx = 5, dy = 5, blurRadius = 10, spreadRadius = 0, opacity = 1, color = 'black', inset = false } = {}) {
  if (this.type === 'svg') {
    const filter = createSVGElt(SVG.filter)
      .attribute('id', 'drop-shadow')

    const gaussianBlur = createSVGElt(SVG.feGaussianBlur)
      .attribute('in', 'SourceAlpha')
      .attribute('stdDeviation', blurRadius)

    const offset = createSVGElt(SVG.feOffset)
      .attribute('dx', dx)
      .attribute('dy', dy)

    const componentTransfer = createSVGElt('feComponentTransfer')
    const funcA = createSVGElt('feFuncA')
      .attribute('type', 'linear')
      .attribute('slope', opacity)
    componentTransfer.child(funcA)

    const flood = createSVGElt(SVG.feFlood)
      .attribute('flood-color', color)
      .attribute('result', 'color')

    const composite = createSVGElt(SVG.feComposite)
      .attribute('in', 'color')
      .attribute('in2', 'blurOut')
      .attribute('operator', 'in')
      .attribute('result', 'shadow')

    const morphology = createSVGElt('feMorphology')
      .attribute('in', 'SourceAlpha')
      .attribute('operator', spreadRadius >= 0 ? 'dilate' : 'erode')
      .attribute('radius', Math.abs(spreadRadius))
      .attribute('result', 'spreadOut')
    gaussianBlur.attribute('in', 'spreadOut')

    filter.child(morphology)
    filter.child(gaussianBlur)
    filter.child(offset)
    filter.child(componentTransfer)
    filter.child(flood)
    filter.child(composite)

    const defs = this.elt.querySelector(SVG.defs) || createSVGElt(SVG.defs).elt
    defs.appendChild(filter.elt)
    this.elt.insertBefore(defs, this.elt.firstChild)

    this.elt.style.filter = 'url(#drop-shadow)'
    if (inset) {
      this.elt.style.overflow = 'hidden'
    }
  } else {
    console.warn('The dropShadow function can only be applied to SVG elements.')
  }

  return this
}
