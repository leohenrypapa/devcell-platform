// filename: frontend/src/pages/CodeReviewPage.tsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

// Very small markdown-ish renderer for the review output.
// Supports:
// - "### Heading"  -> <h3>
// - "#### Heading" -> <h4>
// - "- item"       -> <ul><li>item</li></ul>
// - Inline **bold** and *italic*
// - Everything else as <p>

const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith("*")) {
      parts.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  // Remaining plain text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const renderReviewContent = (review: string): React.ReactNode => {
  const lines = review.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems.map((text, idx) => (
      <li key={`li-${elements.length}-${idx}`}>{renderInline(text)}</li>
    ));
    elements.push(
      <ul
        key={`ul-${elements.length}`}
        style={{
          margin: "0.25rem 0 0.4rem 1.2rem",
          padding: 0,
          fontSize: "0.85rem",
        }}
      >
        {items}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("- ")) {
      // List item (will be rendered with renderInline)
      listItems.push(line.slice(2));
      return;
    }

    // If we hit a non-list line, flush any pending list
    flushList();

    if (line.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            margin: "0.5rem 0 0.2rem",
            fontSize: "0.92rem",
            fontWeight: 600,
          }}
        >
          {renderInline(line.slice(5))}
        </h4>,
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            margin: "0.6rem 0 0.25rem",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: "0.1rem 0 0.35rem",
            fontSize: "0.85rem",
          }}
        >
          {renderInline(line)}
        </p>,
      );
    }
  });

  flushList();
  return elements;
};

const CodeReviewPage: React.FC = () => {
  const { token } = useUser();

  const [code, setCode] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasCode = code.trim().length > 0;

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }

    setLoading(true);
    setError(null);
    setReview(null);
    setCopied(false);

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
      setLastReviewedAt(new Date().toISOString());
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
    setLastReviewedAt(null);
    setCopied(false);
  };

  const handleCopyReview = () => {
    if (!review || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard
      .writeText(review)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // ignore copy failures silently
      });
  };

  let lastReviewedLabel: string | null = null;
  if (lastReviewedAt) {
    try {
      const d = new Date(lastReviewedAt);
      lastReviewedLabel = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      lastReviewedLabel = null;
    }
  }

  const statusLabel = loading
    ? "Reviewing…"
    : lastReviewedLabel
    ? `Last run ${lastReviewedLabel}`
    : "Idle";

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
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              alignItems: "flex-end",
            }}
          >
            <div>
              Backend: <code>/api/review</code>
            </div>
            <div>Authentication: {token ? "using JWT" : "anonymous"}</div>
            <div
              style={{
                marginTop: "0.15rem",
                padding: "0.1rem 0.5rem",
                borderRadius: "999px",
                border: "1px solid var(--dc-border-subtle, #d1d5db)",
                background: loading
                  ? "var(--dc-surface-muted, #fee2e2)"
                  : "var(--dc-surface-subtle, #f3f4f6)",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              {statusLabel}
            </div>
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
                  Paste only what&apos;s needed. No code is sent externally.
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginBottom: "0.35rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1rem",
                }}
              >
                Review output
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.8rem",
                }}
              >
                {lastReviewedLabel && (
                  <span
                    style={{
                      opacity: 0.75,
                    }}
                  >
                    Last run {lastReviewedLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyReview}
                  disabled={!review}
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                    border:
                      "1px solid var(--dc-border-subtle, #d1d5db)",
                    background: "var(--dc-surface-card, #ffffff)",
                    cursor: review ? "pointer" : "not-allowed",
                    fontSize: "0.75rem",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

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
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  overflowY: "auto",
                }}
              >
                {renderReviewContent(review)}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CodeReviewPage;
