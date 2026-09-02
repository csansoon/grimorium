import { getPlayer, isPlayerTrulyAlive } from '../../state'
import { createLethalIntent } from '../../intents'
import { createGameOutcomeProposalIntent } from '../../storyteller'
import type { EngineRoleDefinition } from '../types'
import { isRoleActive } from '../runtime'

export const vortoxRole: EngineRoleDefinition = {
  id: 'vortox',
  roleTeam: 'demon',
  abilityUsage: [
    {
      abilityId: 'kill',
      actionKind: 'kill',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'fail_closed',
    },
  ],
  getRoleTriggers: () => [
    {
      id: 'vortox:on-no-execution',
      event: 'onNoExecution',
      scope: {
        subject: 'phase',
      },
      when: ({ state, player }) => isRoleActive(state, player.id),
      handle: ({ player }) =>
        createGameOutcomeProposalIntent({
          title: 'Vortox win condition triggered',
          message:
            'No execution happened today while a living, sober Vortox was in play. End the game for evil, or continue anyway?',
          winner: 'demon',
          reason: 'No execution happened while Vortox was in play.',
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
        }),
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'kill' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    if (!isRoleActive(state, player.id) || action.targetPlayerId === player.id) {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || !isPlayerTrulyAlive(target)) {
      return state
    }

    return {
      id: `vortox:${player.id}:${target.id}:${state.events.length}`,
      kind: 'lethal',
      intent: createLethalIntent({
        kind: 'kill',
        sourcePlayerId: player.id,
        targetPlayerId: target.id,
        cause: 'demon_attack',
        phase: state.phase,
        reason: 'Vortox attack',
      }),
    }
  },
}
