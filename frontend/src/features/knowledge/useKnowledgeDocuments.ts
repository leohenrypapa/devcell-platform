// frontend/src/features/knowledge/useKnowledgeDocuments.ts
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";

export interface KnowledgeDocument {
  id: string;
  title: string;
  path?: string | null;
  content_preview: string;
}

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseKnowledgeDocumentsResult = {
  documents: KnowledgeDocument[];
  docsLoading: boolean;
  docsError: string | null;
  reloadDocuments: () => void;
  deleteDocument: (doc: KnowledgeDocument) => Promise<void>;
};

export const useKnowledgeDocuments = (): UseKnowledgeDocumentsResult => {
  const { token } = useUser();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setDocsLoading(true);
    setDocsError(null);

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
      setDocsError("Failed to load indexed documents.");
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    // load on mount / token change
    void fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const reloadDocuments = () => {
    void fetchDocuments();
  };

  const deleteDocument = async (doc: KnowledgeDocument) => {
    try {
      const res = await fetch(`${backendBase}/api/knowledge/delete_document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: doc.title,
          path: doc.path ?? null,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      await fetchDocuments();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Delete doc error:", err);
      setDocsError("Failed to delete document.");
    }
  };

  return {
    documents,
    docsLoading,
    docsError,
    reloadDocuments,
    deleteDocument,
  };
};
