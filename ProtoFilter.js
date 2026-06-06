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
        // useBlur = false // TEMP: disable blur for now to focus on offset and blending
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
          .attribute('in', useBlur ? 'blurred' : 'SourceAlpha')        // verified attr
          .attribute('dx', dx)                                        // verified attr
          .attribute('dy', dy)                                        // verified attr
          .attribute('result', 'offset-blurred')                      // verified attr
          .parent(filter)

        // Store the full signed offset magnitude for runtime animation
        // Build-time: dx = vector.x * mag, where vector may carry its own magnitude via setMag()
        // Runtime needs: shadUnitVect.x * fullMag to reproduce the same offset at any angle
        const fullMag = Math.sign(mag) * sqrt(dx * dx + dy * dy)
        this.offsetElts.push({ elt: feOffset, mag: fullMag, })

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
      // SAFARI COMPAT (Apr 2026, B1 Root Cause B):
      // Move the <defs> containing this filter INTO parentSVG *before* creating
      // the consuming <g>. Safari (WebKit) requires that referenced resources
      // (<filter>, <mask>, etc.) are defined in an ancestor/sibling scope —
      // NOT as a descendant of the element that references them. Chrome resolves
      // IDs globally and tolerates the wrong placement; Safari is spec-strict.
      // insertBefore(firstChild) prepends the defs so it always precedes the
      // consumer <g> in DOM order.
      parentSVG.insertBefore(this.defs.elt, parentSVG.firstChild)

      newGroup = createSVGElt("g")
        .id(`${this.id} -${element.id()}`)
        .attribute("filter", filterUrl)
        .parent(parentSVG)
      // .attribute('overflow', 'visible')
      // .attribute(`filterUnits`, `userSpaceOnUse`)
      // .attribute(`primitiveUnits`, `userSpaceOnUse`)
    }

    // if (time > 0) {
    //   const oldGroup = element.p5Parent
    //   if (oldGroup !== newGroup) {
    //     crossfadeElements(oldGroup, newGroup, time, () => {
    //       element.parent(newGroup)
    //       if (oldGroup.childElementCount === 0) oldGroup.remove()
    //     })
    //   }
    // } else {
    element.parent(newGroup)
    const oldGroup = element.p5Parent
    if (oldGroup.childElementCount === 0) oldGroup.remove()
    // }
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

//FUNC: svgLayoutRect() : { x, y, width, height } : normalize layout/viewBox arguments
function svgLayoutRect(args) {
  let [x, y, width, height, padding = vert(0)] = args

  if (args.length === 1 || (args.length === 2 && !args[0]?.xMin)) {
    const rect = args[0]
    x = rect.x
    y = rect.y
    width = rect.width
    height = rect.height
    if (rect.padding) padding = rect.padding
  }

  if (args.length > 1 && args.slice(0, 2).every(a => a instanceof Vertex)) {
    x = args[0].x
    y = args[0].y
    width = args[1].x
    height = args[1].y
    if (args[2] instanceof Vertex) padding = args[2]
  }

  return {
    x: x - padding.x,
    y: y - padding.y,
    width: width + padding.x * 2,
    height: height + padding.y * 2,
  }
}

//FUNC: svgRectToBounds() : BoundsObject : convert x/y/width/height rects for boundsOverlap()
function svgRectToBounds(rect) {
  return {
    xMin: rect.x,
    xMax: rect.x + rect.width,
    yMin: rect.y,
    yMax: rect.y + rect.height,
  }
}

//FUNC: svgBoundsToRect() : { x, y, width, height } : convert boundsOverlap() result to SVG rect attrs
function svgBoundsToRect(bounds) {
  return {
    x: bounds.xMin,
    y: bounds.yMin,
    width: bounds.xMax - bounds.xMin,
    height: bounds.yMax - bounds.yMin,
  }
}

//FUNC: svgLimitBounds() : BoundsObject : resolve explicit limit or default visible grid bounds
function svgLimitBounds(limitBounds) {
  const rect = limitBounds
    || (typeof GRID !== 'undefined' ? GRID?.visibleBoundsRect : undefined)
    || (typeof BGRID !== 'undefined' ? BGRID?.visibleBoundsRect : undefined)
    || (typeof FRAME !== 'undefined' ? FRAME?.boundsRect : undefined)
  if (!rect) return
  return rect.xMin !== undefined ? rect : svgRectToBounds(rect)
}

//FUNC: isSVGLimitBounds() : Bool : identify explicit rect/bounds limiter arguments
function isSVGLimitBounds(obj) {
  return !!obj && (
    hasProperties(obj, ['xMin', 'xMax', 'yMin', 'yMax']) ||
    hasProperties(obj, ['x', 'y', 'width', 'height'])
  )
}

//FUNC: limitedSVGLayoutRect() : { x, y, width, height } : clamp realized SVG rect to limit bounds
function limitedSVGLayoutRect(args) {
  const
    lastArg = args[args.length - 1],
    hasExplicitLimit = args.length > 1 && isSVGLimitBounds(lastArg),
    limitBounds = svgLimitBounds(hasExplicitLimit ? lastArg : undefined),
    rect = svgLayoutRect(hasExplicitLimit ? args.slice(0, -1) : args)

  if (!limitBounds) return rect

  const limited = boundsOverlap({ geo: [svgRectToBounds(rect), limitBounds] })
  return limited ? svgBoundsToRect(limited) : { x: 0, y: 0, width: 0, height: 0 }
}

