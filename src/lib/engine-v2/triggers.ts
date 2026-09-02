import {
  applyStatusEffect,
  removeStatusEffect,
  scheduleStatusEffect,
} from './effects'
import { resolveEngineIntent } from './intents'
import type { EngineState } from './state'
import { removeModifier, updatePlayer } from './state'
import type {
  EngineEvent,
  TriggerEvent,
  TriggerRegistration,
  TriggerSchedule,
} from './types'

let nextTriggerRegistrationId = 1

export function registerTriggerAction(
  state: EngineState,
  registration: Omit<TriggerRegistration, 'id'>,
): EngineState {
  const record: TriggerRegistration = {
    id: `trigger-registration-${nextTriggerRegistrationId++}`,
    ...registration,
  }

  return {
    ...state,
    triggerRegistrations: [...state.triggerRegistrations, record],
    events: [
      ...state.events,
      {
        type: 'trigger_registration_added',
        registration: record,
      } satisfies EngineEvent,
    ],
  }
}

export function releaseTriggerRegistrations(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const { remaining, expired } = partitionExpiredTriggerRegistrations(
    state.triggerRegistrations,
    triggerEvent,
  )
  const matching = remaining.filter((registration) =>
    shouldFireTriggerRegistration(registration, triggerEvent),
  )

  let nextState: EngineState = {
    ...state,
    triggerRegistrations: remaining.filter(
      (registration) =>
        !matching.some((candidate) => shouldConsumeAfterFire(candidate, registration)),
    ),
  }

  for (const registration of expired) {
    nextState = {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'trigger_registration_expired',
          registration,
          triggerEvent,
        },
      ],
    }
  }

  for (const registration of matching) {
    nextState = {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'trigger_registration_fired',
          registration,
          triggerEvent,
        },
      ],
    }
    nextState = applyTriggerAction(nextState, registration)
  }

  return nextState
}

function partitionExpiredTriggerRegistrations(
  registrations: TriggerRegistration[],
  triggerEvent: TriggerEvent,
): {
  remaining: TriggerRegistration[]
  expired: TriggerRegistration[]
} {
  const remaining: TriggerRegistration[] = []
  const expired: TriggerRegistration[] = []

  for (const registration of registrations) {
    if (registration.expiresAt && shouldMatchSchedule(registration.expiresAt, triggerEvent)) {
      expired.push(registration)
      continue
    }

    remaining.push(registration)
  }

  return { remaining, expired }
}

function applyTriggerAction(
  state: EngineState,
  registration: TriggerRegistration,
): EngineState {
  const { action } = registration

  if (action.kind === 'lethal_intent') {
    return resolveEngineIntent(state, {
      id: `trigger-lethal:${registration.id}:${action.intent.id}`,
      kind: 'lethal',
      intent: action.intent,
    })
  }

  if (action.kind === 'apply_status_effect') {
    if (action.expiresAt) {
      return scheduleStatusEffect(state, {
        effect: action.effect,
        scheduledFor: {
          mode: 'phase',
          phase: state.phase,
        },
        expiresAt: action.expiresAt,
      })
    }
    return applyStatusEffect(state, action.effect)
  }

  if (action.kind === 'remove_status_effect') {
    return removeStatusEffect(state, action.effectId)
  }

  if (action.kind === 'remove_modifier') {
    return removeModifier(state, action.modifierId)
  }

  if (action.kind === 'set_note') {
    const nextState = updatePlayer(state, action.playerId, (player) => ({
      ...player,
      notes: {
        ...(player.notes ?? {}),
        [action.key]: action.value,
      },
    }))
    return {
      ...nextState,
      events: [
        ...nextState.events,
        {
          type: 'player_note_set',
          playerId: action.playerId,
          key: action.key,
          value: action.value,
        },
      ],
    }
  }

  const nextState = updatePlayer(state, action.playerId, (player) => {
    const nextNotes = { ...(player.notes ?? {}) }
    delete nextNotes[action.key]
    return {
      ...player,
      notes: Object.keys(nextNotes).length > 0 ? nextNotes : undefined,
    }
  })

  return {
    ...nextState,
    events: [
      ...nextState.events,
      {
        type: 'player_note_cleared',
        playerId: action.playerId,
        key: action.key,
      },
    ],
  }
}

function shouldFireTriggerRegistration(
  registration: TriggerRegistration,
  triggerEvent: TriggerEvent,
): boolean {
  if (registration.trigger.mode === 'phase') {
    return (
      triggerEvent.type === 'phase_started' &&
      triggerEvent.phase === registration.trigger.phase
    )
  }

  return (
    triggerEvent.type === registration.trigger.trigger &&
    (!registration.trigger.playerId ||
      registration.trigger.playerId === triggerEvent.playerId)
  )
}

function shouldConsumeAfterFire(
  candidate: TriggerRegistration,
  registration: TriggerRegistration,
): boolean {
  if (candidate.id !== registration.id) {
    return false
  }

  if (candidate.consumeWhen) {
    return candidate.consumeWhen === 'on_fire'
  }

  return candidate.once !== false
}

function shouldMatchSchedule(
  schedule: TriggerSchedule,
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
