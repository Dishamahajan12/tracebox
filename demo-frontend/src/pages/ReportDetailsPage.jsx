import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import AsyncAutocompleteField from '../components/ui/AsyncAutocompleteField';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import InputField from '../components/ui/InputField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';
import SelectField from '../components/ui/SelectField';
import StatusBadge from '../components/ui/StatusBadge';
import TextAreaField from '../components/ui/TextAreaField';
import UserProfileTrigger from '../components/UserProfileTrigger';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useFormFields } from '../hooks/useFormFields';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import { reportService } from '../services/reportService';
import { ticketService } from '../services/ticketService';
import { SORT_ORDER_OPTIONS, TICKET_STATUS_OPTIONS } from '../utils/constants';
import { getApiErrorMessage } from '../utils/errors';
import { formatDate, formatDateTime, humanizeEnum, truncateText } from '../utils/formatters';
import { canManageProjectTasks, resolveProjectRole } from '../utils/permissions';
import { getTicketNumber, toAssigneeOption } from '../utils/tickets';
import styles from './ReportDetailsPage.module.css';

const initialReportState = {
  name: '',
  description: '',
  searchText: '',
  status: '',
  sortOrder: 'NEWEST',
  assigneeId: '',
};

function buildReportPayload(values) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    searchText: values.searchText.trim() || null,
    status: values.status || null,
    assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
    sortOrder: values.sortOrder || 'NEWEST',
  };
}

function buildActiveTicketFilters(values, selectedAssignee) {
  const filters = [];

  if (values.searchText.trim()) {
    filters.push(`Search: ${values.searchText.trim()}`);
  }

  if (values.status) {
    filters.push(`Status: ${humanizeEnum(values.status)}`);
  }

  if (selectedAssignee?.label) {
    filters.push(`Assignee: ${selectedAssignee.label}`);
  }

  filters.push(`Sort: ${humanizeEnum(values.sortOrder || 'NEWEST')}`);
  return filters;
}

