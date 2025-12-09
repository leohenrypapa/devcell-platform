// frontend/src/ui/Card.tsx
import React from "react";

type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <section
      style={{
        borderRadius: "var(--dc-radius-md)",
        padding: "1rem",
        border: `1px solid var(--dc-border-subtle)`,
        backgroundColor: "var(--dc-bg-surface)",
        boxShadow: "var(--dc-shadow-sm)",
        ...style,
      }}
    >
      {children}
    </section>
  );
};

export default Card;
