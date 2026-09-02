import type { EngineState } from './state'
import { resolveSpecialExecution } from './day'
import { runLethalIntent } from './runLethalIntent'
import type {
  ActiveMadness,
  EngineEvent,
  PendingMadnessConsequence,
  TriggerEvent,
} from './types'

let nextMadnessId = 1
let nextPendingMadnessConsequenceId = 1

export function createMadness(input: Omit<ActiveMadness, 'id'>): ActiveMadness {
  return {
    id: `madness-${nextMadnessId++}`,
    ...input,
  }
}

export function getActiveMadnessForPlayer(
  state: EngineState,
  playerId: string,
): ActiveMadness | undefined {
  return state.activeMadnesses.find((madness) => madness.targetPlayerId === playerId)
}

export function applyMadness(
  state: EngineState,
  madness: ActiveMadness,
): EngineState {
  const filtered = state.activeMadnesses.filter(
    (candidate) => candidate.targetPlayerId !== madness.targetPlayerId,
  )

  return {
    ...state,
    activeMadnesses: [...filtered, madness],
    events: [
      ...state.events,
      {
        type: 'madness_applied',
        madness,
      } satisfies EngineEvent,
    ],
  }
}

export function getPendingMadnessConsequence(
  state: EngineState,
  pendingId: string,
): PendingMadnessConsequence | undefined {
  return state.pendingMadnessConsequences.find((entry) => entry.id === pendingId)
}

export function addPendingMadnessConsequence(
  state: EngineState,
  consequence: Omit<PendingMadnessConsequence, 'id'>,
): EngineState {
  const entry: PendingMadnessConsequence = {
    id: `pending-madness-${nextPendingMadnessConsequenceId++}`,
    ...consequence,
  }

  return {
    ...state,
    pendingMadnessConsequences: [...state.pendingMadnessConsequences, entry],
    events: [
      ...state.events,
      {
        type: 'pending_madness_consequence_added',
        consequence: entry,
      } satisfies EngineEvent,
    ],
  }
}

export function clearPendingMadnessConsequence(
  state: EngineState,
  pendingId: string,
  reason?: string,
): EngineState {
  const consequence = getPendingMadnessConsequence(state, pendingId)
  if (!consequence) {
    return state
  }

  return {
    ...state,
    pendingMadnessConsequences: state.pendingMadnessConsequences.filter(
      (entry) => entry.id !== pendingId,
    ),
    events: [
      ...state.events,
      {
        type: 'pending_madness_consequence_cleared',
        consequence,
        reason,
      } satisfies EngineEvent,
    ],
  }
}

export function clearPendingMadnessConsequencesForPlayer(
  state: EngineState,
  playerId: string,
  reason?: string,
): EngineState {
  return state.pendingMadnessConsequences
    .filter((entry) => entry.targetPlayerId === playerId)
    .reduce((currentState, entry) => {
      return clearPendingMadnessConsequence(currentState, entry.id, reason)
    }, state)
}

export function clearMadness(
  state: EngineState,
  madnessId: string,
  reason?: string,
): EngineState {
  const madness = state.activeMadnesses.find((candidate) => candidate.id === madnessId)
  if (!madness) {
    return state
  }

  return {
    ...state,
    activeMadnesses: state.activeMadnesses.filter(
      (candidate) => candidate.id !== madnessId,
    ),
    events: [
      ...state.events,
      {
        type: 'madness_cleared',
        madness,
        reason,
      } satisfies EngineEvent,
    ],
  }
}

export function expireMadnesses(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const expired = state.activeMadnesses.filter((madness) =>
    madness.expiresAt ? shouldMatchSchedule(madness.expiresAt, triggerEvent) : false,
  )

  return expired.reduce((currentState, madness) => {
    return clearMadness(currentState, madness.id, 'Madness expired.')
  }, state)
}

export function breakMadness(
  state: EngineState,
  input: {
    playerId: string
    fallbackSourcePlayerId?: string
    fallbackSourceRoleId?: string
    fallbackReason: string
  },
): EngineState {
  const madness = getActiveMadnessForPlayer(state, input.playerId)
  const nextState = madness
    ? {
        ...state,
        activeMadnesses: state.activeMadnesses.filter(
          (candidate) => candidate.id !== madness.id,
        ),
        events: [
          ...state.events,
          {
            type: 'madness_broken',
            madness,
            reason: input.fallbackReason,
          } satisfies EngineEvent,
        ],
      }
    : state

  if (madness) {
    return addPendingMadnessConsequence(nextState, {
      targetPlayerId: input.playerId,
      claimRoleId: madness.claimRoleId,
      sourcePlayerId: madness.sourcePlayerId,
      sourceRoleId: madness.sourceRoleId,
      reason: input.fallbackReason,
      createdDuringPhase: nextState.phase,
    })
  }

  return addPendingMadnessConsequence(nextState, {
    targetPlayerId: input.playerId,
    sourcePlayerId: input.fallbackSourcePlayerId,
    sourceRoleId: input.fallbackSourceRoleId,
    reason: input.fallbackReason,
    createdDuringPhase: nextState.phase,
  })
}

export function resolvePendingMadnessConsequence(
  state: EngineState,
  input: {
    pendingId: string
    mode: 'execute' | 'kill' | 'dismiss'
  },
): EngineState {
  const pending = getPendingMadnessConsequence(state, input.pendingId)
  if (!pending) {
    return state
  }

  if (input.mode === 'dismiss') {
    return clearPendingMadnessConsequence(state, pending.id, 'Storyteller dismissed the madness consequence.')
  }

  if (input.mode === 'execute') {
    const resolved = resolveSpecialExecution(state, {
      executedPlayerId: pending.targetPlayerId,
      sourcePlayerId: pending.sourcePlayerId,
      reason: pending.reason,
    })
    return clearPendingMadnessConsequence(
      resolved,
      pending.id,
      'Madness consequence resolved as an execution.',
    )
  }

  const killed = runLethalIntent(state, {
    id: `madness-kill:${pending.id}`,
    kind: 'kill',
    sourcePlayerId: pending.sourcePlayerId ?? 'storyteller',
    targetPlayerId: pending.targetPlayerId,
    cause: 'storyteller_arbitrary',
    phase: state.phase,
    reason: pending.reason,
  })

  if (killed.resolved.outcome.kind !== 'dead') {
    return killed.state
  }

  return clearPendingMadnessConsequence(
    killed.state,
    pending.id,
    'Madness consequence resolved as a storyteller kill.',
  )
}

function shouldMatchSchedule(
  schedule: NonNullable<ActiveMadness['expiresAt']>,
  triggerEvent: TriggerEvent,
): boolean {
  if (schedule.mode === 'phase') {
    return triggerEvent.type === 'phase_started' && triggerEvent.phase === schedule.phase
  }

  return (
    triggerEvent.type === schedule.trigger &&
    (!schedule.playerId || schedule.playerId === triggerEvent.playerId)
  )
}
