// CLASS: Store
// SIZE: 36 lines
class Store {
  constructor() {
    this.Frame = new ProtoStorage('frame', 1)
    // this.Layers = new ProtoStorage('layr', 1)
    this.Grids = new ProtoStorage('grd', 1)
    this.Cells = new ProtoStorage('cel')
    this.CellGroups = new ProtoStorage('celGrp', 1)
    this.ShapeGroups = new ProtoStorage('shpGrp', 2)
    this.Islands = new ProtoStorage('isl')
    this.Shapes = new ProtoStorage('shp')
    // this.Segments = new ProtoStorage('seg')
    // this.Verts = new ProtoStorage('vert')

    // this.Grammars = new ProtoStorage('grmr', 2)
    // this.Looks = new ProtoStorage('look', 2)
    // this.Actions = new ProtoStorage('axn')
    this.Cuts = new ProtoStorage('cut', 2)
    this.Effects = new ProtoStorage('fx', 2)
    // this.ElmtGroups = new ProtoStorage('eltGrp', 4)
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
    // let alreadyAssigned = this.#db.findIndex(e => ProtoLayer.equal(e, value))
    // if (alreadyAssigned) {
    //   return alreadyAssigned.idq
    // } else {
    let nextKey = this.nextKey
    this.#db.push([nextKey, value])
    return nextKey
    // }
  }
  //METH: remove() :
  remove(key) {
    let index = this.#db.findIndex(e => e[0] === key)
    if (index) { this.#db.splice(index, 1) }
  }
  find(callback) {
    for (let item of this.db) {
      if (callback(item[1])) {
        return item[1]  // Return the first item that matches the condition
      }
    }
    return undefined // Return undefined if no matching item is found
  }
  //METH: named() :
  named(id) { return this.item({ key: id }) }
  //METH: random() :
  random(count = 1) {
    let items = rangeArray(1, count)
    return items.map(e => this.#db[R.random_int(0, this.lastIndex)])
  }
  //METH: item() :
  item({ index, key } = {}) {
    if (arguments.length === 0) { return this.random(1) }
    if (index && key) { return }
    if (index) { return this.#db[index] }
    if (key) { return this.#db.find(e => e[0] === key) }
  }
}

// MIXIN: Stored: protocol / mixin for storing objects to the ProtoStore Store
const Stored = {
  store: 'unassigned',
  id: 'unassigned',
  //METH: storeObject() :
  storeObject(store, checkFirst = false) {
    if (store) {
      this.store = store
      // if (checkFirst) {
      //   const match = this.store.db.find(item => {
      //     // console.log(`checkFirst item.breed`, item.last.breed)
      //     // console.log(`checkFirst this.breed`, this.breed)
      //     // console.log(`checkFirst manual check`, item.last.breed === this.breed)
      //     return this.equals(item.last)
      //   })
      //   // console.error(`ProtoCut Match!`, match)
      //   // console.error(`ProtoCut store!`, this.store.db)
      //   // console.error(`ProtoCut this!`, this)
      //   // console.error(`ProtoCut store.first!`, this.store.db.first?.last)
      //   if (match) {
      //     // console.error(`ProtoCut Match!`, match)
      //     // this.isDuplicate = true
      //     this = match
      //     // return match
      //     // this.assignID()
      //   } else {
      //     // this.isDuplicate = undefined
      //     this.assignID()
      //   }
      //   // store.db.forEach(item => {
      //   //   const match = this.equals(item[1])
      //   //   if (match) {
      //   //     // this = match
      //   //     this.isDuplicate = true
      //   //     return
      //   //   } else {
      //   //     this.assignID()
      //   //   }
      //   // })
      // } else {
      //   // this.isDuplicate = false
      this.assignID()
      // }

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

  equals(identifiable) { return this.uid === identifiable.uid }
}

// MIXIN: IdentifiableStored: mixin composition of Stored and Identifiable
const IdentifiableStored = Object.assign({}, Stored, Identifiable)


