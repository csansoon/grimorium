import {
  getPlayer,
  isPlayerTrulyAlive,
  updatePlayer,
  type EngineState,
} from '../../state'
import { createLethalIntent } from '../../intents'
import { hasStaticStatusEffect } from '../../derived'
import { runLethalIntent } from '../../runLethalIntent'
import {
  createAutomaticOutcomeNoticeIntent,
  createPlayerSelectionPromptIntent,
} from '../../storyteller'
import type { AbilityOverride, TimedStatusEffect } from '../../types'
import type { EngineRoleDefinition } from '../types'

const VIGORMORTIS_MARKER_KEY = 'vigormortisKilledMeta'
const MINION_ROLE_IDS = new Set(['assassin', 'witch'])
const TOWNSFOLK_ROLE_IDS = new Set([
  'clockmaker',
  'dreamer',
  'fool',
  'monk',
  'professor',
  'tea_lady',
])

type VigormortisMarker = {
  sourcePlayerId: string
  chosenNeighborId?: string
}

function isOperationalVigormortis(state: EngineState, playerId: string): boolean {
  const player = getPlayer(state, playerId)
  if (!player) return false

  return (
    isPlayerTrulyAlive(player) &&
    !hasStaticStatusEffect(state, playerId, 'poisoned') &&
    !hasStaticStatusEffect(state, playerId, 'drunk')
  )
}

function getMarker(player: ReturnType<typeof getPlayer>): VigormortisMarker | null {
  const value = player?.notes?.[VIGORMORTIS_MARKER_KEY]
  if (!value || typeof value !== 'object') return null

  const sourcePlayerId =
    'sourcePlayerId' in value && typeof value.sourcePlayerId === 'string'
      ? value.sourcePlayerId
      : null

  if (!sourcePlayerId) return null

  const chosenNeighborId =
    'chosenNeighborId' in value && typeof value.chosenNeighborId === 'string'
      ? value.chosenNeighborId
      : undefined

  return { sourcePlayerId, chosenNeighborId }
}

function getClosestAliveTownsfolkNeighbors(
  state: EngineState,
  sourceId: string,
  preferredNeighborId?: string,
): { resolvedNeighborId: string | null; tiedNeighborIds: string[] } {
  const sourceIndex = state.players.findIndex((player) => player.id === sourceId)
  if (sourceIndex === -1) {
    return { resolvedNeighborId: null, tiedNeighborIds: [] }
  }

  const matchesTownsfolk = (playerId: string) => {
    const candidate = getPlayer(state, playerId)
    return (
      !!candidate &&
      isPlayerTrulyAlive(candidate) &&
      TOWNSFOLK_ROLE_IDS.has(candidate.roleId)
    )
  }

  if (preferredNeighborId && matchesTownsfolk(preferredNeighborId)) {
    return { resolvedNeighborId: preferredNeighborId, tiedNeighborIds: [] }
  }

  let leftDistance: number | null = null
  let rightDistance: number | null = null
  let leftPlayerId: string | null = null
  let rightPlayerId: string | null = null

  for (let step = 1; step < state.players.length; step += 1) {
    const leftIndex = (sourceIndex - step + state.players.length) % state.players.length
    const leftCandidate = state.players[leftIndex]
    if (leftDistance == null && matchesTownsfolk(leftCandidate.id)) {
      leftDistance = step
      leftPlayerId = leftCandidate.id
    }

    const rightIndex = (sourceIndex + step) % state.players.length
    const rightCandidate = state.players[rightIndex]
    if (rightDistance == null && matchesTownsfolk(rightCandidate.id)) {
      rightDistance = step
      rightPlayerId = rightCandidate.id
    }

    if (leftDistance != null && rightDistance != null) {
      break
    }
  }

  if (leftDistance == null && rightDistance == null) {
    return { resolvedNeighborId: null, tiedNeighborIds: [] }
  }

  if (leftDistance == null) {
    return { resolvedNeighborId: rightPlayerId, tiedNeighborIds: [] }
  }

  if (rightDistance == null) {
    return { resolvedNeighborId: leftPlayerId, tiedNeighborIds: [] }
  }

  if (leftDistance === rightDistance && leftPlayerId && rightPlayerId) {
    return {
      resolvedNeighborId: null,
      tiedNeighborIds: [leftPlayerId, rightPlayerId],
    }
  }

  return {
    resolvedNeighborId:
      leftDistance < rightDistance ? leftPlayerId : rightPlayerId,
    tiedNeighborIds: [],
  }
}

