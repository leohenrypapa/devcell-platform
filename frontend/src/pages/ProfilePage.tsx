// filename: frontend/src/pages/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const ProfilePage: React.FC = () => {
  // NOTE: setUser isn't declared on UserContextValue yet, so we keep `as any`.
  const { user, token, setUser } = useUser() as any;

  const [form, setForm] = useState({
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm_new: "",
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || "",
        job_title: user.job_title || "",
        team_name: user.team_name || "",
        rank: user.rank || "",
        skills: user.skills || "",
      });
    }
  }, [user]);

  const onProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPwForm((f) => ({ ...f, [name]: value }));
  };

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch(`${backendBase}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(data.detail || "Failed to update profile.");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setMsg("Profile updated.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile.";
      setErr(message);
    }
  };

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (pwForm.new_password !== pwForm.confirm_new) {
      setErr("New passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${backendBase}/api/auth/change_password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: pwForm.old_password,
          new_password: pwForm.new_password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(data.detail || "Failed to change password.");
      }

      setMsg("Password changed.");
      setPwForm({ old_password: "", new_password: "", confirm_new: "" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to change password.";
      setErr(message);
    }
  };

  if (!user) {
    return <p>You must be logged in to view your profile.</p>;
  }

  return (
    <div>
      <h1>My Profile</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Username: <strong>{user.username}</strong> | Role:{" "}
        <strong>{user.role}</strong>
      </p>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      <h2>Profile</h2>
      <form
        onSubmit={saveProfile}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: 480,
        }}
      >
        <label>
          Display Name
          <input
            name="display_name"
            value={form.display_name}
            onChange={onProfileChange}
          />
        </label>

        <label>
          Job Title
          <input
            name="job_title"
            value={form.job_title}
            onChange={onProfileChange}
          />
        </label>

        <label>
          Team Name
          <input
            name="team_name"
            value={form.team_name}
            onChange={onProfileChange}
          />
        </label>

        <label>
          Rank
          <input
            name="rank"
            value={form.rank}
            onChange={onProfileChange}
          />
        </label>

        <label>
          Skills
          <textarea
            name="skills"
            value={form.skills}
            onChange={onProfileChange}
          />
        </label>

        <button type="submit">Save Profile</button>
      </form>

      <h2 style={{ marginTop: "2rem" }}>Change Password</h2>
      <form
        onSubmit={changePassword}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: 480,
        }}
      >
        <label>
          Old Password
          <input
            type="password"
            name="old_password"
            value={pwForm.old_password}
            onChange={onPwChange}
            required
          />
        </label>

        <label>
          New Password
          <input
            type="password"
            name="new_password"
            value={pwForm.new_password}
            onChange={onPwChange}
            required
          />
        </label>

        <label>
          Confirm New Password
          <input
            type="password"
            name="confirm_new"
            value={pwForm.confirm_new}
            onChange={onPwChange}
            required
          />
        </label>

        <button type="submit">Change Password</button>
      </form>
    </div>
  );
};

export default ProfilePage;
