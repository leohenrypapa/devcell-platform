// filename: frontend/src/pages/KnowledgePage.tsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

import { useKnowledgeQuery } from "../features/knowledge/useKnowledgeQuery";
import {
  useKnowledgeDocuments,
  type KnowledgeDocument,
} from "../features/knowledge/useKnowledgeDocuments";
import { useKnowledgeAddText } from "../features/knowledge/useKnowledgeAddText";
import { useKnowledgeUpload } from "../features/knowledge/useKnowledgeUpload";

import KnowledgeQuerySection from "../features/knowledge/KnowledgeQuerySection";
import KnowledgeAddTextForm from "../features/knowledge/KnowledgeAddTextForm";
import KnowledgeUploadForm from "../features/knowledge/KnowledgeUploadForm";
import KnowledgeDocumentList from "../features/knowledge/KnowledgeDocumentList";
import KnowledgeDocumentViewer from "../features/knowledge/KnowledgeDocumentViewer";
import KnowledgeAnswerCard from "../features/knowledge/KnowledgeAnswerCard";
import KnowledgeSourcesList from "../features/knowledge/KnowledgeSourcesList";
import PageHeader from "../ui/PageHeader";
import RagStatusChip from "../components/RagStatusChip";

const KnowledgePage: React.FC = () => {
  const { isAuthenticated } = useUser();

  const docs = useKnowledgeDocuments();
  const query = useKnowledgeQuery();
  const addText = useKnowledgeAddText(docs.reloadDocuments);
  const upload = useKnowledgeUpload(docs.reloadDocuments);

  const [selectedDocument, setSelectedDocument] =
    useState<KnowledgeDocument | null>(null);

  // Select first doc by default when list loads
  React.useEffect(() => {
    if (docs.documents.length > 0 && !selectedDocument) {
      setSelectedDocument(docs.documents[0]);
    }
  }, [docs.documents, selectedDocument]);

  return (
    <div className="dc-page">
      <div className="dc-page-inner">
        <PageHeader
          title="Knowledgebase"
          description="Ask questions against your indexed documents, add free-text notes, or upload files. This is your unit’s mini knowledge graph backed by local LLM + RAG."
          actions={<RagStatusChip />}
        />

        {!isAuthenticated && (
          <p
            style={{
              marginTop: "0.25rem",
              marginBottom: "0.75rem",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-color-warning)",
            }}
          >
            You are not signed in. It is recommended to sign in so actions are
            associated with your user account.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
            gap: "1.25rem",
            alignItems: "stretch",
          }}
        >
          {/* LEFT COLUMN: Query + Answer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
              minWidth: 0,
            }}
          >
            <KnowledgeQuerySection
              question={query.question}
              setQuestion={query.setQuestion}
              loading={query.loading}
              error={query.error}
              onAsk={query.ask}
            />

            {/* Answer / Sources region */}
            {query.loading && !query.answer && (
              <div
                style={{
                  borderRadius: "var(--dc-radius-md)",
                  border: "1px solid var(--dc-border-subtle)",
                  background:
                    "linear-gradient(90deg, var(--dc-bg-subtle), var(--dc-bg-surface), var(--dc-bg-subtle))",
                  backgroundSize: "200% 100%",
                  padding: "0.9rem",
                  fontSize: "var(--dc-font-size-sm)",
                  color: "var(--dc-text-muted)",
                }}
              >
                The model is generating an answer using your knowledgebase…
              </div>
            )}

            {query.error && (
              <div
                style={{
                  borderRadius: "var(--dc-radius-md)",
                  border: "1px solid rgba(220,38,38,0.4)",
                  backgroundColor: "rgba(220,38,38,0.05)",
                  padding: "0.7rem 0.8rem",
                  fontSize: "var(--dc-font-size-sm)",
                  color: "var(--dc-color-danger)",
                }}
              >
                {query.error}
              </div>
            )}

            {query.answer && (
              <>
                <KnowledgeAnswerCard answer={query.answer} />
                <KnowledgeSourcesList sources={query.sources} />
              </>
            )}

            {!query.loading && !query.answer && !query.error && (
              <p
                style={{
                  margin: 0,
                  marginTop: "0.35rem",
                  fontSize: "var(--dc-font-size-xs)",
                  color: "var(--dc-text-muted)",
                }}
              >
                Tip: Ask high-level questions like{" "}
                <strong>
                  “Summarize our current malware dev training plan and gaps.”
                </strong>{" "}
                to get a strategic overview from your docs.
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: Authoring + Documents + Viewer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
              minWidth: 0,
            }}
          >
            {/* Authoring section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <KnowledgeAddTextForm
                newTitle={addText.newTitle}
                setNewTitle={addText.setNewTitle}
                newText={addText.newText}
                setNewText={addText.setNewText}
                saving={addText.saving}
                saveMessage={addText.saveMessage}
                saveError={addText.saveError}
                onSubmit={addText.submit}
              />

              <KnowledgeUploadForm
                uploading={upload.uploading}
                uploadMessage={upload.uploadMessage}
                uploadError={upload.uploadError}
                onFileChange={upload.setFile}
                onUpload={upload.upload}
                currentFileName={upload.file ? upload.file.name : null}
              />
            </div>

            {/* Documents sidebar + viewer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.8fr)",
                gap: "0.75rem",
                alignItems: "stretch",
                minHeight: "12rem",
              }}
            >
              <KnowledgeDocumentList
                documents={docs.documents}
                docsLoading={docs.docsLoading}
                docsError={docs.docsError}
                onReload={docs.reloadDocuments}
                onDelete={docs.deleteDocument}
                selectedDocumentId={selectedDocument?.id ?? null}
                onSelectDocument={setSelectedDocument}
              />

              <KnowledgeDocumentViewer doc={selectedDocument} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgePage;
