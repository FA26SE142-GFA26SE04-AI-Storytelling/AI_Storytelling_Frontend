export interface LanguageOption {
  code: string;
  label: string;
  nativeName: string;
  flag: string;
}

export const DEFAULT_LANGUAGE = 'vi';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
];
