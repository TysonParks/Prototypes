//FUNC: p5 extension createElementNS(namespaceURI, qualifiedName)
p5.prototype.createElementNS = function (namespaceURI, qualifiedName) {
  let elt = document.createElementNS(namespaceURI, qualifiedName)
  return addElement(elt, this)
}

//FUNC: p5 extension createSVGElt(qualifiedName)
p5.prototype.createSVGElt = function (qualifiedName = 'svg') {
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

// NOTE: Created with GPT-4 on Fri Mar 24, 2023
//FUNC: p5.Element extension blur(radius)
p5.Element.prototype.blur = function (radius) {
  const viewBox = this.parent().getAttribute('viewBox').split(' ').map(Number)
  const [x, y, width, height] = viewBox
  const padding = Math.ceil(radius * 3)
  const newViewBox = [x - padding, y - padding, width + padding * 2, height + padding * 2].join(' ')
  const filterID = 'blur-' + Math.floor(Math.random() * 100000)

  const filter = createSVGElt('filter')
    .attribute('id', filterID)
    .attribute('x', '-50%')
    .attribute('y', '-50%')
    .attribute('width', '200%')
    .attribute('height', '200%')
    .parent(this.parent())

  createSVGElt('feGaussianBlur')
    .attribute('in', 'SourceGraphic')
    .attribute('stdDeviation', radius)
    .parent(filter)

  this.attribute('filter', `url(#${filterID})`)
    .attribute('viewBox', newViewBox)

  return this
}



// NOTE: Created with GPT-4 on Tues Mar 21, 2023
//FUNC: p5.Element extension dropShadow(dx, dy, blurRadius, spreadRadius, opacity, color, inset = false)
// Create a dropShadow function to extend p5.Element prototype
p5.Element.prototype.dropShadow1 = function ({ dx = 5, dy = 5, blurRadius = 10, spreadRadius = 0, opacity = 1, color = 'black', inset = false } = {}) {
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


let filterCounter = 0;


//FIXME: this function should just create the filter and return filter ID (not apply the filter)
// NOTE: Created with GPT-4 on Sun Mar 26, 2023
//FUNC: p5.Element extension dropShadow3(shadows)
p5.Element.prototype.dropShadow3 = function (shadows) {
  //NOTE: This block is good to stay
  shadows = OpArray.format(shadows)

  //debug:
  console.log("Applying drop shadow to:", this);

  //FIXME: use store protocol instead
  const id = 'dropshadow-' + filterCounter + '-' + Math.random().toString(36).substr(2, 9) // modify this line
  filterCounter++

  //NOTE: This block is good to stay
  const filter = createSVGElt('filter').attribute('id', id)
  const defs = createSVGElt('defs')
  const feMerge = createSVGElt('feMerge')
  let previousResult = 'SourceGraphic'


  //FIXME: migrate padding calculation to it's own function that can be applied to the filter element
  //FIXME: this function should be inside the 'applyFilter' or 'useFilter' func, not this filter creation step
  //FIXME: fix the padding calc function, it does not work properly
  const xPadding = Math.max(...shadows.map(shadow => shadow.blur * 3))
  const yPadding = Math.max(...shadows.map(shadow => shadow.blur * 3))

  const viewBoxConstraints = shadows.reduce((constraints, shadow) => {
    const blurPadding = shadow.blur * 3
    return {
      minX: Math.min(constraints.minX, -blurPadding + shadow.dx),
      maxX: Math.max(constraints.maxX, blurPadding + shadow.dx),
      minY: Math.min(constraints.minY, -blurPadding + shadow.dy),
      maxY: Math.max(constraints.maxY, blurPadding + shadow.dy),
    }
  }, { minX: 0, maxX: 0, minY: 0, maxY: 0 })

  filter
    .attribute('x', `${viewBoxConstraints.minX - 10}%`)
    .attribute('y', `${viewBoxConstraints.minY - 10}%`)
    .attribute('width', `${200 + viewBoxConstraints.maxX - viewBoxConstraints.minX}%`)
    .attribute('height', `${200 + viewBoxConstraints.maxY - viewBoxConstraints.minY}%`)
    .attribute('viewBox', `${viewBoxConstraints.minX - xPadding} ${viewBoxConstraints.minY - yPadding} ${100 + viewBoxConstraints.maxX - viewBoxConstraints.minX + xPadding * 2} ${100 + viewBoxConstraints.maxY - viewBoxConstraints.minY + yPadding * 2}`)
    .attribute('stroke', 'red')


  //NOTE: This block is good to stay
  for (const shadow of shadows) {
    const { dx, dy, blur, color, inset } = shadow

    createSVGElt('feGaussianBlur')
      .attribute('in', 'SourceAlpha')
      .attribute('stdDeviation', blur)
      .attribute('result', `blur-${color}`)
      .parent(filter)
    createSVGElt('feOffset')
      .attribute('in', `blur-${color}`)
      .attribute('dx', inset ? -dx : dx)
      .attribute('dy', inset ? -dy : dy)
      .attribute('result', `offset-${color}`)
      .parent(filter)
    createSVGElt('feFlood')
      .attribute('flood-color', color)
      .attribute('flood-opacity', 1)
      .attribute('result', `flood-${color}`)
      .parent(filter)
    // console.log(`flood-${color}:`, color)
    createSVGElt('feComposite')
      .attribute('in', `flood-${color}`)
      .attribute('in2', `offset-${color}`)
      .attribute('operator', 'in')
      .attribute('result', `composite-${color}`)
      .parent(filter)

    createSVGElt('feBlend')
      .attribute('in', `composite-${color}`)
      .attribute('in2', previousResult)
      .attribute('mode', 'normal')
      .attribute('result', `blend-${color}`)
      .parent(filter)

    previousResult = `blend-${color}`
  }

  createSVGElt('feBlend')
    .attribute('in', 'SourceGraphic')
    .attribute('in2', previousResult)
    .attribute('mode', 'normal')
    .attribute('result', 'finalResult')
    .parent(filter)

  createSVGElt('feMergeNode')
    .attribute('in', 'finalResult')
    .parent(feMerge)

  filter.child(feMerge)
  defs.child(filter)


  //FIXME: migrate to function for applying effects or just dropShadows?
  const parentSVG = this.elt.ownerSVGElement

  const g = createSVGElt('g')
    .attribute('filter', `url(#${id})`)
    .parent(parentSVG)
  this.parent(g)
  g.child(defs)
  return this
}

//FIXME: this function should just create the filter and return filter ID (not apply the filter)
// NOTE: Created with GPT-4 on Mon Mar 27, 2023
//FUNC: p5.Element extension insetDropShadow(shadows)
p5.Element.prototype.insetDropShadow = function (shadows) {
  shadows = OpArray.format(shadows)

  //debug:
  console.log("Applying drop shadow to:", this);

  //FIXME: use store protocol instead
  const id = 'dropshadow-' + filterCounter + '-' + Math.random().toString(36).substr(2, 9);
  filterCounter++

  //NOTE: This block is good to stay
  const defs = createSVGElt('defs')
  const filter = createSVGElt('filter').attribute('id', id);
  let previousResult = 'SourceGraphic';

  //NOTE: This block is good to stay
  for (const shadow of shadows) {
    const { dx, dy, blur, color, inset } = shadow;
    const shadowID = `shadow-${Math.random().toString(36).substr(2, 9)}`;

    createSVGElt('feOffset')
      .attribute('dx', dx)
      .attribute('dy', dy)
      .parent(filter);

    createSVGElt('feGaussianBlur')
      .attribute('stdDeviation', blur)
      .attribute('result', 'offset-blur')
      .parent(filter);

    createSVGElt('feComposite')
      .attribute('operator', 'out')
      .attribute('in', previousResult)
      .attribute('in2', 'offset-blur')
      .attribute('result', 'inverse')
      .parent(filter);

    createSVGElt('feFlood')
      .attribute('flood-color', color)
      .attribute('flood-opacity', 1)
      .attribute('result', 'color')
      .parent(filter);

    createSVGElt('feComposite')
      .attribute('operator', 'in')
      .attribute('in', 'color')
      .attribute('in2', 'inverse')
      .attribute('result', shadowID)
      .parent(filter);

    createSVGElt('feComposite')
      .attribute('operator', 'over')
      .attribute('in', shadowID)
      .attribute('in2', previousResult)
      .attribute('result', `merged-${shadowID}`)
      .parent(filter);

    previousResult = `merged-${shadowID}`;
  }

  createSVGElt('feMergeNode')
    .attribute('in', previousResult)
    .parent(filter);

  defs.child(filter);


  //FIXME: migrate to function for applying effects or just dropShadows?
  console.log("SVG variable: ", svg);
  const parentSVG = this.elt.ownerSVGElement

  const g = createSVGElt('g')
    .attribute('filter', `url(#${id})`)
    .parent(parentSVG)
  this.parent(g)
  g.child(defs)
  return this
}





