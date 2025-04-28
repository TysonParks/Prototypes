//ENUM: Profile : Cut Profile Descriptor
class Profile {
  breed
  type
  cutIn
  halfCurve
  frameEdge

  constructor(type, cutIn = true, frameEdge = false, halfCurve = false) {
    this.type = type
    this.cutIn = cutIn
    this.frameEdge = frameEdge
    this.halfCurve = halfCurve
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
  static fIn = new Profile(`s`)
  static fOut = new Profile(`s`, false)
  static vIn = new Profile(`v`)
  static vOut = new Profile(`v`, false)

  static AllTypes = [`i`, `j`, `r`]     // Add `s`  and `v` when implemented
  static CurveTypes = [`j`, `r`]        // Add `s` when implemented
  static FlatTypes = [`i`]              // Add `v` when implemented

  static CurveOptions = [Profile.jIn, Profile.jOut, Profile.rIn, Profile.rOut]


  //MARK: Computed
  get isI() { return this.type === `i` }                    // is `i` type
  get isJ() { return this.type === `j` }                    // is `j` type
  get isR() { return this.type === `r` }                    // is `r` type
  get isS() { return this.type === `s` }                    // is `s` type
  get isV() { return this.type === `v` }                    // is `v` type

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
    return this.isI || this.isJ || this.frameEdge || this.halfCurve
  }
  get isInset() { return this.isRType ? !this.cutIn : this.cutIn }       // filter insets from shape border (use cutRange.start)

  get wave() { return new Profile(this.type === `r` ? `j` : `r`, !this.cutIn) }
  get channel() { return new Profile(this.type, !this.cutIn) }
  get cyma() { return new Profile(this.type === `r` ? `j` : `r`, this.cutIn) }

  get insetDepth() {
    if (this.isR) {
      return this.cutIn ? 0.35 : 0.45
    } else {
      return 1
    }
  }
  get outsetDepth() {
    if (isSingleDepth) { return 0 }
    else { return 1 }
  }
  get description() {
    const inOut = this.cutIn ? `In` : `Out`
    return this.type + inOut
  }
  //METH: equals()
  equals(profile) {
    return this.type === profile.type
      && this.cutIn === profile.cutIn
      && this.halfCurve === profile.halfCurve
      && this.frameEdge === profile.frameEdge
  }
}

//MARK: PROTOCUT CLASS
class ProtoCut {
  id
  breed
  profile           // Profile: cut profile: [i,j,r,f,v] combined with [in, out]
  depth             // (end) depth
  start
  extHighDepth      // limiter on external highlight depth
  useExtHighDepth
  angleOffset = 0   // offset angle from global vector
  shapeGroups = new OpArray
  filters = new OpArray

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
    // this.storeObject(S.Cuts)
  }

  //MARK: Computed
  get spread() { return this.profile.isSingleDepth ? this.depth : this.depth + this.depth2 }
  get padding() { return vert(this.depth * 2) }
  get description() {
    const
      p = this.profile,
      prime = p.breed,
      half = p.halfCurve ? `-half` : ``,
      edge = p.frameEdge ? `-frameEdge` : ``,
      dep = roundToDec(this.depth / GRID.cellRadius, 4),
      start = roundToDec(this.start, 4)
    return `${prime}${half}${edge}-${dep}xCellRadius`
    // return `${prime}${half}${edge}-${dep}xCellRadius-${start}start`
  }
  get maxLayout() {
    let [xMax, yMax, widthMax, heightMax] = [0, 0, 0, 0]
    this.shapeGroups.forEach(grp => {
      const
        [size, padding] = [grp.insetSize, grp.padding],
        //  finalSize = grp.finalSize,
        padSize = Vertex.div(padding, size),
        anchor = Vertex.mult(padSize, -100),
        newSize = Vertex.mult(padSize, 200).add(vert(100))

      xMax = min(anchor.x, xMax)
      yMax = min(anchor.y, yMax)
      widthMax = max(newSize.x, widthMax)
      heightMax = max(newSize.y, heightMax)
    })
    return { x: xMax, y: yMax, width: widthMax, height: heightMax }
  }

  //MARK: Public Methods
  setLayouts() {
    // console.warn(`setLayouts`, this)
    const layout = this.maxLayout
    // console.log(`maxLayout`, layout)
    this.filters.forEach(f => {
      f.filter
        .attribute("x", `${layout.x}%`)
        .attribute("y", `${layout.y}%`)
        .attribute("width", `${layout.width}%`)
        .attribute("height", `${layout.height}%`)
    })

  }

  curve(layer) {
    if (this.profile.isR) return layer === 0 ? `r` : `r2`
    if (this.profile.isS) return layer === 0 ? `j` : `r`
    return this.profile.type
  }

  //MARK: Private Methods

  //METH: createSingleShader()
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

    if (this.profile.isS) DeBug.error(`ProtoCut "s" profile not yet implemented`)
    if (this.profile.isV) DeBug.error(`ProtoCut "v" profile not yet implemented`)
  }
  //METH: createShader()
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
  //METH: equals()
  equals(cut) { return this.breed === cut.breed }

  //TODO: implement createPerimeter()
  //METH: createPerimeter()
  #createPerimeterShader() {
    // to be implemented utilizing an SVG stroke mask, similar to 'v' cut eventual implementation
  }
}
Object.assign(ProtoCut.prototype, IdentifiableStored)


