import { createStorytellerChoiceIntent } from '../../intents'
import { getPlayer, setPlayerNote, type EngineState } from '../../state'
import type { EngineRoleCompositeResult, EngineRoleDefinition } from '../types'

const KLUTZ_PENDING_NOTE_KEY = 'klutzChoicePending'
const KLUTZ_QUEUED_NOTE_KEY = 'klutzChoiceQueued'
const KLUTZ_SELECTED_TARGET_NOTE_KEY = 'klutzSelectedTargetId'

function hasTruthyNote(state: EngineState, playerId: string, key: string): boolean {
  return getPlayer(state, playerId)?.notes?.[key] === true
}

function hasAnyNoteValue(state: EngineState, playerId: string, key: string): boolean {
  return getPlayer(state, playerId)?.notes?.[key] != null
}

function getAliveCandidateIds(state: EngineState, playerId: string): string[] {
  return state.players
    .filter(
      (candidate) =>
        candidate.id !== playerId && candidate.life.projection.publicState === 'alive',
    )
    .map((candidate) => candidate.id)
}

function getCandidateLabels(
  state: EngineState,
  playerIds: string[],
): Record<string, string> {
  return Object.fromEntries(
    playerIds.map((playerId) => [playerId, getPlayer(state, playerId)?.name ?? playerId]),
  )
}

function queueKlutzChoice(
  state: EngineState,
  playerId: string,
  sourceRoleId: string,
): EngineState | EngineRoleCompositeResult {
  if (
    !hasTruthyNote(state, playerId, KLUTZ_PENDING_NOTE_KEY) ||
    hasTruthyNote(state, playerId, KLUTZ_QUEUED_NOTE_KEY)
  ) {
    return state
  }

  const candidatePlayerIds = getAliveCandidateIds(state, playerId)
  if (candidatePlayerIds.length === 0) {
    return state
  }

  const baseState = setPlayerNote(state, playerId, KLUTZ_QUEUED_NOTE_KEY, true)

  return {
    baseState,
    intents: [
      createStorytellerChoiceIntent({
        id: `klutz:${playerId}:resolve-choice`,
        resolutionMode: 'choice_required',
        title: 'Resolve Klutz choice',
        message: 'Record which alive player the Klutz publicly chose.',
        sourcePlayerId: playerId,
        sourceRoleId,
        candidatePlayerIds,
        candidateLabels: getCandidateLabels(baseState, candidatePlayerIds),
        onResolve: [
          {
            kind: 'set_note_selected_player',
            playerId,
            key: KLUTZ_SELECTED_TARGET_NOTE_KEY,
          },
          {
            kind: 'clear_note',
            playerId,
            key: KLUTZ_PENDING_NOTE_KEY,
          },
          {
            kind: 'clear_note',
            playerId,
            key: KLUTZ_QUEUED_NOTE_KEY,
          },
          {
            kind: 'propose_game_outcome_if_selected_player_alignment',
            alignments: ['evil'],
            winner: 'demon',
            title: 'Klutz selected an evil player',
            message:
              'Klutz publicly chose an evil player. End the game for evil, or continue anyway?',
            reason: 'Klutz publicly chose an evil player.',
            sourcePlayerId: playerId,
            sourceRoleId,
          },
        ],
      }),
    ],
  }
}

export const klutzRole: EngineRoleDefinition = {
  id: 'klutz',
  roleTeam: 'outsider',
  getRoleTriggers: ({ player }) => [
    {
      id: `${player.id}:klutz-mark-pending-on-death`,
      event: 'onPlayerDied',
      scope: { subject: 'self' },
      malfunctionPolicy: 'fail_closed',
      when: ({ state }) =>
        !hasTruthyNote(state, player.id, KLUTZ_PENDING_NOTE_KEY) &&
        !hasAnyNoteValue(state, player.id, KLUTZ_SELECTED_TARGET_NOTE_KEY),
      handle: ({ state, player: currentPlayer }) =>
        setPlayerNote(state, currentPlayer.id, KLUTZ_PENDING_NOTE_KEY, true),
    },
    {
      id: `${player.id}:klutz-immediate-day-death`,
      event: 'onPlayerDied',
      scope: { subject: 'self' },
      when: ({ state }, occurrence) =>
        occurrence.subject.kind === 'player' &&
        occurrence.subject.phase === 'day' &&
        hasTruthyNote(state, player.id, KLUTZ_PENDING_NOTE_KEY) &&
        !hasTruthyNote(state, player.id, KLUTZ_QUEUED_NOTE_KEY),
      handle: ({ state, player: currentPlayer }) =>
        queueKlutzChoice(state, currentPlayer.id, currentPlayer.roleId),
    },
    {
      id: `${player.id}:klutz-immediate-execution`,
      event: 'onPlayerExecuted',
      scope: { subject: 'self' },
      when: ({ state }) =>
        hasTruthyNote(state, player.id, KLUTZ_PENDING_NOTE_KEY) &&
        !hasTruthyNote(state, player.id, KLUTZ_QUEUED_NOTE_KEY),
      handle: ({ state, player: currentPlayer }) =>
        queueKlutzChoice(state, currentPlayer.id, currentPlayer.roleId),
    },
    {
      id: `${player.id}:klutz-next-day-follow-up`,
      event: 'onDayStarted',
      scope: { subject: 'phase', phases: ['day'] },
      when: ({ state }) =>
        hasTruthyNote(state, player.id, KLUTZ_PENDING_NOTE_KEY) &&
        !hasTruthyNote(state, player.id, KLUTZ_QUEUED_NOTE_KEY),
      handle: ({ state, player: currentPlayer }) =>
        queueKlutzChoice(state, currentPlayer.id, currentPlayer.roleId),
    },
  ],
}
