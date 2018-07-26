let onModeChange = () => {}
let onNewMessage = () => {}
let onNewAuthor = () => {}

module.exports = {
  // cb receives new mode
  mode: {
    onChange: (cb) => { onModeChange = cb },
    _change: (mode) => onModeChange(mode)
  },
  messages: {
    onNew: (cb) => { onNewMessage = cb },
    _new: () => { onNewMessage() }
  },
  authors: {
    onNew: (cb) => { onNewAuthor = cb },
    _new: () => { onNewAuthor() }
  }
}
