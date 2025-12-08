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

const buildHeaders = (token: string, withJson = true): HeadersInit => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (withJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const handleJson = async <T>(res: Response, defaultError: string): Promise<T> => {
  let data: unknown = null;

  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors; we'll fall back to default message
  }

  if (!res.ok) {
    let message = defaultError;
    if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as any).detail === "string"
    ) {
      message = (data as any).detail;
    }
    throw new Error(message);
  }

  return data as T;
};

/**
 * Fetch all projects. Requires authentication.
 */
export async function fetchAllProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${BACKEND_BASE}/api/projects`, {
    headers: buildHeaders(token, false),
  });
  const data = await handleJson<ProjectListResponse>(
    res,
    "Failed to fetch projects."
  );
  return data.items ?? [];
}

/**
 * Fetch projects that belong to / involve the current user.
 * Requires a valid auth token.
 */
export async function fetchMyProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${BACKEND_BASE}/api/projects/mine`, {
    headers: buildHeaders(token, false),
  });
  const data = await handleJson<ProjectListResponse>(
    res,
    "Failed to fetch my projects."
  );
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
      headers: buildHeaders(token, false),
    }
  );

  const data = await handleJson<ProjectMemberListResponse>(
    res,
    "Failed to fetch project members."
  );
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
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });

  const data = await handleJson<ProjectMember>(
    res,
    "Failed to upsert project member."
  );
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
      headers: buildHeaders(token, false),
    }
  );

  await handleJson<void>(res, "Failed to remove project member.");
}
