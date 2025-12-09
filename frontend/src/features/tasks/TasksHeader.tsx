// frontend/src/features/tasks/TasksHeader.tsx
import React from "react";
import PageHeader from "../../ui/PageHeader";
import Button from "../../ui/Button";

type Props = {
  onCreateTask: () => void;
};

const TasksHeader: React.FC<Props> = ({ onCreateTask }) => {
  return (
    <PageHeader
      title="Tasks"
      description="Lightweight personal and team task tracker. Use filters and presets to focus on what's important."
      actions={
        <Button onClick={onCreateTask}>+ New Task</Button>
      }
    />
  );
};

export default TasksHeader;
