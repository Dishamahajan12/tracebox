import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/adminService';
import { projectService } from '../services/projectService';
import { formatDateTime } from '../utils/formatters';
import { hasAdminAccess } from '../utils/permissions';

function DashboardPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [adminSnapshot, setAdminSnapshot] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [projectData, adminData] = await Promise.all([
          projectService.getProjects(),
          hasAdminAccess(currentUser) ? adminService.getDashboard().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) {
          return;
        }

        setProjects(projectData || []);
        setAdminSnapshot(adminData);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (currentUser) {
      loadDashboard();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading dashboard" />
      </div>
    );
  }

  const activeProjects = projects.filter((project) => !project.archived).length;
  const archivedProjects = projects.filter((project) => project.archived).length;
  const adminProjects = projects.filter((project) =>
    ['PROJECT_ADMIN', 'PROJECT_OWNER'].includes(project.currentUserRole),
  ).length;

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <Button to="/projects" variant="ghost">
              View Projects
            </Button>
            <Button to="/profile">Profile</Button>
          </>
        }
        description="See the projects you can access, the level of ownership you hold, and the wider workspace pulse."
        eyebrow="Workspace Overview"
        title={`Welcome back, ${currentUser?.fullName?.split(' ')[0] || 'teammate'}`}
      />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard detail="Projects visible to you" label="Total Projects" value={projects.length} />
        <StatCard accent="highlight" detail="Currently open and active" label="Active Projects" value={activeProjects} />
        <StatCard detail="Archived or paused work" label="Archived Projects" value={archivedProjects} />
        <StatCard detail="Projects you can administrate" label="Admin Scope" value={adminProjects} />
      </section>

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Recent Project Spaces</h2>
              <p>Jump into the most recently created projects from your accessible workspace.</p>
            </div>
          </div>

          {!projects.length ? (
            <EmptyState
              actionLabel="Create your first project"
              actionTo="/projects"
              description="Once you create or join a project, it will appear here for quick access."
              title="No projects yet"
            />
          ) : (
            <div className="stack">
              {projects.slice(0, 4).map((project) => (
                <Link className="card card--padded" key={project.id} to={`/projects/${project.id}`}>
                  <div className="split-row">
                    <div className="stack--sm">
                      <strong>{project.name}</strong>
                      <span className="muted">
                        {project.projectKey} • Created {formatDateTime(project.createdAt)}
                      </span>
                    </div>
                    <div className="badge-row">
                      <StatusBadge value={project.currentUserRole} />
                      {project.archived ? <StatusBadge value="ARCHIVED">Archived</StatusBadge> : null}
                    </div>
                  </div>
                  <p className="muted">{project.description || 'No description added yet.'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card card--padded card--highlight">
            <div className="section-header">
              <div>
                <h2>Account Snapshot</h2>
                <p>Use your role to understand which navigation and management tools should appear for you.</p>
              </div>
            </div>
            <div className="stack">
              <div className="split-row">
                <span>Global role</span>
                <StatusBadge value={currentUser?.role} />
              </div>
              <div className="split-row">
                <span>Email</span>
                <strong>{currentUser?.email}</strong>
              </div>
              <div className="split-row">
                <span>Admin pages</span>
                <strong>{hasAdminAccess(currentUser) ? 'Visible' : 'Hidden'}</strong>
              </div>
            </div>
          </div>

          {adminSnapshot ? (
            <div className="card card--padded">
              <div className="section-header">
                <div>
                  <h2>Admin Pulse</h2>
                  <p>High-level workspace health for admins and super admins.</p>
                </div>
              </div>
              <div className="stack">
                <div className="split-row">
                  <span>Total users</span>
                  <strong>{adminSnapshot.totalUsers}</strong>
                </div>
                <div className="split-row">
                  <span>Active users</span>
                  <strong>{adminSnapshot.activeUsers}</strong>
                </div>
                <div className="split-row">
                  <span>Total tasks</span>
                  <strong>{adminSnapshot.totalTasks}</strong>
                </div>
                <Button to="/admin" variant="ghost">
                  Open Admin Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="card card--padded">
              <div className="section-header">
                <div>
                  <h2>How roles work</h2>
                  <p>Project roles shape day-to-day editing permissions inside each project.</p>
                </div>
              </div>
              <div className="stack">
                <span className="pill-note">Owner: full project control</span>
                <span className="pill-note">Project Admin: member and project settings access</span>
                <span className="pill-note">Member: task creation and editing</span>
                <span className="pill-note">Viewer: read-only project access</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
