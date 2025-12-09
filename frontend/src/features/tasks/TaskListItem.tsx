// frontend/src/features/tasks/TaskListItem.tsx
import React from "react";
import {
  formatStatusLabel,
  type Task,
  type TaskStatus,
} from "../../lib/tasks";
import Button from "../../ui/Button";

type Props = {
  task: Task;
  isSelected: boolean;
  onToggleSelected: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  onUpdateProgress: (progress: number) => void;
  onQuickShiftDueDate: (days: number) => void;
  onQuickClearDueDate: () => void;
  onOpenEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onGoToStandup: (standupId: number) => void;
};

const TaskListItem: React.FC<Props> = ({
  task,
  isSelected,
  onToggleSelected,
  onUpdateStatus,
  onUpdateProgress,
  onQuickShiftDueDate,
  onQuickClearDueDate,
  onOpenEdit,
  onArchive,
  onRestore,
  onDelete,
  onGoToStandup,
}) => {
  const createdAtLabel = new Date(task.created_at).toLocaleString();
  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : "None";

  const isArchived = !task.is_active;

  const statusPillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.15rem 0.5rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#ffffff",
    backgroundColor: getStatusColor(task.status),
  };

  return (
    <li
      style={{
        borderRadius: "var(--dc-radius-md)",
        border: "1px solid var(--dc-border-subtle)",
        backgroundColor: "var(--dc-bg-surface)",
        padding: "0.6rem 0.7rem",
        fontSize: "var(--dc-font-size-sm)",
      }}
    >
      {/* Top row: checkbox, title, project, status pill */}
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.45rem",
            alignItems: "flex-start",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelected}
            style={{
              marginTop: "0.25rem",
            }}
          />
          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.3rem",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {task.title}
              </span>
              {task.project_name && (
                <span
                  style={{
                    fontSize: "var(--dc-font-size-xs)",
                    padding: "0.05rem 0.4rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--dc-bg-subtle)",
                    border: "1px solid var(--dc-border-subtle)",
                  }}
                >
                  [{task.project_name}]
                </span>
              )}
              {isArchived && (
                <span
                  style={{
                    fontSize: "var(--dc-font-size-xs)",
                    padding: "0.05rem 0.35rem",
                    borderRadius: "999px",
                    backgroundColor: "rgba(148,163,184,0.15)",
                    border: "1px solid rgba(148,163,184,0.6)",
                  }}
                >
                  Archived
                </span>
              )}
            </div>

            {task.description && (
              <p
                style={{
                  margin: "0.25rem 0 0",
                  color: "var(--dc-text-muted)",
                  fontSize: "var(--dc-font-size-xs)",
                  maxHeight: "3.5rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {task.description}
              </p>
            )}

            <div
              style={{
                marginTop: "0.3rem",
              }}
            >
              <span style={statusPillStyle}>
                {formatStatusLabel(task.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Status + progress controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            alignItems: "flex-end",
            minWidth: "9.5rem",
          }}
        >
          <label
            style={{
              fontSize: "var(--dc-font-size-xs)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.15rem",
            }}
          >
            <span>Status</span>
            <select
              value={task.status}
              onChange={(e) =>
                onUpdateStatus(e.target.value as TaskStatus)
              }
              style={{
                padding: "0.2rem 0.4rem",
                borderRadius: "var(--dc-radius-sm)",
                border: "1px solid var(--dc-border-subtle)",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <label
            style={{
              fontSize: "var(--dc-font-size-xs)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.15rem",
            }}
          >
            <span>Progress (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={task.progress}
              onChange={(e) =>
                onUpdateProgress(
                  Number.isNaN(Number(e.target.value))
                    ? 0
                    : Number(e.target.value),
                )
              }
              style={{
                width: "4rem",
                padding: "0.15rem 0.3rem",
                borderRadius: "var(--dc-radius-sm)",
                border: "1px solid var(--dc-border-subtle)",
                fontSize: "var(--dc-font-size-xs)",
                textAlign: "right",
              }}
            />
          </label>
        </div>
      </div>

      {/* Meta / quick actions */}
      <div
        style={{
          marginTop: "0.45rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          alignItems: "center",
          justifyContent: "space-between",
          rowGap: "0.35rem",
        }}
      >
        <div
          style={{
            fontSize: "var(--dc-font-size-xs)",
            color: "var(--dc-text-muted)",
          }}
        >
          <span>Owner: {task.owner}</span>
          <span> · Created: {createdAtLabel}</span>
          <span> · Due: {dueDateLabel}</span>
          <span>
            {" "}
            (
            <button
              type="button"
              onClick={() => onQuickShiftDueDate(1)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              +1d
            </button>
            {" / "}
            <button
              type="button"
              onClick={() => onQuickShiftDueDate(3)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              +3d
            </button>
            {" / "}
            <button
              type="button"
              onClick={() => onQuickShiftDueDate(7)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              +7d
            </button>
            {" / "}
            <button
              type="button"
              onClick={onQuickClearDueDate}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              Clear
            </button>
            )
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.3rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {task.origin_standup_id && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onGoToStandup(task.origin_standup_id!)}
              style={{
                padding: "0.15rem 0.5rem",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              View standup
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onOpenEdit}
            style={{
              padding: "0.15rem 0.5rem",
              fontSize: "var(--dc-font-size-xs)",
            }}
          >
            Edit
          </Button>

          {!isArchived && (
            <Button
              type="button"
              variant="ghost"
              onClick={onArchive}
              style={{
                padding: "0.15rem 0.5rem",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              Archive
            </Button>
          )}

          {isArchived && (
            <Button
              type="button"
              variant="ghost"
              onClick={onRestore}
              style={{
                padding: "0.15rem 0.5rem",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              Restore
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            style={{
              padding: "0.15rem 0.5rem",
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-color-danger)",
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
};

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "in_progress":
      return "#2563eb";
    case "done":
      return "#16a34a";
    case "blocked":
      return "#b91c1c";
    case "todo":
    default:
      return "#6b7280";
  }
}

export default TaskListItem;
