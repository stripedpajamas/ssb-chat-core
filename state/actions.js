const Immutable = require('immutable')
const punycode = require('punycode') // eslint-disable-line
const state = require('./')
const events = require('./events')
const storage = require('../util/storage')
const constants = require('../util/constants')

let actions

// #region author actions
const setName = (author, name, setter) => {
  if (typeof name !== 'string') {
    return
  }
  let cleanName = punycode.toASCII(name.normalize('NFC')) // :eyeroll: dangerous beans
  if (cleanName[0] !== '@') {
    cleanName = `@${cleanName}`
  }

  // if this is about me, add it to my list of self ids
  if (author === actions.me.get()) {
    actions.me.addName(cleanName)
  }

  state.setIn(['authors', author], { name: cleanName, setter })

  events.queue('authors-changed', getAll())
}
const getName = (id) => {
  const name = state.getIn(['authors', id, 'name'])
  return name || id
}
const getId = (name) => {
  const authorId = state.get('authors')
    .findKey(author => {
      const authorName = author.get('name')
      return authorName === name || authorName === `@${name}`
    })
  return authorId || name
}
const getAll = () => state.get('authors')
const getFollowing = () => state.get('following')
const getFollowingMe = () => state.get('followingMe')
const getBlocked = () => state.get('blocked') // people i've blocked
const setBlock = (id, blocked) => {
  const currentBlocks = getBlocked()
  const newBlocks = blocked ? currentBlocks.add(id) : currentBlocks.remove(id)
  state.set('blocked', newBlocks)
  events.emit('blocked-changed', getBlocked())
}
const setFollowing = (id, following) => {
  const currentFollowing = getFollowing()
  const newFollowing = following ? currentFollowing.add(id) : currentFollowing.remove(id)
  state.set('following', newFollowing)
  events.emit('following-changed', getFollowing())
}
const setFollowingMe = (id, following) => {
  const currentFollowingMe = getFollowingMe()
  const newFollowingMe = following ? currentFollowingMe.add(id) : currentFollowingMe.remove(id)
  state.set('followingMe', newFollowingMe)
  events.emit('following-me-changed', getFollowingMe())
}
// #endregion

// #region me actions
const getMe = () => state.get('me')
const setMe = (me) => {
  state.set('me', me)
  events.emit('me-changed', state.get('me'))
}
const addName = (name) => {
  const oldMyNames = state.get('myNames')
  const newMyNames = oldMyNames.add(name)
  state.set('myNames', newMyNames)
  events.emit('my-names-changed', state.get('myNames'))
}
const names = () => state.get('myNames')
// #endregion

// #region message actions
const addInPlace = (msg) => {
  const messages = state.get('messages')
  // put message in the right place time-wise
  const timestamp = msg.timestamp
  const size = messages.size

  // handle edge case
  if (!size || messages.last().get('timestamp') < timestamp) {
    // this message should just go at the end
    state.set('messages', messages.push(Immutable.fromJS(msg)))
    return
  }

  // find lowest nearest
  for (let i = 0; i < size; i++) {
    if (messages.get(i).get('timestamp') >= timestamp) {
      state.set('messages', messages.insert(i, Immutable.fromJS(msg)))
      return
    }
  }
}

const getMessages = () => state.get('filteredMessages')
const refreshFiltered = () => {
  const messages = state.get('messages')
  if (actions.mode.isPrivate()) {
    // if in private mode, only show messages that are either from
    // the person/people i am in private mode with
    // OR from me that i sent to people i'm in private mode with
    state.set('filteredMessages', messages.filter(msg => {
      return msg.get('private') && actions.recipients.compare(msg.get('recipients'), actions.recipients.get())
    }))
    events.emit('messages-changed', getMessages())
    return
  }
  state.set('filteredMessages', messages.filter(msg => !msg.get('private')))
  events.emit('messages-changed', getMessages())
}
const push = (msg) => {
  addInPlace(msg)
  if (msg.private) {
    const myId = actions.me.get()
    // if we don't already have a root for private messages in this chat,
    // and we're in private mode at this time, we can use this message as the new root
    if (actions.mode.isPrivate() && !state.get('privateMessageRoot')) {
      state.set('privateMessageRoot', msg.key)
    }

    // also if this wasn't sent by us
    if (msg.recipients.size && msg.author !== myId) {
      // see if we're currently in private mode with the recipients
      const talkingToThem = actions.recipients.compare(actions.recipients.get(), msg.recipients)
      const inPrivateMode = actions.mode.isPrivate()
      // if we aren't in private mode
      // or we are in private mode but with other people
      if (!inPrivateMode || !talkingToThem) {
        // see if these recipients are already in an unread notification
        let unreadRecipients = Immutable.Set(msg.recipients).delete(myId)

        const currentUnreads = actions.unreads.get()
        const alreadyNoted = currentUnreads.some(un => actions.recipients.compare(un, unreadRecipients))

        // if we haven't already noted this unread message
        if (!alreadyNoted) {
          // and of course confirm that this message isn't already read
          // based on saved read message keys on disk
          if (!actions.storage.hasThisBeenRead(msg)) {
            // then push to unreads on state
            state.set('unreads', currentUnreads.push(unreadRecipients))
            actions.recents.set(unreadRecipients.add(myId))
            events.emit('unreads-changed', state.get('unreads'))
          }
        }
      }
    }
  }

  refreshFiltered()
}
// #endregion

