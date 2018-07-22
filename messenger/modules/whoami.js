const actions = require('../../state/actions')

const { sbot } = actions

module.exports = () => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    if (client) {
      client.whoami((err, id) => {
        if (err) return reject(err)
        resolve(id.id)
      })
    }
  })
}
