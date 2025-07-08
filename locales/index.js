import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import es from './es.json';

// Detectar el idioma del dispositivo
const deviceLanguage = Localization.locale?.split('-')[0] || 'es';

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage, // Idioma por defecto basado en el dispositivo
  fallbackLng: 'es', // Idioma de respaldo
  interpolation: {
    escapeValue: false, // React ya escapa por defecto
  },
  // Configuración para desarrollo
  debug: __DEV__,
});

export default i18n;
