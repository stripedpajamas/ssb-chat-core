const path = require('path')
const child = require('child_process')
const ssbKeys = require('ssb-keys')
const ssbConfig = require('ssb-config/inject')
const client = require('ssb-client')

let retriesRemaining = 5
let keys
let ready
let server
let started = false

const startServer = () => {
  // start scuttle shell if haven't already tried starting it
  if (!started) {
    server = child.fork(path.resolve(__dirname, './start'), {
      stdio: [
        'ignore',
        'ignore',
        'ignore',
        'ipc'
      ]
    })
    const config = ssbConfig()
    config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
    server.send({ config })
    server.on('message', () => { ready = true })
    started = true
  }
}

const tryConnect = (cb) => {
  retriesRemaining--
  // Check if sbot is already running
  try {
    if (!started || (started && ready)) {
      const config = ssbConfig()
      config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
      client(config, (err, sbot) => {
        // err implies no server currently running
        if (err) {
          startServer()
        }
        cb(null, sbot)
      })
    } else {
      cb()
    }
  } catch (e) {
    // if this is the first time running, ssb-client will throw a manifest error
    // so let's start up the server and try again
    console.log('New scuttlebutt identity created...')
    startServer()
    cb()
  }
}

module.exports = {
  start: (cb) => {
    console.log('Connecting to scuttlebot...')
    let interval
    tryConnect((_, sbot) => {
      if (!sbot) {
        interval = setInterval(() => {
          if (retriesRemaining > 0) {
            tryConnect((_, sbot) => {
              if (sbot) {
                cb(null, sbot)
                clearInterval(interval)
              }
            })
          } else {
            cb(new Error('Could not connect to sbot'))
            clearInterval(interval)
          }
        }, 1000)
      } else {
        cb(null, sbot)
      }
    })
  },
  stop: () => {
    if (started) {
      server.send({ stop: true })
    }
  }
}
