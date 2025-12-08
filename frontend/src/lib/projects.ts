// filename: frontend/src/lib/projects.ts
import { BACKEND_BASE } from "./backend";

export type ProjectStatus = "planned" | "active" | "blocked" | "done";

export type Project = {
  id: number;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  created_at: string;
};

export type ProjectListResponse = {
  items: Project[];
};

export type ProjectMemberRole = "owner" | "member" | "viewer";

export type ProjectMember = {
  project_id: number;
  username: string;
  role: ProjectMemberRole;
  created_at: string;
};

export type ProjectMemberListResponse = {
  items: ProjectMember[];
};

export type ProjectMemberCreatePayload = {
  username: string;
  role: ProjectMemberRole;
};

/**
 * Fetch all projects (global view, no auth required).
 */
export async function fetchAllProjects(): Promise<Project[]> {
  const res = await fetch(`${BACKEND_BASE}/api/projects`);
  if (!res.ok) {
    throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
  }
  const data = (await res.json()) as ProjectListResponse;
  return data.items ?? [];
}

/**
 * Fetch projects that belong to / involve the current user.
 * Requires a valid auth token.
 */
export async function fetchMyProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${BACKEND_BASE}/api/projects/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch my projects (HTTP ${res.status})`);
  }
  const data = (await res.json()) as ProjectListResponse;
  return data.items ?? [];
}

/**
 * Fetch members for a given project.
 */
export async function getProjectMembers(
  projectId: number,
  token: string
): Promise<ProjectMember[]> {
  const res = await fetch(
    `${BACKEND_BASE}/api/projects/${projectId}/members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch project members (HTTP ${res.status})`);
  }

  const data = (await res.json()) as ProjectMemberListResponse;
  return data.items ?? [];
}

/**
 * Add or update a member for a project.
 */
export async function addOrUpdateProjectMember(
  projectId: number,
  payload: ProjectMemberCreatePayload,
  token: string
): Promise<ProjectMember> {
  const res = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to upsert project member (HTTP ${res.status})`);
  }

  const data = (await res.json()) as ProjectMember;
  return data;
}

/**
 * Remove a member from a project.
 */
export async function deleteProjectMember(
  projectId: number,
  username: string,
  token: string
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE}/api/projects/${projectId}/members/${encodeURIComponent(
      username
    )}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to remove project member (HTTP ${res.status})`);
  }
}
