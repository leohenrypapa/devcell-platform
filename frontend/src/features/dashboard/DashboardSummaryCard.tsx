// frontend/src/features/dashboard/DashboardSummaryCard.tsx
import React from "react";

import Card from "../../ui/Card";
import type { DashboardSummary } from "./useDashboardSummary";
import DashboardMarkdown from "./DashboardMarkdown";

type Props = {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
};

const DashboardSummaryCard: React.FC<Props> = ({ data, loading, error }) => {
  const summary = data?.summary ?? "";

  return (
    <Card>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              marginBottom: "0.5rem",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Summary
          </h2>

          {loading && (
            <p
              style={{
                fontSize: "0.9rem",
                opacity: 0.75,
              }}
            >
              Generating summary…
            </p>
          )}

          {error && !loading && (
            <p
              style={{
                fontSize: "0.9rem",
                color: "#dc2626",
              }}
            >
              {error}
            </p>
          )}

          {!loading && !error && summary && (
            <div
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              <DashboardMarkdown markdown={summary} />
            </div>
          )}

          {!loading && !error && !summary && (
            <p
              style={{
                fontSize: "0.9rem",
                opacity: 0.75,
              }}
            >
              No summary available yet.
            </p>
          )}
        </div>

        <div
          aria-label="Key counts"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            alignContent: "flex-start",
          }}
        >
          <CountTile label="Standups" value={data?.standup_count ?? 0} />
          <CountTile label="Projects" value={data?.project_count ?? 0} />
          <CountTile label="Knowledge docs" value={data?.knowledge_docs ?? 0} />
        </div>
      </div>
    </Card>
  );
};

type CountTileProps = {
  label: string;
  value: number;
};

const CountTile: React.FC<CountTileProps> = ({ label, value }) => {
  return (
    <div
      style={{
        borderRadius: "0.5rem",
        padding: "0.6rem 0.75rem",
        border: "1px dashed rgba(148, 163, 184, 0.6)",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "0.25rem",
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default DashboardSummaryCard;
