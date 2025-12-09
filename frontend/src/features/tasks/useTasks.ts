// frontend/src/features/tasks/useTasks.ts
import { useCallback, useEffect, useState } from "react";

import { useToast } from "../../context/ToastContext";
import { useUser } from "../../context/UserContext";
import type {
  Project,
  ProjectListResponse,
  Task,
  TaskListResponse,
  TaskStatus,
  TaskUpdatePayload,
} from "../../lib/tasks";
import { shiftIsoDateByDays } from "../../lib/tasks";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseTasksArgs = {
  mineOnly: boolean;
  activeOnly: boolean;
  statusFilter: "" | TaskStatus;
  projectFilterId: number | null;
};

export type UseTasksResult = {
  tasks: Task[];
  projects: Project[];
  loadingTasks: boolean;
  tasksError: string | null;
  loadingProjects: boolean;
  projectsError: string | null;
  selectedTaskIds: number[];
  toggleTaskSelection: (id: number) => void;
  clearSelection: () => void;
  toggleSelectAllVisible: (visibleTasks: Task[]) => void;
  createTask: (
    title: string,
    description?: string,
    projectId?: number | null,
  ) => Promise<void>;
  updateTask: (id: number, updates: TaskUpdatePayload) => Promise<void>;
  deleteTask: (id: number, skipConfirm?: boolean) => Promise<void>;
  archiveTask: (id: number) => Promise<void>;
  restoreTask: (id: number) => Promise<void>;
  quickShiftDueDate: (task: Task, days: number) => Promise<void>;
  quickClearDueDate: (task: Task) => Promise<void>;
  bulkArchiveSelected: () => Promise<void>;
  bulkDeleteSelected: () => Promise<void>;
  bulkStatusChange: (status: TaskStatus) => Promise<void>;
  bulkShiftDueDate: (days: number) => Promise<void>;
  bulkClearDueDate: () => Promise<void>;
};

export const useTasks = (args: UseTasksArgs): UseTasksResult => {
  const { mineOnly, activeOnly, statusFilter, projectFilterId } = args;
  const { isAuthenticated, token } = useUser();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const clearSelection = () => setSelectedTaskIds([]);

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const toggleSelectAllVisible = (visibleTasks: Task[]) => {
    const visibleIds = visibleTasks.map((t) => t.id);
    if (visibleIds.length === 0) return;

    const allSelected = visibleIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) =>
        Array.from(new Set<number>([...prev, ...visibleIds])),
      );
    }
  };

  const loadProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
      return;
    }
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const res = await fetch(`${backendBase}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as ProjectListResponse;
      setProjects(data.items || []);
    } catch (err) {
      console.error(err);
      setProjectsError("Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  }, [token]);

  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setTasks([]);
      return;
    }

    setLoadingTasks(true);
    setTasksError(null);

    try {
      const params = new URLSearchParams();
      params.set("active_only", activeOnly ? "true" : "false");

      if (mineOnly) {
        params.set("mine", "true");
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (projectFilterId !== null) {
        params.set("project_id", String(projectFilterId));
      }

      const res = await fetch(
        `${backendBase}/api/tasks?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as TaskListResponse;
      setTasks(data.items || []);
    } catch (err) {
      console.error(err);
      setTasksError("Failed to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [isAuthenticated, token, mineOnly, activeOnly, statusFilter, projectFilterId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadTasks();
    } else {
      setTasks([]);
    }
  }, [isAuthenticated, loadTasks]);

  const reloadTasks = async () => {
    await loadTasks();
  };

  const createTask = async (
    title: string,
    description = "",
    projectId: number | null = projectFilterId,
  ) => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to create a task.", "error");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast("Task title is required.", "error");
      return;
    }

    const body: any = {
      title: trimmedTitle,
      description: description ?? "",
      status: "todo",
    };

    if (projectId !== null) {
      body.project_id = projectId;
    }

    try {
      const res = await fetch(`${backendBase}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      await reloadTasks();
      showToast("Task created.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create task.", "error");
    }
  };

  const updateTask = async (taskId: number, updates: TaskUpdatePayload) => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to update a task.", "error");
      return;
    }

    try {
      const res = await fetch(`${backendBase}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await reloadTasks();
    } catch (err) {
      console.error(err);
      showToast("Failed to update task.", "error");
    }
  };

  const deleteTask = async (taskId: number, skipConfirm = false) => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to delete a task.", "error");
      return;
    }

    if (!skipConfirm) {
      const confirmed = window.confirm("Delete this task permanently?");
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`${backendBase}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }
      await reloadTasks();
      showToast("Task deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task.", "error");
    }
  };

  const archiveTask = async (taskId: number) => {
    await updateTask(taskId, { is_active: false });
  };

  const restoreTask = async (taskId: number) => {
    await updateTask(taskId, { is_active: true });
  };

  const quickShiftDueDate = async (task: Task, days: number) => {
    await updateTask(task.id, {
      due_date: shiftIsoDateByDays(task.due_date ?? null, days),
    });
  };

  const quickClearDueDate = async (task: Task) => {
    await updateTask(task.id, { due_date: null });
  };

  const bulkStatusChange = async (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Set status to "${status}" for ${selectedTaskIds.length} task(s)?`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedTaskIds.map((id) => updateTask(id, { status })),
      );
      showToast("Bulk status update complete.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk status update failed for some tasks.", "error");
    }
  };

  const bulkShiftDueDate = async (days: number) => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Shift due date by +${days} day(s) for ${selectedTaskIds.length} task(s)?`,
    );
    if (!confirmed) return;

    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    try {
      await Promise.all(
        selectedTasks.map((t) =>
          updateTask(t.id, {
            due_date: shiftIsoDateByDays(t.due_date ?? null, days),
          }),
        ),
      );
      showToast("Bulk due date shift complete.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk due date shift failed for some tasks.", "error");
    }
  };

  const bulkClearDueDate = async () => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Clear due date for ${selectedTaskIds.length} task(s)?`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedTaskIds.map((id) =>
          updateTask(id, {
            due_date: null,
          }),
        ),
      );
      showToast("Bulk due dates cleared.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk due date clear failed for some tasks.", "error");
    }
  };

  const bulkArchiveSelected = async () => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Archive ${selectedTaskIds.length} selected task(s)?`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(selectedTaskIds.map((id) => archiveTask(id)));
      clearSelection();
      showToast("Selected tasks archived.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to archive some tasks.", "error");
    }
  };

  const bulkDeleteSelected = async () => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedTaskIds.length} selected task(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedTaskIds.map((id) => deleteTask(id, true)),
      );
      clearSelection();
      showToast("Selected tasks deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete some tasks.", "error");
    }
  };

  return {
    tasks,
    projects,
    loadingTasks,
    tasksError,
    loadingProjects,
    projectsError,
    selectedTaskIds,
    toggleTaskSelection,
    clearSelection,
    toggleSelectAllVisible,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
    quickShiftDueDate,
    quickClearDueDate,
    bulkArchiveSelected,
    bulkDeleteSelected,
    bulkStatusChange,
    bulkShiftDueDate,
    bulkClearDueDate,
  };
};
