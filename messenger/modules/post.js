const actions = require('../../state/actions')
const constants = require('../../util/constants')

const { sbot } = actions

module.exports = ({ text, action }) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    if (client && text) {
      client.publish({ type: constants.MESSAGE_TYPE, text, action }, (err, msg) => {
        if (err) return reject(err)
        resolve(msg)
      })
    }
  })
}
