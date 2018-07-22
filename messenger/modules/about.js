const ref = require('ssb-ref')
const actions = require('../../state/actions')
const constants = require('../../util/constants')

const { authors, me, sbot } = actions

module.exports = (name, who) => {
  return new Promise((resolve, reject) => {
    const client = sbot.get()
    const myId = me.get()
    let target = who || myId

    // if this is a name and not an id, look up the id in our author map
    if (!ref.isFeedId(target)) {
      target = authors.getId(target)
    }

    if (client && target && name) {
      client.publish({ type: constants.ABOUT, about: target, name }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    }
  })
}
