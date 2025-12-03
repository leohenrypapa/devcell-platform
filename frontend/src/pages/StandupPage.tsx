import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import StandupTaskConvertModal from "../components/StandupTaskConvertModal";
import { useLocation } from "react-router-dom";

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

type Task = {
  id: number;
  owner: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  progress: number;
  project_id?: number | null;
  project_name?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  origin_standup_id?: number | null;
};

type TaskListResponse = {
  items: Task[];
};

const StandupPage: React.FC = () => {
  const { user, isAuthenticated, token } = useUser();
  const { showToast } = useToast();
  const location = useLocation();

  const loggedInName = user?.username ?? "";
  const [showMineOnly, setShowMineOnly] = useState(false);
  const isAdmin = user?.role === "admin";
  const [editingId, setEditingId] = useState<number | null>(null);

  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryCount, setSummaryCount] = useState<number | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskFilterProjectId, setTaskFilterProjectId] = useState<number | null>(null);

  const [convertTarget, setConvertTarget] = useState<StandupEntry | null>(null);

  const [linkedTasksByStandup, setLinkedTasksByStandup] = useState<Record<number, Task[]>>({});
  const [loadingLinkedTasksByStandup, setLoadingLinkedTasksByStandup] = useState<Record<number, boolean>>({});

  const [highlightedTaskIdsByStandup, setHighlightedTaskIdsByStandup] = useState<Record<number, number[]>>({});
  const [focusedStandupId, setFocusedStandupId] = useState<number | null>(() => {
    const state = location.state as any;
    return state?.focusStandupId ?? null;
  });

  const backendBase =
    (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const loadLinkedTasksForStandup = async (standupId: number) => {
    if (!isAuthenticated || !token) {
      return;
    }
    setLoadingLinkedTasksByStandup((prev) => ({ ...prev, [standupId]: true }));
    try {
      const res = await fetch(
        `${backendBase}/api/standup/${standupId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskListResponse = await res.json();
      setLinkedTasksByStandup((prev) => ({
        ...prev,
        [standupId]: data.items || [],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLinkedTasksByStandup((prev) => ({
        ...prev,
        [standupId]: false,
      }));
    }
  };

  const loadStandupsForDate = async (dateStr: string) => {
    setLoadingEntries(true);
    setError(null);
    try {
      const res = await fetch(
        `${backendBase}/api/standup/by-date?date=${encodeURIComponent(
          dateStr
        )}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StandupListResponse = await res.json();
      const items = data.items || [];
      setEntries(items);

      if (isAuthenticated && token) {
        items.forEach((entry) => {
          loadLinkedTasksForStandup(entry.id);
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load standups.");
    } finally {
      setLoadingEntries(false);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${backendBase}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProjectListResponse = await res.json();
      setProjects(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMyTasks = async (projectId?: number | null) => {
    if (!isAuthenticated || !token) {
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    setTaskError(null);
    try {
      const params = new URLSearchParams();
      params.set("mine", "true");
      params.set("active_only", "true");
      if (projectId !== undefined && projectId !== null) {
        params.set("project_id", String(projectId));
      }
      const res = await fetch(`${backendBase}/api/tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskListResponse = await res.json();
      setTasks(data.items || []);
    } catch (err) {
      console.error(err);
      setTaskError("Failed to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateTask = async () => {
    if (!isAuthenticated || !token) {
      alert("You must be signed in to create a task.");
      return;
    }
    const title = prompt("Task title:");
    if (!title || !title.trim()) return;

    const description = prompt("Task description (optional):") || "";
    const body: any = {
      title: title.trim(),
      description,
      status: "todo",
    };
    if (taskFilterProjectId !== null) {
      body.project_id = taskFilterProjectId;
    }

    try {
      const res = await fetch(`${backendBase}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadMyTasks(taskFilterProjectId);
    } catch (err) {
      console.error(err);
      alert("Failed to create task.");
    }
  };

  const handleUpdateTask = async (
    taskId: number,
    updates: Partial<Pick<Task, "status" | "progress">>
  ) => {
    if (!isAuthenticated || !token) {
      alert("You must be signed in to update a task.");
      return;
    }
    try {
      const res = await fetch(`${backendBase}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadMyTasks(taskFilterProjectId);
    } catch (err) {
      console.error(err);
      alert("Failed to update task.");
    }
  };

  useEffect(() => {
    loadStandupsForDate(selectedDate);
    loadProjects();
    loadMyTasks(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    loadStandupsForDate(value);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to submit a standup.", "error");
      return;
    }
    if (!today.trim()) {
      showToast("'Today' field is required.", "error");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const body: any = {
        name: loggedInName || "Unknown",
        yesterday,
        today,
        blockers,
      };
      if (selectedProjectId !== null) {
        body.project_id = selectedProjectId;
      }

      let url = `${backendBase}/api/standup`;
      let method: "POST" | "PUT" = "POST";
      if (editingId !== null) {
        url = `${backendBase}/api/standup/${editingId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await loadStandupsForDate(selectedDate);
      showToast("Standup submitted.", "success");

      setYesterday("");
      setToday("");
      setBlockers("");
      setSelectedProjectId(null);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to submit standup.");
      showToast("Failed to submit standup.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTaskFromStandup = async () => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to create a task.", "error");
      return;
    }

    const trimmedToday = today.trim();
    if (!trimmedToday) {
      showToast("Fill out the 'Today' field first.", "error");
      return;
    }

    let titleSource = trimmedToday.split("\n")[0];
    if (titleSource.length > 120) {
      titleSource = titleSource.slice(0, 117) + "...";
    }

    const confirmCreate = window.confirm(
      `Create a task from your standup?\n\nTitle:\n"${titleSource}"\n\nDescription will use the full 'Today' text.`
    );
    if (!confirmCreate) return;

    const body: any = {
      title: titleSource,
      description: trimmedToday,
      status: "in_progress",
    };

    if (selectedProjectId !== null) {
      body.project_id = selectedProjectId;
    }

    try {
      const res = await fetch(`${backendBase}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await loadMyTasks(taskFilterProjectId);
      showToast("Task created from standup 'Today' text.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create task from standup.", "error");
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    setSummary(null);
    setSummaryCount(null);

    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.set("date", selectedDate);
      }

      const res = await fetch(
        `${backendBase}/api/standup/summary?${params.toString()}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: StandupSummaryResponse = await res.json();
      setSummary(data.summary);
      setSummaryCount(data.count);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to generate summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;

    const header = `Daily Standup Summary (${selectedDate})\nBased on ${
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

  const handleDeleteStandup = async (id: number) => {
    if (!isAuthenticated || !token) {
      alert("You must be signed in to delete a standup.");
      return;
    }
    const confirmed = window.confirm("Delete this standup entry?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendBase}/api/standup/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Delete failed:", res.status);
        alert("Failed to delete standup.");
        return;
      }

      await loadStandupsForDate(selectedDate);
    } catch (err) {
      console.error(err);
      alert("Failed to delete standup.");
    }
  };

  const handleEditStandup = (entry: StandupEntry) => {
    setYesterday(entry.yesterday || "");
    setToday(entry.today || "");
    setBlockers(entry.blockers || "");
    setSelectedProjectId(entry.project_id ?? null);
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const displayEntries =
    showMineOnly && loggedInName
      ? entries.filter((e) => e.name === loggedInName)
      : entries;

  const handleExportStandupsMarkdown = async () => {
    if (!displayEntries || displayEntries.length === 0) {
      alert("No standups to export for this date.");
      return;
    }

    const lines: string[] = [];

    lines.push(`# Standups for ${selectedDate}`);
    if (!isToday) {
      lines.push(`_Historical view_`, "");
    }
    if (showMineOnly && loggedInName) {
      lines.push(
        `_Filtered: only standups by **${loggedInName}**_`,
        ""
      );
    } else {
      lines.push("");
    }

    displayEntries.forEach((e, idx) => {
      const name = e.name || "Unknown";
      lines.push(`## ${idx + 1}. ${name}`);
      if (e.project_name) {
        lines.push(`**Project:** ${e.project_name}`, "");
      }
      if (e.yesterday?.trim()) {
        lines.push(`**Yesterday**`, "");
        lines.push(e.yesterday.trim(), "");
      }
      if (e.today?.trim()) {
        lines.push(`**Today**`, "");
        lines.push(e.today.trim(), "");
      }
      if (e.blockers?.trim()) {
        lines.push(`**Blockers**`, "");
        lines.push(e.blockers.trim(), "");
      }
      lines.push("---", "");
    });

    const md = lines.join("\n");

    try {
      await navigator.clipboard.writeText(md);
      alert("Standups exported as Markdown and copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy to clipboard, downloading instead.", err);

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `standups-${selectedDate}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  // Scroll + highlight when navigated from TasksPage
  useEffect(() => {
    if (!focusedStandupId || entries.length === 0) return;
    const el = document.getElementById(`standup-card-${focusedStandupId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const idToHighlight = focusedStandupId;
    setTimeout(() => {
      setFocusedStandupId((prev) => (prev === idToHighlight ? null : prev));
    }, 4000);
  }, [focusedStandupId, entries]);

  return (
    <div>
      <h1>Standups</h1>
      <p>Submit your daily update and browse standups by date.</p>

      <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
        <label>
          View standups for date:&nbsp;
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </label>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          maxWidth: "700px",
        }}
      >
        <h2>{editingId ? "Edit Standup" : "Submit Standup"}</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
          Logged in as <strong>{loggedInName || "Unknown user"}</strong>.
          Submissions are always recorded with your account and today&apos;s
          date/time.
        </p>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Project (optional)
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedProjectId(val === "" ? null : Number(val));
              }}
              style={{ width: "100%", marginTop: "0.25rem" }}
              disabled={loadingProjects || projects.length === 0}
            >
              <option value="">
                {loadingProjects
                  ? "Loading projects..."
                  : projects.length === 0
                  ? "No projects available"
                  : "None"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.status}]
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Yesterday
            <textarea
              rows={2}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Today (required)
            <textarea
              rows={2}
              value={today}
              onChange={(e) => setToday(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <div style={{ marginTop: "0.35rem" }}>
            <button
              type="button"
              onClick={handleCreateTaskFromStandup}
              style={{ fontSize: "0.8rem" }}
            >
              + Create Task from Today
            </button>
          </div>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Blockers
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>
        </div>
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? editingId
              ? "Updating..."
              : "Submitting..."
            : editingId
            ? "Update Standup"
            : "Submit Standup"}
        </button>
        {editingId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setYesterday("");
              setToday("");
              setBlockers("");
              setSelectedProjectId(null);
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Cancel Edit
          </button>
        )}
        {error && (
          <div style={{ marginTop: "0.5rem", color: "red" }}>{error}</div>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <h2>
            Standups for {selectedDate}
            {!isToday && " (historical view)"}
          </h2>

          <button
            type="button"
            onClick={handleExportStandupsMarkdown}
            style={{ fontSize: "0.8rem" }}
          >
            Export as Markdown
          </button>
        </div>

        <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          <label>
            <input
              type="checkbox"
              checked={showMineOnly}
              onChange={(e) => setShowMineOnly(e.target.checked)}
              style={{ marginRight: "0.25rem" }}
            />
            Show only my standups ({loggedInName || "not signed in"})
          </label>
        </div>

        {loadingEntries ? (
          <p>Loading...</p>
        ) : displayEntries.length === 0 ? (
          <p>No standups recorded for this date.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {displayEntries.map((e) => {
              const linkedTasks = linkedTasksByStandup[e.id] || [];
              const linkedLoading = !!loadingLinkedTasksByStandup[e.id];
              const highlightedIds = new Set(
                highlightedTaskIdsByStandup[e.id] || []
              );
              const taskCount = linkedTasks.length;

              const isFocused = focusedStandupId === e.id;

              return (
                <li
                  key={e.id}
                  id={`standup-card-${e.id}`}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    boxShadow: isFocused
                      ? "0 0 0 2px #2563eb"
                      : "none",
                    backgroundColor: isFocused ? "#eff6ff" : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong>{e.name}</strong>
                      {taskCount > 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.1rem 0.5rem",
                            borderRadius: "999px",
                            backgroundColor: "#e5f3ff",
                            color: "#1d4ed8",
                          }}
                        >
                          {taskCount} task{taskCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        {new Date(e.created_at).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => setConvertTarget(e)}
                        style={{ fontSize: "0.75rem" }}
                        type="button"
                      >
                        Convert to Tasks
                      </button>
                      {(isAdmin || e.name === loggedInName) && (
                        <>
                          <button
                            onClick={() => handleEditStandup(e)}
                            style={{ fontSize: "0.75rem" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStandup(e.id)}
                            style={{ fontSize: "0.75rem" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {e.project_name && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                      Project: <strong>{e.project_name}</strong>
                    </div>
                  )}

                  {e.yesterday && (
                    <p style={{ marginTop: "0.5rem" }}>
                      <strong>Yesterday:</strong> {e.yesterday}
                    </p>
                  )}
                  <p>
                    <strong>Today:</strong> {e.today}
                  </p>
                  {e.blockers && (
                    <p>
                      <strong>Blockers:</strong> {e.blockers}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      borderTop: "1px dashed #e5e7eb",
                      paddingTop: "0.5rem",
                    }}
                  >
                    <strong>Linked Tasks:</strong>{" "}
                    {linkedLoading ? (
                      <span>Loading...</span>
                    ) : linkedTasks.length === 0 ? (
                      <span>None yet.</span>
                    ) : (
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          marginTop: "0.35rem",
                        }}
                      >
                        {linkedTasks.map((t) => {
                          const isHighlighted = highlightedIds.has(t.id);
                          return (
                            <li
                              key={t.id}
                              style={{
                                marginBottom: "0.25rem",
                                padding: "0.15rem 0.25rem",
                                borderRadius: "4px",
                                backgroundColor: isHighlighted
                                  ? "#ecfdf3"
                                  : "transparent",
                                transition: "background-color 0.2s ease-out",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "999px",
                                  backgroundColor:
                                    t.status === "done"
                                      ? "#16a34a"
                                      : t.status === "in_progress"
                                      ? "#2563eb"
                                      : t.status === "blocked"
                                      ? "#b91c1c"
                                      : "#6b7280",
                                  color: "#fff",
                                  marginRight: "0.35rem",
                                }}
                              >
                                {t.status}
                              </span>
                              <strong>{t.title}</strong>
                              {t.project_name && (
                                <span style={{ opacity: 0.8 }}>
                                  {" "}
                                  [{t.project_name}]
                                </span>
                              )}
                              {t.due_date && (
                                <span
                                  style={{ marginLeft: "0.35rem", opacity: 0.8 }}
                                >
                                  Due:{" "}
                                  {new Date(t.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>My Tasks</h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Tasks are owned by your account and can optionally be linked to a
          project. This panel shows only <strong>your</strong> active tasks.
        </p>

        <div
          style={{
            marginTop: "0.5rem",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: "0.9rem" }}>
            Filter by project:&nbsp;
            <select
              value={taskFilterProjectId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const newId = val === "" ? null : Number(val);
                setTaskFilterProjectId(newId);
                loadMyTasks(newId);
              }}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.status}]
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={handleCreateTask}>
            + New Task
          </button>
        </div>

        {taskError && (
          <div style={{ color: "red", marginBottom: "0.5rem" }}>{taskError}</div>
        )}

        {loadingTasks ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No active tasks yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tasks.map((t) => (
              <li
                key={t.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong>{t.title}</strong>
                    {t.project_name && (
                      <span style={{ marginLeft: "0.5rem", opacity: 0.8 }}>
                        [{t.project_name}]
                      </span>
                    )}
                    {t.description && (
                      <div style={{ marginTop: "0.25rem" }}>
                        {t.description}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <label style={{ fontSize: "0.8rem" }}>
                      Status:&nbsp;
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleUpdateTask(t.id, {
                            status: e.target.value as Task["status"],
                          })
                        }
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>
                    <label style={{ fontSize: "0.8rem" }}>
                      %&nbsp;
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={t.progress}
                        onChange={(e) =>
                          handleUpdateTask(t.id, {
                            progress: Math.min(
                              100,
                              Math.max(0, Number(e.target.value) || 0)
                            ),
                          })
                        }
                        style={{ width: "3rem" }}
                      />
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>AI Summary ({selectedDate})</h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          This summary reflects standups for the selected date above and the
          current active tasks of those team members.
        </p>
        <button onClick={handleGenerateSummary} disabled={loadingSummary}>
          {loadingSummary ? "Generating..." : "Generate Summary"}
        </button>
        {summary && (
          <button
            onClick={handleCopySummary}
            style={{ marginLeft: "0.5rem" }}
          >
            Copy Summary
          </button>
        )}
        {summaryError && (
          <div style={{ marginTop: "0.5rem", color: "red" }}>
            {summaryError}
          </div>
        )}
        {summary && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              whiteSpace: "pre-wrap",
            }}
          >
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Based on {summaryCount ?? 0} standup entries.
            </p>
            <p>{summary}</p>
          </div>
        )}
      </div>

      {convertTarget && (
        <StandupTaskConvertModal
          standup={convertTarget}
          projects={projects}
          backendBase={backendBase}
          onClose={() => setConvertTarget(null)}
          onConverted={(result) => {
            const standupId = convertTarget.id;
            loadLinkedTasksForStandup(standupId);
            loadMyTasks(taskFilterProjectId);
            setConvertTarget(null);
            if (result.taskIds.length > 0) {
              setHighlightedTaskIdsByStandup((prev) => ({
                ...prev,
                [standupId]: result.taskIds,
              }));
              setTimeout(() => {
                setHighlightedTaskIdsByStandup((prev) => {
                  const copy = { ...prev };
                  delete copy[standupId];
                  return copy;
                });
              }, 4000);
            }
            showToast(
              `Created ${result.count} task(s) from standup.`,
              "success"
            );
          }}
        />
      )}
    </div>
  );
};

export default StandupPage;
