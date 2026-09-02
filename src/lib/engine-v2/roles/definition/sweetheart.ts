import type { EngineState } from '../../state'
import { createPlayerSelectionPromptIntent } from '../../storyteller'
import type { EngineRoleDefinition } from '../types'

function hasPendingSweetheartChoice(state: EngineState, playerId: string): boolean {
  return state.pendingStorytellerChoices.some(
    (choice) =>
      choice.sourcePlayerId === playerId &&
      choice.sourceRoleId === 'sweetheart' &&
      choice.title === 'Choose drunk player',
  )
}

export const sweetheartRole: EngineRoleDefinition = {
  id: 'sweetheart',
  roleTeam: 'outsider',
  getRoleTriggers: ({ player }) => [
    {
      id: `${player.id}:sweetheart-on-death`,
      event: 'onPlayerDied',
      scope: {
        subject: 'self',
      },
      when: ({ state, player: deadPlayer }) => !hasPendingSweetheartChoice(state, deadPlayer.id),
      handle: ({ state, player: deadPlayer }) =>
        createPlayerSelectionPromptIntent({
          id: `sweetheart:${deadPlayer.id}:drunk-choice:${deadPlayer.life.deathCount}`,
          resolutionMode: 'storyteller_arbitrary',
          title: 'Choose drunk player',
          message: `${deadPlayer.name} died. Choose which player becomes drunk.`,
          sourcePlayerId: deadPlayer.id,
          sourceRoleId: deadPlayer.roleId,
          candidatePlayerIds: state.players.map((candidate) => candidate.id),
          onResolve: [
            {
              kind: 'apply_status_effect_to_selected_player',
              effect: {
                type: 'drunk',
                sourcePlayerId: deadPlayer.id,
                sourceRoleId: deadPlayer.roleId,
                reason: 'Sweetheart made this player drunk.',
              },
            },
          ],
        }),
    },
  ],
}
