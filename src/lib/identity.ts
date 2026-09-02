import { getRole } from './roles'
import type { RoleDefinition } from './roles/types'
import type { Alignment, PlayerState } from './types'
import type { TeamId } from './teams'

export function getRoleTeamId(
  role?: Pick<RoleDefinition, 'roleTeam'> | null,
): TeamId | undefined {
  return role?.roleTeam
}

export function getAlignmentForRoleTeam(teamId?: TeamId | null): Alignment {
  return teamId === 'minion' || teamId === 'demon' ? 'evil' : 'good'
}

export function getCurrentRoleId(player: PlayerState): string {
  return player.roleId
}

export function getBaseRoleId(player: PlayerState): string {
  return player.baseRoleId ?? player.roleId
}

export function getCurrentRole(player: PlayerState): RoleDefinition | undefined {
  return getRole(getCurrentRoleId(player))
}

export function getBaseRole(player: PlayerState): RoleDefinition | undefined {
  return getRole(getBaseRoleId(player))
}

export function getCurrentAlignment(player: PlayerState): Alignment {
  return (
    player.currentAlignment ??
    getAlignmentForRoleTeam(getRoleTeamId(getCurrentRole(player)))
  )
}

export function getBaseAlignment(player: PlayerState): Alignment {
  return (
    player.baseAlignment ??
    getAlignmentForRoleTeam(getRoleTeamId(getBaseRole(player)))
  )
}

export function getCurrentRoleTeam(player: PlayerState): TeamId | undefined {
  return getRoleTeamId(getCurrentRole(player))
}

export function getBaseRoleTeam(player: PlayerState): TeamId | undefined {
  return getRoleTeamId(getBaseRole(player))
}

export function isGood(player: PlayerState): boolean {
  return getCurrentAlignment(player) === 'good'
}

export function isEvil(player: PlayerState): boolean {
  return getCurrentAlignment(player) === 'evil'
}

export function initializePlayerIdentity(player: PlayerState): PlayerState {
  const currentRole = getRole(player.roleId)
  const currentRoleTeam = getRoleTeamId(currentRole)

  return {
    ...player,
    baseRoleId: player.baseRoleId ?? player.roleId,
    baseAlignment:
      player.baseAlignment ?? getAlignmentForRoleTeam(currentRoleTeam),
    currentAlignment:
      player.currentAlignment ?? getAlignmentForRoleTeam(currentRoleTeam),
  }
}
