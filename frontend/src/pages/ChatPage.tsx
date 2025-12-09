// filename: frontend/src/pages/ChatPage.tsx
import React from "react";
import { useUser } from "../context/UserContext";

import { useChat } from "../features/chat/useChat";
import ChatMessageList from "../features/chat/ChatMessageList";
import ChatInputSection from "../features/chat/ChatInputSection";

const ChatPage: React.FC = () => {
  const { isAuthenticated } = useUser();
  const {
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
  } = useChat();

  const hasMessages = messages.length > 0;

  return (
    <div className="dc-page">
      <div
        className="dc-page-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          height: "calc(100vh - 80px)",
          padding: "1.25rem 1rem",
        }}
      >
        {/* Page header */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.4rem",
              }}
            >
              DevCell LLM Chat
            </h1>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.9rem",
                opacity: 0.85,
                maxWidth: 640,
              }}
            >
              Internal chat with your local DevCell LLM. No server-side history
              — the conversation is kept only in your browser. Optionally enable
              Knowledgebase (RAG) to ground answers in your internal docs.
            </p>

            {!isAuthenticated && (
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.85rem",
                  color: "var(--dc-danger-text, #b00020)",
                }}
              >
                You are not signed in. Sign in so your actions are associated
                with your user account.
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.25rem",
              fontSize: "0.8rem",
            }}
          >
            <button
              type="button"
              onClick={clearMessages}
              disabled={!hasMessages}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid var(--dc-border-subtle, #d0d7de)",
                background:
                  hasMessages
                    ? "var(--dc-surface-subtle, #f6f8fa)"
                    : "var(--dc-surface-muted, #f3f4f6)",
                cursor: hasMessages ? "pointer" : "not-allowed",
                fontSize: "0.8rem",
              }}
            >
              Clear conversation
            </button>
            <span
              style={{
                opacity: 0.7,
              }}
            >
              Local-only · No external APIs
            </span>
          </div>
        </header>

        {/* Main content area: chat + side info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)",
            gap: "1rem",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Conversation column */}
          <section
            aria-label="Chat conversation"
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              border: "1px solid var(--dc-border-subtle, #d0d7de)",
              borderRadius: "var(--dc-radius-lg, 10px)",
              background: "var(--dc-surface-card, #ffffff)",
              boxShadow: "var(--dc-shadow-sm, 0 1px 2px rgba(0,0,0,0.03))",
              padding: "0.75rem",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ChatMessageList messages={messages} />
            </div>

            <div
              style={{
                marginTop: "0.5rem",
              }}
            >
              <ChatInputSection
                prompt={prompt}
                setPrompt={setPrompt}
                isLoading={isLoading}
                canSubmit={canSubmit}
                error={error}
                useRag={useRag}
                setUseRag={setUseRag}
                mode={mode}
                setMode={setMode}
                notes={notes}
                setNotes={setNotes}
                onSend={sendMessage}
              />
            </div>
          </section>

          {/* Side panel: modes, RAG, tips */}
          <aside
            aria-label="Chat context and tips"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              minHeight: 0,
            }}
          >
            <section
              style={{
                border: "1px solid var(--dc-border-subtle, #d0d7de)",
                borderRadius: "var(--dc-radius-lg, 10px)",
                background: "var(--dc-surface-subtle, #f9fafb)",
                padding: "0.75rem 0.9rem",
                fontSize: "0.85rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: "0.35rem",
                  fontSize: "0.95rem",
                }}
              >
                Modes &amp; Knowledgebase
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.15rem",
                  lineHeight: 1.4,
                }}
              >
                <li>
                  <strong>Mode</strong>: pick <em>assistant</em>,{" "}
                  <em>developer</em>, <em>analyst</em>, or{" "}
                  <em>docs</em> for more targeted behavior. Leave empty for
                  auto.
                </li>
                <li>
                  <strong>Use Knowledgebase (RAG)</strong>: grounds answers in
                  your uploaded documents.
                </li>
                <li>
                  <strong>Extra instructions</strong>: add style or constraints
                  like “bullet points only”, “reference task IDs”, etc.
                </li>
              </ul>
            </section>

            <section
              style={{
                border: "1px solid var(--dc-border-subtle, #d0d7de)",
                borderRadius: "var(--dc-radius-lg, 10px)",
                background: "var(--dc-surface-card, #ffffff)",
                padding: "0.75rem 0.9rem",
                fontSize: "0.85rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: "0.35rem",
                  fontSize: "0.95rem",
                }}
              >
                Suggested prompts
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.15rem",
                  lineHeight: 1.4,
                }}
              >
                <li>
                  “Summarize my last standups into a SITREP-style brief.”
                </li>
                <li>
                  “Review this function for security issues and suggest fixes.”
                </li>
                <li>
                  “From the knowledgebase, list docs relevant to &lt;project&gt;.”
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
