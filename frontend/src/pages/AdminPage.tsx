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
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    resetMessages();
    setCreating(true);

    try {
      const payload: AdminCreateUserPayload = {
        username: newUser.username.trim(),
        password: newUser.password,
        role: (newUser.role as "user" | "admin") || "user",
        display_name: newUser.display_name || undefined,
        job_title: newUser.job_title || undefined,
        team_name: newUser.team_name || undefined,
        rank: newUser.rank || undefined,
        skills: newUser.skills || undefined,
      };

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

  const startEditUser = (u: AdminUser) => {
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

  const cancelEditUser = () => {
    setEditUserId(null);
    setEditForm({
      display_name: "",
      job_title: "",
      team_name: "",
      rank: "",
      skills: "",
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEditUser = async (u: AdminUser) => {
    const patch: AdminUpdateUserPayload = {
      display_name: editForm.display_name || undefined,
      job_title: editForm.job_title || undefined,
      team_name: editForm.team_name || undefined,
      rank: editForm.rank || undefined,
      skills: editForm.skills || undefined,
    };

    await updateUser(u.id, patch);
    setEditUserId(null);
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h1>Admin</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Admin – User Management</h1>

      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
        Manage DevCell accounts: create users, promote/demote admins, and
        activate/disable accounts. Profile fields help you see who is who
        across the unit.
      </p>

      {/* Alerts */}
      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: 4,
            border: "1px solid #b91c1c",
            background: "#fee2e2",
            color: "#7f1d1d",
          }}
        >
          {error}
        </div>
      )}
      {info && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: 4,
            border: "1px solid #166534",
            background: "#dcfce7",
            color: "#14532d",
          }}
        >
          {info}
        </div>
      )}

      {/* Users table */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h2 style={{ margin: 0, marginRight: "1rem" }}>Existing Users</h2>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {users.length === 0 && !loading && (
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>No users found.</p>
        )}

        {users.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Username
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Role</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Active
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Display Name
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Job Title
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Team
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Rank
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Skills
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const editing = editUserId === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          verticalAlign: "top",
                        }}
                      >
                        <td style={{ padding: "0.5rem" }}>
                          <div>{u.username}</div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              opacity: 0.7,
                              marginTop: "0.15rem",
                            }}
                          >
                            Created:{" "}
                            {u.created_at
                              ? new Date(u.created_at).toLocaleString()
                              : "–"}
                          </div>
                        </td>
                        <td style={{ padding: "0.5rem" }}>{u.role}</td>
                        <td style={{ padding: "0.5rem" }}>
                          {u.is_active ? "Yes" : "No"}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {u.display_name || "—"}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {u.job_title || "—"}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {u.team_name || "—"}
                        </td>
                        <td style={{ padding: "0.5rem" }}>{u.rank || "—"}</td>
                        <td style={{ padding: "0.5rem" }}>
                          {u.skills ? (
                            <span
                              style={{
                                display: "inline-block",
                                maxWidth: "16rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={u.skills}
                            >
                              {u.skills}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              disabled={updating}
                            >
                              {u.role === "admin" ? "Make User" : "Make Admin"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={updating}
                            >
                              {u.is_active ? "Disable" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                editing ? cancelEditUser() : startEditUser(u)
                              }
                              disabled={updating}
                            >
                              {editing ? "Cancel" : "Edit Profile"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {editing && (
                        <tr
                          style={{
                            borderTop: "1px solid #e5e7eb",
                            background: "#f3f4f6",
                          }}
                        >
                          <td
                            colSpan={9}
                            style={{ padding: "0.75rem 0.5rem 1rem 0.5rem" }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "0.75rem",
                                marginBottom: "0.75rem",
                              }}
                            >
                              <label style={{ fontSize: "0.85rem" }}>
                                Display Name
                                <input
                                  name="display_name"
                                  value={editForm.display_name}
                                  onChange={handleEditChange}
                                  placeholder="e.g. CPT You"
                                  style={{ width: "100%", marginTop: "0.25rem" }}
                                />
                              </label>

                              <label style={{ fontSize: "0.85rem" }}>
                                Job Title
                                <input
                                  name="job_title"
                                  value={editForm.job_title}
                                  onChange={handleEditChange}
                                  placeholder="e.g. Dev Cell Lead"
                                  style={{ width: "100%", marginTop: "0.25rem" }}
                                />
                              </label>

                              <label style={{ fontSize: "0.85rem" }}>
                                Team Name
                                <input
                                  name="team_name"
                                  value={editForm.team_name}
                                  onChange={handleEditChange}
                                  placeholder="e.g. CSD-D Dev Cell"
                                  style={{ width: "100%", marginTop: "0.25rem" }}
                                />
                              </label>

                              <label style={{ fontSize: "0.85rem" }}>
                                Rank
                                <input
                                  name="rank"
                                  value={editForm.rank}
                                  onChange={handleEditChange}
                                  placeholder="e.g. CPT, SSG, GS-13"
                                  style={{ width: "100%", marginTop: "0.25rem" }}
                                />
                              </label>
                            </div>

                            <label
                              style={{
                                display: "block",
                                fontSize: "0.85rem",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Skills
                              <textarea
                                name="skills"
                                value={editForm.skills}
                                onChange={handleEditChange}
                                placeholder="Optional: Python, FastAPI, malware dev..."
                                rows={3}
                                style={{
                                  width: "100%",
                                  marginTop: "0.25rem",
                                  resize: "vertical",
                                }}
                              />
                            </label>

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                onClick={() => void handleSaveEditUser(u)}
                                disabled={updating}
                              >
                                {updating ? "Saving…" : "Save Profile"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditUser}
                                disabled={updating}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create user form */}
      <div
        style={{
          padding: "1rem",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create New User</h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Use this for bootstrapping the cell or onboarding new operators.
        </p>

        <form
          onSubmit={handleCreateUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          <label style={{ fontSize: "0.85rem" }}>
            Username
            <input
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              required
              placeholder="username"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Password
            <input
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              required
              placeholder="••••••••"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Role
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
              style={{ width: "100%", marginTop: "0.25rem" }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Display Name
            <input
              name="display_name"
              value={newUser.display_name}
              onChange={handleNewUserChange}
              placeholder="e.g. CPT You"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Job Title
            <input
              name="job_title"
              value={newUser.job_title}
              onChange={handleNewUserChange}
              placeholder="e.g. Dev Cell Lead"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Team Name
            <input
              name="team_name"
              value={newUser.team_name}
              onChange={handleNewUserChange}
              placeholder="e.g. CSD-D Dev Cell"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Rank
            <input
              name="rank"
              value={newUser.rank}
              onChange={handleNewUserChange}
              placeholder="e.g. CPT, SSG, GS-13"
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <label
            style={{
              fontSize: "0.85rem",
              gridColumn: "1 / -1",
            }}
          >
            Skills
            <textarea
              name="skills"
              value={newUser.skills}
              onChange={handleNewUserChange}
              placeholder="Optional: Python, FastAPI, malware dev..."
              rows={3}
              style={{
                width: "100%",
                marginTop: "0.25rem",
                resize: "vertical",
              }}
            />
          </label>

          <div
            style={{
              gridColumn: "1 / -1",
              marginTop: "0.5rem",
            }}
          >
            <button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
