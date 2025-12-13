'use client';

import { useState, useEffect } from 'react';
import { usersAPI } from '../lib/api';
import { useUser } from './UserProvider';

export default function UserSwitcher() {
  const { currentUser, switchUser } = useUser();
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers({ limit: 50 });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    switchUser({
      ...user,
      domain: getDomainFromRole(user.role) || 'all'
    });
    setIsOpen(false);
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
      'all': { label: 'All Domains', color: 'var(--primary)' },
      'operations': { label: 'Operations', color: '#667eea' },
      'marketing': { label: 'Marketing', color: '#f093fb' },
      'inventory': { label: 'Inventory', color: '#4facfe' },
      'logistics': { label: 'Logistics', color: '#43e97b' },
    };
    return badges[domain] || badges['all'];
  };

  if (!currentUser) return null;

  const domainInfo = getDomainBadge(currentUser.domain || 'all');

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius)',
          color: 'white',
          cursor: 'pointer',
          transition: 'var(--transition)',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${domainInfo.color}, ${domainInfo.color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '0.875rem'
        }}>
          {currentUser.full_name.charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
            {currentUser.full_name}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {currentUser.role} • {domainInfo.label}
          </div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--gray-200)',
              background: 'var(--gray-50)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Switch User
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                Currently: <strong>{currentUser.full_name}</strong>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                Loading users...
              </div>
            ) : (
              <div style={{ padding: '0.5rem' }}>
                {users.map((user) => {
                  const userDomain = getDomainFromRole(user.role) || 'all';
                  const userDomainInfo = getDomainBadge(userDomain);
                  const isActive = currentUser.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: isActive ? 'var(--gray-50)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition)',
                        borderLeft: isActive ? `3px solid ${userDomainInfo.color}` : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--gray-50)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${userDomainInfo.color}, ${userDomainInfo.color}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                          {user.full_name}
                          {isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)' }}>✓</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                          {user.email}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--gray-100)',
                            color: 'var(--gray-700)',
                            fontWeight: '600'
                          }}>
                            {user.role}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: `${userDomainInfo.color}20`,
                            color: userDomainInfo.color,
                            fontWeight: '600'
                          }}>
                            {userDomainInfo.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