//PROTOTYPE: p5.Element.layoutLimited(x, y, width, height, padding, limitBounds) : p5.Element : set visible-bounds-limited layout attrs
p5.Element.prototype.layoutLimited = function () {
  const { x, y, width, height } = limitedSVGLayoutRect(OpArray.from(arguments))
  this
    .attribute('x', x)
    .attribute('y', y)
    .attribute('width', width)
    .attribute('height', height)
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

//PROTOTYPE: p5.Element.viewBoxLimited(x, y, width, height, padding, limitBounds) : p5.Element : set visible-bounds-limited viewBox
p5.Element.prototype.viewBoxLimited = function () {
  const { x, y, width, height } = limitedSVGLayoutRect(OpArray.from(arguments))
  this.attribute('viewBox', `${x} ${y} ${width} ${height}`)
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
//
// SAFARI COMPAT (Apr 2026, B1 attack plan):
// Default %-based filterUnits='objectBoundingBox' is unreliable in WebKit when
// the filtered element lives inside <mask>/<defs> — getBBox() can return zero
// or throw, collapsing the filter region to nothing and producing missing
// shapes in cut-mask groups (depth-correlated bug, confirmed via audit:
// rows with stdDev>1 inside masks all returned 'n/a' for bbox in Safari).
// Switching to filterUnits='userSpaceOnUse' with absolute bounds bypasses the
// broken bbox math entirely. Bounds are scaled with radius and given a large
// safety margin so any real-world consumer in this codebase is covered.
//
// Revert-flag: window.SAFARI_BLUR_USERSPACE_FIX = false (then reload)
p5.Element.prototype.blur = function (radius) {
  const parentSVG = this.elt.ownerSVGElement || this.parent()
  let defs = parentSVG.querySelector('defs')
  if (!defs) defs = createSVGElt('defs').parent(parentSVG)

  const filterID = 'blur-' + Math.floor(Math.random() * 100000)
  const filter = createSVGElt('filter').attribute('id', filterID)

  const useUserSpace = (typeof window !== 'undefined') && (window.SAFARI_BLUR_USERSPACE_FIX !== false)

  if (useUserSpace) {
    // userSpaceOnUse: absolute coordinates in the parent SVG's user space.
    // Canonical canvas region is (0,0,100,200); pad by 5× radius (covers any
    // 3σ Gaussian fall-off plus margin) and clamp to a generous floor so
    // small blurs still get a usable region. Bounds are deliberately huge —
    // GPU-side cost scales with painted area, not declared region.
    const pad = Math.max(50, Math.ceil(radius * 5))
    filter
      .attribute('filterUnits', 'userSpaceOnUse')
      .attribute('x', -pad)
      .attribute('y', -pad)
      .attribute('width', 100 + pad * 2)
      .attribute('height', 200 + pad * 2)
  } else {
    // Legacy path — kept for revert/A-B comparison.
    const margin = max(50, Math.ceil(radius * 3 / 1) * 100)
    filter
      .attribute('x', `-${margin}%`)
      .attribute('y', `-${margin}%`)
      .attribute('width', `${100 + margin * 2}%`)
      .attribute('height', `${100 + margin * 2}%`)
  }

  filter.parent(defs)

  createSVGElt('feGaussianBlur')
    .attribute('in', 'SourceGraphic')
    .attribute('stdDeviation', radius)
    .parent(filter)

  this.attribute('filter', `url(#${filterID})`)
  return this
}
//PROTOTYPE: p5.Element.mask() : p5.Element : apply a mask filter to the element
p5.Element.prototype.mask = function (shape, blur = 0, strokeWidth = 0) {
  const
    parent = this.parent(),
    viewBox = parent.getAttribute('viewBox'),
    [x, y, width, height] = viewBox ? viewBox.split(' ').map(Number) : [parent.x, parent.y, parent.width, parent.height],
    padding = Math.ceil(blur * 3),
    newViewBox = [x - padding, y - padding, width + padding * 2, height + padding * 2].join(' '),
    maskID = 'mask-' + Math.floor(Math.random() * 100000)

  // Create defs element if it doesn't exist
  let defs = parent.querySelector('defs')
  if (!defs) defs = createSVGElt('defs').parent(parent)

  // Clone the shape for the mask
  const
    maskShape = shape.elt.cloneNode(true),
    maskShapeElement = addElement(maskShape, this._pInst)

  // Step 1: Configure stroke or fill
  if (strokeWidth > 0) {
    maskShapeElement.attribute('stroke-width', strokeWidth)
    maskShapeElement.attribute('stroke', 'white')
    maskShapeElement.attribute('fill', 'none')
  } else {
    maskShapeElement.attribute('fill', 'white')
    maskShapeElement.attribute('stroke', 'none')
  }

  // Step 2: Apply blur if specified
  if (blur > 0) maskShapeElement.blur(blur)

  // Create mask element
  const mask = createSVGElt('mask')
    .attribute('id', maskID)
    .parent(defs)

  mask.elt.appendChild(maskShapeElement.elt)

  // Step 3: Apply mask to element
  this
    .attribute('mask', `url(#${maskID})`)
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