import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { adminService } from '../../services/adminService';
import { getApiErrorMessage } from '../../utils/errors';

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getDashboard();

        if (isMounted) {
          setDashboard(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load the admin dashboard.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading admin dashboard" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <Button to="/admin/users" variant="secondary">
            Manage Users
          </Button>
        }
        description="Workspace-level visibility for admins and super admins, with a fast path into user management."
        eyebrow="Admin"
        title="Admin Dashboard"
      />

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      {dashboard ? (
        <>
          <section className="stats-grid">
            <StatCard detail="Registered accounts in the workspace" label="Total Users" value={dashboard.totalUsers} />
            <StatCard accent="highlight" detail="Accounts currently marked active" label="Active Users" value={dashboard.activeUsers} />
            <StatCard detail="Project spaces across the instance" label="Total Projects" value={dashboard.totalProjects} />
            <StatCard detail="Tickets currently stored" label="Total Tickets" value={dashboard.totalTasks} />
          </section>

          <section className="detail-grid">
            <div className="card card--padded">
              <div className="section-header">
                <div>
                  <h2>Workspace Health</h2>
                  <p>Use these totals to spot activity gaps, onboarding spikes, or delivery growth at a glance.</p>
                </div>
              </div>
              <div className="stack">
                <div className="split-row">
                  <span>Comments recorded</span>
                  <strong>{dashboard.totalComments}</strong>
                </div>
                <div className="split-row">
                  <span>Average tickets per project</span>
                  <strong>
                    {dashboard.totalProjects ? Math.round(dashboard.totalTasks / dashboard.totalProjects) : 0}
                  </strong>
                </div>
                <div className="split-row">
                  <span>Active user ratio</span>
                  <strong>
                    {dashboard.totalUsers ? Math.round((dashboard.activeUsers / dashboard.totalUsers) * 100) : 0}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="card card--padded card--highlight">
              <div className="section-header">
                <div>
                  <h2>Next Admin Move</h2>
                  <p>Keep user roles, activation state, and access expectations clean as the workspace scales.</p>
                </div>
              </div>
              <Button to="/admin/users" variant="secondary">
                Open User Management
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default AdminDashboardPage;
