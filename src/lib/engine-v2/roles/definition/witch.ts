import { registerTriggerAction } from '../../triggers'
import { createLethalIntent } from '../../intents'
import type { EngineRoleDefinition } from '../types'

export const witchRole: EngineRoleDefinition = {
  id: 'witch',
  roleTeam: 'minion',
  abilityUsage: [
    {
      abilityId: 'curse',
      actionKind: 'curse',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'curse' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    return registerTriggerAction(state, {
      label: `Witch curse on ${action.targetPlayerId}`,
      trigger: {
        mode: 'event',
        trigger: 'nomination_started',
        playerId: action.targetPlayerId,
      },
      consumeWhen: 'on_fire',
      expiresAt: {
        mode: 'phase',
        phase: 'other_night',
      },
      action: {
        kind: 'lethal_intent',
        intent: createLethalIntent({
          kind: 'kill',
          sourcePlayerId: player.id,
          targetPlayerId: action.targetPlayerId,
          cause: 'curse',
          phase: state.phase,
          reason: 'Witch curse resolves on nomination.',
        }),
      },
    })
  },
}
