import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar: React.FC = () => {
  const baseStyle: React.CSSProperties = {
    display: "block",
    padding: "0.5rem 1rem",
    textDecoration: "none",
    color: "#333",
  };

  return (
    <aside
      style={{
        width: "220px",
        borderRight: "1px solid #ddd",
        paddingTop: "1rem",
      }}
    >
      <h2 style={{ padding: "0 1rem", fontSize: "1.2rem" }}>DevCell</h2>
      <nav style={{ marginTop: "1rem" }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/chat"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Unit Chat (LLM)
        </NavLink>
        <NavLink
          to="/knowledge"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Knowledge Base
        </NavLink>
        <NavLink
          to="/standup"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Standups
        </NavLink>
        <NavLink
          to="/projects"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Projects
        </NavLink>
        <NavLink
          to="/admin"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Admin
        </NavLink>
        <NavLink
          to="/review"
          style={({ isActive }) => ({
            ...baseStyle,
            backgroundColor: isActive ? "#eee" : "transparent",
          })}
        >
          Code Review
        </NavLink>

      </nav>
    </aside>
  );
};

export default Sidebar;
