// frontend/src/features/standups/useStandupSummary.ts
import { useState } from "react";

import { useToast } from "../../context/ToastContext";

export type StandupSummaryResponse = {
  summary: string;
  count: number;
};

const backendBase =
  (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export type UseStandupSummaryResult = {
  summary: string;
  summaryCount: number;
  loadingSummary: boolean;
  summaryError: string | null;
  generateSummary: (date: string | null) => void;
};

export const useStandupSummary = (): UseStandupSummaryResult => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState("");
  const [summaryCount, setSummaryCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const generateSummary = async (date: string | null) => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const params = new URLSearchParams();
      if (date) {
        params.set("date", date);
      }

      const res = await fetch(
        `${backendBase}/api/standup/summary?${params.toString()}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as StandupSummaryResponse;
      setSummary(data.summary);
      setSummaryCount(data.count);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to generate summary.");
      showToast("Failed to generate standup summary.", "error");
    } finally {
      setLoadingSummary(false);
    }
  };

  return {
    summary,
    summaryCount,
    loadingSummary,
    summaryError,
    generateSummary,
  };
};
