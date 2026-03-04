import { getRole } from './roles'
import type { RoleDefinition } from './roles/types'
import type { Alignment, PlayerState } from './types'
import type { TeamId } from './teams'

export function getAlignmentForTeam(teamId?: TeamId | null): Alignment {
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
    player.currentAlignment ?? getAlignmentForTeam(getCurrentRole(player)?.team)
  )
}

export function getBaseAlignment(player: PlayerState): Alignment {
  return player.baseAlignment ?? getAlignmentForTeam(getBaseRole(player)?.team)
}

export function getCurrentTeam(player: PlayerState): TeamId | undefined {
  return getCurrentRole(player)?.team
}

export function isGood(player: PlayerState): boolean {
  return getCurrentAlignment(player) === 'good'
}

export function isEvil(player: PlayerState): boolean {
  return getCurrentAlignment(player) === 'evil'
}

export function initializePlayerIdentity(player: PlayerState): PlayerState {
  const currentRole = getRole(player.roleId)

  return {
    ...player,
    baseRoleId: player.baseRoleId ?? player.roleId,
    baseAlignment:
      player.baseAlignment ?? getAlignmentForTeam(currentRole?.team),
    currentAlignment:
      player.currentAlignment ?? getAlignmentForTeam(currentRole?.team),
  }
}
