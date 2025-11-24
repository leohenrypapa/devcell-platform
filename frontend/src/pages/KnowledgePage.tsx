import React, { useState } from "react";

type KnowledgeResponse = {
  answer: string;
  sources: string[];
};

const KnowledgePage: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const res = await fetch(`${backendBase}/api/knowledge/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        // NOTE: use normal string concatenation to avoid template literal issues
        throw new Error("HTTP " + res.status);
      }

      const data: KnowledgeResponse = await res.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      console.error(err);
      setError("Error contacting knowledge API. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Knowledge Base (RAG)</h1>
      <p>
        Ask questions based on documents in your <code>knowledgebase/</code>{" "}
        folder.
      </p>

      <textarea
        rows={4}
        style={{ width: "100%", margin: "0.5rem 0" }}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Example: What is our development process?"
      />

      <button onClick={handleAsk} disabled={loading}>
        {loading ? "Asking..." : "Ask"}
      </button>

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          {error}
        </div>
      )}

      {answer && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
            background: "#fafafa",
          }}
        >
          <h2>Answer</h2>
          <p>{answer}</p>
          {sources.length > 0 && (
            <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
              <strong>Sources:</strong>
              <ul>
                {sources.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgePage;
