// CLASS: Store
class Store {
  constructor() {
    this.Frame = new ProtoStorage('frame', 1)
    this.Layers = new ProtoStorage('layr', 1)
    this.Grids = new ProtoStorage('grd', 2)
    this.Cells = new ProtoStorage('cell')
    this.Groups = new ProtoStorage('grp')
    this.Islands = new ProtoStorage('isle')
    this.Shapes = new ProtoStorage('shp')
    this.Segments = new ProtoStorage('seg')
    this.Verts = new ProtoStorage('vert')

    this.Grammars = new ProtoStorage('grmr', 2)
    this.Looks = new ProtoStorage('look', 2)
    this.Actions = new ProtoStorage('axn')
    this.Effects = new ProtoStorage('fx')
  }

  get allLayers() {
    return [...this.Frame.db, ...this.Grids.db, ...this.Groups.db, ...this.Islands.db, ...this.Shapes.db, ...this.Cells.db,]
      .map(e => e[1])
  }
  // static shared() {
  //   if (!this.instance) {
  //     this.instance = new Store()
  //   }
  // }
}

// CLASS: ProtoStorage
class ProtoStorage {
  shortName
  #pad
  #db = new OpArray
  constructor(shortName, pad = 3) {
    this.shortName = shortName
    this.#pad = pad
  }

  get length() { return this.#db.length }
  get lastIndex() { return this.#db.lastIndex }
  get nextIndex() { return (this.lastIndex + 1).toString().padStart(this.#pad, '0') }
  get nextKey() { return `${this.shortName}${this.nextIndex}` }
  get db() { return this.#db }

  add(value) {
    // let alreadyAssigned = this.#db.findIndex(e => ProtoLayer.equal(e, value))
    // if (alreadyAssigned) {
    //   return alreadyAssigned.idq
    // } else {
    let nextKey = this.nextKey
    this.#db.push([nextKey, value])
    return nextKey
    // }
  }
  remove(key) {
    let index = this.#db.findIndex(e => e[0] === key)
    if (index) { this.#db.splice(index, 1) }
  }

  named(id) { return this.item({ key: id }) }

  random(count = 1) {
    let items = rangeArray(1, count)
    return items.map(e => this.#db[R.random_int(0, this.lastIndex)])
  }

  item({ index, key } = {}) {
    if (arguments.length === 0) { return this.random(1) }
    if (index && key) { return }
    if (index) { return this.#db[index] }
    if (key) { return this.#db.find(e => e[0] === key) }
  }
}




