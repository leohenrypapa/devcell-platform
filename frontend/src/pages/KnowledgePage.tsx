import React, { useState, useEffect } from "react";
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

  const backendBase =
    (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

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
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data: KnowledgeDocument[] = await res.json();
      setDocuments(data);
    } catch (err) {
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
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: KnowledgeQueryResponse = await res.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err: any) {
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
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setSaveMessage("Saved and indexed successfully.");
      setNewTitle("");
      setNewText("");
      await fetchDocuments();
    } catch (err: any) {
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
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setUploadMessage(`Uploaded and indexed: ${data.filename}`);
      setFile(null);
      // clear input element
      const input = document.getElementById(
        "knowledge-file-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";

      await fetchDocuments();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadMessage("Failed to upload or index file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: KnowledgeDocument) {
    const confirmed = window.confirm(
      `Delete document "${doc.title}"? This will remove its vectors and, if it's a file under Knowledgebase/, the file itself.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${backendBase}/api/knowledge/delete_document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: doc.title,
            path: doc.path ?? null,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document.");
    }
  }

  // ---- Render -----------------------------------------------------

  return (
    <div style={{ padding: "1.5rem", display: "flex", gap: "1.5rem" }}>
      {/* Left: Add document, upload, and list docs */}
      <div style={{ flex: 1, minWidth: "320px" }}>
        <h2>Knowledgebase – Add Note</h2>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          Add small notes or internal docs directly into the knowledgebase.
          Larger docs (PDF/TXT/MD) can also be uploaded below or placed in the{" "}
          <code>Knowledgebase/</code> folder on the server.
        </p>
        <form
          onSubmit={handleAddDoc}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Text content..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={6}
            style={{
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontFamily: "monospace",
            }}
          />
          <button
            type="submit"
            disabled={savingDoc}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 4,
              border: "none",
              backgroundColor: savingDoc ? "#999" : "#2563eb",
              color: "white",
              cursor: savingDoc ? "default" : "pointer",
            }}
          >
            {savingDoc ? "Saving..." : "Save Note"}
          </button>
          {saveMessage && (
            <p style={{ fontSize: "0.85rem", color: "#444" }}>{saveMessage}</p>
          )}
        </form>

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Upload Document (PDF / TXT / MD)</h3>
        <form
          onSubmit={handleUpload}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <input
            id="knowledge-file-input"
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
            }}
          />
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 4,
              border: "none",
              backgroundColor: uploading ? "#999" : "#4b5563",
              color: "white",
              cursor: uploading ? "default" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Upload & Index"}
          </button>
          {uploadMessage && (
            <p style={{ fontSize: "0.85rem", color: "#444" }}>
              {uploadMessage}
            </p>
          )}
        </form>

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Indexed Documents</h3>
        {docsLoading && (
          <p style={{ fontSize: "0.85rem", color: "#666" }}>Loading…</p>
        )}
        {!docsLoading && documents.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            No documents indexed yet.
          </p>
        )}
        {documents.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
            {documents.map((doc) => (
              <li
                key={doc.id}
                style={{
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  border: "1px solid #eee",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong>{doc.title}</strong>
                    {doc.path && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#777",
                          wordBreak: "break-all",
                        }}
                      >
                        {doc.path}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: "#b91c1c",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      height: "fit-content",
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#444",
                    marginTop: "0.25rem",
                    maxHeight: "4.5rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {doc.content_preview}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: Ask question */}
      <div style={{ flex: 1.5, minWidth: "360px" }}>
        <h2>Ask the Knowledgebase</h2>
        <form
          onSubmit={handleAsk}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <textarea
            placeholder="Ask a question about our docs, SOPs, or notes..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            style={{
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 4,
              border: "none",
              backgroundColor: loading ? "#999" : "#16a34a",
              color: "white",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Searching..." : "Search & Answer"}
          </button>
        </form>

        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}

        {answer && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: 6,
              border: "1px solid #ddd",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3>Answer</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
          </div>
        )}

        {sources.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Sources</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {sources.map((s, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: 4,
                    border: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <strong>{s.title}</strong>
                    <span
                      style={{ fontSize: "0.8rem", color: "#777" }}
                    >
                      score: {s.score.toFixed(3)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#444",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {s.snippet}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgePage;
