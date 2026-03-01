export { I18nProvider, useI18n, interpolate, LANGUAGES } from './context'
export type { Language, Translations } from './types'
export type { LanguageOption } from './context'
export {
  registerRoleTranslations,
  registerEffectTranslations,
  getRoleTranslations,
  getEffectTranslations,
  getRoleName,
  getRoleDescription,
  getRoleQuote,
  getRoleLines,
  getEffectName,
  getEffectDescription,
} from './registry'
