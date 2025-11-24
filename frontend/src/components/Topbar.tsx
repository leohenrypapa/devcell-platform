import React from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        height: "50px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
      }}
    >
      <div>DevCell Platform</div>
      <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        {isAuthenticated && user ? (
          <>
            Signed in as <strong>{user.username}</strong>
            {user.role ? ` (${user.role})` : ""}{" "}
            <button
              onClick={handleLogout}
              style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}
            >
              Logout
            </button>
          </>
        ) : (
          <span
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
          >
            Not signed in
          </span>
        )}
      </div>
    </header>
  );
};

export default Topbar;
