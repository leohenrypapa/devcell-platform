// frontend/src/features/knowledge/KnowledgeDocumentViewer.tsx
import React from "react";
import Card from "../../ui/Card";
import type { KnowledgeDocument } from "./useKnowledgeDocuments";

type Props = {
  doc: KnowledgeDocument | null;
};

const KnowledgeDocumentViewer: React.FC<Props> = ({ doc }) => {
  if (!doc) {
    return (
      <Card
        style={{
          height: "100%",
          padding: "0.9rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.4rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Document Viewer
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-text-muted)",
          }}
        >
          Select a document from the list to view its content preview here.
        </p>
      </Card>
    );
  }

  const typeLabel = doc.path?.toLowerCase().endsWith(".pdf")
    ? "PDF"
    : doc.path?.toLowerCase().endsWith(".md")
    ? "Markdown"
    : "Text";

  return (
    <Card
      style={{
        height: "100%",
        padding: "0.9rem",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <header
        style={{
          marginBottom: "0.5rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {doc.title}
        </h2>
        <p
          style={{
            margin: "0.3rem 0 0",
            fontSize: "var(--dc-font-size-xs)",
            color: "var(--dc-text-muted)",
          }}
        >
          {typeLabel}
          {doc.path && ` · ${doc.path}`}
        </p>
      </header>
      <div
        style={{
          flex: 1,
          borderRadius: "var(--dc-radius-sm)",
          backgroundColor: "var(--dc-bg-subtle)",
          padding: "0.55rem 0.6rem",
          fontSize: "var(--dc-font-size-xs)",
          color: "var(--dc-text-primary)",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {doc.content_preview}
      </div>
      <p
        style={{
          marginTop: "0.4rem",
          marginBottom: 0,
          fontSize: "var(--dc-font-size-xs)",
          color: "var(--dc-text-muted)",
        }}
      >
        Preview is limited to a subset of the document for quick inspection.
        Full content is still available to the RAG pipeline.
      </p>
    </Card>
  );
};

export default KnowledgeDocumentViewer;
