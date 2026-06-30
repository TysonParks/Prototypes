// CLASS: Store
// SIZE: 36 lines
class Store {
  constructor() {
    this.Frame = new ProtoStorage('frame', 1)
    this.Grids = new ProtoStorage('grd', 1)
    this.Cells = new ProtoStorage('cel')
    this.CellGroups = new ProtoStorage('celGrp', 1)
    this.ShapeGroups = new ProtoStorage('shpGrp', 2)
    this.Islands = new ProtoStorage('isl')
    this.Shapes = new ProtoStorage('shp')
    this.Cuts = new ProtoStorage('cut', 2)
    this.Effects = new ProtoStorage('fx', 2)
    // this.Segments = new ProtoStorage('seg')
    // this.Verts = new ProtoStorage('vert')
  }

  get allLayers() {
    return [
      ...this.Frame.db,
      ...this.Grids.db,
      ...this.CellGroups.db,
      ...this.ShapeGroups.db,
      ...this.Islands.db,
      ...this.Shapes.db,
      ...this.Cuts.db,
      ...this.Effects.db,
      // ...this.Cells.db,
    ]
      .map(e => e[1])
  }
  get offsetElts() { return this.Effects.db.flatMap(e => e[1].offsetElts) }
  // static shared() {
  //   if (!this.instance) {
  //     this.instance = new Store()
  //   }
  // }
}

// CLASS: ProtoStorage
// SIZE: 43 lines
class ProtoStorage {
  shortName
  #pad
  #db = new OpArray

  constructor(shortName, pad = 3) {
    this.shortName = shortName
    this.#pad = pad
  }

  //MARK: Computed
  get length() { return this.#db.length }
  get lastIndex() { return this.#db.lastIndex }
  get nextIndex() { return (this.lastIndex + 1).toString().padStart(this.#pad, '0') }
  get nextKey() { return `${this.shortName}${this.nextIndex}` }
  get db() { return this.#db }

  //MARK: Methods
  //METH: add() :
  add(value) {
    let nextKey = this.nextKey
    this.#db.push([nextKey, value])
    return nextKey
  }
  //METH: find() :
  find(callback) {
    for (let item of this.db) {
      if (callback(item[1])) return item[1]    // Return the first item that matches the condition 
    }
    return undefined                            // Return undefined if no matching item is found
  }
  //METH: item() :
  item({ index, key } = {}) {
    if (index && key) return
    if (index) return this.#db[index]
    if (key) return this.#db.find(e => e[0] === key)
  }
}

// MIXIN: Stored: protocol / mixin for storing objects to the ProtoStore Store
const Stored = {
  store: 'unassigned',
  id: 'unassigned',
  //METH: storeObject() :
  storeObject(store) {
    if (store) {
      this.store = store
      this.assignID()
    }
  },
  //METH: assignID() :
  assignID() { this.id = this.store.add(this) }
}

// MIXIN: Identifiable: protocol / mixin for assigning uids to objects
const Identifiable = {
  uid: 'unassigned',
  //METH: assignUID() :
  assignUID() { this.uid = RuID.random_hash() },
}

// MIXIN: IdentifiableStored: mixin composition of Stored and Identifiable
const IdentifiableStored = Object.assign({}, Stored, Identifiable)