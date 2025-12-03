// frontend/src/lib/backend.ts

// Safe access for Vite env vars
const raw = (import.meta as any)?.env?.VITE_BACKEND_BASE_URL;

// If undefined, fallback to backend default
export const BACKEND_BASE =
  typeof raw === "string" && raw.trim() !== ""
    ? raw
    : "http://localhost:9000";

console.log("[DevCell] BACKEND_BASE =", BACKEND_BASE);
