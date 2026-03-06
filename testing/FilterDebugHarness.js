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
    frameFilterVisibility: null,
  }

  static install({
    filterRegionMode = null,
    cutBoundsMode = null,
    cutOverflow = null,
    frameFilterVisibility = null,
  } = {}) {
    this.uninstall()

    this.state = {
      filterRegionMode,
      cutBoundsMode,
      cutOverflow,
      frameFilterVisibility: frameFilterVisibility
        ? {
          combo: frameFilterVisibility.combo ?? true,
          high: frameFilterVisibility.high ?? true,
          shad: frameFilterVisibility.shad ?? true,
        }
        : null,
    }

    if (filterRegionMode) this.patchSetLayouts()
    if (cutBoundsMode) this.patchBoundsRect()
    if (cutOverflow) this.patchAssignElement()
    if (this.state.frameFilterVisibility) {
      this.patchCreateSVGGroup()
      this.patchApplyFilterToElement()
    }

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
    if (this.originals.createSVGGroup) ShapeGroup.prototype.createSVGGroup = this.originals.createSVGGroup
    if (this.originals.applyFilterToElement) ProtoFilter.prototype.applyFilterToElement = this.originals.applyFilterToElement

    this.state = {
      filterRegionMode: null,
      cutBoundsMode: null,
      cutOverflow: null,
      frameFilterVisibility: null,
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

  static setFrameFilterVisibility({ combo = true, high = true, shad = true } = {}, rebuild = true) {
    return rebuild
      ? this.rebuild({ frameFilterVisibility: { combo, high, shad } })
      : this.install({ frameFilterVisibility: { combo, high, shad } })
  }
}

window.FilterDebugHarness = FilterDebugHarness
window.FDH = FilterDebugHarness