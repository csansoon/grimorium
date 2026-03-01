/**
 * Distributed i18n registry for roles and effects.
 *
 * Roles and effects register their own translations at import time,
 * keeping translation text co-located with the code that uses it.
 * Shared/generic translations remain in the central translation files.
 */

import { Language } from './types'

// ─── Internal registries ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const roleTranslations: Record<string, Record<string, Record<string, any>>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const effectTranslations: Record<
  string,
  Record<string, Record<string, any>>
> = {}

// ─── Registration functions ──────────────────────────────────────────────────

/**
 * Register translations for a role. Called as a side-effect of importing
 * the role definition module.
 */
export function registerRoleTranslations(
  roleId: string,
  lang: Language,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: Record<string, any>,
): void {
  roleTranslations[roleId] ??= {}
  roleTranslations[roleId][lang] = translations
}

/**
 * Register translations for an effect. Called as a side-effect of importing
 * the effect definition module.
 */
export function registerEffectTranslations(
  effectId: string,
  lang: Language,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: Record<string, any>,
): void {
  effectTranslations[effectId] ??= {}
  effectTranslations[effectId][lang] = translations
}

// ─── Lookup functions ────────────────────────────────────────────────────────

/**
 * Get a role's translations for the given language, falling back to English.
 * Returns an empty object if nothing is registered.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRoleTranslations(
  roleId: string,
  lang: Language,
): Record<string, any> {
  return (
    roleTranslations[roleId]?.[lang] ?? roleTranslations[roleId]?.['en'] ?? {}
  )
}

/**
 * Get an effect's translations for the given language, falling back to English.
 * Returns an empty object if nothing is registered.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEffectTranslations(
  effectId: string,
  lang: Language,
): Record<string, any> {
  return (
    effectTranslations[effectId]?.[lang] ??
    effectTranslations[effectId]?.['en'] ??
    {}
  )
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/** Get a role's display name for the given language. */
export function getRoleName(roleId: string, lang: Language): string {
  return (getRoleTranslations(roleId, lang).name as string) ?? roleId
}

/** Get a role's description for the given language. */
export function getRoleDescription(roleId: string, lang: Language): string {
  return (getRoleTranslations(roleId, lang).description as string) ?? ''
}

/** Get an effect's display name for the given language. */
export function getEffectName(effectId: string, lang: Language): string {
  return (getEffectTranslations(effectId, lang).name as string) ?? effectId
}

/** Get an effect's description for the given language. */
export function getEffectDescription(effectId: string, lang: Language): string {
  return (getEffectTranslations(effectId, lang).description as string) ?? ''
}

/** Get a role's flavor quote for the given language. */
export function getRoleQuote(roleId: string, lang: Language): string {
  return (getRoleTranslations(roleId, lang).quote as string) ?? ''
}

/** Get a role's ability/condition lines for the given language. */
export function getRoleLines(
  roleId: string,
  lang: Language,
): { type: string; text: string }[] {
  const lines = getRoleTranslations(roleId, lang).lines
  if (Array.isArray(lines)) return lines as { type: string; text: string }[]
  return []
}
