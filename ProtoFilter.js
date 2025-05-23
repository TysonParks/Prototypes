//FUNC: addElement(elt, pInst, media) allows for the creation of p5.Elements without using instance mode
function addElement(elt, pInst, media) {
  const node = pInst._userNode ? pInst._userNode : document.body
  node.appendChild(elt)
  const c = media
    ? new p5.MediaElement(elt, pInst)
    : new p5.Element(elt, pInst)

  pInst._elements.push(c)
  return c
}

//CLASS: ProtoFilter
// SIZE: 223 lines
function createFilter() { return new ProtoFilter() }
class ProtoFilter {
  id
  type
  filter
  defs
  offsetElts = new OpArray

  constructor() {
    this.needsPadding = false
    this.storeObject(S.Effects)
    this.offsetElts = new OpArray
  }

  //METH: shade() : null : create a filter with the given shades
  shade(shades, type, clearInset = true, normalBlending = false) {
    DeBug.log(`shade creation`)

    shades = OpArray.format(shades)
    this.shades = shades
    this.type = type

    const
      insetShadows = shades.filter(shade => shade.inset),
      outsetShadows = shades.filter(shade => !shade.inset)

    this.defs = createSVGElt('defs')
    this.filter = createSVGElt('filter').id(this.id)
    // .attribute('overflow', 'visible')

    createSVGElt('feFlood')
      .attribute('flood-opacity', 0)
      .attribute('result', 'transparentInput')
      .parent(this.filter)

    let previousResult = 'SourceGraphic',
      // insetResult = clearInset ?  : 'SourceGraphic',
      // insetResult = clearInset ? 'SourceGraphic' : 'SourceGraphic',
      insetResult = 'transparentInput',
      outsetResult = 'SourceGraphic'


    //ARROW: buildFilter() : null : stack and matte layers of highlights and shadows using feFlood, feOffset, feGaussianBlur, and feComposite
    const buildFilter = (shades, filter, inset) => {
      let prevMode = 'normal'
      // DeBug.warn(`building shades`)
      for (const shade of shades) {
        // DeBug.log(`current shade:`, shade)
        const
          vector = Shade.shadVect(),
          resultId = `shade-${inset ? "inset" : "outset"}-${random().toString(36).substring(7)}`

        let
          { invert, blur, color, lighten } = shade,
          mag = shade.mag * 1
        mag = lighten ? mag * -1 : mag
        mag = invert ? mag * -1 : mag
        const [dx, dy] = [vector.x * mag, vector.y * mag]

        //ARROW: blendMode() : string : returns the blend mode for the current shade when normalBlending is false
        const blendMode = () => {
          return 'normal'
          // if ((prevMode === 'lighten' && !lighten) || (prevMode === 'darken' && lighten)) { return 'normal' }
          // return lighten ? 'lighten' : 'darken'
          // return lighten ? 'multiply' : 'darken'
          // return 'hard-light'
          return 'exclusion'
          // return 'difference'
          // return 'overlay'
          // return lighten ? 'darken' : 'screen'
          // return lighten ? 'hard-light' : 'multiply'
          return lighten ? 'multiply' : 'screen'
          // return lighten ? 'screen' : 'darken'
        }

        let useBlur = blur > 0
        blur = blur * 1

        if (useBlur) {
          //1 feGaussianBlur: blur the alpha channel of the input shape
          createSVGElt('feGaussianBlur')
            .attribute('in', `SourceAlpha`)                         // verified attr
            .attribute('stdDeviation', blur)                        // verified attr
            .attribute('result', 'blurred')                         // verified attr
            .parent(filter)
        }

        //3 feFlood: flood the offset result with the input color
        createSVGElt('feFlood')
          // .attribute(`in`, 'offset-blurred') // FLOOD creates a solid color shape so no input, mix with composite/blend
          .attribute('flood-color', color)                            // verified attr
          .attribute('flood-opacity', 1)                              // verified attr
          .attribute('result', 'colored')                             // verified attr
          .parent(filter)

        //2 feOffset: offset the blurred result
        const feOffset = createSVGElt('feOffset')
          .attribute('in', useBlur ? 'blurred' : 'SourceAlpha')       // verified attr
          .attribute('dx', dx)                                        // verified attr
          .attribute('dy', dy)                                        // verified attr
          .attribute('result', 'offset-blurred')                      // verified attr
          .parent(filter)

        // DeBug.log(`this.offsetElts`, this.offsetElts)
        this.offsetElts.push({ elt: feOffset, mag: mag, })

        // 4a feComposite - 
        if (inset) {
          DeBug.warn(`INSET FILTER!!!`)
          //3B feComposite - MASK IN: if this is an inset shade, mask 
          createSVGElt('feComposite')
            .attribute('operator', 'out')
            // .attribute('in', clearInset ? 'SourceGraphic' : insetResult) // might need to option insetResult here
            .attribute('in', 'SourceGraphic')
            // .attribute('in2', insetResult)
            // .attribute('in', insetResult)
            .attribute('in2', 'offset-blurred')
            .attribute('result', 'insetMask')
            .parent(filter)
        }

        //4 feComposite - composite the 'colored' flood layer with the offset/blurred or insetMask
        createSVGElt('feComposite')
          .attribute('operator', 'in')
          .attribute('in', `colored`)
          // .attribute('in2', `offset-blurred`)
          .attribute('in2', inset ? 'insetMask' : `offset-blurred`)
          .attribute('result', `composite`)
          .parent(filter)
        // .attribute('result', resultId)

        //5A feBlend - 'resultId'
        createSVGElt('feBlend')
          .attribute('mode', normalBlending ? 'normal' : blendMode()) // 'darken' or 'lighten'
          .attribute('in', inset ? insetResult : outsetResult)
          .attribute('in2', 'composite')
          .attribute('result', resultId)
          .parent(filter)

        prevMode = blendMode()
        // DeBug.log('prevMode', prevMode)

        if (inset) {
          insetResult = resultId
          // DeBug.log('inset resultId', resultId)
        } else {
          outsetResult = resultId
          // DeBug.log('outset resultId', resultId)
        }
      }
    }

    if (insetShadows.length > 0) buildFilter(insetShadows, this.filter, true)
    else if (clearInset) insetResult = 'SourceAlpha'

    if (outsetShadows.length > 0) {
      buildFilter(outsetShadows, this.filter, false)
      createSVGElt('feComposite')
        .attribute('operator', clearInset ? 'out' : 'over')
        .attribute('in', clearInset ? outsetResult : insetResult)
        .attribute('in2', clearInset ? insetResult : outsetResult)
        .attribute('result', 'finalResult')
        .parent(this.filter)
      previousResult = 'finalResult'
    }

    this.defs.child(this.filter)
    return this
  }

