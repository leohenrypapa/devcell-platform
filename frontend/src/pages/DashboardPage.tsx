// frontend/src/pages/DashboardPage.tsx
import React from "react";

import DashboardHeader from "../features/dashboard/DashboardHeader";
import DashboardSummaryCard from "../features/dashboard/DashboardSummaryCard";
import { useDashboardSummary } from "../features/dashboard/useDashboardSummary";
import DashboardSection from "../features/dashboard/DashboardSection";
import Card from "../ui/Card";
import DashboardActivityPanel from "../features/dashboard/DashboardActivityPanel";
import DashboardSitrepCard from "../features/dashboard/DashboardSitrepCard";

const DashboardPage: React.FC = () => {
  const { data, loading, error, useRag, setUseRag, refresh, lastUpdated } =
    useDashboardSummary();

  const handleToggleRag = (next: boolean) => {
    setUseRag(next);
    refresh(next);
  };

  const standupCount = data?.standup_count ?? 0;
  const projectCount = data?.project_count ?? 0;
  const kbDocsCount = data?.knowledge_docs ?? 0;

  const formattedLastUpdated =
    lastUpdated != null
      ? new Date(lastUpdated).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="dc-page">
      <div className="dc-page-inner">
        <DashboardHeader
          useRag={useRag}
          loading={loading}
          onToggleRag={handleToggleRag}
          onRefresh={() => refresh()}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {/* My Today / high-level snapshot */}
          <DashboardSection
            title="My Today"
            description="Quick view of unit activity and knowledge health. Detailed task, standup, and training panels are below."
          >
            <Card>
              {loading && (
                <p
                  style={{
                    fontSize: "var(--dc-font-size-sm)",
                    color: "var(--dc-text-muted)",
                  }}
                >
                  Loading today&apos;s overview…
                </p>
              )}

              {!loading && error && (
                <p
                  style={{
                    fontSize: "var(--dc-font-size-sm)",
                    color: "var(--dc-color-danger)",
                  }}
                >
                  {error}
                </p>
              )}

              {!loading && !error && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <TodayStat
                      label="Standup activity"
                      value={
                        standupCount > 0
                          ? `${standupCount} recent entries`
                          : "No recent standups"
                      }
                    />
                    <TodayStat
                      label="Projects in focus"
                      value={
                        projectCount > 0
                          ? `${projectCount} active projects`
                          : "No visible projects yet"
                      }
                    />
                    <TodayStat
                      label="Knowledgebase docs"
                      value={
                        kbDocsCount > 0
                          ? `${kbDocsCount} documents indexed`
                          : "KB is still empty"
                      }
                    />
                  </div>
                  {formattedLastUpdated && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--dc-font-size-xs)",
                        color: "var(--dc-text-muted)",
                      }}
                    >
                      Updated at {formattedLastUpdated}
                    </p>
                  )}
                </>
              )}
            </Card>
          </DashboardSection>

          {/* Main grid: summary + activity */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.4fr)",
              gap: "1rem",
            }}
          >
            <DashboardSection
              title="Operational summary"
              description="LLM-generated snapshot combining standups, tasks, projects, and knowledgebase context."
            >
              <DashboardSummaryCard
                data={data}
                loading={loading}
                error={error}
              />
            </DashboardSection>

            <DashboardSection
              title="Activity snapshot"
              description="Recent tasks, standups, projects, and training progress."
            >
              <DashboardActivityPanel data={data} loading={loading} />
            </DashboardSection>
          </div>

          {/* SITREP generator */}
          <DashboardSection
            title="SITREP"
            description="Generate a briefing-ready operational report suitable for leadership updates, IPRs, or daily rollups."
          >
            <DashboardSitrepCard useRag={useRag} />
          </DashboardSection>
        </div>
      </div>
    </div>
  );
};

type TodayStatProps = {
  label: string;
  value: string;
};

const TodayStat: React.FC<TodayStatProps> = ({ label, value }) => {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--dc-font-size-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--dc-text-muted)",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--dc-font-size-sm)",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default DashboardPage;
