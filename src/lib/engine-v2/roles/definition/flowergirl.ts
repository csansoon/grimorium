import {
  arbitraryBooleanPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { getResolvedRoleTeam } from '../../roleHelpers'
import { clearPlayerNote, getPlayer, setPlayerNote } from '../../state'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRoleTrigger,
  EngineRolePhaseTrigger,
} from '../types'

const DEMON_VOTED_NOTE_KEY = 'flowergirlDemonVotedToday'

function hasDemonVotedInCurrentDay(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
): boolean {
  return state.day.nominations.some((nomination) => {
    const votedPlayerIds = [...nomination.votes, ...nomination.ghostVotes]
    return votedPlayerIds.some((playerId) => {
      const player = getPlayer(state, playerId)
      return player ? getResolvedRoleTeam(player.roleId) === 'demon' : false
    })
  })
}

function didTrackedDemonVoteToday(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
): boolean {
  return getPlayer(state, playerId)?.notes?.[DEMON_VOTED_NOTE_KEY] === true
}

function createFlowergirlResult(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const demonVoted = didTrackedDemonVoteToday(state, playerId)

  return createInformationFlow<boolean>({
    id: `flowergirl:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: demonVoted,
      packet: {
        title: 'Flowergirl',
        summary,
        fragments: [
          { kind: 'text', text: 'The Demon ' },
          { kind: 'boolean', value: demonVoted },
          { kind: 'text', text: ' voted today.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      arbitraryBooleanPolicy({
        promptTitle: 'Choose Flowergirl result',
        promptMessage:
          'This ability is malfunctioning. Choose whether to show that the Demon voted today.',
        truthyLabel: 'Yes',
        falsyLabel: 'No',
        packet: {
          title: 'Flowergirl',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'text', text: 'The Demon ' },
            { kind: 'selected_boolean' },
            { kind: 'text', text: ' voted today.' },
          ],
        },
      }),
    ),
  })
}

export const flowergirlRole: EngineRoleDefinition = {
  id: 'flowergirl',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_demon_voted',
      actionKind: 'learn_demon_voted',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_demon_voted') {
      return state
    }

    return createFlowergirlResult(
      state,
      player.id,
      player.roleId,
      'This is whether the Demon voted during the previous day.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:flowergirl-reset-on-day-start`,
      phases: ['day'],
      handle: ({ state, player: currentPlayer }) =>
        clearPlayerNote(state, currentPlayer.id, DEMON_VOTED_NOTE_KEY),
    },
    {
      id: `${player.id}:flowergirl-other-night`,
      phases: ['other_night'],
      handle: ({ state, player: currentPlayer }) =>
        createFlowergirlResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'Other-night Flowergirl info: this is whether the Demon voted during the previous day.',
        ),
    },
  ],
  getRoleTriggers: ({ player }): EngineRoleTrigger[] => [
    {
      id: `${player.id}:flowergirl-track-demon-vote`,
      event: 'onVoteCast',
      scope: { subject: 'any' },
      when: ({ state }, occurrence) => {
        if (occurrence.subject.kind !== 'player') {
          return false
        }

        const votedPlayer = getPlayer(state, occurrence.subject.playerId)
        return votedPlayer ? getResolvedRoleTeam(votedPlayer.roleId) === 'demon' : false
      },
      handle: ({ state, player: currentPlayer }) =>
        setPlayerNote(state, currentPlayer.id, DEMON_VOTED_NOTE_KEY, true),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:flowergirl-on-role-entered`,
      when: (_ctx, occurrence) =>
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'flowergirl' &&
        occurrence.engineEvent.previousRoleId !== 'flowergirl',
      handle: ({ state, player: currentPlayer }) => {
        const initialized = hasDemonVotedInCurrentDay(state)
          ? setPlayerNote(state, currentPlayer.id, DEMON_VOTED_NOTE_KEY, true)
          : clearPlayerNote(state, currentPlayer.id, DEMON_VOTED_NOTE_KEY)

        if (state.phase === 'other_night') {
          const intent = createFlowergirlResult(
            initialized,
            currentPlayer.id,
            currentPlayer.roleId,
            'You just became the Flowergirl. This is whether the Demon voted during the previous day.',
          )

          if (
            intent &&
            typeof intent === 'object' &&
            'kind' in intent &&
            'id' in intent
          ) {
            return {
              baseState: initialized,
              intents: [intent],
            }
          }

          return intent
        }

        return initialized
      },
    },
  ],
}
