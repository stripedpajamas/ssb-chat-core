const actions = require('../state/actions')
const modules = require('./modules')

const { mode, recipients } = actions

const sendPrivateMessage = ({ text, action }) => new Promise((resolve, reject) => {
  return modules.private({ text, recipients: recipients.get(), action })
    .catch(() => reject(new Error('Could not send private message')))
})

const sendPublicMessage = ({ text, action }) => new Promise((resolve, reject) => {
  return modules.post({ text, action })
    .catch(() => reject(new Error('Failed to post message')))
})

module.exports = {
  sendMessage: (text) => {
    if (mode.isPrivate()) {
      return sendPrivateMessage({ text })
    }
    return sendPublicMessage({ text })
  },
  sendAction: (text) => {
    if (mode.isPrivate()) {
      return sendPrivateMessage({ text, action: true })
    }
    return sendPublicMessage({ text, action: true })
  },
  modules
}
