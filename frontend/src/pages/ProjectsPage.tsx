// filename: frontend/src/pages/ProjectsPage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

type ProjectStatus = "planned" | "active" | "blocked" | "done";

type Project = {
  id: number;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
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

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

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
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [creating, setCreating] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ProjectSummaryResponse | null>(
    null
  );

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${backendBase}/api/projects`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ProjectListResponse = await res.json();
      setProjects(data.items || []);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleSaveProject = async () => {
    if (!isAuthenticated || !token) {
      // Keeping alert to match original behavior.
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

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await loadProjects();

      setName("");
      setDescription("");
      setStatus("planned");
      setEditingProjectId(null);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setName("");
    setDescription("");
    setStatus("planned");
  };

  const handleSummarize = async (projectId: number) => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);

    try {
      const res = await fetch(
        `${backendBase}/api/projects/${projectId}/summary`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ProjectSummaryResponse = await res.json();
      setSummaryData(data);
    } catch (err: unknown) {
      console.error(err);
      setSummaryError("Failed to load project summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const filteredProjects = showMineOnly
    ? projects.filter((p) => p.owner === loggedInOwner)
    : projects;

  return (
    <div>
      <h1>Projects</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Track team projects and get AI-generated summaries from recent standups
        and tasks.
      </p>

      {/* Create / Edit project */}
      <section style={{ marginTop: "1.5rem" }}>
        <h2>{editingProjectId ? "Edit Project" : "Create Project"}</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: 480,
          }}
        >
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </label>
          <div style={{ marginTop: "0.5rem" }}>
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
                onClick={handleCancelEdit}
                style={{ marginLeft: "0.5rem" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
      )}

      {/* Projects list */}
      <section style={{ marginTop: "2rem" }}>
        <h2>All Projects</h2>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <input
            type="checkbox"
            checked={showMineOnly}
            onChange={(e) => setShowMineOnly(e.target.checked)}
          />{" "}
          Show only my projects
        </label>

        {loading && <p>Loading projects...</p>}
        {!loading && filteredProjects.length === 0 && (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            No projects found. Create one above.
          </p>
        )}

        {!loading && filteredProjects.length > 0 && (
          <ul>
            {filteredProjects.map((p) => (
              <li
                key={p.id}
                style={{
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "0.5rem",
                }}
              >
                <div>
                  <strong>{p.name}</strong>{" "}
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    ({p.status}) – owner: {p.owner}
                  </span>
                </div>
                {p.description && (
                  <div style={{ fontSize: "0.9rem", marginTop: "0.15rem" }}>
                    {p.description}
                  </div>
                )}
                <div style={{ marginTop: "0.25rem" }}>
                  <button type="button" onClick={() => handleEdit(p)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSummarize(p.id)}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Summarize
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Summary */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Project Summary</h2>
        {summaryLoading && <p>Loading summary...</p>}
        {summaryError && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{summaryError}</p>
        )}
        {summaryData && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
              whiteSpace: "pre-wrap",
            }}
          >
            <h3>
              {summaryData.project_name} (based on {summaryData.count} entries)
            </h3>
            <p>{summaryData.summary}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectsPage;
