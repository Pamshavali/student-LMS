import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying authentication session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: redirect to user's assigned dashboard
    const fallbackPath =
      user.role === "ADMIN"
        ? "/dashboard/admin"
        : user.role === "TEACHER"
        ? "/dashboard/teacher"
        : "/dashboard/student";

    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
