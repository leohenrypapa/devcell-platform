// filename: frontend/src/lib/users.ts
import { BACKEND_BASE } from "./backend";

export type UserRole = "user" | "admin" | string;

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  display_name?: string | null;
  job_title?: string | null;
  team_name?: string | null;
  rank?: string | null;
  skills?: string | null;
}

export interface UserListResponse {
  items: User[];
}

export interface AdminUpdateUserPayload {
  display_name?: string | null;
  job_title?: string | null;
  team_name?: string | null;
  rank?: string | null;
  skills?: string | null;
  role?: "user" | "admin";
  is_active?: boolean;
}

export interface AdminCreateUserPayload {
  username: string;
  password: string;
  role: "user" | "admin";
  display_name?: string | null;
  job_title?: string | null;
  team_name?: string | null;
  rank?: string | null;
  skills?: string | null;
}

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

export const listUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/users`, {
    headers: buildHeaders(token, false),
  });

  const data = await handleJson<UserListResponse>(
    res,
    "Failed to load users.",
  );

  return data.items ?? [];
};

export const adminUpdateUser = async (
  token: string,
  userId: number,
  patch: AdminUpdateUserPayload,
): Promise<User> => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/users/${userId}`, {
    method: "PUT",
    headers: buildHeaders(token, true),
    body: JSON.stringify(patch),
  });

  const data = await handleJson<User>(res, "Failed to update user.");
  return data;
};

export const adminCreateUser = async (
  token: string,
  payload: AdminCreateUserPayload,
): Promise<User> => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/admin/create_user`, {
    method: "POST",
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });

  const data = await handleJson<User>(res, "Failed to create user.");
  return data;
};
