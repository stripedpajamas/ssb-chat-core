const test = require('ava')
const sinon = require('sinon')
const actions = require('../../../state/actions')
const constants = require('../../../util/constants')
const about = require('../../../messenger/modules/about')

const id = '@k9xSaKW2kc+Ko8Vx+xvFmVC5gEi/tIA2TpV6EBQ7MPw=.ed25519'
const otherId = '@ck2WKaSx9k+Ko8Vx+xvFmVC5gEi/tIA2TpV6EBQ7MPw=.ed25519'
const sbot = {
  publish: sinon.stub()
}

test.before(() => {
  sinon.stub(actions.sbot, 'get').returns(sbot)
  sinon.stub(actions.authors, 'getId')
  sinon.stub(actions.me, 'get')
})

test.after(() => {
  actions.sbot.get.restore()
  actions.authors.getId.restore()
  actions.me.get.restore()
})

test.afterEach(() => {
  sbot.publish.resetHistory()
})

test('modules: about: rejects if no client, target, or name', (t) => {
  return about().catch((e) => {
    t.is(e.message, 'client: [object Object] or target: undefined or name: undefined falsy')
  })
})

test('modules: about: publishes an about message for an id', (t) => {
  about('steve', otherId)
  t.true(sbot.publish.calledWith({
    type: constants.ABOUT,
    about: otherId,
    name: 'steve'
  }))
})

test('modules: about: gets id from state if name passed in', (t) => {
  actions.authors.getId.returns(otherId)
  about('steve', 'steven')
  t.true(sbot.publish.calledWith({
    type: constants.ABOUT,
    about: otherId,
    name: 'steve'
  }))
})

test('modules: about: publishes an about message for me if no id specified', (t) => {
  actions.me.get.returns(id)
  about('pete')
  t.true(sbot.publish.calledWith({
    type: constants.ABOUT,
    about: id,
    name: 'pete'
  }))
})

test('modules: about: resolves if publish successful', (t) => {
  sbot.publish.callsArgWith(1)
  return about('steve', 'steve123id')
    .then(() => {
      t.pass()
    })
})

test('modules: about: rejects if publish unsuccessful', (t) => {
  sbot.publish.callsArgWith(1, new Error('test err'))
  return about('steve', 'steve123id')
    .catch((e) => {
      t.is(e.message, 'test err')
    })
})
