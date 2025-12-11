// --- Global fetch patch: ensure all backend calls carry the auth token ---
import { BACKEND_BASE } from "./lib/backend";
import { getToken } from "./lib/token";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    let url: string;
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.toString();
    else url = input.url;

    const isBackendRequest =
      url.startsWith(BACKEND_BASE) ||
      url.startsWith("/api/") ||
      url.includes(":9000/");

    if (!isBackendRequest) {
      return originalFetch(input as any, init);
    }

    const token = getToken();
    const headers = new Headers(init.headers || {});

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const finalInit: RequestInit = { ...init, headers };

    return originalFetch(url, finalInit);
  };
}
// --- End global fetch patch ---

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { UserProvider } from "./context/UserContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
