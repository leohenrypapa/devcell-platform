// filename: frontend/src/pages/CodeReviewPage.tsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const CodeReviewPage: React.FC = () => {
  const { token } = useUser();

  const [code, setCode] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCode = code.trim().length > 0;

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }

    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const res = await fetch(`${backendBase}/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          extra_context: extraContext || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: { review: string } = await res.json();
      setReview(data.review);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Failed to run code review.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleReview();
  };

  const handleClear = () => {
    setCode("");
    setExtraContext("");
    setReview(null);
    setError(null);
  };

  return (
    <div className="dc-page">
      <div
        className="dc-page-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          padding: "1.25rem 1rem",
          height: "calc(100vh - 80px)",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.4rem",
              }}
            >
              AI Code Review
            </h1>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.9rem",
                opacity: 0.85,
                maxWidth: 640,
              }}
            >
              Paste a code snippet and let the local DevCell LLM provide a
              structured review. Responses stay inside your environment.
            </p>
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              textAlign: "right",
              opacity: 0.8,
            }}
          >
            <div>Backend: <code>/api/review</code></div>
            <div>Authentication: {token ? "using JWT" : "anonymous"}</div>
          </div>
        </header>

        {/* Main layout: form + review panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.1fr)",
            gap: "1rem",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left: input form */}
          <section
            aria-label="Code review input"
            style={{
              border: "1px solid var(--dc-border-subtle, #d0d7de)",
              borderRadius: "var(--dc-radius-lg, 10px)",
              background: "var(--dc-surface-card, #ffffff)",
              boxShadow: "var(--dc-shadow-sm, 0 1px 2px rgba(0,0,0,0.03))",
              padding: "0.9rem 1rem",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                flex: 1,
                minHeight: 0,
              }}
            >
              <div>
                <label
                  htmlFor="code-review-code"
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  Code
                </label>
                <textarea
                  id="code-review-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={14}
                  placeholder="// Paste code here for review"
                  style={{
                    display: "block",
                    width: "100%",
                    margin: 0,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: "0.85rem",
                    padding: "0.5rem 0.6rem",
                    borderRadius: "var(--dc-radius-md, 6px)",
                    border:
                      "1px solid var(--dc-border-subtle, #d0d7de)",
                    resize: "vertical",
                    minHeight: "8rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="code-review-extra"
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  Extra context (optional)
                </label>
                <textarea
                  id="code-review-extra"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  rows={3}
                  placeholder="e.g., framework, constraints, environment, security requirements…"
                  style={{
                    display: "block",
                    width: "100%",
                    margin: 0,
                    fontSize: "0.85rem",
                    padding: "0.45rem 0.6rem",
                    borderRadius: "var(--dc-radius-md, 6px)",
                    border:
                      "1px solid var(--dc-border-subtle, #d0d7de)",
                    resize: "vertical",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--dc-danger-text, #b00020)",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={loading || !hasCode}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "999px",
                      border: "none",
                      cursor:
                        loading || !hasCode ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      background:
                        hasCode && !loading
                          ? "var(--dc-primary, #2563eb)"
                          : "var(--dc-surface-muted, #e5e7eb)",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? "Running review…" : "Run code review"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading && !hasCode}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "999px",
                      border:
                        "1px solid var(--dc-border-subtle, #d0d7de)",
                      background:
                        "var(--dc-surface-subtle, #f9fafb)",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    textAlign: "right",
                  }}
                >
                  Paste only what&apos;s needed. No code is sent
                  externally.
                </div>
              </div>
            </form>
          </section>

          {/* Right: review result */}
          <section
            aria-label="Code review result"
            style={{
              border: "1px solid var(--dc-border-subtle, #d0d7de)",
              borderRadius: "var(--dc-radius-lg, 10px)",
              background: "var(--dc-surface-subtle, #f9fafb)",
              boxShadow: "var(--dc-shadow-sm, 0 1px 2px rgba(0,0,0,0.03))",
              padding: "0.9rem 1rem",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "0.5rem",
                fontSize: "1rem",
              }}
            >
              Review output
            </h2>

            {!review && !loading && (
              <p
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.8,
                }}
              >
                Run a review to see structured feedback here. The LLM will
                typically highlight:
                <br />
                - correctness and edge cases
                <br />
                - security and safety concerns
                <br />
                - style and maintainability improvements
              </p>
            )}

            {loading && (
              <p
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.85,
                }}
              >
                Analyzing code… This may take a few seconds.
              </p>
            )}

            {review && (
              <div
                style={{
                  marginTop: "0.25rem",
                  padding: "0.6rem 0.7rem",
                  borderRadius: "var(--dc-radius-md, 6px)",
                  border:
                    "1px solid var(--dc-border-subtle, #d0d7de)",
                  background: "var(--dc-surface-card, #ffffff)",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  overflowY: "auto",
                }}
              >
                {review}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CodeReviewPage;
