const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('unreads: add', (t) => {
  // pushes a recipients array to unreads in state
  let recps = [1, 2, 3]

  // it will emit an event
  const listenerStub = sinon.stub()
  events.on('unreads-changed', listenerStub)

  actions.unreads.add(recps)
  let unreads = state.get('unreads').toJS()
  t.deepEqual(unreads[0], recps)
  t.true(listenerStub.calledOnce)

  recps = [4, 5, 6]
  actions.unreads.add(recps) // should append
  unreads = state.get('unreads').toJS()
  t.deepEqual(unreads[1], recps)
  listenerStub.resetHistory()
})

test('unreads: get', (t) => {
  const unreads = [[1, 2, 3]]
  state.set('unreads', unreads)
  let stateUnreads = actions.unreads.get()
  t.true(Immutable.is(stateUnreads, Immutable.fromJS(unreads)))

  // also has a JS method
  stateUnreads = actions.unreads.getJS()
  t.deepEqual(stateUnreads, unreads)
})

test('unreads: getLast', (t) => {
  // just gets the last one
  const unreads = [[1, 2, 3], [2, 3, 4]]
  state.set('unreads', unreads)
  const last = actions.unreads.getLast()
  t.true(Immutable.is(last, Immutable.fromJS(unreads[1])))
})

test('unreads: setAsRead', (t) => {
  // removes a recipients array from unreads on state
  const recps = Immutable.Set([1, 2, 3])
  const unreads = [
    Immutable.Set([1, 2, 3]),
    Immutable.Set([2, 3, 4])
  ]
  state.set('unreads', unreads)

  sinon.stub(actions.storage, 'markFilteredMessagesRead')
  const listenerStub = sinon.stub()
  events.emit('unreads-changed', listenerStub)
  actions.unreads.setAsRead(recps)

  // t.true(listenerStub.calledOnce)
  const newUnreads = state.get('unreads').toJS()
  t.deepEqual(newUnreads, [unreads[1].toJS()])
  t.true(actions.storage.markFilteredMessagesRead.calledOnce)
  actions.storage.markFilteredMessagesRead.restore()
})
