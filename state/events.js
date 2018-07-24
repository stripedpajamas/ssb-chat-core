let onModeChange = () => {}
let onNewMessage = () => {}

module.exports = {
  // cb receives new mode
  mode: {
    onChange: (cb) => { onModeChange = cb },
    _change: (mode) => onModeChange(mode)
  },
  messages: {
    onNew: (cb) => { onNewMessage = cb },
    _new: () => { onNewMessage() }
  }
}
