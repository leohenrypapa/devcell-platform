// frontend/src/features/projects/ProjectMembersPanel.tsx
import React from "react";
import type { Project, ProjectMember, ProjectMemberRole } from "../../lib/projects";

type Props = {
  project: Project;
  isExpanded: boolean;
  members: ProjectMember[];
  membersLoadingProjectId: number | null;
  membersError: string | null;
  canManage: boolean;

  newMemberUsername: string;
  newMemberRole: ProjectMemberRole;
  setNewMemberUsername: (value: string) => void;
  setNewMemberRole: (value: ProjectMemberRole) => void;

  onToggle: () => void;
  onAddMember: () => void;
  onRemoveMember: (username: string) => void;
};

const ProjectMembersPanel: React.FC<Props> = ({
  project,
  isExpanded,
  members,
  membersLoadingProjectId,
  membersError,
  canManage,
  newMemberUsername,
  newMemberRole,
  setNewMemberUsername,
  setNewMemberRole,
  onToggle,
  onAddMember,
  onRemoveMember,
}) => {
  const isLoading = membersLoadingProjectId === project.id;

  return (
    <div
      style={{
        marginTop: "0.5rem",
        fontSize: "0.85rem",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{ fontSize: "0.8rem" }}
      >
        {isExpanded ? "Hide Members" : "Show Members"}
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: "0.5rem",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "0.5rem",
          }}
        >
          {isLoading && (
            <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              Loading members...
            </span>
          )}

          {membersError && (
            <p
              style={{
                color: "red",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              {membersError}
            </p>
          )}

          {!isLoading && members.length === 0 && (
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.8,
                marginBottom: "0.5rem",
              }}
            >
              No members have been added to this project yet.
            </p>
          )}

          {!isLoading && members.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              {members.map((m) => (
                <li key={m.username}>
                  <strong>{m.username}</strong>{" "}
                  <span style={{ opacity: 0.7 }}>({m.role})</span>
                  {canManage && m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(m.username)}
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.8rem",
                        padding: "0.15rem 0.5rem",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canManage && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "flex-end",
                marginTop: "0.5rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Username
                </label>
                <input
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) =>
                    setNewMemberRole(e.target.value as ProjectMemberRole)
                  }
                >
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                  <option value="owner">owner</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onAddMember}
                  style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                >
                  Add / Update Member
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectMembersPanel;
