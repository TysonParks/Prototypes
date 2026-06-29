//ENUM: Profile : Cut Profile Descriptor
// SIZE: 72 lines
class Profile {
  breed
  type
  cutIn

  constructor(type, cutIn = true) {
    this.type = type
    this.cutIn = cutIn
    this.breed = this.description
  }

  //MARK: Static 
  static breed(breed) {
    const
      type = breed[0],
      cutIn = breed.slice(1) === 'In'
    return new Profile(type, cutIn)
  }

  static iIn = new Profile(`i`)
  static iOut = new Profile(`i`, false)
  static jIn = new Profile(`j`)
  static jOut = new Profile(`j`, false)
  static rIn = new Profile(`r`)
  static rOut = new Profile(`r`, false)

  static AllTypes = [`i`, `j`, `r`]
  static CurveTypes = [`j`, `r`]
  static FlatTypes = [`i`]

  static CurveOptions = [Profile.jIn, Profile.jOut, Profile.rIn, Profile.rOut]


  //MARK: Computed
  get isI() { return this.type === `i` }                    // is `i` type
  get isJ() { return this.type === `j` }                    // is `j` type
  get isR() { return this.type === `r` }                    // is `r` type

  get isIIn() { return this.isI && this.isCutIn }
  get isIOut() { return this.isI && this.isCutOut }
  get isJIn() { return this.isJ && this.isCutIn }
  get isJOut() { return this.isJ && this.isCutOut }
  get isRIn() { return this.isR && this.isCutIn }
  get isROut() { return this.isR && this.isCutOut }

  get isCutIn() { return this.cutIn }
  get isCutOut() { return !this.cutIn }

  get hasInsetShade() { return this.isIIn || this.isJIn || this.isROut }
  get hasOutsetShade() { return this.isIOut || this.isJOut || this.isRIn }
  get hasCastShadow() { return this.isIOut || this.isROut }

  get isCurve() { return this.CurveTypes.includes(this.type) } // is in CurveTypes
  get isFlat() { return this.FlatTypes.includes(this.type) }   // is in FlatTypes
  get isSingleDepth() {                                        // only requires single filter / offsets in single direction
    return this.isI || this.isJ
  }
  get isInset() { return this.isRType ? !this.cutIn : this.cutIn }       // filter insets from shape border (use cutRange.start)

  get wave() { return new Profile(this.type === `r` ? `j` : `r`, !this.cutIn) }
  get channel() { return new Profile(this.type, !this.cutIn) }
  get cyma() { return new Profile(this.type === `r` ? `j` : `r`, this.cutIn) }

  get insetDepth() {
    if (this.isR) return this.cutIn ? .35 : 0.45
    else return 1
  }
  get outsetDepth() {
    if (isSingleDepth) return 0
    else return 1
  }
  get description() {
    const inOut = this.cutIn ? `In` : `Out`
    return this.type + inOut
  }
  //METH: equals()
  equals(profile) {
    return this.type === profile.type
      && this.cutIn === profile.cutIn
  }
}

//MARK: PROTOCUT CLASS
// SIZE: 157 lines
class ProtoCut {
  id
  breed
  profile           // Profile: cut profile [i, j, r]
  depth             // (end) depth
  start
  extHighDepth      // limiter on external highlight depth
  useExtHighDepth
  angleOffset = 0   // offset angle from global vector
  shapeGroups = new OpArray
  filters = new OpArray

  static shadeFilterRegion = {
    fixedMargin: 0,
    comboDepthMarginRatio: 0.25,
  }

  constructor({
    profile,
    depth,
    start,
    extHighDepth,
    useExtHighDepth = true,
    angleOffset = 0,
  }) {
    this.profile = profile
    this.depth = depth
    this.start = start
    this.extHighDepth = extHighDepth
    this.useExtHighDepth = useExtHighDepth
    this.angleOffset = angleOffset
    this.breed = this.description
    const match = S.Cuts.find(item => item.breed === this.breed)  // use equivalent cut if already exists
    if (match) {
      DeBug.warn(`USING EXISTING CUT!!`, match)
      return match
    }
    this.storeObject(S.Cuts, true)
    this.#createFilters()
  }

