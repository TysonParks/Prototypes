// ENUM: SVG
// SIZE: 33 lines
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


//FUNC: addElement(elt, pInst, media) allows for the creation of p5.Elements without using instance mode
function addElement(elt, pInst, media) {
  const node = pInst._userNode ? pInst._userNode : document.body
  // print(`node:`)
  // print(node)
  node.appendChild(elt)
  const c = media
    ? new p5.MediaElement(elt, pInst)
    : new p5.Element(elt, pInst)
  // print(`c:`)
  // print(c)
  // print(`pInst._elements:`)
  // print(pInst._elements)
  pInst._elements.push(c)
  return c
}


//CLASS: ProtoFilter
// SIZE: 355 lines
function createFilter() { return new ProtoFilter() }
class ProtoFilter {
  filter
  defs
  type

  constructor() {
    this.needsPadding = false
    this.storeObject(S.Effects)
    // console.log('filter init', this)
  }

  //MARK: Drop Shadow method
  dropShadow(shadows, clearInset = true) {
    shadows = OpArray.format(shadows)

    const batchlayering = false
    const normalBlending = true
    const insetShadows = shadows.filter(shadow => shadow.inset)
    const outsetShadows = shadows.filter(shadow => !shadow.inset)
    // const insetLightShads = shadows.filter(shad => shad.inset && shad.lighten)
    // const insetDarkShads = shadows.filter(shad => shad.inset && !shad.lighten)
    // const outsetLightShads = shadows.filter(shad => !shad.inset && shad.lighten)
    // const outsetDarkShads = shadows.filter(shad => !shad.inset && !shad.lighten)
    // let insetShadows = OpArray.from([...insetLightShads, ...insetDarkShads])
    // let outsetShadows = OpArray.from([...outsetLightShads, ...outsetDarkShads])
    // insetShadows = OpArray.from([...insetDarkShads, ...insetLightShads])
    // outsetShadows = OpArray.from([...outsetDarkShads, ...outsetLightShads])
    // insetShadows = shadows.filter(shadow => shadow.inset)
    // outsetShadows = shadows.filter(shadow => !shadow.inset)
    //TODO: need to build light and dark stacks separately within buildFilter()
    //TODO: then merge the two outside 
    //TODO: but then this will likely break the filter for creating r-curve shadows because of the internal bounce highlight

    this.shadows = outsetShadows

    // this.clearInset = clearInset
    this.type = 'dropShadow'
    this.defs = createSVGElt('defs')
    this.filter = createSVGElt('filter').id(this.id)

    createSVGElt('feGaussianBlur')
      .attribute('in', 'SourceAlpha')
      .attribute('stdDeviation', 0)
      .attribute('result', 'blurredAlpha')
      .parent(this.filter)

    createSVGElt("feFlood")
      .attribute("flood-color", "transparent")
      .attribute("flood-opacity", 0)
      .attribute("result", "transparentInput")
      .parent(this.filter)

    let previousResult = 'SourceGraphic'
    let insetResult = clearInset ? 'transparentInput' : 'SourceGraphic'
    let outsetResult = 'SourceGraphic'


    // FUNC: buildFilter()
    function buildFilter(shadows, filter, inset, clearInset) {
      let prevMode = 'normal'
      for (const shadow of shadows) {
        const { dx, dy, blur, color, lighten } = shadow
        const resultId = `shadow-${inset ? "inset" : "outset"}-${random()
          .toString(36)
          .substring(7)}`
        const blendMode = () => {
          if ((prevMode === 'lighten' && !lighten) || (prevMode === 'darken' && lighten)) { return 'normal' }
          return lighten ? 'lighten' : 'darken'
        }

        //1 feGaussianBlur: blur the alpha channel of the input shape
        createSVGElt('feGaussianBlur')
          .attribute('in', 'SourceAlpha')
          .attribute('stdDeviation', blur)
          .attribute('result', 'blur')
          .parent(filter)
        //2 feOffset: offset the blurred result
        createSVGElt('feOffset')
          .attribute('in', 'blur')
          .attribute('dx', dx)
          .attribute('dy', dy)
          .attribute('result', 'offset-blur')
          .parent(filter)
        //3 feFlood: flood the offset result with the input color
        createSVGElt('feFlood')
          .attribute('flood-color', color)
          .attribute('flood-opacity', 1)
          .attribute('result', 'color')
          .parent(filter)

        if (inset) {
          //3B feComposite - MASK IN: if this is an inset shadow, mask 
          createSVGElt('feComposite')
            .attribute('operator', 'out')
            .attribute('in', clearInset ? 'SourceAlpha' : insetResult) // might need to option insetResult here
            // .attribute('in2', insetResult)
            // .attribute('in', insetResult)
            .attribute('in2', 'offset-blur')
            .attribute('result', 'mask')
            .parent(filter)
        }

        //4 feComposite - 'composite'
        createSVGElt('feComposite')
          .attribute('operator', 'in')
          .attribute('in', `color`)
          .attribute('in2', inset ? 'mask' : `offset-blur`)
          .attribute('result', `composite`)
          .parent(filter)
        //5 feMerge - 'resultId'
        // createSVGElt('feMerge')
        //   .child(
        //     createSVGElt('feMergeNode')
        //       .attribute('in', inset ? insetResult : outsetResult)
        //   )
        //   .child(
        //     createSVGElt('feMergeNode')
        //       .attribute('in', 'composite')
        //   )
        //   .attribute('result', resultId)
        //   .parent(filter)
        // console.log('blendMode', blendMode())
        //5A feBlend - 'resultId'
        createSVGElt('feBlend')
          .attribute('mode', normalBlending ? 'normal' : blendMode()) // 'darken' or 'lighten'
          .attribute('in', inset ? insetResult : outsetResult)
          .attribute('in2', 'composite')
          .attribute('result', resultId)
          .parent(filter)

        prevMode = blendMode()
        // console.log('prevMode', prevMode)

        if (inset) {
          insetResult = resultId
          // console.log('inset resultId', resultId)
        } else {
          outsetResult = resultId
          // console.log('outset resultId', resultId)
        }
      }
    }

    //METH:
    const processBatches = (shadows, inset = true) => {
      const batches = shadows.reduce((result, shadow) => {
        // console.log('result', result)
        const lastBatch = result[result.length - 1]
        if (lastBatch && lastBatch[0].lighten === shadow.lighten) {
          lastBatch.push(shadow)
        } else {
          result.push(OpArray.from([shadow]))
        }
        return result
      }, new OpArray)
      console.log('batches', batches)

      const processed = batches.map(batch => {
        buildFilter(batch, this.filter, inset, clearInset)
        return inset ? insetResult : outsetResult
      })
      console.log('processed', processed)
      // return processed

      for (let i = 1; i < processed.length; i++) {
        createSVGElt('feBlend')
          .attribute('mode', 'normal')
          .attribute('in', processed[i - 1])
          .attribute('in2', processed[i])
          .attribute('result', processed[i])
          .parent(this.filter)
      }

      // let feMerge = createSVGElt('feMerge')
      //   .attribute('result', inset ? insetResult : outsetResult)
      //   .parent(this.filter)

      // processed.forEach(resultID => {
      //   createSVGElt('feMergeNode')
      //     .attribute('in', resultID)
      //     .parent(feMerge)
      // })


    }



    if (insetShadows.length > 0) {

      if (batchlayering) {
        const insetBatches = processBatches(insetShadows, true)
        console.log('insetBatches', insetBatches)
      } else {
        buildFilter(insetShadows, this.filter, true, clearInset)
      }
    }
    else {
      if (clearInset) { insetResult = 'SourceAlpha' }
    }

    if (outsetShadows.length > 0) {

      if (batchlayering) {
        const outsetBatches = processBatches(outsetShadows, false)
        console.log('outsetBatches', outsetBatches)
      } else {
        buildFilter(outsetShadows, this.filter, false, clearInset)
      }

      if (clearInset) {
        createSVGElt('feComposite')
          .attribute('operator', 'out')
          .attribute('in', outsetResult)
          .attribute('in2', insetResult)
          .attribute('result', 'finalResult')
          .parent(this.filter)
      } else {
        createSVGElt('feComposite')
          .attribute('operator', 'over')
          .attribute('in', insetResult)
          .attribute('in2', outsetResult)
          .attribute('result', 'finalResult')
          .parent(this.filter)
      }



      previousResult = 'finalResult'
    }

    createSVGElt('feMergeNode')
      .attribute('in', previousResult)
      .parent(this.filter)

    this.defs.child(this.filter)

    return this
  }

