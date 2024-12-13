// MIXIN: Debuggable : mixin for displaying debug info on ProtoLayers
const Debuggable = {
  drawLabel: false,
  drawDeBugRect: false,
  drawPerimeter: false,
  drawInset: false,
  drawLoft: false,

  // deBugColor: protoColor(255, 0, 0),

  //MARK: Debuggable Computed Properties
  get isPerimeterShape() { return this.type === `PerimeterShape` },
  get isPerimeterIsland() { return this.type === `PerimeterIsland` },
  get isIsland() { return this.type === `Island` || this.isPerimeterIsland },
  get isShape() { return this.type === `Shape` || this.isPerimeterShape },
  get isShapeGroup() { return this.type.includes(`ShapeGroup`) },

  get deBugAnchor() {
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
    if (this.drawLoft) { this.showLofts() }
  },

  showLabel() {
    if (this.drawSVG) {
      if (!this.deBugLabelElt) { this.deBugLabelElt = createSVGText(this.id, 0, 0) }
      let offset, font
      if (this.isShape) {
        offset = this.isPerimeterShape ? vert(1, 4) : vert(1, 8)
        font = this.isPerimeterShape ? `bold 3px sans-serif` : `3px sans-serif`
      } else if (this.isShapeGroup) {
        offset = vert(1, 8)
        font = `2px sans-serif`
      } else if (this.isIsland) {
        offset = this.isPerimeterIsland ? vert(1, 4) : vert(1, 8)
        font = this.isPerimeterIsland ? `bold 3px sans-serif` : `3px sans-serif`
      } else {
        offset = vert(1, 4)
        font = `bold 2px sans-serif`
      }

      this.deBugLabelElt
        .parent(this.svgElt)
        .layout(this.deBugAnchor.x + offset.x, this.deBugAnchor.y + offset.y, this.size.x, this.size.y)
        .style(`font`, font)
        .style(CS.textShadow, `1px 1px 2px white`)
    }
  },

  showRect() {
    if (this.drawSVG) {
      const radius = 2
      if (!this.deBugRectElt) { this.deBugRectElt = createSVGElt('rect').id(`${this.id}-deBugRect`) }
      // if (this.isShape) {

      // } else {
      // console.warn(`${this.id} showRect called!`)
      // console.log(`grid`, this.grid)
      // console.log(`grid insetAnchor`, this.grid.insetAnchor)
      // console.log(`grid insetScale`, this.grid.insetScale)
      // console.log(`grid insetSize`, this.grid.insetSize)
      // if (this.type === `Cell`) {
      //   console.log(`cell ${this.id} insetAnchor: `, this.insetAnchor)
      //   console.log(`cell ${this.id} insetSize: `, this.insetSize)
      // }
      // console.log(`showRect layout args`, this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
      this.deBugRectElt
        .parent(this.svgElt)
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', radius)
        .attribute('ry', radius)
      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      this.deBugRectElt
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.0625`)
        .attribute('stroke-dasharray', `1 2`)
      // }
    }
  },

  showPerimeter() {
    if (this.isPerimeterShape) {
      if (!this.deBugPerimeterElt) { this.deBugPerimeterElt = createSVGElt('path') }
      this.deBugPerimeterElt
        .parent(this.svgElt)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)
      const randHue = ProtoColor.randomShadHue()
      const lightHue = ProtoColor.randomHighHue()
      this.deBugPerimeterElt
        .attribute('d', this.perimeter)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', lightHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },

  showInset() {
    if (this.isShape) {
      if (!this.deBugInsetPathElt) { this.deBugInsetPathElt = createSVGElt('path') }
      this.deBugInsetPathElt
        .parent(this.svgElt)
        .layout(this.anchor, this.size)

      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 256)
      this.deBugInsetPathElt
        .attribute('d', this.svg)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.25`)
        .attribute('stroke-dasharray', `1 1`)
    } else {
      if (!this.deBugInsetRectElt) { this.deBugInsetRectElt = createSVGElt('rect') }
      this.deBugInsetRectElt
        .parent(this.svgParent)
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', 1)
        .attribute('ry', 1)
      const randHue = ProtoColor.randomShadHue()
      const lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      this.deBugInsetRectElt
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },
  showLofts() {
    DeBug.error(`DEBUG: showLofts`)

    const randHue = ProtoColor.randomShadHue()
    const lightHue = protoColor(randHue.red, randHue.green, randHue.blue)
    DeBug.groupCollapsed(this.id)
    if (this.isShapeGroup && this.cut?.profile) {
      this.debugStartElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-debugStart`)
      this.debugEndElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-debugEnd`)
      const debugElts = OpArray.format([this.debugStartElt, this.debugEndElt])
      debugElts.forEach(elt => {
        const lowHue = protoColor(randHue.red, randHue.green, randHue.blue, 10)

        elt
          .parent(this.svgElt)
          .attribute('fill', protoColor(0, 0))
          .attribute('stroke-width', `.125`)
          .attribute('stroke-dasharray', `.5`)
      })

      this.shapes.forEach(sh => {
        DeBug.log(`this.cut`, this.cut)
        DeBug.log(`cut values`, this.cut.start, this.cut.depth, sh.insetScale)
        const depthScale = vert(this.cut.depth / this.grid.cellRadius / 2)
        DeBug.log(`depthScale`, depthScale)
        let startScale, endScale
        if (this.cut.profile.hasOutsetShade) {
          startScale = Vertex.add(sh.insetScale, depthScale)
          endScale = sh.insetScale
        } else {
          startScale = sh.insetScale
          endScale = Vertex.sub(vert(this.cut.start), vert(this.cut.depth / this.grid.cellRadius / 2))
        }

        const newScales = [startScale, endScale]
        DeBug.log(`newScales`, newScales)
        const newPaths = newScales.map((scale, i) => {
          const shape = sh.copy({
            insetScale: scale,
            protoParent: sh.protoParent,
            island: sh.island,
          })
          const path = createSVGElt('path').id(`${shape.id}-debugStartPath`)
            .attribute(`d`, shape.svg)
            .layout(shape.anchor, shape.size, shape.padding)
            .parent(i = 0 ? this.debugStartElt : this.debugEndElt)
            .attribute(`stroke`, i = 0 ? lightHue : lightHue)
        })
      })


    }
    DeBug.groupEnd()
  },


}

//MARK: DeBug Class
//CLASS: replace calls to console methods with these in order to have global control over logging
class DeBug {
  static enableLogging = false // Set to false to disable all logging

  static log(...args) {
    if (this.enableLogging) {
      console.log(...args)
    }
  }

  static error(...args) {
    if (this.enableLogging) {
      console.error(...args)
    }
  }

  static warn(...args) {
    if (this.enableLogging) {
      console.warn(...args)
    }
  }

  static group(...args) {
    if (this.enableLogging) {
      console.group(...args)
    }
  }

  static groupCollapsed(...args) {
    if (this.enableLogging) {
      console.groupCollapsed(...args)
    }
  }

  static groupEnd() {
    if (this.enableLogging) {
      console.groupEnd()
    }
  }
}
