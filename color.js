// TODO: most of this should be abstracted into a single Class and saved for later projects

// FUNC: swatch()
function swatch(x = 100, y = 100, color = "red", borderRadius = 0) {
  let div = createDiv()
    .size(x, y)
    .style("background-color", color)
    .style("border-radius", `${borderRadius}px`)
    .style("flex-grow", '1')
  return div
}

// FUNC: paletteContainer()
function paletteContainer(parent, x = 500, y = 100, radius = 0) {
  let container = createDiv()
    .parent(parent)
    .size(x, y)
    .style("display", "flex")
    .style("justify-content", "space-evenly")
    .style("align-items", "center")
    .style(borderRadius, `${radius}px`)

  return container
}

// FUNC: createPalette()
function createPalette(container, colors = [["white", 0.6], ["gray", 0.3], ["black", 0.1]], weighted = true, x = 100, y = 100, borderRadius = 0) {
  colors.forEach(color => {
    let swatch1 = swatch(x, y, color[0], borderRadius)
      .parent(container)
    if (weighted) {
      swatch1.style("flex", `${color[1]} 1 0`)
    }
  })
}

// FUNC: createPalettes()
function createPalettes(parent, palettes = [], weighted = true, x = 100, y = 100, borderRadius = 0) {
  if (palettes.length > 0) {
    palettes.forEach(palette => {
      let palContainer = paletteContainer(parent)
      let palette1 = createPalette(palContainer, palette, weighted, x, y, borderRadius)
    })
  }
}

// FUNC: createPaletteOld()
function createPaletteOld(container, x = 100, y = 100, borderRadius = 0, colors = ["white", "gray", "black"]) {
  colors.forEach(color => {
    let swatch1 = swatch(x, y, color, borderRadius)
      .parent(container)
  })
}




// MARK: COLOR PALETTES

function randomColor({ brightness = 100, alpha = .5 } = {}) {
  return color(`hsba(${R.random_int(0, 360)},100%, ${brightness}%, ${alpha})`)
}



//MARK:HandHelds Palettes

// FUNC: displayPalettes()
function displayPalettes(weighted = true) {
  createPalettes(backgroundLayer, [
    walkmanPal,
    raptorPal,
    tinkerPal,
    mTronPal,
    futuronPal,
    classicSpacePal,
    workbenchPal,
    pinkCasioSK1Pal,
    appleLPGAPal,
    appleIPhone5CPal,
    gameboyPal,
    speakAndSpellPal,
    littleProfessorPal,
    isamuNoguchiPal
  ], weighted, 100, 50)
}