  //MARK: Utility methods
  //METH: applyFilterToElement() : null : apply the filter to an element
  applyFilterToElement(element, time = 0) {
    if (!this.type) return this

    const
      parentSVG = element.elt.ownerSVGElement,
      filterUrl = `url(#${this.id})`

    let newGroup = parentSVG.querySelector(`g[filter = "${filterUrl}"][id ^= "${this.id}-"]`)
    if (!newGroup) {
      newGroup = createSVGElt("g")
        .id(`${this.id} -${element.id()}`)
        .attribute("filter", filterUrl)
        .parent(parentSVG)
        .child(this.defs)
      // .attribute('overflow', 'visible')
      // .attribute(`filterUnits`, `userSpaceOnUse`)
      // .attribute(`primitiveUnits`, `userSpaceOnUse`)
    }

    if (time > 0) {
      const oldGroup = element.p5Parent
      if (oldGroup !== newGroup) {
        crossfadeElements(oldGroup, newGroup, time, () => {
          element.parent(newGroup)
          if (oldGroup.childElementCount === 0) oldGroup.remove()
        })
      }
    } else {
      element.parent(newGroup)
      const oldGroup = element.p5Parent
      if (oldGroup.childElementCount === 0) oldGroup.remove()
    }
  }
  //METH: updateOffsets() : null : update the offsets of the filter elements
  updateOffsets(shadVect) {
    const updates = []
    this.offsetElts.forEach(({ elt, mag }) => {
      const dx = shadVect.x * mag
      const dy = shadVect.y * mag
      updates.push({ elt, dx, dy })
    })
    // Perform all updates in a batch
    updates.forEach(({ elt, dx, dy }) => {
      elt.attribute(`dx`, dx)
      elt.attribute(`dy`, dy)
    })
  }

