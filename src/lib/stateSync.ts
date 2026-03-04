import { isMalfunctioning } from './effects'
import { getCurrentRoleId, getCurrentTeam } from './identity'
import { EffectToAdd } from './roles/types'
import { GameState, PlayerState, generateId, isAlive } from './types'

function stripDerivedEffects(player: PlayerState): PlayerState {
  return {
    ...player,
    effects: player.effects.filter((effect) => {
      if (effect.type !== 'poisoned') return true
      const source = effect.data?.source
      return source !== 'no_dashii' && source !== 'vigormortis'
    }),
  }
}

function addEffect(
  additions: Record<string, EffectToAdd[]>,
  playerId: string,
  effect: EffectToAdd,
) {
  additions[playerId] = [...(additions[playerId] ?? []), effect]
}

function firstMatchingOnSide(
  state: GameState,
  originIndex: number,
  direction: -1 | 1,
  predicate: (player: PlayerState) => boolean,
): PlayerState | null {
  for (let step = 1; step < state.players.length; step++) {
    const index =
      (originIndex + direction * step + state.players.length) %
      state.players.length
    const candidate = state.players[index]
    if (predicate(candidate)) return candidate
  }
  return null
}

function findClosestAliveTownsfolkNeighbor(
  state: GameState,
  sourceId: string,
  preferredId?: string,
): string | null {
  const originIndex = state.players.findIndex((player) => player.id === sourceId)
  if (originIndex === -1) return null

  const isAliveTownsfolk = (player: PlayerState) =>
    isAlive(player) && getCurrentTeam(player) === 'townsfolk'

  if (preferredId) {
    const preferred = state.players.find((player) => player.id === preferredId)
    if (preferred && isAliveTownsfolk(preferred)) return preferredId
  }

  let leftDistance: number | null = null
  let rightDistance: number | null = null
  let leftPlayer: PlayerState | null = null
  let rightPlayer: PlayerState | null = null

  for (let step = 1; step < state.players.length; step++) {
    const leftIndex =
      (originIndex - step + state.players.length) % state.players.length
    const leftCandidate = state.players[leftIndex]
    if (leftDistance == null && isAliveTownsfolk(leftCandidate)) {
      leftDistance = step
      leftPlayer = leftCandidate
    }

    const rightIndex = (originIndex + step) % state.players.length
    const rightCandidate = state.players[rightIndex]
    if (rightDistance == null && isAliveTownsfolk(rightCandidate)) {
      rightDistance = step
      rightPlayer = rightCandidate
    }

    if (leftDistance != null && rightDistance != null) break
  }

  if (leftDistance == null && rightDistance == null) return null
  if (leftDistance == null) return rightPlayer?.id ?? null
  if (rightDistance == null) return leftPlayer?.id ?? null
  if (leftDistance < rightDistance) return leftPlayer?.id ?? null
  if (rightDistance < leftDistance) return rightPlayer?.id ?? null

  return preferredId ?? leftPlayer?.id ?? rightPlayer?.id ?? null
}

export function syncDerivedEffects(state: GameState): GameState {
  const cleanPlayers = state.players.map(stripDerivedEffects)
  const cleanState = { ...state, players: cleanPlayers }
  const additions: Record<string, EffectToAdd[]> = {}

  for (const player of cleanPlayers) {
    if (!isAlive(player) || isMalfunctioning(player)) continue

    if (getCurrentRoleId(player) === 'no_dashii') {
      const originIndex = cleanPlayers.findIndex(
        (candidate) => candidate.id === player.id,
      )
      if (originIndex !== -1) {
        const matchesTownsfolk = (candidate: PlayerState) =>
          candidate.id !== player.id &&
          getCurrentTeam(candidate) === 'townsfolk'

        const leftNeighbor = firstMatchingOnSide(
          cleanState,
          originIndex,
          -1,
          matchesTownsfolk,
        )
        const rightNeighbor = firstMatchingOnSide(
          cleanState,
          originIndex,
          1,
          matchesTownsfolk,
        )

        for (const neighbor of [leftNeighbor, rightNeighbor]) {
          if (!neighbor) continue
          addEffect(additions, neighbor.id, {
            type: 'poisoned',
            data: { source: 'no_dashii', demonId: player.id },
            sourcePlayerId: player.id,
            expiresAt: 'never',
          })
        }
      }
    }

    if (getCurrentRoleId(player) === 'vigormortis') {
      for (const deadMinion of cleanPlayers) {
        const marker = deadMinion.effects.find(
          (effect) => effect.type === 'vigormortis_killed',
        )
        if (!marker) continue

        const neighborId = findClosestAliveTownsfolkNeighbor(
          cleanState,
          deadMinion.id,
          marker.data?.chosenNeighborId as string | undefined,
        )
        if (!neighborId) continue

        addEffect(additions, neighborId, {
          type: 'poisoned',
          data: {
            source: 'vigormortis',
            demonId: player.id,
            minionId: deadMinion.id,
          },
          sourcePlayerId: player.id,
          expiresAt: 'never',
        })
      }
    }
  }

  if (Object.keys(additions).length === 0) return cleanState

  return {
    ...cleanState,
    players: cleanPlayers.map((player) => ({
      ...player,
      effects: [
        ...player.effects,
        ...(additions[player.id] ?? []).map((effect) => ({
          id: generateId(),
          type: effect.type,
          data: effect.data,
          sourcePlayerId: effect.sourcePlayerId,
          expiresAt: effect.expiresAt ?? 'never',
        })),
      ],
    })),
  }
}
