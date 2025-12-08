// filename: frontend/src/pages/ProjectsPage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  fetchAllProjects,
  fetchMyProjects,
  getProjectMembers,
  addOrUpdateProjectMember,
  deleteProjectMember,
} from "../lib/projects";

import type {
  Project,
  ProjectStatus,
  ProjectMember,
  ProjectMemberRole,
} from "../lib/projects";

import { BACKEND_BASE } from "../lib/backend";

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
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [creating, setCreating] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ProjectSummaryResponse | null>(
    null
  );

  // Members state
  const [membersByProject, setMembersByProject] = useState<
    Record<number, ProjectMember[]>
  >({});
  const [membersLoadingProjectId, setMembersLoadingProjectId] = useState<
    number | null
  >(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [expandedMembersProjectId, setExpandedMembersProjectId] = useState<
    number | null
  >(null);

  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<ProjectMemberRole>("member");

  const loadProjects = async (mine: boolean) => {
    setLoading(true);
    setError(null);

    try {
      let data: Project[];

      if (mine) {
        if (!token) {
          throw new Error("Authentication required to load your projects.");
        }
        data = await fetchMyProjects(token);
      } else {
        data = await fetchAllProjects();
      }

      setProjects(data);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to load projects.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects(showMineOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMineOnly, token]);

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
      let url = `${BACKEND_BASE}/api/projects`;
      let method: "POST" | "PUT" = "POST";

      if (editingProjectId !== null) {
        url = `${BACKEND_BASE}/api/projects/${editingProjectId}`;
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

      await loadProjects(showMineOnly);

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
        `${BACKEND_BASE}/api/projects/${projectId}/summary`,
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

  const toggleShowMineOnly = (checked: boolean) => {
    setShowMineOnly(checked);
  };

  const handleToggleMembers = async (project: Project) => {
    if (!token) {
      alert("You must be signed in to view project members.");
      return;
    }

    if (expandedMembersProjectId === project.id) {
      // collapse
      setExpandedMembersProjectId(null);
      setMembersError(null);
      return;
    }

    setExpandedMembersProjectId(project.id);
    setMembersError(null);

    // If we already have members loaded for this project, don't re-fetch immediately.
    if (membersByProject[project.id]?.length) {
      return;
    }

    setMembersLoadingProjectId(project.id);

    try {
      const members = await getProjectMembers(project.id, token);
      setMembersByProject((prev) => ({
        ...prev,
        [project.id]: members,
      }));
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to load project members.";
      setMembersError(message);
    } finally {
      setMembersLoadingProjectId(null);
    }
  };

  const handleAddMember = async (project: Project) => {
    if (!token) {
      alert("You must be signed in to modify project members.");
      return;
    }

    if (!newMemberUsername.trim()) {
      alert("Please enter a username.");
      return;
    }

    try {
      const member = await addOrUpdateProjectMember(
        project.id,
        {
          username: newMemberUsername.trim(),
          role: newMemberRole,
        },
        token
      );

      setMembersByProject((prev) => {
        const existing = prev[project.id] ?? [];
        const updated = [
          ...existing.filter((m) => m.username !== member.username),
          member,
        ].sort((a, b) => a.username.localeCompare(b.username));

        return {
          ...prev,
          [project.id]: updated,
        };
      });

      setNewMemberUsername("");
      setNewMemberRole("member");
      setMembersError(null);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to add/update project member.";
      setMembersError(message);
    }
  };

  const handleRemoveMember = async (project: Project, username: string) => {
    if (!token) {
      alert("You must be signed in to modify project members.");
      return;
    }

    if (
      !window.confirm(
        `Remove ${username} from project "${project.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteProjectMember(project.id, username, token);
      setMembersByProject((prev) => {
        const existing = prev[project.id] ?? [];
        const updated = existing.filter((m) => m.username !== username);
        return {
          ...prev,
          [project.id]: updated,
        };
      });
      setMembersError(null);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove project member.";
      setMembersError(message);
    }
  };

  const canManageMembers = (project: Project): boolean => {
    if (!user) return false;
    return isAdmin || project.owner === user.username;
  };

  return (
    <div>
      <h1>Projects</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Track team projects and get AI-generated summaries from recent standups
        and tasks. Project membership determines who is allowed to see and
        modify specific projects.
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
        <h2>Projects List</h2>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <input
            type="checkbox"
            checked={showMineOnly}
            onChange={(e) => toggleShowMineOnly(e.target.checked)}
          />{" "}
          Show only my projects
        </label>

        {loading && <p>Loading projects...</p>}
        {!loading && projects.length === 0 && (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            No projects found. Create one above.
          </p>
        )}

        {!loading && projects.length > 0 && (
          <ul>
            {projects.map((p) => {
              const isExpanded = expandedMembersProjectId === p.id;
              const members = membersByProject[p.id] ?? [];

              return (
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
                    <div
                      style={{ fontSize: "0.9rem", marginTop: "0.15rem" }}
                    >
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
                    <button
                      type="button"
                      onClick={() => handleToggleMembers(p)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      {isExpanded ? "Hide members" : "Show members"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>Members</strong>
                        {membersLoadingProjectId === p.id && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              opacity: 0.7,
                            }}
                          >
                            Loading members...
                          </span>
                        )}
                      </div>

                      {membersError && (
                        <p
                          style={{
                            color: "red",
                            fontSize: "0.85rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {membersError}
                        </p>
                      )}

                      {members.length === 0 && !membersLoadingProjectId && (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            opacity: 0.8,
                            marginBottom: "0.5rem",
                          }}
                        >
                          No members have been added to this project yet.
                        </p>
                      )}

                      {members.length > 0 && (
                        <ul
                          style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            marginBottom: "0.5rem",
                          }}
                        >
                          {members.map((m) => (
                            <li
                              key={`${m.project_id}-${m.username}`}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.25rem 0",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              <span>
                                <strong>{m.username}</strong>{" "}
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    opacity: 0.8,
                                  }}
                                >
                                  ({m.role})
                                </span>
                              </span>
                              {canManageMembers(p) && m.role !== "owner" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMember(p, m.username)
                                  }
                                  style={{
                                    fontSize: "0.8rem",
                                    padding: "0.15rem 0.5rem",
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {canManageMembers(p) && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            alignItems: "flex-end",
                            marginTop: "0.5rem",
                          }}
                        >
                          <div style={{ minWidth: 160 }}>
                            <label
                              style={{
                                fontSize: "0.85rem",
                                display: "block",
                                marginBottom: "0.15rem",
                              }}
                            >
                              Username
                            </label>
                            <input
                              value={newMemberUsername}
                              onChange={(e) =>
                                setNewMemberUsername(e.target.value)
                              }
                              placeholder="username"
                              style={{ width: "100%" }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: "0.85rem",
                                display: "block",
                                marginBottom: "0.15rem",
                              }}
                            >
                              Role
                            </label>
                            <select
                              value={newMemberRole}
                              onChange={(e) =>
                                setNewMemberRole(
                                  e.target.value as ProjectMemberRole
                                )
                              }
                            >
                              <option value="member">member</option>
                              <option value="viewer">viewer</option>
                              <option value="owner">owner</option>
                            </select>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleAddMember(p)}
                              style={{ marginTop: "0.5rem" }}
                            >
                              Add / Update Member
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
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
