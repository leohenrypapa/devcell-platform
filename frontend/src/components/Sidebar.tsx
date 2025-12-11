// frontend/src/components/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  adminOnly?: boolean;
};

type SidebarProps = {
  onNavigate?: () => void;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/chat", label: "Unit Chat" },
  { to: "/tasks", label: "Tasks" },
  { to: "/projects", label: "Projects" },
  { to: "/standup", label: "Standups" },
  { to: "/knowledge", label: "Knowledge Base" },
  { to: "/training", label: "Training" },
  { to: "/review", label: "Code Review" },
  { to: "/multi-agent-sdlc", label: "Multi-Agent SDLC" },
  { to: "/admin", label: "Admin", adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === "dark";

  const textMuted = "var(--dc-text-muted)";
  const activeBg = "var(--dc-bg-subtle)";

  const baseLinkStyle: React.CSSProperties = {
    display: "block",
    padding: "0.55rem 0.9rem",
    textDecoration: "none",
    borderRadius: "0.5rem",
    fontSize: "var(--dc-font-size-sm)",
    transition: "background-color 120ms ease, color 120ms ease",
  };

  const canSeeAdmin = (user as any)?.role === "admin";

  return (
    <div
      style={{
        height: "100%",
        padding: "1rem 0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        backgroundColor: "var(--dc-bg-surface)",
      }}
    >
      <div
        style={{
          padding: "0 0.4rem",
          fontWeight: 600,
          fontSize: "var(--dc-font-size-md)",
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
        }}
      >
        <span>DevCell</span>
        <span
          style={{
            color: textMuted,
            fontSize: "var(--dc-font-size-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Platform
        </span>
      </div>

      <nav aria-label="Main">
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
          }}
        >
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !canSeeAdmin) {
              return null;
            }

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    ...baseLinkStyle,
                    backgroundColor: isActive ? activeBg : "transparent",
                    color: isActive
                      ? isDark
                        ? "#f9fafb"
                        : "#111827"
                      : isDark
                      ? "#e5e7eb"
                      : "#111827",
                  })}
                  onClick={onNavigate}
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
