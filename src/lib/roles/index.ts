import { RoleDefinition, RoleId } from './types'
import type { Game } from '../types'
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
import Sweetheart from './definition/sects-and-violets/sweetheart'
import Sage from './definition/sects-and-violets/sage'
import Klutz from './definition/sects-and-violets/klutz'
import Mutant from './definition/sects-and-violets/mutant'
import Barber from './definition/sects-and-violets/barber'
import Clockmaker from './definition/sects-and-violets/clockmaker'
import Oracle from './definition/sects-and-violets/oracle'
import Seamstress from './definition/sects-and-violets/seamstress'
import Flowergirl from './definition/sects-and-violets/flowergirl'
import TownCrier from './definition/sects-and-violets/town-crier'
import Mathematician from './definition/sects-and-violets/mathematician'
import Dreamer from './definition/sects-and-violets/dreamer'
import SnakeCharmer from './definition/sects-and-violets/snake-charmer'
import Savant from './definition/sects-and-violets/savant'
import Philosopher from './definition/sects-and-violets/philosopher'
import Artist from './definition/sects-and-violets/artist'
import EvilTwin from './definition/sects-and-violets/evil-twin'
import Witch from './definition/sects-and-violets/witch'
import Cerenovus from './definition/sects-and-violets/cerenovus'
import PitHag from './definition/sects-and-violets/pit-hag'
import FangGu from './definition/sects-and-violets/fang-gu'
import Vigormortis from './definition/sects-and-violets/vigormortis'
import NoDashii from './definition/sects-and-violets/no-dashii'
import Vortox from './definition/sects-and-violets/vortox'
import { applyCanonicalWakeOrder } from '../scripts/wakeOrder'
import { getRoleIdsForGame } from '../scripts'
import { getRoleEvilInfoModifier } from './evilInfoMetadata'

function applyStaticRoleMetadata(role: RoleDefinition): RoleDefinition {
  return {
    ...role,
    evilInfoModifier: role.evilInfoModifier ?? getRoleEvilInfoModifier(role.id),
  }
}

