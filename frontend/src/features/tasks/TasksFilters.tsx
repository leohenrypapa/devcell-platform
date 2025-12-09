// frontend/src/features/tasks/TasksFilters.tsx
import React from "react";
import type { Project, TaskStatus } from "../../lib/tasks";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  mineOnly: boolean;
  activeOnly: boolean;
  statusFilter: "" | TaskStatus;
  projectFilterId: number | null;
  searchTerm: string;
  projects: Project[];
  loadingProjects: boolean;
  isAdmin: boolean;
  selectedCount: number;
  onChangeMineOnly: (value: boolean) => void;
  onChangeActiveOnly: (value: boolean) => void;
  onChangeStatus: (value: "" | TaskStatus) => void;
  onChangeProject: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
  onApplyPreset: (presetKey: "myActive" | "blockedOnly" | "allActive") => void;
};

const labelTextStyle: React.CSSProperties = {
  fontSize: "var(--dc-font-size-xs)",
  fontWeight: 500,
  color: "var(--dc-text-muted)",
};

const compactSelectStyle: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "var(--dc-radius-sm)",
  border: "1px solid var(--dc-border-subtle)",
  fontSize: "var(--dc-font-size-sm)",
  backgroundColor: "var(--dc-bg-default)",
  color: "var(--dc-text-primary)",
};

const toggleLabelStyle: React.CSSProperties = {
  fontSize: "var(--dc-font-size-sm)",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.25rem 0.55rem",
  borderRadius: "999px",
  border: "1px solid var(--dc-border-subtle)",
  cursor: "pointer",
  backgroundColor: "var(--dc-bg-surface)",
};

const toggleLabelActiveStyle: React.CSSProperties = {
  ...toggleLabelStyle,
  borderColor: "var(--dc-color-primary)",
  backgroundColor: "var(--dc-bg-subtle-primary, rgba(37,99,235,0.08))",
};

const presetButtonStyle: React.CSSProperties = {
  padding: "0.2rem 0.7rem",
  fontSize: "var(--dc-font-size-xs)",
  borderRadius: "999px",
};

const presetBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  alignItems: "center",
};

const presetsLabelStyle: React.CSSProperties = {
  ...labelTextStyle,
  marginRight: "0.25rem",
};

const selectionSummaryStyle: React.CSSProperties = {
  fontSize: "var(--dc-font-size-xs)",
  color: "var(--dc-text-muted)",
};

const TasksFilters: React.FC<Props> = ({
  mineOnly,
  activeOnly,
  statusFilter,
  projectFilterId,
  searchTerm,
  projects,
  loadingProjects,
  isAdmin,
  selectedCount,
  onChangeMineOnly,
  onChangeActiveOnly,
  onChangeStatus,
  onChangeProject,
  onChangeSearch,
  onApplyPreset,
}) => {
  return (
    <Card
      style={{
        padding: "0.75rem 0.9rem 0.7rem",
        borderRadius: "var(--dc-radius-md)",
      }}
    >
      {/* Row 1: Search + toggles + selection summary */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          rowGap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.6rem",
        }}
      >
        {/* Search input */}
        <div
          style={{
            flex: "1 1 220px",
            minWidth: "200px",
          }}
        >
          <label
            htmlFor="tasks-search"
            style={{
              ...labelTextStyle,
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Search
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              {/* simple magnifying glass icon */}
              <svg
                width={14}
                height={14}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ opacity: 0.7 }}
              >
                <circle
                  cx="9"
                  cy="9"
                  r="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="12.5"
                  y1="12.5"
                  x2="16"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              id="tasks-search"
              type="search"
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Title, description, owner, project…"
              style={{
                width: "100%",
                padding: "0.4rem 0.55rem 0.4rem 1.65rem",
                borderRadius: "var(--dc-radius-sm)",
                border: "1px solid var(--dc-border-subtle)",
                fontSize: "var(--dc-font-size-sm)",
                outline: "none",
                backgroundColor: "var(--dc-bg-surface)",
              }}
            />
          </div>
        </div>

        {/* Toggles + selected summary */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "center",
            justifyContent: "flex-end",
            minWidth: "220px",
          }}
        >
          <label
            style={mineOnly ? toggleLabelActiveStyle : toggleLabelStyle}
          >
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => onChangeMineOnly(e.target.checked)}
              style={{ display: "none" }}
            />
            <span>My tasks</span>
            {isAdmin && (
              <span
                style={{
                  fontSize: "var(--dc-font-size-2xs, 0.68rem)",
                  color: "var(--dc-text-muted)",
                }}
              >
                (admin)
              </span>
            )}
          </label>

          <label
            style={activeOnly ? toggleLabelActiveStyle : toggleLabelStyle}
          >
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => onChangeActiveOnly(e.target.checked)}
              style={{ display: "none" }}
            />
            <span>Active only</span>
          </label>

          {selectedCount > 0 && (
            <span style={selectionSummaryStyle}>
              Selected: <strong>{selectedCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Status, project, presets */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          rowGap: "0.5rem",
          alignItems: "center",
        }}
      >
        {/* Status */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            flex: "0 1 160px",
          }}
        >
          <span style={labelTextStyle}>Status</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              onChangeStatus((e.target.value || "") as "" | TaskStatus)
            }
            style={compactSelectStyle}
          >
            <option value="">(any)</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Project */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            flex: "0 1 200px",
          }}
        >
          <span style={labelTextStyle}>Project</span>
          <select
            value={projectFilterId ?? ""}
            onChange={(e) =>
              onChangeProject(
                e.target.value ? Number.parseInt(e.target.value, 10) : null,
              )
            }
            disabled={loadingProjects}
            style={compactSelectStyle}
          >
            <option value="">
              {loadingProjects ? "Loading…" : "(any project)"}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Presets */}
        <div
          style={{
            flex: "1 1 200px",
            minWidth: "200px",
          }}
        >
          <div style={presetBarStyle}>
            <span style={presetsLabelStyle}>Presets</span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onApplyPreset("myActive")}
              style={presetButtonStyle}
            >
              My active
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onApplyPreset("blockedOnly")}
              style={presetButtonStyle}
            >
              Blocked only
            </Button>
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onApplyPreset("allActive")}
                style={presetButtonStyle}
              >
                All active
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TasksFilters;
