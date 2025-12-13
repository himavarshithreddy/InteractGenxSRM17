'use client';

import Sidebar from './Sidebar';

export default function Layout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, width: '100%' }}>
        <div className="top-bar">
          <div className="container">
            <h1>{title || 'Dashboard'}</h1>
          </div>
        </div>
        <div style={{ padding: '2rem 0' }}>
          <div className="container">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


