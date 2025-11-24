import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

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

type ProjectSummaryResponse = {
  project_id: number;
  project_name: string;
  summary: string;
  count: number;
};

const ProjectsPage: React.FC = () => {
  const { user, token, isAuthenticated } = useUser();
  const loggedInOwner = user?.username ?? "";
  const isAdmin = user?.role === "admin";
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [showMineOnly, setShowMineOnly] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"planned" | "active" | "blocked" | "done">(
    "planned"
  );
  const [creating, setCreating] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ProjectSummaryResponse | null>(
    null
  );

  const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendBase}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProjectListResponse = await res.json();
      setProjects(data.items || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSaveProject = async () => {
    if (!isAuthenticated || !token) {
      alert("You must be signed in to create a project.");
      return;
    }

    if (!name.trim()) {
      alert("Project name is required.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let url = `${backendBase}/api/projects`;
      let method: "POST" | "PUT" = "POST";
      if (editingProjectId !== null) {
        url = `${backendBase}/api/projects/${editingProjectId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          owner: loggedInOwner || "Unknown", // backend overwrites with current user
          status,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await loadProjects();

      setName("");
      setDescription("");
      setStatus("planned");
      setEditingProjectId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setStatus(p.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProjectSummary = async (projectId: number) => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);

    try {
      const res = await fetch(`${backendBase}/api/projects/${projectId}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProjectSummaryResponse = await res.json();
      setSummaryData(data);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to generate project summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopyProjectSummary = () => {
    if (!summaryData) return;

    const header = `Project SITREP: ${summaryData.project_name}\nBased on ${summaryData.count} standup entries today.\n\n`;
    const text = header + summaryData.summary;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy:", err);
        alert("Copy failed. You can still manually select and copy the text.");
      });
    } else {
      alert("Clipboard API not available. Please select and copy manually.");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!isAuthenticated || !token) {
      alert("You must be signed in to delete a project.");
      return;
    }

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendBase}/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Delete project failed:", res.status);
        alert("Failed to delete project.");
        return;
      }

      await loadProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to delete project.");
    }
  };

  const statusLabel = (s: Project["status"]) => {
    switch (s) {
      case "planned":
        return "Planned";
      case "active":
        return "Active";
      case "blocked":
        return "Blocked";
      case "done":
        return "Done";
      default:
        return s;
    }
  };

  const displayProjects =
    showMineOnly && loggedInOwner
      ? projects.filter((p) => p.owner === loggedInOwner)
      : projects;

  return (
    <div>
      <h1>Projects</h1>
      <p>Track your dev cell projects, owners, statuses, and AI summaries.</p>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          maxWidth: "600px",
        }}
      >
        <h2>{editingProjectId ? "Edit Project" : "Create Project"}</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
          Owner will be set to your account:{" "}
          <strong>{loggedInOwner || "Unknown user"}</strong>.
        </p>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Name (required)
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              placeholder="e.g., Dev Portal, LLM Integration"
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Description
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              placeholder="Short summary of the project."
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Status
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as Project["status"])
              }
              style={{ width: "100%", marginTop: "0.25rem" }}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>
        <button onClick={handleSaveProject} disabled={creating}>
          {creating
            ? editingProjectId
              ? "Saving..."
              : "Creating..."
            : editingProjectId
            ? "Save Changes"
            : "Create Project"}
        </button>
        {editingProjectId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingProjectId(null);
              setName("");
              setDescription("");
              setStatus("planned");
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
        <h2>All Projects</h2>

        <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          <label>
            <input
              type="checkbox"
              checked={showMineOnly}
              onChange={(e) => setShowMineOnly(e.target.checked)}
              style={{ marginRight: "0.25rem" }}
            />
            Show only my projects ({loggedInOwner || "not signed in"})
          </label>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : displayProjects.length === 0 ? (
          <p>No projects yet. Create one above.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              maxWidth: "900px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Owner
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Created
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.map((p) => (
                <tr key={p.id}>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <strong>{p.name}</strong>
                    {p.description && (
                      <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {p.owner || "-"}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {statusLabel(p.status)}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => handleProjectSummary(p.id)}
                      disabled={summaryLoading}
                    >
                      {summaryLoading &&
                      summaryData &&
                      summaryData.project_id === p.id
                        ? "Summarizing..."
                        : "AI Summary"}
                    </button>
                    {(isAdmin || p.owner === loggedInOwner) && (
                      <>
                        <button
                          onClick={() => handleEditProject(p)}
                          style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Project AI Summary</h2>

        {summaryData && (
          <button
            onClick={handleCopyProjectSummary}
            style={{ marginBottom: "0.5rem" }}
          >
            Copy Summary
          </button>
        )}

        {summaryError && (
          <div style={{ marginBottom: "0.5rem", color: "red" }}>
            {summaryError}
          </div>
        )}

        {summaryData ? (
          <div
            style={{
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              maxWidth: "900px",
              whiteSpace: "pre-wrap",
            }}
          >
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Project: <strong>{summaryData.project_name}</strong> – based on{" "}
              {summaryData.count} standup entries today.
            </p>
            <p>{summaryData.summary}</p>
          </div>
        ) : (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Click "AI Summary" on a project to see a project-specific summary here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
