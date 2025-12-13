'use client';

import { useGeneratedUI } from '../../components/GeneratedUIContext';
import Layout from '../../components/Layout';
import DynamicComponentRenderer from '../../components/DynamicComponentRenderer';

export default function GeneratedUIPage() {
  const { generatedComponents, activeComponent, setActiveComponent, removeGeneratedComponent, clearAll } = useGeneratedUI();
  const activeComp = generatedComponents.find(c => c.id === activeComponent);

  if (generatedComponents.length === 0) {
    return (
      <Layout title="Generated UI">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
            No Generated Components Yet
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
            Use the AI Assistant in the sidebar to generate UI components.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={activeComp?.title || 'Generated UI'}>
      <div className="fade-in">
        {/* Component Tabs */}
        {generatedComponents.length > 1 && (
          <div className="tabs" style={{ marginBottom: '2rem' }}>
            {generatedComponents.map((comp) => (
              <button
                key={comp.id}
                className={`tab ${activeComponent === comp.id ? 'active' : ''}`}
                onClick={() => setActiveComponent(comp.id)}
              >
                {comp.title}
              </button>
            ))}
            <button
              className="tab"
              onClick={clearAll}
              style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white' }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Active Component */}
        {activeComp && (
          <div>
            {activeComp.description && (
              <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--info)15', border: '1px solid var(--info)40' }}>
                <p style={{ margin: 0, color: 'var(--gray-700)' }}>{activeComp.description}</p>
              </div>
            )}
            <div className="card">
              <DynamicComponentRenderer code={activeComp.code} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}



