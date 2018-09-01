const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('recipients: reset', (t) => {
  // empties from state, but saves last recipients
  state.set('privateRecipients', Immutable.Set([1, 2]))
  // since there are current recipients, it should set
  // lastPrivateRecipients

  const listenerStub = sinon.stub()
  events.on('recipients-changed', listenerStub)
  events.on('last-recipients-changed', listenerStub)

  actions.recipients.reset()
  const lastRecipients = state.get('lastPrivateRecipients')
  t.true(Immutable.is(lastRecipients, Immutable.Set([1, 2])))
  t.true(Immutable.is(state.get('privateRecipients'), Immutable.Set()))
  t.is(state.get('privateMessageRoot'), '') // resets root
  t.true(listenerStub.calledTwice)
  listenerStub.resetHistory()

  // if there are no current recipients
  // it shouldn't mess with last private
  actions.recipients.reset()
  t.true(Immutable.is(lastRecipients, Immutable.Set([1, 2])))
  t.true(listenerStub.calledOnce)
  listenerStub.resetHistory()
})

test('recipients: compare', (t) => {
  // compares to Immutable Sets
  let a = Immutable.Set([1, 2])
  let b = Immutable.Set([1, 2])
  let result = actions.recipients.compare(a, b)
  t.true(result)

  // if both aren't sets it bails
  a = [1, 2]
  b = [1, 2]
  result = actions.recipients.compare(a, b)
  t.false(result)

  // if they have different sizes it bails
  a = Immutable.Set([1, 2, 3])
  b = Immutable.Set([1, 2])
  result = actions.recipients.compare(a, b)
  t.false(result)

  // if they have different elements it fails
  a = Immutable.Set([1, 3])
  b = Immutable.Set([1, 2])
  result = actions.recipients.compare(a, b)
  t.false(result)

  // order doesn't matter
  a = Immutable.Set([2, 1])
  b = Immutable.Set([1, 2])
  result = actions.recipients.compare(a, b)
  t.true(result)
})

test('recipients: get', (t) => {
  const recipients = Immutable.Set([1, 2])
  state.set('privateRecipients', recipients)
  let stateRecipients = actions.recipients.get()

  t.true(Immutable.is(stateRecipients, recipients))

  // also has a JS method
  stateRecipients = actions.recipients.getJS()
  t.deepEqual(stateRecipients, [1, 2])
})

test('recipients: set', (t) => {
  // adds state.me and sorts before putting on state
  const recipients = ['a', 'c', 'b']
  state.set('me', 'me123')

  const listenerStub = sinon.stub()
  events.on('recipients-changed', listenerStub)
  // it will mark as read these recipients
  sinon.stub(actions.unreads, 'setAsRead')
  // it will add these recipients to recents
  sinon.stub(actions.recents, 'add')
  // it will switch to private mode
  sinon.stub(actions.mode, 'setPrivate')

  actions.recipients.set(recipients)

  const newRecps = state.get('privateRecipients')
  const expected = Immutable.OrderedSet(['a', 'b', 'c', 'me123'])
  t.true(Immutable.is(newRecps, expected))

  t.true(actions.unreads.setAsRead.calledOnce)
  t.true(actions.recents.add.calledOnce)

  listenerStub.resetHistory()
  actions.unreads.setAsRead.restore()
  actions.recents.add.restore()
  actions.mode.setPrivate.restore()
})

test('recipients: getNotMe', (t) => {
  const recipients = Immutable.Set(['me123', 'you123'])
  state.set('me', 'me123')
  state.set('privateRecipients', recipients)

  // this action also translates the ids to names
  sinon.stub(actions.authors, 'getName').returns('yourname')
  const notMe = actions.recipients.getNotMe()
  const expected = Immutable.Set(['yourname'])
  t.true(Immutable.is(notMe, expected))
})

test('recipients: getPrivateRoot', (t) => {
  state.set('privateMessageRoot', '123')
  const root = actions.recipients.getPrivateRoot()
  t.is(root, '123')
})

test('recipients: getLast', (t) => {
  const recps = Immutable.Set([1, 2, 3])
  state.set('lastPrivateRecipients', recps)
  const last = actions.recipients.getLast()
  t.true(Immutable.is(last, recps))
})
