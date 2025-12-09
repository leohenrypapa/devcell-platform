// filename: frontend/src/ui/ConfirmDialog.tsx
import React from "react";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  };

  const dialogStyle: React.CSSProperties = {
    minWidth: "min(420px, 100% - 2rem)",
    borderRadius: "var(--dc-radius-lg, 0.9rem)",
    backgroundColor: "var(--dc-bg-surface)",
    boxShadow: "var(--dc-shadow-lg, 0 20px 40px rgba(15,23,42,0.35))",
    border: "1px solid var(--dc-border-subtle)",
    padding: "1rem 1.1rem 0.9rem",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "var(--dc-font-size-md)",
    fontWeight: 600,
  };

  const descriptionStyle: React.CSSProperties = {
    marginTop: "0.4rem",
    marginBottom: 0,
    fontSize: "var(--dc-font-size-sm)",
    color: "var(--dc-text-muted)",
  };

  const footerStyle: React.CSSProperties = {
    marginTop: "0.9rem",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  };

  const confirmStyle: React.CSSProperties =
    tone === "danger"
      ? {
          backgroundColor: "var(--dc-color-danger)",
          borderColor: "transparent",
        }
      : {};

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dc-confirm-title"
      style={backdropStyle}
      onClick={handleBackdropClick}
    >
      <div style={dialogStyle}>
        <h2 id="dc-confirm-title" style={titleStyle}>
          {title}
        </h2>
        {description && <p style={descriptionStyle}>{description}</p>}

        <div style={footerStyle}>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            style={{
              fontSize: "var(--dc-font-size-sm)",
              paddingInline: "0.9rem",
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            style={{
              fontSize: "var(--dc-font-size-sm)",
              paddingInline: "0.9rem",
              ...confirmStyle,
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
