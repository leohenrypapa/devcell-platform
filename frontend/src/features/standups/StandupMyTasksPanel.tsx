// frontend/src/features/standups/StandupMyTasksPanel.tsx
import React from "react";
import type { Project } from "../../lib/tasks";
import type { Task } from "../../lib/tasks";

type Props = {
  tasks: Task[];
  projects: Project[];
  loadingTasks: boolean;
  taskError: string | null;
  selectedProjectId: number | null;
  onChangeProjectFilter: (value: number | null) => void;
  onReload: () => void;
};

const StandupMyTasksPanel: React.FC<Props> = ({
  tasks,
  projects,
  loadingTasks,
  taskError,
  selectedProjectId,
  onChangeProjectFilter,
  onReload,
}) => {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "0.75rem",
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
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            My Active Tasks
          </h2>
          <p
            style={{
              margin: 0,
              marginTop: "0.2rem",
              fontSize: "0.8rem",
              opacity: 0.75,
            }}
          >
            Filtered list used during standup.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loadingTasks}
          style={{ fontSize: "0.8rem" }}
        >
          {loadingTasks ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div
        style={{
          marginBottom: "0.5rem",
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          fontSize: "0.8rem",
        }}
      >
        <label>
          Project:&nbsp;
          <select
            value={selectedProjectId ?? ""}
            onChange={(e) =>
              onChangeProjectFilter(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          >
            <option value="">(any)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {taskError && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          {taskError}
        </div>
      )}

      {loadingTasks && <p>Loading tasks…</p>}

      {!loadingTasks && tasks.length === 0 && (
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          No active tasks found for this filter.
        </p>
      )}

      {!loadingTasks && tasks.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: "0.8rem",
          }}
        >
          {tasks.map((t) => (
            <li
              key={t.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "0.25rem 0",
              }}
            >
              <div>
                <strong>{t.title}</strong>
                {t.project_name && (
                  <span style={{ marginLeft: "0.25rem", opacity: 0.7 }}>
                    [{t.project_name}]
                  </span>
                )}
              </div>
              <div style={{ opacity: 0.8 }}>
                [{t.status}] {t.description}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default StandupMyTasksPanel;
