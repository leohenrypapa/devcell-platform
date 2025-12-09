// frontend/src/pages/TasksPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUser } from "../context/UserContext";
import type { Task } from "../lib/tasks";
import TasksHeader from "../features/tasks/TasksHeader";
import TasksFilters from "../features/tasks/TasksFilters";
import TasksBulkActions from "../features/tasks/TasksBulkActions";
import TasksList from "../features/tasks/TasksList";
import TaskEditModal from "../features/tasks/TaskEditModal";
import TaskCreateModal from "../features/tasks/TaskCreateModal";
import { useTasksFilters } from "../features/tasks/useTasksFilters";
import { useTasks } from "../features/tasks/useTasks";

const authWarningStyle: React.CSSProperties = {
  marginTop: "0.35rem",
  fontSize: "var(--dc-font-size-sm)",
  color: "var(--dc-color-warning)",
};

const sectionSpacingTopSm: React.CSSProperties = {
  marginTop: "0.75rem",
};

const sectionSpacingTopMd: React.CSSProperties = {
  marginTop: "1rem",
};

const sectionSpacingBottomSm: React.CSSProperties = {
  marginBottom: "0.5rem",
};

const pageMetaRowStyle: React.CSSProperties = {
  marginTop: "0.25rem",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "var(--dc-font-size-xs)",
  color: "var(--dc-text-muted)",
};

const pageMetaLeftStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
};

const pageMetaRightStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  alignItems: "center",
};

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();
  const isAdmin = Boolean(
    (user as any)?.is_admin || (user as any)?.role === "admin",
  );

  const filters = useTasksFilters(isAdmin);

  const {
    tasks,
    projects,
    loadingTasks,
    tasksError,
    loadingProjects,
    projectsError,
    selectedTaskIds,
    toggleTaskSelection,
    clearSelection,
    toggleSelectAllVisible,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
    quickShiftDueDate,
    quickClearDueDate,
    bulkArchiveSelected,
    bulkDeleteSelected,
    bulkStatusChange,
    bulkShiftDueDate,
    bulkClearDueDate,
  } = useTasks({
    mineOnly: filters.mineOnly,
    activeOnly: filters.activeOnly,
    statusFilter: filters.statusFilter,
    projectFilterId: filters.projectFilterId,
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const normalizedSearch = filters.searchTerm.trim().toLowerCase();

  const filteredTasks = useMemo(
    () =>
      normalizedSearch
        ? tasks.filter((t) => {
            const haystack = [
              t.title,
              t.description || "",
              t.owner,
              t.project_name || "",
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(normalizedSearch);
          })
        : tasks,
    [tasks, normalizedSearch],
  );

  const handleGoToStandup = (standupId: number) => {
    navigate("/standups", { state: { focusStandupId: standupId } });
  };

  const totalTasksCount = tasks.length;
  const visibleTasksCount = filteredTasks.length;
  const selectedCount = selectedTaskIds.length;

  const showLoadingSummary = loadingTasks && totalTasksCount === 0;

  return (
    <div className="dc-page">
      <div className="dc-page-inner">
        {/* Page header for Tasks */}
        <TasksHeader onCreateTask={() => setShowCreateModal(true)} />

        {/* Page-level meta: counts + quick status */}
        <div style={pageMetaRowStyle}>
          <div style={pageMetaLeftStyle}>
            {showLoadingSummary ? (
              <span>Loading tasks…</span>
            ) : (
              <>
                <span>
                  Showing <strong>{visibleTasksCount}</strong>
                  {totalTasksCount > 0 ? (
                    <>
                      {" "}
                      of <strong>{totalTasksCount}</strong> tasks
                    </>
                  ) : (
                    " tasks"
                  )}
                </span>
                {filters.mineOnly && (
                  <span>• Filter: <strong>My tasks</strong></span>
                )}
                {filters.activeOnly && (
                  <span>• <strong>Active only</strong></span>
                )}
              </>
            )}
          </div>

          <div style={pageMetaRightStyle}>
            {selectedCount > 0 && (
              <span>
                Selected: <strong>{selectedCount}</strong>
              </span>
            )}
            {!isAuthenticated && (
              <span>Viewing as guest (read-only may be limited)</span>
            )}
          </div>
        </div>

        {/* Auth warning (more prominent for non-authenticated users) */}
        {!isAuthenticated && (
          <p style={authWarningStyle}>
            You must be logged in to view and update tasks. Data may be
            incomplete otherwise.
          </p>
        )}

        {/* Filters section */}
        <div
          style={{
            ...sectionSpacingTopMd,
            ...sectionSpacingBottomSm,
          }}
        >
          <TasksFilters
            mineOnly={filters.mineOnly}
            activeOnly={filters.activeOnly}
            statusFilter={filters.statusFilter}
            projectFilterId={filters.projectFilterId}
            searchTerm={filters.searchTerm}
            projects={projects}
            loadingProjects={loadingProjects}
            isAdmin={isAdmin}
            selectedCount={selectedTaskIds.length}
            onChangeMineOnly={filters.setMineOnly}
            onChangeActiveOnly={filters.setActiveOnly}
            onChangeStatus={filters.setStatusFilter}
            onChangeProject={filters.setProjectFilterId}
            onChangeSearch={filters.setSearchTerm}
            onApplyPreset={filters.applyPreset}
          />
        </div>

        {/* Bulk actions section */}
        <div style={sectionSpacingTopSm}>
          <TasksBulkActions
            filteredTasks={filteredTasks}
            selectedTaskIds={selectedTaskIds}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            onClearSelection={clearSelection}
            onBulkArchiveSelected={bulkArchiveSelected}
            onBulkDeleteSelected={bulkDeleteSelected}
            onBulkStatusChange={bulkStatusChange}
            onBulkShiftDueDate={bulkShiftDueDate}
            onBulkClearDueDate={bulkClearDueDate}
          />
        </div>

        {/* Main tasks list */}
        <div style={sectionSpacingTopSm}>
          <TasksList
            tasks={filteredTasks}
            loadingTasks={loadingTasks}
            tasksError={tasksError}
            projectsError={projectsError}
            selectedTaskIds={selectedTaskIds}
            onToggleTaskSelected={toggleTaskSelection}
            onUpdateTask={updateTask}
            onQuickShiftDueDate={quickShiftDueDate}
            onQuickClearDueDate={quickClearDueDate}
            onArchiveTask={archiveTask}
            onRestoreTask={restoreTask}
            onDeleteTask={deleteTask}
            onOpenEdit={(task) => setEditingTask(task)}
            onGoToStandup={handleGoToStandup}
            projects={projects}
          />
        </div>

        {/* Edit modal */}
        {editingTask && (
          <TaskEditModal
            task={editingTask}
            projects={projects}
            onClose={() => setEditingTask(null)}
            onSave={async (id, payload) => {
              await updateTask(id, payload);
              setEditingTask(null);
            }}
          />
        )}

        {/* Create modal */}
        {showCreateModal && (
          <TaskCreateModal
            projects={projects}
            defaultProjectId={filters.projectFilterId}
            onClose={() => setShowCreateModal(false)}
            onCreate={async ({ title, description, projectId }) => {
              await createTask(title, description, projectId);
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TasksPage;
