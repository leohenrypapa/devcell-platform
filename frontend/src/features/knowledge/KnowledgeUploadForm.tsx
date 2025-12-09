// frontend/src/features/knowledge/KnowledgeUploadForm.tsx
import React, { useState } from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  uploading: boolean;
  uploadMessage: string | null;
  uploadError: string | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => Promise<void>;
  currentFileName: string | null;
};

const KnowledgeUploadForm: React.FC<Props> = ({
  uploading,
  uploadMessage,
  uploadError,
  onFileChange,
  onUpload,
  currentFileName,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onUpload();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    onFileChange(file);
  };

  const showSelected = Boolean(currentFileName);

  return (
    <Card>
      <section aria-label="Upload file to knowledge base">
        <header
          style={{
            marginBottom: "0.7rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Upload File
          </h2>
          <p
            style={{
              margin: "0.3rem 0 0",
              fontSize: "var(--dc-font-size-sm)",
              color: "var(--dc-text-muted)",
            }}
          >
            Upload PDFs, text, or markdown files to be indexed for RAG queries.
            Large docs are automatically chunked and embedded.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              borderRadius: "var(--dc-radius-md)",
              border: `1px dashed ${
                dragActive
                  ? "var(--dc-color-primary)"
                  : "var(--dc-border-subtle)"
              }`,
              backgroundColor: dragActive
                ? "var(--dc-color-primary-soft)"
                : "var(--dc-bg-subtle)",
              padding: "0.9rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              textAlign: "center",
              transition:
                "background-color 120ms ease, border-color 120ms ease",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: "1.4rem",
              }}
            >
              📄
            </span>
            <span
              style={{
                fontSize: "var(--dc-font-size-sm)",
                fontWeight: 500,
              }}
            >
              Drag & drop a file here
            </span>
            <span
              style={{
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              …or choose a file from your system.
            </span>
            <label
              htmlFor="knowledge-file-input"
              style={{
                marginTop: "0.35rem",
              }}
            >
              <input
                id="knowledge-file-input"
                type="file"
                onChange={handleFileInputChange}
              />
            </label>

            {showSelected && (
              <div
                style={{
                  marginTop: "0.45rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "999px",
                  backgroundColor: "var(--dc-bg-surface)",
                  border: "1px solid var(--dc-border-subtle)",
                  fontSize: "var(--dc-font-size-xs)",
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                Selected: <strong>{currentFileName}</strong>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="submit"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload & Index"}
            </Button>
            {uploadMessage && !uploadError && (
              <span
                style={{
                  fontSize: "var(--dc-font-size-xs)",
                  color: "var(--dc-color-success)",
                }}
              >
                {uploadMessage}
              </span>
            )}
          </div>
        </form>

        {uploadError && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--dc-color-danger)",
              fontSize: "var(--dc-font-size-sm)",
            }}
          >
            {uploadError}
          </p>
        )}
      </section>
    </Card>
  );
};

export default KnowledgeUploadForm;
