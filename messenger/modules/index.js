const about = require('./about')
const block = require('./block')
const follow = require('./follow')
const invite = require('./invite')
const post = require('./post')
const privatePost = require('./private')
const unbox = require('./unbox')
const whoami = require('./whoami')

module.exports = {
  about,
  block,
  follow,
  invite,
  post,
  private: privatePost,
  unbox,
  whoami
}
