import {
  arbitraryBoundedNumberPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { countDeadEvilPlayers } from '../../roleHelpers'
import type { EngineState } from '../../state'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

function createOracleResult(
  state: EngineState,
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const count = countDeadEvilPlayers(state)

  return createInformationFlow<number>({
    id: `oracle:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: count,
      packet: {
        title: 'Oracle',
        summary,
        fragments: [
          { kind: 'text', text: 'There are ' },
          { kind: 'number', value: count },
          { kind: 'text', text: ' dead evil players.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      arbitraryBoundedNumberPolicy({
        promptTitle: 'Choose Oracle result',
        promptMessage:
          'This ability is malfunctioning. Choose how many dead evil players to show.',
        max: state.players.length,
        packet: {
          title: 'Oracle',
          summary,
          fragments: [
            { kind: 'text', text: 'There are ' },
            { kind: 'selected_number' },
            { kind: 'text', text: ' dead evil players.' },
          ],
        },
      }),
    ),
  })
}

export const oracleRole: EngineRoleDefinition = {
  id: 'oracle',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_dead_evil_count',
      actionKind: 'learn_dead_evil_count',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_dead_evil_count') {
      return state
    }

    return createOracleResult(
      state,
      player.id,
      player.roleId,
      'This is the current number of dead evil players.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:oracle-other-night`,
      phases: ['other_night'],
      handle: ({ state, player: currentPlayer }) =>
        createOracleResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'Other-night Oracle info: this is the current number of dead evil players.',
        ),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:oracle-on-role-entered`,
      when: ({ state }, occurrence) =>
        state.phase === 'other_night' &&
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'oracle' &&
        occurrence.engineEvent.previousRoleId !== 'oracle',
      handle: ({ state, player: currentPlayer }) =>
        createOracleResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'You just became the Oracle. This is the current number of dead evil players.',
        ),
    },
  ],
}
