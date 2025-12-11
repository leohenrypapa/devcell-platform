// frontend/src/features/knowledge/useKnowledgeAddText.ts
import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_BASE } from "../../lib/backend";

const backendBase = BACKEND_BASE;

export type UseKnowledgeAddTextResult = {
  newTitle: string;
  setNewTitle: (value: string) => void;
  newText: string;
  setNewText: (value: string) => void;
  saving: boolean;
  saveMessage: string | null;
  saveError: string | null;
  submit: () => Promise<void>;
};

export const useKnowledgeAddText = (
  onSaved?: () => void,
): UseKnowledgeAddTextResult => {
  const { token } = useUser();

  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const submit = async () => {
    if (!newTitle.trim() || !newText.trim()) {
      setSaveMessage("Title and text are required.");
      setSaveError(null);
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

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
      if (onSaved) onSaved();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Add doc error:", err);
      setSaveError("Failed to save text document.");
    } finally {
      setSaving(false);
    }
  };

  return {
    newTitle,
    setNewTitle,
    newText,
    setNewText,
    saving,
    saveMessage,
    saveError,
    submit,
  };
};
