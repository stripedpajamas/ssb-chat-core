const Immutable = require('immutable')
const actions = require('../state/actions')
const constants = require('./constants')

const {
  authors,
  messages,
  me: meState
} = actions

const processor = (msg) => {
  const m = msg.value
  const me = meState.get()

  if (m && m.content) {
    switch (m.content.type) {
      case constants.MESSAGE_TYPE:
        messages.push({
          key: msg.key,
          author: m.author,
          authorName: () => authors.getName(m.author),
          action: m.content.action,
          private: m.private,
          recipients: Immutable.Set(m.content.recps || m.content.recipients), // backwards compatibility
          fromMe: m.author === me,
          text: m.content.text,
          timestamp: m.timestamp
        })
        break
      default:
        break
    }
  }
}

module.exports = processor
