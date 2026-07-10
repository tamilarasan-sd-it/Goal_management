import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideNotification } from '../../StoreRedux/constants/actionTypes';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Notification() {
    const dispatch = useDispatch();
    const { notification } = useSelector((state) => state.notification);

    useEffect(() => {
        if (notification.show) {
            switch (notification.type) {
                case 'success':
                    toast.success(notification.message, {
                        onClose: () => {
                            dispatch(hideNotification());
                        },
                    });
                    break;
                case 'error':
                    toast.error(notification.message, {
                        onClose: () => {
                            dispatch(hideNotification());
                        },
                    });
                    break;
                case 'warning':
                    toast.warn(notification.message, {
                        onClose: () => {
                            dispatch(hideNotification());
                        },
                    });
                    break;
                case 'info':
                    toast.info(notification.message, {
                        onClose: () => {
                            dispatch(hideNotification());
                        },
                    });
                    break;
                default:
                    toast(notification.message, {
                        onClose: () => {
                            dispatch(hideNotification());
                        },
                    });
                    break;
            }
        }
    }, [notification, dispatch]);

    return (
        <ToastContainer
            position="top-center"
            autoClose={1000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            closeButton={false}
            pauseOnHover
            theme={notification.type === 'error' ? 'dark' : 'light'}
        />
    );
}

export default Notification;