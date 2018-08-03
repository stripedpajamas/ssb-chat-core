const Immutable = require('immutable')
const actions = require('../state/actions')
const constants = require('./constants')
const modules = require('../messenger/modules')

const {
  authors,
  messages,
  me: meState
} = actions

const processor = (msg) => {
  const m = msg.value
  const me = meState.get()

  if (m && m.content) {
    // first see if we are dealing with an encrypted message
    if (typeof m.content === 'string' || m.private) {
      modules.unbox(m.content)
        .then((content) => {
          const decryptedMsg = msg
          decryptedMsg.value.content = content
          decryptedMsg.value.wasPrivate = true // so we can alter the ui
          return processor(decryptedMsg)
        })
        .catch(() => {}) // ignore failure to decrypt private messages
    }
    switch (m.content.type) {
      case constants.ABOUT:
        if (m.content.about && m.content.name) {
          // only honor self-identification or my own identification of someone else
          if (m.author === m.content.about || m.author === me) {
            authors.setName(m.content.about, m.content.name, m.author)
          }
        }
        break
      case constants.CONTACT:
        if (m.author === me) { // i did something
          if (typeof m.content.following !== 'undefined') {
            // i followed/unfollowed someone
            actions.authors.setFollowing(m.content.contact, m.content.following)
          } else if (typeof m.content.blocking !== 'undefined') {
            actions.authors.setBlock(m.content.contact, m.content.following)
          }
        } else { // someone else did something
          if (m.content.contact === me) {
            if (typeof m.content.following !== 'undefined') {
              actions.authors.setFollowingMe(m.author, m.content.following)
            }
          }
        }
        break
      case constants.MESSAGE_TYPE:
        messages.push({
          key: msg.key,
          author: m.author,
          authorName: () => authors.getName(m.author),
          action: m.content.action,
          private: m.wasPrivate,
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
