import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProjectMembersSection from '../components/ProjectMembersSection';
import ReportsSection from '../components/ReportsSection';
import TaskListSection from '../components/TaskListSection';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import TextAreaField from '../components/ui/TextAreaField';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useFormFields } from '../hooks/useFormFields';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import { projectService } from '../services/projectService';
import { reportService } from '../services/reportService';
import { ticketService } from '../services/ticketService';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime, humanizeEnum } from '../utils/formatters';
import {
  canManageProjectMembers,
  canManageProjectTasks,
  resolveProjectRole,
} from '../utils/permissions';
import styles from './ProjectDetailsPage.module.css';

function ProjectDetailsPage({ workspaceSection = null }) {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState('');
  const [ticketFilters, setTicketFilters] = useState({
    search: '',
    sort: 'NEWEST',
    status: '',
    assigneeId: '',
  });
  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState('');
  const [reportFilters, setReportFilters] = useState({
    search: '',
    sort: 'NEWEST',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const debouncedTicketSearch = useDebouncedValue(ticketFilters.search, 300);
  const debouncedReportSearch = useDebouncedValue(reportFilters.search, 300);
  const { values, updateField, setValues } = useFormFields({
    name: '',
    description: '',
    archived: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProjectWorkspace() {
      try {
        setLoading(true);
        setError('');

        const [projectData, memberData] = await Promise.all([
          projectService.getProject(projectId),
          memberService.getProjectMembers(projectId),
        ]);

        if (!isMounted) {
          return;
        }

        setProject(projectData);
        setMembers(memberData || []);
        setValues({
          name: projectData.name || '',
          description: projectData.description || '',
          archived: Boolean(projectData.archived),
        });
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load this project.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjectWorkspace();

    return () => {
      isMounted = false;
    };
  }, [projectId, setValues]);

  useEffect(() => {
    let isMounted = true;

    async function loadTickets() {
      try {
        setTicketLoading(true);
        setTicketError('');
        const response = await ticketService.getProjectTickets(projectId, {
          search: debouncedTicketSearch,
          sort: ticketFilters.sort,
          status: ticketFilters.status,
          assigneeId: ticketFilters.assigneeId,
        });

        if (isMounted) {
          setTickets(response || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setTicketError(getApiErrorMessage(loadError, 'Unable to load tickets.'));
        }
      } finally {
        if (isMounted) {
          setTicketLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, [projectId, debouncedTicketSearch, ticketFilters.assigneeId, ticketFilters.sort, ticketFilters.status]);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setReportLoading(true);
        setReportError('');
        const response = await reportService.getProjectReports(projectId, {
          search: debouncedReportSearch,
          sort: reportFilters.sort,
        });

        if (isMounted) {
          setReports(response || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setReportError(getApiErrorMessage(loadError, 'Unable to load reports.'));
        }
      } finally {
        if (isMounted) {
          setReportLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [projectId, debouncedReportSearch, reportFilters.sort]);

  const projectRole = useMemo(() => resolveProjectRole(project, members, currentUser), [project, members, currentUser]);
  const canEditProject = ['PROJECT_ADMIN', 'PROJECT_OWNER'].includes(projectRole);
  const canEditMembers = canManageProjectMembers(projectRole);
  const canEditTickets = canManageProjectTasks(projectRole);
  const canArchiveProject = projectRole === 'PROJECT_OWNER';
  const isWorkspacePage = Boolean(workspaceSection);
  const workspaceMeta = {
    members: {
      label: 'Project Members',
      description: 'Manage teammates, project roles, and member actions for this project.',
    },
    tickets: {
      label: 'Tickets',
      description: 'Search, filter, create, and update tickets from a dedicated project ticket page.',
    },
    reports: {
      label: 'Reports',
      description: 'Open saved reports, search them, and create new report views for this project.',
    },
  };
  const workspacePanels = [
    {
      id: 'members',
      label: 'Project Members',
      description: 'Open the teammate roster, role controls, and member actions.',
      countLabel: `${members.length} member${members.length === 1 ? '' : 's'}`,
      to: `/projects/${projectId}/members`,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      description: 'Open the ticket list, filters, and ticket create or edit actions.',
      countLabel: `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`,
      to: `/projects/${projectId}/tickets`,
    },
    {
      id: 'reports',
      label: 'Reports',
      description: 'Open saved reports along with search, sort, and create options.',
      countLabel: `${reports.length} report${reports.length === 1 ? '' : 's'}`,
      to: `/projects/${projectId}/reports`,
    },
  ];

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading project workspace" />
      </div>
    );
  }

  if (!project) {
    return <div className="inline-message inline-message--error">{error || 'Project not found.'}</div>;
  }

  async function refreshTickets() {
    const response = await ticketService.getProjectTickets(projectId, {
      search: debouncedTicketSearch,
      sort: ticketFilters.sort,
      status: ticketFilters.status,
      assigneeId: ticketFilters.assigneeId,
    });
    setTickets(response || []);
  }

  async function refreshReports() {
    const response = await reportService.getProjectReports(projectId, {
      search: debouncedReportSearch,
      sort: reportFilters.sort,
    });
    setReports(response || []);
  }

  async function handleProjectUpdate(event) {
    event.preventDefault();

    if (!values.name.trim()) {
      setSettingsError('Project name is required.');
      return;
    }

    try {
      setSavingProject(true);
      setSettingsError('');
      const updatedProject = await projectService.updateProject(projectId, {
        name: values.name.trim(),
        description: values.description.trim(),
        archived: canArchiveProject ? Boolean(values.archived) : project.archived,
      });
      setProject(updatedProject);
      setSettingsOpen(false);
      showSuccess('Project updated', 'Project settings were saved.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update project.');
      setSettingsError(message);
      showError('Project update failed', message);
    } finally {
      setSavingProject(false);
    }
  }

  async function handleAddMember(payload) {
    try {
      const createdMember = await memberService.addProjectMember(projectId, payload);
      setMembers((currentMembers) => [...currentMembers, createdMember]);
      showSuccess('Member added', 'The project teammate was added successfully.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to add this project teammate.');
      showError('Member add failed', message);
      throw new Error(message);
    }
  }

  async function handleUpdateMemberRole(userId, payload) {
    try {
      const updatedMember = await memberService.updateProjectMember(projectId, userId, payload);
      setMembers((currentMembers) =>
        currentMembers.map((member) => (member.user.id === userId ? updatedMember : member)),
      );
      if (userId === currentUser?.id && updatedMember?.accessRole) {
        setProject((currentProject) => ({
          ...currentProject,
          currentUserRole: updatedMember.accessRole,
        }));
      }
      showSuccess('Project role updated', 'The teammate role was saved.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update the project role.');
      showError('Role update failed', message);
      throw new Error(message);
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await memberService.removeProjectMember(projectId, userId);
      setMembers((currentMembers) => currentMembers.filter((member) => member.user.id !== userId));
      showSuccess('Member removed', 'The teammate was removed from the project.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to remove the project member.');
      showError('Remove failed', message);
      throw new Error(message);
    }
  }

  async function handleCreateTicket(payload) {
    try {
      await ticketService.createTicket(projectId, payload);
      await refreshTickets();
      showSuccess('Ticket created', 'The ticket is now part of this project.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to create the ticket.');
      showError('Ticket creation failed', message);
      throw new Error(message);
    }
  }

  async function handleUpdateTicket(ticketId, payload) {
    try {
      await ticketService.updateTicket(ticketId, payload);
      await refreshTickets();
      showSuccess('Ticket updated', 'The ticket details were saved.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update the ticket.');
      showError('Ticket update failed', message);
      throw new Error(message);
    }
  }

  async function handleCreateReport(payload) {
    try {
      await reportService.createReport(projectId, payload);
      await refreshReports();
      showSuccess('Report created', 'The project report is ready to use.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to create the report.');
      showError('Report creation failed', message);
      throw new Error(message);
    }
  }

  function handleTicketFilterChange(field, value) {
    setTicketFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function handleReportFilterChange(field, value) {
    setReportFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function renderWorkspaceSection(sectionId) {
    if (sectionId === 'members') {
      return (
        <ProjectMembersSection
          currentUser={currentUser}
          members={members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdateMemberRole={handleUpdateMemberRole}
          projectRole={projectRole}
        />
      );
    }

    if (sectionId === 'tickets') {
      return (
        <TaskListSection
          error={ticketError}
          filters={ticketFilters}
          loading={ticketLoading}
          onCreateTicket={handleCreateTicket}
          onFiltersChange={handleTicketFilterChange}
          onUpdateTicket={handleUpdateTicket}
          projectId={projectId}
          projectRole={projectRole}
          tickets={tickets}
        />
      );
    }

    return (
      <ReportsSection
        error={reportError}
        filters={reportFilters}
        loading={reportLoading}
        onCreateReport={handleCreateReport}
        onFiltersChange={handleReportFilterChange}
        projectId={projectId}
        projectRole={projectRole}
        reports={reports}
      />
    );
  }

  function renderWorkspaceCards() {
    return (
      <section className={styles.workspaceSection}>
        <div className="section-header">
          <div>
            <h2>Workspace Sections</h2>
            <p>Open members, tickets, or reports on their own project page.</p>
          </div>
          {isWorkspacePage ? (
            <span className="pill-note">Current page: {workspaceMeta[workspaceSection]?.label}</span>
          ) : null}
        </div>

        <div className={styles.workspaceTabs}>
          {workspacePanels.map((panel) => {
            const isActive = panel.id === workspaceSection;

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={`${styles.workspaceTab} ${isActive ? styles.workspaceTabActive : ''}`}
                key={panel.id}
                to={panel.to}
              >
                <span className={styles.workspaceLabel}>{panel.label}</span>
                <span className={styles.workspaceDescription}>{panel.description}</span>
                <div className={styles.workspaceTabFooter}>
                  <span className="pill-note">{panel.countLabel}</span>
                  <span className={styles.workspaceAction}>{isActive ? 'Current page' : 'Open page'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (isWorkspacePage) {
    return (
      <div className="page">
        <PageHeader
          actions={
            <>
              <Button to={`/projects/${projectId}`} variant="ghost">
                Back to Project
              </Button>
              {canEditProject ? (
                <Button onClick={() => setSettingsOpen(true)} variant="secondary">
                  Project Settings
                </Button>
              ) : null}
            </>
          }
          description={workspaceMeta[workspaceSection]?.description}
          eyebrow={`${project.projectKey} · ${project.name}`}
          title={workspaceMeta[workspaceSection]?.label || 'Project Workspace'}
        />

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}

        {renderWorkspaceCards()}

        <div className={styles.workspacePanel}>{renderWorkspaceSection(workspaceSection)}</div>

        <Modal
          description="Project admins can update names and descriptions. Ownership-specific controls stay visible only to the owner."
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Project Settings"
        >
          {settingsError ? <div className="inline-message inline-message--error">{settingsError}</div> : null}

          <form className="form-grid form-grid--single" onSubmit={handleProjectUpdate}>
            <InputField
              label="Project name"
              name="name"
              onChange={updateField}
              required
              value={values.name}
            />
            <TextAreaField
              label="Description"
              name="description"
              onChange={updateField}
              rows={5}
              value={values.description}
            />

            {canArchiveProject ? (
              <label className="pill-note">
                <input checked={values.archived} name="archived" onChange={updateField} type="checkbox" />
                Archive project
              </label>
            ) : (
              <span className="pill-note">Only the project owner can archive this project.</span>
            )}

            <div className="form-actions">
              <Button loading={savingProject} type="submit">
                Save Project
              </Button>
              <Button onClick={() => setSettingsOpen(false)} type="button" variant="ghost">
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <Button to="/projects" variant="ghost">
              Back to Projects
            </Button>
            {canEditProject ? (
              <Button onClick={() => setSettingsOpen(true)} variant="secondary">
                Project Settings
              </Button>
            ) : null}
          </>
        }
        description={project.description || 'This project does not have a description yet.'}
        eyebrow={project.projectKey}
        title={project.name}
      />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard detail="Current access level for you" label="Your Access" value={humanizeEnum(projectRole)} />
        <StatCard detail="Collaborators in this project" label="Members" value={members.length} />
        <StatCard accent="highlight" detail="Visible tickets in this project" label="Tickets" value={tickets.length} />
        <StatCard detail="Saved project reports" label="Reports" value={reports.length} />
        <StatCard detail="Current archive state" label="Project Status" value={project.archived ? 'Archived' : 'Active'} />
      </section>

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Project Overview</h2>
              <p>Core metadata, current access, and the shared context behind this ticket workspace.</p>
            </div>
            <div className="badge-row">
              <StatusBadge value={projectRole} />
              {project.archived ? <StatusBadge value="ARCHIVED">Archived</StatusBadge> : null}
            </div>
          </div>

          <p>{project.description || 'Add a project description from project settings to give the team more context.'}</p>

          {!canEditTickets ? (
            <div className="inline-message">Viewer access keeps ticket and member actions disabled while preserving full visibility.</div>
          ) : null}
        </div>

        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Project Facts</h2>
              <p>Helpful backend-driven values from the project response.</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Project key</dt>
              <dd>{project.projectKey}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{project.createdBy?.fullName || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(project.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(project.updatedAt)}</dd>
            </div>
            <div>
              <dt>Member management</dt>
              <dd>{canEditMembers ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div>
              <dt>Ticket editing</dt>
              <dd>{canEditTickets ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </div>
      </section>

      {renderWorkspaceCards()}

      <Modal
        description="Project admins can update names and descriptions. Ownership-specific controls stay visible only to the owner."
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Project Settings"
      >
        {settingsError ? <div className="inline-message inline-message--error">{settingsError}</div> : null}

        <form className="form-grid form-grid--single" onSubmit={handleProjectUpdate}>
          <InputField
            label="Project name"
            name="name"
            onChange={updateField}
            required
            value={values.name}
          />
          <TextAreaField
            label="Description"
            name="description"
            onChange={updateField}
            rows={5}
            value={values.description}
          />

          {canArchiveProject ? (
            <label className="pill-note">
              <input checked={values.archived} name="archived" onChange={updateField} type="checkbox" />
              Archive project
            </label>
          ) : (
            <span className="pill-note">Only the project owner can archive this project.</span>
          )}

          <div className="form-actions">
            <Button loading={savingProject} type="submit">
              Save Project
            </Button>
            <Button onClick={() => setSettingsOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProjectDetailsPage;
