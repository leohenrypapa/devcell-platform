// frontend/src/features/projects/useProjects.ts
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_BASE } from "../../lib/backend";
import {
  fetchAllProjects,
  fetchMyProjects,
} from "../../lib/projects";
import type { Project, ProjectStatus } from "../../lib/projects";

export type ProjectFormState = {
  name: string;
  description: string;
  status: ProjectStatus;
  editingProjectId: number | null;
  submitting: boolean;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStatus: (value: ProjectStatus) => void;
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
};

export type UseProjectsResult = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  mineOnly: boolean;
  setMineOnly: (value: boolean) => void;
  reloadProjects: () => void;
  form: ProjectFormState;
  startEditProject: (project: Project) => void;
};

export const useProjects = (): UseProjectsResult => {
  const { user, token, isAuthenticated } = useUser();
  const loggedInOwner = user?.username ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mineOnly, setMineOnly] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async (mine: boolean) => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        throw new Error("Authentication required to load projects.");
      }

      let data: Project[];

      if (mine) {
        data = await fetchMyProjects(token);
      } else {
        data = await fetchAllProjects(token);
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
    if (!isAuthenticated || !token) {
      setProjects([]);
      setError(null);
      return;
    }
    void loadProjects(mineOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mineOnly, token, isAuthenticated]);

  const reloadProjects = () => {
    if (!isAuthenticated || !token) {
      setProjects([]);
      setError(null);
      return;
    }
    void loadProjects(mineOnly);
  };

  const resetForm = () => {
    setEditingProjectId(null);
    setName("");
    setDescription("");
    setStatus("planned");
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      // Preserve original behavior (alert)
      alert("You must be signed in to create or edit a project.");
      return;
    }

    if (!name.trim()) {
      alert("Project name is required.");
      return;
    }

    setSubmitting(true);
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

      reloadProjects();
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to save project.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
  };

  return {
    projects,
    loading,
    error,
    mineOnly,
    setMineOnly,
    reloadProjects,
    form: {
      name,
      description,
      status,
      editingProjectId,
      submitting,
      setName,
      setDescription,
      setStatus,
      handleSubmit,
      handleCancel,
    },
    startEditProject,
  };
};
