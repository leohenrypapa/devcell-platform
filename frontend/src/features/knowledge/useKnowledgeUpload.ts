// frontend/src/features/knowledge/useKnowledgeUpload.ts
import { useState } from "react";
import { useUser } from "../../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseKnowledgeUploadResult = {
  file: File | null;
  setFile: (file: File | null) => void;
  uploading: boolean;
  uploadMessage: string | null;
  uploadError: string | null;
  upload: () => Promise<void>;
};

export const useKnowledgeUpload = (
  onUploaded?: () => void,
): UseKnowledgeUploadResult => {
  const { token } = useUser();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async () => {
    if (!file) {
      setUploadMessage("Please choose a file first.");
      setUploadError(null);
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${backendBase}/api/knowledge/upload_file`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // DON'T set Content-Type, browser will set multipart boundary
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

      if (onUploaded) onUploaded();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload error:", err);
      setUploadError("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return {
    file,
    setFile,
    uploading,
    uploadMessage,
    uploadError,
    upload,
  };
};
