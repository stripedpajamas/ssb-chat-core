const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('me: getMe', (t) => {
  // returns the string in state
  state.set('me', 'me123')
  const me = actions.me.get()
  t.is(me, 'me123')
})

test('me: setMe', (t) => {
  // sets me in state
  // emits an event
  // gets all my names
  // sets those in state too
  const socialValues = sinon.stub().callsArgWith(1, null, {
    a: 'pete',
    b: 'squicc'
  })
  class Sbot { constructor () { this.about = { socialValues } } }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const listenerStub = sinon.stub()
  events.on('me-changed', listenerStub)
  events.on('my-names-changed', listenerStub)

  actions.me.set('me123')

  t.is(state.get('me'), 'me123')
  t.true(listenerStub.calledTwice)
  const myNames = state.get('myNames')
  t.true(Immutable.is(myNames, Immutable.fromJS([
    'pete',
    'squicc'
  ])))
})
test('me: setMe does not set any names if sbot errored', (t) => {
  const socialValues = sinon.stub().callsArgWith(1, new Error())
  class Sbot { constructor () { this.about = { socialValues } } }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const listenerStub = sinon.stub()
  events.on('me-changed', listenerStub)
  events.on('my-names-changed', listenerStub)
  actions.me.set('me123')
  t.true(Immutable.is(state.get('myNames'), Immutable.fromJS([])))
  t.true(listenerStub.calledTwice)
})

test('me: setMe will not set anything if sbot has no names', (t) => {
  const socialValues = sinon.stub().callsArgWith(1, null, {})
  class Sbot { constructor () { this.about = { socialValues } } }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const listenerStub = sinon.stub()
  events.on('me-changed', listenerStub)
  events.on('my-names-changed', listenerStub)
  actions.me.set('me123')
  t.true(Immutable.is(state.get('myNames'), Immutable.fromJS([])))
  t.true(listenerStub.calledTwice)
})

test('me: names', (t) => {
  // gets my names from state
  const myNames = ['pete', 'squicc']
  state.set('myNames', myNames)
  const stateMyNames = actions.me.names()
  t.true(Immutable.is(stateMyNames, Immutable.fromJS(myNames)))

  // also has a JS method
  t.deepEqual(actions.me.namesJS(), myNames)
})