  //MARK: Computed
  get spread() { return this.profile.isSingleDepth ? this.depth : this.depth + this.depth2 }
  get padding() { return vert(this.depth * 2) }
  get description() {
    const
      prime = this.profile.breed,
      dep = roundToDec(this.depth / GRID.cellRadius, 4)
    return `${prime}-${dep}xCellRadius`
  }

  //MARK: Public Methods
  //METH: setLayouts() : null : configure shared shade-filter regions
  //
  // SAFARI / WEBKIT FIX (Apr 28 2026, B1 Issue 2):
  // Root cause — Previous implementation set filterUnits='userSpaceOnUse'
  // but emitted x/y/width/height as PERCENT strings. With userSpaceOnUse,
  // percentages resolve against the consuming SVG viewport (each
  // ShapeGroup's nested <svg>). For deep-cut ShapeGroups with small
  // viewports (~13.6×44.3 user units), the resulting filter region was
  // smaller than the deep-cut blurred + offset shadow extent. Chrome
  // silently auto-extends; Safari does not — affected groups vanished.
  //
  // Region strategy — TWO HARD CONSTRAINTS:
  //
  //   1. Region MUST extend PAST FRAME edges (not coincident with them).
  //      Clamping to exactly FRAME (0,0,100,200) reproduces the §9.14.6 /
  //      §9.14.7 frame-coordinate banding regression — the rasterizer
  //      produces visible top/bottom seams when the filter region edge
  //      coincides with the mask edge. A fixed margin of ~50 user units
  //      breaks that coincidence and eliminates banding.
  //
  //   2. Region MUST stay BOUNDED. Letting padding grow with depth (as
  //      in v1's `max(50, depth*5)`) produces filter regions large enough
  //      to trip Safari's filter raster memory ceiling for the deepest
  //      cuts, causing the same disappear-in-Safari bug we are fixing.
  //      A fixed 50-unit margin past FRAME is enough for the §9.14.7
  //      seam fix and small enough that Safari does not abort.
  //
  // Current test region (absolute user units, userSpaceOnUse):
  //   fixed margin = 0 user units for high/shad filters.
  //   combo-only depth margin = max(0, cut depth * 0.25).
  // Previous correctness fallback:
  //   x = -50, y = -50, width = 200, height = 300
  //   = FRAME expanded by 50 on every side.
  // Anything outside (0,0,100,200) is mask-cropped at final composite.
  // This is intentionally overbroad for small ShapeGroups; it is a bounded
  // correctness workaround, not a precise or intrinsically cheap region.
  //
  // Future precision opportunity (§9.15.3 Tier 1b, ATTEMPTED 2026-04-28
  // and BLOCKED — see KNOWN-ISSUES § 9.15.6): the union of
  // `this.shapeGroups[*].boundsRect` collapses to FRAME for every cut
  // because § 9.14.1 cascade broadening makes ShapeGroup.boundsRect
  // return FRAME for any cut/cascade group. Tier 1b cannot deliver
  // savings until that broadening is unwound (post §9.11 rebuild).
  //
  // Revert flag: window.SAFARI_FILTER_REGION_USERSPACE_FIX = false (reload; no-op — legacy path archived).
  setLayouts() {
    if (typeof window !== 'undefined' &&
      window.SAFARI_FILTER_REGION_USERSPACE_FIX === false) return

    const fb = FRAME.boundsRect
    this.filters.forEach(f => {
      const margin = ProtoCut.shadeFilterRegionMarginFor(this, f)
      const x = fb.x - margin
      const y = fb.y - margin
      const width = fb.width + margin * 2
      const height = fb.height + margin * 2
      f.filter
        .attribute('filterUnits', 'userSpaceOnUse')
        .attribute('x', x)
        .attribute('y', y)
        .attribute('width', width)
        .attribute('height', height)
    })
  }

