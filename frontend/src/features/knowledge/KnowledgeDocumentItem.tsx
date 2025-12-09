// frontend/src/features/knowledge/KnowledgeDocumentItem.tsx
import React from "react";
import type { KnowledgeDocument } from "./useKnowledgeDocuments";
import Button from "../../ui/Button";

type Props = {
  doc: KnowledgeDocument;
  onRequestDelete: (doc: KnowledgeDocument) => void;
  onSelect: (doc: KnowledgeDocument) => void;
  isSelected: boolean;
};

const KnowledgeDocumentItem: React.FC<Props> = ({
  doc,
  onRequestDelete,
  onSelect,
  isSelected,
}) => {
  const typeLabel = doc.path?.toLowerCase().endsWith(".pdf")
    ? "PDF"
    : doc.path?.toLowerCase().endsWith(".md")
    ? "Markdown"
    : "Text";

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRequestDelete(doc);
  };

  const handleSelect = () => {
    onSelect(doc);
  };

  return (
    <li
      onClick={handleSelect}
      style={{
        padding: "0.5rem 0.4rem",
        borderRadius: "var(--dc-radius-sm)",
        border: `1px solid ${
          isSelected ? "var(--dc-color-primary)" : "var(--dc-border-subtle)"
        }`,
        backgroundColor: isSelected
          ? "var(--dc-color-primary-soft)"
          : "var(--dc-bg-subtle)",
        fontSize: "var(--dc-font-size-sm)",
        cursor: "pointer",
        transition:
          "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
        boxShadow: isSelected ? "var(--dc-shadow-sm)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "0.35rem",
                backgroundColor: "var(--dc-bg-surface)",
                border: `1px solid var(--dc-border-subtle)`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
              }}
            >
              📄
            </span>
            <span
              style={{
                fontWeight: 500,
              }}
            >
              {doc.title}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--dc-font-size-xs)",
              color: "var(--dc-text-muted)",
            }}
          >
            <span>{typeLabel}</span>
            {doc.path && (
              <span style={{ marginLeft: "0.35rem" }}>· {doc.path}</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.35rem",
            alignItems: "center",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={handleDeleteClick}
            style={{
              fontSize: "var(--dc-font-size-xs)",
              padding: "0.2rem 0.55rem",
              color: "var(--dc-color-danger)",
              borderColor: "rgba(220,38,38,0.3)",
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
};

export default KnowledgeDocumentItem;
