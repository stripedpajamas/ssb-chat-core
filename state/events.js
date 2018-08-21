const nanobus = require('nanobus')
const nanotick = require('nanotick')

const tick = nanotick()
const bus = nanobus()
const emit = tick(bus.emit.bind(bus))

let queue = {}

const queueEvent = (e, data) => {
  queue[e] = data
}

const emptyQueue = () => {
  Object.keys(queue).forEach((e) => {
    emit(e, queue[e])
  })
  queue = {}
}

setInterval(() => {
  if (Object.keys(queue).length) {
    emptyQueue()
  }
}, 1000)

module.exports = {
  emit,
  queue: queueEvent,
  on: bus.on.bind(bus)
}