// CLASS: Shade
// SIZE: 163 lines
class Shade {
  //METH: shadVect( ): create vector from Angle + Offset
  static shadVect(angle = globalControls.shadAngle) { return createVector(1, 0).rotate(radians(angle)) }

  //METH: dropShadSVG()
  // static dropShadSVG({ lighten = true, x, y, blurRad = 0, spreadRad = 0, col = frameColor, inset = false } = {}) {
  //   return { lighten: lighten, dx: x, dy: y, blur: blurRad, color: col, inset: inset }
  // }
  //METH: dropShadeSVG()
  static dropShadeSVG({ lighten = true, invert = false, vector, mag, blurRad = 0, col = frameColor, inset = false } = {}) {
    return { lighten: lighten, invert: invert, vector: vector, mag: mag, blur: blurRad, color: col, inset: inset }
  }
  //METH: neuShadeSVG()
  static neuShadeSVG(shadeType, vector = this.shadVect(), mag, highBlurRad, shadBlurRad, highCol, shadCol, inset = false, blur = true, curve = 'j', highOffsetRatio = 1, blurRatio = 1) {
    //NOTE: FAKE IRIDESCENT
    //NOTE: ----------------------------------
    // const randomLCH = (l) => {
    //   const
    //     chroma = 1 / 8,
    //     hue = R.random_num(0, 360)
    //   return `oklch(${l} ${chroma} ${hue})`
    // }
    // highCol = randomLCH(.98)
    // shadCol = randomLCH(0.7)
    //NOTE: ----------------------------------

    // highCol = achromic(1)
    // shadCol = achromic(0.7)

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
  //METH:
  static neuShadeSVGFactory({
    curve = 'j',                            // type of cut/curve : [i, j, r, r2, f, v]
    cutIn,
    shadeType,
    mag,                                    // magnitude of shade offset, corresponds to depth/loft of shade effect
    vector = Shade.shadVect(),               // direction of light
    rotOffset = 0,                          // deg rotation offset, used for dif shade types and CHAOS
    pixToUserUnits = FRAME.pixToUserUnits,  // CONSTANT used to convert mag (given in userUnits) to pixel units
    baseCol = frameColor,                   // highlights and shadows spread out from baseColor, always frameColor
    colSpread = 25,                         // distance(8-bit) to spread shades from baseColor, always 26 (256-30 = 26)
    start = 0,                              // determine start of layers kept, always 0
    blur = true,                            // apply blur to shades, always true
    type = 'multiShade',                    // always use 'multishade' : ['multiShade', 'multiAlpha', 'flat']
    count = 3,                              // used to calculate 'multiAlpha' type layer density/alpha, always 3
    sort = false,                           // end sorts all highlights over shadows (or opposite), always false
  } = {}) {
    vector = Vertex.cleanRotate(vector, 0)
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
      if (root >= 88) { return 14 }         // mag >= 7744
      if (root >= 62) { return 13 }         // mag >= 3844
      if (root >= 44) { return 12 }         // mag >= 1936
      if (root >= 31) { return 11 }         // mag >= 961
      if (root >= 22) { return 10 }         // mag >= 484
      if (root >= 16) { return 9 + 1 }          // mag >= 256
      if (root >= 11) { return 8 + 1 }          // mag >= 121
      if (root >= 8) { return 7 + 1 }           // mag >= 64
      if (root >= 6) { return 6 + 1 }           // mag >= 36
      if (root >= 3) { return floor(root) + 1 } // mag >= 9
      return 3
    }
    //ARROW: rounding(): [number] : preserve precision of lower offsets, reduce duplicates for larger offsets
    const rounding = (e) => {
      if (e < 4) {
        return roundToDec(e)  // roundToDec values below 4, to preserve precision for small shade depths
      } else {
        return floor(e)       // floor values at 4 and above to reduce duplicate shades for larger depths
      }
    }
    // console.warn(`mag`, mag)
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

    // .filter(e=> )
    // .slice(start, 2)       // reduce layers based upon start and keep()
    console.error('offsets', offsets)
    offsets = offsets
      .map(e => rounding(e)) // round offsets
      .filter(e => e > 0)         // remove negatives (shouldn't be necessary!)
      .numSorted                  // sort small-large
      .unique()                   // remove duplicates

    console.error('offsets filter-sort', offsets)
    let neuShades
    //NOTE: "multiShade" is the only/final choice for j-cuts 
    if (type === 'multiShade') {
      const offsetRange = range(offsets[0], offsets.last)   // range from offsets

      //ARROW: easeInCircNormalized : number : normalizes and shifts value using circular easing
      const easeInCircNormalized = (x, exp = 2) => { return 1 - sqrt(1 - pow(offsetRange.normalize(x), exp)) }
      const easeOutCircNormalized = (x, exp = 2) => { return sqrt(1 - pow(offsetRange.normalize(x), exp)) }
      const easeInExpoNormalized = (x, exp = 2) => { return x === 0 ? 0 : pow(2, 10 * offsetRange.normalize(x) - 10) }
      const easeInOutCircNormalized = (x, exp = 2) => {
        x = offsetRange.normalize(x)
        return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, exp))) / 2
          : (sqrt(1 - pow(-2 * x + 2, exp)) + 1) / 2
      }

      frameColor = achromic(0.9)
      const shadColSpread = 0.25

      //MARK: "I" Cut
      if (curve === 'i' || curve === 'r2') {
        const highColSpread = 0.04                          // spread up from base (0.9) to max highlight luma (1!)
        // const shadColSpread = curve === 'r2' ? 0.25 : .25  // spread down from base (0.9) to min shadow luma (0.7)
        const maxHighlight = 0.9 + highColSpread             // 0.9 + 0.04 = 0.94
        const minShadow = (0.9 - shadColSpread)              // 0.9 - 0.25 = 0.65
        const perceptualDivisor = curve === 'i' ? 4 : 16                   // compensates for blur, etc to get visually correct result
        const highOffsetRatio = curve === 'i' ? 1 : 1 / 16

        // blur = true
        neuShades = offsets
          .map((offset, i) => {
            mag = offset / pixToUserUnits * 1         // convert pixelUnit to userUnit magnitude
            mag = curve === 'i' ? mag * 1 : mag * 1.2
            const iBlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6  //
            const r2BlurRadius = (mag - 1 * offsets[0] / pixToUserUnits) * 1 / 6  //
            const blurRadius = curve === 'i' ? iBlurRadius : r2BlurRadius
            const highColLuma = maxHighlight - (highColSpread * easeInCircNormalized(offset, 2) / perceptualDivisor)
            const shadColLuma1 = minShadow + (shadColSpread * easeInOutCircNormalized(offset, 3) / perceptualDivisor)
            const shadColLuma2 = minShadow + (4 * shadColSpread * easeOutCircNormalized(offset, 2) / perceptualDivisor)

            const highCol = achromic(highColLuma)
            const shadCol1 = achromic(shadColLuma1)
            // const shadCol2 = achromic(shadColLuma2)
            // const shadCol2 = achromic(shadColLuma1).setAlpha(.25)

            let shades = new OpArray
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            const shadeVector = Vertex.cleanRotate(vector, radians(rotOffset)).setMag(mag)
            // const shadeVector = vector.setMag(mag)

            // DeBug.log(`angleMode`, _angleMode)
            // DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)
            // DeBug.log(`rotOffset`, rotOffset)

            const shades1 = this.neuShadeSVG(shadeType, shadeVector, mag, blurRadius, blurRadius, highCol, shadCol1, inset, blur, curve, highOffsetRatio)
            shades.push(shades1)

            if (i === offsets.length - 1) {
              // const shades2 = this.neuShadeSVG(shadeType,vector.setMag(mag * 1).rotate(rotOffset), blurRadius * 2, highCol, shadCol2, inset, blur, curve)
              // shades.push(shades2)
            }
            DeBug.log(`${curve} shades`, shades)
            return shades.flat()
          }).flat()
      }

      if (curve === 'j' || curve === 'r') {
        let reflLightRange
        // if (curve === 'r') {                            // "R" cut
        // rotOffset = rotOffset + PI
        const rangeSize = mag                       // shadow range
        reflLightRange = rangeSize / 2.2              // visual observation shows relfLight to be about 1/5 the shadow
        // DeBug.log(`reflLightRange`, reflLightRange)
        if (!offsets.includes(reflLightRange)) {      // if necessary, add extra shade layer at reflLightRange
          offsets.push(reflLightRange)
          offsets = offsets.numSorted
        }
        // }
        // DeBug.log('bonus offsets', offsets)

        const highColSpread = 0.1                         // spread up from base (0.9) to max highlight luma (1!)
        // const shadColSpread = 0.25                          // spread down from base (0.9) to min shadow luma (0.7)
        const reflHighMult = 0.6                         // 
        const reflShadMult = 1                           //
        const reflHighSpread = reflHighMult * shadColSpread // spread down from base (0.9) to min shadow luma (0.65)
        let shadowReducer = curve === 'r' ? min(0.2, (20 / (mag * mag * pixToUserUnits))) : 0
        // shadowReducer = curve === 'r' ? (1 / (mag * pixToUserUnits) * 5) : 0
        // shadowReducer = 0
        const maxHighlight = 1                                                      // 0.9 + 0.1 = 1!
        const minShadow = (1 - highColSpread - shadColSpread) + shadowReducer       // 0.9 -0.1 - 0.25 = .65
        const reflHighlight = (1 - highColSpread - reflHighSpread)                  // 0.9 -0.1 - 0.2  = .7
        // const reflHighlight = (1 - highColSpread - reflHighSpread) - shadowReducer  // 0.9 -0.1 - 0.2  = .7
        const perceptualDivisor = 16                       // compensates for blur, etc to get visually correct result
        DeBug.log(``)
        DeBug.warn(`offsets`, offsets)
        neuShades = offsets
          .map(offset => {
            let mag = offset / pixToUserUnits                  // convert pixelUnit to userUnit magnitude
            mag = curve === 'j' ? mag * 1 : mag * .65
            let isSCurve = false

            let highBlurRad = mag * 1
            let shadBlurRad = mag * 1
            let blurRadius = mag
            blurRadius = isSCurve ? mag - offsets[0] / pixToUserUnits * .5
              : mag - offsets[0] / pixToUserUnits * 1 // subtract 1pix so thin layers full value at ~0 blur
            highBlurRad = blurRadius

            let highColLuma, shadColLuma

            // "r" curve
            if (curve === 'r') {
              highColLuma =
                !isSCurve ?
                  maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                  : 1 * maxHighlight - (highColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              if (offset <= reflLightRange * 1.) {               // add relfective highlight to shadow
                shadColLuma =
                  !isSCurve ?
                    reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                    : .915 * reflHighlight + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              } else {
                shadColLuma =
                  !isSCurve ?
                    minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
                    : 1.2 * minShadow * reflHighMult * reflShadMult + (shadColSpread * easeInCircNormalized(offset) / perceptualDivisor)
              }
              // "j" curve
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

            const highCol = achromic(highColLuma)
            const shadCol = achromic(shadColLuma)
            // angleMode(DEGREES)
            // DeBug.log(`DEG_TO_RAD`, DEG_TO_RAD)
            // DeBug.log(`PI/180`, PI / 180)
            // DeBug.log(`angleMode`, _angleMode)
            // DeBug.log(`vector`, vector)
            // DeBug.log(`vectorX: ${vector.x}, vectorY: ${vector.y}, vectorZ: ${vector.z}`)
            // DeBug.log(`rotOffset`, rotOffset)
            // DeBug.log(`calculation`, Vertex.rotate(vector, radians(rotOffset)))
            // DeBug.log(`calculation`, Vertex.rotate(vector, PI))
            DeBug.log(`mag`, mag)
            DeBug.log(`vector`, vector)
            DeBug.log(`rotOffset`, rotOffset)
            const shadeVector = Vertex.cleanRotate(vector, rotOffset).setMag(mag)
            // const shadeVector = vector.setMag(mag)

            // DeBug.log(`angleMode`, _angleMode)
            DeBug.log(`shadeVector`, shadeVector)
            // DeBug.log(`shadeVector.x ${shadeVector.x}, shadeVector.y ${shadeVector.y}`)
            // DeBug.log(`rotOffset`, rotOffset)
            // const shadeVector = vector.setMag(mag)
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
      const lighten = neuShades.filter(shad => shad.lighten)
      const darken = neuShades.filter(shad => !shad.lighten)
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

  // MARK: OG CSS Methods
  // #region OG CSS Methods
  //METH: Box-Shadow CSS
  static boxShadCSS(x, y, blurRad = 0, spreadRad = 0, col = color(0), inset = false) {
    let color = col.toString('#rrggbb')
    if (inset === true) {
      return `inset ${x}px ${y}px ${blurRad}px ${color}`
    } else if (spreadRad === 0) {
      return `${x}px ${y}px ${blurRad}px ${color}`
    } else {
      return `${x}px ${y}px ${blurRad}px ${spreadRad}px ${color}`
    }
  }
  //METH: Text-Shadow CSS
  static textShadCSS(x, y, blurRad = 0, col = color(0)) { return this.boxShadCSS(x, y, blurRad, col) }
  //METH: Drop-Shadow CSS
  static dropShadCSS(x, y, blurRad = 0, col = color(0)) {
    return `drop-shadow(${this.boxShadCSS(x, y, blurRad, col)})`
  }
  //METH: Neumorphic Box-Shadow CSS - create highlight shadow pair code for CSS
  static neuBoxShadCSS(vector = this.shadVect(), blurRad, highCol, shadCol, inset = false) {
    let highlightCSS = this.boxShadCSS(-vector.x, -vector.y, blurRad, 0, highCol, inset)
    let shadowCSS = this.boxShadCSS(vector.x, vector.y, blurRad, 0, shadCol, inset)
    return `${shadowCSS}, ${highlightCSS}`
  }
  //METH: Neumorphic Box Shadow Factory - create a shadow and highlight stack
  static neuBoxShadFactory({ baseCol = protoColor(230), vector = this.shadVect(), start = 0.5, spread = 16, inset = false } = {}) {
    // DeBug.log('neuCSS')
    // DeBug.log(baseCol, vector, start, spread, inset)
    let offset = vector.mag() / sqrt(2)
    let cols = baseCol.highShadSpread(spread)
    // DeBug.log(offset, cols)
    let neuShads = cleanSlices(start, offset, globalControls.shadQuality)
    print(neuShads.map(e => e.toFixed(2)))
    neuShads = neuShads.map(sliceOffset => this.neuBoxShadCSS(vector.setMag(sliceOffset), 2 * sliceOffset, cols[0], cols[1], inset))
    return neuShads
  }
  // #endregion
}




// CLASS: ProtoColor
// SIZE: 75 lines
function protoColor() {
  if (arguments[0] instanceof p5.Color || arguments[0] instanceof ProtoColor) {
    return arguments[0]; // Do nothing if argument is already a color object.
  }

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

  setAlpha(alpha) { return protoColor(`hsba(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${alpha})`) }
  setSaturation(sat) { return protoColor(`hsba(${this.hue}, ${sat}%, ${this.brightness}%, ${this.alpha})`) }

  highShadComplementSpread(spread = 16) {
    spread = spread / 2.56
    const h = this.hue
    const s = this.saturation
    const b = this.brightness
    // DeBug.log('brightness', b)

    const high = [h, s, constrain(b + spread, 0, 100)]
    const shad = [this.complementHue, s, constrain(b - 2.5 * spread, 0, 100)]
    // DeBug.log('cols:', high, shad)
    let cols = [high, shad]
      .map(hsb => `hsb(${hsb[0]}, ${hsb[1]}%, ${hsb[2]}%)`)
      .map(dscrpt => color(dscrpt))
    return cols
  }

  highShadSpread(spread = 16) {
    let b = this.brightness
    let bPair = [round(b + spread), round(b - 1.3 * spread)]
    // DeBug.log('bPair', bPair)
    let cols = bPair
      .map(b => `hsb(${this.hue}, ${this.saturation}%, ${b}%)`)
      .map(dscrpt => protoColor(dscrpt))
    return cols
  }

  static randomHighHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 100%)`)
  }

  static randomShadHue(isSeeded = false) {
    let hue = floor(isSeeded ? R.random_num(0, 255) : random(255))
    return protoColor(`hsb(${hue}, 100%, 50%)`)
  }

  static okLCH(l, c, h) {
    const rgbColor = oklch2rgb([l, c, h])
    // DeBug.log(`okLCH 2 RGB:`, rgbColor)
    return protoColor(rgbColor)
  }

  static achromic(l) { return protoColor(l * 255) }
}

//TODO: DEPRECATE
// FUNC: sliceExpSeries()
function sliceExpSeries(min, max) {
  let startIndex = expSeries.findIndex(e => e >= min)
  let endIndex = expSeries.findIndex(e => e > max) + 1
  let maxInterval = expSeries.slice(endIndex - 2, endIndex)
  let scalar = convertRange(max, maxInterval, [0, 1])
  let scaledLastValue = maxInterval[1] * scalar
  let series = expSeries.slice(startIndex, endIndex)
    .map(e => e * scalar)
  return series
}

// FUNC: createSlices()
//NOTE: created with GPT-4 April 18,2023
function createSlices(min, max, factor = 0.5) {
  const slice = []

  function helper(min, max, factor) {
    if (max >= min) {
      helper(min, max * factor, factor)
      slice.push(max)
    }
  }

  helper(min, max, factor)
  return OpArray.from(slice)
}
// FUNC: exponentialSlices()
function exponentialSlices(min, max, amount, factor = 0.5) {
  // DeBug.log('expSlicesInput', min, max, amount)
  // if (amount < 3) { return OpArray.from([min, max]) }
  const range = max - min
  const multipliers = createSlices(1, pow(2, amount - 1), factor).map(e => e - 1)
  const last = multipliers.last
  // DeBug.log('multipliers', multipliers)
  return multipliers.map(e => min + e * (range / last))
}
// FUNC: cleanSlices()
function cleanSlices(min, max, factor = 0.5) {
  return createSlices(min, max, factor)
    .map(e => round(e))
    .unique()
}

// MARK: CSS Factory Functions

// TODO: after most work is complete check to see how many of these are actually used and clean where needed
// CLASS: CS
// SIZE: 33 lines
class CS {
  static inset = 'inset'
  // static space = ' '
  static comma = ', '

  static boxShadow = 'box-shadow'
  // static dropShadow = 'drop-shadow'
  static textShadow = 'text-shadow'

  static transform = 'transform'
  static border = 'border'
  static borderRadius = 'border-radius'
  static rotate = 'rotate'
  static scale = 'scale'
  static filter = 'filter'
  static padding = 'padding'
  static clipPath = 'clip-path'
  static shapeOutside = 'shape-outside'
  static fontSize = 'font-size'
  static textAlign = 'text-align'
  static vertAlign = 'vertical-align'
  static lineHeight = 'line-height'
  static margin = 'margin'
  // static width = 'width'
  static background = 'background'
  static backgroundColor = 'background-color'
  static color = 'color'
  static clear = "#0000"
  static display = 'display'
  static overflow = 'overflow'
  static flexDirection = 'flex-direction'
  static justifyContent = 'justify-content'
  static alignItems = 'align-items'
}

// MARK:CSS Look Class

// PROTOTYPE: p5.Element.prototype.look()
p5.Element.prototype.look = function (look = Look.testGrid, html) {
  if (look instanceof Array) {
    const lookOp = OpArray.from(look).compacted
    if (look[0][0] instanceof Array) {
      lookOp = lookOp.reduce((acc, val) => acc.concat(val), [])
    }
    lookOp.forEach(e => this.style(e[0], e[1]))
  }
  if (html) { this.html(html) }
  return this
}

// PROTOTYPE: p5.Element.prototype.SVGlook()
p5.Element.prototype.svgLook = function (svgLook) {
  if (svgLook instanceof Array) {
    let lookOp = OpArray.from(svgLook).compacted
    if (svgLook[0][0] instanceof Array) {
      lookOp = lookOp.reduce((acc, val) => acc.concat(val), [])
    }
    lookOp.forEach(e => this.attribute(e[0], e[1]))
  }
  return this
}
//FIXME: Never got this one properly working, maybe should do it with CSS anyway?
// PROTOTYPE: p5.Element.prototype.label(text, color, direction)
p5.Element.prototype.label = function (text, color, direction) {
  const labelText = createSVGElt("text");
  labelText.html(text);
  labelText.style("fill", color);

  const parentBBox = this.elt.getBBox();

  const xFactor = direction.isNone ? 0.5 : Math.cos(direction.angle);
  const yFactor = direction.isNone ? 0.5 : Math.sin(direction.angle);

  const x = parentBBox.x + (parentBBox.width * (xFactor + 1)) / 2;
  const y = parentBBox.y + (parentBBox.height * (yFactor + 1)) / 2;

  labelText.attribute("x", x);
  labelText.attribute("y", y);
  labelText.attribute("text-anchor", "middle");
  labelText.attribute("dominant-baseline", "central");

  this.child(labelText);
  return this;
}


// CLASS: SVGLook
// SIZE: 84 lines
class SVGLook {

  static get blackAndWhite() {
    return SVGLook.clear
  }

  static get clear() {
    return [
      ['fill-opacity', `0`],
      ['stroke-opacity', `0`],
    ]
  }
  //MARK: Methods
  //METH:  
  static testStroke(color = ProtoColor.randomHighHue(), opacity = 1, radius = 5) {
    return [
      ['stroke', color],
      ['stroke-opacity', `${opacity}`],
      ['stroke-width', '.5'],
      // ['pathLength', '360'],
      ['stroke-dasharray', `0 2`],
      ['stroke-linecap', 'round'],
      ['stroke-linejoin', 'round'],
      ['rx', `${radius}`],
      ['ry', `${radius}`],
      ['fill-opacity', '0'],
    ]
  }
  //METH:
  static testFill(color = ProtoColor.randomHighHue(), opacity = .5, radius = 5) {
    return [
      ['fill', color],
      ['fill-opacity', `${opacity}`],
      ['rx', `${radius}`],
      ['ry', `${radius}`],
    ]
  }
  //METH:
  static test(strokeColor, fillColor, opacity = .5, radius = 5) {
    return [...SVGLook.testStroke(strokeColor, 1, radius), ...SVGLook.testFill(fillColor, `${opacity}`)]
  }

  static blackAndWhite() { }

  static get clear() {
    return [
      ['fill-opacity', `0`],
      ['stroke-opacity', `0`],
    ]
  }
  //METH:
  static neuShade({
    baseCol = protoColor(230),
    vector = globalShadowVector(),
    start = globalControls.start,
    spread = globalControls.spread,
    inset = globalControls.inset,
  } = {}) {

  }


  //METH:
  static trendyCactus(path) {
    const length = path.elt.getTotalLength()
    const dashLength = R.random_int(0, 20)
    const dashWidth = (20 - dashLength) / 4
    const loopCount = R.random_int(0, 10)
    // const loopCount = 10
    const offset = R.random_num(0, 10)
    return [
      ['fill', ProtoColor.randomHighHue()],
      ['fill-opacity', '0.2'],
      ['stroke', 'black'],
      ['stroke-opacity', '1'],
      ['stroke-linecap', 'round'],
      ['stroke-linejoin', 'round'],
      ['overflow', 'auto'],
      ['pathLength', 'length'],
      ['stroke-dasharray', `${dashLength} ${length / loopCount - dashLength}`],
      ['stroke-width', `${dashWidth}`],
      ['stroke-dashoffset', `${offset}`],
    ]
  }
}


// CLASS: Look
// SIZE: 
class Look {

  static islandShape(path, color = randomColor().toString('#rrggbbaa')) {
    return [
      [CS.backgroundColor, testingControls.blackMode ? '#000' : color],
      [CS.clipPath, path],
      [CS.shapeOutside, path],
      // [CS.overflow, 'visible']
    ]
  }

  static neuShade(
    {
      baseCol = protoColor(230),
      vector = globalShadowVector(),
      start = globalControls.start,
      spread = globalControls.spread,
      inset = globalControls.inset,
    } = {}
  ) {
    return [[CS.boxShadow, Shade.neuBoxShadFactory(baseCol, vector, start, spread, inset)]]
  }

  static textAlign({ size, hor = 'center', vert = 'center' } = {}) {
    let textAlign = [CS.textAlign, hor]
    let lineHeight = [CS.lineHeight, `${size.y}px`]
    let otherHeight = [CS.lineHeight, `${(size.y + (sqrt(size.x) * 2.5))}px`]
    if (vert === 'center') { return [textAlign, lineHeight] }
    if (vert === 'top') { return [textAlign] }
    if (vert === 'below') { return [textAlign, otherHeight] }
  }

  static testText(
    sizeX,
    color,
    radius = 25,
    labels = testingControls.labels,
    borders = testingControls.borders,
  ) {
    return [
      [CS.color, (labels ? color : CS.clear)],
      // [CS.borderRadius, `${sqrt(sizeX) * 1.5}px`],
      [CS.borderRadius, `${radius}px`],
      [CS.fontSize, `${sqrt(sizeX) * 1.5}px`],
      [CS.border, `${borders ? color : CS.clear} dashed ${sqrt(sizeX) / 20}px`],
    ]
  }

  static test(size, type) {
    switch (type) {
      case 'frame':
        return [...Look.textAlign({ size: size, vert: 'top' }), ...Look.testText(size.x, '#80F8', 10)]
      case 'grid':
        return [...Look.textAlign({ size: size, vert: 'top', hor: 'start' }), ...Look.testText(size.x, '#08F8')]
      case 'group':
        // return []
        return [...Look.textAlign({ size: size, hor: 'start', vert: 'top', }), ...Look.testText(size.x, '#80F0')]
      case 'cell':
        const text = [
          ...Look.textAlign({ size: size }),
          ...Look.testText(size.x, '#8088')
        ]
        const neuShade = [...Look.neuShade()]
        if (testingControls.blackMode) { return text }
        else { return [...text, ...neuShade] }
        return [
          ...Look.textAlign({ size: size }),
          ...Look.testText(size.x, '#8088'),
          ...Look.neuShade()
        ]
      case 'island':
        return [...Look.textAlign({ size: size }), ...Look.testText(size.x, '#F08b')]
      case 'shape':
        return [...Look.textAlign({ size: size, vert: 'below' }), ...Look.testText(size.x, '#F0Fb')]
    }
  }

  static get testGrid() {
    return [
      // [CS.color, '#80F'],
      [CS.color, CS.clear],
      [CS.backgroundColor, '#00'],
      [CS.borderRadius, '10%'],
      [CS.textAlign, "center"],
      // [CS.border, '#F7F dashed 1px'],
      // [CS.display, 'none'],
    ]
  }

  static testCell(color = randomColor().toString('#rrggbbaa'), labels = testingControls.labels,) {
    // let randomColor = randomColor().toString('#rrggbbaa')
    return [
      [CS.color, (labels ? '#00F' : CS.clear)],
      [CS.backgroundColor, '#0FF6'],
      [CS.backgroundColor, color],
      [CS.borderRadius, '20%'],
      [CS.textAlign, "center"],
      // [CS.border, '#808 solid 1px'],
    ]
  }

  static blankTestCell(labels = testingControls.labels,) {
    const neuShade = [...Look.neuShade({ vector: globalShadowVector().mult(0.3), inset: !globalControls.inset, })]
    return [
      [CS.color, (labels ? '#00F' : CS.clear)],
      [CS.backgroundColor, CS.clear],
      [CS.borderRadius, '50%'],
      [CS.textAlign, "center"],
      testingControls.blackMode ? neuShade : null,
      // neuShade,
      // ...Look.neuShade({ vector: globalShadowVector().mult(0.3), inset: !globalControls.inset, })
    ]
  }

  static centeredFlex(color, direction = 'row') {
    return [
      [CS.background, color],
      [CS.margin, '0'],
      [CS.display, 'flex'],
      [CS.flexDirection, direction],
      [CS.justifyContent, 'space-evenly'],
      [CS.alignItems, 'center'],
    ]
  }

}

// TODO: can these functions be generalized into Classes? Or proto extensions on p5.Element?
// MARK:CSS Shadow Functions

// PROTOTYPE: p5.Element.prototype.boxShadow
p5.Element.prototype.boxShadow = function (value) {
  return this.style(boxShadow, value)
}