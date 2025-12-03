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

  return (
    <div>
      <h1>AI Code Review</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Paste a code snippet and let the backend LLM provide a structured review.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Code
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            style={{
              display: "block",
              width: "100%",
              marginTop: "0.25rem",
              fontFamily: "monospace",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          Extra Context (optional)
          <textarea
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            rows={3}
            style={{
              display: "block",
              width: "100%",
              marginTop: "0.25rem",
            }}
          />
        </label>

        {error && (
          <p style={{ color: "red", marginBottom: "0.75rem" }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Running review..." : "Run Code Review"}
        </button>
      </form>

      {review && (
        <section
          style={{
            marginTop: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "1rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2>Review Result</h2>
          <p>{review}</p>
        </section>
      )}
    </div>
  );
};

export default CodeReviewPage;
