// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import Store from "./StoreRedux/Store.js"


import { ThemeProvider } from '@mui/material/styles';
import themeBlue from './themeBlue';
import Notification from './Components/Notifications/Notification.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={Store}>
      <ThemeProvider theme={themeBlue}>
        <App />
        <Notification />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);