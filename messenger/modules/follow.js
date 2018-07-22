const actions = require('../../state/actions')
const constants = require('../../util/constants')

const { sbot } = actions

module.exports = (id, follow) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()

    const following = !!follow

    if (client && id) {
      client.publish({ type: constants.CONTACT, contact: id, following }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    }
  })
}
