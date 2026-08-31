import { Inject, Injectable, LOCALE_ID } from '@angular/core';

const PREFERRED_LANGUAGE_TO_LOCALE: Record<string, string> = {
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

  redirectToPreferredLanguage(preferredLanguage: string | undefined | null): void {
    const targetLocale = preferredLanguage ? PREFERRED_LANGUAGE_TO_LOCALE[preferredLanguage] : undefined;
    if (!targetLocale || targetLocale === this.currentLocale) {
      return;
    }

    window.location.href = this.buildLocalizedUrl(targetLocale);
  }

  private buildLocalizedUrl(targetLocale: string): string {
    const pathWithoutLocale = window.location.pathname.replace(/^\/(fr|ar)(\/|$)/, '/');
    const prefix = targetLocale === 'en' ? '' : `/${targetLocale}`;
    return `${prefix}${pathWithoutLocale}${window.location.search}`;
  }
}
