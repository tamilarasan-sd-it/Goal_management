
// reducer/layout.js
export const CHANGE_LAYOUT = 'CHANGE_LAYOUT';
export const COLLAPSE_MENU = 'COLLAPSE_MENU';
export const COLLAPSE_TOGGLE = 'COLLAPSE_TOGGLE';
export const LAYOUT_TYPE = 'LAYOUT_TYPE';
export const NAV_COLLAPSE_LEAVE = 'NAV_COLLAPSE_LEAVE';
export const NAV_CONTENT_LEAVE = 'NAV_CONTENT_LEAVE';

// reducer/permissions.js
export const SET_ROLE_PERMISSIONS = 'SET_ROLE_PERMISSIONS';

// Middleware/apimiddleware.js
export const API = 'API';

// reducer/auth.js/login
export const LOGIN_START = 'LOGIN_START';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

// reducer/auth.js/logout
export const LOGOUT = 'LOGOUT';

// reducer/auth.js/login -> form external application wise
export const LOGIN_BY_EXTERNAL_APPLICATION_USER_START = 'LOGIN_BY_EXTERNAL_APPLICATION_USER_START';
export const LOGIN_BY_EXTERNAL_APPLICATION_USER_SUCCESS = 'LOGIN_BY_EXTERNAL_APPLICATION_USER_SUCCESS';
export const LOGIN_BY_EXTERNAL_APPLICATION_USER_FAILURE = 'LOGIN_BY_EXTERNAL_APPLICATION_USER_FAILURE';

// Notification
export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';

export const SET_LOADING = 'SET_LOADING';
export const FETCH_DATA_SUCCESS = 'FETCH_DATA_SUCCESS';
export const SET_FILTERS = 'SET_FILTERS';
export const ERROR_ACTION = 'ERROR_ACTION';

export const ADD_DATA = 'ADD_DATA';
export const UPDATE_DATA = 'UPDATE_DATA';
export const DELETE_DATA = 'DELETE_DATA';

export const REDIRECT_ACTION = 'REDIRECT_ACTION';


// Action Creators
export const changeLayout = (layout) => ({
    type: CHANGE_LAYOUT,
    layout,
});

export const collapseMenu = () => ({
    type: COLLAPSE_MENU,
});

export const collapseToggle = (menu) => ({
    type: COLLAPSE_TOGGLE,
    menu,
});

export const layoutType = (layoutType) => ({
    type: LAYOUT_TYPE,
    layoutType,
});

export const navCollapseLeave = (menu) => ({
    type: NAV_COLLAPSE_LEAVE,
    menu,
});

export const navContentLeave = () => ({
    type: NAV_CONTENT_LEAVE,
});

export const setRolePermissions = (permissions) => ({
    type: SET_ROLE_PERMISSIONS,
    payload: permissions,
});

export const loginStart = () => ({
    type: LOGIN_START,
});

export const loginSuccess = (data) => ({
    type: LOGIN_SUCCESS,
    payload: data,
});

export const loginFailure = (error) => ({
    type: LOGIN_FAILURE,
    payload: error,
});

export const logout = () => ({
    type: LOGOUT,
});


export const loginByExternalApplicationUserStart = () => ({
    type: LOGIN_BY_EXTERNAL_APPLICATION_USER_START,
});

export const loginByExternalApplicationUserSuccess = (data) => {

    return {
        type: LOGIN_BY_EXTERNAL_APPLICATION_USER_SUCCESS,
        payload: data,
    }
};

export const loginByExternalApplicationUserFailure = (error) => ({
    type: LOGIN_BY_EXTERNAL_APPLICATION_USER_FAILURE,
    payload: error,
});

export const showNotification = (payload) => ({
    type: SHOW_NOTIFICATION,
    payload,
});

export const hideNotification = () => ({
    type: HIDE_NOTIFICATION,
});

export const setLoading = (page, component, isLoading) => ({
    type: SET_LOADING,
    page,
    component,
    payload: isLoading,
});

export const fetchDataSuccess = (page, component, data) => ({
    type: FETCH_DATA_SUCCESS,
    page,
    component,
    payload: data,
});

export const setFilters = (page, component, filters) => ({
    type: SET_FILTERS,
    page,
    component,
    payload: filters,
});

export const fetchDataError = (error) => ({
    type: ERROR_ACTION,
    payload: error,
});

export const addDataAction = (page, component, data) => ({
    type: ADD_DATA,
    payload: { page, component, data },
});

export const updateDataAction = (page, component, id, updatedData) => ({
    type: UPDATE_DATA,
    payload: { page, component, id, updatedData },
});

export const deleteDataAction = (page, component, id) => ({
    type: DELETE_DATA,
    payload: { page, component, id },
});

export const redirectAction = () => ({
    type: REDIRECT_ACTION,
});

// Generalized API Action Creators
export const apiAction = ({ url, method, data, label, params, actionType, contentType = 'application/json' }) => {
    const token = JSON.parse(sessionStorage.getItem('token'));

    const successHandler = (responseData) => {


        switch (actionType) {
            case 'add':
                return AddDataAction(label, responseData);
            case 'update':
                return UpdateDataAction(label, responseData);
            case 'delete':
                return UpdateDataAction(label, responseData);
            case 'fetch':
                return FetchDataSuccessAction(label, responseData);
        }
    };
    // console.log('API Request:', { url, method, data, label, params, actionType });
    return {
        type: API,
        payload: {
            url,
            method,
            data,
            onSuccess: successHandler,
            onError: (responseData) => DataErrorAction(responseData),
            label: `${label.page}_${label.component}`,
            headers: {
                'Content-Type': contentType,
                Authorization: `Bearer ${token}`,
            },
            params,
        },
    };
};

// Action creators for specific API actions
const FetchDataSuccessAction = (label, responseData) => ({
    type: FETCH_DATA_SUCCESS,
    payload: {
        page: label.page,
        component: label.component,
        data: responseData,
        loading: label.loading,
    },
});

const DataErrorAction = (responseData) => {

    return ({
        type: ERROR_ACTION,
        payload: responseData,
    })
};

const AddDataAction = (label, responseData) => ({
    type: SHOW_NOTIFICATION,
    payload: {
        type: "success",
        message: responseData?.message,
    },
});

const UpdateDataAction = (label, responseData) => {
    return {
        type: SHOW_NOTIFICATION,
        payload: {
            type: "success",
            message: responseData?.message,
        },
    }
};







