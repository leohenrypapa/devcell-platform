// frontend/src/features/knowledge/KnowledgeQuerySection.tsx
import React from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  question: string;
  setQuestion: (value: string) => void;
  loading: boolean;
  error: string | null;
  onAsk: () => Promise<void>;
};

const KnowledgeQuerySection: React.FC<Props> = ({
  question,
  setQuestion,
  loading,
  error,
  onAsk,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onAsk();
  };

  return (
    <Card
      style={{
        padding: "1.1rem 1.1rem 1rem",
      }}
    >
      <section aria-label="Ask the knowledge base">
        <header
          style={{
            marginBottom: "0.75rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            Ask the Knowledgebase
          </h2>
          <p
            style={{
              margin: "0.3rem 0 0",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-text-muted)",
            }}
          >
            Ask a question and the local LLM will answer using indexed documents.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="kb-question"
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontSize: "var(--dc-font-size-sm)",
              fontWeight: 500,
            }}
          >
            Question
          </label>
          <textarea
            id="kb-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Example: Summarize our malware dev training pipeline and list open gaps."
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: "var(--dc-radius-sm)",
              border: "1px solid var(--dc-border-subtle)",
              padding: "0.5rem 0.6rem",
              fontSize: "var(--dc-font-size-sm)",
              outline: "none",
            }}
          />
          <div
            style={{
              marginTop: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Thinking…" : "Ask"}
            </Button>
            <span
              style={{
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              Press Enter while focused here to send, or refine your question and
              ask again.
            </span>
          </div>
        </form>

        {error && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--dc-color-danger)",
              fontSize: "var(--dc-font-size-sm)",
            }}
          >
            {error}
          </p>
        )}
      </section>
    </Card>
  );
};

export default KnowledgeQuerySection;