  //MARK: Setup methods
  //METH: storeObject() : null : assigns an id, a uid, and stores the instance in the store
  finishSetup(store) { this.storeObject(store) }
}
Object.assign(ProtoFilter.prototype, IdentifiableStored) // this mixin provides store,ID, and UID functionality

//CLASS: p5js EXTENSIONS
// SIZE: 204 lines
// #region p5js EXTENSIONS
//PROTOTYPE: p5.createElementNS(namespaceURI, qualifiedName) : p5.Element : create a new element with a namespace
p5.prototype.createElementNS = function (namespaceURI, qualifiedName) {
  let elt = document.createElementNS(namespaceURI, qualifiedName)
  return addElement(elt, this)
}

//PROTOTYPE: p5.createSVGElt(qualifiedName) : p5.Element : create a new SVG element
p5.prototype.createSVGElt = function (qualifiedName = 'svg') {
  const
    elt = document.createElementNS(xmlns, qualifiedName),
    p5Element = addElement(elt, this)
  return p5Element
}

//PROTOTYPE: p5.createSVGText : p5.Element : create a text element in SVG
// NOTE: Created with GPT-4 on Fri Jan 13, 2024
p5.prototype.createSVGText = function (content, x = 0, y = 0) {
  const textElt = this.createSVGElt('text').html(content)
    .attribute('x', x)
    .attribute('y', y)
  return textElt
}

//PROTOTYPE: p5.Element.setText : p5.Element : set the text content of an SVG text element
// NOTE: Created with GPT-4 on Fri Jan 13, 2024
p5.Element.prototype.setText = function (content) {
  if (this.type === 'svg' && this.elt.tagName === 'text') this.html(content)
  return this
}

//PROTOTYPE: p5.Element.addToClassList(newClass) : p5.Element : add a class to the element's class list
p5.Element.prototype.addToClassList = function (newClass) {
  let newClasses
  if (newClass instanceof Array) newClasses = OpArray.from(newClass)

  if (typeof newClass === 'string') newClasses = OpArray.from(newClass.split(' '))
  else return this

  if (this.elt.classList.length > 0) {
    const oldClasses = OpArray.from(this.elt.classList.value.split(' '))
    this.elt.classList.value = oldClasses.union(newClasses).join(' ')
  } else this.elt.classList.value = newClasses.join('')

  return this
}

//PROTOTYPE: p5.Element.layout(x, y, width, height) : p5.Element : set the layout of the element
p5.Element.prototype.layout = function (x, y, width, height, padding = vert(0)) {
  const args = OpArray.from(arguments)
  // single object input
  if (args.length === 1) {
    x = x.x
    y = x.y
    width = x.width
    height = x.height
    if (x[`padding`]) padding = x[`padding`]
  }
  // (anchor, size, padding) input
  if (args.length > 1 && args.length < 4 && args.slice(0, 2).every(a => a instanceof Vertex)) {
    x = args[0].x
    y = args[0].y
    width = args[1].x
    height = args[1].y
    if (args[2]) padding = args[2]
  }
  this
    .attribute('x', x - padding.x)
    .attribute('y', y - padding.y)
    .attribute('width', width + padding.x * 2)
    .attribute('height', height + padding.y * 2)
  return this
}

