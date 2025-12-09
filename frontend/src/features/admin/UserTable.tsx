// filename: frontend/src/features/admin/UserTable.tsx
import React from "react";
import Button from "../../ui/Button";
import type { AdminUser, EditUserForm } from "./useAdminUsers";

type Props = {
  users: AdminUser[];
  hasAnyUsers: boolean;
  loading: boolean;
  updating: boolean;

  editUserId: number | null;
  editForm: EditUserForm;
  onStartEdit: (u: AdminUser) => void;
  onChangeEdit: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSaveEdit: (u: AdminUser) => void;
  onCancelEdit: () => void;

  onRequestToggleRole: (u: AdminUser) => void;
  onRequestToggleActive: (u: AdminUser) => void;
};

export const UserTable: React.FC<Props> = ({
  users,
  hasAnyUsers,
  loading,
  updating,
  editUserId,
  editForm,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onRequestToggleRole,
  onRequestToggleActive,
}) => {
  if (loading) {
    return (
      <div
        style={{
          padding: "0.75rem 0.25rem",
          fontSize: "var(--dc-font-size-sm)",
          color: "var(--dc-text-muted)",
        }}
      >
        Loading users…
      </div>
    );
  }

  if (!users.length) {
    const message = hasAnyUsers
      ? "No users match the current filters or search."
      : "No users found yet. Create a user to get started.";

    return (
      <div
        style={{
          padding: "0.75rem 0.25rem",
          fontSize: "var(--dc-font-size-sm)",
          color: "var(--dc-text-muted)",
        }}
      >
        {message}
      </div>
    );
  }

  const headerCellStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--dc-border-subtle)",
    padding: "0.4rem 0.4rem",
    textAlign: "left",
    fontSize: "var(--dc-font-size-xs)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--dc-text-muted)",
    whiteSpace: "nowrap",
  };

  const rowCellStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--dc-border-subtle)",
    padding: "0.4rem 0.4rem",
    fontSize: "var(--dc-font-size-sm)",
    verticalAlign: "top",
  };

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.15rem 0.45rem",
    borderRadius: "999px",
    fontSize: "var(--dc-font-size-xs)",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        borderRadius: "var(--dc-radius-md)",
        border: "1px solid var(--dc-border-subtle)",
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 720,
        }}
      >
        <thead>
          <tr>
            <th style={headerCellStyle}>User</th>
            <th style={headerCellStyle}>Role</th>
            <th style={headerCellStyle}>Active</th>
            <th style={headerCellStyle}>Display name</th>
            <th style={headerCellStyle}>Job</th>
            <th style={headerCellStyle}>Team</th>
            <th style={headerCellStyle}>Rank</th>
            <th style={headerCellStyle}>Skills</th>
            <th style={headerCellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isEditing = editUserId === u.id;

            const initials =
              (u.display_name || u.username)
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U";

            return (
              <tr key={u.id}>
                {/* User cell */}
                <td style={rowCellStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: "1.75rem",
                        height: "1.75rem",
                        borderRadius: "999px",
                        backgroundColor: "var(--dc-color-primary-soft)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--dc-font-size-xs)",
                        fontWeight: 600,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div>{u.username}</div>
                      <div
                        style={{
                          fontSize: "var(--dc-font-size-xs)",
                          color: "var(--dc-text-muted)",
                        }}
                      >
                        created {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td style={rowCellStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        ...pillStyle,
                        backgroundColor:
                          u.role === "admin"
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(37,99,235,0.12)",
                        color:
                          u.role === "admin" ? "#b91c1c" : "rgb(37,99,235)",
                      }}
                    >
                      {u.role}
                    </span>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onRequestToggleRole(u)}
                      disabled={updating}
                      style={{
                        fontSize: "var(--dc-font-size-xs)",
                        padding: "0.2rem 0.5rem",
                      }}
                    >
                      Toggle
                    </Button>
                  </div>
                </td>

                {/* Active */}
                <td style={rowCellStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        ...pillStyle,
                        backgroundColor: u.is_active
                          ? "rgba(22,163,74,0.12)"
                          : "rgba(148,163,184,0.16)",
                        color: u.is_active ? "#166534" : "#475569",
                      }}
                    >
                      {u.is_active ? "active" : "inactive"}
                    </span>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onRequestToggleActive(u)}
                      disabled={updating}
                      style={{
                        fontSize: "var(--dc-font-size-xs)",
                        padding: "0.2rem 0.5rem",
                      }}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>

                {/* Profile fields */}
                {isEditing ? (
                  <>
                    <td style={rowCellStyle}>
                      <input
                        name="display_name"
                        value={editForm.display_name}
                        onChange={onChangeEdit}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--dc-radius-sm)",
                          border: "1px solid var(--dc-border-subtle)",
                          fontSize: "var(--dc-font-size-sm)",
                        }}
                      />
                    </td>
                    <td style={rowCellStyle}>
                      <input
                        name="job_title"
                        value={editForm.job_title}
                        onChange={onChangeEdit}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--dc-radius-sm)",
                          border: "1px solid var(--dc-border-subtle)",
                          fontSize: "var(--dc-font-size-sm)",
                        }}
                      />
                    </td>
                    <td style={rowCellStyle}>
                      <input
                        name="team_name"
                        value={editForm.team_name}
                        onChange={onChangeEdit}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--dc-radius-sm)",
                          border: "1px solid var(--dc-border-subtle)",
                          fontSize: "var(--dc-font-size-sm)",
                        }}
                      />
                    </td>
                    <td style={rowCellStyle}>
                      <input
                        name="rank"
                        value={editForm.rank}
                        onChange={onChangeEdit}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--dc-radius-sm)",
                          border: "1px solid var(--dc-border-subtle)",
                          fontSize: "var(--dc-font-size-sm)",
                        }}
                      />
                    </td>
                    <td style={rowCellStyle}>
                      <textarea
                        name="skills"
                        value={editForm.skills}
                        onChange={onChangeEdit}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--dc-radius-sm)",
                          border: "1px solid var(--dc-border-subtle)",
                          fontSize: "var(--dc-font-size-sm)",
                          resize: "vertical",
                        }}
                      />
                    </td>
                    <td style={rowCellStyle}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <Button
                          type="button"
                          onClick={() => onSaveEdit(u)}
                          disabled={updating}
                          style={{
                            fontSize: "var(--dc-font-size-xs)",
                            padding: "0.25rem 0.6rem",
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={onCancelEdit}
                          disabled={updating}
                          style={{
                            fontSize: "var(--dc-font-size-xs)",
                            padding: "0.25rem 0.6rem",
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={rowCellStyle}>{u.display_name ?? ""}</td>
                    <td style={rowCellStyle}>{u.job_title ?? ""}</td>
                    <td style={rowCellStyle}>{u.team_name ?? ""}</td>
                    <td style={rowCellStyle}>{u.rank ?? ""}</td>
                    <td style={rowCellStyle}>{u.skills ?? ""}</td>
                    <td style={rowCellStyle}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onStartEdit(u)}
                        disabled={updating}
                        style={{
                          fontSize: "var(--dc-font-size-xs)",
                          padding: "0.25rem 0.6rem",
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
