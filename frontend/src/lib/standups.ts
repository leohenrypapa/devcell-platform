// filename: frontend/src/lib/standups.ts
import type { TaskListResponse } from "./tasks";

export type StandupEntry = {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  project_id?: number | null;
  project_name?: string | null;
  yesterday: string;
  today: string;
  blockers: string;
  created_at: string;
};

export type StandupListResponse = {
  items: StandupEntry[];
};

export type StandupSummaryResponse = {
  summary: string;
  count: number;
};

export type RecentStandupGroup = {
  date: string;
  entries: StandupEntry[];
};

export type StandupTaskListResponse = TaskListResponse;

export const groupStandupsByDate = (
  items: StandupEntry[],
): RecentStandupGroup[] => {
  const map = new Map<string, StandupEntry[]>();

  for (const s of items) {
    const key = s.date;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(s);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // most recent first
    .map(([date, entries]) => ({ date, entries }));
};
