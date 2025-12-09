// frontend/src/features/tasks/TaskCreateModal.tsx
import React, { useState } from "react";
import type { Project } from "../../lib/tasks";
import Button from "../../ui/Button";
import TaskModalShell from "./TaskModalShell";

export type TaskCreatePayload = {
  title: string;
  description: string;
  projectId: number | null;
};

type Props = {
  projects: Project[];
  defaultProjectId: number | null;
  onClose: () => void;
  onCreate: (payload: TaskCreatePayload) => Promise<void>;
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

const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--dc-font-size-xs)",
  color: "var(--dc-color-danger)",
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--dc-font-size-xs)",
  color: "var(--dc-text-muted)",
};

const TaskCreateModal: React.FC<Props> = ({
  projects,
  defaultProjectId,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onCreate({
        title: trimmed,
        description,
        projectId,
      });
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
      <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
        {saving ? "Creating…" : "Create task"}
      </Button>
    </>
  );

  return (
    <TaskModalShell title="New task" onClose={onClose} footer={footer} maxWidth={520}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem",
        }}
      >
        <label style={labelStyle}>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            style={inputStyle}
            placeholder="Short, action-oriented summary"
          />
        </label>

        <label style={labelStyle}>
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
            placeholder="Add context, links, or acceptance criteria"
          />
        </label>

        <label style={labelStyle}>
          <span>Project (optional)</span>
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

        {error && <p style={errorStyle}>{error}</p>}

        {!error && (
          <p style={hintStyle}>
            You can always edit details later from the task card.
          </p>
        )}
      </form>
    </TaskModalShell>
  );
};

export default TaskCreateModal;