function createRoleRegistry(): Record<RoleId, RoleDefinition> {
  return {
    imp: applyStaticRoleMetadata(applyCanonicalWakeOrder(Imp)),
    villager: applyStaticRoleMetadata(applyCanonicalWakeOrder(Villager)),
    washerwoman: applyStaticRoleMetadata(applyCanonicalWakeOrder(Washerwoman)),
    librarian: applyStaticRoleMetadata(applyCanonicalWakeOrder(Librarian)),
    investigator: applyStaticRoleMetadata(applyCanonicalWakeOrder(Investigator)),
    chef: applyStaticRoleMetadata(applyCanonicalWakeOrder(Chef)),
    empath: applyStaticRoleMetadata(applyCanonicalWakeOrder(Empath)),
    fortune_teller: applyStaticRoleMetadata(applyCanonicalWakeOrder(FortuneTeller)),
    undertaker: applyStaticRoleMetadata(applyCanonicalWakeOrder(Undertaker)),
    monk: applyStaticRoleMetadata(applyCanonicalWakeOrder(Monk)),
    ravenkeeper: applyStaticRoleMetadata(applyCanonicalWakeOrder(Ravenkeeper)),
    soldier: applyStaticRoleMetadata(applyCanonicalWakeOrder(Soldier)),
    virgin: applyStaticRoleMetadata(applyCanonicalWakeOrder(Virgin)),
    slayer: applyStaticRoleMetadata(applyCanonicalWakeOrder(Slayer)),
    mayor: applyStaticRoleMetadata(applyCanonicalWakeOrder(Mayor)),
    saint: applyStaticRoleMetadata(applyCanonicalWakeOrder(Saint)),
    scarlet_woman: applyStaticRoleMetadata(applyCanonicalWakeOrder(ScarletWoman)),
    recluse: applyStaticRoleMetadata(applyCanonicalWakeOrder(Recluse)),
    poisoner: applyStaticRoleMetadata(applyCanonicalWakeOrder(Poisoner)),
    drunk: applyStaticRoleMetadata(applyCanonicalWakeOrder(Drunk)),
    butler: applyStaticRoleMetadata(applyCanonicalWakeOrder(Butler)),
    baron: applyStaticRoleMetadata(applyCanonicalWakeOrder(Baron)),
    spy: applyStaticRoleMetadata(applyCanonicalWakeOrder(Spy)),
    sweetheart: applyStaticRoleMetadata(applyCanonicalWakeOrder(Sweetheart)),
    sage: applyStaticRoleMetadata(applyCanonicalWakeOrder(Sage)),
    klutz: applyStaticRoleMetadata(applyCanonicalWakeOrder(Klutz)),
    mutant: applyStaticRoleMetadata(applyCanonicalWakeOrder(Mutant)),
    barber: applyStaticRoleMetadata(applyCanonicalWakeOrder(Barber)),
    clockmaker: applyStaticRoleMetadata(applyCanonicalWakeOrder(Clockmaker)),
    oracle: applyStaticRoleMetadata(applyCanonicalWakeOrder(Oracle)),
    seamstress: applyStaticRoleMetadata(applyCanonicalWakeOrder(Seamstress)),
    flowergirl: applyStaticRoleMetadata(applyCanonicalWakeOrder(Flowergirl)),
    town_crier: applyStaticRoleMetadata(applyCanonicalWakeOrder(TownCrier)),
    mathematician: applyStaticRoleMetadata(applyCanonicalWakeOrder(Mathematician)),
    dreamer: applyStaticRoleMetadata(applyCanonicalWakeOrder(Dreamer)),
    snake_charmer: applyStaticRoleMetadata(applyCanonicalWakeOrder(SnakeCharmer)),
    savant: applyStaticRoleMetadata(applyCanonicalWakeOrder(Savant)),
    philosopher: applyStaticRoleMetadata(applyCanonicalWakeOrder(Philosopher)),
    artist: applyStaticRoleMetadata(applyCanonicalWakeOrder(Artist)),
    evil_twin: applyStaticRoleMetadata(applyCanonicalWakeOrder(EvilTwin)),
    witch: applyStaticRoleMetadata(applyCanonicalWakeOrder(Witch)),
    cerenovus: applyStaticRoleMetadata(applyCanonicalWakeOrder(Cerenovus)),
    pit_hag: applyStaticRoleMetadata(applyCanonicalWakeOrder(PitHag)),
    fang_gu: applyStaticRoleMetadata(applyCanonicalWakeOrder(FangGu)),
    vigormortis: applyStaticRoleMetadata(applyCanonicalWakeOrder(Vigormortis)),
    no_dashii: applyStaticRoleMetadata(applyCanonicalWakeOrder(NoDashii)),
    vortox: applyStaticRoleMetadata(applyCanonicalWakeOrder(Vortox)),
  }
}

let roleRegistry: Record<RoleId, RoleDefinition> | null = null

function getRoleRegistry(): Record<RoleId, RoleDefinition> {
  if (!roleRegistry) {
    roleRegistry = createRoleRegistry()
  }
  return roleRegistry
}

export const ROLES: Record<RoleId, RoleDefinition> = new Proxy(
  {} as Record<RoleId, RoleDefinition>,
  {
    get(_target, prop: string) {
      return getRoleRegistry()[prop as RoleId]
    },
    ownKeys() {
      return Reflect.ownKeys(getRoleRegistry())
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      return {
        configurable: true,
        enumerable: true,
        value: getRoleRegistry()[prop as RoleId],
      }
    },
  },
)

// Re-export scripts module for backward compatibility
export { SCRIPTS, type ScriptId } from '../scripts'

// Legacy helper: script wake sheets now drive runtime wake order.
export function getNightOrderRoles(): RoleDefinition[] {
  return Object.values(getRoleRegistry())
    .filter((role) => role.nightOrder !== null)
    .sort((a, b) => (a.nightOrder ?? 0) - (b.nightOrder ?? 0))
}

export function getRole(roleId: string): RoleDefinition | undefined {
  return getRoleRegistry()[roleId as RoleId]
}

export function getAllRoles(): RoleDefinition[] {
  return Object.values(getRoleRegistry())
}

export function getRolesForGame(
  game: Pick<Game, 'scriptId' | 'scriptSnapshot'>,
): RoleDefinition[] {
  const scriptRoleIds = new Set(getRoleIdsForGame(game))
  return getAllRoles().filter((role) => scriptRoleIds.has(role.id))
}

// Re-export distribution helpers from scripts module for backward compatibility
export {
  getRecommendedDistribution,
  type RoleDistribution,
} from '../scripts'

export * from './types'
