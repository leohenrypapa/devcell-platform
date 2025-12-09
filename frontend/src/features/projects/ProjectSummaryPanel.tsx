// frontend/src/features/projects/ProjectSummaryPanel.tsx
import React from "react";
import type { ProjectSummaryResponse } from "./useProjectSummary";

type Props = {
  summaryData: ProjectSummaryResponse | null;
  summaryLoading: boolean;
  summaryError: string | null;
};

const ProjectSummaryPanel: React.FC<Props> = ({
  summaryData,
  summaryLoading,
  summaryError,
}) => {
  return (
    <section
      style={{
        marginTop: "2rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "1rem",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "0.5rem",
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        Project Summary
      </h2>

      {summaryLoading && <p>Loading summary...</p>}

      {summaryError && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          {summaryError}
        </p>
      )}

      {summaryData && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "0.25rem",
              fontSize: "0.95rem",
            }}
          >
            {summaryData.project_name}
          </h3>
          <p
            style={{
              marginTop: 0,
              marginBottom: "0.5rem",
              fontSize: "0.8rem",
              opacity: 0.75,
            }}
          >
            Based on {summaryData.count} recent standups/tasks.
          </p>
          <div
            style={{
              fontSize: "0.9rem",
            }}
          >
            {summaryData.summary}
          </div>
        </div>
      )}

      {!summaryLoading && !summaryError && !summaryData && (
        <p
          style={{
            marginTop: "0.25rem",
            fontSize: "0.85rem",
            opacity: 0.8,
          }}
        >
          Click <strong>Summarize</strong> on a project to generate an AI
          summary here.
        </p>
      )}
    </section>
  );
};

export default ProjectSummaryPanel;
