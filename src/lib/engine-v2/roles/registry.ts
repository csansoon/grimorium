import type { EngineRoleDefinition } from './types'
import { assassinRole } from './definition/assassin'
import { artistRole } from './definition/artist'
import { cerenovusRole } from './definition/cerenovus'
import { clockmakerRole } from './definition/clockmaker'
import { chefRole } from './definition/chef'
import { dreamerRole } from './definition/dreamer'
import { evilTwinRole } from './definition/evilTwin'
import { empathRole } from './definition/empath'
import { foolRole } from './definition/fool'
import { flowergirlRole } from './definition/flowergirl'
import { fortuneTellerRole } from './definition/fortuneTeller'
import { investigatorRole } from './definition/investigator'
import { klutzRole } from './definition/klutz'
import { librarianRole } from './definition/librarian'
import { lleechRole } from './definition/lleech'
import { mathematicianRole } from './definition/mathematician'
import { mayorRole } from './definition/mayor'
import { monkRole } from './definition/monk'
import { mutantRole } from './definition/mutant'
import { oracleRole } from './definition/oracle'
import { pitHagRole } from './definition/pitHag'
import { professorRole } from './definition/professor'
import { ravenkeeperRole } from './definition/ravenkeeper'
import { sageRole } from './definition/sage'
import { seamstressRole } from './definition/seamstress'
import { snakeCharmerRole } from './definition/snakeCharmer'
import { sweetheartRole } from './definition/sweetheart'
import { teaLadyRole } from './definition/teaLady'
import { townCrierRole } from './definition/townCrier'
import { undertakerRole } from './definition/undertaker'
import { vigormortisRole } from './definition/vigormortis'
import { virginRole } from './definition/virgin'
import { washerwomanRole } from './definition/washerwoman'
import { witchRole } from './definition/witch'
import { vortoxRole } from './definition/vortox'
import { zombuulRole } from './definition/zombuul'

const ENGINE_ROLE_DEFINITIONS: Record<string, EngineRoleDefinition> = {
  [assassinRole.id]: assassinRole,
  [artistRole.id]: artistRole,
  [cerenovusRole.id]: cerenovusRole,
  [chefRole.id]: chefRole,
  [clockmakerRole.id]: clockmakerRole,
  [dreamerRole.id]: dreamerRole,
  [evilTwinRole.id]: evilTwinRole,
  [empathRole.id]: empathRole,
  [foolRole.id]: foolRole,
  [flowergirlRole.id]: flowergirlRole,
  [fortuneTellerRole.id]: fortuneTellerRole,
  [investigatorRole.id]: investigatorRole,
  [klutzRole.id]: klutzRole,
  [librarianRole.id]: librarianRole,
  [lleechRole.id]: lleechRole,
  [mathematicianRole.id]: mathematicianRole,
  [mayorRole.id]: mayorRole,
  [monkRole.id]: monkRole,
  [mutantRole.id]: mutantRole,
  [oracleRole.id]: oracleRole,
  [pitHagRole.id]: pitHagRole,
  [professorRole.id]: professorRole,
  [ravenkeeperRole.id]: ravenkeeperRole,
  [sageRole.id]: sageRole,
  [seamstressRole.id]: seamstressRole,
  [snakeCharmerRole.id]: snakeCharmerRole,
  [sweetheartRole.id]: sweetheartRole,
  [teaLadyRole.id]: teaLadyRole,
  [townCrierRole.id]: townCrierRole,
  [undertakerRole.id]: undertakerRole,
  [vigormortisRole.id]: vigormortisRole,
  [virginRole.id]: virginRole,
  [vortoxRole.id]: vortoxRole,
  [washerwomanRole.id]: washerwomanRole,
  [witchRole.id]: witchRole,
  [zombuulRole.id]: zombuulRole,
}

export function getEngineRoleDefinition(roleId: string): EngineRoleDefinition | null {
  return ENGINE_ROLE_DEFINITIONS[roleId] ?? null
}

export function getEngineRoleDefinitions(): EngineRoleDefinition[] {
  return Object.values(ENGINE_ROLE_DEFINITIONS)
}
