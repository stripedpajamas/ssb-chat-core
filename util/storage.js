const os = require('os')
const path = require('path')
const storage = require('node-persist')
const constants = require('./constants')

// initialize storage in ~/.scat
const readDir = path.join(os.homedir(), constants.PROGRAM_DIR, 'read')

const readStorage = storage.create()
readStorage.initSync({
  dir: readDir,
  expiredInterval: 60000, // 10 mins
  forgiveParseErrors: true
})

const recentDir = path.join(os.homedir(), constants.PROGRAM_DIR, 'recent')

const recentStorage = storage.create()
recentStorage.initSync({
  dir: recentDir,
  expiredInterval: 60000, // 10 mins
  forgiveParseErrors: true,
  ttl: 604800000 // 7 days
})

module.exports = {
  readStorage,
  recentStorage
}
