const pull = require('pull-stream')
const unique = require('pull-stream/throughs/unique')
const connect = require('./connect')
const state = require('./state')
const events = require('./state/events')
const constants = require('./util/constants')
const processor = require('./util/processor')
const messenger = require('./messenger')
const commands = require('./commands')

// state actions
const actions = require('./state/actions')

let started

module.exports = {
  state,
  messenger,
  commands,
  constants,
  events,
  authors: actions.authors,
  me: actions.me,
  messages: actions.messages,
  mode: actions.mode,
  recipients: actions.recipients,
  unreads: actions.unreads,
  sbot: actions.sbot,
  options: actions.options,
  recents: actions.recents,
  progress: actions.progress,
  start: (opts, cb) => {
    if (started) {
      // don't double start, thanks @korlando7
      cb()
      return
    }
    started = true
    actions.options.setOptions(opts)

    let timeWindow = actions.options.get().get('timeWindow')
    if (!timeWindow) {
      timeWindow = constants.TIME_WINDOW
      actions.options.set('timeWindow', constants.TIME_WINDOW)
    }

    const since = Date.now() - timeWindow

    connect.start((err, server) => {
      if (err) {
        return cb(err)
      }

      // set our sbot instance and our self
      actions.sbot.set(server)
      actions.me.set(server.id)
      actions.authors.updateFriends()

      // start streaming messages
      pull(
        server.query.read({
          reverse: true,
          live: true,
          query: [{
            $filter: {
              value: {
                content: { type: constants.MESSAGE_TYPE },
                timestamp: { $gte: since }
              }
            }
          }]
        }),
        pull.drain(processor)
      )

      pull(
        server.progress,
        pull.map((data) => ({
          current: data.indexes.current,
          target: data.indexes.target
        })),
        unique(JSON.stringify),
        pull.drain(actions.progress.set)
      )

      // let caller know that we are ready to rock n roll
      cb()
    })
  },
  stop: connect.stop
}
