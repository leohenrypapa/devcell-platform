// frontend/src/features/chat/ChatMessageBubble.tsx
import React, { useState } from "react";
import type { ChatMessage } from "./useChat";
import ChatSourcesList from "./ChatSourcesList";

type Props = {
  message: ChatMessage;
};

const ChatMessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const containerStyle: React.CSSProperties = {
    marginBottom: "0.75rem",
    display: "flex",
    justifyContent: isUser ? "flex-end" : "flex-start",
  };

  const bubbleBase: React.CSSProperties = {
    maxWidth: "80%",
    padding: "0.6rem 0.75rem",
    borderRadius: "16px",
    boxShadow: "var(--dc-shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.06))",
    whiteSpace: "pre-wrap",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  };

  const userBubbleStyle: React.CSSProperties = {
    ...bubbleBase,
    background: "var(--dc-chat-user-bg, #dbeafe)",
    border: "1px solid var(--dc-chat-user-border, #bfdbfe)",
  };

  const assistantBubbleStyle: React.CSSProperties = {
    ...bubbleBase,
    background: "var(--dc-surface-card, #ffffff)",
    border: "1px solid var(--dc-border-subtle, #d1d5db)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    opacity: 0.85,
  };

  const roleLabelStyle: React.CSSProperties = {
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  };

  const badgeBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.05rem 0.4rem",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: 500,
    border: "1px solid transparent",
  };

  const modeBadgeStyle: React.CSSProperties = {
    ...badgeBase,
    borderColor: "var(--dc-border-subtle, #d1d5db)",
    background: "var(--dc-surface-subtle, #f3f4f6)",
  };

  const ragBadgeStyle: React.CSSProperties = {
    ...badgeBase,
    borderColor: "var(--dc-accent-border, #22c55e)",
    background: "var(--dc-accent-soft, #dcfce7)",
    color: "var(--dc-accent-text, #166534)",
  };

  let formattedTime: string | null = null;
  if (message.timestamp) {
    try {
      formattedTime = new Date(message.timestamp).toLocaleTimeString(
        undefined,
        { hour: "2-digit", minute: "2-digit" },
      );
    } catch {
      formattedTime = null;
    }
  }

  const handleCopy = () => {
    if (!navigator.clipboard) {
      return;
    }

    void navigator.clipboard
      .writeText(message.content)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      })
      .catch(() => {
        // silently ignore copy failures
      });
  };

  const copyButtonStyle: React.CSSProperties = {
    padding: "0.05rem 0.4rem",
    borderRadius: "999px",
    border: "1px solid var(--dc-border-subtle, #d1d5db)",
    background: "var(--dc-surface-subtle, #f3f4f6)",
    fontSize: "0.7rem",
    cursor: "pointer",
  };

  const timeStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    opacity: 0.7,
  };

  return (
    <li style={containerStyle}>
      <div style={isUser ? userBubbleStyle : assistantBubbleStyle}>
        {/* Header: role + mode + RAG + time + copy */}
        <div style={headerStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span style={roleLabelStyle}>{isUser ? "You" : "Assistant"}</span>
            {!isUser && message.modeUsed && (
              <span style={modeBadgeStyle}>{message.modeUsed}</span>
            )}
            {!isUser && message.usedRag && (
              <span style={ragBadgeStyle}>RAG</span>
            )}
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            {formattedTime && <span style={timeStyle}>{formattedTime}</span>}
            {!isUser && (
              <button
                type="button"
                onClick={handleCopy}
                style={copyButtonStyle}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div>{message.content}</div>

        {/* Sources for assistant messages */}
        {!isUser && message.usedRag && message.sources && (
          <ChatSourcesList sources={message.sources} />
        )}
      </div>
    </li>
  );
};

export default ChatMessageBubble;
