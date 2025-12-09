// frontend/src/App.tsx
import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Layout from "./components/Layout";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./router/ProtectedRoute";
import { appRoutes } from "./router/Routes";

// NEW: global tokens + layout styles
import "./styles/theme.css";

const App: React.FC = () => {
  const location = useLocation();
  const isAuthEntryPage =
    location.pathname === "/login" || location.pathname === "/register";

  const authRoutes = (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  const mainRoutes = (
    <Layout>
      <Routes>
        {appRoutes.map(({ path, element, protected: isProtected, adminOnly }) => {
          if (isProtected || adminOnly) {
            return (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute
                    requireAdmin={Boolean(adminOnly)}
                    element={element}
                  />
                }
              />
            );
          }

          return <Route key={path} path={path} element={element} />;
        })}

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );

  return (
    <ThemeProvider>{isAuthEntryPage ? authRoutes : mainRoutes}</ThemeProvider>
  );
};

export default App;
