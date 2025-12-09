// frontend/src/features/dashboard/DashboardActivityPanel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import type { DashboardSummary } from "./useDashboardSummary";

type Props = {
  data: DashboardSummary | null;
  loading: boolean;
};

const DashboardActivityPanel: React.FC<Props> = ({ data, loading }) => {
  const navigate = useNavigate();

  const tasks = data?.tasks_recent ?? [];
  const standups = data?.standups_recent ?? [];
  const projects = data?.projects_overview ?? [];
  const training = data?.training_status ?? null;

  const hasAnyData =
    tasks.length > 0 || standups.length > 0 || projects.length > 0 || training;

  if (loading && !data) {
    return (
      <Card>
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-text-muted)",
          }}
        >
          Loading recent activity…
        </p>
      </Card>
    );
  }

  if (!hasAnyData && !loading) {
    return (
      <Card
        style={{
          borderStyle: "dashed",
          borderColor: "var(--dc-border-subtle)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-text-muted)",
            lineHeight: 1.5,
          }}
        >
          No recent activity data available yet. As you start using tasks,
          standups, projects, and training, this panel will surface a concise
          snapshot here.
        </p>
      </Card>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "0.75rem",
      }}
    >
      <Card>
        <SectionHeader
          title="Recent tasks"
          actionLabel="View tasks"
          onAction={() => navigate("/tasks")}
        />
        {tasks.length === 0 ? (
          <EmptyHint text="No recent tasks yet." />
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            {tasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--dc-font-size-sm)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {task.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "var(--dc-font-size-xs)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    <StatusPill label={task.status} />
                    {task.project_name && (
                      <span
                        style={{
                          maxWidth: "10rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.project_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span
                        style={{
                          marginLeft: "auto",
                        }}
                      >
                        Due {formatShortDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Recent standups"
          actionLabel="Open standups"
          onAction={() => navigate("/standup")}
        />
        {standups.length === 0 ? (
          <EmptyHint text="No recent standups yet." />
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            {standups.slice(0, 5).map((s) => (
              <li key={s.id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--dc-font-size-sm)",
                      fontWeight: 500,
                    }}
                  >
                    {s.author}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--dc-font-size-xs)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    {formatShortDateTime(s.created_at)}
                  </div>
                  <div
                    style={{
                      marginTop: "0.1rem",
                      fontSize: "var(--dc-font-size-sm)",
                      color: "var(--dc-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.today}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Projects overview"
          actionLabel="View projects"
          onAction={() => navigate("/projects")}
        />
        {projects.length === 0 ? (
          <EmptyHint text="No active projects yet." />
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            {projects.slice(0, 4).map((p) => (
              <li key={p.id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.15rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--dc-font-size-sm)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "var(--dc-font-size-xs)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    <StatusPill label={p.status} />
                    <span>{p.active_tasks} active tasks</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Training"
          actionLabel="Open training"
          onAction={() => navigate("/training")}
        />
        {!training ? (
          <EmptyHint text="Training pipeline not initialized yet." />
        ) : (
          <TrainingProgress training={training} />
        )}
      </Card>
    </div>
  );
};

type SectionHeaderProps = {
  title: string;
  actionLabel: string;
  onAction: () => void;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        marginBottom: "0.4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "var(--dc-font-size-sm)",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <Button
        variant="ghost"
        onClick={onAction}
        style={{
          paddingInline: "0.5rem",
          fontSize: "var(--dc-font-size-xs)",
        }}
      >
        {actionLabel}
      </Button>
    </div>
  );
};

type EmptyHintProps = {
  text: string;
};

const EmptyHint: React.FC<EmptyHintProps> = ({ text }) => {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "var(--dc-font-size-sm)",
        color: "var(--dc-text-muted)",
      }}
    >
      {text}
    </p>
  );
};

type StatusPillProps = {
  label: string;
};

const StatusPill: React.FC<StatusPillProps> = ({ label }) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.1rem 0.5rem",
        borderRadius: "999px",
        fontSize: "var(--dc-font-size-xs)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        backgroundColor: "var(--dc-bg-subtle)",
        color: "var(--dc-text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

type TrainingProgressProps = {
  training: NonNullable<DashboardSummary["training_status"]>;
};

const TrainingProgress: React.FC<TrainingProgressProps> = ({ training }) => {
  const completed = training.completed_steps;
  const total = training.total_steps || 1;
  const percent = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        fontSize: "var(--dc-font-size-sm)",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "0.1rem",
          }}
        >
          {training.current_module ?? "Current module not set"}
        </div>
        <div
          style={{
            fontSize: "var(--dc-font-size-xs)",
            color: "var(--dc-text-muted)",
          }}
        >
          {completed} / {total} steps completed
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "0.45rem",
          borderRadius: "999px",
          backgroundColor: "var(--dc-bg-subtle)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: "999px",
            backgroundColor: "var(--dc-color-primary)",
            transition: "width 160ms ease-out",
          }}
        />
      </div>
    </div>
  );
};

const formatShortDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const formatShortDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default DashboardActivityPanel;
