import React, { useState } from "react";

type CodeReviewResponse = {
  review: string;
};

const CodeReviewPage: React.FC = () => {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [focus, setFocus] = useState("general");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const handleReview = async () => {
    if (!code.trim()) {
      alert("Please paste some code or a diff to review.");
      return;
    }

    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const res = await fetch(`${backendBase}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description: description || undefined,
          language: language || undefined,
          focus: focus || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: CodeReviewResponse = await res.json();
      setReview(data.review);
    } catch (err) {
      console.error(err);
      setError("Failed to get code review. Check if backend/LLM is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Code Review Helper</h1>
      <p>
        Paste code or a diff, add optional context, and let the LLM give you
        review feedback.
      </p>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Language (optional)
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              placeholder="e.g., python, javascript, diff, etc."
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Review focus
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
            >
              <option value="general">General</option>
              <option value="correctness">Correctness</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="readability">Readability</option>
              <option value="tests">Tests</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Context (optional)
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              placeholder="Describe what this code is supposed to do, or where it lives (e.g., API handler, service, etc.)."
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Code / Diff (required)
            <textarea
              rows={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem", fontFamily: "monospace" }}
              placeholder={`Example:\n\nfunction add(a, b) {\n  return a + b;\n}`}
            />
          </label>
        </div>

        <button onClick={handleReview} disabled={loading}>
          {loading ? "Reviewing..." : "Run Code Review"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          {error}
        </div>
      )}

      {review && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2>Review Feedback</h2>
          <p>{review}</p>
        </div>
      )}
    </div>
  );
};

export default CodeReviewPage;
