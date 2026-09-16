import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { LOCALE_STORAGE_KEY, SupportedLocale, buildLocalizedPath } from '../../utils/locale.util';

const PREFERRED_LANGUAGE_TO_LOCALE: Record<string, SupportedLocale> = {
  ENGLISH: 'en',
  FRENCH: 'fr',
  ARABIC: 'ar',
};

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(@Inject(LOCALE_ID) private readonly localeId: string) {}

  get currentLocale(): string {
    return this.localeId.split('-')[0];
  }

  localeFromPreferredLanguage(preferredLanguage: string | undefined | null): SupportedLocale | undefined {
    return preferredLanguage ? PREFERRED_LANGUAGE_TO_LOCALE[preferredLanguage] : undefined;
  }

  redirectToPreferredLanguage(preferredLanguage: string | undefined | null): void {
    const targetLocale = this.localeFromPreferredLanguage(preferredLanguage);
    if (!targetLocale) {
      return;
    }

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, targetLocale);
    } catch {

    }

    if (targetLocale === this.currentLocale) {
      return;
    }

    window.location.href = buildLocalizedPath(window.location.pathname, window.location.search, targetLocale);
  }
}
