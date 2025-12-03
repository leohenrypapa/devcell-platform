import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

type Task = {
  id: number;
  owner: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  project_id?: number | null;
  project_name?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  origin_standup_id?: number | null;
};

type TaskListResponse = {
  items: Task[];
};

type Project = {
  id: number;
  name: string;
};

type ProjectListResponse = {
  items: Project[];
};

type TaskUpdatePayload = Partial<
  Pick<
    Task,
    | "status"
    | "progress"
    | "is_active"
    | "title"
    | "description"
    | "project_id"
    | "due_date"
  >
>;

type TasksFilterPreset = {
  mineOnly: boolean;
  activeOnly: boolean;
  statusFilter: "" | TaskStatus;
  projectFilterId: number | null;
};

const TASKS_FILTER_PRESET_KEY = "devcell-tasks-filter-preset";

const loadTasksFilterPreset = (): TasksFilterPreset | null => {
  try {
    const raw = localStorage.getItem(TASKS_FILTER_PRESET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TasksFilterPreset>;
    return {
      mineOnly: typeof parsed.mineOnly === "boolean" ? parsed.mineOnly : true,
      activeOnly:
        typeof parsed.activeOnly === "boolean" ? parsed.activeOnly : true,
      statusFilter:
        parsed.statusFilter === "todo" ||
        parsed.statusFilter === "in_progress" ||
        parsed.statusFilter === "done" ||
        parsed.statusFilter === "blocked" ||
        parsed.statusFilter === ""
          ? parsed.statusFilter
          : "",
      projectFilterId:
        typeof parsed.projectFilterId === "number"
          ? parsed.projectFilterId
          : null,
    };
  } catch {
    return null;
  }
};

const saveTasksFilterPreset = (preset: TasksFilterPreset) => {
  try {
    localStorage.setItem(TASKS_FILTER_PRESET_KEY, JSON.stringify(preset));
  } catch {
    // ignore
  }
};

const shiftIsoDateByDays = (isoDate: string | null, days: number): string => {
  const base = isoDate ? new Date(isoDate) : new Date();
  // normalize to noon to avoid DST-related weirdness
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

const getStatusPillStyle = (status: TaskStatus): React.CSSProperties => {
  let backgroundColor = "#6b7280"; // gray (todo)
  if (status === "in_progress") backgroundColor = "#2563eb"; // blue
  else if (status === "done") backgroundColor = "#16a34a"; // green
  else if (status === "blocked") backgroundColor = "#b91c1c"; // red

  return {
    display: "inline-block",
    padding: "0.15rem 0.5rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#fff",
    backgroundColor,
  };
};

const formatStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    case "blocked":
      return "Blocked";
    default:
      return status;
  }
};

