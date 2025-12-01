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
  const { user, token } = useUser() as any;

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

  const isAdmin = user && user.role === "admin";

  const handleNewUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to load users.");
      }
      const data = (await res.json()) as UserListResponse;
      setUsers(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update user.");
      }
      const updated = (await res.json()) as User;
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      setInfo("User updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update user.");
    }
  };

  const toggleActive = (u: User) => {
    updateUser(u.id, { is_active: !u.is_active });
  };

  const toggleRole = (u: User) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    // Optional: prevent self-demotion
    if (user && user.id === u.id && u.role === "admin" && newRole === "user") {
      setError("You cannot remove your own admin role.");
      return;
    }
    updateUser(u.id, { role: newRole });
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setInfo(null);

    if (!newUser.username || !newUser.password) {
      setError("Username and password are required.");
      return;
    }

    try {
      // This assumes you have /api/auth/admin/create_user on backend.
      // Body includes profile fields + role.
      const res = await fetch(`${backendBase}/api/auth/admin/create_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          display_name: newUser.display_name || null,
          job_title: newUser.job_title || null,
          team_name: newUser.team_name || null,
          rank: newUser.rank || null,
          skills: newUser.skills || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create user.");
      }

      const created = (await res.json()) as User;

      setInfo(`User '${created.username}' created as ${created.role}.`);
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
      // reload users list
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Admin</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      {/* Current User Card */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "1rem",
          marginBottom: "1rem",
          maxWidth: "480px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Current User</h2>
        <p>
          <strong>Username:</strong> {user?.username}
        </p>
        <p>
          <strong>Role:</strong> {user?.role}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {user?.created_at
            ? new Date(user.created_at).toLocaleString()
            : "-"}
        </p>
      </section>

      {/* Create New User Card */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "1rem",
          marginBottom: "1rem",
          maxWidth: "600px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create New User</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {info && <p style={{ color: "green" }}>{info}</p>}

        <form
          onSubmit={createUser}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "0.75rem",
            rowGap: "0.4rem",
          }}
        >
          <label style={{ gridColumn: "1 / 2" }}>
            Username
            <input
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              required
            />
          </label>

          <label style={{ gridColumn: "2 / 3" }}>
            Password
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              required
            />
          </label>

          <label style={{ gridColumn: "1 / 2" }}>
            Role
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label style={{ gridColumn: "2 / 3" }}>
            Display Name
            <input
              name="display_name"
              value={newUser.display_name}
              onChange={handleNewUserChange}
              placeholder="e.g. CPT You"
            />
          </label>

          <label style={{ gridColumn: "1 / 2" }}>
            Job Title
            <input
              name="job_title"
              value={newUser.job_title}
              onChange={handleNewUserChange}
              placeholder="e.g. Dev Cell Lead"
            />
          </label>

          <label style={{ gridColumn: "2 / 3" }}>
            Team
            <input
              name="team_name"
              value={newUser.team_name}
              onChange={handleNewUserChange}
              placeholder="e.g. DevCell"
            />
          </label>

          <label style={{ gridColumn: "1 / 2" }}>
            Rank
            <input
              name="rank"
              value={newUser.rank}
              onChange={handleNewUserChange}
              placeholder="e.g. CPT, SSG, GS-13"
            />
          </label>

          <label style={{ gridColumn: "1 / 3" }}>
            Skills
            <textarea
              name="skills"
              value={newUser.skills}
              onChange={handleNewUserChange}
              placeholder="Optional: Python, FastAPI, malware dev..."
            />
          </label>

          <div style={{ gridColumn: "1 / 3", marginTop: "0.5rem" }}>
            <button type="submit">Create User</button>
          </div>
        </form>
      </section>

      {/* All Users Table */}
      <section>
        <h2>All Users</h2>
        <button onClick={fetchUsers} disabled={loading} style={{ marginBottom: "0.5rem" }}>
          {loading ? "Refreshing..." : "Refresh List"}
        </button>

        {users.length === 0 && !loading && <p>No users found.</p>}

        {users.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Display Name</th>
                  <th style={thStyle}>Job Title</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
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
