// frontend/src/features/dashboard/DashboardSection.tsx
import React from "react";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <section
      aria-label={title}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-md)",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              marginTop: "0.2rem",
              marginBottom: 0,
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-text-muted)",
              maxWidth: "48rem",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
