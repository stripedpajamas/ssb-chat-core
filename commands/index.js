const ref = require('ssb-ref')
const constants = require('../util/constants')
const actions = require('../state/actions')
const state = require('../state')
const messenger = require('../messenger')

const { authors, options, unreads, recipients, mode } = actions

module.exports = {
  // a debug option to look up a state path
  state: (path) => new Promise((resolve, reject) => {
    if (options.get().get('debug')) {
      return resolve({ command: true, result: state.get(path) })
    }
  }),
  block: (id) => new Promise((resolve, reject) => {
    if (!id) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.BAD_ARGS })
    }

    const realId = authors.getId(id)

    if (!ref.isFeedId(realId)) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.NO_ID })
    }

    return messenger.modules.block(realId, true)
      .then(() => {
        // update friends now that this has happened
        authors.updateFriends()
        resolve({ command: true, result: `Blocked ${id}` })
      })
      .catch(() => reject(new Error(`Could not block ${id}`)))
  }),
  follow: (id) => new Promise((resolve, reject) => {
    if (!id) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.BAD_ARGS })
    }

    const realId = authors.getId(id)

    if (!ref.isFeedId(realId)) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.NO_ID })
    }

    return messenger.modules.follow(realId, true)
      .then(() => {
        // update friends now that this has happened
        authors.updateFriends()
        resolve({ command: true, result: `Followed ${id}` })
      })
      .catch(() => reject(new Error(`Could not follow ${id}`)))
  }),
  identify: (id, name) => new Promise((resolve, reject) => {
    if (!id || !name) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.IDENTIFY.BAD_ARGS })
    }

    return messenger.modules.about(name, id)
      .then(() => {
        // if i identified someone, update their name in state
        authors.setName(id)
        resolve({ command: true, result: constants.COMMAND_TEXT.NAME.SUCCESS })
      })
      .catch(() => reject(new Error(constants.COMMAND_TEXT.NAME.FAILURE)))
  }),
  me: (status) => new Promise((resolve, reject) => {
    // send action message
    return messenger.sendAction(status)
      .then(() => resolve({ command: true }))
      .catch((e) => reject(e))
  }),
  nick: (name) => new Promise((resolve, reject) => {
    if (!name) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.NAME.BAD_ARGS })
    }

    return messenger.modules.about(name)
      .then(() => {
        // if i renamed myself, update my name in state
        authors.setName(actions.me.get())
        resolve({ command: true, result: constants.COMMAND_TEXT.NAME.SUCCESS })
      })
      .catch(() => reject(new Error(constants.COMMAND_TEXT.NAME.FAILURE)))
  }),
  unreads: () => new Promise((resolve, reject) => {
    const unread = unreads
      .get()
      .map(recps => recps.map(authors.getName).join(', '))
      .join('; ')
    const unreadText = `Unread messages from: ${unread}`
    return resolve({ command: true, result: unread ? unreadText : 'No unread messages' })
  }),
  private: (recps) => new Promise((resolve, reject) => {
    if (!recps.length) {
      return reject(new Error(constants.COMMAND_TEXT.PRIVATE.NO_RECIPIENTS))
    }
    if (recps.length > 6) {
      return reject(new Error(constants.COMMAND_TEXT.PRIVATE.TOO_MANY_RECIPIENTS))
    }
    const ids = recps.map(authors.getId)
    if (!ids.every(id => ref.isFeedId(id))) {
      return reject(new Error(constants.COMMAND_TEXT.PRIVATE.INVALID_FEED_IDS))
    }
    recipients.set(ids)
    return resolve({ command: true })
  }),
  pub: (invite) => new Promise((resolve, reject) => {
    if (!invite) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.PUB.BAD_ARGS })
    }

    // attempt to join with the supplied invite code
    return messenger.modules.invite(invite)
      .then(() => resolve({ command: true, result: constants.COMMAND_TEXT.PUB.SUCCESS }))
      .catch(() => reject(new Error(constants.COMMAND_TEXT.PUB.FAILURE)))
  }),
  quit: () => new Promise((resolve, reject) => {
    if (!mode.isPrivate()) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.QUIT.FROM_PUBLIC })
    }
    mode.setPublic()
    return resolve({ command: true })
  }),
  say: (something) => new Promise((resolve, reject) => {
    // send message
    return messenger.sendMessage(something)
      .then(() => resolve({ command: true }))
      .catch((e) => reject(e))
  }),
  unblock: (id) => new Promise((resolve, reject) => {
    if (!id) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.BAD_ARGS })
    }

    const realId = authors.getId(id)

    if (!ref.isFeedId(realId)) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.NO_ID })
    }

    return messenger.modules.block(realId, false)
      .then(() => {
        // update friends now that this has happened
        authors.updateFriends()
        resolve({ command: true, result: `Unblocked ${id}` })
      })
      .catch(() => reject(new Error(`Could not unblock ${id}`)))
  }),
  unfollow: (id) => new Promise((resolve, reject) => {
    if (!id) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.BAD_ARGS })
    }

    const realId = authors.getId(id)

    if (!ref.isFeedId(realId)) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.FOLLOW.NO_ID })
    }

    return messenger.modules.follow(realId, false)
      .then(() => {
        // update friends now that this has happened
        authors.updateFriends()
        resolve({ command: true, result: `Unfollowed ${id}` })
      })
      .catch(() => reject(new Error(`Could not unfollow ${id}`)))
  }),
  whoami: () => new Promise((resolve, reject) => {
    return messenger.modules.whoami()
      .then((id) => resolve({ command: true, result: id }))
      .catch(() => reject(new Error(constants.COMMAND_TEXT.WHOAMI.FAILURE)))
  }),
  whois: (id) => new Promise((resolve, reject) => {
    if (!id) {
      return resolve({ command: true, result: constants.COMMAND_TEXT.WHOIS.BAD_ARGS })
    }
    return resolve({ command: true, result: authors.getId(id) })
  })
}
