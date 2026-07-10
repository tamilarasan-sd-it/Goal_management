import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const { isLoggedIn, user } = useSelector((state) => state.auth);

  // If user is logged in, redirect them away from /signin or /register
  console.log(user, "user");


  if (isLoggedIn) {

   /*  if (user?.id == 12345) {
      return <Navigate to="/goal-views" replace />;
    }
    else if (user?.id == 1400) {
      return <Navigate to="/goal-reviews" replace />;
    } else {
      return <Navigate to="/goal-views" replace />;
    }  */
    if (user?.id == 12345) {
      return <Navigate to="/template-list" replace />;
    }
    else if (user?.id == 1400) {
      return <Navigate to="/template-list" replace />;
    } else {
      return <Navigate to="/template-list" replace />;
    }
   
  }

  return children;
};

export default AuthGuard;