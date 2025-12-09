// filename: frontend/src/features/admin/UserCreateCard.tsx
import React, { useState } from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import type { AdminCreateUserPayload } from "../../lib/users";

export type NewUserForm = {
  username: string;
  password: string;
  role: "user" | "admin" | string;
  display_name: string;
  job_title: string;
  team_name: string;
  rank: string;
  skills: string;
};

type UserCreateCardProps = {
  creating: boolean;
  onCreate: (payload: AdminCreateUserPayload) => Promise<void>;
};

export const UserCreateCard: React.FC<UserCreateCardProps> = ({
  creating,
  onCreate,
}) => {
  const [form, setForm] = useState<NewUserForm>({
    username: "",
    password: "",
    role: "user",
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: AdminCreateUserPayload = {
      username: form.username,
      password: form.password,
      role: form.role === "admin" ? "admin" : "user",
      display_name: form.display_name || null,
      job_title: form.job_title || null,
      team_name: form.team_name || null,
      rank: form.rank || null,
      skills: form.skills || null,
    };

    await onCreate(payload);

    // Reset on successful create
    setForm({
      username: "",
      password: "",
      role: "user",
      display_name: "",
      job_title: "",
      team_name: "",
      rank: "",
      skills: "",
    });
  };

  const fieldLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--dc-font-size-xs)",
    fontWeight: 500,
    marginBottom: "0.15rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.35rem 0.5rem",
    borderRadius: "var(--dc-radius-sm)",
    border: "1px solid var(--dc-border-subtle)",
    fontSize: "var(--dc-font-size-sm)",
    backgroundColor: "var(--dc-bg-subtle)",
  };

  return (
    <Card
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--dc-font-size-md)",
            fontWeight: 600,
          }}
        >
          Create New User
        </h2>
        <p
          style={{
            margin: 0,
            marginTop: "0.25rem",
            fontSize: "var(--dc-font-size-xs)",
            color: "var(--dc-text-muted)",
          }}
        >
          Create accounts for new team members and assign their initial role.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}
      >
        <div>
          <label style={fieldLabelStyle} htmlFor="admin-new-username">
            Username
          </label>
          <input
            id="admin-new-username"
            name="username"
            required
            value={form.username}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle} htmlFor="admin-new-password">
            Password
          </label>
          <input
            id="admin-new-password"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle} htmlFor="admin-new-role">
            Role
          </label>
          <select
            id="admin-new-role"
            name="role"
            value={form.role}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.5rem",
          }}
        >
          <div>
            <label style={fieldLabelStyle} htmlFor="admin-new-display-name">
              Display name
            </label>
            <input
              id="admin-new-display-name"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle} htmlFor="admin-new-job-title">
              Job title
            </label>
            <input
              id="admin-new-job-title"
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle} htmlFor="admin-new-team-name">
              Team name
            </label>
            <input
              id="admin-new-team-name"
              name="team_name"
              value={form.team_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle} htmlFor="admin-new-rank">
              Rank
            </label>
            <input
              id="admin-new-rank"
              name="rank"
              value={form.rank}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={fieldLabelStyle} htmlFor="admin-new-skills">
            Skills (notes)
          </label>
          <textarea
            id="admin-new-skills"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "0.35rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create user"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
