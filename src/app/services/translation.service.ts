import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Language {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  
  languages = signal<Language[]>([
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' }
  ]);

  currentLanguage = signal<Language>(this.languages()[0]);

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Set available languages
    const langCodes = this.languages().map(lang => lang.code);
    this.translate.addLangs(langCodes);
    
    // Set default language immediately (synchronous)
    this.translate.setDefaultLang('en');
    
    // Get saved language or use browser language
    const savedLang = localStorage.getItem(this.STORAGE_KEY);
    const browserLang = this.translate.getBrowserLang();
    
    let defaultLang = 'en';
    if (savedLang && langCodes.includes(savedLang)) {
      defaultLang = savedLang;
    } else if (browserLang && langCodes.includes(browserLang)) {
      defaultLang = browserLang;
    }

    // Use selected language (asynchronous but non-blocking)
    this.setLanguage(defaultLang);
  }

  setLanguage(langCode: string): void {
    const language = this.languages().find(lang => lang.code === langCode);
    if (language) {
      this.translate.use(langCode).subscribe({
        next: () => {
          this.currentLanguage.set(language);
          localStorage.setItem(this.STORAGE_KEY, langCode);
        },
        error: (err) => {
          console.error('Translation loading failed:', err);
          // Fallback to default language to ensure app continues rendering
          this.translate.setDefaultLang('en');
        }
      });
    }
  }

  getTranslation(key: string): string {
    return this.translate.instant(key);
  }

  getCurrentLanguageCode(): string {
    return this.currentLanguage().code;
  }
}
