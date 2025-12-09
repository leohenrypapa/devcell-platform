// frontend/src/features/knowledge/KnowledgeDocumentList.tsx
import React, { useState } from "react";
import type {
  KnowledgeDocument,
  UseKnowledgeDocumentsResult,
} from "./useKnowledgeDocuments";
import KnowledgeDocumentItem from "./KnowledgeDocumentItem";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  documents: KnowledgeDocument[];
  docsLoading: boolean;
  docsError: string | null;
  onReload: () => void;
  onDelete: UseKnowledgeDocumentsResult["deleteDocument"];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: KnowledgeDocument) => void;
};

const KnowledgeDocumentList: React.FC<Props> = ({
  documents,
  docsLoading,
  docsError,
  onReload,
  onDelete,
  selectedDocumentId,
  onSelectDocument,
}) => {
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDocument | null>(
    null,
  );

  const hasDocs = documents.length > 0;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const docToDelete = pendingDelete;
    setPendingDelete(null);
    await onDelete(docToDelete);
  };

  const handleCancelDelete = () => {
    setPendingDelete(null);
  };

  const handleRetry = () => {
    onReload();
  };

  return (
    <Card
      style={{
        padding: "0.85rem 0.85rem 0.8rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <section
        aria-label="Indexed knowledge documents"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.4rem",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Indexed Documents
            </h2>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "var(--dc-font-size-sm)",
                color: "var(--dc-text-muted)",
              }}
            >
              These documents feed the knowledgebase and are used for RAG
              answers. Click a document to inspect it on the right.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onReload}
            disabled={docsLoading}
            style={{
              fontSize: "var(--dc-font-size-xs)",
              padding: "0.25rem 0.7rem",
            }}
          >
            {docsLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {docsError && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 0.6rem",
              borderRadius: "var(--dc-radius-sm)",
              border: "1px solid rgba(220,38,38,0.4)",
              backgroundColor: "rgba(220,38,38,0.05)",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-color-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <span>{docsError}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRetry}
              style={{
                fontSize: "var(--dc-font-size-xs)",
                padding: "0.2rem 0.55rem",
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {docsLoading && !hasDocs && !docsError && (
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-text-muted)",
            }}
          >
            Loading documents…
          </p>
        )}

        {!docsLoading && !hasDocs && !docsError && (
          <div
            style={{
              marginTop: "0.6rem",
              padding: "0.7rem 0.8rem",
              borderRadius: "var(--dc-radius-sm)",
              backgroundColor: "var(--dc-bg-subtle)",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-text-muted)",
            }}
          >
            No documents indexed yet. Add text or upload files above to seed the
            knowledgebase.
          </div>
        )}

        {hasDocs && (
          <ul
            style={{
              listStyle: "none",
              margin: "0.8rem 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {documents.map((doc) => (
              <KnowledgeDocumentItem
                key={doc.id}
                doc={doc}
                onRequestDelete={setPendingDelete}
                onSelect={onSelectDocument}
                isSelected={doc.id === selectedDocumentId}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Delete confirmation overlay */}
      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: "22rem",
              width: "100%",
              borderRadius: "var(--dc-radius-md)",
              backgroundColor: "var(--dc-bg-surface)",
              border: "1px solid rgba(220,38,38,0.4)",
              boxShadow: "var(--dc-shadow-sm)",
              padding: "0.9rem 1rem 0.85rem",
              fontSize: "var(--dc-font-size-sm)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--dc-color-danger)",
              }}
            >
              Delete document?
            </h3>
            <p
              style={{
                margin: "0.45rem 0 0.25rem",
                color: "var(--dc-text-primary)",
              }}
            >
              You&apos;re about to delete{" "}
              <strong>{pendingDelete.title}</strong>. This will remove its
              vectors and, if it&apos;s a file under <code>Knowledgebase/</code>
              , the file itself.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              This action cannot be undone. RAG answers will no longer use this
              document.
            </p>

            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
              }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelDelete}
                style={{
                  fontSize: "var(--dc-font-size-xs)",
                  padding: "0.3rem 0.8rem",
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  fontSize: "var(--dc-font-size-xs)",
                  padding: "0.3rem 0.8rem",
                  backgroundColor: "var(--dc-color-danger)",
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default KnowledgeDocumentList;
