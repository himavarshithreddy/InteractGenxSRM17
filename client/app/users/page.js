'use client';

import { useEffect, useState } from 'react';
import { usersAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import EditModal from '../../components/EditModal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/19020504-2634-4238-b0d5-ae8e8b540309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/app/users/page.js:18',message:'Fetching users from API',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const response = await usersAPI.getUsers({ limit: 50 });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/19020504-2634-4238-b0d5-ae8e8b540309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/app/users/page.js:21',message:'Users API response received',data:{status:response.status,dataLength:response.data?.length,isArray:Array.isArray(response.data),firstUser:response.data?.[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setUsers(response.data);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/19020504-2634-4238-b0d5-ae8e8b540309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/app/users/page.js:24',message:'Users state updated',data:{userCount:response.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setLoading(false);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/19020504-2634-4238-b0d5-ae8e8b540309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/app/users/page.js:27',message:'Error fetching users',data:{error:err.message,stack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditModal({ isOpen: true, data: user });
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      await usersAPI.updateUser(editModal.data.id, formData);
      setEditModal({ isOpen: false, data: null });
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
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

  const userFields = [
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'select', required: true, options: [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'operations', label: 'Operations' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'logistics', label: 'Logistics' },
      { value: 'support', label: 'Support' },
      { value: 'analyst', label: 'Analyst' },
      { value: 'viewer', label: 'Viewer' },
    ]},
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'suspended', label: 'Suspended' },
    ]},
  ];

  return (
    <Layout title="User Management">
      <div className="fade-in">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Users</h2>
          </div>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Domain Access</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.full_name}</td>
                      <td>
                        <span className="badge badge-info">
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const domain = getDomainFromRole(user.role);
                          const domainInfo = getDomainBadge(domain);
                          return (
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
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>
                          <a
                            href={`/users/${user.id}`}
                            className="btn btn-sm"
                            style={{
                              background: 'var(--gray-100)',
                              color: 'var(--gray-700)',
                              textDecoration: 'none'
                            }}
                          >
                            View Details
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title="Edit User"
          fields={userFields}
          data={editModal.data}
          onSave={handleSave}
          loading={saving}
        />
      </div>
    </Layout>
  );
}

