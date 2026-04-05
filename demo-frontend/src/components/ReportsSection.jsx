import { useState } from 'react';
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
import { SORT_ORDER_OPTIONS, TICKET_STATUS_OPTIONS } from '../utils/constants';
import { formatDateTime, humanizeEnum } from '../utils/formatters';
import { canManageProjectTasks } from '../utils/permissions';
import { toAssigneeOption } from '../utils/tickets';
import styles from './ReportsSection.module.css';

const initialReportState = {
  name: '',
  description: '',
  searchText: '',
  status: '',
  sortOrder: 'NEWEST',
  assigneeId: '',
};

function buildReportSummary(report) {
  const summary = [];

  if (report.searchText) {
    summary.push(`Search: ${report.searchText}`);
  }

  if (report.status) {
    summary.push(`Status: ${humanizeEnum(report.status)}`);
  }

  if (report.assignee?.fullName) {
    summary.push(`Assignee: ${report.assignee.fullName}`);
  } else if (report.assigneeId) {
    summary.push(`Assignee ID: ${report.assigneeId}`);
  }

  summary.push(`Sort: ${humanizeEnum(report.sortOrder || 'NEWEST')}`);
  return summary.join(' | ');
}

function ReportsSection({ projectId, reports, loading, error, filters, onFiltersChange, projectRole, onCreateReport }) {
  const canManageReports = canManageProjectTasks(projectRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const { values, updateField, resetForm } = useFormFields(initialReportState);

  async function loadAssigneeOptions(search) {
    const response = await ticketService.searchTicketAssignees(projectId, search);
    return (response || []).map(toAssigneeOption).filter(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.name.trim()) {
      setSubmitError('Report name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      await onCreateReport({
        name: values.name.trim(),
        description: values.description.trim() || null,
        searchText: values.searchText.trim() || null,
        status: values.status || null,
        assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
        sortOrder: values.sortOrder,
      });
      resetForm(initialReportState);
      setSelectedAssignee(null);
      setIsModalOpen(false);
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
          <h2>Reports</h2>
          <p>Save ticket queries your team can revisit without rebuilding the same filters every time.</p>
        </div>
        {canManageReports ? (
          <Button
            onClick={() => {
              resetForm(initialReportState);
              setSelectedAssignee(null);
              setSubmitError('');
              setIsModalOpen(true);
            }}
            variant="secondary"
          >
            Create Report
          </Button>
        ) : (
          <span className="pill-note">View-only access</span>
        )}
      </div>

      <div className={styles.filters}>
        <InputField
          label="Search reports"
          name="reportSearch"
          onChange={(event) => onFiltersChange('search', event.target.value)}
          placeholder="Search by report name or description"
          value={filters.search}
        />
        <SelectField
          label="Sort"
          name="reportSort"
          onChange={(event) => onFiltersChange('sort', event.target.value)}
          options={SORT_ORDER_OPTIONS.map((sort) => ({
            label: humanizeEnum(sort),
            value: sort,
          }))}
          value={filters.sort}
        />
      </div>

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      {loading ? (
        <div className="inline-message">Loading reports...</div>
      ) : reports.length === 0 ? (
        <EmptyState
          actionLabel={canManageReports ? 'Create first report' : undefined}
          description="Saved report definitions will appear here once your team creates them."
          onAction={canManageReports ? () => setIsModalOpen(true) : undefined}
          title="No reports match these filters"
        />
      ) : (
        <div className={styles.grid}>
          {reports.map((report) => (
            <article className="card card--padded" key={report.id}>
              <div className="split-row">
                <div className="stack--sm">
                  <strong>{report.name}</strong>
                  <span className="muted">{buildReportSummary(report)}</span>
                </div>
                {report.status ? <StatusBadge value={report.status} /> : null}
              </div>

              <p className="muted">{report.description || 'No description added for this report yet.'}</p>

              <div className="split-row">
                <div className="stack--sm">
                  <span className="muted">Created {formatDateTime(report.createdAt)}</span>
                  {report.assignee ? (
                    <span className="muted">
                      Assignee{' '}
                      <UserProfileTrigger user={report.assignee}>{report.assignee.fullName}</UserProfileTrigger>
                    </span>
                  ) : null}
                </div>
                <Link className="text-link" to={`/reports/${report.id}`}>
                  Open report
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        description="Reports store ticket search criteria, sort order, and optional teammate ownership."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Report"
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <InputField
            label="Name"
            name="name"
            onChange={updateField}
            placeholder="Open regressions needing triage"
            required
            value={values.name}
          />
          <SelectField
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
            label="Description"
            name="description"
            onChange={updateField}
            placeholder="Explain when the team should use this report."
            rows={4}
            value={values.description}
          />
          <InputField
            hint="Leave blank to include all tickets in the saved report."
            label="Ticket search"
            name="searchText"
            onChange={updateField}
            placeholder="Optional default search query"
            value={values.searchText}
          />
          <SelectField
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
            emptyMessage="No matching teammates found."
            label="Assignee"
            loadErrorMessage="Unable to load teammates right now."
            loadOptions={loadAssigneeOptions}
            onSelect={(option) => {
              setSelectedAssignee(option);
              updateField('assigneeId', option?.value || '');
            }}
            placeholder="Optional teammate filter"
            value={selectedAssignee}
          />

          <div className="form-actions">
            <Button loading={submitting} type="submit">
              Create Report
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

export default ReportsSection;
