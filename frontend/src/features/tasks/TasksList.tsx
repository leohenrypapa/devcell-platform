// frontend/src/features/tasks/TasksList.tsx
import React from "react";
import type { Project, Task } from "../../lib/tasks";
import type { TaskStatus, TaskUpdatePayload } from "../../lib/tasks";
import TaskListItem from "./TaskListItem";
import Card from "../../ui/Card";

type Props = {
  tasks: Task[];
  loadingTasks: boolean;
  tasksError: string | null;
  projectsError: string | null;
  selectedTaskIds: number[];
  onToggleTaskSelected: (id: number) => void;
  onUpdateTask: (id: number, updates: TaskUpdatePayload) => Promise<void>;
  onQuickShiftDueDate: (task: Task, days: number) => void;
  onQuickClearDueDate: (task: Task) => void;
  onArchiveTask: (id: number) => void;
  onRestoreTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onOpenEdit: (task: Task) => void;
  onGoToStandup: (id: number) => void;
  projects: Project[]; // currently only for the edit modal, passed up
};

const TasksList: React.FC<Props> = ({
  tasks,
  loadingTasks,
  tasksError,
  projectsError,
  selectedTaskIds,
  onToggleTaskSelected,
  onUpdateTask,
  onQuickShiftDueDate,
  onQuickClearDueDate,
  onArchiveTask,
  onRestoreTask,
  onDeleteTask,
  onOpenEdit,
  onGoToStandup,
}) => {
  if (projectsError) {
    return (
      <Card>
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-color-danger)",
          }}
        >
          Failed to load projects: {projectsError}
        </p>
      </Card>
    );
  }

  if (tasksError) {
    return (
      <Card>
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-color-danger)",
          }}
        >
          Failed to load tasks: {tasksError}
        </p>
      </Card>
    );
  }

  if (loadingTasks && tasks.length === 0) {
    return (
      <Card>
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-text-muted)",
          }}
        >
          Loading tasks…
        </p>
      </Card>
    );
  }

  if (!loadingTasks && tasks.length === 0) {
    return (
      <Card>
        <div
          style={{
            fontSize: "var(--dc-font-size-sm)",
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: "0.25rem",
            }}
          >
            No tasks match your current filters.
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--dc-text-muted)",
            }}
          >
            Try clearing filters or creating a new task.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      {tasks.map((t) => (
        <TaskListItem
          key={t.id}
          task={t}
          isSelected={selectedTaskIds.includes(t.id)}
          onToggleSelected={() => onToggleTaskSelected(t.id)}
          onUpdateStatus={(status: TaskStatus) =>
            void onUpdateTask(t.id, { status })
          }
          onUpdateProgress={(progress: number) =>
            void onUpdateTask(t.id, { progress })
          }
          onQuickShiftDueDate={(days) => onQuickShiftDueDate(t, days)}
          onQuickClearDueDate={() => onQuickClearDueDate(t)}
          onOpenEdit={() => onOpenEdit(t)}
          onArchive={() => onArchiveTask(t.id)}
          onRestore={() => onRestoreTask(t.id)}
          onDelete={() => onDeleteTask(t.id)}
          onGoToStandup={onGoToStandup}
        />
      ))}
    </ul>
  );
};

export default TasksList;
