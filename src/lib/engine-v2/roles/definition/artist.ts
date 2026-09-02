import {
  arbitraryBooleanPolicy,
  createInformationFlow,
} from './constrainedStorytellerInfo'
import type { EngineRoleDefinition } from '../types'

export const artistRole: EngineRoleDefinition = {
  id: 'artist',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'ask_question',
      actionKind: 'ask_question',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'ask_question') {
      return state
    }

    const question =
      typeof action.question === 'string' && action.question.trim().length > 0
        ? action.question.trim()
        : 'Artist question'

    return createInformationFlow<boolean>({
      id: `artist:${player.id}:${question}`,
      playerId: player.id,
      sourceRoleId: player.roleId,
      truthful: () => ({
        truth: true,
        packet: {
          title: 'Artist',
          summary: question,
          fragments: [],
        },
      }),
      malfunctionPolicy: arbitraryBooleanPolicy({
        promptTitle: 'Choose Artist answer',
        promptMessage: question,
        truthyLabel: 'Yes',
        falsyLabel: 'No',
        packet: {
          title: 'Artist',
          summary: question,
          fragments: [{ kind: 'selected_boolean' }],
        },
      }),
    })
  },
}
