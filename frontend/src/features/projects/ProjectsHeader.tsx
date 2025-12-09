// frontend/src/features/projects/ProjectsHeader.tsx
import React from "react";
import PageHeader from "../../ui/PageHeader";

type Props = {
  mineOnly: boolean;
  onChangeMineOnly: (value: boolean) => void;
};

const ProjectsHeader: React.FC<Props> = ({ mineOnly, onChangeMineOnly }) => {
  return (
    <PageHeader
      title="Projects"
      description="Track team projects and get AI-generated summaries from recent standups and tasks."
      actions={
        <label
          style={{
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => onChangeMineOnly(e.target.checked)}
          />
          Show only my projects
        </label>
      }
    />
  );
};

export default ProjectsHeader;
