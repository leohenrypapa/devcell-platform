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

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useUser();
  const loggedInName = user?.username ?? "";

  const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const [todayStandups, setTodayStandups] = useState<StandupEntry[]>([]);
  const [myTodayStandups, setMyTodayStandups] = useState<StandupEntry[]>([]);
  const [standupsLoading, setStandupsLoading] = useState(false);
  const [standupsError, setStandupsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);

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
        `${backendBase}/api/standup/by-date?date=${encodeURIComponent(todayStr)}`
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
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInName]);

  const totalStandups = todayStandups.length;

  const projectCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Quick snapshot of today&apos;s standups, your projects, and an AI-generated
        SITREP you can copy into reports or emails.
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

          <h3 style={{ marginTop: "0.75rem" }}>My Standups Today</h3>
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
