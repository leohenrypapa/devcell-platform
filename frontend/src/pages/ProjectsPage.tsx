// filename: frontend/src/pages/ProjectsPage.tsx
import React from "react";
import { useUser } from "../context/UserContext";

import { useProjects } from "../features/projects/useProjects";
import { useProjectMembers } from "../features/projects/useProjectMembers";
import { useProjectSummary } from "../features/projects/useProjectSummary";

import ProjectsHeader from "../features/projects/ProjectsHeader";
import ProjectForm from "../features/projects/ProjectForm";
import ProjectList from "../features/projects/ProjectList";
import ProjectSummaryPanel from "../features/projects/ProjectSummaryPanel";

const ProjectsPage: React.FC = () => {
  const { user, isAuthenticated } = useUser();
  const loggedInUsername = user?.username ?? "";

  const {
    projects,
    loading,
    error,
    mineOnly,
    setMineOnly,
    form,
  } = useProjects();

  const {
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
  } = useProjectMembers();

  const {
    summaryData,
    summaryLoading,
    summaryError,
    summarizeProject,
  } = useProjectSummary();

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      <ProjectsHeader
        mineOnly={mineOnly}
        onChangeMineOnly={setMineOnly}
      />

      {!isAuthenticated && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          You must be logged in to create and manage projects.
        </p>
      )}

      <ProjectForm
        editingProjectId={form.editingProjectId}
        name={form.name}
        description={form.description}
        status={form.status}
        submitting={form.submitting}
        setName={form.setName}
        setDescription={form.setDescription}
        setStatus={form.setStatus}
        onSubmit={() => void form.handleSubmit()}
        onCancel={form.handleCancel}
      />

      <section style={{ marginTop: "2rem" }}>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Projects List
        </h2>

        <ProjectList
          projects={projects}
          loading={loading}
          error={error}
          mineOnly={mineOnly}
          loggedInUsername={loggedInUsername}
          membersByProject={membersByProject}
          expandedMembersProjectId={expandedMembersProjectId}
          membersLoadingProjectId={membersLoadingProjectId}
          membersError={membersError}
          canManageMembers={canManageMembers}
          newMemberUsername={newMemberUsername}
          newMemberRole={newMemberRole}
          setNewMemberUsername={setNewMemberUsername}
          setNewMemberRole={setNewMemberRole}
          onToggleMembers={toggleMembers}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          onEditProject={form.handleCancel /* reset first */ as any}
          onSummarizeProject={(project) => {
            void summarizeProject(project.id);
          }}
        />
      </section>

      <ProjectSummaryPanel
        summaryData={summaryData}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
      />
    </div>
  );
};

export default ProjectsPage;
