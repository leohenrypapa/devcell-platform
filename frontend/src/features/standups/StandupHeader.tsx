// frontend/src/features/standups/StandupHeader.tsx
import React from "react";
import PageHeader from "../../ui/PageHeader";

type Props = {
  selectedDate: string;
  onChangeDate: (value: string) => void;
  showMineOnly: boolean;
  onToggleMineOnly: (value: boolean) => void;
};

const StandupHeader: React.FC<Props> = ({
  selectedDate,
  onChangeDate,
  showMineOnly,
  onToggleMineOnly,
}) => {
  return (
    <PageHeader
      title="Daily Standups"
      description="Quick, lightweight standup log that links directly to tasks."
      actions={
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: "0.85rem" }}>
            Date:&nbsp;
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
            />
          </label>
          <label style={{ fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={showMineOnly}
              onChange={(e) => onToggleMineOnly(e.target.checked)}
              style={{ marginRight: "0.25rem" }}
            />
            Show only my entries
          </label>
        </div>
      }
    />
  );
};

export default StandupHeader;
