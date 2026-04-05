import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import InputField from '../components/ui/InputField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import TextAreaField from '../components/ui/TextAreaField';
import { useFormFields } from '../hooks/useFormFields';
import { useToast } from '../hooks/useToast';
import { projectService } from '../services/projectService';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime, sanitizeProjectKey } from '../utils/formatters';

const initialProjectState = {
  name: '',
  projectKey: '',
  description: '',
};

function ProjectsPage() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { values, updateField, resetForm } = useFormFields(initialProjectState);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError('');
        const response = await projectService.getProjects();

        if (isMounted) {
          setProjects(response || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load projects.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (!search.trim()) {
      return true;
    }

    const query = search.trim().toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.projectKey.toLowerCase().includes(query) ||
      (project.description || '').toLowerCase().includes(query)
    );
  });

  async function handleCreateProject(event) {
    event.preventDefault();

    if (!values.name.trim() || !values.projectKey.trim()) {
      setSubmitError('Project name and key are required.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const createdProject = await projectService.createProject({
        name: values.name.trim(),
        projectKey: sanitizeProjectKey(values.projectKey),
        description: values.description.trim(),
      });
      setProjects((currentProjects) => [createdProject, ...currentProjects]);
      setIsModalOpen(false);
      resetForm(initialProjectState);
      showSuccess('Project created', 'Your new project is ready for tickets, reports, and members.');
      navigate(`/projects/${createdProject.id}`);
    } catch (submitLoadError) {
      setSubmitError(getApiErrorMessage(submitLoadError, 'Unable to create project.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading your projects" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <Button
            onClick={() => {
              setSubmitError('');
              resetForm(initialProjectState);
              setIsModalOpen(true);
            }}
          >
            Create Project
          </Button>
        }
        description="Browse all accessible project spaces, search by key, and create a new workspace in a single step."
        eyebrow="Projects"
        title="My Projects"
      />

      <div className="card card--padded">
        <InputField
          label="Search projects"
          name="projectSearch"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, key, or description"
          value={search}
        />
      </div>

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      {!filteredProjects.length ? (
        <EmptyState
          actionLabel="Create Project"
          description="Project cards will appear here after they are created or shared with your account."
          onAction={() => setIsModalOpen(true)}
          title="No matching projects found"
        />
      ) : (
        <section className="card-grid">
          {filteredProjects.map((project) => (
            <Link className="card card--padded" key={project.id} to={`/projects/${project.id}`}>
              <div className="split-row">
                <div className="stack--sm">
                  <strong>{project.name}</strong>
                  <span className="muted">{project.projectKey}</span>
                </div>
                <div className="badge-row">
                  <StatusBadge value={project.currentUserRole} />
                  {project.archived ? <StatusBadge value="ARCHIVED">Archived</StatusBadge> : null}
                </div>
              </div>
              <p className="muted">{project.description || 'No description added for this project yet.'}</p>
              <div className="split-row">
                <span className="muted">Created {formatDateTime(project.createdAt)}</span>
                <span className="text-link">Open project</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <Modal
        description="Spin up a new project workspace with a clear key and team-friendly description."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create a Project"
      >
        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className="form-grid form-grid--single" onSubmit={handleCreateProject}>
          <InputField
            label="Project name"
            name="name"
            onChange={updateField}
            placeholder="TraceBox Platform Revamp"
            required
            value={values.name}
          />
          <InputField
            hint="Uppercase letters and numbers work best. We auto-sanitize it."
            label="Project key"
            name="projectKey"
            onChange={(event) => updateField('projectKey', sanitizeProjectKey(event.target.value))}
            placeholder="TBX"
            required
            value={values.projectKey}
          />
          <TextAreaField
            label="Description"
            name="description"
            onChange={updateField}
            placeholder="Summarize the mission, scope, or delivery goals for this project."
            rows={5}
            value={values.description}
          />
          <div className="form-actions">
            <Button loading={submitting} type="submit">
              Create Project
            </Button>
            <Button onClick={() => setIsModalOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProjectsPage;
