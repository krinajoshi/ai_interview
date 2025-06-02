import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import arTranslation from './locales/ar.json';

// the translations
const resources = {
  en: {
    translation: enTranslation
  },
  fr: {
    translation: frTranslation
  },
  ar: {
    translation: arTranslation
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language
    keySeparator: '.', // to support nested translations
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false // prevents issues with SSR
    }
  });

export default i18n;