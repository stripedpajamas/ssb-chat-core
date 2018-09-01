const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('options: get', (t) => {
  // returns options from state
  const options = { help: 'me' }
  state.set('options', options)
  const stateOptions = actions.options.get()
  t.true(Immutable.is(stateOptions, Immutable.fromJS(options)))

  // also has a JS option
  t.deepEqual(actions.options.getJS(), options)
})

test('options: setOptions', (t) => {
  // sets each option on state
  const optionsToSet = {
    a: 1,
    b: 2
  }
  sinon.stub(actions.options, 'set')
  actions.options.setOptions(optionsToSet)

  t.true(actions.options.set.calledTwice)
  t.true(actions.options.set.firstCall.calledWith('a', 1))
  t.true(actions.options.set.secondCall.calledWith('b', 2))
  actions.options.set.restore()
})

test('options: set', (t) => {
  // sets key val pair on state
  // also an event
  const listenerStub = sinon.stub()
  events.on('options-changed', listenerStub)
  actions.options.set('a', 1)
  const val = state.getIn(['options', 'a'])
  t.is(val, 1)
  t.true(listenerStub.calledOnce)
})
