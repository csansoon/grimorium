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

// Re-export scripts module for backward compatibility
export { SCRIPTS, type ScriptId } from '../scripts'

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

// Re-export distribution helpers from scripts module for backward compatibility
export {
  getRecommendedDistribution,
  type RoleDistribution,
} from '../scripts'

export * from './types'
