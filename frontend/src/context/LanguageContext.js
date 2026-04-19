import React, { createContext, useState, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../constants/translations';

const LanguageContext = createContext();

const LANG_KEY = 'app_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  // Load saved language on mount
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.error('Failed to load language:', e);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        await AsyncStorage.setItem(LANG_KEY, lang);
      } catch (e) {
        console.error('Failed to save language:', e);
      }
    }
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const template = translations[language]?.[key] || translations.en?.[key] || key;
      return Object.entries(params).reduce(
        (result, [paramKey, value]) => result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value)),
        template
      );
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
