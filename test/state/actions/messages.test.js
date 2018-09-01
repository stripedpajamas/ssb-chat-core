const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')
const constants = require('../../../util/constants')

test('messages: addInPlace', (t) => {
  // inserts properly into state based on timestamp
  let msg = {
    timestamp: 5
  }
  let msgs = Immutable.List([
    Immutable.Map({ timestamp: 3 }),
    Immutable.Map({ timestamp: 4 }),
    Immutable.Map({ timestamp: 5 }),
    Immutable.Map({ timestamp: 6 })
  ])
  let expected = Immutable.List([
    Immutable.Map({ timestamp: 3 }),
    Immutable.Map({ timestamp: 4 }),
    Immutable.Map({ timestamp: 5 }),
    Immutable.Map(msg),
    Immutable.Map({ timestamp: 6 })
  ])
  state.set('messages', msgs)
  actions.messages.addInPlace(msg)
  t.true(Immutable.is(state.get('messages'), expected))

  // edge case: no messages in state
  state.set('messages', Immutable.List())
  expected = Immutable.List([
    Immutable.Map(msg)
  ])
  actions.messages.addInPlace(msg)
  t.true(Immutable.is(state.get('messages'), expected))

  // edge case: msg comes after last msg on state
  msgs = Immutable.List([
    Immutable.Map({ timestamp: 3 }),
    Immutable.Map({ timestamp: 4 })
  ])
  expected = Immutable.List([
    Immutable.Map({ timestamp: 3 }),
    Immutable.Map({ timestamp: 4 }),
    Immutable.Map(msg)
  ])
  state.set('messages', msgs)
  actions.messages.addInPlace(msg)
  t.true(Immutable.is(state.get('messages'), expected))
})

test('messages: get', (t) => {
  // returns filtered messages
  const filtered = Immutable.List(['a', 'b', 'c'])
  state.set('filteredMessages', filtered)
  let stateFiltered = actions.messages.get()
  t.true(Immutable.is(stateFiltered, filtered))

  // also has a JS method
  stateFiltered = actions.messages.getJS()
  t.deepEqual(stateFiltered, ['a', 'b', 'c'])
})

test('messages: refreshFiltered', (t) => {
  // updates filtered messages based on current mode
  // and current private recipients
  const msgs = Immutable.List([
    Immutable.Map({ text: 'blah',
      private: true,
      recipients: Immutable.Set([
        'a', 'b'
      ]) }),
    Immutable.Map({ text: 'blegh',
      private: true,
      recipients: Immutable.Set([
        'a', 'b'
      ]) }),
    Immutable.Map({ text: 'pubpub1' }),
    Immutable.Map({ text: 'boop',
      private: true,
      recipients: Immutable.Set([
        'a', 'c'
      ]) }),
    Immutable.Map({ text: 'pubpub2' })
  ])
  state.set('messages', msgs)
  const listenerStub = sinon.stub()
  events.on('messages-changed', listenerStub)

  // get only public messages
  state.set('mode', constants.MODE.PUBLIC)
  actions.messages.refreshFiltered()
  let filtered = state.get('filteredMessages')
  let expected = Immutable.List([
    Immutable.Map({ text: 'pubpub1' }),
    Immutable.Map({ text: 'pubpub2' })
  ])
  t.true(listenerStub.calledOnce)
  t.true(Immutable.is(filtered, expected))
  listenerStub.resetHistory()

  // get only private msgs from a,b
  state.set('privateRecipients', Immutable.OrderedSet(['a', 'b']))
  state.set('mode', constants.MODE.PRIVATE)
  actions.messages.refreshFiltered()
  filtered = state.get('filteredMessages')
  expected = Immutable.List([
    Immutable.Map({ text: 'blah',
      private: true,
      recipients: Immutable.Set([
        'a', 'b'
      ]) }),
    Immutable.Map({ text: 'blegh',
      private: true,
      recipients: Immutable.Set([
        'a', 'b'
      ]) })
  ])
  t.true(listenerStub.calledOnce)
  t.true(Immutable.is(filtered, expected))
  listenerStub.resetHistory()
})

test('messages: push', (t) => {
  // calls add in place and refresh filtered
  sinon.stub(actions.messages, 'addInPlace')
  sinon.stub(actions.messages, 'refreshFiltered')
  let msg = {}
  actions.messages.push(msg)
  t.true(actions.messages.addInPlace.calledOnce)
  t.true(actions.messages.refreshFiltered.calledOnce)

  // if messages is private
  // we check to see if we are in private mode
  // and if we don't already have a private root set
  msg = { private: true, key: 'abc', recipients: {} }
  state.set('mode', constants.MODE.PRIVATE)
  actions.messages.push(msg)
  let root = state.get('privateMessageRoot')
  t.is(root, 'abc')

  // now that we have a message root, it should not update it
  msg = { private: true, key: 'def', recipients: {} }
  actions.messages.push(msg)
  root = state.get('privateMessageRoot')
  t.is(root, 'abc')

  // now we see if there are recipients and it wasn't sent by us
  // we check if these recipients have already been marked as unread
  // if they haven't we check to see if the msg has been read in storage
  // if it hasn't, we add the recipients to unreads and recents
  // a lot of branches to check
  state.set('me', 'a')
  msg = {
    private: true,
    key: 'hij',
    recipients: Immutable.Set([
      'a', 'b'
    ]),
    author: 'b'
  }
  // these are the actions that will potentially be called
  sinon.stub(actions.unreads, 'add')
  sinon.stub(actions.recents, 'add')
  sinon.stub(actions.storage, 'hasThisBeenRead')

  // first branch: current unreads contain these recipients
  // i am 'a', so recipients = b
  // unreads.add and recents.add should not be called
  state.set('unreads', Immutable.List([
    Immutable.Set(['b'])
  ]))
  actions.messages.push(msg)
  t.true(actions.unreads.add.notCalled)
  t.true(actions.recents.add.notCalled)

  // second branch: current unreads does not contain the recps
  // but the msg is marked in storage as read
  // unreads.add and recents.add should not be called
  state.set('unreads', Immutable.List())
  actions.storage.hasThisBeenRead.returns(true)
  actions.messages.push(msg)
  t.true(actions.unreads.add.notCalled)
  t.true(actions.recents.add.notCalled)

  // third branch: current unreads does not contain the recps
  // msg is not marked in storage as read
  // unreads.add and recents.add should be called
  state.set('unreads', Immutable.List())
  actions.storage.hasThisBeenRead.returns(false)
  actions.messages.push(msg)
  t.true(actions.unreads.add.calledOnce)
  t.true(actions.recents.add.calledOnce)

  // cleanup
  actions.messages.addInPlace.restore()
  actions.messages.refreshFiltered.restore()
  actions.storage.hasThisBeenRead.restore()
})
