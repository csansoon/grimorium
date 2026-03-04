import {
  BuiltinScriptId,
  ScriptDefinition,
  ScriptId,
  RoleDistribution,
} from './types'
import { RoleId } from '../roles/types'
import { TeamId } from '../teams/types'
import type { Game } from '../types'
import { deriveWakeOrderFromRoleIds, getRuntimeWakeRoleIds } from './wakeOrder'
import { getSavedScript, getSavedScripts } from './storage'

export type {
  ScriptId,
  BuiltinScriptId,
  ScriptDefinition,
  SavedScriptDefinition,
  EditableScriptDraft,
  RoleDistribution,
  ScriptWakeEntry,
  ScriptWakeOrder,
  ScriptSource,
} from './types'
export type { GeneratorPreset, GeneratedPool } from './types'
export {
  getSavedScripts,
  getSavedScript,
  saveScript,
  deleteSavedScript,
} from './storage'

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
  'sweetheart',
  'sage',
  'klutz',
  'mutant',
  'barber',
  'clockmaker',
  'oracle',
  'seamstress',
  'flowergirl',
  'town_crier',
  'mathematician',
  'dreamer',
  'snake_charmer',
  'savant',
  'philosopher',
  'artist',
  'evil_twin',
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
]

const SECTS_AND_VIOLETS_ROLES: RoleId[] = [
  'clockmaker',
  'dreamer',
  'snake_charmer',
  'mathematician',
  'flowergirl',
  'town_crier',
  'oracle',
  'seamstress',
  'philosopher',
  'artist',
  'savant',
  'mutant',
  'sweetheart',
  'barber',
  'klutz',
  'evil_twin',
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
]

const TROUBLE_BREWING_ROLES: RoleId[] = [
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
]

export const BUILTIN_SCRIPTS: Record<BuiltinScriptId, ScriptDefinition> = {
  'trouble-brewing': {
    id: 'trouble-brewing',
    source: 'builtin',
    name: 'Trouble Brewing',
    icon: 'scrollText',
    roles: TROUBLE_BREWING_ROLES,
    enforceDistribution: true,
    wakeOrder: deriveWakeOrderFromRoleIds(TROUBLE_BREWING_ROLES),
    isOfficial: true,
  },
  'sects-and-violets': {
    id: 'sects-and-violets',
    source: 'builtin',
    name: 'Sects & Violets',
    icon: 'flower',
    roles: SECTS_AND_VIOLETS_ROLES,
    enforceDistribution: true,
    wakeOrder: deriveWakeOrderFromRoleIds(SECTS_AND_VIOLETS_ROLES),
    isOfficial: true,
  },
  custom: {
    id: 'custom',
    source: 'custom',
    name: 'Custom Game',
    icon: 'settings',
    roles: ALL_ROLE_IDS,
    enforceDistribution: false,
    wakeOrder: deriveWakeOrderFromRoleIds(ALL_ROLE_IDS),
    isOfficial: false,
  },
}

// Legacy export for modules that still read built-ins directly.
export const SCRIPTS = BUILTIN_SCRIPTS

export function isBuiltinScriptId(scriptId: string): scriptId is BuiltinScriptId {
  return scriptId in BUILTIN_SCRIPTS
}

export function getScript(scriptId: ScriptId): ScriptDefinition | undefined {
  if (isBuiltinScriptId(scriptId)) return BUILTIN_SCRIPTS[scriptId]
  return getSavedScript(scriptId)
}

export function getRoleIdsForScript(scriptId: ScriptId): RoleId[] {
  return getScript(scriptId)?.roles ?? ALL_ROLE_IDS
}

export function getScriptForGame(
  game: Pick<Game, 'scriptId' | 'scriptSnapshot'>,
): ScriptDefinition | undefined {
  return game.scriptSnapshot ?? getScript(game.scriptId)
}

export function getRoleIdsForGame(game: Pick<Game, 'scriptId' | 'scriptSnapshot'>): RoleId[] {
  return getScriptForGame(game)?.roles ?? ALL_ROLE_IDS
}

export function getBuiltinScripts(): ScriptDefinition[] {
  return Object.values(BUILTIN_SCRIPTS)
}

export function getAllScripts(): ScriptDefinition[] {
  return [...getBuiltinScripts(), ...getSavedScripts()]
}

export function getScriptWakeOrder(
  scriptId: ScriptId,
  round: number,
) {
  const script = getScript(scriptId) ?? BUILTIN_SCRIPTS.custom
  return getRuntimeWakeRoleIds(
    round <= 1 ? script.wakeOrder.firstNight : script.wakeOrder.otherNights,
  )
}

export function deriveScriptWakeOrderFromRoleIds(roleIds: RoleId[]) {
  return deriveWakeOrderFromRoleIds(Array.from(new Set(roleIds)))
}

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
