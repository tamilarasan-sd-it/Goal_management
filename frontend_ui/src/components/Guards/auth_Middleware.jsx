import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const Auth_Middleware = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);

    // If user is logged in, redirect them away from /signin or /register
    if (!isLoggedIn) {
        return <Navigate to="/signin" replace />;
    }

    return children;
};

export default Auth_Middleware;