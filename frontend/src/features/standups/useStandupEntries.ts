// frontend/src/features/standups/useStandupEntries.ts
import { useCallback, useEffect, useState } from "react";

import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { BACKEND_BASE } from "../../lib/backend";
import type { StandupEntry } from "../../lib/standups";
import type { Task, TaskListResponse } from "../../lib/tasks";

export type StandupListResponse = {
  items: StandupEntry[];
};

type LinkedTasksMap = Record<number, Task[]>;
type LinkedLoadingMap = Record<number, boolean>;

export type UseStandupEntriesResult = {
  entries: StandupEntry[];
  loadingEntries: boolean;
  entriesError: string | null;
  reloadEntries: () => void;

  linkedTasksByStandup: LinkedTasksMap;
  loadingLinkedTasksByStandup: LinkedLoadingMap;
  loadLinkedTasksForStandup: (standupId: number) => void;

  createOrUpdateStandup: (args: {
    editingId: number | null;
    name: string;
    yesterday: string;
    today: string;
    blockers: string;
    projectId: number | null;
  }) => Promise<void>;

  deleteStandup: (id: number) => Promise<void>;
};

const backendBase = BACKEND_BASE;

export const useStandupEntries = (
  selectedDate: string,
): UseStandupEntriesResult => {
  const { token, isAuthenticated } = useUser();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [linkedTasksByStandup, setLinkedTasksByStandup] =
    useState<LinkedTasksMap>({});
  const [loadingLinkedTasksByStandup, setLoadingLinkedTasksByStandup] =
    useState<LinkedLoadingMap>({});

  const loadEntriesForDate = useCallback(
    async (dateStr: string) => {
      if (!token) {
        setEntries([]);
        return;
      }

      setLoadingEntries(true);
      setEntriesError(null);

      try {
        const res = await fetch(
          `${backendBase}/api/standup/by-date?date=${encodeURIComponent(
            dateStr,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as StandupListResponse;
        setEntries(data.items ?? []);
      } catch (err) {
        console.error(err);
        setEntriesError("Failed to load standups for selected date.");
      } finally {
        setLoadingEntries(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setEntries([]);
      return;
    }
    if (selectedDate) {
      void loadEntriesForDate(selectedDate);
    }
  }, [isAuthenticated, selectedDate, loadEntriesForDate]);

  const reloadEntries = () => {
    if (selectedDate) void loadEntriesForDate(selectedDate);
  };

  const loadLinkedTasksForStandup = async (standupId: number) => {
    if (!isAuthenticated || !token) {
      return;
    }
    setLoadingLinkedTasksByStandup((prev) => ({ ...prev, [standupId]: true }));
    try {
      const res = await fetch(
        `${backendBase}/api/standup/${standupId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as TaskListResponse;
      setLinkedTasksByStandup((prev) => ({
        ...prev,
        [standupId]: data.items || [],
      }));
    } catch (err) {
      console.error(err);
      showToast("Failed to load linked tasks for this standup.", "error");
    } finally {
      setLoadingLinkedTasksByStandup((prev) => ({
        ...prev,
        [standupId]: false,
      }));
    }
  };

  const createOrUpdateStandup: UseStandupEntriesResult["createOrUpdateStandup"] =
    async ({ editingId, name, yesterday, today, blockers, projectId }) => {
      if (!isAuthenticated || !token) {
        showToast("You must be signed in to submit a standup.", "error");
        return;
      }

      if (!today.trim()) {
        showToast("'Today' field is required.", "error");
        return;
      }

      const body: any = {
        name: name || "Unknown",
        yesterday,
        today,
        blockers,
      };
      if (projectId !== null) {
        body.project_id = projectId;
      }

      let url = `${backendBase}/api/standup`;
      let method: "POST" | "PUT" = "POST";
      if (editingId !== null) {
        url = `${backendBase}/api/standup/${editingId}`;
        method = "PUT";
      }

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast(
          editingId ? "Standup updated." : "Standup submitted.",
          "success",
        );
        reloadEntries();
      } catch (err) {
        console.error(err);
        showToast(
          editingId
            ? "Failed to update standup."
            : "Failed to submit standup.",
          "error",
        );
      }
    };

  const deleteStandup = async (id: number) => {
    if (!isAuthenticated || !token) {
      showToast("You must be signed in to delete a standup.", "error");
      return;
    }
    const confirmed = window.confirm("Delete this standup entry?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendBase}/api/standup/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Delete failed:", res.status);
        showToast("Failed to delete standup.", "error");
        return;
      }

      showToast("Standup entry deleted.", "success");
      reloadEntries();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete standup.", "error");
    }
  };

  return {
    entries,
    loadingEntries,
    entriesError,
    reloadEntries,
    linkedTasksByStandup,
    loadingLinkedTasksByStandup,
    loadLinkedTasksForStandup,
    createOrUpdateStandup,
    deleteStandup,
  };
};
