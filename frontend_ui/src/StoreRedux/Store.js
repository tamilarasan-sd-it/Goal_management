// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import apiMiddleware from './middleware/apiMiddleware';
import notificationMiddleware from './middleware/notificationMiddleware';
import socketMiddleware from './middleware/socketMiddleware';


const Store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
    }).concat(apiMiddleware, notificationMiddleware,socketMiddleware),
});

export default Store;