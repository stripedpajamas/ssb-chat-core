const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const storage = require('../../../util/storage')
const actions = require('../../../state/actions')

test('storage: storeAsRead', (t) => {
  // stores an item on disk with a computed timestamp
  const msg = Immutable.Map({
    key: 'abc',
    timestamp: 10
  })
  sinon.stub(Date, 'now').returns(15)
  sinon.stub(actions.options, 'get').returns({
    get: () => 25
  })
  sinon.stub(storage.readStorage, 'setItemSync')

  // ttl = timestamp + timeWindow - now
  // stubbed that means ttl = 10 + 25 - 15 = 20
  actions.storage.storeAsRead(msg)
  const expectedArgs = [msg.get('key'), true, { ttl: 20 }]
  t.true(storage.readStorage.setItemSync.calledWith(...expectedArgs))

  Date.now.restore()
  actions.options.get.restore()
  storage.readStorage.setItemSync.restore()
})

test('storage: markFilteredMessagesRead', (t) => {
  // for each msg, call storeAsRead
  sinon.stub(actions.storage, 'storeAsRead')
  state.set('filteredMessages', [1, 2, 3])

  actions.storage.markFilteredMessagesRead()
  t.true(actions.storage.storeAsRead.calledThrice)

  actions.storage.storeAsRead.restore()
})

test('storage: hasThisBeenRead', (t) => {
  const msg = { key: 'abc' }
  sinon.stub(storage.readStorage, 'getItemSync')
  actions.storage.hasThisBeenRead(msg)
  t.true(storage.readStorage.getItemSync.calledWith('abc'))
  storage.readStorage.getItemSync.restore()
})
