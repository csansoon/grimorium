import { cloneEngineState, type EngineState } from './state'
import { revivePlayer, type RevivePlayerOptions } from './revive'
import { runLethalIntent } from './runLethalIntent'
import type {
  EngineEvent,
  ResolutionBundle,
  ResolutionBundleFollowUp,
  ResolutionBundleParticipantOperation,
} from './types'

export type ResolutionBundleResult = {
  state: EngineState
}

export function runResolutionBundle(
  state: EngineState,
  bundle: ResolutionBundle,
): ResolutionBundleResult {
  let nextState = cloneEngineState(state)

  nextState = {
    ...nextState,
    events: [
      ...nextState.events,
      {
        type: 'bundle_started',
        bundleId: bundle.id,
        label: bundle.label,
        sourcePlayerId: bundle.sourcePlayerId,
        sourceRoleId: bundle.sourceRoleId,
      } satisfies EngineEvent,
    ],
  }

  for (const participant of bundle.participants) {
    nextState = applyBundleOperation(nextState, participant.operation)
    nextState = {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'bundle_participant_resolved',
          bundleId: bundle.id,
          participantId: participant.id,
          playerId: participant.playerId,
          operation: participant.operation.kind,
        } satisfies EngineEvent,
      ],
    }
  }

  const followUps = bundle.evaluateFollowUps?.(nextState) ?? []
  for (const followUp of followUps) {
    nextState = {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'bundle_follow_up_enqueued',
          bundleId: bundle.id,
          followUp: followUp.kind,
          targetPlayerId:
            followUp.kind === 'lethal_intent' ? followUp.intent.targetPlayerId : followUp.targetPlayerId,
        } satisfies EngineEvent,
      ],
    }
    nextState = applyFollowUp(nextState, followUp)
  }

  nextState = {
    ...nextState,
    events: [
      ...nextState.events,
      {
        type: 'bundle_completed',
        bundleId: bundle.id,
      } satisfies EngineEvent,
    ],
  }

  return { state: nextState }
}

function applyBundleOperation(
  state: EngineState,
  operation: ResolutionBundleParticipantOperation,
): EngineState {
  if (operation.kind === 'none') {
    return state
  }

  if (operation.kind === 'lethal_intent') {
    return runLethalIntent(state, operation.intent).state
  }

  return revivePlayer(state, toReviveOptions(operation))
}

function applyFollowUp(
  state: EngineState,
  followUp: ResolutionBundleFollowUp,
): EngineState {
  if (followUp.kind === 'lethal_intent') {
    return runLethalIntent(state, followUp.intent).state
  }

  return revivePlayer(state, toReviveOptions(followUp))
}

function toReviveOptions(
  input: Extract<ResolutionBundleParticipantOperation, { kind: 'revive' }> | Extract<ResolutionBundleFollowUp, { kind: 'revive' }>,
): RevivePlayerOptions {
  return {
    targetPlayerId: input.targetPlayerId,
    sourcePlayerId: input.sourcePlayerId,
    sourceRoleId: input.sourceRoleId,
    reason: input.reason,
    clearStatusEffects: input.clearStatusEffects,
    clearTargetModifiers: input.clearTargetModifiers,
  }
}
