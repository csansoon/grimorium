import { applyStatusEffect, createTimedStatusEffect, removeStatusEffect, scheduleStatusEffect } from './effects'
import {
  castVote,
  closeVote,
  lockNomination,
  openVote,
  resolveExecution,
  startNomination,
} from './day'
import { revivePlayer } from './revive'
import { runLethalIntent } from './runLethalIntent'
import type { EngineState } from './state'
import { addStorytellerNotice, queueInformation, requestStorytellerChoice } from './state'
import { changePlayerAlignment, changePlayerRole, swapPlayerRoles } from './transformations'
import type {
  DeathCause,
  EngineIntent,
  EnginePhase,
  InformationPacket,
  LethalIntent,
  LethalIntentKind,
  ScheduledStatusEffect,
  StorytellerChoice,
  StorytellerNotice,
  TimedStatusEffect,
} from './types'

let nextIntentId = 1

function createIntentId(prefix: string): string {
  return `${prefix}-${nextIntentId++}`
}

export function createLethalIntent(input: {
  kind: LethalIntentKind
  sourcePlayerId?: string
  targetPlayerId: string
  cause: DeathCause
  phase: EnginePhase
  reason?: string
  bypasses?: LethalIntent['bypasses']
  tags?: string[]
}): LethalIntent {
  return {
    id: createIntentId('lethal'),
    ...input,
  }
}

export function createTimedStatusIntent(input: {
  type: TimedStatusEffect['type']
  targetPlayerId: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason?: string
  expiresAt?: ScheduledStatusEffect['expiresAt']
}): EngineIntent {
  return {
    id: createIntentId('status'),
    kind: 'apply_status',
    effect: createTimedStatusEffect({
      type: input.type,
      targetPlayerId: input.targetPlayerId,
      sourcePlayerId: input.sourcePlayerId,
      sourceRoleId: input.sourceRoleId,
      reason: input.reason,
    }),
    expiresAt: input.expiresAt,
  }
}

export function createStorytellerNoticeIntent(
  notice: Omit<StorytellerNotice, 'id'> & { id?: string },
): EngineIntent {
  return {
    id: notice.id ?? createIntentId('storyteller-notice'),
    kind: 'storyteller_notice',
    notice: {
      ...notice,
      id: notice.id ?? createIntentId('notice'),
    },
  }
}

export function createStorytellerChoiceIntent(
  choice: Omit<StorytellerChoice, 'id' | 'kind'> & { id?: string },
): EngineIntent {
  return {
    id: choice.id ?? createIntentId('storyteller-choice'),
    kind: 'storyteller_choice',
    choice: {
      ...choice,
      id: choice.id ?? createIntentId('choice'),
      kind: 'player_selection',
    },
  }
}

export function createRoleSelectionChoiceIntent(
  choice: Omit<StorytellerChoice, 'id' | 'kind'> & { id?: string },
): EngineIntent {
  return {
    id: choice.id ?? createIntentId('storyteller-role-choice'),
    kind: 'storyteller_choice',
    choice: {
      ...choice,
      id: choice.id ?? createIntentId('role-choice'),
      kind: 'role_selection',
    },
  }
}

export function createBooleanSelectionChoiceIntent(
  choice: Omit<StorytellerChoice, 'id' | 'kind'> & { id?: string },
): EngineIntent {
  return {
    id: choice.id ?? createIntentId('storyteller-boolean-choice'),
    kind: 'storyteller_choice',
    choice: {
      ...choice,
      id: choice.id ?? createIntentId('boolean-choice'),
      kind: 'boolean_selection',
    },
  }
}

export function createNumberSelectionChoiceIntent(
  choice: Omit<StorytellerChoice, 'id' | 'kind'> & { id?: string },
): EngineIntent {
  return {
    id: choice.id ?? createIntentId('storyteller-number-choice'),
    kind: 'storyteller_choice',
    choice: {
      ...choice,
      id: choice.id ?? createIntentId('number-choice'),
      kind: 'number_selection',
    },
  }
}

export function createInformationIntent(
  packet: Omit<InformationPacket, 'id'> & { id?: string },
): EngineIntent {
  return {
    id: packet.id ?? createIntentId('information'),
    kind: 'information',
    packet: {
      ...packet,
      id: packet.id ?? createIntentId('packet'),
    },
  }
}

export function createDayStartNominationIntent(input: {
  nominatorId: string
  nomineeId: string
}): EngineIntent {
  return {
    id: createIntentId('day-start-nomination'),
    kind: 'day_start_nomination',
    ...input,
  }
}

export function createDayLockNominationIntent(input: {
  nominationId: string
}): EngineIntent {
  return {
    id: createIntentId('day-lock-nomination'),
    kind: 'day_lock_nomination',
    ...input,
  }
}

