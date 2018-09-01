const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const events = require('../../../state/events')
const storage = require('../../../util/storage')
const actions = require('../../../state/actions')

test('recents: get', (t) => {
  sinon.stub(storage.recentStorage, 'keys').returns([
    'a,b', 'a,c' // recipient lists
  ])
  const recents = actions.recents.get()
  const expected = [['a', 'b'], ['a', 'c']]
  t.deepEqual(recents, expected)

  storage.recentStorage.keys.restore()
})

test('recents: add', (t) => {
  const recipients = Immutable.Set(['a', 'b', 'c'])
  sinon.stub(storage.recentStorage, 'setItemSync')
  const listenerStub = sinon.stub()
  events.on('recents-changed', listenerStub)

  actions.recents.add(recipients)
  t.true(listenerStub.calledOnce)
  const expectedArgs = ['a,b,c', true]
  t.true(storage.recentStorage.setItemSync.calledWith(...expectedArgs))

  listenerStub.resetHistory()
  storage.recentStorage.setItemSync.restore()
})

test('recents: remove', (t) => {
  const recipients = ['a', 'b', 'c']
  sinon.stub(storage.recentStorage, 'removeItemSync')

  const listenerStub = sinon.stub()
  events.on('recents-changed', listenerStub)
  
  actions.recents.remove(recipients)
  t.true(listenerStub.calledOnce)
  t.true(storage.recentStorage.removeItemSync.calledWith('a,b,c'))

  listenerStub.resetHistory()
  storage.recentStorage.removeItemSync.restore()
})