const TasksPage: React.FC = () => {
  const { user, isAuthenticated, token } = useUser();
  const isAdmin = user?.role === "admin";
  const { showToast } = useToast();
  const navigate = useNavigate();

  const backendBase =
    (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Filters
  const [mineOnly, setMineOnly] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | TaskStatus>("");
  const [projectFilterId, setProjectFilterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [editDueDate, setEditDueDate] = useState<string>(""); // YYYY-MM-DD string

  // Load preset filters on mount
  useEffect(() => {
    const preset = loadTasksFilterPreset();
    if (preset) {
      setMineOnly(preset.mineOnly);
      setActiveOnly(preset.activeOnly);
      setStatusFilter(preset.statusFilter);
      setProjectFilterId(preset.projectFilterId);
    }
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const res = await fetch(`${backendBase}/api/projects`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ProjectListResponse = await res.json();
      setProjects(data.items || []);
    } catch (err) {
      console.error(err);
      setProjectsError("Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadTasks = async () => {
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
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: TaskListResponse = await res.json();
      setTasks(data.items || []);
    } catch (err) {
      console.error(err);
      setTasksError("Failed to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [backendBase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [isAuthenticated, mineOnly, activeOnly, statusFilter, projectFilterId, token]);

  const handleCreateTask = async () => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to create a task.", "error");
      return;
    }

    const title = prompt("Task title:");
    if (!title || !title.trim()) return;

    const description = prompt("Task description (optional):") || "";
    const body: any = {
      title: title.trim(),
      description,
      status: "todo" as TaskStatus,
    };

    if (projectFilterId !== null) {
      body.project_id = projectFilterId;
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
      await loadTasks();
      showToast("Task created.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create task.", "error");
    }
  };

  const handleUpdateTask = async (taskId: number, updates: TaskUpdatePayload) => {
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

      await loadTasks();
    } catch (err) {
      console.error(err);
      showToast("Failed to update task.", "error");
    }
  };

  const handleDeleteTask = async (taskId: number, skipConfirm = false) => {
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
      await loadTasks();
      showToast("Task deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task.", "error");
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    await handleUpdateTask(taskId, { is_active: false });
  };

  const handleRestoreTask = async (taskId: number) => {
    await handleUpdateTask(taskId, { is_active: true });
  };

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const clearSelection = () => {
    setSelectedTaskIds([]);
  };

  const applyPreset = (presetName: "myActive" | "blockedOnly" | "allActive") => {
    let preset: TasksFilterPreset;
    if (presetName === "myActive") {
      preset = {
        mineOnly: true,
        activeOnly: true,
        statusFilter: "",
        projectFilterId: null,
      };
    } else if (presetName === "blockedOnly") {
      preset = {
        mineOnly: true,
        activeOnly: true,
        statusFilter: "blocked",
        projectFilterId: null,
      };
    } else {
      // allActive
      preset = {
        mineOnly: false,
        activeOnly: true,
        statusFilter: "",
        projectFilterId: null,
      };
    }

    setMineOnly(preset.mineOnly);
    setActiveOnly(preset.activeOnly);
    setStatusFilter(preset.statusFilter);
    setProjectFilterId(preset.projectFilterId);
    saveTasksFilterPreset(preset);
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Set status to "${status}" for ${selectedTaskIds.length} task(s)?`
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedTaskIds.map((id) => handleUpdateTask(id, { status }))
      );
      showToast("Bulk status update complete.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk status update failed for some tasks.", "error");
    }
  };

  const handleBulkShiftDueDate = async (days: number) => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Shift due date by +${days} day(s) for ${selectedTaskIds.length} task(s)?`
    );
    if (!confirmed) return;

    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    try {
      await Promise.all(
        selectedTasks.map((t) =>
          handleUpdateTask(t.id, {
            due_date: shiftIsoDateByDays(t.due_date ?? null, days),
          })
        )
      );
      showToast("Bulk due date shift complete.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk due date shift failed for some tasks.", "error");
    }
  };

  const handleBulkClearDueDate = async () => {
    if (selectedTaskIds.length === 0) return;
    const confirmed = window.confirm(
      `Clear due date for ${selectedTaskIds.length} task(s)?`
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedTaskIds.map((id) =>
          handleUpdateTask(id, {
            due_date: null,
          })
        )
      );
      showToast("Bulk due dates cleared.", "success");
    } catch (err) {
      console.error(err);
      showToast("Bulk due date clear failed for some tasks.", "error");
    }
  };

  const handleQuickShiftDueDate = (task: Task, days: number) => {
    handleUpdateTask(task.id, {
      due_date: shiftIsoDateByDays(task.due_date ?? null, days),
    });
  };

  const handleQuickClearDueDate = (task: Task) => {
    handleUpdateTask(task.id, { due_date: null });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditProjectId(task.project_id ?? null);

    if (task.due_date) {
      const d = task.due_date.slice(0, 10);
      setEditDueDate(d);
    } else {
      setEditDueDate("");
    }
  };

  const closeEditModal = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    const payload: TaskUpdatePayload = {
      title: editTitle.trim(),
      description: editDescription,
      project_id: editProjectId,
    };

    if (editDueDate) {
      payload.due_date = editDueDate;
    } else {
      payload.due_date = null;
    }

    await handleUpdateTask(editingTask.id, payload);
    closeEditModal();
  };

  const handleGoToStandup = (standupId: number) => {
    navigate("/standups", { state: { focusStandupId: standupId } });
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTasks = normalizedSearch
    ? tasks.filter((t) => {
        const haystack = [
          t.title,
          t.description || "",
          t.owner,
          t.project_name || "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : tasks;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Tasks</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Lightweight personal and team task tracker. Use filters to view your own
        tasks or, if you&apos;re an admin, broader task sets. Click &quot;Edit&quot; on
        a task to change its title, description, project, or due date.
      </p>

      {!isAuthenticated && (
        <p style={{ color: "red" }}>You must be logged in to view tasks.</p>
      )}

      {/* Preset filters */}
      <div
        style={{
          marginTop: "1rem",
          marginBottom: "0.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          fontSize: "0.85rem",
        }}
      >
        <span style={{ fontWeight: 500 }}>Presets:</span>
        <button type="button" onClick={() => applyPreset("myActive")}>
          My Active
        </button>
        <button type="button" onClick={() => applyPreset("blockedOnly")}>
          Blocked Only
        </button>
        {isAdmin && (
          <button type="button" onClick={() => applyPreset("allActive")}>
            All Active
          </button>
        )}
      </div>

      {/* Detailed filters */}
      <div
        style={{
          marginTop: "0.5rem",
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
        <label style={{ fontSize: "0.9rem" }}>
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            style={{ marginRight: "0.35rem" }}
          />
          Show only my tasks{isAdmin ? " (uncheck to see all)" : ""}
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            style={{ marginRight: "0.35rem" }}
          />
          Active only
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Status:&nbsp;
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value || "") as "" | TaskStatus)
            }
          >
            <option value="">(any)</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Search:&nbsp;
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Title, description, owner..."
            style={{ minWidth: "180px" }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Project:&nbsp;
          <select
            value={projectFilterId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const newId = val === "" ? null : Number(val);
              setProjectFilterId(newId);
            }}
            disabled={loadingProjects}
          >
            <option value="">(any)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleCreateTask}>
          + New Task
        </button>
      </div>

      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          fontSize: "0.85rem",
        }}
      >
        <button
          type="button"
          onClick={() => {
            const visibleIds = filteredTasks.map((t) => t.id);
            const allSelected =
              visibleIds.length > 0 &&
              visibleIds.every((id) => selectedTaskIds.includes(id));
            if (allSelected) {
              setSelectedTaskIds((prev) =>
                prev.filter((id) => !visibleIds.includes(id))
              );
            } else {
              setSelectedTaskIds((prev) =>
                Array.from(new Set([...prev, ...visibleIds]))
              );
            }
          }}
        >
          {filteredTasks.length > 0 &&
          filteredTasks.every((t) => selectedTaskIds.includes(t.id))
            ? "Clear Selection"
            : "Select All (visible)"}
        </button>

        <span>
          Selected: <strong>{selectedTaskIds.length}</strong>
        </span>

        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={async () => {
            if (selectedTaskIds.length === 0) return;
            const confirmed = window.confirm(
              `Archive ${selectedTaskIds.length} selected task(s)?`
            );
            if (!confirmed) return;

            try {
              await Promise.all(
                selectedTaskIds.map((id) => handleArchiveTask(id))
              );
              clearSelection();
              showToast("Selected tasks archived.", "success");
            } catch (err) {
              console.error(err);
              showToast("Failed to archive some tasks.", "error");
            }
          }}
          style={{ fontSize: "0.8rem" }}
        >
          Archive Selected
        </button>

        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={async () => {
            if (selectedTaskIds.length === 0) return;
            const confirmed = window.confirm(
              `Delete ${selectedTaskIds.length} selected task(s)? This cannot be undone.`
            );
            if (!confirmed) return;

            try {
              await Promise.all(
                selectedTaskIds.map((id) => handleDeleteTask(id, true))
              );
              clearSelection();
              showToast("Selected tasks deleted.", "success");
            } catch (err) {
              console.error(err);
              showToast("Failed to delete some tasks.", "error");
            }
          }}
          style={{ fontSize: "0.8rem" }}
        >
          Delete Selected
        </button>

        {/* Bulk status */}
        <span style={{ marginLeft: "1rem" }}>Bulk status:</span>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkStatusChange("todo")}
          style={{ fontSize: "0.8rem" }}
        >
          Todo
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkStatusChange("in_progress")}
          style={{ fontSize: "0.8rem" }}
        >
          In Progress
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkStatusChange("done")}
          style={{ fontSize: "0.8rem" }}
        >
          Done
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkStatusChange("blocked")}
          style={{ fontSize: "0.8rem" }}
        >
          Blocked
        </button>

        {/* Bulk due date */}
        <span style={{ marginLeft: "1rem" }}>Bulk due:</span>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkShiftDueDate(1)}
          style={{ fontSize: "0.8rem" }}
        >
          +1d
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkShiftDueDate(3)}
          style={{ fontSize: "0.8rem" }}
        >
          +3d
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={() => handleBulkShiftDueDate(7)}
          style={{ fontSize: "0.8rem" }}
        >
          +7d
        </button>
        <button
          type="button"
          disabled={selectedTaskIds.length === 0}
          onClick={handleBulkClearDueDate}
          style={{ fontSize: "0.8rem" }}
        >
          Clear
        </button>
      </div>

      {projectsError && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          {projectsError}
        </div>
      )}

      {tasksError && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          {tasksError}
        </div>
      )}

      {loadingTasks ? (
        <p>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <p>No tasks match the current filters.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filteredTasks.map((t) => (
            <li
              key={t.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "0.75rem",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <div style={{ paddingTop: "0.2rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(t.id)}
                    onChange={() => toggleTaskSelection(t.id)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <strong>{t.title}</strong>
                  {t.project_name && (
                    <span style={{ marginLeft: "0.5rem", opacity: 0.8 }}>
                      [{t.project_name}]
                    </span>
                  )}

                  <div style={{ marginTop: "0.25rem" }}>
                    <span style={getStatusPillStyle(t.status)}>
                      {formatStatusLabel(t.status)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.8,
                      marginTop: "0.25rem",
                    }}
                  >
                    Owner: {t.owner}
                    {" · "}
                    Created: {new Date(t.created_at).toLocaleString()}
                    {" · "}
                    Due:{" "}
                    {t.due_date
                      ? new Date(t.due_date).toLocaleDateString()
                      : "None"}{" "}
                    <button
                      type="button"
                      onClick={() => handleQuickShiftDueDate(t, 1)}
                      style={{
                        fontSize: "0.7rem",
                        marginLeft: "0.25rem",
                      }}
                    >
                      +1d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickShiftDueDate(t, 3)}
                      style={{
                        fontSize: "0.7rem",
                        marginLeft: "0.15rem",
                      }}
                    >
                      +3d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickShiftDueDate(t, 7)}
                      style={{
                        fontSize: "0.7rem",
                        marginLeft: "0.15rem",
                      }}
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickClearDueDate(t)}
                      style={{
                        fontSize: "0.7rem",
                        marginLeft: "0.15rem",
                      }}
                    >
                      Clear
                    </button>
                    {!t.is_active && (
                      <>
                        {" · "}
                        <span style={{ color: "red" }}>Archived</span>
                      </>
                    )}
                    {t.origin_standup_id != null && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          onClick={() => handleGoToStandup(t.origin_standup_id!)}
                          style={{
                            border: "none",
                            background: "none",
                            padding: 0,
                            margin: 0,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            color: "#2563eb",
                            textDecoration: "underline",
                          }}
                        >
                          From Standup #{t.origin_standup_id}
                        </button>
                      </>
                    )}
                  </div>

                  {t.description && (
                    <div style={{ marginTop: "0.25rem" }}>{t.description}</div>
                  )}

                  <div style={{ marginTop: "0.4rem" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.75,
                        marginBottom: "0.15rem",
                      }}
                    >
                      Progress: {t.progress}%
                    </div>
                    <div
                      style={{
                        height: "6px",
                        borderRadius: "999px",
                        backgroundColor: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, t.progress))}%`,
                          height: "100%",
                          backgroundColor:
                            t.status === "done" ? "#16a34a" : "#2563eb",
                          transition: "width 0.15s ease-out",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "0.35rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem" }}>
                      Status:&nbsp;
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleUpdateTask(t.id, {
                            status: e.target.value as TaskStatus,
                          })
                        }
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>

                    <label style={{ fontSize: "0.8rem" }}>
                      %&nbsp;
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={t.progress}
                        onChange={(e) =>
                          handleUpdateTask(t.id, {
                            progress: Math.min(
                              100,
                              Math.max(0, Number(e.target.value) || 0)
                            ),
                          })
                        }
                        style={{ width: "3rem" }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      style={{ fontSize: "0.75rem" }}
                    >
                      Edit
                    </button>

                    {t.is_active ? (
                      <button
                        type="button"
                        onClick={() => handleArchiveTask(t.id)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestoreTask(t.id)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        Restore
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      style={{ fontSize: "0.75rem" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "6px",
              width: "400px",
              maxWidth: "90vw",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              Edit Task
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <label style={{ fontSize: "0.9rem" }}>
                Title
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                />
              </label>

              <label style={{ fontSize: "0.9rem" }}>
                Description
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                />
              </label>

              <label style={{ fontSize: "0.9rem" }}>
                Project
                <select
                  value={editProjectId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditProjectId(val === "" ? null : Number(val));
                  }}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                >
                  <option value="">(none)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: "0.9rem" }}>
                Due Date
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={closeEditModal}
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ fontSize: "0.85rem" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
