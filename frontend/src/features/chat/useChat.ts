// frontend/src/features/chat/useChat.ts
import { useRef, useState } from "react";
import { useUser } from "../../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type ChatSource = {
  document_id: string;
  filename: string;
  score: number;
  excerpt: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: number;
  role: ChatRole;
  content: string;
  modeUsed?: string;
  usedRag?: boolean;
  sources?: ChatSource[];
  timestamp?: string;
};

type ChatApiResponse = {
  reply: string;
  mode_used: string;
  used_rag: boolean;
  sources: ChatSource[];
};

export type UseChatResult = {
  prompt: string;
  setPrompt: (value: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  useRag: boolean;
  setUseRag: (value: boolean) => void;
  mode: string;
  setMode: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  canSubmit: boolean;
  sendMessage: () => Promise<void>;
  clearMessages: () => void;
};

export const useChat = (): UseChatResult => {
  const { token } = useUser();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [useRag, setUseRag] = useState<boolean>(false);
  const [mode, setMode] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const nextIdRef = useRef(1);

  const canSubmit = prompt.trim().length > 0 && !isLoading;

  const sendMessage = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessageId = nextIdRef.current++;
    const assistantMessageId = nextIdRef.current++;
    const nowIso = new Date().toISOString();

    // Add user message to conversation
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: trimmed,
        timestamp: nowIso,
      },
    ]);

    try {
      const body = {
        message: trimmed,
        use_rag: useRag,
        mode: mode || null,
        notes: notes.trim() || null,
      };

      const res = await fetch(`${backendBase}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: ChatApiResponse = await res.json();

      const assistantTimestamp = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: data.reply,
          modeUsed: data.mode_used,
          usedRag: data.used_rag,
          sources: data.sources || [],
          timestamp: assistantTimestamp,
        },
      ]);

      // Clear prompt, keep RAG/mode/notes so user can iterate
      setPrompt("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Chat error:", err);
      setError("Failed to get a response from the chat backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    prompt,
    setPrompt,
    messages,
    isLoading,
    error,
    useRag,
    setUseRag,
    mode,
    setMode,
    notes,
    setNotes,
    canSubmit,
    sendMessage,
    clearMessages,
  };
};
