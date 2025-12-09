// frontend/src/features/knowledge/useKnowledgeQuery.ts
import { useState } from "react";
import { useUser } from "../../context/UserContext";

export interface KnowledgeSourceChunk {
  document_id: string;
  title: string;
  snippet: string;
  score: number;
}

interface KnowledgeQueryResponse {
  answer: string;
  sources: KnowledgeSourceChunk[];
}

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseKnowledgeQueryResult = {
  question: string;
  setQuestion: (value: string) => void;
  answer: string | null;
  sources: KnowledgeSourceChunk[];
  loading: boolean;
  error: string | null;
  ask: () => Promise<void>;
  reset: () => void;
};

export const useKnowledgeQuery = (): UseKnowledgeQueryResult => {
  const { token } = useUser();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSourceChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const res = await fetch(`${backendBase}/api/knowledge/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: question,
          top_k: 4,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: KnowledgeQueryResponse = await res.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Knowledge query error:", err);
      setError("Failed to query knowledgebase.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnswer(null);
    setSources([]);
    setError(null);
  };

  return {
    question,
    setQuestion,
    answer,
    sources,
    loading,
    error,
    ask,
    reset,
  };
};
