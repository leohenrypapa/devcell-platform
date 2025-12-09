// filename: frontend/src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import PageHeader from "../ui/PageHeader";

const LoginPage: React.FC = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      className="dc-page dc-page-auth"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "var(--dc-bg-body)",
      }}
    >
      <div
        className="dc-page-inner"
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <Card
          style={{
            padding: "1.75rem",
          }}
        >
          <PageHeader
            title="Sign in to DevCell"
            description="Access tasks, standups, knowledge, and training in your local workspace."
          />

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label
                  htmlFor="username"
                  style={{
                    display: "block",
                    fontSize: "var(--dc-font-size-xs)",
                    fontWeight: 500,
                    color: "var(--dc-text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.6rem",
                    borderRadius: "var(--dc-radius-sm)",
                    border: "1px solid var(--dc-border-subtle)",
                    fontSize: "var(--dc-font-size-sm)",
                    backgroundColor: "var(--dc-bg-input)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "var(--dc-font-size-xs)",
                    fontWeight: 500,
                    color: "var(--dc-text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Password
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{
                      flex: 1,
                      padding: "0.45rem 0.6rem",
                      borderRadius: "var(--dc-radius-sm)",
                      border: "1px solid var(--dc-border-subtle)",
                      fontSize: "var(--dc-font-size-sm)",
                      backgroundColor: "var(--dc-bg-input)",
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      fontSize: "var(--dc-font-size-xs)",
                      padding: "0.35rem 0.6rem",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
                <p
                  style={{
                    marginTop: "0.25rem",
                    marginBottom: 0,
                    fontSize: "var(--dc-font-size-xs)",
                    color: "var(--dc-text-muted)",
                  }}
                >
                  DevCell uses short-lived tokens; your password is never stored
                  in the browser.
                </p>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--dc-radius-sm)",
                  fontSize: "var(--dc-font-size-xs)",
                  backgroundColor: "var(--dc-bg-danger-subtle)",
                  color: "var(--dc-text-danger)",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <span
                style={{
                  fontSize: "var(--dc-font-size-xs)",
                  color: "var(--dc-text-muted)",
                  textAlign: "right",
                }}
              >
                First admin is created via <code>/auth/register</code> on the
                backend.
              </span>
            </div>

            <p
              style={{
                marginTop: "1.25rem",
                fontSize: "var(--dc-font-size-sm)",
                color: "var(--dc-text-muted)",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "var(--dc-color-primary)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Create one
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
