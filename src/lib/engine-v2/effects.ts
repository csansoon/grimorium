import type { EngineEvent, EnginePhase, ScheduledStatusEffect, TimedStatusEffect, TriggerEvent } from './types'
import type { EngineState } from './state'

let nextScheduledEffectId = 1
let nextEffectId = 1

export function createTimedStatusEffect(input: Omit<TimedStatusEffect, 'id'>): TimedStatusEffect {
  return {
    id: `status-effect-${nextEffectId++}`,
    ...input,
  }
}

export function scheduleStatusEffect(
  state: EngineState,
  scheduledEffect: Omit<ScheduledStatusEffect, 'id'>,
): EngineState {
  const record: ScheduledStatusEffect = {
    id: `scheduled-effect-${nextScheduledEffectId++}`,
    ...scheduledEffect,
  }

  const nextState = {
    ...state,
    scheduledEffects: [...state.scheduledEffects, record],
    events: [
      ...state.events,
      {
        type: 'status_effect_scheduled',
        scheduledEffect: record,
      } satisfies EngineEvent,
    ],
  }

  if (
    record.scheduledFor.mode === 'phase' &&
    record.scheduledFor.phase === state.phase
  ) {
    return applyScheduledEffectImmediately(nextState, record)
  }

  return nextState
}

export function releaseScheduledStatusEffects(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const released = state.scheduledEffects.filter((scheduledEffect) =>
    shouldMatchSchedule(scheduledEffect.scheduledFor, triggerEvent),
  )

  let nextState: EngineState = {
    ...state,
    scheduledEffects: state.scheduledEffects.filter(
      (scheduledEffect) => !released.some((candidate) => candidate.id === scheduledEffect.id),
    ),
  }

  for (const scheduledEffect of released) {
    nextState = applyStatusEffect(nextState, scheduledEffect.effect)
    if (scheduledEffect.expiresAt) {
      nextState = {
        ...nextState,
        activeTimedEffects: [
          ...nextState.activeTimedEffects,
          scheduledEffect,
        ],
      }
    }
  }

  return nextState
}

export function expireTimedStatusEffects(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const expired = state.activeTimedEffects.filter((scheduledEffect) =>
    scheduledEffect.expiresAt
      ? shouldMatchSchedule(scheduledEffect.expiresAt, triggerEvent)
      : false,
  )

  let nextState: EngineState = {
    ...state,
    activeTimedEffects: state.activeTimedEffects.filter(
      (scheduledEffect) => !expired.some((candidate) => candidate.id === scheduledEffect.id),
    ),
  }

  for (const scheduledEffect of expired) {
    nextState = removeStatusEffect(nextState, scheduledEffect.effect.id)
  }

  return nextState
}

export function applyStatusEffect(
  state: EngineState,
  effect: TimedStatusEffect,
): EngineState {
  return {
    ...state,
    statusEffects: [...state.statusEffects, effect],
    events: [
      ...state.events,
      {
        type: 'status_effect_applied',
        effect,
      } satisfies EngineEvent,
    ],
  }
}

export function removeStatusEffect(
  state: EngineState,
  effectId: string,
): EngineState {
  const effect = state.statusEffects.find((candidate) => candidate.id === effectId)
  if (!effect) return state

  return {
    ...state,
    statusEffects: state.statusEffects.filter((candidate) => candidate.id !== effectId),
    events: [
      ...state.events,
      {
        type: 'status_effect_expired',
        effect,
      } satisfies EngineEvent,
    ],
  }
}

export function setPlayerPoisonedForPhases(
  state: EngineState,
  input: {
    targetPlayerId: string
    sourcePlayerId?: string
    sourceRoleId?: string
    reason?: string
    startPhase: EnginePhase
    endPhase: EnginePhase
  },
): EngineState {
  return scheduleStatusEffect(state, {
    effect: createTimedStatusEffect({
      type: 'poisoned',
      targetPlayerId: input.targetPlayerId,
      sourcePlayerId: input.sourcePlayerId,
      sourceRoleId: input.sourceRoleId,
      reason: input.reason,
    }),
    scheduledFor: {
      mode: 'phase',
      phase: input.startPhase,
    },
    expiresAt: {
      mode: 'phase',
      phase: input.endPhase,
    },
  })
}

export function setPlayerDrunkForPhases(
  state: EngineState,
  input: {
    targetPlayerId: string
    sourcePlayerId?: string
    sourceRoleId?: string
    reason?: string
    startPhase: EnginePhase
    endPhase: EnginePhase
  },
): EngineState {
  return scheduleStatusEffect(state, {
    effect: createTimedStatusEffect({
      type: 'drunk',
      targetPlayerId: input.targetPlayerId,
      sourcePlayerId: input.sourcePlayerId,
      sourceRoleId: input.sourceRoleId,
      reason: input.reason,
    }),
    scheduledFor: {
      mode: 'phase',
      phase: input.startPhase,
    },
    expiresAt: {
      mode: 'phase',
      phase: input.endPhase,
    },
  })
}

function applyScheduledEffectImmediately(
  state: EngineState,
  scheduledEffect: ScheduledStatusEffect,
): EngineState {
  let nextState: EngineState = {
    ...state,
    scheduledEffects: state.scheduledEffects.filter(
      (candidate) => candidate.id !== scheduledEffect.id,
    ),
  }

  nextState = applyStatusEffect(nextState, scheduledEffect.effect)

  if (scheduledEffect.expiresAt) {
    nextState = {
      ...nextState,
      activeTimedEffects: [...nextState.activeTimedEffects, scheduledEffect],
    }
  }

  return nextState
}

function shouldMatchSchedule(
  schedule:
    | { mode: 'phase'; phase: EnginePhase }
    | { mode: 'trigger'; trigger: TriggerEvent['type']; playerId?: string },
  triggerEvent: TriggerEvent,
): boolean {
  if (schedule.mode === 'phase') {
    return triggerEvent.type === 'phase_started' && triggerEvent.phase === schedule.phase
  }

  return triggerEvent.type === schedule.trigger &&
    (!schedule.playerId || schedule.playerId === triggerEvent.playerId)
}
