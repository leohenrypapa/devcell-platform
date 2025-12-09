// filename: frontend/src/context/ToastContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

type ToastType = "info" | "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const getBackground = (type: ToastType): string => {
    switch (type) {
      case "success":
        return "var(--dc-color-success)";
      case "error":
        return "var(--dc-color-danger)";
      case "info":
      default:
        return "var(--dc-color-primary)";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{
              minWidth: "220px",
              maxWidth: "360px",
              padding: "0.6rem 0.9rem",
              borderRadius: "var(--dc-radius-sm)",
              color: "#ffffff",
              backgroundColor: getBackground(t.type),
              boxShadow: "var(--dc-shadow-md)",
              fontSize: "var(--dc-font-size-sm)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                fontSize: "var(--dc-font-size-sm)",
                opacity: 0.8,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    console.warn("useToast called outside of ToastProvider");
    return {
      showToast: (msg: string) => {
        console.log("Toast:", msg);
      },
    };
  }
  return ctx;
};
