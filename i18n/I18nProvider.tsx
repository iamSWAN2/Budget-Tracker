import React, { createContext, useContext, useMemo, useState } from 'react';
import { translations, Lang } from './translations';

type I18nContextValue = {
  lang: Lang;
  t: (key: string) => string;
  toggle: () => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('ko');

  const t = (key: string) => translations[lang][key] ?? translations['en'][key] ?? key;
  const toggle = () => setLang(prev => (prev === 'ko' ? 'en' : 'ko'));

  const value = useMemo(() => ({ lang, t, toggle }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

