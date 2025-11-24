import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

type UserItem = {
  id: number;
  username: string;
  role: string;
  created_at: string;
};

type UserListResponse = {
  items: UserItem[];
};

const AdminPage: React.FC = () => {
  const { user, token, isAuthenticated } = useUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const backendBase = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

  const isAdmin = isAuthenticated && user?.role === "admin";

  const loadUsers = async () => {
    if (!isAdmin || !token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendBase}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: UserListResponse = await res.json();
      setUsers(data.items || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch(`${backendBase}/api/auth/admin/create_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Create user failed:", text);
        setCreateError("Failed to create user (maybe username exists).");
      } else {
        setCreateSuccess(`User '${newUsername}' created as ${newRole}.`);
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");
        await loadUsers();
      }
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) {
    return <p>You must be signed in to view this page.</p>;
  }

  if (!isAdmin) {
    return <p>You do not have admin permissions.</p>;
  }

  return (
    <div>
      <h1>Admin</h1>
      <p>Admin tools for managing DevCell Platform users.</p>

      {/* Current user info */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          maxWidth: "500px",
        }}
      >
        <h2>Current User</h2>
        <p>
          <strong>Username:</strong> {user?.username}
        </p>
        <p>
          <strong>Role:</strong> {user?.role}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {user ? new Date(user.created_at).toLocaleString() : ""}
        </p>
      </div>

      {/* Create user form */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          maxWidth: "500px",
        }}
      >
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              Username
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              Role
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as "user" | "admin")
                }
                style={{ width: "100%", marginTop: "0.25rem" }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create User"}
          </button>

          {createError && (
            <div style={{ marginTop: "0.5rem", color: "red" }}>
              {createError}
            </div>
          )}
          {createSuccess && (
            <div style={{ marginTop: "0.5rem", color: "green" }}>
              {createSuccess}
            </div>
          )}
        </form>
      </div>

      {/* User list */}
      <div style={{ marginTop: "2rem" }}>
        <h2>All Users</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              maxWidth: "600px",
              borderCollapse: "collapse",
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
                  Username
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: "0.5rem",
                  }}
                >
                  Role
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {u.username}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {u.role}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
