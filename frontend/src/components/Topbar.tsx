// filename: frontend/src/components/Topbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const Topbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        height: "50px",
        borderBottom: `1px solid ${isDark ? "#374151" : "#dddddd"}`,
        backgroundColor: isDark ? "#020617" : "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div>DevCell Platform</div>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            fontSize: "0.8rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
            backgroundColor: isDark ? "#0f172a" : "#f9fafb",
            color: isDark ? "#e5e7eb" : "#111827",
            cursor: "pointer",
          }}
        >
          {isDark ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>
      <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        {isAuthenticated && user ? (
          <>
            Signed in as <strong>{user.username}</strong>
            {user.role ? ` (${user.role})` : ""}
            <button
              type="button"
              onClick={handleLogout}
              style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              border: "none",
              background: "none",
              fontSize: "0.9rem",
              padding: 0,
            }}
          >
            Not signed in
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
