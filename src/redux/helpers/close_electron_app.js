import _isFunction from 'lodash/isFunction'

const closeElectronApp = () => {
  if (_isFunction(window.nodeRequire)) {
    const electron = window.nodeRequire('electron')
    const { ipcRenderer } = electron
    ipcRenderer.send('app-closed')
  }
}

export default closeElectronApp
