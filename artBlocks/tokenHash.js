const lastHash = [
  '0xed2349ab96e79d0edb64691324e6e9644f3cc86bf419c4becb8d11c6f7c3f2a6',
  '0x811998ae3ce760ec27e5b6ee84e237c665bc5c04191a2d1f3b5dea69ae072902',
  '0x42f4928a9e3311ef52792da11b010b81f7d05f13df803ef2a3b903a1e6f5c002',
  '0xf804f6677a604cff4e4a7f1123766939b70134a2f316e6ced33bb6ebab439e9d',
  '0xd86c78f27b1f09427e6822f299e686e9f4a1290577fef2452863588801cb774d',
  '0x427b0e158b1680e27a2bcab752e8bbdf950cfaaa58f3219fb34b146e40bff81a',
  '0x63efc206700109c90ed1216dac1cea7928c303e7c2e9f5fa404a7a4b64da09f4',
  '0x938f4c571ad05d84e2656083e37a53918aec54de3f578799654aeb96322d61d9',
  '0xc5fd0df1da30246a413137a5d0f4373b2b1d059ec0db07f054032a48eb1854c2',
  '0x1b6403e6aaa76f99cc64b0cea04952acd8f03df4165154dc3b56f62ce72c46e5',
  '0x83e86b66a91234d80af13628dd1b532473c8f42f9ed9d254a22a91bb52c345c2',
  '0x20052e3a00f8b1573b1b77965d8b78ac29062f93d7863031e7f02a8193e90e59',
  '0xd37d10e583452d1afb6e83e2fbe4e2188a86c88a0da7be86c18465bd278873ce',
  '0x21ae4ca44ad6d2b197e8275fa58884e8a414be882efdf53db55218a34ca71633',
  '0x6b49b438078d9b40e28fcfa2e06e6e053d4381509d4bfb26b6e4ae4bf4e88507',
  '0xd2ebf525a16319a877d5005e5b14281732ddba15e5be3169fa743474a9485a89',
  '0x2a964a27631680cdeef43c077fab784010292b837174f809d86250d9db42f390',
  '0xc87a961d82956d8ebe7cb46341a7b2387c865527a7b93da344cb79cb12266ecb',
  '0x31ecf9802468183e9c88a2b784cd71ea7e671c10dd85045f65cb15efbc78d1c4',
  '0xb5d75d1c41ec1e4f3a9645d885888bbbaaaaf79dfff2c2853aedb2169a3a7294',
  '0xccd808d92ef4a00ac0e47c71108a68055f7e575d5c13ffbdaef319d22380c5f0',
  '0x9f15a4efffc8d5cd56ba1d8035ce004037a94a435dd4e39f75401bc5e949b4a0',
  '0x68c6ab01a7ebf021f77e654b80cb1eea49fc89db9aedf5a1d260ad962eff8159',
  '0xe35cba6c44d0cd5da528af82d63c0500e4743bcbd7518a3a961a2adeccfdccf8',
  '0x674b419be5901ede329f6887fb69e4026456fe5ca8a3aa147cda43f8327b5e31',
  '0xa4797764117cb8137caa6f99f11192e23bd79ec061e77058aa5ca6cc763b0308',
  '0x248c6beece0e5f32e75e95a68991b78a26920925cfd5dc0c545e6ba1b324c637',
  '0xa83e388c49803496572ab2275423875d12da4e6dfacf3af4969fbff3cffdf69a',
  '0x6e0eded31a94f4617ed70d6e32669ae2758d0a70bf65ab8f1c39d785d571b301',
  '0x77bc94de1098a001346978f86df70362878c0e843e48eaec8951e82fd114e54b',
  '0x2f4ee9f21c657d798fc8a539d66209a1c29ed860b1ef050e5be5f34c852b3992',
  '0x980cf84086a236373d37082de6b32f1bfe3cc0f763c14bec21f622563d9c976e',
  '0xe1b33a6695b6edd5ab21245e4a147fe1679a3a247730baf26a153613c2c87241',
  '0x0f5e931ced2f35c9b736364d15006bedd39440780bd9f7b81f7ef36d43e8a82d',
  '0x7e90837d5aaff387c0de61049db0e5ab7b8aba9d17cede6d8e5ae5ebaddfb9bb',
  '0xb797f9cd9d79c7f52652f47760ea52c9ef43539eb08da806372a4fa0bd81aa41',
  '0x389ead14f2044997ba719cc793069a368812cf0d5006d4be8c4628527f0d975b',
  '0x9bfbc05ac6a9b4f6b396f461030d2be97450dc8e5b80800e10b8fc0cacfd95df',
  '0x1b1c874fb4846bb901a31fa49b577e7d5523f602dfe8196fe97fd2f78cae4d56',
  '0xf53a91de5c6232c0568585e226f4d26be1ef8fd82f2802338161e97861dc82f2',
  '0xb4dd1522429de0f44dfff0f3bfee92a98b225d041ac918fc8dd92443965a5095',
  '0x7523e2852b34b7a99099392b02a06dc0d4cfc689ad256869a1992f0a17879470',
  '0x7fc6b32f8976f90b94616a958499c5bfc163332c82580edc7711e1cec37a5ab4',
  '0x4b8b1ceb34a805b15ed09aeafde25b3b629c39ef15ebe31965e2acb2c19753c3',
  '0x447ef6db8335c56217e8d9bd3cbda47f583cbbd03c5fbd07066b8c6cfa27ed9f',
  '0xfb875dcb71309371646808549f9db58b781ffa08b2a887b527770ef9a73c2357',
  '0x196e8edb2c330791a09aa7deaa260c464256fc34962d760b44c7ce8d82c05fd9',
  '0x51506bf2c672e2bd1abb47294f176852eb86053b60100fecebdb1979f5cf5c95',
  '0x0420413fa401151b5e83189e1d5f54832dac2e8738617e94032e7a91d92d3c8c',
  '0x7704ddd0189c4aa7c69a3766b00270998f997904f47f8f1dee6f2839a7265ef2',
  '0x43078f76b68902b735b03a13b6f3b174c19a7d181d640e408c04facba220e87c',
  '0xdbb2bb44b63866c9ad20d70fd0856496ff2fd447026ee3b23102d4643279070f',
  '0xbdd9a07fc1a906b72e4a2efbb662c1c701a797f8a5f74e77548987e6493b0d3f',
  '0xb90f13c54e7aeb9ed68ee25b0fcf6eb2677a9e705d50379c255f34fbbf5c4868',
  '0x880f8e37b5c1d809d4e742f924d49450c070b45c163aa0277e9c26e6e10684a3',
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