//PROTOTYPE: p5.Element.viewBox(x, y, width, height) : p5.Element : set the viewBox of the element
p5.Element.prototype.viewBox = function (x, y, width, height, padding = vert(0)) {
  const args = OpArray.from(arguments)
  // single object input
  if (args.length === 1) {
    x = x.x
    y = x.y
    width = x.width
    height = x.height
    if (x[`padding`]) padding = x[`padding`]
  }
  // (anchor, size, padding) input
  if (args.length > 1 && args.length < 4 && args.slice(0, 2).every(a => a instanceof Vertex)) {
    x = args[0].x
    y = args[0].y
    width = args[1].x
    height = args[1].y
    if (args[2]) padding = args[2]
  }
  this.attribute('viewBox', `${x - padding.x} ${y - padding.y} ${width + padding.x * 2} ${height + padding.y * 2}`)
  return this
}

// PROTOTYPE: p5.Element.type (property) : type (String) : get the type of the element
Object.defineProperty(p5.Element.prototype, 'type', {
  get: function () {
    if (this.elt instanceof HTMLElement) return 'html'
    else if (this.elt instanceof SVGElement) return 'svg'
    else return 'unknown'
  }
})

// PROTOTYPE: p5.Element.p5Parent (property) : p5.Element? : get the parent of the element
Object.defineProperty(p5.Element.prototype, 'p5Parent', {
  get: function () {
    const parentHTMLElement = this.parent()
    return parentHTMLElement ? select('#' + parentHTMLElement.id) : null
  }
})

//PROTOTYPE: p5.Element.attributeNS(nameSpaceURI, attr, value) : p5.Element : get or set an attribute with a namespace
p5.Element.prototype.attributeNS = function (nameSpaceURI, attr, value) {
  //handling for checkboxes and radios to ensure options get attributes not divs
  if (
    this.elt.firstChild != null
    && (this.elt.firstChild.type === 'checkbox'
      || this.elt.firstChild.type === 'radio')
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
    return this
  }
}

//PROTOTYPE: p5.Element.blur(radius) : p5.Element : apply a blur filter to the element
// NOTE: Created with GPT-4 on Fri Mar 24, 2023
p5.Element.prototype.blur = function (radius) {
  // DeBug.log(`parent`, this.parent())
  const parent = this.parent(),
    viewBox = parent.getAttribute('viewBox'),
    [x, y, width, height] = viewBox ? viewBox.split(' ').map(Number) : [parent.x, parent.y, parent.width, parent.height],
    padding = Math.ceil(radius * 3),
    newViewBox = [x - padding, y - padding, width + padding * 2, height + padding * 2].join(' '),
    filterID = 'blur-' + Math.floor(Math.random() * 100000),

    filter = createSVGElt('filter')
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

  this
    .attribute('filter', `url(#${filterID})`)
    .attribute('viewBox', newViewBox)

  return this
}

//PROTOTYPE: p5.Element.applyFilter(filter, scale = 1) : p5.Element : apply a filter to the element
p5.Element.prototype.applyFilter = function (filter, time = 0) {
  if (filter) filter.applyFilterToElement(this, time)
  return this
}

//PROTOTYPE: p5.Element extension crossfadeElements(fromElement, toElement, duration, onComplete)
p5.prototype.crossfadeElements = async function (fromElement, toElement, duration, onComplete) {
  DeBug.log('fromElement', fromElement)
  DeBug.log('toElement', toElement)
  const
    startTime = performance.now(),
    fromElementOpacity = parseFloat(fromElement.attribute("opacity") || "1"),
    toElementOpacity = parseFloat(toElement.attribute("opacity") || "1")

  //ARROW: step() : null : animate the crossfade
  const step = (timestamp) => {
    const
      elapsed = timestamp - startTime,
      progress = Math.min(elapsed / duration, 1)

    fromElement.attribute("opacity", fromElementOpacity * (1 - progress))
    toElement.attribute("opacity", toElementOpacity * progress)

    if (progress < 1) requestAnimationFrame(step)
    else if (onComplete) onComplete()
  }

  requestAnimationFrame(step)
}

// PROTOTYPE: p5.Element extension applyStrokeMask(color, width)
p5.Element.prototype.applyStrokeMask = function (color, width) {
  const strokeMaskFilter = new StrokeMaskFilter().strokeMask(color, width)
  strokeMaskFilter.applyFilterToElement(this)
  return this
}
// #endregion