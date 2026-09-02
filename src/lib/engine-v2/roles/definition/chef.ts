import {
  arbitraryBoundedNumberPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { countEvilPairs } from '../../roleHelpers'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

function createChefResult(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const evilPairs = countEvilPairs(state)

  return createInformationFlow<number>({
    id: `chef:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: evilPairs,
      packet: {
        title: 'Chef',
        summary,
        fragments: [
          { kind: 'text', text: 'There are ' },
          { kind: 'number', value: evilPairs },
          { kind: 'text', text: ' pairs of evil players.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      arbitraryBoundedNumberPolicy({
        promptTitle: 'Choose Chef result',
        promptMessage:
          'This ability is malfunctioning. Choose how many evil pairs to show.',
        max: state.players.length,
        packet: {
          title: 'Chef',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'text', text: 'There are ' },
            { kind: 'selected_number' },
            { kind: 'text', text: ' pairs of evil players.' },
          ],
        },
      }),
    ),
  })
}

export const chefRole: EngineRoleDefinition = {
  id: 'chef',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_evil_pairs',
      actionKind: 'learn_evil_pairs',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_evil_pairs') {
      return state
    }

    return createChefResult(
      state,
      player.id,
      player.roleId,
      'This is the current number of adjacent evil pairs.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:chef-first-night`,
      phases: ['first_night'],
      handle: ({ state, player: currentPlayer }) =>
        createChefResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'First-night Chef setup: this is the current number of adjacent evil pairs.',
        ),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:chef-on-role-entered`,
      when: ({ state }, occurrence) =>
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'chef' &&
        occurrence.engineEvent.previousRoleId !== 'chef' &&
        state.phase === 'first_night',
      handle: ({ state, player: currentPlayer }) =>
        createChefResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'You just became the Chef. This is the current number of adjacent evil pairs.',
        ),
    },
  ],
}
