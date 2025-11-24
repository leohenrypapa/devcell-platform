import React, { useState } from "react";

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setReply(null);

    const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

    try {
      const res = await fetch(`${backendBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      console.error(err);
      setReply("Error contacting backend. Check if FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Unit Chat (LLM)</h1>
      <p>Ask questions about your unit, workflows, or code.</p>

      <textarea
        rows={4}
        style={{ width: "100%", margin: "0.5rem 0" }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your question here..."
      />

      <button onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>

      {reply && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
          }}
        >
          {reply}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
