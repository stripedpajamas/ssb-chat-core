// we don't want weird perf hook stuff
if (typeof process !== 'undefined') {
  process.env['DISABLE_NANOTIMING'] = false
}
if (typeof window !== 'undefined' && window.localStorage) {
  window.localStorage.DISABLE_NANOTIMING = true
}

const nanobus = require('nanobus')

module.exports = nanobus()
