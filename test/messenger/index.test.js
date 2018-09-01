const test = require('ava')
const sinon = require('sinon')
const actions = require('../../state/actions')
const modules = require('../../messenger/modules')
const messenger = require('../../messenger')

test.before(() => {
  sinon.stub(actions.mode, 'isPrivate')
  sinon.stub(actions.recipients, 'get')
  sinon.stub(modules, 'post')
  sinon.stub(modules, 'private')
})

test.after(() => {
  actions.mode.isPrivate.restore()
  actions.recipients.get.restore()
  modules.post.restore()
  modules.private.restore()
})

test('messenger: sendMessage: sends public message by default', (t) => {
  actions.mode.isPrivate.returns(false)
  modules.post.resolves()

  return messenger.sendMessage('test message')
    .then(() => {
      t.true(modules.post.calledWith({
        text: 'test message', action: undefined
      }))
    })
})

test('messenger: sendMessage: sends private message if in private mode', (t) => {
  actions.mode.isPrivate.returns(true)
  actions.recipients.get.returns(['a', 'b'])
  modules.private.resolves()

  return messenger.sendMessage('test message')
    .then(() => {
      t.true(modules.private.calledWith({
        text: 'test message',
        recipients: ['a', 'b'],
        action: undefined
      }))
    })
})

test('messenger: sendMessage: catches errors from modules.post', (t) => {
  actions.mode.isPrivate.returns(false)
  modules.post.rejects()

  return messenger.sendMessage('test message')
    .catch((e) => {
      t.true(modules.post.calledWith({
        text: 'test message',
        action: undefined
      }))
      t.is(e.message, 'Failed to post message')
    })
})

test('messenger: sendMessage: catches errors from modules.private', (t) => {
  actions.mode.isPrivate.returns(true)
  actions.recipients.get.returns(['a', 'b'])
  modules.private.rejects()

  return messenger.sendMessage('test message')
    .catch((e) => {
      t.true(modules.private.calledWith({
        text: 'test message',
        recipients: ['a', 'b'],
        action: undefined
      }))
      t.is(e.message, 'Could not send private message')
    })
})

test('messenger: sendAction: sends public action by default', (t) => {
  actions.mode.isPrivate.returns(false)
  modules.post.resolves()

  return messenger.sendAction('test action')
    .then(() => {
      t.true(modules.post.calledWith({
        text: 'test action', action: true
      }))
    })
})

test('messenger: sendAction: sends private action if in private mode', (t) => {
  actions.mode.isPrivate.returns(true)
  actions.recipients.get.returns(['a', 'b'])
  modules.private.resolves()

  return messenger.sendAction('test action')
    .then(() => {
      t.true(modules.private.calledWith({
        text: 'test action',
        recipients: ['a', 'b'],
        action: true
      }))
    })
})
