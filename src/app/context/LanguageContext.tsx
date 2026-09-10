'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, LanguageOption, SUPPORTED_LANGUAGES } from '../i18n/config';
import { vi } from '../i18n/locales/vi';
import { en } from '../i18n/locales/en';

type Dictionary = Record<string, any>;

const dictionaries: Record<string, Dictionary> = {
  vi,
  en,
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (path: string, params?: Record<string, string>) => string;
  supportedLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to extract nested key string (e.g. 'hero.badges.safe')
function getNestedValue(obj: Dictionary, path: string): string | undefined {
  const res = path.split('.').reduce((prev: any, curr: string) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
  return typeof res === 'string' ? res : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('magictales-lang');
    if (savedLang && SUPPORTED_LANGUAGES.some((item) => item.code === savedLang)) {
      setLanguageState(savedLang);
    } else {
      setLanguageState(DEFAULT_LANGUAGE);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (SUPPORTED_LANGUAGES.some((item) => item.code === lang)) {
      setLanguageState(lang);
      localStorage.setItem('magictales-lang', lang);
    }
  };

  const t = (path: string, params?: Record<string, string>): string => {
    const currentDict = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
    let val = getNestedValue(currentDict, path);

    // Fallback to default language if missing in selected language
    if (val === undefined && language !== DEFAULT_LANGUAGE) {
      val = getNestedValue(dictionaries[DEFAULT_LANGUAGE], path);
    }

    if (val === undefined) {
      return path; // Fallback to path key itself if missing completely
    }

    let result = String(val);
    if (params) {
      Object.keys(params).forEach((key) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
      });
    }

    return result;
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((item) => item.code === (mounted ? language : DEFAULT_LANGUAGE)) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language: mounted ? language : DEFAULT_LANGUAGE,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
