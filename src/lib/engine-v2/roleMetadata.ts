import { getRole } from '../roles'
import { getEngineRoleDefinition } from './roles/registry'

export function getResolvedRoleTeam(roleId: string): string | null {
  return getEngineRoleDefinition(roleId)?.roleTeam ?? getRole(roleId)?.roleTeam ?? null
}

export function isDemonRoleId(roleId: string): boolean {
  return getResolvedRoleTeam(roleId) === 'demon'
}
