import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS, TranslationKey } from './translations';

export interface UserProfile {
  id: string;
  fullName: string;
  dni: string;
  email: string;
  role: 'admin' | 'cashier' | 'pharmacist';
  preferredLanguage: Language;
  lastLogin: string;
  department: string;
  avatarUrl?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-admin-001',
  fullName: 'Dr. Carlos Mendoza Vidal',
  dni: '44892103',
  email: 'administrador@novasalud.com',
  role: 'admin',
  preferredLanguage: 'es',
  lastLogin: 'Hoy, 08:30 AM (IP 192.168.1.120)',
  department: 'Dirección General & Auditoría Farmacéutica'
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  userProfile: UserProfile;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (isOpen: boolean) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY_PROFILE = 'novasalud_user_profile';
const STORAGE_KEY_LANG = 'novasalud_preferred_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial profile & language from localStorage if available
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_KEY_LANG) as Language;
      if (storedLang === 'es' || storedLang === 'en') {
        return storedLang;
      }
      if (userProfile.preferredLanguage) {
        return userProfile.preferredLanguage;
      }
    } catch {
      // fallback
    }
    return 'es';
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Sync language with userProfile and localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
      const updatedProfile = { ...userProfile, preferredLanguage: lang };
      setUserProfile(updatedProfile);
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));
    } catch {
      // ignore
    }
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    if (data.preferredLanguage && data.preferredLanguage !== language) {
      setLanguageState(data.preferredLanguage);
      localStorage.setItem(STORAGE_KEY_LANG, data.preferredLanguage);
    }
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.es;
    return dict[key] || TRANSLATIONS.es[key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        userProfile,
        updateUserProfile,
        isProfileModalOpen,
        setIsProfileModalOpen
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
};
