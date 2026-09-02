import { expireTimedStatusEffects, releaseScheduledStatusEffects } from './effects'
import { expireMadnesses } from './madness'
import { processAftermath } from './aftermath'
import { commitResolvedLethal } from './commit'
import { processRoleTriggerEvent } from './roleTriggers'
import { resolveLethalIntent } from './resolution'
import type { EngineState } from './state'
import { releaseTriggerRegistrations } from './triggers'
import type {
  EngineEvent,
  EnginePhase,
  ScheduledLethalIntent,
  TriggerEvent,
} from './types'

let nextScheduledIntentId = 1

function isNightPhase(phase: EnginePhase): boolean {
  return phase === 'first_night' || phase === 'other_night'
}

export function scheduleLethalIntent(
  state: EngineState,
  scheduledIntent: Omit<ScheduledLethalIntent, 'id'>,
): EngineState {
  const record: ScheduledLethalIntent = {
    id: `scheduled-intent-${nextScheduledIntentId++}`,
    ...scheduledIntent,
  }

  return {
    ...state,
    scheduledIntents: [...state.scheduledIntents, record],
    events: [
      ...state.events,
      {
        type: 'intent_scheduled',
        scheduledIntent: record,
      } satisfies EngineEvent,
    ],
  }
}

export function setEnginePhase(
  state: EngineState,
  phase: EnginePhase,
): EngineState {
  const phaseEvent: TriggerEvent = {
    type: 'phase_started',
    phase,
  }

  const enteringNewNight = isNightPhase(phase) && !isNightPhase(state.phase)
  const phaseState = {
    ...state,
    phase,
    nightSequence: enteringNewNight ? state.nightSequence + 1 : state.nightSequence,
    events: [
      ...state.events,
      { type: 'phase_changed', phase } satisfies EngineEvent,
    ],
  }

  const triggerState = processRoleTriggerEvent(phaseState, phaseEvent)

  return expireTimedStatusEffects(
    expireMadnesses(
      releaseTriggerRegistrations(
        releaseScheduledIntents(
          releaseScheduledStatusEffects(triggerState, phaseEvent),
          phaseEvent,
        ),
        phaseEvent,
      ),
      phaseEvent,
    ),
    phaseEvent,
  )
}

export function recordTriggerEvent(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const triggerState = processRoleTriggerEvent({
    ...state,
    events: [
      ...state.events,
      { type: 'trigger_recorded', triggerEvent } satisfies EngineEvent,
    ],
  }, triggerEvent)

  return expireTimedStatusEffects(
    expireMadnesses(
      releaseTriggerRegistrations(
        releaseScheduledIntents(
          releaseScheduledStatusEffects(triggerState, triggerEvent),
          triggerEvent,
        ),
        triggerEvent,
      ),
      triggerEvent,
    ),
    triggerEvent,
  )
}

function releaseScheduledIntents(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const released = state.scheduledIntents.filter((scheduledIntent) =>
    shouldReleaseScheduledIntent(scheduledIntent, triggerEvent),
  )
  const remaining = state.scheduledIntents.filter(
    (scheduledIntent) => !released.some((candidate) => candidate.id === scheduledIntent.id),
  )

  let nextState: EngineState = {
    ...state,
    scheduledIntents: remaining,
  }

  for (const scheduledIntent of released) {
    nextState = {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'scheduled_intent_released',
          scheduledIntent,
          triggerEvent,
        } satisfies EngineEvent,
      ],
    }

    const resolved = resolveLethalIntent(nextState, scheduledIntent.intent)
    const committed = commitResolvedLethal(nextState, resolved)
    const aftermath = processAftermath(committed.state, committed.emittedEvents)
    nextState = {
      ...aftermath.state,
      lastResolutionTrace: {
        intent: resolved.intent,
        defenses: resolved.applicableDefenses,
        outcome: resolved.outcome,
        committedEvents: committed.emittedEvents,
        aftermathEvents: aftermath.emittedEvents,
      },
    }
  }

  return nextState
}

function shouldReleaseScheduledIntent(
  scheduledIntent: ScheduledLethalIntent,
  triggerEvent: TriggerEvent,
): boolean {
  if (scheduledIntent.scheduledFor.mode === 'phase') {
    return triggerEvent.type === 'phase_started' &&
      triggerEvent.phase === scheduledIntent.scheduledFor.phase
  }

  return triggerEvent.type === scheduledIntent.scheduledFor.trigger &&
    (!scheduledIntent.scheduledFor.playerId ||
      scheduledIntent.scheduledFor.playerId === triggerEvent.playerId)
}
