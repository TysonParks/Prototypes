// CLASS: FilterDebugHarness
// Runtime-only filter experimentation hooks.
// Use this from the console to patch rendering behavior without adding debug
// branches to operational files.

class FilterDebugHarness {
  static originals = {}
  static state = {
    filterRegionMode: null,
    cutBoundsMode: null,
    cutOverflow: null,
    gridBoundsMode: null,
    frameGroupStretchMode: null,
    frameFilterVisibility: null,
    frameMaskEnabled: null,
  }

  static install({
    filterRegionMode = null,
    cutBoundsMode = null,
    cutOverflow = null,
    gridBoundsMode = null,
    frameGroupStretchMode = null,
    frameFilterVisibility = null,
    frameMaskEnabled = null,
  } = {}) {
    this.uninstall()

    this.state = {
      filterRegionMode,
      cutBoundsMode,
      cutOverflow,
      gridBoundsMode,
      frameGroupStretchMode,
      frameFilterVisibility: frameFilterVisibility
        ? {
          combo: frameFilterVisibility.combo ?? true,
          high: frameFilterVisibility.high ?? true,
          shad: frameFilterVisibility.shad ?? true,
        }
        : null,
      frameMaskEnabled,
    }

    if (filterRegionMode) this.patchSetLayouts()
    if (cutBoundsMode) this.patchBoundsRect()
    if (cutOverflow) this.patchAssignElement()
    if (gridBoundsMode) this.patchGridBounds()
    if (frameGroupStretchMode) this.patchSetBackGridGroup()
    if (this.state.frameFilterVisibility) {
      this.patchCreateSVGGroup()
      this.patchApplyFilterToElement()
    }
    if (frameMaskEnabled !== null) this.patchMaskFrame()

    return this.state
  }

  static rebuild(options = {}) {
    const state = this.install(options)
    if (protoBatch?.rebuild) protoBatch.rebuild()
    return state
  }

  static uninstall({ rebuild = false } = {}) {
    if (this.originals.setLayouts) ProtoCut.prototype.setLayouts = this.originals.setLayouts
    if (this.originals.boundsRect) Object.defineProperty(ShapeGroup.prototype, 'boundsRect', this.originals.boundsRect)
    if (this.originals.assignElement) ShapeGroup.prototype.assignElement = this.originals.assignElement
    if (this.originals.gridAnchor) Object.defineProperty(Grid.prototype, 'anchor', this.originals.gridAnchor)
    if (this.originals.gridSize) Object.defineProperty(Grid.prototype, 'size', this.originals.gridSize)
    if (this.originals.gridBoundsRect) Object.defineProperty(Grid.prototype, 'boundsRect', this.originals.gridBoundsRect)
    if (this.originals.setBackGridGroup) Frame.prototype.setBackGridGroup = this.originals.setBackGridGroup
    if (this.originals.createSVGGroup) ShapeGroup.prototype.createSVGGroup = this.originals.createSVGGroup
    if (this.originals.applyFilterToElement) ProtoFilter.prototype.applyFilterToElement = this.originals.applyFilterToElement
    if (this.originals.maskFrame) Frame.prototype.maskFrame = this.originals.maskFrame

    this.state = {
      filterRegionMode: null,
      cutBoundsMode: null,
      cutOverflow: null,
      gridBoundsMode: null,
      frameGroupStretchMode: null,
      frameFilterVisibility: null,
      frameMaskEnabled: null,
    }

    if (rebuild && protoBatch?.rebuild) protoBatch.rebuild()
  }

  static patchSetLayouts() {
    if (!this.originals.setLayouts) this.originals.setLayouts = ProtoCut.prototype.setLayouts

    ProtoCut.prototype.setLayouts = function () {
      const mode = FilterDebugHarness.state.filterRegionMode
      if (mode === 'userSpace') {
        this.filters.forEach(f => {
          f.filter
            .attribute('filterUnits', 'userSpaceOnUse')
            .attribute('x', FRAME.anchor.x)
            .attribute('y', FRAME.anchor.y)
            .attribute('width', FRAME.size.x)
            .attribute('height', FRAME.size.y)
        })
        return
      }

      if (mode) {
        const layout = this.maxLayout
        this.filters.forEach(f => {
          f.filter.elt.removeAttribute('filterUnits')
          f.filter
            .attribute('x', `${layout.x}%`)
            .attribute('y', `${layout.y}%`)
            .attribute('width', `${layout.width}%`)
            .attribute('height', `${layout.height}%`)
        })
        return
      }

      return FilterDebugHarness.originals.setLayouts.call(this)
    }
  }

