import {
  arbitraryBooleanPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { playersShareAlignment } from '../../roleHelpers'
import { getPlayer } from '../../state'
import type { EngineRoleDefinition } from '../types'

export const seamstressRole: EngineRoleDefinition = {
  id: 'seamstress',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'compare_alignments',
      actionKind: 'compare_alignments',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_constrained_falsehood',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (
      action.kind !== 'compare_alignments' ||
      typeof action.firstPlayerId !== 'string' ||
      typeof action.secondPlayerId !== 'string'
    ) {
      return state
    }

    if (
      action.firstPlayerId === player.id ||
      action.secondPlayerId === player.id ||
      action.firstPlayerId === action.secondPlayerId
    ) {
      return state
    }

    const first = getPlayer(state, action.firstPlayerId)
    const second = getPlayer(state, action.secondPlayerId)
    if (!first || !second) {
      return state
    }

    const sameAlignment = playersShareAlignment(state, first.id, second.id)

    return createInformationFlow<boolean>({
      id: `seamstress:${player.id}:${first.id}:${second.id}`,
      playerId: player.id,
      sourceRoleId: player.roleId,
      truthful: () => ({
        truth: sameAlignment,
        packet: {
          title: 'Seamstress',
          summary: `The chosen players are ${sameAlignment ? 'the same' : 'different'} alignment.`,
          fragments: [
            { kind: 'player', playerId: first.id },
            { kind: 'text', text: ' and ' },
            { kind: 'player', playerId: second.id },
            {
              kind: 'text',
              text: ` are ${sameAlignment ? 'the same' : 'different'} alignment.`,
            },
          ],
        },
      }),
      malfunctionPolicy: playerMalfunctionPolicy(
        state,
        player.id,
        arbitraryBooleanPolicy({
          promptTitle: 'Choose Seamstress result',
          promptMessage:
            'This ability is malfunctioning. Choose whether to show same or different alignment.',
          truthyLabel: 'Same alignment',
          falsyLabel: 'Different alignment',
          packet: {
            title: 'Seamstress',
            summary: 'Storyteller-selected malfunction result.',
            fragments: [
              { kind: 'player', playerId: first.id },
              { kind: 'text', text: ' and ' },
              { kind: 'player', playerId: second.id },
              { kind: 'text', text: ' are ' },
              { kind: 'selected_text' },
              { kind: 'text', text: ' alignment.' },
            ],
          },
        }),
      ),
    })
  },
}
