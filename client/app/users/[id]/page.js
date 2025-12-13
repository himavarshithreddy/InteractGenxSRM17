'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usersAPI, userPreferencesAPI, userActivityAPI } from '../../../lib/api';
import Layout from '../../../components/Layout';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityStats, setActivityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, prefsRes] = await Promise.all([
        usersAPI.getUser(userId),
        userPreferencesAPI.getPreferences(userId),
      ]);
      setUser(userRes.data);
      setPreferences(prefsRes.data);

      if (activeTab === 'activity') {
        const [activityRes, statsRes] = await Promise.all([
          userActivityAPI.getActivity(userId, { limit: 50 }),
          userActivityAPI.getActivityStats(userId, { days: 30 }),
        ]);
        setActivity(activityRes.data);
        setActivityStats(statsRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const getDomainFromRole = (role) => {
    const roleDomainMap = {
      'operations': 'operations',
      'marketing': 'marketing',
      'inventory': 'inventory',
      'logistics': 'logistics',
      'admin': 'all',
      'manager': 'all',
      'viewer': 'all',
      'support': 'all',
      'analyst': 'all',
      'coordinator': 'all',
      'supervisor': 'all',
    };
    return roleDomainMap[role] || 'all';
  };

  const getDomainBadge = (domain) => {
    const badges = {
      'all': { label: 'All Domains', color: '#6366f1' },
      'operations': { label: 'Operations', color: '#667eea' },
      'marketing': { label: 'Marketing', color: '#f093fb' },
      'inventory': { label: 'Inventory', color: '#4facfe' },
      'logistics': { label: 'Logistics', color: '#43e97b' },
    };
    return badges[domain] || badges['all'];
  };

  const getActionBadge = (actionType) => {
    const badges = {
      'login': 'badge-success',
      'logout': 'badge-secondary',
      'view': 'badge-info',
      'create': 'badge-success',
      'edit': 'badge-warning',
      'update': 'badge-warning',
      'delete': 'badge-danger',
      'export': 'badge-info',
      'search': 'badge-info',
    };
    return badges[actionType] || 'badge-secondary';
  };

  if (loading) {
    return (
      <Layout title="User Details">
        <div className="loading">Loading user details...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="User Details">
        <div className="error">User not found</div>
      </Layout>
    );
  }

  const domain = getDomainFromRole(user.role);
  const domainInfo = getDomainBadge(domain);

  return (
    <Layout title={`User: ${user.full_name}`}>
      <div className="fade-in">
        <div className="tabs" style={{ marginBottom: '2rem' }}>
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity History
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Information</h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Full Name</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>{user.full_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Email</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>{user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Username</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>{user.username}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Role</div>
                  <span className="badge badge-info">{user.role}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Domain Access</div>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: `${domainInfo.color}15`,
                    color: domainInfo.color,
                    fontWeight: '600',
                    border: `1px solid ${domainInfo.color}40`
                  }}>
                    {domainInfo.label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Status</div>
                  <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                    {user.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Last Login</div>
                  <div style={{ fontSize: '1rem', color: 'var(--gray-700)' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Created</div>
                  <div style={{ fontSize: '1rem', color: 'var(--gray-700)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && preferences && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Preferences</h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Theme</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.theme}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Language</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.language}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Timezone</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.timezone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Date Format</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.date_format}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Time Format</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.time_format}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Notifications</div>
                  <span className={`badge ${preferences.notifications_enabled ? 'badge-success' : 'badge-secondary'}`}>
                    {preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Email Notifications</div>
                  <span className={`badge ${preferences.email_notifications ? 'badge-success' : 'badge-secondary'}`}>
                    {preferences.email_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Dashboard Layout</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.dashboard_layout}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Items Per Page</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.items_per_page}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Default View</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>{preferences.default_view}</div>
                </div>
                {preferences.favorite_modules && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Favorite Modules</div>
                    <div style={{ fontSize: '1rem', color: 'var(--gray-700)' }}>
                      {Array.isArray(JSON.parse(preferences.favorite_modules)) 
                        ? JSON.parse(preferences.favorite_modules).join(', ')
                        : preferences.favorite_modules}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <>
            {activityStats && (
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                  <h3>Total Activities</h3>
                  <div className="value">{activityStats.total}</div>
                  <div className="change">Last {activityStats.period_days} days</div>
                </div>
                {activityStats.by_action_type && activityStats.by_action_type.length > 0 && (
                  <div className="stat-card">
                    <h3>Most Common Action</h3>
                    <div className="value">{activityStats.by_action_type[0].action_type}</div>
                    <div className="change">{activityStats.by_action_type[0].count} times</div>
                  </div>
                )}
                {activityStats.by_module && activityStats.by_module.length > 0 && (
                  <div className="stat-card">
                    <h3>Most Used Module</h3>
                    <div className="value">{activityStats.by_module[0].module}</div>
                    <div className="change">{activityStats.by_module[0].count} times</div>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Recent Activity</h2>
              </div>
              {loading ? (
                <div className="loading">Loading activity...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Description</th>
                        <th>Module</th>
                        <th>Entity</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.created_at).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${getActionBadge(item.action_type)}`}>
                              {item.action_type}
                            </span>
                          </td>
                          <td>{item.action_description}</td>
                          <td>{item.module || 'N/A'}</td>
                          <td>
                            {item.entity_type && item.entity_id
                              ? `${item.entity_type} #${item.entity_id}`
                              : 'N/A'}
                          </td>
                          <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {item.ip_address || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}