  static patchBoundsRect() {
    if (!this.originals.boundsRect) {
      this.originals.boundsRect = Object.getOwnPropertyDescriptor(ShapeGroup.prototype, 'boundsRect')
    }

    Object.defineProperty(ShapeGroup.prototype, 'boundsRect', {
      configurable: true,
      get() {
        const mode = FilterDebugHarness.state.cutBoundsMode
        if (mode === 'cellBounds') {
          return this.isFrame ? FRAME.boundsRect : this.cellBounds.boundsRect
        }
        if (mode === 'frameBounds') {
          if (this.isFrame || this.cut) return FRAME.boundsRect
          return this.cellBounds.boundsRect
        }
        return FilterDebugHarness.originals.boundsRect.get.call(this)
      },
    })
  }

  static patchAssignElement() {
    if (!this.originals.assignElement) this.originals.assignElement = ShapeGroup.prototype.assignElement

    ShapeGroup.prototype.assignElement = function () {
      FilterDebugHarness.originals.assignElement.call(this)
      if (this.cut) this.svgElt.attribute('overflow', FilterDebugHarness.state.cutOverflow)
    }
  }

  static patchGridBounds() {
    if (!this.originals.gridAnchor) {
      this.originals.gridAnchor = Object.getOwnPropertyDescriptor(Grid.prototype, 'anchor')
    }
    if (!this.originals.gridSize) {
      this.originals.gridSize = Object.getOwnPropertyDescriptor(Grid.prototype, 'size')
    }
    if (!this.originals.gridBoundsRect) {
      this.originals.gridBoundsRect = Object.getOwnPropertyDescriptor(Grid.prototype, 'boundsRect')
    }

    Object.defineProperty(Grid.prototype, 'boundsRect', {
      configurable: true,
      get() {
        const mode = FilterDebugHarness.state.gridBoundsMode
        const frameRect = FRAME?.boundsRect
        if (!frameRect) return FilterDebugHarness.originals.gridBoundsRect.get.call(this)

        const targetAspect = this.gridAspect
        const fitInsideFrame = () => {
          const frameAspect = frameRect.height / frameRect.width
          let width
          let height
          let x
          let y

          if (targetAspect >= frameAspect) {
            height = frameRect.height
            width = height / targetAspect
            x = frameRect.x + (frameRect.width - width) / 2
            y = frameRect.y
          } else {
            width = frameRect.width
            height = width * targetAspect
            x = frameRect.x
            y = frameRect.y + (frameRect.height - height) / 2
          }

          return DOMRect.fromRect({ x, y, width, height })
        }

        if (mode === 'magicalFitFrame' && this.gridStyle === `Magical`) {
          return fitInsideFrame()
        }

        if (mode === 'forceFullFrameHeight') {
          const height = frameRect.height
          const width = height / targetAspect
          const x = frameRect.x + (frameRect.width - width) / 2
          const y = frameRect.y
          return DOMRect.fromRect({ x, y, width, height })
        }

        return FilterDebugHarness.originals.gridBoundsRect.get.call(this)
      },
    })

    Object.defineProperty(Grid.prototype, 'anchor', {
      configurable: true,
      get() {
        const mode = FilterDebugHarness.state.gridBoundsMode
        if ((mode === 'magicalFitFrame' && this.gridStyle === `Magical`) || mode === 'forceFullFrameHeight') {
          const boundsRect = this.boundsRect
          return vert(boundsRect.x, boundsRect.y)
        }

        return FilterDebugHarness.originals.gridAnchor.get.call(this)
      },
    })

    Object.defineProperty(Grid.prototype, 'size', {
      configurable: true,
      get() {
        const mode = FilterDebugHarness.state.gridBoundsMode
        if ((mode === 'magicalFitFrame' && this.gridStyle === `Magical`) || mode === 'forceFullFrameHeight') {
          const boundsRect = this.boundsRect
          return vert(boundsRect.width, boundsRect.height)
        }

        return FilterDebugHarness.originals.gridSize.get.call(this)
      },
    })
  }

