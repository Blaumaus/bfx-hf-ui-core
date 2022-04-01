import React, { memo } from 'react'
import cx from 'clsx'
import PropTypes from 'prop-types'
import OutsideClickHandler from 'react-outside-click-handler'
import { useTranslation } from 'react-i18next'
import { Icon } from 'react-fa'

const Item = ({
  isSelected, isDisabled, children, ...props // eslint-disable-line
}) => (
  <div
    className={cx('hfui-orderform__ao-settings__item is-layout', {
      'is-selected': isSelected,
      'is-disabled': isDisabled,
    })}
    {...props}
  >
    {children}
  </div>
)

const StrategyParams = ({
  paramsOpen, setParamsOpen, startExecution, stopExecution,
}) => {
  const { t } = useTranslation()

  return (
    <div className='hfui-orderform__ao-settings'>
      {paramsOpen && (
        <OutsideClickHandler onOutsideClick={() => setParamsOpen(false)}>
          <div className='hfui-orderform__ao-settings__menu hfui-strategy__options-panel'>
            <div className='hfui-orderform__ao-settings__menu-buttons' onClick={() => setParamsOpen(false)}>
              <Item onClick={startExecution}>
                <Icon name='play' />
                &nbsp;&nbsp;
                {t('strategyEditor.launchStrategy')}
              </Item>
              <Item onClick={stopExecution}>
                <Icon name='stop' />
                &nbsp;&nbsp;
                {t('strategyEditor.stopExec')}
              </Item>
              <div className='hfui-navbar__layout-settings__separator' />
              <Item onClick={() => {}}>
                {t('ui.closeBtn')}
              </Item>
            </div>
          </div>
        </OutsideClickHandler>
      )}
    </div>
  )
}

StrategyParams.propTypes = {
  paramsOpen: PropTypes.bool.isRequired,
  setParamsOpen: PropTypes.func.isRequired,
  startExecution: PropTypes.func.isRequired,
  stopExecution: PropTypes.func.isRequired,
}

export default memo(StrategyParams)