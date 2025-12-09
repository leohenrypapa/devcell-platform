// frontend/src/features/projects/ProjectCard.tsx
import React from "react";
import type { Project, ProjectMember, ProjectMemberRole } from "../../lib/projects";
import ProjectMembersPanel from "./ProjectMembersPanel";

type Props = {
  project: Project;
  isMine: boolean;
  onEdit: () => void;
  onSummarize: () => void;

  // Members
  members: ProjectMember[];
  isMembersExpanded: boolean;
  membersLoadingProjectId: number | null;
  membersError: string | null;
  canManageMembers: boolean;
  newMemberUsername: string;
  newMemberRole: ProjectMemberRole;
  setNewMemberUsername: (value: string) => void;
  setNewMemberRole: (value: ProjectMemberRole) => void;
  onToggleMembers: () => void;
  onAddMember: () => void;
  onRemoveMember: (username: string) => void;
};

const ProjectCard: React.FC<Props> = ({
  project,
  isMine,
  onEdit,
  onSummarize,
  members,
  isMembersExpanded,
  membersLoadingProjectId,
  membersError,
  canManageMembers,
  newMemberUsername,
  newMemberRole,
  setNewMemberUsername,
  setNewMemberRole,
  onToggleMembers,
  onAddMember,
  onRemoveMember,
}) => {
  return (
    <li
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        fontSize: "0.9rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.25rem",
        }}
      >
        <div>
          <strong>{project.name}</strong>
          {isMine && (
            <span
              style={{
                marginLeft: "0.4rem",
                fontSize: "0.75rem",
                padding: "0.05rem 0.4rem",
                borderRadius: "999px",
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              mine
            </span>
          )}
        </div>
        <small style={{ opacity: 0.75 }}>
          Owner: <strong>{project.owner}</strong>
        </small>
      </header>

      <div style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
        Status:{" "}
        <span
          style={{
            padding: "0.1rem 0.5rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            textTransform: "capitalize",
            fontSize: "0.75rem",
          }}
        >
          {project.status}
        </span>
      </div>

      {project.description && (
        <p
          style={{
            marginTop: "0.25rem",
            marginBottom: "0.25rem",
            fontSize: "0.9rem",
          }}
        >
          {project.description}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "0.35rem",
          marginBottom: "0.35rem",
          fontSize: "0.8rem",
        }}
      >
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onSummarize}>
          Summarize
        </button>
      </div>

      <ProjectMembersPanel
        project={project}
        isExpanded={isMembersExpanded}
        members={members}
        membersLoadingProjectId={membersLoadingProjectId}
        membersError={membersError}
        canManage={canManageMembers}
        newMemberUsername={newMemberUsername}
        newMemberRole={newMemberRole}
        setNewMemberUsername={setNewMemberUsername}
        setNewMemberRole={setNewMemberRole}
        onToggle={onToggleMembers}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
      />
    </li>
  );
};

export default ProjectCard;
