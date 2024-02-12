// MIXIN: Debuggable : mixin for displaying debug info on ProtoLayers
const Debuggable = {
  // deBugAnchor: this.calcAnchor,

  drawLabel: false,
  drawDeBugRect: false,
  drawPerimeter: false,
  drawInset: false,
  drawLoft: false,

  //MARK: Debuggable Computed Properties
  isPerimeterShape() { return this.type === `PerimeterShape` },
  isShape() { return this.type === `Shape` || this.isPerimeterShape() },

  deBugAnchor() {
    if (this.cellBounds?.selection) {
      return this.cellBounds.selection[0].anchor
    } else {
      return this.anchor
    }
  },


  //MARK: Debuggable Show Methods
  showDeBug() {
    if (this.drawLabel) { this.showLabel() }
    if (this.drawDeBugRect) { this.showRect() }
    if (this.drawPerimeter) { this.showPerimeter() }
    if (this.drawInset) { this.showInset() }
    if (this.drawLoft) { this.showLoft() }
  },

  showLabel() {
    if (this.drawSVG) {
      const label = createSVGText(this.id, 0, 0)
      let offset, font
      if (this.isShape()) {
        offset = this.isPerimeterShape() ? vert(1, 4) : vert(1, 8)
        font = this.isPerimeterShape() ? `bold 3px sans-serif` : `3px sans-serif`
      } else {
        offset = vert(1, 4)
        font = `bold 3px sans-serif`
      }

      label
        .parent(this.svgElt)
        .layout(this.deBugAnchor().x + offset.x, this.deBugAnchor().y + offset.y, this.size.x, this.size.y)
        .style(`font`, font)
        .style(CS.textShadow, `1px 1px 2px white`)
    }
  },

  showRect() {
    if (this.drawSVG) {
      if (this.isShape()) {

      } else {
        console.warn(`${this.id} showRect called!`)
        console.log(`showRect layout args`, this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
        const deBugRect = createSVGElt('rect')
          .parent(this.svgElt)
          .layout(this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
          .attribute('rx', 1)
          .attribute('ry', 1)
        const randHue = ProtoColor.randomShadHue()
        const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
        deBugRect
          .attribute('fill', protoColor(0, 0))
          .attribute('stroke', randHue)
          .attribute('stroke-width', `.125`)
          .attribute('stroke-dasharray', `4 1`)
      }
    }
  },

  showPerimeter() {
    if (this.isPerimeterShape()) {
      const perimeter = createSVGElt('path')
        .parent(this.svgElt)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)
      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      perimeter
        .attribute('d', this.perimeter)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },

  showInset() {
    if (this.isShape()) {
      const insetPath = createSVGElt('path')
      insetPath
        .parent(this.svgElt)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)

      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 256)
      insetPath
        .attribute('d', this.svg)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.25`)
        .attribute('stroke-dasharray', `1 1`)
    } else {
      const insetRect = createSVGElt('rect')
        .parent(this.svgElt)
        .layout(this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
        .attribute('rx', 1)
        .attribute('ry', 1)
      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      insetRect
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },
  showLoft() { },


}