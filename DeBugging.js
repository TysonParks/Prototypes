// MIXIN: Debuggable : mixin for displaying debug info on ProtoLayers
const Debuggable = {
  drawLabel: false,
  drawRect: false,
  drawPerimeter: false,
  drawInset: false,
  drawLoft: false,

  //MARK: Show Methods
  showDeBug() {
    if (drawLabel) { showLabel() }
    if (drawRect) { showRect() }
    if (drawPerimeter) { showPerimeter() }
    if (drawInset) { showInset() }
    if (drawLoft) { showLoft() }
  },

  showLabel() {
    const label = createSVGText(this.id, 0, 0)
    const isShape = this.type !== `Shape`
    const offset = isShape ? vert(1, 4) : vert(1, 8)
    const font = isShape ? `bold 3px sans-serif` : `3px sans-serif`



    label
      .parent(this.svgElt)
      .addToClassList(this.id)
      .addToClassList(this.svgParent.elt.classList.value)
      .layout(this.anchor.x + offset.x, this.anchor.y + offset.y, this.size.x, this.size.y)
      .style(`font`, font)
  },
  showRect() { },
  showPerimiter() { },
  showInset() { },
  showLoft() { },

  //MARK: Computed Methods
  calcAnchor() {
    if (this.cellBounds) {

    }
  }

}