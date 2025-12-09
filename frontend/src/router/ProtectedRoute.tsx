// frontend/src/router/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useUser } from "../context/UserContext";

type ProtectedRouteProps = {
  element: React.ReactElement;
  requireAdmin?: boolean;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  requireAdmin = false,
}) => {
  const { isAuthenticated, user } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  if (requireAdmin && user && (user as any).role !== "admin") {
    // Non-admins get bounced to dashboard
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
