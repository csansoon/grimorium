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

const MINION_NOMINATED_NOTE_KEY = 'townCrierMinionNominatedToday'

function hasMinionNominatedInCurrentDay(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
): boolean {
  return state.day.nominations.some((nomination) => {
    const nominator = getPlayer(state, nomination.nominatorId)
    return nominator ? getResolvedRoleTeam(nominator.roleId) === 'minion' : false
  })
}

function didTrackedMinionNominateToday(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
): boolean {
  return getPlayer(state, playerId)?.notes?.[MINION_NOMINATED_NOTE_KEY] === true
}

function createTownCrierResult(
  state: Parameters<NonNullable<EngineRoleDefinition['performAbility']>>[0]['state'],
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const minionNominated = didTrackedMinionNominateToday(state, playerId)

  return createInformationFlow<boolean>({
    id: `town-crier:${playerId}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: minionNominated,
      packet: {
        title: 'Town Crier',
        summary,
        fragments: [
          { kind: 'text', text: 'A Minion ' },
          { kind: 'boolean', value: minionNominated },
          { kind: 'text', text: ' nominated today.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      arbitraryBooleanPolicy({
        promptTitle: 'Choose Town Crier result',
        promptMessage:
          'This ability is malfunctioning. Choose whether to show that a Minion nominated today.',
        truthyLabel: 'Yes',
        falsyLabel: 'No',
        packet: {
          title: 'Town Crier',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'text', text: 'A Minion ' },
            { kind: 'selected_boolean' },
            { kind: 'text', text: ' nominated today.' },
          ],
        },
      }),
    ),
  })
}

export const townCrierRole: EngineRoleDefinition = {
  id: 'town_crier',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_minion_nominated',
      actionKind: 'learn_minion_nominated',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_arbitrary_info',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_minion_nominated') {
      return state
    }

    return createTownCrierResult(
      state,
      player.id,
      player.roleId,
      'This is whether a Minion nominated during the previous day.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:town-crier-reset-on-day-start`,
      phases: ['day'],
      handle: ({ state, player: currentPlayer }) =>
        clearPlayerNote(state, currentPlayer.id, MINION_NOMINATED_NOTE_KEY),
    },
    {
      id: `${player.id}:town-crier-other-night`,
      phases: ['other_night'],
      handle: ({ state, player: currentPlayer }) =>
        createTownCrierResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'Other-night Town Crier info: this is whether a Minion nominated during the previous day.',
        ),
    },
  ],
  getRoleTriggers: ({ player }): EngineRoleTrigger[] => [
    {
      id: `${player.id}:town-crier-track-minion-nomination`,
      event: 'onNominationStarted',
      scope: { subject: 'any' },
      when: ({ state }, occurrence) => {
        if (occurrence.subject.kind !== 'player') {
          return false
        }

        const nominator = getPlayer(state, occurrence.subject.playerId)
        return nominator ? getResolvedRoleTeam(nominator.roleId) === 'minion' : false
      },
      handle: ({ state, player: currentPlayer }) =>
        setPlayerNote(state, currentPlayer.id, MINION_NOMINATED_NOTE_KEY, true),
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:town-crier-on-role-entered`,
      when: (_ctx, occurrence) =>
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'town_crier' &&
        occurrence.engineEvent.previousRoleId !== 'town_crier',
      handle: ({ state, player: currentPlayer }) => {
        const initialized = hasMinionNominatedInCurrentDay(state)
          ? setPlayerNote(state, currentPlayer.id, MINION_NOMINATED_NOTE_KEY, true)
          : clearPlayerNote(state, currentPlayer.id, MINION_NOMINATED_NOTE_KEY)

        if (state.phase === 'other_night') {
          const intent = createTownCrierResult(
            initialized,
            currentPlayer.id,
            currentPlayer.roleId,
            'You just became the Town Crier. This is whether a Minion nominated during the previous day.',
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
