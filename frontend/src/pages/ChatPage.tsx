// filename: frontend/src/pages/ChatPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

type ChatSource = {
  document_id: string;
  filename: string;
  score: number;
  excerpt: string;
};

type ChatApiResponse = {
  reply: string;
  mode_used: string;
  used_rag: boolean;
  sources: ChatSource[];
};

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: number;
  role: ChatRole;
  content: string;
  modeUsed?: string;
  usedRag?: boolean;
  sources?: ChatSource[];
};

const ChatPage: React.FC = () => {
  const { token } = useUser();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [useRag, setUseRag] = useState<boolean>(false);
  const [mode, setMode] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const nextIdRef = useRef(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = prompt.trim().length > 0 && !isLoading;

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessageId = nextIdRef.current++;
    const assistantMessageId = nextIdRef.current++;

    // Add user message to conversation
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: trimmed,
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

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: data.reply,
          modeUsed: data.mode_used,
          usedRag: data.used_rag,
          sources: data.sources || [],
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

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setPrompt(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        void handleSubmit(event as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
      }}
    >
      <header style={{ marginBottom: "0.5rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>DevCell LLM Chat</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          Internal chat with your local DevCell LLM. No server-side history — the
          conversation you see here is kept only in your browser. You can
          optionally enable Knowledgebase (RAG) context.
        </p>
      </header>

      {/* Conversation area */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "0.75rem",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
            No messages yet. Ask your first question below.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              paddingLeft: 0,
              margin: 0,
            }}
          >
            {messages.map((msg) => (
              <li
                key={msg.id}
                style={{
                  marginBottom: "0.75rem",
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    backgroundColor:
                      msg.role === "user" ? "#d8e9ff" : "#ffffff",
                    border:
                      msg.role === "user"
                        ? "1px solid #a7c7ff"
                        : "1px solid #ddd",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.9rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                      opacity: 0.8,
                    }}
                  >
                    {msg.role === "user" ? "You" : "Assistant"}
                    {msg.role === "assistant" && msg.modeUsed && (
                      <>
                        {" "}
                        · <span>{msg.modeUsed}</span>
                        {msg.usedRag && (
                          <span style={{ marginLeft: "0.25rem" }}>· RAG</span>
                        )}
                      </>
                    )}
                  </div>
                  <div>{msg.content}</div>

                  {msg.role === "assistant" &&
                    msg.usedRag &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          borderTop: "1px solid #eee",
                          paddingTop: "0.35rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Sources
                        </div>
                        <ul
                          style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            margin: 0,
                            fontSize: "0.8rem",
                          }}
                        >
                          {msg.sources.map((src) => (
                            <li
                              key={src.document_id}
                              style={{ marginBottom: "0.35rem" }}
                            >
                              <strong>{src.filename}</strong>{" "}
                              <span style={{ opacity: 0.7 }}>
                                (score {src.score.toFixed(3)})
                              </span>
                              <div
                                style={{
                                  marginTop: "0.15rem",
                                  opacity: 0.85,
                                }}
                              >
                                {src.excerpt}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        aria-busy={isLoading}
        style={{
          marginTop: "0.75rem",
          borderTop: "1px solid #ddd",
          paddingTop: "0.75rem",
        }}
      >
        <label
          htmlFor="chat-prompt"
          style={{ display: "block", marginBottom: "0.25rem" }}
        >
          Prompt
        </label>
        <textarea
          id="chat-prompt"
          value={prompt}
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "0.5rem",
            fontFamily: "inherit",
          }}
          placeholder="Ask your DevCell model anything… (Enter to send, Shift+Enter for new line)"
        />

        {/* Controls row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "0.5rem",
            alignItems: "center",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
            />
            <span style={{ fontSize: "0.85rem" }}>
              Use Knowledgebase (RAG)
            </span>
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Mode:&nbsp;
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            >
              <option value="">Auto</option>
              <option value="assistant">Assistant</option>
              <option value="developer">Developer</option>
              <option value="analyst">Analyst</option>
              <option value="docs">Docs</option>
            </select>
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginTop: "0.5rem" }}>
          <label
            htmlFor="chat-notes"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Extra instructions (optional)
          </label>
          <input
            id="chat-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Focus on FastAPI, be concise, bullet points only…"
            style={{
              width: "100%",
              padding: "0.4rem",
              fontSize: "0.85rem",
            }}
          />
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <button type="submit" disabled={!canSubmit}>
            {isLoading ? "Sending…" : "Send"}
          </button>
          <span
            style={{
              marginLeft: "0.75rem",
              fontSize: "0.8rem",
              opacity: 0.7,
            }}
          >
            Tip: include project name, mission context, and expected format.
          </span>
        </div>

        {error && (
          <div
            style={{
              marginTop: "0.5rem",
              color: "red",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatPage;
