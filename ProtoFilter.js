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

// class FE {
//   static
// }

// make .attr() prototype extension that gets and sets attributes similar to p5's .style() 
// make neuShadow equivalents for inset shadows in SVG
// make stage for comparing shadows and see if svg shadows are deal-breaker for neumorphism
// optimize rendering by creating methods to aggregate some groups of shapes to the same svg 'layer' 


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
// SIZE: 355 lines
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
    // DeBug.log('filter init', this)
  }

  //METH: shade()
  shade(shades, type, clearInset = true, normalBlending = false) {
    shades = OpArray.format(shades)
    DeBug.log(`shade creation`)
    // const normalBlending = false            // always use true (use false for special one offs!)
    const insetShadows = shades.filter(shade => shade.inset)
    const outsetShadows = shades.filter(shade => !shade.inset)
    // const insetHighlights = shades.filter(shad => shad.inset && shad.lighten)
    // const insetShadows = shades.filter(shad => shad.inset && !shad.lighten)
    // const outsetHighlights = shades.filter(shad => !shad.inset && shad.lighten)
    // const outsetShadows = shades.filter(shad => !shad.inset && !shad.lighten)

    this.shades = shades
    // this.shades = outsetShadows

    // this.clearInset = clearInset
    this.type = type
    this.defs = createSVGElt('defs')
    this.filter = createSVGElt('filter').id(this.id)
    // .attribute('overflow', 'visible')

    createSVGElt('feFlood')
      .attribute('flood-opacity', 0)
      .attribute('result', 'transparentInput')
      .parent(this.filter)

    let previousResult = 'SourceGraphic'
    // let insetResult = clearInset ?  : 'SourceGraphic'
    // let insetResult = clearInset ? 'SourceGraphic' : 'SourceGraphic'
    let insetResult = 'transparentInput'
    let outsetResult = 'SourceGraphic'


    //ARROW: buildFilter()
    const buildFilter = (shades, filter, inset) => {
      let prevMode = 'normal'
      // DeBug.warn(`building shades`)
      for (const shade of shades) {
        // DeBug.log(`current shade:`, shade)
        // const { dx, dy, blur, color, lighten } = shade
        let { invert, blur, color, lighten } = shade
        const vector = Shade.shadVect()
        let mag = shade.mag * 1
        mag = lighten ? mag * -1 : mag
        mag = invert ? mag * -1 : mag
        const [dx, dy] = [vector.x * mag, vector.y * mag]

        const resultId = `shade-${inset ? "inset" : "outset"}-${random()
          .toString(36)
          .substring(7)}`
        // insetResult = resultId
        const blendMode = () => {
          return 'normal'
          // if ((prevMode === 'lighten' && !lighten) || (prevMode === 'darken' && lighten)) { return 'normal' }
          // return lighten ? 'lighten' : 'darken'
          // return lighten ? 'multiply' : 'darken'
          // return 'hard-light'
          return 'exclusion'
          return 'difference'
          return 'overlay'
          // return lighten ? 'darken' : 'screen'
          // return lighten ? 'hard-light' : 'multiply'
          return lighten ? 'multiply' : 'screen'
          // return lighten ? 'screen' : 'darken'
        }

        let useBlur = blur > 0
        // useBlur = false
        blur = blur * 1

        //NOTE: NEW BLOCK START-------------------------------------------
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
        //NOTE: NEW BLOCK END-------------------------------------------


        //NOTE: OLD BLOCK START-------------------------------------------
        // if (useBlur) {
        //   //1 feGaussianBlur: blur the alpha channel of the input shape
        //   createSVGElt('feGaussianBlur')
        //     .attribute('in', `SourceAlpha`)                         // verified attr
        //     .attribute('stdDeviation', blur)                        // verified attr
        //     .attribute('result', 'blurred')                         // verified attr
        //     .parent(filter)
        // }

        // //2 feOffset: offset the blurred result
        // const feOffset = createSVGElt('feOffset')
        //   .attribute('in', useBlur ? 'blurred' : 'SourceAlpha')       // verified attr
        //   .attribute('dx', dx)                                        // verified attr
        //   .attribute('dy', dy)                                        // verified attr
        //   .attribute('result', 'offset-blurred')                      // verified attr
        //   .parent(filter)

        // // DeBug.log(`this.offsetElts`, this.offsetElts)
        // this.offsetElts.push({ elt: feOffset, mag: mag, })

        // //3 feFlood: flood the offset result with the input color
        // createSVGElt('feFlood')
        //   // .attribute(`in`, 'offset-blurred') // FLOOD creates a solid color shape so no input, mix with composite/blend
        //   .attribute('flood-color', color)                            // verified attr
        //   .attribute('flood-opacity', 1)                              // verified attr
        //   .attribute('result', 'colored')                             // verified attr
        //   .parent(filter)

        // // 4a feComposite - 
        // if (inset) {
        //   DeBug.warn(`INSET FILTER!!!`)
        //   //3B feComposite - MASK IN: if this is an inset shade, mask 
        //   createSVGElt('feComposite')
        //     .attribute('operator', 'out')
        //     .attribute('in', clearInset ? 'SourceGraphic' : insetResult) // might need to option insetResult here
        //     // .attribute('in2', insetResult)
        //     // .attribute('in', insetResult)
        //     .attribute('in2', 'offset-blurred')
        //     .attribute('result', 'insetMask')
        //     .parent(filter)
        // }

        // //4 feComposite - composite the 'colored' flood layer with the offset/blurred or insetMask
        // createSVGElt('feComposite')
        //   .attribute('operator', 'in')
        //   .attribute('in', `colored`)
        //   // .attribute('in2', `offset-blurred`)
        //   .attribute('in2', inset ? 'insetMask' : `offset-blurred`)
        //   .attribute('result', `composite`)
        //   .parent(filter)
        // // .attribute('result', resultId)

        // //5A feBlend - 'resultId'
        // createSVGElt('feBlend')
        //   .attribute('mode', normalBlending ? 'normal' : blendMode()) // 'darken' or 'lighten'
        //   .attribute('in', inset ? insetResult : outsetResult)
        //   .attribute('in2', 'composite')
        //   .attribute('result', resultId)
        //   .parent(filter)

        // prevMode = blendMode()
        // // DeBug.log('prevMode', prevMode)

        // if (inset) {
        //   insetResult = resultId
        //   // DeBug.log('inset resultId', resultId)
        // } else {
        //   outsetResult = resultId
        //   // DeBug.log('outset resultId', resultId)
        // }
        //NOTE: OLD BLOCK END-------------------------------------------
      }
    }

    if (insetShadows.length > 0) {
      buildFilter(insetShadows, this.filter, true)

      // createSVGElt('feComposite')
      //   .attribute('operator', 'over')
      //   .attribute('in', 'SourceAlpha') // might need to option insetResult here
      //   // .attribute('in2', insetResult)
      //   // .attribute('in', insetResult)
      //   .attribute('in2', insetResult)
      //   .attribute('result', insetResult)
      //   .parent(this.filter)


    }
    else {
      if (clearInset) { insetResult = 'SourceAlpha' }
    }

    if (outsetShadows.length > 0) {
      buildFilter(outsetShadows, this.filter, false)
      createSVGElt('feComposite')
        .attribute('operator', clearInset ? 'out' : 'over')
        .attribute('in', clearInset ? outsetResult : insetResult)
        .attribute('in2', clearInset ? insetResult : outsetResult)
        .attribute('result', 'finalResult')
        .parent(this.filter)
      previousResult = 'finalResult'
    } else {
      // previousResult = insetResult
    }



    // createSVGElt('feMerge')
    //   .child(
    //     createSVGElt('feMergeNode')
    //       .attribute('in', previousResult)
    //       .parent(this.filter)
    //   )


    this.defs.child(this.filter)

    return this
  }

  //MARK: Utility methods
  applyFilterToElement({ element, size, padding = vert(40), time = 0, applyToGroup = true } = {}) {
    if (!this.type) { return this }
    // DeBug.warn(`applyFilter`, element)
    // DeBug.warn(`applyFilter sizeX: ${size.x}, sizeY: ${size.y}`)
    // DeBug.warn(`applyFilter paddingX: ${padding.x}, paddingY: ${padding.y}`)

    // DeBug.log(`applyFilter size: x:${size.x}, y:${size.y}`)
    // DeBug.log(`applyFilter GRID.cellSize: x:${GRID.cellSize.x}, y:${GRID.cellSize.y}`)
    // DeBug.log(`applyFilter padding: x:${padding.x}, y:${padding.y}`)


    // DeBug.log(`final padding: x:${padding.x}, y:${padding.y} `)

    // const x = -padding.x / size.x * 100
    // const y = -padding.y / size.y * 100

    // const width = 200 * padding.x / size.x + 100
    // const height = 200 * padding.y / size.y + 100

    // this.filter
    //   .attribute("x", `${x}%`)
    //   .attribute("y", `${y}%`)
    //   .attribute("width", `${width}%`)
    //   .attribute("height", `${height}%`)

    // .attribute('overflow', 'visible')


    // .attribute(`filterUnits`, `userSpaceOnUse`)
    // .attribute(`primitiveUnits`, `userSpaceOnUse`)

    // .attribute("filterUnits", "userSpaceOnUse")
    // .attribute("x", `-10%`)
    // .attribute("y", `-10%`)
    // .attribute("width", `120%`)
    // .attribute("height", `120%`)

    // console.error(`this.filter`, this.filter)

    // console.log(`${this.filter.elt.id} x`, this.filter.attribute("x"))
    // console.log(`${this.filter.elt.id} y`, this.filter.attribute("y"))
    // console.log(`${this.filter.elt.id} width`, this.filter.attribute("width"))
    // console.log(`${this.filter.elt.id} height`, this.filter.attribute("height"))

    const parentSVG = element.elt.ownerSVGElement
    const filterUrl = `url(#${this.id})`

    // if (applyToGroup) {
    let newGroup = parentSVG.querySelector(`g[filter = "${filterUrl}"][id ^= "${this.id}-"]`)
    if (!newGroup) {
      newGroup = createSVGElt("g")
        .id(`${this.id} -${element.id()}`)
        .attribute("filter", filterUrl)
        // .attribute('overflow', 'visible')
        .parent(parentSVG)
        .child(this.defs)
      // .attribute(`filterUnits`, `userSpaceOnUse`)
      // .attribute(`primitiveUnits`, `userSpaceOnUse`)
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
    // } else {
    //   element.attribute(`filter`, filterUrl)
    //   let parentGroup = parentSVG.querySelector(`g[id^="${this.id}-elements"]`)
    //   if (!parentGroup) {
    //     parentGroup = createSVGElt("g")
    //       .id(`${this.id}-elements`)
    //       .attribute('overflow', 'visible')
    //       .parent(parentSVG)
    //   }
    //   element.parent(parentGroup)
    // }
  }

  //METH: updateOffsets()
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
p5.prototype.createSVGElt = function (qualifiedName = 'svg',
  // layout
) {
  const elt = document.createElementNS(SVG.xmlns, qualifiedName)
  const p5Element = addElement(elt, this)
  // if (layout) { p5Element.layout(layout) }
  return p5Element
}

//PROTOTYPE: p5 extension createSVG(width, height)
// p5.prototype.createSVG = function (width, height) {
//   return svg = createSVGElt()
//     .attribute(SVG.width, `${width}`)
//     .attribute(SVG.height, `${height}`)
// }

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
p5.Element.prototype.layout = function (x, y, width, height, padding = vert(0)) {
  // DeBug.log(`layout arguments`, arguments)
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
    .attribute('x', x - padding.x)
    .attribute('y', y - padding.y)
    .attribute('width', width + padding.x * 2)
    .attribute('height', height + padding.y * 2)
  return this
}
//PROTOTYPE: p5.Element extension viewBox(x, y, width, height)
p5.Element.prototype.viewBox = function (x, y, width, height, padding = vert(0)) {
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
  this.attribute('viewBox', `${x - padding.x} ${y - padding.y} ${width + padding.x * 2} ${height + padding.y * 2}`)
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
  // console.log(`parent`, this.parent())
  const parent = this.parent()
  const viewBox = parent.getAttribute('viewBox')
  const [x, y, width, height] = viewBox ? viewBox.split(' ').map(Number) : [parent.x, parent.y, parent.width, parent.height]
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
p5.Element.prototype.applyFilter = function ({ filter, size, padding, time = 0 } = {}) {
  if (filter) { filter.applyFilterToElement({ element: this, size: size, padding: padding, time: time }) }
  return this
}

//PROTOTYPE: p5.Element extension crossfadeElements(fromElement, toElement, duration, onComplete)
p5.prototype.crossfadeElements = async function (fromElement, toElement, duration, onComplete) {
  DeBug.log('fromElement', fromElement)
  DeBug.log('toElement', toElement)
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

