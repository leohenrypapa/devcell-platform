// frontend/src/features/standups/StandupList.tsx
import React from "react";
import type { StandupEntry } from "../../lib/standups";
import type { Task } from "../../lib/tasks";
import StandupCard from "./StandupCard";

type Props = {
  entries: StandupEntry[];
  loggedInName: string;
  showMineOnly: boolean;
  focusStandupId: number | null;

  linkedTasksByStandup: Record<number, Task[]>;
  loadingLinkedTasksByStandup: Record<number, boolean>;
  onLoadLinkedTasksForStandup: (standupId: number) => void;

  onEdit: (entry: StandupEntry) => void;
  onDelete: (entry: StandupEntry) => void;
  onConvertToTasks: (entry: StandupEntry) => void;
};

const StandupList: React.FC<Props> = ({
  entries,
  loggedInName,
  showMineOnly,
  focusStandupId,
  linkedTasksByStandup,
  loadingLinkedTasksByStandup,
  onLoadLinkedTasksForStandup,
  onEdit,
  onDelete,
  onConvertToTasks,
}) => {
  const normalizedName = loggedInName.toLowerCase().trim();
  const visibleEntries = entries.filter((e) =>
    showMineOnly
      ? e.name.toLowerCase().trim() === normalizedName
      : true,
  );

  if (visibleEntries.length === 0) {
    return <p>No standup entries for this date.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {visibleEntries.map((entry) => (
        <StandupCard
          key={entry.id}
          entry={entry}
          isMine={
            entry.name.toLowerCase().trim() === normalizedName &&
            !!normalizedName
          }
          isFocused={focusStandupId === entry.id}
          linkedTasks={linkedTasksByStandup[entry.id]}
          loadingLinkedTasks={!!loadingLinkedTasksByStandup[entry.id]}
          onLoadLinkedTasks={() => onLoadLinkedTasksForStandup(entry.id)}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry)}
          onConvertToTasks={() => onConvertToTasks(entry)}
        />
      ))}
    </ul>
  );
};

export default StandupList;
