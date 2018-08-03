const actions = require('../../state/actions')
const constants = require('../../util/constants')

const { sbot } = actions

module.exports = (id, block) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()

    const blocking = !!block

    if (client && id) {
      client.publish({ type: constants.CONTACT, contact: id, blocking }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    }
  })
}
