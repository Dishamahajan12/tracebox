import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectMembersSection from '../components/ProjectMembersSection';
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
import { useFormFields } from '../hooks/useFormFields';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime, humanizeEnum } from '../utils/formatters';
import {
  canManageProjectMembers,
  canManageProjectTasks,
  resolveProjectRole,
} from '../utils/permissions';

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [settingsError, setSettingsError] = useState('');
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

        const [projectData, memberData, taskData] = await Promise.all([
          projectService.getProject(projectId),
          memberService.getProjectMembers(projectId),
          taskService.getProjectTasks(projectId),
        ]);

        if (!isMounted) {
          return;
        }

        setProject(projectData);
        setMembers(memberData || []);
        setTasks(taskData || []);
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

  const projectRole = resolveProjectRole(project, members, currentUser);
  const canEditProject = ['PROJECT_ADMIN', 'PROJECT_OWNER'].includes(projectRole);
  const canEditMembers = canManageProjectMembers(projectRole);
  const canEditTasks = canManageProjectTasks(projectRole);
  const canArchiveProject = projectRole === 'PROJECT_OWNER';

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
      showSuccess('Member added', 'The project member was added successfully.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to add this project member.');
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
      if (userId === currentUser?.id) {
        setProject((currentProject) => ({
          ...currentProject,
          currentUserRole: updatedMember.projectRole,
        }));
      }
      showSuccess('Member role updated', 'Project permissions were updated.');
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
      showSuccess('Member removed', 'The project member was removed.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to remove the project member.');
      showError('Remove failed', message);
      throw new Error(message);
    }
  }

  async function handleCreateTask(payload) {
    try {
      const createdTask = await taskService.createTask(projectId, payload);
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      showSuccess('Task created', 'The task is now part of this project.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to create the task.');
      showError('Task creation failed', message);
      throw new Error(message);
    }
  }

  async function handleUpdateTask(taskId, payload) {
    try {
      const updatedTask = await taskService.updateTask(taskId, payload);
      setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? updatedTask : task)));
      showSuccess('Task updated', 'The task details were saved.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update the task.');
      showError('Task update failed', message);
      throw new Error(message);
    }
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
        <StatCard detail="Current access level for you" label="Your Role" value={humanizeEnum(projectRole)} />
        <StatCard detail="Collaborators in this project" label="Members" value={members.length} />
        <StatCard accent="highlight" detail="Visible tasks in this project" label="Tasks" value={tasks.length} />
        <StatCard detail="Archive state" label="Status" value={project.archived ? 'Archived' : 'Active'} />
      </section>

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Project Overview</h2>
              <p>Core project metadata and the permissions currently applied to your account.</p>
            </div>
            <div className="badge-row">
              <StatusBadge value={projectRole} />
              {project.archived ? <StatusBadge value="ARCHIVED">Archived</StatusBadge> : null}
            </div>
          </div>

          <p>{project.description || 'Add a project description from project settings to give the team more context.'}</p>

          {!canEditTasks ? (
            <div className="inline-message">Viewer access keeps task and member actions disabled while preserving full visibility.</div>
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
              <dt>Task editing</dt>
              <dd>{canEditTasks ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <ProjectMembersSection
        currentUser={currentUser}
        members={members}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        projectRole={projectRole}
      />

      <TaskListSection
        members={members}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        projectRole={projectRole}
        tasks={tasks}
      />

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
