import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';
import { LanguageCode } from '../types';
import { translations, TranslationDictionary } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = 'nexushr_user_language_pref';

interface I18nContextType {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode, updateCompanyDefault?: boolean) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenant, updateBranding } = useTenant();

  const [currentLang, setCurrentLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (saved && translations[saved]) return saved;
    return activeTenant?.branding?.language || 'es';
  });

  useEffect(() => {
    if (!localStorage.getItem(LANGUAGE_STORAGE_KEY) && activeTenant?.branding?.language) {
      setCurrentLangState(activeTenant.branding.language);
    }
  }, [activeTenant?.branding?.language]);

  const setLanguage = (lang: LanguageCode, updateCompanyDefault: boolean = false) => {
    setCurrentLangState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (updateCompanyDefault && updateBranding) {
      updateBranding({ language: lang });
    }
  };

  const t: TranslationDictionary = translations[currentLang] || translations.es;

  return (
    <I18nContext.Provider value={{ currentLang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    const saved = (localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode) || 'es';
    return {
      currentLang: saved,
      setLanguage: () => {},
      t: translations[saved] || translations.es,
    };
  }
  return context;
};