  static shadeFilterRegionMarginFor(cut, filter) {
    const { fixedMargin, comboDepthMarginRatio } = ProtoCut.shadeFilterRegion
    const comboDepthScaled = Math.max(fixedMargin, Math.abs(cut.depth) * comboDepthMarginRatio)

    // return comboDepthScaled
    // return fixedMargin
    return filter.type === 'combo' ? comboDepthScaled : fixedMargin
  }

  //MARK: Private Methods

  //METH: createFilters() : null : create filters for each cut type
  #createFilters() {
    // if (abs(this.depth) < 0.25 / FRAME.pixToUserUnits) { return }     // don't create filters for 1/4 pixel depth or less
    const inset = this.profile.hasInsetShade
    if (this.profile.isSingleDepth) {
      if (this.profile.isI) {
        if (inset) {
          this.#createShader(`high`)
        } else {
          this.#createShader(`high`)
        }

        this.#createShader(`shad`)
      } else {
        this.#createShader(`combo`)
      }
    }

    if (this.profile.isR) {
      if (inset) {
        this.#createShader(`combo`, `r`, this.depth)
        if (this.useExtHighDepth) {
          this.#createShader(`high`, `r2`, this.extHighDepth)
        } else {
          this.#createShader(`high`, `r2`, -this.depth)
        }
        this.#createShader(`shad`, `r2`, -this.depth)
      } else {
        this.#createShader(`combo`, `r`, this.depth)
        this.#createShader(`high`, `r2`, this.extHighDepth)
        this.#createShader(`shad`, `r2`, -this.depth)
        // this.#createShader(`combo`, `r2`, -this.depth)
      }
    }

  }
  //METH: createShader() : null : create shader for each cut type
  #createShader(shadeType, curve = this.profile.type, mag = this.depth) {
    const
      cutIn = this.profile.cutIn ? 1 : -1,
      r = curve === `r` ? -1 : 1,
      r2 = curve === `r2` ? 1 : -1,
      angle = curve === `r` ? this.angleOffset + 180 : this.angleOffset
    mag = mag * cutIn * r * r2
    DeBug.warn({ curve: curve, cut: this.profile.cutIn ? `in` : `out`, shadeType, mag: mag / FRAME.pixToUserUnits, rotOffset: angle })
    const stack = Shade.neuShadeSVGFactory({
      shadeType: shadeType,
      curve: curve,
      cutIn: this.profile.cutIn,
      mag: mag,
      rotOffset: angle
    })
    DeBug.error(`stack`, stack)

    const filter = createFilter().shade(stack, shadeType)
    this.filters.push(filter)
  }
  //METH: equals() : boolean : compare two cuts
  equals(cut) { return this.breed === cut.breed }
}
Object.assign(ProtoCut.prototype, IdentifiableStored)


// CLASS: Shade
// SIZE: 425 lines
class Shade {
  //METH: shadVect( ): null : create vector from Angle + Offset
  static shadVect(angle = globalControls.shadAngle) { return createVector(1, 0).rotate(radians(angle)) }
  //METH: cleanRotate() : p5.Vector : rotate in degrees, roundToDec for cleaner filter dx/dy
  static cleanRotate(v, deg, decimal = 5) {
    const initial = v.copy().rotate(radians(deg))
    const x = roundToDec(initial.x, decimal)
    const y = roundToDec(initial.y, decimal)
    const z = roundToDec(initial.z, decimal)
    return new p5.Vector(x, y, z)
  }

