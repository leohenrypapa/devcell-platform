import React, { createContext, useContext, useState, useCallback } from "react";

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
      // Auto-dismiss after 4 seconds
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const getBackground = (type: ToastType) => {
    switch (type) {
      case "success":
        return "#16a34a"; // green
      case "error":
        return "#b91c1c"; // red
      case "info":
      default:
        return "#2563eb"; // blue
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
            style={{
              minWidth: "220px",
              maxWidth: "360px",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              color: "#fff",
              backgroundColor: getBackground(t.type),
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              fontSize: "0.85rem",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Failsafe: don’t crash if provider is missing, just log
    console.warn("useToast called outside of ToastProvider");
    return {
      showToast: (msg: string) => {
        console.log("Toast:", msg);
      },
    };
  }
  return ctx;
};
