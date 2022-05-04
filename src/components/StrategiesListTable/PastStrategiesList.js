import React from 'react'
import PropTypes from 'prop-types'
import _isEmpty from 'lodash/isEmpty'
import { VirtualTable } from '@ufx-ui/core'
import { useTranslation } from 'react-i18next'
import StrategiesListColumns from './StrategiesList.columns'

const PastStrategiesList = ({ onRowClick, strategies }) => {
  const { t } = useTranslation()

  return (
    <>
      {_isEmpty(strategies) ? (
        <div className='no-trades__wrapper'>
          <span className='no-trades__notification'>
            {t('strategyEditor.noActiveStrategies')}
          </span>
        </div>
      ) : (
        <VirtualTable
          data={strategies}
          columns={StrategiesListColumns(t)}
          defaultSortBy='mts'
          defaultSortDirection='DESC'
          onRowClick={onRowClick}
        />
      )}
    </>
  )
}

PastStrategiesList.propTypes = {
  onRowClick: PropTypes.func.isRequired,
  strategies: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default PastStrategiesList