import { fr } from './fr';
import { en } from './en';
import { es } from './es';

export type Language = 'fr' | 'en' | 'es';

export const translations = {
  fr,
  en,
  es,
};

export const supportedLanguages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

// Default language
export const defaultLanguage: Language = 'fr';

class I18n {
  private currentLanguage: Language = defaultLanguage;
  
  setLanguage(language: Language) {
    this.currentLanguage = language;
  }
  
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters in translation
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return value;
  }
}

export const i18n = new I18n();