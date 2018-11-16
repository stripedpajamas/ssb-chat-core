const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test.serial('authors: setName sets a name', (t) => {
  const socialValue = sinon.stub().callsArgWith(1, null, 'pete')
  class Sbot { constructor () { this.about = { socialValue } } }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const id = 'me123'

  // it should also emit an event that authors have changed
  // so we will listen for that
  const listenerStub = sinon.stub()
  events.on('authors-changed', listenerStub)

  return actions.authors.setName(id)
    .then(() => {
      t.is(state.getIn(['authors', 'me123']), 'pete')
      t.true(listenerStub.calledOnce)
      listenerStub.resetHistory()
    })
})

test.serial('authors: setName only emits once for multiple calls', (t) => {
  const socialValue = sinon.stub().callsArgWith(1, null, 'a name')
  class Sbot { constructor () { this.about = { socialValue } } }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const listenerStub = sinon.stub()
  events.on('authors-changed', listenerStub)
  const ids = ['abc123', 'def456']
  return actions.authors.setName(ids).then(() => {
    t.true(listenerStub.calledOnce)
    listenerStub.resetHistory()
  })
})

test('authors: getName', (t) => {
  // should try to get the name from core state
  // if it can't it should call setName to update it
  // either way it should return something usable (id or name)
  state.set('authors', {
    me123: 'pete'
  })
  sinon.stub(actions.authors, 'setName')

  // name exists
  let name = actions.authors.getName('me123')
  t.is(name, 'pete')

  // name doesn't exist
  name = actions.authors.getName('you123')
  t.is(name, 'you123') // returns id
  // confirm that it called setName to get what it was missing
  t.true(actions.authors.setName.calledWith('you123'))
  actions.authors.setName.restore()
})

test('authors: bulkNames', (t) => {
  // like getName but with an array of names
  // doesn't return anything, just gets the names from sbot if needed
  state.set('authors', {
    me123: 'pete'
  })
  sinon.stub(actions.authors, 'setName')
  const names = ['me123', 'you123', 'her123']
  // we have one of these names in state
  // so we should be calling setName with an array of the other two only
  actions.authors.bulkNames(names)
  t.true(actions.authors.setName.calledWith([names[1], names[2]]))
  actions.authors.setName.restore()
})

test('authors: getId', (t) => {
  // takes in a name and finds an author on state with that name
  // returns id if found, name if not found
  state.set('authors', {
    me123: 'pete'
  })
  let id = actions.authors.getId('pete')
  t.is(id, 'me123') // found id
  id = actions.authors.getId('jill')
  t.is(id, 'jill') // did not find id
})

test('authors: findMatches', (t) => {
  // finds authors who have a name that starts with a partial
  state.set('authors', {
    me123: 'pete',
    you123: 'pegasus'
  })
  let matches = actions.authors.findMatches('p')
  let expected = ['pete', 'pegasus']
  t.deepEqual(matches, expected)

  matches = actions.authors.findMatches('j')
  expected = []
  t.deepEqual(matches, expected)
})

test('authors: get', (t) => {
  // get gets all authors on state
  const authors = { me123: 'pete', you123: 'fabian' }
  state.set('authors', authors)
  let stateAuthors = actions.authors.get() // Immutable
  t.true(Immutable.is(stateAuthors, Immutable.fromJS(authors)))

  // also has a JS method
  stateAuthors = actions.authors.getJS()
  t.deepEqual(stateAuthors, authors)
})

test('authors: updateFriends', (t) => {
  // gets friends object from sbot
  // puts it on state
  const friendsObj = {
    a: true, // following
    b: false, // blocking
    c: true // following
  }
  class Sbot {
    constructor () {
      this.friends = {
        get: (_, cb) => {
          cb(null, friendsObj)
        }
      }
    }
  }
  const sbot = new Sbot()
  state.set('me', 'me123')
  state.set('sbot', sbot)

  // expecting an event
  const listenerStub = sinon.stub()
  events.on('friends-changed', listenerStub)

  // also expecting it to call bulkNames
  sinon.stub(actions.authors, 'bulkNames')

  actions.authors.updateFriends()

  const friends = state.get('friends') // Immutable
  const following = friends.get('following')
  const blocking = friends.get('blocking')

  t.deepEqual(following.toJS(), ['a', 'c'])
  t.deepEqual(blocking.toJS(), ['b'])

  t.true(listenerStub.calledOnce)
  t.true(actions.authors.bulkNames.calledWith(['a', 'c', 'b']))

  listenerStub.resetHistory()
  actions.authors.bulkNames.resetHistory()

  // it shouldn't call anything or emit anything
  // if the sbot threw an error
  sbot.friends.get = (_, cb) => cb(new Error('blah'))
  actions.authors.updateFriends()
  t.true(listenerStub.notCalled)
  t.true(actions.authors.bulkNames.notCalled)

  listenerStub.resetHistory()
  actions.authors.bulkNames.restore()
})

test('authors: getFriends', (t) => {
  const friends = { following: ['a'], blocking: ['b'] }
  state.set('friends', friends)

  let stateFriends = actions.authors.getFriends()
  t.true(Immutable.is(stateFriends, Immutable.fromJS(friends)))

  // also has a JS method
  stateFriends = actions.authors.getFriendsJS()
  t.deepEqual(stateFriends, friends)
})
