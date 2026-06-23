// Archived from ProtoLayerObjects.js + neuMark_I.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// FAIL/EXP material and color experiments — swap fill, stroke, opacity, blur, and palette
// helpers on ShapeGroup / Frame SVG elements to preview alternate material looks.
// Paste snippets back into the cited class methods to revive.

// ── Frame.setBackGridGroup() — override shapeGroup fills after cutIslands ─────
// Source: ProtoLayerObjects.js Frame class
//
//     //NOTE: FAIL/EXP USAGE
//     // this.backGroup.shapeGroups.forEach(sg => {
//     //   // DeBug.log(`svgGroupElt`, sg.svgGroupElt)
//     //
//     //   sg.svgGroupElt
//     //     .attribute(`fill`, frameColor)
//     //     .attribute('fill', protoColor(130))
//     //     .attribute('fill', `green`)
//     //   // .attribute('opacity', .5)
//     //   // sg.drawElement()
//     //   // .attribute('opacity', 0)
//     //   // .attribute('stroke', 'white')
//     //   // .attribute('stroke-width', `.0625`)
//     // })

// ── ShapeGroup.createElement() — alternate fill on group creation ─────────────
//
//     // .attribute(`fill`, frameColor)

// ── ShapeGroup.drawElement() — fill / stroke / filter experiments ─────────────
//
//     this.svgGroupElt
//       .attribute(`fill`, frameColor)
//     // .attribute('overflow', 'visible')
//     // .attribute(`filterUnits`, `userSpaceOnUse`)
//     // .attribute(`primitiveUnits`, `userSpaceOnUse`)
//     // .attribute('fill', protoColor(230))
//     // .attribute('fill', lchcol02)
//     // .attribute('fill', achromic(0.9))
//     // .attribute('fill', 'red')
//     // .attribute(`pathLength`, 12)
//     // .attribute('stroke', `blue`)
//     // .attribute(`stroke-dasharray`, `0 1 `)
//     // .attribute(`stroke-linecap`, `round`)
//     // .attribute('fill-opacity', 1)
//     // .attribute('fill-opacity', 0)
//     // .attribute('stroke-width', this.grid.cellRadius * 1.4)
//     // .attribute('stroke-opacity', 1)
//     // .attribute('stroke-width', this.grid.cellRadius * .125)
//     // .attribute('stroke-width', this.cellGroup.isBackGroup ? 0 : this.grid.cellRadius * .25)
//     // .attribute('stroke-opacity', this.cellGroup.isBackGroup ? 0 : 1)
//     // .attribute('fill-opacity', this.cellGroup.isBackGroup ? 1 : 0)
//
//     const vintage = [
//       [221, 179, 101], [124, 82, 134], [237, 124, 75], [28, 142, 184],
//       [57, 144, 159], [191, 45, 54], [73, 184, 232],
//     ]
//     const sunset = [
//       [215, 19, 39], [250, 146, 49], [131, 203, 223], [30, 21, 55],
//       [238, 204, 112], [246, 114, 43],
//     ]
//     const sunset2 = [
//       [222, 19, 39], [254, 206, 88], [252, 154, 49], [235, 99, 39], [245, 189, 39],
//     ]
//     const london = [[242, 54, 74], [199, 186, 176], [6, 83, 182], [86, 202, 250]]
//     const blues = [[30, 86, 185], [7, 59, 144], [15, 30, 55]]
//     const vapor = [[32, 154, 144], [132, 22, 119], [117, 27, 99], [55, 120, 103], [32, 14, 38]]
//     const grays = [[30, 30, 34], [50, 59, 52], [59, 62, 69], [15, 20, 23]]
//     const bw = [[0, 0, 0], [255, 255, 255]]
//     const randomTransit = (palette) => protoColor(...R.random_choice(palette))
//     const randomTransit2 = () => R.random_choice(['#f26', '#22e', '#ff0', '#0'])
//     const randomLCH = (l) => {
//       const hue = R.random_num(0, 360)
//       const chroma = R.random_num(.125, .125)
//       return `oklch(${l} ${chroma} ${hue})`
//     }
//     if (this.isFrame) {
//       this.svgGroupElt
//       // .attribute('fill', 'white')
//       // .attribute('fill', 'black')
//       // .attribute('fill', R.random_choice(['white', 'black']))
//       // .attribute('fill', achromic(.3))
//       // .attribute('fill', randomLCH(.9))
//       // .attribute('fill', randomTransit(vintage))
//       // .style(`background`, `linear-gradient(45deg, blue, red)`)
//       // .attribute(`overflow`, `visible`)
//       // .blur(R.random_choice([0, R.random_num(1, 2)]))
//     } else {
//       this.svgGroupElt
//       // .attribute('fill', achromic(1))
//       // .attribute('fill', randomLCH(.9))
//       // .attribute('fill', 'white')
//       // .attribute('fill', R.random_choice(['white', 'black']))
//       // .attribute('fill-opacity', .5)
//       // .attribute('fill', randomTransit(sunset))
//       // .blur(R.random_num(0, 1))
//       // .attribute('stroke', randomTransit(bw))
//       // .attribute(`stroke-dasharray`, `2 2`)
//       // .attribute(`stroke-linecap`, `round`)
//       // .attribute('stroke-width', R.random_num(.25, 1))
//       // .style('mix-blend-mode', `difference`)
//       // .blur(R.random_choice([0, R.random_num(0, 1)]))
//       // .attribute(`overflow`, `visible`)
//     }

// ── ShapeGroup.createMaskGroup() — random LCH mask fill experiment ────────────
//
//     // const randomLCH = (l) => {
//     //   const hue = R.random_num(0, 360)
//     //   const chroma = R.random_num(.125, .125)
//     //   return `oklch(${l} ${chroma} ${hue})`
//     // }

// ── neuMark_I.neuShadeSVG() — fake iridescent shade colors ────────────────────
// Source: neuMark_I.js
//
//     //NOTE: FAKE IRIDESCENT
//     //NOTE: ----------------------------------
//     // const randomLCH = (l) => {
//     //   const chroma = 1 / 8, hue = R.random_num(0, 360)
//     //   return `oklch(${l} ${chroma} ${hue})`
//     // }
//     // highCol = randomLCH(.98)
//     // shadCol = randomLCH(0.7)
//     //NOTE: ----------------------------------
//     // highCol = achromic(1)
//     // shadCol = achromic(0.7)
