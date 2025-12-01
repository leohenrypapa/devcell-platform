import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const RegisterPage: React.FC = () => {
  const { setUserAndToken } = useUser() as any; // adjust hook if needed
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${backendBase}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          display_name: form.display_name || null,
          job_title: form.job_title || null,
          team_name: form.team_name || null,
          rank: form.rank || null,
          skills: form.skills || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Registration failed.");
      }

      const data = await res.json();
      // data: { access_token, token_type, user }
      setUserAndToken(data.user, data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "2rem auto" }}>
      <h1>Create Account</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Register as a new user. You will start with role <strong>user</strong>.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Display Name
          <input
            name="display_name"
            value={form.display_name}
            onChange={onChange}
            placeholder="e.g. CPT You"
          />
        </label>

        <label>
          Job Title
          <input
            name="job_title"
            value={form.job_title}
            onChange={onChange}
            placeholder="e.g. Dev Cell Lead"
          />
        </label>

        <label>
          Team Name
          <input
            name="team_name"
            value={form.team_name}
            onChange={onChange}
            placeholder="e.g. CSD-D Dev Cell"
          />
        </label>

        <label>
          Rank
          <input
            name="rank"
            value={form.rank}
            onChange={onChange}
            placeholder="e.g. CPT, SSG, GS-13"
          />
        </label>

        <label>
          Skills
          <textarea
            name="skills"
            value={form.skills}
            onChange={onChange}
            placeholder="Optional: Python, FastAPI, malware dev..."
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
