// frontend/src/components/layout/AppShell.tsx
import React, { useState } from "react";

import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="dc-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="dc-sidebar-desktop"
        aria-label="Primary navigation"
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar />
      </aside>

      {/* Main column: topbar + content */}
      <div
        className="dc-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          role="main"
          aria-label="Main content"
          className="dc-main-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="dc-sidebar-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="dc-sidebar-overlay-backdrop"
            onClick={closeSidebar}
          />
          <div className="dc-sidebar-overlay-panel">
            <Sidebar onNavigate={closeSidebar} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
