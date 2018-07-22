const actions = require('../../state/actions')
const constants = require('../../util/constants')

const { sbot, recipients: recipientsState } = actions

module.exports = ({ text, recipients, action }) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    const root = recipientsState.getPrivateRoot()
    // if we have the root, other ssb clients should see private chats grouped together

    // recipients always has me because it's populated by state.privateRecipients
    // so we shouldn't have any issue with not being able to read our own chats

    if (client && text) {
      client.private.publish({
        type: constants.MESSAGE_TYPE,
        text,
        recps: recipients,
        action,
        root
      }, recipients, (err, msg) => {
        if (err) return reject(err)
        resolve(msg)
      })
    }
  })
}
