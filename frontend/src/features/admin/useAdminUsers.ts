// filename: frontend/src/features/admin/useAdminUsers.ts
import { useCallback, useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import type {
  User as AdminUser,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
} from "../../lib/users";
import {
  listUsers,
  adminCreateUser,
  adminUpdateUser,
} from "../../lib/users";

export type { AdminUser };

export type EditUserForm = {
  display_name: string;
  job_title: string;
  team_name: string;
  rank: string;
  skills: string;
};

export type UseAdminUsersResult = {
  users: AdminUser[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  info: string | null;
  resetMessages: () => void;

  createUser: (payload: AdminCreateUserPayload) => Promise<void>;
  updateUser: (id: number, patch: AdminUpdateUserPayload) => Promise<void>;
  toggleRole: (u: AdminUser) => void;
  toggleActive: (u: AdminUser) => void;
};

export const useAdminUsers = (): UseAdminUsersResult => {
  const { token } = useUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    resetMessages();

    try {
      const all = await listUsers(token);
      setUsers(all);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load users.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void fetchUsers();
    }
  }, [token, fetchUsers]);

  const createUser = useCallback(
    async (payload: AdminCreateUserPayload) => {
      if (!token) return;

      resetMessages();
      setCreating(true);

      try {
        await adminCreateUser(token, payload);
        setInfo("User created.");
        await fetchUsers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create user.";
        setError(message);
      } finally {
        setCreating(false);
      }
    },
    [token, fetchUsers],
  );

  const updateUser = useCallback(
    async (id: number, patch: AdminUpdateUserPayload) => {
      if (!token) return;

      resetMessages();
      setUpdating(true);

      try {
        await adminUpdateUser(token, id, patch);
        setInfo("User updated.");
        await fetchUsers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update user.";
        setError(message);
      } finally {
        setUpdating(false);
      }
    },
    [token, fetchUsers],
  );

  const toggleRole = (u: AdminUser) => {
    const nextRole: "user" | "admin" = u.role === "admin" ? "user" : "admin";
    void updateUser(u.id, { role: nextRole });
  };

  const toggleActive = (u: AdminUser) => {
    void updateUser(u.id, { is_active: !u.is_active });
  };

  return {
    users,
    loading,
    creating,
    updating,
    error,
    info,
    resetMessages,
    createUser,
    updateUser,
    toggleRole,
    toggleActive,
  };
};
