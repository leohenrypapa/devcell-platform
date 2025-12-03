// filename: frontend/src/pages/KnowledgePage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

interface KnowledgeSourceChunk {
  document_id: string;
  title: string;
  snippet: string;
  score: number;
}

interface KnowledgeQueryResponse {
  answer: string;
  sources: KnowledgeSourceChunk[];
}

interface KnowledgeDocument {
  id: string;
  title: string;
  path?: string | null;
  content_preview: string;
}

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const KnowledgePage: React.FC = () => {
  const { token } = useUser();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSourceChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // ---- Helpers ----------------------------------------------------

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch(`${backendBase}/api/knowledge/documents`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data: KnowledgeDocument[] = await res.json();
      setDocuments(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load knowledge documents:", err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    // Load list of indexed documents when page mounts
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
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
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) {
      setSaveMessage("Title and text are required.");
      return;
    }

    setSavingDoc(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`${backendBase}/api/knowledge/add_text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: newTitle,
          text: newText,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      setSaveMessage("Saved and indexed successfully.");
      setNewTitle("");
      setNewText("");
      await fetchDocuments();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Add doc error:", err);
      setSaveMessage("Failed to save document.");
    } finally {
      setSavingDoc(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setUploadMessage("Please choose a file first.");
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${backendBase}/api/knowledge/upload_file`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // DO NOT set Content-Type here; browser will set multipart boundary
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setUploadMessage(`Uploaded and indexed: ${data.filename}`);
      setFile(null);

      const input = document.getElementById(
        "knowledge-file-input",
      ) as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }

      await fetchDocuments();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload error:", err);
      setUploadMessage("Failed to upload or index file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: KnowledgeDocument) {
    const confirmed = window.confirm(
      `Delete document "${doc.title}"? This will remove its vectors and, if it's a file under Knowledgebase/, the file itself.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${backendBase}/api/knowledge/documents/${encodeURIComponent(doc.id)}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      await fetchDocuments();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Delete doc error:", err);
      // Lightweight UX: you could surface a toast here if you later add one
      // but we avoid alert-spam for now.
    }
  }

  // ---- Render -----------------------------------------------------

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      <h1>Knowledgebase</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Ask questions against your indexed documents, add free-text notes, or
        upload files (PDF, docs, etc.). This page is your mini unit knowledge
        graph.
      </p>

      {/* Ask section */}
      <section
        aria-label="Ask knowledge base"
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "1rem",
          marginTop: "1rem",
        }}
      >
        <h2>Ask the Knowledgebase</h2>
        <form onSubmit={handleAsk}>
          <label
            htmlFor="kb-question"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Question
          </label>
          <textarea
            id="kb-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical", padding: "0.5rem" }}
            placeholder="e.g., Summarize all standups for project X this week…"
          />
          <div style={{ marginTop: "0.5rem" }}>
            <button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Querying…" : "Ask"}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: "0.75rem", color: "red" }}>{error}</div>
        )}

        {answer && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            <h3>Answer</h3>
            <p>{answer}</p>
            {sources.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <h4>Sources</h4>
                <ul style={{ fontSize: "0.9rem" }}>
                  {sources.map((src) => (
                    <li key={src.document_id}>
                      <strong>{src.title}</strong> – {src.snippet} (
                      {src.score.toFixed(3)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Manual add section */}
      <section
        aria-label="Add free-text document"
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <h2>Add Free-Text Document</h2>
        <form onSubmit={handleAddDoc}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Title
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Text
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  resize: "vertical",
                  marginTop: "0.25rem",
                }}
              />
            </label>
          </div>
          <button type="submit" disabled={savingDoc}>
            {savingDoc ? "Saving…" : "Save & Index"}
          </button>
        </form>
        {saveMessage && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            {saveMessage}
          </div>
        )}
      </section>

      {/* Upload section */}
      <section
        aria-label="Upload file to knowledge base"
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <h2>Upload File</h2>
        <form onSubmit={handleUpload}>
          <input
            id="knowledge-file-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload & Index"}
            </button>
          </div>
        </form>
        {uploadMessage && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            {uploadMessage}
          </div>
        )}
      </section>

      {/* Document list */}
      <section
        aria-label="Indexed documents"
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "1rem",
          marginTop: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2>Indexed Documents</h2>
        {docsLoading ? (
          <p>Loading documents…</p>
        ) : documents.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            No documents indexed yet.
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {documents.map((doc) => (
              <li
                key={doc.id}
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <strong>{doc.title}</strong>
                  {doc.path && (
                    <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>
                      ({doc.path})
                    </span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.85rem",
                    opacity: 0.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {doc.content_preview}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc)}
                  style={{ marginTop: "0.25rem" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default KnowledgePage;
