import { createLethalIntent } from '../../intents'
import type { EngineRoleDefinition } from '../types'

export const assassinRole: EngineRoleDefinition = {
  id: 'assassin',
  roleTeam: 'minion',
  abilityUsage: [
    {
      abilityId: 'assassinate',
      actionKind: 'assassinate',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'assassinate' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    return {
      id: `assassin:${player.id}:${action.targetPlayerId}:${state.events.length}`,
      kind: 'lethal',
      intent: createLethalIntent({
        kind: 'attack',
        sourcePlayerId: player.id,
        targetPlayerId: action.targetPlayerId,
        cause: 'role_ability',
        phase: state.phase,
        reason: 'Assassin kill bypasses all death prevention.',
        bypasses: ['all_defense'],
      }),
    }
  },
}
