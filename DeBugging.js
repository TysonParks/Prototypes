// MIXIN: Debuggable : mixin for displaying debug info on ProtoLayers
const Debuggable = {
  drawLabel: false,
  drawDeBugRect: false,
  drawPerimeter: false,
  drawInset: false,
  drawLoft: false,

  //MARK: Debuggable Computed Properties
  get isPerimeterShape() { return this.type === `PerimeterShape` },
  get isPerimeterIsland() { return this.type === `PerimeterIsland` },
  get isIsland() { return this.type.includes(`Island`) },
  get isShape() { return this.type.includes(`Shape`) },
  get isShapeGroup() { return this.type.includes(`ShapeGroup`) },

  get deBugAnchor() {
    if (this.cellBounds?.selection) return this.cellBounds.selection[0].anchor
    else return this.anchor
  },

  //MARK: Debuggable Show Methods
  //METH: showDeBug() : null : show debug info
  showDeBug() {
    if (this.drawLabel) this.showLabel()
    if (this.drawDeBugRect) this.showRect()
    if (this.drawPerimeter) this.showPerimeter()
    if (this.drawInset) this.showInset()
    if (this.drawLoft) this.showLofts()
  },
  //METH: showLabel() : null : show debug label
  showLabel() {
    if (this.drawSVG) {
      if (!this.deBugLabelElt) this.deBugLabelElt = createSVGText(this.id, 0, 0)
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
        .style(`text-shadow`, `1px 1px 2px white`)
    }
  },
  //METH: showRect() : null : show svg backing/layout rect
  showRect() {
    if (this.drawSVG) {
      const radius = 2
      if (!this.deBugRectElt) this.deBugRectElt = createSVGElt('rect').id(`${this.id}-deBugRect`)
      // if (this.isShape) {

      // } else {
      // DeBug.warn(`${this.id} showRect called!`)
      // DeBug.log(`grid`, this.grid)
      // DeBug.log(`grid insetAnchor`, this.grid.insetAnchor)
      // DeBug.log(`grid insetScale`, this.grid.insetScale)
      // DeBug.log(`grid insetSize`, this.grid.insetSize)
      // if (this.type === `Cell`) {
      //   DeBug.log(`cell ${this.id} insetAnchor: `, this.insetAnchor)
      //   DeBug.log(`cell ${this.id} insetSize: `, this.insetSize)
      // }
      // DeBug.log(`showRect layout args`, this.insetAnchor.x, this.insetAnchor.y, this.insetSize.x, this.insetSize.y)
      this.deBugRectElt
        .parent(this.svgElt)
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', radius)
        .attribute('ry', radius)
      const
        randHue = ProtoColor.randomShadHue(),
        lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      this.deBugRectElt
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.0625`)
        .attribute('stroke-dasharray', `1 2`)
      // }
    }
  },
  //METH: showPerimeter() : null : show hard outline of perimeter shapes
  showPerimeter() {
    if (this.isPerimeterShape) {
      if (!this.deBugPerimeterElt) this.deBugPerimeterElt = createSVGElt('path')
      this.deBugPerimeterElt
        .parent(this.svgElt)
        .layout(this.anchor.x, this.anchor.y, this.size.x, this.size.y)
      const
        randHue = ProtoColor.randomShadHue(),
        lightHue = ProtoColor.randomHighHue()
      this.deBugPerimeterElt
        .attribute('d', this.perimeter)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', lightHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },
  // METH: showInset() : null : show curved inset path of shapes
  showInset() {
    if (this.isShape) {
      if (!this.deBugInsetPathElt) this.deBugInsetPathElt = createSVGElt('path')
      this.deBugInsetPathElt
        .parent(this.svgElt)
        .layout(this.anchor, this.size)

      const
        randHue = ProtoColor.randomShadHue(),
        lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 256)
      this.deBugInsetPathElt
        .attribute('d', this.svg)
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.25`)
        .attribute('stroke-dasharray', `1 1`)
    } else {
      if (!this.deBugInsetRectElt) this.deBugInsetRectElt = createSVGElt('rect')
      this.deBugInsetRectElt
        .parent(this.svgParent)
        .layout(this.insetAnchor, this.insetSize)
        .attribute('rx', 1)
        .attribute('ry', 1)
      const
        randHue = ProtoColor.randomShadHue(),
        lightHue = protoColor(randHue.red, randHue.green, randHue.blue, 8)
      this.deBugInsetRectElt
        .attribute('fill', protoColor(0, 0))
        .attribute('stroke', randHue)
        .attribute('stroke-width', `.125`)
        .attribute('stroke-dasharray', `4 1`)
    }
  },
  //METH: showLofts() : null : show curved loft paths of shapes
  showLofts() {
    DeBug.error(`DEBUG: showLofts`)

    const
      randHue = ProtoColor.randomShadHue(),
      lightHue = protoColor(randHue.red, randHue.green, randHue.blue)
    DeBug.groupCollapsed(this.id)
    if (this.isShapeGroup && this.cut?.profile) {
      this.debugStartElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-debugStart`)
      this.debugEndElt = createElementNS(SVG.xmlns, 'g').id(`${this.id}-debugEnd`)
      const debugElts = OpArray.format([
        this.debugStartElt,
        this.debugEndElt
      ])
      debugElts.forEach((elt, i) => {
        const lowHue = protoColor(randHue.red, randHue.green, randHue.blue, 10)

        elt
          .parent(this.svgElt)
          .attribute('fill', protoColor(0, 0))
          // .attribute('fill', i === 1 ? protoColor(1, 100) : protoColor(0, 0))
          // .attribute('fill', frameColor)
          .attribute('stroke-width', `.125`)
          .attribute('stroke-dasharray', `.5`)
          .attribute('stroke-linecap', `round`)
        // .blur(.1)
      })

      this.shapes.forEach(sh => {
        DeBug.log(`this.cut`, this.cut)
        DeBug.log(`cut start`, this.cut.start)
        DeBug.log(`cut depth`, this.cut.depth)
        DeBug.log(`cut insetScale`, sh.insetScale)
        const depthScale = vert(this.cut.depth / this.grid.cellRadius / 2)
        DeBug.log(`depthScale`, depthScale)
        let startScale, endScale, hasOutsetShade = this.cut.profile.hasOutsetShade
        if (hasOutsetShade) {
          DeBug.log(`hasOutsetShade`)
          // startScale = Vertex.add(sh.insetScale, depthScale)
          startScale = Vertex.add(sh.insetScale, depthScale)
          endScale = this.cut.start < 0 ? sh.insetScale : sh.insetScale
        } else {
          DeBug.log(`no outsetShade`)
          startScale = sh.insetScale
          endScale = Vertex.sub(sh.insetScale, depthScale)
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
            .parent(i === 0 ? this.debugStartElt : this.debugEndElt)
            .attribute(`stroke`, i = 0 ? lightHue : lightHue)
          // .attribute('fill', protoColor(1, 100))
          // .attribute('fill', i === 1 ? frameColor : protoColor(0, 0))
          // .attribute('fill', i === 1 ? `red` : protoColor(0, 0))
          // .blur(.1)
        })
      })


    }
    DeBug.groupEnd()
  },

  // METH: showSizeGrid() : null : show grid for sizing shapes
  showSizeGrid(x = 10, y = x) {
    // if (!this.drawSVG || !this.drawGrid) return

    // Create grid group if it doesn't exist
    if (!this.deBugGridElt) {
      this.deBugGridElt = createElementNS(SVG.xmlns, 'g')
        .id(`${this.id}-debugGrid`)
        .parent(this.svgElt)
    }

    const spacing = vert(x, y)
    if (!this.gridSpacing?.equals(spacing)) {
      this.gridSpacing = spacing
      this.deBugGridElt.innerHTML = '' // Clear existing grid

      const
        randHue = ProtoColor.randomShadHue(),
        lines = []

      // Vertical lines
      for (let x = 0; x <= 100; x += spacing.x) {
        lines.push(
          createSVGElt('line')
            .attribute('x1', x)
            .attribute('y1', 0)
            .attribute('x2', x)
            .attribute('y2', 200)
        )
      }

      // Horizontal lines
      for (let y = 0; y <= 200; y += spacing.y) {
        lines.push(
          createSVGElt('line')
            .attribute('x1', 0)
            .attribute('y1', y)
            .attribute('x2', 100)
            .attribute('y2', y)
        )
      }

      // Apply styles to all lines
      lines.forEach(line => {
        line
          .parent(this.deBugGridElt)
          .attribute('stroke', randHue)
          .attribute('stroke-width', '0.25')
          .attribute('stroke-dasharray', '8 1')
          .attribute('vector-effect', 'non-scaling-stroke')
      })
    }
  },

  // METH: showFrameRate()
  showFrameRate(animationController) {
    // Create display element once if it doesn't exist
    if (!Debuggable.frameRateDisplay) {
      Debuggable.frameRateDisplay = createDiv('')
        .id('frameRateDisplay')
        .style('position', 'fixed')
        .style('bottom', '10px')
        .style('right', '10px')
        .style('backgroundColor', 'rgba(0, 0, 0, 0.5)')
        .style('color', 'white')
        .style('padding', '5px')
        .style('fontFamily', 'monospace')
        .style('zIndex', '1000')
        .parent(document.body)

      // Update content every second instead of every frame
      setInterval(() => {
        const
          fps = animationController.frameRate,
          offsetEltsCount = S.offsetElts.length
        Debuggable.frameRateDisplay.html(`FPS: ${fps} | Offset Elements: ${offsetEltsCount}`)
      }, 1000)
    }
  }

}

//MARK: DeBug Class
//CLASS: replace calls to DeBug methods with these in order to have global control over logging
class DeBug {
  static enableLogging = true // Set to false to disable all logging

  static getCallerInfo() {
    const
      error = new Error(),
      stack = error.stack.split('\n'),
      // Adjust the index based on the stack trace format
      callerLine = stack[3] || stack[2],
      match = callerLine.match(/at (.+):(\d+):(\d+)/)
    if (match) {
      const
        filePath = match[1],
        fileName = filePath.split('/').pop() // Extract file name
      return `${fileName}:${match[2]}`
    }
    return 'unknown'
  }

  static log(...args) {
    if (this.enableLogging) {
      const callerInfo = this.getCallerInfo()
      console.log(`[${callerInfo}]`, ...args)
    }
  }

  static error(...args) {
    if (this.enableLogging) {
      const callerInfo = this.getCallerInfo()
      console.error(`[${callerInfo}]`, ...args)
    }
  }

  static warn(...args) {
    if (this.enableLogging) {
      const callerInfo = this.getCallerInfo()
      console.warn(`[${callerInfo}]`, ...args)
    }
  }

  static group(...args) {
    if (this.enableLogging) {
      const callerInfo = this.getCallerInfo()
      console.group(`[${callerInfo}]`, ...args)
    }
  }

  static groupCollapsed(...args) {
    if (this.enableLogging) {
      const callerInfo = this.getCallerInfo()
      console.groupCollapsed(`[${callerInfo}]`, ...args)
    }
  }

  static groupEnd() {
    if (this.enableLogging) {
      console.groupEnd()
    }
  }
}
