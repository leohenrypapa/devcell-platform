// frontend/src/features/projects/useProjectSummary.ts
import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_BASE } from "../../lib/backend";

export type ProjectSummaryResponse = {
  project_id: number;
  project_name: string;
  summary: string;
  count: number;
};

export type UseProjectSummaryResult = {
  summaryData: ProjectSummaryResponse | null;
  summaryLoading: boolean;
  summaryError: string | null;
  summarizeProject: (projectId: number) => Promise<void>;
};

export const useProjectSummary = (): UseProjectSummaryResult => {
  const { token } = useUser();

  const [summaryData, setSummaryData] =
    useState<ProjectSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const summarizeProject = async (projectId: number) => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);

    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/projects/${projectId}/summary`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ProjectSummaryResponse = await res.json();
      setSummaryData(data);
    } catch (err: unknown) {
      console.error(err);
      setSummaryError("Failed to load project summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  return {
    summaryData,
    summaryLoading,
    summaryError,
    summarizeProject,
  };
};
