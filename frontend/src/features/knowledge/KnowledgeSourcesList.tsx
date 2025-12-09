// frontend/src/features/knowledge/KnowledgeSourcesList.tsx
import React from "react";
import type { KnowledgeSourceChunk } from "./useKnowledgeQuery";

type Props = {
  sources: KnowledgeSourceChunk[];
};

const KnowledgeSourcesList: React.FC<Props> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.7rem 0.75rem 0.75rem",
        borderRadius: "var(--dc-radius-sm)",
        border: `1px dashed var(--dc-border-subtle)`,
        backgroundColor: "var(--dc-bg-subtle)",
      }}
    >
      <h4
        style={{
          margin: 0,
          marginBottom: "0.35rem",
          fontSize: "var(--dc-font-size-sm)",
          fontWeight: 500,
        }}
      >
        Sources
      </h4>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          fontSize: "var(--dc-font-size-sm)",
        }}
      >
        {sources.map((src) => (
          <li
            key={src.document_id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.15rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 500,
                }}
              >
                {src.title}
              </span>
              <span
                className="dc-badge"
                style={{
                  padding: "0.05rem 0.45rem",
                  fontSize: "var(--dc-font-size-xs)",
                }}
              >
                <span
                  className="dc-badge-dot"
                  style={{
                    backgroundColor: "var(--dc-color-primary)",
                  }}
                />
                score {src.score.toFixed(3)}
              </span>
            </div>
            <span
              style={{
                opacity: 0.85,
              }}
            >
              {src.snippet}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KnowledgeSourcesList;
