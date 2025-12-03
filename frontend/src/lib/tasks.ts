// filename: frontend/src/lib/tasks.ts
import type React from "react";

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

export type Task = {
  id: number;
  owner: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  is_active: boolean;
  project_id?: number | null;
  project_name?: string | null;
  due_date?: string | null;
  origin_standup_id?: number | null;
  created_at: string;
  updated_at?: string | null;
};

export type TaskListResponse = {
  items: Task[];
};

export type ProjectStatus = "planned" | "active" | "blocked" | "done";

export type Project = {
  id: number;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  created_at: string;
};

export type ProjectListResponse = {
  items: Project[];
};

export type TaskUpdatePayload = Partial<
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

export type TasksFilterPreset = {
  mineOnly: boolean;
  activeOnly: boolean;
  statusFilter: "" | TaskStatus;
  projectFilterId: number | null;
};

const TASKS_FILTER_PRESET_KEY = "devcell-tasks-filter-preset";

export const loadTasksFilterPreset = (): TasksFilterPreset | null => {
  try {
    const raw = window.localStorage.getItem(TASKS_FILTER_PRESET_KEY);
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

export const saveTasksFilterPreset = (preset: TasksFilterPreset): void => {
  try {
    window.localStorage.setItem(
      TASKS_FILTER_PRESET_KEY,
      JSON.stringify(preset),
    );
  } catch {
    // ignore
  }
};

export const shiftIsoDateByDays = (
  isoDate: string | null,
  days: number,
): string => {
  const base = isoDate ? new Date(isoDate) : new Date();
  // normalize to noon to avoid DST weirdness
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

export const getStatusPillStyle = (
  status: TaskStatus,
): React.CSSProperties => {
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
    color: "#ffffff",
    backgroundColor,
  };
};

export const formatStatusLabel = (status: TaskStatus): string => {
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
