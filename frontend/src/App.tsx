// filename: frontend/src/App.tsx
import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Layout from "./components/Layout";
import { ThemeProvider } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";
import AdminPage from "./pages/AdminPage";
import ChatPage from "./pages/ChatPage";
import CodeReviewPage from "./pages/CodeReviewPage";
import DashboardPage from "./pages/DashboardPage";
import KnowledgePage from "./pages/KnowledgePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import RegisterPage from "./pages/RegisterPage";
import StandupPage from "./pages/StandupPage";
import TasksPage from "./pages/TasksPage";
import TrainingPage from "./pages/TrainingPage";

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
        <Route
          path="/"
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/knowledge"
          element={
            isAuthenticated ? <KnowledgePage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/standup"
          element={
            isAuthenticated ? <StandupPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/tasks"
          element={isAuthenticated ? <TasksPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/projects"
          element={
            isAuthenticated ? <ProjectsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/review"
          element={
            isAuthenticated ? <CodeReviewPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/training"
          element={
            isAuthenticated ? <TrainingPage /> : <Navigate to="/login" replace />
          }
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );

  return (
    <ThemeProvider>{isAuthEntryPage ? authRoutes : mainRoutes}</ThemeProvider>
  );
};

export default App;
