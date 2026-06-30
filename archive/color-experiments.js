// Archived from color.js + oklch2rgb.js (2026-06). Not loaded by index.html — see archive/README.md.
//
// Palette swatch UI + weighted palette constants for future projects.
// OKLCH ↔ RGB conversion (gist: dkaraush; color.js reference).
//
// Revive: copy sections into a new module or load this file in a dev index.html experiment page.
// Requires p5 DOM helpers (createDiv) and global R for randomColor().

// ── color.js (palette UI + constants) ─────────────────────────────────────────

// TODO: most of this should be abstracted into a single Class and saved for later projects

function swatch(x = 100, y = 100, color = "red", borderRadius = 0) {
  let div = createDiv()
    .size(x, y)
    .style("background-color", color)
    .style("border-radius", `${borderRadius}px`)
    .style("flex-grow", '1')
  return div
}

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

function createPalette(container, colors = [["white", 0.6], ["gray", 0.3], ["black", 0.1]], weighted = true, x = 100, y = 100, borderRadius = 0) {
  colors.forEach(color => {
    let swatch1 = swatch(x, y, color[0], borderRadius)
      .parent(container)
    if (weighted) {
      swatch1.style("flex", `${color[1]} 1 0`)
    }
  })
}

function createPalettes(parent, palettes = [], weighted = true, x = 100, y = 100, borderRadius = 0) {
  if (palettes.length > 0) {
    palettes.forEach(palette => {
      let palContainer = paletteContainer(parent)
      createPalette(palContainer, palette, weighted, x, y, borderRadius)
    })
  }
}

function createPaletteOld(container, x = 100, y = 100, borderRadius = 0, colors = ["white", "gray", "black"]) {
  colors.forEach(color => {
    swatch(x, y, color, borderRadius)
      .parent(container)
  })
}

function randomColor({ brightness = 100, alpha = .5 } = {}) {
  return color(`hsba(${R.random_int(0, 360)},100%, ${brightness}%, ${alpha})`)
}

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

const walkmanPal = [
  ["#ffec36", 0.7],
  ["#313332", 0.2],
  ["#171717", 0.1],
  ["#3f499e", 0.05],
  ["#a9b0b8", 0.04],
  ["#00b199", 0.02],
  ["#f55809", 0.01]
]
const raptorPal = [
  ["#212123", 0.4],
  ["#5c5a5b", 0.3],
  ["#e5000f", 0.2],
  ["#492761", 0.1],
  ["#ffc133", 0.05]
]
const tinkerPal = [
  ["#2b2b2d", 0.7],
  ["#fb9414", 0.1],
  ["#e83548", 0.1],
  ["#399157", 0.1],
  ["#434592", 0.1],
  ["#6dc491", 0.05]
]
const mTronPal = [
  ["#1e1c21", 0.35],
  ["#ff0d01", 0.35],
  ["#007b00", 0.15],
  ["#d2d4d1", 0.05],
  ["#f5cc00", 0.05],
  ["#49e307", 0.04],
  ["#ffff00", 0.04],
  ["#f4f4f4", 0.02]
]
const futuronPal = [
  ["#f4f4f4", 0.4],
  ["#0261a1", 0.3],
  ["#171810", 0.2],
  ["#b22d1c", 0.1],
  ["#0f68c4", 0.05],
  ["#fc3b2a", 0.025],
  ["#dfc401", 0.02],
  ["#c8af5b", 0.01],
  ["#238961", 0.01]
]
const classicSpacePal = [
  ["#c5c6c1", 0.35],
  ["#1e79d6", 0.3],
  ["#f4f4f4", 0.1],
  ["#e1b33f", 0.1],
  ["#dfc401", 0.05],
  ["#d12718", 0.05],
  ["#060b0f", 0.04],
  ["#118a47", 0.01],
]
const workbenchPal = [
  ["#0055aa", 0.7],
  ["#ffffff", 0.25],
  ["#ff8800", 0.2],
  ["#000022", 0.15]
]
const pinkCasioSK1Pal = [
  ["#ffe6ee", 0.4],
  ["#f4f4f4", 0.3],
  ["#aca09c", 0.2],
  ["#90daf0", 0.1],
  ["#007d9b", 0.05],
  ["#2b5a9e", 0.03],
  ["#3c393b", 0.03],
  ["#f06574", 0.02],
  ["#fff0a5", 0.01],
  ["#ffa78f", 0.005],
]
const appleLPGAPal = [
  ["#015287", 0.5],
  ["#a0997d", 0.2],
  ["#7e7e5a", 0.2],
  ["#f5c928", 0.05],
  ["#df3a3e", 0.05],
  ["#55ba44", 0.025],
  ["#f4821f", 0.025],
  ["#963d97", 0.025],
  ["#079ddc", 0.025],
  ["#f4f4f4", 0.025],
]
const appleIPhone5CPal = [
  ["#44afe5", 0.2],
  ["#91ee5f", 0.2],
  ["#fbf369", 0.2],
  ["#ef4e61", 0.2],
  ["#f4f4f4", 0.2],
]
const littleProfessorPal = [
  ["#9d5a4d", 0.25],
  ["#ffcc46", 0.2],
  ["#5e4f4c", 0.15],
  ["#983f54", 0.15],
  ["#1d1b21", 0.1],
  ["#ff95c6", 0.1],
  ["#a6d1ec", 0.05],
  ["#396fad", 0.05],
  ["#fc336b", 0.03],
]
const speakAndSpellPal = [
  ["#ee3900", 0.35],
  ["#fed201", 0.2],
  ["#090806", 0.2],
  ["#0257c4", 0.15],
  ["#fda304", 0.07],
  ["#8bfcff", 0.03],
]
const gameboyPal = [
  ["#e8e0da", 0.55],
  ["#cbe149", 0.15],
  ["#8e8c9a", 0.1],
  ["#28262e", 0.075],
  ["#c15084", 0.075],
  ["#9d9490", 0.03],
  ["#21249c", 0.02],
]
const isamuNoguchiPal = [
  ["#f4f4f4", 0.8],
  ["#f05163", 0.075],
  ["#7e5e45", 0.075],
  ["#48b6f3", 0.02],
  ["#faf784", 0.02],
  ["#f9904c", 0.01],
  ["#101612", 0.005],
]

