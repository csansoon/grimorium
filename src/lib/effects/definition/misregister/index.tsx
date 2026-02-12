import { EffectDefinition, EffectDescriptionProps } from '../../types'
import { Perception } from '../../../pipeline/types'
import { registerEffectTranslations, getEffectTranslations } from '../../../i18n'
import type { Language } from '../../../i18n'
import { Badge } from '../../../../components/atoms'
import type { TeamId } from '../../../teams'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('misregister', 'en', en)
registerEffectTranslations('misregister', 'es', es)

// Badge variant for alignment rendering
const ALIGNMENT_BADGE_VARIANT: Record<string, 'townsfolk' | 'demon'> = {
  good: 'townsfolk',
  evil: 'demon',
}

function MisregisterDescription({ instance, language }: EffectDescriptionProps) {
  const t = getEffectTranslations('misregister', language as Language)
  const canRegisterAs = instance.data?.canRegisterAs as
    | { teams?: string[]; alignments?: string[] }
    | undefined

  if (!canRegisterAs) return null

  const alignments = canRegisterAs.alignments ?? []
  const teams = canRegisterAs.teams ?? []

  if (alignments.length === 0 && teams.length === 0) return null

  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      <span>{t.mightRegisterAs as string}</span>
      {alignments.map((a) => (
        <Badge key={`alignment-${a}`} variant={ALIGNMENT_BADGE_VARIANT[a] ?? 'default'}>
          {(t[`alignment_${a}`] as string) ?? a}
        </Badge>
      ))}
      {teams.map((team) => (
        <Badge key={`team-${team}`} variant={team as TeamId}>
          {(t[`team_${team}`] as string) ?? team}
        </Badge>
      ))}
    </span>
  )
}

/**
 * Misregister effect — a generic effect for any role that might register
 * differently to information abilities.
 *
 * Instance data configures what this player can misregister as:
 * - `data.canRegisterAs.teams` — teams they might appear as (e.g., ['minion', 'demon'])
 * - `data.canRegisterAs.alignments` — alignments they might appear as (e.g., ['evil'])
 *
 * The perception modifier reads `data.perceiveAs` to apply narrator-configured
 * overrides during night actions (via `PerceptionConfigStep` +
 * `applyPerceptionOverrides()`).
 *
 * Used by:
 * - Recluse — good player that might register as evil / Minion / Demon
 * - Spy — evil player that might register as good / Townsfolk / Outsider
 */
const definition: EffectDefinition = {
  id: 'misregister',
  icon: 'drama',
  defaultType: 'perception',
  perceptionModifiers: [
    {
      context: ['alignment', 'team', 'role'],
      modify: (perception, _target, _observer, _state, effectData) => {
        const overrides = effectData?.perceiveAs as
          | Partial<Perception>
          | undefined
        if (!overrides) return perception
        return { ...perception, ...overrides }
      },
    },
  ],
  Description: MisregisterDescription,
}

export default definition
