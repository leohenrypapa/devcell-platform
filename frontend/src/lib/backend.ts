// frontend/src/lib/backend.ts

import { getToken } from "./token";

// Safe access for Vite env vars
const raw = (import.meta as any)?.env?.VITE_BACKEND_BASE_URL as
  | string
  | undefined;

/**
 * Infer backend base URL from the current browser location.
 *
 * Example:
 *   Frontend: http://192.168.0.159:5173
 *   Backend:  http://192.168.0.159:9000
 */
function inferBackendBase(): string {
  if (typeof window === "undefined") {
    // SSR or non-browser environment fallback
    return "http://localhost:9000";
  }

  const { protocol, hostname } = window.location;
  const port = "9000";

  return `${protocol}//${hostname}:${port}`;
}

/**
 * BACKEND_BASE
 *
 * Priority:
 * 1. If VITE_BACKEND_BASE_URL is set -> use that (e.g. http://my-devcell:9000)
 * 2. Otherwise -> infer from current hostname + port 9000
 */
export const BACKEND_BASE: string =
  typeof raw === "string" && raw.trim() !== ""
    ? raw.trim().replace(/\/+$/, "")
    : inferBackendBase();

/**
 * Build a full URL string from a path.
 * - If path is already absolute (http/https), return as-is.
 * - Otherwise, prefix with BACKEND_BASE and normalize slashes.
 */
export function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = BACKEND_BASE.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Central API helper for all DevCell backend calls.
 *
 * Automatically injects Authorization header if token is present.
 *
 * Usage:
 *   api("/api/auth/login", { method: "POST", body: ... })
 */
export async function api(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = buildUrl(path);

  const token = getToken();
  const headers = new Headers(options.headers || {});

  // Attach token automatically to every call (except auth endpoints, backend will ignore if not needed)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure JSON default unless caller overrides it
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Debug log so you can see which backend URL the frontend is using.
if (typeof console !== "undefined") {
  // e.g. [DevCell] BACKEND_BASE = http://192.168.0.159:9000
  console.log("[DevCell] BACKEND_BASE =", BACKEND_BASE);
}
