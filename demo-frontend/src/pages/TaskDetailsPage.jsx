import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommentsSection from '../components/CommentsSection';
import UserProfileTrigger from '../components/UserProfileTrigger';
import AsyncAutocompleteField from '../components/ui/AsyncAutocompleteField';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
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
import { ticketService } from '../services/ticketService';
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../utils/constants';
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatDateTime, formatFileSize, humanizeEnum } from '../utils/formatters';
import { canManageProjectTasks, resolveProjectRole } from '../utils/permissions';
import { getTicketNumber, toAssigneeOption, toTicketLookupOption } from '../utils/tickets';
import styles from './TaskDetailsPage.module.css';

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

function resolveHistoryActor(entry) {
  return entry?.changedBy || entry?.actor || entry?.user || entry?.createdBy || entry?.updatedBy || null;
}

function resolveHistoryTimestamp(entry) {
  return entry?.changedAt || entry?.createdAt || entry?.updatedAt || entry?.timestamp || null;
}

function buildHistoryTitle(entry) {
  if (entry?.action) {
    return humanizeEnum(entry.action);
  }

  if (entry?.eventType) {
    return humanizeEnum(entry.eventType);
  }

  if (entry?.fieldName) {
    return `${humanizeEnum(entry.fieldName)} Changed`;
  }

  return 'Ticket Updated';
}

function normalizeHistoryValue(value, emptyLabel = 'Not set') {
  if (value === null || value === undefined) {
    return emptyLabel;
  }

  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text === 'None') {
    return emptyLabel;
  }

  return text;
}

function formatHistoryValue(value, emptyLabel = 'Not set') {
  const normalizedValue = normalizeHistoryValue(value, emptyLabel);

  if (normalizedValue === emptyLabel) {
    return normalizedValue;
  }

  return /^[A-Z][A-Z0-9_]*$/.test(normalizedValue) ? humanizeEnum(normalizedValue) : normalizedValue;
}

