import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CommentsSection from '../components/CommentsSection';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SelectField from '../components/ui/SelectField';
import StatusBadge from '../components/ui/StatusBadge';
import TextAreaField from '../components/ui/TextAreaField';
import { useAuth } from '../hooks/useAuth';
import { useFormFields } from '../hooks/useFormFields';
import { useToast } from '../hooks/useToast';
import { commentService } from '../services/commentService';
import { memberService } from '../services/memberService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../utils/constants';
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatDateTime, humanizeEnum } from '../utils/formatters';
import { canManageProjectTasks, resolveProjectRole } from '../utils/permissions';

const initialTaskState = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  assigneeId: '',
  dueDate: '',
};

function TaskDetailsPage() {
  const { taskId } = useParams();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const { values, updateField, setValues } = useFormFields(initialTaskState);

  useEffect(() => {
    let isMounted = true;

    async function loadTaskWorkspace() {
      try {
        setLoading(true);
        setError('');

        const taskData = await taskService.getTask(taskId);
        const [projectData, memberData, commentData] = await Promise.all([
          projectService.getProject(taskData.projectId),
          memberService.getProjectMembers(taskData.projectId),
          commentService.getTaskComments(taskId),
        ]);

        if (!isMounted) {
          return;
        }

        setTask(taskData);
        setProject(projectData);
        setMembers(memberData || []);
        setComments(commentData || []);
        setValues({
          title: taskData.title || '',
          description: taskData.description || '',
          priority: taskData.priority || 'MEDIUM',
          status: taskData.status || 'TODO',
          assigneeId: taskData.assignee?.id ? String(taskData.assignee.id) : '',
          dueDate: taskData.dueDate || '',
        });
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load this task.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTaskWorkspace();

    return () => {
      isMounted = false;
    };
  }, [taskId, setValues]);

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading task details" />
      </div>
    );
  }

  if (!task || !project) {
    return <div className="inline-message inline-message--error">{error || 'Task not found.'}</div>;
  }

  const projectRole = resolveProjectRole(project, members, currentUser);
  const canEditTask = canManageProjectTasks(projectRole);
  const assigneeOptions = members.map((member) => ({
    label: member.user.fullName,
    value: String(member.user.id),
  }));

  async function handleTaskUpdate(event) {
    event.preventDefault();

    if (!values.title.trim()) {
      setSubmitError('Task title is required.');
      return;
    }

    try {
      setSavingTask(true);
      setSubmitError('');
      const updatedTask = await taskService.updateTask(taskId, {
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
        dueDate: values.dueDate || null,
      });
      setTask(updatedTask);
      setEditOpen(false);
      showSuccess('Task updated', 'Task details were saved successfully.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to update the task.');
      setSubmitError(message);
      showError('Task update failed', message);
    } finally {
      setSavingTask(false);
    }
  }

  async function handleCreateComment(payload) {
    try {
      const createdComment = await commentService.createComment(taskId, payload);
      setComments((currentComments) => [...currentComments, createdComment]);
      showSuccess('Comment added', 'The task discussion has been updated.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to add the comment.');
      showError('Comment failed', message);
      throw new Error(message);
    }
  }

  async function handleUpdateComment(commentId, payload) {
    try {
      const updatedComment = await commentService.updateComment(commentId, payload);
      setComments((currentComments) =>
        currentComments.map((comment) => (comment.id === commentId ? updatedComment : comment)),
      );
      showSuccess('Comment updated', 'Your changes were saved.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to update the comment.');
      showError('Comment update failed', message);
      throw new Error(message);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await commentService.deleteComment(commentId);
      setComments((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
      showSuccess('Comment deleted', 'The comment was removed.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to delete the comment.');
      showError('Comment delete failed', message);
      throw new Error(message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <Button to={`/projects/${project.id}`} variant="ghost">
              Back to Project
            </Button>
            {canEditTask ? (
              <Button onClick={() => setEditOpen(true)} variant="secondary">
                Edit Task
              </Button>
            ) : null}
          </>
        }
        description={task.description || 'This task does not have detailed notes yet.'}
        eyebrow={project.projectKey}
        title={task.title}
      />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Task Summary</h2>
              <p>Status, priority, and discussion stay tied to the project permissions you already hold.</p>
            </div>
            <div className="badge-row">
              <StatusBadge value={task.status} />
              <StatusBadge value={task.priority} />
            </div>
          </div>

          <p>{task.description || 'Add implementation notes, acceptance criteria, or blockers to make this task clearer.'}</p>

          {!canEditTask ? (
            <div className="inline-message">Viewer access is read-only here, but comments can still keep the discussion moving.</div>
          ) : null}
        </div>

        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Task Facts</h2>
              <p>Backend-backed metadata for this task record.</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>{humanizeEnum(task.status)}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{humanizeEnum(task.priority)}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{task.assignee?.fullName || 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(task.dueDate)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{task.createdBy?.fullName || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(task.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(task.updatedAt)}</dd>
            </div>
            <div>
              <dt>Your project role</dt>
              <dd>{humanizeEnum(projectRole)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <CommentsSection
        comments={comments}
        currentUser={currentUser}
        onCreateComment={handleCreateComment}
        onDeleteComment={handleDeleteComment}
        onUpdateComment={handleUpdateComment}
        projectRole={projectRole}
      />

      <Modal
        description="Members and above can keep the task current without leaving the detail page."
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Task"
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className="form-grid" onSubmit={handleTaskUpdate}>
          <InputField
            label="Title"
            name="title"
            onChange={updateField}
            required
            value={values.title}
          />
          <SelectField
            label="Status"
            name="status"
            onChange={updateField}
            options={TASK_STATUS_OPTIONS.map((status) => ({
              label: humanizeEnum(status),
              value: status,
            }))}
            value={values.status}
          />
          <TextAreaField
            label="Description"
            name="description"
            onChange={updateField}
            rows={5}
            value={values.description}
          />
          <SelectField
            label="Priority"
            name="priority"
            onChange={updateField}
            options={TASK_PRIORITY_OPTIONS.map((priority) => ({
              label: humanizeEnum(priority),
              value: priority,
            }))}
            value={values.priority}
          />
          <SelectField
            label="Assignee"
            name="assigneeId"
            onChange={updateField}
            options={assigneeOptions}
            placeholder="Choose assignee"
            value={values.assigneeId}
          />
          <InputField
            label="Due date"
            name="dueDate"
            onChange={updateField}
            type="date"
            value={values.dueDate}
          />

          <div className="form-actions">
            <Button loading={savingTask} type="submit">
              Save Task
            </Button>
            <Button onClick={() => setEditOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TaskDetailsPage;
