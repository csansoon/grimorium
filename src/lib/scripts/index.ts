import { ScriptDefinition, ScriptId, RoleDistribution } from './types'
import { RoleId } from '../roles/types'
import { TeamId } from '../teams/types'

export type { ScriptId, ScriptDefinition, RoleDistribution } from './types'
export type { GeneratorPreset, GeneratedPool } from './types'

// ============================================================================
// ALL ROLE IDS (static list to avoid circular dependency with roles module)
// ============================================================================

const ALL_ROLE_IDS: RoleId[] = [
  'villager',
  'imp',
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'empath',
  'fortune_teller',
  'undertaker',
  'monk',
  'ravenkeeper',
  'soldier',
  'virgin',
  'slayer',
  'mayor',
  'saint',
  'scarlet_woman',
  'recluse',
  'poisoner',
  'drunk',
  'butler',
  'baron',
  'spy',
]

// ============================================================================
// SCRIPT DEFINITIONS
// ============================================================================

export const SCRIPTS: Record<ScriptId, ScriptDefinition> = {
  'trouble-brewing': {
    id: 'trouble-brewing',
    icon: 'scrollText',
    roles: [
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'fortune_teller',
      'undertaker',
      'monk',
      'ravenkeeper',
      'soldier',
      'virgin',
      'slayer',
      'mayor',
      'saint',
      'recluse',
      'villager',
      'scarlet_woman',
      'poisoner',
      'drunk',
      'butler',
      'baron',
      'spy',
      'imp',
    ],
    enforceDistribution: true,
  },
  custom: {
    id: 'custom',
    icon: 'settings',
    roles: ALL_ROLE_IDS,
    enforceDistribution: false,
  },
}

// ============================================================================
// SCRIPT HELPERS
// ============================================================================

export function getScript(scriptId: ScriptId): ScriptDefinition {
  return SCRIPTS[scriptId]
}

export function getAllScripts(): ScriptDefinition[] {
  return Object.values(SCRIPTS)
}

// ============================================================================
// ROLE DISTRIBUTION
// ============================================================================

/**
 * Returns the official BotC recommended role distribution for a given player count.
 * Based on the standard distribution table:
 * 5: 3/0/1/1, 6: 3/1/1/1, 7: 5/0/1/1, 8: 5/1/1/1, 9: 5/2/1/1,
 * 10: 7/0/2/1, 11: 7/1/2/1, 12: 7/2/2/1, 13: 9/0/3/1, etc.
 */
export function getRecommendedDistribution(
  playerCount: number,
): RoleDistribution | null {
  if (playerCount < 5) return null

  const demon = 1
  let minion: number
  let outsider: number

  if (playerCount <= 6) {
    minion = 1
    outsider = playerCount - 5
  } else {
    const k = Math.floor((playerCount - 7) / 3)
    minion = 1 + k
    outsider = (playerCount - 7) % 3
  }

  const townsfolk = playerCount - demon - minion - outsider

  return { townsfolk, outsider, minion, demon }
}

/**
 * Applies distribution modifiers (e.g., Baron: { outsider: +2, townsfolk: -2 }).
 * Ensures no team count goes below 0.
 *
 * Takes modifiers directly to avoid circular dependency with roles module.
 * Callers should extract `distributionModifier` from the relevant role definitions.
 */
export function applyDistributionModifiers(
  base: RoleDistribution,
  modifiers: (Partial<Record<TeamId, number>> | undefined)[],
): RoleDistribution {
  const result = { ...base }

  for (const modifier of modifiers) {
    if (!modifier) continue
    for (const [teamId, delta] of Object.entries(modifier)) {
      result[teamId as TeamId] = Math.max(
        0,
        result[teamId as TeamId] + delta,
      )
    }
  }

  return result
}
