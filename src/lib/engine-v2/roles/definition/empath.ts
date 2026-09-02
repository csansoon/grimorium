import {
  arbitraryBoundedNumberPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { countAliveNeighborEvilPlayers } from '../../roleHelpers'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

function createEmpathResult(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const evilNeighbors = countAliveNeighborEvilPlayers(state, playerId)

  return createInformationFlow<number>({
    id: `empath:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: evilNeighbors,
      packet: {
        title: 'Empath',
        summary,
        fragments: [
          { kind: 'text', text: 'You have ' },
          { kind: 'number', value: evilNeighbors },
          { kind: 'text', text: ' evil alive neighbors.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      arbitraryBoundedNumberPolicy({
        promptTitle: 'Choose Empath result',
        promptMessage:
          'This ability is malfunctioning. Choose how many evil alive neighbors to show.',
        max: 2,
        packet: {
          title: 'Empath',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'text', text: 'You have ' },
            { kind: 'selected_number' },
            { kind: 'text', text: ' evil alive neighbors.' },
          ],
        },
      }),
    ),
  })
}

export const empathRole: EngineRoleDefinition = {
  id: 'empath',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_evil_neighbors',
      actionKind: 'learn_evil_neighbors',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_evil_neighbors') {
      return state
    }

    return createEmpathResult(
      state,
      player.id,
      player.roleId,
      'This is the current number of evil alive neighbors.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:empath-nightly`,
      phases: ['first_night', 'other_night'],
      handle: ({ state, player: currentPlayer }) =>
        createEmpathResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          state.phase === 'first_night'
            ? 'First-night Empath info: this is the current number of evil alive neighbors.'
            : 'Other-night Empath info: this is the current number of evil alive neighbors.',
        ),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:empath-on-role-entered`,
      when: ({ state }, occurrence) =>
        (state.phase === 'first_night' || state.phase === 'other_night') &&
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'empath' &&
        occurrence.engineEvent.previousRoleId !== 'empath',
      handle: ({ state, player: currentPlayer }) =>
        createEmpathResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'You just became the Empath. This is the current number of evil alive neighbors.',
        ),
    },
  ],
}
