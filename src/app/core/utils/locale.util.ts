export const SUPPORTED_LOCALES = ['en', 'fr', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'filmexa_locale';

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getLocaleFromPath(pathname: string): SupportedLocale {
  const match = pathname.match(/^\/(fr|ar)(\/|$)/);
  return isSupportedLocale(match?.[1]) ? (match![1] as SupportedLocale) : 'en';
}

export function buildLocalizedPath(pathname: string, search: string, targetLocale: SupportedLocale): string {
  const pathWithoutLocale = pathname.replace(/^\/(fr|ar)(\/|$)/, '/');
  const prefix = targetLocale === 'en' ? '' : `/${targetLocale}`;
  return `${prefix}${pathWithoutLocale}${search}`;
}
