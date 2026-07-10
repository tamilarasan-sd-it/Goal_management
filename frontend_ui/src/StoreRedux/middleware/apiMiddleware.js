import axios from 'axios';
import * as API from '../constants/actionTypes';
import { jwtDecode } from 'jwt-decode';

const apiMiddleware = ({ dispatch }) => (next) => (action) => {
    next(action);

    if (action.type === API.API) {
        const { url, method, data, onSuccess, onError, label, headers, params } = action.payload;

        preApiCallCheck({ url, method, params })
            .then(() => {
                const token = sessionStorage.getItem('token');
                if (token) {
                    const decoded = jwtDecode(token);
                    const currentTime = Math.floor(Date.now() / 1000);
                    if (decoded.exp < currentTime) {
                        dispatch({ type: 'LOGOUT' });
                        dispatch(API.setLoading(params?.page, params?.loading, false));
                        dispatch(API.showNotification({ type: 'error', message: "Token has expired" }));
                        return;
                    }
                }

                return axios({
                    url,
                    method,
                    // Always send page/component/loading as query params so the backend
                    // can read them from req.query for ALL methods (GET, POST, PUT, DELETE).
                    // For POST/PUT also send the body payload via `data`.
                    params,
                    ...(['POST', 'PUT'].includes(method) ? { data } : {}),
                    headers: {
                        ...headers,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                });
            })
            .then((response) => {
                if (!response) {
                    dispatch(API.setLoading(params?.page, params?.loading, false));
                    dispatch(API.showNotification({
                        type: 'error',
                        message: 'No response from server (possible cache issue)'
                    }));
                    return;
                }

                if (response?.data?.success) {
                    dispatch(onSuccess(response?.data));
                } else {
                    dispatch(onError(response?.data ?? { message: 'Request failed', ...params }));
                }
            })
            .catch((error) => {
    let message = "Something went wrong.";

    if (!error.response) {
        message = "Unable to connect to server.";
    } else {
        const status = error.response.status;
        const serverMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            "";

        if (status === 401) {
            if (serverMessage.toLowerCase().includes("incorrect password")) {
                message = "Incorrect Password.";
            } else if (serverMessage.toLowerCase().includes("invalid employee")) {
                message = "Invalid Employee ID.";
            } else {
                message = "Invalid Employee ID or Password.";
            }
        } else if (status === 404) {
            message = "Service not found.";
        } else if (status === 500) {
            message = "Internal server error.";
        } else {
            message = serverMessage || error.message;
        }
    }

    dispatch(onError({ message, ...params }));
});
    }
};

const preApiCallCheck = async ({ url, method, params }) => {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid API URL.');
    }
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!validMethods.includes(method)) {
        throw new Error('Invalid HTTP method.');
    }
    if (['GET', 'DELETE'].includes(method) && params) {
        if (typeof params !== 'object') {
            throw new Error('Params must be an object for GET/DELETE requests.');
        }
    }
    await checkServerAvailability(url, method);
};

const checkServerAvailability = async (url, method) => {
    const healthCheckUrl = `${import.meta.env.VITE_SOCKET_URL}/health?url=${url}&method=${method}`;
    try {
        await axios.head(healthCheckUrl);
    } catch (error) {
        throw new Error('Server is unavailable.');
    }
};

export default apiMiddleware;