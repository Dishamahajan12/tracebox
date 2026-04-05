import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AsyncAutocompleteField from './ui/AsyncAutocompleteField';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import InputField from './ui/InputField';
import Modal from './ui/Modal';
import SelectField from './ui/SelectField';
import StatusBadge from './ui/StatusBadge';
import TextAreaField from './ui/TextAreaField';
import UserProfileTrigger from './UserProfileTrigger';
import { useFormFields } from '../hooks/useFormFields';
import { ticketService } from '../services/ticketService';
import { SORT_ORDER_OPTIONS, TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../utils/constants';
import { formatDate, humanizeEnum, truncateText } from '../utils/formatters';
import { canManageProjectTasks } from '../utils/permissions';
import { getTicketNumber, toAssigneeOption, toTicketLookupOption } from '../utils/tickets';
import styles from './TaskListSection.module.css';

const initialTicketState = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'NEW',
  assigneeId: '',
  dueDate: '',
  linkedTicketId: '',
  originalReplicaTicketId: '',
};

function TaskListSection({
  projectId,
  tickets,
  loading,
  error,
  filters,
  onFiltersChange,
  projectRole,
  onCreateTicket,
  onUpdateTicket,
}) {
  const canManageTickets = canManageProjectTasks(projectRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assigneeOption, setAssigneeOption] = useState(null);
  const [linkedTicketOption, setLinkedTicketOption] = useState(null);
  const [originalReplicaOption, setOriginalReplicaOption] = useState(null);
  const [assigneeFilterOption, setAssigneeFilterOption] = useState(null);
  const { values, updateField, setValues, resetForm } = useFormFields(initialTicketState);

  useEffect(() => {
    if (!filters.assigneeId) {
      setAssigneeFilterOption(null);
    }
  }, [filters.assigneeId]);

  async function loadAssigneeOptions(search) {
    const response = await ticketService.searchTicketAssignees(projectId, search);
    return (response || []).map(toAssigneeOption).filter(Boolean);
  }

  async function loadTicketLookupOptions(search) {
    const response = await ticketService.lookupTickets({
      search,
      projectId,
      excludeTaskId: editingTicket?.id || '',
    });
    return (response || []).map(toTicketLookupOption).filter(Boolean);
  }

  function resetTicketForm() {
    resetForm(initialTicketState);
    setAssigneeOption(null);
    setLinkedTicketOption(null);
    setOriginalReplicaOption(null);
  }

  function openCreateModal() {
    setEditingTicket(null);
    setSubmitError('');
    resetTicketForm();
    setIsModalOpen(true);
  }

  function openEditModal(ticket) {
    setEditingTicket(ticket);
    setSubmitError('');
    setValues({
      title: ticket.title || '',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM',
      status: ticket.status || 'NEW',
      assigneeId: ticket.assignee?.id ? String(ticket.assignee.id) : '',
      dueDate: ticket.dueDate || '',
      linkedTicketId: ticket.linkedTicket?.id ? String(ticket.linkedTicket.id) : '',
      originalReplicaTicketId: ticket.originalReplicaTicket?.id ? String(ticket.originalReplicaTicket.id) : '',
    });
    setAssigneeOption(ticket.assignee ? toAssigneeOption(ticket.assignee) : null);
    setLinkedTicketOption(ticket.linkedTicket ? toTicketLookupOption(ticket.linkedTicket) : null);
    setOriginalReplicaOption(ticket.originalReplicaTicket ? toTicketLookupOption(ticket.originalReplicaTicket) : null);
    setIsModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.title.trim()) {
      setSubmitError('Ticket title is required.');
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      status: values.status,
      assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
      dueDate: values.dueDate || null,
      linkedTicketId: values.linkedTicketId ? Number(values.linkedTicketId) : null,
      originalReplicaTicketId: values.originalReplicaTicketId ? Number(values.originalReplicaTicketId) : null,
    };

    try {
      setSubmitting(true);
      setSubmitError('');

      if (editingTicket) {
        await onUpdateTicket(editingTicket.id, payload);
      } else {
        await onCreateTicket(payload);
      }

      setIsModalOpen(false);
      resetTicketForm();
      setEditingTicket(null);
    } catch (submitLoadError) {
      setSubmitError(submitLoadError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card card--padded">
      <div className="section-header">
        <div>
          <h2>Tickets</h2>
          <p>Search, sort, and coordinate project tickets without leaving the workspace.</p>
        </div>
        {canManageTickets ? (
          <Button onClick={openCreateModal}>Create Ticket</Button>
        ) : (
          <span className="pill-note">View-only access</span>
        )}
      </div>

      <div className={styles.filters}>
        <InputField
          label="Search tickets"
          name="ticketSearch"
          onChange={(event) => onFiltersChange('search', event.target.value)}
          placeholder="Search by number, title, or description"
          value={filters.search}
        />
        <SelectField
          label="Sort"
          name="ticketSort"
          onChange={(event) => onFiltersChange('sort', event.target.value)}
          options={SORT_ORDER_OPTIONS.map((sort) => ({
            label: humanizeEnum(sort),
            value: sort,
          }))}
          value={filters.sort}
        />
        <SelectField
          label="Status"
          name="ticketStatus"
          onChange={(event) => onFiltersChange('status', event.target.value)}
          options={TICKET_STATUS_OPTIONS.map((status) => ({
            label: humanizeEnum(status),
            value: status,
          }))}
          placeholder="All statuses"
          value={filters.status}
        />
        <AsyncAutocompleteField
          emptyMessage="No matching teammates found."
          label="Assignee"
          loadErrorMessage="Unable to load teammates right now."
          loadOptions={loadAssigneeOptions}
          onSelect={(option) => {
            setAssigneeFilterOption(option);
            onFiltersChange('assigneeId', option?.value || '');
          }}
          placeholder="Filter by teammate"
          value={assigneeFilterOption}
        />
      </div>

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      {loading ? (
        <div className="inline-message">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <EmptyState
          actionLabel={canManageTickets ? 'Create first ticket' : undefined}
          description="Tickets created here will appear in the project workspace and ticket detail views."
          onAction={canManageTickets ? openCreateModal : undefined}
          title="No tickets match these filters"
        />
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link className={styles.taskLink} to={`/tickets/${ticket.id}`}>
                      <span className={styles.ticketNumber}>{getTicketNumber(ticket)}</span>
                      <strong>{ticket.title}</strong>
                      <div className="task-meta">{truncateText(ticket.description || 'No description yet.', 96)}</div>
                    </Link>
                  </td>
                  <td>
                    <StatusBadge value={ticket.status} />
                  </td>
                  <td>
                    <StatusBadge value={ticket.priority} />
                  </td>
                  <td>
                    {ticket.assignee ? (
                      <UserProfileTrigger user={ticket.assignee}>{ticket.assignee.fullName}</UserProfileTrigger>
                    ) : (
                      'Unassigned'
                    )}
                  </td>
                  <td>{formatDate(ticket.dueDate)}</td>
                  <td>
                    <div className="table-actions">
                      <Button size="sm" to={`/tickets/${ticket.id}`} variant="ghost">
                        Open
                      </Button>
                      {canManageTickets ? (
                        <Button onClick={() => openEditModal(ticket)} size="sm" variant="secondary">
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
        description="Keep each ticket structured with ownership, status, due date, and ticket relationships."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTicket ? 'Edit Ticket' : 'Create Ticket'}
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <InputField
            label="Title"
            name="title"
            onChange={updateField}
            placeholder="Investigate flaky login flow"
            required
            value={values.title}
          />
          <SelectField
            label="Status"
            name="status"
            onChange={updateField}
            options={TICKET_STATUS_OPTIONS.map((status) => ({
              label: humanizeEnum(status),
              value: status,
            }))}
            value={values.status}
          />
          <TextAreaField
            label="Description"
            name="description"
            onChange={updateField}
            placeholder="What should this ticket cover?"
            rows={5}
            value={values.description}
          />
          <SelectField
            label="Priority"
            name="priority"
            onChange={updateField}
            options={TICKET_PRIORITY_OPTIONS.map((priority) => ({
              label: humanizeEnum(priority),
              value: priority,
            }))}
            value={values.priority}
          />
          <AsyncAutocompleteField
            emptyMessage="No matching teammates found."
            label="Assignee"
            loadErrorMessage="Unable to load teammates right now."
            loadOptions={loadAssigneeOptions}
            onSelect={(option) => {
              setAssigneeOption(option);
              updateField('assigneeId', option?.value || '');
            }}
            placeholder="Search project teammates"
            value={assigneeOption}
          />
          <InputField
            label="Due date"
            name="dueDate"
            onChange={updateField}
            type="date"
            value={values.dueDate}
          />
          <AsyncAutocompleteField
            emptyMessage="No related tickets found."
            label="Linked Ticket"
            loadErrorMessage="Unable to load related tickets right now."
            loadOptions={loadTicketLookupOptions}
            onSelect={(option) => {
              setLinkedTicketOption(option);
              updateField('linkedTicketId', option?.value || '');
            }}
            placeholder="Search tickets in this project"
            value={linkedTicketOption}
          />
          <AsyncAutocompleteField
            emptyMessage="No replica tickets found."
            label="Original Replica"
            loadErrorMessage="Unable to load replica tickets right now."
            loadOptions={loadTicketLookupOptions}
            onSelect={(option) => {
              setOriginalReplicaOption(option);
              updateField('originalReplicaTicketId', option?.value || '');
            }}
            placeholder="Search tickets to mark as the source"
            value={originalReplicaOption}
          />

          <div className="form-actions">
            <Button loading={submitting} type="submit">
              {editingTicket ? 'Save Changes' : 'Create Ticket'}
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
