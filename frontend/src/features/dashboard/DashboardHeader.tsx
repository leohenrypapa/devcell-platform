// frontend/src/features/dashboard/DashboardHeader.tsx
import React from "react";

import PageHeader from "../../ui/PageHeader";
import Button from "../../ui/Button";

type Props = {
  useRag: boolean;
  loading: boolean;
  onToggleRag: (value: boolean) => void;
  onRefresh: () => void;
};

const DashboardHeader: React.FC<Props> = ({
  useRag,
  loading,
  onToggleRag,
  onRefresh,
}) => {
  return (
    <PageHeader
      title="Unit Dashboard"
      description="One place to see standups, projects, knowledge base and training activity."
      actions={
        <>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.85rem",
            }}
          >
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => onToggleRag(e.target.checked)}
            />
            <span>Use LLM + RAG</span>
          </label>
          <Button
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh dashboard summary"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </>
      }
    />
  );
};

export default DashboardHeader;
