// frontend/src/features/standups/StandupForm.tsx
import React from "react";
import type { StandupEntry } from "../../lib/standups";
import type { Project } from "../../lib/projects";

type Props = {
  loggedInName: string;
  projects: Project[];
  selectedProjectId: number | null;
  setSelectedProjectId: (value: number | null) => void;

  yesterday: string;
  today: string;
  blockers: string;
  setYesterday: (v: string) => void;
  setToday: (v: string) => void;
  setBlockers: (v: string) => void;

  editingEntry: StandupEntry | null;
  submitting: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

const StandupForm: React.FC<Props> = ({
  loggedInName,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  yesterday,
  today,
  blockers,
  setYesterday,
  setToday,
  setBlockers,
  editingEntry,
  submitting,
  onSubmit,
  onCancelEdit,
}) => {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.5rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {editingEntry ? "Edit Standup" : "New Standup"}
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          User: <strong>{loggedInName || "Unknown"}</strong>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0.75rem",
        }}
      >
        <label style={{ fontSize: "0.9rem" }}>
          Project (optional)
          <select
            value={selectedProjectId ?? ""}
            onChange={(e) =>
              setSelectedProjectId(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
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
          Yesterday
          <textarea
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            rows={3}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Today
          <textarea
            value={today}
            onChange={(e) => setToday(e.target.value)}
            rows={3}
            style={{ width: "100%", marginTop: "0.25rem" }}
            required
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Blockers
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={3}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>
      </div>

      <div
        style={{
          marginTop: "0.75rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        {editingEntry && (
          <button
            type="button"
            onClick={onCancelEdit}
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
            ? editingEntry
              ? "Updating..."
              : "Submitting..."
            : editingEntry
            ? "Update Standup"
            : "Submit Standup"}
        </button>
      </div>
    </section>
  );
};

export default StandupForm;
