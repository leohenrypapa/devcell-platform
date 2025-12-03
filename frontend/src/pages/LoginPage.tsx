// filename: frontend/src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const LoginPage: React.FC = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ok = await login(username, password);
      if (!ok) {
        setError("Invalid username or password.");
        return;
      }
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "4rem auto",
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "1.5rem",
      }}
    >
      <h1>Sign In</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        First user is created via <code>/auth/register</code> on the backend and
        becomes admin.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              autoComplete="username"
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem" }}
              autoComplete="current-password"
              required
            />
          </label>
        </div>
        {error && (
          <div style={{ color: "red", marginBottom: "0.75rem" }}>{error}</div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
