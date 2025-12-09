// frontend/src/ui/Button.tsx
import React from "react";

export type ButtonVariant = "primary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  style,
  children,
  ...rest
}) => {
  const base: React.CSSProperties = {
    borderRadius: "var(--dc-radius-sm)",
    fontSize: "var(--dc-font-size-sm)",
    padding: "0.45rem 0.9rem",
    border: "1px solid transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    transition:
      "background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
    whiteSpace: "nowrap",
  };

  let variantStyle: React.CSSProperties;
  if (variant === "ghost") {
    variantStyle = {
      backgroundColor: "transparent",
      borderColor: "var(--dc-border-subtle)",
      color: "var(--dc-text-primary)",
    };
  } else {
    variantStyle = {
      backgroundColor: "var(--dc-color-primary)",
      color: "#f9fafb",
      boxShadow: "0 1px 2px rgba(15,23,42,0.18)",
    };
  }

  return (
    <button
      type={rest.type ?? "button"}
      style={{ ...base, ...variantStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
