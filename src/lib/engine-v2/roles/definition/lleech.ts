import { getPlayer, updatePlayer, type EngineState } from '../../state'
import type { ConditionalImmortalityModifier } from '../../types'
import type { EngineRoleDefinition } from '../types'
import { isRoleActive } from '../runtime'

const HOST_NOTE_KEY = 'lleechHostPlayerId'

export const lleechRole: EngineRoleDefinition = {
  id: 'lleech',
  roleTeam: 'demon',
  getDynamicModifiers: ({ state, player }) => {
    if (!isRoleActive(state, player.id)) {
      return []
    }

    const hostPlayerId =
      typeof player.notes?.[HOST_NOTE_KEY] === 'string'
        ? player.notes[HOST_NOTE_KEY]
        : null

    if (!hostPlayerId) {
      return []
    }

    return [
      {
        id: `lleech:${player.id}:host-lock`,
        kind: 'conditional_immortality',
        targetPlayerId: player.id,
        reason: 'The Lleech cannot die while its host lives.',
        appliesWhen: ({ state: currentState }) =>
          getPlayer(currentState, hostPlayerId)?.life.projection.trueState === 'alive',
      } satisfies ConditionalImmortalityModifier,
    ]
  },
  performAbility: ({ state, player }, action): EngineState => {
    if (!isRoleActive(state, player.id)) {
      return state
    }

    if (action.kind !== 'bind_host' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    return updatePlayer(state, player.id, (currentPlayer) => ({
      ...currentPlayer,
      notes: {
        ...(currentPlayer.notes ?? {}),
        [HOST_NOTE_KEY]: action.targetPlayerId,
      },
    }))
  },
}
