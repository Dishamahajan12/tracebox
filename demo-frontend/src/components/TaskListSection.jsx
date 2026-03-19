import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import InputField from './ui/InputField';
import Modal from './ui/Modal';
import SelectField from './ui/SelectField';
import StatusBadge from './ui/StatusBadge';
import TextAreaField from './ui/TextAreaField';
import { useFormFields } from '../hooks/useFormFields';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../utils/constants';
import { formatDate, humanizeEnum, truncateText } from '../utils/formatters';
import { canManageProjectTasks } from '../utils/permissions';
import styles from './TaskListSection.module.css';

const initialTaskState = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  assigneeId: '',
  dueDate: '',
};

function TaskListSection({ tasks, members, projectRole, onCreateTask, onUpdateTask }) {
  const canManageTasks = canManageProjectTasks(projectRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { values, updateField, setValues, resetForm } = useFormFields(initialTaskState);

  const assigneeOptions = members.map((member) => ({
    label: member.user.fullName,
    value: String(member.user.id),
  }));

  function openCreateModal() {
    setEditingTask(null);
    setSubmitError('');
    resetForm(initialTaskState);
    setIsModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setSubmitError('');
    setValues({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      assigneeId: task.assignee?.id ? String(task.assignee.id) : '',
      dueDate: task.dueDate || '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.title.trim()) {
      setSubmitError('Task title is required.');
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      status: values.status,
      assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
      dueDate: values.dueDate || null,
    };

    try {
      setSubmitting(true);
      setSubmitError('');

      if (editingTask) {
        await onUpdateTask(editingTask.id, payload);
      } else {
        await onCreateTask(payload);
      }

      setIsModalOpen(false);
      resetForm(initialTaskState);
      setEditingTask(null);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card card--padded">
      <div className="section-header">
        <div>
          <h2>Task List</h2>
          <p>Track priorities, due dates, and ownership without leaving the project workspace.</p>
        </div>
        {canManageTasks ? (
          <Button onClick={openCreateModal}>Create Task</Button>
        ) : (
          <span className="pill-note">View-only access</span>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          actionLabel={canManageTasks ? 'Create first task' : undefined}
          description="Tasks created here will appear in the project board and task detail views."
          onAction={canManageTasks ? openCreateModal : undefined}
          title="No tasks in this project yet"
        />
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <Link className={styles.taskLink} to={`/tasks/${task.id}`}>
                      <strong>{task.title}</strong>
                      <div className="task-meta">{truncateText(task.description || 'No description yet.', 80)}</div>
                    </Link>
                  </td>
                  <td>
                    <StatusBadge value={task.status} />
                  </td>
                  <td>
                    <StatusBadge value={task.priority} />
                  </td>
                  <td>{task.assignee?.fullName || 'Unassigned'}</td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td>
                    <div className="table-actions">
                      <Button size="sm" to={`/tasks/${task.id}`} variant="ghost">
                        Open
                      </Button>
                      {canManageTasks ? (
                        <Button onClick={() => openEditModal(task)} size="sm" variant="secondary">
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        description="Keep work structured with clear status, owner, and due date information."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit task' : 'Create task'}
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <InputField
            label="Title"
            name="title"
            onChange={updateField}
            placeholder="Design dashboard widgets"
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
            placeholder="What should this task deliver?"
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
            <Button loading={submitting} type="submit">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
            <Button onClick={() => setIsModalOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default TaskListSection;
