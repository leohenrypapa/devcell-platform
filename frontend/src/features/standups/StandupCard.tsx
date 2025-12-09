// frontend/src/features/standups/StandupCard.tsx
import React from "react";
import type { StandupEntry } from "../../lib/standups";
import type { Task } from "../../lib/tasks";

type Props = {
  entry: StandupEntry;
  isMine: boolean;
  isFocused: boolean;

  linkedTasks: Task[] | undefined;
  loadingLinkedTasks: boolean;
  onLoadLinkedTasks: () => void;

  onEdit: () => void;
  onDelete: () => void;
  onConvertToTasks: () => void;
};

const StandupCard: React.FC<Props> = ({
  entry,
  isMine,
  isFocused,
  linkedTasks,
  loadingLinkedTasks,
  onLoadLinkedTasks,
  onEdit,
  onDelete,
  onConvertToTasks,
}) => {
  const createdAt = new Date(entry.created_at).toLocaleString();

  return (
    <li
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: isFocused ? "#eef2ff" : "white",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.25rem",
        }}
      >
        <div>
          <strong>{entry.name}</strong>
          {entry.project_name && (
            <span style={{ marginLeft: "0.4rem", opacity: 0.75 }}>
              [{entry.project_name}]
            </span>
          )}
          {isMine && (
            <span
              style={{
                marginLeft: "0.4rem",
                fontSize: "0.75rem",
                padding: "0.05rem 0.4rem",
                borderRadius: "999px",
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              mine
            </span>
          )}
        </div>
        <small style={{ opacity: 0.75 }}>{createdAt}</small>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.5rem",
          fontSize: "0.85rem",
        }}
      >
        <StandupSection label="Yesterday" text={entry.yesterday} />
        <StandupSection label="Today" text={entry.today} />
        <StandupSection label="Blockers" text={entry.blockers} />
      </section>

      <footer
        style={{
          marginTop: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem" }}>
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
          <button type="button" onClick={onConvertToTasks}>
            Convert to Tasks
          </button>
        </div>

        <div style={{ fontSize: "0.8rem" }}>
          <button type="button" onClick={onLoadLinkedTasks}>
            {loadingLinkedTasks ? "Loading tasks..." : "Show tasks from this"}
          </button>
        </div>
      </footer>

      {linkedTasks && linkedTasks.length > 0 && (
        <div
          style={{
            marginTop: "0.5rem",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "0.5rem",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ marginBottom: "0.25rem", fontWeight: 500 }}>
            Tasks from this standup:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1rem" }}>
            {linkedTasks.map((t) => (
              <li key={t.id}>
                [{t.status}] {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const StandupSection: React.FC<{ label: string; text: string }> = ({
  label,
  text,
}) => {
  return (
    <div>
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          opacity: 0.65,
          marginBottom: "0.2rem",
        }}
      >
        {label}
      </div>
      <div>{text || <span style={{ opacity: 0.5 }}>(none)</span>}</div>
    </div>
  );
};

export default StandupCard;
