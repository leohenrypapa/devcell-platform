// filename: frontend/src/pages/ChatPage.tsx
import React, { useState } from "react";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

type ChatResponse = {
  reply: string;
};

const ChatPage = () => {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = prompt.trim().length > 0 && !isLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch(`${backendBase}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      setReply(data.reply);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Chat error:", err);
      setError("Failed to get a response from the chat backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      <h1>DevCell LLM Chat</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
        Use this page as a scratchpad to ask your DevCell LLM questions about
        code, tasks, or standups. This is a single-turn chat endpoint – no
        memory of previous questions yet.
      </p>

      <form onSubmit={handleSubmit} aria-busy={isLoading}>
        <label
          htmlFor="chat-prompt"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Prompt
        </label>
        <textarea
          id="chat-prompt"
          value={prompt}
          onChange={handlePromptChange}
          rows={5}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "0.5rem",
            fontFamily: "inherit",
          }}
          placeholder="Ask your DevCell model anything…"
        />

        <div style={{ marginTop: "0.5rem" }}>
          <button type="submit" disabled={!canSubmit}>
            {isLoading ? "Sending…" : "Send to LLM"}
          </button>
          <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", opacity: 0.7 }}>
            Tip: refine prompts with mission, unit context, and desired format.
          </span>
        </div>
      </form>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            color: "red",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {reply && (
        <section
          aria-label="LLM reply"
          style={{
            marginTop: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "1rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Response</h2>
          <p>{reply}</p>
        </section>
      )}
    </div>
  );
};

export default ChatPage;