export function createDayOpenVoteIntent(input: {
  nominationId: string
}): EngineIntent {
  return {
    id: createIntentId('day-open-vote'),
    kind: 'day_open_vote',
    ...input,
  }
}

export function createDayCastVoteIntent(input: {
  nominationId: string
  voterId: string
}): EngineIntent {
  return {
    id: createIntentId('day-cast-vote'),
    kind: 'day_cast_vote',
    ...input,
  }
}

export function createDayCloseVoteIntent(input: {
  nominationId: string
}): EngineIntent {
  return {
    id: createIntentId('day-close-vote'),
    kind: 'day_close_vote',
    ...input,
  }
}

export function createDayResolveExecutionIntent(input?: {
  reason?: string
}): EngineIntent {
  return {
    id: createIntentId('day-resolve-execution'),
    kind: 'day_resolve_execution',
    reason: input?.reason,
  }
}

export function createReviveIntent(input: {
  targetPlayerId: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason?: string
  clearStatusEffects?: boolean
  clearTargetModifiers?: boolean
}): EngineIntent {
  return {
    id: createIntentId('revive'),
    kind: 'revive',
    ...input,
  }
}

export function createRoleChangeIntent(input: {
  playerId: string
  newRoleId: string
  reason?: string
}): EngineIntent {
  return {
    id: createIntentId('change-role'),
    kind: 'change_role',
    ...input,
  }
}

export function createAlignmentChangeIntent(input: {
  playerId: string
  newAlignment: 'good' | 'evil'
  reason?: string
}): EngineIntent {
  return {
    id: createIntentId('change-alignment'),
    kind: 'change_alignment',
    ...input,
  }
}

export function createRoleSwapIntent(input: {
  firstPlayerId: string
  secondPlayerId: string
  reason?: string
}): EngineIntent {
  return {
    id: createIntentId('swap-roles'),
    kind: 'swap_roles',
    ...input,
  }
}

export function resolveEngineIntent(
  state: EngineState,
  engineIntent: EngineIntent,
): EngineState {
  switch (engineIntent.kind) {
    case 'lethal':
      return runLethalIntent(state, engineIntent.intent).state

    case 'revive':
      return revivePlayer(state, {
        targetPlayerId: engineIntent.targetPlayerId,
        sourcePlayerId: engineIntent.sourcePlayerId,
        sourceRoleId: engineIntent.sourceRoleId,
        reason: engineIntent.reason,
        clearStatusEffects: engineIntent.clearStatusEffects,
        clearTargetModifiers: engineIntent.clearTargetModifiers,
      })

    case 'apply_status':
      return engineIntent.expiresAt
        ? scheduleStatusEffect(state, {
            effect: engineIntent.effect,
            scheduledFor: {
              mode: 'phase',
              phase: state.phase,
            },
            expiresAt: engineIntent.expiresAt,
          })
        : applyStatusEffect(state, engineIntent.effect)

    case 'remove_status':
      return removeStatusEffect(state, engineIntent.effectId)

    case 'storyteller_notice':
      return addStorytellerNotice(state, engineIntent.notice)

    case 'storyteller_choice':
      return requestStorytellerChoice(state, engineIntent.choice)

    case 'information':
      return queueInformation(state, engineIntent.packet)

    case 'day_start_nomination':
      return startNomination(state, {
        nominatorId: engineIntent.nominatorId,
        nomineeId: engineIntent.nomineeId,
      })

    case 'day_lock_nomination':
      return lockNomination(state, engineIntent.nominationId)

    case 'day_open_vote':
      return openVote(state, engineIntent.nominationId)

    case 'day_cast_vote':
      return castVote(state, {
        nominationId: engineIntent.nominationId,
        voterId: engineIntent.voterId,
      })

    case 'day_close_vote':
      return closeVote(state, engineIntent.nominationId)

    case 'day_resolve_execution':
      return resolveExecution(state, engineIntent.reason)

    case 'change_role':
      return changePlayerRole(state, {
        playerId: engineIntent.playerId,
        newRoleId: engineIntent.newRoleId,
        reason: engineIntent.reason,
      })

    case 'change_alignment':
      return changePlayerAlignment(state, {
        playerId: engineIntent.playerId,
        newAlignment: engineIntent.newAlignment,
        reason: engineIntent.reason,
      })

    case 'swap_roles':
      return swapPlayerRoles(state, {
        firstPlayerId: engineIntent.firstPlayerId,
        secondPlayerId: engineIntent.secondPlayerId,
        reason: engineIntent.reason,
      })
  }
}

export function resolveEngineIntents(
  state: EngineState,
  intents: EngineIntent[],
): EngineState {
  return intents.reduce((currentState, engineIntent) => {
    return resolveEngineIntent(currentState, engineIntent)
  }, state)
}
