// frontend/src/features/standups/StandupSummarySection.tsx
import React from "react";
import { useStandupSummary } from "./useStandupSummary";

type Props = {
  selectedDate: string | null;
};

const StandupSummarySection: React.FC<Props> = ({ selectedDate }) => {
  const {
    summary,
    summaryCount,
    loadingSummary,
    summaryError,
    generateSummary,
  } = useStandupSummary();

  const handleCopySummary = () => {
    if (!summary) return;

    const header = `Daily Standup Summary (${selectedDate ?? "All recent"})`;
    const text = `${header}\n\nEntries: ${summaryCount}\n\n${summary}`;
    void navigator.clipboard.writeText(text);
  };

  return (
    <section
      style={{
        marginTop: "1rem",
        border: "1px dashed #e5e7eb",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        fontSize: "0.9rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <strong>AI Summary</strong>
          <div
            style={{
              fontSize: "0.75rem",
              opacity: 0.75,
            }}
          >
            Generates a high-level summary of standups
            {selectedDate ? ` for ${selectedDate}` : ""}.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => generateSummary(selectedDate)}
            disabled={loadingSummary}
            style={{ fontSize: "0.8rem" }}
          >
            {loadingSummary ? "Generating..." : "Generate Summary"}
          </button>
          {summary && (
            <button
              type="button"
              onClick={handleCopySummary}
              style={{ fontSize: "0.8rem" }}
            >
              Copy Summary
            </button>
          )}
        </div>
      </header>

      {summaryError && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          {summaryError}
        </div>
      )}

      {summary && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            margin: 0,
            fontFamily: "inherit",
            fontSize: "0.85rem",
          }}
        >
          {summary}
        </pre>
      )}

      {!summary && !loadingSummary && !summaryError && (
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          No summary generated yet.
        </p>
      )}
    </section>
  );
};

export default StandupSummarySection;
