// filename: frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

type DashboardSummary = {
  summary: string;
  standup_count: number;
  project_count: number;
  knowledge_docs: number;
};

const DashboardPage: React.FC = () => {
  const { token } = useUser();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [useRag, setUseRag] = useState<boolean>(false);

  const fetchSummary = async (rag: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${backendBase}/api/dashboard/summary`);
      url.searchParams.set("use_rag", String(rag));

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json: DashboardSummary = await res.json();
      setData(json);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load dashboard summary:", err);
      setError("Failed to load dashboard summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    void fetchSummary(useRag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleRag = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setUseRag(next);
    void fetchSummary(next);
  };

  const handleRefresh = () => {
    void fetchSummary(useRag);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>DevCell Dashboard</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0 }}>
          High-level SITREP-style summary of today&apos;s activity — standups,
          projects, and knowledgebase. You can optionally enrich this summary
          with Knowledgebase (RAG) context.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            marginTop: "0.25rem",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.85rem",
            }}
          >
            <input
              type="checkbox"
              checked={useRag}
              onChange={handleToggleRag}
            />
            <span>Use Knowledgebase (RAG)</span>
          </label>

          <button type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          {useRag && (
            <span
              style={{
                fontSize: "0.8rem",
                opacity: 0.7,
              }}
            >
              RAG enabled: summary may include extra context from KB documents.
            </span>
          )}
        </div>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            color: "red",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <section
        aria-label="Dashboard summary"
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "1rem",
          minHeight: "150px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Summary</h2>

        {loading && !data && (
          <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>Loading…</p>
        )}

        {data && (
          <>
            <div
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {data.summary}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                fontSize: "0.85rem",
                opacity: 0.85,
              }}
            >
              <div>
                <strong>Standups:</strong> {data.standup_count}
              </div>
              <div>
                <strong>Projects:</strong> {data.project_count}
              </div>
              <div>
                <strong>Knowledgebase docs:</strong> {data.knowledge_docs}
              </div>
            </div>
          </>
        )}

        {!loading && !data && !error && (
          <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>
            No summary available yet.
          </p>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
