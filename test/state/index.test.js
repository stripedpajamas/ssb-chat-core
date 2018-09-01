const test = require('ava')
const Immutable = require('immutable')
const state = require('../../state')
const initialState = require('../../state/initialState')

test('state: has initial state', (t) => {
  t.true(Immutable.is(state.stateMap, initialState))
})

test('state: get: returns all state if no key passed in', (t) => {
  const allState = state.get()
  t.true(Immutable.is(allState, initialState))
})

test('state: get: throws if key is not a string', (t) => {
  t.throws(() => state.get([]))
})

test('state: get: splits key on . and returns state', (t) => {
  const timeWindow = state.get('options.timeWindow')
  const expected = initialState.getIn(['options', 'timeWindow'])
  t.is(timeWindow, expected)
})

test('state: getIn: if no path, returns all state', (t) => {
  const allState = state.getIn([])
  t.true(Immutable.is(allState, initialState))
})

test('state: getIn: throws if path is not an array', (t) => {
  t.throws(() => state.getIn('options.timeWindow'))
})

test('state: getIn: returns state at path', (t) => {
  const timeWindow = state.getIn(['options', 'timeWindow'])
  const expected = initialState.getIn(['options', 'timeWindow'])
  t.is(timeWindow, expected)
})

test('state: set: throws if key is not a string', (t) => {
  t.throws(() => state.set([]))
})

test('state: set: splits key on . and sets state', (t) => {
  state.set('options.timeWindow', 123)
  t.is(state.get('options.timeWindow'), 123)

  // make it what it was
  state.set('options.timeWindow', initialState.getIn(['options', 'timeWindow']))
})

test('state: setIn: throws if path is not an array', (t) => {
  t.throws(() => state.setIn('options.timeWindow'))
})

test('state: setIn: sets state at path', (t) => {
  state.setIn(['options', 'timeWindow'], 123)
  t.is(state.get('options.timeWindow'), 123)

  // make it what it was
  state.setIn(['options', 'timeWindow'], initialState.getIn(['options', 'timeWindow']))
})
