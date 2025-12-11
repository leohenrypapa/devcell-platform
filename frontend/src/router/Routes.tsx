// frontend/src/router/Routes.tsx

import type React from "react";
import AdminPage from "../pages/AdminPage";
import ChatPage from "../pages/ChatPage";
import CodeReviewPage from "../pages/CodeReviewPage";
import DashboardPage from "../pages/DashboardPage";
import KnowledgePage from "../pages/KnowledgePage";
import ProjectsPage from "../pages/ProjectsPage";
import StandupPage from "../pages/StandupPage";
import TasksPage from "../pages/TasksPage";
import TrainingPage from "../pages/TrainingPage";
import MultiAgentSdlcDemoPage from "../pages/MultiAgentSdlcDemoPage";

export type AppRoute = {
  path: string;
  element: React.ReactElement;
  protected?: boolean;
  adminOnly?: boolean;
};

export const appRoutes: AppRoute[] = [
  { path: "/", element: <DashboardPage />, protected: true },
  { path: "/chat", element: <ChatPage />, protected: true },
  { path: "/tasks", element: <TasksPage />, protected: true },
  { path: "/projects", element: <ProjectsPage />, protected: true },
  { path: "/standup", element: <StandupPage />, protected: true },
  { path: "/knowledge", element: <KnowledgePage />, protected: true },
  { path: "/training", element: <TrainingPage />, protected: true },
  { path: "/review", element: <CodeReviewPage />, protected: true },
  { path: "/admin", element: <AdminPage />, protected: true, adminOnly: true },
  { path: "/multi-agent-sdlc", element: <MultiAgentSdlcDemoPage />, protected: true, adminOnly: false},
];
