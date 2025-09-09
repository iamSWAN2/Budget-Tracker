import React, { createContext, useContext, useMemo, useState } from 'react';

type Density = 'comfortable' | 'compact';

type UISettingsValue = {
  density: Density;
  toggleDensity: () => void;
};

const UISettingsContext = createContext<UISettingsValue | undefined>(undefined);

export const UISettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensity] = useState<Density>('comfortable');
  const toggleDensity = () => setDensity(prev => (prev === 'comfortable' ? 'compact' : 'comfortable'));
  const value = useMemo(() => ({ density, toggleDensity }), [density]);
  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
};

export const useUISettings = () => {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error('useUISettings must be used within UISettingsProvider');
  return ctx;
};

