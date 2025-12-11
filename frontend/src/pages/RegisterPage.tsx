// filename: frontend/src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { api, BACKEND_BASE } from "../lib/backend";
import Card from "../ui/Card";
import Button from "../ui/Button";
import PageHeader from "../ui/PageHeader";

const RegisterPage: React.FC = () => {
  const { setUserAndToken } = useUser();
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      const res = await api("/api/auth/register", {
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
        // Prefer backend-provided detail if present
        throw new Error(
          data.detail || data.message || "Registration failed. Please try again.",
        );
      }

      const data = await res.json();
      // data: { access_token, token_type, user }
      if (data.user && data.access_token) {
        setUserAndToken(data.user, data.access_token);
      }

      navigate("/");
    } catch (err: any) {
      console.error("[DevCell] Registration failed", err);
      setError(err.message || "Registration failed. Please try again.");
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
          maxWidth: "520px",
        }}
      >
        <Card
          style={{
            padding: "1.75rem",
          }}
        >
          <PageHeader
            title="Create your DevCell account"
            description="New users start as regular users. The very first user created becomes an admin."
          />

          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {error && (
              <div
                style={{
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

            {/* Account section */}
            <section>
              <h2
                style={{
                  margin: 0,
                  marginBottom: "0.5rem",
                  fontSize: "var(--dc-font-size-sm)",
                  fontWeight: 600,
                }}
              >
                Account
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
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
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    required
                    autoComplete="username"
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
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      required
                      autoComplete="new-password"
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
                    Use a strong password; DevCell stores only hashed credentials
                    on the server.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Confirm Password
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={onChange}
                      required
                      autoComplete="new-password"
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
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      style={{
                        fontSize: "var(--dc-font-size-xs)",
                        padding: "0.35rem 0.6rem",
                      }}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile section */}
            <section>
              <h2
                style={{
                  margin: 0,
                  marginBottom: "0.5rem",
                  fontSize: "var(--dc-font-size-sm)",
                  fontWeight: 600,
                }}
              >
                Profile (optional)
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    htmlFor="display_name"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Display Name
                  </label>
                  <input
                    id="display_name"
                    name="display_name"
                    value={form.display_name}
                    onChange={onChange}
                    placeholder="e.g. CPT You"
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
                    htmlFor="job_title"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Job Title
                  </label>
                  <input
                    id="job_title"
                    name="job_title"
                    value={form.job_title}
                    onChange={onChange}
                    placeholder="e.g. DevCell Lead"
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
                    htmlFor="team_name"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Team Name
                  </label>
                  <input
                    id="team_name"
                    name="team_name"
                    value={form.team_name}
                    onChange={onChange}
                    placeholder="e.g. CSD-D DevCell"
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
                    htmlFor="rank"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Rank
                  </label>
                  <input
                    id="rank"
                    name="rank"
                    value={form.rank}
                    onChange={onChange}
                    placeholder="e.g. CPT, SSG, GS-13"
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
                    htmlFor="skills"
                    style={{
                      display: "block",
                      fontSize: "var(--dc-font-size-xs)",
                      fontWeight: 500,
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Skills
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={form.skills}
                    onChange={onChange}
                    placeholder="Optional: Python, FastAPI, malware dev..."
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "var(--dc-radius-sm)",
                      border: "1px solid var(--dc-border-subtle)",
                      fontSize: "var(--dc-font-size-sm)",
                      backgroundColor: "var(--dc-bg-input)",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>

              <p
                style={{
                  margin: 0,
                  fontSize: "var(--dc-font-size-sm)",
                  color: "var(--dc-text-muted)",
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "var(--dc-color-primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Optional small debug hint in dev mode */}
          {import.meta.env.DEV && (
            <p
              style={{
                marginTop: "1rem",
                marginBottom: 0,
                fontSize: "var(--dc-font-size-xs)",
                color: "var(--dc-text-muted)",
              }}
            >
              Using backend at <code>{BACKEND_BASE}</code>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
