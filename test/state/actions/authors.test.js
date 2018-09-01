const test = require('ava')
const sinon = require('sinon')
const Immutable = require('immutable')
const state = require('../../../state/index')
const events = require('../../../state/events')
const actions = require('../../../state/actions')

test('authors: setGoodName', (t) => {
  // takes in an id and an authors object and
  // determines the latest self-identification
  // or the latest identification by `me`,
  // preferring the latest identification by `me`.
  // `me` in this case is the id in `state.me`
  state.set('me', 'me123')
  const id = 'you123'
  const authors = {
    me123: {
      name: {
        me123: ['myself', 5], // who did it: ['what they did', 'when they did it']
        him234: ['pete', 6]
      }
    },
    you123: {
      name: {
        me123: ['you', 2],
        him234: ['someone', 3],
        you123: ['you123', 3]
      }
    }
  }
  actions.authors.setGoodName(id, authors)

  // we asked the action to find the name for 'you123' given the authors object
  // you123 was identified by me (me123) as 'you' and by themselves (you123) as 'you123'
  // this action should select my own identification of you123: 'you'. 
  t.is(state.getIn(['authors', id]), 'you')

  // if we remove the entry from authors that i set for you123
  delete authors.you123.name.me123
  // then the action should return you123's own identification of themselves (you123)

  actions.authors.setGoodName(id, authors)
  t.is(state.getIn(['authors', id]), 'you123')

  // if sbot has no abouts for someone that shouldn't be a problem
  // we will just use the id
  actions.authors.setGoodName('bad123', authors)
  t.is(state.getIn(['authors', 'bad123']), 'bad123')
})

test('authors: setName', (t) => {
  // this calls setGoodName with an authors object it gets from sbot
  // we will stub setGoodName so we know it gets called
  sinon.stub(actions.authors, 'setGoodName')
  const fakeAuthors = {
    me123: {},
    you123: {}
  }
  class Sbot {
    constructor () {
      this.about = {
        get: (cb) => { cb(null, fakeAuthors) }
      }
    }
  }
  const sbot = new Sbot()
  state.set('sbot', sbot)
  const id = 'me123'

  // it should also emit an event that authors have changed
  // so we will listen for that
  const listenerStub = sinon.stub()
  events.on('authors-changed', listenerStub)

  actions.authors.setName(id)

  let correctCalledWith = actions.authors.setGoodName.calledWith(id, fakeAuthors)
  t.true(correctCalledWith)
  t.true(listenerStub.calledOnce)

  actions.authors.setGoodName.resetHistory()
  listenerStub.resetHistory()

  // can also pass an array of ids to setName
  const ids = ['abc123', 'def456']
  actions.authors.setName(ids)

  correctCalledWith = actions
    .authors
    .setGoodName
    .firstCall
    .calledWith(ids[0], fakeAuthors) &&
  actions
  .authors
  .setGoodName
  .secondCall
  .calledWith(ids[1], fakeAuthors)

  t.true(correctCalledWith)
  t.true(listenerStub.calledOnce) // one event even for multiple updates
  actions.authors.setGoodName.resetHistory()
  listenerStub.resetHistory()

  // if there is an error from sbot
  // it won't call anything or emit anything
  sbot.about.get = (cb) => (new Error('bad'))
  state.set('sbot', sbot)
  actions.authors.setName(ids)
  t.true(actions.authors.setGoodName.notCalled)
  t.true(listenerStub.notCalled)

  listenerStub.resetHistory()
  actions.authors.setGoodName.restore()
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
