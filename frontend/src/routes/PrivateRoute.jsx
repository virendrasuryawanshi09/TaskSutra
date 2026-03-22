import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserAuth from "../hooks/useUserAuth.jsx";
import { getDashboardRoute } from "../utils/helper.js";

const PrivateRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, role } = useUserAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