  //MARK: Utility methods
  applyFilterToElement({ element, size, padding = 20, time = 0 } = {}) {
    if (!this.type) { return this }
    console.warn(`applyFilter sizeX: ${size.x}, sizeY: ${size.y}`)
    console.warn(`applyFilter paddingX: ${padding.x}, paddingY: ${padding.y}`)
    const aspect = size.x / size.y
    //FIXME: I might be able to use absolute values, but they probably need to be relative to the entire canvas?
    //FIXME: This means I need to bring in the anchor as well. Maybe I can even just use my .layout method?
    // let scaleWidth, scaleHeight
    // if (aspect >= 1) {
    //   scaleHeight = aspect
    //   scaleWidth = 1
    // } else {
    //   scaleHeight = 1
    //   scaleWidth = 1 / aspect
    // }

    const x = ceil(-padding.x / size.x * 100) || 0
    const y = ceil(-padding.y / size.y * 100) || 0

    const width = ceil(200 * padding.x / size.x + 100) || 100
    const height = ceil(200 * padding.y / size.y + 100) || 100

    // console.warn(`element`, element)
    // console.warn(`applyFilter x: ${x}, y: ${y}`)
    // console.warn(`applyFilter width: ${width}, height: ${height}`)

    // const anchor = (scale - 1) * -50 - padding
    // const size = scale * 100
    this.filter
      // .attribute("x", `-48%`)
      // .attribute("y", `-5%`)
      // .attribute("width", `200%`)
      // .attribute("height", `200%`)
      .attribute("x", `${x}%`)
      .attribute("y", `${y}%`)
      .attribute("width", `${width}%`)
      .attribute("height", `${height}%`)
    // .attribute("x", `${-size.x}`)
    // .attribute("y", `${-size.y}`)
    // .attribute("width", `${size.x + 2 * padding}%`)
    // .attribute("height", `${size.y + 2 * padding}%`)
    console.warn(`this.filter x`, this.filter.attribute("x"))
    console.warn(`this.filter y`, this.filter.attribute("y"))
    console.warn(`this.filter width`, this.filter.attribute("width"))
    console.warn(`this.filter height`, this.filter.attribute("height"))

    const parentSVG = element.elt.ownerSVGElement
    const filterUrl = `url(#${this.id})`

    let newGroup = parentSVG.querySelector(`g[filter="${filterUrl}"][id^="${this.id}-"]`)
    if (!newGroup) {
      newGroup = createSVGElt("g")
        .id(`${this.id}-${element.id()}`)
        .attribute("filter", filterUrl)
        .parent(parentSVG)
      newGroup.child(this.defs)
    }

    if (time > 0) {
      const oldGroup = element.p5Parent
      if (oldGroup !== newGroup) {
        crossfadeElements(oldGroup, newGroup, time, () => {
          element.parent(newGroup)
          if (oldGroup.childElementCount === 0) {
            oldGroup.remove()
          }
        })
      }
    } else {
      element.parent(newGroup)
      const oldGroup = element.p5Parent
      if (oldGroup.childElementCount === 0) {
        oldGroup.remove()
      }
    }
  }

