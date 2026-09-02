import { getAllRoles } from '../../../roles'
import {
  constrainedFalseRolePolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import type { EngineState } from '../../state'
import { clearPlayerNote, getPlayer, setPlayerNote } from '../../state'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRoleResult,
  EngineRoleTrigger,
  EngineRolePhaseTrigger,
} from '../types'

const EXECUTED_PLAYER_NOTE_KEY = 'undertakerExecutedPlayerId'
const EXECUTED_ROLE_NOTE_KEY = 'undertakerExecutedRoleId'

function getTrackedExecution(
  state: EngineState,
  playerId: string,
): { executedPlayerId: string; executedRoleId: string } | null {
  const undertaker = getPlayer(state, playerId)
  const executedPlayerId = undertaker?.notes?.[EXECUTED_PLAYER_NOTE_KEY]
  const executedRoleId = undertaker?.notes?.[EXECUTED_ROLE_NOTE_KEY]

  if (
    typeof executedPlayerId !== 'string' ||
    typeof executedRoleId !== 'string'
  ) {
    return null
  }

  return { executedPlayerId, executedRoleId }
}

function initializeTrackedExecutionFromDayState(
  state: EngineState,
  playerId: string,
): EngineState {
  if (
    state.day.execution.status !== 'resolved' ||
    typeof state.day.execution.executedPlayerId !== 'string'
  ) {
    let nextState = clearPlayerNote(state, playerId, EXECUTED_PLAYER_NOTE_KEY)
    nextState = clearPlayerNote(nextState, playerId, EXECUTED_ROLE_NOTE_KEY)
    return nextState
  }

  const executedPlayer = getPlayer(state, state.day.execution.executedPlayerId)
  if (!executedPlayer) {
    return state
  }

  let nextState = setPlayerNote(
    state,
    playerId,
    EXECUTED_PLAYER_NOTE_KEY,
    executedPlayer.id,
  )
  nextState = setPlayerNote(
    nextState,
    playerId,
    EXECUTED_ROLE_NOTE_KEY,
    executedPlayer.roleId,
  )
  return nextState
}

function getFallbackRoleIds(actualRoleId: string): string[] {
  return getAllRoles()
    .map((role) => role.id)
    .filter((roleId) => roleId !== actualRoleId)
}

function createUndertakerResult(
  state: EngineState,
  playerId: string,
  sourceRoleId: string,
  summary: string,
) {
  const tracked = getTrackedExecution(state, playerId)
  if (!tracked) {
    return state
  }

  const executedPlayer = getPlayer(state, tracked.executedPlayerId)
  if (!executedPlayer) {
    return state
  }

  return createInformationFlow<string>({
    id: `undertaker:${playerId}:${executedPlayer.id}:${summary}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: tracked.executedRoleId,
      packet: {
        title: 'Undertaker',
        summary,
        fragments: [
          { kind: 'player', playerId: executedPlayer.id },
          { kind: 'text', text: ' was ' },
          { kind: 'role', roleId: tracked.executedRoleId },
          { kind: 'text', text: '.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      constrainedFalseRolePolicy({
        promptTitle: 'Choose Undertaker result',
        promptMessage:
          'This ability is malfunctioning. Choose which role to show for the executed player.',
        candidateRoleIds: getFallbackRoleIds(tracked.executedRoleId),
        packet: {
          title: 'Undertaker',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'player', playerId: executedPlayer.id },
            { kind: 'text', text: ' was ' },
            { kind: 'selected_role' },
            { kind: 'text', text: '.' },
          ],
        },
      }),
    ),
  })
}

export const undertakerRole: EngineRoleDefinition = {
  id: 'undertaker',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: ({ state, player }) =>
    Boolean(getTrackedExecution(state, player.id)),
  abilityUsage: [
    {
      abilityId: 'learn_executed_role',
      actionKind: 'learn_executed_role',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_constrained_falsehood',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_executed_role') {
      return state
    }

    return createUndertakerResult(
      state,
      player.id,
      player.roleId,
      'This was the character of the executed player.',
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:undertaker-reset-on-day-start`,
      phases: ['day'],
      handle: ({ state, player: currentPlayer }) =>
        initializeTrackedExecutionFromDayState(state, currentPlayer.id),
    },
    {
      id: `${player.id}:undertaker-other-night`,
      phases: ['other_night'],
      when: ({ state, player: currentPlayer }) =>
        Boolean(getTrackedExecution(state, currentPlayer.id)),
      handle: ({ state, player: currentPlayer }) =>
        createUndertakerResult(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          'This was the character of the executed player.',
        ),
    },
  ],
  getRoleTriggers: ({ player }): EngineRoleTrigger[] => [
    {
      id: `${player.id}:undertaker-track-execution`,
      event: 'onExecutionResolved',
      scope: { subject: 'any' },
      when: (_ctx, occurrence) => occurrence.subject.kind === 'player',
      handle: ({ state, player: currentPlayer }, occurrence) => {
        if (occurrence.subject.kind !== 'player') {
          return state
        }

        let nextState = setPlayerNote(
          state,
          currentPlayer.id,
          EXECUTED_PLAYER_NOTE_KEY,
          occurrence.subject.playerId,
        )
        nextState = setPlayerNote(
          nextState,
          currentPlayer.id,
          EXECUTED_ROLE_NOTE_KEY,
          occurrence.subject.roleId ?? 'unknown',
        )
        return nextState
      },
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:undertaker-on-role-entered`,
      when: (_ctx, occurrence) =>
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'undertaker' &&
        occurrence.engineEvent.previousRoleId !== 'undertaker',
      handle: ({ state, player: currentPlayer }) => {
        const initialized = initializeTrackedExecutionFromDayState(
          state,
          currentPlayer.id,
        )

        if (
          state.phase === 'other_night' &&
          getTrackedExecution(initialized, currentPlayer.id)
        ) {
          const intent = createUndertakerResult(
            initialized,
            currentPlayer.id,
            currentPlayer.roleId,
            'You just became the Undertaker. This was the character of the executed player.',
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

          return intent as EngineRoleResult
        }

        return initialized
      },
    },
  ],
}
