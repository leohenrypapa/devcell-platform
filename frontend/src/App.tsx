import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import KnowledgePage from "./pages/KnowledgePage";
import StandupPage from "./pages/StandupPage";
import ProjectsPage from "./pages/ProjectsPage";
import AdminPage from "./pages/AdminPage";
import CodeReviewPage from "./pages/CodeReviewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import { useUser } from "./context/UserContext";
import TasksPage from "./pages/TasksPage";
import { ThemeProvider } from "./context/ThemeContext";

const App: React.FC = () => {
  const { isAuthenticated, user } = useUser();
  const location = useLocation();

  const isAuthEntryPage =
    location.pathname === "/login" || location.pathname === "/register";

  const isAdmin = isAuthenticated && user?.role === "admin";

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
        {/* Protected routes */}
        <Route
          path="/"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/knowledge"
          element={isAuthenticated ? <KnowledgePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/standup"
          element={isAuthenticated ? <StandupPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks"
          element={isAuthenticated ? <TasksPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects"
          element={isAuthenticated ? <ProjectsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/review"
          element={
            isAuthenticated ? <CodeReviewPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminPage />
            ) : isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );

  return <ThemeProvider>{isAuthEntryPage ? authRoutes : mainRoutes}</ThemeProvider>;
};

export default App;
