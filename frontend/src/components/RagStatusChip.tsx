// filename: frontend/src/components/RagStatusChip.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { BACKEND_BASE } from "../lib/backend";

const backendBase = BACKEND_BASE;

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

  let label = "RAG: unknown";
  let dotColor = "#9ca3af";
  let borderColor = "var(--dc-border-subtle)";
  let bgColor = "transparent";

  if (combined === "healthy") {
    label = "RAG: Ready";
    dotColor = "var(--dc-color-success)";
    borderColor = "rgba(22,163,74,0.5)";
    bgColor = "rgba(22,163,74,0.06)";
  } else if (combined === "kb_empty") {
    label = "RAG: KB empty";
    dotColor = "var(--dc-color-warning)";
    borderColor = "rgba(245,158,11,0.6)";
    bgColor = "rgba(245,158,11,0.06)";
  } else if (combined === "llm_error") {
    label = "RAG: LLM error";
    dotColor = "var(--dc-color-danger)";
    borderColor = "rgba(220,38,38,0.6)";
    bgColor = "rgba(220,38,38,0.06)";
  } else if (combined === "kb_error") {
    label = "RAG: KB error";
    dotColor = "var(--dc-color-danger)";
    borderColor = "rgba(220,38,38,0.6)";
    bgColor = "rgba(220,38,38,0.06)";
  }

  const kbCount = kbStatus?.document_count ?? null;

  const title =
    llmStatus?.detail || kbStatus?.detail
      ? `LLM: ${llmStatus?.status}${
          llmStatus?.detail ? ` (${llmStatus.detail})` : ""
        }; KB: ${kbStatus?.status}${
          kbStatus?.detail ? ` (${kbStatus.detail})` : ""
        }`
      : "Knowledgebase / LLM status";

  return (
    <div
      title={title}
      className="dc-badge"
      style={{
        borderColor,
        backgroundColor: bgColor,
        cursor: loading ? "wait" : "default",
      }}
    >
      <span
        className="dc-badge-dot"
        style={{
          backgroundColor: dotColor,
        }}
      />
      <span>{label}</span>
      {kbCount !== null && (
        <span style={{ opacity: 0.8 }}>(KB: {kbCount})</span>
      )}
    </div>
  );
};

export default RagStatusChip;
