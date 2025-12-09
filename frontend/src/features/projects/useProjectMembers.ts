// frontend/src/features/projects/useProjectMembers.ts
import { useState } from "react";
import { useUser } from "../../context/UserContext";
import {
  getProjectMembers,
  addOrUpdateProjectMember,
  deleteProjectMember,
} from "../../lib/projects";
import type {
  Project,
  ProjectMember,
  ProjectMemberRole,
} from "../../lib/projects";

export type UseProjectMembersResult = {
  membersByProject: Record<number, ProjectMember[]>;
  membersLoadingProjectId: number | null;
  membersError: string | null;
  expandedMembersProjectId: number | null;

  newMemberUsername: string;
  newMemberRole: ProjectMemberRole;
  setNewMemberUsername: (value: string) => void;
  setNewMemberRole: (value: ProjectMemberRole) => void;

  canManageMembers: (project: Project) => boolean;
  toggleMembers: (project: Project) => Promise<void>;
  addMember: (project: Project) => Promise<void>;
  removeMember: (project: Project, username: string) => Promise<void>;
};

export const useProjectMembers = (): UseProjectMembersResult => {
  const { user, token } = useUser();
  const isAdmin = user?.role === "admin";

  const [membersByProject, setMembersByProject] = useState<
    Record<number, ProjectMember[]>
  >({});
  const [membersLoadingProjectId, setMembersLoadingProjectId] = useState<
    number | null
  >(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [expandedMembersProjectId, setExpandedMembersProjectId] = useState<
    number | null
  >(null);

  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<ProjectMemberRole>("member");

  const canManageMembers = (project: Project): boolean => {
    if (!user) return false;
    return isAdmin || project.owner === user.username;
  };

  const toggleMembers = async (project: Project) => {
    if (!token) {
      alert("You must be signed in to view project members.");
      return;
    }

    if (expandedMembersProjectId === project.id) {
      // collapse
      setExpandedMembersProjectId(null);
      setMembersError(null);
      return;
    }

    setExpandedMembersProjectId(project.id);
    setMembersError(null);

    // If we already have members loaded for this project, don't re-fetch immediately.
    if (membersByProject[project.id]?.length) {
      return;
    }

    setMembersLoadingProjectId(project.id);

    try {
      const members = await getProjectMembers(project.id, token);
      setMembersByProject((prev) => ({
        ...prev,
        [project.id]: members,
      }));
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to load project members.";
      setMembersError(message);
    } finally {
      setMembersLoadingProjectId(null);
    }
  };

  const addMember = async (project: Project) => {
    if (!token) {
      alert("You must be signed in to modify project members.");
      return;
    }

    if (!newMemberUsername.trim()) {
      alert("Please enter a username.");
      return;
    }

    try {
      const member = await addOrUpdateProjectMember(
        project.id,
        {
          username: newMemberUsername.trim(),
          role: newMemberRole,
        },
        token,
      );

      setMembersByProject((prev) => {
        const existing = prev[project.id] ?? [];
        const updated = [
          ...existing.filter((m) => m.username !== member.username),
          member,
        ].sort((a, b) => a.username.localeCompare(b.username));

        return {
          ...prev,
          [project.id]: updated,
        };
      });

      setNewMemberUsername("");
      setNewMemberRole("member");
      setMembersError(null);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to add or update project member.";
      setMembersError(message);
    }
  };

  const removeMember = async (project: Project, username: string) => {
    if (!token) {
      alert("You must be signed in to modify project members.");
      return;
    }

    if (
      !window.confirm(
        `Remove ${username} from project "${project.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteProjectMember(project.id, username, token);
      setMembersByProject((prev) => {
        const existing = prev[project.id] ?? [];
        const updated = existing.filter((m) => m.username !== username);
        return {
          ...prev,
          [project.id]: updated,
        };
      });
      setMembersError(null);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove project member.";
      setMembersError(message);
    }
  };

  return {
    membersByProject,
    membersLoadingProjectId,
    membersError,
    expandedMembersProjectId,
    newMemberUsername,
    newMemberRole,
    setNewMemberUsername,
    setNewMemberRole,
    canManageMembers,
    toggleMembers,
    addMember,
    removeMember,
  };
};
