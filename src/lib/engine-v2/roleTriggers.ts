import type { EngineEvent, TriggerEvent } from './types'
import type { EngineState } from './state'
import { getPlayer } from './state'
import { getEngineRoleDefinition } from './roles/registry'
import { applyEngineRoleResult, isPlayerMalfunctioning } from './roles/runtime'
import type {
  EngineRoleContext,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
  EngineRoleTrigger,
  EngineRoleTriggerOccurrence,
} from './roles/types'

function normalizePhaseTriggers(
  triggers: EngineRolePhaseTrigger[] | undefined,
): EngineRoleTrigger[] {
  return (triggers ?? []).map((trigger) => ({
    ...trigger,
    event: 'onPhaseStarted',
    scope: {
      subject: 'phase',
      phases: trigger.phases,
    },
  }))
}

function normalizeRoleEntryTriggers(
  triggers: EngineRoleEntryTrigger[] | undefined,
): EngineRoleTrigger[] {
  return (triggers ?? []).map((trigger) => ({
    ...trigger,
    event: 'onRoleEntered',
    scope: trigger.scope ?? { subject: 'self' },
  }))
}

function getAllRoleTriggers(ctx: EngineRoleContext): EngineRoleTrigger[] {
  const definition = getEngineRoleDefinition(ctx.player.roleId)
  if (!definition) {
    return []
  }

  return [
    ...normalizePhaseTriggers(definition.getPhaseTriggers?.(ctx)),
    ...normalizeRoleEntryTriggers(definition.getRoleEntryTriggers?.(ctx)),
    ...(definition.getRoleTriggers?.(ctx) ?? []),
  ]
}

