import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ClassNames from 'clsx'
import _isEmpty from 'lodash/isEmpty'

import { useSelector } from 'react-redux'
import MonacoEditor from '../components/MonacoEditor'
import { getThemeSetting } from '../../../redux/selectors/ui'

const STRATEGY_SECTIONS = [
  'defineIndicators',
  'onPriceUpdate',
  'onEnter',
  'onUpdate',
  'onUpdateLong',
  'onUpdateShort',
  'onUpdateClosing',
  'onPositionOpen',
  'onPositionUpdate',
  'onPositionClose',
  'onStart',
  'onStop',
]

const IDETab = ({
  strategy,
  setStrategy,
  onStrategyChange,
  setStrategyDirty,
  onDefineIndicatorsChange,
  evalSectionContent,
  setSectionErrors,
  sectionErrors,
  renderResults,
}) => {
  const [activeContent, setActiveContent] = useState('defineIndicators')
  const [execError, setExecError] = useState('')

  const settingsTheme = useSelector(getThemeSetting)

  const processStrategy = (updatedStrategy) => {
    const { id, label } = updatedStrategy
    const updatedContent = { id, label }
    setStrategy(updatedStrategy)

    for (let i = 0; i < STRATEGY_SECTIONS.length; ++i) {
      const section = STRATEGY_SECTIONS[i]
      const content = updatedStrategy[section]

      if (!_isEmpty(content)) {
        updatedContent[section] = content
      }
    }

    return updatedContent
  }

  const updateStrategy = (updatedStrategy) => {
    const content = processStrategy(updatedStrategy)
    onStrategyChange(content)
  }

  const onEditorContentChange = (code) => {
    setStrategyDirty(true)
    updateStrategy({
      ...strategy,
      [activeContent]: code,
    })

    if (activeContent === 'defineIndicators') {
      onDefineIndicatorsChange(code) // tracks errors
    } else {
      evalSectionContent(activeContent, code)
    }
  }

  const onClearErrors = () => {
    setSectionErrors({})
    setExecError('')
  }

  return (
    <div className='hfui-strategyeditor__wrapper'>
      <ul className='hfui-strategyeditor__func-select'>
        {/* eslint-disable-next-line lodash/prefer-lodash-method */}
        {STRATEGY_SECTIONS.map((section) => (
          <li
            key={section}
            onClick={() => setActiveContent(section)}
            className={ClassNames({
              active: activeContent === section,
              hasError: !!sectionErrors[section],
            })}
          >
            <p>{section}</p>

            {_isEmpty(strategy[section]) ? null : _isEmpty(
              sectionErrors[section],
            ) ? (
              <p>~</p>
              ) : (
                <p>*</p>
              )}
          </li>
        ))}
      </ul>

      <div className='hfui-strategyeditor__content-wrapper'>
        <div
          className={ClassNames('hfui-strategyeditor__editor-wrapper', {
            noresults: !renderResults,
            'exec-error': execError || sectionErrors[activeContent],
          })}
        >
          <MonacoEditor
            value={strategy[activeContent] || ''}
            onChange={onEditorContentChange}
            theme={settingsTheme}
          />
          {(execError || sectionErrors[activeContent]) && (
            <div className='hfui-strategyeditor__editor-error-output'>
              <p
                className='hfui-panel__close strategyeditor__close-icon'
                onClick={onClearErrors}
              >
                &#10005;
              </p>
              <pre>{execError || sectionErrors[activeContent]}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

IDETab.propTypes = {
  strategy: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
  setStrategy: PropTypes.func.isRequired,
  onStrategyChange: PropTypes.func.isRequired,
  setStrategyDirty: PropTypes.func.isRequired,
  onDefineIndicatorsChange: PropTypes.func.isRequired,
  evalSectionContent: PropTypes.func.isRequired,
  setSectionErrors: PropTypes.func.isRequired,
  sectionErrors: PropTypes.objectOf(PropTypes.string),
  renderResults: PropTypes.bool.isRequired,
}

IDETab.defaultProps = {
  sectionErrors: {},
}

export default IDETab