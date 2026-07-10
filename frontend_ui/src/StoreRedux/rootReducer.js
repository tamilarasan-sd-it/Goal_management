import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './reducers/athuReducer'
import notificationReducer from './reducers/notificationReducer';
import layoutReducer from './reducers/layoutReducer';
import CommonReducer from './reducers/commonReducer';
//combine All reducers into rootReducer
const rootReducer = combineReducers({
    layout:layoutReducer,
    auth: authReducer,
    notification: notificationReducer,
    dataService : CommonReducer,
});

export default rootReducer;