// #region mode actions
const getMode = () => state.get('mode')
const setPublic = () => {
  state.set('mode', constants.MODE.PUBLIC)
  actions.recipients.reset()
  actions.messages.refreshFiltered()
  events.emit('mode-changed', constants.MODE.PUBLIC)
}
const setPrivate = () => {
  state.set('mode', constants.MODE.PRIVATE)

  // refresh our filtered messages to be only private
  actions.messages.refreshFiltered()

  // we want to get the message id of the latest message
  // in this private thread, and use that as the root for future messages
  // but if there is no 'latest message' in this thread, we'll
  // set the root after first message sent
  const lastMessage = actions.messages.get().last()
  if (lastMessage) {
    state.set('privateMessageRoot', lastMessage.get('key'))
  }

  // mark all messages in this conversation as read
  actions.storage.markFilteredMessagesRead()

  // fire the mode change hook
  events.emit('mode-changed', constants.MODE.PRIVATE)
}
const isPrivate = () => {
  return state.get('mode') === constants.MODE.PRIVATE
}
// #endregion

// #region recipient actions
const resetPrivateRecipients = () => {
  const pr = getPrivateRecipients()
  if (pr.size) {
    state.set('lastPrivateRecipients', getPrivateRecipients())
    events.emit('last-recipients-changed', state.get('lastPrivateRecipients'))
  }
  state.set('privateRecipients', Immutable.Set())
  state.set('privateMessageRoot', '')
  events.emit('recipients-changed', state.get('privateRecipients'))
}
const compare = (a, b) => {
  if (!Immutable.Set.isSet(a) || !Immutable.Set.isSet(b)) {
    return false
  }
  if (a.size !== b.size) {
    return false
  }
  for (var x of a) {
    if (!b.has(x)) {
      return false
    }
  }
  return true
}

const getPrivateRecipients = () => state.get('privateRecipients')
const setPrivateRecipients = (recipients) => {
  const privateRecipients = Immutable.Set(recipients).add(actions.me.get())

  actions.unreads.setAsRead(privateRecipients)
  state.set('privateRecipients', privateRecipients)

  // add these recipients to recents storage
  actions.recents.set(privateRecipients)

  actions.mode.setPrivate()
  events.emit('recipients-changed', state.get('privateRecipients'))
}
const getNotMe = () => getPrivateRecipients()
  .filter(r => r !== actions.me.get())
  .map(actions.authors.getName)
const getPrivateRoot = () => state.get('privateMessageRoot')
const getLast = () => state.get('lastPrivateRecipients')
// #endregion

// #region sbot actions
const getSbot = () => state.get('sbot')
const setSbot = (sbot) => state.set('sbot', sbot)
// #endregion

// #region unread actions
const getUnreads = () => state.get('unreads')
const getLastUnread = () => getUnreads().last()
const setAsRead = (recps) => {
  // when we create an unread, we leave off our own username
  // so to clear an unread we need to take our own username off the criteria
  const filteredRecps = recps.filter(r => r !== actions.me.get())
  const newUnreads = getUnreads().filter((unreadRecps) => {
    return !actions.recipients.compare(filteredRecps, unreadRecps)
  })
  state.set('unreads', newUnreads)
  events.emit('unreads-changed', state.get('unreads'))
}
// #endregion

// #region options actions
const getOptions = () => state.get('options')
const setOptions = (opts) => {
  Object.keys(opts).forEach(key => { setOption(key, opts[key]) })
}
const setOption = (key, val) => {
  state.setIn(['options', key], val)
  events.emit('options-changed', state.get('options'))
}
// #endregion

// #region storage actions
const storeAsRead = (message) => {
  const timeWindow = actions.options.get().get('timeWindow')
  const ttl = (message.get('timestamp') + timeWindow) - Date.now()
  storage.readStorage.setItemSync(message.get('key'), true, { ttl })
}
const markFilteredMessagesRead = () => {
  const filteredMessages = actions.messages.get()
  filteredMessages.forEach(msg => storeAsRead(msg))
}
const hasThisBeenRead = (message) => storage.readStorage.getItemSync(message.key)
// #endregion

// #region recent actions
const getRecents = () => {
  const recents = storage.recentStorage.keys()
  return recents.map(r => r.split(','))
}
const setRecent = (recipients) => {
  const key = recipients.toArray().join(',')
  storage.recentStorage.setItemSync(key, true)
  events.emit('recents-changed', getRecents())
}
const removeRecent = (recipients) => {
  const key = recipients.join(',')
  storage.recentStorage.removeItemSync(key)
  events.emit('recents-changed', getRecents())
}
// #endregion

actions = module.exports = {
  authors: {
    get: getAll,
    setName,
    getName,
    getId,
    getFollowing,
    getFollowingMe,
    getBlocked,
    setBlock,
    setFollowing,
    setFollowingMe,
  },
  me: {
    get: getMe,
    set: setMe,
    names,
    addName
  },
  messages: {
    get: getMessages,
    push,
    refreshFiltered
  },
  mode: {
    get: getMode,
    isPrivate,
    setPrivate,
    setPublic
  },
  recipients: {
    get: getPrivateRecipients,
    reset: resetPrivateRecipients,
    set: setPrivateRecipients,
    getNotMe,
    compare,
    getPrivateRoot,
    getLast
  },
  sbot: {
    get: getSbot,
    set: setSbot
  },
  unreads: {
    get: getUnreads,
    getLast: getLastUnread,
    setAsRead
  },
  options: {
    get: getOptions,
    set: setOption,
    setOptions
  },
  storage: {
    markFilteredMessagesRead,
    hasThisBeenRead
  },
  recents: {
    get: getRecents,
    set: setRecent,
    remove: removeRecent
  }
}
