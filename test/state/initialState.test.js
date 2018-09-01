const test = require('ava')
const Immutable = require('immutable')
const initialState = require('../../state/initialState')

test('initialState: is a map', (t) => {
  t.true(Immutable.Map.isMap(initialState))
})

test('initialState: sbot is a func', (t) => {
  const sbot = initialState.get('sbot')
  t.true(typeof sbot === 'function')
  t.true(typeof sbot() === 'undefined')
})
