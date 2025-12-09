// frontend/src/features/tasks/TasksBulkActions.tsx
import React from "react";
import type { Task, TaskStatus } from "../../lib/tasks";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  filteredTasks: Task[];
  selectedTaskIds: number[];
  onToggleSelectAllVisible: (visibleTasks: Task[]) => void;
  onClearSelection: () => void;
  onBulkArchiveSelected: () => Promise<void>;
  onBulkDeleteSelected: () => Promise<void>;
  onBulkStatusChange: (status: TaskStatus) => Promise<void>;
  onBulkShiftDueDate: (days: number) => Promise<void>;
  onBulkClearDueDate: () => Promise<void>;
};

const TasksBulkActions: React.FC<Props> = ({
  filteredTasks,
  selectedTaskIds,
  onToggleSelectAllVisible,
  onClearSelection,
  onBulkArchiveSelected,
  onBulkDeleteSelected,
  onBulkStatusChange,
  onBulkShiftDueDate,
  onBulkClearDueDate,
}) => {
  const totalVisible = filteredTasks.length;
  const hasSelection = selectedTaskIds.length > 0;

  const visibleSelectedCount = filteredTasks.filter((t) =>
    selectedTaskIds.includes(t.id),
  ).length;

  const allVisibleSelected = totalVisible > 0 && visibleSelectedCount === totalVisible;

  return (
    <Card
      style={{
        padding: "0.6rem 0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
          rowGap: "0.5rem",
          fontSize: "var(--dc-font-size-sm)",
        }}
      >
        {/* Selection controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            disabled={totalVisible === 0}
            onClick={() => onToggleSelectAllVisible(filteredTasks)}
            style={{
              padding: "0.25rem 0.55rem",
              fontSize: "var(--dc-font-size-xs)",
            }}
          >
            {allVisibleSelected
              ? "Clear visible selection"
              : `Select visible (${visibleSelectedCount}/${totalVisible})`}
          </Button>

          {hasSelection && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearSelection}
              style={{
                padding: "0.25rem 0.55rem",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              Clear selection
            </Button>
          )}
        </div>

        {/* Bulk actions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.55rem",
            alignItems: "center",
            rowGap: "0.45rem",
          }}
        >
          {/* Status group */}
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              Set status:
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkStatusChange("todo")}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              Todo
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkStatusChange("in_progress")}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              In Progress
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkStatusChange("done")}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              Done
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkStatusChange("blocked")}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              Blocked
            </Button>
          </div>

          {/* Due date group */}
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              Due date:
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkShiftDueDate(1)}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              +1d
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkShiftDueDate(3)}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              +3d
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkShiftDueDate(7)}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              +7d
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkClearDueDate()}
              style={{ padding: "0.2rem 0.45rem", fontSize: "var(--dc-font-size-xs)" }}
            >
              Clear
            </Button>
          </div>

          {/* Archive / Delete */}
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              alignItems: "center",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkArchiveSelected()}
              style={{
                padding: "0.2rem 0.5rem",
                fontSize: "var(--dc-font-size-xs)",
              }}
            >
              Archive
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!hasSelection}
              onClick={() => void onBulkDeleteSelected()}
              style={{
                padding: "0.2rem 0.5rem",
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-color-danger)",
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TasksBulkActions;
