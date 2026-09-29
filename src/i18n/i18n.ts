import { Language, messages, Translations } from './locales';

const LANG_STORAGE_KEY = 'rhwp_studio_lang';

export class I18nService {
  private static instance: I18nService | null = null;
  private currentLang: Language = 'ko';
  private listeners: Array<(lang: Language) => void> = [];

  private constructor() {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (saved && (saved === 'ko' || saved === 'en')) {
        this.currentLang = saved;
      } else {
        const browserLang = navigator.language.toLowerCase();
        this.currentLang = browserLang.startsWith('ko') ? 'ko' : 'en';
      }
    } catch {
      this.currentLang = 'ko';
    }
  }

  static getInstance(): I18nService {
    if (!this.instance) {
      this.instance = new I18nService();
    }
    return this.instance;
  }

  getLang(): Language {
    return this.currentLang;
  }

  t(): Translations {
    return messages[this.currentLang];
  }

  setLang(lang: Language) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    for (const listener of this.listeners) {
      try {
        listener(lang);
      } catch (e) {
        console.error('Error in i18n listener:', e);
      }
    }
  }

  onLangChange(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
