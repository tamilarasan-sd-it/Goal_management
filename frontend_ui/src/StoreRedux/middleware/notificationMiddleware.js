import * as ActionTypes from '../constants/actionTypes';
import { showNotification } from '../constants/actionTypes';

const notificationMiddleware = (store) => (next) => (action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
      store.dispatch(showNotification({ type: 'success', message: action.payload.message }));
      break;
    case ActionTypes.LOGIN_FAILURE:
      console.log(action.payload, "action.payload")
      store.dispatch(showNotification({ type: 'error', message: action.payload.error.message }));
      break;
    case ActionTypes.ERROR_ACTION:
      store.dispatch(showNotification({ type: 'error', message: action.payload.message }));
      break;
    case ActionTypes.LOGOUT:
      store.dispatch(showNotification({ type: 'info', message: 'Logout successful' }));
      break;
    default:
      break;
  }

  return next(action);
};

export default notificationMiddleware;