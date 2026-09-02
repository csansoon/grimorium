import { breakMadness } from '../../madness'
import { isPlayerTrulyAlive } from '../../state'
import type { EngineRoleDefinition } from '../types'

export const mutantRole: EngineRoleDefinition = {
  id: 'mutant',
  roleTeam: 'outsider',
  abilityUsage: [
    {
      abilityId: 'break_madness',
      actionKind: 'break_madness',
      cadence: 'at_will',
      consumeWhen: 'on_success',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'fail_closed',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'break_madness') {
      return state
    }

    if (state.phase !== 'day' || !isPlayerTrulyAlive(player)) {
      return state
    }

    return breakMadness(state, {
      playerId: player.id,
      fallbackSourcePlayerId: player.id,
      fallbackSourceRoleId: player.roleId,
      fallbackReason: 'Mutant broke madness.',
    })
  },
}
