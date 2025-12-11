// frontend/src/router/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

type ProtectedRouteProps = {
  element: React.ReactElement;
  requireAdmin?: boolean;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  requireAdmin = false,
}) => {
  const { user, token, loading } = useUser();

  // Still checking /auth/me or restoring session
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--dc-font-size-sm)",
          color: "var(--dc-text-muted)",
        }}
      >
        Checking your DevCell access...
      </div>
    );
  }

  // Not logged in at all: no token in context/localStorage
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If route requires admin, check minimal flags on user if available.
  // We don't block if we can't determine; we just err on the side of allowing.
  if (requireAdmin) {
    const anyUser: any = user || {};
    const isAdmin =
      anyUser.is_admin === true ||
      anyUser.admin === true ||
      anyUser.role === "admin";

    if (!isAdmin) {
      // Not admin: send to home (you can change this to /profile if you prefer)
      return <Navigate to="/" replace />;
    }
  }

  // Authenticated (and admin if required): render wrapped element
  return element;
};

export default ProtectedRoute;
