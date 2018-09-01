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
  const authors = {
    me123: {
      name: {
        happy0: ['abc', 1],
        jack: ['def', 2],
        me123: ['pete', 2]
      }
    }
  }
  class Sbot {
    constructor () {
      this.about = {
        get: (cb) => { cb(null, authors) }
      }
    }
  }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const listenerStub = sinon.stub()
  events.on('me-changed', listenerStub)
  events.on('my-names-changed', listenerStub)

  actions.me.set('me123')

  // me is set in state
  t.is(state.get('me'), 'me123')
  // events were emitted
  t.true(listenerStub.calledTwice)
  listenerStub.resetHistory()

  // my names are correct
  const myNames = state.get('myNames')
  t.true(Immutable.is(myNames, Immutable.fromJS([
    'abc',
    'def',
    'pete'
  ])))

  // it shouldn't set any names if sbot errored
  sbot.about.get = (cb) => cb(new Error('oh no'))
  actions.me.set('me123')
  t.true(Immutable.is(state.get('myNames'), Immutable.fromJS([])))
  t.true(listenerStub.calledTwice)
  listenerStub.resetHistory()

  // similarly we shouldn't get any names if we don't know them
  delete authors.me123
  sbot.about.get = (cb) => cb(null, authors)
  actions.me.set('me123')
  t.true(Immutable.is(state.get('myNames'), Immutable.fromJS([])))
  t.true(listenerStub.calledTwice)
  listenerStub.resetHistory()
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
