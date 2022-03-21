import React, { memo, useState, useEffect } from 'react'
import Debug from 'debug'
import ClassNames from 'clsx'
import _isEmpty from 'lodash/isEmpty'
import _keys from 'lodash/keys'
import _values from 'lodash/values'
import _forEach from 'lodash/forEach'
import _size from 'lodash/size'
import _find from 'lodash/find'
import { Icon } from 'react-fa'
import PropTypes from 'prop-types'

import { saveAsJSON, readJSONFile } from '../../util/ui'
import Markdown from '../../ui/Markdown'
import { THEMES } from '../../redux/selectors/ui'
import { MAX_STRATEGY_LABEL_LENGTH } from '../../constants/variables'
import Templates from './templates'
import StrategyEditorPanel from './components/StrategyEditorPanel'
import CreateNewStrategyModal from '../../modals/Strategy/CreateNewStrategyModal'
import RemoveExistingStrategyModal from '../../modals/Strategy/RemoveExistingStrategyModal'
import OpenExistingStrategyModal from '../../modals/Strategy/OpenExistingStrategyModal'
import MonacoEditor from './components/MonacoEditor'
import EmptyContent from './components/StrategyEditorEmpty'
import './style.css'

const DocsPath = require('bfx-hf-strategy/docs/api.md')

const debug = Debug('hfui-ui:c:strategy-editor')
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

