const actions = require('../../state/actions')

const { sbot } = actions

module.exports = (invitation) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    if (client && invitation) {
      client.invite.accept(invitation, (err) => {
        if (err) return reject(err)
        resolve()
      })
    }
  })
}
