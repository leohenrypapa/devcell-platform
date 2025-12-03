// filename: frontend/src/components/StandupTaskConvertModal.tsx
import React, { useEffect, useMemo, useState } from "react";

import type { RecentStandupGroup, StandupEntry } from "../lib/standups"; // RecentStandupGroup imported if needed later
import type { Project } from "../lib/tasks";
import { useToast } from "../context/ToastContext";
import { useUser } from "../context/UserContext";

type StandupSection = "yesterday" | "today" | "blockers";

type ConvertLine = {
  id: string;
  section: StandupSection;
  text: string;
  title: string;
  create: boolean;
  projectIdOverride: number | null; // null = inherit defaults
  dueDateModeOverride: "inherit" | "none" | "today" | "tomorrow";
};

type ConvertPayloadItem = {
  section: StandupSection;
  text: string;
  title: string;
  create: boolean;
  project_id: number | null;
  due_date: string | null;
  status: string;
  progress: number;
};

type ConvertDefaults = {
  projectId: number | null;
  dueDateMode: "none" | "today" | "tomorrow";
};

type ConvertResponseItem = {
  id: number;
};

const DEFAULTS_KEY = "devcell-standup-convert-defaults";

type StandupTaskConvertModalProps = {
  standup: StandupEntry;
  projects: Project[];
  backendBase: string;
  onClose: () => void;
  onConverted: (result: { count: number; taskIds: number[] }) => void;
};

const loadDefaults = (): ConvertDefaults => {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (!raw) {
      return { projectId: null, dueDateMode: "today" };
    }
    const parsed = JSON.parse(raw) as Partial<ConvertDefaults>;
    return {
      projectId:
        typeof parsed.projectId === "number" ? parsed.projectId : null,
      dueDateMode:
        parsed.dueDateMode === "none" ||
        parsed.dueDateMode === "today" ||
        parsed.dueDateMode === "tomorrow"
          ? parsed.dueDateMode
          : "today",
    };
  } catch {
    return { projectId: null, dueDateMode: "today" };
  }
};

const saveDefaults = (defaults: ConvertDefaults | null): void => {
  try {
    if (!defaults) {
      localStorage.removeItem(DEFAULTS_KEY);
      return;
    }
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
  } catch {
    // ignore
  }
};

const splitIntoLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*]\s*/, ""));

