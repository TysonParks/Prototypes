//FUNC: p5 extension createElementNS(namespaceURI, qualifiedName)
p5.prototype.createElementNS = function (namespaceURI, qualifiedName) {
  let elt = document.createElementNS(namespaceURI, qualifiedName)
  return addElement(elt, this)
}

//FUNC: p5 extension createSVGElt(qualifiedName)
p5.prototype.createSVGElt = function (qualifiedName = 'svg', layout) {
  const elt = document.createElementNS(SVG.xmlns, qualifiedName)
  const p5Element = addElement(elt, this)
  if (layout) { p5Element.layout(layout) }
  return p5Element
}

//FUNC: p5 extension createSVG(width, height)
p5.prototype.createSVG = function (width, height) {
  return svg = createSVGElt()
    .attribute(SVG.width, `${width}`)
    .attribute(SVG.height, `${height}`)
}

//FUNC: p5.Element extension addToClassList(newClass)
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

//FUNC: p5.Element extension addToClassList(newClass)
p5.Element.prototype.layout = function (x, y, width, height) {
  if (arguments.length === 1) {
    x = x.x
    y = x.y
    width = x.width
    height = x.height
  }
  this
    .attribute('x', x)
    .attribute('y', y)
    .attribute('width', width)
    .attribute('height', height)
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

Object.defineProperty(p5.Element.prototype, 'p5Parent', {
  get: function () {
    const parentHTMLElement = this.parent()
    return parentHTMLElement ? select('#' + parentHTMLElement.id) : null
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
    return this
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

function createFilter() {
  return new ProtoFilter()
}

//CLASS: ProtoFilter
class ProtoFilter {
  filter
  defs
  type

  constructor() {
    this.needsPadding = false
    this.storeObject(S.Effects)
    // console.log('filter init', this)
  }

  //MARK: Drop Shadow methods


  dropShadow(shadows) {
    shadows = OpArray.format(shadows)

    const insetShadows = shadows.filter(shadow => shadow.inset)
    const outsetShadows = shadows.filter(shadow => !shadow.inset)
    this.shadows = outsetShadows

    this.type = 'dropShadow'
    this.defs = createSVGElt('defs')
    this.filter = createSVGElt('filter').id(this.id)

    let previousResult = 'SourceGraphic'
    let insetResult = 'SourceGraphic'
    let outsetResult = 'SourceGraphic'

    // INSET
    function buildFilter(shadows, filter, inset) {
      for (const shadow of shadows) {
        const { dx, dy, blur, color } = shadow
        const resultId = `shadow-${inset ? "inset" : "outset"}-${Math.random()
          .toString(36)
          .substring(7)}`
        //1 feGaussianBlur
        createSVGElt('feGaussianBlur')
          .attribute('in', 'SourceAlpha')
          .attribute('stdDeviation', blur)
          .attribute('result', 'blur')
          .parent(filter)
        //2 feOffset
        createSVGElt('feOffset')
          .attribute('in', 'blur')
          .attribute('dx', dx)
          .attribute('dy', dy)
          .attribute('result', 'offset-blur')
          .parent(filter)
        //3 feFlood
        createSVGElt('feFlood')
          .attribute('flood-color', color)
          .attribute('flood-opacity', 1)
          .attribute('result', 'color')
          .parent(filter)

        if (inset) {
          //3B feComposite - MASK IN
          createSVGElt('feComposite')
            .attribute('operator', 'out')
            .attribute('in', insetResult)
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
        createSVGElt('feMerge')
          .parent(filter)
          .child(
            createSVGElt('feMergeNode')
              .attribute('in', inset ? insetResult : outsetResult)
          )
          .child(
            createSVGElt('feMergeNode')
              .attribute('in', 'composite')
          )
          .attribute('result', resultId)

        if (inset) {
          insetResult = resultId
        } else {
          outsetResult = resultId
        }

      }
    }

    if (insetShadows.length > 0) {
      buildFilter(insetShadows, this.filter, true)
    }

    if (outsetShadows.length > 0) {
      buildFilter(outsetShadows, this.filter, false)
      // this.needsPadding = true
      // this.padding = this.calculatePadding(outsetShadows)
      createSVGElt('feComposite')
        .attribute('operator', 'over')
        .attribute('in', insetResult)
        .attribute('in2', outsetResult)
        .attribute('result', 'finalResult')
        .parent(this.filter)

      previousResult = 'finalResult'
    }

    createSVGElt('feMergeNode')
      .attribute('in', previousResult)
      .parent(this.filter)

    this.defs.child(this.filter)

    return this
  }

  //MARK: Utility methods
  applyFilterToElement(element, scale = 2, time = 0) {
    if (!this.type) { return this }

    const anchor = (scale - 1) * -50;
    const size = scale * 100;
    this.filter
      .attribute("x", `${anchor}%`)
      .attribute("y", `${anchor}%`)
      .attribute("width", `${size}%`)
      .attribute("height", `${size}%`);

    const parentSVG = element.elt.ownerSVGElement;
    const filterUrl = `url(#${this.id})`;

    let newGroup = parentSVG.querySelector(`g[filter="${filterUrl}"][id^="${this.id}-"]`);
    if (!newGroup) {
      newGroup = createSVGElt("g")
        .id(`${this.id}-${element.id()}`)
        .attribute("filter", filterUrl)
        .parent(parentSVG);
      newGroup.child(this.defs);
    }

    if (time > 0) {
      const oldGroup = element.p5Parent;
      if (oldGroup !== newGroup) {
        crossfadeElements(oldGroup, newGroup, time, () => {
          element.parent(newGroup);
          if (oldGroup.childElementCount === 0) {
            oldGroup.remove();
          }
        });
      }
    } else {
      element.parent(newGroup);
      const oldGroup = element.p5Parent;
      if (oldGroup.childElementCount === 0) {
        oldGroup.remove();
      }
    }
  }




  updateFilter(shadows, scale = 2, time = 0) {

  }


  //MARK: Setup methods
  finishSetup(store) {
    this.storeObject(store) // this function assigns an id, a uid, and stores the instance
  }
}

Object.assign(ProtoFilter.prototype, identifiableStored) // this mixin provides store,ID, and UID functionality


//FUNC: p5.Element extension applyFilter(filterInstance, scale = 1)
p5.Element.prototype.applyFilter = function (filterInstance, scale = 2, time = 0) {
  filterInstance.applyFilterToElement(this, scale, time)
  return this
}

//FUNC: p5.Element extension applyFilter(filterInstance, scale = 1)
p5.prototype.crossfadeElements = async function (fromElement, toElement, duration, onComplete) {
  console.log('fromElement', fromElement)
  console.log('toElement', toElement)
  const startTime = performance.now();
  const fromElementOpacity = parseFloat(fromElement.attribute("opacity") || "1");
  const toElementOpacity = parseFloat(toElement.attribute("opacity") || "1");

  const step = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    fromElement.attribute("opacity", fromElementOpacity * (1 - progress));
    toElement.attribute("opacity", toElementOpacity * progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  requestAnimationFrame(step);
};
