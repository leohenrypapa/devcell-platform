// frontend/src/features/knowledge/KnowledgeAnswerCard.tsx
import React, { useState } from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  answer: string;
};

const MAX_COLLAPSED_CHARS = 800;

const KnowledgeAnswerCard: React.FC<Props> = ({ answer }) => {
  const [expanded, setExpanded] = useState(false);

  const isLong = answer.length > MAX_COLLAPSED_CHARS;
  const displayText =
    !isLong || expanded
      ? answer
      : `${answer.slice(0, MAX_COLLAPSED_CHARS).trimEnd()}…`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(answer);
  };

  return (
    <Card
      style={{
        padding: "0.9rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "0.4rem",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Answer
        </h3>
        <div
          style={{
            display: "flex",
            gap: "0.35rem",
            alignItems: "center",
          }}
        >
          {isLong && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              style={{
                fontSize: "var(--dc-font-size-xs)",
                padding: "0.25rem 0.55rem",
              }}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopy}
            style={{
              fontSize: "var(--dc-font-size-xs)",
              padding: "0.25rem 0.55rem",
            }}
          >
            Copy
          </Button>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "var(--dc-font-size-sm)",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayText}
      </p>
      {isLong && !expanded && (
        <p
          style={{
            marginTop: "0.4rem",
            marginBottom: 0,
            fontSize: "var(--dc-font-size-xs)",
            color: "var(--dc-text-muted)",
          }}
        >
          Answer truncated for readability. Click “Show more” to view the full
          response.
        </p>
      )}
    </Card>
  );
};

export default KnowledgeAnswerCard;
