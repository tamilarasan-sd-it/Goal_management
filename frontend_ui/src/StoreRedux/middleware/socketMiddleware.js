import * as ActionTypes from '../constants/actionTypes';
import io from 'socket.io-client';

const socketMiddleware = (store) => {
    const socket = io(`${import.meta.env.VITE_SOCKET_URL}`);

    socket.on('connect', () => console.log('Connected to Socket.IO server'));

    socket.on('addSocket', (result) => {
        console.log(result, "results in add socket");

        try {
            if (result?.success) {
                store.dispatch({
                    type: ActionTypes.ADD_DATA,
                    payload: {
                        // loading must be the key string (e.g. "categoryLoad"), not a boolean.
                        // result.loading comes from req.query.loading sent by the frontend.
                        loading: result.loading,
                        page: result.page,
                        component: result.component,
                        data: result.data,
                    }
                });
            } else {
                console.error('addSocket failed:', result);
            }
        } catch (error) {
            console.error('Error handling addSocket:', error);
        }
    });

    socket.on('updateSocket', (result) => {
        try {
            if (result?.success) {
                store.dispatch({
                    type: ActionTypes.UPDATE_DATA,
                    payload: {
                        // loading must be the key string (e.g. "categoryLoad"), not a boolean.
                        loading: result.loading,
                        page: result.page,
                        component: result.component,
                        // idName and id are required by the UPDATE_DATA reducer branch
                        idName: result.idName,
                        id: result.id,
                        updatedData: result.updatedData,
                    }
                });
            }
        } catch (error) {
            console.error('Error handling updateSocket:', error);
        }
    });

    socket.on('deleteSocket', (result) => {
        try {
            if (result?.success) {
                store.dispatch({
                    type: ActionTypes.DELETE_DATA,
                    payload: {
                        // loading must be the key string (e.g. "categoryLoad"), not a boolean.
                        loading: result.loading,
                        page: result.page,
                        component: result.component,
                        // idName and id are required by the DELETE_DATA reducer branch to
                        // filter out the deleted row. Backend already sends both fields.
                        idName: result.idName,
                        id: result.id,
                    }
                });
            }
        } catch (error) {
            console.error('Error handling deleteSocket:', error);
        }
    });

    socket.on('fetchSocket', (data) => {
        try {
            if (data?.success) {
                store.dispatch({
                    type: ActionTypes.FETCH_DATA_SUCCESS,
                    payload: {
                        page: data.page,
                        component: data.component,
                        loading: data.loading,
                        data: data.data
                    }
                });
            } else {
                console.error('fetchSocket failed:', data);
            }
        } catch (error) {
            console.error('Error handling fetchSocket:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    return (next) => (action) => {
        return next(action);
    };
};

export default socketMiddleware;