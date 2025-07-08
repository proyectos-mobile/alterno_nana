import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(true);

  const loadLanguagePreference = useCallback(async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      } else {
        // Usar idioma del sistema como predeterminado
        const deviceLanguage = Localization.locale?.split('-')[0] || 'es';
        const supportedLanguage = ['es', 'en'].includes(deviceLanguage)
          ? deviceLanguage
          : 'es';
        setCurrentLanguage(supportedLanguage);
        await i18n.changeLanguage(supportedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
      setCurrentLanguage('es');
      await i18n.changeLanguage('es');
    } finally {
      setIsLoading(false);
    }
  }, [i18n]);

  useEffect(() => {
    loadLanguagePreference();
  }, [loadLanguagePreference]);

  const changeLanguage = async (language) => {
    try {
      await AsyncStorage.setItem('language', language);
      setCurrentLanguage(language);
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const availableLanguages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
  ];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        availableLanguages,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
