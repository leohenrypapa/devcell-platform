// frontend/src/features/chat/ChatMessageList.tsx
import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "./useChat";
import ChatMessageBubble from "./ChatMessageBubble";

type Props = {
  messages: ChatMessage[];
};

const ChatMessageList: React.FC<Props> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const hasMessages = messages.length > 0;

  if (!hasMessages) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--dc-radius-md, 8px)",
          padding: "1rem",
          overflowY: "auto",
          background:
            "var(--dc-surface-subtle, linear-gradient(to bottom, #f9fafb, #f3f4f6))",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 520, opacity: 0.85 }}>
          <div
            style={{
              fontWeight: 600,
              marginBottom: "0.35rem",
              fontSize: "0.95rem",
            }}
          >
            No messages yet
          </div>
          <p style={{ margin: 0 }}>
            Start by describing a problem, asking for a code review, or drafting
            a SITREP. Enable{" "}
            <strong>Knowledgebase (RAG)</strong> below to ground answers in your
            internal documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: "var(--dc-radius-md, 8px)",
        padding: "0.5rem 0.35rem",
        overflowY: "auto",
        background: "var(--dc-surface-subtle, #f9fafb)",
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
      </ul>
      <div ref={bottomRef} />
    </main>
  );
};

export default ChatMessageList;
