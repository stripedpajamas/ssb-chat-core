let server

process.on('message', (msg) => {
  if (msg.config) {
    start(msg.config)
  }
  if (msg.stop) {
    if (server && server.stop) {
      server.stop()
    }
    process.exit(0)
  }
})

const path = require('path')
const fs = require('fs')

const start = (config) => {
  const manifestFile = path.join(config.path, 'manifest.json')

  const createSbot = require('ssb-server')
    .use(require('ssb-server/plugins/master'))
    .use(require('ssb-server/plugins/local'))
    .use(require('ssb-gossip'))
    .use(require('ssb-replicate'))
    .use(require('ssb-invite'))
    .use(require('ssb-backlinks'))
    .use(require('ssb-about'))
    .use(require('ssb-ebt'))
    .use(require('ssb-friends'))
    .use(require('ssb-names'))
    .use(require('ssb-ooo'))
    .use(require('ssb-private'))
    .use(require('ssb-search'))
    .use(require('ssb-query'))

  // start server
  server = createSbot(config)

  // write RPC manifest to ~/.ssb/manifest.json
  fs.writeFileSync(manifestFile, JSON.stringify(server.getManifest(), null, 2))
  process.send('server-started')
}
