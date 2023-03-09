const lastHash = [
  '0xed2349ab96e79d0edb64691324e6e9644f3cc86bf419c4becb8d11c6f7c3f2a6',
  '0x811998ae3ce760ec27e5b6ee84e237c665bc5c04191a2d1f3b5dea69ae072902',
  '0x42f4928a9e3311ef52792da11b010b81f7d05f13df803ef2a3b903a1e6f5c002',
]

function currentHash() {
  return testingControls.lastHash ? lastHash[testingControls.hashNumber] : random_hash()
}

// MARK: Hash Generation from https://github.com/ArtBlocks/artblocks-docs
function random_hash() {
  let x = "0123456789abcdef", hash = '0x'
  for (let i = 64; i > 0; --i) {
    hash += x[Math.floor(Math.random() * x.length)]
  }
  return hash
}

const tokenData = {
  // "hash": '0x42f4928a9e3311ef52792da11b010b81f7d05f13df803ef2a3b903a1e6f5c002',
  "hash": currentHash(),
  // "hash": random_hash(),
  "tokenId": "123000456"
}

// ----------------------------------------------
// hash transforms
const hash = tokenData.hash
const id = tokenData.tokenId
const hashArray = Array.from(hash)
const seed = parseInt(hash.slice(0, 16), 16)
const values64x4bit = hashArray
  .slice(2, 66)
  .map(x => parseInt(x, 16))
const values32x8bit = sliceHash(2)
const values21x12bit = sliceHash(3)
const values16x16bit = sliceHash(4)

function sliceHash(intoChunks = 2) {
  let p = []
  for (let i = 0; i < 64; i += intoChunks) {
    p.push(hash.slice(i + intoChunks, i + (intoChunks * 2)))
  }
  return p.map(x => parseInt(x, 16))
}


// MARK: CONSTANTS

const primes16 = [2, 3, 5, 7, 11, 13]

const primes256 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251] // 54/256 = 21.1%
const regularNumbers = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 27, 30, 32, 36, 40, 45, 48, 50, 54, 60, 64, 72, 75, 80, 81, 90, 96, 100, 108, 120, 125, 128, 135, 144, 150, 160, 162, 180, 192, 200, 216, 225, 240, 243, 250, 256] // 52/256 = 20.3%
const luckyNumbers = [1, 3, 7, 9, 13, 15, 21, 25, 31, 33, 37, 43, 49, 51, 63, 67, 69, 73, 75, 79, 87, 93, 99, 105, 111, 115, 127, 129, 133, 135, 141, 151, 159, 163, 169, 171, 189, 193, 195, 201, 205, 211, 219, 223, 231, 235, 237, 241] // 48/256 = 18.8%
const regularPrimes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 41, 43, 47, 53, 61, 71, 73, 79, 83, 89, 97, 107, 109, 113, 127, 137, 139, 151, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 239, 241, 251] // 44/256 = 17%
const higgsPrimes = [2, 3, 5, 7, 11, 13, 19, 23, 29, 31, 37, 43, 47, 53, 59, 61, 67, 71, 79, 101, 107, 127, 131, 139, 149, 151, 157, 173, 181, 191, 197, 199, 211, 223, 229] // 35/256 = 13.7%
const palindromes = [11, 22, 33, 44, 55, 66, 77, 88, 99, 101, 111, 121, 131, 141, 151, 161, 171, 181, 191, 202, 212, 222, 232, 242, 252] // 25/256 = 9.8%
const harmonicPrimes = [5, 13, 17, 23, 41, 67, 73, 79, 107, 113, 139, 149, 157, 179, 191, 193, 223, 239, 241, 251] // 20/256 = 7.8%
const circularPrimes = [2, 3, 5, 7, 11, 13, 17, 31, 37, 71, 73, 79, 97, 113, 131, 197, 199] // 17/256 = 6.6%
const emirps = [13, 17, 31, 37, 71, 73, 79, 97, 107, 113, 149, 157, 167, 179] // 14/256 = 5.5%
const happyPrimes = [7, 13, 19, 23, 31, 79, 97, 103, 109, 139, 167, 193, 239] // 13/256 = 5%
const palindromePrimes = [2, 3, 5, 11, 101, 131, 151, 181, 191, 313, 353, 373, 383, 727, 757, 787, 797, 919, 929] // 9/256 = 3.5%
const fiboPrimes = [2, 3, 5, 13, 89, 233] // 6/256 = 2.3%
const dihederalPrimes = [2, 5, 11, 101] // 5/256 = 2%

