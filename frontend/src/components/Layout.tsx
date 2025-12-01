import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          backgroundColor: isDark ? "#020617" : "#f9fafb",
          color: isDark ? "#e5e7eb" : "#111827",
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Topbar />
          <main
            style={{
              padding: "1rem",
              overflow: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default Layout;
