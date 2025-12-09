// frontend/src/ui/PageHeader.tsx
import React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1rem",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.3rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              marginTop: "0.35rem",
              marginBottom: 0,
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-text-muted)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
