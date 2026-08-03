import en from '@/locales/en.json';
import my from '@/locales/my.json';

export type Language = 'en' | 'my';

const dictionaries: Record<Language, typeof en> = {
  en,
  my: my as typeof en,
};

export function getTranslation(lang: Language) {
  return dictionaries[lang] || dictionaries.en;
}
