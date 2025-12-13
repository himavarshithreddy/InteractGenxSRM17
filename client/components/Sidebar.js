'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from './UserProvider';
import UserSwitcher from './UserSwitcher';
import ChatBot from './ChatBot';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useUser();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊', domain: null },
    { href: '/operations', label: 'Operations', icon: '📦', domain: 'operations' },
    { href: '/marketing', label: 'Marketing', icon: '📢', domain: 'marketing' },
    { href: '/inventory', label: 'Inventory', icon: '📋', domain: 'inventory' },
    { href: '/logistics', label: 'Logistics', icon: '🚚', domain: 'logistics' },
    { href: '/users', label: 'Users', icon: '👥', domain: null },
  ];

  // Filter nav items based on user domain access
  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    // Admin and users with 'all' domain can see everything
    if (currentUser.domain === 'all' || currentUser.role === 'admin') {
      return true;
    }
    // Users can only see their domain
    if (item.domain === null) return true; // Dashboard and Users are always visible
    return item.domain === currentUser.domain;
  });

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

  const domainInfo = currentUser ? getDomainBadge(currentUser.domain || 'all') : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Admin Panel</h1>
        {currentUser && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Logged in as
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '0.25rem'
            }}>
              {currentUser.full_name}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              {currentUser.email}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: '600'
              }}>
                {currentUser.role}
              </span>
              {domainInfo && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: `${domainInfo.color}40`,
                  color: 'white',
                  fontWeight: '600',
                  border: `1px solid ${domainInfo.color}80`
                }}>
                  {domainInfo.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <nav>
        <ul className="sidebar-nav">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href} className="sidebar-nav-item">
                <Link
                  href={item.href}
                  className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {currentUser && (
        <>
        <div style={{
          marginTop: 'auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <UserSwitcher />
        </div>
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <ChatBot />
          </div>
        </>
      )}
    </aside>
  );
}

