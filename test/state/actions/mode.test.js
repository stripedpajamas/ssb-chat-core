const test = require('ava')
const sinon = require('sinon')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')
const constants = require('../../../util/constants')

test('mode: getMode', (t) => {
  // returns mode from state
  state.set('mode', 'public')
  const mode = actions.mode.get()
  t.is(mode, 'public')
})

test('mode: setPublic', (t) => {
  // sets mode to public
  // resets recipients
  // refilters messages
  // emits an event
  const listenerStub = sinon.stub()
  sinon.stub(actions.recipients, 'reset')
  sinon.stub(actions.messages, 'refreshFiltered')
  events.on('mode-changed', listenerStub)

  actions.mode.setPublic()
  t.is(state.get('mode'), constants.MODE.PUBLIC)
  t.true(actions.recipients.reset.calledOnce)
  t.true(actions.messages.refreshFiltered.calledOnce)
  t.true(listenerStub.calledOnce)
  listenerStub.resetHistory()
  actions.messages.refreshFiltered.restore()
  actions.recipients.reset.restore()
})

test('mode: setPrivate', (t) => {
  // sets mode to private
  // refreshes message filters
  // tries to get set private message root
  // marks filtered messages as read
  // emits an event

  const listenerStub = sinon.stub()
  sinon.stub(actions.messages, 'refreshFiltered')
  const lastMessageStub = sinon.stub()
  sinon.stub(actions.messages, 'get').returns({
    last: lastMessageStub
  })
  lastMessageStub.returns({
    get: () => 'last message key'
  })
  events.on('mode-changed', listenerStub)

  actions.mode.setPrivate()
  t.is(state.get('mode'), constants.MODE.PRIVATE)
  t.true(actions.messages.refreshFiltered.calledOnce)
  t.is(state.get('privateMessageRoot'), 'last message key')
  t.true(listenerStub.calledOnce)
  listenerStub.resetHistory()
  actions.messages.get.restore()
  actions.messages.refreshFiltered.restore()
})

test('mode: isPrivate', (t) => {
  // returns true if private
  state.set('mode', constants.MODE.PRIVATE)
  t.true(actions.mode.isPrivate())
  state.set('mode', constants.MODE.PUBLIC)
  t.false(actions.mode.isPrivate())
})