// Sony
const walkmanPal = [
  ["#ffec36", 0.7],   // yellow
  ["#313332", 0.2],   // dark gray
  ["#171717", 0.1],   // black
  ["#3f499e", 0.05],  // dark blue
  ["#a9b0b8", 0.04],  // light gray
  ["#00b199", 0.02],  // turquoise
  ["#f55809", 0.01]   // orange
]
// Nike Air Jordan 7,8
const raptorPal = [
  ["#212123", 0.4], // black
  ["#5c5a5b", 0.3], // dark gray
  ["#e5000f", 0.2], // red
  ["#492761", 0.1], // purple
  ["#ffc133", 0.05] // yellow
]
const tinkerPal = [
  ["#2b2b2d", 0.7], // black
  ["#fb9414", 0.1], // yellow orange
  ["#e83548", 0.1], // rose
  ["#399157", 0.1], // green
  ["#434592", 0.1], // blurple
  ["#6dc491", 0.05]  // light green
]
// Lego
const mTronPal = [
  ["#1e1c21", 0.35], // black
  ["#ff0d01", 0.35], // red
  ["#007b00", 0.15], // dark green
  ["#d2d4d1", 0.05], // light gray
  ["#f5cc00", 0.05], // lego yellow
  ["#49e307", 0.04], // neon green
  ["#ffff00", 0.04], // neon yellow
  ["#f4f4f4", 0.02]  // white
]
const futuronPal = [
  ["#f4f4f4", 0.4], // white
  ["#0261a1", 0.3], // dark blue
  ["#171810", 0.2], // black
  ["#b22d1c", 0.1], // dark red 
  ["#0f68c4", 0.05], // blue
  ["#fc3b2a", 0.025], // red
  ["#dfc401", 0.02], // lego yellow
  ["#c8af5b", 0.01], // gold
  ["#238961", 0.01]  // visor green
]
const classicSpacePal = [
  ["#c5c6c1", 0.35], // gray
  ["#1e79d6", 0.3], // blue
  ["#f4f4f4", 0.1], // white
  ["#e1b33f", 0.1], // transparent yellow
  ["#dfc401", 0.05], // lego yellow
  ["#d12718", 0.05], // red
  ["#060b0f", 0.04], // black
  ["#118a47", 0.01], // green
]
// Amiga OS
const workbenchPal = [
  ["#0055aa", 0.7], // blue
  ["#ffffff", 0.25], // white
  ["#ff8800", 0.2], // orange
  ["#000022", 0.15]  // black
]
// Keyboards
const pinkCasioSK1Pal = [
  ["#ffe6ee", 0.4], // pink
  ["#f4f4f4", 0.3], // white
  ["#aca09c", 0.2], // panel chrome
  ["#90daf0", 0.1], // keys turquoise
  ["#007d9b", 0.05], // label turquoise
  ["#2b5a9e", 0.03], // slider blue
  ["#3c393b", 0.03], // button dark gray
  ["#f06574", 0.02], // button red
  ["#fff0a5", 0.01], // button yellow
  ["#ffa78f", 0.005], // button peach
]
// Apple Industrial Design
const appleLPGAPal = [
  ["#015287", 0.5], // dark blue
  ["#a0997d", 0.2], // keyboard gray
  ["#7e7e5a", 0.2], // screen dark green
  ["#f5c928", 0.05], // yellow
  ["#df3a3e", 0.05], // red
  ["#55ba44", 0.025], // green
  ["#f4821f", 0.025], // orange
  ["#963d97", 0.025], // purple
  ["#079ddc", 0.025], // cyan
  ["#f4f4f4", 0.025], // white
]
const appleIPhone5CPal = [
  ["#44afe5", 0.2], // cyan  
  ["#91ee5f", 0.2], // green
  ["#fbf369", 0.2], // yellow
  ["#ef4e61", 0.2], // rose
  ["#f4f4f4", 0.2], // white
]
// Handheld Toys
const littleProfessorPal = [
  ["#9d5a4d", 0.25],  // book brown  
  ["#ffcc46", 0.2],   // case yellow
  ["#5e4f4c", 0.15],  // book dark brown 
  ["#983f54", 0.15],  // screen brown 
  ["#1d1b21", 0.1],   // black
  ["#ff95c6", 0.1],  // pink background
  ["#a6d1ec", 0.05],  // eyes light blue
  ["#396fad", 0.05],  // eyes blue
  ["#fc336b", 0.03],  // lcd red
]
const speakAndSpellPal = [
  ["#ee3900", 0.35], // case orange  
  ["#fed201", 0.2], // case yellow
  ["#090806", 0.2], // black
  ["#0257c4", 0.15], // case blue
  ["#fda304", 0.07], // button orange
  ["#8bfcff", 0.03], // lcd cyan
]
const gameboyPal = [
  ["#e8e0da", 0.55], // case gray  
  ["#cbe149", 0.15], // screen green
  ["#8e8c9a", 0.1], // frame gray
  ["#28262e", 0.075], // black
  ["#c15084", 0.075], // button crimson
  ["#9d9490", 0.03], // button gray
  ["#21249c", 0.02], // label blue
]
// Art
const isamuNoguchiPal = [
  ["#f4f4f4", 0.8], // white
  ["#f05163", 0.075], // red
  ["#7e5e45", 0.075], // brown
  ["#48b6f3", 0.02], // blue
  ["#faf784", 0.02], // yellow
  ["#f9904c", 0.01], // orange
  ["#101612", 0.005], // black
]