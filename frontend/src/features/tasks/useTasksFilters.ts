// frontend/src/features/tasks/useTasksFilters.ts
import { useEffect, useState } from "react";
import type { TaskStatus } from "../../lib/tasks";
import {
  loadTasksFilterPreset,
  saveTasksFilterPreset,
  type TasksFilterPreset,
} from "../../lib/tasks";

export type TasksFilterState = {
  mineOnly: boolean;
  activeOnly: boolean;
  statusFilter: "" | TaskStatus;
  projectFilterId: number | null;
  searchTerm: string;
};

export type UseTasksFiltersResult = TasksFilterState & {
  setMineOnly: (value: boolean) => void;
  setActiveOnly: (value: boolean) => void;
  setStatusFilter: (value: "" | TaskStatus) => void;
  setProjectFilterId: (value: number | null) => void;
  setSearchTerm: (value: string) => void;
  applyPreset: (name: "myActive" | "blockedOnly" | "allActive") => void;
};

export const useTasksFilters = (
  isAdmin: boolean,
): UseTasksFiltersResult => {
  const [mineOnly, setMineOnly] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | TaskStatus>("");
  const [projectFilterId, setProjectFilterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load preset filters on mount
  useEffect(() => {
    const preset = loadTasksFilterPreset();
    if (preset) {
      setMineOnly(preset.mineOnly);
      setActiveOnly(preset.activeOnly);
      setStatusFilter(preset.statusFilter);
      setProjectFilterId(preset.projectFilterId);
    }
  }, []);

  const applyPreset = (presetName: "myActive" | "blockedOnly" | "allActive") => {
    let preset: TasksFilterPreset;

    if (presetName === "myActive") {
      preset = {
        mineOnly: true,
        activeOnly: true,
        statusFilter: "",
        projectFilterId: null,
      };
    } else if (presetName === "blockedOnly") {
      preset = {
        mineOnly: true,
        activeOnly: true,
        statusFilter: "blocked",
        projectFilterId: null,
      };
    } else {
      // allActive
      preset = {
        mineOnly: false,
        activeOnly: true,
        statusFilter: "",
        projectFilterId: null,
      };
    }

    // For safety, keep admin requirement same as before (only admins see allActive)
    if (presetName === "allActive" && !isAdmin) {
      return;
    }

    setMineOnly(preset.mineOnly);
    setActiveOnly(preset.activeOnly);
    setStatusFilter(preset.statusFilter);
    setProjectFilterId(preset.projectFilterId);
    saveTasksFilterPreset(preset);
  };

  return {
    mineOnly,
    activeOnly,
    statusFilter,
    projectFilterId,
    searchTerm,
    setMineOnly,
    setActiveOnly,
    setStatusFilter,
    setProjectFilterId,
    setSearchTerm,
    applyPreset,
  };
};
