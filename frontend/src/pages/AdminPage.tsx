// filename: frontend/src/pages/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

type User = {
  id: number;
  username: string;
  role: "user" | "admin" | string;
  is_active: boolean;
  created_at: string;
  display_name?: string | null;
  job_title?: string | null;
  team_name?: string | null;
  rank?: string | null;
  skills?: string | null;
};

type UserListResponse = {
  items: User[];
};

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const AdminPage: React.FC = () => {
  const { user, token } = useUser();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Create-user form
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  const isAdmin = user?.role === "admin";

  const handleNewUserChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${backendBase}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(data.detail || "Failed to load users.");
      }

      const data = (await res.json()) as UserListResponse;
      setUsers(data.items || []);
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

  const updateUser = async (id: number, patch: Partial<User>) => {
    if (!token) return;

    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${backendBase}/api/auth/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(data.detail || "Failed to update user.");
      }

      const updated = (await res.json()) as User;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setInfo("User updated.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update user.";
      setError(message);
    }
  };

  const toggleActive = (u: User) => {
    void updateUser(u.id, { is_active: !u.is_active });
  };

  const toggleRole = (u: User) => {
    const nextRole = u.role === "admin" ? "user" : "admin";
    void updateUser(u.id, { role: nextRole });
  };

  const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setInfo(null);

    if (!newUser.username.trim() || !newUser.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const res = await fetch(`${backendBase}/api/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(data.detail || "Failed to create user.");
      }

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
      void fetchUsers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create user.";
      setError(message);
    }
  };

  if (!isAdmin) {
    return <p>You must be an admin to view this page.</p>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Manage users, roles, and account status. This is the primary admin
        dashboard for DevCell.
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem", marginBottom: 0 }}>
          {error}
        </p>
      )}
      {info && (
        <p style={{ color: "green", marginTop: "0.5rem", marginBottom: 0 }}>
          {info}
        </p>
      )}

      {/* Create user */}
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Create New User</h2>
        <form
          onSubmit={createUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.5rem",
            maxWidth: 900,
          }}
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
            <select name="role" value={newUser.role} onChange={handleNewUserChange}>
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
          <label style={{ gridColumn: "1 / -1" }}>
            Skills
            <textarea
              name="skills"
              value={newUser.skills}
              onChange={handleNewUserChange}
            />
          </label>
          <div style={{ marginTop: "0.5rem" }}>
            <button type="submit">Create User</button>
          </div>
        </form>
      </section>

      {/* Users table */}
      <section style={{ marginTop: "2rem" }}>
        <h2>All Users</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          Toggle roles and activation status directly from this table.
        </p>

        <button onClick={fetchUsers} disabled={loading} style={{ marginBottom: "0.5rem" }}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        {loading && <p>Loading users...</p>}

        {!loading && users.length === 0 && <p>No users found.</p>}

        {!loading && users.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                minWidth: 700,
                maxWidth: "100%",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Display Name</th>
                  <th style={thStyle}>Job Title</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.username}</td>
                    <td style={tdStyle}>{u.display_name || "-"}</td>
                    <td style={tdStyle}>{u.job_title || "-"}</td>
                    <td style={tdStyle}>{u.team_name || "-"}</td>
                    <td style={tdStyle}>{u.rank || "-"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "0.15rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid #ccc",
                          fontSize: "0.8rem",
                          backgroundColor:
                            u.role === "admin" ? "#ffe5cc" : "#e6f2ff",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "0.15rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid #ccc",
                          fontSize: "0.8rem",
                          backgroundColor: u.is_active ? "#e6ffe6" : "#ffe6e6",
                        }}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => toggleRole(u)}
                        style={{
                          marginRight: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        {u.role === "admin" ? "Make User" : "Make Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        {u.is_active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "0.4rem",
  backgroundColor: "#f7f7f7",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "0.4rem",
};

export default AdminPage;