// ── oklch2rgb.js (OKLCH color space) ─────────────────────────────────────────
// Source: https://gist.github.com/dkaraush/65d19d61396f5f3cd8ba7d1b4b3c9432

const multiplyMatrices = (A, B) => {
  return [
    A[0] * B[0] + A[1] * B[1] + A[2] * B[2],
    A[3] * B[0] + A[4] * B[1] + A[5] * B[2],
    A[6] * B[0] + A[7] * B[1] + A[8] * B[2]
  ]
}

const oklch2oklab = ([l, c, h]) => [
  l,
  isNaN(h) ? 0 : c * Math.cos(h * Math.PI / 180),
  isNaN(h) ? 0 : c * Math.sin(h * Math.PI / 180)
]
const oklab2oklch = ([l, a, b]) => [
  l,
  Math.sqrt(a ** 2 + b ** 2),
  Math.abs(a) < 0.0002 && Math.abs(b) < 0.0002 ? NaN : (((Math.atan2(b, a) * 180) / Math.PI % 360) + 360) % 360
]

const rgb2srgbLinear = rgb => rgb.map(c =>
  Math.abs(c) <= 0.04045 ?
    c / 12.92 :
    (c < 0 ? -1 : 1) * (((Math.abs(c) + 0.055) / 1.055) ** 2.4)
)
const srgbLinear2rgb = rgb => rgb.map(c =>
  Math.abs(c) > 0.0031308 ?
    (c < 0 ? -1 : 1) * (1.055 * (Math.abs(c) ** (1 / 2.4)) - 0.055) :
    12.92 * c
)

const oklab2xyz = lab => {
  const LMSg = multiplyMatrices([
    1, 0.3963377773761749, 0.2158037573099136,
    1, -0.1055613458156586, -0.0638541728258133,
    1, -0.0894841775298119, -1.2914855480194092,
  ], lab)
  const LMS = LMSg.map(val => val ** 3)
  return multiplyMatrices([
    1.2268798758459243, -0.5578149944602171, 0.2813910456659647,
    -0.0405757452148008, 1.1122868032803170, -0.0717110580655164,
    -0.0763729366746601, -0.4214933324022432, 1.5869240198367816
  ], LMS)
}
const xyz2oklab = xyz => {
  const LMS = multiplyMatrices([
    0.8190224379967030, 0.3619062600528904, -0.1288737815209879,
    0.0329836539323885, 0.9292868615863434, 0.0361446663506424,
    0.0481771893596242, 0.2642395317527308, 0.6335478284694309
  ], xyz)
  const LMSg = LMS.map(val => Math.cbrt(val))
  return multiplyMatrices([
    0.2104542683093140, 0.7936177747023054, -0.0040720430116193,
    1.9779985324311684, -2.4285922420485799, 0.4505937096174110,
    0.0259040424655478, 0.7827717124575296, -0.8086757549230774
  ], LMSg)
}
const xyz2rgbLinear = xyz => {
  return multiplyMatrices([
    3.2409699419045226, -1.537383177570094, -0.4986107602930034,
    -0.9692436362808796, 1.8759675015077202, 0.04155505740717559,
    0.05563007969699366, -0.20397695888897652, 1.0569715142428786
  ], xyz)
}
const rgbLinear2xyz = rgb => {
  return multiplyMatrices([
    0.41239079926595934, 0.357584339383878, 0.1804807884018343,
    0.21263900587151027, 0.715168678767756, 0.07219231536073371,
    0.01933081871559182, 0.11919477979462598, 0.9505321522496607
  ], rgb)
}

const oklch2rgb = lch =>
  srgbLinear2rgb(xyz2rgbLinear(oklab2xyz(oklch2oklab(lch))))
const rgb2oklch = rgb =>
  oklab2oklch(xyz2oklab(rgbLinear2xyz(rgb2srgbLinear(rgb))))

// be aware, oklch2rgb might return values out of bounds — clamp if needed.
// for gray colors, hue would be NaN
