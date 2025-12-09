// frontend/src/features/standups/useStandupTasks.ts
import { useCallback, useEffect, useState } from "react";

import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import type { Task, TaskListResponse } from "../../lib/tasks";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseStandupTasksResult = {
  tasks: Task[];
  loadingTasks: boolean;
  taskError: string | null;
  reloadTasks: (projectId?: number | null) => void;
};

export const useStandupTasks = (): UseStandupTasksResult => {
  const { isAuthenticated, token } = useUser();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const loadMyTasks = useCallback(
    async (projectId?: number | null) => {
      if (!isAuthenticated || !token) {
        setTasks([]);
        return;
      }
      setLoadingTasks(true);
      setTaskError(null);
      try {
        const params = new URLSearchParams();
        params.set("mine", "true");
        params.set("active_only", "true");
        if (projectId !== undefined && projectId !== null) {
          params.set("project_id", String(projectId));
        }
        const res = await fetch(
          `${backendBase}/api/tasks?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TaskListResponse;
        setTasks(data.items || []);
      } catch (err) {
        console.error(err);
        setTaskError("Failed to load tasks.");
        showToast("Failed to load tasks for standup view.", "error");
      } finally {
        setLoadingTasks(false);
      }
    },
    [isAuthenticated, token, showToast],
  );

  useEffect(() => {
    if (isAuthenticated) {
      void loadMyTasks();
    } else {
      setTasks([]);
    }
  }, [isAuthenticated, loadMyTasks]);

  return {
    tasks,
    loadingTasks,
    taskError,
    reloadTasks: (projectId?: number | null) => {
      void loadMyTasks(projectId);
    },
  };
};
