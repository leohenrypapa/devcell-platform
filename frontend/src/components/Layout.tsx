// frontend/src/components/Layout.tsx
import React from "react";

import { ToastProvider } from "../context/ToastContext";
import AppShell from "./layout/AppShell";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ToastProvider>
      <div className="dc-root" style={{ height: "100vh" }}>
        <AppShell>{children}</AppShell>
      </div>
    </ToastProvider>
  );
};

export default Layout;
