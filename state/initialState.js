const Immutable = require('immutable')
const constants = require('../util/constants')

module.exports = Immutable.Map({
  following: Immutable.Set(),
  blocked: Immutable.Set(),
  followingMe: Immutable.Set(),
  relevantAuthors: Immutable.Map(),
  unknownRelevantAuthors: Immutable.Set(),
  authors: Immutable.Map(),
  options: Immutable.Map({ debug: false, timeWindow: constants.TIME_WINDOW }),
  filteredMessages: Immutable.List(),
  lastPrivateRecipient: Immutable.Set(),
  me: '',
  messages: Immutable.List(),
  mode: constants.MODE.PUBLIC,
  myNames: Immutable.Set(),
  privateRecipients: Immutable.Set(),
  privateMessageRoot: '',
  unreads: Immutable.List(),
  sbot: () => {}
})
