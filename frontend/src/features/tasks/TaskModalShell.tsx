// frontend/src/features/tasks/TaskModalShell.tsx
import React, { useEffect } from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type TaskModalShellProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: number | string;
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "var(--dc-overlay-backdrop, rgba(15,23,42,0.55))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
  padding: "1rem",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  padding: "1rem 1.1rem 0.9rem",
  borderRadius: "var(--dc-radius-lg)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.5rem",
  alignItems: "center",
  marginBottom: "0.7rem",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 600,
};

const bodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const footerWrapperStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
};

const TaskModalShell: React.FC<TaskModalShellProps> = ({
  title,
  onClose,
  children,
  footer,
  maxWidth = 540,
}) => {
  const modalId = "task-modal-title";

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalId}
      onClick={handleBackdropClick}
      style={backdropStyle}
    >
      <Card
        style={{
          ...cardStyle,
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }}
      >
        <div style={headerStyle}>
          <h2 id={modalId} style={titleStyle}>
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            style={{
              padding: "0.1rem 0.45rem",
              fontSize: "var(--dc-font-size-xs)",
            }}
          >
            Close
          </Button>
        </div>

        <div style={bodyStyle}>{children}</div>

        <div style={footerWrapperStyle}>{footer}</div>
      </Card>
    </div>
  );
};

export default TaskModalShell;
