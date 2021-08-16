import _get from 'lodash/get'
import { REDUCER_PATHS } from '../../config'

const path = REDUCER_PATHS.WS
const EMPTY_OBJ = {}

export default (state) => {
  return _get(state, `${path}.auth.apiKeys.main`, EMPTY_OBJ)
}