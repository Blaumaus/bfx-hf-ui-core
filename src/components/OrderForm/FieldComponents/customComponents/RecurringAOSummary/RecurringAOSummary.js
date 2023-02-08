import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import {
  getDateInShortFormat,
  getWeekDayString,
} from '../../../../../util/date'

import './style.css'

const RECURRENCE_OPTIONS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
}

const RecurringAOSummary = ({ fieldData }) => {
  const { t } = useTranslation()
  const { recurrence, startedAt, endedAt } = fieldData

  const recurrenceString = useMemo(() => {
    if (recurrence === RECURRENCE_OPTIONS.DAILY) {
      return t('algoOrderForm.recurring.day')
    }
    if (recurrence === RECURRENCE_OPTIONS.WEEKLY) {
      const weekday = getWeekDayString(startedAt || new Date())
      return t('algoOrderForm.recurring.weekOn', { weekday })
    }
    if (recurrence === RECURRENCE_OPTIONS.MONTHLY) {
      const day = getDateInShortFormat(startedAt)
      return t('algoOrderForm.recurring.monthOn', { day })
    }

    return null
  }, [recurrence, startedAt, t])

  const message = t('algoOrderForm.recurring.summary', {
    recurrence: recurrenceString,
    startTime: startedAt
      ? t('algoOrderForm.recurring.startOn', {
        dateTime: startedAt.toLocaleString(),
      })
      : t('algoOrderForm.recurring.startNow'),
    endTime: endedAt
      ? endedAt.toLocaleString()
      : t('algoOrderForm.recurring.manuallyStop'),
  })
  return <div className='hfui-recurring-ao-message'>{message}</div>
}

RecurringAOSummary.propTypes = {
  fieldData: PropTypes.shape({
    recurrence: PropTypes.string,
    startedAt: PropTypes.instanceOf(Date),
    endedAt: PropTypes.instanceOf(Date),
  }),
}

RecurringAOSummary.defaultProps = {
  fieldData: {
    recurrence: null,
    startedAt: null,
    endedAt: null,
  },
}
export default RecurringAOSummary
