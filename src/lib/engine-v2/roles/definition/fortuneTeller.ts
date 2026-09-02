import {
  arbitraryBooleanPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { getResolvedRoleTeam } from '../../roleHelpers'
import { getPlayer, isPlayerTrulyAlive } from '../../state'
import type { EngineRoleDefinition } from '../types'

export const fortuneTellerRole: EngineRoleDefinition = {
  id: 'fortune_teller',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'read_fortune',
      actionKind: 'read_fortune',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_constrained_falsehood',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (
      action.kind !== 'read_fortune' ||
      typeof action.firstPlayerId !== 'string' ||
      typeof action.secondPlayerId !== 'string'
    ) {
      return state
    }

    if (action.firstPlayerId === action.secondPlayerId) {
      return state
    }

    const first = getPlayer(state, action.firstPlayerId)
    const second = getPlayer(state, action.secondPlayerId)
    if (!first || !second || !isPlayerTrulyAlive(first) || !isPlayerTrulyAlive(second)) {
      return state
    }

    const seesDemon =
      getResolvedRoleTeam(first.roleId) === 'demon' ||
      getResolvedRoleTeam(second.roleId) === 'demon'

    return createInformationFlow<boolean>({
      id: `fortune_teller:${player.id}:${first.id}:${second.id}:truth`,
      playerId: player.id,
      sourceRoleId: player.roleId,
      truthful: () => ({
        truth: seesDemon,
        packet: {
          title: 'Fortune Teller',
          summary: seesDemon
            ? 'At least one chosen player registers as a Demon.'
            : 'Neither chosen player registers as a Demon.',
          fragments: [
            { kind: 'text', text: 'Among ' },
            { kind: 'player', playerId: first.id },
            { kind: 'text', text: ' and ' },
            { kind: 'player', playerId: second.id },
            { kind: 'text', text: ', the answer is ' },
            { kind: 'boolean', value: seesDemon },
            { kind: 'text', text: '.' },
          ],
        },
      }),
      malfunctionPolicy: playerMalfunctionPolicy(
        state,
        player.id,
        arbitraryBooleanPolicy({
          promptTitle: 'Choose Fortune Teller result',
          promptMessage:
            'This ability is malfunctioning. Choose whether to show yes or no for these two players.',
          truthyLabel: 'Yes',
          falsyLabel: 'No',
          packet: {
            title: 'Fortune Teller',
            summary: 'Storyteller-selected malfunction result.',
            fragments: [
              { kind: 'text', text: 'Among ' },
              { kind: 'player', playerId: first.id },
              { kind: 'text', text: ' and ' },
              { kind: 'player', playerId: second.id },
              { kind: 'text', text: ', the answer is ' },
              { kind: 'selected_boolean' },
              { kind: 'text', text: '.' },
            ],
          },
        }),
      ),
    })
  },
}