  static patchSetBackGridGroup() {
    if (!this.originals.setBackGridGroup) this.originals.setBackGridGroup = Frame.prototype.setBackGridGroup

    Frame.prototype.setBackGridGroup = function (...args) {
      const result = FilterDebugHarness.originals.setBackGridGroup.apply(this, args)
      const mode = FilterDebugHarness.state.frameGroupStretchMode
      if (mode === 'fillFrameHeightFromBacking') {
        const groups = this.backGroup?.shapeGroups || []
        const backingGroup = groups[0]?.svgGroupElt?.elt
        if (!backingGroup?.getBBox) return result

        const bbox = backingGroup.getBBox()
        if (!bbox.height) return result

        const scaleY = this.size.y / bbox.height
        const translateY = this.anchor.y - (scaleY * bbox.y)
        const transform = `matrix(1 0 0 ${scaleY} 0 ${translateY})`

        groups.forEach(group => {
          group?.svgGroupElt?.attribute(`transform`, transform)
        })
      }

      return result
    }
  }

  static patchCreateSVGGroup() {
    if (!this.originals.createSVGGroup) this.originals.createSVGGroup = ShapeGroup.prototype.createSVGGroup

    ShapeGroup.prototype.createSVGGroup = function () {
      FilterDebugHarness.originals.createSVGGroup.call(this)
      this.svgGroupElt.protoParent = this
    }
  }

  static patchApplyFilterToElement() {
    if (!this.originals.applyFilterToElement) {
      this.originals.applyFilterToElement = ProtoFilter.prototype.applyFilterToElement
    }

    ProtoFilter.prototype.applyFilterToElement = function (element, time = 0) {
      const visibility = FilterDebugHarness.state.frameFilterVisibility
      const parentShapeGroup = element.protoParent
      const hostParent = parentShapeGroup?.svgElt || element.elt.ownerSVGElement
      const disabled = visibility
        && parentShapeGroup?.isFrame
        && visibility[this.type] === false

      if (disabled) {
        const currentParent = element.p5Parent
        if (currentParent && currentParent !== hostParent) {
          element.parent(hostParent)
          if (currentParent.childElementCount === 0) currentParent.remove()
        }
        return this
      }

      return FilterDebugHarness.originals.applyFilterToElement.call(this, element, time)
    }
  }

  static patchMaskFrame() {
    if (!this.originals.maskFrame) this.originals.maskFrame = Frame.prototype.maskFrame

    Frame.prototype.maskFrame = function () {
      const enabled = FilterDebugHarness.state.frameMaskEnabled
      if (enabled === false) {
        this.svgElt?.elt?.removeAttribute('mask')
        return
      }

      return FilterDebugHarness.originals.maskFrame.call(this)
    }
  }

  static usePercentFilterRegion(rebuild = true) {
    return rebuild
      ? this.rebuild({ filterRegionMode: 'percent' })
      : this.install({ filterRegionMode: 'percent' })
  }

  static useUserSpaceFilterRegion(rebuild = true) {
    return rebuild
      ? this.rebuild({ filterRegionMode: 'userSpace' })
      : this.install({ filterRegionMode: 'userSpace' })
  }

  static useMagicalFitFrameGridBounds(rebuild = true) {
    return rebuild
      ? this.rebuild({ gridBoundsMode: 'magicalFitFrame' })
      : this.install({ gridBoundsMode: 'magicalFitFrame' })
  }

  static useFullFrameHeightGridBounds(rebuild = true) {
    return rebuild
      ? this.rebuild({ gridBoundsMode: 'forceFullFrameHeight' })
      : this.install({ gridBoundsMode: 'forceFullFrameHeight' })
  }

  static stretchFrameGroupsToFullHeight(rebuild = true) {
    return rebuild
      ? this.rebuild({ frameGroupStretchMode: 'fillFrameHeightFromBacking' })
      : this.install({ frameGroupStretchMode: 'fillFrameHeightFromBacking' })
  }

  static setFrameFilterVisibility({ combo = true, high = true, shad = true } = {}, rebuild = true) {
    return rebuild
      ? this.rebuild({ frameFilterVisibility: { combo, high, shad } })
      : this.install({ frameFilterVisibility: { combo, high, shad } })
  }

  static setFrameMaskEnabled(enabled = true, rebuild = true) {
    return rebuild
      ? this.rebuild({ frameMaskEnabled: enabled })
      : this.install({ frameMaskEnabled: enabled })
  }
}

window.FilterDebugHarness = FilterDebugHarness
window.FDH = FilterDebugHarness