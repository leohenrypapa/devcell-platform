// filename: frontend/src/pages/TrainingPage.tsx

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

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

const TrainingPage: React.FC = () => {
  const { token, user } = useUser();

  const [syllabus, setSyllabus] = useState<MalwareTrainingSyllabus | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  const [taskCount, setTaskCount] = useState<number>(4);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);

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
      const res = await fetch(
        `${backendBase}/api/training/malware/syllabus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load syllabus: ${res.status} ${res.statusText} — ${text}`
        );
      }

      const data = (await res.json()) as MalwareTrainingSyllabus;
      setSyllabus(data);
      if (data.weeks && data.weeks.length > 0) {
        setSelectedWeek(data.weeks[0].week);
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setSyllabusError(err?.message ?? "Failed to load syllabus.");
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!token) {
      setCreateError("You must be logged in to generate tasks.");
      return;
    }

    setCreatingTasks(true);
    setCreateError(null);
    setCreatedTasks([]);

    try {
      const res = await fetch(
        `${backendBase}/api/training/malware/seed_tasks`,
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
        }
      );

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          `Failed to generate tasks: ${res.status} ${res.statusText} — ${text}`
        );
      }

      const data = JSON.parse(text) as TaskListResponse;
      setCreatedTasks(data.items || []);
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

  if (!token || !user) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h1>Training</h1>
        <p>You must be logged in to access the malware training pipeline.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Malware Developer Training</h1>
      <p style={{ maxWidth: "48rem" }}>
        This page automates the <strong>24-week malware developer syllabus</strong>.
        Select a week, review the syllabus, and then let the system generate
        a few benign, lab-only seed tasks for you. Tasks are saved to your
        existing <strong>Tasks</strong> board.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {/* Week selection + syllabus */}
        <div
          style={{
            flex: "1 1 320px",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Weekly Syllabus</h2>

          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              <span style={{ marginRight: "0.5rem" }}>Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {syllabus?.weeks?.map((w) => (
                  <option key={w.week} value={w.week}>
                    Week {w.week}: {w.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={loadSyllabus}
              style={{ marginLeft: "0.75rem" }}
              disabled={loadingSyllabus}
            >
              {loadingSyllabus ? "Refreshing..." : "Reload Syllabus"}
            </button>
          </div>

          {syllabusError && (
            <p style={{ color: "red", whiteSpace: "pre-wrap" }}>
              {syllabusError}
            </p>
          )}

          {currentWeek ? (
            <div>
              <h3>
                Week {currentWeek.week}: {currentWeek.title}
              </h3>
              <p>
                <strong>Focus:</strong> {currentWeek.focus}
              </p>

              <div>
                <strong>Objectives:</strong>
                <ul>
                  {currentWeek.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong>Labs:</strong>
                <ul>
                  {currentWeek.labs.map((lab, idx) => (
                    <li key={idx}>{lab}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            !loadingSyllabus && (
              <p>No syllabus data loaded yet. Try clicking &quot;Reload Syllabus&quot;.</p>
            )
          )}
        </div>

        {/* Seed task generator */}
        <div
          style={{
            flex: "1 1 320px",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Generate Seed Tasks</h2>
          <p style={{ fontSize: "0.9rem" }}>
            Tasks will be created under your account (
            <code>{user.username}</code>) as status <code>todo</code>. They are
            designed to be <strong>defensive, lab-only, and benign</strong>.
          </p>

          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              <span style={{ marginRight: "0.5rem" }}>Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {syllabus?.weeks?.map((w) => (
                  <option key={w.week} value={w.week}>
                    Week {w.week}: {w.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label>
              <span style={{ marginRight: "0.5rem" }}>Task count:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={taskCount}
                onChange={(e) =>
                  setTaskCount(
                    Math.max(1, Math.min(10, Number(e.target.value) || 1))
                  )
                }
                style={{ width: "4rem" }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerateTasks}
            disabled={creatingTasks || !syllabus}
          >
            {creatingTasks ? "Generating..." : "Generate seed tasks"}
          </button>

          {createError && (
            <p style={{ marginTop: "0.75rem", color: "red", whiteSpace: "pre-wrap" }}>
              {createError}
            </p>
          )}

          {createdTasks.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>Created Tasks</h3>
              <p style={{ fontSize: "0.9rem" }}>
                These tasks are now visible on your <strong>Tasks</strong> page.
              </p>
              <ul>
                {createdTasks.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                    {t.due_date && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                        (due {t.due_date})
                      </span>
                    )}
                    <div style={{ fontSize: "0.9rem" }}>{t.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TrainingPage;
