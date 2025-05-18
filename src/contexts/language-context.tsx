
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from '@/lib/translations';
import { translations } from '@/lib/translations';
import type { Translations } from '@/lib/translations';

interface LanguageContextType {
  language: Locale;
  setLanguage: (language: Locale) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Locale>('ar'); // Default to Arabic for SSR and initial client render
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs once on the client after hydration
    setIsMounted(true);
    const storedLanguage = localStorage.getItem('appLanguage') as Locale | null;
    const initialLang = storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ar') ? storedLanguage : 'ar';
    
    setLanguageState(initialLang); // Update state based on localStorage

    // Directly update documentElement attributes for the initial client render based on localStorage or default.
    // This ensures consistency if the stored language is different from the SSR'd 'ar'.
    // RootLayout will SSR with 'ar'. This useEffect corrects it client-side.
    // Note: This direct manipulation is fine here as it runs after initial React rendering for this component.
    if (typeof window !== 'undefined') {
        document.documentElement.lang = initialLang;
        document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []); // Runs once on mount

  const setLanguage = (newLang: Locale) => {
    setLanguageState(newLang); // Update React state
    if (typeof window !== 'undefined') { // Ensure localStorage is only accessed on client
        localStorage.setItem('appLanguage', newLang);
        // The effect below will sync documentElement if language changes *after* initial mount
    }
  };

  useEffect(() => {
    // This effect syncs documentElement attributes whenever 'language' state changes *after* the initial mount setup.
    // It relies on 'isMounted' to avoid running during SSR or before the initial setup is complete.
    if (isMounted && typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language, isMounted]); // Re-run when language or isMounted changes

  const t = (key: keyof Translations): string => {
    // During SSR (isMounted false), 'language' state is the default ('ar').
    // After mount, 'language' state might be updated from localStorage.
    return translations[language]?.[key] || translations['en'][key]; // Fallback to English
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
