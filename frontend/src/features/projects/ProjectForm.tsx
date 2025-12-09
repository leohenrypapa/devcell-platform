// frontend/src/features/projects/ProjectForm.tsx
import React from "react";
import type { ProjectStatus } from "../../lib/projects";

type Props = {
  editingProjectId: number | null;
  name: string;
  description: string;
  status: ProjectStatus;
  submitting: boolean;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStatus: (value: ProjectStatus) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const ProjectForm: React.FC<Props> = ({
  editingProjectId,
  name,
  description,
  status,
  submitting,
  setName,
  setDescription,
  setStatus,
  onSubmit,
  onCancel,
}) => {
  return (
    <section
      style={{
        marginTop: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "1rem",
        maxWidth: 520,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "0.75rem",
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        {editingProjectId ? "Edit Project" : "Create Project"}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <label style={{ fontSize: "0.9rem" }}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          >
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
            <option value="done">done</option>
          </select>
        </label>

        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          {editingProjectId && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{ fontSize: "0.85rem" }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            style={{ fontSize: "0.85rem" }}
          >
            {submitting
              ? editingProjectId
                ? "Saving..."
                : "Creating..."
              : editingProjectId
              ? "Save Changes"
              : "Create Project"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProjectForm;
