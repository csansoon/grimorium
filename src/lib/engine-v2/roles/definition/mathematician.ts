import {
  arbitraryBoundedNumberPolicy,
  createInformationFlow,
} from './constrainedStorytellerInfo'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

function createMathematicianResult(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  return createInformationFlow<number>({
    id: `mathematician:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: 0,
      packet: {
        title: 'Mathematician',
        summary,
        fragments: [],
      },
    }),
    malfunctionPolicy: arbitraryBoundedNumberPolicy({
      promptTitle: 'Choose Mathematician result',
      promptMessage:
        'Choose how many players acted abnormally since dusk. This remains Storyteller-driven for now.',
      max: state.players.length,
      packet: {
        title: 'Mathematician',
        summary,
        fragments: [
          { kind: 'text', text: 'The Mathematician number is ' },
          { kind: 'selected_number' },
          { kind: 'text', text: '.' },
        ],
      },
    }),
  })
}

export const mathematicianRole: EngineRoleDefinition = {
  id: 'mathematician',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_abnormal_count',
      actionKind: 'learn_abnormal_count',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_abnormal_count') {
      return state
    }

    return createMathematicianResult(
      state,
      player.id,
      player.roleId,
      'Choose the number of players who acted abnormally since dusk.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:mathematician-nightly`,
      phases: ['other_night'],
      handle: ({ state, player: currentPlayer }) =>
        createMathematicianResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'Other-night Mathematician info: choose the number of players who acted abnormally since dusk.',
        ),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:mathematician-on-role-entered`,
      when: ({ state }, occurrence) =>
        state.phase === 'other_night' &&
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'mathematician' &&
        occurrence.engineEvent.previousRoleId !== 'mathematician',
      handle: ({ state, player: currentPlayer }) =>
        createMathematicianResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'You just became the Mathematician. Choose the number of players who acted abnormally since dusk.',
        ),
    },
  ],
}