const buildInitialLines = (standup: StandupEntry): ConvertLine[] => {
  const out: ConvertLine[] = [];

  const addSection = (section: StandupSection, raw: string) => {
    const lines = splitIntoLines(raw);
    lines.forEach((line, idx) => {
      const id = `${section}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
      const title =
        line.length > 80 ? `${line.slice(0, 77).trimEnd()}...` : line;
      out.push({
        id,
        section,
        text: line,
        title,
        create: true,
        projectIdOverride: null,
        dueDateModeOverride: "inherit",
      });
    });
  };

  if (standup.yesterday) addSection("yesterday", standup.yesterday);
  if (standup.today) addSection("today", standup.today);
  if (standup.blockers) addSection("blockers", standup.blockers);

  return out;
};

const computeDueDate = (mode: ConvertDefaults["dueDateMode"]): string | null => {
  if (mode === "none") return null;
  const base = new Date();
  if (mode === "tomorrow") {
    base.setDate(base.getDate() + 1);
  }
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const StandupTaskConvertModal: React.FC<StandupTaskConvertModalProps> = ({
  standup,
  projects,
  backendBase,
  onClose,
  onConverted,
}) => {
  const { token, isAuthenticated } = useUser();
  const { showToast } = useToast();

  const [lines, setLines] = useState<ConvertLine[]>(() =>
    buildInitialLines(standup),
  );
  const initialDefaults = useMemo<ConvertDefaults>(() => loadDefaults(), []);
  const [projectId, setProjectId] = useState<number | null>(
    initialDefaults.projectId ?? standup.project_id ?? null,
  );
  const [dueDateMode, setDueDateMode] = useState<ConvertDefaults["dueDateMode"]>(
    initialDefaults.dueDateMode,
  );
  const [rememberDefaults, setRememberDefaults] = useState(
    initialDefaults.projectId !== null || initialDefaults.dueDateMode !== "none",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (standup.project_id && initialDefaults.projectId == null) {
      setProjectId(standup.project_id);
    }
  }, [standup.project_id, initialDefaults.projectId]);

  const selectedCount = lines.filter((l) => l.create && l.text.trim()).length;

  const handleToggleLine = (id: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, create: !l.create } : l)),
    );
  };

  const handleTitleChange = (id: string, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, title: value } : l)),
    );
  };

  const handleProjectOverrideChange = (id: string, value: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              projectIdOverride: value === "" ? null : Number(value),
            }
          : l,
      ),
    );
  };

  const handleDueOverrideChange = (
    id: string,
    value: "inherit" | "none" | "today" | "tomorrow",
  ) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, dueDateModeOverride: value } : l,
      ),
    );
  };

  const toggleSelectAll = () => {
    setLines((prev) => {
      const selectable = prev.filter((l) => l.text.trim().length > 0);
      const allSelected = selectable.every((l) => l.create);
      return prev.map((l) =>
        l.text.trim().length === 0 ? l : { ...l, create: !allSelected },
      );
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to convert standups into tasks.", "error");
      return;
    }

    const globalEffectiveProjectId =
      projectId != null ? projectId : standup.project_id ?? null;
    const globalDueDate =
      dueDateMode === "none" ? null : computeDueDate(dueDateMode);

    const items: ConvertPayloadItem[] = lines
      .filter((l) => l.create && l.text.trim())
      .map((l) => {
        const rawTitle = (l.title || "").trim();
        const title =
          rawTitle.length > 0
            ? rawTitle
            : l.text.length > 80
            ? `${l.text.slice(0, 77).trimEnd()}...`
            : l.text;

        const status = l.section === "blockers" ? "blocked" : "todo";

        const effectiveProjectId =
          l.projectIdOverride !== null
            ? l.projectIdOverride
            : globalEffectiveProjectId;

        let effectiveDueDate: string | null;
        switch (l.dueDateModeOverride) {
          case "inherit":
            effectiveDueDate = globalDueDate;
            break;
          case "none":
            effectiveDueDate = null;
            break;
          case "today":
            effectiveDueDate = computeDueDate("today");
            break;
          case "tomorrow":
            effectiveDueDate = computeDueDate("tomorrow");
            break;
          default:
            effectiveDueDate = globalDueDate;
        }

        return {
          section: l.section,
          text: l.text,
          title,
          create: true,
          project_id: effectiveProjectId,
          due_date: effectiveDueDate,
          status,
          progress: 0,
        };
      });

    if (items.length === 0) {
      showToast("No lines selected to convert into tasks.", "error");
      return;
    }

    if (rememberDefaults) {
      saveDefaults({
        projectId: globalEffectiveProjectId,
        dueDateMode,
      });
    } else {
      saveDefaults(null);
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${backendBase}/api/standup/${standup.id}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items }),
        },
      );

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        console.error("Conversion failed:", res.status, bodyText);
        showToast("Failed to convert standup into tasks.", "error");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      const itemsResp = Array.isArray(data.items)
        ? (data.items as ConvertResponseItem[])
        : [];
      const taskIds = itemsResp
        .map((t) => t?.id)
        .filter((id): id is number => typeof id === "number");

      onConverted({ count: taskIds.length, taskIds });
    } catch (err) {
      console.error(err);
      showToast("Failed to convert standup into tasks.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcuts: Esc (close), Enter (submit), Ctrl/Cmd+A (toggle select all)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;

      if (e.key === "Escape") {
        e.preventDefault();
        if (!submitting) {
          onClose();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        toggleSelectAll();
        return;
      }

      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        if (tag === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        if (!submitting) {
          void handleSubmit();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [submitting, onClose]); // handler only depends on these

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="standup-convert-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          padding: "1.5rem",
          width: "750px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          fontSize: "0.9rem",
        }}
      >
        <h2 id="standup-convert-title" style={{ marginTop: 0 }}>
          Convert Standup to Tasks
        </h2>
        <p style={{ opacity: 0.8 }}>
          Standup from <strong>{standup.name}</strong>. Select which lines to turn
          into tasks, edit their titles, and apply shared or per-line settings.
        </p>

        {/* Default settings */}
        <div
          style={{
            marginTop: "0.75rem",
            marginBottom: "0.85rem",
            padding: "0.75rem",
            borderRadius: "4px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "0.5rem",
              fontSize: "0.95rem",
            }}
          >
            Default Settings
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <label style={{ fontSize: "0.9rem" }}>
              Project:&nbsp;
              <select
                value={projectId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectId(val === "" ? null : Number(val));
                }}
              >
                <option value="">(standup project or none)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.status}]
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: "0.9rem" }}>
              Due date:&nbsp;
              <select
                value={dueDateMode}
                onChange={(e) =>
                  setDueDateMode(
                    e.target.value as ConvertDefaults["dueDateMode"],
                  )
                }
              >
                <option value="none">No default</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
              </select>
            </label>

            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={rememberDefaults}
                onChange={(e) => setRememberDefaults(e.target.checked)}
                style={{ marginRight: "0.35rem" }}
              />
              Remember these defaults for next time
            </label>
          </div>
        </div>

        {/* Lines list */}
        <div
          style={{
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 90px 1fr",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: "#f3f4f6",
              fontWeight: 500,
              fontSize: "0.8rem",
            }}
          >
            <div>Use</div>
            <div>Section</div>
            <div>Title, Line &amp; Overrides</div>
          </div>

          {lines.length === 0 ? (
            <div style={{ padding: "0.75rem" }}>
              No lines detected from this standup. Add text to Yesterday / Today /
              Blockers first.
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 90px 1fr",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderTop: "1px solid #e5e7eb",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={line.create}
                    onChange={() => handleToggleLine(line.id)}
                  />
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  {line.section === "yesterday"
                    ? "Yesterday"
                    : line.section === "today"
                    ? "Today"
                    : "Blockers"}
                </div>
                <div>
                  <input
                    type="text"
                    value={line.title}
                    onChange={(e) => handleTitleChange(line.id, e.target.value)}
                    placeholder="Task title"
                    style={{
                      width: "100%",
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.8,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {line.text}
                  </div>
                  <div
                    style={{
                      marginTop: "0.3rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      opacity: 0.85,
                    }}
                  >
                    <label>
                      Project:&nbsp;
                      <select
                        value={line.projectIdOverride ?? ""}
                        onChange={(e) =>
                          handleProjectOverrideChange(line.id, e.target.value)
                        }
                      >
                        <option value="">(default)</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.status}]
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Due:&nbsp;
                      <select
                        value={line.dueDateModeOverride}
                        onChange={(e) =>
                          handleDueOverrideChange(
                            line.id,
                            e.target.value as
                              | "inherit"
                              | "none"
                              | "today"
                              | "tomorrow",
                          )
                        }
                      >
                        <option value="inherit">Default</option>
                        <option value="none">None</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Selected: <strong>{selectedCount}</strong> line
            {selectedCount === 1 ? "" : "s"} &nbsp;|&nbsp;{" "}
            <span style={{ fontStyle: "italic" }}>
              Esc: close · Enter: convert · Ctrl/Cmd+A: toggle selection
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ fontSize: "0.85rem" }}
            >
              {submitting
                ? "Creating tasks..."
                : "Convert selected lines to tasks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandupTaskConvertModal;
