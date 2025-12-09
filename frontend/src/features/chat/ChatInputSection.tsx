// frontend/src/features/chat/ChatInputSection.tsx
import React, { useState } from "react";

type Props = {
  prompt: string;
  setPrompt: (value: string) => void;
  isLoading: boolean;
  canSubmit: boolean;
  error: string | null;
  useRag: boolean;
  setUseRag: (value: boolean) => void;
  mode: string;
  setMode: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onSend: () => Promise<void>;
};

const ChatInputSection: React.FC<Props> = ({
  prompt,
  setPrompt,
  isLoading,
  canSubmit,
  error,
  useRag,
  setUseRag,
  mode,
  setMode,
  notes,
  setNotes,
  onSend,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    void onSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        void onSend();
      }
    }
  };

  const disabled = !canSubmit;

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      style={{
        borderTop: "1px solid var(--dc-border-subtle, #e5e7eb)",
        paddingTop: "0.6rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      {/* Primary input bar */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "0.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            htmlFor="chat-prompt"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.8rem",
              opacity: 0.8,
            }}
          >
            Prompt
          </label>
          <div
            style={{
              borderRadius: "999px",
              border: "1px solid var(--dc-border-subtle, #d1d5db)",
              background: "var(--dc-surface-subtle, #f9fafb)",
              padding: "0.35rem 0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <textarea
              id="chat-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask a question, request a review, or draft a SITREP…"
              style={{
                flex: 1,
                minHeight: "2.1rem",
                maxHeight: "6rem",
                resize: "none",
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.9rem",
                padding: 0,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            alignItems: "flex-end",
            minWidth: "5.5rem",
          }}
        >
          <button
            type="submit"
            disabled={disabled}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              background: disabled
                ? "var(--dc-surface-muted, #e5e7eb)"
                : "var(--dc-primary, #2563eb)",
              color: disabled ? "var(--dc-text-muted, #6b7280)" : "#ffffff",
              transition: "background 120ms ease-out, transform 80ms ease-out",
            }}
          >
            {isLoading ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "0.75rem",
              opacity: 0.8,
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: showAdvanced ? "solid" : "dotted",
            }}
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          opacity: 0.75,
          flexWrap: "wrap",
          gap: "0.25rem",
        }}
      >
        <span>
          Press <strong>Enter</strong> to send,&nbsp;
          <strong>Shift+Enter</strong> for a newline.
        </span>
        {isLoading && <span>Thinking with local LLM…</span>}
      </div>

      {/* Advanced options: RAG, mode, extra notes */}
      {showAdvanced && (
        <div
          style={{
            marginTop: "0.25rem",
            borderRadius: "var(--dc-radius-md, 8px)",
            border: "1px dashed var(--dc-border-subtle, #d1d5db)",
            background: "var(--dc-surface-subtle, #f9fafb)",
            padding: "0.55rem 0.6rem 0.6rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
              />
              <span>
                <strong>Use Knowledgebase (RAG)</strong>
              </span>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Mode:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.4rem",
                  borderRadius: "999px",
                  border: "1px solid var(--dc-border-subtle, #d1d5db)",
                  background: "var(--dc-surface-card, #ffffff)",
                }}
              >
                <option value="">Auto</option>
                <option value="assistant">Assistant</option>
                <option value="developer">Developer</option>
                <option value="analyst">Analyst</option>
                <option value="docs">Docs</option>
              </select>
            </label>
          </div>

          <div>
            <label
              htmlFor="chat-notes"
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.8rem",
                opacity: 0.85,
              }}
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
                padding: "0.4rem 0.5rem",
                fontSize: "0.85rem",
                borderRadius: "var(--dc-radius-md, 6px)",
                border: "1px solid var(--dc-border-subtle, #d1d5db)",
                background: "var(--dc-surface-card, #ffffff)",
              }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            marginTop: "0.25rem",
            color: "var(--dc-danger-text, #b00020)",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
};

export default ChatInputSection;
