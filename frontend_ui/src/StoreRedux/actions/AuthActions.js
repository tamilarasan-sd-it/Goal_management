import * as ActionTypes from '../constants/actionTypes';
import { loginSuccess, loginFailure, loginByExternalApplicationUserFailure, loginByExternalApplicationUserSuccess } from "../constants/actionTypes";

export const login = (credentials) => {

  return {
    type: ActionTypes.API,
    payload: {
      url: `${import.meta.env.VITE_BASE_URL}/loginUser`,
      method: 'POST',
      data: credentials,
      onSuccess: (data) => {
        return (dispatch) => {
          dispatch(loginSuccess(data));
        };
      },
      onError: (error) => {
        console.log(error, "error");
        return (dispatch) => {
          dispatch(loginFailure({ error: error }));
        };
      },
      label: 'LOGIN',
      headers: {
        'Content-Type': 'application/json'
      }
    },
  }
};


export const logout = () => {
  return {
    type: ActionTypes.LOGOUT,
  };
};

export const loginByExternalApplicationUser = (emp_id) => {
  return {
    type: ActionTypes.API,
    payload: {
      url: `${import.meta.env.VITE_BASE_URL}/check-emp-id?emp_id=${emp_id}`,
      method: 'GET',
      onSuccess: (data) => {
        return (dispatch) => {
          if (data.success) {
            dispatch(loginByExternalApplicationUserSuccess(data));
          } else {

          }
        };
      },
      onError: (error) => {
        console.log(error, "error");
        return (dispatch) => {
          console.log('Employee ID does not exist');
          dispatch(loginByExternalApplicationUserFailure({ error: error }));
          window.location.href = `/signin`;
        };
      },
      label: 'LOGIN_BY_EXTERNAL_APPLICATION_USER',
      headers: {
        'Content-Type': 'application/json'
      }
    },
  };
};