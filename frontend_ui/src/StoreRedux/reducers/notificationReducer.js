import * as ActionTypes from '../constants/actionTypes'

const initialState = {
  notification: {
    show: false,
    type: 'info',
    message: '',
  },
};



const notificationReducer = (state = initialState, action) => {
  switch (action.type) {

    case ActionTypes.SHOW_NOTIFICATION:
      return {
        ...state,
        notification: {
          show: true,
          type: action.payload.type,
          message: action.payload.message,
        },
      };
    case ActionTypes.HIDE_NOTIFICATION:
      return {
        ...state,
        notification: initialState.notification,
      };
    default:
      return state;
  }
};

export default notificationReducer;