  //METH: dropShadeSVG() : dropShade Object : create drop shade object for SVG
  static dropShadeSVG({ lighten = true, invert = false, vector, mag, blurRad = 0, col = frameColor, inset = false } = {}) {
    return { lighten: lighten, invert: invert, vector: vector, mag: mag, blur: blurRad, color: col, inset: inset }
  }
  //METH: neuShadeSVG() : [dropShade] : create dropShade objects for SVG
  static neuShadeSVG(shadeType, vector = this.shadVect(), mag, highBlurRad, shadBlurRad, highCol, shadCol, inset = false, blur = true, curve = 'j', highOffsetRatio = 1, blurRatio = 1) {

    const
      invert = curve === `r`,
      iCutHighMagMult = curve === `i` ? .75 : 1,
      r2CutHighMagMult = curve === `r2` ? .5 : 1,
      jCutMagMult = curve === `j` ? .75 : 1,
      highMag = iCutHighMagMult * r2CutHighMagMult * jCutMagMult * highOffsetRatio * mag

    let highlight, shadow
    if (shadeType !== `shad`) {
      highlight = this.dropShadeSVG({
        invert: invert,
        vector: vector,
        mag: highMag,
        blurRad: (blur ? 1 : 0) * (curve === `i` ? 4 : 1) * (curve === `r2` ? 2 : 1) * jCutMagMult * highBlurRad * blurRatio,
        col: highCol,
        inset: inset
      })
    }

    if (shadeType !== `high`) {
      const r2CutMagMult = curve === `r2` ? .5 : 1
      // const shadowCol = shadeType === `shad` ? achromic(0.9) : shadCol
      const shadowCol = shadeType === `shad` ? achromic(0.5) : shadCol
      shadow = this.dropShadeSVG({
        lighten: false,
        invert: invert,
        vector: vector,
        mag: jCutMagMult * r2CutMagMult * mag,
        blurRad: (blur ? 1 : 0) * jCutMagMult * r2CutMagMult * shadBlurRad * blurRatio,
        col: shadowCol,
        inset: inset
      })
    }
    return OpArray.format([shadow, highlight]).compacted
  }
  //METH: neuShadeSVGFactory() : [dropShade] : create dropShade objects for SVG
  static neuShadeSVGFactory({
    curve = 'j',                            // type of cut/curve : [i, j, r, r2, f, v]
    cutIn,
    shadeType,
    mag,                                    // magnitude of shade offset, corresponds to depth/loft of shade effect
    vector = Shade.shadVect(),               // direction of light
    rotOffset = 0,                          // deg rotation offset, used for dif shade types and CHAOS
    pixToUserUnits = FRAME.pixToUserUnits,  // CONSTANT used to convert mag (given in userUnits) to pixel units
    start = 0,                              // determine start of layers kept, always 0
    blur = true,                            // apply blur to shades, always true
    type = 'multiShade',                    // always use 'multishade' : ['multiShade', 'multiAlpha', 'flat']
    sort = false,                           // end sorts all highlights over shadows (or opposite), always false
  } = {}) {
    vector = Shade.cleanRotate(vector, 0)
    if (!mag) { mag = vector.mag() }
    const inset = mag > 0 ? false : true    // inset in this case means the effect is masked to inside the shape
    mag = 2 * abs(mag) //mag remains pos+ as light direction holds to vector, only change is where shade falls (inside/outside)

    DeBug.log(``)
    DeBug.groupCollapsed(`neuShadeSVGFactory`, vector)
    DeBug.log(`mag`, mag)

    //MARK: "J" and "R" Cuts

    //ARROW: keep() : [number] : Optimization to reduce neuShades stack size based upon mag using Shadow Layer Decay chart
    const keep = () => {
      const root = sqrt(mag)
      if (root >= 88) return 14               // mag >= 7744
      if (root >= 62) return 13               // mag >= 3844
      if (root >= 44) return 12               // mag >= 1936
      if (root >= 31) return 11               // mag >= 961
      if (root >= 22) return 10               // mag >= 484
      if (root >= 16) return 9 + 1            // mag >= 256
      if (root >= 11) return 8 + 1            // mag >= 121
      if (root >= 8) return 7 + 1             // mag >= 64
      if (root >= 6) return 6 + 1             // mag >= 36
      if (root >= 3) return floor(root) + 1   // mag >= 9
      return 4
    }

    //ARROW: rounding(): [number] : preserve precision of lower offsets, reduce duplicates for larger offsets
    const rounding = (e) => {
      if (e < 4) return roundToDec(e, 4)  // preserve 4 decimals for small shade depths (smooth animation)
      else return roundToDec(e, 2)        // preserve 2 decimals for larger depths (smooth animation)
    }

    //ARROW: createOffsets() : [OpArray] : create offsets for shade layers
    const createOffsets = () => {
      let current = mag,
        array = OpArray.from([mag * .75])
      array = OpArray.from([current, mag * .75])
      while (current > 1) {
        current = max(.5, floor(current / 2))
        array.push(current)
      }
      // array = array.numSorted.reversed
      DeBug.warn(`full array`, array)
      let mod = floor(array.length / 2)
      // if (array.length > 4) array = OpArray.from([...array.slice(0, mod), mod, 1]) // reduce layers to 4, keeping first and last 3 layers

      if (array.length > 4) {
        array = OpArray.from([...array.slice(0, mod), mod]) // reduce layers to 4, keeping first and last 3 layers
        if (curve === 'j') array.push(1)
      }

      DeBug.warn(`reduced array`, array)
      return array
    }
    let offsets
    offsets = OpArray.from([    // offsets for shade layers
      1,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag,          // these first 3
      mag / 2,      // these first 3
      2,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag * 3 / 4,  //
      4,            // these fixed magnitudes insure edge remains crisp and poppy at higher resolutions
      mag / 4,      //
      mag / 8,      //
      mag / 16,     //
      mag / 32,     //
      mag / 64,     //
      mag / 128,    //
      mag / 256,    //
      mag / 512,    //
    ])
      .slice(start, keep())       // reduce layers based upon start and keep()
    // offsets = createOffsets()

    DeBug.error('offsets', offsets)
    offsets = offsets
      .map(e => rounding(e))      // round offsets
      .filter(e => e > 0)         // remove negatives (shouldn't be necessary!)
      .numSorted                  // sort small-large
      .filter((e, i, a) => i === 0 || !equalsRoundedDec(e, a[i - 1], 0))  // deduplicate within tolerance of 1

    DeBug.error('offsets filter-sort', offsets)
    let neuShades
    //NOTE: "multiShade" is the only/final choice for j-cuts 
    if (type === 'multiShade') {
      const offsetRange = range(offsets[0], offsets.last)   // range from offsets

      //ARROW: easeInCircNormalized : number : normalizes and shifts value using circular easing
      const easeInCircNormalized = (x, exp = 2) => 1 - sqrt(1 - pow(offsetRange.normalize(x), exp))
      const easeOutCircNormalized = (x, exp = 2) => sqrt(1 - pow(offsetRange.normalize(x), exp))
      const easeInExpoNormalized = (x, exp = 2) => x === 0 ? 0 : pow(2, 10 * offsetRange.normalize(x) - 10)
      const easeInOutCircNormalized = (x, exp = 2) => {
        x = offsetRange.normalize(x)
        return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, exp))) / 2
          : (sqrt(1 - pow(-2 * x + 2, exp)) + 1) / 2
      }

      // frameColor = achromic(0.9)
      const shadColSpread = 0.25

      //MARK: "I" and "R2" Cast Shadows
      if (curve === 'i' || curve === 'r2') {
        const
          highColSpread = 0.04,                             // spread up from base (0.9) to max highlight luma (1!)
          //  shadColSpread = curve === 'r2' ? 0.25 : .25,  // spread down from base (0.9) to min shadow luma (0.7)
          maxHighlight = 0.9 + highColSpread,               // 0.9 + 0.04 = 0.94
          minShadow = (0.9 - shadColSpread),                // 0.9 - 0.25 = 0.65
          perceptualDivisor = curve === 'i' ? 4 : 16,       // compensates for blur, etc to get visually correct result
          highOffsetRatio = curve === 'i' ? 1 : 1 / 16

        // blur = true
        neuShades = offsets
          .map((offset, i) => {
            mag = offset * .2               // convert pixelUnit to userUnit magnitude
            // mag = offset / pixToUserUnits * 1               // convert pixelUnit to userUnit magnitude
            mag = curve === 'i' ? mag * 1 : mag * 1.2
            const
              iBlurRadius = mag * 1 / 6,  //
              r2BlurRadius = mag * 1 / 6,  //
              // iBlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6,  //
              // r2BlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6,  //
              blurRadius = curve === 'i' ? iBlurRadius : r2BlurRadius,
              highColLuma = maxHighlight - (highColSpread * easeInCircNormalized(offset, 2) / perceptualDivisor),
              shadColLuma1 = minShadow + (shadColSpread * easeInOutCircNormalized(offset, 3) / perceptualDivisor),
              shadColLuma2 = minShadow + (4 * shadColSpread * easeOutCircNormalized(offset, 2) / perceptualDivisor),

              highCol = achromic(highColLuma),
              shadCol1 = achromic(shadColLuma1)

            let shades = new OpArray
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            const shadeVector = Shade.cleanRotate(vector, rotOffset).setMag(mag)

            // DeBug.log(`angleMode`, _angleMode)
            // DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)
            // DeBug.log(`rotOffset`, rotOffset)

            const shades1 = this.neuShadeSVG(shadeType, shadeVector, mag, blurRadius, blurRadius, highCol, shadCol1, inset, blur, curve, highOffsetRatio)
            shades.push(shades1)

            DeBug.log(`${curve} shades`, shades)
            return shades.flat()
          }).flat()
      }

      //MARK: "j" and "r" Cuts
      if (curve === 'j' || curve === 'r') {
        let reflLightRange
        // rotOffset = rotOffset + PI
        const rangeSize = mag                             // shadow range
        //FIXME: reflLightRange set back to 2.2!
        reflLightRange = rangeSize / 2.2                 // visual observation shows relfLight to be about 1/5 the shadow
        // DeBug.log(`reflLightRange`, reflLightRange)
        if (!offsets.includes(reflLightRange)) {          // if necessary, add extra shade layer at reflLightRange
          offsets.push(reflLightRange)
          offsets = offsets.numSorted
        }

        const
          highColSpread = 0.1,                            // spread up from base (0.9) to max highlight luma (1!)
          // shadColSpread = .25,                       // spread down from base (0.9) to min shadow luma (0.7)
          reflHighMult = .6,                             // 
          reflShadMult = 1,                               //
          reflHighSpread = reflHighMult * shadColSpread,  // spread down from base (0.9) to min shadow luma (0.65)
          maxHighlight = 1,                                                         // 0.9 + 0.1 = 1!
          reflHighlight = (1 - highColSpread - reflHighSpread),                     // 0.9 -0.1 - 0.2  = .7
          //  reflHighlight = (1 - highColSpread - reflHighSpread) - shadowReducer,  // 0.9 -0.1 - 0.2  = .7
          perceptualDivisor = 16                          // compensates for blur, etc to get visually correct result

        let shadowReducer = curve === 'r' ? min(0.2, (20 / (mag * mag * pixToUserUnits))) : 0
        // shadowReducer = curve === 'r' ? (1 / (mag * pixToUserUnits) * 5) : 0
        // shadowReducer = 0
        const minShadow = (1 - highColSpread - shadColSpread)       // 0.9 -0.1 - 0.25 = .65
        // const minShadow = (1 - highColSpread - shadColSpread) + shadowReducer       // 0.9 -0.1 - 0.25 = .65
        DeBug.log(``)
        DeBug.warn(`offsets`, offsets)
        neuShades = offsets
          .map(offset => {
            let mag = offset * .2             // convert pixelUnit to userUnit magnitude
            //  let mag = offset / pixToUserUnits             // convert pixelUnit to userUnit magnitude

            //MARK: This is the main control for inner shade depth

            mag = curve === 'j' ? mag * 1 : mag * .75
            let
              isSCurve = false,
              highBlurRad = mag * 1,
              shadBlurRad = mag * 1,
              blurRadius = mag
            // blurRadius = isSCurve ? mag - offsets[0] / pixToUserUnits * .5
            //   : mag - offsets[0] / pixToUserUnits * 1 // subtract 1pix so thin layers full value at ~0 blur
            // blurRadius = isSCurve ? mag - offsets[0] / pixToUserUnits * .5
            // : mag - offsets[0] / pixToUserUnits * 1 // subtract 1pix so thin layers full value at ~0 blur
            highBlurRad = blurRadius

            let highColLuma, shadColLuma

            //MARK: "r" Cuts
            if (curve === 'r') {
              highColLuma =
                // !isSCurve ?
                //   maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                //   : 
                1 * maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              if (offset <= reflLightRange * 1) {               // add relfective highlight to shadow
                shadColLuma =
                  // !isSCurve ?
                  //   reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                  //   : 
                  .915 * reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              } else {
                shadColLuma =
                  // !isSCurve ?
                  //   minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                  //   : 
                  1.2 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              }

              //MARK: "j" Cuts
            } else if (curve === 'j') {
              // blur = false
              highColLuma = maxHighlight - (highColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              if (offset <= reflLightRange * .625) {
                shadColLuma =
                  !isSCurve ?
                    minShadow + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
                    : .865 * reflHighlight + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              } else {
                shadColLuma =
                  // !isSCurve ?
                  1 * minShadow + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
                // 1.4 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                // : 1.4 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeOutCircNormalized(offset) / perceptualDivisor)
              }
            }

            const
              highCol = achromic(highColLuma),
              shadCol = achromic(shadColLuma),
              shadeVector = Shade.cleanRotate(vector, rotOffset).setMag(mag)

            // DeBug.log(`vector`, vector)
            // DeBug.log(`vectorX: ${vector.x}, vectorY: ${vector.y}, vectorZ: ${vector.z}`)
            // DeBug.log(`calculation`, Vertex.rotate(vector, radians(rotOffset)))
            // DeBug.log(`calculation`, Vertex.rotate(vector, PI))
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)

            let shades = this.neuShadeSVG(shadeType, shadeVector, mag, highBlurRad, shadBlurRad, highCol, shadCol, inset, blur, curve)
            DeBug.log(`${curve} ${shadeType} shades`, shades)
            return shades
          })
          .flat()
      }
      //NOTE: These other options unused except for FAIL/Error outputs
    } else {
      // let color1, color2
      // //NOTE: AVOID - 'multiAlpha' causes extreme banding artifacts in my implementation
      // if (type === 'multiAlpha') {
      //   color1 = protoColor(255, 256 / count)
      //   color2 = protoColor(0, 256 / count)
      // }
      // //NOTE: AVOID - 'flat' isn't quite convincing and loses the crisp outlines of 'multishade'
      // if (type === 'flat') {
      //   const cols = baseCol.highShadComplementSpread(colSpread)
      //   color1 = cols[0]
      //   color2 = cols[1]
      // }

      // neuShades = offsets
      //   .map(o => {
      //     const mag = o / pixToUserUnits
      //     const blurRadius = mag / sqrt(2)
      //     const shades = this.neuShadeSVG(
      // shadeType,
      //       vector.setMag(mag).rotate(radians(rotOffset)),

      //       blurRadius, 
      //       blurRadius,
      //       color1,
      //       color2,
      //       inset,
      //       blur,
      //       curve
      //     )
      //     return shades
      //   })
      //   .flat()
    }

    if (sort) {
      const
        lighten = neuShades.filter(shad => shad.lighten),
        darken = neuShades.filter(shad => !shad.lighten)
      neuShades = OpArray.from([...lighten, ...darken])
      // neuShades = OpArray.from([...darken, ...lighten])
    }
    DeBug.error(`neuShades`, neuShades)
    // DeBug.error(`vect`, neuShades.map(ns => [ns.dx, ns.dy]))
    // DeBug.error(`colorSpread`, neuShades.map(ns => ns.colorSpread))
    // DeBug.error(`${curve} colors`, neuShades.map(ns => ns.color.levels[0]))
    DeBug.groupEnd()
    return neuShades
  }
}

