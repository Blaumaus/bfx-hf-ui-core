import React, { memo, useState, useEffect } from 'react'
import ClassNames from 'classnames'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import { isElectronApp, appVersion } from '../../redux/config'

import NavbarButton from '../Navbar/Navbar.Link'
import './style.css'

const StatusBar = ({
  wsConnected, remoteVersion, apiClientState, wsInterrupted, currentModeApiKeyState,
}) => {
  const [wsConnInterrupted, setWsConnInterrupted] = useState(false)
  const isWrongAPIKey = !currentModeApiKeyState.valid
  const apiClientConnected = apiClientState === 2
  const apiClientConnecting = !isWrongAPIKey && apiClientState === 1
  const apiClientDisconnected = isWrongAPIKey || !apiClientState

  const { t } = useTranslation()

  useEffect(() => {
    if (wsInterrupted && !wsConnInterrupted) {
      setWsConnInterrupted(true)
    }
  }, [wsInterrupted])

  return (
    <div className='hfui-statusbar__wrapper'>
      {isElectronApp && (
        <div className='hfui-statusbar__left'>
          <p>
            {remoteVersion && remoteVersion !== appVersion && (
              <NavbarButton
                label={t('statusbar.updateToLast')}
                external='https://github.com/bitfinexcom/bfx-hf-ui/releases'
              />
            )}
            &nbsp;
            v
            {appVersion}
          </p>

          <p>
            {apiClientConnected ? t('statusbar.unlocked') : t('statusbar.locked')}
          </p>
        </div>
      )}

      <div className='hfui-statusbar__right'>
        {isElectronApp && (
          <>
            <p>
              {'HF '}
              {apiClientConnected && t('statusbar.connected')}
              {apiClientConnecting && t('statusbar.connecting')}
              {apiClientDisconnected && t('statusbar.disconnected')}
            </p>

            <span className={ClassNames('hfui-statusbar__statuscircle', {
              green: apiClientConnected,
              yellow: apiClientConnecting,
              red: apiClientDisconnected,
            })}
            />
          </>
        )}

        <p>{`WS ${(wsConnected && !wsConnInterrupted) ? t('statusbar.connected') : t('statusbar.disconnected')}`}</p>

        <span className={ClassNames('hfui-statusbar__statuscircle', {
          green: wsConnected && !wsConnInterrupted,
          red: !wsConnected || wsConnInterrupted,
        })}
        />
      </div>
    </div>
  )
}

StatusBar.propTypes = {
  wsConnected: PropTypes.bool.isRequired,
  remoteVersion: PropTypes.string,
  apiClientState: PropTypes.number.isRequired,
  wsInterrupted: PropTypes.bool.isRequired,
  currentModeApiKeyState: PropTypes.shape({
    valid: PropTypes.bool,
  }),
}

StatusBar.defaultProps = {
  remoteVersion: '',
  currentModeApiKeyState: {
    valid: false,
  },
}

export default memo(StatusBar)
