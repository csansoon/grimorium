import { getAllRoles, getRole } from '../roles'
import type { EngineState } from './state'
import { isPlayerTrulyAlive } from './state'
import { getEngineRoleDefinition } from './roles/registry'
import type { EngineEvent } from './types'

const MINION_TEAM = 'minion'
const DEMON_TEAM = 'demon'
const GOOD_TEAMS = new Set(['townsfolk', 'outsider', 'traveler'])
const EVIL_TEAMS = new Set(['minion', 'demon'])

function isNightPhaseBoundaryEvent(event: EngineEvent): boolean {
  return event.type === 'phase_changed' && event.phase !== 'first_night' && event.phase !== 'other_night'
}

export function getResolvedRoleTeam(roleId: string): string | null {
  return getEngineRoleDefinition(roleId)?.roleTeam ?? getRole(roleId)?.roleTeam ?? null
}

export function isRoleInPlay(state: EngineState, roleId: string): boolean {
  return state.players.some((player) => player.roleId === roleId)
}

export function roleHasNightAbility(roleId: string): boolean {
  const engineRole = getEngineRoleDefinition(roleId)
  if (engineRole?.performAbility) {
    return true
  }

  const role = getRole(roleId)
  return Boolean(role?.NightAction)
}

export function isGoodRoleId(roleId: string): boolean {
  const team = getResolvedRoleTeam(roleId)
  return team ? GOOD_TEAMS.has(team) : false
}

export function isEvilRoleId(roleId: string): boolean {
  const team = getResolvedRoleTeam(roleId)
  return team ? EVIL_TEAMS.has(team) : false
}

export function getAlternateDreamerRoleId(actualRoleId: string): string | null {
  const actualTeam = getResolvedRoleTeam(actualRoleId)
  if (!actualTeam) {
    return null
  }

  const wantGood = EVIL_TEAMS.has(actualTeam)

  const candidate = getAllRoles()
    .map((role) => role.id)
    .find((roleId) => {
      if (roleId === actualRoleId) {
        return false
      }

      return wantGood ? isGoodRoleId(roleId) : isEvilRoleId(roleId)
    })

  return candidate ?? null
}

export function countClosestMinionDistance(state: EngineState): number {
  const demonIndices = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => {
      const team = getResolvedRoleTeam(player.roleId)
      return team === DEMON_TEAM && isPlayerTrulyAlive(player)
    })
    .map(({ index }) => index)

  const minionIndices = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => {
      const team = getResolvedRoleTeam(player.roleId)
      return team === MINION_TEAM && isPlayerTrulyAlive(player)
    })
    .map(({ index }) => index)

  if (demonIndices.length === 0 || minionIndices.length === 0) {
    return 0
  }

  const playerCount = state.players.length
  let closest = Number.MAX_SAFE_INTEGER

  for (const demonIndex of demonIndices) {
    for (const minionIndex of minionIndices) {
      const diff = Math.abs(demonIndex - minionIndex)
      closest = Math.min(closest, diff, playerCount - diff)
    }
  }

  return closest === Number.MAX_SAFE_INTEGER ? 0 : closest
}

export function countDeadEvilPlayers(state: EngineState): number {
  return state.players.filter((player) => {
    const team = getResolvedRoleTeam(player.roleId)
    return !isPlayerTrulyAlive(player) && (team === MINION_TEAM || team === DEMON_TEAM)
  }).length
}

export function playersShareAlignment(
  state: EngineState,
  firstPlayerId: string,
  secondPlayerId: string,
): boolean {
  const first = state.players.find((player) => player.id === firstPlayerId)
  const second = state.players.find((player) => player.id === secondPlayerId)

  if (!first || !second) {
    return false
  }

  return first.alignment === second.alignment
}

export function getInPlayRoleIdsForTeam(
  state: EngineState,
  desiredRoleTeam: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler',
): string[] {
  const seen = new Set<string>()

  return state.players
    .map((player) => player.roleId)
    .filter((roleId) => {
      if (seen.has(roleId)) {
        return false
      }

      const roleTeam = getResolvedRoleTeam(roleId)
      if (roleTeam !== desiredRoleTeam) {
        return false
      }

      seen.add(roleId)
      return true
    })
}

export function findRoleHolder(
  state: EngineState,
  roleId: string,
): EngineState['players'][number] | null {
  return state.players.find((player) => player.roleId === roleId) ?? null
}

export function countEvilPairs(state: EngineState): number {
  const alivePlayers = state.players.filter(isPlayerTrulyAlive)
  if (alivePlayers.length < 2) {
    return 0
  }

  let count = 0
  for (let index = 0; index < alivePlayers.length; index += 1) {
    const current = alivePlayers[index]
    const next = alivePlayers[(index + 1) % alivePlayers.length]
    if (current && next && current.alignment === 'evil' && next.alignment === 'evil') {
      count += 1
    }
  }

  return count
}

export function countAliveNeighborEvilPlayers(
  state: EngineState,
  playerId: string,
): number {
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex === -1) {
    return 0
  }

  const alivePlayers = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => isPlayerTrulyAlive(player))

  const aliveIndex = alivePlayers.findIndex(({ player }) => player.id === playerId)
  if (aliveIndex === -1 || alivePlayers.length <= 1) {
    return 0
  }

  const left = alivePlayers[(aliveIndex - 1 + alivePlayers.length) % alivePlayers.length]?.player
  const right = alivePlayers[(aliveIndex + 1) % alivePlayers.length]?.player

  const uniqueNeighbors = [left, right].filter(
    (candidate, index, array): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate) &&
      array.findIndex((entry) => entry?.id === candidate.id) === index,
  )

  return uniqueNeighbors.filter((neighbor) => neighbor.alignment === 'evil').length
}

export function getPlayerKilledAtNight(state: EngineState, playerId: string): boolean {
  for (let index = state.events.length - 1; index >= 0; index -= 1) {
    const event = state.events[index]

    if (isNightPhaseBoundaryEvent(event)) {
      break
    }

    if (
      event.type === 'player_died' &&
      event.intent.targetPlayerId === playerId &&
      (event.intent.phase === 'first_night' || event.intent.phase === 'other_night')
    ) {
      return true
    }
  }

  return false
}
