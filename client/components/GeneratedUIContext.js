'use client';

import { createContext, useContext, useState } from 'react';

const GeneratedUIContext = createContext();

export function GeneratedUIProvider({ children }) {
  const [generatedComponents, setGeneratedComponents] = useState([]);
  const [activeComponent, setActiveComponent] = useState(null);

  const addGeneratedComponent = (componentData) => {
    const newComponent = {
      id: Date.now(),
      title: componentData.title || 'Generated UI',
      code: componentData.code,
      description: componentData.description,
      timestamp: new Date().toISOString(),
    };
    setGeneratedComponents(prev => [newComponent, ...prev]);
    setActiveComponent(newComponent.id);
    return newComponent.id;
  };

  const removeGeneratedComponent = (id) => {
    setGeneratedComponents(prev => prev.filter(c => c.id !== id));
    if (activeComponent === id) {
      setActiveComponent(null);
    }
  };

  const clearAll = () => {
    setGeneratedComponents([]);
    setActiveComponent(null);
  };

  return (
    <GeneratedUIContext.Provider
      value={{
        generatedComponents,
        activeComponent,
        addGeneratedComponent,
        removeGeneratedComponent,
        clearAll,
        setActiveComponent,
      }}
    >
      {children}
    </GeneratedUIContext.Provider>
  );
}

export function useGeneratedUI() {
  const context = useContext(GeneratedUIContext);
  if (!context) {
    throw new Error('useGeneratedUI must be used within GeneratedUIProvider');
  }
  return context;
}