// CLASS: ProtoColor
// SIZE: 87 lines
function protoColor() {
  if (arguments[0] instanceof p5.Color || arguments[0] instanceof ProtoColor)
    return arguments[0] // Do nothing if argument is already a color object.

  const args = arguments[0] instanceof Array ? arguments[0] : arguments
  return new ProtoColor(this, args)
}
function achromic(l) { return ProtoColor.achromic(l) }
class ProtoColor extends p5.Color {

  constructor(pInt, args) {
    super(pInt, args)
  }

  get color() { return color(this.red, this.green, this.blue, this.alpha) }

  get red() { return this._getRed() }
  get green() { return this._getGreen() }
  get blue() { return this._getBlue() }
  get alpha() { return this._getAlpha() }

  get hue() { return this._getHue() }
  get saturation() { return this._getSaturation() }
  get brightness() { return this._getBrightness() }
  get lightness() { return this._getLightness() }
  get hsb() {
    return {
      h: this.hue,
      s: this.saturation,
      b: this.brightness,
    }
  }

  get complement() {
    return protoColor(`hsba(${this.complementHue}, ${this.saturation}%, ${this.brightness}%, ${this.alpha})`)
  }
  get complementHue() { return (this.hue + 180 % 360) }

  //METH: setAlpha() : ProtoColor : set alpha value
  setAlpha(alpha) { return protoColor(`hsba(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${alpha})`) }
  //METH: setSaturation() : ProtoColor : set saturation value
  setSaturation(sat) { return protoColor(`hsba(${this.hue}, ${sat}%, ${this.brightness}%, ${this.alpha})`) }
  //METH: highShadComplementSpread() : [ProtoColor] : create highlight and shadow colors with complementary hues
  highShadComplementSpread(spread = 16) {
    spread = spread / 2.56
    const
      h = this.hue,
      s = this.saturation,
      b = this.brightness,
      // DeBug.log('brightness', b)
      high = [h, s, constrain(b + spread, 0, 100)],
      shad = [this.complementHue, s, constrain(b - 2.5 * spread, 0, 100)]
    // DeBug.log('cols:', high, shad)
    let cols = [high, shad]
      .map(hsb => `hsb(${hsb[0]}, ${hsb[1]}%, ${hsb[2]}%)`)
      .map(dscrpt => color(dscrpt))
    return cols
  }
  //METH: highShadSpread() : [ProtoColor] : create achromic highlight and shadow colors 
  highShadSpread(spread = 16) {
    let
      b = this.brightness,
      bPair = [round(b + spread), round(b - 1.3 * spread)],
      // DeBug.log('bPair', bPair)
      cols = bPair
        .map(b => `hsb(${this.hue}, ${this.saturation}%, ${b}%)`)
        .map(dscrpt => protoColor(dscrpt))
    return cols
  }
  //METH: randomHighHue() : ProtoColor : create highlight color with random hue
  static randomHighHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 100%)`)
  }
  //METH: randomShadHue() : ProtoColor : create shadow color with random hue
  static randomShadHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 50%)`)
  }
  //METH: okLCH() : ProtoColor : create okLCH color
  static okLCH(l, c, h) {
    const rgbColor = oklch2rgb([l, c, h])
    // DeBug.log(`okLCH 2 RGB:`, rgbColor)
    return protoColor(rgbColor)
  }
  //METH: achromic() : ProtoColor : create achromic color
  static achromic(l) { return protoColor(l * 255) }
}