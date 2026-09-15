import type { EffectDefinition, EffectDescriptionProps } from '../../types'
import {
  getEffectTranslations,
  getRoleName,
  registerEffectTranslations,
} from '../../../i18n'
import type { Language } from '../../../i18n'

import correctEn from './i18n/correct-en'
import correctEs from './i18n/correct-es'
import wrongEn from './i18n/wrong-en'
import wrongEs from './i18n/wrong-es'

registerEffectTranslations('info_ping_correct', 'en', correctEn)
registerEffectTranslations('info_ping_correct', 'es', correctEs)
registerEffectTranslations('info_ping_wrong', 'en', wrongEn)
registerEffectTranslations('info_ping_wrong', 'es', wrongEs)

function InfoPingDescription({ instance, language }: EffectDescriptionProps) {
  const lang = language as Language
  const t = getEffectTranslations(instance.type, lang)
  const sourceRoleId = instance.data?.sourceRoleId as string | undefined
  const shownRoleId = instance.data?.shownRoleId as string | undefined

  if (!sourceRoleId || !shownRoleId) return null

  return (
    <span>
      {(t.descriptionTemplate as string)
        .replace('{sourceRole}', getRoleName(sourceRoleId, lang))
        .replace('{shownRole}', getRoleName(shownRoleId, lang))}
    </span>
  )
}

export const InfoPingCorrect: EffectDefinition = {
  id: 'info_ping_correct',
  icon: 'checkCircle',
  defaultType: 'marker',
  Description: InfoPingDescription,
}

export const InfoPingWrong: EffectDefinition = {
  id: 'info_ping_wrong',
  icon: 'x',
  defaultType: 'marker',
  Description: InfoPingDescription,
}
