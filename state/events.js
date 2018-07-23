let onModeChange = () => {}

module.exports = {
  // cb receives new mode
  mode: {
    onChange: (cb) => { onModeChange = cb },
    _change: (mode) => onModeChange(mode)
  }
}
