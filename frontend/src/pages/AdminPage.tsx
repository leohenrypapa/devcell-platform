// filename: frontend/src/pages/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

import type {
  User as AdminUser,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
} from "../lib/users";
import {
  adminCreateUser,
  adminUpdateUser,
  listUsers,
} from "../lib/users";

type NewUserForm = {
  username: string;
  password: string;
  role: "user" | "admin" | string;
  display_name: string;
  job_title: string;
  team_name: string;
  rank: string;
  skills: string;
};

type EditUserForm = {
  display_name: string;
  job_title: string;
  team_name: string;
  rank: string;
  skills: string;
};

const AdminPage: React.FC = () => {
  const { user, token } = useUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<NewUserForm>({
    username: "",
    password: "",
    role: "user",
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  // Inline profile-edit form state
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  const isAdmin = user?.role === "admin";

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchUsers();
    }
  }, [isAdmin, token]);

  const updateUser = async (id: number, patch: AdminUpdateUserPayload) => {
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
  };

  const handleToggleRole = (u: AdminUser) => {
    const nextRole: "user" | "admin" = u.role === "admin" ? "user" : "admin";
    void updateUser(u.id, { role: nextRole });
  };

  const handleToggleActive = (u: AdminUser) => {
    void updateUser(u.id, { is_active: !u.is_active });
  };

  const handleNewUserChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    resetMessages();
    setCreating(true);

    const payload: AdminCreateUserPayload = {
      username: newUser.username,
      password: newUser.password,
      role: newUser.role === "admin" ? "admin" : "user",
      display_name: newUser.display_name || null,
      job_title: newUser.job_title || null,
      team_name: newUser.team_name || null,
      rank: newUser.rank || null,
      skills: newUser.skills || null,
    };

    try {
      await adminCreateUser(token, payload);
      setInfo("User created.");
      setNewUser({
        username: "",
        password: "",
        role: "user",
        display_name: "",
        job_title: "",
        team_name: "",
        rank: "",
        skills: "",
      });
      await fetchUsers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create user.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (u: AdminUser) => {
    setEditUserId(u.id);
    setEditForm({
      display_name: u.display_name ?? "",
      job_title: u.job_title ?? "",
      team_name: u.team_name ?? "",
      rank: u.rank ?? "",
      skills: u.skills ?? "",
    });
    resetMessages();
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async (u: AdminUser) => {
    await updateUser(u.id, {
      display_name: editForm.display_name,
      job_title: editForm.job_title,
      team_name: editForm.team_name,
      rank: editForm.rank,
      skills: editForm.skills,
    });
    setEditUserId(null);
  };

  // Basic access control UX on the page itself
  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <h1>Admin</h1>
        <p>You must be signed in to view this page.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <h1>Admin</h1>
        <p>🚫 You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "1rem auto" }}>
      <h1>Admin — User Management</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Manage users, roles, and account status. The backend prevents removing
        or deactivating the last active admin.
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: "0.75rem" }}>{error}</div>
      )}
      {info && (
        <div style={{ color: "green", marginBottom: "0.75rem" }}>{info}</div>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2>Create New User</h2>
        <form
          onSubmit={handleCreateUser}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>
            Username
            <input
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              required
            />
          </label>
          <label>
            Role
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            Display Name
            <input
              name="display_name"
              value={newUser.display_name}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Job Title
            <input
              name="job_title"
              value={newUser.job_title}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Team Name
            <input
              name="team_name"
              value={newUser.team_name}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Rank
            <input
              name="rank"
              value={newUser.rank}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Skills
            <textarea
              name="skills"
              value={newUser.skills}
              onChange={handleNewUserChange}
            />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      </section>

      <section>
        <h2>Existing Users</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ddd" }}>Username</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Role</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Active</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Display Name</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Job</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Team</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Rank</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Skills</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editUserId === u.id;
                return (
                  <tr key={u.id}>
                    <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                      {u.username}
                    </td>
                    <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                      {u.role}{" "}
                      <button
                        type="button"
                        onClick={() => handleToggleRole(u)}
                        disabled={updating}
                        style={{ marginLeft: "0.25rem" }}
                      >
                        Toggle
                      </button>
                    </td>
                    <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                      {u.is_active ? "yes" : "no"}{" "}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        disabled={updating}
                        style={{ marginLeft: "0.25rem" }}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                    {isEditing ? (
                      <>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            name="display_name"
                            value={editForm.display_name}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            name="job_title"
                            value={editForm.job_title}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            name="team_name"
                            value={editForm.team_name}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            name="rank"
                            value={editForm.rank}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <textarea
                            name="skills"
                            value={editForm.skills}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(u)}
                            disabled={updating}
                            style={{ marginRight: "0.25rem" }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditUserId(null)}
                            disabled={updating}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {u.display_name ?? ""}
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {u.job_title ?? ""}
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {u.team_name ?? ""}
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {u.rank ?? ""}
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {u.skills ?? ""}
                        </td>
                        <td style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(u)}
                            disabled={updating}
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
