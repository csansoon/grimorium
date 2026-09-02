import { addModifier, type EngineState } from '../../state'
import { registerTriggerAction } from '../../triggers'
import type { DefensiveModifier } from '../../types'
import type { EngineRoleDefinition } from '../types'

export const monkRole: EngineRoleDefinition = {
  id: 'monk',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'protect',
      actionKind: 'protect',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'fail_closed',
    },
  ],
  performAbility: ({ state, player }, action): EngineState => {
    if (action.kind !== 'protect' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    const modifierId = `monk:${player.id}:${action.targetPlayerId}:${state.events.length}`
    const nextState = addModifier(state, {
      id: modifierId,
      kind: 'attack_protection',
      sourcePlayerId: player.id,
      targetPlayerId: action.targetPlayerId,
      reason: 'Monk protection is active until dawn.',
    } satisfies DefensiveModifier)

    return registerTriggerAction(nextState, {
      label: `Clear Monk protection ${modifierId}`,
      trigger: {
        mode: 'phase',
        phase: 'dawn',
      },
      consumeWhen: 'on_fire',
      action: {
        kind: 'remove_modifier',
        modifierId,
      },
    })
  },
}