  updateFilter(shadows, clearInset = true) {
    this.dropShadow(shadows, clearInset = true)
  }


  //MARK: Setup methods
  finishSetup(store) {
    this.storeObject(store) // this function assigns an id, a uid, and stores the instance
  }
}

Object.assign(ProtoFilter.prototype, IdentifiableStored) // this mixin provides store,ID, and UID functionality


// CLASS: StrokeMaskFilter
// SIZE: 77 lines
class StrokeMaskFilter extends ProtoFilter {
  constructor() {
    super()
    this.type = "strokeMask"
  }

  // MARK: Stroke Mask method
  strokeMask(color = "black", width = 10) {
    this.color = color
    this.width = Math.abs(width)

    this.defs = createSVGElt("defs")
    this.mask = createSVGElt("mask").id(this.id)
    this.defs.child(this.mask)

    if (width < 0) {
      this.createExpandedStrokeMask();
    }

    return this
  }

  createExpandedStrokeMask() {
    // Create an additional mask for the stroke
    this.strokeMask = createSVGElt("mask").id(`stroke-${this.id}`)
    this.defs.child(this.strokeMask)

    // Combine the original mask (for the shape) and the stroke mask
    this.combinedMask = createSVGElt('feComposite')
      .attribute('operator', 'arithmetic')
      .attribute('k1', '1')
      .attribute('k2', '1')
      .attribute('k3', '1')
      .attribute('k4', '0')
      .attribute('in', `url(#${this.id})`)
      .attribute('in2', `url(#stroke-${this.id})`)
      .parent(this.mask);
  }