const hex5 = "0123456789abcdefghijklmnopqrstuv"

// MARK: FUNCTIONS

// FUNC: pointToHex5()
function pointToHex5(x, y) {
  return hex5[x] + hex5[y]
}

// FUNC: hex5ToPoint()
function hex5ToPoint(hexString) {
  let pair = Array.from(hexString)
  return [parseInt(pair[0], 32), parseInt(pair[1], 32)]
}

// FUNC: pointsToHex5s()
function pointsToHex5s(array = []) {
  let hashes = []
  for (e of array) {
    let hash = pointToHex5(e[0], e[1])
    hashes.push(hash)
  }
  return hashes
}

// TODO: check if this works and if I've already integrated into Grid Class or not
// FUNC: remapByIndex()
function remapByIndex(array, remap) {
  if (remap.length == array.length) {
    array = array.map((e, i) => [remap[i], array[i]])
      .sort((a, b) => a[0] - b[0])
      .map(e => e[1])
  }
  return array
}

// NOTE: DEPRECATE: moved to it's own file
// CLASS: Random
// Seeded Random numbers from https://github.com/ArtBlocks/artblocks-docs/tree/main/creator-onboarding/readme
// class Random {
//   constructor() {
//     this.useA = false;
//     let sfc32 = function (uint128Hex) {
//       let a = parseInt(uint128Hex.substr(0, 8), 16);
//       let b = parseInt(uint128Hex.substr(8, 8), 16);
//       let c = parseInt(uint128Hex.substr(16, 8), 16);
//       let d = parseInt(uint128Hex.substr(24, 8), 16);
//       return function () {
//         a |= 0; b |= 0; c |= 0; d |= 0;
//         let t = (((a + b) | 0) + d) | 0;
//         d = (d + 1) | 0;
//         a = b ^ (b >>> 9);
//         b = (c + (c << 3)) | 0;
//         c = (c << 21) | (c >>> 11);
//         c = (c + t) | 0;
//         return (t >>> 0) / 4294967296;
//       };
//     };
//     // seed prngA with first half of tokenData.hash
//     this.prngA = new sfc32(tokenData.hash.substr(2, 32));
//     // seed prngB with second half of tokenData.hash
//     this.prngB = new sfc32(tokenData.hash.substr(34, 32));
//     for (let i = 0; i < 1e6; i += 2) {
//       this.prngA();
//       this.prngB();
//     }
//   }
//   // random number between 0 (inclusive) and 1 (exclusive)
//   random_dec() {
//     this.useA = !this.useA;
//     return this.useA ? this.prngA() : this.prngB();
//   }
//   // random number between a (inclusive) and b (exclusive)
//   random_num(a, b) {
//     return a + (b - a) * this.random_dec();
//   }
//   // random integer between a (inclusive) and b (inclusive)
//   // requires a < b for proper probability distribution
//   random_int(a, b) {
//     return Math.floor(this.random_num(a, b + 1));
//   }
//   // random boolean with p as percent liklihood of true
//   random_bool(p) {
//     return this.random_dec() < p;
//   }
//   // random value in an array of items
//   random_choice(list) {
//     return list[this.random_int(0, list.length - 1)];
//   }
//   // NOTE: (my implementation) random hash (default length 4 -> 16bit)
//   random_hash(length = 4, prefix = '0x') {
//     let x = "0123456789abcdef", hash = prefix
//     for (let i = length; i > 0; --i) {
//       hash += x[Math.floor(this.random_dec() * x.length)]
//     }
//     return hash
//   }

// }