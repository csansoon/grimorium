import { getRoleName } from './i18n'
import type { Language } from './i18n'
import { getEffect } from './effects'
import type { EffectId } from './effects/types'
import type { DayActionResult } from './pipeline/types'
import type { GameState } from './types'
import { isAlive } from './types'
import type { IconName } from '../components/atoms/icon'

export type MadnessResolutionStatus = 'active' | 'pending'

export type MadnessResolutionEntry = {
  id: string
  playerId: string
  effectType: EffectId
  status: MadnessResolutionStatus
  icon: IconName
  sourceRoleId: string
  title: string
  description: string
  madAsRoleId?: string
}

type PendingMadnessEffectData = {
  sourceRoleId?: string
  sourceEffectType?: EffectId
  madAsRoleId?: string
}

function buildPendingEntry(
  player: GameState['players'][number],
  data: PendingMadnessEffectData,
  language: string,
): Omit<MadnessResolutionEntry, 'id' | 'playerId' | 'effectType' | 'status'> {
  const pendingSourceEntry = data.sourceEffectType
    ? getEffect(data.sourceEffectType)?.madnessResolution?.buildPendingEntry?.(
        player,
        {
          sourceRoleId: data.sourceRoleId,
          claimRoleId: data.madAsRoleId,
        },
        language,
      )
    : null

  if (pendingSourceEntry) {
    return pendingSourceEntry
  }

  const sourceRoleId = data.sourceRoleId ?? 'mutant'
  const title =
    sourceRoleId === 'cerenovus'
      ? 'Pending Cerenovus madness'
      : sourceRoleId === 'mutant'
        ? 'Pending Mutant madness'
        : 'Pending madness consequence'
  const description =
    sourceRoleId === 'cerenovus' && data.madAsRoleId
      ? `${player.name} broke Cerenovus madness while claiming ${getRoleName(data.madAsRoleId, language as Language)}.`
      : `${player.name} has a deferred madness consequence waiting.`

  return {
    icon: 'drama',
    sourceRoleId,
    title,
    description,
    madAsRoleId: data.madAsRoleId,
  }
}

export function getMadnessResolutionEntries(
  state: GameState,
  language: string,
): MadnessResolutionEntry[] {
  const entries: MadnessResolutionEntry[] = []

  for (const player of state.players) {
    if (!isAlive(player)) continue

    const pendingEffect = player.effects.find(
      (effect) => effect.type === 'madness_break_pending',
    )

    if (pendingEffect) {
      const data = (pendingEffect.data ?? {}) as PendingMadnessEffectData

      entries.push({
        id: `madness_break_pending:${player.id}`,
        playerId: player.id,
        effectType: 'madness_break_pending',
        status: 'pending',
        ...buildPendingEntry(player, data, language),
      })
      continue
    }

    for (const effect of player.effects) {
      const entry = getEffect(effect.type)?.madnessResolution?.buildActiveEntry?.(
        player,
        effect,
        language,
      )
      if (!entry) continue

      entries.push({
        id: `${effect.type}:${player.id}`,
        playerId: player.id,
        effectType: effect.type as EffectId,
        status: 'active',
        ...entry,
      })
      break
    }
  }

  return entries
}

export function findMadnessResolutionEntry(
  state: GameState,
  language: string,
  playerId: string,
  effectType?: string,
): MadnessResolutionEntry | null {
  return (
    getMadnessResolutionEntries(state, language).find(
      (entry) =>
        entry.playerId === playerId &&
        (effectType == null || entry.effectType === effectType),
    ) ?? null
  )
}

export function buildMarkMadnessBrokenResult(
  _state: GameState,
  entry: MadnessResolutionEntry,
): DayActionResult {
  const sourceEffectType =
    entry.effectType === 'mutant_execution' || entry.effectType === 'cerenovus_madness'
      ? entry.effectType
      : undefined

  return {
    entries: [
      {
        type: 'effect_added',
        message: [
          { type: 'text', content: 'Madness break recorded for ' },
          { type: 'player', playerId: entry.playerId },
          { type: 'text', content: '.' },
        ],
        data: {
          playerId: entry.playerId,
          effectType: 'madness_break_pending',
          sourceEffectType,
          sourceRoleId: entry.sourceRoleId,
          action: 'madness_break_recorded',
        },
      },
    ],
    addEffects: {
      [entry.playerId]: [
        {
          type: 'madness_break_pending',
          data: {
            sourceRoleId: entry.sourceRoleId,
            sourceEffectType,
            madAsRoleId: entry.madAsRoleId,
          },
          expiresAt: 'never',
        },
      ],
    },
    removeEffects:
      entry.effectType === 'cerenovus_madness'
        ? { [entry.playerId]: ['cerenovus_madness'] }
        : undefined,
  }
}

export function buildResolvePendingMadnessResult(
  entry: MadnessResolutionEntry,
  mode: 'execute' | 'kill' | 'dismiss',
): DayActionResult {
  if (mode === 'dismiss') {
    return {
      entries: [
        {
          type: 'effect_removed',
          message: [
            { type: 'text', content: 'Madness consequence cleared for ' },
            { type: 'player', playerId: entry.playerId },
            { type: 'text', content: '.' },
          ],
          data: {
            playerId: entry.playerId,
            effectType: 'madness_break_pending',
            action: 'dismiss',
          },
        },
      ],
      removeEffects: { [entry.playerId]: ['madness_break_pending'] },
    }
  }

  return {
    entries: [
      {
        type: mode === 'execute' ? 'execution' : 'night_action',
        message: [
          { type: 'text', content: mode === 'execute' ? 'Madness execution: ' : 'Madness kill: ' },
          { type: 'player', playerId: entry.playerId },
        ],
        data: {
          playerId: entry.playerId,
          roleId: entry.sourceRoleId,
          action: mode === 'execute' ? 'madness_execute' : 'madness_kill',
        },
      },
    ],
    removeEffects: { [entry.playerId]: ['madness_break_pending'] },
    intent:
      mode === 'execute'
        ? { type: 'execute', playerId: entry.playerId, cause: 'madness' }
        : {
            type: 'kill',
            sourceId: entry.sourceRoleId,
            targetId: entry.playerId,
            cause: 'madness',
          },
  }
}
