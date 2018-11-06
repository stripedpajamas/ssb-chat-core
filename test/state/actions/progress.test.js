const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('progress: get', (t) => {
  // returns progress from state
  const progress = { current: 1, target: 2 }
  state.set('progress', progress)
  const stateProgress = actions.progress.get()
  t.true(Immutable.is(stateProgress, Immutable.fromJS(progress)))

  // also has a JS option
  t.deepEqual(actions.progress.getJS(), progress)
})

test('progress: set', (t) => {
  // sets key val pair on state
  // also an event
  const listenerStub = sinon.stub()
  events.on('progress-changed', listenerStub)
  actions.progress.set({ current: 1, target: 2 })
  const val = state.get('progress')
  t.is(val.get('current'), 1)
  t.is(val.get('target'), 2)
  t.true(listenerStub.calledOnce)
})
