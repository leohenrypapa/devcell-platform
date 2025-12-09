// filename: frontend/src/pages/TrainingPage.tsx

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { BACKEND_BASE } from "../lib/backend";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Button from "../ui/Button";

type MalwareTrainingWeek = {
  week: number;
  title: string;
  focus: string;
  objectives: string[];
  labs: string[];
};

type MalwareTrainingSyllabus = {
  track: string;
  weeks: MalwareTrainingWeek[];
};

type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

type Task = {
  id: number;
  owner: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  project_id?: number | null;
  project_name?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  origin_standup_id?: number | null;
};

type TaskListResponse = {
  items: Task[];
};

const LOCAL_SELECTED_WEEK_KEY = "devcell_training_selected_week";

const TrainingPage: React.FC = () => {
  const { token, user } = useUser();

  const [syllabus, setSyllabus] = useState<MalwareTrainingSyllabus | null>(
    null,
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  const [taskCount, setTaskCount] = useState<number>(4);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<
    string | null
  >(null);

  // Load syllabus when token becomes available
  useEffect(() => {
    if (!token) {
      return;
    }
    void loadSyllabus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadSyllabus = async () => {
    if (!token) {
      setSyllabusError("You must be logged in to view training.");
      return;
    }

    setLoadingSyllabus(true);
    setSyllabusError(null);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/training/malware/syllabus`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load syllabus: ${res.status} ${res.statusText} — ${text}`,
        );
      }

      const data = (await res.json()) as MalwareTrainingSyllabus;
      setSyllabus(data);

      // Determine which week to show:
      // 1) previously selected (if present and valid)
      // 2) otherwise first week from syllabus
      let nextWeek = data.weeks?.[0]?.week ?? 1;

      try {
        const stored = window.localStorage.getItem(LOCAL_SELECTED_WEEK_KEY);
        if (stored) {
          const parsed = Number(stored);
          if (
            !Number.isNaN(parsed) &&
            data.weeks.some((w) => w.week === parsed)
          ) {
            nextWeek = parsed;
          }
        }
      } catch {
        // ignore localStorage issues
      }

      setSelectedWeek(nextWeek);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setSyllabusError(err?.message ?? "Failed to load syllabus.");
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleWeekChange = (nextWeek: number) => {
    setSelectedWeek(nextWeek);
    try {
      window.localStorage.setItem(
        LOCAL_SELECTED_WEEK_KEY,
        String(nextWeek),
      );
    } catch {
      // ignore localStorage issues
    }
  };

  const handleGenerateTasks = async () => {
    if (!token) {
      setCreateError("You must be logged in to generate tasks.");
      return;
    }

    setCreatingTasks(true);
    setCreateError(null);
    setCreateSuccessMessage(null);
    setCreatedTasks([]);

    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/training/malware/seed_tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            week: selectedWeek,
            task_count: taskCount,
          }),
        },
      );

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          `Failed to generate tasks: ${res.status} ${res.statusText} — ${text}`,
        );
      }

      const data = JSON.parse(text) as TaskListResponse;
      const items = data.items || [];
      setCreatedTasks(items);
      if (items.length > 0) {
        setCreateSuccessMessage(
          `Created ${items.length} task${items.length > 1 ? "s" : ""} for Week ${selectedWeek}.`,
        );
      } else {
        setCreateSuccessMessage(
          "No tasks were returned, but the request completed successfully.",
        );
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setCreateError(err?.message ?? "Failed to generate tasks.");
    } finally {
      setCreatingTasks(false);
    }
  };

  const currentWeek =
    syllabus?.weeks.find((w) => w.week === Number(selectedWeek)) ?? null;
  const totalWeeks = syllabus?.weeks.length ?? 0;

  if (!token || !user) {
    return (
      <div className="dc-page">
        <div className="dc-page-inner">
          <PageHeader
            title="Training"
            description="You must be logged in to access the malware training pipeline."
          />
          <Card>
            <p style={{ margin: 0 }}>
              Please log in to view the malware developer training roadmap and
              generate seed tasks.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dc-page">
      <div className="dc-page-inner">
        <PageHeader
          title="Training — Malware Developer Pipeline"
          description="View the malware training roadmap, drill into each week, and generate defensive, lab-only seed tasks directly into your Tasks board."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1.3fr)",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          {/* Left: Roadmap + Syllabus */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Roadmap header + meta */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "var(--dc-font-size-base, 1rem)",
                    }}
                  >
                    Training Roadmap
                  </h2>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "var(--dc-font-size-sm)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    Track:{" "}
                    <strong>
                      {syllabus?.track ?? "Malware Developer (Defensive)"}
                    </strong>{" "}
                    • {totalWeeks > 0 ? `${totalWeeks} weeks` : "Loading…"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={loadSyllabus}
                  disabled={loadingSyllabus}
                >
                  {loadingSyllabus ? "Refreshing…" : "Reload syllabus"}
                </Button>
              </div>

              {/* Roadmap preview list */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    flex: "0 0 200px",
                    maxHeight: "260px",
                    overflowY: "auto",
                    borderRadius: "var(--dc-radius-sm)",
                    border: "1px solid var(--dc-border-subtle)",
                    padding: "0.5rem",
                    background:
                      "var(--dc-bg-subtle, rgba(148,163,184,0.06))",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--dc-font-size-xs, 0.75rem)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--dc-text-muted)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Weeks
                  </div>
                  {loadingSyllabus && !syllabus && (
                    <div>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: "0.75rem",
                            borderRadius: "999px",
                            marginBottom: "0.4rem",
                            background:
                              "var(--dc-bg-skeleton, rgba(148,163,184,0.35))",
                            opacity: 0.6,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {!loadingSyllabus && !syllabus && !syllabusError && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--dc-font-size-sm)",
                      }}
                    >
                      No syllabus data yet. Try reloading.
                    </p>
                  )}

                  {syllabus?.weeks.map((w) => {
                    const isActive = w.week === currentWeek?.week;
                    return (
                      <button
                        key={w.week}
                        type="button"
                        onClick={() => handleWeekChange(w.week)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          borderRadius: "999px",
                          border: "none",
                          padding: "0.35rem 0.55rem",
                          marginBottom: "0.25rem",
                          fontSize: "var(--dc-font-size-xs, 0.8rem)",
                          cursor: "pointer",
                          backgroundColor: isActive
                            ? "var(--dc-color-primary, #2563eb)"
                            : "transparent",
                          color: isActive ? "#f9fafb" : "var(--dc-text-primary)",
                        }}
                      >
                        Week {w.week}: {w.title}
                      </button>
                    );
                  })}
                </div>

                {/* Current week syllabus details */}
                <div
                  style={{
                    flex: "1 1 260px",
                    minWidth: 0,
                  }}
                >
                  {syllabusError && (
                    <div
                      style={{
                        marginBottom: "0.75rem",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--dc-radius-sm)",
                        background:
                          "var(--dc-bg-error-subtle, rgba(248,113,113,0.08))",
                        border: "1px solid rgba(220,38,38,0.35)",
                        color: "var(--dc-text-error, #b91c1c)",
                        fontSize: "var(--dc-font-size-sm)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {syllabusError}
                    </div>
                  )}

                  {loadingSyllabus && (
                    <div>
                      <div
                        style={{
                          height: "1.1rem",
                          borderRadius: "0.4rem",
                          marginBottom: "0.5rem",
                          background:
                            "var(--dc-bg-skeleton, rgba(148,163,184,0.35))",
                          opacity: 0.6,
                        }}
                      />
                      <div
                        style={{
                          height: "0.85rem",
                          borderRadius: "0.4rem",
                          marginBottom: "0.4rem",
                          background:
                            "var(--dc-bg-skeleton, rgba(148,163,184,0.35))",
                          opacity: 0.5,
                        }}
                      />
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: "0.75rem",
                            borderRadius: "0.4rem",
                            marginBottom: "0.3rem",
                            background:
                              "var(--dc-bg-skeleton, rgba(148,163,184,0.35))",
                            opacity: 0.4,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {!loadingSyllabus && !currentWeek && !syllabusError && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--dc-font-size-sm)",
                      }}
                    >
                      No week selected yet. Use the list on the left to pick a
                      week from the roadmap.
                    </p>
                  )}

                  {currentWeek && !loadingSyllabus && (
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            "var(--dc-font-size-base, 1.05rem)",
                        }}
                      >
                        Week {currentWeek.week}: {currentWeek.title}
                      </h3>
                      <p
                        style={{
                          margin: "0.35rem 0 0.75rem",
                          fontSize: "var(--dc-font-size-sm)",
                          color: "var(--dc-text-muted)",
                        }}
                      >
                        <strong>Focus:</strong> {currentWeek.focus}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1.1fr) minmax(0, 1fr)",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "var(--dc-font-size-xs, 0.8rem)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "var(--dc-text-muted)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Objectives
                          </div>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "1.1rem",
                              fontSize: "var(--dc-font-size-sm)",
                              lineHeight: 1.45,
                            }}
                          >
                            {currentWeek.objectives.map((obj, idx) => (
                              <li key={idx}>{obj}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "var(--dc-font-size-xs, 0.8rem)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "var(--dc-text-muted)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Labs
                          </div>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "1.1rem",
                              fontSize: "var(--dc-font-size-sm)",
                              lineHeight: 1.45,
                            }}
                          >
                            {currentWeek.labs.map((lab, idx) => (
                              <li key={idx}>{lab}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Right: Seed Task Generator */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "var(--dc-font-size-base, 1rem)",
                  }}
                >
                  Generate Seed Tasks
                </h2>
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    fontSize: "var(--dc-font-size-sm)",
                    color: "var(--dc-text-muted)",
                  }}
                >
                  Tasks will be created under your account (
                  <code>{user.username}</code>) with status{" "}
                  <code>todo</code>. They are designed to be{" "}
                  <strong>defensive, lab-only, and benign</strong>.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "0.35rem",
                }}
              >
                <label
                  style={{
                    fontSize: "var(--dc-font-size-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Week
                  </span>
                  <select
                    value={selectedWeek}
                    onChange={(e) =>
                      handleWeekChange(Number(e.target.value))
                    }
                    style={{
                      borderRadius: "var(--dc-radius-sm)",
                      border: "1px solid var(--dc-border-subtle)",
                      padding: "0.4rem 0.5rem",
                      fontSize: "var(--dc-font-size-sm)",
                      background: "var(--dc-bg-surface)",
                    }}
                  >
                    {syllabus?.weeks?.map((w) => (
                      <option key={w.week} value={w.week}>
                        Week {w.week}: {w.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    fontSize: "var(--dc-font-size-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Task count
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={taskCount}
                    onChange={(e) =>
                      setTaskCount(
                        Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                      )
                    }
                    style={{
                      width: "4.5rem",
                      borderRadius: "var(--dc-radius-sm)",
                      border: "1px solid var(--dc-border-subtle)",
                      padding: "0.4rem 0.5rem",
                      fontSize: "var(--dc-font-size-sm)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--dc-font-size-xs, 0.8rem)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    Usually 3–6 tasks per week gives a good signal without
                    overloading the board.
                  </span>
                </label>
              </div>

              <div
                style={{
                  marginTop: "0.25rem",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Button
                  onClick={handleGenerateTasks}
                  disabled={
                    creatingTasks || !syllabus || !syllabus.weeks.length
                  }
                >
                  {creatingTasks ? "Generating…" : "Generate seed tasks"}
                </Button>
              </div>

              {createError && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--dc-radius-sm)",
                    background:
                      "var(--dc-bg-error-subtle, rgba(248,113,113,0.08))",
                    border: "1px solid rgba(220,38,38,0.35)",
                    color: "var(--dc-text-error, #b91c1c)",
                    fontSize: "var(--dc-font-size-sm)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {createError}
                </div>
              )}

              {createSuccessMessage && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--dc-radius-sm)",
                    background:
                      "var(--dc-bg-success-subtle, rgba(22,163,74,0.06))",
                    border: "1px solid rgba(22,163,74,0.35)",
                    color: "var(--dc-text-success, #166534)",
                    fontSize: "var(--dc-font-size-sm)",
                  }}
                >
                  {createSuccessMessage} They are now visible on your{" "}
                  <strong>Tasks</strong> page.
                </div>
              )}

              {createdTasks.length > 0 && (
                <div
                  style={{
                    marginTop: "0.75rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "var(--dc-font-size-sm)",
                    }}
                  >
                    Created tasks
                  </h3>
                  <p
                    style={{
                      margin: "0.25rem 0 0.5rem",
                      fontSize: "var(--dc-font-size-xs, 0.8rem)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    A quick preview of what was created. For full control, go to
                    the <strong>Tasks</strong> page.
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      marginTop: "0.25rem",
                      paddingLeft: "1.1rem",
                      fontSize: "var(--dc-font-size-sm)",
                    }}
                  >
                    {createdTasks.map((t) => (
                      <li
                        key={t.id}
                        style={{
                          marginBottom: "0.35rem",
                        }}
                      >
                        <div>
                          <strong>{t.title}</strong>
                          {t.due_date && (
                            <span
                              style={{
                                marginLeft: "0.4rem",
                                fontSize:
                                  "var(--dc-font-size-xs, 0.8rem)",
                                color: "var(--dc-text-muted)",
                              }}
                            >
                              (due {t.due_date})
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <div
                            style={{
                              fontSize:
                                "var(--dc-font-size-xs, 0.8rem)",
                              color: "var(--dc-text-muted)",
                            }}
                          >
                            {t.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