  applyFilterToElement({ element } = {}) {
    if (!this.type) { return this }

    const parentSVG = element.elt.ownerSVGElement

    // Remove previous mask if exists
    const previousMask = parentSVG.querySelector(`mask[id="${this.id}"]`)
    if (previousMask) {
      previousMask.remove()
    }

    // Clone the element and append to mask
    const maskContent = element.elt.cloneNode(true)
    maskContent.setAttribute("id", `mask-content-${this.id}`)
    maskContent.setAttribute("stroke", this.color)
    maskContent.setAttribute("stroke-width", this.width)
    this.mask.child(new p5.Element(maskContent))

    if (this.width < 0) {
      // Clone the element and append to stroke mask
      const strokeMaskContent = element.elt.cloneNode(true)
      strokeMaskContent.setAttribute("id", `stroke-mask-content-${this.id}`)
      strokeMaskContent.setAttribute("fill", this.color)
      this.strokeMask.child(new p5.Element(strokeMaskContent))
    }

    // Set mask attribute on the element
    element.attribute("mask", `url(#${this.id})`)

    // Add defs to the parentSVG
    parentSVG.appendChild(this.defs.elt)

    return this
  }


}


//CLASS: p5js EXTENSIONS
// SIZE: 204 lines
// #region p5js EXTENSIONS
//PROTOTYPE: p5 extension createElementNS(namespaceURI, qualifiedName)
p5.prototype.createElementNS = function (namespaceURI, qualifiedName) {
  let elt = document.createElementNS(namespaceURI, qualifiedName)
  return addElement(elt, this)
}

//PROTOTYPE: p5 extension createSVGElt(qualifiedName)
p5.prototype.createSVGElt = function (qualifiedName = 'svg', layout) {
  const elt = document.createElementNS(SVG.xmlns, qualifiedName)
  const p5Element = addElement(elt, this)
  if (layout) { p5Element.layout(layout) }
  return p5Element
}

//PROTOTYPE: p5 extension createSVG(width, height)
p5.prototype.createSVG = function (width, height) {
  return svg = createSVGElt()
    .attribute(SVG.width, `${width}`)
    .attribute(SVG.height, `${height}`)
}

// NOTE: Created with GPT-4 on Fri Jan 13, 2024
//PROTOTYPE: p5 extension createSVGText
p5.prototype.createSVGText = function (content, x = 0, y = 0) {
  const textElt = this.createSVGElt('text').html(content)
  textElt.attribute('x', x)
  textElt.attribute('y', y)
  return textElt
}
// NOTE: Created with GPT-4 on Fri Jan 13, 2024
//PROTOTYPE: p5.Element extension setText
p5.Element.prototype.setText = function (content) {
  if (this.type === 'svg' && this.elt.tagName === 'text') {
    this.html(content)
  }
  return this
}

