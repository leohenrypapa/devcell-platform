// filename: frontend/src/components/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const Sidebar: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === "dark";

  const baseStyle: React.CSSProperties = {
    display: "block",
    padding: "0.5rem 1rem",
    textDecoration: "none",
    color: isDark ? "#e5e7eb" : "#333333",
    fontSize: "0.9rem",
  };

  const activeBg = isDark ? "#1f2937" : "#eeeeee";

  return (
    <aside
      style={{
        width: "220px",
        borderRight: `1px solid ${isDark ? "#374151" : "#dddddd"}`,
        paddingTop: "1rem",
        backgroundColor: isDark ? "#020617" : "#ffffff",
      }}
    >
      <h2
        style={{
          padding: "0 1rem",
          fontSize: "1.2rem",
          color: isDark ? "#e5e7eb" : "#111827",
        }}
      >
        DevCell
      </h2>
      <nav style={{ marginTop: "1rem" }} aria-label="Main navigation">
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/chat"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Unit Chat (LLM)
        </NavLink>
        <NavLink
          to="/knowledge"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Knowledge Base
        </NavLink>
        <NavLink
          to="/standup"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Standups
        </NavLink>
        <NavLink
          to="/tasks"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Tasks
        </NavLink>
        <NavLink
          to="/training"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Training
        </NavLink>
        <NavLink
          to="/projects"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Projects
        </NavLink>
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              ...baseStyle,
              backgroundColor: isActive ? activeBg : "transparent",
            })}
          >
            Admin
          </NavLink>
        )}
        <NavLink
          to="/review"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? activeBg : "transparent",
          })}
        >
          Code Review
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