const StrategyEditor = ({
  moveable, removeable, strategyId, renderResults, onRemove, authToken, onStrategyChange, onStrategySelect,
  gaCreateStrategy, onIndicatorsChange, clearBacktestOptions, strategyContent, backtestResults, liveExecuting, onSaveStrategy, onLoadStrategy,
  liveLoading, settingsTheme, strategyDirty, setStrategyDirty, sectionErrors, setSectionErrors, onDefineIndicatorsChange, evalSectionContent, selectStrategy,
  setStrategy, strategy,
}) => {
  const [isRemoveModalOpened, setIsRemoveModalOpened] = useState(false)
  const [activeContent, setActiveContent] = useState('defineIndicators')
  const [createNewStrategyModalOpen, setCreateNewStrategyModalOpen] = useState(false)
  const [openExistingStrategyModalOpen, setOpenExistingStrategyModalOpen] = useState(false)
  const [execError, setExecError] = useState('')
  const [docsText, setDocsText] = useState('')

  useEffect(() => {
    // load readme docs (DocsPath is an object when running in electron window)
    const docsPath = typeof DocsPath === 'object' ? DocsPath.default : DocsPath
    fetch(docsPath)
      .then(response => response.text())
      .then(setDocsText)
  }, [])

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

  const onCreateNewStrategy = (label, templateLabel, content = {}) => {
    const newStrategy = { label, ...content }
    const template = _find(Templates, _t => _t.label === templateLabel)

    if (!template) {
      debug('unknown template: %s', templateLabel)
    }

    const templateSections = _keys(template)

    _forEach(templateSections, (s) => {
      if (s === 'label') return

      newStrategy[s] = template[s]
    })

    setSectionErrors({})
    setStrategyDirty(true)
    selectStrategy(newStrategy)

    if (newStrategy.defineIndicators) {
      onDefineIndicatorsChange(newStrategy.defineIndicators)
    }
  }

  const onCloseModals = () => {
    setOpenExistingStrategyModalOpen(false)
    setCreateNewStrategyModalOpen(false)
    setIsRemoveModalOpened(false)
  }

  const onClearErrors = () => {
    setSectionErrors({})
    setExecError('')
  }

  const onRemoveStrategy = () => {
    const { id = strategyId } = strategy
    onCloseModals()
    onRemove(authToken, id)
    setStrategy(null)
    onStrategyChange(null)
  }

  const updateStrategy = (updatedStrategy) => {
    const content = processStrategy(updatedStrategy)
    onStrategyChange(content)
  }

  const onExportStrategy = () => {
    const { label } = strategyContent
    saveAsJSON(strategyContent, label)
  }

  const onImportStrategy = async () => {
    try {
      const newStrategy = await readJSONFile()
      if ('label' in newStrategy && _size(newStrategy.label) < MAX_STRATEGY_LABEL_LENGTH) {
        delete newStrategy.id
        onCreateNewStrategy(newStrategy.label, null, newStrategy)
      }
    } catch (e) {
      debug('Error while importing strategy: %s', e)
    }
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

  return (
    <>
      {!strategy || _isEmpty(strategy)
        ? (
          <EmptyContent
            openCreateNewStrategyModal={() => setCreateNewStrategyModalOpen(true)}
          />
        ) : (
          <StrategyEditorPanel
            onRemove={onRemove}
            moveable={moveable}
            removeable={removeable}
            execRunning={backtestResults.executing || backtestResults.loading || liveExecuting || liveLoading}
            strategyDirty={strategyDirty}
            strategy={strategy}
            // strategies={strategies}
            strategyId={strategyId}
            onOpenSelectModal={() => setOpenExistingStrategyModalOpen(true)}
            onOpenCreateModal={() => setCreateNewStrategyModalOpen(true)}
            onOpenRemoveModal={() => setIsRemoveModalOpened(true)}
            onSaveStrategy={onSaveStrategy}
            onRemoveStrategy={onRemoveStrategy}
            onExportStrategy={onExportStrategy}
            onImportStrategy={onImportStrategy}
          >
            <div
              sbtitle='Strategy'
              sbicon={<Icon name='file-code-o' />}
              className='hfui-strategyeditor__wrapper'
            />
            <div
              sbtitle='View in IDE'
              sbicon={<Icon name='edit' />}
              className='hfui-strategyeditor__wrapper'
            >
              <ul className='hfui-strategyeditor__func-select'>
                {/* eslint-disable-next-line lodash/prefer-lodash-method */}
                {STRATEGY_SECTIONS.map(section => (
                  <li
                    key={section}
                    onClick={() => setActiveContent(section)}
                    className={ClassNames({
                      active: activeContent === section,
                      hasError: !!sectionErrors[section],
                    })}
                  >
                    <p>{section}</p>

                    {_isEmpty(strategy[section])
                      ? null
                      : _isEmpty(sectionErrors[section])
                        ? <p>~</p>
                        : <p>*</p>}
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
                      <p className='hfui-panel__close strategyeditor__close-icon' onClick={onClearErrors}>&#10005; </p>
                      <pre>{execError || sectionErrors[activeContent]}</pre>
                    </div>
                  )}
                </div>
              </div>
              <RemoveExistingStrategyModal
                isOpen={isRemoveModalOpened}
                onClose={onCloseModals}
                onRemoveStrategy={onRemoveStrategy}
                strategy={strategy}
              />
            </div>
            <Markdown
              sbtitle='Help'
              sbicon={<Icon name='question-circle-o' />}
              text={docsText}
            />
          </StrategyEditorPanel>
        )}
      <CreateNewStrategyModal
        isOpen={createNewStrategyModalOpen}
        gaCreateStrategy={gaCreateStrategy}
        onClose={onCloseModals}
        onSubmit={onCreateNewStrategy}
      />
      <OpenExistingStrategyModal
        isOpen={openExistingStrategyModalOpen}
        onClose={onCloseModals}
        onOpen={onLoadStrategy}
      />
    </>
  )
}

StrategyEditor.propTypes = {
  moveable: PropTypes.bool,
  removeable: PropTypes.bool,
  strategyId: PropTypes.string,
  renderResults: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
  onStrategyChange: PropTypes.func.isRequired,
  onStrategySelect: PropTypes.func.isRequired,
  gaCreateStrategy: PropTypes.func.isRequired,
  onIndicatorsChange: PropTypes.func.isRequired,
  clearBacktestOptions: PropTypes.func.isRequired,
  liveExecuting: PropTypes.bool.isRequired,
  liveLoading: PropTypes.bool.isRequired,
  strategyContent: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.oneOf([null]).isRequired,
    ]),
  ),
  backtestResults: PropTypes.objectOf(PropTypes.any),
  settingsTheme: PropTypes.oneOf([THEMES.LIGHT, THEMES.DARK]),
}

StrategyEditor.defaultProps = {
  strategyId: '',
  moveable: false,
  removeable: false,
  renderResults: true,
  strategyContent: {},
  backtestResults: {},
  settingsTheme: THEMES.DARK,
}

export default memo(StrategyEditor)
