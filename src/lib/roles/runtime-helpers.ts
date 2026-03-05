import { getEffect, isMalfunctioning } from '../effects'
import { getCurrentRoleId, getCurrentTeam } from '../identity'
import { Game, GameState, PlayerState, hasEffect, isAlive } from '../types'
import type { RoleDefinition } from './types'

export type FalseInfoMode = 'malfunction' | 'vortox'

export function isRoleMalfunctioning(player: PlayerState): boolean {
  return isMalfunctioning(player)
}

export function isVortoxAlive(state: GameState): boolean {
  return state.players.some(
    (player) =>
      isAlive(player) &&
      getCurrentRoleId(player) === 'vortox' &&
      !isRoleMalfunctioning(player),
  )
}

export function shouldForceFalseInfo(
  state: GameState,
  player: PlayerState,
): boolean {
  return getFalseInfoMode(state, player) !== null
}

export function getFalseInfoMode(
  state: GameState,
  player: PlayerState,
): FalseInfoMode | null {
  if (isRoleMalfunctioning(player)) return 'malfunction'
  if (getCurrentTeam(player) === 'townsfolk' && isVortoxAlive(state)) {
    return 'vortox'
  }
  return null
}

export function canActWhileDeadUnderVigormortis(
  game: Game,
  player: PlayerState,
): boolean {
  if (isAlive(player) || !hasEffect(player, 'vigormortis_killed')) return false

  const state = game.history.at(-1)?.stateAfter
  if (!state) return false

  return state.players.some(
    (candidate) =>
      isAlive(candidate) &&
      getCurrentRoleId(candidate) === 'vigormortis' &&
      !isRoleMalfunctioning(candidate),
  )
}

export function canWakeAtNight(
  game: Game,
  player: PlayerState,
  role?: Pick<RoleDefinition, 'shouldWake'>,
): boolean {
  const blockedByEffect = player.effects.some((effect) =>
    getEffect(effect.type)?.preventsNightWake === true,
  )

  if (!blockedByEffect) return true

  if (role?.shouldWake?.(game, player)) return true

  return canActWhileDeadUnderVigormortis(game, player)
}
