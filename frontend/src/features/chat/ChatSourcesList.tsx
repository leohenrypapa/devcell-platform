// frontend/src/features/chat/ChatSourcesList.tsx
import React from "react";
import type { ChatSource } from "./useChat";

type Props = {
  sources: ChatSource[];
};

const ChatSourcesList: React.FC<Props> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
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
        {sources.map((src) => (
          <li key={src.document_id} style={{ marginBottom: "0.35rem" }}>
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
  );
};

export default ChatSourcesList;
