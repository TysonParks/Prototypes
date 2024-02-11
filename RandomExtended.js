// MIXIN: RandomExtended: mixin to add UID hash creation functionality to Random
const RandomExtended = {
  //METH: random_hash : default length 4 -> 16bit hash
  random_hash(length = 4, prefix = '0x') {
    let x = "0123456789abcdef", hash = prefix
    for (let i = length; i > 0; --i) {
      hash += x[Math.floor(this.random_dec() * x.length)]
    }
    return hash
  }
}