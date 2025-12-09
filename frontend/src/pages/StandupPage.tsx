// frontend/src/pages/StandupPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";

import type { Project } from "../lib/tasks";
import { useStandupEntries } from "../features/standups/useStandupEntries";
import { useStandupTasks } from "../features/standups/useStandupTasks";
import StandupHeader from "../features/standups/StandupHeader";
import StandupForm from "../features/standups/StandupForm";
import StandupList from "../features/standups/StandupList";
import StandupMyTasksPanel from "../features/standups/StandupMyTasksPanel";
import StandupSummarySection from "../features/standups/StandupSummarySection";
import StandupTaskConvertModal from "../components/StandupTaskConvertModal";

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

const todayIso = () => new Date().toISOString().slice(0, 10);

const StandupPage: React.FC = () => {
  const { user, isAuthenticated, token } = useUser();
  const { showToast } = useToast();
  const location = useLocation();

  const loggedInName = user?.username ?? "";

  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [focusStandupId, setFocusStandupId] = useState<number | null>(() => {
    const state = location.state as any;
    return state?.focusStandupId ?? null;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    entries,
    loadingEntries,
    entriesError,
    reloadEntries,
    linkedTasksByStandup,
    loadingLinkedTasksByStandup,
    loadLinkedTasksForStandup,
    createOrUpdateStandup,
    deleteStandup,
  } = useStandupEntries(selectedDate);

  const {
    tasks,
    loadingTasks,
    taskError,
    reloadTasks: reloadMyTasks,
  } = useStandupTasks();

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!token) {
        setProjects([]);
        return;
      }
      try {
        const res = await fetch(`${backendBase}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: Project[] };
        setProjects(data.items || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (isAuthenticated) {
      void loadProjects();
    } else {
      setProjects([]);
    }
  }, [isAuthenticated, token]);

  // When editing, prefill fields
  useEffect(() => {
    if (!editingEntry) return;
    setYesterday(editingEntry.yesterday || "");
    setToday(editingEntry.today || "");
    setBlockers(editingEntry.blockers || "");
    setSelectedProjectId(editingEntry.project_id ?? null);
  }, [editingEntry]);

  const handleSubmitStandup = async () => {
    if (!isAuthenticated) {
      showToast("You must be logged in to submit a standup.", "error");
      return;
    }
    setSubmitting(true);
    await createOrUpdateStandup({
      editingId,
      name: loggedInName,
      yesterday,
      today,
      blockers,
      projectId: selectedProjectId,
    });
    setSubmitting(false);
    setEditingId(null);
    setEditingEntry(null);
    setYesterday("");
    setToday("");
    setBlockers("");
    // refresh tasks if project filter used
    void reloadMyTasks(selectedProjectId ?? undefined);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingEntry(null);
    setYesterday("");
    setToday("");
    setBlockers("");
    setSelectedProjectId(null);
  };

  const handleEditEntry = (entry: any) => {
    setEditingId(entry.id);
    setEditingEntry(entry);
    setFocusStandupId(entry.id);
  };

  const handleDeleteEntry = async (entry: any) => {
    await deleteStandup(entry.id);
    if (focusStandupId === entry.id) {
      setFocusStandupId(null);
    }
  };

  const [convertStandup, setConvertStandup] = useState<any | null>(null);

  const filteredEntries = useMemo(() => entries, [entries]);

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "1100px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "2.2fr 1fr",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <div>
        <StandupHeader
          selectedDate={selectedDate}
          onChangeDate={(value) => {
            setSelectedDate(value);
            setFocusStandupId(null);
          }}
          showMineOnly={showMineOnly}
          onToggleMineOnly={setShowMineOnly}
        />

        {!isAuthenticated && (
          <p style={{ color: "red", marginBottom: "0.5rem" }}>
            You must be logged in to create and view standups.
          </p>
        )}

        <StandupForm
          loggedInName={loggedInName}
          projects={projects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          yesterday={yesterday}
          today={today}
          blockers={blockers}
          setYesterday={setYesterday}
          setToday={setToday}
          setBlockers={setBlockers}
          editingEntry={editingEntry}
          submitting={submitting}
          onSubmit={handleSubmitStandup}
          onCancelEdit={handleCancelEdit}
        />

        {entriesError && (
          <div style={{ color: "red", marginBottom: "0.5rem" }}>
            {entriesError}
          </div>
        )}

        {loadingEntries && <p>Loading standups…</p>}

        {!loadingEntries && (
          <StandupList
            entries={filteredEntries}
            loggedInName={loggedInName}
            showMineOnly={showMineOnly}
            focusStandupId={focusStandupId}
            linkedTasksByStandup={linkedTasksByStandup}
            loadingLinkedTasksByStandup={loadingLinkedTasksByStandup}
            onLoadLinkedTasksForStandup={loadLinkedTasksForStandup}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onConvertToTasks={(entry) => setConvertStandup(entry)}
          />
        )}

        <StandupSummarySection selectedDate={selectedDate} />
      </div>

      <StandupMyTasksPanel
        tasks={tasks}
        projects={projects}
        loadingTasks={loadingTasks}
        taskError={taskError}
        selectedProjectId={selectedProjectId}
        onChangeProjectFilter={(val) => {
          setSelectedProjectId(val);
          void reloadMyTasks(val ?? undefined);
        }}
        onReload={() => reloadMyTasks(selectedProjectId ?? undefined)}
      />

      {convertStandup && (
        <StandupTaskConvertModal
          standup={convertStandup}
          projects={projects}
          backendBase={backendBase}
          onClose={() => setConvertStandup(null)}
          onConverted={(result) => {
            setConvertStandup(null);
            showToast(
              `Created ${result.count} task(s) from standup.`,
              "success",
            );
            reloadMyTasks(selectedProjectId ?? undefined);
          }}
        />
      )}
    </div>
  );
};

export default StandupPage;
