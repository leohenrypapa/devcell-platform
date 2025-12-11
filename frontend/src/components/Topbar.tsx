// frontend/src/components/Topbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import RagStatusChip from "./RagStatusChip";

type TopbarProps = {
  onMenuClick?: () => void;
};

const TopbarTitle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div className="dc-topbar-title">DevCell Platform</div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          borderRadius: "999px",
          border: `1px solid var(--dc-border-subtle)`,
          padding: "0.2rem 0.75rem",
          fontSize: "var(--dc-font-size-xs)",
          backgroundColor: "transparent",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <span
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "999px",
            backgroundColor: isDark ? "#facc15" : "#0f172a",
          }}
        />
        <span>{isDark ? "Dark" : "Light"}</span>
      </button>
    </div>
  );
};

const TopbarUserSection: React.FC = () => {
  const navigate = useNavigate();

  // FIX: Use token instead of isAuthenticated (which does not exist)
  const { user, token, logout } = useUser();
  const isAuthenticated = Boolean(token);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // When NOT logged in
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{
          fontSize: "var(--dc-font-size-sm)",
          borderRadius: "999px",
          padding: "0.35rem 0.85rem",
          border: `1px solid var(--dc-border-subtle)`,
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        Not signed in
      </button>
    );
  }

  // When logged in
  const displayName =
    (user as any)?.display_name ?? user?.username ?? "User";

  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/profile")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          border: `1px solid var(--dc-border-subtle)`,
          backgroundColor: "transparent",
          cursor: "pointer",
          fontSize: "var(--dc-font-size-sm)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "1.75rem",
            height: "1.75rem",
            borderRadius: "999px",
            backgroundColor: "var(--dc-color-primary-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--dc-font-size-xs)",
            fontWeight: 600,
          }}
        >
          {initials}
        </span>
        <span>{displayName}</span>
      </button>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          borderRadius: "999px",
          padding: "0.35rem 0.75rem",
          border: "none",
          backgroundColor: "var(--dc-color-danger)",
          color: "#f9fafb",
          cursor: "pointer",
          fontSize: "var(--dc-font-size-sm)",
        }}
      >
        Logout
      </button>
    </div>
  );
};

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = "var(--dc-bg-surface)";
  const border = "var(--dc-border-subtle)";

  return (
    <header
      style={{
        height: "var(--dc-topbar-height)",
        borderBottom: `1px solid ${border}`,
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        gap: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "999px",
            border: `1px solid ${border}`,
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "1.15rem",
              height: "0.12rem",
              borderRadius: "999px",
              backgroundColor: isDark ? "#e5e7eb" : "#111827",
              boxShadow: "0 0.3rem 0 0 currentColor, 0 -0.3rem 0 0 currentColor",
            }}
          />
        </button>
        <TopbarTitle />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <RagStatusChip />
        <TopbarUserSection />
      </div>
    </header>
  );
};

export default Topbar;
