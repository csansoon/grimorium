import { useState } from 'react'
import {
  EffectDefinition,
  EffectDescriptionProps,
  EffectConfigEditorProps,
} from '../../types'
import { Perception } from '../../../pipeline/types'
import {
  registerEffectTranslations,
  getEffectTranslations,
} from '../../../i18n'
import type { Language } from '../../../i18n'
import { Badge, Button, Icon } from '../../../../components/atoms'
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

function MisregisterDescription({
  instance,
  language,
}: EffectDescriptionProps) {
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
        <Badge
          key={`alignment-${a}`}
          variant={ALIGNMENT_BADGE_VARIANT[a] ?? 'default'}
        >
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

const ALL_TEAMS: TeamId[] = ['townsfolk', 'outsider', 'minion', 'demon']
const ALL_ALIGNMENTS: ('good' | 'evil')[] = ['good', 'evil']

function MisregisterConfigEditor({
  data,
  language,
  onSave,
  onCancel,
}: EffectConfigEditorProps) {
  const t = getEffectTranslations('misregister', language as Language)

  const existing = data?.canRegisterAs as
    | { teams?: string[]; alignments?: string[] }
    | undefined

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(
    new Set(existing?.teams ?? []),
  )
  const [selectedAlignments, setSelectedAlignments] = useState<Set<string>>(
    new Set(existing?.alignments ?? []),
  )

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(team)) next.delete(team)
      else next.add(team)
      return next
    })
  }

  const toggleAlignment = (alignment: string) => {
    setSelectedAlignments((prev) => {
      const next = new Set(prev)
      if (next.has(alignment)) next.delete(alignment)
      else next.add(alignment)
      return next
    })
  }

  const handleSave = () => {
    onSave({
      ...data,
      canRegisterAs: {
        teams: Array.from(selectedTeams),
        alignments: Array.from(selectedAlignments),
      },
    })
  }

  const hasSelection = selectedTeams.size > 0 || selectedAlignments.size > 0

  return (
    <div className='space-y-4'>
      {/* Alignments */}
      <div>
        <p className='text-parchment-300 text-xs font-bold uppercase tracking-wider mb-2'>
          {(t.configAlignments as string) ?? 'Alignments'}
        </p>
        <div className='flex gap-2'>
          {ALL_ALIGNMENTS.map((alignment) => {
            const isSelected = selectedAlignments.has(alignment)
            return (
              <button
                key={alignment}
                onClick={() => toggleAlignment(alignment)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm font-medium ${
                  isSelected
                    ? alignment === 'good'
                      ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
                      : 'bg-red-500/20 border-red-400/50 text-red-200'
                    : 'bg-white/5 border-white/10 text-parchment-400 hover:border-white/30'
                }`}
              >
                <Icon
                  name={isSelected ? 'checkSquare' : 'square'}
                  size='sm'
                />
                {(t[`alignment_${alignment}`] as string) ?? alignment}
              </button>
            )
          })}
        </div>
      </div>

      {/* Teams */}
      <div>
        <p className='text-parchment-300 text-xs font-bold uppercase tracking-wider mb-2'>
          {(t.configTeams as string) ?? 'Teams'}
        </p>
        <div className='grid grid-cols-2 gap-2'>
          {ALL_TEAMS.map((team) => {
            const isSelected = selectedTeams.has(team)
            return (
              <button
                key={team}
                onClick={() => toggleTeam(team)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-sm ${
                  isSelected
                    ? 'bg-white/10 border-white/30 text-parchment-100'
                    : 'bg-white/5 border-white/10 text-parchment-400 hover:border-white/30'
                }`}
              >
                <Icon
                  name={isSelected ? 'checkSquare' : 'square'}
                  size='sm'
                />
                <Badge variant={team}>
                  {(t[`team_${team}`] as string) ?? team}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-2 pt-2'>
        <Button onClick={onCancel} variant='ghost' className='flex-1'>
          {(t.configCancel as string) ?? 'Cancel'}
        </Button>
        <Button
          onClick={handleSave}
          variant='primary'
          className='flex-1'
          disabled={!hasSelection}
        >
          {(t.configSave as string) ?? 'Save'}
        </Button>
      </div>
    </div>
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
  ConfigEditor: MisregisterConfigEditor,
}

export default definition
