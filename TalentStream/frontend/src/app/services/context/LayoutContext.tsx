import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setIsSidebarCollapsed: (val: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const value = useMemo(() => ({
    isSidebarCollapsed,
    toggleSidebar,
    setIsSidebarCollapsed
  }), [isSidebarCollapsed]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
