import { RoleDefinition, RoleId } from './types'
import Imp from './definition/imp'
import Villager from './definition/villager'
// Trouble Brewing
import Washerwoman from './definition/trouble-brewing/washerwoman'
import Librarian from './definition/trouble-brewing/librarian'
import Investigator from './definition/trouble-brewing/investigator'
import Chef from './definition/trouble-brewing/chef'
import Empath from './definition/trouble-brewing/empath'
import Monk from './definition/trouble-brewing/monk'
import Soldier from './definition/trouble-brewing/soldier'
import FortuneTeller from './definition/trouble-brewing/fortune-teller'
import Undertaker from './definition/trouble-brewing/undertaker'
import Ravenkeeper from './definition/trouble-brewing/ravenkeeper'
import Virgin from './definition/trouble-brewing/virgin'
import Slayer from './definition/trouble-brewing/slayer'
import Mayor from './definition/trouble-brewing/mayor'
import Saint from './definition/trouble-brewing/saint'
import ScarletWoman from './definition/trouble-brewing/scarlet-woman'
import Recluse from './definition/trouble-brewing/recluse'
import Poisoner from './definition/trouble-brewing/poisoner'
import Drunk from './definition/trouble-brewing/drunk'
import Butler from './definition/trouble-brewing/butler'
import Baron from './definition/trouble-brewing/baron'
import Spy from './definition/trouble-brewing/spy'

export const ROLES: Record<RoleId, RoleDefinition> = {
  imp: Imp,
  villager: Villager,
  washerwoman: Washerwoman,
  librarian: Librarian,
  investigator: Investigator,
  chef: Chef,
  empath: Empath,
  fortune_teller: FortuneTeller,
  undertaker: Undertaker,
  monk: Monk,
  ravenkeeper: Ravenkeeper,
  soldier: Soldier,
  virgin: Virgin,
  slayer: Slayer,
  mayor: Mayor,
  saint: Saint,
  scarlet_woman: ScarletWoman,
  recluse: Recluse,
  poisoner: Poisoner,
  drunk: Drunk,
  butler: Butler,
  baron: Baron,
  spy: Spy,
}

// Scripts define which roles are in each edition
export type ScriptId = 'trouble-brewing'

export const SCRIPTS: Record<ScriptId, { name: string; roles: RoleId[] }> = {
  'trouble-brewing': {
    name: 'Trouble Brewing',
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
  },
}

// Get all roles sorted by night order (roles that wake at night)
export function getNightOrderRoles(): RoleDefinition[] {
  return Object.values(ROLES)
    .filter((role) => role.nightOrder !== null)
    .sort((a, b) => (a.nightOrder ?? 0) - (b.nightOrder ?? 0))
}

export function getRole(roleId: string): RoleDefinition | undefined {
  return ROLES[roleId as RoleId]
}

export function getAllRoles(): RoleDefinition[] {
  return Object.values(ROLES)
}

// ============================================================================
// ROLE DISTRIBUTION RECOMMENDATION
// ============================================================================

export type RoleDistribution = {
  townsfolk: number
  outsider: number
  minion: number
  demon: number
}

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

export * from './types'
