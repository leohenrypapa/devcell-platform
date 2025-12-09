// filename: frontend/src/components/RagStatusChip.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

type LLMHealth = {
  status: "ok" | "error";
  detail?: string | null;
};

type KnowledgeHealth = {
  status: "ok" | "empty" | "error";
  document_count: number;
  detail?: string | null;
};

type CombinedStatus =
  | "unknown"
  | "healthy"
  | "llm_error"
  | "kb_empty"
  | "kb_error";

const REFRESH_MS = 60000; // 60s

const RagStatusChip: React.FC = () => {
  const { token } = useUser();

  const [combined, setCombined] = useState<CombinedStatus>("unknown");
  const [llmStatus, setLlmStatus] = useState<LLMHealth | null>(null);
  const [kbStatus, setKbStatus] = useState<KnowledgeHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [llmRes, kbRes] = await Promise.all([
        fetch(`${backendBase}/api/health/llm`, { headers }),
        fetch(`${backendBase}/api/health/knowledge`, { headers }),
      ]);

      const llmJson: LLMHealth = await llmRes.json();
      const kbJson: KnowledgeHealth = await kbRes.json();

      setLlmStatus(llmJson);
      setKbStatus(kbJson);

      let nextState: CombinedStatus = "healthy";

      if (llmJson.status === "error") {
        nextState = "llm_error";
      } else if (kbJson.status === "error") {
        nextState = "kb_error";
      } else if (kbJson.status === "empty") {
        nextState = "kb_empty";
      }

      setCombined(nextState);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("RAG status check failed:", err);
      setCombined("llm_error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();

    const interval = window.setInterval(() => {
      void fetchStatus();
    }, REFRESH_MS);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basic style rules depending on status
  let bg = "#eee";
  let border = "#ccc";
  let text = "#333";
  let label = "RAG: unknown";

  if (combined === "healthy") {
    bg = "#e3f5e6";
    border = "#6cc27d";
    text = "#225c2f";
    label = "RAG: OK";
  } else if (combined === "kb_empty") {
    bg = "#fff6e0";
    border = "#f2b450";
    text = "#7a4e00";
    label = "RAG: KB empty";
  } else if (combined === "llm_error") {
    bg = "#fde5e5";
    border = "#e26a6a";
    text = "#7b1111";
    label = "RAG: LLM error";
  } else if (combined === "kb_error") {
    bg = "#fde5e5";
    border = "#e26a6a";
    text = "#7b1111";
    label = "RAG: KB error";
  }

  const kbCount = kbStatus?.document_count ?? null;

  return (
    <div
      title={
        llmStatus?.detail || kbStatus?.detail
          ? `LLM: ${llmStatus?.status}${
              llmStatus?.detail ? ` (${llmStatus.detail})` : ""
            }; KB: ${kbStatus?.status}${
              kbStatus?.detail ? ` (${kbStatus.detail})` : ""
            }`
          : "Knowledgebase/LLM status"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.6rem",
        borderRadius: 999,
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color: text,
        fontSize: "0.75rem",
        cursor: loading ? "wait" : "default",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor:
            combined === "healthy"
              ? "#33aa4e"
              : combined === "kb_empty"
              ? "#f2b450"
              : "#e26a6a",
        }}
      />
      <span>{label}</span>
      {kbCount !== null && (
        <span style={{ opacity: 0.8 }}>(KB docs: {kbCount})</span>
      )}
    </div>
  );
};

export default RagStatusChip;
