// frontend/src/features/tasks/TaskEditModal.tsx
import React, { useEffect, useState } from "react";
import type {
  Project,
  Task,
  TaskUpdatePayload,
  TaskStatus,
} from "../../lib/tasks";
import Button from "../../ui/Button";
import TaskModalShell from "./TaskModalShell";

type Props = {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onSave: (id: number, payload: TaskUpdatePayload) => Promise<void>;
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--dc-font-size-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.4rem 0.55rem",
  borderRadius: "var(--dc-radius-sm)",
  border: "1px solid var(--dc-border-subtle)",
  fontSize: "var(--dc-font-size-sm)",
};

const selectStyle: React.CSSProperties = {
  padding: "0.3rem 0.5rem",
  borderRadius: "var(--dc-radius-sm)",
  border: "1px solid var(--dc-border-subtle)",
  fontSize: "var(--dc-font-size-sm)",
  backgroundColor: "var(--dc-bg-default)",
  color: "var(--dc-text-primary)",
};

const sectionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  rowGap: "0.5rem",
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  marginTop: "0.25rem",
  fontSize: "var(--dc-font-size-xs)",
  color: "var(--dc-text-muted)",
};

const TaskEditModal: React.FC<Props> = ({ task, projects, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [progress, setProgress] = useState(0);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setProgress(task.progress ?? 0);
    setProjectId(task.project_id ?? null);
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: TaskUpdatePayload = {
        title,
        description,
        status,
        progress,
        project_id: projectId,
        due_date: dueDate || null,
      };
      await onSave(task.id, payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </>
  );

  return (
    <TaskModalShell
      title="Edit task"
      onClose={onClose}
      footer={footer}
      maxWidth={540}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <label style={labelStyle}>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </label>

        {/* Status + progress */}
        <div style={sectionRowStyle}>
          <label
            style={{
              ...labelStyle,
              flex: "1 1 140px",
            }}
          >
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              style={selectStyle}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <label
            style={{
              ...labelStyle,
              flex: "1 1 140px",
            }}
          >
            <span>Progress (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) =>
                setProgress(
                  Number.isNaN(Number(e.target.value))
                    ? 0
                    : Number(e.target.value),
                )
              }
              style={inputStyle}
            />
            <p style={hintStyle}>
              Use rough percentages (0, 25, 50, 75, 100) as a quick signal.
            </p>
          </label>
        </div>

        {/* Project + due date */}
        <div style={sectionRowStyle}>
          <label
            style={{
              ...labelStyle,
              flex: "1 1 160px",
            }}
          >
            <span>Project</span>
            <select
              value={projectId ?? ""}
              onChange={(e) =>
                setProjectId(
                  e.target.value ? Number.parseInt(e.target.value, 10) : null,
                )
              }
              style={selectStyle}
            >
              <option value="">(none)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              ...labelStyle,
              flex: "1 1 160px",
            }}
          >
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>
              Leave empty if this task is not time-bound.
            </p>
          </label>
        </div>
      </div>
    </TaskModalShell>
  );
};

export default TaskEditModal;
