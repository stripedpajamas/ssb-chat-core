const Immutable = require('immutable')
const initialState = require('./initialState')

class CoreState {
  constructor () {
    this.stateMap = initialState
  }

  get (key = null) {
    if (key === null) {
      return this.stateMap
    }
    if (typeof key !== 'string') {
      throw new Error('key must be string.')
    }
    const pathArray = key.split('.')
    return this.stateMap.getIn(pathArray)
  }

  getIn (path) {
    if (!path.length) {
      return this.stateMap
    }
    if (!Array.isArray(path)) {
      throw new Error('path must be array.')
    }
    return this.stateMap.getIn(path)
  }

  set (key, value) {
    if (typeof key !== 'string') {
      throw new Error('key must be string.')
    }
    const pathArray = key.split('.')
    this.stateMap = this.stateMap.setIn(pathArray, Immutable.fromJS(value))
  }

  setIn (path, value) {
    if (!Array.isArray(path)) {
      throw new Error('path must be array')
    }
    this.stateMap = this.stateMap.setIn(path, Immutable.fromJS(value))
  }
}

module.exports = new CoreState()
