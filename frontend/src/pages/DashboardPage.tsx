import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

type StandupEntry = {
  id: number;
  name: string;
  yesterday: string;
  today: string;
  blockers: string;
  created_at: string;
  project_id?: number | null;
  project_name?: string | null;
};

type StandupListResponse = {
  items: StandupEntry[];
};

type StandupSummaryResponse = {
  summary: string;
  count: number;
};

type Project = {
  id: number;
  name: string;
  description: string;
  owner: string;
  status: "planned" | "active" | "blocked" | "done";
  created_at: string;
};

type ProjectListResponse = {
  items: Project[];
};

// 🔹 Tasks types
type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

type Task = {
  id: number;
  owner: string;
  title: string;
  status: TaskStatus;
  progress: number;
  is_active: boolean;
  project_id?: number | null;
  project_name?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type TaskListResponse = {
  items: Task[];
};

// 🔹 Recent standups grouping type
type RecentStandupGroup = {
  date: string;
  entries: StandupEntry[];
};

const formatTaskStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    case "blocked":
      return "Blocked";
    default:
      return status;
  }
};

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, token } = useUser();
  const loggedInName = user?.username ?? "";

  const backendBase =
    (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const [todayStandups, setTodayStandups] = useState<StandupEntry[]>([]);
  const [myTodayStandups, setMyTodayStandups] = useState<StandupEntry[]>([]);
  const [standupsLoading, setStandupsLoading] = useState(false);
  const [standupsError, setStandupsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);

  // 🔹 My tasks state
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // 🔹 Recent standups (last 3 days, unit-level)
  const [recentStandups, setRecentStandups] = useState<RecentStandupGroup[]>([]);
  const [recentStandupsLoading, setRecentStandupsLoading] = useState(false);
  const [recentStandupsError, setRecentStandupsError] = useState<string | null>(
    null
  );

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryCount, setSummaryCount] = useState<number | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const loadTodayStandups = async () => {
    setStandupsLoading(true);
    setStandupsError(null);

    try {
      const res = await fetch(
        `${backendBase}/api/standup/by-date?date=${encodeURIComponent(
          todayStr
        )}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StandupListResponse = await res.json();
      const items = data.items || [];
      setTodayStandups(items);
      if (loggedInName) {
        setMyTodayStandups(items.filter((e) => e.name === loggedInName));
      } else {
        setMyTodayStandups([]);
      }
    } catch (err) {
      console.error(err);
      setStandupsError("Failed to load today's standups.");
    } finally {
      setStandupsLoading(false);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const res = await fetch(`${backendBase}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProjectListResponse = await res.json();
      const items = data.items || [];
      setProjects(items);
      if (loggedInName) {
        setMyProjects(items.filter((p) => p.owner === loggedInName));
      } else {
        setMyProjects([]);
      }
    } catch (err) {
      console.error(err);
      setProjectsError("Failed to load projects.");
    } finally {
      setProjectsLoading(false);
    }
  };

  // 🔹 Load my active tasks
  const loadMyTasks = async () => {
    if (!isAuthenticated || !token) {
      setMyTasks([]);
      return;
    }

    setTasksLoading(true);
    setTasksError(null);

    try {
      const res = await fetch(
        `${backendBase}/api/tasks?mine=true&active_only=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskListResponse = await res.json();
      const items = data.items || [];
      setMyTasks(items);
    } catch (err) {
      console.error(err);
      setTasksError("Failed to load your active tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  // 🔹 Load recent standups for last 3 days (unit-level)
  const loadRecentStandups = async () => {
    setRecentStandupsLoading(true);
    setRecentStandupsError(null);

    try {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      const groups = await Promise.all(
        dates.map(async (dateStr) => {
          try {
            const res = await fetch(
              `${backendBase}/api/standup/by-date?date=${encodeURIComponent(
                dateStr
              )}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: StandupListResponse = await res.json();
            return {
              date: dateStr,
              entries: data.items || [],
            } as RecentStandupGroup;
          } catch (err) {
            console.error("Failed to load standups for", dateStr, err);
            return { date: dateStr, entries: [] };
          }
        })
      );

      const nonEmpty = groups.filter((g) => g.entries.length > 0);
      setRecentStandups(nonEmpty);
    } catch (err) {
      console.error(err);
      setRecentStandupsError("Failed to load recent standups.");
    } finally {
      setRecentStandupsLoading(false);
    }
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    setSummaryCount(null);

    try {
      const res = await fetch(`${backendBase}/api/standup/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StandupSummaryResponse = await res.json();
      setSummary(data.summary);
      setSummaryCount(data.count);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to load AI summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;

    const header = `Unit Daily Standup SITREP (today)\nBased on ${
      summaryCount ?? 0
    } standup entries.\n\n`;
    const text = header + summary;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy:", err);
        alert("Copy failed. You can still manually select and copy the text.");
      });
    } else {
      alert("Clipboard API not available. Please select and copy manually.");
    }
  };

  useEffect(() => {
    loadTodayStandups();
    loadProjects();
    loadMyTasks();
    loadRecentStandups();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInName, isAuthenticated, token]);

  const totalStandups = todayStandups.length;

  const projectCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 🔹 Derived task metrics
  const totalMyTasks = myTasks.length;
  const myTasksByStatus: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
    blocked: 0,
  };
  myTasks.forEach((t) => {
    myTasksByStatus[t.status] = (myTasksByStatus[t.status] || 0) + 1;
  });

  const parseTs = (iso?: string | null) =>
    iso ? new Date(iso).getTime() : 0;

  const recentTasks: Task[] =
    totalMyTasks > 0
      ? [...myTasks]
          .sort((a, b) => {
            const ta = parseTs(a.updated_at) || parseTs(a.created_at);
            const tb = parseTs(b.updated_at) || parseTs(b.created_at);
            return tb - ta;
          })
          .slice(0, 5)
      : [];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Quick snapshot of today&apos;s standups, your projects, your active tasks,
        and an AI-generated SITREP you can copy into reports or emails.
      </p>

      {!isAuthenticated && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          You are not signed in. Some personalized sections may be empty.
        </p>
      )}

      {/* Row 1: My Today + Unit Snapshot */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {/* My Today */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "1rem",
          }}
        >
          <h2>My Today</h2>
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Date: <strong>{todayStr}</strong>{" "}
            {loggedInName && (
              <>
                | Signed in as <strong>{loggedInName}</strong>
              </>
            )}
          </p>

          {/* 🔹 My Active Tasks */}
          <h3 style={{ marginTop: "0.75rem" }}>My Active Tasks</h3>
          {tasksLoading ? (
            <p>Loading tasks...</p>
          ) : tasksError ? (
            <p style={{ color: "red" }}>{tasksError}</p>
          ) : totalMyTasks === 0 ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              You have no active tasks. Create one on the{" "}
              <a href="/tasks">Tasks</a> page.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.9rem" }}>
                You have <strong>{totalMyTasks}</strong> active task
                {totalMyTasks === 1 ? "" : "s"}.
              </p>
              <ul
                style={{
                  fontSize: "0.9rem",
                  paddingLeft: "1.2rem",
                  marginTop: "0.25rem",
                }}
              >
                <li>Todo: {myTasksByStatus.todo}</li>
                <li>In Progress: {myTasksByStatus.in_progress}</li>
                <li>Done: {myTasksByStatus.done}</li>
                <li>Blocked: {myTasksByStatus.blocked}</li>
              </ul>
              <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                Go to <a href="/tasks">Tasks</a> for details.
              </p>
            </>
          )}

          <h3 style={{ marginTop: "1rem" }}>My Standups Today</h3>
          {standupsLoading ? (
            <p>Loading standups...</p>
          ) : standupsError ? (
            <p style={{ color: "red" }}>{standupsError}</p>
          ) : myTodayStandups.length === 0 ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              No standups recorded by you yet today.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {myTodayStandups.map((s) => (
                <li
                  key={s.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {s.project_name && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                      Project: <strong>{s.project_name}</strong>
                    </div>
                  )}
                  {s.today && (
                    <p>
                      <strong>Today:</strong> {s.today}
                    </p>
                  )}
                  {s.blockers && (
                    <p>
                      <strong>Blockers:</strong> {s.blockers}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* 🔹 Recent Tasks */}
          <h3 style={{ marginTop: "1rem" }}>Recent Tasks</h3>
          {tasksLoading ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Loading tasks...
            </p>
          ) : totalMyTasks === 0 ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              No tasks to display yet.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                marginTop: "0.25rem",
                fontSize: "0.9rem",
              }}
            >
              {recentTasks.map((t) => (
                <li
                  key={t.id}
                  style={{
                    borderBottom: "1px dashed #ddd",
                    paddingBottom: "0.25rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <div>
                    <strong>{t.title}</strong>
                    {t.project_name && (
                      <span style={{ opacity: 0.7 }}>
                        {" "}
                        – {t.project_name}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.8,
                      marginTop: "0.1rem",
                    }}
                  >
                    {formatTaskStatusLabel(t.status)} · {t.progress}% complete
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 🔹 Quick Actions */}
          <h3 style={{ marginTop: "1rem" }}>Quick Actions</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.25rem",
              fontSize: "0.85rem",
            }}
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = "/tasks";
              }}
            >
              Go to Tasks
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/standup";
              }}
            >
              Go to Standups
            </button>
          </div>

          <h3 style={{ marginTop: "1rem" }}>My Projects</h3>
          {projectsLoading ? (
            <p>Loading projects...</p>
          ) : projectsError ? (
            <p style={{ color: "red" }}>{projectsError}</p>
          ) : myProjects.length === 0 ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              You do not own any projects yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {myProjects.map((p) => (
                <li
                  key={p.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <strong>{p.name}</strong>{" "}
                  <span style={{ opacity: 0.7 }}>[{p.status}]</span>
                  {p.description && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                      {p.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unit Snapshot */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "1rem",
          }}
        >
          <h2>Unit Snapshot (Today)</h2>
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Overview of everything recorded today.
          </p>

          <div style={{ marginTop: "0.75rem" }}>
            <p>
              <strong>Total standups today:</strong> {totalStandups}
            </p>
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <h3>Projects by Status</h3>
            {projectsLoading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                No projects in the system yet.
              </p>
            ) : (
              <ul style={{ fontSize: "0.9rem" }}>
                <li>Planned: {projectCounts["planned"] || 0}</li>
                <li>Active: {projectCounts["active"] || 0}</li>
                <li>Blocked: {projectCounts["blocked"] || 0}</li>
                <li>Done: {projectCounts["done"] || 0}</li>
              </ul>
            )}
          </div>

          {/* 🔹 Recent Standups (last 3 days) */}
          <div style={{ marginTop: "0.75rem" }}>
            <h3>Recent Standups (last 3 days)</h3>
            {recentStandupsLoading ? (
              <p>Loading recent standups...</p>
            ) : recentStandupsError ? (
              <p style={{ color: "red" }}>{recentStandupsError}</p>
            ) : recentStandups.length === 0 ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                No standups recorded in the last 3 days.
              </p>
            ) : (
              recentStandups.map((group) => (
                <div
                  key={group.date}
                  style={{ marginBottom: "0.5rem", marginTop: "0.25rem" }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.8,
                      marginBottom: "0.15rem",
                    }}
                  >
                    {group.date}
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      paddingLeft: 0,
                      margin: 0,
                      fontSize: "0.85rem",
                    }}
                  >
                    {group.entries.slice(0, 3).map((s) => (
                      <li
                        key={s.id}
                        style={{
                          borderBottom: "1px dashed #e5e7eb",
                          paddingBottom: "0.2rem",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <strong>{s.name || "Unknown"}</strong>
                        {s.project_name && (
                          <span style={{ opacity: 0.8 }}>
                            {" "}
                            – {s.project_name}
                          </span>
                        )}
                        {s.today && (
                          <div
                            style={{
                              marginTop: "0.1rem",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {s.today.length > 120
                              ? s.today.slice(0, 117) + "..."
                              : s.today}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: AI SITREP */}
      <div
        style={{
          marginTop: "1.5rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "1rem",
        }}
      >
        <h2>AI Unit SITREP (Today)</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          This uses the same summary engine as the Standups page, aggregating all
          standups recorded today. Great for copy-paste into higher HQ updates.
        </p>

        <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <button onClick={loadSummary} disabled={summaryLoading}>
            {summaryLoading ? "Refreshing..." : "Refresh Summary"}
          </button>
          {summary && (
            <button
              onClick={handleCopySummary}
              style={{ marginLeft: "0.5rem" }}
            >
              Copy SITREP
            </button>
          )}
        </div>

        {summaryError && (
          <div style={{ marginBottom: "0.5rem", color: "red" }}>
            {summaryError}
          </div>
        )}
        {summary ? (
          <div
            style={{
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "0.5rem",
              whiteSpace: "pre-wrap",
            }}
          >
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Based on {summaryCount ?? 0} standup entries.
            </p>
            <p>{summary}</p>
          </div>
        ) : (
          !summaryLoading && (
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              No summary generated yet today. Click &quot;Refresh Summary&quot; to
              generate one.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
