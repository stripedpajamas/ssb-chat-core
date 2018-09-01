const test = require('ava')
const state = require('../../../state/index')
const actions = require('../../../state/actions')

test('sbot: get', (t) => {
  // returns sbot
  state.set('sbot', 'blah')
  t.is(actions.sbot.get(), 'blah')
})

test('sbot: set', (t) => {
  // sets sbot
  actions.sbot.set('blah')
  t.is(state.get('sbot'), 'blah')
})
