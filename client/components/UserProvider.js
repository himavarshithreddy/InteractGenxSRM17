'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

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

  useEffect(() => {
    // Load user from localStorage or set default
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Ensure domain is set based on role
      if (!user.domain) {
        user.domain = getDomainFromRole(user.role);
      }
      setCurrentUser(user);
    } else {
      // Set default user
      const defaultUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        domain: 'all',
        status: 'active'
      };
      setCurrentUser(defaultUser);
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    }
  }, []);

  const switchUser = (user) => {
    // Ensure domain is set based on role
    const userWithDomain = {
      ...user,
      domain: user.domain || getDomainFromRole(user.role)
    };
    setCurrentUser(userWithDomain);
    localStorage.setItem('currentUser', JSON.stringify(userWithDomain));
  };

  return (
    <UserContext.Provider value={{ currentUser, switchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

