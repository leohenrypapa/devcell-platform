// frontend/src/features/dashboard/useDashboardSummary.ts
import { useCallback, useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_BASE } from "../../lib/backend";

/**
 * Lightweight preview types for richer dashboard sections.
 * These are optional and will simply be undefined if the backend
 * does not (yet) return them. That keeps the hook backwards-compatible.
 */

export type DashboardTaskPreview = {
  id: number;
  title: string;
  status: string;
  due_date?: string | null;
  project_name?: string | null;
};

export type DashboardStandupPreview = {
  id: number;
  author: string;
  created_at: string;
  today: string;
  yesterday?: string | null;
};

export type DashboardProjectPreview = {
  id: number;
  name: string;
  status: string;
  active_tasks: number;
};

export type DashboardTrainingStatus = {
  current_module?: string | null;
  completed_steps: number;
  total_steps: number;
};

export type DashboardSummary = {
  // Existing fields used by the current UI
  summary: string;
  standup_count: number;
  project_count: number;
  knowledge_docs: number;

  // Optional richer data for upcoming slices
  tasks_recent?: DashboardTaskPreview[];
  standups_recent?: DashboardStandupPreview[];
  projects_overview?: DashboardProjectPreview[];
  training_status?: DashboardTrainingStatus | null;
};

type UseDashboardSummaryResult = {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  useRag: boolean;
  setUseRag: (value: boolean) => void;
  /**
   * Trigger a refresh. If overrideUseRag is passed, it forces that value
   * for this request (useful when toggling the RAG checkbox).
   */
  refresh: (overrideUseRag?: boolean) => void;
  /**
   * ISO timestamp of the last successful fetch, or null if we haven't
   * loaded anything yet.
   */
  lastUpdated: string | null;
};

export const useDashboardSummary = (): UseDashboardSummaryResult => {
  const { token } = useUser();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRag, setUseRag] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSummary = useCallback(
    async (nextUseRag: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const url = `${BACKEND_BASE}/api/dashboard/summary?use_rag=${
          nextUseRag ? "1" : "0"
        }`;

        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const resp = await fetch(url, { headers });

        if (!resp.ok) {
          throw new Error(`Request failed (${resp.status})`);
        }

        const json = (await resp.json()) as DashboardSummary;

        setData(json);
        setLastUpdated(new Date().toISOString());
      } catch (err: unknown) {
        console.error("Failed to load dashboard summary", err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Failed to load dashboard summary";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const refresh = useCallback(
    (overrideUseRag?: boolean) => {
      const next = overrideUseRag ?? useRag;
      void fetchSummary(next);
    },
    [fetchSummary, useRag],
  );

  // Auto-load on mount with the current useRag setting
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    useRag,
    setUseRag,
    refresh,
    lastUpdated,
  };
};