//PROTOTYPE: p5.Element extension addToClassList(newClass)
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

//PROTOTYPE: p5.Element extension layout(x, y, width, height)
p5.Element.prototype.layout = function (x, y, width, height, padding = 0) {
  // console.log(`layout arguments`, arguments)
  const args = OpArray.from(arguments)
  // single object input
  if (args.length === 1) {
    x = x.x
    y = x.y
    width = x.width
    height = x.height
    if (x[`padding`]) { padding = x[`padding`] }
  }
  // (anchor, size, padding) input
  if (args.length > 1 && args.length < 4 && args.slice(0, 2).every(a => a instanceof Vertex)) {
    x = args[0].x
    y = args[0].y
    width = args[1].x
    height = args[1].y
    if (args[2]) { padding = args[2] }
  }
  this
    .attribute('x', x - padding)
    .attribute('y', y - padding)
    .attribute('width', width + padding * 2)
    .attribute('height', height + padding * 2)
  return this
}
//PROTOTYPE: p5.Element extension viewBox(x, y, width, height)
p5.Element.prototype.viewBox = function (x, y, width, height, padding = 0) {
  const args = OpArray.from(arguments)
  // single object input
  if (args.length === 1) {
    x = x.x
    y = x.y
    width = x.width
    height = x.height
    if (x[`padding`]) { padding = x[`padding`] }
  }
  // (anchor, size, padding) input
  if (args.length > 1 && args.length < 4 && args.slice(0, 2).every(a => a instanceof Vertex)) {
    x = args[0].x
    y = args[0].y
    width = args[1].x
    height = args[1].y
    if (args[2]) { padding = args[2] }
  }
  this.attribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`)
  return this
}

// PROTOTYPE: p5.Element extension 'type' property
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

// PROTOTYPE: p5.Element extension 'p5Parent' property
Object.defineProperty(p5.Element.prototype, 'p5Parent', {
  get: function () {
    const parentHTMLElement = this.parent()
    return parentHTMLElement ? select('#' + parentHTMLElement.id) : null
  }
})

//PROTOTYPE: p5.Element extension attributeNS(nameSpaceURI, attr, value)
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
    return this
  }
}

// NOTE: Created with GPT-4 on Fri Mar 24, 2023
//PROTOTYPE: p5.Element extension blur(radius)
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

//PROTOTYPE: p5.Element extension applyFilter(filter, scale = 1)
p5.Element.prototype.applyFilter = function ({ filter, size, padding = 0, time = 0 } = {}) {
  if (filter) { filter.applyFilterToElement({ element: this, size: size, padding: padding, time: time }) }
  return this
}

//PROTOTYPE: p5.Element extension crossfadeElements(fromElement, toElement, duration, onComplete)
p5.prototype.crossfadeElements = async function (fromElement, toElement, duration, onComplete) {
  console.log('fromElement', fromElement)
  console.log('toElement', toElement)
  const startTime = performance.now()
  const fromElementOpacity = parseFloat(fromElement.attribute("opacity") || "1")
  const toElementOpacity = parseFloat(toElement.attribute("opacity") || "1")

  const step = (timestamp) => {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)

    fromElement.attribute("opacity", fromElementOpacity * (1 - progress))
    toElement.attribute("opacity", toElementOpacity * progress)

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      if (onComplete) {
        onComplete()
      }
    }
  }

  requestAnimationFrame(step)
}

// PROTOTYPE: p5.Element extension applyStrokeMask(color, width)
p5.Element.prototype.applyStrokeMask = function (color, width) {
  const strokeMaskFilter = new StrokeMaskFilter().strokeMask(color, width)
  strokeMaskFilter.applyFilterToElement({ element: this })
  return this
}
// #endregion

