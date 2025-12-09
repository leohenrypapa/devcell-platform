// frontend/src/features/projects/ProjectList.tsx
import React from "react";
import type {
  Project,
  ProjectMember,
  ProjectMemberRole,
} from "../../lib/projects";
import ProjectCard from "./ProjectCard";

type Props = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  mineOnly: boolean;
  loggedInUsername: string;

  // Members
  membersByProject: Record<number, ProjectMember[]>;
  expandedMembersProjectId: number | null;
  membersLoadingProjectId: number | null;
  membersError: string | null;
  canManageMembers: (project: Project) => boolean;
  newMemberUsername: string;
  newMemberRole: ProjectMemberRole;
  setNewMemberUsername: (value: string) => void;
  setNewMemberRole: (value: ProjectMemberRole) => void;
  onToggleMembers: (project: Project) => void;
  onAddMember: (project: Project) => void;
  onRemoveMember: (project: Project, username: string) => void;

  // Editing / summary
  onEditProject: (project: Project) => void;
  onSummarizeProject: (project: Project) => void;
};

const ProjectList: React.FC<Props> = ({
  projects,
  loading,
  error,
  mineOnly,
  loggedInUsername,
  membersByProject,
  expandedMembersProjectId,
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
  onEditProject,
  onSummarizeProject,
}) => {
  if (error) {
    return (
      <p style={{ color: "red", marginTop: "0.5rem" }}>
        {error}
      </p>
    );
  }

  if (loading) {
    return <p>Loading projects...</p>;
  }

  if (!loading && projects.length === 0) {
    return (
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        No projects found. {mineOnly ? "You are not a member of any projects yet." : "Create one above."}
      </p>
    );
  }

  const normalizedName = loggedInUsername.toLowerCase().trim();

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
      {projects.map((project) => {
        const isMine =
          project.owner.toLowerCase().trim() === normalizedName &&
          !!normalizedName;
        const members = membersByProject[project.id] ?? [];

        return (
          <ProjectCard
            key={project.id}
            project={project}
            isMine={isMine}
            onEdit={() => onEditProject(project)}
            onSummarize={() => onSummarizeProject(project)}
            members={members}
            isMembersExpanded={expandedMembersProjectId === project.id}
            membersLoadingProjectId={membersLoadingProjectId}
            membersError={membersError}
            canManageMembers={canManageMembers(project)}
            newMemberUsername={newMemberUsername}
            newMemberRole={newMemberRole}
            setNewMemberUsername={setNewMemberUsername}
            setNewMemberRole={setNewMemberRole}
            onToggleMembers={() => onToggleMembers(project)}
            onAddMember={() => onAddMember(project)}
            onRemoveMember={(username) =>
              onRemoveMember(project, username)
            }
          />
        );
      })}
    </ul>
  );
};

export default ProjectList;
