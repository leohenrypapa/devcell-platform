// frontend/src/features/dashboard/DashboardSitrepCard.tsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useUser } from "../../context/UserContext";
import { BACKEND_BASE } from "../../lib/backend";
import Button from "../../ui/Button";
import Card from "../../ui/Card";

type DashboardSitrepCardProps = {
  useRag: boolean;
};

type SitrepResponse = {
  // You may want to tighten this once you confirm the backend shape.
  // Common patterns:
  // - { sitrep: string }
  // - { markdown: string }
  // - { report: string }
  // - { content: string }
  [key: string]: unknown;
};

const DashboardSitrepCard: React.FC<DashboardSitrepCardProps> = ({
  useRag,
}) => {
  const { token } = useUser();

  const [instructions, setInstructions] = useState("");
  const [sitrep, setSitrep] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSitrep(null);

    try {
      const url = `${BACKEND_BASE}/api/dashboard/sitrep?use_rag=${
        useRag ? "1" : "0"
      }`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instructions: instructions.trim() || null,
        }),
      });

      if (!resp.ok) {
        throw new Error(`SITREP request failed (${resp.status})`);
      }

      const json = (await resp.json()) as SitrepResponse;

      // Try a few common keys to find the markdown content
      const maybeSitrep =
        (typeof json.sitrep === "string" && json.sitrep) ||
        (typeof json.markdown === "string" && json.markdown) ||
        (typeof json.report === "string" && json.report) ||
        (typeof json.content === "string" && json.content) ||
        null;

      if (!maybeSitrep) {
        // Fallback: show the JSON for debugging / first-wire-up
        setSitrep("```json\n" + JSON.stringify(json, null, 2) + "\n```");
      } else {
        setSitrep(maybeSitrep);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate SITREP", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to generate SITREP";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <label
            htmlFor="dashboard-sitrep-notes"
            style={{
              fontSize: "var(--dc-font-size-sm)",
              fontWeight: 500,
            }}
          >
            Additional notes (optional)
          </label>
          <p
            style={{
              margin: 0,
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-text-muted)",
            }}
          >
            The SITREP always pulls from recent standups, tasks, projects, and
            the knowledgebase. Use this field to highlight specific missions,
            priorities, or audiences.
          </p>
          <textarea
            id="dashboard-sitrep-notes"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="Example: Focus on Crew 3 malware dev training status and any blockers for this week..."
            style={{
              width: "100%",
              borderRadius: "var(--dc-radius-sm)",
              border: `1px solid var(--dc-border-subtle)`,
              padding: "0.5rem 0.6rem",
              fontFamily: "inherit",
              fontSize: "var(--dc-font-size-sm)",
              resize: "vertical",
              minHeight: "3rem",
              backgroundColor: "var(--dc-bg-surface)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              minWidth: "8rem",
            }}
          >
            {loading ? "Generating…" : "Generate SITREP"}
          </Button>
          <span
            style={{
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-text-muted)",
            }}
          >
            Uses {useRag ? "LLM + RAG" : "LLM only"} based on your toggle in the
            header.
          </span>
        </div>

        {error && (
          <p
            style={{
              margin: 0,
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-color-danger)",
            }}
          >
            {error}
          </p>
        )}

        {sitrep && (
          <div
            style={{
              marginTop: "0.4rem",
              paddingTop: "0.4rem",
              borderTop: `1px solid var(--dc-border-subtle)`,
              maxHeight: "20rem",
              overflow: "auto",
              fontSize: "var(--dc-font-size-sm)",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p
                    style={{
                      margin: "0 0 0.4rem",
                    }}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul
                    style={{
                      margin: "0 0 0.4rem 1.1rem",
                      padding: 0,
                    }}
                  >
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol
                    style={{
                      margin: "0 0 0.4rem 1.1rem",
                      padding: 0,
                    }}
                  >
                    {children}
                  </ol>
                ),
              }}
            >
              {sitrep}
            </ReactMarkdown>
          </div>
        )}

        {!sitrep && !error && !loading && (
          <p
            style={{
              margin: 0,
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-text-muted)",
            }}
          >
            No SITREP generated yet. Add optional notes and click{" "}
            <strong>Generate SITREP</strong> to produce a briefing-ready
            markdown report.
          </p>
        )}
      </div>
    </Card>
  );
};

export default DashboardSitrepCard;