function ReportDetailsPage() {
  const { reportId } = useParams();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [members, setMembers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const { values, updateField, setValues } = useFormFields(initialReportState);
  const debouncedSearchText = useDebouncedValue(values.searchText, 300);

  const projectRole = useMemo(() => resolveProjectRole(null, members, currentUser), [members, currentUser]);
  const canEditReport = canManageProjectTasks(projectRole);
  const activeTicketFilters = useMemo(
    () => buildActiveTicketFilters(values, selectedAssignee),
    [selectedAssignee, values],
  );
  const hasActiveTicketFilters = Boolean(values.searchText.trim() || values.status || values.assigneeId);

  function syncReportState(reportData) {
    setValues({
      name: reportData.name || '',
      description: reportData.description || '',
      searchText: reportData.searchText || '',
      status: reportData.status || '',
      sortOrder: reportData.sortOrder || 'NEWEST',
      assigneeId: reportData.assignee?.id ? String(reportData.assignee.id) : '',
    });
    setSelectedAssignee(reportData.assignee ? toAssigneeOption(reportData.assignee) : null);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadReportWorkspace() {
      try {
        setLoading(true);
        setError('');

        const reportData = await reportService.getReport(reportId);
        const memberData = reportData.projectId ? await memberService.getProjectMembers(reportData.projectId) : [];

        if (!isMounted) {
          return;
        }

        setReport(reportData);
        setMembers(memberData || []);
        syncReportState(reportData);
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load this report.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReportWorkspace();

    return () => {
      isMounted = false;
    };
  }, [reportId, setValues]);

  useEffect(() => {
    if (!report?.projectId) {
      setTickets([]);
      setTicketError('');
      setTicketLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadMatchingTickets() {
      try {
        setTicketLoading(true);
        setTicketError('');
        const response = await ticketService.getProjectTickets(report.projectId, {
          search: debouncedSearchText,
          sort: values.sortOrder || 'NEWEST',
          status: values.status,
          assigneeId: values.assigneeId,
        });

        if (isMounted) {
          setTickets(response || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setTicketError(getApiErrorMessage(loadError, 'Unable to load tickets for this report.'));
        }
      } finally {
        if (isMounted) {
          setTicketLoading(false);
        }
      }
    }

    loadMatchingTickets();

    return () => {
      isMounted = false;
    };
  }, [report?.projectId, debouncedSearchText, values.assigneeId, values.sortOrder, values.status]);

  async function loadAssigneeOptions(search) {
    if (!report?.projectId) {
      return [];
    }

    const response = await ticketService.searchTicketAssignees(report.projectId, search);
    return (response || []).map(toAssigneeOption).filter(Boolean);
  }

  async function handleSaveReport(event) {
    event.preventDefault();

    if (!values.name.trim()) {
      setSaveError('Report name is required.');
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      const updatedReport = await reportService.updateReport(reportId, buildReportPayload(values));
      setReport(updatedReport);
      syncReportState(updatedReport);
      showSuccess('Report updated', 'Saved filters and report details were updated.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to save this report.');
      setSaveError(message);
      showError('Report update failed', message);
    } finally {
      setSaving(false);
    }
  }

  function handleResetToSaved() {
    if (!report) {
      return;
    }

    setSaveError('');
    syncReportState(report);
  }

  function handleClearTicketFilters() {
    updateField('searchText', '');
    updateField('status', '');
    updateField('assigneeId', '');
    setSelectedAssignee(null);
  }

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading report details" />
      </div>
    );
  }

  if (!report) {
    return <div className="inline-message inline-message--error">{error || 'Report not found.'}</div>;
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          report.projectId ? (
            <Button to={`/projects/${report.projectId}`} variant="ghost">
              Back to Project
            </Button>
          ) : (
            <Button to="/projects" variant="ghost">
              Back to Projects
            </Button>
          )
        }
        description={values.description || 'Save a report once, then keep its ticket filters current here.'}
        eyebrow={report.projectName || 'Report'}
        title={values.name || `Report #${report.id}`}
      />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      <section className={styles.layout}>
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Editable Report Filters</h2>
              <p>Change the saved filters here and the ticket list below refreshes using the current values.</p>
            </div>
            <div className={styles.liveMeta}>
              <span className="pill-note">{tickets.length} matching ticket{tickets.length === 1 ? '' : 's'}</span>
              {values.status ? <StatusBadge value={values.status} /> : null}
            </div>
          </div>

          {!canEditReport ? (
            <div className="inline-message">
              You can view this report, but only project members and above can save filter changes.
            </div>
          ) : null}

          {saveError ? <div className="inline-message inline-message--error">{saveError}</div> : null}

          <form className={styles.form} onSubmit={handleSaveReport}>
            <InputField
              disabled={!canEditReport}
              label="Report name"
              name="name"
              onChange={updateField}
              required
              value={values.name}
            />
            <SelectField
              disabled={!canEditReport}
              label="Default sort"
              name="sortOrder"
              onChange={updateField}
              options={SORT_ORDER_OPTIONS.map((sort) => ({
                label: humanizeEnum(sort),
                value: sort,
              }))}
              value={values.sortOrder}
            />
            <TextAreaField
              disabled={!canEditReport}
              label="Description"
              name="description"
              onChange={updateField}
              rows={4}
              value={values.description}
            />
            <InputField
              disabled={!canEditReport}
              hint="Leave blank to include all tickets in this project."
              label="Ticket search"
              name="searchText"
              onChange={updateField}
              placeholder="Search by ticket number, title, or description"
              value={values.searchText}
            />
            <SelectField
              disabled={!canEditReport}
              label="Status"
              name="status"
              onChange={updateField}
              options={TICKET_STATUS_OPTIONS.map((status) => ({
                label: humanizeEnum(status),
                value: status,
              }))}
              placeholder="Any status"
              value={values.status}
            />
            <AsyncAutocompleteField
              disabled={!canEditReport}
              emptyMessage="No matching teammates found."
              label="Assignee"
              loadErrorMessage="Unable to load teammates right now."
              loadOptions={loadAssigneeOptions}
              onSelect={(option) => {
                setSelectedAssignee(option);
                updateField('assigneeId', option?.value || '');
              }}
              placeholder="Any teammate"
              value={selectedAssignee}
            />

            <div className="form-actions">
              {canEditReport ? (
                <Button loading={saving} type="submit">
                  Save Report
                </Button>
              ) : null}
              {canEditReport ? (
                <Button onClick={handleResetToSaved} type="button" variant="ghost">
                  Reset to Saved
                </Button>
              ) : null}
              <Button onClick={handleClearTicketFilters} type="button" variant="ghost">
                Clear Ticket Filters
              </Button>
              {report.projectId ? (
                <Button to={`/projects/${report.projectId}/reports`} type="button" variant="ghost">
                  Project Reports
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Report Metadata</h2>
              <p>Saved report identity plus the project context it pulls tickets from.</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Project</dt>
              <dd>{report.projectName || report.projectId || 'Unknown project'}</dd>
            </div>
            <div>
              <dt>Report ID</dt>
              <dd>{report.id}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>
                {report.createdBy ? (
                  <UserProfileTrigger user={report.createdBy}>{report.createdBy.fullName}</UserProfileTrigger>
                ) : (
                  'Unknown'
                )}
              </dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(report.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(report.updatedAt)}</dd>
            </div>
            <div>
              <dt>Your access</dt>
              <dd>{projectRole ? humanizeEnum(projectRole) : 'Unknown'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card card--padded">
        <div className="section-header">
          <div>
            <h2>Matching Tickets</h2>
            <p>These tickets are pulled live from the project using the current report filters.</p>
          </div>
          <div className={styles.liveMeta}>
            <span className="pill-note">{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span>
            <span className="pill-note">Sort: {humanizeEnum(values.sortOrder || 'NEWEST')}</span>
          </div>
        </div>

        <div className={styles.filterSummary}>
          {activeTicketFilters.map((filterLabel) => (
            <span className="pill-note" key={filterLabel}>
              {filterLabel}
            </span>
          ))}
        </div>

        {ticketError ? <div className="inline-message inline-message--error">{ticketError}</div> : null}

        {ticketLoading ? (
          <div className="inline-message">Loading matching tickets...</div>
        ) : tickets.length === 0 ? (
          <EmptyState
            description={
              hasActiveTicketFilters
                ? 'The current ticket filters are excluding every ticket. Clear the search or status filter to broaden the results.'
                : 'Adjust the report filters above and matching tickets will appear here.'
            }
            title="No tickets match this report"
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
                      <div className={styles.ticketCell}>
                        <span className={styles.ticketNumber}>{getTicketNumber(ticket)}</span>
                        <strong>{ticket.title}</strong>
                        <span className="task-meta">{truncateText(ticket.description || 'No description yet.', 96)}</span>
                      </div>
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
                      <Button size="sm" to={`/tickets/${ticket.id}`} variant="ghost">
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ReportDetailsPage;
