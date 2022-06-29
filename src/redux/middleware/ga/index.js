import ReactGA from 'react-ga4'
import { v4 } from 'uuid'

import {
  GA_CANCEL_AO, GA_PAGEVIEW, GA_CANCEL_ATOMIC_ORDER, GA_CREATE_STRATEGY, GA_SUBMIT_ATOMIC_ORDER, GA_SUBMIT_AO, GA_UPDATE_SETTINGS, GA_EDIT_AO,
} from '../../constants/ga'

import { isElectronApp } from '../../config'
import { getGACustomerId, storeGACustomerId } from '../../../util/ga'

const GA_ID_ELECTRON_APP = 'UA-163797164-1'
const GA_ID_HOSTED_WEB = 'UA-212993021-1'

const gaID = isElectronApp ? GA_ID_ELECTRON_APP : GA_ID_HOSTED_WEB

if (!getGACustomerId()) {
  storeGACustomerId(v4())
}

ReactGA.initialize(gaID, {
  gaOptions: {
    anonymizeIp: true,
    userId: getGACustomerId(),
  },
})

export default () => {
  return store => next => (action = {}) => {
    const { type, payload = {} } = action
    const state = store.getState()
    const { ui = {} } = state
    const { settings = {} } = ui
    const ga = isElectronApp ? settings?.ga : true

    if (!ga) {
      next(action)
      return
    }

    switch (type) {
      case GA_SUBMIT_ATOMIC_ORDER: {
        ReactGA.event({
          category: 'atomicOrder',
          action: 'atomicOrder.submit',
        })
        break
      }
      case GA_CANCEL_ATOMIC_ORDER: {
        ReactGA.event({
          category: 'atomicOrder',
          action: 'atomicOrder.cancel',
        })
        break
      }
      case GA_SUBMIT_AO: {
        ReactGA.event({
          category: 'ao',
          action: 'ao.submit',
        })
        break
      }
      case GA_EDIT_AO: {
        ReactGA.event({
          category: 'ao',
          action: 'ao.edit',
        })
        break
      }
      case GA_CANCEL_AO: {
        ReactGA.event({
          category: 'ao',
          action: 'ao.cancel',
        })
        break
      }
      case GA_UPDATE_SETTINGS: {
        ReactGA.event({
          category: 'settings',
          action: 'settings.update',
        })
        break
      }
      case GA_CREATE_STRATEGY: {
        ReactGA.event({
          category: 'strategy',
          action: 'strategy.create',
        })
        break
      }
      case GA_PAGEVIEW: {
        const { page } = payload

        ReactGA.send({ hitType: 'pageview', page })
        break
      }
      default: {
        next(action)
        break
      }
    }
  }
}
