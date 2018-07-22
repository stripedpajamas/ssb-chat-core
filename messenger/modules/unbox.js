const actions = require('../../state/actions')

const { sbot } = actions

module.exports = (enc) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    if (client && enc) {
      client.private.unbox(enc, (err, content) => {
        if (err) return reject(err)
        resolve(content)
      })
    }
  })
}