export const vigormortisRole: EngineRoleDefinition = {
  id: 'vigormortis',
  roleTeam: 'demon',
  abilityUsage: [
    {
      abilityId: 'kill',
      actionKind: 'kill',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  getDynamicAbilityOverrides: ({ state, player }) => {
    if (!isOperationalVigormortis(state, player.id)) {
      return []
    }

    return state.players.flatMap((candidate) => {
      const marker = getMarker(candidate)
      if (
        !marker ||
        marker.sourcePlayerId !== player.id ||
        isPlayerTrulyAlive(candidate) ||
        !MINION_ROLE_IDS.has(candidate.roleId)
      ) {
        return []
      }

      return [
        {
          id: `vigormortis:${player.id}:${candidate.id}:dead-use`,
          playerId: candidate.id,
          allowWhileDead: true,
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
          reason: 'Dead minion keeps their ability while Vigormortis lives and is sober.',
        } satisfies AbilityOverride,
      ]
    })
  },
  getDynamicStatusEffects: ({ state, player }) => {
    if (!isOperationalVigormortis(state, player.id)) {
      return []
    }

    return state.players.flatMap((candidate) => {
      const marker = getMarker(candidate)
      if (
        !marker ||
        marker.sourcePlayerId !== player.id ||
        isPlayerTrulyAlive(candidate) ||
        !MINION_ROLE_IDS.has(candidate.roleId)
      ) {
        return []
      }

      const { resolvedNeighborId: neighborId } = getClosestAliveTownsfolkNeighbors(
        state,
        candidate.id,
        marker.chosenNeighborId,
      )

      if (!neighborId) {
        return []
      }

      return [
        {
          id: `vigormortis:${player.id}:${candidate.id}:${neighborId}:poisoned`,
          type: 'poisoned',
          targetPlayerId: neighborId,
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
          reason: 'Nearest alive Townsfolk neighbor is poisoned by a Vigormortis-killed minion.',
        } satisfies TimedStatusEffect,
      ]
    })
  },
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'kill' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target) {
      return state
    }

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'kill',
        sourcePlayerId: player.id,
        targetPlayerId: action.targetPlayerId,
        cause: 'demon_attack',
        phase: state.phase,
        reason: 'Vigormortis kill',
      }),
    ).state

    const resolvedTarget = getPlayer(result, action.targetPlayerId)
    if (
      !resolvedTarget ||
      isPlayerTrulyAlive(resolvedTarget) ||
      !MINION_ROLE_IDS.has(target.roleId)
    ) {
      return result
    }

    const chosenNeighborId =
      typeof action.chosenNeighborId === 'string' ? action.chosenNeighborId : undefined

    let nextState = updatePlayer(result, resolvedTarget.id, (currentPlayer) => ({
      ...currentPlayer,
      notes: {
        ...(currentPlayer.notes ?? {}),
        [VIGORMORTIS_MARKER_KEY]: {
          sourcePlayerId: player.id,
          chosenNeighborId,
        } satisfies VigormortisMarker,
      },
    }))

    const targetName = resolvedTarget.name
    const { resolvedNeighborId, tiedNeighborIds } = getClosestAliveTownsfolkNeighbors(
      nextState,
      resolvedTarget.id,
      chosenNeighborId,
    )

    if (tiedNeighborIds.length > 0) {
      return {
        baseState: nextState,
        intents: [
          createPlayerSelectionPromptIntent({
            id: `vigormortis:${player.id}:${resolvedTarget.id}:neighbor-choice`,
            resolutionMode: 'choice_required',
            title: 'Choose poisoned neighbor',
            message: `${targetName} was killed by Vigormortis. Choose which tied alive Townsfolk neighbor becomes poisoned.`,
            sourcePlayerId: player.id,
            sourceRoleId: player.roleId,
            candidatePlayerIds: tiedNeighborIds,
            minSelections: 1,
            maxSelections: 1,
            onResolve: [
              {
                kind: 'set_note_object_field_to_selected_player',
                playerId: resolvedTarget.id,
                key: VIGORMORTIS_MARKER_KEY,
                field: 'chosenNeighborId',
              },
            ],
          }),
        ],
      }
    }

    if (resolvedNeighborId) {
      const neighbor = getPlayer(nextState, resolvedNeighborId)
      if (neighbor && !chosenNeighborId) {
        return {
          baseState: nextState,
          intents: [
            createAutomaticOutcomeNoticeIntent({
              id: `vigormortis:${player.id}:${resolvedTarget.id}:${neighbor.id}:auto-poison`,
              title: 'Nearest neighbor poisoned',
              message: `${neighbor.name} is the nearest alive Townsfolk neighbor to ${targetName} and is now poisoned.`,
              playerIds: [resolvedTarget.id, neighbor.id],
              sourcePlayerId: player.id,
              sourceRoleId: player.roleId,
            }),
          ],
        }
      }
    }

    return nextState
  },
}
