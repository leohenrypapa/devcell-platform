// filename: frontend/src/pages/AdminPage.tsx
import React, { useMemo, useState } from "react";
import { useUser } from "../context/UserContext";

import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";

import {
  useAdminUsers,
  type AdminUser,
  type EditUserForm,
} from "../features/admin/useAdminUsers";
import { UserCreateCard } from "../features/admin/UserCreateCard";
import { UserTable } from "../features/admin/UserTable";

type PendingAction =
  | { type: "toggleRole"; user: AdminUser }
  | { type: "toggleActive"; user: AdminUser };

const AdminPage: React.FC = () => {
  const { user } = useUser();
  const {
    users,
    loading,
    creating,
    updating,
    error,
    info,
    createUser,
    updateUser,
    toggleRole,
    toggleActive,
    resetMessages,
  } = useAdminUsers();

  const isAdmin = user?.role === "admin";

  // Inline profile-edit form state (per user)
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    display_name: "",
    job_title: "",
    team_name: "",
    rank: "",
    skills: "",
  });

  // --- Filters & search ------------------------------------------------------

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = [...users];

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      const shouldBeActive = statusFilter === "active";
      result = result.filter((u) => u.is_active === shouldBeActive);
    }

    if (term) {
      result = result.filter((u) => {
        const fields: (string | null | undefined)[] = [
          u.username,
          u.display_name,
          u.job_title,
          u.team_name,
          u.rank,
          u.skills,
        ];
        return fields
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      });
    }

    // Newest first
    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return result;
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalUsers = users.length;
  const filteredCount = filteredUsers.length;

  const countLabel =
    totalUsers === 0
      ? "No users"
      : totalUsers === filteredCount
      ? `${totalUsers} user${totalUsers === 1 ? "" : "s"}`
      : `${filteredCount} of ${totalUsers} users`;

  // --- Pending confirmation action ------------------------------------------

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const handleRequestToggleRole = (u: AdminUser) => {
    setPendingAction({ type: "toggleRole", user: u });
  };

  const handleRequestToggleActive = (u: AdminUser) => {
    setPendingAction({ type: "toggleActive", user: u });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === "toggleRole") {
      toggleRole(pendingAction.user);
    } else if (pendingAction.type === "toggleActive") {
      toggleActive(pendingAction.user);
    }

    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setPendingAction(null);
  };

  const confirmTitle = (() => {
    if (!pendingAction) return "";
    if (pendingAction.type === "toggleRole") {
      const nextRole = pendingAction.user.role === "admin" ? "user" : "admin";
      return `Change role to ${nextRole}?`;
    }
    // toggleActive
    return pendingAction.user.is_active
      ? "Deactivate this account?"
      : "Activate this account?";
  })();

  const confirmDescription = (() => {
    if (!pendingAction) return "";

    const username = pendingAction.user.username;
    if (pendingAction.type === "toggleRole") {
      const nextRole = pendingAction.user.role === "admin" ? "user" : "admin";
      return `You are about to change the role for "${username}" to "${nextRole}". This affects what they can see and do in the platform. The backend prevents removing the last active admin, but you should still double-check before proceeding.`;
    }

    if (pendingAction.user.is_active) {
      return `This will deactivate the account for "${username}". They will no longer be able to sign in until reactivated. Existing data will not be deleted.`;
    }

    return `This will activate the account for "${username}" so they can sign in again.`;
  })();

  const confirmLabel = (() => {
    if (!pendingAction) return "Confirm";
    if (pendingAction.type === "toggleRole") return "Change role";
    if (pendingAction.user.is_active) return "Deactivate account";
    return "Activate account";
  })();

  const confirmTone: "default" | "danger" =
    pendingAction && pendingAction.type === "toggleActive"
      ? pendingAction.user.is_active
        ? "danger"
        : "default"
      : "default";

  // --- Access control guards -------------------------------------------------

  if (!user) {
    return (
      <div className="dc-page">
        <div
          className="dc-page-inner"
          style={{
            maxWidth: 640,
            margin: "2rem auto",
            padding: "1rem",
          }}
        >
          <PageHeader title="Admin" description="Authentication required." />
          <Card>
            <p>You must be signed in to view this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="dc-page">
        <div
          className="dc-page-inner"
          style={{
            maxWidth: 640,
            margin: "2rem auto",
            padding: "1rem",
          }}
        >
          <PageHeader
            title="Admin"
            description="You do not have permission to access this area."
          />
          <Card>
            <p style={{ fontSize: "var(--dc-font-size-sm)" }}>
              🚫 You do not have permission to view this page. If you believe
              this is an error, contact an administrator.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // --- Edit form helpers -----------------------------------------------------

  const handleStartEdit = (u: AdminUser) => {
    setEditUserId(u.id);
    setEditForm({
      display_name: u.display_name ?? "",
      job_title: u.job_title ?? "",
      team_name: u.team_name ?? "",
      rank: u.rank ?? "",
      skills: u.skills ?? "",
    });
    resetMessages();
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async (u: AdminUser) => {
    await updateUser(u.id, {
      display_name: editForm.display_name,
      job_title: editForm.job_title,
      team_name: editForm.team_name,
      rank: editForm.rank,
      skills: editForm.skills,
    });
    setEditUserId(null);
  };

  const handleCancelEdit = () => {
    setEditUserId(null);
  };

  // --- Layout ---------------------------------------------------------------

  const hasMessages = !!error || !!info;

  const filterLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--dc-font-size-xs)",
    marginBottom: "0.15rem",
    color: "var(--dc-text-muted)",
  };

  const filterInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.35rem 0.5rem",
    borderRadius: "var(--dc-radius-sm)",
    border: "1px solid var(--dc-border-subtle)",
    fontSize: "var(--dc-font-size-sm)",
    backgroundColor: "var(--dc-bg-subtle)",
  };

  return (
    <>
      <div className="dc-page">
        <div
          className="dc-page-inner"
          style={{
            maxWidth: "var(--dc-page-max-width, 1080px)",
            margin: "0 auto",
            padding: "1.25rem 1rem 2rem",
          }}
        >
          <PageHeader
            title="Admin — User Management"
            description="Manage users, roles, and account status. The backend prevents removing or deactivating the last active admin."
            actions={
              <Button
                type="button"
                variant="ghost"
                onClick={resetMessages}
                style={{ fontSize: "var(--dc-font-size-xs)" }}
              >
                Clear messages
              </Button>
            }
          />

          {hasMessages && (
            <div
              style={{
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                fontSize: "var(--dc-font-size-sm)",
              }}
            >
              {error && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--dc-radius-sm)",
                    border: "1px solid var(--dc-color-danger-soft, #fecaca)",
                    backgroundColor:
                      "var(--dc-color-danger-subtle, rgba(248,113,113,0.06))",
                    color: "var(--dc-color-danger-text, #b91c1c)",
                  }}
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--dc-radius-sm)",
                    border:
                      "1px solid var(--dc-color-success-soft, rgba(22,163,74,0.35))",
                    backgroundColor:
                      "var(--dc-color-success-subtle, rgba(22,163,74,0.06))",
                    color: "var(--dc-color-success-text, #166534)",
                  }}
                >
                  {info}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 2fr)",
              gap: "1.25rem",
            }}
          >
            {/* Create User card */}
            <UserCreateCard creating={creating} onCreate={createUser} />

            {/* Users table + filters */}
            <Card
              style={{
                minHeight: "260px",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "var(--dc-font-size-md)",
                      fontWeight: 600,
                    }}
                  >
                    Existing Users
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      marginTop: "0.25rem",
                      fontSize: "var(--dc-font-size-xs)",
                      color: "var(--dc-text-muted)",
                    }}
                  >
                    View and adjust roles, activation, and profile fields.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "var(--dc-font-size-xs)",
                    color: "var(--dc-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {countLabel}
                </span>
              </div>

              {/* Filters row */}
              <div
                style={{
                  marginTop: "0.35rem",
                  marginBottom: "0.25rem",
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.8fr) minmax(0, 1fr) minmax(0, 1fr)",
                  gap: "0.5rem",
                  alignItems: "flex-end",
                }}
              >
                <div>
                  <label style={filterLabelStyle} htmlFor="admin-user-search">
                    Search
                  </label>
                  <input
                    id="admin-user-search"
                    type="search"
                    placeholder="Search username, name, team, rank, skills…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={filterInputStyle}
                  />
                </div>
                <div>
                  <label
                    style={filterLabelStyle}
                    htmlFor="admin-user-role-filter"
                  >
                    Role
                  </label>
                  <select
                    id="admin-user-role-filter"
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value as "all" | "user" | "admin")
                    }
                    style={filterInputStyle}
                  >
                    <option value="all">All roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label
                    style={filterLabelStyle}
                    htmlFor="admin-user-status-filter"
                  >
                    Status
                  </label>
                  <select
                    id="admin-user-status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "active" | "inactive",
                      )
                    }
                    style={filterInputStyle}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <UserTable
                users={filteredUsers}
                hasAnyUsers={totalUsers > 0}
                loading={loading}
                updating={updating}
                editUserId={editUserId}
                editForm={editForm}
                onStartEdit={handleStartEdit}
                onChangeEdit={handleEditChange}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onRequestToggleRole={handleRequestToggleRole}
                onRequestToggleActive={handleRequestToggleActive}
              />
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel="Cancel"
        tone={confirmTone}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
};

export default AdminPage;