function formatHistoryDateValue(value, emptyLabel = 'Not set') {
  const normalizedValue = normalizeHistoryValue(value, emptyLabel);

  if (normalizedValue === emptyLabel) {
    return normalizedValue;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? formatDate(normalizedValue) : normalizedValue;
}

function formatHistoryChange(change) {
  const normalizedChange = change?.trim();

  if (!normalizedChange) {
    return '';
  }

  const updateMatch = normalizedChange.match(/^([^:]+):\s*(.+?)\s*->\s*(.+)$/);
  if (updateMatch) {
    const [, rawField, rawBeforeValue, rawAfterValue] = updateMatch;
    const field = rawField.trim().toLowerCase();
    const fieldLabel = humanizeEnum(rawField.trim().replace(/\s+/g, '_'));

    if (field === 'status' || field === 'priority') {
      return `${fieldLabel} updated from ${formatHistoryValue(rawBeforeValue)} to ${formatHistoryValue(rawAfterValue)}.`;
    }

    if (field === 'assignee') {
      return `Assignee updated from ${formatHistoryValue(rawBeforeValue, 'Unassigned')} to ${formatHistoryValue(rawAfterValue, 'Unassigned')}.`;
    }

    if (field === 'due date') {
      return `Due date updated from ${formatHistoryDateValue(rawBeforeValue)} to ${formatHistoryDateValue(rawAfterValue)}.`;
    }

    if (field === 'linked ticket') {
      return `Linked ticket updated from ${formatHistoryValue(rawBeforeValue, 'Not linked')} to ${formatHistoryValue(rawAfterValue, 'Not linked')}.`;
    }

    if (field === 'original replica') {
      return `Original replica updated from ${formatHistoryValue(rawBeforeValue, 'Not set')} to ${formatHistoryValue(rawAfterValue, 'Not set')}.`;
    }

    return `${fieldLabel} updated from ${formatHistoryValue(rawBeforeValue)} to ${formatHistoryValue(rawAfterValue)}.`;
  }

  if (/updated$/i.test(normalizedChange)) {
    return `${normalizedChange.charAt(0).toUpperCase()}${normalizedChange.slice(1)}.`;
  }

  return normalizedChange.endsWith('.') ? normalizedChange : `${normalizedChange}.`;
}

function buildHistoryDescription(entry) {
  if (entry?.details) {
    return entry.details
      .split(/\s*;\s*/)
      .filter(Boolean)
      .map((change) => formatHistoryChange(change))
      .join(' ');
  }

  if (entry?.description) {
    return entry.description;
  }

  if (entry?.fieldName) {
    return `${humanizeEnum(entry.fieldName)} updated from ${formatHistoryValue(entry.oldValue)} to ${formatHistoryValue(entry.newValue)}.`;
  }

  if (entry?.oldValue || entry?.newValue) {
    return `Updated from ${formatHistoryValue(entry.oldValue)} to ${formatHistoryValue(entry.newValue)}.`;
  }

  return 'A change was recorded for this ticket.';
}

function resolveAttachmentName(attachment) {
  return (
    attachment?.fileName ||
    attachment?.originalFileName ||
    attachment?.originalFilename ||
    attachment?.name ||
    `Attachment #${attachment?.id}`
  );
}

function resolveAttachmentSize(attachment) {
  return attachment?.sizeBytes ?? attachment?.size ?? attachment?.contentLength ?? attachment?.fileSize;
}

function resolveAttachmentAuthor(attachment) {
  return attachment?.uploadedBy || attachment?.createdBy || attachment?.user || null;
}

function TaskDetailsPage({ workspaceSection = null }) {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSort, setCommentSort] = useState('NEWEST');
  const [commentError, setCommentError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [duplicateTickets, setDuplicateTickets] = useState([]);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savingTicket, setSavingTicket] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [selectedLinkedTicket, setSelectedLinkedTicket] = useState(null);
  const [selectedOriginalReplica, setSelectedOriginalReplica] = useState(null);
  const { values, updateField, setValues } = useFormFields(initialTicketState);

  function syncFormState(ticketData) {
    setValues({
      title: ticketData.title || '',
      description: ticketData.description || '',
      priority: ticketData.priority || 'MEDIUM',
      status: ticketData.status || 'NEW',
      assigneeId: ticketData.assignee?.id ? String(ticketData.assignee.id) : '',
      dueDate: ticketData.dueDate || '',
      linkedTicketId: ticketData.linkedTicket?.id ? String(ticketData.linkedTicket.id) : '',
      originalReplicaTicketId: ticketData.originalReplicaTicket?.id
        ? String(ticketData.originalReplicaTicket.id)
        : '',
    });
    setSelectedAssignee(ticketData.assignee ? toAssigneeOption(ticketData.assignee) : null);
    setSelectedLinkedTicket(ticketData.linkedTicket ? toTicketLookupOption(ticketData.linkedTicket) : null);
    setSelectedOriginalReplica(
      ticketData.originalReplicaTicket ? toTicketLookupOption(ticketData.originalReplicaTicket) : null,
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadTicketWorkspace() {
      try {
        setLoading(true);
        setError('');

        const ticketData = await ticketService.getTicket(ticketId);
        const [projectData, memberData] = await Promise.all([
          projectService.getProject(ticketData.projectId),
          memberService.getProjectMembers(ticketData.projectId),
        ]);

        if (!isMounted) {
          return;
        }

        setTicket(ticketData);
        setProject(projectData);
        setMembers(memberData || []);
        syncFormState(ticketData);
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load this ticket.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTicketWorkspace();

    return () => {
      isMounted = false;
    };
  }, [ticketId, setValues]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      if (workspaceSection) {
        if (isMounted) {
          setComments([]);
          setCommentError('');
          setCommentsLoading(false);
        }
        return;
      }

      try {
        setCommentsLoading(true);
        setCommentError('');
        const response = await commentService.getTicketComments(ticketId, {
          sort: commentSort,
        });

        if (isMounted) {
          setComments(response || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setCommentError(getApiErrorMessage(loadError, 'Unable to load ticket comments.'));
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [ticketId, commentSort, workspaceSection]);

  useEffect(() => {
    let isMounted = true;

    async function loadRelatedSections() {
      try {
        setRelatedLoading(true);
        setRelatedError('');
        const [fileData, duplicateData, historyData] = await Promise.all([
          ticketService.getTicketFiles(ticketId),
          ticketService.getDuplicateTickets(ticketId),
          ticketService.getTicketHistory(ticketId),
        ]);

        if (!isMounted) {
          return;
        }

        setAttachments(fileData || []);
        setDuplicateTickets(duplicateData || []);
        setHistoryEntries(historyData || []);
      } catch (loadError) {
        if (isMounted) {
          setRelatedError(getApiErrorMessage(loadError, 'Unable to load ticket attachments and activity.'));
        }
      } finally {
        if (isMounted) {
          setRelatedLoading(false);
        }
      }
    }

    loadRelatedSections();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const projectRole = useMemo(() => resolveProjectRole(project, members, currentUser), [project, members, currentUser]);
  const currentMembership = useMemo(
    () => members.find((member) => member?.user?.id === currentUser?.id) || null,
    [members, currentUser],
  );
  const canEditTicket = canManageProjectTasks(projectRole);
  const isWorkspacePage = Boolean(workspaceSection);
  const canDeleteTicket =
    ticket?.createdBy?.id === currentUser?.id ||
    currentMembership?.projectRole === 'MANAGER' ||
    currentMembership?.projectRole === 'SENIOR_MANAGER';
  const workspaceMeta = {
    files: {
      label: 'Files',
      description: 'Open the dedicated ticket files page to upload, review, and download attachments.',
    },
    duplicates: {
      label: 'Duplicate Tickets',
      description: 'Open the duplicate ticket page to review linked duplicate work for this ticket.',
    },
    history: {
      label: 'Ticket History',
      description: 'Open the ticket history page to review the recorded activity timeline.',
    },
  };
  const workspacePanels = [
    {
      id: 'files',
      label: 'Files',
      description: 'Open the upload and download view for ticket attachments.',
      countLabel: `${attachments.length} file${attachments.length === 1 ? '' : 's'}`,
      to: `/tickets/${ticketId}/files`,
    },
    {
      id: 'duplicates',
      label: 'Duplicate Tickets',
      description: 'Open the linked duplicate ticket view for this record.',
      countLabel: `${duplicateTickets.length} duplicate${duplicateTickets.length === 1 ? '' : 's'}`,
      to: `/tickets/${ticketId}/duplicates`,
    },
    {
      id: 'history',
      label: 'Ticket History',
      description: 'Open the full activity timeline recorded for this ticket.',
      countLabel: `${historyEntries.length} entr${historyEntries.length === 1 ? 'y' : 'ies'}`,
      to: `/tickets/${ticketId}/history`,
    },
  ];

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading ticket details" />
      </div>
    );
  }

  if (!ticket || !project) {
    return <div className="inline-message inline-message--error">{error || 'Ticket not found.'}</div>;
  }

  async function refreshTicket() {
    const response = await ticketService.getTicket(ticketId);
    setTicket(response);
    syncFormState(response);
    return response;
  }

  async function refreshRelatedSections() {
    const [fileData, duplicateData, historyData] = await Promise.all([
      ticketService.getTicketFiles(ticketId),
      ticketService.getDuplicateTickets(ticketId),
      ticketService.getTicketHistory(ticketId),
    ]);

    setAttachments(fileData || []);
    setDuplicateTickets(duplicateData || []);
    setHistoryEntries(historyData || []);
  }

  async function refreshComments(sortOverride = commentSort) {
    setCommentError('');
    const response = await commentService.getTicketComments(ticketId, {
      sort: sortOverride,
    });
    setComments(response || []);
  }

  async function loadAssigneeOptions(search) {
    const response = await ticketService.searchTicketAssignees(project.id, search);
    return (response || []).map(toAssigneeOption).filter(Boolean);
  }

  async function loadTicketLookupOptions(search) {
    const response = await ticketService.lookupTickets({
      search,
      projectId: project.id,
      excludeTaskId: ticket.id,
    });
    return (response || []).map(toTicketLookupOption).filter(Boolean);
  }

  async function handleTicketUpdate(event) {
    event.preventDefault();

    if (!values.title.trim()) {
      setSubmitError('Ticket title is required.');
      return;
    }

    try {
      setSavingTicket(true);
      setSubmitError('');
      const updatedTicket = await ticketService.updateTicket(ticketId, {
        title: values.title.trim(),
        description: values.description.trim() || null,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
        dueDate: values.dueDate || null,
        linkedTicketId: values.linkedTicketId ? Number(values.linkedTicketId) : null,
        originalReplicaTicketId: values.originalReplicaTicketId ? Number(values.originalReplicaTicketId) : null,
      });
      setTicket(updatedTicket);
      syncFormState(updatedTicket);
      await refreshRelatedSections();
      setEditOpen(false);
      showSuccess('Ticket updated', 'Ticket details were saved successfully.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to update the ticket.');
      setSubmitError(message);
      showError('Ticket update failed', message);
    } finally {
      setSavingTicket(false);
    }
  }

  async function handleCreateComment(payload) {
    try {
      await commentService.createComment(ticketId, payload);
      await refreshComments();
      showSuccess('Comment added', 'The ticket discussion has been updated.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to add the comment.');
      showError('Comment failed', message);
      throw new Error(message);
    }
  }

  async function handleUpdateComment(commentId, payload) {
    try {
      await commentService.updateComment(commentId, payload);
      await refreshComments();
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
      await refreshComments();
      showSuccess('Comment deleted', 'The comment was removed.');
    } catch (submitLoadError) {
      const message = getApiErrorMessage(submitLoadError, 'Unable to delete the comment.');
      showError('Comment delete failed', message);
      throw new Error(message);
    }
  }

  async function handleDeleteTicket() {
    if (!window.confirm(`Delete ${getTicketNumber(ticket)}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingTicket(true);
      await ticketService.deleteTicket(ticketId);
      showSuccess('Ticket deleted', 'The ticket was removed successfully.');
      navigate(`/projects/${project.id}`);
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Unable to delete this ticket.');
      showError('Ticket delete failed', message);
    } finally {
      setDeletingTicket(false);
    }
  }

  async function handleUploadFile() {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      showError('No file selected', 'Choose a file before uploading.');
      return;
    }

    try {
      setUploadingFile(true);
      await ticketService.uploadTicketFile(ticketId, file);
      await refreshRelatedSections();
      await refreshTicket();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showSuccess('File uploaded', 'The attachment is now available on this ticket.');
    } catch (uploadError) {
      const message = getApiErrorMessage(uploadError, 'Unable to upload this file.');
      showError('Upload failed', message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDownloadFile(attachmentId) {
    try {
      const { blob, filename } = await ticketService.downloadTicketFile(ticketId, attachmentId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      const message = getApiErrorMessage(downloadError, 'Unable to download this file.');
      showError('Download failed', message);
    }
  }

  function renderHeaderActions() {
    return (
      <>
        {isWorkspacePage ? (
          <Button to={`/tickets/${ticketId}`} variant="ghost">
            Back to Ticket
          </Button>
        ) : null}
        <Button to={`/projects/${project.id}`} variant="ghost">
          Back to Project
        </Button>
        {canEditTicket ? (
          <Button onClick={() => setEditOpen(true)} variant="secondary">
            Edit Ticket
          </Button>
        ) : null}
        {canDeleteTicket ? (
          <Button loading={deletingTicket} onClick={handleDeleteTicket} variant="danger">
            Delete Ticket
          </Button>
        ) : null}
      </>
    );
  }

  function renderWorkspaceCards() {
    return (
      <section className={styles.workspaceSection}>
        <div className="section-header">
          <div>
            <h2>Related Ticket Views</h2>
            <p>Open files, duplicate tickets, or ticket history on their own page.</p>
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

  function renderFilesSection() {
    return (
      <section className="card card--padded">
        <div className="section-header">
          <div>
            <h2>Files</h2>
            <p>Upload and download ticket attachments without leaving the ticket workspace.</p>
          </div>
        </div>

        {canEditTicket ? (
          <div className={styles.fileUploader}>
            <input ref={fileInputRef} type="file" />
            <Button loading={uploadingFile} onClick={handleUploadFile} variant="secondary">
              Upload File
            </Button>
          </div>
        ) : null}

        {relatedLoading ? (
          <div className="inline-message">Loading related ticket data...</div>
        ) : attachments.length === 0 ? (
          <EmptyState description="Ticket files will appear here once they are uploaded." title="No files yet" />
        ) : (
          <div className="stack">
            {attachments.map((attachment) => {
              const author = resolveAttachmentAuthor(attachment);

              return (
                <div className={styles.relatedItem} key={attachment.id}>
                  <div className="split-row">
                    <div className="stack--sm">
                      <strong>{resolveAttachmentName(attachment)}</strong>
                      <span className="muted">
                        {formatFileSize(resolveAttachmentSize(attachment))} | Added{' '}
                        {formatDateTime(attachment.createdAt || attachment.uploadedAt)}
                      </span>
                    </div>
                    <Button onClick={() => handleDownloadFile(attachment.id)} size="sm" variant="ghost">
                      Download
                    </Button>
                  </div>
                  {author ? (
                    <div className="muted">
                      Uploaded by <UserProfileTrigger user={author}>{author.fullName || author.email}</UserProfileTrigger>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderDuplicateTicketsSection() {
    return (
      <section className="card card--padded">
        <div className="section-header">
          <div>
            <h2>Duplicate Tickets</h2>
            <p>Follow connected duplicate work and jump into the related ticket thread quickly.</p>
          </div>
        </div>

        {relatedLoading ? (
          <div className="inline-message">Loading related ticket data...</div>
        ) : duplicateTickets.length === 0 ? (
          <EmptyState
            description="Duplicate tickets linked by the backend will appear here."
            title="No duplicate tickets"
          />
        ) : (
          <div className="stack">
            {duplicateTickets.map((duplicateTicket) => (
              <div className={styles.relatedItem} key={duplicateTicket.id}>
                <div className="split-row">
                  <div className="stack--sm">
                    <span className="pill-note">{getTicketNumber(duplicateTicket)}</span>
                    <strong>{duplicateTicket.title}</strong>
                  </div>
                  <div className="badge-row">
                    <StatusBadge value={duplicateTicket.status} />
                    <StatusBadge value={duplicateTicket.priority} />
                  </div>
                </div>
                <p className="muted">{duplicateTicket.description || 'No description available for this duplicate ticket.'}</p>
                <Button size="sm" to={`/tickets/${duplicateTicket.id}`} variant="ghost">
                  Open Ticket
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderHistorySection() {
    return (
      <section className="card card--padded">
        <div className="section-header">
          <div>
            <h2>Ticket History</h2>
            <p>Audit the changes recorded for this ticket as it moved through the workflow.</p>
          </div>
        </div>

        {relatedLoading ? (
          <div className="inline-message">Loading related ticket data...</div>
        ) : historyEntries.length === 0 ? (
          <EmptyState description="History entries will appear here when backend activity is available." title="No history yet" />
        ) : (
          <div className="stack">
            {historyEntries.map((entry, index) => {
              const actor = resolveHistoryActor(entry);

              return (
                <article className={styles.historyItem} key={entry.id || `${resolveHistoryTimestamp(entry)}-${index}`}>
                  <div className="split-row">
                    <div className={styles.historySummary}>
                      <strong>{buildHistoryTitle(entry)}</strong>
                      <span className="muted">{buildHistoryDescription(entry)}</span>
                    </div>
                    <span className="muted">{formatDateTime(resolveHistoryTimestamp(entry))}</span>
                  </div>
                  {actor ? (
                    <div className="muted">
                      By <UserProfileTrigger user={actor}>{actor.fullName || actor.email}</UserProfileTrigger>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderWorkspaceSection(sectionId) {
    if (sectionId === 'files') {
      return renderFilesSection();
    }

    if (sectionId === 'duplicates') {
      return renderDuplicateTicketsSection();
    }

    return renderHistorySection();
  }

  function renderEditModal() {
    return (
      <Modal
        description="Members and above can keep the ticket current without leaving the detail page."
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Ticket"
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className="form-grid" onSubmit={handleTicketUpdate}>
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
              setSelectedAssignee(option);
              updateField('assigneeId', option?.value || '');
            }}
            placeholder="Search project teammates"
            value={selectedAssignee}
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
              setSelectedLinkedTicket(option);
              updateField('linkedTicketId', option?.value || '');
            }}
            placeholder="Search tickets in this project"
            value={selectedLinkedTicket}
          />
          <AsyncAutocompleteField
            emptyMessage="No replica tickets found."
            label="Original Replica"
            loadErrorMessage="Unable to load replica tickets right now."
            loadOptions={loadTicketLookupOptions}
            onSelect={(option) => {
              setSelectedOriginalReplica(option);
              updateField('originalReplicaTicketId', option?.value || '');
            }}
            placeholder="Search tickets to mark as the source"
            value={selectedOriginalReplica}
          />

          <div className="form-actions">
            <Button loading={savingTicket} type="submit">
              Save Ticket
            </Button>
            <Button onClick={() => setEditOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (isWorkspacePage) {
    return (
      <div className="page">
        <PageHeader actions={renderHeaderActions()} title={getTicketNumber(ticket)} />

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}
        {relatedError ? <div className="inline-message inline-message--error">{relatedError}</div> : null}

        {renderWorkspaceCards()}

        <div className={styles.workspacePanel}>{renderWorkspaceSection(workspaceSection)}</div>

        {renderEditModal()}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader actions={renderHeaderActions()} title={getTicketNumber(ticket)} />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}
      {commentError ? <div className="inline-message inline-message--error">{commentError}</div> : null}
      {relatedError ? <div className="inline-message inline-message--error">{relatedError}</div> : null}

      {renderWorkspaceCards()}

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Ticket Summary</h2>
              <p>Status, priority, and related activity stay tied to the project permissions you already hold.</p>
            </div>
            <div className="badge-row">
              <span className="pill-note">{getTicketNumber(ticket)}</span>
              <StatusBadge value={ticket.status} />
              <StatusBadge value={ticket.priority} />
            </div>
          </div>

          <p>{ticket.description || 'Add implementation notes, acceptance criteria, or blockers to make this ticket clearer.'}</p>

          <div className={styles.summaryMeta}>
            <span className="pill-note">Project: {project.name}</span>
            <span className="pill-note">Updated {formatDateTime(ticket.updatedAt)}</span>
          </div>

          {!canEditTicket ? (
            <div className="inline-message">Viewer access is read-only here, but comments can still keep the discussion moving.</div>
          ) : null}
        </div>

        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Ticket Facts</h2>
              <p>Backend-backed metadata for this ticket record.</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Ticket Number</dt>
              <dd>{getTicketNumber(ticket)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{humanizeEnum(ticket.status)}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{humanizeEnum(ticket.priority)}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>
                {ticket.assignee ? (
                  <UserProfileTrigger user={ticket.assignee}>{ticket.assignee.fullName}</UserProfileTrigger>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(ticket.dueDate)}</dd>
            </div>
            <div>
              <dt>Linked Ticket</dt>
              <dd>
                {ticket.linkedTicket ? (
                  <Button size="sm" to={`/tickets/${ticket.linkedTicket.id}`} variant="ghost">
                    {getTicketNumber(ticket.linkedTicket)}
                  </Button>
                ) : (
                  'Not linked'
                )}
              </dd>
            </div>
            <div>
              <dt>Original Replica</dt>
              <dd>
                {ticket.originalReplicaTicket ? (
                  <Button size="sm" to={`/tickets/${ticket.originalReplicaTicket.id}`} variant="ghost">
                    {getTicketNumber(ticket.originalReplicaTicket)}
                  </Button>
                ) : (
                  'Not set'
                )}
              </dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>
                {ticket.createdBy ? (
                  <UserProfileTrigger user={ticket.createdBy}>{ticket.createdBy.fullName}</UserProfileTrigger>
                ) : (
                  'Unknown'
                )}
              </dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(ticket.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(ticket.updatedAt)}</dd>
            </div>
            <div>
              <dt>Your project access</dt>
              <dd>{humanizeEnum(projectRole)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {false ? (
      <section className={styles.relatedGrid}>
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Files</h2>
              <p>Upload and download ticket attachments without leaving the detail view.</p>
            </div>
          </div>

          {canEditTicket ? (
            <div className={styles.fileUploader}>
              <input ref={fileInputRef} type="file" />
              <Button loading={uploadingFile} onClick={handleUploadFile} variant="secondary">
                Upload File
              </Button>
            </div>
          ) : null}

          {relatedLoading ? (
            <div className="inline-message">Loading related ticket data...</div>
          ) : attachments.length === 0 ? (
            <EmptyState description="Ticket files will appear here once they are uploaded." title="No files yet" />
          ) : (
            <div className="stack">
              {attachments.map((attachment) => {
                const author = resolveAttachmentAuthor(attachment);

                return (
                  <div className={styles.relatedItem} key={attachment.id}>
                    <div className="split-row">
                      <div className="stack--sm">
                        <strong>{resolveAttachmentName(attachment)}</strong>
                        <span className="muted">
                          {formatFileSize(resolveAttachmentSize(attachment))} • Added {formatDateTime(
                            attachment.createdAt || attachment.uploadedAt,
                          )}
                        </span>
                      </div>
                      <Button onClick={() => handleDownloadFile(attachment.id)} size="sm" variant="ghost">
                        Download
                      </Button>
                    </div>
                    {author ? (
                      <div className="muted">
                        Uploaded by <UserProfileTrigger user={author}>{author.fullName || author.email}</UserProfileTrigger>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Duplicate Tickets</h2>
              <p>Follow connected duplicate work and jump into the related ticket thread quickly.</p>
            </div>
          </div>

          {relatedLoading ? (
            <div className="inline-message">Loading related ticket data...</div>
          ) : duplicateTickets.length === 0 ? (
            <EmptyState
              description="Duplicate tickets linked by the backend will appear here."
              title="No duplicate tickets"
            />
          ) : (
            <div className="stack">
              {duplicateTickets.map((duplicateTicket) => (
                <div className={styles.relatedItem} key={duplicateTicket.id}>
                  <div className="split-row">
                    <div className="stack--sm">
                      <span className="pill-note">{getTicketNumber(duplicateTicket)}</span>
                      <strong>{duplicateTicket.title}</strong>
                    </div>
                    <div className="badge-row">
                      <StatusBadge value={duplicateTicket.status} />
                      <StatusBadge value={duplicateTicket.priority} />
                    </div>
                  </div>
                  <p className="muted">{duplicateTicket.description || 'No description available for this duplicate ticket.'}</p>
                  <Button size="sm" to={`/tickets/${duplicateTicket.id}`} variant="ghost">
                    Open Ticket
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      ) : null}

      {false ? (
      <section className="card card--padded">
        <div className="section-header">
          <div>
            <h2>Ticket History</h2>
            <p>Audit the changes recorded for this ticket as it moved through the workflow.</p>
          </div>
        </div>

        {relatedLoading ? (
          <div className="inline-message">Loading related ticket data...</div>
        ) : historyEntries.length === 0 ? (
          <EmptyState description="History entries will appear here when backend activity is available." title="No history yet" />
        ) : (
          <div className="stack">
            {historyEntries.map((entry, index) => {
              const actor = resolveHistoryActor(entry);

              return (
                <article className={styles.historyItem} key={entry.id || `${resolveHistoryTimestamp(entry)}-${index}`}>
                  <div className="split-row">
                    <div className={styles.historySummary}>
                      <strong>{buildHistoryTitle(entry)}</strong>
                      <span className="muted">{buildHistoryDescription(entry)}</span>
                    </div>
                    <span className="muted">{formatDateTime(resolveHistoryTimestamp(entry))}</span>
                  </div>
                  {actor ? (
                    <div className="muted">
                      By <UserProfileTrigger user={actor}>{actor.fullName || actor.email}</UserProfileTrigger>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      <CommentsSection
        comments={comments}
        currentUser={currentUser}
        loading={commentsLoading}
        onCreateComment={handleCreateComment}
        onDeleteComment={handleDeleteComment}
        onSortChange={setCommentSort}
        onUpdateComment={handleUpdateComment}
        projectRole={projectRole}
        sortOrder={commentSort}
      />

      {renderEditModal()}

      {false ? (
      <Modal
        description="Members and above can keep the ticket current without leaving the detail page."
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Ticket"
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className="form-grid" onSubmit={handleTicketUpdate}>
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
              setSelectedAssignee(option);
              updateField('assigneeId', option?.value || '');
            }}
            placeholder="Search project teammates"
            value={selectedAssignee}
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
              setSelectedLinkedTicket(option);
              updateField('linkedTicketId', option?.value || '');
            }}
            placeholder="Search tickets in this project"
            value={selectedLinkedTicket}
          />
          <AsyncAutocompleteField
            emptyMessage="No replica tickets found."
            label="Original Replica"
            loadErrorMessage="Unable to load replica tickets right now."
            loadOptions={loadTicketLookupOptions}
            onSelect={(option) => {
              setSelectedOriginalReplica(option);
              updateField('originalReplicaTicketId', option?.value || '');
            }}
            placeholder="Search tickets to mark as the source"
            value={selectedOriginalReplica}
          />

          <div className="form-actions">
            <Button loading={savingTicket} type="submit">
              Save Ticket
            </Button>
            <Button onClick={() => setEditOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      ) : null}
    </div>
  );
}

export default TaskDetailsPage;
