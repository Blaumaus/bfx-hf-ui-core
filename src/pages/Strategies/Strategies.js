import React, { lazy, Suspense, useState } from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'
import randomColor from 'randomcolor'
import _ from 'lodash'
import _values from 'lodash/values'
import _map from 'lodash/map'
import _remove from 'lodash/remove'
import _size from 'lodash/size'
import _forEach from 'lodash/forEach'
import _isEmpty from 'lodash/isEmpty'
import Indicators from 'bfx-hf-indicators'
import { nonce } from 'bfx-api-node-util'
import HFS from 'bfx-hf-strategy'
import HFU from 'bfx-hf-util'
import { useTranslation } from 'react-i18next'
import {
  STEPS, ACTIONS, EVENTS, STATUS,
} from '../../components/Joyride'
import Layout from '../../components/Layout'
import useTourGuide from '../../hooks/useTourGuide'

import './style.css'

const debug = Debug('hfui-ui:p:strategy-editor')

const StrategyEditor = lazy(() => import('../../components/StrategyEditor'))
const Joyride = lazy(() => import('../../components/Joyride'))
const StrategiesListTable = lazy(() => import('../../components/StrategiesListTable'))

// todo: move 'export strategy' to the options tab

const StrategiesPage = ({
  selectStrategy,
  finishGuide,
  setStrategyContent,
  firstLogin,
  isGuideActive,
  strategyContent,
  setStrategyTab,
  selectedTab,
  strategies,
  onSave,
  authToken,
}) => {
  const [strategy, setStrategy] = useState(strategyContent)
  const [indicators, setIndicators] = useState([])
  const [strategyDirty, setStrategyDirty] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [sectionErrors, setSectionErrors] = useState({})

  const showGuide = useTourGuide(isGuideActive)

  const { t } = useTranslation()

  const onAddIndicator = (indicator) => {
    setIndicators([...indicators, indicator])
  }

  const onDeleteIndicator = (index) => {
    setIndicators(_remove(indicators, (el, id) => id !== index))
  }

  const onIndicatorsChange = (updatedIndicators) => {
    const newIndicators = _map(_values(updatedIndicators), (ind) => {
      let colors = []

      for (let i = 0; i < 5; i += 1) {
        colors.push(randomColor())
      }

      // allow users to overwrite colors
      if (ind.color) {
        colors[0] = ind.color
      } else if (ind.colors) {
        colors = ind.colors; // eslint-disable-line
      }

      return [ind.constructor, ind._args, colors]
    })

    setIndicators(newIndicators)
  }

  const setSectionError = (section, error) => {
    setSectionErrors({
      ...sectionErrors,
      [section]: error,
    })
  }

  const clearSectionError = (section) => {
    setSectionError(section, '')
  }

  const processSectionError = (section, e) => {
    if (e.lineNumber && e.columnNumber) {
      // currently it's a non-standard property supported by Firefox only :(
      setSectionError(
        section,
        `Line ${e.lineNumber}:${e.columnNumber}: ${e.message}`,
      )
    } else {
      setSectionError(section, e.message)
    }
  }

  const evalSectionContent = (section, providedContent) => {
    const content = providedContent || strategy[section] || ''

    if (section.substring(0, 6) === 'define') {
      try {
        const func = eval(content); // eslint-disable-line
        clearSectionError(section)
        return func
      } catch (e) {
        processSectionError(section, e)
        return null
      }
    } else if (section.substring(0, 2) === 'on') {
      try {
        const func = eval(content)({ HFS, HFU, _ }); // eslint-disable-line
        clearSectionError(section)
        return func
      } catch (e) {
        processSectionError(section, e)
        return null
      }
    } else {
      debug('unrecognised section handler prefix: %s', section)
      return null
    }
  }

  const onDefineIndicatorsChange = (content) => {
    const indicatorFunc = evalSectionContent('defineIndicators', content)
    let strategyIndicators = {}

    if (indicatorFunc) {
      try {
        strategyIndicators = indicatorFunc(Indicators)
      } catch (e) {
        processSectionError('defineIndicators', e)
      }
    }

    _forEach(_values(strategyIndicators), (i) => {
      i.key = `${nonce()}`; // eslint-disable-line
    })

    onIndicatorsChange(strategyIndicators)
  }

  const onTourUpdate = (data) => {
    const {
      status, action, index, type,
    } = data
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED]
    const CLOSE = 'close'

    // eslint-disable-next-line lodash/prefer-lodash-method
    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update state to advance the tour
      setTourStep(index + (action === ACTIONS.PREV ? -1 : 1))
      // eslint-disable-next-line lodash/prefer-lodash-method
    } else if (finishedStatuses.includes(status) || action === CLOSE) {
      finishGuide()
    }
  }

  const selectStrategyHandler = (content) => {
    selectStrategy()
    setStrategyContent(content)
  }

  const onLoadStrategy = (newStrategy) => {
    const updated = { ...newStrategy, savedTs: Date.now() }
    onSave(authToken, updated)
    setStrategy(updated)
    setSectionErrors({})
    setStrategyDirty(false)
    selectStrategyHandler(newStrategy)

    if (newStrategy.defineIndicators) {
      onDefineIndicatorsChange(newStrategy.defineIndicators)
    }
  }

  const onSaveStrategy = () => {
    onSave(authToken, { ...strategy, savedTs: Date.now() })
    setStrategyDirty(false)
    // onCloseModals()
  }

  return (
    <Layout>
      <Layout.Header />
      <Layout.Main flex className='hfui-strategyeditorpage1'>
        <Suspense fallback={<></>}>
          <StrategyEditor
            dark
            onStrategySelect={selectStrategyHandler}
            selectStrategy={selectStrategy}
            onStrategyChange={setStrategyContent}
            key='editor'
            onIndicatorsChange={onIndicatorsChange}
            onLoadStrategy={onLoadStrategy}
            onSaveStrategy={onSaveStrategy}
            strategyDirty={strategyDirty}
            setStrategyDirty={setStrategyDirty}
            sectionErrors={sectionErrors}
            strategyContent={strategyContent}
            strategy={strategy}
            setStrategy={setStrategy}
            setSectionErrors={setSectionErrors}
            onDefineIndicatorsChange={onDefineIndicatorsChange}
            evalSectionContent={evalSectionContent}
            moveable={false}
            removeable={false}
          />
        </Suspense>
        {firstLogin && (
          <Suspense fallback={<></>}>
            <Joyride
              steps={STEPS.getStrategyEditorModes(t)}
              callback={onTourUpdate}
              run={showGuide}
              stepIndex={tourStep}
            />
          </Suspense>
        )}
        <StrategiesListTable onLoadStrategy={onLoadStrategy} />
      </Layout.Main>
      <Layout.Footer />
    </Layout>
  )
}

StrategiesPage.propTypes = {
  // dark: PropTypes.bool,
  firstLogin: PropTypes.bool,
  isGuideActive: PropTypes.bool,
  finishGuide: PropTypes.func.isRequired,
  selectStrategy: PropTypes.func.isRequired,
  setStrategyContent: PropTypes.func.isRequired,
  setStrategyTab: PropTypes.func.isRequired,
  selectedTab: PropTypes.number,
  strategyContent: PropTypes.objectOf(Object),
  strategies: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSave: PropTypes.func.isRequired,
}

StrategiesPage.defaultProps = {
  // dark: true,
  firstLogin: false,
  isGuideActive: true,
  strategyContent: {},
  selectedTab: null,
}

export default StrategiesPage