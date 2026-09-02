import { countsAsAliveForWin } from '../../state'
import { createGameOutcomeProposalIntent } from '../../storyteller'
import type { EngineRoleDefinition } from '../types'
import { isRoleActive } from '../runtime'

function getAliveForWinCount(
  state: Parameters<NonNullable<EngineRoleDefinition['getRoleTriggers']>>[0]['state'],
): number {
  return state.players.filter((player) => countsAsAliveForWin(player)).length
}

export const mayorRole: EngineRoleDefinition = {
  id: 'mayor',
  roleTeam: 'townsfolk',
  getRoleTriggers: () => [
    {
      id: 'mayor:on-no-execution',
      event: 'onNoExecution',
      scope: {
        subject: 'phase',
      },
      when: ({ state, player }) =>
        isRoleActive(state, player.id) && getAliveForWinCount(state) === 3,
      handle: ({ player }) =>
        createGameOutcomeProposalIntent({
          title: 'Mayor peaceful victory triggered',
          message:
            'No execution happened today and only 3 players remain alive for win conditions while a living, sober Mayor is in play. End the game for good, or continue anyway?',
          winner: 'townsfolk',
          reason: 'No execution happened with exactly 3 players alive and the Mayor in play.',
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
        }),
    },
  ],
}