export function getRoleTriggerOccurrenceFromTriggerEvent(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineRoleTriggerOccurrence | null {
  if (triggerEvent.type === 'day_started') {
    return {
      name: 'onDayStarted',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: 'day',
      },
    }
  }

  if (triggerEvent.type === 'nomination_started' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onNominationStarted',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'nomination_locked' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onNominationLocked',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'vote_opened' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onVoteOpened',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'vote_cast' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onVoteCast',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'vote_closed' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onVoteClosed',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'block_updated') {
    if (triggerEvent.playerId) {
      const player = getPlayer(state, triggerEvent.playerId)
      return {
        name: 'onBlockUpdated',
        triggerEvent,
        subject: {
          kind: 'player',
          playerId: triggerEvent.playerId,
          roleId: player?.roleId,
          alignment: player?.alignment,
          phase: state.phase,
        },
      }
    }

    return {
      name: 'onBlockUpdated',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'execution_resolved' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onExecutionResolved',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        cause: 'execution',
        phase: 'execution',
      },
    }
  }

  if (triggerEvent.type === 'execution_skipped') {
    return {
      name: 'onExecutionSkipped',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: 'end_of_day',
      },
    }
  }

  if (triggerEvent.type === 'player_executed' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onPlayerExecuted',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        cause: 'execution',
        phase: 'execution',
      },
    }
  }

  if (triggerEvent.type === 'no_execution') {
    return {
      name: 'onNoExecution',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: 'end_of_day',
      },
    }
  }

  if (triggerEvent.type === 'day_ended') {
    return {
      name: 'onDayEnded',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: 'end_of_day',
      },
    }
  }

  if (triggerEvent.type === 'player_revived' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onPlayerRevived',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'player_role_changed' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onRoleChanged',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'player_alignment_changed' && triggerEvent.playerId) {
    const player = getPlayer(state, triggerEvent.playerId)
    return {
      name: 'onAlignmentChanged',
      triggerEvent,
      subject: {
        kind: 'player',
        playerId: triggerEvent.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (triggerEvent.type === 'phase_started' && triggerEvent.phase) {
    return {
      name: 'onPhaseStarted',
      triggerEvent,
      subject: {
        kind: 'phase',
        phase: triggerEvent.phase,
      },
    }
  }

  return null
}

function toOccurrenceFromEngineEvent(
  state: EngineState,
  event: EngineEvent,
): EngineRoleTriggerOccurrence | null {
  if (event.type === 'player_died') {
    const player = getPlayer(state, event.intent.targetPlayerId)
    return {
      name: 'onPlayerDied',
      engineEvent: event,
      subject: {
        kind: 'player',
        playerId: event.intent.targetPlayerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        cause: event.intent.cause,
        phase: event.intent.phase,
      },
    }
  }

  if (event.type === 'player_revived') {
    const player = getPlayer(state, event.playerId)
    return {
      name: 'onPlayerRevived',
      engineEvent: event,
      subject: {
        kind: 'player',
        playerId: event.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (event.type === 'player_role_changed') {
    const player = getPlayer(state, event.playerId)
    return {
      name: player?.roleId === event.newRoleId ? 'onRoleEntered' : 'onRoleChanged',
      engineEvent: event,
      subject: {
        kind: 'player',
        playerId: event.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  if (event.type === 'player_alignment_changed') {
    const player = getPlayer(state, event.playerId)
    return {
      name: 'onAlignmentChanged',
      engineEvent: event,
      subject: {
        kind: 'player',
        playerId: event.playerId,
        roleId: player?.roleId,
        alignment: player?.alignment,
        phase: state.phase,
      },
    }
  }

  return null
}

function doesTriggerMatch(
  _state: EngineState,
  ctx: EngineRoleContext,
  trigger: EngineRoleTrigger,
  occurrence: EngineRoleTriggerOccurrence,
): boolean {
  if (trigger.event !== occurrence.name) {
    return false
  }

  if (trigger.scope.subject === 'self') {
    return occurrence.subject.kind === 'player' && occurrence.subject.playerId === ctx.player.id
  }

  if (trigger.scope.subject === 'phase') {
    return (
      occurrence.subject.kind === 'phase' &&
      (!trigger.scope.phases || trigger.scope.phases.includes(occurrence.subject.phase))
    )
  }

  if (occurrence.subject.kind !== 'player') {
    return false
  }

  const filter = trigger.scope.playerFilter
  if (!filter) {
    return true
  }

  if (filter.roleIds && (!occurrence.subject.roleId || !filter.roleIds.includes(occurrence.subject.roleId))) {
    return false
  }

  if (filter.alignments && (!occurrence.subject.alignment || !filter.alignments.includes(occurrence.subject.alignment))) {
    return false
  }

  if (filter.deathCauses && (!occurrence.subject.cause || !filter.deathCauses.includes(occurrence.subject.cause))) {
    return false
  }

  if (filter.phases && (!occurrence.subject.phase || !filter.phases.includes(occurrence.subject.phase))) {
    return false
  }

  if (filter.roleTeams) {
    if (!occurrence.subject.roleId) {
      return false
    }
    const subjectDefinition = getEngineRoleDefinition(occurrence.subject.roleId)
    if (
      !subjectDefinition?.roleTeam ||
      !filter.roleTeams.includes(subjectDefinition.roleTeam)
    ) {
      return false
    }
  }

  return true
}

function applyOccurrence(
  state: EngineState,
  occurrence: EngineRoleTriggerOccurrence,
): EngineState {
  let nextState = state

  for (const player of nextState.players) {
    const definition = getEngineRoleDefinition(player.roleId)
    if (
      !definition?.getPhaseTriggers &&
      !definition?.getRoleEntryTriggers &&
      !definition?.getRoleTriggers
    ) {
      continue
    }

    const ctx: EngineRoleContext = { state: nextState, player }
    const triggers = getAllRoleTriggers(ctx)

    for (const trigger of triggers) {
      if (!doesTriggerMatch(nextState, ctx, trigger, occurrence)) {
        continue
      }
      if (trigger.when && !trigger.when({ state: nextState, player }, occurrence)) {
        continue
      }

      if (
        trigger.malfunctionPolicy === 'fail_closed' &&
        isPlayerMalfunctioning(nextState, player.id)
      ) {
        if (trigger.handleMalfunction) {
          nextState = applyEngineRoleResult(
            nextState,
            trigger.handleMalfunction({ state: nextState, player }, occurrence),
          )
        }
        continue
      }

      nextState = applyEngineRoleResult(nextState, trigger.handle({ state: nextState, player }, occurrence))
    }
  }

  return nextState
}

export function processRoleTriggerEvent(
  state: EngineState,
  triggerEvent: TriggerEvent,
): EngineState {
  const occurrence = getRoleTriggerOccurrenceFromTriggerEvent(state, triggerEvent)
  if (!occurrence) {
    return state
  }

  return applyOccurrence(state, occurrence)
}

export function processRoleEngineEvents(
  state: EngineState,
  events: EngineEvent[],
): { state: EngineState; emittedEvents: EngineEvent[] } {
  let nextState = state
  const beforeCount = state.events.length

  for (const event of events) {
    const occurrence = toOccurrenceFromEngineEvent(nextState, event)
    if (!occurrence) {
      continue
    }
    nextState = applyOccurrence(nextState, occurrence)
  }

  return {
    state: nextState,
    emittedEvents: nextState.events.slice(beforeCount),
  }
}
