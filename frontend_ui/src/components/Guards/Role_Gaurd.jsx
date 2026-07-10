import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const RoleGuard = ({ children }) => {
    const navigate = useNavigate();
    const { isLoggedIn, user, loading, rolePermissions } = useSelector((state) => state.auth);
    const currentPath = window.location.pathname;
    const [redirect, setRedirect] = useState(null);
    useEffect(() => {

        if (!isLoggedIn) {
            setRedirect('/login');
        } else {


            const allowedPaths = rolePermissions || [];
            const pathMatches = allowedPaths.some(pattern => {
                // Replace :id with a regex pattern that matches any string
                const regexPattern = pattern.replace(/\/:id/, '/[0-9]+');
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(currentPath);
            });

            if (!pathMatches) {
                setRedirect('/');
            }
        }
    }, [isLoggedIn, user, currentPath]);

    useEffect(() => {
        if (redirect) {
            navigate(redirect, { replace: true });
            setRedirect(null)
        }
    }, [redirect, currentPath]);


console.log("Current Path:", currentPath);
console.log("Allowed Paths:", rolePermissions);
    return children;
};

export default RoleGuard;
